
ALTER TABLE `bookings` ADD `timeslot_id` INT NULL 
ALTER TABLE `bookings` ADD `service_id` INT NOT NULL AFTER `timeslot_id`;

ALTER TABLE `sessions` ADD `session_title` VARCHAR(222) NULL DEFAULT NULL AFTER `updated_at`;

6-Feb
ALTER TABLE `reviews` ADD `session_id` INT NULL DEFAULT NULL AFTER `course_id`;
9-Feb

ALTER TABLE `sessions` CHANGE `status` `status` ENUM('scheduled','in_progress','completed','cancelled','no_show','live','ended') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE `wallet_transactions` ADD `meta` VARCHAR(255) NULL DEFAULT NULL AFTER `amount`;
ALTER TABLE `wallet_transactions` ADD `updated_at` TIMESTAMP on update CURRENT_TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `created_at`;
