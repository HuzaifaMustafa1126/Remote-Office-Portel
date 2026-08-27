-- MySQL dump 10.13  Distrib 9.7.1, for macos14.8 (x86_64)
--
-- Host: 127.0.0.1    Database: remote_office_portal
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

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '0e7a805a-81ff-11f1-abe9-2d18f16f5971:1-2365';

--
-- Table structure for table `attendance_breaks`
--

DROP TABLE IF EXISTS `attendance_breaks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_breaks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `attendance_id` bigint unsigned NOT NULL,
  `break_start_at` timestamp NOT NULL,
  `break_end_at` timestamp NULL DEFAULT NULL,
  `duration_minutes` int unsigned NOT NULL DEFAULT '0',
  `status` enum('ACTIVE','COMPLETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_breaks_attendance_status` (`attendance_id`,`status`),
  KEY `idx_breaks_started` (`break_start_at`),
  CONSTRAINT `fk_attendance_break_record` FOREIGN KEY (`attendance_id`) REFERENCES `attendance_records` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_breaks`
--

LOCK TABLES `attendance_breaks` WRITE;
/*!40000 ALTER TABLE `attendance_breaks` DISABLE KEYS */;
INSERT INTO `attendance_breaks` VALUES (1,1,'2026-08-26 11:31:14','2026-08-26 11:31:14',0,'COMPLETED','2026-08-26 11:31:14','2026-08-26 11:31:14'),(2,1,'2026-08-26 11:31:14','2026-08-26 11:31:14',0,'COMPLETED','2026-08-26 11:31:14','2026-08-26 11:31:14'),(3,2,'2026-08-26 11:35:53','2026-08-26 11:36:12',0,'COMPLETED','2026-08-26 11:35:53','2026-08-26 11:36:12'),(4,7,'2026-08-27 05:51:20','2026-08-27 05:51:34',0,'COMPLETED','2026-08-27 05:51:20','2026-08-27 05:51:34');
/*!40000 ALTER TABLE `attendance_breaks` ENABLE KEYS */;
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
  `clock_in_at` timestamp NULL DEFAULT NULL,
  `clock_out_at` timestamp NULL DEFAULT NULL,
  `total_break_minutes` int unsigned NOT NULL DEFAULT '0',
  `total_work_minutes` int unsigned NOT NULL DEFAULT '0',
  `status` enum('WORKING','ON_BREAK','CLOCKED_OUT','ABSENT','LEAVE','OFF_DAY','WORKED_HOLIDAY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WORKING',
  `day_status` enum('PRESENT','ABSENT','HALF_DAY','LEAVE','OFF_DAY','WORKED_HOLIDAY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PRESENT',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_attendance_employee_date` (`employee_id`,`attendance_date`),
  KEY `idx_attendance_date_status` (`attendance_date`,`status`),
  KEY `idx_attendance_employee_clock_in` (`employee_id`,`clock_in_at`),
  CONSTRAINT `fk_attendance_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_records`
--

