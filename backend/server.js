// backend/server.js - VERSIÓN CORREGIDA
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');  // Agregar esto

const app = express();

// =============== VERIFICACIÓN DE RUTAS ===============
console.log('🔍 Verificando rutas...');
console.log('📍 __dirname:', __dirname);
console.log('📍 Ruta actual del server.js:', __filename);

// Ruta CORRECTA al frontend
const frontendPath = path.join(__dirname, '../../frontend');
const indexPath = path.join(frontendPath, 'index.html');

console.log('📁 Buscando frontend en:', frontendPath);
console.log('📄 Buscando index.html en:', indexPath);

if (fs.existsSync(indexPath)) {
    console.log('✅ index.html ENCONTRADO en:', indexPath);
} else {
    console.log('❌ index.html NO encontrado. Revisando estructura...');
    
    // Listar lo que sí existe
    const parentDir = path.join(__dirname, '..');
    console.log('📂 Contenido del directorio padre:');
    try {
        const files = fs.readdirSync(parentDir);
        files.forEach(file => {
            const filePath = path.join(parentDir, file);
            const isDir = fs.statSync(filePath).isDirectory();
            console.log(`  ${isDir ? '📁' : '📄'} ${file}`);
        });
    } catch (err) {
        console.log('Error leyendo directorio:', err.message);
    }
}

// =============== CONFIGURACIÓN ===============
app.use(cors({
    origin: ['http://localhost:5500', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// ⭐⭐ RUTA ESTÁTICA CORREGIDA ⭐⭐
app.use(express.static(frontendPath));

// =============== CONEXIÓN A BD ===============
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'veterinaria_db'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a MySQL:', err);
        return;
    }
    console.log('✅ Conectado a MySQL - Base de datos: veterinaria_db');
});

// =============== RUTAS DE API ===============
app.get('/api/test', (req, res) => {
    res.json({ message: '¡El servidor funciona!' });
});

app.get('/api/usuarios', (req, res) => {
    db.query('SELECT id, nombre, email, rol FROM usuarios', (err, results) => {
        if (err) {
            console.error('Error obteniendo usuarios:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        res.json(results);
    });
});

app.get('/api/citas', (req, res) => {
    db.query('SELECT * FROM citas', (err, results) => {
        if (err) {
            console.error('Error obteniendo citas:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        res.json(results);
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }
    
    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Error en login:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }
        
        const user = results[0];
        
        // Contraseña de prueba: 123456
        if (password === '123456') {
            delete user.password;
            res.json({
                success: true,
                message: 'Login exitoso',
                user: user
            });
        } else {
            res.status(401).json({ error: 'Contraseña incorrecta' });
        }
    });
});

app.post('/api/citas', (req, res) => {
    const { fecha, hora, motivo, nombre_mascota, id_veterinario } = req.body;
    
    if (!fecha || !hora || !motivo) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    
    const nuevaCita = {
        fecha,
        hora,
        motivo,
        nombre_mascota: nombre_mascota || 'Sin nombre',
        id_veterinario: id_veterinario || 3,
        estado: 'activa'
    };
    
    db.query('INSERT INTO citas SET ?', nuevaCita, (err, result) => {
        if (err) {
            console.error('Error creando cita:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        
        res.json({
            success: true,
            message: 'Cita creada',
            citaId: result.insertId
        });
    });
});

// =============== RUTA CATCH-ALL CORREGIDA ===============
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// =============== INICIAR SERVIDOR ===============
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📊 Prueba estas rutas:`);
    console.log(`   GET  http://localhost:${PORT}/api/test`);
    console.log(`   GET  http://localhost:${PORT}/api/usuarios`);
    console.log(`   GET  http://localhost:${PORT}/api/citas`);
    console.log(`   POST http://localhost:${PORT}/api/login`);
    console.log(`   POST http://localhost:${PORT}/api/citas`);
    console.log(`\n🌐 Frontend disponible en: http://localhost:${PORT}`);
});