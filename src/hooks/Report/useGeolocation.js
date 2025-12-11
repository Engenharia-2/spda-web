import { useState } from 'react';
import {
    getCurrentPosition,
    fetchAddressFromCoords,
    formatAddress,
    getGeolocationErrorMessage,
    isGeolocationSupported
} from '../../utils/geolocationUtils';

/**
 * Custom hook for handling geolocation and address fetching
 * Manages loading and error states while orchestrating geolocation utils
 * @returns {Object} Hook interface with getLocation function and states
 */
export const useGeolocation = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Get current location and fetch formatted address
     * @returns {Promise<string|null>} Formatted address or null on error
     */
    const getLocation = async () => {
        // Check browser support
        if (!isGeolocationSupported()) {
            const errorMsg = 'Geolocalização não é suportada pelo seu navegador.';
            setError(errorMsg);
            alert(errorMsg);
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            // Get coordinates
            const coords = await getCurrentPosition();

            // Fetch address from coordinates
            const addressData = await fetchAddressFromCoords(
                coords.latitude,
                coords.longitude
            );

            // Format address for display
            const formattedAddress = formatAddress(addressData);

            return formattedAddress;

        } catch (err) {
            console.error('Geolocation error:', err);

            // Get user-friendly error message
            const errorMsg = err.code
                ? getGeolocationErrorMessage(err)
                : 'Erro ao buscar endereço. Tente novamente.';

            setError(errorMsg);
            alert(errorMsg);
            return null;

        } finally {
            setLoading(false);
        }
    };

    return {
        getLocation,
        loading,
        error
    };
};
