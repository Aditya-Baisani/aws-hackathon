import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, LogOut, ChevronDown, BookOpen, Brain, HelpCircle, BarChart3, Settings, LayoutDashboard } from 'lucide-react';

export default function Topbar({ sidebarWidth }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/plan', icon: BookOpen, label: 'Study Plan' },
        { to: '/quiz', icon: Brain, label: 'Quizzes' },
        { to: '/clarify', icon: HelpCircle, label: 'Clarify Terms' },
        { to: '/progress', icon: BarChart3, label: 'Progress' },
        { to: '/settings', icon: Settings, label: 'Settings' }
    ];

    return (
        <header className="topbar" style={{ left: sidebarWidth }}>
            <div className="topbar-left">
                <p className="topbar-greeting">
                    Welcome back, <strong>{user?.email?.split('@')[0] || 'Learner'}</strong>
                </p>
            </div>

            <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

                {/* Navigate Dropdown */}
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <button
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 20 }}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        Navigate <ChevronDown size={14} />
                    </button>

                    {dropdownOpen && (
                        <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: 8,
                            background: 'var(--bg-card)', border: '1px solid var(--border-secondary)',
                            borderRadius: 'var(--radius-md)', padding: 8, minWidth: 180,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 100
                        }}>
                            {navItems.map(item => (
                                <button
                                    key={item.to}
                                    onClick={() => { navigate(item.to); setDropdownOpen(false); }}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 12px', background: 'transparent', border: 'none',
                                        color: 'var(--text-primary)', fontSize: 13, fontWeight: 500,
                                        cursor: 'pointer', textAlign: 'left', borderRadius: 'var(--radius-sm)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <item.icon size={16} /> {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
                    <Sun size={14} style={{ color: theme === 'light' ? 'var(--accent-orange)' : 'var(--text-muted)' }} />
                    <div className={`theme-toggle-track ${theme === 'dark' ? 'dark' : ''}`}>
                        <div className="theme-toggle-thumb">
                            {theme === 'dark' ? '🌙' : '☀️'}
                        </div>
                    </div>
                    <Moon size={14} style={{ color: theme === 'dark' ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                </div>

                <button className="btn btn-ghost btn-icon" onClick={logout} title="Sign out">
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
}
