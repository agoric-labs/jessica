export const qunpack = (h: string, ms: any[], t: string) => {
  return [h, ...ms, t];
};

export const qrepack = (parts: any[]) => {
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
  const template: string[] & { raw?: string[] } = [...raw];
  template.raw = raw;
  return [['data', template], ...argExprs];
};

export const reduceElisions = (es: any[]) => {
  const reduced: any[] = [];
  for (const e of es) {
    if (e[0] === undefined) {
      // Push the elisions.
      (e as undefined[]).forEach(_ => reduced.push(undefined));
    } else {
      // Push the individual expression.
      reduced.push(e);
    }
  }
  return reduced;
};
