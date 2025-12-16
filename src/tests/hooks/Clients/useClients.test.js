import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createMockClient, createMockClientList } from '../../utils/testHelpers';

// Usar vi.hoisted() para criar mocks
const { mockNavigate, mockCurrentUser, mockGetUserClients, mockGetClient, mockSaveClient, mockDeleteClient } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockCurrentUser: { uid: 'user-123', email: 'test@test.com' },
    mockGetUserClients: vi.fn(),
    mockGetClient: vi.fn(),
    mockSaveClient: vi.fn(),
    mockDeleteClient: vi.fn()
}));

// Mock modules
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate
}));

vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({ currentUser: mockCurrentUser })
}));

vi.mock('../../../services/ClientService', () => ({
    ClientService: {
        getUserClients: mockGetUserClients,
        getClient: mockGetClient,
        saveClient: mockSaveClient,
        deleteClient: mockDeleteClient
    }
}));

// Importar o hook APÓS os mocks
import { useClients } from '../../../hooks/Clients/useClients';

describe('useClients', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
        mockGetUserClients.mockClear();
        mockGetClient.mockClear();
        mockSaveClient.mockClear();
        mockDeleteClient.mockClear();
        global.alert = vi.fn();
        global.confirm = vi.fn(() => true);
    });

    describe('Estado Inicial', () => {
        it('deve inicializar com valores padrão corretos', () => {
            mockGetUserClients.mockResolvedValueOnce([]);
            const { result } = renderHook(() => useClients());

            expect(result.current.clients).toEqual([]);
            expect(result.current.listLoading).toBe(true);
            expect(result.current.searchTerm).toBe('');
            expect(result.current.formData).toEqual({
                name: '', address: '', contactName: '', email: '', phone: ''
            });
            expect(result.current.formLoading).toBe(false);
        });
    });

    describe('Fetch de Lista', () => {
        it('deve buscar clientes ao montar com usuário autenticado', async () => {
            const mockClients = createMockClientList(3);
            mockGetUserClients.mockResolvedValueOnce(mockClients);

            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(mockGetUserClients).toHaveBeenCalledWith('user-123');
                expect(result.current.clients).toEqual(mockClients);
                expect(result.current.listLoading).toBe(false);
            });
        });

        it('deve tratar erro ao buscar clientes', async () => {
            const alertSpy = vi.spyOn(global, 'alert');
            mockGetUserClients.mockRejectedValueOnce(new Error('Firestore error'));

            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(alertSpy).toHaveBeenCalledWith('Erro ao buscar clientes.');
                expect(result.current.listLoading).toBe(false);
            });
        });

        it('deve definir listLoading como true durante fetch', () => {
            mockGetUserClients.mockImplementation(() => new Promise(() => { })); // Never resolves
            const { result } = renderHook(() => useClients());

            expect(result.current.listLoading).toBe(true);
        });
    });

    describe('Fetch de Cliente Individual', () => {
        it('deve carregar cliente específico para edição', async () => {
            const mockClient = createMockClient({ id: 'client-edit', name: 'Cliente para Editar' });
            mockGetUserClients.mockResolvedValueOnce([]);
            mockGetClient.mockResolvedValueOnce(mockClient);

            const { result } = renderHook(() => useClients('client-edit'));

            await waitFor(() => {
                expect(mockGetClient).toHaveBeenCalledWith('client-edit');
                expect(result.current.formData.name).toBe('Cliente para Editar');
                expect(result.current.formLoading).toBe(false);
            });
        });

        it('não deve carregar cliente sem clientId', async () => {
            mockGetUserClients.mockResolvedValueOnce([]);

            renderHook(() => useClients());

            await waitFor(() => {
                expect(mockGetClient).not.toHaveBeenCalled();
            });
        });

        it('deve tratar erro ao carregar cliente', async () => {
            const alertSpy = vi.spyOn(global, 'alert');
            mockGetUserClients.mockResolvedValueOnce([]);
            mockGetClient.mockRejectedValueOnce(new Error('Client not found'));

            const { result } = renderHook(() => useClients('invalid-id'));

            await waitFor(() => {
                expect(alertSpy).toHaveBeenCalledWith('Erro ao carregar cliente.');
                expect(result.current.formLoading).toBe(false);
            });
        });
    });

    describe('Filtragem', () => {
        it('deve filtrar clientes por nome', async () => {
            const mockClients = [
                createMockClient({ id: '1', name: 'Empresa ABC' }),
                createMockClient({ id: '2', name: 'Empresa XYZ' }),
                createMockClient({ id: '3', name: 'Teste LTDA' })
            ];
            mockGetUserClients.mockResolvedValueOnce(mockClients);

            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(result.current.clients).toHaveLength(3);
            });

            act(() => {
                result.current.setSearchTerm('ABC');
            });

            expect(result.current.clients).toHaveLength(1);
            expect(result.current.clients[0].name).toBe('Empresa ABC');
        });

        it('deve filtrar clientes por nome do contato', async () => {
            const mockClients = [
                createMockClient({ id: '1', contactName: 'João Silva' }),
                createMockClient({ id: '2', contactName: 'Maria Santos' })
            ];
            mockGetUserClients.mockResolvedValueOnce(mockClients);

            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(result.current.clients).toHaveLength(2);
            });

            act(() => {
                result.current.setSearchTerm('maria');
            });

            expect(result.current.clients).toHaveLength(1);
            expect(result.current.clients[0].contactName).toBe('Maria Santos');
        });

        it('deve ser case-insensitive na filtragem', async () => {
            const mockClients = [
                createMockClient({ id: '1', name: 'EMPRESA MAIÚSCULA' })
            ];
            mockGetUserClients.mockResolvedValueOnce(mockClients);

            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(result.current.clients).toHaveLength(1);
            });

            act(() => {
                result.current.setSearchTerm('maiúscula');
            });

            expect(result.current.clients).toHaveLength(1);
        });

        it('deve retornar lista vazia se nenhum cliente corresponder', async () => {
            const mockClients = createMockClientList(3);
            mockGetUserClients.mockResolvedValueOnce(mockClients);

            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(result.current.clients).toHaveLength(3);
            });

            act(() => {
                result.current.setSearchTerm('NãoExiste');
            });

            expect(result.current.clients).toHaveLength(0);
        });
    });

    describe('Delete', () => {
        it('deve deletar cliente com confirmação', async () => {
            const mockClients = createMockClientList(3);
            mockGetUserClients.mockResolvedValueOnce(mockClients);
            mockDeleteClient.mockResolvedValueOnce();
            const confirmSpy = vi.spyOn(global, 'confirm').mockReturnValue(true);
            const alertSpy = vi.spyOn(global, 'alert');

            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(result.current.clients).toHaveLength(3);
            });

            await act(async () => {
                await result.current.handleDelete('client-1');
            });

            expect(confirmSpy).toHaveBeenCalledWith('Tem certeza que deseja excluir este cliente?');
            expect(mockDeleteClient).toHaveBeenCalledWith('client-1');
            expect(alertSpy).toHaveBeenCalledWith('Cliente excluído com sucesso.');
            expect(result.current.clients).toHaveLength(2);
            expect(result.current.clients.find(c => c.id === 'client-1')).toBeUndefined();
        });

        it('deve cancelar deleção se usuário não confirmar', async () => {
            const mockClients = createMockClientList(3);
            mockGetUserClients.mockResolvedValueOnce(mockClients);
            const confirmSpy = vi.spyOn(global, 'confirm').mockReturnValue(false);

            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(result.current.clients).toHaveLength(3);
            });

            await act(async () => {
                await result.current.handleDelete('client-1');
            });

            expect(confirmSpy).toHaveBeenCalled();
            expect(mockDeleteClient).not.toHaveBeenCalled();
            expect(result.current.clients).toHaveLength(3);
        });

        it('deve tratar erro ao deletar cliente', async () => {
            const mockClients = createMockClientList(3);
            mockGetUserClients.mockResolvedValueOnce(mockClients);
            mockDeleteClient.mockRejectedValueOnce(new Error('Delete failed'));
            const confirmSpy = vi.spyOn(global, 'confirm').mockReturnValue(true);
            const alertSpy = vi.spyOn(global, 'alert');

            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(result.current.clients).toHaveLength(3);
            });

            await act(async () => {
                await result.current.handleDelete('client-1');
            });

            expect(confirmSpy).toHaveBeenCalled();
            expect(mockDeleteClient).toHaveBeenCalledWith('client-1');
            expect(alertSpy).toHaveBeenCalledWith('Erro ao excluir cliente.');
            expect(result.current.clients).toHaveLength(3); // Lista não foi modificada
        });
    });

    describe('Save - Criar Novo Cliente', () => {
        it('deve criar novo cliente e navegar', async () => {
            mockGetUserClients.mockResolvedValueOnce([]);
            mockSaveClient.mockResolvedValueOnce('new-client-id');
            const alertSpy = vi.spyOn(global, 'alert');

            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(result.current.listLoading).toBe(false);
            });

            act(() => {
                result.current.setFormData({
                    name: 'Novo Cliente',
                    address: 'Rua Nova, 456',
                    contactName: 'Pedro',
                    email: 'pedro@novo.com',
                    phone: '11999999999'
                });
            });

            await act(async () => {
                await result.current.handleSave();
            });

            expect(mockSaveClient).toHaveBeenCalledWith(
                'user-123',
                expect.objectContaining({ name: 'Novo Cliente' }),
                null
            );
            expect(alertSpy).toHaveBeenCalledWith('Cliente salvo com sucesso!');
            expect(mockNavigate).toHaveBeenCalledWith('/clients');
            expect(result.current.formLoading).toBe(false);
        });

        it('deve definir formLoading durante save', async () => {
            mockGetUserClients.mockResolvedValueOnce([]);
            mockSaveClient.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(result.current.listLoading).toBe(false);
            });

            act(() => {
                result.current.setFormData({ name: 'Teste' });
            });

            act(() => {
                result.current.handleSave();
            });

            expect(result.current.formLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.formLoading).toBe(false);
            });
        });
    });

    describe('Save - Atualizar Cliente Existente', () => {
        it('deve atualizar cliente existente e navegar', async () => {
            const mockClient = createMockClient({ id: 'client-123', name: 'Cliente Original' });
            mockGetUserClients.mockResolvedValueOnce([]);
            mockGetClient.mockResolvedValueOnce(mockClient);
            mockSaveClient.mockResolvedValueOnce('client-123');
            const alertSpy = vi.spyOn(global, 'alert');

            const { result } = renderHook(() => useClients('client-123'));

            await waitFor(() => {
                expect(result.current.formData.name).toBe('Cliente Original');
            });

            act(() => {
                result.current.setFormData(prev => ({ ...prev, name: 'Nome Atualizado' }));
            });

            await act(async () => {
                await result.current.handleSave();
            });

            expect(mockSaveClient).toHaveBeenCalledWith(
                'user-123',
                expect.objectContaining({ name: 'Nome Atualizado' }),
                'client-123'
            );
            expect(alertSpy).toHaveBeenCalledWith('Cliente salvo com sucesso!');
            expect(mockNavigate).toHaveBeenCalledWith('/clients');
        });
    });

    describe('Save - Tratamento de Erros', () => {
        it('deve tratar erro ao salvar cliente', async () => {
            mockGetUserClients.mockResolvedValueOnce([]);
            mockSaveClient.mockRejectedValueOnce(new Error('Save failed'));
            const alertSpy = vi.spyOn(global, 'alert');

            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(result.current.listLoading).toBe(false);
            });

            act(() => {
                result.current.setFormData({ name: 'Teste' });
            });

            await act(async () => {
                await result.current.handleSave();
            });

            expect(alertSpy).toHaveBeenCalledWith('Erro ao salvar cliente.');
            expect(mockNavigate).not.toHaveBeenCalled();
            expect(result.current.formLoading).toBe(false);
        });
    });

    describe('Atualização de FormData', () => {
        it('deve atualizar formData corretamente', async () => {
            mockGetUserClients.mockResolvedValueOnce([]);
            const { result } = renderHook(() => useClients());

            await waitFor(() => {
                expect(result.current.listLoading).toBe(false);
            });

            act(() => {
                result.current.setFormData({
                    name: 'Empresa Teste',
                    address: 'Rua Teste, 123',
                    contactName: 'João',
                    email: 'joao@teste.com',
                    phone: '11999999999'
                });
            });

            expect(result.current.formData).toEqual({
                name: 'Empresa Teste',
                address: 'Rua Teste, 123',
                contactName: 'João',
                email: 'joao@teste.com',
                phone: '11999999999'
            });
        });
    });
});
