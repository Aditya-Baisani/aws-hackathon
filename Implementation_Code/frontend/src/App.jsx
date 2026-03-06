import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DoubtProvider } from './contexts/DoubtContext';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DoubtPanel from './components/DoubtPanel';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import StudyPlanPage from './pages/StudyPlanPage';
import TopicExplainPage from './pages/TopicExplainPage';
import QuizPage from './pages/QuizPage';
import ClarifyPage from './pages/ClarifyPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';

function AppContent() {
    const { user, loading } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const SIDEBAR_WIDTH = sidebarCollapsed ? 72 : 280;

    if (loading) return <AppLoader />;
    if (!user) return <Navigate to="/login" replace />;

    return (
        <div className="app-layout">
            <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
            <div
                className="main-content"
                style={{
                    marginLeft: SIDEBAR_WIDTH,
                    paddingTop: 58,
                    transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Topbar sidebarWidth={SIDEBAR_WIDTH} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Routes>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/plan" element={<StudyPlanPage />} />
                        <Route path="/topic/:topicId" element={<TopicExplainPage />} />
                        <Route path="/quiz" element={<QuizPage />} />
                        <Route path="/clarify" element={<ClarifyPage />} />
                        <Route path="/progress" element={<ProgressPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </div>
            </div>
            <DoubtPanel />
        </div>
    );
}

function PublicRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <AppLoader />;
    return user ? <Navigate to="/" replace /> : children;
}

function AppLoader() {
    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'var(--bg-primary)',
            flexDirection: 'column', gap: 16,
        }}>
            <div className="spinner" />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading AI Tutor…</span>
        </div>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <AuthProvider>
                    <ToastProvider>
                        <DoubtProvider>
                            <Routes>
                                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                                <Route path="/*" element={<AppContent />} />
                            </Routes>
                        </DoubtProvider>
                    </ToastProvider>
                </AuthProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
}
