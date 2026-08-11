from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db, Dataset
from models.schemas import DatasetUploadResponse
from utils.file_utils import save_upload_file, read_dataset
from core.config import settings
import os
import json

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
