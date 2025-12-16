import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientService } from '../../services/ClientService';

// Mock dependencies
const mocks = vi.hoisted(() => ({
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    doc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    // Mock db object
    db: {}
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => mocks.db),
    collection: mocks.collection,
    doc: mocks.doc,
    addDoc: mocks.addDoc,
    updateDoc: mocks.updateDoc,
    deleteDoc: mocks.deleteDoc,
    getDoc: mocks.getDoc,
    getDocs: mocks.getDocs,
    query: mocks.query,
    where: mocks.where,
    serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
}));

vi.mock('../../services/firebase', () => ({
    db: mocks.db
}));

describe('ClientService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('saveClient', () => {
        it('deve criar novo cliente se não tiver ID', async () => {
            mocks.addDoc.mockResolvedValue({ id: 'new_client_id' });

            const clientData = { name: 'New Client' };
            const result = await ClientService.saveClient('user1', clientData);

            expect(result).toBe('new_client_id');
            expect(mocks.collection).toHaveBeenCalled();
            expect(mocks.addDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({
                name: 'New Client',
                userId: 'user1',
                createdAt: 'MOCK_TIMESTAMP'
            }));
        });

        it('deve atualizar cliente existente se tiver ID', async () => {
            const clientData = { name: 'Updated Client' };
            await ClientService.saveClient('user1', clientData, 'existing_id');

            expect(mocks.doc).toHaveBeenCalledWith(mocks.db, 'clients', 'existing_id');
            expect(mocks.updateDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({
                name: 'Updated Client',
                userId: 'user1',
                updatedAt: 'MOCK_TIMESTAMP'
            }));
        });
    });

    describe('getUserClients', () => {
        it('deve buscar clientes do usuário', async () => {
            const mockDocs = [
                { id: '1', data: () => ({ name: 'C1', userId: 'user1' }) },
                { id: '2', data: () => ({ name: 'C2', userId: 'user1' }) }
            ];
            mocks.getDocs.mockResolvedValue({ docs: mockDocs });

            const result = await ClientService.getUserClients('user1');

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ id: '1', name: 'C1', userId: 'user1' });
            expect(mocks.query).toHaveBeenCalled();
            expect(mocks.where).toHaveBeenCalledWith('userId', '==', 'user1');
        });
    });

    describe('getClient', () => {
        it('deve retornar cliente se existir', async () => {
            mocks.getDoc.mockResolvedValue({
                exists: () => true,
                id: 'c1',
                data: () => ({ name: 'Client 1' })
            });

            const result = await ClientService.getClient('c1');
            expect(result).toEqual({ id: 'c1', name: 'Client 1' });
        });

        it('deve lançar erro se não existir', async () => {
            mocks.getDoc.mockResolvedValue({
                exists: () => false
            });

            await expect(ClientService.getClient('bad_id')).rejects.toThrow('Client not found');
        });
    });

    describe('deleteClient', () => {
        it('deve deletar cliente', async () => {
            await ClientService.deleteClient('c1');
            expect(mocks.deleteDoc).toHaveBeenCalled();
        });
    });
});
