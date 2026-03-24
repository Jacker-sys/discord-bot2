const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');

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
                .setRequired(true))

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

    // STARTUP
    if (interaction.commandName === 'startup') {

        const staffInput = interaction.options.getString('staff');
        const formattedStaff = staffInput.split(',').map(s => s.trim()).join('\n');

        const embed = new EmbedBuilder()
            .setTitle('🏥 THE HOSPITAL IS NOW OPEN!')
            .setDescription(`Lakeview General Hospital is now open.\n\n${HOSPITAL_LOCATION}\n\n**Staff On Duty:**\n${formattedStaff}`)
            .setColor(0x00FF00)
            .setTimestamp();

        await interaction.reply({ content: 'Hospital opened.', ephemeral: true });
        await interaction.channel.send({ embeds: [embed] });

        logEvent(interaction, `🏥 Hospital opened\n${formattedStaff}`);
    }

    // END
    if (interaction.commandName === 'end') {

        const embed = new EmbedBuilder()
            .setTitle('🔴 HOSPITAL CLOSED')
            .setDescription(`Lakeview General Hospital is now closed.\n\n${HOSPITAL_LOCATION}`)
            .setColor(0xFF0000)
            .setTimestamp();

        await interaction.reply({ content: 'Hospital closed.', ephemeral: true });
        await interaction.channel.send({ embeds: [embed] });

        logEvent(interaction, '🔴 Hospital closed');
    }

    // LOCKDOWN
    if (interaction.commandName === 'lockdown') {

        const embed = new EmbedBuilder()
            .setTitle('🚨 HOSPITAL IN LOCKDOWN')
            .setDescription(`The hospital is currently in lockdown.\n\n${HOSPITAL_LOCATION}`)
            .setColor(0xFFA500)
            .setTimestamp();

        await interaction.reply({ content: 'Lockdown activated.', ephemeral: true });
        await interaction.channel.send({ embeds: [embed] });

        logEvent(interaction, '🚨 Lockdown activated');
    }

    // CODE
    if (interaction.commandName === 'code') {

        const type = interaction.options.getString('type');
        const room = interaction.options.getString('room');

        const embed = new EmbedBuilder()
            .setTitle(`🚨 CODE ${type.toUpperCase()}`)
            .setDescription(`**Location:** ${room}\n\n${HOSPITAL_LOCATION}\n\nAll available staff respond immediately.`)
            .setColor(0xFF0000)
            .setTimestamp();

        await interaction.reply({ content: `Code ${type} announced.`, ephemeral: true });
        await interaction.channel.send({ embeds: [embed] });

        logEvent(interaction, `🚨 Code ${type} at ${room}`);
    }

    // PINGROLE
    if (interaction.commandName === 'pingrole') {
        const role = interaction.options.getRole('role');
        if (!role) return interaction.reply({ content: '❌ Role not found.', ephemeral: true });

        await interaction.reply({ 
            content: `Ping: ${role}`, 
            allowedMentions: { roles: [role.id] } 
        });

        logEvent(interaction, `📢 Pinged role: ${role.name}`);
    }

    // ADMIT
    if (interaction.commandName === 'admit') {

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

        logEvent(interaction, `🏥 Admitted: ${patient} (Room ${room}) | Staff: ${staff}`);
    }

    // DISCHARGE
    if (interaction.commandName === 'discharge') {

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

        logEvent(interaction, `🏥 Discharged: ${patient} (Room ${room}) | Staff: ${staff}`);
    }

});

// Catch unhandled rejections (prevents bot from crashing)
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.login(TOKEN);
