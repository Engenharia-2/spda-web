import React from 'react';
import { useClientAutocomplete } from '../../../../hooks/Clients/useClientAutocomplete';
import './styles.css';

const InitialInfo = ({ data, updateData }) => {
    const {
        filteredClients,
        showSuggestions,
        setShowSuggestions,
        handleClientChange,
        handleClientSelect
    } = useClientAutocomplete(data, updateData);

    const handleChange = (e) => {
        const { name, value } = e.target;
        updateData({ [name]: value });
    };

    return (
        <div className="initial-info-container">
            <div className="grid-container-2-cols">
                <div className="form-field">
                    <label className="form-label">Cliente</label>

                    <input
                        type="text"
                        name="client"
                        value={data.client || ''}
                        onChange={handleClientChange}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="Nome da Empresa / Cliente"
                        autoComplete="off"
                        className="form-input"
                    />

                    {showSuggestions && filteredClients.length > 0 && (data.client || '').length > 0 && (
                        <div className="autocomplete-container">
                            {filteredClients.map(client => (
                                <div
                                    key={client.id}
                                    onClick={() => handleClientSelect(client)}
                                    className="autocomplete-item"
                                >
                                    <div className="autocomplete-item-name">{client.name}</div>
                                    {client.contactName && (
                                        <div className="autocomplete-item-contact">
                                            Contato: {client.contactName}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="form-field">
                    <label className="form-label">Representante do Cliente</label>
                    <input
                        type="text"
                        name="clientRep"
                        value={data.clientRep || ''}
                        onChange={handleChange}
                        placeholder="Nome do contato"
                        className="form-input"
                    />
                </div>
            </div>

            <div className="form-field">
                <label className="form-label">Prestador de Serviço</label>
                <input
                    type="text"
                    name="provider"
                    value={data.provider || ''}
                    onChange={handleChange}
                    placeholder="Empresa Executora"
                    className="form-input"
                />
            </div>
        </div>
    );
};

export default InitialInfo;
