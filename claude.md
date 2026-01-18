# pakr88 Development Guide

## Design Philosophy

pakr88 follows a **Mother Earth magazine aesthetic** - organic, minimal, hand-crafted feel. Think vintage outdoor catalogs, field journals, and naturalist guides. The design should feel warm, trustworthy, and unpretentious.

## Color Palette

```css
--cream: #F5F1E8      /* Background - warm off-white */
--charcoal: #2B2B2B   /* Primary text - soft black */
--burnt: #CC5500      /* Primary accent - terracotta/burnt orange */
--forest: #2C5530     /* Success/positive - deep sage */
--muted: #6B6B6B      /* Secondary text - warm gray */
--sage: #6B8E5F       /* Charts/data viz - muted green */
--terracotta: #C4785A /* Highlights - softer orange */
--sand: #D4C4A8       /* Subtle backgrounds */
```

### Usage
- **cream** - Page backgrounds, card backgrounds
- **charcoal** - Headlines, primary text, category headers
- **burnt** - CTAs, links, accent stripes, interactive elements
- **forest** - Success states, positive indicators, "ideal" ratings
- **muted** - Secondary text, specs, metadata, placeholders
- **sage** - Data visualizations, charts, distribution curves
- **terracotta** - Hover states, mean markers, secondary accents

## Typography

### Font Stack
- **Body/Content**: Georgia, serif (warm, readable)
- **UI/Labels**: Helvetica Neue, sans-serif (clean, functional)

### Hierarchy
- **Category labels**: 0.6875rem, uppercase, letter-spacing: 0.05em, sans-serif
- **Item titles**: 0.875-0.9375rem, font-weight: 600-700, sans-serif
- **Body text**: 0.8125rem, serif, line-height: 1.6
- **Specs/metadata**: 0.8125rem, serif, color: muted

### Rules
- Serif for descriptive content (reasons, notes, descriptions)
- Sans-serif for UI elements (buttons, labels, titles, navigation)
- Small caps with letter-spacing for section labels
- No emoji in formal UI (use organic SVG icons instead)

## Visual Elements

### Icons
- Thin strokes only (1-1.5px stroke width)
- No fills - outline style
- Hand-drawn, organic feel
- Rounded stroke caps and joins
- Match the animated logo aesthetic (mountain bars)

### Cards & Containers
- Subtle borders: 1px solid charcoal or gray-200
- Border radius: 3-4px (not overly rounded)
- Left accent stripe: 4px burnt orange for gear items
- Background: cream or white
- Padding: 0.75-1.25rem

### Buttons
- **Primary (burnt)**: Solid background, white text, 4px radius
- **Secondary**: Transparent, burnt text, underline on hover
- **Subtle**: Text only, muted color, underline on hover
- No heavy shadows - flat design with subtle transitions

### Interactive States
- Hover: Subtle background change or underline
- Active: Slightly darker background
- Focus: burnt orange outline
- Transitions: 0.15-0.2s ease

## Component Patterns

### Section Headers
```css
.section-header {
  background: var(--charcoal);
  color: white;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
```

### Gear Cards
- Left accent stripe (4px burnt orange)
- Title: bold, charcoal
- Specs: serif, muted
- Status indicators: colored dots (forest=good, burnt=ok, charcoal=no)
- Hover reveals delete/edit actions

### Data Visualization
- Organic, hand-drawn line styles
- Muted earth tones (sage, terracotta, sand)
- Thin strokes with slight wobble for authenticity
- No heavy gridlines or boxes

### Mobile Navigation
- Icon-only on mobile (<768px)
- Text labels on desktop
- 44px minimum touch targets
- Organic SVG icons (no emoji)

## Spacing

- Tight gaps: 0.25-0.5rem (within components)
- Standard gaps: 0.75-1rem (between related items)
- Section gaps: 1.5-2rem (between sections)
- Page padding: 1rem on mobile, comfortable margins on desktop

## Dark Mode

Invert thoughtfully:
- cream → #1a1a1a (dark background)
- charcoal → #f5f1e8 (light text)
- Muted colors lighten slightly
- Accent colors remain similar but may soften
- Maintain contrast ratios for accessibility

## Accessibility

- Minimum touch targets: 44x44px
- Always include aria-labels on icon-only buttons
- Maintain WCAG AA contrast ratios
- Focus states must be visible
- No reliance on color alone for meaning

## Anti-Patterns (Avoid)

- Heavy drop shadows
- Bright/neon colors
- Overly rounded corners (>8px)
- Emoji in navigation or formal UI
- Dense, cramped layouts
- Generic Bootstrap/Material look
- Gratuitous animations
- Heavy charting libraries (use minimal SVG)

## File Structure

```
app/
  page.tsx          # Main trip planning page
  gear/page.tsx     # My Gear portfolio
  trips/page.tsx    # My Trips list
  globals.css       # All styles (no CSS modules)
components/
  AnimatedLogo.tsx  # Mountain bar waveform logo
  NavIcons.tsx      # Organic navigation icons
  HistoricalWeatherCurve.tsx  # Bell curve visualization
lib/
  auth.ts           # NextAuth configuration
  db.ts             # Database connection
```

## Development Notes

- Next.js 15 with App Router
- NextAuth for Google OAuth
- Neon PostgreSQL database
- Open-Meteo for weather data
- No heavy dependencies - prefer vanilla solutions
