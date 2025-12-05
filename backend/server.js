// backend/server.js - VERSIÓN FINAL
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// =============== CONFIGURACIÓN ===============
console.log('🔧 Configurando servidor...');

const basePath = path.join(__dirname, '..'); // la_mascotapp
const frontendPath = path.join(basePath, 'frontend');
const htmlPath = path.join(frontendPath, 'html');
const indexPath = path.join(htmlPath, 'index.html');

console.log('📍 Ruta base:', basePath);
console.log('📁 Frontend:', frontendPath);
console.log('📄 HTML:', htmlPath);

// Verificar
if (!fs.existsSync(indexPath)) {
    console.error('❌ ERROR: index.html no encontrado');
    process.exit(1);
}

console.log('✅ Estructura verificada');

// =============== CONFIGURACIÓN EXPRESS ===============
app.use(cors());
app.use(express.json());

// ⭐⭐ CONFIGURACIÓN CRÍTICA ⭐⭐
// Sirve TODO el frontend desde la raíz
app.use(express.static(htmlPath));

// =============== CONEXIÓN BD ===============
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'veterinaria_db'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error MySQL:', err.message);
    } else {
        console.log('✅ Conectado a MySQL');
    }
});

// =============== RUTAS API ===============
app.get('/api/test', (req, res) => {
    res.json({ message: 'API funcionando' });
});

app.get('/api/usuarios', (req, res) => {
    db.query('SELECT id, nombre, email, rol FROM usuarios', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Datos requeridos' });
    
    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });
        
        const user = results[0];
        if (password === '123456') {
            delete user.password;
            res.json({ success: true, user });
        } else {
            res.status(401).json({ error: 'Credenciales incorrectas' });
        }
    });
});

// =============== RUTAS HTML ===============
app.get('/', (req, res) => {
    res.sendFile(indexPath);
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(htmlPath, 'html-acceso', 'inicio-sesion.html'));
});

app.get('/registro', (req, res) => {
    res.sendFile(path.join(htmlPath, 'html-acceso', 'registro.html'));
});

// =============== INICIAR ===============
const PORT = 3000;
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 SERVIDOR INICIADO');
    console.log('='.repeat(60));
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('='.repeat(60));
    console.log('\n✅ Prueba estas URLs:');
    console.log(`   http://localhost:${PORT}/`);
    console.log(`   http://localhost:${PORT}/login`);
    console.log(`   http://localhost:${PORT}/api/test`);
});