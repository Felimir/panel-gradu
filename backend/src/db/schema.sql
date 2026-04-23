CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  shift ENUM('morning', 'afternoon') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_class_shift (name, shift)
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cedula VARCHAR(8) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'organizer', 'student') NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizer_classes (
  user_id INT NOT NULL,
  class_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, class_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  class_id INT NOT NULL,
  wants_hoodie BOOLEAN DEFAULT FALSE,
  status ENUM('active', 'dropped') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS monthly_fee_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period_month INT NOT NULL,
  period_year INT NOT NULL,
  amount INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_period (period_month, period_year)
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  fee_id INT NOT NULL,
  status ENUM('pending', 'paid', 'covered_by_raffles') DEFAULT 'pending',
  payment_method ENUM('none', 'cash', 'transfer') DEFAULT 'none',
  amount_paid INT DEFAULT 0,
  deposit_date DATE NULL DEFAULT NULL,
  observations TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (fee_id) REFERENCES monthly_fee_config(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_fee (student_id, fee_id)
);

CREATE TABLE IF NOT EXISTS raffle_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  period_month INT NOT NULL,
  period_year INT NOT NULL,
  action_type ENUM('delivered_to_student', 'returned_sold', 'returned_unsold') NOT NULL,
  quantity INT NOT NULL,
  money_collected INT DEFAULT 0,
  applied_to_fee INT DEFAULT 0,
  surplus_fund INT DEFAULT 0,
  deposit_status ENUM('pending', 'deposited', 'not_applicable') DEFAULT 'not_applicable',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('income', 'expense') NOT NULL,
  category ENUM('fees', 'raffles', 'common_fund', 'canteen', 'events', 'deposits', 'guarantees', 'transport', 'other') NOT NULL,
  amount INT NOT NULL,
  description VARCHAR(255),
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action ENUM(
    'login','create','update','delete',
    'deactivate','activate','payment_recorded',
    'fee_covered_by_raffles'
  ) NOT NULL,
  entity ENUM(
    'session','user','student','payment',
    'raffle_log','transaction','fee_config','event'
  ) NOT NULL,
  entity_id INT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_entity (entity, entity_id),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_created (created_at)
);

CREATE TABLE IF NOT EXISTS events_calendar (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  event_type ENUM('canteen', 'payment_deadline', 'internal_event', 'milestone') NOT NULL,
  event_date DATE NOT NULL,
  end_date DATE DEFAULT NULL,
  class_id INT DEFAULT NULL,
  assigned_student_id INT DEFAULT NULL,
  assigned_user_id INT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_student_id) REFERENCES students(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS hoodie_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  period ENUM('initial', 'final') NOT NULL,
  status ENUM('pending', 'paid') DEFAULT 'pending',
  payment_method ENUM('none', 'cash', 'transfer') DEFAULT 'none',
  amount_paid INT DEFAULT 0,
  deposit_date DATE NULL DEFAULT NULL,
  observations TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_hoodie_fee (student_id, period)
);
