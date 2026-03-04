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

// =============== RUTAS PARA GESTIÓN DE CITAS ===============

// Obtener todas las citas (con filtros opcionales)
app.get('/api/citas', (req, res) => {
    const { fecha, veterinario, estado } = req.query;
    let query = `
        SELECT c.*, 
               m.nombre as mascota_nombre, m.especie,
               u.nombre as propietario_nombre, u.telefono as propietario_telefono,
               v.nombre as veterinario_nombre
        FROM citas c
        JOIN mascotas m ON c.id_mascota = m.id
        JOIN usuarios u ON c.id_propietario = u.id
        JOIN usuarios v ON c.id_veterinario = v.id
        WHERE 1=1
    `;
    const params = [];
    
    if (fecha) {
        query += ' AND c.fecha = ?';
        params.push(fecha);
    }
    if (veterinario) {
        query += ' AND c.id_veterinario = ?';
        params.push(veterinario);
    }
    if (estado) {
        query += ' AND c.estado = ?';
        params.push(estado);
    }
    
    query += ' ORDER BY c.fecha, c.hora';
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error al obtener citas:', err);
            return res.status(500).json({ success: false, error: 'Error al obtener citas' });
        }
        res.json({ success: true, citas: results });
    });
});

// Obtener una cita específica por ID
app.get('/api/citas/:id', (req, res) => {
    const citaId = req.params.id;
    
    const query = `
        SELECT c.*, 
               m.nombre as mascota_nombre, m.especie, m.raza,
               u.nombre as propietario_nombre, u.telefono as propietario_telefono, u.email as propietario_email,
               v.nombre as veterinario_nombre, v.email as veterinario_email
        FROM citas c
        JOIN mascotas m ON c.id_mascota = m.id
        JOIN usuarios u ON c.id_propietario = u.id
        JOIN usuarios v ON c.id_veterinario = v.id
        WHERE c.id = ?
    `;
    
    db.query(query, [citaId], (err, results) => {
        if (err) {
            console.error('Error al obtener cita:', err);
            return res.status(500).json({ success: false, error: 'Error al obtener cita' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, error: 'Cita no encontrada' });
        }
        res.json({ success: true, cita: results[0] });
    });
});

// Verificar disponibilidad de horario
app.post('/api/citas/verificar-disponibilidad', [
    body('fecha').isDate().withMessage('Fecha inválida'),
    body('hora').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora inválida'),
    body('id_veterinario').isInt().withMessage('ID de veterinario inválido')
], validateRequest, (req, res) => {
    const { fecha, hora, id_veterinario } = req.body;
    
    const query = `
        SELECT COUNT(*) as total 
        FROM citas 
        WHERE fecha = ? AND hora = ? AND id_veterinario = ? AND estado != 'cancelada'
    `;
    
    db.query(query, [fecha, hora, id_veterinario], (err, results) => {
        if (err) {
            console.error('Error al verificar disponibilidad:', err);
            return res.status(500).json({ success: false, error: 'Error al verificar disponibilidad' });
        }
        
        const disponible = results[0].total === 0;
        res.json({ 
            success: true, 
            disponible: disponible,
            mensaje: disponible ? 'Horario disponible' : 'El horario no está disponible'
        });
    });
});

