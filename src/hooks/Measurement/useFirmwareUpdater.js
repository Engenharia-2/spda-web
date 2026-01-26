import { useState, useCallback } from 'react';
import { serialService } from '../../services/SerialService';

export const useFirmwareUpdater = (isConnected, addLog) => {
    const [firmwareFile, setFirmwareFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileChange = useCallback((e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFirmwareFile(file);
            addLog(`Arquivo selecionado: ${file.name}`, 'info');
        }
    }, [addLog]);

    const handleFirmwareUpdate = useCallback(async () => {
        if (!firmwareFile || !isConnected) return;

        setIsUploading(true);
        setUploadProgress(0);
        addLog('Iniciando atualização de firmware...', 'info');

        const totalSize = firmwareFile.size;
        const chunkSize = 1024; // 1KB chunks
        let sent = 0;

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const buffer = new Uint8Array(e.target.result);

                for (let i = 0; i < buffer.length; i += chunkSize) {
                    const chunk = buffer.slice(i, i + chunkSize);
                    await serialService.sendBinary(chunk);

                    sent += chunk.length;
                    const progress = Math.min(100, Math.round((sent / totalSize) * 100));
                    setUploadProgress(progress);

                    // A small delay to avoid overwhelming the serial buffer
                    await new Promise(r => setTimeout(r, 50));
                }

                addLog('Firmware atualizado com sucesso!', 'success');
                setUploadProgress(100);
            };
            reader.readAsArrayBuffer(firmwareFile);
        } catch (error) {
            addLog(`Erro na atualização: ${error.message}`, 'error');
        } finally {
            setIsUploading(false);
        }
    }, [firmwareFile, isConnected, addLog]);

    return {
        firmwareFile,
        isUploading,
        uploadProgress,
        handleFileChange,
        handleFirmwareUpdate
    };
};
