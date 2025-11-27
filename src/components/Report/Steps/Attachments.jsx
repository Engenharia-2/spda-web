import React, { useState, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { StorageService } from '../../../services/StorageService';

const Attachments = ({ data, updateData }) => {
    const { currentUser } = useAuth();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const attachments = data.attachments || [];
    const isNewReport = !data.id;

    const handleAddClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        console.log('[Attachments.jsx] handleFileChange triggered.');
        const files = Array.from(e.target.files);
        if (files.length === 0) {
            console.log('[Attachments.jsx] No files selected.');
            return;
        }

        console.log(`[Attachments.jsx] ${files.length} file(s) selected.`, files);

        if (!currentUser || isNewReport) {
            console.warn('[Attachments.jsx] Process stopped. User not logged in or is a new report.', {
                isLoggedIn: !!currentUser,
                isNewReport
            });
            return;
        }

        setUploading(true);
        console.log('[Attachments.jsx] Upload process started.');

        try {
            const newAttachments = [];

            for (const file of files) {
                console.log(`[Attachments.jsx] Processing file: ${file.name}`);
                // Path: reports/{userId}/{reportId}/attachments/{timestamp}_{filename}
                const path = `reports/${currentUser.uid}/${data.id}/attachments/${Date.now()}_${file.name}`;

                console.log(`[Attachments.jsx] Calling StorageService.uploadImage for ${file.name}`);
                const uploadedImage = await StorageService.uploadImage(file, path);
                console.log('[Attachments.jsx] Received response from StorageService:', uploadedImage);

                if (!uploadedImage || !uploadedImage.url) {
                    console.error('[Attachments.jsx] StorageService.uploadImage returned invalid data.', uploadedImage);
                    throw new Error('Falha ao processar a imagem. O serviço de armazenamento não retornou uma URL.');
                }

                newAttachments.push({ ...uploadedImage, description: '' });
            }

            console.log('[Attachments.jsx] All files processed. Updating form data with:', newAttachments);
            updateData({
                attachments: [...attachments, ...newAttachments]
            });
            console.log('[Attachments.jsx] Form data updated successfully.');

        } catch (error) {
            console.error('[Attachments.jsx] CRITICAL: Error during attachment process.', error);
            alert(`Ocorreu um erro grave ao anexar as fotos: ${error.message}`);
        } finally {
            console.log('[Attachments.jsx] Upload process finished.');
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveAttachment = (index) => {
        if (window.confirm('Remover este anexo?')) {
            const newAttachments = [...attachments];
            newAttachments.splice(index, 1);
            updateData({ attachments: newAttachments });
        }
    };

    const handleDescriptionChange = (index, description) => {
        const newAttachments = [...attachments];
        newAttachments[index] = { ...newAttachments[index], description };
        updateData({ attachments: newAttachments });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
            }}>
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Galeria de Anexos</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
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
                        style={{
                            backgroundColor: isNewReport ? 'var(--color-bg-secondary)' : 'var(--color-accent-primary)',
                            color: isNewReport ? 'var(--color-text-muted)' : 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: '600',
                            cursor: (uploading || isNewReport) ? 'not-allowed' : 'pointer',
                            opacity: (uploading || isNewReport) ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                        title={isNewReport ? "Salve o relatório para poder adicionar anexos" : "Adicionar Fotos"}
                    >
                        {uploading ? 'Enviando...' : '➕ Adicionar Fotos'}
                    </button>
                </div>
            </div>

            {isNewReport ? (
                <div style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-2xl)',
                    color: 'var(--color-text-muted)',
                    border: '2px dashed var(--color-border)',
                    borderRadius: 'var(--radius-lg)'
                }}>
                    ℹ️ Por favor, salve o relatório antes de adicionar anexos.
                </div>
            ) : attachments.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-2xl)',
                    color: 'var(--color-text-muted)',
                    border: '2px dashed var(--color-border)',
                    borderRadius: 'var(--radius-lg)'
                }}>
                    Nenhum anexo adicionado ainda.
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 'var(--spacing-md)'
                }}>
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
        <div style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            backgroundColor: 'var(--color-bg-primary)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{ position: 'relative', height: '150px', backgroundColor: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {src ? (
                    <img
                        src={src}
                        alt={attachment.name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                ) : (
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Carregando...</div>
                )}
                <button
                    onClick={onRemove}
                    style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title="Remover"
                >
                    ✕
                </button>
            </div>
            <div style={{ padding: 'var(--spacing-sm)' }}>
                <input
                    type="text"
                    placeholder="Descrição da imagem..."
                    value={attachment.description || ''}
                    onChange={(e) => onDescriptionChange(index, e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        fontSize: '0.875rem',
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)'
                    }}
                />
            </div>
        </div>
    );
};
