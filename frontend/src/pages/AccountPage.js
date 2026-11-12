import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../AppTheme.css';
import AddressFields from '../components/AddressFields';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { fetchMyDetails, rowToAddress, saveMyAddress, validateAddress } from '../data/account';
import { getCurrentUser } from '../data/auth';
import { fetchMyOrders } from '../data/orders';

// my account page: customer details, address and order history (business scenario 4)
function AccountPage() {
  const user = getCurrentUser();

  const [details, setDetails] = useState(null); // { patron, contact } from the api
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // for the update address form
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(rowToAddress(null));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  // only customers have this page
  let isCustomer = false;
  if (user !== null && user.role === 'PATRON') {
    isCustomer = true;
  }

  // load the details and orders once when the page opens
  useEffect(() => {
    async function load() {
      try {
        const loaded = await fetchMyDetails(user.id);
        setDetails(loaded);
        setForm(rowToAddress(loaded.contact));

        const myOrders = await fetchMyOrders();
        setOrders(myOrders);
      } catch (error) {
        setLoadError('Could not load your account. Check the API is running and log in again.');
      }
      setIsLoading(false);
    }

    if (isCustomer) {
      load();
    }
  }, []);

  // uses input's id to know which field changed
  function handleChange(event) {
    setForm({ ...form, [event.target.id]: event.target.value });
  }

  // update address: check it -> save it -> load it again so the new address shows
  async function handleSave(event) {
    event.preventDefault(); // stop the page reloading

    const newErrors = validateAddress(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return; // there are errors so don't save
    }

    try {
      await saveMyAddress(details.contact, form);
      const reloaded = await fetchMyDetails(user.id);
      setDetails(reloaded);
      setIsEditing(false);
      setMessage('Your address has been updated.');
    } catch (error) {
      setMessage('Could not save your address. Please try again.');
    }
  }

  // work out what to show on the page
  let pageContent;

  if (user === null) {
    pageContent = (
      <div className="alert alert-info">
        Please <Link to="/login">log in</Link> to see your account.
      </div>
    );
  } else if (!isCustomer) {
    pageContent = <div className="alert alert-info">Staff and admin accounts don't have an account page.</div>;
  } else if (isLoading) {
    pageContent = <p>Loading your account...</p>;
  } else if (loadError) {
    pageContent = <div className="alert alert-danger">{loadError}</div>;
  } else {
    const address = rowToAddress(details.contact);

    pageContent = (
      <div className="row g-4">
        {/* left side: details and address */}
        <div className="col-lg-5">
          <div className="panel p-4 mb-4">
            <h2 className="h4">Your details</h2>
            <p className="mb-1"><strong>Name:</strong> {details.patron.Name}</p>
            <p className="mb-1"><strong>Email:</strong> {details.patron.Email}</p>
            <p className="small text-muted">To change your name or email please contact the store.</p>
            {/* change password uses the same recovery page, with their email already filled in */}
            <Link className="btn btn-sm btn-outline-guild" state={{ email: details.patron.Email }} to="/forgot-password">
              Change password
            </Link>
          </div>

          <div className="panel p-4">
            <h2 className="h4">Contact and delivery address</h2>
            {message && <div className="alert alert-info py-2">{message}</div>}

            {isEditing ? (
              <form noValidate onSubmit={handleSave}>
                <AddressFields errors={errors} form={form} onChange={handleChange} />
                <button className="btn btn-guild mt-3 me-2" type="submit">Update</button>
                <button className="btn btn-outline-guild mt-3" onClick={() => setIsEditing(false)} type="button">Cancel</button>
              </form>
            ) : (
              <>
                {address.street === '' ? (
                  <p className="text-muted">No address saved yet.</p>
                ) : (
                  <p>
                    {address.street}<br />
                    {address.suburb} {address.state} {address.postcode}<br />
                    {address.phone && 'Phone: ' + address.phone}
                  </p>
                )}
                {details.contact && (
                  <button className="btn btn-sm btn-outline-guild" onClick={() => { setIsEditing(true); setMessage(''); }} type="button">
                    Update address
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* right side: order history*/}
        <div className="col-lg-7">
          <h2 className="h4">Order history</h2>
          {orders.length === 0 && <p>You haven't placed any orders yet.</p>}

          {orders.map((order) => (
            <div className="panel p-3 mb-3" key={order.id}>
              <h3 className="h5">Order #{order.id}</h3>
              <ul>
                {order.lines.map((line) => (
                  <li key={line.id}>
                    {line.quantity} x <Link to={'/products/' + line.id}>{line.title}</Link> (${line.price.toFixed(2)} each)
                  </li>
                ))}
              </ul>
              <p className="mb-1"><strong>Total:</strong> ${order.total.toFixed(2)}</p>
              <p className="mb-0">
                <strong>Delivered to:</strong> {order.street}, {order.suburb} {order.state} {order.postcode}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <main className="container py-5">
        <h1 className="display-6 fw-bold mb-4">My account</h1>
        {pageContent}
      </main>
      <Footer />
    </div>
  );
}

export default AccountPage;
