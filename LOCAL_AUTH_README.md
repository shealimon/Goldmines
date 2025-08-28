# Local Authentication System

This project has been migrated from Supabase to a local authentication system to resolve deployment issues.

## Features

- Local user registration and login
- JWT-based authentication
- In-memory data storage (replace with database in production)
- Demo user account pre-configured

## Demo Account

For testing purposes, a demo account is automatically created:

- **Email:** demo@goldmines.com
- **Password:** demo123

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/profile` - Get user profile (requires auth token)
- `PUT /api/auth/profile` - Update user profile (requires auth token)

### Business Ideas
- `GET /api/business-ideas` - Get all business ideas
- `POST /api/business-ideas` - Create new business idea

### Reddit Integration
- `POST /api/reddit` - Fetch and process Reddit posts

## Environment Variables

Optional JWT secret (has fallback):
```
JWT_SECRET=your-secret-key-here
```

## Data Storage

Currently using in-memory storage for:
- Users and profiles
- Business ideas
- Reddit posts

**Important:** For production deployment, replace the in-memory storage in `lib/local-auth.ts` with a proper database.

## Migration Notes

- Removed all Supabase dependencies
- Created local JWT-based authentication
- Maintained API compatibility
- Updated all auth-related pages and components
- Demo account automatically created on startup

## Security Considerations

1. Change the JWT secret in production
2. Implement proper database storage
3. Add rate limiting
4. Add input validation and sanitization
5. Implement proper session management

## Deployment Ready

The application should now build and deploy successfully without external dependencies.
