import { Bot, Keyboard } from 'grammy';
import dotenv from 'dotenv';

dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
export const bot = botToken ? new Bot(botToken) : null;

if (bot) {
  const webAppUrl = process.env.WEB_APP_URL || 'https://fetan-lottery-irkk.vercel.app';
  const TELEBIRR_NUMBER = process.env.TELEBIRR_NUMBER || '0920790583';

  // 1. Reply Keyboard (በምስሉ መሰረት የተቀናጀ)
  const mainMenu = new Keyboard()
    .webApp('Play 🎮', webAppUrl).text('Register 📝').row()
    .text('Check Balance 💵').text('Deposit 💵').row()
    .text('Contact Support ☎️').text('Instruction 📖').row()
    .text('Transfer 🎁').text('Withdraw 🤑').row()
    .text('Invite 🔗').text('Convert Bonus 💱')
    .resized()
    .persistent();

  // 2. /start ትእዛዝ
  bot.command('start', async (ctx) => {
    await ctx.reply(
      'እንኳን ወደ Fetan Lottery በደህና መጡ! 🎯\n\nከታች ያሉትን ቁልፎች በመጠቀም ጨዋታውን መጫወትና አገልግሎቶችን ማግኘት ይችላሉ።',
      { reply_markup: mainMenu }
    );
  });

  // 3. የቁልፎች ምላሾች (Handlers)

  // Register
  bot.hears('Register 📝', async (ctx) => {
    await ctx.reply('ለመመዝገብ "Play 🎮" የሚለውን በመጫን WebApp ውስጥ ዝርዝር መረጃዎን ይሙሉ ወይም ስልክ ቁጥርዎን ያጋሩ።');
  });

  // Check Balance
  bot.hears('Check Balance 💵', async (ctx) => {
    await ctx.reply(
      '💰 *የእርስዎ የሂሳብ መጠን (Balance)*:\n\nMain Wallet: 0.00 ETB\nPlay Wallet: 0.00 ETB',
      { parse_mode: 'Markdown' }
    );
  });

  // Deposit
  bot.hears('Deposit 💵', async (ctx) => {
    await ctx.reply(
      `📥 *ገንዘብ ገቢ ማድረጊያ (Telebirr deposit)*\n\n` +
     `እባክዎን ማስገባት የሚፈልጉትን ገንዘብ በሚከተለው Telebirr ቁጥር ይላኩ፡\n\n` +
      `📱 *Telebirr Number:* \${TELEBIRR_NUMBER}\\n\n` +
      `ገንዘቡን ከላኩ በኋላ Transaction ID/SMS ለስፖርት ይላኩ።`,
      { parse_mode: 'Markdown' }
    );
  });

  // Contact Support
  bot.hears('Contact Support ☎️', async (ctx) => {
    await ctx.reply('☎️ ለአስተያየት እና ለተጨማሪ እርዳታ በቴሌግራም ያውሩን፡ @fetan_support_admin');
  });

  // Instruction
  bot.hears('Instruction 📖', async (ctx) => {
    await ctx.reply(
      '📖 *የጨዋታው መመሪያ*:\n\n1. "Play 🎮" በመጫን ጨዋታውን ይጀምሩ።\n2. ቁጥር ይምረጡና እድልዎን ይሞክሩ።\n3. ከቀረቡት አማራጮች የቴሌብር ክፍያ በመፈጸም መጫወት ይችላሉ።',
      { parse_mode: 'Markdown' }
    );
  });

  // Transfer
  bot.hears('Transfer 🎁', async (ctx) => {
    await ctx.reply('🎁 ለሌላ ተጫዋች ገንዘብ ለማስተላለፍ የላኪውን User ID እና መጠን ያስገቡ።');
  });

  // Withdraw
  bot.hears('Withdraw 🤑', async (ctx) => {
    await ctx.reply('ወደ Telebirr Accountዎ ገንዘብ ለማውጣት የጠየቁት መጠን ከ 50 ETB በላይ መሆን አለበት።');
  });

  // Invite
  bot.hears('Invite 🔗', async (ctx) => {
    const userId = ctx.from?.id;
    const inviteLink = `https://t.me/fetan_lottery_bot?start=${userId}`;
    await ctx.reply(
      `🔗 *የእርስዎ የሪፌራል ሊንክ*:\n\n\${inviteLink}\\n\nይህንን ሊንክ ለጓደኞችዎ በመላክ ቦኑስ ያግኙ!`,
      { parse_mode: 'Markdown' }
    );
  });

  // Convert Bonus
  bot.hears('Convert Bonus 💱', async (ctx) => {
    await ctx.reply('💱 የሰበሰቡትን Bonus Wallet ወደ Main Balance ለመቀየር አነስተኛው መጠን 100 ETB መሆን አለበት።');
  });

  bot.catch((err) => {
    console.error('Telegram Bot Error:', err);
  });
} else {
  console.log('TELEGRAM_BOT_TOKEN አልተዋቀረም፤ ቦቱ ሳይነሳ አገልጋዩ ብቻ ይሰራል።');
}