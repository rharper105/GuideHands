import './portal.css'

export const metadata = {
  title: 'Veteran Benefits Portal',
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="portal-page">
      <header className="portal-header">
        <div className="portal-header-inner">
          <div className="portal-brand">
            <div className="portal-seal">US</div>
            <div className="portal-brand-text">
              <h1>Veteran Benefits Portal</h1>
              <p>U.S. Department of Veteran Services</p>
            </div>
          </div>
          <nav className="portal-header-links">
            <a href="/demo-portal">Home</a>
            <a href="#">My Account</a>
            <a href="#">Help</a>
            <a href="#">Sign Out</a>
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}
