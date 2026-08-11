"""
AI Assistant Chatbot Service
==============================
RAG-style knowledge base chatbot that answers questions about
data cleaning techniques, imputation methods, and AI recommendations.
"""
from __future__ import annotations

import re
from difflib import SequenceMatcher


class AIAssistant:
    """Knowledge-base chatbot for data cleaning explanations."""

    KNOWLEDGE_BASE: dict[str, str] = {
        "mean imputation": (
            "Mean Imputation replaces missing values with the column average. "
            "✓ Best for: normally distributed data, low missingness (<5%). "
            "✗ Avoid when: data is skewed or has outliers — mean gets pulled toward extremes, "
            "reducing variance and distorting the distribution. "
            "Alternative: use Median Imputation for skewed data."
        ),
        "median imputation": (
            "Median Imputation replaces missing values with the column median (middle value). "
            "✓ Best for: skewed distributions, moderate missingness (5–30%), "
            "numeric columns with outliers. The median is robust — outliers don't affect it. "
            "✗ Limitation: ignores relationships between features (use KNN for that). "
            "Confidence: ~92% for skewed numeric columns."
        ),
        "mode imputation": (
            "Mode Imputation replaces missing values with the most frequent category/value. "
            "✓ Best for: categorical columns, low-to-moderate missingness. "
            "Simple and interpretable. "
            "✗ Limitation: amplifies the dominant class, may introduce bias if one category is very dominant."
        ),
        "knn imputation": (
            "KNN Imputation finds the K nearest neighbors (most similar rows based on other features) "
            "and uses their average/mode to fill the missing value. "
            "✓ Best for: correlated features, moderate missingness (<30%). Preserves distributions and feature relationships. "
            "✗ Limitation: computationally expensive O(n²), requires numeric features for distance calculation. "
            "Typical k=5. Use when features are strongly correlated."
        ),
        "mice": (
            "MICE (Multiple Imputation by Chained Equations) treats each column with missing values "
            "as a regression target and iteratively predicts missing values using other columns as predictors. "
            "✓ Best for: complex datasets with many missing columns, MAR (Missing At Random) data. "
            "Produces multiple imputed datasets → more statistically valid than single imputation. "
            "✗ Limitation: very computationally expensive. Not suitable for real-time pipelines."
        ),
        "random forest imputation": (
            "Random Forest Imputation uses a Random Forest model trained on non-missing rows "
            "to predict missing values. "
            "✓ Best for: high missingness (>30%), non-linear relationships, mixed data types. "
            "Handles interactions automatically. Confidence: ~85% for complex datasets. "
            "✗ Limitation: computationally heavy, can overfit if dataset is small."
        ),
        "forward fill": (
            "Forward Fill (ffill) propagates the last valid observation forward to fill missing values. "
            "✓ Best for: time-series data where the last known value is a good proxy for the missing one. "
            "✗ Limitation: only appropriate for sequential/ordered data, not random missing patterns."
        ),
        "backward fill": (
            "Backward Fill (bfill) uses the next valid observation to fill missing values. "
            "✓ Best for: time-series data. "
            "✗ Limitation: requires future values to be available, not suitable for forecasting contexts."
        ),
        "interpolation": (
            "Interpolation estimates missing values using surrounding values. "
            "Linear interpolation assumes uniform rate of change. "
            "✓ Best for: time-series, continuous numerical data with smooth trends. "
            "✗ Limitation: assumes linearity — may not capture sudden jumps or non-linear patterns."
        ),
        "winsorization": (
            "Winsorization caps extreme values at specified percentiles (e.g., 5th–95th percentile) "
            "instead of removing them. Values below the lower percentile → set to lower threshold; "
            "values above upper → set to upper threshold. "
            "✓ Best for: when outliers are real data points you can't remove. Retains sample size. "
            "✗ Limitation: modifies true extreme values artificially — may hide real phenomena."
        ),
        "iqr outlier": (
            "IQR Outlier Removal flags points below Q1 - 1.5×IQR or above Q3 + 1.5×IQR as outliers. "
            "IQR = Q3 - Q1 (interquartile range). "
            "✓ Non-parametric — works for any distribution, not just normal. "
            "✗ May be too aggressive for heavy-tailed distributions. Consider Winsorization instead."
        ),
        "z-score": (
            "Z-score Outlier Removal flags values with |z| > threshold (typically 3) as outliers. "
            "Z = (x - mean) / std. "
            "✓ Best for: normally distributed data. Simple to understand and implement. "
            "✗ Assumes normality — fails for skewed distributions. Use IQR method for non-normal data."
        ),
        "isolation forest": (
            "Isolation Forest detects anomalies by randomly partitioning data with decision trees. "
            "Outliers are isolated faster (require fewer splits) than normal points. "
            "✓ Best for: high-dimensional data, no distributional assumptions, multivariate outliers. "
            "Efficient: O(n log n). "
            "✗ Requires tuning of contamination parameter (estimated outlier fraction)."
        ),
        "local outlier factor": (
            "LOF (Local Outlier Factor) measures the local density deviation of a data point "
            "relative to its neighbors. Points in low-density regions relative to neighbors are outliers. "
            "✓ Best for: detecting outliers in clusters of varying densities. "
            "✗ Computationally expensive, sensitive to k (number of neighbors) parameter."
        ),
        "smote": (
            "SMOTE (Synthetic Minority Over-sampling Technique) creates synthetic minority class samples "
            "by interpolating between existing minority samples and their K nearest neighbors. "
            "✓ Best for: binary/multiclass imbalance ratio > 3:1. Improves classifier recall on minority class. "
            "✗ May create noisy samples in overlapping class regions. "
            "Always apply SMOTE only to training data, never test data."
        ),
        "adasyn": (
            "ADASYN (Adaptive Synthetic Sampling) is like SMOTE but generates more synthetic samples "
            "in harder-to-learn regions (where minority class is surrounded by majority class). "
            "✓ More adaptive than SMOTE for complex decision boundaries. "
            "✗ Can amplify noise in borderline regions."
        ),
        "one hot encoding": (
            "One-Hot Encoding creates binary (0/1) columns for each category. For N categories → N-1 columns (drop first to avoid multicollinearity). "
            "✓ Best for: nominal categories (<20 unique values), linear models, neural networks. "
            "No ordinal assumption implied. "
            "✗ Curse of dimensionality for high-cardinality features — use Target Encoding instead."
        ),
        "label encoding": (
            "Label Encoding converts categories to integers (A→0, B→1, C→2). "
            "✓ Best for: ordinal data (Low/Medium/High), tree-based models (XGBoost, Random Forest). "
            "✗ Implies ordering where none exists — avoid for nominal data with linear models."
        ),
        "target encoding": (
            "Target Encoding replaces each category with the mean of the target variable for that category. "
            "✓ Best for: high-cardinality categoricals (>20 unique values), gradient boosting models. "
            "Efficient — doesn't expand dimensions. "
            "✗ Risk of target leakage — always use cross-validation encoding (encode inside CV folds only)."
        ),
        "log transformation": (
            "Log Transformation applies log(x) to reduce right skewness. "
            "Compresses large values more than small ones, pulling the distribution toward normality. "
            "✓ Best for: right-skewed positive data (income, prices, population). "
            "✗ Cannot handle zero or negative values — use log(x+1) for zeros or Yeo-Johnson for negatives."
        ),
        "power transformation": (
            "Power Transformation (Box-Cox or Yeo-Johnson) applies a power function to make distributions more normal. "
            "Yeo-Johnson handles negative values too. Box-Cox requires strictly positive values. "
            "✓ More flexible than log transformation. Automatically finds the optimal power λ. "
            "✗ Less interpretable — transformed values lose their original units."
        ),
        "standard scaling": (
            "Standard Scaling (Z-score normalization) transforms features to mean=0, std=1: (x - mean) / std. "
            "✓ Required for: KNN, SVM, PCA, neural networks, logistic regression. "
            "✗ Does not bound values — outliers remain. Use Robust Scaler if outliers are present."
        ),
        "minmax scaling": (
            "MinMax Scaling maps all values to [0,1]: (x - min) / (max - min). "
            "✓ Good for: neural networks, algorithms requiring bounded input. "
            "✗ Very sensitive to outliers — one extreme value compresses all others. "
            "Use RobustScaler if outliers are present."
        ),
        "robust scaling": (
            "Robust Scaling uses median and IQR: (x - median) / IQR. "
            "✓ Best for: data with outliers that cannot be removed. Resistant to extreme values. "
            "The scaled features will have IQR = 1 and median ≈ 0. "
            "✗ Doesn't guarantee a specific range — values can be outside [0,1]."
        ),
        "pca": (
            "PCA (Principal Component Analysis) reduces dimensionality by finding orthogonal axes "
            "of maximum variance. Components are linear combinations of original features. "
            "✓ Best for: highly correlated features (multicollinearity), visualization, noise reduction. "
            "✗ Loses interpretability — components are not original features. "
            "Always scale before PCA (StandardScaler)."
        ),
        "variance threshold": (
            "Variance Threshold removes features with variance below a threshold. "
            "Constant or near-constant columns contribute no information to models. "
            "✓ Fast, simple, unsupervised feature selection. "
            "✗ Only considers each feature independently — doesn't capture interactions."
        ),
        "duplicate removal": (
            "Duplicate Removal deletes exact copy rows from the dataset. "
            "Duplicates can bias models by over-representing certain patterns. "
            "✓ Always safe to apply — exact duplicates add no information. "
            "✗ Fuzzy duplicates (nearly identical rows) are harder to detect automatically."
        ),
        "delete column": (
            "Deleting a column is recommended when: it's a constant (zero variance), "
            "it's a unique identifier (100% unique — causes overfitting), or it has >60% missing values. "
            "✓ Reduces noise and dimensionality. "
            "✗ Permanent — always back up data before deleting. Check business importance first."
        ),
    }

    def answer(self, question: str, context: str = "") -> tuple[str, list[str], float]:
        """
        Answer a question using the knowledge base.

        Parameters
        ----------
        question : str
            User's question.
        context : str
            Optional additional context (e.g., current column name, analysis data).

        Returns
        -------
        tuple[str, list[str], float]
            (answer_text, sources, confidence_0_to_1)
        """
        q = question.lower().strip()

        # Exact keyword matching (primary)
        matched_answers: list[str] = []
        matched_keys: list[str] = []

        for key, explanation in self.KNOWLEDGE_BASE.items():
            key_words = key.split()
            if all(word in q for word in key_words):
                matched_answers.append(explanation)
                matched_keys.append(key)

        if matched_answers:
            answer = "\n\n".join(matched_answers)
            confidence = min(0.95, 0.7 + 0.05 * len(matched_answers))
            return answer, matched_keys, confidence

        # Fuzzy fallback — find best partial match
        best_score = 0.0
        best_answer = ""
        best_key = ""

        for key, explanation in self.KNOWLEDGE_BASE.items():
            score = SequenceMatcher(None, q, key).ratio()
            # Also check if any key word appears
            if any(word in q for word in key.split() if len(word) > 3):
                score = max(score, 0.5)
            if score > best_score:
                best_score = score
                best_answer = explanation
                best_key = key

        if best_score > 0.35:
            return (
                f"[Closest match: {best_key.upper()}]\n\n{best_answer}",
                [best_key],
                best_score * 0.8,
            )

        # No match
        topics = ", ".join(list(self.KNOWLEDGE_BASE.keys())[:8]) + "..."
        return (
            f"I don't have specific information about '{question}' in my knowledge base. "
            f"Try asking about: {topics}",
            [],
            0.1,
        )
