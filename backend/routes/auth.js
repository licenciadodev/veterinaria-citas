// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// Simulación de usuarios en base de datos (en producción: consulta a MySQL)
const usuariosSimulados = [
    {
        id: 1,
        nombres: 'Carlos',
        apellidos: 'Martínez',
        usuario: 'carlos',
        contraseña: '$2a$10$N9qo8uLOickgx2ZMRZoMy.hG3uYp7G5M8u9qRqJhZwXkLZ5XpXu6u', // hash de "12345678"
        email: 'carlos@example.com',
        rol: 'propietario'
    },
    {
        id: 2,
        nombres: 'Ana',
        apellidos: 'Rodríguez',
        usuario: 'ana_vet',
        contraseña: '$2a$10$N9qo8uLOickgx2ZMRZoMy.hG3uYp7G5M8u9qRqJhZwXkLZ5XpXu6u',
        email: 'ana.vet@example.com',
        rol: 'veterinario'
    },
    {
        id: 3,
        nombres: 'Sofía',
        apellidos: 'López',
        usuario: 'sofia_rec',
        contraseña: '$2a$10$N9qo8uLOickgx2ZMRZoMy.hG3uYp7G5M8u9qRqJhZwXkLZ5XpXu6u',
        email: 'sofia.rec@example.com',
        rol: 'recepcionista'
    }
];

// Ruta de prueba
router.get('/test', (req, res) => {
    res.json({ message: '✅ Ruta de autenticación funcionando' });
});

// Login
router.post('/login', async (req, res) => {
    const { username, password, role } = req.body;

    // Validaciones básicas
    if (!username || !password || !role) {
        return res.status(400).json({ 
            success: false, 
            message: 'Faltan datos: username, password y role son requeridos' 
        });
    }

    try {
        // Buscar usuario por nombre de usuario y rol
        const usuario = usuariosSimulados.find(
            u => u.usuario === username && u.rol === role
        );

        if (!usuario) {
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciales incorrectas' 
            });
        }

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, usuario.contraseña);
        if (!passwordMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciales incorrectas' 
            });
        }

        // Determinar redirección RELATIVA (¡esta es la corrección clave!)
        let redirectPage = '';
        switch (role) {
            case 'propietario':
                redirectPage = '../html-perfiles/dashboard-propietario.html';
                break;
            case 'recepcionista':
                redirectPage = '../html-perfiles/dashboard-recepcionista.html';
                break;
            case 'veterinario':
                redirectPage = '../html-perfiles/dashboard-veterinario.html';
                break;
            default:
                return res.status(400).json({ 
                    success: false, 
                    message: 'Rol no válido' 
                });
        }

        // Simular creación de sesión
        req.session = req.session || {};
        req.session.user = {
            id: usuario.id,
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            usuario: usuario.usuario,
            rol: usuario.rol
        };

        res.json({ 
            success: true, 
            user: {
                id: usuario.id,
                nombres: usuario.nombres,
                apellidos: usuario.apellidos,
                usuario: usuario.usuario,
                rol: usuario.rol
            },
            redirect: redirectPage  // ← Ruta relativa correcta
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

module.exports = router;