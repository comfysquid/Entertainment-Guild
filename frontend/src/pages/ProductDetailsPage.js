import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import '../AppTheme.css';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { fetchCatalogueItemDetails } from '../data/catalogue';

function ProductDetailsPage() {
  // Gets itemId from URL: e.g., /products/31 gives itemId = '31'
  const { itemId } = useParams();

  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load item details from API when page opens or URL changes
  useEffect(() => {
    async function loadItem() {
      setIsLoading(true);
      setError('');
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
              <p className="small text-muted mb-0">Purchasing and cart features will be added separately.</p>
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
        <p className="mb-4"><Link to="/search">&larr; Back to catalogue</Link></p>
        {pageContent}
      </main>
      <Footer />
    </div>
  );
}

export default ProductDetailsPage;
