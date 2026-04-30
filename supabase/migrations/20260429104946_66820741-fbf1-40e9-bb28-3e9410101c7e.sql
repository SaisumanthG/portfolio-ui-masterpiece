CREATE TABLE IF NOT EXISTS public.portfolio_content (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_content ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_portfolio_content_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_portfolio_content_updated_at ON public.portfolio_content;
CREATE TRIGGER update_portfolio_content_updated_at
BEFORE UPDATE ON public.portfolio_content
FOR EACH ROW
EXECUTE FUNCTION public.update_portfolio_content_updated_at();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'portfolio_content' AND policyname = 'Portfolio content is publicly viewable'
  ) THEN
    CREATE POLICY "Portfolio content is publicly viewable"
    ON public.portfolio_content
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'portfolio_content' AND policyname = 'Admins can create portfolio content'
  ) THEN
    CREATE POLICY "Admins can create portfolio content"
    ON public.portfolio_content
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'portfolio_content' AND policyname = 'Admins can update portfolio content'
  ) THEN
    CREATE POLICY "Admins can update portfolio content"
    ON public.portfolio_content
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

INSERT INTO public.portfolio_content (id, data)
VALUES ('main', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio_content;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;