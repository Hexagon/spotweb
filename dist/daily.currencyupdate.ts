// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const $XML = Symbol("x/xml");
const schema = {
    comment: "#comment",
    text: "#text",
    stylesheets: "$stylesheets",
    attribute: {
        prefix: "@"
    },
    property: {
        prefix: "@"
    }
};
const SeekMode = Object.freeze({
    Current: Deno?.SeekMode?.Current ?? 0,
    Start: Deno?.SeekMode?.Start ?? 1,
    End: Deno?.SeekMode?.End ?? 2
});
const entities = {
    xml: {
        "&lt;": "<",
        "&gt;": ">",
        "&apos;": "'",
        "&quot;": '"',
        "&amp;": "&"
    },
    char: {
        "&": "&amp;",
        '"': "&quot;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&apos;"
    }
};
const tokens = {
    entity: {
        regex: {
            entities: /&#(?<hex>x?)(?<code>\d+);/g
        }
    },
    prolog: {
        start: "<?xml",
        end: "?>"
    },
    stylesheet: {
        start: "<?xml-stylesheet",
        end: "?>"
    },
    doctype: {
        start: "<!DOCTYPE",
        end: ">",
        elements: {
            start: "[",
            end: "]"
        },
        element: {
            start: "<!ELEMENT",
            end: ">",
            value: {
                start: "(",
                end: ")",
                regex: {
                    end: {
                        until: /\)/,
                        bytes: 1
                    }
                }
            }
        }
    },
    comment: {
        start: "<!--",
        end: "-->",
        regex: {
            end: {
                until: /(?<!-)-->/,
                bytes: 4,
                length: 3
            }
        }
    },
    cdata: {
        start: "<![CDATA[",
        end: "]]>",
        regex: {
            end: {
                until: /\]\]>/,
                bytes: 3
            }
        }
    },
    tag: {
        start: "<",
        end: ">",
        close: {
            start: "</",
            end: ">",
            self: "/",
            regex: {
                start: /<\//,
                end: /\/?>/
            }
        },
        attribute: {
            regex: {
                name: {
                    until: /=/,
                    bytes: 1
                }
            }
        },
        regex: {
            name: {
                until: /[\s\/>]/,
                bytes: 1
            },
            start: {
                until: /</,
                bytes: 1
            }
        }
    },
    text: {
        regex: {
            end: {
                until: /(<\/)|(<!)/,
                bytes: 2
            }
        }
    }
};
class Parser {
    constructor(stream, options = {}){
        this.#stream = stream;
        this.#options = options;
        this.#options.reviver ??= function({ value  }) {
            return value;
        };
    }
    parse() {
        return this.#document();
    }
    #options;
    #debug(path, string) {
        if (this.#options.debug) {
            console.debug(`${path.map((node)=>node[$XML].name).join(" > ")} | ${string}`.trim());
        }
    }
    #document() {
        const document = {};
        const path = [];
        const comments = [];
        let root = false;
        let clean;
        this.#trim();
        try {
            while(true){
                clean = true;
                if (this.#peek(tokens.comment.start)) {
                    clean = false;
                    comments.push(this.#comment({
                        path
                    }));
                    continue;
                }
                if (this.#peek(tokens.prolog.start) && !this.#peek(tokens.stylesheet.start)) {
                    if (document.xml) {
                        throw Object.assign(new SyntaxError("Multiple prolog declaration found"), {
                            stack: false
                        });
                    }
                    clean = false;
                    Object.assign(document, this.#prolog({
                        path
                    }));
                    continue;
                }
                if (this.#peek(tokens.stylesheet.start)) {
                    clean = false;
                    const stylesheets = document[schema.stylesheets] ??= [];
                    stylesheets.push(this.#stylesheet({
                        path
                    }).stylesheet);
                    continue;
                }
                if (this.#peek(tokens.doctype.start)) {
                    if (document.doctype) {
                        throw Object.assign(new SyntaxError("Multiple doctype declaration found"), {
                            stack: false
                        });
                    }
                    clean = false;
                    Object.assign(document, this.#doctype({
                        path
                    }));
                    continue;
                }
                if (this.#peek(tokens.tag.start)) {
                    if (root) {
                        throw Object.assign(new SyntaxError("Multiple root elements found"), {
                            stack: false
                        });
                    }
                    clean = false;
                    Object.assign(document, this.#node({
                        path
                    }));
                    this.#trim();
                    root = true;
                    continue;
                }
            }
        } catch (error) {
            if (error instanceof Deno.errors.UnexpectedEof && clean) {
                if (comments.length) {
                    document[schema.comment] = comments;
                }
                return document;
            }
            throw error;
        }
    }
    #node({ path: path1  }) {
        if (this.#options.progress) {
            this.#options.progress(this.#stream.cursor);
        }
        if (this.#peek(tokens.comment.start)) {
            return {
                [schema.comment]: this.#comment({
                    path: path1
                })
            };
        }
        return this.#tag({
            path: path1
        });
    }
    #prolog({ path: path2  }) {
        this.#debug(path2, "parsing prolog");
        const prolog = this.#make.node({
            name: "xml",
            path: path2
        });
        this.#consume(tokens.prolog.start);
        while(!this.#peek(tokens.prolog.end)){
            Object.assign(prolog, this.#attribute({
                path: [
                    ...path2,
                    prolog
                ]
            }));
        }
        this.#consume(tokens.prolog.end);
        return {
            xml: prolog
        };
    }
    #stylesheet({ path: path3  }) {
        this.#debug(path3, "parsing stylesheet");
        const stylesheet = this.#make.node({
            name: "xml-stylesheet",
            path: path3
        });
        this.#consume(tokens.stylesheet.start);
        while(!this.#peek(tokens.stylesheet.end)){
            Object.assign(stylesheet, this.#attribute({
                path: [
                    ...path3,
                    stylesheet
                ]
            }));
        }
        this.#consume(tokens.stylesheet.end);
        return {
            stylesheet
        };
    }
    #doctype({ path: path4  }) {
        this.#debug(path4, "parsing doctype");
        const doctype = this.#make.node({
            name: "doctype",
            path: path4
        });
        Object.defineProperty(doctype, $XML, {
            enumerable: false,
            writable: true
        });
        this.#consume(tokens.doctype.start);
        while(!this.#peek(tokens.doctype.end)){
            if (this.#peek(tokens.doctype.elements.start)) {
                this.#consume(tokens.doctype.elements.start);
                while(!this.#peek(tokens.doctype.elements.end)){
                    Object.assign(doctype, this.#doctypeElement({
                        path: path4
                    }));
                }
                this.#consume(tokens.doctype.elements.end);
            } else {
                Object.assign(doctype, this.#property({
                    path: path4
                }));
            }
        }
        this.#stream.consume({
            content: tokens.doctype.end
        });
        return {
            doctype
        };
    }
    #doctypeElement({ path: path5  }) {
        this.#debug(path5, "parsing doctype element");
        this.#consume(tokens.doctype.element.start);
        const element = Object.keys(this.#property({
            path: path5
        })).shift().substring(schema.property.prefix.length);
        this.#debug(path5, `found doctype element "${element}"`);
        this.#consume(tokens.doctype.element.value.start);
        const value = this.#capture(tokens.doctype.element.value.regex.end);
        this.#consume(tokens.doctype.element.value.end);
        this.#debug(path5, `found doctype element value "${value}"`);
        this.#consume(tokens.doctype.element.end);
        return {
            [element]: value
        };
    }
    #tag({ path: path6  }) {
        this.#debug(path6, "parsing tag");
        const tag = this.#make.node({
            path: path6
        });
        this.#consume(tokens.tag.start);
        const name = this.#capture(tokens.tag.regex.name);
        Object.assign(tag[$XML], {
            name
        });
        this.#debug(path6, `found tag "${name}"`);
        while(!tokens.tag.close.regex.end.test(this.#stream.peek(2))){
            Object.assign(tag, this.#attribute({
                path: [
                    ...path6,
                    tag
                ]
            }));
        }
        const selfclosed = this.#peek(tokens.tag.close.self);
        if (selfclosed) {
            this.#debug(path6, `tag "${name}" is self-closed`);
            this.#consume(tokens.tag.close.self);
        }
        this.#consume(tokens.tag.end);
        if (!selfclosed) {
            if (this.#peek(tokens.cdata.start) || !this.#peek(tokens.tag.start)) {
                Object.assign(tag, this.#text({
                    close: name,
                    path: [
                        ...path6,
                        tag
                    ]
                }));
            } else {
                while(!tokens.tag.close.regex.start.test(this.#stream.peek(2))){
                    const child = this.#node({
                        path: [
                            ...path6,
                            tag
                        ]
                    });
                    const [key, value] = Object.entries(child).shift();
                    if (Array.isArray(tag[key])) {
                        tag[key].push(value);
                        this.#debug([
                            ...path6,
                            tag
                        ], `add new child "${key}" to array`);
                    } else if (key in tag) {
                        const array = [
                            tag[key],
                            value
                        ];
                        Object.defineProperty(array, $XML, {
                            enumerable: false,
                            writable: true
                        });
                        if (tag[key]?.[$XML]) {
                            Object.assign(array, {
                                [$XML]: tag[key][$XML]
                            });
                        }
                        tag[key] = array;
                        this.#debug([
                            ...path6,
                            tag
                        ], `multiple children named "${key}", using array notation`);
                    } else {
                        Object.assign(tag, child);
                        this.#debug([
                            ...path6,
                            tag
                        ], `add new child "${key}"`);
                    }
                }
            }
            this.#consume(tokens.tag.close.start);
            this.#consume(name);
            this.#consume(tokens.tag.close.end);
            this.#debug(path6, `found closing tag for "${name}"`);
        }
        for (const [key] of Object.entries(tag).filter(([_, value])=>typeof value === "undefined")){
            delete tag[key];
        }
        if (!Object.keys(tag).includes(schema.text)) {
            const children = Object.keys(tag).filter((key)=>!key.startsWith(schema.attribute.prefix) && key !== schema.text);
            if (!children.length) {
                this.#debug(path6, `tag "${name}" has implictely obtained a text node as it has no children but has attributes`);
                tag[schema.text] = this.#revive({
                    key: schema.text,
                    value: "",
                    tag
                });
            }
        }
        if ((this.#options.flatten ?? true) && Object.keys(tag).includes(schema.text) && Object.keys(tag).length === 1) {
            this.#debug(path6, `tag "${name}" has been implicitely flattened as it only has a text node`);
            return {
                [name]: tag[schema.text]
            };
        }
        return {
            [name]: tag
        };
    }
    #attribute({ path: path7  }) {
        this.#debug(path7, "parsing attribute");
        const attribute = this.#capture(tokens.tag.attribute.regex.name);
        this.#debug(path7, `found attribute "${attribute}"`);
        this.#consume("=");
        const quote = this.#stream.peek();
        this.#consume(quote);
        const value = this.#capture({
            until: new RegExp(quote),
            bytes: quote.length
        });
        this.#consume(quote);
        this.#debug(path7, `found attribute value "${value}"`);
        return {
            [`${schema.attribute.prefix}${attribute}`]: this.#revive({
                key: `${schema.attribute.prefix}${attribute}`,
                value,
                tag: path7.at(-1)
            })
        };
    }
    #property({ path: path8  }) {
        this.#debug(path8, "parsing property");
        const quote = this.#stream.peek();
        const delimiter = /["']/.test(quote) ? quote : " ";
        if (delimiter.trim().length) {
            this.#consume(delimiter);
        }
        const property = this.#capture({
            until: new RegExp(delimiter),
            bytes: delimiter.length
        });
        this.#debug(path8, `found property ${property}`);
        if (delimiter.trim().length) {
            this.#consume(delimiter);
        }
        return {
            [`${schema.property.prefix}${property}`]: true
        };
    }
    #text({ close , path: path9  }) {
        this.#debug(path9, "parsing text");
        const tag = this.#make.node({
            name: schema.text,
            path: path9
        });
        let text = "";
        const comments = [];
        while(this.#peek(tokens.cdata.start) || !this.#peeks([
            tokens.tag.close.start,
            close,
            tokens.tag.close.end
        ])){
            if (this.#peek(tokens.cdata.start)) {
                text += this.#cdata({
                    path: [
                        ...path9,
                        tag
                    ]
                });
            } else if (this.#peek(tokens.comment.start)) {
                comments.push(this.#comment({
                    path: [
                        ...path9,
                        tag
                    ]
                }));
            } else {
                text += this.#capture(tokens.text.regex.end);
                if (this.#peek(tokens.cdata.start) || this.#peek(tokens.comment.start)) {
                    continue;
                }
                if (!this.#peeks([
                    tokens.tag.close.start,
                    close,
                    tokens.tag.close.end
                ])) {
                    text += tokens.tag.close.start;
                    this.#consume(tokens.tag.close.start);
                }
            }
        }
        this.#debug(path9, `parsed text "${text}"`);
        if (comments.length) {
            this.#debug(path9, `parsed comments ${JSON.stringify(comments)}`);
        }
        Object.assign(tag, {
            [schema.text]: this.#revive({
                key: schema.text,
                value: text.trim(),
                tag: path9.at(-1)
            }),
            ...comments.length ? {
                [schema.comment]: comments
            } : {}
        });
        return tag;
    }
    #cdata({ path: path10  }) {
        this.#debug(path10, "parsing cdata");
        this.#consume(tokens.cdata.start);
        const data = this.#capture(tokens.cdata.regex.end);
        this.#consume(tokens.cdata.end);
        return data;
    }
    #comment({ path: path11  }) {
        this.#debug(path11, "parsing comment");
        this.#consume(tokens.comment.start);
        const comment = this.#capture(tokens.comment.regex.end).trim();
        this.#consume(tokens.comment.end);
        return comment;
    }
    #revive({ key , value , tag  }) {
        return this.#options.reviver.call(tag, {
            key,
            tag: tag[$XML].name,
            properties: !(key.startsWith(schema.attribute.prefix) || key.startsWith(schema.property.prefix)) ? {
                ...tag
            } : null,
            value: (()=>{
                switch(true){
                    case (this.#options.emptyToNull ?? true) && /^\s*$/.test(value):
                        return null;
                    case (this.#options.reviveBooleans ?? true) && /^(?:true|false)$/i.test(value):
                        return /^true$/i.test(value);
                    case this.#options.reviveNumbers ?? true:
                        {
                            const num = Number(value);
                            if (Number.isFinite(num)) {
                                return num;
                            }
                        }
                    default:
                        value = value.replace(tokens.entity.regex.entities, (_, hex, code)=>String.fromCharCode(parseInt(code, hex ? 16 : 10)));
                        for (const [entity, character] of Object.entries(entities.xml)){
                            value = value.replaceAll(entity, character);
                        }
                        return value;
                }
            })()
        });
    }
    #make = {
        node ({ name ="" , path =[]  }) {
            const node = {
                [$XML]: {
                    name,
                    parent: path[path.length - 1] ?? null
                }
            };
            Object.defineProperty(node, $XML, {
                enumerable: false,
                writable: true
            });
            return node;
        }
    };
    #stream;
    #peek(token) {
        return this.#stream.peek(token.length) === token;
    }
    #peeks(tokens1) {
        let offset = 0;
        for(let i = 0; i < tokens1.length; i++){
            const token = tokens1[i];
            while(true){
                if (/\s/.test(this.#stream.peek(1, offset))) {
                    offset++;
                    continue;
                }
                if (this.#stream.peek(token.length, offset) === token) {
                    offset += token.length;
                    break;
                }
                return false;
            }
        }
        return true;
    }
    #consume(token1) {
        return this.#stream.consume({
            content: token1
        });
    }
    #capture(token2) {
        return this.#stream.capture(token2);
    }
    #trim() {
        return this.#stream.trim();
    }
}
class Stream {
    constructor(content){
        this.#content = content;
    }
    #decoder = new TextDecoder();
    #encoder = new TextEncoder();
    #content;
    get cursor() {
        return this.#content.seekSync(0, SeekMode.Current);
    }
    peek(bytes = 1, offset = 0) {
        const buffer = new Uint8Array(bytes);
        const cursor = this.cursor;
        if (offset) {
            this.#content.seekSync(offset, SeekMode.Current);
        }
        if (this.#content.readSync(buffer)) {
            this.#content.seekSync(cursor, SeekMode.Start);
            return this.#decoder.decode(buffer);
        }
        throw new Deno.errors.UnexpectedEof();
    }
    read(bytes = 1) {
        const buffer = new Uint8Array(bytes);
        if (this.#content.readSync(buffer)) {
            return buffer;
        }
        throw new Deno.errors.UnexpectedEof();
    }
    capture({ until , bytes , trim =true , length =bytes  }) {
        if (trim) {
            this.trim();
        }
        const buffer = [];
        while(!until.test(this.peek(bytes))){
            buffer.push(this.read(1)[0]);
        }
        if (bytes !== length) {
            buffer.push(...this.read(bytes - length));
        }
        if (trim) {
            this.trim();
        }
        return this.#decoder.decode(Uint8Array.from(buffer));
    }
    consume({ content , trim =true  }) {
        if (trim) {
            this.trim();
        }
        const bytes = this.#encoder.encode(content).length;
        if (content === this.peek(bytes)) {
            this.read(bytes);
            if (trim) {
                this.trim();
            }
            return;
        }
        throw Object.assign(new SyntaxError(`Expected next sequence to be "${content}", got "${this.peek(bytes)}" instead`), {
            stack: false
        });
    }
    trim() {
        try {
            while(/\s/.test(this.peek())){
                this.read(1);
            }
        } catch (error) {
            if (error instanceof Deno.errors.UnexpectedEof) {
                return;
            }
            throw error;
        }
    }
}
class Streamable {
    constructor(string){
        this.#buffer = new TextEncoder().encode(string);
    }
    #buffer;
    #cursor = 0;
    readSync(buffer) {
        const bytes = this.#buffer.slice(this.#cursor, this.#cursor + buffer.length);
        buffer.set(bytes);
        this.#cursor = Math.min(this.#cursor + bytes.length, this.#buffer.length);
        return bytes.length || null;
    }
    seekSync(offset, whence) {
        switch(whence){
            case SeekMode.Start:
                this.#cursor = offset;
                break;
            case SeekMode.Current:
                this.#cursor += offset;
                break;
            case SeekMode.End:
                this.#cursor = this.#buffer.length + offset;
                break;
        }
        return this.#cursor;
    }
}
function parse(content, options) {
    if (typeof content === "string") {
        content = new Streamable(content);
    }
    return new Parser(new Stream(content), options).parse();
}
const ExchangeRate = async ()=>{
    const result = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"), resultText = await result.text(), resultJson = parse(resultText);
    const base = resultJson["gesmes:Envelope"]?.Cube?.Cube, entries = {}, data = {
        "date": base["@time"],
        entries
    };
    let entry;
    for (entry of base.Cube){
        data.entries[entry["@currency"]] = entry["@rate"];
    }
    return data;
};
const osType = (()=>{
    const { Deno: Deno1  } = globalThis;
    if (typeof Deno1?.build?.os === "string") {
        return Deno1.build.os;
    }
    const { navigator  } = globalThis;
    if (navigator?.appVersion?.includes?.("Win")) {
        return "windows";
    }
    return "linux";
})();
const isWindows = osType === "windows";
const CHAR_FORWARD_SLASH = 47;
function assertPath(path) {
    if (typeof path !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
    }
}
function isPosixPathSeparator(code) {
    return code === 47;
}
function isPathSeparator(code) {
    return isPosixPathSeparator(code) || code === 92;
}
function isWindowsDeviceRoot(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path.length; i <= len; ++i){
        if (i < len) code = path.charCodeAt(i);
        else if (isPathSeparator(code)) break;
        else code = CHAR_FORWARD_SLASH;
        if (isPathSeparator(code)) {
            if (lastSlash === i - 1 || dots === 1) {} else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
                else res = path.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
function _format(sep, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (base === sep) return dir;
    if (dir === pathObject.root) return dir + base;
    return dir + sep + base;
}
const WHITESPACE_ENCODINGS = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS[c] ?? c;
    });
}
function lastPathSegment(path, isSep, start = 0) {
    let matchedNonSeparator = false;
    let end = path.length;
    for(let i = path.length - 1; i >= start; --i){
        if (isSep(path.charCodeAt(i))) {
            if (matchedNonSeparator) {
                start = i + 1;
                break;
            }
        } else if (!matchedNonSeparator) {
            matchedNonSeparator = true;
            end = i + 1;
        }
    }
    return path.slice(start, end);
}
function stripTrailingSeparators(segment, isSep) {
    if (segment.length <= 1) {
        return segment;
    }
    let end = segment.length;
    for(let i = segment.length - 1; i > 0; i--){
        if (isSep(segment.charCodeAt(i))) {
            end = i;
        } else {
            break;
        }
    }
    return segment.slice(0, end);
}
function stripSuffix(name, suffix) {
    if (suffix.length >= name.length) {
        return name;
    }
    const lenDiff = name.length - suffix.length;
    for(let i = suffix.length - 1; i >= 0; --i){
        if (name.charCodeAt(lenDiff + i) !== suffix.charCodeAt(i)) {
            return name;
        }
    }
    return name.slice(0, -suffix.length);
}
class DenoStdInternalError extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError(msg);
    }
}
const sep = "\\";
const delimiter = ";";
function resolve(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        const { Deno: Deno1  } = globalThis;
        if (i >= 0) {
            path = pathSegments[i];
        } else if (!resolvedDevice) {
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path = Deno1.cwd();
        } else {
            if (typeof Deno1?.env?.get !== "function" || typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
            if (path === undefined || path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path = `${resolvedDevice}\\`;
            }
        }
        assertPath(path);
        const len = path.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator(code)) {
                isAbsolute = true;
                if (isPathSeparator(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator(path.charCodeAt(j))) break;
                            }
                            if (j === len) {
                                device = `\\\\${firstPart}\\${path.slice(last)}`;
                                rootEnd = j;
                            } else if (j !== last) {
                                device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot(code)) {
                if (path.charCodeAt(1) === 58) {
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator(path.charCodeAt(2))) {
                            isAbsolute = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator(code)) {
            rootEnd = 1;
            isAbsolute = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            isAbsolute = true;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return `\\\\${firstPart}\\${path.slice(last)}\\`;
                        } else if (j !== last) {
                            device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) {
                        isAbsolute = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute) tail = ".";
    if (tail.length > 0 && isPathSeparator(path.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
function isAbsolute(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return false;
    const code = path.charCodeAt(0);
    if (isPathSeparator(code)) {
        return true;
    } else if (isWindowsDeviceRoot(code)) {
        if (len > 2 && path.charCodeAt(1) === 58) {
            if (isPathSeparator(path.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < pathsCount; ++i){
        const path = paths[i];
        assertPath(path);
        if (path.length > 0) {
            if (joined === undefined) joined = firstPart = path;
            else joined += `\\${path}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert(firstPart != null);
    if (isPathSeparator(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize(joined);
}
function relative(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    const fromOrig = resolve(from);
    const toOrig = resolve(to);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to = toOrig.toLowerCase();
    if (from === to) return "";
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 92) break;
    }
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== 92) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 0;
    let toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 92) break;
    }
    for(; toEnd - 1 > toStart; --toEnd){
        if (to.charCodeAt(toEnd - 1) !== 92) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 92) {
                    return toOrig.slice(toStart + i + 1);
                } else if (i === 2) {
                    return toOrig.slice(toStart + i);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 92) {
                    lastCommonSep = i;
                } else if (i === 2) {
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 92) lastCommonSep = i;
    }
    if (i !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 92) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === 92) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
function toNamespacedPath(path) {
    if (typeof path !== "string") return path;
    if (path.length === 0) return "";
    const resolvedPath = resolve(path);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path;
}
function dirname(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return path;
                        }
                        if (j !== last) {
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return path;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator(path.charCodeAt(i))) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return stripTrailingSeparators(path.slice(0, end), isPosixPathSeparator);
}
function basename(path, suffix = "") {
    assertPath(path);
    if (path.length === 0) return path;
    if (typeof suffix !== "string") {
        throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
    }
    let start = 0;
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot(drive)) {
            if (path.charCodeAt(1) === 58) start = 2;
        }
    }
    const lastSegment = lastPathSegment(path, isPathSeparator, start);
    const strippedSegment = stripTrailingSeparators(lastSegment, isPathSeparator);
    return suffix ? stripSuffix(strippedSegment, suffix) : strippedSegment;
}
function extname(path) {
    assertPath(path);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path.length >= 2 && path.charCodeAt(1) === 58 && isWindowsDeviceRoot(path.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path.length - 1; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("\\", pathObject);
}
function parse1(path) {
    assertPath(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = 1;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) {
                        if (len === 3) {
                            ret.root = ret.dir = path;
                            ret.base = "\\";
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    ret.root = ret.dir = path;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        ret.root = ret.dir = path;
        ret.base = "\\";
        return ret;
    }
    if (rootEnd > 0) ret.root = path.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= rootEnd; --i){
        code = path.charCodeAt(i);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            ret.base = ret.name = path.slice(startPart, end);
        }
    } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
        ret.ext = path.slice(startDot, end);
    }
    ret.base = ret.base || "\\";
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
function fromFileUrl(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    let path = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        path = `\\\\${url.hostname}${path}`;
    }
    return path;
}
function toFileUrl(path) {
    if (!isAbsolute(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const mod = {
    sep: sep,
    delimiter: delimiter,
    resolve: resolve,
    normalize: normalize,
    isAbsolute: isAbsolute,
    join: join,
    relative: relative,
    toNamespacedPath: toNamespacedPath,
    dirname: dirname,
    basename: basename,
    extname: extname,
    format: format,
    parse: parse1,
    fromFileUrl: fromFileUrl,
    toFileUrl: toFileUrl
};
const sep1 = "/";
const delimiter1 = ":";
function resolve1(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            const { Deno: Deno1  } = globalThis;
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
        }
        assertPath(path);
        if (path.length === 0) {
            continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute = isPosixPathSeparator(path.charCodeAt(0));
    }
    resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize1(path) {
    assertPath(path);
    if (path.length === 0) return ".";
    const isAbsolute = isPosixPathSeparator(path.charCodeAt(0));
    const trailingSeparator = isPosixPathSeparator(path.charCodeAt(path.length - 1));
    path = normalizeString(path, !isAbsolute, "/", isPosixPathSeparator);
    if (path.length === 0 && !isAbsolute) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute) return `/${path}`;
    return path;
}
function isAbsolute1(path) {
    assertPath(path);
    return path.length > 0 && isPosixPathSeparator(path.charCodeAt(0));
}
function join1(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path = paths[i];
        assertPath(path);
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `/${path}`;
        }
    }
    if (!joined) return ".";
    return normalize1(joined);
}
function relative1(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    from = resolve1(from);
    to = resolve1(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (!isPosixPathSeparator(from.charCodeAt(fromStart))) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (!isPosixPathSeparator(to.charCodeAt(toStart))) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (isPosixPathSeparator(to.charCodeAt(toStart + i))) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (isPosixPathSeparator(from.charCodeAt(fromStart + i))) {
                    lastCommonSep = i;
                } else if (i === 0) {
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (isPosixPathSeparator(fromCode)) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || isPosixPathSeparator(from.charCodeAt(i))) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (isPosixPathSeparator(to.charCodeAt(toStart))) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath1(path) {
    return path;
}
function dirname1(path) {
    if (path.length === 0) return ".";
    let end = -1;
    let matchedNonSeparator = false;
    for(let i = path.length - 1; i >= 1; --i){
        if (isPosixPathSeparator(path.charCodeAt(i))) {
            if (matchedNonSeparator) {
                end = i;
                break;
            }
        } else {
            matchedNonSeparator = true;
        }
    }
    if (end === -1) {
        return isPosixPathSeparator(path.charCodeAt(0)) ? "/" : ".";
    }
    return stripTrailingSeparators(path.slice(0, end), isPosixPathSeparator);
}
function basename1(path, suffix = "") {
    assertPath(path);
    if (path.length === 0) return path;
    if (typeof suffix !== "string") {
        throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
    }
    const lastSegment = lastPathSegment(path, isPosixPathSeparator);
    const strippedSegment = stripTrailingSeparators(lastSegment, isPosixPathSeparator);
    return suffix ? stripSuffix(strippedSegment, suffix) : strippedSegment;
}
function extname1(path) {
    assertPath(path);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i = path.length - 1; i >= 0; --i){
        const code = path.charCodeAt(i);
        if (isPosixPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format1(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("/", pathObject);
}
function parse2(path) {
    assertPath(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path.length === 0) return ret;
    const isAbsolute = isPosixPathSeparator(path.charCodeAt(0));
    let start;
    if (isAbsolute) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPosixPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute) {
                ret.base = ret.name = path.slice(1, end);
            } else {
                ret.base = ret.name = path.slice(startPart, end);
            }
        }
        ret.base = ret.base || "/";
    } else {
        if (startPart === 0 && isAbsolute) {
            ret.name = path.slice(1, startDot);
            ret.base = path.slice(1, end);
        } else {
            ret.name = path.slice(startPart, startDot);
            ret.base = path.slice(startPart, end);
        }
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0) {
        ret.dir = stripTrailingSeparators(path.slice(0, startPart - 1), isPosixPathSeparator);
    } else if (isAbsolute) ret.dir = "/";
    return ret;
}
function fromFileUrl1(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl1(path) {
    if (!isAbsolute1(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const mod1 = {
    sep: sep1,
    delimiter: delimiter1,
    resolve: resolve1,
    normalize: normalize1,
    isAbsolute: isAbsolute1,
    join: join1,
    relative: relative1,
    toNamespacedPath: toNamespacedPath1,
    dirname: dirname1,
    basename: basename1,
    extname: extname1,
    format: format1,
    parse: parse2,
    fromFileUrl: fromFileUrl1,
    toFileUrl: toFileUrl1
};
const path12 = isWindows ? mod : mod1;
const { join: join2 , normalize: normalize2  } = path12;
const path13 = isWindows ? mod : mod1;
const { basename: basename2 , delimiter: delimiter2 , dirname: dirname2 , extname: extname2 , format: format2 , fromFileUrl: fromFileUrl2 , isAbsolute: isAbsolute2 , join: join3 , normalize: normalize3 , parse: parse3 , relative: relative2 , resolve: resolve2 , sep: sep2 , toFileUrl: toFileUrl2 , toNamespacedPath: toNamespacedPath2  } = path13;
function getFileInfoType(fileInfo) {
    return fileInfo.isFile ? "file" : fileInfo.isDirectory ? "dir" : fileInfo.isSymlink ? "symlink" : undefined;
}
async function ensureDir(dir) {
    try {
        const fileInfo = await Deno.lstat(dir);
        if (!fileInfo.isDirectory) {
            throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
        }
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            await Deno.mkdir(dir, {
                recursive: true
            });
            return;
        }
        throw err;
    }
}
new Deno.errors.AlreadyExists("dest already exists.");
var EOL;
(function(EOL) {
    EOL["LF"] = "\n";
    EOL["CRLF"] = "\r\n";
})(EOL || (EOL = {}));
const hexTable = new TextEncoder().encode("0123456789abcdef");
function encode(src) {
    const dst = new Uint8Array(src.length * 2);
    for(let i = 0; i < dst.length; i++){
        const v = src[i];
        dst[i * 2] = hexTable[v >> 4];
        dst[i * 2 + 1] = hexTable[v & 0x0f];
    }
    return dst;
}
const { Deno: Deno1  } = globalThis;
const noColor = typeof Deno1?.noColor === "boolean" ? Deno1.noColor : true;
let enabled = !noColor;
function code(open, close) {
    return {
        open: `\x1b[${open.join(";")}m`,
        close: `\x1b[${close}m`,
        regexp: new RegExp(`\\x1b\\[${close}m`, "g")
    };
}
function run(str, code) {
    return enabled ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}` : str;
}
function green(str) {
    return run(str, code([
        32
    ], 39));
}
new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"
].join("|"), "g");
const encoder = new TextEncoder();
const decoder = new TextDecoder();
function baseUrlToFilename(url) {
    const out = [];
    const protocol = url.protocol.replace(":", "");
    out.push(protocol);
    switch(protocol){
        case "http":
        case "https":
            {
                const host = url.hostname;
                const hostPort = url.port;
                out.push(hostPort ? `${host}_PORT${hostPort}` : host);
                break;
            }
        case "file":
        case "data":
        case "blob":
            break;
        default:
            throw new TypeError(`Don't know how to create cache name for protocol: ${protocol}`);
    }
    return join3(...out);
}
function stringToURL(url) {
    return url.startsWith("file://") || url.startsWith("http://") || url.startsWith("https://") ? new URL(url) : toFileUrl2(resolve2(url));
}
async function hash(value) {
    return decoder.decode(encode(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))));
}
async function urlToFilename(url) {
    const cacheFilename = baseUrlToFilename(url);
    const hashedFilename = await hash(url.pathname + url.search);
    return join3(cacheFilename, hashedFilename);
}
async function isFile(filePath) {
    try {
        const stats = await Deno.lstat(filePath);
        return stats.isFile;
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return false;
        }
        throw err;
    }
}
function homeDir() {
    switch(Deno.build.os){
        case "windows":
            return Deno.env.get("USERPROFILE");
        case "linux":
        case "darwin":
            return Deno.env.get("HOME");
        default:
            throw Error("unreachable");
    }
}
function cacheDir() {
    if (Deno.build.os === "darwin") {
        const home = homeDir();
        if (home) {
            return join3(home, "Library/Caches");
        }
    } else if (Deno.build.os === "linux") {
        const cacheHome = Deno.env.get("XDG_CACHE_HOME");
        if (cacheHome) {
            return cacheHome;
        } else {
            const home = homeDir();
            if (home) {
                return join3(home, ".cache");
            }
        }
    } else {
        return Deno.env.get("LOCALAPPDATA");
    }
}
function denoCacheDir() {
    const dd = Deno.env.get("DENO_DIR");
    let root;
    if (dd) {
        root = normalize3(isAbsolute2(dd) ? dd : join3(Deno.cwd(), dd));
    } else {
        const cd = cacheDir();
        if (cd) {
            root = join3(cd, "deno");
        } else {
            const hd = homeDir();
            if (hd) {
                root = join3(hd, ".deno");
            }
        }
    }
    return root;
}
const defaultExtensions = {
    darwin: "dylib",
    linux: "so",
    windows: "dll"
};
const defaultPrefixes = {
    darwin: "lib",
    linux: "lib",
    windows: ""
};
function getCrossOption(record) {
    if (record === undefined) {
        return;
    }
    if ("darwin" in record || "linux" in record || "windows" in record) {
        const subrecord = record[Deno.build.os];
        if (subrecord && typeof subrecord === "object" && ("x86_64" in subrecord || "aarch64" in subrecord)) {
            return subrecord[Deno.build.arch];
        } else {
            return subrecord;
        }
    }
    if ("x86_64" in record || "aarch64" in record) {
        const subrecord = record[Deno.build.arch];
        if (subrecord && typeof subrecord === "object" && ("darwin" in subrecord || "linux" in subrecord || "windows" in subrecord)) {
            return subrecord[Deno.build.os];
        } else {
            return subrecord;
        }
    }
}
function createDownloadURL(options) {
    if (typeof options === "string" || options instanceof URL) {
        options = {
            url: options
        };
    }
    options.extensions ??= defaultExtensions;
    options.prefixes ??= defaultPrefixes;
    for(const key in options.extensions){
        const os = key;
        if (options.extensions[os] !== undefined) {
            options.extensions[os] = options.extensions[os].replace(/\.?(.+)/, "$1");
        }
    }
    let url;
    if (options.url instanceof URL) {
        url = options.url;
    } else if (typeof options.url === "string") {
        url = stringToURL(options.url);
    } else {
        const tmpUrl = getCrossOption(options.url);
        if (tmpUrl === undefined) {
            throw new TypeError(`An URL for the "${Deno.build.os}-${Deno.build.arch}" target was not provided.`);
        }
        if (typeof tmpUrl === "string") {
            url = stringToURL(tmpUrl);
        } else {
            url = tmpUrl;
        }
    }
    if ("name" in options && !Object.values(options.extensions).includes(extname2(url.pathname))) {
        if (!url.pathname.endsWith("/")) {
            url.pathname = `${url.pathname}/`;
        }
        const prefix = getCrossOption(options.prefixes) ?? "";
        const suffix = getCrossOption(options.suffixes) ?? "";
        const extension = options.extensions[Deno.build.os];
        if (options.name === undefined) {
            throw new TypeError(`Expected the "name" property for an automatically assembled URL.`);
        }
        const filename = `${prefix}${options.name}${suffix}.${extension}`;
        url = new URL(filename, url);
    }
    return url;
}
async function ensureCacheLocation(location = "deno") {
    if (location === "deno") {
        const dir = denoCacheDir();
        if (dir === undefined) {
            throw new Error("Could not get the deno cache directory, try using another CacheLocation in the plug options.");
        }
        location = join3(dir, "plug");
    } else if (location === "cache") {
        const dir = cacheDir();
        if (dir === undefined) {
            throw new Error("Could not get the cache directory, try using another CacheLocation in the plug options.");
        }
        location = join3(dir, "plug");
    } else if (location === "cwd") {
        location = join3(Deno.cwd(), "plug");
    } else if (location === "tmp") {
        location = await Deno.makeTempDir({
            prefix: "plug"
        });
    } else if (typeof location === "string" && location.startsWith("file://")) {
        location = fromFileUrl2(location);
    } else if (location instanceof URL) {
        if (location?.protocol !== "file:") {
            throw new TypeError("Cannot use any other protocol than file:// for an URL cache location.");
        }
        location = fromFileUrl2(location);
    }
    location = resolve2(normalize3(location));
    await ensureDir(location);
    return location;
}
async function download(options) {
    const location = (typeof options === "object" && "location" in options ? options.location : undefined) ?? "deno";
    const setting = (typeof options === "object" && "cache" in options ? options.cache : undefined) ?? "use";
    const [url, directory] = await Promise.all([
        createDownloadURL(options),
        ensureCacheLocation(location)
    ]);
    const cacheBasePath = join3(directory, await urlToFilename(url));
    const cacheFilePath = `${cacheBasePath}${extname2(url.pathname)}`;
    const cacheMetaPath = `${cacheBasePath}.metadata.json`;
    const cached = setting === "use" ? await isFile(cacheFilePath) : setting === "only" || setting !== "reloadAll";
    await ensureDir(dirname2(cacheBasePath));
    if (!cached) {
        const meta = {
            url
        };
        switch(url.protocol){
            case "http:":
            case "https:":
                {
                    console.log(`${green("Downloading")} ${url}`);
                    const response = await fetch(url.toString());
                    if (!response.ok) {
                        if (response.status === 404) {
                            throw new Error(`Could not find ${url}`);
                        } else {
                            throw new Deno.errors.Http(`${response.status} ${response.statusText}`);
                        }
                    }
                    await Deno.writeFile(cacheFilePath, new Uint8Array(await response.arrayBuffer()));
                    break;
                }
            case "file:":
                {
                    console.log(`${green("Copying")} ${url}`);
                    await Deno.copyFile(fromFileUrl2(url), cacheFilePath);
                    if (Deno.build.os !== "windows") {
                        await Deno.chmod(cacheFilePath, 0o644);
                    }
                    break;
                }
            default:
                {
                    throw new TypeError(`Cannot fetch to cache using the "${url.protocol}" protocol`);
                }
        }
        await Deno.writeTextFile(cacheMetaPath, JSON.stringify(meta));
    }
    if (!await isFile(cacheFilePath)) {
        throw new Error(`Could not find "${url}" in cache.`);
    }
    return cacheFilePath;
}
async function dlopen(options, symbols) {
    return Deno.dlopen(await download(options), symbols);
}
const __default = JSON.parse("{\n  \"name\": \"sqlite3\",\n  \"version\": \"0.8.2\",\n  \"github\": \"https://github.com/denodrivers/sqlite3\",\n\n  \"tasks\": {\n    \"test\": \"deno test --unstable -A test/test.ts\",\n    \"build-sqlite-win\": \"mkdir -p build && cd build && nmake /f ..\\\\sqlite\\\\Makefile.msc sqlite3.dll TOP=..\\\\sqlite\",\n    \"bench-deno\": \"deno run -A --unstable bench/bench_deno.js 50 1000000\",\n    \"bench-deno-ffi\": \"deno run -A --unstable bench/bench_deno_ffi.js 50 1000000\",\n    \"bench-deno-wasm\": \"deno run -A --unstable bench/bench_deno_wasm.js 50 1000000\",\n    \"bench-node\": \"node bench/bench_node.js 50 1000000\",\n    \"bench-bun\": \"bun run bench/bench_bun.js 50 1000000\",\n    \"bench-bun-ffi\": \"bun run bench/bench_bun_ffi.js 50 1000000\",\n    \"bench-c\": \"./bench/bench 50 1000000\",\n    \"bench-python\": \"python ./bench/bench_python.py\",\n    \"bench:northwind\": \"deno bench -A --unstable bench/northwind/deno.js\",\n    \"bench-wasm:northwind\": \"deno run -A --unstable bench/northwind/deno_wasm.js\",\n    \"bench-node:northwind\": \"node bench/northwind/node.mjs\",\n    \"bench-bun:northwind\": \"bun run bench/northwind/bun.js\"\n  },\n\n  \"lint\": {\n    \"rules\": {\n      \"exclude\": [\n        \"camelcase\",\n        \"no-explicit-any\"\n      ],\n      \"include\": [\n        \"explicit-function-return-type\",\n        \"eqeqeq\",\n        \"explicit-module-boundary-types\"\n      ]\n    }\n  }\n}");
const symbols = {
    sqlite3_open_v2: {
        parameters: [
            "buffer",
            "buffer",
            "i32",
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_close_v2: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_changes: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_total_changes: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_last_insert_rowid: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_get_autocommit: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_prepare_v2: {
        parameters: [
            "pointer",
            "buffer",
            "i32",
            "buffer",
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_reset: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_clear_bindings: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_step: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_step_cb: {
        name: "sqlite3_step",
        callback: true,
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_column_count: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_column_type: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "i32"
    },
    sqlite3_column_text: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "pointer"
    },
    sqlite3_finalize: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_exec: {
        parameters: [
            "pointer",
            "buffer",
            "pointer",
            "pointer",
            "buffer"
        ],
        result: "i32"
    },
    sqlite3_free: {
        parameters: [
            "pointer"
        ],
        result: "void"
    },
    sqlite3_column_int: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "i32"
    },
    sqlite3_column_double: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "f64"
    },
    sqlite3_column_blob: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "pointer"
    },
    sqlite3_column_bytes: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "i32"
    },
    sqlite3_column_name: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "pointer"
    },
    sqlite3_column_decltype: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "u64"
    },
    sqlite3_bind_parameter_index: {
        parameters: [
            "pointer",
            "buffer"
        ],
        result: "i32"
    },
    sqlite3_bind_text: {
        parameters: [
            "pointer",
            "i32",
            "buffer",
            "i32",
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_bind_blob: {
        parameters: [
            "pointer",
            "i32",
            "buffer",
            "i32",
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_bind_double: {
        parameters: [
            "pointer",
            "i32",
            "f64"
        ],
        result: "i32"
    },
    sqlite3_bind_int: {
        parameters: [
            "pointer",
            "i32",
            "i32"
        ],
        result: "i32"
    },
    sqlite3_bind_int64: {
        parameters: [
            "pointer",
            "i32",
            "i64"
        ],
        result: "i32"
    },
    sqlite3_bind_null: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "i32"
    },
    sqlite3_expanded_sql: {
        parameters: [
            "pointer"
        ],
        result: "pointer"
    },
    sqlite3_bind_parameter_count: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_complete: {
        parameters: [
            "buffer"
        ],
        result: "i32"
    },
    sqlite3_sourceid: {
        parameters: [],
        result: "pointer"
    },
    sqlite3_libversion: {
        parameters: [],
        result: "pointer"
    },
    sqlite3_blob_open: {
        parameters: [
            "pointer",
            "buffer",
            "buffer",
            "buffer",
            "i64",
            "i32",
            "buffer"
        ],
        result: "i32"
    },
    sqlite3_blob_read: {
        parameters: [
            "pointer",
            "buffer",
            "i32",
            "i32"
        ],
        result: "i32"
    },
    sqlite3_blob_write: {
        parameters: [
            "pointer",
            "buffer",
            "i32",
            "i32"
        ],
        result: "i32"
    },
    sqlite3_blob_bytes: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_blob_close: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_sql: {
        parameters: [
            "pointer"
        ],
        result: "pointer"
    },
    sqlite3_stmt_readonly: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_bind_parameter_name: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "pointer"
    },
    sqlite3_errmsg: {
        parameters: [
            "pointer"
        ],
        result: "pointer"
    },
    sqlite3_errstr: {
        parameters: [
            "i32"
        ],
        result: "pointer"
    },
    sqlite3_column_int64: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "i64"
    },
    sqlite3_backup_init: {
        parameters: [
            "pointer",
            "buffer",
            "pointer",
            "buffer"
        ],
        result: "pointer"
    },
    sqlite3_backup_step: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "i32"
    },
    sqlite3_backup_finish: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_backup_remaining: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_backup_pagecount: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_create_function: {
        parameters: [
            "pointer",
            "buffer",
            "i32",
            "i32",
            "pointer",
            "pointer",
            "pointer",
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_result_blob: {
        parameters: [
            "pointer",
            "buffer",
            "i32",
            "isize"
        ],
        result: "void"
    },
    sqlite3_result_double: {
        parameters: [
            "pointer",
            "f64"
        ],
        result: "void"
    },
    sqlite3_result_error: {
        parameters: [
            "pointer",
            "buffer",
            "i32"
        ],
        result: "void"
    },
    sqlite3_result_int: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "void"
    },
    sqlite3_result_int64: {
        parameters: [
            "pointer",
            "i64"
        ],
        result: "void"
    },
    sqlite3_result_null: {
        parameters: [
            "pointer"
        ],
        result: "void"
    },
    sqlite3_result_text: {
        parameters: [
            "pointer",
            "buffer",
            "i32",
            "isize"
        ],
        result: "void"
    },
    sqlite3_value_type: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_value_blob: {
        parameters: [
            "pointer"
        ],
        result: "pointer"
    },
    sqlite3_value_double: {
        parameters: [
            "pointer"
        ],
        result: "f64"
    },
    sqlite3_value_int: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_value_int64: {
        parameters: [
            "pointer"
        ],
        result: "i64"
    },
    sqlite3_value_text: {
        parameters: [
            "pointer"
        ],
        result: "pointer"
    },
    sqlite3_value_bytes: {
        parameters: [
            "pointer"
        ],
        result: "i32"
    },
    sqlite3_aggregate_context: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "pointer"
    },
    sqlite3_enable_load_extension: {
        parameters: [
            "pointer",
            "i32"
        ],
        result: "i32"
    },
    sqlite3_load_extension: {
        parameters: [
            "pointer",
            "buffer",
            "buffer",
            "buffer"
        ],
        result: "i32"
    }
};
let lib;
try {
    const customPath = Deno.env.get("DENO_SQLITE_PATH");
    if (customPath) {
        lib = Deno.dlopen(customPath, symbols).symbols;
    } else {
        lib = (await dlopen({
            name: __default.name,
            url: `${__default.github}/releases/download/${__default.version}/`,
            suffixes: {
                aarch64: "_aarch64"
            }
        }, symbols)).symbols;
    }
} catch (e) {
    if (e instanceof Deno.errors.PermissionDenied) {
        throw e;
    }
    const error = new Error("Failed to load SQLite3 Dynamic Library");
    error.cause = e;
    throw error;
}
const osType1 = (()=>{
    const { Deno: Deno1  } = globalThis;
    if (typeof Deno1?.build?.os === "string") {
        return Deno1.build.os;
    }
    const { navigator  } = globalThis;
    if (navigator?.appVersion?.includes?.("Win")) {
        return "windows";
    }
    return "linux";
})();
const isWindows1 = osType1 === "windows";
const CHAR_FORWARD_SLASH1 = 47;
function assertPath1(path) {
    if (typeof path !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
    }
}
function isPosixPathSeparator1(code) {
    return code === 47;
}
function isPathSeparator1(code) {
    return isPosixPathSeparator1(code) || code === 92;
}
function isWindowsDeviceRoot1(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString1(path, allowAboveRoot, separator, isPathSeparator) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path.length; i <= len; ++i){
        if (i < len) code = path.charCodeAt(i);
        else if (isPathSeparator(code)) break;
        else code = CHAR_FORWARD_SLASH1;
        if (isPathSeparator(code)) {
            if (lastSlash === i - 1 || dots === 1) {} else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
                else res = path.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
function _format1(sep, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (dir === pathObject.root) return dir + base;
    return dir + sep + base;
}
const WHITESPACE_ENCODINGS1 = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace1(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS1[c] ?? c;
    });
}
class DenoStdInternalError1 extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert1(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError1(msg);
    }
}
const sep3 = "\\";
const delimiter3 = ";";
function resolve3(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        const { Deno: Deno1  } = globalThis;
        if (i >= 0) {
            path = pathSegments[i];
        } else if (!resolvedDevice) {
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path = Deno1.cwd();
        } else {
            if (typeof Deno1?.env?.get !== "function" || typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
            if (path === undefined || path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path = `${resolvedDevice}\\`;
            }
        }
        assertPath1(path);
        const len = path.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator1(code)) {
                isAbsolute = true;
                if (isPathSeparator1(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator1(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator1(path.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator1(path.charCodeAt(j))) break;
                            }
                            if (j === len) {
                                device = `\\\\${firstPart}\\${path.slice(last)}`;
                                rootEnd = j;
                            } else if (j !== last) {
                                device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot1(code)) {
                if (path.charCodeAt(1) === 58) {
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator1(path.charCodeAt(2))) {
                            isAbsolute = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator1(code)) {
            rootEnd = 1;
            isAbsolute = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    resolvedTail = normalizeString1(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator1);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize4(path) {
    assertPath1(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator1(code)) {
            isAbsolute = true;
            if (isPathSeparator1(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator1(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator1(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator1(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return `\\\\${firstPart}\\${path.slice(last)}\\`;
                        } else if (j !== last) {
                            device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot1(code)) {
            if (path.charCodeAt(1) === 58) {
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator1(path.charCodeAt(2))) {
                        isAbsolute = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator1(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString1(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator1);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute) tail = ".";
    if (tail.length > 0 && isPathSeparator1(path.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
function isAbsolute3(path) {
    assertPath1(path);
    const len = path.length;
    if (len === 0) return false;
    const code = path.charCodeAt(0);
    if (isPathSeparator1(code)) {
        return true;
    } else if (isWindowsDeviceRoot1(code)) {
        if (len > 2 && path.charCodeAt(1) === 58) {
            if (isPathSeparator1(path.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join4(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < pathsCount; ++i){
        const path = paths[i];
        assertPath1(path);
        if (path.length > 0) {
            if (joined === undefined) joined = firstPart = path;
            else joined += `\\${path}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert1(firstPart != null);
    if (isPathSeparator1(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator1(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator1(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator1(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize4(joined);
}
function relative3(from, to) {
    assertPath1(from);
    assertPath1(to);
    if (from === to) return "";
    const fromOrig = resolve3(from);
    const toOrig = resolve3(to);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to = toOrig.toLowerCase();
    if (from === to) return "";
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 92) break;
    }
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== 92) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 0;
    let toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 92) break;
    }
    for(; toEnd - 1 > toStart; --toEnd){
        if (to.charCodeAt(toEnd - 1) !== 92) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 92) {
                    return toOrig.slice(toStart + i + 1);
                } else if (i === 2) {
                    return toOrig.slice(toStart + i);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 92) {
                    lastCommonSep = i;
                } else if (i === 2) {
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 92) lastCommonSep = i;
    }
    if (i !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 92) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === 92) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
function toNamespacedPath3(path) {
    if (typeof path !== "string") return path;
    if (path.length === 0) return "";
    const resolvedPath = resolve3(path);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot1(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path;
}
function dirname3(path) {
    assertPath1(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator1(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator1(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator1(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator1(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator1(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return path;
                        }
                        if (j !== last) {
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot1(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator1(path.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator1(code)) {
        return path;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator1(path.charCodeAt(i))) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return path.slice(0, end);
}
function basename3(path, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath1(path);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot1(drive)) {
            if (path.charCodeAt(1) === 58) start = 2;
        }
    }
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path.length - 1; i >= start; --i){
            const code = path.charCodeAt(i);
            if (isPathSeparator1(code)) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path.length;
        return path.slice(start, end);
    } else {
        for(i = path.length - 1; i >= start; --i){
            if (isPathSeparator1(path.charCodeAt(i))) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path.slice(start, end);
    }
}
function extname3(path) {
    assertPath1(path);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path.length >= 2 && path.charCodeAt(1) === 58 && isWindowsDeviceRoot1(path.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path.length - 1; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPathSeparator1(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format3(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format1("\\", pathObject);
}
function parse4(path) {
    assertPath1(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator1(code)) {
            rootEnd = 1;
            if (isPathSeparator1(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator1(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator1(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator1(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot1(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator1(path.charCodeAt(2))) {
                        if (len === 3) {
                            ret.root = ret.dir = path;
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    ret.root = ret.dir = path;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator1(code)) {
        ret.root = ret.dir = path;
        return ret;
    }
    if (rootEnd > 0) ret.root = path.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= rootEnd; --i){
        code = path.charCodeAt(i);
        if (isPathSeparator1(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            ret.base = ret.name = path.slice(startPart, end);
        }
    } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
function fromFileUrl3(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    let path = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        path = `\\\\${url.hostname}${path}`;
    }
    return path;
}
function toFileUrl3(path) {
    if (!isAbsolute3(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace1(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const mod2 = {
    sep: sep3,
    delimiter: delimiter3,
    resolve: resolve3,
    normalize: normalize4,
    isAbsolute: isAbsolute3,
    join: join4,
    relative: relative3,
    toNamespacedPath: toNamespacedPath3,
    dirname: dirname3,
    basename: basename3,
    extname: extname3,
    format: format3,
    parse: parse4,
    fromFileUrl: fromFileUrl3,
    toFileUrl: toFileUrl3
};
const sep4 = "/";
const delimiter4 = ":";
function resolve4(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            const { Deno: Deno1  } = globalThis;
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
        }
        assertPath1(path);
        if (path.length === 0) {
            continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH1;
    }
    resolvedPath = normalizeString1(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator1);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize5(path) {
    assertPath1(path);
    if (path.length === 0) return ".";
    const isAbsolute = path.charCodeAt(0) === 47;
    const trailingSeparator = path.charCodeAt(path.length - 1) === 47;
    path = normalizeString1(path, !isAbsolute, "/", isPosixPathSeparator1);
    if (path.length === 0 && !isAbsolute) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute) return `/${path}`;
    return path;
}
function isAbsolute4(path) {
    assertPath1(path);
    return path.length > 0 && path.charCodeAt(0) === 47;
}
function join5(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path = paths[i];
        assertPath1(path);
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `/${path}`;
        }
    }
    if (!joined) return ".";
    return normalize5(joined);
}
function relative4(from, to) {
    assertPath1(from);
    assertPath1(to);
    if (from === to) return "";
    from = resolve4(from);
    to = resolve4(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 47) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 47) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 47) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 47) {
                    lastCommonSep = i;
                } else if (i === 0) {
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 47) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 47) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (to.charCodeAt(toStart) === 47) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath4(path) {
    return path;
}
function dirname4(path) {
    assertPath1(path);
    if (path.length === 0) return ".";
    const hasRoot = path.charCodeAt(0) === 47;
    let end = -1;
    let matchedSlash = true;
    for(let i = path.length - 1; i >= 1; --i){
        if (path.charCodeAt(i) === 47) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) return hasRoot ? "/" : ".";
    if (hasRoot && end === 1) return "//";
    return path.slice(0, end);
}
function basename4(path, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath1(path);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path.length - 1; i >= 0; --i){
            const code = path.charCodeAt(i);
            if (code === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            end = i;
                        }
                    } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path.length;
        return path.slice(start, end);
    } else {
        for(i = path.length - 1; i >= 0; --i){
            if (path.charCodeAt(i) === 47) {
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path.slice(start, end);
    }
}
function extname4(path) {
    assertPath1(path);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i = path.length - 1; i >= 0; --i){
        const code = path.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format4(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format1("/", pathObject);
}
function parse5(path) {
    assertPath1(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path.length === 0) return ret;
    const isAbsolute = path.charCodeAt(0) === 47;
    let start;
    if (isAbsolute) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= start; --i){
        const code = path.charCodeAt(i);
        if (code === 47) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute) {
                ret.base = ret.name = path.slice(1, end);
            } else {
                ret.base = ret.name = path.slice(startPart, end);
            }
        }
    } else {
        if (startPart === 0 && isAbsolute) {
            ret.name = path.slice(1, startDot);
            ret.base = path.slice(1, end);
        } else {
            ret.name = path.slice(startPart, startDot);
            ret.base = path.slice(startPart, end);
        }
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);
    else if (isAbsolute) ret.dir = "/";
    return ret;
}
function fromFileUrl4(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl4(path) {
    if (!isAbsolute4(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace1(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const mod3 = {
    sep: sep4,
    delimiter: delimiter4,
    resolve: resolve4,
    normalize: normalize5,
    isAbsolute: isAbsolute4,
    join: join5,
    relative: relative4,
    toNamespacedPath: toNamespacedPath4,
    dirname: dirname4,
    basename: basename4,
    extname: extname4,
    format: format4,
    parse: parse5,
    fromFileUrl: fromFileUrl4,
    toFileUrl: toFileUrl4
};
const path14 = isWindows1 ? mod2 : mod3;
const { join: join6 , normalize: normalize6  } = path14;
const path15 = isWindows1 ? mod2 : mod3;
const { basename: basename5 , delimiter: delimiter5 , dirname: dirname5 , extname: extname5 , format: format5 , fromFileUrl: fromFileUrl5 , isAbsolute: isAbsolute5 , join: join7 , normalize: normalize7 , parse: parse6 , relative: relative5 , resolve: resolve5 , sep: sep5 , toFileUrl: toFileUrl5 , toNamespacedPath: toNamespacedPath5  } = path15;
const SQLITE3_OPEN_READONLY = 0x00000001;
const SQLITE3_OPEN_READWRITE = 0x00000002;
const SQLITE3_OPEN_CREATE = 0x00000004;
const SQLITE3_OPEN_MEMORY = 0x00000080;
const { sqlite3_errmsg , sqlite3_errstr  } = lib;
const encoder1 = new TextEncoder();
function toCString(str) {
    return encoder1.encode(str + "\0");
}
class SqliteError extends Error {
    name;
    constructor(code = 1, message = "Unknown Error"){
        super(`${code}: ${message}`);
        this.code = code;
        this.name = "SqliteError";
    }
    code;
}
function unwrap(code, db) {
    if (code === 0) return;
    if (code === 21) {
        throw new SqliteError(code, "SQLite3 API misuse");
    } else if (db !== undefined) {
        const errmsg = sqlite3_errmsg(db);
        if (errmsg === null) throw new SqliteError(code);
        throw new Error(Deno.UnsafePointerView.getCString(sqlite3_errmsg(db)));
    } else {
        throw new SqliteError(code, Deno.UnsafePointerView.getCString(sqlite3_errstr(code)));
    }
}
Deno.UnsafePointerView.getArrayBuffer;
const readCstr = Deno.UnsafePointerView.getCString;
const { sqlite3_prepare_v2 , sqlite3_reset , sqlite3_clear_bindings , sqlite3_step , sqlite3_column_count , sqlite3_column_type , sqlite3_column_text , sqlite3_finalize , sqlite3_column_int64 , sqlite3_column_double , sqlite3_column_blob , sqlite3_column_bytes , sqlite3_column_name , sqlite3_expanded_sql , sqlite3_bind_parameter_count , sqlite3_bind_int , sqlite3_bind_int64 , sqlite3_bind_text , sqlite3_bind_blob , sqlite3_bind_double , sqlite3_bind_parameter_index , sqlite3_sql , sqlite3_stmt_readonly , sqlite3_bind_parameter_name , sqlite3_changes , sqlite3_column_int , sqlite3_step_cb  } = lib;
const STATEMENTS = new Map();
const emptyStringBuffer = new Uint8Array(1);
const statementFinalizer = new FinalizationRegistry((ptr)=>{
    if (STATEMENTS.has(ptr)) {
        sqlite3_finalize(ptr);
        STATEMENTS.delete(ptr);
    }
});
function getColumn(handle, i, int64) {
    const ty = sqlite3_column_type(handle, i);
    if (ty === 1 && !int64) return sqlite3_column_int(handle, i);
    switch(ty){
        case 3:
            {
                const ptr = sqlite3_column_text(handle, i);
                if (ptr === null) return null;
                return readCstr(ptr, 0);
            }
        case 1:
            {
                const v = sqlite3_column_int64(handle, i);
                const numv = Number(v);
                if (Number.isSafeInteger(numv)) {
                    return numv;
                } else {
                    return v;
                }
            }
        case 2:
            {
                return sqlite3_column_double(handle, i);
            }
        case 4:
            {
                const ptr = sqlite3_column_blob(handle, i);
                const bytes = sqlite3_column_bytes(handle, i);
                return new Uint8Array(Deno.UnsafePointerView.getArrayBuffer(ptr, bytes).slice(0));
            }
        default:
            {
                return null;
            }
    }
}
class Statement {
    #handle;
    #finalizerToken;
    #bound;
    #hasNoArgs;
    #unsafeConcurrency;
    callback;
    get unsafeHandle() {
        return this.#handle;
    }
    get expandedSql() {
        return readCstr(sqlite3_expanded_sql(this.#handle));
    }
    get sql() {
        return readCstr(sqlite3_sql(this.#handle));
    }
    get readonly() {
        return sqlite3_stmt_readonly(this.#handle) !== 0;
    }
    run(...args) {
        return this.#runWithArgs(...args);
    }
    values(...args) {
        return this.#valuesWithArgs(...args);
    }
    all(...args) {
        return this.#allWithArgs(...args);
    }
    #bindParameterCount;
    get bindParameterCount() {
        return this.#bindParameterCount;
    }
    constructor(db, sql){
        this.db = db;
        this.#bound = false;
        this.#hasNoArgs = false;
        this.callback = false;
        this.#bindRefs = new Set();
        this.#rowObject = {};
        const pHandle = new Uint32Array(2);
        unwrap(sqlite3_prepare_v2(db.unsafeHandle, toCString(sql), sql.length, pHandle, null), db.unsafeHandle);
        this.#handle = Deno.UnsafePointer.create(pHandle[0] + 2 ** 32 * pHandle[1]);
        STATEMENTS.set(this.#handle, db.unsafeHandle);
        this.#unsafeConcurrency = db.unsafeConcurrency;
        this.#finalizerToken = {
            handle: this.#handle
        };
        statementFinalizer.register(this, this.#handle, this.#finalizerToken);
        if ((this.#bindParameterCount = sqlite3_bind_parameter_count(this.#handle)) === 0) {
            this.#hasNoArgs = true;
            this.all = this.#allNoArgs;
            this.values = this.#valuesNoArgs;
            this.run = this.#runNoArgs;
            this.value = this.#valueNoArgs;
            this.get = this.#getNoArgs;
        }
    }
    enableCallback() {
        this.callback = true;
        return this;
    }
    bindParameterName(i) {
        return readCstr(sqlite3_bind_parameter_name(this.#handle, i));
    }
    bindParameterIndex(name) {
        if (name[0] !== ":" && name[0] !== "@" && name[0] !== "$") {
            name = ":" + name;
        }
        return sqlite3_bind_parameter_index(this.#handle, toCString(name));
    }
    #begin() {
        sqlite3_reset(this.#handle);
        if (!this.#bound && !this.#hasNoArgs) {
            sqlite3_clear_bindings(this.#handle);
            this.#bindRefs.clear();
        }
    }
    #bindRefs;
    #bind(i, param) {
        switch(typeof param){
            case "number":
                {
                    if (Number.isInteger(param)) {
                        if (Number.isSafeInteger(param) && param >= -(2 ** 31) && param < 2 ** 31) {
                            unwrap(sqlite3_bind_int(this.#handle, i + 1, param));
                        } else {
                            unwrap(sqlite3_bind_int64(this.#handle, i + 1, BigInt(param)));
                        }
                    } else {
                        unwrap(sqlite3_bind_double(this.#handle, i + 1, param));
                    }
                    break;
                }
            case "string":
                {
                    if (param === "") {
                        unwrap(sqlite3_bind_text(this.#handle, i + 1, emptyStringBuffer, 0, null));
                    } else {
                        const str = new TextEncoder().encode(param);
                        this.#bindRefs.add(str);
                        unwrap(sqlite3_bind_text(this.#handle, i + 1, str, str.byteLength, null));
                    }
                    break;
                }
            case "object":
                {
                    if (param === null) {} else if (param instanceof Uint8Array) {
                        this.#bindRefs.add(param);
                        unwrap(sqlite3_bind_blob(this.#handle, i + 1, param, param.byteLength, null));
                    } else if (param instanceof Date) {
                        const cstring = toCString(param.toISOString());
                        this.#bindRefs.add(cstring);
                        unwrap(sqlite3_bind_text(this.#handle, i + 1, cstring, -1, null));
                    } else {
                        throw new Error(`Value of unsupported type: ${Deno.inspect(param)}`);
                    }
                    break;
                }
            case "bigint":
                {
                    unwrap(sqlite3_bind_int64(this.#handle, i + 1, param));
                    break;
                }
            case "boolean":
                unwrap(sqlite3_bind_int(this.#handle, i + 1, param ? 1 : 0));
                break;
            default:
                {
                    throw new Error(`Value of unsupported type: ${Deno.inspect(param)}`);
                }
        }
    }
    bind(...params) {
        this.#bindAll(params);
        this.#bound = true;
        return this;
    }
    #bindAll(params) {
        if (this.#bound) throw new Error("Statement already bound to values");
        if (typeof params[0] === "object" && params[0] !== null && !(params[0] instanceof Uint8Array) && !(params[0] instanceof Date)) {
            params = params[0];
        }
        if (Array.isArray(params)) {
            for(let i = 0; i < params.length; i++){
                this.#bind(i, params[i]);
            }
        } else {
            for (const [name, param] of Object.entries(params)){
                const i = this.bindParameterIndex(name);
                if (i === 0) {
                    throw new Error(`No such parameter "${name}"`);
                }
                this.#bind(i - 1, param);
            }
        }
    }
    #runNoArgs() {
        this.#begin();
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        const status = step(this.#handle);
        if (status !== 100 && status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(this.#handle);
        return sqlite3_changes(this.db.unsafeHandle);
    }
    #runWithArgs(...params1) {
        this.#begin();
        this.#bindAll(params1);
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        const status = step(this.#handle);
        if (!this.#hasNoArgs && !this.#bound && params1.length) {
            this.#bindRefs.clear();
        }
        if (status !== 100 && status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(this.#handle);
        return sqlite3_changes(this.db.unsafeHandle);
    }
    #valuesNoArgs() {
        this.#begin();
        const columnCount = sqlite3_column_count(this.#handle);
        const result = [];
        const getRowArray = new Function("getColumn", `
      return function(h) {
        return [${Array.from({
            length: columnCount
        }).map((_, i)=>`getColumn(h, ${i}, ${this.db.int64})`).join(", ")}];
      };
      `)(getColumn);
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        let status = step(this.#handle);
        while(status === 100){
            result.push(getRowArray(this.#handle));
            status = step(this.#handle);
        }
        if (status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(this.#handle);
        return result;
    }
    #valuesWithArgs(...params2) {
        this.#begin();
        this.#bindAll(params2);
        const columnCount = sqlite3_column_count(this.#handle);
        const result = [];
        const getRowArray = new Function("getColumn", `
      return function(h) {
        return [${Array.from({
            length: columnCount
        }).map((_, i)=>`getColumn(h, ${i}, ${this.db.int64})`).join(", ")}];
      };
      `)(getColumn);
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        let status = step(this.#handle);
        while(status === 100){
            result.push(getRowArray(this.#handle));
            status = step(this.#handle);
        }
        if (!this.#hasNoArgs && !this.#bound && params2.length) {
            this.#bindRefs.clear();
        }
        if (status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(this.#handle);
        return result;
    }
    #rowObjectFn;
    getRowObject() {
        if (!this.#rowObjectFn || !this.#unsafeConcurrency) {
            const columnNames = this.columnNames();
            const getRowObject = new Function("getColumn", `
        return function(h) {
          return {
            ${columnNames.map((name, i)=>`"${name}": getColumn(h, ${i}, ${this.db.int64})`).join(",\n")}
          };
        };
        `)(getColumn);
            this.#rowObjectFn = getRowObject;
        }
        return this.#rowObjectFn;
    }
    #allNoArgs() {
        this.#begin();
        const getRowObject = this.getRowObject();
        const result = [];
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        let status = step(this.#handle);
        while(status === 100){
            result.push(getRowObject(this.#handle));
            status = step(this.#handle);
        }
        if (status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(this.#handle);
        return result;
    }
    #allWithArgs(...params3) {
        this.#begin();
        this.#bindAll(params3);
        const getRowObject = this.getRowObject();
        const result = [];
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        let status = step(this.#handle);
        while(status === 100){
            result.push(getRowObject(this.#handle));
            status = step(this.#handle);
        }
        if (!this.#hasNoArgs && !this.#bound && params3.length) {
            this.#bindRefs.clear();
        }
        if (status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(this.#handle);
        return result;
    }
    value(...params) {
        const handle = this.#handle;
        const int64 = this.db.int64;
        const arr = new Array(sqlite3_column_count(handle));
        sqlite3_reset(handle);
        if (!this.#hasNoArgs && !this.#bound) {
            sqlite3_clear_bindings(handle);
            this.#bindRefs.clear();
            if (params.length) {
                this.#bindAll(params);
            }
        }
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        const status = step(handle);
        if (!this.#hasNoArgs && !this.#bound && params.length) {
            this.#bindRefs.clear();
        }
        if (status === 100) {
            for(let i = 0; i < arr.length; i++){
                arr[i] = getColumn(handle, i, int64);
            }
            sqlite3_reset(this.#handle);
            return arr;
        } else if (status === 101) {
            return;
        } else {
            unwrap(status, this.db.unsafeHandle);
        }
    }
    #valueNoArgs() {
        const handle = this.#handle;
        const int64 = this.db.int64;
        const cc = sqlite3_column_count(handle);
        const arr = new Array(cc);
        sqlite3_reset(handle);
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        const status = step(handle);
        if (status === 100) {
            for(let i = 0; i < cc; i++){
                arr[i] = getColumn(handle, i, int64);
            }
            sqlite3_reset(this.#handle);
            return arr;
        } else if (status === 101) {
            return;
        } else {
            unwrap(status, this.db.unsafeHandle);
        }
    }
    #columnNames;
    #rowObject;
    columnNames() {
        if (!this.#columnNames || !this.#unsafeConcurrency) {
            const columnCount = sqlite3_column_count(this.#handle);
            const columnNames = new Array(columnCount);
            for(let i = 0; i < columnCount; i++){
                columnNames[i] = readCstr(sqlite3_column_name(this.#handle, i));
            }
            this.#columnNames = columnNames;
            this.#rowObject = {};
            for (const name of columnNames){
                this.#rowObject[name] = undefined;
            }
        }
        return this.#columnNames;
    }
    get(...params) {
        const handle = this.#handle;
        const int64 = this.db.int64;
        const columnNames = this.columnNames();
        const row = {};
        sqlite3_reset(handle);
        if (!this.#hasNoArgs && !this.#bound) {
            sqlite3_clear_bindings(handle);
            this.#bindRefs.clear();
            if (params.length) {
                this.#bindAll(params);
            }
        }
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        const status = step(handle);
        if (!this.#hasNoArgs && !this.#bound && params.length) {
            this.#bindRefs.clear();
        }
        if (status === 100) {
            for(let i = 0; i < columnNames.length; i++){
                row[columnNames[i]] = getColumn(handle, i, int64);
            }
            sqlite3_reset(this.#handle);
            return row;
        } else if (status === 101) {
            return;
        } else {
            unwrap(status, this.db.unsafeHandle);
        }
    }
    #getNoArgs() {
        const handle = this.#handle;
        const int64 = this.db.int64;
        const columnNames = this.columnNames();
        const row = this.#rowObject;
        sqlite3_reset(handle);
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        const status = step(handle);
        if (status === 100) {
            for(let i = 0; i < columnNames?.length; i++){
                row[columnNames[i]] = getColumn(handle, i, int64);
            }
            sqlite3_reset(this.#handle);
            return row;
        } else if (status === 101) {
            return;
        } else {
            unwrap(status, this.db.unsafeHandle);
        }
    }
    finalize() {
        if (!STATEMENTS.has(this.#handle)) return;
        this.#bindRefs.clear();
        statementFinalizer.unregister(this.#finalizerToken);
        STATEMENTS.delete(this.#handle);
        unwrap(sqlite3_finalize(this.#handle));
    }
    toString() {
        return readCstr(sqlite3_expanded_sql(this.#handle));
    }
    *[Symbol.iterator]() {
        this.#begin();
        const getRowObject = this.getRowObject();
        const step = this.callback ? sqlite3_step_cb : sqlite3_step;
        let status = step(this.#handle);
        while(status === 100){
            yield getRowObject(this.#handle);
            status = step(this.#handle);
        }
        if (status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(this.#handle);
    }
    db;
}
const { sqlite3_blob_open , sqlite3_blob_bytes , sqlite3_blob_close , sqlite3_blob_read , sqlite3_blob_write  } = lib;
class SQLBlob {
    #handle;
    constructor(db, options){
        options = Object.assign({
            readonly: true,
            db: "main"
        }, options);
        const pHandle = new Uint32Array(2);
        unwrap(sqlite3_blob_open(db.unsafeHandle, toCString(options.db ?? "main"), toCString(options.table), toCString(options.column), options.row, options.readonly === false ? 1 : 0, pHandle));
        this.#handle = Deno.UnsafePointer.create(pHandle[0] + 2 ** 32 * pHandle[1]);
    }
    get byteLength() {
        return sqlite3_blob_bytes(this.#handle);
    }
    readSync(offset, p) {
        unwrap(sqlite3_blob_read(this.#handle, p, p.byteLength, offset));
    }
    writeSync(offset, p) {
        unwrap(sqlite3_blob_write(this.#handle, p, p.byteLength, offset));
    }
    close() {
        unwrap(sqlite3_blob_close(this.#handle));
    }
    get readable() {
        const length = this.byteLength;
        let offset = 0;
        return new ReadableStream({
            type: "bytes",
            pull: (ctx)=>{
                try {
                    const byob = ctx.byobRequest;
                    if (byob) {
                        const toRead = Math.min(length - offset, byob.view.byteLength);
                        this.readSync(offset, byob.view.subarray(0, toRead));
                        offset += toRead;
                        byob.respond(toRead);
                    } else {
                        const toRead = Math.min(length - offset, ctx.desiredSize || 1024 * 16);
                        if (toRead === 0) {
                            ctx.close();
                            return;
                        }
                        const buffer = new Uint8Array(toRead);
                        this.readSync(offset, buffer);
                        offset += toRead;
                        ctx.enqueue(buffer);
                    }
                } catch (e) {
                    ctx.error(e);
                    ctx.byobRequest?.respond(0);
                }
            }
        });
    }
    get writable() {
        const length = this.byteLength;
        let offset = 0;
        return new WritableStream({
            write: (chunk, ctx)=>{
                if (offset + chunk.byteLength > length) {
                    ctx.error(new Error("Write exceeds blob length"));
                    return;
                }
                this.writeSync(offset, chunk);
                offset += chunk.byteLength;
            }
        });
    }
    *[Symbol.iterator]() {
        const length = this.byteLength;
        let offset = 0;
        while(offset < length){
            const toRead = Math.min(length - offset, 1024 * 16);
            const buffer = new Uint8Array(toRead);
            this.readSync(offset, buffer);
            offset += toRead;
            yield buffer;
        }
    }
    [Symbol.for("Deno.customInspect")]() {
        return `SQLite3.Blob(0x${this.byteLength.toString(16)})`;
    }
}
const { sqlite3_open_v2 , sqlite3_close_v2 , sqlite3_changes: sqlite3_changes1 , sqlite3_total_changes , sqlite3_last_insert_rowid , sqlite3_get_autocommit , sqlite3_exec , sqlite3_free , sqlite3_libversion , sqlite3_sourceid , sqlite3_complete , sqlite3_finalize: sqlite3_finalize1 , sqlite3_result_blob , sqlite3_result_double , sqlite3_result_error , sqlite3_result_int64 , sqlite3_result_null , sqlite3_result_text , sqlite3_value_blob , sqlite3_value_bytes , sqlite3_value_double , sqlite3_value_int64 , sqlite3_value_text , sqlite3_value_type , sqlite3_create_function , sqlite3_result_int , sqlite3_aggregate_context , sqlite3_enable_load_extension , sqlite3_load_extension  } = lib;
readCstr(sqlite3_libversion());
readCstr(sqlite3_sourceid());
class Database {
    #path;
    #handle;
    #open = true;
    #enableLoadExtension = false;
    int64;
    unsafeConcurrency;
    get open() {
        return this.#open;
    }
    get unsafeHandle() {
        return this.#handle;
    }
    get path() {
        return this.#path;
    }
    get changes() {
        return sqlite3_changes1(this.#handle);
    }
    get totalChanges() {
        return sqlite3_total_changes(this.#handle);
    }
    get lastInsertRowId() {
        return Number(sqlite3_last_insert_rowid(this.#handle));
    }
    get autocommit() {
        return sqlite3_get_autocommit(this.#handle) === 1;
    }
    get inTransaction() {
        return this.#open && !this.autocommit;
    }
    get enableLoadExtension() {
        return this.#enableLoadExtension;
    }
    set enableLoadExtension(enabled) {
        const result = sqlite3_enable_load_extension(this.#handle, Number(enabled));
        unwrap(result, this.#handle);
        this.#enableLoadExtension = enabled;
    }
    constructor(path, options = {}){
        this.#path = path instanceof URL ? fromFileUrl5(path) : path;
        let flags = 0;
        this.int64 = options.int64 ?? false;
        this.unsafeConcurrency = options.unsafeConcurrency ?? false;
        if (options.flags !== undefined) {
            flags = options.flags;
        } else {
            if (options.memory) {
                flags |= SQLITE3_OPEN_MEMORY;
            }
            if (options.readonly ?? false) {
                flags |= SQLITE3_OPEN_READONLY;
            } else {
                flags |= SQLITE3_OPEN_READWRITE;
            }
            if ((options.create ?? true) && !options.readonly) {
                flags |= SQLITE3_OPEN_CREATE;
            }
        }
        const pHandle = new Uint32Array(2);
        const result = sqlite3_open_v2(toCString(this.#path), pHandle, flags, null);
        this.#handle = Deno.UnsafePointer.create(pHandle[0] + 2 ** 32 * pHandle[1]);
        if (result !== 0) sqlite3_close_v2(this.#handle);
        unwrap(result);
        if (options.enableLoadExtension) {
            this.enableLoadExtension = options.enableLoadExtension;
        }
    }
    prepare(sql) {
        return new Statement(this, sql);
    }
    openBlob(options) {
        return new SQLBlob(this, options);
    }
    exec(sql, ...params) {
        if (params.length === 0) {
            const pErr = new Uint32Array(2);
            sqlite3_exec(this.#handle, toCString(sql), null, null, new Uint8Array(pErr.buffer));
            const errPtr = Deno.UnsafePointer.create(pErr[0] + 2 ** 32 * pErr[1]);
            if (errPtr !== null) {
                const err = readCstr(errPtr);
                sqlite3_free(errPtr);
                throw new Error(err);
            }
            return sqlite3_changes1(this.#handle);
        }
        const stmt = this.prepare(sql);
        stmt.run(...params);
        return sqlite3_changes1(this.#handle);
    }
    run(sql, ...params) {
        return this.exec(sql, ...params);
    }
    transaction(fn) {
        const controller = getController(this);
        const properties = {
            default: {
                value: wrapTransaction(fn, this, controller.default)
            },
            deferred: {
                value: wrapTransaction(fn, this, controller.deferred)
            },
            immediate: {
                value: wrapTransaction(fn, this, controller.immediate)
            },
            exclusive: {
                value: wrapTransaction(fn, this, controller.exclusive)
            },
            database: {
                value: this,
                enumerable: true
            }
        };
        Object.defineProperties(properties.default.value, properties);
        Object.defineProperties(properties.deferred.value, properties);
        Object.defineProperties(properties.immediate.value, properties);
        Object.defineProperties(properties.exclusive.value, properties);
        return properties.default.value;
    }
    #callbacks = new Set();
    function(name, fn, options) {
        const cb = new Deno.UnsafeCallback({
            parameters: [
                "pointer",
                "i32",
                "pointer"
            ],
            result: "void"
        }, (ctx, nArgs, pArgs)=>{
            const argptr = new Deno.UnsafePointerView(pArgs);
            const args = [];
            for(let i = 0; i < nArgs; i++){
                const arg = Deno.UnsafePointer.create(Number(argptr.getBigUint64(i * 8)));
                const type = sqlite3_value_type(arg);
                switch(type){
                    case 1:
                        args.push(sqlite3_value_int64(arg));
                        break;
                    case 2:
                        args.push(sqlite3_value_double(arg));
                        break;
                    case 3:
                        args.push(new TextDecoder().decode(new Uint8Array(Deno.UnsafePointerView.getArrayBuffer(sqlite3_value_text(arg), sqlite3_value_bytes(arg)))));
                        break;
                    case 4:
                        args.push(new Uint8Array(Deno.UnsafePointerView.getArrayBuffer(sqlite3_value_blob(arg), sqlite3_value_bytes(arg))));
                        break;
                    case 5:
                        args.push(null);
                        break;
                    default:
                        throw new Error(`Unknown type: ${type}`);
                }
            }
            let result;
            try {
                result = fn(...args);
            } catch (err) {
                const buf = new TextEncoder().encode(err.message);
                sqlite3_result_error(ctx, buf, buf.byteLength);
                return;
            }
            if (result === undefined || result === null) {
                sqlite3_result_null(ctx);
            } else if (typeof result === "boolean") {
                sqlite3_result_int(ctx, result ? 1 : 0);
            } else if (typeof result === "number") {
                if (Number.isSafeInteger(result)) sqlite3_result_int64(ctx, result);
                else sqlite3_result_double(ctx, result);
            } else if (typeof result === "bigint") {
                sqlite3_result_int64(ctx, result);
            } else if (typeof result === "string") {
                const buffer = new TextEncoder().encode(result);
                sqlite3_result_text(ctx, buffer, buffer.byteLength, 0);
            } else if (result instanceof Uint8Array) {
                sqlite3_result_blob(ctx, result, result.length, -1);
            } else {
                const buffer = new TextEncoder().encode(`Invalid return value: ${Deno.inspect(result)}`);
                sqlite3_result_error(ctx, buffer, buffer.byteLength);
            }
        });
        let flags = 1;
        if (options?.deterministic) {
            flags |= 0x000000800;
        }
        if (options?.directOnly) {
            flags |= 0x000080000;
        }
        if (options?.subtype) {
            flags |= 0x000100000;
        }
        if (options?.directOnly) {
            flags |= 0x000200000;
        }
        const err = sqlite3_create_function(this.#handle, toCString(name), options?.varargs ? -1 : fn.length, flags, null, cb.pointer, null, null);
        unwrap(err, this.#handle);
        this.#callbacks.add(cb);
    }
    aggregate(name, options) {
        const contexts = new Map();
        const cb = new Deno.UnsafeCallback({
            parameters: [
                "pointer",
                "i32",
                "pointer"
            ],
            result: "void"
        }, (ctx, nArgs, pArgs)=>{
            const aggrCtx = sqlite3_aggregate_context(ctx, 8);
            const aggrPtr = Deno.UnsafePointer.value(aggrCtx);
            let aggregate;
            if (contexts.has(aggrPtr)) {
                aggregate = contexts.get(aggrPtr);
            } else {
                aggregate = typeof options.start === "function" ? options.start() : options.start;
                contexts.set(aggrPtr, aggregate);
            }
            const argptr = new Deno.UnsafePointerView(pArgs);
            const args = [];
            for(let i = 0; i < nArgs; i++){
                const arg = Deno.UnsafePointer.create(Number(argptr.getBigUint64(i * 8)));
                const type = sqlite3_value_type(arg);
                switch(type){
                    case 1:
                        args.push(sqlite3_value_int64(arg));
                        break;
                    case 2:
                        args.push(sqlite3_value_double(arg));
                        break;
                    case 3:
                        args.push(new TextDecoder().decode(new Uint8Array(Deno.UnsafePointerView.getArrayBuffer(sqlite3_value_text(arg), sqlite3_value_bytes(arg)))));
                        break;
                    case 4:
                        args.push(new Uint8Array(Deno.UnsafePointerView.getArrayBuffer(sqlite3_value_blob(arg), sqlite3_value_bytes(arg))));
                        break;
                    case 5:
                        args.push(null);
                        break;
                    default:
                        throw new Error(`Unknown type: ${type}`);
                }
            }
            let result;
            try {
                result = options.step(aggregate, ...args);
            } catch (err) {
                const buf = new TextEncoder().encode(err.message);
                sqlite3_result_error(ctx, buf, buf.byteLength);
                return;
            }
            contexts.set(aggrPtr, result);
        });
        const cbFinal = new Deno.UnsafeCallback({
            parameters: [
                "pointer"
            ],
            result: "void"
        }, (ctx)=>{
            const aggrCtx = sqlite3_aggregate_context(ctx, 0);
            const aggrPtr = Deno.UnsafePointer.value(aggrCtx);
            const aggregate = contexts.get(aggrPtr);
            contexts.delete(aggrPtr);
            let result;
            try {
                result = options.final ? options.final(aggregate) : aggregate;
            } catch (err) {
                const buf = new TextEncoder().encode(err.message);
                sqlite3_result_error(ctx, buf, buf.byteLength);
                return;
            }
            if (result === undefined || result === null) {
                sqlite3_result_null(ctx);
            } else if (typeof result === "boolean") {
                sqlite3_result_int(ctx, result ? 1 : 0);
            } else if (typeof result === "number") {
                if (Number.isSafeInteger(result)) sqlite3_result_int64(ctx, result);
                else sqlite3_result_double(ctx, result);
            } else if (typeof result === "bigint") {
                sqlite3_result_int64(ctx, result);
            } else if (typeof result === "string") {
                const buffer = new TextEncoder().encode(result);
                sqlite3_result_text(ctx, buffer, buffer.byteLength, 0);
            } else if (result instanceof Uint8Array) {
                sqlite3_result_blob(ctx, result, result.length, -1);
            } else {
                const buffer = new TextEncoder().encode(`Invalid return value: ${Deno.inspect(result)}`);
                sqlite3_result_error(ctx, buffer, buffer.byteLength);
            }
        });
        let flags = 1;
        if (options?.deterministic) {
            flags |= 0x000000800;
        }
        if (options?.directOnly) {
            flags |= 0x000080000;
        }
        if (options?.subtype) {
            flags |= 0x000100000;
        }
        if (options?.directOnly) {
            flags |= 0x000200000;
        }
        const err = sqlite3_create_function(this.#handle, toCString(name), options?.varargs ? -1 : options.step.length - 1, flags, null, null, cb.pointer, cbFinal.pointer);
        unwrap(err, this.#handle);
        this.#callbacks.add(cb);
        this.#callbacks.add(cbFinal);
    }
    loadExtension(file, entryPoint) {
        if (!this.enableLoadExtension) {
            throw new Error("Extension loading is not enabled");
        }
        const pzErrMsg = new Uint32Array(2);
        const result = sqlite3_load_extension(this.#handle, toCString(file), entryPoint ? toCString(entryPoint) : null, pzErrMsg);
        const pzErrPtr = Deno.UnsafePointer.create(pzErrMsg[0] + 2 ** 32 * pzErrMsg[1]);
        if (pzErrPtr !== null) {
            const pzErr = readCstr(pzErrPtr);
            sqlite3_free(pzErrPtr);
            throw new Error(pzErr);
        }
        unwrap(result, this.#handle);
    }
    close() {
        if (!this.#open) return;
        for (const [stmt, db] of STATEMENTS){
            if (db === this.#handle) {
                sqlite3_finalize1(stmt);
                STATEMENTS.delete(stmt);
            }
        }
        for (const cb of this.#callbacks){
            cb.close();
        }
        unwrap(sqlite3_close_v2(this.#handle));
        this.#open = false;
    }
    [Symbol.for("Deno.customInspect")]() {
        return `SQLite3.Database { path: ${this.path} }`;
    }
}
const controllers = new WeakMap();
const getController = (db)=>{
    let controller = controllers.get(db);
    if (!controller) {
        const shared = {
            commit: db.prepare("COMMIT"),
            rollback: db.prepare("ROLLBACK"),
            savepoint: db.prepare("SAVEPOINT `\t_bs3.\t`"),
            release: db.prepare("RELEASE `\t_bs3.\t`"),
            rollbackTo: db.prepare("ROLLBACK TO `\t_bs3.\t`")
        };
        controllers.set(db, controller = {
            default: Object.assign({
                begin: db.prepare("BEGIN")
            }, shared),
            deferred: Object.assign({
                begin: db.prepare("BEGIN DEFERRED")
            }, shared),
            immediate: Object.assign({
                begin: db.prepare("BEGIN IMMEDIATE")
            }, shared),
            exclusive: Object.assign({
                begin: db.prepare("BEGIN EXCLUSIVE")
            }, shared)
        });
    }
    return controller;
};
const wrapTransaction = (fn, db, { begin , commit , rollback , savepoint , release , rollbackTo  })=>function sqliteTransaction() {
        const { apply  } = Function.prototype;
        let before, after, undo;
        if (db.inTransaction) {
            before = savepoint;
            after = release;
            undo = rollbackTo;
        } else {
            before = begin;
            after = commit;
            undo = rollback;
        }
        before.run();
        try {
            const result = apply.call(fn, this, arguments);
            after.run();
            return result;
        } catch (ex) {
            if (!db.autocommit) {
                undo.run();
                if (undo !== rollback) after.run();
            }
            throw ex;
        }
    };
const osType2 = (()=>{
    const { Deno: Deno1  } = globalThis;
    if (typeof Deno1?.build?.os === "string") {
        return Deno1.build.os;
    }
    const { navigator  } = globalThis;
    if (navigator?.appVersion?.includes?.("Win")) {
        return "windows";
    }
    return "linux";
})();
const isWindows2 = osType2 === "windows";
const CHAR_FORWARD_SLASH2 = 47;
function assertPath2(path) {
    if (typeof path !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
    }
}
function isPosixPathSeparator2(code) {
    return code === 47;
}
function isPathSeparator2(code) {
    return isPosixPathSeparator2(code) || code === 92;
}
function isWindowsDeviceRoot2(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString2(path, allowAboveRoot, separator, isPathSeparator) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path.length; i <= len; ++i){
        if (i < len) code = path.charCodeAt(i);
        else if (isPathSeparator(code)) break;
        else code = CHAR_FORWARD_SLASH2;
        if (isPathSeparator(code)) {
            if (lastSlash === i - 1 || dots === 1) {} else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
                else res = path.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
function _format2(sep, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (base === sep) return dir;
    if (dir === pathObject.root) return dir + base;
    return dir + sep + base;
}
const WHITESPACE_ENCODINGS2 = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace2(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS2[c] ?? c;
    });
}
function lastPathSegment1(path, isSep, start = 0) {
    let matchedNonSeparator = false;
    let end = path.length;
    for(let i = path.length - 1; i >= start; --i){
        if (isSep(path.charCodeAt(i))) {
            if (matchedNonSeparator) {
                start = i + 1;
                break;
            }
        } else if (!matchedNonSeparator) {
            matchedNonSeparator = true;
            end = i + 1;
        }
    }
    return path.slice(start, end);
}
function stripTrailingSeparators1(segment, isSep) {
    if (segment.length <= 1) {
        return segment;
    }
    let end = segment.length;
    for(let i = segment.length - 1; i > 0; i--){
        if (isSep(segment.charCodeAt(i))) {
            end = i;
        } else {
            break;
        }
    }
    return segment.slice(0, end);
}
function stripSuffix1(name, suffix) {
    if (suffix.length >= name.length) {
        return name;
    }
    const lenDiff = name.length - suffix.length;
    for(let i = suffix.length - 1; i >= 0; --i){
        if (name.charCodeAt(lenDiff + i) !== suffix.charCodeAt(i)) {
            return name;
        }
    }
    return name.slice(0, -suffix.length);
}
class DenoStdInternalError2 extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert2(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError2(msg);
    }
}
const sep6 = "\\";
const delimiter6 = ";";
function resolve6(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        const { Deno: Deno1  } = globalThis;
        if (i >= 0) {
            path = pathSegments[i];
        } else if (!resolvedDevice) {
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path = Deno1.cwd();
        } else {
            if (typeof Deno1?.env?.get !== "function" || typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
            if (path === undefined || path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path = `${resolvedDevice}\\`;
            }
        }
        assertPath2(path);
        const len = path.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator2(code)) {
                isAbsolute = true;
                if (isPathSeparator2(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator2(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator2(path.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator2(path.charCodeAt(j))) break;
                            }
                            if (j === len) {
                                device = `\\\\${firstPart}\\${path.slice(last)}`;
                                rootEnd = j;
                            } else if (j !== last) {
                                device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot2(code)) {
                if (path.charCodeAt(1) === 58) {
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator2(path.charCodeAt(2))) {
                            isAbsolute = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator2(code)) {
            rootEnd = 1;
            isAbsolute = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    resolvedTail = normalizeString2(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator2);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize8(path) {
    assertPath2(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator2(code)) {
            isAbsolute = true;
            if (isPathSeparator2(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator2(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator2(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator2(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return `\\\\${firstPart}\\${path.slice(last)}\\`;
                        } else if (j !== last) {
                            device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot2(code)) {
            if (path.charCodeAt(1) === 58) {
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator2(path.charCodeAt(2))) {
                        isAbsolute = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator2(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString2(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator2);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute) tail = ".";
    if (tail.length > 0 && isPathSeparator2(path.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
function isAbsolute6(path) {
    assertPath2(path);
    const len = path.length;
    if (len === 0) return false;
    const code = path.charCodeAt(0);
    if (isPathSeparator2(code)) {
        return true;
    } else if (isWindowsDeviceRoot2(code)) {
        if (len > 2 && path.charCodeAt(1) === 58) {
            if (isPathSeparator2(path.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join8(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < pathsCount; ++i){
        const path = paths[i];
        assertPath2(path);
        if (path.length > 0) {
            if (joined === undefined) joined = firstPart = path;
            else joined += `\\${path}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert2(firstPart != null);
    if (isPathSeparator2(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator2(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator2(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator2(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize8(joined);
}
function relative6(from, to) {
    assertPath2(from);
    assertPath2(to);
    if (from === to) return "";
    const fromOrig = resolve6(from);
    const toOrig = resolve6(to);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to = toOrig.toLowerCase();
    if (from === to) return "";
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 92) break;
    }
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== 92) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 0;
    let toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 92) break;
    }
    for(; toEnd - 1 > toStart; --toEnd){
        if (to.charCodeAt(toEnd - 1) !== 92) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 92) {
                    return toOrig.slice(toStart + i + 1);
                } else if (i === 2) {
                    return toOrig.slice(toStart + i);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 92) {
                    lastCommonSep = i;
                } else if (i === 2) {
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 92) lastCommonSep = i;
    }
    if (i !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 92) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === 92) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
function toNamespacedPath6(path) {
    if (typeof path !== "string") return path;
    if (path.length === 0) return "";
    const resolvedPath = resolve6(path);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot2(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path;
}
function dirname6(path) {
    assertPath2(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator2(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator2(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator2(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator2(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator2(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return path;
                        }
                        if (j !== last) {
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot2(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator2(path.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator2(code)) {
        return path;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator2(path.charCodeAt(i))) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return stripTrailingSeparators1(path.slice(0, end), isPosixPathSeparator2);
}
function basename6(path, suffix = "") {
    assertPath2(path);
    if (path.length === 0) return path;
    if (typeof suffix !== "string") {
        throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
    }
    let start = 0;
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot2(drive)) {
            if (path.charCodeAt(1) === 58) start = 2;
        }
    }
    const lastSegment = lastPathSegment1(path, isPathSeparator2, start);
    const strippedSegment = stripTrailingSeparators1(lastSegment, isPathSeparator2);
    return suffix ? stripSuffix1(strippedSegment, suffix) : strippedSegment;
}
function extname6(path) {
    assertPath2(path);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path.length >= 2 && path.charCodeAt(1) === 58 && isWindowsDeviceRoot2(path.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path.length - 1; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPathSeparator2(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format6(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format2("\\", pathObject);
}
function parse7(path) {
    assertPath2(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator2(code)) {
            rootEnd = 1;
            if (isPathSeparator2(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator2(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator2(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator2(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot2(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator2(path.charCodeAt(2))) {
                        if (len === 3) {
                            ret.root = ret.dir = path;
                            ret.base = "\\";
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    ret.root = ret.dir = path;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator2(code)) {
        ret.root = ret.dir = path;
        ret.base = "\\";
        return ret;
    }
    if (rootEnd > 0) ret.root = path.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= rootEnd; --i){
        code = path.charCodeAt(i);
        if (isPathSeparator2(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            ret.base = ret.name = path.slice(startPart, end);
        }
    } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
        ret.ext = path.slice(startDot, end);
    }
    ret.base = ret.base || "\\";
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
function fromFileUrl6(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    let path = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        path = `\\\\${url.hostname}${path}`;
    }
    return path;
}
function toFileUrl6(path) {
    if (!isAbsolute6(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace2(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const mod4 = {
    sep: sep6,
    delimiter: delimiter6,
    resolve: resolve6,
    normalize: normalize8,
    isAbsolute: isAbsolute6,
    join: join8,
    relative: relative6,
    toNamespacedPath: toNamespacedPath6,
    dirname: dirname6,
    basename: basename6,
    extname: extname6,
    format: format6,
    parse: parse7,
    fromFileUrl: fromFileUrl6,
    toFileUrl: toFileUrl6
};
const sep7 = "/";
const delimiter7 = ":";
function resolve7(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            const { Deno: Deno1  } = globalThis;
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
        }
        assertPath2(path);
        if (path.length === 0) {
            continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute = isPosixPathSeparator2(path.charCodeAt(0));
    }
    resolvedPath = normalizeString2(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator2);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize9(path) {
    assertPath2(path);
    if (path.length === 0) return ".";
    const isAbsolute = isPosixPathSeparator2(path.charCodeAt(0));
    const trailingSeparator = isPosixPathSeparator2(path.charCodeAt(path.length - 1));
    path = normalizeString2(path, !isAbsolute, "/", isPosixPathSeparator2);
    if (path.length === 0 && !isAbsolute) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute) return `/${path}`;
    return path;
}
function isAbsolute7(path) {
    assertPath2(path);
    return path.length > 0 && isPosixPathSeparator2(path.charCodeAt(0));
}
function join9(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path = paths[i];
        assertPath2(path);
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `/${path}`;
        }
    }
    if (!joined) return ".";
    return normalize9(joined);
}
function relative7(from, to) {
    assertPath2(from);
    assertPath2(to);
    if (from === to) return "";
    from = resolve7(from);
    to = resolve7(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (!isPosixPathSeparator2(from.charCodeAt(fromStart))) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (!isPosixPathSeparator2(to.charCodeAt(toStart))) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (isPosixPathSeparator2(to.charCodeAt(toStart + i))) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (isPosixPathSeparator2(from.charCodeAt(fromStart + i))) {
                    lastCommonSep = i;
                } else if (i === 0) {
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (isPosixPathSeparator2(fromCode)) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || isPosixPathSeparator2(from.charCodeAt(i))) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (isPosixPathSeparator2(to.charCodeAt(toStart))) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath7(path) {
    return path;
}
function dirname7(path) {
    if (path.length === 0) return ".";
    let end = -1;
    let matchedNonSeparator = false;
    for(let i = path.length - 1; i >= 1; --i){
        if (isPosixPathSeparator2(path.charCodeAt(i))) {
            if (matchedNonSeparator) {
                end = i;
                break;
            }
        } else {
            matchedNonSeparator = true;
        }
    }
    if (end === -1) {
        return isPosixPathSeparator2(path.charCodeAt(0)) ? "/" : ".";
    }
    return stripTrailingSeparators1(path.slice(0, end), isPosixPathSeparator2);
}
function basename7(path, suffix = "") {
    assertPath2(path);
    if (path.length === 0) return path;
    if (typeof suffix !== "string") {
        throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
    }
    const lastSegment = lastPathSegment1(path, isPosixPathSeparator2);
    const strippedSegment = stripTrailingSeparators1(lastSegment, isPosixPathSeparator2);
    return suffix ? stripSuffix1(strippedSegment, suffix) : strippedSegment;
}
function extname7(path) {
    assertPath2(path);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i = path.length - 1; i >= 0; --i){
        const code = path.charCodeAt(i);
        if (isPosixPathSeparator2(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format7(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format2("/", pathObject);
}
function parse8(path) {
    assertPath2(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path.length === 0) return ret;
    const isAbsolute = isPosixPathSeparator2(path.charCodeAt(0));
    let start;
    if (isAbsolute) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPosixPathSeparator2(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute) {
                ret.base = ret.name = path.slice(1, end);
            } else {
                ret.base = ret.name = path.slice(startPart, end);
            }
        }
        ret.base = ret.base || "/";
    } else {
        if (startPart === 0 && isAbsolute) {
            ret.name = path.slice(1, startDot);
            ret.base = path.slice(1, end);
        } else {
            ret.name = path.slice(startPart, startDot);
            ret.base = path.slice(startPart, end);
        }
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0) {
        ret.dir = stripTrailingSeparators1(path.slice(0, startPart - 1), isPosixPathSeparator2);
    } else if (isAbsolute) ret.dir = "/";
    return ret;
}
function fromFileUrl7(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl7(path) {
    if (!isAbsolute7(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace2(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const mod5 = {
    sep: sep7,
    delimiter: delimiter7,
    resolve: resolve7,
    normalize: normalize9,
    isAbsolute: isAbsolute7,
    join: join9,
    relative: relative7,
    toNamespacedPath: toNamespacedPath7,
    dirname: dirname7,
    basename: basename7,
    extname: extname7,
    format: format7,
    parse: parse8,
    fromFileUrl: fromFileUrl7,
    toFileUrl: toFileUrl7
};
const path16 = isWindows2 ? mod4 : mod5;
const { join: join10 , normalize: normalize10  } = path16;
const path17 = isWindows2 ? mod4 : mod5;
const { basename: basename8 , delimiter: delimiter8 , dirname: dirname8 , extname: extname8 , format: format8 , fromFileUrl: fromFileUrl8 , isAbsolute: isAbsolute8 , join: join11 , normalize: normalize11 , parse: parse9 , relative: relative8 , resolve: resolve8 , sep: sep8 , toFileUrl: toFileUrl8 , toNamespacedPath: toNamespacedPath8  } = path17;
const sqlCreateSpotprice = "CREATE TABLE IF NOT EXISTS spotprice (id INTEGER PRIMARY KEY AUTOINCREMENT, country VARCHAR(3), area VARCHAR(3), spotprice DOUBLE, date TEXT, period INT)";
const sqlCreateExchangeRate = "CREATE TABLE IF NOT EXISTS exchangerate (id INTEGER PRIMARY KEY AUTOINCREMENT, currency VARCHAR(3), value DOUBLE, date TEXT, period INT);";
const sqlCreateGeneration = "CREATE TABLE IF NOT EXISTS generation (id INTEGER PRIMARY KEY AUTOINCREMENT, area VARCHAR(16), period INT, value DOUBLE, psr TEXT, interval TEXT);";
const sqlCreateLoad = "CREATE TABLE IF NOT EXISTS load (id INTEGER PRIMARY KEY AUTOINCREMENT, area VARCHAR(16), period INT, value DOUBLE, interval TEXT);";
const sqlCreateUpdates = "CREATE TABLE IF NOT EXISTS updates (name TEXT, applied INT);";
const sqlCreatePsr = "CREATE TABLE IF NOT EXISTS psr (psr TEXT, psr_group TEXT);";
`
WITH 
distinct_generation AS (
    SELECT 
        generation.area,
        generation.period,
        generation.interval,
        generation.consumption,
        generation.value,
        generation.psr,
        ROW_NUMBER() OVER(PARTITION BY generation.area, generation.interval,generation.psr,generation.consumption ORDER BY generation.period DESC) AS row_number
    FROM
        generation
    WHERE
        period >= (?)
),
generation_per_psr_group AS (
    SELECT 
        g.area,
        MIN(g.period) as period,
        g.interval,
        psr.psr_group,
        g.consumption,
        SUM(CASE WHEN g.consumption THEN 0-g.value ELSE g.value END) as value
    FROM
        distinct_generation as g
        LEFT JOIN psr ON g.psr = psr.psr
    WHERE
        row_number = 1
    GROUP BY
        g.area,
        g.interval,
        g.consumption,
        psr.psr_group
),
generation_total AS (
    SELECT 
        gen.area,
        MIN(gen.period) as period,
        gen.interval,
        SUM(gen.value) as sum_generation_value,
        MAX(gen.value) as max_generation_value,
        FIRST_VALUE(gen.psr_group) OVER (
            PARTITION BY       
                gen.area,
                gen.interval
            ORDER BY 
                SUM(gen.value) DESC
        ) as primary_psr_group
    FROM
        generation_per_psr_group as gen
    GROUP BY
        gen.area,
        gen.interval
)
SELECT 
    generation_total.area,
    generation_total.period,
    generation_total.interval,
    generation_total.primary_psr_group,
    generation_total.max_generation_value as primary_psr_group_generation,
    generation_total.sum_generation_value as generation_total,
    [load].value as load_total,
    generation_total.sum_generation_value-[load].value as net_generation
FROM
    generation_total
    LEFT JOIN [load]
        ON 
            generation_total.area = [load].area 
            AND generation_total.period = [load].period 
            AND generation_total.interval = [load].interval`;
`
    WITH 
    distinct_generation AS (
        SELECT 
            DISTINCT
            generation.area,
            generation.period,
            generation.interval,
            generation.consumption,
            generation.value,
            generation.psr
        FROM
            generation
        WHERE
            area = (?)
            AND period >= (?)
            AND period <=(?)
    ),
    generation_per_psr_group AS (
        SELECT 
            g.area,
            g.period,
            g.interval,
            psr.psr_group,
            SUM(CASE WHEN g.consumption THEN 0-g.value ELSE g.value END) as value
        FROM
            distinct_generation as g
            LEFT JOIN psr ON g.psr = psr.psr
        GROUP BY
            g.area,
            g.period,
            g.interval,
            psr.psr_group
    ),
    generation_total AS (
        SELECT 
            gen.area,
            gen.period,
            gen.interval,
            SUM(gen.value) as sum_generation_value
        FROM
            generation_per_psr_group as gen
        GROUP BY
            gen.area,
            gen.period,
            gen.interval
    ),
    generation_and_load AS (
    SELECT 
        generation_total.period,
        generation_total.sum_generation_value-[load].value as net_generation
    FROM
        generation_total
        INNER JOIN [load]
            ON 
                generation_total.area = [load].area 
                AND generation_total.period = [load].period 
                AND generation_total.interval = [load].interval)
    SELECT
        *
    FROM
        generation_and_load`;
`
    SELECT 
        [[groupby]] as grouping,
        AVG(spotprice.spotprice) as avg,
        min(spotprice.spotprice) as min,
        max(spotprice.spotprice) as max
    FROM
        spotprice
    WHERE 
        [[areaField]]=(?) 
        AND spotprice.period >= (?) 
        AND spotprice.period <= (?)
        AND spotprice.interval = (?)
    GROUP BY
        [[groupby]];`;
`
    SELECT
        DISTINCT
        country,
        period,
        interval,
        AVG(spotprice)
    FROM
        spotprice
    WHERE
        period = (?)
    GROUP BY
        country,
        period,
        interval`;
`
    SELECT
        area,
        period,
        interval,
        spotprice
    FROM
        spotprice
    WHERE
        period = (?)
    GROUP BY
        area,
        period,
        interval,
        spotprice`;
`
WITH er AS (
    SELECT
        e.value
    FROM
        exchangerate e
    WHERE
        currency=(?)
    ORDER BY
        period DESC
    LIMIT
        1
)
SELECT 
    [[groupby]],
    MIN(spotprice)*er.value as avg,
    MAX(spotprice)*er.value as min,
    avg(spotprice)*er.value as max
FROM 
    spotprice 
    LEFT JOIN er 
WHERE
    [[areaField]]=(?)
    AND spotprice.period>=(?)
    AND spotprice.period<=(?)
    AND spotprice.interval=(?)
GROUP BY
    [[groupby]];
`;
`
    SELECT 
        DISTINCT
        period,
        value,
        interval
    FROM
        load
    WHERE 
        area=(?) 
        AND period >= (?) 
        AND period < (?)
        AND interval = (?);`;
`
WITH 
distinct_generation AS (
    SELECT 
        DISTINCT
        generation.area,
        generation.period,
        generation.interval,
        generation.consumption,
        generation.value,
        generation.psr
    FROM
        generation
)
        SELECT 
            period,
            psr_group,
            SUM(CASE WHEN consumption THEN 0-value ELSE value END) as value,
            consumption,
            COUNT(distinct_generation.psr) as count_psr
        FROM
            distinct_generation
            LEFT JOIN psr ON psr.psr = distinct_generation.psr
        WHERE 
            area=(?) 
            AND period >= (?) 
            AND period < (?)
            AND interval = (?)
        GROUP BY
            period,
            psr_group,
            interval,
            consumption;`;
`
SELECT
    DISTINCT
    e.currency,
    e.value
FROM
    exchangerate e
WHERE
    period=(SELECT MAX(period) FROM exchangerate);`;
const sqlAppliedUpdates = `SELECT
    name,
    applied
FROM
    updates;`;
`
SELECT
    outage.start_date,
    outage.end_date,
    outage.resource_name,
    outage.business_type,
    outage.location,
    outage.country,
    outage.psr_name,
    outage.psr_nominal_power,
    outage.psr_nominal_power_unit,
    outage.psr_type,
    outage.reason_code,
    outage.reason_text,
    outage_availability.*
FROM
    outage
    LEFT JOIN outage_availability ON outage.mrid = outage_availability.mrid AND outage_availability.start_date < (?) AND outage_availability.end_date > (?)
WHERE
    country=(?)
    AND outage.start_date < (?)
    AND outage.end_date > (?)
`;
`
SELECT
    outage.start_date,
    outage.end_date,
    outage.resource_name,
    outage.business_type,
    outage.location,
    outage.country,
    outage.psr_name,
    outage.psr_nominal_power,
    outage.psr_nominal_power_unit,
    outage.psr_type,
    outage.reason_code,
    outage.reason_text
FROM
    outage
WHERE
    country=(?)
    AND outage.start_date > (?)
ORDER BY
    start_date ASC
`;
let level = "normal";
const log = (type, t)=>{
    if (type == "debug" && level != "debug") return;
    let fn;
    if (type === "log") fn = console.log;
    else if (type === "info") fn = console.info;
    else if (type === "error") fn = console.error;
    else if (type === "debug") fn = console.debug;
    else throw new Error("Invalid log type, cannot log: " + t);
    if (fn) {
        if (false) {
            fn(new Date().toLocaleString("sv-SE"), "Backend:", t);
        } else {
            fn(t);
        }
    }
};
const MemCache = new Map();
const InvalidateCache = (realm)=>{
    if (MemCache.has(realm)) {
        const currentRealm = MemCache.get(realm);
        currentRealm.clear();
    }
};
const DBUpdates = [
    {
        name: "add_consumption_to_generation",
        sql: "ALTER TABLE generation ADD consumption INTEGER DEFAULT(0);"
    },
    {
        name: "add_interval_to_spotprice",
        sql: 'ALTER TABLE spotprice ADD interval TEXT DEFAULT "PT60M";'
    },
    {
        name: "create_spotprice_area_period_index",
        sql: "CREATE INDEX spotprice_area_period ON spotprice (area,period);"
    },
    {
        name: "create_load_area_period_index",
        sql: "CREATE INDEX load_area_period ON load (area,period);"
    },
    {
        name: "create_generation_area_period_index",
        sql: "CREATE INDEX generation_area_period ON generation (area, period);"
    },
    {
        name: "delete_spotprice_date_column",
        sql: "ALTER TABLE spotprice DROP COLUMN date"
    },
    {
        name: "delete_german_and_austrian_history",
        sql: "DELETE FROM spotprice WHERE country='de' OR country='at'"
    },
    {
        name: "insert_psr_groups",
        sql: `INSERT INTO psr
        (psr,psr_group)
        VALUES
        ('B01','other'),
        ('B02','coal'),
        ('B03','gas'),
        ('B04','gas'),
        ('B05','coal'),
        ('B06','oil'),
        ('B07','oil'),
        ('B08','peat'),
        ('B09','other'),
        ('B10','water'),
        ('B11','water'),
        ('B12','water'),
        ('B13','water'),
        ('B14','nuclear'),
        ('B15','other'),
        ('B16','solar'),
        ('B17','other'),
        ('B18','wind'),
        ('B19','wind'),
        ('B20','other');`
    },
    {
        name: "bugfix_biomass_psr",
        sql: `UPDATE psr SET psr_group='other' WHERE psr='B01';`
    },
    {
        name: "add_generation_period_index",
        sql: `CREATE INDEX period ON generation (
      period
    );`
    },
    {
        name: "add_spotprice_period_index",
        sql: `CREATE INDEX spotprice_period ON spotprice (
      period
    );`
    },
    {
        name: "add_outage_table",
        sql: `CREATE TABLE outage (
        mrid                   TEXT    PRIMARY KEY
                                      UNIQUE
                                      NOT NULL,
        revision               NUMERIC,
        business_type          TEXT,
        document_type          TEXT,
        start_date             NUMERIC,
        end_date               NUMERIC,
        resource_name          TEXT,
        location               TEXT,
        country                TEXT,
        psr_name               TEXT,
        psr_nominal_power_unit TEXT,
        psr_nominal_power      NUMERIC,
        psr_type               TEXT,
        reason_code            TEXT,
        reason_text            TEXT
    );`
    },
    {
        name: "add_outage_availability_table",
        sql: `CREATE TABLE outage_availability (
        mrid     TEXT NOT NULL,
        start_date    NUMERIC,
        end_date    NUMERIC,
        quantity NUMERIC
    );`
    }
];
let database;
try {
    const path = resolve8(Deno.cwd(), "./db/"), fileName = resolve8(path, "main.db");
    await Deno.mkdir(path, {
        recursive: true
    });
    database = new Database(fileName);
    database.exec(sqlCreateSpotprice);
    database.exec(sqlCreateExchangeRate);
    database.exec(sqlCreateGeneration);
    database.exec(sqlCreateLoad);
    database.exec(sqlCreateUpdates);
    database.exec(sqlCreatePsr);
    const appliedUpdates = database.prepare(sqlAppliedUpdates).values();
    for (const update of DBUpdates){
        if (!appliedUpdates.find((r)=>r[0] == update.name)) {
            log("log", `Applying db update '${update.name}'`);
            try {
                database.exec(update.sql);
                database.prepare("INSERT INTO updates(name, applied) VALUES(?,?)").values(update.name, 1);
            } catch (e) {
                log("log", `Database update '${update.name}' failed. Error: ${e.code} ${e}`);
            } finally{
                log("log", `Database update '${update.name}' finalized`);
            }
        }
    }
} catch (_e) {
    console.error("Fatal: Could not open database", _e);
    Deno.exit(1);
}
const DailyCurrencyUpdate = async ()=>{
    log("info", `Scheduled data update started`);
    try {
        const dateToday = new Date();
        dateToday.setHours(0, 0, 0, 0);
        const maxCurrencyResult = database.prepare("SELECT MAX(period) as mp FROM exchangerate WHERE date >= (?)").values(dateToday.toLocaleDateString("sv-SE"));
        if (maxCurrencyResult[0][0] === null) {
            const result = await ExchangeRate();
            const entries = Object.entries(result.entries);
            for (const [currency, value] of entries){
                database.prepare("INSERT INTO exchangerate (currency, value, period, date) VALUES (?,?,?,?)").run(currency, value, dateToday.getTime(), dateToday.toLocaleDateString("sv-SE"));
            }
        }
    } catch (e) {
        log("error", `Error occured while updating data, skipping. Error: ${e}`);
    }
    log("info", `Database changed, clearing cache, realm extrate.`);
    InvalidateCache("exrate");
    log("info", `Scheduled data update done`);
};
DailyCurrencyUpdate();
