import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the storefront navigation and footer', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: /entertainment guild/i })).toBeInTheDocument();
  expect(screen.getByRole('searchbox', { name: /search items/i })).toBeInTheDocument();
  expect(screen.getByRole('contentinfo')).toHaveTextContent(/entertainment guild/i);
});
