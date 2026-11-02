# Launching Mehman

The app runs on Supabase: real accounts, real hosts, real bookings. There is
no sample data any more. These steps need your logins, so they're done by
hand.

## 1. Create the Supabase project

The old project (`rlopcnjufynbqdutzstt`) no longer exists.

1. In [supabase.com/dashboard](https://supabase.com/dashboard), create a
   project named **mehman** in **South Asia (Mumbai)**. Save the database
   password in a password manager.
2. Apply the schema and settings from this folder:

   ```bash
   npx supabase login
   npx supabase link --project-ref <new-project-ref>
   npx supabase db push        # the three files in supabase/migrations
   npx supabase config push    # login-code email, redirect URLs
   ```

3. Under **Project Settings → API Keys**, copy the URL and the publishable
   key into `.env.local`, and into Netlify (**Site configuration →
   Environment variables**):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<new-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   `NEXT_PUBLIC_AUTH_MODE` is no longer used. Delete it if it's set.

## 2. Turn on Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   create an **OAuth client ID** (Web application). Under **Authorised
   redirect URIs**, add
   `https://<new-project-ref>.supabase.co/auth/v1/callback`.
2. In Supabase, go to **Authentication → Sign In / Providers → Google** and
   paste the client ID and secret.
3. Set the OAuth consent screen's app name to Mehman and add your logo.

## 3. Email codes

These work as soon as the project exists, but Supabase's built-in mailer
sends only a few emails an hour. Before inviting people, set up custom SMTP
(for example Resend or Amazon SES) under **Authentication → Emails → SMTP
Settings**. Send from an address on a domain you own.

## 4. Phone codes (optional, later)

India requires DLT registration to send SMS. Once you have an SMS provider
(MSG91, Twilio, etc.) connected under **Authentication → Sign In /
Providers → Phone**, set `NEXT_PUBLIC_PHONE_LOGIN=on` to show the Phone
option on the login screen.

## 5. Make yourself admin

Sign in on the site once, then in Supabase's **SQL Editor** run:

```sql
update public.profiles set role = 'admin' where email = 'varunbhaskar31@gmail.com';
```

The **Mehman team** console at `/admin` then appears. New host applications
and changed tables show up there and in your Updates.

## 6. Host map pins

Hosts give their neighbourhood when they apply. To show a host on the city
map, set a rough centre point for the neighbourhood (not the house) in the
SQL Editor:

```sql
update public.hosts set area_lat = 12.9352, area_lng = 77.6245 where display_name = '...';
```

## Checks

```bash
npm run test:db   # 87 checks of who can see and change what
npm run build
```
