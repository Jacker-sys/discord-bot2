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
const REQUIRED_ROLE_ID = '1441852577057734719';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// COMMANDS
const commands = [
    new SlashCommandBuilder()
        .setName('reception')
        .setDescription('Create reception form')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
    );
})();

client.on('interactionCreate', async interaction => {

    // BUTTONS
    if (interaction.isButton()) {

        // 🔵 Update Vitals
        if (interaction.customId === 'update_vitals') {

            const embed = EmbedBuilder.from(interaction.message.embeds[0]);
            const desc = embed.data.description;

            // extract current vitals if exist, else leave empty
            const getField = (label) => {
                const match = desc.match(new RegExp(`${label} - (.*)`));
                return match ? match[1].trim() : '';
            };

            const modal = new ModalBuilder()
                .setCustomId('vitals_modal')
                .setTitle('Update Vitals');

            const makeInput = (id, label, value, placeholder) =>
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId(id)
                        .setLabel(label)
                        .setStyle(TextInputStyle.Short)
                        .setValue(value)
                        .setPlaceholder(placeholder)
                );

            modal.addComponents(
                makeInput('hr','Heart Rate', getField('HR'), 'Normal: 60-100 bpm'),
                makeInput('spo2','SPO2', getField('SPO2'), 'Normal: 95-100%'),
                makeInput('rr','Resp Rate', getField('RR'), 'Normal: 12-20 bpm'),
                makeInput('bp','Blood Pressure', getField('BP'), 'Normal ~120/80 mmHg'),
                makeInput('temp','Temperature', getField('TEMP'), 'Normal 36.5-37.5°C')
            );

            return interaction.showModal(modal);
        }

        // 🟢 Update Basic Info (max 5 inputs)
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

        // 🟡 Update Medical Info (age, weight, history)
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

    // MODAL SUBMIT HANDLER
    if (interaction.isModalSubmit()) {
        const embed = EmbedBuilder.from(interaction.message.embeds[0]);
        let desc = embed.data.description;

        // 🔵 VITALS
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

        // 🟢 BASIC INFO
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

        // 🟡 MEDICAL INFO
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

    if (!interaction.isChatInputCommand()) return;
    if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID))
        return interaction.reply({ content: '❌ No permission', ephemeral: true });

    // CREATE RECEPTION FORM
    if (interaction.commandName === 'reception') {

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
});

client.login(TOKEN);
