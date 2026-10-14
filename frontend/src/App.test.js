// AI-generated with GitHub Copilot (GPT-6 Luna).
// Prompt: "Test that the homepage loads one featured book, movie, and game from mocked Axios detail endpoints."
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import App from './App';

jest.mock('axios');

// Each test starts with an empty cart and nobody logged in
beforeEach(() => {
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
