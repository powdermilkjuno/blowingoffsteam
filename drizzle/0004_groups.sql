CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"invite_token" text NOT NULL,
	"owner_profile_id" uuid NOT NULL,
	"time_zone" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "groups_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"group_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	CONSTRAINT "group_members_group_id_profile_id_pk" PRIMARY KEY("group_id","profile_id"),
	CONSTRAINT "group_members_role" CHECK ("group_members"."role" in ('owner', 'member')),
	CONSTRAINT "group_members_status" CHECK ("group_members"."status" in ('pending', 'accepted'))
);
--> statement-breakpoint
CREATE TABLE "group_daily_scores" (
	"group_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"day" date NOT NULL,
	"place" integer NOT NULL,
	"minutes" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "group_daily_scores_group_id_profile_id_day_pk" PRIMARY KEY("group_id","profile_id","day")
);
--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_owner_profile_id_profiles_id_fk" FOREIGN KEY ("owner_profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_daily_scores" ADD CONSTRAINT "group_daily_scores_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_daily_scores" ADD CONSTRAINT "group_daily_scores_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "group_members_profile_idx" ON "group_members" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "group_daily_scores_group_day_idx" ON "group_daily_scores" USING btree ("group_id","day");
