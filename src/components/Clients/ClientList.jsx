import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ClientService } from '../../services/ClientService';

const ClientList = () => {
    const { currentUser } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchClients = async () => {
            if (currentUser) {
                try {
                    const data = await ClientService.getUserClients(currentUser.uid);
                    setClients(data);
                } catch (error) {
                    console.error('Error fetching clients:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchClients();
    }, [currentUser]);

    const handleDelete = async (clientId) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
            try {
                await ClientService.deleteClient(clientId);
                setClients(prev => prev.filter(c => c.id !== clientId));
                alert('Cliente excluído com sucesso.');
            } catch (error) {
                console.error('Error deleting client:', error);
                alert('Erro ao excluir cliente.');
            }
        }
    };

    const filteredClients = clients.filter(client =>
        (client.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (client.contactName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700' }}>Meus Clientes</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Gerencie sua base de clientes.</p>
                </div>
                <Link to="/client-form" style={{ textDecoration: 'none' }}>
                    <button style={{
                        backgroundColor: 'var(--color-accent-primary)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        boxShadow: 'var(--shadow-glow)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                    }}>
                        <span>+</span> Novo Cliente
                    </button>
                </Link>
            </div>

            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <input
                    type="text"
                    placeholder="Buscar por nome ou contato..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        maxWidth: '400px',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)'
                    }}
                />
            </div>

            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando clientes...</div>
            ) : filteredClients.length === 0 ? (
                <div style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    padding: '3rem',
                    textAlign: 'center'
                }}>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        {searchTerm ? 'Nenhum cliente encontrado para sua busca.' : 'Você ainda não tem clientes cadastrados.'}
                    </p>
                    {!searchTerm && (
                        <Link to="/client-form">
                            <button style={{
                                backgroundColor: 'var(--color-accent-primary)',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer'
                            }}>
                                Cadastrar Primeiro Cliente
                            </button>
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="desktop-view" style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                        overflow: 'hidden',
                        display: isMobile ? 'none' : 'block'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-tertiary)' }}>
                                        <th style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Nome</th>
                                        <th style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Contato</th>
                                        <th style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Email</th>
                                        <th style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Telefone</th>
                                        <th style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClients.map((client) => (
                                        <tr key={client.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: 'var(--spacing-md)', fontWeight: '500' }}>{client.name}</td>
                                            <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>{client.contactName || '-'}</td>
                                            <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>{client.email || '-'}</td>
                                            <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>{client.phone || '-'}</td>
                                            <td style={{ padding: 'var(--spacing-md)', display: 'flex', gap: '0.5rem' }}>
                                                <Link to={`/client-form?id=${client.id}`} style={{ textDecoration: 'none' }}>
                                                    <button style={{ background: 'none', border: 'none', color: 'var(--color-accent-primary)', cursor: 'pointer', fontWeight: '500' }}>
                                                        Editar
                                                    </button>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(client.id)}
                                                    style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontWeight: '500' }}
                                                >
                                                    Excluir
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="mobile-view" style={{ display: isMobile ? 'flex' : 'none', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        {filteredClients.map((client) => (
                            <div key={client.id} style={{
                                backgroundColor: 'var(--color-bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                padding: 'var(--spacing-md)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-sm)' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>{client.name}</h3>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{client.contactName}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Link to={`/client-form?id=${client.id}`} style={{ textDecoration: 'none' }}>
                                            <button style={{
                                                padding: '0.25rem 0.5rem',
                                                background: 'rgba(56, 189, 248, 0.1)',
                                                border: 'none',
                                                borderRadius: 'var(--radius-sm)',
                                                color: 'var(--color-accent-primary)',
                                                cursor: 'pointer'
                                            }}>
                                                ✏️
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(client.id)}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: 'none',
                                                borderRadius: 'var(--radius-sm)',
                                                color: 'var(--color-error)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                        <span>📧</span> {client.email || '-'}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                        <span>📱</span> {client.phone || '-'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ClientList;
