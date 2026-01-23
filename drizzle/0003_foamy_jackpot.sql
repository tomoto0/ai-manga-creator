CREATE TABLE `manga_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`thumbnailUrl` text,
	`styleSettings` text,
	`layout` enum('2x2','2x3','3x2','1-column') DEFAULT '2x3',
	`panelCount` int DEFAULT 4,
	`defaultBubbleShape` enum('round','square','jagged') DEFAULT 'round',
	`defaultDialoguePosition` enum('top','middle','bottom') DEFAULT 'bottom',
	`samplePrompts` text,
	`isPublic` boolean DEFAULT false,
	`usageCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manga_templates_id` PRIMARY KEY(`id`)
);
