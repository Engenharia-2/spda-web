import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsService } from '../../services/SettingsService';
import { SyncService } from '../../services/SyncService';

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

    const [storageMode, setStorageMode] = useState(localStorage.getItem('storageMode') || 'cloud');

    // Enforce Free Plan limits
    useEffect(() => {
        if (currentUser && currentUser.subscription === 'free' && storageMode === 'cloud') {
            setStorageMode('local');
            localStorage.setItem('storageMode', 'local');
        }
    }, [currentUser, storageMode]);

    const handleStorageModeChange = (mode) => {
        if (currentUser?.subscription === 'free' && mode === 'cloud') {
            alert('O armazenamento em nuvem está disponível apenas no plano Pro.');
            return;
        }

        console.log(`[Settings.jsx] Changing storage mode to: ${mode}`);
        setStorageMode(mode);
        localStorage.setItem('storageMode', mode);
        alert(`Modo de armazenamento alterado para: ${mode.toUpperCase()}. A mudança será aplicada nas próximas operações.`);
    };

    // Sync Logic
    const [syncing, setSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState('');

    const handleSyncLocalToCloud = async () => {
        if (!currentUser) return;
        if (currentUser.subscription === 'free') {
            alert('A sincronização com a nuvem é exclusiva para usuários Pro.');
            return;
        }
        if (!window.confirm('Isso enviará todos os seus relatórios locais para a nuvem. Deseja continuar?')) return;

        setSyncing(true);
        setSyncProgress('Iniciando upload...');
        try {
            const result = await SyncService.syncLocalToCloud(currentUser.uid, (current, total) => {
                setSyncProgress(`Enviando relatório ${current} de ${total}...`);
            });
            alert(`Sincronização concluída! ${result.count} relatórios enviados.`);
        } catch (error) {
            console.error(error);
            alert('Erro na sincronização. Verifique o console.');
        } finally {
            setSyncing(false);
            setSyncProgress('');
        }
    };

    const handleSyncCloudToLocal = async () => {
        if (!currentUser) return;
        if (!window.confirm('Isso baixará todos os relatórios da nuvem para este dispositivo. Deseja continuar?')) return;

        setSyncing(true);
        setSyncProgress('Iniciando download...');
        try {
            const result = await SyncService.syncCloudToLocal(currentUser.uid, (current, total) => {
                setSyncProgress(`Baixando relatório ${current} de ${total}...`);
            });
            alert(`Download concluído! ${result.count} relatórios baixados.`);
        } catch (error) {
            console.error(error);
            alert('Erro no download. Verifique o console.');
        } finally {
            setSyncing(false);
            setSyncProgress('');
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Carregando configurações...</div>;

    const isFreePlan = currentUser?.subscription === 'free';

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

            {/* Subscription Badge */}
            <div style={{
                marginBottom: 'var(--spacing-lg)',
                padding: 'var(--spacing-md)',
                backgroundColor: isFreePlan ? 'var(--color-bg-secondary)' : 'rgba(37, 99, 235, 0.1)',
                border: `1px solid ${isFreePlan ? 'var(--color-border)' : 'var(--color-accent-primary)'}`,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <span style={{ fontWeight: '600', marginRight: '0.5rem' }}>Seu Plano:</span>
                    <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        backgroundColor: isFreePlan ? 'var(--color-text-muted)' : 'var(--color-accent-primary)',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                    }}>
                        {currentUser?.subscription || 'Free'}
                    </span>
                </div>
                {isFreePlan && (
                    <button style={{
                        backgroundColor: 'var(--color-accent-primary)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }} onClick={() => alert('Entre em contato com o administrador para fazer o upgrade!')}>
                        Fazer Upgrade 🚀
                    </button>
                )}
            </div>

            {/* Storage Mode Section */}
            <div style={{
                backgroundColor: 'var(--color-bg-secondary)',
                padding: 'var(--spacing-xl)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                marginBottom: 'var(--spacing-xl)'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>Armazenamento de Dados</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)' }}>
                    Escolha onde seus relatórios e fotos serão salvos.
                </p>

                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    <button
                        onClick={() => handleStorageModeChange('cloud')}
                        disabled={isFreePlan}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            border: storageMode === 'cloud' ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
                            backgroundColor: storageMode === 'cloud' ? 'rgba(37, 99, 235, 0.1)' : 'var(--color-bg-primary)',
                            cursor: isFreePlan ? 'not-allowed' : 'pointer',
                            textAlign: 'left',
                            opacity: isFreePlan ? 0.5 : 1,
                            position: 'relative'
                        }}
                    >
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                            ☁️ Nuvem (Cloud) {isFreePlan && '🔒'}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            Acesse de qualquer lugar. Requer internet.
                        </div>
                    </button>

                    <button
                        onClick={() => handleStorageModeChange('local')}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            border: storageMode === 'local' ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
                            backgroundColor: storageMode === 'local' ? 'rgba(37, 99, 235, 0.1)' : 'var(--color-bg-primary)',
                            cursor: 'pointer',
                            textAlign: 'left'
                        }}
                    >
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>💻 Local (Offline)</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            Salvo apenas neste dispositivo. Funciona sem internet.
                        </div>
                    </button>
                </div>
            </div>

            {/* Sync Section */}
            <div style={{
                backgroundColor: 'var(--color-bg-secondary)',
                padding: 'var(--spacing-xl)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                marginBottom: 'var(--spacing-xl)'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>Sincronização de Dados</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)' }}>
                    Transfira seus dados entre o dispositivo e a nuvem.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <button
                        onClick={handleSyncLocalToCloud}
                        disabled={syncing || isFreePlan}
                        style={{
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-primary)',
                            cursor: (syncing || isFreePlan) ? 'not-allowed' : 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            opacity: (syncing || isFreePlan) ? 0.6 : 1
                        }}
                    >
                        <span style={{ fontSize: '1.5rem' }}>☁️⬆️</span>
                        <div>
                            <div style={{ fontWeight: '600' }}>Enviar para Nuvem (Upload) {isFreePlan && '🔒'}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                Copia seus relatórios locais para o servidor. (Requer Pro)
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={handleSyncCloudToLocal}
                        disabled={syncing}
                        style={{
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-primary)',
                            cursor: syncing ? 'not-allowed' : 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            opacity: syncing ? 0.6 : 1
                        }}
                    >
                        <span style={{ fontSize: '1.5rem' }}>💻⬇️</span>
                        <div>
                            <div style={{ fontWeight: '600' }}>Baixar para Local (Download)</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                Baixa seus relatórios da nuvem para este dispositivo. (Backup/Offline)
                            </div>
                        </div>
                    </button>

                    {syncing && (
                        <div style={{
                            marginTop: 'var(--spacing-sm)',
                            color: 'var(--color-accent-primary)',
                            fontWeight: '600',
                            textAlign: 'center'
                        }}>
                            {syncProgress}
                        </div>
                    )}
                </div>
            </div>

            {/* Checklist Configuration Section */}
            <div style={{
                backgroundColor: 'var(--color-bg-secondary)',
                padding: 'var(--spacing-xl)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                marginBottom: 'var(--spacing-xl)'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>Configuração do Checklist</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-lg)' }}>
                    Adicione ou remova itens personalizados para seus relatórios.
                </p>

                {/* Add New Item Form */}
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <form onSubmit={handleAddItem} style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                        <input
                            type="text"
                            value={newItemLabel}
                            onChange={(e) => setNewItemLabel(e.target.value)}
                            placeholder="Nome do novo item..."
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

                {/* Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    {items.map((item) => (
                        <div key={item.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 'var(--spacing-md)',
                            backgroundColor: 'var(--color-bg-primary)', // Changed to primary to contrast with container
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
        </div>
    );
};

export default Settings;
