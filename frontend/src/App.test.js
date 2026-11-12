// AI-generated with GitHub Copilot (GPT-6 Luna).
// Prompt: "Test that the homepage loads one featured book, movie, and game from mocked Axios detail endpoints."
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import App from './App';
import { validateItem } from './data/admin';
import { processPayment, validateCard } from './data/orders';

jest.mock('axios');

// Each test starts with an empty cart and nobody logged in
beforeEach(() => {
  jest.resetAllMocks(); // clear the fake api answers from the last test
  localStorage.clear();
  sessionStorage.clear();
  window.history.pushState({}, '', '/');
});

test('renders one featured item from each genre with storefront navigation and footer', async () => {
  // Fake detail endpoints so the test doesn't need Docker or a running database.
  const apiRows = {
    '/Stocktake/31': { ItemId: 31, ProductId: 1, SourceId: 1, Quantity: 29, Price: 47.35 },
    '/Stocktake/248': { ItemId: 248, ProductId: 201, SourceId: 5, Quantity: 21, Price: 16.59 },
    '/Stocktake/457': { ItemId: 457, ProductId: 301, SourceId: 3, Quantity: 100, Price: 33.94 },
    '/Product/1': { ID: 1, Name: 'Test book', Author: 'Book author', Description: 'A test book description.', Genre: 1, subGenre: 1 },
    '/Product/201': { ID: 201, Name: 'Test movie', Author: 'Movie director', Genre: 2 },
    '/Product/301': { ID: 301, Name: 'Test game', Author: 'Game studio', Genre: 3 },
    '/Source/1': { sourceid: 1, Source_name: 'Paperback' },
    '/Source/5': { sourceid: 5, Source_name: 'DVD' },
    '/Source/3': { sourceid: 3, Source_name: 'Steam' },
    '/Genre/1': { genreID: 1, Name: 'Books' },
    '/Genre/2': { genreID: 2, Name: 'Movies' },
    '/Genre/3': { genreID: 3, Name: 'Games' },
    '/BookGenre/1': { subGenreID: 1, Name: 'Fiction' },
  };

  axios.get.mockImplementation((url) => {
    const match = Object.entries(apiRows).find(([path]) => url.endsWith(path));
    return Promise.resolve({ data: apiRows[match[0]] });
  });

  render(<App />);
  // The shared shell should render while the catalogue request is in flight.
  expect(screen.getByRole('link', { name: /entertainment guild/i })).toBeInTheDocument();
  expect(screen.getByRole('searchbox', { name: /search items/i })).toBeInTheDocument();
  expect(screen.getByRole('contentinfo')).toHaveTextContent(/entertainment guild/i);

  // Wait for the three Stocktake + Product + Source + Genre records to become cards.
  await waitFor(() => expect(screen.getByText('Test book')).toBeInTheDocument());
  expect(screen.getByText('Test movie')).toBeInTheDocument();
  expect(screen.getByText('Test game')).toBeInTheDocument();
  expect(screen.getByText('$47.35')).toBeInTheDocument();
  expect(screen.getByText('Paperback')).toBeInTheDocument();
  expect(screen.getAllByRole('article')).toHaveLength(3);

  fireEvent.click(screen.getAllByRole('link', { name: 'View details' })[0]);
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Test book' })).toBeInTheDocument());
  expect(screen.getByText('A test book description.')).toBeInTheDocument();
  expect(screen.getByText('Fiction')).toBeInTheDocument();
  expect(screen.getByText('29 available')).toBeInTheDocument();
});

test('search page filters items and paginates results', async () => {
  const products = Array.from({ length: 13 }, (_, index) => ({
    ID: index + 1,
    Name: `Catalogue item ${index + 1}`,
    Author: 'Test creator',
    Genre: 1,
  }));
  const stockItems = products.map((product, index) => ({
    ItemId: index + 101,
    ProductId: product.ID,
    SourceId: 1,
    Quantity: 5,
    Price: 10 + index,
  }));
  const tableRows = {
    '/Product': products,
    '/Stocktake': stockItems,
    '/Source': [{ sourceid: 1, Source_name: 'Paperback' }],
    '/Genre': [{ genreID: 1, Name: 'Books' }],
  };

  axios.get.mockImplementation((url) => {
    const table = Object.keys(tableRows).find((path) => url.endsWith(path));
    return Promise.resolve({ data: { list: tableRows[table] } });
  });
  window.history.pushState({}, '', '/search');

  render(<App />);

  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(12));
  expect(screen.getByText((_, element) => element.textContent === '13 items found')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getAllByRole('article')).toHaveLength(1);
  expect(screen.getByText('Catalogue item 13')).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText('Title, creator, category, or format'), {
    target: { value: 'Catalogue item 13' },
  });
  expect(screen.getAllByRole('article')).toHaveLength(1);
  expect(screen.getByText('Catalogue item 13')).toBeInTheDocument();
});

