// This file is hand-written, to allow boostrapping the
// quasi-peg.mjs grammar.

// It is validated in boot-env.mjs by comparing its output to
// that of the parser generated by boot-peg.mjs.

const def = (rule, expr) => ['def', rule, expr];
const or = (...arms) => ['or', ...arms];
const defaultAct = (...args) => ['defaultAct', ...args];
const act = (hole, ...sa) => ['act', hole, ...sa];
const lit = (str) => ['lit', str];
const pred = (hole) => ['pred', hole];
const cls = (range) => ['cls', range];
const peekNot = (pri) => ['peekNot', pri];
const many = (pri) => ['+', pri];
const zeroOrOne = (pri) => ['?', pri];
const zeroOrMany = (pri) => ['*', pri];
const begin = ['begin'];
const end = ['end'];
const dot = ['dot'];
const separated = (patt, sep) => ['**', patt, sep];

export default harden([
  def('Grammar',
    act(0, 'Spacing', many('Definition'), 'EndOfFile')),
  def('Definition',
    act(2, 'Identifier', 'LEFTARROW', 'Expression', 'SEMI', pred(1))),
  def('Expression',
    act(3, separated('Sequence', 'SLASH'))),
  def('Sequence',
    act(5, or(act(4, zeroOrMany('Prefix'))), zeroOrOne('HOLE'))),
  def('Prefix', or(
    act(6, 'AND', 'HOLE'),
    act(7, 'AND', 'Suffix'),
    act(8, 'NOT', 'Suffix'),
    defaultAct('Suffix'))),
  def('Suffix', or(
    act(9, 'Primary', or(defaultAct('STARSTAR'), defaultAct('PLUSPLUS')), 'Primary'),
    act(10, 'Primary',
      or('QUESTION', 'STAR', 'PLUS')),
    defaultAct('Primary'))),
  def('Primary', or(
    defaultAct('Super'),
    defaultAct('Identifier', peekNot('LEFTARROW')),
    act(11, 'OPEN', 'Expression', 'CLOSE'),
    act(12, 'Literal'),
    act(13, 'Class'),
    act(14, 'DOT'),
    act(15, 'BEGIN'),
    act(16, 'END'))),
  def('Identifier',
    defaultAct(begin, 'IdentStart', zeroOrMany('IdentCont'), end, 'Spacing')),
  def('IdentStart',
    cls('a-zA-Z_')),
  def('IdentCont', or(
    'IdentStart',
    cls('0-9'))),
  def('Literal', or(
    defaultAct(cls("'"), begin,
      zeroOrMany(defaultAct(peekNot(cls("'")), 'Char')),
      end, cls("'"), 'Spacing'),
    defaultAct(cls('"'), begin,
      zeroOrMany(defaultAct(peekNot(cls('"')), 'Char')),
      end, cls("'"), 'Spacing'))),
  def('Class',
    defaultAct(lit('['), begin,
      zeroOrMany(defaultAct(peekNot(lit(']')), 'Range')),
      end, lit(']'), 'Spacing')),
  def('Range', or(
    defaultAct('Char', lit('-'), 'Char'),
    'Char')),
  def('Char', or(
    defaultAct(lit('\\\\'), cls("abefnrtv'" + '"\\[\\]\\\\')),
    defaultAct(lit('\\\\'), cls('0-3'), cls('0-7'), cls('0-7')),
    defaultAct(lit('\\\\'), cls('0-7'), zeroOrOne(cls('0-7'))),
    defaultAct(lit('\\\\'), lit('-')),
    defaultAct(peekNot(lit('\\\\')), dot))),
  def('LEFTARROW', defaultAct(lit('<-'), 'Spacing')),
  def('SLASH', defaultAct(lit('/'), 'Spacing')),
  def('SEMI', defaultAct(lit(';'), 'Spacing')),
  def('AND', defaultAct(lit('&'), 'Spacing')),
  def('NOT', defaultAct(lit('~'), 'Spacing')),
  def('QUESTION', defaultAct(lit('?'), 'Spacing')),
  def('STAR', defaultAct(lit('*'), 'Spacing')),
  def('PLUS', defaultAct(lit('+'), 'Spacing')),
  def('OPEN', defaultAct(lit('('), 'Spacing')),
  def('CLOSE', defaultAct(lit(')'), 'Spacing')),
  def('DOT', defaultAct(lit('.'), 'Spacing')),
  def('Spacing',
    defaultAct(zeroOrMany(or('Space', 'Comment')), begin, end)),
  def('Space', or(
    lit(' '),
    lit('\\t'),
    'EndOfLine')),
  def('Comment',
    defaultAct(lit('#'),
      zeroOrMany(defaultAct(peekNot('EndOfLine'), dot)),
      'EndOfLine')),
  def('EndOfLine', or(
    lit('\\r\\n'),
    lit('\\n'),
    lit('\\r'))),
  def('EndOfFile',
    peekNot(dot)),
  def('HOLE',
    defaultAct(pred(17), 'Spacing')),
  def('Super',
    defaultAct(lit('super.'), begin, 'Identifier', end)),
  def('BEGIN',
    defaultAct(lit('<'), 'Spacing')),
  def('END',
    defaultAct(lit('>'), 'Spacing')),
  def('PLUSPLUS',
    defaultAct(lit('++'), 'Spacing')),
  def('STARSTAR',
    defaultAct(lit('**'), 'Spacing')),
]);