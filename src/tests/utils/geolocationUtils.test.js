import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isGeolocationSupported, getCurrentPosition, fetchAddressFromCoords, formatAddress, getGeolocationErrorMessage } from '../../utils/geolocationUtils';

describe('geolocationUtils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks(); // Important to restore navigator
    });

    describe('isGeolocationSupported', () => {
        it('deve retornar true se navigator.geolocation existir', () => {
            // Mock navigator with geolocation
            vi.spyOn(global, 'navigator', 'get').mockReturnValue({
                geolocation: {}
            });
            expect(isGeolocationSupported()).toBe(true);
        });

        it('deve retornar false se navigator.geolocation não existir', () => {
            // Mock navigator WITHOUT geolocation
            vi.spyOn(global, 'navigator', 'get').mockReturnValue({});
            // Now 'geolocation' in navigator should be false
            expect(isGeolocationSupported()).toBe(false);
        });
    });

    describe('getCurrentPosition', () => {
        it('deve resolver com coordenadas em caso de sucesso', async () => {
            const mockPosition = { coords: { latitude: 10, longitude: 20 } };
            const mockGeo = {
                getCurrentPosition: vi.fn((success) => success(mockPosition))
            };

            vi.spyOn(global, 'navigator', 'get').mockReturnValue({
                geolocation: mockGeo
            });

            const result = await getCurrentPosition();
            expect(result).toEqual({ latitude: 10, longitude: 20 });
        });

        it('deve rejeitar se não suportado', async () => {
            // Mock navigator WITHOUT geolocation
            vi.spyOn(global, 'navigator', 'get').mockReturnValue({});

            await expect(getCurrentPosition()).rejects.toThrow('Geolocalização não suportada');
        });

        it('deve rejeitar em caso de erro da API', async () => {
            const mockError = { code: 1, message: 'User denied' }; // GeolocationPositionError structure
            const mockGeo = {
                getCurrentPosition: vi.fn((success, error) => error(mockError))
            };
            vi.spyOn(global, 'navigator', 'get').mockReturnValue({
                geolocation: mockGeo
            });

            await expect(getCurrentPosition()).rejects.toMatchObject({ code: 1 });
        });
    });

    describe('fetchAddressFromCoords', () => {
        beforeEach(() => {
            global.fetch = vi.fn();
        });

        it('deve retornar dados em caso de sucesso', async () => {
            const mockData = { address: { city: 'City' } };
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockData)
            });

            const result = await fetchAddressFromCoords(10, 20);
            expect(result).toEqual(mockData);
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('lat=10&lon=20'), expect.anything());
        });

        it('deve lançar erro se fetch falhar', async () => {
            global.fetch.mockResolvedValue({ ok: false });
            await expect(fetchAddressFromCoords(10, 20)).rejects.toThrow('Erro ao buscar endereço');
        });
    });

    describe('formatAddress', () => {
        it('deve formatar endereço completo', () => {
            const data = {
                address: {
                    road: 'Rua A',
                    house_number: '123',
                    suburb: 'Bairro B',
                    city: 'Cidade C',
                    state: 'Estado D'
                }
            };
            expect(formatAddress(data)).toBe('Rua A, 123, Bairro B, Cidade C, Estado D');
        });

        it('deve usar display_name como fallback', () => {
            const data = {
                address: {},
                display_name: 'Full Name'
            };
            expect(formatAddress(data)).toBe('Full Name');
        });
    });

    describe('getGeolocationErrorMessage', () => {
        it('deve retornar mensagens corretas para códigos de erro', () => {
            expect(getGeolocationErrorMessage({ code: 1 })).toBe('Permissão de localização negada.');
            expect(getGeolocationErrorMessage({ code: 2 })).toBe('Informações de localização indisponíveis.');
            expect(getGeolocationErrorMessage({ code: 3 })).toBe('Tempo de requisição esgotado.');
            expect(getGeolocationErrorMessage({ code: 0 })).toBe('Ocorreu um erro desconhecido.');
        });
    });
});
