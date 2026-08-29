import pandas as pd
import numpy as np
import re
import unicodedata
import hashlib
import difflib
from sklearn.impute import KNNImputer
from sklearn.experimental import enable_iterative_imputer
from sklearn.impute import IterativeImputer
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import RobustScaler, StandardScaler, MinMaxScaler, LabelEncoder, OrdinalEncoder, PowerTransformer, QuantileTransformer, MaxAbsScaler
from sklearn.neighbors import LocalOutlierFactor
from imblearn.over_sampling import SMOTE
from scipy import stats

class DataCleaner:
    def mean_imputation(self, df: pd.DataFrame, column: str):
        try:
            if column in df.columns:
                df[column] = df[column].replace(['NULL', 'null', 'None', 'none', 'NaN', 'nan', 'N/A', 'n/a', 'NA', 'na', '?', '-', ''], np.nan)
                num = pd.to_numeric(df[column], errors='coerce')
                val = num.mean()
                if pd.notna(val):
                    val = int(round(val)) if (num.dropna() % 1 == 0).all() else round(val, 2)
                    df[column] = num.fillna(val)
        except: pass
        return df

    def median_imputation(self, df: pd.DataFrame, column: str):
        try:
            if column in df.columns:
                df[column] = df[column].replace(['NULL', 'null', 'None', 'none', 'NaN', 'nan', 'N/A', 'n/a', 'NA', 'na', '?', '-', ''], np.nan)
                num = pd.to_numeric(df[column], errors='coerce')
                val = num.median()
                if pd.notna(val):
                    val = int(round(val)) if (num.dropna() % 1 == 0).all() else round(val, 2)
                    df[column] = num.fillna(val)
        except: pass
        return df

    def mode_imputation(self, df: pd.DataFrame, column: str):
        try:
            if column in df.columns:
                df[column] = df[column].replace(['NULL', 'null', 'None', 'none', 'NaN', 'nan', 'N/A', 'n/a', 'NA', 'na', '?', '-', ''], np.nan)
                valid = df[column].dropna()
                if not valid.empty:
                    modes = valid.mode()
                    if not modes.empty:
                        df[column] = df[column].fillna(modes.iloc[0])
        except: pass
        return df

    def knn_imputation(self, df: pd.DataFrame, columns: list, k: int=5):
        try:
            cols = [c for c in columns if c in df.columns]
            num_cols = [c for c in cols if pd.api.types.is_numeric_dtype(df[c])]
            if num_cols:
                imputer = KNNImputer(n_neighbors=min(k, len(df)-1))
                df[num_cols] = imputer.fit_transform(df[num_cols])
        except: pass
        return df

    def mice_imputation(self, df: pd.DataFrame, columns: list):
        try:
            cols = [c for c in columns if c in df.columns]
            num_cols = [c for c in cols if pd.api.types.is_numeric_dtype(df[c])]
            if num_cols:
                imputer = IterativeImputer(random_state=42)
                df[num_cols] = imputer.fit_transform(df[num_cols])
        except: pass
        return df

    def forward_fill(self, df: pd.DataFrame, column: str):
        try:
            df[column] = df[column].ffill()
        except: pass
        return df

    def backward_fill(self, df: pd.DataFrame, column: str):
        try:
            df[column] = df[column].bfill()
        except: pass
        return df

    def interpolation(self, df: pd.DataFrame, column: str, method: str='linear'):
        try:
            df[column].interpolate(method=method, inplace=True)
        except: pass
        return df

    def delete_rows_with_missing(self, df: pd.DataFrame, column: str):
        try:
            df.dropna(subset=[column], inplace=True)
            df.reset_index(drop=True, inplace=True)
        except: pass
        return df

    def delete_column(self, df: pd.DataFrame, column: str):
        try:
            df.drop(columns=[column], inplace=True, errors='ignore')
        except: pass
        return df

    def zscore_outlier_removal(self, df: pd.DataFrame, column: str, threshold: float=3.0):
        try:
            if not df[column].isnull().all():
                z = np.abs(stats.zscore(df[column].dropna()))
                outlier_indices = df[column].dropna().index[z > threshold]
                df.drop(outlier_indices, inplace=True)
                df.reset_index(drop=True, inplace=True)
        except: pass
        return df

    def iqr_outlier_removal(self, df: pd.DataFrame, column: str):
        try:
            Q1 = df[column].quantile(0.25)
            Q3 = df[column].quantile(0.75)
            IQR = Q3 - Q1
            filter_mask = (df[column] >= Q1 - 1.5 * IQR) & (df[column] <= Q3 + 1.5 * IQR)
            df = df[filter_mask | df[column].isnull()].copy()
            df.reset_index(drop=True, inplace=True)
        except: pass
        return df

    def winsorization(self, df: pd.DataFrame, column: str, limits: list=[0.05, 0.05]):
        try:
            if not df[column].isnull().all():
                non_nulls = df[column].dropna()
                winsorized = stats.mstats.winsorize(non_nulls, limits=limits)
                df.loc[non_nulls.index, column] = winsorized
        except: pass
        return df

    def isolation_forest_outlier(self, df: pd.DataFrame, columns: list):
        try:
            clf = IsolationForest(random_state=42, contamination=0.05)
            subset = df[columns].dropna()
            if not subset.empty:
                preds = clf.fit_predict(subset)
                df = df.loc[df.index.isin(subset.index[preds == 1]) | df[columns].isnull().any(axis=1)].copy()
                df.reset_index(drop=True, inplace=True)
        except: pass
        return df

    def _safe_numeric_cols(self, df: pd.DataFrame, columns: list) -> list:
        """Filter out ID-like columns that should not be scaled."""
        safe = []
        for c in columns:
            if c not in df.columns:
                continue
            cl = str(c).lower()
            # Skip ID/order columns
            if any(k in cl for k in ['_id', 'order_id', 'ref', 'key', 'uid', 'uuid']):
                continue
            if pd.api.types.is_numeric_dtype(df[c]) and df[c].nunique() > 1:
                safe.append(c)
        return safe

    def robust_scaling(self, df: pd.DataFrame, columns: list):
        try:
            cols = self._safe_numeric_cols(df, columns if isinstance(columns, list) else [columns])
            if cols:
                scaler = RobustScaler()
                df[cols] = scaler.fit_transform(df[cols])
        except: pass
        return df

    def standard_scaling(self, df: pd.DataFrame, columns: list):
        try:
            cols = self._safe_numeric_cols(df, columns if isinstance(columns, list) else [columns])
            if cols:
                scaler = StandardScaler()
                df[cols] = scaler.fit_transform(df[cols])
        except: pass
        return df

    def minmax_scaling(self, df: pd.DataFrame, columns: list):
        try:
            cols = self._safe_numeric_cols(df, columns if isinstance(columns, list) else [columns])
            if cols:
                scaler = MinMaxScaler()
                df[cols] = scaler.fit_transform(df[cols])
        except: pass
        return df

    def one_hot_encoding(self, df: pd.DataFrame, column: str):
        try:
            df = pd.get_dummies(df, columns=[column], drop_first=True)
        except: pass
        return df

    def label_encoding(self, df: pd.DataFrame, column: str):
        try:
            le = LabelEncoder()
            mask = df[column].notnull()
            df.loc[mask, column] = le.fit_transform(df.loc[mask, column])
        except: pass
        return df

    def ordinal_encoding(self, df: pd.DataFrame, column: str, order: list):
        try:
            mapping = {val: i for i, val in enumerate(order)}
            df[column] = df[column].map(mapping)
        except: pass
        return df

    def log_transformation(self, df: pd.DataFrame, column: str):
        try:
            df[column] = np.log1p(df[column] - df[column].min() + 1)
        except: pass
        return df

    def power_transformation(self, df: pd.DataFrame, column: str, method: str='yeo-johnson'):
        try:
            pt = PowerTransformer(method=method)
            mask = df[column].notnull()
            df.loc[mask, column] = pt.fit_transform(df.loc[mask, [column]])
        except: pass
        return df

    def smote_oversample(self, df: pd.DataFrame, target: str):
        try:
            df.dropna(subset=[target], inplace=True)
            X = df.drop(columns=[target])
            y = df[target]
            
            # very simple imputation for SMOTE
            X_num = X.select_dtypes(include=[np.number])
            X_num.fillna(X_num.mean(), inplace=True)
            
            smote = SMOTE(random_state=42)
            X_res, y_res = smote.fit_resample(X_num, y)
            df_res = pd.concat([pd.DataFrame(X_res, columns=X_num.columns), pd.Series(y_res, name=target)], axis=1)
            return df_res
        except: pass
        return df

    def duplicate_removal(self, df: pd.DataFrame, column: str = None):
        try:
            if column and column != 'dataset' and column in df.columns:
                df.drop_duplicates(subset=[column], keep='first', inplace=True)
            else:
                # If dataset has an ID column, remove duplicates based on matching entity features (e.g. Same Name, Age, Email, Salary)
                non_id_cols = [c for c in df.columns if not any(id_kw in str(c).lower() for id_kw in ['customer_id', 'user_id', 'id', 'uuid', 'index', 'key', 'seq', 'row_id'])]
                if non_id_cols and len(non_id_cols) >= 2:
                    df.drop_duplicates(subset=non_id_cols, keep='first', inplace=True)
                else:
                    df.drop_duplicates(keep='first', inplace=True)
            df.reset_index(drop=True, inplace=True)
        except: pass
        return df

    def standardize_text(self, df: pd.DataFrame, column: str):
        try:
            if column in df.columns:
                mask = df[column].notnull()
                df.loc[mask, column] = df.loc[mask, column].astype(str).str.strip().str.title()
                df[column].replace({'Nan': None, 'None': None, 'Null': None, '': None, 'nan': None}, inplace=True)
        except: pass
        return df

    def standardize_gender(self, df: pd.DataFrame, column: str):
        try:
            GENDER_MAP = {
                'm': 'Male', 'male': 'Male', 'man': 'Male', 'men': 'Male',
                'boy': 'Male', 'boys': 'Male', 'gents': 'Male', 'gentleman': 'Male',
                'm.': 'Male', 'mal': 'Male', '1': 'Male',
                'f': 'Female', 'female': 'Female', 'woman': 'Female', 'women': 'Female',
                'girl': 'Female', 'girls': 'Female', 'lady': 'Female', 'ladies': 'Female',
                'f.': 'Female', 'fem': 'Female', '0': 'Female',
                'unknown': 'Unknown', 'other': 'Other', 'na': None, 'n/a': None,
                'none': None, 'null': None, 'nan': None, '': None,
            }
            if column in df.columns:
                df[column] = df[column].apply(
                    lambda x: GENDER_MAP.get(str(x).strip().lower(), str(x).strip().title())
                    if pd.notnull(x) and str(x).strip() != '' else x
                )
        except: pass
        return df

    # B. Missing Data
    def constant_imputation(self, df: pd.DataFrame, column: str, value=None):
        try:
            if column not in df.columns:
                return df
            # If no value specified, infer a safe default: median for numeric, mode for categorical
            if value is None:
                num = pd.to_numeric(df[column], errors='coerce')
                if not num.dropna().empty:
                    value = num.median()
                else:
                    modes = df[column].dropna().mode()
                    value = modes.iloc[0] if not modes.empty else 'Unknown'
            df[column] = df[column].fillna(value)
        except: pass
        return df

    def rolling_average_imputation(self, df: pd.DataFrame, column: str, window=3):
        try:
            df[column] = df[column].fillna(df[column].rolling(window=window, min_periods=1, center=True).mean())
        except: pass
        return df

    def missing_indicator(self, df: pd.DataFrame, column: str):
        try:
            df[f"{column}_was_missing"] = df[column].isnull().astype(int)
        except: pass
        return df

    def listwise_deletion(self, df: pd.DataFrame):
        try:
            df.dropna(inplace=True)
            df.reset_index(drop=True, inplace=True)
        except: pass
        return df

    # C. Duplicates
    def fuzzy_deduplication(self, df: pd.DataFrame, column: str, threshold=90):
        try:
            from difflib import SequenceMatcher
            def similar(a, b):
                return SequenceMatcher(None, str(a), str(b)).ratio() * 100

            unique_vals = df[column].dropna().unique()
            mapping = {}
            for i, val in enumerate(unique_vals):
                if val in mapping:
                    continue
                mapping[val] = val
                for other_val in unique_vals[i+1:]:
                    if other_val not in mapping and similar(val, other_val) >= threshold:
                        mapping[other_val] = val
            df[column] = df[column].replace(mapping)
            df.drop_duplicates(inplace=True)
            df.reset_index(drop=True, inplace=True)
        except: pass
        return df

    def keep_first_occurrence(self, df: pd.DataFrame):
        try:
            df.drop_duplicates(keep='first', inplace=True)
            df.reset_index(drop=True, inplace=True)
        except: pass
        return df

    def keep_last_occurrence(self, df: pd.DataFrame):
        try:
            df.drop_duplicates(keep='last', inplace=True)
            df.reset_index(drop=True, inplace=True)
        except: pass
        return df

    # D. Data Types
    def auto_type_cast(self, df: pd.DataFrame, column: str):
        try:
            df[column] = pd.to_numeric(df[column], errors='ignore')
            if df[column].dtype == object:
                # check if boolean
                unique_vals = set(df[column].dropna().astype(str).str.lower())
                if unique_vals.issubset({'true', 'false', '1', '0', 'yes', 'no'}):
                    return self.boolean_conversion(df, column)
                df[column] = pd.to_datetime(df[column], errors='ignore')
        except: pass
        return df

    def boolean_conversion(self, df: pd.DataFrame, column: str):
        try:
            bool_map = {'yes': True, 'no': False, 'true': True, 'false': False, '1': True, '0': False}
            df[column] = df[column].astype(str).str.lower().map(bool_map)
        except: pass
        return df

    def datetime_conversion(self, df: pd.DataFrame, column: str):
        try:
            df[column] = pd.to_datetime(df[column], errors='coerce')
        except: pass
        return df

    def category_conversion(self, df: pd.DataFrame, column: str):
        try:
            df[column] = df[column].astype('category')
        except: pass
        return df

    # E. Numerical
    def clip_values(self, df: pd.DataFrame, column: str, lower=None, upper=None):
        try:
            df[column] = df[column].clip(lower=lower, upper=upper)
        except: pass
        return df

    def round_values(self, df: pd.DataFrame, column: str, decimals=2):
        try:
            df[column] = df[column].round(decimals)
        except: pass
        return df

    def decimal_correction(self, df: pd.DataFrame, column: str, decimals=2):
        try:
            df[column] = df[column].round(decimals)
        except: pass
        return df

    def remove_negative_values(self, df: pd.DataFrame, column: str):
        try:
            df.loc[df[column] < 0, column] = np.nan
        except: pass
        return df

    def remove_zero_values(self, df: pd.DataFrame, column: str):
        try:
            df.loc[df[column] == 0, column] = np.nan
        except: pass
        return df

    # F. Outliers
    def mad_outlier_removal(self, df: pd.DataFrame, column: str, threshold=3.5):
        try:
            median = df[column].median()
            mad = np.median(np.abs(df[column].dropna() - median))
            if mad != 0:
                outliers = np.abs(df[column] - median) / mad > threshold
                df.loc[outliers, column] = np.nan
        except: pass
        return df

    def modified_zscore_removal(self, df: pd.DataFrame, column: str, threshold=3.5):
        try:
            median = df[column].median()
            mad = np.median(np.abs(df[column].dropna() - median))
            if mad != 0:
                mod_z = 0.6745 * (df[column] - median) / mad
                outliers = np.abs(mod_z) > threshold
                df.loc[outliers, column] = np.nan
        except: pass
        return df

    def lof_outlier_removal(self, df: pd.DataFrame, columns: list):
        try:
            lof = LocalOutlierFactor()
            subset = df[columns].dropna()
            if not subset.empty:
                preds = lof.fit_predict(subset)
                outliers = subset.index[preds == -1]
                df.drop(outliers, inplace=True)
                df.reset_index(drop=True, inplace=True)
        except: pass
        return df

    def percentile_capping(self, df: pd.DataFrame, column: str, lower_pct=5, upper_pct=95):
        try:
            lower = df[column].quantile(lower_pct / 100.0)
            upper = df[column].quantile(upper_pct / 100.0)
            df[column] = df[column].clip(lower=lower, upper=upper)
        except: pass
        return df

    # G. Categorical
    def merge_rare_categories(self, df: pd.DataFrame, column: str, threshold=0.01, replace_with='Other'):
        try:
            if column in df.columns:
                counts = df[column].value_counts(normalize=True)
                rare_cats = set(counts[counts < threshold].index)
                if rare_cats:
                    df[column] = df[column].apply(lambda x: replace_with if x in rare_cats else x)
        except Exception:
            pass
        return df
        
    def map_categories(self, df: pd.DataFrame, column: str, mapping_dict: dict):
        try:
            df[column] = df[column].map(mapping_dict).fillna(df[column])
        except: pass
        return df

    def unknown_category_fill(self, df: pd.DataFrame, column: str, fill_value='Unknown'):
        try:
            if df[column].dtype.name == 'category' and fill_value not in df[column].cat.categories:
                df[column] = df[column].cat.add_categories([fill_value])
            df[column].fillna(fill_value, inplace=True)
        except: pass
        return df

    # H. Text
    def remove_html_tags(self, df: pd.DataFrame, column: str):
        try:
            df[column] = df[column].astype(str).apply(lambda x: re.sub(r'<[^>]+>', '', x) if pd.notnull(x) else x)
        except: pass
        return df
        
    def remove_urls(self, df: pd.DataFrame, column: str):
        try:
            df[column] = df[column].astype(str).apply(lambda x: re.sub(r'http\S+|www.\S+', '', x) if pd.notnull(x) else x)
        except: pass
        return df
        
    def remove_emails(self, df: pd.DataFrame, column: str):
        try:
            df[column] = df[column].astype(str).apply(lambda x: re.sub(r'\S+@\S+', '', x) if pd.notnull(x) else x)
        except: pass
        return df
        
    def unicode_normalize(self, df: pd.DataFrame, column: str):
        try:
            df[column] = df[column].astype(str).apply(lambda x: unicodedata.normalize('NFKC', x) if pd.notnull(x) else x)
        except: pass
        return df
        
    def fix_encoding(self, df: pd.DataFrame, column: str):
        try:
            df[column] = df[column].astype(str).apply(lambda x: x.encode('utf-8', 'ignore').decode('utf-8') if pd.notnull(x) else x)
        except: pass
        return df
        
    def remove_punctuation(self, df: pd.DataFrame, column: str):
        try:
            df[column] = df[column].astype(str).str.replace(r'[^\w\s]', '', regex=True)
        except: pass
        return df
        
    def remove_special_characters(self, df: pd.DataFrame, column: str):
        try:
            df[column] = df[column].astype(str).apply(lambda x: re.sub(r'[^a-zA-Z0-9\s]', '', x) if pd.notnull(x) else x)
        except: pass
        return df
        
    def lowercase_conversion(self, df: pd.DataFrame, column: str):
        try:
            df[column] = df[column].astype(str).str.lower()
        except: pass
        return df
        
    def uppercase_conversion(self, df: pd.DataFrame, column: str):
        try:
            df[column] = df[column].astype(str).str.upper()
        except: pass
        return df
        
    def strip_whitespace(self, df: pd.DataFrame, column: str):
        try:
            df[column] = df[column].astype(str).str.strip()
            df[column] = df[column].apply(lambda x: re.sub(r'\s+', ' ', x) if pd.notnull(x) else x)
        except: pass
        return df
        
    def remove_extra_spaces(self, df: pd.DataFrame, column: str):
        try:
            df[column] = df[column].astype(str).apply(lambda x: re.sub(r'\s+', ' ', x).strip() if pd.notnull(x) else x)
        except: pass
        return df

    # I. Date/Time
    def parse_dates(self, df: pd.DataFrame, column: str):
        try:
            df[column] = pd.to_datetime(df[column], errors='coerce')
        except: pass
        return df
        
    def standardize_date_format(self, df: pd.DataFrame, column: str, fmt='%Y-%m-%d'):
        try:
            df[column] = pd.to_datetime(df[column], errors='coerce').dt.strftime(fmt)
        except: pass
        return df
        
    def extract_year(self, df: pd.DataFrame, column: str):
        try:
            df[f"{column}_year"] = pd.to_datetime(df[column], errors='coerce').dt.year
        except: pass
        return df
        
    def extract_month(self, df: pd.DataFrame, column: str):
        try:
            df[f"{column}_month"] = pd.to_datetime(df[column], errors='coerce').dt.month
        except: pass
        return df
        
    def extract_day(self, df: pd.DataFrame, column: str):
        try:
            df[f"{column}_day"] = pd.to_datetime(df[column], errors='coerce').dt.day
        except: pass
        return df
        
    def extract_day_of_week(self, df: pd.DataFrame, column: str):
        try:
            df[f"{column}_dayofweek"] = pd.to_datetime(df[column], errors='coerce').dt.dayofweek
        except: pass
        return df

    # O. Transformation
    def sqrt_transformation(self, df: pd.DataFrame, column: str):
        try:
            min_val = df[column].min()
            if min_val < 0:
                df[column] = np.sqrt(df[column] - min_val)
            else:
                df[column] = np.sqrt(df[column])
        except: pass
        return df
        
    def quantile_transformation(self, df: pd.DataFrame, columns: list):
        try:
            qt = QuantileTransformer()
            df[columns] = qt.fit_transform(df[columns])
        except: pass
        return df
        
    def binning(self, df: pd.DataFrame, column: str, bins=5, labels=None):
        try:
            if labels is not None:
                df[f"{column}_binned"] = pd.cut(df[column], bins=bins, labels=labels)
            else:
                df[f"{column}_binned"] = pd.cut(df[column], bins=bins)
        except: pass
        return df
        
    def discretize(self, df: pd.DataFrame, column: str, bins=5):
        try:
            df[f"{column}_discrete"] = pd.qcut(df[column], q=bins, duplicates='drop')
        except: pass
        return df
        
    def max_abs_scaling(self, df: pd.DataFrame, columns: list):
        try:
            scaler = MaxAbsScaler()
            df[columns] = scaler.fit_transform(df[columns])
        except: pass
        return df

    # Q. Imbalanced
    def random_oversample(self, df: pd.DataFrame, target: str):
        try:
            max_size = df[target].value_counts().max()
            lst = [df]
            for class_index, group in df.groupby(target):
                lst.append(group.sample(max_size-len(group), replace=True))
            df = pd.concat(lst).sample(frac=1).reset_index(drop=True)
        except: pass
        return df
        
    def random_undersample(self, df: pd.DataFrame, target: str):
        try:
            min_size = df[target].value_counts().min()
            lst = []
            for class_index, group in df.groupby(target):
                lst.append(group.sample(min_size, replace=False))
            df = pd.concat(lst).sample(frac=1).reset_index(drop=True)
        except: pass
        return df

    # R. Noise
    def moving_average_smooth(self, df: pd.DataFrame, column: str, window=3):
        try:
            df[column] = df[column].rolling(window=window, min_periods=1, center=True).mean()
        except: pass
        return df
        
    def rolling_median_smooth(self, df: pd.DataFrame, column: str, window=3):
        try:
            df[column] = df[column].rolling(window=window, min_periods=1, center=True).median()
        except: pass
        return df

    # T. Encoding
    def frequency_encoding(self, df: pd.DataFrame, column: str):
        try:
            freq = df[column].value_counts()
            df[column] = df[column].map(freq)
        except: pass
        return df
        
    def target_encoding(self, df: pd.DataFrame, column: str, target: str):
        try:
            means = df.groupby(column)[target].mean()
            df[column] = df[column].map(means)
        except: pass
        return df
        
    def binary_encoding(self, df: pd.DataFrame, column: str):
        try:
            unique_vals = df[column].dropna().unique()
            val_to_int = {val: i for i, val in enumerate(unique_vals)}
            max_bin_len = max(1, len(bin(len(unique_vals) - 1)) - 2)
            
            def to_bin(val):
                if pd.isnull(val):
                    return [np.nan] * max_bin_len
                b = bin(val_to_int[val])[2:].zfill(max_bin_len)
                return [int(x) for x in b]
            
            bin_df = pd.DataFrame(df[column].apply(to_bin).tolist(), index=df.index, columns=[f"{column}_bin_{i}" for i in range(max_bin_len)])
            df = pd.concat([df.drop(columns=[column]), bin_df], axis=1)
        except: pass
        return df

    # V. Privacy
    def mask_data(self, df: pd.DataFrame, column: str, mask_char='*', keep_last=4):
        try:
            def mask_str(s):
                s = str(s)
                if len(s) <= keep_last:
                    return s
                return mask_char * (len(s) - keep_last) + s[-keep_last:]
            df[column] = df[column].apply(lambda x: mask_str(x) if pd.notnull(x) else x)
        except: pass
        return df
        
    def remove_pii(self, df: pd.DataFrame, columns: list):
        try:
            df.drop(columns=columns, inplace=True, errors='ignore')
        except: pass
        return df
        
    def pseudonymize(self, df: pd.DataFrame, column: str):
        try:
            df[column] = df[column].apply(lambda x: hashlib.md5(str(x).encode()).hexdigest() if pd.notnull(x) else x)
        except: pass
        return df

    # W. Time-series
    def remove_duplicate_timestamps(self, df: pd.DataFrame, timestamp_col: str):
        try:
            df.drop_duplicates(subset=[timestamp_col], inplace=True)
            df.reset_index(drop=True, inplace=True)
        except: pass
        return df

    def apply_cleaning_plan(self, df: pd.DataFrame, operations_list: list) -> tuple:
        df_clean = df.copy()
        report = []
        for op in operations_list:
            col = op.get('column')
            raw_action = str(op.get('operation') or op.get('technique') or '')
            action = raw_action.lower().replace(' ', '_').replace('-', '_')
            params = op.get('params', {})
            try:
                # Existing
                if action in ["mean_imputation", "mean"]:
                    df_clean = self.mean_imputation(df_clean, col)
                elif action in ["median_imputation", "median"]:
                    df_clean = self.median_imputation(df_clean, col)
                elif action in ["mode_imputation", "mode"]:
                    df_clean = self.mode_imputation(df_clean, col)
                elif action in ["knn_imputation", "knn"]:
                    df_clean = self.knn_imputation(df_clean, [col] if isinstance(col, str) else col, **params)
                elif action in ["mice_imputation", "mice"]:
                    df_clean = self.mice_imputation(df_clean, [col] if isinstance(col, str) else col)
                elif action in ["forward_fill", "ffill"]:
                    df_clean = self.forward_fill(df_clean, col)
                elif action in ["backward_fill", "bfill"]:
                    df_clean = self.backward_fill(df_clean, col)
                elif action in ["interpolation", "interpolate"]:
                    df_clean = self.interpolation(df_clean, col, **params)
                elif action in ["delete_rows_with_missing", "drop_missing", "delete_missing"]:
                    df_clean = self.delete_rows_with_missing(df_clean, col)
                elif action in ["delete_column", "drop_column", "delete_col", "delete_column_(id_column)", "delete_column_id_column", "delete_column_(id)", "delete_id_column", "delete_column_id"]:
                    df_clean = self.delete_column(df_clean, col)
                elif action in ["z_score_outlier_removal", "zscore_outlier_removal", "zscore"]:
                    df_clean = self.zscore_outlier_removal(df_clean, col, **params)
                elif action in ["iqr_outlier_removal", "iqr_outlier", "iqr"]:
                    df_clean = self.iqr_outlier_removal(df_clean, col)
                elif action in ["winsorization", "winsorize"]:
                    df_clean = self.winsorization(df_clean, col, **params)
                elif action in ["isolation_forest", "iso_forest"]:
                    df_clean = self.isolation_forest_outlier(df_clean, [col] if isinstance(col, str) else col)
                elif action in ["robust_scaling", "robust_scale"]:
                    df_clean = self.robust_scaling(df_clean, [col] if isinstance(col, str) else col)
                elif action in ["standard_scaling", "standard_scale"]:
                    df_clean = self.standard_scaling(df_clean, [col] if isinstance(col, str) else col)
                elif action in ["minmax_scaling", "minmax_scale"]:
                    df_clean = self.minmax_scaling(df_clean, [col] if isinstance(col, str) else col)
                elif action in ["one_hot_encoding", "onehot", "one_hot"]:
                    df_clean = self.one_hot_encoding(df_clean, col)
                elif action in ["label_encoding", "label_encode"]:
                    df_clean = self.label_encoding(df_clean, col)
                elif action in ["ordinal_encoding", "ordinal_encode"]:
                    df_clean = self.ordinal_encoding(df_clean, col, **params)
                elif action in ["log_transformation", "log_transform", "log"]:
                    df_clean = self.log_transformation(df_clean, col)
                elif action in ["power_transformation", "power_transform"]:
                    df_clean = self.power_transformation(df_clean, col, **params)
                elif action in ["smote", "smote_oversample"]:
                    df_clean = self.smote_oversample(df_clean, col)
                elif action in ["duplicate_removal", "duplicate_row_removal", "remove_duplicates", "drop_duplicates", "deduplicate", "deduplication", "remove_duplicate_rows"]:
                    df_clean = self.duplicate_removal(df_clean, col if col != 'dataset' else None)
                elif action in ["text_standardization", "standardize_text", "trim_whitespace", "title_case", "clean_text"]:
                    df_clean = self.standardize_text(df_clean, col)
                elif action in ["gender_standardization", "standardize_gender", "fix_gender", "normalize_gender"]:
                    df_clean = self.standardize_gender(df_clean, col)
                
                # B. Missing Data
                elif action in ["constant_imputation", "constant_fill", "fill_constant"]:
                    df_clean = self.constant_imputation(df_clean, col, **params)
                elif action in ["rolling_average_imputation", "rolling_mean", "rolling_average"]:
                    df_clean = self.rolling_average_imputation(df_clean, col, **params)
                elif action in ["missing_indicator", "add_missing_indicator", "was_missing"]:
                    df_clean = self.missing_indicator(df_clean, col)
                elif action in ["listwise_deletion", "drop_all_missing", "dropna"]:
                    df_clean = self.listwise_deletion(df_clean)
                
                # C. Duplicates
                elif action in ["fuzzy_deduplication", "fuzzy_dedup", "fuzzy_duplicates", "fuzzy_duplicate_detection"]:
                    df_clean = self.fuzzy_deduplication(df_clean, col, **params)
                elif action in ["keep_first_occurrence", "keep_first", "first_duplicate"]:
                    df_clean = self.keep_first_occurrence(df_clean)
                elif action in ["keep_last_occurrence", "keep_last", "last_duplicate"]:
                    df_clean = self.keep_last_occurrence(df_clean)
                
                # D. Data Types
                elif action in ["auto_type_cast", "auto_cast", "type_cast"]:
                    df_clean = self.auto_type_cast(df_clean, col)
                elif action in ["boolean_conversion", "to_bool", "convert_bool"]:
                    df_clean = self.boolean_conversion(df_clean, col)
                elif action in ["datetime_conversion", "to_datetime", "convert_datetime"]:
                    df_clean = self.datetime_conversion(df_clean, col)
                elif action in ["category_conversion", "to_category", "convert_category"]:
                    df_clean = self.category_conversion(df_clean, col)
                
                # E. Numerical
                elif action in ["clip_values", "clip", "limit_values"]:
                    df_clean = self.clip_values(df_clean, col, **params)
                elif action in ["round_values", "round", "round_decimals"]:
                    df_clean = self.round_values(df_clean, col, **params)
                elif action in ["decimal_correction", "correct_decimals", "fix_decimals"]:
                    df_clean = self.decimal_correction(df_clean, col, **params)
                elif action in ["remove_negative_values", "remove_negatives", "drop_negatives"]:
                    df_clean = self.remove_negative_values(df_clean, col)
                elif action in ["remove_zero_values", "remove_zeros", "drop_zeros"]:
                    df_clean = self.remove_zero_values(df_clean, col)
                
                # F. Outliers
                elif action in ["mad_outlier_removal", "mad_outliers", "mad_removal"]:
                    df_clean = self.mad_outlier_removal(df_clean, col, **params)
                elif action in ["modified_zscore_removal", "modified_zscore", "mod_zscore"]:
                    df_clean = self.modified_zscore_removal(df_clean, col, **params)
                elif action in ["lof_outlier_removal", "lof", "local_outlier_factor"]:
                    df_clean = self.lof_outlier_removal(df_clean, [col] if isinstance(col, str) else col)
                elif action in ["percentile_capping", "cap_percentiles", "percentile_clip"]:
                    df_clean = self.percentile_capping(df_clean, col, **params)
                
                # G. Categorical
                elif action in ["merge_rare_categories", "merge_rare", "group_rare", "rare_category_grouping", "rare_category_group", "rare_categories", "rare_category"]:
                    df_clean = self.merge_rare_categories(df_clean, col, **params)
                elif action in ["map_categories", "map_cats", "apply_mapping"]:
                    df_clean = self.map_categories(df_clean, col, **params)
                elif action in ["unknown_category_fill", "fill_unknown", "category_fill_unknown"]:
                    df_clean = self.unknown_category_fill(df_clean, col, **params)
                
                # H. Text
                elif action in ["remove_html_tags", "strip_html", "clean_html"]:
                    df_clean = self.remove_html_tags(df_clean, col)
                elif action in ["remove_urls", "strip_urls", "clean_urls"]:
                    df_clean = self.remove_urls(df_clean, col)
                elif action in ["remove_emails", "strip_emails", "clean_emails"]:
                    df_clean = self.remove_emails(df_clean, col)
                elif action in ["unicode_normalize", "normalize_unicode", "unicode_fix"]:
                    df_clean = self.unicode_normalize(df_clean, col)
                elif action in ["fix_encoding", "encode_utf8", "clean_encoding"]:
                    df_clean = self.fix_encoding(df_clean, col)
                elif action in ["remove_punctuation", "strip_punctuation", "clean_punctuation"]:
                    df_clean = self.remove_punctuation(df_clean, col)
                elif action in ["remove_special_characters", "strip_special", "clean_special"]:
                    df_clean = self.remove_special_characters(df_clean, col)
                elif action in ["lowercase_conversion", "to_lowercase", "lowercase"]:
                    df_clean = self.lowercase_conversion(df_clean, col)
                elif action in ["uppercase_conversion", "to_uppercase", "uppercase"]:
                    df_clean = self.uppercase_conversion(df_clean, col)
                elif action in ["strip_whitespace", "trim_space", "clean_whitespace"]:
                    df_clean = self.strip_whitespace(df_clean, col)
                elif action in ["remove_extra_spaces", "collapse_spaces", "clean_spaces"]:
                    df_clean = self.remove_extra_spaces(df_clean, col)
                
                # I. Date/Time
                elif action in ["parse_dates", "parse_datetime", "to_date"]:
                    df_clean = self.parse_dates(df_clean, col)
                elif action in ["standardize_date_format", "format_date", "std_date"]:
                    df_clean = self.standardize_date_format(df_clean, col, **params)
                elif action in ["extract_year", "get_year", "date_year"]:
                    df_clean = self.extract_year(df_clean, col)
                elif action in ["extract_month", "get_month", "date_month"]:
                    df_clean = self.extract_month(df_clean, col)
                elif action in ["extract_day", "get_day", "date_day"]:
                    df_clean = self.extract_day(df_clean, col)
                elif action in ["extract_day_of_week", "get_day_of_week", "date_weekday"]:
                    df_clean = self.extract_day_of_week(df_clean, col)
                
                # O. Transformation
                elif action in ["sqrt_transformation", "sqrt_transform", "sqrt"]:
                    df_clean = self.sqrt_transformation(df_clean, col)
                elif action in ["quantile_transformation", "quantile_transform", "quantile"]:
                    df_clean = self.quantile_transformation(df_clean, [col] if isinstance(col, str) else col)
                elif action in ["binning", "bin_data", "cut"]:
                    df_clean = self.binning(df_clean, col, **params)
                elif action in ["discretize", "qcut", "quantile_binning"]:
                    df_clean = self.discretize(df_clean, col, **params)
                elif action in ["max_abs_scaling", "max_abs", "maxabs_scale"]:
                    df_clean = self.max_abs_scaling(df_clean, [col] if isinstance(col, str) else col)
                
                # Q. Imbalanced
                elif action in ["random_oversample", "oversample_random", "random_over"]:
                    df_clean = self.random_oversample(df_clean, col)
                elif action in ["random_undersample", "undersample_random", "random_under"]:
                    df_clean = self.random_undersample(df_clean, col)
                
                # R. Noise
                elif action in ["moving_average_smooth", "moving_average", "ma_smooth"]:
                    df_clean = self.moving_average_smooth(df_clean, col, **params)
                elif action in ["rolling_median_smooth", "rolling_median", "median_smooth"]:
                    df_clean = self.rolling_median_smooth(df_clean, col, **params)
                
                # T. Encoding
                elif action in ["frequency_encoding", "freq_encode", "count_encoding"]:
                    df_clean = self.frequency_encoding(df_clean, col)
                elif action in ["target_encoding", "target_encode", "mean_encoding"]:
                    df_clean = self.target_encoding(df_clean, col, **params)
                elif action in ["binary_encoding", "binary_encode", "bin_encode"]:
                    df_clean = self.binary_encoding(df_clean, col)
                
                # V. Privacy
                elif action in ["mask_data", "mask_values", "obfuscate"]:
                    df_clean = self.mask_data(df_clean, col, **params)
                elif action in ["remove_pii", "drop_pii", "clean_pii"]:
                    df_clean = self.remove_pii(df_clean, [col] if isinstance(col, str) else col)
                elif action in ["pseudonymize", "pseudonymization", "hash_data", "hash_values"]:
                    df_clean = self.pseudonymize(df_clean, col)
                
                # W. Time-series
                elif action in ["remove_duplicate_timestamps", "drop_duplicate_time", "unique_timestamps"]:
                    df_clean = self.remove_duplicate_timestamps(df_clean, col)

                # ── Informational-only / analysis-only operations (no data change) ──
                elif action in [
                    "summary_statistics", "data_profiling_summary", "data_profiling", "profiling_summary",
                    "data_auditing", "cardinality_analysis", "column_level_profiling", "data_type_inspection",
                    "distribution_analysis", "frequency_analysis", "row_level_profiling", "schema_inspection",
                    "unique_value_analysis", "data_quality_assessment", "data_quality_scoring",
                    "zero_value_validation", "zero_validation", "check_zeros",
                    "future_date_detection", "future_date_check", "check_future_dates",
                    "impossible_value_detection", "check_impossible_values",
                    "class_imbalance___check_target", "class_imbalance_check",
                    "correlated_feature_removal", "check_correlation",
                    "near_zero_variance_removal", "near_zero_variance",
                    "email_removal_or_masking", "email_removal_or_extraction",
                    "duplicate_timestamp_removal", "check_duplicate_timestamps",
                    "numeric_string_conversion", "check_numeric_strings",
                    "whitespace_removal", "check_whitespace",
                    "html_tag_removal", "url_removal", "emoji_handling___unicode_normalization",
                    "date_format_standardization", "date_component_extraction",
                ]:
                    # These are informational / assessment techniques — no transformation needed
                    report.append({"operation": raw_action, "column": col, "status": "info",
                                   "message": f"'{raw_action}' is an analysis/assessment technique. No data modification applied."})
                    continue

                else:
                    # Fallback try method name directly
                    method = getattr(self, action, None)
                    if method:
                        if callable(method):
                            if isinstance(col, list) and 'columns' in method.__code__.co_varnames:
                                df_clean = method(df_clean, columns=col, **params)
                            else:
                                df_clean = method(df_clean, column=col, **params)
                
                report.append({"operation": raw_action, "column": col, "status": "success"})
            except Exception as e:
                report.append({"operation": raw_action, "column": col, "status": "failed", "error": str(e)})
        
        df_clean = self._restore_integer_types(df, df_clean)
        return df_clean, report

    def _restore_integer_types(self, df_before: pd.DataFrame, df_after: pd.DataFrame) -> pd.DataFrame:
        for col in df_after.columns:
            if col in df_before.columns:
                orig_non_nulls = df_before[col].dropna()
                after_non_nulls = df_after[col].dropna()
                is_int_col = False
                col_lower = str(col).lower()

                if any(k in col_lower for k in ['age', 'count', 'year', 'qty', 'quantity', 'num_', 'nbr', 'days', 'months', 'score']):
                    is_int_col = True
                elif not orig_non_nulls.empty and pd.api.types.is_numeric_dtype(orig_non_nulls):
                    try:
                        if (orig_non_nulls % 1 == 0).all():
                            is_int_col = True
                    except Exception:
                        pass

                if is_int_col and pd.api.types.is_numeric_dtype(df_after[col]):
                    try:
                        # Only restore int type if values are still in original scale
                        # (not minmax/standard scaled to 0-1 or z-score range)
                        if not orig_non_nulls.empty and not after_non_nulls.empty:
                            orig_max = float(orig_non_nulls.max())
                            after_max = float(after_non_nulls.max())
                            # If original max was > 1 but after max is <= 1, scaling was applied — skip restoration
                            if orig_max > 1.5 and after_max <= 1.5:
                                continue
                        df_after[col] = df_after[col].round()
                        if not df_after[col].isnull().any():
                            df_after[col] = df_after[col].astype('int64')
                        else:
                            df_after[col] = df_after[col].astype('Int64')
                    except Exception:
                        pass
        return df_after
