import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock mocks
const mocks = vi.hoisted(() => ({
    useSetting: vi.fn(),
    confirmSaved: vi.fn(),
    handleSave: vi.fn(),
    getData: vi.fn(),
    setData: vi.fn()
}));

// Mock Dependencies
vi.mock('../../../../hooks/Settings/useSetting', () => ({
    useSetting: mocks.useSetting
}));

import { useEquipmentSettings } from '../../../../hooks/Settings/ReportData/useEquipmentSettings';

describe('useEquipmentSettings', () => {
    const defaultData = [
        { id: '1', name: 'Eq 1', isDefault: true },
        { id: '2', name: 'Eq 2', isDefault: false }
    ];

    beforeEach(() => {
        vi.clearAllMocks();

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

    it('deve inicializar com dados de lista', () => {
        const { result } = renderHook(() => useEquipmentSettings());
        expect(result.current.equipmentList).toEqual(defaultData);
    });

    it('deve migrar dados legado (objeto) para array', () => {
        const legacyData = { name: 'Legacy Eq', serial: '123' };
        mocks.useSetting.mockReturnValue({
            data: legacyData,
            setData: mocks.setData,
            loading: false,
            saving: false,
            isDirty: false,
            handleSave: mocks.handleSave,
            confirmSaved: mocks.confirmSaved
        });

        const { result } = renderHook(() => useEquipmentSettings());

        expect(result.current.equipmentList).toHaveLength(1);
        expect(result.current.equipmentList[0]).toMatchObject(legacyData);
        expect(result.current.equipmentList[0].id).toBe('legacy_1');
    });

    it('deve adicionar novo equipamento', () => {
        const { result } = renderHook(() => useEquipmentSettings());
        const newEq = { name: 'New Equipment' };

        act(() => {
            result.current.handleAdd(newEq);
        });

        expect(mocks.setData).toHaveBeenCalledWith(expect.any(Array));
        const newData = mocks.setData.mock.calls[0][0]; // Assuming setData is called with new Value directly for arrays?
        // Wait, the hook implementation: setEquipmentData([...equipmentList, newItem]);
        // So it passes the new array.

        expect(newData).toHaveLength(3);
        expect(newData[2]).toMatchObject(newEq);
        expect(newData[2].id).toContain('eq_');
    });

    it('deve atualizar equipamento existente', () => {
        const { result } = renderHook(() => useEquipmentSettings());
        const update = { name: 'Updated Name', isDefault: true };

        act(() => {
            result.current.handleUpdate('1', update);
        });

        expect(mocks.setData).toHaveBeenCalledWith(expect.any(Function));

        const updateFn = mocks.setData.mock.calls[0][0];
        const newState = updateFn(defaultData);

        expect(newState[0].name).toBe('Updated Name');
        expect(newState[1].name).toBe('Eq 2'); // Unchanged
    });

    it('deve deletar equipamento após confirmação', () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        const { result } = renderHook(() => useEquipmentSettings());

        act(() => {
            result.current.handleDelete('1');
        });

        expect(mocks.setData).toHaveBeenCalledWith(expect.any(Function));
        const updateFn = mocks.setData.mock.calls[0][0];
        const newState = updateFn(defaultData);

        expect(newState).toHaveLength(1);
        expect(newState[0].id).toBe('2');

        confirmSpy.mockRestore();
    });

    it('deve definir equipamento como padrão', () => {
        const { result } = renderHook(() => useEquipmentSettings());

        act(() => {
            result.current.handleSetDefault('2');
        });

        expect(mocks.setData).toHaveBeenCalledWith(expect.any(Function));
        const updateFn = mocks.setData.mock.calls[0][0];
        const newState = updateFn(defaultData);

        expect(newState[0].isDefault).toBe(false); // Was true
        expect(newState[1].isDefault).toBe(true);  // Was false
    });

    it('deve chamar handleSave genérico', () => {
        const { result } = renderHook(() => useEquipmentSettings());

        act(() => {
            result.current.handleSave();
        });

        expect(mocks.handleSave).toHaveBeenCalledWith(defaultData);
    });
});
