import React from 'react';
import './styles.css';

const TechnicalOpinion = ({ data, updateData }) => {
    const handleChange = (e) => {
        updateData({ [e.target.name]: e.target.value });
    };

    return (
        <div className="technical-opinion-container">
            <label className="form-label">Parecer Técnico</label>
            <textarea
                name="technicalOpinion"
                value={data.technicalOpinion || ''}
                onChange={handleChange}
                placeholder="Descreva o parecer técnico sobre a instalação do SPDA..."
                className="technical-opinion-textarea"
            />
        </div>
    );
};

export default TechnicalOpinion;
