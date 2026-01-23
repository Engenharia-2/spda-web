import React from 'react';
import { RefreshCw } from 'lucide-react';
import './styles.css';

const DeviceIdentification = ({ isConnected, handleIdentify }) => {
    return (
        <section className="panel-card">
            <h2 className="panel-card-title">
                <RefreshCw size={20} /> Identificação
            </h2>
            <button
                onClick={handleIdentify}
                disabled={!isConnected}
                className="panel-card-button primary"
            >
                Identificar Dispositivo (ID_Get)
            </button>
        </section>
    );
};

export default DeviceIdentification;
