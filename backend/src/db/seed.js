const migrate = require('./migrate');

migrate()
  .then(() => {
    console.log('Seed completado.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error durante el seed:', err);
    process.exit(1);
  });
