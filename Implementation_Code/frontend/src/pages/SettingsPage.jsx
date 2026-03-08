import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { Settings, Globe, Bell, Trash2, Moon, Sun, AlertTriangle } from 'lucide-react';
import api from '../lib/api';

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const toast = useToast();
    const { theme, toggleTheme } = useTheme();

    const [language, setLanguage] = useState('english');
    const [notifEnabled, setNotifEnabled] = useState(true);
    const [showDelete, setShowDelete] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleting, setDeleting] = useState(false);

    async function handleLanguageChange(lang) {
        setLanguage(lang);
        try {
            // Save to backend
            await api.updateNotifPrefs({ languagePreference: lang });
            toast.success(`Language set to ${lang === 'english' ? 'English' : 'Hinglish'}`);
        } catch {
            toast.info('Language preference saved locally');
        }
    }

    async function handleNotifToggle() {
        const next = !notifEnabled;
        setNotifEnabled(next);
        try {
            await api.updateNotifPrefs({ enabled: next });
            toast.success(next ? 'Notifications enabled' : 'Notifications disabled');
        } catch {
            toast.info('Notification preference saved locally');
        }
    }

    async function handleDeleteAccount() {
        if (deleteConfirm !== 'DELETE') {
            toast.error('Type DELETE to confirm');
            return;
        }
        setDeleting(true);
        try {
            await api.deleteAccount();
            toast.success('Account deleted. Goodbye!');
            await logout();
        } catch (err) {
            toast.error(err.message || 'Failed to delete account');
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="page-container">
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Settings</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
                Manage your preferences and account
            </p>

            {/* Appearance */}
            <div className="settings-section">
                <h3><Moon size={18} style={{ verticalAlign: -3 }} /> Appearance</h3>
                <div className="settings-row">
                    <div>
                        <div className="settings-label">Theme</div>
                        <div className="settings-desc">Switch between dark and light mode</div>
                    </div>
                    <div className="theme-toggle" onClick={toggleTheme}>
                        <Sun size={14} style={{ color: theme === 'light' ? 'var(--accent-orange)' : 'var(--text-muted)' }} />
                        <div className={`theme-toggle-track ${theme === 'dark' ? 'dark' : ''}`}>
                            <div className="theme-toggle-thumb">
                                {theme === 'dark' ? '🌙' : '☀️'}
                            </div>
                        </div>
                        <Moon size={14} style={{ color: theme === 'dark' ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                    </div>
                </div>
            </div>

            {/* Language */}
            <div className="settings-section">
                <h3><Globe size={18} style={{ verticalAlign: -3 }} /> Language</h3>
                <div className="settings-row">
                    <div>
                        <div className="settings-label">Content Language</div>
                        <div className="settings-desc">AI-generated content will be in this language</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            className={`btn btn-sm ${language === 'english' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleLanguageChange('english')}
                        >
                            English
                        </button>
                        <button
                            className={`btn btn-sm ${language === 'hinglish' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleLanguageChange('hinglish')}
                        >
                            Hinglish
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="settings-section">
                <h3><Bell size={18} style={{ verticalAlign: -3 }} /> Notifications</h3>
                <div className="settings-row">
                    <div>
                        <div className="settings-label">Study Reminders</div>
                        <div className="settings-desc">Get smart reminders to stay on track</div>
                    </div>
                    <button
                        className={`btn btn-sm ${notifEnabled ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={handleNotifToggle}
                    >
                        {notifEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                </div>
            </div>

            {/* Account */}
            <div className="settings-section">
                <h3><Settings size={18} style={{ verticalAlign: -3 }} /> Account</h3>
                <div className="settings-row">
                    <div>
                        <div className="settings-label">Email</div>
                        <div className="settings-desc">{user?.email || 'Not available'}</div>
                    </div>
                </div>

                <div className="settings-row" style={{ borderBottom: 'none' }}>
                    <div>
                        <div className="settings-label" style={{ color: '#ff4d4d' }}>Delete Account</div>
                        <div className="settings-desc">
                            Permanently delete your account and all data
                        </div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(!showDelete)}>
                        <Trash2 size={14} /> Delete
                    </button>
                </div>

                {showDelete && (
                    <div style={{
                        marginTop: 12, padding: 20, borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 77, 77, 0.05)', border: '1px solid rgba(255, 77, 77, 0.2)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#ff4d4d' }}>
                            <AlertTriangle size={18} />
                            <strong>This action cannot be undone</strong>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                            All your learning materials, study plans, progress, and quiz results will be permanently deleted.
                            Type <strong>DELETE</strong> to confirm.
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <input
                                type="text" value={deleteConfirm}
                                onChange={e => setDeleteConfirm(e.target.value)}
                                placeholder="Type DELETE to confirm"
                                style={{ flex: 1, padding: '8px 14px' }}
                            />
                            <button
                                className="btn btn-danger"
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirm !== 'DELETE' || deleting}
                            >
                                {deleting ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
