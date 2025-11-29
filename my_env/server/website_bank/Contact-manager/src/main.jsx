import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import Contact from "./components/Contact.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
