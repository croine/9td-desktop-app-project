CREATE TABLE `achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`badge_type` text NOT NULL,
	`unlock_criteria` text NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`tier` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `achievements_name_unique` ON `achievements` (`name`);--> statement-breakpoint
CREATE TABLE `avatar_customization` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`crop_settings` text,
	`filters` text,
	`border_effect` text DEFAULT 'none' NOT NULL,
	`border_colors` text,
	`effect_3d` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `avatar_customization_user_id_unique` ON `avatar_customization` (`user_id`);--> statement-breakpoint
CREATE TABLE `avatar_frames_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`frame_type` text NOT NULL,
	`style_config` text,
	`unlock_requirement` text,
	`is_animated` integer DEFAULT false NOT NULL,
	`preview_url` text,
	`season` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `avatar_frames_new_name_unique` ON `avatar_frames_new` (`name`);--> statement-breakpoint
CREATE TABLE `avatar_gallery_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`image_url` text NOT NULL,
	`avatar_type` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`settings` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `avatar_presets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`preset_type` text NOT NULL,
	`category` text,
	`config` text NOT NULL,
	`preview_url` text,
	`is_premium` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `avatar_presets_name_unique` ON `avatar_presets` (`name`);--> statement-breakpoint
CREATE TABLE `user_achievements_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`achievement_id` integer NOT NULL,
	`unlocked_at` integer NOT NULL,
	`displayed` integer DEFAULT true NOT NULL,
	`notified` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_effects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`mood_indicator` text DEFAULT 'none' NOT NULL,
	`focus_mode_active` integer DEFAULT false NOT NULL,
	`celebration_active` integer DEFAULT false NOT NULL,
	`effect_settings` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_effects_user_id_unique` ON `user_effects` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_frames` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`frame_id` integer NOT NULL,
	`unlocked_at` integer NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`frame_id`) REFERENCES `avatar_frames_new`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_status_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`auto_detect` integer DEFAULT true NOT NULL,
	`custom_message` text,
	`last_activity` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_status_new_user_id_unique` ON `user_status_new` (`user_id`);