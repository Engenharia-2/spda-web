import React, { useState } from 'react';
import { Phone, Mail, X, MessageCircle } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext/ThemeContext';
import './styles.css';

const SACButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { theme } = useTheme();

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <div className="sac-wrapper">
            {isOpen && (
                <div className={`sac-card ${theme === 'dark' ? 'dark' : ''}`}>
                    <div className="sac-card-header">
                        <div className="sac-title">Alguma dúvida sobre a plataforma? Fale conosco!</div>
                    </div>
                    <div className="sac-content">
                        <div className="sac-info-row">
                            <Phone size={18} color="#007bff" />
                            <span className="sac-info-text">(47) 99999-9999</span>
                        </div>
                        <div className="sac-info-row">
                            <Mail size={18} color="#007bff" />
                            <span className="sac-info-text">suporte@lhfsistemas.com.br</span>
                        </div>
                    </div>
                </div>
            )}
            <button
                className="sac-button"
                onClick={toggleOpen}
                aria-label="Atendimento ao Cliente"
            >
                {isOpen ? <X size={28} /> : <Phone size={28} />}
            </button>
        </div>
    );
};

export default SACButton;
