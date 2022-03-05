import { Client, CommandInteraction } from "discord.js";
import { APIApplicationCommandOption } from "discord-api-types/v9";
import { LolUtils } from "../lol/utils";

export interface Handler {
  name: string;
  description?: string;
  options?: APIApplicationCommandOption[];
  execute: (client: Client, lolUtils: LolUtils, interaction: CommandInteraction) => void;
}
