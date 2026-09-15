ALTER TABLE "profiles" ADD COLUMN "archetype" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "cap_day_minutes" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "cap_week_minutes" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "cap_month_minutes" integer;--> statement-breakpoint
ALTER TABLE "group_members" ADD COLUMN "favorited" boolean DEFAULT false NOT NULL;
