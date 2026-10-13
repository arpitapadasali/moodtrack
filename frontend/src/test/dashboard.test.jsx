import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import moodService from '../services/moodService';
import analyticsService from '../services/analyticsService';

vi.mock('../services/moodService', () => ({
  default: {
    getTodayEntry: vi.fn(),
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

vi.mock('../services/analyticsService', () => ({
  default: {
    getRecentAnalytics: vi.fn(),
    getAnalyticsSummary: vi.fn(),
    getStreakAnalytics: vi.fn(),
    getTrends: vi.fn()
  },
  getRecentAnalytics: vi.fn(),
  getAnalyticsSummary: vi.fn(),
  getStreakAnalytics: vi.fn(),
  getTrends: vi.fn()
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Tester', email: 'test@example.com' },
    logout: vi.fn()
  })
}));

describe('Frontend: DashboardPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard layout, header, and action buttons', async () => {
    moodService.getTodayEntry.mockResolvedValueOnce({
      mood: 4,
      sleepHours: 8,
      feelings: ['calm'],
      reflection: 'Feeling energized today.'
    });

    analyticsService.getRecentAnalytics.mockResolvedValue([]);
    analyticsService.getAnalyticsSummary.mockResolvedValue({
      latest5: { count: 1, averageMood: 4, averageSleep: 8 },
      previous5: { count: 0, averageMood: null, averageSleep: null },
      comparison: { hasComparisonData: false }
    });
    analyticsService.getStreakAnalytics.mockResolvedValue({
      currentStreak: 3,
      longestStreak: 5,
      totalCheckInDays: 7
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /daily wellness overview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log mood entry/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/feeling energized today/i)).toBeInTheDocument();
    });
  });

  it('displays empty state when user has not recorded a mood check-in today', async () => {
    moodService.getTodayEntry.mockResolvedValueOnce(null);
    analyticsService.getRecentAnalytics.mockResolvedValue([]);
    analyticsService.getAnalyticsSummary.mockResolvedValue(null);
    analyticsService.getStreakAnalytics.mockResolvedValue(null);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/how are you feeling today/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /record today's mood/i })).toBeInTheDocument();
    });
  });
});
