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
    deleteDoc,
    writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { compressImage } from '../utils/ImageProcessor';
import { LocalStorageService } from './LocalStorageService';

const REPORTS_COLLECTION = 'reports';

// Helper to check online status
const isOnline = () => navigator.onLine;

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

// Helper function to handle the actual Firebase Storage upload logic
const _uploadToCloud = async (processedFile, path) => {
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
};

export const StorageService = {
    // Save a new report or update an existing one
    saveReport: async (userId, reportData, reportId = null) => {
        // Try Cloud first if online
        if (isOnline()) {
            try {
                const dataToSave = {
                    ...reportData,
                    userId,
                    updatedAt: serverTimestamp(),
                    syncStatus: 'synced' // Mark as synced
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
                console.error('[StorageService] Cloud save failed, falling back to local:', error);
                // Fallthrough to local save
            }
        }

        // Offline Fallback
        console.log('[StorageService] Saving report locally (Offline Mode).');
        try {
            return await LocalStorageService.saveReport({
                ...reportData,
                userId,
                id: reportId, // Might be null, LocalStorageService generates one
                syncStatus: 'pending',
                updatedAt: new Date().toISOString(),
                createdAt: reportData.createdAt || new Date().toISOString()
            });
        } catch (localError) {
            console.error('[StorageService] Critical: Failed to save locally.', localError);
            throw localError;
        }
    },

    // Get all reports for a specific user
    getUserReports: async (userId) => {
        if (isOnline()) {
            try {
                const q = query(
                    collection(db, REPORTS_COLLECTION),
                    where('userId', '==', userId)
                );

                const querySnapshot = await getDocs(q);
                const cloudReports = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                // Optional: We could merge with local pending reports here to show everything
                // For now, let's just return cloud reports + local pending reports so user sees what's waiting
                const localReports = await LocalStorageService.getUserReports(userId);
                const pendingReports = localReports.filter(r => r.syncStatus === 'pending');
                
                // Deduplicate based on ID (prefer Cloud version if conflict, or Local if it's an edit? 
                // Usually if pending exists locally, it's newer. But simplicity first.)
                // Let's just append pending ones that aren't in cloud list (by ID)
                const cloudIds = new Set(cloudReports.map(r => r.id));
                const uniquePending = pendingReports.filter(r => !cloudIds.has(r.id));
                
                return [...cloudReports, ...uniquePending];

            } catch (error) {
                console.error('[StorageService] Cloud fetch failed, falling back to local:', error);
            }
        }

        // Offline Fallback
        console.log('[StorageService] Fetching reports locally (Offline Mode).');
        return await LocalStorageService.getUserReports(userId);
    },

    // Get a single report by ID
    getReport: async (reportId) => {
        if (isOnline()) {
            try {
                const docRef = doc(db, REPORTS_COLLECTION, reportId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    return { id: docSnap.id, ...docSnap.data() };
                } 
                // If not found in cloud, might be a local-only pending report
            } catch (error) {
                console.error('[StorageService] Cloud fetch report failed, checking local:', error);
            }
        }

        // Offline/Not Found Fallback
        console.log('[StorageService] Fetching single report locally.');
        const localReport = await LocalStorageService.getReport(reportId);
        if (localReport) return localReport;

        throw new Error('Report not found (checked Cloud and Local)');
    },

    // Save/Upsert an array of measurements
    saveMeasurements: async (userId, measurementData) => {
        if (!userId || !measurementData || measurementData.length === 0) {
            throw new Error('User ID and measurement data are required for save.');
        }

        const groupIds = [...new Set(measurementData.map(m => m.group))];
        
        // Try Cloud
        if (isOnline()) {
            try {
                // Delete old groups first
                await StorageService.deleteMeasurementsByGroup(userId, groupIds);

                const saveBatch = writeBatch(db);
                const measurementsColRef = collection(db, 'measurements');

                measurementData.forEach(measurement => {
                    const docRef = doc(measurementsColRef);
                    saveBatch.set(docRef, {
                        ...measurement,
                        userId,
                        createdAt: serverTimestamp(),
                        syncStatus: 'synced'
                    });
                });

                await saveBatch.commit();
                console.log(`[StorageService] ${measurementData.length} new measurements saved to CLOUD successfully.`);
                return;
            } catch (error) {
                console.error('[StorageService] Cloud save measurements failed, falling back to local:', error);
            }
        }

        // Offline Fallback
        console.log('[StorageService] Saving measurements locally (Offline Mode).');
        // We first delete local ones of same group to avoid dupes
        await LocalStorageService.deleteMeasurementsByGroup(userId, groupIds);
        
        // Mark as pending
        const pendingMeasurements = measurementData.map(m => ({ ...m, syncStatus: 'pending' }));
        return await LocalStorageService.saveMeasurements(userId, pendingMeasurements);
    },

    // Deletes all measurements for a user within specific groups
    deleteMeasurementsByGroup: async (userId, groupIds) => {
        if (!userId || !groupIds || groupIds.length === 0) return;

        if (isOnline()) {
            try {
                const measurementsRef = collection(db, 'measurements');
                const q = query(measurementsRef, where('userId', '==', userId), where('group', 'in', groupIds));
                
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const deleteBatch = writeBatch(db);
                    querySnapshot.forEach(doc => deleteBatch.delete(doc.ref));
                    await deleteBatch.commit();
                }
                // Also clean up local just in case
                await LocalStorageService.deleteMeasurementsByGroup(userId, groupIds);
                return;
            } catch (error) {
                console.error(`[StorageService] Error deleting cloud measurements:`, error);
                // Fallthrough to local delete attempt
            }
        }

        // Offline Fallback
        return await LocalStorageService.deleteMeasurementsByGroup(userId, groupIds);
    },

    // Get all measurements for a user
    getUserMeasurements: async (userId) => {
        if (!userId) throw new Error('User ID is required.');

        if (isOnline()) {
            try {
                const q = query(
                    collection(db, 'measurements'),
                    where('userId', '==', userId)
                );

                const querySnapshot = await getDocs(q);
                const cloudResults = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                // Merge with local pending
                const localResults = await LocalStorageService.getUserMeasurements(userId);
                const pendingLocal = localResults.filter(m => m.syncStatus === 'pending');
                
                console.log(`[StorageService] Fetched ${cloudResults.length} cloud + ${pendingLocal.length} pending local measurements.`);
                return [...cloudResults, ...pendingLocal];

            } catch (error) {
                console.error('Error fetching user measurements from CLOUD:', error);
            }
        }

        // Offline Fallback
        console.log('[StorageService] Fetching measurements locally.');
        return await LocalStorageService.getUserMeasurements(userId);
    },

    // Delete a report and its associated files
    deleteReport: async (reportId, userId) => {
        if (isOnline()) {
            try {
                if (userId) {
                    const reportFolderPath = `reports/${userId}/${reportId}`;
                    await deleteFolderContents(reportFolderPath);
                }
                await deleteDoc(doc(db, REPORTS_COLLECTION, reportId));
                console.log(`[StorageService] Report document ${reportId} deleted from Cloud.`);
                
                // Also delete from local to keep clean
                await LocalStorageService.deleteReport(reportId);
                return;
            } catch (error) {
                console.error('Error deleting report (cloud):', error);
                // Fallthrough
            }
        }

        // Offline Fallback (Mark for deletion? Or just delete local copy?)
        // If we delete local copy, it might reappear from cloud later if not actually deleted there.
        // For now, simple local delete. Real "sync deletions" requires a "deleted_items" queue.
        console.log('[StorageService] Deleting report locally (Offline/Fallback).');
        return await LocalStorageService.deleteReport(reportId);
    },

    // Delete a file from storage
    deleteFile: async (path) => {
        if (!path) return;

        if (isOnline()) {
            try {
                const fileRef = ref(storage, path);
                await deleteObject(fileRef);
                console.log('[StorageService] File deleted from Cloud.');
                return;
            } catch (error) {
                console.error('[StorageService] Error deleting file:', error);
            }
        }
        // Local file deletion is handled inside LocalStorageService if needed, 
        // but individual file deletion is rare in offline mode (usually whole report).
    },

    // Upload a file
    uploadImage: async (file, path) => {
        console.log(`[StorageService] uploadImage called for file: ${file.name}`);
        const processedFile = await compressImage(file);

        if (isOnline()) {
            try {
                return await _uploadToCloud(processedFile, path);
            } catch (error) {
                console.error('[StorageService] Cloud upload failed, falling back to local:', error);
            }
        }

        // Offline Fallback
        console.log('[StorageService] Saving image locally (Offline Mode).');
        return await LocalStorageService.saveImage(processedFile);
    },

    // Upload a profile photo
    uploadProfilePhoto: async (file, path) => {
        console.log(`[StorageService] uploadProfilePhoto called for file: ${file.name}`);
        const processedFile = await compressImage(file);

        if (isOnline()) {
            try {
                return await _uploadToCloud(processedFile, path);
            } catch (error) {
                console.error('[StorageService] Profile photo cloud upload failed:', error);
            }
        }
        
        // Fallback for profile photo
        console.log('[StorageService] Saving profile photo locally (Offline Mode).');
        return await LocalStorageService.saveImage(processedFile);
    },
};
