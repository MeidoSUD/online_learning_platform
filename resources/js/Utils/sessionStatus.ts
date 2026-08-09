export type SessionState = 'upcoming' | 'live' | 'finished';

export interface SessionLike {
    session_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    status?: string | null;
}

function extractDatePart(value: unknown): string {
    const matched = String(value ?? '').match(/\d{4}-\d{2}-\d{2}/);
    return matched ? matched[0] : '';
}

function extractTimePart(value: unknown): string {
    const matched = String(value ?? '').match(/\d{2}:\d{2}(?::\d{2})?/);
    return matched ? matched[0] : '';
}

function buildDate(session: SessionLike, key: 'start_time' | 'end_time'): Date | null {
    const date = extractDatePart(session.session_date);
    const time = extractTimePart(session[key]);
    if (!date || !time) return null;
    const dt = new Date(`${date}T${time}`);
    return isNaN(dt.getTime()) ? null : dt;
}

// Mirrors Android DateTimeHelper.getSessionStatus parsing (session date + time)
export function getSessionStart(session: SessionLike): Date | null {
    return buildDate(session, 'start_time');
}

export function getSessionEnd(session: SessionLike): Date | null {
    const end = buildDate(session, 'end_time');
    if (!end) return null;
    const start = getSessionStart(session);
    // Handle overnight sessions (end before start means it wraps past midnight)
    if (start && end.getTime() <= start.getTime()) {
        end.setDate(end.getDate() + 1);
    }
    return end;
}

// Mirrors Android DateTimeHelper.getSessionStatus(startBufferMinutes: 15)
export function getSessionState(
    session: SessionLike,
    startBufferMinutes = 15
): SessionState {
    const start = getSessionStart(session);
    const end = getSessionEnd(session);
    if (!start || !end) return 'upcoming';

    const now = new Date().getTime();

    if (now < start.getTime() - startBufferMinutes * 60 * 1000) {
        return 'upcoming';
    }

    if (now > end.getTime()) {
        return 'finished';
    }

    return 'live';
}

// Mirrors Android DateTimeHelper.getStatusFromApi
export function getStateFromStatus(status?: string | null): SessionState {
    const s = (status || '').toLowerCase();
    if (s === 'live' || s === 'wait_for_teacher') return 'live';
    if (['ended', 'completed', 'finished', 'cancelled'].includes(s)) {
        return 'finished';
    }
    return 'upcoming';
}