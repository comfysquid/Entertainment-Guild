import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../AppTheme.css';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { fetchCatalogueItems } from '../data/catalogue';

const PAGE_SIZE = 12;
const CATEGORIES = ['All', 'Books', 'Movies', 'Games'];

function CataloguePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalogueItems, setCatalogueItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Load the catalogue once; search and filters work against the joined records in memory.
  useEffect(() => {
    let isCurrent = true;

    async function loadCatalogue() {
      setIsLoading(true);
      setError('');
      try {
        const items = await fetchCatalogueItems();
        if (isCurrent) setCatalogueItems(items);
      } catch (requestError) {
        if (isCurrent) setError('We could not load the catalogue. Check that the API is running and try again.');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadCatalogue();
    return () => {
      isCurrent = false;
    };
  }, [retryCount]);

  // Keep the search box in sync if a search term comes from the navbar URL.
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
    setCurrentPage(1);
  }, [searchParams]);

  const formats = useMemo(
    () => ['All', ...new Set(catalogueItems.map((item) => item.format).filter(Boolean))].sort((a, b) => {
      if (a === 'All') return -1;
      if (b === 'All') return 1;
      return a.localeCompare(b);
    }),
    [catalogueItems],
  );

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return catalogueItems.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesFormat = selectedFormat === 'All' || item.format === selectedFormat;
      const searchableText = `${item.title} ${item.creator} ${item.category} ${item.format}`.toLowerCase();
      return matchesCategory && matchesFormat && (!query || searchableText.includes(query));
    });
  }, [catalogueItems, searchTerm, selectedCategory, selectedFormat]);

  const pageCount = Math.ceil(filteredItems.length / PAGE_SIZE);
  const visibleItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateCategory(category) {
    setSelectedCategory(category);
    setCurrentPage(1);
  }

  function updateFormat(format) {
    setSelectedFormat(format);
    setCurrentPage(1);
  }

  function updateSearchTerm(value) {
    setSearchTerm(value);
    setCurrentPage(1);
    const query = value.trim();
    setSearchParams(query ? { q: query } : {}, { replace: true });
  }

  function clearFilters() {
    setSearchTerm('');
    setSearchParams({});
    setSelectedCategory('All');
    setSelectedFormat('All');
    setCurrentPage(1);
  }

  return (
    <div className="app">
      <Navbar />
      <main className="catalogue-page" aria-labelledby="catalogue-heading">
        <section className="catalogue-page-header">
          <div className="container py-5">
            <p className="text-uppercase small fw-semibold text-primary mb-2">The Entertainment Guild collection</p>
            <h1 className="display-6 fw-bold mb-2" id="catalogue-heading">Find your next favourite.</h1>
            <p className="lead text-secondary mb-0">Explore books, movies, and games in one place.</p>
          </div>
        </section>

        <div className="container py-4 py-lg-5">
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
                    onChange={(event) => updateSearchTerm(event.target.value)}
                    placeholder="Title, creator, category, or format"
                    type="search"
                    value={searchTerm}
                  />
                </div>
              </div>
              <div className="col-sm-6 col-lg-2">
                <label className="form-label fw-semibold" htmlFor="category-filter">Category</label>
                <select className="form-select" id="category-filter" onChange={(event) => updateCategory(event.target.value)} value={selectedCategory}>
                  {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                </select>
              </div>
              <div className="col-sm-6 col-lg-2">
                <label className="form-label fw-semibold" htmlFor="format-filter">Format</label>
                <select className="form-select" id="format-filter" onChange={(event) => updateFormat(event.target.value)} value={selectedFormat}>
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

          {isLoading ? (
            <p className="text-muted py-4" role="status">Loading catalogue…</p>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              <p className="mb-2">{error}</p>
              <button className="btn btn-outline-danger btn-sm" onClick={() => setRetryCount((count) => count + 1)} type="button">
                Try again
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="catalogue-empty text-center py-5 px-3" role="status">
              <i className="bi bi-search display-5 text-muted" aria-hidden="true" />
              <h2 className="h4 mt-3">No matching items</h2>
              <p className="text-muted mb-3">Try another search or clear your filters.</p>
              <button className="btn btn-outline-primary" onClick={clearFilters} type="button">Clear filters</button>
            </div>
          ) : (
            <>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <p className="catalogue-result-count mb-0" aria-live="polite">
                  <strong>{filteredItems.length}</strong> {filteredItems.length === 1 ? 'item' : 'items'} found
                </p>
                {pageCount > 1 && <small className="text-muted">Page {currentPage} of {pageCount}</small>}
              </div>

              <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
                {visibleItems.map((item) => (
                  <div className="col" key={item.id}>
                    <ProductCard item={item} />
                  </div>
                ))}
              </div>

              {pageCount > 1 && (
                <nav aria-label="Catalogue pages" className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((page) => page - 1)}
                        type="button"
                      >
                        Previous
                      </button>
                    </li>
                    <li className="page-item disabled" aria-current="page">
                      <span className="page-link">Page {currentPage} of {pageCount}</span>
                    </li>
                    <li className={`page-item ${currentPage === pageCount ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        disabled={currentPage === pageCount}
                        onClick={() => setCurrentPage((page) => page + 1)}
                        type="button"
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default CataloguePage;