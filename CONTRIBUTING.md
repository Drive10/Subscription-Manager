# Contributing

## Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run tests: `cd backend-nest && npm test` and `cd frontend-next && npx playwright test`
5. Commit: `git commit -m "feat: my feature"`
6. Push: `git push origin feat/my-feature`
7. Open a Pull Request

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix     | Usage                          |
| ---------- | ------------------------------ |
| `feat:`    | New feature                    |
| `fix:`     | Bug fix                        |
| `refactor:`| Code change without fix/feature|
| `test:`    | Adding or updating tests       |
| `docs:`    | Documentation changes          |
| `chore:`   | Build, CI, dependencies        |

## Code Style

- TypeScript strict mode
- NestJS service → controller pattern (no logic in controllers)
- React functional components with hooks
- Tailwind CSS for styling (no CSS modules)
- Follow existing patterns in the codebase

## Testing

- Every bug fix should include a test that reproduces the issue
- Every new feature should include relevant tests
- Backend: Jest unit tests for services
- Frontend: Playwright E2E tests for user flows

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Keep PRs focused on a single concern
4. Reference any related issues in the description
