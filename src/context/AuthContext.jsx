import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            // Ideally, decode token or hit an endpoint to get user info.
            // Assuming a simple role mapping for now based on what login returns.
            // In a real app, /auth/me would be queried here.
            // Fake user info setup for demonstration:
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({ id: payload.id, role: payload.role || 'user', name: payload.name || 'User' });
            } catch (e) {
                console.error("Failed to decode token", e);
            }
        } else {
            localStorage.removeItem('token');
            setUser(null);
        }
        setLoading(false);
    }, [token]);

    const login = (newToken, userData) => {
        setToken(newToken);
        setUser(userData);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
