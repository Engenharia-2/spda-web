import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QRCodeScanner = ({ onScanSuccess, onScanFailure, onClose, feedback }) => {
    const scannerRef = useRef(null);
    const [error, setError] = useState(null);
    const lastScanRef = useRef({ text: null, time: 0 });
    const [zoomLevel, setZoomLevel] = useState(1);
    const [zoomCapabilities, setZoomCapabilities] = useState(null);

    const onScanSuccessRef = useRef(onScanSuccess);
    useEffect(() => { onScanSuccessRef.current = onScanSuccess; }, [onScanSuccess]);

    const onScanFailureRef = useRef(onScanFailure);
    useEffect(() => { onScanFailureRef.current = onScanFailure; }, [onScanFailure]);

    const stopScanner = useCallback(() => {
        if (scannerRef.current) {
            const scanner = scannerRef.current;
            scannerRef.current = null; // Prevent multiple stop calls
            if (scanner && scanner.isScanning) {
                return scanner.stop()
                    .then(() => scanner.clear())
                    .catch(err => console.error("Error during scanner cleanup:", err));
            }
        }
        return Promise.resolve();
    }, []);

    const startScanner = useCallback(async () => {
        await stopScanner(); // Ensure any previous instance is stopped

        const scannerId = "reader";
        const readerElement = document.getElementById(scannerId);
        if (!readerElement) return;

        setError(null);

        try {
            const html5QrCode = new Html5Qrcode(scannerId, { experimentalFeatures: { useBarCodeDetectorIfSupported: true } });
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 15, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
                (decodedText, decodedResult) => {
                    const now = Date.now();
                    if (decodedText === lastScanRef.current.text && (now - lastScanRef.current.time) < 2500) return;
                    lastScanRef.current = { text: decodedText, time: now };
                    if (onScanSuccessRef.current) onScanSuccessRef.current(decodedText, decodedResult);
                },
                (errorMessage) => { }
            );

            // Fix: Check if the scanner was stopped or replaced while starting (race condition)
            if (scannerRef.current !== html5QrCode) {
                console.log("Scanner stopped/replaced during startup. Cleaning up...");
                try {
                    await html5QrCode.stop();
                    await html5QrCode.clear();
                } catch (cleanupErr) {
                    console.warn("Failed to cleanup orphaned scanner:", cleanupErr);
                }
                return;
            }

            const videoElement = document.querySelector(`#${scannerId} video`);
            if (videoElement && videoElement.srcObject) {
                const track = videoElement.srcObject.getVideoTracks()[0];
                const capabilities = track.getCapabilities();
                if (capabilities.zoom) {
                    setZoomCapabilities({
                        min: capabilities.zoom.min, max: capabilities.zoom.max,
                        step: capabilities.zoom.step || 0.1
                    });
                    setZoomLevel(track.getSettings().zoom || capabilities.zoom.min);
                }
            }
        } catch (err) {
            console.error('Error starting scanner:', err);
            setError("Não foi possível acessar a câmera. Verifique as permissões do navegador e tente novamente.");
        }
    }, [stopScanner]);

    useEffect(() => {
        startScanner();
        return () => {
            stopScanner();
        };
    }, [startScanner, stopScanner]);

    const handleClose = () => {
        stopScanner().finally(() => onClose());
    };

    const applyZoom = useCallback(async (newZoom) => {
        try {
            const videoElement = document.querySelector('#reader video');
            if (videoElement && videoElement.srcObject) {
                const track = videoElement.srcObject.getVideoTracks()[0];
                await track.applyConstraints({ advanced: [{ zoom: newZoom }] });
                setZoomLevel(newZoom);
            }
        } catch (err) {
            console.error('Error applying zoom:', err);
        }
    }, []);

    const handleZoomIn = () => { if (zoomCapabilities) applyZoom(Math.min(zoomLevel + zoomCapabilities.step, zoomCapabilities.max)); };
    const handleZoomOut = () => { if (zoomCapabilities) applyZoom(Math.max(zoomLevel - zoomCapabilities.step, zoomCapabilities.min)); };

    const handleRetry = async () => {
        setError(null);
        try {
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length) {
                startScanner();
            } else {
                setError("Nenhuma câmera foi encontrada.");
            }
        } catch (err) {
            setError("A permissão da câmera foi negada. Habilite o acesso nas configurações do seu navegador.");
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '100%', maxWidth: '500px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button onClick={handleClose} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#333', zIndex: 10 }}>&times;</button>
                <h3 style={{ marginBottom: '15px', textAlign: 'center' }}>Escanear QR Code</h3>
                <div id="reader" style={{ width: '100%', minHeight: '300px', backgroundColor: '#000', borderRadius: '4px', overflow: 'hidden', display: error ? 'none' : 'block' }}></div>

                {zoomCapabilities && !error && (
                    <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', justifyContent: 'center' }}>
                        <button onClick={handleZoomOut} disabled={zoomLevel <= zoomCapabilities.min} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--color-primary)', backgroundColor: 'var(--color-primary)', color: 'white', fontSize: '20px', cursor: 'pointer' }}>−</button>
                        <div style={{ flex: 1, textAlign: 'center', fontSize: '14px', color: '#666' }}>Zoom: {zoomLevel.toFixed(1)}x</div>
                        <button onClick={handleZoomIn} disabled={zoomLevel >= zoomCapabilities.max} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--color-primary)', backgroundColor: 'var(--color-primary)', color: 'white', fontSize: '20px', cursor: 'pointer' }}>+</button>
                    </div>
                )}

                {feedback && <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'var(--color-success)', color: 'white', borderRadius: '4px', textAlign: 'center', width: '100%' }}>{feedback}</div>}

                {error && (
                    <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--color-error)', textAlign: 'center', padding: '10px' }}>
                        <p>{error}</p>
                        <button onClick={handleRetry} style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Tentar Novamente</button>
                    </div>
                )}

                {!error && !feedback && (
                    <p style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                        Aponte a câmera para o QR Code.
                    </p>
                )}
            </div>
        </div>
    );
};

export default QRCodeScanner;
