/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` enum('login','create','update','delete','deactivate','activate','payment_recorded','fee_covered_by_raffles') NOT NULL,
  `entity` enum('session','user','student','payment','raffle_log','transaction','fee_config','event') NOT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_audit_entity` (`entity`,`entity_id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_created` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES
(1,1,'login','session',1,'{\"cedula\":\"12345678\"}','2026-04-18 04:30:44'),
(2,1,'login','session',1,'{\"cedula\":\"12345678\"}','2026-04-18 04:31:22'),
(3,1,'create','student',5,'{\"name\":\"Test Auditoría\",\"class_id\":1}','2026-04-18 04:31:22'),
(4,1,'payment_recorded','payment',NULL,'{\"student_id\":5,\"fee_id\":1,\"status\":\"paid\",\"method\":\"cash\"}','2026-04-18 05:02:11'),
(5,1,'create','raffle_log',NULL,'{\"student_id\":1,\"action_type\":\"delivered_to_student\",\"quantity\":10,\"money_collected\":0,\"applied_to_fee\":0,\"surplus_fund\":0}','2026-04-18 05:02:21'),
(6,1,'create','raffle_log',NULL,'{\"student_id\":1,\"action_type\":\"returned_sold\",\"quantity\":10,\"money_collected\":1000,\"applied_to_fee\":0,\"surplus_fund\":1000}','2026-04-18 05:02:32'),
(7,1,'create','raffle_log',NULL,'{\"student_id\":2,\"action_type\":\"delivered_to_student\",\"quantity\":10,\"money_collected\":0,\"applied_to_fee\":0,\"surplus_fund\":0}','2026-04-18 05:02:43'),
(8,1,'create','raffle_log',NULL,'{\"student_id\":2,\"action_type\":\"delivered_to_student\",\"quantity\":10,\"money_collected\":0,\"applied_to_fee\":0,\"surplus_fund\":0}','2026-04-18 05:02:56'),
(9,1,'create','raffle_log',NULL,'{\"student_id\":2,\"action_type\":\"returned_sold\",\"quantity\":20,\"money_collected\":2000,\"applied_to_fee\":0,\"surplus_fund\":2000}','2026-04-18 05:03:04'),
(10,1,'update','event',6,'{\"title\":\"¡🥳 GRADU!\"}','2026-04-18 05:39:50'),
(11,2,'login','session',2,'{\"cedula\":\"57605695\"}','2026-04-18 05:48:16'),
(12,2,'login','session',2,'{\"cedula\":\"57605695\"}','2026-04-18 06:56:33'),
(13,1,'login','session',1,'{\"cedula\":\"12345678\"}','2026-04-18 15:37:24'),
(14,1,'update','student',3,'{\"status\":\"dropped\"}','2026-04-18 15:53:57'),
(15,1,'login','session',1,'{\"cedula\":\"12345678\"}','2026-04-19 18:41:53'),
(16,1,'update','student',1,'{\"name\":\"Juan Perez\",\"status\":\"active\"}','2026-04-19 19:10:18'),
(17,1,'delete','student',3,'{\"id\":\"3\"}','2026-04-19 19:10:24'),
(18,1,'login','session',1,'{\"cedula\":\"12345678\"}','2026-04-23 01:24:46'),
(19,1,'update','student',4,'{\"name\":\"Bautista Martinez\",\"status\":\"active\"}','2026-04-23 01:24:57'),
(20,1,'payment_recorded','payment',NULL,'{\"student_id\":4,\"period\":\"initial\",\"status\":\"paid\",\"method\":\"cash\",\"module\":\"hoodies\"}','2026-04-23 01:25:06'),
(21,1,'create','raffle_log',NULL,'{\"student_id\":5,\"action_type\":\"delivered_to_student\",\"quantity\":5,\"money_collected\":0,\"applied_to_fee\":0,\"surplus_fund\":0}','2026-04-23 02:28:14'),
(22,1,'create','raffle_log',NULL,'{\"student_id\":5,\"action_type\":\"returned_sold\",\"quantity\":5,\"money_collected\":500,\"applied_to_fee\":350,\"surplus_fund\":150}','2026-04-23 02:28:22'),
(23,1,'create','raffle_log',NULL,'{\"student_id\":5,\"action_type\":\"delivered_to_student\",\"quantity\":25,\"money_collected\":0,\"applied_to_fee\":0,\"surplus_fund\":0}','2026-04-23 02:33:21'),
(24,1,'create','raffle_log',NULL,'{\"student_id\":5,\"action_type\":\"returned_sold\",\"quantity\":10,\"money_collected\":1000,\"applied_to_fee\":0,\"surplus_fund\":1000}','2026-04-23 02:33:33'),
(25,1,'create','raffle_log',NULL,'{\"student_id\":5,\"action_type\":\"returned_unsold\",\"quantity\":15,\"money_collected\":0,\"applied_to_fee\":0,\"surplus_fund\":0}','2026-04-23 02:33:46'),
(26,1,'create','student',6,'{\"name\":\"Bautista Martinez\",\"class_id\":\"11\"}','2026-04-23 02:42:46'),
(27,1,'create','student',7,'{\"name\":\"Bautista Martinez\",\"class_id\":\"8\"}','2026-04-23 02:43:05'),
(28,1,'delete','student',7,'{\"id\":\"7\"}','2026-04-23 02:43:18'),
(29,1,'create','student',8,'{\"name\":\"BuaMartínez\",\"class_id\":\"8\"}','2026-04-23 02:44:37'),
(30,1,'delete','student',8,'{\"id\":\"8\"}','2026-04-23 02:44:41'),
(31,1,'create','student',9,'{\"name\":\"Fiorella Lopez\",\"class_id\":\"12\"}','2026-04-23 02:44:52'),
(32,1,'create','student',10,'{\"name\":\"Agustín López\",\"class_id\":\"12\"}','2026-04-23 02:45:05');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `shift` enum('morning','afternoon') NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_class_shift` (`name`,`shift`)
) ENGINE=InnoDB AUTO_INCREMENT=145 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` VALUES
(1,'Artístico 1','morning','2026-04-16 22:59:53','2026-04-16 22:59:53'),
(2,'Derecho 1','morning','2026-04-16 22:59:53','2026-04-16 22:59:53'),
(3,'Derecho 2','morning','2026-04-16 22:59:53','2026-04-16 22:59:53'),
(4,'Medicina 1','morning','2026-04-16 22:59:53','2026-04-16 22:59:53'),
(5,'Medicina 2','morning','2026-04-16 22:59:53','2026-04-16 22:59:53'),
(6,'Ingeniería 1','morning','2026-04-16 22:59:53','2026-04-16 22:59:53'),
(7,'Artístico 2','afternoon','2026-04-16 22:59:53','2026-04-16 22:59:53'),
(8,'Derecho 3','afternoon','2026-04-16 22:59:53','2026-04-16 22:59:53'),
(9,'Economía','afternoon','2026-04-16 22:59:53','2026-04-16 22:59:53'),
(10,'Medicina 3','afternoon','2026-04-16 22:59:53','2026-04-16 22:59:53'),
(11,'Medicina 4','afternoon','2026-04-16 22:59:53','2026-04-16 22:59:53'),
(12,'Ingeniería 2','afternoon','2026-04-16 22:59:53','2026-04-16 22:59:53');
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `events_calendar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `events_calendar` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `event_type` enum('canteen','payment_deadline','internal_event','milestone') NOT NULL,
  `event_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `class_id` int(11) DEFAULT NULL,
  `assigned_student_id` int(11) DEFAULT NULL,
  `assigned_user_id` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `class_id` (`class_id`),
  KEY `assigned_student_id` (`assigned_student_id`),
  KEY `assigned_user_id` (`assigned_user_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `events_calendar_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `events_calendar_ibfk_2` FOREIGN KEY (`assigned_student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL,
  CONSTRAINT `events_calendar_ibfk_3` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `events_calendar_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `events_calendar` WRITE;
/*!40000 ALTER TABLE `events_calendar` DISABLE KEYS */;
INSERT INTO `events_calendar` VALUES
(2,'Entrega de $50.000 a GraduacionesMVD',NULL,'payment_deadline','2026-07-30',NULL,NULL,NULL,NULL,NULL,1,'2026-04-18 03:56:15','2026-04-18 03:56:25'),
(3,'Pago de saldo restante a GraduacionesMVD',NULL,'payment_deadline','2026-12-13',NULL,NULL,NULL,NULL,NULL,1,'2026-04-18 04:00:15','2026-04-18 04:00:15'),
(4,'Entrega de $50.000 a GraduacionesMVD',NULL,'payment_deadline','2026-10-28',NULL,NULL,NULL,NULL,'* Fecha aproximada, es al momento de comenzar a vender entradas',1,'2026-04-18 04:01:41','2026-04-18 04:01:41'),
(5,'Seña de $30.000 a GraduacionesMVD',NULL,'payment_deadline','2026-03-30',NULL,NULL,NULL,NULL,NULL,1,'2026-04-18 04:02:08','2026-04-18 04:02:08'),
(6,'¡🥳 GRADU!',NULL,'milestone','2026-12-16',NULL,NULL,NULL,NULL,NULL,1,'2026-04-18 04:02:27','2026-04-18 05:39:50');
/*!40000 ALTER TABLE `events_calendar` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `hoodie_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `hoodie_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `period` enum('initial','final') NOT NULL,
  `status` enum('pending','paid') DEFAULT 'pending',
  `payment_method` enum('none','cash','transfer') DEFAULT 'none',
  `amount_paid` int(11) DEFAULT 0,
  `deposit_date` date DEFAULT NULL,
  `observations` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_hoodie_fee` (`student_id`,`period`),
  CONSTRAINT `hoodie_payments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `hoodie_payments` WRITE;
/*!40000 ALTER TABLE `hoodie_payments` DISABLE KEYS */;
INSERT INTO `hoodie_payments` VALUES
(1,4,'initial','paid','cash',750,NULL,NULL,'2026-04-23 01:25:06','2026-04-23 01:25:06');
/*!40000 ALTER TABLE `hoodie_payments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `monthly_fee_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `monthly_fee_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `period_month` int(11) NOT NULL,
  `period_year` int(11) NOT NULL,
  `amount` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_period` (`period_month`,`period_year`)
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `monthly_fee_config` WRITE;
/*!40000 ALTER TABLE `monthly_fee_config` DISABLE KEYS */;
INSERT INTO `monthly_fee_config` VALUES
(1,4,2026,350,'2026-04-17 02:08:15','2026-04-17 02:13:01'),
(2,5,2026,350,'2026-04-17 02:08:15','2026-04-17 02:14:33'),
(3,6,2026,350,'2026-04-17 02:08:15','2026-04-17 02:14:38'),
(4,7,2026,350,'2026-04-17 02:08:15','2026-04-17 02:16:28'),
(5,8,2026,350,'2026-04-17 02:08:15','2026-04-17 02:16:42'),
(6,9,2026,350,'2026-04-17 02:08:15','2026-04-17 02:16:42'),
(7,10,2026,350,'2026-04-17 02:08:15','2026-04-17 02:16:42'),
(8,11,2026,350,'2026-04-17 02:08:15','2026-04-17 02:16:42'),
(9,12,2026,350,'2026-04-17 02:08:15','2026-04-17 02:16:42');
/*!40000 ALTER TABLE `monthly_fee_config` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `organizer_classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `organizer_classes` (
  `user_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`,`class_id`),
  KEY `class_id` (`class_id`),
  CONSTRAINT `organizer_classes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `organizer_classes_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `organizer_classes` WRITE;
/*!40000 ALTER TABLE `organizer_classes` DISABLE KEYS */;
INSERT INTO `organizer_classes` VALUES
(2,7,'2026-04-16 23:02:38'),
(2,12,'2026-04-16 23:02:38'),
(3,6,'2026-04-16 23:24:06'),
(4,2,'2026-04-16 23:25:12'),
(5,2,'2026-04-16 23:25:55'),
(6,3,'2026-04-16 23:26:36');
/*!40000 ALTER TABLE `organizer_classes` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `fee_id` int(11) NOT NULL,
  `status` enum('pending','paid','covered_by_raffles') DEFAULT 'pending',
  `payment_method` enum('none','cash','transfer') DEFAULT 'none',
  `amount_paid` int(11) DEFAULT 0,
  `deposit_date` date DEFAULT NULL,
  `observations` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_fee` (`student_id`,`fee_id`),
  KEY `fee_id` (`fee_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`fee_id`) REFERENCES `monthly_fee_config` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES
(6,4,1,'covered_by_raffles','cash',350,'2026-04-17','Automático vía Rifas | Rifa Aplicada | Rifa Aplicada','2026-04-17 02:42:02','2026-04-17 15:30:36'),
(10,3,1,'covered_by_raffles','cash',350,'2026-04-17','Automático vía Rifas','2026-04-17 15:14:29','2026-04-17 15:14:29'),
(13,1,1,'covered_by_raffles','cash',350,NULL,' | Rifa Aplicada','2026-04-18 04:13:01','2026-04-18 05:02:32'),
(14,2,1,'covered_by_raffles','cash',350,NULL,' | Rifa Aplicada','2026-04-18 04:13:02','2026-04-18 05:03:04'),
(16,5,1,'covered_by_raffles','cash',350,'2026-04-23','Automático vía Rifas | Rifa Aplicada','2026-04-23 02:28:22','2026-04-23 02:33:33');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `raffle_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `raffle_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `period_month` int(11) NOT NULL,
  `period_year` int(11) NOT NULL,
  `action_type` enum('delivered_to_student','returned_sold','returned_unsold') NOT NULL,
  `quantity` int(11) NOT NULL,
  `money_collected` int(11) DEFAULT 0,
  `applied_to_fee` int(11) DEFAULT 0,
  `surplus_fund` int(11) DEFAULT 0,
  `deposit_status` enum('pending','deposited','not_applicable') DEFAULT 'not_applicable',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `raffle_logs_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `raffle_logs` WRITE;
/*!40000 ALTER TABLE `raffle_logs` DISABLE KEYS */;
INSERT INTO `raffle_logs` VALUES
(1,4,4,2026,'delivered_to_student',5,0,0,0,'not_applicable','2026-04-17 02:41:47'),
(2,4,4,2026,'returned_sold',5,500,350,150,'pending','2026-04-17 02:42:02'),
(3,4,4,2026,'delivered_to_student',5,0,0,0,'not_applicable','2026-04-17 02:42:09'),
(4,4,4,2026,'returned_sold',5,500,0,500,'pending','2026-04-17 02:42:19'),
(6,3,4,2026,'delivered_to_student',10,0,0,0,'not_applicable','2026-04-17 15:14:16'),
(7,3,4,2026,'returned_sold',10,1000,350,650,'pending','2026-04-17 15:14:29'),
(8,4,4,2026,'delivered_to_student',5,0,0,0,'not_applicable','2026-04-17 15:30:20'),
(9,4,4,2026,'returned_sold',5,500,0,500,'pending','2026-04-17 15:30:36'),
(10,1,4,2026,'delivered_to_student',10,0,0,0,'not_applicable','2026-04-18 05:02:21'),
(11,1,4,2026,'returned_sold',10,1000,0,1000,'pending','2026-04-18 05:02:32'),
(12,2,4,2026,'delivered_to_student',10,0,0,0,'not_applicable','2026-04-18 05:02:43'),
(13,2,4,2026,'delivered_to_student',10,0,0,0,'not_applicable','2026-04-18 05:02:56'),
(14,2,4,2026,'returned_sold',20,2000,0,2000,'pending','2026-04-18 05:03:04'),
(15,5,4,2026,'delivered_to_student',5,0,0,0,'not_applicable','2026-04-23 02:28:14'),
(16,5,4,2026,'returned_sold',5,500,350,150,'pending','2026-04-23 02:28:22'),
(17,5,4,2026,'delivered_to_student',25,0,0,0,'not_applicable','2026-04-23 02:33:21'),
(18,5,4,2026,'returned_sold',10,1000,0,1000,'pending','2026-04-23 02:33:33'),
(19,5,4,2026,'returned_unsold',15,0,0,0,'not_applicable','2026-04-23 02:33:46');
/*!40000 ALTER TABLE `raffle_logs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `class_id` int(11) NOT NULL,
  `wants_hoodie` tinyint(1) DEFAULT 0,
  `status` enum('active','dropped') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `class_id` (`class_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES
(1,'Juan Perez',5,0,'active','2026-04-17 01:12:11','2026-04-19 19:10:18',NULL),
(2,'Mateo Rosas',7,0,'active','2026-04-17 01:12:17','2026-04-17 01:12:17',NULL),
(3,'Jorge Rodriguez',9,0,'dropped','2026-04-17 01:12:23','2026-04-19 19:10:24','2026-04-19 19:10:24'),
(4,'Bautista Martinez',8,1,'active','2026-04-17 01:12:33','2026-04-23 01:24:57',NULL),
(5,'Test Auditoría',1,0,'active','2026-04-18 04:31:22','2026-04-18 04:31:22',NULL),
(6,'Bautista Martinez',11,0,'active','2026-04-23 02:42:46','2026-04-23 02:42:46',NULL),
(7,'Bautista Martinez',8,0,'active','2026-04-23 02:43:05','2026-04-23 02:43:18','2026-04-23 02:43:18'),
(8,'BuaMartínez',8,0,'active','2026-04-23 02:44:37','2026-04-23 02:44:40','2026-04-23 02:44:40'),
(9,'Fiorella Lopez',12,0,'active','2026-04-23 02:44:52','2026-04-23 02:44:52',NULL),
(10,'Agustín López',12,0,'active','2026-04-23 02:45:05','2026-04-23 02:45:05',NULL);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('income','expense') NOT NULL,
  `category` enum('fees','raffles','common_fund','canteen','events','deposits','guarantees','transport','other') NOT NULL,
  `amount` int(11) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES
(1,'income','canteen',630,'Brownie vendido en la cantina','2026-04-17','2026-04-17 03:56:34');
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cedula` varchar(8) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','organizer','student') NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `cedula` (`cedula`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'12345678','Administrador','$2b$10$sTiW/YvngHWyDk1qOV/iIu1ZHu5NYJbX4UEEshW3dn0KWMc2QyLaS','admin','active','2026-04-16 23:00:40','2026-04-18 02:57:03'),
(2,'57605695','Felipe García','$2b$10$Wo88LBGqu14nCFJLpqoIy.U0efk63J1wIG/Nmx7u9qQQ.oIlN0iom','organizer','active','2026-04-16 23:02:38','2026-04-16 23:02:38'),
(3,'57864132','Juan Miralles','$2b$10$h4gMNQUsupCv9w1t/qwRHuuZ1koFdHGFxqh1CnvQ0rcA.tI7sP6h.','organizer','active','2026-04-16 23:24:06','2026-04-16 23:24:06'),
(4,'57459921','Maite Maciel','$2b$10$52nNRXlVt9KNoECzZrO72.JxyqMm4LP9DDvQjmwUx8yi9WQUSzLGK','organizer','active','2026-04-16 23:25:12','2026-04-16 23:25:12'),
(5,'57532285','Paulina Mederos','$2b$10$yPQCQMN7WG4XhLoUIhsSuePtzgtEOrE6on2c3y5Lo61OVaEmdXNfu','organizer','active','2026-04-16 23:25:55','2026-04-16 23:25:55'),
(6,'57410519','Vanina Tinaglini','$2b$10$b6cyb91CsUbUnmypabDGCuBqcg8V.mv0Q6kIDVwqyuRTFkEta5JzG','organizer','active','2026-04-16 23:26:36','2026-04-16 23:26:36');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

