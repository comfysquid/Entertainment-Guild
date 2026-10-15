// AI-assisted (Claude Code): simplified/refactored, then reviewed and re-commented by me.
// Prompt: "Review my largest React pages and simplify the code where possible without changing too much
//   functionality or the appearance/styling of the app. Keep the changes focused and explain what you changed,
//   where, and why."

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
  // AI-assisted (Claude Code): search/filters/page kept in the URL for Business Scenario 1.
  // The search, filters and page number are all kept in the URL, e.g. /search?q=star&category=Games&page=2
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || 'All';
  const selectedFormat = searchParams.get('format') || 'All';
  const currentPage = Number(searchParams.get('page')) || 1;

  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load the whole catalogue once when the page opens then search/filter happens on this list (so no more API calls)
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

  // Make the list of formats for the dropdown from the items we loaded.
  const formats = [];
  for (const item of allItems) {
    if (!formats.includes(item.format)) {
      formats.push(item.format);
    }
  }
  formats.sort();
  formats.unshift('All'); // put 'All' at the start of the list

  // Filtering + pagination concept explained with ChatGPT (explanation only, not code).
  // Prompt: "Explain React filtering and pagination in one short paragraph, focusing on combining multiple filters,
  //   updating results when filters change, and resetting pagination to page 1. Focus mostly on the coding aspect
  //   and how it works in development (as a dev). Use a simple analogy."
  // Handles case-insensitive search & filtering by category & format
  const search = searchTerm.trim().toLowerCase();
  const filteredItems = allItems.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) {
      return false;
    }
    if (selectedFormat !== 'All' && item.format !== selectedFormat) {
      return false;
    }
    // Search title, creator, category, and format for search term (case-insensitive)
    const text = (item.title + ' ' + item.creator + ' ' + item.category + ' ' + item.format).toLowerCase();
    return text.includes(search);
  });

  // Handles pagination: how many pages, what items to show, Next/Previous buttons
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const itemsOnThisPage = filteredItems.slice(start, end);

  // Updates the URL with the changed values. Default values (All, page 1, empty search) are left out.
  // IMPORTANT: { replace: true } stops browser history filling up with every keystroke
  function updateUrl(changes) {
    const values = { q: searchTerm, category: selectedCategory, format: selectedFormat, page: 1, ...changes };
    const params = {};
    if (values.q.trim() !== '') params.q = values.q;
    if (values.category !== 'All') params.category = values.category;
    if (values.format !== 'All') params.format = values.format;
    if (values.page > 1) params.page = values.page;
    setSearchParams(params, { replace: true });
  }

  // Changing the search or a filter goes back to page 1 (updateUrl defaults page to 1).
  function handleCategoryChange(event) {
    updateUrl({ category: event.target.value });
  }

  function handleFormatChange(event) {
    updateUrl({ format: event.target.value });
  }

  function handleSearchChange(event) {
    updateUrl({ q: event.target.value });
  }

  function goToPage(page) {
    updateUrl({ page: page });
    window.scrollTo(0, 0);
  }

  function clearFilters() {
    setSearchParams({});
  }

  // if/else chain to show either loading, error, no results, or the catalogue grid 
  let results;
  if (isLoading) { // Show a loading message while the catalogue is being fetched
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
  } else if (filteredItems.length === 0) { // No results found
    results = (
      <div className="panel text-center py-5 px-3" role="status">
        <i className="bi bi-search display-5 text-muted" aria-hidden="true" />
        <h2 className="h4 mt-3">No matching items</h2>
        <p className="text-muted mb-3">Try another search or clear your filters.</p>
        <button className="btn btn-outline-guild" onClick={clearFilters} type="button">Clear filters</button>
      </div>
    );
  } else { // Catalogue grid with pagination
    results = (
      <>
        {/* Number of results and the current page */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <p className="text-body-secondary mb-0" aria-live="polite">
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
                  onClick={() => goToPage(currentPage - 1)}
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
                  onClick={() => goToPage(currentPage + 1)}
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
      <main aria-labelledby="catalogue-heading">
        {/* Page heading */}
        <section className="page-banner">
          <div className="container py-5">
            <p className="eyebrow text-uppercase small fw-semibold mb-2">The Entertainment Guild collection</p>
            <h1 className="display-6 fw-bold mb-2" id="catalogue-heading">Find your next favourite.</h1>
            <p className="lead text-body-secondary mb-0">Explore books, movies, and games in one place.</p>
          </div>
        </section>

        <div className="container py-4 py-lg-5">
          {/* Search box, category and format dropdowns, and clear button */}
          <section className="panel p-3 p-md-4 mb-4" aria-label="Search and filter catalogue">
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
