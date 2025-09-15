-- Speed up keywords array contains queries on ideas
CREATE INDEX IF NOT EXISTS idx_ideas_keywords_gin ON public.ideas USING gin (keywords);

