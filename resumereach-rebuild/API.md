# ResumeReach API Documentation

Complete API reference for ResumeReach endpoints.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All protected endpoints require authentication headers:

```bash
Authorization: Bearer {session_token}
```

## Response Format

### Success Response (2xx)
```json
{
  "data": { ... },
  "message": "Success",
  "status": "success"
}
```

### Error Response (4xx, 5xx)
```json
{
  "error": "Error message",
  "status": "error",
  "code": "ERROR_CODE"
}
```

## Endpoints

### Authentication

#### POST `/auth/signup`
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password_min_6_chars",
  "name": "John Doe"
}
```

**Response:** 201 Created
```json
{
  "userId": "uuid",
  "message": "User created successfully"
}
```

**Errors:**
- `400` - User already exists
- `400` - Invalid input format

#### POST `/auth/signin`
Sign in with credentials.

**Request:**
```bash
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:** 200 OK
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt_token"
}
```

---

### Profile Management

#### GET `/profile`
Get current user's profile.

**Auth Required:** Yes

**Response:** 200 OK
```json
{
  "userId": "uuid",
  "skills": ["React", "Node.js"],
  "experience": { "years": 5 },
  "targetRoles": ["Senior Developer"],
  "locations": ["Remote"],
  "bio": "Full-stack developer",
  "originalResume": "..."
}
```

#### PUT `/profile`
Update user profile.

**Auth Required:** Yes

**Request:**
```json
{
  "skills": ["React", "Python"],
  "experience": { "years": 7 },
  "targetRoles": ["Tech Lead", "Engineering Manager"],
  "locations": ["Remote", "SF Bay Area"],
  "bio": "Updated bio",
  "originalResume": "..."
}
```

**Response:** 200 OK
```json
{
  "userId": "uuid",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

### Job Preferences

#### GET `/preferences`
Get job search preferences.

**Auth Required:** Yes

**Response:** 200 OK
```json
{
  "targetRoles": ["Backend Developer"],
  "locations": ["Remote"],
  "salaryMin": 120000,
  "salaryMax": 180000,
  "keywords": ["Python", "AWS"],
  "autoApplyEnabled": true,
  "applicationsPerDay": 5,
  "minJobFitScore": 75
}
```

#### POST `/preferences`
Create or update preferences.

**Auth Required:** Yes

**Request:**
```json
{
  "targetRoles": ["Full-Stack Developer"],
  "locations": ["New York", "Remote"],
  "salaryMin": 100000,
  "salaryMax": 150000,
  "keywords": ["JavaScript", "React"],
  "autoApplyEnabled": true,
  "applicationsPerDay": 5,
  "minJobFitScore": 70
}
```

**Response:** 200 OK
```json
{
  "id": "uuid",
  "userId": "uuid",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

### Resumes

#### GET `/resumes`
Get all user resumes.

**Auth Required:** Yes

**Response:** 200 OK
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "originalText": "...",
    "customizedText": "...",
    "customizedForJobId": "uuid",
    "version": 1,
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

#### POST `/resumes`
Generate a customized resume for a job.

**Auth Required:** Yes

**Request:**
```json
{
  "jobDescription": "We are looking for a senior React developer with 5+ years of experience...",
  "jobTitle": "Senior React Developer",
  "companyName": "TechCorp Inc.",
  "jobId": "uuid-optional"
}
```

**Response:** 201 Created
```json
{
  "resumeId": "uuid",
  "customizedText": "...",
  "summary": "Highlighted React expertise and team leadership experience"
}
```

**Errors:**
- `400` - No original resume found
- `429` - Rate limit exceeded

#### GET `/resumes/{id}`
Get a specific resume.

**Auth Required:** Yes

**Response:** 200 OK
```json
{
  "id": "uuid",
  "userId": "uuid",
  "originalText": "...",
  "customizedText": "...",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### DELETE `/resumes/{id}`
Delete a resume.

**Auth Required:** Yes

**Response:** 204 No Content

---

### Applications

#### GET `/applications`
Get all applications.

**Auth Required:** Yes

**Query Parameters:**
- `status` - Filter by status (submitted, pending_review, rejected, approved)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)

**Response:** 200 OK
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "jobId": "uuid",
    "resumeId": "uuid",
    "status": "submitted",
    "responseStatus": "no_response",
    "appliedAt": "2024-01-15T10:00:00Z",
    "appliedVia": "linkedin",
    "job": {
      "title": "Senior Developer",
      "company": "TechCorp",
      "location": "Remote",
      "url": "https://..."
    }
  }
]
```

#### POST `/applications`
Create a new application.

**Auth Required:** Yes

**Request:**
```json
{
  "jobId": "uuid",
  "resumeId": "uuid",
  "appliedVia": "linkedin"
}
```

**Response:** 201 Created
```json
{
  "id": "uuid",
  "userId": "uuid",
  "jobId": "uuid",
  "resumeId": "uuid",
  "status": "submitted",
  "appliedAt": "2024-01-15T10:00:00Z"
}
```

**Errors:**
- `400` - Already applied to this job
- `400` - Insufficient credits
- `401` - Unauthorized

#### GET `/applications/{id}`
Get a specific application.

**Auth Required:** Yes

**Response:** 200 OK
```json
{
  "id": "uuid",
  "status": "submitted",
  "job": { ... },
  "resume": { ... }
}
```

#### PUT `/applications/{id}/status`
Update application status.

**Auth Required:** Yes

**Request:**
```json
{
  "status": "interview_scheduled",
  "responseStatus": "interviewed"
}
```

**Response:** 200 OK

---

### Billing

#### GET `/billing`
Get billing information.

**Auth Required:** Yes

**Response:** 200 OK
```json
{
  "subscription": {
    "plan": "pro",
    "status": "active",
    "currentPeriodStart": "2024-01-01T00:00:00Z",
    "currentPeriodEnd": "2024-02-01T00:00:00Z",
    "nextBillingDate": "2024-02-01T00:00:00Z"
  },
  "credits": {
    "balance": 250,
    "totalPurchased": 500,
    "totalUsed": 250
  },
  "transactions": [
    {
      "id": "uuid",
      "type": "credit_purchase",
      "amount": "25.00",
      "creditsAdded": 100,
      "status": "completed",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### POST `/billing/credits`
Create a checkout session for credits.

**Auth Required:** Yes

**Request:**
```json
{
  "creditsPackageId": "credits_100"
}
```

**Available packages:**
- `credits_30` - 30 credits for $10
- `credits_100` - 100 credits for $25
- `credits_250` - 250 credits for $50

**Response:** 200 OK
```json
{
  "sessionId": "stripe_session_id",
  "url": "https://checkout.stripe.com/..."
}
```

#### POST `/billing/subscription`
Create a subscription checkout session.

**Auth Required:** Yes

**Request:**
```json
{
  "planId": "plan_pro_monthly"
}
```

**Available plans:**
- `plan_basic_monthly` - $9.99/month
- `plan_pro_monthly` - $24.99/month
- `plan_basic_yearly` - $99.99/year
- `plan_pro_yearly` - $249.99/year

**Response:** 200 OK
```json
{
  "sessionId": "stripe_session_id",
  "url": "https://checkout.stripe.com/..."
}
```

---

### Jobs

#### GET `/jobs`
Get available jobs.

**Query Parameters:**
- `search` - Search by title or company
- `role` - Filter by role
- `location` - Filter by location
- `salaryMin` - Minimum salary
- `salaryMax` - Maximum salary
- `page` - Page number
- `limit` - Results per page

**Response:** 200 OK
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Senior Developer",
      "company": "TechCorp",
      "location": "Remote",
      "salary": {
        "min": 120000,
        "max": 180000
      },
      "description": "We are looking for...",
      "url": "https://...",
      "postedAt": "2024-01-15T10:00:00Z",
      "matchScore": 85
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 15
}
```

---

### Health Check

#### GET `/health`
Check service health.

**Auth Required:** No

**Response:** 200 OK
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": "5ms"
    },
    "redis": {
      "status": "healthy",
      "responseTime": "2ms"
    }
  }
}
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT` | 429 | Too many requests |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limiting

- **Auth endpoints:** 5 requests per minute
- **Application endpoints:** 10 requests per minute
- **General endpoints:** 30 requests per minute

---

## Testing with cURL

### Sign up
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123",
    "name":"Test User"
  }'
```

### Get profile
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/profile
```

### Create application
```bash
curl -X POST http://localhost:3000/api/applications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId":"uuid",
    "resumeId":"uuid"
  }'
```

---

Last updated: January 2024
