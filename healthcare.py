import streamlit as st
import requests
import streamlit.components.v1 as components

# ---------- Page Setup ----------
st.set_page_config(page_title="Health Prediction Dashboard", page_icon="🩺", layout="wide")

st.title("🩺 AI Health Prediction Dashboard")
st.caption("Powered by **FastAPI + Streamlit + Machine Learning**")

# ---------- Sidebar ----------
st.sidebar.header("🧬 Choose a Prediction Type")
app_mode = st.sidebar.radio(
    "Select Model",
    ["Heart Disease", "Diabetes", "Cancer Diagnosis", "Body Fat Estimation"]
)

# ---------- Backend URLs ----------
BACKENDS = {
    "Heart Disease": "http://127.0.0.1:8000/predict",
    "Diabetes": "http://127.0.0.1:8001/predict",
    "Cancer Diagnosis": "http://127.0.0.1:8002/predict",
    "Body Fat Estimation": "http://127.0.0.1:8003/predict",
}

# ---------- HEART DISEASE ----------
if app_mode == "Heart Disease":
    st.header("❤️ Heart Disease Prediction")

    col1, col2 = st.columns(2)
    with col1:
        Age = st.number_input("Age", 1, 120, 40)
        Sex = st.selectbox("Sex", ["M", "F"])
        ChestPainType = st.selectbox("Chest Pain Type", ["ATA", "NAP", "ASY", "TA"])
        RestingBP = st.number_input("Resting BP (mm Hg)", 50, 250, 120)
        Cholesterol = st.number_input("Cholesterol (mg/dL)", 0, 700, 200)
        FastingBS = st.selectbox("Fasting Blood Sugar >120 mg/dL", [0, 1])
    with col2:
        RestingECG = st.selectbox("Resting ECG", ["Normal", "ST", "LVH"])
        MaxHR = st.number_input("Max Heart Rate", 50, 250, 150)
        ExerciseAngina = st.selectbox("Exercise Induced Angina", ["Y", "N"])
        Oldpeak = st.number_input("Oldpeak (ST Depression)", 0.0, 10.0, 1.0)
        ST_Slope = st.selectbox("ST Slope", ["Up", "Flat", "Down"])

    input_data = {
        "Age": Age, "Sex": Sex, "ChestPainType": ChestPainType, "RestingBP": RestingBP,
        "Cholesterol": Cholesterol, "FastingBS": FastingBS, "RestingECG": RestingECG,
        "MaxHR": MaxHR, "ExerciseAngina": ExerciseAngina, "Oldpeak": Oldpeak, "ST_Slope": ST_Slope
    }

    if st.button("🔍 Predict Heart Disease"):
        try:
            response = requests.post(BACKENDS["Heart Disease"], json=input_data, timeout=6)
            response.raise_for_status()
            result = response.json()
            if result.get("prediction") == 1:
                st.error("💔 High risk: You might have Heart Disease.")
            else:
                st.success("💚 Low risk: You likely do not have Heart Disease.")
        except requests.exceptions.ConnectionError:
            st.error("⚠️ API connection error: Heart Disease backend not running.")
        except Exception as e:
            st.error(f"⚠️ Error: {e}")

# ---------- DIABETES ----------
elif app_mode == "Diabetes":
    st.header("🩸 Diabetes Prediction")

    gender = st.selectbox("Gender", ["Male", "Female"])
    age = st.slider("Age", 0, 120, 50)
    hypertension = st.selectbox("Hypertension", [0, 1])
    heart_disease = st.selectbox("Heart Disease", [0, 1])
    smoking_history = st.selectbox("Smoking History", ["never", "former", "current", "No Info", "ever"])
    bmi = st.slider("BMI", 10.0, 70.0, 25.0)
    hba1c_level = st.slider("HbA1c Level", 3.0, 20.0, 6.0)
    blood_glucose_level = st.slider("Blood Glucose Level", 50, 500, 120)

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

    if st.button("🔍 Predict Diabetes"):
        try:
            res = requests.post(BACKENDS["Diabetes"], json=input_data, timeout=5)
            res.raise_for_status()
            result = res.json()
            if result.get("prediction") == 1:
                st.error("⚠️ High risk of Diabetes")
            else:
                st.success("✅ Low risk of Diabetes")
        except requests.exceptions.ConnectionError:
            st.error("⚠️ API connection error: Diabetes backend not running.")
        except Exception as e:
            st.error(f"⚠️ API error: {e}")

