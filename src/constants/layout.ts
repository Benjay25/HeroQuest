/**
 * Layout constants — shared across components so that if one value
 * changes, everything that depends on it updates automatically.
 *
 * Rule: any measurement that more than one component needs to know
 * about should live here, not be hardcoded in each file separately.
 */

/** Height of the top AppNav bar in pixels. */
export const NAV_HEIGHT = 64;

/** Sidebar width when fully expanded. */
export const SIDEBAR_WIDTH = 252;

/** Sidebar width when collapsed to icon-only mode. */
export const SIDEBAR_COLLAPSED_WIDTH = 60;
