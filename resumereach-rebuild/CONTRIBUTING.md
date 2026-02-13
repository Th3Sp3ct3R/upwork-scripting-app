# Contributing to ResumeReach

Thank you for your interest in contributing to ResumeReach! This document provides guidelines and instructions for contributing.

## 🤝 Ways to Contribute

- **Report Bugs** - Found an issue? Open a GitHub issue
- **Suggest Features** - Have a great idea? Let's discuss it
- **Write Code** - Submit pull requests with improvements
- **Write Documentation** - Help us improve docs
- **Test Features** - Help identify edge cases and bugs

## 📋 Getting Started

1. **Fork the repository**
```bash
git clone https://github.com/yourusername/resumereach.git
cd resumereach
```

2. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Install dependencies**
```bash
npm install
```

4. **Set up environment**
```bash
cp .env.example .env.local
# Fill in your development API keys
```

5. **Start development server**
```bash
npm run dev
```

## 🔍 Code Style

### TypeScript
- Always use TypeScript for new code
- Enable strict mode
- Avoid `any` types

### Component Naming
- Use PascalCase for components
- Use camelCase for functions and variables
- Keep component names descriptive

### File Organization
```
components/
├── auth/
│   ├── LoginForm.tsx
│   └── SignupForm.tsx
├── dashboard/
│   ├── ApplicationList.tsx
│   └── StatsCard.tsx
└── ui/
    ├── Button.tsx
    └── Card.tsx
```

### Code Comments
```typescript
// Good: Explain why, not what
// We fetch jobs before resume generation to validate job exists
const jobData = await fetchJob(jobId);

// Avoid: Obvious comments
// Get the user
const user = await getUser(userId);
```

## 🎨 UI/Design Guidelines

- Use existing Tailwind classes
- Keep spacing consistent (use multiples of 4px)
- Test on mobile viewports
- Ensure WCAG 2.1 AA compliance
- Follow blue (#0066FF) color scheme

## ✅ Before Submitting PR

### Code Quality
- [ ] TypeScript types are correct
- [ ] No console errors or warnings
- [ ] No unused imports or variables
- [ ] Code follows project conventions

### Testing
- [ ] Added unit tests for new functions
- [ ] Added E2E tests for new features
- [ ] Run `npm run test` - all tests pass
- [ ] Run `npm run test:coverage` - coverage is acceptable

### Documentation
- [ ] Updated README if behavior changed
- [ ] Updated API.md for API changes
- [ ] Added JSDoc comments for public functions
- [ ] Updated CHANGELOG.md

### Commits
- [ ] Commits are meaningful and descriptive
- [ ] Use conventional commits:
  - `feat: Add new resume generation endpoint`
  - `fix: Handle null job descriptions`
  - `docs: Update API documentation`
  - `test: Add tests for ResumeService`
  - `refactor: Extract resume validation logic`

## 🚀 Pull Request Process

1. **Ensure your branch is up to date**
```bash
git fetch origin
git rebase origin/main
```

2. **Push your branch**
```bash
git push origin feature/your-feature-name
```

3. **Create Pull Request**
- Link related issues
- Describe changes clearly
- Explain why the change is needed
- Add before/after screenshots if UI changes

4. **Respond to feedback**
- Address review comments
- Re-request review when done

5. **Merge**
- Squash commits if requested
- Delete branch after merge

## 🐛 Bug Reports

Include:
- [ ] Clear description of the bug
- [ ] Steps to reproduce
- [ ] Expected behavior
- [ ] Actual behavior
- [ ] Environment (OS, browser, Node version)
- [ ] Screenshots/logs if applicable

## 💡 Feature Requests

Include:
- [ ] Clear description of feature
- [ ] Why you need it
- [ ] Possible implementation approach
- [ ] Links to similar features

## 📚 Documentation

### README.md
For changes to overall functionality, architecture, or features.

### API.md
For API endpoint changes or new endpoints.

### DEPLOYMENT.md
For deployment process changes or new services.

### Code Comments
For complex logic within code.

## 🧪 Testing Guidelines

### Unit Tests
```typescript
describe('ResumeService', () => {
  it('should generate customized resume', async () => {
    // Arrange
    const input = { ... };
    
    // Act
    const result = await ResumeService.generateCustomizedResume(input);
    
    // Assert
    expect(result).toHaveProperty('resumeId');
  });
});
```

### E2E Tests
```typescript
test('user can apply to a job', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('text=Find Jobs');
  // ... continue test
});
```

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 🔄 Continuous Integration

All PRs must pass:
- [ ] TypeScript compilation (`npm run type-check`)
- [ ] Linting (`npm run lint`)
- [ ] Unit tests (`npm run test`)
- [ ] Coverage thresholds

## 📦 Adding Dependencies

Before adding a new package:

1. Check if functionality already exists
2. Verify package is well-maintained
3. Check bundle size impact
4. Add with `npm install package_name`
5. Update package-lock.json

Avoid adding unnecessary dependencies.

## 🎯 Priority Areas

We particularly welcome contributions in:

1. **Job Platform Integrations**
   - LinkedIn API integration improvements
   - Indeed scraping enhancements
   - ZipRecruiter integration

2. **AI Enhancements**
   - Better resume tailoring
   - Improved job matching
   - Cover letter generation

3. **Feature Development**
   - Interview preparation
   - Salary negotiation
   - Analytics improvements

4. **Performance**
   - Database query optimization
   - Frontend performance
   - API response times

5. **Testing**
   - Expanding test coverage
   - E2E test scenarios
   - Performance testing

## 📞 Questions?

- Open a discussion on GitHub
- Check existing issues for similar questions
- Review documentation

## 🎉 Recognition

We appreciate all contributions! Contributors will be recognized in:
- CONTRIBUTORS.md file
- GitHub contributors list
- Release notes

---

Thank you for making ResumeReach better! 🚀
