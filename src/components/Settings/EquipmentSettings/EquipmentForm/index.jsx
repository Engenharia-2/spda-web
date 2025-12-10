import React, { useState, useEffect } from 'react';

const EquipmentForm = ({
    initialData,
    onSubmit,
    onCancel
}) => {
    const defaultFormState = {
        equipmentName: '',
        serialNumber: '',
        calibrationDate: '',
        calibrationValidity: ''
    };

    const [formData, setFormData] = useState(defaultFormState);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData(defaultFormState);
        }
    }, [initialData]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

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
                            onChange={handleFormChange}
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
                            onChange={handleFormChange}
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
                            onChange={handleFormChange}
                            className="form-input"
                        />
                    </div>
                    <div className="form-field">
                        <label className="form-label">Validade do Certificado</label>
                        <input
                            type="date"
                            name="calibrationValidity"
                            value={formData.calibrationValidity}
                            onChange={handleFormChange}
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
