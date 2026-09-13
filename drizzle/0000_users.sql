CREATE TABLE "users" (
	"steam_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text DEFAULT '' NOT NULL,
	"playtime_minutes" integer DEFAULT 0 NOT NULL,
	"playtime_public" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
