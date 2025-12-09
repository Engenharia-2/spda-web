import React from 'react';
import './styles.css';

const ChecklistConfiguration = ({
    items,
    newItemLabel,
    onNewItemLabelChange,
    onToggleActive,
    onAddItem,
    onDeleteItem
}) => {
    return (
        <div className="settings-section">
            <h2 className="section-title">Configuração do Checklist</h2>
            <p className="section-description">
                Adicione ou remova itens personalizados para seus relatórios.
            </p>
            <form onSubmit={onAddItem} className="add-item-form">
                <input
                    type="text"
                    value={newItemLabel}
                    onChange={(e) => onNewItemLabelChange(e.target.value)}
                    placeholder="Nome do novo item..."
                    className="add-item-input"
                />
                <button type="submit" disabled={!newItemLabel.trim()} className="add-item-button">
                    Adicionar
                </button>
            </form>
            <div className="checklist-items-container">
                {items.map((item) => (
                    <div key={item.id} className={`checklist-item ${!item.active ? 'inactive' : ''}`}>
                        <div className="checklist-item-info">
                            <input
                                type="checkbox"
                                checked={item.active}
                                onChange={() => onToggleActive(item.id)}
                                className="checklist-item-checkbox"
                            />
                            <span className="checklist-item-label">{item.label}</span>
                            {item.isDefault && <span className="default-badge">Padrão</span>}
                        </div>
                        {!item.isDefault && (
                            <button onClick={() => onDeleteItem(item.id)} className="delete-item-button" title="Remover item">
                                🗑️
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChecklistConfiguration;
