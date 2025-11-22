import React, { useState } from 'react';

const MeasurementData = ({ data, updateData }) => {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    const formatUnit = (value, unit) => {
        if (value === undefined || value === null || value === '') return '-';

        // If it's already a string with units, return as is
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

                // Basic validation
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

            {processing && (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                    <p>Processando arquivo...</p>
                </div>
            )}

            {error && (
                <div style={{
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'rgba(248, 113, 113, 0.1)',
                    color: 'var(--color-error)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                }}>
                    {error}
                </div>
            )}

            {data.measurements && data.measurements.parsedData && (
                <div style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden'
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
