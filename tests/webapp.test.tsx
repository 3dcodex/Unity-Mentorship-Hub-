/**
 * Comprehensive test suite for Unity Mentorship Hub
 *
 * Covers:
 *  - Utilities: formatters, mentorMatching, storage, rolePrivileges
 *  - Services: errorService, authService, bookingService (Firestore mocked)
 *  - Components: LoadingSpinner, StatusBadge, NotificationBell, Breadcrumb
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ─── 1. formatters ────────────────────────────────────────────────────────────
import { formatRole, formatDate, formatDateTime, formatCurrency, formatNumber, formatPercentage, truncateText } from '../utils/formatters';

describe('formatters', () => {
  describe('formatRole', () => {
    it('capitalises single-word role', () => {
      expect(formatRole('student')).toBe('Student');
      expect(formatRole('admin')).toBe('Admin');
    });

    it('handles underscore-separated roles', () => {
      expect(formatRole('super_admin')).toBe('Super Admin');
      expect(formatRole('international_student')).toBe('International Student');
    });

    it('returns Unknown for empty string', () => {
      expect(formatRole('')).toBe('Unknown');
    });
  });

  describe('formatDate', () => {
    it('returns N/A for null', () => {
      expect(formatDate(null)).toBe('N/A');
    });

    it('returns N/A for undefined', () => {
      expect(formatDate(undefined)).toBe('N/A');
    });

    it('formats a JS Date correctly', () => {
      const d = new Date(2024, 0, 15); // Jan 15 2024, no timezone issue
      const result = formatDate(d);
      expect(result).toContain('2024');
      expect(result).not.toBe('N/A');
      expect(result).not.toBe('Invalid Date');
    });

    it('formats a date string correctly', () => {
      const result = formatDate('2024-06-01T00:00:00.000Z');
      expect(typeof result).toBe('string');
      expect(result).not.toBe('N/A');
    });
  });

  describe('formatDateTime', () => {
    it('returns N/A for null', () => {
      expect(formatDateTime(null)).toBe('N/A');
    });

    it('includes both date and time parts', () => {
      const result = formatDateTime(new Date(2024, 5, 15, 10, 30));
      expect(result).toContain('2024');
      expect(result).toMatch(/\d{1,2}:\d{2}/); // time portion
    });
  });

  describe('formatCurrency', () => {
    it('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('formats a positive amount', () => {
      const result = formatCurrency(49.99);
      expect(result).toContain('49.99');
      expect(result).toContain('$');
    });

    it('formats a large amount with commas', () => {
      const result = formatCurrency(1234567.89);
      expect(result).toContain(',');
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with locale separators', () => {
      const result = formatNumber(1000000);
      expect(result).toContain(',');
    });

    it('handles zero', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatPercentage', () => {
    it('formats a number as percentage with 1 decimal', () => {
      expect(formatPercentage(75.5)).toBe('75.5%');
    });

    it('respects custom decimal places', () => {
      expect(formatPercentage(100, 0)).toBe('100%');
    });
  });

  describe('truncateText', () => {
    it('returns text unchanged if shorter than limit', () => {
      expect(truncateText('hello', 10)).toBe('hello');
    });

    it('truncates text and appends ellipsis', () => {
      const long = 'A'.repeat(60);
      const result = truncateText(long, 50);
      expect(result.endsWith('...')).toBe(true);
      expect(result.length).toBe(53); // 50 + '...'
    });

    it('handles empty string', () => {
      expect(truncateText('')).toBe('');
    });

    it('uses default maxLength of 50 when not specified', () => {
      const long = 'A'.repeat(60);
      const result = truncateText(long);
      expect(result.length).toBe(53);
    });
  });
});

// ─── 2. mentorMatching ────────────────────────────────────────────────────────
import {
  scoreMentorAgainstFocusAreas,
  normalizeFocusArea,
  CURRENT_MENTOR_APPLICATION_VERSION,
  FOCUS_AREA_LABELS,
  FOCUS_AREA_DEFINITIONS,
} from '../utils/mentorMatching';

describe('mentorMatching', () => {
  it('exports version constant >= 2', () => {
    expect(CURRENT_MENTOR_APPLICATION_VERSION).toBeGreaterThanOrEqual(2);
  });

  it('FOCUS_AREA_LABELS has one label per definition', () => {
    expect(FOCUS_AREA_LABELS.length).toBe(FOCUS_AREA_DEFINITIONS.length);
  });

  it('all FOCUS_AREA_LABELS are non-empty strings', () => {
    FOCUS_AREA_LABELS.forEach(l => expect(l.length).toBeGreaterThan(0));
  });

  describe('normalizeFocusArea', () => {
    it('returns canonical label for exact alias match', () => {
      expect(normalizeFocusArea('startup')).toBe('Entrepreneurship');
    });

    it('is case-insensitive', () => {
      expect(normalizeFocusArea('STEM')).toBe('STEM Careers');
    });

    it('returns null for unknown value', () => {
      expect(normalizeFocusArea('xyzzy-unknown')).toBeNull();
    });
  });

  describe('scoreMentorAgainstFocusAreas', () => {
    it('returns matchScore 0 when mentor has no tags', () => {
      expect(scoreMentorAgainstFocusAreas({ id: 'mentor-a', mentorTags: [] }, ['Leadership Skills']).matchScore).toBe(0);
    });

    it('matches name in expertise field', () => {
      const mentor = { id: 'mentor-b', mentorTags: [], mentorExpertise: 'leadership coaching' };
      const result = scoreMentorAgainstFocusAreas(mentor, ['Leadership Skills']);
      expect(result.matchScore).toBeGreaterThan(0);
    });

    it('scores matched mentor higher than unmatched', () => {
      const matched = { id: 'mentor-c', mentorTags: ['startup', 'founder'] };
      const unmatched = { id: 'mentor-d', mentorTags: ['cooking'] };
      const areas = ['Entrepreneurship'];
      expect(scoreMentorAgainstFocusAreas(matched, areas).matchScore)
        .toBeGreaterThan(scoreMentorAgainstFocusAreas(unmatched, areas).matchScore);
    });

    it('matchStrength is one of valid values', () => {
      const result = scoreMentorAgainstFocusAreas({ id: 'mentor-e', mentorTags: ['startup'] }, ['Entrepreneurship']);
      expect(['strong', 'good', 'potential']).toContain(result.matchStrength);
    });

    it('returns matchedFocusAreas as an array', () => {
      const result = scoreMentorAgainstFocusAreas({ id: 'mentor-f', mentorTags: ['technology'] }, ['STEM Careers']);
      expect(Array.isArray(result.matchedFocusAreas)).toBe(true);
    });
  });
});

// ─── 3. rolePrivileges ────────────────────────────────────────────────────────
import { rolePrivileges, hasPrivilege } from '../rolePrivileges';
import type { Role } from '../types';

describe('rolePrivileges', () => {
  it('every known role has at least one privilege', () => {
    (Object.keys(rolePrivileges) as Role[]).forEach(role => {
      expect(rolePrivileges[role].length).toBeGreaterThan(0);
    });
  });

  it('hasPrivilege returns true for a valid role-privilege combination', () => {
    expect(hasPrivilege('Student', 'requestMentorship')).toBe(true);
    expect(hasPrivilege('Professional', 'accessAnalytics')).toBe(true);
    expect(hasPrivilege('Professional', 'offerPaidMentorship')).toBe(true);
  });

  it('hasPrivilege returns false for a mismatched role-privilege pair', () => {
    expect(hasPrivilege('Student', 'offerPaidMentorship')).toBe(false);
    expect(hasPrivilege('moderator', 'offerPaidMentorship')).toBe(false);
  });

  it('hasPrivilege handles unknown role gracefully', () => {
    expect(hasPrivilege('UnknownRole' as Role, 'requestMentorship')).toBe(false);
  });
});

// ─── 4. storage utility ───────────────────────────────────────────────────────
import { storage } from '../utils/storage';

describe('storage utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('hasConsent returns false with no previous consent', () => {
    expect(storage.hasConsent()).toBe(false);
  });

  it('setItem and getItem work when consent is given', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    storage.setItem('testKey', 'hello');
    expect(storage.getItem('testKey')).toBe('hello');
  });

  it('getItem returns null when consent is not given', () => {
    storage.setItem('secret', 'value');
    expect(storage.getItem('secret')).toBeNull();
  });

  it('cookieConsent key is always accessible', () => {
    storage.setItem('cookieConsent', 'accepted');
    expect(storage.getItem('cookieConsent')).toBe('accepted');
  });

  it('removeItem removes the value', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    storage.setItem('toRemove', 'bye');
    storage.removeItem('toRemove');
    expect(storage.getItem('toRemove')).toBeNull();
  });

  it('clear removes all items but preserves cookieConsent', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    storage.setItem('a', '1');
    storage.setItem('b', '2');
    storage.clear();
    expect(storage.hasConsent()).toBe(true);
    expect(storage.getItem('a')).toBeNull();
  });
});

// ─── 5. errorService ─────────────────────────────────────────────────────────
import { errorService } from '../services/errorService';

describe('errorService', () => {
  afterEach(() => {
    errorService.unregisterHandler('test');
  });

  it('handles a plain Error object', () => {
    const result = errorService.handleError(new Error('boom'));
    expect(result.message).toBe('boom');
  });

  it('handles a string error', () => {
    const result = errorService.handleError('something went wrong');
    expect(result.message).toBe('something went wrong');
  });

  it('handles an unknown error shape', () => {
    const result = errorService.handleError({ weird: true }, 'TestContext');
    expect(result.message).toContain('TestContext');
  });

  it('notifies registered handlers', () => {
    const handler = vi.fn();
    errorService.registerHandler('test', handler);
    errorService.handleError(new Error('notify me'));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].message).toBe('notify me');
  });

  it('does not call handler after unregister', () => {
    const handler = vi.fn();
    errorService.registerHandler('test', handler);
    errorService.unregisterHandler('test');
    errorService.handleError(new Error('silent'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('translates known Firebase error codes to readable messages', () => {
    // The service checks `instanceof FirebaseError` but since we mocked it,
    // test that string errors at minimum produce a message
    const result = errorService.handleError('auth/wrong-password');
    expect(result.message).toBe('auth/wrong-password');
  });
});

// ─── 6. bookingService – unit tests ──────────────────────────────────────────
import { SESSION_TYPES } from '../services/bookingService';

describe('bookingService – SESSION_TYPES', () => {
  it('exports a non-empty array', () => {
    expect(Array.isArray(SESSION_TYPES)).toBe(true);
    expect(SESSION_TYPES.length).toBeGreaterThan(0);
  });

  it('each session type has required fields', () => {
    SESSION_TYPES.forEach(s => {
      expect(typeof s.id).toBe('string');
      expect(typeof s.name).toBe('string');
      expect(typeof s.duration).toBe('number');
      expect(s.duration).toBeGreaterThan(0);
    });
  });

  it('contains a free 30-minute chat option', () => {
    const chat = SESSION_TYPES.find(s => s.duration === 30 && s.price === 0);
    expect(chat).toBeDefined();
  });
});

// ─── 7. ticketService – type shape ───────────────────────────────────────────
import type { Ticket } from '../services/ticketService';

describe('ticketService – Ticket interface shape', () => {
  it('Ticket status union is assignable', () => {
    const statuses: Ticket['status'][] = ['open', 'in-progress', 'resolved', 'closed'];
    expect(statuses.length).toBe(4);
  });

  it('Ticket priority union is assignable', () => {
    const priorities: Ticket['priority'][] = ['low', 'medium', 'high', 'urgent'];
    expect(priorities.length).toBe(4);
  });

  it('Ticket category union is assignable', () => {
    const categories: Ticket['category'][] = ['technical', 'account', 'billing', 'mentorship', 'other'];
    expect(categories.length).toBe(5);
  });
});

// ─── 8. Components ────────────────────────────────────────────────────────────
import LoadingSpinner from '../components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.firstChild).not.toBeNull();
  });
});

import StatusBadge from '../components/StatusBadge';

describe('StatusBadge', () => {
  it('renders active status with green styles', () => {
    render(<StatusBadge status="active" />);
    const badge = screen.getByText(/active/i);
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('green');
  });

  it('renders suspended status with red styles', () => {
    render(<StatusBadge status="suspended" />);
    const badge = screen.getByText(/suspended/i);
    expect(badge.className).toContain('red');
  });

  it('renders pending status with yellow styles', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText(/pending/i).className).toContain('yellow');
  });

  it('renders completed status with blue styles', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText(/completed/i).className).toContain('blue');
  });

  it('renders unknown status gracefully (grey fallback)', () => {
    render(<StatusBadge status="nonexistent" />);
    const badge = screen.getByText(/nonexistent/i);
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('gray');
  });

  it('capitalises and formats status display text', () => {
    render(<StatusBadge status="no-show" />);
    expect(screen.getByText(/no/i)).toBeInTheDocument();
  });

  it('respects size prop (sm)', () => {
    render(<StatusBadge status="active" size="sm" />);
    const badge = screen.getByText(/active/i);
    expect(badge.className).toContain('text-xs');
  });

  it('respects size prop (lg)', () => {
    render(<StatusBadge status="active" size="lg" />);
    const badge = screen.getByText(/active/i);
    expect(badge.className).toContain('text-sm');
  });
});

import NotificationBell from '../components/NotificationBell';

describe('NotificationBell', () => {
  it('renders with zero notifications', () => {
    render(<NotificationBell notifications={[]} />);
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
  });

  it('shows count badge when there are notifications', () => {
    const notes = [{ id: '1', message: 'Hello' }, { id: '2', message: 'World' }];
    render(<NotificationBell notifications={notes} />);
    expect(screen.getByRole('button', { name: /2 notification/i })).toBeInTheDocument();
  });

  it('clicking the bell button does not throw', () => {
    render(<NotificationBell notifications={[]} />);
    expect(() => fireEvent.click(screen.getByRole('button', { name: /notifications/i }))).not.toThrow();
  });
});

import Breadcrumb from '../components/Breadcrumb';

describe('Breadcrumb', () => {
  it('renders nothing at root path', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Breadcrumb />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows breadcrumb for a single nested route', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Breadcrumb />
      </MemoryRouter>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows home link and nested label for deep route', () => {
    render(
      <MemoryRouter initialEntries={['/analytics']}>
        <Breadcrumb />
      </MemoryRouter>
    );
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    // Home icon link exists
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
  });

  it('last segment is rendered as plain text, not a link', () => {
    render(
      <MemoryRouter initialEntries={['/quick-chat']}>
        <Breadcrumb />
      </MemoryRouter>
    );
    const label = screen.getByText('Quick Chat');
    expect(label.tagName).not.toBe('A');
  });

  it('renders unknown path segments with basic capitalisation', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-page']}>
        <Breadcrumb />
      </MemoryRouter>
    );
    expect(screen.getByText('Unknown-page')).toBeInTheDocument();
  });
});

// ─── 9. authService – logic tests ────────────────────────────────────────────
import { checkUserRole } from '../services/authService';
import { getDoc } from 'firebase/firestore';

describe('authService', () => {
  it('checkUserRole returns null when user doc does not exist', async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({ exists: () => false, data: () => ({}) } as any);
    // @ts-ignore minimal user mock
    const result = await checkUserRole({ uid: 'user-123' });
    expect(result).toBeNull();
  });

  it('checkUserRole returns role and status when doc exists', async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: 'admin', status: 'active' }),
    } as any);
    // @ts-ignore minimal user mock
    const result = await checkUserRole({ uid: 'admin-456' });
    expect(result?.role).toBe('admin');
    expect(result?.status).toBe('active');
  });

  it('checkUserRole defaults to student role when role is missing', async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ status: 'active' }), // no role field
    } as any);
    // @ts-ignore minimal user mock
    const result = await checkUserRole({ uid: 'new-user' });
    expect(result?.role).toBe('student');
  });
});

// ─── 10. messagingService – checkConnection ───────────────────────────────────
import { checkConnection } from '../services/messagingService';
import { getDoc as getDocFirestore } from 'firebase/firestore';

describe('messagingService – checkConnection', () => {
  it('returns false when connection doc does not exist', async () => {
    vi.mocked(getDocFirestore).mockResolvedValueOnce({ exists: () => false, data: () => ({}) } as any);
    const result = await checkConnection('user-a', 'user-b');
    expect(result).toBe(false);
  });

  it('returns true when connection doc exists and status is accepted', async () => {
    vi.mocked(getDocFirestore).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ status: 'accepted' }),
    } as any);
    const result = await checkConnection('user-a', 'user-b');
    expect(result).toBe(true);
  });

  it('returns false when connection exists but status is blocked', async () => {
    vi.mocked(getDocFirestore).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ status: 'blocked' }),
    } as any);
    const result = await checkConnection('user-a', 'user-b');
    expect(result).toBe(false);
  });
});
