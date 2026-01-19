import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Hoisted Mocks
const mocks = vi.hoisted(() => ({
    StorageService: {
        uploadImage: vi.fn()
    },
    ImageProcessor: {
        resolveImageUrl: vi.fn()
    },
    useAuth: vi.fn(),
    currentUser: { uid: '123' }
}));

// Mock Dependencies
vi.mock('../../../../services/StorageService', () => ({
    StorageService: mocks.StorageService
}));

vi.mock('../../../../utils/ImageProcessor', () => ({
    resolveImageUrl: mocks.ImageProcessor.resolveImageUrl
}));

vi.mock('../../../../contexts/AuthContext', () => ({
    useAuth: mocks.useAuth
}));

import { useSignatureUpload } from '../../../../hooks/Settings/UIData/useSignatureUpload';

describe('useSignatureUpload', () => {
    let mockOnSignatureChange;

    beforeEach(() => {
        vi.clearAllMocks();
        mockOnSignatureChange = vi.fn();
        mocks.useAuth.mockReturnValue({ currentUser: mocks.currentUser });
    });

    it('deve resolver URL ao inicializar', async () => {
        const data = { signature: 'local-image://test.png' };
        mocks.ImageProcessor.resolveImageUrl.mockResolvedValue('blob:test.png');

        const { result } = renderHook(() => useSignatureUpload(data, mockOnSignatureChange));

        await waitFor(() => {
            expect(result.current.signatureUrl).toBe('blob:test.png');
        });
        expect(mocks.ImageProcessor.resolveImageUrl).toHaveBeenCalledWith('local-image://test.png');
    });

    it('deve usar URL direta se não for para resolver', async () => {
        const data = { signature: 'http://test.png' };
        mocks.ImageProcessor.resolveImageUrl.mockResolvedValue('http://test.png');
        
        const { result } = renderHook(() => useSignatureUpload(data, mockOnSignatureChange));

        await waitFor(() => {
            expect(result.current.signatureUrl).toBe('http://test.png');
        });
        expect(mocks.ImageProcessor.resolveImageUrl).toHaveBeenCalledWith('http://test.png');
    });

    it('deve salvar assinatura do canvas', async () => {
        const { result } = renderHook(() => useSignatureUpload({}, mockOnSignatureChange));

        const mockBlob = new Blob(['test'], { type: 'image/png' });
        const mockCanvas = {
            toBlob: vi.fn((cb) => cb(mockBlob))
        };
        const canvasRef = { current: mockCanvas };

        const uploadedUrl = 'http://uploaded.png';
        mocks.StorageService.uploadImage.mockResolvedValue({ url: uploadedUrl });
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });

        await act(async () => {
            await result.current.saveSignature(canvasRef);
        });

        expect(mocks.StorageService.uploadImage).toHaveBeenCalled();
        expect(mockOnSignatureChange).toHaveBeenCalledWith(uploadedUrl);
        expect(alertSpy).toHaveBeenCalledWith('Assinatura salva com sucesso!');
        expect(result.current.uploading).toBe(false);
    });

    it('deve fazer upload de arquivo', async () => {
        const { result } = renderHook(() => useSignatureUpload({}, mockOnSignatureChange));

        const file = new File([''], 'sig.png', { type: 'image/png' });
        const event = { target: { files: [file] } };

        const uploadedUrl = 'http://uploaded-file.png';
        mocks.StorageService.uploadImage.mockResolvedValue({ url: uploadedUrl });

        await act(async () => {
            await result.current.handleFileUpload(event);
        });

        expect(mocks.StorageService.uploadImage).toHaveBeenCalledWith(file, expect.stringContaining('123/signature_upload_'));
        expect(mockOnSignatureChange).toHaveBeenCalledWith(uploadedUrl);
    });

    it('deve remover assinatura', () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        const clearCanvasFn = vi.fn();
        const { result } = renderHook(() => useSignatureUpload({}, mockOnSignatureChange));

        act(() => {
            result.current.handleRemoveSignature(clearCanvasFn);
        });

        expect(mockOnSignatureChange).toHaveBeenCalledWith(null);
        expect(result.current.signatureUrl).toBe(null);
        expect(clearCanvasFn).toHaveBeenCalled();

        confirmSpy.mockRestore();
    });
});
