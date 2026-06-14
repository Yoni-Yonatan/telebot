/**
 * ╔══════════════════════════════════════════════════════╗
 *  🛒 TELEGRAM SHOP BOT — PRO VERSION
 *  Features: Smart posting, Admin detect, Support,
 *            Stock, Wishlish, Stats, EN + አማርኛ
 * ╚══════════════════════════════════════════════════════╝
 *
 *  COMMANDS (admin):
 *   /postitem   — post product to channel (step by step)
 *   /orders     — view all orders
 *   /stock      — manage stock / mark sold
 *   /stats      — sales dashboard
 *   /broadcast  — send message to all customers
 *
 *  COMMANDS (customers):
 *   /start      — start ordering
 *   /myorders   — view my order history
 *   /support    — contact support / admin
 *   /wishlist   — save items for later
 *   /cancel     — cancel current action
 *
 *  HOW TO RUN:
 *   npm install && node bot.js
 */

"use strict";
const { Telegraf, Markup, session } = require("telegraf");

// ══════════════════════════════════════════════════════
//  🔧 CONFIG — FILL THESE IN
// ══════════════════════════════════════════════════════
const BOT_TOKEN        = "8317048510:AAE93SoyopW6zZvkjqVyn3AfM3AmoZp022I";   // @BotFather
const ADMIN_CHAT_ID    = 1864114540;                // @userinfobot — your ID (number)
const CHANNEL_USERNAME = "@VENU_Et_Market";     // e.g. "@bekigaming"
const SUPPORT_USERNAME = "@yoni_yonatan"; // your Telegram username for support

// Payment
const TELEBIRR_NUMBER  = "0912345678";
const TELEBIRR_NAME    = "Your Name";
const BANK_NAME        = "CBE";
const BANK_ACCOUNT     = "1000123456789";
const BANK_HOLDER      = "Your Name";

// Shop identity
const SHOP_NAME        = "VENU Market";
const SHOP_TAGLINE     = "Best Electronics & Gaming Laptops in Addis Ababa";

// ══════════════════════════════════════════════════════
//  STEPS
// ══════════════════════════════════════════════════════
const S = {
  IDLE:          "IDLE",
  LANG:          "LANG",
  NAME:          "NAME",
  PHONE:         "PHONE",
  ADDRESS:       "ADDRESS",
  QTY:           "QTY",
  SCREENSHOT:    "SCREENSHOT",
  SUPPORT_MSG:   "SUPPORT_MSG",
  BROADCAST_MSG: "BROADCAST_MSG",
  // Admin post steps
  P_NAME:        "P_NAME",
  P_SPEC:        "P_SPEC",
  P_PRICE:       "P_PRICE",
  P_STOCK:       "P_STOCK",
  P_PHOTO:       "P_PHOTO",
};

// ══════════════════════════════════════════════════════
//  IN-MEMORY DATA STORE
// ══════════════════════════════════════════════════════
let orderCounter = 0;
const orders    = new Map();  // orderId → order
const items     = new Map();  // itemId  → item (product catalog)
const customers = new Map();  // userId  → { name, phone, lang, wishlist[] }

function newOrderId() {
  return `ORD-${String(++orderCounter).padStart(4, "0")}`;
}
function newItemId() {
  return `ITM-${Date.now().toString(36).toUpperCase()}`;
}

