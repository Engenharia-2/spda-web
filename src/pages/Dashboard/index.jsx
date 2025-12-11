import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ClientService } from '../../services/ClientService';
import { useReports } from '../../hooks/Report/useReports';
import StatCard from '../../components/Dashboard/StatCard';
import ReportList from '../../components/Report/ReportList';
import './styles.css';

const Dashboard = () => {
    const { currentUser } = useAuth();
    const {
        filteredReports: reports,
        listLoading: loading,
        deleteReport
    } = useReports();

    const [clientsCount, setClientsCount] = useState(0);

    // Fetch clients count for dashboard statistics
    useEffect(() => {
        const fetchClients = async () => {
            if (currentUser) {
                try {
                    const clientsData = await ClientService.getUserClients(currentUser.uid);
                    setClientsCount(clientsData.length);
                } catch (error) {
                    console.error('Error fetching clients:', error);
                }
            }
        };
        fetchClients();
    }, [currentUser]);

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
                onDelete={deleteReport}
                variant="dashboard"
            />
        </div>
    );
};

export default Dashboard;
