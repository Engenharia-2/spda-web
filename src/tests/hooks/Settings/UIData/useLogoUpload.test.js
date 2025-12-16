import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useLogoUpload } from '../../../../hooks/Settings/UIData/useLogoUpload';

describe('useLogoUpload', () => {
    let mockOnLogoChange;

    beforeEach(() => {
        mockOnLogoChange = vi.fn();
        vi.clearAllMocks();
    });

    it('deve inicializar com estado de upload falso', () => {
        const { result } = renderHook(() => useLogoUpload(mockOnLogoChange));
        expect(result.current.uploading).toBe(false);
    });

    it('deve remover logo', () => {
        const { result } = renderHook(() => useLogoUpload(mockOnLogoChange));

        act(() => {
            result.current.handleRemoveLogo();
        });

        expect(mockOnLogoChange).toHaveBeenCalledWith(null);
    });

    it('deve validar tamanho do arquivo', () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
        const { result } = renderHook(() => useLogoUpload(mockOnLogoChange, 100)); // Max 100KB

        const largeFile = { size: 101 * 1024, name: 'large.png' };
        const event = { target: { files: [largeFile] } };

        act(() => {
            result.current.handleFileChange(event);
        });

        expect(alertSpy).toHaveBeenCalledWith('A imagem deve ter no máximo 100KB.');
        expect(mockOnLogoChange).not.toHaveBeenCalled();
    });

    it('deve processar arquivo válido', async () => {
        const { result } = renderHook(() => useLogoUpload(mockOnLogoChange));

        const file = new File(['dummy content'], 'logo.png', { type: 'image/png' });
        const event = { target: { files: [file] } };

        // Mock FileReader
        const mockFileReader = {
            readAsDataURL: vi.fn(),
            result: 'data:image/png;base64,dummy',
            onloadend: null,
            onerror: null
        };

        // Mock constructor correctly
        const originalFileReader = window.FileReader;
        window.FileReader = function () {
            return mockFileReader;
        };

        act(() => {
            result.current.handleFileChange(event);
        });

        expect(result.current.uploading).toBe(true);
        expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);

        // Simulate reading completion
        act(() => {
            if (mockFileReader.onloadend) mockFileReader.onloadend();
        });

        expect(mockOnLogoChange).toHaveBeenCalledWith('data:image/png;base64,dummy');
        expect(result.current.uploading).toBe(false);

        window.FileReader = originalFileReader;
    });

    it('deve lidar com erro na leitura', () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
        const { result } = renderHook(() => useLogoUpload(mockOnLogoChange));

        const file = new File([''], 'logo.png');
        const event = { target: { files: [file] } };

        const mockFileReader = {
            readAsDataURL: vi.fn(),
            onloadend: null,
            onerror: null
        };

        const originalFileReader = window.FileReader;
        window.FileReader = function () {
            return mockFileReader;
        };

        act(() => {
            result.current.handleFileChange(event);
        });

        act(() => {
            if (mockFileReader.onerror) mockFileReader.onerror();
        });

        expect(alertSpy).toHaveBeenCalledWith('Erro ao ler o arquivo.');
        expect(result.current.uploading).toBe(false);
        expect(mockOnLogoChange).not.toHaveBeenCalled();

        window.FileReader = originalFileReader;
    });
});
