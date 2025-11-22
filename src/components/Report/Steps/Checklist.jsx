import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { SettingsService } from '../../../services/SettingsService';

const Checklist = ({ data, updateData }) => {
    const { currentUser } = useAuth();
    const [checklistItems, setChecklistItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            if (currentUser) {
                try {
                    const config = await SettingsService.getChecklistConfig(currentUser.uid);
                    if (config) {
                        // Filter only active items
                        setChecklistItems(config.filter(item => item.active));
                    } else {
                        setChecklistItems(SettingsService.getDefaultChecklist());
                    }
                } catch (error) {
                    console.error('Error loading checklist config:', error);
                    // Fallback to default
                    setChecklistItems(SettingsService.getDefaultChecklist());
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchConfig();
    }, [currentUser]);

    const handleStatusChange = (itemId, status) => {
        const currentChecklist = data.checklist || {};
        updateData({
            checklist: {
                ...currentChecklist,
                [itemId]: { ...currentChecklist[itemId], status }
            }
        });
    };

    const handleObsChange = (itemId, obs) => {
        const currentChecklist = data.checklist || {};
        updateData({
            checklist: {
                ...currentChecklist,
                [itemId]: { ...currentChecklist[itemId], observation: obs }
            }
        });
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando checklist...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {checklistItems.map((item) => {
                const itemData = (data.checklist && data.checklist[item.id]) || {};

                return (
                    <div key={item.id} style={{
                        padding: 'var(--spacing-md)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-bg-primary)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{item.label}</h3>
                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                {['C', 'NC', 'NA'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(item.id, status)}
                                        style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--color-border)',
                                            backgroundColor: itemData.status === status
                                                ? (status === 'C' ? 'var(--color-success)' : status === 'NC' ? 'var(--color-error)' : 'var(--color-text-muted)')
                                                : 'transparent',
                                            color: itemData.status === status ? 'white' : 'var(--color-text-secondary)',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        {status === 'C' ? 'Conforme' : status === 'NC' ? 'Não Conforme' : 'N/A'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--spacing-md)' }}>
                            <input
                                type="text"
                                placeholder="Observações..."
                                value={itemData.observation || ''}
                                onChange={(e) => handleObsChange(item.id, e.target.value)}
                                style={{
                                    padding: 'var(--spacing-sm)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border)',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    color: 'var(--color-text-primary)',
                                    outline: 'none',
                                    fontSize: '0.875rem'
                                }}
                            />
                            <button style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-xs)',
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px dashed var(--color-border)',
                                backgroundColor: 'transparent',
                                color: 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}>
                                📷 Foto
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default Checklist;
