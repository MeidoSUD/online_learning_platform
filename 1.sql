-- إضافة حساب الأب في جدول users
INSERT INTO `users` (`id`, `user_id`, `username`, `password`, `childs`, `role`, `lang_id`, `currency_id`, `verification_code`, `is_active`, `created_at`, `updated_at`, `token`)
VALUES (4, 1, 'parent', '22222222', '1', 'parent', 1, 0, '', 'yes', NOW(), CURDATE(), NULL);

-- ربط الأب بالطالب في جدول students (افتراضاً أن الطالب التجريبي student_id = 1)
UPDATE `students` SET `parent_id` = 4 WHERE `id` = 1;

-- Insert staff demo accounts
INSERT INTO `staff` (`employee_id`, `lang_id`, `qualification`, `work_exp`, `name`, `surname`, `father_name`, `mother_name`, `contact_no`, `emergency_contact_no`, `email`, `dob`, `marital_status`, `local_address`, `permanent_address`, `note`, `image`, `password`, `gender`, `account_title`, `bank_account_no`, `bank_name`, `ifsc_code`, `bank_branch`, `payscale`, `epf_no`, `contract_type`, `shift`, `location`, `facebook`, `twitter`, `linkedin`, `instagram`, `resume`, `joining_letter`, `resignation_letter`, `other_document_name`, `other_document_file`, `user_id`, `is_active`, `verification_code`) VALUES
('DEMO-SADMIN', 1, '', '', 'Super Admin', '', '', '', '0000000000', '0000000000', 'superadmin@gmail.com', '2000-01-01', '', '', '', '', '', '$2y$10$cYOMp8Z2A6umBWGaPrM2xe.D9QD.TpGj8RVclrc8pbp/WMAOOPTu6', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 0, 1, ''),
('DEMO-ADMIN', 1, '', '', 'William', '', '', '', '0000000000', '0000000000', 'william@gmail.com', '2000-01-01', '', '', '', '', '', '$2y$10$cYOMp8Z2A6umBWGaPrM2xe.D9QD.TpGj8RVclrc8pbp/WMAOOPTu6', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 0, 1, ''),
('DEMO-TEACHER', 1, '', '', 'Jason', '', '', '', '0000000000', '0000000000', 'jason@gmail.com', '2000-01-01', '', '', '', '', '', '$2y$10$cYOMp8Z2A6umBWGaPrM2xe.D9QD.TpGj8RVclrc8pbp/WMAOOPTu6', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 0, 1, ''),
('DEMO-ACCOUNTANT', 1, '', '', 'James Deckar', '', '', '', '0000000000', '0000000000', 'james.deckar@gmail.com', '2000-01-01', '', '', '', '', '', '$2y$10$cYOMp8Z2A6umBWGaPrM2xe.D9QD.TpGj8RVclrc8pbp/WMAOOPTu6', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 0, 1, ''),
('DEMO-RECEPTION', 1, '', '', 'Maria Ford', '', '', '', '0000000000', '0000000000', 'maria.ford@gmail.com', '2000-01-01', '', '', '', '', '', '$2y$10$cYOMp8Z2A6umBWGaPrM2xe.D9QD.TpGj8RVclrc8pbp/WMAOOPTu6', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 0, 1, ''),
('DEMO-LIBRARIAN', 1, '', '', 'Brandon', '', '', '', '0000000000', '0000000000', 'brandon@gmail.com', '2000-01-01', '', '', '', '', '', '$2y$10$cYOMp8Z2A6umBWGaPrM2xe.D9QD.TpGj8RVclrc8pbp/WMAOOPTu6', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 0, 1, '');

-- Link staff to roles (roles: 7=Super Admin, 1=Admin, 2=Teacher, 3=Accountant, 6=Receptionist, 4=Librarian)
INSERT INTO `staff_roles` (`role_id`, `staff_id`, `is_active`) VALUES
(7, (SELECT id FROM staff WHERE email='superadmin@gmail.com'), 1),
(1, (SELECT id FROM staff WHERE email='william@gmail.com'), 1),
(2, (SELECT id FROM staff WHERE email='jason@gmail.com'), 1),
(3, (SELECT id FROM staff WHERE email='james.deckar@gmail.com'), 1),
(6, (SELECT id FROM staff WHERE email='maria.ford@gmail.com'), 1),
(4, (SELECT id FROM staff WHERE email='brandon@gmail.com'), 1);