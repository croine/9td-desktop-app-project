CREATE TABLE `message_mentions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shout_id` integer NOT NULL,
	`mentioned_user_id` text NOT NULL,
	`mentioned_by_user_id` text NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`shout_id`) REFERENCES `shouts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mentioned_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mentioned_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `message_reactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shout_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`emoji` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`shout_id`) REFERENCES `shouts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `shouts` ADD `reply_to_id` integer REFERENCES shouts(id);--> statement-breakpoint
ALTER TABLE `shouts` ADD `edited_at` integer;--> statement-breakpoint
ALTER TABLE `shouts` ADD `attachment_url` text;--> statement-breakpoint
ALTER TABLE `shouts` ADD `attachment_type` text;--> statement-breakpoint
ALTER TABLE `shouts` ADD `attachment_name` text;