import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsService } from '../../services/SettingsService';

/**
 * Generic hook to manage a specific user setting.
 * @param {string} settingKey - The key of the setting to manage (e.g., 'reportConfig').
 * @param {any} defaultConfig - The default value to use if no setting is found.
 * @returns {object} - State and handlers for the setting.
 */
export const useSetting = (settingKey, defaultConfig = null) => {
    const { currentUser } = useAuth();
    const [data, setData] = useState(defaultConfig);
    const [initialData, setInitialData] = useState(defaultConfig);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Calculate dirty state
    const isDirty = JSON.stringify(data) !== JSON.stringify(initialData);

    useEffect(() => {
        const fetchSetting = async () => {
            if (currentUser) {
                try {
                    setLoading(true);
                    const fetchedConfig = await SettingsService.getSetting(currentUser.uid, settingKey);

                    // If a config is fetched from the DB, use it. Otherwise, the default state remains.
                    if (fetchedConfig !== null && fetchedConfig !== undefined) {
                        setData(fetchedConfig);
                        setInitialData(fetchedConfig);
                    } else {
                        // If no config in DB, logical initial state is the default
                        setInitialData(defaultConfig);
                    }

                } catch (error) {
                    console.error(`Error loading setting '${settingKey}':`, error);
                    // Keep the default config on error
                    setInitialData(defaultConfig);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchSetting();
    }, [currentUser, settingKey]);

    const handleSave = async (newData) => {
        if (!currentUser) return;
        setSaving(true);
        try {
            await SettingsService.saveSetting(currentUser.uid, settingKey, newData);
            setData(newData); // Optimistically update local state
            setInitialData(newData); // Update initial state to match saved
            alert('Configurações salvas com sucesso!');
        } catch (error) {
            console.error(`Error saving setting '${settingKey}':`, error);
            alert('Erro ao salvar configurações.');
        } finally {
            setSaving(false);
        }
    };

    const confirmSaved = () => {
        setInitialData(data);
    };

    return {
        data,
        setData,
        loading,
        saving,
        isDirty,
        handleSave,
        confirmSaved
    };
};
