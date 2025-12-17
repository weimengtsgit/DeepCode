# Styling Guide - Observability Monitoring Platform

## Overview

This guide provides comprehensive documentation for the design system, styling conventions, and theming approach used throughout the Observability Monitoring Platform. It serves as the reference for developers implementing components and maintaining visual consistency.

## Design System Foundation

### Color Palette

The platform uses a dark theme optimized for monitoring dashboards with semantic color naming:

**Background Colors:**
- `$color-bg-primary`: #0b0c0e (main background)
- `$color-bg-secondary`: #181b1f (elevated surfaces)
- `$color-bg-tertiary`: #252a2f (interactive elements)

**Text Colors:**
- `$color-text-primary`: #d8d9da (main text)
- `$color-text-secondary`: #a8adb5 (secondary text)
- `$color-text-tertiary`: #7a8089 (disabled/hint text)

**Status Colors:**
- `$color-success`: #73bf69 (healthy, success)
- `$color-warning`: #ff9830 (warning, degraded)
- `$color-error`: #f2495c (error, critical)
- `$color-info`: #3274d9 (information)

**Action Colors:**
- `$color-primary`: #3274d9 (primary actions)
- `$color-primary-hover`: #2563c4 (hover state)
- `$color-primary-active`: #1e4fa8 (active state)

### Spacing System

Uses an 8px base grid for consistent spacing:

```scss
$spacing-xs:   4px    // Minimal spacing
$spacing-sm:   8px    // Small spacing
$spacing-md:   16px   // Medium spacing (default)
$spacing-lg:   24px   // Large spacing
$spacing-xl:   32px   // Extra large spacing
$spacing-2xl:  48px   // 2x large spacing
$spacing-3xl:  64px   // 3x large spacing
```

**Usage Pattern:**
```scss
.component {
  padding: $spacing-md;        // 16px
  margin-bottom: $spacing-lg;  // 24px
  gap: $spacing-sm;            // 8px
}
```

### Typography

**Font Families:**
- Base: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif
- Monospace: 'Monaco', 'Courier New', monospace

**Font Sizes:**
- `$font-size-xs`: 12px (small labels, hints)
- `$font-size-sm`: 14px (body text, secondary)
- `$font-size-md`: 16px (default body text)
- `$font-size-lg`: 18px (section headers)
- `$font-size-xl`: 20px (page headers)
- `$font-size-2xl`: 24px (main headers)
- `$font-size-3xl`: 32px (hero headers)

**Font Weights:**
- Light: 300 (disabled, secondary)
- Normal: 400 (body text)
- Medium: 500 (labels, buttons)
- Semibold: 600 (headers)
- Bold: 700 (emphasis)

**Line Heights:**
- Tight: 1.2 (headers)
- Normal: 1.5 (body text)
- Relaxed: 1.75 (readable content)

### Shadows

Elevation system for depth perception:

```scss
$shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.05)
$shadow-md:   0 4px 6px rgba(0, 0, 0, 0.1)
$shadow-lg:   0 10px 15px rgba(0, 0, 0, 0.1)
$shadow-xl:   0 20px 25px rgba(0, 0, 0, 0.15)
$shadow-2xl:  0 25px 50px rgba(0, 0, 0, 0.25)
```

**Usage:**
- `$shadow-sm`: Subtle elevation (hover states)
- `$shadow-md`: Default card elevation
- `$shadow-lg`: Modal/drawer elevation
- `$shadow-xl`: Dropdown/tooltip elevation
- `$shadow-2xl`: Maximum elevation (notifications)

### Border Radius

Consistent corner rounding:

```scss
$border-radius-sm:   4px      // Subtle rounding
$border-radius-md:   6px      // Default rounding
$border-radius-lg:   8px      // Larger rounding
$border-radius-xl:   12px     // Extra large rounding
$border-radius-full: 9999px   // Fully rounded (pills)
```

### Transitions & Animations

**Duration Scale:**
- `$transition-fast`: 150ms (quick feedback)
- `$transition-normal`: 300ms (default animations)
- `$transition-slow`: 500ms (emphasis animations)

**Easing Functions:**
- `ease-linear`: Constant speed
- `ease-in`: Slow start, fast end
- `ease-out`: Fast start, slow end
- `ease-in-out`: Slow start and end
- `cubic-bezier(0.4, 0, 0.2, 1)`: Material Design easing

