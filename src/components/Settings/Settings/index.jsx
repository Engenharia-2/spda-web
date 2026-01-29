import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useChecklistSettings } from '../../../hooks/useChecklistSettings';
import SubscriptionPlan from '../SubscriptionPlan';
import ChecklistConfiguration from '../ChecklistConfiguration';
import ReportCustomization from '../ReportCustomization';
import './styles.css';

const Settings = () => {
    const { currentUser } = useAuth();
    const {
        items,
        loading,
        newItemLabel,
        saving,
        setNewItemLabel,
        handleToggleActive,
        handleAddItem,
        handleDeleteItem,
        handleSave,
    } = useChecklistSettings();

    if (loading) {
        return <div className="settings-loading">Carregando configurações...</div>;
    }

    const isFreePlan = currentUser?.subscription === 'free';

    const handleUpgrade = () => {
        alert('Entre em contato com o administrador para fazer o upgrade!');
    };

    return (
        <div className="settings-container">
            <div className="settings-header">
                <div>
                    <h1 className="settings-title">Configurações</h1>
                    <p className="settings-description">Personalize o checklist e outras opções.</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="save-button">
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            <SubscriptionPlan
                subscription={currentUser?.subscription}
                onUpgrade={handleUpgrade}
            />

            <ChecklistConfiguration
                items={items}
                newItemLabel={newItemLabel}
                onNewItemLabelChange={setNewItemLabel}
                onToggleActive={handleToggleActive}
                onAddItem={handleAddItem}
                onDeleteItem={handleDeleteItem}
            />

            <ReportCustomization />
        </div>
    );
};

export default Settings;

