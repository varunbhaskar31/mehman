-- The deposit flow's booking states. Kept in its own migration: Postgres
-- won't use a new enum value in the transaction that adds it.
--
--   requested -> awaiting_deposit -> deposit_claimed -> confirmed -> completed
--   early exits: declined, expired, cancelled_unpaid, in_review,
--                host_cancelled, guest_cancelled, no_show
--
-- 'accepted' and 'cancelled' stay in the type for old rows only; the next
-- migration moves those rows to the new states.
alter type public.booking_status add value if not exists 'awaiting_deposit';
alter type public.booking_status add value if not exists 'deposit_claimed';
alter type public.booking_status add value if not exists 'confirmed';
alter type public.booking_status add value if not exists 'expired';
alter type public.booking_status add value if not exists 'cancelled_unpaid';
alter type public.booking_status add value if not exists 'in_review';
alter type public.booking_status add value if not exists 'host_cancelled';
alter type public.booking_status add value if not exists 'guest_cancelled';
