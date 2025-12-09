import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/index';
import Header from '../Header/index';
import { useLayout } from '../../../contexts/LayoutContext';
import SACButton from '../SACButton';
import './styles.css';

const Layout = () => {
    const { isMobile, isSidebarOpen, toggleSidebar } = useLayout();

    const sidebarWidth = isMobile ? '0px' : '260px';

    return (
        <div className="layout-container">
            <Sidebar
                isMobile={isMobile}
                isOpen={isSidebarOpen}
                onClose={() => toggleSidebar(false)} // Can also just toggle
            />
            <div
                className="main-content-wrapper"
                style={{ marginLeft: sidebarWidth }}
            >
                <Header
                    isMobile={isMobile}
                    onMenuClick={toggleSidebar}
                />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
            <SACButton />
        </div>
    );
};

export default Layout;
