import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuthService } from '../../services/AuthService';

export const useAuthForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);

    // Reset Password Modal States
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');

    const { login, signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            if (isLogin) {
                await login(email, password);
                navigate('/');
            } else {
                await signup(email, password);
                setError('');
                alert('Conta criada com sucesso! Aguarde a aprovação do administrador para fazer login.');
                setIsLogin(true); // Volta para o modo de login
            }
        } catch (err) {
            console.error(err);
            if (isLogin) {
                if (err.message === 'ACCOUNT_PENDING') {
                    setError('Sua conta ainda está pendente de aprovação. Entre em contato com o administrador.');
                } else {
                    setError('Falha ao fazer login. Verifique suas credenciais.');
                }
            } else {
                // Tratamento de erro específico do Firebase
                if (err.code === 'auth/email-already-in-use') {
                    setError('Este email já está em uso.');
                } else if (err.code === 'auth/weak-password') {
                    setError('A senha deve ter pelo menos 6 caracteres.');
                } else {
                    setError(`Falha ao criar conta: ${err.message}`);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (resetEmail) => {
        try {
            setError('');
            setLoading(true);
            await AuthService.resetPassword(resetEmail);
            alert('Email de recuperação enviado! Verifique sua caixa de entrada.');
            return true;
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/user-not-found') {
                setError('Email não encontrado.');
            } else {
                setError('Falha ao enviar email de recuperação: ' + err.message);
            }
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleOpenResetModal = () => {
        setShowResetModal(true);
        setError(''); // Clear any previous errors
    };

    const handleCloseResetModal = () => {
        setShowResetModal(false);
        setResetEmail('');
        setError('');
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        const success = await handleResetPassword(resetEmail);
        if (success) {
            handleCloseResetModal();
        }
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        error,
        setError,
        loading,
        isLogin,
        setIsLogin,
        handleSubmit,
        // Reset Password Modal
        showResetModal,
        resetEmail,
        setResetEmail,
        handleOpenResetModal,
        handleCloseResetModal,
        handleResetSubmit,
    };
};
