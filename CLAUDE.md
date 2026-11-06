# Application Tracker

A private list of job applications for iPhone, Android and the web, from one TypeScript
codebase. `Application Tracker PRD.md` is the source of truth for scope and behaviour.

## Stack

- TypeScript, strict mode
- Expo SDK 58 with Expo Router. The current Expo Go in the App Store and Google Play runs
  SDK 58 only, so do not change SDK without checking the store listings first.
- NativeWind 4 with Tailwind CSS 3
- Supabase (Sydney region) for sign-in and the database
- Vercel for web hosting, as a static site (`web.output` is `single`)

## Commands

```bash
npm start              # dev server; scan the QR code with Expo Go
npm run web            # run in a browser
npm run typecheck      # tsc --noEmit
npm run lint           # expo lint
sfw npx expo-doctor    # check dependencies and config
npx expo export -p web # build the web version into dist/
```

Run typecheck and lint before calling any task done.

### Installing packages

- Add packages with `sfw npx expo install <package>`, so versions match the SDK.
- Every command that fetches from a package registry goes through `sfw`.
- Only use packages Expo Go already includes. A package with other native code would need a
  development build, and EAS builds are out of scope.
- Expo changes between SDKs. Check https://docs.expo.dev/versions/v58.0.0/ before using an
  Expo or React Native API from memory.

## Folder layout

```
src/app/                 Routes. Every file here is a screen.
src/components/          Shared components
src/lib/                 Supabase client, helpers and generated database types
src/global.css           Tailwind entry point
supabase/migrations/     SQL migrations
```

Keep non-route code out of `src/app/`.

## Database changes

All schema changes, including security policies, are SQL migration files in
`supabase/migrations`. Never change the schema in the Supabase dashboard. Regenerate the
TypeScript types after each migration and commit them.

## Security rules

- Row Level Security is on for `applications`, with separate select, insert, update and delete
  policies that limit each user to rows where `user_id = auth.uid()`.
- An update cannot move a row to a different `user_id`.
- The app uses only the Supabase publishable key. The service role key never appears in app
  code, the repository or Vercel.
- Keys are `EXPO_PUBLIC_*` environment variables. `.env` is ignored by git, and `.env.example`
  is committed without values.
- Job links must start with `http://` or `https://`. Reject any other scheme, such as
  `javascript:`, in the form and in the database.
- Show notes and other user text as plain text, never as HTML.
- Enforce required fields, blank checks and status values in the database as well as the form.
- No secret ever goes on GitHub, including the database password. After cloning, run
  `git config core.hooksPath .githooks` to turn on the check that blocks commits containing
  secrets. Never bypass it with `--no-verify`.

## Review checkpoints

Stop at each of these and wait for me. Commit after each working step.

1. **Before any code:** read the brief and design, propose a plan, and let me cut anything
   that won't fit.
2. **Before a migration runs:** show me the SQL, including the Row Level Security policies.
   I read every line.
3. **After sign-in works:** I test that signed-out users are blocked, then test with a second
   account.
4. **After each screen:** I run it on a phone and compare it to the Figma design, and skim the
   code. Read it closely if something looks wrong.
5. **Before the walkthrough:** run typecheck and lint, then I skim the full diff and a fresh
   Claude session reviews it.

When reviewing, look for:

- A service role key anywhere in the app
- Row Level Security turned off, or a user's data only filtered in app code
- Hardcoded sample data, or buttons that do nothing
- Errors that are caught and ignored
- Raw HTML being displayed, or forms that only validate on the screen
- Packages I didn't ask for, or large files I can't explain

If time runs short, cut features, not security, and tell me what was cut and why.

## Known temporary issue

Six packages sit one release behind what Expo expects, because the machine's 7-day package age
rule blocks versions published on 2026-11-03. From 2026-11-10, run
`sfw npx expo install --fix`, then re-run the checks above. Do not run `npm audit fix --force`:
it would downgrade Expo to an SDK that Expo Go cannot open.
