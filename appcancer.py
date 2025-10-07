from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import pickle

# Initialize app
app = FastAPI(title="Cancer Diagnosis Prediction API")

# from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Load model
model = None
try:
    with open("model_Cancer.pkl", "rb") as f:
        model = pickle.load(f)
    print("✅ Model loaded successfully")
except Exception as e:
    print("⚠️ Could not load model:", e)

# Define input schema
class CancerInput(BaseModel):
    Age: int = Field(..., ge=1, le=120)
    Gender: int = Field(..., ge=0, le=1)  # 0 = Female, 1 = Male
    BMI: float = Field(..., ge=10, le=60)
    Smoking: int = Field(..., ge=0, le=1)
    GeneticRisk: int = Field(..., ge=0, le=3)  # assuming 0–3 risk level
    PhysicalActivity: float = Field(..., ge=0, le=10)
    AlcoholIntake: float = Field(..., ge=0, le=10)
    CancerHistory: int = Field(..., ge=0, le=1)

# Root route
@app.get("/")
def home():
    return {"message": "Welcome to the Cancer Diagnosis Prediction API 🧬"}

# Prediction route
@app.post("/predict")
def predict_cancer(data: CancerInput):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        df = pd.DataFrame([data.dict()])
        pred = model.predict(df)[0]
        result = "Cancer Detected" if pred == 1 else "No Cancer"
        return {"prediction": int(pred), "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
