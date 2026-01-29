# Style Forage: Architecture & Best Practices

This document outlines the technical architecture and development standards for the Style Forage web application.

## 🚀 Tech Stack

- **Framework**: React 18.2.0 (ES6 Modules)
- **Styling**: Tailwind CSS (Utility-first CSS)
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **AI Integration**: Google Gemini API (@google/genai)
- **Routing**: React Router DOM 6 (HashRouter)

## 📁 Project Structure

- `components/`: Modular UI units.
  - `layout/`: Global structures like Header and Footer.
  - `sections/`: Large page sections (Hero, About, Testimonials).
  - `ui/`: Atom-level components (Buttons, Inputs).
- `pages/`: Page-level components associated with routes.
- `services/`: External API logic (Gemini API).
- `types.ts`: Shared TypeScript interfaces and enums.

## 🛠 Architectural Patterns

### 1. Component Composition
We favor composition over inheritance. Large sections are broken down into reusable UI components to maintain a clean `pages/` directory.

### 2. State Management
- **Local State**: Most interactivity is handled via `useState` and `useRef`.
- **Prop Drilling**: Minimized by keeping state close to where it's used. For the `BookingWizard`, a single `state` object manages the multi-step funnel.

### 3. Navigation & Scrolling
- **Fixed Header**: Implements an "Auto-Hide" pattern (hides on scroll down, reveals on scroll up) using passive scroll listeners.
- **Anchor Links**: Managed via a `ScrollToTop` helper in `App.tsx` and custom `scrollToAnchor` functions to handle cross-page navigation.

### 4. AI Strategy
The `AiStylist` component interacts with the `gemini-3-flash-preview` model. 
- **System Instructions**: Define a specific persona (Sophisticated, Accessible, Concise).
- **Error Handling**: Graceful fallbacks for missing API keys or connection issues.

## 💎 Best Practices

- **Performance**: Use passive listeners for scroll events. Avoid heavy re-renders in the Testimonials slider by using `useCallback`.
- **Accessibility**: Use semantic HTML (`<header>`, `<main>`, `<section>`). Ensure interactive elements have `aria-label` where text is not present.
- **Responsive Design**: Mobile-first approach using Tailwind's `md:` and `lg:` breakpoints.
- **Clean Code**: Extract complex logic (like the infinite scroll carousel) into dedicated hooks or well-commented functions.
