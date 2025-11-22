import React from 'react';

const Header = () => {
    return (
        <header style={{
            height: '64px',
            backgroundColor: 'var(--color-bg-primary)', // Transparent/Primary to blend
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--spacing-xl)',
            position: 'sticky',
            top: 0,
            zIndex: 5
        }}>
            <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Dashboard</h2>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <button style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    fontSize: '1.25rem',
                    cursor: 'pointer'
                }}>
                    🔔
                </button>
                <button style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    fontSize: '1.25rem',
                    cursor: 'pointer'
                }}>
                    ❓
                </button>
            </div>
        </header>
    );
};

export default Header;
