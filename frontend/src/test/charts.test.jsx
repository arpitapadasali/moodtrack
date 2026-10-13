import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MoodTrendChart from '../components/dashboard/MoodTrendChart';
import * as analyticsModule from '../services/analyticsService';
import moodService from '../services/moodService';

vi.mock('../services/analyticsService', () => ({
  getRecentAnalytics: vi.fn(),
  getTrends: vi.fn()
}));

vi.mock('../services/moodService', () => ({
  default: {
    getMoodByDate: vi.fn()
  }
}));

vi.mock('react-chartjs-2', () => ({
  Line: ({ data }) => <div data-testid="line-chart" data-points={data?.labels?.length} />,
  Bar: ({ data }) => <div data-testid="bar-chart" data-points={data?.labels?.length} />
}));

describe('Frontend: MoodTrendChart Component', () => {
  const sampleLatest11 = [
    {
      id: 'e1',
      date: '2026-03-01',
      mood: 4,
      sleepHours: 7.5,
      feelings: ['calm', 'focused'],
      reflection: 'Good productive day'
    },
    {
      id: 'e2',
      date: '2026-03-02',
      mood: 5,
      sleepHours: 8.0,
      feelings: ['happy', 'vibrant'],
      reflection: 'Sunny morning hike'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chart controls, default Latest 11 range, and timeframe options', async () => {
    analyticsModule.getRecentAnalytics.mockResolvedValueOnce(sampleLatest11);

    render(<MoodTrendChart />);

    expect(screen.getByText(/mood trend/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Latest 11' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7 Days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30 Days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '90 Days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '6 Months' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1 Year' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Line' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bar' })).toBeInTheDocument();

    await waitFor(() => {
      expect(analyticsModule.getRecentAnalytics).toHaveBeenCalledTimes(1);
    });
  });

  it('switches timeframe range to 7 Days and requests trend data', async () => {
    analyticsModule.getRecentAnalytics.mockResolvedValueOnce(sampleLatest11);
    analyticsModule.getTrends.mockResolvedValueOnce({
      rangeDays: 7,
      points: [
        { date: '2026-03-01', mood: 4, sleepHours: 7, hasEntry: true },
        { date: '2026-03-02', mood: null, sleepHours: null, hasEntry: false }
      ]
    });

    render(<MoodTrendChart />);

    await waitFor(() => {
      expect(analyticsModule.getRecentAnalytics).toHaveBeenCalled();
    });

    const sevenDaysBtn = screen.getByRole('button', { name: '7 Days' });
    fireEvent.click(sevenDaysBtn);

    await waitFor(() => {
      expect(analyticsModule.getTrends).toHaveBeenCalledWith('7d');
    });
  });

  it('switches chart type between Line and Bar', async () => {
    analyticsModule.getRecentAnalytics.mockResolvedValueOnce(sampleLatest11);

    render(<MoodTrendChart />);

    const barBtn = screen.getByRole('button', { name: 'Bar' });
    fireEvent.click(barBtn);

    const lineBtn = screen.getByRole('button', { name: 'Line' });
    fireEvent.click(lineBtn);

    await waitFor(() => {
      expect(analyticsModule.getRecentAnalytics).toHaveBeenCalled();
    });
  });

  it('renders empty state when no mood records exist', async () => {
    analyticsModule.getRecentAnalytics.mockResolvedValueOnce([]);

    render(<MoodTrendChart />);

    await waitFor(() => {
      expect(screen.getByText(/no mood records found for this period/i)).toBeInTheDocument();
    });
  });
});
