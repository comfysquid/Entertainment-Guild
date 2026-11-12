import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import '../AppTheme.css';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { resetPassword } from '../data/account';

// the page the recovery link goes to: /reset-password?token=...
function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || ''; // the token from the link

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await resetPassword(token, password);
      // send them to log in with a message
      navigate('/login', { state: { message: 'Your password has been reset. Log in with your new password.' } });
    } catch (err) {
      setError('This link has expired or was already used. Please ask for a new one.');
    }
  }

  return (
    <div className="app">
      <Navbar />
      <main className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-5">
            <div className="panel p-4">
              <h1 className="h2 fw-bold mb-3">Choose a new password</h1>

              {token === '' ? (
                <div className="alert alert-warning">
                  This link is missing its code. <Link to="/forgot-password">Ask for a new link</Link>.
                </div>
              ) : (
                <form noValidate onSubmit={handleSubmit}>
                  {error && <div className="alert alert-danger">{error}</div>}

                  <label className="form-label fw-semibold" htmlFor="new-password">New password</label>
                  <input
                    className="form-control mb-3"
                    id="new-password"
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    value={password}
                  />

                  <label className="form-label fw-semibold" htmlFor="confirm-new-password">Confirm new password</label>
                  <input
                    className="form-control mb-3"
                    id="confirm-new-password"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    type="password"
                    value={confirmPassword}
                  />

                  <button className="btn btn-guild w-100" type="submit">Reset password</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ResetPasswordPage;
