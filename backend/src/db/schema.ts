import { relations, type InferSelectModel, sql } from 'drizzle-orm';
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const shareTypeEnum = pgEnum('share_type', ['ONE_TIME', 'TIME_BASED']);
export const accessTypeEnum = pgEnum('access_type', ['PUBLIC', 'PASSWORD']);

export const users = pgTable('users', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
});

export const notes = pgTable(
  'notes',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIndex: index('notes_user_id_idx').on(table.userId),
  }),
);

export const shareLinks = pgTable(
  'share_links',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    shareType: shareTypeEnum('share_type').notNull(),
    accessType: accessTypeEnum('access_type').notNull(),
    passwordHash: text('password_hash'),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
    consumedAt: timestamp('consumed_at', { withTimezone: true, mode: 'date' }),
    viewCount: integer('view_count').notNull().default(0),
    failedAttempts: integer('failed_attempts').notNull().default(0),
    lastFailedAttemptAt: timestamp('last_failed_attempt_at', {
      withTimezone: true,
      mode: 'date',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    noteIdIndex: index('share_links_note_id_idx').on(table.noteId),
    tokenHashIndex: index('share_links_token_hash_idx').on(table.tokenHash),
    tokenHashUnique: uniqueIndex('share_links_token_hash_unique').on(table.tokenHash),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  owner: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  shareLinks: many(shareLinks),
}));

export const shareLinksRelations = relations(shareLinks, ({ one }) => ({
  note: one(notes, {
    fields: [shareLinks.noteId],
    references: [notes.id],
  }),
}));

export type User = InferSelectModel<typeof users>;
export type Note = InferSelectModel<typeof notes>;
export type ShareLink = InferSelectModel<typeof shareLinks>;