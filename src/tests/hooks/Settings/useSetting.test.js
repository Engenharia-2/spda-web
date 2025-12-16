import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Hoisted Mocks
const { mockGetSetting, mockSaveSetting } = vi.hoisted(() => {
    return {
        mockGetSetting: vi.fn(),
        mockSaveSetting: vi.fn()
    };
});

// Mock Dependencies
vi.mock('../../../services/SettingsService', () => ({
    SettingsService: {
        getSetting: mockGetSetting,
        saveSetting: mockSaveSetting
    }
}));

vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        currentUser: { uid: '123' }
    })
}));

import { useSetting } from '../../../hooks/Settings/useSetting';

describe('useSetting', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve buscar configurações ao montar e usar valor do DB', async () => {
        mockGetSetting.mockResolvedValue('value_from_db');
        const { result } = renderHook(() => useSetting('testKey', 'default'));

        expect(result.current.loading).toBe(true);
        expect(result.current.data).toBe('default');

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockGetSetting).toHaveBeenCalledWith('123', 'testKey');
        expect(result.current.data).toBe('value_from_db');
        expect(result.current.isDirty).toBe(false);
    });

    it('deve usar valor default se não houver configuração no DB', async () => {
        mockGetSetting.mockResolvedValue(null);
        const { result } = renderHook(() => useSetting('testKey', 'default_value'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toBe('default_value');
        expect(result.current.isDirty).toBe(false);
    });

    it('deve manter valor default em caso de erro no fetch', async () => {
        mockGetSetting.mockRejectedValue(new Error('Fetch error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const { result } = renderHook(() => useSetting('testKey', 'default_value'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toBe('default_value');
        consoleSpy.mockRestore();
    });

    it('deve atualizar estado local e marcar como dirty', async () => {
        mockGetSetting.mockResolvedValue('initial');
        const { result } = renderHook(() => useSetting('testKey', 'initial'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        act(() => {
            result.current.setData('new_value');
        });

        expect(result.current.data).toBe('new_value');
        expect(result.current.isDirty).toBe(true);
    });

    it.skip('deve salvar configurações com sucesso', async () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
        mockGetSetting.mockResolvedValue('initial');
        mockSaveSetting.mockResolvedValue(true);

        const { result } = renderHook(() => useSetting('testKey', 'initial'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        act(() => {
            result.current.setData('new_value');
        });

        await act(async () => {
            await result.current.handleSave('new_value');
        });

        expect(mockSaveSetting).toHaveBeenCalledWith('123', 'testKey', 'new_value');
        expect(alertSpy).toHaveBeenCalledWith('Configurações salvas com sucesso!');

        // Wait for state update
        await waitFor(() => {
            expect(result.current.saving).toBe(false);
        });

        expect(result.current.data).toBe('new_value');
        expect(result.current.isDirty).toBe(false);
    }, 10000);

    it('deve lidar com erro ao salvar', async () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        mockGetSetting.mockResolvedValue('initial');
        mockSaveSetting.mockRejectedValue(new Error('Save error'));

        const { result } = renderHook(() => useSetting('testKey', 'initial'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.handleSave('new_value');
        });

        expect(alertSpy).toHaveBeenCalledWith('Erro ao salvar configurações.');

        await waitFor(() => {
            expect(result.current.saving).toBe(false);
        });

        consoleSpy.mockRestore();
    });

    it('deve confirmar salvamento manual (confirmSaved)', async () => {
        mockGetSetting.mockResolvedValue('initial');
        const { result } = renderHook(() => useSetting('testKey', 'initial'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        act(() => {
            result.current.setData('new_value');
        });

        expect(result.current.isDirty).toBe(true);

        act(() => {
            result.current.confirmSaved();
        });

        expect(result.current.isDirty).toBe(false);
    });
});
