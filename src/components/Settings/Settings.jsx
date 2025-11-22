import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsService } from '../../services/SettingsService';

const Settings = () => {
    const { currentUser } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newItemLabel, setNewItemLabel] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (currentUser) {
                try {
                    const config = await SettingsService.getChecklistConfig(currentUser.uid);
                    if (config) {
                        setItems(config);
                    } else {
                        setItems(SettingsService.getDefaultChecklist());
                    }
                } catch (error) {
                    console.error('Error loading settings:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchSettings();
    }, [currentUser]);

    const handleToggleActive = (id) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, active: !item.active } : item
        ));
    };

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItemLabel.trim()) return;

        const newItem = {
            id: `custom_${Date.now()}`,
            label: newItemLabel,
            active: true,
            isDefault: false
        };

        setItems(prev => [...prev, newItem]);
        setNewItemLabel('');
    };

    const handleDeleteItem = (id) => {
        if (window.confirm('Tem certeza que deseja remover este item?')) {
            setItems(prev => prev.filter(item => item.id !== id));
        }
    };

    const handleSave = async () => {
        if (!currentUser) return;
        setSaving(true);
        try {
            await SettingsService.saveChecklistConfig(currentUser.uid, items);
            alert('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Erro ao salvar configurações.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando configurações...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700' }}>Configurações</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Personalize o checklist dos seus relatórios.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        backgroundColor: 'var(--color-accent-primary)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: '600',
                        cursor: saving ? 'wait' : 'pointer',
                        opacity: saving ? 0.7 : 1,
                        boxShadow: 'var(--shadow-glow)'
                    }}
                >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            <div style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                padding: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-lg)'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>Adicionar Novo Item</h2>
                <form onSubmit={handleAddItem} style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    <input
                        type="text"
                        value={newItemLabel}
                        onChange={(e) => setNewItemLabel(e.target.value)}
                        placeholder="Nome do item do checklist..."
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!newItemLabel.trim()}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-tertiary)',
                            color: 'var(--color-text-primary)',
                            fontWeight: '600',
                            cursor: !newItemLabel.trim() ? 'not-allowed' : 'pointer',
                            opacity: !newItemLabel.trim() ? 0.5 : 1
                        }}
                    >
                        Adicionar
                    </button>
                </form>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {items.map((item) => (
                    <div key={item.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--spacing-md)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        opacity: item.active ? 1 : 0.6
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                            <input
                                type="checkbox"
                                checked={item.active}
                                onChange={() => handleToggleActive(item.id)}
                                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: '500', textDecoration: item.active ? 'none' : 'line-through' }}>
                                {item.label}
                            </span>
                            {item.isDefault && (
                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '999px',
                                    backgroundColor: 'var(--color-bg-tertiary)',
                                    color: 'var(--color-text-muted)'
                                }}>
                                    Padrão
                                </span>
                            )}
                        </div>

                        {!item.isDefault && (
                            <button
                                onClick={() => handleDeleteItem(item.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-error)',
                                    cursor: 'pointer',
                                    padding: '0.5rem'
                                }}
                                title="Remover item"
                            >
                                🗑️
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Settings;
