import streamlit as st
import requests

st.set_page_config(page_title="Body Fat Predictor", page_icon="💪")

st.title("💪 Body Fat Prediction App")
st.write("Enter your body measurements to estimate body fat percentage.")

# Sidebar for input
st.header("Your Details")
Density = st.number_input("Density", min_value=1.0, max_value=10.0, value=1.05, step=0.01)
Age = st.number_input("Age", min_value=1, max_value=120, value=35)
Weight = st.number_input("Weight (kg)", min_value=1.0, max_value=200.0, value=72.0)
Height = st.number_input("Height (cm)", min_value=50.0, max_value=250.0, value=175.0)
Neck = st.number_input("Neck (cm)", min_value=10.0, max_value=60.0, value=38.0)
Chest = st.number_input("Chest (cm)", min_value=30.0, max_value=150.0, value=95.0)
Abdomen = st.number_input("Abdomen (cm)", min_value=30.0, max_value=150.0, value=85.0)
Hip = st.number_input("Hip (cm)", min_value=30.0, max_value=150.0, value=95.0)
Thigh = st.number_input("Thigh (cm)", min_value=20.0, max_value=100.0, value=55.0)
Knee = st.number_input("Knee (cm)", min_value=20.0, max_value=70.0, value=38.0)
Ankle = st.number_input("Ankle (cm)", min_value=10.0, max_value=40.0, value=22.0)
Biceps = st.number_input("Biceps (cm)", min_value=15.0, max_value=60.0, value=32.0)
Forearm = st.number_input("Forearm (cm)", min_value=15.0, max_value=60.0, value=28.0)
Wrist = st.number_input("Wrist (cm)", min_value=10.0, max_value=30.0, value=17.0)

# Button to predict
if st.button("Predict Body Fat %"):
    input_data = {
        "Density": Density,
        "Age": Age,
        "Weight": Weight,
        "Height": Height,
        "Neck": Neck,
        "Chest": Chest,
        "Abdomen": Abdomen,
        "Hip": Hip,
        "Thigh": Thigh,
        "Knee": Knee,
        "Ankle": Ankle,
        "Biceps": Biceps,
        "Forearm": Forearm,
        "Wrist": Wrist
    }

    try:
        # Call FastAPI backend
        response = requests.post("http://127.0.0.1:8000/predict", json=input_data)
        result = response.json()

        if "prediction" in result:
            fat_percentage = result["prediction"]
            st.success(f"Your estimated body fat: **{fat_percentage:.2f}%**")

            # Interpretation
            if fat_percentage < 10:
                st.warning("⚠️ Very low body fat")
            elif fat_percentage < 20:
                st.success("✅ Healthy body fat")
            elif fat_percentage < 30:
                st.warning("⚠️ Slightly high body fat")
            else:
                st.error("⚠️ High body fat — consider consulting a health professional")
        else:
            st.error("Error in prediction response")

    except Exception as e:
        st.error(f"Failed to get prediction: {e}")