**Usage Pattern:**
```scss
.interactive-element {
  transition: all $transition-normal ease-out;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }
}
```

## Component Styling Conventions

### Button Styling

**Button Variants:**
```scss
.btn {
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-md;
  font-weight: 500;
  transition: all $transition-normal ease-out;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: $shadow-md;
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: $shadow-sm;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  background-color: $color-primary;
  color: white;
  
  &:hover {
    background-color: $color-primary-hover;
  }
}

.btn-secondary {
  background-color: $color-bg-secondary;
  color: $color-text-primary;
  border: 1px solid $color-border;
  
  &:hover {
    background-color: $color-bg-tertiary;
  }
}

.btn-danger {
  background-color: $color-error;
  color: white;
  
  &:hover {
    background-color: darken($color-error, 10%);
  }
}

.btn-ghost {
  background-color: transparent;
  color: $color-primary;
  
  &:hover {
    background-color: rgba($color-primary, 0.1);
  }
}
```

### Card Styling

```scss
.card {
  background-color: $color-bg-secondary;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-md;
  overflow: hidden;
  transition: all $transition-normal ease-out;
  
  &:hover {
    box-shadow: $shadow-lg;
    transform: translateY(-2px);
  }
}

.card-header {
  padding: $spacing-lg;
  border-bottom: 1px solid $color-border;
  background-color: $color-bg-tertiary;
}

.card-body {
  padding: $spacing-lg;
}

.card-footer {
  padding: $spacing-lg;
  border-top: 1px solid $color-border;
  background-color: $color-bg-tertiary;
}
```

### Form Elements

```scss
input, textarea, select {
  padding: $spacing-sm $spacing-md;
  border: 1px solid $color-border;
  border-radius: $border-radius-md;
  background-color: $color-bg-tertiary;
  color: $color-text-primary;
  font-size: $font-size-md;
  transition: all $transition-normal ease-out;
  
  &:focus {
    outline: none;
    border-color: $color-primary;
    box-shadow: 0 0 0 3px rgba($color-primary, 0.1);
  }
  
  &:disabled {
    background-color: $color-bg-secondary;
    color: $color-text-tertiary;
    cursor: not-allowed;
  }
  
  &::placeholder {
    color: $color-text-tertiary;
  }
}

input[type="checkbox"],
input[type="radio"] {
  accent-color: $color-primary;
}
```

## Responsive Design

### Breakpoint System

```scss
$breakpoint-xs:   320px   // Mobile phones
$breakpoint-sm:   480px   // Small phones
$breakpoint-md:   768px   // Tablets
$breakpoint-lg:   1024px  // Small laptops
$breakpoint-xl:   1400px  // Laptops
$breakpoint-2xl:  1920px  // Desktop (primary target)
$breakpoint-3xl:  2560px  // Ultrawide
```

### Mobile-First Approach

```scss
// Base styles (mobile)
.component {
  display: block;
  width: 100%;
  padding: $spacing-md;
}

// Tablet and up
@include media-md {
  .component {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}

// Desktop and up
@include media-xl {
  .component {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

// Ultrawide
@include media-3xl {
  .component {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
}
```

### Responsive Utilities

```scss
// Hide/show at breakpoints
.hide-sm { @include media-sm { display: none; } }
.hide-md { @include media-md { display: none; } }
.hide-lg { @include media-lg { display: none; } }

.show-sm-only { @include media-md { display: none; } }
.show-md-only { @include media-lg { display: none; } }
.show-lg-only { @include media-max-lg { display: none; } }

// Responsive spacing
.p-responsive {
  padding: $spacing-sm;
  @include media-md { padding: $spacing-md; }
  @include media-lg { padding: $spacing-lg; }
}
```

## Theme Customization

### Dark Theme (Primary)

