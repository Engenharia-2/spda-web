import React, { useState } from 'react';
import { Terminal } from 'lucide-react';
import './styles.css';

const RawHexSender = ({ isConnected, onSendHex }) => {
    const [hexInput, setHexInput] = useState('');

    const handleHexInputChange = (e) => {
        // Allow only hex characters and spaces
        const val = e.target.value.replace(/[^0-9a-fA-F\s]/g, '');
        setHexInput(val);
    };

    const handleSend = () => {
        if (onSendHex) {
            onSendHex(hexInput);
        }
    };

    return (
        <section className="panel-card">
            <h2 className="panel-card-title">
                <Terminal size={20} /> Enviar Raw Hex
            </h2>
            <div className="raw-hex-container">
                <input
                    type="text"
                    value={hexInput}
                    onChange={handleHexInputChange}
                    placeholder="00 00 00 00 00 00 00 00"
                    className="text-input mono"
                />
                <button
                    onClick={handleSend}
                    disabled={!isConnected || !hexInput}
                    className="raw-hex-send-button"
                >
                    Enviar
                </button>
            </div>
        </section>
    );
};

export default RawHexSender;
