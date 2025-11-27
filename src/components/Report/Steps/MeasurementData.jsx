import React, { useState, useRef, useEffect } from 'react';
import useMobile from '../../../hooks/useMobile';
import QRCodeScanner from './QRCodeScanner';

const MeasurementData = ({ data, updateData }) => {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [infoMessage, setInfoMessage] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [scannedGroups, setScannedGroups] = useState({});
    const scannedGroupsRef = useRef({});

    useEffect(() => {
        scannedGroupsRef.current = scannedGroups;
    }, [scannedGroups]);

    const isMobile = useMobile();

    const parseCustomFormat = (text) => {
        const headerRegex = /^G(\d+)\[(\d+)\/(\d+)\]:/;
        const match = text.match(headerRegex);
        if (!match) return null;

        const [, groupId, partIndex, totalParts] = match;
        const content = text.substring(match[0].length);

        return {
            groupId: `G${groupId}`,
            partIndex: parseInt(partIndex),
            totalParts: parseInt(totalParts),
            content
        };
    };

    const parseMeasurementPoint = (pointStr) => {
        const regex = /^P(\d+)=([\d,]+)(m?),([\d.]+)(?:,(\d{6}),(\d{4}))?/;
        const match = pointStr.match(regex);
        if (!match) return null;

        const [, pointId, resValue, resUnit, current, dateStr, timeStr] = match;

        let resistance = parseFloat(resValue.replace(',', '.'));
        if (resUnit === 'm') {
            resistance = resistance / 1000;
        }

        let dateTime = null;
        if (dateStr && timeStr) {
            const day = dateStr.substring(0, 2);
            const month = dateStr.substring(2, 4);
            const year = `20${dateStr.substring(4, 6)}`;
            const hour = timeStr.substring(0, 2);
            const minute = timeStr.substring(2, 4);
            dateTime = `${day}/${month}/${year} ${hour}:${minute}`;
        }

        return {
            ponto: parseInt(pointId),
            resistencia: resistance,
            corrente: parseFloat(current),
            dataHora: dateTime
        };
    };

    const processFullGroup = (groupId, parts) => {
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

            updateData({
                measurements: {
                    fileName: `QR Code ${groupId}`,
                    fileSize: 0,
                    parsedData: allPoints
                }
            });

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
    };

    const handleScanSuccess = (decodedText) => {
        setError(null);
        setInfoMessage(null);

        try {
            const jsonData = JSON.parse(decodedText);
            if (Array.isArray(jsonData)) {
                updateData({
                    measurements: {
                        fileName: 'QR Code Scan',
                        fileSize: decodedText.length,
                        parsedData: jsonData
                    }
                });
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
    };

    const formatUnit = (value, unit) => {
        if (value === undefined || value === null || value === '') return '-';
        if (typeof value === 'string' && isNaN(parseFloat(value))) return value;

        const num = parseFloat(value);
        if (isNaN(num)) return value;
        if (num === 0) return `0 ${unit}`;

        const absNum = Math.abs(num);

        if (absNum >= 1e6) return `${(num / 1e6).toFixed(2)} M${unit}`;
        if (absNum >= 1e3) return `${(num / 1e3).toFixed(2)} k${unit}`;
        if (absNum >= 1) return `${num.toFixed(2)} ${unit}`;
        if (absNum >= 1e-3) return `${(num * 1e3).toFixed(2)} m${unit}`;
        if (absNum >= 1e-6) return `${(num * 1e6).toFixed(2)} µ${unit}`;

        return `${num} ${unit}`;
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setProcessing(true);
        setError(null);

        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const jsonData = JSON.parse(event.target.result);

                if (!Array.isArray(jsonData)) {
                    throw new Error('O arquivo deve conter uma lista (array) de medições.');
                }

                updateData({
                    measurements: {
                        fileName: file.name,
                        fileSize: file.size,
                        parsedData: jsonData
                    }
                });
            } catch (err) {
                console.error('Error parsing JSON:', err);
                setError('Falha ao processar o arquivo JSON. Verifique o formato.');
            } finally {
                setProcessing(false);
            }
        };

        reader.onerror = () => {
            setError('Erro ao ler o arquivo.');
            setProcessing(false);
        };

        reader.readAsText(file);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div style={{
                border: '2px dashed var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-2xl)',
                textAlign: 'center',
                backgroundColor: 'var(--color-bg-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}>
                <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="json-upload"
                />
                <label htmlFor="json-upload" style={{ cursor: 'pointer', display: 'block' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📂</div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
                        Clique para fazer upload do arquivo JSON
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Formato esperado: Array de objetos com grupo (num), ponto (num), resistencia, corrente, dataHora.
                    </p>
                </label>
            </div>

            {isMobile && (
                <div
                    onClick={() => {
                        setShowScanner(true);
                        setInfoMessage(null);
                        setError(null);
                    }}
                    style={{
                        border: '2px dashed var(--color-primary)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-2xl)',
                        textAlign: 'center',
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        marginTop: 'var(--spacing-md)'
                    }}
                >
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📷</div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-xs)', color: 'var(--color-primary)' }}>
                        Clique para ler o QR Code
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Use a câmera do seu dispositivo para escanear os códigos.
                    </p>
                </div>
            )}

            {showScanner && (
                <QRCodeScanner
                    onScanSuccess={handleScanSuccess}
                    onClose={() => setShowScanner(false)}
                    feedback={infoMessage}
                />
            )}

            {processing && (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                    <p>Processando arquivo...</p>
                </div>
            )}

            {infoMessage && (
                <div style={{
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: 'var(--color-primary)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    marginTop: 'var(--spacing-sm)'
                }}>
                    {infoMessage}
                </div>
            )}

            {error && (
                <div style={{
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'rgba(248, 113, 113, 0.1)',
                    color: 'var(--color-error)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    marginTop: 'var(--spacing-sm)'
                }}>
                    {error}
                </div>
            )}

            {Object.keys(scannedGroups).length > 0 && (
                <div style={{
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    marginTop: 'var(--spacing-sm)'
                }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>Progresso de Leitura:</h4>
                    {Object.entries(scannedGroups).map(([groupId, groupData]) => (
                        <div key={groupId} style={{ fontSize: '0.875rem' }}>
                            Grupo {groupId}: {Object.keys(groupData.parts).length} de {groupData.total} partes lidas
                        </div>
                    ))}
                </div>
            )}

            {data.measurements && data.measurements.parsedData && (
                <div style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden',
                    marginTop: 'var(--spacing-lg)'
                }}>
                    <div style={{
                        padding: 'var(--spacing-md)',
                        borderBottom: '1px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Dados Importados</h3>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            {data.measurements.parsedData.length} medições
                        </span>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'var(--color-bg-tertiary)', textAlign: 'left' }}>
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>Grupo</th>
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>Ponto</th>
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>Resistência</th>
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>Corrente</th>
                                    <th style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>Data/Hora</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.measurements.parsedData.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>{item.grupo !== undefined ? item.grupo : '-'}</td>
                                        <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>{item.ponto !== undefined ? item.ponto : '-'}</td>
                                        <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontFamily: 'monospace', fontWeight: '600' }}>
                                            {formatUnit(item.resistencia, 'Ω')}
                                        </td>
                                        <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontFamily: 'monospace', fontWeight: '600' }}>
                                            {formatUnit(item.corrente, 'A')}
                                        </td>
                                        <td style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>{item.dataHora || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeasurementData;
