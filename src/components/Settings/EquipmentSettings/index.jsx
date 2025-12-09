import React from 'react';
import { useEquipmentSettings } from '../../../hooks/Settings/ReportData/useEquipmentSettings';
import './styles.css';

const EquipmentSettings = ({ hookData }) => {
    // Use hook data from props if provided, otherwise create own instance
    const ownHook = useEquipmentSettings();
    const {
        equipmentData,
        loading,
        handleChange
    } = hookData || ownHook;

    if (loading) return <div>Carregando configurações de equipamento...</div>;

    return (
        <div className="equipment-settings-container">
            <h2 className="section-title">Dados do Equipamento Padrão</h2>
            <p className="section-description">
                Defina os dados do equipamento que serão usados automaticamente nos relatórios.
            </p>

            <div className="grid-container">
                <div className="form-field">
                    <label className="form-label">Equipamento (Marca/Modelo)</label>
                    <input
                        type="text"
                        name="equipmentName"
                        value={equipmentData.equipmentName || ''}
                        onChange={handleChange}
                        placeholder="Ex: Terrômetro Digital XYZ"
                        className="form-input"
                    />
                </div>
                <div className="form-field">
                    <label className="form-label">Número de Série</label>
                    <input
                        type="text"
                        name="serialNumber"
                        value={equipmentData.serialNumber || ''}
                        onChange={handleChange}
                        placeholder="Ex: SN-123456"
                        className="form-input"
                    />
                </div>
            </div>

            <div className="grid-container">
                <div className="form-field">
                    <label className="form-label">Data de Calibração</label>
                    <input
                        type="date"
                        name="calibrationDate"
                        value={equipmentData.calibrationDate || ''}
                        onChange={handleChange}
                        className="form-input"
                    />
                </div>
                <div className="form-field">
                    <label className="form-label">Validade do Certificado</label>
                    <input
                        type="date"
                        name="calibrationValidity"
                        value={equipmentData.calibrationValidity || ''}
                        onChange={handleChange}
                        className="form-input"
                    />
                </div>
            </div>
        </div>
    );
};

export default EquipmentSettings;
