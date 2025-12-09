import React from 'react';
import useResponsive from '../../../../hooks/useResponsive';
import useQRCodeScanner from '../../../../hooks/Report/useQRCodeScanner';
import { useMeasurementData } from '../../../../hooks/Report/useMeasurementData';
import QRCodeScanner from '../QRCodeScanner';
import { formatUnit } from '../../../../utils/formatters';
import './styles.css';

const MeasurementData = ({ data, updateData }) => {
    const {
        processing,
        error,
        fileInfoMessage,
        handleFileUpload
    } = useMeasurementData(updateData);

    const { isMobileDevice } = useResponsive();

    const {
        showScanner,
        scannedGroups,
        infoMessage: scannerInfoMessage,
        error: scannerError,
        handleScanSuccess,
        startScanner,
        closeScanner,
    } = useQRCodeScanner({ onScanComplete: (scannedData) => updateData({ measurements: scannedData }) });

    return (
        <div className="measurement-data-container">
            <div className="file-upload-area">
                <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="json-upload"
                />
                <label htmlFor="json-upload" className="file-upload-label">
                    <div className="file-upload-icon">📂</div>
                    <h3 className="file-upload-title">
                        Clique para fazer upload do arquivo JSON
                    </h3>
                    <p className="file-upload-description">
                        Formato esperado: Array de objetos com grupo (num), ponto (num), resistencia, corrente, dataHora.
                    </p>
                </label>
            </div>

            {isMobileDevice && (
                <div
                    onClick={startScanner}
                    className="qr-code-area"
                >
                    <div className="qr-code-icon">📷</div>
                    <h3 className="qr-code-title">
                        Clique para ler o QR Code
                    </h3>
                    <p className="file-upload-description">
                        Use a câmera do seu dispositivo para escanear os códigos.
                    </p>
                </div>
            )}

            {showScanner && (
                <QRCodeScanner
                    onScanSuccess={handleScanSuccess}
                    onClose={closeScanner}
                    feedback={scannerInfoMessage}
                />
            )}

            {processing && (
                <div className="processing-message">
                    <p>Processando arquivo...</p>
                </div>
            )}

            {(fileInfoMessage || scannerInfoMessage) && (
                <div className="info-message">
                    {fileInfoMessage || scannerInfoMessage}
                </div>
            )}

            {(error || scannerError) && (
                <div className="error-message">
                    {error || scannerError}
                </div>
            )}

            {Object.keys(scannedGroups).length > 0 && (
                <div className="scan-progress-container">
                    <h4 className="scan-progress-title">Progresso de Leitura:</h4>
                    {Object.entries(scannedGroups).map(([groupId, groupData]) => (
                        <div key={groupId} className="scan-progress-item">
                            Grupo {groupId}: {Object.keys(groupData.parts).length} de {groupData.total} partes lidas
                        </div>
                    ))}
                </div>
            )}

            {data.measurements && data.measurements.parsedData && (
                <div className="imported-data-container">
                    <div className="imported-data-header">
                        <h3 className="imported-data-title">Dados Importados</h3>
                        <span className="imported-data-count">
                            {data.measurements.parsedData.length} medições
                        </span>
                    </div>

                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr className="data-table-header">
                                    <th className="data-table-header-cell">Grupo</th>
                                    <th className="data-table-header-cell">Ponto</th>
                                    <th className="data-table-header-cell">Resistência</th>
                                    <th className="data-table-header-cell">Corrente</th>
                                    <th className="data-table-header-cell">Data/Hora</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.measurements.parsedData.map((item, index) => (
                                    <tr key={index} className="data-table-row">
                                        <td className="data-table-cell">{item.grupo !== undefined ? item.grupo : '-'}</td>
                                        <td className="data-table-cell">{item.ponto !== undefined ? item.ponto : '-'}</td>
                                        <td className="data-table-cell monospace-font">
                                            {formatUnit(item.resistencia, 'Ω')}
                                        </td>
                                        <td className="data-table-cell monospace-font">
                                            {formatUnit(item.corrente, 'A')}
                                        </td>
                                        <td className="data-table-cell">{item.dataHora || '-'}</td>
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
