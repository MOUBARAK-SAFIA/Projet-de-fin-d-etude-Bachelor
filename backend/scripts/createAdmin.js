require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const createAdmin = async (email, password) => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('Un administrateur avec cet email existe déjà');
      process.exit(0);
    }

    // Créer l'admin
    const admin = new User({
      email,
      password, // Sera hashé automatiquement par le middleware
      role: 'admin'
    });

    await admin.save();
    console.log(`✅ Administrateur créé: ${email}`);
    console.log('🔑 Mot de passe:', password);
    console.log('🌐 URL de connexion: http://localhost:5173/login');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Récupérer les arguments de la ligne de commande
const args = process.argv.slice(2);
const email = args[0];
const password = args[1];

if (!email || !password) {
  console.log('Usage: node createAdmin.js <email> <password>');
  console.log('Exemple: node createAdmin.js admin@exemple.com password123');
  process.exit(1);
}

createAdmin(email, password);
