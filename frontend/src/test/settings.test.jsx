import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '../pages/SettingsPage';
import authService from '../services/authService';
import reminderService from '../services/reminderService';
import exportService from '../services/exportService';

const mockUpdateUser = vi.fn();
const mockUser = {
  id: 'settings-user-1',
  name: 'Sam Settings',
  email: 'sam@example.com',
  avatar: 'https://example.com/avatar.jpg'
};

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    updateUser: mockUpdateUser,
    logout: vi.fn()
  })
}));

vi.mock('../services/authService', () => ({
  default: {
    updateProfile: vi.fn(),
    changePassword: vi.fn()
  }
}));

vi.mock('../services/reminderService', () => ({
  default: {
    getReminderSettings: vi.fn().mockResolvedValue({
      enabled: true,
      reminderTime: '20:00',
      timezone: 'UTC'
    }),
    updateReminderSettings: vi.fn()
  }
}));

vi.mock('../services/exportService', () => ({
  default: {
    exportMoodsAsJson: vi.fn(),
    exportMoodsAsCsv: vi.fn()
  }
}));

describe('Frontend: SettingsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders settings sections: profile, reminders, security, and data export', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /account settings/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /profile information/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /daily check-in reminders/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /security & password/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /data export & privacy/i })).toBeInTheDocument();
  });

  it('updates profile name and avatar successfully', async () => {
    authService.updateProfile.mockResolvedValueOnce({
      id: 'settings-user-1',
      name: 'Sam Updated',
      email: 'sam@example.com',
      avatar: 'https://example.com/new-avatar.jpg'
    });

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const nameInput = screen.getByPlaceholderText('Your name');
    fireEvent.change(nameInput, { target: { value: 'Sam Updated' } });

    const saveProfileBtn = screen.getByRole('button', { name: /save profile changes/i });
    fireEvent.click(saveProfileBtn);

    await waitFor(() => {
      expect(authService.updateProfile).toHaveBeenCalledWith({
        name: 'Sam Updated',
        email: 'sam@example.com',
        avatar: 'https://example.com/avatar.jpg'
      });
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });
  });

  it('validates password mismatch before submitting password change', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const currentPassInput = screen.getByPlaceholderText(/enter your current password/i);
    const newPassInput = screen.getByPlaceholderText(/at least 6 characters/i);
    const confirmPassInput = screen.getByPlaceholderText(/repeat new password/i);

    fireEvent.change(currentPassInput, { target: { value: 'CurrentPass123!' } });
    fireEvent.change(newPassInput, { target: { value: 'BrandNew456!' } });
    fireEvent.change(confirmPassInput, { target: { value: 'Mismatch789!' } });

    const updatePassBtn = screen.getByRole('button', { name: /update password/i });
    fireEvent.click(updatePassBtn);

    await waitFor(() => {
      expect(screen.getByText(/new password and confirmation do not match/i)).toBeInTheDocument();
    });
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  it('successfully triggers JSON and CSV export actions', async () => {
    exportService.exportMoodsAsJson.mockResolvedValueOnce('moodtrack-export.json');
    exportService.exportMoodsAsCsv.mockResolvedValueOnce('moodtrack-export.csv');

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const exportJsonBtn = screen.getByRole('button', { name: /export json/i });
    fireEvent.click(exportJsonBtn);

    await waitFor(() => {
      expect(exportService.exportMoodsAsJson).toHaveBeenCalled();
    });

    const exportCsvBtn = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(exportCsvBtn);

    await waitFor(() => {
      expect(exportService.exportMoodsAsCsv).toHaveBeenCalled();
    });
  });
});
