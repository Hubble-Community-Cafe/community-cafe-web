/**
 * Typed builders for the public API's content types, for component tests in the apps
 * (`import { cafeEvent } from '@cafe/shared-web/testing'`). Each returns a complete, valid object;
 * pass only the fields a test cares about. Not part of the main entry, so no site bundles it.
 */
import type {
  Association, BarStatus, BoardMember, BoardTerm, CafeEvent, HoursOverride, Vacancy, WeeklyHours,
} from '../index'

export function cafeEvent(overrides: Partial<CafeEvent> = {}): CafeEvent {
  return {
    id: 1, bar: 'HUBBLE', title: 'Pub quiz', date: '2030-10-05', startTime: '20:00', price: null,
    description: null, imageId: null, imageUrl: null, imageAlt: null, subscribeLink: null, published: true,
    ...overrides,
  }
}

export function boardMember(overrides: Partial<BoardMember> = {}): BoardMember {
  return {
    id: 1, termId: 1, name: 'Robin Bestuur', role: 'President', photoId: null, photoUrl: null,
    photoAlt: null, sortOrder: 0, ...overrides,
  }
}

export function boardTerm(overrides: Partial<BoardTerm> = {}): BoardTerm {
  return {
    id: 1, label: 'Board 2026', type: 'EXECUTIVE', bar: null, current: true, sortOrder: 0,
    groupPhotoUrl: null, groupPhotoAlt: null, photoCredit: null, members: [boardMember()], ...overrides,
  }
}

export function association(overrides: Partial<Association> = {}): Association {
  return { id: 1, name: 'Inter Actief', logoId: null, logoUrl: null, logoAlt: null, bar: 'HUBBLE', ...overrides }
}

export function vacancy(overrides: Partial<Vacancy> = {}): Vacancy {
  return {
    id: 1, title: 'Bartender', description: 'Join the team', hours: '4 hours a week', type: 'Volunteer',
    applyEmail: null, applyLink: null, imageUrl: null, imageAlt: null, bar: 'HUBBLE', active: true,
    sortOrder: 0, ...overrides,
  }
}

export function weeklyHours(overrides: Partial<WeeklyHours> = {}): WeeklyHours {
  return {
    id: 1, bar: 'HUBBLE', dayOfWeek: 'MONDAY', open: '12:00', close: '23:00', kitchenOpen: null,
    kitchenClose: null, ...overrides,
  }
}

export function hoursOverride(overrides: Partial<HoursOverride> = {}): HoursOverride {
  return { id: 1, bar: 'HUBBLE', date: '2030-12-25', closed: true, open: null, close: null, note: 'Christmas', ...overrides }
}

export function barStatus(overrides: Partial<BarStatus> = {}): BarStatus {
  return { bar: 'HUBBLE', isOpen: true, bannerMessage: null, ...overrides }
}
