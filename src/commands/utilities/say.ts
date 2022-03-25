import type { Command } from 'src/types';
import { SlashCommandBuilder } from '@discordjs/builders';
import { getInfoFromCommandInteraction, checkMessageErrors } from 'src/discord-utils';

const commandBuilder = new SlashCommandBuilder();
commandBuilder
  .setName('say')
  .setDescription('Sends a message.')
  .addStringOption(option => option
    .setName('message')
    .setDescription('The message')
    .setRequired(true));

const SayCommand: Command = {
  guildOnly: false,
  slashCommandData: commandBuilder,
  runCommand: async interaction => {
    await interaction.deferReply({ ephemeral: true });
    const message = interaction.options.getString('message', true);

    const { channel, author } = await getInfoFromCommandInteraction(interaction, { ephemeral: true });

    if (!channel) throw new Error('Could not find channel.');
    if (!author) throw new Error('Could not find author.');

    // Throws if there is an issue
    checkMessageErrors(interaction, {
      channel,
      author,
      message,
    });

    await channel.send(message);
    await interaction.editReply('Sent.');
  },
};

export default SayCommand;