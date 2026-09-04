import React from 'react';
import '../AppTheme.css';

function HomePage() {
  return (
    <div className="app">
      <header className="navbar navbar-dark bg-dark">
        <div className="container">
          <a className="navbar-brand" href="/">Entertainment Guild</a>
          <span className="navbar-text">Online Store</span>
        </div>
      </header>

      <main className="container py-5">
        <div className="text-center">
          <h1>Welcome to Entertainment Guild</h1>
          <p className="lead">Books, movies, and games in one place.</p>
          <button className="btn btn-primary" type="button">Browse items</button>
        </div>
      </main>

      <footer className="container py-4 border-top text-muted">
        <small>Entertainment Guild frontend prototype</small>
      </footer>
    </div>
  );
}

export default HomePage;
