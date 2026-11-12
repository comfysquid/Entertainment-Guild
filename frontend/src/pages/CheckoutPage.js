import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../AppTheme.css';
import AddressFields from '../components/AddressFields';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { createMyContact, fetchMyDetails, rowToAddress, validateAddress } from '../data/account';
import { getCurrentUser } from '../data/auth';
import { clearCart, getCart } from '../data/cart';
import { placeOrder, processPayment, TEST_CARDS, validateCard } from '../data/orders';

const EMPTY_CARD = { owner: '', number: '', expiry: '', cvv: '' };

function CheckoutPage() {
  const user = getCurrentUser();
  const cart = getCart();

  const [contact, setContact] = useState(null); // the customer's TO row
  const [address, setAddress] = useState(rowToAddress(null));
  const [card, setCard] = useState(EMPTY_CARD);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // status can be: 'form', 'processing', 'declined', 'timeout', 'error' or 'approved'
  const [status, setStatus] = useState('form');
  const [message, setMessage] = useState('');
  const [order, setOrder] = useState(null);

  let isCustomer = false;
  if (user !== null && user.role === 'PATRON') {
    isCustomer = true;
  }

  // fill in the delivery address from their account
  useEffect(() => {
    async function load() {
      try {
        const details = await fetchMyDetails(user.id);
        setContact(details.contact);
        setAddress(rowToAddress(details.contact));
      } catch (error) {
        // they can still type an address in
      }
      setIsLoading(false);
    }

    if (isCustomer) {
      load();
    }
  }, []);

  function handleAddressChange(event) {
    setAddress({ ...address, [event.target.id]: event.target.value });
  }

  function handleCardChange(event) {
    setCard({ ...card, [event.target.id]: event.target.value });
  }

  // add up the cart
  let total = 0;
  for (const line of cart) {
    total = total + line.price * line.quantity;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // check the address and the card together
    const addressErrors = validateAddress(address);
    const cardErrors = validateCard(card);
    const newErrors = { ...addressErrors, ...cardErrors };
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setStatus('form');
      setMessage('Please fix the fields marked in red.');
      return;
    }

    setStatus('processing');
    setMessage('');

    // step 1: "pay". nothing is saved unless the payment is approved
    try {
      await processPayment(card);
    } catch (error) {
      setStatus(error.paymentResult); // 'declined' or 'timeout'
      setMessage(error.message);
      return;
    }

    // step 2: payment was approved so save the order
    try {
      // an order has to belong to a TO row, so make one if this customer doesn't have one yet
      let myContact = contact;
      if (myContact === null) {
        await createMyContact(user, address);
        const details = await fetchMyDetails(user.id);
        myContact = details.contact;
        setContact(myContact);
      }

      const newOrder = await placeOrder(myContact, address, cart);
      clearCart();

      // only keep the last 4 numbers of the card for the confirmation
      const lastFour = card.number.replace(/\s/g, '').slice(-4);
      setOrder({ id: newOrder.OrderID, total: total, lastFour: lastFour });
      setCard(EMPTY_CARD);
      setStatus('approved');
    } catch (error) {
      setStatus('error');
      setMessage('Your payment was approved but the order could not be saved. Please contact the store.');
    }
  }

  // label + input + error message for a card field
  function cardField(id, label, placeholder) {
    return (
      <>
        <label className="form-label fw-semibold" htmlFor={id}>{label}</label>
        <input
          className={errors[id] ? 'form-control is-invalid' : 'form-control'}
          id={id}
          onChange={handleCardChange}
          placeholder={placeholder}
          type={id === 'cvv' ? 'password' : 'text'}
          value={card[id]}
        />
        {errors[id] && <div className="invalid-feedback">{errors[id]}</div>}
      </>
    );
  }

  // work out what to show
  let pageContent;

  if (user === null) {
    pageContent = (
      <div className="alert alert-info">
        Please <Link to="/login">log in</Link> to check out.
      </div>
    );
  } else if (!isCustomer) {
    pageContent = <div className="alert alert-info">Purchasing is turned off for staff and admin accounts.</div>;
  } else if (status === 'approved') {
    pageContent = (
      <div className="alert alert-success">
        <h2 className="h4">Payment approved</h2>
        <p>
          Thanks for your order! Your order number is #{order.id}. ${order.total.toFixed(2)} was charged to the
          card ending in {order.lastFour}.
        </p>
        <Link to="/account">View my orders</Link>
      </div>
    );
  } else if (cart.length === 0) {
    pageContent = (
      <p>
        Your cart is empty. <Link to="/search">Browse items</Link>
      </p>
    );
  } else if (isLoading) {
    pageContent = <p>Loading your details...</p>;
  } else {
    pageContent = (
      <div className="row g-4">
        <div className="col-lg-8">
          {/* messages for each payment result */}
          {status === 'declined' && (
            <div className="alert alert-danger" role="alert"><strong>Payment declined.</strong> {message}</div>
          )}
          {status === 'timeout' && (
            <div className="alert alert-warning" role="alert"><strong>Payment timed out.</strong> {message}</div>
          )}
          {(status === 'error' || status === 'form') && message && (
            <div className="alert alert-danger" role="alert">{message}</div>
          )}

          <form noValidate onSubmit={handleSubmit}>
            <div className="panel p-4 mb-4">
              <h2 className="h5">Delivery address</h2>
              <AddressFields errors={errors} form={address} onChange={handleAddressChange} showPhone={false} />
            </div>

            <div className="panel p-4 mb-4">
              <h2 className="h5">Payment</h2>
              <p className="small text-muted">Card details are only used for this payment and are never saved.</p>
              <div className="row g-3">
                <div className="col-md-6">{cardField('owner', 'Name on card', '')}</div>
                <div className="col-md-6">{cardField('number', 'Card number', '1234 5678 9012 3456')}</div>
                <div className="col-6 col-md-3">{cardField('expiry', 'Expiry (MM/YY)', 'MM/YY')}</div>
                <div className="col-6 col-md-3">{cardField('cvv', 'CVV', '123')}</div>
              </div>

              {/* prototype only - the test cards so the marker can try each result */}
              <p className="small mt-3 mb-1">Test cards (no real payment is taken):</p>
              <ul className="small mb-0">
                {TEST_CARDS.map((testCard) => (
                  <li key={testCard.number}>{testCard.number} - {testCard.result}</li>
                ))}
              </ul>
            </div>

            <button className="btn btn-guild btn-lg" disabled={status === 'processing'} type="submit">
              {status === 'processing' ? 'Processing payment...' : 'Pay $' + total.toFixed(2)}
            </button>
          </form>
        </div>

        {/* order summary on the right */}
        <div className="col-lg-4">
          <div className="price-box p-4">
            <h2 className="h5">Order summary</h2>
            {cart.map((line) => (
              <p className="small mb-1" key={line.id}>
                {line.quantity} x {line.title} - ${(line.price * line.quantity).toFixed(2)}
              </p>
            ))}
            <p className="fs-5 fw-semibold mt-2 mb-0">Total: ${total.toFixed(2)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <main className="container py-5">
        <h1 className="display-6 fw-bold mb-4">Checkout</h1>
        {pageContent}
      </main>
      <Footer />
    </div>
  );
}

export default CheckoutPage;
