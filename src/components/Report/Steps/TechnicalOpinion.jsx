import React from 'react';

const TechnicalOpinion = ({ data, updateData }) => {
    const handleChange = (e) => {
        updateData({ technicalOpinion: e.target.value });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>

            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                Descreva a conclusão técnica sobre o sistema de SPDA inspecionado, incluindo recomendações e observações finais.
            </p>
            <textarea
                value={data.technicalOpinion || ''}
                onChange={handleChange}
                placeholder="Digite o parecer técnico aqui..."
                style={{
                    width: '100%',
                    minHeight: '200px',
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    resize: 'vertical',
                    fontSize: '1rem',
                    lineHeight: '1.5'
                }}
            />
        </div>
    );
};

export default TechnicalOpinion;
