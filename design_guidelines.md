# OmahaShareHub Design Guidelines

## Design Approach: Professional Marketplace System

**Framework**: Hybrid approach combining Material Design's structured patterns with Thumbtack/Upwork's two-sided marketplace UI conventions. Emphasis on trust signals, clear hierarchy, and professional aesthetics.

**Core Principles**: 
- Trust-first design with verification badges and social proof
- Dual user experience (homeowners + contractors) with role-specific dashboards
- Scannable content hierarchy for quick decision-making
- Professional polish without sacrificing approachability

---

## Color System

**Primary Colors (Dark Mode)**:
- **Brand Navy**: 220 85% 25% - primary brand, headers, primary buttons
- **Brand Navy Light**: 220 75% 35% - hover states, active elements
- **Ocean Blue**: 210 90% 45% - links, secondary actions

**Accent Colors**:
- **Trust Green**: 145 60% 45% - verification badges, success states
- **Action Coral**: 15 80% 55% - primary CTAs, urgent actions
- **Warning Amber**: 35 90% 50% - alerts, pending states

**Neutrals**:
- Background: 220 15% 10%
- Surface: 220 12% 15%
- Surface Elevated: 220 10% 18%
- Border: 220 8% 25%
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 70%
- Text Muted: 0 0% 50%

**Light Mode** (inverse approach):
- Background: 220 20% 98%
- Surface: 0 0% 100%
- Brand Navy: 220 85% 35%

---

## Typography

**Font Stack**: 
- **Primary**: Inter (Google Fonts) - UI, body text, forms
- **Headings**: Outfit (Google Fonts) - display, section headers

**Type Scale**:
- Hero Display: text-6xl font-bold (Outfit)
- H1: text-4xl font-bold (Outfit)
- H2: text-3xl font-semibold (Outfit)
- H3: text-2xl font-semibold (Inter)
- Body Large: text-lg (Inter)
- Body: text-base (Inter)
- Small: text-sm font-medium
- Caption: text-xs text-muted

---

## Layout System

**Spacing Primitives**: Tailwind units of **2, 4, 8, 12, 16** (e.g., p-4, gap-8, mb-12)

**Grid Structure**:
- Container: max-w-7xl mx-auto px-4 md:px-8
- Card Grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Dashboard Layouts: Sidebar (280px) + Main content area
- Content Max Width: max-w-4xl for reading areas

**Breakpoints** (Tailwind defaults):
- Mobile: base (< 768px)
- Tablet: md (768px+)
- Desktop: lg (1024px+)
- Wide: xl (1280px+)

---

## Component Library

### Navigation
**Primary Header**:
- Fixed top navigation with backdrop blur
- Logo left, primary CTA right ("Post a Project" + "Find Work")
- User avatar with dropdown (Messages, Projects, Settings)
- Role toggle for dual-role users (Owner ⇄ Contractor)

### Hero Section (Homepage)
**Layout**: Full-width hero (90vh) with professional imagery
- Centered content with max-w-3xl
- H1 headline + descriptive subheading
- Dual CTA buttons: "Hire Contractors" (Action Coral) + "Find Projects" (outline variant with blurred background)
- Quick search bar (location + service type)
- Trust indicators below: "500+ Verified Contractors" | "1,200+ Projects Completed"

### Cards

**Contractor Profile Card**:
- Avatar (96px rounded-full) with verification badge overlay
- Name + specialties (badges)
- Star rating + review count
- Hourly rate range
- Response time indicator
- "View Profile" + "Message" CTAs
- Hover: Subtle lift with shadow-lg

**Project Listing Card**:
- Project thumbnail image (16:9 aspect)
- Budget badge (top-right overlay)
- Project title + brief description
- Location + posted date
- Skills required (pill badges)
- "View Details" + Quick actions
- Status indicator (Open/In Progress/Completed)

**Message Thread Card**:
- User avatar + name
- Last message preview (truncated)
- Timestamp + unread count badge
- Hover: Background change to Surface Elevated

### Forms & Inputs

**Input Fields**:
- Consistent height: h-12
- Border: 2px solid Border color
- Focus state: border-Ocean-Blue with ring-2 ring-Ocean-Blue/20
- Dark backgrounds: bg-Surface
- Labels: text-sm font-medium mb-2
- Error states: border-red-500 with error text below

**Buttons**:
- Primary (Action Coral): px-6 py-3 rounded-lg font-semibold
- Secondary (Brand Navy): px-6 py-3 rounded-lg
- Outline: border-2 variant with blurred background (backdrop-blur-sm bg-Surface/80) when on images
- Icon buttons: p-3 rounded-lg
- States: Built-in hover/active (no custom implementation needed)

### Trust Elements

**Verification Badges**:
- Background verified icon + "Background Verified" text
- Insurance verified + "Insured & Bonded"
- Elite status badge (for top performers)
- Placement: Profile headers, search results

**Review Display**:
- Star rating (gold stars) + numerical rating
- Review count as link
- Recent review cards with reviewer avatar + quote + date
- Helpful vote count

### Booking & Project Management

**Project Dashboard Cards**:
- Status timeline (visual progress bar)
- Milestone checklist
- File attachments area
- Message thread integration
- Payment escrow status

**Booking Request Modal**:
- Service selection dropdown
- Date/time picker (calendar component)
- Budget range slider
- Project description textarea (min-h-32)
- File upload area (drag & drop)
- "Submit Request" (Action Coral button)

### Messaging Interface

**Chat Layout**:
- Left sidebar: Thread list (280px width)
- Main area: Active conversation
- Message bubbles: Sent (Brand Navy bg) vs Received (Surface bg)
- Input bar: Fixed bottom with attachment + send buttons
- Typing indicators
- Read receipts (subtle checkmarks)

---

## Images

**Hero Section**: 
- Large background image (1920x1080): Professional contractor working on modern Omaha home exterior, warm natural lighting
- Slight overlay (bg-black/40) for text readability

**Contractor Profiles**: 
- Professional headshots (400x400): Approachable contractors in work attire

**Project Thumbnails**: 
- Before/After home improvement shots (800x450)
- Clean, well-lit Omaha properties

**Category Icons**: 
- Use Heroicons (outline style) via CDN for service categories
- 24px size for cards, 32px for feature sections

---

## Accessibility & Dark Mode

- Maintain WCAG AA contrast ratios (4.5:1 text, 3:1 UI)
- Consistent dark mode across all form inputs/text fields
- Focus indicators: 2px ring in Ocean Blue
- Skip navigation links
- ARIA labels for icon-only buttons

---

## Key Differentiators

- **Dual-mode toggle**: Seamless switching between "Property Owner" and "Contractor" views
- **Trust-first design**: Verification badges, insurance indicators, review prominence
- **Professional polish**: Clean spacing, consistent shadows (shadow-sm for cards, shadow-lg for modals)
- **Omaha local branding**: Subtle Nebraska skyline illustration in footer
- **Real-time indicators**: Online status dots, typing indicators, read receipts create urgency and engagement