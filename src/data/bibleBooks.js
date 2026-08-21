// Orden estándar 1-66, igual al usado en el EPUB de la TNM y en bolls.life.
//
// IMPORTANTE:
// - No cambiar los IDs.
// - No cambiar el número de capítulos.
// - Las abreviaturas son usadas por verseDetector.js.
// - Se incluyen variantes habituales en español, con y sin acentos,
//   nombres completos y abreviaturas frecuentes.
// - verseDetector.js normaliza mayúsculas/minúsculas y acentos.
//
// docIdBase: el docId real de cada libro dentro del EPUB de jw.org
// es 1001061104 + id.

export const bibleBooks = [
  {
    id: 1,
    name: 'Génesis',
    chapters: 50,
    abbrevs: [
      'gen',
      'gn',
      'ge',
      'genesis',
      'génesis',
    ],
  },

  {
    id: 2,
    name: 'Éxodo',
    chapters: 40,
    abbrevs: [
      'exo',
      'ex',
      'exod',
      'exodo',
      'éxodo',
    ],
  },

  {
    id: 3,
    name: 'Levítico',
    chapters: 27,
    abbrevs: [
      'lev',
      'lv',
      'le',
      'levit',
      'levitico',
      'levítico',
    ],
  },

  {
    id: 4,
    name: 'Números',
    chapters: 36,
    abbrevs: [
      'num',
      'núm',
      'nm',
      'nu',
      'números',
      'numeros',
    ],
  },

  {
    id: 5,
    name: 'Deuteronomio',
    chapters: 34,
    abbrevs: [
      'deut',
      'deu',
      'dt',
      'deuter',
      'deuteronomio',
    ],
  },

  {
    id: 6,
    name: 'Josué',
    chapters: 24,
    abbrevs: [
      'jos',
      'js',
      'josue',
      'josué',
    ],
  },

  {
    id: 7,
    name: 'Jueces',
    chapters: 21,
    abbrevs: [
      'jue',
      'juec',
      'jueces',
      'jue.',
    ],
  },

  {
    id: 8,
    name: 'Rut',
    chapters: 4,
    abbrevs: [
      'rut',
      'rt',
    ],
  },

  {
    id: 9,
    name: '1 Samuel',
    chapters: 31,
    abbrevs: [
      '1 sam',
      '1sam',
      '1 sam.',
      '1 samuel',
      '1samuel',
      '1 sam.',
      '1sa',
      '1 saml',
      'i samuel',
      'i sam',
      'primera samuel',
      'primera de samuel',
    ],
  },

  {
    id: 10,
    name: '2 Samuel',
    chapters: 24,
    abbrevs: [
      '2 sam',
      '2sam',
      '2 sam.',
      '2 samuel',
      '2samuel',
      '2sa',
      '2 saml',
      'ii samuel',
      'ii sam',
      'segunda samuel',
      'segunda de samuel',
    ],
  },

  {
    id: 11,
    name: '1 Reyes',
    chapters: 22,
    abbrevs: [
      '1 rey',
      '1rey',
      '1 reyes',
      '1reyes',
      '1 re',
      '1re',
      'i reyes',
      'i rey',
      'primera reyes',
      'primera de reyes',
    ],
  },

  {
    id: 12,
    name: '2 Reyes',
    chapters: 25,
    abbrevs: [
      '2 rey',
      '2rey',
      '2 reyes',
      '2reyes',
      '2 re',
      '2re',
      'ii reyes',
      'ii rey',
      'segunda reyes',
      'segunda de reyes',
    ],
  },

  {
    id: 13,
    name: '1 Crónicas',
    chapters: 29,
    abbrevs: [
      '1 cron',
      '1cron',
      '1 crón',
      '1 cronicas',
      '1 crónicas',
      '1 cron.',
      '1 cr',
      '1cr',
      '1 cro',
      '1cro',
      'i cronicas',
      'i crónicas',
      'primera cronicas',
      'primera crónicas',
      'primera de cronicas',
      'primera de crónicas',
    ],
  },

  {
    id: 14,
    name: '2 Crónicas',
    chapters: 36,
    abbrevs: [
      '2 cron',
      '2cron',
      '2 crón',
      '2 cronicas',
      '2 crónicas',
      '2 cron.',
      '2 cr',
      '2cr',
      '2 cro',
      '2cro',
      'ii cronicas',
      'ii crónicas',
      'segunda cronicas',
      'segunda crónicas',
      'segunda de cronicas',
      'segunda de crónicas',
    ],
  },

  {
    id: 15,
    name: 'Esdras',
    chapters: 10,
    abbrevs: [
      'esd',
      'esdr',
      'esdras',
      'esd.',
    ],
  },

  {
    id: 16,
    name: 'Nehemías',
    chapters: 13,
    abbrevs: [
      'neh',
      'ne',
      'nehemias',
      'nehemías',
    ],
  },

  {
    id: 17,
    name: 'Ester',
    chapters: 10,
    abbrevs: [
      'est',
      'est.',
      'ester',
    ],
  },

  {
    id: 18,
    name: 'Job',
    chapters: 42,
    abbrevs: [
      'job',
    ],
  },

  {
    id: 19,
    name: 'Salmos',
    chapters: 150,
    abbrevs: [
      'sal',
      'sal.',
      'salmo',
      'salmos',
      'sl',
      'salms',
    ],
  },

  {
    id: 20,
    name: 'Proverbios',
    chapters: 31,
    abbrevs: [
      'prov',
      'pr',
      'pro',
      'proverb',
      'proverbios',
    ],
  },

  {
    id: 21,
    name: 'Eclesiastés',
    chapters: 12,
    abbrevs: [
      'ecl',
      'ec',
      'ecles',
      'eclesiastes',
      'eclesiastés',
    ],
  },

  {
    id: 22,
    name: 'Cantares',
    chapters: 8,
    abbrevs: [
      'cant',
      'cnt',
      'cantares',
      'cantar',
      'cantar de los cantares',
      'cántico',
      'cantico',
      'cánticos',
      'canticos',
    ],
  },

  {
    id: 23,
    name: 'Isaías',
    chapters: 66,
    abbrevs: [
      'is',
      'isa',
      'isai',
      'isaias',
      'isaías',
      'isaías',
    ],
  },

  {
    id: 24,
    name: 'Jeremías',
    chapters: 52,
    abbrevs: [
      'jer',
      'jr',
      'jerem',
      'jeremias',
      'jeremías',
    ],
  },

  {
    id: 25,
    name: 'Lamentaciones',
    chapters: 5,
    abbrevs: [
      'lam',
      'lm',
      'lament',
      'lamentaciones',
    ],
  },

  {
    id: 26,
    name: 'Ezequiel',
    chapters: 48,
    abbrevs: [
      'ezeq',
      'ez',
      'ezq',
      'eze',
      'ezequiel',
    ],
  },

  {
    id: 27,
    name: 'Daniel',
    chapters: 12,
    abbrevs: [
      'dan',
      'dn',
      'daniel',
    ],
  },

  {
    id: 28,
    name: 'Oseas',
    chapters: 14,
    abbrevs: [
      'os',
      'ose',
      'oseas',
    ],
  },

  {
    id: 29,
    name: 'Joel',
    chapters: 3,
    abbrevs: [
      'joel',
      'jl',
      'joe',
    ],
  },

  {
    id: 30,
    name: 'Amós',
    chapters: 9,
    abbrevs: [
      'am',
      'amos',
      'amós',
    ],
  },

  {
    id: 31,
    name: 'Abdías',
    chapters: 1,
    abbrevs: [
      'abd',
      'abdias',
      'abdías',
      'ab',
    ],
  },

  {
    id: 32,
    name: 'Jonás',
    chapters: 4,
    abbrevs: [
      'jon',
      'jn',
      'jonas',
      'jonás',
    ],
  },

  {
    id: 33,
    name: 'Miqueas',
    chapters: 7,
    abbrevs: [
      'miq',
      'mi',
      'mic',
      'miqueas',
    ],
  },

  {
    id: 34,
    name: 'Nahúm',
    chapters: 3,
    abbrevs: [
      'nah',
      'na',
      'nahum',
      'nahúm',
    ],
  },

  {
    id: 35,
    name: 'Habacuc',
    chapters: 3,
    abbrevs: [
      'hab',
      'ha',
      'habacuc',
    ],
  },

  {
    id: 36,
    name: 'Sofonías',
    chapters: 3,
    abbrevs: [
      'sof',
      'so',
      'sofonias',
      'sofonías',
    ],
  },

  {
    id: 37,
    name: 'Hageo',
    chapters: 2,
    abbrevs: [
      'hag',
      'hg',
      'hageo',
    ],
  },

  {
    id: 38,
    name: 'Zacarías',
    chapters: 14,
    abbrevs: [
      'zac',
      'za',
      'zacar',
      'zacarias',
      'zacarías',
    ],
  },

  {
    id: 39,
    name: 'Malaquías',
    chapters: 4,
    abbrevs: [
      'mal',
      'ml',
      'malaquias',
      'malaquías',
    ],
  },

  // =========================
  // ESCRITURAS GRIEGAS
  // =========================

  {
    id: 40,
    name: 'Mateo',
    chapters: 28,
    abbrevs: [
      'mt',
      'mat',
      'mat.',
      'mate',
      'mateo',
    ],
  },

  {
    id: 41,
    name: 'Marcos',
    chapters: 16,
    abbrevs: [
      'mr',
      'mc',
      'mar',
      'marc',
      'marcos',
    ],
  },

  {
    id: 42,
    name: 'Lucas',
    chapters: 24,
    abbrevs: [
      'lu',
      'lc',
      'luc',
      'lucas',
    ],
  },

  {
    id: 43,
    name: 'Juan',
    chapters: 21,
    abbrevs: [
      'jn',
      'juan',
      'jua',
      'ju',
    ],
  },

  {
    id: 44,
    name: 'Hechos',
    chapters: 28,
    abbrevs: [
      'hech',
      'hch',
      'he',
      'hc',
      'hechos',
      'hech.',
    ],
  },

  {
    id: 45,
    name: 'Romanos',
    chapters: 16,
    abbrevs: [
      'rom',
      'ro',
      'rm',
      'romanos',
    ],
  },

  {
    id: 46,
    name: '1 Corintios',
    chapters: 16,
    abbrevs: [
      '1 cor',
      '1cor',
      '1 cor.',
      '1co',
      '1co.',
      '1 corint',
      '1 corintios',
      '1corintios',
      'i corintios',
      'i cor',
      'primera corintios',
      'primera de corintios',
    ],
  },

  {
    id: 47,
    name: '2 Corintios',
    chapters: 13,
    abbrevs: [
      '2 cor',
      '2cor',
      '2 cor.',
      '2co',
      '2co.',
      '2 corint',
      '2 corintios',
      '2corintios',
      'ii corintios',
      'ii cor',
      'segunda corintios',
      'segunda de corintios',
    ],
  },

  {
    id: 48,
    name: 'Gálatas',
    chapters: 6,
    abbrevs: [
      'gal',
      'gál',
      'ga',
      'gálatas',
      'galatas',
    ],
  },

  {
    id: 49,
    name: 'Efesios',
    chapters: 6,
    abbrevs: [
      'ef',
      'efe',
      'efes',
      'efesios',
    ],
  },

  {
    id: 50,
    name: 'Filipenses',
    chapters: 4,
    abbrevs: [
      'fil',
      'flp',
      'fl',
      'filip',
      'filipenses',
    ],
  },

  {
    id: 51,
    name: 'Colosenses',
    chapters: 4,
    abbrevs: [
      'col',
      'co',
      'colo',
      'colosenses',
    ],
  },

  {
    id: 52,
    name: '1 Tesalonicenses',
    chapters: 5,
    abbrevs: [
      '1 tes',
      '1tes',
      '1 tes.',
      '1ts',
      '1ts.',
      '1 tesal',
      '1 tesalonicenses',
      '1tesalonicenses',
      'i tesalonicenses',
      'i tes',
      'primera tesalonicenses',
      'primera de tesalonicenses',
    ],
  },

  {
    id: 53,
    name: '2 Tesalonicenses',
    chapters: 3,
    abbrevs: [
      '2 tes',
      '2tes',
      '2 tes.',
      '2ts',
      '2ts.',
      '2 tesal',
      '2 tesalonicenses',
      '2tesalonicenses',
      'ii tesalonicenses',
      'ii tes',
      'segunda tesalonicenses',
      'segunda de tesalonicenses',
    ],
  },

  {
    id: 54,
    name: '1 Timoteo',
    chapters: 6,
    abbrevs: [
      '1 tim',
      '1tim',
      '1 tim.',
      '1ti',
      '1ti.',
      '1 timoteo',
      '1timoteo',
      'i timoteo',
      'i tim',
      'primera timoteo',
      'primera de timoteo',
    ],
  },

  {
    id: 55,
    name: '2 Timoteo',
    chapters: 4,
    abbrevs: [
      '2 tim',
      '2tim',
      '2 tim.',
      '2ti',
      '2ti.',
      '2 timoteo',
      '2timoteo',
      'ii timoteo',
      'ii tim',
      'segunda timoteo',
      'segunda de timoteo',
    ],
  },

  {
    id: 56,
    name: 'Tito',
    chapters: 3,
    abbrevs: [
      'tit',
      'ti',
      'tito',
    ],
  },

  {
    id: 57,
    name: 'Filemón',
    chapters: 1,
    abbrevs: [
      'film',
      'filem',
      'flm',
      'flm.',
      'filemon',
      'filemón',
      'file',
      'fm',
    ],
  },

  {
    id: 58,
    name: 'Hebreos',
    chapters: 13,
    abbrevs: [
      'heb',
      'he',
      'hebr',
      'hebreos',
    ],
  },

  {
    id: 59,
    name: 'Santiago',
    chapters: 5,
    abbrevs: [
      'sant',
      'stg',
      'snt',
      'santiago',
      'sant.',
    ],
  },

  {
    id: 60,
    name: '1 Pedro',
    chapters: 5,
    abbrevs: [
      '1 ped',
      '1ped',
      '1 ped.',
      '1 pe',
      '1pe',
      '1pe.',
      '1 p',
      '1p',
      '1 pedro',
      '1pedro',
      'i pedro',
      'i ped',
      'primera pedro',
      'primera de pedro',
    ],
  },

  {
    id: 61,
    name: '2 Pedro',
    chapters: 3,
    abbrevs: [
      '2 ped',
      '2ped',
      '2 ped.',
      '2 pe',
      '2pe',
      '2pe.',
      '2 p',
      '2p',
      '2 pedro',
      '2pedro',
      'ii pedro',
      'ii ped',
      'segunda pedro',
      'segunda de pedro',
    ],
  },

  {
    id: 62,
    name: '1 Juan',
    chapters: 5,
    abbrevs: [
      '1 jn',
      '1jn',
      '1 jn.',
      '1 juan',
      '1juan',
      '1 ju',
      '1ju',
      '1 j',
      '1j',
      'i juan',
      'i jn',
      'primera juan',
      'primera de juan',
    ],
  },

  {
    id: 63,
    name: '2 Juan',
    chapters: 1,
    abbrevs: [
      '2 jn',
      '2jn',
      '2 jn.',
      '2 juan',
      '2juan',
      '2 ju',
      '2ju',
      '2 j',
      '2j',
      'ii juan',
      'ii jn',
      'segunda juan',
      'segunda de juan',
    ],
  },

  {
    id: 64,
    name: '3 Juan',
    chapters: 1,
    abbrevs: [
      '3 jn',
      '3jn',
      '3 jn.',
      '3 juan',
      '3juan',
      '3 ju',
      '3ju',
      '3 j',
      '3j',
      'iii juan',
      'iii jn',
      'tercera juan',
      'tercera de juan',
    ],
  },

  {
    id: 65,
    name: 'Judas',
    chapters: 1,
    abbrevs: [
      'jud',
      'jd',
      'jds',
      'judas',
    ],
  },

  {
    id: 66,
    name: 'Apocalipsis',
    chapters: 22,
    abbrevs: [
      'ap',
      'ap.',
      'apoc',
      'apoc.',
      'apo',
      'apocalipsis',
      'revelacion',
      'revelación',
      'rev',
      're',
    ],
  },
]


// ============================================================
// FUNCIONES EXISTENTES
// ============================================================

export function epubDocId(bookId) {
  return 1001061104 + bookId
}

export function chapterFileName(bookId, chapter) {
  const docId = epubDocId(bookId)
  return chapter === 1
    ? `${docId}.xhtml`
    : `${docId}-split${chapter}.xhtml`
}
