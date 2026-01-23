import React from 'react';
import './styles.css';

const StatCard = ({ title, subtitle, value, icon, trend, trendUp, borderColor }) => {
    const cardStyle = borderColor
        ? { border: `2px solid ${borderColor}` }
        : {};

    return (
        <div className="stat-card" style={cardStyle}>
            <div className="stat-header">
                <div>
                    <p className="stat-title">{title}</p>
                    {/* <p className="stat-subtitle">{subtitle}</p> */}
                    <h3 className="stat-value">{value}</h3>
                </div>
                <div className="stat-icon">
                    {icon}
                </div>
            </div>
            {trend && (
                <div className="stat-trend">
                    <span className={`trend-value ${trendUp ? 'trend-up' : 'trend-down'}`}>
                        {trend}
                    </span>
                    <span className="trend-label">vs mês anterior</span>
                </div>
            )}
        </div>
    );
};

export default StatCard;
