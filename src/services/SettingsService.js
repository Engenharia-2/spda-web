import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const SETTINGS_COLLECTION = 'settings';

export const SettingsService = {
    // Save checklist configuration
    saveChecklistConfig: async (userId, items) => {
        try {
            const settingsRef = doc(db, SETTINGS_COLLECTION, userId);
            await setDoc(settingsRef, {
                checklistConfig: items,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('Error saving checklist config:', error);
            throw error;
        }
    },

    // Get checklist configuration
    getChecklistConfig: async (userId) => {
        try {
            const settingsRef = doc(db, SETTINGS_COLLECTION, userId);
            const docSnap = await getDoc(settingsRef);

            if (docSnap.exists() && docSnap.data().checklistConfig) {
                return docSnap.data().checklistConfig;
            } else {
                return null; // Return null to indicate no custom config found
            }
        } catch (error) {
            console.error('Error fetching checklist config:', error);
            throw error;
        }
    },

    // Default checklist items (fallback)
    getDefaultChecklist: () => [
        { id: 'captores', label: 'Captores (Estado de conservação e fixação)', active: true, isDefault: true },
        { id: 'descidas', label: 'Descidas (Continuidade e fixação)', active: true, isDefault: true },
        { id: 'malha', label: 'Malha de Aterramento (Conexões e integridade)', active: true, isDefault: true },
        { id: 'bep', label: 'BEP (Barramento de Equipotencialização Principal)', active: true, isDefault: true },
        { id: 'dps', label: 'DPS (Dispositivos de Proteção contra Surtos)', active: true, isDefault: true },
        { id: 'sinalizacao', label: 'Sinalização de Segurança', active: true, isDefault: true },
    ]
};
