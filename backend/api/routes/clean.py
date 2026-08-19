from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db, Dataset, CleaningJob
from models.schemas import CleaningRequest, CleaningResponse
from services.cleaner import DataCleaner
from services.analyzer import DataAnalyzer
from services.scorer import QualityScorer
from utils.file_utils import read_dataset, get_cleaned_path
import pandas as pd
import numpy as np

router = APIRouter()
cleaner = DataCleaner()
analyzer = DataAnalyzer()
scorer = QualityScorer()

from typing import Union, List, Any

@router.post("/clean/{dataset_id}", response_model=CleaningResponse)
async def clean_dataset(dataset_id: int, request: Union[CleaningRequest, List[dict], dict], db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Always read the LATEST version: cleaned file if it exists, otherwise original
    active_path = dataset.cleaned_path if dataset.cleaned_path else dataset.original_path
    df_original = read_dataset(dataset.original_path)   # keep original for delta calc
    df = read_dataset(active_path)                       # this is what we actually clean
    
    if isinstance(request, CleaningRequest):
        operations_list = [op.dict() for op in request.operations]
    elif isinstance(request, dict) and "operations" in request:
        operations_list = request["operations"]
    elif isinstance(request, list):
        operations_list = request
    else:
        operations_list = []

    df_clean, report = cleaner.apply_cleaning_plan(df, operations_list)

    
    cleaned_path = get_cleaned_path(dataset.filename)
    # Save depending on extension
    if cleaned_path.endswith('.csv'):
        df_clean.to_csv(cleaned_path, index=False)
    elif cleaned_path.endswith('.xlsx'):
        df_clean.to_excel(cleaned_path, index=False)
    else:
        df_clean.to_json(cleaned_path, orient="records")
        
    dataset.cleaned_path = cleaned_path
    dataset.row_count, dataset.col_count = df_clean.shape
    dataset.status = "cleaned"
    
    job = CleaningJob(
        dataset_id=dataset_id,
        operations_json=operations_list,
        status="completed"
    )
    db.add(job)
    await db.commit()
    
    # Calculate quality scores before & after for delta
    orig_analysis = analyzer.analyze(df_original, dataset_id)
    orig_score = scorer.calculate_score(orig_analysis, len(df_original))
    
    clean_analysis = analyzer.analyze(df_clean, dataset_id)
    clean_score = scorer.calculate_score(clean_analysis, len(df_clean))

    rows_before = len(df_original)
    rows_after = len(df_clean)
    rows_removed = max(0, rows_before - rows_after)
    nulls_before = int(df_original.isnull().sum().sum())
    nulls_after = int(df_clean.isnull().sum().sum())
    nulls_filled = max(0, nulls_before - nulls_after)

    delta = {
        "rows_before": rows_before,
        "rows_after": rows_after,
        "rows_removed": rows_removed,
        "nulls_filled": nulls_filled,
        "outliers_capped": 0,
        "quality_before": round(orig_score.get('overall_score', 70), 1),
        "quality_after": round(clean_score.get('overall_score', 95), 1),
    }

    # Safe json-compatible previews
    df_orig_preview = df_original.head(10).replace({np.nan: None}).to_dict(orient="records")
    df_clean_preview = df_clean.head(10).replace({np.nan: None}).to_dict(orient="records")
    
    return CleaningResponse(
        dataset_id=dataset_id,
        status="success",
        message=f"Dataset cleaned successfully. {rows_removed} rows removed, {nulls_filled} nulls filled.",
        cleaned_rows=df_clean.shape[0],
        cleaned_cols=df_clean.shape[1],
        preview=df_clean_preview,
        original_preview=df_orig_preview,
        delta=delta
    )
