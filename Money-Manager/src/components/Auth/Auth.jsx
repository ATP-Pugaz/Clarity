import { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import './Auth.css';

export default function Auth({ onLoginSuccess }) {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const resetMessages = () => {
        setError('');
        setSuccess('');
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setUsername('');
        setPhone('');
        setConfirmPassword('');
        resetMessages();
    };

    const switchMode = (targetMode) => {
        setMode(targetMode);
        resetForm();
    };

    // Google OAuth Login
    const handleGoogleLogin = async () => {
        resetMessages();
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) setError(error.message);
        setLoading(false);
    };

    // Handle Login (Email + Password)
    const handleLogin = async (e) => {
        e.preventDefault();
        resetMessages();

        if (!email || !password) {
            setError('Please enter your email and password');
            return;
        }

        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess('Login successful! Redirecting...');

            // Save local fallback session
            localStorage.setItem('mm_auth', JSON.stringify({
                isLoggedIn: true,
                email: data.user.email,
                loginTime: new Date().toISOString(),
                supabaseSession: data.session
            }));

            setTimeout(() => {
                onLoginSuccess();
            }, 1000);
        }
    };

    // Handle Registration
    const handleRegister = async (e) => {
        e.preventDefault();
        resetMessages();

        if (!username.trim() || !email.trim() || !phone.trim() || !password) {
            setError('Please fill all fields');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username.trim(),
                    phone: `+91${phone.replace(/\D/g, '')}`
                }
            }
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess('Account created! You can now log in.');
            setLoading(false);
            setTimeout(() => {
                switchMode('login');
            }, 1500);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">💰</div>
                    <h1 className="auth-logo-text">Clarity</h1>
                    <p className="auth-logo-sub">Premium Financial Tracker</p>
                </div>

                {mode === 'login' ? (
                    /* Login Form */
                    <form className="auth-form" onSubmit={handleLogin}>
                        <div className="auth-input-group">
                            <label className="auth-label">📧 Email / Username</label>
                            <input
                                type="email"
                                className="auth-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                required
                            />
                        </div>

                        <div className="auth-input-group">
                            <label className="auth-label">🔒 Password</label>
                            <div className="auth-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="auth-input"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        {error && <div className="auth-error">⚠️ {error}</div>}
                        {success && <div className="auth-success">✅ {success}</div>}

                        <button
                            type="submit"
                            className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                            disabled={loading || !email || !password}
                        >
                            {loading ? 'Logging in...' : 'Login 🔐'}
                        </button>

                        <div style={{ textAlign: 'center', margin: '10px 0', opacity: 0.7 }}>OR</div>

                        <button
                            type="button"
                            className="auth-submit-btn"
                            style={{ background: '#fff', color: '#333', border: '1px solid #ccc' }}
                            onClick={handleGoogleLogin}
                            disabled={loading}
                        >
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G" style={{ width: '16px', marginRight: '8px', verticalAlign: 'middle' }} />
                            Login with Google
                        </button>
                    </form>
                ) : (
                    /* Registration Form */
                    <form className="auth-form" onSubmit={handleRegister}>
                        <div className="auth-input-group">
                            <label className="auth-label">👤 Username</label>
                            <input
                                type="text"
                                className="auth-input"
                                placeholder="Choose a username"
                                value={username}
                                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                                required
                            />
                        </div>

                        <div className="auth-input-group">
                            <label className="auth-label">📧 Email</label>
                            <input
                                type="email"
                                className="auth-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                required
                            />
                        </div>

                        <div className="auth-input-group">
                            <label className="auth-label">📱 Mobile Number</label>
                            <input
                                type="tel"
                                className="auth-input"
                                placeholder="10-digit mobile number"
                                value={phone}
                                onChange={(e) => { setPhone(e.target.value); setError(''); }}
                                maxLength={10}
                                required
                            />
                        </div>

                        <div className="auth-input-group">
                            <label className="auth-label">🔒 Password</label>
                            <div className="auth-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="auth-input"
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label className="auth-label">✅ Confirm Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="auth-input"
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                                required
                            />
                        </div>

                        {error && <div className="auth-error">⚠️ {error}</div>}
                        {success && <div className="auth-success">✅ {success}</div>}

                        <button
                            type="submit"
                            className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                            disabled={loading || !username || !email || !phone || !password || !confirmPassword}
                        >
                            {loading ? 'Creating account...' : 'Create Account ✨'}
                        </button>
                    </form>
                )}

                <div className="auth-switch">
                    {mode === 'login' ? (
                        <p> Don&apos;t have an account? <button type="button" className="auth-switch-btn" onClick={() => switchMode('register')}>Create one</button></p>
                    ) : (
                        <p> Already have an account? <button type="button" className="auth-switch-btn" onClick={() => switchMode('login')}>Log in</button></p>
                    )}
                </div>
            </div>
        </div>
    );
}
