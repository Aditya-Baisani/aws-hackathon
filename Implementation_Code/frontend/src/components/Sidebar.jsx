import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, ChevronLeft, ChevronRight, GraduationCap, CheckCircle
} from 'lucide-react';
import api from '../lib/api';

export default function Sidebar({ collapsed, setCollapsed }) {
    const location = useLocation();
    const [plan, setPlan] = useState(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        loadPlan();
    }, [location.pathname]); // Reload when navigating between pages

    async function loadPlan() {
        try {
            const [planRes, dashRes] = await Promise.all([
                api.getPlans(),
                api.getDashboard().catch(() => ({ progressPercentage: 0 }))
            ]);

            if (planRes.plans?.length > 0) {
                const active = planRes.plans[0];
                setPlan(active);
                setProgress(dashRes.progressPercentage || 0);
            }
        } catch { /* ignore */ }
    }

    return (
        <aside className="sidebar" style={{ width: collapsed ? 72 : 280, display: 'flex', flexDirection: 'column' }}>
            <div className="sidebar-header" style={{ flexShrink: 0 }}>
                <div className="sidebar-logo">
                    <GraduationCap size={20} />
                </div>
                {!collapsed && <span className="sidebar-brand">AI Tutor</span>}
            </div>

            {!collapsed && plan && (
                <div style={{ padding: '0 20px', marginTop: 12, flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                        <span>Study Plan Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="progress-bar-track" style={{ background: 'var(--bg-card)', height: 6, borderRadius: 10, overflow: 'hidden' }}>
                        <div className="progress-bar-fill" style={{ width: `${progress}%`, background: 'var(--gradient-primary)', height: '100%', transition: 'width 0.3s ease' }} />
                    </div>
                </div>
            )}

            {!collapsed && plan && plan.days && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', marginTop: 12 }}>
                    <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, padding: '0 12px', marginBottom: 12 }}>
                        Topics
                    </h4>
                    {plan.days.map((day, dIdx) => (
                        <div key={dIdx} style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', padding: '0 12px', marginBottom: 8 }}>Day {day.dayNumber}</div>
                            {day.topics?.map(topic => (
                                <div key={topic.topicId} style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                                    borderRadius: 'var(--radius-sm)', cursor: 'default',
                                    background: topic.completed ? 'rgba(0,210,160,0.05)' : 'transparent',
                                    color: topic.completed ? 'var(--text-primary)' : 'var(--text-secondary)'
                                }}>
                                    {topic.completed ? (
                                        <CheckCircle size={14} color="var(--accent-green)" style={{ flexShrink: 0 }} />
                                    ) : (
                                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border-secondary)', flexShrink: 0 }} />
                                    )}
                                    <span style={{ fontSize: 13, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {topic.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            <div className="sidebar-toggle" style={{ marginTop: 'auto', flexShrink: 0 }}>
                <button onClick={() => setCollapsed(prev => !prev)} title={collapsed ? 'Expand' : 'Collapse'}>
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>
        </aside>
    );
}
