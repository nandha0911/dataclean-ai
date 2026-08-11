# 🤖 AI-Powered Data Cleaning & Imputation Recommendation Engine

<div align="center">

```
╔═══════════════════════════════════════════════════════════════╗
║  ██████╗  █████╗ ████████╗ █████╗  ██████╗██╗     ███████╗  ║
║  ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔════╝██║     ██╔════╝  ║
║  ██║  ██║███████║   ██║   ███████║██║     ██║     █████╗    ║
║  ██║  ██║██╔══██║   ██║   ██╔══██║██║     ██║     ██╔══╝    ║
║  ██████╔╝██║  ██║   ██║   ██║  ██║╚██████╗███████╗███████╗  ║
║  ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚══════╝╚══════╝  ║
║           CLEAN.AI — Retro Intelligence Terminal              ║
╚═══════════════════════════════════════════════════════════════╝
```

![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react)
![XGBoost](https://img.shields.io/badge/XGBoost-ML-FF6600?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A production-ready, AI-powered system that automatically detects 13 types of data quality issues, recommends 30+ preprocessing strategies, and cleans datasets with one click — all wrapped in a stunning Retro CRT terminal UI.**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Docs](#-api-documentation) • [Screenshots](#-screenshots)

</div>

---

## ✨ Features

### 🔍 Issue Detection (13 Types)
| # | Issue | Description |
|---|-------|-------------|
| 1 | Missing Values | Count, %, type (MCAR/MAR/MNAR) |
| 2 | Duplicate Records | Full row duplicates |
| 3 | Outliers | IQR + Z-score methods |
| 4 | Incorrect Data Types | Auto-detection & suggestion |
| 5 | Inconsistent Categories | Case mismatches, typos |
| 6 | Impossible Values | Negative ages, future dates |
| 7 | Skewed Distributions | Skewness & kurtosis analysis |
| 8 | Highly Correlated Features | Pearson/Spearman correlation |
| 9 | Constant Columns | Zero variance detection |
| 10 | Unique Identifier Columns | High cardinality detection |
| 11 | Noisy Columns | High variance relative to range |
| 12 | Class Imbalance | Minority class ratio |
| 13 | Multicollinearity | VIF analysis |

### 🤖 AI Recommendation Engine (30+ Strategies)

**Imputation:** Mean, Median, Mode, KNN, Regression, MICE, Random Forest, Forward Fill, Backward Fill, Interpolation  
**Outlier Handling:** Z-score Removal, IQR Removal, Winsorization, Isolation Forest, LOF  
**Scaling:** Robust Scaling, Standard Scaling, MinMax Scaling  
**Encoding:** One-Hot, Label, Ordinal, Binary, Target Encoding  
**Transformation:** Log, Power (Yeo-Johnson/Box-Cox), Normalization  
**Resampling:** SMOTE, ADASYN  
**Dimensionality:** PCA, Feature Selection, Variance Threshold  
**Cleaning:** Duplicate Removal, Delete Rows, Delete Column  

### 📊 Data Quality Score (0–100)
- **Completeness** — Missing value ratio
- **Consistency** — Format & category uniformity
- **Accuracy** — Outlier-free ratio
- **Uniqueness** — Duplicate-free ratio
- **Validity** — Type correctness
- **Integrity** — Referential integrity

### 📈 Visualizations
- Missing Value Heatmap
- Correlation Matrix
- Distribution Plots (Histogram + KDE)
- Box Plots with Outlier Markers
- Scatter Plots
- Class Balance Charts
- Quality Score Dashboard (Radar + Doughnut)

### 🎨 Retro CRT UI
- 1980s synthwave terminal aesthetic
- CRT scanline overlay with flicker animation
- Pixel fonts (Press Start 2P, VT323)
- Neon glow effects (green, amber, cyan, magenta)
- Framer Motion micro-animations
- Terminal typewriter text effects
- Retro progress bars and blinking cursors

### 🤖 AI Chatbot (RAG-style)
Answers questions like:
- "Why did you choose Median imputation?"
- "How does KNN imputation work?"
- "What are the disadvantages of SMOTE?"

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- npm 9+

### Option 1: Local Development (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/yourname/ai-data-cleaner.git
cd ai-data-cleaner

# 2. Start the Backend
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 3. Start the Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Option 2: Docker Compose

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Upload   │ │ Analysis │ │ Charts   │ │ AI Chatbot   │  │
│  │ Zone     │ │ Dashboard│ │ (Chart.js│ │ (RAG-style)  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ Axios HTTP / REST API
┌───────────────────────▼─────────────────────────────────────┐
│                   FastAPI Backend                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              API Routes Layer                       │   │
│  │  /upload  /analyze  /recommend  /clean  /download  │   │
│  └──────────┬──────────────────┬───────────────────────┘   │
│             │                  │                            │
│  ┌──────────▼──────┐  ┌───────▼────────────────────────┐  │
│  │  Data Analyzer  │  │    AI Recommendation Engine    │  │
│  │  (13 detectors) │  │  Rule Engine + XGBoost ML Model│  │
│  └──────────┬──────┘  └───────────────────────────────┘  │
│             │                                              │
│  ┌──────────▼────────────────────────────────────────────┐ │
│  │            Data Cleaning Engine (30+ ops)             │ │
│  └──────────┬────────────────────────────────────────────┘ │
│             │                                              │
│  ┌──────────▼──────┐  ┌─────────────┐  ┌──────────────┐  │
│  │  SQLite (DB)    │  │  File Store │  │  PDF Reports │  │
│  └─────────────────┘  └─────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
ai-data-cleaner/
├── 📁 backend/
│   ├── main.py                    # FastAPI entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── 📁 api/routes/
│   │   ├── upload.py              # POST /upload
│   │   ├── analyze.py             # GET /analyze/{id}
│   │   ├── recommend.py           # GET /recommend/{id}
│   │   ├── clean.py               # POST /clean/{id}
│   │   ├── download.py            # GET /download/{id}
│   │   └── report.py              # GET /report, /chat, /visualize
│   ├── 📁 core/
│   │   ├── config.py              # App settings
│   │   └── database.py            # SQLAlchemy + SQLite
│   ├── 📁 models/
│   │   ├── schemas.py             # Pydantic models
│   │   └── recommendation_model.py # ML model (XGBoost)
│   ├── 📁 services/
│   │   ├── analyzer.py            # 13 issue detectors
│   │   ├── recommender.py         # AI recommendation engine
│   │   ├── cleaner.py             # 30+ cleaning strategies
│   │   ├── visualizer.py          # Chart data generation
│   │   ├── scorer.py              # Quality scoring
│   │   ├── reporter.py            # PDF generation
│   │   └── chatbot.py             # RAG chatbot
│   ├── 📁 utils/
│   │   ├── file_utils.py
│   │   └── helpers.py
│   ├── 📁 datasets/               # Uploaded files
│   └── 📁 reports/                # Generated reports
│
├── 📁 frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   ├── Dockerfile
│   ├── nginx.conf
│   └── 📁 src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css              # Retro CRT theme
│       ├── 📁 pages/              # 12 pages
│       ├── 📁 components/         # Reusable components
│       │   ├── layout/            # Sidebar, TopBar, StatusBar
│       │   ├── ui/                # RetroCard, Button, etc.
│       │   └── charts/            # Chart components
│       ├── 📁 store/              # Zustand state
│       ├── 📁 hooks/              # Custom hooks
│       └── 📁 api/                # Axios client
│
├── 📁 .github/workflows/
│   └── ci.yml                     # GitHub Actions CI/CD
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Documentation

### Base URL: `http://localhost:8000`

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/api/upload` | Upload dataset (CSV/Excel/JSON) | `multipart/form-data` |
| `GET` | `/api/analyze/{dataset_id}` | Run full analysis | — |
| `GET` | `/api/recommend/{dataset_id}` | Get AI recommendations | — |
| `POST` | `/api/clean/{dataset_id}` | Apply cleaning operations | `CleaningRequest` |
| `GET` | `/api/download/{dataset_id}` | Download cleaned file | `?type=cleaned\|report` |
| `GET` | `/api/report/{dataset_id}` | Generate PDF report | — |
| `GET` | `/api/visualize/{dataset_id}` | Get chart data | — |
| `POST` | `/api/chat` | Ask AI chatbot | `{question, context}` |
| `GET` | `/health` | Health check | — |

Interactive docs: http://localhost:8000/docs

### Example: Upload Response
```json
{
  "dataset_id": "abc123",
  "filename": "sales_data.csv",
  "rows": 10000,
  "columns": 15,
  "preview": [...],
  "status": "uploaded"
}
```

### Example: Recommendation
```json
{
  "column": "Age",
  "problem": "15.3% missing values | Distribution is right-skewed (skewness=2.1)",
  "recommendation": "Median Imputation",
  "confidence": 0.94,
  "reason": "Skewed numeric column with moderate missingness (15.3%). Median is robust to skewness unlike Mean.",
  "advantages": ["Robust to outliers", "Preserves central tendency", "Simple and interpretable"],
  "disadvantages": ["Ignores relationships between features", "May underestimate variance"],
  "alternatives": ["KNN Imputation", "MICE", "Regression Imputation"],
  "expected_improvement": "Completeness ↑ 15.3%, Quality Score ↑ ~8 points"
}
```

---

## 🧠 ML Model Details

The recommendation engine uses a **two-layer hybrid approach**:

### Layer 1: Rule Engine
Domain-expert rules map column profiles to cleaning strategies based on:
- Data type (numeric/categorical/datetime)
- Missing value percentage
- Statistical properties (skewness, kurtosis)
- Cardinality ratio
- Outlier percentage

### Layer 2: XGBoost Classifier
Trained on **1,200+ synthetic column profiles** with features:
- `missing_pct`, `skewness`, `kurtosis`
- `dtype_encoded` (0=numeric, 1=categorical, 2=datetime)
- `cardinality_ratio`, `correlation_max`, `outlier_pct`, `variance`

Output: `(technique_label, confidence_score)`

Self-trains on first startup — no manual training required.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + U` | Open Upload page |
| `Ctrl + A` | Run Analysis |
| `Ctrl + R` | View Recommendations |
| `Ctrl + K` | Open AI Chat |
| `Ctrl + Z` | Undo last cleaning op |
| `Ctrl + Shift + Z` | Redo cleaning op |
| `Ctrl + D` | Download cleaned dataset |
| `Esc` | Close modal/panel |

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--neon-green` | `#39FF14` | Primary, success |
| `--amber` | `#FFB000` | Warnings, highlights |
| `--cyan` | `#00FFFF` | Info, links |
| `--magenta` | `#FF00FF` | Errors, alerts |
| `--bg-dark` | `#0A0A0A` | Background |
| Font Heading | Press Start 2P | Titles, labels |
| Font Body | VT323 | Body text |
| Font Mono | IBM Plex Mono | Code, data |

---

## 🔧 Configuration

Edit `backend/core/config.py`:

```python
class Settings(BaseSettings):
    APP_NAME: str = "DataClean AI"
    MAX_FILE_SIZE_MB: int = 100
    ALLOWED_EXTENSIONS: list = [".csv", ".xlsx", ".xls", ".json"]
    DATABASE_URL: str = "sqlite+aiosqlite:///./datacleaner.db"
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👨‍💻 Author

Built as a **portfolio project** demonstrating:
- Full-stack AI application development
- Machine Learning pipeline design
- FastAPI REST API architecture
- React/Vite modern frontend
- Retro UI/UX design
- Docker containerization
- CI/CD with GitHub Actions

---

<div align="center">

```
> SYSTEM READY. AWAITING DATASET INPUT...█
```

⭐ **Star this repo if it helped you!** ⭐

</div>
