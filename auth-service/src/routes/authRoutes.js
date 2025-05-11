const express = require('express');
const { body } = require('express-validator');
const passport = require('passport');
const authController = require('../controllers/authController');
const { protect, restrictTo} = require('../middleware/authMiddleware');

const router = express.Router();

const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 20 caractères')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Veuillez fournir une adresse email valide')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Le mot de passe doit contenir au moins 8 caractères')
        .matches(/\d/)
        .withMessage('Le mot de passe doit contenir au moins un chiffre')
];

const updateProfileValidation = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 20 caractères')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores'),
    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Veuillez fournir une adresse email valide')
        .normalizeEmail()
];

router.post('/register', registerValidation, authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

router.get('/me', protect, authController.getMe);
router.patch('/me', protect, updateProfileValidation, authController.updateMe);
router.patch('/password', protect, authController.updatePassword);

router.get('/users', protect, restrictTo(["admin"]), authController.getAllUsers);
router.get('/users/:id', protect, restrictTo(["admin"]), authController.getUserById);
router.patch('/users/:id', protect, restrictTo(["admin"]), authController.updateUser);
router.delete('/users/:id', protect, restrictTo(["admin"]), authController.deleteUser);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    authController.googleCallback
);

module.exports = router;