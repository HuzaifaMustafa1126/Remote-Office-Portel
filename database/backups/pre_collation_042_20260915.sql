-- MySQL dump 10.13  Distrib 9.7.1, for macos14.8 (x86_64)
--
-- Host: localhost    Database: remote_office_portal
-- ------------------------------------------------------
-- Server version	9.7.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '0e7a805a-81ff-11f1-abe9-2d18f16f5971:1-5837';

--
-- Table structure for table `attendance_breaks`
--

DROP TABLE IF EXISTS `attendance_breaks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_breaks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `attendance_id` bigint unsigned NOT NULL,
  `paused_task_id` bigint unsigned DEFAULT NULL,
  `break_start_at` timestamp NOT NULL,
  `break_end_at` timestamp NULL DEFAULT NULL,
  `duration_minutes` int unsigned NOT NULL DEFAULT '0',
  `status` enum('ACTIVE','COMPLETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_breaks_attendance_status` (`attendance_id`,`status`),
  KEY `idx_breaks_started` (`break_start_at`),
  KEY `idx_attendance_break_paused_task` (`paused_task_id`),
  CONSTRAINT `fk_attendance_break_paused_task` FOREIGN KEY (`paused_task_id`) REFERENCES `tasks` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attendance_break_record` FOREIGN KEY (`attendance_id`) REFERENCES `attendance_records` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_breaks`
--

