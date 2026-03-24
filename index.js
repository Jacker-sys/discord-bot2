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

        // UPDATE VITALS
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

        // UPDATE PATIENT INFO (ALL IN ONE)
        if (interaction.customId === 'update_patient') {

            const modal = new ModalBuilder()
                .setCustomId('patient_modal')
                .setTitle('Update Patient Info');

            const makeInput = (id, label) =>
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
                makeInput('complaint','Chief Complaint'),
                makeInput('age','Age'),
                makeInput('weight','Weight'),
                makeInput('history','Medical History')
            );

            return interaction.showModal(modal);
        }
    }

    // MODALS
    if (interaction.isModalSubmit()) {

        const embed = EmbedBuilder.from(interaction.message.embeds[0]);

        // VITALS
        if (interaction.customId === 'vitals_modal') {

            const hr = interaction.fields.getTextInputValue('hr');
            const spo2 = interaction.fields.getTextInputValue('spo2');
            const rr = interaction.fields.getTextInputValue('rr');
            const bp = interaction.fields.getTextInputValue('bp');
            const temp = interaction.fields.getTextInputValue('temp');

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

        // PATIENT INFO
        if (interaction.customId === 'patient_modal') {

            const username = interaction.fields.getTextInputValue('username');
            const room = interaction.fields.getTextInputValue('room');
            const admit = interaction.fields.getTextInputValue('admit');
            const discharge = interaction.fields.getTextInputValue('discharge');
            const complaint = interaction.fields.getTextInputValue('complaint');
            const age = interaction.fields.getTextInputValue('age');
            const weight = interaction.fields.getTextInputValue('weight');
            const history = interaction.fields.getTextInputValue('history');

            embed.setDescription(
embed.data.description.replace(
/ROOM NUMBER[\s\S]*------------------------------------/,
`PATIENT USERNAME - ${username}

ROOM NUMBER - ${room}

ADMITTED BY & TIME - ${admit}

DISCHARGED BY & TIME - ${discharge}

------------------------------------

CHIEF COMPLAINT - ${complaint}
AGE - ${age}
WEIGHT - ${weight}
HISTORY - ${history}

------------------------------------`
)
            );

            return interaction.update({ embeds: [embed] });
        }
    }

    if (!interaction.isChatInputCommand()) return;

    if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
        return interaction.reply({ content: '❌ No permission', ephemeral: true });
    }

    // CREATE FORM
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
                .setCustomId('update_patient')
                .setLabel('Update Patient Info')
                .setStyle(ButtonStyle.Success),

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
