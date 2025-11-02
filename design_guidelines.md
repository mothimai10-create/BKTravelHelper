# BKTravel Helper - Design Guidelines

## Design Approach

**Selected Approach:** Hybrid Reference-Based
- **Primary Inspiration:** Airbnb (travel experience focus, card-based layouts, map integration)
- **Secondary Inspiration:** Notion (trip organization), Splitwise (budget splitting), Linear (clean data presentation)
- **Justification:** Travel applications require emotional engagement and visual appeal while maintaining strong utility for budget tracking and trip management. The design must inspire wanderlust while providing precise financial control.

## Core Design Principles

1. **Travel-First Aesthetics:** Inspire exploration through imagery and spacious layouts
2. **Data Clarity:** Present complex budget and spending information with visual hierarchy
3. **Mobile Momentum:** Optimize for on-the-go trip updates and location tracking
4. **Group Transparency:** Make shared budgets and spending immediately understandable

## Typography

**Font Families:**
- Primary: Inter (via Google Fonts) - body text, UI elements, data displays
- Accent: Playfair Display - hero headlines, trip names (adds travel sophistication)

**Type Scale:**
- Hero Headlines: text-5xl md:text-7xl, font-serif, font-bold
- Page Titles: text-3xl md:text-4xl, font-sans, font-bold
- Section Headers: text-2xl md:text-3xl, font-sans, font-semibold
- Card Titles: text-xl, font-sans, font-semibold
- Body Text: text-base, font-sans, font-normal
- Supporting Text: text-sm, font-sans, font-medium
- Labels: text-xs, font-sans, font-medium, uppercase tracking-wide

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-4 to p-8
- Section spacing: py-12 to py-24
- Card gaps: gap-4 to gap-8
- Button padding: px-6 py-3

**Container Strategy:**
- Max-width: max-w-7xl for main content
- Full-width: Maps and image sections
- Compact: max-w-md for forms (login, registration)
- Reading width: max-w-3xl for text-heavy sections

**Grid Patterns:**
- Trip Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Budget Items: Single column list with dividers
- Spending Entries: Single column with side-by-side date and amount
- Dashboard Layout: Two-column on desktop (profile sidebar + main content)

## Component Library

### Navigation
- **Top Navigation Bar:** Fixed, glass-morphism effect with blur, contains logo, user menu, notifications bell
- **Profile Sidebar (Home):** Left-aligned, w-64 on desktop, collapsible drawer on mobile, includes avatar, username, My Trips link, My Budgets link, Join Budget Split button

### Cards
- **Trip Card:** Rounded-2xl, overflow-hidden, image top (aspect-ratio 16/9), content padding p-6, includes trip name, dates, member count badge, budget progress bar, action buttons at bottom
- **Budget Item Card:** Rounded-xl, border, p-4, flex layout with icon left, description center, amount right, hover lift effect
- **Spending Entry:** Rounded-lg, p-4, flex between description and amount, includes date subtitle, member split indicator

### Forms
- **Input Fields:** Rounded-lg, border, px-4 py-3, focus ring with offset, placeholder text with reduced opacity
- **Labels:** text-sm, font-medium, mb-2
- **Buttons - Primary:** Rounded-lg, px-6 py-3, font-semibold, shadow-md, blurred background when over images
- **Buttons - Secondary:** Rounded-lg, px-6 py-3, border-2, font-semibold
- **Icon Buttons:** Rounded-full, p-3, hover background change

### Data Displays
- **Budget Progress Bar:** Rounded-full, h-2 to h-3, filled section with gradient, includes percentage label
- **Member Avatar List:** Overlapping circles (-ml-2), max 4 visible with "+X more" indicator
- **Stat Cards:** Rounded-xl, p-6, large number display (text-4xl), label below (text-sm)
- **Timeline:** Vertical line with circular markers, indented content blocks

### Map Integration
- **Map Container:** Rounded-2xl on desktop, full-width on mobile, minimum h-96, includes zoom controls, location markers with custom icons, route lines, interactive popups for stops

