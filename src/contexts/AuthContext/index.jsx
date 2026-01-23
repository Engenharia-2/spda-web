import React, { createContext, useContext } from 'react';
import { AuthService } from '../../services/AuthService';
import { useAuthObserver } from '../../hooks/Auth/useAuthObserver';
import './styles.css';
import { auth } from '../../services/firebase';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const { currentUser, loading, reFetchUser } = useAuthObserver();

    // Renomeia a função para um nome mais claro no contexto
    const refreshAuth = async () => {
        if (auth.currentUser) {
            await reFetchUser(auth.currentUser);
        }
    };

    const value = {
        currentUser,
        login: AuthService.login,
        signup: AuthService.signup,
        logout: AuthService.logout,
        refreshAuth, // Expõe a nova função
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