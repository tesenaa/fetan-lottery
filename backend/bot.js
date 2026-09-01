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
  // 1. Bot Commands Menu ማዘጋጀት
  bot.api.setMyCommands([
    { command: "start", description: "Start" },
    { command: "register", description: "Register" },
    { command: "play", description: "Play" },
    { command: "deposit", description: "Deposit" },
    { command: "balance", description: "Balance" },
    { command: "withdraw", description: "Withdraw" },
    { command: "invite", description: "Invite" },
    { command: "instruction", description: "instruction" }
  ]).catch(err => console.error('Menu setup error:', err));

  // 2. Chat Menu Button ቀጥታ Commands እንዲያሳይ ማድረግ
  bot.api.setChatMenuButton({
    menu_button: {
      type: 'commands'
    }
  }).catch(err => console.error('ChatMenuButton error:', err));

  // 3. Main Inline Keyboard Menu — Play 🎮 button is built dynamically per-user
  //    (registered users get a direct WebApp button, unregistered users get the registration prompt)
  const buildMainMenu = (isRegistered) => {
    const kb = new InlineKeyboard();
    if (isRegistered) {
      kb.webApp('Play 🎮', WEB_APP_URL).text('Register 📝', 'register').row();
    } else {
      kb.text('Play 🎮', 'play').text('Register 📝', 'register').row();
    }
    kb.text('Check Balance 💵', 'check_balance').text('Deposit 💵', 'deposit').row()
      .text('Withdraw 🤑', 'withdraw').text('Invite 🔗', 'invite').row()
      .text('Instruction 📖', 'instruction').text('Contact Support ☎️', 'support').row()
      .text('Convert Bonus 💱', 'convert');
    return kb;
  };

  const isUserRegistered = async (userId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user?id=${userId}&userId=${userId}`);
      if (!res.ok) return false;
      const data = await res.json();
      const userObj = data.user || data;
      return !!(userObj && userObj.phone && userObj.phone !== "አልተመዘገበም" && String(userObj.phone).trim() !== "");
    } catch (err) {
      console.error('Registration check error:', err);
      return false;
    }
  };

  // የሜኑ መልእክቱን የሚልክ የተለመደ ተግባር (Function)
  const sendMainMenu = async (ctx) => {
    const captionText = "👋 Welcome to Fetan Lottery! Choose an option below.\n\nእንኳን ወደ Fetan Lottery በደህና መጡ! ከታች ያሉትን ቁልፎች በመጠቀም ጨዋታውን መጫወት ይችላሉ።";
    const userId = String(ctx.from?.id);
    const registered = await isUserRegistered(userId);
    const menu = buildMainMenu(registered);

    try {
      await ctx.replyWithPhoto(BANNER_IMAGE_URL, {
        caption: captionText,
        reply_markup: menu,
        disable_notification: false
      });
    } catch (err) {
      console.error('Photo send error:', err);
      await ctx.reply(captionText, { 
        reply_markup: menu,
        disable_notification: false 
      });
    }
  };

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

    await sendMainMenu(ctx);
  });

  // 5. /menu Command
  bot.command('menu', async (ctx) => {
    await sendMainMenu(ctx);
  });

  // --- 6. INLINE & TEXT BUTTON HANDLERS ---

  bot.callbackQuery('play', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = String(ctx.from?.id);

    try {
      const res = await fetch(`${API_BASE_URL}/api/user?id=${userId}&userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const userObj = data.user || data;

        if (userObj && userObj.phone && userObj.phone !== "አልተመዘገበም" && String(userObj.phone).trim() !== "") {
          const playKeyboard = new InlineKeyboard()
            .webApp("🎮 አሁኑኑ ተጫወት (Play Now)", WEB_APP_URL);

          await ctx.reply("🎯 ለመጫወት ዝግጁ ነዎት! ከታች ያለውን ቁልፍ ተጭነው ወደ ዌብአፕ በመግባት የሚፈልጉትን እስቴክ መርጠው ይጫወቱ፡", {
            reply_markup: playKeyboard,
            disable_notification: false
          });
          return;
        }
      }

      const contactKeyboard = new Keyboard()
        .requestContact("📱 ስልክ ቁጥር አጋራ (Share Contact)")
        .resized()
        .oneTime();

      await ctx.reply(
        "⚠️ ለመጫወት አስቀድመው መመዝገብ አለብዎት!\n\n" +
        "እባክዎን መጀመሪያ 'Register 📝' በማድረግ ወይም ከታች ያለውን '📱 ስልክ ቁጥር አጋራ (Share Contact)' ቁልፍ ተጭነው ስልክ ቁጥርዎን ያጋሩ፡",
        {
          reply_markup: contactKeyboard,
          disable_notification: false
        }
      );
    } catch (err) {
      console.error('Play Validation Error:', err);
      await ctx.reply('❌ የስህተት ምልክት አጋጥሟል። እባክዎን እንደገና ይሞክሩ።', { disable_notification: false });
    }
  });

  bot.callbackQuery('check_balance', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = String(ctx.from?.id);
    const telegramName = (ctx.from?.first_name || '') + (ctx.from?.last_name ? ' ' + ctx.from?.last_name : '');
    
    let phone = "አልተመዘገበም";
    let mainWallet = 0;
    let playWallet = 0.0;
    let coin = 0;
    let ticketPrice = 10;

    try {
      const res = await fetch(`${API_BASE_URL}/api/user?id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        phone = data.phone || "አልተመዘገበም";
        mainWallet = data.mainWallet || 0;
        playWallet = data.playWallet || 0.0;
        coin = data.coin || 0;
        if (data.ticketPrice) ticketPrice = data.ticketPrice;
      }
    } catch (apiErr) {
      console.log("API Fetch Error (Using default/local values)");
    }

    const accountInfoText = 
`💼 Account Info

Name:         ${telegramName}
Phone:        ${phone}
Main wallet:  ${mainWallet}
Play wallet:  ${Number(playWallet).toFixed(1)}
Coin:         ${coin}`;

    const balanceMenu = new InlineKeyboard()
      .text("📋 COPY CODE", `copy_${userId}`).row()
      .text("💵 Deposit", "deposit").text("🤑 Withdraw", "withdraw");

    await ctx.reply(accountInfoText, {
      reply_markup: balanceMenu,
      disable_notification: false
    });
  });

  bot.callbackQuery('register', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = String(ctx.from?.id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user?id=${userId}&userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const userObj = data.user || data;
        
        if (userObj && userObj.phone && userObj.phone !== "አልተመዘገበም" && String(userObj.phone).trim() !== "") {
          await ctx.reply(
            "ℹ️ ቀደም ሲል ተመዝግበዋል!\n\n" +
            "አሁኑኑ መጫወት ለመጀመር Play 🎮 የሚለውን ይጫኑ ወይም Deposit 💵 በማድረግ ሂሳብዎን ይሙሉ፤",
            { 
              reply_markup: { remove_keyboard: true },
              disable_notification: false
            }
          );
          return;
        }
      }

      const contactKeyboard = new Keyboard()
        .requestContact("📱 ስልክ ቁጥር አጋራ (Share Contact)")
        .resized()
        .oneTime();

      await ctx.reply("እባክዎን ምዝገባዎን ለማጠናቀቅ ከታች ያለውን 'Share Contact' ቁልፍ ይጫኑ፡", {
        reply_markup: contactKeyboard,
        disable_notification: false
      });
    } catch (err) {
      console.error('Registration Error:', err);
      await ctx.reply('❌ የምዝገባ ስህተት አጋጥሟል። እባክዎን እንደገና ይሞክሩ።', { disable_notification: false });
    }
  });

  bot.callbackQuery('deposit', async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = ctx.chat.id;
    userStates[chatId] = { step: 'AWAITING_AMOUNT' };
    await ctx.reply("💰 ማስገባት የሚፈልጉትን መጠን ከ10 ብር ጀምሮ ያስገቡ::", { disable_notification: false });
  });

  const handleWithdraw = async (ctx) => {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    const userId = String(ctx.from?.id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user?id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const mainWallet = data.mainWallet || 0;

        const withdrawMessage = 
          `📤 ገንዘብ ማውጫ (Withdrawal)\n\n` +
          `• ያልዎት ቀሪ ሂሳብ: ${mainWallet} ETB\n` +
          `• አነስተኛ ወጪ ማድረጊያ: 50 ETB\n\n` +
          `ገንዘብ ለማውጣት በ WebApp ውስጥ ያለውን Wallet ገፅ ይጠቀሙ ወይም አስተዳዳሪውን ያናግሩ።`;

        await ctx.reply(withdrawMessage, { disable_notification: false });
      } else {
        await ctx.reply('❌ የተጠቃሚ መረጃ ማግኘት አልተቻለም።', { disable_notification: false });
      }
    } catch (err) {
      console.error('Withdraw Error:', err);
      await ctx.reply('❌ የኔትወርክ ስህተት አጋጥሟል።', { disable_notification: false });
    }
  };

  bot.callbackQuery('withdraw', handleWithdraw);
  bot.hears(['Withdraw 🤑', 'Withdraw', '/withdraw', 'balance', '/balance'], async (ctx) => {
    if (ctx.message?.text?.includes('balance')) {
      const userId = String(ctx.from?.id);
      await ctx.reply("💼 ቀሪ ሂሳብዎን ለመመልከት ዋናውን ሜኑ ይጠቀሙ ወይም /menu ይጫኑ።", { disable_notification: false });
    } else {
      await handleWithdraw(ctx);
    }
  });

  // Direct command handlers for menu items
  bot.command('play', async (ctx) => {
    const userId = String(ctx.from?.id);
    const registered = await isUserRegistered(userId);
    if (registered) {
      const playKeyboard = new InlineKeyboard().webApp("🎮 አሁኑኑ ተጫወት (Play Now)", WEB_APP_URL);
      await ctx.reply("🎯 ለመጫወት ከታች ያለውን ቁልፍ ይጫኑ፡", { reply_markup: playKeyboard, disable_notification: false });
    } else {
      const contactKeyboard = new Keyboard()
        .requestContact("📱 ስልክ ቁጥር አጋራ (Share Contact)")
        .resized()
        .oneTime();
      await ctx.reply(
        "⚠️ ለመጫወት አስቀድመው መመዝገብ አለብዎት!\n\n" +
        "እባክዎን መጀመሪያ 'Register 📝' በማድረግ ወይም ከታች ያለውን '📱 ስልክ ቁጥር አጋራ (Share Contact)' ቁልፍ ተጭነው ስልክ ቁጥርዎን ያጋሩ፡",
        { reply_markup: contactKeyboard, disable_notification: false }
      );
    }
  });

  bot.command('register', async (ctx) => {
    const contactKeyboard = new Keyboard().requestContact("📱 ስልክ ቁጥር አጋራ (Share Contact)").resized().oneTime();
    await ctx.reply("እባክዎን ምዝገባዎን ለማጠናቀቅ 'Share Contact' ይጫኑ፡", { reply_markup: contactKeyboard, disable_notification: false });
  });

  bot.command('deposit', async (ctx) => {
    const chatId = ctx.chat.id;
    userStates[chatId] = { step: 'AWAITING_AMOUNT' };
    await ctx.reply("💰 ማስገባት የሚፈልጉትን መጠን ከ10 ብር ጀምሮ ያስገቡ::", { disable_notification: false });
  });

  bot.command('balance', async (ctx) => {
    await ctx.reply("💼 ቀሪ ሂሳብዎን ለመመልከት ዋናውን ሜኑ ይጠቀሙ ወይም /menu ይጫኑ።", { disable_notification: false });
  });

  bot.command('withdraw', handleWithdraw);

  // Invite Handler
  const handleInvite = async (ctx) => {
    if (ctx.callbackQuery) {
      try {
        await ctx.answerCallbackQuery();
      } catch (e) {}
    }
    try {
      const userId = ctx.from?.id || ctx.callbackQuery?.from?.id;

      if (!userId) {
        await ctx.reply("❌ የተጠቃሚ መረጃ ማግኘት አልተቻለም። እባክዎን /start ብለው እንደገና ይሞክሩ።", { disable_notification: false });
        return;
      }

      const botUsername = ctx.me?.username || 'fetanlottery_bot';
      const inviteLink = `https://t.me/${botUsername}?start=${userId}`;
      
      const shareText = "🎉 ና ወደ Fetan Lottery እንጫወት! በዚህ ሊንክ ስትመዘገብ የ 10 ETB ነፃ ቦነስ ታገኛለህ፦";
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;

      const inviteCaption = 
        `🔥 በእጅዎ ያለውን ስልክ በመጠቀም ብቻ ዕድልዎን ይሞክሩ!\n\n` +
        `🎉 ወደ Fetan Lottery ይቀላቀሉ እና አሁኑኑ ማሸነፍ ይጀምሩ!\n\n` +
        `🎁 ልዩ ቦነስ: ከታች ባለው ሊንክ ሲመዘገብ ብቻ የ 10 ETB ነፃ ቦነስ በ Play Wallet ላይ ይጨመርልዎታል!\n\n` +
        `✅ ቀላል አጨዋወት\n` +
        `✅ ፈጣን ዲፖዚት እና ዊዝድሮዋል\n` +
        `✅ አስተማማኝ እና ፈጣን ዕጣ ማውጣት\n\n` +
        `🔗 የርስዎ መጋበዣ ሊንክ:\n` +
        `${inviteLink}\n\n` +
        `👇 አሁኑኑ በመመዝገብ ነፃ ቦነስዎን ይሰብስቡ!`;

      const shareKeyboard = new InlineKeyboard()
        .url("✉️ ለጓደኛ Share አድርግ", shareUrl);

      await ctx.replyWithPhoto(BANNER_IMAGE_URL, {
        caption: inviteCaption,
        disable_notification: false,
        reply_markup: shareKeyboard
      });
    } catch (error) {
      console.error("Error handling invite command:", error);
      await ctx.reply("❌ ሊንኩን ማመንጨት አልተቻለም። እባክዎን ቆይተው እንደገና ይሞክሩ።", { disable_notification: false });
    }
  };

  bot.command('invite', handleInvite);
  bot.callbackQuery('invite', handleInvite);

  const handleInstruction = async (ctx) => {
    if (ctx.callbackQuery) await ctx.answerCallbackQuery();
    await ctx.reply(
      `📖 የጨዋታው መመሪያ:\n\n1. "Register 📝" የሚለውን ተጭነው ይመዝገቡ።\n2. "Deposit 💵" የሚለውን ተጭነው ወደ ዋሌት ብር ያስቀምጡ።\n3. "Play 🎮" የሚለውን ተጭነው WebApp ይክፈቱ።\n4. የሚወዱትን እስቴክ (Stake 10 ወይም Stake 20) እና የሎተሪ ቁጥር ይምረጡ።\n5. ሰዓቱ ሲያልቅ እጣው በቀጥታ ይወጣል፤ ካሸነፉ ገንዘቡ ወዲያውኑ ወደ Main Walletዎ ገቢ ይሆናል!`,
      { disable_notification: false }
    );
  };

  bot.command('instruction', handleInstruction);
  bot.callbackQuery('instruction', handleInstruction);
  bot.command('help', handleInstruction);

  bot.callbackQuery('support', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('☎️ ለአስተያየት እና ለተጨማሪ እርዳታ በቴሌግራም ያውሩን፡ @Fetanlotterysupport', { disable_notification: false });
  });

  bot.callbackQuery('transfer', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('🎁 ለሌላ ተጫዋች ገንዘብ ለማስተላለፍ በ WebApp ውስጥ ያለውን Transfer ገፅ ይጠቀሙ።', { disable_notification: false });
  });

  bot.callbackQuery('convert', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('💱 Play Wallet ቦነስን ወደ Main Wallet ለመቀየር አነስተኛው መጠን 100 ETB መሆን አለበት።', { disable_notification: false });
  });

  bot.callbackQuery(/^copy_/, async (ctx) => {
    await ctx.answerCallbackQuery({ text: "Code Copied!", show_alert: false });
  });

  bot.callbackQuery(/^pay_telebirr_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = ctx.chat.id;
    const amount = ctx.callbackQuery.data.split("_")[2];
    userStates[chatId] = { step: 'AWAITING_SMS', amount: amount };

    const instructionsText = `የሚያጋጥሟችሁ የክፍያ ችግር:@Fetanlotterysupport ላይ ፃፉልን::\n\n1. ከታች ባለው የቴሌብር አካውንት ${amount} ብር ያስገቡ\n\nPhone: ${TELEBIRR_NUMBER}\n\n2. የከፈሉበትን አጭር የፅሁፍ መልዕክት(message) copy በማድረግ እዚ ላይ Past አድርገው ይላኩና ይላኩ👇👇👇`;

    const shareContactKeyboard = new Keyboard()
      .requestContact("📞 Share contact")
      .resized()
      .oneTime();

    await ctx.reply(instructionsText, {
      reply_markup: shareContactKeyboard,
      disable_notification: false
    });
  });

  bot.callbackQuery('cancel_deposit', async (ctx) => {
    const chatId = ctx.chat.id;
    delete userStates[chatId];
    await ctx.answerCallbackQuery({ text: "ተሰርዟል!" });
    await ctx.reply("❌ የዲፖዚት ሂደቱ ተሰርዟል።", { disable_notification: false });
  });

  // --- 7. EVENT LISTENERS ---

  bot.on(':contact', async (ctx) => {
    const userId = String(ctx.from?.id);
    let phoneNumber = ctx.message.contact.phone_number;

    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+' + phoneNumber;
    }

    try {
      await fetch(`${API_BASE_URL}/api/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId, 
          phone: phoneNumber 
        })
      });

      await ctx.reply(
        "🎉 ምዝገባዎ በስኬት ተጠናቋል!\n\n📱 ስልክ ቁጥርዎ፦ " + phoneNumber + " ተመዝግቧል።",
        {
          reply_markup: { remove_keyboard: true },
          disable_notification: false
        }
      );
      await sendMainMenu(ctx);
    } catch (err) {
      console.error('Phone update fetch error:', err);
      await ctx.reply(
        "🎉 ምዝገባዎ በስኬት ተጠናቋል!\n\n📱 ስልክ ቁጥርዎ፦ " + phoneNumber + " ተመዝግቧል።",
        {
          reply_markup: { remove_keyboard: true },
          disable_notification: false
        }
      );
    }
  });

  // 💬 TEXT MESSAGE LISTENER (ለ DEPOSIT FLOW)
  bot.on('message:text', async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;

    if (text.startsWith('/start') || text.startsWith('/menu')) return;

    // AWAITING AMOUNT (የዲፖዚት መጠን መቀበያ)
    if (userStates[chatId] && userStates[chatId].step === 'AWAITING_AMOUNT') {
      const amount = parseInt(text);
      if (isNaN(amount) || amount < 10) {
        await ctx.reply("⚠️ እባክዎን ትክክለኛ መጠን ያስገቡ (ከ10 ብር ጀምሮ)።", { disable_notification: false });
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
        reply_markup: paymentKeyboard,
        disable_notification: false
      });
      return;
    }

    // AWAITING SMS (የቴሌብር SMS መቀበያ እና ወደ ባክኤንድ መላኪያ)
    if (userStates[chatId] && userStates[chatId].step === 'AWAITING_SMS') {
      const depositData = userStates[chatId];
      const amount = depositData.amount;
      delete userStates[chatId];

      const userId = String(ctx.from?.id);
      const userName = ctx.from?.first_name || `User_${userId}`;

      try {
        const response = await fetch(`${API_BASE_URL}/api/deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            userName: userName,
            amount: Number(amount),
            pastedText: text,
            paymentMethod: 'Telebirr',
            status: 'pending'
          })
        });

        const result = response.ok ? await response.json() : {};

        if (response.ok && (result.success || result._id || result.id)) {
          await ctx.reply("✅ ጥያቄዎ ደርሶናል! የላኩት የክፍያ ማረጋገጫ ተመርምሮ በአጭር ጊዜ ውስጥ ሂሳብዎ ላይ ገቢ ይደረጋል።", { disable_notification: false });

          if (process.env.ADMIN_GROUP_ID) {
            const adminMsg = `🔔 <b>አዲስ የዲፖዚት ጥያቄ!</b>\n\n👤 ስም: ${userName}\n🆔 ID: <code>${userId}</code>\n💰 መጠን: ${amount} ETB\n\n📝 <b>SMS:</b>\n<code>${text}</code>`;
            await bot.api.sendMessage(process.env.ADMIN_GROUP_ID, adminMsg, {
              parse_mode: 'HTML',
              disable_notification: false
            });
          }

        } else {
          const errorMsg = result.message || 'ይህ የትራንዛክሽን ቁጥር ቀደም ሲል ጥቅም ላይ ውሏል ወይም ትክክለኛ አይደለም።';
          await ctx.reply(`⚠️ ${errorMsg}`, { disable_notification: false });
        }
      } catch (err) {
        console.error('Deposit request API error:', err);
        await ctx.reply("❌ የኔትወርክ ስህተት አጋጥሟል። እባክዎን ቆይተው እንደገና ይሞክሩ።", { disable_notification: false });
      }
      return;
    }
  });

  // 8. Error Handler
  bot.catch((err) => {
    console.error('Telegram Bot Error:', err);
  });

  // 9. Bot Starter
  if (process.env.NODE_ENV !== 'production') {
    bot.start();
  }

} else {
  console.log('TELEGRAM_BOT_TOKEN አልተዋቀረም፤ ቦቱ ሳይነሳ አገልጋዩ ብቻ ይሰራል።');
}