import streamlit as st
import requests

st.set_page_config(page_title="Cancer Diagnosis Predictor", page_icon="🧬", layout="centered")

st.title("🧬 Cancer Diagnosis Prediction")
st.write("Enter patient details to predict whether cancer is diagnosed or not.")

# User inputs
age = st.number_input("Age", 1, 120, 30)
gender = st.selectbox("Gender", ["Female", "Male"])
bmi = st.number_input("BMI", 10.0, 60.0, 22.0)
smoking = st.selectbox("Smoking", ["No", "Yes"])
genetic_risk = st.selectbox("Genetic Risk Level", [0, 1, 2, 3])
physical_activity = st.slider("Physical Activity Level (0-10)", 0.0, 10.0, 5.0)
alcohol_intake = st.slider("Alcohol Intake (0-10)", 0.0, 10.0, 3.0)
cancer_history = st.selectbox("Past Cancer History", ["No", "Yes"])

# Convert to numeric
gender_num = 1 if gender == "Male" else 0
smoking_num = 1 if smoking == "Yes" else 0
cancer_history_num = 1 if cancer_history == "Yes" else 0

# API URL
API_URL = "http://127.0.0.1:8000/predict"

if st.button("🔍 Predict"):
    data = {
        "Age": age,
        "Gender": gender_num,
        "BMI": bmi,
        "Smoking": smoking_num,
        "GeneticRisk": genetic_risk,
        "PhysicalActivity": physical_activity,
        "AlcoholIntake": alcohol_intake,
        "CancerHistory": cancer_history_num
    }

    try:
        res = requests.post(API_URL, json=data)
        if res.status_code == 200:
            result = res.json()
            st.success(f"✅ Prediction: {result['result']}")
        else:
            st.error(f"❌ Error {res.status_code}: {res.text}")
    except Exception as e:
        st.error(f"🚨 Connection error: {e}")
