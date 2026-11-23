-- Salva AR v2 — mevcut verileri koruyarak SQL Editor'de çalıştırın.
begin;
create table if not exists public.ar_replacements (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null unique references public.ar_projects(id) on delete restrict,
 owner_id uuid not null references auth.users(id) on delete restrict,
 total_bytes bigint not null check(total_bytes between 1 and 17825792),
 file_ids jsonb not null default '[]'::jsonb,
 state text not null default 'uploading' check(state in ('uploading','cleanup','failed')),
 created_at timestamptz not null default now()
);
alter table public.ar_replacements enable row level security;
revoke all on public.ar_replacements from public,anon,authenticated;
grant all on public.ar_replacements to service_role;

create or replace function public.ar_reserve(p_owner uuid,p_title text,p_ratio numeric,p_bytes bigint)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid;
begin
 perform pg_advisory_xact_lock(21062026);
 if (select count(*) from public.ar_projects where owner_id=p_owner)>=3 then raise exception 'LIMIT_USER'; end if;
 if (select count(*) from public.ar_upload_attempts where owner_id=p_owner and created_at>now()-interval '24 hours')>=5 then raise exception 'LIMIT_DAILY'; end if;
 if (select count(*) from public.ar_upload_attempts where created_at>now()-interval '24 hours')>=100 then raise exception 'LIMIT_GLOBAL_DAILY'; end if;
 if coalesce((select sum(total_bytes) from public.ar_projects),0)+coalesce((select sum(total_bytes) from public.ar_replacements),0)+p_bytes>2147483648 then raise exception 'LIMIT_STORAGE'; end if;
 insert into public.ar_upload_attempts(owner_id) values(p_owner);
 insert into public.ar_projects(owner_id,title,aspect_ratio,total_bytes) values(p_owner,p_title,p_ratio,p_bytes) returning id into v_id;
 return v_id;
end; $$;

create or replace function public.ar_reserve_replacement(p_owner uuid,p_project uuid,p_bytes bigint)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid;
begin
 perform pg_advisory_xact_lock(21062026);
 perform 1 from public.ar_projects where id=p_project and owner_id=p_owner and state='published' for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if exists(select 1 from public.ar_replacements where project_id=p_project) then raise exception 'UPDATE_BUSY'; end if;
 if (select count(*) from public.ar_upload_attempts where owner_id=p_owner and created_at>now()-interval '24 hours')>=5 then raise exception 'LIMIT_DAILY'; end if;
 if (select count(*) from public.ar_upload_attempts where created_at>now()-interval '24 hours')>=100 then raise exception 'LIMIT_GLOBAL_DAILY'; end if;
 -- Eski ve yeni dosyalar geçiş sırasında birlikte sayılır.
 if coalesce((select sum(total_bytes) from public.ar_projects),0)+coalesce((select sum(total_bytes) from public.ar_replacements),0)+p_bytes>2147483648 then raise exception 'LIMIT_STORAGE'; end if;
 insert into public.ar_upload_attempts(owner_id) values(p_owner);
 insert into public.ar_replacements(project_id,owner_id,total_bytes) values(p_project,p_owner,p_bytes) returning id into v_id;
 return v_id;
end; $$;

create or replace function public.ar_finish_replacement(p_owner uuid,p_job uuid,p_title text,p_ratio numeric,p_poster text,p_video text,p_target text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare job public.ar_replacements%rowtype; oldrow public.ar_projects%rowtype;
begin
 perform pg_advisory_xact_lock(21062026);
 select * into job from public.ar_replacements where id=p_job and owner_id=p_owner and state='uploading' for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if jsonb_array_length(job.file_ids)<>3 then raise exception 'INVALID_FILES'; end if;
 select * into oldrow from public.ar_projects where id=job.project_id and owner_id=p_owner and state='published' for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 update public.ar_projects set title=p_title,aspect_ratio=p_ratio,poster_url=p_poster,video_url=p_video,target_url=p_target,total_bytes=job.total_bytes,file_ids=job.file_ids where id=job.project_id;
 -- İş kaydı artık eski dosyaları tutar; temizleme tamamlanana kadar alanı rezerve eder.
 update public.ar_replacements set state='cleanup',file_ids=oldrow.file_ids,total_bytes=oldrow.total_bytes where id=job.id;
 return job.project_id;
end; $$;

create or replace function public.ar_claim_delete(p_owner uuid,p_project uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform pg_advisory_xact_lock(21062026);
 perform 1 from public.ar_projects where id=p_project and owner_id=p_owner for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if exists(select 1 from public.ar_projects where id=p_project and state='uploading' and created_at>now()-interval '15 minutes')
 or exists(select 1 from public.ar_replacements where project_id=p_project and created_at>now()-interval '15 minutes')
 then raise exception 'UPDATE_BUSY'; end if;
 update public.ar_projects set state='failed' where id=p_project and owner_id=p_owner;
end; $$;

revoke all on function public.ar_reserve(uuid,text,numeric,bigint) from public,anon,authenticated;
revoke all on function public.ar_reserve_replacement(uuid,uuid,bigint) from public,anon,authenticated;
revoke all on function public.ar_finish_replacement(uuid,uuid,text,numeric,text,text,text) from public,anon,authenticated;
revoke all on function public.ar_claim_delete(uuid,uuid) from public,anon,authenticated;
grant execute on function public.ar_reserve(uuid,text,numeric,bigint) to service_role;
grant execute on function public.ar_reserve_replacement(uuid,uuid,bigint) to service_role;
grant execute on function public.ar_finish_replacement(uuid,uuid,text,numeric,text,text,text) to service_role;
grant execute on function public.ar_claim_delete(uuid,uuid) to service_role;
commit;
