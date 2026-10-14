import React, { useEffect, useState } from 'react';
import '../AppTheme.css';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { fetchFeaturedCatalogueItems } from '../data/catalogue';

function HomePage() {
  const [featuredItems, setFeaturedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load the three featured items from the API when the page first opens.
  useEffect(() => {
    async function loadFeaturedItems() {
      try {
        const items = await fetchFeaturedCatalogueItems();
        setFeaturedItems(items);
      } catch (err) {
        setError('We could not load the catalogue. Check that the API is running and try again.');
      }
      setIsLoading(false);
    }

    loadFeaturedItems();
  }, []);

  // if/else chain to show either loading, error, no results, or the featured items grid
  let featuredContent;
  if (isLoading) { // Show loading message while waiting for the API to respond
    featuredContent = <p className="text-muted" role="status">Loading catalogue…</p>;
  } else if (error) {
    featuredContent = (
      <div className="alert alert-danger" role="alert">
        <p className="mb-2">{error}</p>
        {/* Reloading the page runs the API request again. */}
        <button className="btn btn-outline-danger btn-sm" onClick={() => window.location.reload()} type="button">
          Try again
        </button>
      </div>
    );
  } else if (featuredItems.length > 0) { // Show the three featured items in a grid
    featuredContent = (
      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
        {featuredItems.map((item) => (
          <div className="col" key={item.id}>
            <ProductCard item={item} />
          </div>
        ))}
      </div>
    );
  } else { // No featured items available
    featuredContent = <div className="alert alert-info" role="status">There are no featured items available.</div>;
  }

  return (
    <div className="app">
      <Navbar />

      <main>
        {/* Banner */}
        <section className="page-banner py-5">
          <div className="container py-lg-4">
            <div className="col-lg-8">
              <p className="eyebrow text-uppercase small fw-semibold mb-2">Your entertainment shelf</p>
              <h1 className="display-5 fw-bold">Find your next favourite story.</h1>
              <p className="lead text-body-secondary mb-4">
                Browse books, movies, and games selected for curious minds and cosy weekends.
              </p>
              <a className="btn btn-guild btn-lg" href="#featured-items">
                See featured picks
              </a>
            </div>
          </div>
        </section>

        {/* Featured items section */}
        <section className="container py-5" id="featured-items" aria-labelledby="featured-heading">
          <div className="mb-4">
            <p className="eyebrow text-uppercase small fw-semibold mb-1">Hand-picked</p>
            <h2 className="mb-0" id="featured-heading">A pick from every shelf</h2>
            <p className="text-muted mt-2 mb-0">One featured book, movie, and game from our catalogue.</p>
          </div>

          {featuredContent}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
