// backend/server.js - VERSIÓN COMPLETA Y CORREGIDA
const bcrypt = require('bcryptjs');
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
    { nombre: 'inicio-sesion.html', ruta: path.join(htmlPath, 'html-acceso', 'inicio-sesion.html') },
    { nombre: 'registro.html', ruta: path.join(htmlPath, 'html-acceso', 'registro.html') },
    { nombre: 'citas-medicas.html', ruta: path.join(htmlPath, 'html-acceso', 'citas-medicas.html') },
    { nombre: 'historial-medico.html', ruta: path.join(htmlPath, 'html-acceso', 'historial-medico.html') },
    { nombre: 'dashboard-propietario.html', ruta: path.join(htmlPath, 'html-perfiles', 'dashboard-propietario.html') },
    { nombre: 'dashboard-recepcionista.html', ruta: path.join(htmlPath, 'html-perfiles', 'dashboard-recepcionista.html') },
    { nombre: 'dashboard-veterinario.html', ruta: path.join(htmlPath, 'html-perfiles', 'dashboard-veterinario.html') },
    { nombre: 'registro-propietario.html', ruta: path.join(htmlPath, 'html-registros', 'registro-propietario.html') }
];

console.log('🔍 Verificando archivos:');
archivosVerificar.forEach(archivo => {
    if (fs.existsSync(archivo.ruta)) {
        console.log(`   ✅ ${archivo.nombre}: EXISTE`);
    } else {
        console.log(`   ⚠️  ${archivo.nombre}: NO EXISTE (${archivo.ruta})`);
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
    database: 'veterinaria_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error MySQL:', err.message);
        console.log('💡 Verifica que:');
        console.log('   1. XAMPP/WAMP esté corriendo');
        console.log('   2. MySQL esté activo en el puerto 3306');
        console.log('   3. La base de datos "veterinaria_db" exista');
    } else {
        console.log('✅ Conectado a MySQL - veterinaria_db');
        
        // Verificar estructura de la tabla usuarios
        db.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'veterinaria_db' 
            AND TABLE_NAME = 'usuarios'
            ORDER BY ORDINAL_POSITION
        `, (err, results) => {
            if (err) {
                console.error('❌ Error al verificar estructura:', err.message);
            } else {
                console.log('📋 Estructura de tabla "usuarios":');
                results.forEach(col => {
                    console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
                });
                
                // Verificar específicamente el campo 'usuario'
                const tieneUsuario = results.some(col => col.COLUMN_NAME === 'usuario');
                if (!tieneUsuario) {
                    console.warn('⚠️  ADVERTENCIA: La tabla no tiene campo "usuario"');
                    console.log('   Ejecuta: ALTER TABLE usuarios ADD COLUMN usuario VARCHAR(50) UNIQUE AFTER nombre;');
                }
            }
        });
    }
});

// =============== RUTAS API ===============

// 1. Test API
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true,
        message: '✅ API funcionando correctamente',
        timestamp: new Date().toISOString(),
        server: 'LaMascotApp Backend',
        version: '1.0.0'
    });
});

// 2. Obtener usuarios (sin contraseñas)
app.get('/api/usuarios', (req, res) => {
    db.query('SELECT id, nombre, usuario, email, telefono, rol FROM usuarios', (err, results) => {
        if (err) {
            console.error('❌ Error al obtener usuarios:', err.message);
            return res.status(500).json({ 
                success: false, 
                error: 'Error del servidor al obtener usuarios' 
            });
        }
        res.json({ 
            success: true,
            count: results.length,
            usuarios: results 
        });
    });
});

// 3. LOGIN - ACEPTA USUARIO O EMAIL
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    console.log('🔐 Intento de login recibido:', { 
        username: username || '(vacío)',
        tienePassword: !!password 
    });
    
    // Validación de entrada
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            error: 'Usuario y contraseña son requeridos' 
        });
    }
    
    // Buscar por usuario O email (para compatibilidad)
    const query = 'SELECT * FROM usuarios WHERE usuario = ? OR email = ?';
    
    db.query(query, [username, username], (err, results) => {
        if (err) {
            console.error('❌ Error en consulta BD:', err.message);
            return res.status(500).json({ 
                success: false, 
                error: 'Error en el servidor de base de datos' 
            });
        }
        
        if (results.length === 0) {
            console.log('❌ Usuario no encontrado:', username);
            return res.status(401).json({ 
                success: false, 
                error: `Usuario "${username}" no encontrado. Prueba con: juan, maria, carlos, ana, recepcion` 
            });
        }
        
        const user = results[0];
        
        // Para DEBUG: Mostrar qué usuario se encontró
        console.log('🔍 Usuario encontrado:', {
            id: user.id,
            nombre: user.nombre,
            usuario: user.usuario,
            email: user.email,
            rol: user.rol,
            passwordEnBD: user.password.substring(0, 10) + '...' // Solo primeros 10 chars
        });
        
        // COMPARACIÓN DIRECTA (para uso académico)
        if (password === user.password) {
            console.log('✅ Login exitoso! Usuario:', user.usuario || user.email, 'Rol:', user.rol);
            
            // Crear respuesta sin contraseña
            const userResponse = {
                id: user.id,
                nombre: user.nombre,
                usuario: user.usuario,
                email: user.email,
                telefono: user.telefono,
                rol: user.rol,
                fechaLogin: new Date().toISOString()
            };
            
            res.json({ 
                success: true, 
                message: `Bienvenido ${user.nombre}`,
                user: userResponse
            });
        } else {
            console.log('❌ Contraseña incorrecta para:', username);
            console.log('   Contraseña recibida:', password);
            console.log('   Contraseña en BD:', user.password);
            
            res.status(401).json({ 
                success: false, 
                error: 'Contraseña incorrecta. La contraseña es: 123456' 
            });
        }
    });
});

// 4. REGISTRO DE PROPIETARIO
app.post('/api/registrar/propietario', (req, res) => {
    console.log('📝 Solicitud de registro recibida:', req.body);
    
    const {
        nombres,
        apellidos,
        email,
        telefono,
        direccion,
        ciudad,
        departamento,
        nombre_mascota,
        especie,
        raza,
        edad,
        usuario,
        password,
        'confirm-password': confirmPassword
    } = req.body;
    
    // Validaciones básicas
    const errors = [];
    
    if (!usuario) errors.push('Usuario es requerido');
    if (!email) errors.push('Email es requerido');
    if (!password) errors.push('Contraseña es requerida');
    if (!nombres) errors.push('Nombres son requeridos');
    if (!apellidos) errors.push('Apellidos son requeridos');
    
    if (errors.length > 0) {
        return res.status(400).json({ 
            success: false, 
            error: errors.join(', ') 
        });
    }
    
    if (password !== confirmPassword) {
        return res.status(400).json({ 
            success: false, 
            error: 'Las contraseñas no coinciden' 
        });
    }
    
    // Verificar si usuario o email ya existen
    db.query('SELECT id, usuario, email FROM usuarios WHERE usuario = ? OR email = ?', 
        [usuario, email], 
        (err, results) => {
            if (err) {
                console.error('❌ Error al verificar usuario:', err.message);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error al verificar disponibilidad' 
                });
            }
            
            if (results.length > 0) {
                const existing = results[0];
                let errorMsg = '';
                if (existing.usuario === usuario) {
                    errorMsg = `El usuario "${usuario}" ya está registrado`;
                } else if (existing.email === email) {
                    errorMsg = `El email "${email}" ya está registrado`;
                }
                return res.status(400).json({ 
                    success: false, 
                    error: errorMsg 
                });
            }
            
            // Crear nombre completo
            const nombreCompleto = `${nombres} ${apellidos}`.trim();
            
            // Insertar nuevo usuario
            const insertQuery = `
                INSERT INTO usuarios 
                (nombre, usuario, email, password, telefono, direccion, ciudad, departamento, rol) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'propietario')
            `;
            
            const values = [
                nombreCompleto, 
                usuario, 
                email, 
                password, 
                telefono || null,
                direccion || null,
                ciudad || null,
                departamento || null
            ];
            
            db.query(insertQuery, values, (err, result) => {
                if (err) {
                    console.error('❌ Error al insertar usuario:', err.message);
                    return res.status(500).json({ 
                        success: false, 
                        error: 'Error al crear el usuario' 
                    });
                }
                
                const userId = result.insertId;
                console.log('✅ Usuario registrado exitosamente. ID:', userId);
                
                // Si hay datos de mascota, insertarla
                if (nombre_mascota && especie) {
                    const mascotaQuery = `
                        INSERT INTO mascotas 
                        (nombre, especie, raza, edad, id_propietario) 
                        VALUES (?, ?, ?, ?, ?)
                    `;
                    
                    db.query(mascotaQuery, 
                        [nombre_mascota, especie, raza || null, edad || null, userId], 
                        (err) => {
                            if (err) {
                                console.error('⚠️ Error al crear mascota:', err.message);
                                // Continuar aunque falle la mascota
                            } else {
                                console.log('✅ Mascota registrada para usuario:', userId);
                            }
                            
                            res.json({ 
                                success: true, 
                                message: 'Registro exitoso. ¡Bienvenido a LaMascotApp!',
                                userId: userId,
                                user: {
                                    id: userId,
                                    nombre: nombreCompleto,
                                    usuario: usuario,
                                    email: email,
                                    rol: 'propietario'
                                }
                            });
                        }
                    );
                } else {
                    res.json({ 
                        success: true, 
                        message: 'Registro exitoso. ¡Bienvenido a LaMascotApp!',
                        userId: userId,
                        user: {
                            id: userId,
                            nombre: nombreCompleto,
                            usuario: usuario,
                            email: email,
                            rol: 'propietario'
                        }
                    });
                }
            });
        }
    );
});

// 5. LOGOUT
app.get('/api/logout', (req, res) => {
    console.log('👋 Solicitud de logout recibida');
    res.json({ 
        success: true, 
        message: 'Sesión cerrada exitosamente' 
    });
});

// 6. OBTENER USUARIO ACTUAL (por ID)
app.get('/api/usuario/:id', (req, res) => {
    const userId = req.params.id;
    
    db.query('SELECT id, nombre, usuario, email, telefono, rol FROM usuarios WHERE id = ?', 
        [userId], 
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            res.json(results[0]);
        }
    );
});

// =============== RUTAS HTML PRINCIPALES ===============

// Página principal
app.get('/', (req, res) => {
    const indexPath = path.join(htmlPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send(`
            <h1>Error 404 - Página no encontrada</h1>
            <p>El archivo index.html no existe en: ${indexPath}</p>
            <a href="/login">Ir al Login</a>
        `);
    }
});

// Ruta para /index.html también
app.get('/index.html', (req, res) => {
    res.redirect('/');
});

// Login
app.get('/login', (req, res) => {
    const loginPath = path.join(htmlPath, 'html-acceso', 'inicio-sesion.html');
    if (fs.existsSync(loginPath)) {
        res.sendFile(loginPath);
    } else {
        res.status(404).send('Página de inicio de sesión no encontrada');
    }
});

// Registro (selección de rol)
app.get('/registro', (req, res) => {
    const registroPath = path.join(htmlPath, 'html-acceso', 'registro.html');
    if (fs.existsSync(registroPath)) {
        res.sendFile(registroPath);
    } else {
        res.status(404).send('Página de registro no encontrada');
    }
});

// Citas
app.get('/citas', (req, res) => {
    const citasPath = path.join(htmlPath, 'html-acceso', 'citas-medicas.html');
    if (fs.existsSync(citasPath)) {
        res.sendFile(citasPath);
    } else {
        res.status(404).send('Página de citas no encontrada');
    }
});

// Historial
app.get('/historial', (req, res) => {
    const historialPath = path.join(htmlPath, 'html-acceso', 'historial-medico.html');
    if (fs.existsSync(historialPath)) {
        res.sendFile(historialPath);
    } else {
        res.status(404).send('Página de historial no encontrada');
    }
});

// =============== DASHBOARDS ===============

// Dashboard Propietario
app.get('/dashboard-propietario', (req, res) => {
    const dashboardPath = path.join(htmlPath, 'html-perfiles', 'dashboard-propietario.html');
    if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
    } else {
        res.status(404).send('Dashboard de propietario no encontrado');
    }
});

// Dashboard Recepcionista
app.get('/dashboard-recepcionista', (req, res) => {
    const dashboardPath = path.join(htmlPath, 'html-perfiles', 'dashboard-recepcionista.html');
    if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
    } else {
        res.status(404).send('Dashboard de recepcionista no encontrado');
    }
});

// Dashboard Veterinario
app.get('/dashboard-veterinario', (req, res) => {
    const dashboardPath = path.join(htmlPath, 'html-perfiles', 'dashboard-veterinario.html');
    if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
    } else {
        res.status(404).send('Dashboard de veterinario no encontrado');
    }
});

// =============== RUTAS PARA REGISTROS ESPECÍFICOS ===============

// Registro Propietario
app.get('/registro-propietario', (req, res) => {
    const registroPropPath = path.join(htmlPath, 'html-registros', 'registro-propietario.html');
    if (fs.existsSync(registroPropPath)) {
        res.sendFile(registroPropPath);
    } else {
        res.status(404).send('Página de registro de propietario no encontrada');
    }
});

// Registro Recepcionista
app.get('/registro-recepcionista', (req, res) => {
    const registroRecPath = path.join(htmlPath, 'html-registros', 'registro-recepcionista.html');
    if (fs.existsSync(registroRecPath)) {
        res.sendFile(registroRecPath);
    } else {
        res.status(404).send('Página de registro de recepcionista no encontrada');
    }
});

// Registro Veterinario
app.get('/registro-veterinario', (req, res) => {
    const registroVetPath = path.join(htmlPath, 'html-registros', 'registro-veterinario.html');
    if (fs.existsSync(registroVetPath)) {
        res.sendFile(registroVetPath);
    } else {
        res.status(404).send('Página de registro de veterinario no encontrada');
    }
});

// =============== REDIRECCIONES PARA RUTAS VIEJAS ===============

// Redirecciones para html-acceso
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

// Redirecciones para html-perfiles
app.get('/html-perfiles/dashboard-propietario.html', (req, res) => {
    res.redirect('/dashboard-propietario');
});

app.get('/html-perfiles/dashboard-recepcionista.html', (req, res) => {
    res.redirect('/dashboard-recepcionista');
});

app.get('/html-perfiles/dashboard-veterinario.html', (req, res) => {
    res.redirect('/dashboard-veterinario');
});

// Redirecciones para html-registros
app.get('/html-registros/registro-propietario.html', (req, res) => {
    res.redirect('/registro-propietario');
});

app.get('/html-registros/registro-recepcionista.html', (req, res) => {
    res.redirect('/registro-recepcionista');
});

app.get('/html-registros/registro-veterinario.html', (req, res) => {
    res.redirect('/registro-veterinario');
});

// =============== RUTAS PARA VERIFICACIÓN ===============

app.get('/api/debug-files', (req, res) => {
    const files = {};
    archivosVerificar.forEach(archivo => {
        files[archivo.nombre.replace('.html', '').replace('-', '_')] = {
            path: archivo.ruta,
            exists: fs.existsSync(archivo.ruta),
            size: fs.existsSync(archivo.ruta) ? fs.statSync(archivo.ruta).size + ' bytes' : 'N/A'
        };
    });
    
    res.json({
        success: true,
        message: 'Estado de archivos',
        files: files,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/rutas', (req, res) => {
    const rutas = [
        { metodo: 'GET', ruta: '/', descripcion: 'Página principal' },
        { metodo: 'GET', ruta: '/login', descripcion: 'Iniciar sesión (HTML)' },
        { metodo: 'POST', ruta: '/api/login', descripcion: 'API Login (JSON)' },
        { metodo: 'GET', ruta: '/registro', descripcion: 'Selección de registro' },
        { metodo: 'GET', ruta: '/registro-propietario', descripcion: 'Formulario registro propietario' },
        { metodo: 'POST', ruta: '/api/registrar/propietario', descripcion: 'API registro propietario' },
        { metodo: 'GET', ruta: '/citas', descripcion: 'Gestión de citas' },
        { metodo: 'GET', ruta: '/historial', descripcion: 'Historial médico' },
        { metodo: 'GET', ruta: '/dashboard-propietario', descripcion: 'Dashboard propietario' },
        { metodo: 'GET', ruta: '/dashboard-recepcionista', descripcion: 'Dashboard recepcionista' },
        { metodo: 'GET', ruta: '/dashboard-veterinario', descripcion: 'Dashboard veterinario' },
        { metodo: 'GET', ruta: '/api/logout', descripcion: 'API logout' },
        { metodo: 'GET', ruta: '/api/test', descripcion: 'Prueba de API' },
        { metodo: 'GET', ruta: '/api/debug-files', descripcion: 'Debug de archivos' },
        { metodo: 'GET', ruta: '/api/rutas', descripcion: 'Lista de rutas (esta página)' }
    ];
    
    res.json({
        success: true,
        message: 'Rutas disponibles en LaMascotApp',
        rutas: rutas,
        total: rutas.length
    });
});

// =============== MANEJO DE ERRORES ===============
app.use((req, res, next) => {
    console.log(`❌ Ruta no encontrada: ${req.method} ${req.url}`);
    
    res.status(404).json({ 
        success: false,
        error: 'Ruta no encontrada',
        details: {
            method: req.method,
            url: req.url,
            timestamp: new Date().toISOString()
        },
        suggestions: [
            'Verifica que la URL sea correcta',
            'Asegúrate de usar el método HTTP correcto (GET, POST, etc.)',
            'Consulta /api/rutas para ver las rutas disponibles'
        ],
        quickLinks: {
            test: '/api/test',
            loginPage: '/login',
            registerPage: '/registro',
            allRoutes: '/api/rutas'
        }
    });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
    console.error('💥 Error no manejado:', err);
    
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// =============== INICIAR SERVIDOR ===============
const PORT = 3000;
const HOST = 'localhost';

app.listen(PORT, HOST, () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 SERVIDOR INICIADO - LA MASCOT APP');
    console.log('='.repeat(70));
    console.log(`🌐 URL Principal: http://${HOST}:${PORT}`);
    console.log(`🔧 API Test:      http://${HOST}:${PORT}/api/test`);
    console.log(`🔐 Login API:     POST http://${HOST}:${PORT}/api/login`);
    console.log(`📝 Registro API:  POST http://${HOST}:${PORT}/api/registrar/propietario`);
    console.log(`🗺️  Todas las rutas: http://${HOST}:${PORT}/api/rutas`);
    console.log('='.repeat(70));
    console.log('\n👤 USUARIOS DE PRUEBA (todos con contraseña: 123456):');
    console.log('   Usuario: juan       → Rol: propietario');
    console.log('   Usuario: maria      → Rol: propietario');
    console.log('   Usuario: carlos     → Rol: veterinario');
    console.log('   Usuario: ana        → Rol: veterinario');
    console.log('   Usuario: recepcion  → Rol: recepcionista');
    console.log('\n💡 También puedes usar el EMAIL en lugar del usuario');
    console.log('='.repeat(70));
    console.log('\n📋 URLs PRINCIPALES:');
    console.log(`   Login:          http://${HOST}:${PORT}/login`);
    console.log(`   Registro:       http://${HOST}:${PORT}/registro`);
    console.log(`   Reg. Propietario: http://${HOST}:${PORT}/registro-propietario`);
    console.log(`   Citas:          http://${HOST}:${PORT}/citas`);
    console.log(`   Historial:      http://${HOST}:${PORT}/historial`);
    console.log('\n🏥 DASHBOARDS:');
    console.log(`   Propietario:    http://${HOST}:${PORT}/dashboard-propietario`);
    console.log(`   Recepcionista:  http://${HOST}:${PORT}/dashboard-recepcionista`);
    console.log(`   Veterinario:    http://${HOST}:${PORT}/dashboard-veterinario`);
    console.log('='.repeat(70));
    console.log('\n🔍 DIAGNÓSTICO:');
    console.log('   Para verificar la conexión a MySQL, revisa los mensajes arriba.');
    console.log('   Si hay errores, verifica que XAMPP/WAMP esté corriendo.');
    console.log('='.repeat(70));
    console.log('\n📝 LOGS IMPORTANTES:');
    console.log('   • Los intentos de login se mostrarán en esta consola');
    console.log('   • Los errores de BD se mostrarán con detalles');
    console.log('   • Las rutas no encontradas se registrarán');
    console.log('='.repeat(70));
    console.log('\n✅ SERVIDOR LISTO PARA PRUEBAS');
    console.log('='.repeat(70));
});