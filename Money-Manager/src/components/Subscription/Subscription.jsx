import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import './Subscription.css';
import { supabase } from '../../services/supabaseClient';

export default function Subscription() {
    const { userSubscription } = useApp();
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showQR, setShowQR] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [transactionId, setTransactionId] = useState('');
    const [isDismissed, setIsDismissed] = useState(false);

    const plans = [
        { id: 'monthly', name: 'Monthly Plan', price: 29, duration: '1 Month' },
        { id: 'yearly', name: 'Yearly Plan', price: 199, duration: '1 Year' }
    ];

    const upiId = 'atppugazenthi@ptyes'; // User's actual UPI

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        setShowQR(true);
    };

    const handleVerifyTransaction = async (e) => {
        e.preventDefault();
        if (!transactionId.trim()) return;

        setVerifying(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user) {
                // Automatically validate and set status to active per user request
                await supabase.from('subscriptions').upsert({
                    user_id: userData.user.id,
                    plan_type: selectedPlan.id,
                    subscription_status: 'active',
                    trial_end_date: null // Automatically transition them fully
                });

                // We reload to easily refresh the user's fetched subscription in Context
                alert("Payment verified successfully! Premium features unlocked.");
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
            alert("Error verifying payment.");
        } finally {
            setVerifying(false);
        }
    };

    // If the user is already premium or in an active trial, do not show the popup.
    if (userSubscription?.isPremium || userSubscription?.isTrial || isDismissed) {
        return null;
    }

    return (
        <div className="subscription-modal-overlay">
            <div className="subscription-modal-content">
                <button
                    onClick={() => setIsDismissed(true)}
                    style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-color)', fontSize: '28px', cursor: 'pointer', zIndex: 10, lineHeight: 1 }}
                    title="Close"
                >
                    &times;
                </button>
                <div className="auth-logo" style={{ marginBottom: '20px' }}>
                    <div className="auth-logo-icon">⭐</div>
                    <h2 className="auth-logo-text" style={{ fontSize: '24px' }}>Clarity Premium</h2>
                    <p className="auth-logo-sub">Your free trial has ended. Subscribe to unlock access.</p>
                </div>

                {!showQR ? (
                    <div className="plans-grid">
                        {plans.map(plan => (
                            <div key={plan.id} className="plan-card">
                                <h3>{plan.name}</h3>
                                <div className="price">₹{plan.price}</div>
                                <div>{plan.duration}</div>
                                <button onClick={() => handleSelectPlan(plan)}>Select Plan</button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="subscription-container text-center" style={{ background: 'transparent', padding: 0 }}>
                        <h2 style={{ color: 'var(--text-color)', marginBottom: '10px' }}>Pay for {selectedPlan.name}</h2>
                        <p style={{ color: 'var(--text-color)', opacity: 0.8 }}>Transfer ₹{selectedPlan.price} to <strong>{upiId}</strong></p>

                        <div className="qr-box">
                            {/* Simple CSS-based QR code representation for demonstration */}
                            <div style={{ width: '180px', height: '180px', background: '#fff', margin: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '10px' }}>
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=${upiId}&pn=Clarity&am=${selectedPlan.price}&cu=INR`}
                                    alt="UPI QR Code"
                                    style={{ width: '100%', height: '100%', borderRadius: '8px' }}
                                />
                            </div>
                        </div>

                        <form onSubmit={handleVerifyTransaction} style={{ marginTop: '20px' }}>
                            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                                <label style={{ display: 'block', color: 'var(--text-color)', marginBottom: '8px', fontSize: '14px' }}>Enter UTR / Transaction ID</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 123456789012"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={verifying || !transactionId}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--primary-color)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px' }}
                            >
                                {verifying ? 'Verifying...' : 'Verify Payment'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowQR(false)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'transparent', color: 'var(--text-color)', border: '1px solid rgba(255, 255, 255, 0.2)', cursor: 'pointer' }}
                            >
                                Back to Plans
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
