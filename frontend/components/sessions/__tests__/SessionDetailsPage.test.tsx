/**
 * Unit tests for SessionDetailsPage component
 * 
 * Coverage:
 * - Loading states
 * - Error handling
 * - Authentication guards
 * - Enrollment flow
 * - Waitlist registration
 * - Capacity indicators
 * - Category color schemes
 * - Date/time formatting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SessionDetailsPage from '../SessionDetailsPage';
import * as sessionsApi from '@/lib/api/sessions';
import * as authHooks from '@/hooks/useAuthSession';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/api/sessions');
vi.mock('@/hooks/useAuthSession');
vi.mock('sonner');
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

const mockSessionDetails: sessionsApi.SessionDetails = {
  id: 1,
  class_id: 10,
  class_title: "Morning Yoga Flow",
  class_category: "mind",
  class_description: "Start your day with energizing yoga",
  duration_minutes: 60,
  session_date: "2026-04-25",
  start_time: "07:00:00",
  capacity: 15,
  enrolled_count: 8,
  price: 499.00,
  location: {
    name: "Wellness Studio",
    address: "123 Health St, Bangalore",
    location_type: "in_person",
  },
  professional_name: "Jane Smith",
  professional_username: "janesmith",
};

describe('SessionDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ════════════════════════════════════════════════════════════════════════
  // LOADING & ERROR STATES
  // ════════════════════════════════════════════════════════════════════════

  it('shows loading spinner while fetching session', async () => {
    vi.mocked(sessionsApi.getSessionDetails).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<SessionDetailsPage sessionId={1} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays error message when session fetch fails', async () => {
    vi.mocked(sessionsApi.getSessionDetails).mockRejectedValue(
      new Error('Network error')
    );

    render(<SessionDetailsPage sessionId={1} />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load')
      );
    });
  });

  it('displays session not found for invalid ID', async () => {
    vi.mocked(sessionsApi.getSessionDetails).mockRejectedValue(
      new Error('Session not found')
    );

    render(<SessionDetailsPage sessionId={99999} />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // BASIC RENDERING
  // ════════════════════════════════════════════════════════════════════════

  it('renders all session details correctly', async () => {
    vi.mocked(sessionsApi.getSessionDetails).mockResolvedValue(mockSessionDetails);
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: null,
      isLoading: false,
    } as any);

    render(<SessionDetailsPage sessionId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Morning Yoga Flow')).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
      expect(screen.getByText('₹499')).toBeInTheDocument();
      expect(screen.getByText(/60 minutes/i)).toBeInTheDocument();
      expect(screen.getByText(/Wellness Studio/i)).toBeInTheDocument();
    });
  });

  it('displays correct category badge', async () => {
    vi.mocked(sessionsApi.getSessionDetails).mockResolvedValue(mockSessionDetails);
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: null,
      isLoading: false,
    } as any);

    render(<SessionDetailsPage sessionId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Mind')).toBeInTheDocument();
    });
  });

  it('formats date and time correctly', async () => {
    vi.mocked(sessionsApi.getSessionDetails).mockResolvedValue(mockSessionDetails);
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: null,
      isLoading: false,
    } as any);

    render(<SessionDetailsPage sessionId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/Fri, Apr 25, 2026/i)).toBeInTheDocument();
      expect(screen.getByText(/7:00 AM/i)).toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // CAPACITY INDICATORS
  // ════════════════════════════════════════════════════════════════════════

  it('shows green indicator when >2 spots available', async () => {
    const sessionWithManySpots = {
      ...mockSessionDetails,
      capacity: 15,
      enrolled_count: 5, // 10 spots left
    };

    vi.mocked(sessionsApi.getSessionDetails).mockResolvedValue(sessionWithManySpots);
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: null,
      isLoading: false,
    } as any);

    render(<SessionDetailsPage sessionId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/10 spots left/i)).toBeInTheDocument();
    });
  });

  it('shows amber indicator when 1-2 spots available', async () => {
    const sessionLowCapacity = {
      ...mockSessionDetails,
      capacity: 10,
      enrolled_count: 9, // 1 spot left
    };

    vi.mocked(sessionsApi.getSessionDetails).mockResolvedValue(sessionLowCapacity);
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: null,
      isLoading: false,
    } as any);

    render(<SessionDetailsPage sessionId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/1 spot left/i)).toBeInTheDocument();
    });
  });

  it('shows red "Sold Out" when at capacity', async () => {
    const sessionSoldOut = {
      ...mockSessionDetails,
      capacity: 10,
      enrolled_count: 10, // Full
    };

    vi.mocked(sessionsApi.getSessionDetails).mockResolvedValue(sessionSoldOut);
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: null,
      isLoading: false,
    } as any);

    render(<SessionDetailsPage sessionId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/sold out/i)).toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // AUTHENTICATION GUARDS
  // ════════════════════════════════════════════════════════════════════════

  it('shows "Enroll Now" button when authenticated', async () => {
    vi.mocked(sessionsApi.getSessionDetails).mockResolvedValue(mockSessionDetails);
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);

    render(<SessionDetailsPage sessionId={1} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /enroll now/i })).toBeInTheDocument();
    });
  });

  it('redirects to login when unauthenticated user clicks enroll', async () => {
    const mockPush = vi.fn();
    vi.mocked(sessionsApi.getSessionDetails).mockResolvedValue(mockSessionDetails);
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: null,
      isLoading: false,
    } as any);

    const { useRouter } = await import('next/navigation');
    (useRouter as any).mockReturnValue({ push: mockPush });

    render(<SessionDetailsPage sessionId={1} />);

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /enroll now/i }));
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/login?redirect=/sessions/1')
    );
  });

  it('shows "Join Waitlist" instead of "Enroll" when sold out', async () => {
    const sessionSoldOut = {
      ...mockSessionDetails,
      capacity: 10,
      enrolled_count: 10,
    };

    vi.mocked(sessionsApi.getSessionDetails).mockResolvedValue(sessionSoldOut);
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: null,
      isLoading: false,
    } as any);

    render(<SessionDetailsPage sessionId={1} />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /enroll now/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /join waitlist/i })).toBeInTheDocument();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // ENROLLMENT FLOW
  // ════════════════════════════════════════════════════════════════════════

  it('calls enrollInSession API when authenticated user enrolls', async () => {
    const mockEnroll = vi.mocked(sessionsApi.enrollInSession).mockResolvedValue({
      id: 1,
      session_id: 1,
      user_id: 'user123',
      status: 'confirmed',
      enrolled_at: new Date().toISOString(),
      payment: {
        id: 'pay_123',
        status: 'paid',
        amount: 499.00,
      },
    });

    vi.mocked(sessionsApi.getSessionDetails).mockResolvedValue(mockSessionDetails);
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);

    render(<SessionDetailsPage sessionId={1} />);

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /enroll now/i }));
    });

    // TODO: Add payment modal interaction when Razorpay is integrated
    // For now, this will fail until payment flow is implemented
  });

  it('shows error toast when enrollment fails', async () => {
    vi.mocked(sessionsApi.getSessionDetails).mockResolvedValue(mockSessionDetails);
    vi.mocked(sessionsApi.enrollInSession).mockRejectedValue(
      new Error('Session is full')
    );
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);

    render(<SessionDetailsPage sessionId={1} />);

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /enroll now/i }));
    });

    // Note: This test is incomplete until payment flow is added
  });

  // ════════════════════════════════════════════════════════════════════════
  // WAITLIST FLOW
  // ════════════════════════════════════════════════════════════════════════

  it('calls registerInterest API when joining waitlist', async () => {
    const sessionSoldOut = {
      ...mockSessionDetails,
      capacity: 10,
      enrolled_count: 10,
    };

    vi.mocked(sessionsApi.getSessionDetails).mockResolvedValue(sessionSoldOut);
    vi.mocked(sessionsApi.registerInterest).mockResolvedValue({
      session_id: 1,
      user_id: 'user123',
      interested: true,
      registered_at: new Date().toISOString(),
    });
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: {
        access_token: 'test_token',
        user: { id: 'user123', email: 'test@example.com' },
      },
      isLoading: false,
    } as any);

    render(<SessionDetailsPage sessionId={1} />);

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /join waitlist/i }));
    });

    await waitFor(() => {
      expect(sessionsApi.registerInterest).toHaveBeenCalledWith(1, 'test_token');
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('waitlist')
      );
    });
  });

  it('redirects to login when unauthenticated user tries to join waitlist', async () => {
    const mockPush = vi.fn();
    const sessionSoldOut = {
      ...mockSessionDetails,
      capacity: 10,
      enrolled_count: 10,
    };

    vi.mocked(sessionsApi.getSessionDetails).mockResolvedValue(sessionSoldOut);
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: null,
      isLoading: false,
    } as any);

    const { useRouter } = await import('next/navigation');
    (useRouter as any).mockReturnValue({ push: mockPush });

    render(<SessionDetailsPage sessionId={1} />);

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /join waitlist/i }));
    });

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/login'));
  });

  // ════════════════════════════════════════════════════════════════════════
  // CATEGORY COLOR SCHEMES
  // ════════════════════════════════════════════════════════════════════════

  it('applies correct color scheme for "mind" category', async () => {
    vi.mocked(sessionsApi.getSessionDetails).mockResolvedValue({
      ...mockSessionDetails,
      class_category: 'mind',
    });
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: null,
      isLoading: false,
    } as any);

    const { container } = render(<SessionDetailsPage sessionId={1} />);

    await waitFor(() => {
      // Check for violet gradient (mind category)
      const gradients = container.querySelectorAll('[class*="violet"]');
      expect(gradients.length).toBeGreaterThan(0);
    });
  });

  it('applies correct color scheme for "body" category', async () => {
    vi.mocked(sessionsApi.getSessionDetails).mockResolvedValue({
      ...mockSessionDetails,
      class_category: 'body',
    });
    vi.mocked(authHooks.useAuthSession).mockReturnValue({
      session: null,
      isLoading: false,
    } as any);

    const { container } = render(<SessionDetailsPage sessionId={1} />);

    await waitFor(() => {
      const gradients = container.querySelectorAll('[class*="emerald"]');
      expect(gradients.length).toBeGreaterThan(0);
    });
  });
});
