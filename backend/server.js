// backend/server.js - VERSIÓN CON VALIDACIÓN Y SANITIZACIÓN
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

// 3. LOGIN CON VALIDACIÓN
app.post('/api/login', [
    body('username')
        .trim()
        .notEmpty().withMessage('El usuario es requerido')
        .isLength({ min: 3, max: 50 }).withMessage('El usuario debe tener entre 3 y 50 caracteres')
        .escape(),
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 4 }).withMessage('La contraseña debe tener al menos 4 caracteres')
], validateRequest, (req, res) => {
    const { username, password } = matchedData(req);
    
    const query = 'SELECT * FROM usuarios WHERE usuario = ? OR email = ?';
    
    db.query(query, [username, username], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Error en el servidor' });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
        }
        
        const user = results[0];
        let passwordMatch = false;

        // Comparación con bcrypt
        try {
            passwordMatch = bcrypt.compareSync(password, user.password);
        } catch (err) {
            passwordMatch = false;
        }

        // Migración de contraseñas antiguas
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

// 4. REGISTRO DE PROPIETARIO CON VALIDACIÓN COMPLETA
app.post('/api/registrar/propietario', [
    // Validación de datos personales
    body('nombres')
        .trim()
        .notEmpty().withMessage('Los nombres son requeridos')
        .isLength({ min: 2, max: 50 }).withMessage('Los nombres deben tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Los nombres solo pueden contener letras y espacios')
        .escape(),
    
    body('apellidos')
        .trim()
        .notEmpty().withMessage('Los apellidos son requeridos')
        .isLength({ min: 2, max: 50 }).withMessage('Los apellidos deben tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Los apellidos solo pueden contener letras y espacios')
        .escape(),
    
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail()
        .isLength({ max: 100 }).withMessage('El email no puede exceder 100 caracteres'),
    
    body('telefono')
        .trim()
        .notEmpty().withMessage('El teléfono es requerido')
        .matches(/^[0-9+\-\s]+$/).withMessage('El teléfono solo puede contener números, +, - y espacios')
        .isLength({ min: 7, max: 20 }).withMessage('El teléfono debe tener entre 7 y 20 caracteres')
        .escape(),
    
    body('direccion')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 255 }).withMessage('La dirección no puede exceder 255 caracteres')
        .escape(),
    
    body('ciudad')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 }).withMessage('La ciudad no puede exceder 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('La ciudad solo puede contener letras y espacios')
        .escape(),
    
    body('departamento')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 }).withMessage('El departamento no puede exceder 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El departamento solo puede contener letras y espacios')
        .escape(),
    
    // Validación de mascota
    body('nombre_mascota')
        .trim()
        .notEmpty().withMessage('El nombre de la mascota es requerido')
        .isLength({ min: 2, max: 50 }).withMessage('El nombre de la mascota debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre de la mascota solo puede contener letras y espacios')
        .escape(),
    
    body('especie')
        .trim()
        .notEmpty().withMessage('La especie es requerida')
        .isLength({ min: 2, max: 50 }).withMessage('La especie debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('La especie solo puede contener letras y espacios')
        .escape(),
    
    body('raza')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 50 }).withMessage('La raza no puede exceder 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/).withMessage('La raza solo puede contener letras y espacios')
        .escape(),
    
    body('edad')
        .optional({ checkFalsy: true })
        .trim()
        .isInt({ min: 0, max: 50 }).withMessage('La edad debe ser un número entre 0 y 50')
        .toInt(),
    
    // Validación de cuenta
    body('usuario')
        .trim()
        .notEmpty().withMessage('El usuario es requerido')
        .isLength({ min: 4, max: 30 }).withMessage('El usuario debe tener entre 4 y 30 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('El usuario solo puede contener letras, números y guión bajo')
        .escape(),
    
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 4 }).withMessage('La contraseña debe tener al menos 4 caracteres'),
        // Sin restricciones de complejidad por ahora
    
    body('confirm-password')
        .notEmpty().withMessage('Debes confirmar la contraseña')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Las contraseñas no coinciden')

], validateRequest, (req, res) => {
    // Datos ya validados y sanitizados
    const datos = matchedData(req);
    
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
        password
    } = datos;

    const hashedPassword = bcrypt.hashSync(password, 10);
    const nombreCompleto = `${nombres} ${apellidos}`.trim();

    // Verificar duplicados
    db.query('SELECT id, usuario, email FROM usuarios WHERE usuario = ? OR email = ?', 
        [usuario, email], 
        (err, results) => {
            if (err) {
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
            
            // Insertar usuario
            const insertQuery = `
                INSERT INTO usuarios 
                (nombre, usuario, email, password, telefono, direccion, ciudad, departamento, rol) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'propietario')
            `;
            
            const values = [
                nombreCompleto, 
                usuario, 
                email, 
                hashedPassword,
                telefono,
                direccion || null,
                ciudad || null,
                departamento || null
            ];
            
            db.query(insertQuery, values, (err, result) => {
                if (err) {
                    return res.status(500).json({ success: false, error: 'Error al crear el usuario' });
                }
                
                const userId = result.insertId;
                
                // Insertar mascota
                const mascotaQuery = `
                    INSERT INTO mascotas 
                    (nombre, especie, raza, edad, id_propietario) 
                    VALUES (?, ?, ?, ?, ?)
                `;
                
                db.query(mascotaQuery, 
                    [nombre_mascota, especie, raza || null, edad || null, userId], 
                    (err) => {
                        if (err) {
                            console.error('❌ Error al crear mascota:', err.message);
                            return res.status(500).json({ 
                                success: false, 
                                error: 'Usuario creado pero error al registrar mascota' 
                            });
                        }
                        
                        res.json({ 
                            success: true, 
                            message: 'Registro exitoso. ¡Bienvenido!',
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
            });
        }
    );
});

// 5. LOGOUT
app.get('/api/logout', (req, res) => {
    res.json({ success: true, message: 'Sesión cerrada' });
});

// 6. OBTENER USUARIO POR ID
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

// 7. OBTENER MASCOTAS DE UN PROPIETARIO
app.get('/api/mascotas/propietario/:idPropietario', (req, res) => {
    const idPropietario = req.params.idPropietario;
    
    const query = 'SELECT id, nombre, especie, raza, edad FROM mascotas WHERE id_propietario = ?';
    
    db.query(query, [idPropietario], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Error al obtener mascotas' });
        }
        res.json({ success: true, mascotas: results });
    });
});

// =============== RUTAS HTML ===============
app.get('/', (req, res) => {
    res.sendFile(path.join(htmlPath, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(htmlPath, 'html-acceso', 'inicio-sesion.html'));
});

app.get('/registro', (req, res) => {
    res.sendFile(path.join(htmlPath, 'html-acceso', 'registro.html'));
});

app.get('/registro-propietario', (req, res) => {
    res.sendFile(path.join(htmlPath, 'html-registros', 'registro-propietario.html'));
});

app.get('/dashboard-propietario', (req, res) => {
    res.sendFile(path.join(htmlPath, 'html-perfiles', 'dashboard-propietario.html'));
});

app.get('/dashboard-recepcionista', (req, res) => {
    res.sendFile(path.join(htmlPath, 'html-perfiles', 'dashboard-recepcionista.html'));
});

app.get('/dashboard-veterinario', (req, res) => {
    res.sendFile(path.join(htmlPath, 'html-perfiles', 'dashboard-veterinario.html'));
});

app.get('/citas', (req, res) => {
    res.sendFile(path.join(htmlPath, 'html-acceso', 'citas-medicas.html'));
});

app.get('/historial', (req, res) => {
    res.sendFile(path.join(htmlPath, 'html-acceso', 'historial-medico.html'));
});

// =============== REDIRECCIONES ===============
app.get('/index.html', (req, res) => res.redirect('/'));
app.get('/html-acceso/inicio-sesion.html', (req, res) => res.redirect('/login'));
app.get('/html-acceso/registro.html', (req, res) => res.redirect('/registro'));
app.get('/html-perfiles/dashboard-propietario.html', (req, res) => res.redirect('/dashboard-propietario'));

// =============== RUTA DE VERIFICACIÓN ===============
app.get('/api/rutas', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API con validación funcionando',
        rutas: [
            'POST /api/login (con validación)',
            'POST /api/registrar/propietario (con validación completa)',
            'GET /api/mascotas/propietario/:id'
        ]
    });
});

// =============== MANEJO DE ERRORES ===============
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
    console.error('💥 Error:', err);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
});

// =============== INICIAR SERVIDOR ===============
const PORT = 3000;
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 SERVIDOR CON VALIDACIONES ACTIVADO');
    console.log('='.repeat(60));
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`✅ Validación y sanitización implementada`);
    console.log('='.repeat(60));
});