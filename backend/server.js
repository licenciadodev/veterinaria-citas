// backend/server.js
const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: 'http://127.0.0.1:5500', // Live Server por defecto
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesión
app.use(session({
    secret: process.env.SESSION_SECRET || 'tu_clave_secreta_aqui_123',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Simulación de base de datos en memoria (solo para pruebas iniciales)
const usuarios = [
    {
        id: 1,
        nombres: 'Carlos',
        apellidos: 'Martínez',
        usuario: 'carlos',
        contraseña: '$2a$10$N9qo8uLOickgx2ZMRZoMy.hG3uYp7G5M8u9qRqJhZwXkLZ5XpXu6u', // hash de "12345678"
        rol: 'propietario'
    },
    {
        id: 2,
        nombres: 'Ana',
        apellidos: 'Rodríguez',
        usuario: 'ana_vet',
        contraseña: '$2a$10$N9qo8uLOickgx2ZMRZoMy.hG3uYp7G5M8u9qRqJhZwXkLZ5XpXu6u',
        rol: 'veterinario'
    },
    {
        id: 3,
        nombres: 'Sofía',
        apellidos: 'López',
        usuario: 'sofia_rec',
        contraseña: '$2a$10$N9qo8uLOickgx2ZMRZoMy.hG3uYp7G5M8u9qRqJhZwXkLZ5XpXu6u',
        rol: 'recepcionista'
    }
];

// Rutas de autenticación (única ruta necesaria por ahora)
app.post('/api/auth/login', async (req, res) => {
    const { username, password, role } = req.body;

    // Validación básica
    if (!username || !password || !role) {
        return res.status(400).json({ 
            success: false, 
            message: 'Faltan datos: username, password y role son requeridos' 
        });
    }

    // Buscar usuario
    const usuario = usuarios.find(
        u => u.usuario === username && u.rol === role
    );

    if (!usuario) {
        return res.status(401).json({ 
            success: false, 
            message: 'Credenciales incorrectas' 
        });
    }

    // Simular verificación de contraseña con bcrypt
    const bcrypt = require('bcrypt');
    const passwordMatch = await bcrypt.compare(password, usuario.contraseña);
    
    if (!passwordMatch) {
        return res.status(401).json({ 
            success: false, 
            message: 'Credenciales incorrectas' 
        });
    }

    // Crear sesión
    req.session.user = {
        id: usuario.id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        usuario: usuario.usuario,
        rol: usuario.rol
    };

    // Determinar redirección RELATIVA (¡clave para evitar el error 404!)
    let redirectPage = '';
    switch(role) {
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
            return res.status(400).json({ success: false, message: 'Rol no válido' });
    }

    res.json({ 
        success: true, 
        user: {
            id: usuario.id,
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            usuario: usuario.usuario,
            rol: usuario.rol
        },
        redirect: redirectPage
    });
});

// Ruta de prueba del backend
app.get('/', (req, res) => {
    res.json({ 
        message: '✅ Backend de LaMascotApp funcionando',
        endpoints: [
            'POST /api/auth/login'
        ]
    });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`✅ Abre tu frontend en: http://127.0.0.1:5500/html-acceso/inicio-sesion.html`);
});