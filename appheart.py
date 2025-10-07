from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal, Annotated
import pandas as pd
import pickle

# Initialize FastAPI app
app = FastAPI(title="Heart Disease Prediction API")

# Allow frontend access (optional)
# from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model
model = None
try:
    with open("model_HeartDisease.pkl", "rb") as f:
        model = pickle.load(f)
    print("✅ Model loaded successfully")
except Exception as e:
    print("⚠️ Could not load model:", e)


# Define input schema using Pydantic
class HeartInput(BaseModel):
    Age: Annotated[int, Field(..., ge=1, le=120)]
    Sex: Literal["M", "F"]
    ChestPainType: Literal["ATA", "NAP", "ASY", "TA"]
    RestingBP: Annotated[int, Field(..., ge=50, le=250)]
    Cholesterol: Annotated[int, Field(..., ge=0, le=700)]
    FastingBS: Literal[0, 1]
    RestingECG: Literal["Normal", "ST", "LVH"]
    MaxHR: Annotated[int, Field(..., ge=50, le=250)]
    ExerciseAngina: Literal["Y", "N"]
    Oldpeak: Annotated[float, Field(..., ge=0.0, le=10.0)]
    ST_Slope: Literal["Up", "Flat", "Down"]


# Root endpoint
@app.get("/")
def home():
    return {"message": "Welcome to the Heart Disease Prediction API ❤️"}


# Prediction endpoint
@app.post("/predict")
def predict_heart_disease(data: HeartInput):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        # Convert input to DataFrame
        df = pd.DataFrame([data.dict()])

        # Predict
        prediction = model.predict(df)[0]
        result = "Heart Disease" if prediction == 1 else "No Heart Disease"

        return {
            "prediction": int(prediction),
            "result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
