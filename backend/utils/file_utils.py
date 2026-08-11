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
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return file_path

def read_dataset(file_path: str) -> pd.DataFrame:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".csv":
        return pd.read_csv(file_path)
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
