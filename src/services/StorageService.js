import { db, storage } from './firebase';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const REPORTS_COLLECTION = 'reports';

export const StorageService = {
    // Save a new report or update an existing one
    saveReport: async (userId, reportData, reportId = null) => {
        try {
            const dataToSave = {
                ...reportData,
                userId,
                updatedAt: serverTimestamp(),
            };

            if (reportId) {
                // Update existing
                const reportRef = doc(db, REPORTS_COLLECTION, reportId);
                await updateDoc(reportRef, dataToSave);
                return reportId;
            } else {
                // Create new
                dataToSave.createdAt = serverTimestamp();
                const docRef = await addDoc(collection(db, REPORTS_COLLECTION), dataToSave);
                return docRef.id;
            }
        } catch (error) {
            console.error('Error saving report:', error);
            throw error;
        }
    },

    // Get all reports for a specific user
    getUserReports: async (userId) => {
        try {
            const q = query(
                collection(db, REPORTS_COLLECTION),
                where('userId', '==', userId)
                // orderBy('updatedAt', 'desc') // Requires index, disabling for now
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching user reports:', error);
            throw error;
        }
    },

    // Get a single report by ID
    getReport: async (reportId) => {
        try {
            const docRef = doc(db, REPORTS_COLLECTION, reportId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                throw new Error('Report not found');
            }
        } catch (error) {
            console.error('Error fetching report:', error);
            throw error;
        }
    },

    // Delete a report
    deleteReport: async (reportId) => {
        try {
            await deleteDoc(doc(db, REPORTS_COLLECTION, reportId));
        } catch (error) {
            console.error('Error deleting report:', error);
            throw error;
        }
    },

    // Upload a file to Firebase Storage (Placeholder for now)
    uploadAttachment: async (file, userId) => {
        try {
            // Create a reference to 'attachments/userId/filename'
            const storageRef = ref(storage, `attachments/${userId}/${Date.now()}_${file.name}`);

            // Upload the file
            const snapshot = await uploadBytes(storageRef, file);

            // Get the URL
            const downloadURL = await getDownloadURL(snapshot.ref);

            return {
                name: file.name,
                url: downloadURL,
                path: snapshot.ref.fullPath,
                type: file.type,
                size: file.size
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }
};
