import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';

const Header = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header style={{
            height: '64px',
            backgroundColor: 'var(--color-bg-primary)',
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

            <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    style={{
                        background: 'var(--color-bg-tertiary)',
                        border: 'none',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        transition: 'all 0.2s'
                    }}
                    title="Perfil do Usuário"
                >
                    <User size={20} />
                </button>

                {showDropdown && (
                    <div style={{
                        position: 'absolute',
                        top: '120%',
                        right: 0,
                        width: '240px',
                        backgroundColor: 'var(--color-bg-primary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        padding: 'var(--spacing-md)',
                        zIndex: 100
                    }}>
                        <div style={{
                            paddingBottom: 'var(--spacing-md)',
                            marginBottom: 'var(--spacing-md)',
                            borderBottom: '1px solid var(--color-border)'
                        }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>Conta Logada</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>
                                {currentUser?.email}
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-sm)',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--color-error)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 'var(--spacing-sm)',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <LogOut size={16} />
                            Sair
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
