import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './AuthForms.module.css';

export const LoginForm: React.FC = () => {
    const { login } = useAuth();
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await login(credentials);
        } catch (err) {
            setError('Hibás email vagy jelszó');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <h2>Bejelentkezés</h2>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={credentials.email}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                />
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="password">Jelszó</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                />
            </div>

            <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
            >
                {isLoading ? 'Bejelentkezés...' : 'Bejelentkezés'}
            </button>

            <div className={styles.links}>
                <a href="/forgot-password">Elfelejtetted a jelszavad?</a>
                <a href="/register">Még nincs fiókod? Regisztrálj!</a>
            </div>
        </form>
    );
}; 