// AI-generated with Claude Code: the tests below (cart, login, register, admin mode, URL filters).
// Prompt: "Review existing Jest and React Testing Library tests and add tests for the cart and login pages I revised."
test('adds an item to the cart and limits quantity to the stock available', async () => {
  const apiRows = {
    '/Stocktake/31': { ItemId: 31, ProductId: 1, SourceId: 1, Quantity: 2, Price: 10 },
    '/Product/1': { ID: 1, Name: 'Cart book', Author: 'Book author', Genre: 1 },
    '/Source/1': { sourceid: 1, Source_name: 'Paperback' },
    '/Genre/1': { genreID: 1, Name: 'Books' },
  };
  axios.get.mockImplementation((url) => {
    const match = Object.entries(apiRows).find(([path]) => url.endsWith(path));
    return Promise.resolve({ data: apiRows[match[0]] });
  });
  window.history.pushState({}, '', '/products/31');

  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Cart book' })).toBeInTheDocument();
  // Only 2 in stock, so the dropdown stops at 2
  expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['1', '2']);
  fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
  expect(screen.getByText(/2 copies added to your cart/i)).toBeInTheDocument();
  expect(screen.getByText(/you already have all 2 in your cart/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('link', { name: 'View cart' }));
  expect(screen.getByRole('heading', { name: 'Your cart' })).toBeInTheDocument();
  expect(screen.getByText('$20.00', { selector: '.cart-line-total' })).toBeInTheDocument();

  // Can't go over stock
  fireEvent.change(screen.getByLabelText('Quantity of Cart book'), { target: { value: '3' } });
  expect(screen.getByRole('alert')).toHaveTextContent('Only 2 of "Cart book" are in stock.');

  fireEvent.click(screen.getByRole('button', { name: /remove/i }));
  expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
});

test('login shows an error for wrong details and the user name after success', async () => {
  window.history.pushState({}, '', '/login');
  axios.get.mockResolvedValue({ data: { list: [] } });
  axios.post.mockRejectedValueOnce({ response: { status: 401 } });

  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Please enter your email and password.');

  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('combination is incorrect'));

  axios.post.mockResolvedValueOnce({ data: { id: 1, username: 'Test Customer', email: 'test@example.com', role: 'PATRON' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'right' } });
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
  await waitFor(() => expect(screen.getByText('Test Customer')).toBeInTheDocument());
  expect(axios.post).toHaveBeenLastCalledWith(
    'http://localhost:3001/patronLogin',
    { username: 'test@example.com', password: 'right' },
    { withCredentials: true }
  );
});

test('register form checks postcode, matching passwords and state', () => {
  window.history.pushState({}, '', '/register');
  render(<App />);

  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'longenough' } });
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'different' } });
  fireEvent.change(screen.getByLabelText('Postcode'), { target: { value: '23' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

  expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  expect(screen.getByText('Postcode must be 4 numbers, e.g. 2308.')).toBeInTheDocument();
  expect(screen.getByText('Choose your state.')).toBeInTheDocument();
});

test('admin login turns on admin mode and hides the cart', async () => {
  window.history.pushState({}, '', '/login');
  axios.get.mockResolvedValue({ data: { list: [] } });
  axios.post.mockResolvedValueOnce({ data: { id: 2, username: 'admin', email: 'admin@example.com', role: 'ADMIN' } });

  render(<App />);
  fireEvent.click(screen.getByLabelText('Staff'));
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

  await waitFor(() => expect(screen.getByText('Admin mode')).toBeInTheDocument());
  expect(screen.getByText(/Admin mode is on/)).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /cart/i })).not.toBeInTheDocument();
  expect(axios.post).toHaveBeenLastCalledWith(
    'http://localhost:3001/login',
    { username: 'admin', password: 'secret' },
    { withCredentials: true }
  );
});

