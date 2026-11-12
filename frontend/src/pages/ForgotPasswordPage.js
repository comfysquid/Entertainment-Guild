import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../AppTheme.css';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { requestPasswordReset } from '../data/account';

// account recovery (business scenario 4)
// customer enters their email -> "send" a recovery email with a reset link
function ForgotPasswordPage() {
  const location = useLocation();

  // if they came from "change password" on the account page their email is passed in
  let startEmail = '';
  if (location.state && location.state.email) {
    startEmail = location.state.email;
  }

  const [email, setEmail] = useState(startEmail);
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [resetLink, setResetLink] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter the email address you registered with.');
      return;
    }

    try {
      const result = await requestPasswordReset(email);
      // there's no email server so the api gives us the token
      // we show the link on the page (no email)
      if (result.token) {
        setResetLink('/reset-password?token=' + result.token);
      }
      setIsSent(true);
    } catch (err) {
      setError('Could not reach the server. Check the API is running.');
    }
  }

  return (
    <div className="app">
      <Navbar />
      <main className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-5">
            <div className="panel p-4">
              <h1 className="h2 fw-bold mb-3">Reset your password</h1>

              {isSent ? (
                <>
                  {/* same message whether or not the email exists, so people can't check who has an account */}
                  <div className="alert alert-success">
                    If an account uses {email.trim()}, a recovery email has been sent. The link works for 15 minutes.
                  </div>
                  {resetLink && (
                    <div className="border p-3 bg-white small">
                      <p className="fw-semibold mb-1">Prototype inbox (no real email is sent)</p>
                      <Link to={resetLink}>Choose a new password</Link>
                    </div>
                  )}
                </>
              ) : (
                <form noValidate onSubmit={handleSubmit}>
                  {error && <div className="alert alert-danger">{error}</div>}
                  <label className="form-label fw-semibold" htmlFor="recovery-email">Recovery email</label>
                  <input
                    className="form-control mb-3"
                    id="recovery-email"
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    value={email}
                  />
                  <button className="btn btn-guild w-100" type="submit">Send recovery email</button>
                </form>
              )}

              <p className="mt-3 mb-0 small"><Link to="/login">Back to log in</Link></p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ForgotPasswordPage;
