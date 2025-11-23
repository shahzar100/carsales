# API Testing Documentation

This project includes comprehensive unit tests for all API endpoints using Jest and MongoDB Memory Server.

## Test Setup

### Installing Dependencies

To install the testing dependencies, run:

```bash
npm install
```

This will install all the necessary testing packages including:

- `jest` - Testing framework
- `@types/jest` - TypeScript types for Jest
- `ts-jest` - TypeScript support for Jest
- `mongodb-memory-server` - In-memory MongoDB for testing
- `supertest` - HTTP assertion library

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### Public API Tests

- `/api/shop` - Shop information retrieval
- `/api/bookings/service` - Service appointment booking
- `/api/bookings/viewing` - Car viewing appointment booking
- `/api/bookings/lookup` - Booking reference lookup

### Admin API Tests (Authentication Required)

- `/api/admin/login` - Admin authentication
- `/api/admin/cars` - CRUD operations for vehicles
- `/api/admin/shop` - Shop information management
- `/api/bookings/cancel` - Booking cancellation with notifications

## Test Features

### Database Testing

- Uses MongoDB Memory Server for isolated testing
- Each test gets a fresh database instance
- Automatic cleanup between tests
- Realistic database operations testing

### Authentication Testing

- Mocked authentication for admin routes
- Tests both authenticated and unauthenticated scenarios
- Session handling verification

### Email Testing

- Mocked email service (Resend)
- Verification that emails are sent with correct data
- Email template testing

### Error Handling

- Database connection failures
- Invalid input validation
- Missing required fields
- Malformed JSON handling
- Authorization errors

### Environment Variables

- Tests use isolated test environment variables
- Business information testing with environment overrides
- Configuration validation

## Test Coverage

The test suite covers:

- ✅ All API endpoint methods (GET, POST, PUT, DELETE)
- ✅ Success scenarios with valid data
- ✅ Error scenarios with invalid data
- ✅ Authentication and authorization
- ✅ Database operations and data persistence
- ✅ Email notifications
- ✅ Environment variable integration
- ✅ Input validation
- ✅ Edge cases and error conditions

## Test Files Structure

```
__tests__/
├── utils/
│   └── testUtils.ts          # Shared testing utilities and mocks
├── api/
│   ├── shop.test.ts          # Shop info API tests
│   ├── bookings/
│   │   ├── service.test.ts   # Service booking tests
│   │   ├── viewing.test.ts   # Car viewing tests
│   │   ├── lookup.test.ts    # Booking lookup tests
│   │   └── cancel.test.ts    # Booking cancellation tests
│   └── admin/
│       ├── login.test.ts     # Admin authentication tests
│       ├── cars.test.ts      # Car management tests
│       └── shop.test.ts      # Admin shop management tests
└── types.d.ts               # TypeScript declarations for Jest
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

- No external dependencies (uses in-memory database)
- Fast execution time
- Deterministic results
- Comprehensive error reporting

## Coverage Reports

Coverage reports are generated in the `coverage/` directory and include:

- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

View coverage reports by opening `coverage/lcov-report/index.html` in your browser after running `npm run test:coverage`.

## Best Practices Implemented

1. **Isolation**: Each test runs independently
2. **Cleanup**: Database is cleaned between tests
3. **Mocking**: External services are properly mocked
4. **Realistic Data**: Test data mirrors production scenarios
5. **Error Testing**: Both success and failure paths are tested
6. **Documentation**: Tests serve as living documentation
7. **Fast Execution**: Tests run quickly for rapid feedback
