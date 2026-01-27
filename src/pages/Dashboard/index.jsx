import React from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/Dashboard/StatCard';
import ReportList from '../../components/Report/ReportList';
import './styles.css';
import { Calendar, HardDrive, FileClock } from 'lucide-react';
import { useDashboardStats } from '../../hooks/Dashboard/useDashboardStats';

const Dashboard = () => {
    const { isLoading, stats, currentUser, deleteReport } = useDashboardStats();

    if (isLoading) {
        return (
            <div className="container">
                <div className="header">
                    <h1 className="page-title">Visão Geral</h1>
                </div>
                <p>Carregando estatísticas...</p>
            </div>
        );
    }

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
                    title="Relatórios Pendentes"
                    value={stats.pendingReportsCount}
                    icon={<FileClock />}
                />
                <StatCard
                    title="Uso do Armazenamento"
                    value={stats.storage.usagePercentage}
                    icon={<HardDrive />}
                    borderColor={stats.storage.borderColor}
                />
                {stats.displayedEquipment && (
                    <StatCard
                        title={`Equipamento: ${stats.displayedEquipment.equipmentName}`}
                        subtitle={'Validade:'}
                        value={stats.validityStatus.value}
                        icon={<Calendar />}
                        borderColor={stats.validityStatus.borderColor}
                    />
                )}
            </div>

            <ReportList
                reports={stats.reports}
                loading={isLoading}
                onDelete={deleteReport}
                variant="dashboard"
            />
        </div>
    );
};

export default Dashboard;
