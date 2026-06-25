import { useEffect, useState } from "react";

export default function DebugErrorScreen() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const showError = (message) => {
      setError(String(message));
    };

    window.onerror = (message, source, lineno, colno, error) => {
      showError(
        `ERROR: ${message}\nSOURCE: ${source}\nLINE: ${lineno}:${colno}\nSTACK: ${error?.stack || "no stack"}`
      );
    };

    window.onunhandledrejection = (event) => {
      showError(
        `PROMISE ERROR: ${event.reason?.message || event.reason}\nSTACK: ${event.reason?.stack || "no stack"}`
      );
    };
  }, []);

  if (!error) return null;

  return (
    <pre style={{
      position: "fixed",
      inset: 0,
      zIndex: 999999,
      background: "white",
      color: "red",
      padding: 16,
      overflow: "auto",
      fontSize: 12,
      whiteSpace: "pre-wrap"
    }}>
      {error}
    </pre>
  );
}