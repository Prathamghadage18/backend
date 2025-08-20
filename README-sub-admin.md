# Sub-Admin Backend Implementation

## Overview

This document describes the implementation of the sub-admin backend system with Role-Based Access Control (RBAC) for the Cygen Consultancy platform.

## Architecture

### 1. Core Components

#### Sub-Admin Controller (`controllers/sub-admin.controller.js`)

- **Profile Management**: CRUD operations for sub-admin profiles
- **Consultant Management**: Limited scope consultant operations
- **Verification Management**: Handle verification requests
- **Analytics**: Basic analytics within sub-admin scope
- **Moderation Queue**: Access to pending items requiring review

#### Sub-Admin Routes (`routes/sub-admin.routes.js`)

- RESTful API endpoints with proper HTTP methods
- Middleware-based permission enforcement
- Audit logging for all operations
- Rate limiting and scope validation

#### Sub-Admin Middleware (`middleware/sub-admin.js`)

- Permission-based access control
- Audit logging and monitoring
- Rate limiting configuration
- Scope validation and resource protection

#### Sub-Admin Model (`models/SubAdmin.js`)

- Extended user model with sub-admin specific fields
- Permission management system
- Performance tracking and metrics
- Regional and category-based access control

### 2. RBAC Implementation

#### Permission Levels

```javascript
const SUB_ADMIN_PERMISSIONS = {
  CONSULTANT_MANAGEMENT: "consultant_management",
  VERIFICATION_MANAGEMENT: "verification_management",
  BASIC_ANALYTICS: "basic_analytics",
  PROFILE_MANAGEMENT: "profile_management",
  MODERATION: "moderation",
};
```

#### Role Hierarchy

```
Admin (Full Access)
├── Sub-Admin (Limited Scope)
│   ├── Consultant Management
│   ├── Verification Management
│   ├── Basic Analytics
│   ├── Profile Management
│   └── Moderation
├── Consultant (Service Provider)
└── User (Customer)
```

#### Access Control Matrix

| Resource        | Admin | Sub-Admin    | Consultant | User |
| --------------- | ----- | ------------ | ---------- | ---- |
| All Users       | ✅    | ❌           | ❌         | ❌   |
| Consultants     | ✅    | ✅ (Limited) | ❌         | ❌   |
| Verifications   | ✅    | ✅ (Limited) | ❌         | ❌   |
| Analytics       | ✅    | ✅ (Basic)   | ❌         | ❌   |
| Transactions    | ✅    | ❌           | ❌         | ❌   |
| System Settings | ✅    | ❌           | ❌         | ❌   |

### 3. Security Features

#### Authentication

- JWT-based token authentication
- Token validation on every request
- Automatic token expiration handling

#### Authorization

- Role-based access control
- Permission-based endpoint protection
- Resource-level access validation

#### Audit Logging

- All sub-admin actions are logged
- Includes user ID, action, resource, timestamp
- IP address and user agent tracking
- Future: Database storage for compliance

#### Rate Limiting

- 15-minute sliding window
- 100 requests per IP address
- Configurable limits per endpoint

### 4. API Endpoints

#### Base URL: `/api/sub-admin`

| Method | Endpoint                      | Permission                | Description                |
| ------ | ----------------------------- | ------------------------- | -------------------------- |
| GET    | `/profile`                    | `profile_management`      | Get sub-admin profile      |
| PUT    | `/profile`                    | `profile_management`      | Update sub-admin profile   |
| GET    | `/consultants`                | `consultant_management`   | List consultants           |
| GET    | `/consultants/status/:status` | `consultant_management`   | Get consultants by status  |
| PUT    | `/consultants/:id/status`     | `consultant_management`   | Update consultant status   |
| GET    | `/verifications`              | `verification_management` | List verifications         |
| PUT    | `/verifications/:id/status`   | `verification_management` | Update verification status |
| GET    | `/moderation-queue`           | `moderation`              | Get pending items          |
| GET    | `/analytics`                  | `basic_analytics`         | Get basic analytics        |

### 5. Data Models

#### User Model Extensions

```javascript
// Sub-admin specific fields in User model
role: {
  type: String,
  enum: ["user", "consultant", "admin", "sub-admin"],
  default: "user"
}
```

