const express = require('express');
const path = require('path');

const router = express.Router();

const frontend = path.join(__dirname, '../../frontend/pages');


// Customer pages


router.get('/', (req, res) => {
    res.sendFile(path.join(frontend, 'index.html'));
});

router.get('/login', (req, res) => {
    res.sendFile(path.join(frontend, 'login.html'));
});

router.get('/products', (req, res) => {
    res.sendFile(path.join(frontend, 'products.html'));
});

router.get('/products/:id', (req, res) => {
    res.sendFile(path.join(frontend, 'product-detail.html'));
});

router.get('/cart', (req, res) => {
    res.sendFile(path.join(frontend, 'cart.html'));
});

router.get('/notifications', (req, res) => {
    res.sendFile(path.join(frontend, 'notifications.html'));
});



// Admin pages


router.get('/admin/login', (req, res) => {
    res.sendFile(path.join(frontend, 'admin-login.html'));
});

router.get('/admin/products', (req, res) => {
    res.sendFile(path.join(frontend, 'admin-products.html'));
});

router.get('/admin/orders', (req, res) => {
    res.sendFile(path.join(frontend, 'admin-orders.html'));
});

router.get('/admin/reports', (req, res) => {
    res.sendFile(path.join(frontend, 'admin-reports.html'));
});

router.get('/admin/staff', (req, res) => {
    res.sendFile(path.join(frontend, 'admin-staff.html'));
});

router.get('/admin/suppliers', (req, res) => {
    res.sendFile(path.join(frontend, 'admin-suppliers.html'));
});

router.get('/admin/customers', (req, res) => {
    res.sendFile(path.join(frontend, 'admin-customers.html'));
});

router.get('/admin/brands', (req, res) => {
    res.sendFile(path.join(frontend, 'admin-brands.html'));
});

router.get('/admin/categories', (req, res) => {
    res.sendFile(path.join(frontend, 'admin-categories.html'));
});


module.exports = router;