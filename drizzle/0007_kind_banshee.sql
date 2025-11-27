CREATE TABLE `task_attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`storage_path` text NOT NULL,
	`storage_bucket` text DEFAULT 'task-attachments' NOT NULL,
	`download_url` text,
	`uploaded_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
