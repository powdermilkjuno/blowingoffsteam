CREATE TABLE "playtime_daily" (
	"profile_id" uuid NOT NULL,
	"app_id" integer NOT NULL,
	"day" date NOT NULL,
	"minutes" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "playtime_daily_profile_id_app_id_day_pk" PRIMARY KEY("profile_id","app_id","day")
);
--> statement-breakpoint
ALTER TABLE "playtime_daily" ADD CONSTRAINT "playtime_daily_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "playtime_daily_profile_day_idx" ON "playtime_daily" USING btree ("profile_id","day");