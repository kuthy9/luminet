-- MVP public ideas visibility and minimal contact-request policies

-- 1) Add visibility to ideas for public discovery
ALTER TABLE IF EXISTS public.ideas
  ADD COLUMN IF NOT EXISTS visibility text CHECK (visibility IN ('private','public')) DEFAULT 'private';

-- 2) Enable RLS and policies on ideas
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ideas_select_public ON public.ideas;
CREATE POLICY ideas_select_public
  ON public.ideas FOR SELECT
  USING (
    (user_id::text = auth.uid()::text)
    OR visibility = 'public'
  );

DROP POLICY IF EXISTS ideas_insert_owner ON public.ideas;
CREATE POLICY ideas_insert_owner
  ON public.ideas FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS ideas_update_owner ON public.ideas;
CREATE POLICY ideas_update_owner
  ON public.ideas FOR UPDATE
  USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS ideas_delete_owner ON public.ideas;
CREATE POLICY ideas_delete_owner
  ON public.ideas FOR DELETE
  USING (user_id::text = auth.uid()::text);

CREATE INDEX IF NOT EXISTS idx_ideas_visibility ON public.ideas(visibility);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON public.ideas(created_at DESC);

-- 3) Enable contact requests via embeds
ALTER TABLE public.embeds ENABLE ROW LEVEL SECURITY;

-- owner can select own embeds; recipients can read contact requests sent to them
DROP POLICY IF EXISTS embeds_select_owner_or_recipient ON public.embeds;
CREATE POLICY embeds_select_owner_or_recipient
  ON public.embeds FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR (
      type = 'contact_request'
      AND (content::jsonb ->> 'to') = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS embeds_insert_owner ON public.embeds;
CREATE POLICY embeds_insert_owner
  ON public.embeds FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS embeds_update_owner ON public.embeds;
CREATE POLICY embeds_update_owner
  ON public.embeds FOR UPDATE
  USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS embeds_delete_owner ON public.embeds;
CREATE POLICY embeds_delete_owner
  ON public.embeds FOR DELETE
  USING (user_id::text = auth.uid()::text);
