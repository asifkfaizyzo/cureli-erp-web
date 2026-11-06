<!-- zDocs/darktheme refrac.md (do not remove this comment) -->
📋 Dark Mode Refactor Prompt
text

# TASK: Dark Mode Refactor — Theme Token Migration

You are refactoring React Native components to properly support dark mode.
The app uses a theme context that provides color tokens for both light and
dark palettes. Many components currently use HARDCODED colors (like
"#ffffff", "#000000", "#f5f5f5") which do not adapt to the dark theme.

Your job is to replace those hardcoded colors with theme tokens from
`useTheme()` so the component renders correctly in BOTH light and dark modes.

## STRICT RULES

1. **Do NOT change visual design in light mode.**
   The component must look byte-for-byte identical to how it currently looks
   in light mode. Only dark mode behavior changes.

2. **Do NOT change layout, spacing, sizes, or structure.**
   No changes to flex, padding, margin, width, height, borderRadius, etc.
   Only color values change.

3. **Do NOT refactor logic, props, hooks, or component structure.**
   No renaming, no splitting into subcomponents, no logic changes.
   Only touch color values.

4. **Do NOT add new features or behavior.**

5. **Do NOT add new imports** unless the component doesn't already import
   `useTheme` from the theme context.

6. **Ask for clarification** before touching a color that is intentionally
   fixed (e.g. brand-color overlays, gradient stops, hardcoded status colors
   like a green "success" dot). Some colors SHOULD stay hardcoded — brand
   colors, gradient stops, semantic status colors used on colored surfaces.

## WHAT TO LOOK FOR

Scan the file for these patterns:

- Hex codes: `"#ffffff"`, `"#000000"`, `"#f5f5f5"`, `"#FBBF24"`, etc.
- RGB / RGBA literals: `"rgb(...)"`, `"rgba(...)"`
- Named colors: `"white"`, `"black"`, `"gray"`
- Hardcoded shadow colors that clash with dark surfaces

For each one, decide:

- **Replace with theme token** — if it's a surface, text, or border that
  should adapt to the theme
- **Keep as-is** — if it's a brand/gradient/status color that intentionally
  stays fixed across themes
- **Ask** — if you're unsure

## THEME TOKEN MAP (reference)

The `useTheme()` hook returns a `colors` object with these groups:

- `colors.background.page` — screen background
- `colors.background.card` — card / surface
- `colors.background.elevated` — modal / bottom sheet
- `colors.background.tint` — subtle branded wash
- `colors.background.accent` — stronger branded wash
- `colors.background.input` — text input background

- `colors.text.primary` — main text
- `colors.text.secondary` — body
- `colors.text.muted` — helpers / hints
- `colors.text.faint` — timestamps
- `colors.text.disabled` — disabled state
- `colors.text.brand` — links / active
- `colors.text.inverse` — text on brand backgrounds

- `colors.border.default` — normal border
- `colors.border.subtle` — very light divider
- `colors.border.brand` — branded border
- `colors.border.strong` — emphasized border
- `colors.border.input` / `colors.border.inputFocused`

- `colors.brand.primary` / `secondary` / `mid` / `light` / `soft` / `accent`

- `colors.status.success` / `warning` / `error` / `info` + `*Bg` variants

- `colors.overlay.dark` / `light` / `medium`

## COMMON MIGRATIONS

| Current (hardcoded)         | Replace with                         |
|-----------------------------|--------------------------------------|
| `"#ffffff"` as bg           | `colors.background.card`             |
| `"#ffffff"` as page bg      | `colors.background.page`             |
| `"#f8fafc"` / `"#f5f5f5"`   | `colors.background.page` or `.tint`  |
| `"#0f172a"` / `"#000000"`   | `colors.text.primary`                |
| `"#e2e8f0"` / `"#f1f5f9"`   | `colors.border.default` or `.subtle` |
| `"#64748b"` / `"#8e8e93"`   | `colors.text.muted`                  |

## WHAT TO KEEP HARDCODED (do NOT change)

- Brand gradient stops (e.g. `["#05015A", "#a291f8"]`)
- Colors on branded/colored surfaces where contrast is intentional
  (e.g. `"#FFFFFF"` text on a brand-color button)
- Status indicator colors that should look the same in both themes
  (e.g. `"#22C55E"` for a live/active dot, `"#FBBF24"` for a rating star)
- Shadow colors — usually `"#000"` is fine cross-theme, but flag if it's
  used prominently on a dark surface

## HOW TO STRUCTURE THE CHANGE

1. If the color is in `StyleSheet.create({...})`, move it OUT to an inline
   style array and reference `colors.xxx`. Keep the rest of the styles in
   the stylesheet.

2. Prefer this pattern:
style={[styles.card, { backgroundColor: colors.background.card }]}

text

Over:
style={{ ...styles.card, backgroundColor: colors.background.card }}

text


## OUTPUT FORMAT

Deliver:

1. **A short "What Changed" list** showing every color replacement made,
in `before → after` format.
2. **The complete updated file**, ready to paste over the original.
3. **A "Verification" note** confirming light mode looks identical and
dark mode now uses proper surfaces.
4. **Flag anything ambiguous** — colors you were unsure about and left
alone, with a one-line reason.

## BEFORE YOU START

Ask me if you need to see:
- `src/theme/colors.ts` — the full palette
- `src/theme/ThemeContext.tsx` — the hook shape
- Any parent component that passes color-related props

I will paste the target component file below.