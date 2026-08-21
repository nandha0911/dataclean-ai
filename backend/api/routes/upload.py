from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db, Dataset
from models.schemas import DatasetUploadResponse
from utils.file_utils import save_upload_file, read_dataset
from core.config import settings
import os
import json
import numpy as np
import pandas as pd

router = APIRouter()

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
        df = read_dataset(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse dataset: {str(e)}")
        
    row_count, col_count = df.shape
    if row_count == 0:
        raise HTTPException(status_code=400, detail="The uploaded file contains 0 rows.")

    # Safe json-compatible preview
    preview = []
    for row in df.head(10).to_dict(orient="records"):
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
