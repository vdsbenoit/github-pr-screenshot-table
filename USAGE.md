# Screenshot Table - Usage Guide

## Overview

Screenshot Table is a macOS utility that converts HTML clipboard content containing images into organized comparison tables. It's designed to streamline the process of creating before/after comparisons and grouped screenshot displays for documentation, pull requests, and presentations.

## How It Works

### Clipboard Workflow

1. **Copy HTML with images** - Copy HTML content containing `<img>` tags to your clipboard (e.g., from a webpage, GitHub comment editor, or any HTML source)
2. **Run the tool** - Execute the app or CLI command
3. **Get formatted table** - The tool automatically:
   - Reads your clipboard
   - Parses image tags and filenames
   - Groups images by category
   - Generates an HTML table
   - Writes the result back to your clipboard
4. **Paste anywhere** - Your clipboard now contains a formatted `<details>` table ready to paste into GitHub, Markdown files, or HTML documents

### Operating Modes

- **macOS App** (`ScreenshotTable.app`): Double-click to run with visual notifications and dialogs
- **CLI Mode**: Run via `deno run` for terminal output and logging

## Filename Syntax

The tool extracts information from the `alt` attribute of `<img>` tags. Use this syntax to control ordering and pairing:

### Basic Format

```
[order_prefix] [name] [timing_suffix]
```

### Order Prefix (Optional but Recommended)

Start filenames with a number to control display order:

- `1. Feature A` → displays first
- `2. Feature B` → displays second
- `3 Feature C` → displays third (space or period after number)
- `4another_feature` → displays fourth (no space required)

**Without order prefix**: Images get `order = 0` and appear in the sequence they're found.

### Name (Required)

The descriptive part of your filename:

- Underscores (`_`) are automatically converted to spaces
- Can be any text (alphanumeric, spaces, special characters)
- Will be displayed as the table header/category name

### Timing Suffix (Optional)

Add trailing words to create before/after pairs:

- `before` → marks image as "before" state (left column)
- `after` → marks image as "after" state (right column)
- *(no suffix)* → treated as standalone image

**Important**: 
- Timing words must appear at the **end** of the filename
- Case-insensitive: `Before`, `BEFORE`, `before` all work
- The timing word is **removed** from the displayed name
- Can be separated by underscore or space: `_before` or ` before`

## Examples

### Before/After Pairs

```html
<!-- Input HTML -->
<img alt="1. login_screen_before" src="url1.jpg" />
<img alt="1. login_screen_after" src="url2.jpg" />
```

**Result**: A single table section titled "Login Screen" with:
- **Before** column showing `url1.jpg`
- **After** column showing `url2.jpg`

### Standalone Images

```html
<!-- Input HTML -->
<img alt="1. Dashboard Overview" src="dash.jpg" />
<img alt="2. Settings Panel" src="settings.jpg" />
```

**Result**: Two columns in a single row:
- Column 1: "Dashboard Overview"
- Column 2: "Settings Panel"

### Mixed Content

```html
<!-- Input HTML -->
<img alt="1. Home Page" src="home.jpg" />
<img alt="2. User Profile before" src="profile_old.jpg" />
<img alt="2. User Profile after" src="profile_new.jpg" />
<img alt="3. Navigation Menu" src="nav.jpg" />
```

**Result**:
1. Row 1: "Home Page" | "Navigation Menu" *(standalone images, 2 per row)*
2. Section "User Profile":
   - Before: `profile_old.jpg`
   - After: `profile_new.jpg`

## Filename Pattern Examples

| Input Filename | Order | Displayed Name | Timing | Notes |
|---------------|-------|----------------|---------|-------|
| `1. Feature_1_before` | 1 | "Feature 1" | before | Classic format |
| `2.Feature 25_before` | 2 | "Feature 25" | before | No space after dot |
| `3 Feature 32` | 3 | "Feature 32" | standalone | No timing suffix |
| `4feature54_after` | 4 | "feature54" | after | No space, no dot |
| `5 my awesome feature before` | 5 | "my awesome feature" | before | Space-separated timing |
| `6 button_style AFTER` | 6 | "button style" | after | Uppercase timing |
| `no_prefix_image` | 0 | "no prefix image" | standalone | No order number |
| `category_before` | 0 | "category" | before | Can pair without order |

## Pairing Logic

Images are paired by their **displayed name** (after removing order prefix and timing suffix):

```html
<!-- These pair together because both become "User Settings" -->
<img alt="1. User_Settings_before" src="a.jpg" />
<img alt="1. User_Settings_after" src="b.jpg" />

<!-- These DON'T pair (different names after processing) -->
<img alt="2. Login before" src="c.jpg" />
<img alt="3. Login Form after" src="d.jpg" />
```

## Output Format

The generated HTML uses the following structure:

```html
<details>
  <summary>Click to expand...</summary>
  <table>
    <!-- Standalone images (2 per row) -->
    <tr>
      <th>Image 1 Title</th>
      <th>Image 2 Title</th>
    </tr>
    <tr>
      <td><img src="..." width="400"></td>
      <td><img src="..." width="400"></td>
    </tr>
    
    <!-- Paired before/after images -->
    <tr>
      <th colspan="2">Category Name</th>
    </tr>
    <tr>
      <th>Before</th>
      <th>After</th>
    </tr>
    <tr>
      <td><img src="..." width="400"></td>
      <td><img src="..." width="400"></td>
    </tr>
  </table>
</details>
```

- Images are displayed at `width="400"` pixels
- Standalone images appear first, 2 per row
- Paired images follow, grouped by category
- The entire table is wrapped in a collapsible `<details>` element

## Tips & Best Practices

1. **Consistent naming**: Use the same name pattern for images you want paired
2. **Order deliberately**: Use number prefixes to control the sequence
3. **Keep names descriptive**: The filename becomes the table header
4. **Test incrementally**: Start with a few images to verify formatting
5. **Backward compatibility**: Both `_before` and ` before` work (underscore gets converted to space)

## Running the Tool

### CLI Mode
```bash
# Development with watch mode
deno task dev

# Single run
deno task start

# Or directly
deno run --allow-run main.ts
```

### Build Standalone Binary
```bash
# CLI binary
deno task build

# macOS app bundle
deno task build:app
```

### As macOS App
1. Build the app: `deno task build:app`
2. Double-click `app/ScreenshotTable.app`
3. The app reads your clipboard, processes it, and shows a success/error dialog

## Permissions

The tool requires `--allow-run` permission to execute:
- `pbpaste` - Read clipboard content
- `pbcopy` - Write formatted table back to clipboard
- `osascript` - Show macOS notifications and dialogs (app mode only)

## Troubleshooting

### "No valid images found"
- Ensure your clipboard contains HTML with `<img>` tags
- Verify each `<img>` has both `alt` and `src` attributes

### Images not pairing
- Check that both images have identical names after removing prefixes/suffixes
- Example: `1. Profile_before` and `1. Profile_after` both become "Profile"

### Wrong order
- Add numeric prefixes: `1. First`, `2. Second`, etc.
- Images without prefixes get `order = 0` and appear in found order

### Timing not detected
- Ensure "before" or "after" is at the **end** of the filename
- Check for typos (case doesn't matter)
- Remember: `my_image_before_v2` won't work (timing must be final word)
