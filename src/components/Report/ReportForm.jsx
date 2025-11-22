import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import InitialInfo from './Steps/InitialInfo';
import BuildingData from './Steps/BuildingData';
import EquipmentData from './Steps/EquipmentData';
import Checklist from './Steps/Checklist';
import MeasurementData from './Steps/MeasurementData';
import Attachments from './Steps/Attachments';
import { generateReport } from '../../utils/PDFGenerator';
import { StorageService } from '../../services/StorageService';
import { useAuth } from '../../contexts/AuthContext';

const ReportForm = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);
    const { currentUser } = useAuth();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const reportId = searchParams.get('id');

    useEffect(() => {
        const loadReport = async () => {
            if (reportId && currentUser) {
                console.log('Loading report:', reportId);
                try {
                    const data = await StorageService.getReport(reportId);
                    console.log('Report data loaded:', data);
                    if (data) {
                        setFormData(data);
                    }
                } catch (error) {
                    console.error('Error loading report:', error);
                    alert('Erro ao carregar o relatório.');
                }
            }
        };
        loadReport();
    }, [reportId, currentUser]);

    const updateData = (newData) => {
        setFormData(prev => ({ ...prev, ...newData }));
    };

    const steps = [
        'Informações Iniciais',
        'Edificação',
        'Equipamento',
        'Checklist',
        'Medições',
        'Anexos'
    ];

    const handleSaveDraft = async () => {
        if (!currentUser) {
            alert('Você precisa estar logado para salvar.');
            return;
        }

        setSaving(true);
        try {
            // Save to Firestore
            // Note: We're not tracking reportId in state yet, so this always creates a new one for now.
            // In the future, we'll want to update the ID after the first save.
            const reportData = { ...formData, status: 'draft' };
            const savedReportId = await StorageService.saveReport(currentUser.uid, reportData, formData.id);

            // Update local state with the new ID so subsequent saves update the same doc
            setFormData(prev => ({ ...prev, id: savedReportId }));

            alert('Rascunho salvo na nuvem com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar rascunho:', error);
            alert('Erro ao salvar rascunho. Verifique sua conexão.');
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        if (activeStep === steps.length - 1) {
            try {
                // Save as completed before generating PDF
                if (currentUser) {
                    const reportData = { ...formData, status: 'completed' };
                    const savedReportId = await StorageService.saveReport(currentUser.uid, reportData, formData.id);
                    setFormData(prev => ({ ...prev, id: savedReportId }));
                }

                await generateReport(formData);
                alert('Relatório gerado com sucesso!');
            } catch (error) {
                console.error('Erro ao gerar relatório:', error);
                alert(`Erro ao gerar o relatório: ${error.message}`);
            }
        } else {
            setActiveStep(prev => prev + 1);
        }
    };

    const renderStep = () => {
        switch (activeStep) {
            case 0:
                return <InitialInfo data={formData} updateData={updateData} />;
            case 1:
                return <BuildingData data={formData} updateData={updateData} />;
            case 2:
                return <EquipmentData data={formData} updateData={updateData} />;
            case 3:
                return <Checklist data={formData} updateData={updateData} />;
            case 4:
                return <MeasurementData data={formData} updateData={updateData} />;
            case 5:
                return <Attachments data={formData} updateData={updateData} />;
            default:
                return (
                    <div style={{
                        padding: 'var(--spacing-2xl)',
                        textAlign: 'center',
                        border: '2px dashed var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text-muted)'
                    }}>
                        Conteúdo da etapa: <strong>{steps[activeStep]}</strong>
                        <br />
                        <span style={{ fontSize: '0.875rem' }}>Em desenvolvimento...</span>
                    </div>
                );
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700' }}>Novo Relatório</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Preencha os dados para gerar o laudo de SPDA.</p>
                </div>
                <button
                    onClick={handleSaveDraft}
                    disabled={saving}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-accent-primary)',
                        background: 'transparent',
                        color: 'var(--color-accent-primary)',
                        fontWeight: '600',
                        cursor: saving ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {saving ? 'Salvando...' : '💾 Salvar Rascunho'}
                </button>
            </div>

            {/* Stepper / Tabs */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-xl)',
                overflowX: 'auto',
                paddingBottom: 'var(--spacing-sm)',
                borderBottom: '1px solid var(--color-border)'
            }}>
                {steps.map((step, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveStep(index)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            color: activeStep === index ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                            borderBottom: activeStep === index ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
                            fontWeight: activeStep === index ? '600' : '400',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                        }}
                    >
                        {index + 1}. {step}
                    </button>
                ))}
            </div>

            {/* Form Content Area */}
            <div style={{
                backgroundColor: 'var(--color-bg-secondary)',
                padding: 'var(--spacing-xl)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                minHeight: '400px'
            }}>
                <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>{steps[activeStep]}</h2>

                {renderStep()}

                {/* Navigation Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-xl)' }}>
                    <button
                        disabled={activeStep === 0}
                        onClick={() => setActiveStep(prev => prev - 1)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'transparent',
                            color: 'var(--color-text-primary)',
                            opacity: activeStep === 0 ? 0.5 : 1,
                            cursor: activeStep === 0 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Voltar
                    </button>
                    <button
                        onClick={handleNext}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            background: activeStep === steps.length - 1 ? 'var(--color-success)' : 'var(--color-accent-primary)',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        {activeStep === steps.length - 1 ? 'Gerar PDF' : 'Próximo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportForm;
