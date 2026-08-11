from models.schemas import QualityScore

class QualityScorer:
    def calculate_score(self, analysis_dict: dict, total_rows: int) -> dict:
        columns = analysis_dict.get('columns', [])
        if not columns:
            return {
                "overall_score": 0.0,
                "completeness": 0.0,
                "consistency": 0.0,
                "accuracy": 0.0,
                "uniqueness": 0.0,
                "validity": 0.0,
                "integrity": 0.0,
                "explanations": {"error": "No columns found."}
            }

        num_cols = len(columns)
        total_missing = sum(col.get('missing_count', 0) for col in columns)
        total_cells = num_cols * total_rows if total_rows > 0 else 1
        
        completeness = max(0, (1 - (total_missing / total_cells))) * 100
        
        consistency = 100.0 # Placeholder logic for consistency
        
        total_outliers = sum(col.get('outliers_iqr', 0) for col in columns)
        accuracy = max(0, (1 - (total_outliers / total_cells))) * 100
        
        uniqueness = 100.0 # Placeholder for duplicate rows effect
        
        validity = 100.0 # Placeholder for types correctness
        
        integrity = 100.0 # Placeholder for relationships
        
        overall_score = (completeness * 0.3 + accuracy * 0.3 + consistency * 0.1 + uniqueness * 0.1 + validity * 0.1 + integrity * 0.1)
        
        return {
            "overall_score": overall_score,
            "completeness": completeness,
            "consistency": consistency,
            "accuracy": accuracy,
            "uniqueness": uniqueness,
            "validity": validity,
            "integrity": integrity,
            "explanations": {
                "completeness": f"Dataset is {completeness:.1f}% complete.",
                "accuracy": f"Found {total_outliers} outliers reducing accuracy."
            }
        }
