import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Login } from '../components/Login.tsx';

test('renders the sign-in form', () => {
  render(<Login onLoggedIn={() => {}} />);
  // Heading + key controls present (getByRole/getByPlaceholderText throw if absent).
  expect(screen.getByText('TugOS')).toBeTruthy();
  screen.getByPlaceholderText('captain@demo.test');
  screen.getByRole('button', { name: /sign in/i });
});
