import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './AuthForms.module.css';

export const RegisterForm: React.FC = () => {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'student' as const
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError('A jelszavak nem egyeznek');
            return;
        }

        setIsLoading(true);

        try {
            await register({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                role: formData.role
            });
        } catch (err) {
            setError('Hiba történt a regisztráció során');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <h2>Regisztráció</h2>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.formGroup}>
                <label htmlFor="name">Név</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
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
                    required
                    disabled={isLoading}
                />
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="role">Felhasználói típus</label>
                <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                >
                    <option value="student">Tanuló</option>
                    <option value="teacher">Tanár</option>
                </select>
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="password">Jelszó</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    disabled={isLoading}
                />
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Jelszó megerősítése</label>
                <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={8}
                    disabled={isLoading}
                />
            </div>

            <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
            >
                {isLoading ? 'Regisztráció...' : 'Regisztráció'}
            </button>

            <div className={styles.links}>
                <a href="/login">Már van fiókod? Jelentkezz be!</a>
            </div>
        </form>
    );
}; 