import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

// Mock useAuth hook
const mockLogin = vi.fn();
const mockRegister = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    login: mockLogin,
    register: mockRegister
  })
}));

describe('Frontend: Authentication Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LoginPage', () => {
    it('renders login form elements properly', () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /auto-fill/i })).toBeInTheDocument();
    });

    it('populates demo credentials when clicking Auto-fill', () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const autoFillBtn = screen.getByRole('button', { name: /auto-fill/i });
      fireEvent.click(autoFillBtn);

      expect(screen.getByPlaceholderText('you@example.com')).toHaveValue('demo@moodtrack.com');
      expect(screen.getByPlaceholderText('••••••••')).toHaveValue('Password123!');
    });

    it('submits form with user credentials and calls login', async () => {
      mockLogin.mockResolvedValueOnce({ user: { email: 'user@example.com' } });

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
        target: { value: 'user@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'SecretPass123!' }
      });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'user@example.com',
          password: 'SecretPass123!'
        });
      });
    });

    it('displays error message when login fails', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Invalid email or password.'));

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
        target: { value: 'wrong@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'WrongPass' }
      });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
      });
    });
  });

  describe('RegisterPage', () => {
    it('renders registration form elements properly', () => {
      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\. Alex Morgan/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/at least 6 characters/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('validates password length < 6 characters before submitting', async () => {
      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Alex Morgan/i), {
        target: { value: 'New User' }
      });
      fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
        target: { value: 'valid@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText(/at least 6 characters/i), {
        target: { value: '12345' } // 5 chars
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters long/i)).toBeInTheDocument();
      });
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('validates invalid email format before submitting', async () => {
      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Alex Morgan/i), {
        target: { value: 'Valid Name' }
      });
      fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
        target: { value: 'invalid-email-string' }
      });
      fireEvent.change(screen.getByPlaceholderText(/at least 6 characters/i), {
        target: { value: 'SecurePassword123!' }
      });

      const form = screen.getByRole('button', { name: /create account/i }).closest('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('submits valid registration form and calls register', async () => {
      mockRegister.mockResolvedValueOnce({ user: { id: 'new-id' } });

      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Alex Morgan/i), {
        target: { value: 'Valid User' }
      });
      fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
        target: { value: 'valid@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText(/at least 6 characters/i), {
        target: { value: 'ValidPassword123!' }
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Valid User',
          email: 'valid@example.com',
          password: 'ValidPassword123!'
        });
      });
    });
  });
});
