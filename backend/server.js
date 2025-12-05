// backend/server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// =============== CONFIGURACIÓN DE RUTAS ===============
console.log('🔍 Configurando rutas...');

// RUTA BASE CORRECTA
const basePath = path.join(__dirname, '..'); // Sube a "la_mascotapp"
console.log('📍 Ruta base del proyecto:', basePath);

// Rutas específicas CORRECTAS
const frontendPath = path.join(basePath, 'frontend');
const htmlPath = path.join(frontendPath, 'html'); // ¡Aquí están tus HTML!
const indexPath = path.join(htmlPath, 'index.html');

console.log('📁 Frontend path:', frontendPath);
console.log('📄 HTML path:', htmlPath);
console.log('🏠 Index path:', indexPath);

// Verificar que existe
if (!fs.existsSync(indexPath)) {
    console.error('❌ ERROR: index.html no encontrado');
    console.error('   Buscado en:', indexPath);
    
    // Ver qué archivos sí existen
    console.log('\n📂 Contenido de frontend/:');
    try {
        const items = fs.readdirSync(frontendPath);
        items.forEach(item => {
            const itemPath = path.join(frontendPath, item);
            const isDir = fs.statSync(itemPath).isDirectory();
            console.log(`  ${isDir ? '📁' : '📄'} ${item}`);
        });
        
        if (items.includes('html')) {
            const htmlItems = fs.readdirSync(htmlPath);
            console.log('\n📂 Contenido de frontend/html/:');
            htmlItems.forEach(item => {
                console.log(`  📄 ${item}`);
            });
        }
    } catch (err) {
        console.error('Error leyendo directorios:', err.message);
    }
    process.exit(1);
}

console.log('✅ Estructura verificada correctamente');

// =============== CONFIGURACIÓN DEL SERVIDOR ===============
app.use(cors({
    origin: ['http://localhost:5500', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// SERVIR ARCHIVOS ESTÁTICOS CORRECTAMENTE
app.use(express.static(frontendPath));  // Para CSS, JS, imágenes
app.use(express.static(htmlPath));      // Para HTML en /html/

// =============== CONEXIÓN A BASE DE DATOS ===============
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
    res.json({ 
        success: true, 
        message: 'API funcionando',
        paths: {
            base: basePath,
            frontend: frontendPath,
            html: htmlPath
        }
    });
});

app.get('/api/usuarios', (req, res) => {
    db.query('SELECT id, nombre, email, rol FROM usuarios', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }
    
    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });
        
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
            res.status(401).json({ error: 'Credenciales incorrectas' });
        }
    });
});

// =============== RUTAS PARA ARCHIVOS HTML ===============
// Ruta raíz -> index.html
app.get('/', (req, res) => {
    res.sendFile(indexPath);
});

// Ruta para login.html
app.get('/login', (req, res) => {
    res.sendFile(path.join(htmlPath, 'html-acceso', 'inicio-sesion.html'));
});

// Ruta para registro.html
app.get('/registro', (req, res) => {
    res.sendFile(path.join(htmlPath, 'html-acceso', 'registro.html'));
});

// =============== MANEJO DE ERRORES ===============
// Para rutas no encontradas
app.use((req, res, next) => {
    console.log(`❌ Ruta no encontrada: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// =============== INICIAR SERVIDOR ===============
const PORT = 3000;
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 SERVIDOR INICIADO');
    console.log('='.repeat(60));
    console.log(`🌐 URL Principal: http://localhost:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/api/test`);
    console.log(`📁 Frontend: ${frontendPath}`);
    console.log(`📄 HTML: ${htmlPath}`);
    console.log('='.repeat(60));
    console.log('\n✅ ¡Todo listo! Prueba estas URLs:');
    console.log(`   http://localhost:${PORT}/`);
    console.log(`   http://localhost:${PORT}/login`);
    console.log(`   http://localhost:${PORT}/registro`);
    console.log(`   http://localhost:${PORT}/api/test`);
});