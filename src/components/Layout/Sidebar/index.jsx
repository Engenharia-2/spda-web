import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { LayoutDashboard, FileText, Users, Settings, Shield, Omega} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext/ThemeContext';
import './styles.css';

const Sidebar = ({ isMobile, isOpen, onClose }) => {
    const location = useLocation();
    const { currentUser } = useAuth();
    const { theme } = useTheme();

    const menuItems = [
        { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
        { label: 'Relatórios', icon: <FileText size={20} />, path: '/reports' },
        { label: 'Clientes', icon: <Users size={20} />, path: '/clients' },
        { label: 'Configurações', icon: <Settings size={20} />, path: '/settings' },
        { label: 'Medições', icon: <Omega size={20} />, path: '/measurement' },
    ];

    if (currentUser && currentUser.role === 'admin') {
        menuItems.push({ label: 'Admin', icon: <Shield size={20} />, path: '/admin' });
    }

    // Overlay for mobile
    const Overlay = () => (
        <div
            onClick={onClose}
            className="sidebar-overlay"
            style={{ display: isMobile && isOpen ? 'block' : 'none' }}
        />
    );

    return (
        <>
            <Overlay />
            <aside
                className="sidebar-aside"
                style={{
                    transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
                    boxShadow: isMobile && isOpen ? 'var(--shadow-xl)' : 'none'
                }}
            >
                <div className="sidebar-header">
                    <div className="logo-container">
                        <img
                            src={theme === 'dark' ? '/LogoLight.png' : '/LogoDark.png'}
                            alt="Logo LHF"
                            className="sidebar-logo"
                        />
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul className="nav-list">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <li key={item.label}>
                                    <Link
                                        to={item.path}
                                        onClick={() => isMobile && onClose()}
                                        className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                                    >
                                        <span>{item.icon}</span>
                                        <span className={isActive ? 'nav-link-text-active' : 'nav-link-text'}>{item.label}</span>
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
