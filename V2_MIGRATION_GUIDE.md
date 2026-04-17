# Cincailah V2 - Complete Migration & Setup Guide

## 🎉 What's New in V2

### Authentication System
- ✅ Email + password registration
- ✅ Secure login with bcrypt
- ✅ Forgot password flow with reset tokens
- ✅ Session-based authentication

### Multi-Group Support
- ✅ Create unlimited Makan groups
- ✅ Join multiple groups with Makan Codes
- ✅ Quick group switcher
- ✅ Last active group remembered

### Landing Page
- ✅ Full marketing page with Malaysian style
- ✅ Features, testimonials, CTA sections
- ✅ Emoji-rich design
- ✅ Mobile-responsive

### Navigation
- ✅ "← My Groups" link in top nav
- ✅ "Switch Group" button in settings
- ✅ Seamless navigation between groups

---

## 🚀 Quick Start (Local Testing)

### 1. Update .env File
Make sure your `.env` has valid credentials:

```bash
DATABASE_URL="postgresql://user:password@host:port/database"
SESSION_SECRET="your-secure-random-string-min-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Database is Already Migrated
The schema has been updated and pushed. Your database now has:
- `users` table with email, password_hash, reset_token fields
- All existing data has been wiped (fresh start)

### 3. Install Dependencies (if needed)
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Test the Flow
1. Open http://localhost:3000
2. See the new landing page
3. Click "Get Started" to register
4. Create an account with email + password
5. You'll be redirected to "My Groups" page
6. Click "Create New Group"
7. Enter a group name
8. You'll get a unique Makan Code
9. Add restaurants and use the app
10. Click "← cincailah" in top nav to go back to groups
11. Create/join more groups and switch between them

---

## 📋 Complete User Flows

### New User Registration
1. Landing page → Click "Get Started"
2. Enter display name, email, password
3. Submit → Auto-logged in
4. Redirected to "My Groups" page
5. Create first group or join existing

### Existing User Login
1. Landing page → Click "Log In"
2. Enter email + password
3. Submit → Redirected to last active group (or My Groups if no active group)

### Forgot Password
1. Login page → Click "Forgot password?"
2. Enter email
3. In development: Reset link shown in console and on screen
4. Click link → Set new password
5. Redirected to login

### Group Management
1. Top nav: Click "← cincailah" logo to go to My Groups
2. My Groups page shows all groups you're in
3. Click any group card to open it
4. Or use "+ Create New Group" / "Join Existing Group"
5. In group settings: Click "← Switch Group" to go back

### Multiple Groups
1. You can be in unlimited groups
2. Each group has its own restaurants and settings
3. Session remembers your last active group
4. Quick switch from settings or top nav

---

## 🗂️ New Files Created

### Authentication
- `app/api/auth/register/route.ts` - Registration API
- `app/api/auth/login/route.ts` - Login API
- `app/api/auth/forgot-password/route.ts` - Forgot password
- `app/api/auth/reset-password/route.ts` - Reset password
- `lib/auth.ts` - Password hashing & validation utilities

### Pages
- `app/register/page.tsx` - Registration page
- `app/login/page.tsx` - Login page (updated)
- `app/forgot-password/page.tsx` - Forgot password page
- `app/reset-password/page.tsx` - Reset password page
- `app/groups/page.tsx` - My Groups selector
- `app/groups/create/page.tsx` - Create group page
- `app/groups/join/page.tsx` - Join group page

### Components
- `components/RegisterPageClient.tsx`
- `components/LoginPageClient.tsx` (recreated)
- `components/ForgotPasswordClient.tsx`
- `components/ResetPasswordClient.tsx`
- `components/MyGroupsClient.tsx`
- `components/CreateGroupClient.tsx`
- `components/JoinGroupClient.tsx`
- `components/LandingPageClient.tsx`

### APIs
- `app/api/groups/create/route.ts` - Create group
- `app/api/groups/join/route.ts` - Join group
- `app/api/groups/switch/route.ts` - Switch active group

### Updated Files
- `prisma/schema.prisma` - Added email, password fields
- `lib/session.ts` - Added email to session
- `app/page.tsx` - Now shows landing page
- `components/TopNav.tsx` - Added "← My Groups" link
- `components/SettingsPage.tsx` - Added "Switch Group" button

### Deleted Files (Old Auth)
- `app/api/auth/create-group/route.ts` (moved to /api/groups/create)
- `app/api/auth/join-group/route.ts` (moved to /api/groups/join)

---

## 🔒 Security Features

### Password Security
- Bcrypt hashing (10 rounds)
- Minimum 8 characters required
- Passwords never stored in plain text

### Reset Token Security
- Cryptographically random 32-byte tokens
- 1-hour expiration
- Single-use (cleared after reset)
- No email enumeration (always returns success)

### Session Security
- Iron-session encrypted cookies
- Server-side session validation
- Secure by default (httpOnly, sameSite)

---

## 🎨 Design Updates

### Landing Page
- Malaysian-style copy ("makan apa?", "cincailah", etc.)
- Emoji-rich sections
- Features showcase
- Testimonials
- CTA sections
- Responsive design

### Navigation
- Top nav now links to My Groups
- Settings page has Switch Group button
- Consistent back navigation
- Breadcrumb-style flow

---

## 🧪 Testing Checklist

- [ ] Register new account
- [ ] Login with created account
- [ ] Logout and login again
- [ ] Test forgot password flow
- [ ] Reset password successfully
- [ ] Create a new group
- [ ] Join existing group with Makan Code
- [ ] Switch between groups
- [ ] Add restaurants in a group
- [ ] Run decision engine (Cincailah mode)
- [ ] Test voting mode (We Fight)
- [ ] Check restaurants page
- [ ] Verify settings page
- [ ] Test logout
- [ ] Try accessing group URL directly (should redirect to login if not logged in)

---

## 📦 Deployment to VPS

### 1. Build the App
```bash
npm run build
```

### 2. Update Production .env
```bash
DATABASE_URL="postgresql://prod_user:prod_pass@your_vps_ip:5432/cincailah"
SESSION_SECRET="your-production-secret-min-32-chars-change-this"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"
```

### 3. Push Database Schema
```bash
npx prisma db push
```

### 4. Start Production Server
```bash
npm start
# Or with PM2:
pm2 start npm --name "cincailah" -- start
```

### 5. Setup Email (Optional)
In production, you'll want to send actual reset password emails.

Update `app/api/auth/forgot-password/route.ts`:
```typescript
// Add email sending logic here
// Use nodemailer, SendGrid, or AWS SES
```

---

## 🐛 Troubleshooting

### Prisma Generation Error
If Prisma fails to generate due to locked files:
```bash
# Stop dev server
# Then run:
npx prisma generate
```

### Session Errors
If you see session-related errors:
1. Check SESSION_SECRET is at least 32 characters
2. Clear browser cookies
3. Restart dev server

### Database Connection
If DB connection fails:
1. Verify DATABASE_URL is correct
2. Check PostgreSQL is running
3. Test connection: `npx prisma db pull`

### Build Errors
If build fails:
1. Delete `.next` folder: `rm -rf .next`
2. Reinstall: `npm install`
3. Rebuild: `npm run build`

---

## 📊 Database Schema Changes

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  reset_token TEXT,
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### All Other Tables
- No changes to groups, restaurants, decisions, votes
- Relationships preserved
- Only user authentication upgraded

---

## 🎯 Next Steps

### Recommended Enhancements
1. **Email Service**: Configure SendGrid/AWS SES for password resets
2. **Rate Limiting**: Add rate limiting to auth endpoints
3. **2FA**: Optional two-factor authentication
4. **OAuth**: Add Google/Facebook login
5. **Email Verification**: Require email verification on signup
6. **Profile Management**: Allow users to update email/password
7. **Group Invites**: Direct invite links instead of just codes

### Optional Features
- Group deletion (owner only)
- Transfer group ownership
- Group member removal (admin only)
- Notification system for votes
- Mobile app (React Native)

---

## 📝 Summary

Cincailah V2 is a complete overhaul of the authentication system. The old nickname-only approach has been replaced with a modern, secure, multi-group system.

**Key Benefits:**
- Users can have multiple groups
- Secure authentication
- Password recovery
- Better user experience
- Professional landing page
- Scalable architecture

**Breaking Changes:**
- All old data has been wiped
- Old auth endpoints removed
- Users must register with email

**Migration Required:**
- Existing users need to re-register
- Groups need to be recreated
- Restaurants need to be re-added

This is the fresh start for production deployment! 🚀
