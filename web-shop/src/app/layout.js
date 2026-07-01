import './globals.css';

export const metadata = {
  title: 'Abysalto Webshop - Premium Omnichannel Store',
  description: 'Experience real-time high-scale retail with our shopping cart service.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <header className="global-header">
          <div className="header-container">
            <div className="logo-section">
              <span className="logo-spark">✦</span>
              <h1 className="logo-text">ABYSALTO</h1>
            </div>
            <nav className="global-nav">
              <a href="/" className="nav-link">Catalog</a>
              <a href="/cart" className="nav-link nav-cart-link">
                Cart
              </a>
              <a href="/metrics" className="nav-link nav-metrics">
                <span className="live-pulse"></span> Metrics Dashboard
              </a>
            </nav>
          </div>
        </header>
        <main className="main-content">
          {children}
        </main>
        <footer className="global-footer">
          <p>© 2026 Abysalto Webshop. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
