import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Power, PowerOff, QrCode } from 'lucide-react';

// Custom Hooks
import { useLogManager } from '../../hooks/Measurement/useLogManager';
import useDeviceConnection from '../../hooks/Measurement/useDeviceConnection';
import { useFirmwareUpdater } from '../../hooks/Measurement/useFirmwareUpdater';
import { useMeasurementDownloader } from '../../hooks/Measurement/useMeasurementDownloader';
import { useMeasurementManager } from '../../hooks/Measurement/useMeasurementManager';
import useResponsive from '../../hooks/useResponsive';
import useQRCodeScanner from '../../hooks/Report/useQRCodeScanner';

// Components
import MeasurementList from '../../components/Measurement/MeasurementList';
import DataDownload from '../../components/Measurement/DataDownload';
import FirmwareUpdate from '../../components/Measurement/FirmwareUpdate';
import QRCodeScanner from '../../components/Measurement/QRCodeScanner';

import './styles.css';

const DeviceManager = () => {
    const { currentUser } = useAuth();
    const { isMobileDevice } = useResponsive();
    const { addLog } = useLogManager();

    const { 
        measurementData, 
        fetchMeasurements, 
        saveScannedMeasurements 
    } = useMeasurementManager(currentUser, addLog);

    const handleScanComplete = async (scannedData) => {
        if (scannedData && Array.isArray(scannedData.parsedData)) {
            await saveScannedMeasurements(scannedData.parsedData);
        }
    };

    const {
        showScanner,
        infoMessage: scannerInfoMessage,
        handleScanSuccess,
        startScanner,
        closeScanner,
    } = useQRCodeScanner({ onScanComplete: handleScanComplete });

    const {
        isConnected,
        isConnecting,
        deviceInfo,
        connectionError,
        handleConnect,
        handleDisconnect,
        sendRequest
    } = useDeviceConnection(addLog);

    const {
        isDownloading,
        downloadProgress,
        downloadError,
        downloadSuccess,
        handleDownloadMeasurements
    } = useMeasurementDownloader(isConnected, sendRequest, addLog, currentUser, fetchMeasurements);
    
    const {
        firmwareFile,
        isUploading,
        uploadProgress,
        handleFileChange,
        handleFirmwareUpdate
    } = useFirmwareUpdater(isConnected, addLog);

    useEffect(() => {
        addLog("Bem-vindo ao Gerenciador de Dispositivos.", "info");
    }, [addLog]);

    return (
        <div className="measurement-page-container">
            <header className="measurement-page-header">
                <div>
                    <h1 className="page-title">Gerenciador de Dispositivos</h1>
                    <p className="page-subtitle">Conecte e gerencie equipamentos via porta serial.</p>
                </div>
                <div className="header-actions">
                    {!isMobileDevice && (
                        !isConnected ? (
                            <button onClick={handleConnect} disabled={isConnecting} className="base-button connect-button">
                                <Power size={20} /> {isConnecting ? 'Conectando...' : 'Conectar'}
                            </button>
                        ) : (
                            <button onClick={handleDisconnect} className="base-button disconnect-button">
                                <PowerOff size={20} /> Desconectar
                            </button>
                        )
                    )}
                    {isMobileDevice && (
                         <button onClick={startScanner} className="base-button qr-button-mobile">
                             Ler QR Code <QrCode size={30} />
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
                {!isMobileDevice && (
                    <div className="control-panel">
                        <DataDownload
                            isConnected={isConnected}
                            isDownloading={isDownloading}
                            downloadProgress={downloadProgress}
                            handleDownloadMeasurements={handleDownloadMeasurements}
                            downloadError={downloadError}
                            downloadSuccess={downloadSuccess}
                        />
                        <FirmwareUpdate
                            isConnected={isConnected}
                            firmwareFile={firmwareFile}
                            uploadProgress={uploadProgress}
                            isUploading={isUploading}
                            onFileChange={handleFileChange}
                            onFirmwareUpdate={handleFirmwareUpdate}
                        />
                    </div>
                )}
                {showScanner && (
                    <QRCodeScanner
                        onScanSuccess={handleScanSuccess}
                        onClose={closeScanner}
                        feedback={scannerInfoMessage}
                    />
                )}
            </main>
            <MeasurementList
                data={measurementData}
                currentUser={currentUser}
                addLog={addLog}
                onRefreshMeasurements={fetchMeasurements}
            />
        </div>
    );
};

export default DeviceManager;
