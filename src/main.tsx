import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import Connect from "./Connect";
import { I18nProvider } from "./i18n";
import "./index.css";

const path = window.location.pathname;

createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    {(path.startsWith("/connect") || path.startsWith("/welcome")) ? <Connect /> : <App />}
  </I18nProvider>
);

function setAppVh() {
  const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  document.documentElement.style.setProperty("--app-vh", `${h}px`);
}
setAppVh();
window.addEventListener("resize", setAppVh);
window.visualViewport?.addEventListener("resize", setAppVh);
window.visualViewport?.addEventListener("scroll", setAppVh);
