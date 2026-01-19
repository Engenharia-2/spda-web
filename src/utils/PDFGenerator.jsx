import React from 'react';
import { pdf } from '@react-pdf/renderer';
import ReportDocument from './ReportTemplate/ReportDocument';
import { resolveImageUrl } from './ImageProcessor';

export const generateReport = async (data) => {
    console.log('[PDFGenerator] Iniciando geração de relatório...', { data });
    console.time('PDFGeneration: Total');

    try {
        // 1. Resolve Images (Attachments and Signature)
        console.log('[PDFGenerator] Etapa 1: Resolvendo URLs de imagens...');
        console.time('PDFGeneration: ImageResolution');

        let resolvedAttachments = [];
        if (data.attachments?.length > 0) {
            resolvedAttachments = await Promise.all(data.attachments.map(async (att) => {
                let url = att.url;
                console.log(`[PDFGenerator] Resolvendo anexo: ${url}`);
                if (url) { // Garante que a url não é nula/indefinida
                    url = await resolveImageUrl(url);
                }
                return { ...att, url };
            }));
        }

        let resolvedSignature = null;
        if (data.signature) {
            let sigUrl = data.signature;
            console.log(`[PDFGenerator] Resolvendo assinatura: ${sigUrl}`);
            resolvedSignature = await resolveImageUrl(sigUrl);
        }
        console.timeEnd('PDFGeneration: ImageResolution');
        console.log('[PDFGenerator] Imagens resolvidas.', { resolvedAttachments, resolvedSignature });


        // 2. Generate PDF Blob
        console.log('[PDFGenerator] Etapa 2: Criando o blob do PDF...');
        console.time('PDFGeneration: PDFBlobCreation');
        const blob = await pdf(
            <ReportDocument
                data={data}
                resolvedAttachments={resolvedAttachments}
                resolvedSignature={resolvedSignature}
            />
        ).toBlob();
        console.timeEnd('PDFGeneration: PDFBlobCreation');
        console.log('[PDFGenerator] Blob do PDF criado com sucesso.', { size: `${(blob.size / 1024 / 1024).toFixed(2)} MB` });


        // 3. Trigger Download
        console.log('[PDFGenerator] Etapa 3: Iniciando download...');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Relatorio_SPDA_${data.client || 'Novo'}.pdf`;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('[PDFGenerator] Geração e download concluídos.');

    } catch (error) {
        console.error('[PDFGenerator] Erro fatal durante a geração do PDF:', error);
        alert('Erro ao gerar o PDF. Consulte o console para mais detalhes.');
    } finally {
        console.timeEnd('PDFGeneration: Total');
    }
};
