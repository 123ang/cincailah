# 🚀 Cincailah V2 - Quick Start Guide

## 1️⃣ Start the Dev Server (If Not Running)

```bash
cd c:\Users\User\Desktop\Website\cincailah
npm run dev
```

The server will start at http://localhost:3000

---

## 2️⃣ First Visit: Landing Page

Open http://localhost:3000 in your browser.

You'll see the new marketing landing page with:
- Hero section with animated emojis
- Features showcase
- How it works section
- Testimonials
- Call-to-action buttons

---

## 3️⃣ Create Your Account

1. Click **"Get Started"** or **"Create Account"**
2. Fill in the form:
   - **Display Name**: Your name (e.g., "Ahmad")
   - **Email**: your@email.com
   - **Password**: At least 8 characters
   - **Confirm Password**: Same as above
3. Click **"Create Account"**

You'll be automatically logged in and redirected to "My Groups" page.

---

## 4️⃣ Create Your First Makan Group

On the "My Groups" page:

1. Click **"+ Create New Group"**
2. Enter a group name (e.g., "Office Lunch Crew")
3. Click **"Create Group"**

You'll receive a unique **Makan Code** (e.g., "ABC123") that others can use to join.

---

## 5️⃣ Add Restaurants

1. Navigate to the **"Restaurants"** tab (bottom nav)
2. Click **"+ Add Restaurant"**
3. Fill in restaurant details:
   - Name
   - Cuisine tags
   - Vibe tags
   - Price range
   - Walking distance
   - Halal/veg options
4. Click **"Add Restaurant"**

Add at least 3 restaurants for the best experience.

---

## 6️⃣ Make Your First Decision

### Option A: Cincailah Mode (Random Spinner)
1. Go to the **"Decide"** tab
2. Click **"Cincailah lah!"**
3. Watch the roulette wheel spin
4. Winner is selected!

### Option B: We Fight Mode (Democratic Vote)
1. Go to the **"Decide"** tab
2. Click **"We Fight"**
3. Vote for your preferred restaurants
4. Wait for others to vote (15 minutes)
5. Winner is the restaurant with most votes

---

## 7️⃣ Explore Other Features

### View History
- **"History"** tab shows past decisions
- See what you ate and when

### Group Settings
- **"Settings"** tab shows:
  - Makan Code (copy to share)
  - Group members
  - Group rules

### Switch Groups
- Click **"← cincailah"** logo (top left)
- See all your groups
- Click any group to switch
- Or create/join new groups

---

## 8️⃣ Test Multi-Group Support

1. Click **"← cincailah"** in top nav
2. Click **"+ Create New Group"**
3. Create a second group (e.g., "Weekend Gang")
4. Add different restaurants
5. Switch between groups anytime

---

## 9️⃣ Test Password Reset (Optional)

1. Log out (Settings → Logout)
2. Go to login page
3. Click **"Forgot password?"**
4. Enter your email
5. In development mode, you'll see the reset link on screen
6. Click the link
7. Enter new password
8. Log in with new password

---

## 🔟 Join an Existing Group

To test the join flow:

1. Create a second account (use different email)
2. After login, go to "My Groups"
3. Click **"Join Existing Group"**
4. Enter the Makan Code from your first account's group
5. You're now a member!

---

## 📱 Mobile Testing

The app is fully responsive. Test on mobile:

1. Open Chrome DevTools (F12)
2. Click the device icon (Ctrl+Shift+M)
3. Select a mobile device
4. Navigate through the app

Or use your actual phone:
1. Find your computer's local IP (e.g., 192.168.1.100)
2. Open http://192.168.1.100:3000 on your phone
3. Test the mobile experience

---

## 🎯 Quick Tips

### Navigation
- **Top Nav Logo** (← cincailah) → My Groups page
- **Bottom Nav** → Main app features (Decide, Restaurants, History, Settings)
- **Settings** → Switch Group button

### Session Persistence
- Your last active group is remembered
- Refresh the page → You stay in the same group
- Close browser → Session persists (cookie-based)

### Makan Code
- Always 6 characters
- Uppercase letters and numbers only
- No confusing characters (0, O, 1, I, l)

### Decision Logic
- **Anti-repeat**: Won't repeat restaurants for 7 days
- **Smart random**: Considers recent history
- **Voting**: 15-minute window, highest votes win

---

## 🐛 Troubleshooting

### "Session error" when accessing group
**Fix**: Make sure you're logged in. Go to /login

### Can't see reset password link
**Fix**: Check the terminal/console where dev server is running. The link is logged there.

### Prisma generation error
**Fix**: Stop dev server, run `npx prisma generate`, restart dev server

### "Group not found"
**Fix**: Make sure the Makan Code is correct (case-sensitive)

---

## 📁 Important URLs

- **Landing Page**: http://localhost:3000
- **Register**: http://localhost:3000/register
- **Login**: http://localhost:3000/login
- **My Groups**: http://localhost:3000/groups
- **Create Group**: http://localhost:3000/groups/create
- **Join Group**: http://localhost:3000/groups/join

---

## ✅ Testing Checklist

Use this to verify everything works:

- [ ] View landing page
- [ ] Register new account
- [ ] Auto-login after registration
- [ ] See "My Groups" page
- [ ] Create first group
- [ ] See Makan Code
- [ ] Add 3+ restaurants
- [ ] Run Cincailah decision (spinner)
- [ ] View result in history
- [ ] Start We Fight vote
- [ ] Cast vote
- [ ] Create second group
- [ ] Switch between groups
- [ ] Click "← cincailah" logo to go to My Groups
- [ ] Log out
- [ ] Log back in
- [ ] See last active group
- [ ] Test forgot password flow
- [ ] Join group with Makan Code (use second account)

---

## 🚀 Ready for Production?

Once everything works locally:

1. Read `V2_MIGRATION_GUIDE.md` for deployment steps
2. Set up production environment variables
3. Configure email service (SendGrid/AWS SES)
4. Deploy to your VPS
5. Test in production
6. Share with your team!

---

## 🎉 You're All Set!

Cincailah V2 is ready to solve your "makan apa?" problem.

Enjoy your new lunch decision app! 🍛🚀

---

*Need help? Check these docs:*
- `V2_BUILD_SUMMARY.md` - Complete feature list
- `V2_MIGRATION_GUIDE.md` - Deployment guide
- `V2_PLAN.md` - Technical details
