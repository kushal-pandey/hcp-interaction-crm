import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateForm, addChatMessage } from "./store";
import axios from "axios";

const SENTIMENT_OPTIONS = [
  { value: "Positive 😊", label: "Positive", emoji: "😊" },
  { value: "Neutral 😐", label: "Neutral", emoji: "😐" },
  { value: "Negative 😞", label: "Negative", emoji: "😞" },
];

function App() {
  const dispatch = useDispatch();
  const { formData, chatHistory } = useSelector((state) => state.interaction);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizeSentiment = (data) => {
    if (!data.sentiment) return data;

    const map = {
      positive: "Positive 😊",
      "positive 😊": "Positive 😊",
      Positive: "Positive 😊",

      neutral: "Neutral 😐",
      "neutral 😐": "Neutral 😐",
      Neutral: "Neutral 😐",

      negative: "Negative 😞",
      "negative 😞": "Negative 😞",
      Negative: "Negative 😞",
    };

    return {
      ...data,
      sentiment: map[data.sentiment] || data.sentiment,
    };
  };

  const handleFormChange = (e) => {
    dispatch(updateForm({ [e.target.name]: e.target.value }));
  };

  const submitForm = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/api/log", formData);
      alert("Interaction saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to save. Check console.");
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg = { role: "user", content: chatInput };
    dispatch(addChatMessage(userMsg));
    setChatInput("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/api/chat", {
        message: userMsg.content,
        current_form: formData, // ✅ Send current form so agent can handle corrections
      });

      const response = res.data.response;
      // response = { type: "form_update" | "text" | "error", data: {...} }

      if (response.type === "form_update" && response.data) {
        dispatch(updateForm(normalizeSentiment(response.data)));
        dispatch(
          addChatMessage({
            role: "agent",
            content: JSON.stringify(response.data, null, 2),
          }),
        );
      } else {
        dispatch(
          addChatMessage({
            role: "agent",
            content:
              response.data || "I couldn't understand that. Please try again.",
          }),
        );
      }
    } catch (error) {
      dispatch(
        addChatMessage({
          role: "agent",
          content: "Error connecting to AI Agent.",
        }),
      );
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* ───────────────────────────── LEFT: FORM ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
          <h1 className="text-xl font-semibold mb-6">Log HCP Interaction</h1>

          <form onSubmit={submitForm} className="space-y-6">
            {/* ── Interaction Details ── */}
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Interaction Details
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HCP Name
                  </label>
                  <input
                    type="text"
                    name="hcp_name"
                    value={formData.hcp_name || ""}
                    onChange={handleFormChange}
                    placeholder="Search or select HCP..."
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interaction Type
                  </label>
                  <select
                    name="interaction_type"
                    value={formData.interaction_type || "Meeting"}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option>Meeting</option>
                    <option>Call</option>
                    <option>Email</option>
                  </select>
                </div>
              </div>
            </section>

            {/* ── Date & Time ── */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date || ""}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time || ""}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>

            {/* ── Attendees ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attendees
              </label>
              <input
                type="text"
                name="attendees"
                value={formData.attendees || ""}
                onChange={handleFormChange}
                placeholder="Enter names or search..."
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* ── Topics Discussed ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topics Discussed
              </label>
              <textarea
                name="notes"
                value={formData.notes || ""}
                onChange={handleFormChange}
                placeholder="Enter key discussion points..."
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
              <button
                type="button"
                className="mt-1 text-xs text-blue-500 flex items-center gap-1 hover:underline"
              >
                🎙️ Summarize from Voice Note (Requires Consent)
              </button>
            </div>

            {/* ── Materials Shared / Samples ── */}
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Materials Shared / Samples Distributed
              </p>

              {/* Materials Shared */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Materials Shared
                </label>
                {formData.materials_shared ? (
                  <p className="text-sm text-gray-600 mb-2">
                    {formData.materials_shared}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 mb-2">
                    No materials added.
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="materials_shared"
                    value={formData.materials_shared || ""}
                    onChange={handleFormChange}
                    placeholder="e.g. Brochures, Leaflets..."
                    className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button
                    type="button"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1 whitespace-nowrap"
                  >
                    🔍 Search/Add
                  </button>
                </div>
              </div>

              {/* Samples Distributed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Samples Distributed
                </label>
                {formData.samples_distributed ? (
                  <p className="text-sm text-gray-600 mb-2">
                    {formData.samples_distributed}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 mb-2">
                    No samples added.
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="samples_distributed"
                    value={formData.samples_distributed || ""}
                    onChange={handleFormChange}
                    placeholder="e.g. Sample pack, Trial dose..."
                    className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button
                    type="button"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                  >
                    + Add Sample
                  </button>
                </div>
              </div>
            </section>

            {/* ── Sentiment ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observed/Inferred HCP Sentiment
              </label>
              <div className="flex gap-6">
                {SENTIMENT_OPTIONS.map(({ value, label, emoji }) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="sentiment"
                      value={value}
                      checked={formData.sentiment === value}
                      onChange={handleFormChange}
                      className="accent-orange-400"
                    />
                    <span className="text-sm text-gray-700">
                      {emoji} {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* ── Outcomes ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outcomes
              </label>
              <textarea
                name="outcomes"
                value={formData.outcomes || ""}
                onChange={handleFormChange}
                placeholder="Key outcomes or agreements..."
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
            </div>

            {/* ── Follow-up Actions ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Follow-up Actions
              </label>
              <textarea
                name="follow_up"
                value={formData.follow_up || ""}
                onChange={handleFormChange}
                placeholder="e.g. Schedule next meeting, Send follow-up email..."
                rows={2}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium"
            >
              Save Details
            </button>
          </form>
        </div>
      </div>

      {/* ───────────────────────────── RIGHT: CHAT ───────────────────────────── */}
      <div className="w-80 bg-white border-l shadow-lg flex flex-col h-screen sticky top-0">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            🤖 AI Assistant
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Log Interaction details here via chat
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {/* Static hint bubble */}
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-gray-600 leading-relaxed">
            Log interaction details here (e.g., "Met Dr. Smith, discussed
            Prodo-X efficacy, positive sentiment, shared brochure") or ask for
            help.
          </div>

          {chatHistory.map((msg, idx) => {
            // ✅ Success card
            if (msg.content === "success") {
              return (
                <div
                  key={idx}
                  className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm text-gray-700 leading-relaxed"
                >
                  ✅ <strong>Interaction logged successfully!</strong> The
                  details (HCP Name, Date, Sentiment, and Materials) have been
                  automatically populated based on your summary. Would you like
                  me to suggest a specific follow-up action, such as scheduling
                  a meeting?
                </div>
              );
            }

            return (
              <div
                key={idx}
                className={`p-3 rounded-lg text-sm leading-relaxed max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-blue-100 ml-auto text-gray-800"
                    : "bg-gray-100 mr-auto text-gray-700"
                }`}
              >
                {typeof msg.content === "string"
                  ? msg.content
                  : JSON.stringify(msg.content)}
              </div>
            );
          })}

          {loading && (
            <p className="text-xs text-gray-400 italic">Agent is typing...</p>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t flex gap-2 items-stretch">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
            className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Describe Interaction..."
          />
          <button
            onClick={sendChatMessage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-md text-xs font-semibold leading-tight flex flex-col items-center justify-center"
          >
            <span>AI</span>
            <span>Log</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
