import React, { useState } from 'react';
import { Terminal, Save, Trash2 } from 'lucide-react';
import './styles.css';

const LogConsole = ({ logs, logsEndRef, onClearLogs, onDownloadLogs }) => {
    const [viewMode, setViewMode] = useState('hex');

    const formatLogMessage = (log) => {
        if (log.type === 'rx' && log.rawData && viewMode === 'hex') {
            return Array.from(log.rawData).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
        }
        return log.message;
    };

    const logLineClasses = (logType) => {
        const base = 'log-line';
        // Map log types to specific CSS classes
        let typeClass = `log-line--info`; // Default
        if (logType === 'error') typeClass = 'log-line--error';
        else if (logType === 'success') typeClass = 'log-line--success';
        else if (logType === 'rx') typeClass = 'log-line--rx';
        else if (logType === 'tx') typeClass = 'log-line--tx';
        else if (logType === 'empty') typeClass = 'log-line--empty';

        return `${base} ${typeClass}`;
    }

    return (
        <aside className="log-console-container">
            <div className="log-console-header">
                <h2 className="panel-card-title">
                    <Terminal size={20} /> Terminal
                </h2>
                <div className="log-console-actions">
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        className="view-mode-select"
                    >
                        <option value="ascii">ASCII</option>
                        <option value="hex">HEX</option>
                    </select>
                    <button onClick={onDownloadLogs} title="Salvar Logs" className="log-action-button">
                        <Save size={18} />
                    </button>
                    <button onClick={onClearLogs} title="Limpar" className="log-action-button">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="log-viewer">
                {logs.length === 0 && <div className={logLineClasses('empty')}>Aguardando conexão...</div>}
                {logs.map((log, index) => (
                    <div key={index} className={logLineClasses(log.type)}>
                        <span className="log-timestamp">[{log.timestamp}]</span>
                        {formatLogMessage(log)}
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>
        </aside>
    );
};

export default LogConsole;
