import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReport = async (data) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let currentY = margin;

    // Helper to add section title
    const addSectionTitle = (title) => {
        if (currentY + 10 > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
        }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(230, 230, 230);
        doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
        doc.text(title, margin + 2, currentY + 6);
        currentY += 12;
    };

    // Helper to add key-value pairs
    const addKeyValue = (key, value, xOffset = 0) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${key}:`, margin + xOffset, currentY);
        const keyWidth = doc.getTextWidth(`${key}: `);
        doc.setFont('helvetica', 'normal');
        doc.text(`${value || '-'}`, margin + xOffset + keyWidth, currentY);
    };

    // --- HEADER ---
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Inspeção SPDA', pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // --- 1. INFORMAÇÕES INICIAIS ---
    addSectionTitle('1. INFORMAÇÕES INICIAIS');
    addKeyValue('Cliente', data.client);
    currentY += 6;
    addKeyValue('Responsável Técnico', data.engineer);
    currentY += 6;
    addKeyValue('Data da Inspeção', data.date);
    currentY += 6;
    addKeyValue('Hora Início', data.startTime);
    addKeyValue('Hora Fim', data.endTime, 80);
    currentY += 10;

    // --- 2. DADOS DA EDIFICAÇÃO ---
    addSectionTitle('2. DADOS DA EDIFICAÇÃO');
    addKeyValue('Endereço', data.address);
    currentY += 6;
    addKeyValue('Tipo', data.buildingType);
    currentY += 6;
    addKeyValue('Informações Complementares', data.additionalInfo);
    currentY += 10;

    // --- 3. EQUIPAMENTO UTILIZADO ---
    addSectionTitle('3. EQUIPAMENTO UTILIZADO');
    addKeyValue('Equipamento', data.equipmentName);
    currentY += 6;
    addKeyValue('Nº Série', data.serialNumber);
    currentY += 6;
    addKeyValue('Data de Calibração', data.calibrationDate);
    currentY += 6;
    addKeyValue('Validade do Certificado', data.calibrationValidity);
    currentY += 10;

    // --- 4. CHECKLIST ---
    addSectionTitle('4. INSPEÇÃO VISUAL (CHECKLIST)');

    const checklistData = Object.entries(data.checklist || {}).map(([key, value]) => {
        const labelMap = {
            captores: 'Captores',
            descidas: 'Descidas',
            aneis: 'Anéis de Cintamento',
            malha: 'Malha de Aterramento',
            bep: 'BEP (Barramento)',
            dps: 'DPS',
            conexoes: 'Conexões',
            sinalizacao: 'Sinalização'
        };

        const statusMap = {
            'C': 'Conforme',
            'NC': 'Não Conforme',
            'NA': 'Não Aplicável'
        };

        return [
            labelMap[key] || key,
            statusMap[value.status] || value.status || '-',
            value.observation || '-'
        ];
    });

    // Use autoTable. If it's a function, call it. If it's attached to doc, use doc.autoTable.
    const runAutoTable = (options) => {
        if (typeof autoTable === 'function') {
            autoTable(doc, options);
        } else if (doc.autoTable) {
            doc.autoTable(options);
        } else {
            console.error('autoTable not found', autoTable);
        }
    };

    runAutoTable({
        startY: currentY,
        head: [['Item', 'Status', 'Observações']],
        body: checklistData,
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => {
            currentY = data.cursor.y + 10;
        }
    });

    // Update currentY after table
    currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : currentY + 20;

    // --- 5. MEDIÇÕES ---
    addSectionTitle('5. MEDIÇÕES');

    const measurementsData = (data.measurements?.parsedData || []).map(m => [
        m.grupo || '-',
        m.ponto || '-',
        formatUnit(m.resistencia, 'ohm'),
        formatUnit(m.corrente, 'A'),
        m.dataHora || '-'
    ]);

    runAutoTable({
        startY: currentY,
        head: [['Grupo', 'Ponto', 'Resistência', 'Corrente', 'Data/Hora']],
        body: measurementsData,
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => {
            currentY = data.cursor.y + 10;
        }
    });

    currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : currentY + 20;

    // --- 6. PARECER TÉCNICO ---
    addSectionTitle('6. PARECER TÉCNICO');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitOpinion = doc.splitTextToSize(data.technicalOpinion || 'Sem parecer técnico.', pageWidth - (margin * 2));
    doc.text(splitOpinion, margin, currentY);
    currentY += (splitOpinion.length * 5) + 10;

    // --- 7. ANEXOS ---
    if (data.attachments?.length > 0) {
        addSectionTitle('7. ANEXOS');

        const photoWidth = 80;
        const photoHeight = 60;
        const gap = 10;
        let xPos = margin;

        const loadImage = (url) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous'; // Try to avoid CORS issues
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = url;
            });
        };

        for (let i = 0; i < data.attachments.length; i++) {
            const photo = data.attachments[i];

            if (currentY + photoHeight + 20 > pageHeight - margin) {
                doc.addPage();
                currentY = margin;
            }

            try {
                // Resolve local-image URLs if needed (though PDF generation usually happens after they are resolved in UI, 
                // we might need to handle them here if they are raw strings. 
                // Ideally, the data passed to generateReport should have resolved URLs or we need a helper here.
                // For now, assuming they are accessible URLs or base64.)
                const img = await loadImage(photo.url);
                doc.addImage(img, 'JPEG', xPos, currentY, photoWidth, photoHeight);

                doc.setFontSize(9);
                doc.setFont('helvetica', 'italic');
                const splitDesc = doc.splitTextToSize(photo.description || 'Sem descrição', photoWidth);
                doc.text(splitDesc, xPos, currentY + photoHeight + 5);

                if (xPos === margin) {
                    xPos += photoWidth + gap;
                } else {
                    xPos = margin;
                    currentY += photoHeight + 20;
                }
            } catch (err) {
                console.error('Error loading image for PDF', err);
                doc.text('[Erro ao carregar imagem]', xPos, currentY + 10);
            }
        }
        // Ensure we move down after attachments for the next section
        if (xPos !== margin) {
            currentY += photoHeight + 20;
        }
    }

    // --- 8. ASSINATURA ---
    if (data.signature) {
        // Check if we need a new page
        if (currentY + 60 > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
        }

        addSectionTitle('8. ASSINATURA');

        try {
            const loadImage = (url) => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = url;
                });
            };

            const sigImg = await loadImage(data.signature);
            // Center the signature
            const sigWidth = 60;
            const sigHeight = 30;
            const xSig = (pageWidth - sigWidth) / 2;

            doc.addImage(sigImg, 'PNG', xSig, currentY, sigWidth, sigHeight);
            currentY += sigHeight + 5;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('___________________________________________________', pageWidth / 2, currentY, { align: 'center' });
            currentY += 5;
            doc.text(data.engineer || 'Responsável Técnico', pageWidth / 2, currentY, { align: 'center' });

        } catch (err) {
            console.error('Error loading signature', err);
            doc.text('[Erro ao carregar assinatura]', margin, currentY + 10);
        }
    }

    doc.save(`Relatorio_SPDA_${data.clientName || 'Novo'}.pdf`);
};

const formatUnit = (value, unit) => {
    if (value === undefined || value === null || value === '') return '-';
    if (typeof value === 'string' && isNaN(parseFloat(value))) return value;
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    if (num === 0) return `0 ${unit}`;

    const formatNum = (n) => n.toFixed(2).replace('.', ',');
    const absNum = Math.abs(num);

    if (absNum >= 1e6) return `${formatNum(num / 1e6)} M${unit}`;
    if (absNum >= 1e3) return `${formatNum(num / 1e3)} k${unit}`;
    if (absNum >= 1) return `${formatNum(num)} ${unit}`;
    if (absNum >= 1e-3) return `${formatNum(num * 1e3)} m${unit}`;
    if (absNum >= 1e-6) return `${formatNum(num * 1e6)} u${unit}`;
    return `${formatNum(num)} ${unit}`;
};
