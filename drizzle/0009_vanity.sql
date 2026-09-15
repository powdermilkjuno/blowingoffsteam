ALTER TABLE "profiles" ADD COLUMN "equipped_name_color" text DEFAULT 'name:default' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "equipped_backdrop" text DEFAULT 'backdrop:none' NOT NULL;
