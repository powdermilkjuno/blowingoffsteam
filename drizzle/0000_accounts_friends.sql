CREATE TABLE "friendships" (
	"requester_id" uuid NOT NULL,
	"addressee_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	CONSTRAINT "friendships_requester_id_addressee_id_pk" PRIMARY KEY("requester_id","addressee_id"),
	CONSTRAINT "friendships_no_self" CHECK ("friendships"."requester_id" <> "friendships"."addressee_id"),
	CONSTRAINT "friendships_status" CHECK ("friendships"."status" in ('pending', 'accepted'))
);
--> statement-breakpoint
CREATE TABLE "game_playtime" (
	"profile_id" uuid NOT NULL,
	"app_id" integer NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"playtime_forever" integer DEFAULT 0 NOT NULL,
	"playtime_two_weeks" integer DEFAULT 0 NOT NULL,
	"last_played_at" integer,
	"icon_hash" text DEFAULT '' NOT NULL,
	CONSTRAINT "game_playtime_profile_id_app_id_pk" PRIMARY KEY("profile_id","app_id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text DEFAULT '' NOT NULL,
	"friend_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "profiles_username_unique" UNIQUE("username"),
	CONSTRAINT "profiles_friend_code_unique" UNIQUE("friend_code")
);
--> statement-breakpoint
CREATE TABLE "steam_links" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"steam_id" text NOT NULL,
	"profile_url" text DEFAULT '' NOT NULL,
	"playtime_minutes" integer DEFAULT 0 NOT NULL,
	"playtime_public" boolean DEFAULT false NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "steam_links_steam_id_unique" UNIQUE("steam_id")
);
--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_profiles_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addressee_id_profiles_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_playtime" ADD CONSTRAINT "game_playtime_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steam_links" ADD CONSTRAINT "steam_links_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;