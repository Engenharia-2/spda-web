import { StorageService } from './StorageService';

/**
 * A service to handle business logic related to Measurements.
 * It uses the generic StorageService to persist and retrieve data,
 * respecting the application's storage mode (local/cloud).
 */
export const MeasurementService = {
    /**
     * Saves an array of measurement data for a specific user.
     * @param {string} userId - The ID of the user.
     * @param {Array<object>} measurementData - An array of measurement objects to save.
     * @returns {Promise<void>}
     */
    saveMeasurements: async (userId, measurementData) => {
        try {
            // Delegate to the main StorageService
            return await StorageService.saveMeasurements(userId, measurementData);
        } catch (error) {
            console.error('[MeasurementService] Error saving measurements:', error);
            // Re-throw the error to be handled by the UI
            throw error;
        }
    },

    /**
     * Gets all measurements for a specific user.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<Array<object>>} - An array of measurement documents.
     */
    getUserMeasurements: async (userId) => {
        try {
            // Delegate to the main StorageService
            return await StorageService.getUserMeasurements(userId);
        } catch (error) {
            console.error('[MeasurementService] Error fetching measurements:', error);
            // Re-throw the error to be handled by the UI
            throw error;
        }
    },

    /**
     * Deletes measurement data for specific groups for a user.
     * @param {string} userId - The ID of the user.
     * @param {Array<number>} groupIds - An array of group numbers to delete.
     * @returns {Promise<void>}
     */
    deleteMeasurementsByGroup: async (userId, groupIds) => {
        try {
            return await StorageService.deleteMeasurementsByGroup(userId, groupIds);
        } catch (error) {
            console.error('[MeasurementService] Error deleting measurements by group:', error);
            throw error;
        }
    },
};
