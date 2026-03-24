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

const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1250752254584029205';
const GUILD_ID = '1441852576646565981';

const LOG_CHANNEL_ID = '1476557270455160892';
const REQUIRED_ROLE_ID = '1441852577057734719';

const HOSPITAL_LOCATION = '**📍 Location:** 404 Independence Parkway N, Medical Way S, Building NO. 4041, LKVC';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// LOGGING
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

// COMMANDS (FIXED DESCRIPTIONS)
const commands = [

    new SlashCommandBuilder()
        .setName('startup')
        .setDescription('Open the hospital')
        .addStringOption(option =>
            option.setName('staff')
                .setDescription('Staff list')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('end')
        .setDescription('Close hospital'),

    new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Lockdown hospital'),

    new SlashCommandBuilder()
        .setName('code')
        .setDescription('Hospital code')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Code type')
                .setRequired(true)
                .addChoices(
                    { name: 'Code Blue', value: 'Blue' },
                    { name: 'Code Red', value: 'Red' },
                    { name: 'Code Black', value: 'Black' },
                    { name: 'Code Pink', value: 'Pink' }
                ))
        .addStringOption(option =>
            option.setName('room')
                .setDescription('Room location')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('pingrole')
        .setDescription('Ping role')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to ping')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('admit')
        .setDescription('Admit patient')
        .addStringOption(o => o.setName('patient').setDescription('Patient name').setRequired(true))
        .addStringOption(o => o.setName('room').setDescription('Room number').setRequired(true))
        .addStringOption(o => o.setName('staff').setDescription('Staff name').setRequired(true)),

    new SlashCommandBuilder()
        .setName('discharge')
        .setDescription('Discharge patient')
        .addStringOption(o => o.setName('patient').setDescription('Patient name').setRequired(true))
        .addStringOption(o => o.setName('room').setDescription('Room number').setRequired(true))
        .addStringOption(o => o.setName('staff').setDescription('Staff name').setRequired(true)),

    new SlashCommandBuilder()
        .setName('reception')
        .setDescription('Create reception form')

].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log('Slash commands registered!');
    } catch (err) {
        console.error(err);
    }
})();

client.on('interactionCreate', async interaction => {

    // BUTTON
    if (interaction.isButton()) {
        if (interaction.customId === 'update_vitals') {

            const modal = new ModalBuilder()
                .setCustomId('vitals_modal')
                .setTitle('Update Vitals');

            const makeInput = (id, label) =>
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(id)
                        .setLabel(label)
                        .setStyle(TextInputStyle.Short)
                );

            modal.addComponents(
                makeInput('hr','Heart Rate'),
                makeInput('spo2','SPO2'),
                makeInput('rr','Resp Rate'),
                makeInput('bp','Blood Pressure'),
                makeInput('temp','Temperature')
            );

            return interaction.showModal(modal);
        }
    }

    // MODAL
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'vitals_modal') {

            const hr = interaction.fields.getTextInputValue('hr');
            const spo2 = interaction.fields.getTextInputValue('spo2');
            const rr = interaction.fields.getTextInputValue('rr');
            const bp = interaction.fields.getTextInputValue('bp');
            const temp = interaction.fields.getTextInputValue('temp');

            const embed = EmbedBuilder.from(interaction.message.embeds[0]);

            embed.setDescription(
embed.data.description.replace(
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
    }

    if (!interaction.isChatInputCommand()) return;

    if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
        return interaction.reply({ content: '❌ No permission', ephemeral: true });
    }

    // RECEPTION
    if (interaction.commandName === 'reception') {

        const embed = new EmbedBuilder()
            .setTitle('📝 PATIENT FORM')
            .setDescription(
`ROOM NUMBER -

ADMITTED BY & TIME -

DISCHARGED BY & TIME -

------------------------------------

CHIEF COMPLAINT -
AGE -
WEIGHT -
HISTORY -

------------------------------------

NORMAL RANGES:
HR 60-100
SPO2 95-100
RR 12-20
BP ~120/80
TEMP 36.5-37.5C

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
                .setCustomId('update_vitals')
                .setLabel('Update Vitals')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ content: 'Form created', ephemeral: true });
        interaction.channel.send({ embeds: [embed], components: [row] });

        logEvent(interaction, '📝 Reception form created');
    }

    // PINGROLE
    if (interaction.commandName === 'pingrole') {
        const role = interaction.options.getRole('role');
        return interaction.reply({
            content: `${role}`,
            allowedMentions: { roles: [role.id] }
        });
    }

});

process.on('unhandledRejection', console.error);

client.login(TOKEN);
