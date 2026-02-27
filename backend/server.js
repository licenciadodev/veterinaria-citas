// backend/server.js - VERSIÓN COMPLETA Y CORREGIDA (CON BCRYPT)
const bcrypt = require('bcryptjs');
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// =============== CONFIGURACIÓN ===============
console.log('🔧 Configurando servidor...');

const basePath = path.join(__dirname, '..');
const frontendPath = path.join(basePath, 'frontend');
const htmlPath = path.join(frontendPath, 'html');

console.log('📍 Ruta base:', basePath);
console.log('📁 Frontend:', frontendPath);
console.log('📄 HTML:', htmlPath);

// Verificar archivos principales (opcional)
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

// 3. LOGIN - CON BCRYPT Y MIGRACIÓN AUTOMÁTICA
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    console.log('🔐 Intento de login recibido');
    
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            error: 'Usuario y contraseña son requeridos' 
        });
    }
    
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
            console.log('❌ Usuario no encontrado (no se revela en respuesta)');
            return res.status(401).json({ 
                success: false, 
                error: 'Credenciales incorrectas' 
            });
        }
        
        const user = results[0];
        let passwordMatch = false;

        // 1. Intentar comparación con bcrypt (hash)
        try {
            passwordMatch = bcrypt.compareSync(password, user.password);
        } catch (err) {
            passwordMatch = false;
        }

        // 2. Si no coincide, probar comparación directa (contraseña legacy en texto plano)
        if (!passwordMatch && password === user.password) {
            passwordMatch = true;
            // Migrar a hash para futuros logins
            const newHash = bcrypt.hashSync(password, 10);
            db.query('UPDATE usuarios SET password = ? WHERE id = ?', [newHash, user.id], (updateErr) => {
                if (updateErr) {
                    console.error('⚠️ No se pudo actualizar la contraseña a hash:', updateErr.message);
                } else {
                    console.log(`✅ Usuario ${user.id} migrado a contraseña hasheada.`);
                }
            });
        }

        if (passwordMatch) {
            console.log('✅ Login exitoso! Usuario:', user.usuario || user.email, 'Rol:', user.rol);
            
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
            console.log('❌ Contraseña incorrecta para usuario existente');
            res.status(401).json({ 
                success: false, 
                error: 'Credenciales incorrectas' 
            });
        }
    });
});

