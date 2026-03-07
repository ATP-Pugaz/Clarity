import { useState, useRef, useEffect } from 'react';
import './Auth.css';

export default function Auth({ onLoginSuccess }) {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const otpRefs = useRef([]);

    // Handle phone input - only numbers
    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        setPhone(value);
        setError('');
    };

    const fullPhone = `+91 ${phone}`;

    const resetMessages = () => {
        setError('');
        setSuccess('');
    };

    const resetForm = () => {
        setPhone('');
        setPassword('');
        setName('');
        setConfirmPassword('');
        resetMessages();
    };

    const switchMode = (targetMode) => {
        setMode(targetMode);
        resetForm();
    };

    // Handle login form submit
    const handleLogin = async (e) => {
        e.preventDefault();
        resetMessages();

        // Validate phone
        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        // Validate password
        if (password.length < 4) {
            setError('Password must be at least 4 characters');
            return;
        }

        // Check if user exists
        let users = [];
        try {
            const savedUsers = localStorage.getItem('mm_users');
            if (savedUsers) {
                users = JSON.parse(savedUsers) || [];
            }
        } catch {
            // Ignore parse errors and treat as no users
        }

        const existingUser = users.find(u => u.phone === fullPhone);

        if (!existingUser) {
            setError('No account found for this mobile number. Please register first.');
            return;
        }

        if (existingUser.password !== password) {
            setError('Incorrect password. Please try again.');
            return;
        }

        setLoading(true);
        resetMessages();

        await new Promise(resolve => setTimeout(resolve, 1500));

        setLoading(false);
        setSuccess('Login successful! Redirecting...');

        // Save auth state
        localStorage.setItem('mm_auth', JSON.stringify({
            isLoggedIn: true,
            phone: `+91 ${phone}`,
            loginTime: new Date().toISOString()
        }));

        setTimeout(() => {
            onLoginSuccess();
        }, 1000);
    };

    // No OTP flow – direct password login only

    const handleRegister = async (e) => {
        e.preventDefault();
        resetMessages();

        if (!name.trim()) {
            setError('Please enter your name');
            return;
        }

        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        if (password.length < 4) {
            setError('Password must be at least 4 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        let users = [];
        try {
            const savedUsers = localStorage.getItem('mm_users');
            if (savedUsers) {
                users = JSON.parse(savedUsers) || [];
            }
        } catch {
            // Ignore parse errors and start fresh
            users = [];
        }

        if (users.some(u => u.phone === fullPhone)) {
            setError('An account with this mobile number already exists. Please log in.');
            return;
        }

        setLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        const newUser = {
            id: Date.now().toString(),
            name: name.trim(),
            phone: fullPhone,
            password,
            createdAt: new Date().toISOString(),
        };

        const updatedUsers = [...users, newUser];
        localStorage.setItem('mm_users', JSON.stringify(updatedUsers));

        localStorage.setItem('mm_auth', JSON.stringify({
            isLoggedIn: true,
            phone: fullPhone,
            name: newUser.name,
            loginTime: new Date().toISOString(),
        }));

        setLoading(false);
        setSuccess('Account created successfully! Redirecting...');

        setTimeout(() => {
            onLoginSuccess();
        }, 1000);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Logo */}
                <div className="auth-logo">
                    <div className="auth-logo-icon">💰</div>
                    <h1 className="auth-logo-text">Money Manager</h1>
                    <p className="auth-logo-sub">Premium Financial Tracker</p>
                </div>

                {mode === 'login' ? (
                    /* Login Form (phone + password only) */
                    <form className="auth-form" onSubmit={handleLogin}>
                            {/* Phone Input */}
                            <div className="auth-input-group">
                                <label className="auth-label">
                                    📱 Mobile Number
                                </label>
                                <div className="phone-input-wrapper">
                                    <input
                                        type="text"
                                        className="country-code"
                                        value="+91"
                                        disabled
                                    />
                                    <input
                                        type="tel"
                                        className="phone-input"
                                        placeholder="Enter 10-digit number"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        maxLength={10}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="auth-input-group">
                                <label className="auth-label">
                                    🔒 Password
                                </label>
                                <div className="auth-input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="auth-input"
                                        style={{ paddingLeft: '16px', paddingRight: '48px' }}
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

                            {/* Error Message */}
                            {error && (
                                <div className="auth-error">
                                    ⚠️ {error}
                                </div>
                            )}

                            {/* Success Message */}
                            {success && (
                                <div className="auth-success">
                                    ✅ {success}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                                disabled={loading || phone.length !== 10 || password.length < 4}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner" />
                                        Logging in...
                                    </>
                                ) : (
                                    <>
                                        Login 🔐
                                    </>
                                )}
                            </button>
                        </form>
                ) : (
                    /* Registration Form */
                    <form className="auth-form" onSubmit={handleRegister}>
                        {/* Name Input */}
                        <div className="auth-input-group">
                            <label className="auth-label">
                                👤 Full Name
                            </label>
                            <div className="auth-input-wrapper">
                                <input
                                    type="text"
                                    className="auth-input"
                                    style={{ paddingLeft: '16px' }}
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); setError(''); }}
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone Input */}
                        <div className="auth-input-group">
                            <label className="auth-label">
                                📱 Mobile Number
                            </label>
                            <div className="phone-input-wrapper">
                                <input
                                    type="text"
                                    className="country-code"
                                    value="+91"
                                    disabled
                                />
                                <input
                                    type="tel"
                                    className="phone-input"
                                    placeholder="Enter 10-digit number"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    maxLength={10}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="auth-input-group">
                            <label className="auth-label">
                                🔒 Password
                            </label>
                            <div className="auth-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="auth-input"
                                    style={{ paddingLeft: '16px', paddingRight: '48px' }}
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

                        {/* Confirm Password Input */}
                        <div className="auth-input-group">
                            <label className="auth-label">
                                ✅ Confirm Password
                            </label>
                            <div className="auth-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="auth-input"
                                    style={{ paddingLeft: '16px' }}
                                    placeholder="Re-enter your password"
                                    value={confirmPassword}
                                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                                    required
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="auth-error">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="auth-success">
                                ✅ {success}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                            disabled={
                                loading ||
                                !name.trim() ||
                                phone.length !== 10 ||
                                password.length < 4 ||
                                confirmPassword.length < 4
                            }
                        >
                            {loading ? (
                                <>
                                    <span className="spinner" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create Account ✨
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Toggle between Login and Register */}
                <div className="auth-switch">
                    {mode === 'login' ? (
                        <p>
                            Don&apos;t have an account?{' '}
                            <button
                                type="button"
                                className="auth-switch-btn"
                                onClick={() => switchMode('register')}
                            >
                                Create one
                            </button>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{' '}
                            <button
                                type="button"
                                className="auth-switch-btn"
                                onClick={() => switchMode('login')}
                            >
                                Log in
                            </button>
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="auth-footer">
                    <p className="auth-footer-text">
                        Secure login with OTP verification 🔐
                    </p>
                </div>
            </div>
        </div>
    );
}
