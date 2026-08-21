from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db, Dataset
from models.schemas import DatasetUploadResponse
from utils.file_utils import save_upload_file, read_dataset, get_dataset_preview_and_count
from core.config import settings
import os
import shutil
import json
import numpy as np
import pandas as pd

router = APIRouter()

@router.post("/upload-chunk", response_model=DatasetUploadResponse | dict)
async def upload_chunk(
    chunk: UploadFile = File(...),
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
    filename: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Chunked upload receiver for 100MB - 5GB datasets.
    Receives 10MB slices, bypassing cloud proxy body limits completely.
    """
    safe_filename = os.path.basename(filename)
    ext = os.path.splitext(safe_filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension '{ext}' is not supported.")
        
    temp_dir = os.path.join(settings.UPLOAD_DIR, f"temp_{upload_id}")
    os.makedirs(temp_dir, exist_ok=True)
    chunk_path = os.path.join(temp_dir, f"chunk_{chunk_index:05d}")
    
    # Save chunk to temp folder
    with open(chunk_path, "wb") as buffer:
        while data := await chunk.read(1024 * 1024):
            buffer.write(data)
            
    # If not the last chunk, return chunk ack
    if chunk_index < total_chunks - 1:
        return {"status": "chunk_received", "chunk_index": chunk_index, "total_chunks": total_chunks}
        
    # Last chunk received: Reassemble parts into final dataset file
    final_file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    with open(final_file_path, "wb") as final_f:
        for idx in range(total_chunks):
            part_path = os.path.join(temp_dir, f"chunk_{idx:05d}")
            if os.path.exists(part_path):
                with open(part_path, "rb") as part_f:
                    shutil.copyfileobj(part_f, final_f)
                    
    # Clean up temp chunks
    try:
        shutil.rmtree(temp_dir)
    except Exception:
        pass
        
    # Extract metadata using fast zero-OOM streaming extractor
    try:
        row_count, col_count, raw_preview = get_dataset_preview_and_count(final_file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse dataset: {str(e)}")
        
    preview = []
    for row in raw_preview:
        clean_row = {}
        for k, v in row.items():
            if pd.isna(v) or v is None or (isinstance(v, float) and (np.isinf(v) or np.isnan(v))):
                clean_row[k] = None
            elif isinstance(v, (np.integer, int)):
                clean_row[k] = int(v)
            elif isinstance(v, (np.floating, float)):
                clean_row[k] = float(v)
            elif isinstance(v, (np.bool_, bool)):
                clean_row[k] = bool(v)
            else:
                clean_row[k] = str(v)
        preview.append(clean_row)
        
    new_dataset = Dataset(
        filename=safe_filename,
        original_path=final_file_path,
        row_count=row_count,
        col_count=col_count,
        status="uploaded"
    )
    db.add(new_dataset)
    await db.commit()
    await db.refresh(new_dataset)
    
    return DatasetUploadResponse(
        dataset_id=new_dataset.id,
        filename=safe_filename,
        row_count=row_count,
        col_count=col_count,
        preview=preview
    )

@router.post("/upload", response_model=DatasetUploadResponse)
async def upload_dataset(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided in the upload request.")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension '{ext}' is not supported. Supported extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}")
    
    try:
        file_path = await save_upload_file(file, file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    try:
        # High-speed streaming extractor: extracts total rows and top 10 preview
        # in <0.2s without loading multi-GB files into RAM (Zero OOM)
        row_count, col_count, raw_preview = get_dataset_preview_and_count(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse dataset: {str(e)}")
        
    if row_count == 0:
        raise HTTPException(status_code=400, detail="The uploaded file contains 0 rows.")

    # Safe json-compatible preview
    preview = []
    for row in raw_preview:
        clean_row = {}
        for k, v in row.items():
            if pd.isna(v) or v is None or (isinstance(v, float) and (np.isinf(v) or np.isnan(v))):
                clean_row[k] = None
            elif isinstance(v, (np.integer, int)):
                clean_row[k] = int(v)
            elif isinstance(v, (np.floating, float)):
                clean_row[k] = float(v)
            elif isinstance(v, (np.bool_, bool)):
                clean_row[k] = bool(v)
            else:
                clean_row[k] = str(v)
        preview.append(clean_row)
    
    new_dataset = Dataset(
        filename=file.filename,
        original_path=file_path,
        row_count=row_count,
        col_count=col_count,
        status="uploaded"
    )
    db.add(new_dataset)
    await db.commit()
    await db.refresh(new_dataset)
    
    return DatasetUploadResponse(
        dataset_id=new_dataset.id,
        filename=file.filename,
        row_count=row_count,
        col_count=col_count,
        preview=preview
    )

@router.get("/preview/{dataset_id}")
async def get_dataset_preview(
    dataset_id: int,
    mode: str = "head",
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    active_path = dataset.cleaned_path if (dataset.cleaned_path and os.path.exists(dataset.cleaned_path)) else dataset.original_path
    if not active_path or not os.path.exists(active_path):
        raise HTTPException(status_code=404, detail="Dataset file not found")
        
    try:
        df = read_dataset(active_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read dataset: {str(e)}")
        
    if mode == "tail":
        df_preview = df.tail(limit)
    elif mode == "sample":
        df_preview = df.sample(min(limit, len(df))) if len(df) > 0 else df
    elif mode == "all":
        df_preview = df  # return all rows
    else: # head
        df_preview = df.head(limit)
        
    # Replace NaN / Inf with None so JSON serialization works
    df_preview = df_preview.replace({np.nan: None, np.inf: None, -np.inf: None})
    preview_data = df_preview.to_dict(orient="records")
    
    return {
        "dataset_id": dataset_id,
        "mode": mode,
        "total_rows": len(df),
        "columns": df.columns.tolist(),
        "preview": preview_data
    }
