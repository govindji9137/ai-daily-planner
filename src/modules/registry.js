/**
 * GeoPlaner V2 — Module Registry
 *
 * Every module self-registers here.
 * Core systems (Planner, AI, Analytics, Dashboard) read from this registry.
 * Adding a new module NEVER requires modifying core code.
 */

// ─── Registry Store ──────────────────────────────────────────────────────────

const _registry = new Map();

/**
 * Register a module with the GeoPlaner system.
 *
 * @param {Object} module - Module definition object
 * @param {string} module.id        - Unique module ID (matches MODULE_ID constant)
 * @param {string} module.name      - Display name
 * @param {string} module.icon      - Emoji icon
 * @param {string} module.color     - CSS variable name (e.g. 'var(--module-student)')
 * @param {string} module.colorKey  - CSS class key (e.g. 'student')
 * @param {string} module.description - Short description for onboarding
 * @param {boolean} module.alwaysEnabled - If true, cannot be disabled (Personal)
 * @param {Function} module.getAIContext     - (enabledModules) => string system prompt section
 * @param {Function} module.getWidgets       - () => Widget[] to inject into Dashboard
 * @param {Function} module.getNavItems      - () => NavItem[] to inject into Sidebar
 * @param {Function} module.getPages         - () => Page[] to inject into Main Content
 * @param {Function} module.getAnalyticsMetrics - (historyData) => Metric[]
 * @param {Function} module.getTaskTemplates - () => TaskTemplate[]
 * @param {Object} module.integrations - { [integrationId]: IntegrationDefinition }
 */
export const registerModule = (module) => {
  if (!module.id) throw new Error('Module must have an id');
  _registry.set(module.id, {
    // Defaults
    alwaysEnabled:       false,
    getAIContext:        () => '',
    getWidgets:          () => [],
    getNavItems:         () => [],
    getPages:            () => [],
    getAnalyticsMetrics: () => [],
    getTaskTemplates:    () => [],
    integrations:        {},
    // Override with provided
    ...module,
  });
};

/**
 * Get a single registered module by ID.
 * @param {string} id
 * @returns {Object|null}
 */
export const getModule = (id) => _registry.get(id) ?? null;

/**
 * Get all registered modules in insertion order.
 * @returns {Object[]}
 */
export const getAllModules = () => [..._registry.values()];

/**
 * Get only the enabled modules from a list of module IDs, in priority order.
 * @param {string[]} enabledIds - Ordered list of enabled module IDs
 * @returns {Object[]} Module definitions in priority order
 */
export const getEnabledModules = (enabledIds = []) =>
  enabledIds
    .map((id) => _registry.get(id))
    .filter(Boolean);

/**
 * Build the composite AI context string from all enabled modules.
 * Each module contributes a section to the system prompt.
 * 
 * @param {string[]} enabledIds - Ordered list of enabled module IDs
 * @returns {string} Combined AI context
 */
export const buildAIContext = (enabledIds = []) => {
  const sections = getEnabledModules(enabledIds)
    .map((mod) => mod.getAIContext(enabledIds))
    .filter(Boolean);

  if (sections.length === 0) return '';

  return `\n\n=== ACTIVE PRODUCTIVITY MODULES ===\n${sections.join('\n\n')}`;
};

/**
 * Collect all widgets from enabled modules.
 * Widgets are rendered in the Dashboard below the fixed top section.
 * 
 * @param {string[]} enabledIds
 * @returns {Array} Flat list of widget definitions
 */
export const collectWidgets = (enabledIds = []) =>
  getEnabledModules(enabledIds).flatMap((mod) => mod.getWidgets());

/**
 * Collect all sidebar nav items from enabled modules.
 * @param {string[]} enabledIds
 * @returns {Array} Flat list of nav items
 */
export const collectNavItems = (enabledIds = []) =>
  getEnabledModules(enabledIds).flatMap((mod) => mod.getNavItems());

/**
 * Collect all page routes from enabled modules.
 * @param {string[]} enabledIds
 * @returns {Array} Flat list of page components
 */
export const collectPages = (enabledIds = []) =>
  getEnabledModules(enabledIds).flatMap((mod) => (mod.getPages ? mod.getPages() : []));

/**
 * Collect all analytics metrics from enabled modules.
 * @param {string[]} enabledIds
 * @param {Array} historyData
 * @returns {Array} Flat list of metric definitions
 */
export const collectAnalyticsMetrics = (enabledIds = [], historyData = []) =>
  getEnabledModules(enabledIds).flatMap((mod) => mod.getAnalyticsMetrics(historyData));

export default _registry;
