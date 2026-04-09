import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { PipelinePage } from "./pages/PipelinePage";
import { HistoryPage } from "./pages/HistoryPage";
import { ExemplarsPage } from "./pages/ExemplarsPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <div
      className="flex"
      style={{ height: "100vh", background: "var(--color-light-bg)", overflow: "hidden" }}
    >
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<PipelinePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/exemplars" element={<ExemplarsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
