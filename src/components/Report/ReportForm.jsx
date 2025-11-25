import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import InitialInfo from './Steps/InitialInfo';
import BuildingData from './Steps/BuildingData';
import EquipmentData from './Steps/EquipmentData';
import Checklist from './Steps/Checklist';
import MeasurementData from './Steps/MeasurementData';
import Attachments from './Steps/Attachments';
import TechnicalOpinion from './Steps/TechnicalOpinion';
import Signature from './Steps/Signature';
import { generateReport } from '../../utils/PDFGenerator';
import { StorageService } from '../../services/StorageService';
import { useAuth } from '../../contexts/AuthContext';
import useMobile from '../../hooks/useMobile';

const ReportForm = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);
    const { currentUser } = useAuth();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const reportId = searchParams.get('id');
    const isMobile = useMobile();

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
        'Parecer Técnico',
        'Anexos',
        'Assinatura'
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
                return <TechnicalOpinion data={formData} updateData={updateData} />;
            case 6:
                return <Attachments data={formData} updateData={updateData} />;
            case 7:
                return <Signature data={formData} updateData={updateData} />;
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
            <div style={{
                marginBottom: 'var(--spacing-xl)',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: isMobile ? '1rem' : '0'
            }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '1.5rem' : '1.875rem', fontWeight: '700' }}>Novo Relatório</h1>
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
                        justifyContent: 'center',
                        gap: '0.5rem',
                        width: isMobile ? '100%' : 'auto'
                    }}
                >
                    {saving ? 'Salvando...' : '💾 Salvar Rascunho'}
                </button>
            </div>

            {/* Stepper / Tabs */}
            {/* Stepper / Tabs */}
            {isMobile ? (
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        <span>Passo {activeStep + 1} de {steps.length}</span>
                        <span>{Math.round(((activeStep + 1) / steps.length) * 100)}%</span>
                    </div>
                    <div style={{ height: '4px', backgroundColor: 'var(--color-border)', borderRadius: '2px', marginBottom: '1rem', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${((activeStep + 1) / steps.length) * 100}%`,
                            backgroundColor: 'var(--color-accent-primary)',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                    <select
                        value={activeStep}
                        onChange={(e) => setActiveStep(Number(e.target.value))}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)',
                            fontSize: '1rem'
                        }}
                    >
                        {steps.map((step, index) => (
                            <option key={index} value={index}>
                                {index + 1}. {step}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
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
            )}

            {/* Form Content Area */}
            <div style={{
                backgroundColor: 'var(--color-bg-secondary)',
                padding: isMobile ? 'var(--spacing-md)' : 'var(--spacing-xl)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                minHeight: '400px'
            }}>
                <h2 style={{ marginBottom: 'var(--spacing-lg)', fontSize: isMobile ? '1.25rem' : '1.5rem' }}>{steps[activeStep]}</h2>

                {renderStep()}

                {/* Navigation Buttons */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 'var(--spacing-xl)',
                    gap: isMobile ? '1rem' : '0'
                }}>
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
                            cursor: activeStep === 0 ? 'not-allowed' : 'pointer',
                            flex: isMobile ? 1 : 'initial'
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
                            cursor: 'pointer',
                            flex: isMobile ? 1 : 'initial'
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
