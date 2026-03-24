const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    SlashCommandBuilder, 
    REST, 
    Routes,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder
} = require('discord.js');

const TOKEN = process.env.TOKEN; // Read token from environment variable
const CLIENT_ID = '1250752254584029205';
const GUILD_ID = '1441852576646565981';

// Logging channel
const LOG_CHANNEL_ID = '1476557270455160892';

// Staff role required to use commands
const REQUIRED_ROLE_ID = '1441852577057734719';

// Hospital Location
const HOSPITAL_LOCATION = '**📍 Location:** 404 Independence Parkway N, Medical Way S, Building NO. 4041, LKVC';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Helper: log events
function logEvent(interaction, message) {
    const channel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (!channel) return;

    const user = interaction.user;
    const time = new Date().toLocaleString();

    channel.send(
`📝 **Log Entry**
${message}

**User:** ${user.tag}
**Command:** /${interaction.commandName}
**Channel:** ${interaction.channel.name}
**Time:** ${time}`
    );
}

// Patient rooms
const PATIENT_ROOMS = [
    "ER 1","ER 2","ER 3",
    "Patient Care 201","Patient Care 202","Patient Care 203","Patient Care 204","Patient Care 205","Patient Care 206",
    "ICU Bed 301","ICU Bed 302","ICU Bed 303","ICU Bed 304","ICU Bed 305","ICU Bed 306","ICU Bed 307"
];

// Convert rooms to choices
const ROOM_CHOICES = PATIENT_ROOMS.map(room => ({ name: room, value: room }));

// ----------------------
// SLASH COMMANDS
// ----------------------
const commands = [
    new SlashCommandBuilder()
        .setName('startup')
        .setDescription('Open the hospital')
        .addStringOption(option =>
            option.setName('staff')
                .setDescription('Separate staff with commas')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('end')
        .setDescription('Close the hospital'),

    new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Put the hospital in lockdown'),

    new SlashCommandBuilder()
        .setName('code')
        .setDescription('Announce a hospital code')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Code type')
                .setRequired(true)
                .addChoices(
                    { name: 'Code Blue (Medical Emergency)', value: 'Blue' },
                    { name: 'Code Red (Fire)', value: 'Red' },
                    { name: 'Code Black (Bomb Threat)', value: 'Black' },
                    { name: 'Code Pink (Infant/Child Abduction)', value: 'Pink' },
                    { name: 'Code Orange (Hazardous Material)', value: 'Orange' },
                    { name: 'Code Silver (Active Threat)', value: 'Silver' },
                    { name: 'Code Yellow (Missing Person)', value: 'Yellow' },
                    { name: 'Code White (Violent Person)', value: 'White' }
                ))
        .addStringOption(option =>
            option.setName('room')
                .setDescription('Room or location')
                .setRequired(true)
                .addChoices(...ROOM_CHOICES)),

    new SlashCommandBuilder()
        .setName('pingrole')
        .setDescription('Ping a selected role')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to ping')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('admit')
        .setDescription('Admit a patient')
        .addStringOption(option =>
            option.setName('patient')
                .setDescription('Patient name')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('room')
                .setDescription('Patient Room')
                .setRequired(true)
                .addChoices(...ROOM_CHOICES))
        .addStringOption(option =>
            option.setName('staff')
                .setDescription('Attending staff')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('discharge')
        .setDescription('Discharge a patient')
        .addStringOption(option =>
            option.setName('patient')
                .setDescription('Patient name')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('room')
                .setDescription('Patient Room')
                .setRequired(true)
                .addChoices(...ROOM_CHOICES))
        .addStringOption(option =>
            option.setName('staff')
                .setDescription('Discharging staff')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('reception')
        .setDescription('Create reception form'),

    new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Make a custom announcement')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The text you want to announce')
                .setRequired(true)),

].map(cmd => cmd.toJSON());

// ----------------------
// REGISTER COMMANDS
// ----------------------
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('Slash commands registered!');
    } catch (error) {
        console.error(error);
    }
})();

