/**
 * ===================================================
 *  Telegram Order Bot — Node.js Version
 *  Supports: Electronics/Laptops, 30% Deposit,
 *            English + Amharic, Telebirr + Bank
 * ===================================================
 *  HOW TO RUN:
 *    1. npm install
 *    2. Fill in config below
 *    3. node bot.js
 * ===================================================
 */

const { Telegraf, Markup, session } = require("telegraf");

// ─────────────────────────────────────────────────
//  🔧 CONFIGURATION — FILL THESE IN
// ─────────────────────────────────────────────────
const BOT_TOKEN        = "";   // from @BotFather token
const ADMIN_CHAT_ID    = ;                // from @userinfobot (number!)
const CHANNEL_USERNAME = "";    // your channel

// Payment Details
const TELEBIRR_NUMBER  = "0912345678";
const TELEBIRR_NAME    = "Your Name";
const BANK_NAME        = "CBE";
const BANK_ACCOUNT     = "1000123456789";
const BANK_HOLDER      = "Your Name";

// ─────────────────────────────────────────────────
//  TRANSLATIONS (English + Amharic)
// ─────────────────────────────────────────────────
const T = {
  en: {
    welcome:        "👋 Welcome to the Order Bot!\nPlease select your language:",
    ask_name:       "📝 Great\\! What is your *full name*?",
    ask_phone:      "📞 What is your *phone number*?\n\\(e\\.g\\. 0912345678\\)",
    ask_address:    "📍 What is your *delivery address*?\n\\(City, Area, Street\\)",
    ask_qty:        "🔢 How many units do you want to order?",
    pay_intro:      (deposit, price) =>
      `💳 *Payment Instructions*\n\nPlease pay *30% deposit* to confirm your order\\.\n\nDeposit amount: *${deposit} ETB* \\(30% of ${price} ETB\\)`,
    pay_telebirr:   (number, name) =>
      `📱 *Option 1 — Telebirr*\nSend to: \`${number}\`\nName: ${name}`,
    pay_bank:       (bank, account, holder) =>
      `🏦 *Option 2 — Bank Transfer*\nBank: ${bank}\nAccount: \`${account}\`\nHolder: ${holder}`,
    pay_footer:     "✅ After paying, *upload your payment screenshot* below\\.",
    screenshot_got: (orderId) =>
      `✅ Screenshot received\\! Your order is being reviewed\\.\n\n*Order ID: ${orderId}*\n\nWe will contact you within 24 hours\\. Thank you\\! 🙏`,
    confirm_ask:    (orderId, item) =>
      `📦 Have you *received your item*?\n\nOrder ID: ${orderId}\nItem: ${item}`,
    confirm_yes:    (item) =>
      `🎉 Thank you for confirming\\! Your order is complete\\.\nWe hope you enjoy your ${item}\\! ⭐`,
    confirm_no:     (phone) =>
      `⏳ OK, we'll follow up with you soon\\. Please stay available on this number: ${phone}`,
    cancel:         "❌ Order cancelled\\. Send /start to begin again\\.",
    btn_received:   "✅ Yes, I received it!",
    btn_not_yet:    "⏳ Not yet",
    admin_new_order: (o) =>
      `🆕 *New Order Received\\!*\n\nOrder ID: \`${o.orderId}\`\nItem: ${o.item}\nQty: ${o.qty}\nPrice: ${o.totalPrice} ETB\nDeposit: ${o.deposit} ETB\nName: ${o.name}\nPhone: ${o.phone}\nAddress: ${o.address}\nPayment: ${o.paymentMethod}`,
    admin_confirmed: (orderId, name, phone) =>
      `✅ *Order Delivered & Confirmed\\!*\nOrder ID: \`${orderId}\`\nCustomer: ${name} \\(${phone}\\)`,
    invalid_phone:  "⚠️ Please enter a valid Ethiopian phone number \\(e\\.g\\. 0912345678\\)\\.",
    invalid_qty:    "⚠️ Please enter a valid number \\(e\\.g\\. 1, 2, 3\\.\\.\\.\\)\\.",
    post_title:     "📦 Enter the *item name/title*:",
    post_price:     "💰 Enter the *price in ETB*:",
    post_desc:      "📝 Enter a *short description*:",
    post_photo:     "📸 Send the *item photo*\\. Or type /skip for no photo:",
    post_done:      "✅ Item posted to channel\\!",
    not_admin:      "⛔ Only the shop admin can use this command\\.",
  },
  am: {
    welcome:        "👋 እንኳን ወደ ትዕዛዝ ቦት በደህና መጡ!\nቋንቋ ይምረጡ:",
    ask_name:       "📝 *ሙሉ ስምዎን* ያስገቡ:",
    ask_phone:      "📞 *ስልክ ቁጥርዎን* ያስገቡ:\n\\(ምሳሌ: 0912345678\\)",
    ask_address:    "📍 *የመላኪያ አድራሻዎን* ያስገቡ:\n\\(ከተማ, ክፍለ ከተማ, ጎዳና\\)",
    ask_qty:        "🔢 ስንት ዕቃ ማዘዝ ይፈልጋሉ?",
    pay_intro:      (deposit, price) =>
      `💳 *የክፍያ መመሪያ*\n\nትዕዛዙን ለማረጋገጥ *30% ቅድሚያ ክፍያ* ይፈጸሙ።\n\nቅድሚያ ክፍያ: *${deposit} ብር* \\(30% ከ ${price} ብር\\)`,
    pay_telebirr:   (number, name) =>
      `📱 *አማራጭ 1 — ቴሌብር*\nወደ: \`${number}\`\nስም: ${name}`,
    pay_bank:       (bank, account, holder) =>
      `🏦 *አማራጭ 2 — ባንክ ዝውውር*\nባንክ: ${bank}\nሂሳብ ቁጥር: \`${account}\`\nባለቤት: ${holder}`,
    pay_footer:     "✅ ከፈፀሙ በኋላ *የክፍያ ደረሰኝ ፎቶ ይላኩ።*",
    screenshot_got: (orderId) =>
      `✅ ፎቶ ደርሶናል\\! ትዕዛዝዎ በክለሳ ላይ ነው።\n\n*ትዕዛዝ መለያ: ${orderId}*\n\nበ24 ሰዓት ውስጥ እናገኝዎታለን። አመሰግናለን\\! 🙏`,
    confirm_ask:    (orderId, item) =>
      `📦 *ዕቃዎን ተቀብለዋል?*\n\nትዕዛዝ: ${orderId}\nዕቃ: ${item}`,
    confirm_yes:    (item) =>
      `🎉 ትዕዛዝዎ ተጠናቅቋል\\! ${item} ደስ ይበልዎ\\! ⭐`,
    confirm_no:     (phone) =>
      `⏳ እሺ፣ በቅርቡ እናናግርዎታለን። ስልክዎ ይክፈቱ: ${phone}`,
    cancel:         "❌ ትዕዛዝ ተሰርዟል። /start ይጫኑ።",
    btn_received:   "✅ አዎ፣ ተቀብያለሁ!",
    btn_not_yet:    "⏳ እስካሁን አልደረሰም",
    admin_new_order: (o) =>
      `🆕 *አዲስ ትዕዛዝ\\!*\n\nOrder ID: \`${o.orderId}\`\nዕቃ: ${o.item}\nብዛት: ${o.qty}\nዋጋ: ${o.totalPrice} ብር\nቅድሚያ: ${o.deposit} ብር\nስም: ${o.name}\nስልክ: ${o.phone}\nአድራሻ: ${o.address}\nክፍያ: ${o.paymentMethod}`,
    admin_confirmed: (orderId, name, phone) =>
      `✅ *ተረጋግጦ ተቀብሏል\\!*\nOrder ID: \`${orderId}\`\nደንበኛ: ${name} \\(${phone}\\)`,
    invalid_phone:  "⚠️ ትክክለኛ ስልክ ቁጥር ያስገቡ \\(ምሳሌ: 0912345678\\)\\.",
    invalid_qty:    "⚠️ ትክክለኛ ቁጥር ያስገቡ \\(ምሳሌ: 1, 2, 3\\.\\.\\.\\)\\.",
    post_title:     "📦 *የዕቃ ስም* ያስገቡ:",
    post_price:     "💰 *ዋጋ በብር* ያስገቡ:",
    post_desc:      "📝 *አጭር መግለጫ* ያስገቡ:",
    post_photo:     "📸 *የዕቃ ፎቶ* ይላኩ \\(ወይም /skip\\):",
    post_done:      "✅ ዕቃ ወደ ቻናል ተልኳል\\!",
    not_admin:      "⛔ ይህ ትዕዛዝ ለሱቅ ባለቤት ብቻ ነው።",
  },
};