// ══════════════════════════════════════════════════════
//  TRANSLATIONS
// ══════════════════════════════════════════════════════
const T = {
  en: {
    welcome: (name) =>
`👋 Welcome to *${escMd(SHOP_NAME)}*!
${escMd(SHOP_TAGLINE)}

What would you like to do?`,
    ask_name:    "📝 Please enter your *full name*:",
    ask_phone:   "📞 Enter your *phone number*:\n\\(e\\.g\\. 0912345678\\)",
    ask_address: "📍 Enter your *delivery address*:\n\\(City, Sub\\-city, Area\\)",
    ask_qty:     "🔢 How many units would you like?",
    pay_title:   (dep, total) =>
`💳 *Payment — 30% Deposit Required*

Total price: *${total} ETB*
Deposit now: *${dep} ETB* \\(30%\\)

Choose your payment method:`,
    pay_telebirr: `📱 *Telebirr*\nNumber: \`${TELEBIRR_NUMBER}\`\nName: ${TELEBIRR_NAME}`,
    pay_bank:     `🏦 *Bank Transfer*\nBank: ${BANK_NAME}\nAccount: \`${BANK_ACCOUNT}\`\nHolder: ${BANK_HOLDER}`,
    pay_upload:   "✅ *Send your payment screenshot now* 👇",
    order_done:  (id) =>
`✅ *Order Confirmed!*

Order ID: \`${id}\`
We'll review your payment and contact you within 24hrs\\.

Thank you for shopping with us\\! 🙏`,
    confirm_ask: (id, item) =>
`📦 *Has your item arrived?*

Order: \`${id}\`
Item: ${escMd(item)}`,
    confirm_yes: (item) => `🎉 *Order Complete!*\nEnjoy your ${escMd(item)}\\! ⭐`,
    confirm_no:  "⏳ We'll follow up with you shortly\\.",
    cancel:      "❌ Cancelled\\. Use /start to begin again\\.",
    invalid_phone: "⚠️ Invalid phone\\. Try: 0912345678",
    invalid_qty:   "⚠️ Enter a number like 1, 2, 3\\.\\.\\.",
    invalid_price: "⚠️ Enter a price in numbers only, e\\.g\\. 45000",
    not_admin:   "⛔ Admin only command\\.",
    support_ask: "💬 Type your message and we'll get back to you:",
    support_sent:"✅ Message sent to support\\! We'll reply soon\\.",
    wishlist_add:"❤️ Added to your wishlist\\!",
    wishlist_empty: "📭 Your wishlist is empty\\.",
    no_orders:   "📭 You have no orders yet\\.",
    myorders_title: "📋 *Your Orders:*",
    stock_zero:  "⚠️ Sorry, this item is *out of stock*\\.",
    sold_out_tag: "❌ SOLD OUT",
  },
  am: {
    welcome: (name) =>
`👋 እንኳን ወደ *${escMd(SHOP_NAME)}* በደህና መጡ\\!
${escMd(SHOP_TAGLINE)}

ምን ማድረግ ይፈልጋሉ?`,
    ask_name:    "📝 *ሙሉ ስምዎን* ያስገቡ:",
    ask_phone:   "📞 *ስልክ ቁጥርዎን* ያስገቡ:\n\\(ምሳሌ: 0912345678\\)",
    ask_address: "📍 *የመላኪያ አድራሻ* ያስገቡ:\n\\(ከተማ, ክፍለ ከተማ, አካባቢ\\)",
    ask_qty:     "🔢 ስንት ዕቃ ማዘዝ ይፈልጋሉ?",
    pay_title:   (dep, total) =>
`💳 *ክፍያ — 30% ቅድሚያ ያስፈልጋል*

ጠቅላላ ዋጋ: *${total} ብር*
አሁን ይክፈሉ: *${dep} ብር* \\(30%\\)

የክፍያ መንገድ ይምረጡ:`,
    pay_telebirr: `📱 *ቴሌብር*\nቁጥር: \`${TELEBIRR_NUMBER}\`\nስም: ${TELEBIRR_NAME}`,
    pay_bank:     `🏦 *ባንክ ዝውውር*\nባንክ: ${BANK_NAME}\nሂሳብ: \`${BANK_ACCOUNT}\`\nስም: ${BANK_HOLDER}`,
    pay_upload:   "✅ *የክፍያ ደረሰኝ ፎቶ ይላኩ* 👇",
    order_done:  (id) =>
`✅ *ትዕዛዝ ተቀብሏል!*

ትዕዛዝ ID: \`${id}\`
ክፍያዎን እናረጋግጣለን እና በ24 ሰዓት እናናግርዎታለን\\.

አመሰግናለን\\! 🙏`,
    confirm_ask: (id, item) =>
`📦 *ዕቃዎ ደርሷል?*

ትዕዛዝ: \`${id}\`
ዕቃ: ${escMd(item)}`,
    confirm_yes: (item) => `🎉 *ትዕዛዝ ተጠናቀቀ!*\n${escMd(item)} ደስ ይበልዎ\\! ⭐`,
    confirm_no:  "⏳ በቅርቡ እናናግርዎታለን\\.",
    cancel:      "❌ ተሰርዟል\\. /start ይጫኑ\\.",
    invalid_phone: "⚠️ ትክክለኛ ስልክ ቁጥር ያስገቡ: 0912345678",
    invalid_qty:   "⚠️ ቁጥር ያስገቡ: 1, 2, 3\\.\\.\\.",
    invalid_price: "⚠️ ዋጋ በቁጥር ያስገቡ፣ ምሳሌ: 45000",
    not_admin:   "⛔ ለአስተዳዳሪ ብቻ\\.",
    support_ask: "💬 መልዕክትዎን ይላኩ፣ ቶሎ እንመልሳለን:",
    support_sent:"✅ መልዕክት ተልኳል\\! ቶሎ እንመልሳለን\\.",
    wishlist_add:"❤️ ወደ wishlist ተጨምሯል\\!",
    wishlist_empty: "📭 Wishlist ባዶ ነው\\.",
    no_orders:   "📭 ምንም ትዕዛዝ የለዎትም\\.",
    myorders_title: "📋 *የእርስዎ ትዕዛዞች:*",
    stock_zero:  "⚠️ ይህ ዕቃ *አልቋል* — ይቅርታ\\.",
    sold_out_tag: "❌ ተሸጧል",
  },
};

function tr(lang, key, ...args) {
  const l   = T[lang] || T.en;
  const val = l[key] ?? T.en[key] ?? key;
  return typeof val === "function" ? val(...args) : val;
}

// ══════════════════════════════════════════════════════
//  BOT INIT
// ══════════════════════════════════════════════════════
const bot = new Telegraf(BOT_TOKEN);
bot.use(session());
bot.use((ctx, next) => { if (!ctx.session) ctx.session = {}; return next(); });

const getLang = (ctx) => ctx.session.lang || "en";
const getStep = (ctx) => ctx.session.step || S.IDLE;
const isAdmin = (ctx) => ctx.from?.id === ADMIN_CHAT_ID;

