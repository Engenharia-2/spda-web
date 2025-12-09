import React from 'react';
import './styles.css';

const DataSync = ({ syncing, syncProgress, onSyncLocalToCloud, onSyncCloudToLocal, isFreePlan }) => {
    return (
        <div className="settings-section">
            <h2 className="section-title">Sincronização de Dados</h2>
            <p className="section-description">
                Transfira seus dados entre o dispositivo e a nuvem.
            </p>
            <div className="sync-options">
                <button onClick={onSyncLocalToCloud} disabled={syncing || isFreePlan} className="sync-button">
                    <span className="sync-button-icon">☁️⬆️</span>
                    <div className="sync-button-text">
                        <div className="sync-button-title">Enviar para Nuvem (Upload) {isFreePlan && '🔒'}</div>
                        <div className="description">Copia seus relatórios locais para o servidor. (Requer Pro)</div>
                    </div>
                </button>
                <button onClick={onSyncCloudToLocal} disabled={syncing} className="sync-button">
                    <span className="sync-button-icon">💻⬇️</span>
                    <div className="sync-button-text">
                        <div className="sync-button-title">Baixar para Local (Download)</div>
                        <div className="description">Baixa seus relatórios da nuvem para este dispositivo.</div>
                    </div>
                </button>
                {syncing && <div className="sync-progress">{syncProgress}</div>}
            </div>
        </div>
    );
};

export default DataSync;
