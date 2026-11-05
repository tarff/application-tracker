# Application Tracker

A private list of job applications for iPhone, Android and the web, built from one TypeScript
codebase with Expo, NativeWind and Supabase. Each person sees only their own applications, and
the database enforces that.

Live web version: https://application-tracker-coral-six.vercel.app/

## Setup

You need Node.js, an Expo account, and a Supabase project in the Sydney region with the Email
provider on and Confirm email off.

```bash
git clone https://github.com/tarff/application-tracker.git
cd application-tracker
git config core.hooksPath .githooks   # blocks commits containing secrets
sfw npm ci
cp .env.example .env
```

Fill in `.env` with your project URL and publishable key from the Supabase dashboard. Never use
the service role key, and never commit `.env`.

To set up a new database, link the project and apply the migrations:

```bash
npx supabase login                    # run in a normal terminal
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

## Running on a phone

1. Install Expo Go from the App Store or Google Play.
2. Run `npx expo login --no-browser`. Expo Go on a physical iPhone only opens a project when the
   computer and Expo Go are signed in to the same Expo account.
3. Run `npm start` and scan the QR code. Use `npx expo start --clear` after changing
   `tailwind.config.js`.

## Running on the web

```bash
npm run web
```

## Checks

```bash
npm run typecheck
npm run lint
npm test             # form and list rules, no database needed
npm run test:rls     # security and database rules, against the live project
```

`npm run test:rls` signs up throwaway `rls-test-*@example.com` users, so **new sign-ups must be
turned on while it runs**. With sign-ups off, all of its tests fail at setup. Delete the throwaway
users in the Supabase dashboard afterwards.

## Deployment

The web version is a static site on Vercel. `vercel.json` sets the build command and output folder,
and sends every page request to the app so that refreshing any page works.

1. Import the GitHub repository into Vercel.
2. Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` under Environment
   Variables. Do not add the service role key or the database password.
3. Deploy. Later pushes to `main` deploy automatically. The two values are built into the web files,
   so changing them needs a new deployment.

## Acceptance test results

Run on 2026-11-06.

How each result was checked:

- **Automated:** `npm test` (29 tests) or `npm run test:rls` (28 tests)
- **Browser:** driven in Chrome against the local or live web version
- **Owner:** tested by the owner on their own device

`npm run test:rls` last passed 28 of 28 at commit `90c946b`. The only later commits change the
screens, the date field and this README, not the database or the list query.

### Sign-in and access

| Test | Result | How |
|---|---|---|
| A new user can sign up, sign out and sign back in on the web and on a phone | **To confirm** | Sign-up works through the API (Automated) and the owner used a second account on a phone (Owner). Sign-up in the web form was not specifically confirmed |
| A signed-out user who opens the list's web address directly is sent to sign in | Pass | Browser, live site |
| Closing and reopening the app keeps the user signed in | Pass | Owner, phone and live web |

### Applications

| Test | Result | How |
|---|---|---|
| Add, edit and delete all work and persist after a restart | Pass | Owner, Browser |
| An application added on the phone appears on the web after a refresh, and the reverse | **To confirm** | Phone to web passed (Owner). Web to phone was not specifically confirmed |
| The date defaults to the user's local date, including early morning in Melbourne | Pass | Automated |
| Sorting, the status filter and the count are correct, including applications with no date | Pass | Automated, Browser |
| Empty company or role is rejected by the form and by a direct database insert | Pass | Automated, Browser |
| Double tapping Save creates one record | Pass | Browser, three rapid clicks created one record. Not repeated on a phone |
| With the network off, saving shows an error and keeps the typed text | Pass | Browser. Not repeated on a phone |

### Security

| Test | Result | How |
|---|---|---|
| User B cannot see, edit or delete User A's applications, through the app and direct API calls | **To confirm** | Direct API calls passed (Automated). A second account saw none of the first account's data (Owner). Opening User A's edit address while signed in as User B was not run |
| A direct API call with no sign-in returns no applications | Pass | Automated |
| A `javascript:` job link is rejected by the form and by the database | Pass | Automated |
| A search of the repository and the built web files finds no service role key | Pass | Searched the git history and the live site's files. The only matches are the secret check's own pattern, a comment in `supabase/config.toml` and Supabase's code that checks a key's prefix |

### Delivery

| Test | Result | How |
|---|---|---|
| The app opens on a real phone through Expo Go | Pass | Owner, iPhone. Android was not tested |
| The Vercel address works, including refreshing a page other than home | Pass | Browser, Owner |
| Layout has been checked on a phone and a desktop browser against the Figma design | Pass | Owner, Browser |
| `tsc` and lint pass with no errors | Pass | `npm run typecheck`, `npm run lint` |

## Known limitations

- Email confirmation is off to keep this build simple, so an email address is not proven to belong
  to the person signing up. A production version would turn it on and add password reset.
- The web address is public. New sign-ups are turned off in Supabase.
- The app has not been submitted to either app store.
- A request that hangs has no time limit, so a form stays locked until the connection gives up.
- On the web, a partly typed date saves as no date, without a warning.
- Android has not been run on a real device.
- Six packages sit one release behind what Expo expects, so `expo-doctor` reports one failed check.
  The machine's 7-day package age rule blocks the newer versions until 2026-11-10. Then run
  `sfw npx expo install --fix` and re-run the checks.
- `npm audit` reports 17 warnings: 2 high (`@expo/cli` and `zod`), 14 moderate and 1 low. Its
  suggested fix would downgrade Expo to an SDK that Expo Go cannot open, so do not run
  `npm audit fix --force`.
- The app icons and splash image are still Expo's template images.

## Design credit

Design: [Task management & to-do list app](https://www.figma.com/community/file/1143575071825582037/task-management-to-do-list-app)
by Neser U., used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Changes from the original: adapted from tasks to job applications, with new sign-in screens and
status colours. The welcome screen, calendar strip, progress cards, bottom navigation, notification
bell, logo field and category icons were left out.
