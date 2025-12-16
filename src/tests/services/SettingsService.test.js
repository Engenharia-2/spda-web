import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsService } from '../../services/SettingsService';

// Mock dependencies
const mocks = vi.hoisted(() => ({
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    doc: vi.fn(),
    // Mock db object
    db: {}
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => mocks.db),
    doc: mocks.doc,
    setDoc: mocks.setDoc,
    getDoc: mocks.getDoc,
    serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
}));

vi.mock('../../services/firebase', () => ({
    db: mocks.db
}));

describe('SettingsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getSetting', () => {
        it('deve retornar valor da configuração se existir', async () => {
            mocks.getDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({ mySetting: 'some_value' })
            });

            const result = await SettingsService.getSetting('user1', 'mySetting');
            expect(result).toBe('some_value');
            expect(mocks.doc).toHaveBeenCalledWith(mocks.db, 'settings', 'user1');
        });

        it('deve retornar null se doc não existir ou chave vazia', async () => {
            mocks.getDoc.mockResolvedValue({
                exists: () => false
            });

            const result = await SettingsService.getSetting('user1', 'mySetting');
            expect(result).toBeNull();
        });

        it('deve retornar null se doc existir mas chave não', async () => {
            mocks.getDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({ otherKey: 'val' })
            });

            const result = await SettingsService.getSetting('user1', 'mySetting');
            expect(result).toBeNull();
        });
    });

    describe('saveSetting', () => {
        it('deve salvar configuração com merge', async () => {
            await SettingsService.saveSetting('user1', 'mySetting', 'newValue');

            expect(mocks.setDoc).toHaveBeenCalledWith(
                undefined,
                {
                    mySetting: 'newValue',
                    updatedAt: 'MOCK_TIMESTAMP'
                },
                { merge: true }
            );
        });
    });

    describe('getDefaultChecklist', () => {
        it('deve retornar checklist padrão', () => {
            const list = SettingsService.getDefaultChecklist();
            expect(list).toBeInstanceOf(Array);
            expect(list.length).toBeGreaterThan(0);
            expect(list[0]).toHaveProperty('id');
            expect(list[0]).toHaveProperty('label');
        });
    });
});
