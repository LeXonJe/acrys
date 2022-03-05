import { CacheType, Client, CommandInteraction, MessageEmbed } from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";
import { MatchDto, MatchV5DTOs } from "twisted/dist/models-dto";
import { LolUtils } from "../../lol/utils";
import { Handler } from "../handler";

export const inspectHandler: Handler = {
  name: "inspect",
  description: "Analysiert einen League Spieler.",
  options: [
    {
      type: ApplicationCommandOptionTypes.STRING.valueOf(),
      name: "name",
      description: "Der Name des Spielers",
      required: true,
    },
  ],
  execute: async function (client: Client<boolean>, lolUtils: LolUtils, interaction: CommandInteraction<CacheType>): Promise<void> {
    interaction.deferReply();

    const ddragonVer = await lolUtils.getLatestDataDragonVersion();

    const profile = await lolUtils.getCompleteSummonerProfile(interaction.options.getString("name", true));

    const matches = await lolUtils.retrieveMatchInformation(profile.summoner.puuid, 50);

    const profileEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle(profile.summoner.name)
      .setThumbnail(`https://ddragon.leagueoflegends.com/cdn/${ddragonVer}/img/profileicon/${profile.summoner.profileIconId}.png`)
      .setDescription(`${profile.league[0].wins} Wins / ${profile.league[0].losses} Losses`)
      .setFields(
        { name: "Level", value: profile.summoner.summonerLevel.toString(), inline: true },
        { name: "Rank", value: `${profile.league[0].tier} (${profile.league[0].leaguePoints} LP)`, inline: true },
        { name: "Matches", value: `Loading Matchinfo...`, inline: false }
      );

    interaction.editReply({ embeds: [profileEmbed] });

    let matchString = "";
    const matchList: MatchV5DTOs.MatchDto[] = [];

    matches.subscribe({
      next(match) {
        matchList.push(match);
        matchString += `${match.info.participants[0].riotIdName} (${match.info.gameId})\n`;

        interaction.editReply({
          embeds: [
            profileEmbed.setFields(
              { name: "Level", value: profile.summoner.summonerLevel.toString(), inline: true },
              { name: "Rank", value: `${profile.league[0].tier} (${profile.league[0].leaguePoints} LP)`, inline: true },
              { name: "Matches", value: matchString, inline: false }
            ),
          ],
        });
      },
      error(error) {
        interaction.editReply({ content: error });
      },
      complete() {
        interaction.editReply("Done!");
      },
    });
  },
};
