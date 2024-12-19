-- supabase/migrations/20240307000000_initial_schema.sql

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create enum types
create type hive_status as enum ('active', 'inactive', 'pending');
create type inspection_type as enum ('routine', 'emergency', 'treatment');

-- Create hives table
create table hives (
                       id uuid primary key default uuid_generate_v4(),
                       name text not null,
                       location_description text,
                       latitude double precision,
                       longitude double precision,
                       status hive_status default 'pending',
                       installation_date date not null,
                       notes text,
                       created_at timestamptz default now(),
                       updated_at timestamptz default now()
);

-- Create queens table
create table queens (
                        id uuid primary key default uuid_generate_v4(),
                        hive_id uuid references hives(id),
                        marked boolean default false,
                        marking_color text,
                        birth_year integer,
                        source text,
                        notes text,
                        active boolean default true,
                        created_at timestamptz default now(),
                        updated_at timestamptz default now()
);

-- Create inspections table
create table inspections (
                             id uuid primary key default uuid_generate_v4(),
                             hive_id uuid references hives(id),
                             inspection_date timestamptz not null,
                             type inspection_type default 'routine',
                             queen_seen boolean,
                             queen_cells_present boolean,
                             brood_pattern_score integer check (brood_pattern_score between 1 and 5),
                             population_score integer check (population_score between 1 and 5),
                             honey_stores_score integer check (honey_stores_score between 1 and 5),
                             disease_signs boolean default false,
                             disease_notes text,
                             weather_conditions text,
                             temperature numeric,
                             notes text,
                             created_at timestamptz default now()
);

-- Add RLS (Row Level Security) policies
alter table hives enable row level security;
alter table queens enable row level security;
alter table inspections enable row level security;

-- Create auto-updating updated_at columns
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
return new;
end;
$$ language plpgsql;

create trigger update_hives_updated_at
    before update on hives
    for each row
    execute function update_updated_at_column();

create trigger update_queens_updated_at
    before update on queens
    for each row
    execute function update_updated_at_column();