import { CacheType, Client, CommandInteraction, MessageEmbed } from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";
import { ChampionMasteryDTO, MatchDto, MatchV5DTOs, SummonerLeagueDto, SummonerV4DTO } from "twisted/dist/models-dto";
import { LolUtils } from "../../lol/utils";
import { Handler } from "../handler";

export const clashHandler: Handler = {
  name: "clash",
  description: "Analysiert ein Clash Team.",
  options: [
    {
      type: ApplicationCommandOptionTypes.STRING.valueOf(),
      name: "member",
      description: "Der Name eines Teammitgliedes.",
      required: true,
    },
    {
      type: ApplicationCommandOptionTypes.INTEGER.valueOf(),
      name: "depth",
      description: "Die Anzahl an Matches, die abgerufen werden pro Teammitglied",
      required: false,
    },
  ],
  execute: async function (client: Client<boolean>, lolUtils: LolUtils, interaction: CommandInteraction<CacheType>): Promise<void> {
    interaction.deferReply();

    const ddragonVer = await lolUtils.getLatestDataDragonVersion();

    let profile: {
      summoner: SummonerV4DTO;
      league: SummonerLeagueDto[];
    };

    try {
      profile = await lolUtils.getCompleteSummonerProfile(interaction.options.getString("name", true));
    } catch (e) {
      const errorEmbed = new MessageEmbed()
        .setColor("#ED254E")
        .setTitle(`:boom: An error occured!`)
        .setDescription(`Couldn't find the player you were searching for.`);

      interaction.editReply({ embeds: [errorEmbed] });
      return;
    }

    const matchCount = interaction.options.getInteger("depth") || 5;

    const mastery = await lolUtils.getMasteryPoints(profile.summoner.id);
    const matches = await lolUtils.getMostUsedChampions(profile.summoner.puuid, matchCount);

    let masteryString = "";

    for (let i = 0; i < mastery.length && i < 10; i++) {
      masteryString += `${i + 1}. ${mastery[i].champion.name} - Lvl ${mastery[i].championLevel} (${mastery[i].championPoints} Points)\n`;
    }

    const fields = [
      { name: ":rosette: Level", value: `➤ ${profile.summoner.summonerLevel.toString()}`, inline: true },
      {
        name: ":trophy: Rank",
        value: `➤ ${profile.league[0].tier} ${profile.league[0].rank} (${profile.league[0].leaguePoints} LP)`,
        inline: true,
      },
      { name: ":tada: Ranked Stats", value: `➤ ${profile.league[0].wins} Wins / ${profile.league[0].losses} Losses`, inline: true },
      { name: ":medal: Mastery", value: masteryString, inline: true },
      { name: `:golf: Last Matches (0 out of ${matchCount})`, value: "Loading...", inline: false },
    ];

    const profileEmbed = new MessageEmbed()
      .setColor("#F9DC5C")
      .setTitle(`${profile.summoner.name}`)
      .setThumbnail(`https://ddragon.leagueoflegends.com/cdn/${ddragonVer}/img/profileicon/${profile.summoner.profileIconId}.png`)
      .setDescription(``)
      .setFooter({ text: "Analyzed by Acrys", iconURL: "https://cdn.lexlab.duckdns.org/moron/logo.png" })
      .setTimestamp()
      .addFields(fields);

    interaction.editReply({ embeds: [profileEmbed], content: ":satellite: Retrieving information...\n" });

    let matchesCompared = 0;

    matches.subscribe({
      next(mostUsedChamps) {
        matchesCompared++;

        let matchString = "";
        let idsSorted = Object.keys(mostUsedChamps).sort((a, b) => mostUsedChamps[b].used - mostUsedChamps[a].used);

        for (let i = 0; i < idsSorted.length && i < 10; i++) {
          const champion = mostUsedChamps[idsSorted[i]];
          matchString += `${i + 1}. ${champion.champName} (${((champion.used / matchesCompared) * 100).toFixed(2)}%)\n`;
        }

        fields[4] = { name: `:golf: Last Matches (${matchesCompared} out of ${matchCount})`, value: matchString, inline: true };

        interaction.editReply({
          embeds: [profileEmbed.setFields(fields)],
        });
      },
      error(error) {
        interaction.editReply({ content: error });
      },
      complete() {
        interaction.editReply(":white_check_mark: Done!");
      },
    });
  },
};
