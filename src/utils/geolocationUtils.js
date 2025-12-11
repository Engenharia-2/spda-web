/**
 * Geolocation utility functions
 * Pure functions for handling geolocation and address fetching
 */

/**
 * Check if geolocation is supported by the browser
 * @returns {boolean} True if geolocation is supported
 */
export const isGeolocationSupported = () => {
    return 'geolocation' in navigator;
};

/**
 * Get current position coordinates
 * @param {Object} options - Geolocation options
 * @returns {Promise<{latitude: number, longitude: number}>} Coordinates
 */
export const getCurrentPosition = (options = {}) => {
    return new Promise((resolve, reject) => {
        if (!isGeolocationSupported()) {
            reject(new Error('Geolocalização não suportada'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }),
            (error) => reject(error),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                ...options
            }
        );
    });
};

/**
 * Fetch address from coordinates using OpenStreetMap Nominatim API
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<Object>} Address data from API
 */
export const fetchAddressFromCoords = async (latitude, longitude) => {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
            headers: {
                'User-Agent': 'SPDA-Web-App' // Required by OSM
            }
        }
    );

    if (!response.ok) {
        throw new Error('Erro ao buscar endereço');
    }

    return response.json();
};

/**
 * Format address data into a readable string
 * @param {Object} data - Address data from API
 * @returns {string} Formatted address string
 */
export const formatAddress = (data) => {
    const addr = data.address;
    const formattedAddress = [
        addr.road,
        addr.house_number,
        addr.suburb,
        addr.city || addr.town || addr.village,
        addr.state
    ].filter(Boolean).join(', ');

    return formattedAddress || data.display_name;
};

/**
 * Get user-friendly error message from geolocation error
 * @param {GeolocationPositionError} error - Geolocation error object
 * @returns {string} User-friendly error message
 */
export const getGeolocationErrorMessage = (error) => {
    switch (error.code) {
        case 1: // PERMISSION_DENIED
            return 'Permissão de localização negada.';
        case 2: // POSITION_UNAVAILABLE
            return 'Informações de localização indisponíveis.';
        case 3: // TIMEOUT
            return 'Tempo de requisição esgotado.';
        default:
            return 'Ocorreu um erro desconhecido.';
    }
};
