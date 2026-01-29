import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Power, PowerOff } from 'lucide-react';

// Custom Hooks
import { useLogManager } from '../../hooks/Measurement/useLogManager';
import useDeviceConnection from '../../hooks/Measurement/useDeviceConnection';
import { useFirmwareUpdater } from '../../hooks/Measurement/useFirmwareUpdater';

// Components
import FirmwareUpdate from '../../components/Measurement/FirmwareUpdate';

import './styles.css';

const UpdatesPage = () => {
    const { addLog } = useLogManager();

    const {
        isConnected,
        isConnecting,
        deviceInfo,
        connectionError,
        handleConnect,
        handleDisconnect
    } = useDeviceConnection(addLog);
    
    const {
        firmwareFile,
        isUploading,
        uploadProgress,
        handleFileChange,
        handleFirmwareUpdate
    } = useFirmwareUpdater(isConnected, addLog);

    useEffect(() => {
        addLog("Página de Atualizações iniciada.", "info");
    }, [addLog]);

    return (
        <div className="measurement-page-container">
            <header className="measurement-page-header">
                <div>
                    <h1 className="page-title">Atualizações de Firmware</h1>
                    <p className="page-subtitle">Conecte o equipamento para realizar atualizações.</p>
                </div>
                <div className="header-actions">
                    {!isConnected ? (
                        <button onClick={handleConnect} disabled={isConnecting} className="base-button connect-button">
                            <Power size={20} /> {isConnecting ? 'Conectando...' : 'Conectar'}
                        </button>
                    ) : (
                        <button onClick={handleDisconnect} className="base-button disconnect-button">
                            <PowerOff size={20} /> Desconectar
                        </button>
                    )}
                </div>
            </header>

            {connectionError && !isConnected && (
                <section className="device-info-card error">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h2 className="device-info-model" style={{ color: 'var(--color-error)' }}>Erro de Conexão</h2>
                        <span style={{ color: 'var(--color-text-secondary)' }}>{connectionError}</span>
                    </div>
                </section>
            )}

            {deviceInfo && (
                <section className="device-info-card">
                    <div>
                        <h2 className="device-info-model">{deviceInfo.model} Detectado</h2>
                        <div className="device-info-details">
                            <span><strong>Serial:</strong> {deviceInfo.serialNumber}</span>
                            <span><strong>HW Ver:</strong> {deviceInfo.hwVersion}</span>
                            <span><strong>FW Ver:</strong> {deviceInfo.fwVersion}</span>
                        </div>
                    </div>
                    <div className="device-info-ids">
                        Family: {deviceInfo.family.toString(16).padStart(4, '0')} | Type: {deviceInfo.type.toString(16).padStart(4, '0')}
                    </div>
                </section>
            )}
            
            <main className="main-content-grid">
                <div className="control-panel">
                    <FirmwareUpdate
                        isConnected={isConnected}
                        firmwareFile={firmwareFile}
                        uploadProgress={uploadProgress}
                        isUploading={isUploading}
                        onFileChange={handleFileChange}
                        onFirmwareUpdate={handleFirmwareUpdate}
                    />
                </div>
            </main>
        </div>
    );
};

export default UpdatesPage;
