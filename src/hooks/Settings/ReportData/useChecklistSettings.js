import { useState } from 'react';
import { SettingsService } from '../../../services/SettingsService';
import { useSetting } from '../useSetting';

export const useChecklistSettings = () => {
    const {
        data: items,
        setData: setItems,
        loading,
        saving,
        handleSave: genericHandleSave,
    } = useSetting('checklistConfig', SettingsService.getDefaultChecklist());

    const [newItemLabel, setNewItemLabel] = useState('');

    const handleToggleActive = (id) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, active: !item.active } : item
        ));
    };

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItemLabel.trim()) return;

        const newItem = {
            id: `custom_${Date.now()}`,
            label: newItemLabel,
            active: true,
            isDefault: false
        };

        setItems(prev => [...prev, newItem]);
        setNewItemLabel('');
    };

    const handleDeleteItem = (id) => {
        if (window.confirm('Tem certeza que deseja remover este item?')) {
            setItems(prev => prev.filter(item => item.id !== id));
        }
    };

    const handleSave = () => {
        genericHandleSave(items);
    };

    return {
        items,
        loading,
        newItemLabel,
        saving,
        setNewItemLabel,
        handleToggleActive,
        handleAddItem,
        handleDeleteItem,
        handleSave,
    };
};
