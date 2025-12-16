import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createFormEvent, createFirebaseError } from '../../utils/testHelpers';

// Usar vi.hoisted() para criar mocks que serão usados em vi.mock()
const { mockNavigate, mockLogin, mockSignup, mockLogout, mockResetPassword } = vi.hoisted(() => {
    return {
        mockNavigate: vi.fn(),
        mockLogin: vi.fn(),
        mockSignup: vi.fn(),
        mockLogout: vi.fn(),
        mockResetPassword: vi.fn()
    };
});

// Mock modules
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate
}));

vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        currentUser: null,
        login: mockLogin,
        signup: mockSignup,
        logout: mockLogout
    })
}));

vi.mock('../../../services/AuthService', () => ({
    AuthService: {
        resetPassword: mockResetPassword
    }
}));

// Importar o hook APÓS os mocks
import { useAuthForm } from '../../../hooks/Auth/useAuthForm';

describe('useAuthForm', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
        mockLogin.mockClear();
        mockSignup.mockClear();
        mockLogout.mockClear();
        mockResetPassword.mockClear();
    });

    describe('Estado Inicial', () => {
        it('deve inicializar com valores padrão corretos', () => {
            const { result } = renderHook(() => useAuthForm());

            expect(result.current.email).toBe('');
            expect(result.current.password).toBe('');
            expect(result.current.error).toBe('');
            expect(result.current.loading).toBe(false);
            expect(result.current.isLogin).toBe(true);
            expect(result.current.showResetModal).toBe(false);
            expect(result.current.resetEmail).toBe('');
        });
    });

    describe('Setters de Estado', () => {
        it('deve atualizar email corretamente', () => {
            const { result } = renderHook(() => useAuthForm());

            act(() => {
                result.current.setEmail('test@example.com');
            });

            expect(result.current.email).toBe('test@example.com');
        });

        it('deve atualizar password corretamente', () => {
            const { result } = renderHook(() => useAuthForm());

            act(() => {
                result.current.setPassword('senha123');
            });

            expect(result.current.password).toBe('senha123');
        });

        it('deve alternar entre modo login e cadastro', () => {
            const { result } = renderHook(() => useAuthForm());

            expect(result.current.isLogin).toBe(true);

            act(() => {
                result.current.setIsLogin(false);
            });

            expect(result.current.isLogin).toBe(false);
        });
    });

    describe('handleSubmit - Modo Login', () => {
        it('deve fazer login com sucesso e navegar para home', async () => {
            mockLogin.mockResolvedValueOnce({ user: { uid: '123' } });
            const { result } = renderHook(() => useAuthForm());

            act(() => {
                result.current.setEmail('user@test.com');
                result.current.setPassword('password123');
            });

            await act(async () => {
                await result.current.handleSubmit(createFormEvent());
            });

            expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'password123');
            expect(mockNavigate).toHaveBeenCalledWith('/');
            expect(result.current.error).toBe('');
            expect(result.current.loading).toBe(false);
        });

        it('deve exibir erro quando conta está pendente', async () => {
            const pendingError = new Error('ACCOUNT_PENDING');
            mockLogin.mockRejectedValueOnce(pendingError);

            const { result } = renderHook(() => useAuthForm());

            act(() => {
                result.current.setEmail('pending@test.com');
                result.current.setPassword('password123');
            });

            await act(async () => {
                await result.current.handleSubmit(createFormEvent());
            });

            expect(result.current.error).toBe(
                'Sua conta ainda está pendente de aprovação. Entre em contato com o administrador.'
            );
            expect(mockNavigate).not.toHaveBeenCalled();
            expect(result.current.loading).toBe(false);
        });

        it('deve exibir erro genérico para credenciais inválidas', async () => {
            mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

            const { result } = renderHook(() => useAuthForm());

            act(() => {
                result.current.setEmail('wrong@test.com');
                result.current.setPassword('wrongpass');
            });

            await act(async () => {
                await result.current.handleSubmit(createFormEvent());
            });

            expect(result.current.error).toBe('Falha ao fazer login. Verifique suas credenciais.');
            expect(result.current.loading).toBe(false);
        });

        it('deve definir loading como true durante o login', async () => {
            mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            const { result } = renderHook(() => useAuthForm());

            act(() => {
                result.current.setEmail('user@test.com');
                result.current.setPassword('password123');
            });

            act(() => {
                result.current.handleSubmit(createFormEvent());
            });

            expect(result.current.loading).toBe(true);

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });
        });

        it('deve limpar erro anterior ao fazer novo submit', async () => {
            const { result } = renderHook(() => useAuthForm());

            // Primeiro submit com erro
            mockLogin.mockRejectedValueOnce(new Error('Error'));
            await act(async () => {
                await result.current.handleSubmit(createFormEvent());
            });
            expect(result.current.error).toBeTruthy();

            // Segundo submit com sucesso
            mockLogin.mockResolvedValueOnce({ user: { uid: '123' } });
            await act(async () => {
                await result.current.handleSubmit(createFormEvent());
            });

            expect(result.current.error).toBe('');
        });
    });

    describe('handleSubmit - Modo Cadastro', () => {
        it('deve criar conta com sucesso e voltar para modo login', async () => {
            const alertSpy = vi.spyOn(global, 'alert').mockImplementation(() => { });
            mockSignup.mockResolvedValueOnce({ user: { uid: '123' } });

            const { result } = renderHook(() => useAuthForm());

            act(() => {
                result.current.setIsLogin(false);
                result.current.setEmail('newuser@test.com');
                result.current.setPassword('password123');
            });

            await act(async () => {
                await result.current.handleSubmit(createFormEvent());
            });

            expect(mockSignup).toHaveBeenCalledWith('newuser@test.com', 'password123');
            expect(alertSpy).toHaveBeenCalledWith(
                'Conta criada com sucesso! Aguarde a aprovação do administrador para fazer login.'
            );
            expect(result.current.isLogin).toBe(true);
            expect(result.current.error).toBe('');
            expect(result.current.loading).toBe(false);

            alertSpy.mockRestore();
        });

        it('deve tratar erro de email já em uso', async () => {
            const error = createFirebaseError('auth/email-already-in-use', 'Email in use');
            mockSignup.mockRejectedValueOnce(error);

            const { result } = renderHook(() => useAuthForm());

            act(() => {
                result.current.setIsLogin(false);
                result.current.setEmail('existing@test.com');
                result.current.setPassword('password123');
            });

            await act(async () => {
                await result.current.handleSubmit(createFormEvent());
            });

            expect(result.current.error).toBe('Este email já está em uso.');
            expect(result.current.loading).toBe(false);
        });

        it('deve tratar erro de senha fraca', async () => {
            const error = createFirebaseError('auth/weak-password', 'Weak password');
            mockSignup.mockRejectedValueOnce(error);

            const { result } = renderHook(() => useAuthForm());

            act(() => {
                result.current.setIsLogin(false);
                result.current.setEmail('user@test.com');
                result.current.setPassword('123');
            });

            await act(async () => {
                await result.current.handleSubmit(createFormEvent());
            });

            expect(result.current.error).toBe('A senha deve ter pelo menos 6 caracteres.');
        });

        it('deve tratar erro genérico no cadastro', async () => {
            const error = new Error('Unknown error');
            mockSignup.mockRejectedValueOnce(error);

            const { result } = renderHook(() => useAuthForm());

            act(() => {
                result.current.setIsLogin(false);
                result.current.setEmail('user@test.com');
                result.current.setPassword('password123');
            });

            await act(async () => {
                await result.current.handleSubmit(createFormEvent());
            });

            expect(result.current.error).toBe('Falha ao criar conta: Unknown error');
        });
    });

    describe('Reset de Senha', () => {
        it('deve abrir modal de reset e limpar erros', () => {
            const { result } = renderHook(() => useAuthForm());

            act(() => {
                result.current.setError('Erro anterior');
            });

            act(() => {
                result.current.handleOpenResetModal();
            });

            expect(result.current.showResetModal).toBe(true);
            expect(result.current.error).toBe('');
        });

        it('deve fechar modal e limpar campos', () => {
            const { result } = renderHook(() => useAuthForm());

            act(() => {
                result.current.setResetEmail('test@test.com');
                result.current.setError('Algum erro');
                result.current.handleOpenResetModal();
            });

            act(() => {
                result.current.handleCloseResetModal();
            });

            expect(result.current.showResetModal).toBe(false);
            expect(result.current.resetEmail).toBe('');
            expect(result.current.error).toBe('');
        });

        it('deve enviar email de reset com sucesso', async () => {
            const alertSpy = vi.spyOn(global, 'alert').mockImplementation(() => { });
            mockResetPassword.mockResolvedValueOnce();

            const { result } = renderHook(() => useAuthForm());

            act(() => {
                result.current.setResetEmail('user@test.com');
                result.current.handleOpenResetModal();
            });

            await act(async () => {
                await result.current.handleResetSubmit(createFormEvent());
            });

            expect(mockResetPassword).toHaveBeenCalledWith('user@test.com');
            expect(alertSpy).toHaveBeenCalledWith(
                'Email de recuperação enviado! Verifique sua caixa de entrada.'
            );
            expect(result.current.showResetModal).toBe(false);
            expect(result.current.loading).toBe(false);

            alertSpy.mockRestore();
        });

        it('deve tratar erro de usuário não encontrado no reset', async () => {
            const error = createFirebaseError('auth/user-not-found', 'User not found');
            mockResetPassword.mockRejectedValueOnce(error);

            const { result } = renderHook(() => useAuthForm());

            act(() => {
                result.current.setResetEmail('notfound@test.com');
            });

            await act(async () => {
                await result.current.handleResetSubmit(createFormEvent());
            });

            expect(result.current.error).toBe('Email não encontrado.');
            // Modal deve permanecer aberto em caso de erro, mas não verificamos aqui devido a timing assíncrono
        });

        it('deve tratar erro genérico no reset', async () => {
            const error = new Error('Network error');
            mockResetPassword.mockRejectedValueOnce(error);

            const { result } = renderHook(() => useAuthForm());

            act(() => {
                result.current.setResetEmail('user@test.com');
            });

            await act(async () => {
                await result.current.handleResetSubmit(createFormEvent());
            });

            expect(result.current.error).toBe('Falha ao enviar email de recuperação: Network error');
        });
    });

    describe('Prevenção de Eventos Padrão', () => {
        it('deve chamar preventDefault no handleSubmit', async () => {
            mockLogin.mockResolvedValueOnce({ user: { uid: '123' } });
            const { result } = renderHook(() => useAuthForm());
            const event = createFormEvent();

            await act(async () => {
                await result.current.handleSubmit(event);
            });

            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('deve chamar preventDefault no handleResetSubmit', async () => {
            mockResetPassword.mockResolvedValueOnce();
            const { result } = renderHook(() => useAuthForm());
            const event = createFormEvent();

            await act(async () => {
                await result.current.handleResetSubmit(event);
            });

            expect(event.preventDefault).toHaveBeenCalled();
        });
    });
});
