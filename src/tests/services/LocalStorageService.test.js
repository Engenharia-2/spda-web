import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LocalStorageService } from '../../services/LocalStorageService';

// Mock IndexedDB
const mockIndexedDB = {
    open: vi.fn(),
};

const mockDb = {
    transaction: vi.fn(),
    objectStoreNames: { contains: vi.fn() },
    createObjectStore: vi.fn(),
};

const mockTransaction = {
    objectStore: vi.fn(),
};

const mockStore = {
    put: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    delete: vi.fn(),
};

global.indexedDB = mockIndexedDB;
Object.defineProperty(global, 'crypto', {
    value: { randomUUID: () => 'mock-uuid' }
});

describe('LocalStorageService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        LocalStorageService.db = null; // Reset singleton

        // Setup success mock for open
        mockIndexedDB.open.mockReturnValue({
            result: mockDb,
            set onupgradeneeded(fn) { fn({ target: { result: mockDb } }); },
            set onsuccess(fn) { fn({ target: { result: mockDb } }); },
            set onerror(fn) { },
        });

        // Setup transaction mocks
        mockDb.transaction.mockReturnValue(mockTransaction);
        mockTransaction.objectStore.mockReturnValue(mockStore);
    });

    afterEach(() => {
        // Cleanup if needed
    });

    describe('openDB', () => {
        it('deve abrir o banco de dados e criar stores', async () => {
            mockDb.objectStoreNames.contains.mockReturnValue(false);

            const db = await LocalStorageService.openDB();

            expect(mockIndexedDB.open).toHaveBeenCalled();
            expect(db).toBe(mockDb);
            expect(mockDb.createObjectStore).toHaveBeenCalledTimes(3); // reports, images, settings
        });

        it('deve retornar db cacheado', async () => {
            LocalStorageService.db = mockDb;
            const db = await LocalStorageService.openDB();
            expect(db).toBe(mockDb);
            expect(mockIndexedDB.open).not.toHaveBeenCalled();
        });
    });

    describe('saveReport', () => {
        it('deve salvar relatório', async () => {
            const mockRequest = {};
            mockStore.put.mockReturnValue(mockRequest);

            // Auto complete request
            setTimeout(() => mockRequest.onsuccess(), 0);

            const report = { title: 'Test' };
            const resultId = await LocalStorageService.saveReport(report);

            expect(resultId).toBe('mock-uuid');
            expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
                id: 'mock-uuid',
                title: 'Test',
                updatedAt: expect.any(String)
            }));
        });
    });

    describe('getReport', () => {
        it('deve buscar relatório', async () => {
            const mockRequest = { result: { id: '1', title: 'Found' } };
            mockStore.get.mockReturnValue(mockRequest);
            setTimeout(() => mockRequest.onsuccess(), 0);

            const report = await LocalStorageService.getReport('1');
            expect(report).toEqual({ id: '1', title: 'Found' });
        });
    });

    describe('saveImage', () => {
        it('deve salvar imagem', async () => {
            const mockRequest = {};
            mockStore.put.mockReturnValue(mockRequest);
            setTimeout(() => mockRequest.onsuccess(), 0);

            const file = new File(['content'], 'test.png', { type: 'image/png' });
            const result = await LocalStorageService.saveImage(file);

            expect(result.url).toContain('local-image://mock-uuid');
            expect(result.name).toBe('test.png');
            expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
                blob: file,
                id: 'mock-uuid'
            }));
        });
    });

    describe('resolveImageUrl', () => {
        it('deve resolver url local para blob', async () => {
            // Mock getImage -> store.get
            const mockBlob = new Blob(['data'], { type: 'image/png' });
            const mockRecord = { blob: mockBlob };
            const mockRequest = { result: mockRecord };
            mockStore.get.mockReturnValue(mockRequest);
            setTimeout(() => mockRequest.onsuccess(), 0);

            const mockUrl = 'blob:http://localhost/mock';
            global.URL.createObjectURL = vi.fn(() => mockUrl);

            const result = await LocalStorageService.resolveImageUrl('local-image://123');
            expect(result).toBe(mockUrl);
            expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
        });

        it('deve retornar a mesma URL se não for local', async () => {
            const result = await LocalStorageService.resolveImageUrl('http://google.com/img.png');
            expect(result).toBe('http://google.com/img.png');
        });
    });
});
