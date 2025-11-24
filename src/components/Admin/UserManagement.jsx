import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import useMobile from '../../hooks/useMobile';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    const isMobile = useMobile();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const usersList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersList);
        } catch (error) {
            console.error("Error fetching users:", error);
            alert("Erro ao carregar usuários.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (userId, newStatus) => {
        try {
            await updateDoc(doc(db, 'users', userId), { status: newStatus });
            setUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, status: newStatus } : user
            ));
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Erro ao atualizar status.");
        }
    };

    const handleSubscriptionChange = async (userId, newPlan) => {
        try {
            await updateDoc(doc(db, 'users', userId), { subscription: newPlan });
            setUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, subscription: newPlan } : user
            ));
        } catch (error) {
            console.error("Error updating subscription:", error);
            alert("Erro ao atualizar plano.");
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        if (window.confirm(`Tem certeza que deseja alterar o nível de acesso deste usuário para ${newRole}?`)) {
            try {
                await updateDoc(doc(db, 'users', userId), { role: newRole });
                setUsers(prev => prev.map(user =>
                    user.id === userId ? { ...user, role: newRole } : user
                ));
            } catch (error) {
                console.error("Error updating role:", error);
                alert("Erro ao atualizar nível de acesso.");
            }
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando usuários...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: 'var(--spacing-xl)' }}>Gerenciamento de Usuários</h1>

            <div style={{
                backgroundColor: isMobile ? 'transparent' : 'var(--color-bg-secondary)',
                borderRadius: isMobile ? '0' : 'var(--radius-lg)',
                border: isMobile ? 'none' : '1px solid var(--color-border)',
                overflow: 'hidden'
            }}>
                {isMobile ? (
                    // Mobile Card View
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {users.map(user => (
                            <div key={user.id} style={{
                                backgroundColor: 'var(--color-bg-secondary)',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                            {user.email}
                                            {user.email === currentUser.email && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>(Você)</span>}
                                        </div>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            backgroundColor: user.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: user.status === 'approved' ? 'var(--color-success)' : 'var(--color-warning)'
                                        }}>
                                            {user.status === 'approved' ? 'Aprovado' : 'Pendente'}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Plano</label>
                                        <select
                                            value={user.subscription || 'free'}
                                            onChange={(e) => handleSubscriptionChange(user.id, e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--color-border)',
                                                backgroundColor: 'var(--color-bg-primary)',
                                                color: 'var(--color-text-primary)'
                                            }}
                                        >
                                            <option value="free">Free</option>
                                            <option value="pro">Pro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Acesso</label>
                                        <select
                                            value={user.role || 'user'}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            disabled={user.email === 'lucas@lhf.ind.br'}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--color-border)',
                                                backgroundColor: user.role === 'admin' ? 'rgba(37, 99, 235, 0.1)' : 'var(--color-bg-primary)',
                                                color: user.role === 'admin' ? 'var(--color-accent-primary)' : 'var(--color-text-primary)',
                                                fontWeight: user.role === 'admin' ? '600' : '400'
                                            }}
                                        >
                                            <option value="user">Usuário</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                                    {user.status !== 'approved' && (
                                        <button
                                            onClick={() => handleStatusChange(user.id, 'approved')}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                borderRadius: 'var(--radius-sm)',
                                                border: 'none',
                                                backgroundColor: 'var(--color-success)',
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Aprovar
                                        </button>
                                    )}
                                    {user.status === 'approved' && user.id !== currentUser.uid && (
                                        <button
                                            onClick={() => handleStatusChange(user.id, 'pending')}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--color-border)',
                                                backgroundColor: 'transparent',
                                                color: 'var(--color-text-muted)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Suspender
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Desktop Table View
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--color-bg-tertiary)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Email</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Status</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Plano</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Acesso</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        {user.email}
                                        {user.email === currentUser.email && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>(Você)</span>}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            backgroundColor: user.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: user.status === 'approved' ? 'var(--color-success)' : 'var(--color-warning)'
                                        }}>
                                            {user.status === 'approved' ? 'Aprovado' : 'Pendente'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <select
                                            value={user.subscription || 'free'}
                                            onChange={(e) => handleSubscriptionChange(user.id, e.target.value)}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--color-border)',
                                                backgroundColor: 'var(--color-bg-primary)',
                                                color: 'var(--color-text-primary)'
                                            }}
                                        >
                                            <option value="free">Free</option>
                                            <option value="pro">Pro</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <select
                                            value={user.role || 'user'}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            disabled={user.email === 'lucas@lhf.ind.br'} // Prevent locking yourself out if hardcoded
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--color-border)',
                                                backgroundColor: user.role === 'admin' ? 'rgba(37, 99, 235, 0.1)' : 'var(--color-bg-primary)',
                                                color: user.role === 'admin' ? 'var(--color-accent-primary)' : 'var(--color-text-primary)',
                                                fontWeight: user.role === 'admin' ? '600' : '400'
                                            }}
                                        >
                                            <option value="user">Usuário</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {user.status !== 'approved' && (
                                            <button
                                                onClick={() => handleStatusChange(user.id, 'approved')}
                                                style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    border: 'none',
                                                    backgroundColor: 'var(--color-success)',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    marginRight: '0.5rem'
                                                }}
                                            >
                                                Aprovar
                                            </button>
                                        )}
                                        {user.status === 'approved' && user.id !== currentUser.uid && (
                                            <button
                                                onClick={() => handleStatusChange(user.id, 'pending')}
                                                style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    border: '1px solid var(--color-border)',
                                                    backgroundColor: 'transparent',
                                                    color: 'var(--color-text-muted)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem'
                                                }}
                                            >
                                                Suspender
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
