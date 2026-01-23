import React from 'react';
import { usePasswordChange } from '../../../hooks/Settings/usePasswordChange';
import ProfilePhotoSettings from '../ProfilePhotoSettings';
import './styles.css';

const AccountSettings = () => {
    const {
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        loading,
        error,
        success,
        handlePasswordChange
    } = usePasswordChange();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await handlePasswordChange();
    };

    return (
        // Este div agora é um fragmento simples, não mais um .settings-section
        <>
            {/* Card 1: Foto de Perfil */}
            <div className="settings-section">
                <ProfilePhotoSettings />
            </div>

            {/* Card 2: Troca de Senha */}
            <div className="settings-section">
                <h2 className="section-title">Trocar de senha</h2>
                <p className="section-description">
                    Altere sua senha de acesso à plataforma.
                </p>

                {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
                {success && <div className="success-message" style={{ marginBottom: '1rem', color: 'green', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>{success}</div>}

                <form onSubmit={handleSubmit} className="settings-form">
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="form-label">Nova Senha</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="form-input"
                            placeholder="Mínimo 6 caracteres"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="form-label">Confirmar Nova Senha</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="form-input"
                            placeholder="Repita a nova senha"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="save-button"
                        disabled={loading}
                    >
                        {loading ? 'Atualizando...' : 'Atualizar Senha'}
                    </button>
                </form>
            </div>
        </>
    );
};

export default AccountSettings;
