import React from 'react';
import './styles.css';

const StorageSettings = ({ storageMode, onStorageModeChange, isFreePlan }) => {
    return (
        <div className="settings-section">
            <h2 className="section-title">Armazenamento de Dados</h2>
            <p className="section-description">
                Escolha onde seus relatórios e fotos serão salvos.
            </p>
            <div className="storage-options">
                <button
                    onClick={() => onStorageModeChange('cloud')}
                    disabled={isFreePlan}
                    className={`storage-option-button ${storageMode === 'cloud' ? 'selected' : ''}`}
                >
                    <div className="storage-option-title">☁️ Nuvem (Cloud) {isFreePlan && '🔒'}</div>
                    <div className="storage-option-description">Acesse de qualquer lugar. Requer internet.</div>
                </button>
                <button
                    onClick={() => onStorageModeChange('local')}
                    className={`storage-option-button ${storageMode === 'local' ? 'selected' : ''}`}
                >
                    <div className="storage-option-title">💻 Local (Offline)</div>
                    <div className="storage-option-description">Salvo apenas neste dispositivo. Funciona sem internet.</div>
                </button>
            </div>
        </div>
    );
};

export default StorageSettings;