// 4. REGISTRO DE PROPIETARIO (con contraseña hasheada)
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
    
    const errors = [];
    if (!usuario) errors.push('Usuario es requerido');
    if (!email) errors.push('Email es requerido');
    if (!password) errors.push('Contraseña es requerida');
    if (!nombres) errors.push('Nombres son requeridos');
    if (!apellidos) errors.push('Apellidos son requeridos');
    
    if (errors.length > 0) {
        return res.status(400).json({ success: false, error: errors.join(', ') });
    }
    
    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, error: 'Las contraseñas no coinciden' });
    }

    // 🔐 HASHEAR LA CONTRASEÑA
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.query('SELECT id, usuario, email FROM usuarios WHERE usuario = ? OR email = ?', 
        [usuario, email], 
        (err, results) => {
            if (err) {
                console.error('❌ Error al verificar usuario:', err.message);
                return res.status(500).json({ success: false, error: 'Error al verificar disponibilidad' });
            }
            
            if (results.length > 0) {
                const existing = results[0];
                let errorMsg = '';
                if (existing.usuario === usuario) {
                    errorMsg = `El usuario "${usuario}" ya está registrado`;
                } else if (existing.email === email) {
                    errorMsg = `El email "${email}" ya está registrado`;
                }
                return res.status(400).json({ success: false, error: errorMsg });
            }
            
            const nombreCompleto = `${nombres} ${apellidos}`.trim();
            
            const insertQuery = `
                INSERT INTO usuarios 
                (nombre, usuario, email, password, telefono, direccion, ciudad, departamento, rol) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'propietario')
            `;
            
            const values = [
                nombreCompleto, 
                usuario, 
                email, 
                hashedPassword,   // ← contraseña hasheada
                telefono || null,
                direccion || null,
                ciudad || null,
                departamento || null
            ];
            
            db.query(insertQuery, values, (err, result) => {
                if (err) {
                    console.error('❌ Error al insertar usuario:', err.message);
                    return res.status(500).json({ success: false, error: 'Error al crear el usuario' });
                }
                
                const userId = result.insertId;
                console.log('✅ Usuario registrado exitosamente. ID:', userId);
                
                // Insertar mascota si hay datos (VERSIÓN CORREGIDA - sin campo peso)
if (nombre_mascota && especie) {
    const mascotaQuery = `
        INSERT INTO mascotas 
        (nombre, especie, raza, edad, id_propietario) 
        VALUES (?, ?, ?, ?, ?)
    `;
    
    db.query(mascotaQuery, 
        [nombre_mascota, especie, raza || null, edad || null, userId], 
        (err, mascotaResult) => {
            if (err) {
                console.error('❌ Error al crear mascota:', err.message);
                // No devolvemos error al cliente porque el usuario ya se creó
                console.log('⚠️ El usuario se creó pero la mascota no pudo guardarse');
            } else {
                console.log('✅ Mascota registrada con ID:', mascotaResult.insertId);
            }
            
            // Siempre respondemos éxito aunque falle la mascota
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
    res.json({ success: true, message: 'Sesión cerrada exitosamente' });
});

// 6. OBTENER USUARIO ACTUAL (por ID)
app.get('/api/usuario/:id', (req, res) => {
    const userId = req.params.id;
    
    db.query('SELECT id, nombre, usuario, email, telefono, rol FROM usuarios WHERE id = ?', 
        [userId], 
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
            res.json(results[0]);
        }
    );
});

// =============== RUTAS HTML (sin cambios) ===============

app.get('/', (req, res) => {
    const indexPath = path.join(htmlPath, 'index.html');
    if (fs.existsSync(indexPath)) res.sendFile(indexPath);
    else res.status(404).send(`<h1>Error 404</h1><p>index.html no existe</p><a href="/login">Ir al Login</a>`);
});

app.get('/index.html', (req, res) => res.redirect('/'));

app.get('/login', (req, res) => {
    const loginPath = path.join(htmlPath, 'html-acceso', 'inicio-sesion.html');
    if (fs.existsSync(loginPath)) res.sendFile(loginPath);
    else res.status(404).send('Página de inicio de sesión no encontrada');
});

app.get('/registro', (req, res) => {
    const registroPath = path.join(htmlPath, 'html-acceso', 'registro.html');
    if (fs.existsSync(registroPath)) res.sendFile(registroPath);
    else res.status(404).send('Página de registro no encontrada');
});

app.get('/citas', (req, res) => {
    const citasPath = path.join(htmlPath, 'html-acceso', 'citas-medicas.html');
    if (fs.existsSync(citasPath)) res.sendFile(citasPath);
    else res.status(404).send('Página de citas no encontrada');
});

app.get('/historial', (req, res) => {
    const historialPath = path.join(htmlPath, 'html-acceso', 'historial-medico.html');
    if (fs.existsSync(historialPath)) res.sendFile(historialPath);
    else res.status(404).send('Página de historial no encontrada');
});

app.get('/dashboard-propietario', (req, res) => {
    const dashboardPath = path.join(htmlPath, 'html-perfiles', 'dashboard-propietario.html');
    if (fs.existsSync(dashboardPath)) res.sendFile(dashboardPath);
    else res.status(404).send('Dashboard de propietario no encontrado');
});

app.get('/dashboard-recepcionista', (req, res) => {
    const dashboardPath = path.join(htmlPath, 'html-perfiles', 'dashboard-recepcionista.html');
    if (fs.existsSync(dashboardPath)) res.sendFile(dashboardPath);
    else res.status(404).send('Dashboard de recepcionista no encontrado');
});

app.get('/dashboard-veterinario', (req, res) => {
    const dashboardPath = path.join(htmlPath, 'html-perfiles', 'dashboard-veterinario.html');
    if (fs.existsSync(dashboardPath)) res.sendFile(dashboardPath);
    else res.status(404).send('Dashboard de veterinario no encontrado');
});

app.get('/registro-propietario', (req, res) => {
    const registroPropPath = path.join(htmlPath, 'html-registros', 'registro-propietario.html');
    if (fs.existsSync(registroPropPath)) res.sendFile(registroPropPath);
    else res.status(404).send('Página de registro de propietario no encontrada');
});

app.get('/registro-recepcionista', (req, res) => {
    const registroRecPath = path.join(htmlPath, 'html-registros', 'registro-recepcionista.html');
    if (fs.existsSync(registroRecPath)) res.sendFile(registroRecPath);
    else res.status(404).send('Página de registro de recepcionista no encontrada');
});

app.get('/registro-veterinario', (req, res) => {
    const registroVetPath = path.join(htmlPath, 'html-registros', 'registro-veterinario.html');
    if (fs.existsSync(registroVetPath)) res.sendFile(registroVetPath);
    else res.status(404).send('Página de registro de veterinario no encontrada');
});

// =============== REDIRECCIONES (opcional) ===============
app.get('/html-acceso/inicio-sesion.html', (req, res) => res.redirect('/login'));
app.get('/html-acceso/registro.html', (req, res) => res.redirect('/registro'));
app.get('/html-acceso/citas-medicas.html', (req, res) => res.redirect('/citas'));
app.get('/html-acceso/historial-medico.html', (req, res) => res.redirect('/historial'));
app.get('/html-perfiles/dashboard-propietario.html', (req, res) => res.redirect('/dashboard-propietario'));
app.get('/html-perfiles/dashboard-recepcionista.html', (req, res) => res.redirect('/dashboard-recepcionista'));
app.get('/html-perfiles/dashboard-veterinario.html', (req, res) => res.redirect('/dashboard-veterinario'));
app.get('/html-registros/registro-propietario.html', (req, res) => res.redirect('/registro-propietario'));
app.get('/html-registros/registro-recepcionista.html', (req, res) => res.redirect('/registro-recepcionista'));
app.get('/html-registros/registro-veterinario.html', (req, res) => res.redirect('/registro-veterinario'));

// =============== RUTAS DE VERIFICACIÓN ===============
app.get('/api/debug-files', (req, res) => {
    const files = {};
    archivosVerificar.forEach(archivo => {
        files[archivo.nombre.replace('.html', '').replace('-', '_')] = {
            path: archivo.ruta,
            exists: fs.existsSync(archivo.ruta),
            size: fs.existsSync(archivo.ruta) ? fs.statSync(archivo.ruta).size + ' bytes' : 'N/A'
        };
    });
    res.json({ success: true, files });
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
    res.json({ success: true, rutas, total: rutas.length });
});

// =============== MANEJO DE ERRORES ===============
app.use((req, res, next) => {
    console.log(`❌ Ruta no encontrada: ${req.method} ${req.url}`);
    res.status(404).json({ 
        success: false,
        error: 'Ruta no encontrada',
        details: { method: req.method, url: req.url, timestamp: new Date().toISOString() },
        suggestions: [
            'Verifica que la URL sea correcta',
            'Asegúrate de usar el método HTTP correcto (GET, POST, etc.)',
            'Consulta /api/rutas para ver las rutas disponibles'
        ],
        quickLinks: { test: '/api/test', loginPage: '/login', registerPage: '/registro', allRoutes: '/api/rutas' }
    });
});

app.use((err, req, res, next) => {
    console.error('💥 Error no manejado:', err);
    res.status(500).json({ success: false, error: 'Error interno del servidor', message: err.message, timestamp: new Date().toISOString() });
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
    console.log('='.repeat(70));
    console.log('\n👤 USUARIOS DE PRUEBA (contraseña: 123456):');
    console.log('   Usuario: juan, maria (propietarios)');
    console.log('   Usuario: carlos, ana (veterinarios)');
    console.log('   Usuario: recepcion (recepcionista)');
    console.log('='.repeat(70));
});