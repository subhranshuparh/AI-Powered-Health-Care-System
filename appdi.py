from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal, Annotated
import pickle
import pandas as pd

# Create FastAPI instance
app = FastAPI(title="Diabetes Prediction API")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model
ml_model = None
try:
    with open("model_diabetes.pkl", "rb") as f:
        ml_model = pickle.load(f)
except Exception as e:
    print("⚠️ Could not load ML model:", e)


# Define input schema
class DiabetesInput(BaseModel):
    gender: Literal["Male", "Female"]
    age: Annotated[float, Field(..., ge=0, le=120)]
    hypertension: Annotated[int, Field(..., ge=0, le=1)]
    heart_disease: Annotated[int, Field(..., ge=0, le=1)]
    smoking_history: Literal["never", "current", "former", "No Info", "ever"]
    bmi: Annotated[float, Field(..., ge=10, le=70)]
    HbA1c_level: Annotated[float, Field(..., ge=3, le=20)]
    blood_glucose_level: Annotated[float, Field(..., ge=50, le=500)]


# Root endpoint
@app.get("/")
def root():
    return {"message": "Welcome to Diabetes Prediction API 🚀"}


# Prediction endpoint
@app.post("/predict")
def predict(input_data: DiabetesInput):
    if ml_model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    # Convert input to DataFrame
    df = pd.DataFrame([input_data.dict()])

    try:
        # Make prediction
        pred = ml_model.predict(df)
        return {"prediction": int(pred[0])}  # usually 0 or 1
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
