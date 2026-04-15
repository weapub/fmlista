


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


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    new.id,
    new.email,
    CASE COALESCE(new.raw_user_meta_data->>'role', 'listener')
      WHEN 'admin' THEN 'super_admin'
      WHEN 'radio_admin' THEN 'radio_admin'
      WHEN 'super_admin' THEN 'super_admin'
      ELSE 'listener'
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      role  = EXCLUDED.role;

  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_subscription_user_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_subscription_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."advertisements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "image_url" "text" NOT NULL,
    "link_url" "text",
    "position" "text" NOT NULL,
    "active" boolean DEFAULT true,
    "clicks" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "display_order" integer DEFAULT 0,
    "radio_id" "uuid",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    CONSTRAINT "advertisements_position_check" CHECK (("position" = ANY (ARRAY['home_top'::"text", 'home_middle'::"text", 'microsite_top'::"text", 'microsite_sidebar'::"text"])))
);


ALTER TABLE "public"."advertisements" OWNER TO "postgres";


COMMENT ON COLUMN "public"."advertisements"."start_date" IS 'Fecha y hora desde cuando el anuncio será visible (NULL = inmediatamente)';



COMMENT ON COLUMN "public"."advertisements"."end_date" IS 'Fecha y hora hasta cuando el anuncio será visible (NULL = indefinidamente)';



CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "key" "text" NOT NULL,
    "value" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "radio_id" "uuid",
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."favorites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "radio_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "price" numeric NOT NULL,
    "currency" "text" DEFAULT 'ARS'::"text",
    "description" "text",
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "interval" "text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_featured" boolean DEFAULT false,
    CONSTRAINT "plans_interval_check" CHECK (("interval" = ANY (ARRAY['monthly'::"text", 'yearly'::"text", 'one_time'::"text"]))),
    CONSTRAINT "plans_type_check" CHECK (("type" = ANY (ARRAY['streaming'::"text", 'ads'::"text", 'premium_feature'::"text", 'microsite'::"text"])))
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."radios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" character varying(100) NOT NULL,
    "frequency" character varying(10) NOT NULL,
    "logo_url" "text",
    "cover_url" "text",
    "description" "text",
    "stream_url" "text" NOT NULL,
    "location" character varying(100),
    "category" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "whatsapp" character varying(20),
    "social_facebook" "text",
    "social_instagram" "text",
    "social_twitter" "text",
    "address" "text",
    "video_stream_url" "text",
    "slug" "text",
    "video_url" "text",
    CONSTRAINT "slug_format_check" CHECK (("slug" ~* '^[a-z0-9-]+$'::"text"))
);


ALTER TABLE "public"."radios" OWNER TO "postgres";


COMMENT ON COLUMN "public"."radios"."video_url" IS 'URL del streaming de video (YouTube, Twitch, iFrame, etc.)';



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "current_period_start" timestamp with time zone DEFAULT "now"(),
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "radio_id" "uuid",
    "next_billing_date" timestamp with time zone,
    "updated_at" timestamp with time zone,
    CONSTRAINT "subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'cancelled'::"text", 'past_due'::"text", 'trialing'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."radio_subscription_status" WITH ("security_invoker"='on') AS
 SELECT "r"."id",
    "r"."user_id",
    "r"."name",
    "r"."frequency",
    "r"."logo_url",
    "r"."cover_url",
    "r"."description",
    "r"."stream_url",
    "r"."location",
    "r"."category",
    "r"."created_at",
    "r"."updated_at",
    "r"."whatsapp",
    "r"."social_facebook",
    "r"."social_instagram",
    "r"."social_twitter",
    "r"."address",
    "r"."video_stream_url",
    "r"."slug",
    "r"."video_url",
    COALESCE("s"."status", 'inactive'::"text") AS "subscription_status",
    "p"."name" AS "plan_name",
    "p"."type" AS "plan_type",
    "s"."current_period_end",
        CASE
            WHEN (("s"."status" = 'active'::"text") AND (("s"."current_period_end" IS NULL) OR ("s"."current_period_end" > "now"()))) THEN true
            ELSE false
        END AS "is_premium"
   FROM (("public"."radios" "r"
     LEFT JOIN "public"."subscriptions" "s" ON (("r"."user_id" = "s"."user_id")))
     LEFT JOIN "public"."plans" "p" ON (("s"."plan_id" = "p"."id")));


