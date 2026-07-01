'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrCreateCartId, API_BASE_URL, clearCartId } from '../utils/cartHelper';

export default function CheckoutPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !email || !streetAddress || !postalCode) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    const cartId = getOrCreateCartId();

    try {
      const response = await fetch(`${API_BASE_URL}/carts/${cartId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: customerName,
          shippingAddress: `${streetAddress}, ${postalCode}`,
        }),
      });

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(errorDetail.detail || 'Failed to complete checkout');
      }

      const result = await response.json();
      
      // Clear persistent cart UUID so a fresh one is generated for the next purchase
      clearCartId();

      // Redirect to thank you page with order details
      router.push(`/thank-you?orderId=${result.orderId}`);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '2rem', letterSpacing: '-0.5px', textAlign: 'center' }}>
        Checkout Details
      </h2>

      <div className="glass-card">
        <form onSubmit={handleSubmit}>
          {errorMessage && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: 'var(--accent-rose)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.95rem',
              fontWeight: '500'
            }}>
              ✕ {errorMessage}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="customerName">Full Name</label>
            <input 
              type="text" 
              id="customerName"
              className="input-premium"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Dragan Radovic"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email"
              className="input-premium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dragan@abysalto.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="streetAddress">Street Address</label>
            <input 
              type="text" 
              id="streetAddress"
              className="input-premium"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="123 Highscale Ave"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="postalCode">Postal / Zip Code</label>
            <input 
              type="text" 
              id="postalCode"
              className="input-premium"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="10001"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-premium" 
            style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}
            disabled={submitting}
          >
            {submitting ? 'Processing Transaction...' : 'Complete Secure Purchase'}
          </button>
        </form>
      </div>
    </div>
  );
}
