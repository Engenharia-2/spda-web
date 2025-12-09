
import { useState, useRef, useEffect, useCallback } from 'react';
import { parseCustomFormat, parseMeasurementPoint } from '../../utils/dataParsing';

const useQRCodeScanner = ({ onScanComplete }) => {
    const [showScanner, setShowScanner] = useState(false);
    const [scannedGroups, setScannedGroups] = useState({});
    const [infoMessage, setInfoMessage] = useState(null);
    const [error, setError] = useState(null);
    const scannedGroupsRef = useRef({});
    const onScanCompleteRef = useRef(onScanComplete);

    useEffect(() => {
        onScanCompleteRef.current = onScanComplete;
    }, [onScanComplete]);

    useEffect(() => {
        scannedGroupsRef.current = scannedGroups;
    }, [scannedGroups]);

    const processFullGroup = useCallback((groupId, parts) => {
        try {
            const allPoints = [];
            const sortedPartIndices = Object.keys(parts).sort((a, b) => parseInt(a) - parseInt(b));

            sortedPartIndices.forEach(index => {
                const content = parts[index];
                const points = content.split(';').filter(p => p.trim());

                points.forEach(p => {
                    const parsedPoint = parseMeasurementPoint(p);
                    if (parsedPoint) {
                        parsedPoint.grupo = groupId;
                        allPoints.push(parsedPoint);
                    }
                });
            });

            if (onScanCompleteRef.current) {
                onScanCompleteRef.current({
                    fileName: `QR Code ${groupId}`,
                    fileSize: 0,
                    parsedData: allPoints
                });
            }

            setInfoMessage(`Grupo ${groupId} processado com sucesso! ${allPoints.length} medições encontradas.`);
            setScannedGroups(prev => {
                const newState = { ...prev };
                delete newState[groupId];
                return newState;
            });
            setShowScanner(false);
        } catch (err) {
            console.error('Error processing group:', err);
            setError('Erro ao processar os dados do grupo.');
        }
    }, []);

    const handleScanSuccess = useCallback((decodedText) => {
        setError(null);
        setInfoMessage(null);

        try {
            const jsonData = JSON.parse(decodedText);
            if (Array.isArray(jsonData)) {
                if (onScanCompleteRef.current) {
                    onScanCompleteRef.current({
                        fileName: 'QR Code Scan',
                        fileSize: decodedText.length,
                        parsedData: jsonData
                    });
                }
                setShowScanner(false);
                return;
            }
        } catch (e) {
            // Not JSON, continue to custom format
        }

        const customData = parseCustomFormat(decodedText);
        if (customData) {
            const { groupId, partIndex, totalParts, content } = customData;
            const currentGroups = scannedGroupsRef.current;
            const currentGroup = currentGroups[groupId] || { total: totalParts, parts: {} };

            if (currentGroup.parts[partIndex]) {
                setInfoMessage(`Parte ${partIndex}/${totalParts} do grupo ${groupId} já foi lida.`);
                return;
            }

            const newParts = { ...currentGroup.parts, [partIndex]: content };
            const partsCount = Object.keys(newParts).length;

            if (partsCount === totalParts) {
                processFullGroup(groupId, newParts);
            } else {
                setInfoMessage(`Qr code ${partIndex} lido com sucesso, aponte para o próximo`);
                setScannedGroups(prev => ({
                    ...prev,
                    [groupId]: {
                        total: totalParts,
                        parts: newParts
                    }
                }));
            }
            return;
        }

        setError('Formato de QR Code não reconhecido.');
    }, [processFullGroup]);

    const startScanner = useCallback(() => {
        setShowScanner(true);
        setInfoMessage(null);
        setError(null);
    }, []);

    const closeScanner = useCallback(() => {
        setShowScanner(false);
    }, []);

    return {
        showScanner,
        scannedGroups,
        infoMessage,
        error,
        handleScanSuccess,
        startScanner,
        closeScanner,
        scannerFeedback: infoMessage,
    };
};

export default useQRCodeScanner;
