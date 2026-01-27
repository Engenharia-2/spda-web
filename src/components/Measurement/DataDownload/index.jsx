import React from 'react';
import { Download, FileText } from 'lucide-react';
import './styles.css';

const DataDownload = ({
    isConnected,
    isDownloading,
    downloadProgress,
    handleDownloadMeasurements,
    displayedMeasurementData,
    downloadError,
}) => {
    return (
        <section className="panel-card">
            <h2 className="panel-card-title">
                <Download size={20} /> Dados
            </h2>

            <div className="download-area">
                {isDownloading && (
                    <div className="download-progress">{downloadProgress}</div>
                )}
                <label className="input-label">Medições serão armazenadas no aplicativo.</label>
            </div>

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

            {downloadError && (
                <div className="download-error-message" style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: '500' }}>
                    {downloadError}
                </div>
            )}

            <button
                onClick={handleDownloadMeasurements}
                disabled={!isConnected || isDownloading}
                className="panel-card-button secondary"
            >
                <FileText size={20} /> {isDownloading ? 'Baixando...' : 'Baixar Medições'}
            </button>

        </section>
    );
};

export default DataDownload;
