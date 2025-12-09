import React from 'react';
import { useReportCustomization } from '../../../hooks/Settings/UIData/useReportCustomization';
import { useLogoUpload } from '../../../hooks/Settings/UIData/useLogoUpload';
import ColorPicker from '../ColorPicker';
import './styles.css';

const ReportCustomization = ({ hookData }) => {
    // Use hook data from props if provided, otherwise create own instance
    const ownHook = useReportCustomization();
    const {
        reportConfig,
        loading,
        updateConfig
    } = hookData || ownHook;

    const {
        handleFileChange,
        handleRemoveLogo
    } = useLogoUpload((logo) => updateConfig({ logo }));

    if (loading) {
        return <div className="settings-section">Carregando personalização...</div>;
    }

    return (
        <div className="report-customization-container">
            <h2 className="section-title">Personalização do Relatório</h2>
            <p className="section-description">
                Personalize o cabeçalho dos seus relatórios.
            </p>

            <div className="customization-content">
                <div className="logo-upload-section">
                    <label className="form-label">Logo do Cabeçalho</label>
                    <div className="logo-preview-container" style={{ backgroundColor: reportConfig.headerColor }}>
                        {reportConfig.logo ? (
                            <img src={reportConfig.logo} alt="Logo Preview" className="logo-preview" />
                        ) : (
                            <span className="no-logo-text" style={{ color: reportConfig.headerTextColor }}>Sem logo</span>
                        )}
                    </div>

                    <div className="upload-controls">
                        <label className="upload-btn-label">
                            Escolher Imagem
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="file-input"
                            />
                        </label>
                        {reportConfig.logo && (
                            <button onClick={handleRemoveLogo} className="remove-logo-btn">
                                Remover
                            </button>
                        )}
                    </div>
                    <p className="section-description" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        Recomendado: PNG ou JPG, fundo transparente, max 500KB.
                    </p>
                </div>

                <div className="title-section">
                    <label className="form-label">Título do Relatório</label>
                    <input
                        type="text"
                        value={reportConfig.reportTitle}
                        onChange={(e) => updateConfig({ reportTitle: e.target.value })}
                        placeholder="Ex: Relatório de Inspeção SPDA"
                        className="add-item-input"
                    />                    <p className="section-description" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        Este título aparecerá no cabeçalho de todos os relatórios gerados.
                    </p>
                </div>

                <div className="colors-section">
                    <h3 className="subsection-title">Cores do Cabeçalho e Títulos</h3>
                    <div className="colors-grid">
                        <ColorPicker
                            id="header-bg-color"
                            label="Fundo do Cabeçalho"
                            color={reportConfig.headerColor}
                            onChange={(color) => updateConfig({ headerColor: color })}
                        />
                        <ColorPicker
                            id="header-text-color"
                            label="Cor do Texto (Cabeçalho/Títulos)"
                            color={reportConfig.headerTextColor}
                            onChange={(color) => updateConfig({ headerTextColor: color })}
                        />
                        <ColorPicker
                            id="secondary-color"
                            label="Fundo dos Títulos (Secundária)"
                            color={reportConfig.secondaryColor}
                            onChange={(color) => updateConfig({ secondaryColor: color })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportCustomization;
