import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock mocks
const mocks = vi.hoisted(() => ({
    useSetting: vi.fn(),
    confirmSaved: vi.fn(),
    handleSave: vi.fn(),
    setEngineerData: vi.fn()
}));

// Mock Dependencies
vi.mock('../../../../hooks/Settings/useSetting', () => ({
    useSetting: mocks.useSetting
}));

import { useEngineerSettings } from '../../../../hooks/Settings/ReportData/useEngineerSettings';

describe('useEngineerSettings', () => {
    const defaultData = {
        engineer: 'Initial Engineer',
        signature: 'initial-sig.png'
    };

    beforeEach(() => {
        vi.clearAllMocks();

        mocks.useSetting.mockReturnValue({
            data: defaultData,
            setData: mocks.setEngineerData,
            loading: false,
            saving: false,
            isDirty: false,
            handleSave: mocks.handleSave,
            confirmSaved: mocks.confirmSaved
        });
    });

    it('deve inicializar com dados corretos', () => {
        const { result } = renderHook(() => useEngineerSettings());
        expect(result.current.engineerData).toEqual(defaultData);
    });

    it('deve atualizar campos do engenheiro', () => {
        const { result } = renderHook(() => useEngineerSettings());

        const event = {
            target: { name: 'engineer', value: 'New Engineer' }
        };

        act(() => {
            result.current.handleChange(event);
        });

        expect(mocks.setEngineerData).toHaveBeenCalledWith(expect.any(Function));

        const updateFn = mocks.setEngineerData.mock.calls[0][0];
        const newState = updateFn(defaultData);

        expect(newState.engineer).toBe('New Engineer');
        expect(newState.signature).toBe('initial-sig.png'); // Unchanged
    });

    it('deve atualizar assinatura', () => {
        const { result } = renderHook(() => useEngineerSettings());

        act(() => {
            result.current.handleSignatureChange('new-sig.png');
        });

        expect(mocks.setEngineerData).toHaveBeenCalledWith(expect.any(Function));

        const updateFn = mocks.setEngineerData.mock.calls[0][0];
        const newState = updateFn(defaultData);

        expect(newState.signature).toBe('new-sig.png');
    });

    it('deve chamar handleSave genérico', () => {
        const { result } = renderHook(() => useEngineerSettings());

        act(() => {
            result.current.handleSave();
        });

        expect(mocks.handleSave).toHaveBeenCalledWith(defaultData);
    });
});
