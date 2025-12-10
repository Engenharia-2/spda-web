
import React, { useState } from 'react';
import { AuthService } from '../../../services/AuthService';

const AccountSettings = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (newPassword.length < 6) {
            setError('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            await AuthService.updateUserPassword(newPassword);
            setSuccess('Senha atualizada com sucesso!');
            setNewPassword('');
            setConfirmPassword('');
            // Optional: You might want to ask for re-login or keep them logged in
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/requires-recent-login') {
                setError('Esta operação requer um login recente. Por favor, saia e entre novamente para trocar sua senha.');
            } else {
                setError('Erro ao atualizar senha: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-section">
            <h2 className="section-title">Segurança da Conta</h2>
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
    );
};

export default AccountSettings;
