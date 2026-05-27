# Cincailah iOS TestFlight & App Store Submission Guide

Beginner-friendly checklist for uploading **Cincailah** to **Apple TestFlight** and later submitting it to the **App Store**.

Project folder:

```bash
/Users/123ang/Desktop/Websites/cincailah/mobile
```

Current iOS Bundle ID from `mobile/app.json`:

```text
com.suntzutechnologies.cincailah
```

Current production API URL from `mobile/app.json`:

```text
https://cincailah.suntzutechnologies.com
```

---

## 1. What You Need Before Starting

You already registered Apple Developer Program, so make sure you also have:

- Apple Developer account login email and password
- Access to <https://appstoreconnect.apple.com>
- Access to <https://developer.apple.com/account>
- Mac with Xcode installed
- Node.js installed
- Expo / EAS account access
- App icon ready in `mobile/assets/icon.png`
- Splash image ready in `mobile/assets/splash.png`
- iPhone screenshots ready, or take screenshots after TestFlight build

Recommended browser: Safari or Chrome.

---

## 2. Beginner Flow Summary

You will do this in order:

1. Check app config.
2. Login to EAS.
3. Build iOS app using EAS.
4. Create app record in App Store Connect.
5. Upload build to TestFlight.
6. Add TestFlight testing info.
7. Invite testers.
8. Fill App Store listing metadata.
9. Fill privacy questions.
10. Submit for App Review.

---

## 3. Check Current App Config

Open:

```bash
/Users/123ang/Desktop/Websites/cincailah/mobile/app.json
```

Important values:

```json
{
  "expo": {
    "name": "Cincailah",
    "slug": "cincailah",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.suntzutechnologies.cincailah",
      "supportsTablet": false
    }
  }
}
```

Do not change the bundle identifier after creating the App Store Connect app unless you know what you are doing.

---

## 4. Install Dependencies

Open Terminal:

```bash
cd /Users/123ang/Desktop/Websites/cincailah/mobile
npm install
```

Optional health check:

```bash
npx expo-doctor
```

If Expo suggests fixing dependencies, run:

```bash
npx expo install --check
```

---

## 5. Login to EAS

```bash
cd /Users/123ang/Desktop/Websites/cincailah/mobile
npx eas login
```

Check login:

```bash
npx eas whoami
```

---

## 6. Build for TestFlight / App Store

Run:

```bash
cd /Users/123ang/Desktop/Websites/cincailah/mobile
npx eas build --platform ios --profile production
```

When EAS asks about Apple credentials:

- Let EAS manage certificates and provisioning profiles if you are a beginner.
- Login with Apple Developer account when prompted.
- Choose the correct Apple Developer Team.
- If it asks to generate a distribution certificate, say yes.
- If it asks to create/register bundle identifier, say yes if not already created.

After build finishes, EAS will show a build URL.

Download is not required if you use EAS Submit, but keep the URL.

---

## 7. Create App in App Store Connect

Go to:

<https://appstoreconnect.apple.com>

Steps:

1. Click **My Apps**.
2. Click **+**.
3. Click **New App**.
4. Fill in:

```text
Platform: iOS
Name: Cincailah
Primary Language: English (U.S.)
Bundle ID: com.suntzutechnologies.cincailah
SKU: cincailah-ios-001
User Access: Full Access
```

5. Click **Create**.

If `com.suntzutechnologies.cincailah` is not shown, create/register it in Apple Developer or let EAS register it during build.

---

## 8. Get App Store Connect App ID

In App Store Connect:

1. Open **Cincailah**.
2. Go to **App Information**.
3. Look at the URL in your browser.
4. The numeric ID is the App Store Connect App ID.

Example URL:

```text
https://appstoreconnect.apple.com/apps/1234567890/appstore/ios/version/deliverable
```

For this project, EAS created/found:

```text
ASC App ID = 6773548061
```

Keep `mobile/eas.json` set like this for automatic submit:

```json
"ios": {
  "appleId": "admin@suntzutechnologies.com",
  "ascAppId": "6773548061",
  "appleTeamId": "X33G4A6WK8"
}
```

---

## 9. Submit Build to TestFlight

After EAS iOS build succeeds, submit it:

```bash
cd /Users/123ang/Desktop/Websites/cincailah/mobile
npx eas submit --platform ios --latest --profile production
```

