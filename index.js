const Discord = require("discord.js");
const client = new Discord.Client({
  intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_INVITES"],
});
const config = require("./config.json");
const { MessageActionRow, MessageButton } = require("discord.js");

let invites = {};

const getInviteCounts = async (guild) => {
  return new Map(
    guild.invites.cache.map((invite) => [invite.code, invite.uses])
  );
};

client.once("ready", async () => {
  console.log("Bot is online!");
  console.log("Code by Wick Studio!");
  console.log("discord.gg/wicks");

  // Load all server invites
  for (const [guildId, guild] of client.guilds.cache) {
    try {
      const currentInvites = await guild.invites.fetch();
      invites[guildId] = new Map(
        currentInvites.map((invite) => [invite.code, invite.uses])
      );
      console.log(
        `Loaded ${currentInvites.size} invites for guild: ${guild.name}`
      );
    } catch (err) {
      console.log(`Failed to load invites for guild: ${guild.name}`);
      console.error(err);
    }
  }
});

///==============================================================

const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Hello Express app!");
});

app.listen(3000, () => {
  console.log("server started");
});

///==============================================================

app.post("/uptime_devtools", (req, res) => {
  console.log("uptime is run by Developer tools");
  res.send({
    msg: "done uptime",
    access: "by_devtools",
  });
});

///==============================================================

client.on("ready", () => {
  client.user.setPresence({
    activities: [
      {
        name: "Evo Bots",
        type: "STREAMING",
        url: "https://twitch.tv/evo_bots",
      },
    ],
    status: "dnd",
  });
});

client.on("inviteCreate", async (invite) => {
  const guildInvites = invites[invite.guild.id];
  guildInvites.set(invite.code, invite.uses);
});

client.on("inviteDelete", async (invite) => {
  const guildInvites = invites[invite.guild.id];
  guildInvites.delete(invite.code);
});

client.on("guildMemberAdd", async (member) => {
  const welcomeChannel = member.guild.channels.cache.get(
    config.welcomeChannelId
  );
  const role = member.guild.roles.cache.get(config.autoRoleId);

  if (role) {
    member.roles.add(role).catch(console.error);
  } else {
    console.log("Role not found");
  }

  const newInvites = await member.guild.invites.fetch();
  const usedInvite = newInvites.find((inv) => {
    const prevUses = invites[member.guild.id].get(inv.code) || 0;
    return inv.uses > prevUses;
  });

  let inviterMention = "Unknown";
  if (usedInvite && usedInvite.inviter) {
    inviterMention = `<@${usedInvite.inviter.id}>`;
    console.log(
      `Member joined with invite code ${usedInvite.code}, invited by ${inviterMention}`
    );
  } else {
    console.log(`Member joined, but no matching invite was found.`);
  }

  const fullUser = await client.users.fetch(member.user.id, { force: true });

  const welcomeEmbed = new Discord.MessageEmbed()
    .setColor("#05131f")
    .setTitle("Welcome to the Server!")
    .setDescription(
      `Hello ${member}, welcome to **${member.guild.name}**! enjoy your stay.`
    )
    .addFields(
      { name: "Username", value: member.user.tag, inline: true },
      { name: "Invited By", value: inviterMention, inline: true },
      {
        name: "Invite Used",
        value: usedInvite ? `||${usedInvite.code}||` : "Direct Join",
        inline: true,
      },
      {
        name: "You're Member",
        value: `${member.guild.memberCount}`,
        inline: true,
      }
      //{ name: 'Server Rules', value: '<#1164662648080707604>.', inline: true },
      //{ name: 'Support Channel', value: '<#1166772582951964702>.', inline: true }
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp();
  const bannerUrl = fullUser.bannerURL({
    dynamic: true,
    format: "png",
    size: 1024,
  });
  if (bannerUrl) {
    welcomeEmbed.setImage("");
  }

  // buttons
  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setStyle("LINK")
      .setURL("https://discord.gg/ksz93e9VNa") // link to button 1
      .setLabel("SERVER INVITE") // name of button 1
      .setEmoji("<a:1576orangecrown:1216813066193473587> "), // emoji of button 1
    new MessageButton()
      .setStyle("LINK")
      .setURL(
        "https://discord.com/channels/1193657834034954282/1198017015928082542"
      ) // link to button 2
      .setLabel("Rules") // name of button 2
      .setEmoji("<a:warningbug:905560995886411806>"), // emoji of button 2
    new MessageButton()
      .setStyle("LINK")
      .setURL(
        "https://discord.com/channels/1193657834034954282/1193657834949312592"
      ) // link to button 3
      .setLabel("Roles") // name of button 3
      .setEmoji("<a:Moderator_Programs_Alumni_a:1166978001381113916> ") // emoji of button 3
  );

  welcomeChannel.send({
    content: ` ${member}`,
    embeds: [welcomeEmbed],
    components: [row],
  });

  invites[member.guild.id] = new Map(
    newInvites.map((invite) => [invite.code, invite.uses])
  );
});

client.login(process.env.token);
