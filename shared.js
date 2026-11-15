// e-Kad demo — shared data, storage, language and name matching.
// In the real product this data lives in a database (Firebase). In the demo it
// lives in this browser's localStorage so the card and dashboard talk to each other.

// ---------- language ----------
// Each viewer picks their own language; the choice is remembered on their phone.
let LANG = (() => { try { return localStorage.getItem('ekadLang') || 'ms'; } catch (e) { return 'ms'; } })();
function setLang(l) {
  LANG = l === 'en' ? 'en' : 'ms';
  try { localStorage.setItem('ekadLang', LANG); } catch (e) {}
  document.documentElement.lang = LANG;
}
// L({ms, en}) picks the right version of a bilingual value; plain strings pass through.
const L = o => (o && typeof o === 'object' && 'ms' in o) ? (o[LANG] || o.ms) : o;
function t(key, ...a) {
  const d = STR[LANG] && STR[LANG][key] !== undefined ? STR[LANG][key] : STR.ms[key];
  return typeof d === 'function' ? d(...a) : (d === undefined ? key : d);
}
// Fill every element marked data-i18n / data-i18n-ph / data-i18n-aria.
function applyI18n() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.querySelectorAll('.lang-toggle [data-lang]').forEach(b => {
    b.classList.toggle('on', b.dataset.lang === LANG);
    b.setAttribute('aria-pressed', b.dataset.lang === LANG);
  });
}

const WEDDING = {
  bride: 'Aisyah',
  groom: 'Hakim',
  brideFull: 'Nur Aisyah binti Rahmat',
  groomFull: 'Muhammad Hakim bin Ismail',
  hosts: 'Encik Rahmat bin Osman & Puan Zainab binti Ali',
  date: '2026-12-12T11:00:00+08:00',
  dateText: { ms: 'Sabtu, 12 Disember 2026', en: 'Saturday, 12 December 2026' },
  hijriText: { ms: '3 Rejab 1448H (anggaran)', en: '3 Rajab 1448H (approx.)' },
  // Prayer times on the wedding date at the venue (MUIS method, via aladhan.com). The real product fetches these per couple.
  prayers: [['Zohor', '12:58'], ['Asar', '16:23']],
  prayerNames: { Zohor: { ms: 'Zohor', en: 'Zuhr' }, Asar: { ms: 'Asar', en: 'Asr' } },
  // How to spot the majlis once you arrive — written by the family.
  landmark: {
    ms: 'Cari khemah putih di void deck Blk 123, bersebelahan taman permainan. Pintu masuk dari Tampines St 11.',
    en: 'Look for the white tent at the Blk 123 void deck, next to the playground. Enter from Tampines St 11.',
  },
  timeText: { ms: '11 pagi – 5 petang', en: '11am – 5pm' },
  rsvpBy: { ms: '5 Disember', en: '5 December' },
  venue: 'Void deck Blk 123 Tampines St 11',
  venueNote: {
    ms: 'MRT terdekat: Tampines (EW2/DT32). Parkir: tempat letak kereta bermeter HDB berdekatan.',
    en: 'Nearest MRT: Tampines (EW2/DT32). Parking: HDB metered car park nearby.',
  },
  mapQuery: 'Blk 123 Tampines Street 11 Singapore',
  schedule: [
    [{ ms: '11:00 pagi', en: '11:00am' }, { ms: 'Jamuan dibuka', en: 'Lunch is served' }],
    [{ ms: '1:00 petang', en: '1:00pm' }, { ms: 'Ketibaan pengantin & persandingan', en: 'Arrival of the couple & bersanding' }],
    [{ ms: '5:00 petang', en: '5:00pm' }, { ms: 'Majlis bersurai', en: 'Reception ends' }],
  ],
  slots: [
    { key: 's1', label: { ms: '11 pagi – 1 petang', en: '11am – 1pm' } },
    { key: 's2', label: { ms: '1 – 3 petang', en: '1 – 3pm' } },
    { key: 's3', label: { ms: '3 – 5 petang', en: '3 – 5pm' } },
  ],
  maxPax: 8,
  theme: 'songket',        // songket | bunga | moden — chosen by the couple
  icsFile: 'walimah.ics',  // calendar file published with the card
};
const THEMES = ['songket', 'bunga', 'moden'];

