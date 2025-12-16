import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncService } from '../../services/SyncService';
import { LocalStorageService } from '../../services/LocalStorageService';

// Mocks
const mocks = vi.hoisted(() => ({
    uploadBytes: vi.fn(),
    getDownloadURL: vi.fn(),
    getBytes: vi.fn(),
    ref: vi.fn(),
    getStorage: vi.fn(),
    getFirestore: vi.fn(),
    setDoc: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    collection: vi.fn(),
    db: {},
    storage: {}
}));

vi.mock('../../services/LocalStorageService', () => ({
    LocalStorageService: {
        getUserReports: vi.fn(),
        saveReport: vi.fn(),
        getImage: vi.fn(),
        saveImage: vi.fn(),
    }
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => mocks.db),
    collection: mocks.collection,
    doc: mocks.doc,
    setDoc: mocks.setDoc,
    getDocs: mocks.getDocs,
    query: mocks.query,
    where: mocks.where,
    serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
}));

vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(() => mocks.storage),
    ref: mocks.ref,
    uploadBytes: mocks.uploadBytes,
    getDownloadURL: mocks.getDownloadURL,
    getBytes: mocks.getBytes
}));

vi.mock('../../services/firebase', () => ({
    db: mocks.db,
    storage: mocks.storage
}));

describe('SyncService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('syncLocalToCloud', () => {
        it('deve sincronizar relatórios locais para nuvem', async () => {
            const report = {
                id: 'r1',
                title: 'Test',
                checklist: {
                    item1: { photos: [{ url: 'local-image://img1' }] }
                }
            };
            LocalStorageService.getUserReports.mockResolvedValue([report]);
            LocalStorageService.getImage.mockResolvedValue({
                name: 'img1.png',
                blob: new Blob([''], { type: 'image/png' })
            });

            mocks.uploadBytes.mockResolvedValue({});
            mocks.getDownloadURL.mockResolvedValue('http://cloud/img1.png');

            const onProgress = vi.fn();
            const result = await SyncService.syncLocalToCloud('user1', onProgress);

            expect(result.success).toBe(true);
            expect(result.count).toBe(1);
            expect(onProgress).toHaveBeenCalledWith(1, 1);

            // Check Firestore save
            expect(mocks.setDoc).toHaveBeenCalledWith(
                undefined,
                expect.objectContaining({
                    id: 'r1',
                    userId: 'user1',
                    syncedAt: 'MOCK_TIMESTAMP',
                    checklist: {
                        item1: {
                            photos: [{ url: 'http://cloud/img1.png', path: 'reports/user1/r1/img1.png' }]
                        }
                    }
                }),
                { merge: true }
            );
        });
    });

    describe('syncCloudToLocal', () => {
        it('deve baixar relatórios da nuvem para local', async () => {
            const cloudReport = {
                id: 'c1',
                title: 'Cloud Report',
                attachments: [{ url: 'http://cloud/att.png', path: 'cloud/path', name: 'att.png' }]
            };

            mocks.getDocs.mockResolvedValue({
                docs: [{ id: 'c1', data: () => cloudReport }]
            });

            // Mock download
            const mockBuffer = new ArrayBuffer(8);
            mocks.getBytes.mockResolvedValue(mockBuffer);

            LocalStorageService.saveImage.mockResolvedValue({ url: 'local-image://new' });
            LocalStorageService.saveReport.mockResolvedValue('c1');

            const onProgress = vi.fn();
            const result = await SyncService.syncCloudToLocal('user1', onProgress);

            expect(result.success).toBe(true);
            expect(result.count).toBe(1);

            // Check image download
            expect(mocks.getBytes).toHaveBeenCalled();
            expect(LocalStorageService.saveImage).toHaveBeenCalled();

            // Check report save
            expect(LocalStorageService.saveReport).toHaveBeenCalledWith(expect.objectContaining({
                id: 'c1',
                attachments: [{ url: 'local-image://new', name: 'att.png' }]
            }));
        });
    });
});
