import React from 'react';
import { Link } from 'react-router-dom';

function ProductCard({ item }) {
  // Green text if the item is in stock, red text if it isn't.
  let stockText = 'Out of stock';
  let stockColour = 'text-danger';
  if (item.quantity > 0) {
    stockText = 'In stock';
    stockColour = 'text-success';
  }

  return (
    <article className="card h-100 shadow-sm">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
          <span className="badge text-bg-light">{item.category}</span>
          <span className={'small fw-semibold ' + stockColour}>{stockText}</span>
        </div>
        <h3 className="h5 card-title">{item.title}</h3>
        <p className="card-text text-muted mb-1">{item.creator}</p>
        <p className="small text-muted mb-4">{item.format}</p>
        {/* mt-auto pushes the price to the bottom so all the cards line up. */}
        <div className="mt-auto d-flex justify-content-between align-items-center">
          <span className="fs-5 fw-semibold">${item.price.toFixed(2)}</span>
          <Link className="btn btn-outline-primary btn-sm" to={'/products/' + item.id}>
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