// Google Calendar "add event" link (best on Android) — times in UTC.
function gcalUrl() {
  const f = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const start = new Date(WEDDING.date), end = new Date(start.getTime() + 6 * 3600000);
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + encodeURIComponent('Walimatul Urus ' + WEDDING.bride + ' & ' + WEDDING.groom) +
    '&dates=' + f(start) + '/' + f(end) +
    '&location=' + encodeURIComponent(WEDDING.venue + ', Singapore') +
    '&details=' + encodeURIComponent(cardUrl());
}
const masjidUrl = () => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('masjid near ' + WEDDING.mapQuery);
const mapsUrl = () => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(WEDDING.mapQuery);
const wazeUrl = () => 'https://waze.com/ul?q=' + encodeURIComponent(WEDDING.mapQuery);
// Wedding-day mode: on the date itself (Singapore time), or forced with ?hari=1 for demos.
function isWeddingDay() {
  if (new URLSearchParams(location.search).get('hari') === '1') return true;
  const sg = d => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
  return sg(Date.now()) === sg(WEDDING.date);
}
// Live status during the day, from the schedule times.
function dayStatus() {
  const start = new Date(WEDDING.date), end = new Date(start.getTime() + 6 * 3600000), now = Date.now();
  if (new URLSearchParams(location.search).get('hari') === '1') return 'live';
  return now < start ? 'soon' : now > end ? 'ended' : 'live';
}
// Busiest arrival window, from RSVP answers.
function busiestSlot(db) {
  const tt = totals(db, '');
  const best = Object.entries(tt.slots).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] ? best[0] : null;
}
const updateText = u => (u.preset != null ? t('dd_presets')[u.preset] : u.text);
const isAndroid = () => /Android/i.test(navigator.userAgent);
const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Whose invite list a guest is on. Each list owner also gets their own card link (?dari=key).
const LISTS = [
  { key: 'mak', label: { ms: 'Mak (Puan Zainab)', en: 'Mum (Puan Zainab)' }, short: { ms: 'Mak', en: 'Mum' } },
  { key: 'ayah', label: { ms: 'Ayah (Encik Rahmat)', en: 'Dad (Encik Rahmat)' }, short: { ms: 'Ayah', en: 'Dad' } },
  { key: 'aisyah', label: 'Aisyah', short: 'Aisyah' },
  { key: 'hakim', label: 'Hakim', short: 'Hakim' },
];
const OTHER = { ms: 'Lain-lain', en: 'Other' };
const listLabel = k => L((LISTS.find(l => l.key === k) || { label: OTHER }).label);
const listShort = k => L((LISTS.find(l => l.key === k) || { short: OTHER }).short);
const slotLabel = k => { const s = WEDDING.slots.find(x => x.key === k); return s ? L(s.label) : '—'; };

