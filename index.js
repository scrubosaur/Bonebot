/**
 * Bot Discord :
 * - Attribue un rôle de bienvenue à l'arrivée d'un membre
 * - Compte les messages par utilisateur (stockés dans MongoDB Atlas, persistant)
 * - Fait progresser automatiquement l'utilisateur vers un rôle supérieur
 *   tous les X messages, en suivant une liste de "paliers" (config.js)
 */

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { MongoClient } = require('mongodb');
const http = require('http');
const config = require('./config.js');

// --- Petit serveur HTTP pour que Render ne mette pas le service en veille ---
// Un service UptimeRobot (ou équivalent) doit "pinguer" cette route toutes les
// 5-10 minutes pour empêcher Render de suspendre le bot après 15 min d'inactivité.
const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot Discord en ligne');
  })
  .listen(PORT, () => console.log(`Serveur ping actif sur le port ${PORT}`));

// --- Connexion MongoDB ---
const mongoClient = new MongoClient(config.mongoUri);
let usersCollection;

async function connectDB() {
  await mongoClient.connect();
  const db = mongoClient.db('discordBot');
  usersCollection = db.collection('users');
  console.log('Connecté à MongoDB');
}

// Récupère le compteur de messages d'un utilisateur (0 si inexistant)
async function getMessageCount(userId) {
  const doc = await usersCollection.findOne({ userId });
  return doc ? doc.count : 0;
}

// Incrémente le compteur et retourne la nouvelle valeur
async function incrementMessageCount(userId) {
  const result = await usersCollection.findOneAndUpdate(
    { userId },
    { $inc: { count: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return result.value.count;
}

// Initialise un utilisateur à 0 messages (utilisé à l'arrivée)
async function initUser(userId) {
  await usersCollection.updateOne(
    { userId },
    { $setOnInsert: { count: 0 } },
    { upsert: true }
  );
}

// --- Client Discord ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember],
});

client.once('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
});

// --- 1. Attribution du rôle de bienvenue à l'arrivée ---
client.on('guildMemberAdd', async (member) => {
  try {
    const welcomeRole = member.guild.roles.cache.get(config.welcomeRoleId);
    if (!welcomeRole) {
      console.error('Rôle de bienvenue introuvable. Vérifiez welcomeRoleId dans config.js');
      return;
    }
    await member.roles.add(welcomeRole);
    console.log(`Rôle de bienvenue attribué à ${member.user.tag}`);

    await initUser(member.id);
  } catch (err) {
    console.error('Erreur lors de l\'attribution du rôle de bienvenue :', err);
  }
});

// --- 2. Comptage des messages + progression de rôle ---
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const userId = message.author.id;

  let count;
  try {
    count = await incrementMessageCount(userId);
  } catch (err) {
    console.error('Erreur MongoDB lors de l\'incrémentation :', err);
    return;
  }

  const tier = config.roleTiers.find((t) => t.messagesRequired === count);
  if (!tier) return;

  try {
    const member = await message.guild.members.fetch(userId);

    const newRole = message.guild.roles.cache.get(tier.roleId);
    if (!newRole) {
      console.error(`Rôle introuvable pour le palier ${count} messages. Vérifiez roleTiers dans config.js`);
      return;
    }

    if (tier.previousRoleId) {
      const oldRole = message.guild.roles.cache.get(tier.previousRoleId);
      if (oldRole && member.roles.cache.has(oldRole.id)) {
        await member.roles.remove(oldRole);
      }
    }

    await member.roles.add(newRole);

    if (config.announceInChannel) {
      message.channel.send(
        `🎉 ${member} a atteint **${count} messages** et passe au rôle **${newRole.name}** !`
      );
    }
  } catch (err) {
    console.error('Erreur lors de la progression de rôle :', err);
  }
});

// --- Démarrage ---
(async () => {
  await connectDB();
  await client.login(config.token);
})();
