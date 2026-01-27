import { useState, useRef, useEffect } from 'react';
import { serialService } from '../../services/SerialService';
import { protocolService, COMMANDS } from '../../services/ProtocolService';

const useDeviceConnection = (addLog) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [connectionError, setConnectionError] = useState(null);

    const rxBuffer = useRef(new Uint8Array(0));
    const connectionPromise = useRef(null);
    const pendingRequest = useRef(null);

    useEffect(() => {
        // Setup data callback
        serialService.setCallback(async (text, raw) => {
            if (addLog) addLog(text, 'rx', raw);

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
    }, [addLog]);

    // Effect for final cleanup on unmount
    useEffect(() => {
        return () => {
            serialService.disconnect();
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

                    if (addLog) addLog(`Pacote Válido Recebido: Cmd=${cmd.toString(16).padStart(2, '0').toUpperCase()}`, 'success');

                    if (cmd === COMMANDS.ID_GET) {
                        const info = protocolService.parseDeviceInfo(data);
                        if (info) {
                            const model = protocolService.identifyDevice(info.family, info.type);
                            setDeviceInfo({ ...info, model });

                            // Handshake Verification
                            if (connectionPromise.current) {
                                if (model === 'LRM-02') {
                                    connectionPromise.current.resolve(info);
                                    if (addLog) addLog('Handshake com sucesso: LRM-02 Verificado', 'success');
                                } else {
                                    connectionPromise.current.reject(new Error(`Dispositivo inválido: ${model}`));
                                }
                                connectionPromise.current = null;
                            } else {
                                if (addLog) addLog(`Dispositivo Identificado: ${model}`, 'success');
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
                    if (addLog) addLog('Pacote Inválido (CRC Error)', 'error');
                }

                // Remove packet from buffer
                rxBuffer.current = rxBuffer.current.slice(packetSize);
            } else {
                // Wait for more data
                break;
            }
        }
    };

    const handleConnect = async () => {
        setIsConnected(false);
        setIsConnecting(true);
        setConnectionError(null);
        try {
            const success = await serialService.connect();
            if (success) {
                if (addLog) addLog('Porta aberta. Iniciando handshake...', 'info');

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
                if (addLog) addLog('Enviando ID_Get...', 'tx', packet);

                // Wait for verification
                await handshake;

                setIsConnected(true);
                if (addLog) addLog('Conexão estabelecida e verificada!', 'success');
            }
        } catch (error) {
            if (addLog) addLog(`Erro na conexão: ${error.message}`, 'error');
            await serialService.disconnect();
            setIsConnected(false);
            setDeviceInfo(null);
            setConnectionError("Falha na conexão. Verifique se o equipamento está ligado e conectado.");
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await serialService.disconnect();
            setIsConnected(false);
            setDeviceInfo(null);
            setConnectionError(null);
            if (addLog) addLog('Dispositivo desconectado', 'info');
        } catch (error) {
            if (addLog) addLog(`Erro ao desconectar: ${error.message}`, 'error');
        }
    };

    const handleIdentify = async () => {
        if (!isConnected) return;
        try {
            const packet = protocolService.buildPacket(COMMANDS.ID_GET, []);
            await serialService.sendBinary(packet);
            if (addLog) addLog('Enviando comando de identificação...', 'tx', packet);
        } catch (error) {
            if (addLog) addLog(`Erro ao identificar: ${error.message}`, 'error');
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

    return {
        isConnected,
        isConnecting,
        deviceInfo,
        connectionError,
        handleConnect,
        handleDisconnect,
        handleIdentify,
        sendRequest,
        setDeviceInfo
    };
};

export default useDeviceConnection;
