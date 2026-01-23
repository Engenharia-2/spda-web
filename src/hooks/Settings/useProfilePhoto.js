import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { StorageService } from '../../services/StorageService';
import { AuthService } from '../../services/AuthService';

export const useProfilePhoto = () => {
    const { currentUser, refreshAuth } = useAuth(); // Pega a função refreshAuth
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const uploadPhoto = async (file) => {
        if (!file || !currentUser) return;

        setLoading(true);
        setError(null);

        try {
            // Define um caminho único para a foto de perfil do usuário.
            const filePath = `profile_photos/${currentUser.uid}/profile_photo`;
            const uploadedImage = await StorageService.uploadProfilePhoto(file, filePath);

            // Atualiza o perfil do usuário no Firebase Auth com a nova URL da foto.
            await AuthService.updateUserProfile({
                photoURL: uploadedImage.url,
            });

            // Força a atualização do estado do usuário no contexto
            await refreshAuth();

        } catch (e) {
            console.error("Error uploading profile photo:", e);
            setError("Falha ao enviar a foto. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, uploadPhoto, currentUser };
};
