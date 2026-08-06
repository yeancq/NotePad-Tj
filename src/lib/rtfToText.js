// Puerto a JavaScript del algoritmo de la librería striprtf (Python, de Joshy Cyriac,
// https://github.com/joshy/striprtf), simplificado para correr en el navegador sin
// dependencias. Probado contra un programa de asamblea real antes de usarse aquí.

const DESTINATIONS = new Set([
  'aftncn', 'aftnsep', 'aftnsepc', 'annotation', 'atnauthor', 'atndate', 'atnicn', 'atnid',
  'atnparent', 'atnref', 'atntime', 'atrfend', 'atrfstart', 'author', 'background',
  'bkmkend', 'bkmkstart', 'blipuid', 'buptim', 'category', 'colorschememapping',
  'colortbl', 'comment', 'company', 'creatim', 'datafield', 'datastore', 'defchp', 'defpap',
  'do', 'doccomm', 'docvar', 'dptxbxtext', 'ebcend', 'ebcstart', 'factoidname', 'falt',
  'fchars', 'ffdeftext', 'ffentrymcr', 'ffexitmcr', 'ffformat', 'ffhelptext', 'ffl',
  'ffname', 'ffstattext', 'file', 'filetbl', 'fldinst', 'fldtype', 'fonttbl',
  'fname', 'fontemb', 'fontfile', 'footer', 'footerf', 'footerl', 'footerr',
  'footnote', 'formfield', 'ftncn', 'ftnsep', 'ftnsepc', 'g', 'generator', 'gridtbl',
  'header', 'headerf', 'headerl', 'headerr', 'hl', 'hlfr', 'hlinkbase', 'hlloc', 'hlsrc',
  'hsv', 'htmltag', 'info', 'keycode', 'keywords', 'latentstyles', 'lchars', 'levelnumbers',
  'leveltext', 'lfolevel', 'linkval', 'list', 'listlevel', 'listname', 'listoverride',
  'listoverridetable', 'listpicture', 'liststylename', 'listtable',
  'lsdlockedexcept', 'macc', 'maccPr', 'mailmerge', 'maln', 'malnScr', 'manager', 'margPr',
  'mbar', 'mbarPr', 'mbaseJc', 'mbegChr', 'mborderBox', 'mborderBoxPr', 'mbox', 'mboxPr',
  'mchr', 'mcount', 'mctrlPr', 'md', 'mdeg', 'mdegHide', 'mden', 'mdiff', 'mdPr', 'me',
  'mendChr', 'meqArr', 'meqArrPr', 'mf', 'mfName', 'mfPr', 'mfunc', 'mfuncPr', 'mgroupChr',
  'mgroupChrPr', 'mgrow', 'mhideBot', 'mhideLeft', 'mhideRight', 'mhideTop', 'mhtmltag',
  'mlim', 'mlimloc', 'mlimlow', 'mlimlowPr', 'mlimupp', 'mlimuppPr', 'mm', 'mmaddfieldname',
  'mmath', 'mmathPict', 'mmathPr', 'mmaxdist', 'mmc', 'mmcJc', 'mmconnectstr',
  'mmconnectstrdata', 'mmcPr', 'mmcs', 'mmdatasource', 'mmheadersource', 'mmmailsubject',
  'mmodso', 'mmodsofilter', 'mmodsofldmpdata', 'mmodsomappedname', 'mmodsoname',
  'mmodsorecipdata', 'mmodsosort', 'mmodsosrc', 'mmodsotable', 'mmodsoudl',
  'mmodsoudldata', 'mmodsouniquetag', 'mmPr', 'mmquery', 'mmr', 'mnary', 'mnaryPr',
  'mnoBreak', 'mnum', 'mobjDist', 'moMath', 'moMathPara', 'moMathParaPr', 'mopEmu',
  'mphant', 'mphantPr', 'mplcHide', 'mpos', 'mr', 'mrad', 'mradPr', 'mrPr', 'msepChr',
  'mshow', 'mshp', 'msPre', 'msPrePr', 'msSub', 'msSubPr', 'msSubSup', 'msSubSupPr', 'msSup',
  'msSupPr', 'mstrikeBLTR', 'mstrikeH', 'mstrikeTLBR', 'mstrikeV', 'msub', 'msubHide',
  'msup', 'msupHide', 'mtransp', 'mtype', 'mvertJc', 'mvfmf', 'mvfml', 'mvtof', 'mvtol',
  'mzeroAsc', 'mzeroDesc', 'mzeroWid', 'nesttableprops', 'nextfile', 'nonesttables',
  'objalias', 'objclass', 'objdata', 'object', 'objname', 'objsect', 'objtime', 'oldcprops',
  'oldpprops', 'oldsprops', 'oldtprops', 'oleclsid', 'operator', 'panose', 'password',
  'passwordhash', 'pgp', 'pgptbl', 'picprop', 'pict', 'pn', 'pnseclvl', 'pntext', 'pntxta',
  'pntxtb', 'printim', 'private', 'propname', 'protend', 'protstart', 'protusertbl', 'pxe',
  'result', 'revtbl', 'revtim', 'rsidtbl', 'rxe', 'shp', 'shpgrp', 'shpinst',
  'shppict', 'shprslt', 'shptxt', 'sn', 'sp', 'staticval', 'stylesheet', 'subject', 'sv',
  'svb', 'tc', 'template', 'themedata', 'title', 'txe', 'ud', 'upr', 'userprops',
  'wgrffmtfilter', 'windowcaption', 'writereservation', 'writereservhash', 'xe', 'xform',
  'xmlattrname', 'xmlattrvalue', 'xmlclose', 'xmlname', 'xmlnstbl', 'xmlopen',
])

