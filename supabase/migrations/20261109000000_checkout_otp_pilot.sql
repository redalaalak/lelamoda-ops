create table public.checkout_otp_pilot_challenges (
  id uuid primary key,
  digest text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  attempts integer not null default 0,
  sent boolean not null default false,
  verified_at timestamptz
);

alter table public.checkout_otp_pilot_challenges enable row level security;
revoke all on table public.checkout_otp_pilot_challenges from public, anon, authenticated;
grant select, insert, update, delete on table public.checkout_otp_pilot_challenges to service_role;

create function public.checkout_otp_pilot_reserve(
  p_id uuid, p_digest text, p_expires_at timestamptz
) returns boolean language plpgsql set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(82190861);

  delete from public.checkout_otp_pilot_challenges
    where created_at < now() - interval '1 day';

  if exists (
    select from public.checkout_otp_pilot_challenges
    where created_at > now() - interval '60 seconds'
  ) or (
    select count(*) from public.checkout_otp_pilot_challenges
    where created_at > now() - interval '15 minutes'
  ) >= 3 then
    return false;
  end if;

  insert into public.checkout_otp_pilot_challenges(id, digest, expires_at)
    values (p_id, p_digest, p_expires_at);
  return true;
end;
$$;

create function public.checkout_otp_pilot_verify(p_id uuid, p_digest text)
returns boolean language plpgsql set search_path = '' as $$
declare
  matched boolean;
begin
  update public.checkout_otp_pilot_challenges
    set attempts = attempts + 1,
        verified_at = case when digest = p_digest then now() end
    where id = p_id and sent and expires_at > now()
      and verified_at is null and attempts < 5
    returning verified_at is not null into matched;
  return coalesce(matched, false);
end;
$$;

revoke all on function public.checkout_otp_pilot_reserve(uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function public.checkout_otp_pilot_verify(uuid, text) from public, anon, authenticated;
grant execute on function public.checkout_otp_pilot_reserve(uuid, text, timestamptz) to service_role;
grant execute on function public.checkout_otp_pilot_verify(uuid, text) to service_role;
