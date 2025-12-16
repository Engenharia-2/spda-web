import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from '../../services/StorageService';
import { LocalStorageService } from '../../services/LocalStorageService';

// Mocks
const mocks = vi.hoisted(() => ({
    imageCompression: vi.fn((file) => Promise.resolve(file)), // Return same file
    uploadBytes: vi.fn(),
    getDownloadURL: vi.fn(),
    ref: vi.fn(),
    getStorage: vi.fn(),
    // Firestore
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    db: {},
    storage: {}
}));

vi.mock('browser-image-compression', () => ({
    default: mocks.imageCompression
}));

vi.mock('../../services/LocalStorageService', () => ({
    LocalStorageService: {
        saveReport: vi.fn(),
        getUserReports: vi.fn(),
        getReport: vi.fn(),
        deleteReport: vi.fn(),
        saveImage: vi.fn(),
        resolveImageUrl: vi.fn()
    }
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => mocks.db),
    collection: mocks.collection,
    doc: mocks.doc,
    addDoc: mocks.addDoc,
    updateDoc: mocks.updateDoc,
    getDoc: mocks.getDoc,
    getDocs: mocks.getDocs,
    deleteDoc: mocks.deleteDoc,
    query: mocks.query,
    where: mocks.where,
    serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
}));

vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(() => mocks.storage),
    ref: mocks.ref,
    uploadBytes: mocks.uploadBytes,
    getDownloadURL: mocks.getDownloadURL,
}));

vi.mock('../../services/firebase', () => ({
    db: mocks.db,
    storage: mocks.storage
}));

describe('StorageService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('saveReport', () => {
        it('deve salvar localmente se storageMode for local', async () => {
            localStorage.setItem('storageMode', 'local');
            await StorageService.saveReport('user1', { title: 'Local' });

            expect(LocalStorageService.saveReport).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Local',
                userId: 'user1'
            }));
            expect(mocks.addDoc).not.toHaveBeenCalled();
        });

        it('deve salvar na nuvem se storageMode for cloud (default)', async () => {
            // Default is cloud
            mocks.addDoc.mockResolvedValue({ id: 'cloud_id' });

            const result = await StorageService.saveReport('user1', { title: 'Cloud' });

            expect(result).toBe('cloud_id');
            expect(mocks.addDoc).toHaveBeenCalled();
            expect(LocalStorageService.saveReport).not.toHaveBeenCalled();
        });
    });

    describe('uploadImage', () => {
        it('deve salvar imagem localmente no modo local', async () => {
            localStorage.setItem('storageMode', 'local');
            const file = new File([''], 'img.png', { type: 'image/png' });
            LocalStorageService.saveImage.mockResolvedValue({ url: 'local-url' });

            const result = await StorageService.uploadImage(file);

            expect(LocalStorageService.saveImage).toHaveBeenCalled();
            expect(result).toEqual({ url: 'local-url' });
        });

        it('deve fazer upload para o firebase no modo cloud', async () => {
            const file = new File([''], 'img.png', { type: 'image/png' });
            mocks.uploadBytes.mockResolvedValue({ ref: { fullPath: 'path/img.png' } });
            mocks.getDownloadURL.mockResolvedValue('http://firebase/img.png');

            const result = await StorageService.uploadImage(file);

            expect(mocks.uploadBytes).toHaveBeenCalled();
            expect(mocks.getDownloadURL).toHaveBeenCalled();
            expect(result.url).toBe('http://firebase/img.png');
            expect(mocks.imageCompression).toHaveBeenCalled();
        });
    });

    describe('resolveImageUrl', () => {
        it('deve delegar para LocalStorageService se local-image://', async () => {
            await StorageService.resolveImageUrl('local-image://123');
            expect(LocalStorageService.resolveImageUrl).toHaveBeenCalledWith('local-image://123');
        });

        it('deve retornar URL original se http', async () => {
            const result = await StorageService.resolveImageUrl('http://google.com');
            expect(result).toBe('http://google.com');
            expect(LocalStorageService.resolveImageUrl).not.toHaveBeenCalled();
        });
    });
});
