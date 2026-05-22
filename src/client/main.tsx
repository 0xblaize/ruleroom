import React from "react";
import { createRoot } from "react-dom/client";
import { RuleRoomApp } from "@/components/RuleRoomApp";
import "@/app/globals.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RuleRoomApp />
  </React.StrictMode>
);
