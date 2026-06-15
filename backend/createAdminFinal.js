const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Définir le schéma manuellement sans le middleware de hash
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'super_admin', 'institution', 'verifier', 'student'],
    default: 'student'
  },
  profile: {
    firstName: String,
    lastName: String,
    institutionName: String,
    studentId: String,
    department: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ajouter manuellement la méthode comparePassword
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

mongoose.connect('mongodb://localhost:27017/diplomes_blockchain')
  .then(async () => {
    console.log('Connecté à MongoDB');
    
    try {
      // Supprimer anciens comptes admin
      await User.deleteMany({ role: 'admin' });
      console.log('Anciens admins supprimés');
      
      // Créer un admin avec mot de passe hashé
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
      
      // Test de connexion
      const testAdmin = await User.findOne({ email: 'admin@exemple.com' });
      const isMatch = await testAdmin.comparePassword('admin123');
      console.log('Test de connexion:', isMatch ? 'SUCCÈS' : 'ÉCHEC');
      
    } catch (error) {
      console.error('Erreur:', error);
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Erreur de connexion:', err);
  });
