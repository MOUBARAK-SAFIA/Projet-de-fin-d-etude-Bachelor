const Notification = require('../models/Notification');

/**
 * GET /api/notifications
 * Récupérer les notifications de l'utilisateur connecté.
 */
const listNotifications = async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(limit),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Erreur listNotifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des notifications.',
    });
  }
};

/**
 * PUT /api/notifications/read-all
 * Marquer toutes les notifications de l'utilisateur comme lues.
 */
const markAllAsRead = async (req, res) => {
  try {
    const { _id: userId } = req.user;
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return res.json({
      success: true,
      data: { message: 'Notifications marquées comme lues.' },
    });
  } catch (error) {
    console.error('Erreur markAllAsRead:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour des notifications.',
    });
  }
};

module.exports = {
  listNotifications,
  markAllAsRead,
};
