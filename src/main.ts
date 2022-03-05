import { Logger } from "tslog";
import { config as env } from "dotenv";
import { Client, Intents } from "discord.js";
import { Constants, LolApi } from "twisted";
import { InteractionSystem } from "./interaction/interactionHandler";
import { inspectHandler } from "./interaction/handlers/inspectHandler";
import { LolUtils } from "./lol/utils";

env();

const logger = new Logger({
  displayFunctionName: false,
  displayLoggerName: false,
});

async function bootstrap() {
  logger.info("Starting bot...");

  if (!process.env.RIOT_API_KEY) {
    logger.fatal("Kein RIOT_API_KEY gefunden!");
    return;
  }

  const lolApi = new LolApi({
    rateLimitRetryAttempts: 3,
    key: process.env.RIOT_API_KEY,
  });

  const lolUtils = new LolUtils(lolApi, Constants.Regions.EU_WEST, Constants.RegionGroups.EUROPE);

  const bot = new Client({ intents: Intents.FLAGS.GUILDS });

  const interactionSystem = new InteractionSystem(bot, lolUtils);

  interactionSystem.registerCommand(inspectHandler);

  bot.on("interactionCreate", (interaction) => interactionSystem.handleInteraction(interaction));

  bot.on("error", (error) => {
    logger.error(error);
  });

  process.on("SIGINT", () => {
    logger.info("Stopping bot...");
    bot.destroy();
  });

  try {
    await bot.login(process.env.DISCORD_TOKEN);
  } catch (e) {
    logger.fatal(e);
  }
}

bootstrap();
