// AI use: this file was simplified with help from Claude (Anthropic).
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../AppTheme.css';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { fetchCatalogueItems } from '../data/catalogue';

// How many cards to show on each page (4 rows of 3 cards).
const ITEMS_PER_PAGE = 12;
const CATEGORIES = ['All', 'Books', 'Movies', 'Games'];

function CataloguePage() {
  // Lets us read and change the ?q=... part of the URL.
  const [searchParams, setSearchParams] = useSearchParams();

  const [allItems, setAllItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load the whole catalogue once when the page opens.
  // After that, searching and filtering happens on this list (no more API calls).
  useEffect(() => {
    async function loadCatalogue() {
      try {
        const items = await fetchCatalogueItems();
        setAllItems(items);
      } catch (err) {
        setError('We could not load the catalogue. Check that the API is running and try again.');
      }
      setIsLoading(false);
    }

    loadCatalogue();
  }, []);

  // If the URL has ?q=something (e.g. from the navbar search), put it in the search box.
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
    setCurrentPage(1);
  }, [searchParams]);

  // Make the list of formats for the dropdown from the items we loaded.
  const formats = [];
  for (const item of allItems) {
    if (!formats.includes(item.format)) {
      formats.push(item.format);
    }
  }
  formats.sort();
  formats.unshift('All'); // put 'All' at the start of the list

  // Keep only the items that match the search box and both dropdowns.
  const search = searchTerm.trim().toLowerCase();
  const filteredItems = allItems.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) {
      return false;
    }
    if (selectedFormat !== 'All' && item.format !== selectedFormat) {
      return false;
    }
    // The search text can be found in the title, creator, category or format.
    const text = (item.title + ' ' + item.creator + ' ' + item.category + ' ' + item.format).toLowerCase();
    return text.includes(search);
  });

  // Pagination: work out how many pages there are and which items are on this page.
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const itemsOnThisPage = filteredItems.slice(start, end);

  // Whenever a filter changes, go back to page 1.
  function handleCategoryChange(event) {
    setSelectedCategory(event.target.value);
    setCurrentPage(1);
  }

  function handleFormatChange(event) {
    setSelectedFormat(event.target.value);
    setCurrentPage(1);
  }

  function handleSearchChange(event) {
    const text = event.target.value;
    setSearchTerm(text);
    setCurrentPage(1);

    // Also update the URL so the search can be bookmarked.
    // { replace: true } stops every key press being added to the browser history.
    if (text.trim() === '') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ q: text.trim() }, { replace: true });
    }
  }

  function clearFilters() {
    setSearchTerm('');
    setSearchParams({});
    setSelectedCategory('All');
    setSelectedFormat('All');
    setCurrentPage(1);
  }

  // Decide what to show under the filters: loading, error, "no results", or the item grid.
  let results;
  if (isLoading) {
    results = <p className="text-muted py-4" role="status">Loading catalogue…</p>;
  } else if (error) {
    results = (
      <div className="alert alert-danger" role="alert">
        <p className="mb-2">{error}</p>
        <button className="btn btn-outline-danger btn-sm" onClick={() => window.location.reload()} type="button">
          Try again
        </button>
      </div>
    );
  } else if (filteredItems.length === 0) {
    results = (
      <div className="catalogue-empty text-center py-5 px-3" role="status">
        <i className="bi bi-search display-5 text-muted" aria-hidden="true" />
        <h2 className="h4 mt-3">No matching items</h2>
        <p className="text-muted mb-3">Try another search or clear your filters.</p>
        <button className="btn btn-outline-primary" onClick={clearFilters} type="button">Clear filters</button>
      </div>
    );
  } else {
    results = (
      <>
        {/* Number of results and the current page */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <p className="catalogue-result-count mb-0" aria-live="polite">
            <strong>{filteredItems.length}</strong> {filteredItems.length === 1 ? 'item' : 'items'} found
          </p>
          {totalPages > 1 && <small className="text-muted">Page {currentPage} of {totalPages}</small>}
        </div>

        {/* Grid of item cards */}
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
          {itemsOnThisPage.map((item) => (
            <div className="col" key={item.id}>
              <ProductCard item={item} />
            </div>
          ))}
        </div>

        {/* Previous / Next buttons (only needed if there is more than one page) */}
        {totalPages > 1 && (
          <nav aria-label="Catalogue pages" className="mt-4">
            <ul className="pagination justify-content-center">
              <li className={currentPage === 1 ? 'page-item disabled' : 'page-item'}>
                <button
                  className="page-link"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  type="button"
                >
                  Previous
                </button>
              </li>
              <li className="page-item disabled" aria-current="page">
                <span className="page-link">Page {currentPage} of {totalPages}</span>
              </li>
              <li className={currentPage === totalPages ? 'page-item disabled' : 'page-item'}>
                <button
                  className="page-link"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  type="button"
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        )}
      </>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <main className="catalogue-page" aria-labelledby="catalogue-heading">
        {/* Page heading */}
        <section className="catalogue-page-header">
          <div className="container py-5">
            <p className="text-uppercase small fw-semibold text-primary mb-2">The Entertainment Guild collection</p>
            <h1 className="display-6 fw-bold mb-2" id="catalogue-heading">Find your next favourite.</h1>
            <p className="lead text-secondary mb-0">Explore books, movies, and games in one place.</p>
          </div>
        </section>

        <div className="container py-4 py-lg-5">
          {/* Search box, category and format dropdowns, and clear button */}
          <section className="catalogue-filters p-3 p-md-4 mb-4" aria-label="Search and filter catalogue">
            <div className="row g-3 align-items-end">
              <div className="col-lg-6">
                <label className="form-label fw-semibold" htmlFor="catalogue-search">Search the catalogue</label>
                <div className="input-group">
                  <span className="input-group-text bg-white" aria-hidden="true">
                    <i className="bi bi-search" />
                  </span>
                  <input
                    className="form-control"
                    id="catalogue-search"
                    onChange={handleSearchChange}
                    placeholder="Title, creator, category, or format"
                    type="search"
                    value={searchTerm}
                  />
                </div>
              </div>
              <div className="col-sm-6 col-lg-2">
                <label className="form-label fw-semibold" htmlFor="category-filter">Category</label>
                <select className="form-select" id="category-filter" onChange={handleCategoryChange} value={selectedCategory}>
                  {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                </select>
              </div>
              <div className="col-sm-6 col-lg-2">
                <label className="form-label fw-semibold" htmlFor="format-filter">Format</label>
                <select className="form-select" id="format-filter" onChange={handleFormatChange} value={selectedFormat}>
                  {formats.map((format) => <option key={format}>{format}</option>)}
                </select>
              </div>
              <div className="col-lg-2 d-grid">
                <button className="btn btn-outline-secondary" onClick={clearFilters} type="button">
                  <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true" />
                  Clear filters
                </button>
              </div>
            </div>
          </section>

          {results}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default CataloguePage;
