import pandas as pd
import numpy as np
from datetime import datetime

def detect_column_type(series: pd.Series) -> str:
    """Detect detailed column type."""
    if pd.api.types.is_numeric_dtype(series):
        if pd.api.types.is_bool_dtype(series) or series.dropna().isin([0, 1]).all():
            return 'boolean'
        if pd.api.types.is_integer_dtype(series) or (series.dropna() % 1 == 0).all():
            return 'integer'
        return 'float'
    elif pd.api.types.is_datetime64_any_dtype(series):
        return 'datetime'
    else:
        unique_count = series.nunique()
        if unique_count > 0 and unique_count / len(series) < 0.05:
            return 'categorical'
        return 'text'

def safe_convert_types(df: pd.DataFrame) -> pd.DataFrame:
    """Attempt to safely convert types."""
    df_out = df.copy()
    for col in df_out.columns:
        try:
            df_out[col] = pd.to_numeric(df_out[col])
            continue
        except (ValueError, TypeError):
            pass
        try:
            df_out[col] = pd.to_datetime(df_out[col])
        except (ValueError, TypeError):
            pass
    return df_out

def compute_vif(df: pd.DataFrame) -> dict:
    """Compute VIF for numeric columns."""
    from statsmodels.stats.outliers_influence import variance_inflation_factor
    numeric_df = df.select_dtypes(include=[np.number]).dropna()
    if numeric_df.empty or numeric_df.shape[1] < 2:
        return {}
    vif_data = {}
    for i in range(numeric_df.shape[1]):
        try:
            vif_data[numeric_df.columns[i]] = variance_inflation_factor(numeric_df.values, i)
        except Exception:
            vif_data[numeric_df.columns[i]] = np.inf
    return vif_data

def detect_date_format(series: pd.Series) -> str:
    """Dummy date format detection."""
    return "YYYY-MM-DD"

def is_potential_id_column(series: pd.Series) -> bool:
    """Check if column is a likely ID column."""
    if not pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_string_dtype(series):
        return False
    # If 99%+ unique and named like 'id', 'index', etc.
    if series.nunique() / len(series) > 0.99:
        if 'id' in str(series.name).lower() or 'index' in str(series.name).lower():
            return True
    return False
