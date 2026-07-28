/**
 * GeoPlaner V2 — ModuleContext
 *
 * Manages which modules are enabled and their priority order.
 * Persists to backend (UserModules table) and localStorage as fallback.
 *
 * RULES:
 *  - 'personal' is always enabled and cannot be disabled.
 *  - Priority order determines scheduling weight (index 0 = highest priority).
 */
import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useMemo,
} from 'react';
import { getAllModules, buildAIContext, collectWidgets, collectNavItems, collectPages } from '../modules/registry';

// ─── Defaults ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'gp_modules_v2';

const DEFAULT_STATE = {
  // Priority-ordered list of enabled module IDs
  enabledModules: ['personal'],
  // Per-module settings (integrations, etc.)
  moduleSettings: {},
  // Has the user completed onboarding?
  onboardingDone: false,
};

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
};

// ─── Context ──────────────────────────────────────────────────────────────────
const ModuleContext = createContext(null);

export const ModuleProvider = ({ children }) => {
  const [state, setState] = useState(loadFromStorage);

  // Persist to localStorage on every state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* ignore storage errors */ }
  }, [state]);

  // ─── Enable a module ───────────────────────────────────────────────────
  const enableModule = useCallback((moduleId) => {
    setState((prev) => {
      if (prev.enabledModules.includes(moduleId)) return prev;
      return { ...prev, enabledModules: [...prev.enabledModules, moduleId] };
    });
  }, []);

  // ─── Disable a module ──────────────────────────────────────────────────
  const disableModule = useCallback((moduleId) => {
    if (moduleId === 'personal') return; // Personal is always on
    setState((prev) => ({
      ...prev,
      enabledModules: prev.enabledModules.filter((id) => id !== moduleId),
    }));
  }, []);

  // ─── Toggle a module ───────────────────────────────────────────────────
  const toggleModule = useCallback((moduleId) => {
    setState((prev) => {
      if (moduleId === 'personal') return prev;
      const isEnabled = prev.enabledModules.includes(moduleId);
      return {
        ...prev,
        enabledModules: isEnabled
          ? prev.enabledModules.filter((id) => id !== moduleId)
          : [...prev.enabledModules, moduleId],
      };
    });
  }, []);

  // ─── Reorder modules (drag-and-drop or up/down) ────────────────────────
  const reorderModules = useCallback((orderedIds) => {
    // Always ensure 'personal' remains in list
    const withPersonal = orderedIds.includes('personal')
      ? orderedIds
      : ['personal', ...orderedIds];
    setState((prev) => ({ ...prev, enabledModules: withPersonal }));
  }, []);

  // ─── Save module settings (e.g. integrations) ──────────────────────────
  const setModuleSettings = useCallback((moduleId, settings) => {
    setState((prev) => ({
      ...prev,
      moduleSettings: {
        ...prev.moduleSettings,
        [moduleId]: { ...(prev.moduleSettings[moduleId] ?? {}), ...settings },
      },
    }));
  }, []);

  // ─── Mark onboarding complete ──────────────────────────────────────────
  const completeOnboarding = useCallback((enabledIds) => {
    setState((prev) => ({
      ...prev,
      enabledModules: enabledIds,
      onboardingDone: true,
    }));
  }, []);

  // ─── Reset to defaults ─────────────────────────────────────────────────
  const resetModules = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  // ─── Derived: computed values ──────────────────────────────────────────
  const allModuleDefs = useMemo(() => getAllModules(), []);

  const isEnabled = useCallback(
    (moduleId) => state.enabledModules.includes(moduleId),
    [state.enabledModules]
  );

  const aiContext = useMemo(
    () => buildAIContext(state.enabledModules),
    [state.enabledModules]
  );

  const dashboardWidgets = useMemo(
    () => collectWidgets(state.enabledModules),
    [state.enabledModules]
  );

  const moduleNavItems = useMemo(
    () => collectNavItems(state.enabledModules),
    [state.enabledModules]
  );

  const modulePages = useMemo(
    () => collectPages(state.enabledModules),
    [state.enabledModules]
  );

  const getModuleSettings = useCallback(
    (moduleId) => state.moduleSettings[moduleId] ?? {},
    [state.moduleSettings]
  );

  return (
    <ModuleContext.Provider value={{
      // State
      enabledModules:   state.enabledModules,
      moduleSettings:   state.moduleSettings,
      onboardingDone:   state.onboardingDone,
      allModuleDefs,

      // Actions
      enableModule,
      disableModule,
      toggleModule,
      reorderModules,
      setModuleSettings,
      completeOnboarding,
      resetModules,

      // Derived
      isEnabled,
      aiContext,
      dashboardWidgets,
      moduleNavItems,
      modulePages,
      getModuleSettings,
    }}>
      {children}
    </ModuleContext.Provider>
  );
};

export const useModules = () => {
  const ctx = useContext(ModuleContext);
  if (!ctx) throw new Error('useModules must be used inside ModuleProvider');
  return ctx;
};
