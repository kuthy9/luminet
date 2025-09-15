-- Allow recipients of contact_request to update the embed (e.g., accept/decline/read)
DROP POLICY IF EXISTS embeds_update_recipient ON public.embeds;
CREATE POLICY embeds_update_recipient
  ON public.embeds FOR UPDATE
  USING (
    type = 'contact_request' AND (content::jsonb ->> 'to') = auth.uid()::text
  );

