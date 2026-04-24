import os
import json
from datetime import datetime
from langchain_groq import ChatGroq

# ─────────────────────────────────────────────
# LLM SETUP
# ─────────────────────────────────────────────

llm = ChatGroq(
    model_name="llama-3.3-70b-versatile",
    temperature=0,
    api_key=os.environ.get("GROQ_API_KEY"),
)

# ─────────────────────────────────────────────
# SIMPLE STATE (LangGraph-like dict state)
# ─────────────────────────────────────────────

class CRMState(dict):
    pass


# ─────────────────────────────────────────────
# TOOL: CRM EXTRACTION
# ─────────────────────────────────────────────

def log_interaction_tool(state: CRMState):
    today = datetime.now().strftime("%Y-%m-%d")

    prompt = f"""
You are a strict CRM extraction system.

Return ONLY valid JSON. No explanation. No markdown.

Extract the following fields:
- hcp_name
- interaction_type
- date
- time
- attendees
- notes
- materials_shared
- samples_distributed
- sentiment
- outcomes
- follow_up

Rules:
- If user mentions "today" → date = {today}
- interaction_type:
  call → Call
  email → Email
  otherwise → Meeting
- sentiment must be EXACT:
  "Positive 😊", "Neutral 😐", "Negative 😞"

INPUT:
{state["user_input"]}
"""

    res = llm.invoke(prompt).content

    print("\n🧠 RAW LLM OUTPUT:\n", res)

    try:
        cleaned = res.strip()

        # remove markdown if present
        cleaned = cleaned.replace("```json", "").replace("```", "").strip()

        # extract JSON safely
        start = cleaned.find("{")
        end = cleaned.rfind("}")

        if start == -1 or end == -1:
            raise ValueError("No JSON found in LLM output")

        json_str = cleaned[start:end + 1]

        output = json.loads(json_str)

    except Exception as e:
        print("❌ JSON PARSE FAILED:", e)
        print("RAW OUTPUT WAS:\n", res)
        output = {}

    return {"tool_output": output}


# ─────────────────────────────────────────────
# FINAL MERGE NODE
# ─────────────────────────────────────────────

def final_node(state: CRMState):
    current_form = state.get("current_form", {}) or {}
    tool_output = state.get("tool_output", {}) or {}

    print("\n📦 CURRENT FORM:", current_form)
    print("\n📦 TOOL OUTPUT:", tool_output)

    # safe merge (no overwriting issues)
    merged = current_form.copy()
    merged.update(tool_output)

    return {"final_output": merged}


# ─────────────────────────────────────────────
# ROUTER (SIMPLE FLOW)
# ─────────────────────────────────────────────

def router(state: CRMState):
    return "log"


# ─────────────────────────────────────────────
# MAIN ENTRY (USED BY FASTAPI)
# ─────────────────────────────────────────────

def run_agent(user_input: str, current_form: dict = None):
    print("\n🔥 LANGGRAPH EXECUTED")

    state = CRMState({
        "user_input": user_input,
        "current_form": current_form or {},
        "tool_output": {}
    })

    # STEP 1: ROUTE
    action = router(state)

    # STEP 2: TOOL EXECUTION
    if action == "log":
        tool_result = log_interaction_tool(state)
        state.update(tool_result)

    # STEP 3: FINAL MERGE
    result = final_node(state)

    return result["final_output"]