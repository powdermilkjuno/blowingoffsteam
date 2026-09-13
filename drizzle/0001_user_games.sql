CREATE TABLE "user_games" (
	"steam_id" text NOT NULL,
	"app_id" integer NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"playtime_forever" integer DEFAULT 0 NOT NULL,
	"playtime_two_weeks" integer DEFAULT 0 NOT NULL,
	"last_played_at" integer,
	"icon_hash" text DEFAULT '' NOT NULL,
	CONSTRAINT "user_games_steam_id_app_id_pk" PRIMARY KEY("steam_id","app_id")
);
--> statement-breakpoint
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_steam_id_users_steam_id_fk" FOREIGN KEY ("steam_id") REFERENCES "public"."users"("steam_id") ON DELETE cascade ON UPDATE no action;