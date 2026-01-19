import React, { useState, useEffect } from 'react';
import { useChecklistSettings } from '../../../../hooks/Settings/ReportData/useChecklistSettings';
import { useChecklistReport } from '../../../../hooks/Report/useChecklistReport';
import { resolveImageUrl } from '../../../../utils/ImageProcessor';
import { useAuth } from '../../../../contexts/AuthContext';
import './styles.css';

const Checklist = ({ data, updateData }) => {
    const { currentUser } = useAuth();
    const { items, loading } = useChecklistSettings();
    const checklistItems = items.filter(item => item.active);

    const {
        uploading,
        fileInputRefs,
        handleStatusChange,
        handleObsChange,
        handlePhotoClick,
        handleFileChange,
        handleRemovePhoto
    } = useChecklistReport(data, updateData);



    if (loading) return <div className="checklist-loading">Carregando checklist...</div>;

    return (
        <div className="checklist-container">
            {checklistItems.map((item) => {
                const itemData = (data.checklist && data.checklist[item.id]) || {};
                const photos = itemData.photos || [];

                return (
                    <div key={item.id} className="checklist-item">
                        <div className="checklist-item-header">
                            <h3 className="checklist-item-title">{item.label}</h3>
                            <div className="status-buttons">
                                {['C', 'NC', 'NA'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(item.id, status)}
                                        className={`status-button ${itemData.status === status ? 'selected-' + status.toLowerCase() : ''}`}
                                    >
                                        {status === 'C' ? 'Conforme' : status === 'NC' ? 'Não Conforme' : 'N/A'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="checklist-item-content">
                            <div className="checklist-item-details">
                                <input
                                    type="text"
                                    placeholder="Observações..."
                                    value={itemData.observation || ''}
                                    onChange={(e) => handleObsChange(item.id, e.target.value)}
                                    className="checklist-item-obs"
                                />

                                {photos.length > 0 && (
                                    <div className="photos-container">
                                        {photos.map((photo, index) => (
                                            <ChecklistPhoto
                                                key={index}
                                                photo={photo}
                                                onRemove={() => handleRemovePhoto(item.id, index)}
                                            />
                                        ))}
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
                                    className="add-photo-button"
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
            if (photo.url) {
                const resolved = await resolveImageUrl(photo.url);
                setSrc(resolved);
            } else {
                setSrc(null);
            }
        };
        loadSrc();
    }, [photo.url]);

    return (
        <div className="checklist-photo-container">
            {src && (
                <img
                    src={src}
                    alt="Preview"
                    className="checklist-photo"
                />
            )}
            <button
                onClick={onRemove}
                className="remove-photo-button"
            >
                X
            </button>
        </div>
    );
};
