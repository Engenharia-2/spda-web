import React from 'react';
import { useLocation } from 'react-router-dom';
import ReportList from '../../components/Report/ReportList';
import ReportForm from '../../components/Report/ReportForm';
import { useReports } from '../../hooks/Report/useReports';

const ReportsPage = () => {
    const location = useLocation();
    const isForm = location.pathname.includes('/new-report');

    // We only need the hook data if we are showing the list
    // ReportForm uses the hook internally, so we don't need to pass props to it
    const {
        filteredReports,
        listLoading,
        searchTerm,
        setSearchTerm,
        deleteReport,
    } = useReports();

    if (isForm) {
        return <ReportForm />;
    }

    return (
        <div className="container">
            <ReportList
                reports={filteredReports}
                loading={listLoading}
                onDelete={deleteReport}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                variant="full"
            />
        </div>
    );
};

export default ReportsPage;
