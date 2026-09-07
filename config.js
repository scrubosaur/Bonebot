module.exports = {
  // Ces valeurs sont lues depuis les variables d'environnement,
  // définies sur Koyeb (ou en local dans un fichier .env, jamais commité).
  token: process.env.DISCORD_TOKEN,
  mongoUri: process.env.MONGO_URI,

  // ID du rôle attribué automatiquement à l'arrivée d'un membre
  welcomeRoleId: 'ID_DU_ROLE_DE_BIENVENUE',

  // Affiche un message dans le salon quand un utilisateur monte de rôle
  announceInChannel: true,

  // Paliers de progression : à chaque seuil de messages, l'utilisateur
  // reçoit un nouveau rôle (et perd optionnellement l'ancien).
  roleTiers: [
    {
      messagesRequired: 50,
      roleId: 'ID_DU_ROLE_NIVEAU_1',
      previousRoleId: 'ID_DU_ROLE_DE_BIENVENUE',
    },
    {
      messagesRequired: 200,
      roleId: 'ID_DU_ROLE_NIVEAU_2',
      previousRoleId: 'ID_DU_ROLE_NIVEAU_1',
    },
    {
      messagesRequired: 500,
      roleId: 'ID_DU_ROLE_NIVEAU_3',
      previousRoleId: 'ID_DU_ROLE_NIVEAU_2',
    },
  ],
};
