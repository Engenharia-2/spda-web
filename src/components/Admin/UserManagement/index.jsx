import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import useResponsive from '../../../hooks/useResponsive';
import useUserManagement from '../../../hooks/useUserManagement';
import UserOnMobile from '../UserOnMobile';
import UserOnDesktop from '../UserOnDesktop';
import './styles.css';

/**
 * Componente principal de gerenciamento de usuários
 * Orquestra a visualização mobile/desktop usando componentes de apresentação
 */
const UserManagement = () => {
    const { currentUser } = useAuth();
    const { isMobileLayout: isMobile } = useResponsive();
    const { users, loading, handleStatusChange, handleSubscriptionChange, handleRoleChange } = useUserManagement();

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando usuários...</div>;
    }

    return (
        <div className="container">
            <h1 className="title">Gerenciamento de Usuários</h1>

            <div className={`list-container ${isMobile ? 'mobile' : ''}`}>
                {isMobile ? (
                    // Mobile Card View
                    <div className="mobile-list">
                        {users.map(user => (
                            <UserOnMobile
                                key={user.id}
                                user={user}
                                currentUser={currentUser}
                                onStatusChange={handleStatusChange}
                                onSubscriptionChange={handleSubscriptionChange}
                                onRoleChange={handleRoleChange}
                            />
                        ))}
                    </div>
                ) : (
                    // Desktop Table View
                    <table className="table">
                        <thead>
                            <tr className="thead-tr">
                                <th className="th">Email</th>
                                <th className="th">Status</th>
                                <th className="th">Plano</th>
                                <th className="th">Acesso</th>
                                <th className="th">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <UserOnDesktop
                                    key={user.id}
                                    user={user}
                                    currentUser={currentUser}
                                    onStatusChange={handleStatusChange}
                                    onSubscriptionChange={handleSubscriptionChange}
                                    onRoleChange={handleRoleChange}
                                />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
