# UI/UX Design System - Xtreme Signals

## Theme
Modern financial dashboard with **dark-mode-first** premium aesthetic. Professional trading platform with teal brand identity emphasizing stability and trust.

## Color Palette

**Primary Brand (Teal Scale)**
- Background: `#022C2C` (Teal-900)
- Surface: `#073A3A` (Teal-800)
- Primary: `#0F6C6C` (Teal-600)
- Primary Hover: `#118686` (Teal-500)
- Accent: `#4BC8C8` (Teal-300)
- Light Accent: `#7FE7E7` (Teal-200)
- Darkest: `#011A1A` (Teal-950)

**Neutrals/Text (Ink Scale)**
- Text Primary: `#E8F3F3`
- Text Muted: `#8EA3B0` (Ink-500)
- Dark Text: `#0A0F1E` (Ink-1000)
- Border: `#C7D3D9` + 20% opacity

**Signal/Status**
- Bullish/Success: `#22C55E` (Green)
- Bearish/Danger: `#EF4444` (Red)
- Warning/Neutral: `#F59E0B` (Amber)

**Light Mode** (Alternative)
- Background: `#FAFBFB` | Surface: `#FFFFFF` | Text: `#0A0F1E`

## Typography

**Fonts**
- Body: Inter (Variable)
- Display: Inter Tight / Plus Jakarta Sans
- Monospace: Geist Mono

**Scale**
- H1: 3xl, bold
- H2/Card Titles: base, semibold
- Body: sm, regular
- Small/Muted: xs
- Stats/Numbers: 2xl, bold

## Components

**Buttons**: 5 variants (default, destructive, outline, secondary, ghost) | Sizes: sm (32px), default (36px), lg (40px) | Teal primary with smooth transitions

**Cards**: Rounded-xl borders | Background `#073A3A` | Subtle shadow | Hover: border accent glow + shadow-md | Grid header with icon/title patterns

**Badges**: Rounded-full | xs text | Color-coded by category (Momentum: Blue, Trend: Green, Volume: Purple, Volatility: Orange)

**Inputs**: h-9 (36px) | Transparent bg with border | Teal focus ring | Dark bg overlay in dark mode

**Tabs**: Muted list background | Active state changes to input bg | Smooth box-shadow transitions

## Layout

**Structure**: Sidebar (256px) + Main (TopBar 64px + Content)

**Grids**: Responsive 1→2→3→4 columns | Gap-4 (16px) spacing

**Spacing**: p-6 (24px) cards | gap-4/6 between elements | Minimal margins, uses flexbox/grid gaps

**Container**: max-w-[1800px] centered

## Visual Style

- **Aesthetic**: Premium dark financial dashboard, data-focused minimalism
- **Interactions**: 150-200ms transitions, subtle elevation on hover, smooth state changes
- **Icons**: Lucide React (24px default)
- **Shadows**: Subtle (shadow-sm) default, shadow-md on hover
- **Borders**: Thin translucent borders, rounded-xl corners standard
- **Charts**: Integrated d3/recharts/lightweight-charts for financial data

## Tech Stack
shadcn/ui + Radix UI primitives + Tailwind CSS 4.0 + class-variance-authority for variants
