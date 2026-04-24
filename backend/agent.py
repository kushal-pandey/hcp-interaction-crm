import os
import json
import re
from langchain_groq import ChatGroq
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────
# LLM SETUP
# ─────────────────────────────────────────────

llm = ChatGroq(
    model_name="llama-3.3-70b-versatile",
    temperature=0,
    api_key=os.environ.get("GROQ_API_KEY"),
)

# ─────────────────────────────────────────────
# SYSTEM PROMPT (CLEANED - NO DATE CONFLICT)
# ─────────────────────────────────────────────

SYSTEM_PROMPT = """
You are an AI assistant embedded in a pharmaceutical CRM system.

Your job is to extract or update structured HCP interaction data from natural language.

You will receive:
1. A user message describing an interaction or correction
2. The current form state as context

────────────────────────────────────────────
OUTPUT RULES — STRICT:
────────────────────────────────────────────
- Return ONLY valid JSON
- No markdown, no explanations
- Output MUST be a single JSON object
- Only include fields explicitly mentioned or inferred
- Do NOT overwrite fields unless explicitly corrected

AVAILABLE FIELDS:
{
  "hcp_name": "string",
  "interaction_type": "Meeting | Call | Email",
  "date": "YYYY-MM-DD",
  "time": "HH:MM (24h format)",
  "attendees": "string",
  "notes": "string",
  "materials_shared": "string",
  "samples_distributed": "string",
  "sentiment": "Positive 😊 | Neutral 😐 | Negative 😞",
  "outcomes": "string",
  "follow_up": "string"
}

────────────────────────────────────────────
OTHER RULES:
────────────────────────────────────────────

INTERACTION TYPE:
- call/called/phone → Call
- email/emailed → Email
- default → Meeting

SENTIMENT RULE (STRICT):
- positive/good/great → Positive 😊
- neutral/okay/fine → Neutral 😐
- negative/bad/poor → Negative 😞

CORRECTIONS:
- If user corrects a field → return ONLY that field
"""

# ─────────────────────────────────────────────
# SENTIMENT NORMALIZER
# ─────────────────────────────────────────────

def normalize_sentiment(value):
    if not value:
        return value

    v = value.strip().lower()

    if v in ["positive", "good", "great", "happy", "satisfied"]:
        return "Positive 😊"
    if v in ["neutral", "okay", "fine"]:
        return "Neutral 😐"
    if v in ["negative", "bad", "poor", "not good", "unsatisfied"]:
        return "Negative 😞"

    return value


# ─────────────────────────────────────────────
# MAIN PROCESS FUNCTION
# ─────────────────────────────────────────────

def process_chat(user_input: str, current_form: dict = None):
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        yesterday = datetime.now().replace(day=datetime.now().day - 1).strftime("%Y-%m-%d")

        context = ""
        if current_form:
            context = f"\n\nCurrent form state:\n{json.dumps(current_form, indent=2)}"

        response = llm.invoke([
            ("system", SYSTEM_PROMPT),
            ("user", user_input + context),
        ])

        content = response.content.strip()

        # ─────────────────────────────────────────────
        # CLEAN LLM OUTPUT
        # ─────────────────────────────────────────────

        cleaned = re.sub(r"```(?:json)?", "", content).replace("```", "").strip()

        try:
            parsed = json.loads(cleaned)

            if not isinstance(parsed, dict):
                return {"type": "text", "data": cleaned}

            # ─────────────────────────────────────────────
            # POST-PROCESSING (SOURCE OF TRUTH)
            # ─────────────────────────────────────────────

            user_text = user_input.lower()

            # DATE HANDLING (ONLY PYTHON IS AUTHORITY)
            if "today" in user_text or ("met" in user_text and "yesterday" not in user_text):
                parsed["date"] = today

            if "yesterday" in user_text:
                parsed["date"] = yesterday

            # SENTIMENT NORMALIZATION
            if "sentiment" in parsed and parsed["sentiment"]:
                parsed["sentiment"] = normalize_sentiment(parsed["sentiment"])

            # REMOVE NULLS (CLEAN OUTPUT)
            parsed = {k: v for k, v in parsed.items() if v is not None}

            return {
                "type": "form_update",
                "data": parsed
            }

        except Exception as parse_err:
            print(f"[agent] JSON parse error: {parse_err}")
            print(f"[agent] Raw output: {content}")
            print(f"[agent] Cleaned output: {cleaned}")
            return {"type": "text", "data": cleaned}

    except Exception as e:
        print(f"[agent] LLM error: {e}")
        return {"type": "error", "data": str(e)}