LOCK TABLES `attendance_records` WRITE;
/*!40000 ALTER TABLE `attendance_records` DISABLE KEYS */;
INSERT INTO `attendance_records` VALUES (1,2,'2026-08-26','2026-08-26 11:31:14','2026-08-26 11:31:14',0,0,'CLOCKED_OUT','PRESENT','2026-08-26 11:31:14','2026-08-26 11:31:14'),(2,3,'2026-08-26','2026-08-26 11:35:15','2026-08-26 11:36:15',0,1,'CLOCKED_OUT','PRESENT','2026-08-26 11:35:15','2026-08-26 11:36:15'),(5,3,'2026-08-25',NULL,NULL,0,0,'ABSENT','ABSENT','2026-08-26 12:11:56','2026-08-26 12:11:56'),(7,3,'2026-08-27','2026-08-27 05:51:09','2026-08-27 05:51:36',0,0,'CLOCKED_OUT','PRESENT','2026-08-27 05:51:09','2026-08-27 05:51:36'),(8,7,'2026-08-27','2026-08-27 16:49:38',NULL,0,0,'WORKING','PRESENT','2026-08-27 16:49:38','2026-08-27 16:49:38');
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
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_audit_employee` (`employee_id`),
  KEY `idx_audit_created` (`created_at`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  KEY `idx_audit_user` (`user_id`),
  CONSTRAINT `fk_audit_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,2,2,'INITIAL_ADMIN_CREATED','USER',2,'Initial CEO administrator account created.','2026-08-26 11:16:14'),(2,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.','2026-08-26 11:16:38'),(3,2,2,'LOGIN_FAILED','USER',2,'Failed login attempt for admin@remoteoffice.com from ::1.','2026-08-26 11:20:22'),(4,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.','2026-08-26 11:20:29'),(5,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.','2026-08-26 11:28:55'),(6,2,2,'ROLE_UPDATED','ROLE',1,'Role CEO was updated.','2026-08-26 11:29:11'),(7,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.','2026-08-26 11:31:14'),(8,2,2,'ATTENDANCE_CLOCK_IN','ATTENDANCE',1,'System Admin clocked in at 04:31 pm.','2026-08-26 11:31:14'),(9,2,2,'BREAK_STARTED','ATTENDANCE',1,'System Admin started a break at 04:31 pm.','2026-08-26 11:31:14'),(10,2,2,'BREAK_ENDED','ATTENDANCE',1,'System Admin ended a break at 04:31 pm.','2026-08-26 11:31:14'),(11,2,2,'BREAK_STARTED','ATTENDANCE',1,'System Admin started a break at 04:31 pm.','2026-08-26 11:31:14'),(12,2,2,'BREAK_ENDED','ATTENDANCE',1,'System Admin ended a break at 04:31 pm.','2026-08-26 11:31:14'),(13,2,2,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',1,'System Admin clocked out at 04:31 pm.','2026-08-26 11:31:14'),(14,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.','2026-08-26 11:31:33'),(15,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.','2026-08-26 11:32:12'),(16,2,2,'EMPLOYEE_CREATED','EMPLOYEE',3,'Employee Huzaifa Mustafa was created.','2026-08-26 11:34:42'),(17,3,3,'LOGIN_SUCCESS','USER',3,'Huzaifa Mustafa signed in successfully.','2026-08-26 11:35:13'),(18,3,3,'ATTENDANCE_CLOCK_IN','ATTENDANCE',2,'Huzaifa Mustafa clocked in at 04:35 pm.','2026-08-26 11:35:15'),(19,3,3,'BREAK_STARTED','ATTENDANCE',2,'Huzaifa Mustafa started a break at 04:35 pm.','2026-08-26 11:35:53'),(20,3,3,'BREAK_ENDED','ATTENDANCE',2,'Huzaifa Mustafa ended a break at 04:36 pm.','2026-08-26 11:36:12'),(21,3,3,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',2,'Huzaifa Mustafa clocked out at 04:36 pm.','2026-08-26 11:36:15'),(22,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.','2026-08-26 11:52:00'),(26,2,2,'LEAVE_REJECTED','LEAVE',2,'Leave request for Phase Tester was rejected by management.','2026-08-26 12:10:04'),(29,2,2,'LEAVE_APPROVED','LEAVE',4,'Leave request for Phase Tester was approved by management.','2026-08-26 12:10:04'),(31,2,2,'LEAVE_APPROVED','LEAVE',5,'Leave request for Phase Tester was approved by management.','2026-08-26 12:10:04'),(33,2,2,'LEAVE_APPROVED','LEAVE',6,'Leave request for Phase Tester was approved by management.','2026-08-26 12:10:04'),(35,2,2,'LEAVE_APPROVED','LEAVE',7,'Leave request for Phase Tester was approved by management.','2026-08-26 12:10:04'),(36,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.','2026-08-26 12:11:31'),(38,2,2,'LEAVE_APPROVED','LEAVE',8,'Leave request for Reconcile Tester was approved by management.','2026-08-26 12:11:56'),(40,2,2,'LEAVE_APPROVED','LEAVE',9,'Leave request for Reconcile Tester was approved by management.','2026-08-26 12:11:56'),(41,2,2,'ATTENDANCE_UPDATED','LEAVE',NULL,'Attendance for 2026-08-25 was finalized.','2026-08-26 12:11:56'),(42,3,3,'LEAVE_REQUESTED','LEAVE',10,'Huzaifa Mustafa requested leave from 2026-08-27 to 2026-08-27.','2026-08-26 12:19:15'),(43,2,2,'LEAVE_REJECTED','LEAVE',10,'Leave request for Huzaifa Mustafa was rejected by management.','2026-08-26 12:19:37'),(44,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.','2026-08-26 12:31:51'),(46,2,2,'LEAVE_APPROVED','LEAVE',11,'Leave request for Calendar Tester was approved by management.','2026-08-26 12:34:53'),(49,2,2,'HOLIDAY_CREATED','COMPANY_CALENDAR',NULL,'Sunday was added to the company calendar from 2026-08-27 to 2026-08-29.','2026-08-26 12:36:34'),(50,2,2,'HOLIDAY_CANCELLED','COMPANY_CALENDAR',5,'Sunday was cancelled in the company calendar.','2026-08-26 12:37:01'),(51,2,2,'HOLIDAY_CANCELLED','COMPANY_CALENDAR',6,'Sunday was cancelled in the company calendar.','2026-08-26 12:37:03'),(52,2,2,'HOLIDAY_CANCELLED','COMPANY_CALENDAR',7,'Sunday was cancelled in the company calendar.','2026-08-26 12:37:05'),(53,3,3,'LEAVE_REQUESTED','LEAVE',12,'Huzaifa Mustafa requested leave from 2026-08-29 to 2026-08-30.','2026-08-26 12:49:45'),(54,2,2,'LEAVE_APPROVED','LEAVE',12,'Leave request for Huzaifa Mustafa was approved by management.','2026-08-26 13:00:34'),(55,3,3,'ATTENDANCE_CLOCK_IN','ATTENDANCE',7,'Huzaifa Mustafa clocked in at 10:51 am.','2026-08-27 05:51:09'),(56,3,3,'BREAK_STARTED','ATTENDANCE',7,'Huzaifa Mustafa started a break at 10:51 am.','2026-08-27 05:51:20'),(57,3,3,'BREAK_ENDED','ATTENDANCE',7,'Huzaifa Mustafa ended a break at 10:51 am.','2026-08-27 05:51:34'),(58,3,3,'ATTENDANCE_CLOCK_OUT','ATTENDANCE',7,'Huzaifa Mustafa clocked out at 10:51 am.','2026-08-27 05:51:36'),(59,3,3,'LEAVE_REQUESTED','LEAVE',13,'Huzaifa Mustafa requested leave from 2026-09-01 to 2026-09-02.','2026-08-27 16:46:04'),(60,3,3,'LEAVE_REQUESTED','LEAVE',14,'Huzaifa Mustafa requested leave from 2026-09-09 to 2026-09-09.','2026-08-27 16:46:41'),(61,2,2,'EMPLOYEE_CREATED','EMPLOYEE',7,'Employee Huzaifa Mustafa was created.','2026-08-27 16:49:02'),(62,7,7,'LOGIN_SUCCESS','USER',7,'Huzaifa Mustafa signed in successfully.','2026-08-27 16:49:35'),(63,7,7,'ATTENDANCE_CLOCK_IN','ATTENDANCE',8,'Huzaifa Mustafa clocked in at 09:49 pm.','2026-08-27 16:49:38'),(64,2,2,'LEAVE_APPROVED','LEAVE',14,'Leave request for Huzaifa Mustafa was approved by management.','2026-08-27 16:52:00'),(65,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.','2026-08-27 16:59:24'),(66,7,7,'LOGIN_SUCCESS','USER',7,'Huzaifa Mustafa signed in successfully.','2026-08-27 17:00:00'),(67,7,7,'LOGIN_SUCCESS','USER',7,'Huzaifa Mustafa signed in successfully.','2026-08-27 17:08:57'),(68,2,2,'LOGIN_SUCCESS','USER',2,'System Admin signed in successfully.','2026-08-27 17:09:11');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_calendar_days`
--

LOCK TABLES `company_calendar_days` WRITE;
/*!40000 ALTER TABLE `company_calendar_days` DISABLE KEYS */;
INSERT INTO `company_calendar_days` VALUES (5,'2026-08-27','COMPANY_HOLIDAY','Sunday',NULL,2,'CANCELLED','2026-08-26 12:36:34','2026-08-26 12:37:01'),(6,'2026-08-28','COMPANY_HOLIDAY','Sunday',NULL,2,'CANCELLED','2026-08-26 12:36:34','2026-08-26 12:37:03'),(7,'2026-08-29','COMPANY_HOLIDAY','Sunday',NULL,2,'CANCELLED','2026-08-26 12:36:34','2026-08-26 12:37:05');
/*!40000 ALTER TABLE `company_calendar_days` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (2,'EMP-0001','System','Admin','admin@remoteoffice.com',NULL,'CEO','Management','2026-08-26','ACTIVE',0,'2026-08-26 11:16:14','2026-08-26 11:51:25'),(3,'12','Huzaifa','Mustafa','malikhuzaifa1126@gmail.com','03058559844','gologin','Gologin','2026-08-24','ACTIVE',1,'2026-08-26 11:34:42','2026-08-26 11:34:42'),(7,'emp-1126','Huzaifa','Mustafa','huzaifa@gmail.com','03058559844','Gologin','Gologin','2026-08-26','ACTIVE',1,'2026-08-27 16:49:01','2026-08-27 16:49:01');
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
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_days`
--

