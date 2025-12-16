import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockUser = {
    uid: '123',
    subscription: 'pro'
};

vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        currentUser: mockUser
    })
}));

import { useStorageMode } from '../../../hooks/Settings/useStorageMode';

describe('useStorageMode', () => {
    beforeEach(() => {
        localStorage.clear();
        mockUser.subscription = 'pro'; // Reset to default
        vi.clearAllMocks();
    });

    it('deve inicializar com modo cloud por padrão (se não houver localStorage)', () => {
        const { result } = renderHook(() => useStorageMode());
        expect(result.current.storageMode).toBe('cloud');
    });

    it('deve ler modo do localStorage', () => {
        localStorage.setItem('storageMode', 'local');
        const { result } = renderHook(() => useStorageMode());
        expect(result.current.storageMode).toBe('local');
    });

    it('deve permitir alterar modo para local', () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
        const { result } = renderHook(() => useStorageMode());

        act(() => {
            result.current.handleStorageModeChange('local');
        });

        expect(result.current.storageMode).toBe('local');
        expect(localStorage.getItem('storageMode')).toBe('local');
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Modo de armazenamento alterado para: LOCAL'));
    });

    it('deve permitir alterar modo para cloud se usuário for Pro', () => {
        localStorage.setItem('storageMode', 'local');
        const { result } = renderHook(() => useStorageMode());

        act(() => {
            result.current.handleStorageModeChange('cloud');
        });

        expect(result.current.storageMode).toBe('cloud');
        expect(localStorage.getItem('storageMode')).toBe('cloud');
    });

    it('NÃO deve permitir alterar para cloud se usuário for Free', () => {
        mockUser.subscription = 'free';
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
        localStorage.setItem('storageMode', 'local');

        const { result } = renderHook(() => useStorageMode());

        act(() => {
            result.current.handleStorageModeChange('cloud');
        });

        expect(result.current.storageMode).toBe('local'); // Mantém anterior
        expect(alertSpy).toHaveBeenCalledWith('O armazenamento em nuvem está disponível apenas no plano Pro.');
    });

    it('deve forçar modo local automaticamente se usuário free estiver em cloud (useEffect)', () => {
        mockUser.subscription = 'free';
        localStorage.setItem('storageMode', 'cloud'); // Simula estado inválido anterior

        const { result } = renderHook(() => useStorageMode());

        // O useEffect deve rodar e corrigir para local
        expect(result.current.storageMode).toBe('local');
        expect(localStorage.getItem('storageMode')).toBe('local');
    });
});
