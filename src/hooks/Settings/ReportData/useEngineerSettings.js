import { useSetting } from '../useSetting';

const defaultConfig = {
    engineer: '',
    signature: null
};

/**
 * Hook customizado para gerenciar configurações do engenheiro.
 * Utiliza o hook genérico `useSetting` para DRY.
 */
export const useEngineerSettings = () => {
    const {
        data: engineerData,
        setData: setEngineerData,
        loading,
        saving,
        handleSave: genericHandleSave
    } = useSetting('engineerConfig', defaultConfig);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEngineerData(prev => ({ ...prev, [name]: value }));
    };

    const handleSignatureChange = (signatureUrl) => {
        setEngineerData(prev => ({ ...prev, signature: signatureUrl }));
    };

    const handleSave = () => {
        genericHandleSave(engineerData);
    };

    return {
        engineerData,
        loading,
        saving,
        handleChange,
        handleSignatureChange,
        handleSave
    };
};
