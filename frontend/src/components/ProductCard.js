import React from 'react';
import { Link } from 'react-router-dom';

function ProductCard({ item }) {
  // Use color as a quick visual cue, while still keeping the stock text visible.
  const availabilityClass = item.availability === 'In stock'
    ? 'text-success'
    : item.availability === 'Out of stock' ? 'text-danger' : 'text-warning';

  return (
    <article className="card h-100 shadow-sm">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
          <span className="badge text-bg-light">{item.category}</span>
          <span className={`small fw-semibold ${availabilityClass}`}>{item.availability}</span>
        </div>
        <h3 className="h5 card-title">{item.title}</h3>
        <p className="card-text text-muted mb-1">{item.creator}</p>
        <p className="small text-muted mb-4">{item.format}</p>
        {/* price and details link to the bottom so cards line up in the grid. */}
        <div className="mt-auto d-flex justify-content-between align-items-center">
          <span className="fs-5 fw-semibold">${item.price.toFixed(2)}</span>
          <Link className="btn btn-outline-primary btn-sm" to={`/products/${item.id}`}>
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;