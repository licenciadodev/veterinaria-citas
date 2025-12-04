// backend/routes/users.js
const express = require('express');
const router = express.Router();

// Ruta de prueba
router.get('/', (req, res) => {
    res.json({ message: '✅ Ruta de usuarios funcionando' });
});

// Usuario logueado (simulado)
router.get('/logueado', (req, res) => {
    // En producción, esto vendría de req.session o JWT
    res.json({
        id: 2,
        nombres: 'Carlos',
        apellidos: 'Martínez',
        usuario: 'carlos',
        role: 'propietario'
    });
});

module.exports = router;