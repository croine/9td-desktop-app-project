CREATE TABLE `link_previews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shout_id` integer NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`description` text,
	`image_url` text,
	`site_name` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`shout_id`) REFERENCES `shouts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pinned_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shout_id` integer NOT NULL,
	`pinned_by` text NOT NULL,
	`pinned_at` integer NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`shout_id`) REFERENCES `shouts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pinned_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pinned_messages_shout_id_unique` ON `pinned_messages` (`shout_id`);--> statement-breakpoint
ALTER TABLE `shouts` ADD `gif_url` text;--> statement-breakpoint
ALTER TABLE `shouts` ADD `gif_title` text;--> statement-breakpoint
ALTER TABLE `shouts` ADD `gif_provider` text;--> statement-breakpoint
ALTER TABLE `shouts` ADD `voice_message_url` text;--> statement-breakpoint
ALTER TABLE `shouts` ADD `voice_message_duration` integer;--> statement-breakpoint
ALTER TABLE `shouts` ADD `voice_message_waveform` text;--> statement-breakpoint
ALTER TABLE `user_status` ADD `presence_mode` text DEFAULT 'online' NOT NULL;