// ══════════════════════════════════════════════════════
//  MENUS
// ══════════════════════════════════════════════════════
function mainMenuKeyboard(lang) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(lang === "am" ? "📦 ዕቃዎቼ" : "📦 My Orders", "menu_myorders"),
      Markup.button.callback(lang === "am" ? "❤️ Wishlist" : "❤️ Wishlist",  "menu_wishlist"),
    ],
    [
      Markup.button.callback(lang === "am" ? "💬 ድጋፍ / Support" : "💬 Support", "menu_support"),
      Markup.button.callback(lang === "am" ? "🌐 ቋንቋ ቀይር" : "🌐 Change Language", "menu_lang"),
    ],
  ]);
}

function adminMenuKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("📦 Post Item",    "admin_postitem"),
      Markup.button.callback("📋 Orders",       "admin_orders"),
    ],
    [
      Markup.button.callback("📊 Stats",        "admin_stats"),
      Markup.button.callback("🔔 Broadcast",    "admin_broadcast"),
    ],
    [
      Markup.button.callback("🗂️ Manage Stock", "admin_stock"),
    ],
  ]);
}

// ══════════════════════════════════════════════════════
//  /start
// ══════════════════════════════════════════════════════
bot.command("start", async (ctx) => {
  const payload = ctx.message?.text?.split(" ")[1] || "";
  ctx.session   = {};

  // Deep link: ITEM_<slug>_<price>_<itemId>
  if (payload.startsWith("ITEM_")) {
    const parts = payload.split("_");
    const itemId = parts[3];
    const stored = items.get(itemId);

    ctx.session.item      = stored?.name  || parts[1].replace(/-/g, " ");
    ctx.session.itemPrice = stored?.price || parseInt(parts[2], 10) || 0;
    ctx.session.itemId    = itemId;
    ctx.session.itemStock = stored?.stock ?? 99;

    if (ctx.session.itemStock === 0) {
      const lang = getLang(ctx);
      return ctx.reply(tr(lang, "stock_zero"), { parse_mode: "MarkdownV2" });
    }
  }

  // Admin shortcut
  if (isAdmin(ctx) && !payload) {
    return ctx.reply(
      `👑 *Admin Panel — ${escMd(SHOP_NAME)}*\n\nChoose an action:`,
      { parse_mode: "MarkdownV2", ...adminMenuKeyboard() }
    );
  }

  // Language pick
  ctx.session.step = S.LANG;
  await ctx.reply(
    `🛍️ ${escMd(SHOP_NAME)}\n\nSelect language / ቋንቋ ምረጥ:`,
    Markup.inlineKeyboard([
      Markup.button.callback("🇬🇧 English", "lang_en"),
      Markup.button.callback("🇪🇹 አማርኛ",   "lang_am"),
    ])
  );
});

// ══════════════════════════════════════════════════════
//  LANGUAGE SELECTION
// ══════════════════════════════════════════════════════
bot.action(/^lang_(en|am)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const lang = ctx.match[1];
  ctx.session.lang = lang;

  // If coming from menu (change lang), just confirm
  if (ctx.session.changingLang) {
    ctx.session.changingLang = false;
    ctx.session.step = S.IDLE;
    return ctx.editMessageText(
      `✅ Language changed to ${lang === "en" ? "English 🇬🇧" : "አማርኛ 🇪🇹"}`,
      mainMenuKeyboard(lang)
    );
  }

  const item = ctx.session.item ? `\n🛍️ *${escMd(ctx.session.item)}*\n` : "";

  if (ctx.session.item) {
    ctx.session.step = S.NAME;
    return ctx.editMessageText(
      item + "\n" + tr(lang, "ask_name"),
      { parse_mode: "MarkdownV2" }
    );
  }

  ctx.session.step = S.IDLE;
  return ctx.editMessageText(
    tr(lang, "welcome", ""),
    { parse_mode: "MarkdownV2", ...mainMenuKeyboard(lang) }
  );
});

// ══════════════════════════════════════════════════════
//  MAIN MENU BUTTONS
// ══════════════════════════════════════════════════════
bot.action("menu_myorders", async (ctx) => {
  await ctx.answerCbQuery();
  const lang = getLang(ctx);
  const uid  = ctx.from.id;
  const mine = [...orders.values()].filter(o => o.userId === uid);

  if (!mine.length) {
    return ctx.editMessageText(tr(lang, "no_orders"), {
      parse_mode: "MarkdownV2",
      ...Markup.inlineKeyboard([[Markup.button.callback("🔙 Back", "menu_back")]]),
    });
  }

  const lines = mine.slice(-5).map(o =>
    `\`${o.orderId}\` — ${escMd(o.item)}\n  💰 ${o.totalPrice} ETB | 📌 ${o.status}`
  ).join("\n\n");

  return ctx.editMessageText(
    tr(lang, "myorders_title") + "\n\n" + lines,
    {
      parse_mode: "MarkdownV2",
      ...Markup.inlineKeyboard([[Markup.button.callback("🔙 Back", "menu_back")]]),
    }
  );
});

