import streamlit as st
import requests

# Backend URL (make sure FastAPI is running at this address)
API_URL = "http://127.0.0.1:8000/predict"

st.set_page_config(page_title="Heart Disease Predictor", page_icon="❤️", layout="centered")

st.title("❤️ Heart Disease Prediction App")
st.write("Enter your health details below to predict your heart disease risk.")

# Input fields
col1, col2 = st.columns(2)
with col1:
    age = st.number_input("Age", min_value=1, max_value=120, value=40)
    sex = st.selectbox("Sex", ["M", "F"])
    chest_pain = st.selectbox("Chest Pain Type", ["ATA", "NAP", "ASY", "TA"])
    resting_bp = st.number_input("Resting Blood Pressure (mm Hg)", min_value=50, max_value=250, value=120)
    cholesterol = st.number_input("Cholesterol (mg/dL)", min_value=0, max_value=700, value=200)
    fasting_bs = st.selectbox("Fasting Blood Sugar > 120 mg/dL?", [0, 1])
with col2:
    resting_ecg = st.selectbox("Resting ECG Results", ["Normal", "ST", "LVH"])
    max_hr = st.number_input("Max Heart Rate Achieved", min_value=50, max_value=250, value=150)
    exercise_angina = st.selectbox("Exercise Induced Angina", ["Y", "N"])
    oldpeak = st.number_input("Oldpeak (ST Depression)", min_value=0.0, max_value=10.0, value=1.0, step=0.1)
    st_slope = st.selectbox("ST Slope", ["Up", "Flat", "Down"])

# Prepare input data
input_data = {
    "Age": age,
    "Sex": sex,
    "ChestPainType": chest_pain,
    "RestingBP": resting_bp,
    "Cholesterol": cholesterol,
    "FastingBS": fasting_bs,
    "RestingECG": resting_ecg,
    "MaxHR": max_hr,
    "ExerciseAngina": exercise_angina,
    "Oldpeak": oldpeak,
    "ST_Slope": st_slope
}

st.write("---")

# Submit button
if st.button("🔍 Predict"):
    with st.spinner("Analyzing..."):
        try:
            response = requests.post(API_URL, json=input_data)
            if response.status_code == 200:
                result = response.json()
                prediction = result["result"]

                if prediction == "Heart Disease":
                    st.error("💔 High risk: You might have **Heart Disease**.")
                else:
                    st.success("💚 Low risk: You likely **do not have Heart Disease**.")
            else:
                st.error(f"❌ API Error {response.status_code}: {response.text}")
        except Exception as e:
            st.error(f"⚠️ Connection error: {e}")

# st.write("---")
# st.caption("Made with ❤️ using FastAPI + Streamlit")
