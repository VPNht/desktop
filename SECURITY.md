# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| 0.x.x   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### Private Disclosure Process

1. **Email**: Send details to security@vpnht.com with `[Security]` in the subject
2. **PGP**: Use our PGP key (see below for fingerprint)
3. **Expected Response Time**: 48 hours
4. **Bounty**: Eligible for security vulnerability rewards

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Affected versions
- Potential impact
- Suggested fix (if any)

### What NOT to Do

- Do not disclose publicly before a fix is released
- Do not test on production systems without permission
- Do not access data that isn't yours
- Do not perform DoS attacks

## Security Features

### Application Security

- ✅ **End-to-end encryption** for VPN connections
- ✅ **Kill switch** prevents data leaks
- ✅ **DNS leak protection**
- ✅ **IPv6 blocking** to prevent leaks
- ✅ **No-logs policy**

### Build Security

- ✅ **Signed binaries** for all platforms
- ✅ **Reproducible builds**
- ✅ **Dependency auditing** with Dependabot
- ✅ **Code signing** verification in CI/CD

### Infrastructure Security

- ✅ **HSM-backed** certificate storage
- ✅ **Automatic updates** with signature verification
- ✅ **Secure update channels** (TLS 1.3)

## PGP Key

```
Fingerprint: YOUR_PGP_FINGERPRINT_HERE
Key ID: YOUR_KEY_ID
```

Download: https://vpnht.com/pgp-key.asc

## Security Advisories

Published advisories: https://github.com/VPNht/desktop/security/advisories

## Acknowledgments

We thank the following researchers who have responsibly disclosed vulnerabilities:

*(Last updated: 2024)*