#### SubAdmin Model

```javascript
{
  user: ObjectId, // Reference to User
  assignedRegions: [String], // Geographic scope
  assignedCategories: [String], // Business categories
  permissions: [String], // Permission array
  workSchedule: Object, // Working hours
  performance: Object, // Metrics tracking
  status: String, // Account status
  certifications: [Object] // Training records
}
```

### 6. Middleware Chain

#### Request Flow

```
1. Authentication (protect)
2. Role Validation (subAdmin)
3. Scope Validation (validateSubAdminScope)
4. Permission Check (hasPermission)
5. Resource Validation (canModifyResource)
6. Audit Logging (auditSubAdminAction)
7. Controller Execution
8. Response
```

#### Middleware Functions

- `protect`: JWT token validation
- `subAdmin`: Role verification
- `validateSubAdminScope`: Prevent admin endpoint access
- `hasPermission`: Check specific permissions
- `canModifyResource`: Validate resource modification rights
- `auditSubAdminAction`: Log all actions

### 7. Error Handling

#### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (Invalid data)
- `401`: Unauthorized (No token)
- `403`: Forbidden (Insufficient permissions)
- `404`: Not Found (Resource doesn't exist)
- `429`: Too Many Requests (Rate limit exceeded)
- `500`: Internal Server Error

#### Error Response Format

```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 8. Testing

#### Test Coverage

- Authentication and authorization
- Permission enforcement
- Resource access validation
- Error handling
- RBAC consistency

#### Running Tests

```bash
# Install test dependencies
npm install --save-dev jest supertest mongodb-memory-server

# Run tests
npm test

# Run specific test file
npm test tests/sub-admin.test.js
```

### 9. Configuration

#### Environment Variables

```env
# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d

# Database
MONGODB_URI=your_mongodb_connection_string

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Constants

```javascript
// config/constants.js
export const CONSULTANT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export const VERIFICATION_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
};
```

### 10. Future Enhancements

#### Planned Features

1. **Granular Permissions**: Individual permission assignment
2. **Regional Access Control**: Geographic scope limitations
3. **Category-based Moderation**: Business category assignments
4. **Performance Metrics**: Sub-admin performance tracking
5. **Workflow Management**: Approval workflows and escalations
6. **Advanced Analytics**: Detailed reporting and insights
7. **Mobile API**: Mobile-optimized endpoints
8. **Webhook Support**: Real-time notifications

#### Scalability Considerations

- Database indexing for performance
- Caching layer for frequently accessed data
- Load balancing for high-traffic scenarios
- Microservices architecture for complex operations
- API versioning for backward compatibility

### 11. Deployment

#### Production Checklist

- [ ] Environment variables configured
- [ ] Database connections secured
- [ ] SSL/TLS certificates installed
- [ ] Rate limiting configured
- [ ] Monitoring and logging enabled
- [ ] Backup strategies implemented
- [ ] Security headers configured
- [ ] CORS policies set

#### Monitoring

- API response times
- Error rates and types
- Rate limit violations
- Authentication failures
- Resource usage metrics

### 12. Security Best Practices

#### Authentication

- Use strong JWT secrets
- Implement token refresh mechanisms
- Set appropriate token expiration times
- Validate token claims

#### Authorization

- Principle of least privilege
- Regular permission audits
- Session management
- Access logging

#### Data Protection

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF token validation

### 13. Troubleshooting

#### Common Issues

1. **Authentication Errors**: Check JWT token validity
2. **Permission Denied**: Verify user role and permissions
3. **Rate Limit Exceeded**: Check request frequency
4. **Resource Not Found**: Validate resource IDs
5. **Database Errors**: Check connection and queries

#### Debug Mode

```javascript
// Enable debug logging
if (process.env.NODE_ENV === "development") {
  console.log("Sub-Admin Debug:", {
    user: req.user,
    permissions: req.user.permissions,
    action: req.method + " " + req.originalUrl,
  });
}
```

## Conclusion

The sub-admin backend implementation provides a robust, secure, and scalable solution for managing consultant operations with proper RBAC controls. The system is designed to be maintainable, testable, and extensible for future requirements.

For questions or issues, please refer to the API documentation or contact the development team.
