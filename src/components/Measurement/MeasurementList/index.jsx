import React, { useMemo } from 'react';
import './styles.css';

const MeasurementList = ({ data = [] }) => {

    const groupedMeasurements = useMemo(() => {
        if (!data || data.length === 0) {
            return [];
        }

        // Group measurements by 'group' property
        const groups = data.reduce((acc, m) => {
            const key = `G${m.group}`;
            if (!acc[key]) {
                acc[key] = {
                    id: key,
                    points: [],
                    // Handle both Firestore Timestamps and ISO strings from IndexedDB
                    date: m.timestamp?.toDate ? m.timestamp.toDate() : new Date(m.timestamp),
                };
            }
            acc[key].points.push(m);
            return acc;
        }, {});

        // Convert grouped object to array and sort by date descending
        return Object.values(groups).sort((a, b) => b.date - a.date);
        
    }, [data]);

    const EmptyState = () => (
        <div className="measurement-empty-state">
            <p>Nenhuma medição encontrada.</p>
            <p className="measurement-empty-state-subtitle">
                Conecte um dispositivo e baixe as medições para visualizá-las aqui.
            </p>
        </div>
    );

    const TableView = () => (
        <div className="measurement-table-container">
            <table className="measurement-table">
                <thead>
                    <tr>
                        <th>Grupo</th>
                        <th>Pontos Medidos</th>
                        <th>Data da Medição</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {groupedMeasurements.map((group) => (
                        <tr key={group.id}>
                            <td data-label="Grupo">{group.id}</td>
                            <td data-label="Pontos Medidos">{group.points.length}</td>
                            <td data-label="Data">{group.date.toLocaleString()}</td>
                            <td data-label="Ações">
                                <button className="action-btn-view">
                                    Ver Detalhes
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="measurement-list-container">
            <div className="measurement-list-header">
                <h1 className="page-title">Medições Salvas</h1>
                <p className="page-subtitle">Grupos de medições baixadas dos seus dispositivos.</p>
            </div>
            {groupedMeasurements.length === 0 ? <EmptyState /> : <TableView />}
        </div>
    );
};

export default MeasurementList;
