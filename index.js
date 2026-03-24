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
    TextInputStyle
} = require('discord.js');

const TOKEN = process.env.TOKEN; // Read token from environment variable
const CLIENT_ID = '1250752254584029205';
const GUILD_ID = '1441852576646565981';

// Logging channel
const LOG_CHANNEL_ID = '1476557270455160892';

// Staff role required to use commands
const REQUIRED_ROLE_ID = '1441852577057734719'; // fix your ID if needed

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

    // Reception command
    new SlashCommandBuilder()
        .setName('reception')
        .setDescription('Create reception form'),

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

    // Check permission
    if (interaction.isChatInputCommand() && !interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
        return interaction.reply({
            content: '❌ You do not have permission to use this command.',
            ephemeral: true
        });
    }

    // STARTUP
    if (interaction.isChatInputCommand() && interaction.commandName === 'startup') {
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
    if (interaction.isChatInputCommand() && interaction.commandName === 'end') {
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
    if (interaction.isChatInputCommand() && interaction.commandName === 'lockdown') {
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
    if (interaction.isChatInputCommand() && interaction.commandName === 'code') {
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
    if (interaction.isChatInputCommand() && interaction.commandName === 'pingrole') {
        const role = interaction.options.getRole('role');
        if (!role) return interaction.reply({ content: '❌ Role not found.', ephemeral: true });

        await interaction.reply({ 
            content: `Ping: ${role}`, 
            allowedMentions: { roles: [role.id] } 
        });

        logEvent(interaction, `📢 Pinged role: ${role.name}`);
    }

    // ADMIT
    if (interaction.isChatInputCommand() && interaction.commandName === 'admit') {
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
    if (interaction.isChatInputCommand() && interaction.commandName === 'discharge') {
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

    // RECEPTION FORM
    if (interaction.isChatInputCommand() && interaction.commandName === 'reception') {
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
            new ButtonBuilder()
                .setCustomId('update_basic')
                .setLabel('Update Patient Info')
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId('update_medical')
                .setLabel('Update Medical Info')
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId('update_vitals')
                .setLabel('Update Vitals')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ content: 'Form created', ephemeral: true });
        interaction.channel.send({ embeds: [embed], components: [row] });
    }

    // --------------------------
    // BUTTONS & MODALS HANDLING
    // --------------------------
    if (interaction.isButton()) {

        // Vitals modal with normal ranges in placeholder
        if (interaction.customId === 'update_vitals') {
            const embed = EmbedBuilder.from(interaction.message.embeds[0]);
            const desc = embed.data.description;

            const getField = (label) => {
                const match = desc.match(new RegExp(`${label} - (.*)`));
                return match ? match[1].trim() : '';
            };

            const modal = new ModalBuilder()
                .setCustomId('vitals_modal')
                .setTitle('Update Vitals');

            const makeInput = (id,label,value,placeholder) =>
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(id)
                        .setLabel(label)
                        .setStyle(TextInputStyle.Short)
                        .setValue(value)
                        .setPlaceholder(placeholder)
                );

            modal.addComponents(
                makeInput('hr','Heart Rate', getField('HR'),'Normal: 60-100 bpm'),
                makeInput('spo2','SPO2', getField('SPO2'),'Normal: 95-100%'),
                makeInput('rr','Resp Rate', getField('RR'),'Normal: 12-20 bpm'),
                makeInput('bp','Blood Pressure', getField('BP'),'Normal ~120/80 mmHg'),
                makeInput('temp','Temperature', getField('TEMP'),'Normal 36.5-37.5°C')
            );

            return interaction.showModal(modal);
        }

        // Basic Info modal
        if (interaction.customId === 'update_basic') {
            const modal = new ModalBuilder()
                .setCustomId('basic_modal')
                .setTitle('Patient Info');

            const makeInput = (id,label) =>
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(id)
                        .setLabel(label)
                        .setStyle(TextInputStyle.Short)
                );

            modal.addComponents(
                makeInput('username','Patient Username (Roblox)'),
                makeInput('room','Room Number'),
                makeInput('admit','Admitted By & Time'),
                makeInput('discharge','Discharged By & Time'),
                makeInput('complaint','Chief Complaint')
            );

            return interaction.showModal(modal);
        }

        // Medical Info modal
        if (interaction.customId === 'update_medical') {
            const modal = new ModalBuilder()
                .setCustomId('medical_modal')
                .setTitle('Medical Info');

            const makeInput = (id,label) =>
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(id)
                        .setLabel(label)
                        .setStyle(TextInputStyle.Short)
                );

            modal.addComponents(
                makeInput('age','Age'),
                makeInput('weight','Weight'),
                makeInput('history','Medical History')
            );

            return interaction.showModal(modal);
        }
    }

    // MODAL SUBMIT
    if (interaction.isModalSubmit()) {
        const embed = EmbedBuilder.from(interaction.message.embeds[0]);
        let desc = embed.data.description;

        // Vitals
        if (interaction.customId === 'vitals_modal') {
            const hr = interaction.fields.getTextInputValue('hr');
            const spo2 = interaction.fields.getTextInputValue('spo2');
            const rr = interaction.fields.getTextInputValue('rr');
            const bp = interaction.fields.getTextInputValue('bp');
            const temp = interaction.fields.getTextInputValue('temp');

            embed.setDescription(
desc.replace(
/\*\*CURRENT VITALS:\*\*[\s\S]*/,
`**CURRENT VITALS:**
HR - ${hr}
SPO2 - ${spo2}
RR - ${rr}
BP - ${bp}
TEMP - ${temp}`
)
            );

            return interaction.update({ embeds: [embed] });
        }

        // Basic Info
        if (interaction.customId === 'basic_modal') {
            const username = interaction.fields.getTextInputValue('username');
            const room = interaction.fields.getTextInputValue('room');
            const admit = interaction.fields.getTextInputValue('admit');
            const discharge = interaction.fields.getTextInputValue('discharge');
            const complaint = interaction.fields.getTextInputValue('complaint');

            embed.setDescription(
desc.replace(
/PATIENT USERNAME[\s\S]*------------------------------------/,
`PATIENT USERNAME - ${username}

ROOM NUMBER - ${room}

ADMITTED BY & TIME - ${admit}

DISCHARGED BY & TIME - ${discharge}

------------------------------------

CHIEF COMPLAINT - ${complaint}
AGE -
WEIGHT -
HISTORY -

------------------------------------`
)
            );

            return interaction.update({ embeds: [embed] });
        }

        // Medical Info
        if (interaction.customId === 'medical_modal') {
            const age = interaction.fields.getTextInputValue('age');
            const weight = interaction.fields.getTextInputValue('weight');
            const history = interaction.fields.getTextInputValue('history');

            embed.setDescription(
desc.replace(
/AGE -[\s\S]*------------------------------------/,
`AGE - ${age}
WEIGHT - ${weight}
HISTORY - ${history}

------------------------------------`
)
            );

            return interaction.update({ embeds: [embed] });
        }
    }
});

// Catch unhandled rejections
process.on('unhandledRejection', error => console.error('Unhandled promise rejection:', error));

client.login(TOKEN);
