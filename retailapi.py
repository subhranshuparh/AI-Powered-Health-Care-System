from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from retell import Retell  # Ensure this matches your installed SDK
import os
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Make sure RETELL_API_KEY is set in your environment variables
API_KEY = os.getenv("RETELL_API_KEY")
if not API_KEY:
    raise ValueError("RETELL_API_KEY not found in environment variables")

retell = Retell(api_key=API_KEY)

class FormUpdate(BaseModel):
    field: str
    value: object

@app.post("/start-web-call")
async def start_web_call():
    agent_id = "agent_73c01dd3f7260d7b433b8d48cc"
    try:
        # Check if the SDK method is actually async or sync
        # For async, use: await retell.call.create_web_call(agent_id)
        # For sync, just call: retell.call.create_web_call(agent_id)
        if hasattr(retell.call, "create_web_call"):
            web_call = retell.call.create_web_call(agent_id=agent_id)  # sync
        elif hasattr(retell.call, "createWebCall"):
            web_call = await retell.call.createWebCall(agent_id=agent_id)  # async
        else:
            raise AttributeError("No method found to start web call in Retell SDK")
        
        return {"access_token": web_call.access_token}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update-form")
async def update_form(update: FormUpdate):
    print(f"Updated {update.field} to {update.value}")
    return {"status": "updated"}

# Optional: Endpoint to update agent voice (for testing; remove if not needed)
@app.post("/update-agent-voice")
async def update_agent_voice(voice_id: str):
    try:
        updated_agent = retell.agent.update(
            agent_id="agent_73c01dd3f7260d7b433b8d48cc",
            voice_id=voice_id  # e.g., "elevenlabs-emma"
        )
        return {"status": "updated", "agent": updated_agent}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)