'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '00000000-0000-0000-0000-000000000000';

  return (
    <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '600px', margin: '3rem auto' }}>
      <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1.5rem', animation: 'bounce 1s infinite alternate' }}>🎉</span>
      <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem', fontWeight: '800', background: 'linear-gradient(to right, #10b981, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Order Finalized Successfully!
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6', fontSize: '1.1rem' }}>
        Thank you for choosing Abysalto Webshop. Your transaction has been registered and a confirmation event was emitted to our distributed processing pipeline.
      </p>

      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border-glass)',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '2.5rem',
        textAlign: 'left'
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', fontWeight: '600' }}>
          Transaction Order Identifier
        </p>
        <code style={{ fontSize: '1.05rem', color: 'var(--accent-gold)', wordBreak: 'break-all', fontWeight: '700', fontFamily: 'monospace' }}>
          {orderId}
        </code>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
        <a href="/">
          <button className="btn-premium">Continue Shopping</button>
        </a>
        <a href="/metrics">
          <button className="btn-secondary">View Live Metrics</button>
        </a>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <span className="logo-spark" style={{ display: 'inline-block', animation: 'spin 2s linear infinite', fontSize: '3rem' }}>✦</span>
        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>Preparing invoice receipts...</p>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}