// ---------- text ----------
const STR = {
  ms: {
    // invitation card
    cover_eyebrow: 'Walimatul Urus', cover_to: 'Kepada tetamu yang dihormati', open: 'Buka kad',
    demo_card: 'Ini kad contoh. <a href="dashboard.html">Lihat papan pemuka pengantin →</a>',
    hosts_eyebrow: 'Dengan penuh kesyukuran',
    invite_text: "dengan segala hormatnya menjemput Dato' / Datin / Tuan / Puan / Encik / Cik sekeluarga ke majlis perkahwinan puteri kami",
    with_partner: 'dengan pasangannya',
    when_eyebrow: 'Tarikh &amp; tempat', save_date: 'Simpan tarikh', countdown: 'Kiraan detik',
    cd_d: 'hari', cd_h: 'jam', cd_m: 'minit', cd_s: 'saat',
    sched_eyebrow: 'Atur cara',
    rsvp_eyebrow: 'Sahkan kehadiran',
    rsvp_intro: () => `Mohon maklumkan sebelum <b>${L(WEDDING.rsvpBy)}</b> supaya kami dapat menyediakan juadah secukupnya.`,
    f_name: 'Nama anda', f_name_ph: 'Nama seperti yang keluarga kenal',
    f_attend: 'Adakah anda dapat hadir?', f_yes: 'InsyaAllah hadir', f_no: 'Maaf, tidak dapat',
    f_pax: 'Berapa orang termasuk anda?', f_pax_max: n => 'maksimum ' + n, f_minus: 'Kurang', f_plus: 'Tambah',
    f_slot: 'Anggaran masa anda tiba',
    f_dari: 'Anda dijemput oleh', f_choose: 'Pilih…', f_other: 'Lain-lain / kenalan keluarga',
    f_phone: 'No. telefon <small>(pilihan, untuk peringatan sehari sebelum majlis)</small>',
    f_wish: 'Ucapan &amp; doa <small>(pilihan)</small>', f_wish_ph: 'Selamat pengantin baru…',
    f_send: 'Hantar', f_update: 'Kemas kini jawapan',
    f_privacy: 'Maklumat anda hanya dikongsi dengan keluarga pengantin dan dipadam selepas majlis.',
    e_name: 'Masukkan nama anda.', e_attend: 'Pilih salah satu.', e_slot: 'Pilih anggaran masa tiba.',
    thanks: 'Terima kasih',
    thanks_yes: (pax, slot) => `Jawapan anda diterima: ${pax} orang, ${slot}. Jumpa di majlis, InsyaAllah.`,
    thanks_no: 'Jawapan anda diterima. Terima kasih atas doa anda.',
    edit_reply: 'Ubah jawapan',
    wishes_eyebrow: 'Ucapan tetamu', wishes_none: 'Jadilah yang pertama mengirim ucapan.',
    footer: 'Kad digital · demo &nbsp;·&nbsp; <a href="dashboard.html">Papan pemuka pengantin</a>',
    demo_short: 'Kad contoh', demo_theme: 'Tema', demo_dash_link: 'Papan pemuka →',
    th_songket: 'Songket', th_bunga: 'Bunga', th_moden: 'Moden',
    tap_open: 'Ketik untuk buka',
    cal_pick: 'Pilih kalendar anda:', cal_google: 'Google Calendar', cal_apple: 'iPhone / Outlook',
    music_on: 'Mainkan muzik', music_off: 'Hentikan muzik',

    // dashboard
    demo_dash: 'Demo: data disimpan dalam pelayar ini sahaja. <a href="index.html" target="_blank">Buka kad tetamu</a> · <button id="reset">Set semula demo</button>',
    view_all: 'Semua senarai', view_list: s => 'Senarai ' + s, view_as: 'Lihat sebagai',
    days_left: n => n + ' hari lagi',
    tab_home: 'Ringkasan', tab_done: 'Sudah balas', tab_wait: 'Belum balas', tab_guests: 'Senarai jemputan', tab_msgs: 'Mesej',
    digest_title: 'Ringkasan hari ini', digest_sub: 'dihantar ke e-mel anda setiap pagi',
    digest_new: (n, names) => `<b>${n} balasan baru</b> dalam 24 jam: ${names}`,
    digest_none: 'Tiada balasan baru dalam 24 jam.',
    digest_wait: (w, p) => `${w} jemputan belum balas${p ? ` · ${p} perlu anda sahkan` : ''}.`,
    m_yes: 'Hadir', m_yes_sub: n => `pax · ${n} balasan`, m_no: 'Tidak dapat hadir',
    m_wait: 'Belum balas', m_wait_sub: n => 'daripada ' + n,
    m_extra: 'Tetamu tambahan', m_extra_sub: 'dapat kad yang dikongsi',
    c_slots: 'Anggaran masa tiba', pax: 'pax',
    c_side: 'Ikut senarai jemputan', c_side_sub: 'pax hadir', none_yet: 'Belum ada.',
    bk_title: 'Pax ditempah', bk_sub: 'semua senarai', bk_of: (c, b) => `<b>${c}</b> / ${b} pax disahkan`,
    bk_left: (n, w) => `Baki ${n} pax · ${w} jemputan belum balas`,
    bk_near: n => `Hampir penuh: tinggal ${n} pax sahaja.`,
    bk_over: n => `Melebihi tempahan sebanyak ${n} pax. Pertimbangkan untuk menambah tempahan.`,
    bk_edit: 'Ubah', bk_label: 'Jumlah pax yang ditempah', bk_saved: 'Jumlah pax dikemas kini',
    bk_err: 'Masukkan nombor yang sah.',
    pray_title: 'Waktu solat pada hari majlis', masjid_btn: 'Masjid / surau terdekat',
    day_live: 'Majlis sedang berlangsung', day_soon: () => 'Majlis hari ini · ' + L(WEDDING.timeText),
    day_ended: 'Majlis telah bersurai. Terima kasih kerana hadir!',
    day_title: 'Jalan ke majlis', day_arrive: 'Bila sampai', day_busy: s => `Paling ramai dijangka ${s}.`, day_early: ' Datang lebih awal untuk elak sesak.',
    day_updates: 'Kemas kini daripada keluarga', day_full: 'Lihat kad penuh ↓', demo_day: 'Hari majlis',
    dd_title: 'Hari majlis', dd_sub: 'kemas kini untuk tetamu',
    dd_note: 'Kemas kini ini muncul di bahagian atas kad pada hari majlis, bersama arah ke lokasi.',
    dd_presets: ['Pengantin dah sampai 💐', 'Persandingan sedang berlangsung', 'Juadah masih banyak, jemput datang', 'Parkir hampir penuh, digalakkan naik MRT'],
    dd_custom_ph: 'Tulis kemas kini sendiri…', dd_post: 'Hantar', dd_posted: 'Kemas kini dihantar', dd_none: 'Belum ada kemas kini.',
    dd_delete: 'Padam', dd_preview: 'Lihat kad hari majlis',
    digest_near: (c, b) => `Perhatian: ${c} / ${b} pax ditempah sudah disahkan.`,
    copy: 'Salin', copied: 'Disalin',
    c_wishes: 'Ucapan terbaru', c_wishes_sub: n => n + ' semua', wishes_empty: 'Belum ada ucapan.',
    confirm_q: (name, what, dari) => `<b>${name}</b> baru balas (${what}${dari ? ', jemputan ' + dari : ''}). Adakah ini…`,
    not_attending: 'tidak hadir', not_them: 'Bukan, tetamu baru',
    search_ph: 'Cari nama, cth. Mak Long',
    f_all: 'Semua', f_yes2: 'Hadir', f_no2: 'Tidak hadir', f_extra: 'Tetamu tambahan',
    p_no: 'Tidak hadir', p_extra: 'tetamu tambahan',
    listed_as: n => `Dalam senarai sebagai “${n}” · `, manual_rec: ' · direkod manual', no_match: 'Tiada nama dijumpai.',
    wait_note: 'Hanya orang dalam senarai jemputan dikira. Tetamu tambahan (yang dapat kad dikongsi) tidak perlu dikejar.',
    list_title: s => 'Senarai ' + s, all_replied: 'semua sudah balas ✓', n_waiting: n => n + ' belum balas',
    list_note: s => `${s} terima satu mesej dengan semua nama ini untuk ditanya sendiri.`,
    send_list_to: s => 'Hantar senarai kepada ' + s,
    reminded: (n, ago) => `Diingatkan ${n}x · ${ago}`, not_reminded: 'Belum diingatkan', has_phone: ' · ada no. telefon',
    remind: 'Ingatkan', remind_aria: n => `Ingatkan ${n} di WhatsApp`, mark_replied: 'Dah balas',
    manual_title: n => `Rekod balasan ${n} (cth. jawab melalui panggilan atau mesej):`,
    save: 'Simpan', cancel: 'Batal', recorded: n => n + ' direkod',
    add_title: 'Tambah nama', add_sub: 'nombor telefon tidak wajib',
    add_note: 'Tampal senarai yang sedia ada, atau guna butang mikrofon pada papan kekunci telefon. Satu nama setiap baris.',
    add_ph: 'Mak Long Ani\nPak Cik Rahman\nFaizal ofis, 9123 4567',
    add_btn: 'Tambah', pick: 'Pilih dari kenalan',
    pick_note: 'Pada telefon Android, butang “Pilih dari kenalan” akan muncul di sini.',
    links_title: 'Pautan kad untuk setiap senarai',
    links_note: 'Beri setiap orang pautan mereka sendiri. Balasan dari pautan itu dipadankan dengan senarai mereka dahulu.',
    n_names: n => n + ' nama', all_names: 'Semua nama', replied: 'sudah balas', not_yet: 'belum',
    remove: 'Buang', remove_aria: n => 'Buang ' + n,
    msgs_note: 'Mesej sedia ditulis. Tekan “Buka WhatsApp”, pilih orang atau group, dan hantar dari nombor anda sendiri.',
    msg_card: 'Kirim kad', msg_card_sub: s => 'pautan Senarai ' + s,
    msg_tmr: 'Jumpa esok', msg_tmr_sub: 'hantar sehari sebelum majlis', msg_tmr_phones: n => n + ' tetamu hadir beri no. telefon',
    open_wa: 'Buka WhatsApp',
    t_paste_one: 'Tampal sekurang-kurangnya satu nama', t_added: (n, s) => `${n} nama ditambah ke Senarai ${s}`,
    t_contacts: n => n + ' kenalan ditambah', t_pick_cancel: 'Pemilihan kenalan dibatalkan',
    t_matched: 'Dipadankan', t_new_guest: 'Ditanda sebagai tetamu baru', t_removed: 'Dibuang',
    t_link_copied: 'Pautan disalin', t_reset: 'Demo diset semula', t_new_reply: n => 'Balasan baru: ' + n,
    ago_now: 'baru tadi', ago_m: n => n + ' min lalu', ago_h: n => n + ' jam lalu', ago_d: n => n + ' hari lalu',

    // WhatsApp messages
    wa_card: list => `Assalamualaikum w.b.t.\n\nDengan segala hormatnya kami menjemput anda sekeluarga ke majlis perkahwinan ${WEDDING.brideFull} & ${WEDDING.groomFull}.\n\n📅 ${L(WEDDING.dateText)}\n🕚 ${L(WEDDING.timeText)}\n📍 ${WEDDING.venue}\n\nKad & RSVP: ${cardUrl(list)}\n\nMohon sahkan kehadiran sebelum ${L(WEDDING.rsvpBy)}. Terima kasih.`,
    wa_list: (list, names) => `Assalamualaikum ${listShort(list)}. Ini nama dalam senarai ${listShort(list)} yang belum balas RSVP majlis ${WEDDING.bride} & ${WEDDING.groom}:\n\n${names.map((n, k) => (k + 1) + '. ' + n).join('\n')}\n\nBoleh tolong tanya atau hantar semula pautan ini kepada mereka?\n${cardUrl(list)}\n\nTerima kasih 🙏`,
    wa_personal: (name, list) => `Assalamualaikum ${name}. Sekadar mengingatkan tentang majlis perkahwinan ${WEDDING.bride} & ${WEDDING.groom} pada ${L(WEDDING.dateText)}. Mohon sahkan kehadiran di sini, hanya 30 saat: ${cardUrl(list)}\n\nTerima kasih!`,
    wa_tomorrow: () => `Assalamualaikum! Jumpa esok di majlis ${WEDDING.bride} & ${WEDDING.groom} InsyaAllah 💐\n\n🕚 ${L(WEDDING.timeText)}\n📍 ${WEDDING.venue}\nPeta: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(WEDDING.mapQuery)}\n\n${L(WEDDING.venueNote)}`,
  },
  en: {
    cover_eyebrow: 'The wedding of', cover_to: 'To our honoured guests', open: 'Open invitation',
    demo_card: 'This is a sample card. <a href="dashboard.html">View couple dashboard →</a>',
    hosts_eyebrow: 'With gratitude to Allah',
    invite_text: 'request the pleasure of your company, together with your family, at the wedding reception of our daughter',
    with_partner: 'and',
    when_eyebrow: 'Date &amp; venue', save_date: 'Save the date', countdown: 'Countdown',
    cd_d: 'days', cd_h: 'hours', cd_m: 'mins', cd_s: 'secs',
    sched_eyebrow: 'Programme',
    rsvp_eyebrow: 'Kindly respond',
    rsvp_intro: () => `Please let us know by <b>${L(WEDDING.rsvpBy)}</b> so we can prepare enough food for everyone.`,
    f_name: 'Your name', f_name_ph: 'The name the family knows you by',
    f_attend: 'Will you be attending?', f_yes: 'Yes, InsyaAllah', f_no: "Sorry, can't make it",
    f_pax: 'How many people, including you?', f_pax_max: n => 'max ' + n, f_minus: 'Fewer', f_plus: 'More',
    f_slot: 'Roughly when will you arrive?',
    f_dari: 'Invited by', f_choose: 'Choose…', f_other: 'Other / family friend',
    f_phone: 'Phone number <small>(optional, for a reminder the day before)</small>',
    f_wish: 'Wishes &amp; doa <small>(optional)</small>', f_wish_ph: 'Congratulations…',
    f_send: 'Send', f_update: 'Update reply',
    f_privacy: "Your details are only shared with the couple's family and deleted after the wedding.",
    e_name: 'Enter your name.', e_attend: 'Choose one.', e_slot: 'Choose an arrival time.',
    thanks: 'Thank you',
    thanks_yes: (pax, slot) => `Got it: ${pax} ${pax === 1 ? 'person' : 'people'}, ${slot}. See you there, InsyaAllah.`,
    thanks_no: 'Got it. Thank you for your doa.',
    edit_reply: 'Change reply',
    wishes_eyebrow: 'Wishes from guests', wishes_none: 'Be the first to leave a wish.',
    footer: 'Digital card · demo &nbsp;·&nbsp; <a href="dashboard.html">Couple dashboard</a>',
    demo_short: 'Sample card', demo_theme: 'Theme', demo_dash_link: 'Dashboard →',
    th_songket: 'Songket', th_bunga: 'Floral', th_moden: 'Modern',
    tap_open: 'Tap to open',
    cal_pick: 'Choose your calendar:', cal_google: 'Google Calendar', cal_apple: 'iPhone / Outlook',
    music_on: 'Play music', music_off: 'Stop music',

    demo_dash: 'Demo: data is stored in this browser only. <a href="index.html" target="_blank">Open guest card</a> · <button id="reset">Reset demo</button>',
    view_all: 'All lists', view_list: s => s + "'s list", view_as: 'View as',
    days_left: n => n + ' days to go',
    tab_home: 'Overview', tab_done: 'Replied', tab_wait: 'Not replied', tab_guests: 'Invite list', tab_msgs: 'Messages',
    digest_title: "Today's summary", digest_sub: 'sent to your email every morning',
    digest_new: (n, names) => `<b>${n} new ${n === 1 ? 'reply' : 'replies'}</b> in the last 24 hours: ${names}`,
    digest_none: 'No new replies in the last 24 hours.',
    digest_wait: (w, p) => `${w} invited ${w === 1 ? 'guest hasn’t' : 'guests haven’t'} replied${p ? ` · ${p} need${p === 1 ? 's' : ''} your confirmation` : ''}.`,
    m_yes: 'Attending', m_yes_sub: n => `pax · ${n} replies`, m_no: "Can't attend",
    m_wait: 'Not replied', m_wait_sub: n => 'of ' + n,
    m_extra: 'Extra guests', m_extra_sub: 'got a forwarded card',
    c_slots: 'Expected arrival time', pax: 'pax',
    c_side: 'By invite list', c_side_sub: 'pax attending', none_yet: 'None yet.',
    bk_title: 'Booked pax', bk_sub: 'all lists', bk_of: (c, b) => `<b>${c}</b> / ${b} pax confirmed`,
    bk_left: (n, w) => `${n} pax left · ${w} invited guests haven't replied`,
    bk_near: n => `Nearly full: only ${n} pax left.`,
    bk_over: n => `Over your booking by ${n} pax. Consider booking more.`,
    bk_edit: 'Edit', bk_label: 'Number of pax booked', bk_saved: 'Booked pax updated',
    bk_err: 'Enter a valid number.',
    pray_title: 'Prayer times on the day', masjid_btn: 'Nearest mosque / surau',
    day_live: 'Happening now', day_soon: () => 'Today · ' + L(WEDDING.timeText),
    day_ended: 'The reception has ended. Thank you for coming!',
    day_title: 'Getting there', day_arrive: 'When you arrive', day_busy: s => `Busiest expected ${s}.`, day_early: ' Come earlier to avoid the crowd.',
    day_updates: 'Updates from the family', day_full: 'See full card ↓', demo_day: 'Wedding day',
    dd_title: 'Wedding day', dd_sub: 'updates for guests',
    dd_note: 'These updates show at the top of the card on the wedding day, together with directions.',
    dd_presets: ['The couple has arrived 💐', 'The bersanding is happening now', 'Plenty of food, do come', 'Parking is nearly full, MRT recommended'],
    dd_custom_ph: 'Write your own update…', dd_post: 'Post', dd_posted: 'Update posted', dd_none: 'No updates yet.',
    dd_delete: 'Delete', dd_preview: 'Preview wedding-day card',
    digest_near: (c, b) => `Heads up: ${c} of ${b} booked pax are already confirmed.`,
    copy: 'Copy', copied: 'Copied',
    c_wishes: 'Latest wishes', c_wishes_sub: n => n + ' total', wishes_empty: 'No wishes yet.',
    confirm_q: (name, what, dari) => `<b>${name}</b> just replied (${what}${dari ? ', invited by ' + dari : ''}). Is this…`,
    not_attending: 'not attending', not_them: 'No, new guest',
    search_ph: 'Search a name, e.g. Mak Long',
    f_all: 'All', f_yes2: 'Attending', f_no2: 'Not attending', f_extra: 'Extra guests',
    p_no: 'Not attending', p_extra: 'extra guest',
    listed_as: n => `On your list as “${n}” · `, manual_rec: ' · recorded by hand', no_match: 'No names found.',
    wait_note: 'Only people on your invite list are counted. Extra guests (who got a forwarded card) don’t need chasing.',
    list_title: s => s + "'s list", all_replied: 'everyone has replied ✓', n_waiting: n => n + ' not replied',
    list_note: s => `${s} gets one message with all these names to follow up personally.`,
    send_list_to: s => 'Send list to ' + s,
    reminded: (n, ago) => `Reminded ${n}x · ${ago}`, not_reminded: 'Not reminded yet', has_phone: ' · has phone no.',
    remind: 'Remind', remind_aria: n => `Remind ${n} on WhatsApp`, mark_replied: 'Replied',
    manual_title: n => `Record ${n}'s reply (e.g. answered by call or message):`,
    save: 'Save', cancel: 'Cancel', recorded: n => n + ' recorded',
    add_title: 'Add names', add_sub: 'phone numbers optional',
    add_note: 'Paste a list you already have, or use the microphone on your phone keyboard. One name per line.',
    add_ph: 'Mak Long Ani\nPak Cik Rahman\nFaizal office, 9123 4567',
    add_btn: 'Add', pick: 'Pick from contacts',
    pick_note: 'On Android phones, a “Pick from contacts” button appears here.',
    links_title: 'Card link for each list',
    links_note: 'Give each person their own link. Replies from that link are matched to their list first.',
    n_names: n => n + ' names', all_names: 'All names', replied: 'replied', not_yet: 'not yet',
    remove: 'Remove', remove_aria: n => 'Remove ' + n,
    msgs_note: 'Ready-written messages. Tap “Open WhatsApp”, pick a person or group, and send from your own number.',
    msg_card: 'Send the card', msg_card_sub: s => s + "'s list link",
    msg_tmr: 'See you tomorrow', msg_tmr_sub: 'send the day before', msg_tmr_phones: n => n + ' attending guests gave a phone no.',
    open_wa: 'Open WhatsApp',
    t_paste_one: 'Paste at least one name', t_added: (n, s) => `${n} names added to ${s}'s list`,
    t_contacts: n => n + ' contacts added', t_pick_cancel: 'Contact picking cancelled',
    t_matched: 'Matched', t_new_guest: 'Marked as a new guest', t_removed: 'Removed',
    t_link_copied: 'Link copied', t_reset: 'Demo reset', t_new_reply: n => 'New reply: ' + n,
    ago_now: 'just now', ago_m: n => n + 'm ago', ago_h: n => n + 'h ago', ago_d: n => n + 'd ago',

    wa_card: list => `Assalamualaikum.\n\nWe warmly invite you and your family to the wedding reception of ${WEDDING.brideFull} & ${WEDDING.groomFull}.\n\n📅 ${L(WEDDING.dateText)}\n🕚 ${L(WEDDING.timeText)}\n📍 ${WEDDING.venue}\n\nCard & RSVP: ${cardUrl(list)}\n\nPlease reply by ${L(WEDDING.rsvpBy)}. Thank you!`,
    wa_list: (list, names) => `Assalamualaikum ${listShort(list)}. These people on your list haven't replied to ${WEDDING.bride} & ${WEDDING.groom}'s RSVP yet:\n\n${names.map((n, k) => (k + 1) + '. ' + n).join('\n')}\n\nCould you check with them or resend this link?\n${cardUrl(list)}\n\nThank you 🙏`,
    wa_personal: (name, list) => `Assalamualaikum ${name}. A gentle reminder about ${WEDDING.bride} & ${WEDDING.groom}'s wedding on ${L(WEDDING.dateText)}. Please let us know if you can come, it takes 30 seconds: ${cardUrl(list)}\n\nThank you!`,
    wa_tomorrow: () => `Assalamualaikum! See you tomorrow at ${WEDDING.bride} & ${WEDDING.groom}'s wedding, InsyaAllah 💐\n\n🕚 ${L(WEDDING.timeText)}\n📍 ${WEDDING.venue}\nMap: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(WEDDING.mapQuery)}\n\n${L(WEDDING.venueNote)}`,
  },
};

