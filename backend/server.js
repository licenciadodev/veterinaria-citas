// backend/server.js - VERSIÓN CON TODAS LAS RUTAS DE REGISTRO
const bcrypt = require('bcryptjs');
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { body, validationResult, matchedData } = require('express-validator');

const app = express();

// =============== CONFIGURACIÓN ===============
console.log('🔧 Configurando servidor...');

const basePath = path.join(__dirname, '..');
const frontendPath = path.join(basePath, 'frontend');
const htmlPath = path.join(frontendPath, 'html');

// =============== CONFIGURACIÓN EXPRESS ===============
app.use(cors());
app.use(express.json());
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
    } else {
        console.log('✅ Conectado a MySQL - veterinaria_db');
    }
});

// =============== MIDDLEWARE PARA VALIDACIÓN ===============
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            errors: errors.array().map(e => ({
                campo: e.path,
                mensaje: e.msg
            }))
        });
    }
    next();
};

// =============== RUTAS API ===============

// 1. Test API
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: '✅ API funcionando' });
});

// 2. Obtener usuarios
app.get('/api/usuarios', (req, res) => {
    db.query('SELECT id, nombre, usuario, email, telefono, rol FROM usuarios', (err, results) => {
        if (err) return res.status(500).json({ success: false, error: 'Error al obtener usuarios' });
        res.json({ success: true, usuarios: results });
    });
});

// 3. LOGIN
app.post('/api/login', [
    body('username').trim().notEmpty().withMessage('El usuario es requerido').escape(),
    body('password').notEmpty().withMessage('La contraseña es requerida')
], validateRequest, (req, res) => {
    const { username, password } = matchedData(req);
    
    const query = 'SELECT * FROM usuarios WHERE usuario = ? OR email = ?';
    
    db.query(query, [username, username], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: 'Error en el servidor' });
        if (results.length === 0) return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
        
        const user = results[0];
        let passwordMatch = false;

        try {
            passwordMatch = bcrypt.compareSync(password, user.password);
        } catch (err) {
            passwordMatch = false;
        }

        if (!passwordMatch && password === user.password) {
            passwordMatch = true;
            const newHash = bcrypt.hashSync(password, 10);
            db.query('UPDATE usuarios SET password = ? WHERE id = ?', [newHash, user.id]);
        }

        if (passwordMatch) {
            const userResponse = {
                id: user.id,
                nombre: user.nombre,
                usuario: user.usuario,
                email: user.email,
                telefono: user.telefono,
                rol: user.rol
            };
            res.json({ success: true, message: `Bienvenido ${user.nombre}`, user: userResponse });
        } else {
            res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
        }
    });
});

// 4. REGISTRO DE PROPIETARIO
app.post('/api/registrar/propietario', [
    body('nombres').trim().notEmpty().withMessage('Los nombres son requeridos').escape(),
    body('apellidos').trim().notEmpty().withMessage('Los apellidos son requeridos').escape(),
    body('email').trim().notEmpty().withMessage('El email es requerido').isEmail().normalizeEmail(),
    body('telefono').trim().notEmpty().withMessage('El teléfono es requerido').escape(),
    body('direccion').optional({ checkFalsy: true }).trim().escape(),
    body('ciudad').optional({ checkFalsy: true }).trim().escape(),
    body('departamento').optional({ checkFalsy: true }).trim().escape(),
    body('nombre_mascota').trim().notEmpty().withMessage('El nombre de la mascota es requerido').escape(),
    body('especie').trim().notEmpty().withMessage('La especie es requerida').escape(),
    body('raza').optional({ checkFalsy: true }).trim().escape(),
    body('edad').optional({ checkFalsy: true }).isInt({ min: 0, max: 50 }).toInt(),
    body('usuario').trim().notEmpty().withMessage('El usuario es requerido').isLength({ min: 4 }).escape(),
    body('password').notEmpty().withMessage('La contraseña es requerida').isLength({ min: 4 }),
    body('confirm-password').custom((value, { req }) => value === req.body.password).withMessage('Las contraseñas no coinciden')
], validateRequest, (req, res) => {
    const datos = matchedData(req);
    const { nombres, apellidos, email, telefono, direccion, ciudad, departamento, nombre_mascota, especie, raza, edad, usuario, password } = datos;

    const hashedPassword = bcrypt.hashSync(password, 10);
    const nombreCompleto = `${nombres} ${apellidos}`.trim();

    db.query('SELECT id FROM usuarios WHERE usuario = ? OR email = ?', [usuario, email], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: 'Error al verificar disponibilidad' });
        if (results.length > 0) return res.status(400).json({ success: false, error: 'El usuario o email ya está registrado' });
        
        const insertQuery = `INSERT INTO usuarios (nombre, usuario, email, password, telefono, direccion, ciudad, departamento, rol) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'propietario')`;
        const values = [nombreCompleto, usuario, email, hashedPassword, telefono, direccion || null, ciudad || null, departamento || null];
        
        db.query(insertQuery, values, (err, result) => {
            if (err) return res.status(500).json({ success: false, error: 'Error al crear el usuario' });
            
            const userId = result.insertId;
            
            const mascotaQuery = `INSERT INTO mascotas (nombre, especie, raza, edad, id_propietario) VALUES (?, ?, ?, ?, ?)`;
            db.query(mascotaQuery, [nombre_mascota, especie, raza || null, edad || null, userId], (err) => {
                if (err) return res.status(500).json({ success: false, error: 'Usuario creado pero error al registrar mascota' });
                
                res.json({ success: true, message: 'Registro exitoso', user: { id: userId, nombre: nombreCompleto, usuario, email, rol: 'propietario' } });
            });
        });
    });
});

