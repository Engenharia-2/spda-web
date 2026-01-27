import { useState, useCallback } from 'react';
import { protocolService, COMMANDS } from '../../services/ProtocolService';
import { MeasurementService } from '../../services/MeasurementService';
import { parseBinaryMeasurement, formatResistance } from '../../utils/dataParsing';

export const useMeasurementDownloader = (isConnected, sendRequest, addLog, currentUser, onDownloadComplete) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState('');
    const [displayedMeasurementData, setDisplayedMeasurementData] = useState('');
    const [downloadError, setDownloadError] = useState(null);

    const handleDownloadMeasurements = useCallback(async () => {
        if (!isConnected) return;

        setIsDownloading(true);
        setDownloadProgress('Iniciando download...');
        setDisplayedMeasurementData('');
        setDownloadError(null);

        try {
            addLog('Requisitando número de medições...', 'info');
            const countPacket = protocolService.buildResultGetCount();
            const countData = await sendRequest(countPacket, COMMANDS.RESULT_GET);
            const measCount = protocolService.parseResultGetCount(countData);
            addLog(`Total de medições disponíveis: ${measCount}`, 'success');

            if (measCount === 0) {
                setDownloadProgress('Nenhuma medição disponível.');
                setDownloadError('Nenhuma medição foi encontrada.');
                return;
            }

            let allRawData = [];
            for (let i = 1; i <= measCount; i++) {
                setDownloadProgress(`Baixando medição ${i}/${measCount}...`);
                const pktCountPacket = protocolService.buildResultGetPacketCount(i);
                const pktCountData = await sendRequest(pktCountPacket, COMMANDS.RESULT_GET);
                const packetCount = protocolService.parseResultGetPacketCount(pktCountData);
                addLog(`Medição ${i}: ${packetCount} pacotes.`, 'info');

                let measurementRawData = new Uint8Array(0);
                for (let j = 1; j <= packetCount; j++) {
                    const dataPacket = protocolService.buildResultGetData(i, j);
                    const responseData = await sendRequest(dataPacket, COMMANDS.RESULT_GET);
                    const newData = new Uint8Array(measurementRawData.length + responseData.length);
                    newData.set(measurementRawData);
                    newData.set(responseData, measurementRawData.length);
                    measurementRawData = newData;
                    await new Promise(r => setTimeout(r, 50)); // Prevent overwhelming the device
                }
                allRawData.push(measurementRawData);
            }

            const combinedData = allRawData.reduce((acc, curr) => {
                const temp = new Uint8Array(acc.length + curr.length);
                temp.set(acc);
                temp.set(curr, acc.length);
                return temp;
            }, new Uint8Array(0));

            const parsedArray = parseBinaryMeasurement(combinedData);

            if (currentUser?.uid && parsedArray.length > 0) {
                await MeasurementService.saveMeasurements(currentUser.uid, parsedArray);
                addLog(`${parsedArray.length} medições salvas com sucesso.`, 'success');
                if (onDownloadComplete) {
                    onDownloadComplete(); // Notify parent to refetch
                }
            }

            const formattedDisplay = parsedArray.map(m =>
                `G${m.group} P${m.point}: ${formatResistance(m.resistance)}, ${m.current.toFixed(4)}A [${new Date(m.timestamp).toLocaleString()}]`
            ).join('\n');
            
            setDisplayedMeasurementData(formattedDisplay || "Nenhum dado válido encontrado.");
            setDownloadProgress('Download concluído!');
            addLog('Todas as medições foram baixadas e processadas.', 'success');

        } catch (error) {
            addLog(`Erro no download: ${error.message}`, 'error');
            setDownloadProgress('Erro no download.');
            setDownloadError('Falha ao baixar medições.');
        } finally {
            setIsDownloading(false);
        }
    }, [isConnected, sendRequest, addLog, currentUser, onDownloadComplete]);

    return {
        isDownloading,
        downloadProgress,
        displayedMeasurementData,
        downloadError,
        handleDownloadMeasurements
    };
};