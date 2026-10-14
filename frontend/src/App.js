import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CataloguePage from './pages/CataloguePage';
import ProductDetailsPage from './pages/ProductDetailsPage';

function App() {
  return ( // BrowserRouter is router that uses URL to track which page is shown
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<CataloguePage />} />
        {/* itemId == Stocktake ID, e.g. /products/31 */}
        <Route path="/products/:itemId" element={<ProductDetailsPage />} />
        {/* Any other URL shows this message */}
        <Route path="*" element={<main className="container py-5"><h1>Page not found</h1></main>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
