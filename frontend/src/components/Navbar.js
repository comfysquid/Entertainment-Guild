import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');

  // When the search form is submitted, go to the search page with the text in the URL.
  function handleSearch(event) {
    event.preventDefault(); // stop the browser reloading the page!

    const text = searchText.trim();
    if (text === '') {
      navigate('/search');
    } else {
      navigate('/search?q=' + encodeURIComponent(text));
    }
  }

  return (
    <header className="navbar navbar-expand-lg navbar-dark site-navbar">
      <div className="container">
        <Link className="navbar-brand fw-semibold" to="/">
          <i className="bi bi-book-half me-2" aria-hidden="true" />
          Entertainment Guild
        </Link>

        {/* Bootstrap hamburger button that shows the menu on small screens :) */}
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
          {/* Page links */}
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

          {/* Search box */}
          <form className="d-flex" onSubmit={handleSearch} role="search">
            <label className="visually-hidden" htmlFor="site-search">
              Search items
            </label>
            <input
              className="form-control me-2"
              id="site-search"
              type="search"
              placeholder="Search items"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
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
