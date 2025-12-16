
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAttachments } from '../../../hooks/Report/useAttachments';

// Mocks
const { mockUseAuth } = vi.hoisted(() => ({
    mockUseAuth: vi.fn()
}));

const { mockUploadImage } = vi.hoisted(() => ({
    mockUploadImage: vi.fn()
}));

// Mock AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: mockUseAuth
}));

// Mock StorageService directly (or import if using the shared mock file, but keeping localized for clarity for now, or using the one I just created)
// Let's use the one I just created:
// vi.mock('../../../services/StorageService', ...) defined in importing the mock file?
// Actually, in the plan I said I'd use the shared mock. Let's try to verify if I can import it.
// The issue is `vi.mock` hoisting. If I import from a file that does `vi.mock`, it might work.
// But usually test files define mocks.
// Let's use the explicit mock here for safety as I did in Auth tests.

vi.mock('../../../services/StorageService', () => ({
    StorageService: {
        uploadImage: mockUploadImage
    }
}));

describe('useAttachments', () => {
    let mockData;
    let mockUpdateData;

    beforeEach(() => {
        mockUploadImage.mockClear();
        mockUseAuth.mockReturnValue({ currentUser: { uid: 'user-123' } });
        mockData = { id: 'report-123', attachments: [] };
        mockUpdateData = vi.fn();
        global.alert = vi.fn();
        global.confirm = vi.fn(() => true);
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('deve inicializar corretamente', () => {
        const { result } = renderHook(() => useAttachments(mockData, mockUpdateData));

        expect(result.current.attachments).toEqual([]);
        expect(result.current.isNewReport).toBe(false);
        expect(result.current.uploading).toBe(false);
    });

    it('deve bloquear upload se não estiver autenticado', async () => {
        mockUseAuth.mockReturnValue({ currentUser: null });
        const { result } = renderHook(() => useAttachments(mockData, mockUpdateData));

        const file = new File([''], 'test.png', { type: 'image/png' });
        const event = { target: { files: [file] } };

        await act(async () => {
            await result.current.handleFileChange(event);
        });

        expect(mockUploadImage).not.toHaveBeenCalled();
    });

    it('deve bloquear upload se for relatório novo (sem ID)', async () => {
        mockData.id = null; // isNewReport = true
        const { result } = renderHook(() => useAttachments(mockData, mockUpdateData));

        const file = new File([''], 'test.png', { type: 'image/png' });
        const event = { target: { files: [file] } };

        await act(async () => {
            await result.current.handleFileChange(event);
        });

        expect(mockUploadImage).not.toHaveBeenCalled();
        mockData.id = 'report-123';
    });

    it('deve fazer upload de imagem com sucesso', async () => {
        const file = new File(['content'], 'test.png', { type: 'image/png' });
        const event = { target: { files: [file] } };

        const mockUploadedImage = {
            name: 'test.png',
            url: 'http://url.com/img.png',
            path: 'path/to/img'
        };
        mockUploadImage.mockResolvedValueOnce(mockUploadedImage);

        const { result } = renderHook(() => useAttachments(mockData, mockUpdateData));

        await act(async () => {
            await result.current.handleFileChange(event);
        });

        expect(mockUploadImage).toHaveBeenCalled();
        expect(mockUpdateData).toHaveBeenCalledWith({
            attachments: [{ ...mockUploadedImage, description: '' }]
        });
        expect(result.current.uploading).toBe(false);
    });

    it('deve atualizar descrição do anexo', () => {
        mockData.attachments = [{ name: 'img.png', description: '' }];

        const { result } = renderHook(() => useAttachments(mockData, mockUpdateData));

        act(() => {
            result.current.handleDescriptionChange(0, 'Nova descrição');
        });

        expect(mockUpdateData).toHaveBeenCalledWith({
            attachments: [{ name: 'img.png', description: 'Nova descrição' }]
        });
    });

    it('deve remover anexo com confirmação', () => {
        mockData.attachments = [{ name: 'img1.png' }, { name: 'img2.png' }];
        const { result } = renderHook(() => useAttachments(mockData, mockUpdateData));

        act(() => {
            result.current.handleRemoveAttachment(0);
        });

        expect(global.confirm).toHaveBeenCalledWith('Remover este anexo?');
        expect(mockUpdateData).toHaveBeenCalledWith({
            attachments: [{ name: 'img2.png' }]
        });
    });

    it('não deve remover anexo se cancelar confirmação', () => {
        mockData.attachments = [{ name: 'img1.png' }];
        global.confirm.mockReturnValue(false);

        const { result } = renderHook(() => useAttachments(mockData, mockUpdateData));

        act(() => {
            result.current.handleRemoveAttachment(0);
        });

        expect(mockUpdateData).not.toHaveBeenCalled();
    });

    it('deve tratar erro de upload', async () => {
        const file = new File([''], 'error.png', { type: 'image/png' });
        const event = { target: { files: [file] } };

        mockUploadImage.mockRejectedValueOnce(new Error('Upload failed'));
        const alertSpy = vi.spyOn(global, 'alert');

        const { result } = renderHook(() => useAttachments(mockData, mockUpdateData));

        await act(async () => {
            await result.current.handleFileChange(event);
        });

        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Ocorreu um erro grave'));
        expect(result.current.uploading).toBe(false);
    });
});
