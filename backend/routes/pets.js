// backend/routes/pets.js
const express = require('express');
const router = express.Router();

// Ruta de prueba
router.get('/', (req, res) => {
    res.json({ message: '✅ Ruta de mascotas funcionando' });
});

// Ruta para obtener mascotas (simulada)
router.get('/mascota/:id', (req, res) => {
    const { id } = req.params;
    res.json({
        id: parseInt(id),
        nombre: 'Max',
        especie: 'perro',
        raza: 'Labrador',
        edad: 3.5,
        propietario: {
            id: 2,
            nombres: 'Carlos',
            apellidos: 'Martínez'
        }
    });
});

module.exports = router;