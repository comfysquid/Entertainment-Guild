import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import '../AppTheme.css';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { fetchCatalogueItemDetails } from '../data/catalogue';
import { addToCart, getCart } from '../data/cart';
import { getCurrentUser, isStaffUser } from '../data/auth';

function ProductDetailsPage() {
  // Gets itemId from URL: e.g., /products/31 gives itemId = '31'
  const { itemId } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState('');

  // Load item details from API when page opens or URL changes
  useEffect(() => {
    async function loadItem() {
      setIsLoading(true);
      setError('');
      setQuantity(1);
      setAddedMessage('');
      try {
        const details = await fetchCatalogueItemDetails(itemId); 
        setItem(details);
      } catch (err) {
        setError('We could not load this item. It may no longer be available.');
      }
      setIsLoading(false);
    }

    loadItem();
  }, [itemId]);

  // AI-assisted (Claude Code): add to cart, Continue shopping and Back to results.
  // Prompt: "Draft the cart page using my existing React components, the supplied wireframes, and documented API routes."
  // Goes back to search results customer came from, retains search/filters
  function backToResults() {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/search');
    }
  }

  // if/else chain to show either loading, error, or the item details
  let pageContent = null;
  if (isLoading) { // show loading message
    pageContent = <p className="text-muted" role="status">Loading item details…</p>;
  } else if (error) { // show error message
    pageContent = (
      <div className="alert alert-danger" role="alert">
        <p className="mb-2">{error}</p>
        <button className="btn btn-outline-danger btn-sm" onClick={() => window.location.reload()} type="button">
          Try again
        </button>
      </div>
    );
  } else if (item) { // show the item details
    let stockText = 'Out of stock';
    let stockColour = 'text-danger';
    if (item.quantity > 0) {
      stockText = item.quantity + ' available';
      stockColour = 'text-success';
    }

    // Checks how many of this item are in cart (prevents adding more than stock)
    const inCart = getCart().find((line) => line.id === item.id);
    let alreadyInCart = 0;
    if (inCart) {
      alreadyInCart = inCart.quantity;
    }
    const canAdd = item.quantity - alreadyInCart;

    // Cart quantity dropdown (only up to 10)
    const quantityOptions = [];
    for (let i = 1; i <= Math.min(canAdd, 10); i++) {
      quantityOptions.push(i);
    }

    function handleAddToCart() {
      addToCart(item, quantity);
      setAddedMessage(quantity + (quantity === 1 ? ' copy' : ' copies') + ' added to your cart.');
      setQuantity(1);
    }

    // Out of stock, already have all of them in the cart, or the add to cart form
    let cartControls;
    if (isStaffUser(getCurrentUser())) {
      // Staff and admin accounts can view items but can't buy them
      cartControls = (
        <p className="small text-muted mb-0">Purchasing is turned off for staff and admin accounts.</p>
      );
    } else if (item.quantity <= 0) {
      cartControls = (
        <button className="btn btn-secondary w-100" disabled type="button">Out of stock</button>
      );
    } else if (canAdd <= 0) {
      cartControls = (
        <p className="small text-muted mb-0">You already have all {item.quantity} in your cart.</p>
      );
    } else {
      cartControls = (
        <div className="d-flex gap-2">
          <label className="visually-hidden" htmlFor="quantity-select">Quantity</label>
          <select
            className="form-select w-auto"
            id="quantity-select"
            onChange={(event) => setQuantity(Number(event.target.value))}
            value={quantity}
          >
            {quantityOptions.map((number) => <option key={number} value={number}>{number}</option>)}
          </select>
          <button className="btn btn-guild flex-grow-1" onClick={handleAddToCart} type="button">
            <i className="bi bi-cart-plus me-1" aria-hidden="true" />
            Add to cart
          </button>
        </div>
      );
    }

    pageContent = (
      <article className="panel p-4 p-lg-5">
        <div className="row g-4 g-lg-5">
          {/* Left side has title, author and description */}
          <div className="col-lg-8">
            <div className="d-flex flex-wrap align-items-baseline gap-2 mb-3">
              <span className={'category-label ' + item.category.toLowerCase()}>{item.category}</span>
              <span className="text-muted small">{item.subgenre}</span>
            </div>
            <h1 className="display-6 fw-bold" id="product-heading">{item.title}</h1>
            <p className="lead text-muted">{item.creator}</p>
            <h2 className="h5 mt-4">About this item</h2>
            <p className="product-description">{item.description}</p>
            {/* Only shows year if product has a published date. */}
            {item.published && (
              <p className="text-muted mb-0">
                Published: {new Date(item.published).getUTCFullYear()}
              </p>
            )}
          </div>

          {/* Right side has format, price and stock */}
          <aside className="col-lg-4" aria-label="Item availability and price">
            <div className="price-box p-4">
              <p className="text-muted mb-1">Format</p>
              <p className="fw-semibold">{item.format}</p>
              <p className="display-6 fw-semibold mb-2">${item.price.toFixed(2)}</p>
              <p className={stockColour}>{stockText}</p>
              {cartControls}
              {addedMessage && (
                <div className="alert alert-success small mt-3 mb-0" role="status">
                  <i className="bi bi-check-circle me-1" aria-hidden="true" />
                  {addedMessage}
                  <div className="d-flex gap-2 mt-2">
                    <button className="btn btn-sm btn-outline-guild" onClick={backToResults} type="button">
                      Continue shopping
                    </button>
                    <Link className="btn btn-sm btn-guild" to="/cart">View cart</Link>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </article>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <main className="container py-5" aria-labelledby="product-heading">
        <p className="mb-4">
          <button className="btn btn-link back-link p-0" onClick={backToResults} type="button">&larr; Back to results</button>
        </p>
        {pageContent}
      </main>
      <Footer />
    </div>
  );
}

export default ProductDetailsPage;
