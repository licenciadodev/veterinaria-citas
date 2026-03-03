// backend/server.js - VERSIÓN COMPLETA CON TODAS LAS RUTAS
const bcrypt = require('bcryptjs');
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const { body, validationResult, matchedData } = require('express-validator');

const app = express();

// =============== CONFIGURACIÓN ===============
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

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

// =============== MIDDLEWARE DE VALIDACIÓN ===============
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

// TEST
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'API funcionando' });
});

// LOGIN
app.post('/api/login', [
    body('username').trim().notEmpty(),
    body('password').notEmpty()
], validateRequest, (req, res) => {
    const { username, password } = matchedData(req);
    
    db.query('SELECT * FROM usuarios WHERE usuario = ? OR email = ?', [username, username], (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
        }
        
        const user = results[0];
        let passwordMatch = bcrypt.compareSync(password, user.password);
        
        if (!passwordMatch && password === user.password) {
            passwordMatch = true;
            const newHash = bcrypt.hashSync(password, 10);
            db.query('UPDATE usuarios SET password = ? WHERE id = ?', [newHash, user.id]);
        }
        
        if (passwordMatch) {
            res.json({ 
                success: true, 
                user: {
                    id: user.id,
                    nombre: user.nombre,
                    usuario: user.usuario,
                    email: user.email,
                    rol: user.rol
                }
            });
        } else {
            res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
        }
    });
});

// REGISTRO PROPIETARIO
app.post('/api/registrar/propietario', (req, res) => {
    const { nombres, apellidos, email, telefono, nombre_mascota, especie, usuario, password } = req.body;
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    const nombreCompleto = `${nombres} ${apellidos}`.trim();
    
    db.query('INSERT INTO usuarios (nombre, usuario, email, password, telefono, rol) VALUES (?, ?, ?, ?, ?, "propietario")',
        [nombreCompleto, usuario, email, hashedPassword, telefono],
        (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, error: 'Error al registrar' });
            }
            
            const userId = result.insertId;
            
            db.query('INSERT INTO mascotas (nombre, especie, id_propietario) VALUES (?, ?, ?)',
                [nombre_mascota, especie, userId],
                (err) => {
                    res.json({ success: true, message: 'Registro exitoso' });
                }
            );
        }
    );
});

// =============== ¡RUTA NUEVA PARA RECEPCIONISTA! ===============
app.post('/api/registrar/recepcionista', [
    body('nombres').trim().notEmpty(),
    body('apellidos').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('telefono').trim().notEmpty(),
    body('usuario').trim().isLength({ min: 4 }),
    body('password').isLength({ min: 4 }),
    body('confirm_password').custom((value, { req }) => value === req.body.password)
], validateRequest, (req, res) => {
    const { nombres, apellidos, email, telefono, usuario, password } = matchedData(req);
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    const nombreCompleto = `${nombres} ${apellidos}`.trim();
    
    db.query('SELECT id FROM usuarios WHERE usuario = ? OR email = ?', [usuario, email], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: 'Error en BD' });
        if (results.length > 0) return res.status(400).json({ success: false, error: 'Usuario o email ya existe' });
        
        db.query('INSERT INTO usuarios (nombre, usuario, email, password, telefono, rol) VALUES (?, ?, ?, ?, ?, "recepcionista")',
            [nombreCompleto, usuario, email, hashedPassword, telefono],
            (err, result) => {
                if (err) return res.status(500).json({ success: false, error: 'Error al registrar' });
                
                res.json({ 
                    success: true, 
                    message: 'Recepcionista registrado',
                    user: { id: result.insertId, nombre: nombreCompleto, usuario, email, rol: 'recepcionista' }
                });
            }
        );
    });
});

// =============== RUTA NUEVA PARA VETERINARIO ===============
app.post('/api/registrar/veterinario', [
    body('nombres').trim().notEmpty(),
    body('apellidos').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('telefono').trim().notEmpty(),
    body('usuario').trim().isLength({ min: 4 }),
    body('password').isLength({ min: 4 }),
    body('confirm_password').custom((value, { req }) => value === req.body.password)
], validateRequest, (req, res) => {
    const { nombres, apellidos, email, telefono, usuario, password } = matchedData(req);
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    const nombreCompleto = `${nombres} ${apellidos}`.trim();
    
    db.query('SELECT id FROM usuarios WHERE usuario = ? OR email = ?', [usuario, email], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: 'Error en BD' });
        if (results.length > 0) return res.status(400).json({ success: false, error: 'Usuario o email ya existe' });
        
        db.query('INSERT INTO usuarios (nombre, usuario, email, password, telefono, rol) VALUES (?, ?, ?, ?, ?, "veterinario")',
            [nombreCompleto, usuario, email, hashedPassword, telefono],
            (err, result) => {
                if (err) return res.status(500).json({ success: false, error: 'Error al registrar' });
                
                res.json({ 
                    success: true, 
                    message: 'Veterinario registrado',
                    user: { id: result.insertId, nombre: nombreCompleto, usuario, email, rol: 'veterinario' }
                });
            }
        );
    });
});

// RUTA PARA MASCOTAS
app.get('/api/mascotas/propietario/:id', (req, res) => {
    db.query('SELECT * FROM mascotas WHERE id_propietario = ?', [req.params.id], (err, results) => {
        res.json({ success: true, mascotas: results });
    });
});

// =============== RUTAS HTML ===============
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/html/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../frontend/html/html-acceso/inicio-sesion.html')));
app.get('/registro', (req, res) => res.sendFile(path.join(__dirname, '../frontend/html/html-acceso/registro.html')));
app.get('/registro-propietario', (req, res) => res.sendFile(path.join(__dirname, '../frontend/html/html-registros/registro-propietario.html')));
app.get('/registro-recepcionista', (req, res) => res.sendFile(path.join(__dirname, '../frontend/html/html-registros/registro-recepcionista.html')));
app.get('/registro-veterinario', (req, res) => res.sendFile(path.join(__dirname, '../frontend/html/html-registros/registro-veterinario.html')));
app.get('/dashboard-propietario', (req, res) => res.sendFile(path.join(__dirname, '../frontend/html/html-perfiles/dashboard-propietario.html')));

// =============== INICIAR SERVIDOR ===============
const PORT = 3000;
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 SERVIDOR INICIADO EN PUERTO 3000');
    console.log('='.repeat(50));
    console.log('✅ Rutas activas:');
    console.log('   • POST /api/registrar/propietario');
    console.log('   • POST /api/registrar/recepcionista ✓');
    console.log('   • POST /api/registrar/veterinario ✓');
    console.log('   • POST /api/login');
    console.log('='.repeat(50));
});