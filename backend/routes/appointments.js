// backend/routes/appointments.js
const express = require('express');
const router = express.Router();

// Ruta de prueba
router.get('/', (req, res) => {
    res.json({ message: '✅ Ruta de citas funcionando' });
});

// Citas de hoy (simuladas)
router.get('/hoy', (req, res) => {
    res.json([
        { id: 1, hora: '10:00', propietario: 'Carlos Martínez', mascota: 'Max', motivo: 'Control anual' },
        { id: 2, hora: '14:30', propietario: 'Ana Gómez', mascota: 'Luna', motivo: 'Vacunación' }
    ]);
});

// Citas pendientes (simuladas)
router.get('/pendientes', (req, res) => {
    res.json([
        { id: 3, fecha: '2025-05-16', propietario: 'Juan Pérez', mascota: 'Rocky', motivo: 'Consulta dermatológica' }
    ]);
});

module.exports = router;