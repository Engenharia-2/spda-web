import React, { useState } from 'react';
import { useAttachments } from '../../../../hooks/Report/useAttachments';
import { StorageService } from '../../../../services/StorageService';
import './styles.css';

const Attachments = ({ data, updateData }) => {
    const {
        attachments,
        isNewReport,
        uploading,
        fileInputRef,
        handleAddClick,
        handleFileChange,
        handleRemoveAttachment,
        handleDescriptionChange
    } = useAttachments(data, updateData);

    return (
        <div className="attachments-container">
            <div className="attachments-header">
                <div className="attachments-header-info">
                    <h3>Galeria de Anexos</h3>
                    <p>
                        Adicione fotos gerais do local, diagramas ou documentos complementares.
                    </p>
                </div>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        disabled={isNewReport}
                    />
                    <button
                        onClick={handleAddClick}
                        disabled={uploading || isNewReport}
                        className="attachments-add-button"
                        title={isNewReport ? "Salve o relatório para poder adicionar anexos" : "Adicionar Fotos"}
                    >
                        {uploading ? 'Enviando...' : '➕ Adicionar Fotos'}
                    </button>
                </div>
            </div>

            {isNewReport ? (
                <div className="attachments-drop-area">
                    ℹ️ Por favor, salve o relatório antes de adicionar anexos.
                </div>
            ) : attachments.length === 0 ? (
                <div className="attachments-drop-area">
                    Nenhum anexo adicionado ainda.
                </div>
            ) : (
                <div className="attachments-grid">
                    {attachments.map((attachment, index) => (
                        <AttachmentItem
                            key={index}
                            attachment={attachment}
                            index={index}
                            onRemove={() => handleRemoveAttachment(index)}
                            onDescriptionChange={handleDescriptionChange}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Attachments;

// Helper component to resolve local URLs
const AttachmentItem = ({ attachment, index, onRemove, onDescriptionChange }) => {
    const [src, setSrc] = useState(() => {
        if (attachment.url && attachment.url.startsWith('local-image://')) {
            return null; // Wait for resolution
        }
        return attachment.url;
    });

    React.useEffect(() => {
        const loadSrc = async () => {
            if (attachment.url && attachment.url.startsWith('local-image://')) {
                const resolved = await StorageService.resolveImageUrl(attachment.url);
                setSrc(resolved);
            } else {
                setSrc(attachment.url);
            }
        };
        loadSrc();
    }, [attachment.url]);

    return (
        <div className="attachment-item">
            <div className="attachment-image-container">
                {src ? (
                    <img
                        src={src}
                        alt={attachment.name}
                        className="attachment-image"
                    />
                ) : (
                    <div className="attachment-loading">Carregando...</div>
                )}
                <button
                    onClick={onRemove}
                    className="attachment-remove-button"
                    title="Remover"
                >
                    ✕
                </button>
            </div>
            <div className="attachment-description">
                <input
                    type="text"
                    placeholder="Descrição da imagem..."
                    value={attachment.description || ''}
                    onChange={(e) => onDescriptionChange(index, e.target.value)}
                    className="attachment-description-input"
                />
            </div>
        </div>
    );
};
