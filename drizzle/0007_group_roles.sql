ALTER TABLE "group_members" DROP CONSTRAINT "group_members_role";--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_role" CHECK ("role" in ('owner', 'co_owner', 'member'));--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "accent" text DEFAULT 'clay' NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_accent" CHECK ("accent" in ('clay', 'fern', 'signal', 'moss', 'paper'));
