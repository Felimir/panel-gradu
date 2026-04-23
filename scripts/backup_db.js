require('dotenv').config({ path: '../.env' });
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const PRODUCTION = process.env.PRODUCTION;

if (PRODUCTION !== '1') {
  console.log('El entorno no es de producción (PRODUCTION !== 1). Saltando el proceso de backup.');
  process.exit(0);
}

const DB_ROOT_PASSWORD = process.env.DB_ROOT_PASSWORD || 'root';
const DB_NAME = process.env.DB_NAME || 'panel_gradu';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const BACKUP_DIR = path.join(__dirname, 'backups');
const PREV_BACKUP_PATH = path.join(BACKUP_DIR, 'backup_prev.sql');
const NEW_BACKUP_PATH = path.join(BACKUP_DIR, `backup_${Date.now()}.sql`);

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

// Generar el nuevo backup
try {
  console.log('Generando nuevo backup...');
  // Omitimos comentarios y fechas para asegurar que el hash sea idéntico si los datos no cambian
  execSync(`docker exec panel_gradu_db mariadb-dump --skip-dump-date --skip-comments -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} > ${NEW_BACKUP_PATH}`);
  console.log('Backup generado exitosamente.');
} catch (error) {
  console.error('Error al generar el backup:', error.message);
  process.exit(1);
}

const getHash = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
};

let hasChanged = true;

if (fs.existsSync(PREV_BACKUP_PATH)) {
  const prevHash = getHash(PREV_BACKUP_PATH);
  const newHash = getHash(NEW_BACKUP_PATH);

  if (prevHash === newHash) {
    console.log('Sin cambios. La base de datos es idéntica al backup anterior.');
    hasChanged = false;
  } else {
    console.log('Se detectaron cambios en la base de datos.');
  }
} else {
  console.log('No se encontró un backup anterior. Este es el primer backup.');
}

const finalize = () => {
  // Reemplazar el anterior por el nuevo
  fs.copyFileSync(NEW_BACKUP_PATH, PREV_BACKUP_PATH);
  fs.unlinkSync(NEW_BACKUP_PATH);
  console.log('Proceso de backup completado con éxito.');
};

if (hasChanged) {
  if (!SMTP_USER || !SMTP_CLIENT_ID || !SMTP_CLIENT_SECRET || !SMTP_REFRESH_TOKEN) {
    console.error('\nERROR: Las variables de configuración de correo (SMTP_USER, SMTP_CLIENT_ID, SMTP_CLIENT_SECRET, SMTP_REFRESH_TOKEN) no están definidas en el archivo .env.');
    console.error('No se puede enviar el correo a gradu63.2026@gmail.com.');
    console.error('Por favor, configura estas variables en el archivo .env para habilitar el backup por correo.\n');
    process.exit(1);
  } else {
    console.log('Enviando backup por correo...');
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: SMTP_USER,
        clientId: process.env.SMTP_CLIENT_ID,
        clientSecret: process.env.SMTP_CLIENT_SECRET,
        refreshToken: process.env.SMTP_REFRESH_TOKEN,
      },
    });

    const mailOptions = {
      from: SMTP_USER,
      to: 'gradu63.2026@gmail.com',
      subject: 'Backup Automático de Base de Datos - Panel Gradu',
      text: 'Adjunto se encuentra el backup más reciente de la base de datos de Panel Gradu. Se han detectado cambios respecto al backup anterior.',
      attachments: [
        {
          filename: 'backup_panel_gradu.sql',
          path: NEW_BACKUP_PATH
        }
      ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo:', error);
      } else {
        console.log('Correo enviado correctamente:', info.response);
      }
      finalize();
    });
  }
} else {
  // Si son iguales, simplemente reemplazamos y borramos
  finalize();
}
