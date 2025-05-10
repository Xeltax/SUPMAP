const { validationResult } = require('express-validator');
const User = require('../models/userModel');
const { generateToken } = require('../utils/jwtUtils');
const crypto = require('crypto');

/**
 * Inscription d'un nouvel utilisateur
 * @route POST /api/auth/register
 */
exports.register = async (req, res, next) => {
    try {
        // Vérifier les erreurs de validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                errors: errors.array()
            });
        }

        const { username, email, password } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(409).json({
                status: 'error',
                message: existingUser.email === email ? 'Email déjà utilisé' : 'Nom d\'utilisateur déjà utilisé'
            });
        }

        // Créer un nouveau utilisateur
        const user = await User.create({
            username,
            email,
            password,
            emailVerificationToken: crypto.randomBytes(32).toString('hex')
        });

        // Générer un token JWT
        const token = generateToken(user);

        // Répondre avec les données utilisateur (sans informations sensibles) et le token
        res.status(201).json({
            status: 'success',
            data: {
                user: user.toPublicJSON(),
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Connexion d'un utilisateur existant
 * @route POST /api/auth/login
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Vérifier si l'email et le mot de passe sont fournis
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Veuillez fournir un email et un mot de passe'
            });
        }

        // Rechercher l'utilisateur et inclure explicitement le mot de passe pour la comparaison
        const user = await User.findOne({ email }).select('+password');

        // Vérifier si l'utilisateur existe et si le mot de passe est correct
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                status: 'error',
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Vérifier si l'utilisateur est actif
        if (!user.active) {
            return res.status(401).json({
                status: 'error',
                message: 'Votre compte a été désactivé'
            });
        }

        // Générer un token JWT
        const token = generateToken(user);

        // Répondre avec les données utilisateur et le token
        res.status(200).json({
            status: 'success',
            data: {
                user: user.toPublicJSON(),
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obtenir le profil de l'utilisateur connecté
 * @route GET /api/auth/me
 */
exports.getMe = async (req, res, next) => {
    try {
        // req.user est défini par le middleware protect
        res.status(200).json({
            status: 'success',
            data: {
                user: req.user.toPublicJSON()
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mettre à jour le profil de l'utilisateur
 * @route PATCH /api/auth/me
 */
exports.updateMe = async (req, res, next) => {
    try {
        const { username, email } = req.body;

        // Vérifier les erreurs de validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                errors: errors.array()
            });
        }

        // Vérifier si le nom d'utilisateur ou l'email est déjà utilisé
        if (username || email) {
            const existingUser = await User.findOne({
                $or: [
                    { username, _id: { $ne: req.user._id } },
                    { email, _id: { $ne: req.user._id } }
                ].filter(criteria => Object.keys(criteria).length > 1) // Filtrer les critères vides
            });

            if (existingUser) {
                return res.status(409).json({
                    status: 'error',
                    message: existingUser.email === email ? 'Email déjà utilisé' : 'Nom d\'utilisateur déjà utilisé'
                });
            }
        }

        // Mettre à jour l'utilisateur
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                username: username || req.user.username,
                email: email || req.user.email,
                // Ajouter d'autres champs si nécessaire (sauf le mot de passe)
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            status: 'success',
            data: {
                user: updatedUser.toPublicJSON()
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mettre à jour le mot de passe de l'utilisateur
 * @route PATCH /api/auth/password
 */
exports.updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Vérifier si les mots de passe sont fournis
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                status: 'error',
                message: 'Veuillez fournir le mot de passe actuel et le nouveau mot de passe'
            });
        }

        // Vérifier que le nouveau mot de passe est assez long
        if (newPassword.length < 8) {
            return res.status(400).json({
                status: 'error',
                message: 'Le nouveau mot de passe doit contenir au moins 8 caractères'
            });
        }

        // Récupérer l'utilisateur avec le mot de passe
        const user = await User.findById(req.user._id).select('+password');

        // Vérifier si le mot de passe actuel est correct
        if (!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({
                status: 'error',
                message: 'Mot de passe actuel incorrect'
            });
        }

        // Mettre à jour le mot de passe
        user.password = newPassword;
        await user.save();

        // Générer un nouveau token JWT
        const token = generateToken(user);

        res.status(200).json({
            status: 'success',
            data: {
                user: user.toPublicJSON(),
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Déconnecter l'utilisateur
 * @route POST /api/auth/logout
 * Note: La déconnexion côté serveur est minimale avec JWT car les tokens sont stockés côté client
 */
exports.logout = (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Déconnexion réussie'
    });
};

/**
 * Récupérer tous les utilisateurs pour l'administration
 * @route GET /api/auth/getAll
 * Note: Cette route est protégée par le middleware d'authentification et doit être accessible uniquement aux administrateurs
 */
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password'); // Exclure le mot de passe

        res.status(200).json({
            status: 'success',
            data: {
                users
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Modifier un utilisateur par l'administrateur
 * @route PATCH /api/auth/users/:id
 * Note: Cette route est protégée par le middleware d'authentification et doit être accessible uniquement aux administrateurs
 */

exports.updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { username, email, role, active } = req.body;

        // Vérifier les erreurs de validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                errors: errors.array()
            });
        }

        // Vérifier si l'utilisateur existe
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Utilisateur non trouvé'
            });
        }

        // Mettre à jour l'utilisateur
        user.username = username || user.username;
        user.email = email || user.email;
        user.role = role || user.role;
        user.active = active !== undefined ? active : user.active;

        await user.save();

        res.status(200).json({
            status: 'success',
            data: {
                user: user.toPublicJSON()
            }
        });
    } catch (error) {
        next(error);
    }
}


/**
 * Supprime un utilisateur par l'administrateur
 * @route DELETE /api/auth/users/:id
 * Note: Cette route est protégée par le middleware d'authentification et doit être accessible uniquement aux administrateurs
 */

exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Vérifier si l'utilisateur existe
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Utilisateur non trouvé'
            });
        }

        // Supprimer l'utilisateur
        await user.deleteOne();

        res.status(204).json({
            status: 'success',
            message: 'Utilisateur supprimé avec succès'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Callback pour l'authentification OAuth Google
 * @route GET /api/auth/google/callback
 */
exports.googleCallback = (req, res) => {
    // Générer un token JWT pour l'utilisateur OAuth
    const token = generateToken(req.user);

    // Rediriger vers le frontend avec le token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/oauth-callback?token=${token}`);
};