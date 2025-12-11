import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsService } from '../../services/SettingsService';

/**
 * Custom hook to orchestrate saving multiple settings configurations.
 * Centralizes the logic for saving all settings at once and managing their dirty states.
 * 
 * @param {object} hooks - Object containing all settings hooks
 * @param {object} hooks.checklistHook - Hook managing checklist settings
 * @param {object} hooks.reportCustomizationHook - Hook managing report customization
 * @param {object} hooks.engineerSettingsHook - Hook managing engineer settings
 * @param {object} hooks.equipmentSettingsHook - Hook managing equipment settings
 * @returns {object} - Save handler and saving state
 */
export const useSettingsSave = ({
    checklistHook,
    reportCustomizationHook,
    engineerSettingsHook,
    equipmentSettingsHook
}) => {
    const { currentUser } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveAll = async () => {
        if (!currentUser) {
            alert('Usuário não autenticado.');
            return;
        }

        setIsSaving(true);
        try {
            // Save all settings in parallel
            await Promise.all([
                SettingsService.saveSetting(
                    currentUser.uid,
                    'checklistConfig',
                    checklistHook.items
                ),
                SettingsService.saveSetting(
                    currentUser.uid,
                    'reportConfig',
                    reportCustomizationHook.reportConfig
                ),
                SettingsService.saveSetting(
                    currentUser.uid,
                    'engineerConfig',
                    engineerSettingsHook.engineerData
                ),
                SettingsService.saveSetting(
                    currentUser.uid,
                    'equipmentConfig',
                    equipmentSettingsHook.equipmentList
                )
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
        } finally {
            setIsSaving(false);
        }
    };

    return {
        handleSaveAll,
        isSaving
    };
};
