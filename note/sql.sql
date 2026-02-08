
ALTER TABLE `bookings` ADD `timeslot_id` INT NULL 
ALTER TABLE `bookings` ADD `service_id` INT NOT NULL AFTER `timeslot_id`;

ALTER TABLE `sessions` ADD `session_title` VARCHAR(222) NULL DEFAULT NULL AFTER `updated_at`;

6-Feb
ALTER TABLE `reviews` ADD `session_id` INT NULL DEFAULT NULL AFTER `course_id`;
