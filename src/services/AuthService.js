import { auth, db } from './firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { withTimeout } from '../utils/asyncUtils';

/**
 * Creates a standard user document in Firestore.
 * @param {string} uid - The user's ID.
 * @param {string} email - The user's email.
 * @returns {Promise} A promise that resolves when the document is set.
 */
const _createUserDocument = (uid, email) => {
    const userDocRef = doc(db, 'users', uid);
    const userData = {
        email: email,
        status: 'pending',
        subscription: 'free',
        createdAt: new Date().toISOString()
    };
    return setDoc(userDocRef, userData);
};

const signup = async (email, password) => {
    console.log('Starting signup...');
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('User created in Auth:', user.uid);

        console.log('Attempting to create user doc in Firestore...');
        try {
            const userDocPromise = _createUserDocument(user.uid, user.email);

            // Usando withTimeout com um tempo mais curto para o signup, mas sem rejeitar o fluxo principal.
            await withTimeout(userDocPromise, 5000);
            console.log('User doc created successfully');

        } catch (error) {
            // Se o timeout ocorrer, apenas avisamos no console, mas não impedimos o processo de signup.
            // O usuário foi criado no Auth, que é o mais importante neste fluxo.
            console.warn('Firestore user doc creation may have failed or timed out. Proceeding anyway.', error);
        }

        await signOut(auth); // Deslogar após o cadastro para forçar o login
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

        console.log('Checking Firestore user doc...');
        const userDocRef = doc(db, 'users', user.uid);

        let userDoc;
        try {
            // Usando withTimeout para a operação de leitura do documento
            userDoc = await withTimeout(getDoc(userDocRef), 30000);
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
            try {
                // Usando withTimeout para a operação de escrita do documento
                const setUserDocPromise = _createUserDocument(user.uid, user.email);
                await withTimeout(setUserDocPromise, 30000);
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

export const AuthService = {
    signup,
    login,
    logout,
};
