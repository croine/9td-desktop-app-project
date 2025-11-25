CREATE TABLE `avatar_frames` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`frame_type` text NOT NULL,
	`is_unlocked` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`unlocked_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`achievement_type` text NOT NULL,
	`unlocked_at` integer NOT NULL,
	`is_displayed` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_avatar_gallery` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`avatar_url` text NOT NULL,
	`avatar_shape` text DEFAULT 'circle' NOT NULL,
	`avatar_color_scheme` text DEFAULT 'gradient' NOT NULL,
	`avatar_border_color` text DEFAULT '#6366f1' NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`tasks_completed_today` integer DEFAULT 0 NOT NULL,
	`tasks_completed_this_week` integer DEFAULT 0 NOT NULL,
	`tasks_completed_all_time` integer DEFAULT 0 NOT NULL,
	`current_streak_days` integer DEFAULT 0 NOT NULL,
	`longest_streak_days` integer DEFAULT 0 NOT NULL,
	`last_task_completion` integer,
	`daily_goal` integer DEFAULT 5 NOT NULL,
	`weekly_goal` integer DEFAULT 25 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_stats_user_id_unique` ON `user_stats` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_status` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`custom_message` text,
	`auto_detect` integer DEFAULT true NOT NULL,
	`last_activity` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_status_user_id_unique` ON `user_status` (`user_id`);