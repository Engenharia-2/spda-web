import React from 'react';
import { useAuthForm } from '../../hooks/Auth/useAuthForm';
import './Login.css';

const Login = () => {
    const {
        email,
        setEmail,
        password,
        setPassword,
        error,
        loading,
        isLogin,
        setIsLogin,
        handleSubmit,
        handleResetPassword,
        setError,
    } = useAuthForm();

    const [showResetModal, setShowResetModal] = React.useState(false);
    const [resetEmail, setResetEmail] = React.useState('');

    const onResetSubmit = async (e) => {
        e.preventDefault();
        const success = await handleResetPassword(resetEmail);
        if (success) {
            setShowResetModal(false);
            setResetEmail('');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">
                    {isLogin ? 'SPDA Reports - Login' : 'Criar Nova Conta'}
                </h2>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div>
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="form-input"
                            autoComplete="email"
                        />
                    </div>
                    <div>
                        <label className="form-label">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="form-input"
                            autoComplete={isLogin ? "current-password" : "new-password"}
                        />
                    </div>

                    {isLogin && (
                        <div style={{ textAlign: 'right', marginBottom: '15px' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowResetModal(true);
                                    setError('');
                                }}
                                className="text-btn"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#007bff',
                                    cursor: 'pointer',
                                    fontSize: '0.9em',
                                    textDecoration: 'underline'
                                }}
                            >
                                Esqueci minha senha
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="submit-btn"
                    >
                        {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
                    </button>
                </form>

                <div className="toggle-container">
                    <span className="toggle-text">
                        {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
                    </span>
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="toggle-btn"
                    >
                        {isLogin ? 'Cadastre-se' : 'Fazer Login'}
                    </button>
                </div>
            </div>

            {/* Modal de Recuperação de Senha */}
            {showResetModal && (
                <div className="modal-overlay">
                    <div className="modal-content login-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
                        <h3 className="login-title">Recuperar Senha</h3>
                        <p style={{ marginBottom: '15px', color: '#666' }}>
                            Digite seu email para receber o link de redefinição de senha.
                        </p>

                        <form onSubmit={onResetSubmit} className="login-form">
                            <div>
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                    className="form-input"
                                    autoFocus
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowResetModal(false);
                                        setError('');
                                    }}
                                    className="toggle-btn"
                                    style={{ flex: 1, border: '1px solid #ccc' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="submit-btn"
                                    style={{ flex: 1, margin: 0 }}
                                >
                                    {loading ? 'Enviando...' : 'Enviar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
