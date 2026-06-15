const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/diplomes_blockchain')
  .then(async () => {
    console.log('Connecté à MongoDB');
    
    try {
      // Supprimer et recréer le vérificateur
      await User.deleteOne({ email: 'verifier@exemple.com' });
      
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
      console.log('✅ Compte vérificateur réinitialisé!');
      
      // Test
      const testVerifier = await User.findOne({ email: 'verifier@exemple.com' });
      const isMatch = await bcrypt.compare('verifier123', testVerifier.password);
      console.log('Test mot de passe:', isMatch ? 'OK' : 'KO');
      
    } catch (error) {
      console.error('Erreur:', error);
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Erreur de connexion:', err);
  });
