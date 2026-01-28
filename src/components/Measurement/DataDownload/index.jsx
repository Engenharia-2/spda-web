import React from 'react';
import { Download, FileText, CheckCircle } from 'lucide-react';
import './styles.css';

const DataDownload = ({
    isConnected,
    isDownloading,
    downloadProgress,
    handleDownloadMeasurements,
    downloadError,
    downloadSuccess,
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

            {downloadError && (
                <div className="download-error-message" style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: '500' }}>
                    {downloadError}
                </div>
            )}

            <button
                onClick={handleDownloadMeasurements}
                disabled={!isConnected || isDownloading}
                className={`panel-card-button ${downloadSuccess ? 'success' : 'secondary'}`}
            >
                {downloadSuccess ? (
                    <><CheckCircle size={20} /> Medições baixadas</>
                ) : (
                    <><FileText size={20} /> {isDownloading ? 'Baixando...' : 'Baixar Medições'}</>
                )}
            </button>

        </section>
    );
};

export default DataDownload;
