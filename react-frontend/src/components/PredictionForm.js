import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { RetellWebClient } from "retell-client-js-sdk";
import "./PredictionForm.css";

// Constants
const BACKENDS = {
  "Heart Disease": "http://127.0.0.1:8000/predict",
  "Diabetes": "http://127.0.0.1:8001/predict",
  "Cancer Diagnosis": "http://127.0.0.1:8002/predict",
  "Body Fat Estimation": "http://127.0.0.1:8003/predict",
};

const EXPECTED_FIELDS = {
  "Heart Disease": [
    "Age", "Sex", "ChestPainType", "RestingBP", "Cholesterol", "FastingBS",
    "RestingECG", "MaxHR", "ExerciseAngina", "Oldpeak", "ST_Slope"
  ],
  "Diabetes": [
    "gender", "age", "hypertension", "heart_disease", "smoking_history",
    "bmi", "HbA1c_level", "blood_glucose_level"
  ],
  "Cancer Diagnosis": [
    "Age", "Gender", "BMI", "Smoking", "GeneticRisk", "PhysicalActivity",
    "AlcoholIntake", "CancerHistory"
  ],
  "Body Fat Estimation": [
    "Density", "Age", "Weight", "Height", "Neck", "Chest", "Abdomen",
    "Hip", "Thigh", "Knee", "Ankle", "Biceps", "Forearm", "Wrist"
  ],
};

const FIELD_KEYWORDS = {
  common: {
    age: ['age', 'years', 'old', 'year'],
    bmi: ['bmi', 'body mass', 'body mass index'],
    weight: ['weight', 'kg', 'pounds'],
    height: ['height', 'cm', 'inches'],
  },
  "Heart Disease": {
    sex: ['sex', 'gender'],
    chestpaintype: ['chest pain', 'pain type', 'chest type', 'angina'],
    restingbp: ['blood pressure', 'bp', 'resting blood pressure', 'resting bp'],
    cholesterol: ['cholesterol'],
    fastingbs: ['fasting blood sugar', 'fasting bs', 'sugar level', 'fasting sugar'],
    restingecg: ['ecg', 'resting ecg'],
    maxhr: ['heart rate', 'max heart rate', 'maximum hr', 'max hr'],
    exerciseangina: ['exercise angina', 'angina exercise', 'exercise pain'],
    oldpeak: ['oldpeak', 'st depression', 'depression'],
    st_slope: ['st slope', 'slope'],
  },
  "Diabetes": {
    gender: ['gender', 'sex'],
    hypertension: ['hypertension', 'high blood pressure', 'bp high', 'high bp'],
    heart_disease: ['heart disease', 'heart issue', 'heart problem'],
    smoking_history: ['smoking', 'smoke', 'smoker', 'smoking history'],
  },
  "Cancer Diagnosis": {
    gender: ['gender', 'sex'],
    smoking: ['smoking', 'smoke', 'smoker'],
    geneticrisk: ['genetic risk', 'genetics', 'family history', 'genetic'],
    physicalactivity: ['physical activity', 'exercise', 'activity level', 'activity'],
    alcoholintake: ['alcohol', 'drinking', 'alcohol intake'],
    cancerhistory: ['cancer history', 'cancer past', 'previous cancer', 'cancer before'],
  },
  "Body Fat Estimation": {
    density: ['density', 'body density'],
    neck: ['neck'],
    chest: ['chest'],
    abdomen: ['abdomen', 'waist'],
    hip: ['hip'],
    thigh: ['thigh'],
    knee: ['knee'],
    ankle: ['ankle'],
    biceps: ['biceps', 'bicep'],
    forearm: ['forearm'],
    wrist: ['wrist'],
  },
};

