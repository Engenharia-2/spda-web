import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ClientService } from '../../services/ClientService';
import { useReports } from '../Report/useReports';
import { useEquipmentSettings } from '../Settings/ReportData/useEquipmentSettings';
import { getStorageLimit } from '../../utils/storageLimits';
import {
    calculateValidityStatus,
    calculateStorageUsage,
    countReportsByStatus,
    countCompletedReportsByMonth
} from '../../utils/cardFunctions';

// Helper to determine the color based on metric type and value
const getBorderColor = (metricType, value) => {
    if (value === undefined || value === null) return null;

    switch (metricType) {
        case 'storage': {
            if (value < 50) return 'var(--color-success)'; // Green
            if (value < 75) return '#FFD700'; 
            if (value < 90) return '#fd7e14';             // Yellow
            return 'var(--color-error)';                  // Red
        }
        case 'validity': {
            // Here, 'value' is the status code from calculateValidityStatus's percentage
            if (value <= 25) return 'var(--color-success)'; // Green
            if (value <= 50) return '#FFD700';             // Yellow
            if (value <= 75) return '#fd7e14';             // Orange
            return 'var(--color-error)';                  // Red
        }
        default:
            return null;
    }
};

export const useDashboardStats = () => {
    const { currentUser } = useAuth();
    const {
        filteredReports: reports,
        listLoading: reportsLoading,
        deleteReport
    } = useReports();
    const { equipmentList, loading: equipmentLoading } = useEquipmentSettings();

    const [clientsCount, setClientsCount] = useState(0);
    const [clientsLoading, setClientsLoading] = useState(true);
    const [currentEquipmentIndex, setCurrentEquipmentIndex] = useState(0);

    // Equipment rotation effect
    useEffect(() => {
        if (equipmentList && equipmentList.length > 1) {
            const intervalId = setInterval(() => {
                setCurrentEquipmentIndex(prevIndex =>
                    (prevIndex + 1) % equipmentList.length
                );
            }, 10000);

            return () => clearInterval(intervalId);
        }
    }, [equipmentList]);

    // Fetch clients count
    useEffect(() => {
        const fetchClients = async () => {
            if (currentUser) {
                try {
                    setClientsLoading(true);
                    const clientsData = await ClientService.getUserClients(currentUser.uid);
                    setClientsCount(clientsData.length);
                } catch (error) {
                    console.error('Error fetching clients:', error);
                } finally {
                    setClientsLoading(false);
                }
            } else {
                setClientsLoading(false);
            }
        };
        fetchClients();
    }, [currentUser]);

    // --- Derived stats ---
    const totalCompletedReports = countReportsByStatus(reports, 'completed');
    const pendingReportsCount = countReportsByStatus(reports, 'draft');

    const totalStorageLimit = getStorageLimit(currentUser?.subscription);
    const storageStats = calculateStorageUsage(currentUser, totalStorageLimit);
    storageStats.borderColor = getBorderColor('storage', storageStats.numericPercentage);

    const displayedEquipment = equipmentList?.[currentEquipmentIndex];
    const validityStats = calculateValidityStatus(displayedEquipment?.calibrationValidity);
    validityStats.borderColor = getBorderColor('validity', validityStats.percentage);

    // --- Trend Calculation for Reports ---
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12

    const prevMonthDate = new Date(new Date().setMonth(today.getMonth() - 1));
    const prevMonth = prevMonthDate.getMonth() + 1; // 1-12
    const prevMonthYear = prevMonthDate.getFullYear();

    const reportsThisMonth = countCompletedReportsByMonth(reports, currentYear, currentMonth);
    const reportsLastMonth = countCompletedReportsByMonth(reports, prevMonthYear, prevMonth);

    let reportTrend = '0%';
    let reportTrendUp = null; // null for no change

    if (reportsLastMonth > 0) {
        const percentageChange = ((reportsThisMonth - reportsLastMonth) / reportsLastMonth) * 100;
        if (percentageChange !== 0) {
            reportTrend = `${percentageChange > 0 ? '+' : ''}${percentageChange.toFixed(0)}%`;
        }
        reportTrendUp = percentageChange > 0;
    } else if (reportsThisMonth > 0) {
        reportTrend = '+100%'; // From 0 to >0 is a significant increase
        reportTrendUp = true;
    }

    const isLoading = reportsLoading || equipmentLoading || clientsLoading;

    return {
        isLoading,
        stats: {
            totalCompletedReports,
            pendingReportsCount,
            clientsCount,
            storage: storageStats,
            displayedEquipment,
            validityStatus: validityStats,
            reports,
            // Monthly trend stats
            reportsThisMonth,
            reportTrend,
            reportTrendUp,
        },
        currentUser,
        deleteReport,
    };
};
