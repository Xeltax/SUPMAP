const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Le nom d\'utilisateur est requis'],
            unique: true,
            trim: true
        },
        email: {
            type: String,
            required: [true, 'L\'email est requis'],
            unique: true,
            lowercase: true,
            trim: true,
            validate: {
                validator: function(v) {
                    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
                },
                message: props => `${props.value} n'est pas une adresse email valide!`
            }
        },
        password: {
            type: String,
            required: [function() {
                // Le mot de passe est requis sauf si le compte utilise OAuth
                return !this.oauthProvider;
            }, 'Le mot de passe est requis'],
            minlength: 8,
            select: false // Ne pas inclure par défaut dans les requêtes
        },
        oauthProvider: {
            type: String,
            enum: ['google', null],
            default: null
        },
        oauthId: {
            type: String,
            sparse: true // Permet null mais unique si présent
        },
        role: {
            type: String,
            enum: ['user', 'moderator', 'admin'],
            default: 'user'
        },
        profilePicture: {
            type: String,
            default: 'default.jpg'
        },
        active: {
            type: Boolean,
            default: true
        },
        passwordResetToken: String,
        passwordResetExpires: Date,
        emailVerificationToken: String,
        emailVerified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Middleware de chiffrement du mot de passe avant la sauvegarde
userSchema.pre('save', async function(next) {
    // Ne pas hacher à nouveau le mot de passe s'il n'a pas été modifié
    if (!this.isModified('password')) return next();

    try {
        // Générer un salt avec un facteur de coût de 12
        const salt = await bcrypt.genSalt(12);
        // Hacher le mot de passe avec le salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour ne pas renvoyer les informations sensibles
userSchema.methods.toPublicJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.passwordResetToken;
    delete userObject.passwordResetExpires;
    delete userObject.emailVerificationToken;
    return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;