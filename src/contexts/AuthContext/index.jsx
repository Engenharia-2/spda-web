import React, { createContext, useContext } from 'react';
import { AuthService } from '../../services/AuthService';
import { useAuthObserver } from '../../hooks/Auth/useAuthObserver';
import './styles.css';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const { currentUser, loading } = useAuthObserver();

    const value = {
        currentUser,
        login: AuthService.login,
        signup: AuthService.signup,
        logout: AuthService.logout,
    };

    if (loading) {
        return (
            <div className="loading-container">
                Carregando sistema...
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};