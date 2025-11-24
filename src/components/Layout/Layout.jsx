import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const sidebarWidth = isMobile ? '0px' : '260px';

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar
                isMobile={isMobile}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <div style={{
                flex: 1,
                marginLeft: sidebarWidth,
                display: 'flex',
                flexDirection: 'column',
                transition: 'margin-left 0.3s ease'
            }}>
                <Header
                    isMobile={isMobile}
                    onMenuClick={toggleSidebar}
                />
                <main style={{
                    flex: 1,
                    padding: 'var(--spacing-xl)',
                    backgroundColor: 'var(--color-bg-primary)'
                }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
