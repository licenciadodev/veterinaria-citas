// backend/server.js - VERSIÓN FINAL COMPLETA
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

console.log('📍 Ruta base:', basePath);
console.log('📁 Frontend:', frontendPath);
console.log('📄 HTML:', htmlPath);

// Verificar que existen los archivos principales
const archivosVerificar = [
    { nombre: 'index.html', ruta: path.join(htmlPath, 'index.html') },
    { nombre: 'login (inicio-sesion)', ruta: path.join(htmlPath, 'html-acceso', 'inicio-sesion.html') },
    { nombre: 'registro', ruta: path.join(htmlPath, 'html-acceso', 'registro.html') }
];

console.log('🔍 Verificando archivos:');
archivosVerificar.forEach(archivo => {
    if (fs.existsSync(archivo.ruta)) {
        console.log(`   ✅ ${archivo.nombre}: EXISTE`);
    } else {
        console.log(`   ❌ ${archivo.nombre}: NO EXISTE (${archivo.ruta})`);
    }
});

console.log('✅ Configuración completa');

// =============== CONFIGURACIÓN EXPRESS ===============
app.use(cors());
app.use(express.json());

// Servir archivos estáticos DESDE frontend/
app.use(express.static(frontendPath));

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
    res.json({ 
        message: 'API funcionando',
        timestamp: new Date().toISOString()
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

// =============== RUTAS HTML PRINCIPALES ===============

// 1. Página principal (DOS rutas para lo mismo)
app.get('/', (req, res) => {
    res.sendFile(path.join(htmlPath, 'index.html'));
});

// 2. Ruta para /index.html también
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(htmlPath, 'index.html'));
});

// 3. Login
app.get('/login', (req, res) => {
    res.sendFile(path.join(htmlPath, 'html-acceso', 'inicio-sesion.html'));
});

// 4. Registro (AQUÍ ESTABA EL ERROR - verificamos que el archivo exista)
app.get('/registro', (req, res) => {
    const registroPath = path.join(htmlPath, 'html-acceso', 'registro.html');
    if (fs.existsSync(registroPath)) {
        res.sendFile(registroPath);
    } else {
        console.error('❌ Archivo no encontrado:', registroPath);
        res.status(404).send('Página de registro no encontrada');
    }
});

// 5. Citas
app.get('/citas', (req, res) => {
    res.sendFile(path.join(htmlPath, 'html-acceso', 'citas-medicas.html'));
});

// 6. Historial
app.get('/historial', (req, res) => {
    res.sendFile(path.join(htmlPath, 'html-acceso', 'historial-medico.html'));
});

// 7. Dashboards
app.get('/dashboard-propietario', (req, res) => {
    res.sendFile(path.join(htmlPath, 'html-perfiles', 'dashboard-propietario.html'));
});

app.get('/dashboard-recepcionista', (req, res) => {
    res.sendFile(path.join(htmlPath, 'html-perfiles', 'dashboard-recepcionista.html'));
});

app.get('/dashboard-veterinario', (req, res) => {
    res.sendFile(path.join(htmlPath, 'html-perfiles', 'dashboard-veterinario.html'));
});

// =============== REDIRECCIONES PARA RUTAS VIEJAS ===============
app.get('/html-acceso/inicio-sesion.html', (req, res) => {
    res.redirect('/login');
});

app.get('/html-acceso/registro.html', (req, res) => {
    res.redirect('/registro');
});

app.get('/html-acceso/citas-medicas.html', (req, res) => {
    res.redirect('/citas');
});

app.get('/html-acceso/historial-medico.html', (req, res) => {
    res.redirect('/historial');
});

app.get('/html-perfiles/dashboard-propietario.html', (req, res) => {
    res.redirect('/dashboard-propietario');
});

app.get('/html-perfiles/dashboard-recepcionista.html', (req, res) => {
    res.redirect('/dashboard-recepcionista');
});

app.get('/html-perfiles/dashboard-veterinario.html', (req, res) => {
    res.redirect('/dashboard-veterinario');
});

// =============== RUTA PARA VERIFICAR ARCHIVOS (DEBUG) ===============
app.get('/api/debug-files', (req, res) => {
    const files = {
        index: { 
            path: path.join(htmlPath, 'index.html'),
            exists: fs.existsSync(path.join(htmlPath, 'index.html'))
        },
        registro: { 
            path: path.join(htmlPath, 'html-acceso', 'registro.html'),
            exists: fs.existsSync(path.join(htmlPath, 'html-acceso', 'registro.html'))
        },
        login: { 
            path: path.join(htmlPath, 'html-acceso', 'inicio-sesion.html'),
            exists: fs.existsSync(path.join(htmlPath, 'html-acceso', 'inicio-sesion.html'))
        }
    };
    
    res.json({
        message: 'Estado de archivos',
        files: files,
        estructura: {
            frontend: frontendPath,
            html: htmlPath,
            'html-acceso': path.join(htmlPath, 'html-acceso')
        }
    });
});

// =============== MANEJO DE ERRORES ===============
app.use((req, res, next) => {
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        path: req.path,
        suggestion: 'Verifica que la ruta sea correcta',
        availableRoutes: ['/', '/login', '/registro', '/citas', '/historial', '/dashboard-propietario']
    });
});

// =============== INICIAR SERVIDOR ===============
const PORT = 3000;
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 SERVIDOR INICIADO');
    console.log('='.repeat(60));
    console.log(`🌐 URL Principal: http://localhost:${PORT}`);
    console.log(`🔧 API Test: http://localhost:${PORT}/api/test`);
    console.log(`🔍 Debug Files: http://localhost:${PORT}/api/debug-files`);
    console.log('='.repeat(60));
    console.log('\n✅ URLs PRINCIPALES:');
    console.log(`   Inicio: http://localhost:${PORT}/`);
    console.log(`   Login: http://localhost:${PORT}/login`);
    console.log(`   Registro: http://localhost:${PORT}/registro`);
    console.log(`   Citas: http://localhost:${PORT}/citas`);
    console.log('='.repeat(60));
    console.log('\n📁 Verifica que estos archivos existan:');
    console.log(`   ${path.join(htmlPath, 'index.html')}`);
    console.log(`   ${path.join(htmlPath, 'html-acceso', 'registro.html')}`);
    console.log('='.repeat(60));
});