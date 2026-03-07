import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    GraduationCap, ChevronLeft, ChevronRight, CheckCircle,
    ChevronDown, ChevronUp, BookOpen, Sparkles
} from 'lucide-react';
import api from '../lib/api';

const SIDEBAR_STYLES = `
@keyframes sb-fadeIn   { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
@keyframes sb-slideDown{ from{opacity:0;max-height:0} to{opacity:1;max-height:600px} }
@keyframes sb-shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
@keyframes sb-pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }

.sb-skel {
  background: linear-gradient(90deg, rgba(255,255,255,.03) 25%, rgba(255,255,255,.07) 50%, rgba(255,255,255,.03) 75%);
  background-size: 400px 100%;
  animation: sb-shimmer 1.6s infinite linear;
  border-radius: 6px;
}

.sb-topic-row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
  border-radius: 10px;
  cursor: default;
  transition: background .18s, transform .15s;
  position: relative;
  text-decoration: none;
}
.sb-topic-row:hover {
  background: rgba(124,106,255,.07);
  transform: translateX(2px);
}
.sb-topic-row.active {
  background: rgba(124,106,255,.13);
  border: 1px solid rgba(124,106,255,.22);
}
.sb-topic-row.active::before {
  content: '';
  position: absolute;
  left: 0; top: 50%;
  transform: translateY(-50%);
  width: 3px; height: 60%;
  border-radius: 0 3px 3px 0;
  background: linear-gradient(180deg,#7c6aff,#a78bfa);
}

.sb-day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background .18s;
  user-select: none;
}
.sb-day-header:hover { background: rgba(255,255,255,.04); }

.sb-day-topics {
  overflow: hidden;
  animation: sb-slideDown .25s ease;
}

.sb-nav-btn {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 12px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background .18s, color .18s, transform .15s;
  text-decoration: none;
}
.sb-nav-btn:hover {
  background: rgba(255,255,255,.05);
  color: var(--text-primary);
  transform: translateX(2px);
}
.sb-nav-btn.active {
  background: rgba(124,106,255,.12);
  color: var(--accent-primary);
  border: 1px solid rgba(124,106,255,.2);
}
.sb-nav-btn.active .sb-nav-icon {
  background: linear-gradient(135deg,#7c6aff,#a78bfa);
  box-shadow: 0 3px 10px rgba(124,106,255,.4);
}

.sb-nav-icon {
  width: 30px; height: 30px;
  border-radius: 9px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background .18s, box-shadow .18s;
}

.sb-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,.09);
  background: rgba(255,255,255,.04);
  color: var(--text-muted);
  cursor: pointer;
  transition: background .18s, color .18s;
  flex-shrink: 0;
}
.sb-toggle-btn:hover {
  background: rgba(124,106,255,.12);
  color: var(--accent-primary);
  border-color: rgba(124,106,255,.25);
}

.sb-progress-ring-bg {
  fill: none;
  stroke: rgba(255,255,255,.08);
}
.sb-progress-ring-fill {
  fill: none;
  stroke: url(#sbGrad);
  stroke-linecap: round;
  transition: stroke-dashoffset .6s cubic-bezier(.4,0,.2,1);
}

.sb-section-label {
  font-size: 10px;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  padding: 0 10px;
  margin: 14px 0 6px;
  font-family: 'Outfit', sans-serif;
  opacity: .7;
}

.sb-divider {
  height: 1px;
  background: rgba(255,255,255,.05);
  margin: 10px 0;
}
`;

// Circular progress ring
function ProgressRing({ pct, size = 38 }) {
    const r = (size - 5) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
            <defs>
                <linearGradient id="sbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c6aff" />
                    <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
            </defs>
            <circle className="sb-progress-ring-bg" cx={size / 2} cy={size / 2} r={r} strokeWidth={3} />
            <circle className="sb-progress-ring-fill" cx={size / 2} cy={size / 2} r={r} strokeWidth={3}
                strokeDasharray={circ} strokeDashoffset={offset} />
        </svg>
    );
}

