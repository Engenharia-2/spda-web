import { useState, useEffect, useRef, useCallback } from 'react';

export const useLogManager = () => {
    const [logs, setLogs] = useState([]);
    const logBuffer = useRef([]);
    const logsEndRef = useRef(null);

    const addLog = useCallback((message, type = 'info', rawData = null) => {
        const timestamp = new Date().toLocaleTimeString();
        logBuffer.current.push({ timestamp, message, type, rawData });
    }, []);

    const handleClearLogs = useCallback(() => {
        setLogs([]);
        logBuffer.current = [];
    }, []);

    const handleDownloadLogs = useCallback(() => {
        // The viewMode logic is internal to the LogConsole, so this can be simplified
        const content = logs.map(l => {
            const msg = l.message; // Raw data formatting is handled by the component
            return `[${l.timestamp}] [${l.type.toUpperCase()}] ${msg}`;
        }).join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `serial-logs-${new Date().toISOString()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [logs]);

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (logBuffer.current.length > 0) {
                const logsToFlush = [...logBuffer.current];
                logBuffer.current = [];
                setLogs(prev => [...prev, ...logsToFlush].slice(-1000));
            }
        }, 100);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [logs]);

    return {
        logs,
        logsEndRef,
        addLog,
        handleClearLogs,
        handleDownloadLogs
    };
};
