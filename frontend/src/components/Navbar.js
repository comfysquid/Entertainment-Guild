import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  function submitSearch(event) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get('q')?.toString().trim();
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  }

  return (
    <header className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand fw-semibold" to="/">
          Entertainment Guild
        </Link>

        {/* Bootstrap hamburger menu for smaller screens. */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#main-navigation"
          aria-controls="main-navigation"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="main-navigation">
          {/* Main storefront destinations. */}
          <nav className="navbar-nav me-auto" aria-label="Primary navigation">
            <Link className="nav-link active" aria-current="page" to="/">
              Home
            </Link>
            <Link className="nav-link" to="/search">
              Browse items
            </Link>
            <a className="nav-link" href="/cart">
              Cart
            </a>
          </nav>

          {/* Send the search term to the live catalogue page as a query parameter. */}
          <form className="d-flex" onSubmit={submitSearch} role="search">
            <label className="visually-hidden" htmlFor="site-search">
              Search items
            </label>
            <input
              className="form-control me-2"
              id="site-search"
              name="q"
              type="search"
              placeholder="Search items"
            />
            <button className="btn btn-outline-light" type="submit">
              <i className="bi bi-search" aria-hidden="true" />
              <span className="visually-hidden">Search</span>
            </button>
          </form>

          <a className="nav-link text-light ms-lg-3" href="/account">
            <i className="bi bi-person me-1" aria-hidden="true" />
            Account
          </a>
        </div>
      </div>
    </header>
  );
}

export default Navbar;