test('search and filters are kept in the URL so customers can return to their results', async () => {
  const tableRows = {
    '/Product': [{ ID: 1, Name: 'Star game', Author: 'Studio', Genre: 3 }, { ID: 2, Name: 'Star book', Author: 'Writer', Genre: 1 }],
    '/Stocktake': [{ ItemId: 10, ProductId: 1, SourceId: 1, Quantity: 1, Price: 5 }, { ItemId: 11, ProductId: 2, SourceId: 1, Quantity: 1, Price: 5 }],
    '/Source': [{ sourceid: 1, Source_name: 'Steam' }],
    '/Genre': [{ genreID: 1, Name: 'Books' }, { genreID: 3, Name: 'Games' }],
  };
  axios.get.mockImplementation((url) => {
    const table = Object.keys(tableRows).find((path) => url.endsWith(path));
    return Promise.resolve({ data: { list: tableRows[table] } });
  });
  window.history.pushState({}, '', '/search?q=star&category=Games');

  render(<App />);

  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1));
  expect(screen.getByText('Star game')).toBeInTheDocument();
  expect(screen.getByLabelText('Category')).toHaveValue('Games');
  expect(screen.getByPlaceholderText('Title, creator, category, or format')).toHaveValue('star');

  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'All' } });
  expect(screen.getAllByRole('article')).toHaveLength(2);
  expect(window.location.search).toBe('?q=star');
});

// ---------- tests for the final features (account, checkout, admin) ----------

// pretends someone is logged in
function logInAs(user) {
  sessionStorage.setItem('eg-user', JSON.stringify(user));
}

// answers GET requests from a table of url endings -> response data
function mockGets(rows) {
  axios.get.mockImplementation((url) => {
    const match = Object.keys(rows).find((path) => url.endsWith(path));
    if (!match) {
      return Promise.resolve({ data: { list: [] } });
    }
    return Promise.resolve({ data: rows[match] });
  });
}

test('card validation checks number, expiry and CVV', () => {
  const today = new Date(2026, 10, 11);
  const errors = validateCard({ owner: '', number: '1234 5678', expiry: '01/25', cvv: '12' }, today);
  expect(errors.owner).toBe('Enter the name on the card.');
  expect(errors.number).toBe('Card number must be 16 numbers.');
  expect(errors.expiry).toBe('This card has expired.');
  expect(errors.cvv).toMatch(/3 numbers/);

  const ok = validateCard({ owner: 'Jane Citizen', number: '4242 4242 4242 4242', expiry: '08/28', cvv: '123' }, today);
  expect(ok).toEqual({});
});

test('payment simulation approves, declines and times out', async () => {
  jest.useFakeTimers();

  const approved = processPayment({ number: '4242424242424242' });
  jest.runAllTimers();
  await expect(approved).resolves.toBe('approved');

  const declined = processPayment({ number: '4000000000000002' });
  jest.runAllTimers();
  await expect(declined).rejects.toMatchObject({ paymentResult: 'declined' });

  const timedOut = processPayment({ number: '4000000000000119' });
  jest.runAllTimers();
  await expect(timedOut).rejects.toMatchObject({ paymentResult: 'timeout' });

  jest.useRealTimers();
});

test('item form rejects a missing name, a bad price and a decimal quantity', () => {
  const errors = validateItem({
    name: ' ', author: '', description: '', genre: '1', subgenre: '', published: '', source: '1', price: 'abc', quantity: '1.5',
  });
  expect(errors.name).toBeDefined();
  expect(errors.price).toBeDefined();
  expect(errors.quantity).toBeDefined();
  expect(errors.genre).toBeUndefined();
});

