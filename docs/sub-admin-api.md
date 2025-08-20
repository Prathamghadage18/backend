# Sub-Admin API Documentation

## Overview

The Sub-Admin API provides role-based access control (RBAC) for sub-administrators to manage consultants, verifications, and basic analytics within their assigned scope.

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Role Requirements

- **Role**: `sub-admin`
- **Permissions**: Various permission levels for different operations

## Base URL

```
/api/sub-admin
```

## Endpoints

### 1. Profile Management

#### Get Sub-Admin Profile

- **GET** `/profile`
- **Permission**: `profile_management`
- **Description**: Retrieve the current sub-admin's profile information

**Response:**

```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "role": "sub-admin",
  "contactNumber": "+1234567890",
  "location": "New York",
  "profilePhoto": {
    "url": "https://example.com/photo.jpg"
  },
  "isVerified": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Update Sub-Admin Profile

- **PUT** `/profile`
- **Permission**: `profile_management`
- **Description**: Update the current sub-admin's profile information

**Request Body:**

```json
{
  "name": "John Smith",
  "contactNumber": "+1987654321",
  "location": "Los Angeles"
}
```

**Response:** Updated profile object

### 2. Consultant Management

#### Get Consultants

- **GET** `/consultants`
- **Permission**: `consultant_management`
- **Description**: Retrieve consultants within sub-admin's scope

**Query Parameters:**

- `status` (optional): Filter by status (pending, approved, rejected)
- `search` (optional): Search by name or email

**Response:**

```json
[
  {
    "_id": "consultant_id",
    "status": "pending",
    "specialization": "Technology",
    "user": {
      "_id": "user_id",
      "name": "Jane Consultant",
      "email": "jane@example.com",
      "profilePhoto": {
        "url": "https://example.com/photo.jpg"
      }
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Get Consultants by Status

- **GET** `/consultants/status/:status`
- **Permission**: `consultant_management`
- **Description**: Retrieve consultants filtered by specific status

**Path Parameters:**

- `status`: Consultant status (pending, approved, rejected)

#### Update Consultant Status

- **PUT** `/consultants/:id/status`
- **Permission**: `consultant_management`
- **Description**: Update consultant approval status

**Path Parameters:**

- `id`: Consultant ID

**Request Body:**

```json
{
  "status": "approved",
  "rejectionReason": null
}
```

**Available Statuses for Sub-Admin:**

- `pending`
- `approved`
- `rejected`

### 3. Verification Management

#### Get Verifications

- **GET** `/verifications`
- **Permission**: `verification_management`
- **Description**: Retrieve verification requests within sub-admin's scope

**Query Parameters:**

- `status` (optional): Filter by status (pending, verified, rejected)
- `search` (optional): Search by consultant name or email

#### Update Verification Status

- **PUT** `/verifications/:id/status`
- **Permission**: `verification_management`
- **Description**: Update verification request status

**Path Parameters:**

- `id`: Verification ID

**Request Body:**

```json
{
  "status": "verified",
  "rejectionReason": null
}
```

**Available Statuses for Sub-Admin:**

- `pending`
- `verified`
- `rejected`

### 4. Moderation Queue

#### Get Moderation Queue

- **GET** `/moderation-queue`
- **Permission**: `moderation`
- **Description**: Get pending items requiring review

**Response:**

```json
{
  "pendingConsultants": [
    {
      "_id": "consultant_id",
      "status": "pending",
      "user": {
        "name": "John Consultant",
        "email": "john@example.com"
      }
    }
  ],
  "pendingVerifications": [
    {
      "_id": "verification_id",
      "status": "pending",
      "consultant": {
        "name": "Jane Consultant",
        "email": "jane@example.com"
      }
    }
  ],
  "totalPending": 2
}
```

### 5. Analytics

#### Get Basic Analytics

- **GET** `/analytics`
- **Permission**: `basic_analytics`
- **Description**: Retrieve basic analytics data within sub-admin's scope

**Query Parameters:**

- `range` (optional): Time range (7d, 30d) - defaults to 7d

**Response:**

```json
{
  "summary": {
    "totalConsultants": 150,
    "pendingConsultants": 25,
    "approvedConsultants": 120,
    "rejectedConsultants": 5,
    "totalVerifications": 150,
    "pendingVerifications": 25,
    "verifiedVerifications": 120,
    "recentTransactions": 45
  },
  "range": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-08T23:59:59.999Z"
  }
}
```

## Error Responses

### 401 Unauthorized

```json
{
  "message": "Not authorized, no token provided"
}
```

### 403 Forbidden

```json
{
  "message": "Access denied. Sub-admin role required."
}
```

### 404 Not Found

```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "message": "Server error"
}
```

## RBAC Implementation

### Permission Levels

The sub-admin system implements the following permission levels:

1. **consultant_management**: Manage consultant profiles and statuses
2. **verification_management**: Handle verification requests
3. **basic_analytics**: Access to basic analytics data
4. **profile_management**: Manage own profile
5. **moderation**: Access to moderation queue

### Scope Limitations

- Sub-admins can only modify resources in `pending` status
- Sub-admins can only modify resources they have previously reviewed
- Access is limited to assigned regions and categories (future enhancement)
- Cannot access admin-only endpoints

### Audit Logging

All sub-admin actions are logged for audit purposes, including:

- User ID and email
- Action performed
- Resource accessed
- Timestamp
- IP address
- User agent

## Rate Limiting

- **Window**: 15 minutes
- **Limit**: 100 requests per IP address
- **Message**: "Too many requests from this IP, please try again later."

## Future Enhancements

1. **Granular Permissions**: Individual permission assignment per sub-admin
2. **Regional Access Control**: Limit access to specific geographic regions
3. **Category-based Moderation**: Assign specific business categories
4. **Performance Metrics**: Track sub-admin performance and accuracy
5. **Workflow Management**: Implement approval workflows and escalations
