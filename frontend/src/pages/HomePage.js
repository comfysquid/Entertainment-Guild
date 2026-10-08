import React, { useEffect, useState } from 'react';
import '../AppTheme.css';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { fetchFeaturedCatalogueItems } from '../data/catalogue';

function HomePage() {
  // These values drive the small featured section and its loading/error messages.
  const [featuredItems, setFeaturedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // This flag stops a slow request updating state after the page has gone away.
    let isCurrent = true;

    async function loadCatalogue() {
      setIsLoading(true);
      setError('');
      try {
        // Fetch only the featured items, not the entire catalogue.
        const items = await fetchFeaturedCatalogueItems();
        if (isCurrent) setFeaturedItems(items);
      } catch (requestError) {
        if (isCurrent) {
          setError('We could not load the catalogue. Check that the API is running and try again.');
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadCatalogue();
    return () => {
      isCurrent = false;
    };
    // Bumping retryCount reruns this effect when the user presses "Try again".
  }, [retryCount]);

  return (
    <div className="app">
      <Navbar />

      <main>
        <section className="catalogue-hero py-5">
          <div className="container py-lg-4">
            <div className="row align-items-center g-4">
              <div className="col-lg-7">
                <p className="text-uppercase small fw-semibold text-primary mb-2">Your entertainment shelf</p>
                <h1 className="display-5 fw-bold">Find your next favourite story.</h1>
                <p className="lead text-secondary mb-4">
                  Browse books, movies, and games selected for curious minds and cosy weekends.
                </p>
                <a className="btn btn-primary btn-lg" href="#featured-items">
                  See featured picks
                </a>
              </div>
              <div className="col-lg-5">
                <div className="hero-highlight p-4 rounded-3">
                  <span className="badge text-bg-dark mb-3">Featured collection</span>
                  <h2 className="h3">Something for every kind of escape.</h2>
                  <p className="mb-0 text-secondary">Discover new worlds across three shelves of entertainment.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-5" id="featured-items" aria-labelledby="featured-heading">
          <div className="mb-4">
            <p className="text-uppercase small fw-semibold text-primary mb-1">Hand-picked</p>
            <h2 className="mb-0" id="featured-heading">A pick from every shelf</h2>
            <p className="text-muted mt-2 mb-0">One featured book, movie, and game from our catalogue.</p>
          </div>

          {/* Show one clear state at a time: loading, error, results, or empty. */}
          {isLoading ? (
            <p className="text-muted" role="status">Loading catalogue…</p>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              <p className="mb-2">{error}</p>
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={() => setRetryCount((count) => count + 1)}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : featuredItems.length > 0 ? (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
              {featuredItems.map((item) => (
                <div className="col" key={item.id}>
                  <ProductCard item={item} />
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-info" role="status">There are no featured items available.</div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
