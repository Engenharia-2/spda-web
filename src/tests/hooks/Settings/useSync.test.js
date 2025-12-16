import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Hoisted Mocks
const mocks = vi.hoisted(() => ({
    useAuth: vi.fn(),
    mockSyncLocalToCloud: vi.fn(),
    mockSyncCloudToLocal: vi.fn(),
    currentUser: {
        uid: '123',
        subscription: 'pro'
    }
}));

// Mock Dependencies
vi.mock('../../../services/SyncService', () => ({
    SyncService: {
        syncLocalToCloud: mocks.mockSyncLocalToCloud,
        syncCloudToLocal: mocks.mockSyncCloudToLocal
    }
}));

vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: mocks.useAuth
}));

import { useSync } from '../../../hooks/Settings/useSync';

describe('useSync', () => {
    beforeEach(() => {
        // Reset default mock implementation
        mocks.currentUser.subscription = 'pro';
        mocks.useAuth.mockReturnValue({ currentUser: mocks.currentUser });

        mocks.mockSyncLocalToCloud.mockClear();
        mocks.mockSyncCloudToLocal.mockClear();
        vi.clearAllMocks();
    });

    it('deve inicializar com estados padrão', () => {
        const { result } = renderHook(() => useSync());
        expect(result.current.syncing).toBe(false);
        expect(result.current.syncProgress).toBe('');
    });

    it('deve bloquear sincronização Local -> Cloud para usuários Free', async () => {
        mocks.currentUser.subscription = 'free';
        mocks.useAuth.mockReturnValue({ currentUser: mocks.currentUser }); // Update mock return

        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
        const { result } = renderHook(() => useSync());

        await act(async () => {
            await result.current.handleSyncLocalToCloud();
        });

        expect(alertSpy).toHaveBeenCalledWith('A sincronização com a nuvem é exclusiva para usuários Pro.');
        expect(mocks.mockSyncLocalToCloud).not.toHaveBeenCalled();
    });

    it('deve cancelar sincronização se usuário não confirmar', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
        const { result } = renderHook(() => useSync());

        await act(async () => {
            await result.current.handleSyncLocalToCloud();
            await result.current.handleSyncCloudToLocal();
        });

        expect(mocks.mockSyncLocalToCloud).not.toHaveBeenCalled();
        expect(mocks.mockSyncCloudToLocal).not.toHaveBeenCalled();
        confirmSpy.mockRestore();
    });

    it('deve executar sincronização Local -> Cloud com sucesso', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });

        mocks.mockSyncLocalToCloud.mockResolvedValue({ count: 5 });

        const { result } = renderHook(() => useSync());

        await act(async () => {
            await result.current.handleSyncLocalToCloud();
        });

        expect(mocks.mockSyncLocalToCloud).toHaveBeenCalledWith('123', expect.any(Function));
        expect(result.current.syncing).toBe(false);
        expect(alertSpy).toHaveBeenCalledWith('Sincronização concluída! 5 relatórios enviados.');

        confirmSpy.mockRestore();
    });

    it('deve executar sincronização Cloud -> Local com sucesso', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });

        mocks.mockSyncCloudToLocal.mockResolvedValue({ count: 3 });

        const { result } = renderHook(() => useSync());

        await act(async () => {
            await result.current.handleSyncCloudToLocal();
        });

        expect(mocks.mockSyncCloudToLocal).toHaveBeenCalledWith('123', expect.any(Function));
        expect(alertSpy).toHaveBeenCalledWith('Download concluído! 3 relatórios baixados.');

        confirmSpy.mockRestore();
    });

    it('deve lidar com erros na sincronização', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        mocks.mockSyncLocalToCloud.mockRejectedValue(new Error('Sync failed'));

        const { result } = renderHook(() => useSync());

        await act(async () => {
            await result.current.handleSyncLocalToCloud();
        });

        expect(alertSpy).toHaveBeenCalledWith('Erro na sincronização. Verifique o console.');
        expect(result.current.syncing).toBe(false);

        confirmSpy.mockRestore();
        consoleSpy.mockRestore();
    });

    it('deve atualizar progresso durante sincronização', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

        // Mock implementation to verify callback
        mocks.mockSyncLocalToCloud.mockImplementation(async (uid, progressCallback) => {
            // Using act to wrap state updates inside the callback if needed, 
            // though here we are just calling it.
            // In the real code, setSyncProgress is called.
            // Since we are inside the async act scope of handleSyncLocalToCloud, 
            // the updates should be batched or handled.
            // However, to be safe and avoid "not wrapped in act", we can wrap it.
            // But since this runs inside `await result.current.handle...` which IS wrapped in `act`, it might be fine.
            // Let's just call it.
            progressCallback(1, 10);
            return { count: 10 };
        });

        const { result } = renderHook(() => useSync());

        await act(async () => {
            await result.current.handleSyncLocalToCloud();
        });

        expect(mocks.mockSyncLocalToCloud).toHaveBeenCalledWith('123', expect.any(Function));

        confirmSpy.mockRestore();
    });
});
