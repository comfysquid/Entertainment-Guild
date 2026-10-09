import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CataloguePage from './pages/CataloguePage';
import ProductDetailsPage from './pages/ProductDetailsPage';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<CataloguePage />} />
        <Route path="/products/:itemId" element={<ProductDetailsPage />} />
        <Route path="*" element={<main className="container py-5"><h1>Page not found</h1></main>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
