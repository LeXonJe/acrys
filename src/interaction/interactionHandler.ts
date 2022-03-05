import { Client, Interaction } from "discord.js";
import { LolUtils } from "../lol/utils";
import { Handler } from "./handler";

export class InteractionSystem {
  private client: Client;
  private lolUtils: LolUtils;
  private commands: Map<string, Handler>;

  constructor(client: Client, lolUtils: LolUtils) {
    this.client = client;
    this.lolUtils = lolUtils;
    this.commands = new Map();
  }

  registerCommand(command: Handler) {
    this.commands.set(command.name, command);
  }

  handleInteraction(interaction: Interaction) {
    if (!interaction.isCommand()) return;

    const command = this.commands.get(interaction.commandName);

    if (!command) {
      interaction.reply(":x: An error has occured while getting the command handler.");
      return;
    }

    command.execute(this.client, this.lolUtils, interaction);
  }
}
