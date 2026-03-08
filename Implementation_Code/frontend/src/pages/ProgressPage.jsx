import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { BarChart3, Flame, Target, Trophy, Calendar } from 'lucide-react';
import api from '../lib/api';

export default function ProgressPage() {
    const toast = useToast();
    const [streakData, setStreakData] = useState(null);
    const [progressData, setProgressData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [streak, dash] = await Promise.all([
                api.getStreak().catch(() => ({
                    currentStreak: 0, longestStreak: 0, activityDates: []
                })),
                api.getDashboard().catch(() => ({
                    progressPercentage: 0, totalTopics: 0, completedToday: 0,
                })),
            ]);
            setStreakData(streak);
            setProgressData(dash);
        } catch { /* handled by catch above */ }
        finally { setLoading(false); }
    }

    const streak = streakData?.currentStreak || 0;
    const longestStreak = streakData?.longestStreak || 0;
    const activityDates = streakData?.activityDates || [];
    const progress = progressData?.progressPercentage || 0;

    // Generate last 90 days for heatmap
    const today = new Date();
    const heatmapDays = [];
    for (let i = 89; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const isActive = activityDates.includes(dateStr);
        heatmapDays.push({ date: dateStr, active: isActive });
    }

    // Progress bar calculation
    const ringSize = 160;
    const strokeWidth = 10;
    const radius = (ringSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    if (loading) {
        return (
            <div className="page-container">
                <div className="page-loader">
                    <div className="spinner" />
                    <span>Loading progress...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Progress</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
                Track your learning journey and streaks
            </p>

            {/* Stats Row */}
            <div className="stat-grid">
                <div className="stat-card purple card-glow">
                    <div className="stat-icon purple"><Target size={22} /></div>
                    <div className="stat-value">{progress.toFixed(1)}%</div>
                    <div className="stat-label">Overall Progress</div>
                </div>

                <div className="stat-card green card-glow">
                    <div className="stat-icon green"><Flame size={22} /></div>
                    <div className="stat-value">{streak}</div>
                    <div className="stat-label">Current Streak</div>
                </div>

                <div className="stat-card orange card-glow">
                    <div className="stat-icon orange"><Trophy size={22} /></div>
                    <div className="stat-value">{longestStreak}</div>
                    <div className="stat-label">Longest Streak</div>
                </div>
            </div>

            {/* Progress Ring */}
            <div className="card" style={{ textAlign: 'center', padding: 40, marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Overall Completion</h3>
                <div className="progress-ring" style={{ marginBottom: 16 }}>
                    <svg width={ringSize} height={ringSize}>
                        <circle
                            cx={ringSize / 2} cy={ringSize / 2} r={radius}
                            fill="none" stroke="var(--border-secondary)" strokeWidth={strokeWidth}
                        />
                        <circle
                            cx={ringSize / 2} cy={ringSize / 2} r={radius}
                            fill="none" stroke="url(#progressGrad2)" strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            style={{ transition: 'stroke-dashoffset 1s ease' }}
                        />
                        <defs>
                            <linearGradient id="progressGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#7c6aff" />
                                <stop offset="50%" stopColor="#b44aff" />
                                <stop offset="100%" stopColor="#00dfa2" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="progress-ring-text">
                        <span className="progress-ring-value" style={{ fontSize: 32 }}>{progress.toFixed(1)}%</span>
                        <span className="progress-ring-label">Complete</span>
                    </div>
                </div>
            </div>

            {/* Activity Heatmap */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={18} /> Activity (Last 90 Days)
                </h3>
                <div className="streak-heatmap">
                    {heatmapDays.map((day, i) => (
                        <div
                            key={i}
                            className={`streak-day ${day.active ? 'active' : ''}`}
                            title={`${day.date}${day.active ? ' ✓' : ''}`}
                        />
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>90 days ago</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Less
                        <div className="streak-day" style={{ width: 10, height: 10 }} />
                        <div className="streak-day active" style={{ width: 10, height: 10 }} />
                        More
                    </div>
                    <span>Today</span>
                </div>
            </div>

            {/* Streak Milestones */}
            <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🏅 Streak Milestones</h3>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {[7, 30, 100].map(milestone => (
                        <div key={milestone} style={{
                            padding: '16px 24px', borderRadius: 'var(--radius-md)',
                            background: streak >= milestone ? 'rgba(0, 223, 162, 0.1)' : 'var(--bg-card-hover)',
                            border: `1px solid ${streak >= milestone ? 'rgba(0, 223, 162, 0.3)' : 'var(--border-secondary)'}`,
                            textAlign: 'center', flex: '1 1 120px',
                            opacity: streak >= milestone ? 1 : 0.5,
                        }}>
                            <div style={{ fontSize: 24, marginBottom: 4 }}>
                                {milestone === 7 ? '🔥' : milestone === 30 ? '⭐' : '👑'}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>{milestone} Days</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {streak >= milestone ? 'Achieved!' : `${milestone - streak} to go`}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
