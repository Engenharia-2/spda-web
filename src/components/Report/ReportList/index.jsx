import React from 'react';
import { Link } from 'react-router-dom';
import useResponsive from '../../../hooks/useResponsive';
import { getMeasurementDate } from '../../../utils/reportUtils';
import { Pencil, X, Trash2 } from 'lucide-react';
import './styles.css';

const ReportList = ({
    reports = [],
    loading = false,
    onDelete,
    variant = 'full', // 'full' | 'dashboard'
    searchTerm = '',
    onSearchChange
}) => {
    const { isMobileLayout: isMobile } = useResponsive();

    const isDashboard = variant === 'dashboard';

    // If dashboard, we might want to limit items or show a specific title
    const displayReports = isDashboard ? reports.slice(0, 5) : reports;

    if (loading) {
        return <div className="loading-container">Carregando laudos...</div>;
    }

    const EmptyState = () => (
        <div className="empty-state">
            <p className="empty-state-text">
                {searchTerm ? 'Nenhum relatório encontrado para sua busca.' : 'Nenhum relatório encontrado.'}
            </p>
            {!isDashboard && !searchTerm && (
                <Link to="/new-report">
                    <button className="first-report-btn">
                        Criar Primeiro Laudo
                    </button>
                </Link>
            )}
            {isDashboard && (
                <Link to="/new-report">
                    <button className="first-report-btn">
                        Criar Primeiro Laudo
                    </button>
                </Link>
            )}
        </div>
    );

    const TableView = () => (
        <div className="desktop-view" style={{ display: isMobile ? 'none' : 'block' }}>
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr className="thead-tr">
                            <th className="th">Cliente</th>
                            <th className="th hide-on-mobile">Data</th>
                            <th className="th">Status</th>
                            <th className="th hide-on-mobile">Responsável</th>
                            <th className="th">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayReports.map((report) => (
                            <tr key={report.id} className="tr">
                                <td className="td td-primary">{report.client || 'Sem Cliente'}</td>
                                <td className="td td-secondary hide-on-mobile">
                                    {getMeasurementDate(report)}
                                </td>
                                <td className="td">
                                    <span className={`status-badge ${report.status === 'completed' ? 'status-completed' : 'status-draft'}`}>
                                        {report.status === 'completed' ? 'Emitido' : 'Rascunho'}
                                    </span>
                                </td>
                                <td className="td td-secondary hide-on-mobile">{report.engineer || 'Eu'}</td>
                                <td className="td td-actions">
                                    <Link to={`/new-report?id=${report.id}`} style={{ textDecoration: 'none' }}>
                                        <button className="action-btn action-btn-edit">
                                            Editar
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => onDelete && onDelete(report.id)}
                                        className="action-btn action-btn-delete"
                                    >
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const MobileView = () => (
        <div className="mobile-view" style={{ display: isMobile ? 'flex' : 'none' }}>
            {displayReports.map((report) => (
                <div key={report.id} className="mobile-card">
                    <div className="mobile-card-header">
                        <div>
                            <h3 className="mobile-card-title">{report.client || 'Sem Cliente'}</h3>
                            <div className="mobile-card-subtitle">
                                {getMeasurementDate(report)}
                            </div>
                        </div>
                        <div className="mobile-card-actions">
                            <Link to={`/new-report?id=${report.id}`} style={{ textDecoration: 'none' }}>
                                <button className="mobile-action-btn mobile-btn-edit">
                                    <Pencil />
                                </button>
                            </Link>
                            <button
                                onClick={() => onDelete && onDelete(report.id)}
                                className="mobile-action-btn mobile-btn-delete"
                            >
                                <Trash2 />
                            </button>
                        </div>
                    </div>

                    <div className="mobile-card-footer">
                        <span className={`status-badge ${report.status === 'completed' ? 'status-completed' : 'status-draft'}`}>
                            {report.status === 'completed' ? 'Emitido' : 'Rascunho'}
                        </span>
                        <span className="mobile-card-resp">
                            Resp: {report.engineer || 'Eu'}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );

    const Content = () => (
        <>
            {displayReports.length === 0 ? <EmptyState /> : (
                <>
                    <TableView />
                    <MobileView />
                </>
            )}
        </>
    );

    if (isDashboard) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h3 className="dashboard-title">Laudos Recentes</h3>
                </div>
                <div style={{ padding: isMobile ? '1rem' : '0' }}>
                    <Content />
                </div>
            </div>
        );
    }

    return (
        <div className="report-list-container">
            <div className="report-list-header">
                <div className="header-title-group">
                    <h1 className="page-title">Meus Relatórios</h1>
                    <p className="page-subtitle">Gerencie todos os seus laudos de SPDA.</p>
                </div>
                <Link to="/new-report" className="header-link">
                    <button className="new-report-btn">
                        <span>+</span> Novo Laudo
                    </button>
                </Link>
            </div>

            <div className="search-container">
                <input
                    type="text"
                    placeholder="Buscar por cliente ou responsável..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                    className="search-input"
                />
            </div>

            <Content />
        </div>
    );
};

export default ReportList;