All colors are optimized for dark backgrounds:
- High contrast text (#d8d9da on #0b0c0e = 13.5:1 ratio)
- Semantic color meanings (green=success, red=error)
- Reduced eye strain with dark backgrounds

### Light Theme (Future)

When implementing light theme, override in `themes/light.scss`:

```scss
$color-bg-primary: #ffffff;
$color-bg-secondary: #f5f5f5;
$color-text-primary: #1a1a1a;
$color-text-secondary: #666666;
// ... etc
```

### CSS Custom Properties

For runtime theme switching:

```scss
:root {
  --color-primary: #{$color-primary};
  --color-bg-primary: #{$color-bg-primary};
  --color-text-primary: #{$color-text-primary};
  // ... etc
}

.component {
  color: var(--color-text-primary);
  background-color: var(--color-bg-primary);
}
```

## Animation Guidelines

### Entrance Animations

```scss
.fade-in {
  animation: fadeIn $transition-normal ease-out;
}

.slide-in-up {
  animation: slideInUp $transition-normal ease-out;
}

.scale-in {
  animation: scaleIn $transition-normal ease-out;
}
```

### Loading States

```scss
.skeleton-loading {
  animation: shimmer 2s infinite;
  background: linear-gradient(
    90deg,
    $color-bg-secondary 0%,
    $color-bg-tertiary 50%,
    $color-bg-secondary 100%
  );
  background-size: 200% 100%;
}

.spinner {
  animation: spin 1s linear infinite;
}

.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Interaction Animations

```scss
.btn {
  transition: all $transition-normal ease-out;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }
  
  &:active {
    transform: translateY(0);
  }
}

.link {
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background-color: $color-primary;
    transition: width $transition-normal ease-out;
  }
  
  &:hover::after {
    width: 100%;
  }
}
```

## Accessibility Considerations

### Color Contrast

All text meets WCAG AA standards (4.5:1 minimum):
- Primary text on background: 13.5:1
- Secondary text on background: 8.2:1
- Interactive elements: 4.5:1 minimum

### Focus States

```scss
.interactive-element {
  &:focus-visible {
    outline: 2px solid $color-primary;
    outline-offset: 2px;
  }
}
```

### Reduced Motion

```scss
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Screen Reader Only

```scss
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## Best Practices

### 1. Use Design Tokens

✅ **Good:**
```scss
.component {
  padding: $spacing-md;
  color: $color-text-primary;
  border-radius: $border-radius-md;
}
```

❌ **Bad:**
```scss
.component {
  padding: 16px;
  color: #d8d9da;
  border-radius: 6px;
}
```

### 2. Consistent Spacing

Use the 8px grid consistently:
```scss
.component {
  padding: $spacing-md;        // 16px
  margin-bottom: $spacing-lg;  // 24px
  gap: $spacing-sm;            // 8px
}
```

### 3. Smooth Transitions

Always use transitions for interactive elements:
```scss
.interactive {
  transition: all $transition-normal ease-out;
  
  &:hover {
    transform: translateY(-2px);
  }
}
```

### 4. Responsive Design

Use mixins for responsive styles:
```scss
.component {
  display: block;
  
  @include media-lg {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

### 5. Semantic Colors

Use semantic color names:
```scss
.success { color: $color-success; }
.error { color: $color-error; }
.warning { color: $color-warning; }
.info { color: $color-info; }
```

## Common Patterns

### Flexbox Centering

```scss
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Grid Layout

```scss
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: $spacing-lg;
}
```

### Text Truncation

```scss
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

### Overlay Pattern

```scss
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: $z-index-modal - 1;
}
```

## Performance Tips

1. **Use CSS variables** for dynamic theming (no SCSS recompilation)
2. **Prefer transform/opacity** for animations (GPU-accelerated)
3. **Avoid layout-affecting properties** in animations (margin, padding, width, height)
4. **Use will-change sparingly** for performance-critical animations
5. **Minimize specificity** to reduce CSS file size
6. **Leverage CSS Grid** for complex layouts (better than nested flexbox)

## Troubleshooting

### Colors Look Wrong

- Check if dark theme variables are imported
- Verify CSS custom properties are set in `:root`
- Check browser DevTools for CSS cascade issues

### Animations Lag

- Use `transform` and `opacity` instead of layout properties
- Check for `will-change` overuse
- Profile with Chrome DevTools Performance tab

### Responsive Layout Breaks

- Check breakpoint order (mobile-first)
- Verify media query syntax
- Test at exact breakpoint widths

### Accessibility Issues

- Check color contrast with WebAIM contrast checker
- Test keyboard navigation (Tab key)
- Test with screen reader (NVDA, JAWS)
- Check for focus-visible states

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design System](https://material.io/design)
- [CSS Tricks Guides](https://css-tricks.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
