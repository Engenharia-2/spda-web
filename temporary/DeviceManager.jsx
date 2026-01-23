import React, { useState, useEffect, useRef } from 'react';
import { serialService } from '../../services/SerialService';
import { protocolService, COMMANDS, SUBCOMMANDS } from '../../services/ProtocolService';
import { Terminal, Upload, RefreshCw, Power, PowerOff, Save, Trash2, Download, FileText } from 'lucide-react';

const DeviceManager = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false); // New state for connection progress
    const [logs, setLogs] = useState([]);
    const [firmwareFile, setFirmwareFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const logsEndRef = useRef(null);

    // New state for Hex features
    const [hexInput, setHexInput] = useState('');
    const [viewMode, setViewMode] = useState('hex'); // 'ascii' | 'hex'

    // New state for Structured Command features
    const [cmdId, setCmdId] = useState('');
    const [cmdData, setCmdData] = useState('');

    // Device Info State
    const [deviceInfo, setDeviceInfo] = useState(null);

    // Download State
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState('');
    const [displayedMeasurementData, setDisplayedMeasurementData] = useState('');

    const logBuffer = useRef([]);
    const rxBuffer = useRef(new Uint8Array(0)); // Buffer for incoming data reassembly
    const connectionPromise = useRef(null); // Ref to handle connection handshake promise
    const pendingRequest = useRef(null); // Ref to handle generic request/response promises

    useEffect(() => {
        // Setup data callback
        serialService.setCallback(async (text, raw) => {
            addLog(text, 'rx', raw);

            if (raw) {
                // Append new data to buffer
                const newBuffer = new Uint8Array(rxBuffer.current.length + raw.length);
                newBuffer.set(rxBuffer.current);
                newBuffer.set(raw, rxBuffer.current.length);
                rxBuffer.current = newBuffer;

                // Try to process packets
                processBuffer();
            }
        });

        // Flush logs interval
        const interval = setInterval(() => {
            if (logBuffer.current.length > 0) {
                const logsToFlush = [...logBuffer.current];
                logBuffer.current = [];

                setLogs(prev => {
                    const newLogs = [...prev, ...logsToFlush];
                    // Keep only last 1000 logs to prevent memory issues
                    return newLogs.slice(-1000);
                });
            }
        }, 100);

        return () => {
            serialService.disconnect();
            clearInterval(interval);
        };
    }, []);

    const processBuffer = async () => {
        while (rxBuffer.current.length >= 5) { // Min packet size
            const view = new DataView(rxBuffer.current.buffer, rxBuffer.current.byteOffset, rxBuffer.current.byteLength);
            const dataSize = view.getUint16(1, true);
            const packetSize = 1 + 2 + dataSize + 2;

            if (rxBuffer.current.length >= packetSize) {
                // We have a full packet
                const packet = rxBuffer.current.slice(0, packetSize);

                if (protocolService.validatePacket(packet)) {
                    const cmd = packet[0];
                    const data = packet.slice(3, 3 + dataSize);

                    addLog(`Pacote Válido Recebido: Cmd=${cmd.toString(16).padStart(2, '0').toUpperCase()}`, 'success');

                    if (cmd === COMMANDS.ID_GET) {
                        const info = protocolService.parseDeviceInfo(data);
                        if (info) {
                            const model = protocolService.identifyDevice(info.family, info.type);
                            setDeviceInfo({ ...info, model });

                            // Handshake Verification
                            if (connectionPromise.current) {
                                if (model === 'LRM-02') {
                                    connectionPromise.current.resolve(info);
                                    addLog('Handshake com sucesso: LRM-02 Verificado', 'success');
                                } else {
                                    connectionPromise.current.reject(new Error(`Dispositivo inválido: ${model}`));
                                }
                                connectionPromise.current = null;
                            } else {
                                addLog(`Dispositivo Identificado: ${model}`, 'success');
                            }
                        }
                    } else if (cmd === COMMANDS.RESULT_GET) {
                        // Handle Result_Get responses
                        if (pendingRequest.current && pendingRequest.current.cmd === COMMANDS.RESULT_GET) {
                            pendingRequest.current.resolve(data);
                            pendingRequest.current = null;
                        }
                    }
                } else {
                    addLog('Pacote Inválido (CRC Error)', 'error');
                }

                // Remove packet from buffer
                rxBuffer.current = rxBuffer.current.slice(packetSize);
            } else {
                // Wait for more data
                break;
            }
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [logs]);

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const addLog = (message, type = 'info', rawData = null) => {
        const timestamp = new Date().toLocaleTimeString();
        logBuffer.current.push({ timestamp, message, type, rawData });
    };

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            const success = await serialService.connect();
            if (success) {
                addLog('Porta aberta. Iniciando handshake...', 'info');

                // Create Handshake Promise
                const handshake = new Promise((resolve, reject) => {
                    connectionPromise.current = { resolve, reject };
                    // Timeout after 2 seconds
                    setTimeout(() => {
                        if (connectionPromise.current) {
                            connectionPromise.current = null;
                            reject(new Error('Timeout: Sem resposta do dispositivo'));
                        }
                    }, 2000);
                });

                // Send ID_Get
                const packet = protocolService.buildPacket(COMMANDS.ID_GET, []);
                await serialService.sendBinary(packet);
                addLog('Enviando ID_Get...', 'tx', packet);

                // Wait for verification
                await handshake;

                setIsConnected(true);
                addLog('Conexão estabelecida e verificada!', 'success');
            }
        } catch (error) {
            addLog(`Erro na conexão: ${error.message}`, 'error');
            await serialService.disconnect();
            setIsConnected(false);
            setDeviceInfo(null);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await serialService.disconnect();
            setIsConnected(false);
            setDeviceInfo(null); // Clear device info
            addLog('Dispositivo desconectado', 'info');
        } catch (error) {
            addLog(`Erro ao desconectar: ${error.message}`, 'error');
        }
    };

    const handleIdentify = async () => {
        if (!isConnected) return;
        try {
            const packet = protocolService.buildPacket(COMMANDS.ID_GET, []);
            await serialService.sendBinary(packet);
            addLog('Enviando comando de identificação...', 'tx', packet);
        } catch (error) {
            addLog(`Erro ao identificar: ${error.message}`, 'error');
        }
    };

    const sendRequest = (packet, cmdId, timeoutMs = 2000) => {
        return new Promise((resolve, reject) => {
            pendingRequest.current = { cmd: cmdId, resolve, reject };

            serialService.sendBinary(packet).catch(err => {
                pendingRequest.current = null;
                reject(err);
            });

            setTimeout(() => {
                if (pendingRequest.current && pendingRequest.current.cmd === cmdId) {
                    pendingRequest.current = null;
                    reject(new Error(`Timeout aguardando resposta para comando ${cmdId.toString(16)}`));
                }
            }, timeoutMs);
        });
    };

    const handleDownloadMeasurements = async () => {
        if (!isConnected) return;
        setIsDownloading(true);
        setDownloadProgress('Iniciando download...');
        setDisplayedMeasurementData(''); // Clear previous data

        try {
            // 1. Get Measurement Count
            addLog('Requisitando número de medições...', 'info');
            const countPacket = protocolService.buildResultGetCount();
            const countData = await sendRequest(countPacket, COMMANDS.RESULT_GET);
            const measCount = protocolService.parseResultGetCount(countData);

            addLog(`Total de medições disponíveis: ${measCount}`, 'success');

            if (measCount === 0) {
                setDownloadProgress('Nenhuma medição disponível.');
                setIsDownloading(false);
                return;
            }

            // 2. Loop through measurements
            let allMeasurementData = []; // To accumulate all data for display
            for (let i = 1; i <= measCount; i++) {
                setDownloadProgress(`Baixando medição ${i}/${measCount}...`);
                // Get Packet Count for this measurement
                const pktCountPacket = protocolService.buildResultGetPacketCount(i);
                const pktCountData = await sendRequest(pktCountPacket, COMMANDS.RESULT_GET);
                const packetCount = protocolService.parseResultGetPacketCount(pktCountData);

                addLog(`Medição ${i}: ${packetCount} pacotes`, 'info');

                let measurementData = new Uint8Array(0);

                // Get Data Packets
                for (let j = 1; j <= packetCount; j++) {
                    const dataPacket = protocolService.buildResultGetData(i, j);
                    const responseData = await sendRequest(dataPacket, COMMANDS.RESULT_GET);

                    const newData = new Uint8Array(measurementData.length + responseData.length);
                    newData.set(measurementData);
                    newData.set(responseData, measurementData.length);
                    measurementData = newData;

                    // Small delay to prevent flooding
                    await new Promise(r => setTimeout(r, 50));
                }

                allMeasurementData.push(measurementData);

                // Save to file
                const blob = new Blob([measurementData], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `medicao_${i}_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
                a.click();
                URL.revokeObjectURL(url);

                addLog(`Medição ${i} salva com sucesso.`, 'success');
            }

            // After all measurements are downloaded, combine and display
            const combinedData = allMeasurementData.reduce((acc, curr) => {
                const temp = new Uint8Array(acc.length + curr.length);
                temp.set(acc);
                temp.set(curr, acc.length);
                return temp;
            }, new Uint8Array(0));

            // Convert to hex string for display
            const hexDisplay = Array.from(combinedData).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
            setDisplayedMeasurementData(hexDisplay);

            setDownloadProgress('Download concluído!');
            addLog('Todas as medições foram baixadas.', 'success');

        } catch (error) {
            addLog(`Erro no download: ${error.message}`, 'error');
            setDownloadProgress('Erro no download.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFirmwareFile(e.target.files[0]);
            addLog(`Arquivo selecionado: ${e.target.files[0].name}`, 'info');
        }
    };

    const handleFirmwareUpdate = async () => {
        if (!firmwareFile || !isConnected) return;

        setIsUploading(true);
        setUploadProgress(0);
        addLog('Iniciando atualização de firmware...', 'info');

        // Simulação de upload (já que não temos protocolo real ainda)
        const totalSize = firmwareFile.size;
        const chunkSize = 1024; // 1KB chunks
        let sent = 0;

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const buffer = new Uint8Array(e.target.result);

                // Simular envio em chunks
                for (let i = 0; i < buffer.length; i += chunkSize) {
                    const chunk = buffer.slice(i, i + chunkSize);
                    await serialService.sendBinary(chunk);

                    sent += chunk.length;
                    const progress = Math.min(100, Math.round((sent / totalSize) * 100));
                    setUploadProgress(progress);

                    // Pequeno delay para não saturar (simulação)
                    await new Promise(r => setTimeout(r, 50));
                }

                addLog('Firmware atualizado com sucesso!', 'success');
                setIsUploading(false);
                setUploadProgress(100);
            };
            reader.readAsArrayBuffer(firmwareFile);
        } catch (error) {
            addLog(`Erro na atualização: ${error.message}`, 'error');
            setIsUploading(false);
        }
    };

    const handleClearLogs = () => {
        setLogs([]);
    };

    const handleDownloadLogs = () => {
        const content = logs.map(l => {
            const msg = l.rawData && viewMode === 'hex'
                ? Array.from(l.rawData).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
                : l.message;
            return `[${l.timestamp}] [${l.type.toUpperCase()}] ${msg}`;
        }).join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `serial-logs-${new Date().toISOString()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleHexInputChange = (e) => {
        // Allow only hex characters and spaces
        const val = e.target.value.replace(/[^0-9a-fA-F\s]/g, '');
        setHexInput(val);
    };

    const handleSendHex = async () => {
        if (!hexInput || !isConnected) return;

        // Convert hex string to Uint8Array
        const hexString = hexInput.replace(/\s/g, '');
        if (hexString.length % 2 !== 0) {
            addLog('Erro: Número ímpar de caracteres hexadecimais.', 'error');
            return;
        }

        const bytes = new Uint8Array(hexString.length / 2);
        for (let i = 0; i < hexString.length; i += 2) {
            bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
        }

        if (bytes.length !== 8) {
            if (bytes.length !== 8) {
                addLog(`Aviso: Enviando ${bytes.length} bytes (esperado 8).`, 'warning');
            }
        }

        try {
            await serialService.sendBinary(bytes);
            const hexDisplay = Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
            addLog(`TX (Hex): ${hexDisplay}`, 'tx', bytes);
            // setHexInput(''); // Optional: clear input
        } catch (error) {
            addLog(`Erro ao enviar: ${error.message}`, 'error');
        }
    };

    const handleSendPacket = async () => {
        if (!cmdId || !isConnected) return;

        const command = parseInt(cmdId, 16);
        if (isNaN(command)) {
            addLog('Erro: ID do comando inválido.', 'error');
            return;
        }

        let dataBytes = [];
        if (cmdData) {
            const hexString = cmdData.replace(/\s/g, '');
            if (hexString.length % 2 !== 0) {
                addLog('Erro: Dados inválidos (número ímpar de caracteres hex).', 'error');
                return;
            }
            dataBytes = new Uint8Array(hexString.length / 2);
            for (let i = 0; i < hexString.length; i += 2) {
                dataBytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
            }
        }

        try {
            const packet = protocolService.buildPacket(command, dataBytes);
            await serialService.sendBinary(packet);

            const hexDisplay = Array.from(packet).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
            addLog(`TX (Packet): ${hexDisplay}`, 'tx', packet);
        } catch (error) {
            addLog(`Erro ao enviar pacote: ${error.message}`, 'error');
        }
    };

    const formatLogMessage = (log) => {
        if (log.type === 'rx' && log.rawData && viewMode === 'hex') {
            return Array.from(log.rawData).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
        }
        return log.message;
    };

    return (
        <div style={{ padding: 'var(--spacing-xl)' }}>
            <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>Gerenciador de Dispositivos</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Conecte e gerencie equipamentos via porta serial.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {!isConnected ? (
                        <button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            style={{
                                backgroundColor: isConnecting ? 'var(--color-bg-tertiary)' : 'var(--color-accent-primary)',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: isConnecting ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <Power size={20} /> {isConnecting ? 'Conectando...' : 'Conectar'}
                        </button>
                    ) : (
                        <button
                            onClick={handleDisconnect}
                            style={{
                                backgroundColor: 'var(--color-error)',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            <PowerOff size={20} /> Desconectar
                        </button>
                    )}
                </div>
            </div>

            {/* Device Info Card */}
            {deviceInfo && (
                <div style={{
                    marginBottom: 'var(--spacing-lg)',
                    padding: 'var(--spacing-lg)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-accent-primary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-accent-primary)', marginBottom: '0.5rem' }}>
                            {deviceInfo.model} Detectado
                        </h2>
                        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            <span><strong>Serial:</strong> {deviceInfo.serialNumber}</span>
                            <span><strong>HW Ver:</strong> {deviceInfo.hwVersion}</span>
                            <span><strong>FW Ver:</strong> {deviceInfo.fwVersion}</span>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Family: {deviceInfo.family.toString(16).padStart(4, '0')} | Type: {deviceInfo.type.toString(16).padStart(4, '0')}
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                {/* Painel de Controle (Firmware + Hex + Protocol) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>

                    {/* Identificação */}
                    <div style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        padding: 'var(--spacing-lg)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <RefreshCw size={20} /> Identificação
                        </h2>
                        <button
                            onClick={handleIdentify}
                            disabled={!isConnected}
                            style={{
                                width: '100%',
                                backgroundColor: !isConnected ? 'var(--color-bg-tertiary)' : 'var(--color-accent-primary)',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '600',
                                cursor: !isConnected ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Identificar Dispositivo (ID_Get)
                        </button>
                    </div>

                    {/* Download de Dados */}
                    <div style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        padding: 'var(--spacing-lg)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Download size={20} /> Dados
                        </h2>

                        {isDownloading && (
                            <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                {downloadProgress}
                            </div>
                        )}

                        <button
                            onClick={handleDownloadMeasurements}
                            disabled={!isConnected || isDownloading}
                            style={{
                                width: '100%',
                                backgroundColor: (!isConnected || isDownloading) ? 'var(--color-bg-tertiary)' : 'var(--color-accent-secondary)',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '600',
                                cursor: (!isConnected || isDownloading) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <FileText size={20} /> {isDownloading ? 'Baixando...' : 'Baixar Medições'}
                        </button>

                        {displayedMeasurementData && (
                            <div style={{ marginTop: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                                    Dados da Medição (Hex)
                                </label>
                                <textarea
                                    readOnly
                                    value={displayedMeasurementData}
                                    style={{
                                        width: '100%',
                                        height: '150px',
                                        padding: '0.75rem',
                                        backgroundColor: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--color-text-primary)',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.875rem',
                                        resize: 'vertical'
                                    }}
                                    title="Dados da medição recebidos do dispositivo"
                                />
                            </div>
                        )}
                    </div>

                    {/* Envio Estruturado (Protocolo) */}
                    <div style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        padding: 'var(--spacing-lg)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Terminal size={20} /> Enviar Comando Estruturado
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                                    Cmd (Hex)
                                </label>
                                <input
                                    type="text"
                                    value={cmdId}
                                    onChange={(e) => setCmdId(e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 2))}
                                    placeholder="01"
                                    maxLength={2}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        backgroundColor: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--color-text-primary)',
                                        fontFamily: 'var(--font-mono)',
                                        textAlign: 'center'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                                    Dados (Hex)
                                </label>
                                <input
                                    type="text"
                                    value={cmdData}
                                    onChange={(e) => setCmdData(e.target.value.replace(/[^0-9a-fA-F\s]/g, ''))}
                                    placeholder="AA BB CC"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        backgroundColor: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--color-text-primary)',
                                        fontFamily: 'var(--font-mono)'
                                    }}
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSendPacket}
                            disabled={!isConnected || !cmdId}
                            style={{
                                width: '100%',
                                backgroundColor: (!isConnected || !cmdId) ? 'var(--color-bg-tertiary)' : 'var(--color-accent-secondary)',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '600',
                                cursor: (!isConnected || !cmdId) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Enviar Pacote (Auto CRC)
                        </button>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                            Estrutura: Cmd (1) | Size (2) | Data (N) | CRC (2)
                        </p>
                    </div>

                    {/* Envio Hexadecimal Simples */}
                    <div style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        padding: 'var(--spacing-lg)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Terminal size={20} /> Enviar Raw Hex
                        </h2>
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={hexInput}
                                    onChange={handleHexInputChange}
                                    placeholder="00 00 00 00 00 00 00 00"
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        backgroundColor: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--color-text-primary)',
                                        fontFamily: 'var(--font-mono)'
                                    }}
                                />
                                <button
                                    onClick={handleSendHex}
                                    disabled={!isConnected || !hexInput}
                                    style={{
                                        backgroundColor: (!isConnected || !hexInput) ? 'var(--color-bg-tertiary)' : 'var(--color-accent-primary)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0 1.5rem',
                                        borderRadius: 'var(--radius-md)',
                                        fontWeight: '600',
                                        cursor: (!isConnected || !hexInput) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Enviar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Painel de Firmware */}
                    <div style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        padding: 'var(--spacing-lg)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <RefreshCw size={20} /> Atualização de Firmware
                        </h2>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Selecione o arquivo de firmware (.bin, .hex)</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="file"
                                    accept=".bin,.hex,.txt"
                                    onChange={handleFileChange}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        backgroundColor: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--color-text-primary)'
                                    }}
                                />
                            </div>
                        </div>

                        {uploadProgress > 0 && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                                    <span>Progresso</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div style={{ height: '8px', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: 'var(--color-accent-primary)', transition: 'width 0.3s ease' }}></div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleFirmwareUpdate}
                            disabled={!isConnected || !firmwareFile || isUploading}
                            style={{
                                width: '100%',
                                backgroundColor: (!isConnected || !firmwareFile || isUploading) ? 'var(--color-bg-tertiary)' : 'var(--color-success)',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '600',
                                cursor: (!isConnected || !firmwareFile || isUploading) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Upload size={20} /> {isUploading ? 'Atualizando...' : 'Iniciar Atualização'}
                        </button>
                    </div>
                </div>

                {/* Console de Logs */}
                <div style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    padding: 'var(--spacing-lg)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '600px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Terminal size={20} /> Terminal
                        </h2>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <select
                                value={viewMode}
                                onChange={(e) => setViewMode(e.target.value)}
                                style={{
                                    backgroundColor: 'var(--color-bg-tertiary)',
                                    color: 'var(--color-text-primary)',
                                    border: '1px solid var(--color-border)',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    marginRight: '0.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="ascii">ASCII</option>
                                <option value="hex">HEX</option>
                            </select>
                            <button onClick={handleDownloadLogs} title="Salvar Logs" style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><Save size={18} /></button>
                            <button onClick={handleClearLogs} title="Limpar" style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                        </div>
                    </div>

                    <div style={{
                        flex: 1,
                        backgroundColor: '#000',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        overflowY: 'auto',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.875rem',
                        color: '#0f0'
                    }}>
                        {logs.length === 0 && <span style={{ color: '#666' }}>Aguardando conexão...</span>}
                        {logs.map((log, index) => (
                            <div key={index} style={{ marginBottom: '0.25rem', color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#22c55e' : log.type === 'rx' ? '#3b82f6' : log.type === 'tx' ? '#eab308' : '#0f0' }}>
                                <span style={{ color: '#666', marginRight: '0.5rem' }}>[{log.timestamp}]</span>
                                {formatLogMessage(log)}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceManager;
