import React from 'react';

export const LoadingSpinner: React.FC = () => {
    return (
        <div className="loading-spinner" role="status" aria-label="Betöltés folyamatban">
            <div className="spinner">
                <div className="spinner-inner" />
            </div>
            <p>Betöltés...</p>
        </div>
    );
}; 