const SECTION_CHARS = { par: '\n', sect: '\n\n', page: '\n\n' }
const SPECIAL_CHARS = {
  line: '\n', tab: '\t', emdash: '\u2014', endash: '\u2013',
  emspace: '\u2003', enspace: '\u2002', qmspace: '\u2005', bullet: '\u2022',
  lquote: '\u2018', rquote: '\u2019', ldblquote: '\u201C', rdblquote: '\u201D',
  row: '\n', cell: '|', nestcell: '|', '~': '\xa0',
  '\n': '\n', '\r': '\r', '{': '{', '}': '}', '\\': '\\', '-': '\xad', _: '\u2011',
  ...SECTION_CHARS,
}

// \palabra(-?digitos)?[espacio] | \'xx | \x (no letra) | { o } | salto de línea | cualquier char
const PATTERN = /\\([a-zA-Z]{1,32})(-?\d{1,10})? ?|\\'([0-9a-fA-F]{2})|\\([^a-zA-Z])|([{}])|[\r\n]+|([\s\S])/g

function decodeHexBytes(hexPairs, encodingLabel) {
  const bytes = new Uint8Array(hexPairs.length)
  for (let i = 0; i < hexPairs.length; i++) bytes[i] = parseInt(hexPairs[i], 16)
  try {
    return new TextDecoder(encodingLabel).decode(bytes)
  } catch {
    return new TextDecoder('windows-1252').decode(bytes)
  }
}

/**
 * Convierte un string RTF a texto plano.
 */
export function rtfToText(text) {
  let encoding = 'windows-1252'
  const stack = []
  let ignorable = false
  let suppressOutput = false
  let ucskip = 1
  let curskip = 0
  let hexes = []
  let out = ''

  PATTERN.lastIndex = 0
  let match
  while ((match = PATTERN.exec(text)) !== null) {
    const [, word, arg, hex, char, brace, tchar] = match

    if (hexes.length && !hex) {
      out += decodeHexBytes(hexes, encoding)
      hexes = []
    }

    if (brace) {
      curskip = 0
      if (brace === '{') {
        stack.push([ucskip, ignorable, suppressOutput])
      } else if (brace === '}') {
        if (stack.length) {
          ;[ucskip, ignorable, suppressOutput] = stack.pop()
        } else {
          ucskip = 0
          ignorable = true
        }
      }
    } else if (char) {
      curskip = 0
      if (char in SPECIAL_CHARS) {
        if (char in SECTION_CHARS) {
          // (equivalente a resetear la fuente actual; no lo necesitamos aquí)
        }
        if (!ignorable) out += SPECIAL_CHARS[char]
      } else if (char === '*') {
        ignorable = true
      }
    } else if (word) {
      curskip = 0
      const w = word.toLowerCase()
      if (DESTINATIONS.has(w)) {
        ignorable = true
      } else if (w === 'ansicpg') {
        const cp = arg
        const map = { 1250: 'windows-1250', 1251: 'windows-1251', 1252: 'windows-1252', 1253: 'windows-1253', 1254: 'windows-1254', 1255: 'windows-1255', 1256: 'windows-1256', 1257: 'windows-1257', 1258: 'windows-1258' }
        encoding = map[cp] || 'windows-1252'
      }

      if (ignorable || suppressOutput) {
        // nada
      } else if (w in SPECIAL_CHARS) {
        out += SPECIAL_CHARS[w]
      } else if (w === 'uc') {
        ucskip = parseInt(arg, 10)
      } else if (w === 'u') {
        if (arg === undefined) {
          curskip = ucskip
        } else {
          let c = parseInt(arg, 10)
          if (c < 0) c += 0x10000
          out += String.fromCodePoint(c)
          curskip = ucskip
        }
      } else if (w === 'fonttbl' || w === 'colortbl') {
        suppressOutput = true
      }
    } else if (hex) {
      if (curskip > 0) {
        curskip -= 1
      } else if (!ignorable) {
        hexes.push(hex)
      }
    } else if (tchar) {
      if (curskip > 0) {
        curskip -= 1
      } else if (!ignorable && !suppressOutput) {
        out += tchar
      }
    }
  }

  if (hexes.length) out += decodeHexBytes(hexes, encoding)

  return out
}
