import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SyncService } from '../../services/SyncService';

export const useSync = () => {
    const { currentUser } = useAuth();
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

    return { syncing, syncProgress, handleSyncLocalToCloud, handleSyncCloudToLocal };
};
