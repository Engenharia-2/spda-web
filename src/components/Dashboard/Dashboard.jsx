import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { StorageService } from '../../services/StorageService';

const StatCard = ({ title, value, icon, trend, trendUp }) => (
    <div style={{
        backgroundColor: 'var(--color-bg-secondary)',
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        flex: 1
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--spacing-xs)' }}>{title}</p>
                <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>{value}</h3>
            </div>
            <div style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--radius-md)',
                fontSize: '1.5rem'
            }}>
                {icon}
            </div>
        </div>
        {trend && (
            <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                <span style={{ color: trendUp ? 'var(--color-success)' : 'var(--color-error)', fontSize: '0.875rem', fontWeight: '600' }}>
                    {trend}
                </span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>vs mês anterior</span>
            </div>
        )}
    </div>
);

const RecentReports = ({ reports, loading, onDelete }) => {
    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando laudos...</div>;
    }

    if (reports.length === 0) {
        return (
            <div style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                marginTop: 'var(--spacing-xl)',
                padding: '3rem',
                textAlign: 'center'
            }}>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Nenhum laudo encontrado.</p>
                <Link to="/new-report">
                    <button style={{
                        backgroundColor: 'var(--color-accent-primary)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer'
                    }}>
                        Criar Primeiro Laudo
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            marginTop: 'var(--spacing-xl)',
            overflow: 'hidden'
        }}>
            <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Laudos Recentes</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <th style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-muted)', fontWeight: '500', fontSize: '0.875rem' }}>Cliente</th>
                            <th style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-muted)', fontWeight: '500', fontSize: '0.875rem' }}>Data</th>
                            <th style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-muted)', fontWeight: '500', fontSize: '0.875rem' }}>Status</th>
                            <th style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-muted)', fontWeight: '500', fontSize: '0.875rem' }}>Responsável</th>
                            <th style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-muted)', fontWeight: '500', fontSize: '0.875rem' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map((report) => (
                            <tr key={report.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: 'var(--spacing-md)', fontWeight: '500' }}>{report.client || 'Sem Cliente'}</td>
                                <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                                    {report.updatedAt?.seconds ? new Date(report.updatedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                </td>
                                <td style={{ padding: 'var(--spacing-md)' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        backgroundColor: report.status === 'completed' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                        color: report.status === 'completed' ? 'var(--color-success)' : 'var(--color-warning)'
                                    }}>
                                        {report.status === 'completed' ? 'Emitido' : 'Rascunho'}
                                    </span>
                                </td>
                                <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>{report.engineer || 'Eu'}</td>
                                <td style={{ padding: 'var(--spacing-md)', display: 'flex', gap: '0.5rem' }}>
                                    <Link to={`/new-report?id=${report.id}`} style={{ textDecoration: 'none' }}>
                                        <button style={{ background: 'none', border: 'none', color: 'var(--color-accent-primary)', cursor: 'pointer', fontWeight: '500' }}>
                                            Editar
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => onDelete(report.id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontWeight: '500' }}
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
};

const Dashboard = () => {
    const { currentUser } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        if (currentUser) {
            try {
                const data = await StorageService.getUserReports(currentUser.uid);
                setReports(data);
            } catch (error) {
                console.error('Error fetching reports:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchReports();
    }, [currentUser]);

    const handleDelete = async (reportId) => {
        if (window.confirm('Tem certeza que deseja excluir este relatório?')) {
            try {
                await StorageService.deleteReport(reportId);
                // Refresh list
                setReports(prev => prev.filter(r => r.id !== reportId));
                alert('Relatório excluído com sucesso.');
            } catch (error) {
                console.error('Error deleting report:', error);
                alert('Erro ao excluir relatório.');
            }
        }
    };

    const completedReports = reports.filter(r => r.status === 'completed').length;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700' }}>Visão Geral</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Bem-vindo de volta, {currentUser?.email}.</p>
                </div>
                <Link to="/new-report" style={{ textDecoration: 'none' }}>
                    <button style={{
                        backgroundColor: 'var(--color-accent-primary)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        boxShadow: 'var(--shadow-glow)',
                        cursor: 'pointer'
                    }}>
                        <span>+</span> Novo Laudo
                    </button>
                </Link>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
                <StatCard
                    title="Laudos Emitidos"
                    value={completedReports}
                    icon="📄"
                    trend="+0%"
                    trendUp={true}
                />
                <StatCard
                    title="Clientes Ativos"
                    value="-"
                    icon="🏢"
                    trend="0"
                    trendUp={true}
                />
                <StatCard
                    title="Ações Pendentes"
                    value="-"
                    icon="⚠️"
                    trend="0"
                    trendUp={true}
                />
            </div>

            <RecentReports reports={reports} loading={loading} onDelete={handleDelete} />
        </div>
    );
};

export default Dashboard;
