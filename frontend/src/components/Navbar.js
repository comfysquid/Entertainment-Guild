import React from 'react';

function Navbar() {
  return (
    <header className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <a className="navbar-brand fw-semibold" href="/">
          Entertainment Guild
        </a>

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
          <nav className="navbar-nav me-auto" aria-label="Primary navigation">
            <a className="nav-link active" aria-current="page" href="/">
              Home
            </a>
            <a className="nav-link" href="/search">
              Browse items
            </a>
            <a className="nav-link" href="/cart">
              Cart
            </a>
          </nav>

          <form className="d-flex" role="search" action="/search">
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