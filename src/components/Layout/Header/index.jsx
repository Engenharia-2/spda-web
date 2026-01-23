import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, Menu, Sun, Moon } from 'lucide-react';
import { useLayout } from '../../../contexts/LayoutContext';
import { useTheme } from '../../../contexts/ThemeContext/ThemeContext';
import './styles.css';

const Header = ({ isMobile, onMenuClick }) => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { isDropdownOpen, setIsDropdownOpen, dropdownRef } = useLayout();
    const { theme, toggleTheme } = useTheme();

    const getPageTitle = () => {
        const { pathname, search } = location;
        const params = new URLSearchParams(search);
        const hasId = params.has('id');

        switch (pathname) {
            case '/':
                return 'Dashboard';
            case '/reports':
                return 'Relatórios';
            case '/new-report':
                return hasId ? 'Editar Laudo' : 'Novo Laudo';
            case '/clients':
                return 'Clientes';
            case '/client-form':
                return hasId ? 'Editar Cliente' : 'Novo Cliente';
            case '/settings':
                return 'Configurações';
            case '/admin':
                return 'Administrador';
            default:
                return 'Dashboard';
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    return (
        <header className="app-header">
            <div className="header-title-section">
                {isMobile && (
                    <button
                        onClick={onMenuClick}
                        className="menu-btn"
                    >
                        <Menu size={24} />
                    </button>
                )}
                <h2 className="header-title">{getPageTitle()}</h2>
            </div>

            <div className="header-actions">
                <button
                    onClick={toggleTheme}
                    className="theme-toggle-btn"
                    title={`Alternar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className="profile-dropdown-container" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="profile-btn"
                        title="Perfil do Usuário"
                    >
                        {currentUser?.photoURL ? (
                            <img src={currentUser.photoURL} alt="Avatar" className="profile-avatar-icon" />
                        ) : (
                            <User size={20} />
                        )}
                    </button>

                    {isDropdownOpen && (
                        <div className="dropdown-menu">
                            <div className="dropdown-header">
                                <div className="dropdown-label">Conta Logada</div>
                                <div className="dropdown-user-email">
                                    {currentUser?.email}
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="logout-btn"
                            >
                                <LogOut size={16} />
                                Sair
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
