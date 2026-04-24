import { configureStore, createSlice } from "@reduxjs/toolkit";

const interactionSlice = createSlice({
  name: "interaction",
  initialState: {
    formData: {
      hcp_name: "",
      interaction_type: "Meeting",
      date: "",
      time: "",
      attendees: "",
      notes: "",
      materials_shared: "",
      samples_distributed: "",
      sentiment: "Positive 😊",
      outcomes: "",
      follow_up: "",
    },
    chatHistory: [],
  },
  reducers: {
    updateForm: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    addChatMessage: (state, action) => {
      state.chatHistory.push(action.payload);
    },
  },
});

export const { updateForm, addChatMessage } = interactionSlice.actions;

export const store = configureStore({
  reducer: {
    interaction: interactionSlice.reducer,
  },
});