import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_waters_feeding_feed_allowed" AS ENUM('voeder', 'leem', 'witte-maden', 'casters', 'rode-maden', 'muggenlarven', 'pieren', 'insecten', 'granen', 'mais', 'korrels', 'zinkers', 'drijvend', 'deeg', 'pasta', 'den-bol', 'aasvisjes');
  CREATE TYPE "public"."enum_waters_feeding_feed_forbidden" AS ENUM('voeder', 'leem', 'witte-maden', 'casters', 'rode-maden', 'muggenlarven', 'pieren', 'insecten', 'granen', 'mais', 'korrels', 'zinkers', 'drijvend', 'deeg', 'pasta', 'den-bol', 'aasvisjes');
  CREATE TYPE "public"."enum_waters_feeding_hook_allowed" AS ENUM('voeder', 'leem', 'witte-maden', 'casters', 'rode-maden', 'muggenlarven', 'pieren', 'insecten', 'granen', 'mais', 'korrels', 'zinkers', 'drijvend', 'deeg', 'pasta', 'den-bol', 'aasvisjes');
  CREATE TYPE "public"."enum_waters_feeding_hook_forbidden" AS ENUM('voeder', 'leem', 'witte-maden', 'casters', 'rode-maden', 'muggenlarven', 'pieren', 'insecten', 'granen', 'mais', 'korrels', 'zinkers', 'drijvend', 'deeg', 'pasta', 'den-bol', 'aasvisjes');
  CREATE TYPE "public"."enum_waters_feeding_limits_baits" AS ENUM('voeder', 'leem', 'witte-maden', 'casters', 'rode-maden', 'muggenlarven', 'pieren', 'insecten', 'granen', 'mais', 'korrels', 'zinkers', 'drijvend', 'deeg', 'pasta', 'den-bol', 'aasvisjes');
  CREATE TYPE "public"."enum_waters_feeding_shallow" AS ENUM('ja', 'nee');
  CREATE TYPE "public"."enum_site_settings_feed_rules_applies_to" AS ENUM('all', 'continuous', 'twoPart');
  CREATE TABLE "waters_feeding_feed_allowed" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_waters_feeding_feed_allowed",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "waters_feeding_feed_forbidden" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_waters_feeding_feed_forbidden",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "waters_feeding_hook_allowed" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_waters_feeding_hook_allowed",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "waters_feeding_hook_forbidden" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_waters_feeding_hook_forbidden",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "waters_feeding_limits_baits" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_waters_feeding_limits_baits",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "waters_feeding_limits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"amount" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_feed_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"applies_to" "enum_site_settings_feed_rules_applies_to" DEFAULT 'all'
  );
  
  ALTER TABLE "competitions" ADD COLUMN "break_start" varchar;
  ALTER TABLE "competitions" ADD COLUMN "break_end" varchar;
  ALTER TABLE "waters" ADD COLUMN "feeding_shallow" "enum_waters_feeding_shallow";
  ALTER TABLE "waters" ADD COLUMN "feeding_club_keepnet" boolean;
  ALTER TABLE "waters" ADD COLUMN "feeding_club_pellets" boolean;
  ALTER TABLE "waters" ADD COLUMN "feeding_note" varchar;
  ALTER TABLE "waters_feeding_feed_allowed" ADD CONSTRAINT "waters_feeding_feed_allowed_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."waters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "waters_feeding_feed_forbidden" ADD CONSTRAINT "waters_feeding_feed_forbidden_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."waters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "waters_feeding_hook_allowed" ADD CONSTRAINT "waters_feeding_hook_allowed_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."waters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "waters_feeding_hook_forbidden" ADD CONSTRAINT "waters_feeding_hook_forbidden_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."waters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "waters_feeding_limits_baits" ADD CONSTRAINT "waters_feeding_limits_baits_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."waters_feeding_limits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "waters_feeding_limits" ADD CONSTRAINT "waters_feeding_limits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."waters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_feed_rules" ADD CONSTRAINT "site_settings_feed_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "waters_feeding_feed_allowed_order_idx" ON "waters_feeding_feed_allowed" USING btree ("order");
  CREATE INDEX "waters_feeding_feed_allowed_parent_idx" ON "waters_feeding_feed_allowed" USING btree ("parent_id");
  CREATE INDEX "waters_feeding_feed_forbidden_order_idx" ON "waters_feeding_feed_forbidden" USING btree ("order");
  CREATE INDEX "waters_feeding_feed_forbidden_parent_idx" ON "waters_feeding_feed_forbidden" USING btree ("parent_id");
  CREATE INDEX "waters_feeding_hook_allowed_order_idx" ON "waters_feeding_hook_allowed" USING btree ("order");
  CREATE INDEX "waters_feeding_hook_allowed_parent_idx" ON "waters_feeding_hook_allowed" USING btree ("parent_id");
  CREATE INDEX "waters_feeding_hook_forbidden_order_idx" ON "waters_feeding_hook_forbidden" USING btree ("order");
  CREATE INDEX "waters_feeding_hook_forbidden_parent_idx" ON "waters_feeding_hook_forbidden" USING btree ("parent_id");
  CREATE INDEX "waters_feeding_limits_baits_order_idx" ON "waters_feeding_limits_baits" USING btree ("order");
  CREATE INDEX "waters_feeding_limits_baits_parent_idx" ON "waters_feeding_limits_baits" USING btree ("parent_id");
  CREATE INDEX "waters_feeding_limits_order_idx" ON "waters_feeding_limits" USING btree ("_order");
  CREATE INDEX "waters_feeding_limits_parent_id_idx" ON "waters_feeding_limits" USING btree ("_parent_id");
  CREATE INDEX "site_settings_feed_rules_order_idx" ON "site_settings_feed_rules" USING btree ("_order");
  CREATE INDEX "site_settings_feed_rules_parent_id_idx" ON "site_settings_feed_rules" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "waters_feeding_feed_allowed" CASCADE;
  DROP TABLE "waters_feeding_feed_forbidden" CASCADE;
  DROP TABLE "waters_feeding_hook_allowed" CASCADE;
  DROP TABLE "waters_feeding_hook_forbidden" CASCADE;
  DROP TABLE "waters_feeding_limits_baits" CASCADE;
  DROP TABLE "waters_feeding_limits" CASCADE;
  DROP TABLE "site_settings_feed_rules" CASCADE;
  ALTER TABLE "competitions" DROP COLUMN "break_start";
  ALTER TABLE "competitions" DROP COLUMN "break_end";
  ALTER TABLE "waters" DROP COLUMN "feeding_shallow";
  ALTER TABLE "waters" DROP COLUMN "feeding_club_keepnet";
  ALTER TABLE "waters" DROP COLUMN "feeding_club_pellets";
  ALTER TABLE "waters" DROP COLUMN "feeding_note";
  DROP TYPE "public"."enum_waters_feeding_feed_allowed";
  DROP TYPE "public"."enum_waters_feeding_feed_forbidden";
  DROP TYPE "public"."enum_waters_feeding_hook_allowed";
  DROP TYPE "public"."enum_waters_feeding_hook_forbidden";
  DROP TYPE "public"."enum_waters_feeding_limits_baits";
  DROP TYPE "public"."enum_waters_feeding_shallow";
  DROP TYPE "public"."enum_site_settings_feed_rules_applies_to";`)
}
