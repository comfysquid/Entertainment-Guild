import axios from 'axios';
import { fetchItem } from './catalogue';

const API_URL = 'http://localhost:3001/api/inft3050';
const options = { withCredentials: true };

// fake payment 
// no real payment is taken. these test cards show the 3 results from the requirements:
// approved, declined and timed out
// card details are never sent to the api or saved
export const TEST_CARDS = [
  { number: '4242 4242 4242 4242', result: 'Approved' },
  { number: '4000 0000 0000 0002', result: 'Declined' },
  { number: '4000 0000 0000 0119', result: 'Times out' },
];

// checks the card form, returns an object of error messages (empty = ok)
export function validateCard(card, today = new Date()) {
  const errors = {};
  const number = card.number.replace(/\s/g, ''); // take out spaces

  if (card.owner.trim() === '') {
    errors.owner = 'Enter the name on the card.';
  }

  // TODO: proper card number checkd
  if (!/^\d{16}$/.test(number)) {
    errors.number = 'Card number must be 16 numbers.';
  }

  // expiry has to be MM/YY
  const parts = card.expiry.trim().split('/');
  if (parts.length !== 2 || !/^\d{2}$/.test(parts[0]) || !/^\d{2}$/.test(parts[1])) {
    errors.expiry = 'Expiry must be MM/YY, e.g. 08/28.';
  } else {
    const month = Number(parts[0]);
    const year = 2000 + Number(parts[1]);
    const thisMonth = today.getMonth() + 1; // getMonth starts at 0
    const thisYear = today.getFullYear();

    if (month < 1 || month > 12) {
      errors.expiry = 'Expiry must be MM/YY, e.g. 08/28.';
    } else if (year < thisYear || (year === thisYear && month < thisMonth)) {
      errors.expiry = 'This card has expired.';
    }
  }

  if (!/^\d{3}$/.test(card.cvv.trim())) {
    errors.cvv = 'CVV must be the 3 numbers on the back of the card.';
  }

  return errors;
}

// waits  milliseconds (Fake delay0)
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// pretend payment gateway
// returns 'approved', or throws an error with paymentResult set to 'declined' or 'timeout'
export async function processPayment(card) {
  const number = card.number.replace(/\s/g, '');

  if (number === '4000000000000119') {
    await wait(4000); // takes too long
    const error = new Error('The payment service did not respond in time. You have not been charged. Please try again.');
    error.paymentResult = 'timeout';
    throw error;
  }

  await wait(1500);

  if (number === '4242424242424242') {
    return 'approved';
  }

  // every other card gets declined
  const error = new Error('Your card was declined. You have not been charged. Try another card.');
  error.paymentResult = 'declined';
  throw error;
}

// orders 

// saves the order after the payment is approved
// Orders = the delivery address, ProductsInOrders = one row for each item in the cart
export async function placeOrder(contact, address, cart) {
  const orderResponse = await axios.post(API_URL + '/Orders', {
    Customer: contact.CustomerID,
    StreetAddress: address.street.trim(),
    Suburb: address.suburb.trim(),
    State: address.state,
    PostCode: Number(address.postcode),
  }, options);

  const order = orderResponse.data; // has the new OrderID

  for (const line of cart) {
    await axios.post(API_URL + '/ProductsInOrders', {
      OrderId: order.OrderID,
      produktId: line.id, // spelt produktId in the database, it's the Stocktake ItemId
      Quantity: line.quantity,
    }, options);
  }

  return order;
}

// gets the logged in customer's orders and the items in each one
// the api only sends back this customer's orders
export async function fetchMyOrders() {
  const ordersResponse = await axios.get(API_URL + '/Orders', {
    withCredentials: true,
    params: { sort: '-OrderID' }, // newest first
  });

  const orders = [];

  for (const order of ordersResponse.data.list) {
    // get the items in this order
    const linesResponse = await axios.get(API_URL + '/ProductsInOrders', {
      withCredentials: true,
      params: { where: '(OrderId,eq,' + order.OrderID + ')' },
    });

    const lines = [];
    let total = 0;

    for (const line of linesResponse.data.list) {
      // look up the item's title and price
      let title = 'Item no longer available';
      let price = 0;
      try {
        const item = await fetchItem(line.produktId);
        title = item.title;
        price = item.price;
      } catch (error) {
        // item was deleted, just show it without details
      }

      total = total + price * line.Quantity;
      lines.push({ id: line.produktId, title: title, price: price, quantity: line.Quantity });
    }

    orders.push({
      id: order.OrderID,
      street: order.StreetAddress,
      suburb: order.Suburb,
      state: order.State,
      postcode: order.PostCode,
      lines: lines,
      total: total,
    });
  }

  return orders;
}
