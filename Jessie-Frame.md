<!-- www.smotaal.io/#/meta/@ses/jessie-frame -->

# Safe ECMAScript

## `<jessie-frame>`

A precursor for [`ses-frame`](./SES-Frame) dealing only with Jessie code.

### Goals

- Use iframe CSP to render trusted content.
- Rely on a Jessie service worker to verify imported modules.

---

### Roadmap

Intitial API:

Service Worker scope is `./jessie-frame-${hash}/`.  Cache of translated sources is mapped from the IJessicaOptions (two translations with the same options )

```javascript
interface ISerializableJessicaParameters {
    // The kind of output we want from the `translate` function.
    target: 'jessie-frame';
}
interface IResourceRequestParameters {
    // Same base as the frame's Service Worker scope.
    // https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?hl=en_US&pli=1&pli=1
    sourceURL: string;

    // Where the resource is actually fetched from by the Service Worker.
    remoteURL: string;
}
interface IJessicaResourceParameters extends ISerializableJessicaParameters, IResourceRequestParameters {
}
// TODO: Eventually, allow asynchrony, too.
type readable = string;
interface IJessicaTranslationResult extends IJessicaResourceParameters {
    // These are the compiler outputs:
    translatedText: readable;
}

function jessica.translate(sourceText: readable, parameters: IJessicaResourceParameters): Promise<IJessicaTranslationResult>;
```

---

### Questions

- Providing endowments for vat operations
