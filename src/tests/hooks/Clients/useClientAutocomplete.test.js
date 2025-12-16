import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createMockClientList } from '../../utils/testHelpers';

// Usar vi.hoisted() para criar mocks
const { mockCurrentUser, mockGetUserClients } = vi.hoisted(() => ({
    mockCurrentUser: { uid: 'user-123', email: 'test@test.com' },
    mockGetUserClients: vi.fn()
}));

// Mock modules
vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({ currentUser: mockCurrentUser })
}));

vi.mock('../../../services/ClientService', () => ({
    ClientService: {
        getUserClients: mockGetUserClients
    }
}));

// Importar o hook APÓS os mocks
import { useClientAutocomplete } from '../../../hooks/Clients/useClientAutocomplete';

describe('useClientAutocomplete', () => {
    const mockData = { client: '', clientRep: '', address: '' };
    const mockUpdateData = vi.fn();

    beforeEach(() => {
        mockGetUserClients.mockClear();
        mockUpdateData.mockClear();
    });

    describe('Estado Inicial', () => {
        it('deve inicializar com valores padrão corretos', () => {
            mockGetUserClients.mockResolvedValueOnce([]);
            const { result } = renderHook(() =>
                useClientAutocomplete(mockData, mockUpdateData)
            );

            expect(result.current.filteredClients).toEqual([]);
            expect(result.current.showSuggestions).toBe(false);
        });
    });

    describe('Fetch de Clientes', () => {
        it('deve buscar clientes ao montar com usuário autenticado', async () => {
            const mockClients = createMockClientList(3);
            mockGetUserClients.mockResolvedValueOnce(mockClients);

            renderHook(() => useClientAutocomplete(mockData, mockUpdateData));

            await waitFor(() => {
                expect(mockGetUserClients).toHaveBeenCalledWith('user-123');
            });
        });

        it('deve tratar erro ao buscar clientes silenciosamente', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            mockGetUserClients.mockRejectedValueOnce(new Error('Fetch failed'));

            renderHook(() => useClientAutocomplete(mockData, mockUpdateData));

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching clients:', expect.any(Error));
            });

            consoleErrorSpy.mockRestore();
        });
    });

    describe('Filtragem', () => {
        it('deve filtrar clientes por nome (case-insensitive)', async () => {
            const mockClients = [
                { id: '1', name: 'Empresa ABC' },
                { id: '2', name: 'Empresa XYZ' },
                { id: '3', name: 'Teste LTDA' }
            ];
            mockGetUserClients.mockResolvedValueOnce(mockClients);

            const { result, rerender } = renderHook(
                ({ data }) => useClientAutocomplete(data, mockUpdateData),
                { initialProps: { data: { client: '' } } }
            );

            await waitFor(() => {
                expect(mockGetUserClients).toHaveBeenCalled();
            });

            // Atualizar data para filtrar
            rerender({ data: { client: 'abc' } });

            await waitFor(() => {
                expect(result.current.filteredClients).toHaveLength(1);
                expect(result.current.filteredClients[0].name).toBe('Empresa ABC');
            });
        });

        it('deve retornar todos os clientes quando campo está vazio', async () => {
            const mockClients = createMockClientList(3);
            mockGetUserClients.mockResolvedValueOnce(mockClients);

            const { result } = renderHook(() =>
                useClientAutocomplete({ client: '' }, mockUpdateData)
            );

            await waitFor(() => {
                expect(result.current.filteredClients).toHaveLength(3);
            });
        });

        it('deve retornar lista vazia se nenhum cliente corresponder', async () => {
            const mockClients = createMockClientList(3);
            mockGetUserClients.mockResolvedValueOnce(mockClients);

            const { result, rerender } = renderHook(
                ({ data }) => useClientAutocomplete(data, mockUpdateData),
                { initialProps: { data: { client: '' } } }
            );

            await waitFor(() => {
                expect(mockGetUserClients).toHaveBeenCalled();
            });

            rerender({ data: { client: 'NãoExiste' } });

            await waitFor(() => {
                expect(result.current.filteredClients).toHaveLength(0);
            });
        });

        it('deve lidar com clientes sem nome definido', async () => {
            const mockClients = [
                { id: '1', name: 'Cliente Com Nome' },
                { id: '2', name: null },
                { id: '3', name: undefined }
            ];
            mockGetUserClients.mockResolvedValueOnce(mockClients);

            const { result, rerender } = renderHook(
                ({ data }) => useClientAutocomplete(data, mockUpdateData),
                { initialProps: { data: { client: 'Com' } } }
            );

            await waitFor(() => {
                expect(result.current.filteredClients).toHaveLength(1);
                expect(result.current.filteredClients[0].name).toBe('Cliente Com Nome');
            });
        });
    });

    describe('Seleção de Cliente', () => {
        it('deve preencher dados ao selecionar cliente', async () => {
            const mockClients = [
                {
                    id: '1',
                    name: 'Empresa Selecionada',
                    contactName: 'João Silva',
                    address: 'Rua Teste, 456'
                }
            ];
            mockGetUserClients.mockResolvedValueOnce(mockClients);

            const { result } = renderHook(() =>
                useClientAutocomplete(mockData, mockUpdateData)
            );

            await waitFor(() => {
                expect(mockGetUserClients).toHaveBeenCalled();
            });

            act(() => {
                result.current.handleClientSelect(mockClients[0]);
            });

            expect(mockUpdateData).toHaveBeenCalledWith({
                client: 'Empresa Selecionada',
                clientRep: 'João Silva',
                address: 'Rua Teste, 456'
            });
            expect(result.current.showSuggestions).toBe(false);
        });

        it('deve lidar com cliente sem contactName ou address', async () => {
            const mockClients = [
                {
                    id: '1',
                    name: 'Empresa Sem Dados',
                    contactName: null,
                    address: undefined
                }
            ];
            mockGetUserClients.mockResolvedValueOnce(mockClients);

            const { result } = renderHook(() =>
                useClientAutocomplete(mockData, mockUpdateData)
            );

            await waitFor(() => {
                expect(mockGetUserClients).toHaveBeenCalled();
            });

            act(() => {
                result.current.handleClientSelect(mockClients[0]);
            });

            expect(mockUpdateData).toHaveBeenCalledWith({
                client: 'Empresa Sem Dados',
                clientRep: '',
                address: ''
            });
        });

        it('deve fechar sugestões ao selecionar cliente', async () => {
            const mockClients = createMockClientList(1);
            mockGetUserClients.mockResolvedValueOnce(mockClients);

            const { result } = renderHook(() =>
                useClientAutocomplete(mockData, mockUpdateData)
            );

            await waitFor(() => {
                expect(mockGetUserClients).toHaveBeenCalled();
            });

            // Abrir sugestões primeiro
            act(() => {
                result.current.setShowSuggestions(true);
            });

            expect(result.current.showSuggestions).toBe(true);

            // Selecionar cliente
            act(() => {
                result.current.handleClientSelect(mockClients[0]);
            });

            expect(result.current.showSuggestions).toBe(false);
        });
    });

    describe('Input Change', () => {
        it('deve atualizar campo e mostrar sugestões', () => {
            mockGetUserClients.mockResolvedValueOnce([]);
            const { result } = renderHook(() =>
                useClientAutocomplete(mockData, mockUpdateData)
            );

            act(() => {
                result.current.handleClientChange({ target: { value: 'Teste' } });
            });

            expect(mockUpdateData).toHaveBeenCalledWith({ client: 'Teste' });
            expect(result.current.showSuggestions).toBe(true);
        });

        it('deve atualizar com valor vazio', () => {
            mockGetUserClients.mockResolvedValueOnce([]);
            const { result } = renderHook(() =>
                useClientAutocomplete(mockData, mockUpdateData)
            );

            act(() => {
                result.current.handleClientChange({ target: { value: '' } });
            });

            expect(mockUpdateData).toHaveBeenCalledWith({ client: '' });
            expect(result.current.showSuggestions).toBe(true);
        });
    });

    describe('Controle de Sugestões', () => {
        it('deve permitir controlar visibilidade de sugestões manualmente', () => {
            mockGetUserClients.mockResolvedValueOnce([]);
            const { result } = renderHook(() =>
                useClientAutocomplete(mockData, mockUpdateData)
            );

            expect(result.current.showSuggestions).toBe(false);

            act(() => {
                result.current.setShowSuggestions(true);
            });

            expect(result.current.showSuggestions).toBe(true);

            act(() => {
                result.current.setShowSuggestions(false);
            });

            expect(result.current.showSuggestions).toBe(false);
        });
    });
});
