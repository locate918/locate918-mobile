export interface Category {
  id: string;
  label: string;
}

/** Real event categories (used for preference weights). */
export const EVENT_CATEGORIES: Category[] = [
  { id: 'music', label: 'Music' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'art', label: 'Arts' },
  { id: 'food', label: 'Food' },
  { id: 'sports', label: 'Sports' },
  { id: 'family', label: 'Family' },
  { id: 'festival', label: 'Festival' },
  { id: 'community', label: 'Community' },
];

/** Same list with an "All" pseudo-category prepended, for the Events filter. */
export const FILTER_CATEGORIES: Category[] = [
  { id: 'all', label: 'All' },
  ...EVENT_CATEGORIES,
];
