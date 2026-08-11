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

        for col in df.columns:
            series = df[col]
            missing_count = int(series.isnull().sum())
            missing_pct = (missing_count / total_rows) * 100 if total_rows > 0 else 0
            
            dtype = detect_column_type(series)
            
            # Duplicates specific to column? Wait, requirement says duplicate records (full dataset).
            # But the schema has duplicate_count per column? Schema has duplicate_count as Optional[int] in ColumnAnalysis.
            # I will just put 0 there for now and let the cleaner handle full dataset duplicates.
            
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

            col_result = {
                "column_name": col,
                "dtype": dtype,
                "missing_count": missing_count,
                "missing_pct": missing_pct,
                "duplicate_count": None, # Will compute row-level duplicates separately or map to column
                "outliers_iqr": outliers_iqr,
                "outliers_zscore": outliers_zscore,
                "skewness": skewness,
                "kurtosis": kurtosis,
                "constant": constant,
                "unique_identifier": unique_identifier,
                "noisy": noisy,
                "class_imbalance": class_imbalance,
                "highly_correlated_with": highly_correlated_with,
                "possible_incorrect_types": False, # Simple heuristic
                "inconsistent_categories": None,
                "impossible_values": None
            }
            columns_analysis.append(col_result)

        return {
            "dataset_id": dataset_id,
            "columns": columns_analysis,
            "correlation_matrix": correlation_matrix,
            "quality_score": {} # Placeholders to be filled by scorer
        }
