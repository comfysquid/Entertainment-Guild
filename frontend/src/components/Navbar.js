import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, isStaffUser, logOut } from '../data/auth';
import { getCartCount } from '../data/cart';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchText, setSearchText] = useState('');
  const [cartCount, setCartCount] = useState(getCartCount());
  const [user, setUser] = useState(getCurrentUser());

  // cart.js and auth.js both dispatch events when cart/user changes
  useEffect(() => {
    function updateCart() {
      setCartCount(getCartCount());
    }
    function updateUser() {
      setUser(getCurrentUser());
    }

    window.addEventListener('cart-updated', updateCart);
    window.addEventListener('auth-changed', updateUser);
    // Remove the listeners when the navbar is removed from the page
    return () => {
      window.removeEventListener('cart-updated', updateCart);
      window.removeEventListener('auth-changed', updateUser);
    };
  }, []);

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

  async function handleLogOut() {
    await logOut();
    navigate('/', { state: { message: 'You have been logged out.' } });
  }

  // Show messages from other pages ("You have been logged out." etc.)
  let message = '';
  if (location.state && location.state.message) {
    message = location.state.message;
  }

  // Conditional rendering to only show cart link for non-staff
  const showCart = !isStaffUser(user);

  let roleBadge = '';
  if (user && user.role === 'ADMIN') {
    roleBadge = 'Admin mode';
  } else if (user && user.role === 'STAFF') {
    roleBadge = 'Staff';
  }

  return (
    <>
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
              {showCart && (
                <Link className="nav-link" to="/cart">
                  Cart
                  {/* Badge only shows once something is in the cart */}
                  {cartCount > 0 && (
                    <span className="badge rounded-pill cart-badge ms-1" title={cartCount + ' items in cart'}>
                      {cartCount}
                      <span className="visually-hidden"> items in cart</span>
                    </span>
                  )}
                </Link>
              )}
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
              <button className="btn btn-outline-light" title="Search" type="submit">
                <i className="bi bi-search" aria-hidden="true" />
                <span className="visually-hidden">Search</span>
              </button>
            </form>

            {/* Shows the user's name and a log out button, or a log in link */}
            {user ? (
              <div className="d-flex align-items-center ms-lg-3 mt-2 mt-lg-0">
                {roleBadge && <span className="badge role-badge me-2">{roleBadge}</span>}
                <span className="text-light me-2">
                  <i className="bi bi-person me-1" aria-hidden="true" />
                  {user.name}
                </span>
                <button className="btn btn-sm btn-outline-light" onClick={handleLogOut} title="Log out of your account" type="button">
                  Log out
                </button>
              </div>
            ) : (
              <Link className="nav-link text-light ms-lg-3" to="/login">
                <i className="bi bi-person me-1" aria-hidden="true" />
                Log in
              </Link>
            )}
          </div>
        </div>
      </header>
      {message && (
        <div className="container">
          <div className="alert alert-success navbar-message mt-3 mb-0" role="status">
            <i className="bi bi-check-circle me-1" aria-hidden="true" />
            {message}
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
