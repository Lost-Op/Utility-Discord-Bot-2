import type { Command } from 'src/types';

import { SlashCommandBuilder } from '@discordjs/builders';
import { attachPlayerButtons } from './utils';
import sessions from './sessions';

const SkipCommand: Command = {
  guildOnly: true,
  slashCommandData: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current track.'),

  runCommand: async interaction => {
    await interaction.deferReply({ ephemeral: true });

    const session = sessions.get(interaction.guild!);
    if (!session) return interaction.editReply('Session does not exist.');

    await session.skip();
    const newTrack = await session.getCurrentTrack();
    if (!newTrack) return interaction.editReply('Skipped.');

    try {
      const { title } = await newTrack.getVideoDetails();
      await interaction.editReply(`Skipped. Now playing: ${title}`);
    } catch {
      await interaction.editReply('Skipped.');
    }
    attachPlayerButtons(interaction, session);
    return null;
  },
};

export default SkipCommand;