const FIELD_MAPPINGS = {
  "Heart Disease": {
    age: "Age", sex: "Sex", chestpaintype: "ChestPainType",
    restingbp: "RestingBP", cholesterol: "Cholesterol", fastingbs: "FastingBS",
    restingecg: "RestingECG", maxhr: "MaxHR", exerciseangina: "ExerciseAngina",
    oldpeak: "Oldpeak", st_slope: "ST_Slope",
  },
  "Diabetes": {
    age: "age", gender: "gender", hypertension: "hypertension",
    heart_disease: "heart_disease", smoking_history: "smoking_history", bmi: "bmi",
  },
  "Cancer Diagnosis": {
    age: "Age", gender: "Gender", bmi: "BMI", smoking: "Smoking",
    geneticrisk: "GeneticRisk", physicalactivity: "PhysicalActivity",
    alcoholintake: "AlcoholIntake", cancerhistory: "CancerHistory",
  },
  "Body Fat Estimation": {
    age: "Age", density: "Density", weight: "Weight", height: "Height",
    neck: "Neck", chest: "Chest", abdomen: "Abdomen", hip: "Hip",
    thigh: "Thigh", knee: "Knee", ankle: "Ankle", biceps: "Biceps",
    forearm: "Forearm", wrist: "Wrist",
  },
};

const NUMBER_WORDS = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
  'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90
};

