import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

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

import { useReportCustomization } from '../../../../hooks/Settings/UIData/useReportCustomization';

describe('useReportCustomization', () => {
    const defaultData = {
        logo: null,
        headerColor: '#ffffff',
        headerTextColor: '#333333',
        secondaryColor: '#e6e6e6',
        reportTitle: 'Default Title'
    };

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

    it('deve inicializar com configurações', () => {
        const { result } = renderHook(() => useReportCustomization());
        expect(result.current.reportConfig).toEqual(defaultData);
    });

    it('deve atualizar configurações parcialmente', () => {
        const { result } = renderHook(() => useReportCustomization());
        const updates = { reportTitle: 'New Title', headerColor: '#000000' };

        act(() => {
            result.current.updateConfig(updates);
        });

        expect(mocks.setData).toHaveBeenCalledWith(expect.any(Function));

        const updateFn = mocks.setData.mock.calls[0][0];
        const newState = updateFn(defaultData);

        expect(newState).toMatchObject({
            ...defaultData,
            reportTitle: 'New Title',
            headerColor: '#000000'
        });
    });

    it('deve salvar configurações', () => {
        const { result } = renderHook(() => useReportCustomization());

        act(() => {
            result.current.handleSave();
        });

        expect(mocks.handleSave).toHaveBeenCalledWith(defaultData);
    });
});
