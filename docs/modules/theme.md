# Theme Module

## Overview

The Theme module provides a theme engine — theme registry, per-store overrides, built-in themes, and CSS variable generation for storefront rendering.

---

## Public API (`index.ts`)

| Export | Type | Description |
|---|---|---|
| `Theme` | Entity | Theme definition with settings, CSS variables, status |
| `ThemeOverride` | Entity | Per-store theme override (logo, colors, CSS) |
| `ThemeRepository` | Port | Repository interface |
| `ThemeRegistry` | Service | Registry for theme resolution and built-in themes |
| `ThemeErrors` | Errors | Domain error classes |
| `builtInThemes` | Data | Built-in theme definitions (default, minimal, boutique) |

---

## Domain Entities

| Entity | Description |
|---|---|
| `Theme` | `themeId`, name, description, settings (colors, typography, spacing, layout), cssVariables, status (active/archived), isBuiltIn |
| `ThemeOverride` | `overrideId`, `themeId`, `storeId`, customLogo, customFavicon, customBanner, customCss, settingOverrides |

## Built-in Themes

| Theme | Description |
|---|---|
| `default` | Balanced commerce theme with standard color palette |
| `minimal` | Clean, minimal theme with generous whitespace |
| `boutique` | Premium feel with elegant typography and warm tones |

## Domain Errors

| Error | Code | Status |
|---|---|---|
| `ThemeNotFoundError` | `theme.not_found` | 404 |
| `ThemeValidationError` | `theme.validation_error` | 400 |
| `ThemeOverrideNotFoundError` | `theme.override_not_found` | 404 |

## Events

| Direction | Events |
|---|---|
| Publishes | `theme.created`, `theme.updated`, `theme.deleted`, `theme.activated`, `theme.archived`, `theme.assigned`, `theme.unassigned`, `theme.override.created`, `theme.override.updated`, `theme.override.deleted` |
| Subscribes | (none) |

## Tables

| Table | Description |
|---|---|
| `theme` | Theme definitions with settings and CSS variables |
| `themeOverride` | Per-store theme overrides |
| `themeAssignment` | Store-to-theme assignments |

## Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/business/theme` | List themes |
| POST | `/business/theme` | Create custom theme |
| GET | `/business/theme/:themeId` | Get theme details |
| PUT | `/business/theme/:themeId` | Update theme |
| DELETE | `/business/theme/:themeId` | Delete theme |
| POST | `/business/theme/:themeId/activate` | Activate theme |
| POST | `/business/theme/:themeId/archive` | Archive theme |
| POST | `/business/theme/:themeId/assign` | Assign theme to store |
| POST | `/business/theme/:themeId/unassign` | Unassign theme from store |
| PUT | `/business/theme/:themeId/override` | Save per-store override |
