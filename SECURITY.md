# Security Policy

## Security Architecture Overview

Deskly is designed from the ground up as a privacy-first, offline-ready desktop and mobile client. 

- **No Remote Telemetry or Databases**: Deskly does not operate or communicate with any creator-owned backend servers, analytics platforms, or external databases.
- **Secure Keyring Storage**: User credentials (registration number and password) are encrypted and stored in your device's native operating system keyring (via Tauri's secure OS-level keychain API integration).
- **Direct Portal Communication**: All network traffic occurs directly between your local device client and official university portal endpoints (VTOP) via encrypted HTTPS calls.
- **Session Tokens in Memory**: Active session cookies and JWT tokens are held strictly in memory and cleared automatically upon sign-out.

---

## Supported Versions

We provide security updates and patches for the current major release:

| Version | Supported |
| ------- | --------- |
| 4.0.x   | Yes       |
| 3.0.x   | No        |
| < 3.0   | No        |

---

## Reporting a Vulnerability

If you discover a security vulnerability, credential leak risk, or privacy flaw in Deskly, please report it via [GitHub Issues](https://github.com/Vishal-770/deskly-tauri/issues) or through private security reporting under GitHub Security Advisories.

### How to Report

1. Open an issue on [GitHub Issues](https://github.com/Vishal-770/deskly-tauri/issues) or use GitHub Security Advisories.
2. Include a description of the issue, proof of concept, and steps to reproduce. Ensure no real user credentials or session tokens are posted publicly.
3. Issues will be reviewed and addressed promptly.

Thank you for helping keep Deskly secure for all students.
