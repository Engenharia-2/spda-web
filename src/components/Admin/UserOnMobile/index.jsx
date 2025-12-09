import React from 'react';
import './styles.css';

/**
 * Componente de apresentação para visualização mobile (card)
 * Renderiza informações de um usuário em formato de card
 */
const UserOnMobile = ({ user, currentUser, onStatusChange, onSubscriptionChange, onRoleChange }) => {
    return (
        <div className="mobile-card">
            <div className="card-header">
                <div>
                    <div className="user-email">
                        {user.email}
                        {user.email === currentUser.email && <span className="current-user-tag">(Você)</span>}
                    </div>
                    <span className={`status-badge ${user.status === 'approved' ? 'approved' : 'pending'}`}>
                        {user.status === 'approved' ? 'Aprovado' : 'Pendente'}
                    </span>
                </div>
            </div>

            <div className="card-controls">
                <div>
                    <label className="control-label">Plano</label>
                    <select
                        value={user.subscription || 'free'}
                        onChange={(e) => onSubscriptionChange(user.id, e.target.value)}
                        className="select-input"
                    >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                    </select>
                </div>
                <div>
                    <label className="control-label">Acesso</label>
                    <select
                        value={user.role || 'user'}
                        onChange={(e) => onRoleChange(user.id, e.target.value)}
                        disabled={user.email === 'lucas@lhf.ind.br'}
                        className={`select-input ${user.role === 'admin' ? 'admin' : ''}`}
                    >
                        <option value="user">Usuário</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>

            <div className="card-actions">
                {user.status !== 'approved' && (
                    <button
                        onClick={() => onStatusChange(user.id, 'approved')}
                        className="btn btn-approve"
                    >
                        Aprovar
                    </button>
                )}
                {user.status === 'approved' && user.id !== currentUser.uid && (
                    <button
                        onClick={() => onStatusChange(user.id, 'pending')}
                        className="btn btn-suspend"
                    >
                        Suspender
                    </button>
                )}
            </div>
        </div>
    );
};

export default UserOnMobile;
