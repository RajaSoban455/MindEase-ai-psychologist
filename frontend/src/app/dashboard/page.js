"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { startSession, sendMessage, endSession, submitFeedback } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();

  const [session, setSession] = useState(null);        // current session object
  const [messageText, setMessageText] = useState("");   // input box value
  const [loading, setLoading] = useState(false);        // waiting for AI response
  const [showFeedback, setShowFeedback] = useState(false); // show recommendation + feedback popup
  const [error, setError] = useState("");

  const chatEndRef = useRef(null); // used to auto-scroll the chat to the bottom

  // On page load, check if the user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  // Whenever a new message arrives, scroll the chat down
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages]);

  const handleStartSession = async () => {
    setError("");
    try {
      const response = await startSession();
      setSession(response.data);
    } catch (err) {
      setError("Could not start session. Please try again.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return; // don't send an empty message

    setLoading(true);
    setError("");
    try {
      const response = await sendMessage(session.id, messageText);
      setSession(response.data);
      setMessageText("");
    } catch (err) {
      setError("Could not send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await endSession(session.id);
      setSession(response.data);
      setShowFeedback(true); // show the recommendation + feedback popup
    } catch (err) {
      setError("Could not end session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (feedbackValue) => {
    try {
      await submitFeedback(session.id, feedbackValue);
      setShowFeedback(false);
      setSession(null); // session done, go back to "Start Session" state
    } catch (err) {
      setError("Could not submit feedback.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">MindEase</h1>
        <div className="flex gap-4 items-center">
          <a href="/history" className="text-sm text-blue-600 underline">
            History
          </a>
          <button onClick={handleLogout} className="text-sm text-gray-500 underline">
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center p-6">
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* If there's no session yet, show the Start button */}
        {!session && (
          <div className="mt-20 text-center">
            <p className="text-gray-600 mb-4">
              Ready to talk? Start a new session whenever you&apos;re comfortable.
            </p>
            <button
              onClick={handleStartSession}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Start Session
            </button>
          </div>
        )}

        {/* If a session is active, show the chat window */}
        {session && (
          <div className="w-full max-w-2xl bg-white rounded-lg shadow flex flex-col h-[70vh]">
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {session.messages.length === 0 && (
                <p className="text-gray-400 text-center mt-10">
                  Say hello to start the conversation...
                </p>
              )}
              {session.messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-lg ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {msg.text || msg.content}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Message input — only show while the session is active */}
            {session.is_active === "true" && (
              <form onSubmit={handleSendMessage} className="border-t p-3 flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border rounded px-3 py-2"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "..." : "Send"}
                </button>
                <button
                  type="button"
                  onClick={handleEndSession}
                  disabled={loading}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
                >
                  End
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Recommendation + Feedback popup, shown after the session ends */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center max-h-[85vh] overflow-y-auto">
            <p className="font-semibold text-green-700 mb-1 text-left">Recommendation:</p>
            <p className="text-gray-700 text-sm mb-5 text-left">{session?.recommendation}</p>

            <h2 className="text-lg font-bold mb-4">How was your session?</h2>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleFeedbackSubmit("satisfied")}
                className="bg-green-500 text-white py-2 rounded hover:bg-green-600"
              >
                Satisfied
              </button>
              <button
                onClick={() => handleFeedbackSubmit("moderate")}
                className="bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
              >
                Moderately Satisfied
              </button>
              <button
                onClick={() => handleFeedbackSubmit("not_satisfied")}
                className="bg-red-500 text-white py-2 rounded hover:bg-red-600"
              >
                Not Satisfied
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}