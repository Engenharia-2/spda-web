import React from 'react';
import { Download, FileText } from 'lucide-react';
import './styles.css';

const DataDownload = ({
    isConnected,
    isDownloading,
    downloadProgress,
    handleDownloadMeasurements,
    displayedMeasurementData,
}) => {
    return (
        <section className="panel-card">
            <h2 className="panel-card-title">
                <Download size={20} /> Dados
            </h2>

            {isDownloading && (
                <div className="download-progress">{downloadProgress}</div>
            )}

            <button
                onClick={handleDownloadMeasurements}
                disabled={!isConnected || isDownloading}
                className="panel-card-button secondary"
            >
                <FileText size={20} /> {isDownloading ? 'Baixando...' : 'Baixar Medições'}
            </button>

            {displayedMeasurementData && (
                <div className="processed-data-container">
                    <label className="input-label">Dados Processados (Grupo, Ponto, Resistência, Corrente, Timestamp)</label>
                    <textarea
                        readOnly
                        value={displayedMeasurementData}
                        className="text-input mono"
                        rows="5"
                        title="Dados da medição recebidos e processados"
                    />
                </div>
            )}
        </section>
    );
};

export default DataDownload;
