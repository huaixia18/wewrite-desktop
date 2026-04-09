import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { PipelinePage } from "./pages/PipelinePage";
import { HistoryPage } from "./pages/HistoryPage";
import { ExemplarsPage } from "./pages/ExemplarsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useConfigStore } from "./store/config";
import { api } from "./lib/tauri";

export default function App() {
  const { setConfig } = useConfigStore();

  // Load config once at app start — child components read from store, no more per-page loading
  useEffect(() => {
    api.getConfig()
      .then((cfg) => setConfig(cfg))
      .catch(() => {});
  }, [setConfig]);

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
