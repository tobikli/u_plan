


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."degree_type" AS ENUM (
    'Bachelor',
    'Master',
    'Phd',
    'Associate',
    'Diploma',
    'Certificate',
    'Other'
);


ALTER TYPE "public"."degree_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.preferences (user_id, grade_min, grade_max, grade_passed, grade_include_failed)
  values (new.id, 1.0, 5.0, 4.0, false);
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "credits" integer NOT NULL,
    "program_id" "uuid" NOT NULL,
    "semesters" integer NOT NULL,
    "finished" boolean DEFAULT false NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "grade" numeric,
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "editor_state" "jsonb"
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "grade_min" numeric DEFAULT 1.0 NOT NULL,
    "grade_max" numeric DEFAULT 5.0 NOT NULL,
    "grade_passed" numeric DEFAULT 4.0 NOT NULL,
    "grade_include_failed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "trimester" boolean DEFAULT false
);


ALTER TABLE "public"."preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_programs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "degree" "public"."degree_type" NOT NULL,
    "institution" "text" NOT NULL,
    "semesters" integer NOT NULL,
    "current_semester" integer NOT NULL,
    "finished" boolean DEFAULT false NOT NULL,
    "credits" integer NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."study_programs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_user_program_unique" UNIQUE ("user_id", "program_id", "course_code");



ALTER TABLE ONLY "public"."preferences"
    ADD CONSTRAINT "preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preferences"
    ADD CONSTRAINT "preferences_user_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."study_programs"
    ADD CONSTRAINT "study_programs_pkey" PRIMARY KEY ("id");



CREATE INDEX "courses_tags_gin_idx" ON "public"."courses" USING "gin" ("tags");



CREATE INDEX "idx_courses_program_id" ON "public"."courses" USING "btree" ("program_id");



CREATE INDEX "idx_courses_user_id" ON "public"."courses" USING "btree" ("user_id");



CREATE INDEX "idx_courses_user_program" ON "public"."courses" USING "btree" ("user_id", "program_id");



CREATE INDEX "idx_preferences_user_id" ON "public"."preferences" USING "btree" ("user_id");



CREATE INDEX "idx_study_programs_user_id" ON "public"."study_programs" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."study_programs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."study_programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preferences"
    ADD CONSTRAINT "preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_programs"
    ADD CONSTRAINT "study_programs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow owners to delete their programs" ON "public"."study_programs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow owners to insert their programs" ON "public"."study_programs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow owners to select their programs" ON "public"."study_programs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow owners to update their programs" ON "public"."study_programs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own preferences" ON "public"."preferences" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own preferences" ON "public"."preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own preferences" ON "public"."preferences" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own preferences" ON "public"."preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "courses_delete_own" ON "public"."courses" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "courses_insert_own" ON "public"."courses" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "courses_select_own" ON "public"."courses" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "courses_update_own" ON "public"."courses" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_programs" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."courses";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."study_programs";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."preferences" TO "anon";
GRANT ALL ON TABLE "public"."preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."preferences" TO "service_role";



GRANT ALL ON TABLE "public"."study_programs" TO "anon";
GRANT ALL ON TABLE "public"."study_programs" TO "authenticated";
GRANT ALL ON TABLE "public"."study_programs" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































