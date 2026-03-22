<div align="center">

# ⚡ Setup My Startup

### From idea to live app in 1 command

[![CI](https://github.com/adas-dev/setup-my-startup/actions/workflows/ci.yml/badge.svg)](https://github.com/adas-dev/setup-my-startup/actions)
[![npm version](https://img.shields.io/npm/v/@adas/setup-my-startup.svg)](https://www.npmjs.com/package/@adas/setup-my-startup)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Auto-detect your stack → Generate production-ready Docker, Nginx, and CI/CD → Ship.

**Django · FastAPI · Node.js (Express, Next.js, Vite)**

[Quick Start](#-quick-start) · [Features](#-features) · [Supported Stacks](#-supported-stacks) · [Roadmap](#-roadmap) · [Contributing](#contributing)

</div>

---

## Why?

Every startup goes through the same ritual: you build your app, it works locally, then you spend **hours or days** wiring up Docker, Nginx, CI/CD, and deployment configs. It's boring, error-prone, and repeated across every project.

**Setup My Startup** does it for you in seconds:

```bash
npx @adas/setup-my-startup generate
```

That's it. You get a production-ready Dockerfile, docker-compose.yml, Nginx config, and GitHub Actions workflow — tailored to your detected stack.

---

## 🚀 Quick Start

```bash
# Run directly (no install needed)
npx @adas/setup-my-startup generate

# Or install globally
npm install -g @adas/setup-my-startup
setup-my-startup generate
```

### What happens:

1. **Detects** your stack (Django, FastAPI, Node.js)
2. **Generates** 4 production-ready files
3. **Done.** You're ready to deploy.

### Preview first (dry run):

```bash
setup-my-startup generate --dry-run
```

### Interactive mode:

```bash
setup-my-startup init
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Auto-detection** | Identifies your stack from project files (manage.py, package.json, requirements.txt, etc.) |
| 🐳 **Dockerfile** | Multi-stage build, non-root user, optimized layers |
| 🐙 **docker-compose.yml** | Full local dev setup with Nginx reverse proxy and database |
| 🌐 **nginx.conf** | Production reverse proxy with WebSocket support (Node.js) |
| ⚡ **GitHub Actions** | CI/CD workflow with test, build, and container health check |
| 👀 **Dry run** | Preview what will be generated without writing files |
| 💾 **Safe overwrites** | Creates `.bak` backups before overwriting existing files |
| 🏥 **Doctor** | Checks your environment for required tools (Docker, Git, Node) |

---

## 📦 Supported Stacks

| Stack | Sub-frameworks | Confidence Signals |
|-------|---------------|-------------------|
| **Django** | — | `manage.py`, `requirements.txt` with django, `wsgi.py`/`asgi.py` |
| **FastAPI** | — | `main.py`, `requirements.txt` with fastapi/uvicorn |
| **Node.js** | Express, Next.js, Vite | `package.json`, framework deps, `src/`, lockfiles |

---

## 🛠 Commands

```bash
setup-my-startup inspect              # Detect and display stack info
setup-my-startup generate             # Generate infrastructure files
setup-my-startup generate --dry-run   # Preview without writing
setup-my-startup generate --force     # Overwrite existing files (with backup)
setup-my-startup init                 # Interactive setup wizard
setup-my-startup deploy               # Deploy to cloud (coming soon)
setup-my-startup doctor               # Check environment requirements
```

---

## 📁 Generated Files

After running `setup-my-startup generate` in your project:

```
your-project/
├── Dockerfile                      # Multi-stage, security-hardened
├── docker-compose.yml              # Local dev with Nginx + DB
├── nginx.conf                      # Reverse proxy config
└── .github/
    └── workflows/
        └── deploy.yml              # CI/CD pipeline
```

---

## 💡 Example: Django Project

```bash
$ cd my-django-app
$ setup-my-startup generate

  ⚡ Setup My Startup
  From idea to live app in 1 command

✔ Detecting project stack
✔ Detected: DJANGO (confidence: 70%)
✔ Generating infrastructure files

Files
  ✔ created  Dockerfile
  ✔ created  docker-compose.yml
  ✔ created  nginx.conf
  ✔ created  .github/workflows/deploy.yml

✔ Done! 4 created.

Next steps
  → Review generated files
  → Run docker compose up --build to start locally
  → Push to GitHub to trigger CI/CD workflow
```

---

## 🗺 Roadmap

- [x] Auto-detect Django, FastAPI, Node.js
- [x] Generate Dockerfile, docker-compose, Nginx, GitHub Actions
- [x] Dry run mode
- [x] Safe file overwrites with backups
- [x] Environment doctor check
- [ ] Deploy to DigitalOcean
- [ ] Deploy to Vercel
- [ ] Deploy to AWS
- [ ] Database detection (PostgreSQL, Redis, MongoDB)
- [ ] SSL/TLS automation
- [ ] Kubernetes manifests
- [ ] Plugin system for custom stacks
- [ ] Monorepo support
- [ ] Web dashboard

---

## 🏗 Architecture

```
src/
├── cli/          # CLI entry point (Commander)
├── commands/     # Command handlers (inspect, generate, init, deploy, doctor)
├── detector/     # Stack detection (Django, FastAPI, Node.js)
├── generators/   # File generators (Dockerfile, docker-compose, nginx, GH Actions)
├── templates/    # Handlebars-like templates per stack
├── providers/    # Cloud deployment providers (stubs)
├── renderer/     # Micro template engine
├── config/       # Project configuration
└── utils/        # Logger, spinner, file operations
```

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Quick way to contribute:

1. **Add a new stack** — see [docs/adding-a-stack.md](docs/adding-a-stack.md)
2. **Improve templates** — better Dockerfiles, Nginx configs
3. **Add deployment providers** — DigitalOcean, Vercel, AWS
4. **Report bugs** — [open an issue](https://github.com/adas-dev/setup-my-startup/issues)

---

## Security

See [SECURITY.md](SECURITY.md) for our security policy.

---

## License

MIT © [Adas](https://github.com/adas-dev)

---

<div align="center">

**Built with ❤️ for startups that want to ship, not configure.**

[⬆ Back to top](#-setup-my-startup)

</div>