LOCK TABLES `attendance_breaks` WRITE;
/*!40000 ALTER TABLE `attendance_breaks` DISABLE KEYS */;
INSERT INTO `attendance_breaks` VALUES (1,1,NULL,'2026-08-26 11:31:14','2026-08-26 11:31:14',0,'COMPLETED','2026-08-26 11:31:14','2026-08-26 11:31:14'),(2,1,NULL,'2026-08-26 11:31:14','2026-08-26 11:31:14',0,'COMPLETED','2026-08-26 11:31:14','2026-08-26 11:31:14'),(3,2,NULL,'2026-08-26 11:35:53','2026-08-26 11:36:12',0,'COMPLETED','2026-08-26 11:35:53','2026-08-26 11:36:12'),(4,7,NULL,'2026-08-27 05:51:20','2026-08-27 05:51:34',0,'COMPLETED','2026-08-27 05:51:20','2026-08-27 05:51:34'),(5,8,NULL,'2026-08-27 17:17:14','2026-08-27 17:17:27',0,'COMPLETED','2026-08-27 17:17:14','2026-08-27 17:17:27'),(6,9,NULL,'2026-08-28 17:07:58','2026-08-28 17:08:01',0,'COMPLETED','2026-08-28 17:07:58','2026-08-28 17:08:01'),(7,10,NULL,'2026-08-28 17:33:00','2026-08-28 17:35:38',2,'COMPLETED','2026-08-28 17:33:00','2026-08-28 17:35:38'),(8,11,NULL,'2026-08-29 06:26:01','2026-08-29 06:26:03',0,'COMPLETED','2026-08-29 06:26:01','2026-08-29 06:26:03'),(9,12,NULL,'2026-09-01 16:00:46','2026-09-01 16:01:02',0,'COMPLETED','2026-09-01 16:00:46','2026-09-01 16:01:02'),(10,13,NULL,'2026-09-07 16:43:21','2026-09-07 16:43:25',0,'COMPLETED','2026-09-07 16:43:21','2026-09-07 16:43:25'),(11,15,NULL,'2026-09-08 15:10:50','2026-09-08 15:11:06',0,'COMPLETED','2026-09-08 15:10:50','2026-09-08 15:11:06'),(12,15,NULL,'2026-09-08 15:11:10','2026-09-08 15:11:11',0,'COMPLETED','2026-09-08 15:11:10','2026-09-08 15:11:11'),(13,19,NULL,'2026-09-09 16:10:21','2026-09-09 16:10:24',0,'COMPLETED','2026-09-09 16:10:21','2026-09-09 16:10:24'),(14,21,NULL,'2026-09-10 15:27:48','2026-09-10 15:28:04',0,'COMPLETED','2026-09-10 15:27:48','2026-09-10 15:28:04');
/*!40000 ALTER TABLE `attendance_breaks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_late_events`
--

DROP TABLE IF EXISTS `attendance_late_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_late_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `attendance_id` bigint unsigned NOT NULL,
  `counter_id` bigint unsigned NOT NULL,
  `policy_id` bigint unsigned NOT NULL,
  `count_after` int unsigned NOT NULL,
  `converted_instances` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `attendance_id` (`attendance_id`),
  KEY `counter_id` (`counter_id`),
  KEY `policy_id` (`policy_id`),
  CONSTRAINT `attendance_late_events_ibfk_1` FOREIGN KEY (`attendance_id`) REFERENCES `attendance_records` (`id`),
  CONSTRAINT `attendance_late_events_ibfk_2` FOREIGN KEY (`counter_id`) REFERENCES `employee_late_counters` (`id`),
  CONSTRAINT `attendance_late_events_ibfk_3` FOREIGN KEY (`policy_id`) REFERENCES `attendance_policies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_late_events`
--

LOCK TABLES `attendance_late_events` WRITE;
/*!40000 ALTER TABLE `attendance_late_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_late_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_penalties`
--

DROP TABLE IF EXISTS `attendance_penalties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_penalties` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `attendance_id` bigint unsigned NOT NULL,
  `penalty_type` enum('FULL_DAY_LEAVE','HALF_DAY','SALARY_DEDUCTION') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(8,2) NOT NULL,
  `salary_days` decimal(10,4) NOT NULL,
  `deduction_amount` decimal(12,2) DEFAULT NULL,
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source` enum('HALF_DAY_ARRIVAL','LATE_ACCUMULATION') COLLATE utf8mb4_unicode_ci NOT NULL,
  `adjustment_type` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ATTENDANCE_PENALTY',
  `policy_id` bigint unsigned NOT NULL,
  `policy_snapshot` json NOT NULL,
  `status` enum('ACTIVE','WAIVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `waived_by` bigint unsigned DEFAULT NULL,
  `waived_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `waived_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_attendance_penalty` (`attendance_id`,`source`),
  KEY `idx_penalty_employee` (`employee_id`,`status`),
  KEY `policy_id` (`policy_id`),
  KEY `waived_by` (`waived_by`),
  CONSTRAINT `attendance_penalties_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `attendance_penalties_ibfk_2` FOREIGN KEY (`attendance_id`) REFERENCES `attendance_records` (`id`),
  CONSTRAINT `attendance_penalties_ibfk_3` FOREIGN KEY (`policy_id`) REFERENCES `attendance_policies` (`id`),
  CONSTRAINT `attendance_penalties_ibfk_4` FOREIGN KEY (`waived_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_penalties`
--

LOCK TABLES `attendance_penalties` WRITE;
/*!40000 ALTER TABLE `attendance_penalties` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_penalties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_policies`
--

DROP TABLE IF EXISTS `attendance_policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_policies` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope_type` enum('COMPANY','DEPARTMENT','SHIFT','EMPLOYEE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COMPANY',
  `scope_id` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `late_rule_enabled` tinyint(1) NOT NULL,
  `grace_minutes` int unsigned NOT NULL,
  `late_accumulation_enabled` tinyint(1) NOT NULL,
  `late_instances_required` int unsigned NOT NULL,
  `late_penalty_type` enum('FULL_DAY_LEAVE','HALF_DAY','SALARY_DEDUCTION','NO_PENALTY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `late_penalty_quantity` decimal(8,2) NOT NULL,
  `half_day_rule_enabled` tinyint(1) NOT NULL,
  `half_day_after_minutes` int unsigned NOT NULL,
  `half_day_salary_deduction_percent` decimal(5,2) NOT NULL,
  `count_half_day_as_late` tinyint(1) NOT NULL,
  `late_counter_period` enum('MONTHLY','PAYROLL_CYCLE','CALENDAR_MONTH','NEVER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_policy_version` (`scope_type`,`scope_id`,`effective_from`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `attendance_policies_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `attendance_policies_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `attendance_policies_chk_1` CHECK ((`late_instances_required` > 0)),
  CONSTRAINT `attendance_policies_chk_2` CHECK ((`half_day_salary_deduction_percent` between 0 and 100)),
  CONSTRAINT `attendance_policies_chk_3` CHECK ((`late_penalty_quantity` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_policies`
--

LOCK TABLES `attendance_policies` WRITE;
/*!40000 ALTER TABLE `attendance_policies` DISABLE KEYS */;
INSERT INTO `attendance_policies` VALUES (1,'Company Default','COMPANY','',1,15,1,3,'FULL_DAY_LEAVE',1.00,1,120,50.00,0,'PAYROLL_CYCLE','2000-01-01',NULL,1,NULL,NULL,'2026-09-07 15:59:25','2026-09-07 15:59:25');
/*!40000 ALTER TABLE `attendance_policies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_records`
--

DROP TABLE IF EXISTS `attendance_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `attendance_date` date NOT NULL,
  `work_date` date NOT NULL,
  `shift_id` bigint unsigned DEFAULT NULL,
  `scheduled_clock_in` datetime DEFAULT NULL,
  `scheduled_clock_out` datetime DEFAULT NULL,
  `grace_minutes` smallint unsigned DEFAULT NULL,
  `required_work_minutes` smallint unsigned DEFAULT NULL,
  `break_allowance_minutes` smallint unsigned DEFAULT NULL,
  `arrival_status` enum('ON_TIME','LATE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `late_minutes` smallint unsigned NOT NULL DEFAULT '0',
  `clock_in_at` timestamp NULL DEFAULT NULL,
  `clock_out_at` timestamp NULL DEFAULT NULL,
  `total_break_minutes` int unsigned NOT NULL DEFAULT '0',
  `total_work_minutes` int unsigned NOT NULL DEFAULT '0',
  `short_minutes` smallint unsigned NOT NULL DEFAULT '0',
  `extra_minutes` smallint unsigned NOT NULL DEFAULT '0',
  `break_exceeded_minutes` smallint unsigned NOT NULL DEFAULT '0',
  `status` enum('WORKING','ON_BREAK','CLOCKED_OUT','ABSENT','LEAVE','OFF_DAY','WORKED_HOLIDAY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WORKING',
  `day_status` enum('PRESENT','LATE','ABSENT','HALF_DAY','LEAVE','OFF_DAY','HOLIDAY','WEEKLY_OFF','WORKED_HOLIDAY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PRESENT',
  `reconciliation_status` enum('NORMAL','OPEN_SHIFT','CORRECTED','HISTORICAL_REVIEW') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NORMAL',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `policy_id` bigint unsigned DEFAULT NULL,
  `policy_snapshot` json DEFAULT NULL,
  `actual_late_minutes` decimal(10,2) DEFAULT NULL,
  `chargeable_late_minutes` decimal(10,2) DEFAULT NULL,
  `policy_processed_at` datetime DEFAULT NULL,
  `policy_finalized_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_attendance_employee_date` (`employee_id`,`attendance_date`),
  KEY `idx_attendance_date_status` (`attendance_date`,`status`),
  KEY `idx_attendance_employee_clock_in` (`employee_id`,`clock_in_at`),
  KEY `idx_attendance_work_date` (`employee_id`,`work_date`),
  KEY `fk_attendance_shift` (`shift_id`),
  KEY `fk_attendance_policy` (`policy_id`),
  CONSTRAINT `fk_attendance_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_attendance_policy` FOREIGN KEY (`policy_id`) REFERENCES `attendance_policies` (`id`),
  CONSTRAINT `fk_attendance_shift` FOREIGN KEY (`shift_id`) REFERENCES `work_shifts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_records`
--

LOCK TABLES `attendance_records` WRITE;
/*!40000 ALTER TABLE `attendance_records` DISABLE KEYS */;
INSERT INTO `attendance_records` VALUES (1,2,'2026-08-26','2026-08-26',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-08-26 11:31:14','2026-08-26 11:31:14',0,0,0,0,0,'CLOCKED_OUT','PRESENT','NORMAL','2026-08-26 11:31:14','2026-08-27 17:16:55',NULL,NULL,NULL,NULL,NULL,NULL),(2,3,'2026-08-26','2026-08-26',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-08-26 11:35:15','2026-08-26 11:36:15',0,1,0,0,0,'CLOCKED_OUT','PRESENT','NORMAL','2026-08-26 11:35:15','2026-08-27 17:16:55',NULL,NULL,NULL,NULL,NULL,NULL),(5,3,'2026-08-25','2026-08-25',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,0,0,0,0,'ABSENT','ABSENT','NORMAL','2026-08-26 12:11:56','2026-08-27 17:16:55',NULL,NULL,NULL,NULL,NULL,NULL),(7,3,'2026-08-27','2026-08-27',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-08-27 05:51:09','2026-08-27 05:51:36',0,0,0,0,0,'CLOCKED_OUT','PRESENT','NORMAL','2026-08-27 05:51:09','2026-08-27 17:16:55',NULL,NULL,NULL,NULL,NULL,NULL),(8,7,'2026-08-27','2026-08-27',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-08-27 16:49:38','2026-08-27 17:17:31',0,27,0,27,0,'CLOCKED_OUT','PRESENT','NORMAL','2026-08-27 16:49:38','2026-08-27 17:17:31',NULL,NULL,NULL,NULL,NULL,NULL),(9,7,'2026-08-28','2026-08-28',1,'2026-08-28 18:00:00','2026-08-29 01:30:00',15,360,0,'LATE',223,'2026-08-28 16:58:11','2026-08-28 17:08:03',0,9,351,0,0,'CLOCKED_OUT','PRESENT','NORMAL','2026-08-28 16:58:11','2026-08-28 17:08:03',NULL,NULL,NULL,NULL,NULL,NULL),(10,3,'2026-08-28','2026-08-28',2,'2026-08-28 18:00:00','2026-08-29 03:00:00',15,480,60,'LATE',256,'2026-08-28 17:31:20','2026-08-28 17:35:43',2,2,478,0,0,'CLOCKED_OUT','PRESENT','NORMAL','2026-08-28 17:31:20','2026-08-28 17:35:43',NULL,NULL,NULL,NULL,NULL,NULL),(11,7,'2026-08-29','2026-08-29',1,'2026-08-29 18:00:00','2026-08-30 01:30:00',15,360,0,'ON_TIME',0,'2026-08-29 06:16:45','2026-08-29 06:26:04',0,9,351,0,0,'CLOCKED_OUT','PRESENT','NORMAL','2026-08-29 06:16:45','2026-08-29 06:26:04',NULL,NULL,NULL,NULL,NULL,NULL),(12,3,'2026-09-01','2026-09-01',2,'2026-09-01 18:00:00','2026-09-02 03:00:00',15,480,60,'LATE',165,'2026-09-01 16:00:17','2026-09-01 16:01:03',0,0,480,0,0,'CLOCKED_OUT','PRESENT','NORMAL','2026-09-01 16:00:17','2026-09-01 16:01:03',NULL,NULL,NULL,NULL,NULL,NULL),(13,3,'2026-09-07','2026-09-07',2,'2026-09-07 18:00:00','2026-09-08 03:00:00',15,480,60,'ON_TIME',223,'2026-09-07 16:43:16','2026-09-07 16:43:26',0,0,480,0,0,'CLOCKED_OUT','HALF_DAY','NORMAL','2026-09-07 16:43:16','2026-09-07 16:43:26',1,'{\"id\": 1, \"name\": \"Company Default\", \"scope_id\": \"\", \"is_active\": 1, \"created_at\": \"2026-09-07 20:59:25\", \"created_by\": null, \"scope_type\": \"COMPANY\", \"updated_at\": \"2026-09-07 20:59:25\", \"updated_by\": null, \"effective_to\": null, \"grace_minutes\": 15, \"effective_from\": \"2000-01-01\", \"late_penalty_type\": \"FULL_DAY_LEAVE\", \"late_rule_enabled\": 1, \"late_counter_period\": \"PAYROLL_CYCLE\", \"half_day_rule_enabled\": 1, \"late_penalty_quantity\": \"1.00\", \"count_half_day_as_late\": 0, \"half_day_after_minutes\": 120, \"late_instances_required\": 3, \"late_accumulation_enabled\": 1, \"half_day_salary_deduction_percent\": \"50.00\"}',223.00,208.00,NULL,NULL),(14,7,'2026-09-07','2026-09-07',1,'2026-09-07 18:00:00','2026-09-08 01:30:00',15,360,0,'ON_TIME',235,'2026-09-07 16:55:51','2026-09-07 16:56:42',0,0,360,0,0,'CLOCKED_OUT','HALF_DAY','NORMAL','2026-09-07 16:55:51','2026-09-07 16:56:42',1,'{\"id\": 1, \"name\": \"Company Default\", \"scope_id\": \"\", \"is_active\": 1, \"created_at\": \"2026-09-07 20:59:25\", \"created_by\": null, \"scope_type\": \"COMPANY\", \"updated_at\": \"2026-09-07 20:59:25\", \"updated_by\": null, \"effective_to\": null, \"grace_minutes\": 15, \"effective_from\": \"2000-01-01\", \"late_penalty_type\": \"FULL_DAY_LEAVE\", \"late_rule_enabled\": 1, \"late_counter_period\": \"PAYROLL_CYCLE\", \"half_day_rule_enabled\": 1, \"late_penalty_quantity\": \"1.00\", \"count_half_day_as_late\": 0, \"half_day_after_minutes\": 120, \"late_instances_required\": 3, \"late_accumulation_enabled\": 1, \"half_day_salary_deduction_percent\": \"50.00\"}',235.00,220.00,NULL,NULL),(15,3,'2026-09-08','2026-09-08',2,'2026-09-08 18:00:00','2026-09-09 03:00:00',15,480,60,'ON_TIME',130,'2026-09-08 15:10:13','2026-09-08 15:11:12',0,0,480,0,0,'CLOCKED_OUT','HALF_DAY','NORMAL','2026-09-08 15:10:13','2026-09-08 15:11:12',1,'{\"id\": 1, \"name\": \"Company Default\", \"scope_id\": \"\", \"is_active\": 1, \"created_at\": \"2026-09-07 20:59:25\", \"created_by\": null, \"scope_type\": \"COMPANY\", \"updated_at\": \"2026-09-07 20:59:25\", \"updated_by\": null, \"effective_to\": null, \"grace_minutes\": 15, \"effective_from\": \"2000-01-01\", \"late_penalty_type\": \"FULL_DAY_LEAVE\", \"late_rule_enabled\": 1, \"late_counter_period\": \"PAYROLL_CYCLE\", \"half_day_rule_enabled\": 1, \"late_penalty_quantity\": \"1.00\", \"count_half_day_as_late\": 0, \"half_day_after_minutes\": 120, \"late_instances_required\": 3, \"late_accumulation_enabled\": 1, \"half_day_salary_deduction_percent\": \"50.00\"}',130.00,115.00,NULL,NULL),(16,7,'2026-09-08','2026-09-08',1,'2026-09-08 18:00:00','2026-09-09 01:30:00',15,360,0,'ON_TIME',188,'2026-09-08 16:08:53','2026-09-09 04:15:06',0,726,0,366,0,'CLOCKED_OUT','HALF_DAY','OPEN_SHIFT','2026-09-08 16:08:53','2026-09-09 04:15:06',1,'{\"id\": 1, \"name\": \"Company Default\", \"scope_id\": \"\", \"is_active\": 1, \"created_at\": \"2026-09-07 20:59:25\", \"created_by\": null, \"scope_type\": \"COMPANY\", \"updated_at\": \"2026-09-07 20:59:25\", \"updated_by\": null, \"effective_to\": null, \"grace_minutes\": 15, \"effective_from\": \"2000-01-01\", \"late_penalty_type\": \"FULL_DAY_LEAVE\", \"late_rule_enabled\": 1, \"late_counter_period\": \"PAYROLL_CYCLE\", \"half_day_rule_enabled\": 1, \"late_penalty_quantity\": \"1.00\", \"count_half_day_as_late\": 0, \"half_day_after_minutes\": 120, \"late_instances_required\": 3, \"late_accumulation_enabled\": 1, \"half_day_salary_deduction_percent\": \"50.00\"}',188.00,173.00,NULL,NULL),(18,7,'2026-09-09','2026-09-09',1,'2026-09-09 18:00:00','2026-09-10 01:30:00',15,360,0,'ON_TIME',0,'2026-09-09 05:50:30','2026-09-09 05:51:56',0,1,359,0,0,'CLOCKED_OUT','PRESENT','NORMAL','2026-09-09 05:50:30','2026-09-09 05:51:56',1,'{\"id\": 1, \"name\": \"Company Default\", \"scope_id\": \"\", \"is_active\": 1, \"created_at\": \"2026-09-07 20:59:25\", \"created_by\": null, \"scope_type\": \"COMPANY\", \"updated_at\": \"2026-09-07 20:59:25\", \"updated_by\": null, \"effective_to\": null, \"grace_minutes\": 15, \"effective_from\": \"2000-01-01\", \"late_penalty_type\": \"FULL_DAY_LEAVE\", \"late_rule_enabled\": 1, \"late_counter_period\": \"PAYROLL_CYCLE\", \"half_day_rule_enabled\": 1, \"late_penalty_quantity\": \"1.00\", \"count_half_day_as_late\": 0, \"half_day_after_minutes\": 120, \"late_instances_required\": 3, \"late_accumulation_enabled\": 1, \"half_day_salary_deduction_percent\": \"50.00\"}',0.00,0.00,NULL,NULL),(19,3,'2026-09-09','2026-09-09',2,'2026-09-09 18:00:00','2026-09-10 03:00:00',15,480,60,'ON_TIME',144,'2026-09-09 15:24:45','2026-09-09 16:10:25',0,45,435,0,0,'CLOCKED_OUT','HALF_DAY','NORMAL','2026-09-09 15:24:45','2026-09-09 16:10:25',1,'{\"id\": 1, \"name\": \"Company Default\", \"scope_id\": \"\", \"is_active\": 1, \"created_at\": \"2026-09-07 20:59:25\", \"created_by\": null, \"scope_type\": \"COMPANY\", \"updated_at\": \"2026-09-07 20:59:25\", \"updated_by\": null, \"effective_to\": null, \"grace_minutes\": 15, \"effective_from\": \"2000-01-01\", \"late_penalty_type\": \"FULL_DAY_LEAVE\", \"late_rule_enabled\": 1, \"late_counter_period\": \"PAYROLL_CYCLE\", \"half_day_rule_enabled\": 1, \"late_penalty_quantity\": \"1.00\", \"count_half_day_as_late\": 0, \"half_day_after_minutes\": 120, \"late_instances_required\": 3, \"late_accumulation_enabled\": 1, \"half_day_salary_deduction_percent\": \"50.00\"}',144.00,129.00,NULL,NULL),(20,8,'2026-09-09','2026-09-09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-09-09 15:46:07',NULL,0,0,0,0,0,'WORKING','PRESENT','NORMAL','2026-09-09 15:46:07','2026-09-09 15:46:07',1,'{\"id\": 1, \"name\": \"Company Default\", \"scope_id\": \"\", \"is_active\": 1, \"created_at\": \"2026-09-07 20:59:25\", \"created_by\": null, \"scope_type\": \"COMPANY\", \"updated_at\": \"2026-09-07 20:59:25\", \"updated_by\": null, \"effective_to\": null, \"grace_minutes\": 15, \"effective_from\": \"2000-01-01\", \"late_penalty_type\": \"FULL_DAY_LEAVE\", \"late_rule_enabled\": 1, \"late_counter_period\": \"PAYROLL_CYCLE\", \"half_day_rule_enabled\": 1, \"late_penalty_quantity\": \"1.00\", \"count_half_day_as_late\": 0, \"half_day_after_minutes\": 120, \"late_instances_required\": 3, \"late_accumulation_enabled\": 1, \"half_day_salary_deduction_percent\": \"50.00\"}',0.00,0.00,NULL,NULL),(21,3,'2026-09-10','2026-09-10',2,'2026-09-10 18:00:00','2026-09-11 03:00:00',15,480,60,'ON_TIME',138,'2026-09-10 15:18:07','2026-09-12 04:25:50',0,2227,0,1747,0,'CLOCKED_OUT','HALF_DAY','OPEN_SHIFT','2026-09-10 15:18:07','2026-09-12 04:25:50',1,'{\"id\": 1, \"name\": \"Company Default\", \"scope_id\": \"\", \"is_active\": 1, \"created_at\": \"2026-09-07 20:59:25\", \"created_by\": null, \"scope_type\": \"COMPANY\", \"updated_at\": \"2026-09-07 20:59:25\", \"updated_by\": null, \"effective_to\": null, \"grace_minutes\": 15, \"effective_from\": \"2000-01-01\", \"late_penalty_type\": \"FULL_DAY_LEAVE\", \"late_rule_enabled\": 1, \"late_counter_period\": \"PAYROLL_CYCLE\", \"half_day_rule_enabled\": 1, \"late_penalty_quantity\": \"1.00\", \"count_half_day_as_late\": 0, \"half_day_after_minutes\": 120, \"late_instances_required\": 3, \"late_accumulation_enabled\": 1, \"half_day_salary_deduction_percent\": \"50.00\"}',138.00,123.00,NULL,NULL),(22,7,'2026-09-10','2026-09-10',1,'2026-09-10 18:00:00','2026-09-11 01:30:00',15,360,0,'ON_TIME',221,'2026-09-10 16:41:10','2026-09-11 16:43:37',0,1442,0,1082,0,'CLOCKED_OUT','HALF_DAY','OPEN_SHIFT','2026-09-10 16:41:10','2026-09-11 16:43:37',1,'{\"id\": 1, \"name\": \"Company Default\", \"scope_id\": \"\", \"is_active\": 1, \"created_at\": \"2026-09-07 20:59:25\", \"created_by\": null, \"scope_type\": \"COMPANY\", \"updated_at\": \"2026-09-07 20:59:25\", \"updated_by\": null, \"effective_to\": null, \"grace_minutes\": 15, \"effective_from\": \"2000-01-01\", \"late_penalty_type\": \"FULL_DAY_LEAVE\", \"late_rule_enabled\": 1, \"late_counter_period\": \"PAYROLL_CYCLE\", \"half_day_rule_enabled\": 1, \"late_penalty_quantity\": \"1.00\", \"count_half_day_as_late\": 0, \"half_day_after_minutes\": 120, \"late_instances_required\": 3, \"late_accumulation_enabled\": 1, \"half_day_salary_deduction_percent\": \"50.00\"}',221.00,206.00,NULL,NULL),(23,7,'2026-09-11','2026-09-11',1,'2026-09-11 18:00:00','2026-09-12 01:30:00',15,360,0,'ON_TIME',280,'2026-09-11 17:40:29','2026-09-12 08:52:02',0,911,0,551,0,'CLOCKED_OUT','HALF_DAY','OPEN_SHIFT','2026-09-11 17:40:29','2026-09-12 08:52:02',1,'{\"id\": 1, \"name\": \"Company Default\", \"scope_id\": \"\", \"is_active\": 1, \"created_at\": \"2026-09-07 20:59:25\", \"created_by\": null, \"scope_type\": \"COMPANY\", \"updated_at\": \"2026-09-07 20:59:25\", \"updated_by\": null, \"effective_to\": null, \"grace_minutes\": 15, \"effective_from\": \"2000-01-01\", \"late_penalty_type\": \"FULL_DAY_LEAVE\", \"late_rule_enabled\": 1, \"late_counter_period\": \"PAYROLL_CYCLE\", \"half_day_rule_enabled\": 1, \"late_penalty_quantity\": \"1.00\", \"count_half_day_as_late\": 0, \"half_day_after_minutes\": 120, \"late_instances_required\": 3, \"late_accumulation_enabled\": 1, \"half_day_salary_deduction_percent\": \"50.00\"}',280.00,265.00,NULL,NULL),(24,7,'2026-09-15','2026-09-15',1,'2026-09-15 18:00:00','2026-09-16 01:30:00',15,360,0,'ON_TIME',0,'2026-09-15 04:26:39',NULL,0,0,0,0,0,'WORKING','PRESENT','NORMAL','2026-09-15 04:26:39','2026-09-15 04:26:39',1,'{\"id\": 1, \"name\": \"Company Default\", \"scope_id\": \"\", \"is_active\": 1, \"created_at\": \"2026-09-07 20:59:25\", \"created_by\": null, \"scope_type\": \"COMPANY\", \"updated_at\": \"2026-09-07 20:59:25\", \"updated_by\": null, \"effective_to\": null, \"grace_minutes\": 15, \"effective_from\": \"2000-01-01\", \"late_penalty_type\": \"FULL_DAY_LEAVE\", \"late_rule_enabled\": 1, \"late_counter_period\": \"PAYROLL_CYCLE\", \"half_day_rule_enabled\": 1, \"late_penalty_quantity\": \"1.00\", \"count_half_day_as_late\": 0, \"half_day_after_minutes\": 120, \"late_instances_required\": 3, \"late_accumulation_enabled\": 1, \"half_day_salary_deduction_percent\": \"50.00\"}',0.00,0.00,NULL,NULL);
/*!40000 ALTER TABLE `attendance_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `employee_id` bigint unsigned DEFAULT NULL,
  `action` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` bigint unsigned DEFAULT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payroll_period_start` date DEFAULT NULL,
  `payroll_period_end` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_audit_employee` (`employee_id`),
  KEY `idx_audit_created` (`created_at`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_payroll_period` (`payroll_period_start`,`payroll_period_end`),
  CONSTRAINT `fk_audit_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=558 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,2,2,'INITIAL_ADMIN_CREATED','USER',2,'Initial CEO administrator account created.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:16:14'),(2,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:16:38'),(3,2,2,'LOGIN_FAILED','USER',2,'Failed login attempt for admin@remoteoffice.com from ::1.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:20:22'),(4,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:20:29'),(5,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:28:55'),(6,2,2,'ROLE_UPDATED','ROLE',1,'Role CEO was updated.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:29:11'),(7,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:31:14'),(8,2,2,'ATTENDANCE_CLOCK_IN','ATTENDANCE',1,'System Admin clocked in at 04:31 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:31:14'),(9,2,2,'BREAK_STARTED','ATTENDANCE',1,'System Admin started a break at 04:31 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:31:14'),(10,2,2,'BREAK_ENDED','ATTENDANCE',1,'System Admin ended a break at 04:31 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:31:14'),(11,2,2,'BREAK_STARTED','ATTENDANCE',1,'System Admin started a break at 04:31 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:31:14'),(12,2,2,'BREAK_ENDED','ATTENDANCE',1,'System Admin ended a break at 04:31 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:31:14'),(13,2,2,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',1,'System Admin clocked out at 04:31 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:31:14'),(14,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:31:33'),(15,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:32:12'),(16,2,2,'EMPLOYEE_CREATED','EMPLOYEE',3,'Employee Huzaifa Mustafa was created.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:34:42'),(17,3,3,'LOGIN_SUCCESS','USER',3,'Huzaifa Mustafa signed in successfully.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:35:13'),(18,3,3,'ATTENDANCE_CLOCK_IN','ATTENDANCE',2,'Huzaifa Mustafa clocked in at 04:35 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:35:15'),(19,3,3,'BREAK_STARTED','ATTENDANCE',2,'Huzaifa Mustafa started a break at 04:35 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:35:53'),(20,3,3,'BREAK_ENDED','ATTENDANCE',2,'Huzaifa Mustafa ended a break at 04:36 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:36:12'),(21,3,3,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',2,'Huzaifa Mustafa clocked out at 04:36 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:36:15'),(22,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 11:52:00'),(26,2,2,'LEAVE_REJECTED','LEAVE',2,'Leave request for Phase Tester was rejected by management.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 12:10:04'),(29,2,2,'LEAVE_APPROVED','LEAVE',4,'Leave request for Phase Tester was approved by management.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 12:10:04'),(31,2,2,'LEAVE_APPROVED','LEAVE',5,'Leave request for Phase Tester was approved by management.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 12:10:04'),(33,2,2,'LEAVE_APPROVED','LEAVE',6,'Leave request for Phase Tester was approved by management.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 12:10:04'),(35,2,2,'LEAVE_APPROVED','LEAVE',7,'Leave request for Phase Tester was approved by management.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 12:10:04'),(36,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 12:11:31'),(38,2,2,'LEAVE_APPROVED','LEAVE',8,'Leave request for Reconcile Tester was approved by management.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 12:11:56'),(40,2,2,'LEAVE_APPROVED','LEAVE',9,'Leave request for Reconcile Tester was approved by management.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 12:11:56'),(41,2,2,'ATTENDANCE_UPDATED','LEAVE',NULL,'Attendance for 2026-08-25 was finalized.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 12:11:56'),(42,3,3,'LEAVE_REQUESTED','LEAVE',10,'Huzaifa Mustafa requested leave from 2026-08-27 to 2026-08-27.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 12:19:15'),(43,2,2,'LEAVE_REJECTED','LEAVE',10,'Leave request for Huzaifa Mustafa was rejected by management.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 12:19:37'),(44,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 12:31:51'),(46,2,2,'LEAVE_APPROVED','LEAVE',11,'Leave request for Calendar Tester was approved by management.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 12:34:53'),(49,2,2,'HOLIDAY_CREATED','COMPANY_CALENDAR',NULL,'Sunday was added to the company calendar from 2026-08-27 to 2026-08-29.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 12:36:34'),(50,2,2,'HOLIDAY_CANCELLED','COMPANY_CALENDAR',5,'Sunday was cancelled in the company calendar.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 12:37:01'),(51,2,2,'HOLIDAY_CANCELLED','COMPANY_CALENDAR',6,'Sunday was cancelled in the company calendar.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 12:37:03'),(52,2,2,'HOLIDAY_CANCELLED','COMPANY_CALENDAR',7,'Sunday was cancelled in the company calendar.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 12:37:05'),(53,3,3,'LEAVE_REQUESTED','LEAVE',12,'Huzaifa Mustafa requested leave from 2026-08-29 to 2026-08-30.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 12:49:45'),(54,2,2,'LEAVE_APPROVED','LEAVE',12,'Leave request for Huzaifa Mustafa was approved by management.',NULL,NULL,NULL,NULL,NULL,'2026-08-26 13:00:34'),(55,3,3,'ATTENDANCE_CLOCK_IN','ATTENDANCE',7,'Huzaifa Mustafa clocked in at 10:51 am.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 05:51:09'),(56,3,3,'BREAK_STARTED','ATTENDANCE',7,'Huzaifa Mustafa started a break at 10:51 am.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 05:51:20'),(57,3,3,'BREAK_ENDED','ATTENDANCE',7,'Huzaifa Mustafa ended a break at 10:51 am.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 05:51:34'),(58,3,3,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',7,'Huzaifa Mustafa clocked out at 10:51 am.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 05:51:36'),(59,3,3,'LEAVE_REQUESTED','LEAVE',13,'Huzaifa Mustafa requested leave from 2026-09-01 to 2026-09-02.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 16:46:04'),(60,3,3,'LEAVE_REQUESTED','LEAVE',14,'Huzaifa Mustafa requested leave from 2026-09-09 to 2026-09-09.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 16:46:41'),(61,2,2,'EMPLOYEE_CREATED','EMPLOYEE',7,'Employee Huzaifa Mustafa was created.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 16:49:02'),(62,7,7,'LOGIN_SUCCESS','USER',7,'Huzaifa Mustafa signed in successfully.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 16:49:35'),(63,7,7,'ATTENDANCE_CLOCK_IN','ATTENDANCE',8,'Huzaifa Mustafa clocked in at 09:49 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 16:49:38'),(64,2,2,'LEAVE_APPROVED','LEAVE',14,'Leave request for Huzaifa Mustafa was approved by management.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 16:52:00'),(65,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 16:59:24'),(66,7,7,'LOGIN_SUCCESS','USER',7,'Huzaifa Mustafa signed in successfully.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:00:00'),(67,7,7,'LOGIN_SUCCESS','USER',7,'Huzaifa Mustafa signed in successfully.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:08:57'),(68,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:09:11'),(69,7,7,'BREAK_STARTED','ATTENDANCE',8,'Huzaifa Mustafa started a break at 10:17 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:17:14'),(70,7,7,'BREAK_ENDED','ATTENDANCE',8,'Huzaifa Mustafa ended a break at 10:17 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:17:27'),(71,7,7,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',8,'Huzaifa Mustafa clocked out at 10:17 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:17:31'),(72,2,2,'PAYROLL_GENERATED','PAYROLL',1,'2026-08 payroll generated for 2026-07-05 through 2026-08-04.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:18:04'),(73,2,2,'PAYROLL_GENERATED','PAYROLL',1,'2026-08 payroll generated for 2026-07-05 through 2026-08-04.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:18:05'),(74,2,2,'PAYROLL_GENERATED','PAYROLL',1,'2026-08 payroll generated for 2026-07-05 through 2026-08-04.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:18:06'),(75,2,2,'SHIFT_CREATED','SHIFT',2,'Ammar was created.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:18:46'),(76,2,2,'SHIFT_UPDATED','SHIFT',1,'Night Shift was updated.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:19:33'),(77,2,2,'SHIFT_UPDATED','SHIFT',2,'Ammar was updated.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:20:01'),(78,2,2,'SHIFT_UPDATED','SHIFT',1,'Night Shift was updated.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:20:07'),(79,2,2,'PAYROLL_GENERATED','PAYROLL',1,'2026-08 payroll generated for 2026-07-05 through 2026-08-04.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:20:16'),(80,2,2,'PAYROLL_APPROVED','PAYROLL',1,'Payroll status changed.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:20:18'),(81,2,2,'PAYROLL_MARKED_PAID','PAYROLL',1,'Payroll status changed.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:20:52'),(82,2,2,'EMPLOYEE_UPDATED','EMPLOYEE',7,'Huzaifa Mustafa\'s employee profile was updated.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:21:18'),(83,2,2,'LEAVE_REJECTED','LEAVE',13,'Leave request for Huzaifa Mustafa was rejected by management.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:27:35'),(84,2,2,'SHIFT_ASSIGNED','EMPLOYEE',7,'Night Shift assigned to Huzaifa Mustafa effective 2026-08-24.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:31:41'),(85,2,2,'SALARY_UPDATED','EMPLOYEE',7,'Huzaifa Mustafa\'s salary changed from PKR 0 to PKR 25000 effective 2026-08-24.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:31:41'),(86,2,2,'PERMISSION_UPDATED','ROLE',2,'Permissions were updated for role #2.',NULL,NULL,NULL,NULL,NULL,'2026-08-27 17:33:52'),(87,7,7,'ATTENDANCE_CLOCK_IN','ATTENDANCE',9,'Huzaifa Mustafa clocked in at 09:58 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-28 16:58:11'),(88,7,7,'BREAK_STARTED','ATTENDANCE',9,'Huzaifa Mustafa started a break at 10:07 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-28 17:07:58'),(89,7,7,'BREAK_ENDED','ATTENDANCE',9,'Huzaifa Mustafa ended a break at 10:08 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-28 17:08:01'),(90,7,7,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',9,'Huzaifa Mustafa clocked out at 10:08 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-28 17:08:03'),(91,2,2,'SHIFT_ASSIGNED','EMPLOYEE',3,'Ammar assigned to Huzaifa Mustafa effective 2026-08-05.',NULL,NULL,NULL,NULL,NULL,'2026-08-28 17:30:21'),(92,2,2,'SALARY_UPDATED','EMPLOYEE',3,'Huzaifa Mustafa\'s salary changed from PKR 0 to PKR 25000 effective 2026-08-05.',NULL,NULL,NULL,NULL,NULL,'2026-08-28 17:30:21'),(93,3,3,'LOGIN_SUCCESS','USER',3,'Huzaifa Mustafa signed in successfully.',NULL,NULL,NULL,NULL,NULL,'2026-08-28 17:31:02'),(94,3,3,'ATTENDANCE_CLOCK_IN','ATTENDANCE',10,'Huzaifa Mustafa clocked in at 10:31 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-28 17:31:20'),(95,3,3,'BREAK_STARTED','ATTENDANCE',10,'Huzaifa Mustafa started a break at 10:33 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-28 17:33:00'),(96,3,3,'BREAK_ENDED','ATTENDANCE',10,'Huzaifa Mustafa ended a break at 10:35 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-28 17:35:38'),(97,3,3,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',10,'Huzaifa Mustafa clocked out at 10:35 pm.',NULL,NULL,NULL,NULL,NULL,'2026-08-28 17:35:43'),(98,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-08-29 19:00:16.',NULL,NULL,NULL,NULL,NULL,'2026-08-29 06:00:16'),(99,2,2,'USER_LOGOUT','AUTH_SESSION',2,'admin@remoteoffice.com signed out and revoked the active session.',NULL,NULL,NULL,NULL,NULL,'2026-08-29 06:00:16'),(100,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-08-29 19:06:18.',NULL,NULL,NULL,NULL,NULL,'2026-08-29 06:06:18'),(101,3,3,'LOGIN_FAILED','USER',3,'Failed login attempt for malikhuzaifa1126@gmail.com from ::1.',NULL,NULL,NULL,NULL,NULL,'2026-08-29 06:06:23'),(102,3,3,'USER_LOGIN','AUTH_SESSION',3,'Huzaifa Mustafa signed in. Session expires at 2026-08-29 19:06:42.',NULL,NULL,NULL,NULL,NULL,'2026-08-29 06:06:42'),(103,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for huzaifamustafa@gmail.com from ::1.',NULL,NULL,NULL,NULL,NULL,'2026-08-29 06:14:39'),(104,7,7,'LOGIN_FAILED','USER',7,'Failed login attempt for huzaifa@gmail.com from ::1.',NULL,NULL,NULL,NULL,NULL,'2026-08-29 06:14:54'),(105,7,7,'USER_LOGIN','AUTH_SESSION',7,'Huzaifa Mustafa signed in. Session expires at 2026-08-29 19:14:58.',NULL,NULL,NULL,NULL,NULL,'2026-08-29 06:14:58'),(106,7,7,'ATTENDANCE_CLOCK_IN','ATTENDANCE',11,'Huzaifa Mustafa clocked in at 11:16 am.',NULL,NULL,NULL,NULL,NULL,'2026-08-29 06:16:45'),(107,7,7,'BREAK_STARTED','ATTENDANCE',11,'Huzaifa Mustafa started a break at 11:26 am.',NULL,NULL,NULL,NULL,NULL,'2026-08-29 06:26:01'),(108,7,7,'BREAK_ENDED','ATTENDANCE',11,'Huzaifa Mustafa ended a break at 11:26 am.',NULL,NULL,NULL,NULL,NULL,'2026-08-29 06:26:03'),(109,7,7,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',11,'Huzaifa Mustafa clocked out at 11:26 am.',NULL,NULL,NULL,NULL,NULL,'2026-08-29 06:26:04'),(110,7,7,'SESSION_EXPIRED','AUTH_SESSION',7,'Huzaifa Mustafa\'s login session expired after the maximum 8-hour duration.',NULL,NULL,NULL,NULL,NULL,'2026-08-29 15:31:55'),(111,2,2,'SESSION_EXPIRED','AUTH_SESSION',2,'System Admin\'s login session expired after the maximum 8-hour duration.',NULL,NULL,NULL,NULL,NULL,'2026-08-29 15:31:55'),(112,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-08-30 04:34:52.',NULL,NULL,NULL,NULL,NULL,'2026-08-29 15:34:52'),(113,7,7,'USER_LOGIN','AUTH_SESSION',7,'Huzaifa Mustafa signed in. Session expires at 2026-08-30 04:35:53.',NULL,NULL,NULL,NULL,NULL,'2026-08-29 15:35:53'),(114,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-02 04:29:26.',NULL,NULL,NULL,NULL,NULL,'2026-09-01 15:29:26'),(115,2,2,'PAYROLL_GENERATED','PAYROLL',2,'2026-09 payroll generated for 2026-08-05 through 2026-09-04.',NULL,NULL,NULL,'2026-08-05','2026-09-04','2026-09-01 15:30:17'),(116,2,2,'PAYROLL_RECALCULATED','PAYROLL',2,'2026-09 payroll recalculated for 2026-08-05 through 2026-09-04.',NULL,NULL,NULL,'2026-08-05','2026-09-04','2026-09-01 15:30:57'),(117,2,2,'PAYROLL_RECALCULATED','PAYROLL',2,'2026-09 payroll recalculated for 2026-08-05 through 2026-09-04.',NULL,NULL,NULL,'2026-08-05','2026-09-04','2026-09-01 15:30:58'),(118,3,3,'USER_LOGIN','AUTH_SESSION',3,'Huzaifa Mustafa signed in. Session expires at 2026-09-02 04:59:33.',NULL,NULL,NULL,NULL,NULL,'2026-09-01 15:59:33'),(119,3,3,'ATTENDANCE_CLOCK_IN','ATTENDANCE',12,'Huzaifa Mustafa clocked in at 09:00 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-01 16:00:17'),(120,3,3,'BREAK_STARTED','ATTENDANCE',12,'Huzaifa Mustafa started a break at 09:00 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-01 16:00:46'),(121,3,3,'BREAK_ENDED','ATTENDANCE',12,'Huzaifa Mustafa ended a break at 09:01 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-01 16:01:02'),(122,3,3,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',12,'Huzaifa Mustafa clocked out at 09:01 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-01 16:01:03'),(123,3,3,'USER_LOGIN','AUTH_SESSION',3,'Huzaifa Mustafa signed in. Session expires at 2026-09-02 05:34:46.',NULL,NULL,NULL,NULL,NULL,'2026-09-01 16:34:46'),(124,3,3,'LEAVE_REQUESTED','LEAVE',15,'Huzaifa Mustafa requested leave from 2026-09-02 to 2026-09-02.',NULL,NULL,NULL,NULL,NULL,'2026-09-01 16:36:44'),(125,2,2,'LEAVE_REJECTED','LEAVE',15,'Leave request for Huzaifa Mustafa was rejected by management.',NULL,NULL,NULL,NULL,NULL,'2026-09-01 16:36:59'),(126,3,3,'LEAVE_REQUESTED','LEAVE',16,'Huzaifa Mustafa requested leave from 2026-09-02 to 2026-09-02.',NULL,NULL,NULL,NULL,NULL,'2026-09-01 16:37:05'),(127,3,3,'LEAVE_REQUESTED','LEAVE',17,'Huzaifa Mustafa requested leave from 2026-09-03 to 2026-09-03.',NULL,NULL,NULL,NULL,NULL,'2026-09-01 16:37:29'),(128,2,2,'LEAVE_APPROVED','LEAVE',16,'Leave request for Huzaifa Mustafa was approved by management.',NULL,NULL,NULL,NULL,NULL,'2026-09-01 16:37:42'),(129,2,2,'LEAVE_APPROVED','LEAVE',17,'Leave request for Huzaifa Mustafa was approved by management.',NULL,NULL,NULL,NULL,NULL,'2026-09-01 16:38:31'),(130,2,2,'HOLIDAY_CREATED','COMPANY_CALENDAR',NULL,'gtkj was added to the company calendar from 2026-09-05 to 2026-09-05.',NULL,NULL,NULL,NULL,NULL,'2026-09-01 16:39:20'),(131,2,2,'HOLIDAY_CANCELLED','COMPANY_CALENDAR',8,'gtkj was cancelled in the company calendar.',NULL,NULL,NULL,NULL,NULL,'2026-09-01 16:40:04'),(132,2,2,'SESSION_EXPIRED','AUTH_SESSION',2,'System Admin\'s login session expired after the maximum 8-hour duration.',NULL,NULL,NULL,NULL,NULL,'2026-09-02 01:01:36'),(133,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-05 05:18:44.',NULL,NULL,NULL,NULL,NULL,'2026-09-04 16:18:45'),(134,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-05 07:17:11.',NULL,NULL,NULL,NULL,NULL,'2026-09-04 18:17:11'),(135,2,2,'SHIFT_UPDATED','SHIFT',1,'Night Shift was updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-04 18:24:44'),(136,3,3,'LOGIN_FAILED','USER',3,'Failed login attempt for malikhuzaifa1126@gmail.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-04 18:55:27'),(137,3,3,'LOGIN_FAILED','USER',3,'Failed login attempt for malikhuzaifa1126@gmail.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-04 18:55:33'),(138,3,3,'LOGIN_FAILED','USER',3,'Failed login attempt for malikhuzaifa1126@gmail.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-04 18:55:38'),(139,3,3,'USER_LOGIN','AUTH_SESSION',3,'Huzaifa Mustafa signed in. Session expires at 2026-09-05 07:55:41.',NULL,NULL,NULL,NULL,NULL,'2026-09-04 18:55:41'),(140,2,2,'SPECIAL_OFF_DAY_CREATED','COMPANY_CALENDAR',NULL,'saturaday off was added to the company calendar from 2026-09-05 to 2026-09-05.',NULL,NULL,NULL,NULL,NULL,'2026-09-04 19:01:57'),(141,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-05 17:23:09.',NULL,NULL,NULL,NULL,NULL,'2026-09-05 04:23:09'),(142,2,2,'PAYROLL_GENERATED','PAYROLL',2,'2026-09 payroll generated for 2026-08-05 through 2026-09-04.',NULL,NULL,NULL,'2026-08-05','2026-09-04','2026-09-05 04:27:39'),(143,2,2,'SESSION_EXPIRED','AUTH_SESSION',2,'System Admin\'s login session expired after the maximum 8-hour duration.',NULL,NULL,NULL,NULL,NULL,'2026-09-05 17:26:20'),(144,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-06 06:26:22.',NULL,NULL,NULL,NULL,NULL,'2026-09-05 17:26:22'),(145,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-08 05:00:54.',NULL,NULL,NULL,NULL,NULL,'2026-09-07 16:00:54'),(146,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-08 05:04:42.',NULL,NULL,NULL,NULL,NULL,'2026-09-07 16:04:42'),(147,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-08 05:05:06.',NULL,NULL,NULL,NULL,NULL,'2026-09-07 16:05:06'),(148,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-08 05:17:02.',NULL,NULL,NULL,NULL,NULL,'2026-09-07 16:17:02'),(149,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-08 05:26:49.',NULL,NULL,NULL,NULL,NULL,'2026-09-07 16:26:49'),(150,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-08 05:41:55.',NULL,NULL,NULL,NULL,NULL,'2026-09-07 16:41:55'),(151,3,3,'USER_LOGIN','AUTH_SESSION',3,'Huzaifa Mustafa signed in. Session expires at 2026-09-08 05:42:46.',NULL,NULL,NULL,NULL,NULL,'2026-09-07 16:42:46'),(152,3,3,'ATTENDANCE_CLOCK_IN','ATTENDANCE',13,'Huzaifa Mustafa clocked in at 09:43 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-07 16:43:16'),(153,3,3,'BREAK_STARTED','ATTENDANCE',13,'Huzaifa Mustafa started a break at 09:43 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-07 16:43:21'),(154,3,3,'BREAK_ENDED','ATTENDANCE',13,'Huzaifa Mustafa ended a break at 09:43 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-07 16:43:25'),(155,3,3,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',13,'Huzaifa Mustafa clocked out at 09:43 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-07 16:43:26'),(156,3,3,'USER_LOGOUT','AUTH_SESSION',3,'malikhuzaifa1126@gmail.com signed out and revoked the active session.',NULL,NULL,NULL,NULL,NULL,'2026-09-07 16:43:29'),(157,3,3,'USER_LOGIN','AUTH_SESSION',3,'Huzaifa Mustafa signed in. Session expires at 2026-09-08 05:49:43.',NULL,NULL,NULL,NULL,NULL,'2026-09-07 16:49:43'),(158,3,3,'USER_LOGOUT','AUTH_SESSION',3,'malikhuzaifa1126@gmail.com signed out and revoked the active session.',NULL,NULL,NULL,NULL,NULL,'2026-09-07 16:55:09'),(159,7,7,'LOGIN_FAILED','USER',7,'Failed login attempt for huzaifa@gmail.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-07 16:55:20'),(160,7,7,'USER_LOGIN','AUTH_SESSION',7,'Huzaifa Mustafa signed in. Session expires at 2026-09-08 05:55:24.',NULL,NULL,NULL,NULL,NULL,'2026-09-07 16:55:24'),(161,7,7,'ATTENDANCE_CLOCK_IN','ATTENDANCE',14,'Huzaifa Mustafa clocked in at 09:55 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-07 16:55:51'),(162,7,7,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',14,'Huzaifa Mustafa clocked out at 09:56 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-07 16:56:42'),(163,7,7,'SESSION_EXPIRED','AUTH_SESSION',7,'Huzaifa Mustafa\'s login session expired after the maximum 8-hour duration.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 01:01:39'),(164,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-09 02:45:54.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 13:45:54'),(165,2,2,'PERMISSION_UPDATED','ROLE',2,'Permissions were updated for role #2.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 14:55:43'),(166,3,3,'USER_LOGIN','AUTH_SESSION',3,'Huzaifa Mustafa signed in. Session expires at 2026-09-09 03:59:28.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 14:59:28'),(167,2,2,'EMPLOYEE_UPDATED','EMPLOYEE',7,'Huzaifa Mustafa\'s employee profile was updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 15:00:58'),(168,2,2,'EMPLOYEE_DEACTIVATED','EMPLOYEE',7,'Employee Huzaifa Mustafa was deactivated.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 15:01:47'),(169,2,2,'EMPLOYEE_ACTIVATED','EMPLOYEE',7,'Employee Huzaifa Mustafa was activated.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 15:01:50'),(170,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-09 04:03:22.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 15:03:22'),(171,2,2,'PERMISSION_UPDATED','ROLE',2,'Permissions were updated for role #2.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 15:03:41'),(172,2,2,'PERMISSION_UPDATED','ROLE',2,'Permissions were updated for role #2.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 15:04:07'),(173,2,7,'EMPLOYEE_PERMISSION_UPDATED','USER_PERMISSION',7,'Allows this role to access the Remote Office Portal from mobile devices. override changed for Huzaifa Mustafa.','{\"override\": \"INHERIT\"}','{\"override\": \"ALLOW\", \"permission\": \"portal.access_mobile\", \"description\": \"Allows this role to access the Remote Office Portal from mobile devices.\", \"roleAllowed\": true, \"permissionId\": 61, \"effectiveAllowed\": true}',NULL,NULL,NULL,'2026-09-08 15:06:33'),(174,2,7,'EMPLOYEE_PERMISSION_UPDATED','USER_PERMISSION',7,'Allows this role to access the Remote Office Portal from mobile devices. override changed for Huzaifa Mustafa.','{\"override\": \"ALLOW\"}','{\"override\": \"DENY\", \"permission\": \"portal.access_mobile\", \"description\": \"Allows this role to access the Remote Office Portal from mobile devices.\", \"roleAllowed\": true, \"permissionId\": 61, \"effectiveAllowed\": false}',NULL,NULL,NULL,'2026-09-08 15:06:35'),(175,2,7,'EMPLOYEE_PERMISSION_UPDATED','USER_PERMISSION',7,'Allows this role to access the Remote Office Portal from mobile devices. override changed for Huzaifa Mustafa.','{\"override\": \"DENY\"}','{\"override\": \"INHERIT\", \"permission\": \"portal.access_mobile\", \"description\": \"Allows this role to access the Remote Office Portal from mobile devices.\", \"roleAllowed\": true, \"permissionId\": 61, \"effectiveAllowed\": true}',NULL,NULL,NULL,'2026-09-08 15:06:37'),(176,2,2,'PERMISSION_UPDATED','ROLE',2,'Permissions were updated for role #2.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 15:06:47'),(177,2,3,'EMPLOYEE_PERMISSION_UPDATED','USER_PERMISSION',3,'Allows this role to access the Remote Office Portal from mobile devices. override changed for Huzaifa Mustafa.','{\"override\": \"INHERIT\"}','{\"override\": \"ALLOW\", \"permission\": \"portal.access_mobile\", \"description\": \"Allows this role to access the Remote Office Portal from mobile devices.\", \"roleAllowed\": false, \"permissionId\": 61, \"effectiveAllowed\": true}',NULL,NULL,NULL,'2026-09-08 15:06:57'),(178,3,3,'USER_LOGOUT','AUTH_SESSION',3,'malikhuzaifa1126@gmail.com signed out and revoked the active session.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 15:07:11'),(179,3,3,'USER_LOGIN','AUTH_SESSION',3,'Huzaifa Mustafa signed in. Session expires at 2026-09-09 04:07:45.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 15:07:45'),(180,3,3,'ATTENDANCE_CLOCK_IN','ATTENDANCE',15,'Huzaifa Mustafa clocked in at 08:10 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 15:10:13'),(181,3,3,'BREAK_STARTED','ATTENDANCE',15,'Huzaifa Mustafa started a break at 08:10 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 15:10:50'),(182,3,3,'BREAK_ENDED','ATTENDANCE',15,'Huzaifa Mustafa ended a break at 08:11 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 15:11:06'),(183,3,3,'BREAK_STARTED','ATTENDANCE',15,'Huzaifa Mustafa started a break at 08:11 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 15:11:10'),(184,3,3,'BREAK_ENDED','ATTENDANCE',15,'Huzaifa Mustafa ended a break at 08:11 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 15:11:11'),(185,3,3,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',15,'Huzaifa Mustafa clocked out at 08:11 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 15:11:12'),(186,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-09 04:19:48.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 15:19:48'),(187,3,3,'USER_LOGIN','AUTH_SESSION',3,'Huzaifa Mustafa signed in. Session expires at 2026-09-09 04:29:57.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 15:29:57'),(188,2,2,'TASK_CREATED','TASK',1,'Phase 2.2 verification was created as DRAFT.',NULL,'{\"status\": \"DRAFT\"}',NULL,NULL,NULL,'2026-09-08 15:47:50'),(189,2,2,'TASK_CREATED','TASK',2,'Phase 2.2 verification was created as DRAFT.',NULL,'{\"status\": \"DRAFT\"}',NULL,NULL,NULL,'2026-09-08 15:49:20'),(190,2,2,'TASK_STATUS_CHANGED','TASK',2,'Phase 2.2 verification was published.',NULL,'{\"status\": \"TO_DO\"}',NULL,NULL,NULL,'2026-09-08 15:49:20'),(191,2,2,'TASK_CREATED','TASK',3,'Phase 2.2 privacy verification was created as SCHEDULED.',NULL,'{\"status\": \"SCHEDULED\"}',NULL,NULL,NULL,'2026-09-08 15:50:09'),(192,2,2,'TASK_CREATED','TASK',4,'testing was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-08 15:55:33'),(193,3,3,'TASK_CLAIMED','TASK',4,'testing was claimed.',NULL,'{}',NULL,NULL,NULL,'2026-09-08 16:07:32'),(194,3,3,'USER_LOGOUT','AUTH_SESSION',3,'malikhuzaifa1126@gmail.com signed out and revoked the active session.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 16:08:11'),(195,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for huzaifa1126@gmail.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 16:08:29'),(196,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for huzaifa1126@gmail.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 16:08:36'),(197,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for huzaifa1126@gmail.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 16:08:40'),(198,7,7,'USER_LOGIN','AUTH_SESSION',7,'Huzaifa Mustafa signed in. Session expires at 2026-09-09 05:08:44.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 16:08:44'),(199,7,7,'ATTENDANCE_CLOCK_IN','ATTENDANCE',16,'Huzaifa Mustafa clocked in at 09:08 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-08 16:08:53'),(200,2,2,'TASK_CREATED','TASK',5,'P23 concurrency was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-08 16:09:24'),(201,3,3,'TASK_CLAIMED','TASK',5,'P23 concurrency was claimed.',NULL,'{}',NULL,NULL,NULL,'2026-09-08 16:09:24'),(202,2,2,'TASK_CREATED','TASK',6,'P23 offline was created as TO_DO.',NULL,'{\"status\": \"TO_DO\"}',NULL,NULL,NULL,'2026-09-08 16:09:24'),(203,2,2,'TASK_CREATED','TASK',7,'P23 private was created as TO_DO.',NULL,'{\"status\": \"TO_DO\"}',NULL,NULL,NULL,'2026-09-08 16:09:24'),(204,2,2,'TASK_CREATED','TASK',8,'P23 direct count was created as TO_DO.',NULL,'{\"status\": \"TO_DO\"}',NULL,NULL,NULL,'2026-09-08 16:09:24'),(205,2,2,'TASK_CREATED','TASK',9,'task 2 was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-08 16:10:00'),(206,7,7,'TASK_CLAIMED','TASK',9,'task 2 was claimed.',NULL,'{}',NULL,NULL,NULL,'2026-09-08 16:10:08'),(207,7,7,'TASK_STATUS_CHANGED','TASK',9,'task 2 changed from TO_DO to IN_PROGRESS.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-08 16:10:11'),(208,7,7,'TASK_STATUS_CHANGED','TASK',9,'task 2 changed from IN_PROGRESS to SUBMITTED_FOR_REVIEW.',NULL,'{\"status\": \"SUBMITTED_FOR_REVIEW\"}',NULL,NULL,NULL,'2026-09-08 16:10:23'),(209,2,2,'TASK_CREATED','TASK',10,'P23 concurrency was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-08 16:10:33'),(210,3,3,'TASK_CLAIMED','TASK',10,'P23 concurrency was claimed.',NULL,'{}',NULL,NULL,NULL,'2026-09-08 16:10:33'),(211,2,2,'TASK_CREATED','TASK',11,'P23 offline was created as TO_DO.',NULL,'{\"status\": \"TO_DO\"}',NULL,NULL,NULL,'2026-09-08 16:10:33'),(212,2,2,'TASK_CREATED','TASK',12,'P23 private was created as TO_DO.',NULL,'{\"status\": \"TO_DO\"}',NULL,NULL,NULL,'2026-09-08 16:10:33'),(213,2,2,'TASK_CREATED','TASK',13,'P23 direct count was created as TO_DO.',NULL,'{\"status\": \"TO_DO\"}',NULL,NULL,NULL,'2026-09-08 16:10:33'),(214,2,2,'TASK_CREATED','TASK',14,'P23 active A was created as TO_DO.',NULL,'{\"status\": \"TO_DO\"}',NULL,NULL,NULL,'2026-09-08 16:10:33'),(215,2,2,'TASK_CREATED','TASK',15,'P23 active B was created as TO_DO.',NULL,'{\"status\": \"TO_DO\"}',NULL,NULL,NULL,'2026-09-08 16:10:33'),(216,7,7,'TASK_STATUS_CHANGED','TASK',14,'P23 active A changed from TO_DO to IN_PROGRESS.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-08 16:10:33'),(217,7,7,'TASK_STATUS_CHANGED','TASK',14,'P23 active A changed from IN_PROGRESS to COMPLETED.',NULL,'{\"status\": \"COMPLETED\"}',NULL,NULL,NULL,'2026-09-08 16:10:33'),(218,2,2,'TASK_CREATED','TASK',16,'P23 review image was created as TO_DO.',NULL,'{\"status\": \"TO_DO\"}',NULL,NULL,NULL,'2026-09-08 16:10:33'),(219,7,7,'TASK_STATUS_CHANGED','TASK',16,'P23 review image changed from TO_DO to IN_PROGRESS.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-08 16:10:33'),(220,7,7,'TASK_STATUS_CHANGED','TASK',16,'P23 review image changed from IN_PROGRESS to SUBMITTED_FOR_REVIEW.',NULL,'{\"status\": \"SUBMITTED_FOR_REVIEW\"}',NULL,NULL,NULL,'2026-09-08 16:10:33'),(221,2,2,'TASK_STATUS_CHANGED','TASK',16,'P23 review image changed from SUBMITTED_FOR_REVIEW to CHANGES_REQUIRED.',NULL,'{\"reason\": \"Please correct the result.\", \"status\": \"CHANGES_REQUIRED\"}',NULL,NULL,NULL,'2026-09-08 16:10:33'),(222,7,7,'TASK_STATUS_CHANGED','TASK',16,'P23 review image changed from CHANGES_REQUIRED to IN_PROGRESS.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-08 16:10:33'),(223,7,7,'TASK_STATUS_CHANGED','TASK',16,'P23 review image changed from IN_PROGRESS to SUBMITTED_FOR_REVIEW.',NULL,'{\"status\": \"SUBMITTED_FOR_REVIEW\"}',NULL,NULL,NULL,'2026-09-08 16:10:33'),(224,2,2,'TASK_STATUS_CHANGED','TASK',16,'P23 review image changed from SUBMITTED_FOR_REVIEW to COMPLETED.',NULL,'{\"status\": \"COMPLETED\"}',NULL,NULL,NULL,'2026-09-08 16:10:33'),(225,2,2,'TASK_STATUS_CHANGED','TASK',9,'task 2 changed from SUBMITTED_FOR_REVIEW to COMPLETED.',NULL,'{\"status\": \"COMPLETED\"}',NULL,NULL,NULL,'2026-09-08 16:10:42'),(226,2,2,'TASK_CREATED','TASK',17,'P23 claim limit 0 was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-08 16:11:37'),(227,2,2,'TASK_CREATED','TASK',18,'P23 claim limit 1 was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-08 16:11:37'),(228,2,2,'TASK_CREATED','TASK',19,'P23 claim limit 2 was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-08 16:11:37'),(229,2,2,'TASK_CREATED','TASK',20,'P23 claim limit 3 was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-08 16:11:37'),(230,7,7,'TASK_CLAIMED','TASK',17,'P23 claim limit 0 was claimed.',NULL,'{}',NULL,NULL,NULL,'2026-09-08 16:11:37'),(231,7,7,'TASK_CLAIMED','TASK',18,'P23 claim limit 1 was claimed.',NULL,'{}',NULL,NULL,NULL,'2026-09-08 16:11:37'),(232,7,7,'TASK_CLAIMED','TASK',19,'P23 claim limit 2 was claimed.',NULL,'{}',NULL,NULL,NULL,'2026-09-08 16:11:37'),(233,2,2,'TASK_CREATED','TASK',21,'P24 drawer integration was created as TO_DO.',NULL,'{\"status\": \"TO_DO\"}',NULL,NULL,NULL,'2026-09-08 16:29:27'),(234,7,7,'TASK_STATUS_CHANGED','TASK',21,'P24 drawer integration changed from TO_DO to IN_PROGRESS.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-08 16:29:27'),(235,7,7,'TASK_STATUS_CHANGED','TASK',21,'P24 drawer integration changed from IN_PROGRESS to SUBMITTED_FOR_REVIEW.',NULL,'{\"status\": \"SUBMITTED_FOR_REVIEW\"}',NULL,NULL,NULL,'2026-09-08 16:29:27'),(236,2,2,'TASK_STATUS_CHANGED','TASK',21,'P24 drawer integration changed from SUBMITTED_FOR_REVIEW to CHANGES_REQUIRED.',NULL,'{\"reason\": \"Adjust the marked area.\", \"status\": \"CHANGES_REQUIRED\", \"revisionDueAt\": \"2026-09-09T16:29:27.655Z\"}',NULL,NULL,NULL,'2026-09-08 16:29:27'),(237,2,2,'TASK_CREATED','TASK',22,'sd was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-08 16:31:31'),(238,7,7,'TASK_CLAIMED','TASK',22,'sd was claimed.',NULL,'{}',NULL,NULL,NULL,'2026-09-08 16:31:54'),(239,7,7,'TASK_STATUS_CHANGED','TASK',22,'sd changed from TO_DO to IN_PROGRESS.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-08 16:32:08'),(240,7,7,'TASK_STATUS_CHANGED','TASK',22,'sd changed from IN_PROGRESS to COMPLETED.',NULL,'{\"status\": \"COMPLETED\"}',NULL,NULL,NULL,'2026-09-08 16:32:48'),(241,2,2,'NOTIFICATION_POLICY_UPDATED','NOTIFICATION_POLICY',NULL,'Company notification policies updated.',NULL,'[{\"id\": 1, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 2, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 3, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 4, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 5, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 6, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 7, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 8, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 9, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 10, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 11, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 12, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 13, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 14, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 15, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 16, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 17, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 18, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 19, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 20, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 21, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 22, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 23, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}]',NULL,NULL,NULL,'2026-09-08 16:53:25'),(242,2,2,'NOTIFICATION_POLICY_UPDATED','NOTIFICATION_POLICY',NULL,'Company notification policies updated.',NULL,'[{\"id\": 1, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 2, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 3, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 4, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 5, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 6, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 7, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 8, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 9, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 10, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 11, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 12, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 13, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 14, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 15, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 16, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 17, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 18, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 19, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 20, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 21, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 22, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 23, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}]',NULL,NULL,NULL,'2026-09-08 16:53:26'),(243,2,2,'NOTIFICATION_POLICY_UPDATED','NOTIFICATION_POLICY',NULL,'Company notification policies updated.',NULL,'[{\"id\": 1, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 2, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 3, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 4, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 5, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 6, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 7, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 8, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 9, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 10, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 11, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 12, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 13, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 14, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 15, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 16, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 17, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 18, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 19, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 20, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 21, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 22, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 23, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}]',NULL,NULL,NULL,'2026-09-08 16:53:26'),(244,2,2,'NOTIFICATION_POLICY_UPDATED','NOTIFICATION_POLICY',NULL,'Company notification policies updated.',NULL,'[{\"id\": 1, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 2, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 3, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 4, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 5, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 6, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 7, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 8, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 9, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 10, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 11, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 12, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 13, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 14, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 15, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 16, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 17, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 18, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 19, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 20, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 21, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 22, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 23, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}]',NULL,NULL,NULL,'2026-09-08 16:53:27'),(245,2,2,'NOTIFICATION_POLICY_UPDATED','NOTIFICATION_POLICY',NULL,'Company notification policies updated.',NULL,'[{\"id\": 1, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 2, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 3, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 4, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 5, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 6, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 7, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 8, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 9, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 10, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 11, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 12, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 13, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 14, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 15, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 16, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 17, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 18, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 19, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 20, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 21, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 22, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 23, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}]',NULL,NULL,NULL,'2026-09-08 16:53:27'),(246,2,2,'TASK_CREATED','TASK',23,'testing 3454 was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-08 16:54:02'),(247,7,7,'TASK_CLAIMED','TASK',23,'testing 3454 was claimed.',NULL,'{}',NULL,NULL,NULL,'2026-09-08 16:54:16'),(248,7,7,'TASK_STATUS_CHANGED','TASK',23,'testing 3454 changed from TO_DO to IN_PROGRESS.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-08 16:54:20'),(249,7,7,'TASK_STATUS_CHANGED','TASK',23,'testing 3454 changed from IN_PROGRESS to SUBMITTED_FOR_REVIEW.',NULL,'{\"status\": \"SUBMITTED_FOR_REVIEW\"}',NULL,NULL,NULL,'2026-09-08 16:54:28'),(250,2,2,'TASK_STATUS_CHANGED','TASK',23,'testing 3454 changed from SUBMITTED_FOR_REVIEW to COMPLETED.',NULL,'{\"status\": \"COMPLETED\"}',NULL,NULL,NULL,'2026-09-08 16:54:37'),(251,7,7,'SESSION_EXPIRED','AUTH_SESSION',7,'Huzaifa Mustafa\'s login session expired after the maximum 8-hour duration.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 01:05:08'),(252,2,2,'TASK_CREATED','TASK',24,'P25 Alpha was created as TO_DO.',NULL,'{\"status\": \"TO_DO\"}',NULL,NULL,NULL,'2026-09-09 04:09:09'),(253,2,2,'TASK_CREATED','TASK',25,'P25 Beta was created as TO_DO.',NULL,'{\"status\": \"TO_DO\"}',NULL,NULL,NULL,'2026-09-09 04:09:09'),(254,2,2,'TASK_CREATED','TASK',26,'P25 Delete was created as DRAFT.',NULL,'{\"status\": \"DRAFT\"}',NULL,NULL,NULL,'2026-09-09 04:09:09'),(255,2,2,'TASK_DEADLINE_CHANGED','TASK',24,'P25 Alpha edited deadline changed.',NULL,'{\"reason\": \"Customer timing\", \"newDueAt\": \"2026-09-21T14:00:00+05:00\", \"previousDueAt\": \"2026-09-20 12:00:00\"}',NULL,NULL,NULL,'2026-09-09 04:09:09'),(256,2,2,'TASK_CREATED','TASK',27,'P25 Alpha was created as TO_DO.',NULL,'{\"status\": \"TO_DO\"}',NULL,NULL,NULL,'2026-09-09 04:09:30'),(257,2,2,'TASK_CREATED','TASK',28,'P25 Beta was created as TO_DO.',NULL,'{\"status\": \"TO_DO\"}',NULL,NULL,NULL,'2026-09-09 04:09:30'),(258,2,2,'TASK_CREATED','TASK',29,'P25 Delete was created as DRAFT.',NULL,'{\"status\": \"DRAFT\"}',NULL,NULL,NULL,'2026-09-09 04:09:30'),(259,2,2,'TASK_DEADLINE_CHANGED','TASK',27,'P25 Alpha edited deadline changed.',NULL,'{\"reason\": \"Customer timing\", \"newDueAt\": \"2026-09-21T14:00:00+05:00\", \"previousDueAt\": \"2026-09-20 12:00:00\"}',NULL,NULL,NULL,'2026-09-09 04:09:30'),(260,2,2,'TASK_REASSIGNED','TASK',27,'P25 Alpha edited was reassigned.',NULL,'{\"employeeId\": 7}',NULL,NULL,NULL,'2026-09-09 04:09:30'),(261,2,2,'TASK_REASSIGNED','TASK',28,'P25 Beta was reassigned.',NULL,'{\"reason\": \"Coverage handoff\", \"employeeId\": 7}',NULL,NULL,NULL,'2026-09-09 04:09:30'),(262,2,2,'TASK_STATUS_CHANGED','TASK',27,'P25 Alpha edited changed from COMPLETED to ARCHIVED.',NULL,'{\"status\": \"ARCHIVED\"}',NULL,NULL,NULL,'2026-09-09 04:09:30'),(263,2,2,'TASK_STATUS_CHANGED','TASK',27,'P25 Alpha edited changed from ARCHIVED to COMPLETED.',NULL,'{\"status\": \"COMPLETED\"}',NULL,NULL,NULL,'2026-09-09 04:09:30'),(265,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-09 17:13:43.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 04:13:43'),(266,3,3,'USER_LOGIN','AUTH_SESSION',3,'Huzaifa Mustafa signed in. Session expires at 2026-09-09 17:14:24.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 04:14:24'),(267,3,3,'USER_LOGOUT','AUTH_SESSION',3,'malikhuzaifa1126@gmail.com signed out and revoked the active session.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 04:14:42'),(268,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for huzaifa1126@gmail.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 04:14:52'),(269,7,7,'USER_LOGIN','AUTH_SESSION',7,'Huzaifa Mustafa signed in. Session expires at 2026-09-09 17:14:59.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 04:14:59'),(270,7,7,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',16,'Huzaifa Mustafa clocked out at 09:15 am.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 04:15:06'),(271,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for ceo@example.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 04:15:55'),(272,2,2,'TASK_STATUS_CHANGED','TASK',23,'testing 3454 changed from COMPLETED to ARCHIVED.',NULL,'{\"status\": \"ARCHIVED\"}',NULL,NULL,NULL,'2026-09-09 04:19:55'),(273,2,2,'TASK_STATUS_CHANGED','TASK',22,'sd changed from COMPLETED to ARCHIVED.',NULL,'{\"status\": \"ARCHIVED\"}',NULL,NULL,NULL,'2026-09-09 04:20:00'),(274,2,2,'TASK_STATUS_CHANGED','TASK',9,'task 2 changed from COMPLETED to ARCHIVED.',NULL,'{\"status\": \"ARCHIVED\"}',NULL,NULL,NULL,'2026-09-09 04:20:05'),(275,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-09 18:01:03.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 05:01:03'),(276,7,7,'LOGIN_FAILED','USER',7,'Failed login attempt for huzaifa@gmail.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 05:47:41'),(277,7,7,'USER_LOGIN','AUTH_SESSION',7,'Huzaifa Mustafa signed in. Session expires at 2026-09-09 18:47:48.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 05:47:48'),(278,2,2,'TASK_CREATED','TASK',30,'test ing was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-09 05:49:26'),(279,7,7,'TASK_CLAIMED','TASK',30,'test ing was claimed.',NULL,'{}',NULL,NULL,NULL,'2026-09-09 05:49:44'),(280,7,7,'ATTENDANCE_CLOCK_IN','ATTENDANCE',18,'Huzaifa Mustafa clocked in at 10:50 am.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 05:50:30'),(281,7,7,'TASK_STATUS_CHANGED','TASK',30,'test ing changed from TO_DO to IN_PROGRESS.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-09 05:50:35'),(282,7,7,'TASK_STATUS_CHANGED','TASK',30,'test ing changed from IN_PROGRESS to COMPLETED.',NULL,'{\"status\": \"COMPLETED\"}',NULL,NULL,NULL,'2026-09-09 05:51:04'),(283,7,7,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',18,'Huzaifa Mustafa clocked out at 10:51 am.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 05:51:56'),(284,2,2,'SESSION_EXPIRED','AUTH_SESSION',2,'System Admin\'s login session expired after the maximum 8-hour duration.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 13:16:32'),(285,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-10 03:15:38.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 14:15:38'),(286,2,2,'TASK_STATUS_CHANGED','TASK',30,'test ing changed from COMPLETED to ARCHIVED.',NULL,'{\"status\": \"ARCHIVED\"}',NULL,NULL,NULL,'2026-09-09 15:23:41'),(287,3,3,'USER_LOGIN','AUTH_SESSION',3,'Huzaifa Mustafa signed in. Session expires at 2026-09-10 04:24:43.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 15:24:43'),(288,3,3,'ATTENDANCE_CLOCK_IN','ATTENDANCE',19,'Huzaifa Mustafa clocked in at 08:24 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 15:24:45'),(289,2,2,'TASK_CREATED','TASK',31,'testing was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-09 15:39:29'),(290,3,3,'TASK_CLAIMED','TASK',31,'testing was claimed.',NULL,'{}',NULL,NULL,NULL,'2026-09-09 15:42:00'),(291,3,3,'USER_LOGOUT','AUTH_SESSION',3,'malikhuzaifa1126@gmail.com signed out and revoked the active session.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 15:42:47'),(292,7,7,'USER_LOGIN','AUTH_SESSION',7,'Huzaifa Mustafa signed in. Session expires at 2026-09-10 04:43:03.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 15:43:03'),(293,2,2,'TASK_CREATED','TASK',32,'testdsyu1234 was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-09 15:44:00'),(294,7,7,'TASK_CLAIMED','TASK',32,'testdsyu1234 was claimed.',NULL,'{}',NULL,NULL,NULL,'2026-09-09 15:44:24'),(295,2,2,'EMPLOYEE_CREATED','EMPLOYEE',8,'Employee huz Mustafa was created.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 15:45:30'),(296,7,7,'USER_LOGOUT','AUTH_SESSION',7,'huzaifa@gmail.com signed out and revoked the active session.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 15:45:35'),(297,8,8,'LOGIN_FAILED','USER',8,'Failed login attempt for malik@gmail.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 15:45:46'),(298,8,8,'USER_LOGIN','AUTH_SESSION',8,'huz Mustafa signed in. Session expires at 2026-09-10 04:45:53.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 15:45:53'),(299,8,8,'ATTENDANCE_CLOCK_IN','ATTENDANCE',20,'huz Mustafa clocked in at 08:46 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 15:46:07'),(300,2,2,'TASK_CREATED','TASK',33,'fgeft5er was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-09 15:46:31'),(301,8,8,'TASK_CLAIMED','TASK',33,'fgeft5er was claimed.',NULL,'{}',NULL,NULL,NULL,'2026-09-09 15:46:41'),(302,8,8,'TASK_STATUS_CHANGED','TASK',33,'fgeft5er changed from TO_DO to IN_PROGRESS.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-09 15:46:48'),(303,8,8,'TASK_STATUS_CHANGED','TASK',33,'fgeft5er changed from IN_PROGRESS to SUBMITTED_FOR_REVIEW.',NULL,'{\"note\": \"hgfghf\", \"status\": \"SUBMITTED_FOR_REVIEW\"}',NULL,NULL,NULL,'2026-09-09 15:50:30'),(304,2,2,'TASK_STATUS_CHANGED','TASK',33,'fgeft5er changed from SUBMITTED_FOR_REVIEW to COMPLETED.',NULL,'{\"note\": \"gfg\", \"status\": \"COMPLETED\"}',NULL,NULL,NULL,'2026-09-09 15:51:51'),(305,2,2,'TASK_CREATED','TASK',34,'x email change was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-09 15:54:43'),(306,8,8,'TASK_CLAIMED','TASK',34,'x email change was claimed.',NULL,'{}',NULL,NULL,NULL,'2026-09-09 15:55:02'),(307,8,8,'TASK_STATUS_CHANGED','TASK',34,'x email change changed from TO_DO to IN_PROGRESS.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-09 15:55:05'),(308,2,2,'TASK_CREATED','TASK',35,'gmail change to outlook this person huzaifa was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-09 15:55:52'),(309,8,8,'TASK_CLAIMED','TASK',35,'gmail change to outlook this person huzaifa was claimed.',NULL,'{}',NULL,NULL,NULL,'2026-09-09 15:56:03'),(310,8,8,'TASK_STATUS_CHANGED','TASK',34,'x email change changed from IN_PROGRESS to SUBMITTED_FOR_REVIEW.',NULL,'{\"status\": \"SUBMITTED_FOR_REVIEW\"}',NULL,NULL,NULL,'2026-09-09 15:56:18'),(311,8,8,'TASK_STATUS_CHANGED','TASK',35,'gmail change to outlook this person huzaifa changed from TO_DO to IN_PROGRESS.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-09 15:56:23'),(312,8,8,'TASK_STATUS_CHANGED','TASK',35,'gmail change to outlook this person huzaifa changed from IN_PROGRESS to COMPLETED.',NULL,'{\"status\": \"COMPLETED\"}',NULL,NULL,NULL,'2026-09-09 15:57:11'),(313,2,2,'TASK_STATUS_CHANGED','TASK',34,'x email change changed from SUBMITTED_FOR_REVIEW to COMPLETED.',NULL,'{\"status\": \"COMPLETED\"}',NULL,NULL,NULL,'2026-09-09 16:03:49'),(314,2,2,'TASK_STATUS_CHANGED','TASK',34,'x email change changed from COMPLETED to ARCHIVED.',NULL,'{\"status\": \"ARCHIVED\"}',NULL,NULL,NULL,'2026-09-09 16:03:55'),(315,2,2,'TASK_STATUS_CHANGED','TASK',35,'gmail change to outlook this person huzaifa changed from COMPLETED to ARCHIVED.',NULL,'{\"status\": \"ARCHIVED\"}',NULL,NULL,NULL,'2026-09-09 16:03:58'),(316,2,2,'TASK_STATUS_CHANGED','TASK',33,'fgeft5er changed from COMPLETED to ARCHIVED.',NULL,'{\"status\": \"ARCHIVED\"}',NULL,NULL,NULL,'2026-09-09 16:03:59'),(317,2,2,'TASK_CREATED','TASK',36,'fjhdsf was created as TO_DO.',NULL,'{\"status\": \"TO_DO\"}',NULL,NULL,NULL,'2026-09-09 16:05:20'),(318,8,8,'TASK_STATUS_CHANGED','TASK',36,'fjhdsf changed from TO_DO to IN_PROGRESS.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-09 16:06:33'),(319,8,8,'USER_LOGOUT','AUTH_SESSION',8,'malik@gmail.com signed out and revoked the active session.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 16:08:19'),(320,7,7,'USER_LOGIN','AUTH_SESSION',7,'Huzaifa Mustafa signed in. Session expires at 2026-09-10 05:08:32.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 16:08:32'),(321,7,7,'USER_LOGOUT','AUTH_SESSION',7,'huzaifa@gmail.com signed out and revoked the active session.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 16:09:46'),(322,3,3,'USER_LOGIN','AUTH_SESSION',3,'Huzaifa Mustafa signed in. Session expires at 2026-09-10 05:09:59.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 16:09:59'),(323,3,3,'BREAK_STARTED','ATTENDANCE',19,'Huzaifa Mustafa started a break at 09:10 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 16:10:21'),(324,3,3,'BREAK_ENDED','ATTENDANCE',19,'Huzaifa Mustafa ended a break at 09:10 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 16:10:24'),(325,3,3,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',19,'Huzaifa Mustafa clocked out at 09:10 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 16:10:25'),(326,3,3,'USER_LOGOUT','AUTH_SESSION',3,'malikhuzaifa1126@gmail.com signed out and revoked the active session.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 16:20:58'),(327,8,8,'USER_LOGIN','AUTH_SESSION',8,'huz Mustafa signed in. Session expires at 2026-09-10 05:21:09.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 16:21:09'),(328,2,2,'TASK_DELETED','TASK',33,'fgeft5er was permanently deleted.','{\"title\": \"fgeft5er\", \"status\": \"ARCHIVED\"}',NULL,NULL,NULL,NULL,'2026-09-09 16:22:26'),(329,2,2,'TASK_CREATED','TASK',37,'eewtyrays was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-09 16:23:33'),(330,8,8,'TASK_CLAIMED','TASK',37,'eewtyrays was claimed.',NULL,'{}',NULL,NULL,NULL,'2026-09-09 16:24:31'),(331,8,8,'TASK_STATUS_CHANGED','TASK',36,'fjhdsf changed from IN_PROGRESS to COMPLETED.',NULL,'{\"status\": \"COMPLETED\"}',NULL,NULL,NULL,'2026-09-09 16:25:21'),(332,8,8,'TASK_STATUS_CHANGED','TASK',37,'eewtyrays changed from TO_DO to IN_PROGRESS.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-09 16:25:23'),(333,8,8,'TASK_STATUS_CHANGED','TASK',37,'eewtyrays changed from IN_PROGRESS to SUBMITTED_FOR_REVIEW.',NULL,'{\"note\": \"jgfjhsd\", \"status\": \"SUBMITTED_FOR_REVIEW\"}',NULL,NULL,NULL,'2026-09-09 16:26:27'),(334,2,2,'TASK_STATUS_CHANGED','TASK',37,'eewtyrays changed from SUBMITTED_FOR_REVIEW to CHANGES_REQUIRED.',NULL,'{\"reason\": \"sadafdahj\", \"status\": \"CHANGES_REQUIRED\", \"revisionDueAt\": null}',NULL,NULL,NULL,'2026-09-09 16:26:54'),(335,8,8,'TASK_STATUS_CHANGED','TASK',37,'eewtyrays changed from CHANGES_REQUIRED to IN_PROGRESS.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-09 16:27:03'),(336,8,8,'TASK_STATUS_CHANGED','TASK',37,'eewtyrays changed from IN_PROGRESS to SUBMITTED_FOR_REVIEW.',NULL,'{\"status\": \"SUBMITTED_FOR_REVIEW\"}',NULL,NULL,NULL,'2026-09-09 16:28:26'),(337,2,2,'TASK_STATUS_CHANGED','TASK',37,'eewtyrays changed from SUBMITTED_FOR_REVIEW to COMPLETED.',NULL,'{\"status\": \"COMPLETED\"}',NULL,NULL,NULL,'2026-09-09 16:29:32'),(338,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-10 06:19:26.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 17:19:26'),(339,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for ceo@example.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 17:59:41'),(340,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-10 07:12:59.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 18:12:59'),(341,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-10 07:19:42.',NULL,NULL,NULL,NULL,NULL,'2026-09-09 18:19:42'),(342,8,8,'SESSION_EXPIRED','AUTH_SESSION',8,'huz Mustafa\'s login session expired after the maximum 8-hour duration.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 01:01:53'),(343,2,2,'SESSION_EXPIRED','AUTH_SESSION',2,'System Admin\'s login session expired after the maximum 8-hour duration.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 03:02:17'),(344,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-11 03:46:55.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 14:46:55'),(345,3,3,'USER_LOGIN','AUTH_SESSION',3,'Huzaifa Mustafa signed in. Session expires at 2026-09-11 04:17:58.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 15:17:58'),(346,3,3,'ATTENDANCE_CLOCK_IN','ATTENDANCE',21,'Huzaifa Mustafa clocked in at 08:18 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 15:18:07'),(347,3,3,'TASK_STATUS_CHANGED','TASK',4,'testing changed from TO_DO to IN_PROGRESS.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-10 15:18:25'),(348,3,3,'TASK_STATUS_CHANGED','TASK',4,'testing changed from IN_PROGRESS to COMPLETED.',NULL,'{\"status\": \"COMPLETED\"}',NULL,NULL,NULL,'2026-09-10 15:26:33'),(349,3,3,'TASK_STATUS_CHANGED','TASK',31,'testing changed from TO_DO to IN_PROGRESS.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-10 15:27:43'),(350,3,3,'TASK_WORK_SESSION_PAUSED_BREAK','TASK',31,'Huzaifa Mustafa\'s active task work session was paused by Break Start.',NULL,'{\"reason\": \"BREAK\", \"breakId\": 14}',NULL,NULL,NULL,'2026-09-10 15:27:48'),(351,3,3,'BREAK_STARTED','ATTENDANCE',21,'Huzaifa Mustafa started a break at 08:27 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 15:27:48'),(352,3,3,'TASK_WORK_SESSION_RESUMED_BREAK_END','TASK',31,'Huzaifa Mustafa\'s task work session resumed automatically after Break End.',NULL,'{\"reason\": \"BREAK_ENDED\", \"breakId\": 14}',NULL,NULL,NULL,'2026-09-10 15:28:04'),(353,3,3,'BREAK_ENDED','ATTENDANCE',21,'Huzaifa Mustafa ended a break at 08:28 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 15:28:04'),(354,3,3,'TASK_STATUS_CHANGED','TASK',31,'testing changed from IN_PROGRESS to SUBMITTED_FOR_REVIEW.',NULL,'{\"status\": \"SUBMITTED_FOR_REVIEW\"}',NULL,NULL,NULL,'2026-09-10 15:28:25'),(355,2,2,'TASK_STATUS_CHANGED','TASK',31,'testing changed from SUBMITTED_FOR_REVIEW to COMPLETED.',NULL,'{\"status\": \"COMPLETED\"}',NULL,NULL,NULL,'2026-09-10 15:29:25'),(356,2,2,'TASK_STATUS_CHANGED','TASK',4,'testing changed from COMPLETED to ARCHIVED.',NULL,'{\"status\": \"ARCHIVED\"}',NULL,NULL,NULL,'2026-09-10 15:34:46'),(357,2,2,'TASK_STATUS_CHANGED','TASK',31,'testing changed from COMPLETED to ARCHIVED.',NULL,'{\"status\": \"ARCHIVED\"}',NULL,NULL,NULL,'2026-09-10 15:34:48'),(358,2,2,'TASK_STATUS_CHANGED','TASK',37,'eewtyrays changed from COMPLETED to ARCHIVED.',NULL,'{\"status\": \"ARCHIVED\"}',NULL,NULL,NULL,'2026-09-10 15:34:50'),(359,2,2,'TASK_STATUS_CHANGED','TASK',36,'fjhdsf changed from COMPLETED to ARCHIVED.',NULL,'{\"status\": \"ARCHIVED\"}',NULL,NULL,NULL,'2026-09-10 15:34:52'),(360,2,2,'TASK_DELETED','TASK',36,'fjhdsf was permanently deleted.','{\"title\": \"fjhdsf\", \"status\": \"ARCHIVED\"}',NULL,NULL,NULL,NULL,'2026-09-10 15:35:12'),(361,2,2,'TASK_DELETED','TASK',37,'eewtyrays was permanently deleted.','{\"title\": \"eewtyrays\", \"status\": \"ARCHIVED\"}',NULL,NULL,NULL,NULL,'2026-09-10 15:35:12'),(362,2,2,'TASK_DELETED','TASK',31,'testing was permanently deleted.','{\"title\": \"testing\", \"status\": \"ARCHIVED\"}',NULL,NULL,NULL,NULL,'2026-09-10 15:35:12'),(363,2,2,'TASK_DELETED','TASK',4,'testing was permanently deleted.','{\"title\": \"testing\", \"status\": \"ARCHIVED\"}',NULL,NULL,NULL,NULL,'2026-09-10 15:35:12'),(364,2,2,'TASK_DELETED','TASK',35,'gmail change to outlook this person huzaifa was permanently deleted.','{\"title\": \"gmail change to outlook this person huzaifa\", \"status\": \"ARCHIVED\"}',NULL,NULL,NULL,NULL,'2026-09-10 15:35:12'),(365,2,2,'TASK_DELETED','TASK',34,'x email change was permanently deleted.','{\"title\": \"x email change\", \"status\": \"ARCHIVED\"}',NULL,NULL,NULL,NULL,'2026-09-10 15:35:12'),(366,2,2,'TASK_DELETED','TASK',30,'test ing was permanently deleted.','{\"title\": \"test ing\", \"status\": \"ARCHIVED\"}',NULL,NULL,NULL,NULL,'2026-09-10 15:35:12'),(367,2,2,'TASK_DELETED','TASK',9,'task 2 was permanently deleted.','{\"title\": \"task 2\", \"status\": \"ARCHIVED\"}',NULL,NULL,NULL,NULL,'2026-09-10 15:35:12'),(368,2,2,'TASK_DELETED','TASK',22,'sd was permanently deleted.','{\"title\": \"sd\", \"status\": \"ARCHIVED\"}',NULL,NULL,NULL,NULL,'2026-09-10 15:35:12'),(369,2,2,'TASK_DELETED','TASK',23,'testing 3454 was permanently deleted.','{\"title\": \"testing 3454\", \"status\": \"ARCHIVED\"}',NULL,NULL,NULL,NULL,'2026-09-10 15:35:12'),(370,3,3,'AVAILABILITY_UPDATED','EMPLOYEE',3,'Manual availability updated.',NULL,'{\"until\": null, \"status\": \"AWAY\"}',NULL,NULL,NULL,'2026-09-10 15:51:49'),(371,3,3,'AVAILABILITY_UPDATED','EMPLOYEE',3,'Manual availability updated.',NULL,'{\"until\": \"2026-09-10T16:22:05.403Z\", \"status\": \"DO_NOT_DISTURB\"}',NULL,NULL,NULL,'2026-09-10 15:52:05'),(372,3,3,'AVAILABILITY_UPDATED','EMPLOYEE',3,'Manual availability updated.',NULL,'{\"until\": null, \"status\": \"AWAY\"}',NULL,NULL,NULL,'2026-09-10 15:52:10'),(373,2,2,'AVAILABILITY_UPDATED','EMPLOYEE',2,'Manual availability updated.',NULL,'{\"until\": null, \"status\": \"AWAY\"}',NULL,NULL,NULL,'2026-09-10 15:52:18'),(374,2,2,'AVAILABILITY_UPDATED','EMPLOYEE',2,'Manual availability updated.',NULL,'{\"until\": null, \"status\": \"AWAY\"}',NULL,NULL,NULL,'2026-09-10 16:02:37'),(375,2,2,'AVAILABILITY_CLEARED','EMPLOYEE',2,'Manual availability cleared.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 16:02:40'),(376,2,2,'AVAILABILITY_UPDATED','EMPLOYEE',2,'Manual availability updated.',NULL,'{\"until\": null, \"status\": \"AWAY\"}',NULL,NULL,NULL,'2026-09-10 16:02:57'),(377,2,2,'AVAILABILITY_UPDATED','EMPLOYEE',2,'Manual availability updated.',NULL,'{\"until\": \"2026-09-10T16:33:20.802Z\", \"status\": \"DO_NOT_DISTURB\"}',NULL,NULL,NULL,'2026-09-10 16:03:20'),(378,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for security-test@example.invalid from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 16:05:06'),(379,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for security-test@example.invalid from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 16:05:06'),(380,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for security-test@example.invalid from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 16:05:06'),(381,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for security-test@example.invalid from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 16:05:06'),(382,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for security-test@example.invalid from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 16:05:06'),(383,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for ceo@example.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 16:05:06'),(384,3,3,'AVAILABILITY_UPDATED','EMPLOYEE',3,'Manual availability updated.',NULL,'{\"until\": null, \"status\": \"AWAY\"}',NULL,NULL,NULL,'2026-09-10 16:33:00'),(385,2,2,'AVAILABILITY_UPDATED','EMPLOYEE',2,'Manual availability updated.',NULL,'{\"until\": null, \"status\": \"AWAY\"}',NULL,NULL,NULL,'2026-09-10 16:33:35'),(386,2,2,'AVAILABILITY_CLEARED','EMPLOYEE',2,'Manual availability cleared.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 16:33:37'),(387,3,3,'LOGIN_FAILED','USER',3,'Failed login attempt for malikhuzaifa1126@gmail.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 16:40:41'),(388,7,7,'USER_LOGIN','AUTH_SESSION',7,'Huzaifa Mustafa signed in. Session expires at 2026-09-11 05:40:58.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 16:40:58'),(389,7,7,'ATTENDANCE_CLOCK_IN','ATTENDANCE',22,'Huzaifa Mustafa clocked in at 09:41 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 16:41:10'),(390,7,7,'TASK_STATUS_CHANGED','TASK',32,'testdsyu1234 changed from TO_DO to IN_PROGRESS.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-10 16:41:16'),(391,7,7,'TASK_STATUS_CHANGED','TASK',32,'testdsyu1234 changed from IN_PROGRESS to SUBMITTED_FOR_REVIEW.',NULL,'{\"status\": \"SUBMITTED_FOR_REVIEW\"}',NULL,NULL,NULL,'2026-09-10 16:41:26'),(392,7,7,'USER_LOGOUT','AUTH_SESSION',7,'huzaifa@gmail.com signed out and revoked the active session.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 16:41:55'),(393,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for huzaifa1126@gmail.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 16:42:09'),(394,7,7,'USER_LOGIN','AUTH_SESSION',7,'Huzaifa Mustafa signed in. Session expires at 2026-09-11 05:42:14.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 16:42:14'),(395,2,2,'SESSION_REVOKED','AUTH_SESSION',NULL,'An administrator terminated an active login session.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 16:42:43'),(396,2,2,'AVAILABILITY_UPDATED','EMPLOYEE',2,'Manual availability updated.',NULL,'{\"until\": null, \"status\": \"AWAY\"}',NULL,NULL,NULL,'2026-09-10 16:43:23'),(397,2,2,'AVAILABILITY_UPDATED','EMPLOYEE',2,'Manual availability updated.',NULL,'{\"until\": null, \"status\": \"AWAY\"}',NULL,NULL,NULL,'2026-09-10 16:43:25'),(398,2,2,'AVAILABILITY_UPDATED','EMPLOYEE',2,'Manual availability updated.',NULL,'{\"until\": \"2026-09-10T16:58:27.860Z\", \"status\": \"IN_MEETING\"}',NULL,NULL,NULL,'2026-09-10 16:43:27'),(399,2,2,'USER_LOGOUT','AUTH_SESSION',2,'admin@remoteoffice.com signed out and revoked the active session.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 17:03:03'),(400,7,7,'USER_LOGIN','AUTH_SESSION',7,'Huzaifa Mustafa signed in. Session expires at 2026-09-11 06:03:17.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 17:03:17'),(401,7,7,'USER_LOGOUT','AUTH_SESSION',7,'huzaifa@gmail.com signed out and revoked the active session.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 17:09:09'),(402,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-11 06:09:11.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 17:09:11'),(403,2,2,'TASK_STATUS_CHANGED','TASK',32,'testdsyu1234 changed from SUBMITTED_FOR_REVIEW to COMPLETED.',NULL,'{\"status\": \"COMPLETED\"}',NULL,NULL,NULL,'2026-09-10 17:09:25'),(404,3,3,'SESSION_EXPIRED','AUTH_SESSION',3,'Huzaifa Mustafa\'s login session expired after the maximum 8-hour duration.',NULL,NULL,NULL,NULL,NULL,'2026-09-10 23:54:49'),(405,2,2,'SESSION_EXPIRED','AUTH_SESSION',2,'System Admin\'s login session expired after the maximum 8-hour duration.',NULL,NULL,NULL,NULL,NULL,'2026-09-11 02:35:43'),(406,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-12 03:49:25.',NULL,NULL,NULL,NULL,NULL,'2026-09-11 14:49:25'),(407,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-12 04:01:10.',NULL,NULL,NULL,NULL,NULL,'2026-09-11 15:01:10'),(408,2,2,'AVAILABILITY_UPDATED','EMPLOYEE',2,'Manual availability updated.',NULL,'{\"until\": null, \"status\": \"AWAY\"}',NULL,NULL,NULL,'2026-09-11 16:12:36'),(409,2,2,'AVAILABILITY_CLEARED','EMPLOYEE',2,'Manual availability cleared.',NULL,NULL,NULL,NULL,NULL,'2026-09-11 16:12:40'),(410,2,2,'AVAILABILITY_UPDATED','EMPLOYEE',2,'Manual availability updated.',NULL,'{\"until\": \"2026-09-11T16:42:42.483Z\", \"status\": \"DO_NOT_DISTURB\"}',NULL,NULL,NULL,'2026-09-11 16:12:42'),(411,2,2,'AVAILABILITY_UPDATED','EMPLOYEE',2,'Manual availability updated.',NULL,'{\"until\": \"2026-09-11T16:42:44.297Z\", \"status\": \"DO_NOT_DISTURB\"}',NULL,NULL,NULL,'2026-09-11 16:12:44'),(412,2,2,'AVAILABILITY_UPDATED','EMPLOYEE',2,'Manual availability updated.',NULL,'{\"until\": \"2026-09-11T16:27:45.666Z\", \"status\": \"IN_MEETING\"}',NULL,NULL,NULL,'2026-09-11 16:12:45'),(413,2,2,'AVAILABILITY_CLEARED','EMPLOYEE',2,'Manual availability cleared.',NULL,NULL,NULL,NULL,NULL,'2026-09-11 16:12:50'),(414,7,7,'USER_LOGIN','AUTH_SESSION',7,'Huzaifa Mustafa signed in. Session expires at 2026-09-12 05:38:10.',NULL,NULL,NULL,NULL,NULL,'2026-09-11 16:38:10'),(415,7,7,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',22,'Huzaifa Mustafa clocked out at 09:43 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-11 16:43:37'),(416,7,7,'ATTENDANCE_CLOCK_IN','ATTENDANCE',23,'Huzaifa Mustafa clocked in at 10:40 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-11 17:40:29'),(417,7,7,'AVAILABILITY_UPDATED','EMPLOYEE',7,'Manual availability updated.',NULL,'{\"until\": null, \"status\": \"AWAY\"}',NULL,NULL,NULL,'2026-09-11 17:40:41'),(418,2,2,'SESSION_EXPIRED','AUTH_SESSION',2,'System Admin\'s login session expired after the maximum 8-hour duration.',NULL,NULL,NULL,NULL,NULL,'2026-09-11 23:55:19'),(419,7,7,'SESSION_EXPIRED','AUTH_SESSION',7,'Huzaifa Mustafa\'s login session expired after the maximum 8-hour duration.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 01:01:44'),(420,3,3,'USER_LOGIN','AUTH_SESSION',3,'Huzaifa Mustafa signed in. Session expires at 2026-09-12 17:25:28.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 04:25:28'),(421,3,3,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',21,'Huzaifa Mustafa clocked out at 09:25 am.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 04:25:50'),(422,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-12 17:26:28.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 04:26:28'),(423,2,2,'HOLIDAY_CANCELLED','COMPANY_CALENDAR',8,'saturaday off was cancelled in the company calendar.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 04:26:53'),(424,2,2,'HOLIDAY_CREATED','COMPANY_CALENDAR',NULL,'test was added to the company calendar from 2026-09-14 to 2026-09-14.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 04:27:12'),(425,2,2,'NOTIFICATION_POLICY_UPDATED','NOTIFICATION_POLICY',NULL,'Company notification policies updated.',NULL,'[{\"id\": 1, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 2, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 3, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 4, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 5, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 6, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 7, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 8, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 9, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 10, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 11, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 12, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 13, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 14, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 15, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 16, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 17, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 18, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 19, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 20, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 21, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 22, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 23, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 24, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 25, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 26, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 27, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 28, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}]',NULL,NULL,NULL,'2026-09-12 04:28:18'),(426,2,2,'NOTIFICATION_POLICY_UPDATED','NOTIFICATION_POLICY',NULL,'Company notification policies updated.',NULL,'[{\"id\": 1, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 2, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 3, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 4, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 5, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 6, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 7, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 8, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 9, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 10, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 11, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 12, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 13, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 14, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 15, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 16, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 17, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 18, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 19, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 20, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 21, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 22, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 23, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 24, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 25, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 26, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 27, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 28, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}]',NULL,NULL,NULL,'2026-09-12 04:28:20'),(427,2,2,'NOTIFICATION_POLICY_UPDATED','NOTIFICATION_POLICY',NULL,'Company notification policies updated.',NULL,'[{\"id\": 1, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 2, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 3, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 4, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 5, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 6, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 7, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 8, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 9, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 10, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 11, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 12, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 13, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 14, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 15, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 16, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 17, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 18, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 19, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 20, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 21, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 22, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 23, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 24, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 25, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 26, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 27, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 28, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}]',NULL,NULL,NULL,'2026-09-12 04:28:20'),(428,2,2,'NOTIFICATION_POLICY_UPDATED','NOTIFICATION_POLICY',NULL,'Company notification policies updated.',NULL,'[{\"id\": 1, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 2, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 3, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 4, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 5, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 6, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 7, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 8, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 9, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 10, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 11, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 12, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 13, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 14, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 15, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 16, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 17, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 18, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 19, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 20, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 21, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 22, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 23, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 24, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 25, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 26, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 27, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 28, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}]',NULL,NULL,NULL,'2026-09-12 04:28:20'),(429,2,2,'NOTIFICATION_POLICY_UPDATED','NOTIFICATION_POLICY',NULL,'Company notification policies updated.',NULL,'[{\"id\": 1, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 2, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 3, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 4, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 5, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 6, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 7, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 8, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 9, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 10, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 11, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 12, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 13, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 14, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 15, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 16, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 17, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 18, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 19, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 20, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 21, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 22, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 23, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 24, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 25, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 26, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 27, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 28, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 29, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 30, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 31, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 32, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 33, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 34, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 35, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 36, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 37, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 38, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 39, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 40, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 41, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 42, \"enabled\": true, \"mandatory\": false, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 43, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 44, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 45, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 46, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 47, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 48, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 49, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 50, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 51, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 52, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 53, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 54, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 55, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 56, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 57, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 58, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 59, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 60, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 61, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 62, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 63, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 64, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 65, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 66, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 67, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 68, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 69, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 70, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 71, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 72, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 73, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 74, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 75, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 76, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 77, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 78, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 79, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 80, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 81, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 82, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 83, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 84, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 85, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 86, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": true, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}]',NULL,NULL,NULL,'2026-09-12 08:14:11'),(430,2,2,'NOTIFICATION_POLICY_UPDATED','NOTIFICATION_POLICY',NULL,'Company notification policies updated.',NULL,'[{\"id\": 1, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 2, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 3, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 4, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 5, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 6, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 7, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 8, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 9, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 10, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 11, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 12, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 13, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 14, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 15, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 16, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 17, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 18, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 19, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 20, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 21, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 22, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 23, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 24, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 25, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 26, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 27, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 28, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 29, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 30, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 31, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 32, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 33, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 34, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 35, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 36, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 37, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 38, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 39, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 40, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 41, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 42, \"enabled\": true, \"mandatory\": false, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 43, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 44, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 45, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 46, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 47, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 48, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 49, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 50, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 51, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 52, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 53, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 54, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 55, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 56, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 57, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 58, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 59, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 60, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 61, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 62, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 63, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 64, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 65, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 66, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 67, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 68, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 69, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 70, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 71, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 72, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 73, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 74, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 75, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 76, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 77, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 78, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 79, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 80, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 81, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 82, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 83, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 84, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 85, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 86, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": true, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}]',NULL,NULL,NULL,'2026-09-12 08:14:11'),(431,2,2,'NOTIFICATION_POLICY_UPDATED','NOTIFICATION_POLICY',NULL,'Company notification policies updated.',NULL,'[{\"id\": 1, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 2, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 3, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 4, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 5, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 6, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 7, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 8, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 9, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 10, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 11, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 12, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 13, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 14, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 15, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 16, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 17, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 18, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 19, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 20, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 21, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 22, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 23, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 24, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 25, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 26, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 27, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 28, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 29, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 30, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 31, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 32, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 33, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 34, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 35, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 36, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 37, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 38, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 39, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 40, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 41, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 42, \"enabled\": true, \"mandatory\": false, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 43, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 44, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 45, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 46, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 47, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 48, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 49, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 50, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 51, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 52, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 53, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 54, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 55, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 56, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 57, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 58, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 59, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 60, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 61, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 62, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 63, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 64, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 65, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 66, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 67, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 68, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 69, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 70, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 71, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 72, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 73, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 74, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 75, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 76, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 77, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 78, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 79, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 80, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 81, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 82, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 83, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 84, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 85, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 86, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": true, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}]',NULL,NULL,NULL,'2026-09-12 08:14:12'),(432,2,2,'NOTIFICATION_POLICY_UPDATED','NOTIFICATION_POLICY',NULL,'Company notification policies updated.',NULL,'[{\"id\": 1, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 2, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 3, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 4, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 5, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 6, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 7, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 8, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 9, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 10, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 11, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 12, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 13, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 14, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 15, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 16, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 17, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 18, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 19, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 20, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 21, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 22, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 23, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 24, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 25, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 26, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 27, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 28, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 29, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 30, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 31, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 32, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 33, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 34, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 35, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 36, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 37, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 38, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 39, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 40, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 41, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 42, \"enabled\": true, \"mandatory\": false, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 43, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 44, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 45, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 46, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 47, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 48, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 49, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 50, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 51, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 52, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 53, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 54, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 55, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 56, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 57, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 58, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 59, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 60, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 61, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 62, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 63, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 64, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 65, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 66, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 67, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 68, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 69, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 70, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 71, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 72, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 73, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 74, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 75, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 76, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 77, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 78, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 79, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 80, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 81, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 82, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 83, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 84, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 85, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 86, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": true, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}]',NULL,NULL,NULL,'2026-09-12 08:14:12'),(433,2,2,'NOTIFICATION_POLICY_UPDATED','NOTIFICATION_POLICY',NULL,'Company notification policies updated.',NULL,'[{\"id\": 1, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 2, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 3, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 4, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 5, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 6, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 7, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 8, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 9, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 10, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 11, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 12, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 13, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 14, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 15, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 16, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 17, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 18, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 19, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 20, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 21, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 22, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 23, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 24, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 25, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 26, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 27, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 28, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 29, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 30, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 31, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 32, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 33, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 34, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 35, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 36, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 37, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 38, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 39, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 40, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 41, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 42, \"enabled\": true, \"mandatory\": false, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 43, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 44, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 45, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 46, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 47, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 48, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 49, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 50, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 51, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 52, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 53, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 54, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 55, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 56, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 57, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 58, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 59, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 60, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 61, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 62, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 63, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 64, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 65, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 66, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 67, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 68, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 69, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 70, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 71, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 72, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 73, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 74, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 75, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 76, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 77, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 78, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 79, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 80, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 81, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 82, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 83, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 84, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 85, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 86, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": true, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}]',NULL,NULL,NULL,'2026-09-12 08:14:12'),(434,2,2,'NOTIFICATION_POLICY_UPDATED','NOTIFICATION_POLICY',NULL,'Company notification policies updated.',NULL,'[{\"id\": 1, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 2, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 3, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 4, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 5, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 6, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 7, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 8, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 9, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 10, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 11, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 12, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 13, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 14, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 15, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 16, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 17, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 18, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 19, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 20, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 21, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 22, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 23, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 24, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 25, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 26, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 27, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 28, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 29, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 30, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 31, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 32, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 33, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 34, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 35, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 36, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 37, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 38, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 39, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 40, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 41, \"enabled\": true, \"mandatory\": true, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 42, \"enabled\": true, \"mandatory\": false, \"notifyActor\": true, \"pushEnabled\": true, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 43, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 44, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 45, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 46, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 47, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 48, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 49, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 50, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 51, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 52, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 53, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 54, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 55, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 56, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 57, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 58, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 59, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 60, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 61, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 62, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 63, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 64, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 65, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 66, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 67, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 68, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 69, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 70, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 71, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 72, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 73, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 74, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 75, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 76, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 77, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 78, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 79, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 80, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"CEO_ADMIN\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 81, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": false}, {\"id\": 82, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 83, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 84, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": false, \"desktopEnabled\": true}, {\"id\": 85, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": false, \"audienceType\": \"ALL_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}, {\"id\": 86, \"enabled\": true, \"mandatory\": false, \"notifyActor\": false, \"pushEnabled\": true, \"audienceType\": \"SELECTED_EMPLOYEES\", \"inAppEnabled\": true, \"soundEnabled\": true, \"desktopEnabled\": true}]',NULL,NULL,NULL,'2026-09-12 08:14:12'),(435,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-12 21:14:17.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:14:17'),(436,2,2,'SPECIAL_OFF_DAY_CREATED','COMPANY_CALENDAR',NULL,'test 2 was added to the company calendar from 2026-09-15 to 2026-09-15.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:14:53'),(437,2,2,'HOLIDAY_UPDATED','COMPANY_CALENDAR',15,'test was updated in the company calendar.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:15:57'),(438,2,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:18:50'),(439,3,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:19:30'),(440,3,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:19:34'),(441,2,2,'HOLIDAY_CANCELLED','COMPANY_CALENDAR',16,'test 2 was cancelled in the company calendar.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:19:57'),(442,2,2,'HOLIDAY_CANCELLED','COMPANY_CALENDAR',15,'test was cancelled in the company calendar.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:20:00'),(443,2,2,'SPECIAL_OFF_DAY_CREATED','COMPANY_CALENDAR',NULL,'testing was added to the company calendar from 2026-09-14 to 2026-09-14.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:20:17'),(444,3,3,'LEAVE_REQUESTED','LEAVE',18,'Huzaifa Mustafa requested leave from 2026-09-15 to 2026-09-15.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:20:47'),(445,2,2,'NOTIFICATION_SOUND_SETTINGS_UPDATED','NOTIFICATION_SOUND',NULL,'Company notification sound settings were updated.',NULL,'{\"assignments\": [], \"normalVolume\": 70, \"warningVolume\": 90, \"criticalVolume\": 100, \"defaultSoundId\": 1, \"importantVolume\": 85}',NULL,NULL,NULL,'2026-09-12 08:48:36'),(446,2,2,'NOTIFICATION_SOUND_SETTINGS_UPDATED','NOTIFICATION_SOUND',NULL,'Company notification sound settings were updated.',NULL,'{\"assignments\": [], \"normalVolume\": 70, \"warningVolume\": 90, \"criticalVolume\": 100, \"defaultSoundId\": 1, \"importantVolume\": 85}',NULL,NULL,NULL,'2026-09-12 08:48:44'),(447,2,2,'NOTIFICATION_SOUND_SETTINGS_UPDATED','NOTIFICATION_SOUND',NULL,'Company notification sound settings were updated.',NULL,'{\"assignments\": [], \"normalVolume\": 70, \"warningVolume\": 90, \"criticalVolume\": 100, \"defaultSoundId\": 1, \"importantVolume\": 85}',NULL,NULL,NULL,'2026-09-12 08:48:45'),(448,2,2,'NOTIFICATION_SOUND_SETTINGS_UPDATED','NOTIFICATION_SOUND',NULL,'Company notification sound settings were updated.',NULL,'{\"assignments\": [], \"normalVolume\": 70, \"warningVolume\": 90, \"criticalVolume\": 100, \"defaultSoundId\": 1, \"importantVolume\": 85}',NULL,NULL,NULL,'2026-09-12 08:48:48'),(449,2,2,'NOTIFICATION_SOUND_SETTINGS_UPDATED','NOTIFICATION_SOUND',NULL,'Company notification sound settings were updated.',NULL,'{\"assignments\": [], \"normalVolume\": 100, \"warningVolume\": 100, \"criticalVolume\": 100, \"defaultSoundId\": 1, \"importantVolume\": 100}',NULL,NULL,NULL,'2026-09-12 08:49:41'),(450,2,2,'NOTIFICATION_SOUND_SETTINGS_UPDATED','NOTIFICATION_SOUND',NULL,'Company notification sound settings were updated.',NULL,'{\"assignments\": [], \"normalVolume\": 100, \"warningVolume\": 100, \"criticalVolume\": 100, \"defaultSoundId\": 1, \"importantVolume\": 100}',NULL,NULL,NULL,'2026-09-12 08:49:56'),(451,2,2,'NOTIFICATION_SOUND_UPLOADED','NOTIFICATION_SOUND',6,'Notification sound sound test was uploaded.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:49:57'),(452,2,2,'NOTIFICATION_SOUND_SETTINGS_UPDATED','NOTIFICATION_SOUND',NULL,'Company notification sound settings were updated.',NULL,'{\"assignments\": [], \"normalVolume\": 100, \"warningVolume\": 100, \"criticalVolume\": 100, \"defaultSoundId\": 1, \"importantVolume\": 100}',NULL,NULL,NULL,'2026-09-12 08:49:59'),(453,2,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:50:27'),(454,3,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:51:27'),(455,7,7,'USER_LOGIN','AUTH_SESSION',7,'Huzaifa Mustafa signed in. Session expires at 2026-09-12 21:51:59.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:51:59'),(456,7,7,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',23,'Huzaifa Mustafa clocked out at 01:52 pm.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:52:02'),(457,7,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:52:46'),(458,2,2,'TASK_CREATED','TASK',38,'test was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-12 08:53:13'),(459,7,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:53:55'),(460,7,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:53:59'),(461,7,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:54:00'),(462,7,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:54:00'),(463,7,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:54:22'),(464,7,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:55:28'),(465,7,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:55:40'),(466,7,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:58:03'),(467,3,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:58:14'),(468,3,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:58:52'),(469,2,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:59:17'),(470,2,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 08:59:22'),(471,2,2,'NOTIFICATION_SOUND_SETTINGS_UPDATED','NOTIFICATION_SOUND',NULL,'Company notification sound settings were updated.',NULL,'{\"assignments\": [], \"normalVolume\": 100, \"warningVolume\": 100, \"criticalVolume\": 100, \"defaultSoundId\": 6, \"importantVolume\": 100}',NULL,NULL,NULL,'2026-09-12 08:59:39'),(472,2,2,'NOTIFICATION_SOUND_SETTINGS_UPDATED','NOTIFICATION_SOUND',NULL,'Company notification sound settings were updated.',NULL,'{\"assignments\": [{\"soundId\": 6, \"scopeKey\": \"LEAVE\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"TASK\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"PAYROLL\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"SYSTEM\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"CALENDAR\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"SECURITY\", \"scopeType\": \"CATEGORY\"}], \"normalVolume\": 100, \"warningVolume\": 100, \"criticalVolume\": 100, \"defaultSoundId\": 6, \"importantVolume\": 100}',NULL,NULL,NULL,'2026-09-12 08:59:57'),(473,2,2,'NOTIFICATION_SOUND_SETTINGS_UPDATED','NOTIFICATION_SOUND',NULL,'Company notification sound settings were updated.',NULL,'{\"assignments\": [{\"soundId\": 6, \"scopeKey\": \"CALENDAR\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"LEAVE\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"PAYROLL\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"SECURITY\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"SYSTEM\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"TASK\", \"scopeType\": \"CATEGORY\"}], \"normalVolume\": 100, \"warningVolume\": 100, \"criticalVolume\": 100, \"defaultSoundId\": 6, \"importantVolume\": 100}',NULL,NULL,NULL,'2026-09-12 08:59:59'),(474,2,2,'NOTIFICATION_SOUND_SETTINGS_UPDATED','NOTIFICATION_SOUND',NULL,'Company notification sound settings were updated.',NULL,'{\"assignments\": [{\"soundId\": 6, \"scopeKey\": \"CALENDAR\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"LEAVE\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"PAYROLL\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"SECURITY\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"SYSTEM\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"TASK\", \"scopeType\": \"CATEGORY\"}], \"normalVolume\": 100, \"warningVolume\": 100, \"criticalVolume\": 100, \"defaultSoundId\": 6, \"importantVolume\": 100}',NULL,NULL,NULL,'2026-09-12 08:59:59'),(475,2,2,'NOTIFICATION_SOUND_SETTINGS_UPDATED','NOTIFICATION_SOUND',NULL,'Company notification sound settings were updated.',NULL,'{\"assignments\": [{\"soundId\": 6, \"scopeKey\": \"CALENDAR\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"LEAVE\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"PAYROLL\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"SECURITY\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"SYSTEM\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"TASK\", \"scopeType\": \"CATEGORY\"}], \"normalVolume\": 100, \"warningVolume\": 100, \"criticalVolume\": 100, \"defaultSoundId\": 6, \"importantVolume\": 100}',NULL,NULL,NULL,'2026-09-12 08:59:59'),(476,2,2,'NOTIFICATION_SOUND_SETTINGS_UPDATED','NOTIFICATION_SOUND',NULL,'Company notification sound settings were updated.',NULL,'{\"assignments\": [{\"soundId\": 6, \"scopeKey\": \"CALENDAR\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"LEAVE\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"PAYROLL\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"SECURITY\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"SYSTEM\", \"scopeType\": \"CATEGORY\"}, {\"soundId\": 6, \"scopeKey\": \"TASK\", \"scopeType\": \"CATEGORY\"}], \"normalVolume\": 100, \"warningVolume\": 100, \"criticalVolume\": 100, \"defaultSoundId\": 6, \"importantVolume\": 100}',NULL,NULL,NULL,'2026-09-12 09:00:00'),(477,2,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 09:00:02'),(478,7,7,'AVAILABILITY_CLEARED','EMPLOYEE',7,'Manual availability cleared.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 09:14:44'),(479,7,7,'AVAILABILITY_UPDATED','EMPLOYEE',7,'Manual availability updated.',NULL,'{\"until\": null, \"status\": \"AWAY\"}',NULL,NULL,NULL,'2026-09-12 09:14:48'),(480,7,7,'AVAILABILITY_CLEARED','EMPLOYEE',7,'Manual availability cleared.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 09:14:49'),(481,7,7,'AVAILABILITY_UPDATED','EMPLOYEE',7,'Manual availability updated.',NULL,'{\"until\": \"2026-09-12T09:44:52.012Z\", \"status\": \"DO_NOT_DISTURB\"}',NULL,NULL,NULL,'2026-09-12 09:14:55'),(482,7,7,'AVAILABILITY_CLEARED','EMPLOYEE',7,'Manual availability cleared.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 09:14:59'),(483,7,7,'USER_LOGOUT','AUTH_SESSION',7,'huzaifa@gmail.com signed out and revoked the active session.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 09:14:59'),(484,3,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 09:27:25'),(485,3,NULL,'NOTIFICATION_PREFERENCES_UPDATED','NOTIFICATION_PREFERENCE',NULL,'Notification preferences were updated.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 09:27:26'),(499,2,2,'TASK_CREATED','TASK',47,'tash was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-12 09:58:46'),(500,3,3,'SESSION_EXPIRED','AUTH_SESSION',3,'Huzaifa Mustafa\'s login session expired after the maximum 8-hour duration.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 13:00:56'),(501,2,2,'SESSION_EXPIRED','AUTH_SESSION',2,'System Admin\'s login session expired after the maximum 8-hour duration.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 13:00:57'),(502,2,2,'SESSION_EXPIRED','AUTH_SESSION',2,'System Admin\'s login session expired after the maximum 8-hour duration.',NULL,NULL,NULL,NULL,NULL,'2026-09-12 16:17:50'),(503,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-14 18:43:34.',NULL,NULL,NULL,NULL,NULL,'2026-09-14 05:43:34'),(504,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for test@gmail.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-14 05:59:14'),(505,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for test@gmail.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-14 05:59:21'),(506,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for test@gmail.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-14 05:59:27'),(507,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for test@gmail.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-14 05:59:33'),(508,NULL,NULL,'LOGIN_FAILED','USER',NULL,'Failed login attempt for test@gmail.com from 127.0.0.1.',NULL,NULL,NULL,NULL,NULL,'2026-09-14 05:59:35'),(509,7,7,'USER_LOGIN','AUTH_SESSION',7,'Huzaifa Mustafa signed in. Session expires at 2026-09-14 18:59:50.',NULL,NULL,NULL,NULL,NULL,'2026-09-14 05:59:50'),(510,2,2,'SESSION_EXPIRED','AUTH_SESSION',2,'System Admin\'s login session expired after the maximum 8-hour duration.',NULL,NULL,NULL,NULL,NULL,'2026-09-14 13:45:12'),(511,7,7,'SESSION_EXPIRED','AUTH_SESSION',7,'Huzaifa Mustafa\'s login session expired after the maximum 8-hour duration.',NULL,NULL,NULL,NULL,NULL,'2026-09-14 14:44:50'),(512,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-15 03:52:03.',NULL,NULL,NULL,NULL,NULL,'2026-09-14 14:52:03'),(522,2,2,'NOTE_CREATED','WORK_NOTE',4,'Work note “dasdad” was created.',NULL,NULL,NULL,NULL,NULL,'2026-09-14 15:28:37'),(523,7,7,'USER_LOGIN','AUTH_SESSION',7,'Huzaifa Mustafa signed in. Session expires at 2026-09-15 04:29:02.',NULL,NULL,NULL,NULL,NULL,'2026-09-14 15:29:02'),(524,2,2,'NOTE_CREATED','WORK_NOTE',5,'Work note “fdsfs” was created.',NULL,NULL,NULL,NULL,NULL,'2026-09-14 15:29:27'),(530,2,2,'USER_LOGOUT','AUTH_SESSION',2,'admin@remoteoffice.com signed out and revoked the active session.',NULL,NULL,NULL,NULL,NULL,'2026-09-14 16:47:43'),(531,7,7,'USER_LOGIN','AUTH_SESSION',7,'Huzaifa Mustafa signed in. Session expires at 2026-09-15 05:47:56.',NULL,NULL,NULL,NULL,NULL,'2026-09-14 16:47:56'),(532,7,7,'USER_LOGOUT','AUTH_SESSION',7,'huzaifa@gmail.com signed out and revoked the active session.',NULL,NULL,NULL,NULL,NULL,'2026-09-14 16:48:19'),(533,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-15 05:48:21.',NULL,NULL,NULL,NULL,NULL,'2026-09-14 16:48:21'),(534,2,2,'USER_LOGIN','AUTH_SESSION',2,'System Admin signed in. Session expires at 2026-09-15 17:26:07.',NULL,NULL,NULL,NULL,NULL,'2026-09-15 04:26:07'),(535,2,2,'TASK_CREATED','TASK',48,'test was created as OPEN.',NULL,'{\"status\": \"OPEN\"}',NULL,NULL,NULL,'2026-09-15 04:26:21'),(536,7,7,'USER_LOGIN','AUTH_SESSION',7,'Huzaifa Mustafa signed in. Session expires at 2026-09-15 17:26:37.',NULL,NULL,NULL,NULL,NULL,'2026-09-15 04:26:37'),(537,7,7,'ATTENDANCE_CLOCK_IN','ATTENDANCE',24,'Huzaifa Mustafa clocked in at 09:26 am.',NULL,NULL,NULL,NULL,NULL,'2026-09-15 04:26:39'),(538,7,7,'TASK_CLAIMED','TASK',38,'test was claimed.',NULL,'{}',NULL,NULL,NULL,'2026-09-15 04:26:47'),(539,7,7,'TASK_STATUS_CHANGED','TASK',38,'test changed from TO_DO to IN_PROGRESS.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-15 04:26:49'),(540,NULL,7,'TASK_WORK_SESSION_OFFLINE_TIMEOUT','TASK',38,'Task work was paused after 5 minutes without authenticated app presence.',NULL,'{\"reason\": \"OFFLINE_TIMEOUT\", \"employeeId\": 7, \"effectiveEndAt\": \"2026-09-15 09:31:49\", \"timeoutMinutes\": 5}',NULL,NULL,NULL,'2026-09-15 04:32:28'),(541,7,7,'TASK_WORK_RESUMED','TASK',38,'test work was resumed manually.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-15 04:35:02'),(542,7,7,'AVAILABILITY_UPDATED','EMPLOYEE',7,'Manual availability updated.',NULL,'{\"until\": null, \"status\": \"NAMAZ\"}',NULL,NULL,NULL,'2026-09-15 04:40:54'),(543,7,7,'USER_LOGIN','AUTH_SESSION',7,'Huzaifa Mustafa signed in. Session expires at 2026-09-15 17:41:35.',NULL,NULL,NULL,NULL,NULL,'2026-09-15 04:41:35'),(544,7,7,'AVAILABILITY_UPDATED','EMPLOYEE',7,'Manual availability updated.',NULL,'{\"until\": null, \"status\": \"NAMAZ\"}',NULL,NULL,NULL,'2026-09-15 04:41:42'),(545,7,7,'AVAILABILITY_CLEARED','EMPLOYEE',7,'Manual availability cleared.',NULL,NULL,NULL,NULL,NULL,'2026-09-15 04:41:42'),(546,2,2,'TASK_CREATED','TASK',49,'Temporary deletion verification was created as DRAFT.',NULL,'{\"status\": \"DRAFT\"}',NULL,NULL,NULL,'2026-09-15 04:43:23'),(547,2,2,'TASK_DELETED','TASK',49,'Temporary deletion verification was permanently deleted.','{\"title\": \"Temporary deletion verification\", \"status\": \"DRAFT\"}',NULL,NULL,NULL,NULL,'2026-09-15 04:43:23'),(548,7,7,'AVAILABILITY_UPDATED','EMPLOYEE',7,'Manual availability updated.',NULL,'{\"until\": null, \"status\": \"NAMAZ\"}',NULL,NULL,NULL,'2026-09-15 04:43:47'),(549,7,7,'AVAILABILITY_CLEARED','EMPLOYEE',7,'Manual availability cleared.',NULL,NULL,NULL,NULL,NULL,'2026-09-15 04:43:48'),(550,7,7,'TASK_WORK_RESUMED','TASK',38,'test work was resumed manually.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-15 04:44:06'),(551,2,2,'AVAILABILITY_UPDATED','EMPLOYEE',2,'Manual availability updated.',NULL,'{\"until\": null, \"status\": \"NAMAZ\"}',NULL,NULL,NULL,'2026-09-15 04:48:08'),(552,2,2,'AVAILABILITY_CLEARED','EMPLOYEE',2,'Manual availability cleared.',NULL,NULL,NULL,NULL,NULL,'2026-09-15 04:48:14'),(553,7,7,'AVAILABILITY_UPDATED','EMPLOYEE',7,'Manual availability updated.',NULL,'{\"until\": null, \"status\": \"NAMAZ\"}',NULL,NULL,NULL,'2026-09-15 04:48:32'),(554,7,7,'TASK_WORK_RESUMED','TASK',38,'test work was resumed manually.',NULL,'{\"status\": \"IN_PROGRESS\"}',NULL,NULL,NULL,'2026-09-15 04:54:21'),(555,7,7,'TASK_STATUS_CHANGED','TASK',38,'test changed from IN_PROGRESS to COMPLETED.',NULL,'{\"status\": \"COMPLETED\"}',NULL,NULL,NULL,'2026-09-15 04:54:30'),(556,2,2,'TASK_STATUS_CHANGED','TASK',38,'test changed from COMPLETED to ARCHIVED.',NULL,'{\"status\": \"ARCHIVED\"}',NULL,NULL,NULL,'2026-09-15 04:54:58'),(557,2,2,'TASK_STATUS_CHANGED','TASK',32,'testdsyu1234 changed from COMPLETED to ARCHIVED.',NULL,'{\"status\": \"ARCHIVED\"}',NULL,NULL,NULL,'2026-09-15 04:54:58');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_sessions`
--

DROP TABLE IF EXISTS `auth_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_sessions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_seen_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `status` enum('ACTIVE','EXPIRED','REVOKED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `ip_address` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `browser` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operating_system` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_type` enum('DESKTOP','MOBILE','TABLET','UNKNOWN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNKNOWN',
  `login_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `logout_at` datetime DEFAULT NULL,
  `ended_reason` enum('LOGOUT','EXPIRED','REVOKED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_new_ip` tinyint(1) NOT NULL DEFAULT '0',
  `is_new_device` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_auth_session_user_status` (`user_id`,`status`),
  KEY `idx_auth_session_expiry` (`status`,`expires_at`),
  KEY `idx_auth_sessions_presence` (`status`,`last_seen_at`,`user_id`),
  KEY `idx_auth_security_status_login` (`status`,`login_at`),
  KEY `idx_auth_security_ip` (`ip_address`,`login_at`),
  CONSTRAINT `fk_auth_session_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_sessions`
--

LOCK TABLES `auth_sessions` WRITE;
/*!40000 ALTER TABLE `auth_sessions` DISABLE KEYS */;
INSERT INTO `auth_sessions` VALUES ('003dcd7c-2369-4775-9c16-f6173d63a767',2,'2026-09-14 19:52:03','2026-09-14 21:47:37','2026-09-15 03:52:03','2026-09-14 21:47:43','REVOKED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-14 19:52:03','2026-09-14 21:47:43','LOGOUT',0,0),('03dbfa0f-16aa-49f4-9f3a-7e8aa5d7d00b',2,'2026-09-08 18:45:54','2026-09-08 20:00:33','2026-09-09 02:45:54',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-08 18:45:54',NULL,NULL,0,0),('04f6854e-d29d-4f52-80db-0d909a49a1d9',2,'2026-08-29 20:34:52','2026-08-29 20:34:52','2026-08-30 04:34:52',NULL,'ACTIVE','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-08-29 20:34:52',NULL,NULL,0,0),('0e107e49-e81f-4ebb-b995-fbfd17ecaeb8',7,'2026-09-09 20:43:03','2026-09-09 20:43:03','2026-09-10 04:43:03','2026-09-09 20:45:35','REVOKED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-09 20:43:03',NULL,NULL,0,0),('11ac7abe-d62f-4471-9465-1e28d7bc06cd',2,'2026-09-05 09:23:09','2026-09-05 14:26:04','2026-09-05 17:23:09',NULL,'EXPIRED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-05 09:23:09',NULL,NULL,0,0),('1b055bc7-d9d3-4cc6-bc0c-0dceb5cb7fa1',2,'2026-09-09 09:13:43','2026-09-09 09:56:22','2026-09-09 17:13:43',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-09 09:13:43',NULL,NULL,0,0),('2293bce9-8203-4363-a9df-a294446809ce',2,'2026-09-09 22:19:26','2026-09-09 23:12:18','2026-09-10 06:19:26',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-09 22:19:26',NULL,NULL,0,0),('243700bd-27de-43db-ba39-1463a456384e',7,'2026-09-09 21:08:32','2026-09-09 21:08:32','2026-09-10 05:08:32','2026-09-09 21:09:46','REVOKED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-09 21:08:32',NULL,NULL,0,0),('24dc8c3f-7e33-4c46-841f-5615b167f1a7',7,'2026-09-09 10:47:48','2026-09-09 10:47:48','2026-09-09 18:47:48',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-09 10:47:48',NULL,NULL,0,0),('2810745c-992c-4234-9823-153cf33f40aa',3,'2026-09-09 20:24:43','2026-09-09 20:42:43','2026-09-10 04:24:43','2026-09-09 20:42:47','REVOKED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-09 20:24:43',NULL,NULL,0,0),('2d988ef8-a92e-4a24-a28a-34cdf301aaa2',2,'2026-08-29 11:06:18','2026-08-29 16:47:27','2026-08-29 19:06:18',NULL,'EXPIRED','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-08-29 11:06:18',NULL,NULL,0,0),('2ea125c2-45db-410d-a6ce-dce91b4d9e1f',2,'2026-09-09 10:01:03','2026-09-09 17:15:39','2026-09-09 18:01:03',NULL,'EXPIRED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-09 10:01:03',NULL,NULL,0,0),('31d01a69-ccef-41e2-ab1f-82aac4b9f8e4',3,'2026-09-09 09:14:24','2026-09-09 09:14:24','2026-09-09 17:14:24','2026-09-09 09:14:42','REVOKED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-09 09:14:24',NULL,NULL,0,0),('32423c09-4a89-45cc-915a-407498a4ba2d',8,'2026-09-09 21:21:09','2026-09-10 05:05:16','2026-09-10 05:21:09',NULL,'EXPIRED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-09 21:21:09',NULL,NULL,0,0),('3268392d-7b17-408c-9aba-90265ded65ba',2,'2026-09-07 21:00:54','2026-09-07 21:00:54','2026-09-08 05:00:54',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-07 21:00:54',NULL,NULL,0,0),('3c53a183-8e0e-4d6b-9d94-47e22dd0e149',3,'2026-09-08 19:59:28','2026-09-08 20:06:44','2026-09-09 03:59:28','2026-09-08 20:07:11','REVOKED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-08 19:59:28',NULL,NULL,0,0),('3db27b8f-9f83-48f2-9898-b13c6844d3dc',3,'2026-09-09 21:09:59','2026-09-09 21:18:59','2026-09-10 05:09:59','2026-09-09 21:20:58','REVOKED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-09 21:09:59',NULL,NULL,0,0),('41dea899-ddd6-4f71-81b4-ab86205ecd33',2,'2026-09-12 13:14:17','2026-09-12 20:00:12','2026-09-12 21:14:17',NULL,'EXPIRED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-12 13:14:17',NULL,'EXPIRED',0,0),('46805d32-8ecc-45af-8972-5d613100566d',2,'2026-09-10 22:09:11','2026-09-11 06:03:28','2026-09-11 06:09:11',NULL,'EXPIRED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-10 22:09:11',NULL,'EXPIRED',0,1),('4c3e4576-b9e8-427b-b3b8-e23e8b1dc414',7,'2026-09-09 09:14:59','2026-09-09 10:11:13','2026-09-09 17:14:59',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-09 09:14:59',NULL,NULL,0,0),('4f7eaecd-6f7f-4892-903a-f2f9ac1712f0',2,'2026-09-07 21:05:06','2026-09-07 21:14:32','2026-09-08 05:05:06',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-07 21:05:06',NULL,NULL,0,0),('516f4424-f01c-47ea-931f-85368f0ca32c',3,'2026-09-10 20:17:58','2026-09-11 03:28:16','2026-09-11 04:17:58',NULL,'EXPIRED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-10 20:17:58',NULL,'EXPIRED',0,0),('58f609f9-0da3-4e62-9953-c37cec8beb95',3,'2026-09-08 20:07:45','2026-09-08 20:16:45','2026-09-09 04:07:45',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-08 20:07:45',NULL,NULL,0,0),('60e40878-c04e-42ad-9124-f656a17aec0d',2,'2026-09-12 09:26:28','2026-09-12 16:00:40','2026-09-12 17:26:28',NULL,'EXPIRED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-12 09:26:28',NULL,'EXPIRED',0,0),('6b3061d0-45ef-4120-bbb1-afc03f8441ee',8,'2026-09-09 20:45:53','2026-09-09 21:06:53','2026-09-10 04:45:53','2026-09-09 21:08:19','REVOKED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-09 20:45:53',NULL,NULL,0,0),('6be6073b-040b-4f58-b5fd-b45b723c64fc',2,'2026-09-10 19:46:55','2026-09-10 22:02:51','2026-09-11 03:46:55','2026-09-10 22:03:03','REVOKED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-10 19:46:55','2026-09-10 22:03:03','LOGOUT',0,0),('6d16d3e0-ad3a-4e1c-93fb-77680d4c9bd6',2,'2026-09-07 21:41:55','2026-09-07 22:15:44','2026-09-08 05:41:55',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-07 21:41:55',NULL,NULL,0,0),('6e648ba6-5423-4254-8553-50656a8ec4b0',7,'2026-09-14 21:47:56','2026-09-14 21:47:56','2026-09-15 05:47:56','2026-09-14 21:48:19','REVOKED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-14 21:47:56','2026-09-14 21:48:19','LOGOUT',0,0),('7394e16f-8321-4efb-b637-26e2e3f96cd3',7,'2026-08-29 20:35:53','2026-08-29 20:38:53','2026-08-30 04:35:53',NULL,'ACTIVE','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-08-29 20:35:53',NULL,NULL,0,0),('744d79a9-30f8-4eb7-88e0-986b3e06f6ab',2,'2026-09-14 21:48:21','2026-09-14 22:16:01','2026-09-15 05:48:21',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-14 21:48:21',NULL,NULL,0,0),('76a9f732-fef7-4f9d-9b65-87d4e6988854',2,'2026-09-11 20:01:10','2026-09-12 03:59:32','2026-09-12 04:01:10',NULL,'EXPIRED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-11 20:01:10',NULL,'EXPIRED',0,0),('83224b7f-bc69-4ec7-85b8-3df91ad5d609',7,'2026-09-10 21:40:58','2026-09-10 21:41:43','2026-09-11 05:40:58','2026-09-10 21:41:55','REVOKED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-10 21:40:58','2026-09-10 21:41:55','LOGOUT',0,1),('8d42120e-bfc2-418d-8db2-dad9c806b5a6',7,'2026-08-29 11:14:58','2026-08-29 16:47:26','2026-08-29 19:14:58',NULL,'EXPIRED','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-08-29 11:14:58',NULL,NULL,0,0),('8f02f3eb-b917-4042-b14a-9044cb99d5bb',7,'2026-09-10 21:42:14','2026-09-10 21:42:15','2026-09-11 05:42:14','2026-09-10 21:42:43','REVOKED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-10 21:42:14','2026-09-10 21:42:43','REVOKED',0,0),('93c81da1-ed09-4ee9-9c42-10eabf2eb10c',3,'2026-09-01 20:59:33','2026-09-01 20:59:33','2026-09-02 04:59:33',NULL,'ACTIVE','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-01 20:59:33',NULL,NULL,0,0),('9738ba55-ea67-409f-ada5-77f1ae66d26c',3,'2026-08-29 11:06:42','2026-08-29 11:12:42','2026-08-29 19:06:42',NULL,'ACTIVE','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-08-29 11:06:42',NULL,NULL,0,0),('9bdbce92-771b-44b0-a1da-685e146fc6bc',2,'2026-08-29 11:00:16','2026-08-29 11:00:16','2026-08-29 19:00:16','2026-08-29 11:00:16','REVOKED','::ffff:127.0.0.1','node',NULL,NULL,'UNKNOWN','2026-08-29 11:00:16',NULL,NULL,0,0),('a25ecac5-c6df-4bf9-9d33-f7b3d5344770',3,'2026-09-07 21:49:43','2026-09-07 21:52:43','2026-09-08 05:49:43','2026-09-07 21:55:09','REVOKED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-07 21:49:43',NULL,NULL,0,0),('a2df920f-225a-437c-aed5-35dafe2937e6',3,'2026-09-01 21:34:46','2026-09-01 22:19:50','2026-09-02 05:34:46',NULL,'ACTIVE','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-01 21:34:46',NULL,NULL,0,0),('a51479c3-4e29-497b-a05e-3d4a49604906',2,'2026-09-04 23:17:11','2026-09-05 00:17:27','2026-09-05 07:17:11',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-04 23:17:11',NULL,NULL,0,0),('afb56942-b075-4e07-9e67-a93655a1e113',2,'2026-09-07 21:04:42','2026-09-07 21:04:42','2026-09-08 05:04:42',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-07 21:04:42',NULL,NULL,0,0),('b1d615dc-535f-4f76-9a35-7c05febaca02',2,'2026-09-09 23:12:59','2026-09-09 23:18:59','2026-09-10 07:12:59',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-09 23:12:59',NULL,NULL,0,0),('b6e7b657-567c-4aec-8928-189f98c44927',7,'2026-09-08 21:08:44','2026-09-09 04:25:09','2026-09-09 05:08:44',NULL,'EXPIRED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-08 21:08:44',NULL,NULL,0,0),('b7fc4d82-c46f-4ff7-88e9-cb4c8e894585',3,'2026-09-12 09:25:28','2026-09-12 16:00:40','2026-09-12 17:25:28',NULL,'EXPIRED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-12 09:25:28',NULL,'EXPIRED',0,1),('bc4a32ee-afe1-4bca-9986-af6d4556b93a',7,'2026-09-15 09:26:37','2026-09-15 09:26:37','2026-09-15 17:26:37',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-15 09:26:37',NULL,NULL,0,0),('bea1265d-68f6-4182-8a1f-329a24b3f5b1',2,'2026-09-14 10:43:34','2026-09-14 18:40:35','2026-09-14 18:43:34',NULL,'EXPIRED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-14 10:43:34',NULL,'EXPIRED',0,0),('bea199d7-1237-43ed-a529-e5c20695edcc',2,'2026-09-08 20:19:48','2026-09-08 22:00:07','2026-09-09 04:19:48',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-08 20:19:48',NULL,NULL,0,0),('c0c1679e-4701-490d-aeaf-f8386670abc1',2,'2026-09-09 19:15:38','2026-09-09 22:12:40','2026-09-10 03:15:38',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-09 19:15:38',NULL,NULL,0,0),('c5ca2aff-9607-4358-93c9-163c5d547fba',2,'2026-09-04 21:18:44','2026-09-04 22:45:10','2026-09-05 05:18:44',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-04 21:18:44',NULL,NULL,0,0),('c6e4b630-3473-4b66-b2ea-b220c837202b',2,'2026-09-07 21:26:49','2026-09-07 21:40:41','2026-09-08 05:26:49',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-07 21:26:49',NULL,NULL,0,0),('cd8303d4-9c24-4268-b864-1d0e9fc16c8d',7,'2026-09-12 13:51:59','2026-09-12 14:14:37','2026-09-12 21:51:59','2026-09-12 14:14:59','REVOKED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15','Safari','macOS','DESKTOP','2026-09-12 13:51:59','2026-09-12 14:14:59','LOGOUT',0,1),('cfd71062-1631-49da-8c6d-95b3d63562e0',2,'2026-09-08 20:03:22','2026-09-08 20:15:48','2026-09-09 04:03:22',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-08 20:03:22',NULL,NULL,0,0),('d0bd6659-b587-4cc9-8e2f-6489f5a2d69c',3,'2026-09-04 23:55:41','2026-09-05 00:17:26','2026-09-05 07:55:41',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-04 23:55:41',NULL,NULL,0,0),('dc226485-7c74-433e-af34-dc93e9b07c6b',3,'2026-09-07 21:42:46','2026-09-07 21:42:46','2026-09-08 05:42:46','2026-09-07 21:43:29','REVOKED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-07 21:42:46',NULL,NULL,0,0),('dc5fbb5f-5ac8-4a1b-834c-57483032c386',2,'2026-09-11 19:49:25','2026-09-11 19:54:41','2026-09-12 03:49:25',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-11 19:49:25',NULL,NULL,0,0),('dd127ce6-8904-4d16-a094-20630b203b0c',7,'2026-09-15 09:41:35','2026-09-15 09:56:07','2026-09-15 17:41:35',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-15 09:41:35',NULL,NULL,0,0),('e20a568b-0e83-40a4-b1eb-b53321b1e4f6',7,'2026-09-07 21:55:24','2026-09-08 01:32:30','2026-09-08 05:55:24',NULL,'EXPIRED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-07 21:55:24',NULL,NULL,0,0),('ea6995f1-bd00-4989-b728-9843bce43540',2,'2026-09-09 23:19:42','2026-09-10 05:05:16','2026-09-10 07:19:42',NULL,'EXPIRED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-09 23:19:42',NULL,NULL,0,0),('ec2e0962-444c-49a5-bd0a-b4e8022d0299',7,'2026-09-11 21:38:10','2026-09-12 04:55:46','2026-09-12 05:38:10',NULL,'EXPIRED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-11 21:38:10',NULL,'EXPIRED',0,0),('f29f2ec9-ff26-43e0-b175-f7785cdbbffd',2,'2026-09-05 22:26:22','2026-09-05 14:59:52','2026-09-06 06:26:22',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-05 22:26:22',NULL,NULL,0,0),('f51c90ee-70b2-40ff-99f9-1000c0932399',2,'2026-09-15 09:26:07','2026-09-15 09:55:55','2026-09-15 17:26:07',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-15 09:26:07',NULL,NULL,0,0),('f85f6535-5d15-4786-a970-aff6935ffecb',2,'2026-09-07 21:17:02','2026-09-07 21:23:02','2026-09-08 05:17:02',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-07 21:17:02',NULL,NULL,0,0),('f9691ec5-a7c3-4dc2-9977-636444b0ffd7',7,'2026-09-14 10:59:50','2026-09-14 18:49:50','2026-09-14 18:59:50',NULL,'EXPIRED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-14 10:59:50',NULL,'EXPIRED',0,0),('fbbc986e-82ce-40a1-828b-59597616d90e',7,'2026-09-10 22:03:17','2026-09-10 22:08:40','2026-09-11 06:03:17','2026-09-10 22:09:09','REVOKED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-10 22:03:17','2026-09-10 22:09:09','LOGOUT',0,0),('fccbb83d-a3ea-48bd-a3c6-c04dc0a3bf2b',7,'2026-09-14 20:29:02','2026-09-14 22:16:01','2026-09-15 04:29:02',NULL,'ACTIVE','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','2026-09-14 20:29:02',NULL,NULL,0,0),('fe1f264b-07af-4475-a2ff-2bc67fed1e9d',3,'2026-09-08 20:29:57','2026-09-08 21:07:36','2026-09-09 04:29:57','2026-09-08 21:08:11','REVOKED','127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-08 20:29:57',NULL,NULL,0,0),('feba9b22-9cf2-4c0d-b281-168f2d72711e',2,'2026-09-01 20:29:26','2026-09-02 03:53:41','2026-09-02 04:29:26',NULL,'EXPIRED','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',NULL,NULL,'UNKNOWN','2026-09-01 20:29:26',NULL,NULL,0,0);
/*!40000 ALTER TABLE `auth_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_calendar_days`
--

DROP TABLE IF EXISTS `company_calendar_days`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_calendar_days` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `calendar_date` date NOT NULL,
  `day_type` enum('WORKING_DAY','WEEKLY_OFF','PUBLIC_HOLIDAY','COMPANY_HOLIDAY','SPECIAL_OFF_DAY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `status` enum('ACTIVE','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `calendar_date` (`calendar_date`),
  KEY `fk_calendar_creator` (`created_by`),
  KEY `idx_calendar_status_date` (`status`,`calendar_date`),
  KEY `idx_calendar_type_date` (`day_type`,`calendar_date`),
  CONSTRAINT `fk_calendar_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_calendar_days`
--

LOCK TABLES `company_calendar_days` WRITE;
/*!40000 ALTER TABLE `company_calendar_days` DISABLE KEYS */;
INSERT INTO `company_calendar_days` VALUES (5,'2026-08-27','COMPANY_HOLIDAY','Sunday',NULL,2,'CANCELLED','2026-08-26 12:36:34','2026-08-26 12:37:01'),(6,'2026-08-28','COMPANY_HOLIDAY','Sunday',NULL,2,'CANCELLED','2026-08-26 12:36:34','2026-08-26 12:37:03'),(7,'2026-08-29','COMPANY_HOLIDAY','Sunday',NULL,2,'CANCELLED','2026-08-26 12:36:34','2026-08-26 12:37:05'),(8,'2026-09-05','SPECIAL_OFF_DAY','saturaday off','fasds',2,'CANCELLED','2026-09-01 16:39:20','2026-09-12 04:26:53'),(15,'2026-09-16','COMPANY_HOLIDAY','test','test',2,'CANCELLED','2026-09-12 04:27:12','2026-09-12 08:20:00'),(16,'2026-09-15','SPECIAL_OFF_DAY','test 2','testing',2,'CANCELLED','2026-09-12 08:14:53','2026-09-12 08:19:57'),(17,'2026-09-14','SPECIAL_OFF_DAY','testing','testing 1',2,'ACTIVE','2026-09-12 08:20:17','2026-09-12 08:20:17');
/*!40000 ALTER TABLE `company_calendar_days` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_availability_preferences`
--

DROP TABLE IF EXISTS `employee_availability_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_availability_preferences` (
  `employee_id` bigint unsigned NOT NULL,
  `manual_status` enum('AWAY','DO_NOT_DISTURB','IN_MEETING','NAMAZ') COLLATE utf8mb4_unicode_ci NOT NULL,
  `manual_status_until` datetime DEFAULT NULL,
  `status_note` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`employee_id`),
  KEY `idx_availability_expiry` (`manual_status_until`),
  CONSTRAINT `fk_availability_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_availability_preferences`
--

LOCK TABLES `employee_availability_preferences` WRITE;
/*!40000 ALTER TABLE `employee_availability_preferences` DISABLE KEYS */;
INSERT INTO `employee_availability_preferences` VALUES (3,'AWAY',NULL,NULL,'2026-09-10 16:33:00'),(7,'NAMAZ',NULL,NULL,'2026-09-15 04:48:32');
/*!40000 ALTER TABLE `employee_availability_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_late_counters`
--

DROP TABLE IF EXISTS `employee_late_counters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_late_counters` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `counter_period` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `late_count` int unsigned NOT NULL DEFAULT '0',
  `converted_count` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employee_counter` (`employee_id`,`counter_period`,`period_start`,`period_end`),
  CONSTRAINT `employee_late_counters_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_late_counters`
--

LOCK TABLES `employee_late_counters` WRITE;
/*!40000 ALTER TABLE `employee_late_counters` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_late_counters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_salary_profiles`
--

DROP TABLE IF EXISTS `employee_salary_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_salary_profiles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `monthly_salary` decimal(12,2) NOT NULL,
  `salary_divisor` smallint unsigned NOT NULL DEFAULT '30',
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PKR',
  `effective_from` date NOT NULL,
  `effective_until` date DEFAULT NULL,
  `change_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_salary_profile_effective` (`employee_id`,`effective_from`),
  KEY `fk_salary_profile_creator` (`created_by`),
  KEY `idx_salary_profile_lookup` (`employee_id`,`effective_from`,`effective_until`),
  CONSTRAINT `fk_salary_profile_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_salary_profile_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_salary_profiles`
--

LOCK TABLES `employee_salary_profiles` WRITE;
/*!40000 ALTER TABLE `employee_salary_profiles` DISABLE KEYS */;
INSERT INTO `employee_salary_profiles` VALUES (1,7,25000.00,30,'PKR','2026-08-24',NULL,NULL,2,'2026-08-27 17:31:41'),(2,3,25000.00,30,'PKR','2026-08-05',NULL,NULL,2,'2026-08-28 17:30:21');
/*!40000 ALTER TABLE `employee_salary_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_shift_assignments`
--

DROP TABLE IF EXISTS `employee_shift_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_shift_assignments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `shift_id` bigint unsigned NOT NULL,
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `assigned_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employee_shift_effective` (`employee_id`,`effective_from`),
  KEY `fk_shift_assignment_user` (`assigned_by`),
  KEY `idx_shift_assignment_lookup` (`employee_id`,`effective_from`,`effective_to`,`status`),
  KEY `idx_shift_assignment_shift` (`shift_id`,`status`),
  CONSTRAINT `fk_shift_assignment_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_shift_assignment_shift` FOREIGN KEY (`shift_id`) REFERENCES `work_shifts` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_shift_assignment_user` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_shift_assignments`
--

LOCK TABLES `employee_shift_assignments` WRITE;
/*!40000 ALTER TABLE `employee_shift_assignments` DISABLE KEYS */;
INSERT INTO `employee_shift_assignments` VALUES (1,7,1,'2026-08-24',NULL,'ACTIVE',2,'2026-08-27 17:31:41','2026-08-27 17:31:41'),(2,3,2,'2026-08-05',NULL,'ACTIVE',2,'2026-08-28 17:30:21','2026-08-28 17:30:21');
/*!40000 ALTER TABLE `employee_shift_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_work_settings`
--

DROP TABLE IF EXISTS `employee_work_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_work_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `clock_in_time` time NOT NULL,
  `clock_out_time` time NOT NULL,
  `crosses_midnight` tinyint(1) NOT NULL,
  `grace_minutes` smallint unsigned NOT NULL DEFAULT '0',
  `break_allowance_minutes` smallint unsigned NOT NULL DEFAULT '0',
  `required_work_minutes` smallint unsigned NOT NULL,
  `effective_from` date NOT NULL,
  `effective_until` date DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_work_settings_effective` (`employee_id`,`effective_from`),
  KEY `fk_work_settings_creator` (`created_by`),
  KEY `idx_work_settings_lookup` (`employee_id`,`effective_from`,`effective_until`),
  CONSTRAINT `fk_work_settings_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_work_settings_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_work_settings`
--

LOCK TABLES `employee_work_settings` WRITE;
/*!40000 ALTER TABLE `employee_work_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_work_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `job_title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `joining_date` date NOT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `track_attendance` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_code` (`employee_code`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_employees_status` (`status`),
  KEY `idx_employees_department` (`department`),
  KEY `idx_employees_name` (`last_name`,`first_name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (2,'EMP-0001','System','Admin','admin@remoteoffice.com',NULL,'CEO','Management','2026-08-26','ACTIVE',0,'2026-08-26 11:16:14','2026-08-26 11:51:25'),(3,'12','Huzaifa','Mustafa','malikhuzaifa1126@gmail.com','03058559844','gologin','Gologin','2026-08-24','ACTIVE',1,'2026-08-26 11:34:42','2026-08-26 11:34:42'),(7,'emp-1126','Huzaifa','Mustafa','huzaifa@gmail.com','03058559844','Gologin','Gologin','2026-08-26','ACTIVE',1,'2026-08-27 16:49:01','2026-09-08 15:01:50'),(8,'32423','huz','Mustafa','malik@gmail.com','329048','3892472389','ffsdf','2026-09-08','ACTIVE',1,'2026-09-09 15:45:30','2026-09-09 15:45:30');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_days`
--

DROP TABLE IF EXISTS `leave_days`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_days` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `leave_request_id` bigint unsigned NOT NULL,
  `employee_id` bigint unsigned NOT NULL,
  `leave_date` date NOT NULL,
  `approval_status` enum('PENDING','APPROVED','REJECTED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `deduction_status` enum('PENDING','FREE','DEDUCTIBLE','UNAUTHORIZED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `attendance_id` bigint unsigned DEFAULT NULL,
  `has_attendance_conflict` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_leave_request_date` (`leave_request_id`,`leave_date`),
  KEY `fk_leave_day_attendance` (`attendance_id`),
  KEY `idx_leave_day_employee_date` (`employee_id`,`leave_date`),
  KEY `idx_leave_day_deduction` (`employee_id`,`deduction_status`,`leave_date`),
  CONSTRAINT `fk_leave_day_attendance` FOREIGN KEY (`attendance_id`) REFERENCES `attendance_records` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_leave_day_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_leave_day_request` FOREIGN KEY (`leave_request_id`) REFERENCES `leave_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_days`
--

LOCK TABLES `leave_days` WRITE;
/*!40000 ALTER TABLE `leave_days` DISABLE KEYS */;
INSERT INTO `leave_days` VALUES (14,10,3,'2026-08-27','REJECTED','PENDING',NULL,0,'2026-08-26 12:19:15','2026-08-26 12:19:37'),(18,12,3,'2026-08-29','APPROVED','FREE',NULL,0,'2026-08-26 12:49:45','2026-09-01 16:38:31'),(19,13,3,'2026-09-01','REJECTED','PENDING',NULL,0,'2026-08-27 16:46:04','2026-08-27 17:27:35'),(20,13,3,'2026-09-02','REJECTED','PENDING',NULL,0,'2026-08-27 16:46:04','2026-08-27 17:27:35'),(21,14,3,'2026-09-09','APPROVED','FREE',NULL,0,'2026-08-27 16:46:41','2026-08-27 16:52:00'),(22,15,3,'2026-09-02','REJECTED','PENDING',NULL,0,'2026-09-01 16:36:44','2026-09-01 16:36:59'),(23,16,3,'2026-09-02','APPROVED','DEDUCTIBLE',NULL,0,'2026-09-01 16:37:05','2026-09-01 16:38:31'),(24,17,3,'2026-09-03','APPROVED','DEDUCTIBLE',NULL,0,'2026-09-01 16:37:29','2026-09-01 16:38:31'),(25,18,3,'2026-09-15','PENDING','PENDING',NULL,0,'2026-09-12 08:20:47','2026-09-12 08:20:47');
/*!40000 ALTER TABLE `leave_days` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_requests`
--

DROP TABLE IF EXISTS `leave_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `leave_type` enum('CASUAL','SICK','EMERGENCY','PERSONAL','OTHER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days` int unsigned NOT NULL,
  `reason` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `reviewed_by` bigint unsigned DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_comment` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_leave_request_reviewer` (`reviewed_by`),
  KEY `idx_leave_request_employee_dates` (`employee_id`,`start_date`,`end_date`),
  KEY `idx_leave_request_status_created` (`status`,`created_at`),
  CONSTRAINT `fk_leave_request_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_leave_request_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_requests`
--

LOCK TABLES `leave_requests` WRITE;
/*!40000 ALTER TABLE `leave_requests` DISABLE KEYS */;
INSERT INTO `leave_requests` VALUES (10,3,'SICK','2026-08-27','2026-08-27',0,'im very sick','REJECTED',2,'2026-08-26 12:19:37','fdsf','2026-08-26 12:19:15','2026-08-26 12:36:34'),(12,3,'EMERGENCY','2026-08-29','2026-08-30',1,'fghfghf','APPROVED',2,'2026-08-26 13:00:34',NULL,'2026-08-26 12:49:45','2026-08-26 13:00:34'),(13,3,'EMERGENCY','2026-09-01','2026-09-02',2,'fdasfs','REJECTED',2,'2026-08-27 17:27:35','jhkjg','2026-08-27 16:46:04','2026-08-27 17:27:35'),(14,3,'EMERGENCY','2026-09-09','2026-09-09',1,'fdsggfgdf','APPROVED',2,'2026-08-27 16:52:00','dfs','2026-08-27 16:46:41','2026-08-27 16:52:00'),(15,3,'CASUAL','2026-09-02','2026-09-02',1,'hjfhgfh','REJECTED',2,'2026-09-01 16:36:59','hgfhgvnb','2026-09-01 16:36:44','2026-09-01 16:36:59'),(16,3,'CASUAL','2026-09-02','2026-09-02',1,'hjfhgfh','APPROVED',2,'2026-09-01 16:37:42','bnjhmbjh','2026-09-01 16:37:05','2026-09-01 16:37:42'),(17,3,'CASUAL','2026-09-03','2026-09-03',1,'hjfhgfh','APPROVED',2,'2026-09-01 16:38:31','bnjhmbjh','2026-09-01 16:37:29','2026-09-01 16:38:31'),(18,3,'SICK','2026-09-15','2026-09-15',1,'testing','PENDING',NULL,NULL,NULL,'2026-09-12 08:20:47','2026-09-12 08:20:47');
/*!40000 ALTER TABLE `leave_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login_failed_attempts`
--

DROP TABLE IF EXISTS `login_failed_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_failed_attempts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `attempted_identifier` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `employee_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `browser` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operating_system` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_type` enum('DESKTOP','MOBILE','TABLET','UNKNOWN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNKNOWN',
  `failure_category` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INVALID_CREDENTIALS',
  `suspicious` tinyint(1) NOT NULL DEFAULT '0',
  `attempted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_failed_login_user` (`user_id`),
  KEY `fk_failed_login_employee` (`employee_id`),
  KEY `idx_failed_login_attempted` (`attempted_at`),
  KEY `idx_failed_login_identifier` (`attempted_identifier`,`attempted_at`),
  KEY `idx_failed_login_ip` (`ip_address`,`attempted_at`),
  KEY `idx_failed_login_suspicious` (`suspicious`,`attempted_at`),
  CONSTRAINT `fk_failed_login_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_failed_login_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_failed_attempts`
--

LOCK TABLES `login_failed_attempts` WRITE;
/*!40000 ALTER TABLE `login_failed_attempts` DISABLE KEYS */;
INSERT INTO `login_failed_attempts` VALUES (1,'security-test@example.invalid',NULL,NULL,'127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0 Safari/537.36','Chrome','macOS','DESKTOP','INVALID_CREDENTIALS',0,'2026-09-10 21:05:06'),(2,'security-test@example.invalid',NULL,NULL,'127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0 Safari/537.36','Chrome','macOS','DESKTOP','INVALID_CREDENTIALS',0,'2026-09-10 21:05:06'),(3,'security-test@example.invalid',NULL,NULL,'127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0 Safari/537.36','Chrome','macOS','DESKTOP','INVALID_CREDENTIALS',0,'2026-09-10 21:05:06'),(4,'security-test@example.invalid',NULL,NULL,'127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0 Safari/537.36','Chrome','macOS','DESKTOP','INVALID_CREDENTIALS',0,'2026-09-10 21:05:06'),(5,'security-test@example.invalid',NULL,NULL,'127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0 Safari/537.36','Chrome','macOS','DESKTOP','INVALID_CREDENTIALS',1,'2026-09-10 21:05:06'),(6,'ceo@example.com',NULL,NULL,'127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0 Safari/537.36','Chrome','macOS','DESKTOP','INVALID_CREDENTIALS',1,'2026-09-10 21:05:06'),(7,'malikhuzaifa1126@gmail.com',3,3,'127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','INVALID_CREDENTIALS',0,'2026-09-10 21:40:41'),(8,'huzaifa1126@gmail.com',NULL,NULL,'127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','INVALID_CREDENTIALS',0,'2026-09-10 21:42:09'),(9,'test@gmail.com',NULL,NULL,'127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','INVALID_CREDENTIALS',0,'2026-09-14 10:59:14'),(10,'test@gmail.com',NULL,NULL,'127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','INVALID_CREDENTIALS',0,'2026-09-14 10:59:21'),(11,'test@gmail.com',NULL,NULL,'127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','INVALID_CREDENTIALS',0,'2026-09-14 10:59:27'),(12,'test@gmail.com',NULL,NULL,'127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','INVALID_CREDENTIALS',0,'2026-09-14 10:59:33'),(13,'test@gmail.com',NULL,NULL,'127.0.0.1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','Chrome','macOS','DESKTOP','INVALID_CREDENTIALS',1,'2026-09-14 10:59:35');
/*!40000 ALTER TABLE `login_failed_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `note_attachments`
--

DROP TABLE IF EXISTS `note_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `note_attachments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `note_id` bigint unsigned NOT NULL,
  `uploaded_by` bigint unsigned NOT NULL,
  `storage_key` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size_bytes` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_note_attachments_note` (`note_id`,`deleted_at`,`created_at`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `note_attachments_ibfk_1` FOREIGN KEY (`note_id`) REFERENCES `work_notes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `note_attachments_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `note_attachments`
--

LOCK TABLES `note_attachments` WRITE;
/*!40000 ALTER TABLE `note_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `note_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `note_bookmarks`
--

DROP TABLE IF EXISTS `note_bookmarks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `note_bookmarks` (
  `user_id` bigint unsigned NOT NULL,
  `note_id` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`note_id`),
  KEY `idx_note_bookmarks_note` (`note_id`),
  CONSTRAINT `note_bookmarks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `note_bookmarks_ibfk_2` FOREIGN KEY (`note_id`) REFERENCES `work_notes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `note_bookmarks`
--

LOCK TABLES `note_bookmarks` WRITE;
/*!40000 ALTER TABLE `note_bookmarks` DISABLE KEYS */;
/*!40000 ALTER TABLE `note_bookmarks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `note_categories`
--

DROP TABLE IF EXISTS `note_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `note_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_note_category_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `note_categories`
--

LOCK TABLES `note_categories` WRITE;
/*!40000 ALTER TABLE `note_categories` DISABLE KEYS */;
INSERT INTO `note_categories` VALUES (1,'Development',1,'2026-09-14 14:58:30'),(2,'Bug Fix',1,'2026-09-14 14:58:30'),(3,'Client Work',1,'2026-09-14 14:58:30'),(4,'Design',1,'2026-09-14 14:58:30'),(5,'Research',1,'2026-09-14 14:58:30'),(6,'Server',1,'2026-09-14 14:58:30'),(7,'Database',1,'2026-09-14 14:58:30'),(8,'Deployment',1,'2026-09-14 14:58:30'),(9,'Meeting',1,'2026-09-14 14:58:30'),(10,'Documentation',1,'2026-09-14 14:58:30'),(11,'Testing',1,'2026-09-14 14:58:30'),(12,'Marketing',1,'2026-09-14 14:58:30'),(13,'Internal',1,'2026-09-14 14:58:30'),(14,'Other',1,'2026-09-14 14:58:30');
/*!40000 ALTER TABLE `note_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `note_comments`
--

DROP TABLE IF EXISTS `note_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `note_comments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `note_id` bigint unsigned NOT NULL,
  `author_user_id` bigint unsigned NOT NULL,
  `comment_text` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_note_comments_note` (`note_id`,`created_at`),
  KEY `author_user_id` (`author_user_id`),
  CONSTRAINT `note_comments_ibfk_1` FOREIGN KEY (`note_id`) REFERENCES `work_notes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `note_comments_ibfk_2` FOREIGN KEY (`author_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `note_comments`
--

LOCK TABLES `note_comments` WRITE;
/*!40000 ALTER TABLE `note_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `note_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `note_images`
--

DROP TABLE IF EXISTS `note_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `note_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `note_id` bigint unsigned NOT NULL,
  `uploaded_by` bigint unsigned NOT NULL,
  `storage_key` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size_bytes` int unsigned NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_note_images_note` (`note_id`,`uploaded_at`),
  CONSTRAINT `note_images_ibfk_1` FOREIGN KEY (`note_id`) REFERENCES `work_notes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `note_images_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `note_images`
--

LOCK TABLES `note_images` WRITE;
/*!40000 ALTER TABLE `note_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `note_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `note_mentions`
--

DROP TABLE IF EXISTS `note_mentions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `note_mentions` (
  `note_id` bigint unsigned NOT NULL,
  `mentioned_user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`note_id`,`mentioned_user_id`),
  KEY `mentioned_user_id` (`mentioned_user_id`),
  CONSTRAINT `note_mentions_ibfk_1` FOREIGN KEY (`note_id`) REFERENCES `work_notes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `note_mentions_ibfk_2` FOREIGN KEY (`mentioned_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `note_mentions`
--

LOCK TABLES `note_mentions` WRITE;
/*!40000 ALTER TABLE `note_mentions` DISABLE KEYS */;
/*!40000 ALTER TABLE `note_mentions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `note_pins`
--

DROP TABLE IF EXISTS `note_pins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `note_pins` (
  `user_id` bigint unsigned NOT NULL,
  `note_id` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`note_id`),
  KEY `idx_note_pins_note` (`note_id`),
  CONSTRAINT `note_pins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `note_pins_ibfk_2` FOREIGN KEY (`note_id`) REFERENCES `work_notes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `note_pins`
--

LOCK TABLES `note_pins` WRITE;
/*!40000 ALTER TABLE `note_pins` DISABLE KEYS */;
/*!40000 ALTER TABLE `note_pins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `note_recent_searches`
--

DROP TABLE IF EXISTS `note_recent_searches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `note_recent_searches` (
  `user_id` bigint unsigned NOT NULL,
  `query` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `searched_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`query`),
  KEY `idx_note_search_recent` (`user_id`,`searched_at`),
  CONSTRAINT `note_recent_searches_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `note_recent_searches`
--

LOCK TABLES `note_recent_searches` WRITE;
/*!40000 ALTER TABLE `note_recent_searches` DISABLE KEYS */;
/*!40000 ALTER TABLE `note_recent_searches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `note_relations`
--

DROP TABLE IF EXISTS `note_relations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `note_relations` (
  `note_id` bigint unsigned NOT NULL,
  `related_note_id` bigint unsigned NOT NULL,
  `created_by` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`note_id`,`related_note_id`),
  KEY `related_note_id` (`related_note_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `note_relations_ibfk_1` FOREIGN KEY (`note_id`) REFERENCES `work_notes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `note_relations_ibfk_2` FOREIGN KEY (`related_note_id`) REFERENCES `work_notes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `note_relations_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `note_relations`
--

LOCK TABLES `note_relations` WRITE;
/*!40000 ALTER TABLE `note_relations` DISABLE KEYS */;
/*!40000 ALTER TABLE `note_relations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `note_revisions`
--

DROP TABLE IF EXISTS `note_revisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `note_revisions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `note_id` bigint unsigned NOT NULL,
  `version_number` int unsigned NOT NULL,
  `snapshot` json NOT NULL,
  `edited_by` bigint unsigned NOT NULL,
  `edited_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_note_revision` (`note_id`,`version_number`),
  KEY `edited_by` (`edited_by`),
  CONSTRAINT `note_revisions_ibfk_1` FOREIGN KEY (`note_id`) REFERENCES `work_notes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `note_revisions_ibfk_2` FOREIGN KEY (`edited_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `note_revisions`
--

LOCK TABLES `note_revisions` WRITE;
/*!40000 ALTER TABLE `note_revisions` DISABLE KEYS */;
/*!40000 ALTER TABLE `note_revisions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `note_tag_relations`
--

DROP TABLE IF EXISTS `note_tag_relations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `note_tag_relations` (
  `note_id` bigint unsigned NOT NULL,
  `tag_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`note_id`,`tag_id`),
  KEY `idx_note_tag_lookup` (`tag_id`,`note_id`),
  CONSTRAINT `note_tag_relations_ibfk_1` FOREIGN KEY (`note_id`) REFERENCES `work_notes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `note_tag_relations_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `note_tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `note_tag_relations`
--

LOCK TABLES `note_tag_relations` WRITE;
/*!40000 ALTER TABLE `note_tag_relations` DISABLE KEYS */;
INSERT INTO `note_tag_relations` VALUES (4,5),(4,6),(4,7),(4,8);
/*!40000 ALTER TABLE `note_tag_relations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `note_tags`
--

DROP TABLE IF EXISTS `note_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `note_tags` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_note_tag_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `note_tags`
--

LOCK TABLES `note_tags` WRITE;
/*!40000 ALTER TABLE `note_tags` DISABLE KEYS */;
INSERT INTO `note_tags` VALUES (6,'adsda'),(5,'asda'),(7,'d'),(8,'das'),(2,'knowledge'),(1,'runtime-test'),(4,'verification');
/*!40000 ALTER TABLE `note_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `note_templates`
--

DROP TABLE IF EXISTS `note_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `note_templates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` bigint unsigned DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_note_template_name` (`name`),
  KEY `idx_note_templates_active` (`is_active`,`sort_order`),
  KEY `category_id` (`category_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `note_templates_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `note_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `note_templates_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `note_templates`
--

LOCK TABLES `note_templates` WRITE;
/*!40000 ALTER TABLE `note_templates` DISABLE KEYS */;
INSERT INTO `note_templates` VALUES (1,'Blank Note','Start with an empty note','',NULL,0,1,NULL,'2026-09-14 15:15:59','2026-09-14 15:15:59'),(2,'Bug Fix','Document a defect and its resolution','## Issue\n\n## Root Cause\n\n## Fix Applied\n\n## Files / Areas Changed\n\n## Testing Performed\n\n## Result\n\n## Future Recommendation',NULL,10,1,NULL,'2026-09-14 15:15:59','2026-09-14 15:15:59'),(3,'Development Work','Document implementation work','## Goal\n\n## Work Performed\n\n## Technical Decisions\n\n## Testing\n\n## Result\n\n## Next Step',NULL,20,1,NULL,'2026-09-14 15:15:59','2026-09-14 15:15:59'),(4,'Deployment','Record a deployment safely','## Environment\n\n## Version / Branch\n\n## Deployment Date\n\n## Changes Deployed\n\n## Database Changes\n\n## Configuration Changes\n\n## Issues During Deployment\n\n## Final Status\n\n## Rollback Information',NULL,30,1,NULL,'2026-09-14 15:15:59','2026-09-14 15:15:59'),(5,'Client Update','Capture client decisions and requests','## Client\n\n## Update\n\n## Decisions\n\n## Required Actions\n\n## Next Contact',NULL,40,1,NULL,'2026-09-14 15:15:59','2026-09-14 15:15:59'),(6,'Meeting Notes','Record decisions and actions','## Attendees\n\n## Discussion\n\n## Decisions\n\n## Action Items',NULL,50,1,NULL,'2026-09-14 15:15:59','2026-09-14 15:15:59'),(7,'Research','Capture reusable research','## Question\n\n## Findings\n\n## Sources\n\n## Recommendation',NULL,60,1,NULL,'2026-09-14 15:15:59','2026-09-14 15:15:59'),(8,'Database Change','Document database work','## Purpose\n\n## Schema / Query Changes\n\n## Migration\n\n## Validation\n\n## Rollback',NULL,70,1,NULL,'2026-09-14 15:15:59','2026-09-14 15:15:59'),(9,'Server Issue','Document an infrastructure incident','## Symptoms\n\n## Root Cause\n\n## Resolution\n\n## Verification\n\n## Prevention',NULL,80,1,NULL,'2026-09-14 15:15:59','2026-09-14 15:15:59'),(10,'Design Update','Record a design decision','## Objective\n\n## Changes\n\n## Rationale\n\n## Review\n\n## Next Step',NULL,90,1,NULL,'2026-09-14 15:15:59','2026-09-14 15:15:59'),(11,'General Work Note','Document completed work','## Summary\n\n## Work Performed\n\n## Result\n\n## Next Step',NULL,100,1,NULL,'2026-09-14 15:15:59','2026-09-14 15:15:59');
/*!40000 ALTER TABLE `note_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_event_preferences`
--

DROP TABLE IF EXISTS `notification_event_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_event_preferences` (
  `user_id` bigint unsigned NOT NULL,
  `event_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `in_app_enabled` tinyint(1) DEFAULT NULL,
  `desktop_enabled` tinyint(1) DEFAULT NULL,
  `sound_enabled` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`event_type`),
  CONSTRAINT `fk_notification_event_preference_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_event_preferences`
--

LOCK TABLES `notification_event_preferences` WRITE;
/*!40000 ALTER TABLE `notification_event_preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_event_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_policies`
--

DROP TABLE IF EXISTS `notification_policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_policies` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `audience_type` enum('ALL_EMPLOYEES','CEO_ADMIN','MANAGERS','SAME_DEPARTMENT','SELECTED_ROLES','SELECTED_EMPLOYEES','NOBODY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `mandatory` tinyint(1) NOT NULL DEFAULT '0',
  `notify_actor` tinyint(1) NOT NULL DEFAULT '0',
  `in_app_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `desktop_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `sound_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `push_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_type` (`event_type`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `notification_policies_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notification_policies_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=141 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_policies`
--

LOCK TABLES `notification_policies` WRITE;
/*!40000 ALTER TABLE `notification_policies` DISABLE KEYS */;
INSERT INTO `notification_policies` VALUES (1,'CLOCK_IN',1,'ALL_EMPLOYEES',1,1,1,1,1,1,NULL,2,'2026-09-07 16:57:45','2026-09-12 08:14:11'),(2,'CLOCK_OUT',1,'ALL_EMPLOYEES',1,1,1,1,1,1,NULL,2,'2026-09-07 16:57:45','2026-09-12 08:14:11'),(3,'BREAK_STARTED',1,'ALL_EMPLOYEES',0,0,1,1,1,0,NULL,2,'2026-09-07 16:57:45','2026-09-08 16:53:25'),(4,'BREAK_ENDED',1,'ALL_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-07 16:57:45','2026-09-08 16:53:25'),(5,'LATE_ARRIVAL',1,'CEO_ADMIN',1,1,1,1,1,1,NULL,2,'2026-09-07 16:57:45','2026-09-12 08:14:11'),(6,'HALF_DAY',1,'CEO_ADMIN',1,1,1,1,0,1,NULL,2,'2026-09-07 16:57:45','2026-09-12 08:14:11'),(7,'ON_LEAVE',1,'ALL_EMPLOYEES',1,1,1,1,1,1,NULL,2,'2026-09-07 16:57:45','2026-09-12 08:14:11'),(8,'LEAVE_APPROVED',1,'CEO_ADMIN',1,1,1,1,1,1,NULL,2,'2026-09-07 16:57:45','2026-09-12 08:14:11'),(9,'LEAVE_REJECTED',1,'CEO_ADMIN',1,1,1,1,1,1,NULL,2,'2026-09-07 16:57:45','2026-09-12 08:14:11'),(10,'TASK_ASSIGNED',1,'ALL_EMPLOYEES',1,1,1,1,1,1,NULL,2,'2026-09-07 16:57:45','2026-09-12 04:28:18'),(11,'TASK_UPDATED',1,'ALL_EMPLOYEES',1,1,1,1,1,1,NULL,2,'2026-09-07 16:57:45','2026-09-12 08:14:11'),(12,'ANNOUNCEMENT',1,'ALL_EMPLOYEES',1,1,1,1,1,1,NULL,2,'2026-09-07 16:57:45','2026-09-12 04:28:18'),(13,'PAYROLL_GENERATED',1,'CEO_ADMIN',0,0,1,1,0,0,NULL,2,'2026-09-07 16:57:45','2026-09-08 16:53:25'),(14,'OPEN_TASK_CREATED',1,'ALL_EMPLOYEES',1,1,1,1,1,1,NULL,2,'2026-09-08 15:15:07','2026-09-12 08:14:11'),(15,'TASK_CLAIMED',1,'CEO_ADMIN',1,1,1,1,1,1,NULL,2,'2026-09-08 15:15:07','2026-09-12 08:14:11'),(16,'TASK_STARTED',1,'CEO_ADMIN',0,0,1,0,0,0,NULL,2,'2026-09-08 15:15:07','2026-09-08 16:53:25'),(17,'TASK_SUBMITTED',1,'CEO_ADMIN',1,1,1,1,1,1,NULL,2,'2026-09-08 15:15:07','2026-09-12 08:14:11'),(18,'TASK_CHANGES_REQUIRED',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-08 15:15:07','2026-09-08 16:53:25'),(19,'TASK_COMPLETED',1,'CEO_ADMIN',0,0,1,0,0,0,NULL,2,'2026-09-08 15:15:07','2026-09-08 16:53:25'),(20,'TASK_OVERDUE',1,'ALL_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-08 15:15:07','2026-09-08 16:53:25'),(21,'TASK_COMMENT_ADDED',1,'ALL_EMPLOYEES',0,0,1,0,0,0,NULL,2,'2026-09-08 15:15:07','2026-09-08 16:53:25'),(22,'TASK_DEADLINE_CHANGED',1,'ALL_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-08 15:15:07','2026-09-08 16:53:25'),(23,'TASK_REOPENED',1,'ALL_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-08 15:15:07','2026-09-08 16:53:25'),(24,'TASK_COMMENT',1,'SELECTED_EMPLOYEES',0,0,1,0,0,0,NULL,2,'2026-09-09 15:14:46','2026-09-12 04:28:18'),(25,'TASK_MENTION',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-09 15:14:46','2026-09-12 04:28:18'),(26,'TASK_REPLY',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-09 15:14:46','2026-09-12 04:28:18'),(27,'TASK_ATTACHMENT_ADDED',1,'SELECTED_EMPLOYEES',0,0,1,0,0,0,NULL,2,'2026-09-09 15:14:46','2026-09-12 04:28:18'),(28,'TASK_APPROVED',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-09 15:14:46','2026-09-12 04:28:18'),(29,'ATTENDANCE_CLOCK_IN',1,'CEO_ADMIN',1,1,1,1,1,1,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(30,'ATTENDANCE_LATE',1,'CEO_ADMIN',1,1,1,1,1,1,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(31,'ATTENDANCE_CLOCK_OUT',1,'CEO_ADMIN',0,0,1,0,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(32,'ATTENDANCE_EARLY_CLOCK_OUT',1,'CEO_ADMIN',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(33,'ATTENDANCE_MISSING_CLOCK_IN',1,'CEO_ADMIN',0,0,1,1,1,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(34,'ATTENDANCE_MISSING_CLOCK_OUT',1,'CEO_ADMIN',0,0,1,1,1,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(35,'ATTENDANCE_ABSENT',1,'CEO_ADMIN',0,0,1,1,1,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(36,'BREAK_EXCEEDED',1,'CEO_ADMIN',1,1,1,1,1,1,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(37,'LEAVE_REQUESTED',1,'CEO_ADMIN',1,1,1,1,1,1,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(38,'LEAVE_CANCELLED',1,'CEO_ADMIN',1,1,1,1,1,1,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(39,'LEAVE_UPCOMING',1,'SELECTED_EMPLOYEES',1,1,1,1,1,1,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(40,'LEAVE_SALARY_DEDUCTION',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(41,'CALENDAR_HOLIDAY_CREATED',1,'ALL_EMPLOYEES',1,1,1,1,1,1,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(42,'CALENDAR_HOLIDAY_UPDATED',1,'ALL_EMPLOYEES',0,1,1,1,1,1,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(43,'CALENDAR_HOLIDAY_DELETED',1,'ALL_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(44,'CALENDAR_WEEKLY_OFF_CHANGED',1,'ALL_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(45,'CALENDAR_UPCOMING_HOLIDAY',1,'ALL_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(46,'TASK_REASSIGNED',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(47,'TASK_PAUSED',1,'SELECTED_EMPLOYEES',0,0,1,0,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(48,'TASK_RESUMED',1,'SELECTED_EMPLOYEES',0,0,1,0,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(49,'TASK_PRIORITY_CHANGED',1,'SELECTED_EMPLOYEES',0,0,1,0,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(50,'TASK_DUE_SOON',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(51,'TASK_DELETED',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(52,'SALARY_DAILY_UPDATED',1,'SELECTED_EMPLOYEES',0,0,1,0,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(53,'SALARY_DEDUCTION_ADDED',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(54,'SALARY_BONUS_ADDED',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(55,'SALARY_OVERTIME_ADDED',1,'SELECTED_EMPLOYEES',0,0,1,0,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(56,'PAYROLL_UPDATED',1,'SELECTED_EMPLOYEES',0,0,1,0,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(57,'PAYROLL_APPROVED',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(58,'PAYROLL_FINALIZED',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(59,'PAYSLIP_AVAILABLE',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(60,'PAYROLL_PERIOD_CLOSED',1,'CEO_ADMIN',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(61,'EMPLOYEE_UPDATED',1,'SELECTED_EMPLOYEES',0,0,1,0,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(62,'EMPLOYEE_DISABLED',1,'CEO_ADMIN',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(63,'EMPLOYEE_ENABLED',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(64,'EMPLOYEE_ROLE_CHANGED',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(65,'EMPLOYEE_PERMISSION_CHANGED',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(66,'EMPLOYEE_SHIFT_CHANGED',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(67,'EMPLOYEE_SALARY_CHANGED',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(68,'EMPLOYEE_MOBILE_ACCESS_CHANGED',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(69,'SHIFT_ASSIGNED',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(70,'SHIFT_UPDATED',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(71,'SHIFT_START_REMINDER',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(72,'SHIFT_END_REMINDER',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(73,'SECURITY_LOGIN',1,'CEO_ADMIN',0,0,1,0,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(74,'SECURITY_NEW_DEVICE',1,'CEO_ADMIN',0,0,1,1,1,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(75,'SECURITY_NEW_IP',1,'CEO_ADMIN',0,0,1,1,1,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(76,'SECURITY_FAILED_LOGIN',1,'CEO_ADMIN',0,0,1,0,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(77,'SECURITY_MULTIPLE_FAILED_LOGINS',1,'CEO_ADMIN',0,0,1,1,1,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(78,'SECURITY_PASSWORD_CHANGED',1,'SELECTED_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(79,'SECURITY_PERMISSION_DENIED',1,'CEO_ADMIN',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(80,'SECURITY_MOBILE_ACCESS_BLOCKED',1,'CEO_ADMIN',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(81,'SECURITY_SESSION_EXPIRED',1,'SELECTED_EMPLOYEES',0,0,1,0,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(82,'ANNOUNCEMENT_CREATED',1,'ALL_EMPLOYEES',0,0,1,1,1,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(83,'SYSTEM_MAINTENANCE',1,'ALL_EMPLOYEES',0,0,1,1,1,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(84,'SYSTEM_UPDATE',1,'ALL_EMPLOYEES',0,0,1,1,0,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(85,'SYSTEM_WARNING',1,'ALL_EMPLOYEES',0,0,1,1,1,0,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11'),(86,'TEST_NOTIFICATION',1,'SELECTED_EMPLOYEES',0,0,1,1,1,1,NULL,2,'2026-09-12 08:08:01','2026-09-12 08:14:11');
/*!40000 ALTER TABLE `notification_policies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_policy_employees`
--

DROP TABLE IF EXISTS `notification_policy_employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_policy_employees` (
  `policy_id` bigint unsigned NOT NULL,
  `employee_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`policy_id`,`employee_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `notification_policy_employees_ibfk_1` FOREIGN KEY (`policy_id`) REFERENCES `notification_policies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notification_policy_employees_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_policy_employees`
--

LOCK TABLES `notification_policy_employees` WRITE;
/*!40000 ALTER TABLE `notification_policy_employees` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_policy_employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_policy_roles`
--

DROP TABLE IF EXISTS `notification_policy_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_policy_roles` (
  `policy_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`policy_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `notification_policy_roles_ibfk_1` FOREIGN KEY (`policy_id`) REFERENCES `notification_policies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notification_policy_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_policy_roles`
--

LOCK TABLES `notification_policy_roles` WRITE;
/*!40000 ALTER TABLE `notification_policy_roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_policy_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_preferences`
--

DROP TABLE IF EXISTS `notification_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_preferences` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `notifications_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `in_app_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `sound_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `volume` tinyint unsigned NOT NULL DEFAULT '70',
  `sound_id` bigint unsigned DEFAULT NULL,
  `task_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `leave_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `break_notifications` tinyint(1) NOT NULL DEFAULT '0',
  `attendance_notifications` tinyint(1) NOT NULL DEFAULT '0',
  `announcement_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `calendar_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `payroll_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `security_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `employee_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `shift_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `browser_notifications` tinyint(1) NOT NULL DEFAULT '0',
  `do_not_disturb` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `fk_notification_preference_sound` (`sound_id`),
  CONSTRAINT `fk_notification_preference_sound` FOREIGN KEY (`sound_id`) REFERENCES `notification_sounds` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_notification_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2781 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_preferences`
--

LOCK TABLES `notification_preferences` WRITE;
/*!40000 ALTER TABLE `notification_preferences` DISABLE KEYS */;
INSERT INTO `notification_preferences` VALUES (1,2,1,1,1,100,NULL,1,1,1,1,1,1,1,1,1,1,1,0,'2026-08-27 17:13:01','2026-09-12 08:59:17'),(3,7,1,1,1,100,NULL,1,1,1,1,1,1,1,1,1,1,1,0,'2026-08-27 17:14:13','2026-09-12 08:58:03'),(56,3,1,1,1,100,NULL,1,1,0,0,1,1,1,1,1,1,1,0,'2026-08-28 17:31:03','2026-09-12 08:58:14'),(510,8,1,1,1,70,NULL,1,1,0,0,1,1,1,1,1,1,0,0,'2026-09-09 15:45:53','2026-09-09 15:45:53');
/*!40000 ALTER TABLE `notification_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_sound_assignments`
--

DROP TABLE IF EXISTS `notification_sound_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_sound_assignments` (
  `scope_type` enum('CATEGORY','EVENT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sound_id` bigint unsigned NOT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`scope_type`,`scope_key`),
  KEY `sound_id` (`sound_id`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `notification_sound_assignments_ibfk_1` FOREIGN KEY (`sound_id`) REFERENCES `notification_sounds` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notification_sound_assignments_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_sound_assignments`
--

LOCK TABLES `notification_sound_assignments` WRITE;
/*!40000 ALTER TABLE `notification_sound_assignments` DISABLE KEYS */;
INSERT INTO `notification_sound_assignments` VALUES ('CATEGORY','CALENDAR',6,2,'2026-09-12 09:00:00'),('CATEGORY','LEAVE',6,2,'2026-09-12 09:00:00'),('CATEGORY','PAYROLL',6,2,'2026-09-12 09:00:00'),('CATEGORY','SECURITY',6,2,'2026-09-12 09:00:00'),('CATEGORY','SYSTEM',6,2,'2026-09-12 09:00:00'),('CATEGORY','TASK',6,2,'2026-09-12 09:00:00');
/*!40000 ALTER TABLE `notification_sound_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_sound_settings`
--

DROP TABLE IF EXISTS `notification_sound_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_sound_settings` (
  `id` tinyint unsigned NOT NULL DEFAULT '1',
  `default_sound_id` bigint unsigned DEFAULT NULL,
  `normal_volume` tinyint unsigned NOT NULL DEFAULT '70',
  `important_volume` tinyint unsigned NOT NULL DEFAULT '85',
  `warning_volume` tinyint unsigned NOT NULL DEFAULT '90',
  `critical_volume` tinyint unsigned NOT NULL DEFAULT '100',
  `updated_by` bigint unsigned DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `default_sound_id` (`default_sound_id`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `notification_sound_settings_ibfk_1` FOREIGN KEY (`default_sound_id`) REFERENCES `notification_sounds` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notification_sound_settings_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_sound_settings`
--

LOCK TABLES `notification_sound_settings` WRITE;
/*!40000 ALTER TABLE `notification_sound_settings` DISABLE KEYS */;
INSERT INTO `notification_sound_settings` VALUES (1,6,100,100,100,100,2,'2026-09-12 08:59:39');
/*!40000 ALTER TABLE `notification_sound_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_sounds`
--

DROP TABLE IF EXISTS `notification_sounds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_sounds` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `storage_key` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mime_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size_bytes` int unsigned DEFAULT NULL,
  `uploaded_by` bigint unsigned DEFAULT NULL,
  `builtin_key` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_builtin` tinyint(1) NOT NULL DEFAULT '0',
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_notification_sound_builtin` (`builtin_key`),
  KEY `idx_notification_sounds_available` (`deleted_at`,`is_builtin`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `notification_sounds_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_sounds`
--

LOCK TABLES `notification_sounds` WRITE;
/*!40000 ALTER TABLE `notification_sounds` DISABLE KEYS */;
INSERT INTO `notification_sounds` VALUES (1,'Standard',NULL,NULL,NULL,NULL,NULL,'STANDARD',1,0,'2026-09-12 08:42:57','2026-09-12 08:59:39',NULL),(2,'Strong Alert',NULL,NULL,NULL,NULL,NULL,'STRONG',1,0,'2026-09-12 08:42:57','2026-09-12 08:42:57',NULL),(3,'Soft Bell',NULL,NULL,NULL,NULL,NULL,'SOFT',1,0,'2026-09-12 08:42:57','2026-09-12 08:42:57',NULL),(4,'Warning',NULL,NULL,NULL,NULL,NULL,'WARNING',1,0,'2026-09-12 08:42:57','2026-09-12 08:42:57',NULL),(5,'Critical',NULL,NULL,NULL,NULL,NULL,'CRITICAL',1,0,'2026-09-12 08:42:57','2026-09-12 08:42:57',NULL),(6,'sound test','universfield-new-notification-051-494246.mp3','/Users/apple/Desktop/Remote Office Portel/server/uploads/notification-sounds/cdf001de-7348-4a8e-bec8-b5def3a8578c.mp3','audio/mpeg',78576,2,NULL,0,1,'2026-09-12 08:49:57','2026-09-12 08:59:39',NULL);
/*!40000 ALTER TABLE `notification_sounds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_subscriptions`
--

DROP TABLE IF EXISTS `notification_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_subscriptions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `endpoint` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `p256dh` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auth` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `browser` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_notification_endpoint` (`endpoint`(255)),
  KEY `idx_notification_subscription_user_active` (`user_id`,`is_active`),
  CONSTRAINT `fk_notification_subscription_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_subscriptions`
--

LOCK TABLES `notification_subscriptions` WRITE;
/*!40000 ALTER TABLE `notification_subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SYSTEM',
  `title` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint unsigned DEFAULT NULL,
  `action_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority` enum('NORMAL','IMPORTANT','WARNING','CRITICAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NORMAL',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` timestamp NULL DEFAULT NULL,
  `event_key` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `in_app_allowed` tinyint(1) NOT NULL DEFAULT '1',
  `desktop_allowed` tinyint(1) NOT NULL DEFAULT '1',
  `sound_allowed` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_notification_event_user` (`event_key`,`user_id`),
  KEY `idx_notifications_user_created` (`user_id`,`created_at`),
  KEY `idx_notifications_user_unread` (`user_id`,`is_read`,`created_at`),
  KEY `idx_notifications_reference` (`reference_type`,`reference_id`),
  KEY `idx_notifications_user_category_created` (`user_id`,`category`,`created_at`),
  KEY `idx_notifications_user_type_created` (`user_id`,`type`,`created_at`),
  KEY `idx_notifications_user_in_app_created` (`user_id`,`in_app_allowed`,`created_at`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=189 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,2,'BREAK_STARTED','BREAK','Break Started','Huzaifa Mustafa started a break at 10:17 pm.','ATTENDANCE',8,'/attendance','NORMAL',1,'2026-08-27 17:17:14','2026-08-27 17:17:38',NULL,1,1,1),(2,2,'BREAK_ENDED','BREAK','Break Ended','Huzaifa Mustafa returned from break. Duration: 0 minutes.','ATTENDANCE',8,'/attendance','NORMAL',1,'2026-08-27 17:17:28','2026-08-27 17:17:38',NULL,1,1,1),(3,2,'ATTENDANCE_CLOCK_OUT','ATTENDANCE','Employee Clocked Out','Huzaifa Mustafa clocked out at 10:17 pm.','ATTENDANCE',8,'/attendance','NORMAL',1,'2026-08-27 17:17:31','2026-08-27 17:17:38',NULL,1,1,1),(4,3,'LEAVE_REJECTED','LEAVE','Leave Rejected','Your leave request from 2026-09-01 to 2026-09-02 has been rejected. Reason: jhkjg','LEAVE',13,'/leave','NORMAL',1,'2026-08-27 17:27:35','2026-08-28 17:42:38',NULL,1,1,1),(5,2,'ATTENDANCE_LATE_ARRIVAL','ATTENDANCE','Late Arrival','Huzaifa Mustafa clocked in 223 minutes late.','ATTENDANCE',9,'/attendance','NORMAL',1,'2026-08-28 16:58:12','2026-08-28 17:32:27',NULL,1,1,1),(6,2,'BREAK_STARTED','BREAK','Break Started','Huzaifa Mustafa started a break at 10:07 pm.','ATTENDANCE',9,'/attendance','NORMAL',1,'2026-08-28 17:07:58','2026-08-28 17:32:27',NULL,1,1,1),(7,2,'BREAK_ENDED','BREAK','Break Ended','Huzaifa Mustafa returned from break. Duration: 0 minutes.','ATTENDANCE',9,'/attendance','NORMAL',1,'2026-08-28 17:08:01','2026-08-28 17:32:27',NULL,1,1,1),(8,2,'ATTENDANCE_CLOCK_OUT','ATTENDANCE','Employee Clocked Out','Huzaifa Mustafa clocked out at 10:08 pm.','ATTENDANCE',9,'/attendance','NORMAL',1,'2026-08-28 17:08:03','2026-08-28 17:32:27',NULL,1,1,1),(9,2,'ATTENDANCE_LATE_ARRIVAL','ATTENDANCE','Late Arrival','Huzaifa Mustafa clocked in 256 minutes late.','ATTENDANCE',10,'/attendance','NORMAL',1,'2026-08-28 17:31:20','2026-08-28 17:32:24',NULL,1,1,1),(10,2,'BREAK_STARTED','BREAK','Break Started','Huzaifa Mustafa started a break at 10:33 pm.','ATTENDANCE',10,'/attendance','NORMAL',1,'2026-08-28 17:33:00','2026-08-28 17:39:52',NULL,1,1,1),(11,2,'BREAK_ENDED','BREAK','Break Ended','Huzaifa Mustafa returned from break. Duration: 2 minutes.','ATTENDANCE',10,'/attendance','NORMAL',1,'2026-08-28 17:35:38','2026-08-28 17:39:52',NULL,1,1,1),(12,2,'ATTENDANCE_CLOCK_OUT','ATTENDANCE','Employee Clocked Out','Huzaifa Mustafa clocked out at 10:35 pm.','ATTENDANCE',10,'/attendance','NORMAL',1,'2026-08-28 17:35:43','2026-08-28 17:39:52',NULL,1,1,1),(13,2,'ATTENDANCE_CLOCK_IN','ATTENDANCE','Employee Clocked In','Huzaifa Mustafa clocked in at 11:16 am.','ATTENDANCE',11,'/attendance','NORMAL',1,'2026-08-29 06:16:45','2026-09-01 15:29:33',NULL,1,1,1),(14,2,'BREAK_STARTED','BREAK','Break Started','Huzaifa Mustafa started a break at 11:26 am.','ATTENDANCE',11,'/attendance','NORMAL',1,'2026-08-29 06:26:01','2026-09-01 15:29:33',NULL,1,1,1),(15,2,'BREAK_ENDED','BREAK','Break Ended','Huzaifa Mustafa returned from break. Duration: 0 minutes.','ATTENDANCE',11,'/attendance','NORMAL',1,'2026-08-29 06:26:03','2026-09-01 15:29:33',NULL,1,1,1),(16,2,'ATTENDANCE_CLOCK_OUT','ATTENDANCE','Employee Clocked Out','Huzaifa Mustafa clocked out at 11:26 am.','ATTENDANCE',11,'/attendance','NORMAL',1,'2026-08-29 06:26:04','2026-09-01 15:29:33',NULL,1,1,1),(17,2,'ATTENDANCE_LATE_ARRIVAL','ATTENDANCE','Late Arrival','Huzaifa Mustafa clocked in 165 minutes late.','ATTENDANCE',12,'/attendance','NORMAL',1,'2026-09-01 16:00:17','2026-09-01 16:37:17',NULL,1,1,1),(18,2,'BREAK_STARTED','BREAK','Break Started','Huzaifa Mustafa started a break at 09:00 pm.','ATTENDANCE',12,'/attendance','NORMAL',1,'2026-09-01 16:00:46','2026-09-01 16:37:17',NULL,1,1,1),(19,2,'BREAK_ENDED','BREAK','Break Ended','Huzaifa Mustafa returned from break. Duration: 0 minutes.','ATTENDANCE',12,'/attendance','NORMAL',1,'2026-09-01 16:01:02','2026-09-01 16:37:17',NULL,1,1,1),(20,2,'ATTENDANCE_CLOCK_OUT','ATTENDANCE','Employee Clocked Out','Huzaifa Mustafa clocked out at 09:01 pm.','ATTENDANCE',12,'/attendance','NORMAL',1,'2026-09-01 16:01:03','2026-09-01 16:37:17',NULL,1,1,1),(21,2,'LEAVE_REQUESTED','LEAVE','New Leave Request','Huzaifa Mustafa requested CASUAL from 2026-09-02 to 2026-09-02.','LEAVE',15,'/leave-requests?open=15','NORMAL',1,'2026-09-01 16:36:44','2026-09-01 16:36:51',NULL,1,1,1),(22,3,'LEAVE_REJECTED','LEAVE','Leave Rejected','Your leave request from 2026-09-02 to 2026-09-02 has been rejected. Reason: hgfhgvnb','LEAVE',15,'/leave','NORMAL',0,'2026-09-01 16:36:59',NULL,NULL,1,1,1),(23,2,'LEAVE_REQUESTED','LEAVE','New Leave Request','Huzaifa Mustafa requested CASUAL from 2026-09-02 to 2026-09-02.','LEAVE',16,'/leave-requests?open=16','NORMAL',1,'2026-09-01 16:37:05','2026-09-01 16:37:17',NULL,1,1,1),(24,2,'LEAVE_REQUESTED','LEAVE','New Leave Request','Huzaifa Mustafa requested CASUAL from 2026-09-03 to 2026-09-03.','LEAVE',17,'/leave-requests?open=17','NORMAL',1,'2026-09-01 16:37:29','2026-09-01 16:37:34',NULL,1,1,1),(25,3,'LEAVE_APPROVED','LEAVE','Leave Approved','Your leave request from 2026-09-02 to 2026-09-02 has been approved.','LEAVE',16,'/leave','NORMAL',0,'2026-09-01 16:37:43',NULL,NULL,1,1,1),(26,3,'LEAVE_APPROVED','LEAVE','Leave Approved','Your leave request from 2026-09-03 to 2026-09-03 has been approved.','LEAVE',17,'/leave','NORMAL',0,'2026-09-01 16:38:31',NULL,NULL,1,1,1),(27,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-07 16:00:54','2026-09-08 16:41:58',NULL,1,1,1),(28,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-07 16:04:42','2026-09-08 16:41:58',NULL,1,1,1),(29,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-07 16:05:06','2026-09-08 16:41:58',NULL,1,1,1),(30,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-07 16:17:02','2026-09-08 16:41:58',NULL,1,1,1),(31,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-07 16:26:49','2026-09-08 16:41:58',NULL,1,1,1),(32,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-07 16:41:55','2026-09-08 16:41:58',NULL,1,1,1),(33,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',3,'/employees/3','NORMAL',1,'2026-09-07 16:42:46','2026-09-08 16:41:58',NULL,1,1,1),(34,2,'ATTENDANCE_LATE_ARRIVAL','ATTENDANCE','Late Arrival','Huzaifa Mustafa clocked in 223 minutes late.','ATTENDANCE',13,'/attendance','NORMAL',1,'2026-09-07 16:43:16','2026-09-08 16:41:58',NULL,1,1,1),(35,2,'BREAK_STARTED','BREAK','Break Started','Huzaifa Mustafa started a break at 09:43 pm.','ATTENDANCE',13,'/attendance','NORMAL',1,'2026-09-07 16:43:21','2026-09-08 16:41:58',NULL,1,1,1),(36,2,'BREAK_ENDED','BREAK','Break Ended','Huzaifa Mustafa returned from break. Duration: 0 minutes.','ATTENDANCE',13,'/attendance','NORMAL',1,'2026-09-07 16:43:25','2026-09-08 16:41:58',NULL,1,1,1),(37,2,'ATTENDANCE_CLOCK_OUT','ATTENDANCE','Employee Clocked Out','Huzaifa Mustafa clocked out at 09:43 pm.','ATTENDANCE',13,'/attendance','NORMAL',1,'2026-09-07 16:43:26','2026-09-08 16:41:58',NULL,1,1,1),(38,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',3,'/employees/3','NORMAL',1,'2026-09-07 16:49:43','2026-09-08 16:41:58',NULL,1,1,1),(39,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',7,'/employees/7','NORMAL',1,'2026-09-07 16:55:24','2026-09-08 16:41:58',NULL,1,1,1),(40,2,'ATTENDANCE_LATE_ARRIVAL','ATTENDANCE','Late Arrival','Huzaifa Mustafa clocked in 235 minutes late.','ATTENDANCE',14,'/attendance','NORMAL',1,'2026-09-07 16:55:51','2026-09-08 16:41:58',NULL,1,1,1),(41,2,'ATTENDANCE_CLOCK_OUT','ATTENDANCE','Employee Clocked Out','Huzaifa Mustafa clocked out at 09:56 pm.','ATTENDANCE',14,'/attendance','NORMAL',1,'2026-09-07 16:56:42','2026-09-08 16:41:58',NULL,1,1,1),(42,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-08 13:45:55','2026-09-08 16:41:58',NULL,1,1,1),(43,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',3,'/employees/3','NORMAL',1,'2026-09-08 14:59:28','2026-09-08 16:41:58',NULL,1,1,1),(44,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-08 15:03:22','2026-09-08 16:41:58',NULL,1,1,1),(45,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',3,'/employees/3','NORMAL',1,'2026-09-08 15:07:45','2026-09-08 16:41:58',NULL,1,1,1),(46,2,'LATE_ARRIVAL','ATTENDANCE','Late Arrival','Huzaifa Mustafa clocked in 130 minutes late.','ATTENDANCE',15,'/attendance','NORMAL',1,'2026-09-08 15:10:13','2026-09-08 16:41:58','LATE_ARRIVAL:15:2',1,1,0),(47,2,'BREAK_STARTED','BREAK','Break Started','Huzaifa Mustafa started a break at 08:10 pm.','ATTENDANCE',15,'/attendance','NORMAL',1,'2026-09-08 15:10:50','2026-09-08 16:41:58','BREAK_STARTED:15:2',1,1,1),(48,2,'BREAK_ENDED','BREAK','Break Ended','Huzaifa Mustafa returned from break. Duration: 0 minutes.','ATTENDANCE',15,'/attendance','NORMAL',1,'2026-09-08 15:11:07','2026-09-08 16:41:58','BREAK_ENDED:15:2',1,1,0),(51,2,'CLOCK_OUT','ATTENDANCE','Employee Clocked Out','Huzaifa Mustafa clocked out at 08:11 pm.','ATTENDANCE',15,'/attendance','NORMAL',1,'2026-09-08 15:11:12','2026-09-08 16:41:58','CLOCK_OUT:15:2',1,0,0),(52,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-08 15:19:48','2026-09-08 16:41:58',NULL,1,1,1),(53,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',3,'/employees/3','NORMAL',1,'2026-09-08 15:29:57','2026-09-08 16:41:58',NULL,1,1,1),(54,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',7,'/employees/7','NORMAL',1,'2026-09-08 16:08:44','2026-09-08 16:41:58',NULL,1,1,1),(55,2,'LATE_ARRIVAL','ATTENDANCE','Late Arrival','Huzaifa Mustafa clocked in 188 minutes late.','ATTENDANCE',16,'/attendance','NORMAL',1,'2026-09-08 16:08:53','2026-09-08 16:41:58','LATE_ARRIVAL:16:2',1,1,0),(56,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-09 04:13:43','2026-09-14 05:44:21',NULL,1,1,1),(57,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',3,'/employees/3','NORMAL',1,'2026-09-09 04:14:24','2026-09-14 05:44:21',NULL,1,1,1),(58,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',7,'/employees/7','NORMAL',1,'2026-09-09 04:14:59','2026-09-14 05:44:21',NULL,1,1,1),(59,2,'CLOCK_OUT','ATTENDANCE','Employee Clocked Out','Huzaifa Mustafa clocked out at 09:15 am.','ATTENDANCE',16,'/attendance','NORMAL',1,'2026-09-09 04:15:06','2026-09-14 05:44:21','CLOCK_OUT:16:2',1,0,0),(60,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-09 05:01:03','2026-09-14 05:44:21',NULL,1,1,1),(61,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',7,'/employees/7','NORMAL',1,'2026-09-09 05:47:48','2026-09-14 05:44:21',NULL,1,1,1),(62,2,'CLOCK_IN','ATTENDANCE','Employee Clocked In','Huzaifa Mustafa clocked in at 10:50 am.','ATTENDANCE',18,'/attendance','NORMAL',1,'2026-09-09 05:50:30','2026-09-14 05:44:21','CLOCK_IN:18:2',1,0,0),(63,2,'CLOCK_OUT','ATTENDANCE','Employee Clocked Out','Huzaifa Mustafa clocked out at 10:51 am.','ATTENDANCE',18,'/attendance','NORMAL',1,'2026-09-09 05:51:56','2026-09-14 05:44:21','CLOCK_OUT:18:2',1,0,0),(64,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-09 14:15:38','2026-09-14 05:44:21',NULL,1,1,1),(65,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',3,'/employees/3','NORMAL',1,'2026-09-09 15:24:43','2026-09-14 05:44:21',NULL,1,1,1),(66,2,'LATE_ARRIVAL','ATTENDANCE','Late Arrival','Huzaifa Mustafa clocked in 144 minutes late.','ATTENDANCE',19,'/attendance','NORMAL',1,'2026-09-09 15:24:45','2026-09-14 05:44:21','LATE_ARRIVAL:19:2',1,1,0),(67,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',7,'/employees/7','NORMAL',1,'2026-09-09 15:43:03','2026-09-14 05:44:21',NULL,1,1,1),(68,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','huz Mustafa logged in to the portal.','EMPLOYEE',8,'/employees/8','NORMAL',1,'2026-09-09 15:45:53','2026-09-14 05:44:21',NULL,1,1,1),(69,2,'CLOCK_IN','ATTENDANCE','Employee Clocked In','huz Mustafa clocked in at 08:46 pm.','ATTENDANCE',20,'/attendance','NORMAL',1,'2026-09-09 15:46:07','2026-09-14 05:44:21','CLOCK_IN:20:2',1,0,0),(70,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',7,'/employees/7','NORMAL',1,'2026-09-09 16:08:32','2026-09-14 05:44:21',NULL,1,1,1),(71,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',3,'/employees/3','NORMAL',1,'2026-09-09 16:09:59','2026-09-14 05:44:21',NULL,1,1,1),(72,2,'BREAK_STARTED','BREAK','Break Started','Huzaifa Mustafa started a break at 09:10 pm.','ATTENDANCE',19,'/attendance','NORMAL',1,'2026-09-09 16:10:21','2026-09-14 05:44:21','BREAK_STARTED:19:2',1,1,1),(73,2,'BREAK_ENDED','BREAK','Break Ended','Huzaifa Mustafa returned from break. Duration: 0 minutes.','ATTENDANCE',19,'/attendance','NORMAL',1,'2026-09-09 16:10:24','2026-09-14 05:44:21','BREAK_ENDED:19:2',1,1,0),(74,2,'CLOCK_OUT','ATTENDANCE','Employee Clocked Out','Huzaifa Mustafa clocked out at 09:10 pm.','ATTENDANCE',19,'/attendance','NORMAL',1,'2026-09-09 16:10:25','2026-09-14 05:44:21','CLOCK_OUT:19:2',1,0,0),(75,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','huz Mustafa logged in to the portal.','EMPLOYEE',8,'/employees/8','NORMAL',1,'2026-09-09 16:21:09','2026-09-14 05:44:21',NULL,1,1,1),(76,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-09 17:19:26','2026-09-14 05:44:21',NULL,1,1,1),(77,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-09 18:12:59','2026-09-14 05:44:21',NULL,1,1,1),(78,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-09 18:19:42','2026-09-14 05:44:21',NULL,1,1,1),(79,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-10 14:46:55','2026-09-14 05:44:21',NULL,1,1,1),(80,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',3,'/employees/3','NORMAL',1,'2026-09-10 15:17:58','2026-09-14 05:44:21',NULL,1,1,1),(81,2,'LATE_ARRIVAL','ATTENDANCE','Late Arrival','Huzaifa Mustafa clocked in 138 minutes late.','ATTENDANCE',21,'/attendance','NORMAL',1,'2026-09-10 15:18:07','2026-09-14 05:44:21','LATE_ARRIVAL:21:2',1,1,0),(82,2,'BREAK_STARTED','BREAK','Break Started','Huzaifa Mustafa started a break at 08:27 pm.','ATTENDANCE',21,'/attendance','NORMAL',1,'2026-09-10 15:27:48','2026-09-14 05:44:21','BREAK_STARTED:21:2',1,1,1),(83,2,'BREAK_ENDED','BREAK','Break Ended','Huzaifa Mustafa returned from break. Duration: 0 minutes.','ATTENDANCE',21,'/attendance','NORMAL',1,'2026-09-10 15:28:04','2026-09-14 05:44:21','BREAK_ENDED:21:2',1,1,0),(84,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',7,'/employees/7','NORMAL',1,'2026-09-10 16:40:58','2026-09-14 05:44:21',NULL,1,1,1),(85,2,'LATE_ARRIVAL','ATTENDANCE','Late Arrival','Huzaifa Mustafa clocked in 221 minutes late.','ATTENDANCE',22,'/attendance','NORMAL',1,'2026-09-10 16:41:10','2026-09-14 05:44:21','LATE_ARRIVAL:22:2',1,1,0),(86,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',7,'/employees/7','NORMAL',1,'2026-09-10 16:42:14','2026-09-14 05:44:21',NULL,1,1,1),(87,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',7,'/employees/7','NORMAL',1,'2026-09-10 17:03:17','2026-09-14 05:44:21',NULL,1,1,1),(88,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-10 17:09:11','2026-09-14 05:44:21',NULL,1,1,1),(89,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-11 14:49:25','2026-09-14 05:44:21',NULL,1,1,1),(90,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-11 15:01:10','2026-09-14 05:44:21',NULL,1,1,1),(91,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',7,'/employees/7','NORMAL',1,'2026-09-11 16:38:10','2026-09-14 05:44:21',NULL,1,1,1),(92,2,'CLOCK_OUT','ATTENDANCE','Employee Clocked Out','Huzaifa Mustafa clocked out at 09:43 pm.','ATTENDANCE',22,'/attendance','NORMAL',1,'2026-09-11 16:43:37','2026-09-14 05:44:21','CLOCK_OUT:22:2',1,0,0),(93,2,'LATE_ARRIVAL','ATTENDANCE','Late Arrival','Huzaifa Mustafa clocked in 280 minutes late.','ATTENDANCE',23,'/attendance','NORMAL',1,'2026-09-11 17:40:29','2026-09-14 05:44:21','LATE_ARRIVAL:23:2',1,1,0),(94,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',3,'/employees/3','NORMAL',1,'2026-09-12 04:25:28','2026-09-14 05:44:21',NULL,1,1,1),(95,2,'CLOCK_OUT','ATTENDANCE','Employee Clocked Out','Huzaifa Mustafa clocked out at 09:25 am.','ATTENDANCE',21,'/attendance','NORMAL',1,'2026-09-12 04:25:50','2026-09-14 05:44:21','CLOCK_OUT:21:2',1,0,0),(96,2,'ATTENDANCE_PORTAL_LOGIN','ATTENDANCE','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-12 04:26:28','2026-09-14 05:44:21',NULL,1,1,1),(101,2,'ATTENDANCE_PORTAL_LOGIN','SYSTEM','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-12 08:14:17','2026-09-14 05:44:21',NULL,1,1,1),(102,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:18:53','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789201133481',1,1,1),(103,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:18:54','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789201134294',1,1,1),(104,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:18:54','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789201134984',1,1,1),(105,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:18:55','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789201135683',1,1,1),(106,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:18:56','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789201136169',1,1,1),(107,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:18:56','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789201136521',1,1,1),(108,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:18:56','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789201136705',1,1,1),(109,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:18:56','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789201136882',1,1,1),(110,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:18:57','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789201137057',1,1,1),(111,3,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',0,'2026-09-12 08:19:16',NULL,'TEST_NOTIFICATION:3:1789201156241',1,0,1),(112,3,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',0,'2026-09-12 08:19:16',NULL,'TEST_NOTIFICATION:3:1789201156945',1,0,1),(113,3,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',0,'2026-09-12 08:19:17',NULL,'TEST_NOTIFICATION:3:1789201157474',1,0,1),(114,3,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',0,'2026-09-12 08:19:18',NULL,'TEST_NOTIFICATION:3:1789201158683',1,0,1),(115,3,'CALENDAR_HOLIDAY_DELETED','CALENDAR','Company Holiday Cancelled','test 2 on 2026-09-15 has been cancelled.','COMPANY_CALENDAR',16,'/company-calendar','NORMAL',0,'2026-09-12 08:19:57',NULL,'CALENDAR_HOLIDAY_DELETED:16:3',1,1,0),(116,8,'CALENDAR_HOLIDAY_DELETED','CALENDAR','Company Holiday Cancelled','test 2 on 2026-09-15 has been cancelled.','COMPANY_CALENDAR',16,'/company-calendar','NORMAL',0,'2026-09-12 08:19:57',NULL,'CALENDAR_HOLIDAY_DELETED:16:8',1,0,0),(117,7,'CALENDAR_HOLIDAY_DELETED','CALENDAR','Company Holiday Cancelled','test 2 on 2026-09-15 has been cancelled.','COMPANY_CALENDAR',16,'/company-calendar','NORMAL',1,'2026-09-12 08:19:57','2026-09-12 09:09:51','CALENDAR_HOLIDAY_DELETED:16:7',1,0,0),(118,3,'CALENDAR_HOLIDAY_DELETED','CALENDAR','Company Holiday Cancelled','test on 2026-09-16 has been cancelled.','COMPANY_CALENDAR',15,'/company-calendar','NORMAL',0,'2026-09-12 08:20:00',NULL,'CALENDAR_HOLIDAY_DELETED:15:3',1,1,0),(119,7,'CALENDAR_HOLIDAY_DELETED','CALENDAR','Company Holiday Cancelled','test on 2026-09-16 has been cancelled.','COMPANY_CALENDAR',15,'/company-calendar','NORMAL',1,'2026-09-12 08:20:00','2026-09-12 09:09:51','CALENDAR_HOLIDAY_DELETED:15:7',1,0,0),(120,8,'CALENDAR_HOLIDAY_DELETED','CALENDAR','Company Holiday Cancelled','test on 2026-09-16 has been cancelled.','COMPANY_CALENDAR',15,'/company-calendar','NORMAL',0,'2026-09-12 08:20:00',NULL,'CALENDAR_HOLIDAY_DELETED:15:8',1,0,0),(121,2,'CALENDAR_HOLIDAY_CREATED','CALENDAR','Company Calendar Updated','testing has been added for 2026-09-14.','COMPANY_CALENDAR',NULL,'/company-calendar','NORMAL',1,'2026-09-12 08:20:17','2026-09-14 05:44:21','CALENDAR_HOLIDAY_CREATED:2026-09-14:2026-09-14:SPECIAL_OFF_DAY:2',1,1,1),(122,7,'CALENDAR_HOLIDAY_CREATED','CALENDAR','Company Calendar Updated','testing has been added for 2026-09-14.','COMPANY_CALENDAR',NULL,'/company-calendar','NORMAL',1,'2026-09-12 08:20:17','2026-09-12 09:09:51','CALENDAR_HOLIDAY_CREATED:2026-09-14:2026-09-14:SPECIAL_OFF_DAY:7',1,0,1),(123,8,'CALENDAR_HOLIDAY_CREATED','CALENDAR','Company Calendar Updated','testing has been added for 2026-09-14.','COMPANY_CALENDAR',NULL,'/company-calendar','NORMAL',0,'2026-09-12 08:20:17',NULL,'CALENDAR_HOLIDAY_CREATED:2026-09-14:2026-09-14:SPECIAL_OFF_DAY:8',1,0,1),(124,3,'CALENDAR_HOLIDAY_CREATED','CALENDAR','Company Calendar Updated','testing has been added for 2026-09-14.','COMPANY_CALENDAR',NULL,'/company-calendar','NORMAL',0,'2026-09-12 08:20:17',NULL,'CALENDAR_HOLIDAY_CREATED:2026-09-14:2026-09-14:SPECIAL_OFF_DAY:3',1,1,1),(125,2,'LEAVE_REQUESTED','LEAVE','New Leave Request','Huzaifa Mustafa requested SICK from 2026-09-15 to 2026-09-15.','LEAVE',18,'/leave-requests?open=18','NORMAL',1,'2026-09-12 08:20:47','2026-09-14 05:44:21',NULL,1,1,1),(126,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:50:07','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789203007845',1,1,1),(127,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:50:08','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789203008663',1,1,1),(128,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:50:25','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789203025764',1,1,1),(129,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:50:26','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789203026522',1,1,1),(130,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:50:28','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789203028727',1,1,1),(131,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:50:29','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789203029312',1,1,1),(132,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:50:29','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789203029761',1,1,1),(133,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:50:30','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789203030282',1,1,1),(134,3,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',0,'2026-09-12 08:51:28',NULL,'TEST_NOTIFICATION:3:1789203088682',1,1,1),(135,3,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',0,'2026-09-12 08:51:29',NULL,'TEST_NOTIFICATION:3:1789203089555',1,1,1),(136,3,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',0,'2026-09-12 08:51:30',NULL,'TEST_NOTIFICATION:3:1789203090202',1,1,1),(137,2,'SECURITY_LOGIN','SECURITY','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',7,'/employees/7','NORMAL',1,'2026-09-12 08:51:59','2026-09-14 05:44:21','SECURITY_LOGIN:cd8303d4-9c24-4268-b864-1d0e9fc16c8d',1,0,0),(138,2,'SECURITY_NEW_DEVICE','SECURITY','New device detected','Huzaifa Mustafa signed in from a new device.','EMPLOYEE',7,'/login-security','WARNING',1,'2026-09-12 08:51:59','2026-09-14 05:44:21','SECURITY_LOGIN_SIGNAL:cd8303d4-9c24-4268-b864-1d0e9fc16c8d',1,1,1),(139,2,'CLOCK_OUT','ATTENDANCE','Employee Clocked Out','Huzaifa Mustafa clocked out at 01:52 pm.','ATTENDANCE',23,'/attendance','NORMAL',1,'2026-09-12 08:52:02','2026-09-14 05:44:21','CLOCK_OUT:23:2',1,1,1),(140,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:59:24','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789203564223',1,1,1),(141,2,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 08:59:25','2026-09-14 05:44:21','TEST_NOTIFICATION:2:1789203565108',1,1,1),(142,3,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',0,'2026-09-12 09:00:08',NULL,'TEST_NOTIFICATION:3:1789203608264',1,1,1),(143,3,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',0,'2026-09-12 09:00:09',NULL,'TEST_NOTIFICATION:3:1789203609254',1,1,1),(144,3,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',0,'2026-09-12 09:00:09',NULL,'TEST_NOTIFICATION:3:1789203609751',1,1,1),(145,3,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',0,'2026-09-12 09:00:10',NULL,'TEST_NOTIFICATION:3:1789203610239',1,1,1),(146,7,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 09:00:24','2026-09-12 09:09:51','TEST_NOTIFICATION:7:1789203624923',1,1,1),(147,7,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 09:00:33','2026-09-12 09:09:51','TEST_NOTIFICATION:7:1789203633742',1,1,1),(148,7,'TEST_NOTIFICATION','SYSTEM','Test notification','Your notification system is working correctly.','SYSTEM',NULL,NULL,'IMPORTANT',1,'2026-09-12 09:00:37','2026-09-12 09:09:51','TEST_NOTIFICATION:7:1789203637642',1,1,1),(167,7,'OPEN_TASK_CREATED','TASK','New Open Task','A new open task is available: “tash”.','TASK',47,'/tasks?task=47','NORMAL',0,'2026-09-12 09:58:46',NULL,'OPEN_TASK_CREATED:47:7',1,1,1),(168,8,'OPEN_TASK_CREATED','TASK','New Open Task','A new open task is available: “tash”.','TASK',47,'/tasks?task=47','NORMAL',0,'2026-09-12 09:58:46',NULL,'OPEN_TASK_CREATED:47:8',1,0,1),(169,3,'OPEN_TASK_CREATED','TASK','New Open Task','A new open task is available: “tash”.','TASK',47,'/tasks?task=47','NORMAL',1,'2026-09-12 09:58:46','2026-09-12 10:03:16','OPEN_TASK_CREATED:47:3',1,1,1),(170,2,'SECURITY_LOGIN','SECURITY','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',1,'2026-09-14 05:43:34','2026-09-14 05:44:21','SECURITY_LOGIN:bea1265d-68f6-4182-8a1f-329a24b3f5b1',1,0,0),(171,2,'SECURITY_LOGIN','SECURITY','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',7,'/employees/7','NORMAL',0,'2026-09-14 05:59:50',NULL,'SECURITY_LOGIN:f9691ec5-a7c3-4dc2-9977-636444b0ffd7',1,0,0),(172,2,'SECURITY_LOGIN','SECURITY','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',0,'2026-09-14 14:52:03',NULL,'SECURITY_LOGIN:003dcd7c-2369-4775-9c16-f6173d63a767',1,0,0),(174,2,'SECURITY_LOGIN','SECURITY','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',7,'/employees/7','NORMAL',0,'2026-09-14 15:29:02',NULL,'SECURITY_LOGIN:fccbb83d-a3ea-48bd-a3c6-c04dc0a3bf2b',1,0,0),(175,2,'SECURITY_LOGIN','SECURITY','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',7,'/employees/7','NORMAL',0,'2026-09-14 16:47:56',NULL,'SECURITY_LOGIN:6e648ba6-5423-4254-8553-50656a8ec4b0',1,0,0),(176,2,'SECURITY_LOGIN','SECURITY','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',0,'2026-09-14 16:48:21',NULL,'SECURITY_LOGIN:744d79a9-30f8-4eb7-88e0-986b3e06f6ab',1,0,0),(177,2,'SECURITY_LOGIN','SECURITY','Employee logged in','System Admin logged in to the portal.','EMPLOYEE',2,'/employees/2','NORMAL',0,'2026-09-15 04:26:07',NULL,'SECURITY_LOGIN:f51c90ee-70b2-40ff-99f9-1000c0932399',1,0,0),(178,3,'OPEN_TASK_CREATED','TASK','New Open Task','A new open task is available: “test”.','TASK',48,'/tasks?task=48','NORMAL',0,'2026-09-15 04:26:21',NULL,'OPEN_TASK_CREATED:48:3',1,1,1),(179,8,'OPEN_TASK_CREATED','TASK','New Open Task','A new open task is available: “test”.','TASK',48,'/tasks?task=48','NORMAL',0,'2026-09-15 04:26:21',NULL,'OPEN_TASK_CREATED:48:8',1,0,1),(180,7,'OPEN_TASK_CREATED','TASK','New Open Task','A new open task is available: “test”.','TASK',48,'/tasks?task=48','NORMAL',0,'2026-09-15 04:26:21',NULL,'OPEN_TASK_CREATED:48:7',1,1,1),(181,2,'SECURITY_LOGIN','SECURITY','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',7,'/employees/7','NORMAL',0,'2026-09-15 04:26:37',NULL,'SECURITY_LOGIN:bc4a32ee-afe1-4bca-9986-af6d4556b93a',1,0,0),(182,2,'CLOCK_IN','ATTENDANCE','Employee Clocked In','Huzaifa Mustafa clocked in at 09:26 am.','ATTENDANCE',24,'/attendance','NORMAL',0,'2026-09-15 04:26:39',NULL,'CLOCK_IN:24:2',1,1,1),(183,7,'CLOCK_IN','ATTENDANCE','Employee Clocked In','Huzaifa Mustafa clocked in at 09:26 am.','ATTENDANCE',24,'/attendance','NORMAL',0,'2026-09-15 04:26:39',NULL,'CLOCK_IN:24:7',1,1,1),(184,2,'TASK_CLAIMED','TASK','Open Task Claimed','An employee claimed “test”.','TASK',38,'/tasks?task=38','NORMAL',0,'2026-09-15 04:26:47',NULL,'TASK_CLAIMED:38:2',1,1,1),(185,2,'TASK_STARTED','TASK','Task Started','An employee started “test”.','TASK',38,'/tasks?task=38','NORMAL',0,'2026-09-15 04:26:50',NULL,'TASK_STARTED:38:2',1,0,0),(186,2,'SECURITY_LOGIN','SECURITY','Employee logged in','Huzaifa Mustafa logged in to the portal.','EMPLOYEE',7,'/employees/7','NORMAL',0,'2026-09-15 04:41:35',NULL,'SECURITY_LOGIN:dd127ce6-8904-4d16-a094-20630b203b0c',1,0,0),(187,2,'TASK_UPDATED','TASK','Temporary','Cleanup test','TASK',NULL,NULL,'NORMAL',0,'2026-09-15 04:43:23',NULL,NULL,1,1,1),(188,2,'TASK_COMPLETED','TASK','Task Completed','An employee completed “test”.','TASK',38,'/tasks?task=38','NORMAL',0,'2026-09-15 04:54:30',NULL,'TASK_COMPLETED:38:2',1,0,0);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ongoing_work`
--

DROP TABLE IF EXISTS `ongoing_work`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ongoing_work` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ONGOING','PAUSED','COMPLETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ONGOING',
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ongoing_work_employee_status` (`employee_id`,`status`,`updated_at`),
  CONSTRAINT `fk_ongoing_work_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ongoing_work`
--

LOCK TABLES `ongoing_work` WRITE;
/*!40000 ALTER TABLE `ongoing_work` DISABLE KEYS */;
INSERT INTO `ongoing_work` VALUES (3,7,'ETST','TEWTYD','COMPLETED','2026-09-15 09:52:36','2026-09-15 09:53:10','2026-09-15 04:52:36','2026-09-15 04:53:10'),(4,7,'TEST','TEWYT','ONGOING','2026-09-15 09:53:25',NULL,'2026-09-15 04:53:25','2026-09-15 04:53:25');
/*!40000 ALTER TABLE `ongoing_work` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payroll_adjustments`
--

DROP TABLE IF EXISTS `payroll_adjustments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_adjustments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `payroll_run_id` bigint unsigned NOT NULL,
  `employee_id` bigint unsigned NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `adjustment_type` enum('ALLOWANCE','DEDUCTION','POSITIVE_ADJUSTMENT','NEGATIVE_ADJUSTMENT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint unsigned DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_payroll_adjustment_employee` (`employee_id`),
  KEY `fk_payroll_adjustment_creator` (`created_by`),
  KEY `fk_payroll_adjustment_updater` (`updated_by`),
  KEY `idx_payroll_adjustment_run_employee` (`payroll_run_id`,`employee_id`),
  CONSTRAINT `fk_payroll_adjustment_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_payroll_adjustment_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_payroll_adjustment_run` FOREIGN KEY (`payroll_run_id`) REFERENCES `payroll_runs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payroll_adjustment_updater` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll_adjustments`
--

LOCK TABLES `payroll_adjustments` WRITE;
/*!40000 ALTER TABLE `payroll_adjustments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payroll_adjustments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payroll_attendance_penalties`
--

DROP TABLE IF EXISTS `payroll_attendance_penalties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_attendance_penalties` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `payroll_item_id` bigint unsigned NOT NULL,
  `penalty_id` bigint unsigned NOT NULL,
  `deduction_amount` decimal(12,2) NOT NULL,
  `policy_snapshot` json NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payroll_penalty` (`payroll_item_id`,`penalty_id`),
  KEY `penalty_id` (`penalty_id`),
  CONSTRAINT `payroll_attendance_penalties_ibfk_1` FOREIGN KEY (`payroll_item_id`) REFERENCES `payroll_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payroll_attendance_penalties_ibfk_2` FOREIGN KEY (`penalty_id`) REFERENCES `attendance_penalties` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll_attendance_penalties`
--

LOCK TABLES `payroll_attendance_penalties` WRITE;
/*!40000 ALTER TABLE `payroll_attendance_penalties` DISABLE KEYS */;
/*!40000 ALTER TABLE `payroll_attendance_penalties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payroll_day_details`
--

DROP TABLE IF EXISTS `payroll_day_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_day_details` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `payroll_item_id` bigint unsigned NOT NULL,
  `work_date` date NOT NULL,
  `classification` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attendance_id` bigint unsigned DEFAULT NULL,
  `leave_day_id` bigint unsigned DEFAULT NULL,
  `calendar_day_id` bigint unsigned DEFAULT NULL,
  `deduction_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payroll_item_work_date` (`payroll_item_id`,`work_date`),
  KEY `fk_payroll_day_attendance` (`attendance_id`),
  KEY `fk_payroll_day_leave` (`leave_day_id`),
  KEY `fk_payroll_day_calendar` (`calendar_day_id`),
  KEY `idx_payroll_day_classification` (`classification`,`work_date`),
  CONSTRAINT `fk_payroll_day_attendance` FOREIGN KEY (`attendance_id`) REFERENCES `attendance_records` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_payroll_day_calendar` FOREIGN KEY (`calendar_day_id`) REFERENCES `company_calendar_days` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_payroll_day_item` FOREIGN KEY (`payroll_item_id`) REFERENCES `payroll_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payroll_day_leave` FOREIGN KEY (`leave_day_id`) REFERENCES `leave_days` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=249 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll_day_details`
--

LOCK TABLES `payroll_day_details` WRITE;
/*!40000 ALTER TABLE `payroll_day_details` DISABLE KEYS */;
INSERT INTO `payroll_day_details` VALUES (187,7,'2026-08-05','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:38'),(188,7,'2026-08-06','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:38'),(189,7,'2026-08-07','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:38'),(190,7,'2026-08-08','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:38'),(191,7,'2026-08-09','WEEKLY_OFF',NULL,NULL,NULL,0.00,'2026-09-05 04:27:38'),(192,7,'2026-08-10','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:38'),(193,7,'2026-08-11','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:38'),(194,7,'2026-08-12','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:38'),(195,7,'2026-08-13','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:38'),(196,7,'2026-08-14','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:38'),(197,7,'2026-08-15','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:38'),(198,7,'2026-08-16','WEEKLY_OFF',NULL,NULL,NULL,0.00,'2026-09-05 04:27:38'),(199,7,'2026-08-17','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:38'),(200,7,'2026-08-18','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:38'),(201,7,'2026-08-19','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:38'),(202,7,'2026-08-20','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:38'),(203,7,'2026-08-21','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:38'),(204,7,'2026-08-22','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:38'),(205,7,'2026-08-23','WEEKLY_OFF',NULL,NULL,NULL,0.00,'2026-09-05 04:27:38'),(206,7,'2026-08-24','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:38'),(207,7,'2026-08-25','UNAUTHORIZED_ABSENCE',5,NULL,NULL,833.33,'2026-09-05 04:27:38'),(208,7,'2026-08-26','PRESENT',2,NULL,NULL,0.00,'2026-09-05 04:27:38'),(209,7,'2026-08-27','PRESENT',7,NULL,NULL,0.00,'2026-09-05 04:27:38'),(210,7,'2026-08-28','PRESENT',10,NULL,NULL,0.00,'2026-09-05 04:27:38'),(211,7,'2026-08-29','FREE_APPROVED_LEAVE',NULL,18,NULL,0.00,'2026-09-05 04:27:39'),(212,7,'2026-08-30','WEEKLY_OFF',NULL,NULL,NULL,0.00,'2026-09-05 04:27:39'),(213,7,'2026-08-31','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(214,7,'2026-09-01','PRESENT',12,NULL,NULL,0.00,'2026-09-05 04:27:39'),(215,7,'2026-09-02','DEDUCTIBLE_APPROVED_LEAVE',NULL,23,NULL,833.33,'2026-09-05 04:27:39'),(216,7,'2026-09-03','DEDUCTIBLE_APPROVED_LEAVE',NULL,24,NULL,833.33,'2026-09-05 04:27:39'),(217,7,'2026-09-04','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(218,8,'2026-08-05','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(219,8,'2026-08-06','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(220,8,'2026-08-07','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(221,8,'2026-08-08','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(222,8,'2026-08-09','WEEKLY_OFF',NULL,NULL,NULL,0.00,'2026-09-05 04:27:39'),(223,8,'2026-08-10','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(224,8,'2026-08-11','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(225,8,'2026-08-12','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(226,8,'2026-08-13','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(227,8,'2026-08-14','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(228,8,'2026-08-15','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(229,8,'2026-08-16','WEEKLY_OFF',NULL,NULL,NULL,0.00,'2026-09-05 04:27:39'),(230,8,'2026-08-17','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(231,8,'2026-08-18','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(232,8,'2026-08-19','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(233,8,'2026-08-20','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(234,8,'2026-08-21','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(235,8,'2026-08-22','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(236,8,'2026-08-23','WEEKLY_OFF',NULL,NULL,NULL,0.00,'2026-09-05 04:27:39'),(237,8,'2026-08-24','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(238,8,'2026-08-25','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(239,8,'2026-08-26','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(240,8,'2026-08-27','PRESENT',8,NULL,NULL,0.00,'2026-09-05 04:27:39'),(241,8,'2026-08-28','PRESENT',9,NULL,NULL,0.00,'2026-09-05 04:27:39'),(242,8,'2026-08-29','PRESENT',11,NULL,NULL,0.00,'2026-09-05 04:27:39'),(243,8,'2026-08-30','WEEKLY_OFF',NULL,NULL,NULL,0.00,'2026-09-05 04:27:39'),(244,8,'2026-08-31','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(245,8,'2026-09-01','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(246,8,'2026-09-02','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(247,8,'2026-09-03','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39'),(248,8,'2026-09-04','UNAUTHORIZED_ABSENCE',NULL,NULL,NULL,833.33,'2026-09-05 04:27:39');
/*!40000 ALTER TABLE `payroll_day_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payroll_items`
--

DROP TABLE IF EXISTS `payroll_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `payroll_run_id` bigint unsigned NOT NULL,
  `employee_id` bigint unsigned NOT NULL,
  `salary_profile_id` bigint unsigned NOT NULL,
  `base_salary` decimal(12,2) NOT NULL,
  `salary_divisor` decimal(8,2) NOT NULL,
  `per_day_salary` decimal(12,2) NOT NULL DEFAULT '0.00',
  `working_days` smallint unsigned NOT NULL DEFAULT '0',
  `present_days` smallint unsigned NOT NULL DEFAULT '0',
  `free_leave_days` smallint unsigned NOT NULL DEFAULT '0',
  `deductible_leave_days` smallint unsigned NOT NULL DEFAULT '0',
  `absence_days` smallint unsigned NOT NULL DEFAULT '0',
  `leave_deduction` decimal(12,2) NOT NULL DEFAULT '0.00',
  `absence_deduction` decimal(12,2) NOT NULL DEFAULT '0.00',
  `allowances` decimal(12,2) NOT NULL DEFAULT '0.00',
  `manual_deductions` decimal(12,2) NOT NULL DEFAULT '0.00',
  `positive_adjustments` decimal(12,2) NOT NULL DEFAULT '0.00',
  `negative_adjustments` decimal(12,2) NOT NULL DEFAULT '0.00',
  `adjustments` decimal(12,2) NOT NULL DEFAULT '0.00',
  `gross_salary` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_deductions` decimal(12,2) NOT NULL DEFAULT '0.00',
  `net_salary` decimal(12,2) NOT NULL,
  `calculation_status` enum('VERIFIED','CALCULATION_MISMATCH') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VERIFIED',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `half_days` int unsigned NOT NULL DEFAULT '0',
  `late_penalty_days` decimal(10,4) NOT NULL DEFAULT '0.0000',
  `half_day_deduction` decimal(12,2) NOT NULL DEFAULT '0.00',
  `late_penalty_deduction` decimal(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payroll_employee` (`payroll_run_id`,`employee_id`),
  KEY `idx_payroll_item_employee` (`employee_id`),
  KEY `salary_profile_id` (`salary_profile_id`),
  CONSTRAINT `payroll_items_ibfk_1` FOREIGN KEY (`payroll_run_id`) REFERENCES `payroll_runs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payroll_items_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `payroll_items_ibfk_3` FOREIGN KEY (`salary_profile_id`) REFERENCES `employee_salary_profiles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll_items`
--

LOCK TABLES `payroll_items` WRITE;
/*!40000 ALTER TABLE `payroll_items` DISABLE KEYS */;
INSERT INTO `payroll_items` VALUES (7,2,3,2,25000.00,30.00,833.33,27,4,1,2,20,1666.66,16666.60,0.00,0.00,0.00,0.00,0.00,25000.00,18333.26,6666.74,'VERIFIED','2026-09-05 04:27:38','2026-09-05 04:27:38',0,0.0000,0.00,0.00),(8,2,7,1,25000.00,30.00,833.33,27,3,0,0,24,0.00,19999.92,0.00,0.00,0.00,0.00,0.00,25000.00,19999.92,5000.08,'VERIFIED','2026-09-05 04:27:39','2026-09-05 04:27:39',0,0.0000,0.00,0.00);
/*!40000 ALTER TABLE `payroll_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payroll_runs`
--

DROP TABLE IF EXISTS `payroll_runs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_runs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `period_label` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `status` enum('DRAFT','APPROVED','PAID') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `review_required` tinyint(1) NOT NULL DEFAULT '0',
  `generated_by` bigint unsigned DEFAULT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `reopened_by` bigint unsigned DEFAULT NULL,
  `reopened_at` datetime DEFAULT NULL,
  `reopen_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_by` bigint unsigned DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `payment_method` enum('BANK_TRANSFER','CASH','OTHER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `payment_reference` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payroll_period` (`period_start`,`period_end`),
  KEY `idx_payroll_status` (`status`,`period_start`),
  KEY `generated_by` (`generated_by`),
  KEY `approved_by` (`approved_by`),
  KEY `paid_by` (`paid_by`),
  KEY `fk_payroll_reopened_by` (`reopened_by`),
  CONSTRAINT `fk_payroll_reopened_by` FOREIGN KEY (`reopened_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payroll_runs_ibfk_1` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payroll_runs_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payroll_runs_ibfk_3` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll_runs`
--

LOCK TABLES `payroll_runs` WRITE;
/*!40000 ALTER TABLE `payroll_runs` DISABLE KEYS */;
INSERT INTO `payroll_runs` VALUES (1,'2026-08','2026-07-05','2026-08-04','PAID',0,2,2,'2026-08-27 22:20:18',NULL,NULL,NULL,2,'2026-08-27 22:20:52',NULL,NULL,NULL,NULL,'2026-08-27 17:18:04','2026-08-27 17:20:52'),(2,'2026-09','2026-08-05','2026-09-04','DRAFT',0,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-01 15:30:17','2026-09-01 15:30:17');
/*!40000 ALTER TABLE `payroll_runs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payroll_settings`
--

DROP TABLE IF EXISTS `payroll_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_settings` (
  `id` tinyint unsigned NOT NULL,
  `cycle_start_day` tinyint unsigned NOT NULL DEFAULT '5',
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PKR',
  `default_salary_divisor` smallint unsigned NOT NULL DEFAULT '30',
  `updated_by` bigint unsigned DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_payroll_settings_user` (`updated_by`),
  CONSTRAINT `fk_payroll_settings_user` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll_settings`
--

LOCK TABLES `payroll_settings` WRITE;
/*!40000 ALTER TABLE `payroll_settings` DISABLE KEYS */;
INSERT INTO `payroll_settings` VALUES (1,5,'PKR',30,NULL,'2026-08-27 17:16:55');
/*!40000 ALTER TABLE `payroll_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'dashboard.view','View the dashboard','2026-08-26 11:16:06'),(2,'employees.view_own','View own employee profile','2026-08-26 11:16:06'),(3,'employees.view_all','View all employees','2026-08-26 11:16:06'),(4,'employees.create','Create employees','2026-08-26 11:16:06'),(5,'employees.update','Update employees','2026-08-26 11:16:06'),(6,'employees.deactivate','Activate or deactivate employees','2026-08-26 11:16:06'),(7,'roles.view','View roles','2026-08-26 11:16:06'),(8,'roles.manage','Create and update roles','2026-08-26 11:16:06'),(9,'permissions.view','View permissions','2026-08-26 11:16:06'),(10,'permissions.manage','Assign permissions to roles','2026-08-26 11:16:06'),(11,'audit.view','View audit logs','2026-08-26 11:16:06'),(12,'attendance.clock','Clock in, take breaks, and clock out','2026-08-26 11:30:37'),(13,'attendance.view_own','View own attendance records','2026-08-26 11:30:37'),(14,'attendance.view_all','View attendance for all employees','2026-08-26 11:30:37'),(15,'attendance.edit','Correct attendance records','2026-08-26 11:30:37'),(16,'attendance.reports','View attendance reports','2026-08-26 11:30:37'),(22,'leave.create','Submit a leave request','2026-08-26 12:09:05'),(23,'leave.view_own','View own leave requests','2026-08-26 12:09:05'),(24,'leave.view_all','View all employee leave requests','2026-08-26 12:09:05'),(25,'leave.approve','Approve leave requests','2026-08-26 12:09:05'),(26,'leave.reject','Reject leave requests','2026-08-26 12:09:05'),(27,'leave.cancel_own','Cancel own pending leave requests','2026-08-26 12:09:05'),(28,'leave.reports','View leave and payroll-preparation reports','2026-08-26 12:09:05'),(36,'calendar.view','View the company working calendar','2026-08-26 12:29:57'),(37,'calendar.manage','Create, edit, and cancel company holidays','2026-08-26 12:29:57'),(42,'shift.view','View employee work schedules','2026-08-27 17:16:46'),(43,'shift.manage','Manage work schedule definitions','2026-08-27 17:16:46'),(44,'shift.assign','Assign effective-dated schedules to employees','2026-08-27 17:16:46'),(45,'salary.view_all','View all employee salary profiles','2026-08-27 17:16:46'),(46,'salary.manage','Manage effective-dated employee salaries','2026-08-27 17:16:46'),(47,'salary.view_own','View own salary profile','2026-08-27 17:17:04'),(48,'payroll.view_own','View own payroll','2026-08-27 17:17:04'),(49,'payroll.view_all','View all payroll','2026-08-27 17:17:04'),(50,'payroll.generate','Generate draft payroll','2026-08-27 17:17:04'),(51,'payroll.recalculate','Recalculate draft payroll','2026-08-27 17:17:04'),(52,'payroll.approve','Approve payroll','2026-08-27 17:17:04'),(53,'payroll.mark_paid','Mark approved payroll paid','2026-08-27 17:17:04'),(54,'payroll.adjust','Manage payroll adjustments','2026-08-27 17:17:04'),(55,'reports.view','View company-wide reports and analytics','2026-08-28 17:15:26'),(56,'reports.export','Export company reports','2026-08-28 17:15:26'),(57,'payroll.reopen','Reopen approved payroll with a reason','2026-08-28 17:31:36'),(58,'employees.reset_password','Reset another employee password','2026-09-04 18:14:39'),(59,'employees.delete','Archive an employee account','2026-09-04 18:14:39'),(61,'portal.access_mobile','Allows this role to access the Remote Office Portal from mobile devices.','2026-09-05 11:06:16'),(62,'attendance_policy.view','View applicable attendance policy','2026-09-07 15:59:25'),(63,'attendance_policy.manage','Create attendance policy versions','2026-09-07 15:59:25'),(64,'attendance_penalty.view','View own attendance penalties','2026-09-07 15:59:25'),(65,'attendance_penalty.manage','View all and waive attendance penalties','2026-09-07 15:59:25'),(66,'notification_policy.view','View company notification policies','2026-09-07 16:57:45'),(67,'notification_policy.manage','Manage company notification policies','2026-09-07 16:57:45'),(68,'notification_preferences.view','View own notification preferences','2026-09-07 16:57:45'),(69,'notification_preferences.manage','Manage own notification preferences','2026-09-07 16:57:45'),(70,'notification.view_own','View own notifications','2026-09-07 16:57:45'),(71,'permissions.employee_override.manage','Manage individual employee permission overrides','2026-09-08 13:45:11'),(72,'task.view_own','View own and available open tasks','2026-09-08 15:15:07'),(73,'task.view_all','View all tasks','2026-09-08 15:15:07'),(74,'task.create','Create tasks and drafts','2026-09-08 15:15:07'),(75,'task.edit','Edit tasks','2026-09-08 15:15:07'),(76,'task.assign','Assign and reassign tasks','2026-09-08 15:15:07'),(77,'task.claim','Claim open tasks','2026-09-08 15:15:07'),(78,'task.manage','Manage task workflow','2026-09-08 15:15:07'),(79,'task.review','Review submitted tasks','2026-09-08 15:15:07'),(80,'task.archive','Archive and restore tasks','2026-09-08 15:15:07'),(81,'task.delete','Permanently delete archived tasks','2026-09-08 15:15:07'),(82,'task.analytics','View task analytics','2026-09-08 15:15:07'),(83,'task.settings','Manage task settings','2026-09-08 15:15:07'),(84,'security.login_activity.view','View login security and session activity','2026-09-10 16:03:27'),(85,'security.sessions.revoke','Terminate active login sessions','2026-09-10 16:03:27'),(86,'notes.view_own','View own work notes','2026-09-14 14:58:31'),(87,'notes.create','Create work notes','2026-09-14 14:58:31'),(88,'notes.edit_own','Edit own work notes','2026-09-14 14:58:31'),(89,'notes.delete_own','Delete own work notes','2026-09-14 14:58:31'),(90,'notes.view_team','View team-visible work notes','2026-09-14 14:58:31'),(91,'notes.view_all','View all work notes','2026-09-14 14:58:31'),(92,'notes.edit_all','Edit all work notes','2026-09-14 14:58:31'),(93,'notes.delete_all','Permanently delete all work notes','2026-09-14 14:58:31'),(94,'notes.archive','Archive accessible work notes','2026-09-14 14:58:31'),(95,'notes.manage_categories','Manage work note categories','2026-09-14 14:58:31'),(96,'notes.comment','Comment on accessible notes','2026-09-14 15:15:59'),(97,'notes.manage_comments','Remove any note comment','2026-09-14 15:15:59'),(98,'notes.upload_attachment','Upload note attachments','2026-09-14 15:15:59'),(99,'notes.mention_employee','Mention employees in notes','2026-09-14 15:15:59'),(100,'notes.pin_personal','Pin notes personally','2026-09-14 15:15:59'),(101,'notes.pin_company','Pin notes company-wide','2026-09-14 15:15:59'),(102,'notes.manage_templates','Manage note templates','2026-09-14 15:15:59'),(103,'notes.promote_knowledge','Promote notes to the knowledge base','2026-09-14 15:15:59'),(104,'notes.view_knowledge','View company knowledge','2026-09-14 15:15:59'),(105,'notes.manage_knowledge','Manage knowledge visibility and categories','2026-09-14 15:15:59'),(106,'notes.view_revisions','View note revision history','2026-09-14 15:15:59'),(107,'notes.restore_revision','Restore note revisions','2026-09-14 15:15:59'),(108,'notes.require_task_documentation','Configure task documentation requirements','2026-09-14 15:15:59');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` bigint unsigned NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `idx_role_permissions_permission` (`permission_id`),
  CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1,'2026-08-26 11:16:06'),(1,2,'2026-08-26 11:16:06'),(1,3,'2026-08-26 11:16:06'),(1,4,'2026-08-26 11:16:06'),(1,5,'2026-08-26 11:16:06'),(1,6,'2026-08-26 11:16:06'),(1,7,'2026-08-26 11:16:06'),(1,8,'2026-08-26 11:16:06'),(1,9,'2026-08-26 11:16:06'),(1,10,'2026-08-26 11:16:06'),(1,11,'2026-08-26 11:16:06'),(1,14,'2026-08-26 11:30:37'),(1,15,'2026-08-26 11:30:37'),(1,16,'2026-08-26 11:30:37'),(1,24,'2026-08-26 12:09:05'),(1,25,'2026-08-26 12:09:05'),(1,26,'2026-08-26 12:09:05'),(1,28,'2026-08-26 12:09:05'),(1,36,'2026-08-26 12:29:57'),(1,37,'2026-08-26 12:29:57'),(1,42,'2026-08-27 17:16:46'),(1,43,'2026-08-27 17:16:46'),(1,44,'2026-08-27 17:16:46'),(1,45,'2026-08-27 17:16:46'),(1,46,'2026-08-27 17:16:46'),(1,49,'2026-08-27 17:17:05'),(1,50,'2026-08-27 17:17:05'),(1,51,'2026-08-27 17:17:05'),(1,52,'2026-08-27 17:17:05'),(1,53,'2026-08-27 17:17:05'),(1,54,'2026-08-27 17:17:05'),(1,55,'2026-08-28 17:15:26'),(1,56,'2026-08-28 17:15:26'),(1,57,'2026-08-28 17:31:36'),(1,58,'2026-09-04 18:14:39'),(1,59,'2026-09-04 18:14:39'),(1,61,'2026-09-05 11:06:16'),(1,62,'2026-09-07 15:59:25'),(1,63,'2026-09-07 15:59:25'),(1,64,'2026-09-07 15:59:25'),(1,65,'2026-09-07 15:59:25'),(1,66,'2026-09-07 16:57:45'),(1,67,'2026-09-07 16:57:45'),(1,68,'2026-09-07 16:57:45'),(1,69,'2026-09-07 16:57:45'),(1,70,'2026-09-07 16:57:45'),(1,71,'2026-09-08 13:45:11'),(1,72,'2026-09-08 15:15:07'),(1,73,'2026-09-08 15:15:07'),(1,74,'2026-09-08 15:15:07'),(1,75,'2026-09-08 15:15:07'),(1,76,'2026-09-08 15:15:07'),(1,78,'2026-09-08 15:15:07'),(1,79,'2026-09-08 15:15:07'),(1,80,'2026-09-08 15:15:07'),(1,81,'2026-09-08 15:15:07'),(1,82,'2026-09-08 15:15:07'),(1,83,'2026-09-08 15:15:07'),(1,84,'2026-09-10 16:03:27'),(1,85,'2026-09-10 16:03:27'),(1,86,'2026-09-14 14:58:31'),(1,87,'2026-09-14 14:58:31'),(1,88,'2026-09-14 14:58:31'),(1,89,'2026-09-14 14:58:31'),(1,90,'2026-09-14 14:58:31'),(1,91,'2026-09-14 14:58:31'),(1,92,'2026-09-14 14:58:31'),(1,93,'2026-09-14 14:58:31'),(1,94,'2026-09-14 14:58:31'),(1,95,'2026-09-14 14:58:31'),(1,96,'2026-09-14 15:15:59'),(1,97,'2026-09-14 15:15:59'),(1,98,'2026-09-14 15:15:59'),(1,99,'2026-09-14 15:15:59'),(1,100,'2026-09-14 15:15:59'),(1,101,'2026-09-14 15:15:59'),(1,102,'2026-09-14 15:15:59'),(1,103,'2026-09-14 15:15:59'),(1,104,'2026-09-14 15:15:59'),(1,105,'2026-09-14 15:15:59'),(1,106,'2026-09-14 15:15:59'),(1,107,'2026-09-14 15:15:59'),(1,108,'2026-09-14 15:15:59'),(2,1,'2026-09-08 15:06:47'),(2,2,'2026-09-08 15:06:47'),(2,12,'2026-09-08 15:06:47'),(2,13,'2026-09-08 15:06:47'),(2,22,'2026-09-08 15:06:47'),(2,23,'2026-09-08 15:06:47'),(2,27,'2026-09-08 15:06:47'),(2,36,'2026-09-08 15:06:47'),(2,42,'2026-09-08 15:06:47'),(2,47,'2026-09-08 15:06:47'),(2,48,'2026-09-08 15:06:47'),(2,62,'2026-09-08 15:06:47'),(2,64,'2026-09-08 15:06:47'),(2,68,'2026-09-08 15:06:47'),(2,69,'2026-09-08 15:06:47'),(2,70,'2026-09-08 15:06:47'),(2,72,'2026-09-08 15:15:07'),(2,77,'2026-09-08 15:15:07'),(2,86,'2026-09-14 14:58:31'),(2,87,'2026-09-14 14:58:31'),(2,88,'2026-09-14 14:58:31'),(2,96,'2026-09-14 15:15:59'),(2,98,'2026-09-14 15:20:52'),(2,99,'2026-09-14 15:15:59'),(2,100,'2026-09-14 15:15:59'),(2,104,'2026-09-14 15:15:59'),(2,106,'2026-09-14 15:15:59'),(2,107,'2026-09-14 15:15:59');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'CEO','2026-08-26 11:16:06','2026-08-26 11:16:06'),(2,'Employee','2026-08-26 11:16:06','2026-08-26 11:16:06');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schema_migrations`
--

DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schema_migrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `migration_name` (`migration_name`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schema_migrations`
--

LOCK TABLES `schema_migrations` WRITE;
/*!40000 ALTER TABLE `schema_migrations` DISABLE KEYS */;
INSERT INTO `schema_migrations` VALUES (1,'001_initial_schema.sql','2026-08-27 17:17:22'),(2,'002_attendance.sql','2026-08-27 17:17:22'),(3,'003_attendance_eligibility.sql','2026-08-27 17:17:22'),(4,'004_leave_management.sql','2026-08-27 17:17:22'),(5,'005_company_calendar.sql','2026-08-27 17:17:22'),(6,'006_notifications.sql','2026-08-27 17:17:22'),(7,'007_employee_work_settings.sql','2026-08-27 17:17:22'),(8,'008_night_shift_payroll_cycle.sql','2026-08-27 17:17:22'),(9,'009_shift_assignments_payroll.sql','2026-08-27 17:17:22'),(10,'010_runtime_repair.sql','2026-08-27 17:29:58'),(11,'011_reports_permissions_indexes.sql','2026-08-28 17:15:26'),(12,'012_payroll_salary_audit.sql','2026-08-28 17:31:36'),(13,'013_auth_sessions.sql','2026-08-29 05:57:41'),(14,'014_employee_password_archive.sql','2026-09-04 18:14:39'),(15,'015_remove_employee_archiving.sql','2026-09-04 18:22:49'),(16,'016_fix_saturday_off_calendar_type.sql','2026-09-04 18:54:14'),(17,'017_repair_default_role_permissions.sql','2026-09-04 19:18:39'),(18,'018_mobile_portal_access.sql','2026-09-05 11:06:16'),(19,'019_attendance_policy.sql','2026-09-07 15:59:25'),(20,'020_notification_push_subscriptions.sql','2026-09-07 16:04:49'),(21,'021_notification_announcement_preference.sql','2026-09-07 16:38:59'),(22,'022_notification_policies.sql','2026-09-07 16:57:45'),(23,'023_user_permission_overrides.sql','2026-09-08 13:45:11'),(24,'024_task_management_phase1.sql','2026-09-08 15:15:07'),(25,'025_task_analytics_indexes.sql','2026-09-09 04:38:48'),(26,'026_task_collaboration.sql','2026-09-09 15:14:46'),(27,'027_break_task_session_integration.sql','2026-09-10 15:06:34'),(28,'028_task_presence_indexes.sql','2026-09-10 15:15:12'),(29,'029_team_availability.sql','2026-09-10 15:49:15'),(30,'030_login_security.sql','2026-09-10 16:03:27'),(31,'031_notification_preferences_v2.sql','2026-09-12 08:08:01'),(32,'032_notification_channel_delivery.sql','2026-09-12 08:09:26'),(33,'033_notification_sound_manager.sql','2026-09-12 08:42:57'),(34,'034_task_notification_events.sql','2026-09-12 09:44:50'),(35,'035_work_notes.sql','2026-09-14 14:58:31'),(36,'036_advanced_work_notes.sql','2026-09-14 15:15:59'),(37,'037_note_attachments.sql','2026-09-14 15:19:01'),(38,'038_note_employee_collaboration_permissions.sql','2026-09-14 15:20:52'),(39,'039_simple_notes_phase_4_1.sql','2026-09-14 15:40:02'),(40,'040_task_work_notes.sql','2026-09-14 15:48:30'),(41,'041_namaz_ongoing_work.sql','2026-09-15 04:40:22');
/*!40000 ALTER TABLE `schema_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_activities`
--

DROP TABLE IF EXISTS `task_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_activities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `task_id` bigint unsigned NOT NULL,
  `event_type` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_user_id` bigint unsigned DEFAULT NULL,
  `previous_status` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `actor_user_id` (`actor_user_id`),
  KEY `idx_task_activity` (`task_id`,`created_at`),
  KEY `idx_task_activity_event` (`event_type`,`created_at`),
  CONSTRAINT `task_activities_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_activities_ibfk_2` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=169 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_activities`
--

LOCK TABLES `task_activities` WRITE;
/*!40000 ALTER TABLE `task_activities` DISABLE KEYS */;
INSERT INTO `task_activities` VALUES (92,32,'TASK_CREATED',2,NULL,'OPEN','{\"assignmentType\": \"OPEN\"}','2026-09-09 15:44:00'),(93,32,'TASK_CLAIMED',7,'OPEN','TO_DO','{}','2026-09-09 15:44:24'),(136,32,'TASK_IN_PROGRESS',7,'TO_DO','IN_PROGRESS','{\"note\": null, \"reason\": null, \"revisionDueAt\": null}','2026-09-10 16:41:16'),(137,32,'IMAGE_ADDED',7,'IN_PROGRESS','IN_PROGRESS','{\"context\": \"SUBMISSION\", \"imageId\": 12}','2026-09-10 16:41:26'),(138,32,'TASK_SUBMITTED_FOR_REVIEW',7,'IN_PROGRESS','SUBMITTED_FOR_REVIEW','{\"note\": null, \"reason\": null, \"revisionDueAt\": null}','2026-09-10 16:41:26'),(139,32,'TASK_COMPLETED',2,'SUBMITTED_FOR_REVIEW','COMPLETED','{\"note\": null, \"reason\": null, \"revisionDueAt\": null}','2026-09-10 17:09:25'),(140,38,'TASK_CREATED',2,NULL,'OPEN','{\"assignmentType\": \"OPEN\"}','2026-09-12 08:53:13'),(154,47,'TASK_CREATED',2,NULL,'OPEN','{\"assignmentType\": \"OPEN\"}','2026-09-12 09:58:46'),(155,48,'TASK_CREATED',2,NULL,'OPEN','{\"assignmentType\": \"OPEN\"}','2026-09-15 04:26:21'),(156,38,'TASK_CLAIMED',7,'OPEN','TO_DO','{}','2026-09-15 04:26:47'),(157,38,'TASK_IN_PROGRESS',7,'TO_DO','IN_PROGRESS','{\"note\": null, \"reason\": null, \"revisionDueAt\": null}','2026-09-15 04:26:49'),(158,38,'WORK_SESSION_PAUSED',NULL,'IN_PROGRESS','IN_PROGRESS','{\"reason\": \"OFFLINE_TIMEOUT\", \"employeeId\": 7, \"effectiveEndAt\": \"2026-09-15 09:31:49\", \"timeoutMinutes\": 5}','2026-09-15 04:32:28'),(159,38,'WORK_SESSION_RESUMED',7,'IN_PROGRESS','IN_PROGRESS','{\"note\": null, \"reason\": \"MANUAL_RESUME\", \"revisionDueAt\": null}','2026-09-15 04:35:02'),(160,38,'WORK_SESSION_PAUSED',NULL,'IN_PROGRESS','IN_PROGRESS','{\"reason\": \"PAUSED\", \"employeeId\": 7}','2026-09-15 04:35:02'),(162,38,'WORK_SESSION_RESUMED',7,'IN_PROGRESS','IN_PROGRESS','{\"note\": null, \"reason\": \"MANUAL_RESUME\", \"revisionDueAt\": null}','2026-09-15 04:44:06'),(163,38,'WORK_SESSION_PAUSED',NULL,'IN_PROGRESS','IN_PROGRESS','{\"reason\": \"PAUSED\", \"employeeId\": 7}','2026-09-15 04:44:06'),(164,38,'WORK_SESSION_RESUMED',7,'IN_PROGRESS','IN_PROGRESS','{\"note\": null, \"reason\": \"MANUAL_RESUME\", \"revisionDueAt\": null}','2026-09-15 04:54:21'),(165,38,'IMAGE_ADDED',7,'IN_PROGRESS','IN_PROGRESS','{\"context\": \"SUBMISSION\", \"imageId\": 13}','2026-09-15 04:54:30'),(166,38,'TASK_COMPLETED',7,'IN_PROGRESS','COMPLETED','{\"note\": null, \"reason\": null, \"revisionDueAt\": null}','2026-09-15 04:54:30'),(167,38,'TASK_ARCHIVED',2,'COMPLETED','ARCHIVED','{\"note\": null, \"reason\": null, \"revisionDueAt\": null}','2026-09-15 04:54:58'),(168,32,'TASK_ARCHIVED',2,'COMPLETED','ARCHIVED','{\"note\": null, \"reason\": null, \"revisionDueAt\": null}','2026-09-15 04:54:58');
/*!40000 ALTER TABLE `task_activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_assignment_history`
--

DROP TABLE IF EXISTS `task_assignment_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_assignment_history` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `task_id` bigint unsigned NOT NULL,
  `previous_employee_id` bigint unsigned DEFAULT NULL,
  `new_employee_id` bigint unsigned DEFAULT NULL,
  `changed_by` bigint unsigned NOT NULL,
  `reason` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assignment_source` enum('DIRECT','CLAIM','REASSIGN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `previous_employee_id` (`previous_employee_id`),
  KEY `changed_by` (`changed_by`),
  KEY `idx_task_assignments` (`task_id`,`created_at`),
  KEY `idx_task_assignment_employee` (`new_employee_id`,`created_at`),
  CONSTRAINT `task_assignment_history_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_assignment_history_ibfk_2` FOREIGN KEY (`previous_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `task_assignment_history_ibfk_3` FOREIGN KEY (`new_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `task_assignment_history_ibfk_4` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_assignment_history`
--

LOCK TABLES `task_assignment_history` WRITE;
/*!40000 ALTER TABLE `task_assignment_history` DISABLE KEYS */;
INSERT INTO `task_assignment_history` VALUES (33,32,NULL,7,7,NULL,'CLAIM','2026-09-09 15:44:24'),(47,38,NULL,7,7,NULL,'CLAIM','2026-09-15 04:26:47');
/*!40000 ALTER TABLE `task_assignment_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_attachments`
--

DROP TABLE IF EXISTS `task_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_attachments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `task_id` bigint unsigned NOT NULL,
  `uploaded_by` bigint unsigned NOT NULL,
  `storage_key` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size_bytes` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_task_attachments_task` (`task_id`,`created_at`),
  CONSTRAINT `task_attachments_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_attachments_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_attachments`
--

LOCK TABLES `task_attachments` WRITE;
/*!40000 ALTER TABLE `task_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_change_requests`
--

DROP TABLE IF EXISTS `task_change_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_change_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `task_id` bigint unsigned NOT NULL,
  `requested_by` bigint unsigned NOT NULL,
  `reason` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_due_at` datetime DEFAULT NULL,
  `revision_due_at` datetime DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `requested_by` (`requested_by`),
  KEY `idx_task_changes` (`task_id`,`created_at`),
  CONSTRAINT `task_change_requests_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_change_requests_ibfk_2` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_change_requests`
--

LOCK TABLES `task_change_requests` WRITE;
/*!40000 ALTER TABLE `task_change_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_change_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_comments`
--

DROP TABLE IF EXISTS `task_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_comments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `task_id` bigint unsigned NOT NULL,
  `author_user_id` bigint unsigned NOT NULL,
  `parent_comment_id` bigint unsigned DEFAULT NULL,
  `content` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `author_user_id` (`author_user_id`),
  KEY `idx_task_comments` (`task_id`,`created_at`),
  KEY `idx_task_comments_parent` (`parent_comment_id`),
  CONSTRAINT `fk_task_comment_parent` FOREIGN KEY (`parent_comment_id`) REFERENCES `task_comments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `task_comments_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_comments_ibfk_2` FOREIGN KEY (`author_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_comments`
--

LOCK TABLES `task_comments` WRITE;
/*!40000 ALTER TABLE `task_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_images`
--

DROP TABLE IF EXISTS `task_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `task_id` bigint unsigned NOT NULL,
  `uploaded_by` bigint unsigned NOT NULL,
  `image_context` enum('TASK_REFERENCE','SUBMISSION','CHANGES_REQUIRED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `storage_key` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` enum('image/jpeg','image/png','image/webp','image/gif') COLLATE utf8mb4_unicode_ci NOT NULL,
  `size_bytes` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_task_images_context` (`task_id`,`image_context`),
  CONSTRAINT `task_images_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_images_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_images`
--

LOCK TABLES `task_images` WRITE;
/*!40000 ALTER TABLE `task_images` DISABLE KEYS */;
INSERT INTO `task_images` VALUES (12,32,7,'SUBMISSION','/uploads/tasks/32/d0f2310b-6156-4bec-808c-6dde1d967df8.png','Screenshot 2026-09-09 at 11.12.15 PM.png','image/png',94195,'2026-09-10 16:41:26'),(13,38,7,'SUBMISSION','/uploads/tasks/38/71828533-2bc6-4aac-91e1-6d4b0289e73c.png','dashboard.png','image/png',715103,'2026-09-15 04:54:30');
/*!40000 ALTER TABLE `task_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_read_states`
--

DROP TABLE IF EXISTS `task_read_states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_read_states` (
  `task_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `last_read_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`task_id`,`user_id`),
  KEY `idx_task_read_user` (`user_id`,`last_read_at`),
  CONSTRAINT `task_read_states_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_read_states_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_read_states`
--

LOCK TABLES `task_read_states` WRITE;
/*!40000 ALTER TABLE `task_read_states` DISABLE KEYS */;
INSERT INTO `task_read_states` VALUES (32,2,'2026-09-11 16:22:11'),(38,2,'2026-09-14 05:49:33'),(47,3,'2026-09-12 10:03:30'),(32,7,'2026-09-10 17:08:57');
/*!40000 ALTER TABLE `task_read_states` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_settings`
--

DROP TABLE IF EXISTS `task_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_settings` (
  `id` tinyint unsigned NOT NULL DEFAULT '1',
  `offline_timeout_minutes` smallint unsigned NOT NULL DEFAULT '5',
  `max_open_claims_per_employee` smallint unsigned NOT NULL DEFAULT '3',
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `task_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `task_settings_chk_1` CHECK ((`offline_timeout_minutes` between 1 and 1440)),
  CONSTRAINT `task_settings_chk_2` CHECK ((`max_open_claims_per_employee` between 0 and 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_settings`
--

LOCK TABLES `task_settings` WRITE;
/*!40000 ALTER TABLE `task_settings` DISABLE KEYS */;
INSERT INTO `task_settings` VALUES (1,5,3,2,'2026-09-08 15:15:07','2026-09-10 15:51:00');
/*!40000 ALTER TABLE `task_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_work_sessions`
--

DROP TABLE IF EXISTS `task_work_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_work_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `task_id` bigint unsigned NOT NULL,
  `employee_id` bigint unsigned NOT NULL,
  `started_at` datetime NOT NULL,
  `ended_at` datetime DEFAULT NULL,
  `duration_seconds` int unsigned DEFAULT NULL,
  `end_reason` enum('PAUSED','BREAK','CLOCK_OUT','OFFLINE','SUBMITTED','COMPLETED','REASSIGNED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` enum('ACTIVE','ENDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `active_employee_id` bigint unsigned GENERATED ALWAYS AS (if((`state` = _utf8mb4'ACTIVE'),`employee_id`,NULL)) STORED,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_one_active_task_per_employee` (`active_employee_id`),
  KEY `employee_id` (`employee_id`),
  KEY `idx_task_sessions` (`task_id`,`employee_id`,`started_at`),
  CONSTRAINT `task_work_sessions_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_work_sessions_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_work_sessions`
--

LOCK TABLES `task_work_sessions` WRITE;
/*!40000 ALTER TABLE `task_work_sessions` DISABLE KEYS */;
INSERT INTO `task_work_sessions` (`id`, `task_id`, `employee_id`, `started_at`, `ended_at`, `duration_seconds`, `end_reason`, `state`, `created_at`, `updated_at`) VALUES (19,32,7,'2026-09-10 21:41:16','2026-09-10 21:41:26',10,'SUBMITTED','ENDED','2026-09-10 16:41:16','2026-09-10 16:41:26'),(21,38,7,'2026-09-15 09:26:49','2026-09-15 09:31:49',300,'OFFLINE','ENDED','2026-09-15 04:26:49','2026-09-15 04:32:28'),(22,38,7,'2026-09-15 09:35:02','2026-09-15 09:35:02',0,'PAUSED','ENDED','2026-09-15 04:35:02','2026-09-15 04:35:02'),(23,38,7,'2026-09-15 09:44:06','2026-09-15 09:44:06',0,'PAUSED','ENDED','2026-09-15 04:44:06','2026-09-15 04:44:06'),(24,38,7,'2026-09-15 09:54:21','2026-09-15 09:54:30',9,'COMPLETED','ENDED','2026-09-15 04:54:21','2026-09-15 04:54:30');
/*!40000 ALTER TABLE `task_work_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `instructions` text COLLATE utf8mb4_unicode_ci,
  `priority` enum('LOW','MEDIUM','HIGH','URGENT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDIUM',
  `assignment_type` enum('DIRECT','OPEN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `assignee_employee_id` bigint unsigned DEFAULT NULL,
  `status` enum('DRAFT','SCHEDULED','OPEN','TO_DO','IN_PROGRESS','SUBMITTED_FOR_REVIEW','CHANGES_REQUIRED','COMPLETED','ARCHIVED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_at` datetime DEFAULT NULL,
  `due_at` datetime DEFAULT NULL,
  `publish_mode` enum('DRAFT','NOW','SCHEDULED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `scheduled_publish_at` datetime DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `review_required` tinyint(1) NOT NULL DEFAULT '0',
  `completion_image_required` tinyint(1) NOT NULL DEFAULT '0',
  `submitted_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `created_by` bigint unsigned NOT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_tasks_status_priority_due` (`status`,`priority`,`due_at`),
  KEY `idx_tasks_assignment_status` (`assignment_type`,`status`),
  KEY `idx_tasks_assignee_status` (`assignee_employee_id`,`status`),
  KEY `idx_tasks_creator` (`created_by`),
  KEY `idx_tasks_schedule` (`status`,`scheduled_publish_at`),
  KEY `idx_tasks_created_at` (`created_at`),
  KEY `idx_tasks_completed_at` (`completed_at`),
  KEY `idx_tasks_due_completed` (`due_at`,`completed_at`),
  KEY `idx_tasks_assignee_created` (`assignee_employee_id`,`created_at`),
  FULLTEXT KEY `ft_tasks_title_description` (`title`,`description`),
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`assignee_employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `tasks_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES (32,'testdsyu1234','239804ruweiukefhkj','fdsfgsdf4r','MEDIUM','OPEN',7,'ARCHIVED','2026-09-09 20:43:00','2026-09-09 22:48:00','NOW',NULL,'2026-09-09 20:44:01',1,1,'2026-09-10 21:41:26','2026-09-10 22:09:25','2026-09-15 09:54:58',2,2,'2026-09-09 15:44:00','2026-09-15 04:54:58'),(38,'test','test','test','HIGH','OPEN',7,'ARCHIVED',NULL,NULL,'NOW',NULL,'2026-09-12 13:53:13',0,1,NULL,'2026-09-15 09:54:30','2026-09-15 09:54:58',2,2,'2026-09-12 08:53:13','2026-09-15 04:54:58'),(47,'tash','asydgajh','yuhgsajh','MEDIUM','OPEN',NULL,'OPEN',NULL,NULL,'NOW',NULL,'2026-09-12 14:58:47',0,0,NULL,NULL,NULL,2,2,'2026-09-12 09:58:46','2026-09-12 09:58:46'),(48,'test','hjsdgh','dghxjhc','MEDIUM','OPEN',NULL,'OPEN',NULL,NULL,'NOW',NULL,'2026-09-15 09:26:22',0,0,NULL,NULL,NULL,2,2,'2026-09-15 04:26:21','2026-09-15 04:26:21');
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_permission_overrides`
--

DROP TABLE IF EXISTS `user_permission_overrides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_permission_overrides` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  `effect` enum('ALLOW','DENY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_permission_override` (`user_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `user_permission_overrides_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_permission_overrides_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_permission_overrides_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `user_permission_overrides_ibfk_4` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permission_overrides`
--

LOCK TABLES `user_permission_overrides` WRITE;
/*!40000 ALTER TABLE `user_permission_overrides` DISABLE KEYS */;
INSERT INTO `user_permission_overrides` VALUES (3,3,61,'ALLOW',2,2,'2026-09-08 15:06:57','2026-09-08 15:06:57');
/*!40000 ALTER TABLE `user_permission_overrides` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `idx_user_roles_role` (`role_id`),
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (2,1,'2026-08-26 11:16:14'),(3,2,'2026-08-26 11:34:42'),(7,2,'2026-09-08 15:00:58'),(8,2,'2026-09-09 15:45:30');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned DEFAULT NULL,
  `email` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `password_changed_at` datetime DEFAULT NULL,
  `must_change_password` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `employee_id` (`employee_id`),
  KEY `idx_users_status` (`status`),
  CONSTRAINT `fk_users_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,2,'admin@remoteoffice.com','$2b$12$S8h9z8uYuzn6CL6J2eGjPujfeMgVSAwBn1EXrRwg5Sq2E2GehE3Vu','ACTIVE','2026-09-15 04:26:07','2026-08-26 11:16:14','2026-09-15 04:26:07',NULL,0),(3,3,'malikhuzaifa1126@gmail.com','$2b$12$EERwxfR31cXJkIoGo4rhJeRPYSXZ9u20K49qfg7CZ9ZHrefI0SM/6','ACTIVE','2026-09-12 04:25:28','2026-08-26 11:34:42','2026-09-12 04:25:28',NULL,0),(7,7,'huzaifa@gmail.com','$2b$12$E6fRCGuBitH20VMPvrEieuQcNGk6ilXaZHM0KZLm2Ekmgo4OTF1/a','ACTIVE','2026-09-15 04:41:35','2026-08-27 16:49:02','2026-09-15 04:41:35',NULL,0),(8,8,'malik@gmail.com','$2b$12$iHyrzeihEW2/ypjXmbcIZu6f51m55jC3B4Uayo0W2V.kLeYO121qy','ACTIVE','2026-09-09 16:21:09','2026-09-09 15:45:30','2026-09-09 16:21:09',NULL,0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_notes`
--

DROP TABLE IF EXISTS `work_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_notes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `work_performed` text COLLATE utf8mb4_unicode_ci,
  `problem` text COLLATE utf8mb4_unicode_ci,
  `solution` text COLLATE utf8mb4_unicode_ci,
  `important_information` text COLLATE utf8mb4_unicode_ci,
  `next_step` text COLLATE utf8mb4_unicode_ci,
  `author_user_id` bigint unsigned NOT NULL,
  `related_task_id` bigint unsigned DEFAULT NULL,
  `related_task_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` bigint unsigned DEFAULT NULL,
  `visibility` enum('TEAM','PRIVATE','CEO_ONLY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PRIVATE',
  `status` enum('DRAFT','PUBLISHED','ARCHIVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PUBLISHED',
  `is_important` tinyint(1) NOT NULL DEFAULT '0',
  `is_knowledge` tinyint(1) NOT NULL DEFAULT '0',
  `knowledge_section` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_pinned` tinyint(1) NOT NULL DEFAULT '0',
  `follow_up_required` tinyint(1) NOT NULL DEFAULT '0',
  `follow_up_date` date DEFAULT NULL,
  `follow_up_status` enum('PENDING','COMPLETED','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_work_notes_author_archived` (`author_user_id`,`is_archived`,`updated_at`),
  KEY `idx_work_notes_visibility_archived` (`visibility`,`is_archived`,`updated_at`),
  KEY `idx_work_notes_category` (`category_id`,`updated_at`),
  KEY `idx_work_notes_task` (`related_task_id`),
  KEY `idx_work_notes_follow_up` (`follow_up_required`,`follow_up_status`,`follow_up_date`),
  KEY `idx_work_notes_knowledge` (`is_knowledge`,`knowledge_section`,`status`,`updated_at`),
  KEY `idx_work_notes_status_visibility` (`status`,`visibility`,`updated_at`),
  FULLTEXT KEY `ft_work_notes_search` (`title`,`content`,`summary`,`work_performed`,`problem`,`solution`,`important_information`,`next_step`),
  CONSTRAINT `work_notes_ibfk_1` FOREIGN KEY (`author_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `work_notes_ibfk_2` FOREIGN KEY (`related_task_id`) REFERENCES `tasks` (`id`) ON DELETE SET NULL,
  CONSTRAINT `work_notes_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `note_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_notes`
--

LOCK TABLES `work_notes` WRITE;
/*!40000 ALTER TABLE `work_notes` DISABLE KEYS */;
INSERT INTO `work_notes` VALUES (4,'dasdad','asdfas','sadasd','sadas','asda','asdasd','dasda','dasda',2,NULL,NULL,NULL,'CEO_ONLY','PUBLISHED',0,0,NULL,0,0,NULL,NULL,0,'2026-09-14 15:28:38','2026-09-14 15:28:37','2026-09-14 15:40:01'),(5,'fdsfs','dfsdff','sdfsf','sdfsdffsdf','sdfsf','sfsd','fsdf','sdfsf',2,NULL,NULL,NULL,'TEAM','PUBLISHED',0,0,NULL,0,0,NULL,NULL,0,'2026-09-14 15:29:27','2026-09-14 15:29:27','2026-09-14 15:29:27');
/*!40000 ALTER TABLE `work_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_shifts`
--

DROP TABLE IF EXISTS `work_shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_shifts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `crosses_midnight` tinyint(1) NOT NULL,
  `shift_span_minutes` smallint unsigned NOT NULL,
  `required_work_minutes` smallint unsigned NOT NULL,
  `break_allowance_minutes` smallint unsigned NOT NULL,
  `grace_minutes` smallint unsigned NOT NULL DEFAULT '0',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_work_shifts_active` (`status`,`is_default`),
  KEY `fk_work_shift_creator` (`created_by`),
  CONSTRAINT `fk_work_shift_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_shifts`
--

LOCK TABLES `work_shifts` WRITE;
/*!40000 ALTER TABLE `work_shifts` DISABLE KEYS */;
INSERT INTO `work_shifts` VALUES (1,'Night Shift','18:00:00','01:30:00',1,450,360,0,15,'ACTIVE',1,NULL,'2026-08-27 17:16:55','2026-08-27 17:20:07'),(2,'Ammar','18:00:00','03:00:00',1,540,480,60,15,'ACTIVE',0,2,'2026-08-27 17:18:46','2026-08-27 17:18:46');
/*!40000 ALTER TABLE `work_shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'remote_office_portal'
--
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-15  9:56:22