LOCK TABLES `leave_days` WRITE;
/*!40000 ALTER TABLE `leave_days` DISABLE KEYS */;
INSERT INTO `leave_days` VALUES (14,10,3,'2026-08-27','REJECTED','PENDING',NULL,0,'2026-08-26 12:19:15','2026-08-26 12:19:37'),(18,12,3,'2026-08-29','APPROVED','FREE',NULL,0,'2026-08-26 12:49:45','2026-08-26 13:00:34'),(19,13,3,'2026-09-01','PENDING','PENDING',NULL,0,'2026-08-27 16:46:04','2026-08-27 16:46:04'),(20,13,3,'2026-09-02','PENDING','PENDING',NULL,0,'2026-08-27 16:46:04','2026-08-27 16:46:04'),(21,14,3,'2026-09-09','APPROVED','FREE',NULL,0,'2026-08-27 16:46:41','2026-08-27 16:52:00');
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_requests`
--

LOCK TABLES `leave_requests` WRITE;
/*!40000 ALTER TABLE `leave_requests` DISABLE KEYS */;
INSERT INTO `leave_requests` VALUES (10,3,'SICK','2026-08-27','2026-08-27',0,'im very sick','REJECTED',2,'2026-08-26 12:19:37','fdsf','2026-08-26 12:19:15','2026-08-26 12:36:34'),(12,3,'EMERGENCY','2026-08-29','2026-08-30',1,'fghfghf','APPROVED',2,'2026-08-26 13:00:34',NULL,'2026-08-26 12:49:45','2026-08-26 13:00:34'),(13,3,'EMERGENCY','2026-09-01','2026-09-02',2,'fdasfs','PENDING',NULL,NULL,NULL,'2026-08-27 16:46:04','2026-08-27 16:46:04'),(14,3,'EMERGENCY','2026-09-09','2026-09-09',1,'fdsggfgdf','APPROVED',2,'2026-08-27 16:52:00','dfs','2026-08-27 16:46:41','2026-08-27 16:52:00');
/*!40000 ALTER TABLE `leave_requests` ENABLE KEYS */;
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
  `sound_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `task_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `leave_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `break_notifications` tinyint(1) NOT NULL DEFAULT '0',
  `attendance_notifications` tinyint(1) NOT NULL DEFAULT '0',
  `browser_notifications` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_notification_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_preferences`
--

LOCK TABLES `notification_preferences` WRITE;
/*!40000 ALTER TABLE `notification_preferences` DISABLE KEYS */;
INSERT INTO `notification_preferences` VALUES (1,2,1,1,1,0,0,0,'2026-08-27 17:13:01','2026-08-27 17:13:01'),(3,7,1,1,1,0,0,0,'2026-08-27 17:14:13','2026-08-27 17:14:13');
/*!40000 ALTER TABLE `notification_preferences` ENABLE KEYS */;
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
  `title` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint unsigned DEFAULT NULL,
  `action_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_created` (`user_id`,`created_at`),
  KEY `idx_notifications_user_unread` (`user_id`,`is_read`,`created_at`),
  KEY `idx_notifications_reference` (`reference_type`,`reference_id`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'dashboard.view','View the dashboard','2026-08-26 11:16:06'),(2,'employees.view_own','View own employee profile','2026-08-26 11:16:06'),(3,'employees.view_all','View all employees','2026-08-26 11:16:06'),(4,'employees.create','Create employees','2026-08-26 11:16:06'),(5,'employees.update','Update employees','2026-08-26 11:16:06'),(6,'employees.deactivate','Activate or deactivate employees','2026-08-26 11:16:06'),(7,'roles.view','View roles','2026-08-26 11:16:06'),(8,'roles.manage','Create and update roles','2026-08-26 11:16:06'),(9,'permissions.view','View permissions','2026-08-26 11:16:06'),(10,'permissions.manage','Assign permissions to roles','2026-08-26 11:16:06'),(11,'audit.view','View audit logs','2026-08-26 11:16:06'),(12,'attendance.clock','Clock in, take breaks, and clock out','2026-08-26 11:30:37'),(13,'attendance.view_own','View own attendance records','2026-08-26 11:30:37'),(14,'attendance.view_all','View attendance for all employees','2026-08-26 11:30:37'),(15,'attendance.edit','Correct attendance records','2026-08-26 11:30:37'),(16,'attendance.reports','View attendance reports','2026-08-26 11:30:37'),(22,'leave.create','Submit a leave request','2026-08-26 12:09:05'),(23,'leave.view_own','View own leave requests','2026-08-26 12:09:05'),(24,'leave.view_all','View all employee leave requests','2026-08-26 12:09:05'),(25,'leave.approve','Approve leave requests','2026-08-26 12:09:05'),(26,'leave.reject','Reject leave requests','2026-08-26 12:09:05'),(27,'leave.cancel_own','Cancel own pending leave requests','2026-08-26 12:09:05'),(28,'leave.reports','View leave and payroll-preparation reports','2026-08-26 12:09:05'),(36,'calendar.view','View the company working calendar','2026-08-26 12:29:57'),(37,'calendar.manage','Create, edit, and cancel company holidays','2026-08-26 12:29:57');
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
INSERT INTO `role_permissions` VALUES (1,1,'2026-08-26 11:16:06'),(1,2,'2026-08-26 11:16:06'),(1,3,'2026-08-26 11:16:06'),(1,4,'2026-08-26 11:16:06'),(1,5,'2026-08-26 11:16:06'),(1,6,'2026-08-26 11:16:06'),(1,7,'2026-08-26 11:16:06'),(1,8,'2026-08-26 11:16:06'),(1,9,'2026-08-26 11:16:06'),(1,10,'2026-08-26 11:16:06'),(1,11,'2026-08-26 11:16:06'),(1,14,'2026-08-26 11:30:37'),(1,15,'2026-08-26 11:30:37'),(1,16,'2026-08-26 11:30:37'),(1,24,'2026-08-26 12:09:05'),(1,25,'2026-08-26 12:09:05'),(1,26,'2026-08-26 12:09:05'),(1,28,'2026-08-26 12:09:05'),(1,36,'2026-08-26 12:29:57'),(1,37,'2026-08-26 12:29:57'),(2,1,'2026-08-26 11:16:06'),(2,2,'2026-08-26 11:16:06'),(2,12,'2026-08-26 11:30:37'),(2,13,'2026-08-26 11:30:37'),(2,22,'2026-08-26 12:09:05'),(2,23,'2026-08-26 12:09:05'),(2,27,'2026-08-26 12:09:05'),(2,36,'2026-08-26 12:29:57');
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
INSERT INTO `user_roles` VALUES (2,1,'2026-08-26 11:16:14'),(3,2,'2026-08-26 11:34:42'),(7,2,'2026-08-27 16:49:02');
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `employee_id` (`employee_id`),
  KEY `idx_users_status` (`status`),
  CONSTRAINT `fk_users_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,2,'admin@remoteoffice.com','$2b$12$S8h9z8uYuzn6CL6J2eGjPujfeMgVSAwBn1EXrRwg5Sq2E2GehE3Vu','ACTIVE','2026-08-27 17:09:11','2026-08-26 11:16:14','2026-08-27 17:09:11'),(3,3,'malikhuzaifa1126@gmail.com','$2b$12$EERwxfR31cXJkIoGo4rhJeRPYSXZ9u20K49qfg7CZ9ZHrefI0SM/6','ACTIVE','2026-08-26 11:35:13','2026-08-26 11:34:42','2026-08-26 11:35:13'),(7,7,'huzaifa@gmail.com','$2b$12$E6fRCGuBitH20VMPvrEieuQcNGk6ilXaZHM0KZLm2Ekmgo4OTF1/a','ACTIVE','2026-08-27 17:08:57','2026-08-27 16:49:02','2026-08-27 17:08:57');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
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

-- Dump completed on 2026-08-27 22:16:24
