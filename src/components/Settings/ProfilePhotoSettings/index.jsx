import React from 'react';
import { useProfilePhoto } from '../../../hooks/Settings/useProfilePhoto';
import './styles.css';

const ProfilePhotoSettings = () => {
    const { currentUser, loading, error, uploadPhoto } = useProfilePhoto();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadPhoto(file);

            // Reset the input value to allow re-uploading the same file
            e.target.value = null;
        }
    };

    // Fallback for user's name if email is the only display identifier
    const displayName = currentUser?.displayName || currentUser?.email || 'Usuário';

    return (
        <div className="photo-settings-container">
            <h2 className="section-title">Foto de Perfil</h2>
            {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
            <div className="avatar-preview-container">
                <img
                    src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`}
                    alt="Avatar"
                    className="avatar-preview"
                />
                <input
                    type="file"
                    id="photo-upload"
                    className="photo-input"
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg"
                    disabled={loading}
                />
                <label htmlFor="photo-upload" className={loading ? 'save-button disabled' : 'save-button'}>
                    {loading ? 'Enviando...' : 'Trocar Foto'}
                </label>
            </div>
            <p className="photo-instructions">
                Use uma imagem nos formatos JPG ou PNG. 
            </p>
        </div>
    );
};

export default ProfilePhotoSettings;
