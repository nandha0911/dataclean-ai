from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db, Dataset, AnalysisJob
from models.schemas import Recommendation
from services.recommender import AIRecommender
from services.analyzer import DataAnalyzer
from services.scorer import QualityScorer
from utils.file_utils import read_dataset
from datetime import datetime

router = APIRouter()
recommender = AIRecommender()
analyzer = DataAnalyzer()
scorer = QualityScorer()

@router.get("/recommend/{dataset_id}", response_model=list[Recommendation])
async def get_recommendations(dataset_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    
    if not dataset:
        # Fall back to most recent dataset if ID was from previous session/restart
        fallback = await db.execute(select(Dataset).order_by(Dataset.id.desc()))
        dataset = fallback.scalars().first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found. Please upload a dataset first.")
        
    job_result = await db.execute(
        select(AnalysisJob).where(AnalysisJob.dataset_id == dataset_id).order_by(AnalysisJob.id.desc())
    )
    job = job_result.scalars().first()
    
    # Auto-run analysis on the fly if not yet analyzed
    if not job or not job.result_json:
        file_path = dataset.cleaned_path if dataset.cleaned_path else dataset.original_path
        df = read_dataset(file_path)
        analysis_dict = analyzer.analyze(df, dataset_id)
        score_dict = scorer.calculate_score(analysis_dict, len(df))
        analysis_dict['quality_score'] = score_dict
        
        job = AnalysisJob(
            dataset_id=dataset_id,
            status="completed",
            completed_at=datetime.utcnow(),
            result_json=analysis_dict
        )
        db.add(job)
        await db.commit()
        
    recommendations = recommender.get_recommendations(job.result_json)
    return recommendations
