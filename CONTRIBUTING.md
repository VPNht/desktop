# Contributing to VPNht Desktop

Thank you for your interest in contributing to VPNht Desktop! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Security](#security)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project adheres to a standard code of conduct. By participating, you are expected to:

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what is best for the community
- Show empathy towards others

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- Rust 1.70+
- npm or pnpm
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/desktop.git
   cd desktop
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Install Tauri CLI:
   ```bash
   cargo install tauri-cli
   ```

5. Run the development server:
   ```bash
   npm run tauri:dev
   ```

## Development Workflow

### Branch Naming

Use conventional branch names:

- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements
- `chore/description` - Maintenance tasks

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, semicolons)
- `refactor` - Code refactoring
- `test` - Tests
- `chore` - Build/dependency changes

Examples:
```
feat(servers): add latency sorting

Implement latency-based sorting for server list
with automatic refresh every 30 seconds.

Closes #123
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Use explicit return types for functions
- Prefer `interface` over `type` for objects
- Use optional chaining (`?.`) appropriately

```typescript
// Good
interface ServerConfig {
  id: string;
  hostname: string;
  port?: number;
}

async function connectToServer(config: ServerConfig): Promise<Connection> {
  // ...
}

// Avoid
function connectToServer(config) {
  // ...
}
```

### React

- Use functional components with hooks
- Use `React.FC` sparingly, prefer explicit props
- Keep components under 250 lines
- Split logic into custom hooks
- Use `useCallback` for memoized callbacks

```typescript
// Good
interface ServerCardProps {
  server: Server;
  onConnect: (id: string) => void;
}

export function ServerCard({ server, onConnect }: ServerCardProps): JSX.Element {
  const handleClick = useCallback(() => {
    onConnect(server.id);
  }, [server.id, onConnect]);

  return (
    <button onClick={handleClick}>{server.name}</button>
  );
}
```

### Rust

- Follow Rust naming conventions
- Document all public APIs with `///`
- Use `Result` for fallible operations
- Prefer `?` over `.unwrap()`
- Write tests for all public functions

```rust
/// Connects to a VPN server with the given configuration.
/// 
/// # Errors
/// 
/// Returns an error if the connection fails or times out.
pub async fn connect(config: ServerConfig) -> Result<Connection, VpnError> {
    let socket = create_socket().await?;
    // ...
}
```

## Testing

### Frontend Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Rust Tests

```bash
# In src-tauri directory
cd src-tauri

# Run all tests
cargo test

# Run with output
cargo test -- --nocapture

# Check coverage
cargo tarpaulin --out Xml
```

### Test Requirements

- Unit tests for all utility functions
- Component tests for React components
- Integration tests for IPC commands
- E2E tests for critical user flows

## Security

### Security Checklist

Before submitting a PR:

- [ ] No hardcoded secrets or credentials
- [ ] Input validation implemented
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Error messages don't leak sensitive data
- [ ] Principle of least privilege followed

### Reporting Security Issues

Please report security vulnerabilities to security@vpnht.com with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

Do not disclose security issues publicly until patched.

## Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make your changes** following coding standards

3. **Run tests** and ensure they pass:
   ```bash
   npm test
   cd src-tauri && cargo test
   ```

4. **Run linting**:
   ```bash
   npm run lint
   cd src-tauri && cargo clippy
   ```

5. **Update documentation** if needed

6. **Commit** with conventional message format

7. **Push** to your fork:
   ```bash
   git push origin feat/my-feature
   ```

8. **Create Pull Request** using the template

9. **Code review** - Address reviewer feedback

10. **Merge** - Maintainers will merge after approval

### PR Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Security review passed
- [ ] No merge conflicts
- [ ] CI checks passing

## Internationalization (i18n)

When adding UI text:

1. Add translation keys to `src/i18n/locales/en.json`
2. Use `useTranslation` hook in components
3. Test in RTL languages (Arabic, Hebrew)

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return <button>{t('common.connect')}</button>;
}
```

## Accessibility

Ensure all components:

- Have proper ARIA attributes
- Support keyboard navigation
- Work with screen readers
- Meet WCAG 2.1 AA standards

## Questions?

- Check [Documentation](https://docs.vpnht.com)
- Open a [Discussion](https://github.com/VPNht/desktop/discussions)
- Join our [Discord](https://discord.gg/vpnht)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.