import { useCallback } from 'react';
import { protocolService, COMMANDS } from '../../services/ProtocolService'; // Assuming COMMANDS is also used here

export const useCommandSender = (isConnected, sendRequest, addLog) => {

    const sendHex = useCallback(async (hexString) => {
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
            // Assuming protocolService.buildPacket can handle raw bytes for RAW_HEX
            await sendRequest(protocolService.buildPacket(bytes), 'RAW_HEX');
            addLog(`TX (Hex): ${hexString}`, 'tx', bytes);
        } catch (error) {
            addLog(`Erro ao enviar: ${error.message}`, 'error');
        }
    }, [isConnected, sendRequest, addLog]);

    const sendPacket = useCallback(async (cmdId, cmdData) => {
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
    }, [isConnected, sendRequest, addLog]);

    return {
        sendHex,
        sendPacket
    };
};
