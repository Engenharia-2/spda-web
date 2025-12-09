import React from 'react';
import { useEquipmentSettings } from '../../../hooks/Settings/ReportData/useEquipmentSettings';
import { useTheme } from '../../../contexts/ThemeContext/ThemeContext';
import './styles.css';

const EquipmentSettings = ({ hookData }) => {
    const ownHook = useEquipmentSettings();
    const { theme } = useTheme();
    const {
        equipmentList,
        loading,
        handleAdd,
        handleUpdate,
        handleDelete,
        handleSetDefault
    } = hookData || ownHook;

    const [isEditing, setIsEditing] = React.useState(false);
    const [currentEquipment, setCurrentEquipment] = React.useState(null);

    // ... (rest of form logic same as before)
    const initialFormState = {
        equipmentName: '',
        serialNumber: '',
        calibrationDate: '',
        calibrationValidity: ''
    };

    const [formData, setFormData] = React.useState(initialFormState);

    const openForm = (equipment = null) => {
        if (equipment) {
            setFormData(equipment);
            setCurrentEquipment(equipment);
        } else {
            setFormData(initialFormState);
            setCurrentEquipment(null);
        }
        setIsEditing(true);
    };

    const closeForm = () => {
        setIsEditing(false);
        setFormData(initialFormState);
        setCurrentEquipment(null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (currentEquipment) {
            handleUpdate(currentEquipment.id, formData);
        } else {
            handleAdd(formData);
        }
        closeForm();
    };

    if (loading) return <div>Carregando configurações de equipamento...</div>;

    if (isEditing) {
        return (
            <div className="equipment-settings-container">
                <h2 className="section-title">{currentEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}</h2>
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
                        <button type="button" onClick={closeForm} className="cancel-button">Cancelar</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="equipment-settings-container">
            <div className="equipment-header">
                <div>
                    <h2 className="section-title">Meus Equipamentos</h2>
                    <p className="section-description">
                        Gerencie os equipamentos. O item com a <span style={{ color: '#FFD700' }}>★</span> será usado nos relatórios.
                    </p>
                </div>
                <button onClick={() => openForm()} className="add-button">+ Adicionar</button>
            </div>

            {equipmentList.length === 0 ? (
                <div className="empty-state">
                    Nenhum equipamento cadastrado. Adicione o primeiro acima.
                </div>
            ) : (
                <div className="equipment-list">
                    {equipmentList.map(eq => (
                        <div
                            key={eq.id}
                            className={`equipment-card ${theme === 'dark' ? 'dark' : ''} ${eq.isDefault ? 'default-equipment' : ''}`}
                        >
                            <div>
                                <div className="equipment-info-title">
                                    {eq.equipmentName}
                                    {eq.isDefault && <span style={{ marginLeft: '8px', fontSize: '0.8em', color: '#28a745', border: '1px solid #28a745', borderRadius: '4px', padding: '2px 6px' }}>Padrão</span>}
                                </div>
                                <div className="equipment-info-subtitle">S/N: {eq.serialNumber}</div>
                            </div>
                            <div className="equipment-actions">
                                <button
                                    onClick={() => handleSetDefault(eq.id)}
                                    className="action-icon-button"
                                    title={eq.isDefault ? "Equipamento Padrão" : "Definir como Padrão"}
                                    style={{ color: eq.isDefault ? '#FFD700' : '#ccc' }}
                                >
                                    ★
                                </button>
                                <button onClick={() => openForm(eq)} className="action-icon-button" title="Editar">✏️</button>
                                <button onClick={() => handleDelete(eq.id)} className="action-icon-button" title="Excluir">🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EquipmentSettings;
