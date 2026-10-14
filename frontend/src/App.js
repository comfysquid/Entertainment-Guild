// AI use: this file was simplified with help from Claude (Anthropic).
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CataloguePage from './pages/CataloguePage';
import ProductDetailsPage from './pages/ProductDetailsPage';

// Sets up which page is shown for each URL.
function App() {
  return (
    // The "future" settings just turn on React Router v7 behaviour early and hide its warnings.
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<CataloguePage />} />
        {/* :itemId is the Stocktake ID, e.g. /products/31 */}
        <Route path="/products/:itemId" element={<ProductDetailsPage />} />
        {/* Any other URL shows this message */}
        <Route path="*" element={<main className="container py-5"><h1>Page not found</h1></main>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
