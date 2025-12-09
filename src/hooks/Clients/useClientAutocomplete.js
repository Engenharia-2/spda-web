import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ClientService } from '../../services/ClientService';

export const useClientAutocomplete = (data, updateData) => {
    const { currentUser } = useAuth();
    const [clients, setClients] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const fetchClients = async () => {
            if (currentUser) {
                try {
                    const fetchedClients = await ClientService.getUserClients(currentUser.uid);
                    setClients(fetchedClients);
                } catch (error) {
                    console.error('Error fetching clients:', error);
                }
            }
        };
        fetchClients();
    }, [currentUser]);

    const handleClientSelect = (client) => {
        updateData({
            client: client.name,
            clientRep: client.contactName || '',
            address: client.address || ''
        });
        setShowSuggestions(false);
    };

    const handleClientChange = (e) => {
        const value = e.target.value;
        updateData({ client: value });
        setShowSuggestions(true);
    };

    const filteredClients = clients.filter(client =>
        (client.name || '').toLowerCase().includes((data.client || '').toLowerCase())
    );

    return {
        filteredClients,
        showSuggestions,
        setShowSuggestions,
        handleClientChange,
        handleClientSelect
    };
};
