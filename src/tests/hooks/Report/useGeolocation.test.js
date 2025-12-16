import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGeolocation } from '../../../hooks/Report/useGeolocation';
import * as geolocationUtils from '../../../utils/geolocationUtils';

// Mock geolocationUtils
vi.mock('../../../utils/geolocationUtils', () => ({
    isGeolocationSupported: vi.fn(),
    getCurrentPosition: vi.fn(),
    fetchAddressFromCoords: vi.fn(),
    formatAddress: vi.fn(),
    getGeolocationErrorMessage: vi.fn(),
}));

describe('useGeolocation', () => {
    const mockCoords = { latitude: -23.5505, longitude: -46.6333 };
    const mockAddressData = {
        address: {
            road: 'Praça da Sé',
            house_number: 's/n',
            suburb: 'Sé',
            city: 'São Paulo',
            state: 'SP'
        },
        display_name: 'Praça da Sé, São Paulo, SP'
    };
    const mockFormattedAddress = 'Praça da Sé, s/n, Sé, São Paulo, SP';

    beforeEach(() => {
        vi.clearAllMocks();
        global.alert = vi.fn();

        // Default mock implementations
        geolocationUtils.isGeolocationSupported.mockReturnValue(true);
        geolocationUtils.getCurrentPosition.mockResolvedValue(mockCoords);
        geolocationUtils.fetchAddressFromCoords.mockResolvedValue(mockAddressData);
        geolocationUtils.formatAddress.mockReturnValue(mockFormattedAddress);
    });

    it('deve inicializar com estados padrão', () => {
        const { result } = renderHook(() => useGeolocation());

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('deve obter localização com sucesso', async () => {
        const { result } = renderHook(() => useGeolocation());

        let address;
        await act(async () => {
            address = await result.current.getLocation();
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(address).toBe(mockFormattedAddress);
        expect(geolocationUtils.getCurrentPosition).toHaveBeenCalled();
        expect(geolocationUtils.fetchAddressFromCoords).toHaveBeenCalledWith(
            mockCoords.latitude,
            mockCoords.longitude
        );
    });

    it('deve tratar navegador sem suporte a geolocalização', async () => {
        geolocationUtils.isGeolocationSupported.mockReturnValue(false);
        const alertSpy = vi.spyOn(global, 'alert');

        const { result } = renderHook(() => useGeolocation());

        let address;
        await act(async () => {
            address = await result.current.getLocation();
        });

        expect(address).toBeNull();
        expect(result.current.error).toBe('Geolocalização não é suportada pelo seu navegador.');
        expect(alertSpy).toHaveBeenCalledWith('Geolocalização não é suportada pelo seu navegador.');
        expect(geolocationUtils.getCurrentPosition).not.toHaveBeenCalled();
    });

    it('deve tratar erro ao obter coordenadas', async () => {
        const error = { code: 1, message: 'User denied Geolocation' };
        geolocationUtils.getCurrentPosition.mockRejectedValue(error);
        geolocationUtils.getGeolocationErrorMessage.mockReturnValue('Permissão de localização negada.');
        const alertSpy = vi.spyOn(global, 'alert');

        const { result } = renderHook(() => useGeolocation());

        let address;
        await act(async () => {
            address = await result.current.getLocation();
        });

        expect(address).toBeNull();
        expect(result.current.error).toBe('Permissão de localização negada.');
        expect(alertSpy).toHaveBeenCalledWith('Permissão de localização negada.');
        expect(result.current.loading).toBe(false);
    });

    it('deve tratar erro ao buscar endereço (fetchAddressFromCoords)', async () => {
        geolocationUtils.fetchAddressFromCoords.mockRejectedValue(new Error('Network error'));
        const alertSpy = vi.spyOn(global, 'alert');

        const { result } = renderHook(() => useGeolocation());

        let address;
        await act(async () => {
            address = await result.current.getLocation();
        });

        expect(address).toBeNull();
        // O hook usa error.code para getGeolocationErrorMessage ou string fixa
        expect(result.current.error).toBe('Erro ao buscar endereço. Tente novamente.');
        expect(alertSpy).toHaveBeenCalled();
        expect(result.current.loading).toBe(false);
    });

    it('deve definir loading como true durante a execução', async () => {
        // Delay resolution to check loading state
        geolocationUtils.getCurrentPosition.mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve(mockCoords), 100))
        );

        const { result } = renderHook(() => useGeolocation());

        let promise;
        act(() => {
            promise = result.current.getLocation();
        });

        expect(result.current.loading).toBe(true);

        await act(async () => {
            await promise;
        });

        expect(result.current.loading).toBe(false);
    });
});
