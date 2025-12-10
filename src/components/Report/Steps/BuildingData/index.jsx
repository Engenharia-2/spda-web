import React from 'react';
import LocationButton from '../../../Shared/LocationButton';
import './styles.css';

const BuildingData = ({ data, updateData }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        updateData({ [name]: value });
    };

    const handleLocationFound = (address) => {
        updateData({ address });
    };

    return (
        <div className="building-data-container">
            <div className="form-field">
                <label className="form-label">Endereço Completo</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        name="address"
                        value={data.address || ''}
                        onChange={handleChange}
                        placeholder="Rua, Número, Bairro, Cidade - UF"
                        className="form-input"
                        style={{ flex: 1 }}
                    />
                    <LocationButton onLocationFound={handleLocationFound} />
                </div>
            </div>

            <div className="grid-container">
                <div className="form-field">
                    <label className="form-label">Altura da Estrutura (m)</label>
                    <input
                        type="number"
                        name="height"
                        value={data.height || ''}
                        onChange={handleChange}
                        placeholder="Ex: 15.5"
                        step="0.1"
                        className="form-input"
                    />
                </div>
                <div className="form-field">
                    <label className="form-label">Área da Edificação (m²)</label>
                    <input
                        type="number"
                        name="area"
                        value={data.area || ''}
                        onChange={handleChange}
                        placeholder="Ex: 250"
                        step="0.1"
                        className="form-input"
                    />
                </div>
            </div>

            <div className="grid-container">
                <div className="form-field">
                    <label className="form-label">Tipo de Edificação</label>
                    <select
                        name="buildingType"
                        value={data.buildingType || ''}
                        onChange={handleChange}
                        className="form-select"
                    >
                        <option value="">Selecione...</option>
                        <option value="residencial">Residencial</option>
                        <option value="comercial">Comercial</option>
                        <option value="industrial">Industrial</option>
                        <option value="hospitalar">Hospitalar</option>
                    </select>
                </div>
                <div className="form-field">
                    <label className="form-label">Informações Complementares</label>
                    <textarea
                        name="additionalInfo"
                        value={data.additionalInfo || ''}
                        onChange={handleChange}
                        placeholder="Informações adicionais sobre a edificação..."
                        className="form-textarea"
                    />
                </div>
            </div>
        </div>
    );
};

export default BuildingData;
