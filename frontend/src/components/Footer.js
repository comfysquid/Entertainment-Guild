import React from 'react';

function Footer() {
  return (
    <footer className="border-top bg-white mt-auto">
      {/* Standard nav bar, adjusts to screen sizes. */}
      <div className="container py-4 d-flex flex-column flex-md-row justify-content-between gap-3">
        <div>
          <p className="mb-1 fw-semibold">Entertainment Guild</p>
          <small className="text-muted">Books, movies, and games in one place.</small>
        </div>
        <nav aria-label="Footer navigation" className="d-flex gap-3">
          <a className="text-muted" href="/">
            Home
          </a>
          <a className="text-muted" href="/search">
            Browse items
          </a>
          <a className="text-muted" href="/account">
            Account
          </a>
        </nav>
      </div>
      <div className="container pb-3">
        <small className="text-muted">&copy; {new Date().getFullYear()} Entertainment Guild</small>
      </div>
    </footer>
  );
}

export default Footer;