ALTER VIEW "public"."radio_subscription_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "radio_id" "uuid",
    "rating" integer,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedule_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "radio_id" "uuid",
    "program_name" character varying(100) NOT NULL,
    "day_of_week" character varying(10),
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "schedule_items_day_of_week_check" CHECK ((("day_of_week")::"text" = ANY ((ARRAY['Lunes'::character varying, 'Martes'::character varying, 'Miércoles'::character varying, 'Jueves'::character varying, 'Viernes'::character varying, 'Sábado'::character varying, 'Domingo'::character varying])::"text"[])))
);


ALTER TABLE "public"."schedule_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "password_hash" character varying(255),
    "role" character varying(20) DEFAULT 'listener'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "users_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['listener'::character varying, 'radio_admin'::character varying, 'super_admin'::character varying])::"text"[])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."advertisements"
    ADD CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_radio_id_key" UNIQUE ("user_id", "radio_id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."radios"
    ADD CONSTRAINT "radios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."radios"
    ADD CONSTRAINT "radios_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedule_items"
    ADD CONSTRAINT "schedule_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_radio_id_key" UNIQUE ("radio_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_advertisements_date_range" ON "public"."advertisements" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_radios_category" ON "public"."radios" USING "btree" ("category");



CREATE INDEX "idx_radios_location" ON "public"."radios" USING "btree" ("location");



CREATE INDEX "idx_radios_user_id" ON "public"."radios" USING "btree" ("user_id");



CREATE INDEX "idx_schedule_day" ON "public"."schedule_items" USING "btree" ("day_of_week");



CREATE INDEX "idx_schedule_radio_id" ON "public"."schedule_items" USING "btree" ("radio_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "radios_slug_idx" ON "public"."radios" USING "btree" ("slug");



CREATE UNIQUE INDEX "subscriptions_active_one_per_radio" ON "public"."subscriptions" USING "btree" ("radio_id") WHERE ("status" = 'active'::"text");



CREATE OR REPLACE TRIGGER "subscriptions_set_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tr_set_subscription_user_id" BEFORE INSERT OR UPDATE OF "user_id" ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_subscription_user_id"();



ALTER TABLE ONLY "public"."advertisements"
    ADD CONSTRAINT "advertisements_radio_id_fkey" FOREIGN KEY ("radio_id") REFERENCES "public"."radios"("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_radio_id_fkey" FOREIGN KEY ("radio_id") REFERENCES "public"."radios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_radio_id_fkey" FOREIGN KEY ("radio_id") REFERENCES "public"."radios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."radios"
    ADD CONSTRAINT "radios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_radio_id_fkey" FOREIGN KEY ("radio_id") REFERENCES "public"."radios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedule_items"
    ADD CONSTRAINT "schedule_items_radio_id_fkey" FOREIGN KEY ("radio_id") REFERENCES "public"."radios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_radio_id_fkey" FOREIGN KEY ("radio_id") REFERENCES "public"."radios"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



CREATE POLICY "Authenticated users can add chat messages" ON "public"."chat_messages" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can add reviews" ON "public"."reviews" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Chat messages are viewable by everyone" ON "public"."chat_messages" FOR SELECT USING (true);



CREATE POLICY "Everyone can read app_settings" ON "public"."app_settings" FOR SELECT USING (true);



CREATE POLICY "Everyone can view active ads" ON "public"."advertisements" FOR SELECT USING (("active" = true));



CREATE POLICY "Favorites are viewable by owner" ON "public"."favorites" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Public read access to active plans" ON "public"."plans" FOR SELECT USING (("active" = true));



CREATE POLICY "Radio admins view own subscriptions" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING (("radio_id" IN ( SELECT "r"."id"
   FROM "public"."radios" "r"
  WHERE ("r"."user_id" = "auth"."uid"()))));



CREATE POLICY "Radio owners can delete their own ads" ON "public"."advertisements" FOR DELETE TO "authenticated" USING (("radio_id" IN ( SELECT "radios"."id"
   FROM "public"."radios"
  WHERE ("radios"."user_id" = "auth"."uid"()))));



CREATE POLICY "Radio owners can insert ads for their radios" ON "public"."advertisements" FOR INSERT TO "authenticated" WITH CHECK (("radio_id" IN ( SELECT "radios"."id"
   FROM "public"."radios"
  WHERE ("radios"."user_id" = "auth"."uid"()))));



CREATE POLICY "Radio owners can update their own ads" ON "public"."advertisements" FOR UPDATE TO "authenticated" USING (("radio_id" IN ( SELECT "radios"."id"
   FROM "public"."radios"
  WHERE ("radios"."user_id" = "auth"."uid"())))) WITH CHECK (("radio_id" IN ( SELECT "radios"."id"
   FROM "public"."radios"
  WHERE ("radios"."user_id" = "auth"."uid"()))));



CREATE POLICY "Radio owners can view their own ads" ON "public"."advertisements" FOR SELECT TO "authenticated" USING (("radio_id" IN ( SELECT "radios"."id"
   FROM "public"."radios"
  WHERE ("radios"."user_id" = "auth"."uid"()))));



CREATE POLICY "Radios are viewable by everyone" ON "public"."radios" FOR SELECT USING (true);



CREATE POLICY "Reviews are viewable by everyone" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Schedule items are viewable by everyone" ON "public"."schedule_items" FOR SELECT USING (true);



CREATE POLICY "Super Admins can delete any radio" ON "public"."radios" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'super_admin'::"text")))));



