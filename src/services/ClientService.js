import { db } from './firebase';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';

const CLIENTS_COLLECTION = 'clients';

export const ClientService = {
    // Save a new client or update an existing one
    saveClient: async (userId, clientData, clientId = null) => {
        try {
            const dataToSave = {
                ...clientData,
                userId,
                updatedAt: serverTimestamp(),
            };

            if (clientId) {
                // Update existing
                const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
                await updateDoc(clientRef, dataToSave);
                return clientId;
            } else {
                // Create new
                dataToSave.createdAt = serverTimestamp();
                const docRef = await addDoc(collection(db, CLIENTS_COLLECTION), dataToSave);
                return docRef.id;
            }
        } catch (error) {
            console.error('Error saving client:', error);
            throw error;
        }
    },

    // Get all clients for a specific user
    getUserClients: async (userId) => {
        try {
            const q = query(
                collection(db, CLIENTS_COLLECTION),
                where('userId', '==', userId)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching user clients:', error);
            throw error;
        }
    },

    // Get a single client by ID
    getClient: async (clientId) => {
        try {
            const docRef = doc(db, CLIENTS_COLLECTION, clientId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                throw new Error('Client not found');
            }
        } catch (error) {
            console.error('Error fetching client:', error);
            throw error;
        }
    },

    // Delete a client
    deleteClient: async (clientId) => {
        try {
            await deleteDoc(doc(db, CLIENTS_COLLECTION, clientId));
        } catch (error) {
            console.error('Error deleting client:', error);
            throw error;
        }
    }
};
