const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'veterinaria_db'
});

connection.connect((error) => {
    if (error) {
        console.log('❌ Error:', error.message);
        return;
    }
    
    console.log('✅ Conectado a veterinaria_db');
    console.log('📊 Verificando datos...');
    
    connection.query('SELECT COUNT(*) as total FROM usuarios', (err, res) => {
        console.log(`👤 Usuarios: ${res[0].total} (deberían ser 5)`);
        connection.end();
    });
});