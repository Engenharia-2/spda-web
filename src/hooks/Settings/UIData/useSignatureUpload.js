import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { StorageService } from '../../../services/StorageService';
import { resolveImageUrl } from '../../../utils/ImageProcessor';
import { getStorageLimit } from '../../../utils/storageLimits';

/**
 * Hook customizado para gerenciar upload e exibição de assinatura
 * @param {object} data - Dados contendo a assinatura atual
 * @param {function} onSignatureChange - Callback para atualizar a assinatura
 * @param {string} uploadPath - Caminho base para upload (ex: 'settings' ou 'reports')
 * @returns {object} - Estado e funções para gerenciar assinatura
 */
export const useSignatureUpload = (data, onSignatureChange, uploadPath = 'settings') => {
    const { currentUser } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [signatureUrl, setSignatureUrl] = useState(null);

    // Resolve local URL if needed
    useEffect(() => {
        const resolve = async () => {
            if (data?.signature) {
                const resolved = await resolveImageUrl(data.signature);
                setSignatureUrl(resolved);
            } else {
                setSignatureUrl(null);
            }
        };
        resolve();
    }, [data?.signature]);

    const saveSignature = async (canvasRef) => {
        const canvas = canvasRef.current;
        if (!currentUser || !canvas) return;

        setUploading(true);
        const limit = getStorageLimit(currentUser?.subscription);
        const limitMB = (limit / 1024 / 1024).toFixed(0);

        canvas.toBlob(async (blob) => {
            if (blob) {
                try {
                    const file = new File([blob], 'signature.png', { type: 'image/png' });
                    const path = `${uploadPath}/${currentUser.uid}/signature_${Date.now()}.png`;
                    const uploaded = await StorageService.uploadImage(file, path);

                    onSignatureChange(uploaded.url);
                    setSignatureUrl(uploaded.url);
                    alert('Assinatura salva com sucesso!');
                } catch (error) {
                    console.error('Error saving signature:', error);
                    if (error.code === 'storage/unauthorized') {
                        alert(`Limite de armazenamento atingido (${limitMB}MB). Libere espaço removendo itens antigos.`);
                    } else {
                        alert('Erro ao salvar assinatura.');
                    }
                } finally {
                    setUploading(false);
                }
            }
        });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser) return;

        setUploading(true);
        const limit = getStorageLimit(currentUser?.subscription);
        const limitMB = (limit / 1024 / 1024).toFixed(0);

        try {
            const path = `${uploadPath}/${currentUser.uid}/signature_upload_${Date.now()}_${file.name}`;
            const uploaded = await StorageService.uploadImage(file, path);
            onSignatureChange(uploaded.url);
            setSignatureUrl(uploaded.url);
        } catch (error) {
            console.error('Error uploading signature:', error);
            if (error.code === 'storage/unauthorized') {
                alert(`Limite de armazenamento atingido (${limitMB}MB). Libere espaço removendo itens antigos.`);
            } else {
                alert('Erro ao enviar assinatura.');
            }
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveSignature = (clearCanvasFn) => {
        if (window.confirm('Remover assinatura atual?')) {
            onSignatureChange(null);
            setSignatureUrl(null);
            if (clearCanvasFn) clearCanvasFn();
        }
    };

    return {
        signatureUrl,
        uploading,
        saveSignature,
        handleFileUpload,
        handleRemoveSignature
    };
};

