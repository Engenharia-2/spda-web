import React, { useState } from 'react';
import './styles.css';

const LocationButton = ({ onLocationFound }) => {
    const [loading, setLoading] = useState(false);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocalização não é suportada pelo seu navegador.');
            return;
        }

        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;

                    // Use OpenStreetMap Nominatim API (Free, needs User-Agent)
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

                    const data = await response.json();

                    // Format address
                    // Priority: Road, House Number, Suburb, City, State
                    const addr = data.address;
                    const formattedAddress = [
                        addr.road,
                        addr.house_number,
                        addr.suburb,
                        addr.city || addr.town || addr.village,
                        addr.state
                    ].filter(Boolean).join(', ');

                    onLocationFound(formattedAddress || data.display_name);

                } catch (error) {
                    console.error('Error fetching address:', error);
                    alert('Erro ao buscar endereço. Tente novamente.');
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                setLoading(false);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        alert('Permissão de localização negada.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        alert('Informações de localização indisponíveis.');
                        break;
                    case error.TIMEOUT:
                        alert('Tempo de requisição esgotado.');
                        break;
                    default:
                        alert('Ocorreu um erro desconhecido.');
                        break;
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <button
            type="button"
            onClick={handleGetLocation}
            disabled={loading}
            className="location-btn"
            title="Localização atual"
        >
            {loading ? '📍 Buscando...' : '📍 Localização Atual'}
        </button>
    );
};

export default LocationButton;
