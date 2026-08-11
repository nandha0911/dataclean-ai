from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db, Dataset
from utils.file_utils import get_report_path
import os

router = APIRouter()

@router.get("/download/{dataset_id}")
async def download_file(dataset_id: int, type: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    if type == "cleaned":
        path = dataset.cleaned_path if (dataset.cleaned_path and os.path.exists(dataset.cleaned_path)) else dataset.original_path
        if not path or not os.path.exists(path):
            raise HTTPException(status_code=404, detail="File not found")
        filename = os.path.basename(path)
        return FileResponse(path, filename=filename)
        
    elif type == "report":
        path = get_report_path(dataset_id)
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="Report not found")
        return FileResponse(path, filename=f"report_{dataset_id}.pdf")
        
    raise HTTPException(status_code=400, detail="Invalid download type. Use 'cleaned' or 'report'.")
