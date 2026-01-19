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
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { LocalStorageService } from './LocalStorageService';
import { compressImage } from '../utils/ImageProcessor';

const REPORTS_COLLECTION = 'reports';

// Helper to get current storage mode
const getStorageMode = () => {
    const mode = localStorage.getItem('storageMode');
    const finalMode = mode || 'cloud'; // default to cloud for now, will change logic later
    console.log(`[StorageService] getStorageMode: Detected mode is "${finalMode}".`);
    return finalMode;
};

// Helper to recursively delete all files and folders within a given storage path
const deleteFolderContents = async (path) => {
    try {
        const folderRef = ref(storage, path);
        const res = await listAll(folderRef);

        // Delete all files in the current folder
        const deleteFilePromises = res.items.map(itemRef => deleteObject(itemRef));

        // Recursively delete all subfolders
        const deleteFolderPromises = res.prefixes.map(prefixRef => deleteFolderContents(prefixRef.fullPath));

        await Promise.all([...deleteFilePromises, ...deleteFolderPromises]);
        console.log(`[StorageService] Successfully deleted contents of folder: ${path}`);
    } catch (error) {
        if (error.code !== 'storage/object-not-found') {
            console.error(`[StorageService] Error deleting folder contents for path: ${path}`, error);
        }
        // Do not throw error, to allow the main deletion process to continue
    }
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

    // Delete a report and its associated files
    deleteReport: async (reportId, userId) => {
        const mode = getStorageMode();

        if (mode === 'local') {
            return await LocalStorageService.deleteReport(reportId);
        }

        // Cloud mode
        try {
            // First, delete all associated files in Firebase Storage.
            if (userId) {
                const reportFolderPath = `reports/${userId}/${reportId}`;
                console.log(`[StorageService] Deleting all files in folder: ${reportFolderPath}`);
                await deleteFolderContents(reportFolderPath);
            } else {
                console.warn(`[StorageService] No userId provided for report ${reportId}. Cannot delete associated files.`);
            }

            // After deleting files, delete the Firestore document.
            await deleteDoc(doc(db, REPORTS_COLLECTION, reportId));
            console.log(`[StorageService] Report document ${reportId} deleted successfully.`);
        } catch (error) {
            console.error('Error deleting report (cloud):', error);
            throw error;
        }
    },

    // Delete a file from storage
    deleteFile: async (path) => {
        if (!path) return;
        const mode = getStorageMode();

        if (mode === 'local') {
            console.log('[StorageService] Local file deletion not required/implemented for this context.');
            return;
        }

        try {
            console.log(`[StorageService] Attempting to delete file at path: ${path}`);
            const fileRef = ref(storage, path);
            await deleteObject(fileRef);
            console.log('[StorageService] File deleted successfully.');
        } catch (error) {
            console.error('[StorageService] Error deleting file:', error);
            // We usually don't throw here to avoid blocking the UI if the file was already gone
        }
    },

    // Upload a file
    uploadImage: async (file, path) => {
        console.log(`[StorageService] uploadImage called for file: ${file.name}`);
        
        const processedFile = await compressImage(file);

        const mode = getStorageMode();
        console.log(`[StorageService] Detected storage mode: "${mode}"`);

        if (mode === 'local') {
            try {
                console.log('[StorageService] Calling LocalStorageService.saveImage...');
                const result = await LocalStorageService.saveImage(processedFile);
                console.log('[StorageService] LocalStorageService.saveImage returned:', result);
                return result;
            } catch (localError) {
                console.error('Ocorreu um erro grave', localError);
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
};