// Helper: get text in user's language
function t(lang, key, ...args) {
  const strings = T[lang] || T.en;
  const val = strings[key] ?? T.en[key] ?? key;
  return typeof val === "function" ? val(...args) : val;
}

// ─────────────────────────────────────────────────
//  IN-MEMORY STORES
// ─────────────────────────────────────────────────
let orderCounter = 0;
const orders = new Map();   // orderId → order object

function newOrderId() {
  orderCounter++;
  return `ORD-${String(orderCounter).padStart(4, "0")}`;
}

function isValidEthiopianPhone(phone) {
  const clean = phone.replace(/\s/g, "");
  return /^(09|07|\+2519|\+2517)\d{8}$/.test(clean);
}

// ─────────────────────────────────────────────────
//  CONVERSATION STEP CONSTANTS
// ─────────────────────────────────────────────────
const STEPS = {
  IDLE:            "IDLE",
  LANG:            "LANG",
  NAME:            "NAME",
  PHONE:           "PHONE",
  ADDRESS:         "ADDRESS",
  QTY:             "QTY",
  SCREENSHOT:      "SCREENSHOT",
  POST_TITLE:      "POST_TITLE",
  POST_PRICE:      "POST_PRICE",
  POST_DESC:       "POST_DESC",
  POST_PHOTO:      "POST_PHOTO",
};

