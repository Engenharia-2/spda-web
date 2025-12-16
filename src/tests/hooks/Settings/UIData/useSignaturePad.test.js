import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useSignaturePad } from '../../../../hooks/Settings/UIData/useSignaturePad';

describe('useSignaturePad', () => {
    let mockCtx;
    let mockCanvas;

    beforeEach(() => {
        mockCtx = {
            lineWidth: 0,
            lineCap: '',
            strokeStyle: '',
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            clearRect: vi.fn()
        };

        mockCanvas = {
            getContext: vi.fn().mockReturnValue(mockCtx),
            getBoundingClientRect: vi.fn().mockReturnValue({
                left: 0, top: 0, width: 100, height: 100
            }),
            width: 100,
            height: 100
        };
    });

    // Helper to setup mock canvas ref
    const setupCanvasRef = (result) => {
        result.current.canvasRef.current = mockCanvas;
        // Trigger effect manually if needed, or re-render?
        // useSignaturePad uses useEffect to set ctx styles on mount.
        // We can mimic this by manually calling the effect logic or just assuming it works
        // if we are testing the drawing functions which get context on demand.
    };

    it('deve inicializar com isDrawing false', () => {
        const { result } = renderHook(() => useSignaturePad());
        expect(result.current.isDrawing).toBe(false);
    });

    it('deve iniciar desenho', () => {
        const { result } = renderHook(() => useSignaturePad());
        setupCanvasRef(result);

        const event = {
            type: 'mousedown',
            clientX: 10,
            clientY: 10
        };

        act(() => {
            result.current.startDrawing(event);
        });

        expect(result.current.isDrawing).toBe(true);
        expect(mockCtx.beginPath).toHaveBeenCalled();
        expect(mockCtx.moveTo).toHaveBeenCalledWith(10, 10);
    });

    it('deve desenhar quando isDrawing for true', () => {
        const { result } = renderHook(() => useSignaturePad());
        setupCanvasRef(result);

        // Start drawing first
        const startEvent = { type: 'mousedown', clientX: 10, clientY: 10 };
        act(() => {
            result.current.startDrawing(startEvent);
        });

        // Move
        const moveEvent = { type: 'mousemove', clientX: 20, clientY: 20 };
        act(() => {
            result.current.draw(moveEvent);
        });

        expect(mockCtx.lineTo).toHaveBeenCalledWith(20, 20);
        expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('não deve desenhar quando isDrawing for false', () => {
        const { result } = renderHook(() => useSignaturePad());
        setupCanvasRef(result);

        const moveEvent = { type: 'mousemove', clientX: 20, clientY: 20 };
        act(() => {
            result.current.draw(moveEvent);
        });

        expect(mockCtx.lineTo).not.toHaveBeenCalled();
        expect(mockCtx.stroke).not.toHaveBeenCalled();
    });

    it('deve parar desenho', () => {
        const { result } = renderHook(() => useSignaturePad());
        setupCanvasRef(result);

        act(() => {
            result.current.startDrawing({ type: 'mousedown', clientX: 0, clientY: 0 }); // set true
            result.current.stopDrawing();
        });

        expect(result.current.isDrawing).toBe(false);
    });

    it('deve limpar canvas', () => {
        const { result } = renderHook(() => useSignaturePad());
        setupCanvasRef(result);

        act(() => {
            result.current.clearCanvas();
        });

        expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 100, 100);
    });
});
