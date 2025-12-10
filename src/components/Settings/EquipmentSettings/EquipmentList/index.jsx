import React from 'react';
import { useTheme } from '../../../../contexts/ThemeContext/ThemeContext';
// Assuming styles are in the parent directory or we will move them. 
// For now, importing from parent styles if possible or relying on global/parent CSS bundle.
// The original file imported './styles.css'. We should probably keep using it in the parent or verify imports.
// For now, I will assume the classes are available if the parent imports the CSS, OR I should move usages.
// Let's create a functional component.

const EquipmentList = ({
    equipmentList,
    onAdd,
    onEdit,
    onDelete,
    onSetDefault
}) => {
    const { theme } = useTheme();

    return (
        <div className="equipment-settings-container">
            <div className="equipment-header">
                <div>
                    <h2 className="section-title">Meus Equipamentos</h2>
                    <p className="section-description">
                        Gerencie os equipamentos. O item com a <span style={{ color: '#FFD700' }}>★</span> será usado nos relatórios.
                    </p>
                </div>
                <button onClick={onAdd} className="add-button">Adicionar</button>
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
                                    onClick={() => onSetDefault(eq.id)}
                                    className="action-icon-button"
                                    title={eq.isDefault ? "Equipamento Padrão" : "Definir como Padrão"}
                                    style={{ color: eq.isDefault ? '#FFD700' : '#ccc' }}
                                >
                                    ★
                                </button>
                                <button onClick={() => onEdit(eq)} className="action-icon-button" title="Editar">✏️</button>
                                <button onClick={() => onDelete(eq.id)} className="action-icon-button" title="Excluir">🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EquipmentList;