If EAS asks for Apple login, follow the prompts.

If it asks for App Store Connect App ID, paste the numeric ID from Step 8. With the checked-in config above, EAS should already know it.

After upload, wait for Apple processing. This can take 5–30 minutes or longer.

---

## 10. TestFlight Setup

Go to:

<https://appstoreconnect.apple.com>

Open **Cincailah** → **TestFlight**.

### 10.1 Internal Testing

Use this first.

1. Go to **TestFlight**.
2. Click **Internal Testing**.
3. Create group: `Internal Testers`.
4. Add yourself and team members.
5. Select latest build.
6. Save.

Internal testers can test quickly without Beta App Review.

### 10.2 External Testing

Use this when you want other people to test.

1. Go to **TestFlight**.
2. Click **External Testing**.
3. Create group: `Beta Testers`.
4. Add tester emails.
5. Select latest build.
6. Fill Beta App Review information below.
7. Submit for Beta App Review.

---

## 11. TestFlight Beta Information — Copy/Paste

### Beta App Description

```text
Cincailah helps users decide where to eat quickly, either alone or with a group. Users can add restaurants, choose by cuisine and vibe, spin for a random pick, vote with friends, save favourites, and view decision history.

This beta is for testing the iOS mobile experience, account flow, group creation/joining, restaurant management, decision modes, reminders, and profile settings.
```

### What to Test

```text
Please test:

1. Sign up, login, email verification, and password reset.
2. Guest / solo mode.
3. Create a group and join a group using a Makan Code or QR code.
4. Add and edit restaurants.
5. Use You Pick mode to randomly choose a restaurant.
6. Use We Fight mode to vote as a group.
7. Add favourites and check history.
8. Set lunch reminders.
9. Edit profile and avatar.
10. Check that the app feels smooth and clear on different iPhone screen sizes.

Please report crashes, confusing text, layout issues, or any restaurant/group data that does not save correctly.
```

### Feedback Email

```text
support@cincailah.com
```

### Marketing URL

```text
https://cincailah.suntzutechnologies.com/about
```

### Privacy Policy URL

```text
https://cincailah.suntzutechnologies.com/privacy
```

---

## 12. App Store Listing Metadata — Copy/Paste

### App Name

```text
Cincailah
```

### Subtitle

Apple limit: 30 characters.

```text
Decide where to eat, fast
```

### Category

Recommended:

```text
Primary Category: Food & Drink
Secondary Category: Lifestyle
```

If Apple does not allow your preferred secondary category, use only Food & Drink.

### Content Rights

```text
No, this app does not contain, show, or access third-party content that requires special rights.
```

### Age Rating

Recommended answers:

```text
Cartoon or Fantasy Violence: None
Realistic Violence: None
Sexual Content or Nudity: None
Profanity or Crude Humor: None
Alcohol, Tobacco, or Drug Use: None
Mature/Suggestive Themes: None
Medical/Treatment Information: None
Gambling: None
Unrestricted Web Access: No
Kids Category: No
```

Expected rating:

```text
4+
```

---

## 13. Promotional Text — Copy/Paste

Apple limit: 170 characters.

```text
Stop asking “makan mana?” Cincailah helps you pick a restaurant fast with solo picks, group voting, favourites, reminders, and decision history.
```

---

## 14. App Description — Copy/Paste

```text
Cincailah is the food decision app for anyone tired of asking, “Makan mana?”

Whether you are eating alone, planning lunch with colleagues, or deciding dinner with friends, Cincailah helps you pick faster and fairer.

What you can do:

• Decide where to eat in seconds
• Use Solo Mode when you are choosing for yourself
• Create or join a makan group with friends or colleagues
• Add restaurants with cuisine, vibe, budget, halal, and vegetarian-friendly details
• Use You Pick mode when you want the app to choose for you
• Use We Fight mode when everyone wants to vote
• Save favourite restaurants
• View past decisions and avoid repeating the same place too often
• Set lunch reminders
• Edit your profile and preferences

Cincailah is built for Malaysian food culture: mamak, kopitiam, hawker food, cafes, nasi kandar, chicken rice, economy rice, and all the daily “anything lah” moments.

No more long group chats. No more endless “up to you”. Just open Cincailah and decide.
```

