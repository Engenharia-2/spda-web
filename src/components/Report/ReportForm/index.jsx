import React, { useEffect } from 'react';
import { useReports } from '../../../hooks/Report/useReports';
import { useUnsavedChanges } from '../../../hooks/Settings/useUnsavedChanges';
import useResponsive from '../../../hooks/useResponsive';
import InitialInfo from '../../Report/Steps/InitialInfo';
import BuildingData from '../../Report/Steps/BuildingData';
import Checklist from '../../Report/Steps/Checklist';
import MeasurementData from '../../Report/Steps/MeasurementData';
import Attachments from '../../Report/Steps/Attachments';
import TechnicalOpinion from '../../Report/Steps/TechnicalOpinion';
import './styles.css';

const ReportForm = () => {
    const {
        reportId,
        formData,
        formLoading,
        isDirty,
        updateData,
        steps,
        activeStep,
        setActiveStep,
        saveDraft,
        goToNextStep,
        goToPrevStep,
    } = useReports();

    // Reuse existing hook for navigation blocking
    useUnsavedChanges(isDirty);

    const { isMobileLayout: isMobile } = useResponsive();

    const renderStep = () => {
        switch (activeStep) {
            case 0: return <InitialInfo data={formData} updateData={updateData} />;
            case 1: return <BuildingData data={formData} updateData={updateData} />;
            case 2: return <Checklist data={formData} updateData={updateData} />;
            case 3: return <MeasurementData data={formData} updateData={updateData} />;
            case 4: return <TechnicalOpinion data={formData} updateData={updateData} />;
            case 5: return <Attachments data={formData} updateData={updateData} />;
            default: return null;
        }
    };

    return (
        <div className="container">
            <div className={`report-header ${isMobile ? 'report-header-mobile' : ''}`}>
                <div>
                    <h1 className={`report-title ${isMobile ? 'report-title-mobile' : ''}`}>
                        {reportId ? 'Editar Relatório' : 'Novo Relatório'}
                    </h1>
                    <p className="report-subtitle">Preencha os dados para gerar o laudo de SPDA.</p>
                </div>
                <button
                    onClick={saveDraft}
                    disabled={formLoading}
                    className={`save-btn ${isMobile ? 'save-btn-mobile' : ''}`}
                >
                    {formLoading ? 'Salvando...' : '💾 Salvar Rascunho'}
                </button>
            </div>

            {/* Stepper */}
            {isMobile ? (
                <div className="stepper-mobile-container">
                    <div className="stepper-info">
                        <span>Passo {activeStep + 1} de {steps.length}</span>
                        <span>{Math.round(((activeStep + 1) / steps.length) * 100)}%</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                    <select
                        value={activeStep}
                        onChange={(e) => setActiveStep(Number(e.target.value))}
                        className="step-select"
                    >
                        {steps.map((step, index) => (
                            <option key={index} value={index}>
                                {index + 1}. {step}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className="stepper-desktop-container">
                    {steps.map((step, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveStep(index)}
                            className={`step-btn ${activeStep === index ? 'step-btn-active' : ''}`}
                        >
                            {index + 1}. {step}
                        </button>
                    ))}
                </div>
            )}

            {/* Form Content */}
            <div className={`form-content ${isMobile ? 'form-content-mobile' : ''}`}>
                <h2 className={`step-title ${isMobile ? 'step-title-mobile' : ''}`}>{steps[activeStep]}</h2>
                {renderStep()}
                <div className={`navigation-buttons ${isMobile ? 'navigation-buttons-mobile' : ''}`}>
                    <button
                        disabled={activeStep === 0}
                        onClick={goToPrevStep}
                        className={`nav-btn ${isMobile ? 'nav-btn-mobile' : ''}`}
                    >
                        Voltar
                    </button>
                    <button
                        onClick={goToNextStep}
                        disabled={formLoading}
                        className={`nav-btn nav-btn-primary ${activeStep === steps.length - 1 ? 'nav-btn-success' : ''} ${isMobile ? 'nav-btn-mobile' : ''}`}
                    >
                        {formLoading ? 'Gerando...' : (activeStep === steps.length - 1 ? 'Gerar PDF' : 'Próximo')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportForm;
