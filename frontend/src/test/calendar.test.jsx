import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CalendarPage from '../pages/CalendarPage';
import * as analyticsModule from '../services/analyticsService';
import moodService from '../services/moodService';

vi.mock('../services/analyticsService', () => ({
  getCalendarData: vi.fn()
}));

vi.mock('../services/moodService', () => ({
  default: {
    getMoodByDate: vi.fn(),
    createMoodEntry: vi.fn(),
    updateMoodEntry: vi.fn(),
    deleteMoodEntry: vi.fn()
  },
  formatDateParam: (d) => {
    const date = d ? new Date(d) : new Date();
    return date.toISOString().split('T')[0];
  }
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'cal-user', name: 'Cal User', email: 'cal@example.com' },
    logout: vi.fn()
  })
}));

describe('Frontend: CalendarPage Component', () => {
  const mockCalendarData = {
    year: 2026,
    month: 3,
    totalEntries: 1,
    entries: [
      {
        id: 'entry-1',
        date: '2026-03-10',
        mood: 4,
        sleepHours: 7.5,
        feelings: ['calm', 'grateful'],
        reflection: 'Peaceful afternoon reading.'
      }
    ],
    entriesByDate: {
      '2026-03-10': {
        id: 'entry-1',
        date: '2026-03-10',
        mood: 4,
        sleepHours: 7.5,
        feelings: ['calm', 'grateful'],
        reflection: 'Peaceful afternoon reading.'
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders calendar page header, month title, and action buttons', async () => {
    analyticsModule.getCalendarData.mockResolvedValueOnce(mockCalendarData);
    moodService.getMoodByDate.mockResolvedValueOnce(null);

    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /mood calendar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log mood entry/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(analyticsModule.getCalendarData).toHaveBeenCalled();
    });
  });

  it('supports month navigation to previous and next months', async () => {
    analyticsModule.getCalendarData.mockResolvedValue(mockCalendarData);
    moodService.getMoodByDate.mockResolvedValue(null);

    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(analyticsModule.getCalendarData).toHaveBeenCalledTimes(1);
    });

    const prevMonthBtn = screen.getByTitle(/previous month/i);
    fireEvent.click(prevMonthBtn);

    await waitFor(() => {
      expect(analyticsModule.getCalendarData).toHaveBeenCalledTimes(2);
    });

    const nextMonthBtn = screen.getByTitle(/next month/i);
    fireEvent.click(nextMonthBtn);

    await waitFor(() => {
      expect(analyticsModule.getCalendarData).toHaveBeenCalledTimes(3);
    });
  });

  it('fetches and displays mood details when a recorded date is inspected', async () => {
    analyticsModule.getCalendarData.mockResolvedValueOnce(mockCalendarData);
    moodService.getMoodByDate.mockResolvedValueOnce(mockCalendarData.entries[0]);

    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(analyticsModule.getCalendarData).toHaveBeenCalled();
    });

    // Find and click day cell for 2026-03-10
    const dayCell = screen.getByTestId ? screen.queryByTestId('calendar-day-2026-03-10') : null;
    if (dayCell) {
      fireEvent.click(dayCell);
    }

    // Detail inspector displays feelings and reflection
    await waitFor(() => {
      expect(screen.getByText(/peaceful afternoon reading/i)).toBeInTheDocument();
    });
  });

  it('displays empty state for an unrecorded date', async () => {
    analyticsModule.getCalendarData.mockResolvedValueOnce(mockCalendarData);
    moodService.getMoodByDate.mockRejectedValueOnce(new Error('No mood entry found for date 2026-03-01.'));

    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no check-in logged/i)).toBeInTheDocument();
    });
  });
});
