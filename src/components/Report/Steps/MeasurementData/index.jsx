import React, { useState, useEffect } from 'react';
import useResponsive from '../../../../hooks/useResponsive';
import useQRCodeScanner from '../../../../hooks/Report/useQRCodeScanner';
import { useMeasurementData } from '../../../../hooks/Report/useMeasurementData';
import QRCodeScanner from '../QRCodeScanner';
import { useAuth } from '../../../../contexts/AuthContext';
import { MeasurementService } from '../../../../services/MeasurementService';
import './styles.css';

import MeasurementList from '../../../../components/Measurement/MeasurementList';

const MeasurementData = ({ data, updateData }) => {
    const {
        processing,
        error,
        fileInfoMessage,
        handleFileUpload
    } = useMeasurementData(updateData);

    const { currentUser } = useAuth();
    const [allMeasurements, setAllMeasurements] = useState([]);
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

    useEffect(() => {
        const fetchInitialData = async () => {
            if (currentUser) {
                try {
                    const initialData = await MeasurementService.getUserMeasurements(currentUser.uid);
                    setAllMeasurements(initialData);
                } catch (error) {
                    console.error(`Erro ao carregar medições iniciais: ${error.message}`);
                }
            }
        };
        fetchInitialData();
    }, [currentUser]);

    const handleSelectGroupForReport = (group) => {
        if (group && group.points) {
            const reportData = group.points.map(point => ({
                grupo: point.group,
                ponto: point.point,
                resistencia: point.resistance,
                corrente: point.current,
                dataHora: point.timestamp?.toDate ? point.timestamp.toDate().toLocaleString() : new Date(point.timestamp).toLocaleString()
            }));
            updateData({ measurements: { parsedData: reportData } });
        }
    };

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

            <MeasurementList 
                data={allMeasurements} 
                showTitle={false} 
                onSelectGroup={handleSelectGroupForReport}
            />
        </div>
    );
};

export default MeasurementData;
