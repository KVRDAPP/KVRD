-- ============================================================
-- KVRD — Initial Schema Migration
-- 001_initial_schema.sql
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Custom types ────────────────────────────────────────────
do $$ begin
  create type criminalization_status as enum ('legal', 'illegal', 'death_penalty');
exception when duplicate_object then null; end $$;

do $$ begin
  create type review_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type destination_type as enum ('city', 'country');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum (
    'score_change',
    'legal_update',
    'review_approved',
    'badge_earned'
  );
exception when duplicate_object then null; end $$;


-- ============================================================
-- TABLE: users
-- Extends auth.users — one row per authenticated user.
-- ============================================================
create table if not exists public.users (
  id                      uuid primary key references auth.users(id) on delete cascade,
  display_name            text,
  avatar_url              text,
  identity_tags           text[],
  travel_style            text[],
  discreet_mode_enabled   boolean not null default false,
  notifications_enabled   boolean not null default true,
  created_at              timestamptz not null default now()
);

-- Auto-create a users row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, created_at)
  values (new.id, now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- TABLE: destinations
-- ============================================================
create table if not exists public.destinations (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  type                destination_type not null,
  country_code        text not null,
  region              text,
  latitude            double precision,
  longitude           double precision,
  hero_image_url      text,
  sanity_content_id   text,
  created_at          timestamptz not null default now()
);

create index if not exists destinations_country_code_idx on public.destinations(country_code);
create index if not exists destinations_type_idx on public.destinations(type);


-- ============================================================
-- TABLE: safety_scores
-- ============================================================
create table if not exists public.safety_scores (
  id                  uuid primary key default uuid_generate_v4(),
  destination_id      uuid not null references public.destinations(id) on delete cascade,
  community_score     double precision not null check (community_score between 0.0 and 10.0),
  legal_score         double precision not null check (legal_score between 0.0 and 10.0),
  -- composite_score is computed: (community_score * 0.6) + (legal_score * 0.4)
  composite_score     double precision not null
                        generated always as ((community_score * 0.6) + (legal_score * 0.4)) stored,
  trans_score         double precision check (trans_score between 0.0 and 10.0),
  womens_score        double precision check (womens_score between 0.0 and 10.0),
  review_count        integer not null default 0,
  last_updated        timestamptz not null default now()
);

create index if not exists safety_scores_destination_id_idx on public.safety_scores(destination_id);
create index if not exists safety_scores_composite_score_idx on public.safety_scores(composite_score desc);


-- ============================================================
-- TABLE: legal_statuses
-- ============================================================
create table if not exists public.legal_statuses (
  id                              uuid primary key default uuid_generate_v4(),
  country_code                    text not null unique,
  criminalization_status          criminalization_status not null,
  same_sex_marriage               boolean not null default false,
  civil_unions                    boolean not null default false,
  adoption_rights                 boolean not null default false,
  anti_discrimination_protections boolean not null default false,
  transgender_legal_recognition   boolean not null default false,
  ilga_tier                       integer check (ilga_tier between 1 and 4),
  ilga_year                       integer,
  notes                           text,
  last_updated                    timestamptz not null default now()
);

create index if not exists legal_statuses_country_code_idx on public.legal_statuses(country_code);


-- ============================================================
-- TABLE: reviews
-- ============================================================
create table if not exists public.reviews (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.users(id) on delete cascade,
  destination_id   uuid not null references public.destinations(id) on delete cascade,
  overall_score    double precision not null check (overall_score between 0.0 and 10.0),
  identity_tags    text[],
  body             text not null,
  visited_at       date,
  helpful_count    integer not null default 0,
  status           review_status not null default 'pending',
  created_at       timestamptz not null default now()
);

create index if not exists reviews_destination_id_idx on public.reviews(destination_id);
create index if not exists reviews_user_id_idx on public.reviews(user_id);
create index if not exists reviews_status_idx on public.reviews(status);


-- ============================================================
-- TABLE: saved_destinations
-- ============================================================
create table if not exists public.saved_destinations (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.users(id) on delete cascade,
  destination_id   uuid not null references public.destinations(id) on delete cascade,
  created_at       timestamptz not null default now(),
  unique (user_id, destination_id)
);

create index if not exists saved_destinations_user_id_idx on public.saved_destinations(user_id);
create index if not exists saved_destinations_destination_id_idx on public.saved_destinations(destination_id);


-- ============================================================
-- TABLE: visited_destinations
-- ============================================================
create table if not exists public.visited_destinations (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.users(id) on delete cascade,
  destination_id   uuid not null references public.destinations(id) on delete cascade,
  visited_at       date,
  created_at       timestamptz not null default now()
);

create index if not exists visited_destinations_user_id_idx on public.visited_destinations(user_id);
create index if not exists visited_destinations_destination_id_idx on public.visited_destinations(destination_id);


-- ============================================================
-- TABLE: badges
-- ============================================================
create table if not exists public.badges (
  id          uuid primary key default uuid_generate_v4(),
  slug        text not null unique,
  name        text not null,
  description text,
  icon_url    text
);


-- ============================================================
-- TABLE: badge_grants
-- ============================================================
create table if not exists public.badge_grants (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  badge_id    uuid not null references public.badges(id) on delete cascade,
  granted_at  timestamptz not null default now(),
  unique (user_id, badge_id)
);

create index if not exists badge_grants_user_id_idx on public.badge_grants(user_id);


-- ============================================================
-- TABLE: notifications
-- ============================================================
create table if not exists public.notifications (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.users(id) on delete cascade,
  type             notification_type not null,
  title            text not null,
  body             text not null,
  destination_id   uuid references public.destinations(id) on delete set null,
  read             boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_read_idx on public.notifications(user_id, read);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users                enable row level security;
alter table public.destinations         enable row level security;
alter table public.safety_scores        enable row level security;
alter table public.legal_statuses       enable row level security;
alter table public.reviews              enable row level security;
alter table public.saved_destinations   enable row level security;
alter table public.visited_destinations enable row level security;
alter table public.badges               enable row level security;
alter table public.badge_grants         enable row level security;
alter table public.notifications        enable row level security;


-- ─── users ───────────────────────────────────────────────────
create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- ─── destinations (public read) ──────────────────────────────
create policy "Destinations are publicly readable"
  on public.destinations for select
  using (true);

-- ─── safety_scores (public read) ─────────────────────────────
create policy "Safety scores are publicly readable"
  on public.safety_scores for select
  using (true);

-- ─── legal_statuses (public read) ────────────────────────────
create policy "Legal statuses are publicly readable"
  on public.legal_statuses for select
  using (true);

-- ─── reviews ─────────────────────────────────────────────────
-- Approved reviews are publicly readable.
create policy "Approved reviews are publicly readable"
  on public.reviews for select
  using (status = 'approved');

-- The submitting user can always see their own reviews (any status).
create policy "Users can read own reviews"
  on public.reviews for select
  using (auth.uid() = user_id);

create policy "Users can insert own reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update own pending reviews"
  on public.reviews for update
  using (auth.uid() = user_id and status = 'pending');

create policy "Users can delete own pending reviews"
  on public.reviews for delete
  using (auth.uid() = user_id and status = 'pending');

-- ─── saved_destinations ──────────────────────────────────────
create policy "Users can manage own saved destinations"
  on public.saved_destinations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── visited_destinations ────────────────────────────────────
create policy "Users can manage own visited destinations"
  on public.visited_destinations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── badges (public read) ────────────────────────────────────
create policy "Badges are publicly readable"
  on public.badges for select
  using (true);

-- ─── badge_grants ────────────────────────────────────────────
create policy "Users can read own badge grants"
  on public.badge_grants for select
  using (auth.uid() = user_id);

-- ─── notifications ───────────────────────────────────────────
create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can mark own notifications as read"
  on public.notifications for update
  using (auth.uid() = user_id);
