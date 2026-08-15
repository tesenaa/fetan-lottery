import { Bot, InlineKeyboard, Keyboard } from 'grammy';
import dotenv from 'dotenv';

dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE_URL = process.env.BACKEND_URL || 'https://fetan-lottery-backend.onrender.com';
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://fetan-lottery.vercel.app';
const TELEBIRR_NUMBER = process.env.TELEBIRR_NUMBER || '0920790583';
const BANNER_IMAGE_URL = process.env.BANNER_IMAGE_URL || 'https://i.ibb.co/RpmMcWYt/F-20260814-095812-0000.png';

export const bot = botToken ? new Bot(botToken) : null;

// User State (ለ Deposit ፍሰት መከታተያ)
const userStates = {};

if (bot) {
  // 1. "≡ Menu" በተን ማዘጋጀት
  bot.api.setMyCommands([
    { command: "start", description: "ዋና ሜኑን ለመክፈት" },
    { command: "help", description: "እርዳታ ለማግኘት" }
  ]).catch(err => console.error('Menu setup error:', err));

  // 2. Chat Menu Button ቀጥታ Web App እንዲከፍት ማድረግ
  bot.api.setChatMenuButton({
    menu_button: {
      type: 'web_app',
      text: 'Play 🎮',
      web_app: { url: WEB_APP_URL }
    }
  }).catch(err => console.error('ChatMenuButton error:', err));

  // 3. Main Inline Keyboard Menu
  const mainInlineMenu = new InlineKeyboard()
    .webApp('Play 🎮', WEB_APP_URL).text('Register 📝', 'register').row()
    .text('Check Balance 💵', 'check_balance').text('Deposit 💵', 'deposit').row()
    .text('Contact Support ☎️', 'support').text('Instruction 📖', 'instruction').row()
    .text('Transfer 🎁', 'transfer').text('Withdraw 🤑', 'withdraw').row()
    .text('Invite 🔗', 'invite').text('Convert Bonus 💱', 'convert');

  // 4. /start Command
  bot.command('start', async (ctx) => {
    const userId = String(ctx.from?.id);
    const firstName = ctx.from?.first_name || '';
    const username = ctx.from?.username || '';
    const referrerId = ctx.match ? String(ctx.match).trim() : null;

    try {
      await fetch(`${API_BASE_URL}/api/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, firstName, username, referrerId })
      });
    } catch (err) {
      console.error('Registration fetch error:', err);
    }

    const captionText = `👋 Welcome to Fetan Lottery! Choose an option below.\n\nእንኳን ወደ Fetan Lottery በደህና መጡ! ከታች ያሉትን ቁልፎች በመጠቀም ጨዋታውን መጫወት ይችላሉ።`;

    try {
      await ctx.replyWithPhoto(BANNER_IMAGE_URL, {
        caption: captionText,
        reply_markup: mainInlineMenu
      });
    } catch (err) {
      console.error('Photo send error:', err);
      await ctx.reply(captionText, { reply_markup: mainInlineMenu });
    }
  });

  // --- 5. INLINE & TEXT BUTTON HANDLERS ---

  // Check Balance 💵 (Inline Button)
  bot.callbackQuery('check_balance', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = String(ctx.from?.id);
    const telegramName = ctx.from?.first_name + (ctx.from?.last_name ? ' ' + ctx.from?.last_name : '');
    
    let phone = "አልተመዘገበም";
    let mainWallet = 0;
    let playWallet = 0.0;
    let coin = 0;

    try {
      const res = await fetch(`${API_BASE_URL}/api/user?id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        phone = data.phone || phone;
        mainWallet = data.mainWallet || 0;
        playWallet = data.playWallet || 0.0;
        coin = data.coin || 0;
      }
    } catch (apiErr) {
      console.log("API Fetch Error (Using default/local values)");
    }

    const accountInfoText = 
`💼 Account Info

\`\`\`
Name:         ${telegramName}
Phone:        ${phone}
Main wallet:  ${mainWallet}
Play wallet:  ${Number(playWallet).toFixed(1)}
Coin:         ${coin}
\`\`\``;

    const balanceMenu = new InlineKeyboard()
      .text("📋 COPY CODE", `copy_${userId}`).row()
      .text("💵 Deposit", "deposit").text("🤑 Withdraw", "withdraw");

    await ctx.reply(accountInfoText, {
      parse_mode: 'Markdown',
      reply_markup: balanceMenu
    });
  });

  // Register 📝 (Inline Button)
  bot.callbackQuery('register', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = String(ctx.from?.id);
               try {
      const res = await fetch(`${API_BASE_URL}/api/user?id=${userId}&userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const userObj = data.user || data;
        
        // ስልክ ቁጥሩ በዳታቤዝ ውስጥ መኖር አለመኖሩን ማረጋገጥ
        if (userObj && userObj.phone && userObj.phone !== "አልተመዘገበም" && String(userObj.phone).trim() !== "") {
          await ctx.reply(
            "ℹ️ *ቀደም ሲል ተመዝግበዋል!*\n\n" +
            "አሁኑኑ መጫወት ለመጀመር *Play 🎮* የሚለውን ይጫኑ ወይም *Deposit 💵* በማድረግ ሂሳብዎን ይሙሉ፤",
            { 
              parse_mode: 'Markdown',
              reply_markup: { remove_keyboard: true }
            }
          );
          return;
        }
      }

      // ስልክ ካልተመዘገበ ብቻ Share Contact መጠየቅ
      const contactKeyboard = new Keyboard()
        .requestContact("📱 ስልክ ቁጥር አጋራ (Share Contact)")
        .resized()
        .oneTime();

      await ctx.reply("እባክዎን ምዝገባዎን ለማጠናቀቅ ከታች ያለውን 'Share Contact' ቁልፍ ይጫኑ፡", {
        reply_markup: contactKeyboard
      });

    } catch (err) {
      console.error('Registration Error:', err);
      await ctx.reply('❌ የምዝገባ ስህተት አጋጥሟል። እባክዎን እንደገና ይሞክሩ።');
    }
  });

  // Deposit 💵 (Inline Button)
  bot.callbackQuery('deposit', async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = ctx.chat.id;
    userStates[chatId] = { step: 'AWAITING_AMOUNT' };
    await ctx.reply("💰 ማስገባት የሚፈልጉትን መጠን ከ10 ብር ጀምሮ ያስገቡ::");
  });

  // Withdraw 🤑 (Inline & Text Handler)
  const handleWithdraw = async (ctx) => {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    const userId = String(ctx.from?.id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user?id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const mainWallet = data.mainWallet || 0;

        const withdrawMessage = 
          `📤 *ገንዘብ ማውጫ (Withdrawal)*\n\n` +
          `• *ያልዎት ቀሪ ሂሳብ:* ${mainWallet} ETB\n` +
          `• *አነስተኛ ወጪ ማድረጊያ:* 50 ETB\n\n` +
          `ገንዘብ ለማውጣት በ WebApp ውስጥ ያለውን Wallet ገፅ ይጠቀሙ ወይም አስተዳዳሪውን ያናግሩ።`;

        await ctx.reply(withdrawMessage, { parse_mode: 'Markdown' });
      } else {
        await ctx.reply('❌ የተጠቃሚ መረጃ ማግኘት አልተቻለም።');
      }
    } catch (err) {
      console.error('Withdraw Error:', err);
      await ctx.reply('❌ የኔትወርክ ስህተት አጋጥሟል።');
    }
  };

  bot.callbackQuery('withdraw', handleWithdraw);
  bot.hears(['Withdraw 🤑', 'Withdraw', '/withdraw'], handleWithdraw);

  // Invite 🔗 (Inline & Text Handler)
  const handleInvite = async (ctx) => {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    try {
      const userId = ctx.from?.id;
      const botUsername = ctx.me?.username || 'fetanlottery_bot';
      
      const inviteLink = `https://t.me/${botUsername}?start=${userId}`;
      const shareText = "🎉 ና ወደ Fetan Lottery እንጫወት! በዚህ ሊንክ ስትመዘገብ የ 10 ETB ነፃ ቦነስ ታገኛለህ፦";
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;

      const inviteMessage = `🔗 *ለጓደኞችዎ ያጋሩ እና ነፃ ቦነስ ያግኙ!*\n\n` +
                            `🎁 *የእርስዎ መጋበዣ ሊንክ:*\n\${inviteLink}\ \n\n` +
                            `💡 *ጥቅሙ:* ጓደኛዎ በእርስዎ ሊንክ ሲመዘገብ ለእርስዎ *10 ETB* ቦነስ በ Play Wallet ላይ ይጨመርልዎታል!`;

      const shareKeyboard = new InlineKeyboard()
        .url("📩 ለጓደኛ Share አድርግ", shareUrl);

      await ctx.reply(inviteMessage, {
        parse_mode: 'Markdown',
        reply_markup: shareKeyboard
      });
    } catch (error) {
      console.error("Error handling invite command:", error);
    }
  };

  bot.callbackQuery('invite', handleInvite);
  bot.hears([/Invite/i, '/invite'], handleInvite);

  // Support ☎️
  bot.callbackQuery('support', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('☎️ ለአስተያየት እና ለተጨማሪ እርዳታ በቴሌግራም ያውሩን፡ @Fetanlotterysupport');
  });
  // Instruction 📖
  bot.callbackQuery('instruction', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `📖 *የጨዋታው መመሪያ*:\n\n` +
      `1."Register 📝" የሚለውን ተጭነው ይመዝገቡ\n` +
      `2."Deposit 💵" የሚለውን ተጭነው ወደ ዋሌት ብር ያስቀምጡ\n` +
      `3. "Play 🎮" የሚለውን ተጭነው WebApp ይክፈቱ።\n` +
      `4. የሚወዱትን የሎተሪ ቁጥር ይምረጡ።\n` +
      `5. ሰዓቱ ሲያልቅ እጣው በቀጥታ ይወጣል፤ ካሸነፉ ገንዘቡ ወዲያውኑ ወደ Main Walletዎ ገቢ ይሆናል።`,
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

  // Copy Code Callback Handler
  bot.callbackQuery(/^copy_/, async (ctx) => {
    await ctx.answerCallbackQuery({ text: "Code Copied!", show_alert: false });
  });

  // Telebirr / Cancel Payment Callbacks
  bot.callbackQuery(/^pay_telebirr_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = ctx.chat.id;
    const amount = ctx.callbackQuery.data.split("_")[2];
    userStates[chatId] = { step: 'AWAITING_SMS', amount: amount };

    const instructionsText = `የሚያጋጥሟችሁ የክፍያ ችግር:@Fetanlotterysupport ላይ ፃፉልን::

1. ከታች ባለው የቴሌብር አካውንት ${amount} ብር ያስገቡ

 Phone: ${TELEBIRR_NUMBER}

2. የከፈሉበትን አጭር የፅሁፍ መልዕክት(message) copy በማድረግ እዚ ላይ Past አድርገው ይላኩና ይላኩ👇👇👇`;

    const shareContactKeyboard = new Keyboard()
      .requestContact("📞 Share contact")
      .resized()
      .oneTime();

    await ctx.reply(instructionsText, {
      reply_markup: shareContactKeyboard
    });
  });

  bot.callbackQuery('cancel_deposit', async (ctx) => {
    const chatId = ctx.chat.id;
    delete userStates[chatId];
    await ctx.answerCallbackQuery({ text: "ተሰርዟል!" });
    await ctx.reply("❌ የዲፖዚት ሂደቱ ተሰርዟል።");
  });

  // --- 6. EVENT LISTENERS ---

  // 📱 Contact Listener (ስልክ ቁጥር ሲላክ)
  bot.on(':contact', async (ctx) => {
    const userId = String(ctx.from?.id);
    let phoneNumber = ctx.message.contact.phone_number;

    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+' + phoneNumber;
    }

    try {
      const updateRes = await fetch(`${API_BASE_URL}/api/user/update-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId, 
          telegramId: userId, 
          phone: phoneNumber, 
          phoneNumber: phoneNumber 
        })
      });

      const updateData = await updateRes.json().catch(() => ({}));
      console.log('Update Phone Response:', updateData);

      await ctx.reply(
        "🎉 *ምዝገባዎ በስኬት ተጠናቋል!*\n\n📱 ስልክ ቁጥርዎ፦ " + phoneNumber + " ተመዝግቧል።",
        {
          parse_mode: 'Markdown',
          reply_markup: { remove_keyboard: true }
        }
      );

    } catch (err) {
      console.error('Phone update fetch error:', err);
      await ctx.reply(
        "🎉 *ምዝገባዎ በስኬት ተጠናቋል!*\n\n📱 ስልክ ቁጥርዎ፦ " + phoneNumber + " ተመዝግቧል።",
        {
          parse_mode: 'Markdown',
          reply_markup: { remove_keyboard: true }
        }
      );
    }
  });

  // 💬 TEXT MESSAGE LISTENER (ለ DEPOSIT FLOW)
  bot.on('message:text', async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;

    if (text.startsWith('/start')) return;

    // AWAITING AMOUNT (የዲፖዚት መጠን መቀበያ)
    if (userStates[chatId] && userStates[chatId].step === 'AWAITING_AMOUNT') {
      const amount = parseInt(text);
      if (isNaN(amount) || amount < 10) {
        await ctx.reply("⚠️ እባክዎን ትክክለኛ መጠን ያስገቡ (ከ10 ብር ጀምሮ)።");
        return;
      }

      userStates[chatId] = { step: 'SELECT_METHOD', amount: amount };

      const paymentOptionMessage = 
`✦ ብር ማስገባት የሚችሉት አሁን በተቀመጠዉ የTelebirr አካዉንት ብቻ ነዉ::
🚫 ከዚህ ውጭ የላከ አንስተናግድም 🚫
👇 Telebirr የሚለውን ይምረጡ 👇`;

      const paymentKeyboard = new InlineKeyboard()
        .text("Telebirr", `pay_telebirr_${amount}`).row()
        .text("❌ Cancel", "cancel_deposit");
         await ctx.reply(paymentOptionMessage, {
        reply_markup: paymentKeyboard
      });
      return;
    }

    // AWAITING SMS (የቴሌብር SMS መቀበያ)
    if (userStates[chatId] && userStates[chatId].step === 'AWAITING_SMS') {
      delete userStates[chatId];
      await ctx.reply("✅ ጥያቄዎ ደርሶናል! የላኩት የክፍያ ማረጋገጫ ተመርምሮ በአጭር ጊዜ ውስጥ ሂሳብዎ ላይ ገቢ ይደረጋል።");
      return;
    }
  });

  bot.catch((err) => {
    console.error('Telegram Bot Error:', err);
  });
} else {
  console.log('TELEGRAM_BOT_TOKEN አልተዋቀረም፤ ቦቱ ሳይነሳ አገልጋዩ ብቻ ይሰራል።');
}