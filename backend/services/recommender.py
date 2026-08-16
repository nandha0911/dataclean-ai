import math
from typing import List, Dict, Any

try:
    from models.schemas import Recommendation
except ImportError:
    pass
    
try:
    from models.recommendation_model import ml_model
except ImportError:
    pass

class AIRecommender:
    def __init__(self):
        pass

    def get_recommendations(self, analysis_result: Dict[str, Any]) -> List[Dict[str, Any]]:
        recommendations = []
        
        # Dataset-level rules
        full_row_duplicates = analysis_result.get('full_row_duplicates', 0)
        if full_row_duplicates > 0:
            recommendations.append(self._build_rec(
                column="dataset",
                technique="Duplicate Row Removal",
                confidence=99,
                reason=f"Found {full_row_duplicates} full row duplicates in the dataset.",
                advantages=["Reduces dataset size", "Prevents model bias towards duplicated records"],
                disadvantages=["Might lose legitimately identical events if no unique ID exists"],
                alternatives=[],
                expected_improvement="Cleaner dataset with only unique observations.",
                category="C. Duplicates"
            ))

        columns = analysis_result.get('columns', [])
        
        for col in columns:
            col_name = col.get('column_name', 'unknown')
            col_name_lower = col_name.lower()
            dtype = col.get('dtype', 'unknown')
            
            missing_count = col.get('missing_count', 0)
            missing_pct = col.get('missing_pct', 0.0)
            blank_count = col.get('blank_count', 0)
            missing_pattern = col.get('missing_pattern', '')
            
            duplicate_count = col.get('duplicate_count', 0)
            has_duplicate_values = col.get('has_duplicate_values', False)
            
            mixed_type_detected = col.get('mixed_type_detected', False)
            numeric_string_count = col.get('numeric_string_count', 0)
            
            has_negative = col.get('has_negative', False)
            zero_count = col.get('zero_count', 0)
            coefficient_of_variation = col.get('coefficient_of_variation', None)
            
            outliers_iqr = col.get('outliers_iqr', 0)
            outliers_zscore = col.get('outliers_zscore', 0)
            outliers_mad = col.get('outliers_mad', 0)
            
            rare_category_count = col.get('rare_category_count', 0)
            inconsistent_categories = col.get('inconsistent_categories', [])
            is_gender_column = col.get('is_gender_column', False)
            top_category_pct = col.get('top_category_pct', 0.0)
            cardinality = col.get('cardinality', 0.0)
            
            has_html_tags = col.get('has_html_tags', False)
            has_urls = col.get('has_urls', False)
            has_emails = col.get('has_emails', False)
            has_emojis = col.get('has_emojis', False)
            has_extra_whitespace = col.get('has_extra_whitespace', False)
            
            is_date_column = col.get('is_date_column', False)
            has_future_dates = col.get('has_future_dates', False)
            date_format_inconsistent = col.get('date_format_inconsistent', False)
            
            has_impossible_values = col.get('has_impossible_values', False)
            
            near_zero_variance = col.get('near_zero_variance', False)
            constant = col.get('constant', False)
            unique_identifier = col.get('unique_identifier', False)
            highly_correlated_with = col.get('highly_correlated_with', [])
            
            skewness = col.get('skewness', None)
            
            class_imbalance = col.get('class_imbalance', False)
            
            noisy = col.get('noisy', False)

            # A. Data Profiling (Always applied)
            unique_count = col.get('unique_count', 0)
            recommendations.append(self._build_rec(
                column=col_name,
                technique="Data Profiling Summary",
                confidence=100,
                reason=f"Standard profiling for {col_name}.",
                advantages=["Provides quick overview of column statistics"],
                disadvantages=[],
                alternatives=[],
                expected_improvement=f"Dtype: {dtype}, Unique: {unique_count}, Cardinality: {cardinality}",
                category="A. Data Profiling"
            ))

            # B. Missing Data
            if blank_count > 0:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Empty String Detection",
                    confidence=97,
                    reason=f"Column has {blank_count} empty strings acting as missing values.",
                    advantages=["Properly identifies missing data hidden as blanks"],
                    disadvantages=[],
                    alternatives=[],
                    expected_improvement="Better missing value handling.",
                    category="B. Missing Data"
                ))
                
            if dtype == 'numeric':
                if 0 < missing_pct < 5:
                    recommendations.append(self._build_rec(
                        column=col_name,
                        technique="Mean Imputation",
                        confidence=95,
                        reason=f"Missing percentage is low ({missing_pct}%). Mean imputation is efficient.",
                        advantages=["Simple and fast"],
                        disadvantages=["Can be sensitive to outliers"],
                        alternatives=["Median Imputation"],
                        expected_improvement="Complete dataset without losing rows.",
                        category="B. Missing Data"
                    ))
                elif 5 <= missing_pct <= 30 and skewness is not None and abs(skewness) > 1:
                    recommendations.append(self._build_rec(
                        column=col_name,
                        technique="Median Imputation",
                        confidence=92,
                        reason=f"Moderate missing data ({missing_pct}%) and skewed distribution.",
                        advantages=["Robust to outliers"],
                        disadvantages=["Ignores feature correlations"],
                        alternatives=["KNN Imputation"],
                        expected_improvement="Complete data without skewing the distribution.",
                        category="B. Missing Data"
                    ))
                elif 30 < missing_pct <= 50:
                    recommendations.append(self._build_rec(
                        column=col_name,
                        technique="KNN Imputation",
                        confidence=88,
                        reason=f"High missing data ({missing_pct}%). KNN utilizes feature similarities.",
                        advantages=["Captures complex relationships"],
                        disadvantages=["Computationally expensive"],
                        alternatives=["MICE Imputation"],
                        expected_improvement="More accurate imputation.",
                        category="B. Missing Data"
                    ))
                    recommendations.append(self._build_rec(
                        column=col_name,
                        technique="MICE Imputation",
                        confidence=85,
                        reason=f"High missing data ({missing_pct}%). MICE models each feature conditionally.",
                        advantages=["Statistically robust for multiple imputation"],
                        disadvantages=["Slow on large datasets"],
                        alternatives=["KNN Imputation"],
                        expected_improvement="Robust statistical preservation.",
                        category="B. Missing Data"
                    ))

            if missing_pct > 50:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Delete Column",
                    confidence=70,
                    reason=f"Over 50% of data is missing ({missing_pct}%).",
                    advantages=["Removes a largely uninformative feature"],
                    disadvantages=["Might lose hidden signals"],
                    alternatives=["Advanced Imputation"],
                    expected_improvement="Reduced noise.",
                    category="B. Missing Data"
                ))
                
            if dtype == 'categorical' and missing_count > 0:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Mode Imputation",
                    confidence=90,
                    reason="Categorical column has missing values.",
                    advantages=["Preserves category mode"],
                    disadvantages=["May alter category frequencies"],
                    alternatives=["Create 'Unknown' category"],
                    expected_improvement="Completes categorical feature.",
                    category="B. Missing Data"
                ))
                
            if missing_count > 0:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Missing Indicator Variable",
                    confidence=75,
                    reason="Adding a binary indicator can capture patterns in missingness.",
                    advantages=["Preserves info about missingness"],
                    disadvantages=["Increases dimensionality"],
                    alternatives=[],
                    expected_improvement="Models can learn from missingness.",
                    category="B. Missing Data"
                ))
                
            if missing_pattern == 'structured':
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Forward Fill",
                    confidence=82,
                    reason="Missing data exhibits a structured pattern (e.g., time series).",
                    advantages=["Maintains temporal consistency"],
                    disadvantages=["May propagate errors"],
                    alternatives=["Backward Fill", "Interpolation"],
                    expected_improvement="Fills gaps logically.",
                    category="B. Missing Data"
                ))

            # C. Duplicates
            if has_duplicate_values:
                if dtype == 'text':
                    recommendations.append(self._build_rec(
                        column=col_name,
                        technique="Fuzzy Deduplication",
                        confidence=80,
                        reason="Text column has duplicate or near-duplicate values.",
                        advantages=["Catches typos and slight variations"],
                        disadvantages=["Computationally heavy"],
                        alternatives=["Exact Match Deduplication"],
                        expected_improvement="Standardized text entries.",
                        category="C. Duplicates"
                    ))
                elif dtype == 'categorical':
                    recommendations.append(self._build_rec(
                        column=col_name,
                        technique="Category Standardization",
                        confidence=85,
                        reason="Categorical duplicates might indicate slight misspellings.",
                        advantages=["Cleaner category groups"],
                        disadvantages=["Manual review often needed"],
                        alternatives=[],
                        expected_improvement="Consistent categorical encoding.",
                        category="C. Duplicates"
                    ))

            # D. Data Types
            if mixed_type_detected:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Auto Type Cast",
                    confidence=90,
                    reason="Column contains mixed data types.",
                    advantages=["Ensures consistent processing"],
                    disadvantages=["Might coerce valid data to NaN"],
                    alternatives=[],
                    expected_improvement="Uniform data type.",
                    category="D. Data Types"
                ))
            if numeric_string_count > 0:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Numeric String Conversion",
                    confidence=92,
                    reason=f"Found {numeric_string_count} numeric values stored as strings.",
                    advantages=["Allows mathematical operations"],
                    disadvantages=["Might fail on non-standard numeric formats"],
                    alternatives=[],
                    expected_improvement="Proper numeric analysis possible.",
                    category="D. Data Types"
                ))
            if is_date_column and dtype != 'datetime':
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="DateTime Conversion",
                    confidence=93,
                    reason="Column looks like dates but is not a datetime object.",
                    advantages=["Enables time-based analysis"],
                    disadvantages=["Fails on ambiguous dates"],
                    alternatives=[],
                    expected_improvement="Native datetime support.",
                    category="D. Data Types"
                ))

            # E. Numerical
            if has_negative and any(kw in col_name_lower for kw in ['age', 'count', 'price']):
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Remove Negative Values",
                    confidence=95,
                    reason=f"Column '{col_name}' contains illogical negative values.",
                    advantages=["Fixes impossible real-world values"],
                    disadvantages=["Loses rows"],
                    alternatives=["Absolute Value Conversion"],
                    expected_improvement="Logical consistency.",
                    category="E. Numerical"
                ))
            if zero_count > 0:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Zero Value Validation",
                    confidence=75,
                    reason=f"Column has {zero_count} zeros. May represent missing data.",
                    advantages=["Identifies hidden missing values"],
                    disadvantages=["Zeros might be valid"],
                    alternatives=[],
                    expected_improvement="Improved data semantics.",
                    category="E. Numerical"
                ))
            if coefficient_of_variation is not None and coefficient_of_variation > 100:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Robust Scaling",
                    confidence=85,
                    reason=f"High variance (CV > 100).",
                    advantages=["Reduces impact of large spread"],
                    disadvantages=["Changes data scale"],
                    alternatives=["Log Transform"],
                    expected_improvement="More stable model training.",
                    category="E. Numerical"
                ))

            # F. Outliers
            if outliers_iqr > 0:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="IQR Outlier Removal",
                    confidence=87,
                    reason=f"Detected {outliers_iqr} outliers using IQR.",
                    advantages=["Robust to extreme values"],
                    disadvantages=["May drop valid extreme events"],
                    alternatives=["Winsorization"],
                    expected_improvement="Reduced noise.",
                    category="F. Outliers"
                ))
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Winsorization",
                    confidence=83,
                    reason=f"Detected {outliers_iqr} outliers using IQR.",
                    advantages=["Caps extreme values without losing rows"],
                    disadvantages=["Distorts tail distributions"],
                    alternatives=["IQR Outlier Removal"],
                    expected_improvement="Retains data while managing outliers.",
                    category="F. Outliers"
                ))
                if outliers_iqr > 5:
                    recommendations.append(self._build_rec(
                        column=col_name,
                        technique="Isolation Forest",
                        confidence=82,
                        reason="Multiple outliers detected, Isolation Forest is effective for multivariate context.",
                        advantages=["Finds non-linear anomalies"],
                        disadvantages=["Harder to interpret"],
                        alternatives=["Local Outlier Factor"],
                        expected_improvement="Sophisticated anomaly detection.",
                        category="F. Outliers"
                    ))
            if outliers_zscore > 0:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Z-Score Outlier Removal",
                    confidence=85,
                    reason=f"Detected {outliers_zscore} outliers using Z-score.",
                    advantages=["Standard statistical method"],
                    disadvantages=["Assumes normal distribution"],
                    alternatives=["IQR Outlier Removal"],
                    expected_improvement="Standardized data.",
                    category="F. Outliers"
                ))
            if outliers_mad > 0:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="MAD Outlier Removal",
                    confidence=88,
                    reason=f"Detected {outliers_mad} outliers using MAD.",
                    advantages=["Very robust for skewed data"],
                    disadvantages=["Computationally more complex"],
                    alternatives=["IQR Outlier Removal"],
                    expected_improvement="Effective on non-normal distributions.",
                    category="F. Outliers"
                ))

            # G. Categorical
            if rare_category_count > 0:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Rare Category Grouping",
                    confidence=85,
                    reason=f"Found {rare_category_count} rare categories.",
                    advantages=["Reduces dimensionality", "Improves model generalization"],
                    disadvantages=["Loss of granular information"],
                    alternatives=[],
                    expected_improvement="More stable categorical features.",
                    category="G. Categorical"
                ))
            if inconsistent_categories:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Category Standardization",
                    confidence=96,
                    reason="Inconsistent capitalization or formatting detected.",
                    advantages=["Consolidates fragmented groups"],
                    disadvantages=[],
                    alternatives=[],
                    expected_improvement="Unified categories.",
                    category="G. Categorical"
                ))
            if is_gender_column:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Gender Standardization",
                    confidence=98,
                    reason="Identified as a gender column with potential variations.",
                    advantages=["Standardizes M/F/Male/Female/etc."],
                    disadvantages=[],
                    alternatives=[],
                    expected_improvement="Clean gender variables.",
                    category="G. Categorical"
                ))
            if top_category_pct is not None and top_category_pct > 90:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Class Imbalance - Check Target",
                    confidence=80,
                    reason=f"Top category dominates ({top_category_pct}%).",
                    advantages=["Highlights potential bias"],
                    disadvantages=[],
                    alternatives=[],
                    expected_improvement="Awareness of extreme imbalance.",
                    category="G. Categorical"
                ))

            # H. Text
            if has_html_tags:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="HTML Tag Removal",
                    confidence=98,
                    reason="Contains HTML tags.",
                    advantages=["Cleans text for NLP"],
                    disadvantages=[],
                    alternatives=[],
                    expected_improvement="Raw text without markup.",
                    category="H. Text"
                ))
            if has_urls:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="URL Removal",
                    confidence=96,
                    reason="Contains URLs.",
                    advantages=["Removes noisy links"],
                    disadvantages=["Loses URL context"],
                    alternatives=["URL Extraction"],
                    expected_improvement="Cleaner text.",
                    category="H. Text"
                ))
            if has_emails:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Email Removal or Extraction",
                    confidence=94,
                    reason="Contains emails.",
                    advantages=["Protects PII"],
                    disadvantages=[],
                    alternatives=[],
                    expected_improvement="No raw emails in text.",
                    category="H. Text"
                ))
            if has_emojis:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Emoji Handling / Unicode Normalization",
                    confidence=88,
                    reason="Contains emojis or special unicodes.",
                    advantages=["Standardizes text representation"],
                    disadvantages=["Might lose sentiment information"],
                    alternatives=[],
                    expected_improvement="Normalized string data.",
                    category="H. Text"
                ))
            if has_extra_whitespace:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Whitespace Removal",
                    confidence=97,
                    reason="Contains extra whitespaces.",
                    advantages=["Ensures exact matches work"],
                    disadvantages=[],
                    alternatives=[],
                    expected_improvement="Trimmed, neat text.",
                    category="H. Text"
                ))

            # I. Date/Time
            if is_date_column:
                if not has_future_dates:
                    recommendations.append(self._build_rec(
                        column=col_name,
                        technique="Date Format Standardization",
                        confidence=90,
                        reason="Standardizing date formats ensures consistency.",
                        advantages=["Easier querying and parsing"],
                        disadvantages=[],
                        alternatives=[],
                        expected_improvement="Consistent dates.",
                        category="I. Date/Time"
                    ))
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Date Component Extraction",
                    confidence=80,
                    reason="Can extract year, month, and day features.",
                    advantages=["Provides granular features for ML"],
                    disadvantages=["Increases dimensionality"],
                    alternatives=[],
                    expected_improvement="More expressive date features.",
                    category="I. Date/Time"
                ))

            if has_future_dates:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Future Date Detection",
                    confidence=92,
                    reason="Contains dates in the future which might be invalid.",
                    advantages=["Catches erroneous entries"],
                    disadvantages=[],
                    alternatives=[],
                    expected_improvement="Valid historical timeline.",
                    category="I. Date/Time"
                ))
            if date_format_inconsistent:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Date Format Standardization",
                    confidence=94,
                    reason="Mixed date formats detected.",
                    advantages=["Unifies parsed dates"],
                    disadvantages=[],
                    alternatives=[],
                    expected_improvement="A single unified date format.",
                    category="I. Date/Time"
                ))

            # K. Validation
            if has_impossible_values:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Impossible Value Detection",
                    confidence=95,
                    reason="Values fall outside logically possible ranges.",
                    advantages=["Maintains data integrity"],
                    disadvantages=[],
                    alternatives=[],
                    expected_improvement="Removal or fixing of invalid data.",
                    category="K. Validation"
                ))

            # L. Inconsistent
            if inconsistent_categories:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Text Standardization",
                    confidence=96,
                    reason="Text categories have inconsistent casing or spacing.",
                    advantages=["Reduces duplicate fragmented categories"],
                    disadvantages=[],
                    alternatives=[],
                    expected_improvement="Uniform categorical values.",
                    category="L. Inconsistent"
                ))

            # N. Feature
            if near_zero_variance:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Near-Zero Variance Removal",
                    confidence=88,
                    reason="Column has almost no variance.",
                    advantages=["Reduces noise and dimensionality"],
                    disadvantages=["Might discard a rare but important signal"],
                    alternatives=[],
                    expected_improvement="More robust models.",
                    category="N. Feature"
                ))
            if constant:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Delete Column",
                    confidence=99,
                    reason="Column has only a single constant value.",
                    advantages=["Removes useless feature"],
                    disadvantages=[],
                    alternatives=[],
                    expected_improvement="Smaller, cleaner dataset.",
                    category="N. Feature"
                ))
            if unique_identifier:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Delete Column (ID column)",
                    confidence=95,
                    reason="Column appears to be a unique ID, which ML models shouldn't use.",
                    advantages=["Prevents overfitting to IDs"],
                    disadvantages=["Loses traceability if not stored elsewhere"],
                    alternatives=["Set as Index"],
                    expected_improvement="Better generalization.",
                    category="N. Feature"
                ))
            if highly_correlated_with and len(highly_correlated_with) > 0:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Correlated Feature Removal",
                    confidence=82,
                    reason=f"Highly correlated with: {', '.join(highly_correlated_with)}.",
                    advantages=["Reduces multicollinearity"],
                    disadvantages=["Might drop a feature that is slightly better"],
                    alternatives=["PCA"],
                    expected_improvement="Simpler, less redundant model.",
                    category="N. Feature"
                ))

            # O. Transformation
            if skewness is not None:
                if abs(skewness) > 2:
                    recommendations.append(self._build_rec(
                        column=col_name,
                        technique="Yeo-Johnson Transformation",
                        confidence=87,
                        reason=f"Highly skewed distribution (skewness = {skewness:.2f}).",
                        advantages=["Handles positive and negative values", "Normalizes distribution"],
                        disadvantages=["Less interpretable"],
                        alternatives=["Log Transformation", "Min-Max Normalization"],
                        expected_improvement="More normally distributed data.",
                        category="O. Transformation"
                    ))
                elif abs(skewness) > 1:
                    recommendations.append(self._build_rec(
                        column=col_name,
                        technique="Log Transformation",
                        confidence=85,
                        reason=f"Skewed distribution (skewness = {skewness:.2f}).",
                        advantages=["Normalizes distribution"],
                        disadvantages=["Requires strictly positive values usually"],
                        alternatives=["Yeo-Johnson Transformation"],
                        expected_improvement="Reduced skewness.",
                        category="O. Transformation"
                    ))
            if dtype == 'numeric':
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Min-Max Normalization",
                    confidence=78,
                    reason="Numeric data might benefit from scaling.",
                    advantages=["Binds data to [0, 1] range"],
                    disadvantages=["Sensitive to outliers"],
                    alternatives=["Standard Scaling"],
                    expected_improvement="Uniform feature scaling.",
                    category="O. Transformation"
                ))

            # Q. Imbalanced
            if class_imbalance:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="SMOTE",
                    confidence=80,
                    reason="Target classes are highly imbalanced.",
                    advantages=["Generates synthetic samples to balance classes"],
                    disadvantages=["Can introduce noise"],
                    alternatives=["Random Oversampling", "Undersampling"],
                    expected_improvement="Balanced class distribution for training.",
                    category="Q. Imbalanced"
                ))
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Random Oversampling",
                    confidence=75,
                    reason="Target classes are highly imbalanced.",
                    advantages=["Simple to implement"],
                    disadvantages=["Can cause overfitting"],
                    alternatives=["SMOTE"],
                    expected_improvement="Balanced class distribution.",
                    category="Q. Imbalanced"
                ))

            # R. Noise
            if noisy:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Moving Average Smoothing",
                    confidence=75,
                    reason="Signal appears noisy.",
                    advantages=["Smooths out random fluctuations"],
                    disadvantages=["Lags behind sharp changes"],
                    alternatives=["Rolling Median Smoothing"],
                    expected_improvement="Clearer underlying trend.",
                    category="R. Noise"
                ))
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Rolling Median Smoothing",
                    confidence=72,
                    reason="Signal appears noisy.",
                    advantages=["Robust to spikes/outliers"],
                    disadvantages=["Computationally heavier"],
                    alternatives=["Moving Average Smoothing"],
                    expected_improvement="Smooth data preserving edges.",
                    category="R. Noise"
                ))

            # T. Encoding
            if dtype == 'categorical':
                if cardinality < 0.05:
                    recommendations.append(self._build_rec(
                        column=col_name,
                        technique="One-Hot Encoding",
                        confidence=90,
                        reason="Low cardinality categorical feature.",
                        advantages=["No artificial ordering assumed"],
                        disadvantages=["Increases dimensionality"],
                        alternatives=["Label Encoding"],
                        expected_improvement="Machine readable categorical feature.",
                        category="T. Encoding"
                    ))
                elif 0.05 <= cardinality < 0.5:
                    recommendations.append(self._build_rec(
                        column=col_name,
                        technique="Label Encoding",
                        confidence=85,
                        reason="Moderate cardinality categorical feature.",
                        advantages=["Keeps dimensionality low"],
                        disadvantages=["Implies ordinal relationship"],
                        alternatives=["Frequency Encoding"],
                        expected_improvement="Encoded features without massive expansion.",
                        category="T. Encoding"
                    ))
                elif cardinality >= 0.5:
                    recommendations.append(self._build_rec(
                        column=col_name,
                        technique="Frequency Encoding",
                        confidence=83,
                        reason="High cardinality categorical feature.",
                        advantages=["Captures category prevalence without inflating dimensions"],
                        disadvantages=["Collisions if frequencies are equal"],
                        alternatives=["Target Encoding"],
                        expected_improvement="Efficient high-cardinality representation.",
                        category="T. Encoding"
                    ))

            # V. Privacy
            if has_emails or 'email' in col_name_lower:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Email Removal or Masking",
                    confidence=90,
                    reason="Contains email addresses.",
                    advantages=["Prevents PII leakage"],
                    disadvantages=["Loses communication identifier"],
                    alternatives=[],
                    expected_improvement="Anonymized data.",
                    category="V. Privacy"
                ))
            if any(kw in col_name_lower for kw in ['phone', 'mobile', 'ssn', 'national_id']):
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="PII Data Masking",
                    confidence=95,
                    reason="Column name suggests highly sensitive PII.",
                    advantages=["Compliance with data privacy laws"],
                    disadvantages=[],
                    alternatives=["Hashing"],
                    expected_improvement="Secure, compliant dataset.",
                    category="V. Privacy"
                ))
            if 'name' in col_name_lower and cardinality > 0.5:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Pseudonymization",
                    confidence=80,
                    reason="Column appears to contain names (high cardinality PII).",
                    advantages=["Anonymizes individuals while retaining structure"],
                    disadvantages=["Requires mapping storage for reversal"],
                    alternatives=["Data Masking"],
                    expected_improvement="Privacy preserving identifiers.",
                    category="V. Privacy"
                ))

            # W. Time-series
            if is_date_column and has_duplicate_values:
                recommendations.append(self._build_rec(
                    column=col_name,
                    technique="Duplicate Timestamp Removal",
                    confidence=95,
                    reason="Multiple entries at the exact same timestamp.",
                    advantages=["Ensures strict chronological progression"],
                    disadvantages=["Might drop concurrent valid events"],
                    alternatives=["Timestamp Aggregation"],
                    expected_improvement="Clean time-series.",
                    category="W. Time-series"
                ))

        return recommendations

    def _build_rec(self, column: str, technique: str, confidence: int, reason: str, 
                   advantages: List[str], disadvantages: List[str], alternatives: List[str], 
                   expected_improvement: str, category: str) -> Dict[str, Any]:
        return {
            "column": column,
            "technique": technique,
            "confidence": confidence,
            "reason": reason,
            "advantages": advantages,
            "disadvantages": disadvantages,
            "alternatives": alternatives,
            "expected_improvement": expected_improvement,
            "category": category
        }
