/**
 * Unit tests for MyEnrollmentsPage component
 * 
 * Coverage:
 * - Authentication guard
 * - Loading states
 * - Enrollment status tracking
 * - Payment status display
 * - Refund notices
 * - Time filtering (All, Upcoming, Past)
 * - Status filtering
 * - Empty states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MyEnrollmentsPage from '../MyEnrollmentsPage';
import * as sessionsApi from '@/lib/api/sessions';
import * as authHooks from '@/hooks/useAuthSession';

vi.mock('@/lib/api/sessions');
vi.mock('@/hooks/useAuthSession');
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockEnrollments: sessionsApi.UserEnrollment[] = [
  {
    id: 1,
    session_id: 101,
    class_title: "Morning Yoga",
    class_category: "mind",
    session_date: "2026-04-25",
    start_time: "07:00:00",
    duration_minutes: 60,
    location_type: "in_person",
    professional_name: "Jane Smith",
    professional_username: "janesmith",
    status: "confirmed",
    enrolled_at: "2026-04-10T10:00:00Z",
    amount_paid: 499.00,
    payment_status: "paid",
    refund_amount: null,
  },
  {
    id: 2,
    session_id: 102,
    class_title: "HIIT Workout",
    class_category: "body",
    session_date: "2026-04-15",
    start_time: "18:00:00",
    duration_minutes: 45,
    location_type: "online",
    professional_name: "John Doe",
    professional_username: "johndoe",
    status: "attended",
    enrolled_at: "2026-04-08T14:00:00Z",
    amount_paid: 599.00,
    payment_status: "paid",
    refund_amount: null,
  },
  {
    id: 3,
    session_id: 103,
    class_title: "Nutrition Workshop",
    class_category: "nutrition",
    session_date: "2026-03-20",
    start_time: "14:00:00",
    duration_minutes: 90,
    location_type: "hybrid",
    professional_name: "Sarah Lee",
    professional_username: "sarahlee",
    status: "session_cancelled",
    enrolled_at: "2026-03-15T09:00:00Z",
    amount_paid: 799.00,
    payment_status: "refunded",
    refund_amount: 799.00,
  },
  {
    id: 4,
    session_id: 104,
    class_title: "Meditation Session",
    class_category: "mind",
    session_date: "2026-03-10",
    start_time: "08:00:00",
    duration_minutes: 30,
    location_type: "online",
    professional_name: "Jane Smith",
    professional_username: "janesmith",
    status: "no_show_client",
    enrolled_at: "2026-03-05T11:00:00Z",
    amount_paid: 299.00,
    payment_status: "paid",
    refund_amount: null,
  },
  {
    id: 5,
    session_id: 105,
    class_title: "Cancelled Pilates",
    class_category: "body",
    session_date: "2026-03-25",
    start_time: "10:00:00",
    duration_minutes: 60,
    location_type: "in_person",
    professional_name: "Mike Chen",
    professional_username: "mikechen",
    status: "cancelled",
    enrolled_at: "2026-03-20T16:00:00Z",
    amount_paid: 599.00,
    payment_status: "refunded",
    refund_amount: 599.00,
  },
];

describe('MyEnrollmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ════════════════════════════════════════════════════════════════════════
  // AUTHENTICATION GUARD
  // ════════════════════════════════════════════════════════════════════════

  it('redirects to login when user is not authenticated', async () => {
    const mockPush = vi.fn();
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: null,
      isLoading: false,
    } as any);

    const { useRouter } = await import('next/navigation');
    (useRouter as any).mockReturnValue({ push: mockPush });

    render(<MyEnrollmentsPage />);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/login?redirect=/dashboard/my-enrollments')
    );
  });

  it('does not redirect when user is authenticated', async () => {
    const mockPush = vi.fn();
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue(mockEnrollments);

    const { useRouter } = await import('next/navigation');
    (useRouter as any).mockReturnValue({ push: mockPush });

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // LOADING & BASIC RENDERING
  // ════════════════════════════════════════════════════════════════════════

  it('shows loading spinner while fetching enrollments', () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockImplementation(
      () => new Promise(() => {})
    );

    render(<MyEnrollmentsPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays all enrollments when loaded', async () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue(mockEnrollments);

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
      expect(screen.getByText('HIIT Workout')).toBeInTheDocument();
      expect(screen.getByText('Nutrition Workshop')).toBeInTheDocument();
      expect(screen.getByText('Meditation Session')).toBeInTheDocument();
      expect(screen.getByText('Cancelled Pilates')).toBeInTheDocument();
    });
  });

  it('calls getMyEnrollments with token', async () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token_123',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue([]);

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(sessionsApi.getMyEnrollments).toHaveBeenCalledWith('test_token_123');
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STATUS TRACKING
  // ════════════════════════════════════════════════════════════════════════

  it('displays correct status badge for "confirmed" enrollment', async () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue([mockEnrollments[0]]);

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
    });
  });

  it('displays correct status badge for "attended" enrollment', async () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue([mockEnrollments[1]]);

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Attended')).toBeInTheDocument();
    });
  });

  it('displays correct status badge for "session_cancelled" enrollment', async () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue([mockEnrollments[2]]);

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Session Cancelled')).toBeInTheDocument();
    });
  });

  it('displays correct status badge for "no_show_client" enrollment', async () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue([mockEnrollments[3]]);

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('No Show')).toBeInTheDocument();
    });
  });

  it('displays correct status badge for "cancelled" enrollment', async () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue([mockEnrollments[4]]);

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // PAYMENT STATUS & REFUND DISPLAY
  // ════════════════════════════════════════════════════════════════════════

  it('displays payment status "Paid" for paid enrollments', async () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue([mockEnrollments[0]]);

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Paid')).toBeInTheDocument();
    });
  });

  it('displays payment status "Refunded" for refunded enrollments', async () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue([mockEnrollments[2]]);

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Refunded')).toBeInTheDocument();
    });
  });

  it('displays refund notice for refunded enrollments', async () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue([mockEnrollments[2]]);

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText(/refund of ₹799.00 processed/i)).toBeInTheDocument();
    });
  });

  it('displays amount paid correctly', async () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue([mockEnrollments[0]]);

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('₹499.00')).toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // TIME FILTERING
  // ════════════════════════════════════════════════════════════════════════

  it('shows all enrollments by default', async () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue(mockEnrollments);

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
      expect(screen.getByText('Meditation Session')).toBeInTheDocument();
    });
  });

  it('filters to show only upcoming sessions', async () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue(mockEnrollments);

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
    });

    const timeFilter = screen.getByLabelText(/time/i);
    fireEvent.change(timeFilter, { target: { value: 'upcoming' } });

    await waitFor(() => {
      // Morning Yoga (2026-04-25) and HIIT Workout (2026-04-15) are upcoming
      expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
      // Past sessions should not appear
      expect(screen.queryByText('Meditation Session')).not.toBeInTheDocument();
    });
  });

  it('filters to show only past sessions', async () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue(mockEnrollments);

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
    });

    const timeFilter = screen.getByLabelText(/time/i);
    fireEvent.change(timeFilter, { target: { value: 'past' } });

    await waitFor(() => {
      // Past sessions (March dates)
      expect(screen.getByText('Nutrition Workshop')).toBeInTheDocument();
      expect(screen.getByText('Meditation Session')).toBeInTheDocument();
      // Future sessions should not appear
      expect(screen.queryByText('Morning Yoga')).not.toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STATUS FILTERING
  // ════════════════════════════════════════════════════════════════════════

  it('filters by specific status', async () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue(mockEnrollments);

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
    });

    const statusFilter = screen.getByLabelText(/status/i);
    fireEvent.change(statusFilter, { target: { value: 'attended' } });

    await waitFor(() => {
      // Only "attended" enrollment should show
      expect(screen.getByText('HIIT Workout')).toBeInTheDocument();
      expect(screen.queryByText('Morning Yoga')).not.toBeInTheDocument();
      expect(screen.queryByText('Meditation Session')).not.toBeInTheDocument();
    });
  });

  it('filters by "cancelled" status', async () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue(mockEnrollments);

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
    });

    const statusFilter = screen.getByLabelText(/status/i);
    fireEvent.change(statusFilter, { target: { value: 'cancelled' } });

    await waitFor(() => {
      expect(screen.getByText('Cancelled Pilates')).toBeInTheDocument();
      expect(screen.queryByText('Morning Yoga')).not.toBeInTheDocument();
    });
  });

  it('shows all statuses when "All Statuses" selected', async () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue(mockEnrollments);

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
    });

    const statusFilter = screen.getByLabelText(/status/i);
    
    // Filter to one status
    fireEvent.change(statusFilter, { target: { value: 'attended' } });
    await waitFor(() => {
      expect(screen.queryByText('Morning Yoga')).not.toBeInTheDocument();
    });

    // Reset to all
    fireEvent.change(statusFilter, { target: { value: 'all' } });
    await waitFor(() => {
      expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
      expect(screen.getByText('HIIT Workout')).toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // EMPTY STATES
  // ════════════════════════════════════════════════════════════════════════

  it('shows empty state when user has no enrollments', async () => {
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue([]);

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      expect(screen.getByText(/no enrollments yet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /browse sessions/i })).toBeInTheDocument();
    });
  });

  it('shows "Browse Sessions" CTA in empty state', async () => {
    const mockPush = vi.fn();
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue([]);

    const { useRouter } = await import('next/navigation');
    (useRouter as any).mockReturnValue({ push: mockPush });

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      const browseButton = screen.getByRole('button', { name: /browse sessions/i });
      fireEvent.click(browseButton);
      expect(mockPush).toHaveBeenCalledWith('/sessions');
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // PROFESSIONAL LINKS
  // ════════════════════════════════════════════════════════════════════════

  it('navigates to professional profile when name clicked', async () => {
    const mockPush = vi.fn();
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);
    vi.mocked(sessionsApi.getMyEnrollments).mockResolvedValue([mockEnrollments[0]]);

    const { useRouter } = await import('next/navigation');
    (useRouter as any).mockReturnValue({ push: mockPush });

    render(<MyEnrollmentsPage />);

    await waitFor(() => {
      const professionalLink = screen.getByText('Jane Smith');
      fireEvent.click(professionalLink);
      expect(mockPush).toHaveBeenCalledWith('/janesmith');
    });
  });
});
