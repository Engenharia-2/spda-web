import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { StorageService } from '../../services/StorageService';

export const useChecklistReport = (data, updateData) => {
    const { currentUser } = useAuth();
    const [uploading, setUploading] = useState({});
    const fileInputRefs = useRef({});

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

    return {
        uploading,
        fileInputRefs,
        handleStatusChange,
        handleObsChange,
        handlePhotoClick,
        handleFileChange,
        handleRemovePhoto
    };
};
