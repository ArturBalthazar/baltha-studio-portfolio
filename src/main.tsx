import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import Welcome from "./Welcome";
import "./index.css";

const path = window.location.pathname;

createRoot(document.getElementById("root")!).render(
  path.startsWith("/welcome") ? <Welcome /> : <App />
);

function setAppVh() {
  const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  document.documentElement.style.setProperty("--app-vh", `${h}px`);
}
setAppVh();
window.addEventListener("resize", setAppVh);
window.visualViewport?.addEventListener("resize", setAppVh);
window.visualViewport?.addEventListener("scroll", setAppVh);
