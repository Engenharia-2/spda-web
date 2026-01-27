import React, { useMemo, useState, useCallback } from 'react';
import { formatUnit } from '../../../utils/formatters';
import { MeasurementService } from '../../../services/MeasurementService';
import { Eye, Trash2, Check } from 'lucide-react'; // Import icons
import './styles.css';

const EmptyState = () => (
    <div className="measurement-empty-state">
        <p>Nenhuma medição encontrada.</p>
        <p className="measurement-empty-state-subtitle">
            Conecte um dispositivo e baixe as medições para visualizá-las aqui.
        </p>
    </div>
);

const TableView = ({ groupedMeasurements, handleViewDetails, onDeleteGroup }) => (
    <div className="measurement-table-container">
        <table className="measurement-table">
            <thead>
                <tr>
                    <th>Grupo</th>
                    <th className="col-points-measured">Pontos Medidos</th>
                    <th>Data da Medição</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                {groupedMeasurements.map((group) => (
                    <tr key={group.id} >
                        <td data-label="Grupo">{group.id}</td>
                        <td data-label="Pontos Medidos" className="col-points-measured">{group.points.length}</td>
                        <td data-label="Data">{group.date.toLocaleDateString()}</td>
                        <td data-label="Ações" className="action-buttons-cell">
                            <button className="action-btn action-btn-view" onClick={() => handleViewDetails(group)}>
                                <span className="action-btn-text">Ver Detalhes</span>
                                <Eye size={16} className="action-btn-icon" />
                            </button>
                            <button className="action-btn action-btn-delete" onClick={() => onDeleteGroup(group)}>
                                <span className="action-btn-text">Excluir</span>
                                <Trash2 size={16} className="action-btn-icon" />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const DetailedView = ({ group, handleBackToList, onSelectGroup, selectedGroupId }) => {
    const isSelected = selectedGroupId == group.rawId;

    return (
        <div className="measurement-detailed-container">
            <div className="detailed-view-header">
                <button className="back-button" onClick={handleBackToList}>
                    ← Voltar
                </button>
                {onSelectGroup && (
                    <button 
                        className={`select-button ${isSelected ? 'selected' : ''}`} 
                        onClick={() => onSelectGroup(group)}
                    >
                        {isSelected ? (
                            <>
                                <span>Selecionado</span>
                                <Check size={18} />
                            </>
                        ) : (
                            'Selecionar para o Relatório'
                        )}
                    </button>
                )}
            </div>
            <h3 className="detailed-view-title">Detalhes do Grupo {group.id}</h3>
            <p className="detailed-view-subtitle">Data da Medição: {group.date.toLocaleString()}</p>
            
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr className="data-table-header">
                            <th className="data-table-header-cell">Ponto</th>
                            <th className="data-table-header-cell">Resistência</th>
                            <th className="data-table-header-cell">Corrente</th>
                            <th className="data-table-header-cell">Data/Hora</th>
                        </tr>
                    </thead>
                    <tbody>
                        {group.points
                            .slice() // Create a shallow copy to avoid modifying the original array
                            .sort((a, b) => (a.point || 0) - (b.point || 0)) // Sort by 'point' property
                            .map((item, index) => (
                            <tr key={index} className="data-table-row">
                                <td className="data-table-cell">{item.point !== undefined ? item.point : '-'}</td>
                                <td className="data-table-cell monospace-font">
                                    {formatUnit(item.resistance, 'Ω')}
                                </td>
                                <td className="data-table-cell monospace-font">
                                    {formatUnit(item.current, 'A')}
                                </td>
                                <td className="data-table-cell">
                                    {item.timestamp 
                                        ? (item.timestamp.toDate ? item.timestamp.toDate().toLocaleString() : new Date(item.timestamp).toLocaleString())
                                        : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const MeasurementList = ({ data = [], showTitle = true, onSelectGroup, selectedGroupId, currentUser, addLog, onRefreshMeasurements }) => {
    const [selectedGroup, setSelectedGroup] = useState(null);

        const groupedMeasurements = useMemo(() => {
            if (!data || data.length === 0) {
                return [];
            }
    
            const groups = data.reduce((acc, m) => {
                const groupNum = typeof m.group === 'number' ? m.group : parseInt(m.group, 10) || 0;
                const key = `G${groupNum}`;
                
                if (!acc[key]) {
                    acc[key] = {
                        id: key,
                        rawId: groupNum,
                        points: [],
                        date: null,
                    };
                }
    
                acc[key].points.push(m);
    
                // Define a data do grupo baseando-se em um ponto que tenha timestamp.
                // Se for o ponto 1, ele tem prioridade total (início da medição).
                if (m.timestamp && (!acc[key].date || m.point === 1)) {
                    acc[key].date = m.timestamp.toDate ? m.timestamp.toDate() : new Date(m.timestamp);
                }
    
                return acc;
            }, {});
    
            // Converte o objeto de grupos em array e garante que todos tenham uma data (fallback)
            return Object.values(groups)
                .map(group => ({
                    ...group,
                    date: group.date || new Date()
                }))
                .sort((a, b) => b.date - a.date);
            
        }, [data]);
    const handleViewDetails = (group) => {
        setSelectedGroup(group);
    };

    const handleBackToList = () => {
        setSelectedGroup(null);
    };

    const handleDeleteGroup = useCallback(async (groupToDelete) => {
        if (window.confirm(`Tem certeza que deseja excluir o grupo de medições "${groupToDelete.id}"?`)) {
            try {
                await MeasurementService.deleteMeasurementsByGroup(currentUser.uid, [groupToDelete.rawId]);
                addLog(`Grupo de medições "${groupToDelete.id}" excluído com sucesso.`, 'success');
                onRefreshMeasurements(); // Refresh the list in the parent component
            } catch (error) {
                addLog(`Erro ao excluir o grupo "${groupToDelete.id}": ${error.message}`, 'error');
            }
        }
    }, [currentUser, addLog, onRefreshMeasurements]);

    return (
        <div className="measurement-list-container">
            {showTitle && !selectedGroup && (
                <div className="measurement-list-header">
                    <h1 className="page-title">Medições Salvas</h1>
                    <p className="page-subtitle">Grupos de medições baixadas dos seus dispositivos.</p>
                </div>
            )}
            {groupedMeasurements.length === 0 ? <EmptyState /> : (
                selectedGroup 
                    ? <DetailedView 
                        group={selectedGroup} 
                        handleBackToList={handleBackToList} 
                        onSelectGroup={onSelectGroup} 
                        selectedGroupId={selectedGroupId}
                      /> 
                    : <TableView groupedMeasurements={groupedMeasurements} handleViewDetails={handleViewDetails} onDeleteGroup={handleDeleteGroup} />
            )}
        </div>
    );
};

export default MeasurementList;
