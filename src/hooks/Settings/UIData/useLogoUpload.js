import { useState } from 'react';

/**
 * Hook customizado para gerenciar upload de logo com validação
 * @param {function} onLogoChange - Callback para atualizar o logo
 * @param {number} maxSizeKB - Tamanho máximo do arquivo em KB (padrão: 500KB)
 * @returns {object} - Funções para gerenciar upload de logo
 */
export const useLogoUpload = (onLogoChange, maxSizeKB = 500) => {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > maxSizeKB * 1024) {
            alert(`A imagem deve ter no máximo ${maxSizeKB}KB.`);
            return;
        }

        setUploading(true);
        const reader = new FileReader();

        reader.onloadend = () => {
            onLogoChange(reader.result);
            setUploading(false);
        };

        reader.onerror = () => {
            alert('Erro ao ler o arquivo.');
            setUploading(false);
        };

        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        onLogoChange(null);
    };

    return {
        uploading,
        handleFileChange,
        handleRemoveLogo
    };
};