bot.action("menu_wishlist", async (ctx) => {
  await ctx.answerCbQuery();
  const lang = getLang(ctx);
  const cust = customers.get(ctx.from.id);
  const wl   = cust?.wishlist || [];

  if (!wl.length) {
    return ctx.editMessageText(tr(lang, "wishlist_empty"), {
      parse_mode: "MarkdownV2",
      ...Markup.inlineKeyboard([[Markup.button.callback("🔙 Back", "menu_back")]]),
    });
  }

  const lines = wl.map((id, i) => {
    const it = items.get(id);
    return it ? `${i + 1}\\. ${escMd(it.name)} — ${it.price?.toLocaleString()} ETB` : null;
  }).filter(Boolean).join("\n");

  return ctx.editMessageText(
    `❤️ *Your Wishlist:*\n\n${lines}`,
    {
      parse_mode: "MarkdownV2",
      ...Markup.inlineKeyboard([[Markup.button.callback("🔙 Back", "menu_back")]]),
    }
  );
});

bot.action("menu_support", async (ctx) => {
  await ctx.answerCbQuery();
  const lang = getLang(ctx);
  ctx.session.step = S.SUPPORT_MSG;
  return ctx.editMessageText(
    `💬 *Support / ድጋፍ*\n\n${tr(lang, "support_ask")}\n\n_Or contact directly: ${escMd(SUPPORT_USERNAME)}_`,
    {
      parse_mode: "MarkdownV2",
      ...Markup.inlineKeyboard([[Markup.button.callback("🔙 Cancel", "menu_back")]]),
    }
  );
});

bot.action("menu_lang", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session.changingLang = true;
  ctx.session.step = S.LANG;
  return ctx.editMessageText(
    "🌐 Select language / ቋንቋ ምረጡ:",
    Markup.inlineKeyboard([
      Markup.button.callback("🇬🇧 English", "lang_en"),
      Markup.button.callback("🇪🇹 አማርኛ",   "lang_am"),
    ])
  );
});

bot.action("menu_back", async (ctx) => {
  await ctx.answerCbQuery();
  const lang = getLang(ctx);
  ctx.session.step = S.IDLE;
  return ctx.editMessageText(
    tr(lang, "welcome", ""),
    { parse_mode: "MarkdownV2", ...mainMenuKeyboard(lang) }
  );
});

// ══════════════════════════════════════════════════════
//  ADMIN MENU BUTTONS
// ══════════════════════════════════════════════════════
bot.action("admin_postitem", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery("Not authorized", { show_alert: true });
  await ctx.answerCbQuery();
  ctx.session = { step: S.P_NAME };
  return ctx.editMessageText(
    "📦 *New Product*\n\nStep 1/5 — Enter the *product name*:\n\n_Example: Lenovo Legion R9000P Gaming Laptop_",
    { parse_mode: "MarkdownV2" }
  );
});

bot.action("admin_orders", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery("Not authorized", { show_alert: true });
  await ctx.answerCbQuery();
  if (!orders.size) return ctx.editMessageText("📭 No orders yet\\.", { parse_mode: "MarkdownV2" });

  const last = [...orders.values()].slice(-10).reverse();
  const lines = last.map(o =>
    `\`${o.orderId}\` ${escMd(o.item)}\n👤 ${escMd(o.name)} | 📞 ${o.phone}\n💰 ${o.totalPrice} ETB | 📌 ${o.status}`
  ).join("\n\n");

  return ctx.editMessageText(
    `📋 *Recent Orders:*\n\n${lines}`,
    {
      parse_mode: "MarkdownV2",
      ...Markup.inlineKeyboard([[Markup.button.callback("🔙 Back", "admin_back")]]),
    }
  );
});

bot.action("admin_stats", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery("Not authorized", { show_alert: true });
  await ctx.answerCbQuery();

  const all        = [...orders.values()];
  const total      = all.length;
  const delivered  = all.filter(o => o.status === "delivered").length;
  const pending    = all.filter(o => o.status === "pending_review").length;
  const approved   = all.filter(o => o.status === "approved").length;
  const revenue    = all.filter(o => o.status === "delivered")
                        .reduce((s, o) => s + o.totalPrice, 0);
  const deposits   = all.filter(o => ["approved","delivered"].includes(o.status))
                        .reduce((s, o) => s + o.deposit, 0);
  const totalItems = items.size;
  const inStock    = [...items.values()].filter(i => i.stock > 0).length;

  return ctx.editMessageText(
`📊 *Sales Dashboard*

🛒 Total Orders: *${total}*
✅ Delivered: *${delivered}*
🔄 Approved / In progress: *${approved}*
⏳ Pending review: *${pending}*

💰 Total Revenue: *${revenue.toLocaleString()} ETB*
💳 Deposits Collected: *${deposits.toLocaleString()} ETB*

📦 Products Listed: *${totalItems}*
✅ In Stock: *${inStock}*`,
    {
      parse_mode: "MarkdownV2",
      ...Markup.inlineKeyboard([[Markup.button.callback("🔙 Back", "admin_back")]]),
    }
  );
});

bot.action("admin_broadcast", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery("Not authorized", { show_alert: true });
  await ctx.answerCbQuery();
  ctx.session.step = S.BROADCAST_MSG;
  return ctx.editMessageText(
    "📢 *Broadcast Message*\n\nType the message to send to ALL customers who have ordered:",
    {
      parse_mode: "MarkdownV2",
      ...Markup.inlineKeyboard([[Markup.button.callback("❌ Cancel", "admin_back")]]),
    }
  );
});

