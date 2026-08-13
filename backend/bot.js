import { Bot, InlineKeyboard } from 'grammy';
import dotenv from 'dotenv';

dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE_URL = process.env.BACKEND_URL || 'https://fetan-lottery-backend.onrender.com';
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://fetan-lottery.vercel.app';
const TELEBIRR_NUMBER = process.env.TELEBIRR_NUMBER || '0920790583';

// የባነር ምስልህ ሊንክ
const BANNER_IMAGE_URL = process.env.BANNER_IMAGE_URL || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800';

export const bot = botToken ? new Bot(botToken) : null;

if (bot) {
  // 1. ከታች ግራ በኩል ሰማያዊውን "≡ Menu" በተን ማዘጋጀት
  await bot.api.setMyCommands([
    { command: "start", description: "ዋና ሜኑን ለመክፈት" },
    { command: "help", description: "እርዳታ ለማግኘት" }
  ]);

  // 2. Menu Button ሲነካ ቀጥታ Web App እንዲከፍት ማድረግ
  await bot.api.setChatMenuButton({
    menu_button: {
      type: 'web_app',
      text: 'Play 🎮',
      web_app: { url: WEB_APP_URL }
    }
  });

  // 3. Inline Keyboard (ከመልእክቱ ስር ተያይዘው የሚመጡ በተኖች)
  const mainInlineMenu = new InlineKeyboard()
    .webApp('Play 🎮', WEB_APP_URL).text('Register 📝', 'register').row()
    .text('Check Balance 💵', 'check_balance').text('Deposit 💵', 'deposit').row()
    .text('Contact Support ☎️', 'support').text('Instruction 📖', 'instruction').row()
    .text('Transfer 🎁', 'transfer').text('Withdraw 🤑', 'withdraw').row()
    .text('Invite 🔗', 'invite').text('Convert Bonus 💱', 'convert');

  // 4. /start ትእዛዝ ሲላክ
 bot.command('start', async (ctx) => {
    const userId = String(ctx.from?.id);
    const firstName = ctx.from?.first_name || '';
    const username = ctx.from?.username || '';

    // የተጠቃሚውን መረጃ መመዝገብ
    try {
      await fetch(`${API_BASE_URL}/api/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, firstName, username })
      });
    } catch (err) {
      console.error('Registration fetch error:', err);
    }

    const captionText = `👋 Welcome to Fetan Lottery! Choose an option below.\n\n` +
                        `እንኳን ወደ Fetan Lottery በደህና መጡ! ከታች ያሉትን ቁልፎች በመጠቀም ጨዋታውን መጫወት ይችላሉ።`;

    // ቪዲዮው ላይ እንደሚታየው ምስሉን ከነ Inline Buttons መላክ
    try {
      await ctx.replyWithPhoto(BANNER_IMAGE_URL, {
        caption: captionText,
        reply_markup: mainInlineMenu
      });
    } catch (err) {
      await ctx.reply(captionText, { reply_markup: mainInlineMenu });
    }
  });

  // --- 5. INLINE BUTTON HANDLERS ---

  // Check Balance 💵
  bot.callbackQuery('check_balance', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = String(ctx.from?.id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user?id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const mainWallet = data.mainWallet || 0;
        const playWallet = data.playWallet || 0;

        await ctx.reply(
          `💰 *የእርስዎ የሂሳብ መጠን (Balance)*:\n\n` +
          `• *Main Wallet:* ${mainWallet} ETB\n` +
          `• *Play Wallet:* ${playWallet} ETB`,
          { parse_mode: 'Markdown' }
        );
      } else {
        await ctx.reply('⚠️ የመረጃ ስህተት አጋጥሟል። እባክዎን ቦቱን እንደገና /start በሉ።');
      }
    } catch (err) {
      await ctx.reply('❌ የኔትወርክ ስህተት አጋጥሟል። እባክዎን ቆየት ብለው ይሞክሩ።');
    }
  });

  // Register 📝
  // Register 📝 በተን ሲነካ አውቶማቲክ መመዝገብ
  bot.callbackQuery('register', async (ctx) => {
    await ctx.answerCallbackQuery();
    
    const userId = String(ctx.from?.id);
    const firstName = ctx.from?.first_name || '';
    const username = ctx.from?.username || '';

    try {
      const res = await fetch(`${API_BASE_URL}/api/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, firstName, username })
      });

      if (res.ok) {
        await ctx.reply(
          `🎉 *በስኬት ተመዝግበዋል!*\n\n` +
          `አሁን መጫወት ለመጀመር የሚከተሉትን ደረጃዎች ይከተሉ፡\n` +
         ` 1️⃣ *Deposit 💵* የሚለውን ተጭነው ሂሳብዎን ይሙሉ\n` +
         ` 2️⃣ *Play 🎮* የሚለውን ተጭነው ጨዋታውን ይጀምሩ!`,
          { parse_mode: 'Markdown' }
        );
      } else {
        await ctx.reply(
         `ℹ️ *ቀደም ሲል ተመዝግበዋል!*\n\n` +
          `አሁኑኑ መጫወት ለመጀመር *Play 🎮* የሚለውን ይጫኑ ወይም *Deposit 💵* በማድረግ ሂሳብዎን ይሙሉ፤`,
          { parse_mode: 'Markdown' }
        );
      }
    } catch (err) {
      console.error('Registration Error:', err);
      await ctx.reply('❌ የምዝገባ ስህተት አጋጥሟል። እባክዎን እንደገና ይሞክሩ።');
    }
  });
  // Deposit 💵
  bot.callbackQuery('deposit', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `📥 *ገንዘብ ገቢ ማድረጊያ (Telebirr Deposit)*\n\n` +
      `ገንዘብ ገቢ ለማድረግ በሚከተለው የቴሌብር ቁጥር ያስገቡ፡\n\n` +
      `📱 *Telebirr Number:* ${TELEBIRR_NUMBER}\n\n` +
      `ክፍያውን እንደፈፀሙ የወጣውን የትራንዛክሽን SMS/ID ለቀጥታ ረዳታችን ይላኩ።`,
      { parse_mode: 'Markdown' }
    );
  });

  // Withdraw 🤑
  bot.callbackQuery('withdraw', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = String(ctx.from?.id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user?id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const mainWallet = data.mainWallet || 0;

        await ctx.reply(
          `📤 *ገንዘብ ማውጫ (Withdrawal)*\n\n` +
          `• *ያልዎት ቀሪ ሂሳብ:* ${mainWallet} ETB\n` +
          `• *አነስተኛ ወጪ ማድረጊያ:* 50 ETB\n\n` +
          `ገንዘብ ለማውጣት በ WebApp ውስጥ ያለውን Wallet ገፅ ይጠቀሙ ወይም አስተዳዳሪውን ያናግሩ።`,
          { parse_mode: 'Markdown' }
        );
      }
    } catch (err) {
      await ctx.reply('❌ የኔትወርክ ስህተት አጋጥሟል።');
    }
  });

  // Invite 🔗
  bot.callbackQuery('invite', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    const inviteLink = `https://t.me/fetan_lottery_bot?start=${userId}`;
    await ctx.reply(
      `🔗 *የእርስዎ ልዩ የሪፌራል ሊንክ*:\n\n${inviteLink}\n\n` +
      `ይህንን ሊንክ ለጓደኞችዎ በመላክ የእያንዳንዱ ጋበዙት ተጫዋች ቦነስ ያግኙ!`,
      { parse_mode: 'Markdown' }
    );
  });

  // Support ☎️
  bot.callbackQuery('support', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('☎️ ለአስተያየት እና ለተጨማሪ እርዳታ በቴሌግራም ያውሩን፡ @fetan_support_admin');
  });

  // Instruction 📖
  bot.callbackQuery('instruction', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `📖 *የጨዋታው መመሪያ*:\n\n` +
      `1. "Play 🎮" የሚለውን ተጭነው WebApp ይክፈቱ።\n` +
      `2. የሚወዱትን የሎተሪ ቁጥር ይምረጡ።\n` +
      `3. ሰዓቱ ሲያልቅ እጣው በቀጥታ ይወጣል፤ ካሸነፉ ገንዘቡ ወዲያውኑ ወደ Main Walletዎ ገቢ ይሆናል።`,
      { parse_mode: 'Markdown' }
    );
  });

  // Transfer 🎁
  bot.callbackQuery('transfer', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('🎁 ለሌላ ተጫዋች ገንዘብ ለማስተላለፍ በ WebApp ውስጥ ያለውን Transfer ገፅ ይጠቀሙ።');
  });

  // Convert Bonus 💱
  bot.callbackQuery('convert', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('💱 Play Wallet ቦነስን ወደ Main Wallet ለመቀየር አነስተኛው መጠን 100 ETB መሆን አለበት።');
  });

  bot.catch((err) => {
    console.error('Telegram Bot Error:', err);
  });
} else {
  console.log('TELEGRAM_BOT_TOKEN አልተዋቀረም፤ ቦቱ ሳይነሳ አገልጋዩ ብቻ ይሰራል።');
}