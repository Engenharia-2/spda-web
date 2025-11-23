import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { SettingsService } from '../../../services/SettingsService';
import { StorageService } from '../../../services/StorageService';

const Checklist = ({ data, updateData }) => {
    const { currentUser } = useAuth();
    const [checklistItems, setChecklistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState({});
    const fileInputRefs = useRef({});

    useEffect(() => {
        const fetchConfig = async () => {
            if (currentUser) {
                try {
                    const config = await SettingsService.getChecklistConfig(currentUser.uid);
                    if (config) {
                        setChecklistItems(config.filter(item => item.active));
                    } else {
                        setChecklistItems(SettingsService.getDefaultChecklist());
                    }
                } catch (error) {
                    console.error('Error loading checklist config:', error);
                    setChecklistItems(SettingsService.getDefaultChecklist());
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchConfig();
    }, [currentUser]);

    const handleStatusChange = (itemId, status) => {
        const currentChecklist = data.checklist || {};
        updateData({
            checklist: {
                ...currentChecklist,
                [itemId]: { ...currentChecklist[itemId], status }
            }
        });
    };

    const handleObsChange = (itemId, obs) => {
        const currentChecklist = data.checklist || {};
        updateData({
            checklist: {
                ...currentChecklist,
                [itemId]: { ...currentChecklist[itemId], observation: obs }
            }
        });
    };

    const handlePhotoClick = (itemId) => {
        if (fileInputRefs.current[itemId]) {
            fileInputRefs.current[itemId].click();
        }
    };

    const handleFileChange = async (itemId, e) => {
        const file = e.target.files[0];
        if (!file || !currentUser) return;

        setUploading(prev => ({ ...prev, [itemId]: true }));

        try {
            // Path: reports/{userId}/{reportId (or temp)}/{itemId}_{timestamp}
            const path = `reports/${currentUser.uid}/${data.id || 'temp'}/${itemId}_${Date.now()}_${file.name}`;
            const uploadedImage = await StorageService.uploadImage(file, path);

            const currentChecklist = data.checklist || {};
            const currentPhotos = currentChecklist[itemId]?.photos || [];

            updateData({
                checklist: {
                    ...currentChecklist,
                    [itemId]: {
                        ...currentChecklist[itemId],
                        photos: [...currentPhotos, uploadedImage]
                    }
                }
            });
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Erro ao enviar foto.');
        } finally {
            setUploading(prev => ({ ...prev, [itemId]: false }));
        }
    };

    const handleRemovePhoto = (itemId, photoIndex) => {
        if (window.confirm('Remover esta foto?')) {
            const currentChecklist = data.checklist || {};
            const currentPhotos = currentChecklist[itemId]?.photos || [];

            const newPhotos = [...currentPhotos];
            newPhotos.splice(photoIndex, 1);

            updateData({
                checklist: {
                    ...currentChecklist,
                    [itemId]: {
                        ...currentChecklist[itemId],
                        photos: newPhotos
                    }
                }
            });
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando checklist...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {checklistItems.map((item) => {
                const itemData = (data.checklist && data.checklist[item.id]) || {};
                const photos = itemData.photos || [];

                return (
                    <div key={item.id} style={{
                        padding: 'var(--spacing-md)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-bg-primary)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{item.label}</h3>
                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                {['C', 'NC', 'NA'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(item.id, status)}
                                        style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--color-border)',
                                            backgroundColor: itemData.status === status
                                                ? (status === 'C' ? 'var(--color-success)' : status === 'NC' ? 'var(--color-error)' : 'var(--color-text-muted)')
                                                : 'transparent',
                                            color: itemData.status === status ? 'white' : 'var(--color-text-secondary)',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        {status === 'C' ? 'Conforme' : status === 'NC' ? 'Não Conforme' : 'N/A'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--spacing-md)', alignItems: 'start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                <input
                                    type="text"
                                    placeholder="Observações..."
                                    value={itemData.observation || ''}
                                    onChange={(e) => handleObsChange(item.id, e.target.value)}
                                    style={{
                                        padding: 'var(--spacing-sm)',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        color: 'var(--color-text-primary)',
                                        outline: 'none',
                                        fontSize: '0.875rem',
                                        width: '100%'
                                    }}
                                />

                                {/* Photos Preview */}
                                {photos.length > 0 && (
                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                                        {photos.map((photo, index) => {
                                            // Resolve URL for display (async handling inside map is tricky, 
                                            // better to create a small sub-component or use effect, 
                                            // but for now let's use a simple ImageWithLoader component logic inline if possible
                                            // or just assume the URL is valid if cloud, and resolve if local.
                                            // Actually, we need a component to handle the async resolution.
                                            return (
                                                <ChecklistPhoto
                                                    key={index}
                                                    photo={photo}
                                                    onRemove={() => handleRemovePhoto(item.id, index)}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div>
                                <input
                                    type="file"
                                    ref={el => fileInputRefs.current[item.id] = el}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(item.id, e)}
                                />
                                <button
                                    onClick={() => handlePhotoClick(item.id)}
                                    disabled={uploading[item.id]}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-xs)',
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px dashed var(--color-border)',
                                        backgroundColor: 'transparent',
                                        color: 'var(--color-text-secondary)',
                                        cursor: uploading[item.id] ? 'wait' : 'pointer',
                                        fontSize: '0.875rem',
                                        opacity: uploading[item.id] ? 0.7 : 1
                                    }}
                                >
                                    {uploading[item.id] ? 'Enviando...' : '📷 Foto'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default Checklist;

// Helper component to resolve local URLs
const ChecklistPhoto = ({ photo, onRemove }) => {
    const [src, setSrc] = useState(photo.url);

    useEffect(() => {
        const loadSrc = async () => {
            if (photo.url && photo.url.startsWith('local-image://')) {
                const resolved = await StorageService.resolveImageUrl(photo.url);
                setSrc(resolved);
            } else {
                setSrc(photo.url);
            }
        };
        loadSrc();
    }, [photo.url]);

    return (
        <div style={{ position: 'relative', width: '60px', height: '60px' }}>
            <img
                src={src}
                alt="Preview"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)'
                }}
            />
            <button
                onClick={onRemove}
                style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: 'var(--color-error)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    cursor: 'pointer'
                }}
            >
                X
            </button>
        </div>
    );
};
