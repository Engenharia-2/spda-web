/**
 * Report utility functions
 * Pure functions for report data transformation and formatting
 */

/**
 * Extract measurement date from report data
 * @param {Object} report - Report object with measurements
 * @returns {string} Formatted date (DD/MM/YYYY) or 'N/A'
 */
export const getMeasurementDate = (report) => {
    if (report.measurements?.parsedData && report.measurements.parsedData.length > 0) {
        const firstMeasurement = report.measurements.parsedData[0];
        if (firstMeasurement.dataHora) {
            // Extract date from "DD/MM/YYYY HH:mm:ss" format
            const datePart = firstMeasurement.dataHora.split(' ')[0];
            return datePart || 'N/A';
        }
    }
    return 'N/A';
};

/**
 * Format report status for display
 * @param {string} status - Report status ('completed' | 'draft')
 * @returns {string} Display text
 */
export const formatReportStatus = (status) => {
    return status === 'completed' ? 'Emitido' : 'Rascunho';
};

/**
 * Get report engineer name with fallback
 * @param {Object} report - Report object
 * @returns {string} Engineer name or default
 */
export const getEngineerName = (report) => {
    return report.engineer || 'Eu';
};

/**
 * Get client name with fallback
 * @param {Object} report - Report object
 * @returns {string} Client name or default
 */
export const getClientName = (report) => {
    return report.client || 'Sem Cliente';
};
