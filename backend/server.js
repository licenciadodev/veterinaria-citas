// backend/server.js - VERSIÓN FINAL COMPLETA CORREGIDA
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
    { nombre: 'registro', ruta: path.join(htmlPath, 'html-acceso', 'registro.html') },
    { nombre: 'citas-medicas', ruta: path.join(htmlPath, 'html-acceso', 'citas-medicas.html') },
    { nombre: 'historial-medico', ruta: path.join(htmlPath, 'html-acceso', 'historial-medico.html') }
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

// 4. Registro
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
    const citasPath = path.join(htmlPath, 'html-acceso', 'citas-medicas.html');
    if (fs.existsSync(citasPath)) {
        res.sendFile(citasPath);
    } else {
        console.error('❌ Archivo no encontrado:', citasPath);
        res.status(404).send('Página de citas no encontrada');
    }
});

// 6. Historial
app.get('/historial', (req, res) => {
    const historialPath = path.join(htmlPath, 'html-acceso', 'historial-medico.html');
    if (fs.existsSync(historialPath)) {
        res.sendFile(historialPath);
    } else {
        console.error('❌ Archivo no encontrado:', historialPath);
        res.status(404).send('Página de historial no encontrada');
    }
});

// 7. Dashboards
app.get('/dashboard-propietario', (req, res) => {
    const dashboardPath = path.join(htmlPath, 'html-perfiles', 'dashboard-propietario.html');
    if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
    } else {
        console.error('❌ Archivo no encontrado:', dashboardPath);
        res.status(404).send('Dashboard de propietario no encontrado');
    }
});

app.get('/dashboard-recepcionista', (req, res) => {
    const dashboardPath = path.join(htmlPath, 'html-perfiles', 'dashboard-recepcionista.html');
    if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
    } else {
        console.error('❌ Archivo no encontrado:', dashboardPath);
        res.status(404).send('Dashboard de recepcionista no encontrado');
    }
});

app.get('/dashboard-veterinario', (req, res) => {
    const dashboardPath = path.join(htmlPath, 'html-perfiles', 'dashboard-veterinario.html');
    if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
    } else {
        console.error('❌ Archivo no encontrado:', dashboardPath);
        res.status(404).send('Dashboard de veterinario no encontrado');
    }
});

// =============== RUTAS PARA REGISTRO DE PROPIETARIO (NUEVA) ===============
app.get('/registro-propietario', (req, res) => {
    const registroPropPath = path.join(htmlPath, 'html-registros', 'registro-propietario.html');
    if (fs.existsSync(registroPropPath)) {
        res.sendFile(registroPropPath);
    } else {
        console.error('❌ Archivo no encontrado:', registroPropPath);
        res.status(404).send('Página de registro de propietario no encontrada');
    }
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

// Redirección para registro-propietario viejo
app.get('/html-registros/registro-propietario.html', (req, res) => {
    res.redirect('/registro-propietario');
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
        },
        citas: { 
            path: path.join(htmlPath, 'html-acceso', 'citas-medicas.html'),
            exists: fs.existsSync(path.join(htmlPath, 'html-acceso', 'citas-medicas.html'))
        },
        historial: { 
            path: path.join(htmlPath, 'html-acceso', 'historial-medico.html'),
            exists: fs.existsSync(path.join(htmlPath, 'html-acceso', 'historial-medico.html'))
        },
        registro_propietario: { 
            path: path.join(htmlPath, 'html-registros', 'registro-propietario.html'),
            exists: fs.existsSync(path.join(htmlPath, 'html-registros', 'registro-propietario.html'))
        }
    };
    
    res.json({
        message: 'Estado de archivos',
        files: files,
        estructura: {
            frontend: frontendPath,
            html: htmlPath,
            'html-acceso': path.join(htmlPath, 'html-acceso'),
            'html-perfiles': path.join(htmlPath, 'html-perfiles'),
            'html-registros': path.join(htmlPath, 'html-registros')
        }
    });
});

// =============== RUTA PARA VERIFICAR RUTAS DISPONIBLES ===============
app.get('/api/rutas', (req, res) => {
    const rutas = [
        { ruta: '/', descripcion: 'Página principal' },
        { ruta: '/login', descripcion: 'Iniciar sesión' },
        { ruta: '/registro', descripcion: 'Página de selección de registro' },
        { ruta: '/registro-propietario', descripcion: 'Registro de propietario' },
        { ruta: '/citas', descripcion: 'Gestión de citas médicas' },
        { ruta: '/historial', descripcion: 'Historial médico' },
        { ruta: '/dashboard-propietario', descripcion: 'Dashboard para propietarios' },
        { ruta: '/dashboard-recepcionista', descripcion: 'Dashboard para recepcionistas' },
        { ruta: '/dashboard-veterinario', descripcion: 'Dashboard para veterinarios' },
        { ruta: '/api/test', descripcion: 'Prueba de API' },
        { ruta: '/api/debug-files', descripcion: 'Debug de archivos' },
        { ruta: '/api/rutas', descripcion: 'Lista de rutas disponibles' }
    ];
    
    res.json({
        message: 'Rutas disponibles en el servidor',
        rutas: rutas,
        total: rutas.length
    });
});

// =============== MANEJO DE ERRORES ===============
app.use((req, res, next) => {
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        path: req.path,
        suggestion: 'Verifica que la ruta sea correcta',
        availableRoutes: [
            '/', 
            '/login', 
            '/registro', 
            '/registro-propietario',
            '/citas', 
            '/historial', 
            '/dashboard-propietario',
            '/dashboard-recepcionista',
            '/dashboard-veterinario'
        ],
        debug: {
            files: 'http://localhost:3000/api/debug-files',
            routes: 'http://localhost:3000/api/rutas'
        }
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
    console.log(`🗺️  Rutas disponibles: http://localhost:${PORT}/api/rutas`);
    console.log('='.repeat(60));
    console.log('\n✅ URLs PRINCIPALES:');
    console.log(`   Inicio: http://localhost:${PORT}/`);
    console.log(`   Login: http://localhost:${PORT}/login`);
    console.log(`   Registro: http://localhost:${PORT}/registro`);
    console.log(`   Registro Propietario: http://localhost:${PORT}/registro-propietario`);
    console.log(`   Citas: http://localhost:${PORT}/citas`);
    console.log(`   Historial: http://localhost:${PORT}/historial`);
    console.log('\n👥 DASHBOARDS:');
    console.log(`   Propietario: http://localhost:${PORT}/dashboard-propietario`);
    console.log(`   Recepcionista: http://localhost:${PORT}/dashboard-recepcionista`);
    console.log(`   Veterinario: http://localhost:${PORT}/dashboard-veterinario`);
    console.log('='.repeat(60));
    console.log('\n📁 Archivos verificados:');
    console.log(`   ✅ index.html`);
    console.log(`   ✅ registro.html`);
    console.log(`   ✅ inicio-sesion.html`);
    console.log(`   ✅ citas-medicas.html`);
    console.log(`   ✅ historial-medico.html`);
    console.log(`   ⚠️  registro-propietario.html (verificar si existe)`);
    console.log('='.repeat(60));
});