import { useState } from 'react';
import { AuthService } from '../../services/AuthService';

/**
 * Custom hook for managing password change functionality
 * Handles validation, API calls, and state management
 * @returns {Object} Hook interface with form state and handlers
 */
export const usePasswordChange = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    /**
     * Validate password inputs
     * @returns {string|null} Error message or null if valid
     */
    const validatePasswords = () => {
        if (newPassword !== confirmPassword) {
            return 'As senhas não coincidem.';
        }

        if (newPassword.length < 6) {
            return 'A nova senha deve ter pelo menos 6 caracteres.';
        }

        return null;
    };

    /**
     * Handle password change submission
     * @returns {Promise<boolean>} Success status
     */
    const handlePasswordChange = async () => {
        setError('');
        setSuccess('');

        // Validate
        const validationError = validatePasswords();
        if (validationError) {
            setError(validationError);
            return false;
        }

        setLoading(true);

        try {
            await AuthService.updateUserPassword(newPassword);
            setSuccess('Senha atualizada com sucesso!');

            // Reset form
            setNewPassword('');
            setConfirmPassword('');

            return true;

        } catch (err) {
            console.error(err);

            if (err.code === 'auth/requires-recent-login') {
                setError('Esta operação requer um login recente. Por favor, saia e entre novamente para trocar sua senha.');
            } else {
                setError('Erro ao atualizar senha: ' + err.message);
            }

            return false;

        } finally {
            setLoading(false);
        }
    };

    /**
     * Clear all messages
     */
    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    return {
        // Form state
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,

        // Status state
        loading,
        error,
        success,

        // Actions
        handlePasswordChange,
        clearMessages
    };
};
