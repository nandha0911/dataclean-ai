import os
import numpy as np
import pandas as pd
import xgboost as xgb
import joblib

class RecommendationMLModel:
    def __init__(self):
        self.model = None
        self.label_encoder = None
        self.feature_cols = [
            'missing_pct', 'skewness', 'kurtosis', 'dtype_encoded', 
            'cardinality', 'correlation', 'outlier_pct', 'variance'
        ]

    def _encode_dtype(self, dtype_str: str) -> int:
        mapping = {'numeric': 0, 'categorical': 1, 'datetime': 2, 'text': 3, 'boolean': 4}
        return mapping.get(dtype_str, 0)

    def generate_synthetic_training_data(self):
        np.random.seed(42)
        n_samples = 1000
        
        data = []
        for _ in range(n_samples):
            dtype = np.random.choice(['numeric', 'categorical', 'datetime', 'text'])
            missing_pct = np.random.uniform(0, 100)
            skewness = np.random.uniform(-5, 5)
            kurtosis = np.random.uniform(-3, 10)
            cardinality = np.random.randint(1, 1000)
            correlation = np.random.uniform(0, 1)
            outlier_pct = np.random.uniform(0, 20)
            variance = np.random.uniform(0, 1000)
            
            technique = "Mean Imputation"
            if dtype == 'numeric' and missing_pct > 30:
                technique = "KNN Imputation"
            elif dtype == 'numeric' and missing_pct <= 30 and abs(skewness) > 1:
                technique = "Median Imputation"
            elif dtype == 'categorical' and missing_pct > 0:
                technique = "Mode Imputation"
            elif dtype == 'numeric' and outlier_pct > 5:
                technique = "IQR Outlier Removal"
            elif cardinality > 100 and dtype == 'categorical':
                technique = "Target Encoding"
            elif cardinality <= 100 and dtype == 'categorical':
                technique = "One Hot Encoding"
            
            data.append({
                'missing_pct': missing_pct,
                'skewness': skewness,
                'kurtosis': kurtosis,
                'dtype_encoded': self._encode_dtype(dtype),
                'cardinality': cardinality,
                'correlation': correlation,
                'outlier_pct': outlier_pct,
                'variance': variance,
                'target': technique
            })
            
        df = pd.DataFrame(data)
        return df

    def train(self):
        df = self.generate_synthetic_training_data()
        X = df[self.feature_cols]
        y = df['target']
        
        from sklearn.preprocessing import LabelEncoder
        self.label_encoder = LabelEncoder()
        y_encoded = self.label_encoder.fit_transform(y)
        
        self.model = xgb.XGBClassifier(eval_metric='mlogloss', n_estimators=100, random_state=42)
        self.model.fit(X, y_encoded)

    def predict(self, column_profile: dict) -> tuple[str, float]:
        if self.model is None:
            self.train()
            
        features = np.array([[
            column_profile.get('missing_pct', 0),
            column_profile.get('skewness', 0) or 0,
            column_profile.get('kurtosis', 0) or 0,
            self._encode_dtype(column_profile.get('dtype', 'numeric')),
            column_profile.get('cardinality', 0),
            column_profile.get('correlation', 0),
            column_profile.get('outlier_pct', 0),
            column_profile.get('variance', 0)
        ]])
        
        probs = self.model.predict_proba(features)[0]
        pred_idx = np.argmax(probs)
        confidence = probs[pred_idx] * 100
        technique = self.label_encoder.inverse_transform([pred_idx])[0]
        
        return technique, float(confidence)

    def save_model(self, path: str):
        if self.model and self.label_encoder:
            joblib.dump((self.model, self.label_encoder), path)

    def load_model(self, path: str):
        """Load model from disk, training if not present."""
        if os.path.exists(path):
            self.model, self.label_encoder = joblib.load(path)
        else:
            self.train()
            self.save_model(path)

    def load_or_train(self) -> None:
        """Convenience method: load from default path or train fresh."""
        from core.config import settings
        path = settings.MODEL_PATH
        self.load_model(path)

    def is_ready(self) -> bool:
        """Check if model is trained and ready."""
        return self.model is not None and self.label_encoder is not None


ml_model = RecommendationMLModel()