---

## 15. Keywords — Copy/Paste

Apple limit: 100 characters total. Do not include spaces after commas if possible.

```text
food,lunch,dinner,restaurant,makan,Malaysia,vote,random,picker,group,meal
```

---

## 16. Support URL

```text
https://cincailah.suntzutechnologies.com/about
```

If Apple requires direct support contact, use:

```text
mailto:support@cincailah.com
```

But normally App Store Connect wants a website URL, not an email.

---

## 17. Privacy Policy URL

```text
https://cincailah.suntzutechnologies.com/privacy
```

---

## 18. Copyright

Use your company/legal owner name.

If submitting under your personal developer account:

```text
© 2026 Jin Sheng Ang
```

If submitting under company:

```text
© 2026 Suntzu Technologies
```

Choose whichever matches the Apple Developer account legal owner.

---

## 19. Version Information

### Version Number

Current:

```text
1.0.0
```

### Build Number

EAS production profile has `autoIncrement: true`, so EAS should manage build numbers.

### What’s New — Copy/Paste

```text
Initial iOS release of Cincailah, including solo restaurant decisions, group makan codes, restaurant management, You Pick mode, We Fight voting, favourites, reminders, history, and profile preferences.
```

---

## 20. App Review Information — Copy/Paste

### Contact First Name

```text
Jin Sheng
```

### Contact Last Name

```text
Ang
```

### Phone Number

Use your real phone number in international format, for example:

```text
+60XXXXXXXXX
```

### Email

Use the email you actively check:

```text
support@cincailah.com
```

Or your Apple Developer email.

### Demo Account

Apple reviewers must be able to test login-required features.

Before submission, create a demo account in production.

Recommended demo account:

```text
Email: reviewer@cincailah.com
Password: CincailahReview2026!
```

Important:

- Make sure this account is verified.
- Make sure it can log in on production.
- Create at least one sample group.
- Add 5–10 sample restaurants.
- Add a sample favourite.
- If We Fight needs multiple users, reviewers can still test basic flow with one account, but mention group features can also be tested by creating another account.

### Review Notes — Copy/Paste

```text
Thank you for reviewing Cincailah.

Cincailah helps users decide where to eat alone or with a group. The app includes guest/solo mode, account login, group creation, Makan Code group joining, restaurant management, random restaurant picking, group voting, favourites, reminders, history, and profile settings.

Demo account:
Email: reviewer@cincailah.com
Password: CincailahReview2026!

Suggested review steps:
1. Log in using the demo account.
2. Open an existing group or create a new group.
3. Add or view restaurants.
4. Use You Pick mode to choose a restaurant.
5. Use We Fight mode to start a vote.
6. Open favourites, reminders, history, and profile settings.

The app uses camera permission only for scanning group invite QR codes.
Photo library access is used only if the user chooses a profile avatar.
Notifications are used only for optional lunch reminders.
Face ID / Touch ID is optional and only used for quick sign-in.

The app does not contain paid features, subscriptions, ads, gambling, or user-generated public social feeds.
```

---

## 21. App Privacy Questions — Suggested Answers

Go to App Store Connect → App Privacy.

### 21.1 Does this app collect data?

```text
Yes
```

### 21.2 Is the data used to track users across apps and websites owned by other companies?

```text
No
```

### 21.3 Data Types Collected

Use these as guidance based on current app features.

#### Contact Info

Select:

```text
Email Address
Name
```

Purpose:

```text
App Functionality
Account Management
```

Linked to user?

```text
Yes
```

Used for tracking?

```text
No
```

#### User Content

Select if available:

```text
Photos or Videos
Other User Content
```

Why:

- User may upload profile avatar.
- User creates restaurant/group data.

Purpose:

```text
App Functionality
```

Linked to user?

```text
Yes
```

Used for tracking?

```text
No
```

#### Identifiers

Select:

```text
User ID
Device ID
```

Use `Device ID` only if push notification tokens or device-level identifiers are stored/processed.

Purpose:

```text
App Functionality
Notifications
```

Linked to user?

```text
Yes
```

Used for tracking?

```text
No
```

#### Diagnostics

Select if Sentry/crash reporting is enabled:

```text
Crash Data
Performance Data
```

Purpose:

```text
Analytics
App Functionality
```

