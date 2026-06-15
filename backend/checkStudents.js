const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/diplomes_blockchain')
  .then(async () => {
    console.log('Connecté à MongoDB');
    
    // Chercher les étudiants
    const students = await User.find({ role: 'student' });
    console.log('Étudiants trouvés:', students.length);
    
    students.forEach(student => {
      console.log('Email:', student.email, 'Role:', student.role, 'Actif:', student.isActive);
    });
    
    // Chercher tous les utilisateurs
    const allUsers = await User.find({});
    console.log('\nTous les utilisateurs:');
    allUsers.forEach(user => {
      console.log('Email:', user.email, 'Role:', user.role, 'Actif:', user.isActive);
    });
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Erreur de connexion:', err);
  });
