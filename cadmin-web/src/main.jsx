// cadmin-web/src/main.jsx (do not remove this comment)
import React from "react";
import ReactDOM from "react-dom/client";
import { ToastProvider } from "./components/common/Toast";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
    <App />
    </ToastProvider>
  </React.StrictMode>
);
