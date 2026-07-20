# Contributing to Deskly

Thank you for your interest in contributing to Deskly. We welcome contributions from community members of all skill levels.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Development Setup](#development-setup)
- [Code Style & Standards](#code-style--standards)
- [Commit Convention](#commit-convention)

---

## Code of Conduct

This project and everyone participating in it is governed by the [Deskly Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates. When filing a bug report, please include:

- A clear, descriptive title.
- Steps to reproduce the issue.
- Expected vs. actual behavior.
- Platform details (e.g., Desktop Linux/Windows/macOS, Mobile Android/iOS).
- Relevant console logs or screenshot attachments (ensure no credentials or tokens are visible).

### Suggesting Features

Feature requests are welcome. When proposing a new feature:

- Explain the use case and why it would benefit users.
- Outline the proposed UI or user experience flow.
- Ensure the feature respects Deskly's privacy-first model (no external server tracking).

### Submitting Pull Requests

1. **Fork the repository** and create your branch from `master`:
   ```bash
   git checkout -b feature/my-cool-feature
   ```
2. **Make your changes** following our design and coding guidelines.
3. **Verify compilation**:
   ```bash
   npx tsc --noEmit
   ```
4. **Commit your changes** using conventional commit messages.
5. **Push to your fork** and submit a Pull Request.

---

## Development Setup

### Prerequisites

- **Node.js**: v18+ (v20+ recommended)
- **pnpm**: `npm install -g pnpm`
- **Rust & Cargo**: Latest stable Rust toolchain (for Tauri v2 backend)

### Setup Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/Vishal-770/deskly-tauri.git
   cd deskly-tauri
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run in development mode:
   ```bash
   pnpm dev
   ```
4. Run Tauri desktop dev environment:
   ```bash
   pnpm tauri dev
   ```

---

## Code Style & Standards

- **UI & Styling**: Use Vanilla Tailwind CSS and Shadcn UI tokens (`bg-card`, `bg-muted`, `text-foreground`, `text-primary`). Do not hardcode raw hex colors in components.
- **Design System**: Maintain dual layout support (Mobile UI under `src/pages-mobile/` and Desktop UI under `src/pages-desktop/`) sharing the same Rust and TypeScript backend.
- **Animations**: Use subtle transitions and skeleton loaders (`<Sk />`). Avoid heavy or intrusive hover/scale animations.
- **Offline Caching (SWR)**: Read local cache synchronously in `useState(() => readCache())` to prevent screen flicker and skeleton flashes on page load. Always handle network timeouts gracefully with `fetchWithTimeout`.

---

## Commit Convention

We follow standard conventional commit messages:

- `feat: add new laundry schedule feature`
- `fix: resolve attendance calculation edge case`
- `style: refine settings mobile layout typography`
- `docs: update setup guide in README`
- `release: v4.0.0`
