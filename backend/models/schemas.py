from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class DatasetUploadResponse(BaseModel):
    dataset_id: int
    filename: str
    row_count: int
    col_count: int
    preview: List[Dict[str, Any]]

class ColumnAnalysis(BaseModel):
    column_name: str
    dtype: str
    missing_count: int
    missing_pct: float
    duplicate_count: Optional[int] = None
    outliers_iqr: Optional[int] = None
    outliers_zscore: Optional[int] = None
    skewness: Optional[float] = None
    kurtosis: Optional[float] = None
    constant: bool
    unique_identifier: bool
    noisy: bool
    class_imbalance: bool
    highly_correlated_with: List[str]
    possible_incorrect_types: bool
    inconsistent_categories: Optional[List[str]] = None
    impossible_values: Optional[List[Any]] = None

class QualityScore(BaseModel):
    overall_score: float
    completeness: float
    consistency: float
    accuracy: float
    uniqueness: float
    validity: float
    integrity: float
    explanations: Dict[str, str]

class AnalysisResult(BaseModel):
    dataset_id: int
    columns: List[ColumnAnalysis]
    quality_score: QualityScore
    correlation_matrix: Dict[str, Dict[str, float]]

class Recommendation(BaseModel):
    column: str
    technique: str
    confidence: float
    reason: str
    advantages: List[str]
    disadvantages: List[str]
    alternatives: List[str]
    expected_improvement: str

class CleaningOperation(BaseModel):
    column: str
    operation: str
    params: Dict[str, Any] = Field(default_factory=dict)

class CleaningRequest(BaseModel):
    operations: List[CleaningOperation]

class CleaningResponse(BaseModel):
    dataset_id: int
    status: str
    message: str
    cleaned_rows: int
    cleaned_cols: int
    preview: Optional[List[Dict[str, Any]]] = None
    original_preview: Optional[List[Dict[str, Any]]] = None
    delta: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    question: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    confidence: float

class VisualizationData(BaseModel):
    dataset_id: int
    missing_heatmap: Any
    correlation_matrix: Any
    distributions: Dict[str, Any]
    boxplots: Dict[str, Any]
    class_balances: Dict[str, Any]
    quality_dashboard: Any
