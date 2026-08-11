from models.schemas import Recommendation
from models.recommendation_model import ml_model
import os

class AIRecommender:
    def __init__(self):
        # Ensure model is ready
        model_path = "backend/models/xgb_model.pkl"
        try:
            ml_model.load_model(model_path)
        except Exception:
            pass

    def get_recommendations(self, analysis_result: dict) -> list[dict]:
        recommendations = []
        columns = analysis_result.get('columns', [])
        
        for col in columns:
            col_name = col['column_name']
            dtype = col['dtype']
            missing_pct = col.get('missing_pct', 0)
            skewness = col.get('skewness')
            outliers_iqr = col.get('outliers_iqr', 0)
            constant = col.get('constant', False)
            unique_id = col.get('unique_identifier', False)
            class_imbalance = col.get('class_imbalance', False)

            # Layer 1: Rule Engine
            rec = None
            if constant:
                rec = Recommendation(
                    column=col_name, technique="Delete Column", confidence=99.0,
                    reason="Column has only one unique value.",
                    advantages=["Reduces dimensionality"], disadvantages=["None"],
                    alternatives=[], expected_improvement="Lower memory usage."
                )
            elif unique_id:
                rec = Recommendation(
                    column=col_name, technique="Delete Column", confidence=95.0,
                    reason="Column is a unique identifier.",
                    advantages=["Prevents model overfitting"], disadvantages=["Loss of record ID"],
                    alternatives=[], expected_improvement="Better generalization."
                )
            elif missing_pct > 0:
                if dtype in ['numeric', 'integer', 'float']:
                    if missing_pct < 5 and (skewness is not None and abs(skewness) < 1):
                        rec = Recommendation(
                            column=col_name, technique="Mean Imputation", confidence=95.0,
                            reason="Low missingness and normal distribution.",
                            advantages=["Simple"], disadvantages=["May reduce variance"],
                            alternatives=["Median Imputation"], expected_improvement="Complete data."
                        )
                    elif missing_pct < 30:
                        rec = Recommendation(
                            column=col_name, technique="Median Imputation", confidence=92.0,
                            reason="Moderate missingness or skewed data.",
                            advantages=["Robust to outliers"], disadvantages=["Changes distribution slightly"],
                            alternatives=["KNN Imputation"], expected_improvement="Complete data without outlier bias."
                        )
                    else:
                        rec = Recommendation(
                            column=col_name, technique="KNN Imputation", confidence=88.0,
                            reason="High missingness needs advanced technique.",
                            advantages=["Maintains relationships"], disadvantages=["Computationally expensive"],
                            alternatives=["MICE Imputation"], expected_improvement="Accurate imputation."
                        )
                else:
                    rec = Recommendation(
                        column=col_name, technique="Mode Imputation", confidence=90.0,
                        reason="Categorical column with missing values.",
                        advantages=["Simple"], disadvantages=["Bias towards majority class"],
                        alternatives=["Predictive Imputation"], expected_improvement="Complete data."
                    )
            elif outliers_iqr > 0 and dtype in ['numeric', 'integer', 'float']:
                rec = Recommendation(
                    column=col_name, technique="IQR Outlier Removal", confidence=87.0,
                    reason="Significant outliers detected.",
                    advantages=["Removes extreme values"], disadvantages=["Loss of data"],
                    alternatives=["Winsorization"], expected_improvement="More stable distribution."
                )
            elif class_imbalance:
                 rec = Recommendation(
                    column=col_name, technique="SMOTE", confidence=80.0,
                    reason="High class imbalance detected.",
                    advantages=["Balances classes"], disadvantages=["Synthetic data might add noise"],
                    alternatives=["Undersampling"], expected_improvement="Better model performance on minority class."
                )

            # Layer 2: ML Model fallback or augmentation
            if rec is None:
                # Use ML model
                tech, conf = ml_model.predict(col)
                rec = Recommendation(
                    column=col_name, technique=tech, confidence=conf,
                    reason="AI recommended based on dataset profile.",
                    advantages=["Data-driven"], disadvantages=[], alternatives=[],
                    expected_improvement="Optimized feature quality."
                )

            recommendations.append(rec.dict())

        return recommendations