function PredictionForm({ selectedModel }) {
  const [inputs, setInputs] = useState({});
  const [result, setResult] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [callId, setCallId] = useState(null);

  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);
  const retellClient = useRef(new RetellWebClient());

  // Memoized field keywords for current model
  const fieldKeywords = useMemo(() => {
    return { ...FIELD_KEYWORDS.common, ...FIELD_KEYWORDS[selectedModel] };
  }, [selectedModel]);

  // Utility functions
  const parseNumberWord = useCallback((word) => {
    const num = parseFloat(word);
    return isNaN(num) ? NUMBER_WORDS[word] || null : num;
  }, []);

  const findNumberInTranscript = useCallback((transcript) => {
    const words = transcript.split(/\s+/);
    for (let word of words) {
      const num = parseNumberWord(word);
      if (num !== null) return num;
    }
    return null;
  }, [parseNumberWord]);

  const getFieldMapping = useCallback((fieldName) => {
    return FIELD_MAPPINGS[selectedModel]?.[fieldName] || fieldName;
  }, [selectedModel]);

  const speakResult = useCallback((text) => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      synthesisRef.current.speak(utterance);
    }
  }, []);

  // Process voice value based on field type
  const processVoiceValue = useCallback((fieldName, value, transcript) => {
    if (['gender', 'sex'].includes(fieldName)) {
      return value === 'Male' || value.toLowerCase().includes('male') ? 'Male' : 'Female';
    }

    if (['smoking', 'smoking_history'].includes(fieldName)) {
      return selectedModel === 'Diabetes' 
        ? (value === 1 ? 'current' : 'never')
        : (value === 1 ? 'Yes' : 'No');
    }

    if (['hypertension', 'heart_disease'].includes(fieldName)) {
      return value === 1 ? 1 : 0;
    }

    if (fieldName === 'cancerhistory') {
      return value === 1 ? 'Yes' : 'No';
    }

    if (fieldName === 'chestpaintype') {
      if (transcript.includes('typical') || transcript.includes('ata')) return 'ATA';
      if (transcript.includes('non-anginal') || transcript.includes('ta')) return 'TA';
      if (transcript.includes('asymptomatic') || transcript.includes('asy')) return 'ASY';
      if (transcript.includes('atypical') || transcript.includes('nap')) return 'NAP';
      return value;
    }

    if (fieldName === 'exerciseangina') {
      return value === 1 ? 'Y' : 'N';
    }

    if (fieldName === 'geneticrisk') {
      return Math.round(value);
    }

    return value;
  }, [selectedModel]);

  // Handle voice input processing
  const processVoiceInput = useCallback((transcript) => {
    if (transcript.includes('stop listening') || transcript.includes('end listening') || transcript.includes('stop')) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      synthesisRef.current?.cancel();
      speakResult("Stopped listening.");
      return;
    }

    console.log('Voice input (final):', transcript);

    let fieldName = null;
    let value = null;

    // Find matching field and value
    for (const [fn, keywords] of Object.entries(fieldKeywords)) {
      for (const kw of keywords) {
        if (transcript.includes(kw.toLowerCase())) {
          fieldName = fn;
          const indexAfterKw = transcript.indexOf(kw.toLowerCase()) + kw.length;
          const after = transcript.substring(indexAfterKw);
          const numMatch = after.match(/(\d+(?:\.\d+)?)/);
          
          if (numMatch) {
            value = parseFloat(numMatch[1]);
            break;
          }
          if (after.includes('yes') || after.includes('y')) {
            value = 1;
            break;
          }
          if (after.includes('no') || after.includes('n')) {
            value = 0;
            break;
          }
          if ((fn === 'gender' || fn === 'sex') && (transcript.includes('male') || transcript.includes('female'))) {
            value = transcript.includes('male') ? 'Male' : 'Female';
            break;
          }
          break;
        }
      }
      if (value !== null) break;
    }

    // Fallback: try to fill any empty field with found number
    if (!fieldName) {
      const numValue = findNumberInTranscript(transcript);
      if (numValue !== null) {
        const expected = EXPECTED_FIELDS[selectedModel] || [];
        const priorityFields = expected.filter(f => 
          f.toLowerCase().includes('age') || f.toLowerCase().includes('weight') || f.toLowerCase().includes('height')
        );
        const targetField = priorityFields[0] || expected.find(f => !['gender', 'sex', 'smoking_history'].includes(f.toLowerCase()));
        if (targetField) {
          setInputs(prev => ({ ...prev, [targetField]: numValue }));
          console.log(`Fallback: Filled ${targetField} with ${numValue}`);
          return;
        }
      }
    }

    // Update field if found
    if (fieldName && value !== null) {
      const actualField = getFieldMapping(fieldName);
      const actualValue = processVoiceValue(fieldName, value, transcript);
      setInputs(prev => ({ ...prev, [actualField]: actualValue }));
      console.log(`Filled ${actualField} with ${actualValue}`);
    } else if (transcript.includes('male')) {
      const genderField = selectedModel === 'Diabetes' ? 'gender' : selectedModel === 'Cancer Diagnosis' ? 'Gender' : 'Sex';
      setInputs(prev => ({ ...prev, [genderField]: 'Male' }));
      console.log('Set gender to Male');
    } else if (transcript.includes('female')) {
      const genderField = selectedModel === 'Diabetes' ? 'gender' : selectedModel === 'Cancer Diagnosis' ? 'Gender' : 'Sex';
      setInputs(prev => ({ ...prev, [genderField]: 'Female' }));
      console.log('Set gender to Female');
    } else {
      console.log('No field matched in transcript');
    }
  }, [fieldKeywords, selectedModel, findNumberInTranscript, getFieldMapping, processVoiceValue, speakResult]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        const transcript = finalTranscript.trim().toLowerCase();
        if (transcript) {
          processVoiceInput(transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    synthesisRef.current = window.speechSynthesis;
  }, [processVoiceInput]);

  // Initialize Retell client
  useEffect(() => {
    const client = retellClient.current;

    const handleCallStarted = () => {
      console.log("Voice call started!");
    };

    const handleCallEnded = () => {
      console.log("Voice call ended.");
      setIsChatting(false);
      speakResult("Call ended. Check your updated form!");
    };

    const handleUpdate = (update) => {
      const transcript = update.transcript;
      console.log("Agent update:", transcript);
      
      // Parse transcript for age
      const ageMatch = transcript.match(/age[:\s]+(\d+)/i);
      if (ageMatch) {
        setInputs(prev => ({ ...prev, age: parseInt(ageMatch[1]), Age: parseInt(ageMatch[1]) }));
      }

      // Parse transcript for gender
      const genderMatch = transcript.match(/gender[:\s]+(male|female)/i);
      if (genderMatch) {
        const gender = genderMatch[1].charAt(0).toUpperCase() + genderMatch[1].slice(1);
        setInputs(prev => ({ ...prev, gender, Gender: gender }));
      }
    };

    const handleError = (error) => {
      console.error("Retell error:", error);
      setIsChatting(false);
    };

    client.on("call_started", handleCallStarted);
    client.on("call_ended", handleCallEnded);
    client.on("update", handleUpdate);
    client.on("error", handleError);

    return () => {
      client.removeAllListeners();
    };
  }, [speakResult]);

  // Reset form when model changes
  useEffect(() => {
    setInputs({});
    setResult("");
  }, [selectedModel]);

  // Form validation
  const isFormValid = useCallback(() => {
    const expected = EXPECTED_FIELDS[selectedModel] || [];
    return expected.every((field) => {
      const val = inputs[field];
      if (val === undefined || val === "") return false;
      if (typeof val === "number" && isNaN(val)) return false;
      return true;
    });
  }, [selectedModel, inputs]);

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value, type } = e.target;
    let finalValue = value;

    if (type === "number" && value !== "") {
      finalValue = Number(value);
      if (isNaN(finalValue)) return;
    } else if (type === "select-one" && !isNaN(value) && value !== "") {
      finalValue = Number(value);
    }

    setInputs((prev) => ({ ...prev, [name]: finalValue }));
  }, []);

  // Voice controls
  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      alert('Speech recognition not supported in this browser.');
    }
  }, []);

  const startVoiceAgent = useCallback(async () => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/start-web-call", {
        agent_id: "agent_73c01dd3f7260d7b433b8d48cc"
      });
      const { access_token } = response.data;

      const newCallId = await retellClient.current.startCall({
        accessToken: access_token,
        sampleRate: 24000,
        emitRawAudioSamples: false,
      });
      setCallId(newCallId);
      setIsChatting(true);
    } catch (error) {
      console.error("Failed to start voice agent:", error);
      alert(`Error: ${error.message}. Check API key and agent ID.`);
    }
  }, []);

  const endVoiceAgent = useCallback(async () => {
    if (callId) {
      await retellClient.current.stopCall(callId);
    }
    setIsChatting(false);
    setCallId(null);
  }, [callId]);

  // Transform data for Cancer Diagnosis
  const transformCancerData = useCallback((data) => {
    const transformed = {
      Age: Number(data.Age),
      Gender: data.Gender === "Male" ? 1 : 0,
      BMI: Number(data.BMI),
      Smoking: data.Smoking === "Yes" ? 1 : 0,
      GeneticRisk: Number(data.GeneticRisk),
      PhysicalActivity: Number(data.PhysicalActivity),
      AlcoholIntake: Number(data.AlcoholIntake),
      CancerHistory: data.CancerHistory === "Yes" ? 1 : 0,
    };

    if (Object.values(transformed).some(v => v === undefined || isNaN(v))) {
      throw new Error("Invalid input values detected. Please check numeric fields.");
    }

    return transformed;
  }, []);

  // Format prediction result
  const formatPredictionResult = useCallback((data) => {
    switch (selectedModel) {
      case "Heart Disease": {
        const pred = parseInt(data.prediction) || 0;
        return pred === 1
          ? "💔 High risk: You might have Heart Disease."
          : "💚 Low risk: You likely do not have Heart Disease.";
      }
      case "Diabetes": {
        const pred = parseInt(data.prediction) || 0;
        return pred === 1
          ? "⚠️ High risk of Diabetes"
          : "✅ Low risk of Diabetes";
      }
      case "Cancer Diagnosis":
        return `🧬 Prediction: ${data.result || JSON.stringify(data)}`;
      case "Body Fat Estimation": {
        const fat = parseFloat(data.prediction || 0);
        let msg = `Your estimated body fat: ${fat.toFixed(2)}%`;
        if (fat < 10) msg += "\n⚠️ Very Low Body Fat";
        else if (fat < 20) msg += "\n✅ Healthy Body Fat";
        else if (fat < 30) msg += "\n⚠️ Slightly High Body Fat";
        else msg += "\n🚨 High Body Fat — consider lifestyle changes";
        return msg;
      }
      default:
        return JSON.stringify(data, null, 2);
    }
  }, [selectedModel]);

  // Handle prediction
  const handlePredict = useCallback(async () => {
    if (!selectedModel) return;

    if (!isFormValid()) {
      setResult("⚠️ Please fill all fields with valid values before predicting.");
      return;
    }

    setResult("⏳ Predicting...");

    try {
      let dataToSend = { ...inputs };

      if (selectedModel === "Cancer Diagnosis") {
        dataToSend = transformCancerData(inputs);
      }

      const response = await axios.post(BACKENDS[selectedModel], dataToSend, {
        headers: { "Content-Type": "application/json" },
        timeout: 8000,
      });

      const predictionMessage = formatPredictionResult(response.data);
      setResult(predictionMessage);
      console.log("Set result to:", predictionMessage);
      speakResult(predictionMessage);
    } catch (err) {
      console.error("Error from backend:", err);

      let errorMessage;
      if (err.response) {
        const detail = err.response.data?.detail;
        if (Array.isArray(detail)) {
          errorMessage = detail.map((d) => `${d.loc?.join(" → ")}: ${d.msg}`).join("\n");
        } else if (typeof detail === "string") {
          errorMessage = detail;
        } else {
          errorMessage = JSON.stringify(detail, null, 2);
        }
        setResult(`⚠️ Server Error (${err.response.status}):\n${errorMessage}`);
      } else if (err.request) {
        setResult("⚠️ No response from backend. Check if FastAPI servers are running on ports 8000-8003.");
      } else {
        setResult(`⚠️ Error: ${err.message}`);
      }
    }
  }, [selectedModel, inputs, isFormValid, transformCancerData, formatPredictionResult, speakResult]);

  // Render field helper
  const renderField = useCallback((label, inputElement) => (
    <div className="field">
      <label>{label}</label>
      {inputElement}
    </div>
  ), []);

  // Form renderers (extracted to separate functions for clarity)
  const renderHeartForm = useCallback(() => (
    <>
      {renderField("Age (years, 1-120)", 
        <input name="Age" type="number" placeholder="e.g., 40" value={String(inputs.Age ?? '')} onChange={handleChange} min="1" max="120" />
      )}
      {renderField("Sex (M/F)", 
        <select name="Sex" value={String(inputs.Sex ?? '')} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="M">Male (M)</option>
          <option value="F">Female (F)</option>
        </select>
      )}
      {renderField("Chest Pain Type (ATA/NAP/ASY/TA)", 
        <select name="ChestPainType" value={String(inputs.ChestPainType ?? '')} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="ATA">ATA (Typical Angina)</option>
          <option value="NAP">NAP (Non-Atypical Angina)</option>
          <option value="ASY">ASY (Asymptomatic)</option>
          <option value="TA">TA (Non-Anginal Pain)</option>
        </select>
      )}
      {renderField("Resting Blood Pressure (mm Hg, 50-250)", 
        <input name="RestingBP" type="number" placeholder="e.g., 120" value={String(inputs.RestingBP ?? '')} onChange={handleChange} min="50" max="250" />
      )}
      {renderField("Cholesterol (mg/dL, 0-700)", 
        <input name="Cholesterol" type="number" placeholder="e.g., 200" value={String(inputs.Cholesterol ?? '')} onChange={handleChange} min="0" max="700" />
      )}
      {renderField("Fasting Blood Sugar (>120 mg/dL? 0=No, 1=Yes)", 
        <select name="FastingBS" value={String(inputs.FastingBS ?? '')} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="0">No (0)</option>
          <option value="1">Yes (1)</option>
        </select>
      )}
      {renderField("Resting ECG (Normal/ST/LVH)", 
        <select name="RestingECG" value={String(inputs.RestingECG ?? '')} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="Normal">Normal</option>
          <option value="ST">ST</option>
          <option value="LVH">LVH</option>
        </select>
      )}
      {renderField("Maximum Heart Rate (bpm, 50-250)", 
        <input name="MaxHR" type="number" placeholder="e.g., 150" value={String(inputs.MaxHR ?? '')} onChange={handleChange} min="50" max="250" />
      )}
      {renderField("Exercise Induced Angina (Y/N)", 
        <select name="ExerciseAngina" value={String(inputs.ExerciseAngina ?? '')} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="Y">Yes (Y)</option>
          <option value="N">No (N)</option>
        </select>
      )}
      {renderField("Oldpeak (ST Depression, 0-10)", 
        <input name="Oldpeak" type="number" step="0.1" placeholder="e.g., 1.0" value={String(inputs.Oldpeak ?? '')} onChange={handleChange} min="0" max="10" />
      )}
      {renderField("ST Slope (Up/Flat/Down)", 
        <select name="ST_Slope" value={String(inputs.ST_Slope ?? '')} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="Up">Up</option>
          <option value="Flat">Flat</option>
          <option value="Down">Down</option>
        </select>
      )}
    </>
  ), [inputs, handleChange, renderField]);

  const renderDiabetesForm = useCallback(() => (
    <>
      {renderField("Gender", 
        <select name="gender" value={String(inputs.gender ?? '')} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      )}
      {renderField("Age (years, 0-120)", 
        <input name="age" type="number" placeholder="e.g., 50" value={String(inputs.age ?? '')} onChange={handleChange} min="0" max="120" />
      )}
      {renderField("Hypertension (0=No, 1=Yes)", 
        <select name="hypertension" value={String(inputs.hypertension ?? '')} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="0">No (0)</option>
          <option value="1">Yes (1)</option>
        </select>
      )}
      {renderField("Heart Disease (0=No, 1=Yes)", 
        <select name="heart_disease" value={String(inputs.heart_disease ?? '')} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="0">No (0)</option>
          <option value="1">Yes (1)</option>
        </select>
      )}
      {renderField("Smoking History", 
        <select name="smoking_history" value={String(inputs.smoking_history ?? '')} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="never">Never</option>
          <option value="former">Former</option>
          <option value="current">Current</option>
          <option value="No Info">No Info</option>
          <option value="ever">Ever</option>
        </select>
      )}
      {renderField("BMI (10-70)", 
        <input name="bmi" type="number" step="0.1" placeholder="e.g., 25.0" value={String(inputs.bmi ?? '')} onChange={handleChange} min="10" max="70" />
      )}
      {renderField("HbA1c Level (%, 3-20)", 
        <input name="HbA1c_level" type="number" step="0.1" placeholder="e.g., 6.0" value={String(inputs.HbA1c_level ?? '')} onChange={handleChange} min="3" max="20" />
      )}
      {renderField("Blood Glucose Level (mg/dL, 50-500)", 
        <input name="blood_glucose_level" type="number" placeholder="e.g., 120" value={String(inputs.blood_glucose_level ?? '')} onChange={handleChange} min="50" max="500" />
      )}
    </>
  ), [inputs, handleChange, renderField]);

  const renderCancerForm = useCallback(() => (
    <>
      {renderField("Age (years, 1-120)", 
        <input name="Age" type="number" placeholder="e.g., 30" value={String(inputs.Age ?? '')} onChange={handleChange} min="1" max="120" />
      )}
      {renderField("Gender", 
        <select name="Gender" value={String(inputs.Gender ?? '')} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
        </select>
      )}
      {renderField("BMI (10-60)", 
        <input name="BMI" type="number" step="0.1" placeholder="e.g., 22.0" value={String(inputs.BMI ?? '')} onChange={handleChange} min="10" max="60" />
      )}
      {renderField("Smoking (Yes/No)", 
        <select name="Smoking" value={String(inputs.Smoking ?? '')} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      )}
      {renderField("Genetic Risk Level (0-3, 0=None, 3=High)", 
        <select name="GeneticRisk" value={String(inputs.GeneticRisk ?? '')} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="0">0 (None)</option>
          <option value="1">1 (Low)</option>
          <option value="2">2 (Medium)</option>
          <option value="3">3 (High)</option>
        </select>
      )}
      {renderField("Physical Activity (0-10 scale)", 
        <input name="PhysicalActivity" type="number" step="0.1" placeholder="e.g., 5.0" value={String(inputs.PhysicalActivity ?? '')} onChange={handleChange} min="0" max="10" />
      )}
      {renderField("Alcohol Intake (0-10 scale)", 
        <input name="AlcoholIntake" type="number" step="0.1" placeholder="e.g., 3.0" value={String(inputs.AlcoholIntake ?? '')} onChange={handleChange} min="0" max="10" />
      )}
      {renderField("Past Cancer History (Yes/No)", 
        <select name="CancerHistory" value={String(inputs.CancerHistory ?? '')} onChange={handleChange}>
          <option value="">Select...</option>
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      )}
    </>
  ), [inputs, handleChange, renderField]);

  const renderBodyFatForm = useCallback(() => (
    <>
      {renderField("Body Density (1-10)", 
        <input name="Density" type="number" step="0.01" placeholder="e.g., 1.05" value={String(inputs.Density ?? '')} onChange={handleChange} min="1.01" max="9.99" />
      )}
      {renderField("Age (years, 1-120)", 
        <input name="Age" type="number" placeholder="e.g., 35" value={String(inputs.Age ?? '')} onChange={handleChange} min="2" max="119" />
      )}
      {renderField("Weight (kg, 1-200)", 
        <input name="Weight" type="number" step="0.1" placeholder="e.g., 72.0" value={String(inputs.Weight ?? '')} onChange={handleChange} min="1.1" max="199.9" />
      )}
      {renderField("Height (cm, 50-250)", 
        <input name="Height" type="number" step="0.1" placeholder="e.g., 175.0" value={String(inputs.Height ?? '')} onChange={handleChange} min="50.1" max="249.9" />
      )}
      {renderField("Neck Circumference (cm, 10-60)", 
        <input name="Neck" type="number" step="0.1" placeholder="e.g., 38.0" value={String(inputs.Neck ?? '')} onChange={handleChange} min="10.1" max="59.9" />
      )}
      {renderField("Chest Circumference (cm, 30-150)", 
        <input name="Chest" type="number" step="0.1" placeholder="e.g., 95.0" value={String(inputs.Chest ?? '')} onChange={handleChange} min="30.1" max="149.9" />
      )}
      {renderField("Abdomen Circumference (cm, 30-150)", 
        <input name="Abdomen" type="number" step="0.1" placeholder="e.g., 85.0" value={String(inputs.Abdomen ?? '')} onChange={handleChange} min="30.1" max="149.9" />
      )}
      {renderField("Hip Circumference (cm, 30-150)", 
        <input name="Hip" type="number" step="0.1" placeholder="e.g., 95.0" value={String(inputs.Hip ?? '')} onChange={handleChange} min="30.1" max="149.9" />
      )}
      {renderField("Thigh Circumference (cm, 20-100)", 
        <input name="Thigh" type="number" step="0.1" placeholder="e.g., 55.0" value={String(inputs.Thigh ?? '')} onChange={handleChange} min="20.1" max="99.9" />
      )}
      {renderField("Knee Circumference (cm, 20-70)", 
        <input name="Knee" type="number" step="0.1" placeholder="e.g., 38.0" value={String(inputs.Knee ?? '')} onChange={handleChange} min="20.1" max="69.9" />
      )}
      {renderField("Ankle Circumference (cm, 10-40)", 
        <input name="Ankle" type="number" step="0.1" placeholder="e.g., 22.0" value={String(inputs.Ankle ?? '')} onChange={handleChange} min="10.1" max="39.9" />
      )}
      {renderField("Biceps Circumference (cm, 15-60)", 
        <input name="Biceps" type="number" step="0.1" placeholder="e.g., 32.0" value={String(inputs.Biceps ?? '')} onChange={handleChange} min="15.1" max="59.9" />
      )}
      {renderField("Forearm Circumference (cm, 15-60)", 
        <input name="Forearm" type="number" step="0.1" placeholder="e.g., 28.0" value={String(inputs.Forearm ?? '')} onChange={handleChange} min="15.1" max="59.9" />
      )}
      {renderField("Wrist Circumference (cm, 10-30)", 
        <input name="Wrist" type="number" step="0.1" placeholder="e.g., 17.0" value={String(inputs.Wrist ?? '')} onChange={handleChange} min="10.1" max="29.9" />
      )}
    </>
  ), [inputs, handleChange, renderField]);

  // Main form renderer
  const renderForm = useCallback(() => {
    switch (selectedModel) {
      case "Heart Disease":
        return renderHeartForm();
      case "Diabetes":
        return renderDiabetesForm();
      case "Cancer Diagnosis":
        return renderCancerForm();
      case "Body Fat Estimation":
        return renderBodyFatForm();
      default:
        return null;
    }
  }, [selectedModel, renderHeartForm, renderDiabetesForm, renderCancerForm, renderBodyFatForm]);

  return (
    <>
      <div className="form-container">
        <h2>{selectedModel}</h2>
        <button 
          className="speak-btn"
          onClick={startListening} 
          disabled={isListening || !selectedModel}
        >
          {isListening ? '🎤 Listening...' : '🎤 Speak Input'}
        </button>
        <div className="inputs">{renderForm()}</div>
        <button className="predict-btn" onClick={handlePredict} disabled={!isFormValid()}>
          🔍 Predict
        </button>
        {result && (
          <pre className="result">
            {result}
            <button className="speak-btn" onClick={() => speakResult(result)} style={{ marginTop: '1rem', width: 'auto' }}>
              🔊 Hear Again
            </button>
          </pre>
        )}
      </div>
      
      <button 
        className="voice-agent-btn-fixed"
        onClick={isChatting ? endVoiceAgent : startVoiceAgent} 
        disabled={!selectedModel}
        title={isChatting ? "End AI Call" : "Call AI Assistant"}
      >
        {isChatting ? '🛑' : '📞'}
      </button>
    </>
  );
}

export default PredictionForm;