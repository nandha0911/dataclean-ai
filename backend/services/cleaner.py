import pandas as pd
import numpy as np
from sklearn.impute import KNNImputer
from sklearn.experimental import enable_iterative_imputer
from sklearn.impute import IterativeImputer
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import RobustScaler, StandardScaler, MinMaxScaler, LabelEncoder, OrdinalEncoder, PowerTransformer
from imblearn.over_sampling import SMOTE
from scipy import stats

class DataCleaner:
    def mean_imputation(self, df: pd.DataFrame, column: str):
        df[column].fillna(df[column].mean(), inplace=True)
        return df

    def median_imputation(self, df: pd.DataFrame, column: str):
        df[column].fillna(df[column].median(), inplace=True)
        return df

    def mode_imputation(self, df: pd.DataFrame, column: str):
        df[column].fillna(df[column].mode()[0], inplace=True)
        return df

    def knn_imputation(self, df: pd.DataFrame, columns: list, k: int=5):
        imputer = KNNImputer(n_neighbors=k)
        df[columns] = imputer.fit_transform(df[columns])
        return df

    def mice_imputation(self, df: pd.DataFrame, columns: list):
        imputer = IterativeImputer(random_state=42)
        df[columns] = imputer.fit_transform(df[columns])
        return df

    def forward_fill(self, df: pd.DataFrame, column: str):
        df[column].fillna(method='ffill', inplace=True)
        return df

    def backward_fill(self, df: pd.DataFrame, column: str):
        df[column].fillna(method='bfill', inplace=True)
        return df

    def interpolation(self, df: pd.DataFrame, column: str, method: str='linear'):
        df[column].interpolate(method=method, inplace=True)
        return df

    def delete_rows_with_missing(self, df: pd.DataFrame, column: str):
        df.dropna(subset=[column], inplace=True)
        df.reset_index(drop=True, inplace=True)
        return df

    def delete_column(self, df: pd.DataFrame, column: str):
        df.drop(columns=[column], inplace=True, errors='ignore')
        return df

    def zscore_outlier_removal(self, df: pd.DataFrame, column: str, threshold: float=3.0):
        if not df[column].isnull().all():
            z = np.abs(stats.zscore(df[column].dropna()))
            outlier_indices = df[column].dropna().index[z > threshold]
            df.drop(outlier_indices, inplace=True)
            df.reset_index(drop=True, inplace=True)
        return df

    def iqr_outlier_removal(self, df: pd.DataFrame, column: str):
        Q1 = df[column].quantile(0.25)
        Q3 = df[column].quantile(0.75)
        IQR = Q3 - Q1
        filter_mask = (df[column] >= Q1 - 1.5 * IQR) & (df[column] <= Q3 + 1.5 * IQR)
        df = df[filter_mask | df[column].isnull()].copy()
        df.reset_index(drop=True, inplace=True)
        return df

    def winsorization(self, df: pd.DataFrame, column: str, limits: list=[0.05, 0.05]):
        if not df[column].isnull().all():
            non_nulls = df[column].dropna()
            winsorized = stats.mstats.winsorize(non_nulls, limits=limits)
            df.loc[non_nulls.index, column] = winsorized
        return df

    def isolation_forest_outlier(self, df: pd.DataFrame, columns: list):
        clf = IsolationForest(random_state=42, contamination=0.05)
        subset = df[columns].dropna()
        if not subset.empty:
            preds = clf.fit_predict(subset)
            df = df.loc[df.index.isin(subset.index[preds == 1]) | df[columns].isnull().any(axis=1)].copy()
            df.reset_index(drop=True, inplace=True)
        return df

    def robust_scaling(self, df: pd.DataFrame, columns: list):
        scaler = RobustScaler()
        df[columns] = scaler.fit_transform(df[columns])
        return df

    def standard_scaling(self, df: pd.DataFrame, columns: list):
        scaler = StandardScaler()
        df[columns] = scaler.fit_transform(df[columns])
        return df

    def minmax_scaling(self, df: pd.DataFrame, columns: list):
        scaler = MinMaxScaler()
        df[columns] = scaler.fit_transform(df[columns])
        return df

    def one_hot_encoding(self, df: pd.DataFrame, column: str):
        df = pd.get_dummies(df, columns=[column], drop_first=True)
        return df

    def label_encoding(self, df: pd.DataFrame, column: str):
        le = LabelEncoder()
        mask = df[column].notnull()
        df.loc[mask, column] = le.fit_transform(df.loc[mask, column])
        return df

    def ordinal_encoding(self, df: pd.DataFrame, column: str, order: list):
        mapping = {val: i for i, val in enumerate(order)}
        df[column] = df[column].map(mapping)
        return df

    def log_transformation(self, df: pd.DataFrame, column: str):
        df[column] = np.log1p(df[column] - df[column].min() + 1)
        return df

    def power_transformation(self, df: pd.DataFrame, column: str, method: str='yeo-johnson'):
        pt = PowerTransformer(method=method)
        mask = df[column].notnull()
        df.loc[mask, column] = pt.fit_transform(df.loc[mask, [column]])
        return df

    def smote_oversample(self, df: pd.DataFrame, target: str):
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

    def duplicate_removal(self, df: pd.DataFrame):
        df.drop_duplicates(inplace=True)
        df.reset_index(drop=True, inplace=True)
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
                elif action in ["delete_column", "drop_column", "delete_col"]:
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
                elif action in ["smote"]:
                    df_clean = self.smote_oversample(df_clean, col)
                elif action in ["duplicate_removal", "remove_duplicates"]:
                    df_clean = self.duplicate_removal(df_clean)
                else:
                    # Fallback try method name directly
                    method = getattr(self, action, None)
                report.append({"operation": raw_action, "column": col, "status": "success"})
            except Exception as e:
                report.append({"operation": raw_action, "column": col, "status": "failed", "error": str(e)})
        
        df_clean = self._restore_integer_types(df, df_clean)
        return df_clean, report

    def _restore_integer_types(self, df_before: pd.DataFrame, df_after: pd.DataFrame) -> pd.DataFrame:
        for col in df_after.columns:
            if col in df_before.columns:
                orig_non_nulls = df_before[col].dropna()
                is_int_col = False
                col_lower = str(col).lower()
                
                # Check if column name or original data implies discrete integers
                if any(k in col_lower for k in ['age', 'count', 'year', 'qty', 'quantity', 'id', 'num_', 'nbr', 'days', 'months', 'score']):
                    is_int_col = True
                elif not orig_non_nulls.empty and pd.api.types.is_numeric_dtype(orig_non_nulls):
                    try:
                        if (orig_non_nulls % 1 == 0).all():
                            is_int_col = True
                    except Exception:
                        pass
                
                if is_int_col and pd.api.types.is_numeric_dtype(df_after[col]):
                    try:
                        # Round imputed floats to nearest integer
                        df_after[col] = df_after[col].round()
                        if not df_after[col].isnull().any():
                            df_after[col] = df_after[col].astype('int64')
                        else:
                            df_after[col] = df_after[col].astype('Int64')
                    except Exception:
                        pass
        return df_after

