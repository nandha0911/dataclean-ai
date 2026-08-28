from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.database import get_db, Dataset, AnalysisJob
from models.schemas import ChatRequest, ChatResponse, VisualizationData
from services.reporter import ReportGenerator
from services.chatbot import AIAssistant
from services.visualizer import DataVisualizer
from services.recommender import AIRecommender
from services.analyzer import DataAnalyzer
from services.scorer import QualityScorer
from utils.file_utils import get_report_path, read_dataset
from datetime import datetime

router = APIRouter()
reporter = ReportGenerator()
chatbot = AIAssistant()
visualizer = DataVisualizer()
recommender = AIRecommender()
analyzer = DataAnalyzer()
scorer = QualityScorer()

@router.get("/report/{dataset_id}")
async def generate_report(dataset_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    job_result = await db.execute(
        select(AnalysisJob).where(AnalysisJob.dataset_id == dataset_id).order_by(AnalysisJob.id.desc())
    )
    job = job_result.scalars().first()
    
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
        
    analysis = job.result_json
    recs = recommender.get_recommendations(analysis)
    score = analysis.get('quality_score', {})
    
    path = get_report_path(dataset_id)
    reporter.generate_pdf(dataset_id, analysis, recs, score, path)
    
    return FileResponse(path, filename=f"report_{dataset_id}.pdf")

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    answer, sources, conf = chatbot.answer(request.question, request.context)
    return ChatResponse(answer=answer, sources=sources, confidence=conf)

@router.get("/visualize/{dataset_id}", response_model=VisualizationData)
async def get_visualization_data(dataset_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    job_result = await db.execute(
        select(AnalysisJob).where(AnalysisJob.dataset_id == dataset_id).order_by(AnalysisJob.id.desc())
    )
    job = job_result.scalars().first()
    if not job or not job.result_json:
        file_path = dataset.cleaned_path if dataset.cleaned_path else dataset.original_path
        df = read_dataset(file_path, max_rows=50000)
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
        
    file_path = dataset.cleaned_path if dataset.cleaned_path else dataset.original_path
    df = read_dataset(file_path, max_rows=50000)
    
    missing = visualizer.missing_heatmap_data(df)
    corr = visualizer.correlation_matrix_data(df)
    
    dists = {}
    boxes = {}
    classes = {}
    
    for col in df.columns:
        if len(dists) < 10:  # Include up to 10 columns
            dists[col] = visualizer.distribution_data(df, col)
            boxes[col] = visualizer.boxplot_data(df, col)
            if df[col].dtype == 'object':
                classes[col] = visualizer.class_balance_data(df, col)
                
    quality = visualizer.quality_dashboard_data(job.result_json.get('quality_score', {}))
    
    return VisualizationData(
        dataset_id=dataset_id,
        missing_heatmap=missing,
        correlation_matrix=corr,
        distributions=dists,
        boxplots=boxes,
        class_balances=classes,
        quality_dashboard=quality
    )
