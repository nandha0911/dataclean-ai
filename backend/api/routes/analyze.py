from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db, Dataset, AnalysisJob
from models.schemas import AnalysisResult, QualityScore
from services.analyzer import DataAnalyzer
from services.scorer import QualityScorer
from utils.file_utils import read_dataset
from datetime import datetime
import json

router = APIRouter()
analyzer = DataAnalyzer()
scorer = QualityScorer()

@router.get("/analyze/{dataset_id}", response_model=AnalysisResult)
async def analyze_dataset(dataset_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    
    if not dataset:
        # Fall back to most recent dataset if ID was from previous session/restart
        fallback = await db.execute(select(Dataset).order_by(Dataset.id.desc()))
        dataset = fallback.scalars().first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found. Please upload your dataset first.")
        
    df = read_dataset(dataset.original_path)
    
    # Run analysis
    analysis_dict = analyzer.analyze(df, dataset_id)
    score_dict = scorer.calculate_score(analysis_dict, len(df))
    analysis_dict['quality_score'] = score_dict
    
    # Save job result
    job = AnalysisJob(
        dataset_id=dataset_id,
        status="completed",
        completed_at=datetime.utcnow(),
        result_json=analysis_dict
    )
    db.add(job)
    await db.commit()
    
    return analysis_dict