Linked to user?

```text
No
```

Used for tracking?

```text
No
```

#### Usage Data

If Apple asks about decision history/app activity, select:

```text
Product Interaction
```

Purpose:

```text
App Functionality
Analytics
```

Linked to user?

```text
Yes
```

Used for tracking?

```text
No
```

### 21.4 Data Not Collected

Do not select unless the app truly collects them:

```text
Precise Location
Coarse Location
Health
Fitness
Payment Info
Contacts
Browsing History
Search History
Sensitive Info
```

Cincailah currently should not need location permission for App Store submission unless you add location-based restaurant discovery later.

---

## 22. Permission Usage Text

Current `app.json` already has Face ID text:

```text
Allow Cincailah to use Face ID for quick sign-in.
```

Recommended additional iOS permission text if Apple or Expo requires it later:

### Camera Permission

Use for QR code group invite scanning:

```text
Cincailah uses the camera to scan group invite QR codes.
```

### Photo Library Permission

Use for avatar upload:

```text
Cincailah uses your photo library only when you choose a profile avatar.
```

### Notifications Permission

Use for reminders:

```text
Cincailah sends optional lunch reminders that you schedule in the app.
```

If needed, add these in `mobile/app.json` under `ios.infoPlist`:

```json
"NSCameraUsageDescription": "Cincailah uses the camera to scan group invite QR codes.",
"NSPhotoLibraryUsageDescription": "Cincailah uses your photo library only when you choose a profile avatar.",
"NSUserNotificationsUsageDescription": "Cincailah sends optional lunch reminders that you schedule in the app."
```

---

## 23. Export Compliance / Encryption

Cincailah uses HTTPS and standard platform security.

When Apple asks about encryption, use this guidance:

```text
The app uses standard encryption provided by the operating system and HTTPS for secure network communication. It does not implement custom/proprietary encryption.
```

Typical answers:

```text
Does your app use encryption? Yes
Does it use standard encryption algorithms instead of proprietary/custom encryption? Yes
Is it exempt from export compliance documentation? Yes
```

If Apple offers an option like “standard encryption only / HTTPS only”, choose that.

---

## 24. Screenshots Needed

Apple requires screenshots for iPhone.

Recommended minimum:

- 6.7-inch iPhone screenshots
- 6.5-inch iPhone screenshots if requested
- 5.5-inch iPhone screenshots if requested

You can take screenshots from:

- iPhone Simulator
- Physical iPhone through TestFlight
- Xcode simulator screenshot

Suggested screenshots:

1. Landing / welcome screen
2. Solo decision screen
3. Group screen
4. Add restaurant screen
5. Roulette / You Pick result screen
6. We Fight voting screen
7. History or favourites screen
8. Profile/reminders screen

### Screenshot Captions — Copy/Paste

Use these as design captions if you add text overlays later:

```text
Decide where to eat in seconds
Spin for a fair makan pick
Vote with your group
Save your favourite spots
Avoid repeating the same restaurant
Built for Malaysia’s daily makan decisions
```

---

## 25. App Icon Checklist

Before final submission, confirm:

- Icon is not transparent.
- Icon does not have rounded corners manually.
- Icon is at least 1024×1024 source quality.
- `mobile/assets/icon.png` looks good on iOS.
- App name under icon looks good: `Cincailah`.

---

## 26. Production Backend Checklist

Before inviting testers or submitting to Apple:

Open in browser:

```text
https://cincailah.suntzutechnologies.com
https://cincailah.suntzutechnologies.com/privacy
https://cincailah.suntzutechnologies.com/terms
https://cincailah.suntzutechnologies.com/about
```

Make sure all pages load with HTTPS.

Check backend API is working:

- Register account
- Login
- Verify email if required
- Create group
- Add restaurant
- Make decision
- Vote
- Upload avatar if enabled

---

## 27. Final Pre-Submission QA Checklist

On TestFlight or production iOS build, test:

