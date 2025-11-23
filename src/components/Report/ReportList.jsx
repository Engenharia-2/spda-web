import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { StorageService } from '../../services/StorageService';

const ReportList = () => {
    const { currentUser } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
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

        fetchReports();
    }, [currentUser]);

    const handleDelete = async (reportId) => {
        if (window.confirm('Tem certeza que deseja excluir este relatório?')) {
            try {
                await StorageService.deleteReport(reportId);
                setReports(prev => prev.filter(r => r.id !== reportId));
                alert('Relatório excluído com sucesso.');
            } catch (error) {
                console.error('Error deleting report:', error);
                alert('Erro ao excluir relatório.');
            }
        }
    };

    const filteredReports = reports.filter(report =>
        (report.client?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (report.engineer?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700' }}>Meus Relatórios</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Gerencie todos os seus laudos de SPDA.</p>
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
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}>
                        <span>+</span> Novo Laudo
                    </button>
                </Link>
            </div>

            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <input
                    type="text"
                    placeholder="Buscar por cliente ou responsável..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        maxWidth: '400px',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)'
                    }}
                />
            </div>

            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando laudos...</div>
            ) : filteredReports.length === 0 ? (
                <div style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    padding: '3rem',
                    textAlign: 'center'
                }}>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        {searchTerm ? 'Nenhum relatório encontrado para sua busca.' : 'Você ainda não tem relatórios.'}
                    </p>
                    {!searchTerm && (
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
                    )}
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="desktop-view" style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        overflow: 'hidden',
                        display: isMobile ? 'none' : 'block'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-tertiary)' }}>
                                        <th style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Cliente</th>
                                        <th style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Data</th>
                                        <th style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Status</th>
                                        <th style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Responsável</th>
                                        <th style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.map((report) => (
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
                                                    onClick={() => handleDelete(report.id)}
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

                    {/* Mobile Card View */}
                    <div className="mobile-view" style={{ display: isMobile ? 'flex' : 'none', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        {filteredReports.map((report) => (
                            <div key={report.id} style={{
                                backgroundColor: 'var(--color-bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                padding: 'var(--spacing-md)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-sm)' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>{report.client || 'Sem Cliente'}</h3>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                            {report.updatedAt?.seconds ? new Date(report.updatedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Link to={`/new-report?id=${report.id}`} style={{ textDecoration: 'none' }}>
                                            <button style={{
                                                padding: '0.25rem 0.5rem',
                                                background: 'rgba(56, 189, 248, 0.1)',
                                                border: 'none',
                                                borderRadius: 'var(--radius-sm)',
                                                color: 'var(--color-accent-primary)',
                                                cursor: 'pointer'
                                            }}>
                                                ✏️
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(report.id)}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: 'none',
                                                borderRadius: 'var(--radius-sm)',
                                                color: 'var(--color-error)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-sm)' }}>
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
                                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                        Resp: {report.engineer || 'Eu'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ReportList;
