CREATE TABLE "playtime_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"steam_id" text NOT NULL,
	"app_id" integer NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"playtime_forever" integer DEFAULT 0 NOT NULL,
	"playtime_two_weeks" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "playtime_snapshots" ADD CONSTRAINT "playtime_snapshots_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "playtime_snapshots_profile_captured_idx" ON "playtime_snapshots" USING btree ("profile_id","captured_at");--> statement-breakpoint
CREATE INDEX "playtime_snapshots_profile_app_captured_idx" ON "playtime_snapshots" USING btree ("profile_id","app_id","captured_at");