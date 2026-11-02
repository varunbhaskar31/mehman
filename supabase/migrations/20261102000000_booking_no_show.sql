-- A host can mark a guest who never turned up. Kept in its own migration:
-- Postgres won't use a new enum value in the transaction that adds it.
alter type public.booking_status add value if not exists 'no_show';
