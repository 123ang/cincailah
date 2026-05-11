# Cincailah Mobile QA Checklist

Run this on a real Android device before production promotion.

## Install / launch
- [ ] Install the latest APK.
- [ ] App opens without crash.
- [ ] Login/register screens load.
- [ ] API errors show a friendly message when offline.

## Auth
- [ ] Register a new account.
- [ ] Verify login works after app restart.
- [ ] Logout returns to auth flow.
- [ ] Forgot/reset password flow opens correctly.

## Groups
- [ ] Create a group.
- [ ] Group shows Owner badge.
- [ ] Share/copy Makan Code works.
- [ ] Join group from a second account/device.
- [ ] Joined user shows Member badge.

## Add / edit spots
- [ ] Add spot requires a name.
- [ ] Add spot blocks save with no cuisine tag.
- [ ] Add spot blocks save with no vibe tag.
- [ ] Add spot succeeds with name + cuisine + vibe.
- [ ] Edit spot keeps cuisine/vibe values and enforces the same requirements.

## You Pick
- [ ] Owner can select You Pick.
- [ ] Member cannot select You Pick and sees the owner-only hint.
- [ ] Cuisine filters use OR inside cuisine tags.
- [ ] Vibe filters use OR inside vibe tags.
- [ ] Cuisine + vibe together narrow results using AND across groups.
- [ ] Halal / veg toggles filter correctly.
- [ ] Reroll starts with 3 left.
- [ ] Reroll stops after 3 attempts.
- [ ] “Same spot can win again” allows repeats; off excludes previous winner.

## We Fight
- [ ] Owner can start We Fight.
- [ ] Member can start We Fight.
- [ ] User can pick only one option at a time.
- [ ] Changing vote moves the vote to the new option.
- [ ] Results finalize from the server after expiry.
- [ ] Ties resolve server-side without requiring mobile to choose locally.

## Production smoke
- [ ] `https://cincailah.suntzutechnologies.com/api/health` returns `status: ok`.
- [ ] Mobile APK is pointed at the production API URL.
- [ ] Create → add spot → decide flow works on production.
