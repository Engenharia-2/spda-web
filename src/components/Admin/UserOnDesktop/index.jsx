import React from 'react';
import './styles.css';

/**
 * Componente de apresentação para visualização desktop (linha de tabela)
 * Renderiza informações de um usuário em formato de linha de tabela
 */
const UserOnDesktop = ({ user, currentUser, onStatusChange, onSubscriptionChange, onRoleChange }) => {
    return (
        <tr className="tr">
            <td className="td">
                {user.email}
                {user.email === currentUser.email && <span className="current-user-tag">(Você)</span>}
            </td>
            <td className="td">
                <span className={`status-badge ${user.status === 'approved' ? 'approved' : 'pending'}`}>
                    {user.status === 'approved' ? 'Aprovado' : 'Pendente'}
                </span>
            </td>
            <td className="td">
                <select
                    value={user.subscription || 'free'}
                    onChange={(e) => onSubscriptionChange(user.id, e.target.value)}
                    className="desktop-select"
                >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                </select>
            </td>
            <td className="td">
                <select
                    value={user.role || 'user'}
                    onChange={(e) => onRoleChange(user.id, e.target.value)}
                    disabled={user.email === 'lucas@lhf.ind.br'}
                    className={`desktop-select ${user.role === 'admin' ? 'admin' : ''}`}
                >
                    <option value="user">Usuário</option>
                    <option value="admin">Admin</option>
                </select>
            </td>
            <td className="td">
                {user.status !== 'approved' && (
                    <button
                        onClick={() => onStatusChange(user.id, 'approved')}
                        className="desktop-btn desktop-btn-approve"
                    >
                        Aprovar
                    </button>
                )}
                {user.status === 'approved' && user.id !== currentUser.uid && (
                    <button
                        onClick={() => onStatusChange(user.id, 'pending')}
                        className="desktop-btn desktop-btn-suspend"
                    >
                        Suspender
                    </button>
                )}
            </td>
        </tr>
    );
};

export default UserOnDesktop;