// ----------------------
// INTERACTIONS
// ----------------------
client.on('interactionCreate', async interaction => {

    // Permission check for staff
    if (interaction.isChatInputCommand() && !interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
        return interaction.reply({ content: '❌ You do not have permission.', ephemeral: true });
    }

    // ----------------------
    // STARTUP / END / LOCKDOWN / CODE
    // ----------------------
    if (interaction.isChatInputCommand()) {
        const cmd = interaction.commandName;

        if (cmd === 'startup') {
            const staff = interaction.options.getString('staff');
            const embed = new EmbedBuilder()
                .setTitle('🏥 THE HOSPITAL IS NOW OPEN!')
                .setDescription(`Lakeview General Hospital is now open.\n\n${HOSPITAL_LOCATION}\n\n**Staff On Duty:**\n${staff.split(',').join('\n')}`)
                .setColor(0x00FF00)
                .setTimestamp();
            await interaction.reply({ content: 'Hospital opened.', ephemeral: true });
            await interaction.channel.send({ embeds: [embed] });
            logEvent(interaction, `Hospital opened | Staff: ${staff}`);
        }

        if (cmd === 'end') {
            const embed = new EmbedBuilder()
                .setTitle('🔴 HOSPITAL CLOSED')
                .setDescription(`Lakeview General Hospital is now closed.\n\n${HOSPITAL_LOCATION}`)
                .setColor(0xFF0000)
                .setTimestamp();
            await interaction.reply({ content: 'Hospital closed.', ephemeral: true });
            await interaction.channel.send({ embeds: [embed] });
            logEvent(interaction, 'Hospital closed');
        }

        if (cmd === 'lockdown') {
            const embed = new EmbedBuilder()
                .setTitle('🚨 HOSPITAL IN LOCKDOWN')
                .setDescription(`The hospital is currently in lockdown.\n\n${HOSPITAL_LOCATION}`)
                .setColor(0xFFA500)
                .setTimestamp();
            await interaction.reply({ content: 'Lockdown activated.', ephemeral: true });
            await interaction.channel.send({ embeds: [embed] });
            logEvent(interaction, 'Lockdown activated');
        }

        if (cmd === 'code') {
            const type = interaction.options.getString('type');
            const room = interaction.options.getString('room');
            const embed = new EmbedBuilder()
                .setTitle(`🚨 CODE ${type.toUpperCase()}`)
                .setDescription(`**Location:** ${room}\n\n${HOSPITAL_LOCATION}\n\nAll available staff respond immediately.`)
                .setColor(0xFF0000)
                .setTimestamp();
            await interaction.reply({ content: `Code ${type} announced.`, ephemeral: true });
            await interaction.channel.send({ embeds: [embed] });
            logEvent(interaction, `Code ${type} at ${room}`);
        }

        if (cmd === 'pingrole') {
            const role = interaction.options.getRole('role');
            await interaction.reply({ content: `Ping: ${role}`, allowedMentions: { roles: [role.id] } });
            logEvent(interaction, `Pinged role: ${role.name}`);
        }

        if (cmd === 'admit') {
            const patient = interaction.options.getString('patient');
            const room = interaction.options.getString('room');
            const staff = interaction.options.getString('staff');
            const embed = new EmbedBuilder()
                .setTitle('✅ PATIENT ADMITTED')
                .setDescription(`**Patient:** ${patient}\n**Room:** ${room}\n**Attending Staff:** ${staff}\n\n${HOSPITAL_LOCATION}`)
                .setColor(0x00FF00)
                .setTimestamp();
            await interaction.reply({ content: `${patient} admitted.`, ephemeral: true });
            await interaction.channel.send({ embeds: [embed] });
            logEvent(interaction, `Admitted ${patient} in ${room} | Staff: ${staff}`);
        }

        if (cmd === 'discharge') {
            const patient = interaction.options.getString('patient');
            const room = interaction.options.getString('room');
            const staff = interaction.options.getString('staff');
            const embed = new EmbedBuilder()
                .setTitle('🏥 PATIENT DISCHARGED')
                .setDescription(`**Patient:** ${patient}\n**Room:** ${room}\n**Discharged By:** ${staff}\n\n${HOSPITAL_LOCATION}`)
                .setColor(0x0099FF)
                .setTimestamp();
            await interaction.reply({ content: `${patient} discharged.`, ephemeral: true });
            await interaction.channel.send({ embeds: [embed] });
            logEvent(interaction, `Discharged ${patient} from ${room} | Staff: ${staff}`);
        }

        if (cmd === 'announce') {
            const msg = interaction.options.getString('message');
            await interaction.channel.send({ content: `📢 **Announcement:**\n${msg}` });
            await interaction.reply({ content: 'Announcement sent.', ephemeral: true });
            logEvent(interaction, `Announcement: ${msg}`);
        }

        if (cmd === 'reception') {
            const embed = new EmbedBuilder()
                .setTitle('📝 PATIENT FORM')
                .setDescription(
`PATIENT USERNAME -

ROOM NUMBER -

ADMITTED BY & TIME -

DISCHARGED BY & TIME -

------------------------------------

CHIEF COMPLAINT -
AGE -
WEIGHT -
HISTORY -

------------------------------------

**CURRENT VITALS:**
HR -
SPO2 -
RR -
BP -
TEMP -`
                );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('update_basic').setLabel('Update Patient Info').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('update_medical').setLabel('Update Medical Info').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('update_vitals').setLabel('Update Vitals').setStyle(ButtonStyle.Primary)
            );

            await interaction.reply({ content: 'Form created', ephemeral: true });
            await interaction.channel.send({ embeds: [embed], components: [row] });
        }
    }

    // ----------------------
    // BUTTONS & MODALS HANDLING
    // ----------------------
    // Keep your previous modal code for vitals/basic/medical here
    // unchanged; no need to repeat it for brevity
});

// Catch unhandled rejections
process.on('unhandledRejection', err => console.error('Unhandled promise rejection:', err));

client.login(TOKEN);
