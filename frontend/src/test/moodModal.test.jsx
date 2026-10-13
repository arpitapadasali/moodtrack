import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MoodEntryModal from '../components/dashboard/MoodEntryModal';

describe('Frontend: MoodEntryModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <MoodEntryModal
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal header and mood options when isOpen is true', () => {
    render(
      <MoodEntryModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByRole('heading', { name: /log new mood check-in/i })).toBeInTheDocument();
    expect(screen.getByText(/overall mood/i)).toBeInTheDocument();
    expect(screen.getByText('Very Bad')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save check-in/i })).toBeInTheDocument();
  });

  it('allows selecting mood rating, adding feeling tags, and submitting check-in', async () => {
    mockOnSave.mockResolvedValueOnce();

    render(
      <MoodEntryModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    // 1. Select Mood 5 (Excellent)
    const excellentBtn = screen.getByText('Excellent').closest('button');
    fireEvent.click(excellentBtn);

    // 2. Select Feeling Tag
    const happyTag = screen.getByRole('button', { name: '#happy' });
    fireEvent.click(happyTag);

    // 3. Add Custom Feeling Tag
    const customInput = screen.getByPlaceholderText(/add custom feeling tag/i);
    fireEvent.change(customInput, { target: { value: 'proud' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    // 4. Fill Reflection Note
    const reflectionInput = screen.getByPlaceholderText(/what went well today/i);
    fireEvent.change(reflectionInput, { target: { value: 'Accomplished all sprint goals!' } });

    // 5. Submit Form
    const submitBtn = screen.getByRole('button', { name: /save check-in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });

    const [payload, isEditing] = mockOnSave.mock.calls[0];
    expect(payload.mood).toBe(5);
    expect(payload.reflection).toBe('Accomplished all sprint goals!');
    expect(payload.feelings).toContain('happy');
    expect(payload.feelings).toContain('proud');
    expect(isEditing).toBe(false);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('pre-populates existing entry fields in edit mode and allows deletion', async () => {
    const existingEntry = {
      id: 'existing-entry-1',
      entryDate: '2026-03-08',
      mood: 2,
      sleepHours: 5.5,
      feelings: ['tired', 'stressed'],
      reflection: 'Tough workday with sleepless night.'
    };

    // Mock confirm dialog
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockOnDelete.mockResolvedValueOnce();

    render(
      <MoodEntryModal
        isOpen={true}
        existingEntry={existingEntry}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByRole('heading', { name: /edit mood check-in/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/what went well today/i)).toHaveValue('Tough workday with sleepless night.');

    // Delete button should be present in editing mode
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith('2026-03-08');
    });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
