import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    GraduationCap, ChevronLeft, ChevronRight, CheckCircle, ChevronDown, Sparkles
} from 'lucide-react';
import api from '../lib/api';

const SIDEBAR_STYLES = `
@keyframes sb-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
@keyframes sb-fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes sb-pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(124,106,255,.5)} 60%{box-shadow:0 0 0 4px rgba(124,106,255,0)} }

.sb-skel {
  background: linear-gradient(90deg, rgba(255,255,255,.03) 25%, rgba(255,255,255,.07) 50%, rgba(255,255,255,.03) 75%);
  background-size: 400px 100%;
  animation: sb-shimmer 1.6s infinite linear;
  border-radius: 6px;
}

.sb-day-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  cursor: pointer;
  user-select: none;
  border-radius: 6px;
  transition: background .15s;
  margin-bottom: 4px;
}
.sb-day-toggle:hover { background: rgba(255,255,255,.03); }

.sb-topic {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  cursor: default;
  position: relative;
  transition: background .15s;
}
.sb-topic:hover { background: rgba(124,106,255,.06); }
.sb-topic.active {
  background: rgba(124,106,255,.1);
  border: 1px solid rgba(124,106,255,.18);
}
.sb-topic.active::before {
  content: '';
  position: absolute;
  left: 0; top: 20%; height: 60%;
  width: 2.5px;
  border-radius: 0 2px 2px 0;
  background: linear-gradient(180deg, #7c6aff, #a78bfa);
}
`;

function SidebarSkeleton() {
    return (
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {[68, 82, 55, 74, 60].map((w, i) => (
                <div key={i} className="sb-skel" style={{ height: 12, width: `${w}%`, animationDelay: `${i * 0.07}s` }} />
            ))}
        </div>
    );
}