# ---------- CANCER DIAGNOSIS ----------
elif app_mode == "Cancer Diagnosis":
    st.header("🧬 Cancer Diagnosis Prediction")

    Age = st.number_input("Age", 1, 120, 30)
    Gender = st.selectbox("Gender", ["Female", "Male"])
    BMI = st.number_input("BMI", 10.0, 60.0, 22.0)
    Smoking = st.selectbox("Smoking", ["No", "Yes"])
    GeneticRisk = st.selectbox("Genetic Risk Level", [0, 1, 2, 3])
    PhysicalActivity = st.slider("Physical Activity (0-10)", 0.0, 10.0, 5.0)
    AlcoholIntake = st.slider("Alcohol Intake (0-10)", 0.0, 10.0, 3.0)
    CancerHistory = st.selectbox("Past Cancer History", ["No", "Yes"])

    input_data = {
        "Age": Age,
        "Gender": 1 if Gender == "Male" else 0,
        "BMI": BMI,
        "Smoking": 1 if Smoking == "Yes" else 0,
        "GeneticRisk": GeneticRisk,
        "PhysicalActivity": PhysicalActivity,
        "AlcoholIntake": AlcoholIntake,
        "CancerHistory": 1 if CancerHistory == "Yes" else 0
    }

    if st.button("🔍 Predict Cancer"):
        try:
            res = requests.post(BACKENDS["Cancer Diagnosis"], json=input_data, timeout=5)
            res.raise_for_status()
            result = res.json()
            st.success(f"✅ Prediction: {result['result']}")
        except requests.exceptions.ConnectionError:
            st.error("⚠️ API connection error: Cancer backend not running.")
        except Exception as e:
            st.error(f"⚠️ API Error: {e}")

# ---------- BODY FAT ----------
elif app_mode == "Body Fat Estimation":
    st.header("💪 Body Fat Percentage Prediction")

    Density = st.number_input("Density", 1.0, 10.0, 1.05)
    Age = st.number_input("Age", 1, 120, 35)
    Weight = st.number_input("Weight (kg)", 1.0, 200.0, 72.0)
    Height = st.number_input("Height (cm)", 50.0, 250.0, 175.0)
    Neck = st.number_input("Neck (cm)", 10.0, 60.0, 38.0)
    Chest = st.number_input("Chest (cm)", 30.0, 150.0, 95.0)
    Abdomen = st.number_input("Abdomen (cm)", 30.0, 150.0, 85.0)
    Hip = st.number_input("Hip (cm)", 30.0, 150.0, 95.0)
    Thigh = st.number_input("Thigh (cm)", 20.0, 100.0, 55.0)
    Knee = st.number_input("Knee (cm)", 20.0, 70.0, 38.0)
    Ankle = st.number_input("Ankle (cm)", 10.0, 40.0, 22.0)
    Biceps = st.number_input("Biceps (cm)", 15.0, 60.0, 32.0)
    Forearm = st.number_input("Forearm (cm)", 15.0, 60.0, 28.0)
    Wrist = st.number_input("Wrist (cm)", 10.0, 30.0, 17.0)

    input_data = {
        "Density": Density, "Age": Age, "Weight": Weight, "Height": Height, "Neck": Neck,
        "Chest": Chest, "Abdomen": Abdomen, "Hip": Hip, "Thigh": Thigh, "Knee": Knee,
        "Ankle": Ankle, "Biceps": Biceps, "Forearm": Forearm, "Wrist": Wrist
    }

    if st.button("📊 Predict Body Fat %"):
        try:
            res = requests.post(BACKENDS["Body Fat Estimation"], json=input_data, timeout=5)
            res.raise_for_status()
            result = res.json()
            fat = float(result.get("prediction", 0))
            st.success(f"Your estimated body fat: **{fat:.2f}%**")

            if fat < 10:
                st.warning("⚠️ Very Low Body Fat")
            elif fat < 20:
                st.success("✅ Healthy Body Fat")
            elif fat < 30:
                st.warning("⚠️ Slightly High Body Fat")
            else:
                st.error("🚨 High Body Fat — consider lifestyle changes")
        except requests.exceptions.ConnectionError:
            st.error("⚠️ API connection error: Body Fat backend not running.")
        except Exception as e:
            st.error(f"⚠️ API error: {e}")

# ---------- Floating Chatbot Integration ----------
components.html(
    """
    <script src="https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1"></script>
    <df-messenger
      intent="WELCOME"
      chat-title="Subhranshu Health Bot"
      agent-id="e509181b-772e-4fdc-a2a2-2a96731e6ca9"
      language-code="en">
    </df-messenger>
    <style>
      df-messenger {
        --df-messenger-bot-message: #e0f7fa;
        --df-messenger-button-titlebar-color: #2E86C1;
        --df-messenger-chat-background-color: #f4f6f7;
        --df-messenger-font-color: #000;
        --df-messenger-send-icon: #2E86C1;
        --df-messenger-user-message: #d1f2eb;
        position: fixed !important;
        bottom: 24px !important;
        right: 24px !important;
        z-index: 2147483647 !important;
        width: 400px;
        height: 600px;
      }
      .stApp, .main, .block-container {
        z-index: 1 !important;
        position: relative !important;
      }
    </style>
    """,
    height=600,
)
