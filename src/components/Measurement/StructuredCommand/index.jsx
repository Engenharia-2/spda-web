import React, { useState } from 'react';
import { Terminal } from 'lucide-react';
import './styles.css';

const StructuredCommand = ({ isConnected, onSendPacket }) => {
    const [cmdId, setCmdId] = useState('');
    const [cmdData, setCmdData] = useState('');

    const handleSend = () => {
        if (onSendPacket) {
            onSendPacket(cmdId, cmdData);
        }
    };

    return (
        <section className="panel-card">
            <h2 className="panel-card-title">
                <Terminal size={20} /> Enviar Comando Estruturado
            </h2>
            <div className="structured-send-grid">
                <div>
                    <label className="input-label">Cmd (Hex)</label>
                    <input
                        type="text"
                        value={cmdId}
                        onChange={(e) => setCmdId(e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 2))}
                        placeholder="01"
                        maxLength={2}
                        className="text-input mono"
                    />
                </div>
                <div>
                    <label className="input-label">Dados (Hex)</label>
                    <input
                        type="text"
                        value={cmdData}
                        onChange={(e) => setCmdData(e.target.value.replace(/[^0-9a-fA-F\s]/g, ''))}
                        placeholder="AA BB CC"
                        className="text-input mono"
                    />
                </div>
            </div>
            <button
                onClick={handleSend}
                disabled={!isConnected || !cmdId}
                className="panel-card-button secondary"
            >
                Enviar Pacote (Auto CRC)
            </button>
            <p className="packet-structure-note">
                Estrutura: Cmd (1) | Size (2) | Data (N) | CRC (2)
            </p>
        </section>
    );
};

export default StructuredCommand;
