import { db, storage } from './firebase';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getBytes } from 'firebase/storage';
import { LocalStorageService } from './LocalStorageService';

export const SyncService = {
    // Sync Local -> Cloud
    // Uploads all local reports to Firestore and images to Storage
    syncLocalToCloud: async (userId, onProgress) => {
        try {
            const localReports = await LocalStorageService.getUserReports(userId);
            let processed = 0;
            const total = localReports.length;

            for (const report of localReports) {
                // 1. Process Images in the report
                const updatedReport = await processReportImagesForUpload(report, userId);

                // 2. Save to Firestore
                // We use setDoc with merge: true to overwrite/update
                await setDoc(doc(db, 'reports', report.id), {
                    ...updatedReport,
                    userId,
                    updatedAt: serverTimestamp(),
                    syncedAt: serverTimestamp()
                }, { merge: true });

                processed++;
                if (onProgress) onProgress(processed, total);
            }
            return { success: true, count: processed };
        } catch (error) {
            console.error('Sync Local->Cloud failed:', error);
            throw error;
        }
    },

    // Sync Cloud -> Local
    // Downloads all cloud reports to IndexedDB and images as Blobs
    syncCloudToLocal: async (userId, onProgress) => {
        try {
            // 1. Fetch all reports from Firestore
            const q = query(collection(db, 'reports'), where('userId', '==', userId));
            const querySnapshot = await getDocs(q);
            const cloudReports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            let processed = 0;
            const total = cloudReports.length;

            for (const report of cloudReports) {
                // 2. Process Images (Download and save as Blob)
                const updatedReport = await processReportImagesForDownload(report);

                // 3. Save to IndexedDB
                await LocalStorageService.saveReport(updatedReport);

                processed++;
                if (onProgress) onProgress(processed, total);
            }
            return { success: true, count: processed };
        } catch (error) {
            console.error('Sync Cloud->Local failed:', error);
            throw error;
        }
    }
};

// Helper: Upload local images to Firebase Storage and update URLs
async function processReportImagesForUpload(report, userId) {
    const reportCopy = JSON.parse(JSON.stringify(report)); // Deep copy

    // Helper to process a single image object
    const processImage = async (imgObj) => {
        if (imgObj && imgObj.url && imgObj.url.startsWith('local-image://')) {
            try {
                // 1. Get the Blob from IndexedDB
                const localId = imgObj.url.split('local-image://')[1];
                const imageRecord = await LocalStorageService.getImage(localId);

                if (imageRecord && imageRecord.blob) {
                    // 2. Upload to Firebase Storage
                    const storagePath = `reports/${userId}/${report.id}/${imageRecord.name}`;
                    const storageRef = ref(storage, storagePath);
                    await uploadBytes(storageRef, imageRecord.blob);
                    const downloadURL = await getDownloadURL(storageRef);

                    // 3. Update URL in the object
                    imgObj.url = downloadURL;
                    imgObj.path = storagePath; // Save path for future reference
                }
            } catch (err) {
                console.error(`Failed to upload image ${imgObj.url}:`, err);
                // Keep local URL if upload fails? Or mark as error?
                // For now, we keep it, but it won't work on other devices.
            }
        }
    };

    // Traverse Checklist
    if (reportCopy.checklist) {
        for (const key in reportCopy.checklist) {
            const item = reportCopy.checklist[key];
            if (item.photos && Array.isArray(item.photos)) {
                for (const photo of item.photos) {
                    await processImage(photo);
                }
            }
        }
    }

    // Traverse Attachments
    if (reportCopy.attachments && Array.isArray(reportCopy.attachments)) {
        for (const attachment of reportCopy.attachments) {
            await processImage(attachment);
        }
    }

    return reportCopy;
}

// Helper: Download cloud images to Blobs and update URLs
async function processReportImagesForDownload(report) {
    const reportCopy = JSON.parse(JSON.stringify(report)); // Deep copy

    // Helper to process a single image object
    const processImage = async (imgObj) => {
        if (imgObj && imgObj.url && imgObj.url.startsWith('http')) {
            try {
                // 1. Fetch the image data (Blob)
                // We can use fetch directly or getBytes from Firebase SDK if we have the path
                // Using fetch is often easier for public/signed URLs, but getBytes is safer for auth

                let blob;
                if (imgObj.path) {
                    // If we have the storage path, use SDK
                    const storageRef = ref(storage, imgObj.path);
                    const arrayBuffer = await getBytes(storageRef);
                    blob = new Blob([arrayBuffer], { type: imgObj.type || 'image/jpeg' });
                } else {
                    // Fallback to fetch (might fail with CORS if not configured, but we'll try)
                    const response = await fetch(imgObj.url);
                    blob = await response.blob();
                }

                // 2. Save to IndexedDB
                // We need to mock a File object or just pass the Blob with name
                const file = new File([blob], imgObj.name || 'downloaded_image.jpg', { type: blob.type });
                const savedImage = await LocalStorageService.saveImage(file);

                // 3. Update URL to local-image://
                imgObj.url = savedImage.url;
                delete imgObj.path; // Remove cloud path from local copy

            } catch (err) {
                console.error(`Failed to download image ${imgObj.url}:`, err);
                // Keep cloud URL if download fails. It will still work if online.
            }
        }
    };

    // Traverse Checklist
    if (reportCopy.checklist) {
        for (const key in reportCopy.checklist) {
            const item = reportCopy.checklist[key];
            if (item.photos && Array.isArray(item.photos)) {
                for (const photo of item.photos) {
                    await processImage(photo);
                }
            }
        }
    }

    // Traverse Attachments
    if (reportCopy.attachments && Array.isArray(reportCopy.attachments)) {
        for (const attachment of reportCopy.attachments) {
            await processImage(attachment);
        }
    }

    return reportCopy;
}
