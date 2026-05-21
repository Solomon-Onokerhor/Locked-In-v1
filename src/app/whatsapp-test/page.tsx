"use client";

import { useState } from "react";

export default function WhatsAppTestPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("Hello from Locked In via GCP!");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSend = async () => {
    if (!phoneNumber) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          message: message,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send message");
      }

      setStatus("success");
    } catch (error: any) {
      console.error("WhatsApp Error:", error);
      setStatus("error");
      setErrorMsg(error.message || "An unknown error occurred");
    }
  };

  return (
    <div className="container max-w-lg mx-auto py-20 text-white">
      <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-lg shadow-xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold">WhatsApp Service Test</h2>
          <p className="text-zinc-400 text-sm">Send a test message using the GCP WhatsApp microservice.</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number</label>
            <input
              type="text"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. +31612345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <p className="text-xs text-zinc-500">Include country code (e.g. +31)</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <input
              type="text"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Test message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button 
            className="w-full bg-white text-black font-semibold rounded-md p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-200 transition-colors"
            onClick={handleSend}
            disabled={!phoneNumber || status === "loading"}
          >
            {status === "loading" ? "Sending..." : "Send Test Message"}
          </button>

          {status === "success" && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-md text-sm">
              Message sent successfully! Check WhatsApp.
            </div>
          )}
          
          {status === "error" && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-sm">
              Error: {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
