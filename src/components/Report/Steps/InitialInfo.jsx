import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { ClientService } from '../../../services/ClientService';

const InitialInfo = ({ data, updateData }) => {
    const { currentUser } = useAuth();
    const [clients, setClients] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const fetchClients = async () => {
            if (currentUser) {
                try {
                    const fetchedClients = await ClientService.getUserClients(currentUser.uid);
                    setClients(fetchedClients);
                } catch (error) {
                    console.error('Error fetching clients:', error);
                }
            }
        };
        fetchClients();
    }, [currentUser]);

    const handleClientSelect = (client) => {
        updateData({
            client: client.name,
            clientRep: client.contactName || '',
            address: client.address || ''
        });
        setShowSuggestions(false);
    };

    const handleClientChange = (e) => {
        const value = e.target.value;
        updateData({ client: value });
        setShowSuggestions(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        updateData({ [name]: value });
    };

    const filteredClients = clients.filter(client =>
        (client.name || '').toLowerCase().includes((data.client || '').toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', position: 'relative' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Cliente</label>

                    <input
                        type="text"
                        name="client"
                        value={data.client || ''}
                        onChange={handleClientChange}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="Nome da Empresa / Cliente"
                        autoComplete="off"
                        style={{
                            padding: 'var(--spacing-md)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            outline: 'none',
                            width: '100%'
                        }}
                    />

                    {/* Autocomplete Suggestions */}
                    {showSuggestions && filteredClients.length > 0 && (data.client || '').length > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            marginTop: '4px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            zIndex: 10,
                            boxShadow: 'var(--shadow-md)'
                        }}>
                            {filteredClients.map(client => (
                                <div
                                    key={client.id}
                                    onClick={() => handleClientSelect(client)}
                                    style={{
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid var(--color-border)',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <div style={{ fontWeight: '500' }}>{client.name}</div>
                                    {client.contactName && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            Contato: {client.contactName}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Representante do Cliente</label>
                    <input
                        type="text"
                        name="clientRep"
                        value={data.clientRep || ''}
                        onChange={handleChange}
                        placeholder="Nome do contato"
                        style={{
                            padding: 'var(--spacing-md)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            outline: 'none',
                            width: '100%'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Responsável Técnico</label>
                    <input
                        type="text"
                        name="engineer"
                        value={data.engineer || ''}
                        onChange={handleChange}
                        placeholder="Engenheiro Responsável"
                        style={{
                            padding: 'var(--spacing-md)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            outline: 'none'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Prestador de Serviço</label>
                    <input
                        type="text"
                        name="provider"
                        value={data.provider || ''}
                        onChange={handleChange}
                        placeholder="Empresa Executora"
                        style={{
                            padding: 'var(--spacing-md)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Data</label>
                    <input
                        type="date"
                        name="date"
                        value={data.date || ''}
                        onChange={handleChange}
                        style={{
                            padding: 'var(--spacing-md)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            outline: 'none'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Início</label>
                    <input
                        type="time"
                        name="startTime"
                        value={data.startTime || ''}
                        onChange={handleChange}
                        style={{
                            padding: 'var(--spacing-md)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            outline: 'none'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Fim</label>
                    <input
                        type="time"
                        name="endTime"
                        value={data.endTime || ''}
                        onChange={handleChange}
                        style={{
                            padding: 'var(--spacing-md)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default InitialInfo;
