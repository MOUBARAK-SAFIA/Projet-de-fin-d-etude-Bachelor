const Diploma = require('../models/Diploma');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Verification = require('../models/Verification');
const { generateDiplomaHash, verifyDiplomaHash } = require('../services/hashService');
const blockchainService = require('../services/blockchainService');
const validator = require('validator');
const { v4: uuidv4 } = require('uuid');

/**
 * Créer un nouveau diplôme
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createDiploma = async (req, res) => {
  try {
    const {
      studentName,
      studentId,
      degree,
      institution,
      graduationDate,
      grade
    } = req.body;

    // Validation des inputs
    const requiredFields = ['studentName', 'studentId', 'degree', 'institution', 'graduationDate', 'grade'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Champs obligatoires manquants: ${missingFields.join(', ')}`
      });
    }

    // Validation des formats
    if (!validator.isAlpha(studentName.replace(/\s/g, ''), 'fr-FR', { ignore: ' -' })) {
      return res.status(400).json({
        success: false,
        message: 'Nom de l\'étudiant invalide.'
      });
    }

    if (!validator.isDate(graduationDate)) {
      return res.status(400).json({
        success: false,
        message: 'Date d\'obtention invalide.'
      });
    }

    // Vérifier si le studentId existe déjà
    const existingDiploma = await Diploma.findOne({ studentId });
    if (existingDiploma) {
      return res.status(400).json({
        success: false,
        message: 'Un diplôme avec ce code de l\'étudiant existe déjà.'
      });
    }

    // Générer un ID unique pour le diplôme
    const diplomaId = uuidv4();

    // Générer le hash SHA-256
    const hash = generateDiplomaHash({
      studentName,
      studentId,
      degree,
      institution,
      graduationDate,
      grade
    });

    // Enregistrer sur la blockchain
    const blockchainResult = await blockchainService.registerDiploma(diplomaId, hash);

    // Créer le diplôme dans MongoDB
    const diploma = new Diploma({
      studentName,
      studentId,
      degree,
      institution,
      graduationDate: new Date(graduationDate),
      grade,
      hash,
      txHash: blockchainResult.txHash,
      blockNumber: blockchainResult.blockNumber
    });

    await diploma.save();

    res.status(201).json({
      success: true,
      data: {
        ...diploma.toObject(),
        diplomaId // Ajouter l'ID unique pour le QR code
      }
    });

  } catch (error) {
    console.error('Erreur createDiploma:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du diplôme.'
    });
  }
};

/**
 * Lister tous les diplômes
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const listDiplomas = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, year, filiere } = req.query;
    const query = {};

    if (status === 'valid') {
      query.isRevoked = false;
    } else if (status === 'revoked') {
      query.isRevoked = true;
    }

    if (filiere && filiere !== 'all') {
      query.degree = { $regex: new RegExp(filiere, 'i') };
    }

    if (year && /^\d{4}$/.test(String(year))) {
      const y = parseInt(year, 10);
      query.graduationDate = {
        $gte: new Date(`${y}-01-01`),
        $lte: new Date(`${y}-12-31T23:59:59.999Z`),
      };
    }

    // Recherche par nom, code de l'étudiant ou filière/diplôme
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { degree: { $regex: search, $options: 'i' } }
      ];
    }

    const diplomas = await Diploma.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Diploma.countDocuments(query);

    res.json({
      success: true,
      data: {
        diplomas,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalDiplomas: total
        }
      }
    });

  } catch (error) {
    console.error('Erreur listDiplomas:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des diplômes.'
    });
  }
};

/**
 * Obtenir les détails d'un diplôme
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getDiplomaById = async (req, res) => {
  try {
    const { id } = req.params;

    let diploma;
    if (validator.isMongoId(id)) {
      diploma = await Diploma.findById(id);
    }
    
    if (!diploma) {
      diploma = await Diploma.findOne({ studentId: id });
    }
    
    if (!diploma) {
      return res.status(404).json({
        success: false,
        message: 'Diplôme non trouvé.'
      });
    }

    res.json({
      success: true,
      data: diploma
    });

  } catch (error) {
    console.error('Erreur getDiplomaById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du diplôme.'
    });
  }
};

/**
 * Vérifier un diplôme (public)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const verifyDiploma = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer le diplôme dans MongoDB (soit par _id, soit par studentId)
    let diploma;
    if (validator.isMongoId(id)) {
      diploma = await Diploma.findById(id);
    }
    
    if (!diploma) {
      diploma = await Diploma.findOne({ studentId: id });
    }
    
    if (!diploma) {
      return res.status(404).json({
        success: false,
        message: 'Diplôme non trouvé.'
      });
    }

    // Vérifier sur la blockchain (si indisponible, ne pas faire échouer la vérification)
    let isValid = false;
    let blockchainAvailable = true;
    try {
      isValid = await blockchainService.verifyDiploma(id, diploma.hash);
    } catch (e) {
      blockchainAvailable = false;
      // Mode dégradé: on ne bloque pas l'utilisateur. Si le diplôme n'est pas révoqué,
      // on considère la vérification "valide" côté base de données.
      isValid = !diploma.isRevoked;
    }

    // Préparer la réponse
    const verificationResult = {
      diploma: diploma,
      isValid: isValid,
      status: diploma.isRevoked ? 'revoked' : (isValid ? 'valid' : 'invalid'),
      verificationDate: new Date(),
      blockchainAvailable
    };

    // Si la vérification est faite par un vérificateur connecté,
    // notifier les admins/super-admin et enregistrer l'historique de vérification.
    if (req.user?.role === 'verifier') {
      const verifierName =
        [req.user.profile?.firstName, req.user.profile?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim() || req.user.email;

      // --- Enregistrer l'historique de vérification ---
      await Verification.create({
        verifierId: req.user._id,
        diplomaId: diploma._id,
        studentId: diploma.studentId,
        isValid: verificationResult.status === 'valid',
        isRevoked: verificationResult.status === 'revoked'
      });
      // ------------------------------------------------

      const adminUsers = await User.find(
        { role: { $in: ['admin', 'super_admin'] }, isActive: true },
        { _id: 1 }
      );

      if (adminUsers.length > 0) {
        const notificationDocs = adminUsers.map((admin) => ({
          recipient: admin._id,
          type: 'diploma_verified',
          title: 'Diplôme vérifié',
          message: `${verifierName} a vérifié le diplôme ${diploma.studentId} (${diploma.studentName}).`,
          metadata: {
            diplomaId: diploma._id,
            verifierId: req.user._id,
            verifierName,
            studentName: diploma.studentName,
            studentId: diploma.studentId,
            status: verificationResult.status,
          },
        }));

        await Notification.insertMany(notificationDocs);
      }
    }

    res.json({
      success: true,
      data: verificationResult
    });

  } catch (error) {
    console.error('Erreur verifyDiploma:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification du diplôme.'
    });
  }
};

/**
 * Révoquer un diplôme
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const revokeDiploma = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validator.isMongoId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de diplôme invalide.'
      });
    }

    const diploma = await Diploma.findById(id);
    
    if (!diploma) {
      return res.status(404).json({
        success: false,
        message: 'Diplôme non trouvé.'
      });
    }

    if (diploma.isRevoked) {
      return res.status(400).json({
        success: false,
        message: 'Ce diplôme est déjà révoqué.'
      });
    }

    // Révoquer sur la blockchain
    await blockchainService.revokeDiploma(id);

    // Mettre à jour dans MongoDB
    diploma.isRevoked = true;
    await diploma.save();

    res.json({
      success: true,
      data: {
        message: 'Diplôme révoqué avec succès.',
        diploma
      }
    });

  } catch (error) {
    console.error('Erreur revokeDiploma:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la révocation du diplôme.'
    });
  }
};

module.exports = {
  createDiploma,
  listDiplomas,
  getDiplomaById,
  verifyDiploma,
  revokeDiploma
};
