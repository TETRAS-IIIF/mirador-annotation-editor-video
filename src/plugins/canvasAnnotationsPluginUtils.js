/**
 * Utilities
 */
export const isScrollable = (el) => {
  if (!el) return false;
  const cs = getComputedStyle(el);
  const oy = cs.overflowY || cs.overflow || '';
  return /(auto|scroll|overlay)/.test(oy) && el.scrollHeight > el.clientHeight;
};
/**
 * Find the closest scrollable ancestor of a given DOM node.
 *
 * - Walks up the DOM tree from the node's parent using `parentElement`.
 * - Returns the first ancestor element that is considered scrollable,
 *   meaning:
 *   - Its `overflowY` (or `overflow`) style is `auto`, `scroll`, or `overlay`,
 *   - And its `scrollHeight` is greater than its `clientHeight`.
 * - Returns `null` if no scrollable ancestor is found before reaching the root.
 *
 * @param {HTMLElement|null} node - The starting DOM node.
 * @returns {HTMLElement|null} The nearest scrollable ancestor, or null if none exist.
 */
export const closestScrollableAncestor = (node) => {
  let cur = node?.parentElement || null;
  while (cur) {
    if (isScrollable(cur)) return cur;
    cur = cur.parentElement;
  }
  return null;
};
/**
 * Find the first scrollable descendant of a given root element.
 *
 * - Checks the immediate children of `root` first.
 * - If none are scrollable, scans all descendants (via `querySelectorAll('*')`).
 * - A scrollable element is one where `overflowY` (or `overflow`) is set
 *   to `auto`, `scroll`, or `overlay` **and** the element's `scrollHeight`
 *   exceeds its `clientHeight`.
 * - Returns `null` if no scrollable descendant is found.
 *
 * @param {HTMLElement|null} root - The root element to search within.
 * @returns {HTMLElement|null} The first scrollable descendant element, or null if none exist.
 */
export const firstScrollableDescendant = (root) => {
  if (!root) return null;
  for (const el of Array.from(root.children)) if (isScrollable(el)) return el;
  for (const el of Array.from(root.querySelectorAll('*'))) if (isScrollable(el)) return el;
  return null;
};
/**
 * Get the primary scrollable element for the browser window.
 *
 * - Modern browsers expose `document.scrollingElement` (usually the `<html>` element).
 * - As a fallback, returns `document.documentElement` (the `<html>` element).
 * - This element's `scrollTop` and `scrollHeight` represent the window's scroll state.
 *
 * @function
 * @returns {HTMLElement} The DOM element representing the window's scrolling container.
 */
export const getWindowScroller = () => document.scrollingElement || document.documentElement;
/**
 * Compute the vertical scroll position needed to bring a node into view
 * within a given scrollable container element.
 *
 * - Uses bounding boxes of the node and container to calculate the node's
 *   position relative to the container's scroll area.
 * - Considers the container's `scrollTop`, `clientHeight`, and a custom
 *   `offsetTop` (for sticky headers/toolbars inside the container).
 * - If the node is already fully visible inside the container, returns `null`.
 * - If the node is above the visible area, returns the scrollTop needed
 *   to align its top just below the offset.
 * - If the node is below the visible area, returns the scrollTop needed
 *   to bring its bottom into view (but not less than aligning its top).
 *
 * @param {HTMLElement} container - The scrollable container element.
 * @param {HTMLElement} node - The DOM element to bring into view.
 * @param {number} offsetTop - Extra vertical offset in pixels to keep free at the top.
 * @returns {number|null} The target scrollTop value for the container, or null if already visible.
 */
export function computeTargetContainer(container, node, offsetTop) {
  const cRect = container.getBoundingClientRect();
  const nRect = node.getBoundingClientRect();
  const nodeTopInContainer = (nRect.top - cRect.top) + container.scrollTop;
  const nodeBottomInContainer = (nRect.bottom - cRect.top) + container.scrollTop;
  const visibleTop = container.scrollTop + offsetTop;
  const visibleBottom = container.scrollTop + container.clientHeight;
  const above = nodeTopInContainer < visibleTop;
  const below = nodeBottomInContainer > visibleBottom;
  if (!above && !below) return null;
  return above
    ? nodeTopInContainer - offsetTop
    : Math.max(nodeBottomInContainer - container.clientHeight, nodeTopInContainer - offsetTop);
}

/**
 * Compute the vertical scroll position needed to bring a node into view
 * within the browser window.
 *
 * - Uses the node's bounding box relative to the viewport.
 * - Considers the current `window.scrollY` and the given `offsetTop`
 *   (to account for sticky headers or toolbars).
 * - If the node is already fully visible, returns `null`.
 * - If the node is above the visible viewport, returns the scrollY needed
 *   to align its top just below the offset.
 * - If the node is below the viewport, returns the scrollY needed to align
 *   its bottom into view (but not less than aligning its top).
 *
 * @param {HTMLElement} node - The DOM element to bring into view.
 * @param {number} offsetTop - Extra vertical offset in pixels to keep free at the top.
 * @returns {number|null} The target scrollY for the window, or null if already visible.
 */
export function computeTargetWindow(node, offsetTop) {
  const rect = node.getBoundingClientRect();
  const nodeTop = rect.top + window.scrollY;
  const nodeBottom = rect.bottom + window.scrollY;
  const viewTop = window.scrollY + offsetTop;
  const viewBottom = window.scrollY + window.innerHeight;
  const above = nodeTop < viewTop;
  const below = nodeBottom > viewBottom;
  if (!above && !below) return null;
  return above
    ? nodeTop - offsetTop
    : Math.max(nodeBottom - window.innerHeight, nodeTop - offsetTop);
}
