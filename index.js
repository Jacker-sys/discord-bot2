const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');

const TOKEN = process.env.TOKEN;
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

// Logging helper
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

// Slash commands
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
                .setRequired(true)),

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
                .setDescription('Room number')
                .setRequired(true))
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
                .setDescription('Room number')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('staff')
                .setDescription('Discharging staff')
                .setRequired(true)),

    // NEW RECEPTION COMMAND
    new SlashCommandBuilder()
        .setName('reception')
        .setDescription('Create a reception form')

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );
        console.log('Slash commands registered!');
    } catch (error) {
        console.error(error);
    }
})();

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
        return interaction.reply({
            content: '❌ You do not have permission to use this command.',
            ephemeral: true
        });
    }

    // RECEPTION
    if (interaction.commandName === 'reception') {

        const embed = new EmbedBuilder()
            .setTitle('📝 PATIENT RECEPTION FORM')
            .setDescription(
`**ROOM NUMBER -**
 
**ADMITTED BY & TIME -**
 
**DISCHARGED BY & TIME -**

------------------------------------

**CHIEF COMPLAINT -**
**AGE -**
**WEIGHT (KG OR POUNDS) -**
**COMPLAINT HISTORY/REASON -**
**MEDICAL HISTORY & ALLERGIES -**

**RECEPTIONIST PART COMPLETE**

------------------------------------

**PHYSICAL ASSESSMENT:**
Airway (Clear/Obstructed)-  
Breathing (Regular Breath Sounds/Abnormal Breath Sounds)-  
Circulation (# Seconds)-  

**VITALS:**
HR (bpm) -
SPO2 (%) -
RR (bpm) - 
BP (mm/Hg) -
TEMP (F/C) -

------------------------------------

**TREATMENT:**
• Interventions:
• Meds Given:

Orders:

------------------------------------`
            )
            .setColor(0xCCCCCC)
            .setTimestamp();

        await interaction.reply({ content: 'Reception form created.', ephemeral: true });
        await interaction.channel.send({ embeds: [embed] });

        logEvent(interaction, '📝 Reception form created');
    }

    // (rest of your commands stay the same below — startup, end, etc.)
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.login(TOKEN);
