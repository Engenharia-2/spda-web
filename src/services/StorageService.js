import imageCompression from 'browser-image-compression';
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
    const mode = localStorage.getItem('storageMode');
    const finalMode = mode || 'cloud'; // default to cloud for now, will change logic later
    console.log(`[StorageService] getStorageMode: Detected mode is "${finalMode}".`);
    return finalMode;
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
        console.log(`[StorageService] uploadImage called for file: ${file.name}`);
        console.log(`[StorageService] Original image size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
        };

        let processedFile;
        try {
            console.log('[StorageService] Compressing image...');
            processedFile = await imageCompression(file, options);
            console.log(`[StorageService] Compressed image size: ${(processedFile.size / 1024 / 1024).toFixed(2)} MB`);
        } catch (compressionError) {
            console.error('[StorageService] Error during image compression. Falling back to original file.', compressionError);
            processedFile = file;
        }

        const mode = getStorageMode();
        console.log(`[StorageService] Detected storage mode: "${mode}"`);

        if (mode === 'local') {
            try {
                console.log('[StorageService] Calling LocalStorageService.saveImage...');
                const result = await LocalStorageService.saveImage(processedFile);
                console.log('[StorageService] LocalStorageService.saveImage returned:', result);
                return result;
            } catch (localError) {
                console.error('[StorageService] Error saving image to local storage.', localError);
                throw localError; // Re-throw the error to be caught by the UI
            }
        }

        // Cloud mode
        console.log('[StorageService] Starting CLOUD upload for:', processedFile.name, 'to path:', path);
        try {
            const storagePath = path || `uploads/${Date.now()}_${processedFile.name}`;
            const storageRef = ref(storage, storagePath);

            const uploadPromise = uploadBytes(storageRef, processedFile);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Upload timed out after 30 seconds')), 30000)
            );

            console.log('[StorageService] Awaiting upload to Firebase...');
            const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
            console.log('[StorageService] CLOUD upload completed, fetching URL...');

            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log('[StorageService] CLOUD URL fetched:', downloadURL);

            return {
                name: processedFile.name,
                url: downloadURL,
                path: snapshot.ref.fullPath,
                type: processedFile.type,
                size: processedFile.size,
                uploadedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('[StorageService] CRITICAL: Error uploading file to CLOUD.', error);
            throw error;
        }
    },

    // Helper to resolve image URLs (needed for local blobs)
    resolveImageUrl: async (url) => {
        console.log(`[StorageService] resolveImageUrl called with URL: ${url}`);
        if (url && url.startsWith('local-image://')) {
            console.log('[StorageService] Detected local-image scheme, delegating to LocalStorageService.');
            return await LocalStorageService.resolveImageUrl(url);
        }
        console.log('[StorageService] URL is not a local-image scheme, returning original URL.');
        return url;
    }
};
