import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { StorageService } from '../../services/StorageService';
import { ClientService } from '../../services/ClientService';
import StatCard from '../../components/Dashboard/StatCard';
import ReportList from '../../components/Report/ReportList';
import './styles.css';

const Dashboard = () => {
    const { currentUser } = useAuth();
    const [reports, setReports] = useState([]);
    const [clientsCount, setClientsCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (currentUser) {
            try {
                const [reportsData, clientsData] = await Promise.all([
                    StorageService.getUserReports(currentUser.uid),
                    ClientService.getUserClients(currentUser.uid)
                ]);
                setReports(reportsData);
                setClientsCount(clientsData.length);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchData();
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
    const pendingReports = reports.filter(r => r.status === 'draft').length;

    return (
        <div className="container">
            <div className="header">
                <div className="header-title-group">
                    <h1 className="page-title">Visão Geral</h1>
                    <p className="page-subtitle">Bem-vindo de volta, {currentUser?.email}.</p>
                </div>
                <Link to="/new-report" style={{ textDecoration: 'none' }} className="new-report-link">
                    <button className="new-report-btn">
                        <span>+</span> Novo Laudo
                    </button>
                </Link>
            </div>

            <div className="stats-grid">
                <StatCard
                    title="Laudos Emitidos"
                    value={completedReports}
                    icon="📄"
                    trend="+0%"
                    trendUp={true}
                />
                <StatCard
                    title="Clientes Ativos"
                    value={clientsCount}
                    icon="🏢"
                    trend="0"
                    trendUp={true}
                />
                <StatCard
                    title="Ações Pendentes"
                    value={pendingReports}
                    icon="⚠️"
                    trend="0"
                    trendUp={true}
                />
            </div>

            <ReportList
                reports={reports}
                loading={loading}
                onDelete={handleDelete}
                variant="dashboard"
            />
        </div>
    );
};

export default Dashboard;
