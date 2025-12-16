import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Hoisted Mocks
const { mockUseBlocker } = vi.hoisted(() => {
    return {
        mockUseBlocker: vi.fn()
    };
});

// Mock Dependencies
vi.mock('react-router-dom', () => ({
    useBlocker: mockUseBlocker
}));

import { useUnsavedChanges } from '../../../hooks/Settings/useUnsavedChanges';

describe('useUnsavedChanges', () => {
    let mockBlocker;

    beforeEach(() => {
        mockUseBlocker.mockClear();
        vi.clearAllMocks();

        // Setup default blocker state
        mockBlocker = {
            state: 'unblocked',
            proceed: vi.fn(),
            reset: vi.fn()
        };
        mockUseBlocker.mockReturnValue(mockBlocker);
    });

    it('deve registrar blocker com lógica correta', () => {
        renderHook(() => useUnsavedChanges(true));

        expect(mockUseBlocker).toHaveBeenCalledWith(expect.any(Function));

        // Testando a função de bloqueio passada para useBlocker
        const blockerFn = mockUseBlocker.mock.calls[0][0];

        // Bloqueia se dirty e caminho diferente
        expect(blockerFn({ currentLocation: { pathname: '/a' }, nextLocation: { pathname: '/b' } })).toBe(true);

        // Não bloqueia se mesmo caminho
        expect(blockerFn({ currentLocation: { pathname: '/a' }, nextLocation: { pathname: '/a' } })).toBe(false);
    });

    it('NÃO deve bloquear se não estiver dirty', () => {
        renderHook(() => useUnsavedChanges(false));

        // A função ainda é registrada, mas retornará false
        const blockerFn = mockUseBlocker.mock.calls[0][0];
        // Neste caso, o hook registra o blocker, mas a lógica interna dele verificaria 'isDirty' que é false.
        // O hook: useBlocker(({...}) => isDirty && ...)
        // A isDirty é closure.

        expect(blockerFn({ currentLocation: { pathname: '/a' }, nextLocation: { pathname: '/b' } })).toBe(false);
    });

    it('deve confirmar saída quando navegação é bloqueada (React Router)', () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        mockBlocker.state = 'blocked';

        renderHook(() => useUnsavedChanges(true));

        // UseEffect roda após render
        expect(confirmSpy).toHaveBeenCalledWith("Você tem alterações não salvas. Deseja sair sem salvar?");
        expect(mockBlocker.proceed).toHaveBeenCalled();
        expect(mockBlocker.reset).not.toHaveBeenCalled();
    });

    it('deve resetar bloqueio se usuário cancelar saída (React Router)', () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
        mockBlocker.state = 'blocked';

        renderHook(() => useUnsavedChanges(true));

        expect(confirmSpy).toHaveBeenCalled();
        expect(mockBlocker.proceed).not.toHaveBeenCalled();
        expect(mockBlocker.reset).toHaveBeenCalled();
    });

    it('deve adicionar e remover listener de beforeunload', () => {
        const addListenerSpy = vi.spyOn(window, 'addEventListener');
        const removeListenerSpy = vi.spyOn(window, 'removeEventListener');

        const { unmount } = renderHook(() => useUnsavedChanges(true));

        expect(addListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

        unmount();

        expect(removeListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    it('deve prevenir unload se estiver dirty', () => {
        let handler;
        vi.spyOn(window, 'addEventListener').mockImplementation((event, fn) => {
            if (event === 'beforeunload') handler = fn;
        });

        renderHook(() => useUnsavedChanges(true));

        const mockEvent = {
            preventDefault: vi.fn(),
            returnValue: ''
        };

        act(() => {
            handler(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockEvent.returnValue).toBe('');
    });

    it('NÃO deve prevenir unload se NÃO estiver dirty', () => {
        let handler;
        vi.spyOn(window, 'addEventListener').mockImplementation((event, fn) => {
            if (event === 'beforeunload') handler = fn;
        });

        renderHook(() => useUnsavedChanges(false));

        const mockEvent = {
            preventDefault: vi.fn(),
            returnValue: ''
        };

        act(() => {
            handler(mockEvent);
        });

        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });
});
