import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChecklistReport } from '../../../hooks/Report/useChecklistReport';

// Mocks
const { mockCurrentUser } = vi.hoisted(() => ({
    mockCurrentUser: { uid: 'user-123' }
}));

const { mockUploadImage } = vi.hoisted(() => ({
    mockUploadImage: vi.fn()
}));

vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({ currentUser: mockCurrentUser })
}));

vi.mock('../../../services/StorageService', () => ({
    StorageService: {
        uploadImage: mockUploadImage
    }
}));

describe('useChecklistReport', () => {
    let mockData;
    let mockUpdateData;

    beforeEach(() => {
        mockUploadImage.mockClear();
        mockData = { id: 'report-123', checklist: {} };
        mockUpdateData = vi.fn();
        global.alert = vi.fn();
        global.confirm = vi.fn(() => true);
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('deve inicializar corretamente', () => {
        const { result } = renderHook(() => useChecklistReport(mockData, mockUpdateData));
        expect(result.current.uploading).toEqual({});
    });

    it('deve alterar status de um item', () => {
        const { result } = renderHook(() => useChecklistReport(mockData, mockUpdateData));

        act(() => {
            result.current.handleStatusChange('item-1', 'C');
        });

        expect(mockUpdateData).toHaveBeenCalledWith({
            checklist: {
                'item-1': { status: 'C' }
            }
        });
    });

    it('deve alterar observação de um item', () => {
        const { result } = renderHook(() => useChecklistReport(mockData, mockUpdateData));

        act(() => {
            result.current.handleObsChange('item-1', 'Obs teste');
        });

        expect(mockUpdateData).toHaveBeenCalledWith({
            checklist: {
                'item-1': { observation: 'Obs teste' }
            }
        });
    });

    it('deve fazer upload de foto para item', async () => {
        const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
        const event = { target: { files: [file] } };
        const mockImage = { name: 'photo.jpg', url: 'http://url.com/photo.jpg' };

        mockUploadImage.mockResolvedValueOnce(mockImage);

        const { result } = renderHook(() => useChecklistReport(mockData, mockUpdateData));

        await act(async () => {
            await result.current.handleFileChange('item-1', event);
        });

        expect(mockUploadImage).toHaveBeenCalled();
        expect(mockUpdateData).toHaveBeenCalledWith({
            checklist: {
                'item-1': { photos: [mockImage] }
            }
        });
        // Uploading state should be clear
        expect(result.current.uploading['item-1']).toBe(false);
    });

    it('deve remover foto de item com confirmação', () => {
        mockData.checklist = {
            'item-1': { photos: [{ name: 'photo1' }, { name: 'photo2' }] }
        };

        const { result } = renderHook(() => useChecklistReport(mockData, mockUpdateData));

        act(() => {
            result.current.handleRemovePhoto('item-1', 0);
        });

        expect(global.confirm).toHaveBeenCalledWith('Remover esta foto?');
        expect(mockUpdateData).toHaveBeenCalledWith({
            checklist: {
                'item-1': { photos: [{ name: 'photo2' }] }
            }
        });
    });

    it('deve tratar erro ao enviar foto', async () => {
        mockUploadImage.mockRejectedValueOnce(new Error('Upload error'));
        const alertSpy = vi.spyOn(global, 'alert');
        const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
        const event = { target: { files: [file] } };

        const { result } = renderHook(() => useChecklistReport(mockData, mockUpdateData));

        await act(async () => {
            await result.current.handleFileChange('item-1', event);
        });

        expect(alertSpy).toHaveBeenCalledWith('Erro ao enviar foto.');
        expect(result.current.uploading['item-1']).toBe(false);
    });
});
