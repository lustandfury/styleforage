# Style Forage: Design System & Style Guide

A guide to the visual language and user experience principles of Style Forage.

## 🎨 Color Palette

The palette is inspired by natural textures (Sage, Sand, Stone) to evoke a sense of calm, high-end sophistication.

| Name | Variable | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Sage 500** | `bg-sage-500` | `#8cae8c` | Primary actions, accents, active states. |
| **Sage 50** | `bg-sage-50` | `#f4f7f4` | Soft backgrounds, UI containers. |
| **Stone 900** | `text-stone-900` | `#1c1917` | Primary headings, dark backgrounds. |
| **Stone 500** | `text-stone-500` | `#78716c` | Body text, secondary information. |
| **Sand 100** | `bg-sand-100` | `#f7f1e6` | Tertiary backgrounds, warm accents. |

## Typography

We use a "Serif for Soul, Sans for Clarity" approach.

- **Serif: Playfair Display**
  - *Usage*: Main headings, quotes, brand logo.
  - *Feel*: Elegant, editorial, timeless.
- **Sans: Inter**
  - *Usage*: Body text, buttons, form labels, metadata.
  - *Feel*: Modern, highly legible, professional.

## 📐 Layout & Components

### 1. Spacing
- Sections use consistent vertical padding (`py-24` or `py-32`).
- Grids typically use a `gap-8` (32px) for a breathable, "foraged" feel.

### 2. Cards & Containers
- **Border Radius**: Large radii are preferred (`rounded-3xl` for cards, `rounded-full` for buttons).
- **Shadows**: Subtle `shadow-sm` by default, upgrading to `shadow-xl` or `shadow-2xl` on hover to imply depth.
- **Borders**: Soft borders using `border-stone-100` to define space without harsh lines.

### 3. Buttons
- **Primary**: Dark stone with white text. High contrast for CTA.
- **Secondary/Outline**: Sage accents or transparent backgrounds for secondary actions.

## ✨ Visual Signatures

- **Glassmorphism**: The header uses `backdrop-blur-md` with `bg-white/95` to feel integrated with the content below it.
- **Micro-animations**: Subtle `hover:-translate-y-2` on cards and `animate-fade-in` on page loads to provide a premium, reactive feel.
- **Imagery**: High-quality, editorial fashion photography with generous whitespace.

## ✍️ Tone of Voice

- **Encouraging**: We don't judge closets; we curate confidence.
- **Actionable**: Every tip or service description should lead to a clear "next step."
- **Concise**: Respect the user's time. Clear, punchy headlines over long paragraphs.