// 5. REGISTRO DE RECEPCIONISTA (NUEVA RUTA)
app.post('/api/registrar/recepcionista', [
    body('nombres').trim().notEmpty().withMessage('Los nombres son requeridos').escape(),
    body('apellidos').trim().notEmpty().withMessage('Los apellidos son requeridos').escape(),
    body('email').trim().notEmpty().withMessage('El email es requerido').isEmail().normalizeEmail(),
    body('telefono').trim().notEmpty().withMessage('El teléfono es requerido').escape(),
    body('fecha_ingreso').notEmpty().withMessage('La fecha de ingreso es requerida').isDate(),
    body('turno').isIn(['mañana', 'tarde', 'completo']).withMessage('Turno no válido'),
    body('usuario').trim().notEmpty().withMessage('El usuario es requerido').isLength({ min: 4 }).escape(),
    body('password').notEmpty().withMessage('La contraseña es requerida').isLength({ min: 4 }),
    body('confirm_password').custom((value, { req }) => value === req.body.password).withMessage('Las contraseñas no coinciden')
], validateRequest, (req, res) => {
    const datos = matchedData(req);
    const { nombres, apellidos, email, telefono, fecha_ingreso, turno, usuario, password } = datos;

    const hashedPassword = bcrypt.hashSync(password, 10);
    const nombreCompleto = `${nombres} ${apellidos}`.trim();

    db.query('SELECT id FROM usuarios WHERE usuario = ? OR email = ?', [usuario, email], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: 'Error al verificar disponibilidad' });
        if (results.length > 0) return res.status(400).json({ success: false, error: 'El usuario o email ya está registrado' });
        
        const insertQuery = `INSERT INTO usuarios (nombre, usuario, email, password, telefono, rol) VALUES (?, ?, ?, ?, ?, 'recepcionista')`;
        const values = [nombreCompleto, usuario, email, hashedPassword, telefono];
        
        db.query(insertQuery, values, (err, result) => {
            if (err) return res.status(500).json({ success: false, error: 'Error al crear el recepcionista' });
            
            res.json({ 
                success: true, 
                message: 'Recepcionista registrado exitosamente',
                user: { 
                    id: result.insertId, 
                    nombre: nombreCompleto, 
                    usuario, 
                    email, 
                    rol: 'recepcionista' 
                }
            });
        });
    });
});

// 6. REGISTRO DE VETERINARIO (NUEVA RUTA)
app.post('/api/registrar/veterinario', [
    body('nombres').trim().notEmpty().withMessage('Los nombres son requeridos').escape(),
    body('apellidos').trim().notEmpty().withMessage('Los apellidos son requeridos').escape(),
    body('email').trim().notEmpty().withMessage('El email es requerido').isEmail().normalizeEmail(),
    body('telefono').trim().notEmpty().withMessage('El teléfono es requerido').escape(),
    body('documento').trim().notEmpty().withMessage('El documento es requerido').escape(),
    body('tarjeta_profesional').trim().notEmpty().withMessage('La tarjeta profesional es requerida').escape(),
    body('especialidad').notEmpty().withMessage('La especialidad es requerida'),
    body('usuario').trim().notEmpty().withMessage('El usuario es requerido').isLength({ min: 4 }).escape(),
    body('password').notEmpty().withMessage('La contraseña es requerida').isLength({ min: 4 }),
    body('confirm_password').custom((value, { req }) => value === req.body.password).withMessage('Las contraseñas no coinciden')
], validateRequest, (req, res) => {
    const datos = matchedData(req);
    const { nombres, apellidos, email, telefono, documento, tarjeta_profesional, especialidad, usuario, password } = datos;

    const hashedPassword = bcrypt.hashSync(password, 10);
    const nombreCompleto = `${nombres} ${apellidos}`.trim();

    db.query('SELECT id FROM usuarios WHERE usuario = ? OR email = ?', [usuario, email], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: 'Error al verificar disponibilidad' });
        if (results.length > 0) return res.status(400).json({ success: false, error: 'El usuario o email ya está registrado' });
        
        // Nota: Si tu tabla no tiene columnas para documento, tarjeta_profesional, especialidad,
        // deberás agregarlas primero con ALTER TABLE
        const insertQuery = `INSERT INTO usuarios (nombre, usuario, email, password, telefono, rol) VALUES (?, ?, ?, ?, ?, 'veterinario')`;
        const values = [nombreCompleto, usuario, email, hashedPassword, telefono];
        
        db.query(insertQuery, values, (err, result) => {
            if (err) return res.status(500).json({ success: false, error: 'Error al crear el veterinario' });
            
            res.json({ 
                success: true, 
                message: 'Veterinario registrado exitosamente',
                user: { 
                    id: result.insertId, 
                    nombre: nombreCompleto, 
                    usuario, 
                    email, 
                    rol: 'veterinario' 
                }
            });
        });
    });
});

