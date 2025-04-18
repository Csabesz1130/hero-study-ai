import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './UserProfile.module.css';

export const UserProfile: React.FC = () => {
    const { authState, updateUser, updatePreferences } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: authState.user?.name || '',
        email: authState.user?.email || '',
        preferences: authState.user?.preferences || {
            theme: 'system',
            language: 'hu',
            notifications: {
                email: true,
                push: true,
                frequency: 'daily'
            },
            accessibility: {
                fontSize: 16,
                highContrast: false,
                screenReader: false
            },
            learning: {
                preferredTime: '09:00',
                dailyGoal: 30,
                topics: [],
                difficulty: 'intermediate'
            }
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateUser({
                name: formData.name,
                email: formData.email
            });
            await updatePreferences(formData.preferences);
            setIsEditing(false);
        } catch (error) {
            console.error('Hiba történt a profil frissítése során:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('preferences.')) {
            const prefPath = name.split('.');
            setFormData(prev => ({
                ...prev,
                preferences: {
                    ...prev.preferences,
                    [prefPath[1]]: {
                        ...prev.preferences[prefPath[1] as keyof typeof prev.preferences],
                        [prefPath[2]]: value
                    }
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    if (!authState.user) {
        return null;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Profil</h1>
                <button
                    className={styles.editButton}
                    onClick={() => setIsEditing(!isEditing)}
                >
                    {isEditing ? 'Mégse' : 'Szerkesztés'}
                </button>
            </div>

            {isEditing ? (
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.section}>
                        <h2>Alapadatok</h2>
                        <div className={styles.formGroup}>
                            <label htmlFor="name">Név</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2>Beállítások</h2>
                        <div className={styles.formGroup}>
                            <label htmlFor="preferences.theme">Téma</label>
                            <select
                                id="preferences.theme"
                                name="preferences.theme"
                                value={formData.preferences.theme}
                                onChange={handleChange}
                            >
                                <option value="light">Világos</option>
                                <option value="dark">Sötét</option>
                                <option value="system">Rendszer</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="preferences.language">Nyelv</label>
                            <select
                                id="preferences.language"
                                name="preferences.language"
                                value={formData.preferences.language}
                                onChange={handleChange}
                            >
                                <option value="hu">Magyar</option>
                                <option value="en">Angol</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2>Tanulási beállítások</h2>
                        <div className={styles.formGroup}>
                            <label htmlFor="preferences.learning.preferredTime">
                                Preferált tanulási idő
                            </label>
                            <input
                                type="time"
                                id="preferences.learning.preferredTime"
                                name="preferences.learning.preferredTime"
                                value={formData.preferences.learning.preferredTime}
                                onChange={handleChange}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="preferences.learning.dailyGoal">
                                Napi cél (perc)
                            </label>
                            <input
                                type="number"
                                id="preferences.learning.dailyGoal"
                                name="preferences.learning.dailyGoal"
                                value={formData.preferences.learning.dailyGoal}
                                onChange={handleChange}
                                min="5"
                                max="240"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="preferences.learning.difficulty">
                                Nehézségi szint
                            </label>
                            <select
                                id="preferences.learning.difficulty"
                                name="preferences.learning.difficulty"
                                value={formData.preferences.learning.difficulty}
                                onChange={handleChange}
                            >
                                <option value="beginner">Kezdő</option>
                                <option value="intermediate">Középhaladó</option>
                                <option value="advanced">Haladó</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className={styles.saveButton}>
                        Mentés
                    </button>
                </form>
            ) : (
                <div className={styles.profileInfo}>
                    <div className={styles.section}>
                        <h2>Alapadatok</h2>
                        <p><strong>Név:</strong> {authState.user.name}</p>
                        <p><strong>Email:</strong> {authState.user.email}</p>
                        <p><strong>Felhasználói típus:</strong> {authState.user.role}</p>
                    </div>

                    <div className={styles.section}>
                        <h2>Beállítások</h2>
                        <p><strong>Téma:</strong> {authState.user.preferences.theme}</p>
                        <p><strong>Nyelv:</strong> {authState.user.preferences.language}</p>
                    </div>

                    <div className={styles.section}>
                        <h2>Tanulási beállítások</h2>
                        <p>
                            <strong>Preferált tanulási idő:</strong>{' '}
                            {authState.user.preferences.learning.preferredTime}
                        </p>
                        <p>
                            <strong>Napi cél:</strong>{' '}
                            {authState.user.preferences.learning.dailyGoal} perc
                        </p>
                        <p>
                            <strong>Nehézségi szint:</strong>{' '}
                            {authState.user.preferences.learning.difficulty}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}; 