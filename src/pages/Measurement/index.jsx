import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Power, PowerOff, QrCode } from 'lucide-react';
import { MeasurementService } from '../../services/MeasurementService';

// Custom Hooks
import { useLogManager } from '../../hooks/Measurement/useLogManager';
import useDeviceConnection from '../../hooks/Measurement/useDeviceConnection';
import { useFirmwareUpdater } from '../../hooks/Measurement/useFirmwareUpdater';
import { useMeasurementDownloader } from '../../hooks/Measurement/useMeasurementDownloader';
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
    const [measurementData, setMeasurementData] = useState([]);
    const { isMobileDevice } = useResponsive();

    const {
        addLog,
    } = useLogManager();

    const fetchMeasurements = useCallback(async () => {
        if (currentUser) {
            try {
                const data = await MeasurementService.getUserMeasurements(currentUser.uid);
                setMeasurementData(data);
                // We don't log here anymore to avoid spamming on every fetch
            } catch (error) {
                addLog(`Erro ao carregar medições: ${error.message}`, 'error');
            }
        }
    }, [currentUser, addLog]);

    const handleScanComplete = async (scannedData) => {
        if (scannedData && Array.isArray(scannedData.parsedData)) {
            try {
                // Adapt QR code data format to standard storage format
                const formattedData = scannedData.parsedData.map(item => {
                    // Extract group number from "G1" or "1"
                    let groupNum = 0;
                    if (item.grupo) {
                         const groupStr = String(item.grupo);
                         // Remove non-numeric characters (like 'G') to safely get the number
                         const numericPart = groupStr.replace(/\D/g, ''); 
                         groupNum = parseInt(numericPart, 10) || 0;
                    }

                    // Parse timestamp from "DD/MM/YYYY HH:mm"
                    let timestamp = null;
                    if (item.dataHora) {
                        // Assuming format DD/MM/YYYY HH:mm
                        const parts = String(item.dataHora).match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
                        if (parts) {
                            // new Date(year, monthIndex, day, hours, minutes)
                            timestamp = new Date(parts[3], parts[2] - 1, parts[1], parts[4], parts[5]);
                        }
                    }

                    return {
                        group: groupNum,
                        point: Number(item.ponto) || 0,
                        resistance: Number(item.resistencia) || 0,
                        current: Number(item.corrente) || 0,
                        timestamp: timestamp
                    };
                });

                if (formattedData.length > 0) {
                    await MeasurementService.saveMeasurements(currentUser.uid, formattedData);
                    addLog(`Medições do QR Code salvas com sucesso.`, 'success');
                    await fetchMeasurements();
                }
            } catch (error) {
                addLog(`Erro ao salvar medições do QR Code: ${error.message}`, 'error');
            }
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
        displayedMeasurementData,
        downloadError,
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
        fetchMeasurements();
    }, [fetchMeasurements, addLog]);

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
                            displayedMeasurementData={displayedMeasurementData}
                            downloadError={downloadError}
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
