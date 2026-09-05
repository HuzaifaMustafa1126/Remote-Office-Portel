import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { applyTheme, initialPreferences } from "./theme/theme";
import "./index.css";
applyTheme(initialPreferences(), window.matchMedia("(prefers-color-scheme: dark)").matches);
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
