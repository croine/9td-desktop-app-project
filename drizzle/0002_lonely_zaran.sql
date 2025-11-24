ALTER TABLE `user_preferences` ADD `avatar_url` text;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `avatar_shape` text DEFAULT 'circle';--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `avatar_color_scheme` text DEFAULT 'gradient';--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `avatar_border_color` text DEFAULT '#6366f1';--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `show_password` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `account_visibility` text DEFAULT 'private';--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `two_factor_enabled` integer DEFAULT false;