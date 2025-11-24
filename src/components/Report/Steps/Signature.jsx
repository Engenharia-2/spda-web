import React, { useRef, useState, useEffect } from 'react';
import { StorageService } from '../../../services/StorageService';
import { useAuth } from '../../../contexts/AuthContext';

const Signature = ({ data, updateData }) => {
    const { currentUser } = useAuth();
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [signatureUrl, setSignatureUrl] = useState(data.signature || null);

    // Initialize canvas context
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000000';
        }
    }, []);

    // Resolve local URL if needed
    useEffect(() => {
        const resolveUrl = async () => {
            if (data.signature && data.signature.startsWith('local-image://')) {
                const resolved = await StorageService.resolveImageUrl(data.signature);
                setSignatureUrl(resolved);
            } else {
                setSignatureUrl(data.signature);
            }
        };
        resolveUrl();
    }, [data.signature]);

    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e) => {
        // Prevent default to stop scrolling on touch devices
        if (e.type === 'touchstart') {
            e.preventDefault();
        }

        const ctx = canvasRef.current.getContext('2d');
        const { x, y } = getCoordinates(e);

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        // Prevent default to stop scrolling on touch devices
        if (e.type === 'touchmove') {
            e.preventDefault();
        }

        if (!isDrawing) return;
        const ctx = canvasRef.current.getContext('2d');
        const { x, y } = getCoordinates(e);

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const saveSignature = async () => {
        const canvas = canvasRef.current;
        if (!currentUser) return;

        setUploading(true);
        canvas.toBlob(async (blob) => {
            if (blob) {
                try {
                    const file = new File([blob], 'signature.png', { type: 'image/png' });
                    const path = `reports/${currentUser.uid}/${data.id || 'temp'}/signature_${Date.now()}.png`;
                    const uploaded = await StorageService.uploadImage(file, path);

                    updateData({ signature: uploaded.url });
                    alert('Assinatura salva com sucesso!');
                } catch (error) {
                    console.error('Error saving signature:', error);
                    alert('Erro ao salvar assinatura.');
                } finally {
                    setUploading(false);
                }
            }
        });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser) return;

        setUploading(true);
        try {
            const path = `reports/${currentUser.uid}/${data.id || 'temp'}/signature_upload_${Date.now()}_${file.name}`;
            const uploaded = await StorageService.uploadImage(file, path);
            updateData({ signature: uploaded.url });
        } catch (error) {
            console.error('Error uploading signature:', error);
            alert('Erro ao enviar assinatura.');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveSignature = () => {
        if (window.confirm('Remover assinatura atual?')) {
            updateData({ signature: null });
            setSignatureUrl(null);
            clearCanvas();
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div>

                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    Assine abaixo ou envie uma imagem da sua assinatura.
                </p>
            </div>

            {signatureUrl ? (
                <div style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-md)',
                    textAlign: 'center',
                    backgroundColor: 'var(--color-bg-secondary)'
                }}>
                    <img
                        src={signatureUrl}
                        alt="Assinatura"
                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                    />
                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                        <button
                            onClick={handleRemoveSignature}
                            style={{
                                backgroundColor: 'var(--color-error)',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer'
                            }}
                        >
                            Remover Assinatura
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <div style={{
                        border: '2px dashed var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        touchAction: 'none' // Prevent scrolling while drawing
                    }}>
                        <canvas
                            ref={canvasRef}
                            width={500}
                            height={200}
                            style={{ width: '100%', height: '200px', cursor: 'crosshair', display: 'block' }}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                        <button
                            onClick={clearCanvas}
                            style={{
                                padding: '0.5rem 1rem',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'transparent',
                                cursor: 'pointer'
                            }}
                        >
                            Limpar
                        </button>
                        <button
                            onClick={saveSignature}
                            disabled={uploading}
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--color-accent-primary)',
                                color: 'white',
                                cursor: uploading ? 'wait' : 'pointer',
                                opacity: uploading ? 0.7 : 1
                            }}
                        >
                            {uploading ? 'Salvando...' : 'Salvar Assinatura'}
                        </button>

                        <div style={{ flex: 1, textAlign: 'right' }}>
                            <label style={{
                                cursor: 'pointer',
                                color: 'var(--color-accent-primary)',
                                fontWeight: '500',
                                display: 'inline-block',
                                padding: '0.5rem'
                            }}>
                                <span>Ou envie uma imagem</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Signature;
