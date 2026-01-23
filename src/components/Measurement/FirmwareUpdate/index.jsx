import React from 'react';
import { Upload, RefreshCw } from 'lucide-react';
import './styles.css';

const FirmwareUpdate = ({
    isConnected,
    firmwareFile,
    uploadProgress,
    isUploading,
    onFileChange,
    onFirmwareUpdate
}) => {

    return (
        <section className="panel-card">
            <h2 className="panel-card-title">
                <RefreshCw size={20} /> Atualização de Firmware
            </h2>

            <div className="firmware-upload-area">
                <label className="input-label">Selecione o arquivo de firmware (.bin, .hex)</label>
                <div className="file-input-container">
                    <input
                        type="file"
                        accept=".bin,.hex,.txt"
                        onChange={onFileChange}
                        className="file-input"
                    />
                </div>
            </div>

            {uploadProgress > 0 && (
                <div className="upload-progress-container">
                    <div className="upload-progress-text">
                        <span>Progresso</span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <div className="progress-bar-background">
                        <div className="progress-bar-foreground" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                </div>
            )}

            <button
                onClick={onFirmwareUpdate}
                disabled={!isConnected || !firmwareFile || isUploading}
                className="panel-card-button success"
            >
                <Upload size={20} /> {isUploading ? 'Atualizando...' : 'Iniciar Atualização'}
            </button>
        </section>
    );
};

export default FirmwareUpdate;
