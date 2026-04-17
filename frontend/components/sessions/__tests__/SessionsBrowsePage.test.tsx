/**
 * Unit tests for SessionsBrowsePage component
 * 
 * Coverage:
 * - Professional-specific vs global browse mode
 * - Search filtering
 * - Category filtering
 * - Date filtering
 * - Combined filters
 * - Empty states
 * - Loading states
 * - Navigation to session details
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SessionsBrowsePage from '../SessionsBrowsePage';
import * as sessionsApi from '@/lib/api/sessions';

vi.mock('@/lib/api/sessions');
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockSessions: sessionsApi.ProfessionalSession[] = [
  {
    id: 1,
    class_title: "Morning Yoga Flow",
    class_category: "mind",
    session_date: "2026-04-20",
    start_time: "07:00:00",
    duration_minutes: 60,
    capacity: 15,
    enrolled_count: 8,
    price: 499.00,
    location_type: "in_person",
  },
  {
    id: 2,
    class_title: "HIIT Workout",
    class_category: "body",
    session_date: "2026-04-20",
    start_time: "18:00:00",
    duration_minutes: 45,
    capacity: 20,
    enrolled_count: 20,
    price: 599.00,
    location_type: "online",
  },
  {
    id: 3,
    class_title: "Nutrition Workshop",
    class_category: "nutrition",
    session_date: "2026-04-25",
    start_time: "14:00:00",
    duration_minutes: 90,
    capacity: 30,
    enrolled_count: 5,
    price: 799.00,
    location_type: "hybrid",
  },
  {
    id: 4,
    class_title: "Mindfulness Meditation",
    class_category: "mind",
    session_date: "2026-05-01",
    start_time: "08:00:00",
    duration_minutes: 30,
    capacity: 10,
    enrolled_count: 7,
    price: 299.00,
    location_type: "online",
  },
];

describe('SessionsBrowsePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ════════════════════════════════════════════════════════════════════════
  // LOADING & BASIC RENDERING
  // ════════════════════════════════════════════════════════════════════════

  it('shows loading state initially', () => {
    vi.mocked(sessionsApi.getProfessionalSessions).mockImplementation(
      () => new Promise(() => {})
    );

    render(<SessionsBrowsePage professionalUsername="janesmith" />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays all sessions when loaded', async () => {
    vi.mocked(sessionsApi.getProfessionalSessions).mockResolvedValue(mockSessions);

    render(<SessionsBrowsePage professionalUsername="janesmith" professionalName="Jane Smith" />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
      expect(screen.getByText('HIIT Workout')).toBeInTheDocument();
      expect(screen.getByText('Nutrition Workshop')).toBeInTheDocument();
      expect(screen.getByText('Mindfulness Meditation')).toBeInTheDocument();
    });
  });

  it('fetches professional sessions when username provided', async () => {
    vi.mocked(sessionsApi.getProfessionalSessions).mockResolvedValue(mockSessions);

    render(<SessionsBrowsePage professionalUsername="janesmith" />);

    await waitFor(() => {
      expect(sessionsApi.getProfessionalSessions).toHaveBeenCalledWith('janesmith');
    });
  });

  it('fetches all published sessions when no username provided', async () => {
    vi.mocked(sessionsApi.getAllPublishedSessions).mockResolvedValue(mockSessions);

    render(<SessionsBrowsePage />);

    await waitFor(() => {
      expect(sessionsApi.getAllPublishedSessions).toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // SEARCH FILTERING
  // ════════════════════════════════════════════════════════════════════════

  it('filters sessions by search query (title match)', async () => {
    vi.mocked(sessionsApi.getProfessionalSessions).mockResolvedValue(mockSessions);

    render(<SessionsBrowsePage professionalUsername="janesmith" />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search sessions/i);
    fireEvent.change(searchInput, { target: { value: 'yoga' } });

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
      expect(screen.queryByText('HIIT Workout')).not.toBeInTheDocument();
      expect(screen.queryByText('Nutrition Workshop')).not.toBeInTheDocument();
    });
  });

  it('filters sessions by search query (category match)', async () => {
    vi.mocked(sessionsApi.getProfessionalSessions).mockResolvedValue(mockSessions);

    render(<SessionsBrowsePage professionalUsername="janesmith" />);

    await waitFor(() => {
      expect(screen.getByText('HIIT Workout')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search sessions/i);
    fireEvent.change(searchInput, { target: { value: 'body' } });

    await waitFor(() => {
      expect(screen.getByText('HIIT Workout')).toBeInTheDocument();
      expect(screen.queryByText('Morning Yoga Flow')).not.toBeInTheDocument();
    });
  });

  it('search is case-insensitive', async () => {
    vi.mocked(sessionsApi.getProfessionalSessions).mockResolvedValue(mockSessions);

    render(<SessionsBrowsePage professionalUsername="janesmith" />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search sessions/i);
    fireEvent.change(searchInput, { target: { value: 'YOGA' } });

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // CATEGORY FILTERING
  // ════════════════════════════════════════════════════════════════════════

  it('filters sessions by category', async () => {
    vi.mocked(sessionsApi.getProfessionalSessions).mockResolvedValue(mockSessions);

    render(<SessionsBrowsePage professionalUsername="janesmith" />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
    });

    // Select "Mind" category
    const categorySelect = screen.getByLabelText(/category/i);
    fireEvent.change(categorySelect, { target: { value: 'mind' } });

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
      expect(screen.getByText('Mindfulness Meditation')).toBeInTheDocument();
      expect(screen.queryByText('HIIT Workout')).not.toBeInTheDocument();
      expect(screen.queryByText('Nutrition Workshop')).not.toBeInTheDocument();
    });
  });

  it('shows all sessions when "All" category selected', async () => {
    vi.mocked(sessionsApi.getProfessionalSessions).mockResolvedValue(mockSessions);

    render(<SessionsBrowsePage professionalUsername="janesmith" />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
    });

    const categorySelect = screen.getByLabelText(/category/i);
    
    // First filter by category
    fireEvent.change(categorySelect, { target: { value: 'mind' } });
    await waitFor(() => {
      expect(screen.queryByText('HIIT Workout')).not.toBeInTheDocument();
    });

    // Then select "All"
    fireEvent.change(categorySelect, { target: { value: 'all' } });
    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
      expect(screen.getByText('HIIT Workout')).toBeInTheDocument();
      expect(screen.getByText('Nutrition Workshop')).toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // DATE FILTERING
  // ════════════════════════════════════════════════════════════════════════

  it('filters sessions by "Today"', async () => {
    const todaySessions = [
      {
        ...mockSessions[0],
        session_date: new Date().toISOString().split('T')[0], // Today
      },
      {
        ...mockSessions[1],
        id: 5,
        class_title: "Evening Yoga",
        session_date: new Date().toISOString().split('T')[0],
      },
    ];

    vi.mocked(sessionsApi.getProfessionalSessions).mockResolvedValue([
      ...todaySessions,
      mockSessions[2], // Future session
    ]);

    render(<SessionsBrowsePage professionalUsername="janesmith" />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
    });

    const dateSelect = screen.getByLabelText(/date/i);
    fireEvent.change(dateSelect, { target: { value: 'today' } });

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
      expect(screen.getByText('Evening Yoga')).toBeInTheDocument();
      expect(screen.queryByText('Nutrition Workshop')).not.toBeInTheDocument();
    });
  });

  it('filters sessions by "This Week"', async () => {
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 5);
    const monthFromNow = new Date(today);
    monthFromNow.setDate(today.getDate() + 20);

    const sessions = [
      { ...mockSessions[0], session_date: weekFromNow.toISOString().split('T')[0] },
      { ...mockSessions[1], session_date: monthFromNow.toISOString().split('T')[0] },
    ];

    vi.mocked(sessionsApi.getProfessionalSessions).mockResolvedValue(sessions);

    render(<SessionsBrowsePage professionalUsername="janesmith" />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
    });

    const dateSelect = screen.getByLabelText(/date/i);
    fireEvent.change(dateSelect, { target: { value: 'week' } });

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
      expect(screen.queryByText('HIIT Workout')).not.toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // COMBINED FILTERS
  // ════════════════════════════════════════════════════════════════════════

  it('applies multiple filters simultaneously', async () => {
    vi.mocked(sessionsApi.getProfessionalSessions).mockResolvedValue(mockSessions);

    render(<SessionsBrowsePage professionalUsername="janesmith" />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
    });

    // Apply search + category filter
    const searchInput = screen.getByPlaceholderText(/search sessions/i);
    const categorySelect = screen.getByLabelText(/category/i);

    fireEvent.change(searchInput, { target: { value: 'mind' } });
    fireEvent.change(categorySelect, { target: { value: 'mind' } });

    await waitFor(() => {
      // Should show only "mind" category sessions containing "mind"
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
      expect(screen.getByText('Mindfulness Meditation')).toBeInTheDocument();
      expect(screen.queryByText('HIIT Workout')).not.toBeInTheDocument();
      expect(screen.queryByText('Nutrition Workshop')).not.toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // EMPTY STATES
  // ════════════════════════════════════════════════════════════════════════

  it('shows empty state when no sessions found', async () => {
    vi.mocked(sessionsApi.getProfessionalSessions).mockResolvedValue([]);

    render(<SessionsBrowsePage professionalUsername="janesmith" professionalName="Jane Smith" />);

    await waitFor(() => {
      expect(screen.getByText(/no sessions available/i)).toBeInTheDocument();
    });
  });

  it('shows "no results" when filters return empty', async () => {
    vi.mocked(sessionsApi.getProfessionalSessions).mockResolvedValue(mockSessions);

    render(<SessionsBrowsePage professionalUsername="janesmith" />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search sessions/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent session' } });

    await waitFor(() => {
      expect(screen.getByText(/no sessions match/i)).toBeInTheDocument();
    });
  });

  it('shows "Clear Filters" button when filters applied and no results', async () => {
    vi.mocked(sessionsApi.getProfessionalSessions).mockResolvedValue(mockSessions);

    render(<SessionsBrowsePage professionalUsername="janesmith" />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search sessions/i);
    fireEvent.change(searchInput, { target: { value: 'xyz123' } });

    await waitFor(() => {
      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      expect(clearButton).toBeInTheDocument();
    });
  });

  it('clears all filters when "Clear Filters" clicked', async () => {
    vi.mocked(sessionsApi.getProfessionalSessions).mockResolvedValue(mockSessions);

    render(<SessionsBrowsePage professionalUsername="janesmith" />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
    });

    // Apply filters
    const searchInput = screen.getByPlaceholderText(/search sessions/i);
    const categorySelect = screen.getByLabelText(/category/i);
    
    fireEvent.change(searchInput, { target: { value: 'xyz' } });
    fireEvent.change(categorySelect, { target: { value: 'nutrition' } });

    await waitFor(() => {
      expect(screen.getByText(/no sessions match/i)).toBeInTheDocument();
    });

    // Clear filters
    const clearButton = screen.getByRole('button', { name: /clear filters/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
      expect(screen.getByText('HIIT Workout')).toBeInTheDocument();
      expect(searchInput).toHaveValue('');
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // NAVIGATION
  // ════════════════════════════════════════════════════════════════════════

  it('navigates to session details when card clicked', async () => {
    const mockPush = vi.fn();
    vi.mocked(sessionsApi.getProfessionalSessions).mockResolvedValue(mockSessions);

    const { useRouter } = await import('next/navigation');
    (useRouter as any).mockReturnValue({ push: mockPush });

    render(<SessionsBrowsePage professionalUsername="janesmith" />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
    });

    const sessionCard = screen.getByText('Morning Yoga Flow').closest('div[role="button"]');
    if (sessionCard) {
      fireEvent.click(sessionCard);
      expect(mockPush).toHaveBeenCalledWith('/sessions/1');
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  // CAPACITY INDICATORS
  // ════════════════════════════════════════════════════════════════════════

  it('displays "Sold Out" badge for full sessions', async () => {
    vi.mocked(sessionsApi.getProfessionalSessions).mockResolvedValue(mockSessions);

    render(<SessionsBrowsePage professionalUsername="janesmith" />);

    await waitFor(() => {
      // HIIT Workout has enrolled_count = 20, capacity = 20
      expect(screen.getByText('HIIT Workout')).toBeInTheDocument();
      
      // Find the "Sold Out" badge associated with HIIT Workout
      const soldOutBadges = screen.getAllByText(/sold out/i);
      expect(soldOutBadges.length).toBeGreaterThan(0);
    });
  });

  it('shows availability count for sessions with spots left', async () => {
    vi.mocked(sessionsApi.getProfessionalSessions).mockResolvedValue(mockSessions);

    render(<SessionsBrowsePage professionalUsername="janesmith" />);

    await waitFor(() => {
      // Nutrition Workshop: capacity 30, enrolled 5 = 25 spots left
      expect(screen.getByText(/25 spots left/i)).toBeInTheDocument();
    });
  });
});