CREATE POLICY "Super Admins can update any radio" ON "public"."radios" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'super_admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'super_admin'::"text")))));



CREATE POLICY "Super admin can do everything with ads" ON "public"."advertisements" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE (("users"."role")::"text" = 'super_admin'::"text"))));



CREATE POLICY "Super admin can manage app_settings" ON "public"."app_settings" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE (("users"."role")::"text" = 'super_admin'::"text"))));



CREATE POLICY "Super admin can view all ads" ON "public"."advertisements" FOR SELECT USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE (("users"."role")::"text" = 'super_admin'::"text"))));



CREATE POLICY "Super admin manage plans" ON "public"."plans" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE (("users"."role")::"text" = 'super_admin'::"text"))));



CREATE POLICY "Super admin view all subscriptions" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE (("users"."role")::"text" = 'super_admin'::"text"))));



CREATE POLICY "Super admins manage all subscriptions" ON "public"."subscriptions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'super_admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'super_admin'::"text")))));



CREATE POLICY "Superadmin full access" ON "public"."users" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "users_1"
  WHERE (("users_1"."id" = "auth"."uid"()) AND (("users_1"."role")::"text" = 'superadmin'::"text")))));



CREATE POLICY "Users and Super Admins can delete radios" ON "public"."radios" FOR DELETE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'super_admin'::"text"))))));



CREATE POLICY "Users and Super Admins can update radios" ON "public"."radios" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'super_admin'::"text"))))));



CREATE POLICY "Users can add favorites" ON "public"."favorites" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their favorites" ON "public"."favorites" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own radios" ON "public"."radios" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own subscriptions" ON "public"."subscriptions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage schedule for their radios" ON "public"."schedule_items" USING (("auth"."uid"() = ( SELECT "radios"."user_id"
   FROM "public"."radios"
  WHERE ("radios"."id" = "schedule_items"."radio_id"))));



CREATE POLICY "Users can update their own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own radios" ON "public"."radios" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own subscriptions" ON "public"."subscriptions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own subscriptions" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."advertisements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."favorites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."radios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedule_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_subscription_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_subscription_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_subscription_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";
























GRANT ALL ON TABLE "public"."advertisements" TO "anon";
GRANT ALL ON TABLE "public"."advertisements" TO "authenticated";
GRANT ALL ON TABLE "public"."advertisements" TO "service_role";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."favorites" TO "anon";
GRANT ALL ON TABLE "public"."favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."favorites" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON TABLE "public"."radios" TO "anon";
GRANT ALL ON TABLE "public"."radios" TO "authenticated";
GRANT ALL ON TABLE "public"."radios" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."radio_subscription_status" TO "anon";
GRANT ALL ON TABLE "public"."radio_subscription_status" TO "authenticated";
GRANT ALL ON TABLE "public"."radio_subscription_status" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_items" TO "anon";
GRANT ALL ON TABLE "public"."schedule_items" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_items" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









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



































