import streamlit as st
import requests

st.set_page_config(page_title="Diabetes Predictor", page_icon="🩺")
st.title("🩺 Diabetes Prediction App")
st.write("Enter your health details to estimate diabetes risk.")

# Sidebar for input
st.header("Patient Details")
gender = st.selectbox("Gender", ["Male", "Female"])
age = st.slider("Age", 0, 120, 54)
hypertension = st.selectbox("Hypertension", [0, 1])
heart_disease = st.selectbox("Heart Disease", [0, 1])
smoking_history = st.selectbox("Smoking History", ["never", "current", "former", "No Info", "ever"])
bmi = st.slider("BMI", 10.0, 70.0, 27.32, 0.1)
hba1c_level = st.slider("HbA1c Level", 3.0, 20.0, 6.6, 0.1)
blood_glucose_level = st.slider("Blood Glucose Level", 50, 500, 80)

# Predict button
if st.button("Predict Diabetes"):
    input_data = {
        "gender": gender,
        "age": age,
        "hypertension": hypertension,
        "heart_disease": heart_disease,
        "smoking_history": smoking_history,
        "bmi": bmi,
        "HbA1c_level": hba1c_level,
        "blood_glucose_level": blood_glucose_level
    }

    try:
        # Call FastAPI backend
        response = requests.post("http://127.0.0.1:8000/predict", json=input_data)
        result = response.json()

        if "prediction" in result:
            prediction = result["prediction"]
            if prediction == 1:
                st.error("⚠️ High risk of diabetes")
            else:
                st.success("✅ Low risk of diabetes")
        else:
            st.error("Prediction failed. Check backend response.")

    except Exception as e:
        st.error(f"Failed to get prediction: {e}")
