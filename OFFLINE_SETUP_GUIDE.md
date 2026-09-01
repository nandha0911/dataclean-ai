# 🚀 DataClean AI — Complete Offline Team Handover & Setup Guide

This project is configured to run **100% locally and offline** without requiring external cloud databases or online API keys.

---

## 📦 1. Files & Folders to Share with Your Team

When zipping or sharing the project folder, include the following:

### ✅ Files & Folders to INCLUDE:
```text
demo/
├── backend/                  # FastAPI Python engine, models, services & datasets
│   ├── api/
│   ├── core/
│   ├── datasets/             # Local datasets & upload storage
│   ├── models/
│   ├── reports/              # PDF quality reports
│   ├── services/             # Analyzer, cleaner, recommender, scorer
│   ├── utils/
│   ├── datacleaner.db        # Local SQLite database (offline)
│   ├── main.py
│   └── requirements.txt
├── frontend/                 # React + Vite + Tailwind frontend
│   ├── public/
│   ├── src/                  # React components, pages & chart engine
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── setup.bat                 # 1-Click Dependency Installer
├── start_offline.bat         # 1-Click Offline Server Launcher
├── stop.bat                  # 1-Click Server Stopper
└── README.md
```

### ❌ Folders to EXCLUDE when creating a ZIP (to save space):
* `frontend/node_modules/` *(Large folder ~300MB — team member will install via setup.bat)*
* `backend/__pycache__/` and `.pyc` files
* `.git/` *(Optional — exclude if sending as pure zip, or share via GitHub)*
* Very large multi-gigabyte temporary CSVs in `backend/datasets/` if not needed

---

## 💻 2. Prerequisites for Team Members

Make sure the team member's computer has:
1. **Python 3.10 or higher** → [Download Python](https://www.python.org/downloads/) *(Check "Add Python to PATH" during install)*
2. **Node.js 18 or higher** → [Download Node.js](https://nodejs.org/)

---

## ⚡ 3. How to Install & Start (Two Simple Methods)

### Method A: 1-Click Setup & Launch (Easiest for Windows)

1. **Step 1: First-Time Setup**
   * Double-click **`setup.bat`** in the project root.
   * This automatically installs all Python packages (`pip install -r requirements.txt`) and Node.js modules (`npm install`).

2. **Step 2: Launch the App**
   * Double-click **`start_offline.bat`**.
   * It starts the **Backend** (`http://127.0.0.1:8000`), the **Frontend** (`http://127.0.0.1:5173`), and automatically opens your browser!

---

### Method B: Manual Command Line Launch (Terminal / PowerShell)

#### 1. Start the Backend:
Open Terminal 1:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
*Backend is live at:* `http://127.0.0.1:8000` (Swagger Docs at `/docs`)

#### 2. Start the Frontend:
Open Terminal 2:
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
*Frontend is live at:* `http://127.0.0.1:5173`

---

## 🛑 4. How to Stop the Servers

* Either close the two terminal windows, or
* Double-click **`stop.bat`** in the project root.

---

## 🔗 5. GitHub Repository Access (Alternative to ZIP)

If your team uses Git, they can clone the repo directly:
```bash
git clone https://github.com/nandha0911/dataclean-ai.git
cd dataclean-ai
setup.bat
start_offline.bat
```
