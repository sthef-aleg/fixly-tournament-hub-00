
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tournaments table
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  logo TEXT,
  type TEXT NOT NULL DEFAULT 'league',
  mode TEXT NOT NULL DEFAULT 'community',
  is_pro BOOLEAN DEFAULT false,
  owner_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'draft',
  promotion_count INTEGER DEFAULT 0,
  relegation_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tournaments"
  ON public.tournaments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create tournaments"
  ON public.tournaments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their tournaments"
  ON public.tournaments FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their tournaments"
  ON public.tournaments FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- Teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  logo TEXT,
  group_name TEXT
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teams"
  ON public.teams FOR SELECT USING (true);

CREATE POLICY "Tournament owners can manage teams"
  ON public.teams FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments
      WHERE id = teams.tournament_id AND owner_id = auth.uid()
    )
  );

-- Community tournaments: anyone authenticated can manage teams
CREATE POLICY "Community tournament team management"
  ON public.teams FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments
      WHERE id = teams.tournament_id AND mode = 'community'
    )
  );

-- Matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  home_team_id UUID REFERENCES public.teams(id),
  away_team_id UUID REFERENCES public.teams(id),
  home_score INTEGER,
  away_score INTEGER,
  matchday INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'scheduled',
  bracket_round INTEGER,
  bracket_position INTEGER,
  group_name TEXT,
  scheduled_at TIMESTAMPTZ,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view matches"
  ON public.matches FOR SELECT USING (true);

CREATE POLICY "Tournament owners can manage matches"
  ON public.matches FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments
      WHERE id = matches.tournament_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Community match updates"
  ON public.matches FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments
      WHERE id = matches.tournament_id AND mode = 'community'
    )
  );

-- Tournament zones (color zones for standings)
CREATE TABLE public.tournament_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  start_position INTEGER NOT NULL,
  end_position INTEGER NOT NULL,
  color TEXT NOT NULL,
  label TEXT
);

ALTER TABLE public.tournament_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view zones"
  ON public.tournament_zones FOR SELECT USING (true);

CREATE POLICY "Tournament owners can manage zones"
  ON public.tournament_zones FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments
      WHERE id = tournament_zones.tournament_id AND owner_id = auth.uid()
    )
  );

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
