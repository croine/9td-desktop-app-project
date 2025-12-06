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
  username: text("username").unique(),
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

// Advanced avatar system tables

export const achievements = sqliteTable('achievements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  badgeType: text('badge_type').notNull(),
  unlockCriteria: text('unlock_criteria', { mode: 'json' }).notNull(),
  points: integer('points').notNull().default(0),
  tier: text('tier').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const userAchievementsNew = sqliteTable('user_achievements_new', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  achievementId: integer('achievement_id')
    .notNull()
    .references(() => achievements.id, { onDelete: 'cascade' }),
  unlockedAt: integer('unlocked_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  displayed: integer('displayed', { mode: 'boolean' }).notNull().default(true),
  notified: integer('notified', { mode: 'boolean' }).notNull().default(false),
});

export const userStatusNew = sqliteTable('user_status_new', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('active'),
  autoDetect: integer('auto_detect', { mode: 'boolean' }).notNull().default(true),
  customMessage: text('custom_message'),
  lastActivity: integer('last_activity', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const avatarCustomization = sqliteTable('avatar_customization', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  cropSettings: text('crop_settings', { mode: 'json' }),
  filters: text('filters', { mode: 'json' }),
  borderEffect: text('border_effect').notNull().default('none'),
  borderColors: text('border_colors', { mode: 'json' }),
  effect3d: text('effect_3d', { mode: 'json' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const avatarGalleryNew = sqliteTable('avatar_gallery_new', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  imageUrl: text('image_url').notNull(),
  avatarType: text('avatar_type').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  settings: text('settings', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const avatarPresets = sqliteTable('avatar_presets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  presetType: text('preset_type').notNull(),
  category: text('category'),
  config: text('config', { mode: 'json' }).notNull(),
  previewUrl: text('preview_url'),
  isPremium: integer('is_premium', { mode: 'boolean' }).notNull().default(false),
});

export const userEffects = sqliteTable('user_effects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  moodIndicator: text('mood_indicator').notNull().default('none'),
  focusModeActive: integer('focus_mode_active', { mode: 'boolean' }).notNull().default(false),
  celebrationActive: integer('celebration_active', { mode: 'boolean' }).notNull().default(false),
  effectSettings: text('effect_settings', { mode: 'json' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const avatarFramesNew = sqliteTable('avatar_frames_new', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  frameType: text('frame_type').notNull(),
  styleConfig: text('style_config', { mode: 'json' }),
  unlockRequirement: text('unlock_requirement', { mode: 'json' }),
  isAnimated: integer('is_animated', { mode: 'boolean' }).notNull().default(false),
  previewUrl: text('preview_url'),
  season: text('season'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const userFrames = sqliteTable('user_frames', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  frameId: integer('frame_id')
    .notNull()
    .references(() => avatarFramesNew.id, { onDelete: 'cascade' }),
  unlockedAt: integer('unlocked_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
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

// Real-time messaging system tables

export const conversations = sqliteTable('conversations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  isGroup: integer('is_group', { mode: 'boolean' }).notNull().default(false),
  createdBy: text('created_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const conversationParticipants = sqliteTable('conversation_participants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  conversationId: integer('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  joinedAt: integer('joined_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  lastReadAt: integer('last_read_at', { mode: 'timestamp' }),
});

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  conversationId: integer('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: text('sender_id')
    .notNull()
    .references(() => user.id),
  content: text('content').notNull(),
  messageType: text('message_type').notNull().default('text'),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

// Add new tasks table
export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  priority: text('priority').notNull().default('medium'),
  status: text('status').notNull().default('todo'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  tags: text('tags', { mode: 'json' }),
  categories: text('categories', { mode: 'json' }),
  subtasks: text('subtasks', { mode: 'json' }),
  timeTracking: text('time_tracking', { mode: 'json' }),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Add task dependencies table
export const taskDependencies = sqliteTable('task_dependencies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  dependsOnTaskId: integer('depends_on_task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  dependencyType: text('dependency_type').notNull().default('blocks'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const taskAttachments = sqliteTable('task_attachments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  storagePath: text('storage_path').notNull(),
  storageBucket: text('storage_bucket').notNull().default('task-attachments'),
  downloadUrl: text('download_url'),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

// License key management table
export const licenseKeys = sqliteTable('license_keys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  status: text('status').notNull().default('pending'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  activatedAt: integer('activated_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const shouts = sqliteTable('shouts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
  isDeleted: integer('is_deleted', { mode: 'boolean' })
    .notNull()
    .default(false),
});