// ─────────────────────────────────────────────────
//  BOT SETUP
// ─────────────────────────────────────────────────
const bot = new Telegraf(BOT_TOKEN);

// Attach per-user session (in-memory)
bot.use(session());

// Initialise session if missing
bot.use((ctx, next) => {
  if (!ctx.session) ctx.session = {};
  return next();
});

// Shorthand helpers
const getLang   = (ctx) => ctx.session.lang || "en";
const getStep   = (ctx) => ctx.session.step || STEPS.IDLE;
const isAdmin   = (ctx) => ctx.from?.id === ADMIN_CHAT_ID;

// ─────────────────────────────────────────────────
//  /start  — entry point (deep link from channel)
// ─────────────────────────────────────────────────
bot.command("start", async (ctx) => {
  const payload = ctx.message?.text?.split(" ")[1]; // e.g. ITEM_Dell-Laptop_45000_abc123

  if (payload && payload.startsWith("ITEM_")) {
    try {
      const parts     = payload.split("_");
      // Format: ITEM_{name-slug}_{price}_{id}
      const itemName  = parts[1].replace(/-/g, " ");
      const itemPrice = parseInt(parts[2], 10);
      const itemId    = parts[3];
      ctx.session.item      = itemName;
      ctx.session.itemPrice = itemPrice;
      ctx.session.itemId    = itemId;
    } catch {
      ctx.session.item      = "Unknown Item";
      ctx.session.itemPrice = 0;
      ctx.session.itemId    = "0";
    }
  }

  ctx.session.step = STEPS.LANG;

  await ctx.reply(
    "👋 Welcome! / እንኳን ወደ ትዕዛዝ ቦት!\n\nSelect language / ቋንቋ ምረጥ:",
    Markup.inlineKeyboard([
      Markup.button.callback("🇬🇧 English",  "lang_en"),
      Markup.button.callback("🇪🇹 አማርኛ",    "lang_am"),
    ])
  );
});

