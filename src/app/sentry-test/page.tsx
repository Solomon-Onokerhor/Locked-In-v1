"use client";

import React from "react";

export default function SentryTest() {
  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h1>Sentry Test Page</h1>
      <button
        onClick={() => {
          throw new Error("Sentry Frontend Error Test!");
        }}
        style={{
          padding: "10px 20px",
          backgroundColor: "#ff4d4f",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Throw Test Error
      </button>
    </div>
  );
}