bot.action("admin_stock", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery("Not authorized", { show_alert: true });
  await ctx.answerCbQuery();
  if (!items.size) return ctx.editMessageText("📭 No products listed yet\\.", { parse_mode: "MarkdownV2" });

  const rows = [...items.values()].slice(-8).map(it =>
    [Markup.button.callback(
      `${it.stock === 0 ? "❌" : "✅"} ${it.name.substring(0, 20)} (${it.stock})`,
      `toggle_stock_${it.id}`
    )]
  );
  rows.push([Markup.button.callback("🔙 Back", "admin_back")]);

  return ctx.editMessageText(
    "🗂️ *Stock Manager*\n\nTap an item to mark as Sold Out / In Stock:",
    { parse_mode: "MarkdownV2", ...Markup.inlineKeyboard(rows) }
  );
});

bot.action(/^toggle_stock_(.+)$/, async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery("Not authorized", { show_alert: true });
  await ctx.answerCbQuery();
  const id   = ctx.match[1];
  const item = items.get(id);
  if (!item) return;
  item.stock = item.stock === 0 ? 99 : 0;
  await ctx.answerCbQuery(
    item.stock === 0 ? `❌ ${item.name} marked SOLD OUT` : `✅ ${item.name} back IN STOCK`,
    { show_alert: true }
  );
  // Refresh stock panel
  return ctx.editMessageReplyMarkup(
    Markup.inlineKeyboard(
      [...items.values()].slice(-8).map(it =>
        [Markup.button.callback(
          `${it.stock === 0 ? "❌" : "✅"} ${it.name.substring(0, 20)} (${it.stock})`,
          `toggle_stock_${it.id}`
        )]
      ).concat([[Markup.button.callback("🔙 Back", "admin_back")]])
    ).reply_markup
  );
});

bot.action("admin_back", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session = {};
  return ctx.editMessageText(
    `👑 *Admin Panel — ${escMd(SHOP_NAME)}*\n\nChoose an action:`,
    { parse_mode: "MarkdownV2", ...adminMenuKeyboard() }
  );
});

// Wishlist button from channel order
bot.action(/^wishlist_add_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const lang   = getLang(ctx);
  const itemId = ctx.match[1];
  const uid    = ctx.from.id;
  if (!customers.has(uid)) customers.set(uid, { wishlist: [] });
  const cust = customers.get(uid);
  if (!cust.wishlist.includes(itemId)) cust.wishlist.push(itemId);
  return ctx.answerCbQuery(lang === "am" ? "❤️ Wishlist ገባ!" : "❤️ Added to wishlist!", { show_alert: true });
});

// ══════════════════════════════════════════════════════
//  APPROVE / REJECT (admin taps on order notification)
// ══════════════════════════════════════════════════════
bot.action(/^oa_(approve|reject)_(.+)$/, async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery("Not authorized", { show_alert: true });
  await ctx.answerCbQuery();

  const action  = ctx.match[1];
  const orderId = ctx.match[2];
  const order   = orders.get(orderId);
  if (!order) return ctx.editMessageCaption("⚠️ Order not found\\.", { parse_mode: "MarkdownV2" });

  const lang = order.lang;

  if (action === "approve") {
    order.status = "approved";
    await ctx.telegram.sendMessage(order.userId,
      tr(lang, "confirm_ask", orderId, order.item),
      {
        parse_mode: "MarkdownV2",
        ...Markup.inlineKeyboard([
          Markup.button.callback(lang === "am" ? "✅ አዎ ደረሰኝ!" : "✅ Yes, received!", `del_confirm_${orderId}`),
          Markup.button.callback(lang === "am" ? "⏳ አልደረሰም"  : "⏳ Not yet",         `del_notyet_${orderId}`),
        ]),
      }
    );
    const cap = (ctx.callbackQuery.message.caption || "") + "\n\n✅ *Approved & customer notified*";
    await ctx.editMessageCaption(cap, { parse_mode: "MarkdownV2" }).catch(() => {});
  } else {
    order.status = "rejected";
    await ctx.telegram.sendMessage(order.userId,
      `❌ Your order \`${orderId}\` was not approved\\. Please contact support: ${escMd(SUPPORT_USERNAME)}`,
      { parse_mode: "MarkdownV2" }
    );
    const cap = (ctx.callbackQuery.message.caption || "") + "\n\n❌ *Rejected & customer notified*";
    await ctx.editMessageCaption(cap, { parse_mode: "MarkdownV2" }).catch(() => {});
  }
});

// ══════════════════════════════════════════════════════
//  DELIVERY CONFIRM
// ══════════════════════════════════════════════════════
bot.action(/^del_(confirm|notyet)_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const action  = ctx.match[1];
  const orderId = ctx.match[2];
  const order   = orders.get(orderId);
  if (!order) return;
  const lang = order.lang;

  if (action === "confirm") {
    order.status = "delivered";
    await ctx.editMessageText(tr(lang, "confirm_yes", order.item), { parse_mode: "MarkdownV2" });
    await ctx.telegram.sendMessage(ADMIN_CHAT_ID,
      `✅ *Delivery Confirmed*\nOrder: \`${orderId}\`\nCustomer: ${escMd(order.name)} — ${order.phone}`,
      { parse_mode: "MarkdownV2" }
    );
  } else {
    await ctx.editMessageText(tr(lang, "confirm_no"), { parse_mode: "MarkdownV2" });
  }
});