// ─────────────────────────────────────────────────
//  LANGUAGE SELECTION
// ─────────────────────────────────────────────────
bot.action(/^lang_(en|am)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const lang = ctx.match[1];
  ctx.session.lang = lang;
  ctx.session.step = STEPS.NAME;

  const item = ctx.session.item ? `🛍️ *${ctx.session.item}*\n\n` : "";
  await ctx.editMessageText(
    item + t(lang, "ask_name"),
    { parse_mode: "MarkdownV2" }
  );
});

// /cancel
bot.command("cancel", async (ctx) => {
  const lang = getLang(ctx);
  ctx.session = {};
  await ctx.reply(t(lang, "cancel"), { parse_mode: "MarkdownV2" });
});

// ─────────────────────────────────────────────────
//  MAIN MESSAGE HANDLER — drives the conversation
// ─────────────────────────────────────────────────
bot.on("message", async (ctx) => {
  const step = getStep(ctx);
  const lang = getLang(ctx);
  const text = ctx.message?.text?.trim() || "";

  // ── ORDER FLOW ──────────────────────────────

  if (step === STEPS.NAME) {
    ctx.session.name = text;
    ctx.session.step = STEPS.PHONE;
    return ctx.reply(t(lang, "ask_phone"), { parse_mode: "MarkdownV2" });
  }

  if (step === STEPS.PHONE) {
    if (!isValidEthiopianPhone(text)) {
      return ctx.reply(t(lang, "invalid_phone"), { parse_mode: "MarkdownV2" });
    }
    ctx.session.phone = text;
    ctx.session.step  = STEPS.ADDRESS;
    return ctx.reply(t(lang, "ask_address"), { parse_mode: "MarkdownV2" });
  }

  if (step === STEPS.ADDRESS) {
    ctx.session.address = text;
    ctx.session.step    = STEPS.QTY;
    return ctx.reply(t(lang, "ask_qty"), { parse_mode: "MarkdownV2" });
  }

  if (step === STEPS.QTY) {
    const qty = parseInt(text, 10);
    if (isNaN(qty) || qty < 1) {
      return ctx.reply(t(lang, "invalid_qty"), { parse_mode: "MarkdownV2" });
    }
    ctx.session.qty        = qty;
    const price            = (ctx.session.itemPrice || 0) * qty;
    const deposit          = Math.round(price * 0.3);
    ctx.session.totalPrice = price;
    ctx.session.deposit    = deposit;
    ctx.session.step       = STEPS.SCREENSHOT;

    const msg = [
      t(lang, "pay_intro", deposit, price),
      "",
      t(lang, "pay_telebirr", TELEBIRR_NUMBER, TELEBIRR_NAME),
      "",
      t(lang, "pay_bank", BANK_NAME, BANK_ACCOUNT, BANK_HOLDER),
      "",
      t(lang, "pay_footer"),
    ].join("\n");

    return ctx.reply(msg, {
      parse_mode: "MarkdownV2",
      ...Markup.inlineKeyboard([
        Markup.button.callback(
          lang === "am" ? "📱 ቴሌብር"   : "📱 Telebirr",
          "pay_telebirr"
        ),
        Markup.button.callback(
          lang === "am" ? "🏦 ባንክ"     : "🏦 Bank Transfer",
          "pay_bank"
        ),
      ]),
    });
  }

  // Screenshot upload
  if (step === STEPS.SCREENSHOT) {
    const photo    = ctx.message.photo;
    const document = ctx.message.document;

    if (!photo && !document) {
      return ctx.reply(
        lang === "am"
          ? "⚠️ እባክዎ የክፍያ ፎቶ ይላኩ።"
          : "⚠️ Please send a photo/screenshot of your payment."
      );
    }

    const fileId  = photo ? photo[photo.length - 1].file_id : document.file_id;
    const orderId = newOrderId();

    const order = {
      orderId,
      userId:        ctx.from.id,
      lang,
      item:          ctx.session.item          || "Unknown Item",
      itemPrice:     ctx.session.itemPrice      || 0,
      qty:           ctx.session.qty            || 1,
      totalPrice:    ctx.session.totalPrice     || 0,
      deposit:       ctx.session.deposit        || 0,
      name:          ctx.session.name           || "",
      phone:         ctx.session.phone          || "",
      address:       ctx.session.address        || "",
      paymentMethod: ctx.session.paymentMethod  || "Not selected",
      screenshot:    fileId,
      status:        "pending_review",
    };
    orders.set(orderId, order);
    ctx.session = {};   // clear session

    // Notify admin
    try {
      await ctx.telegram.sendPhoto(ADMIN_CHAT_ID, fileId, {
        caption:    t("en", "admin_new_order", order),
        parse_mode: "MarkdownV2",
        ...Markup.inlineKeyboard([
          Markup.button.callback("✅ Approve", `admin_approve_${orderId}`),
          Markup.button.callback("❌ Reject",  `admin_reject_${orderId}`),
        ]),
      });
    } catch (err) {
      console.error("Admin notify failed:", err.message);
    }

    return ctx.reply(
      t(lang, "screenshot_got", orderId),
      { parse_mode: "MarkdownV2" }
    );
  }

  // ── POST ITEM FLOW (admin) ─────────────────

  if (step === STEPS.POST_TITLE) {
    ctx.session.postTitle = text;
    ctx.session.step      = STEPS.POST_PRICE;
    return ctx.reply(t("en", "post_price"), { parse_mode: "MarkdownV2" });
  }

  if (step === STEPS.POST_PRICE) {
    const price = parseInt(text.replace(/,/g, ""), 10);
    if (isNaN(price) || price < 1) {
      return ctx.reply("⚠️ Enter a valid price \\(numbers only\\)\\.", {
        parse_mode: "MarkdownV2",
      });
    }
    ctx.session.postPrice = price;
    ctx.session.step      = STEPS.POST_DESC;
    return ctx.reply(t("en", "post_desc"), { parse_mode: "MarkdownV2" });
  }

  if (step === STEPS.POST_DESC) {
    ctx.session.postDesc = text;
    ctx.session.step     = STEPS.POST_PHOTO;
    return ctx.reply(t("en", "post_photo"), { parse_mode: "MarkdownV2" });
  }
});

