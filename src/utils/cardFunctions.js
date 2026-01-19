// src/utils/cardFunctions.js

/**
 * Calcula o status de validade de uma data de calibração.
 * Retorna o valor formatado e uma porcentagem baseada na proximidade do vencimento.
 * @param {string} validityDate - Data de validade no formato 'YYYY-MM-DD'.
 * @returns {{value: string, percentage: number}} - Objeto com o valor formatado e a porcentagem.
 */
export const calculateValidityStatus = (validityDate) => {
    if (!validityDate) {
        return { value: 'N/A', percentage: 0 };
    }

    // Para evitar problemas de fuso horário, construímos a data cuidadosamente.
    // 'new Date(year, month-1, day)' cria a data à meia-noite no fuso horário LOCAL.
    const [year, month, day] = validityDate.split('-').map(Number);
    const expirationDate = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera as horas para comparação apenas por dia

    const diffTime = expirationDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Diferença em dias

    let percentage;
    if (diffDays < 0) { // Vencido - Vermelho
        percentage = 90;
    } else if (diffDays <= 30) { // 30 dias ou menos - Vermelho
        percentage = 80;
    } else if (diffDays <= 60) { // 31-60 dias - Laranja
        percentage = 60;
    } else if (diffDays <= 90) { // 61-90 dias - Amarelo
        percentage = 40;
    } else { // Mais de 90 dias - Verde
        percentage = 10;
    }

    const formattedValue = expirationDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    return { value: formattedValue, percentage };
};

/**
 * Calcula a porcentagem de uso do armazenamento do usuário.
 * @param {object} currentUser - O objeto do usuário autenticado.
 * @param {number} totalStorageLimit - O limite total de armazenamento em bytes.
 * @returns {{usagePercentage: string, numericPercentage: number}} - Objeto com a porcentagem formatada e numérica.
 */
export const calculateStorageUsage = (currentUser, totalStorageLimit) => {
    const usedStorage = Math.max(0, currentUser?.storage_usage_bytes || 0);
    const usagePercentage = totalStorageLimit > 0
        ? ((usedStorage / totalStorageLimit) * 100).toFixed(1)
        : 0;
    const numericPercentage = parseFloat(usagePercentage);

    return { usagePercentage: `${usagePercentage}%`, numericPercentage };
};

/**
 * Conta o número de laudos com um status específico.
 * @param {Array<object>} reports - Array de objetos de laudos.
 * @param {string} status - O status a ser filtrado (ex: 'completed', 'draft').
 * @returns {number} - O número de laudos com o status especificado.
 */
export const countReportsByStatus = (reports, status) => {
    return reports.filter(r => r.status === status).length;
};

/**
 * Conta laudos concluídos dentro de um mês e ano específicos.
 * @param {Array<object>} reports - Array de laudos. Assumes report has a 'data_emissao' (YYYY-MM-DD string).
 * @param {number} year - O ano.
 * @param {number} month - O mês (1-12).
 * @returns {number} - Contagem de laudos.
 */
export const countCompletedReportsByMonth = (reports, year, month) => {
    if (!reports) return 0;
    return reports.filter(report => {
        if (report.status !== 'completed' || !report.data_emissao) {
            return false;
        }
        // Adiciona T00:00:00 para garantir que a data seja interpretada no fuso horário local
        // e não seja deslocada para o dia anterior por questões de UTC.
        const reportDate = new Date(`${report.data_emissao}T00:00:00`);
        return reportDate.getFullYear() === year && (reportDate.getMonth() + 1) === month;
    }).length;
};
