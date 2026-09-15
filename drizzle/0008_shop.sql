ALTER TABLE "profiles" ADD COLUMN "wallet_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "equipped_frame" text DEFAULT 'frame:none' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "equipped_font" text DEFAULT 'font:mono' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "equipped_site_theme" text DEFAULT 'theme:default' NOT NULL;--> statement-breakpoint
CREATE TABLE "profile_inventory" (
	"profile_id" uuid NOT NULL,
	"item_id" text NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_inventory_profile_id_item_id_pk" PRIMARY KEY("profile_id","item_id")
);--> statement-breakpoint
ALTER TABLE "profile_inventory" ADD CONSTRAINT "profile_inventory_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "groups" DROP CONSTRAINT "groups_accent";--> statement-breakpoint
UPDATE "profiles" SET "wallet_points" = COALESCE((
  SELECT sum("points")::int FROM "group_daily_scores" WHERE "group_daily_scores"."profile_id" = "profiles"."id"
), 0);
