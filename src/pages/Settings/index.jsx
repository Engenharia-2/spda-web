import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChecklistSettings } from '../../hooks/Settings/ReportData/useChecklistSettings';
import { useReportCustomization } from '../../hooks/Settings/UIData/useReportCustomization';
import { useEngineerSettings } from '../../hooks/Settings/ReportData/useEngineerSettings';
import { useEquipmentSettings } from '../../hooks/Settings/ReportData/useEquipmentSettings';
import { useStorageMode } from '../../hooks/Settings/useStorageMode';
import { useSync } from '../../hooks/Settings/useSync';
import { useUnsavedChanges } from '../../hooks/Settings/useUnsavedChanges';
import { useSettingsSave } from '../../hooks/Settings/useSettingsSave';
import SubscriptionPlan from '../../components/Settings/SubscriptionPlan';
import StorageSettings from '../../components/Settings/StorageSettings';
import DataSync from '../../components/Settings/DataSync';
import ChecklistConfiguration from '../../components/Settings/ChecklistConfiguration';
import EngineerSettings from '../../components/Settings/EngineerSettings';
import EquipmentSettings from '../../components/Settings/EquipmentSettings';
import ReportCustomization from '../../components/Settings/ReportCustomization';
import AccountSettings from '../../components/Settings/AccountSettings';
import './styles.css';

const Settings = () => {
    const [activeTab, setActiveTab] = React.useState('account'); // 'account' or 'report'
    const { currentUser } = useAuth();
    const checklistHook = useChecklistSettings();
    const {
        items,
        loading,
        newItemLabel,
        saving: checklistSaving,
        setNewItemLabel,
        handleToggleActive,
        handleAddItem,
        handleDeleteItem,
        handleSave: saveChecklist,
    } = checklistHook;

    const reportCustomizationHook = useReportCustomization();
    const engineerSettingsHook = useEngineerSettings();
    const equipmentSettingsHook = useEquipmentSettings();

    const isDirty =
        checklistHook.isDirty ||
        reportCustomizationHook.isDirty ||
        engineerSettingsHook.isDirty ||
        equipmentSettingsHook.isDirty;

    // Hook to manage unsaved changes warnings
    useUnsavedChanges(isDirty);

    const { storageMode, handleStorageModeChange } = useStorageMode();
    const { syncing, syncProgress, handleSyncLocalToCloud, handleSyncCloudToLocal } = useSync();

    // Hook to orchestrate saving all settings
    const { handleSaveAll, isSaving } = useSettingsSave({
        checklistHook,
        reportCustomizationHook,
        engineerSettingsHook,
        equipmentSettingsHook
    });

    if (loading) {
        return <div className="settings-loading">Carregando configurações...</div>;
    }

    const isFreePlan = currentUser?.subscription === 'free';

    const handleUpgrade = () => {
        alert('Entre em contato com o administrador para fazer o upgrade!');
    };

    return (
        <div className="settings-container">
            {/* Header with tabs */}
            <div className="settings-header">
                <div>
                    <h1 className="settings-title">Configurações</h1>
                    <p className="settings-description">
                        {activeTab === 'account'
                            ? 'Gerencie sua conta e preferências de armazenamento.'
                            : 'Personalize os dados e aparência dos seus relatórios.'}
                        {isDirty && activeTab === 'report' && <span style={{ color: 'orange', marginLeft: '10px' }}>(Alterações não salvas)</span>}
                    </p>
                </div>
                {activeTab === 'report' && (
                    <button onClick={handleSaveAll} disabled={isSaving} className="save-button">
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="settings-tabs">
                <button
                    className={`tab-button ${activeTab === 'account' ? 'active' : ''}`}
                    onClick={() => setActiveTab('account')}
                >
                    👤 Conta
                </button>
                <button
                    className={`tab-button ${activeTab === 'report' ? 'active' : ''}`}
                    onClick={() => setActiveTab('report')}
                >
                    📄 Relatório
                </button>
            </div>

            {/* Account Tab Components */}
            {activeTab === 'account' && (
                <>
                    <SubscriptionPlan
                        subscription={currentUser?.subscription}
                        onUpgrade={handleUpgrade}
                    />

                    <StorageSettings
                        storageMode={storageMode}
                        onStorageModeChange={handleStorageModeChange}
                        isFreePlan={isFreePlan}
                    />

                    <DataSync
                        syncing={syncing}
                        syncProgress={syncProgress}
                        onSyncLocalToCloud={handleSyncLocalToCloud}
                        onSyncCloudToLocal={handleSyncCloudToLocal}
                        isFreePlan={isFreePlan}
                    />
                    <AccountSettings />
                </>
            )}

            {/* Report Tab Components */}
            {activeTab === 'report' && (
                <>
                    <ChecklistConfiguration
                        items={items}
                        newItemLabel={newItemLabel}
                        onNewItemLabelChange={setNewItemLabel}
                        onToggleActive={handleToggleActive}
                        onAddItem={handleAddItem}
                        onDeleteItem={handleDeleteItem}
                    />

                    <EngineerSettings hookData={engineerSettingsHook} />

                    <EquipmentSettings hookData={equipmentSettingsHook} />

                    <ReportCustomization hookData={reportCustomizationHook} />
                </>
            )}
        </div>
    );
};

export default Settings;
