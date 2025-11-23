import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsCollapsed(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const sidebarWidth = isCollapsed ? '80px' : '260px';

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar isCollapsed={isCollapsed} />
            <div style={{
                flex: 1,
                marginLeft: sidebarWidth,
                display: 'flex',
                flexDirection: 'column',
                transition: 'margin-left 0.3s ease'
            }}>
                <Header />
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
