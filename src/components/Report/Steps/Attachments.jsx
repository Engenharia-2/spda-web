import React, { useState } from 'react';

const Attachments = ({ data, updateData }) => {
    const [documents, setDocuments] = useState(data.attachments?.documents || []);
    const [photos, setPhotos] = useState(data.attachments?.photos || []);

    const handleDocumentUpload = (e) => {
        const files = Array.from(e.target.files);
        const newDocs = files.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
            file: file // In a real app, we might upload this immediately or convert to base64
        }));

        const updatedDocs = [...documents, ...newDocs];
        setDocuments(updatedDocs);
        updateData({ attachments: { documents: updatedDocs, photos } });
    };

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        const newPhotos = files.map(file => ({
            name: file.name,
            preview: URL.createObjectURL(file),
            description: '',
            file: file
        }));

        const updatedPhotos = [...photos, ...newPhotos];
        setPhotos(updatedPhotos);
        updateData({ attachments: { documents, photos: updatedPhotos } });
    };

    const handlePhotoDescriptionChange = (index, description) => {
        const updatedPhotos = [...photos];
        updatedPhotos[index].description = description;
        setPhotos(updatedPhotos);
        updateData({ attachments: { documents, photos: updatedPhotos } });
    };

    const removeDocument = (index) => {
        const updatedDocs = documents.filter((_, i) => i !== index);
        setDocuments(updatedDocs);
        updateData({ attachments: { documents: updatedDocs, photos } });
    };

    const removePhoto = (index) => {
        const updatedPhotos = photos.filter((_, i) => i !== index);
        setPhotos(updatedPhotos);
        updateData({ attachments: { documents, photos: updatedPhotos } });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>

            {/* Documents Section */}
            <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
                    Documentos Gerais (ART, Projetos, etc.)
                </h3>

                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <input
                        type="file"
                        multiple
                        onChange={handleDocumentUpload}
                        id="doc-upload"
                        style={{ display: 'none' }}
                    />
                    <label
                        htmlFor="doc-upload"
                        style={{
                            display: 'inline-block',
                            padding: '0.5rem 1rem',
                            backgroundColor: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        + Adicionar Documentos
                    </label>
                </div>

                {documents.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                        {documents.map((doc, index) => (
                            <li key={index} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: 'var(--spacing-sm)',
                                backgroundColor: 'var(--color-bg-primary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    📄 {doc.name} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>({(doc.size / 1024).toFixed(1)} KB)</span>
                                </span>
                                <button
                                    onClick={() => removeDocument(index)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--color-error)',
                                        cursor: 'pointer',
                                        fontSize: '1.25rem'
                                    }}
                                >
                                    &times;
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

            {/* Photos Section */}
            <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
                    Registro Fotográfico
                </h3>

                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        id="photo-upload"
                        style={{ display: 'none' }}
                    />
                    <label
                        htmlFor="photo-upload"
                        style={{
                            display: 'inline-block',
                            padding: '0.5rem 1rem',
                            backgroundColor: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        + Adicionar Fotos
                    </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                    {photos.map((photo, index) => (
                        <div key={index} style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            backgroundColor: 'var(--color-bg-primary)'
                        }}>
                            <div style={{ position: 'relative', height: '200px' }}>
                                <img
                                    src={photo.preview}
                                    alt={photo.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <button
                                    onClick={() => removePhoto(index)}
                                    style={{
                                        position: 'absolute',
                                        top: '5px',
                                        right: '5px',
                                        background: 'rgba(0,0,0,0.5)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    &times;
                                </button>
                            </div>
                            <div style={{ padding: 'var(--spacing-sm)' }}>
                                <input
                                    type="text"
                                    placeholder="Descrição da foto..."
                                    value={photo.description}
                                    onChange={(e) => handlePhotoDescriptionChange(index, e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--spacing-xs)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default Attachments;
