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
    with open(file_path, "wb") as buffer:
        while chunk := await upload_file.read(1024 * 1024):
            buffer.write(chunk)
    return file_path

def read_dataset(file_path: str) -> pd.DataFrame:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".csv":
        # Robust multi-encoding fallback for international/special characters
        encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'iso-8859-1', 'cp1252']
        for enc in encodings:
            try:
                return pd.read_csv(file_path, encoding=enc, low_memory=False)
            except (UnicodeDecodeError, UnicodeError):
                continue
            except Exception:
                try:
                    return pd.read_csv(file_path, encoding=enc, on_bad_lines='skip', low_memory=False)
                except Exception:
                    continue
        return pd.read_csv(file_path, encoding='latin-1', on_bad_lines='skip', low_memory=False)
    elif ext in [".xls", ".xlsx"]:
        return pd.read_excel(file_path)
    elif ext == ".json":
        return pd.read_json(file_path)
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