const STORE_KEY = 'ekadDemo_v1';

// ---------- storage ----------
function loadDB() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const db = JSON.parse(raw);
      db.settings = db.settings || { bookedPax: 100 };
      db.updates = db.updates || [];
      return db;
    }
  } catch (e) {}
  const db = seedDB();
  saveDB(db);
  return db;
}
function saveDB(db) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) {}
}
function resetDB() {
  try { localStorage.removeItem(STORE_KEY); localStorage.removeItem('ekadDemo_myReply'); } catch (e) {}
  return loadDB();
}
const uid = () => Math.random().toString(36).slice(2, 9);

// ---------- phone ----------
function normPhone(p) {
  let d = String(p || '').replace(/\D/g, '');
  if (d.length === 8 && /^[689]/.test(d)) d = '65' + d;
  return d.length >= 8 ? d : '';
}
const waLink = (text, phone) =>
  'https://wa.me/' + (phone ? normPhone(phone) : '') + '?text=' + encodeURIComponent(text);

// ---------- name matching ----------
// Words that are titles, kinship terms or notes — not part of who the person is.
const STOP = new Set(('bin binti binte bte bt b al el haji hj hajah hjh mak pak cik encik en puan pn tuan tn ' +
  'kak kakak abang bang adik dik long ngah uda lang su chik andak tok nenek atuk opah makcik pakcik ' +
  'along angah achik acik dr ustaz ustazah ust cikgu mr mrs ms mdm madam sis bro uncle auntie aunty ' +
  'family keluarga dan and sekeluarga suami isteri anak').split(' '));

