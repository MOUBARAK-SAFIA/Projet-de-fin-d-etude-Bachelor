require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const createUsers = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');

    // Supprimer les utilisateurs existants (optionnel)
    // await User.deleteMany({});
    // console.log('Anciens utilisateurs supprimés');

    // Créer un Super Admin
    const superAdminExists = await User.findOne({ email: 'superadmin@exemple.com' });
    if (!superAdminExists) {
      const superAdmin = new User({
        email: 'superadmin@exemple.com',
        password: 'superadmin123',
        role: 'super_admin',
        profile: {
          firstName: 'Super',
          lastName: 'Admin'
        }
      });
      await superAdmin.save();
      console.log('✅ Super Admin créé: superadmin@exemple.com / superadmin123');
    }

    // Créer une Institution
    const institutionExists = await User.findOne({ email: 'institution@exemple.com' });
    if (!institutionExists) {
      const institution = new User({
        email: 'institution@exemple.com',
        password: 'institution123',
        role: 'institution',
        profile: {
          firstName: 'Marie',
          lastName: 'Durand',
          institutionName: 'Université de Technologie',
          department: 'Informatique'
        }
      });
      await institution.save();
      console.log('✅ Institution créée: institution@exemple.com / institution123');
    }

    // Créer un Vérificateur
    const verifierExists = await User.findOne({ email: 'verifier@exemple.com' });
    if (!verifierExists) {
      const verifier = new User({
        email: 'verifier@exemple.com',
        password: 'verifier123',
        role: 'verifier',
        profile: {
          firstName: 'Jean',
          lastName: 'Dupont'
        }
      });
      await verifier.save();
      console.log('✅ Vérificateur créé: verifier@exemple.com / verifier123');
    }

    // Créer un Étudiant
    const studentExists = await User.findOne({ email: 'student@exemple.com' });
    if (!studentExists) {
      const student = new User({
        email: 'student@exemple.com',
        password: 'student123',
        role: 'student',
        profile: {
          firstName: 'Pierre',
          lastName: 'Martin',
          studentId: 'ETU2024001'
        }
      });
      await student.save();
      console.log('✅ Étudiant créé: student@exemple.com / student123');
    }

    console.log('\n🎉 Utilisateurs de test créés avec succès!');
    console.log('\n📋 Liste des comptes:');
    console.log('1. Super Admin: superadmin@exemple.com / superadmin123');
    console.log('2. Institution: institution@exemple.com / institution123');
    console.log('3. Vérificateur: verifier@exemple.com / verifier123');
    console.log('4. Étudiant: student@exemple.com / student123');
    console.log('\n🌐 URL de connexion: http://localhost:5173/login');

  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Récupérer les arguments de la ligne de commande
const args = process.argv.slice(2);
if (args.includes('--force')) {
  console.log('🔄 Mode force: suppression des utilisateurs existants...');
  createUsers();
} else {
  console.log('📝 Création des utilisateurs de test...');
  console.log('Pour supprimer les utilisateurs existants, utilisez: node createUsers.js --force');
  createUsers();
}
