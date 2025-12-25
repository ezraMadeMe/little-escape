create table if not exists appointments (
  id uuid primary key,
  day_code varchar(16) not null,
  time_slot varchar(16) not null,
  duration_min int not null,
  created_at bigint not null
);


create table if not exists preps (
  id uuid primary key,
  appointment_id uuid not null references appointments(id) on delete cascade,
  travel_mode varchar(16) not null,
  origin_lat double precision not null,
  origin_lng double precision not null,
  prepared_at bigint not null
);

create table if not exists candidates (
  id uuid primary key,
  prep_id uuid not null references preps(id) on delete cascade,
  order_index int not null,
  dest_lat double precision not null,
  dest_lng double precision not null,
  itinerary_lines text not null,
  travel_summary varchar(64) not null,
  travel_lines text not null,
  travel_total_min int not null
);

create index if not exists idx_preps_appointment on preps(appointment_id);
create index if not exists idx_candidates_prep on candidates(prep_id);

-- POI (좌표만, 텍스트/이미지 없음)
create table if not exists pois (
  id uuid primary key,
  lat double precision not null,
  lng double precision not null,
  active boolean not null default true
);
