import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { MeasurementService } from '../../../../services/MeasurementService';
import './styles.css';

import MeasurementList from '../../../../components/Measurement/MeasurementList';

const MeasurementData = ({ data, updateData }) => {
    const { currentUser } = useAuth();
    const [allMeasurements, setAllMeasurements] = useState([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (currentUser) {
                try {
                    const initialData = await MeasurementService.getUserMeasurements(currentUser.uid);
                    setAllMeasurements(initialData);
                } catch (error) {
                    console.error(`Erro ao carregar medições iniciais: ${error.message}`);
                }
            }
        };
        fetchInitialData();
    }, [currentUser]);

    const handleSelectGroupForReport = (group) => {
        if (group && group.points) {
            const reportData = group.points.map(point => ({
                grupo: point.group,
                ponto: point.point,
                resistencia: point.resistance,
                corrente: point.current,
                dataHora: point.timestamp ? (point.timestamp.toDate ? point.timestamp.toDate().toLocaleString() : new Date(point.timestamp).toLocaleString()) : '-'
            }));
            updateData({ measurements: { parsedData: reportData } });
        }
    };

    return (
        <div className="measurement-data-container">
            <div className="step-description">
                <p>Selecione abaixo um grupo de medições para anexar a este relatório.</p>
                <p className="step-subtitle">As medições devem ser previamente baixadas na página de Medições.</p>
            </div>

            <MeasurementList 
                data={allMeasurements} 
                showTitle={false} 
                onSelectGroup={handleSelectGroupForReport}
                selectedGroupId={data?.measurements?.parsedData?.[0]?.grupo}
            />
        </div>
    );
};

export default MeasurementData;
