import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';


const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true); // Toggle state
    const { login, signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password);
                setError('');
                alert('Conta criada com sucesso! Aguarde a aprovação do administrador para fazer login.');
                setIsLogin(true); // Switch back to login mode
                return; // Stop execution
            }
            navigate('/');
        } catch (err) {
            console.error(err);
            if (isLogin) {
                if (err.message === 'ACCOUNT_PENDING') {
                    setError('Sua conta ainda está pendente de aprovação. Entre em contato com o administrador.');
                } else {
                    setError('Falha ao fazer login. Verifique suas credenciais.');
                }
            } else {
                // Firebase specific error handling could be better here
                if (err.code === 'auth/email-already-in-use') {
                    setError('Este email já está em uso.');
                } else if (err.code === 'auth/weak-password') {
                    setError('A senha deve ter pelo menos 6 caracteres.');
                } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
                    setError('O login por Email/Senha não está ativado no Firebase Console.');
                } else {
                    setError(`Falha ao criar conta: ${err.message} (${err.code})`);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-bg-primary)'
        }}>
            <div style={{
                backgroundColor: 'var(--color-bg-secondary)',
                padding: 'var(--spacing-2xl)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                width: '100%',
                maxWidth: '400px',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)', fontSize: '1.5rem', fontWeight: '700' }}>
                    {isLogin ? 'SPDA Reports - Login' : 'Criar Nova Conta'}
                </h2>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(248, 113, 113, 0.1)',
                        color: 'var(--color-error)',
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--spacing-lg)',
                        textAlign: 'center',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: '500' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg-tertiary)',
                                color: 'var(--color-text-primary)'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', fontWeight: '500' }}>Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg-tertiary)',
                                color: 'var(--color-text-primary)'
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            backgroundColor: 'var(--color-accent-primary)',
                            color: 'white',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
                    </button>
                </form>

                <div style={{ marginTop: 'var(--spacing-lg)', textAlign: 'center', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>
                        {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
                    </span>
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-accent-primary)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            padding: 0
                        }}
                    >
                        {isLogin ? 'Cadastre-se' : 'Fazer Login'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
