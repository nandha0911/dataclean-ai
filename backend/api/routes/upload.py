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

router = APIRouter()

@router.post("/upload", response_model=DatasetUploadResponse)
async def upload_dataset(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File extension not allowed")
    
    file_path = await save_upload_file(file, file.filename)
    
    try:
        df = read_dataset(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
        
    row_count, col_count = df.shape
    preview = df.head(5).fillna("").to_dict(orient="records")
    
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
