---
name: Release Template
about: Template for creating new releases
---

## Release Checklist

### Pre-Release

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in Cargo.toml
- [ ] Version bumped in package.json

### Release Notes

#### New Features
-*List new features*

#### Improvements
-*List improvements*

#### Bug Fixes
-*List bug fixes*

#### Security
-*List security updates*

### Assets Checklist

- [ ] Linux x64 AppImage
- [ ] Linux x64 deb
- [ ] Linux x64 rpm
- [ ] Linux ARM64 AppImage
- [ ] macOS x64 DMG
- [ ] macOS ARM64 DMG
- [ ] Windows x64 MSI
- [ ] Windows x64 NSIS
- [ ] Source code (zip)
- [ ] Source code (tar.gz)
- [ ] checksums.txt
- [ ] updates.json

### Post-Release

- [ ] GitHub Release published
- [ ] Website updated
- [ ] Social media announcement
- [ ] Documentation deployed
- [ ] Update server updated