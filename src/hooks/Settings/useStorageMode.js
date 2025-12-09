import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const useStorageMode = () => {
    const { currentUser } = useAuth();
    const [storageMode, setStorageMode] = useState(localStorage.getItem('storageMode') || 'cloud');

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

        console.log(`Changing storage mode to: ${mode}`);
        setStorageMode(mode);
        localStorage.setItem('storageMode', mode);
        alert(`Modo de armazenamento alterado para: ${mode.toUpperCase()}. A mudança será aplicada nas próximas operações.`);
    };

    return { storageMode, handleStorageModeChange };
};
