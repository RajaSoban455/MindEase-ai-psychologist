import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

// Ek "axios instance" banate hain jisme base URL already set hai
// taake har jagah poora URL na likhna pade
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Yeh "interceptor" har request ke sath automatically token attach kar deta hai
// (agar token localStorage mein maujood hai)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const startSession = () => api.post("/session/start");

export const sendMessage = (sessionId, text) =>
  api.post(`/session/${sessionId}/chat`, { text });

export const endSession = (sessionId) =>
  api.post(`/session/${sessionId}/end`);

export const submitFeedback = (sessionId, feedback) =>
  api.post(`/session/${sessionId}/feedback`, { feedback });

export const getMySessions = () => api.get("/sessions");