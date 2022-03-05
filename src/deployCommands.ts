import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes, RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v9";
import { config as env } from "dotenv";
import { Handler } from "./interaction/handler";
import { inspectHandler } from "./interaction/handlers/inspectHandler";

env();

const clientId = process.env.DISCORD_ID;
const guildId = process.env.DISCORD_DEV_GUILD;
const token = process.env.DISCORD_TOKEN;

if (!(clientId && guildId && token)) {
  console.log("Missing env vars.");
  process.exit();
}

function formatHandler(handler: Handler): RESTPostAPIApplicationCommandsJSONBody {
  return {
    name: handler.name,
    description: handler.description || "",
    options: handler.options,
  };
}

const commands: RESTPostAPIApplicationCommandsJSONBody[] = [formatHandler(inspectHandler)];

const rest = new REST({ version: "9" }).setToken(token);

rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);