// ══════════════════════════════════════════════════════
//  PAYMENT METHOD PICK
// ══════════════════════════════════════════════════════
bot.action(/^pm_(telebirr|bank)$/, async (ctx) => {
  await ctx.answerCbQuery();
  const lang   = getLang(ctx);
  const method = ctx.match[1] === "telebirr" ? "Telebirr" : "Bank";
  ctx.session.paymentMethod = method;
  const detail = method === "Telebirr" ? tr(lang, "pay_telebirr") : tr(lang, "pay_bank");
  await ctx.editMessageText(
    detail + "\n\n" + tr(lang, "pay_upload"),
    { parse_mode: "MarkdownV2" }
  );
});

// ══════════════════════════════════════════════════════
//  COMMANDS
// ══════════════════════════════════════════════════════
bot.command("cancel", async (ctx) => {
  const lang = getLang(ctx);
  ctx.session = {};
  return ctx.reply(tr(lang, "cancel"), { parse_mode: "MarkdownV2" });
});

bot.command("support", async (ctx) => {
  const lang = getLang(ctx);
  ctx.session.step = S.SUPPORT_MSG;
  return ctx.reply(
    `💬 *Support*\n\n${tr(lang, "support_ask")}\n\n_Direct: ${escMd(SUPPORT_USERNAME)}_`,
    { parse_mode: "MarkdownV2" }
  );
});

bot.command("myorders", async (ctx) => {
  const lang = getLang(ctx);
  const uid  = ctx.from.id;
  const mine = [...orders.values()].filter(o => o.userId === uid);
  if (!mine.length) return ctx.reply(tr(lang, "no_orders"), { parse_mode: "MarkdownV2" });

  const lines = mine.slice(-5).map(o =>
    `\`${o.orderId}\` — ${escMd(o.item)}\n  💰 ${o.totalPrice} ETB | 📌 ${o.status}`
  ).join("\n\n");

  return ctx.reply(tr(lang, "myorders_title") + "\n\n" + lines, { parse_mode: "MarkdownV2" });
});

bot.command("orders", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply(tr("en", "not_admin"), { parse_mode: "MarkdownV2" });
  if (!orders.size)  return ctx.reply("📭 No orders yet\\.", { parse_mode: "MarkdownV2" });

  const last = [...orders.values()].slice(-10).reverse();
  const lines = last.map(o =>
    `\`${o.orderId}\` ${escMd(o.item)}\n👤 ${escMd(o.name)} | 📞 ${o.phone}\n💰 ${o.totalPrice} ETB | 📌 ${o.status}`
  ).join("\n\n");
  return ctx.reply(`📋 *Recent Orders:*\n\n${lines}`, { parse_mode: "MarkdownV2" });
});

bot.command("stats", async (ctx) => {
  if (!isAdmin(ctx)) return;
  const all       = [...orders.values()];
  const revenue   = all.filter(o => o.status === "delivered").reduce((s, o) => s + o.totalPrice, 0);
  const delivered = all.filter(o => o.status === "delivered").length;
  return ctx.reply(
    `📊 *Stats*\nOrders: ${all.length} | Delivered: ${delivered} | Revenue: ${revenue.toLocaleString()} ETB`,
    { parse_mode: "MarkdownV2" }
  );
});

bot.command("postitem", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply(tr("en", "not_admin"), { parse_mode: "MarkdownV2" });
  ctx.session = { step: S.P_NAME };
  return ctx.reply(
    "📦 *New Product — Step 1/5*\n\nEnter the *product name*:\n_Example: Lenovo Legion R9000P Gaming Laptop_",
    { parse_mode: "MarkdownV2" }
  );
});

bot.command("skip", async (ctx) => {
  if (!isAdmin(ctx) || getStep(ctx) !== S.P_PHOTO) return;
  await publishToChannel(ctx, null);
});

bot.command("broadcast", async (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.session.step = S.BROADCAST_MSG;
  return ctx.reply("📢 Type your broadcast message:");
});

