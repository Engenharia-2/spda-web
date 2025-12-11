import React from 'react';
import { useGeolocation } from '../../../hooks/Report/useGeolocation';
import './styles.css';

const LocationButton = ({ onLocationFound }) => {
    const { getLocation, loading } = useGeolocation();

    const handleClick = async () => {
        const address = await getLocation();
        if (address) {
            onLocationFound(address);
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            className="location-btn"
            title="Localização atual"
        >
            {loading ? '📍 Buscando...' : '📍 Localização Atual'}
        </button>
    );
};

export default LocationButton;
