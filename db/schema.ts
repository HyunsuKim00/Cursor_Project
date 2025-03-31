import { pgTable, serial, text, varchar, timestamp, integer, pgEnum, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 게시판 종류 enum 설정
export const boardCategoryEnum = pgEnum('board_category', ['new', 'hot', 'best']);

// 사용자 테이블
export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(), // Clerk에서 제공하는 ID 사용
  username: varchar('username', { length: 50 }).notNull(),
  nickname: varchar('nickname', { length: 50 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 게시글 테이블
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  authorId: varchar('author_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  imageUrl: varchar('image_url', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  likesCount: integer('likes_count').default(0).notNull(),
  category: boardCategoryEnum('category').default('new').notNull(),
});

// 게시글 관계 설정
export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  likes: many(postLikes),
  scraps: many(postScraps),
}));

// 댓글 테이블
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  authorId: varchar('author_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  likesCount: integer('likes_count').default(0).notNull(),
});

// 댓글 관계 설정
export const commentsRelations = relations(comments, ({ one, many }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  likes: many(commentLikes),
}));

// 게시글 좋아요 테이블
export const postLikes = pgTable('post_likes', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    userPostUnique: unique().on(table.userId, table.postId), // 사용자당 한 번만 좋아요 가능
  }
});

// 게시글 좋아요 관계 설정
export const postLikesRelations = relations(postLikes, ({ one }) => ({
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
}));

// 댓글 좋아요 테이블
export const commentLikes = pgTable('comment_likes', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  commentId: integer('comment_id').notNull().references(() => comments.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    userCommentUnique: unique().on(table.userId, table.commentId), // 사용자당 한 번만 좋아요 가능
  }
});

// 댓글 좋아요 관계 설정
export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  user: one(users, {
    fields: [commentLikes.userId],
    references: [users.id],
  }),
  comment: one(comments, {
    fields: [commentLikes.commentId],
    references: [comments.id],
  }),
}));

// 게시글 스크랩 테이블
export const postScraps = pgTable('post_scraps', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    userPostUnique: unique().on(table.userId, table.postId), // 사용자당 한 번만 스크랩 가능
  }
});

// 게시글 스크랩 관계 설정
export const postScrapsRelations = relations(postScraps, ({ one }) => ({
  user: one(users, {
    fields: [postScraps.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [postScraps.postId],
    references: [posts.id],
  }),
}));

// 사용자 관계 설정
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  postLikes: many(postLikes),
  commentLikes: many(commentLikes),
  postScraps: many(postScraps),
}));
