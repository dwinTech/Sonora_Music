# Sonora music library

Sonora is a Quasar single-page music library with Supabase email/password and Google authentication. The browser connects directly to Supabase using its public anon/publishable key. Signed-in users' track metadata, playlists, and folders are loaded from and synchronized to Supabase Postgres. Browser local storage is retained as a per-user cache and as the one-time source for importing the existing demo library into an empty Supabase project.

Sonora stores playlist and track metadata in Supabase Postgres. Uploaded audio files are stored in the private `music` Storage bucket and resolved from their object paths into short-lived signed URLs. Seeded demo tracks keep a public preview URL by default, and you can replace it with any authorized audio file or direct audio URL you prefer.

## Set up Supabase

1. Create a project at [supabase.com](https://supabase.com/) and wait for the database to finish provisioning.
2. In the Supabase dashboard, open **SQL Editor**, create a query, paste all of [`lib/supabase/schema.sql`](./lib/supabase/schema.sql), and run it.
3. In a second SQL Editor query, run [`lib/supabase/migrations/20261106_music_storage_and_lyrics.sql`](./lib/supabase/migrations/20261106_music_storage_and_lyrics.sql). It adds lyrics columns, creates the private `music` bucket if needed, and configures per-user Storage policies. It preserves songs and existing Storage paths; only demo-seeded placeholder URLs with no object path are cleared.
4. Open **Project Settings → API** (or **Connect**) and copy the **Project URL** and the **publishable/anon public key**. Do not use a secret or service-role key in browser code.
5. Copy `.env.example` to `.env` and replace the example values:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_publishable_or_anon_key
   ```

   These values are public project configuration. Keep database access protected by the Row Level Security policies installed by the schema.

6. In **Authentication → URL Configuration**, set the Site URL to `http://localhost:3000` and add it to the allowed Redirect URLs.
7. Under **Authentication → Providers → Email**, enable Email. If **Confirm email** is enabled, users must open the confirmation link sent after signup before signing in. If they try to sign in early, Sonora explains the issue and offers to resend the link. To allow immediate sign-in without email verification, turn **Confirm email** off in Supabase; this is a project-wide security setting.
8. Supabase's default email service is for testing: it is limited to about two messages per hour and only sends to authorized project team addresses. If signup shows an email sending error, stop retrying and check **Authentication → Users** to see whether the account was created. For signup emails to other addresses and reliable delivery, configure a custom SMTP provider under **Authentication → SMTP Settings**. See [Supabase's custom SMTP guide](https://supabase.com/docs/guides/auth/auth-smtp).
9. Restart the Quasar development server after changing `.env`.

From the sign-in page, choose **Forgot password?** and submit your email. Open the reset link from the email to reach Sonora's separate `/#/auth/reset-password` page, where you can set a new password. Make sure your app origin is included in Supabase's allowed Redirect URLs.

If signup reports **Error sending confirmation email** while custom SMTP is enabled, check **Authentication → Emails → SMTP Settings** and **Authentication → Logs** in Supabase. Confirm the SMTP host, port, username, password, and sender address with your mail provider. For Gmail SMTP, use `smtp.gmail.com`, port `465`, your full Gmail address as the username, and a Google App Password (not your regular Gmail password). Check **Authentication → Users** before retrying signup because Supabase may have created the account even though email delivery failed.

The application runs entirely in the browser. It uses Supabase's browser client and relies on database Row Level Security to isolate each signed-in user's rows.

### Optional: Google sign-in

1. Create a Google OAuth web client in Google Cloud Console.
2. In the Supabase dashboard, enable the Google provider and enter the OAuth client ID and secret.
3. Add the Supabase callback URL displayed in the Google provider settings to the OAuth client's authorized redirect URIs.
4. Make sure the app's local and production URLs are allowed in Supabase **Authentication → URL Configuration**.

If Google sign-in returns `Unsupported provider: provider is not enabled`, Google is not enabled in the Supabase project set by `VITE_SUPABASE_URL`. Enable the Google provider there and configure its OAuth client ID and secret.

### Start the app

```powershell
Copy-Item .env.example .env
# Set your Supabase URL and public anon/publishable key in .env before starting.
npm install
npm run dev
```

Sign up or sign in. If the tables are empty, Sonora imports the signed-in user's existing local demo catalog and playlists into Supabase. Otherwise, Supabase is authoritative and replaces that user's local cache with the cloud library. Track, playlist, folder, and favorite edits sync automatically. Upload audio (up to 50 MB) from a playlist or library; new uploads go to the private `music` bucket. Database/network errors are shown in the app.

## Library features

Create folders from the sidebar, choose a folder when adding a track, or move existing tracks into folders from each track's actions menu. Playlists remain separate from folders. Removing a track is persisted to the signed-in user's cloud library.

## Test actual audio playback

1. Apply the `music_storage_and_lyrics` migration above and restart the app.
2. Sign in, open **Upload music**, and choose a local audio file you own or are licensed to use. The upload should create an object under `music/<your-user-id>/` and save its object key in the track's `audio_path`.
3. Confirm the file is visible in **Supabase → Storage → music**. On library load, Sonora checks saved Storage paths and reports missing, legacy-bucket, and unverifiable objects.
4. To attach several files to the existing catalog at once, open **Your Library → Songs → Attach audio**. Choose your authorized audio files, confirm or change each filename-to-song match, and select **Upload and attach**. Filenames beginning with the song title or artist/title are matched automatically; unmatched files can be assigned from the song list. Each file must be 50 MB or smaller. This updates the existing tracks rather than creating duplicate songs.
5. Play an attached track and verify audible output, then exercise pause/resume, next/previous, seek, volume/mute, shuffle, repeat, and queue. The elapsed time and duration should follow the browser's audio element, not catalog metadata.
6. Add only lyrics you own or are licensed to store. Plain text appears in Lyrics; LRC lines such as `[00:12.50] lyric text` highlight against the current audio time.

To audit all of a user's recorded paths in the Supabase SQL Editor, replace the UUID and run:

```sql
select t.title,
       t.audio_path,
       case
         when coalesce(t.audio_path, '') = '' then 'no storage path'
         when exists (
           select 1 from storage.objects o
           where o.bucket_id = 'music' and o.name = t.audio_path
         ) then 'music: present'
         when exists (
           select 1 from storage.objects o
           where o.bucket_id = 'tracks'
             and o.name = t.audio_path
             and t.audio_url like '%/object/%/tracks/%'
         ) then 'legacy tracks: present'
         else 'missing from music and legacy tracks'
       end as storage_status
from public.tracks t
where t.user_id = 'YOUR_USER_UUID'::uuid
order by t.title;
```

## Structure

Application code is grouped by feature under `src/components/`, with shared
application services under `src/services/`. Supabase client and database setup
files are kept together in `lib/supabase/`.

```text
src/
  App.vue
  components/
    auth/
      AuthGate.vue
      AuthPanel.vue
      ResetPasswordForm.vue
    library/
      SideNavigation.vue
      SonoraLibrary.vue
  css/
    app.css
  pages/
    [...path].vue
    index.vue
    index/
      (index).vue
    auth/
      reset-password.vue
    library.vue
    login.vue
    signup.vue
  router/
    index.ts
    typed-router.d.ts
  services/
    sonora-library.ts
  stores/
    index.ts
lib/
  supabase/
    client.ts
    database.types.ts
    library.ts
    schema.sql
```

## Run locally

```powershell
# After completing Supabase setup above:
npm run dev
```

`npm run dev` and `npm run build` run the Quasar single-page application. No separate Node SSR server setup is required.

## Checks and production build

```powershell
npm run typecheck
npm run build
```
