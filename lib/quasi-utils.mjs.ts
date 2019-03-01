import './peg.mjs';

function qunpack(h: string, ms: Array<[string, Array<[string, any]>]>, t: string) {
  const result: Array<string | PegHole> = [h];
  if (ms.length === 1) {
    const [[m, pairs]] = ms;
    result.push(m);
    for (const [q, e] of pairs) {
      result.push(q, e);
    }
  }
  result.push(t);
  return result;
}

function qrepack(parts: any[]) {
  // TODO bug: We only provide the raw form at this time. I
  // apologize once again for allowing a cooked form into the
  // standard.
  const raw = [parts[0]];
  const argExprs = [];
  const len = parts.length;
  for (let i = 1; i < len; i += 2) {
    argExprs.push(parts[i]);
    raw.push(parts[i + 1]);
  }
  const template = harden({raw});
  return [['data', template], ...argExprs];
}

export default harden({qunpack, qrepack});
