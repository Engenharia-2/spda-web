import { useState } from 'react';

export const useMeasurementData = (updateData) => {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [fileInfoMessage, setFileInfoMessage] = useState(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setProcessing(true);
        setError(null);
        setFileInfoMessage(null);

        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const jsonData = JSON.parse(event.target.result);

                if (!Array.isArray(jsonData)) {
                    throw new Error('O arquivo deve conter uma lista (array) de medições.');
                }

                updateData({
                    measurements: {
                        fileName: file.name,
                        fileSize: file.size,
                        parsedData: jsonData
                    }
                });
                setFileInfoMessage('Arquivo carregado com sucesso!');
            } catch (err) {
                console.error('Error parsing JSON:', err);
                setError('Falha ao processar o arquivo JSON. Verifique o formato.');
            } finally {
                setProcessing(false);
            }
        };

        reader.onerror = () => {
            setError('Erro ao ler o arquivo.');
            setProcessing(false);
        };

        reader.readAsText(file);
    };

    return {
        processing,
        error,
        fileInfoMessage,
        handleFileUpload,
        // Reset states if needed
        resetMessages: () => {
            setError(null);
            setFileInfoMessage(null);
        }
    };
};
