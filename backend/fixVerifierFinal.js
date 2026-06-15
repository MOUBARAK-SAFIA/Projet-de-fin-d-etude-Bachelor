const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schéma sans middleware
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'super_admin', 'institution', 'verifier', 'student'], default: 'student' },
  profile: { firstName: String, lastName: String, institutionName: String, studentId: String, department: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

mongoose.connect('mongodb://localhost:27017/diplomes_blockchain')
  .then(async () => {
    console.log('Connecté à MongoDB');
    
    try {
      await User.deleteMany({ role: 'verifier' });
      
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
      console.log('✅ Vérificateur créé avec succès!');
      
      const testVerifier = await User.findOne({ email: 'verifier@exemple.com' });
      const isMatch = await testVerifier.comparePassword('verifier123');
      console.log('Test mot de passe:', isMatch ? 'OK' : 'KO');
      
    } catch (error) {
      console.error('Erreur:', error);
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Erreur de connexion:', err);
  });
