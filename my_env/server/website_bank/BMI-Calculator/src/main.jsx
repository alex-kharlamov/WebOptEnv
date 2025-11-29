import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TolgeeProvider } from "@tolgee/react";
import { Tolgee, DevTools } from "@tolgee/web";

const tolgee = Tolgee()
  .use(DevTools())
  .init({
    apiUrl: "https://app.tolgee.io",
    language: "en",
    fallbackLanguage: "en",
  });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <TolgeeProvider tolgee={tolgee}>
      <App />
    </TolgeeProvider>
  </StrictMode>
);
