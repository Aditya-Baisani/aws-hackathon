import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { GraduationCap, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // demo credentials
    const DEMO_EMAIL = "bitoris115@keecs.com";
    const DEMO_PASSWORD = "Test@123";

    function fillDemo() {
        setEmail(DEMO_EMAIL);
        setPassword(DEMO_PASSWORD);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <GraduationCap size={28} />
                </div>

                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Sign in to continue your learning journey</p>

                {error && <div className="auth-error">{error}</div>}

                {/* Demo credentials box */}
                <div
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            backdropFilter: "blur(10px)",
                            padding: "14px",
                            borderRadius: "12px",
                            marginBottom: "18px",
                            color: "var(--text-muted)",
                            fontSize: "14px"
                          }}
                        >
                          <div style={{color:"#c084fc", fontWeight:"600", marginBottom:"6px"}}>
                            Demo Account
                          </div>
                        
                          <div>Email: bitoris115@keecs.com</div>
                          <div>Password: Test@123</div>
                        
                          <button
                            type="button"
                            onClick={fillDemo}
                            style={{
                              marginTop: "10px",
                              padding: "8px 14px",
                              borderRadius: "8px",
                              border: "none",
                              cursor: "pointer",
                              background: "linear-gradient(135deg,#8b5cf6,#ec4899)",
                              color: "white",
                              fontWeight: "500"
                            }}
                          >
                            Use Demo Account
                          </button>
                        </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                style={{ paddingLeft: 40 }}
                            />
                        </div>
                    </div>

                    <div className="auth-field">
                        <label>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                style={{ paddingLeft: 40, paddingRight: 40 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(!showPw)}
                                style={{
                                    position: 'absolute',
                                    right: 12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                }}
                            >
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Create one</Link>
                </p>
            </div>
        </div>
    );
}