// Skeleton for loading state
function SidebarSkeleton() {
    return (
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[70, 55, 85, 62, 75].map((w, i) => (
                <div key={i} className="sb-skel" style={{ height: 13, width: `${w}%`, animationDelay: `${i * 0.08}s` }} />
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

                // Find current (first incomplete) topic
                let found = null;
                for (const day of active.days || []) {
                    const inc = day.topics?.find(t => !t.completed);
                    if (inc) { found = inc.topicId; break; }
                }
                setCurrentTopicId(found);

                // Open the day that has the current topic by default
                const defaultOpen = {};
                (active.days || []).forEach((day, idx) => {
                    const hasIncomplete = day.topics?.some(t => !t.completed);
                    if (hasIncomplete) defaultOpen[idx] = true;
                });
                setOpenDays(defaultOpen);
            }
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }

    function toggleDay(idx) {
        setOpenDays(prev => ({ ...prev, [idx]: !prev[idx] }));
    }

    const totalTopics = plan?.days?.reduce((s, d) => s + (d.topics?.length || 0), 0) || 0;
    const doneTopics  = plan?.days?.reduce((s, d) => s + (d.topics?.filter(t => t.completed).length || 0), 0) || 0;

    return (
        <aside
            style={{
                width: collapsed ? 64 : 264,
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-sidebar, #0f0e17)',
                borderRight: '1px solid rgba(255,255,255,.06)',
                height: '100%',
                transition: 'width .28s cubic-bezier(.4,0,.2,1)',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* ── Header ── */}
            <div style={{
                display: 'flex', alignItems: 'center',
                padding: collapsed ? '18px 0' : '18px 16px',
                justifyContent: collapsed ? 'center' : 'space-between',
                borderBottom: '1px solid rgba(255,255,255,.05)',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 11, flexShrink: 0,
                        background: 'linear-gradient(135deg,#7c6aff,#a78bfa)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(124,106,255,.4)',
                    }}>
                        <GraduationCap size={17} color="#fff" />
                    </div>
                    {!collapsed && (
                        <div style={{ animation: 'sb-fadeIn .2s ease' }}>
                            <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Outfit',sans-serif", letterSpacing: -.2 }}>AI Tutor</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'Outfit',sans-serif", fontWeight: 600, letterSpacing: .5 }}>Learning Platform</div>
                        </div>
                    )}
                </div>
                {!collapsed && (
                    <button className="sb-toggle-btn" onClick={() => setCollapsed(true)} title="Collapse">
                        <ChevronLeft size={14} />
                    </button>
                )}
            </div>

            {/* ── Collapsed: just expand button ── */}
            {collapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 16, flex: 1 }}>
                    <button className="sb-toggle-btn" onClick={() => setCollapsed(false)} title="Expand" style={{ width: 34, height: 34, borderRadius: 10 }}>
                        <ChevronRight size={14} />
                    </button>
                    {plan && (
                        <div title={`${progress}% complete`} style={{ cursor: 'default' }}>
                            <ProgressRing pct={progress} size={36} />
                        </div>
                    )}
                </div>
            )}

            {/* ── Expanded content ── */}
            {!collapsed && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', scrollbarWidth: 'none' }}>

                    {/* Progress summary card */}
                    {plan && (
                        <div style={{
                            margin: '12px 14px',
                            padding: '12px 14px',
                            borderRadius: 14,
                            background: 'rgba(124,106,255,.07)',
                            border: '1px solid rgba(124,106,255,.14)',
                            display: 'flex', alignItems: 'center', gap: 12,
                            animation: 'sb-fadeIn .25s ease',
                        }}>
                            <ProgressRing pct={progress} size={42} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Outfit',sans-serif", marginBottom: 2 }}>
                                    {progress}% Complete
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'Outfit',sans-serif" }}>
                                    {doneTopics} / {totalTopics} topics done
                                </div>
                            </div>
                            {doneTopics === totalTopics && totalTopics > 0 && (
                                <Sparkles size={14} color="#ffd700" style={{ flexShrink: 0 }} />
                            )}
                        </div>
                    )}

                    {/* Topics list */}
                    {plan?.days?.length > 0 && (
                        <div style={{ padding: '0 10px' }}>
                            <div className="sb-section-label">Study Plan</div>

                            {loading ? <SidebarSkeleton /> : plan.days.map((day, dIdx) => {
                                const dayDone    = day.topics?.filter(t => t.completed).length || 0;
                                const dayTotal   = day.topics?.length || 0;
                                const allDone    = dayDone === dayTotal && dayTotal > 0;
                                const isOpen     = openDays[dIdx] ?? false;

                                return (
                                    <div key={dIdx} style={{ marginBottom: 4 }}>
                                        {/* Day header */}
                                        <div className="sb-day-header" onClick={() => toggleDay(dIdx)}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{
                                                    width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                                                    background: allDone ? 'rgba(0,229,160,.12)' : 'rgba(124,106,255,.1)',
                                                    border: `1px solid ${allDone ? 'rgba(0,229,160,.25)' : 'rgba(124,106,255,.18)'}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 9, fontWeight: 800, color: allDone ? '#00e5a0' : 'var(--accent-primary)',
                                                    fontFamily: "'Outfit',sans-serif",
                                                }}>
                                                    {allDone ? <CheckCircle size={11} /> : day.dayNumber}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Outfit',sans-serif" }}>
                                                        Day {day.dayNumber}
                                                    </div>
                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'Outfit',sans-serif" }}>
                                                        {dayDone}/{dayTotal} done
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {/* Mini progress bar */}
                                                <div style={{ width: 30, height: 3, borderRadius: 3, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', borderRadius: 3, width: `${dayTotal ? (dayDone / dayTotal) * 100 : 0}%`, background: allDone ? '#00e5a0' : 'var(--accent-primary)', transition: 'width .4s ease' }} />
                                                </div>
                                                <div style={{ color: 'var(--text-muted)', transition: 'transform .2s', transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                                                    <ChevronDown size={12} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Topics */}
                                        {isOpen && (
                                            <div className="sb-day-topics" style={{ paddingLeft: 8, marginTop: 2 }}>
                                                {day.topics?.map((topic, tIdx) => {
                                                    const isActive = topic.topicId === currentTopicId;
                                                    return (
                                                        <div
                                                            key={topic.topicId}
                                                            className={`sb-topic-row ${isActive ? 'active' : ''}`}
                                                            title={topic.title}
                                                            style={{ animationDelay: `${tIdx * 0.04}s`, animation: 'sb-fadeIn .2s ease both' }}
                                                        >
                                                            {topic.completed ? (
                                                                <CheckCircle size={13} color="#00e5a0" style={{ flexShrink: 0 }} />
                                                            ) : isActive ? (
                                                                <div style={{
                                                                    width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
                                                                    background: 'linear-gradient(135deg,#7c6aff,#a78bfa)',
                                                                    boxShadow: '0 0 6px rgba(124,106,255,.6)',
                                                                    animation: 'sb-pulse 1.8s ease infinite',
                                                                }} />
                                                            ) : (
                                                                <div style={{
                                                                    width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
                                                                    border: '1.5px solid rgba(255,255,255,.15)',
                                                                }} />
                                                            )}
                                                            <span style={{
                                                                fontSize: 12.5, fontFamily: "'Outfit',sans-serif",
                                                                fontWeight: isActive ? 600 : 400,
                                                                color: topic.completed ? 'var(--text-muted)' : isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                                textDecoration: topic.completed ? 'line-through' : 'none',
                                                                lineHeight: 1.35,
                                                            }}>
                                                                {topic.title}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && !plan && (
                        <div style={{ padding: '24px 14px', textAlign: 'center', animation: 'sb-fadeIn .3s ease' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(124,106,255,.08)', border: '1px solid rgba(124,106,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                                <BookOpen size={18} color="var(--accent-primary)" style={{ opacity: .6 }} />
                            </div>
                            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: "'Outfit',sans-serif", margin: 0, lineHeight: 1.5 }}>
                                No study plan yet.<br />Generate one to get started!
                            </p>
                        </div>
                    )}

                    <div style={{ flex: 1 }} />

                    {/* Bottom collapse button */}
                    <div style={{ padding: '10px 14px 16px', borderTop: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}>
                        <button
                            className="sb-toggle-btn"
                            onClick={() => setCollapsed(true)}
                            title="Collapse sidebar"
                            style={{ width: '100%', borderRadius: 10, height: 34, gap: 6, fontSize: 12, fontFamily: "'Outfit',sans-serif", fontWeight: 600, color: 'var(--text-muted)' }}
                        >
                            <ChevronLeft size={13} />
                            <span style={{ fontSize: 12 }}>Collapse</span>
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
}
