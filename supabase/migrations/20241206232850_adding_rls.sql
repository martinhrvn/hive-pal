-- Add user_id to hives table
alter table hives add column user_id uuid references auth.users(id) not null;

-- Enable RLS on all tables
alter table hives enable row level security;
alter table queens enable row level security;
alter table inspections enable row level security;

-- Policy for hives: users can only see and modify their own hives
create policy "Users can view their own hives"
  on hives for select
                          using (auth.uid() = user_id);

create policy "Users can insert their own hives"
  on hives for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own hives"
  on hives for update
                                 using (auth.uid() = user_id)
               with check (auth.uid() = user_id);

create policy "Users can delete their own hives"
  on hives for delete
using (auth.uid() = user_id);

-- Policy for queens: users can only see and modify queens in their hives
create policy "Users can view queens in their hives"
  on queens for select
                           using (
                           exists (
                           select 1 from hives
                           where hives.id = queens.hive_id
                           and hives.user_id = auth.uid()
                           )
                           );

create policy "Users can insert queens in their hives"
  on queens for insert
  with check (
    exists (
      select 1 from hives
      where hives.id = queens.hive_id
      and hives.user_id = auth.uid()
    )
  );

create policy "Users can update queens in their hives"
  on queens for update
                                  using (
                                  exists (
                                  select 1 from hives
                                  where hives.id = queens.hive_id
                                  and hives.user_id = auth.uid()
                                  )
                                  )
                with check (
                                  exists (
                                  select 1 from hives
                                  where hives.id = queens.hive_id
                                  and hives.user_id = auth.uid()
                                  )
                                  );

create policy "Users can delete queens in their hives"
  on queens for delete
using (
    exists (
      select 1 from hives
      where hives.id = queens.hive_id
      and hives.user_id = auth.uid()
    )
  );

-- Policy for inspections: users can only see and modify inspections of their hives
create policy "Users can view inspections of their hives"
  on inspections for select
                                using (
                                exists (
                                select 1 from hives
                                where hives.id = inspections.hive_id
                                and hives.user_id = auth.uid()
                                )
                                );

create policy "Users can insert inspections for their hives"
  on inspections for insert
  with check (
    exists (
      select 1 from hives
      where hives.id = inspections.hive_id
      and hives.user_id = auth.uid()
    )
  );

create policy "Users can update inspections of their hives"
  on inspections for update
                                       using (
                                       exists (
                                       select 1 from hives
                                       where hives.id = inspections.hive_id
                                       and hives.user_id = auth.uid()
                                       )
                                       )
                     with check (
                                       exists (
                                       select 1 from hives
                                       where hives.id = inspections.hive_id
                                       and hives.user_id = auth.uid()
                                       )
                                       );

create policy "Users can delete inspections of their hives"
  on inspections for delete
using (
    exists (
      select 1 from hives
      where hives.id = inspections.hive_id
      and hives.user_id = auth.uid()
    )
  );