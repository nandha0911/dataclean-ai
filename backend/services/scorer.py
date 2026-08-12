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
        
        # 1. Completeness
        completeness = max(0, (1 - (total_missing / total_cells))) * 100
        
        # 2. Consistency: check inconsistent categories / casing issues
        cols_with_inconsistent = sum(1 for col in columns if col.get('inconsistent_categories'))
        consistency = max(0, 100 - (cols_with_inconsistent / num_cols) * 100)
        
        # 3. Accuracy: outlier ratio
        total_outliers = sum(col.get('outliers_iqr', 0) for col in columns)
        accuracy = max(0, (1 - (total_outliers / total_cells))) * 100
        
        # 4. Uniqueness: check full dataset duplicate rows
        full_row_duplicates = analysis_dict.get('full_row_duplicates', 0)
        uniqueness = max(0, (1 - (full_row_duplicates / total_rows))) * 100 if total_rows > 0 else 100.0
        
        # 5. Validity: check constant or type errors
        invalid_cols = sum(1 for col in columns if col.get('constant') or col.get('possible_incorrect_types'))
        validity = max(0, 100 - (invalid_cols / num_cols) * 50)
        
        # 6. Integrity
        integrity = 100.0
        
        overall_score = (
            completeness * 0.3 +
            accuracy * 0.25 +
            consistency * 0.15 +
            uniqueness * 0.15 +
            validity * 0.1 +
            integrity * 0.05
        )
        
        explanations = {
            "completeness": f"Dataset is {completeness:.1f}% complete.",
            "accuracy": f"Found {total_outliers} outliers reducing accuracy.",
            "consistency": f"{cols_with_inconsistent} column(s) contain inconsistent category casing/whitespace.",
            "uniqueness": f"Found {full_row_duplicates} duplicate record(s) in dataset."
        }
        
        return {
            "overall_score": round(overall_score, 1),
            "completeness": round(completeness, 1),
            "consistency": round(consistency, 1),
            "accuracy": round(accuracy, 1),
            "uniqueness": round(uniqueness, 1),
            "validity": round(validity, 1),
            "integrity": round(integrity, 1),
            "explanations": explanations
        }
