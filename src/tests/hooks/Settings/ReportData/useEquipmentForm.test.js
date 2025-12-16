import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useEquipmentForm } from '../../../../hooks/Settings/ReportData/useEquipmentForm';

describe('useEquipmentForm', () => {
    it('deve inicializar com valores padrão', () => {
        const { result } = renderHook(() => useEquipmentForm(null, vi.fn()));

        expect(result.current.formData).toEqual({
            equipmentName: '',
            serialNumber: '',
            calibrationDate: '',
            calibrationValidity: ''
        });
    });

    it('deve inicializar com dados existentes', () => {
        const initialData = {
            equipmentName: 'Test Eq',
            serialNumber: '123',
            calibrationDate: '2023-01-01',
            calibrationValidity: '2024-01-01'
        };
        const { result } = renderHook(() => useEquipmentForm(initialData, vi.fn()));

        expect(result.current.formData).toEqual(initialData);
    });

    it('deve atualizar campos do formulário', () => {
        const { result } = renderHook(() => useEquipmentForm(null, vi.fn()));

        act(() => {
            result.current.handleChange({
                target: { name: 'equipmentName', value: 'New Name' }
            });
        });

        expect(result.current.formData.equipmentName).toBe('New Name');
    });

    it('deve submeter o formulário', () => {
        const onSubmit = vi.fn();
        const { result } = renderHook(() => useEquipmentForm(null, onSubmit));

        act(() => {
            result.current.handleChange({
                target: { name: 'equipmentName', value: 'Submitted Name' }
            });
        });

        act(() => {
            result.current.handleSubmit({ preventDefault: vi.fn() });
        });

        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
            equipmentName: 'Submitted Name'
        }));
    });

    it('deve resetar o formulário', () => {
        const { result } = renderHook(() => useEquipmentForm(null, vi.fn()));

        act(() => {
            result.current.handleChange({
                target: { name: 'equipmentName', value: 'New Name' }
            });
        });

        act(() => {
            result.current.resetForm();
        });

        expect(result.current.formData.equipmentName).toBe('');
    });

    it('deve atualizar dados quando initialData mudar', () => {
        const { result, rerender } = renderHook(({ data }) => useEquipmentForm(data, vi.fn()), {
            initialProps: { data: null }
        });

        expect(result.current.formData.equipmentName).toBe('');

        const newData = { equipmentName: 'Updated via props' };
        rerender({ data: newData });

        expect(result.current.formData.equipmentName).toBe('Updated via props');
    });
});
