

---

# 📌 AI-First CRM – HCP Interaction Module

## 🧠 Overview

This project is an AI-first CRM system designed for managing Healthcare Professional (HCP) interactions in the life sciences domain.

It allows users to log interactions using:

* 📝 Structured form UI (React + Redux)
* 💬 AI-powered chat interface (LLM-based extraction)

The system converts natural language into structured CRM data using an LLM agent with a LangGraph-inspired architecture.

---

## 🚀 Key Features

### 🤖 AI-Powered Data Extraction

* Converts natural language into structured CRM fields
* Extracts:

  * HCP name
  * Interaction type
  * Date & time
  * Sentiment
  * Notes
  * Materials shared
  * Follow-ups

---

### 💬 Dual Interaction System

* Manual form entry
* Conversational AI assistant for logging and corrections

---

### 🧠 LangGraph-Inspired Architecture

* Modular tool-based agent design
* State-driven workflow
* Extensible for enterprise CRM systems

---

### 📊 Smart Partial Updates

* Only updates fields mentioned in user input
* Preserves existing form state
* Supports real-time corrections via chat

---

### 🗄️ Database Persistence

* PostgreSQL database
* SQLAlchemy ORM
* Upsert-based interaction logging

---

## 🏗️ System Architecture

Frontend (React + Redux)
↓
FastAPI Backend
↓
AI Agent Layer (LangGraph-style)
↓
Groq LLM (Llama-3.3-70B)
↓
Tool Execution Layer
↓
PostgreSQL Database

---

## 🧩 Tech Stack

### Frontend

* React.js
* Redux Toolkit
* Tailwind CSS
* Axios

### Backend

* FastAPI
* Python 3.10+
* SQLAlchemy
* Pydantic

### AI Layer

* Groq LLM (llama-3.3-70b-versatile)
* LangGraph-inspired agent design

### Database

* PostgreSQL

---

## 🧠 LangGraph Agent Design

The system simulates a LangGraph workflow using modular tools:

### 🔹 Router Node

Determines execution path based on user input.

### 🔹 Log Interaction Tool

Extracts structured CRM data from natural language.

### 🔹 Edit Interaction Tool (design-ready)

Handles corrections to existing interactions.

### 🔹 Normalization Layer

Ensures:

* Sentiment standardization
* Date normalization
* Interaction type mapping

### 🔹 Final Merge Node

Merges:

* Existing form state
* New AI-generated updates

---

## 🔌 API Endpoints

### Chat Endpoint

**POST** `/api/chat`

Request:

```json
{
  "message": "Today I met Dr. Smith and discussed product X efficiency",
  "current_form": {}
}
```

Response:

```json
{
  "response": {
    "hcp_name": "Dr. Smith",
    "interaction_type": "Meeting",
    "date": "2026-04-24",
    "notes": "discussed product X efficiency",
    "sentiment": "Positive 😊"
  }
}
```

---

### Log Interaction Endpoint

**POST** `/api/log`

Stores or updates structured CRM data in PostgreSQL.

---

## 🗄️ Database Schema

Table: `interactions`

* id (Primary Key)
* hcp_name
* interaction_type
* notes
* date
* time
* attendees
* materials_shared
* samples_distributed
* sentiment
* outcomes
* follow_up

---

## 🧠 AI Behavior

### Extraction Rules

* “today” → current system date
* “call/email” → normalized interaction type
* sentiment mapped to:

  * Positive 😊
  * Neutral 😐
  * Negative 😞

---

### Correction Handling

Supports partial updates like:

* “Actually Dr. X”
* “Sentiment was negative”
* “It was a call not meeting”

Only updates relevant fields.

---

## ⚙️ Setup Instructions

### 1. Clone repository

```bash
git clone <repo-url>
cd project
```

---

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt
```

Create `.env`:

```env
GROQ_API_KEY=your_api_key_here
```

Run server:

```bash
uvicorn main:app --reload
```

---

### 3. Frontend setup

```bash
cd frontend
npm install
npm start
```

---

## 📌 Example Use Case

### Input:

> Today I met Dr. Smith and discussed product X efficiency. Sentiment was positive and I shared brochures.

### Output:

```json
{
  "hcp_name": "Dr. Smith",
  "interaction_type": "Meeting",
  "date": "2026-04-24",
  "notes": "product X efficiency discussion",
  "materials_shared": "brochures",
  "sentiment": "Positive 😊"
}
```

---

## 🔥 Key Highlights

* Real-world CRM simulation for life sciences
* AI + structured form hybrid system
* LangGraph-style modular architecture
* Robust state handling with partial updates
* Production-ready FastAPI backend
* Scalable agent-based design

---

## 📈 Future Improvements

* Full LangGraph implementation with explicit tool nodes
* Authentication system (OAuth2)
* Audit logs for compliance (GxP readiness)
* Multi-HCP timeline view
* Voice-to-CRM logging

---

## 👨‍💻 Author

**Kushal Pandey**

Full-Stack Developer

---

## ✅ Status

* Backend: Working
* AI Agent: Functional
* Database: Connected
* Frontend: Integrated


---


