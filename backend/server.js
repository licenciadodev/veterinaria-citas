// backend/server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5500', 'http://localhost:3000'],  // Ambos puertos
    credentials: true
}));
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Conexión a MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'veterinaria_db'
});

// Conectar a MySQL
db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a MySQL:', err);
        return;
    }
    console.log('✅ Conectado a MySQL - Base de datos: veterinaria_db');
});

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado' });
    }
    
    jwt.verify(token, 'secreto_veterinaria', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// =============== RUTAS PÚBLICAS ===============

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'Servidor de veterinaria funcionando',
        timestamp: new Date().toISOString()
    });
});

// Registro de usuario
app.post('/api/usuarios/registro', async (req, res) => {
    try {
        const { nombre, email, password, telefono } = req.body;
        
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
        }
        
        db.query('SELECT id FROM usuarios WHERE email = ?', [email], (err, results) => {
            if (err) {
                console.error('Error verificando email:', err);
                return res.status(500).json({ error: 'Error del servidor' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }
            
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    console.error('Error hashing password:', err);
                    return res.status(500).json({ error: 'Error del servidor' });
                }
                
                const nuevoUsuario = {
                    nombre,
                    email,
                    password: hashedPassword,
                    telefono: telefono || null,
                    rol: 'propietario'
                };
                
                db.query('INSERT INTO usuarios SET ?', nuevoUsuario, (err, result) => {
                    if (err) {
                        console.error('Error insertando usuario:', err);
                        return res.status(500).json({ error: 'Error del servidor' });
                    }
                    
                    const token = jwt.sign(
                        { id: result.insertId, email, rol: 'propietario' },
                        'secreto_veterinaria',
                        { expiresIn: '24h' }
                    );
                    
                    res.status(201).json({
                        message: 'Usuario registrado exitosamente',
                        token,
                        user: {
                            id: result.insertId,
                            nombre,
                            email,
                            telefono: telefono || '',
                            rol: 'propietario'
                        }
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Login de usuario
app.post('/api/usuarios/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }
    
    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Error en login:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        
        const user = results[0];
        
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparando contraseñas:', err);
                return res.status(500).json({ error: 'Error del servidor' });
            }
            
            if (!isMatch) {
                return res.status(401).json({ error: 'Credenciales incorrectas' });
            }
            
            const token = jwt.sign(
                { id: user.id, email: user.email, rol: user.rol },
                'secreto_veterinaria',
                { expiresIn: '24h' }
            );
            
            delete user.password;
            
            res.json({
                message: 'Login exitoso',
                token,
                user
            });
        });
    });
});

// =============== RUTAS PROTEGIDAS ===============

// Obtener mascotas de un usuario
app.get('/api/mascotas', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    db.query('SELECT * FROM mascotas WHERE id_propietario = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error obteniendo mascotas:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        res.json(results);
    });
});

// Crear nueva mascota
app.post('/api/mascotas', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { nombre, especie, raza, edad, peso } = req.body;
    
    if (!nombre || !especie) {
        return res.status(400).json({ error: 'Nombre y especie son obligatorios' });
    }
    
    const nuevaMascota = {
        nombre,
        especie,
        raza: raza || null,
        edad: edad || null,
        peso: peso || null,
        id_propietario: userId
    };
    
    db.query('INSERT INTO mascotas SET ?', nuevaMascota, (err, result) => {
        if (err) {
            console.error('Error creando mascota:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        
        res.status(201).json({
            message: 'Mascota creada exitosamente',
            mascotaId: result.insertId
        });
    });
});

// Obtener citas
app.get('/api/citas', authenticateToken, (req, res) => {
    const userRol = req.user.rol;
    const userId = req.user.id;
    
    let query = '';
    let params = [];
    
    if (userRol === 'propietario') {
        query = `
            SELECT c.*, m.nombre as mascota_nombre, u.nombre as veterinario_nombre
            FROM citas c
            JOIN mascotas m ON c.nombre_mascota = m.nombre
            JOIN usuarios u ON c.id_veterinario = u.id
            WHERE m.id_propietario = ?
            ORDER BY c.fecha DESC, c.hora DESC
        `;
        params = [userId];
    } else if (userRol === 'veterinario') {
        query = 'SELECT * FROM citas WHERE id_veterinario = ? ORDER BY fecha DESC, hora DESC';
        params = [userId];
    } else {
        query = `
            SELECT c.*, u.nombre as veterinario_nombre 
            FROM citas c
            JOIN usuarios u ON c.id_veterinario = u.id
            ORDER BY c.fecha DESC, c.hora DESC
        `;
    }
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error obteniendo citas:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        res.json(results);
    });
});

// Crear nueva cita
app.post('/api/citas', authenticateToken, (req, res) => {
    const { fecha, hora, motivo, nombre_mascota, id_veterinario } = req.body;
    
    if (!fecha || !hora || !motivo || !nombre_mascota || !id_veterinario) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    
    const nuevaCita = {
        fecha,
        hora,
        motivo,
        nombre_mascota,
        id_veterinario,
        estado: 'activa'
    };
    
    db.query('INSERT INTO citas SET ?', nuevaCita, (err, result) => {
        if (err) {
            console.error('Error creando cita:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        
        res.status(201).json({
            message: 'Cita creada exitosamente',
            citaId: result.insertId
        });
    });
});

// Actualizar cita
app.put('/api/citas/:id', authenticateToken, (req, res) => {
    const citaId = req.params.id;
    const { fecha, hora, motivo, nombre_mascota, id_veterinario, estado } = req.body;
    
    const datosActualizados = {
        fecha,
        hora,
        motivo,
        nombre_mascota,
        id_veterinario,
        estado
    };
    
    db.query('UPDATE citas SET ? WHERE id = ?', [datosActualizados, citaId], (err, result) => {
        if (err) {
            console.error('Error actualizando cita:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        
        res.json({ message: 'Cita actualizada exitosamente' });
    });
});

// Eliminar cita
app.delete('/api/citas/:id', authenticateToken, (req, res) => {
    const citaId = req.params.id;
    
    db.query('DELETE FROM citas WHERE id = ?', [citaId], (err, result) => {
        if (err) {
            console.error('Error eliminando cita:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        
        res.json({ message: 'Cita eliminada exitosamente' });
    });
});

// Obtener veterinarios
app.get('/api/veterinarios', authenticateToken, (req, res) => {
    db.query('SELECT id, nombre, email FROM usuarios WHERE rol = "veterinario"', (err, results) => {
        if (err) {
            console.error('Error obteniendo veterinarios:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        res.json(results);
    });
});

// Obtener perfil de usuario
app.get('/api/perfil', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    db.query('SELECT id, nombre, email, telefono, rol FROM usuarios WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error obteniendo perfil:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json(results[0]);
    });
});

// =============== MANEJO DE RUTAS NO ENCONTRADAS ===============

// Para API routes no encontradas
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Ruta API no encontrada' });
});

// Para cualquier otra ruta, servir el frontend
app.use('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Puerto del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📁 Frontend servido desde: ${path.join(__dirname, '../frontend')}`);
    console.log(`🗄️  Base de datos: veterinaria_db`);
    console.log(`🔧 Rutas disponibles:`);
    console.log(`   GET  /api/health`);
    console.log(`   POST /api/usuarios/registro`);
    console.log(`   POST /api/usuarios/login`);
    console.log(`   GET  /api/mascotas (protegida)`);
    console.log(`   POST /api/mascotas (protegida)`);
    console.log(`   GET  /api/citas (protegida)`);
    console.log(`   POST /api/citas (protegida)`);
});