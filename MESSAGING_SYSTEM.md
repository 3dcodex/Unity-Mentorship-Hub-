# Secure Messaging System - Documentation

## Overview
Connection-based messaging system that ensures users can only message people they have an approved connection with.

## Core Principles

### ✅ Users Can ONLY Message:
1. A mentor they booked
2. A student who booked them
3. Someone they have an approved connection with

### 🚫 No Connection = No Chat Access

## Database Structure

### 1. Users Collection with Connections
```
users/
  └─ {userId}/
       ├─ name
       ├─ role (student | mentor | admin)
       └─ connections/ (subcollection)
            └─ {connectionId}
                 ├─ connectedUserId
                 ├─ status (pending | accepted | blocked)
                 ├─ createdAt
                 └─ sessionId (optional)
```

### 2. Conversations Collection
```
conversations/
  └─ {conversationId}  // Format: userId1_userId2 (sorted)
       ├─ participants: [userId1, userId2]
       ├─ lastMessage
       ├─ lastUpdated
       ├─ sessionId (optional)
       ├─ isActive (true/false)
       └─ messages/ (subcollection)
            └─ {messageId}
                 ├─ senderId
                 ├─ text
                 ├─ createdAt
                 ├─ isRead
                 └─ type (text | file | system)
```

## Connection Creation

### Scenario 1: After Booking (Automatic)
When a student books a mentor:
1. Create session document
2. Create connection for both users (status: 'accepted')
3. Create conversation document
4. Both can now message each other

### Scenario 2: Manual Request (Optional - Future)
1. Student sends connection request (status: 'pending')
2. Mentor accepts (status: 'accepted')
3. Create conversation
4. Enable messaging

## Security Rules

### Firestore Security Rules (CRITICAL)
```javascript
// Conversations - only participants can access
match /conversations/{conversationId} {
  allow read: if request.auth != null 
    && request.auth.uid in resource.data.participants;
  allow create: if request.auth != null 
    && request.auth.uid in request.resource.data.participants;
  allow update: if request.auth != null 
    && request.auth.uid in resource.data.participants;
  
  // Messages subcollection
  match /messages/{messageId} {
    allow read: if request.auth != null 
      && request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
    allow create: if request.auth != null 
      && request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants
      && request.auth.uid == request.resource.data.senderId;
  }
}
```

## API Functions

### messagingService.ts

#### createConnection
```typescript
createConnection(userId: string, connectedUserId: string, sessionId?: string)
```
Creates bidirectional connection between two users.

#### checkConnection
```typescript
checkConnection(userId: string, otherUserId: string): Promise<boolean>
```
Validates if two users have an accepted connection.

#### createConversation
```typescript
createConversation(userId: string, otherUserId: string, sessionId?: string): Promise<string>
```
Creates conversation only if connection exists. Throws error if no connection.

#### sendMessage
```typescript
sendMessage(conversationId: string, senderId: string, text: string)
```
Sends message with validation that sender is a participant.

#### getConversations
```typescript
getConversations(userId: string): Promise<Conversation[]>
```
Retrieves all conversations for a user.

#### getMessages
```typescript
getMessages(conversationId: string): Promise<Message[]>
```
Retrieves all messages in a conversation.

## Integration Flow

### When Booking is Confirmed:
```typescript
// In MentorshipBooking.tsx
const sessionDoc = await addDoc(collection(db, 'bookings'), {...});

// Create connection and conversation
const { createConnection, createConversation } = await import('../services/messagingService');
await createConnection(user.uid, mentorId, sessionDoc.id);
await createConversation(user.uid, mentorId, sessionDoc.id);
```

### Accessing Messages:
```typescript
// Navigate to messages page
navigate('/messages');

// Messages page automatically loads only conversations where user is a participant
```

## Features

### ✅ Implemented
- Connection-based messaging
- Automatic connection creation on booking
- Secure conversation creation
- Real-time message updates
- Participant validation
- Firestore security rules

### 🔄 Future Enhancements
1. **Read Receipts**: Track when messages are read
2. **Typing Indicators**: Show when other user is typing
3. **File Sharing**: Send images and documents
4. **Message Reactions**: React to messages with emojis
5. **Soft Delete**: Delete messages for yourself only
6. **Blocking**: Block users from messaging
7. **Group Conversations**: Support for group mentorship sessions
8. **Push Notifications**: Real-time message notifications

## Usage

### For Students:
1. Book a mentorship session
2. Connection is automatically created
3. Access messages via `/messages` route
4. Start chatting with your mentor

### For Mentors:
1. When a student books you
2. Connection is automatically created
3. Access messages via `/messages` route
4. Start chatting with your student

### Validation:
- System checks connection before allowing message creation
- Firestore rules enforce participant validation
- No way to bypass connection requirement

## Error Handling

### Common Errors:
- "Users are not connected" - Thrown when trying to create conversation without connection
- "Conversation not found" - Invalid conversation ID
- "Unauthorized" - User not a participant in conversation

## Testing

### Test Connection Creation:
1. Book a session as a student
2. Check `users/{userId}/connections` collection
3. Verify connection exists for both users
4. Verify status is 'accepted'

### Test Messaging:
1. Navigate to `/messages`
2. Select a conversation
3. Send a message
4. Verify message appears in real-time
5. Check other user can see the message

### Test Security:
1. Try to access conversation without connection (should fail)
2. Try to send message to random user (should fail)
3. Verify Firestore rules block unauthorized access

## Deployment

### Update Firestore Rules:
```bash
firebase deploy --only firestore:rules
```

### Deploy Application:
```bash
npm run build
firebase deploy
```

## Support

For issues or questions about the messaging system, refer to this documentation or contact the development team.
