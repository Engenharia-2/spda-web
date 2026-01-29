import React, { createContext, useContext, useEffect } from 'react';
import { AuthService } from '../../services/AuthService';
import { useAuthObserver } from '../../hooks/Auth/useAuthObserver';
import { SyncService } from '../../services/SyncService';
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

    // Automatic Synchronization Logic
    useEffect(() => {
        if (currentUser && currentUser.uid) {
            const sync = () => {
                console.log('[AuthContext] Online/User detected, triggering offline queue sync...');
                SyncService.processOfflineQueue(currentUser.uid);
            };

            // Sync immediately on mount/login if online
            if (navigator.onLine) {
                sync();
            }

            // Listen for network recovery
            window.addEventListener('online', sync);

            return () => {
                window.removeEventListener('online', sync);
            };
        }
    }, [currentUser]);

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