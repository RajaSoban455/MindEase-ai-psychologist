"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMySessions } from "@/lib/api";

const feedbackLabels = {
  satisfied: "😊 Satisfied",
  moderate: "😐 Moderately Satisfied",
  not_satisfied: "😞 Not Satisfied",
};

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchSessions = async () => {
      try {
        const response = await getMySessions();
        setSessions(response.data);
      } catch (err) {
        setError("Could not load session history.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [router]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Session History</h1>
        <a href="/dashboard" className="text-sm text-blue-600 underline">
          Back to Dashboard
        </a>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && sessions.length === 0 && (
          <p className="text-gray-500 text-center mt-10">
            No sessions yet. Start your first session from the Dashboard.
          </p>
        )}

        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="bg-white rounded-lg shadow p-4">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleExpand(s.id)}
              >
                <div>
                  <p className="font-semibold">
                    {new Date(s.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {s.is_active === "true" ? "In Progress" : "Completed"} ·{" "}
                    {s.messages.length} messages
                  </p>
                </div>
                {s.feedback && (
                  <span className="text-sm">{feedbackLabels[s.feedback]}</span>
                )}
              </div>

              {expandedId === s.id && (
                <div className="mt-4 border-t pt-4 space-y-2">
                  {s.messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`text-sm ${
                        msg.role === "user" ? "text-blue-700" : "text-gray-700"
                      }`}
                    >
                      <span className="font-semibold">
                        {msg.role === "user" ? "You: " : "AI: "}
                      </span>
                      {msg.text || msg.content}
                    </div>
                  ))}

                  {s.recommendation && (
                    <div className="bg-green-50 p-3 rounded mt-3">
                      <p className="font-semibold text-green-700 text-sm">
                        Recommendation:
                      </p>
                      <p className="text-sm text-gray-700">{s.recommendation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}