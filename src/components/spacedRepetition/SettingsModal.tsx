import React, { useState } from 'react';
import { AlgorithmParameters } from '@/types/spacedRepetition';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
    parameters: AlgorithmParameters;
    onParametersUpdate: (parameters: Partial<AlgorithmParameters>) => void;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    parameters,
    onParametersUpdate,
    onClose
}) => {
    const [localParameters, setLocalParameters] = useState<AlgorithmParameters>(parameters);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalParameters(prev => ({
            ...prev,
            [name]: parseFloat(value)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onParametersUpdate(localParameters);
        onClose();
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Algoritmus beállítások</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.section}>
                        <h3>Ease Factor beállítások</h3>
                        <div className={styles.formGroup}>
                            <label htmlFor="initialEaseFactor">Kezdeti ease factor</label>
                            <input
                                type="number"
                                id="initialEaseFactor"
                                name="initialEaseFactor"
                                value={localParameters.initialEaseFactor}
                                onChange={handleChange}
                                step="0.1"
                                min="1.3"
                                max="2.5"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="minimumEaseFactor">Minimális ease factor</label>
                            <input
                                type="number"
                                id="minimumEaseFactor"
                                name="minimumEaseFactor"
                                value={localParameters.minimumEaseFactor}
                                onChange={handleChange}
                                step="0.1"
                                min="1.3"
                                max="2.5"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="maximumEaseFactor">Maximális ease factor</label>
                            <input
                                type="number"
                                id="maximumEaseFactor"
                                name="maximumEaseFactor"
                                value={localParameters.maximumEaseFactor}
                                onChange={handleChange}
                                step="0.1"
                                min="1.3"
                                max="2.5"
                            />
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3>Súlyozási tényezők</h3>
                        <div className={styles.formGroup}>
                            <label htmlFor="difficultyWeight">Nehézség súlyozása</label>
                            <input
                                type="number"
                                id="difficultyWeight"
                                name="difficultyWeight"
                                value={localParameters.difficultyWeight}
                                onChange={handleChange}
                                step="0.1"
                                min="0"
                                max="1"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="performanceWeight">Teljesítmény súlyozása</label>
                            <input
                                type="number"
                                id="performanceWeight"
                                name="performanceWeight"
                                value={localParameters.performanceWeight}
                                onChange={handleChange}
                                step="0.1"
                                min="0"
                                max="1"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="responseTimeWeight">Válaszidő súlyozása</label>
                            <input
                                type="number"
                                id="responseTimeWeight"
                                name="responseTimeWeight"
                                value={localParameters.responseTimeWeight}
                                onChange={handleChange}
                                step="0.1"
                                min="0"
                                max="1"
                            />
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3>Egyéb beállítások</h3>
                        <div className={styles.formGroup}>
                            <label htmlFor="intervalModifier">Intervallum módosító</label>
                            <input
                                type="number"
                                id="intervalModifier"
                                name="intervalModifier"
                                value={localParameters.intervalModifier}
                                onChange={handleChange}
                                step="0.1"
                                min="0.5"
                                max="2"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="newItemsPerDay">Új tételek naponta</label>
                            <input
                                type="number"
                                id="newItemsPerDay"
                                name="newItemsPerDay"
                                value={localParameters.newItemsPerDay}
                                onChange={handleChange}
                                min="1"
                                max="100"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="maxReviewsPerDay">Maximális ismétlések naponta</label>
                            <input
                                type="number"
                                id="maxReviewsPerDay"
                                name="maxReviewsPerDay"
                                value={localParameters.maxReviewsPerDay}
                                onChange={handleChange}
                                min="1"
                                max="200"
                            />
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelButton} onClick={onClose}>
                            Mégse
                        </button>
                        <button type="submit" className={styles.saveButton}>
                            Mentés
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}; 