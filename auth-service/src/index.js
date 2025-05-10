require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');

const authRoutes = require('./routes/authRoutes');
const { setupPassport } = require('./utils/passportConfig');
const {seedUsers} = require("./utils/seedData");

// Initialiser l'application Express
const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Configuration de Passport.js
app.use(passport.initialize());
setupPassport(passport);

// Routes
app.use('/api/auth', authRoutes);

// Route de test
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Auth services is running' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: err.message
    });
});

console.log(process.env.MONGO_URI)

// Connexion à MongoDB
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(async () => {
        console.log('Connecté à MongoDB');

        await seedUsers();
        // Démarrer le serveur après la connexion à la base de données
        app.listen(PORT, () => {
            console.log(`Auth service running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Erreur de connexion à MongoDB:', err);
        process.exit(1);
    });

// Gestion de l'arrêt propre du serveur
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Connexion à MongoDB fermée');
    process.exit(0);
});