# Contributing to dank-trank

Thank you for your interest in contributing! Here's how to get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/dark-developer-lord/dank-trank.git
cd dank-trank

# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Run the CLI locally
node dist/cli/index.js --help
```

## Project Structure

```
src/
├── cli/          # CLI entry point
├── commands/     # Command handlers
├── detector/     # Stack detectors
├── generators/   # File generators
├── templates/    # Templates per stack (Handlebars-like)
├── providers/    # Cloud deploy providers
├── renderer/     # Template engine
├── config/       # Config loading
└── utils/        # Logger, spinner, file ops
```

## How to Add a New Stack

See [docs/adding-a-stack.md](docs/adding-a-stack.md) for a step-by-step guide.

## How to Add a New Generator

1. Create a new generator in `src/generators/`
2. Register it in `src/generators/index.ts`
3. Add templates in `src/templates/<stack>/`
4. Add tests in `tests/generators/`

## Code Style

- We use **Prettier** for formatting and **ESLint** for linting.
- Run `pnpm format` and `pnpm lint` before submitting a PR.
- TypeScript strict mode is enabled.

## Pull Requests

1. Fork the repo and create your branch from `main`.
2. Add tests for any new functionality.
3. Ensure all tests pass: `pnpm test`
4. Ensure lint passes: `pnpm lint`
5. Submit your PR with a clear description.

## Reporting Bugs

Open an [issue](https://github.com/dark-developer-lord/dank-trank/issues) with:
- Your Node.js version (`node --version`)
- Your OS
- Steps to reproduce
- Expected vs actual behavior

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