test('registering creates the patron, logs in, saves the address and opens the account page', async () => {
  axios.get.mockImplementation((url) => {
    if (url.endsWith('/patronLookup')) {
      return Promise.reject({ response: { status: 404 } }); // email not used yet
    }
    if (url.endsWith('/Patrons/7')) {
      return Promise.resolve({ data: { UserID: 7, Email: 'new@example.com', Name: 'New Customer' } });
    }
    if (url.endsWith('/TO')) {
      return Promise.resolve({ data: { list: [{ CustomerID: 9, PatronId: 7, StreetAddress: '377 Ring Road', Suburb: 'Callaghan', State: 'NSW', PostCode: 2308 }] } });
    }
    return Promise.resolve({ data: { list: [] } });
  });
  axios.post.mockImplementation((url) => {
    if (url.endsWith('/patronLogin')) {
      return Promise.resolve({ data: { id: 7, username: 'New Customer', email: 'new@example.com', role: 'PATRON' } });
    }
    return Promise.resolve({ data: {} });
  });
  window.history.pushState({}, '', '/register');

  render(<App />);
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'New Customer' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password1' } });
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'password1' } });
  fireEvent.change(screen.getByLabelText('Street address'), { target: { value: '377 Ring Road' } });
  fireEvent.change(screen.getByLabelText('Suburb'), { target: { value: 'Callaghan' } });
  fireEvent.change(screen.getByLabelText('State'), { target: { value: 'NSW' } });
  fireEvent.change(screen.getByLabelText('Postcode'), { target: { value: '2308' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

  expect(await screen.findByText(/account has been created successfully/i)).toBeInTheDocument();
  expect(await screen.findByText('377 Ring Road', { exact: false })).toBeInTheDocument();

  expect(axios.post).toHaveBeenCalledWith(
    'http://localhost:3001/api/inft3050/Patrons',
    { Email: 'new@example.com', Name: 'New Customer', HashPW: 'password1' },
    { withCredentials: true }
  );
  expect(axios.post).toHaveBeenCalledWith(
    'http://localhost:3001/api/inft3050/TO',
    expect.objectContaining({ PatronId: 7, StreetAddress: '377 Ring Road', PostCode: 2308, State: 'NSW' }),
    { withCredentials: true }
  );
});

test('account page shows order history for the logged in customer', async () => {
  logInAs({ id: 1, name: 'Jane Citizen', email: 'jane@example.com', role: 'PATRON' });
  mockGets({
    '/Patrons/1': { UserID: 1, Email: 'jane@example.com', Name: 'Jane Citizen' },
    '/TO': { list: [{ CustomerID: 2, PatronId: 1 }] },
    '/Orders': { list: [{ OrderID: 3, customer: 2, StreetAddress: '45 Rainbow Road', PostCode: 2204, Suburb: 'Marrickville', State: 'NSW' }] },
    '/ProductsInOrders': { list: [{ OrderId: 3, produktId: 50, Quantity: 2 }] },
    '/Stocktake/50': { ItemId: 50, ProductId: 5, SourceId: 1, Quantity: 3, Price: 10 },
    '/Product/5': { ID: 5, Name: 'Ordered book', Genre: 1 },
    '/Source/1': { sourceid: 1, Source_name: 'Hard copy book' },
    '/Genre/1': { genreID: 1, Name: 'Books' },
  });
  window.history.pushState({}, '', '/account');

  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Order #3' })).toBeInTheDocument();
  expect(screen.getByText('Ordered book')).toBeInTheDocument();
  expect(screen.getByText((_, element) => element.tagName === 'P' && element.textContent === 'Total: $20.00')).toBeInTheDocument();
  expect(screen.getByText(/45 Rainbow Road/)).toBeInTheDocument();
});

test('a declined payment shows a message and does not save an order', async () => {
  logInAs({ id: 1, name: 'Jane Citizen', email: 'jane@example.com', role: 'PATRON' });
  localStorage.setItem('eg-cart', JSON.stringify([{ id: 50, title: 'Cart book', format: 'DVD', price: 10, stock: 5, quantity: 1 }]));
  mockGets({
    '/Patrons/1': { UserID: 1, Email: 'jane@example.com', Name: 'Jane Citizen' },
    '/TO': { list: [{ CustomerID: 2, PatronId: 1, StreetAddress: '377 Ring Road', Suburb: 'Callaghan', State: 'NSW', PostCode: 2308 }] },
  });
  window.history.pushState({}, '', '/checkout');

  render(<App />);
  expect(await screen.findByDisplayValue('377 Ring Road')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Name on card'), { target: { value: 'Jane Citizen' } });
  fireEvent.change(screen.getByLabelText('Card number'), { target: { value: '4000 0000 0000 0002' } });
  fireEvent.change(screen.getByLabelText('Expiry (MM/YY)'), { target: { value: '08/30' } });
  fireEvent.change(screen.getByLabelText('CVV'), { target: { value: '123' } });
  fireEvent.click(screen.getByRole('button', { name: /pay \$10.00/i }));

  expect(await screen.findByText('Payment declined.', {}, { timeout: 4000 })).toBeInTheDocument();
  expect(axios.post).not.toHaveBeenCalled();
});

test('staff can view items but only admins get add, edit and delete buttons', async () => {
  mockGets({
    '/Genre': { list: [{ genreID: 1, Name: 'Books' }] },
    '/Source': { list: [{ sourceid: 1, Source_name: 'Hard copy book', Genre: 1 }] },
    '/Stocktake': { list: [{ ItemId: 10, ProductId: 1, SourceId: 1, Quantity: 4, Price: 12.5 }] },
    '/Product': { list: [{ ID: 1, Name: 'Managed book', Author: 'Writer', Genre: 1 }] },
  });

  logInAs({ id: 4, name: 'queenOS', role: 'STAFF' });
  window.history.pushState({}, '', '/admin/items');
  const { unmount } = render(<App />);
  expect(await screen.findByRole('link', { name: 'Managed book' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /add item/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  unmount();

  logInAs({ id: 1, name: 'adminAccount', role: 'ADMIN' });
  render(<App />);
  expect(await screen.findByRole('link', { name: 'Managed book' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
  expect(screen.getByLabelText('Name')).toHaveValue('Managed book');
  expect(screen.getByLabelText('Price ($)')).toHaveValue('12.5');
});
