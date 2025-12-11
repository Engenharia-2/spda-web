import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClients } from '../../../hooks/Clients/useClients';
import LocationButton from '../../../components/Shared/LocationButton';
import './styles.css';

const ClientForm = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const clientId = searchParams.get('id');

    const {
        formData,
        setFormData,
        formLoading: loading, // Renaming for clarity
        handleSave,
    } = useClients(clientId);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLocationFound = (address) => {
        setFormData(prev => ({ ...prev, address }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSave();
    };

    return (
        <div className="container">
            <h1 className="title">
                {clientId ? 'Editar Cliente' : 'Novo Cliente'}
            </h1>

            <div className="form-card">
                <form onSubmit={handleSubmit} className="form">
                    <div className="form-group">
                        <label className="form-label">Nome da Empresa / Cliente *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Endereço Completo</label>
                        <div className="address-wrapper">
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="form-input"
                            />
                            <LocationButton onLocationFound={handleLocationFound} />
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Nome do Contato</label>
                            <input
                                type="text"
                                name="contactName"
                                value={formData.contactName}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Telefone</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={() => navigate('/clients')}
                            className="btn-cancel"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-submit"
                        >
                            {loading ? 'Salvando...' : 'Salvar Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientForm;