function coreTokens(name) {
  const cleaned = String(name || '').toLowerCase()
    .replace(/\(.*?\)/g, ' ')          // "(ofis)" style notes
    .replace(/[^a-z\s]/g, ' ');
  const all = cleaned.split(/\s+/).filter(Boolean);
  const core = all.filter(w => !STOP.has(w) && w.length > 1);
  return core.length ? core : all;
}

function scorePair(reply, inv) {
  const pr = normPhone(reply.phone), pi = normPhone(inv.phone);
  if (pr && pi && pr === pi) return 100;
  const R = coreTokens(reply.name), I = coreTokens(inv.name);
  if (!R.length || !I.length) return 0;
  let s = 0;
  const same = (a, b) => a.length === b.length && a.every(w => b.includes(w));
  if (same(R, I)) s = 90;
  else if (I.every(w => R.includes(w)) || R.every(w => I.includes(w))) s = 80;
  else {
    const partial = I.some(i => R.some(r =>
      (i.length >= 3 && r.length >= 3) && (r === i || r.includes(i) || i.includes(r))));
    // a loose match only counts within the same list, to avoid noisy questions
    if (partial && !(reply.dari && inv.list && reply.dari !== inv.list)) s = 50;
  }
  if (s && reply.dari && reply.dari === inv.list) s += 8;
  return s;
}

