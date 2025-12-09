import React from 'react';
import { useBlocker } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChecklistSettings } from '../../hooks/Settings/ReportData/useChecklistSettings';
import { useReportCustomization } from '../../hooks/Settings/UIData/useReportCustomization';
import { useEngineerSettings } from '../../hooks/Settings/ReportData/useEngineerSettings';
import { useEquipmentSettings } from '../../hooks/Settings/ReportData/useEquipmentSettings';
import { useStorageMode } from '../../hooks/Settings/useStorageMode';
import { useSync } from '../../hooks/Settings/useSync';
import { SettingsService } from '../../services/SettingsService';
import SubscriptionPlan from '../../components/Settings/SubscriptionPlan';
import StorageSettings from '../../components/Settings/StorageSettings';
import DataSync from '../../components/Settings/DataSync';
import ChecklistConfiguration from '../../components/Settings/ChecklistConfiguration';
import EngineerSettings from '../../components/Settings/EngineerSettings';
import EquipmentSettings from '../../components/Settings/EquipmentSettings';
import ReportCustomization from '../../components/Settings/ReportCustomization';
import './styles.css';

const Settings = () => {
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

    // React Router Blocker (prevents navigation within the app)
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    React.useEffect(() => {
        if (blocker.state === "blocked") {
            const confirmLeave = window.confirm("Você tem alterações não salvas. Deseja sair sem salvar?");
            if (confirmLeave) {
                blocker.proceed();
            } else {
                blocker.reset();
            }
        }
    }, [blocker]);

    React.useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ''; // Trigger browser built-in dialog
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const { storageMode, handleStorageModeChange } = useStorageMode();
    const { syncing, syncProgress, handleSyncLocalToCloud, handleSyncCloudToLocal } = useSync();

    const handleSaveAll = async () => {
        try {
            // Save all settings without showing individual alerts
            await Promise.all([
                SettingsService.saveSetting(currentUser.uid, 'checklistConfig', items),
                SettingsService.saveSetting(currentUser.uid, 'reportConfig', reportCustomizationHook.reportConfig),
                SettingsService.saveSetting(currentUser.uid, 'engineerConfig', engineerSettingsHook.engineerData),
                SettingsService.saveSetting(currentUser.uid, 'equipmentConfig', equipmentSettingsHook.equipmentList)
            ]);

            // Confirm saved state to reset isDirty flags
            checklistHook.confirmSaved();
            reportCustomizationHook.confirmSaved();
            engineerSettingsHook.confirmSaved();
            equipmentSettingsHook.confirmSaved();

            alert('Todas as configurações foram salvas com sucesso!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Erro ao salvar configurações.');
        }
    };

    if (loading) {
        return <div className="settings-loading">Carregando configurações...</div>;
    }

    const isFreePlan = currentUser?.subscription === 'free';

    const handleUpgrade = () => {
        alert('Entre em contato com o administrador para fazer o upgrade!');
    };

    return (
        <div className="settings-container">
            {/* ... header ... */}
            <div className="settings-header">
                <div>
                    <h1 className="settings-title">Configurações</h1>
                    <p className="settings-description">
                        Personalize o checklist e outras opções.
                        {isDirty && <span style={{ color: 'orange', marginLeft: '10px' }}>(Alterações não salvas)</span>}
                    </p>
                </div>
                <button onClick={handleSaveAll} disabled={checklistSaving} className="save-button">
                    {checklistSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            {/* Same components as before */}
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
        </div>
    );
};

export default Settings;
