# Mentorship Booking & Session Flow

## 📋 How It Works

### 1. **Booking Process**

**Student Side:**
1. Browse mentors (Member Directory, Mentor Matching, Profile View)
2. Click "Book Session" button on mentor's profile
3. Select session type (30min chat, 60min video, resume review, etc.)
4. Choose available time slot
5. Add optional notes about what to discuss
6. Confirm booking

**What Happens:**
- Booking created in Firestore `bookings` collection
- Both student and mentor receive notifications
- Session appears in both dashboards

---

### 2. **Notifications**

**Mentor Receives:**
- Title: "New Session Booked"
- Message: "{Student Name} booked a {Session Type} session with you on {Date} at {Time}"
- Click notification → Goes to `/mentorship/history`

**Student Receives:**
- Title: "Session Confirmed"
- Message: "Your {Session Type} with {Mentor Name} on {Date} at {Time} is confirmed"
- Click notification → Goes to `/mentorship/history`

---

### 3. **Session Management**

**Before Session:**
- Both parties see session in `/mentorship/history`
- Status: "Upcoming"
- Actions available:
  - **Join Session** - Opens Quick Chat for video/text communication
  - **Message** - Send pre-session messages
  - **Reschedule** - Change time (future feature)
  - **Cancel** - Cancel with reason

**During Session:**
- Click "Join Session" button
- Opens Quick Chat with mentor/student
- Conduct session via:
  - Text chat (current)
  - Video call (future: Zoom/custom integration)
  - Screen sharing (future)

**After Session:**
- Status changes to "Completed"
- Student can:
  - Add notes about what was discussed
  - Rate the session (1-5 stars)
  - Leave written feedback
- Mentor can:
  - Mark session complete
  - Add notes

---

### 4. **Current Implementation**

✅ **Working:**
- Professional booking modal with 3-step wizard
- Session type selection (5 types)
- Time slot booking
- Notifications for both parties
- Session history dashboard
- Quick Chat integration
- Cancel/reschedule options
- Notes and ratings

🚧 **Future Enhancements:**
- Video call integration (Zoom/Google Meet)
- Automated reminders (24h, 1h before)
- Calendar sync (Google Calendar, Outlook)
- Payment processing (Stripe)
- Escrow system
- Mentor earnings dashboard
- Session recordings
- Automated meeting links

---

### 5. **How Sessions Are Conducted**

**Current Method:**
1. Student clicks "Join Session" at scheduled time
2. Opens Quick Chat with mentor
3. Conduct session via text chat
4. Share resources, links, advice
5. After session, both mark complete

**Future Method (With Video):**
1. System generates unique meeting link
2. Both receive link in notification
3. Click "Join Session" → Opens video call
4. Built-in video/audio/screen share
5. Auto-record (optional)
6. After session, review recording

---

### 6. **Data Structure**

**Booking Document:**
```javascript
{
  id: "auto-generated",
  studentId: "user123",
  studentName: "John Doe",
  studentEmail: "john@example.com",
  mentorId: "mentor456",
  mentorName: "Jane Smith",
  sessionType: "60 Min Video Call",
  sessionDuration: 60,
  scheduledDate: "2024-01-15",
  scheduledTime: "14:00",
  timezone: "America/New_York",
  studentNotes: "Want to discuss career transition",
  price: 0,
  platformFee: 0,
  totalAmount: 0,
  status: "confirmed", // pending, confirmed, completed, cancelled
  paymentStatus: "unpaid", // unpaid, paid, refunded
  meetingLink: null, // Future: Zoom/custom link
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

### 7. **Access Points**

**Students can book from:**
- `/community/directory` - Member Directory
- `/mentorship/match` - AI Mentor Matching
- `/profile-view/:userId` - Any mentor's profile

**View sessions:**
- `/mentorship/history` - Session History dashboard
- `/notifications` - Click booking notifications

**Conduct sessions:**
- `/quick-chat?user={mentorId}` - Quick Chat

---

### 8. **Security & Rules**

**Firestore Rules:**
- Students can create bookings (only their own)
- Students and mentors can read their bookings
- Students, mentors, admins can update bookings
- Students and admins can delete bookings
- All authenticated users can create notifications
- Users can only read their own notifications

---

## 🎯 Summary

**Current Flow:**
1. Book → Notify → View in History → Join Chat → Complete → Rate

**Future Flow:**
1. Book → Pay → Notify → Remind → Join Video → Record → Complete → Rate → Payout

The system is production-ready for free sessions and architecturally prepared for monetization!