// 7. OBTENER MASCOTAS
app.get('/api/mascotas/propietario/:idPropietario', (req, res) => {
    const idPropietario = req.params.idPropietario;
    db.query('SELECT id, nombre, especie, raza, edad FROM mascotas WHERE id_propietario = ?', [idPropietario], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: 'Error al obtener mascotas' });
        res.json({ success: true, mascotas: results });
    });
});

// 8. LOGOUT
app.get('/api/logout', (req, res) => {
    res.json({ success: true, message: 'Sesión cerrada' });
});

// =============== RUTAS HTML ===============
app.get('/', (req, res) => res.sendFile(path.join(htmlPath, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(htmlPath, 'html-acceso', 'inicio-sesion.html')));
app.get('/registro', (req, res) => res.sendFile(path.join(htmlPath, 'html-acceso', 'registro.html')));
app.get('/registro-propietario', (req, res) => res.sendFile(path.join(htmlPath, 'html-registros', 'registro-propietario.html')));
app.get('/registro-recepcionista', (req, res) => res.sendFile(path.join(htmlPath, 'html-registros', 'registro-recepcionista.html')));
app.get('/registro-veterinario', (req, res) => res.sendFile(path.join(htmlPath, 'html-registros', 'registro-veterinario.html')));
app.get('/dashboard-propietario', (req, res) => res.sendFile(path.join(htmlPath, 'html-perfiles', 'dashboard-propietario.html')));
app.get('/dashboard-recepcionista', (req, res) => res.sendFile(path.join(htmlPath, 'html-perfiles', 'dashboard-recepcionista.html')));
app.get('/dashboard-veterinario', (req, res) => res.sendFile(path.join(htmlPath, 'html-perfiles', 'dashboard-veterinario.html')));
app.get('/citas', (req, res) => res.sendFile(path.join(htmlPath, 'html-acceso', 'citas-medicas.html')));
app.get('/historial', (req, res) => res.sendFile(path.join(htmlPath, 'html-acceso', 'historial-medico.html')));

// =============== REDIRECCIONES ===============
app.get('/index.html', (req, res) => res.redirect('/'));
app.get('/html-acceso/inicio-sesion.html', (req, res) => res.redirect('/login'));
app.get('/html-acceso/registro.html', (req, res) => res.redirect('/registro'));

// =============== RUTA DE VERIFICACIÓN ===============
app.get('/api/rutas', (req, res) => {
    res.json({ 
        success: true, 
        rutas: [
            'POST /api/registrar/propietario',
            'POST /api/registrar/recepcionista',
            'POST /api/registrar/veterinario',
            'POST /api/login',
            'GET /api/mascotas/propietario/:id'
        ]
    });
});

// =============== MANEJO DE ERRORES ===============
app.use((req, res) => res.status(404).json({ success: false, error: 'Ruta no encontrada' }));
app.use((err, req, res, next) => res.status(500).json({ success: false, error: 'Error interno' }));

// =============== INICIAR SERVIDOR ===============
const PORT = 3000;
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 SERVIDOR CON TODAS LAS RUTAS DE REGISTRO');
    console.log('='.repeat(60));
    console.log(`🌐 http://localhost:${PORT}`);
    console.log('✅ Rutas disponibles:');
    console.log('   • POST /api/registrar/propietario');
    console.log('   • POST /api/registrar/recepcionista');
    console.log('   • POST /api/registrar/veterinario');
    console.log('='.repeat(60));
});