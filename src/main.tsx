
  import { createRoot } from "react-dom/client";
  import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  ModuleRegistry.registerModules([AllCommunityModule]);

  createRoot(document.getElementById("root")!).render(<App />);
  