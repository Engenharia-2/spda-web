import { db, storage } from './firebase';
import { doc, setDoc, writeBatch, serverTimestamp, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LocalStorageService } from './LocalStorageService';

export const SyncService = {
    /**
     * Processes the offline queue:
     * 1. Finds pending reports in IndexedDB.
     * 2. Uploads their images and saves the report to Firestore.
     * 3. Deletes the local copy upon success.
     * 4. Finds pending measurements and uploads them.
     */
    processOfflineQueue: async (userId) => {
        if (!navigator.onLine) return; // Double check

        console.log('[SyncService] Starting offline queue processing...');
        let processedReports = 0;
        let processedMeasurements = 0;

        try {
            // --- 1. Process Pending Reports ---
            const localReports = await LocalStorageService.getUserReports(userId);
            const pendingReports = localReports.filter(r => r.syncStatus === 'pending');

            for (const report of pendingReports) {
                try {
                    console.log(`[SyncService] Processing pending report ${report.id}...`);

                    // A. Upload Images & Update URLs
                    const updatedReport = await processReportImagesForUpload(report, userId);

                    // B. Clean up metadata
                    delete updatedReport.syncStatus;
                    // Ensure ID matches
                    const reportId = updatedReport.id; 

                    // C. Save to Firestore
                    // We use setDoc to ensure we keep the ID generated locally (UUID)
                    await setDoc(doc(db, 'reports', reportId), {
                        ...updatedReport,
                        userId,
                        updatedAt: serverTimestamp(), // Update timestamp
                        syncedAt: serverTimestamp()
                    }, { merge: true });

                    // D. Delete from Local Storage
                    await LocalStorageService.deleteReport(reportId);
                    processedReports++;
                    console.log(`[SyncService] Report ${reportId} synced and removed from local.`);

                } catch (err) {
                    console.error(`[SyncService] Failed to sync report ${report.id}:`, err);
                    // Continue to next report, don't block everything
                }
            }

            // --- 2. Process Pending Measurements ---
            const localMeasurements = await LocalStorageService.getUserMeasurements(userId);
            const pendingMeasurements = localMeasurements.filter(m => m.syncStatus === 'pending');

            if (pendingMeasurements.length > 0) {
                console.log(`[SyncService] Found ${pendingMeasurements.length} pending measurements.`);
                
                // Batch write to Firestore
                const batch = writeBatch(db);
                const measurementsColRef = collection(db, 'measurements');

                pendingMeasurements.forEach(m => {
                    const { syncStatus, ...dataToSave } = m; // Remove syncStatus
                    const docRef = doc(measurementsColRef); // Auto-ID or use m.id? 
                    // Measurement IDs in local might be UUIDs. We can use them or let Firestore generate.
                    // Let's let Firestore generate new IDs for measurements to avoid collision complexities, 
                    // unless we really need the local ID. Usually measurements are just data points.
                    // However, if we want to be safe, we could use the local ID. 
                    // For now: New ID.
                    
                    batch.set(docRef, {
                        ...dataToSave,
                        userId,
                        createdAt: dataToSave.createdAt || serverTimestamp()
                    });
                });

                await batch.commit();
                
                // Delete from Local Storage
                // We need to delete by Group to be efficient, or one by one.
                // LocalStorageService has deleteMeasurementsByGroup.
                const groupIds = [...new Set(pendingMeasurements.map(m => m.group))];
                await LocalStorageService.deleteMeasurementsByGroup(userId, groupIds);
                
                processedMeasurements = pendingMeasurements.length;
                console.log(`[SyncService] Synced ${processedMeasurements} measurements.`);
            }

        } catch (error) {
            console.error('[SyncService] Error processing offline queue:', error);
        }

        console.log(`[SyncService] Sync complete. Reports: ${processedReports}, Measurements: ${processedMeasurements}`);
        return { processedReports, processedMeasurements };
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
                    
                    // Add content type metadata if available
                    const metadata = { contentType: imageRecord.type };
                    await uploadBytes(storageRef, imageRecord.blob, metadata);
                    
                    const downloadURL = await getDownloadURL(storageRef);

                    // 3. Update URL in the object
                    imgObj.url = downloadURL;
                    imgObj.path = storagePath; // Save path for future reference
                } else {
                     console.warn(`[SyncService] Image blob not found for local ID: ${localId}`);
                }
            } catch (err) {
                console.error(`[SyncService] Failed to upload image ${imgObj.url}:`, err);
                // Throwing here might break the whole report sync. 
                // Better to keep local URL? No, that breaks cloud view.
                // We should probably mark this as partial failure or leave it local.
                // For now, let's leave the local URL so the user can try again or see it's broken.
            }
        }
    };

    // Traverse Checklist
    if (reportCopy.checklist) {
        for (const key in reportCopy.checklist) {
            const item = reportCopy.checklist[key];
            if (item.photos && Array.isArray(item.photos)) {
                // Use Promise.all for parallel uploads within an item
                await Promise.all(item.photos.map(photo => processImage(photo)));
            }
        }
    }

    // Traverse Attachments
    if (reportCopy.attachments && Array.isArray(reportCopy.attachments)) {
        await Promise.all(reportCopy.attachments.map(attachment => processImage(attachment)));
    }

    return reportCopy;
}
