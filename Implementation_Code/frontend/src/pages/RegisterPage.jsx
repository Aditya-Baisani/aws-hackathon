import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { GraduationCap, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';

export default function RegisterPage() {
    const { register, login } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState('register'); // 'register' | 'confirm'
    const [confirmCode, setConfirmCode] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (password !== confirmPw) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            const result = await register(email, password);
            if (result.isSignUpComplete) {
                await login(email, password);
                toast.success('Account created! Welcome aboard!');
                navigate('/dashboard');
            } else {
                setStep('confirm');
                toast.info('Check your email for a verification code');
            }
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    }

    async function handleConfirm(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { confirmSignUp } = await import('aws-amplify/auth');
            await confirmSignUp({ username: email, confirmationCode: confirmCode });
            await login(email, password);
            toast.success('Email verified! Welcome!');
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Verification failed');
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
                <h1 className="auth-title">
                    {step === 'register' ? 'Create Account' : 'Verify Email'}
                </h1>
                <p className="auth-subtitle">
                    {step === 'register'
                        ? 'Start your personalized learning journey'
                        : `Enter the code sent to ${email}`}
                </p>

                {error && <div className="auth-error">{error}</div>}

                {step === 'register' ? (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="auth-field">
                            <label>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com" required style={{ paddingLeft: 40 }}
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type={showPw ? 'text' : 'password'} value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Min. 8 characters" required
                                    style={{ paddingLeft: 40, paddingRight: 40 }}
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                Min. 8 characters, include Uppercase, Lowercase, Number & Symbol
                            </p>
                        </div>

                        <div className="auth-field">
                            <label>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type={showPw ? 'text' : 'password'} value={confirmPw}
                                    onChange={e => setConfirmPw(e.target.value)}
                                    placeholder="Re-enter password" required
                                    style={{ paddingLeft: 40 }}
                                />
                            </div>
                        </div>

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>
                ) : (
                    <form className="auth-form" onSubmit={handleConfirm}>
                        <div className="auth-field">
                            <label>Verification Code</label>
                            <input
                                type="text" value={confirmCode}
                                onChange={e => setConfirmCode(e.target.value)}
                                placeholder="Enter 6-digit code" required
                                style={{ textAlign: 'center', fontSize: 20, letterSpacing: 8 }}
                            />
                        </div>
                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify & Continue'}
                        </button>
                    </form>
                )}

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div >
    );
}
