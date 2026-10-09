import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import '../AppTheme.css';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { fetchCatalogueItemDetails } from '../data/catalogue';

function ProductDetailsPage() {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadDetails() {
      setIsLoading(true);
      setError('');
      try {
        const details = await fetchCatalogueItemDetails(itemId);
        if (isCurrent) setItem(details);
      } catch (requestError) {
        if (isCurrent) setError('We could not load this item. It may no longer be available.');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadDetails();
    return () => {
      isCurrent = false;
    };
  }, [itemId, retryCount]);

  return (
    <div className="app">
      <Navbar />
      <main className="container py-5" aria-labelledby="product-heading">
        <p className="mb-4"><Link to="/search">&larr; Back to catalogue</Link></p>

        {isLoading ? (
          <p className="text-muted" role="status">Loading item details…</p>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            <p className="mb-2">{error}</p>
            <button className="btn btn-outline-danger btn-sm" onClick={() => setRetryCount((count) => count + 1)} type="button">
              Try again
            </button>
          </div>
        ) : item ? (
          <article className="product-details-card p-4 p-lg-5">
            <div className="row g-4 g-lg-5">
              <div className="col-lg-8">
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <span className="badge text-bg-primary">{item.category}</span>
                  <span className="badge text-bg-light">{item.subgenre}</span>
                </div>
                <h1 className="display-6 fw-bold" id="product-heading">{item.title}</h1>
                <p className="lead text-muted">{item.creator}</p>
                <h2 className="h5 mt-4">About this item</h2>
                <p className="product-description">{item.description}</p>
                {item.published && (
                  <p className="text-muted mb-0">
                    Published: {new Date(item.published).getUTCFullYear()}
                  </p>
                )}
              </div>

              <aside className="col-lg-4" aria-label="Item availability and price">
                <div className="product-purchase-panel p-4">
                  <p className="text-muted mb-1">Format</p>
                  <p className="fw-semibold">{item.format}</p>
                  <p className="display-6 fw-semibold mb-2">${item.price.toFixed(2)}</p>
                  <p className={item.quantity > 0 ? 'text-success' : 'text-danger'}>
                    {item.quantity > 0 ? `${item.quantity} available` : 'Out of stock'}
                  </p>
                  <p className="small text-muted mb-0">Purchasing and cart features will be added separately.</p>
                </div>
              </aside>
            </div>
          </article>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}

export default ProductDetailsPage;