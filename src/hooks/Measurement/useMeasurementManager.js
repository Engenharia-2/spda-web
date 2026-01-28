import { useState, useCallback, useEffect } from 'react';
import { MeasurementService } from '../../services/MeasurementService';

export const useMeasurementManager = (currentUser, addLog) => {
    const [measurementData, setMeasurementData] = useState([]);

    const fetchMeasurements = useCallback(async () => {
        if (currentUser) {
            try {
                const data = await MeasurementService.getUserMeasurements(currentUser.uid);
                setMeasurementData(data);
            } catch (error) {
                if (addLog) addLog(`Erro ao carregar medições: ${error.message}`, 'error');
                console.error(error);
            }
        }
    }, [currentUser, addLog]);

    const saveScannedMeasurements = useCallback(async (formattedData) => {
        if (!currentUser || !formattedData || formattedData.length === 0) return;

        try {
            await MeasurementService.saveMeasurements(currentUser.uid, formattedData);
            if (addLog) addLog(`Medições do QR Code salvas com sucesso.`, 'success');
            await fetchMeasurements();
        } catch (error) {
            if (addLog) addLog(`Erro ao salvar medições do QR Code: ${error.message}`, 'error');
            throw error; // Re-throw to let caller know if needed
        }
    }, [currentUser, addLog, fetchMeasurements]);

    // Initial fetch
    useEffect(() => {
        fetchMeasurements();
    }, [fetchMeasurements]);

    return {
        measurementData,
        fetchMeasurements,
        saveScannedMeasurements
    };
};
