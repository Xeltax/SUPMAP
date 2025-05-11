const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

/**
 * Fonction pour précharger des données utilisateurs dans MongoDB
 */
const seedUsers = async () => {
    try {
        console.log('Vérification des utilisateurs existants...');

        // Vérifie si un admin existe déjà
        const adminExists = await User.findOne({ role: 'admin' });

        if (adminExists) {
            console.log('Un administrateur existe déjà. Seed ignoré.');
            return;
        }

        console.log('Création des utilisateurs de test...');

        await User.create({
            username: 'admin',
            email: 'admin@trafine.fr',
            password: 'password123',
            role: 'admin',
            active: true,
            emailVerified: true
        });

        await User.create({
            username: 'moderateur',
            email: 'moderateur@trafine.fr',
            password: 'password123',
            role: 'moderator',
            active: true,
            emailVerified: true
        });

        await User.create({
            username: 'utilisateur',
            email: 'utilisateur@trafine.fr',
            password: 'password123',
            role: 'user',
            active: true,
            emailVerified: true
        });

        console.log('Utilisateurs de test créés avec succès!');
    } catch (error) {
        console.error('Erreur lors de la création des utilisateurs de test:', error);
    }
};

module.exports = { seedUsers };