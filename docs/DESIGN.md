# Mission Control Design System

This document describes the visual language, layout system, and component patterns for Mission Control. It is intended to be detailed enough for you to build new UI that feels native to the existing interface.

## Principles

- Command-center clarity: dense information with clear hierarchy and sharp grouping.
- Subtle chrome: borders, muted surfaces, and restrained shadows that keep data prominent.
- Signal colors are reserved: accents and status colors are used for meaning, not decoration.
- Typography leads: small uppercase labels and tight tracking for metadata, larger bold numbers for stats.

## Foundations

### Type

Primary font: Outfit (loaded via Google Fonts).

- Sans stack: Outfit, Geist, sans-serif
- Serif stack: Georgia, serif
- Mono stack: Geist Mono, monospace

Usage conventions:

- Display counts: 2xl, bold, tabular numbers where possible.
- Panel titles: 11px, uppercase, bold, tracking-wide.
- Metadata labels: 10px or 11px, uppercase, tight tracking.
- Body text: 12px to 14px, medium weight, high contrast on white or muted background.

### Color tokens

Base tokens (tailwind-compatible via @theme inline):

- --background: App background surface.
- --foreground: Primary text on background.
- --card: Card surface color.
- --card-foreground: Text on card.
- --popover, --popover-foreground: Floating surfaces.
- --primary, --primary-foreground: Primary action and its text.
- --secondary, --secondary-foreground: Secondary surfaces (used for main grid background).
- --muted, --muted-foreground: Subtle surfaces and subdued text.
- --accent, --accent-foreground: Accent surface and text (used sparingly).
- --destructive, --destructive-foreground: Error surfaces.
- --border: Standard border color for separators and cards.
- --input: Input border or field background.
- --ring: Focus ring color.
- --chart-1..5: Chart palette placeholders.
- --sidebar, --sidebar-foreground: Sidebar surfaces.
- --sidebar-primary, --sidebar-primary-foreground: Sidebar emphasis.
- --sidebar-accent, --sidebar-accent-foreground: Sidebar accents.
- --sidebar-border, --sidebar-ring: Sidebar borders and focus.

Mission Control specific tokens:

- --header-height: 80px. Controls grid header row.
- --sidebar-left-width: 280px. Controls agent roster width.
- --sidebar-right-width: 320px. Controls live feed width.
- --accent-orange: Primary accent used for command signals.
- --accent-blue: Secondary accent.
- --accent-green: Success and active status.
- --accent-red: Alert and blocked status.
- --accent-brown: Specialist level accent.
- --status-working: Active status dot and label.
- --status-lead: LEAD badge background.
- --status-int: INT badge background.
- --status-spc: SPC badge background.
- --card-shadow: Soft lift used for cards.

Status color usage:

- Active: --status-working (green)
- Blocked: --accent-red
- Lead level: --status-lead (orange)
- Intermediate level: --status-int (blue)
- Specialist level: --status-spc (brown)

### Dark theme

A .dark theme is defined in CSS via token overrides. There is no dedicated UI toggle or explicit theme switch in the current components. Treat dark mode as supported only at the token level until a UI trigger is introduced.

### Radii

- --radius: 0.5rem, with derived radius-sm, radius-md, radius-lg, radius-xl via @theme inline.
- Most UI uses rounded-lg or rounded-full for badges and pills.

### Shadows

Shadows are defined as a full scale (2xs to 2xl) and aligned to Tailwind tokens via @theme inline. Primary usage:

- Cards: shadow-sm or shadow-md with subtle hover lift.
- Auth card: shadow-xl, hover shadow-2xl for emphasis.

### Spacing

Base spacing scale is 0.25rem in CSS variables and Tailwind utility usage. Common patterns:

- Panel padding: 16px to 24px (p-4 to p-6).
- Header bar height: 65px for panel headers, separate from 80px app header.
- Card padding: 12px to 16px for compact content.

### Borders

- All panels and cards use border-border for structure.
- Divider lines: 1px, same color as border.
- Chips and pills: border + muted fill.

### Scrollbars

Custom scrollbar styling is applied globally for WebKit browsers:

- Thin 6px track, neutral thumb with hover darken.

## Layout System

### App grid

The root layout is a CSS grid with fixed header row and three columns:

