CREATE TABLE `completed_manga` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`sourceNewsUrl` text NOT NULL,
	`finalImageUrl` text NOT NULL,
	`xPostId` varchar(100),
	`xSharedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `completed_manga_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `manga_panels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`panelNumber` int NOT NULL,
	`imagePrompt` text NOT NULL,
	`generatedImageUrl` text,
	`dialogueText` text,
	`dialoguePosition` varchar(50) DEFAULT 'top',
	`finalImageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manga_panels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `manga_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectTitle` varchar(255) NOT NULL,
	`sourceNewsUrl` text NOT NULL,
	`newsContent` text,
	`plotDescription` text,
	`status` enum('draft','in_progress','completed') NOT NULL DEFAULT 'draft',
	`styleSettings` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manga_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `xAccessToken` text;--> statement-breakpoint
ALTER TABLE `users` ADD `xRefreshToken` text;