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

import csv

def detect_csv_delimiter(file_path: str, encoding: str = 'utf-8') -> str:
    """Sniff CSV delimiter (comma, semicolon, tab, pipe) from sample."""
    try:
        with open(file_path, 'r', encoding=encoding, errors='ignore') as f:
            sample = f.read(8192)
            if sample:
                sniffer = csv.Sniffer()
                dialect = sniffer.sniff(sample, delimiters=',;\t|')
                return dialect.delimiter
    except Exception:
        pass
    return ','

def get_dataset_preview_and_count(file_path: str) -> tuple[int, int, list]:
    """
    High-speed streaming metadata extractor for datasets (CSV, XLS, XLSX, JSON).
    Extracts total row count, detects delimiters, and returns top preview without OOM.
    Resilient to format mismatches (e.g. JSON/CSV saved with .xls extension, or non-zip .xls).
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext in [".xls", ".xlsx", ".xlsm", ".xlsb"]:
        # 1. Try Excel engines
        primary_engine = "xlrd" if ext == ".xls" else "openpyxl"
        secondary_engine = "openpyxl" if ext == ".xls" else "xlrd"
        
        for eng in [primary_engine, secondary_engine]:
            try:
                df = pd.read_excel(file_path, engine=eng)
                return len(df), len(df.columns), df.head(10).fillna("").to_dict(orient="records")
            except Exception:
                continue

        # 2. Try JSON (in case file was saved as JSON text with .xls extension)
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                header_text = f.read(200).strip()
                if header_text.startswith('[') or header_text.startswith('{'):
                    df = pd.read_json(file_path)
                    return len(df), len(df.columns), df.head(10).fillna("").to_dict(orient="records")
        except Exception:
            pass

        # 3. Try HTML table (many portal exports are HTML tables with .xls extension)
        try:
            tables = pd.read_html(file_path)
            if tables:
                df = tables[0]
                return len(df), len(df.columns), df.head(10).fillna("").to_dict(orient="records")
        except Exception:
            pass

        # 4. Try CSV / Delimited text
        for enc in ['utf-8', 'utf-8-sig', 'latin-1', 'iso-8859-1', 'cp1252']:
            try:
                sep = detect_csv_delimiter(file_path, enc)
                df = pd.read_csv(file_path, sep=sep, encoding=enc, nrows=10, low_memory=False)
                row_count = 0
                with open(file_path, 'rb') as f:
                    while chunk := f.read(8 * 1024 * 1024):
                        row_count += chunk.count(b'\n')
                row_count = max(1, row_count - 1)
                return row_count, len(df.columns), df.fillna("").to_dict(orient="records")
            except Exception:
                continue

        raise ValueError(f"Could not parse Excel file '{os.path.basename(file_path)}'. The file may be corrupt or an unsupported format.")

    elif ext == ".csv":
        row_count = 0
        with open(file_path, 'rb') as f:
            while chunk := f.read(8 * 1024 * 1024):
                row_count += chunk.count(b'\n')
        row_count = max(1, row_count - 1)  # Exclude header row
        
        # Read preview (top 10 rows) using tiny RAM (<1MB) with delimiter sniffing
        df_preview = None
        for enc in ['utf-8', 'utf-8-sig', 'latin-1', 'iso-8859-1', 'cp1252']:
            try:
                sep = detect_csv_delimiter(file_path, enc)
                df_preview = pd.read_csv(file_path, sep=sep, nrows=10, encoding=enc, low_memory=False)
                break
            except Exception:
                continue
        if df_preview is None:
            df_preview = pd.read_csv(file_path, nrows=10, encoding='latin-1', on_bad_lines='skip', low_memory=False)
            
        col_count = len(df_preview.columns)
        records = df_preview.fillna("").to_dict(orient="records")
        return row_count, col_count, records

    elif ext == ".json":
        df = pd.read_json(file_path)
        return len(df), len(df.columns), df.head(10).fillna("").to_dict(orient="records")
    else:
        raise ValueError(f"Unsupported file extension: {ext}")

def read_dataset(file_path: str, max_rows: int = None) -> pd.DataFrame:
    ext = os.path.splitext(file_path)[1].lower()
    
    # 1. Excel files (.xls, .xlsx, .xlsm, .xlsb)
    if ext in [".xls", ".xlsx", ".xlsm", ".xlsb"]:
        primary_engine = "xlrd" if ext == ".xls" else "openpyxl"
        secondary_engine = "openpyxl" if ext == ".xls" else "xlrd"
        
        # Try primary engine then secondary engine
        for engine in [primary_engine, secondary_engine]:
            try:
                return pd.read_excel(file_path, engine=engine, nrows=max_rows)
            except Exception:
                continue

        # If both fail, check if the file is actually JSON (e.g. previously saved as json with .xls name)
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                header_text = f.read(200).strip()
                if header_text.startswith('[') or header_text.startswith('{'):
                    df = pd.read_json(file_path)
                    return df.head(max_rows) if max_rows else df
        except Exception:
            pass

        # Try HTML table
        try:
            tables = pd.read_html(file_path)
            if tables:
                df = tables[0]
                return df.head(max_rows) if max_rows else df
        except Exception:
            pass

        # Try CSV/Delimited text fallback
        for enc in ['utf-8', 'utf-8-sig', 'latin-1', 'iso-8859-1', 'cp1252']:
            try:
                sep = detect_csv_delimiter(file_path, enc)
                return pd.read_csv(file_path, sep=sep, encoding=enc, nrows=max_rows, low_memory=False)
            except Exception:
                continue

        # Final fallback
        return pd.read_csv(file_path, encoding='latin-1', nrows=max_rows, on_bad_lines='skip', low_memory=False)

    elif ext == ".csv":
        # Robust multi-encoding & multi-delimiter fallback
        encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'iso-8859-1', 'cp1252']
        for enc in encodings:
            try:
                sep = detect_csv_delimiter(file_path, enc)
                return pd.read_csv(file_path, sep=sep, encoding=enc, nrows=max_rows, low_memory=False)
            except (UnicodeDecodeError, UnicodeError):
                continue
            except Exception:
                try:
                    return pd.read_csv(file_path, sep=None, engine='python', encoding=enc, nrows=max_rows, on_bad_lines='skip')
                except Exception:
                    continue
        return pd.read_csv(file_path, encoding='latin-1', nrows=max_rows, on_bad_lines='skip', low_memory=False)
    elif ext == ".json":
        df = pd.read_json(file_path)
        return df.head(max_rows) if max_rows else df
    else:
        raise ValueError(f"Unsupported file extension: {ext}")

def get_dataset_path(filename: str) -> str:
    return os.path.join(settings.UPLOAD_DIR, filename)

def get_cleaned_path(filename: str) -> str:
    name, ext = os.path.splitext(filename)
    # Convert legacy .xls to modern .xlsx for cleaned output so openpyxl writes clean Excel files
    if ext.lower() == '.xls':
        ext = '.xlsx'
    return os.path.join(settings.UPLOAD_DIR, f"{name}_cleaned{ext}")

def get_report_path(dataset_id: int) -> str:
    ensure_dirs()
    return os.path.join(settings.REPORTS_DIR, f"report_{dataset_id}.pdf")

def cleanup_old_files():
    # To be implemented for production
    pass
