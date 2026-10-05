import React from "react";
import ReactDOM from "react-dom/client";
import { CatalogViewer } from "./components/CatalogViewer";
import "./styles/catalog.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CatalogViewer />
  </React.StrictMode>
);
