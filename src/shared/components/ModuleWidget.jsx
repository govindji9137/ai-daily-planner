/**
 * GeoPlaner V2 — ModuleWidget Wrapper (Shared Component)
 *
 * Standard wrapper for all module-injected dashboard widgets.
 * Provides consistent styling, module color accent, and error boundary.
 */
import React from 'react';

class WidgetErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--status-error)' }}>
          <div style={{ fontSize: '13px', color: 'var(--status-error)' }}>
            ⚠️ Widget failed to load: {this.props.widgetId}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * ModuleWidget
 * @param {string} moduleId       - Module ID ('personal', 'student', etc.)
 * @param {string} moduleIcon     - Emoji icon
 * @param {string} moduleName     - Display name
 * @param {string} colorKey       - CSS color key (e.g. 'student')
 * @param {string} title          - Widget title
 * @param {ReactNode} children    - Widget content
 * @param {string} className      - Additional CSS classes
 */
const ModuleWidget = ({
  moduleId,
  moduleIcon,
  moduleName,
  colorKey,
  title,
  children,
  style,
  fullWidth = false,
}) => (
  <WidgetErrorBoundary widgetId={`${moduleId}/${title}`}>
    <div
      className={`glass-panel module-widget ${colorKey || moduleId}`}
      style={{
        gridColumn: fullWidth ? '1 / -1' : undefined,
        ...style,
      }}
    >
      {/* Module attribution header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700' }}>{title}</h3>
        <span className={`module-chip ${colorKey || moduleId}`}>
          {moduleIcon} {moduleName}
        </span>
      </div>
      {children}
    </div>
  </WidgetErrorBoundary>
);

export default ModuleWidget;
