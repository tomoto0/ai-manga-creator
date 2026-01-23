ALTER TABLE `manga_panels` MODIFY COLUMN `dialoguePosition` enum('top','middle','bottom') DEFAULT 'bottom';--> statement-breakpoint
ALTER TABLE `manga_panels` ADD `bubbleShape` enum('round','square','jagged') DEFAULT 'round';--> statement-breakpoint
ALTER TABLE `manga_projects` ADD `layout` enum('2x2','2x3','3x2','1-column') DEFAULT '2x3';