### Modals & Overlays
- **Modal:** max-w-2xl, rounded-2xl, backdrop blur, slide-up animation on mobile, fade-in on desktop
- **Notification Popup:** Fixed top-right, rounded-xl, shadow-2xl, slide-in animation, auto-dismiss after 5s
- **Chatbot Interface:** Fixed bottom-right, rounded-2xl, shadow-2xl, w-96 max on desktop, full-width drawer on mobile

### Special Components
- **Join Code Display:** Large monospace text (text-3xl), letter-spaced, copy button adjacent, outlined box
- **PDF Preview Card:** Rounded-xl, aspect-ratio document, includes download icon overlay
- **Location Status Badge:** Pill-shaped, includes GPS icon, live update pulse animation
- **Empty States:** Centered icon + message + action button, py-20

## Page-Specific Layouts

### Splash Page
- Full-viewport hero with large travel photography background image
- Centered headline (Playfair Display, text-6xl md:text-8xl) with tagline
- Two CTA buttons (Sign Up, Login) with blurred backgrounds over hero image
- Three-column feature grid below fold: "Plan Trips," "Track Budgets," "Share Updates" with icons and descriptions
- Footer with social links and contact

### Registration/Login
- Split layout on desktop: left half with form (max-w-md, centered), right half with travel imagery
- Stacked on mobile: image header, form below
- Form: logo at top, title, input fields stacked with gap-4, primary button, link to alternate action below

### Home Page Dashboard
- Desktop: Sidebar (w-64) + Main Content Area
- Sidebar: Profile card at top (avatar, name, stats), navigation links below, Join Budget Split button at bottom
- Main Content: "Create Trip" prominent CTA card at top, "My Trips" section with trip cards in grid, "Upcoming/Past" tabs
- Mobile: Hamburger menu, profile header, content stacked

### Create Trip Page
- Single column form, max-w-2xl centered
- Progressive disclosure: Basic info → Member management → Budget setup
- Map preview section for location input with autocomplete search
- Summary sidebar on desktop showing entered data
- Bottom action bar with Cancel and Continue buttons

### Location Page
- Full-width map taking 60% of viewport height
- Below map: Stop list with drag-to-reorder, add stop button floating over map
- Each stop card: Location name, travel method dropdown, accommodation toggle with details
- Bottom navigation: Back to Trip and Continue to Budget buttons

### Budget Page
- Two-column layout: Budget items list (left 60%) + Summary card (right 40%, sticky)
- Add budget item button at top with quick category icons
- Item list with category grouping and subtotals
- Summary card shows total budget, allocated, remaining with progress visualization

### Spending Page
- Timeline view of expenses sorted by date
- Add spending button floating bottom-right
- Each entry expandable to show split details and receipt option
- Top bar: Total spent, Remaining, Per person breakdown
- Export PDF button in header

### My Trips
- Filter tabs: All, Current, Upcoming, Past
- Trip cards with quick actions overlay on hover
- Each card: Preview image, trip name, dates, budget status, member avatars, View/Edit/Delete actions

## Animations

**Minimal, Purposeful Motion:**
- Card hover: Subtle lift (translate-y-1) and shadow increase
- Button click: Scale down (scale-95) feedback
- Page transitions: Fade in content (opacity 0 to 1, 200ms)
- Loading states: Skeleton screens with shimmer effect
- Notification entry: Slide-in from top-right (300ms ease-out)
- Map markers: Bounce on add (once only)
- Live location: Pulse effect on active trip status

## Images

**Hero Image (Splash Page):**
- Large, inspiring travel photography showcasing diverse destinations (mountains, beaches, cities)
- Optimized for performance, served at multiple resolutions
- Subtle gradient overlay for text readability

**Trip Card Images:**
- User-uploaded or destination stock imagery
- 16:9 aspect ratio, minimum 800x450px
- Optimistic UI: Show placeholder immediately on upload

**Profile Avatars:**
- Circular, 40x40 to 128x128 depending on context
- Fallback to initials with generated background colors

**Empty State Illustrations:**
- Simple line art style for "No trips yet," "No spending recorded"
- Friendly, encouraging tone

**Icon Library:** Heroicons (via CDN) for all UI icons - use outline for navigation, solid for emphasis

This design system creates a premium travel planning experience that balances emotional engagement with practical utility, ensuring users feel inspired while maintaining complete control over their trip finances and logistics.