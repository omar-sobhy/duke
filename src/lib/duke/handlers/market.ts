import type { Duke } from '../duke.js';
import type { PrivmsgCommand } from '../privmsgCommand.js';
import { CommandHandler } from './CommandHandler.js';
import { searchItem } from '../modules/market/search.js';
import { fetchListings } from '../modules/market/listings.js';
import { calculateListingStats } from '../modules/market/stats.js';
import {  Colour, FormattingBuilder } from '../../irc/formatting.js';

export class MarketHandler extends CommandHandler {
  help(): string {
    const prefix = `${this.duke.config.privmsgCommandPrefix}${this.commandName}`;

    return `${prefix} <item name>`;
  }

  override readonly commandName = 'market';

  async match(duke: Duke, command: PrivmsgCommand): Promise<boolean> {
    return command.command.toLowerCase() === this.commandName;
  }

  async handle(duke: Duke, command: PrivmsgCommand): Promise<void> {
    if (command.params.length === 0) {
      return void command.privmsg.reply(this.help());
    }

    const prefixLength = this.commandName.length + duke.config.privmsgCommandPrefix.length;

    const itemName = command.privmsg.text.substring(prefixLength).trim();

    const searchResponse = await searchItem(itemName);

    if (searchResponse.type === 'error') {
      duke.config.logger.error(searchResponse);
      return void command.privmsg.reply(searchResponse.message);
    }

    if (searchResponse.data.length === 0) {
      return void command.privmsg.reply(`No results for item ${itemName}.`);
    }

    const promises = searchResponse.data.slice(0, 3).map(async (d) => {
      const buy = await fetchListings(d.slug, 'buy');
      const sell = await fetchListings(d.slug, 'sell');

      return {
        item: d,
        buyStats: buy.type === 'success' ? calculateListingStats(buy.data) : undefined,
        sellStats: sell.type === 'success' ? calculateListingStats(sell.data) : undefined,
      };
    });

    const results = await Promise.all(promises);

    const formattedItems = results.map((r) => {
      const builder = new FormattingBuilder('');

      const formatted = builder
        .colour(r.item.name, Colour.BLUE)
        .normal(' (')
        .colour('Buy ', Colour.RED)
        .normal(`Average: ${this.formatNumber(r.buyStats?.average)}, `)
        .normal(`Min: ${this.formatNumber(r.buyStats?.min)}, `)
        .normal(`Max: ${this.formatNumber(r.buyStats?.max)} -- `)
        .colour('Sell ', Colour.GREEN)
        .normal(`Average: ${this.formatNumber(r.sellStats?.average)}, `)
        .normal(`Min: ${this.formatNumber(r.sellStats?.min)}, `)
        .normal(`Max: ${this.formatNumber(r.sellStats?.max)})`).text;

      return formatted;
    });

    command.privmsg.reply(formattedItems.join(' :: '));
  }

  private formatNumber(n?: number): string {
    if (!n) {
      return 'N/A';
    }

    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(n);
  }
}