export default function Sidebar({ collapsed, setCollapsed }) {
    const location = useLocation();
    const [plan, setPlan] = useState(null);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [openDays, setOpenDays] = useState({});
    const [currentTopicId, setCurrentTopicId] = useState(null);

    useEffect(() => {
        if (!document.getElementById('sb-css')) {
            const s = document.createElement('style');
            s.id = 'sb-css'; s.textContent = SIDEBAR_STYLES;
            document.head.appendChild(s);
        }
    }, []);

    useEffect(() => { loadPlan(); }, [location.pathname]);

    async function loadPlan() {
        setLoading(true);
        try {
            const [planRes, dashRes] = await Promise.all([
                api.getPlans(),
                api.getDashboard().catch(() => ({ progressPercentage: 0 }))
            ]);
            if (planRes.plans?.length > 0) {
                const active = planRes.plans[0];
                setPlan(active);
                setProgress(dashRes.progressPercentage || 0);

                // Find first incomplete topic
                let foundId = null;
                const defaults = {};
                for (let dIdx = 0; dIdx < (active.days || []).length; dIdx++) {
                    const day = active.days[dIdx];
                    const inc = day.topics?.find(t => !t.completed);
                    if (inc && !foundId) {
                        foundId = inc.topicId;
                        defaults[dIdx] = true; // auto-open the active day
                    }
                }
                setCurrentTopicId(foundId);
                setOpenDays(defaults);
            }
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }

    const totalTopics = plan?.days?.reduce((s, d) => s + (d.topics?.length || 0), 0) || 0;
    const doneTopics  = plan?.days?.reduce((s, d) => s + (d.topics?.filter(t => t.completed).length || 0), 0) || 0;

    return (
        <aside className="sidebar" style={{ width: collapsed ? 72 : 280, display: 'flex', flexDirection: 'column' }}>

            {/* ── Header (unchanged) ── */}
            <div className="sidebar-header" style={{ flexShrink: 0 }}>
                <div className="sidebar-logo">
                    <GraduationCap size={20} />
                </div>
                {!collapsed && <span className="sidebar-brand">AI Tutor</span>}
            </div>

            {/* ── Progress section (same padding: '0 20px', marginTop:12) ── */}
            {!collapsed && plan && (
                <div style={{ padding: '0 20px', marginTop: 12, flexShrink: 0 }}>

                    {/* Label + value row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: .4 }}>
                            Study Plan Progress
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {doneTopics === totalTopics && totalTopics > 0 && (
                                <Sparkles size={10} color="#ffd700" />
                            )}
                            <span style={{
                                fontSize: 11, fontWeight: 800,
                                color: progress >= 70 ? '#00e5a0' : 'var(--accent-primary)',
                            }}>
                                {progress}%
                            </span>
                        </div>
                    </div>

                    {/* Segmented bar (same height as original bar: 6px) */}
                    <div style={{ display: 'flex', gap: 2, height: 6 }}>
                        {Array.from({ length: 10 }).map((_, i) => {
                            const filled  = progress >= (i + 1) * 10;
                            const partial = !filled && progress > i * 10;
                            const pctFill = partial ? ((progress - i * 10) / 10) * 100 : 0;
                            return (
                                <div key={i} style={{ flex: 1, borderRadius: 3, background: 'rgba(255,255,255,.07)', overflow: 'hidden', position: 'relative' }}>
                                    {(filled || partial) && (
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            width: filled ? '100%' : `${pctFill}%`,
                                            background: progress >= 70
                                                ? 'linear-gradient(90deg,#00e5a0,#00b884)'
                                                : 'var(--gradient-primary)',
                                            borderRadius: 3,
                                            transition: 'width .5s ease',
                                        }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Subtitle count */}
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, opacity: .7 }}>
                        {doneTopics} of {totalTopics} topics completed
                    </div>
                </div>
            )}

            {/* ── Topics list (same: flex:1, overflowY, padding:'16px 12px', marginTop:12) ── */}
            {!collapsed && plan && plan.days && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', marginTop: 12 }}>

                    <h4 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, padding: '0 12px', marginBottom: 12 }}>
                        Topics
                    </h4>

                    {loading ? <SidebarSkeleton /> : plan.days.map((day, dIdx) => {
                        const dayDone  = day.topics?.filter(t => t.completed).length || 0;
                        const dayTotal = day.topics?.length || 0;
                        const allDone  = dayDone === dayTotal && dayTotal > 0;
                        const isOpen   = openDays[dIdx] ?? false;

                        return (
                            <div key={dIdx} style={{ marginBottom: 16 }}>

                                {/* Day header — now collapsible with mini progress */}
                                <div
                                    className="sb-day-toggle"
                                    onClick={() => setOpenDays(prev => ({ ...prev, [dIdx]: !prev[dIdx] }))}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <div style={{
                                            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                                            background: allDone ? 'rgba(0,229,160,.1)' : 'rgba(124,106,255,.1)',
                                            border: `1px solid ${allDone ? 'rgba(0,229,160,.25)' : 'rgba(124,106,255,.2)'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {allDone
                                                ? <CheckCircle size={11} color="#00e5a0" />
                                                : <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--accent-primary)' }}>{day.dayNumber}</span>
                                            }
                                        </div>
                                        <span style={{ fontSize: 12, fontWeight: 800, color: allDone ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                                            Day {day.dayNumber}
                                        </span>
                                        <ChevronDown size={11} color="var(--text-muted)"
                                            style={{ transition: 'transform .2s', transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', flexShrink: 0 }}
                                        />
                                    </div>
                                </div>

                                {/* Topics rows */}
                                {isOpen && day.topics?.map((topic, tIdx) => {
                                    const isActive = topic.topicId === currentTopicId;
                                    return (
                                        <div
                                            key={topic.topicId}
                                            className={`sb-topic ${isActive ? 'active' : ''}`}
                                            title={topic.title}
                                            style={{ animation: `sb-fadeIn .2s ease ${tIdx * 0.04}s both` }}
                                        >
                                            {/* Status dot */}
                                            {topic.completed ? (
                                                <CheckCircle size={13} color="#00e5a0" style={{ flexShrink: 0 }} />
                                            ) : isActive ? (
                                                <div style={{
                                                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                                    background: 'linear-gradient(135deg,#7c6aff,#a78bfa)',
                                                    animation: 'sb-pulse 1.8s ease infinite',
                                                }} />
                                            ) : (
                                                <div style={{
                                                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                                    border: '1.5px solid rgba(255,255,255,.18)',
                                                }} />
                                            )}

                                            {/* Title */}
                                            <span style={{
                                                fontSize: 13, lineHeight: 1.3,
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                fontWeight: isActive ? 600 : 400,
                                                color: topic.completed
                                                    ? 'var(--text-muted)'
                                                    : isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                textDecoration: topic.completed ? 'line-through' : 'none',
                                                opacity: topic.completed ? .5 : 1,
                                            }}>
                                                {topic.title}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Toggle button (unchanged) ── */}
            <div className="sidebar-toggle" style={{ marginTop: 'auto', flexShrink: 0 }}>
                <button onClick={() => setCollapsed(prev => !prev)} title={collapsed ? 'Expand' : 'Collapse'}>
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>
        </aside>
    );
}
