import React from 'react';
import './styles.css';

const ColorPicker = ({ label, color, onChange, id }) => {
    return (
        <div className="color-picker-container">
            <label htmlFor={id} className="color-picker-label">{label}</label>
            <div className="color-input-wrapper">
                <input
                    type="color"
                    id={id}
                    value={color}
                    onChange={(e) => onChange(e.target.value)}
                    className="color-input-native"
                />
                <div className="color-preview" style={{ backgroundColor: color }}></div>
                <span className="color-value">{color}</span>
            </div>
        </div>
    );
};

export default ColorPicker;