// Decide what to do with a new reply: auto-link, ask the couple, or treat as an extra guest.
function matchReply(db, reply) {
  const open = db.invited.filter(i => !i.replyId);
  const scored = open.map(i => ({ id: i.id, s: scorePair(reply, i) }))
    .filter(x => x.s >= 50).sort((a, b) => b.s - a.s);
  if (scored.length && scored[0].s >= 80 && !(scored[1] && scored[1].s >= 80)) {
    return { status: 'matched', invitedId: scored[0].id };
  }
  if (scored.length) return { status: 'pending', candidates: scored.slice(0, 3).map(x => x.id) };
  return { status: 'extra' };
}

function linkReply(db, replyId, invitedId) {
  const r = db.replies.find(x => x.id === replyId);
  const i = db.invited.find(x => x.id === invitedId);
  if (!r || !i) return;
  r.status = 'matched'; r.invitedId = i.id; delete r.candidates;
  i.replyId = r.id;
  if (!i.phone && r.phone) i.phone = r.phone;
}

// Add or update a reply coming from the invitation form.
function submitReply(db, data, existingId) {
  let r = existingId && db.replies.find(x => x.id === existingId);
  if (!r && normPhone(data.phone)) r = db.replies.find(x => normPhone(x.phone) === normPhone(data.phone));
  if (r) {
    Object.assign(r, data, { updatedAt: Date.now() });
    return r;
  }
  r = Object.assign({ id: uid(), at: Date.now() }, data);
  const m = matchReply(db, r);
  r.status = m.status;
  if (m.status === 'matched') { db.replies.push(r); linkReply(db, r.id, m.invitedId); return r; }
  if (m.status === 'pending') r.candidates = m.candidates;
  db.replies.push(r);
  return r;
}