- Header spans all columns.
- Left sidebar is the agent roster.
- Main area is the mission queue.
- Right sidebar is the live feed.

Grid sizes use CSS variables:

- Header: --header-height (80px)
- Left sidebar: --sidebar-left-width (280px)
- Right sidebar: --sidebar-right-width (320px)

### Panel anatomy

Most panels follow the same structure:

1. Panel header
   - Height: 65px
   - Background: white
   - Border-bottom: border-border
   - Title: uppercase, 11px, bold, tracking-widest
   - Status dot: 1.5 to 2px circle in accent color
2. Panel content
   - Scrollable when lists are long
   - White or secondary background depending on panel
3. Panel footer (optional)
   - Used in live feed for status bar

## Component Patterns

### Header bar

- White background with bottom border.
- Left cluster: logo glyph, title, small environment pill.
- Center cluster: stat blocks with a vertical divider.
- Right cluster: action button, clock, status pill, and sign out.

Key conventions:

- Stats use large numbers and 10px uppercase labels.
- Action button is muted background with subtle hover.
- Status pill uses colored background with dot and uppercase text.

### Agent roster row

- Row height around 48px with hover background.
- Avatar circle on the left with border and muted fill.
- Name in 14px bold, level badge beside name.
- Role is 12px muted.
- Status is 9px uppercase with dot, aligned right.

Level badge usage:

- LEAD: --status-lead
- INT: --status-int
- SPC: --status-spc

### Mission queue column

- Five fixed columns, min width 250px, horizontal scrolling if needed.
- Column header: light gray background, dot + uppercase label + count.
- Cards stack with small gaps, white background, subtle shadow.

Card anatomy:

- Top row: icon and overflow glyph in muted text.
- Title: 14px bold.
- Description: 12px muted, line-clamped.
- Meta: assignee + relative time in small text.
- Tags: 10px pills with muted background.
- Card left border: 4px status color from task data.
- Hover state: slight translate up and shadow-md.

### Live feed

- Filter chips row: pills with active orange fill.
- Agent chips: white background with border.
- Activity item: subtle secondary background, left orange dot.
- Footer status bar: light gray background with green dot and LIVE label.

### Auth card

- Centered, max width 448px.
- Two sections: header (muted background) and form body.
- Title uppercase, subtitle muted.
- Inputs: border, focus ring with accent orange.
- Primary action: black background, white text, uppercase, letter-spaced.
- Error: muted red background with warning icon.

## Interaction Patterns

- Hover: muted background for list rows; card lift for mission items.
- Focus: accent orange ring on inputs.
- Active: subtle scale-down on primary button.
- Loading: animate-pulse skeletons for each panel with layout-matching blocks.

## Data Presentation

- Time format: 24-hour clock in header; relative times in lists.
- Counts are small badges or pills next to panel titles.
- Status and level are always uppercase with high tracking.

## Recipes for New Components

### Recipe: Panel with list

1. Use white background with border on the container.
2. Add a 65px header row with uppercase title and accent dot.
3. Add a scrollable list with rows that use muted hover and border separation.
4. Use small uppercase labels for metadata and muted text for secondary info.

### Recipe: Card item

1. White background, rounded-lg, border-border.
2. Optional 4px left border in status color.
3. Title in 14px bold, body in 12px muted.
4. Small tags in 10px pills with muted background.
5. Hover lift with shadow-md.

### Recipe: Status pill

1. Rounded-full, 10px to 11px uppercase text.
2. Include a dot with matching status color.
3. Keep background contrast subtle for non-critical status.

## Do and Don’t

- Do use tokens and variables for all colors, shadows, and borders.
- Do preserve the uppercase label style with tracking for headings.
- Do keep spacing tight and consistent with existing panel padding.
- Don’t introduce saturated colors outside of the defined accents.
- Don’t add heavy shadows or gradients that break the command-center tone.
- Don’t mix font families inside a single component unless intentional.

## Reference Implementation Locations

- Tokens, layout grid, scrollbars: src/index.css
- App layout: src/App.tsx
- Header patterns: src/components/Header.tsx
- Agent roster: src/components/AgentsSidebar.tsx
- Mission queue: src/components/MissionQueue.tsx
- Live feed: src/components/LiveFeed.tsx
- Auth card: src/components/SignIn.tsx
