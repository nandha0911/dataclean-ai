import pandas as pd
import numpy as np
from scipy import stats
from models.schemas import AnalysisResult, ColumnAnalysis, QualityScore
from utils.helpers import detect_column_type, is_potential_id_column

class DataAnalyzer:
    def analyze(self, df: pd.DataFrame, dataset_id: int) -> dict:
        total_rows = len(df)
        columns_analysis = []
        correlation_matrix = {}

        # Correlation matrix for numerics
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if len(numeric_cols) > 1:
            corr_df = df[numeric_cols].corr(method='pearson')
            correlation_matrix = corr_df.where(pd.notnull(corr_df), None).to_dict()

        full_row_duplicates = int(df.duplicated().sum())

        for col in df.columns:
            series = df[col]
            missing_count = int(series.isnull().sum())
            missing_pct = (missing_count / total_rows) * 100 if total_rows > 0 else 0
            
            dtype = detect_column_type(series)
            
            # Duplicates count in this column
            dup_count = int(series.duplicated().sum())
            
            outliers_iqr = 0
            outliers_zscore = 0
            skewness = None
            kurtosis = None
            noisy = False
            highly_correlated_with = []
            
            if pd.api.types.is_numeric_dtype(series):
                s_dropna = series.dropna()
                if not s_dropna.empty:
                    # IQR Outliers
                    Q1 = s_dropna.quantile(0.25)
                    Q3 = s_dropna.quantile(0.75)
                    IQR = Q3 - Q1
                    outliers_iqr = int(((s_dropna < (Q1 - 1.5 * IQR)) | (s_dropna > (Q3 + 1.5 * IQR))).sum())
                    
                    # Z-score Outliers
                    z_scores = np.abs(stats.zscore(s_dropna))
                    outliers_zscore = int((z_scores > 3).sum())
                    
                    skewness = float(s_dropna.skew()) if not pd.isna(s_dropna.skew()) else None
                    kurtosis = float(s_dropna.kurt()) if not pd.isna(s_dropna.kurt()) else None
                    
                    if s_dropna.var() > (s_dropna.max() - s_dropna.min()) * 10:
                        noisy = True

            # Highly correlated
            if col in correlation_matrix:
                for other_col, val in correlation_matrix[col].items():
                    if other_col != col and val is not None and abs(val) > 0.8:
                        highly_correlated_with.append(other_col)

            unique_count = series.nunique()
            constant = unique_count <= 1
            unique_identifier = is_potential_id_column(series)
            
            class_imbalance = False
            if dtype == 'categorical' and unique_count > 1 and unique_count < 20:
                counts = series.value_counts(normalize=True)
                if counts.iloc[0] > 0.9: # 90% of data is one class
                    class_imbalance = True

            # ── Inconsistent Categories / Text Repetition Detection ──────────
            inconsistent_categories = None
            is_gender_column = False

            if series.dtype == 'object' or str(series.dtype) == 'category':
                s_str = series.dropna().astype(str)
                cleaned_str = s_str.str.strip().str.lower()

                # Detect gender/sex column with abbreviation inconsistencies
                GENDER_COL_NAMES = {'gender', 'sex', 'genre', 'geslacht'}
                GENDER_VARIANTS = {'m', 'f', 'male', 'female', 'man', 'woman', 'boy', 'girl', 'men', 'women'}
                col_lower = col.strip().lower()
                unique_vals_lower = set(cleaned_str.unique())
                if col_lower in GENDER_COL_NAMES or unique_vals_lower.issubset(GENDER_VARIANTS | {'', 'other', 'unknown', 'na'}):
                    if len(unique_vals_lower) > 1:
                        is_gender_column = True

                # Check if stripping whitespace and unifying casing reduces unique values
                if cleaned_str.nunique() < s_str.nunique():
                    lower_map = {}
                    for orig_val in s_str.unique():
                        norm = orig_val.strip().lower()
                        if norm not in lower_map:
                            lower_map[norm] = []
                        lower_map[norm].append(orig_val)

                    inconsistents = []
                    for norm_val, orig_list in lower_map.items():
                        if len(orig_list) > 1:
                            inconsistents.extend(orig_list)
                    if inconsistents:
                        inconsistent_categories = inconsistents

            col_result = {
                "column_name": col,
                "dtype": dtype,
                "missing_count": missing_count,
                "missing_pct": missing_pct,
                "duplicate_count": dup_count,
                "outliers_iqr": outliers_iqr,
                "outliers_zscore": outliers_zscore,
                "skewness": skewness,
                "kurtosis": kurtosis,
                "constant": constant,
                "unique_identifier": unique_identifier,
                "noisy": noisy,
                "class_imbalance": class_imbalance,
                "highly_correlated_with": highly_correlated_with,
                "possible_incorrect_types": False,
                "inconsistent_categories": inconsistent_categories,
                "is_gender_column": is_gender_column,
                "impossible_values": None
            }
            columns_analysis.append(col_result)

        return {
            "dataset_id": dataset_id,
            "columns": columns_analysis,
            "correlation_matrix": correlation_matrix,
            "full_row_duplicates": full_row_duplicates,
            "quality_score": {}
        }