// ---------- totals ----------
function totals(db, listFilter) {
  const inList = r => {
    if (!listFilter) return true;
    const inv = r.invitedId && db.invited.find(i => i.id === r.invitedId);
    return (inv ? inv.list : r.dari) === listFilter;
  };
  const reps = db.replies.filter(inList);
  const yes = reps.filter(r => r.attend);
  const invited = db.invited.filter(i => !listFilter || i.list === listFilter);
  const slots = {};
  WEDDING.slots.forEach(s => slots[s.key] = 0);
  yes.forEach(r => slots[r.slot] = (slots[r.slot] || 0) + (+r.pax || 0));
  const bySide = {};
  yes.forEach(r => {
    const inv = r.invitedId && db.invited.find(i => i.id === r.invitedId);
    const k = inv ? inv.list : (r.dari || 'lain');
    bySide[k] = (bySide[k] || 0) + (+r.pax || 0);
  });
  return {
    pax: yes.reduce((a, r) => a + (+r.pax || 0), 0),
    yes: yes.length,
    no: reps.filter(r => !r.attend).length,
    waiting: invited.filter(i => !i.replyId).length,
    invited: invited.length,
    pending: db.replies.filter(r => r.status === 'pending').length,
    extra: reps.filter(r => r.status === 'extra').length,
    slots, bySide,
  };
}

// ---------- helpers ----------
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function timeAgo(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return t('ago_now');
  if (m < 60) return t('ago_m', m);
  const h = Math.round(m / 60);
  if (h < 24) return t('ago_h', h);
  return t('ago_d', Math.round(h / 24));
}
function daysToGo() {
  return Math.max(0, Math.ceil((new Date(WEDDING.date) - Date.now()) / 86400000));
}
function cardUrl(dari) {
  const base = location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '') + 'index.html';
  return dari ? base + '?dari=' + dari : base;
}

