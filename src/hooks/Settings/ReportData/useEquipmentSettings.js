import { useSetting } from '../useSetting';

const defaultConfig = {
    equipmentName: '',
    serialNumber: '',
    calibrationDate: '',
    calibrationValidity: ''
};

/**
 * Hook customizado para gerenciar configurações de equipamento.
 * Utiliza o hook genérico `useSetting` para DRY.
 */
export const useEquipmentSettings = () => {
    const {
        data: equipmentData,
        setData: setEquipmentData,
        loading,
        saving,
        handleSave: genericHandleSave
    } = useSetting('equipmentConfig', defaultConfig);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEquipmentData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        genericHandleSave(equipmentData);
    };

    return {
        equipmentData,
        loading,
        saving,
        handleChange,
        handleSave
    };
};
