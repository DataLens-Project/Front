import { createBrowserRouter } from "react-router";
import { Dashboard } from "./pages/Dashboard";
import { AnalysisLab } from "./pages/AnalysisLab";
import { InsightReport } from "./pages/InsightReport";
import { Archive } from "./pages/Archive";
import { Settings } from "./pages/Settings";
import { RootLayout } from "./components/RootLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "analysis", Component: AnalysisLab },
      { path: "report/:id", Component: InsightReport },
      { path: "archive", Component: Archive },
      { path: "settings", Component: Settings },
    ],
  },
]);