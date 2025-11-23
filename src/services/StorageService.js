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
    serverTimestamp,
    deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LocalStorageService } from './LocalStorageService';

const REPORTS_COLLECTION = 'reports';

// Helper to get current storage mode
const getStorageMode = () => {
    return localStorage.getItem('storageMode') || 'cloud'; // default to cloud for now, will change logic later
};

export const StorageService = {
    // Save a new report or update an existing one
    saveReport: async (userId, reportData, reportId = null) => {
        const mode = getStorageMode();

        if (mode === 'local') {
            return await LocalStorageService.saveReport({ ...reportData, userId, id: reportId });
        }

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
            console.error('Error saving report (cloud):', error);
            throw error;
        }
    },

    // Get all reports for a specific user
    getUserReports: async (userId) => {
        const mode = getStorageMode();

        if (mode === 'local') {
            return await LocalStorageService.getUserReports(userId);
        }

        try {
            const q = query(
                collection(db, REPORTS_COLLECTION),
                where('userId', '==', userId)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching user reports (cloud):', error);
            throw error;
        }
    },

    // Get a single report by ID
    getReport: async (reportId) => {
        const mode = getStorageMode();

        if (mode === 'local') {
            return await LocalStorageService.getReport(reportId);
        }

        try {
            const docRef = doc(db, REPORTS_COLLECTION, reportId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                throw new Error('Report not found');
            }
        } catch (error) {
            console.error('Error fetching report (cloud):', error);
            throw error;
        }
    },

    // Delete a report
    deleteReport: async (reportId) => {
        const mode = getStorageMode();

        if (mode === 'local') {
            return await LocalStorageService.deleteReport(reportId);
        }

        try {
            await deleteDoc(doc(db, REPORTS_COLLECTION, reportId));
        } catch (error) {
            console.error('Error deleting report (cloud):', error);
            throw error;
        }
    },

    // Upload a file
    uploadImage: async (file, path) => {
        const mode = getStorageMode();

        if (mode === 'local') {
            return await LocalStorageService.saveImage(file);
        }

        console.log('Starting upload for:', file.name, 'to path:', path);
        try {
            const storagePath = path || `uploads/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, storagePath);

            // Add a timeout to the upload
            const uploadPromise = uploadBytes(storageRef, file);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Upload timed out after 30 seconds')), 30000)
            );

            const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
            console.log('Upload completed, fetching URL...');

            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log('URL fetched:', downloadURL);

            return {
                name: file.name,
                url: downloadURL,
                path: snapshot.ref.fullPath,
                type: file.type,
                size: file.size,
                uploadedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error uploading file (cloud):', error);
            throw error;
        }
    },

    // Helper to resolve image URLs (needed for local blobs)
    resolveImageUrl: async (url) => {
        if (url && url.startsWith('local-image://')) {
            return await LocalStorageService.resolveImageUrl(url);
        }
        return url;
    }
};
