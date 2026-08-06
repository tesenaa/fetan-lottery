import { Bot, InlineKeyboard } from 'grammy';
import dotenv from 'dotenv';

dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
export const bot = botToken ? new Bot(botToken) : null;

if (bot) {
  bot.command('start', async (ctx) => {
    const webAppUrl = process.env.WEB_APP_URL || 'http://localhost:5173';
    const keyboard = new InlineKeyboard().webApp('🎯 ጨዋታውን ጀምር (Play Now)', webAppUrl);

    await ctx.reply(
      'እንኳን ወደ Fetan Lottery በደህና መጡ! 🎯\n\nከታች ያለውን ቁልፍ ተጫነው የሎተሪ ቦርዱን በመክፈት ቁጥር መምረጥ ይችላሉ።',
      { reply_markup: keyboard }
    );
  });

  bot.catch((err) => {
    console.error('Telegram Bot Error:', err);
  });
} else {
  console.log('TELEGRAM_BOT_TOKEN አልተዋቀረም፤ ቦቱ ሳይነሳ አገልጋዩ ብቻ ይሰራል።');
}