// ══════════════════════════════════════════════════════
//  MESSAGE HANDLER — drives all conversations
// ══════════════════════════════════════════════════════
bot.on("message", async (ctx) => {
  const step = getStep(ctx);
  const lang = getLang(ctx);
  const text = ctx.message?.text?.trim() || "";

  // ── SUPPORT MESSAGE ─────────────────────────────
  if (step === S.SUPPORT_MSG) {
    if (!text) return;
    ctx.session.step = S.IDLE;
    const from = ctx.from;
    await ctx.telegram.sendMessage(
      ADMIN_CHAT_ID,
      `💬 *Support Message*\nFrom: ${escMd(from.first_name)} ${escMd(from.last_name || "")} \\(@${escMd(from.username || "no username")}\\)\nID: \`${from.id}\`\n\n${escMd(text)}`,
      {
        parse_mode: "MarkdownV2",
        ...Markup.inlineKeyboard([[
          Markup.button.url("💬 Reply", `tg://user?id=${from.id}`),
        ]]),
      }
    );
    return ctx.reply(tr(lang, "support_sent"), { parse_mode: "MarkdownV2" });
  }

  // ── BROADCAST ───────────────────────────────────
  if (step === S.BROADCAST_MSG && isAdmin(ctx)) {
    if (!text) return;
    ctx.session.step = S.IDLE;
    const uids = [...new Set([...orders.values()].map(o => o.userId))];
    let sent = 0;
    for (const uid of uids) {
      try {
        await ctx.telegram.sendMessage(uid,
          `📢 *Message from ${escMd(SHOP_NAME)}:*\n\n${escMd(text)}`,
          { parse_mode: "MarkdownV2" }
        );
        sent++;
      } catch {}
    }
    return ctx.reply(`✅ Broadcast sent to ${sent} customers.`);
  }

  // ── ORDER FLOW ──────────────────────────────────
  if (step === S.NAME) {
    if (!text) return;
    ctx.session.name = text;
    ctx.session.step = S.PHONE;
    return ctx.reply(tr(lang, "ask_phone"), { parse_mode: "MarkdownV2" });
  }

  if (step === S.PHONE) {
    const clean = text.replace(/\s/g, "");
    if (!/^(09|07|\+2519|\+2517)\d{8}$/.test(clean)) {
      return ctx.reply(tr(lang, "invalid_phone"), { parse_mode: "MarkdownV2" });
    }
    ctx.session.phone = clean;

    // Save customer profile
    const uid = ctx.from.id;
    if (!customers.has(uid)) customers.set(uid, { wishlist: [] });
    Object.assign(customers.get(uid), { name: ctx.session.name, phone: clean, lang });

    ctx.session.step = S.ADDRESS;
    return ctx.reply(tr(lang, "ask_address"), { parse_mode: "MarkdownV2" });
  }

  if (step === S.ADDRESS) {
    if (!text) return;
    ctx.session.address = text;
    ctx.session.step    = S.QTY;
    return ctx.reply(tr(lang, "ask_qty"), { parse_mode: "MarkdownV2" });
  }

  if (step === S.QTY) {
    const qty = parseInt(text, 10);
    if (isNaN(qty) || qty < 1) {
      return ctx.reply(tr(lang, "invalid_qty"), { parse_mode: "MarkdownV2" });
    }
    const price   = (ctx.session.itemPrice || 0) * qty;
    const deposit = Math.round(price * 0.3);
    ctx.session.qty        = qty;
    ctx.session.totalPrice = price;
    ctx.session.deposit    = deposit;
    ctx.session.step       = S.SCREENSHOT;

    return ctx.reply(
      tr(lang, "pay_title", deposit, price),
      {
        parse_mode: "MarkdownV2",
        ...Markup.inlineKeyboard([
          Markup.button.callback(lang === "am" ? "📱 ቴሌብር" : "📱 Telebirr", "pm_telebirr"),
          Markup.button.callback(lang === "am" ? "🏦 ባንክ"   : "🏦 Bank",     "pm_bank"),
        ]),
      }
    );
  }

  // ── ADMIN POST ITEM FLOW ─────────────────────────
  if (step === S.P_NAME && isAdmin(ctx)) {
    if (!text) return;
    ctx.session.pName = text;
    ctx.session.step  = S.P_SPEC;
    return ctx.reply(
      "📋 *Step 2/5 — Specifications*\n\nPaste the full specs \\(copy from your listing\\):\n_Example: RYZEN 7, 16GB RAM, 512GB SSD, RTX 3060_",
      { parse_mode: "MarkdownV2" }
    );
  }

  if (step === S.P_SPEC && isAdmin(ctx)) {
    if (!text) return;
    ctx.session.pSpec = text;
    ctx.session.step  = S.P_PRICE;
    return ctx.reply(
      "💰 *Step 3/5 — Price*\n\nEnter the price in ETB \\(numbers only\\):\n_Example: 178000_",
      { parse_mode: "MarkdownV2" }
    );
  }

  if (step === S.P_PRICE && isAdmin(ctx)) {
    const price = parseInt(text.replace(/[,. ]/g, ""), 10);
    if (isNaN(price) || price < 1) {
      return ctx.reply(tr("en", "invalid_price"), { parse_mode: "MarkdownV2" });
    }
    ctx.session.pPrice = price;
    ctx.session.step   = S.P_STOCK;
    return ctx.reply(
      "📦 *Step 4/5 — Stock Quantity*\n\nHow many units do you have?\n_Enter a number, e\\.g\\. 3_",
      { parse_mode: "MarkdownV2" }
    );
  }

  if (step === S.P_STOCK && isAdmin(ctx)) {
    const stock = parseInt(text, 10);
    if (isNaN(stock) || stock < 0) {
      return ctx.reply("⚠️ Enter a valid number\\.", { parse_mode: "MarkdownV2" });
    }
    ctx.session.pStock = stock;
    ctx.session.step   = S.P_PHOTO;
    return ctx.reply(
      "📸 *Step 5/5 — Photo*\n\nSend the product photo\\.\nOr type /skip for no photo\\.",
      { parse_mode: "MarkdownV2" }
    );
  }
});