// Crear nueva cita
app.post('/api/citas', [
    body('fecha').isDate().withMessage('Fecha inválida'),
    body('hora').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora inválida'),
    body('motivo').trim().notEmpty().withMessage('El motivo es requerido').escape(),
    body('id_mascota').isInt().withMessage('Selecciona una mascota'),
    body('id_veterinario').isInt().withMessage('Selecciona un veterinario'),
    body('id_propietario').isInt().withMessage('ID de propietario inválido')
], validateRequest, async (req, res) => {
    const { fecha, hora, motivo, id_mascota, id_veterinario, id_propietario } = req.body;
    
    // Primero verificar disponibilidad
    db.query(
        'SELECT COUNT(*) as total FROM citas WHERE fecha = ? AND hora = ? AND id_veterinario = ? AND estado != "cancelada"',
        [fecha, hora, id_veterinario],
        (err, results) => {
            if (err) {
                console.error('Error al verificar disponibilidad:', err);
                return res.status(500).json({ success: false, error: 'Error al crear cita' });
            }
            
            if (results[0].total > 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'El horario seleccionado no está disponible'
                });
            }
            
            // Crear la cita
            const insertQuery = `
                INSERT INTO citas (fecha, hora, motivo, estado, id_mascota, id_veterinario, id_propietario)
                VALUES (?, ?, ?, 'programada', ?, ?, ?)
            `;
            
            db.query(insertQuery, [fecha, hora, motivo, id_mascota, id_veterinario, id_propietario], (err, result) => {
                if (err) {
                    console.error('Error al crear cita:', err);
                    return res.status(500).json({ success: false, error: 'Error al crear la cita' });
                }
                
                res.json({ 
                    success: true, 
                    message: 'Cita agendada exitosamente',
                    citaId: result.insertId
                });
            });
        }
    );
});

// Actualizar cita
app.put('/api/citas/:id', [
    body('fecha').optional().isDate(),
    body('hora').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('motivo').optional().trim().escape(),
    body('estado').optional().isIn(['programada', 'confirmada', 'cancelada', 'completada'])
], validateRequest, (req, res) => {
    const citaId = req.params.id;
    const updates = req.body;
    const fields = [];
    const values = [];

    // Construir query dinámica
    Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
            fields.push(`${key} = ?`);
            values.push(updates[key]);
        }
    });

    if (fields.length === 0) {
        return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
    }

    values.push(citaId);
    const query = `UPDATE citas SET ${fields.join(', ')} WHERE id = ?`;

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al actualizar cita:', err);
            return res.status(500).json({ success: false, error: 'Error al actualizar la cita' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Cita no encontrada' });
        }
        res.json({ success: true, message: 'Cita actualizada exitosamente' });
    });
});

// Cancelar cita (borrado lógico)
app.delete('/api/citas/:id', (req, res) => {
    const citaId = req.params.id;
    
    db.query('UPDATE citas SET estado = "cancelada" WHERE id = ?', [citaId], (err, result) => {
        if (err) {
            console.error('Error al cancelar cita:', err);
            return res.status(500).json({ success: false, error: 'Error al cancelar la cita' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Cita no encontrada' });
        }
        res.json({ success: true, message: 'Cita cancelada exitosamente' });
    });
});

// Obtener veterinarios disponibles
app.get('/api/veterinarios', (req, res) => {
    db.query('SELECT id, nombre, email FROM usuarios WHERE rol = "veterinario"', (err, results) => {
        if (err) {
            console.error('Error al obtener veterinarios:', err);
            return res.status(500).json({ success: false, error: 'Error al obtener veterinarios' });
        }
        res.json({ success: true, veterinarios: results });
    });
});

// Obtener mascotas de un propietario (ya existe, pero la dejamos documentada)
// GET /api/mascotas/propietario/:idPropietario

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
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/html-acceso/inicio-sesion.html'));
});

app.get('/registro', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/html-acceso/registro.html'));
});

app.get('/registro-propietario', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/html-registros/registro-propietario.html'));
});

app.get('/registro-recepcionista', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/html-registros/registro-recepcionista.html'));
});

app.get('/registro-veterinario', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/html-registros/registro-veterinario.html'));
});

app.get('/dashboard-propietario', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/html-perfiles/dashboard-propietario.html'));
});

// 👇 ESTA ES LA RUTA QUE FALTA
app.get('/dashboard-recepcionista', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/html-perfiles/dashboard-recepcionista.html'));
});

app.get('/dashboard-veterinario', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/html-perfiles/dashboard-veterinario.html'));
});

app.get('/citas', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/html-acceso/citas-medicas.html'));
});

app.get('/historial', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/html-acceso/historial-medico.html'));
});

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