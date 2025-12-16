import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useQRCodeScanner from '../../../hooks/Report/useQRCodeScanner';

describe('useQRCodeScanner', () => {
    const mockOnScanComplete = vi.fn();

    beforeEach(() => {
        mockOnScanComplete.mockClear();
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('deve inicializar com estados padrão', () => {
        const { result } = renderHook(() => useQRCodeScanner({ onScanComplete: mockOnScanComplete }));

        expect(result.current.showScanner).toBe(false);
        expect(result.current.scannedGroups).toEqual({});
        expect(result.current.infoMessage).toBe(null);
        expect(result.current.error).toBe(null);
    });

    it('deve abrir e fechar o scanner', () => {
        const { result } = renderHook(() => useQRCodeScanner({ onScanComplete: mockOnScanComplete }));

        act(() => {
            result.current.startScanner();
        });
        expect(result.current.showScanner).toBe(true);

        act(() => {
            result.current.closeScanner();
        });
        expect(result.current.showScanner).toBe(false);
    });

    it('deve processar JSON direto corretamente', () => {
        const { result } = renderHook(() => useQRCodeScanner({ onScanComplete: mockOnScanComplete }));
        const jsonData = [{ ponto: 1, resistencia: 0.5 }];
        const decodedText = JSON.stringify(jsonData);

        act(() => {
            result.current.startScanner();
        });

        act(() => {
            result.current.handleScanSuccess(decodedText);
        });

        expect(mockOnScanComplete).toHaveBeenCalledWith({
            fileName: 'QR Code Scan',
            fileSize: decodedText.length,
            parsedData: jsonData
        });
        expect(result.current.showScanner).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('deve processar parte 1 de 2 de um grupo', () => {
        const { result } = renderHook(() => useQRCodeScanner({ onScanComplete: mockOnScanComplete }));
        // G1[1/2]: content...
        const decodedText = 'G1[1/2]:P1=0,5m,10;';

        act(() => {
            result.current.handleScanSuccess(decodedText);
        });

        expect(result.current.infoMessage).toContain('Qr code 1 lido com sucesso');
        expect(result.current.scannedGroups['G1']).toBeDefined();
        expect(result.current.scannedGroups['G1'].parts[1]).toBeDefined();
        expect(result.current.showScanner).toBe(false); // Default is showScanner doesn't change on partial? 
        // Checking logic: only closes on Full JSON or Full Group.
        // Wait, returning early on partial doesn't close scanner?
        // Code check: 
        // if (partsCount === totalParts) { ... setShowScanner(false); } else { ... }
        // So on partial, scanner stays open?
        // Let's verify initial state was false. If we didn't open it, it stays false.
        // If we passed startScanner(), it would be true.
    });

    it('deve completar o grupo ao ler todas as partes', () => {
        const { result } = renderHook(() => useQRCodeScanner({ onScanComplete: mockOnScanComplete }));

        act(() => {
            result.current.startScanner();
        });

        // Part 1
        act(() => {
            result.current.handleScanSuccess('G1[1/2]:P1=0,5m,10;');
        });

        expect(mockOnScanComplete).not.toHaveBeenCalled();
        expect(result.current.infoMessage).toContain('Qr code 1 lido com sucesso');

        // Part 2
        act(() => {
            result.current.handleScanSuccess('G1[2/2]:P2=0,8m,10;');
        });

        expect(mockOnScanComplete).toHaveBeenCalled();
        expect(result.current.infoMessage).toContain('Grupo G1 processado com sucesso');
        expect(result.current.showScanner).toBe(false);

        // Verify parsed data contains both points (assuming parsing logic works)
        const callArgs = mockOnScanComplete.mock.calls[0][0];
        expect(callArgs.parsedData).toHaveLength(2);
        expect(callArgs.fileName).toBe('QR Code G1');
    });

    it('deve ignorar parte duplicada', () => {
        const { result } = renderHook(() => useQRCodeScanner({ onScanComplete: mockOnScanComplete }));
        const text = 'G1[1/2]:P1=...';

        act(() => {
            result.current.handleScanSuccess(text);
        });

        act(() => {
            result.current.handleScanSuccess(text);
        });

        expect(result.current.infoMessage).toContain('já foi lida');
    });

    it('deve mostrar erro para formato desconhecido', () => {
        const { result } = renderHook(() => useQRCodeScanner({ onScanComplete: mockOnScanComplete }));

        act(() => {
            result.current.handleScanSuccess('INVALID_FORMAT_TEXT');
        });

        expect(result.current.error).toBe('Formato de QR Code não reconhecido.');
    });

    it('deve tratar erro no processamento do grupo (malformado)', () => {
        // If parsing inside processFullGroup fails
        const { result } = renderHook(() => useQRCodeScanner({ onScanComplete: mockOnScanComplete }));

        // Mock parser to throw? Or provide invalid point string that parser handles?
        // dataParsing.js parseMeasurementPoint likely returns null if regex fails, doesn't throw.
        // But useQRCodeScanner: processFullGroup calls parseMeasurementPoint. 
        // If onScanComplete mock throws?

        mockOnScanComplete.mockImplementationOnce(() => { throw new Error('Callback failed'); });

        act(() => {
            // Feed 1/1 to trigger instantaneous completion
            result.current.handleScanSuccess('G9[1/1]:bad_point_data');
        });

        // parsing might produce empty array if bad data, but callback will throw
        expect(result.current.error).toBe('Erro ao processar os dados do grupo.');
    });
});
