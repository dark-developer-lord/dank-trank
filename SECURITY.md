# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public issue.**
2. Email us at: **security@setup-my-startup.dev**
3. Include a description of the vulnerability and steps to reproduce.
4. We will acknowledge within 48 hours and provide a fix timeline.

## Security Considerations

- **Generated files are templates** — always review them before deploying to production.
- **No secrets are stored** — the tool does not handle, transmit, or store credentials.
- **File operations are safe** — existing files are backed up before overwriting.
- **No network calls in MVP** — the tool works entirely offline (except `deploy` in future versions).
- **Non-root Docker users** — all generated Dockerfiles run as non-root by default.

## Best Practices

When using generated files:
1. Review all generated configs before deploying
2. Set strong passwords for database containers
3. Use environment variables for secrets (never hardcode)
4. Enable HTTPS in production (not included in MVP templates)
