import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const SETTINGS_COLLECTION = 'settings';

/**
 * Generic function to get a specific setting value from a user's settings document.
 * @param {string} userId - The user's ID.
 * @param {string} settingKey - The key of the setting to retrieve.
 * @returns {Promise<any|null>} The setting value or null if not found.
 */
const getSetting = async (userId, settingKey) => {
    try {
        const settingsRef = doc(db, SETTINGS_COLLECTION, userId);
        const docSnap = await getDoc(settingsRef);

        if (docSnap.exists() && docSnap.data()[settingKey]) {
            return docSnap.data()[settingKey];
        }
        return null;
    } catch (error) {
        console.error(`Error fetching setting '${settingKey}':`, error);
        throw error;
    }
};

/**
 * Generic function to save a specific setting for a user.
 * @param {string} userId - The user's ID.
 * @param {string} settingKey - The key of the setting to save.
 * @param {any} data - The data to save.
 */
const saveSetting = async (userId, settingKey, data) => {
    try {
        const settingsRef = doc(db, SETTINGS_COLLECTION, userId);
        await setDoc(settingsRef, {
            [settingKey]: data,
            updatedAt: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error(`Error saving setting '${settingKey}':`, error);
        throw error;
    }
};

export const SettingsService = {
    getSetting,
    saveSetting,
    getDefaultChecklist: () => [
        { id: 'captores', label: 'Captores (Estado de conservação e fixação)', active: true, isDefault: true },
        { id: 'descidas', label: 'Descidas (Continuidade e fixação)', active: true, isDefault: true },
        { id: 'malha', label: 'Malha de Aterramento (Conexões e integridade)', active: true, isDefault: true },
        { id: 'bep', label: 'BEP (Barramento de Equipotencialização Principal)', active: true, isDefault: true },
        { id: 'dps', label: 'DPS (Dispositivos de Proteção contra Surtos)', active: true, isDefault: true },
        { id: 'sinalizacao', label: 'Sinalização de Segurança', active: true, isDefault: true },
    ],
};