// ─────────────────────────────────────────────────
//  PHOTO HANDLER — for posting item OR screenshot
// ─────────────────────────────────────────────────
bot.on("photo", async (ctx) => {
  const step = getStep(ctx);
  const lang = getLang(ctx);

  if (step === STEPS.POST_PHOTO && isAdmin(ctx)) {
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    await postItemToChannel(ctx, fileId);
    return;
  }

  if (step === STEPS.SCREENSHOT) {
    // Delegate to message handler by triggering the same logic
    const fileId  = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    const orderId = newOrderId();
    const order = {
      orderId,
      userId:        ctx.from.id,
      lang,
      item:          ctx.session.item         || "Unknown Item",
      itemPrice:     ctx.session.itemPrice     || 0,
      qty:           ctx.session.qty           || 1,
      totalPrice:    ctx.session.totalPrice    || 0,
      deposit:       ctx.session.deposit       || 0,
      name:          ctx.session.name          || "",
      phone:         ctx.session.phone         || "",
      address:       ctx.session.address       || "",
      paymentMethod: ctx.session.paymentMethod || "Not selected",
      screenshot:    fileId,
      status:        "pending_review",
    };
    orders.set(orderId, order);
    ctx.session = {};

    try {
      await ctx.telegram.sendPhoto(ADMIN_CHAT_ID, fileId, {
        caption:    t("en", "admin_new_order", order),
        parse_mode: "MarkdownV2",
        ...Markup.inlineKeyboard([
          Markup.button.callback("✅ Approve", `admin_approve_${orderId}`),
          Markup.button.callback("❌ Reject",  `admin_reject_${orderId}`),
        ]),
      });
    } catch (err) {
      console.error("Admin notify failed:", err.message);
    }

    return ctx.reply(
      t(lang, "screenshot_got", orderId),
      { parse_mode: "MarkdownV2" }
    );
  }
});

