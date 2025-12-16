import { vi } from 'vitest';

// Mock do Firebase Auth
export const mockAuth = {
    currentUser: null
};

// Mock das funções do Firebase Auth
export const signInWithEmailAndPassword = vi.fn();
export const createUserWithEmailAndPassword = vi.fn();
export const signOut = vi.fn();
export const sendPasswordResetEmail = vi.fn();
export const onAuthStateChanged = vi.fn();
export const updatePassword = vi.fn();
export const reauthenticateWithCredential = vi.fn();
export const deleteUser = vi.fn();

// Mock do EmailAuthProvider
export const EmailAuthProvider = {
    credential: vi.fn()
};

// Mock do Firestore
export const mockDb = {};

export const getDoc = vi.fn();
export const setDoc = vi.fn();
export const doc = vi.fn();
export const collection = vi.fn();
export const getDocs = vi.fn();
export const updateDoc = vi.fn();

// Mock do módulo firebase
vi.mock('../../../services/firebase', () => ({
    auth: mockAuth,
    db: mockDb
}));

// Mock das funções do Firebase Auth
vi.mock('firebase/auth', () => ({
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    deleteUser
}));

// Mock das funções do Firestore
vi.mock('firebase/firestore', () => ({
    getDoc,
    setDoc,
    doc,
    collection,
    getDocs,
    updateDoc
}));
