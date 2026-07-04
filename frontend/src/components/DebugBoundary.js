import React from "react";

class DebugBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.error) {
      return (
        <pre
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            background: "white",
            color: "red",
            padding: 16,
            overflow: "auto",
            fontSize: 12,
            whiteSpace: "pre-wrap",
          }}
        >
{`REACT RENDER ERROR

Message:
${this.state.error?.message || String(this.state.error)}

Stack:
${this.state.error?.stack || "no stack"}

Component stack:
${this.state.errorInfo?.componentStack || "no component stack"}

URL:
${window.location.href}

Pathname:
${window.location.pathname}`}
        </pre>
      );
    }

    return this.props.children;
  }
}

export default DebugBoundary;