# Geist UI–Inspired Tailwind Design System Guideline

## Table of Contents

1. [Foundational Styles](#foundational-styles)  
   1. [Typography](#typography)  
   2. [Color Palette](#color-palette)  
   3. [Spacing](#spacing)  
   4. [Shadows and Elevation](#shadows-and-elevation)  
   5. [Borders and Radii](#borders-and-radii)  
2. [Light and Dark Theme Support](#light-and-dark-theme-support)  
3. [Component Styles](#component-styles)  
   1. [Buttons (Primary, Secondary, Ghost)](#buttons-primary-secondary-ghost)  
   2. [Inputs and Textareas](#inputs-and-textareas)  
   3. [Modal (Dialog)](#modal-dialog)  
   4. [Tooltip](#tooltip)  
   5. [Card](#card)  
   6. [Navigation (NavBar & Footer)](#navigation-navbar--footer)  
   7. [Toasts & Alerts](#toasts--alerts)  
4. [Tailwind Configuration and Setup](#tailwind-configuration-and-setup)  
   1. [Configure Dark Mode](#configure-dark-mode)  
   2. [Extend Theme – Fonts](#extend-theme--fonts)  
   3. [Extend Theme – Colors](#extend-theme--colors)  
   4. [Extend Theme – Spacing](#extend-theme--spacing)  
   5. [Extend Theme – Border Radius](#extend-theme--border-radius)  
   6. [Extend Theme – Box Shadow](#extend-theme--box-shadow)  
   7. [Plugins](#plugins)  
5. [Documentation and Usage](#documentation-and-usage)

---

## Foundational Styles

### Typography

- **Geist Font Family**  
  - Use **Geist Sans** for most UI text and **Geist Mono** for code or monospaced contexts.  
  - Geist is available via Google Fonts or Next.js font optimization.  
  - In Tailwind, extend the `fontFamily` so that `font-sans` maps to `"Geist Sans"` and `font-mono` maps to `"Geist Mono"`.  
  - Geist’s design system defines preset text sizes; for example:  
    - Large headings  
    - Body text  
    - Button text:  
      - Large buttons: 16px (use `text-base`)  
      - Default buttons: 14px (use `text-sm`)  
      - Small inline buttons: 12px (use `text-xs`)  

- **Usage in Tailwind**  
  ```css
  /* tailwind.config.js excerpt */
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist Sans"', 'ui-sans-serif', 'system-ui'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular'],
      },
      fontSize: {
        'btn-lg': '16px',  /* Corresponds to text-base */
        'btn-md': '14px',  /* Corresponds to text-sm */
        'btn-sm': '12px',  /* Corresponds to text-xs */
      },
      /* ...other extensions... */
    }
  }
````

---

### Color Palette

* **Neutral Grayscale**

  * Light mode:

    * `#FFFFFF` (primary background)
    * `#FAFAFA`, `#EAEAEA`, `#999999`, down to `#111111` (text and borders)
  * Dark mode:

    * Invert the grayscale values: black backgrounds, white text, and reversed gray scale for borders

* **Accent & Semantic Colors**

  * **Primary (Geist Blue)**

    * Default: `#0070f3`
    * Light: `#3291ff`
    * Dark: `#0761d1`
  * **Error (Geist Red)**

    * Default: `#E00` (hex shorthand for `#EE0000`)
    * Light: `#FF1A1A`
    * Dark: `#C50000`
  * **Warning (Geist Amber)**

    * Default: `#F5A623`
    * Light: `#F7B955`
    * Dark: `#AB570A`
  * **Success (Teal/Cyan)**

    * Default: `#50E3C2`
    * Light: `#79FFE1`
    * Dark: `#29BC9B`

* **Text Colors**

  * Primary text: black (`#000000`) in light, white (`#FFFFFF`) in dark
  * Secondary text: mid-gray (e.g., `#666666` in light, `#CCCCCC` in dark)

* **Example Tailwind Extension**

  ```js
  // tailwind.config.js excerpt
  theme: {
    extend: {
      colors: {
        background1: '#ffffff',
        background2: '#fafafa',
        foreground: '#000000',
        accentGray: {
          1: '#FAFAFA',
          2: '#EAEAEA',
          3: '#999999',
          4: '#888888',
          5: '#666666',
          6: '#444444',
          7: '#333333',
          8: '#111111',
        },
        primary: {
          DEFAULT: '#0070f3',
          light: '#3291ff',
          dark: '#0761d1',
        },
        error: {
          DEFAULT: '#e00',
          light: '#ff1a1a',
          dark: '#c50000',
        },
        warning: {
          DEFAULT: '#f5a623',
          light: '#f7b955',
          dark: '#ab570a',
        },
        success: {
          DEFAULT: '#50e3c2',
          light: '#79ffe1',
          dark: '#29bc9b',
        },
      },
    },
  },
  ```

---

### Spacing

* **4px Baseline Grid**

  * All spacing values are multiples of 4px.
  * Tailwind’s default spacing scale (increments of `0.25rem`, i.e., 4px) aligns perfectly.

* **Common Tokens**

  * 4px → `sp-1` (`0.25rem`)
  * 8px → `sp-2` (`0.5rem`)
  * 16px → `sp-4` (`1rem`)
  * 24px → `sp-6` (`1.5rem`)
  * 32px → `sp-8` (`2rem`)

* **Usage in Tailwind**

  ```html
  <div class="p-4 m-6 gap-6">
    <!-- p-4 = 16px padding; m-6 = 24px margin; gap-6 = 24px gap -->
  </div>
  ```

---

### Shadows and Elevation

* **Elevation Levels**

  * **None / Hairline / Border Only**: No shadow, just a 1px border
  * **Tooltip (Light Shadow)**: Very subtle
  * **Card / Panel (Medium Shadow)**: Slight lift
  * **Modal / Popover (Deeper Shadow)**: Noticeable lift

* **Recommended Shadow Tokens**

  * `shadow-xs`: `0 1px 2px rgba(0, 0, 0, 0.05)`
  * `shadow-sm`: `0 2px 4px rgba(0, 0, 0, 0.10)`
  * `shadow-md`: `0 4px 8px rgba(0, 0, 0, 0.10)`
  * `shadow-lg`: `0 8px 16px rgba(0, 0, 0, 0.12)`
  * `shadow-xl`: `0 12px 24px rgba(0, 0, 0, 0.15)`

* **Usage in Tailwind**

  ```js
  // tailwind.config.js excerpt
  theme: {
    extend: {
      boxShadow: {
        'xs': '0 1px 2px rgba(0,0,0,0.05)',
        'sm': '0 2px 4px rgba(0,0,0,0.1)',
        'md': '0 4px 8px rgba(0,0,0,0.1)',
        'lg': '0 8px 16px rgba(0,0,0,0.12)',
        'xl': '0 12px 24px rgba(0,0,0,0.15)',
      },
    },
  },
  ```

---

### Borders and Radii

* **Borders**

  * Default border: 1px solid neutral gray (`border-gray-300` in light; `border-gray-800` in dark)
  * Hover/Focus border: slightly darker (`border-gray-400` or `border-gray-700`)

* **Border Radius Tokens**

  * Small components: **6px** → `rounded` (or `rounded-md`)
  * Medium/Large surfaces: **12px** → `rounded-lg`
  * Very large/fullscreen elements: **16px** → `rounded-xl`

* **Usage in Tailwind**

  ```js
  // tailwind.config.js excerpt
  theme: {
    extend: {
      borderRadius: {
        none: '0',
        sm: '4px',
        DEFAULT: '6px',   // makes `rounded` = 6px
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      /* ...other extensions... */
    },
  },
  ```

---

## Light and Dark Theme Support

* **Enable Dark Mode**

  * In `tailwind.config.js`:

    ```js
    module.exports = {
      darkMode: 'class',
      /* ...rest of config... */
    }
    ```
  * Toggling between light and dark is as simple as adding or removing the `dark` class on the root element (e.g., `<html>` or `<body>`).

* **Defining Color Tokens for Both Themes**

  * **Approach A: CSS Custom Properties**

    * Define variables in `:root` for light mode, override them in `.dark { ... }`.
    * Use Tailwind’s arbitrary value syntax to reference variables (e.g., `bg-[var(--color-bg)]`).
  * **Approach B: Tailwind Dark Variants**

    * Define base (light) colors under `colors` in the config.
    * Use `dark:` prefixed utility classes to override colors in dark mode. For example:

      ```html
      <div class="bg-background1 text-foreground dark:bg-gray-900 dark:text-white">
        ...
      </div>
      ```

* **Example Light vs. Dark Color Usage**

  ```html
  <!-- Light mode -->
  <div class="bg-background1 text-foreground border border-gray-300">
    Content in light mode
  </div>

  <!-- Dark mode -->
  <div class="dark:bg-background1-dark dark:text-foreground-dark dark:border-gray-700">
    Content in dark mode
  </div>
  ```

* **Typography Plugin**

  * Install and configure `@tailwindcss/typography` so prose content automatically adapts to dark mode.

---

## Component Styles

### Buttons (Primary, Secondary, Ghost)

#### Primary Button

* **Purpose**: Main call-to-action.
* **Light Mode**: Background = primary color (`#0070f3`), Text = white.
* **Dark Mode**: Background = primary-dark (`#0761d1`) or white with black text (depending on branding).
* **Font**: Geist Sans, `font-medium`.
* **Padding**: `px-4 py-2` (16px × 8px).
* **Border Radius**: `rounded` (6px).
* **Hover/Focus**:

  * Change to lighter/darker shade of primary (e.g., hover = `#3291ff`).
  * Add smooth transition: `transition-colors duration-200`.
  * Optionally: add a subtle `shadow-md` on hover.
* **Disabled**: `opacity-50 cursor-not-allowed`.
* **Focus Ring**: `focus:outline-none focus:ring-2 focus:ring-primary-light`.

```html
<button
  class="
    bg-primary text-white font-medium px-4 py-2 rounded
    hover:bg-primary-light transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-primary-light
    dark:bg-primary-dark dark:text-black dark:hover:bg-primary
    disabled:opacity-50 disabled:cursor-not-allowed
  ">
  Primary Action
</button>
```

---

#### Secondary Button

* **Purpose**: Less-emphasized actions.
* **Variant 1 – Outline**:

  * Background: transparent
  * Border: `border border-primary`
  * Text: `text-primary`
  * Hover: fill with a very light primary tint (`bg-primary/10`)
* **Variant 2 – Neutral**:

  * Background: `bg-white` (light) or `bg-gray-800` (dark)
  * Border: `border border-gray-300` (light) or `border-gray-700` (dark)
  * Text: `text-black` (light) or `text-white` (dark)
  * Hover: fill with `bg-gray-100` (light) or `bg-gray-700` (dark)
* **Font**: Geist Sans, `font-medium`.
* **Padding**: `px-4 py-2` (16px × 8px).
* **Border Radius**: `rounded` (6px).

```html
<!-- Outline secondary button -->
<button
  class="
    bg-transparent border border-primary text-primary font-medium
    px-4 py-2 rounded hover:bg-primary/10 transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-primary-light
    dark:border-primary-dark dark:text-primary-dark dark:hover:bg-primary-dark/10
  ">
  Secondary Action
</button>

<!-- Neutral secondary button -->
<button
  class="
    bg-white border border-gray-300 text-black font-medium
    px-4 py-2 rounded hover:bg-gray-100 transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-primary-light
    dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700
  ">
  Secondary Action
</button>
```

---

#### Ghost Button

* **Purpose**: Minimal, typically used for links or inline actions.
* **Appearance**:

  * No solid background (`bg-transparent`).
  * Text in primary or neutral color (light: `text-black` or `text-primary`; dark: `text-white`).
  * Hover: subtle background change (`hover:bg-gray-100` light / `hover:bg-gray-800` dark).
* **Padding**: Minimal, e.g. `px-2 py-1` (8px × 4px) – just enough for a comfortable hit area.
* **Border Radius**: `rounded` (6px).
* **Transitions**: `transition-colors duration-150`.

```html
<button
  class="
    bg-transparent text-primary px-2 py-1 rounded 
    hover:bg-gray-100 transition-colors duration-150
    focus:outline-none focus:ring-2 focus:ring-primary-light
    dark:text-white dark:hover:bg-gray-800
  ">
  Ghost Action
</button>
```

---

### Inputs and Textareas

* **Base Styling**

  * Use Tailwind’s `@tailwindcss/forms` plugin to reset defaults.
  * Background: `bg-white` (light), `bg-gray-900` (dark).
  * Border: `border border-gray-300` (light), `border-gray-700` (dark).
  * Text: `text-black` (light), `text-white` (dark).
  * Font: Geist Sans, `text-base` (16px).
  * Padding: `px-3 py-2` (12px × 8px).
  * Border Radius: `rounded` (6px).

* **Placeholder Text**

  * `placeholder-gray-400` (light), `placeholder-gray-600` (dark).

* **Focus & Hover**

  * Border highlight: `focus:border-primary focus:ring-0`.
  * Optional focus ring: `focus:ring focus:ring-primary-light`.

* **Validation States**

  * Error: `border-error bg-error-lighter`
  * Success: `border-success bg-success-lighter`

```html
<input
  type="text"
  placeholder="Enter your name"
  class="
    bg-white border border-gray-300 text-black font-sans text-base
    px-3 py-2 rounded placeholder-gray-400
    focus:border-primary focus:ring-0
    dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-600
  "
/>

<textarea
  rows="4"
  class="
    bg-white border border-gray-300 text-black font-sans text-base
    px-3 py-2 rounded placeholder-gray-400
    focus:border-primary focus:ring-0
    dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-600
  "
  placeholder="Enter your message"
></textarea>
```

---

### Modal (Dialog)

* **Container**

  * Centered panel with max-width, padding, and shadow.
  * Background: `bg-background1` (light) or `bg-gray-900` (dark).
  * Border Radius: `rounded-lg` (12px).
  * Shadow: `shadow-lg` or `shadow-xl` (deeper).
  * Padding: `p-6` (24px).

* **Overlay Backdrop**

  * Full-screen semi-transparent black: `fixed inset-0 bg-black bg-opacity-40`.

* **Structure Example**

  ```html
  <!-- Backdrop -->
  <div class="fixed inset-0 bg-black bg-opacity-40"></div>

  <!-- Modal -->
  <div
    class="
      fixed inset-0 flex items-center justify-center z-50
      p-4
    ">
    <div
      class="
        bg-background1 dark:bg-gray-900
        rounded-lg shadow-xl
        max-w-lg w-full
        p-6
      ">
      <!-- Modal Header -->
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-foreground dark:text-white">
          Modal Title
        </h2>
        <button
          class="
            bg-transparent text-gray-500 hover:text-gray-700
            dark:text-gray-400 dark:hover:text-gray-200
            focus:outline-none
          ">
          ✕
        </button>
      </div>

      <!-- Modal Body -->
      <div class="mb-6">
        <p class="text-base text-foreground dark:text-gray-200">
          Modal content goes here. Use larger font sizes for readability.
        </p>
      </div>

      <!-- Modal Actions -->
      <div class="flex justify-end space-x-2">
        <button
          class="
            bg-secondary border border-gray-300 text-black
            font-medium px-4 py-2 rounded hover:bg-gray-100
            focus:outline-none focus:ring-2 focus:ring-primary-light
            dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700
          ">
          Cancel
        </button>
        <button
          class="
            bg-primary text-white font-medium px-4 py-2 rounded
            hover:bg-primary-light transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-light
            dark:bg-primary-dark dark:text-black dark:hover:bg-primary
          ">
          Confirm
        </button>
      </div>
    </div>
  </div>
  ```

---

### Tooltip

* **Appearance**

  * High-contrast background:

    * Light mode tooltip: `bg-gray-900 text-white`
    * Dark mode tooltip: `bg-gray-100 text-black`
  * Font size: `text-xs` or `text-sm` (12px–14px).
  * Padding: `px-2 py-1` (8px × 4px).
  * Border Radius: `rounded-sm` or `rounded` (6px).
  * Shadow: `shadow-sm` (very subtle).

* **Arrow (Triangle Stem)**

  * Use a CSS pseudo-element to create a small triangle matching the tooltip background.
  * Position absolutely so it points to the target element.

* **Transitions**

  * Fade in/out: `transition-opacity duration-150 ease-in-out`.

* **Example Markup**

  ```html
  <div class="relative group">
    <!-- Target element -->
    <button class="px-4 py-2 bg-primary text-white rounded focus:outline-none">
      Hover Me
    </button>

    <!-- Tooltip -->
    <div
      class="
        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
        w-max bg-gray-900 text-white text-xs px-2 py-1 rounded
        shadow-sm opacity-0 group-hover:opacity-100
        transition-opacity duration-150
        dark:bg-gray-100 dark:text-black
      ">
      Tooltip text
      <!-- Arrow -->
      <div
        class="
          absolute left-1/2 transform -translate-x-1/2
          bottom-[-4px]  /* Position just below tooltip */
          w-0 h-0
          border-l-4 border-r-4 border-t-4
          border-l-transparent border-r-transparent
          border-t-gray-900
          dark:border-t-gray-100
        ">
      </div>
    </div>
  </div>
  ```

---

### Card

* **Appearance**

  * Background: `bg-background1` (light) or `bg-gray-800` (dark).
  * Border: `border border-gray-300` (light) or `border-gray-700` (dark), or replace with a subtle shadow (`shadow-sm`) for “raised” look.
  * Border Radius: `rounded-md` (6px).
  * Padding: `p-4` (16px) or `p-6` (24px).

* **Hover/Active**

  * If clickable: `hover:shadow-md` or darken border (`hover:border-gray-400` / `hover:border-gray-600`).
  * Cursor becomes pointer.

* **Example Markup**

  ```html
  <div
    class="
      bg-background1 dark:bg-gray-800
      border border-gray-300 dark:border-gray-700
      rounded-md shadow-sm
      p-6
      hover:shadow-md hover:border-gray-400 dark:hover:border-gray-600
      transition-shadow transition-border duration-200
    ">
    <h3 class="text-lg font-semibold text-foreground dark:text-white mb-2">
      Card Title
    </h3>
    <p class="text-base text-secondary dark:text-gray-300">
      Card body content goes here. Keep it concise and clear.
    </p>
  </div>
  ```

---

### Navigation (NavBar & Footer)

#### NavBar (Header)

* **Appearance**

  * Height: `h-16` (64px).
  * Background: `bg-white border-b border-gray-200` (light); `bg-black border-b border-gray-800` (dark).
  * Text: `text-black` (light); `text-white` (dark).
  * Padding: `px-6 py-3` (24px × 12px).
  * Display: `flex items-center justify-between`.
  * Z-index: `z-50` (if sticky).

* **Links**

  * Inactive: `text-gray-600` (light), `text-gray-400` (dark).
  * Hover/Active: `text-black` (light), `text-white` (dark).
  * Spacing between links: `space-x-4` or `space-x-6`.

* **Example Markup**

  ```html
  <header class="sticky top-0 z-50 bg-white border-b border-gray-200 dark:bg-black dark:border-gray-800">
    <div class="container mx-auto flex items-center justify-between h-16 px-6">
      <!-- Logo -->
      <a href="/" class="text-lg font-semibold text-black dark:text-white">
        MyApp
      </a>

      <!-- Nav Links -->
      <nav class="flex space-x-6">
        <a href="/docs" class="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white">
          Docs
        </a>
        <a href="/blog" class="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white">
          Blog
        </a>
        <a href="/about" class="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white">
          About
        </a>
      </nav>
    </div>
  </header>
  ```

---

#### Footer

* **Appearance**

  * Background: `bg-gray-50` (light), `bg-gray-900` (dark).
  * Text: `text-gray-600` (light), `text-gray-400` (dark).
  * Padding: `py-8` (32px).
  * Border-top: `border-t border-gray-200` (light), `border-t border-gray-800` (dark).
  * Font size: `text-sm`.

* **Example Markup**

  ```html
  <footer class="bg-gray-50 border-t border-gray-200 dark:bg-gray-900 dark:border-gray-800">
    <div class="container mx-auto px-6 py-8">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 md:mb-0">
          © 2025 MyCompany. All rights reserved.
        </p>
        <div class="flex space-x-4">
          <a href="/privacy" class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm">
            Privacy Policy
          </a>
          <a href="/terms" class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm">
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  </footer>
  ```

---

### Toasts & Alerts

#### Toast

* **Purpose**: Transient notification that appears in a corner, auto-dismisses.

* **Container**

  * Position: `fixed bottom-4 right-4` (for bottom-right), or choose top-right with `top-4 right-4`.
  * Width: `max-w-xs` or `max-w-sm`.
  * Background & Text:

    * Success: `bg-success-lighter text-success`
    * Error: `bg-error-lighter text-error`
    * Warning: `bg-warning-lighter text-warning`
    * Info: `bg-primary-lighter text-primary`
  * Border Radius: `rounded-md` (6px).
  * Shadow: `shadow-md`.
  * Padding: `p-4` (16px).

* **Icon**: Small icon (20px–24px) in accent color at top-left or inline.

* **Example Markup**

  ```html
  <div
    class="
      fixed bottom-4 right-4 max-w-xs
      bg-success-lighter text-success
      rounded-md shadow-md
      p-4 flex items-start space-x-3
      dark:bg-success-lightest dark:text-success-dark
    ">
    <!-- Icon -->
    <svg class="w-6 h-6 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <!-- checkmark icon -->
      <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>

    <!-- Text -->
    <div class="flex-1">
      <p class="font-medium">Success!</p>
      <p class="text-sm">Your changes have been saved.</p>
    </div>

    <!-- Close Button -->
    <button
      class="
        text-success hover:text-success-dark
        focus:outline-none ml-2
      ">
      ✕
    </button>
  </div>
  ```

---

#### Alert

* **Purpose**: Inline banner to show persistent messages on a page.

* **Appearance**

  * Container: `rounded border-l-4 p-4 flex items-start space-x-2`.
  * Background & Text:

    * Error: `bg-error-lighter border-error text-error`
    * Success: `bg-success-lighter border-success text-success`
    * Warning: `bg-warning-lighter border-warning text-warning`
    * Info: `bg-primary-lighter border-primary text-primary`
  * Icon: Small accent-colored icon on left.
  * Close button: Ghost-style (transparent background, accent-colored icon).

* **Example Markup**

  ```html
  <div class="rounded border-l-4 border-error bg-error-lighter text-error p-4 flex items-start space-x-3">
    <!-- Icon -->
    <svg class="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
      <!-- error icon -->
      <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>

    <!-- Text -->
    <div class="flex-1">
      <p class="font-semibold">Error:</p>
      <p class="text-sm">Something went wrong. Please try again.</p>
    </div>

    <!-- Close Button -->
    <button
      class="
        bg-transparent text-error hover:text-error-dark
        focus:outline-none
      ">
      ✕
    </button>
  </div>
  ```

---

## Tailwind Configuration and Setup

### 1. Configure Dark Mode

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  /* ...rest of config... */
}
```

* Use the `.dark` class on `<html>` or `<body>` to toggle dark mode.
* Apply `dark:` variants to utilities for dark-specific styles.

---

### 2. Extend Theme – Fonts

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist Sans"', 'ui-sans-serif', 'system-ui'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular'],
      },
    },
  },
  /* ... */
}
```

* Import Geist fonts via Google Fonts or Next.js font optimization.

---

### 3. Extend Theme – Colors

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        /* Neutral Palette */
        background1: '#ffffff',      /* Light mode page background */
        background2: '#fafafa',      /* Secondary background */
        foreground: '#000000',       /* Primary text */
        accentGray: {
          1: '#FAFAFA',
          2: '#EAEAEA',
          3: '#999999',
          4: '#888888',
          5: '#666666',
          6: '#444444',
          7: '#333333',
          8: '#111111',
        },

        /* Semantic Colors */
        primary: {
          DEFAULT: '#0070f3',
          light: '#3291ff',
          dark: '#0761d1',
        },
        error: {
          DEFAULT: '#e00',
          light: '#ff1a1a',
          dark: '#c50000',
        },
        warning: {
          DEFAULT: '#f5a623',
          light: '#f7b955',
          dark: '#ab570a',
        },
        success: {
          DEFAULT: '#50e3c2',
          light: '#79ffe1',
          dark: '#29bc9b',
        },
      },
    },
  },
  /* ... */
}
```

---

### 4. Extend Theme – Spacing

* **Default Tailwind spacing** already uses 4px multiples (`0.25rem`, `0.5rem`, `1rem`, etc.).
* No further extension is required unless you need custom aliases.

---

### 5. Extend Theme – Border Radius

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      borderRadius: {
        none: '0',
        sm: '4px',
        DEFAULT: '6px',  /* `rounded` = 6px */
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  /* ... */
}
```

* Use `rounded` (6px) for most components.
* Use `rounded-lg` (12px) for modals, large cards.
* Use `rounded-xl` (16px) for very large containers or fullscreen elements.

---

### 6. Extend Theme – Box Shadow

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.05)',    /* Subtle border-like shadow */
        sm: '0 2px 4px rgba(0,0,0,0.10)',    /* Tooltip */
        md: '0 4px 8px rgba(0,0,0,0.10)',    /* Card */
        lg: '0 8px 16px rgba(0,0,0,0.12)',   /* Raised card / popover */
        xl: '0 12px 24px rgba(0,0,0,0.15)',  /* Deep modal shadow */
      },
    },
  },
  /* ... */
}
```

* Apply `shadow-sm`, `shadow-md`, `shadow-lg`, etc., as needed per component.

---

### 7. Plugins

* **@tailwindcss/forms**

  * Normalizes and styles form elements consistently.
  * Install:

    ```bash
    npm install @tailwindcss/forms
    ```
  * Add to config:

    ```js
    // tailwind.config.js
    module.exports = {
      plugins: [
        require('@tailwindcss/forms'),
        // other plugins...
      ],
      /* ... */
    }
    ```

* **@tailwindcss/typography**

  * Provides `prose` classes for rich text content (e.g., blog posts, documentation).
  * Automatically adapts to dark mode if configured.
  * Install:

    ```bash
    npm install @tailwindcss/typography
    ```
  * Add to config:

    ```js
    // tailwind.config.js
    module.exports = {
      plugins: [
        require('@tailwindcss/typography'),
        /* ... */
      ],
      /* ... */
    }
    ```

* **Optional Plugins**

  * `@tailwindcss/aspect-ratio`
  * `@tailwindcss/line-clamp`
  * Install and add to the `plugins` array as needed.

---

## Documentation and Usage

1. **Install Tailwind**

   * Follow the official setup guide: [https://tailwindcss.com/docs/installation](https://tailwindcss.com/docs/installation)
   * Ensure you have a `tailwind.config.js` file with the above extensions.

2. **Import Geist Fonts**

   * Add in your HTML `<head>`:

     ```html
     <link
       href="https://fonts.googleapis.com/css2?family=Geist+Sans:wght@400;500&family=Geist+Mono:wght@400&display=swap"
       rel="stylesheet"
     >
     ```
   * Or, if using Next.js:

     ```js
     // next.config.js or a custom font loader
     import { Geist_Sans, Geist_Mono } from 'next/font/google';

     const geistSans = Geist_Sans({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-geist-sans' });
     const geistMono = Geist_Mono({ subsets: ['latin'], weight: ['400'], variable: '--font-geist-mono' });
     ```

3. **Apply Tailwind Directives**

   * In your global CSS (e.g., `globals.css`):

     ```css
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
     ```

4. **Building Components**

   * Use the utility classes defined above to build React components.
   * Optionally, create reusable React component wrappers (e.g., `<Button variant="primary" />`).

   ```jsx
   import React from 'react';

   const Button = ({ variant = 'primary', children, ...props }) => {
     const baseClasses = 'font-medium rounded px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-2';
     const variants = {
       primary: 'bg-primary text-white hover:bg-primary-light focus:ring-primary-light dark:bg-primary-dark dark:text-black dark:hover:bg-primary',
       secondary: 'bg-transparent border border-primary text-primary hover:bg-primary/10 focus:ring-primary-light dark:border-primary-dark dark:text-primary-dark dark:hover:bg-primary-dark/10',
       ghost: 'bg-transparent text-primary hover:bg-gray-100 focus:ring-primary-light dark:text-white dark:hover:bg-gray-800',
     };
     return (
       <button className={`${baseClasses} ${variants[variant]}`} {...props}>
         {children}
       </button>
     );
   };

   export default Button;
   ```

5. **Theme Toggle (Light / Dark)**

   * Place a toggle (checkbox or switch) in your navigation or settings.
   * Add or remove `dark` class on `<html>` when toggled.

   ```js
   // Example theme toggle function
   function toggleDarkMode() {
     const root = document.documentElement;
     if (root.classList.contains('dark')) {
       root.classList.remove('dark');
       localStorage.setItem('theme', 'light');
     } else {
       root.classList.add('dark');
       localStorage.setItem('theme', 'dark');
     }
   }
   ```

6. **Documentation & Storybook**

   * Maintain a Markdown-based or Storybook documentation site.
   * For each component:

     * Show examples in light and dark mode.
     * List all class names/props required.
     * Provide code snippets and visuals.

7. **Best Practices**

   * Always use semantic color tokens (e.g., `bg-primary`, `text-error`) rather than hex codes.
   * Keep spacing consistent by relying on Tailwind’s spacing scale.
   * Use `prose` classes (from typography plugin) for long-form text (blog posts, docs).
   * Test all components in both light and dark modes to ensure accessibility (contrast ratios, readability).
   * Avoid arbitrary styles; prefer the design tokens and utility classes defined here.

---

By following this guideline, your React projects will have a consistent, minimalist, and highly usable design system inspired by Geist UI and Vercel’s branding. All components, utilities, and themes align to create a coherent and accessible interface that can be imported and used across any UI project. Enjoy building with this Geist-inspired Tailwind Design System!