// ---------- demo seed data ----------
function seedDB() {
  const H = 3600000, D = 86400000, now = Date.now();
  const invited = [
    // [name, list, phone]
    ['Mak Long Ani', 'mak', ''], ['Pak Ngah Kassim', 'mak', ''], ['Mak Su Rosnah', 'mak', '00004501'],
    ['Kak Yah (jiran)', 'mak', ''], ['Cik Salmah', 'mak', ''], ['Mak Andak Faridah', 'mak', ''],
    ['Haji Osman sekeluarga', 'mak', ''], ['Puan Norlela', 'mak', ''], ['Kak Ton', 'mak', ''],
    ['Pak Cik Rahman', 'ayah', ''], ['Encik Jamal (surau)', 'ayah', ''], ['Ustaz Hafiz', 'ayah', '00005602'],
    ['Pak Long Daud', 'ayah', ''], ['Encik Rosli', 'ayah', ''], ['Abang Zul', 'ayah', ''],
    ['Haji Salleh', 'ayah', ''], ['Encik Kamal (kerja)', 'ayah', ''],
    ['Nadia Hassan', 'aisyah', '00006703'], ['Farah', 'aisyah', ''], ['Siti Khadijah', 'aisyah', '00007804'],
    ['Liyana', 'aisyah', ''], ['Amirah Yusof', 'aisyah', ''], ['Hidayah', 'aisyah', ''],
    ['Sarah Lim (ofis)', 'aisyah', '00008905'], ['Nurul Huda', 'aisyah', ''],
    ['Faizal (ofis)', 'hakim', '00009006'], ['Irfan', 'hakim', ''], ['Danial Rahim', 'hakim', ''],
    ['Syafiq', 'hakim', '00000107'], ['Haziq', 'hakim', ''], ['Ridhwan', 'hakim', ''],
    ['Aiman Zakaria', 'hakim', ''], ['Kumar (ofis)', 'hakim', ''],
  ].map(([name, list, phone], n) => ({
    id: 'i' + n, name, list, phone, replyId: null, reminded: 0, lastReminded: null,
    addedAt: now - 12 * D,
  }));

  // bookedPax: what the couple booked with the caterer before inviting (small number to suit the demo data)
  // updates: wedding-day notes from the family; a preset is stored by number so each guest reads it in their own language
  const db = { invited, replies: [], settings: { bookedPax: 100 }, updates: [{ id: 'u0', preset: 0, at: now - 20 * 60000 }] };
  const R = (name, list, pax, slot, ago, extra = {}) =>
    Object.assign({ id: uid(), name, phone: '', attend: true, pax, slot, dari: list, wish: '', at: now - ago }, extra);

  const matched = [
    ['i0', R('Rohani binte Ahmad', 'mak', 5, 's1', 9 * D)],
    ['i1', R('Kassim Hamid', 'mak', 4, 's1', 8 * D, { wish: 'Selamat pengantin baru Aisyah & Hakim. Semoga berkekalan hingga ke Jannah.' })],
    ['i3', R('Kak Yah', 'mak', 3, 's2', 7 * D)],
    ['i6', R('Haji Osman', 'mak', 6, 's1', 6 * D)],
    ['i7', R('Norlela', 'mak', 2, 's2', 5 * D, { attend: false, pax: 0, wish: 'Maaf tak dapat hadir, ada urusan di Johor. Tahniah!' })],
    ['i9', R('Rahman Yusoff', 'ayah', 4, 's1', 9 * D)],
    ['i11', R('Ustaz Hafiz', 'ayah', 5, 's1', 8 * D, { phone: '00005602', wish: 'Barakallahu lakuma wa baraka alaikuma wa jama\'a bainakuma fi khair.' })],
    ['i13', R('Rosli', 'ayah', 2, 's3', 4 * D)],
    ['i15', R('Hj Salleh', 'ayah', 3, 's2', 3 * D)],
    ['i17', R('Nadia Hassan', 'aisyah', 2, 's2', 9 * D, { phone: '00006703', wish: 'Bestie aku kahwin!! Love you Aisyah ♡' })],
    ['i18', R('Farah Aziz', 'aisyah', 1, 's2', 7 * D)],
    ['i19', R('Siti Khadijah', 'aisyah', 3, 's3', 6 * D, { phone: '00007804' })],
    ['i21', R('Amirah Yusof', 'aisyah', 2, 's2', 2 * D)],
    ['i23', R('Sarah Lim', 'aisyah', 1, 's3', 2 * D, { phone: '00008905', attend: false, pax: 0, wish: 'Congratulations Aisyah! So sorry I’ll be overseas. Wishing you both a lifetime of happiness.' })],
    ['i25', R('Faizal Rahman', 'hakim', 2, 's2', 5 * D, { phone: '00009006' })],
    ['i26', R('Irfan', 'hakim', 1, 's3', 4 * D, { wish: 'Congrats bro! Jaga dia baik-baik.' })],
    ['i28', R('Syafiq', 'hakim', 2, 's2', 3 * D, { phone: '00000107' })],
    ['i30', R('Ridhwan Ali', 'hakim', 3, 's2', 20 * H)],
  ];
  matched.forEach(([iid, r]) => { r.status = 'matched'; r.invitedId = iid; db.replies.push(r); db.invited.find(i => i.id === iid).replyId = r.id; });

  // Replies the system wasn't sure about — the couple confirms with one tap.
  const p1 = R('Salmah Ibrahim', 'mak', 2, 's1', 5 * H); p1.status = 'pending'; p1.candidates = ['i4'];
  const p2 = R('Dani', 'hakim', 2, 's3', 2 * H); p2.status = 'pending'; p2.candidates = ['i27'];
  db.replies.push(p1, p2);

  // Extra guests: got the card from someone else's forward, not on any invite list.
  [
    R('Zulaikha (anak Mak Long)', 'mak', 3, 's1', 8 * D),
    R('Hafizah Osman', 'mak', 4, 's2', 6 * D),
    R('Mohd Firdaus', 'ayah', 2, 's2', 4 * D),
    R('Aqilah', 'aisyah', 2, 's3', 3 * D, { wish: 'Tahniah kak Aisyah! Cantik sangat kad ni.' }),
    R('Wani & suami', 'aisyah', 2, 's2', 30 * H),
    R('Hairul', 'hakim', 1, 's2', 10 * H),
  ].forEach(r => { r.status = 'extra'; db.replies.push(r); });

  db.invited.forEach(i => { if (!i.replyId && Math.random() < 0.4) { i.reminded = 1; i.lastReminded = now - 3 * D; } });
  return db;
}
