import React from 'react';
import './styles.css';

const SubscriptionPlan = ({ subscription, onUpgrade }) => {
    const isFreePlan = subscription === 'free' || !subscription;

    return (
        <div className={`subscription-badge ${isFreePlan ? 'free' : 'pro'}`}>
            <div>
                <span className="subscription-plan">Seu Plano:</span>
                <span className={`subscription-plan-name ${isFreePlan ? 'free' : 'pro'}`}>
                    {subscription || 'Free'}
                </span>
            </div>
            {isFreePlan && (
                <button className="upgrade-button" onClick={onUpgrade}>
                    Fazer Upgrade 🚀
                </button>
            )}
        </div>
    );
};

export default SubscriptionPlan;
