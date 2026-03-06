import React, { createContext, useContext, useState, useEffect } from 'react';
import { signUp, signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

const AuthContext = createContext(null);

// Lightweight backend call to sync user profile to DynamoDB
async function syncUserProfile(email, token) {
    try {
        await fetch('/aws-api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ email }),
        });
    } catch {
        // Non-critical — app still works even if this fails
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        try {
            const currentUser = await getCurrentUser();
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();
            const email = currentUser.signInDetails?.loginId || currentUser.username;

            setUser({
                userId: currentUser.userId,
                username: currentUser.username,
                email,
                token,
            });

            // Ensure user profile exists in DynamoDB (non-blocking)
            if (token) syncUserProfile(email, token);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function login(email, password) {
        const result = await signIn({ username: email, password });
        if (result.isSignedIn) {
            await checkUser();
        }
        return result;
    }

    async function register(email, password) {
        const result = await signUp({
            username: email,
            password,
            options: { userAttributes: { email } },
        });
        return result;
    }

    async function logout() {
        await signOut();
        setUser(null);
    }

    async function getToken() {
        try {
            const session = await fetchAuthSession({ forceRefresh: false });
            return session.tokens?.idToken?.toString();
        } catch {
            return null;
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, getToken, checkUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
