from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from db import SessionLocal, InteractionDB, Base, engine
from graph_agent import run_agent

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI-First CRM HCP Module")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request Models ──────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    current_form: Optional[Dict[str, Any]] = None  # ✅ receives form state for corrections

class InteractionForm(BaseModel):
    hcp_name: Optional[str] = ""
    interaction_type: Optional[str] = "Meeting"
    date: Optional[str] = ""
    time: Optional[str] = ""
    attendees: Optional[str] = ""
    notes: Optional[str] = ""
    materials_shared: Optional[str] = ""
    samples_distributed: Optional[str] = ""
    sentiment: Optional[str] = "Positive 😊"
    outcomes: Optional[str] = ""
    follow_up: Optional[str] = ""

# ── Chat Endpoint ───────────────────────────────────────────────────────────

@app.post("/api/chat")
def chat_with_agent(req: ChatRequest):
    try:
        print(f"[chat] message: {req.message}")
        reply = run_agent(req.message, req.current_form)
        print(f"[chat] reply: {reply}")
        
        if isinstance(reply, dict) and "final_output" in reply:
            return {"response": reply["final_output"]}
        return {"response": reply}
    except Exception as e:
        print(f"[chat] ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── Log / Save Endpoint ─────────────────────────────────────────────────────

@app.post("/api/log")
def log_interaction(interaction: InteractionForm):
    db = SessionLocal()
    try:
        data = interaction.dict()

        existing = db.query(InteractionDB).filter(
            InteractionDB.hcp_name == interaction.hcp_name
        ).first()

        if existing:
            for field, value in data.items():
                setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            return {"status": "updated", "id": existing.id}

        db_item = InteractionDB(**data)
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return {"status": "created", "id": db_item.id}
    finally:
        db.close()

# ── Run ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)