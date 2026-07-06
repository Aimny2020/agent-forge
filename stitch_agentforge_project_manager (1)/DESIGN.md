---
name: Vivid Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3b4a3d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6b7b6c'
  outline-variant: '#bacbb9'
  surface-tint: '#006d35'
  primary: '#006d35'
  on-primary: '#ffffff'
  primary-container: '#00e676'
  on-primary-container: '#00612e'
  inverse-primary: '#00e475'
  secondary: '#5b5e66'
  on-secondary: '#ffffff'
  secondary-container: '#dfe2eb'
  on-secondary-container: '#61646c'
  tertiary: '#5c5f60'
  on-tertiary: '#ffffff'
  tertiary-container: '#c7c8c9'
  on-tertiary-container: '#515455'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#62ff96'
  primary-fixed-dim: '#00e475'
  on-primary-fixed: '#00210b'
  on-primary-fixed-variant: '#005226'
  secondary-fixed: '#dfe2eb'
  secondary-fixed-dim: '#c3c6cf'
  on-secondary-fixed: '#181c22'
  on-secondary-fixed-variant: '#43474e'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  headline-xl-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 32px
  gutter: 24px
  section-gap: 48px
---

## Brand & Style

This design system embodies a **Modern Corporate** aesthetic with a high-energy pulse. It is designed for productivity-focused environments that require clarity without sacrificing character. The personality is efficient, optimistic, and highly organized.

Key characteristics include:
- **High-Contrast Minimalism:** Leveraging a clean, clinical light base to make vibrant accents and deep neutrals pop.
- **Generous Air:** Utilizing significant whitespace to reduce cognitive load and establish a premium, intentional feel.
- **Dynamic Accents:** Integrating high-chroma greens for primary actions and status indicators to guide the eye toward progress and completion.

## Colors

The color palette centers on functional contrast.
- **Primary (#00E676):** A vibrant "Neo-Green" used exclusively for active states, primary buttons, and positive progress indicators.
- **Secondary (#0D1117):** A deep navy-black used for high-importance text, dark-mode components (like featured cards), and primary branding.
- **Background (#F8F9FA):** A soft, cool gray that serves as the canvas, providing a more comfortable reading experience than pure white.
- **Neutral (#64748B):** A balanced slate for secondary text, borders, and icon states.

## Typography

The typography strategy pairs a sharp, contemporary grotesque for headlines with a highly legible, systematic sans for body content.

- **Headlines:** Use Hanken Grotesk with tight letter-spacing for a bold, editorial look.
- **Body & Data:** Use Inter for its neutral tone and exceptional readability in data-heavy dashboard contexts.
- **Hierarchy:** Maintain clear distinction through weight—use Semibold (600) or Bold (700) for headers to anchor sections against the light background.

## Layout & Spacing

The system utilizes a **Fluid Grid** model with strict vertical rhythm based on an 8px scale.

- **Desktop:** 12-column grid with 24px gutters. Content should be housed in distinct white cards against the #F8F9FA background.
- **Margins:** High-density content requires "breathable" margins. Use 32px of internal padding within cards and container edges.
- **Reflow:** On mobile, columns collapse to a single stack, and container padding reduces to 16px. Large display values (like metrics) should remain prominent but scale down proportionally.

## Elevation & Depth

Depth is achieved through **Tonal Layering** and soft, ambient shadows rather than heavy borders.

- **Surface Levels:** The background is #F8F9FA. Primary content cards are #FFFFFF. 
- **Shadows:** Use extremely soft, low-opacity shadows (e.g., `0 4px 20px rgba(0, 0, 0, 0.04)`) to lift cards slightly off the surface.
- **Featured Elevation:** For high-priority widgets (like the "Meeting" card), use a dark background (#0D1117) to create an immediate focal point through contrast rather than physical height.

## Shapes

The shape language is dominated by **Pill-shaped** and highly rounded geometry to soften the technical nature of a dashboard.

- **Global Radius:** Most cards and inputs use a 1rem (16px) radius.
- **Interactive Elements:** Navigation tabs, buttons, and chips use a full pill radius (999px) to communicate touch-friendly interactivity.
- **Active States:** Active pill elements should feature a solid #00E676 fill with high-contrast text.

## Components

- **Navigation Tabs:** Use a pill-shaped container. The active state is a solid #00E676 fill with black text; inactive states are transparent with neutral gray text.
- **Buttons:** Primary buttons are pill-shaped with #00E676 backgrounds. Secondary buttons use a light gray or ghost style with high-contrast text.
- **Cards:** All cards must have a white (#FFFFFF) background, subtle shadows, and a 1rem corner radius.
- **Inputs:** Search bars and text fields use pill-shaped containers with #F1F5F9 backgrounds and no border.
- **Data Visualizations:** Use the primary green for "active/current" data and shades of cool gray for "background/previous" data to maintain the high-contrast narrative.
- **Chips/Status:** Small, pill-shaped tags with a subtle green tint and dark green text for "Completed" or "Active" states.