// ══════════════════════════════════════════════════════
//  PHOTO HANDLER
// ══════════════════════════════════════════════════════
bot.on("photo", async (ctx) => {
  const step   = getStep(ctx);
  const lang   = getLang(ctx);
  const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

  // Admin posting item photo
  if (step === S.P_PHOTO && isAdmin(ctx)) {
    return publishToChannel(ctx, fileId);
  }

  // Customer uploading payment screenshot
  if (step === S.SCREENSHOT) {
    return handleScreenshot(ctx, fileId);
  }
});

// Also accept document screenshots
bot.on("document", async (ctx) => {
  if (getStep(ctx) === S.SCREENSHOT) {
    return handleScreenshot(ctx, ctx.message.document.file_id);
  }
});

// ══════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════
async function handleScreenshot(ctx, fileId) {
  const lang    = getLang(ctx);
  const orderId = newOrderId();

  const order = {
    orderId,
    userId:        ctx.from.id,
    lang,
    item:          ctx.session.item         || "Unknown",
    itemId:        ctx.session.itemId       || "",
    itemPrice:     ctx.session.itemPrice    || 0,
    qty:           ctx.session.qty          || 1,
    totalPrice:    ctx.session.totalPrice   || 0,
    deposit:       ctx.session.deposit      || 0,
    name:          ctx.session.name         || ctx.from.first_name,
    phone:         ctx.session.phone        || "—",
    address:       ctx.session.address      || "—",
    paymentMethod: ctx.session.paymentMethod|| "Not selected",
    screenshot:    fileId,
    status:        "pending_review",
    createdAt:     new Date().toISOString(),
  };
  orders.set(orderId, order);

  // Decrease stock
  if (order.itemId && items.has(order.itemId)) {
    const it = items.get(order.itemId);
    it.stock = Math.max(0, it.stock - order.qty);
  }

  ctx.session = {};

  // Notify admin
  try {
    await ctx.telegram.sendPhoto(ADMIN_CHAT_ID, fileId, {
      caption: `🆕 *New Order!*\n\nID: \`${orderId}\`\nItem: ${escMd(order.item)}\nQty: ${order.qty}\nTotal: ${order.totalPrice} ETB\nDeposit: ${order.deposit} ETB\nName: ${escMd(order.name)}\nPhone: \`${order.phone}\`\nAddress: ${escMd(order.address)}\nPayment: ${order.paymentMethod}`,
      parse_mode: "MarkdownV2",
      ...Markup.inlineKeyboard([
        Markup.button.callback("✅ Approve", `oa_approve_${orderId}`),
        Markup.button.callback("❌ Reject",  `oa_reject_${orderId}`),
      ]),
    });
  } catch (e) {
    console.error("Admin notify failed:", e.message);
  }

  return ctx.reply(tr(lang, "order_done", orderId), { parse_mode: "MarkdownV2" });
}

async function publishToChannel(ctx, photoFileId) {
  const name    = ctx.session.pName  || "Item";
  const spec    = ctx.session.pSpec  || "";
  const price   = ctx.session.pPrice || 0;
  const stock   = ctx.session.pStock ?? 1;
  const deposit = Math.round(price * 0.3);

  const itemId  = newItemId();
  const slug    = name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").substring(0, 20);
  const deepLink = `https://t.me/${ctx.botInfo.username}?start=ITEM_${slug}_${price}_${itemId}`;
  const wlLink   = `https://t.me/${ctx.botInfo.username}?start=WL_${itemId}`;

  // Save to catalog
  items.set(itemId, { id: itemId, name, spec, price, stock, photo: photoFileId });

  const caption = [
    `🛍️ *${escMd(name)}*`,
    "",
    `📋 *Specs:*`,
    escMd(spec),
    "",
    `💰 Price: *${price.toLocaleString()} ETB*`,
    `⬇️ Deposit: *${deposit.toLocaleString()} ETB* \\(30%\\)`,
    `📦 Stock: *${stock} unit${stock !== 1 ? "s" : ""}*`,
    "",
    "👇 Tap *Order Now* to buy\\!",
  ].join("\n");

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.url("🛒 Order Now / አሁን ዕዘዝ", deepLink)],
    [Markup.button.url("❤️ Add to Wishlist",       wlLink)],
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
    await ctx.reply(
      `✅ *Posted to channel\\!*\n\nItem ID: \`${itemId}\`\nStock: ${stock}`,
      { parse_mode: "MarkdownV2" }
    );
  } catch (err) {
    await ctx.reply(`❌ Failed: ${err.message}`);
  }

  ctx.session = {};
}

function escMd(t = "") {
  return String(t).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

// ══════════════════════════════════════════════════════
//  LAUNCH
// ══════════════════════════════════════════════════════
bot.launch()
  .then(() => {
    console.log(`🤖 ${SHOP_NAME} Bot is running!`);
    console.log("Press Ctrl+C to stop.");
  })
  .catch((err) => console.error("❌ Failed to start:", err.message));

process.once("SIGINT",  () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
