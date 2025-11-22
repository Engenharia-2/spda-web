import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <div style={{
                flex: 1,
                marginLeft: '260px', // Width of sidebar
                display: 'flex',
                flexDirection: 'column'
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
