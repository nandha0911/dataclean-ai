"""
DataClean AI — Hugging Face Gradio Space Entrypoint
==================================================
Mounts the complete FastAPI REST API backend (with 16 GB Free RAM)
and provides a clean status dashboard for Hugging Face Spaces.
"""
import sys
import os

# Add backend directory to Python sys.path
backend_path = os.path.join(os.path.dirname(__file__), "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from main import app as fastapi_app
import gradio as gr

# Build clean Gradio status UI
with gr.Blocks(title="DataClean AI — Backend Server") as demo:
    gr.Markdown("# 🚀 DataClean AI Backend Server")
    gr.Markdown(
        "**Status:** 🟢 **Active & Online** (16 GB RAM Dedicated Cloud Server)\n\n"
        "This Hugging Face Space runs the complete **FastAPI Machine Learning Backend** "
        "(Voting Ensemble: XGBoost + LightGBM + CatBoost) for the DataClean AI web application."
    )
    with gr.Row():
        gr.Markdown("### 🔗 Quick Links:")
    with gr.Row():
        gr.Markdown("- 🌐 **Web Frontend App:** [dataclean-ai.netlify.app](https://dataclean-ai.netlify.app)")
        gr.Markdown("- 📖 **Interactive API Docs:** [/docs](/docs)")
        gr.Markdown("- 🩺 **Server Health Check:** [/health](/health)")

# Mount FastAPI app onto Gradio (or mount Gradio onto FastAPI)
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
