const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/diplomes_blockchain')
  .then(async () => {
    console.log('Connecté à MongoDB');
    
    try {
      // Vérifier si un admin existe déjà
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (existingAdmin) {
        console.log('Un administrateur existe déjà:', existingAdmin.email);
      } else {
        // Créer un compte administrateur par défaut
        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        const admin = new User({
          email: 'admin@exemple.com',
          password: hashedPassword,
          role: 'admin',
          isActive: true,
          firstName: 'Administrateur',
          lastName: 'Système'
        });
        
        await admin.save();
        console.log('Compte administrateur créé avec succès!');
        console.log('Email: admin@exemple.com');
        console.log('Mot de passe: admin123');
      }
      
      // Créer un compte vérificateur par défaut
      const existingVerifier = await User.findOne({ role: 'verifier' });
      if (existingVerifier) {
        console.log('Un vérificateur existe déjà:', existingVerifier.email);
      } else {
        const hashedPassword = await bcrypt.hash('verifier123', 12);
        
        const verifier = new User({
          email: 'verifier@exemple.com',
          password: hashedPassword,
          role: 'verifier',
          isActive: true,
          firstName: 'Vérificateur',
          lastName: 'Système'
        });
        
        await verifier.save();
        console.log('Compte vérificateur créé avec succès!');
        console.log('Email: verifier@exemple.com');
        console.log('Mot de passe: verifier123');
      }
      
    } catch (error) {
      console.error('Erreur lors de la création des comptes:', error);
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Erreur de connexion:', err);
  });
