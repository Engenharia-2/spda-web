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
    } = useAuthForm();

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
        </div>
    );
};

export default Login;
