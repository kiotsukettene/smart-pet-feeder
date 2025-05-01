import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/Pages/Dashboard";
import Schedule from "@/Pages/Schedule";
import CameraPage from "@/Pages/Camera";
import HistoryPage from "@/Pages/History";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/camera" element={<CameraPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}