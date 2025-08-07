# Repository Guidelines

This document provides a concise contributor guide for the **studio-admin** project.

## Project Structure & Module Organization

- `src/`: application code (pages, components, hooks, utils)
- `public/`: static assets (images, fonts)
- `src/scripts/`: code-generation scripts (e.g., theme presets)
- `tests/`: unit and integration tests (co-located with code where applicable)

## Build, Test, and Development Commands

| Command          | Description                           |
| ---------------- | ------------------------------------- |
| `npm install`    | Install dependencies                  |
| `npm run dev`    | Start Next.js dev server (hot reload) |
| `npm run build`  | Compile production build              |
| `npm test`       | Run unit and integration tests        |
| `npm run lint`   | Validate code style with ESLint       |
| `npm run format` | Auto-format code with Prettier        |

## Coding Style & Naming Conventions

- **Indentation**: 2 spaces
- **Language**: TypeScript (TSX for React components)
- **CSS**: Tailwind utility classes
- **Naming**: camelCase for variables, PascalCase for components
- **Linting/Formatting**: ESLint and Prettier (Husky pre-commit)

## Testing Guidelines

- **Frameworks**: Jest + React Testing Library
- **File pattern**: `*.test.ts` or `*.test.tsx` alongside source files
- **Run tests**: `npm test -- --watchAll` for TDD feedback

## Commit & Pull Request Guidelines

- **Commit messages**: present-tense, short summary (e.g. `feat: add auth hook`)
- **Pull requests**: include description, linked issue, and screenshot/steps if UI changes
- **Review**: ensure CI passes and lint/format checks are green before merging

## Security & Configuration Tips

- Store secrets in environment variables (e.g. `.env.local`)
- Do not commit sensitive data or tokens

## Agent-Specific Instructions

- 尽量回复中文

Thank you for contributing! Please follow these guidelines to keep the codebase consistent and maintainable.
