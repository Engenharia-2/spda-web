import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock mocks
const mocks = vi.hoisted(() => ({
    useSetting: vi.fn(),
    confirmSaved: vi.fn(),
    handleSave: vi.fn(),
    setData: vi.fn()
}));

// Mock Dependencies
vi.mock('../../../../hooks/Settings/useSetting', () => ({
    useSetting: mocks.useSetting
}));

import { useChecklistSettings } from '../../../../hooks/Settings/ReportData/useChecklistSettings';
import { SettingsService } from '../../../../services/SettingsService';

describe('useChecklistSettings', () => {
    const defaultData = [
        { id: '1', label: 'Item 1', active: true, isDefault: true },
        { id: '2', label: 'Item 2', active: false, isDefault: true }
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementation for useSetting
        mocks.useSetting.mockReturnValue({
            data: defaultData,
            setData: mocks.setData,
            loading: false,
            saving: false,
            isDirty: false,
            handleSave: mocks.handleSave,
            confirmSaved: mocks.confirmSaved
        });
    });

    it('deve inicializar corretamente', () => {
        const { result } = renderHook(() => useChecklistSettings());

        expect(result.current.items).toEqual(defaultData);
        expect(result.current.loading).toBe(false);
        expect(result.current.newItemLabel).toBe('');
    });

    it('deve alternar status ativo de um item', () => {
        const { result } = renderHook(() => useChecklistSettings());

        act(() => {
            result.current.handleToggleActive('1');
        });

        expect(mocks.setData).toHaveBeenCalledWith(expect.any(Function));

        // Simulate state update via callback
        const updateFn = mocks.setData.mock.calls[0][0];
        const newState = updateFn(defaultData);

        expect(newState[0].active).toBe(false);
        expect(newState[1].active).toBe(false); // Unchanged
    });

    it('deve adicionar novo item', () => {
        const { result } = renderHook(() => useChecklistSettings());

        act(() => {
            result.current.setNewItemLabel('New Item');
        });

        act(() => {
            result.current.handleAddItem({ preventDefault: vi.fn() });
        });

        expect(mocks.setData).toHaveBeenCalledWith(expect.any(Function));

        const updateFn = mocks.setData.mock.calls[0][0];
        const newState = updateFn(defaultData);

        expect(newState).toHaveLength(3);
        expect(newState[2]).toMatchObject({
            label: 'New Item',
            active: true,
            isDefault: false
        });
        expect(newState[2].id).toContain('custom_');

        expect(result.current.newItemLabel).toBe('');
    });

    it('não deve adicionar item vazio', () => {
        const { result } = renderHook(() => useChecklistSettings());

        act(() => {
            result.current.setNewItemLabel('   ');
        });

        act(() => {
            result.current.handleAddItem({ preventDefault: vi.fn() });
        });

        expect(mocks.setData).not.toHaveBeenCalled();
    });

    it('deve remover item após confirmação', () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        const { result } = renderHook(() => useChecklistSettings());

        act(() => {
            result.current.handleDeleteItem('1');
        });

        expect(mocks.setData).toHaveBeenCalledWith(expect.any(Function));

        const updateFn = mocks.setData.mock.calls[0][0];
        const newState = updateFn(defaultData);

        expect(newState).toHaveLength(1);
        expect(newState[0].id).toBe('2');

        confirmSpy.mockRestore();
    });

    it('não deve remover item se cancelado', () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
        const { result } = renderHook(() => useChecklistSettings());

        act(() => {
            result.current.handleDeleteItem('1');
        });

        expect(mocks.setData).not.toHaveBeenCalled();
        confirmSpy.mockRestore();
    });

    it('deve chamar handleSave genérico', () => {
        const { result } = renderHook(() => useChecklistSettings());

        act(() => {
            result.current.handleSave();
        });

        expect(mocks.handleSave).toHaveBeenCalledWith(defaultData);
    });
});
