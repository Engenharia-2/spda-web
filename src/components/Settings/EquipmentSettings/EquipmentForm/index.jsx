import React from 'react';
import { useEquipmentForm } from '../../../../hooks/Settings/ReportData/useEquipmentForm';

const EquipmentForm = ({
    initialData,
    onSubmit,
    onCancel
}) => {
    const {
        formData,
        handleChange,
        handleSubmit
    } = useEquipmentForm(initialData, onSubmit);

    return (
        <div className="equipment-settings-container">
            <h2 className="section-title">{initialData ? 'Editar Equipamento' : 'Novo Equipamento'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="grid-container">
                    <div className="form-field">
                        <label className="form-label">Equipamento (Marca/Modelo)</label>
                        <input
                            type="text"
                            name="equipmentName"
                            value={formData.equipmentName}
                            onChange={handleChange}
                            placeholder="Ex: Terrômetro Digital XYZ"
                            className="form-input"
                            required
                        />
                    </div>
                    <div className="form-field">
                        <label className="form-label">Número de Série</label>
                        <input
                            type="text"
                            name="serialNumber"
                            value={formData.serialNumber}
                            onChange={handleChange}
                            placeholder="Ex: SN-123456"
                            className="form-input"
                            required
                        />
                    </div>
                </div>

                <div className="grid-container">
                    <div className="form-field">
                        <label className="form-label">Data de Calibração</label>
                        <input
                            type="date"
                            name="calibrationDate"
                            value={formData.calibrationDate}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                    <div className="form-field">
                        <label className="form-label">Validade do Certificado</label>
                        <input
                            type="date"
                            name="calibrationValidity"
                            value={formData.calibrationValidity}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="save-button" style={{ width: 'auto' }}>Salvar</button>
                    <button type="button" onClick={onCancel} className="cancel-button">Cancelar</button>
                </div>
            </form>
        </div>
    );
};

export default EquipmentForm;
