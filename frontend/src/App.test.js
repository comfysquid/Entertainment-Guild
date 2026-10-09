// AI-generated with GitHub Copilot (GPT-6 Luna).
// Likely prompt: "Test that the homepage loads one featured book, movie, and game from mocked Axios detail endpoints."
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import App from './App';

jest.mock('axios');

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
