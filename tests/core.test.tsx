import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// ─── Utility tests ────────────────────────────────────────────────────────────
import { scoreMentorAgainstFocusAreas, CURRENT_MENTOR_APPLICATION_VERSION, FOCUS_AREA_LABELS } from '../utils/mentorMatching';

describe('mentorMatching utilities', () => {
  it('exports a numeric version constant >= 2', () => {
    expect(typeof CURRENT_MENTOR_APPLICATION_VERSION).toBe('number');
    expect(CURRENT_MENTOR_APPLICATION_VERSION).toBeGreaterThanOrEqual(2);
  });

  it('FOCUS_AREA_LABELS is a non-empty array of strings', () => {
    expect(Array.isArray(FOCUS_AREA_LABELS)).toBe(true);
    expect(FOCUS_AREA_LABELS.length).toBeGreaterThan(0);
    FOCUS_AREA_LABELS.forEach(label => expect(typeof label).toBe('string'));
  });

  it('returns matchScore 0 for a mentor with no matching focus areas', () => {
    const result = scoreMentorAgainstFocusAreas({ id: 'mentor-1', mentorTags: [] }, ['tech']);
    expect(result.matchScore).toBe(0);
  });

  it('scores a mentor with matching tags higher than one without', () => {
    const mentor = { id: 'mentor-2', mentorTags: ['software-engineering'], mentorExpertise: 'software engineering' };
    const noMatch = { id: 'mentor-3', mentorTags: ['cooking'] };
    const desiredAreas = ['Software Engineering'];
    const scoreA = scoreMentorAgainstFocusAreas(mentor, desiredAreas).matchScore;
    const scoreB = scoreMentorAgainstFocusAreas(noMatch, desiredAreas).matchScore;
    expect(scoreA).toBeGreaterThan(scoreB);
  });
});

// ─── Component smoke tests ────────────────────────────────────────────────────
import LoadingSpinner from '../components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    render(<LoadingSpinner />);
  });
});

import NotificationBell from '../components/NotificationBell';

describe('NotificationBell', () => {
  it('shows badge count when notifications are present', () => {
    const notifications = [{ id: '1', message: 'Test notification' }];
    render(<NotificationBell notifications={notifications} />);
    expect(screen.getByRole('button', { name: /1 notification/i })).toBeInTheDocument();
  });

  it('renders with empty notifications', () => {
    render(<NotificationBell notifications={[]} />);
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
  });
});

// ─── formatters ───────────────────────────────────────────────────────────────
import { formatRole, formatDate } from '../utils/formatters';

describe('formatters', () => {
  it('formatRole capitalises role words', () => {
    expect(formatRole('super_admin')).toBe('Super Admin');
    expect(formatRole('student')).toBe('Student');
  });

  it('formatDate returns N/A for null', () => {
    expect(formatDate(null)).toBe('N/A');
  });

  it('formatDate returns a date string for a JS Date', () => {
    const result = formatDate(new Date(2024, 0, 15)); // Local date constructor avoids timezone issues
    expect(typeof result).toBe('string');
    expect(result).not.toBe('N/A');
    expect(result).not.toBe('Invalid Date');
  });
});

