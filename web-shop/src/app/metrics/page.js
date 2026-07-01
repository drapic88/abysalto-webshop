'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/cartHelper';

export default function MetricsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchMetricsAndOrders = async () => {
    try {
      const metricsRes = await fetch(`${API_BASE_URL}/metrics`);
      if (!metricsRes.ok) throw new Error('Failed to retrieve system metrics');
      const metricsData = await metricsRes.json();
      setMetrics(metricsData);
    } catch (err) {
      console.error('Error fetching metrics:', err);
    }

    try {
      const ordersRes = await fetch(`${API_BASE_URL}/orders`);
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetricsAndOrders();
    // Live update ticker polling every 2 seconds for active monitoring feedback
    const interval = setInterval(fetchMetricsAndOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <span className="logo-spark" style={{ display: 'inline-block', animation: 'spin 2s linear infinite', fontSize: '3rem' }}>✦</span>
        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>Scraping Micrometer Prometheus metrics...</p>
      </div>
    );
  }

  // Fallback default values if backend didn't respond
  const activeCarts = metrics?.activeCarts ?? 0;
  const totalSales = metrics?.totalSalesVolume ?? 0.00;
  const itemsAdded = metrics?.itemsAdded ?? 0;
  const purchasesCount = metrics?.purchasesCount ?? 0;
  const averageCartAmount = metrics?.averageCartAmount ?? 0.00;
  const minCartAmount = metrics?.minCartAmount ?? 0.00;
  const maxCartAmount = metrics?.maxCartAmount ?? 0.00;
  const productsSold = metrics?.productsSold ?? {};
  const errorRate = metrics?.errorRatePercent ?? '0.00';
  const conversionRate = metrics?.conversionRatePercent ?? '0.0';
  const cpuPercent = metrics?.cpuUsagePercent ?? '1.2';
  const usedMemory = metrics?.usedMemoryMb ?? 142;
  const totalMemory = metrics?.totalMemoryMb ?? 512;
  const p95 = metrics?.p95LatencyMs ?? 14;
  const p99 = metrics?.p99LatencyMs ?? 28;
  const virtualThreads = metrics?.virtualThreadsActive ?? 1;

  const memoryPercent = ((usedMemory / totalMemory) * 100).toFixed(1);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
            System Performance Observability
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Real-time scraping of OpenTelemetry logs and custom JVM actuator metrics. Updates every 2s.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '0.5rem 1rem', borderRadius: '50px' }}>
          <span className="live-pulse" style={{ backgroundColor: '#06b6d4' }}></span>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Live Stream Connected
          </span>
        </div>
      </div>

      {/* Main Core Sales Metrics Grid */}
      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-title">Active Carts</div>
          <div className="metric-value">{activeCarts}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Current active shopper sessions</p>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-title">Sales Volume</div>
          <div className="metric-value gold">${totalSales.toFixed(2)}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Aggregated checkout totals</p>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-title">Items Added</div>
          <div className="metric-value">{itemsAdded}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Total physical units added</p>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-title">Checkout Conversion</div>
          <div className="metric-value emerald">{conversionRate}%</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Carts converted to final orders</p>
        </div>
      </div>

      {/* Business Sales Metrics Grid */}
      <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', marginTop: '2rem' }}>
        Financial & Checkout Insights
      </h3>
      <div className="metrics-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-card metric-card">
          <div className="metric-title">Completed Purchases</div>
          <div className="metric-value">{purchasesCount}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Total processed checkouts</p>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-title">Average Order Value</div>
          <div className="metric-value gold">${averageCartAmount.toFixed(2)}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Average cart total</p>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-title">Minimum Order Value</div>
          <div className="metric-value">${minCartAmount.toFixed(2)}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Smallest successful checkout</p>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-title">Maximum Order Value</div>
          <div className="metric-value gold">${maxCartAmount.toFixed(2)}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Largest successful checkout</p>
        </div>
      </div>

      {/* Observability, Server Health, and JVM Memory Charts Section */}
      <div className="chart-section">
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
            JVM & Runtime Resources
          </h3>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>CPU Usage</span>
              <span style={{ fontWeight: '600' }}>{cpuPercent}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${Math.min(parseFloat(cpuPercent), 100)}%` }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>JVM Heap Memory</span>
              <span style={{ fontWeight: '600' }}>{usedMemory}MB / {totalMemory}MB ({memoryPercent}%)</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${memoryPercent}%`, background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)' }}></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>VIRTUAL THREADS</span>
              <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white' }}>{virtualThreads} Active</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>DOCKER RUNTIME</span>
              <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white' }}>GKE Node (Sim)</span>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
            HTTP Performance & Latency
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>p95 Latency</span>
                <p style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white' }}>{p95}ms</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>TARGET</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--accent-emerald)' }}>&lt; 50ms (Optimal)</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>p99 Latency</span>
                <p style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white' }}>{p99}ms</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>TARGET</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--accent-emerald)' }}>&lt; 100ms (Optimal)</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>HTTP Error Rate</span>
                <p style={{ fontSize: '1.8rem', fontWeight: '800', color: errorRate === '0.00' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{errorRate}%</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>SLA THRESHOLD</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--accent-rose)' }}>&gt; 1.00% (Critical)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Inventory Sales Performance */}
      <div className="glass-card" style={{ marginTop: '2.5rem', padding: '2rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
          Product Sales Performance
        </h3>
        {Object.keys(productsSold).length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No products have been sold yet. Complete a checkout to populate this data!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            {Object.entries(productsSold).map(([productName, quantity]) => (
              <div key={productName} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', fontSize: '1rem' }}>{productName}</span>
                  <span style={{ fontWeight: '700', color: 'var(--accent-gold)', fontSize: '1rem' }}>{quantity} unit(s) sold</span>
                </div>
                <div className="progress-bar-container" style={{ height: '6px' }}>
                  <div className="progress-bar-fill" style={{ 
                    width: `${Math.min(quantity * 10, 100)}%`, 
                    background: 'linear-gradient(90deg, var(--accent-solid) 0%, var(--accent-gold) 100%)' 
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Orders Archive */}
      <div className="glass-card" style={{ marginTop: '2.5rem', padding: '2rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
          Completed Orders Archive
        </h3>
        {orders.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No orders have been recorded yet. Place an order to see it listed here!</p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Order / ID</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Date & Time</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Customer</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderId || order.cartId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '1rem 0.5rem', fontFamily: 'monospace', color: 'var(--accent-gold)', fontWeight: '600' }}>
                      {(order.orderId || order.cartId).substring(0, 8)}...
                    </td>
                    <td style={{ padding: '1rem 0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {order.checkedOutAt ? new Date(order.checkedOutAt).toLocaleString() : 'N/A'}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: '500' }}>
                      {order.customerName || 'Anonymous'}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: '700', textAlign: 'right', color: 'white' }}>
                      ${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '2rem'
        }} onClick={() => setSelectedOrder(null)}>
          <div style={{
            background: '#0d0d15',
            border: '1px solid var(--border-glass)',
            borderRadius: '16px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Order Invoice</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-gold)', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                  {selectedOrder.orderId || selectedOrder.cartId}
                </h4>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  transition: 'background-color 0.2s'
                }}
              >
                ✕
              </button>
            </div>

            {/* Customer Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '0.25rem' }}>Customer Name</span>
                <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'white' }}>{selectedOrder.customerName || 'Anonymous'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '0.25rem' }}>Shipping Address</span>
                <span style={{ fontSize: '1.05rem', fontWeight: '500', color: 'var(--text-secondary)' }}>{selectedOrder.shippingAddress || 'N/A'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '0.25rem' }}>Purchased At</span>
                <span style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  {selectedOrder.checkedOutAt ? new Date(selectedOrder.checkedOutAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '0.25rem' }}>Currency</span>
                <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{selectedOrder.currency || 'USD'}</span>
              </div>
            </div>

            {/* List of Products */}
            <div style={{ marginBottom: '2rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '0.75rem' }}>Products Purchased</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedOrder.items && selectedOrder.items.map((item) => (
                  <div key={item.cartItemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontWeight: '600', display: 'block', color: 'white' }}>{item.productName}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {item.productId}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: '500', display: 'block' }}>{item.quantity} × ${item.unitPrice.toFixed(2)}</span>
                      <span style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>${item.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '300px', marginLeft: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                <span style={{ color: 'white' }}>${selectedOrder.subtotalAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tax Rate:</span>
                <span style={{ color: 'white' }}>{(selectedOrder.taxRate * 100).toFixed(0)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tax Amount:</span>
                <span style={{ color: 'white' }}>${selectedOrder.taxAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ color: 'white' }}>Total Paid:</span>
                <span style={{ color: 'var(--accent-gold)' }}>${selectedOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setSelectedOrder(null)}
              className="btn-premium"
              style={{ width: '100%', marginTop: '2rem', padding: '0.85rem' }}
            >
              Close Invoice Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
