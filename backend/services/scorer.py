from models.schemas import QualityScore

class QualityScorer:
    """
    Enterprise Multi-Dimensional Data Quality Scorer
    ================================================
    Computes rigorous, realistic data quality scores across 6 core DAMA dimensions:
    1. Completeness  (28% weight): Evaluates cell-level missingness, column defect rates, and broken record ratios.
    2. Accuracy      (22% weight): Evaluates outlier concentrations, impossible numbers, and extreme skewness.
    3. Consistency   (18% weight): Evaluates casing anomalies, trailing whitespace, and category typos.
    4. Uniqueness    (14% weight): Evaluates duplicate records, duplicate keys, and repeated observations.
    5. Validity      (12% weight): Evaluates mixed types, date format discrepancies, and constant columns.
    6. Integrity     (6% weight) : Evaluates multi-collinearity, near-zero variance, and noise.
    """

    def calculate_score(self, analysis_dict: dict, total_rows: int) -> dict:
        columns = analysis_dict.get('columns', [])
        if not columns or total_rows <= 0:
            return {
                "overall_score": 0.0,
                "completeness": 0.0,
                "consistency": 0.0,
                "accuracy": 0.0,
                "uniqueness": 0.0,
                "validity": 0.0,
                "integrity": 0.0,
                "explanations": {"error": "No columns or data available."}
            }

        num_cols = len(columns)
        total_cells = num_cols * total_rows

        # ── 1. Completeness (28% weight) ──────────────────────────────────────
        total_missing = sum(col.get('missing_count', 0) for col in columns)
        cols_with_missing = sum(1 for col in columns if col.get('missing_count', 0) > 0)
        max_col_missing_pct = max((col.get('missing_pct', 0.0) for col in columns), default=0.0)
        
        # Penalties: cell missingness + column missingness + max single column missing severity
        cell_comp = max(0.0, (1.0 - (total_missing / total_cells)) * 100.0)
        col_comp = max(0.0, (1.0 - (cols_with_missing / num_cols)) * 100.0)
        single_col_penalty = max_col_missing_pct * 0.5
        
        completeness = max(0.0, min(100.0, (cell_comp * 0.45) + (col_comp * 0.40) + (max(0.0, 100.0 - single_col_penalty) * 0.15)))

        # ── 2. Consistency (18% weight) ───────────────────────────────────────
        cols_with_inconsistent = sum(1 for col in columns if col.get('inconsistent_categories') or col.get('has_extra_whitespace'))
        cols_with_mixed = sum(1 for col in columns if col.get('mixed_type_detected') or col.get('numeric_string_count', 0) > 0)
        
        consistency_penalty = ((cols_with_inconsistent / num_cols) * 60.0) + ((cols_with_mixed / num_cols) * 35.0)
        consistency = max(0.0, min(100.0, 100.0 - consistency_penalty))

        # ── 3. Accuracy (22% weight) ──────────────────────────────────────────
        total_outliers = sum(col.get('outliers_iqr', 0) + col.get('outliers_zscore', 0) for col in columns)
        impossible_cols = sum(1 for col in columns if col.get('has_impossible_values') or col.get('has_negative'))
        skewed_cols = sum(1 for col in columns if col.get('skewness') is not None and abs(col.get('skewness', 0)) > 2.5)
        
        outlier_ratio = total_outliers / max(1, total_rows)
        accuracy_penalty = (min(1.0, outlier_ratio) * 45.0) + ((impossible_cols / num_cols) * 35.0) + ((skewed_cols / num_cols) * 20.0)
        accuracy = max(0.0, min(100.0, 100.0 - accuracy_penalty))

        # ── 4. Uniqueness (14% weight) ────────────────────────────────────────
        full_row_duplicates = analysis_dict.get('full_row_duplicates', 0)
        dup_ratio = (full_row_duplicates / total_rows) if total_rows > 0 else 0
        uniqueness_penalty = min(100.0, dup_ratio * 250.0 + (10.0 if full_row_duplicates > 0 else 0.0))
        uniqueness = max(0.0, min(100.0, 100.0 - uniqueness_penalty))

        # ── 5. Validity (12% weight) ──────────────────────────────────────────
        constant_cols = sum(1 for col in columns if col.get('constant'))
        invalid_type_cols = sum(1 for col in columns if col.get('possible_incorrect_types') or col.get('numeric_string_count', 0) > 0)
        date_issue_cols = sum(1 for col in columns if col.get('date_format_inconsistent') or col.get('has_future_dates'))
        
        validity_penalty = ((constant_cols / num_cols) * 50.0) + ((invalid_type_cols / num_cols) * 35.0) + ((date_issue_cols / num_cols) * 25.0)
        validity = max(0.0, min(100.0, 100.0 - validity_penalty))

        # ── 6. Integrity (6% weight) ──────────────────────────────────────────
        noisy_cols = sum(1 for col in columns if col.get('noisy') or col.get('near_zero_variance'))
        correlated_pairs = len(analysis_dict.get('correlations', []))
        integrity_penalty = ((noisy_cols / num_cols) * 35.0) + min(30.0, correlated_pairs * 8.0)
        integrity = max(0.0, min(100.0, 100.0 - integrity_penalty))

        # ── Weighted Overall Score ────────────────────────────────────────────
        overall_score = (
            completeness * 0.28 +
            accuracy     * 0.22 +
            consistency  * 0.18 +
            uniqueness   * 0.14 +
            validity     * 0.12 +
            integrity    * 0.06
        )

        explanations = {
            "completeness": f"{total_missing} missing value(s) across {cols_with_missing} column(s). Completeness: {completeness:.1f}%.",
            "accuracy": f"Found {total_outliers} outlier(s) and {impossible_cols} column(s) with boundary anomalies.",
            "consistency": f"{cols_with_inconsistent} column(s) have inconsistent casing, whitespace or categories.",
            "uniqueness": f"Found {full_row_duplicates} duplicate record(s) in dataset.",
            "validity": f"{constant_cols + invalid_type_cols} column(s) flagged for schema or data-type issues.",
            "integrity": f"{noisy_cols} noisy or zero-variance column(s) detected."
        }

        return {
            "overall_score": float(round(overall_score, 1)),
            "completeness": float(round(completeness, 1)),
            "consistency": float(round(consistency, 1)),
            "accuracy": float(round(accuracy, 1)),
            "uniqueness": float(round(uniqueness, 1)),
            "validity": float(round(validity, 1)),
            "integrity": float(round(integrity, 1)),
            "explanations": explanations
        }
