import React from 'react';
import { useEngineerSettings } from '../../../hooks/Settings/ReportData/useEngineerSettings';
import { useSignaturePad } from '../../../hooks/Settings/UIData/useSignaturePad';
import { useSignatureUpload } from '../../../hooks/Settings/UIData/useSignatureUpload';
import './styles.css';

const EngineerSettings = ({ hookData }) => {
    // Use hook data from props if provided, otherwise create own instance
    const ownHook = useEngineerSettings();
    const {
        engineerData,
        loading,
        handleChange,
        handleSignatureChange
    } = hookData || ownHook;

    const {
        canvasRef,
        startDrawing,
        draw,
        stopDrawing,
        clearCanvas
    } = useSignaturePad();

    const {
        signatureUrl,
        uploading,
        saveSignature,
        handleFileUpload,
        handleRemoveSignature
    } = useSignatureUpload(engineerData, handleSignatureChange, 'settings');

    if (loading) return <div>Carregando configurações do responsável técnico...</div>;

    return (
        <div className="engineer-settings-container">
            <h2 className="section-title">Responsável Técnico Padrão</h2>
            <p className="section-description">
                Defina o nome do responsável técnico e a assinatura que serão usados automaticamente nos relatórios.
            </p>

            <div className="form-field">
                <label className="form-label">Nome do Responsável Técnico</label>
                <input
                    type="text"
                    name="engineer"
                    value={engineerData.engineer || ''}
                    onChange={handleChange}
                    placeholder="Ex: João Silva - CREA 12345"
                    className="form-input"
                />
            </div>

            <div className="signature-section">
                <label className="form-label">Assinatura</label>
                <p className="signature-description">
                    Assine abaixo ou envie uma imagem da sua assinatura.
                </p>

                {signatureUrl ? (
                    <div className="signature-display-area">
                        <img
                            src={signatureUrl}
                            alt="Assinatura"
                            className="signature-image"
                        />
                        <button
                            onClick={() => handleRemoveSignature(clearCanvas)}
                            className="remove-signature-button"
                        >
                            Remover Assinatura
                        </button>
                    </div>
                ) : (
                    <div className="signature-input-area">
                        <div className="signature-pad-container">
                            <canvas
                                ref={canvasRef}
                                width={500}
                                height={200}
                                className="signature-canvas"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                        </div>

                        <div className="signature-actions">
                            <button onClick={clearCanvas} className="signature-button">
                                Limpar
                            </button>
                            <button
                                onClick={() => saveSignature(canvasRef)}
                                disabled={uploading}
                                className="signature-button signature-button-primary"
                            >
                                {uploading ? 'Salvando...' : 'Salvar Assinatura'}
                            </button>

                            <div className="signature-upload-container">
                                <label className="signature-upload-label">
                                    <span>Envie uma imagem</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EngineerSettings;
