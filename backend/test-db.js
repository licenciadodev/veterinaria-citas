const mysql = require('mysql2');

console.log('🔍 Probando conexión a app_veterinaria...');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'app_veterinaria'  // Cambiado!
});

connection.connect((error) => {
    if (error) {
        console.log('❌ ERROR:', error.message);
        console.log('\n¿Tienes estas bases de datos en phpMyAdmin?');
        console.log('1. app_veterinaria');
        console.log('2. veterinaria_citas');
        return;
    }
    
    console.log('✅ Conectado a app_veterinaria');
    
    // Ver qué tablas tiene
    connection.query('SHOW TABLES', (err, results) => {
        if (err) {
            console.log('❌ Error al ver tablas:', err.message);
        } else {
            console.log('📋 Tablas en la base de datos:');
            results.forEach(row => {
                console.log('  -', Object.values(row)[0]);
            });
        }
        connection.end();
    });
});