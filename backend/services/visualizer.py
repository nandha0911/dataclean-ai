import pandas as pd
import numpy as np

class DataVisualizer:
    def missing_heatmap_data(self, df: pd.DataFrame) -> dict:
        missing_matrix = df.isnull().astype(int).values.tolist()
        return {
            "columns": df.columns.tolist(),
            "data": missing_matrix
        }

    def correlation_matrix_data(self, df: pd.DataFrame) -> dict:
        numeric_df = df.select_dtypes(include=[np.number])
        if numeric_df.empty:
            return {}
        corr = numeric_df.corr().fillna(0).round(2)
        return {
            "columns": corr.columns.tolist(),
            "data": corr.values.tolist()
        }

    def distribution_data(self, df: pd.DataFrame, column: str) -> dict:
        if column not in df.columns or df[column].empty:
            return {}
        series = df[column].dropna()
        if pd.api.types.is_numeric_dtype(series):
            counts, bins = np.histogram(series, bins='auto')
            return {
                "labels": [(bins[i] + bins[i+1])/2 for i in range(len(bins)-1)],
                "counts": counts.tolist()
            }
        else:
            val_counts = series.value_counts().head(20)
            return {
                "labels": val_counts.index.tolist(),
                "counts": val_counts.values.tolist()
            }

    def boxplot_data(self, df: pd.DataFrame, column: str) -> dict:
        if column not in df.columns or not pd.api.types.is_numeric_dtype(df[column]):
            return {}
        s = df[column].dropna()
        if s.empty: return {}
        q1 = s.quantile(0.25)
        q2 = s.median()
        q3 = s.quantile(0.75)
        iqr = q3 - q1
        min_val = s[s >= q1 - 1.5*iqr].min()
        max_val = s[s <= q3 + 1.5*iqr].max()
        outliers = s[(s < min_val) | (s > max_val)].tolist()
        
        return {
            "min": min_val,
            "q1": q1,
            "median": q2,
            "q3": q3,
            "max": max_val,
            "outliers": outliers
        }

    def scatter_data(self, df: pd.DataFrame, col1: str, col2: str) -> list:
        if col1 in df.columns and col2 in df.columns:
            subset = df[[col1, col2]].dropna()
            return [{"x": row[col1], "y": row[col2]} for _, row in subset.iterrows()]
        return []

    def class_balance_data(self, df: pd.DataFrame, column: str) -> dict:
        if column in df.columns:
            val_counts = df[column].value_counts()
            return {
                "labels": val_counts.index.tolist(),
                "counts": val_counts.values.tolist()
            }
        return {}

    def outlier_visualization_data(self, df: pd.DataFrame, column: str) -> dict:
        # returns data with z-scores
        if column in df.columns and pd.api.types.is_numeric_dtype(df[column]):
            s = df[column].dropna()
            if len(s) > 0:
                z_scores = np.abs((s - s.mean()) / s.std())
                return {
                    "indices": s.index.tolist(),
                    "values": s.tolist(),
                    "z_scores": z_scores.tolist()
                }
        return {}

    def quality_dashboard_data(self, scores: dict) -> dict:
        labels = ["completeness", "consistency", "accuracy", "uniqueness", "validity", "integrity"]
        data = [scores.get(l, 0) for l in labels]
        return {
            "labels": [l.capitalize() for l in labels],
            "datasets": [{
                "label": "Quality Score",
                "data": data,
                "backgroundColor": "rgba(54, 162, 235, 0.2)",
                "borderColor": "rgb(54, 162, 235)",
                "pointBackgroundColor": "rgb(54, 162, 235)",
            }]
        }
