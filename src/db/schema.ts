import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';



// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const userPreferences = sqliteTable('user_preferences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  customTitle: text('custom_title').default('Account Secured'),
  showEmail: integer('show_email', { mode: 'boolean' }).default(false),
  blurEmail: integer('blur_email', { mode: 'boolean' }).default(false),
  avatarUrl: text('avatar_url'),
  avatarShape: text('avatar_shape').default('circle'),
  avatarColorScheme: text('avatar_color_scheme').default('gradient'),
  avatarBorderColor: text('avatar_border_color').default('#6366f1'),
  showPassword: integer('show_password', { mode: 'boolean' }).default(false),
  accountVisibility: text('account_visibility').default('private'),
  twoFactorEnabled: integer('two_factor_enabled', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Avatar gallery - multiple saved avatars per user
export const userAvatarGallery = sqliteTable('user_avatar_gallery', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url').notNull(),
  avatarShape: text('avatar_shape').notNull().default('circle'),
  avatarColorScheme: text('avatar_color_scheme').notNull().default('gradient'),
  avatarBorderColor: text('avatar_border_color').notNull().default('#6366f1'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

// User achievements tracking
export const userAchievements = sqliteTable('user_achievements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  achievementType: text('achievement_type').notNull(),
  unlockedAt: integer('unlocked_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  isDisplayed: integer('is_displayed', { mode: 'boolean' }).notNull().default(true),
});

// User activity status
export const userStatus = sqliteTable('user_status', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('active'),
  customMessage: text('custom_message'),
  autoDetect: integer('auto_detect', { mode: 'boolean' }).notNull().default(true),
  lastActivity: integer('last_activity', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

// User statistics for productivity tracking
export const userStats = sqliteTable('user_stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  tasksCompletedToday: integer('tasks_completed_today').notNull().default(0),
  tasksCompletedThisWeek: integer('tasks_completed_this_week').notNull().default(0),
  tasksCompletedAllTime: integer('tasks_completed_all_time').notNull().default(0),
  currentStreakDays: integer('current_streak_days').notNull().default(0),
  longestStreakDays: integer('longest_streak_days').notNull().default(0),
  lastTaskCompletion: integer('last_task_completion', { mode: 'timestamp' }),
  dailyGoal: integer('daily_goal').notNull().default(5),
  weeklyGoal: integer('weekly_goal').notNull().default(25),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Avatar frames/themes
export const avatarFrames = sqliteTable('avatar_frames', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  frameType: text('frame_type').notNull(),
  isUnlocked: integer('is_unlocked', { mode: 'boolean' }).notNull().default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  unlockedAt: integer('unlocked_at', { mode: 'timestamp' }),
});