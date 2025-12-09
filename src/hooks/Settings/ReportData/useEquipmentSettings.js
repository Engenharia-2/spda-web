import { useSetting } from '../useSetting';

const defaultConfig = [];

/**
 * Hook customizado para gerenciar configurações de equipamento.
 * Agora suporta múltiplos equipamentos (Array).
 */
export const useEquipmentSettings = () => {
    const {
        data: rawData,
        setData: setEquipmentData,
        loading,
        saving,
        isDirty,
        handleSave: genericHandleSave,
        confirmSaved
    } = useSetting('equipmentConfig', defaultConfig);

    // Migration Logic: If data is an object (legacy), field it into an array
    const equipmentList = Array.isArray(rawData) ? rawData : (rawData && typeof rawData === 'object' && Object.keys(rawData).length > 0 ? [{ ...rawData, id: 'legacy_1' }] : []);

    const handleAdd = (equipment) => {
        const newItem = { ...equipment, id: `eq_${Date.now()}` };
        setEquipmentData([...equipmentList, newItem]);
    };

    const handleUpdate = (id, updatedEquipment) => {
        setEquipmentData(prev => {
            const list = Array.isArray(prev) ? prev : equipmentList;
            return list.map(item => item.id === id ? { ...updatedEquipment, id } : item);
        });
    };

    const handleDelete = (id) => {
        if (window.confirm('Tem certeza que deseja remover este equipamento?')) {
            setEquipmentData(prev => {
                const list = Array.isArray(prev) ? prev : equipmentList;
                return list.filter(item => item.id !== id);
            });
        }
    };

    const handleSetDefault = (id) => {
        setEquipmentData(prev => {
            const list = Array.isArray(prev) ? prev : equipmentList;
            return list.map(item => ({
                ...item,
                isDefault: item.id === id
            }));
        });
    };

    const handleSave = () => {
        genericHandleSave(equipmentList);
    };

    return {
        equipmentList,
        loading,
        saving,
        isDirty,
        confirmSaved,
        handleAdd,
        handleUpdate,
        handleDelete,
        handleSetDefault,
        handleSave
    };
};