// ─────────────────────────────────────────────────
//  PAYMENT METHOD BUTTONS
// ─────────────────────────────────────────────────
bot.action(/^pay_(telebirr|bank)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const method = ctx.match[1] === "telebirr" ? "Telebirr" : "Bank Transfer";
  ctx.session.paymentMethod = method;
  const lang = getLang(ctx);
  const label = lang === "am"
    ? `✅ ${method === "Telebirr" ? "ቴሌብር" : "ባንክ"} ተመርጧል። ፎቶ ይላኩ።`
    : `✅ *${method}* selected\\. Please upload your screenshot\\.`;
  await ctx.editMessageText(
    ctx.callbackQuery.message.text + "\n\n" + label,
    { parse_mode: "MarkdownV2" }
  );
});

// ─────────────────────────────────────────────────
//  ADMIN ACTIONS — approve / reject
// ─────────────────────────────────────────────────
bot.action(/^admin_(approve|reject)_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  if (!isAdmin(ctx)) return ctx.answerCbQuery("Not authorized.", { show_alert: true });

  const action  = ctx.match[1];
  const orderId = ctx.match[2];
  const order   = orders.get(orderId);

  if (!order) {
    return ctx.editMessageCaption("⚠️ Order not found\\.", { parse_mode: "MarkdownV2" });
  }

  const lang = order.lang;

  if (action === "approve") {
    order.status = "approved";

    await ctx.telegram.sendMessage(order.userId, t(lang, "confirm_ask", orderId, order.item), {
      parse_mode: "MarkdownV2",
      ...Markup.inlineKeyboard([
        Markup.button.callback(t(lang, "btn_received"), `confirm_${orderId}`),
        Markup.button.callback(t(lang, "btn_not_yet"),  `notyet_${orderId}`),
      ]),
    });

    const existingCaption = ctx.callbackQuery.message.caption || "";
    await ctx.editMessageCaption(
      existingCaption + "\n\n✅ *Approved* — Customer notified\\.",
      { parse_mode: "MarkdownV2" }
    );
  } else {
    order.status = "rejected";
    await ctx.telegram.sendMessage(
      order.userId,
      `❌ Your order ${orderId} could not be processed\\. Please contact us\\.`,
      { parse_mode: "MarkdownV2" }
    );
    const existingCaption = ctx.callbackQuery.message.caption || "";
    await ctx.editMessageCaption(
      existingCaption + "\n\n❌ *Rejected* — Customer notified\\.",
      { parse_mode: "MarkdownV2" }
    );
  }
});

// ─────────────────────────────────────────────────
//  CUSTOMER CONFIRMS DELIVERY
// ─────────────────────────────────────────────────
bot.action(/^(confirm|notyet)_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const action  = ctx.match[1];
  const orderId = ctx.match[2];
  const order   = orders.get(orderId);

  if (!order) return ctx.editMessageText("⚠️ Order not found\\.", { parse_mode: "MarkdownV2" });

  const lang = order.lang;

  if (action === "confirm") {
    order.status = "delivered";
    await ctx.editMessageText(t(lang, "confirm_yes", order.item), { parse_mode: "MarkdownV2" });
    await ctx.telegram.sendMessage(
      ADMIN_CHAT_ID,
      t("en", "admin_confirmed", orderId, order.name, order.phone),
      { parse_mode: "MarkdownV2" }
    );
  } else {
    await ctx.editMessageText(t(lang, "confirm_no", order.phone), { parse_mode: "MarkdownV2" });
  }
});

