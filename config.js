module.exports = {
  // Ces valeurs sont lues depuis les variables d'environnement,
  // définies sur Koyeb (ou en local dans un fichier .env, jamais commité).
  token: process.env.DISCORD_TOKEN,
  mongoUri: process.env.MONGO_URI,

  // ID du rôle attribué automatiquement à l'arrivée d'un membre
  welcomeRoleId: '1546357625921339452',

  // Affiche un message dans le salon quand un utilisateur monte de rôle
  announceInChannel: true,

  // Paliers de progression : à chaque seuil de messages, l'utilisateur
  // reçoit un nouveau rôle (et perd optionnellement l'ancien).
  roleTiers: [
    {
      messagesRequired: 50,
      roleId: '1546361911631675493',
      previousRoleId: '1546357625921339452',
    },
    {
      messagesRequired: 200,
      roleId: '1546362041512632360',
      previousRoleId: '1546361911631675493',
    },
    {
      messagesRequired: 500,
      roleId: '1546352025183199322',
      previousRoleId: '1546362041512632360',
    },
  ],
};
