---
name: Aries 11 Bakehouse
description: A warm, made-to-order bakery storefront for Abeokuta, Nigeria
colors:
  cream: "#F5EBD6"
  white: "#FFFDF8"
  choc: "#2B140F"
  cocoa: "#684234"
  olive: "#69704A"
  caramel: "#B9804A"
  border: "#D8CBBE"
  whatsapp: "#25D366"
  error: "#93412E"
  text-muted: "#5c443f"
  text-faint: "#8a7368"
typography:
  display:
    fontFamily: "'Cormorant Garamond', serif"
    fontSize: "clamp(28px, 5vw, 48px)"
    fontWeight: 400
    fontStyle: "italic"
    lineHeight: 1.3
  headline:
    fontFamily: "'DM Sans', sans-serif"
    fontSize: "clamp(32px, 4vw, 44px)"
    fontWeight: 800
    lineHeight: 1.15
  body:
    fontFamily: "'DM Sans', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'DM Sans', sans-serif"
    fontSize: "12px"
    fontWeight: 800
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "8px"
  lg: "8px"
  pill: "999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "24px"
  6: "32px"
  7: "48px"
  8: "64px"
  9: "96px"
components:
  button-primary:
    backgroundColor: "{colors.choc}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-primary-hover:
    backgroundColor: "{colors.cocoa}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.choc}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-whatsapp:
    backgroundColor: "{colors.whatsapp}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "18px"
---

# Design System: Aries 11 Bakehouse

## Overview

**Creative North Star: "The Warm Bakehouse Counter"**

Aries 11 Bakehouse reads like the counter of a real neighborhood bakery, not a generic e-commerce template: a deep-chocolate-and-cream palette, fully pill-shaped buttons and inputs, and a single soft ambient shadow doing all the "lift" the interface needs. It is confident without being loud — no gradients, no heavy drop shadows, no corporate blue. An italic serif (Cormorant Garamond) appears only on select display phrases (hero headlines, order-confirmation moments) as a handwritten-menu-board accent against an otherwise all-sans (DM Sans) interface; that contrast is the system's one deliberate flourish.

The system is nearly flat by design: cards rest on a bare cream background with barely-there shadows, and depth is implied by spacing and color contrast rather than elevation. Rejected explicitly: sharp corners (nothing in the product uses less than a pill or 8px radius), heavy card shadows, and any accent color outside the chocolate/cocoa/olive/caramel family.

**Key Characteristics:**
- Deep chocolate + cream as the whole palette; caramel and olive as the only accents
- Pill-shaped buttons and inputs everywhere — no sharp-cornered interactive elements
- One soft ambient card shadow; otherwise flat
- Serif italic (Cormorant Garamond) reserved for display moments; DM Sans for everything else
- WhatsApp green (`#25D366`) is the one color intentionally borrowed from outside the palette, used only for the WhatsApp CTA so it reads as "this really opens WhatsApp"

## Colors

The palette is a tight, warm chocolate-and-cream family with two accent notes — nothing reads as generic "blue-500" e-commerce blue anywhere in the system.

### Primary
- **Deep Chocolate** (`#2B140F`): the system's anchor — primary button background, all body text color, focus rings, header/nav text.

### Secondary
- **Warm Cocoa** (`#684234`): primary button hover state, muted supporting text, WhatsApp/contact links.
- **Bakehouse Olive** (`#69704A`): section eyebrows/labels, success/olive badges, secondary accents that need to read as "confirmed" without being the primary action color.

### Tertiary
- **Caramel** (`#B9804A`): the warmest accent — badges, text selection highlight, small decorative touches. Used sparingly, never as a button background.

### Neutral
- **Cream** (`#F5EBD6`): the page background — this is not a "white app," it's a warm cream canvas.
- **Card White** (`#FFFDF8`): card/surface background, one shade lighter than pure white to stay warm.
- **Hairline Border** (`#D8CBBE`): dividers and low-emphasis borders.
- **Muted Text** (`#5c443f`) / **Faint Text** (`#8a7368`): secondary and tertiary text, both warm-toned, never cool gray.
- **Error** (`#93412E`): validation and error states — a muted brick-red that stays inside the warm family rather than a jarring pure red.
- **WhatsApp Green** (`#25D366`): reserved exclusively for the WhatsApp CTA/button; the one deliberate exception to the warm palette because it needs to be instantly recognizable as WhatsApp.

### Named Rules
**The One Family Rule.** Every color on the site is either chocolate/cocoa/cream/caramel/olive or the single, deliberate WhatsApp green exception. No blue, no purple, no generic UI gray — a new color needs a specific, stated reason to exist.

## Typography

**Display Font:** Cormorant Garamond (serif, italic, weight 400)
**Body/Headline Font:** DM Sans (sans-serif)

**Character:** DM Sans carries nearly the entire interface — confident, geometric, at-ease at both 800-weight headlines and 12px uppercase labels. Cormorant Garamond italic is the one indulgence, appearing only on a handful of display phrases (hero sub-headline, "Craving" in the hero title, order-confirmation heading) where it should feel like a chalked accent on a bakery menu board, not a competing voice.

