# Notification Feature in the Commerce Platform

The notification feature provides a comprehensive system for managing and delivering notifications across multiple channels for the e-commerce platform.

## Core Architecture

### 1. Data Models & Repositories
- **Notification Repository**: A unified repository that manages:
  - **Notifications**: Core notification information, status, and metadata
  - **Notification Templates**: Reusable templates for consistent communication
  - **Notification Categories**: For grouping and organizing notifications
  - **Notification Preferences**: User-specific preferences for receiving notifications

### 2. Domain Model
The domain model provides TypeScript interfaces aligned with the platform's standardized naming convention:
- TypeScript interfaces use `camelCase` properties
- Database columns use `snake_case` names
- Explicit mapping between the two naming styles

### 3. Delivery Channels
The notification system supports multiple delivery channels:
- Email
- SMS
- Push notifications
- In-app notifications
- Webhooks

## Database Structure & Naming Convention

The notification feature follows the platform's standardized approach:

### Database Columns (snake_case)
```sql
-- Example of column naming in the database
user_id
notification_type
is_read
sent_at
action_url
created_at
```

### TypeScript Interfaces (camelCase)
```typescript
// Example of property naming in TypeScript interfaces
interface BaseNotification {
  userId: string;
  notificationType: NotificationType;
  isRead: boolean;
  sentAt: string;
  actionUrl: string;
  createdAt: string;
}
```

### Field Mapping Implementation
The repository implements explicit mapping between database columns and TypeScript properties:

1. **Mapping Dictionaries**:
   ```typescript
   const dbToTsMapping: Record<string, string> = {
     'user_id': 'userId',
     'notification_type': 'notificationType',
     'is_read': 'isRead',
     'sent_at': 'sentAt',
     'action_url': 'actionUrl',
     'created_at': 'createdAt',
     // ...other mappings
   };
   ```

2. **Transformation Methods**:
   ```typescript
   // Convert database column to TypeScript property
   private dbToTs(columnName: string): string { /* ... */ }
   
   // Convert TypeScript property to database column
   private tsToDb(propertyName: string): string { /* ... */ }
   ```

3. **Query Generation**:
   ```typescript
   // Generate SQL with proper field mapping
   private generateSelectFields(): string { /* ... */ }
   ```

## Key Workflows

### Notification Creation
1. A notification is generated, either manually or via a system event
2. The appropriate template is selected and populated with data
3. The notification is saved to the database
4. The notification is queued for delivery through appropriate channel(s)

### Notification Delivery
1. The delivery system processes the queue
2. Each notification is sent through its designated channel(s)
3. Delivery status and metrics are recorded
4. Failed deliveries are retried based on configuration

### Notification Management
1. Users can view their notifications
2. Users can mark notifications as read
3. Users can update their notification preferences
4. Expired notifications are automatically archived

## Recent Changes

The notification feature has been updated to align with the platform's standardized naming convention:

1. **Database Structure**: Updated all column names to use snake_case (e.g., `user_id`, `is_read`)
2. **TypeScript Interfaces**: Maintained camelCase for property names (e.g., `userId`, `isRead`)
3. **Explicit Mapping**: Added mapping dictionaries and helper methods to transform between naming conventions
4. **Repository Updates**: Updated all SQL queries to use snake_case column names while preserving camelCase in API responses

This standardization creates consistency across the entire platform and better aligns with TypeScript/JavaScript best practices while maintaining proper SQL conventions for the database schema.

## Integration Points

The notification feature integrates with several other platform components:

- **User Management**: For notification preferences and user targeting
- **Order System**: For order-related notifications
- **Marketing**: For promotional and campaign notifications
- **Inventory**: For back-in-stock and product availability notifications
- **Customer Service**: For support-related communications
