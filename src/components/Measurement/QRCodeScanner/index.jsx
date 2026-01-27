import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import './styles.css';

const QRCodeScanner = ({ onScanSuccess, onClose, feedback }) => {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const onScanSuccessRef = useRef(onScanSuccess);
  const [error, setError] = useState(null);

  // Keep callback fresh
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    const videoElem = videoRef.current;
    if (!videoElem) return;

    // Use a small timeout to ensure the modal/component is fully mounted and visible
    // This helps with some mobile browsers that might fail to grab the camera if the element isn't ready
    const startScanner = async () => {
      try {
        const qrScanner = new QrScanner(
          videoElem,
          result => {
            // QrScanner returns an object { data, cornerPoints } or just string in older versions
            // The latest version returns object. We want the data string.
            const text = typeof result === 'string' ? result : result?.data;
            if (text && onScanSuccessRef.current) {
              onScanSuccessRef.current(text, result);
            }
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            // 'environment' is the default but explicit is good
            preferredCamera: 'environment',
            // This is important for performance
            maxScansPerSecond: 5,
          }
        );

        scannerRef.current = qrScanner;
        await qrScanner.start();
      } catch (e) {
        console.error("Failed to start QR Scanner", e);
        setError("Erro ao acessar a câmera. Verifique as permissões.");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-container">
        {/* Container for the video element */}
        <div className="qr-video-wrapper">
          <video ref={videoRef} className="qr-video-element" playsInline />
        </div>

        {error ? (
          <p className="qr-scanner-feedback error">{error}</p>
        ) : (
          feedback && <p className="qr-scanner-feedback">{feedback}</p>
        )}

        <button onClick={onClose} className="qr-scanner-close-button">
          Fechar Leitor
        </button>
      </div>
    </div>
  );
};

export default QRCodeScanner;
