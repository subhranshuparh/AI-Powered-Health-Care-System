from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Annotated
import pickle
import pandas as pd

app = FastAPI(title="FAT Prediction API")

# ✅ Load the trained model
ml_model = None
try:
    with open("model_fat.pkl", "rb") as f:  # Use forward slashes for paths
        ml_model = pickle.load(f)
except Exception as e:
    print("⚠️ Could not load ML model:", e)


# ✅ Define input schema
class PredictionInput(BaseModel):
    Density: Annotated[float, Field(..., gt=1, lt=10, description="Body density")]
    Age: Annotated[int, Field(..., gt=1, lt=120, description="Age in years")]
    Weight: Annotated[float, Field(..., gt=1, lt=200, description="Weight in kg")]
    Height: Annotated[float, Field(..., gt=50, lt=250, description="Height in cm")]
    Neck: Annotated[float, Field(..., gt=10, lt=60)]
    Chest: Annotated[float, Field(..., gt=30, lt=150)]
    Abdomen: Annotated[float, Field(..., gt=30, lt=150)]
    Hip: Annotated[float, Field(..., gt=30, lt=150)]
    Thigh: Annotated[float, Field(..., gt=20, lt=100)]
    Knee: Annotated[float, Field(..., gt=20, lt=70)]
    Ankle: Annotated[float, Field(..., gt=10, lt=40)]
    Biceps: Annotated[float, Field(..., gt=15, lt=60)]
    Forearm: Annotated[float, Field(..., gt=15, lt=60)]
    Wrist: Annotated[float, Field(..., gt=10, lt=30)]


# ✅ Root endpoint
@app.get("/")
def home():
    return {"message": "Welcome to FAT Prediction API 🚀"}


# ✅ Prediction endpoint
@app.post("/predict")
def predict(input_data: PredictionInput):
    if ml_model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    # Convert input to DataFrame
    df = pd.DataFrame([input_data.dict()])

    try:
        pred = ml_model.predict(df)
        return {"prediction": float(pred[0])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
