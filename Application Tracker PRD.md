# Application Tracker: Product Requirements

**Owner:** Tim Elbery
**Status:** Ready to build
**Design:** [Task management & to-do list app by Neser U.](https://www.figma.com/community/file/1143575071825582037/task-management-to-do-list-app), CC BY 4.0. Use its visual style and its list and form screens. Leave out its welcome screen, calendar strip, progress cards and bottom navigation, which this app does not need.

## 1. Summary

A job seeker sends many applications and needs one place to see where each one stands. Application Tracker is a private list of applications that works on iPhone, Android and the web from one TypeScript codebase. Each user signs in and sees only their own data.

## 2. Goals

- Record an application in a few taps, on a phone or a computer.
- Show at a glance which applications are active and what state each one is in.
- Keep each user's data private, enforced in the database and not only in the app.
- Run on a real phone through Expo Go and on a public web address through Vercel.

## 3. Out of scope

- App Store and Google Play submission, TestFlight and EAS builds
- Password reset, social sign-in and email notifications
- Sharing, teams and admin screens
- Search, reminders, file uploads and data import or export
- Analytics, error tracking and payments
- Offline use
- Dark mode

## 4. User

One signed-in job seeker managing their own applications. There are no other roles.

## 5. Tech stack

| Area | Choice |
|---|---|
| Language | TypeScript, strict mode |
| App (web, iOS, Android) | Expo with Expo Router |
| Styling | NativeWind |
| Sign-in and database | Supabase, Sydney region |
| Web hosting | Vercel, as a static site |
| Source control | GitHub |
| Build tool | Claude Code |

Use the Expo SDK version supported by the current Expo Go app in the phone's app store. Otherwise the project will not open on the phone.

## 6. Data model

Table `applications`:

| Field | Type | Rules |
|---|---|---|
| `id` | uuid | Primary key, generated |
| `user_id` | uuid | Required, references `auth.users`, defaults to `auth.uid()` |
| `company` | text | Required, cannot be blank |
| `role` | text | Required, cannot be blank |
| `job_url` | text | Optional, must start with `http://` or `https://` |
| `date_applied` | date | Optional, form defaults to the user's local date |
| `status` | text | Required, one of the values below, defaults to `applied` |
| `notes` | text | Optional |
| `created_at` | timestamptz | Set by the database |
| `updated_at` | timestamptz | Updated by the database on every change |

Status values, displayed in this order:

| Value | Label |
|---|---|
| `applied` | Applied |
| `interview` | Interview |
| `offer` | Offer |
| `rejected` | Rejected |
| `withdrawn` | Withdrawn |

Enforce the required fields, the blank checks and the status values in the database as well as the form. All schema changes, including security policies, are SQL migration files in `supabase/migrations`.

## 7. Screens

Follow the Figma design for layout and styling. Where the design and this document disagree on behaviour, this document wins. Where the design has no screen for a state below, match the design's existing style.

### Sign in and sign up

- Email and password, with a link between the two forms.
- Show clear messages for a wrong password, an email already in use and a weak password.
- Signed-in users skip these screens. Signed-out users cannot reach any other screen, including by typing a web address.
- The session survives closing and reopening the app or refreshing the browser.

### Applications list (home)

- Each row shows company, role, status and date applied.
- Sort by date applied, newest first. Applications with no date come last.
- Filter by status, with an "All" option. Show the count for the current filter.
- Tapping a row opens it for editing.
- Include an Add button and a Sign out action.
- Show distinct states for loading, an empty list, a filter with no matches, and a failed load with a Retry button.

### Add and edit application

- Use one form for both, with the fields in section 6.
- Company and role show an inline error when empty. An invalid job link shows an inline error.
- The Save button is disabled while saving, so a double tap cannot create two records.
- If a save fails, keep what the user typed and show the error.
- When editing, include a link to open the job ad, and a Delete action that asks for confirmation first.
- Leaving a form with unsaved changes asks for confirmation.

## 8. Layout

- Works from a small phone through to a desktop browser. On wide screens, content stays in a centred column and does not stretch across the window.
- The form stays usable with the on-screen keyboard open.
- Web pages can be refreshed or opened directly without a 404.
- Buttons and inputs have accessible labels.

## 9. Security

- Row Level Security is on for `applications`, with separate select, insert, update and delete policies that limit each user to rows where `user_id = auth.uid()`.
- An update cannot move a row to a different `user_id`.
- The app uses only the Supabase publishable key. The service role key never appears in app code, the repository or Vercel.
- Keys are environment variables named `EXPO_PUBLIC_*`, with `.env` ignored by git and an `.env.example` committed without values.
- Job links with any other scheme, such as `javascript:`, are rejected in the form and in the database.
- Notes and other user text are displayed as plain text, never as HTML.

## 10. Project setup deliverables

- `CLAUDE.md` covering the stack, commands, folder layout, the rule that schema changes go through migrations, and the security rules above
- `README.md` covering setup, running on a phone and the web, deployment, and a credit for the design with a link to the file and its CC BY 4.0 licence
- Generated TypeScript types for the database, kept in the repository
- A web deployment on Vercel with Supabase keys set as environment variables

### Supabase setup

Done by the account owner in the dashboard:

1. Create a project in the Sydney region and store the database password somewhere safe.
2. Under Authentication, keep the Email provider on and turn off Confirm email.
3. Copy the project URL and publishable key into `.env` as `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Done in the build:

4. Use the Supabase CLI to link the project, apply `supabase/migrations` and generate the TypeScript types. The account owner completes any CLI login.
5. Confirm in the dashboard that Row Level Security shows as on for `applications`.

### Vercel setup

1. In `app.json`, set the web output to `single`, so the app is exported as one page and needs no server.
2. Add a `vercel.json` that sends all page requests to `/index.html`, so refreshing a page does not return a 404.
3. Import the GitHub repository into Vercel, with the build command `npx expo export -p web` and the output directory `dist`.
4. Add the two `EXPO_PUBLIC_*` variables in Vercel's environment settings, then deploy. They are built into the web files, so changing them needs a new deployment.

## 11. Acceptance tests

Sign-in and access:

- [ ] A new user can sign up, sign out and sign back in on the web and on a phone.
- [ ] A signed-out user who opens the list's web address directly is sent to sign in.
- [ ] Closing and reopening the app keeps the user signed in.

Applications:

- [ ] Add, edit and delete all work and persist after a restart.
- [ ] An application added on the phone appears on the web after a refresh, and the reverse.
- [ ] The date defaults to the user's local date, including early in the morning in Melbourne, when the UTC date is still the previous day.
- [ ] Sorting, the status filter and the count are correct, including applications with no date.
- [ ] Empty company or role is rejected by the form and by a direct database insert.
- [ ] Double tapping Save creates one record.
- [ ] With the network off, saving shows an error and keeps the typed text.

Security:

- [ ] User B cannot see, edit or delete User A's applications, tested through the app and through direct API calls using User B's sign-in.
- [ ] A direct API call with no sign-in returns no applications.
- [ ] A `javascript:` job link is rejected by the form and by the database.
- [ ] A search of the repository and the built web files finds no service role key.

Delivery:

- [ ] The app opens on a real phone through Expo Go.
- [ ] The Vercel address works, including refreshing a page other than home.
- [ ] Layout has been checked on a phone and a desktop browser against the Figma design.
- [ ] `tsc` and lint pass with no errors.

## 12. Known limitations

- Email confirmation is turned off in Supabase to keep this build simple, so an email address is not proven to belong to the person signing up. A production version would turn it on and add password reset.
- The web address is public. Turn off new sign-ups in Supabase once testing is finished.
- The app has not been submitted to either app store.

## 13. Build order

1. Create the project, `CLAUDE.md`, GitHub repository and environment setup.
2. Write the database migration and security policies, then test the policies.
3. Build sign-in and protected navigation.
4. Build the list screen, then the add and edit form.
5. Match the Figma design and handle the loading, empty and error states.
6. Test on a phone and deploy the web version.
7. Run every acceptance test and record the results in `README.md`.
