// backend/server.js - VERSIÓN COMPLETA Y CORREGIDA
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
        console.log('✅ Conectado a MySQL - veterinaria_db');
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
    body('username').trim().notEmpty().withMessage('El usuario es requerido'),
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

// 4. REGISTRO PROPIETARIO
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
    const { 
        nombres, apellidos, email, telefono, direccion, ciudad, departamento,
        nombre_mascota, especie, raza, edad, usuario, password 
    } = datos;

    const hashedPassword = bcrypt.hashSync(password, 10);
    const nombreCompleto = `${nombres} ${apellidos}`.trim();

    db.query('SELECT id FROM usuarios WHERE usuario = ? OR email = ?', [usuario, email], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: 'Error al verificar disponibilidad' });
        if (results.length > 0) return res.status(400).json({ success: false, error: 'El usuario o email ya existe' });
        
        const insertQuery = `INSERT INTO usuarios (nombre, usuario, email, password, telefono, direccion, ciudad, departamento, rol) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'propietario')`;
        const values = [nombreCompleto, usuario, email, hashedPassword, telefono, direccion || null, ciudad || null, departamento || null];
        
        db.query(insertQuery, values, (err, result) => {
            if (err) return res.status(500).json({ success: false, error: 'Error al crear el usuario' });
            
            const userId = result.insertId;
            
            const mascotaQuery = `INSERT INTO mascotas (nombre, especie, raza, edad, id_propietario) VALUES (?, ?, ?, ?, ?)`;
            db.query(mascotaQuery, [nombre_mascota, especie, raza || null, edad || null, userId], (err) => {
                if (err) return res.status(500).json({ success: false, error: 'Usuario creado pero error al registrar mascota' });
                
                res.json({ 
                    success: true, 
                    message: 'Registro exitoso',
                    user: { id: userId, nombre: nombreCompleto, usuario, email, rol: 'propietario' }
                });
            });
        });
    });
});

// 5. REGISTRO RECEPCIONISTA
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
    const { nombres, apellidos, email, telefono, usuario, password } = datos;

    const hashedPassword = bcrypt.hashSync(password, 10);
    const nombreCompleto = `${nombres} ${apellidos}`.trim();

    db.query('SELECT id FROM usuarios WHERE usuario = ? OR email = ?', [usuario, email], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: 'Error al verificar disponibilidad' });
        if (results.length > 0) return res.status(400).json({ success: false, error: 'El usuario o email ya existe' });
        
        const insertQuery = `INSERT INTO usuarios (nombre, usuario, email, password, telefono, rol) VALUES (?, ?, ?, ?, ?, 'recepcionista')`;
        const values = [nombreCompleto, usuario, email, hashedPassword, telefono];
        
        db.query(insertQuery, values, (err, result) => {
            if (err) return res.status(500).json({ success: false, error: 'Error al crear el recepcionista' });
            
            res.json({ 
                success: true, 
                message: 'Recepcionista registrado',
                user: { id: result.insertId, nombre: nombreCompleto, usuario, email, rol: 'recepcionista' }
            });
        });
    });
});

// 6. REGISTRO VETERINARIO
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
    const { nombres, apellidos, email, telefono, usuario, password } = datos;

    const hashedPassword = bcrypt.hashSync(password, 10);
    const nombreCompleto = `${nombres} ${apellidos}`.trim();

    db.query('SELECT id FROM usuarios WHERE usuario = ? OR email = ?', [usuario, email], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: 'Error al verificar disponibilidad' });
        if (results.length > 0) return res.status(400).json({ success: false, error: 'El usuario o email ya existe' });
        
        const insertQuery = `INSERT INTO usuarios (nombre, usuario, email, password, telefono, rol) VALUES (?, ?, ?, ?, ?, 'veterinario')`;
        const values = [nombreCompleto, usuario, email, hashedPassword, telefono];
        
        db.query(insertQuery, values, (err, result) => {
            if (err) return res.status(500).json({ success: false, error: 'Error al crear el veterinario' });
            
            res.json({ 
                success: true, 
                message: 'Veterinario registrado',
                user: { id: result.insertId, nombre: nombreCompleto, usuario, email, rol: 'veterinario' }
            });
        });
    });
});

