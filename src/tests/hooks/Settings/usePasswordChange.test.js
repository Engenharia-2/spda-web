import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Hoisted mocks
const { mockUpdateUserPassword } = vi.hoisted(() => {
    return {
        mockUpdateUserPassword: vi.fn()
    };
});

// Mock AuthService
vi.mock('../../../services/AuthService', () => ({
    AuthService: {
        updateUserPassword: mockUpdateUserPassword
    }
}));

import { usePasswordChange } from '../../../hooks/Settings/usePasswordChange';

describe('usePasswordChange', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve inicializar com valores padrão', () => {
        const { result } = renderHook(() => usePasswordChange());

        expect(result.current.newPassword).toBe('');
        expect(result.current.confirmPassword).toBe('');
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('');
        expect(result.current.success).toBe('');
    });

    it('deve atualizar os estados de senha', () => {
        const { result } = renderHook(() => usePasswordChange());

        act(() => {
            result.current.setNewPassword('newpass');
            result.current.setConfirmPassword('newpass');
        });

        expect(result.current.newPassword).toBe('newpass');
        expect(result.current.confirmPassword).toBe('newpass');
    });

    it('deve validar senhas que não coincidem', async () => {
        const { result } = renderHook(() => usePasswordChange());

        act(() => {
            result.current.setNewPassword('pass1');
            result.current.setConfirmPassword('pass2');
        });

        let success;
        await act(async () => {
            success = await result.current.handlePasswordChange();
        });

        expect(success).toBe(false);
        expect(result.current.error).toBe('As senhas não coincidem.');
        expect(mockUpdateUserPassword).not.toHaveBeenCalled();
    });

    it('deve validar senha muito curta', async () => {
        const { result } = renderHook(() => usePasswordChange());

        act(() => {
            result.current.setNewPassword('123');
            result.current.setConfirmPassword('123');
        });

        let success;
        await act(async () => {
            success = await result.current.handlePasswordChange();
        });

        expect(success).toBe(false);
        expect(result.current.error).toBe('A nova senha deve ter pelo menos 6 caracteres.');
        expect(mockUpdateUserPassword).not.toHaveBeenCalled();
    });

    it('deve alterar a senha com sucesso', async () => {
        mockUpdateUserPassword.mockResolvedValueOnce();
        const { result } = renderHook(() => usePasswordChange());

        act(() => {
            result.current.setNewPassword('password123');
            result.current.setConfirmPassword('password123');
        });

        let success;
        await act(async () => {
            success = await result.current.handlePasswordChange();
        });

        expect(success).toBe(true);
        expect(mockUpdateUserPassword).toHaveBeenCalledWith('password123');
        expect(result.current.success).toBe('Senha atualizada com sucesso!');
        expect(result.current.newPassword).toBe('');
        expect(result.current.confirmPassword).toBe('');
        expect(result.current.error).toBe('');
    });

    it('deve lidar com erro de autenticação recente', async () => {
        const error = new Error('Requires recent login');
        error.code = 'auth/requires-recent-login';
        mockUpdateUserPassword.mockRejectedValueOnce(error);

        const { result } = renderHook(() => usePasswordChange());

        act(() => {
            result.current.setNewPassword('password123');
            result.current.setConfirmPassword('password123');
        });

        let success;
        await act(async () => {
            success = await result.current.handlePasswordChange();
        });

        expect(success).toBe(false);
        expect(result.current.error).toBe('Esta operação requer um login recente. Por favor, saia e entre novamente para trocar sua senha.');
        expect(result.current.success).toBe('');
    });

    it('deve lidar com erros genéricos', async () => {
        mockUpdateUserPassword.mockRejectedValueOnce(new Error('Network Error'));
        const { result } = renderHook(() => usePasswordChange());

        act(() => {
            result.current.setNewPassword('password123');
            result.current.setConfirmPassword('password123');
        });

        let success;
        await act(async () => {
            success = await result.current.handlePasswordChange();
        });

        expect(success).toBe(false);
        expect(result.current.error).toBe('Erro ao atualizar senha: Network Error');
    });

    it('deve mostrar loading durante a operação', async () => {
        let resolvePromise;
        const promise = new Promise(resolve => { resolvePromise = resolve; });
        mockUpdateUserPassword.mockReturnValue(promise);

        const { result } = renderHook(() => usePasswordChange());

        act(() => {
            result.current.setNewPassword('password123');
            result.current.setConfirmPassword('password123');
        });

        let handlePromise;
        act(() => {
            handlePromise = result.current.handlePasswordChange();
        });

        expect(result.current.loading).toBe(true);

        await act(async () => {
            resolvePromise();
            await handlePromise;
        });

        expect(result.current.loading).toBe(false);
    });

    it('deve limpar mensagens', () => {
        const { result } = renderHook(() => usePasswordChange());

        act(() => {
            result.current.setNewPassword('1');
            result.current.setConfirmPassword('2');
        });

        act(() => {
            result.current.handlePasswordChange();
        });

        expect(result.current.error).toBeTruthy();

        act(() => {
            result.current.clearMessages();
        });

        expect(result.current.error).toBe('');
        expect(result.current.success).toBe('');
    });
});
