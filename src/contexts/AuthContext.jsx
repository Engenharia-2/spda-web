import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const signup = async (email, password) => {
        console.log('Starting signup...');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('User created in Auth:', user.uid);

            // Create user document with pending status
            console.log('Attempting to create user doc in Firestore...');

            // Create a timeout promise
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Firestore operation timed out. Check your internet connection or Firebase rules.')), 10000)
            );

            // Race setDoc against timeout
            await Promise.race([
                setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    status: 'pending',
                    subscription: 'free', // Default plan
                    createdAt: new Date().toISOString()
                }),
                timeout
            ]);

            console.log('User doc created successfully');

            // Sign out immediately so they don't get auto-logged in
            await signOut(auth);

            return userCredential;
        } catch (error) {
            console.error('Error in signup:', error);
            throw error;
        }
    };

    const login = async (email, password) => {
        console.log('Starting login for:', email);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('Auth successful, user UID:', user.uid);

            // Check user status
            console.log('Checking Firestore user doc...');
            const userDocRef = doc(db, 'users', user.uid);

            // Create a timeout promise
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Firestore operation timed out. Check your internet connection or Firebase rules.')), 10000)
            );

            // Race getDoc against timeout
            let userDoc;
            try {
                userDoc = await Promise.race([
                    getDoc(userDocRef),
                    timeout
                ]);
            } catch (e) {
                console.error('Firestore getDoc failed or timed out:', e);
                await signOut(auth);
                throw e;
            }

            console.log('Firestore doc retrieved. Exists:', userDoc.exists());

            if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log('User status:', userData.status);
                if (userData.status !== 'approved') {
                    console.warn('User not approved');
                    await signOut(auth);
                    throw new Error('ACCOUNT_PENDING');
                }
            } else {
                console.log('User doc not found, creating pending doc...');
                // If user exists in Auth but not in Firestore, create as pending
                try {
                    await Promise.race([
                        setDoc(userDocRef, {
                            email: user.email,
                            status: 'pending',
                            createdAt: new Date().toISOString()
                        }),
                        timeout
                    ]);
                } catch (e) {
                    console.error('Firestore setDoc failed or timed out:', e);
                    await signOut(auth);
                    throw e;
                }

                await signOut(auth);
                throw new Error('ACCOUNT_PENDING');
            }

            return userCredential;
        } catch (error) {
            console.error('Error in login:', error);
            throw error;
        }
    };

    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists() && userDoc.data().status === 'approved') {
                        const userData = userDoc.data();

                        // Bootstrap Admin: Check if email matches the hardcoded admin email
                        const isAdmin = userData.role === 'admin' || user.email === 'lucas@lhf.ind.br';

                        setCurrentUser({
                            ...user,
                            subscription: userData.subscription || 'free',
                            role: isAdmin ? 'admin' : (userData.role || 'user'),
                            isPro: userData.subscription === 'pro'
                        });
                    } else {
                        console.log('User not approved or not found, signing out...');
                        await signOut(auth);
                        setCurrentUser(null);
                    }
                } catch (error) {
                    console.error('Error verifying user status:', error);
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        login,
        signup,
        logout
    };

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)'
            }}>
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