- [ ] App opens without crashing.
- [ ] Register works.
- [ ] Login works.
- [ ] Forgot password works.
- [ ] Guest / solo mode works.
- [ ] Create group works.
- [ ] Join group with Makan Code works.
- [ ] QR scan permission text appears correctly.
- [ ] Add restaurant works.
- [ ] Edit restaurant works.
- [ ] You Pick works.
- [ ] We Fight vote works.
- [ ] Favourites works.
- [ ] History works.
- [ ] Reminders permission works.
- [ ] Profile edit works.
- [ ] Avatar upload works.
- [ ] Face ID / Touch ID optional flow works.
- [ ] Logout works.
- [ ] No placeholder API URL is visible.
- [ ] Privacy Policy URL opens.
- [ ] Terms URL opens.

---

## 28. Submit to App Review

After build is processed:

1. App Store Connect → **Cincailah**.
2. Go to **Distribution** / **App Store** tab.
3. Create version `1.0.0` if not already created.
4. Fill all metadata from this guide.
5. Upload screenshots.
6. Select build.
7. Fill App Review Information.
8. Fill App Privacy.
9. Fill Age Rating.
10. Fill Export Compliance.
11. Click **Add for Review**.
12. Submit.

Apple review can take from a few hours to several days.

---

## 29. If Apple Rejects the App

Do not panic. Common beginner rejections:

### Missing demo login

Fix:

- Provide reviewer account.
- Make sure it works.
- Put account in Review Notes.

### Privacy policy missing or broken

Fix:

- Make sure `https://cincailah.suntzutechnologies.com/privacy` works.

### App crashes or backend unavailable

Fix:

- Test production API.
- Submit a new build.

### Permission explanation unclear

Fix:

- Add clearer usage descriptions in `app.json`.

### App not useful enough without account

Fix:

- Explain guest/solo mode in Review Notes.
- Make sure reviewer can test with demo login.

---

## 30. Commands Cheat Sheet

```bash
# Go to mobile app
cd /Users/123ang/Desktop/Websites/cincailah/mobile

# Install dependencies
npm install

# Check Expo project
npx expo-doctor

# Login EAS
npx eas login
npx eas whoami

# Build iOS production app
npx eas build --platform ios --profile production

# Submit latest successful iOS build to App Store Connect
npx eas submit --platform ios --latest --profile production

# Build Android preview APK if needed
npm run build:apk
```

---

## 31. Recommended Demo Data for Reviewer

Create this before submission:

### Group

```text
Group name: Office Lunch Crew
Makan Code: REVIEW1
```

### Restaurants

```text
Nasi Kandar Line Clear — Cuisine: Malay/Indian, Vibe: Local, Budget: RM15
Village Park Nasi Lemak — Cuisine: Malay, Vibe: Local, Budget: RM12
Chicken Rice Shop — Cuisine: Chinese, Vibe: Casual, Budget: RM14
Mamak Corner — Cuisine: Mamak, Vibe: Late night, Budget: RM10
Sushi Zanmai — Cuisine: Japanese, Vibe: Casual, Budget: RM25
```

### Test Scenarios

```text
1. Spin You Pick with all restaurants.
2. Filter by cuisine or vibe.
3. Start We Fight vote with 3 options.
4. Favourite one restaurant.
5. Check history after decision.
```

---

## 32. Final Copy/Paste Block for Apple Review Notes

Use this final block if you want a clean one-shot version:

```text
Thank you for reviewing Cincailah.

Cincailah helps users decide where to eat alone or with a group. The app includes guest/solo mode, account login, group creation, Makan Code group joining, restaurant management, random restaurant picking, group voting, favourites, reminders, history, and profile settings.

Demo account:
Email: reviewer@cincailah.com
Password: CincailahReview2026!

Suggested review steps:
1. Log in using the demo account.
2. Open the sample group “Office Lunch Crew” or create a new group.
3. Add or view restaurants.
4. Use You Pick mode to choose a restaurant.
5. Use We Fight mode to start a vote.
6. Open favourites, reminders, history, and profile settings.

The app uses camera permission only for scanning group invite QR codes.
Photo library access is used only if the user chooses a profile avatar.
Notifications are used only for optional lunch reminders.
Face ID / Touch ID is optional and only used for quick sign-in.

The app does not contain paid features, subscriptions, ads, gambling, or public social feeds.
```

---

## 33. Final Reminder

Before pressing submit:

- Make the demo account.
- Test it on production.
- Upload screenshots.
- Confirm Privacy Policy URL works.
- Confirm build selected in App Store Connect.
- Confirm App Privacy says no tracking.
- Confirm Review Notes include login details.
