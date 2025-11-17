import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const runs = pgTable("runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  liAtHash: text("li_at_hash").notNull(),
  postUrl: text("post_url").notNull(),
  phantomAgentId: text("phantom_agent_id").notNull(),
  containerId: text("container_id"),
  status: text("status").notNull(), // "running", "finished", "error"
  totalUrls: integer("total_urls").default(0),
  rawOutput: text("raw_output"),
});

export const likers = pgTable("likers", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id").notNull().references(() => runs.id, { onDelete: "cascade" }),
  profileUrl: text("profile_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const runsRelations = relations(runs, ({ many }) => ({
  likers: many(likers),
}));

export const likersRelations = relations(likers, ({ one }) => ({
  run: one(runs, {
    fields: [likers.runId],
    references: [runs.id],
  }),
}));

