## Instinet Institute Management

Simple Express + EJS application for institute management (users, announcements, dashboards).

## Getting Started

Install dependencies:
```
npm install
```

Run development server with auto-reload:
```
npm run dev
```

Production style start:
```
npm start
```

Environment variables (create a `.env`):
```
MONGODB_URI=mongodb://localhost:27017/instinet
SESSION_SECRET=change_me
PORT=8080
```

## Testing

Basic tests use Jest + Supertest.

Run all tests:
```
npm test
```

Sample tests included:
- `tests/health.test.js` – smoke test for `/health` and home page rendering.
- `tests/models/announcement.model.test.js` – schema validation & default fields.

Add a route test example:
```
// tests/announcements.test.js
const request = require('supertest');
const app = require('../app');

describe('Announcements listing', () => {
	it('requires auth (expect redirect or 401)', async () => {
		const res = await request(app).get('/announcements');
		expect([302,401]).toContain(res.status);
	});
});
```

Notes:
- Tests import `app` (no server listen) for speed.
- Model validation tests run without a live Mongo connection. Add integration tests later if needed.
- Enable coverage by setting `collectCoverage: true` in `jest.config.js` then:
```
npm test -- --coverage
```

## Folder Structure (excerpt)
```
app.js            # Express app exported for tests
server.js         # Starts server & connects DB (skipped in test env)
routes/           # Route modules
controllers/      # Business logic
models/           # Mongoose schemas
views/            # EJS templates
public/           # Static assets
tests/            # Jest test files
```

## Next Steps
- Add auth mocks for protected route tests.
- Introduce in-memory Mongo (mongodb-memory-server) for integration tests.
- Expand model tests (announcements CRUD lifecycle).

