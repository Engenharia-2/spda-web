import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { StorageService } from '../../services/StorageService';
import { SettingsService } from '../../services/SettingsService';
import { generateReport } from '../../utils/PDFGenerator';

export const useReports = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const reportId = searchParams.get('id');

    // States for both list and form
    const [reports, setReports] = useState([]);
    const [formData, setFormData] = useState({});
    const [error, setError] = useState(null);

    // States for list
    const [listLoading, setListLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // States for form
    const [formLoading, setFormLoading] = useState(false);
    const [activeStep, setActiveStep] = useState(0);

    const steps = [
        'Informações Iniciais', 'Edificação', 'Checklist',
        'Medições', 'Parecer Técnico', 'Anexos'
    ];

    // Fetch list of reports
    useEffect(() => {
        if (!currentUser) return;
        const fetchReports = async () => {
            try {
                setListLoading(true);
                const data = await StorageService.getUserReports(currentUser.uid);
                setReports(data);
            } catch (err) {
                setError('Erro ao buscar relatórios.');
                console.error(err);
            } finally {
                setListLoading(false);
            }
        };
        fetchReports();
    }, [currentUser]);

    // Fetch single report for editing
    useEffect(() => {
        if (reportId && currentUser) {
            const loadReport = async () => {
                try {
                    setFormLoading(true);
                    const data = await StorageService.getReport(reportId);
                    if (data) {
                        setFormData(data);
                    }
                } catch (err) {
                    setError('Erro ao carregar o relatório.');
                    console.error(err);
                } finally {
                    setFormLoading(false);
                }
            };
            loadReport();
        }
    }, [reportId, currentUser]);

    const deleteReport = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este relatório?')) {
            try {
                await StorageService.deleteReport(id);
                setReports(prev => prev.filter(r => r.id !== id));
            } catch (err) {
                setError('Erro ao excluir relatório.');
                console.error(err);
            }
        }
    };

    const updateData = (newData) => {
        setFormData(prev => ({ ...prev, ...newData }));
    };

    const saveDraft = async () => {
        if (!currentUser) return;
        setFormLoading(true);
        try {
            const reportData = { ...formData, status: 'draft' };
            const savedReportId = await StorageService.saveReport(currentUser.uid, reportData, formData.id);
            setFormData(prev => ({ ...prev, id: savedReportId }));
            alert('Rascunho salvo na nuvem com sucesso!');
        } catch (err) {
            setError('Erro ao salvar rascunho.');
            console.error(err);
        } finally {
            setFormLoading(false);
        }
    };

    const generateFinalReport = async () => {
        setFormLoading(true);
        try {
            // Save as completed
            if (currentUser) {
                const reportData = { ...formData, status: 'completed' };
                const savedReportId = await StorageService.saveReport(currentUser.uid, reportData, formData.id);
                setFormData(prev => ({ ...prev, id: savedReportId }));
            }

            // Fetch configs
            const [checklistConfig, reportConfig, equipmentConfigRaw, engineerConfig] = await Promise.all([
                SettingsService.getSetting(currentUser.uid, 'checklistConfig'),
                SettingsService.getSetting(currentUser.uid, 'reportConfig'),
                SettingsService.getSetting(currentUser.uid, 'equipmentConfig'),
                SettingsService.getSetting(currentUser.uid, 'engineerConfig')
            ]);

            // Resolve selected equipment (Default or First)
            let selectedEquipment = {};
            if (Array.isArray(equipmentConfigRaw) && equipmentConfigRaw.length > 0) {
                selectedEquipment = equipmentConfigRaw.find(eq => eq.isDefault) || equipmentConfigRaw[0];
            } else if (equipmentConfigRaw && typeof equipmentConfigRaw === 'object') {
                selectedEquipment = equipmentConfigRaw; // Legacy fallback
            }

            const reportDataForPDF = {
                ...formData,
                ...selectedEquipment, // Flatten selected equipment data
                ...(engineerConfig || {}),
                checklistConfig: checklistConfig || SettingsService.getDefaultChecklist(),
                reportConfig
            };

            await generateReport(reportDataForPDF);
            alert('Relatório gerado com sucesso!');
            navigate('/reports');
        } catch (err) {
            setError(`Erro ao gerar o relatório: ${err.message}`);
            console.error(err);
        } finally {
            setFormLoading(false);
        }
    };

    const goToNextStep = () => {
        if (activeStep === steps.length - 1) {
            generateFinalReport();
        } else {
            setActiveStep(prev => prev + 1);
        }
    };

    const goToPrevStep = () => setActiveStep(prev => prev - 1);

    const filteredReports = useMemo(() =>
        reports.filter(report =>
            (report.client?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (report.engineer?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        ), [reports, searchTerm]);

    return {
        // Common
        error,
        reportId,
        // List
        filteredReports,
        listLoading,
        searchTerm,
        setSearchTerm,
        deleteReport,
        // Form
        formData,
        formLoading,
        updateData,
        steps,
        activeStep,
        setActiveStep,
        saveDraft,
        goToNextStep,
        goToPrevStep,
    };
};
