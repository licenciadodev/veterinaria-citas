// db.js - Archivo para la conexión con la base de datos MySQL
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración del pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'app_veterinaria',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
});

// Función para probar la conexión a la base de datos
async function testConnection() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('✅ Conexión a la base de datos establecida exitosamente');
        console.log(`📊 Base de datos: ${process.env.DB_NAME || 'app_veterinaria'}`);
        console.log(`🌐 Host: ${process.env.DB_HOST || 'localhost'}`);
        
        // Verificar que las tablas existen
        const [rows] = await connection.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = ?
        `, [process.env.DB_NAME || 'app_veterinaria']);
        
        if (rows.length > 0) {
            console.log(`✅ ${rows.length} tablas encontradas en la base de datos`);
        } else {
            console.warn('⚠️ No se encontraron tablas en la base de datos. Debes crearlas primero.');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:');
        console.error(`   • Código de error: ${error.code}`);
        console.error(`   • Mensaje: ${error.message}`);
        console.error(`   • Detalles adicionales: ${error.sqlMessage || 'No hay detalles adicionales'}`);
        
        // Sugerencias para solucionar problemas comunes
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Sugerencia: Verifica el usuario y contraseña en tu archivo .env');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('💡 Sugerencia: La base de datos no existe. Debes crearla primero con phpMyAdmin');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('💡 Sugerencia: Asegúrate de que XAMPP esté ejecutando el servicio de MySQL');
        }
        
        return false;
    } finally {
        if (connection) connection.release();
    }
}

// Función para obtener una conexión del pool
async function getConnection() {
    try {
        return await pool.getConnection();
    } catch (error) {
        console.error('❌ Error al obtener una conexión del pool:', error.message);
        throw error;
    }
}

// Función para cerrar todas las conexiones
async function closePool() {
    try {
        await pool.end();
        console.log('🔌 Pool de conexiones cerrado correctamente');
    } catch (error) {
        console.error('❌ Error al cerrar el pool de conexiones:', error.message);
    }
}

// Exportar funciones y el pool
module.exports = {
    pool,
    getConnection,
    testConnection,
    closePool
};

// Ejecutar la prueba de conexión al cargar el módulo
// (Solo en entorno de desarrollo)
if (process.env.NODE_ENV !== 'production') {
    testConnection();
}