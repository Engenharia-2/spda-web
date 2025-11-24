import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, FileText, Users, Settings, Shield, Zap } from 'lucide-react';

const Sidebar = ({ isMobile, isOpen, onClose }) => {
    const location = useLocation();
    const { currentUser } = useAuth();

    const menuItems = [
        { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
        { label: 'Relatórios', icon: <FileText size={20} />, path: '/reports' },
        { label: 'Clientes', icon: <Users size={20} />, path: '/clients' },
        { label: 'Configurações', icon: <Settings size={20} />, path: '/settings' },
    ];

    if (currentUser && currentUser.role === 'admin') {
        menuItems.push({ label: 'Admin', icon: <Shield size={20} />, path: '/admin' });
    }

    // Overlay for mobile
    const Overlay = () => (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 9,
                display: isMobile && isOpen ? 'block' : 'none'
            }}
        />
    );

    return (
        <>
            <Overlay />
            <aside style={{
                width: '260px',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 10,
                transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
                transition: 'transform 0.3s ease',
                boxShadow: isMobile && isOpen ? 'var(--shadow-xl)' : 'none'
            }}>
                <div style={{
                    height: '64px',
                    padding: '0 var(--spacing-lg)',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 'var(--spacing-sm)'
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        flexShrink: 0
                    }}>
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <span style={{
                        fontWeight: '700',
                        fontSize: '1.25rem',
                        color: 'var(--color-text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden'
                    }}>
                        SPDA Reports
                    </span>
                </div>

                <nav style={{ flex: 1, padding: 'var(--spacing-md)' }}>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <li key={item.label}>
                                    <Link
                                        to={item.path}
                                        onClick={() => isMobile && onClose()}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-start',
                                            gap: 'var(--spacing-md)',
                                            padding: 'var(--spacing-md)',
                                            borderRadius: 'var(--radius-md)',
                                            color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                            backgroundColor: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                                            borderLeft: isActive ? '3px solid var(--color-accent-primary)' : '3px solid transparent',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <span>{item.icon}</span>
                                        <span style={{ fontWeight: isActive ? '600' : '400' }}>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside >
        </>
    );
};

export default Sidebar;