### Hierarchy
- **Display** (400, italic, `clamp(28px, 5vw, 48px)`, 1.3): reserved for the handful of Cormorant Garamond moments — hero accent word, confirmation headline.
- **Headline** (800, `clamp(32px, 4vw, 44px)`, 1.15): page titles in DM Sans.
- **Title** (700-800, 16–20px): card titles, section headers.
- **Body** (400, 14px, 1.6): the default paragraph/UI text size across the app.
- **Label** (800, 12px, letter-spacing 0.08em, uppercase): section eyebrows ("STATUS", "ITEMS") — always olive or cocoa, never chocolate.

### Named Rules
**The One Flourish Rule.** Cormorant Garamond italic appears on at most one phrase per screen. If a screen wants a second display moment, it stays in DM Sans at a larger weight instead of doubling up the serif accent.

## Layout

Content is constrained to a `1280px` max-width `.container`, with responsive horizontal padding that steps down as the viewport narrows (`64px` → `32px` at ≤1023px → `20px` at ≤767px). Spacing follows an 8-point-ish scale (`4/8/12/16/24/32/48/64/96px`) rather than an arbitrary set of one-off values. Below 767px, primary actions (checkout pay button, product add-to-cart) move into a fixed bottom "mobile sticky action" bar with a blurred translucent background, rather than staying inline at the bottom of a long scroll.

## Elevation & Depth

The system is flat by deliberate choice, confirmed for this pass: almost nothing casts a real shadow. Cards use exactly one soft, low-opacity ambient shadow (`0 2px 6px rgba(50,26,23,0.08)`) that reads as a whisper of lift, not a floating panel. The one exception is the mobile sticky action bar, which uses a stronger upward shadow (`0 -12px 28px rgba(50,26,23,0.14)`) plus a backdrop blur, because it needs to visually separate from scrolling content beneath it.

### Shadow Vocabulary
- **Card ambient** (`box-shadow: 0 2px 6px rgba(50,26,23,0.08)`): default and only shadow for `.card` surfaces.
- **Sticky bar lift** (`box-shadow: 0 -12px 28px rgba(50,26,23,0.14)` + `backdrop-filter: blur(10px)`): mobile bottom action bar only.

### Named Rules
**The Whisper-Lift Rule.** No card or panel gets more shadow than the single ambient token above. If something needs to feel more important, raise its content weight or spacing — never stack a second shadow tier.

## Shapes

Radius is binary: pill (`999px`) for every button, input, textarea, select, and badge, or a flat `8px` for cards and skeleton loaders. There is no sharp-cornered (0px radius) interactive element anywhere in the system, and no radius scale beyond these two steps — resist introducing a `12px` or `16px` "in-between" radius.

## Components

### Buttons
- **Shape:** fully pill (`border-radius: 999px`), no exceptions.
- **Primary:** Deep Chocolate background (`#2B140F`), white text, `14px 28px` padding; hover darkens to Cocoa (`#684234`).
- **Secondary:** transparent background, Deep Chocolate text and 1.5px Deep Chocolate border; hover inverts to a solid Chocolate fill with white text.
- **WhatsApp:** solid WhatsApp Green (`#25D366`), white text — the only button variant allowed to break the core palette.
- **Sizes:** `btn-sm` (10px/20px padding, 13px type) and `btn-lg` (17px/32px padding, 15px type) scale the same shape up/down; there is no separate visual language per size.
- **Loading state:** `aria-busy="true"` swaps label text for a spinning ring in the button's own text color — never a separate spinner component or layout shift.

### Cards / Containers
- **Corner Style:** flat `8px` radius (`--radius-lg`).
- **Background:** Card White (`#FFFDF8`), always sitting on the Cream (`#F5EBD6`) page background — the contrast between these two near-white tones is what separates a card from the page, not a shadow or border.
- **Shadow Strategy:** the single ambient card shadow (see Elevation & Depth) — never stack a border and a heavy shadow together.

### Inputs / Fields
- **Style:** Cream background (matches the page, not a jarring white box), 1.5px hairline border at 15% opacity Chocolate, `8px` radius, `13px 16px` padding.
- **Focus:** border shifts to solid Deep Chocolate plus a soft `0 0 0 3px rgba(50,26,23,0.08)` glow ring — no color change, no layout shift.
- **Error:** border and glow switch to the Error brick-red (`#93412E`), same ring treatment.

### Navigation
- Desktop nav is text-only DM Sans links in Deep Chocolate; mobile collapses to a hamburger. No pill "chip" nav treatment — navigation stays understated so the product photography and CTAs carry the visual weight.

## Do's and Don'ts

### Do:
- **Do** keep every button, input, select, and textarea fully pill-shaped or `8px`-radius on cards — never introduce a third radius value.
- **Do** keep Cormorant Garamond italic rare — one display moment per screen, per the One Flourish Rule.
- **Do** keep the WhatsApp button's green as the only non-palette color anywhere in the UI.
- **Do** use the single ambient card shadow for any new elevated surface; don't invent a second, heavier shadow tier.

### Don't:
- **Don't** introduce blue, purple, or neutral gray as an accent — every new color needs a stated reason to break the One Family Rule.
- **Don't** add a second serif/display font family; Cormorant Garamond is the only display voice.
- **Don't** give any interactive element a sharp (non-pill, non-8px) corner.
- **Don't** stack multiple shadow tiers or add a drop shadow to text — the system's depth budget is intentionally almost zero.
