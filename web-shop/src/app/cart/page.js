'use client';

import { useState, useEffect } from 'react';
import { getOrCreateCartId, API_BASE_URL } from '../utils/cartHelper';

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchCart = async () => {
    const cartId = getOrCreateCartId();
    try {
      const res = await fetch(`${API_BASE_URL}/carts/${cartId}`);
      if (!res.ok) throw new Error('Failed to retrieve cart');
      const data = await res.json();
      setCart(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (productId, currentQty, amount) => {
    const cartId = getOrCreateCartId();
    const newQty = currentQty + amount;
    if (newQty < 1) {
      handleRemoveItem(productId);
      return;
    }

    setUpdatingId(productId);
    try {
      const res = await fetch(`${API_BASE_URL}/carts/${cartId}/items/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQty }),
      });

      if (!res.ok) {
        const errorDetail = await res.json();
        throw new Error(errorDetail.detail || 'Failed to update quantity');
      }

      const data = await res.json();
      setCart(data);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (productId) => {
    const cartId = getOrCreateCartId();
    setUpdatingId(productId);
    try {
      const res = await fetch(`${API_BASE_URL}/carts/${cartId}/items/${productId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove item');
      const data = await res.json();
      setCart(data);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCart = async () => {
    const cartId = getOrCreateCartId();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/carts/${cartId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to clear cart');
      const data = await res.json();
      setCart(data);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <span className="logo-spark" style={{ display: 'inline-block', animation: 'spin 2s linear infinite', fontSize: '3rem' }}>✦</span>
        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>Loading cart contents...</p>
      </div>
    );
  }

  const isCartEmpty = !cart || !cart.items || cart.items.length === 0;

  if (isCartEmpty) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '600px', margin: '2rem auto' }}>
        <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1.5rem' }}>🛒</span>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: '700' }}>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
          Explore our collection of premium desk gear, accessories, and audio setups to populate your list.
        </p>
        <a href="/">
          <button className="btn-premium">Browse Catalog</button>
        </a>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '2rem', letterSpacing: '-0.5px' }}>
        Your Shopping Cart
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
        {/* Cart Line Items Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {cart.items.map((item) => (
            <div key={item.productId} className="glass-card" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem 2rem',
              position: 'relative'
            }}>
              <div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.25rem' }}>{item.productName}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Unit Price: <span style={{ color: 'var(--accent-gold)', fontWeight: '600' }}>${item.unitPrice.toFixed(2)}</span>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {/* Quantity Control Buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <button 
                    onClick={() => handleUpdateQuantity(item.productId, item.quantity, -1)}
                    disabled={updatingId === item.productId}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      transition: 'var(--transition-smooth)'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}
                  >
                    -
                  </button>
                  <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: '600' }}>{item.quantity}</span>
                  <button 
                    onClick={() => handleUpdateQuantity(item.productId, item.quantity, 1)}
                    disabled={updatingId === item.productId}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      transition: 'var(--transition-smooth)'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}
                  >
                    +
                  </button>
                </div>

                <div style={{ textAlign: 'right', minWidth: '6rem' }}>
                  <p style={{ fontWeight: '700', fontSize: '1.15rem' }}>${item.subtotal.toFixed(2)}</p>
                </div>

                <button 
                  onClick={() => handleRemoveItem(item.productId)}
                  disabled={updatingId === item.productId}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-rose)',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '0.5rem',
                    marginLeft: '0.5rem'
                  }}
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <a href="/">
              <button className="btn-secondary">← Back to Catalog</button>
            </a>
            <button className="btn-secondary" style={{ color: 'var(--accent-rose)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={handleClearCart}>
              Clear Shopping Cart
            </button>
          </div>
        </div>

        {/* Dynamic Financial Breakdowns Summary Column */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '700', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
            Order Summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span style={{ fontWeight: '500' }}>${cart.subtotalAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>VAT / Sales Tax (20%)</span>
              <span style={{ fontWeight: '500' }}>${cart.taxAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <span style={{ fontWeight: '600', fontSize: '1.15rem' }}>Grand Total</span>
              <span style={{ fontWeight: '800', fontSize: '1.3rem', color: 'var(--accent-gold)' }}>
                ${cart.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <a href="/checkout" style={{ width: '100%', marginTop: '1rem' }}>
            <button className="btn-premium" style={{ width: '100%', padding: '1rem' }}>
              Proceed to Checkout
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