// 7. OBTENER MASCOTAS DE UN PROPIETARIO
app.get('/api/mascotas/propietario/:idPropietario', (req, res) => {
    const idPropietario = req.params.idPropietario;
    db.query('SELECT id, nombre, especie, raza, edad FROM mascotas WHERE id_propietario = ?', [idPropietario], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: 'Error al obtener mascotas' });
        res.json({ success: true, mascotas: results });
    });
});

// 8. OBTENER VETERINARIOS
app.get('/api/veterinarios', (req, res) => {
    db.query('SELECT id, nombre FROM usuarios WHERE rol = "veterinario"', (err, results) => {
        if (err) return res.status(500).json({ success: false, error: 'Error al obtener veterinarios' });
        res.json({ success: true, veterinarios: results });
    });
});

// 9. OBTENER TODAS LAS CITAS (CON FILTROS)
app.get('/api/citas', (req, res) => {
    const { id_propietario, id_veterinario, estado, fecha } = req.query;
    
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
    
    if (id_propietario) {
        query += ' AND c.id_propietario = ?';
        params.push(id_propietario);
    }
    if (id_veterinario) {
        query += ' AND c.id_veterinario = ?';
        params.push(id_veterinario);
    }
    if (estado) {
        query += ' AND c.estado = ?';
        params.push(estado);
    }
    if (fecha) {
        query += ' AND c.fecha = ?';
        params.push(fecha);
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

// 10. OBTENER CITA POR ID
app.get('/api/citas/:id', (req, res) => {
    const citaId = req.params.id;
    
    const query = `
        SELECT c.*, 
               m.nombre as mascota_nombre, m.especie, m.raza,
               u.nombre as propietario_nombre, u.telefono as propietario_telefono, u.email as propietario_email,
               v.nombre as veterinario_nombre
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

// 11. VERIFICAR DISPONIBILIDAD
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

// 12. CREAR NUEVA CITA
app.post('/api/citas', [
    body('fecha').isDate().withMessage('Fecha inválida'),
    body('hora').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora inválida'),
    body('motivo').trim().notEmpty().withMessage('El motivo es requerido').escape(),
    body('id_mascota').isInt().withMessage('Selecciona una mascota'),
    body('id_veterinario').isInt().withMessage('Selecciona un veterinario'),
    body('id_propietario').isInt().withMessage('ID de propietario inválido')
], validateRequest, (req, res) => {
    const { fecha, hora, motivo, id_mascota, id_veterinario, id_propietario } = req.body;
    
    db.query(
        'SELECT COUNT(*) as total FROM citas WHERE fecha = ? AND hora = ? AND id_veterinario = ? AND estado != "cancelada"',
        [fecha, hora, id_veterinario],
        (err, results) => {
            if (err) return res.status(500).json({ success: false, error: 'Error al verificar disponibilidad' });
            
            if (results[0].total > 0) {
                return res.status(400).json({ success: false, error: 'El horario no está disponible' });
            }
            
            const insertQuery = `
                INSERT INTO citas (fecha, hora, motivo, estado, id_mascota, id_veterinario, id_propietario)
                VALUES (?, ?, ?, 'programada', ?, ?, ?)
            `;
            
            db.query(insertQuery, [fecha, hora, motivo, id_mascota, id_veterinario, id_propietario], (err, result) => {
                if (err) return res.status(500).json({ success: false, error: 'Error al crear la cita' });
                
                res.json({ success: true, message: 'Cita agendada exitosamente', citaId: result.insertId });
            });
        }
    );
});

// 13. CANCELAR CITA
app.delete('/api/citas/:id', (req, res) => {
    const citaId = req.params.id;
    
    db.query('UPDATE citas SET estado = "cancelada" WHERE id = ?', [citaId], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: 'Error al cancelar la cita' });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Cita no encontrada' });
        
        res.json({ success: true, message: 'Cita cancelada exitosamente' });
    });
});

// 14. LOGOUT
app.get('/api/logout', (req, res) => {
    res.json({ success: true, message: 'Sesión cerrada' });
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

// =============== RUTAS PARA HISTORIAL CLÍNICO ===============

// Obtener historial de una mascota
app.get('/api/historial/mascota/:idMascota', (req, res) => {
    const idMascota = req.params.idMascota;
    
    const query = `
        SELECT h.*, 
               u.nombre as veterinario_nombre,
               GROUP_CONCAT(
                   JSON_OBJECT('nombre', m.nombre, 'dosis', m.dosis, 'frecuencia', m.frecuencia)
               ) as medicamentos
        FROM historial_clinico h
        JOIN usuarios u ON h.id_veterinario = u.id
        LEFT JOIN medicamentos m ON m.id_historial = h.id
        WHERE h.id_mascota = ?
        GROUP BY h.id
        ORDER BY h.fecha DESC
    `;
    
    db.query(query, [idMascota], (err, results) => {
        if (err) {
            console.error('Error al obtener historial:', err);
            return res.status(500).json({ success: false, error: 'Error al obtener historial' });
        }
        
        // Procesar medicamentos de JSON string a objeto
        const historial = results.map(row => {
            if (row.medicamentos) {
                try {
                    row.medicamentos = JSON.parse(`[${row.medicamentos}]`);
                } catch (e) {
                    row.medicamentos = [];
                }
            } else {
                row.medicamentos = [];
            }
            return row;
        });
        
        res.json({ success: true, historial });
    });
});

// Obtener una consulta específica
app.get('/api/historial/:id', (req, res) => {
    const id = req.params.id;
    
    const query = `
        SELECT h.*, 
               u.nombre as veterinario_nombre,
               m.nombre as mascota_nombre,
               p.nombre as propietario_nombre
        FROM historial_clinico h
        JOIN usuarios u ON h.id_veterinario = u.id
        JOIN mascotas m ON h.id_mascota = m.id
        JOIN usuarios p ON m.id_propietario = p.id
        WHERE h.id = ?
    `;
    
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener consulta:', err);
            return res.status(500).json({ success: false, error: 'Error al obtener consulta' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, error: 'Consulta no encontrada' });
        }
        
        // Obtener medicamentos de esta consulta
        db.query('SELECT * FROM medicamentos WHERE id_historial = ?', [id], (err2, meds) => {
            if (err2) {
                console.error('Error al obtener medicamentos:', err2);
                return res.json({ success: true, consulta: results[0], medicamentos: [] });
            }
            
            res.json({ 
                success: true, 
                consulta: results[0], 
                medicamentos: meds 
            });
        });
    });
});

// Crear nueva entrada en historial
app.post('/api/historial', [
    body('fecha').isDate().withMessage('Fecha inválida'),
    body('motivo_consulta').trim().notEmpty().withMessage('El motivo es requerido').escape(),
    body('diagnostico').trim().notEmpty().withMessage('El diagnóstico es requerido').escape(),
    body('tratamiento').trim().notEmpty().withMessage('El tratamiento es requerido').escape(),
    body('id_mascota').isInt().withMessage('ID de mascota inválido'),
    body('id_veterinario').isInt().withMessage('ID de veterinario inválido')
], validateRequest, (req, res) => {
    const { 
        fecha, motivo_consulta, sintomas, diagnostico, tratamiento, 
        recomendaciones, peso, temperatura, id_mascota, id_veterinario, proxima_cita,
        medicamentos 
    } = req.body;
    
    // Insertar historial
    const insertQuery = `
        INSERT INTO historial_clinico 
        (fecha, motivo_consulta, sintomas, diagnostico, tratamiento, recomendaciones, 
         peso, temperatura, id_mascota, id_veterinario, proxima_cita)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(insertQuery, [
        fecha, motivo_consulta, sintomas || null, diagnostico, tratamiento, 
        recomendaciones || null, peso || null, temperatura || null, 
        id_mascota, id_veterinario, proxima_cita || null
    ], (err, result) => {
        if (err) {
            console.error('Error al guardar historial:', err);
            return res.status(500).json({ success: false, error: 'Error al guardar historial' });
        }
        
        const historialId = result.insertId;
        
        // Si hay medicamentos, guardarlos
        if (medicamentos && medicamentos.length > 0) {
            const medQueries = medicamentos.map(med => {
                return new Promise((resolve, reject) => {
                    db.query(
                        'INSERT INTO medicamentos (nombre, dosis, frecuencia, duracion, id_historial) VALUES (?, ?, ?, ?, ?)',
                        [med.nombre, med.dosis, med.frecuencia, med.duracion || null, historialId],
                        (err) => err ? reject(err) : resolve()
                    );
                });
            });
            
            Promise.all(medQueries)
                .then(() => {
                    res.json({ success: true, message: 'Historial guardado', id: historialId });
                })
                .catch(err => {
                    console.error('Error al guardar medicamentos:', err);
                    res.json({ success: true, message: 'Historial guardado (sin medicamentos)', id: historialId });
                });
        } else {
            res.json({ success: true, message: 'Historial guardado', id: historialId });
        }
    });
});

// Obtener vacunas de una mascota
app.get('/api/vacunas/mascota/:idMascota', (req, res) => {
    const idMascota = req.params.idMascota;
    
    const query = `
        SELECT v.*, u.nombre as veterinario_nombre
        FROM vacunas v
        JOIN usuarios u ON v.id_veterinario = u.id
        WHERE v.id_mascota = ?
        ORDER BY v.fecha_aplicacion DESC
    `;
    
    db.query(query, [idMascota], (err, results) => {
        if (err) {
            console.error('Error al obtener vacunas:', err);
            return res.status(500).json({ success: false, error: 'Error al obtener vacunas' });
        }
        res.json({ success: true, vacunas: results });
    });
});

// Registrar nueva vacuna
app.post('/api/vacunas', [
    body('nombre').trim().notEmpty().withMessage('Nombre de vacuna requerido'),
    body('fecha_aplicacion').isDate(),
    body('id_mascota').isInt(),
    body('id_veterinario').isInt()
], validateRequest, (req, res) => {
    const { nombre, fecha_aplicacion, fecha_proxima, lote, id_mascota, id_veterinario } = req.body;
    
    db.query(
        'INSERT INTO vacunas (nombre, fecha_aplicacion, fecha_proxima, lote, id_mascota, id_veterinario) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, fecha_aplicacion, fecha_proxima || null, lote || null, id_mascota, id_veterinario],
        (err, result) => {
            if (err) {
                console.error('Error al registrar vacuna:', err);
                return res.status(500).json({ success: false, error: 'Error al registrar vacuna' });
            }
            res.json({ success: true, message: 'Vacuna registrada', id: result.insertId });
        }
    );
});

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
            'GET /api/mascotas/propietario/:id',
            'GET /api/veterinarios',
            'GET /api/citas',
            'GET /api/citas/:id',
            'POST /api/citas',
            'POST /api/citas/verificar-disponibilidad',
            'DELETE /api/citas/:id'
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
    console.log('🚀 SERVIDOR INICIADO CORRECTAMENTE');
    console.log('='.repeat(60));
    console.log(`🌐 http://localhost:${PORT}`);
    console.log('✅ Rutas disponibles:');
    console.log('   • POST /api/registrar/propietario');
    console.log('   • POST /api/registrar/recepcionista');
    console.log('   • POST /api/registrar/veterinario');
    console.log('   • POST /api/login');
    console.log('   • GET /api/mascotas/propietario/:id');
    console.log('   • GET /api/veterinarios');
    console.log('   • GET /api/citas');
    console.log('   • POST /api/citas');
    console.log('   • DELETE /api/citas/:id');
    console.log('='.repeat(60));
});