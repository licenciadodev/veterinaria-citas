// backend/server.js - VERSIÓN SIMPLIFICADA
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();

// Configuración básica
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Conexión a la base de datos
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
    console.log('✅ Conectado a MySQL');
});

// =============== RUTAS SIMPLES PARA PRUEBA ===============

// 1. Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({ message: '¡El servidor funciona!' });
});

// 2. Login básico (para probar)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    console.log('Intento de login:', email);
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }
    
    // Buscar usuario
    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Error en login:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }
        
        const user = results[0];
        
        // Verificar contraseña (en producción usar bcrypt)
        if (password === '123456') { // Solo para prueba
            // Eliminar password de la respuesta
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

// 3. Obtener usuarios (solo para prueba)
app.get('/api/usuarios', (req, res) => {
    db.query('SELECT id, nombre, email, rol FROM usuarios', (err, results) => {
        if (err) {
            console.error('Error obteniendo usuarios:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        res.json(results);
    });
});

// 4. Obtener citas
app.get('/api/citas', (req, res) => {
    db.query('SELECT * FROM citas', (err, results) => {
        if (err) {
            console.error('Error obteniendo citas:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        res.json(results);
    });
});

// 5. Crear cita simple
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
        id_veterinario: id_veterinario || 3, // Dr. Carlos por defecto
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

// 6. Ruta para servir el frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📊 Prueba estas rutas:`);
    console.log(`   GET  http://localhost:${PORT}/api/test`);
    console.log(`   GET  http://localhost:${PORT}/api/usuarios`);
    console.log(`   GET  http://localhost:${PORT}/api/citas`);
    console.log(`   POST http://localhost:${PORT}/api/login`);
    console.log(`   POST http://localhost:${PORT}/api/citas`);
});