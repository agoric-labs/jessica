// DO NOT EDIT - Generated automatically from tag-string.mjs.ts by tessc
/// <reference path="./peg.d.ts"/>
const tagString = insulate((tag, uri) => {


  function tagged(templateOrFlag, ...args)
  {
    if (typeof templateOrFlag === 'string') {
      return tagString(tag(templateOrFlag), uri);
    }
    const template = templateOrFlag;
    const cooked = template.reduce((prior, t, i) => {
      prior.push(t, String(args[i]));
      return prior;
    }, []);
    cooked.push(template[template.length - 1]);
    const cooked0 = cooked.join('');
    const raw0 = args.reduce((prior, hole, i) => {
      prior.push(String(hole), template.raw[i + 1]);
      return prior;
    }, [template.raw[0]]).join('');
    const sources0 = {
      byte: 0,
      column: 1,
      line: 1,
      uri };

    const tmpl = [cooked0];
    tmpl.raw = [raw0];
    tmpl.sources = [sources0];
    return tag(tmpl);
  }
  tagged.parserCreator = tag.parserCreator;
  tagged._asExtending = tag._asExtending;
  return tagged;
});

export default tagString;