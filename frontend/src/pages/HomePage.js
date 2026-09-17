import React from 'react';
import '../AppTheme.css';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

function HomePage() {
  return (
    <div className="app">
      <Navbar />

      <main className="container py-5">
        <div className="text-center">
          <h1>Welcome to Entertainment Guild</h1>
          <p className="lead">Books, movies, and games in one place.</p>
          <button className="btn btn-primary" type="button">Browse items</button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