// ─────────────────────────────────────────────────
//  ADMIN COMMANDS
// ─────────────────────────────────────────────────

// /postitem — admin posts a new product to channel
bot.command("postitem", async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply(t("en", "not_admin"), { parse_mode: "MarkdownV2" });
  }
  ctx.session      = {};
  ctx.session.step = STEPS.POST_TITLE;
  return ctx.reply(t("en", "post_title"), { parse_mode: "MarkdownV2" });
});

// /skip — skip photo when posting item
bot.command("skip", async (ctx) => {
  if (!isAdmin(ctx) || getStep(ctx) !== STEPS.POST_PHOTO) return;
  await postItemToChannel(ctx, null);
});

// /orders — list last 10 orders
bot.command("orders", async (ctx) => {
  if (!isAdmin(ctx)) return;
  if (orders.size === 0) return ctx.reply("📭 No orders yet\\.", { parse_mode: "MarkdownV2" });

  const last10 = [...orders.values()].slice(-10);
  const lines  = last10.map(
    (o) =>
      `\`${o.orderId}\` — ${o.item}\n  👤 ${o.name} | 📞 ${o.phone}\n  💰 ${o.totalPrice} ETB | ${o.status}`
  );
  return ctx.reply("📋 *All Orders:*\n\n" + lines.join("\n\n"), {
    parse_mode: "MarkdownV2",
  });
});

// ─────────────────────────────────────────────────
//  HELPER — post item to channel
// ─────────────────────────────────────────────────
async function postItemToChannel(ctx, photoFileId) {
  const { postTitle: title, postPrice: price, postDesc: desc } = ctx.session;

  const slug     = (title || "item").replace(/\s+/g, "-").substring(0, 20);
  const itemHash = Math.abs(hashCode(title + String(price))).toString().substring(0, 6);
  const deepLink = `https://t.me/${ctx.botInfo.username}?start=ITEM_${slug}_${price}_${itemHash}`;
  const deposit  = Math.round(price * 0.3);

  const caption = [
    `🛍️ *${escMd(title)}*`,
    "",
    `📝 ${escMd(desc)}`,
    "",
    `💰 Price: *${price.toLocaleString()} ETB*`,
    `⬇️ Deposit: *${deposit.toLocaleString()} ETB* \\(30%\\)`,
    "",
    "👇 Tap below to order\\!",
  ].join("\n");

  const keyboard = Markup.inlineKeyboard([
    Markup.button.url("🛒 Order Now / አሁን ዕዘዝ", deepLink),
  ]);

  try {
    if (photoFileId) {
      await ctx.telegram.sendPhoto(CHANNEL_USERNAME, photoFileId, {
        caption,
        parse_mode: "MarkdownV2",
        ...keyboard,
      });
    } else {
      await ctx.telegram.sendMessage(CHANNEL_USERNAME, caption, {
        parse_mode: "MarkdownV2",
        ...keyboard,
      });
    }
    await ctx.reply(t("en", "post_done"), { parse_mode: "MarkdownV2" });
  } catch (err) {
    await ctx.reply(`❌ Failed to post: ${err.message}`);
  }

  ctx.session = {};
}

// ─────────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────────
function escMd(text = "") {
  // Escape MarkdownV2 special characters
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h;
}

// ─────────────────────────────────────────────────
//  LAUNCH
// ─────────────────────────────────────────────────
bot.launch()
  .then(() => console.log("🤖 Bot is running! Press Ctrl+C to stop."))
  .catch((err) => console.error("❌ Failed to start bot:", err.message));

// Graceful shutdown
process.once("SIGINT",  () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
