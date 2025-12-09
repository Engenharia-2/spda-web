import { useSetting } from '../useSetting';

const defaultConfig = {
    logo: null,
    headerColor: '#ffffff',
    headerTextColor: '#333333',
    secondaryColor: '#e6e6e6',
    reportTitle: 'Relatório de Inspeção SPDA'
};

/**
 * Hook customizado para gerenciar configurações de personalização do relatório.
 * Este hook agora é um wrapper em torno do hook genérico `useSetting`.
 */
export const useReportCustomization = () => {
    const {
        data: reportConfig,
        setData,
        loading,
        saving,
        handleSave: genericHandleSave
    } = useSetting('reportConfig', defaultConfig);

    const updateConfig = (updates) => {
        setData(prev => ({ ...prev, ...updates }));
    };

    const handleSave = () => {
        genericHandleSave(reportConfig);
    };

    return {
        reportConfig,
        loading,
        saving,
        updateConfig,
        handleSave
    };
};
