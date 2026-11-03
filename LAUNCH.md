# Launching Mehman

The app runs on Supabase: real accounts, real hosts, real bookings. There is
no sample data any more. These steps need your logins, so they're done by
hand.

## 1. Supabase project — done

The project is **mehman** (`rlopcnjufynbqdutzstt`, South Asia (Mumbai)). All
three files in `supabase/migrations` are applied, and the URL and publishable
key are in `.env.local` and Netlify. After changing the schema or
`supabase/config.toml`, push again:

```bash
npx supabase db push        # new files in supabase/migrations
npx supabase config push    # login-code email, sender, redirect URLs
```

`config push` needs `SMTP_PASS` from `.env.local` loaded in the shell (see
step 3). `NEXT_PUBLIC_AUTH_MODE` is no longer used. Delete it if it's set.

## 2. Turn on Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   create an **OAuth client ID** (Web application). Under **Authorised
   redirect URIs**, add
   `https://<new-project-ref>.supabase.co/auth/v1/callback`.
2. In Supabase, go to **Authentication → Sign In / Providers → Google** and
   paste the client ID and secret.
3. Set the OAuth consent screen's app name to Mehman and add your logo.

## 3. Email codes

For now, login codes are sent from your Gmail (`varunbhaskar31@gmail.com`,
shown as "Mehman"), up to about 500 a day:

1. At [myaccount.google.com](https://myaccount.google.com) → **Security**,
   turn on 2-Step Verification, then create an **App password** named Mehman.
2. Add it to `.env.local` as `SMTP_PASS=...` and run `npx supabase config push`.

Before inviting people widely, move to Resend on Mehman's own domain: verify
the domain in Resend, then change the `[auth.email.smtp]` block in
`supabase/config.toml` (host `smtp.resend.com`, port 465, user `resend`, the
Resend API key as `SMTP_PASS`, `admin_email` an address on the domain) and
push again.

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
