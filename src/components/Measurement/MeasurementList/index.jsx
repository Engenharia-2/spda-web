import React, { useMemo, useState } from 'react';
import { formatUnit } from '../../../utils/formatters'; // Assuming formatUnit is in this path
import './styles.css';

const EmptyState = () => (
    <div className="measurement-empty-state">
        <p>Nenhuma medição encontrada.</p>
        <p className="measurement-empty-state-subtitle">
            Conecte um dispositivo e baixe as medições para visualizá-las aqui.
        </p>
    </div>
);

const TableView = ({ groupedMeasurements, handleViewDetails }) => (
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
                            <button className="action-btn-view" onClick={() => handleViewDetails(group)}>
                                Ver Detalhes
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const DetailedView = ({ group, handleBackToList, onSelectGroup }) => (
    <div className="measurement-detailed-container">
        <div className="detailed-view-header">
            <button className="back-button" onClick={handleBackToList}>
                ← Voltar
            </button>
            <button className="select-button" onClick={() => onSelectGroup(group)}>
                Selecionar para o Relatório
            </button>
        </div>
        <h3 className="detailed-view-title">Detalhes do Grupo {group.id}</h3>
        <p className="detailed-view-subtitle">Data da Medição: {group.date.toLocaleString()}</p>
        
        <div className="data-table-container">
            <table className="data-table">
                <thead>
                    <tr className="data-table-header">
                        <th className="data-table-header-cell">Grupo</th>
                        <th className="data-table-header-cell">Ponto</th>
                        <th className="data-table-header-cell">Resistência</th>
                        <th className="data-table-header-cell">Corrente</th>
                        <th className="data-table-header-cell">Data/Hora</th>
                    </tr>
                </thead>
                <tbody>
                    {group.points.map((item, index) => (
                        <tr key={index} className="data-table-row">
                            <td className="data-table-cell">{item.group !== undefined ? item.group : '-'}</td>
                            <td className="data-table-cell">{item.point !== undefined ? item.point : '-'}</td>
                            <td className="data-table-cell monospace-font">
                                {formatUnit(item.resistance, 'Ω')}
                            </td>
                            <td className="data-table-cell monospace-font">
                                {formatUnit(item.current, 'A')}
                            </td>
                            <td className="data-table-cell">
                                {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : new Date(item.timestamp).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const MeasurementList = ({ data = [], showTitle = true, onSelectGroup }) => {
    const [selectedGroup, setSelectedGroup] = useState(null);

    const groupedMeasurements = useMemo(() => {
        if (!data || data.length === 0) {
            return [];
        }

        // Group measurements by 'group' property
        const groups = data.reduce((acc, m) => {
            // Ensure m.group is a number, default to 0 if not
            const groupNum = typeof m.group === 'number' ? m.group : parseInt(m.group, 10) || 0;
            const key = `G${groupNum}`;
            
            if (!acc[key]) {
                acc[key] = {
                    id: key,
                    rawId: groupNum, // Store raw group number
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

    const handleViewDetails = (group) => {
        setSelectedGroup(group);
    };

    const handleBackToList = () => {
        setSelectedGroup(null);
    };

    return (
        <div className="measurement-list-container">
            {showTitle && !selectedGroup && ( // Only show main title if no group is selected
                <div className="measurement-list-header">
                    <h1 className="page-title">Medições Salvas</h1>
                    <p className="page-subtitle">Grupos de medições baixadas dos seus dispositivos.</p>
                </div>
            )}
            {groupedMeasurements.length === 0 ? <EmptyState /> : (
                selectedGroup 
                    ? <DetailedView group={selectedGroup} handleBackToList={handleBackToList} onSelectGroup={onSelectGroup} /> 
                    : <TableView groupedMeasurements={groupedMeasurements} handleViewDetails={handleViewDetails} />
            )}
        </div>
    );
};

export default MeasurementList;
