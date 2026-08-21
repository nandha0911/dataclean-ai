import os
import shutil
from fastapi import UploadFile
import pandas as pd
from core.config import settings

def ensure_dirs():
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.REPORTS_DIR, exist_ok=True)

async def save_upload_file(upload_file: UploadFile, filename: str) -> str:
    ensure_dirs()
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    await upload_file.seek(0)
    # High-speed 8MB buffer chunks for fast transfer of multi-GB files (>2GB)
    with open(file_path, "wb") as buffer:
        while chunk := await upload_file.read(8 * 1024 * 1024):
            buffer.write(chunk)
    return file_path

def get_dataset_preview_and_count(file_path: str) -> tuple[int, int, list]:
    """
    High-speed streaming metadata extractor for large (100MB - 5GB) datasets.
    Extracts total row count and top preview without loading the full file into memory.
    Prevents Out-Of-Memory (OOM) crashes on multi-GB uploads.
    """
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".csv":
        row_count = 0
        with open(file_path, 'rb') as f:
            while chunk := f.read(8 * 1024 * 1024):
                row_count += chunk.count(b'\n')
        row_count = max(1, row_count - 1)  # Exclude header row
        
        # Read preview (top 10 rows) using tiny RAM (<1MB)
        df_preview = None
        for enc in ['utf-8', 'utf-8-sig', 'latin-1', 'iso-8859-1', 'cp1252']:
            try:
                df_preview = pd.read_csv(file_path, nrows=10, encoding=enc, low_memory=False)
                break
            except Exception:
                continue
        if df_preview is None:
            df_preview = pd.read_csv(file_path, nrows=10, encoding='latin-1', on_bad_lines='skip', low_memory=False)
            
        col_count = len(df_preview.columns)
        records = df_preview.fillna("").to_dict(orient="records")
        return row_count, col_count, records
    elif ext in [".xls", ".xlsx"]:
        df = pd.read_excel(file_path)
        return len(df), len(df.columns), df.head(10).fillna("").to_dict(orient="records")
    elif ext == ".json":
        df = pd.read_json(file_path)
        return len(df), len(df.columns), df.head(10).fillna("").to_dict(orient="records")
    else:
        raise ValueError(f"Unsupported file extension: {ext}")

def read_dataset(file_path: str, max_rows: int = None) -> pd.DataFrame:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".csv":
        # Robust multi-encoding fallback for international/special characters
        encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'iso-8859-1', 'cp1252']
        for enc in encodings:
            try:
                return pd.read_csv(file_path, encoding=enc, nrows=max_rows, low_memory=False)
            except (UnicodeDecodeError, UnicodeError):
                continue
            except Exception:
                try:
                    return pd.read_csv(file_path, encoding=enc, nrows=max_rows, on_bad_lines='skip', low_memory=False)
                except Exception:
                    continue
        return pd.read_csv(file_path, encoding='latin-1', nrows=max_rows, on_bad_lines='skip', low_memory=False)
    elif ext in [".xls", ".xlsx"]:
        return pd.read_excel(file_path, nrows=max_rows)
    elif ext == ".json":
        df = pd.read_json(file_path)
        return df.head(max_rows) if max_rows else df
    else:
        raise ValueError(f"Unsupported file extension: {ext}")

def get_dataset_path(filename: str) -> str:
    return os.path.join(settings.UPLOAD_DIR, filename)

def get_cleaned_path(filename: str) -> str:
    name, ext = os.path.splitext(filename)
    return os.path.join(settings.UPLOAD_DIR, f"{name}_cleaned{ext}")

def get_report_path(dataset_id: int) -> str:
    ensure_dirs()
    return os.path.join(settings.REPORTS_DIR, f"report_{dataset_id}.pdf")

def cleanup_old_files():
    # To be implemented for production
    pass
