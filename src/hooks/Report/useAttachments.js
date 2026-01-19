import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { StorageService } from '../../services/StorageService';

export const useAttachments = (data, updateData) => {
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
        console.log('[useAttachments] handleFileChange triggered.');
        const files = Array.from(e.target.files);
        if (files.length === 0) {
            console.log('[useAttachments] No files selected.');
            return;
        }

        console.log(`[useAttachments] ${files.length} file(s) selected.`, files);

        if (!currentUser || isNewReport) {
            console.warn('[useAttachments] Process stopped. User not logged in or is a new report.', {
                isLoggedIn: !!currentUser,
                isNewReport
            });
            return;
        }

        setUploading(true);
        console.log('[useAttachments] Upload process started.');

        try {
            const newAttachments = [];

            for (const file of files) {
                // Path: reports/{userId}/{reportId}/attachments/{timestamp}_{filename}
                const path = `reports/${currentUser.uid}/${data.id}/attachments/${Date.now()}_${file.name}`;

                const uploadedImage = await StorageService.uploadImage(file, path);

                if (!uploadedImage || !uploadedImage.url) {
                    console.error('[useAttachments] StorageService.uploadImage returned invalid data.', uploadedImage);
                    throw new Error('Falha ao processar a imagem. O serviço de armazenamento não retornou uma URL.');
                }

                newAttachments.push({ ...uploadedImage, description: '' });
            }

            updateData({
                attachments: [...attachments, ...newAttachments]
            });

        } catch (error) {
            console.error('[useAttachments] CRITICAL: Error during attachment process.', error);
            
            if (error.code === 'storage/unauthorized') {
                alert('Limite de armazenamento atingido (50MB). Por favor, exclua relatórios ou anexos antigos para liberar espaço.');
            } else {
                alert(`Ocorreu um erro ao anexar as fotos: ${error.message}`);
            }
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveAttachment = async (index) => {
        if (window.confirm('Remover este anexo?')) {
            const attachmentToDelete = attachments[index];
            
            // Try to delete from storage if path exists
            if (attachmentToDelete && attachmentToDelete.path) {
                try {
                    await StorageService.deleteFile(attachmentToDelete.path);
                } catch (error) {
                    console.error('Error deleting file from storage:', error);
                    // Decide if we want to block UI removal on error. 
                    // Usually better to allow UI removal so user isn't stuck.
                }
            }

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

    return {
        attachments,
        isNewReport,
        uploading,
        fileInputRef,
        handleAddClick,
        handleFileChange,
        handleRemoveAttachment,
        handleDescriptionChange
    };
};
