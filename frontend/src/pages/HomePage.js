import React, { useState } from 'react';
import '../AppTheme.css';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import catalogueItems from '../data/catalogue';

function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['All', 'Books', 'Movies', 'Games'];
  const visibleItems = selectedCategory === 'All'
    ? catalogueItems
    : catalogueItems.filter((item) => item.category === selectedCategory);

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
                <a className="btn btn-primary btn-lg" href="#catalogue">
                  Browse the catalogue
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

        <section className="container py-5" id="catalogue" aria-labelledby="catalogue-heading">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
            <div>
              <p className="text-uppercase small fw-semibold text-primary mb-1">Explore</p>
              <h2 className="mb-0" id="catalogue-heading">Featured catalogue</h2>
            </div>
            <div className="btn-group" role="group" aria-label="Filter catalogue by category">
              {categories.map((category) => (
                <button
                  className={`btn ${selectedCategory === category ? 'btn-dark' : 'btn-outline-dark'}`}
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  type="button"
                  aria-pressed={selectedCategory === category}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {visibleItems.length > 0 ? (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
              {visibleItems.map((item) => (
                <div className="col" key={item.id}>
                  <ProductCard item={item} />
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-info" role="status">No catalogue items are available in this category.</div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
