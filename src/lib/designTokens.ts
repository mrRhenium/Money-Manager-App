/**
 * Centralized Design Tokens & Typography System
 * 
 * Modifying any token or CSS variable here cascades across:
 * - Master Headers (Page title & subtitle)
 * - Master Cards (Title, Subtitle, Badges, Labels, Values, Amounts)
 * - Popups & Dialogs (Header title, description, body text, form field labels, inputs, footer buttons)
 * - Settings (Section headings, item labels, descriptions)
 */

export const TYPOGRAPHY = {
  // Master Page Header
  headerTitle: "text-[length:var(--font-size-header-title)] font-bold tracking-tight text-foreground",
  headerSubtitle: "text-[length:var(--font-size-header-subtitle)] text-muted-foreground",

  // Master Cards across Accounts, Categories, Budgets, Credit Cards, Investments, Insurance, People, Loans, Subscriptions
  cardTitle: "text-[length:var(--font-size-card-title)] font-semibold text-foreground truncate",
  cardSubtitle: "text-[length:var(--font-size-card-subtitle)] text-muted-foreground truncate",
  cardLabel: "text-[length:var(--font-size-card-label)] font-bold uppercase tracking-wider text-muted-foreground",
  cardValue: "text-[length:var(--font-size-card-value)] font-semibold text-foreground",
  cardAmount: "text-[length:var(--font-size-card-amount)] font-bold tracking-tight text-foreground",

  // Universal Badges & Status Chips
  badge: "text-[length:var(--font-size-badge)] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md",

  // Universal Buttons Across Portal
  btnXs: "text-[length:var(--font-size-btn-xs)] font-medium",
  btnSm: "text-[length:var(--font-size-btn-sm)] font-medium",
  btnDefault: "text-[length:var(--font-size-btn-default)] font-semibold",
  btnLg: "text-[length:var(--font-size-btn-lg)] font-semibold",

  // Popups & Modal Dialogs
  modalTitle: "text-[length:var(--font-size-modal-title)] font-bold tracking-tight text-foreground flex items-center gap-2",
  modalDescription: "text-[length:var(--font-size-modal-desc)] text-muted-foreground mt-0.5",
  modalBody: "text-[length:var(--font-size-modal-body)] text-foreground",
  modalFieldLabel: "text-[length:var(--font-size-modal-label)] font-semibold text-foreground/80",
  modalInput: "text-[length:var(--font-size-modal-input)]",
  modalButton: "text-[length:var(--font-size-modal-btn)] font-semibold",

  // Settings Master Content
  settingsTitle: "text-[length:var(--font-size-settings-title)] font-semibold text-foreground",
  settingsLabel: "text-[length:var(--font-size-settings-label)] font-semibold text-foreground",
  settingsDesc: "text-[length:var(--font-size-settings-desc)] text-muted-foreground",

  // KPI Cards
  kpiLabel: "text-[length:var(--font-size-kpi-label)] font-bold uppercase tracking-wider text-muted-foreground",
  kpiSubtitle: "text-[length:var(--font-size-kpi-sub)] text-muted-foreground font-medium",

  // Navigation (Sidebar, Bottom Navigation & Mobile Menu)
  navSidebar: "text-[length:var(--font-size-nav-sidebar)] font-medium",
  navBottom: "text-[length:var(--font-size-nav-bottom)] font-medium",
  navMobileMenu: "text-[length:var(--font-size-nav-mobile-menu)] font-medium",

  // Section & Chart Titles
  sectionTitle: "text-[length:var(--font-size-section-title)] font-bold text-foreground",
} as const;

export type FontSizePreference = "compact" | "normal" | "large";
export type FontFamilyPreference = "sans" | "serif" | "mono";

export interface UserTypographyPreferences {
  fontSize: FontSizePreference;
  fontFamily: FontFamilyPreference;
}
