import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Power, PowerOff } from 'lucide-react';
import { MeasurementService } from '../../services/MeasurementService';
import { protocolService } from '../../services/ProtocolService';

// Custom Hooks
import { useLogManager } from '../../hooks/Measurement/useLogManager';
import useDeviceConnection from '../../hooks/Measurement/useDeviceConnection';
import { useFirmwareUpdater } from '../../hooks/Measurement/useFirmwareUpdater';
import { useMeasurementDownloader } from '../../hooks/Measurement/useMeasurementDownloader';

// Components
import MeasurementList from '../../components/Measurement/MeasurementList';
import DeviceIdentification from '../../components/Measurement/DeviceIdentification';
import DataDownload from '../../components/Measurement/DataDownload';
import StructuredCommand from '../../components/Measurement/StructuredCommand';
import RawHexSender from '../../components/Measurement/RawHexSender';
import FirmwareUpdate from '../../components/Measurement/FirmwareUpdate';
import LogConsole from '../../components/Measurement/LogConsole';

import './styles.css';

const DeviceManager = () => {
    const { currentUser } = useAuth();
    const [measurementData, setMeasurementData] = useState([]);

    const {
        logs,
        logsEndRef,
        addLog,
        handleClearLogs,
        handleDownloadLogs
    } = useLogManager();

    const {
        isConnected,
        isConnecting,
        deviceInfo,
        handleConnect,
        handleDisconnect,
        handleIdentify,
        sendRequest
    } = useDeviceConnection(addLog);

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

    const {
        isDownloading,
        downloadProgress,
        displayedMeasurementData,
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

    // Thin wrappers that remain in the orchestrator
    const handleSendHex = async (hexString) => {
        if (!hexString || !isConnected) return;
        const cleanHexString = hexString.replace(/\s/g, '');
        if (cleanHexString.length % 2 !== 0) {
            return addLog('Erro: Número ímpar de caracteres hexadecimais.', 'error');
        }
        const bytes = new Uint8Array(cleanHexString.length / 2);
        for (let i = 0; i < cleanHexString.length; i += 2) {
            bytes[i / 2] = parseInt(cleanHexString.substr(i, 2), 16);
        }
        try {
            await sendRequest(protocolService.buildPacket(bytes), 'RAW_HEX');
            addLog(`TX (Hex): ${hexString}`, 'tx', bytes);
        } catch (error) {
            addLog(`Erro ao enviar: ${error.message}`, 'error');
        }
    };

    const handleSendPacket = async (cmdId, cmdData) => {
        if (!cmdId || !isConnected) return;
        const command = parseInt(cmdId, 16);
        if (isNaN(command)) {
            return addLog('Erro: ID do comando inválido.', 'error');
        }
        let dataBytes = [];
        if (cmdData) {
            const hexString = cmdData.replace(/\s/g, '');
            if (hexString.length % 2 !== 0) {
                return addLog('Erro: Dados inválidos (número ímpar de caracteres hex).', 'error');
            }
            for (let i = 0; i < hexString.length; i += 2) {
                dataBytes.push(parseInt(hexString.substr(i, 2), 16));
            }
        }
        try {
            await sendRequest(protocolService.buildPacket(command, dataBytes), cmdId);
        } catch (error) {
            addLog(`Erro ao enviar pacote: ${error.message}`, 'error');
        }
    };

    return (
        <div className="measurement-page-container">
            <header className="measurement-page-header">
                <div>
                    <h1 className="page-title">Gerenciador de Dispositivos</h1>
                    <p className="page-subtitle">Conecte e gerencie equipamentos via porta serial.</p>
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
                    <DeviceIdentification
                        isConnected={isConnected}
                        handleIdentify={handleIdentify}
                    />
                    <DataDownload
                        isConnected={isConnected}
                        isDownloading={isDownloading}
                        downloadProgress={downloadProgress}
                        handleDownloadMeasurements={handleDownloadMeasurements}
                        displayedMeasurementData={displayedMeasurementData}
                    />
                    <StructuredCommand
                        isConnected={isConnected}
                        onSendPacket={handleSendPacket}
                    />
                    <RawHexSender
                        isConnected={isConnected}
                        onSendHex={handleSendHex}
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
                <LogConsole
                    logs={logs}
                    logsEndRef={logsEndRef}
                    onClearLogs={handleClearLogs}
                    onDownloadLogs={handleDownloadLogs}
                />
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
