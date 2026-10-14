import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../AppTheme.css';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { getCurrentUser, isStaffUser } from '../data/auth';
import { getCart, removeFromCart, updateQuantity } from '../data/cart';

function CartPage() {
  const [cart, setCart] = useState(getCart());
  const [message, setMessage] = useState('');
  const user = getCurrentUser();

  function handleQuantityChange(line, text) {
    const quantity = Number(text);

    // Handles quantity input errors: not a number, less than 1, more than stock
    if (!Number.isInteger(quantity) || quantity < 1) {
      setMessage('Quantity must be at least 1. Use Remove to take an item out of your cart.');
      return;
    }
    if (quantity > line.stock) {
      setMessage('Only ' + line.stock + ' of "' + line.title + '" are in stock.');
      return;
    }

    setMessage('');
    updateQuantity(line.id, quantity);
    setCart(getCart());
  }

  function handleRemove(line) {
    removeFromCart(line.id);
    setCart(getCart());
    setMessage('"' + line.title + '" was removed from your cart.');
  }

  // Add up price x quantity for every line
  let subtotal = 0;
  let itemCount = 0;
  for (const line of cart) {
    subtotal += line.price * line.quantity;
    itemCount += line.quantity;
  }

  // Empty cart message, or the list of items and order summary
  let pageContent;
  if (isStaffUser(user)) { // Can't buy items with staff/admin account
    pageContent = (
      <div className="alert alert-info" role="status">
        Purchasing is turned off for staff and admin accounts. Log in with a customer account to shop.
      </div>
    );
  } else if (cart.length === 0) { // Empty cart message
    pageContent = (
      <div className="panel text-center py-5 px-3">
        <i className="bi bi-cart display-5 text-muted" aria-hidden="true" />
        <h2 className="h4 mt-3">Your cart is empty</h2>
        <p className="text-muted mb-3">Browse the catalogue to find something you'll love.</p>
        <Link className="btn btn-guild" to="/search">Browse items</Link>
      </div>
    );
  } else { // Show cart + order summary
    pageContent = (
      <div className="row g-4">
        {/* Left side: one row per item */}
        <section className="col-lg-8" aria-label="Items in your cart">
          <div className="panel">
            {cart.map((line) => (
              <div className="cart-line d-flex flex-wrap align-items-center gap-3 p-3" key={line.id}>
                <div className="flex-grow-1">
                  <h2 className="h6 mb-1">
                    <Link to={'/products/' + line.id}>{line.title}</Link>
                  </h2>
                  <p className="small text-muted mb-0">
                    {line.format} &middot; ${line.price.toFixed(2)} each
                  </p>
                </div>
                <div>
                  <label className="visually-hidden" htmlFor={'qty-' + line.id}>
                    Quantity of {line.title}
                  </label>
                  <input
                    className="form-control cart-qty"
                    id={'qty-' + line.id}
                    max={line.stock}
                    min="1"
                    onChange={(event) => handleQuantityChange(line, event.target.value)}
                    type="number"
                    value={line.quantity}
                  />
                </div>
                <p className="fw-semibold mb-0 cart-line-total">${(line.price * line.quantity).toFixed(2)}</p>
                <button
                  className="btn btn-link text-danger p-0"
                  onClick={() => handleRemove(line)}
                  title={'Remove ' + line.title + ' from your cart'}
                  type="button"
                >
                  <i className="bi bi-trash me-1" aria-hidden="true" />
                  Remove<span className="visually-hidden"> {line.title}</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Right side: subtotal and checkout */}
        <aside className="col-lg-4" aria-label="Order summary">
          <div className="price-box p-4">
            <h2 className="h5">Order summary</h2>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Items</span>
              <span>{itemCount}</span>
            </div>
            <div className="d-flex justify-content-between fs-5 fw-semibold mt-2 mb-3">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {/* Must login before checkout */}
            {user ? (
              <>
                <button className="btn btn-guild w-100" disabled type="button">Checkout</button>
                <p className="small text-muted mt-2 mb-0">Checkout and payment are coming in the next sprint.</p>
              </>
            ) : (
              <>
                {/* state.from tells the login page to come back here afterwards */}
                <Link className="btn btn-guild w-100" state={{ from: '/cart' }} to="/login">Log in to check out</Link>
                <p className="small text-muted mt-2 mb-0">
                  New here? <Link to="/register">Create an account</Link>
                </p>
              </>
            )}
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <main className="container py-5" aria-labelledby="cart-heading">
        <h1 className="display-6 fw-bold mb-4" id="cart-heading">Your cart</h1>
        {message && (
          <div className="alert alert-warning" role="alert">{message}</div>
        )}
        {pageContent}
      </main>
      <Footer />
    </div>
  );
}

export default CartPage;
