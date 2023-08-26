// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

class EventEmitter {
    listeners = new Map();
    on(event, fn) {
        if (this.listeners.has(event)) {
            this.listeners.get(event)?.push(fn);
        } else {
            this.listeners.set(event, [
                fn
            ]);
        }
    }
    off(event, fn) {
        const existingFns = this.listeners.get(event);
        if (existingFns) {
            this.listeners.set(event, existingFns.filter((existingFn)=>existingFn !== fn));
        }
    }
    emit(event, eventData) {
        const fns = this.listeners.get(event);
        if (fns) {
            for (const fn of fns){
                fn(eventData);
            }
        }
    }
}
class AssertionError extends Error {
    name = "AssertionError";
    constructor(message){
        super(message);
    }
}
function assert(expr, msg = "") {
    if (!expr) {
        throw new AssertionError(msg);
    }
}
const { hasOwn } = Object;
const osType = (()=>{
    const { Deno: Deno1 } = globalThis;
    if (typeof Deno1?.build?.os === "string") {
        return Deno1.build.os;
    }
    const { navigator } = globalThis;
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
const sep = "\\";
const delimiter = ";";
function resolve(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        const { Deno: Deno1 } = globalThis;
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
function parse(path) {
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
    parse: parse,
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
            const { Deno: Deno1 } = globalThis;
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
function parse1(path) {
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
    parse: parse1,
    fromFileUrl: fromFileUrl1,
    toFileUrl: toFileUrl1
};
const path = isWindows ? mod : mod1;
const { join: join2, normalize: normalize2 } = path;
const path1 = isWindows ? mod : mod1;
const { basename: basename2, delimiter: delimiter2, dirname: dirname2, extname: extname2, format: format2, fromFileUrl: fromFileUrl2, isAbsolute: isAbsolute2, join: join3, normalize: normalize3, parse: parse2, relative: relative2, resolve: resolve2, toFileUrl: toFileUrl2, toNamespacedPath: toNamespacedPath2 } = path1;
let wasm;
const heap = new Array(32).fill(undefined);
heap.push(undefined, null, true, false);
function getObject(idx) {
    return heap[idx];
}
let heap_next = heap.length;
function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}
function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}
function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];
    heap[idx] = obj;
    return idx;
}
const cachedTextDecoder = new TextDecoder("utf-8", {
    ignoreBOM: true,
    fatal: true
});
cachedTextDecoder.decode();
let cachedUint8Memory0 = new Uint8Array();
function getUint8Memory0() {
    if (cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}
function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}
let WASM_VECTOR_LEN = 0;
const cachedTextEncoder = new TextEncoder("utf-8");
const encodeString = function(arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
};
function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }
    let len = arg.length;
    let ptr = malloc(len);
    const mem = getUint8Memory0();
    let offset = 0;
    for(; offset < len; offset++){
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);
        offset += ret.written;
    }
    WASM_VECTOR_LEN = offset;
    return ptr;
}
function isLikeNone(x) {
    return x === undefined || x === null;
}
let cachedInt32Memory0 = new Int32Array();
function getInt32Memory0() {
    if (cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}
function getArrayU8FromWasm0(ptr, len) {
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
function digest(algorithm, data, length) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(algorithm, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.digest(retptr, ptr0, len0, addHeapObject(data), !isLikeNone(length), isLikeNone(length) ? 0 : length);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var r2 = getInt32Memory0()[retptr / 4 + 2];
        var r3 = getInt32Memory0()[retptr / 4 + 3];
        if (r3) {
            throw takeObject(r2);
        }
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1);
        return v1;
    } finally{
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
const DigestContextFinalization = new FinalizationRegistry((ptr)=>wasm.__wbg_digestcontext_free(ptr));
class DigestContext {
    static __wrap(ptr) {
        const obj = Object.create(DigestContext.prototype);
        obj.ptr = ptr;
        DigestContextFinalization.register(obj, obj.ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;
        DigestContextFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_digestcontext_free(ptr);
    }
    constructor(algorithm){
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(algorithm, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.digestcontext_new(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return DigestContext.__wrap(r0);
        } finally{
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    update(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.digestcontext_update(retptr, this.ptr, addHeapObject(data));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally{
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    digest(length) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.digestcontext_digest(retptr, this.ptr, !isLikeNone(length), isLikeNone(length) ? 0 : length);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally{
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    digestAndReset(length) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.digestcontext_digestAndReset(retptr, this.ptr, !isLikeNone(length), isLikeNone(length) ? 0 : length);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally{
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    digestAndDrop(length) {
        try {
            const ptr = this.__destroy_into_raw();
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.digestcontext_digestAndDrop(retptr, ptr, !isLikeNone(length), isLikeNone(length) ? 0 : length);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally{
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    reset() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.digestcontext_reset(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally{
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    clone() {
        const ret = wasm.digestcontext_clone(this.ptr);
        return DigestContext.__wrap(ret);
    }
}
const imports = {
    __wbindgen_placeholder__: {
        __wbg_new_db254ae0a1bb0ff5: function(arg0, arg1) {
            const ret = new TypeError(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        },
        __wbindgen_object_drop_ref: function(arg0) {
            takeObject(arg0);
        },
        __wbg_byteLength_87a0436a74adc26c: function(arg0) {
            const ret = getObject(arg0).byteLength;
            return ret;
        },
        __wbg_byteOffset_4477d54710af6f9b: function(arg0) {
            const ret = getObject(arg0).byteOffset;
            return ret;
        },
        __wbg_buffer_21310ea17257b0b4: function(arg0) {
            const ret = getObject(arg0).buffer;
            return addHeapObject(ret);
        },
        __wbg_newwithbyteoffsetandlength_d9aa266703cb98be: function(arg0, arg1, arg2) {
            const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
            return addHeapObject(ret);
        },
        __wbg_length_9e1ae1900cb0fbd5: function(arg0) {
            const ret = getObject(arg0).length;
            return ret;
        },
        __wbindgen_memory: function() {
            const ret = wasm.memory;
            return addHeapObject(ret);
        },
        __wbg_buffer_3f3d764d4747d564: function(arg0) {
            const ret = getObject(arg0).buffer;
            return addHeapObject(ret);
        },
        __wbg_new_8c3f0052272a457a: function(arg0) {
            const ret = new Uint8Array(getObject(arg0));
            return addHeapObject(ret);
        },
        __wbg_set_83db9690f9353e79: function(arg0, arg1, arg2) {
            getObject(arg0).set(getObject(arg1), arg2 >>> 0);
        },
        __wbindgen_throw: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        }
    }
};
function instantiate() {
    return instantiateWithInstance().exports;
}
let instanceWithExports;
function instantiateWithInstance() {
    if (instanceWithExports == null) {
        const instance = instantiateInstance();
        wasm = instance.exports;
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
        instanceWithExports = {
            instance,
            exports: {
                digest,
                DigestContext
            }
        };
    }
    return instanceWithExports;
}
function instantiateInstance() {
    const wasmBytes = base64decode("\
AGFzbQEAAAABrIGAgAAZYAAAYAABf2ABfwBgAX8Bf2ABfwF+YAJ/fwBgAn9/AX9gA39/fwBgA39/fw\
F/YAR/f39/AGAEf39/fwF/YAV/f39/fwBgBX9/f39/AX9gBn9/f39/fwBgBn9/f39/fwF/YAV/f39+\
fwBgB39/f35/f38Bf2ADf39+AGAFf39+f38AYAV/f31/fwBgBX9/fH9/AGACf34AYAR/fn9/AGAEf3\
1/fwBgBH98f38AAqSFgIAADBhfX3diaW5kZ2VuX3BsYWNlaG9sZGVyX18aX193YmdfbmV3X2RiMjU0\
YWUwYTFiYjBmZjUABhhfX3diaW5kZ2VuX3BsYWNlaG9sZGVyX18aX193YmluZGdlbl9vYmplY3RfZH\
JvcF9yZWYAAhhfX3diaW5kZ2VuX3BsYWNlaG9sZGVyX18hX193YmdfYnl0ZUxlbmd0aF84N2EwNDM2\
YTc0YWRjMjZjAAMYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fIV9fd2JnX2J5dGVPZmZzZXRfNDQ3N2\
Q1NDcxMGFmNmY5YgADGF9fd2JpbmRnZW5fcGxhY2Vob2xkZXJfXx1fX3diZ19idWZmZXJfMjEzMTBl\
YTE3MjU3YjBiNAADGF9fd2JpbmRnZW5fcGxhY2Vob2xkZXJfXzFfX3diZ19uZXd3aXRoYnl0ZW9mZn\
NldGFuZGxlbmd0aF9kOWFhMjY2NzAzY2I5OGJlAAgYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fHV9f\
d2JnX2xlbmd0aF85ZTFhZTE5MDBjYjBmYmQ1AAMYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fEV9fd2\
JpbmRnZW5fbWVtb3J5AAEYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fHV9fd2JnX2J1ZmZlcl8zZjNk\
NzY0ZDQ3NDdkNTY0AAMYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fGl9fd2JnX25ld184YzNmMDA1Mj\
I3MmE0NTdhAAMYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fGl9fd2JnX3NldF84M2RiOTY5MGY5MzUz\
ZTc5AAcYX193YmluZGdlbl9wbGFjZWhvbGRlcl9fEF9fd2JpbmRnZW5fdGhyb3cABQOQgYCAAI4BCw\
cLBwMJEQUHBwUHDwMHBQgFEAUFBwIHBQIGBwYHFQgHDgcHBwYBAQEBBwgHBwcBBwcHAQgHBwcHBwUC\
BwcHBwcBAQcHBQ0IBwkHCQEBAQEBBQEJDQsJBQUFBQUFBgYHBwcHAgIIBwcFAgoABQIDAgIODAsMCw\
sTFBIJCAgGBgUHBwAGAwAABQgICAQAAgSFgICAAAFwARUVBYOAgIAAAQARBomAgIAAAX8BQYCAwAAL\
B7mCgIAADgZtZW1vcnkCAAZkaWdlc3QAUhhfX3diZ19kaWdlc3Rjb250ZXh0X2ZyZWUAbxFkaWdlc3\
Rjb250ZXh0X25ldwBWFGRpZ2VzdGNvbnRleHRfdXBkYXRlAHIUZGlnZXN0Y29udGV4dF9kaWdlc3QA\
VRxkaWdlc3Rjb250ZXh0X2RpZ2VzdEFuZFJlc2V0AFcbZGlnZXN0Y29udGV4dF9kaWdlc3RBbmREcm\
9wAF8TZGlnZXN0Y29udGV4dF9yZXNldAAgE2RpZ2VzdGNvbnRleHRfY2xvbmUAEB9fX3diaW5kZ2Vu\
X2FkZF90b19zdGFja19wb2ludGVyAJABEV9fd2JpbmRnZW5fbWFsbG9jAHoSX193YmluZGdlbl9yZW\
FsbG9jAIcBD19fd2JpbmRnZW5fZnJlZQCLAQmngICAAAEAQQELFIkBigEojwF+YH+AAX2IAYYBgQGC\
AYMBhAGFAZkBammXAQqchImAAI4BhX0CEX8CfiMAQYApayIFJAACQAJAAkACQAJAAkACQAJAAkACQA\
JAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAQ4ZAAECAwQFBgcICQoLDA0O\
DxAREhMUFRYXGAALQdABEBkiBkUNGSAFQZAUakE4aiACQThqKQMANwMAIAVBkBRqQTBqIAJBMGopAw\
A3AwAgBUGQFGpBKGogAkEoaikDADcDACAFQZAUakEgaiACQSBqKQMANwMAIAVBkBRqQRhqIAJBGGop\
AwA3AwAgBUGQFGpBEGogAkEQaikDADcDACAFQZAUakEIaiACQQhqKQMANwMAIAUgAikDADcDkBQgAi\
kDQCEWIAVBkBRqQcgAaiACQcgAahBjIAUgFjcD0BQgBiAFQZAUakHQARCVARoMGAtB0AEQGSIGRQ0Y\
IAVBkBRqQThqIAJBOGopAwA3AwAgBUGQFGpBMGogAkEwaikDADcDACAFQZAUakEoaiACQShqKQMANw\
MAIAVBkBRqQSBqIAJBIGopAwA3AwAgBUGQFGpBGGogAkEYaikDADcDACAFQZAUakEQaiACQRBqKQMA\
NwMAIAVBkBRqQQhqIAJBCGopAwA3AwAgBSACKQMANwOQFCACKQNAIRYgBUGQFGpByABqIAJByABqEG\
MgBSAWNwPQFCAGIAVBkBRqQdABEJUBGgwXC0HQARAZIgZFDRcgBUGQFGpBOGogAkE4aikDADcDACAF\
QZAUakEwaiACQTBqKQMANwMAIAVBkBRqQShqIAJBKGopAwA3AwAgBUGQFGpBIGogAkEgaikDADcDAC\
AFQZAUakEYaiACQRhqKQMANwMAIAVBkBRqQRBqIAJBEGopAwA3AwAgBUGQFGpBCGogAkEIaikDADcD\
ACAFIAIpAwA3A5AUIAIpA0AhFiAFQZAUakHIAGogAkHIAGoQYyAFIBY3A9AUIAYgBUGQFGpB0AEQlQ\
EaDBYLQdABEBkiBkUNFiAFQZAUakE4aiACQThqKQMANwMAIAVBkBRqQTBqIAJBMGopAwA3AwAgBUGQ\
FGpBKGogAkEoaikDADcDACAFQZAUakEgaiACQSBqKQMANwMAIAVBkBRqQRhqIAJBGGopAwA3AwAgBU\
GQFGpBEGogAkEQaikDADcDACAFQZAUakEIaiACQQhqKQMANwMAIAUgAikDADcDkBQgAikDQCEWIAVB\
kBRqQcgAaiACQcgAahBjIAUgFjcD0BQgBiAFQZAUakHQARCVARoMFQtB8AAQGSIGRQ0VIAVBkBRqQS\
BqIAJBIGopAwA3AwAgBUGQFGpBGGogAkEYaikDADcDACAFQZAUakEQaiACQRBqKQMANwMAIAUgAikD\
CDcDmBQgAikDACEWIAVBkBRqQShqIAJBKGoQUSAFIBY3A5AUIAYgBUGQFGpB8AAQlQEaDBQLQfgOEB\
kiBkUNFCAFQZAUakGIAWogAkGIAWopAwA3AwAgBUGQFGpBgAFqIAJBgAFqKQMANwMAIAVBkBRqQfgA\
aiACQfgAaikDADcDACAFQZAUakEQaiACQRBqKQMANwMAIAVBkBRqQRhqIAJBGGopAwA3AwAgBUGQFG\
pBIGogAkEgaikDADcDACAFQZAUakEwaiACQTBqKQMANwMAIAVBkBRqQThqIAJBOGopAwA3AwAgBUGQ\
FGpBwABqIAJBwABqKQMANwMAIAVBkBRqQcgAaiACQcgAaikDADcDACAFQZAUakHQAGogAkHQAGopAw\
A3AwAgBUGQFGpB2ABqIAJB2ABqKQMANwMAIAVBkBRqQeAAaiACQeAAaikDADcDACAFIAIpA3A3A4AV\
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\
akEkakIANwIAIARB+A5qQSxqQgA3AgAgBEH4DmpBNGpCADcCACAEQfgOakE8akIANwIAIARCADcC/A\
4gBEEANgL4DiAEQfgOaiAEQfgOakEEckF/c2pBxABqQQdJGiAEQcAANgL4DiAEQZAUaiAEQfgOakHE\
ABCVARogBEG4J2pBOGoiCSAEQZAUakE8aikCADcDACAEQbgnakEwaiIDIARBkBRqQTRqKQIANwMAIA\
RBuCdqQShqIgggBEGQFGpBLGopAgA3AwAgBEG4J2pBIGoiByAEQZAUakEkaikCADcDACAEQbgnakEY\
aiIMIARBkBRqQRxqKQIANwMAIARBuCdqQRBqIgsgBEGQFGpBFGopAgA3AwAgBEG4J2pBCGoiDSAEQZ\
AUakEMaikCADcDACAEIAQpApQUNwO4JyAEQZAUaiAEQdABEJUBGiAEIAQpA9AUIARB2BVqLQAAIgKt\
fDcD0BQgBEHYFGohAQJAIAJBgAFGDQAgASACakEAQYABIAJrEJQBGgsgBEEAOgDYFSAEQZAUaiABQn\
8QEiAEQfgOakEIaiICIARBkBRqQQhqKQMANwMAIARB+A5qQRBqIgEgBEGQFGpBEGopAwA3AwAgBEH4\
DmpBGGoiCiAEQZAUakEYaikDADcDACAEQfgOakEgaiIOIAQpA7AUNwMAIARB+A5qQShqIg8gBEGQFG\
pBKGopAwA3AwAgBEH4DmpBMGoiECAEQZAUakEwaikDADcDACAEQfgOakE4aiIRIARBkBRqQThqKQMA\
NwMAIAQgBCkDkBQ3A/gOIA0gAikDADcDACALIAEpAwA3AwAgDCAKKQMANwMAIAcgDikDADcDACAIIA\
8pAwA3AwAgAyAQKQMANwMAIAkgESkDADcDACAEIAQpA/gONwO4J0HAABAZIgJFDR4gAiAEKQO4JzcA\
ACACQThqIARBuCdqQThqKQMANwAAIAJBMGogBEG4J2pBMGopAwA3AAAgAkEoaiAEQbgnakEoaikDAD\
cAACACQSBqIARBuCdqQSBqKQMANwAAIAJBGGogBEG4J2pBGGopAwA3AAAgAkEQaiAEQbgnakEQaikD\
ADcAACACQQhqIARBuCdqQQhqKQMANwAAIAYQIkHAACEEDCALIAUgBkHQARCVASIEQYQPakIANwIAIA\
RBjA9qQgA3AgAgBEGUD2pBADYCACAEQgA3AvwOIARBADYC+A5BBCECIARB+A5qIARB+A5qQQRyQX9z\
akEgaiEBA0AgAkF/aiICDQALAkAgAUEHSQ0AQRghAgNAIAJBeGoiAg0ACwsgBEEcNgL4DiAEQZAUak\
EQaiIHIARB+A5qQRBqIgIpAwA3AwAgBEGQFGpBCGoiDCAEQfgOakEIaiIBKQMANwMAIARBkBRqQRhq\
IgsgBEH4DmpBGGoiCSkDADcDACAEQbgnakEIaiINIARBnBRqKQIANwMAIARBuCdqQRBqIgogBEGkFG\
opAgA3AwAgBEG4J2pBGGoiDiAEQZAUakEcaigCADYCACAEIAQpA/gONwOQFCAEIAQpApQUNwO4JyAE\
QZAUaiAEQdABEJUBGiAEIAQpA9AUIARB2BVqLQAAIgOtfDcD0BQgBEHYFGohCAJAIANBgAFGDQAgCC\
ADakEAQYABIANrEJQBGgsgBEEAOgDYFSAEQZAUaiAIQn8QEiABIAwpAwA3AwAgAiAHKQMANwMAIAkg\
CykDADcDACAEQZgPaiAEKQOwFDcDACAEQfgOakEoaiAEQZAUakEoaikDADcDACAEQfgOakEwaiAEQZ\
AUakEwaikDADcDACAEQfgOakE4aiAEQZAUakE4aikDADcDACAEIAQpA5AUNwP4DiANIAEpAwA3AwAg\
CiACKQMANwMAIA4gCSgCADYCACAEIAQpA/gONwO4J0EcEBkiAkUNHSACIAQpA7gnNwAAIAJBGGogBE\
G4J2pBGGooAgA2AAAgAkEQaiAEQbgnakEQaikDADcAACACQQhqIARBuCdqQQhqKQMANwAADBELIAUg\
BkHQARCVASIEQfgOakEMakIANwIAIARB+A5qQRRqQgA3AgAgBEH4DmpBHGpCADcCACAEQgA3AvwOIA\
RBADYC+A4gBEH4DmogBEH4DmpBBHJBf3NqQSRqQQdJGiAEQSA2AvgOIARBkBRqQRBqIgcgBEH4DmpB\
EGoiASkDADcDACAEQZAUakEIaiIMIARB+A5qQQhqIgkpAwA3AwAgBEGQFGpBGGoiCyAEQfgOakEYai\
IDKQMANwMAIARBkBRqQSBqIARB+A5qQSBqIg0oAgA2AgAgBEG4J2pBCGoiCiAEQZAUakEMaikCADcD\
ACAEQbgnakEQaiIOIARBkBRqQRRqKQIANwMAIARBuCdqQRhqIg8gBEGQFGpBHGopAgA3AwAgBCAEKQ\
P4DjcDkBQgBCAEKQKUFDcDuCcgBEGQFGogBEHQARCVARogBCAEKQPQFCAEQdgVai0AACICrXw3A9AU\
IARB2BRqIQgCQCACQYABRg0AIAggAmpBAEGAASACaxCUARoLIARBADoA2BUgBEGQFGogCEJ/EBIgCS\
AMKQMANwMAIAEgBykDADcDACADIAspAwA3AwAgDSAEKQOwFDcDACAEQfgOakEoaiAEQZAUakEoaikD\
ADcDACAEQfgOakEwaiAEQZAUakEwaikDADcDACAEQfgOakE4aiAEQZAUakE4aikDADcDACAEIAQpA5\
AUNwP4DiAKIAkpAwA3AwAgDiABKQMANwMAIA8gAykDADcDACAEIAQpA/gONwO4J0EgEBkiAkUNHCAC\
IAQpA7gnNwAAIAJBGGogBEG4J2pBGGopAwA3AAAgAkEQaiAEQbgnakEQaikDADcAACACQQhqIARBuC\
dqQQhqKQMANwAADB0LIAUgBkHQARCVASIEQfgOakEMakIANwIAIARB+A5qQRRqQgA3AgAgBEH4DmpB\
HGpCADcCACAEQfgOakEkakIANwIAIARB+A5qQSxqQgA3AgAgBEIANwL8DiAEQQA2AvgOIARB+A5qIA\
RB+A5qQQRyQX9zakE0akEHSRogBEEwNgL4DiAEQZAUakEQaiILIARB+A5qQRBqIgIpAwA3AwAgBEGQ\
FGpBCGoiDSAEQfgOakEIaiIBKQMANwMAIARBkBRqQRhqIgogBEH4DmpBGGoiCSkDADcDACAEQZAUak\
EgaiAEQfgOakEgaiIDKQMANwMAIARBkBRqQShqIg4gBEH4DmpBKGoiCCkDADcDACAEQZAUakEwaiIP\
IARB+A5qQTBqIhAoAgA2AgAgBEG4J2pBCGoiESAEQZAUakEMaikCADcDACAEQbgnakEQaiISIARBkB\
RqQRRqKQIANwMAIARBuCdqQRhqIhMgBEGQFGpBHGopAgA3AwAgBEG4J2pBIGoiFCAEQZAUakEkaikC\
ADcDACAEQbgnakEoaiIVIARBkBRqQSxqKQIANwMAIAQgBCkD+A43A5AUIAQgBCkClBQ3A7gnIARBkB\
RqIARB0AEQlQEaIAQgBCkD0BQgBEHYFWotAAAiB618NwPQFCAEQdgUaiEMAkAgB0GAAUYNACAMIAdq\
QQBBgAEgB2sQlAEaCyAEQQA6ANgVIARBkBRqIAxCfxASIAEgDSkDADcDACACIAspAwA3AwAgCSAKKQ\
MANwMAIAMgBCkDsBQ3AwAgCCAOKQMANwMAIBAgDykDADcDACAEQfgOakE4aiAEQZAUakE4aikDADcD\
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\
NwMAIAFBkBRqQSBqIAFB+A5qQSBqKQMANwMAIAFBkBRqQShqIAFB+A5qQShqKQMANwMAIAFBkBRqQT\
BqIAFB+A5qQTBqKAIANgIAIAFBuCdqQQhqIgkgAUGQFGpBDGopAgA3AwAgAUG4J2pBEGoiAyABQZAU\
akEUaikCADcDACABQbgnakEYaiIIIAFBkBRqQRxqKQIANwMAIAFBuCdqQSBqIgcgAUGQFGpBJGopAg\
A3AwAgAUG4J2pBKGoiDCABQZAUakEsaikCADcDACABIAEpA/gONwOQFCABIAEpApQUNwO4JyABQZAU\
aiABQbgCEJUBGiABQZAUaiABQdgVaiABQbgnahBJQTAQGSICRQ0WIAIgASkDuCc3AAAgAkEoaiAMKQ\
MANwAAIAJBIGogBykDADcAACACQRhqIAgpAwA3AAAgAkEQaiADKQMANwAAIAJBCGogCSkDADcAAAwV\
CyAFIAZBmAIQlQEiAUH4DmpBDGpCADcCACABQfgOakEUakIANwIAIAFB+A5qQRxqQgA3AgAgAUH4Dm\
pBJGpCADcCACABQfgOakEsakIANwIAIAFB+A5qQTRqQgA3AgAgAUH4DmpBPGpCADcCACABQgA3AvwO\
IAFBADYC+A4gAUH4DmogAUH4DmpBBHJBf3NqQcQAakEHSRpBwAAhBCABQcAANgL4DiABQZAUaiABQf\
gOakHEABCVARogAUG4J2pBOGoiCSABQZAUakE8aikCADcDACABQbgnakEwaiIDIAFBkBRqQTRqKQIA\
NwMAIAFBuCdqQShqIgggAUGQFGpBLGopAgA3AwAgAUG4J2pBIGoiByABQZAUakEkaikCADcDACABQb\
gnakEYaiIMIAFBkBRqQRxqKQIANwMAIAFBuCdqQRBqIgsgAUGQFGpBFGopAgA3AwAgAUG4J2pBCGoi\
DSABQZAUakEMaikCADcDACABIAEpApQUNwO4JyABQZAUaiABQZgCEJUBGiABQZAUaiABQdgVaiABQb\
gnahBLQcAAEBkiAkUNFSACIAEpA7gnNwAAIAJBOGogCSkDADcAACACQTBqIAMpAwA3AAAgAkEoaiAI\
KQMANwAAIAJBIGogBykDADcAACACQRhqIAwpAwA3AAAgAkEQaiALKQMANwAAIAJBCGogDSkDADcAAA\
wUCyAFIAZB4AAQlQEiAUH4DmpBDGpCADcCACABQgA3AvwOIAFBADYC+A4gAUH4DmogAUH4DmpBBHJB\
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\
IAFB+A5qQRRqKQIANwMAIAFBiCZqQRhqIgwgAUH4DmpBHGopAgA3AwAgASABKQO4JzcD+A4gASABKQ\
L8DjcDiCYgAUGQFGogAUG4FGogAUGIJmoQJyAIIAwpAwA3AwAgCSAHKQMANwMAIAMgAikDADcDACAB\
IAEpA4gmNwP4DkEgEBkiAkUNCiACIAEpA/gONwAAIAJBGGogCCkDADcAACACQRBqIAkpAwA3AAAgAk\
EIaiADKQMANwAADAkLIAUgBkHYARCVASIBQZAUaiABQdgBEJUBGiABQbgnakEMakIANwIAIAFBuCdq\
QRRqQgA3AgAgAUG4J2pBHGpCADcCACABQbgnakEkakIANwIAIAFBuCdqQSxqQgA3AgAgAUG4J2pBNG\
pCADcCACABQbgnakE8akIANwIAIAFCADcCvCcgAUEANgK4JyABQbgnaiABQbgnakEEckF/c2pBxABq\
QQdJGiABQcAANgK4JyABQfgOaiABQbgnakHEABCVARogAUHAJmogAUH4DmpBPGopAgA3AwBBMCEEIA\
FBiCZqQTBqIAFB+A5qQTRqKQIANwMAIAFBiCZqQShqIgIgAUH4DmpBLGopAgA3AwAgAUGIJmpBIGoi\
CSABQfgOakEkaikCADcDACABQYgmakEYaiIDIAFB+A5qQRxqKQIANwMAIAFBiCZqQRBqIgggAUH4Dm\
pBFGopAgA3AwAgAUGIJmpBCGoiByABQfgOakEMaikCADcDACABIAEpAvwONwOIJiABQZAUaiABQeAU\
aiABQYgmahAjIAFB+A5qQShqIgwgAikDADcDACABQfgOakEgaiILIAkpAwA3AwAgAUH4DmpBGGoiCS\
ADKQMANwMAIAFB+A5qQRBqIgMgCCkDADcDACABQfgOakEIaiIIIAcpAwA3AwAgASABKQOIJjcD+A5B\
MBAZIgJFDQkgAiABKQP4DjcAACACQShqIAwpAwA3AAAgAkEgaiALKQMANwAAIAJBGGogCSkDADcAAC\
ACQRBqIAMpAwA3AAAgAkEIaiAIKQMANwAADAgLIAUgBkHYARCVASIBQZAUaiABQdgBEJUBGiABQbgn\
akEMakIANwIAIAFBuCdqQRRqQgA3AgAgAUG4J2pBHGpCADcCACABQbgnakEkakIANwIAIAFBuCdqQS\
xqQgA3AgAgAUG4J2pBNGpCADcCACABQbgnakE8akIANwIAIAFCADcCvCcgAUEANgK4JyABQbgnaiAB\
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\
AwA3AwAgBUHAAmpBCGogBUGYCGpBCGopAwA3AwAgBUHAAmpBGGogBUGYCGpBGGopAwA3AwAgBUHAAm\
pBIGogBUGYCGpBIGooAgA2AgAgBUHoBmpBCGoiAyAFQcACakEMaikCADcDACAFQegGakEQaiIGIAVB\
wAJqQRRqKQIANwMAIAVB6AZqQRhqIgcgBUHAAmpBHGopAgA3AwAgBSAFKQOYCDcDwAIgBSAFKQLEAj\
cD6AYgAiACQcgBaiAFQegGahBCIAJBAEHIARCUAUHQAmpBADoAAEEgEBkiAUUNECABIAUpA+gGNwAA\
IAFBGGogBykDADcAACABQRBqIAYpAwA3AAAgAUEIaiADKQMANwAADA8LIAVBmAhqQQxqQgA3AgAgBU\
GYCGpBFGpCADcCACAFQZgIakEcakIANwIAIAVBmAhqQSRqQgA3AgAgBUGYCGpBLGpCADcCACAFQgA3\
ApwIIAVBADYCmAggBUGYCGogBUGYCGpBBHJBf3NqQTRqQQdJGkEwIQQgBUEwNgKYCCAFQcACakEQai\
AFQZgIakEQaikDADcDACAFQcACakEIaiAFQZgIakEIaikDADcDACAFQcACakEYaiAFQZgIakEYaikD\
ADcDACAFQcACakEgaiAFQZgIakEgaikDADcDACAFQcACakEoaiAFQZgIakEoaikDADcDACAFQcACak\
EwaiAFQZgIakEwaigCADYCACAFQegGakEIaiIDIAVBwAJqQQxqKQIANwMAIAVB6AZqQRBqIgYgBUHA\
AmpBFGopAgA3AwAgBUHoBmpBGGoiByAFQcACakEcaikCADcDACAFQegGakEgaiIIIAVBwAJqQSRqKQ\
IANwMAIAVB6AZqQShqIgkgBUHAAmpBLGopAgA3AwAgBSAFKQOYCDcDwAIgBSAFKQLEAjcD6AYgAiAC\
QcgBaiAFQegGahBKIAJBAEHIARCUAUGwAmpBADoAAEEwEBkiAUUNDyABIAUpA+gGNwAAIAFBKGogCS\
kDADcAACABQSBqIAgpAwA3AAAgAUEYaiAHKQMANwAAIAFBEGogBikDADcAACABQQhqIAMpAwA3AAAM\
DgsgBUGYCGpBDGpCADcCACAFQZgIakEUakIANwIAIAVBmAhqQRxqQgA3AgAgBUGYCGpBJGpCADcCAC\
AFQZgIakEsakIANwIAIAVBmAhqQTRqQgA3AgAgBUGYCGpBPGpCADcCACAFQgA3ApwIIAVBADYCmAgg\
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\
fwR+IwBBgA9rIgEkAAJAAkACQAJAIABFDQAgACgCACICQX9GDQEgACACQQFqNgIAIABBCGooAgAhAg\
JAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAEEEaigC\
ACIDDhkAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYAAtB0AEQGSIERQ0bIAFBCGpBOGogAkE4aikDAD\
cDACABQQhqQTBqIAJBMGopAwA3AwAgAUEIakEoaiACQShqKQMANwMAIAFBCGpBIGogAkEgaikDADcD\
ACABQQhqQRhqIAJBGGopAwA3AwAgAUEIakEQaiACQRBqKQMANwMAIAFBCGpBCGogAkEIaikDADcDAC\
ABIAIpAwA3AwggAikDQCELIAFBCGpByABqIAJByABqEGMgASALNwNIIAQgAUEIakHQARCVARoMGAtB\
0AEQGSIERQ0aIAFBCGpBOGogAkE4aikDADcDACABQQhqQTBqIAJBMGopAwA3AwAgAUEIakEoaiACQS\
hqKQMANwMAIAFBCGpBIGogAkEgaikDADcDACABQQhqQRhqIAJBGGopAwA3AwAgAUEIakEQaiACQRBq\
KQMANwMAIAFBCGpBCGogAkEIaikDADcDACABIAIpAwA3AwggAikDQCELIAFBCGpByABqIAJByABqEG\
MgASALNwNIIAQgAUEIakHQARCVARoMFwtB0AEQGSIERQ0ZIAFBCGpBOGogAkE4aikDADcDACABQQhq\
QTBqIAJBMGopAwA3AwAgAUEIakEoaiACQShqKQMANwMAIAFBCGpBIGogAkEgaikDADcDACABQQhqQR\
hqIAJBGGopAwA3AwAgAUEIakEQaiACQRBqKQMANwMAIAFBCGpBCGogAkEIaikDADcDACABIAIpAwA3\
AwggAikDQCELIAFBCGpByABqIAJByABqEGMgASALNwNIIAQgAUEIakHQARCVARoMFgtB0AEQGSIERQ\
0YIAFBCGpBOGogAkE4aikDADcDACABQQhqQTBqIAJBMGopAwA3AwAgAUEIakEoaiACQShqKQMANwMA\
IAFBCGpBIGogAkEgaikDADcDACABQQhqQRhqIAJBGGopAwA3AwAgAUEIakEQaiACQRBqKQMANwMAIA\
FBCGpBCGogAkEIaikDADcDACABIAIpAwA3AwggAikDQCELIAFBCGpByABqIAJByABqEGMgASALNwNI\
IAQgAUEIakHQARCVARoMFQtB8AAQGSIERQ0XIAFBCGpBIGogAkEgaikDADcDACABQQhqQRhqIAJBGG\
opAwA3AwAgAUEIakEQaiACQRBqKQMANwMAIAEgAikDCDcDECACKQMAIQsgAUEIakEoaiACQShqEFEg\
ASALNwMIIAQgAUEIakHwABCVARoMFAtB+A4QGSIERQ0WIAFBCGpBiAFqIAJBiAFqKQMANwMAIAFBCG\
pBgAFqIAJBgAFqKQMANwMAIAFBCGpB+ABqIAJB+ABqKQMANwMAIAEgAikDcDcDeCABQQhqQRBqIAJB\
EGopAwA3AwAgAUEIakEYaiACQRhqKQMANwMAIAFBCGpBIGogAkEgaikDADcDACABIAIpAwg3AxAgAi\
kDACELIAFBCGpB4ABqIAJB4ABqKQMANwMAIAFBCGpB2ABqIAJB2ABqKQMANwMAIAFBCGpB0ABqIAJB\
0ABqKQMANwMAIAFBCGpByABqIAJByABqKQMANwMAIAFBCGpBwABqIAJBwABqKQMANwMAIAFBCGpBOG\
ogAkE4aikDADcDACABQQhqQTBqIAJBMGopAwA3AwAgASACKQMoNwMwIAItAGohBSACLQBpIQYgAi0A\
aCEHIAFBADYCmAECQCACKAKQASIIRQ0AIAJBlAFqIglBCGopAAAhDCAJQRBqKQAAIQ0gCSkAACEOIA\
FBtAFqIAlBGGopAAA3AgAgAUGsAWogDTcCACABQaQBaiAMNwIAIAFBCGpBlAFqIA43AgAgAkG0AWoi\
CiAJIAhBBXRqIglGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUHUAWogCkEYaikAADcCAC\
ABQcwBaiANNwIAIAFBxAFqIAw3AgAgAUEIakG0AWogDjcCACACQdQBaiIKIAlGDQAgCkEIaikAACEM\
IApBEGopAAAhDSAKKQAAIQ4gAUH0AWogCkEYaikAADcCACABQewBaiANNwIAIAFB5AFqIAw3AgAgAU\
EIakHUAWogDjcCACACQfQBaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUGUAmog\
CkEYaikAADcCACABQYwCaiANNwIAIAFBhAJqIAw3AgAgAUEIakH0AWogDjcCACACQZQCaiIKIAlGDQ\
AgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUG0AmogCkEYaikAADcCACABQawCaiANNwIAIAFB\
pAJqIAw3AgAgAUEIakGUAmogDjcCACACQbQCaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQ\
AAIQ4gAUHUAmogCkEYaikAADcCACABQcwCaiANNwIAIAFBxAJqIAw3AgAgAUEIakG0AmogDjcCACAC\
QdQCaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUH0AmogCkEYaikAADcCACABQe\
wCaiANNwIAIAFB5AJqIAw3AgAgAUEIakHUAmogDjcCACACQfQCaiIKIAlGDQAgCkEIaikAACEMIApB\
EGopAAAhDSAKKQAAIQ4gAUGUA2ogCkEYaikAADcCACABQYwDaiANNwIAIAFBhANqIAw3AgAgAUEIak\
H0AmogDjcCACACQZQDaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUG0A2ogCkEY\
aikAADcCACABQawDaiANNwIAIAFBpANqIAw3AgAgAUEIakGUA2ogDjcCACACQbQDaiIKIAlGDQAgCk\
EIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUHUA2ogCkEYaikAADcCACABQcwDaiANNwIAIAFBxANq\
IAw3AgAgAUEIakG0A2ogDjcCACACQdQDaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ\
4gAUH0A2ogCkEYaikAADcCACABQewDaiANNwIAIAFB5ANqIAw3AgAgAUEIakHUA2ogDjcCACACQfQD\
aiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUGUBGogCkEYaikAADcCACABQYwEai\
ANNwIAIAFBhARqIAw3AgAgAUEIakH0A2ogDjcCACACQZQEaiIKIAlGDQAgCkEIaikAACEMIApBEGop\
AAAhDSAKKQAAIQ4gAUG0BGogCkEYaikAADcCACABQawEaiANNwIAIAFBpARqIAw3AgAgAUEIakGUBG\
ogDjcCACACQbQEaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUHUBGogCkEYaikA\
ADcCACABQcwEaiANNwIAIAFBxARqIAw3AgAgAUEIakG0BGogDjcCACACQdQEaiIKIAlGDQAgCkEIai\
kAACEMIApBEGopAAAhDSAKKQAAIQ4gAUH0BGogCkEYaikAADcCACABQewEaiANNwIAIAFB5ARqIAw3\
AgAgAUEIakHUBGogDjcCACACQfQEaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAU\
GUBWogCkEYaikAADcCACABQYwFaiANNwIAIAFBhAVqIAw3AgAgAUEIakH0BGogDjcCACACQZQFaiIK\
IAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUG0BWogCkEYaikAADcCACABQawFaiANNw\
IAIAFBpAVqIAw3AgAgAUEIakGUBWogDjcCACACQbQFaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAh\
DSAKKQAAIQ4gAUHUBWogCkEYaikAADcCACABQcwFaiANNwIAIAFBxAVqIAw3AgAgAUEIakG0BWogDj\
cCACACQdQFaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUH0BWogCkEYaikAADcC\
ACABQewFaiANNwIAIAFB5AVqIAw3AgAgAUEIakHUBWogDjcCACACQfQFaiIKIAlGDQAgCkEIaikAAC\
EMIApBEGopAAAhDSAKKQAAIQ4gAUGUBmogCkEYaikAADcCACABQYwGaiANNwIAIAFBhAZqIAw3AgAg\
AUEIakH0BWogDjcCACACQZQGaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUG0Bm\
ogCkEYaikAADcCACABQawGaiANNwIAIAFBpAZqIAw3AgAgAUEIakGUBmogDjcCACACQbQGaiIKIAlG\
DQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUHUBmogCkEYaikAADcCACABQcwGaiANNwIAIA\
FBxAZqIAw3AgAgAUEIakG0BmogDjcCACACQdQGaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAK\
KQAAIQ4gAUH0BmogCkEYaikAADcCACABQewGaiANNwIAIAFB5AZqIAw3AgAgAUEIakHUBmogDjcCAC\
ACQfQGaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUGUB2ogCkEYaikAADcCACAB\
QYwHaiANNwIAIAFBhAdqIAw3AgAgAUEIakH0BmogDjcCACACQZQHaiIKIAlGDQAgCkEIaikAACEMIA\
pBEGopAAAhDSAKKQAAIQ4gAUG0B2ogCkEYaikAADcCACABQawHaiANNwIAIAFBpAdqIAw3AgAgAUEI\
akGUB2ogDjcCACACQbQHaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUHUB2ogCk\
EYaikAADcCACABQcwHaiANNwIAIAFBxAdqIAw3AgAgAUEIakG0B2ogDjcCACACQdQHaiIKIAlGDQAg\
CkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUH0B2ogCkEYaikAADcCACABQewHaiANNwIAIAFB5A\
dqIAw3AgAgAUEIakHUB2ogDjcCACACQfQHaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAA\
IQ4gAUGUCGogCkEYaikAADcCACABQYwIaiANNwIAIAFBhAhqIAw3AgAgAUEIakH0B2ogDjcCACACQZ\
QIaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUG0CGogCkEYaikAADcCACABQawI\
aiANNwIAIAFBpAhqIAw3AgAgAUEIakGUCGogDjcCACACQbQIaiIKIAlGDQAgCkEIaikAACEMIApBEG\
opAAAhDSAKKQAAIQ4gAUHUCGogCkEYaikAADcCACABQcwIaiANNwIAIAFBxAhqIAw3AgAgAUEIakG0\
CGogDjcCACACQdQIaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUH0CGogCkEYai\
kAADcCACABQewIaiANNwIAIAFB5AhqIAw3AgAgAUEIakHUCGogDjcCACACQfQIaiIKIAlGDQAgCkEI\
aikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUGUCWogCkEYaikAADcCACABQYwJaiANNwIAIAFBhAlqIA\
w3AgAgAUEIakH0CGogDjcCACACQZQJaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4g\
AUG0CWogCkEYaikAADcCACABQawJaiANNwIAIAFBpAlqIAw3AgAgAUEIakGUCWogDjcCACACQbQJai\
IKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUHUCWogCkEYaikAADcCACABQcwJaiAN\
NwIAIAFBxAlqIAw3AgAgAUEIakG0CWogDjcCACACQdQJaiIKIAlGDQAgCkEIaikAACEMIApBEGopAA\
AhDSAKKQAAIQ4gAUH0CWogCkEYaikAADcCACABQewJaiANNwIAIAFB5AlqIAw3AgAgAUEIakHUCWog\
DjcCACACQfQJaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUGUCmogCkEYaikAAD\
cCACABQYwKaiANNwIAIAFBhApqIAw3AgAgAUEIakH0CWogDjcCACACQZQKaiIKIAlGDQAgCkEIaikA\
ACEMIApBEGopAAAhDSAKKQAAIQ4gAUG0CmogCkEYaikAADcCACABQawKaiANNwIAIAFBpApqIAw3Ag\
AgAUEIakGUCmogDjcCACACQbQKaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUHU\
CmogCkEYaikAADcCACABQcwKaiANNwIAIAFBxApqIAw3AgAgAUEIakG0CmogDjcCACACQdQKaiIKIA\
lGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUH0CmogCkEYaikAADcCACABQewKaiANNwIA\
IAFB5ApqIAw3AgAgAUEIakHUCmogDjcCACACQfQKaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDS\
AKKQAAIQ4gAUGUC2ogCkEYaikAADcCACABQYwLaiANNwIAIAFBhAtqIAw3AgAgAUEIakH0CmogDjcC\
ACACQZQLaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUG0C2ogCkEYaikAADcCAC\
ABQawLaiANNwIAIAFBpAtqIAw3AgAgAUEIakGUC2ogDjcCACACQbQLaiIKIAlGDQAgCkEIaikAACEM\
IApBEGopAAAhDSAKKQAAIQ4gAUHUC2ogCkEYaikAADcCACABQcwLaiANNwIAIAFBxAtqIAw3AgAgAU\
EIakG0C2ogDjcCACACQdQLaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUH0C2og\
CkEYaikAADcCACABQewLaiANNwIAIAFB5AtqIAw3AgAgAUEIakHUC2ogDjcCACACQfQLaiIKIAlGDQ\
AgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUGUDGogCkEYaikAADcCACABQYwMaiANNwIAIAFB\
hAxqIAw3AgAgAUEIakH0C2ogDjcCACACQZQMaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQ\
AAIQ4gAUG0DGogCkEYaikAADcCACABQawMaiANNwIAIAFBpAxqIAw3AgAgAUEIakGUDGogDjcCACAC\
QbQMaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUHUDGogCkEYaikAADcCACABQc\
wMaiANNwIAIAFBxAxqIAw3AgAgAUEIakG0DGogDjcCACACQdQMaiIKIAlGDQAgCkEIaikAACEMIApB\
EGopAAAhDSAKKQAAIQ4gAUH0DGogCkEYaikAADcCACABQewMaiANNwIAIAFB5AxqIAw3AgAgAUEIak\
HUDGogDjcCACACQfQMaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUGUDWogCkEY\
aikAADcCACABQYwNaiANNwIAIAFBhA1qIAw3AgAgAUEIakH0DGogDjcCACACQZQNaiIKIAlGDQAgCk\
EIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUG0DWogCkEYaikAADcCACABQawNaiANNwIAIAFBpA1q\
IAw3AgAgAUEIakGUDWogDjcCACACQbQNaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ\
4gAUHUDWogCkEYaikAADcCACABQcwNaiANNwIAIAFBxA1qIAw3AgAgAUEIakG0DWogDjcCACACQdQN\
aiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUH0DWogCkEYaikAADcCACABQewNai\
ANNwIAIAFB5A1qIAw3AgAgAUEIakHUDWogDjcCACACQfQNaiIKIAlGDQAgCkEIaikAACEMIApBEGop\
AAAhDSAKKQAAIQ4gAUGUDmogCkEYaikAADcCACABQYwOaiANNwIAIAFBhA5qIAw3AgAgAUEIakH0DW\
ogDjcCACACQZQOaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAUG0DmogCkEYaikA\
ADcCACABQawOaiANNwIAIAFBpA5qIAw3AgAgAUEIakGUDmogDjcCACACQbQOaiIKIAlGDQAgCkEIai\
kAACEMIApBEGopAAAhDSAKKQAAIQ4gAUHUDmogCkEYaikAADcCACABQcwOaiANNwIAIAFBxA5qIAw3\
AgAgAUEIakG0DmogDjcCACACQdQOaiIKIAlGDQAgCkEIaikAACEMIApBEGopAAAhDSAKKQAAIQ4gAU\
H0DmogCkEYaikAADcCACABQewOaiANNwIAIAFB5A5qIAw3AgAgAUEIakHUDmogDjcCACACQfQOaiAJ\
Rw0YCyABIAU6AHIgASAGOgBxIAEgBzoAcCABIAs3AwggASAIQf///z9xIgJBNyACQTdJGzYCmAEgBC\
ABQQhqQfgOEJUBGgwTC0HgAhAZIgRFDRUgAUEIaiACQcgBEJUBGiABQQhqQcgBaiACQcgBahBkIAQg\
AUEIakHgAhCVARoMEgtB2AIQGSIERQ0UIAFBCGogAkHIARCVARogAUEIakHIAWogAkHIAWoQZSAEIA\
FBCGpB2AIQlQEaDBELQbgCEBkiBEUNEyABQQhqIAJByAEQlQEaIAFBCGpByAFqIAJByAFqEGYgBCAB\
QQhqQbgCEJUBGgwQC0GYAhAZIgRFDRIgAUEIaiACQcgBEJUBGiABQQhqQcgBaiACQcgBahBnIAQgAU\
EIakGYAhCVARoMDwtB4AAQGSIERQ0RIAFBCGpBEGogAkEQaikDADcDACABIAIpAwg3AxAgAikDACEL\
IAFBCGpBGGogAkEYahBRIAEgCzcDCCAEIAFBCGpB4AAQlQEaDA4LQeAAEBkiBEUNECABQQhqQRBqIA\
JBEGopAwA3AwAgASACKQMINwMQIAIpAwAhCyABQQhqQRhqIAJBGGoQUSABIAs3AwggBCABQQhqQeAA\
EJUBGgwNC0HoABAZIgRFDQ8gAUEIakEYaiACQRhqKAIANgIAIAFBCGpBEGogAkEQaikDADcDACABIA\
IpAwg3AxAgAikDACELIAFBCGpBIGogAkEgahBRIAEgCzcDCCAEIAFBCGpB6AAQlQEaDAwLQegAEBki\
BEUNDiABQQhqQRhqIAJBGGooAgA2AgAgAUEIakEQaiACQRBqKQMANwMAIAEgAikDCDcDECACKQMAIQ\
sgAUEIakEgaiACQSBqEFEgASALNwMIIAQgAUEIakHoABCVARoMCwtB4AIQGSIERQ0NIAFBCGogAkHI\
ARCVARogAUEIakHIAWogAkHIAWoQZCAEIAFBCGpB4AIQlQEaDAoLQdgCEBkiBEUNDCABQQhqIAJByA\
EQlQEaIAFBCGpByAFqIAJByAFqEGUgBCABQQhqQdgCEJUBGgwJC0G4AhAZIgRFDQsgAUEIaiACQcgB\
EJUBGiABQQhqQcgBaiACQcgBahBmIAQgAUEIakG4AhCVARoMCAtBmAIQGSIERQ0KIAFBCGogAkHIAR\
CVARogAUEIakHIAWogAkHIAWoQZyAEIAFBCGpBmAIQlQEaDAcLQfAAEBkiBEUNCSABQQhqQSBqIAJB\
IGopAwA3AwAgAUEIakEYaiACQRhqKQMANwMAIAFBCGpBEGogAkEQaikDADcDACABIAIpAwg3AxAgAi\
kDACELIAFBCGpBKGogAkEoahBRIAEgCzcDCCAEIAFBCGpB8AAQlQEaDAYLQfAAEBkiBEUNCCABQQhq\
QSBqIAJBIGopAwA3AwAgAUEIakEYaiACQRhqKQMANwMAIAFBCGpBEGogAkEQaikDADcDACABIAIpAw\
g3AxAgAikDACELIAFBCGpBKGogAkEoahBRIAEgCzcDCCAEIAFBCGpB8AAQlQEaDAULQdgBEBkiBEUN\
ByABQQhqQThqIAJBOGopAwA3AwAgAUEIakEwaiACQTBqKQMANwMAIAFBCGpBKGogAkEoaikDADcDAC\
ABQQhqQSBqIAJBIGopAwA3AwAgAUEIakEYaiACQRhqKQMANwMAIAFBCGpBEGogAkEQaikDADcDACAB\
QQhqQQhqIAJBCGopAwA3AwAgASACKQMANwMIIAJByABqKQMAIQsgAikDQCEMIAFBCGpB0ABqIAJB0A\
BqEGMgAUEIakHIAGogCzcDACABIAw3A0ggBCABQQhqQdgBEJUBGgwEC0HYARAZIgRFDQYgAUEIakE4\
aiACQThqKQMANwMAIAFBCGpBMGogAkEwaikDADcDACABQQhqQShqIAJBKGopAwA3AwAgAUEIakEgai\
ACQSBqKQMANwMAIAFBCGpBGGogAkEYaikDADcDACABQQhqQRBqIAJBEGopAwA3AwAgAUEIakEIaiAC\
QQhqKQMANwMAIAEgAikDADcDCCACQcgAaikDACELIAIpA0AhDCABQQhqQdAAaiACQdAAahBjIAFBCG\
pByABqIAs3AwAgASAMNwNIIAQgAUEIakHYARCVARoMAwtB+AIQGSIERQ0FIAFBCGogAkHIARCVARog\
AUEIakHIAWogAkHIAWoQaCAEIAFBCGpB+AIQlQEaDAILQdgCEBkiBEUNBCABQQhqIAJByAEQlQEaIA\
FBCGpByAFqIAJByAFqEGUgBCABQQhqQdgCEJUBGgwBC0HoABAZIgRFDQMgAUEIakEQaiACQRBqKQMA\
NwMAIAFBCGpBGGogAkEYaikDADcDACABIAIpAwg3AxAgAikDACELIAFBCGpBIGogAkEgahBRIAEgCz\
cDCCAEIAFBCGpB6AAQlQEaCyAAIAAoAgBBf2o2AgBBDBAZIgBFDQIgACAENgIIIAAgAzYCBCAAQQA2\
AgAgAUGAD2okACAADwsQkQEACxCSAQALAAsQjgEAC9k+AhN/An4jAEGAAmsiBCQAAkACQAJAAkACQA\
JAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAC\
QAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAk\
ACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCAADhkAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYAAsg\
AUHIAGohBUGAASABQcgBai0AACIAayIGIANPDRgCQCAARQ0AIAUgAGogAiAGEJUBGiABIAEpA0BCgA\
F8NwNAIAEgBUIAEBIgAyAGayEDIAIgBmohAgsgAyADQQd2IANBAEcgA0H/AHFFcWsiAEEHdCIHayED\
IABFDUkgByEGIAIhAANAIAEgASkDQEKAAXw3A0AgASAAQgAQEiAAQYABaiEAIAZBgH9qIgYNAAxKCw\
sgAUHIAGohBUGAASABQcgBai0AACIAayIGIANPDRgCQCAARQ0AIAUgAGogAiAGEJUBGiABIAEpA0BC\
gAF8NwNAIAEgBUIAEBIgAyAGayEDIAIgBmohAgsgAyADQQd2IANBAEcgA0H/AHFFcWsiAEEHdCIHay\
EDIABFDUcgByEGIAIhAANAIAEgASkDQEKAAXw3A0AgASAAQgAQEiAAQYABaiEAIAZBgH9qIgYNAAxI\
CwsgAUHIAGohBUGAASABQcgBai0AACIAayIGIANPDRgCQCAARQ0AIAUgAGogAiAGEJUBGiABIAEpA0\
BCgAF8NwNAIAEgBUIAEBIgAyAGayEDIAIgBmohAgsgAyADQQd2IANBAEcgA0H/AHFFcWsiAEEHdCIH\
ayEDIABFDUUgByEGIAIhAANAIAEgASkDQEKAAXw3A0AgASAAQgAQEiAAQYABaiEAIAZBgH9qIgYNAA\
xGCwsgAUHIAGohBUGAASABQcgBai0AACIAayIGIANPDRgCQCAARQ0AIAUgAGogAiAGEJUBGiABIAEp\
A0BCgAF8NwNAIAEgBUIAEBIgAyAGayEDIAIgBmohAgsgAyADQQd2IANBAEcgA0H/AHFFcWsiAEEHdC\
IHayEDIABFDUMgByEGIAIhAANAIAEgASkDQEKAAXw3A0AgASAAQgAQEiAAQYABaiEAIAZBgH9qIgYN\
AAxECwsgAUEoaiEFQcAAIAFB6ABqLQAAIgBrIgYgA08NGAJAIABFDQAgBSAAaiACIAYQlQEaIAEgAS\
kDAELAAHw3AwAgASAFQQAQFCADIAZrIQMgAiAGaiECCyADIANBBnYgA0EARyADQT9xRXFrIgBBBnQi\
B2shAyAARQ1BIAchBiACIQADQCABIAEpAwBCwAB8NwMAIAEgAEEAEBQgAEHAAGohACAGQUBqIgYNAA\
xCCwsgAUHpAGotAABBBnQgAS0AaGoiAEUNPyABIAJBgAggAGsiACADIAAgA0kbIgUQNyEAIAMgBWsi\
A0UNRSAEQfAAakEQaiAAQRBqIgYpAwA3AwAgBEHwAGpBGGogAEEYaiIHKQMANwMAIARB8ABqQSBqIA\
BBIGoiCCkDADcDACAEQfAAakEwaiAAQTBqKQMANwMAIARB8ABqQThqIABBOGopAwA3AwAgBEHwAGpB\
wABqIABBwABqKQMANwMAIARB8ABqQcgAaiAAQcgAaikDADcDACAEQfAAakHQAGogAEHQAGopAwA3Aw\
AgBEHwAGpB2ABqIABB2ABqKQMANwMAIARB8ABqQeAAaiAAQeAAaikDADcDACAEIAApAwg3A3ggBCAA\
KQMoNwOYASABQekAai0AACEJIAAtAGohCiAEIAEtAGgiCzoA2AEgBCAAKQMAIhc3A3AgBCAKIAlFck\
ECciIJOgDZASAEQRhqIgogCCkCADcDACAEQRBqIgggBykCADcDACAEQQhqIgcgBikCADcDACAEIAAp\
Agg3AwAgBCAEQfAAakEoaiALIBcgCRAYIAooAgAhCSAIKAIAIQggBygCACEKIAQoAhwhCyAEKAIUIQ\
wgBCgCDCENIAQoAgQhDiAEKAIAIQ8gACAXECogACgCkAEiB0E3Tw0YIABBkAFqIAdBBXRqIgZBIGog\
CzYCACAGQRxqIAk2AgAgBkEYaiAMNgIAIAZBFGogCDYCACAGQRBqIA02AgAgBkEMaiAKNgIAIAZBCG\
ogDjYCACAGQQRqIA82AgAgAEEoaiIGQRhqQgA3AwAgBkEgakIANwMAIAZBKGpCADcDACAGQTBqQgA3\
AwAgBkE4akIANwMAIAZCADcDACAAIAdBAWo2ApABIAZBCGpCADcDACAGQRBqQgA3AwAgAEEIaiIGQR\
hqIABBiAFqKQMANwMAIAZBEGogAEGAAWopAwA3AwAgBkEIaiAAQfgAaikDADcDACAGIAApA3A3AwAg\
ACAAKQMAQgF8NwMAIAFBADsBaCACIAVqIQIMPwsgBCABNgJwIAFByAFqIQZBkAEgAUHYAmotAAAiAG\
siBSADSw0YAkAgAEUNACAGIABqIAIgBRCVARogBEHwAGogBkEBEEQgAyAFayEDIAIgBWohAgsgAyAD\
QZABbiIHQZABbCIFayEAIANBjwFNDT0gBEHwAGogAiAHEEQMPQsgBCABNgJwIAFByAFqIQZBiAEgAU\
HQAmotAAAiAGsiBSADSw0YAkAgAEUNACAGIABqIAIgBRCVARogBEHwAGogBkEBEEggAyAFayEDIAIg\
BWohAgsgAyADQYgBbiIHQYgBbCIFayEAIANBhwFNDTsgBEHwAGogAiAHEEgMOwsgBCABNgJwIAFByA\
FqIQZB6AAgAUGwAmotAAAiAGsiBSADSw0YAkAgAEUNACAGIABqIAIgBRCVARogBEHwAGogBkEBEE8g\
AyAFayEDIAIgBWohAgsgAyADQegAbiIHQegAbCIFayEAIANB5wBNDTkgBEHwAGogAiAHEE8MOQsgBC\
ABNgJwIAFByAFqIQZByAAgAUGQAmotAAAiAGsiBSADSw0YAkAgAEUNACAGIABqIAIgBRCVARogBEHw\
AGogBkEBEFQgAyAFayEDIAIgBWohAgsgAyADQcgAbiIHQcgAbCIFayEAIANBxwBNDTcgBEHwAGogAi\
AHEFQMNwsgAUEYaiEFQcAAIAFB2ABqLQAAIgBrIgYgA0sNGAJAIABFDQAgBSAAaiACIAYQlQEaIAEg\
ASkDAEIBfDcDACABQQhqIAUQHSADIAZrIQMgAiAGaiECCyADQT9xIQcgAiADQUBxIgBqIQggA0E/TQ\
01IAEgASkDACADQQZ2rXw3AwAgAUEIaiEGA0AgBiACEB0gAkHAAGohAiAAQUBqIgANAAw2CwsgBCAB\
NgJwIAFBGGohBkHAACABQdgAai0AACIAayIFIANLDRgCQCAARQ0AIAYgAGogAiAFEJUBGiAEQfAAai\
AGQQEQGiADIAVrIQMgAiAFaiECCyADQT9xIQAgAiADQUBxaiEFIANBP00NMyAEQfAAaiACIANBBnYQ\
GgwzCyABQSBqIQVBwAAgAUHgAGotAAAiAGsiBiADSw0YAkAgAEUNACAFIABqIAIgBhCVARogASABKQ\
MAQgF8NwMAIAFBCGogBRATIAMgBmshAyACIAZqIQILIANBP3EhByACIANBQHEiAGohCCADQT9NDTEg\
ASABKQMAIANBBnatfDcDACABQQhqIQYDQCAGIAIQEyACQcAAaiECIABBQGoiAA0ADDILCyABQSBqIQ\
ZBwAAgAUHgAGotAAAiAGsiBSADSw0YAkAgAEUNACAGIABqIAIgBRCVARogASABKQMAQgF8NwMAIAFB\
CGogBkEBEBUgAyAFayEDIAIgBWohAgsgA0E/cSEAIAIgA0FAcWohBSADQT9NDS8gASABKQMAIANBBn\
YiA618NwMAIAFBCGogAiADEBUMLwsgBCABNgJwIAFByAFqIQZBkAEgAUHYAmotAAAiAGsiBSADSw0Y\
AkAgAEUNACAGIABqIAIgBRCVARogBEHwAGogBkEBEEQgAyAFayEDIAIgBWohAgsgAyADQZABbiIHQZ\
ABbCIFayEAIANBjwFNDS0gBEHwAGogAiAHEEQMLQsgBCABNgJwIAFByAFqIQZBiAEgAUHQAmotAAAi\
AGsiBSADSw0YAkAgAEUNACAGIABqIAIgBRCVARogBEHwAGogBkEBEEggAyAFayEDIAIgBWohAgsgAy\
ADQYgBbiIHQYgBbCIFayEAIANBhwFNDSsgBEHwAGogAiAHEEgMKwsgBCABNgJwIAFByAFqIQZB6AAg\
AUGwAmotAAAiAGsiBSADSw0YAkAgAEUNACAGIABqIAIgBRCVARogBEHwAGogBkEBEE8gAyAFayEDIA\
IgBWohAgsgAyADQegAbiIHQegAbCIFayEAIANB5wBNDSkgBEHwAGogAiAHEE8MKQsgBCABNgJwIAFB\
yAFqIQZByAAgAUGQAmotAAAiAGsiBSADSw0YAkAgAEUNACAGIABqIAIgBRCVARogBEHwAGogBkEBEF\
QgAyAFayEDIAIgBWohAgsgAyADQcgAbiIHQcgAbCIFayEAIANBxwBNDScgBEHwAGogAiAHEFQMJwsg\
AUEoaiEGQcAAIAFB6ABqLQAAIgBrIgUgA0sNGAJAIABFDQAgBiAAaiACIAUQlQEaIAEgASkDAEIBfD\
cDACABQQhqIAZBARAPIAMgBWshAyACIAVqIQILIANBP3EhACACIANBQHFqIQUgA0E/TQ0lIAEgASkD\
ACADQQZ2IgOtfDcDACABQQhqIAIgAxAPDCULIAFBKGohBkHAACABQegAai0AACIAayIFIANLDRgCQC\
AARQ0AIAYgAGogAiAFEJUBGiABIAEpAwBCAXw3AwAgAUEIaiAGQQEQDyADIAVrIQMgAiAFaiECCyAD\
QT9xIQAgAiADQUBxaiEFIANBP00NIyABIAEpAwAgA0EGdiIDrXw3AwAgAUEIaiACIAMQDwwjCyABQd\
AAaiEGQYABIAFB0AFqLQAAIgBrIgUgA0sNGAJAIABFDQAgBiAAaiACIAUQlQEaIAEgASkDQCIXQgF8\
Ihg3A0AgAUHIAGoiACAAKQMAIBggF1StfDcDACABIAZBARANIAMgBWshAyACIAVqIQILIANB/wBxIQ\
AgAiADQYB/cWohBSADQf8ATQ0hIAEgASkDQCIXIANBB3YiA618Ihg3A0AgAUHIAGoiByAHKQMAIBgg\
F1StfDcDACABIAIgAxANDCELIAFB0ABqIQZBgAEgAUHQAWotAAAiAGsiBSADSw0YAkAgAEUNACAGIA\
BqIAIgBRCVARogASABKQNAIhdCAXwiGDcDQCABQcgAaiIAIAApAwAgGCAXVK18NwMAIAEgBkEBEA0g\
AyAFayEDIAIgBWohAgsgA0H/AHEhACACIANBgH9xaiEFIANB/wBNDR8gASABKQNAIhcgA0EHdiIDrX\
wiGDcDQCABQcgAaiIHIAcpAwAgGCAXVK18NwMAIAEgAiADEA0MHwsgBCABNgJwIAFByAFqIQZBqAEg\
AUHwAmotAAAiAGsiBSADSw0YAkAgAEUNACAGIABqIAIgBRCVARogBEHwAGogBkEBED4gAyAFayEDIA\
IgBWohAgsgAyADQagBbiIHQagBbCIFayEAIANBpwFNDR0gBEHwAGogAiAHED4MHQsgBCABNgJwIAFB\
yAFqIQZBiAEgAUHQAmotAAAiAGsiBSADSw0YAkAgAEUNACAGIABqIAIgBRCVARogBEHwAGogBkEBEE\
ggAyAFayEDIAIgBWohAgsgAyADQYgBbiIHQYgBbCIFayEAIANBhwFNDRsgBEHwAGogAiAHEEgMGwsg\
AUEgaiEFAkBBwAAgAUHgAGotAAAiAGsiBiADSw0AAkAgAEUNACAFIABqIAIgBhCVARogASABKQMAQg\
F8NwMAIAFBCGogBRAWIAMgBmshAyACIAZqIQILIANBP3EhByACIANBQHEiAGohCCADQT9NDRkgASAB\
KQMAIANBBnatfDcDACABQQhqIQYDQCAGIAIQFiACQcAAaiECIABBQGoiAA0ADBoLCyAFIABqIAIgAx\
CVARogACADaiEHDBkLIAUgAGogAiADEJUBGiABIAAgA2o6AMgBDDELIAUgAGogAiADEJUBGiABIAAg\
A2o6AMgBDDALIAUgAGogAiADEJUBGiABIAAgA2o6AMgBDC8LIAUgAGogAiADEJUBGiABIAAgA2o6AM\
gBDC4LIAUgAGogAiADEJUBGiABIAAgA2o6AGgMLQsgBCALNgKMASAEIAk2AogBIAQgDDYChAEgBCAI\
NgKAASAEIA02AnwgBCAKNgJ4IAQgDjYCdCAEIA82AnBBiJHAACAEQfAAakGch8AAQfyGwAAQYgALIA\
YgAGogAiADEJUBGiABIAAgA2o6ANgCDCsLIAYgAGogAiADEJUBGiABIAAgA2o6ANACDCoLIAYgAGog\
AiADEJUBGiABIAAgA2o6ALACDCkLIAYgAGogAiADEJUBGiABIAAgA2o6AJACDCgLIAUgAGogAiADEJ\
UBGiABIAAgA2o6AFgMJwsgBiAAaiACIAMQlQEaIAEgACADajoAWAwmCyAFIABqIAIgAxCVARogASAA\
IANqOgBgDCULIAYgAGogAiADEJUBGiABIAAgA2o6AGAMJAsgBiAAaiACIAMQlQEaIAEgACADajoA2A\
IMIwsgBiAAaiACIAMQlQEaIAEgACADajoA0AIMIgsgBiAAaiACIAMQlQEaIAEgACADajoAsAIMIQsg\
BiAAaiACIAMQlQEaIAEgACADajoAkAIMIAsgBiAAaiACIAMQlQEaIAEgACADajoAaAwfCyAGIABqIA\
IgAxCVARogASAAIANqOgBoDB4LIAYgAGogAiADEJUBGiABIAAgA2o6ANABDB0LIAYgAGogAiADEJUB\
GiABIAAgA2o6ANABDBwLIAYgAGogAiADEJUBGiABIAAgA2o6APACDBsLIAYgAGogAiADEJUBGiABIA\
AgA2o6ANACDBoLIAUgCCAHEJUBGgsgASAHOgBgDBgLAkAgAEGJAU8NACAGIAIgBWogABCVARogASAA\
OgDQAgwYCyAAQYgBQYCAwAAQjAEACwJAIABBqQFPDQAgBiACIAVqIAAQlQEaIAEgADoA8AIMFwsgAE\
GoAUGAgMAAEIwBAAsgBiAFIAAQlQEaIAEgADoA0AEMFQsgBiAFIAAQlQEaIAEgADoA0AEMFAsgBiAF\
IAAQlQEaIAEgADoAaAwTCyAGIAUgABCVARogASAAOgBoDBILAkAgAEHJAE8NACAGIAIgBWogABCVAR\
ogASAAOgCQAgwSCyAAQcgAQYCAwAAQjAEACwJAIABB6QBPDQAgBiACIAVqIAAQlQEaIAEgADoAsAIM\
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\
ajYCCCAAIBEgCiAXaiAcIBsgGUEKdyIKQX9zcnNqQc76z8p6akEIdyAYaiIPQQp3aiADIBZqIAQgDU\
EKdyIDcyAMc2pBD3cgDmoiDUEKdyIWajYCBCAAIBMgASAYaiAPIBwgG0EKdyIBQX9zcnNqQc76z8p6\
akEFdyAKaiIJaiAOIAJqIAwgBEEKdyICcyANc2pBDXcgA2oiBEEKd2o2AgAgACgCECEMIAAgASAVai\
AGIApqIAkgDyAgQX9zcnNqQc76z8p6akEGd2ogAyALaiANIAVzIARzakELdyACaiIKajYCECAAIAEg\
DGogBWogAiAHaiAEIBZzIApzakELd2o2AgwLhCgCMH8BfiMAQcAAayIDQRhqIgRCADcDACADQSBqIg\
VCADcDACADQThqIgZCADcDACADQTBqIgdCADcDACADQShqIghCADcDACADQQhqIgkgASkACDcDACAD\
QRBqIgogASkAEDcDACAEIAEoABgiCzYCACAFIAEoACAiBDYCACADIAEpAAA3AwAgAyABKAAcIgU2Ah\
wgAyABKAAkIgw2AiQgCCABKAAoIg02AgAgAyABKAAsIgg2AiwgByABKAAwIg42AgAgAyABKAA0Igc2\
AjQgBiABKAA4Ig82AgAgAyABKAA8IgE2AjwgACAIIAEgBCAFIAcgCCALIAQgDCAMIA0gDyABIAQgBC\
ALIAEgDSAPIAggBSAHIAEgBSAIIAsgByAHIA4gBSALIABBJGoiECgCACIRIABBFGoiEigCACITamoi\
BkGZmoPfBXNBEHciFEG66r+qemoiFSARc0EUdyIWIAZqaiIXIBRzQRh3IhggFWoiGSAWc0EZdyIaIA\
BBIGoiGygCACIVIABBEGoiHCgCACIdaiAKKAIAIgZqIgogAnNBq7OP/AFzQRB3Ih5B8ua74wNqIh8g\
FXNBFHciICAKaiADKAIUIgJqIiFqaiIiIABBHGoiIygCACIWIABBDGoiJCgCACIlaiAJKAIAIglqIg\
ogACkDACIzQiCIp3NBjNGV2HlzQRB3IhRBhd2e23tqIiYgFnNBFHciJyAKaiADKAIMIgpqIiggFHNB\
GHciKXNBEHciKiAAQRhqIisoAgAiLCAAKAIIIi1qIAMoAgAiFGoiLiAzp3NB/6S5iAVzQRB3Ii9B58\
yn0AZqIjAgLHNBFHciMSAuaiADKAIEIgNqIi4gL3NBGHciLyAwaiIwaiIyIBpzQRR3IhogImpqIiIg\
KnNBGHciKiAyaiIyIBpzQRl3IhogASAPIBcgMCAxc0EZdyIwamoiFyAhIB5zQRh3Ih5zQRB3IiEgKS\
AmaiImaiIpIDBzQRR3IjAgF2pqIhdqaiIxIAwgBCAmICdzQRl3IiYgLmpqIicgGHNBEHciGCAeIB9q\
Ih5qIh8gJnNBFHciJiAnamoiJyAYc0EYdyIYc0EQdyIuIAggDSAeICBzQRl3Ih4gKGpqIiAgL3NBEH\
ciKCAZaiIZIB5zQRR3Ih4gIGpqIiAgKHNBGHciKCAZaiIZaiIvIBpzQRR3IhogMWpqIjEgLnNBGHci\
LiAvaiIvIBpzQRl3IhogASAMICIgGSAec0EZdyIZamoiHiAXICFzQRh3IhdzQRB3IiEgGCAfaiIYai\
IfIBlzQRR3IhkgHmpqIh5qaiIiIAQgICAYICZzQRl3IhhqIAZqIiAgKnNBEHciJiAXIClqIhdqIikg\
GHNBFHciGCAgamoiICAmc0EYdyImc0EQdyIqIA0gDyAXIDBzQRl3IhcgJ2pqIicgKHNBEHciKCAyai\
IwIBdzQRR3IhcgJ2pqIicgKHNBGHciKCAwaiIwaiIyIBpzQRR3IhogImpqIiIgKnNBGHciKiAyaiIy\
IBpzQRl3IhogMSAwIBdzQRl3IhdqIAJqIjAgHiAhc0EYdyIec0EQdyIhICYgKWoiJmoiKSAXc0EUdy\
IXIDBqIApqIjBqaiIxIA4gJiAYc0EZdyIYICdqIANqIiYgLnNBEHciJyAeIB9qIh5qIh8gGHNBFHci\
GCAmamoiJiAnc0EYdyInc0EQdyIuIB4gGXNBGXciGSAgaiAUaiIeIChzQRB3IiAgL2oiKCAZc0EUdy\
IZIB5qIAlqIh4gIHNBGHciICAoaiIoaiIvIBpzQRR3IhogMWpqIjEgLnNBGHciLiAvaiIvIBpzQRl3\
IhogIiAoIBlzQRl3IhlqIAJqIiIgMCAhc0EYdyIhc0EQdyIoICcgH2oiH2oiJyAZc0EUdyIZICJqIA\
lqIiJqaiIwIA4gHiAfIBhzQRl3IhhqaiIeICpzQRB3Ih8gISApaiIhaiIpIBhzQRR3IhggHmogFGoi\
HiAfc0EYdyIfc0EQdyIqIAQgCCAhIBdzQRl3IhcgJmpqIiEgIHNBEHciICAyaiImIBdzQRR3IhcgIW\
pqIiEgIHNBGHciICAmaiImaiIyIBpzQRR3IhogMGogA2oiMCAqc0EYdyIqIDJqIjIgGnNBGXciGiAM\
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\
CCIJQRh0IAlBCHRBgID8B3FyIAlBCHZBgP4DcSAJQRh2cnI2AgggAyABKAAMIglBGHQgCUEIdEGAgP\
wHcXIgCUEIdkGA/gNxIAlBGHZycjYCDCADIAEoABAiCUEYdCAJQQh0QYCA/AdxciAJQQh2QYD+A3Eg\
CUEYdnJyNgIQIAMgASgAFCIJQRh0IAlBCHRBgID8B3FyIAlBCHZBgP4DcSAJQRh2cnI2AhQgAyABKA\
AcIglBGHQgCUEIdEGAgPwHcXIgCUEIdkGA/gNxIAlBGHZyciIKNgIcIAMgASgAICIJQRh0IAlBCHRB\
gID8B3FyIAlBCHZBgP4DcSAJQRh2cnIiCzYCICADIAEoABgiCUEYdCAJQQh0QYCA/AdxciAJQQh2QY\
D+A3EgCUEYdnJyIgw2AhggAygCACENIAMoAgQhDiADKAIIIQ8gAygCECEQIAMoAgwhESADKAIUIRIg\
AyABKAAkIglBGHQgCUEIdEGAgPwHcXIgCUEIdkGA/gNxIAlBGHZyciITNgIkIAMgASgAKCIJQRh0IA\
lBCHRBgID8B3FyIAlBCHZBgP4DcSAJQRh2cnIiFDYCKCADIAEoADAiCUEYdCAJQQh0QYCA/AdxciAJ\
QQh2QYD+A3EgCUEYdnJyIhU2AjAgAyABKAAsIglBGHQgCUEIdEGAgPwHcXIgCUEIdkGA/gNxIAlBGH\
ZyciIWNgIsIAMgASgANCIJQRh0IAlBCHRBgID8B3FyIAlBCHZBgP4DcSAJQRh2cnIiCTYCNCADIAEo\
ADgiF0EYdCAXQQh0QYCA/AdxciAXQQh2QYD+A3EgF0EYdnJyIhc2AjggAyABKAA8IhhBGHQgGEEIdE\
GAgPwHcXIgGEEIdkGA/gNxIBhBGHZyciIYNgI8IAUgEyAKcyAYcyAMIBBzIBVzIBEgDnMgE3MgF3NB\
AXciGXNBAXciGnNBAXciGyAKIBJzIAlzIBAgD3MgFHMgGHNBAXciHHNBAXciHXMgGCAJcyAdcyAVIB\
RzIBxzIBtzQQF3Ih5zQQF3Ih9zIBogHHMgHnMgGSAYcyAbcyAXIBVzIBpzIBYgE3MgGXMgCyAMcyAX\
cyASIBFzIBZzIA8gDXMgC3MgCXNBAXciIHNBAXciIXNBAXciInNBAXciI3NBAXciJHNBAXciJXNBAX\
ciJnNBAXciJyAdICFzIAkgFnMgIXMgFCALcyAgcyAdc0EBdyIoc0EBdyIpcyAcICBzIChzIB9zQQF3\
IipzQQF3IitzIB8gKXMgK3MgHiAocyAqcyAnc0EBdyIsc0EBdyItcyAmICpzICxzICUgH3MgJ3MgJC\
AecyAmcyAjIBtzICVzICIgGnMgJHMgISAZcyAjcyAgIBdzICJzIClzQQF3Ii5zQQF3Ii9zQQF3IjBz\
QQF3IjFzQQF3IjJzQQF3IjNzQQF3IjRzQQF3IjUgKyAvcyApICNzIC9zICggInMgLnMgK3NBAXciNn\
NBAXciN3MgKiAucyA2cyAtc0EBdyI4c0EBdyI5cyAtIDdzIDlzICwgNnMgOHMgNXNBAXciOnNBAXci\
O3MgNCA4cyA6cyAzIC1zIDVzIDIgLHMgNHMgMSAncyAzcyAwICZzIDJzIC8gJXMgMXMgLiAkcyAwcy\
A3c0EBdyI8c0EBdyI9c0EBdyI+c0EBdyI/c0EBdyJAc0EBdyJBc0EBdyJCc0EBdyJDIDkgPXMgNyAx\
cyA9cyA2IDBzIDxzIDlzQQF3IkRzQQF3IkVzIDggPHMgRHMgO3NBAXciRnNBAXciR3MgOyBFcyBHcy\
A6IERzIEZzIENzQQF3IkhzQQF3IklzIEIgRnMgSHMgQSA7cyBDcyBAIDpzIEJzID8gNXMgQXMgPiA0\
cyBAcyA9IDNzID9zIDwgMnMgPnMgRXNBAXciSnNBAXciS3NBAXciTHNBAXciTXNBAXciTnNBAXciT3\
NBAXciUHNBAXdqIEYgSnMgRCA+cyBKcyBHc0EBdyJRcyBJc0EBdyJSIEUgP3MgS3MgUXNBAXciUyBM\
IEEgOiA5IDwgMSAmIB8gKCAhIBcgEyAQIAVBHnciVGogDiAHIAZBHnciECACcyAFcSACc2pqIA0gCC\
AFQQV3aiACIAdzIAZxIAdzampBmfOJ1AVqIg5BBXdqQZnzidQFaiJVQR53IgUgDkEedyINcyACIA9q\
IA4gVCAQc3EgEHNqIFVBBXdqQZnzidQFaiIOcSANc2ogECARaiBVIA0gVHNxIFRzaiAOQQV3akGZ84\
nUBWoiEEEFd2pBmfOJ1AVqIhFBHnciD2ogBSAMaiARIBBBHnciEyAOQR53IgxzcSAMc2ogDSASaiAM\
IAVzIBBxIAVzaiARQQV3akGZ84nUBWoiEUEFd2pBmfOJ1AVqIhJBHnciBSARQR53IhBzIAogDGogES\
APIBNzcSATc2ogEkEFd2pBmfOJ1AVqIgpxIBBzaiALIBNqIBAgD3MgEnEgD3NqIApBBXdqQZnzidQF\
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\
AWpBADoAAAwVCyABQQhqKAIAIQMgAkHQAGpBCGoQeyACQQhqQSBqIAJB+ABqKQMAIgU3AwAgAkEIak\
EYaiACQdAAakEgaikDACIGNwMAIAJBCGpBEGogAkHQAGpBGGopAwAiBzcDACACQQhqQQhqIAJB0ABq\
QRBqKQMAIgg3AwAgAiACKQNYIgk3AwggA0EgaiAFNwMAIANBGGogBjcDACADQRBqIAc3AwAgA0EIai\
AINwMAIAMgCTcDACADQegAakEAOgAADBQLIAFBCGooAgAiA0IANwMAIAMgAykDcDcDCCADQRBqIANB\
+ABqKQMANwMAIANBGGogA0GAAWopAwA3AwAgA0EgaiADQYgBaikDADcDACADQShqQQBBwgAQlAEaIA\
MoApABRQ0TIANBADYCkAEMEwsgAUEIaigCAEEAQcgBEJQBQdgCakEAOgAADBILIAFBCGooAgBBAEHI\
ARCUAUHQAmpBADoAAAwRCyABQQhqKAIAQQBByAEQlAFBsAJqQQA6AAAMEAsgAUEIaigCAEEAQcgBEJ\
QBQZACakEAOgAADA8LIAFBCGooAgAiA0L+uevF6Y6VmRA3AxAgA0KBxpS6lvHq5m83AwggA0IANwMA\
IANB2ABqQQA6AAAMDgsgAUEIaigCACIDQv6568XpjpWZEDcDECADQoHGlLqW8ermbzcDCCADQgA3Aw\
AgA0HYAGpBADoAAAwNCyABQQhqKAIAIgNCADcDACADQQApA+iMQDcDCCADQRBqQQApA/CMQDcDACAD\
QRhqQQAoAviMQDYCACADQeAAakEAOgAADAwLIAFBCGooAgAiA0Hww8uefDYCGCADQv6568XpjpWZED\
cDECADQoHGlLqW8ermbzcDCCADQgA3AwAgA0HgAGpBADoAAAwLCyABQQhqKAIAQQBByAEQlAFB2AJq\
QQA6AAAMCgsgAUEIaigCAEEAQcgBEJQBQdACakEAOgAADAkLIAFBCGooAgBBAEHIARCUAUGwAmpBAD\
oAAAwICyABQQhqKAIAQQBByAEQlAFBkAJqQQA6AAAMBwsgAUEIaigCACIDQgA3AwAgA0EAKQOgjUA3\
AwggA0EQakEAKQOojUA3AwAgA0EYakEAKQOwjUA3AwAgA0EgakEAKQO4jUA3AwAgA0HoAGpBADoAAA\
wGCyABQQhqKAIAIgNCADcDACADQQApA4CNQDcDCCADQRBqQQApA4iNQDcDACADQRhqQQApA5CNQDcD\
ACADQSBqQQApA5iNQDcDACADQegAakEAOgAADAULIAFBCGooAgAiA0IANwNAIANBACkDgI5ANwMAIA\
NByABqQgA3AwAgA0EIakEAKQOIjkA3AwAgA0EQakEAKQOQjkA3AwAgA0EYakEAKQOYjkA3AwAgA0Eg\
akEAKQOgjkA3AwAgA0EoakEAKQOojkA3AwAgA0EwakEAKQOwjkA3AwAgA0E4akEAKQO4jkA3AwAgA0\
HQAWpBADoAAAwECyABQQhqKAIAIgNCADcDQCADQQApA8CNQDcDACADQcgAakIANwMAIANBCGpBACkD\
yI1ANwMAIANBEGpBACkD0I1ANwMAIANBGGpBACkD2I1ANwMAIANBIGpBACkD4I1ANwMAIANBKGpBAC\
kD6I1ANwMAIANBMGpBACkD8I1ANwMAIANBOGpBACkD+I1ANwMAIANB0AFqQQA6AAAMAwsgAUEIaigC\
AEEAQcgBEJQBQfACakEAOgAADAILIAFBCGooAgBBAEHIARCUAUHQAmpBADoAAAwBCyABQQhqKAIAIg\
NCADcDACADQQApA7iRQDcDCCADQRBqQQApA8CRQDcDACADQRhqQQApA8iRQDcDACADQeAAakEAOgAA\
CyABQQA2AgAgAEIANwMAIAJBoAFqJAAPCxCRAQALEJIBAAumDQECfyMAQZACayIDJAACQAJAAkACQA\
JAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAIAJBfWoOCQMMCgsBBQwCAAwLAkAC\
QCABQZeAwABBCxCWAUUNACABQaKAwABBCxCWAUUNASABQa2AwABBCxCWAQ0NQdABEBkiAUUNFyADQZ\
ABaiICQTAQdCABIAJByAAQlQEhAiADQQA2AgAgAyADQQRyQQBBgAEQlAFBf3NqQYQBakEHSRogA0GA\
ATYCACADQYgBaiADQYQBEJUBGiACQcgAaiADQYgBakEEckGAARCVARogAkHIAWpBADoAAEEDIQIMFQ\
tB0AEQGSIBRQ0WIANBkAFqIgJBHBB0IAEgAkHIABCVASECIANBADYCACADIANBBHJBAEGAARCUAUF/\
c2pBhAFqQQdJGiADQYABNgIAIANBiAFqIANBhAEQlQEaIAJByABqIANBiAFqQQRyQYABEJUBGiACQc\
gBakEAOgAAQQEhAgwUC0HQARAZIgFFDRUgA0GQAWoiAkEgEHQgASACQcgAEJUBIQIgA0EANgIAIAMg\
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\
IGohCiACQRBqIQsgAkEYaiEMIANBfmpBN0khDQNAIAAgBTYCkAEgAkEIaiIDIAdBKGopAAA3AwAgCy\
AHQTBqKQAANwMAIAwgB0E4aikAADcDACACIAdBIGopAAA3AwAgBUUNAiAAIAVBf2oiDjYCkAEgAC0A\
aiEPIAogAikDADcAACAKQQhqIAMpAwA3AAAgCkEQaiALKQMANwAAIApBGGogDCkDADcAACACQZABak\
EYaiIDIAdBGGoiECkAADcDACACQZABakEQaiIRIAdBEGoiEikAADcDACACQZABakEIaiITIAdBCGoi\
FCkAADcDACAJIAYpAwA3AwAgCUEIaiAGQQhqIhUpAwA3AwAgCUEQaiAGQRBqIhYpAwA3AwAgCUEYai\
AGQRhqIhcpAwA3AwAgAiAHKQAANwOQASAIQThqIAJBkAFqQThqKQMANwAAIAhBMGogAkGQAWpBMGop\
AwA3AAAgCEEoaiACQZABakEoaikDADcAACAIQSBqIAopAwA3AAAgCEEYaiADKQMANwAAIAhBEGogES\
kDADcAACAIQQhqIBMpAwA3AAAgCCACKQOQATcAACACQcAAOgCIASACIA9BBHIiDzoAiQEgAkIANwMg\
IAMgFykCADcDACARIBYpAgA3AwAgEyAVKQIANwMAIAIgBikCADcDkAEgAkGQAWogCEHAAEIAIA8QGC\
ADKAIAIQMgESgCACERIBMoAgAhEyACKAKsASEPIAIoAqQBIRUgAigCnAEhFiACKAKUASEXIAIoApAB\
IRggDUUNAyAHIBg2AgAgB0EcaiAPNgIAIBAgAzYCACAHQRRqIBU2AgAgEiARNgIAIAdBDGogFjYCAC\
AUIBM2AgAgB0EEaiAXNgIAIAAgBTYCkAEgB0FgaiEHIA4hBSAOIARPDQALCyACQdABaiQADwtBsJDA\
AEErQbSFwAAQcwALIAIgDzYCrAEgAiADNgKoASACIBU2AqQBIAIgETYCoAEgAiAWNgKcASACIBM2Ap\
gBIAIgFzYClAEgAiAYNgKQAUGIkcAAIAJBkAFqQZyHwABB/IbAABBiAAucBQEKfyMAQTBrIgMkACAD\
QSRqIAE2AgAgA0EDOgAoIANCgICAgIAENwMIIAMgADYCIEEAIQQgA0EANgIYIANBADYCEAJAAkACQA\
JAIAIoAggiBQ0AIAJBFGooAgAiAEUNASACKAIQIQEgAEEDdCEGIABBf2pB/////wFxQQFqIQQgAigC\
ACEAA0ACQCAAQQRqKAIAIgdFDQAgAygCICAAKAIAIAcgAygCJCgCDBEIAA0ECyABKAIAIANBCGogAU\
EEaigCABEGAA0DIAFBCGohASAAQQhqIQAgBkF4aiIGDQAMAgsLIAJBDGooAgAiAUUNACABQQV0IQgg\
AUF/akH///8/cUEBaiEEIAIoAgAhAEEAIQYDQAJAIABBBGooAgAiAUUNACADKAIgIAAoAgAgASADKA\
IkKAIMEQgADQMLIAMgBSAGaiIBQRxqLQAAOgAoIAMgAUEEaikCAEIgiTcDCCABQRhqKAIAIQkgAigC\
ECEKQQAhC0EAIQcCQAJAAkAgAUEUaigCAA4DAQACAQsgCUEDdCEMQQAhByAKIAxqIgxBBGooAgBBBE\
cNASAMKAIAKAIAIQkLQQEhBwsgAyAJNgIUIAMgBzYCECABQRBqKAIAIQcCQAJAAkAgAUEMaigCAA4D\
AQACAQsgB0EDdCEJIAogCWoiCUEEaigCAEEERw0BIAkoAgAoAgAhBwtBASELCyADIAc2AhwgAyALNg\
IYIAogASgCAEEDdGoiASgCACADQQhqIAEoAgQRBgANAiAAQQhqIQAgCCAGQSBqIgZHDQALCwJAIAQg\
AigCBE8NACADKAIgIAIoAgAgBEEDdGoiASgCACABKAIEIAMoAiQoAgwRCAANAQtBACEBDAELQQEhAQ\
sgA0EwaiQAIAELmgQCA38CfiMAQfABayIDJAAgACkDACEGIAEgAS0AQCIEaiIFQYABOgAAIANBCGpB\
EGogAEEYaigCADYCACADQRBqIABBEGopAgA3AwAgAyAAKQIINwMIIAZCCYYhBiAErUIDhiEHAkAgBE\
E/cyIARQ0AIAVBAWpBACAAEJQBGgsgBiAHhCEGAkACQCAEQThxQThGDQAgASAGNwA4IANBCGogARAT\
DAELIANBCGogARATIANB4ABqQQxqQgA3AgAgA0HgAGpBFGpCADcCACADQeAAakEcakIANwIAIANB4A\
BqQSRqQgA3AgAgA0HgAGpBLGpCADcCACADQeAAakE0akIANwIAIANBnAFqQgA3AgAgA0IANwJkIANB\
ADYCYCADQeAAaiADQeAAakEEckF/c2pBxABqQQdJGiADQcAANgJgIANBqAFqIANB4ABqQcQAEJUBGi\
ADQdAAaiADQagBakE0aikCADcDACADQcgAaiADQagBakEsaikCADcDACADQcAAaiADQagBakEkaikC\
ADcDACADQThqIANBqAFqQRxqKQIANwMAIANBMGogA0GoAWpBFGopAgA3AwAgA0EoaiADQagBakEMai\
kCADcDACADIAMpAqwBNwMgIAMgBjcDWCADQQhqIANBIGoQEwsgAUEAOgBAIAIgAygCCDYAACACIAMp\
Agw3AAQgAiADKQIUNwAMIANB8AFqJAALigQBCn8jAEEwayIGJABBACEHIAZBADYCCAJAIAFBQHEiCE\
UNAEEBIQcgBkEBNgIIIAYgADYCACAIQcAARg0AQQIhByAGQQI2AgggBiAAQcAAajYCBCAIQYABRg0A\
IAYgAEGAAWo2AhBBiJHAACAGQRBqQYyHwABB/IbAABBiAAsgAUE/cSEJAkAgByAFQQV2IgEgByABSR\
siAUUNACADQQRyIQogAUEFdCELQQAhAyAGIQwDQCAMKAIAIQEgBkEQakEYaiINIAJBGGopAgA3AwAg\
BkEQakEQaiIOIAJBEGopAgA3AwAgBkEQakEIaiIPIAJBCGopAgA3AwAgBiACKQIANwMQIAZBEGogAU\
HAAEIAIAoQGCAEIANqIgFBGGogDSkDADcAACABQRBqIA4pAwA3AAAgAUEIaiAPKQMANwAAIAEgBikD\
EDcAACAMQQRqIQwgCyADQSBqIgNHDQALCwJAAkACQAJAIAlFDQAgB0EFdCICIAVLDQEgBSACayIBQR\
9NDQIgCUEgRw0DIAQgAmoiAiAAIAhqIgEpAAA3AAAgAkEYaiABQRhqKQAANwAAIAJBEGogAUEQaikA\
ADcAACACQQhqIAFBCGopAAA3AAAgB0EBaiEHCyAGQTBqJAAgBw8LIAIgBUG0hMAAEI0BAAtBICABQb\
SEwAAQjAEAC0EgIAlBxITAABBrAAvyAwIDfwJ+IwBB4AFrIgMkACAAKQMAIQYgASABLQBAIgRqIgVB\
gAE6AAAgA0EIaiAAQRBqKQIANwMAIAMgACkCCDcDACAGQgmGIQYgBK1CA4YhBwJAIARBP3MiAEUNAC\
AFQQFqQQAgABCUARoLIAYgB4QhBgJAAkAgBEE4cUE4Rg0AIAEgBjcAOCADIAEQHQwBCyADIAEQHSAD\
QdAAakEMakIANwIAIANB0ABqQRRqQgA3AgAgA0HQAGpBHGpCADcCACADQdAAakEkakIANwIAIANB0A\
BqQSxqQgA3AgAgA0HQAGpBNGpCADcCACADQYwBakIANwIAIANCADcCVCADQQA2AlAgA0HQAGogA0HQ\
AGpBBHJBf3NqQcQAakEHSRogA0HAADYCUCADQZgBaiADQdAAakHEABCVARogA0HAAGogA0GYAWpBNG\
opAgA3AwAgA0E4aiADQZgBakEsaikCADcDACADQTBqIANBmAFqQSRqKQIANwMAIANBKGogA0GYAWpB\
HGopAgA3AwAgA0EgaiADQZgBakEUaikCADcDACADQRhqIANBmAFqQQxqKQIANwMAIAMgAykCnAE3Ax\
AgAyAGNwNIIAMgA0EQahAdCyABQQA6AEAgAiADKQMANwAAIAIgAykDCDcACCADQeABaiQAC/IDAgN/\
An4jAEHgAWsiAyQAIAApAwAhBiABIAEtAEAiBGoiBUGAAToAACADQQhqIABBEGopAgA3AwAgAyAAKQ\
IINwMAIAZCCYYhBiAErUIDhiEHAkAgBEE/cyIARQ0AIAVBAWpBACAAEJQBGgsgBiAHhCEGAkACQCAE\
QThxQThGDQAgASAGNwA4IAMgARAbDAELIAMgARAbIANB0ABqQQxqQgA3AgAgA0HQAGpBFGpCADcCAC\
ADQdAAakEcakIANwIAIANB0ABqQSRqQgA3AgAgA0HQAGpBLGpCADcCACADQdAAakE0akIANwIAIANB\
jAFqQgA3AgAgA0IANwJUIANBADYCUCADQdAAaiADQdAAakEEckF/c2pBxABqQQdJGiADQcAANgJQIA\
NBmAFqIANB0ABqQcQAEJUBGiADQcAAaiADQZgBakE0aikCADcDACADQThqIANBmAFqQSxqKQIANwMA\
IANBMGogA0GYAWpBJGopAgA3AwAgA0EoaiADQZgBakEcaikCADcDACADQSBqIANBmAFqQRRqKQIANw\
MAIANBGGogA0GYAWpBDGopAgA3AwAgAyADKQKcATcDECADIAY3A0ggAyADQRBqEBsLIAFBADoAQCAC\
IAMpAwA3AAAgAiADKQMINwAIIANB4AFqJAAL5wMCBH8CfiMAQdABayIDJAAgASABLQBAIgRqIgVBAT\
oAACAAKQMAQgmGIQcgBK1CA4YhCAJAIARBP3MiBkUNACAFQQFqQQAgBhCUARoLIAcgCIQhBwJAAkAg\
BEE4cUE4Rg0AIAEgBzcAOCAAQQhqIAEQFgwBCyAAQQhqIgQgARAWIANBwABqQQxqQgA3AgAgA0HAAG\
pBFGpCADcCACADQcAAakEcakIANwIAIANBwABqQSRqQgA3AgAgA0HAAGpBLGpCADcCACADQcAAakE0\
akIANwIAIANB/ABqQgA3AgAgA0IANwJEIANBADYCQCADQcAAaiADQcAAakEEckF/c2pBxABqQQdJGi\
ADQcAANgJAIANBiAFqIANBwABqQcQAEJUBGiADQTBqIANBiAFqQTRqKQIANwMAIANBKGogA0GIAWpB\
LGopAgA3AwAgA0EgaiADQYgBakEkaikCADcDACADQRhqIANBiAFqQRxqKQIANwMAIANBEGogA0GIAW\
pBFGopAgA3AwAgA0EIaiADQYgBakEMaikCADcDACADIAMpAowBNwMAIAMgBzcDOCAEIAMQFgsgAUEA\
OgBAIAIgACkDCDcAACACIABBEGopAwA3AAggAiAAQRhqKQMANwAQIANB0AFqJAALgAMBBX8CQAJAAk\
AgAUEJSQ0AQQAhAkHN/3sgAUEQIAFBEEsbIgFrIABNDQEgAUEQIABBC2pBeHEgAEELSRsiA2pBDGoQ\
GSIARQ0BIABBeGohAgJAAkAgAUF/aiIEIABxDQAgAiEBDAELIABBfGoiBSgCACIGQXhxIAQgAGpBAC\
ABa3FBeGoiAEEAIAEgACACa0EQSxtqIgEgAmsiAGshBAJAIAZBA3FFDQAgASABKAIEQQFxIARyQQJy\
NgIEIAEgBGoiBCAEKAIEQQFyNgIEIAUgBSgCAEEBcSAAckECcjYCACACIABqIgQgBCgCBEEBcjYCBC\
ACIAAQJAwBCyACKAIAIQIgASAENgIEIAEgAiAAajYCAAsgASgCBCIAQQNxRQ0CIABBeHEiAiADQRBq\
TQ0CIAEgAEEBcSADckECcjYCBCABIANqIgAgAiADayIDQQNyNgIEIAEgAmoiAiACKAIEQQFyNgIEIA\
AgAxAkDAILIAAQGSECCyACDwsgAUEIaguLAwECfyMAQZABayIAJAACQEHwABAZIgFFDQAgAEEMakIA\
NwIAIABBFGpCADcCACAAQRxqQgA3AgAgAEEkakIANwIAIABBLGpCADcCACAAQTRqQgA3AgAgAEE8ak\
IANwIAIABCADcCBCAAQQA2AgAgACAAQQRyQX9zakHEAGpBB0kaIABBwAA2AgAgAEHIAGogAEHEABCV\
ARogAUHgAGogAEHIAGpBPGopAgA3AAAgAUHYAGogAEHIAGpBNGopAgA3AAAgAUHQAGogAEHIAGpBLG\
opAgA3AAAgAUHIAGogAEHIAGpBJGopAgA3AAAgAUHAAGogAEHIAGpBHGopAgA3AAAgAUE4aiAAQcgA\
akEUaikCADcAACABQTBqIABByABqQQxqKQIANwAAIAEgACkCTDcAKCABQgA3AwAgAUHoAGpBADoAAC\
ABQQApA6CNQDcDCCABQRBqQQApA6iNQDcDACABQRhqQQApA7CNQDcDACABQSBqQQApA7iNQDcDACAA\
QZABaiQAIAEPCwALiwMBAn8jAEGQAWsiACQAAkBB8AAQGSIBRQ0AIABBDGpCADcCACAAQRRqQgA3Ag\
AgAEEcakIANwIAIABBJGpCADcCACAAQSxqQgA3AgAgAEE0akIANwIAIABBPGpCADcCACAAQgA3AgQg\
AEEANgIAIAAgAEEEckF/c2pBxABqQQdJGiAAQcAANgIAIABByABqIABBxAAQlQEaIAFB4ABqIABByA\
BqQTxqKQIANwAAIAFB2ABqIABByABqQTRqKQIANwAAIAFB0ABqIABByABqQSxqKQIANwAAIAFByABq\
IABByABqQSRqKQIANwAAIAFBwABqIABByABqQRxqKQIANwAAIAFBOGogAEHIAGpBFGopAgA3AAAgAU\
EwaiAAQcgAakEMaikCADcAACABIAApAkw3ACggAUIANwMAIAFB6ABqQQA6AAAgAUEAKQOAjUA3Awgg\
AUEQakEAKQOIjUA3AwAgAUEYakEAKQOQjUA3AwAgAUEgakEAKQOYjUA3AwAgAEGQAWokACABDwsAC/\
sCAQJ/IwBBkAFrIgAkAAJAQegAEBkiAUUNACAAQQxqQgA3AgAgAEEUakIANwIAIABBHGpCADcCACAA\
QSRqQgA3AgAgAEEsakIANwIAIABBNGpCADcCACAAQTxqQgA3AgAgAEIANwIEIABBADYCACAAIABBBH\
JBf3NqQcQAakEHSRogAEHAADYCACAAQcgAaiAAQcQAEJUBGiABQdgAaiAAQcgAakE8aikCADcAACAB\
QdAAaiAAQcgAakE0aikCADcAACABQcgAaiAAQcgAakEsaikCADcAACABQcAAaiAAQcgAakEkaikCAD\
cAACABQThqIABByABqQRxqKQIANwAAIAFBMGogAEHIAGpBFGopAgA3AAAgAUEoaiAAQcgAakEMaikC\
ADcAACABIAApAkw3ACAgAUIANwMAIAFB4ABqQQA6AAAgAUEAKQPojEA3AwggAUEQakEAKQPwjEA3Aw\
AgAUEYakEAKAL4jEA2AgAgAEGQAWokACABDwsAC/sCAQJ/IwBBkAFrIgAkAAJAQegAEBkiAUUNACAB\
QgA3AwAgAUEAKQO4kUA3AwggAUEQakEAKQPAkUA3AwAgAUEYakEAKQPIkUA3AwAgAEEMakIANwIAIA\
BBFGpCADcCACAAQRxqQgA3AgAgAEEkakIANwIAIABBLGpCADcCACAAQTRqQgA3AgAgAEE8akIANwIA\
IABCADcCBCAAQQA2AgAgACAAQQRyQX9zakHEAGpBB0kaIABBwAA2AgAgAEHIAGogAEHEABCVARogAU\
HYAGogAEHIAGpBPGopAgA3AAAgAUHQAGogAEHIAGpBNGopAgA3AAAgAUHIAGogAEHIAGpBLGopAgA3\
AAAgAUHAAGogAEHIAGpBJGopAgA3AAAgAUE4aiAAQcgAakEcaikCADcAACABQTBqIABByABqQRRqKQ\
IANwAAIAFBKGogAEHIAGpBDGopAgA3AAAgASAAKQJMNwAgIAFB4ABqQQA6AAAgAEGQAWokACABDwsA\
C6kDAQF/IAIgAi0AqAEiA2pBAEGoASADaxCUASEDIAJBADoAqAEgA0EfOgAAIAIgAi0ApwFBgAFyOg\
CnASABIAEpAwAgAikAAIU3AwAgASABKQMIIAIpAAiFNwMIIAEgASkDECACKQAQhTcDECABIAEpAxgg\
AikAGIU3AxggASABKQMgIAIpACCFNwMgIAEgASkDKCACKQAohTcDKCABIAEpAzAgAikAMIU3AzAgAS\
ABKQM4IAIpADiFNwM4IAEgASkDQCACKQBAhTcDQCABIAEpA0ggAikASIU3A0ggASABKQNQIAIpAFCF\
NwNQIAEgASkDWCACKQBYhTcDWCABIAEpA2AgAikAYIU3A2AgASABKQNoIAIpAGiFNwNoIAEgASkDcC\
ACKQBwhTcDcCABIAEpA3ggAikAeIU3A3ggASABKQOAASACKQCAAYU3A4ABIAEgASkDiAEgAikAiAGF\
NwOIASABIAEpA5ABIAIpAJABhTcDkAEgASABKQOYASACKQCYAYU3A5gBIAEgASkDoAEgAikAoAGFNw\
OgASABECUgACABQcgBEJUBGgvvAgEDfwJAAkACQAJAIAAtAGgiA0UNAAJAIANBwQBPDQAgAEEoaiIE\
IANqIAFBwAAgA2siAyACIAMgAkkbIgMQlQEaIAAgAC0AaCADaiIFOgBoIAEgA2ohAQJAIAIgA2siAg\
0AQQAhAgwDCyAAQQhqIARBwAAgACkDACAALQBqIABB6QBqIgMtAABFchAYIARBAEHBABCUARogAyAD\
LQAAQQFqOgAADAELIANBwABBlITAABCNAQALQQAhAyACQcEASQ0BIABBCGohBCAAQekAaiIDLQAAIQ\
UDQCAEIAFBwAAgACkDACAALQBqIAVB/wFxRXIQGCADIAMtAABBAWoiBToAACABQcAAaiEBIAJBQGoi\
AkHAAEsNAAsgAC0AaCEFCyAFQf8BcSIDQcEATw0BCyAAIANqQShqIAFBwAAgA2siAyACIAMgAkkbIg\
IQlQEaIAAgAC0AaCACajoAaCAADwsgA0HAAEGUhMAAEI0BAAudAwECfyMAQRBrIgMkACABIAEtAJAB\
IgRqQQBBkAEgBGsQlAEhBCABQQA6AJABIARBAToAACABIAEtAI8BQYABcjoAjwEgACAAKQMAIAEpAA\
CFNwMAIAAgACkDCCABKQAIhTcDCCAAIAApAxAgASkAEIU3AxAgACAAKQMYIAEpABiFNwMYIAAgACkD\
ICABKQAghTcDICAAIAApAyggASkAKIU3AyggACAAKQMwIAEpADCFNwMwIAAgACkDOCABKQA4hTcDOC\
AAIAApA0AgASkAQIU3A0AgACAAKQNIIAEpAEiFNwNIIAAgACkDUCABKQBQhTcDUCAAIAApA1ggASkA\
WIU3A1ggACAAKQNgIAEpAGCFNwNgIAAgACkDaCABKQBohTcDaCAAIAApA3AgASkAcIU3A3AgACAAKQ\
N4IAEpAHiFNwN4IAAgACkDgAEgASkAgAGFNwOAASAAIAApA4gBIAEpAIgBhTcDiAEgABAlIAIgACkD\
ADcAACACIAApAwg3AAggAiAAKQMQNwAQIAIgACkDGD4AGCADQRBqJAALnQMBAn8jAEEQayIDJAAgAS\
ABLQCQASIEakEAQZABIARrEJQBIQQgAUEAOgCQASAEQQY6AAAgASABLQCPAUGAAXI6AI8BIAAgACkD\
ACABKQAAhTcDACAAIAApAwggASkACIU3AwggACAAKQMQIAEpABCFNwMQIAAgACkDGCABKQAYhTcDGC\
AAIAApAyAgASkAIIU3AyAgACAAKQMoIAEpACiFNwMoIAAgACkDMCABKQAwhTcDMCAAIAApAzggASkA\
OIU3AzggACAAKQNAIAEpAECFNwNAIAAgACkDSCABKQBIhTcDSCAAIAApA1AgASkAUIU3A1AgACAAKQ\
NYIAEpAFiFNwNYIAAgACkDYCABKQBghTcDYCAAIAApA2ggASkAaIU3A2ggACAAKQNwIAEpAHCFNwNw\
IAAgACkDeCABKQB4hTcDeCAAIAApA4ABIAEpAIABhTcDgAEgACAAKQOIASABKQCIAYU3A4gBIAAQJS\
ACIAApAwA3AAAgAiAAKQMINwAIIAIgACkDEDcAECACIAApAxg+ABggA0EQaiQAC5YDAQR/IwBBkARr\
IgMkAAJAIAJFDQAgAkGoAWwhBCADQeACakEEciEFIANBsAFqIANBsAFqQQRyIgZBf3NqQawBakEHSR\
oDQCAAKAIAIQIgA0EANgKwASAGQQBBqAEQlAEaIANBqAE2ArABIANB4AJqIANBsAFqQawBEJUBGiAD\
QQhqIAVBqAEQlQEaIAMgAikDADcDCCADIAIpAwg3AxAgAyACKQMQNwMYIAMgAikDGDcDICADIAIpAy\
A3AyggAyACKQMoNwMwIAMgAikDMDcDOCADIAIpAzg3A0AgAyACKQNANwNIIAMgAikDSDcDUCADIAIp\
A1A3A1ggAyACKQNYNwNgIAMgAikDYDcDaCADIAIpA2g3A3AgAyACKQNwNwN4IAMgAikDeDcDgAEgAy\
ACKQOAATcDiAEgAyACKQOIATcDkAEgAyACKQOQATcDmAEgAyACKQOYATcDoAEgAyACKQOgATcDqAEg\
AhAlIAEgA0EIakGoARCVARogAUGoAWohASAEQdh+aiIEDQALCyADQZAEaiQAC/oCAQJ/IwBBkAFrIg\
AkAAJAQegAEBkiAUUNACAAQQxqQgA3AgAgAEEUakIANwIAIABBHGpCADcCACAAQSRqQgA3AgAgAEEs\
akIANwIAIABBNGpCADcCACAAQTxqQgA3AgAgAEIANwIEIABBADYCACAAIABBBHJBf3NqQcQAakEHSR\
ogAEHAADYCACAAQcgAaiAAQcQAEJUBGiABQdgAaiAAQcgAakE8aikCADcAACABQdAAaiAAQcgAakE0\
aikCADcAACABQcgAaiAAQcgAakEsaikCADcAACABQcAAaiAAQcgAakEkaikCADcAACABQThqIABByA\
BqQRxqKQIANwAAIAFBMGogAEHIAGpBFGopAgA3AAAgAUEoaiAAQcgAakEMaikCADcAACABIAApAkw3\
ACAgAUHww8uefDYCGCABQv6568XpjpWZEDcDECABQoHGlLqW8ermbzcDCCABQgA3AwAgAUHgAGpBAD\
oAACAAQZABaiQAIAEPCwAL5AIBBH8jAEGQBGsiAyQAIAMgADYCBCAAQcgBaiEEAkACQAJAAkACQCAA\
QfACai0AACIFRQ0AQagBIAVrIgYgAksNASABIAQgBWogBhCVASAGaiEBIAIgBmshAgsgAiACQagBbi\
IGQagBbCIFSQ0BIANBBGogASAGEDoCQCACIAVrIgINAEEAIQIMBAsgA0EANgKwASADQbABaiADQbAB\
akEEckEAQagBEJQBQX9zakGsAWpBB0kaIANBqAE2ArABIANB4AJqIANBsAFqQawBEJUBGiADQQhqIA\
NB4AJqQQRyQagBEJUBGiADQQRqIANBCGpBARA6IAJBqQFPDQIgASAFaiADQQhqIAIQlQEaIAQgA0EI\
akGoARCVARoMAwsgASAEIAVqIAIQlQEaIAUgAmohAgwCC0HAjMAAQSNBoIzAABBzAAsgAkGoAUGwjM\
AAEIwBAAsgACACOgDwAiADQZAEaiQAC+QCAQR/IwBBsANrIgMkACADIAA2AgQgAEHIAWohBAJAAkAC\
QAJAAkAgAEHQAmotAAAiBUUNAEGIASAFayIGIAJLDQEgASAEIAVqIAYQlQEgBmohASACIAZrIQILIA\
IgAkGIAW4iBkGIAWwiBUkNASADQQRqIAEgBhBDAkAgAiAFayICDQBBACECDAQLIANBADYCkAEgA0GQ\
AWogA0GQAWpBBHJBAEGIARCUAUF/c2pBjAFqQQdJGiADQYgBNgKQASADQaACaiADQZABakGMARCVAR\
ogA0EIaiADQaACakEEckGIARCVARogA0EEaiADQQhqQQEQQyACQYkBTw0CIAEgBWogA0EIaiACEJUB\
GiAEIANBCGpBiAEQlQEaDAMLIAEgBCAFaiACEJUBGiAFIAJqIQIMAgtBwIzAAEEjQaCMwAAQcwALIA\
JBiAFBsIzAABCMAQALIAAgAjoA0AIgA0GwA2okAAuRAwEBfwJAIAJFDQAgASACQagBbGohAyAAKAIA\
IQIDQCACIAIpAwAgASkAAIU3AwAgAiACKQMIIAEpAAiFNwMIIAIgAikDECABKQAQhTcDECACIAIpAx\
ggASkAGIU3AxggAiACKQMgIAEpACCFNwMgIAIgAikDKCABKQAohTcDKCACIAIpAzAgASkAMIU3AzAg\
AiACKQM4IAEpADiFNwM4IAIgAikDQCABKQBAhTcDQCACIAIpA0ggASkASIU3A0ggAiACKQNQIAEpAF\
CFNwNQIAIgAikDWCABKQBYhTcDWCACIAIpA2AgASkAYIU3A2AgAiACKQNoIAEpAGiFNwNoIAIgAikD\
cCABKQBwhTcDcCACIAIpA3ggASkAeIU3A3ggAiACKQOAASABKQCAAYU3A4ABIAIgAikDiAEgASkAiA\
GFNwOIASACIAIpA5ABIAEpAJABhTcDkAEgAiACKQOYASABKQCYAYU3A5gBIAIgAikDoAEgASkAoAGF\
NwOgASACECUgAUGoAWoiASADRw0ACwsL7gIBAn8jAEGQAWsiACQAAkBB4AAQGSIBRQ0AIABBDGpCAD\
cCACAAQRRqQgA3AgAgAEEcakIANwIAIABBJGpCADcCACAAQSxqQgA3AgAgAEE0akIANwIAIABBPGpC\
ADcCACAAQgA3AgQgAEEANgIAIAAgAEEEckF/c2pBxABqQQdJGiAAQcAANgIAIABByABqIABBxAAQlQ\
EaIAFB0ABqIABByABqQTxqKQIANwAAIAFByABqIABByABqQTRqKQIANwAAIAFBwABqIABByABqQSxq\
KQIANwAAIAFBOGogAEHIAGpBJGopAgA3AAAgAUEwaiAAQcgAakEcaikCADcAACABQShqIABByABqQR\
RqKQIANwAAIAFBIGogAEHIAGpBDGopAgA3AAAgASAAKQJMNwAYIAFC/rnrxemOlZkQNwMQIAFCgcaU\
upbx6uZvNwMIIAFCADcDACABQdgAakEAOgAAIABBkAFqJAAgAQ8LAAu8AgEIfwJAAkAgAkEPSw0AIA\
AhAwwBCyAAQQAgAGtBA3EiBGohBQJAIARFDQAgACEDIAEhBgNAIAMgBi0AADoAACAGQQFqIQYgA0EB\
aiIDIAVJDQALCyAFIAIgBGsiB0F8cSIIaiEDAkACQCABIARqIglBA3EiBkUNACAIQQFIDQEgCUF8cS\
IKQQRqIQFBACAGQQN0IgJrQRhxIQQgCigCACEGA0AgBSAGIAJ2IAEoAgAiBiAEdHI2AgAgAUEEaiEB\
IAVBBGoiBSADSQ0ADAILCyAIQQFIDQAgCSEBA0AgBSABKAIANgIAIAFBBGohASAFQQRqIgUgA0kNAA\
sLIAdBA3EhAiAJIAhqIQELAkAgAkUNACADIAJqIQUDQCADIAEtAAA6AAAgAUEBaiEBIANBAWoiAyAF\
SQ0ACwsgAAv6AgEBfyABIAEtAIgBIgNqQQBBiAEgA2sQlAEhAyABQQA6AIgBIANBAToAACABIAEtAI\
cBQYABcjoAhwEgACAAKQMAIAEpAACFNwMAIAAgACkDCCABKQAIhTcDCCAAIAApAxAgASkAEIU3AxAg\
ACAAKQMYIAEpABiFNwMYIAAgACkDICABKQAghTcDICAAIAApAyggASkAKIU3AyggACAAKQMwIAEpAD\
CFNwMwIAAgACkDOCABKQA4hTcDOCAAIAApA0AgASkAQIU3A0AgACAAKQNIIAEpAEiFNwNIIAAgACkD\
UCABKQBQhTcDUCAAIAApA1ggASkAWIU3A1ggACAAKQNgIAEpAGCFNwNgIAAgACkDaCABKQBohTcDaC\
AAIAApA3AgASkAcIU3A3AgACAAKQN4IAEpAHiFNwN4IAAgACkDgAEgASkAgAGFNwOAASAAECUgAiAA\
KQMANwAAIAIgACkDCDcACCACIAApAxA3ABAgAiAAKQMYNwAYC/oCAQF/IAEgAS0AiAEiA2pBAEGIAS\
ADaxCUASEDIAFBADoAiAEgA0EGOgAAIAEgAS0AhwFBgAFyOgCHASAAIAApAwAgASkAAIU3AwAgACAA\
KQMIIAEpAAiFNwMIIAAgACkDECABKQAQhTcDECAAIAApAxggASkAGIU3AxggACAAKQMgIAEpACCFNw\
MgIAAgACkDKCABKQAohTcDKCAAIAApAzAgASkAMIU3AzAgACAAKQM4IAEpADiFNwM4IAAgACkDQCAB\
KQBAhTcDQCAAIAApA0ggASkASIU3A0ggACAAKQNQIAEpAFCFNwNQIAAgACkDWCABKQBYhTcDWCAAIA\
ApA2AgASkAYIU3A2AgACAAKQNoIAEpAGiFNwNoIAAgACkDcCABKQBwhTcDcCAAIAApA3ggASkAeIU3\
A3ggACAAKQOAASABKQCAAYU3A4ABIAAQJSACIAApAwA3AAAgAiAAKQMINwAIIAIgACkDEDcAECACIA\
ApAxg3ABgL5gIBBH8jAEGwA2siAyQAAkAgAkUNACACQYgBbCEEIANBoAJqQQRyIQUgA0GQAWogA0GQ\
AWpBBHIiBkF/c2pBjAFqQQdJGgNAIAAoAgAhAiADQQA2ApABIAZBAEGIARCUARogA0GIATYCkAEgA0\
GgAmogA0GQAWpBjAEQlQEaIANBCGogBUGIARCVARogAyACKQMANwMIIAMgAikDCDcDECADIAIpAxA3\
AxggAyACKQMYNwMgIAMgAikDIDcDKCADIAIpAyg3AzAgAyACKQMwNwM4IAMgAikDODcDQCADIAIpA0\
A3A0ggAyACKQNINwNQIAMgAikDUDcDWCADIAIpA1g3A2AgAyACKQNgNwNoIAMgAikDaDcDcCADIAIp\
A3A3A3ggAyACKQN4NwOAASADIAIpA4ABNwOIASACECUgASADQQhqQYgBEJUBGiABQYgBaiEBIARB+H\
5qIgQNAAsLIANBsANqJAAL2AIBAX8CQCACRQ0AIAEgAkGQAWxqIQMgACgCACECA0AgAiACKQMAIAEp\
AACFNwMAIAIgAikDCCABKQAIhTcDCCACIAIpAxAgASkAEIU3AxAgAiACKQMYIAEpABiFNwMYIAIgAi\
kDICABKQAghTcDICACIAIpAyggASkAKIU3AyggAiACKQMwIAEpADCFNwMwIAIgAikDOCABKQA4hTcD\
OCACIAIpA0AgASkAQIU3A0AgAiACKQNIIAEpAEiFNwNIIAIgAikDUCABKQBQhTcDUCACIAIpA1ggAS\
kAWIU3A1ggAiACKQNgIAEpAGCFNwNgIAIgAikDaCABKQBohTcDaCACIAIpA3AgASkAcIU3A3AgAiAC\
KQN4IAEpAHiFNwN4IAIgAikDgAEgASkAgAGFNwOAASACIAIpA4gBIAEpAIgBhTcDiAEgAhAlIAFBkA\
FqIgEgA0cNAAsLC90CAQF/IAIgAi0AiAEiA2pBAEGIASADaxCUASEDIAJBADoAiAEgA0EfOgAAIAIg\
Ai0AhwFBgAFyOgCHASABIAEpAwAgAikAAIU3AwAgASABKQMIIAIpAAiFNwMIIAEgASkDECACKQAQhT\
cDECABIAEpAxggAikAGIU3AxggASABKQMgIAIpACCFNwMgIAEgASkDKCACKQAohTcDKCABIAEpAzAg\
AikAMIU3AzAgASABKQM4IAIpADiFNwM4IAEgASkDQCACKQBAhTcDQCABIAEpA0ggAikASIU3A0ggAS\
ABKQNQIAIpAFCFNwNQIAEgASkDWCACKQBYhTcDWCABIAEpA2AgAikAYIU3A2AgASABKQNoIAIpAGiF\
NwNoIAEgASkDcCACKQBwhTcDcCABIAEpA3ggAikAeIU3A3ggASABKQOAASACKQCAAYU3A4ABIAEQJS\
AAIAFByAEQlQEaC7MCAQR/QR8hAgJAIAFB////B0sNACABQQYgAUEIdmciAmt2QQFxIAJBAXRrQT5q\
IQILIABCADcCECAAIAI2AhwgAkECdEHU1MAAaiEDAkACQAJAAkACQEEAKALI0kAiBEEBIAJ0IgVxRQ\
0AIAMoAgAiBCgCBEF4cSABRw0BIAQhAgwCC0EAIAQgBXI2AsjSQCADIAA2AgAgACADNgIYDAMLIAFB\
AEEZIAJBAXZrQR9xIAJBH0YbdCEDA0AgBCADQR12QQRxakEQaiIFKAIAIgJFDQIgA0EBdCEDIAIhBC\
ACKAIEQXhxIAFHDQALCyACKAIIIgMgADYCDCACIAA2AgggAEEANgIYIAAgAjYCDCAAIAM2AggPCyAF\
IAA2AgAgACAENgIYCyAAIAA2AgwgACAANgIIC7oCAQV/IAAoAhghAQJAAkACQCAAKAIMIgIgAEcNAC\
AAQRRBECAAQRRqIgIoAgAiAxtqKAIAIgQNAUEAIQIMAgsgACgCCCIEIAI2AgwgAiAENgIIDAELIAIg\
AEEQaiADGyEDA0AgAyEFAkAgBCICQRRqIgMoAgAiBA0AIAJBEGohAyACKAIQIQQLIAQNAAsgBUEANg\
IACwJAIAFFDQACQAJAIAAoAhxBAnRB1NTAAGoiBCgCACAARg0AIAFBEEEUIAEoAhAgAEYbaiACNgIA\
IAINAQwCCyAEIAI2AgAgAg0AQQBBACgCyNJAQX4gACgCHHdxNgLI0kAPCyACIAE2AhgCQCAAKAIQIg\
RFDQAgAiAENgIQIAQgAjYCGAsgAEEUaigCACIERQ0AIAJBFGogBDYCACAEIAI2AhgPCwvFAgEBfwJA\
IAJFDQAgASACQYgBbGohAyAAKAIAIQIDQCACIAIpAwAgASkAAIU3AwAgAiACKQMIIAEpAAiFNwMIIA\
IgAikDECABKQAQhTcDECACIAIpAxggASkAGIU3AxggAiACKQMgIAEpACCFNwMgIAIgAikDKCABKQAo\
hTcDKCACIAIpAzAgASkAMIU3AzAgAiACKQM4IAEpADiFNwM4IAIgAikDQCABKQBAhTcDQCACIAIpA0\
ggASkASIU3A0ggAiACKQNQIAEpAFCFNwNQIAIgAikDWCABKQBYhTcDWCACIAIpA2AgASkAYIU3A2Ag\
AiACKQNoIAEpAGiFNwNoIAIgAikDcCABKQBwhTcDcCACIAIpA3ggASkAeIU3A3ggAiACKQOAASABKQ\
CAAYU3A4ABIAIQJSABQYgBaiIBIANHDQALCwvHAgEBfyABIAEtAGgiA2pBAEHoACADaxCUASEDIAFB\
ADoAaCADQQE6AAAgASABLQBnQYABcjoAZyAAIAApAwAgASkAAIU3AwAgACAAKQMIIAEpAAiFNwMIIA\
AgACkDECABKQAQhTcDECAAIAApAxggASkAGIU3AxggACAAKQMgIAEpACCFNwMgIAAgACkDKCABKQAo\
hTcDKCAAIAApAzAgASkAMIU3AzAgACAAKQM4IAEpADiFNwM4IAAgACkDQCABKQBAhTcDQCAAIAApA0\
ggASkASIU3A0ggACAAKQNQIAEpAFCFNwNQIAAgACkDWCABKQBYhTcDWCAAIAApA2AgASkAYIU3A2Ag\
ABAlIAIgACkDADcAACACIAApAwg3AAggAiAAKQMQNwAQIAIgACkDGDcAGCACIAApAyA3ACAgAiAAKQ\
MoNwAoC8cCAQF/IAEgAS0AaCIDakEAQegAIANrEJQBIQMgAUEAOgBoIANBBjoAACABIAEtAGdBgAFy\
OgBnIAAgACkDACABKQAAhTcDACAAIAApAwggASkACIU3AwggACAAKQMQIAEpABCFNwMQIAAgACkDGC\
ABKQAYhTcDGCAAIAApAyAgASkAIIU3AyAgACAAKQMoIAEpACiFNwMoIAAgACkDMCABKQAwhTcDMCAA\
IAApAzggASkAOIU3AzggACAAKQNAIAEpAECFNwNAIAAgACkDSCABKQBIhTcDSCAAIAApA1AgASkAUI\
U3A1AgACAAKQNYIAEpAFiFNwNYIAAgACkDYCABKQBghTcDYCAAECUgAiAAKQMANwAAIAIgACkDCDcA\
CCACIAApAxA3ABAgAiAAKQMYNwAYIAIgACkDIDcAICACIAApAyg3ACgLmwIBAX8gASABLQBIIgNqQQ\
BByAAgA2sQlAEhAyABQQA6AEggA0EBOgAAIAEgAS0AR0GAAXI6AEcgACAAKQMAIAEpAACFNwMAIAAg\
ACkDCCABKQAIhTcDCCAAIAApAxAgASkAEIU3AxAgACAAKQMYIAEpABiFNwMYIAAgACkDICABKQAghT\
cDICAAIAApAyggASkAKIU3AyggACAAKQMwIAEpADCFNwMwIAAgACkDOCABKQA4hTcDOCAAIAApA0Ag\
ASkAQIU3A0AgABAlIAIgACkDADcAACACIAApAwg3AAggAiAAKQMQNwAQIAIgACkDGDcAGCACIAApAy\
A3ACAgAiAAKQMoNwAoIAIgACkDMDcAMCACIAApAzg3ADgLmwIBAX8gASABLQBIIgNqQQBByAAgA2sQ\
lAEhAyABQQA6AEggA0EGOgAAIAEgAS0AR0GAAXI6AEcgACAAKQMAIAEpAACFNwMAIAAgACkDCCABKQ\
AIhTcDCCAAIAApAxAgASkAEIU3AxAgACAAKQMYIAEpABiFNwMYIAAgACkDICABKQAghTcDICAAIAAp\
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\
ACABECJBBCEBDAELIAEgBUECdBAmIgFFDQILIAAgBTYCBCAAIAE2AgAgBkEQaiQADwtBwI7AAEEwEJ\
MBAAsAC4MBAQF/IwBBEGsiBSQAIAUgASACIAMgBBAOIAVBCGooAgAhBCAFKAIEIQMCQAJAIAUoAgAN\
ACAAIAQ2AgQgACADNgIADAELIAMgBBAAIQQgAEEANgIAIAAgBDYCBAsCQCABQQVHDQAgAigCkAFFDQ\
AgAkEANgKQAQsgAhAiIAVBEGokAAt+AQF/IwBBwABrIgQkACAEQSs2AgwgBCAANgIIIAQgAjYCFCAE\
IAE2AhAgBEEsakECNgIAIARBPGpBATYCACAEQgI3AhwgBEG8iMAANgIYIARBAjYCNCAEIARBMGo2Ai\
ggBCAEQRBqNgI4IAQgBEEIajYCMCAEQRhqIAMQeAALdQECfyMAQZACayICJABBACEDIAJBADYCAANA\
IAIgA2pBBGogASADaigAADYCACACIANBBGoiAzYCACADQYABRw0ACyACQYgBaiACQYQBEJUBGiAAIA\
JBiAFqQQRyQYABEJUBIAEtAIABOgCAASACQZACaiQAC3UBAn8jAEGwAmsiAiQAQQAhAyACQQA2AgAD\
QCACIANqQQRqIAEgA2ooAAA2AgAgAiADQQRqIgM2AgAgA0GQAUcNAAsgAkGYAWogAkGUARCVARogAC\
ACQZgBakEEckGQARCVASABLQCQAToAkAEgAkGwAmokAAt1AQJ/IwBBoAJrIgIkAEEAIQMgAkEANgIA\
A0AgAiADakEEaiABIANqKAAANgIAIAIgA0EEaiIDNgIAIANBiAFHDQALIAJBkAFqIAJBjAEQlQEaIA\
AgAkGQAWpBBHJBiAEQlQEgAS0AiAE6AIgBIAJBoAJqJAALcwECfyMAQeABayICJABBACEDIAJBADYC\
AANAIAIgA2pBBGogASADaigAADYCACACIANBBGoiAzYCACADQegARw0ACyACQfAAaiACQewAEJUBGi\
AAIAJB8ABqQQRyQegAEJUBIAEtAGg6AGggAkHgAWokAAtzAQJ/IwBBoAFrIgIkAEEAIQMgAkEANgIA\
A0AgAiADakEEaiABIANqKAAANgIAIAIgA0EEaiIDNgIAIANByABHDQALIAJB0ABqIAJBzAAQlQEaIA\
AgAkHQAGpBBHJByAAQlQEgAS0ASDoASCACQaABaiQAC3UBAn8jAEHgAmsiAiQAQQAhAyACQQA2AgAD\
QCACIANqQQRqIAEgA2ooAAA2AgAgAiADQQRqIgM2AgAgA0GoAUcNAAsgAkGwAWogAkGsARCVARogAC\
ACQbABakEEckGoARCVASABLQCoAToAqAEgAkHgAmokAAt7AQJ/IwBBMGsiAiQAIAJBFGpBAjYCACAC\
QdyHwAA2AhAgAkECNgIMIAJBvIfAADYCCCABQRxqKAIAIQMgASgCGCEBIAJBAjYCLCACQgI3AhwgAk\
G8iMAANgIYIAIgAkEIajYCKCABIAMgAkEYahArIQEgAkEwaiQAIAELewECfyMAQTBrIgIkACACQRRq\
QQI2AgAgAkHch8AANgIQIAJBAjYCDCACQbyHwAA2AgggAUEcaigCACEDIAEoAhghASACQQI2AiwgAk\
ICNwIcIAJBvIjAADYCGCACIAJBCGo2AiggASADIAJBGGoQKyEBIAJBMGokACABC2wBAX8jAEEwayID\
JAAgAyABNgIEIAMgADYCACADQRxqQQI2AgAgA0EsakEDNgIAIANCAzcCDCADQbiLwAA2AgggA0EDNg\
IkIAMgA0EgajYCGCADIAM2AiggAyADQQRqNgIgIANBCGogAhB4AAtsAQF/IwBBMGsiAyQAIAMgATYC\
BCADIAA2AgAgA0EcakECNgIAIANBLGpBAzYCACADQgI3AgwgA0GYiMAANgIIIANBAzYCJCADIANBIG\
o2AhggAyADNgIoIAMgA0EEajYCICADQQhqIAIQeAALbAEBfyMAQTBrIgMkACADIAE2AgQgAyAANgIA\
IANBHGpBAjYCACADQSxqQQM2AgAgA0ICNwIMIANByIrAADYCCCADQQM2AiQgAyADQSBqNgIYIAMgA0\
EEajYCKCADIAM2AiAgA0EIaiACEHgAC2wBAX8jAEEwayIDJAAgAyABNgIEIAMgADYCACADQRxqQQI2\
AgAgA0EsakEDNgIAIANCAjcCDCADQeiKwAA2AgggA0EDNgIkIAMgA0EgajYCGCADIANBBGo2AiggAy\
ADNgIgIANBCGogAhB4AAtXAQJ/AkACQCAARQ0AIAAoAgANASAAQQA2AgAgACgCCCEBIAAoAgQhAiAA\
ECICQCACQQVHDQAgASgCkAFFDQAgAUEANgKQAQsgARAiDwsQkQEACxCSAQALWAECf0EAQQAoAsDSQC\
IBQQFqNgLA0kBBAEEAKAKI1kBBAWoiAjYCiNZAAkAgAUEASA0AIAJBAksNAEEAKAK80kBBf0wNACAC\
QQFLDQAgAEUNABCYAQALAAtKAQN/QQAhAwJAIAJFDQACQANAIAAtAAAiBCABLQAAIgVHDQEgAEEBai\
EAIAFBAWohASACQX9qIgJFDQIMAAsLIAQgBWshAwsgAwtGAAJAAkAgAUUNACABKAIADQEgAUF/NgIA\
IAFBBGooAgAgAUEIaigCACACEFAgAUEANgIAIABCADcDAA8LEJEBAAsQkgEAC0cBAX8jAEEgayIDJA\
AgA0EUakEANgIAIANBsJDAADYCECADQgE3AgQgAyABNgIcIAMgADYCGCADIANBGGo2AgAgAyACEHgA\
C4sBACAAQgA3A0AgAEL5wvibkaOz8NsANwM4IABC6/qG2r+19sEfNwMwIABCn9j52cKR2oKbfzcDKC\
AAQtGFmu/6z5SH0QA3AyAgAELx7fT4paf9p6V/NwMYIABCq/DT9K/uvLc8NwMQIABCu86qptjQ67O7\
fzcDCCAAIAGtQoiS95X/zPmE6gCFNwMAC0UBAn8jAEEQayIBJAACQCAAKAIIIgINAEGwkMAAQStB+J\
DAABBzAAsgASAAKAIMNgIIIAEgADYCBCABIAI2AgAgARB8AAtCAQF/AkACQAJAIAJBgIDEAEYNAEEB\
IQQgACACIAEoAhARBgANAQsgAw0BQQAhBAsgBA8LIAAgA0EAIAEoAgwRCAALPwEBfyMAQSBrIgAkAC\
AAQRxqQQA2AgAgAEGwkMAANgIYIABCATcCDCAAQaCCwAA2AgggAEEIakGogsAAEHgACz4BAX8jAEEg\
ayICJAAgAkEBOgAYIAIgATYCFCACIAA2AhAgAkGoiMAANgIMIAJBsJDAADYCCCACQQhqEHUACz0BAn\
8gACgCACIBQRRqKAIAIQICQAJAIAEoAgQOAgAAAQsgAg0AIAAoAgQtABAQcAALIAAoAgQtABAQcAAL\
MwACQCAAQfz///8HSw0AAkAgAA0AQQQPCyAAIABB/f///wdJQQJ0EDEiAEUNACAADwsAC1IAIABCx8\
yj2NbQ67O7fzcDCCAAQgA3AwAgAEEgakKrs4/8kaOz8NsANwMAIABBGGpC/6S5iMWR2oKbfzcDACAA\
QRBqQvLmu+Ojp/2npX83AwALLAEBfyMAQRBrIgEkACABQQhqIABBCGooAgA2AgAgASAAKQIANwMAIA\
EQeQALJgACQCAADQBBwI7AAEEwEJMBAAsgACACIAMgBCAFIAEoAhARDAALJAACQCAADQBBwI7AAEEw\
EJMBAAsgACACIAMgBCABKAIQEQoACyQAAkAgAA0AQcCOwABBMBCTAQALIAAgAiADIAQgASgCEBEJAA\
skAAJAIAANAEHAjsAAQTAQkwEACyAAIAIgAyAEIAEoAhARCgALJAACQCAADQBBwI7AAEEwEJMBAAsg\
ACACIAMgBCABKAIQEQkACyQAAkAgAA0AQcCOwABBMBCTAQALIAAgAiADIAQgASgCEBEJAAskAAJAIA\
ANAEHAjsAAQTAQkwEACyAAIAIgAyAEIAEoAhARFwALJAACQCAADQBBwI7AAEEwEJMBAAsgACACIAMg\
BCABKAIQERgACyQAAkAgAA0AQcCOwABBMBCTAQALIAAgAiADIAQgASgCEBEWAAsiAAJAIAANAEHAjs\
AAQTAQkwEACyAAIAIgAyABKAIQEQcACyAAAkACQCABQfz///8HSw0AIAAgAhAmIgENAQsACyABCyAA\
AkAgAA0AQcCOwABBMBCTAQALIAAgAiABKAIQEQYACxQAIAAoAgAgASAAKAIEKAIMEQYACxAAIAEgAC\
gCACAAKAIEEBwLDgACQCABRQ0AIAAQIgsLCwAgACABIAIQbgALCwAgACABIAIQbQALEQBBuILAAEEv\
QbiDwAAQcwALDQAgACgCABoDfwwACwsLACAAIwBqJAAjAAsNAEHQ0cAAQRsQkwEACw4AQevRwABBzw\
AQkwEACwkAIAAgARALAAsKACAAIAEgAhBTCwoAIAAgASACEEALCgAgACABIAIQcQsMAEK4ic+XicbR\
+EwLAwAACwIACwvE0oCAAAEAQYCAwAALulLQBRAAUAAAAJUAAAAJAAAAQkxBS0UyQkJMQUtFMkItMj\
I0QkxBS0UyQi0yNTZCTEFLRTJCLTM4NEJMQUtFMlNCTEFLRTNLRUNDQUstMjI0S0VDQ0FLLTI1NktF\
Q0NBSy0zODRLRUNDQUstNTEyTUQ0TUQ1UklQRU1ELTE2MFNIQS0xU0hBLTIyNFNIQS0yNTZTSEEtMz\
g0U0hBLTUxMlRJR0VSdW5zdXBwb3J0ZWQgYWxnb3JpdGhtbm9uLWRlZmF1bHQgbGVuZ3RoIHNwZWNp\
ZmllZCBmb3Igbm9uLWV4dGVuZGFibGUgYWxnb3JpdGhtbGlicmFyeS9hbGxvYy9zcmMvcmF3X3ZlYy\
5yc2NhcGFjaXR5IG92ZXJmbG93AAANARAAEQAAAPEAEAAcAAAABgIAAAUAAABBcnJheVZlYzogY2Fw\
YWNpdHkgZXhjZWVkZWQgaW4gZXh0ZW5kL2Zyb21faXRlcn4vLmNhcmdvL3JlZ2lzdHJ5L3NyYy9naX\
RodWIuY29tLTFlY2M2Mjk5ZGI5ZWM4MjMvYXJyYXl2ZWMtMC43LjIvc3JjL2FycmF5dmVjLnJzAGcB\
EABQAAAAAQQAAAUAAAB+Ly5jYXJnby9yZWdpc3RyeS9zcmMvZ2l0aHViLmNvbS0xZWNjNjI5OWRiOW\
VjODIzL2JsYWtlMy0xLjMuMS9zcmMvbGliLnJzAAAAyAEQAEkAAAC5AQAACQAAAMgBEABJAAAAXwIA\
AAoAAADIARAASQAAAI0CAAAJAAAAyAEQAEkAAACNAgAANAAAAMgBEABJAAAAuQIAAB8AAADIARAASQ\
AAAN0CAAAKAAAAyAEQAEkAAADWAgAACQAAAMgBEABJAAAAAQMAABkAAADIARAASQAAAAMDAAAJAAAA\
yAEQAEkAAAADAwAAOAAAAMgBEABJAAAA+AMAAB4AAADIARAASQAAAKoEAAAWAAAAyAEQAEkAAAC8BA\
AAFgAAAMgBEABJAAAA7QQAABIAAADIARAASQAAAPcEAAASAAAAyAEQAEkAAABpBQAAIQAAABEAAAAE\
AAAABAAAABIAAAB+Ly5jYXJnby9yZWdpc3RyeS9zcmMvZ2l0aHViLmNvbS0xZWNjNjI5OWRiOWVjOD\
IzL2FycmF5dmVjLTAuNy4yL3NyYy9hcnJheXZlY19pbXBsLnJzAAAAJAMQAFUAAAAnAAAACQAAABEA\
AAAEAAAABAAAABIAAAARAAAAIAAAAAEAAAATAAAAQ2FwYWNpdHlFcnJvcgAAAKwDEAANAAAAaW5zdW\
ZmaWNpZW50IGNhcGFjaXR5AAAAxAMQABUAAAApaW5kZXggb3V0IG9mIGJvdW5kczogdGhlIGxlbiBp\
cyAgYnV0IHRoZSBpbmRleCBpcyAA5QMQACAAAAAFBBAAEgAAABEAAAAAAAAAAQAAABQAAAA6IAAAMA\
gQAAAAAAA4BBAAAgAAADAwMDEwMjAzMDQwNTA2MDcwODA5MTAxMTEyMTMxNDE1MTYxNzE4MTkyMDIx\
MjIyMzI0MjUyNjI3MjgyOTMwMzEzMjMzMzQzNTM2MzczODM5NDA0MTQyNDM0NDQ1NDY0NzQ4NDk1MD\
UxNTI1MzU0NTU1NjU3NTg1OTYwNjE2MjYzNjQ2NTY2Njc2ODY5NzA3MTcyNzM3NDc1NzY3Nzc4Nzk4\
MDgxODI4Mzg0ODU4Njg3ODg4OTkwOTE5MjkzOTQ5NTk2OTc5ODk5cmFuZ2Ugc3RhcnQgaW5kZXggIG\
91dCBvZiByYW5nZSBmb3Igc2xpY2Ugb2YgbGVuZ3RoIBQFEAASAAAAJgUQACIAAAByYW5nZSBlbmQg\
aW5kZXggWAUQABAAAAAmBRAAIgAAAHNvdXJjZSBzbGljZSBsZW5ndGggKCkgZG9lcyBub3QgbWF0Y2\
ggZGVzdGluYXRpb24gc2xpY2UgbGVuZ3RoICh4BRAAFQAAAI0FEAArAAAA5AMQAAEAAAB+Ly5jYXJn\
by9yZWdpc3RyeS9zcmMvZ2l0aHViLmNvbS0xZWNjNjI5OWRiOWVjODIzL2Jsb2NrLWJ1ZmZlci0wLj\
EwLjAvc3JjL2xpYi5yc9AFEABQAAAAPwEAAB4AAADQBRAAUAAAAPwAAAAnAAAAYXNzZXJ0aW9uIGZh\
aWxlZDogbWlkIDw9IHNlbGYubGVuKCkAAAAAAAEjRWeJq83v/ty6mHZUMhDw4dLDAAAAAGfmCWqFrm\
e7cvNuPDr1T6V/Ug5RjGgFm6vZgx8ZzeBb2J4FwQfVfDYX3XAwOVkO9zELwP8RFVhop4/5ZKRP+r4I\
ybzzZ+YJajunyoSFrme7K/iU/nLzbjzxNh1fOvVPpdGC5q1/Ug5RH2w+K4xoBZtrvUH7q9mDH3khfh\
MZzeBb2J4FwV2du8sH1Xw2KimaYhfdcDBaAVmROVkO99jsLxUxC8D/ZyYzZxEVWGiHSrSOp4/5ZA0u\
DNukT/q+HUi1R2Nsb3N1cmUgaW52b2tlZCByZWN1cnNpdmVseSBvciBkZXN0cm95ZWQgYWxyZWFkeQ\
EAAAAAAAAAgoAAAAAAAACKgAAAAAAAgACAAIAAAACAi4AAAAAAAAABAACAAAAAAIGAAIAAAACACYAA\
AAAAAICKAAAAAAAAAIgAAAAAAAAACYAAgAAAAAAKAACAAAAAAIuAAIAAAAAAiwAAAAAAAICJgAAAAA\
AAgAOAAAAAAACAAoAAAAAAAICAAAAAAAAAgAqAAAAAAAAACgAAgAAAAICBgACAAAAAgICAAAAAAACA\
AQAAgAAAAAAIgACAAAAAgGNhbGxlZCBgT3B0aW9uOjp1bndyYXAoKWAgb24gYSBgTm9uZWAgdmFsdW\
VsaWJyYXJ5L3N0ZC9zcmMvcGFuaWNraW5nLnJzAFsIEAAcAAAARwIAAA8AAABjYWxsZWQgYFJlc3Vs\
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\
9ZY43HWPsT2PY6qOgOmrjTU5n6xyC8CR+t63ki1JYv1BVWtbTS756N7GbX7qvsSrVz81zpBW2tZpV3\
OEFDlCpkojCp0N+CiAUPn2FfKzeqIZ47hNGjRREZytMQVY73ulIjx3M4aWBxpWx0U2vp0kntoT+WhM\
pnibLWXa7zTDO3+pJ0z0F2vmIBJidgt9zZqJQ3eWgmft4Mpb7vP8ecgANnWfQLZtkrU5mtAGiMV6Mb\
Cug28hHziGSsrmASUwn9FiNP9m+zv93SR8IHLr4uzi07b2St4I6se+TZmcxIuasJflrEm6lwfPZkeM\
s3UqfMVzkxsTWB6TYc4sgrEMHLoJuVV1ndIRfZPdr38S5JJtxq072im87MJUcdXBoiT+9oJNE8VYTy\
diW1HjOhwmgcsBLsgH6ct/4xMZCe34yUYAyPnYSTJj+4jj7ZvPgJ7xbBGaU4EYVyTVa/fzA1Go90eu\
9ea3Fc+cftTextfbGrsoAkFc5USZTtteJdRHtjD8qrgriBFdKiHTKbuLCfWzlgLpFOq1j1oC3VchlH\
tntayQo8DnWPsBSr2DTGfTiTu580vfpC2eKUirjDIexPxSLFi6lozzA7Jd2H+9vdHKg66CYMFCtLuw\
mtqla+hfuT+pcTdnBC6y2FIxSclYU4QeVLSXhkgqvmZpjtMt3KKVK4U8kqwRLMB7qPINmbGII743Tx\
v6CIB8A+VUTcjQcB/UV85+7K2QVDo6BtknPCsAv6IwgISjrn7AAyDtbTICxoZAqWl9KKeDinr1MMtf\
esV55+t55ERotem83AUPtHOj4g5XiG54Gteg9ui9zbqchy+jZMG80WqXi9dmll7iIas8w+XlqmMQkJ\
CNaUhEsxiYu4oePq6HZOO03DuJMfm9rxnVu1/coEVjymWUmyb+KIbsUZw/YAFdHrdJUKEGQORNsct2\
9+VwbL/tK1Xv8hgSQaM2WnAIBwzLRGCYT3UUTecOKKgOQ9lWzWVQX1PXkSXBlu8KcvEjMsgfpWNzbz\
mgw251bGwgcG9pbnRlciBwYXNzZWQgdG8gcnVzdHJlY3Vyc2l2ZSB1c2Ugb2YgYW4gb2JqZWN0IGRl\
dGVjdGVkIHdoaWNoIHdvdWxkIGxlYWQgdG8gdW5zYWZlIGFsaWFzaW5nIGluIHJ1c3QAttCAgAAEbm\
FtZQGr0ICAAJoBAEVqc19zeXM6OlR5cGVFcnJvcjo6bmV3OjpfX3diZ19uZXdfZGIyNTRhZTBhMWJi\
MGZmNTo6aGU1YTViY2I5N2UzNWVlOTEBO3dhc21fYmluZGdlbjo6X193YmluZGdlbl9vYmplY3RfZH\
JvcF9yZWY6Omg3MDI4MTAxYzVkZDAzMWM5AlVqc19zeXM6OlVpbnQ4QXJyYXk6OmJ5dGVfbGVuZ3Ro\
OjpfX3diZ19ieXRlTGVuZ3RoXzg3YTA0MzZhNzRhZGMyNmM6OmhjZDQ0M2I5NTE3NDg1ZTQ4A1Vqc1\
9zeXM6OlVpbnQ4QXJyYXk6OmJ5dGVfb2Zmc2V0OjpfX3diZ19ieXRlT2Zmc2V0XzQ0NzdkNTQ3MTBh\
ZjZmOWI6OmgxOTBhYjU2ZGQxMmViZjEyBExqc19zeXM6OlVpbnQ4QXJyYXk6OmJ1ZmZlcjo6X193Ym\
dfYnVmZmVyXzIxMzEwZWExNzI1N2IwYjQ6Omg3NTEzNDhhMDRjMjc1ZDk3BXlqc19zeXM6OlVpbnQ4\
QXJyYXk6Om5ld193aXRoX2J5dGVfb2Zmc2V0X2FuZF9sZW5ndGg6Ol9fd2JnX25ld3dpdGhieXRlb2\
Zmc2V0YW5kbGVuZ3RoX2Q5YWEyNjY3MDNjYjk4YmU6OmgxNDIxMzk4ZDhkMjBlYjY4Bkxqc19zeXM6\
OlVpbnQ4QXJyYXk6Omxlbmd0aDo6X193YmdfbGVuZ3RoXzllMWFlMTkwMGNiMGZiZDU6OmgzMDRhZT\
U1ZDBjYjNkZGQ3BzJ3YXNtX2JpbmRnZW46Ol9fd2JpbmRnZW5fbWVtb3J5OjpoOThkMDcxZmRlMWQ2\
M2Q3ZghVanNfc3lzOjpXZWJBc3NlbWJseTo6TWVtb3J5OjpidWZmZXI6Ol9fd2JnX2J1ZmZlcl8zZj\
NkNzY0ZDQ3NDdkNTY0OjpoNzYxM2VjZTFiNjI1N2QwYwlGanNfc3lzOjpVaW50OEFycmF5OjpuZXc6\
Ol9fd2JnX25ld184YzNmMDA1MjI3MmE0NTdhOjpoOTM5NDM5OWIzMzA3MmJkZQpGanNfc3lzOjpVaW\
50OEFycmF5OjpzZXQ6Ol9fd2JnX3NldF84M2RiOTY5MGY5MzUzZTc5OjpoMmMzYTNhZjQxYmVlN2Uw\
Ygsxd2FzbV9iaW5kZ2VuOjpfX3diaW5kZ2VuX3Rocm93OjpoZDI2NjNkNGU1YTBiZjQ3YgxAZGVub1\
9zdGRfd2FzbV9jcnlwdG86OmRpZ2VzdDo6Q29udGV4dDo6ZGlnZXN0OjpoMGZkNzY4MDY4OThmNjM5\
Nw0sc2hhMjo6c2hhNTEyOjpjb21wcmVzczUxMjo6aDgwYjZjM2U0MjZhMGQ1ZjMOSmRlbm9fc3RkX3\
dhc21fY3J5cHRvOjpkaWdlc3Q6OkNvbnRleHQ6OmRpZ2VzdF9hbmRfcmVzZXQ6Omg2OTAzZDQxYWVk\
Yjc2ZDQ2DyxzaGEyOjpzaGEyNTY6OmNvbXByZXNzMjU2OjpoMDIxMDEwM2M3YjNkYzIyORATZGlnZX\
N0Y29udGV4dF9jbG9uZRFAZGVub19zdGRfd2FzbV9jcnlwdG86OmRpZ2VzdDo6Q29udGV4dDo6dXBk\
YXRlOjpoOGMwN2Y3YmEwMDA1YWYwNBIzYmxha2UyOjpCbGFrZTJiVmFyQ29yZTo6Y29tcHJlc3M6Om\
hjMmYzMDEzNTFjMzhhNmZiEylyaXBlbWQ6OmMxNjA6OmNvbXByZXNzOjpoMjdkNWNhZGNlN2JhNjNm\
NxQzYmxha2UyOjpCbGFrZTJzVmFyQ29yZTo6Y29tcHJlc3M6OmgzNDI0ZTU5MjA4NzM1ZjAxFStzaG\
ExOjpjb21wcmVzczo6Y29tcHJlc3M6Omg2OGNiMGVhYTU0ZmNmZDljFix0aWdlcjo6Y29tcHJlc3M6\
OmNvbXByZXNzOjpoYTVmYzQxYjA5Y2I1NTFjYhctYmxha2UzOjpPdXRwdXRSZWFkZXI6OmZpbGw6Om\
gxNDk4OTZiZjFmMzRjOWNmGDZibGFrZTM6OnBvcnRhYmxlOjpjb21wcmVzc19pbl9wbGFjZTo6aDNi\
MTcwNDFlM2EyYWQ0ZjEZOmRsbWFsbG9jOjpkbG1hbGxvYzo6RGxtYWxsb2M8QT46Om1hbGxvYzo6aG\
E5NmZjZWZiYjQ0ZDZkYTUaZTxkaWdlc3Q6OmNvcmVfYXBpOjp3cmFwcGVyOjpDb3JlV3JhcHBlcjxU\
PiBhcyBkaWdlc3Q6OlVwZGF0ZT46OnVwZGF0ZTo6e3tjbG9zdXJlfX06Omg5OGEyNmM3ZjA2NjRkMz\
MzG2g8bWQ1OjpNZDVDb3JlIGFzIGRpZ2VzdDo6Y29yZV9hcGk6OkZpeGVkT3V0cHV0Q29yZT46OmZp\
bmFsaXplX2ZpeGVkX2NvcmU6Ont7Y2xvc3VyZX19OjpoZjQwOGE4NDJlNzQwM2Y0ZRwsY29yZTo6Zm\
10OjpGb3JtYXR0ZXI6OnBhZDo6aDhjNzUzZTQ5NGY3YjU2OWQdIG1kNDo6Y29tcHJlc3M6OmhlYjZl\
YTc3NjgzMDc5MTJjHjBibGFrZTM6OmNvbXByZXNzX3N1YnRyZWVfd2lkZTo6aGQxY2IwNWY0NTBhYT\
cwZWQfL2JsYWtlMzo6SGFzaGVyOjpmaW5hbGl6ZV94b2Y6Omg1YzQ3NGJhNjI1NWZhOTU5IBNkaWdl\
c3Rjb250ZXh0X3Jlc2V0IT1kZW5vX3N0ZF93YXNtX2NyeXB0bzo6ZGlnZXN0OjpDb250ZXh0OjpuZX\
c6Omg2YWExMzU3YWVjN2E0NmIxIjhkbG1hbGxvYzo6ZGxtYWxsb2M6OkRsbWFsbG9jPEE+OjpmcmVl\
OjpoYTQ3MzdiN2Y4NDk3MGFkZCNyPHNoYTI6OmNvcmVfYXBpOjpTaGE1MTJWYXJDb3JlIGFzIGRpZ2\
VzdDo6Y29yZV9hcGk6OlZhcmlhYmxlT3V0cHV0Q29yZT46OmZpbmFsaXplX3ZhcmlhYmxlX2NvcmU6\
OmgwNDU2Yzg2YjQ3NWNjOWIxJEFkbG1hbGxvYzo6ZGxtYWxsb2M6OkRsbWFsbG9jPEE+OjpkaXNwb3\
NlX2NodW5rOjpoM2I2YzRlNzRmYThhYTA0YiUga2VjY2FrOjpmMTYwMDo6aDM0YmRlNTM0MGY3NGE2\
YTgmDl9fcnVzdF9yZWFsbG9jJ3I8c2hhMjo6Y29yZV9hcGk6OlNoYTI1NlZhckNvcmUgYXMgZGlnZX\
N0Ojpjb3JlX2FwaTo6VmFyaWFibGVPdXRwdXRDb3JlPjo6ZmluYWxpemVfdmFyaWFibGVfY29yZTo6\
aGZhMzUyNzAwMzRlYzgyZDUoTmNvcmU6OmZtdDo6bnVtOjppbXA6OjxpbXBsIGNvcmU6OmZtdDo6RG\
lzcGxheSBmb3IgdTMyPjo6Zm10OjpoYzUwYTFjOWI4MmViNDQ0NildPHNoYTE6OlNoYTFDb3JlIGFz\
IGRpZ2VzdDo6Y29yZV9hcGk6OkZpeGVkT3V0cHV0Q29yZT46OmZpbmFsaXplX2ZpeGVkX2NvcmU6Om\
g5OTZiY2RmNDE2MTUwYzExKjFibGFrZTM6Okhhc2hlcjo6bWVyZ2VfY3Zfc3RhY2s6Omg3MTMzMTRm\
ZWQ4YjMxMjcwKyNjb3JlOjpmbXQ6OndyaXRlOjpoZWQ4ZmU3ZDA5NTQ3OWVhMixkPHJpcGVtZDo6Um\
lwZW1kMTYwQ29yZSBhcyBkaWdlc3Q6OmNvcmVfYXBpOjpGaXhlZE91dHB1dENvcmU+OjpmaW5hbGl6\
ZV9maXhlZF9jb3JlOjpoMzkxZjg1Y2JlMzY3YmE0OC00Ymxha2UzOjpjb21wcmVzc19wYXJlbnRzX3\
BhcmFsbGVsOjpoNjI3NDYyMTFkMGE0ZGFjMi5bPG1kNDo6TWQ0Q29yZSBhcyBkaWdlc3Q6OmNvcmVf\
YXBpOjpGaXhlZE91dHB1dENvcmU+OjpmaW5hbGl6ZV9maXhlZF9jb3JlOjpoZTgxNjA3N2Y4NzdhYj\
RiZS9bPG1kNTo6TWQ1Q29yZSBhcyBkaWdlc3Q6OmNvcmVfYXBpOjpGaXhlZE91dHB1dENvcmU+Ojpm\
aW5hbGl6ZV9maXhlZF9jb3JlOjpoYTIzMWI4OGE4ODcyM2ViMjBfPHRpZ2VyOjpUaWdlckNvcmUgYX\
MgZGlnZXN0Ojpjb3JlX2FwaTo6Rml4ZWRPdXRwdXRDb3JlPjo6ZmluYWxpemVfZml4ZWRfY29yZTo6\
aGJhMjU4N2Y0Y2ZlYjRjNjAxMGRsbWFsbG9jOjpEbG1hbGxvYzxBPjo6bWFsbG9jOjpoMDA1NzM1Nj\
dhMzMzOGRmODJMPGFsbG9jOjpib3hlZDo6Qm94PFQ+IGFzIGNvcmU6OmRlZmF1bHQ6OkRlZmF1bHQ+\
OjpkZWZhdWx0OjpoNmQwOGY1ZjVlYzRmYTVmMjNMPGFsbG9jOjpib3hlZDo6Qm94PFQ+IGFzIGNvcm\
U6OmRlZmF1bHQ6OkRlZmF1bHQ+OjpkZWZhdWx0OjpoMDQyN2VjY2YzNzk5NTdiYzRMPGFsbG9jOjpi\
b3hlZDo6Qm94PFQ+IGFzIGNvcmU6OmRlZmF1bHQ6OkRlZmF1bHQ+OjpkZWZhdWx0OjpoN2QwMmNjMm\
IyM2Q1NTlkZDVMPGFsbG9jOjpib3hlZDo6Qm94PFQ+IGFzIGNvcmU6OmRlZmF1bHQ6OkRlZmF1bHQ+\
OjpkZWZhdWx0OjpoNGMyYjExMDJkOTJlYjg2MjZkPHNoYTM6OlNoYWtlMTI4Q29yZSBhcyBkaWdlc3\
Q6OmNvcmVfYXBpOjpFeHRlbmRhYmxlT3V0cHV0Q29yZT46OmZpbmFsaXplX3hvZl9jb3JlOjpoN2Fl\
Yjk4ODRiZjgwZGI5ZjctYmxha2UzOjpDaHVua1N0YXRlOjp1cGRhdGU6OmhjYWRlYzU5N2NiOTJhOD\
hlOGI8c2hhMzo6S2VjY2FrMjI0Q29yZSBhcyBkaWdlc3Q6OmNvcmVfYXBpOjpGaXhlZE91dHB1dENv\
cmU+OjpmaW5hbGl6ZV9maXhlZF9jb3JlOjpoMGY5NDA1NjkzYWY0MTk1ZDlhPHNoYTM6OlNoYTNfMj\
I0Q29yZSBhcyBkaWdlc3Q6OmNvcmVfYXBpOjpGaXhlZE91dHB1dENvcmU+OjpmaW5hbGl6ZV9maXhl\
ZF9jb3JlOjpoNjQ0NjcyYWEwOWQyMzczNDpyPGRpZ2VzdDo6Y29yZV9hcGk6OnhvZl9yZWFkZXI6Ol\
hvZlJlYWRlckNvcmVXcmFwcGVyPFQ+IGFzIGRpZ2VzdDo6WG9mUmVhZGVyPjo6cmVhZDo6e3tjbG9z\
dXJlfX06OmhjMGIxNDZkODFjOGUxYTJlO0w8YWxsb2M6OmJveGVkOjpCb3g8VD4gYXMgY29yZTo6ZG\
VmYXVsdDo6RGVmYXVsdD46OmRlZmF1bHQ6OmhhMDc5MzUyNTQ2MTRlMDI5PGU8ZGlnZXN0Ojpjb3Jl\
X2FwaTo6eG9mX3JlYWRlcjo6WG9mUmVhZGVyQ29yZVdyYXBwZXI8VD4gYXMgZGlnZXN0OjpYb2ZSZW\
FkZXI+OjpyZWFkOjpoMTU0NmE3ZDc5MjNlYmVmNT1lPGRpZ2VzdDo6Y29yZV9hcGk6OnhvZl9yZWFk\
ZXI6OlhvZlJlYWRlckNvcmVXcmFwcGVyPFQ+IGFzIGRpZ2VzdDo6WG9mUmVhZGVyPjo6cmVhZDo6aD\
EzYWE2NDZkYmJiZjJkM2M+ZTxkaWdlc3Q6OmNvcmVfYXBpOjp3cmFwcGVyOjpDb3JlV3JhcHBlcjxU\
PiBhcyBkaWdlc3Q6OlVwZGF0ZT46OnVwZGF0ZTo6e3tjbG9zdXJlfX06Omg0MzY0MDRjNjQ1NDYwZG\
Q4P0w8YWxsb2M6OmJveGVkOjpCb3g8VD4gYXMgY29yZTo6ZGVmYXVsdDo6RGVmYXVsdD46OmRlZmF1\
bHQ6Omg1NzY4YjMxZGE5ZWVmYjhjQDFjb21waWxlcl9idWlsdGluczo6bWVtOjptZW1jcHk6Omg0NW\
ViNTM2MDFkOWQ2YmYwQWI8c2hhMzo6S2VjY2FrMjU2Q29yZSBhcyBkaWdlc3Q6OmNvcmVfYXBpOjpG\
aXhlZE91dHB1dENvcmU+OjpmaW5hbGl6ZV9maXhlZF9jb3JlOjpoN2RhMzE4ZDEyOTc0ZDdkOEJhPH\
NoYTM6OlNoYTNfMjU2Q29yZSBhcyBkaWdlc3Q6OmNvcmVfYXBpOjpGaXhlZE91dHB1dENvcmU+Ojpm\
aW5hbGl6ZV9maXhlZF9jb3JlOjpoNjY0NjM3NDQ5NmFiNGI2NkNyPGRpZ2VzdDo6Y29yZV9hcGk6On\
hvZl9yZWFkZXI6OlhvZlJlYWRlckNvcmVXcmFwcGVyPFQ+IGFzIGRpZ2VzdDo6WG9mUmVhZGVyPjo6\
cmVhZDo6e3tjbG9zdXJlfX06OmgwYmYzMWE1MWMzYzRhNTNjRGU8ZGlnZXN0Ojpjb3JlX2FwaTo6d3\
JhcHBlcjo6Q29yZVdyYXBwZXI8VD4gYXMgZGlnZXN0OjpVcGRhdGU+Ojp1cGRhdGU6Ont7Y2xvc3Vy\
ZX19OjpoN2ExNmQxNDcyMDQ3NWE0ZUVkPHNoYTM6OlNoYWtlMjU2Q29yZSBhcyBkaWdlc3Q6OmNvcm\
VfYXBpOjpFeHRlbmRhYmxlT3V0cHV0Q29yZT46OmZpbmFsaXplX3hvZl9jb3JlOjpoMDk2NTY4MjQ1\
YzEyMzEzOUZGZGxtYWxsb2M6OmRsbWFsbG9jOjpEbG1hbGxvYzxBPjo6aW5zZXJ0X2xhcmdlX2NodW\
5rOjpoYjEyOTkwZjkyNTM4ZmJiZkdGZGxtYWxsb2M6OmRsbWFsbG9jOjpEbG1hbGxvYzxBPjo6dW5s\
aW5rX2xhcmdlX2NodW5rOjpoYmU4ZDM2YTlmNDA2MGNlZUhlPGRpZ2VzdDo6Y29yZV9hcGk6OndyYX\
BwZXI6OkNvcmVXcmFwcGVyPFQ+IGFzIGRpZ2VzdDo6VXBkYXRlPjo6dXBkYXRlOjp7e2Nsb3N1cmV9\
fTo6aDkwZTcxOTliNmM5Yzg0ZDVJYjxzaGEzOjpLZWNjYWszODRDb3JlIGFzIGRpZ2VzdDo6Y29yZV\
9hcGk6OkZpeGVkT3V0cHV0Q29yZT46OmZpbmFsaXplX2ZpeGVkX2NvcmU6OmhjNzMxNWU3MjdiNDk4\
ZjJiSmE8c2hhMzo6U2hhM18zODRDb3JlIGFzIGRpZ2VzdDo6Y29yZV9hcGk6OkZpeGVkT3V0cHV0Q2\
9yZT46OmZpbmFsaXplX2ZpeGVkX2NvcmU6OmhiMjgxYjZkYWM5MzM5NzYxS2I8c2hhMzo6S2VjY2Fr\
NTEyQ29yZSBhcyBkaWdlc3Q6OmNvcmVfYXBpOjpGaXhlZE91dHB1dENvcmU+OjpmaW5hbGl6ZV9maX\
hlZF9jb3JlOjpoMTE4YWVmNjA5MWUyNDczN0xhPHNoYTM6OlNoYTNfNTEyQ29yZSBhcyBkaWdlc3Q6\
OmNvcmVfYXBpOjpGaXhlZE91dHB1dENvcmU+OjpmaW5hbGl6ZV9maXhlZF9jb3JlOjpoMTJkOWIyMW\
RhNzk0M2E2MU1MPGFsbG9jOjpib3hlZDo6Qm94PFQ+IGFzIGNvcmU6OmRlZmF1bHQ6OkRlZmF1bHQ+\
OjpkZWZhdWx0OjpoYTEzNzIzMDcwMWQ4YTA4NE5MPGFsbG9jOjpib3hlZDo6Qm94PFQ+IGFzIGNvcm\
U6OmRlZmF1bHQ6OkRlZmF1bHQ+OjpkZWZhdWx0OjpoMGM5YTJiNDA4NmExNDk1OU9lPGRpZ2VzdDo6\
Y29yZV9hcGk6OndyYXBwZXI6OkNvcmVXcmFwcGVyPFQ+IGFzIGRpZ2VzdDo6VXBkYXRlPjo6dXBkYX\
RlOjp7e2Nsb3N1cmV9fTo6aDI5YmQ4NWE4MDU5NjlhMGZQPmRlbm9fc3RkX3dhc21fY3J5cHRvOjpE\
aWdlc3RDb250ZXh0Ojp1cGRhdGU6Omg2ZmM2MzZkMTdkYTI1MDM1UVs8YmxvY2tfYnVmZmVyOjpCbG\
9ja0J1ZmZlcjxCbG9ja1NpemUsS2luZD4gYXMgY29yZTo6Y2xvbmU6OkNsb25lPjo6Y2xvbmU6Omgw\
NzFjYWI4NjlkMDlhNzgzUgZkaWdlc3RTMWNvbXBpbGVyX2J1aWx0aW5zOjptZW06Om1lbXNldDo6aD\
ViOGI5OThhNGIyZmIyMDVUZTxkaWdlc3Q6OmNvcmVfYXBpOjp3cmFwcGVyOjpDb3JlV3JhcHBlcjxU\
PiBhcyBkaWdlc3Q6OlVwZGF0ZT46OnVwZGF0ZTo6e3tjbG9zdXJlfX06Omg3MmQzOTNjYTdhNDJjMT\
Q4VRRkaWdlc3Rjb250ZXh0X2RpZ2VzdFYRZGlnZXN0Y29udGV4dF9uZXdXHGRpZ2VzdGNvbnRleHRf\
ZGlnZXN0QW5kUmVzZXRYTDxhbGxvYzo6Ym94ZWQ6OkJveDxUPiBhcyBjb3JlOjpkZWZhdWx0OjpEZW\
ZhdWx0Pjo6ZGVmYXVsdDo6aDUwY2YzMGQwNTU4ZjM5NzNZTDxhbGxvYzo6Ym94ZWQ6OkJveDxUPiBh\
cyBjb3JlOjpkZWZhdWx0OjpEZWZhdWx0Pjo6ZGVmYXVsdDo6aDEwZGIyOWY3M2EyODhlY2NaTDxhbG\
xvYzo6Ym94ZWQ6OkJveDxUPiBhcyBjb3JlOjpkZWZhdWx0OjpEZWZhdWx0Pjo6ZGVmYXVsdDo6aGIz\
OWVhZDY2MjhlYTQ2OWVbTDxhbGxvYzo6Ym94ZWQ6OkJveDxUPiBhcyBjb3JlOjpkZWZhdWx0OjpEZW\
ZhdWx0Pjo6ZGVmYXVsdDo6aDkxODM1OGM3OGY3ZWMwNTdcTDxhbGxvYzo6Ym94ZWQ6OkJveDxUPiBh\
cyBjb3JlOjpkZWZhdWx0OjpEZWZhdWx0Pjo6ZGVmYXVsdDo6aDdlMjlhOGQ1NWUxOGFiMTJdLWpzX3\
N5czo6VWludDhBcnJheTo6dG9fdmVjOjpoNTExZmY3NDM1NTJhYmYyM15MPGFsbG9jOjpib3hlZDo6\
Qm94PFQ+IGFzIGNvcmU6OmRlZmF1bHQ6OkRlZmF1bHQ+OjpkZWZhdWx0OjpoNTZkNzZlNmVlMGNmMT\
EzMF8bZGlnZXN0Y29udGV4dF9kaWdlc3RBbmREcm9wYD93YXNtX2JpbmRnZW46OmNvbnZlcnQ6OmNs\
b3N1cmVzOjppbnZva2UzX211dDo6aDZmNWY3MDU3OTQ0NDg2MmVhR2Rlbm9fc3RkX3dhc21fY3J5cH\
RvOjpEaWdlc3RDb250ZXh0OjpkaWdlc3RfYW5kX2Ryb3A6OmgwYzhjZmNhY2I4NzM4NjI1Yi5jb3Jl\
OjpyZXN1bHQ6OnVud3JhcF9mYWlsZWQ6OmgyZGM3MDZkOTQ4YzIyOTYwY1s8YmxvY2tfYnVmZmVyOj\
pCbG9ja0J1ZmZlcjxCbG9ja1NpemUsS2luZD4gYXMgY29yZTo6Y2xvbmU6OkNsb25lPjo6Y2xvbmU6\
OmhhMzcwZGU5ZWU0OTc3OTY5ZFs8YmxvY2tfYnVmZmVyOjpCbG9ja0J1ZmZlcjxCbG9ja1NpemUsS2\
luZD4gYXMgY29yZTo6Y2xvbmU6OkNsb25lPjo6Y2xvbmU6OmhlMDUyZDMyZmZhZjY1MDY1ZVs8Ymxv\
Y2tfYnVmZmVyOjpCbG9ja0J1ZmZlcjxCbG9ja1NpemUsS2luZD4gYXMgY29yZTo6Y2xvbmU6OkNsb2\
5lPjo6Y2xvbmU6OmgwNGU2Y2JjMjYxODU2NjVmZls8YmxvY2tfYnVmZmVyOjpCbG9ja0J1ZmZlcjxC\
bG9ja1NpemUsS2luZD4gYXMgY29yZTo6Y2xvbmU6OkNsb25lPjo6Y2xvbmU6OmgyZjA2OWU0MTM4Y2\
Q1NzVkZ1s8YmxvY2tfYnVmZmVyOjpCbG9ja0J1ZmZlcjxCbG9ja1NpemUsS2luZD4gYXMgY29yZTo6\
Y2xvbmU6OkNsb25lPjo6Y2xvbmU6Omg2MDNjOWFlZTQwMzkxY2I5aFs8YmxvY2tfYnVmZmVyOjpCbG\
9ja0J1ZmZlcjxCbG9ja1NpemUsS2luZD4gYXMgY29yZTo6Y2xvbmU6OkNsb25lPjo6Y2xvbmU6Omgy\
N2ZjNWY5N2EyNjUwM2E0aVA8YXJyYXl2ZWM6OmVycm9yczo6Q2FwYWNpdHlFcnJvcjxUPiBhcyBjb3\
JlOjpmbXQ6OkRlYnVnPjo6Zm10OjpoMmFhYjQ0MTQ3MWIxNTBmNmpQPGFycmF5dmVjOjplcnJvcnM6\
OkNhcGFjaXR5RXJyb3I8VD4gYXMgY29yZTo6Zm10OjpEZWJ1Zz46OmZtdDo6aDk1YTdhNTAyYjFmND\
kxMTNrTmNvcmU6OnNsaWNlOjo8aW1wbCBbVF0+Ojpjb3B5X2Zyb21fc2xpY2U6Omxlbl9taXNtYXRj\
aF9mYWlsOjpoZjNiYmFiYzAyMDQ4NjRiY2w2Y29yZTo6cGFuaWNraW5nOjpwYW5pY19ib3VuZHNfY2\
hlY2s6OmgxZmI3YTZkZjEwMzMxMjc5bURjb3JlOjpzbGljZTo6aW5kZXg6OnNsaWNlX3N0YXJ0X2lu\
ZGV4X2xlbl9mYWlsX3J0OjpoYjMxN2NhODMzMjA0NjVhNm5CY29yZTo6c2xpY2U6OmluZGV4OjpzbG\
ljZV9lbmRfaW5kZXhfbGVuX2ZhaWxfcnQ6OmhmY2Y5M2RkMzVmMDExMmJkbxhfX3diZ19kaWdlc3Rj\
b250ZXh0X2ZyZWVwN3N0ZDo6cGFuaWNraW5nOjpydXN0X3BhbmljX3dpdGhfaG9vazo6aDcwYTBlMT\
k1ZjRkYjJhMjlxMWNvbXBpbGVyX2J1aWx0aW5zOjptZW06Om1lbWNtcDo6aDEyODViODQxMjBkZjVk\
Y2RyFGRpZ2VzdGNvbnRleHRfdXBkYXRlcyljb3JlOjpwYW5pY2tpbmc6OnBhbmljOjpoOGFmMDQ2Mz\
k3YTJiZjY1ZHQ6Ymxha2UyOjpCbGFrZTJiVmFyQ29yZTo6bmV3X3dpdGhfcGFyYW1zOjpoZmU3YThi\
OTZmMTJiYjNlZHURcnVzdF9iZWdpbl91bndpbmR2Q2NvcmU6OmZtdDo6Rm9ybWF0dGVyOjpwYWRfaW\
50ZWdyYWw6OndyaXRlX3ByZWZpeDo6aDYwYjFiNTAzZTY2ZjMyYjF3NGFsbG9jOjpyYXdfdmVjOjpj\
YXBhY2l0eV9vdmVyZmxvdzo6aDRiMjc1Y2IzYzEwYjBhNzh4LWNvcmU6OnBhbmlja2luZzo6cGFuaW\
NfZm10OjpoNzUxYmU4MDc3OWQ0MmI1M3lDc3RkOjpwYW5pY2tpbmc6OmJlZ2luX3BhbmljX2hhbmRs\
ZXI6Ont7Y2xvc3VyZX19OjpoZGNmYzgxOWNlODM2ODI5ZXoRX193YmluZGdlbl9tYWxsb2N7OmJsYW\
tlMjo6Qmxha2Uyc1ZhckNvcmU6Om5ld193aXRoX3BhcmFtczo6aDdkODRlMGQyN2JiNzFmYWF8SXN0\
ZDo6c3lzX2NvbW1vbjo6YmFja3RyYWNlOjpfX3J1c3RfZW5kX3Nob3J0X2JhY2t0cmFjZTo6aDUzY2\
FiYWZhYjViMDlhZGF9P3dhc21fYmluZGdlbjo6Y29udmVydDo6Y2xvc3VyZXM6Omludm9rZTRfbXV0\
OjpoMjVkYWUzZDIwMTM3NzFmNn4/d2FzbV9iaW5kZ2VuOjpjb252ZXJ0OjpjbG9zdXJlczo6aW52b2\
tlM19tdXQ6Omg5NDRjN2I1M2RkMDI5YmE1fz93YXNtX2JpbmRnZW46OmNvbnZlcnQ6OmNsb3N1cmVz\
OjppbnZva2UzX211dDo6aDEwMWI3OGEyODkzYzAxZTWAAT93YXNtX2JpbmRnZW46OmNvbnZlcnQ6Om\
Nsb3N1cmVzOjppbnZva2UzX211dDo6aDM4YWRlNGE4NThmNGRjNmSBAT93YXNtX2JpbmRnZW46OmNv\
bnZlcnQ6OmNsb3N1cmVzOjppbnZva2UzX211dDo6aDdkZmM4ODhmOGY5ZDM3YjaCAT93YXNtX2Jpbm\
RnZW46OmNvbnZlcnQ6OmNsb3N1cmVzOjppbnZva2UzX211dDo6aDA3ZjNlM2I2OWE5OTkyM2GDAT93\
YXNtX2JpbmRnZW46OmNvbnZlcnQ6OmNsb3N1cmVzOjppbnZva2UzX211dDo6aGI2ZDRkNzUxZTE2ZT\
I5ODCEAT93YXNtX2JpbmRnZW46OmNvbnZlcnQ6OmNsb3N1cmVzOjppbnZva2UzX211dDo6aDlhM2Qx\
NTUyMzVkY2QzZjeFAT93YXNtX2JpbmRnZW46OmNvbnZlcnQ6OmNsb3N1cmVzOjppbnZva2UzX211dD\
o6aGIwOWFiMmQ0MjdkMzBjNWKGAT93YXNtX2JpbmRnZW46OmNvbnZlcnQ6OmNsb3N1cmVzOjppbnZv\
a2UyX211dDo6aDQxMzc3NGY1ZjhkZGQyNDiHARJfX3diaW5kZ2VuX3JlYWxsb2OIAT93YXNtX2Jpbm\
RnZW46OmNvbnZlcnQ6OmNsb3N1cmVzOjppbnZva2UxX211dDo6aDk3NDUyYTI3NWRjMDY3YmaJATA8\
JlQgYXMgY29yZTo6Zm10OjpEZWJ1Zz46OmZtdDo6aGZmNGFmMWI0YTgxMzk5NmGKATI8JlQgYXMgY2\
9yZTo6Zm10OjpEaXNwbGF5Pjo6Zm10OjpoOWFkYTE1Y2ZhZTdmNDIxMosBD19fd2JpbmRnZW5fZnJl\
ZYwBP2NvcmU6OnNsaWNlOjppbmRleDo6c2xpY2VfZW5kX2luZGV4X2xlbl9mYWlsOjpoM2RiNDc2Yj\
BkMDk5OTRkMo0BQWNvcmU6OnNsaWNlOjppbmRleDo6c2xpY2Vfc3RhcnRfaW5kZXhfbGVuX2ZhaWw6\
OmgxMzZjY2FkNzY0MTM2ODEwjgEzYXJyYXl2ZWM6OmFycmF5dmVjOjpleHRlbmRfcGFuaWM6OmhkMj\
U4ZTA5N2FmNDdjNjdjjwE5Y29yZTo6b3BzOjpmdW5jdGlvbjo6Rm5PbmNlOjpjYWxsX29uY2U6Omhl\
MDIxZGJiZjZmYWFhMDZkkAEfX193YmluZGdlbl9hZGRfdG9fc3RhY2tfcG9pbnRlcpEBMXdhc21fYm\
luZGdlbjo6X19ydDo6dGhyb3dfbnVsbDo6aGY1MTcxZjBjZmY5YTE1MjGSATJ3YXNtX2JpbmRnZW46\
Ol9fcnQ6OmJvcnJvd19mYWlsOjpoOTRiZDgxZjkyOGIzODI5OJMBKndhc21fYmluZGdlbjo6dGhyb3\
dfc3RyOjpoMzBhYzBkOTY4ZWVkMjhkNJQBBm1lbXNldJUBBm1lbWNweZYBBm1lbWNtcJcBMTxUIGFz\
IGNvcmU6OmFueTo6QW55Pjo6dHlwZV9pZDo6aDEzYzc4NTk2Njg4ZjY3YjKYAQpydXN0X3BhbmljmQ\
FvY29yZTo6cHRyOjpkcm9wX2luX3BsYWNlPCZjb3JlOjppdGVyOjphZGFwdGVyczo6Y29waWVkOjpD\
b3BpZWQ8Y29yZTo6c2xpY2U6Oml0ZXI6Okl0ZXI8dTg+Pj46OmgwNWZhMGY5NzFiNDZiMGU3AO+AgI\
AACXByb2R1Y2VycwIIbGFuZ3VhZ2UBBFJ1c3QADHByb2Nlc3NlZC1ieQMFcnVzdGMdMS42NS4wICg4\
OTdlMzc1NTMgMjAyMi0xMS0wMikGd2FscnVzBjAuMTkuMAx3YXNtLWJpbmRnZW4GMC4yLjgz\
");
    const wasmModule = new WebAssembly.Module(wasmBytes);
    return new WebAssembly.Instance(wasmModule, imports);
}
function base64decode(b64) {
    const binString = atob(b64);
    const size = binString.length;
    const bytes = new Uint8Array(size);
    for(let i = 0; i < size; i++){
        bytes[i] = binString.charCodeAt(i);
    }
    return bytes;
}
const digestAlgorithms = [
    "BLAKE2B-224",
    "BLAKE2B-256",
    "BLAKE2B-384",
    "BLAKE2B",
    "BLAKE2S",
    "BLAKE3",
    "KECCAK-224",
    "KECCAK-256",
    "KECCAK-384",
    "KECCAK-512",
    "SHA-384",
    "SHA3-224",
    "SHA3-256",
    "SHA3-384",
    "SHA3-512",
    "SHAKE128",
    "SHAKE256",
    "TIGER",
    "RIPEMD-160",
    "SHA-224",
    "SHA-256",
    "SHA-512",
    "MD4",
    "MD5",
    "SHA-1"
];
function timingSafeEqual(a, b) {
    if (a.byteLength !== b.byteLength) {
        return false;
    }
    if (!(a instanceof DataView)) {
        a = ArrayBuffer.isView(a) ? new DataView(a.buffer, a.byteOffset, a.byteLength) : new DataView(a);
    }
    if (!(b instanceof DataView)) {
        b = ArrayBuffer.isView(b) ? new DataView(b.buffer, b.byteOffset, b.byteLength) : new DataView(b);
    }
    assert(a instanceof DataView);
    assert(b instanceof DataView);
    const length = a.byteLength;
    let out = 0;
    let i = -1;
    while(++i < length){
        out |= a.getUint8(i) ^ b.getUint8(i);
    }
    return out === 0;
}
function swap32(val) {
    return (val & 0xff) << 24 | (val & 0xff00) << 8 | val >> 8 & 0xff00 | val >> 24 & 0xff;
}
function n16(n) {
    return n & 0xffff;
}
function n32(n) {
    return n >>> 0;
}
function add32WithCarry(a, b) {
    const added = n32(a) + n32(b);
    return [
        n32(added),
        added > 0xffffffff ? 1 : 0
    ];
}
function mul32WithCarry(a, b) {
    const al = n16(a);
    const ah = n16(a >>> 16);
    const bl = n16(b);
    const bh = n16(b >>> 16);
    const [t, tc] = add32WithCarry(al * bh, ah * bl);
    const [n, nc] = add32WithCarry(al * bl, n32(t << 16));
    const carry = nc + (tc << 16) + n16(t >>> 16) + ah * bh;
    return [
        n,
        carry
    ];
}
function mul32(a, b) {
    const al = n16(a);
    const ah = a - al;
    return n32(n32(ah * b) + al * b);
}
function mul64([ah, al], [bh, bl]) {
    const [n, c] = mul32WithCarry(al, bl);
    return [
        n32(mul32(al, bh) + mul32(ah, bl) + c),
        n
    ];
}
const prime32 = 16777619;
const fnv32 = (data)=>{
    let hash = 2166136261;
    data.forEach((c)=>{
        hash = mul32(hash, prime32);
        hash ^= c;
    });
    return Uint32Array.from([
        swap32(hash)
    ]).buffer;
};
const fnv32a = (data)=>{
    let hash = 2166136261;
    data.forEach((c)=>{
        hash ^= c;
        hash = mul32(hash, prime32);
    });
    return Uint32Array.from([
        swap32(hash)
    ]).buffer;
};
const prime64Lo = 435;
const prime64Hi = 256;
const fnv64 = (data)=>{
    let hashLo = 2216829733;
    let hashHi = 3421674724;
    data.forEach((c)=>{
        [hashHi, hashLo] = mul64([
            hashHi,
            hashLo
        ], [
            prime64Hi,
            prime64Lo
        ]);
        hashLo ^= c;
    });
    return new Uint32Array([
        swap32(hashHi >>> 0),
        swap32(hashLo >>> 0)
    ]).buffer;
};
const fnv64a = (data)=>{
    let hashLo = 2216829733;
    let hashHi = 3421674724;
    data.forEach((c)=>{
        hashLo ^= c;
        [hashHi, hashLo] = mul64([
            hashHi,
            hashLo
        ], [
            prime64Hi,
            prime64Lo
        ]);
    });
    return new Uint32Array([
        swap32(hashHi >>> 0),
        swap32(hashLo >>> 0)
    ]).buffer;
};
function fnv(name, buf) {
    if (!buf) {
        throw new TypeError("no data provided for hashing");
    }
    switch(name){
        case "FNV32":
            return fnv32(buf);
        case "FNV64":
            return fnv64(buf);
        case "FNV32A":
            return fnv32a(buf);
        case "FNV64A":
            return fnv64a(buf);
        default:
            throw new TypeError(`unsupported fnv digest: ${name}`);
    }
}
const webCrypto = ((crypto1)=>({
        getRandomValues: crypto1.getRandomValues?.bind(crypto1),
        randomUUID: crypto1.randomUUID?.bind(crypto1),
        subtle: {
            decrypt: crypto1.subtle?.decrypt?.bind(crypto1.subtle),
            deriveBits: crypto1.subtle?.deriveBits?.bind(crypto1.subtle),
            deriveKey: crypto1.subtle?.deriveKey?.bind(crypto1.subtle),
            digest: crypto1.subtle?.digest?.bind(crypto1.subtle),
            encrypt: crypto1.subtle?.encrypt?.bind(crypto1.subtle),
            exportKey: crypto1.subtle?.exportKey?.bind(crypto1.subtle),
            generateKey: crypto1.subtle?.generateKey?.bind(crypto1.subtle),
            importKey: crypto1.subtle?.importKey?.bind(crypto1.subtle),
            sign: crypto1.subtle?.sign?.bind(crypto1.subtle),
            unwrapKey: crypto1.subtle?.unwrapKey?.bind(crypto1.subtle),
            verify: crypto1.subtle?.verify?.bind(crypto1.subtle),
            wrapKey: crypto1.subtle?.wrapKey?.bind(crypto1.subtle)
        }
    }))(globalThis.crypto);
const bufferSourceBytes = (data)=>{
    let bytes;
    if (data instanceof Uint8Array) {
        bytes = data;
    } else if (ArrayBuffer.isView(data)) {
        bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    } else if (data instanceof ArrayBuffer) {
        bytes = new Uint8Array(data);
    }
    return bytes;
};
const stdCrypto = ((x)=>x)({
    ...webCrypto,
    subtle: {
        ...webCrypto.subtle,
        async digest (algorithm, data) {
            const { name, length } = normalizeAlgorithm(algorithm);
            const bytes = bufferSourceBytes(data);
            if (FNVAlgorithms.includes(name)) {
                return fnv(name, bytes);
            }
            if (webCryptoDigestAlgorithms.includes(name) && bytes) {
                return webCrypto.subtle.digest(algorithm, bytes);
            } else if (digestAlgorithms.includes(name)) {
                if (bytes) {
                    return stdCrypto.subtle.digestSync(algorithm, bytes);
                } else if (data[Symbol.iterator]) {
                    return stdCrypto.subtle.digestSync(algorithm, data);
                } else if (data[Symbol.asyncIterator]) {
                    const wasmCrypto = instantiate();
                    const context = new wasmCrypto.DigestContext(name);
                    for await (const chunk of data){
                        const chunkBytes = bufferSourceBytes(chunk);
                        if (!chunkBytes) {
                            throw new TypeError("data contained chunk of the wrong type");
                        }
                        context.update(chunkBytes);
                    }
                    return context.digestAndDrop(length).buffer;
                } else {
                    throw new TypeError("data must be a BufferSource or [Async]Iterable<BufferSource>");
                }
            } else if (webCrypto.subtle?.digest) {
                return webCrypto.subtle.digest(algorithm, data);
            } else {
                throw new TypeError(`unsupported digest algorithm: ${algorithm}`);
            }
        },
        digestSync (algorithm, data) {
            algorithm = normalizeAlgorithm(algorithm);
            const bytes = bufferSourceBytes(data);
            if (FNVAlgorithms.includes(algorithm.name)) {
                return fnv(algorithm.name, bytes);
            }
            const wasmCrypto = instantiate();
            if (bytes) {
                return wasmCrypto.digest(algorithm.name, bytes, algorithm.length).buffer;
            } else if (data[Symbol.iterator]) {
                const context = new wasmCrypto.DigestContext(algorithm.name);
                for (const chunk of data){
                    const chunkBytes = bufferSourceBytes(chunk);
                    if (!chunkBytes) {
                        throw new TypeError("data contained chunk of the wrong type");
                    }
                    context.update(chunkBytes);
                }
                return context.digestAndDrop(algorithm.length).buffer;
            } else {
                throw new TypeError("data must be a BufferSource or Iterable<BufferSource>");
            }
        },
        timingSafeEqual
    }
});
const FNVAlgorithms = [
    "FNV32",
    "FNV32A",
    "FNV64",
    "FNV64A"
];
const webCryptoDigestAlgorithms = [
    "SHA-384",
    "SHA-256",
    "SHA-512",
    "SHA-1"
];
const normalizeAlgorithm = (algorithm)=>typeof algorithm === "string" ? {
        name: algorithm.toUpperCase()
    } : {
        ...algorithm,
        name: algorithm.name.toUpperCase()
    };
const { Deno: Deno1 } = globalThis;
typeof Deno1?.noColor === "boolean" ? Deno1.noColor : false;
new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"
].join("|"), "g");
var TokenType;
(function(TokenType) {
    TokenType[TokenType["BeginObject"] = 0] = "BeginObject";
    TokenType[TokenType["EndObject"] = 1] = "EndObject";
    TokenType[TokenType["BeginArray"] = 2] = "BeginArray";
    TokenType[TokenType["EndArray"] = 3] = "EndArray";
    TokenType[TokenType["NameSeparator"] = 4] = "NameSeparator";
    TokenType[TokenType["ValueSeparator"] = 5] = "ValueSeparator";
    TokenType[TokenType["NullOrTrueOrFalseOrNumber"] = 6] = "NullOrTrueOrFalseOrNumber";
    TokenType[TokenType["String"] = 7] = "String";
})(TokenType || (TokenType = {}));
const originalJSONParse = globalThis.JSON.parse;
class JSONCParser {
    #whitespace = new Set(" \t\r\n");
    #numberEndToken = new Set([
        ..."[]{}:,/",
        ...this.#whitespace
    ]);
    #text;
    #length;
    #tokenized;
    #options;
    constructor(text, options){
        this.#text = `${text}`;
        this.#length = this.#text.length;
        this.#tokenized = this.#tokenize();
        this.#options = options;
    }
    parse() {
        const token = this.#getNext();
        const res = this.#parseJsonValue(token);
        const { done, value: value1 } = this.#tokenized.next();
        if (!done) {
            throw new SyntaxError(buildErrorMessage(value1));
        }
        return res;
    }
    #getNext() {
        const { done, value: value1 } = this.#tokenized.next();
        if (done) {
            throw new SyntaxError("Unexpected end of JSONC input");
        }
        return value1;
    }
    *#tokenize() {
        for(let i = 0; i < this.#length; i++){
            if (this.#whitespace.has(this.#text[i])) {
                continue;
            }
            if (this.#text[i] === "/" && this.#text[i + 1] === "*") {
                i += 2;
                let hasEndOfComment = false;
                for(; i < this.#length; i++){
                    if (this.#text[i] === "*" && this.#text[i + 1] === "/") {
                        hasEndOfComment = true;
                        break;
                    }
                }
                if (!hasEndOfComment) {
                    throw new SyntaxError("Unexpected end of JSONC input");
                }
                i++;
                continue;
            }
            if (this.#text[i] === "/" && this.#text[i + 1] === "/") {
                i += 2;
                for(; i < this.#length; i++){
                    if (this.#text[i] === "\n" || this.#text[i] === "\r") {
                        break;
                    }
                }
                continue;
            }
            switch(this.#text[i]){
                case "{":
                    yield {
                        type: TokenType.BeginObject,
                        position: i
                    };
                    break;
                case "}":
                    yield {
                        type: TokenType.EndObject,
                        position: i
                    };
                    break;
                case "[":
                    yield {
                        type: TokenType.BeginArray,
                        position: i
                    };
                    break;
                case "]":
                    yield {
                        type: TokenType.EndArray,
                        position: i
                    };
                    break;
                case ":":
                    yield {
                        type: TokenType.NameSeparator,
                        position: i
                    };
                    break;
                case ",":
                    yield {
                        type: TokenType.ValueSeparator,
                        position: i
                    };
                    break;
                case '"':
                    {
                        const startIndex = i;
                        let shouldEscapeNext = false;
                        i++;
                        for(; i < this.#length; i++){
                            if (this.#text[i] === '"' && !shouldEscapeNext) {
                                break;
                            }
                            shouldEscapeNext = this.#text[i] === "\\" && !shouldEscapeNext;
                        }
                        yield {
                            type: TokenType.String,
                            sourceText: this.#text.substring(startIndex, i + 1),
                            position: startIndex
                        };
                        break;
                    }
                default:
                    {
                        const startIndex = i;
                        for(; i < this.#length; i++){
                            if (this.#numberEndToken.has(this.#text[i])) {
                                break;
                            }
                        }
                        i--;
                        yield {
                            type: TokenType.NullOrTrueOrFalseOrNumber,
                            sourceText: this.#text.substring(startIndex, i + 1),
                            position: startIndex
                        };
                    }
            }
        }
    }
    #parseJsonValue(value1) {
        switch(value1.type){
            case TokenType.BeginObject:
                return this.#parseObject();
            case TokenType.BeginArray:
                return this.#parseArray();
            case TokenType.NullOrTrueOrFalseOrNumber:
                return this.#parseNullOrTrueOrFalseOrNumber(value1);
            case TokenType.String:
                return this.#parseString(value1);
            default:
                throw new SyntaxError(buildErrorMessage(value1));
        }
    }
    #parseObject() {
        const target = {};
        for(let isFirst = true;; isFirst = false){
            const token1 = this.#getNext();
            if ((isFirst || this.#options.allowTrailingComma) && token1.type === TokenType.EndObject) {
                return target;
            }
            if (token1.type !== TokenType.String) {
                throw new SyntaxError(buildErrorMessage(token1));
            }
            const key = this.#parseString(token1);
            const token2 = this.#getNext();
            if (token2.type !== TokenType.NameSeparator) {
                throw new SyntaxError(buildErrorMessage(token2));
            }
            const token3 = this.#getNext();
            Object.defineProperty(target, key, {
                value: this.#parseJsonValue(token3),
                writable: true,
                enumerable: true,
                configurable: true
            });
            const token4 = this.#getNext();
            if (token4.type === TokenType.EndObject) {
                return target;
            }
            if (token4.type !== TokenType.ValueSeparator) {
                throw new SyntaxError(buildErrorMessage(token4));
            }
        }
    }
    #parseArray() {
        const target = [];
        for(let isFirst = true;; isFirst = false){
            const token1 = this.#getNext();
            if ((isFirst || this.#options.allowTrailingComma) && token1.type === TokenType.EndArray) {
                return target;
            }
            target.push(this.#parseJsonValue(token1));
            const token2 = this.#getNext();
            if (token2.type === TokenType.EndArray) {
                return target;
            }
            if (token2.type !== TokenType.ValueSeparator) {
                throw new SyntaxError(buildErrorMessage(token2));
            }
        }
    }
    #parseString(value1) {
        let parsed;
        try {
            parsed = originalJSONParse(value1.sourceText);
        } catch  {
            throw new SyntaxError(buildErrorMessage(value1));
        }
        assert(typeof parsed === "string");
        return parsed;
    }
    #parseNullOrTrueOrFalseOrNumber(value1) {
        if (value1.sourceText === "null") {
            return null;
        }
        if (value1.sourceText === "true") {
            return true;
        }
        if (value1.sourceText === "false") {
            return false;
        }
        let parsed;
        try {
            parsed = originalJSONParse(value1.sourceText);
        } catch  {
            throw new SyntaxError(buildErrorMessage(value1));
        }
        assert(typeof parsed === "number");
        return parsed;
    }
}
function buildErrorMessage({ type, sourceText, position }) {
    let token = "";
    switch(type){
        case TokenType.BeginObject:
            token = "{";
            break;
        case TokenType.EndObject:
            token = "}";
            break;
        case TokenType.BeginArray:
            token = "[";
            break;
        case TokenType.EndArray:
            token = "]";
            break;
        case TokenType.NameSeparator:
            token = ":";
            break;
        case TokenType.ValueSeparator:
            token = ",";
            break;
        case TokenType.NullOrTrueOrFalseOrNumber:
        case TokenType.String:
            token = 30 < sourceText.length ? `${sourceText.slice(0, 30)}...` : sourceText;
            break;
        default:
            throw new Error("unreachable");
    }
    return `Unexpected token ${token} in JSONC at position ${position}`;
}
function deferred() {
    let methods;
    let state = "pending";
    const promise = new Promise((resolve, reject)=>{
        methods = {
            async resolve (value1) {
                await value1;
                state = "fulfilled";
                resolve(value1);
            },
            reject (reason) {
                state = "rejected";
                reject(reason);
            }
        };
    });
    Object.defineProperty(promise, "state", {
        get: ()=>state
    });
    return Object.assign(promise, methods);
}
function debounce(fn, wait) {
    let timeout = null;
    let flush = null;
    const debounced = (...args)=>{
        debounced.clear();
        flush = ()=>{
            debounced.clear();
            fn.call(debounced, ...args);
        };
        timeout = setTimeout(flush, wait);
    };
    debounced.clear = ()=>{
        if (typeof timeout === "number") {
            clearTimeout(timeout);
            timeout = null;
            flush = null;
        }
    };
    debounced.flush = ()=>{
        flush?.();
    };
    Object.defineProperty(debounced, "pending", {
        get: ()=>typeof timeout === "number"
    });
    return debounced;
}
class MuxAsyncIterator {
    #iteratorCount = 0;
    #yields = [];
    #throws = [];
    #signal = deferred();
    add(iterable) {
        ++this.#iteratorCount;
        this.#callIteratorNext(iterable[Symbol.asyncIterator]());
    }
    async #callIteratorNext(iterator) {
        try {
            const { value: value1, done } = await iterator.next();
            if (done) {
                --this.#iteratorCount;
            } else {
                this.#yields.push({
                    iterator,
                    value: value1
                });
            }
        } catch (e) {
            this.#throws.push(e);
        }
        this.#signal.resolve();
    }
    async *iterate() {
        while(this.#iteratorCount > 0){
            await this.#signal;
            for(let i = 0; i < this.#yields.length; i++){
                const { iterator, value: value1 } = this.#yields[i];
                yield value1;
                this.#callIteratorNext(iterator);
            }
            if (this.#throws.length) {
                for (const e of this.#throws){
                    throw e;
                }
                this.#throws.length = 0;
            }
            this.#yields.length = 0;
            this.#signal = deferred();
        }
    }
    [Symbol.asyncIterator]() {
        return this.iterate();
    }
}
function copy(src, dst, off = 0) {
    off = Math.max(0, Math.min(off, dst.byteLength));
    const dstBytesAvailable = dst.byteLength - off;
    if (src.byteLength > dstBytesAvailable) {
        src = src.subarray(0, dstBytesAvailable);
    }
    dst.set(src, off);
    return src.byteLength;
}
const MAX_SIZE = 2 ** 32 - 2;
class Buffer {
    #buf;
    #off = 0;
    #readable = new ReadableStream({
        type: "bytes",
        pull: (controller)=>{
            const view = new Uint8Array(controller.byobRequest.view.buffer);
            if (this.empty()) {
                this.reset();
                controller.close();
                controller.byobRequest.respond(0);
                return;
            }
            const nread = copy(this.#buf.subarray(this.#off), view);
            this.#off += nread;
            controller.byobRequest.respond(nread);
        },
        autoAllocateChunkSize: 16_640
    });
    get readable() {
        return this.#readable;
    }
    #writable = new WritableStream({
        write: (chunk)=>{
            const m = this.#grow(chunk.byteLength);
            copy(chunk, this.#buf, m);
        }
    });
    get writable() {
        return this.#writable;
    }
    constructor(ab){
        this.#buf = ab === undefined ? new Uint8Array(0) : new Uint8Array(ab);
    }
    bytes(options = {
        copy: true
    }) {
        if (options.copy === false) return this.#buf.subarray(this.#off);
        return this.#buf.slice(this.#off);
    }
    empty() {
        return this.#buf.byteLength <= this.#off;
    }
    get length() {
        return this.#buf.byteLength - this.#off;
    }
    get capacity() {
        return this.#buf.buffer.byteLength;
    }
    truncate(n) {
        if (n === 0) {
            this.reset();
            return;
        }
        if (n < 0 || n > this.length) {
            throw Error("bytes.Buffer: truncation out of range");
        }
        this.#reslice(this.#off + n);
    }
    reset() {
        this.#reslice(0);
        this.#off = 0;
    }
    #tryGrowByReslice(n) {
        const l = this.#buf.byteLength;
        if (n <= this.capacity - l) {
            this.#reslice(l + n);
            return l;
        }
        return -1;
    }
    #reslice(len) {
        assert(len <= this.#buf.buffer.byteLength);
        this.#buf = new Uint8Array(this.#buf.buffer, 0, len);
    }
    #grow(n) {
        const m = this.length;
        if (m === 0 && this.#off !== 0) {
            this.reset();
        }
        const i = this.#tryGrowByReslice(n);
        if (i >= 0) {
            return i;
        }
        const c = this.capacity;
        if (n <= Math.floor(c / 2) - m) {
            copy(this.#buf.subarray(this.#off), this.#buf);
        } else if (c + n > MAX_SIZE) {
            throw new Error("The buffer cannot be grown beyond the maximum size.");
        } else {
            const buf = new Uint8Array(Math.min(2 * c + n, MAX_SIZE));
            copy(this.#buf.subarray(this.#off), buf);
            this.#buf = buf;
        }
        this.#off = 0;
        this.#reslice(Math.min(m + n, MAX_SIZE));
        return m;
    }
    grow(n) {
        if (n < 0) {
            throw Error("Buffer.grow: negative count");
        }
        const m = this.#grow(n);
        this.#reslice(m);
    }
}
function createLPS(pat) {
    const lps = new Uint8Array(pat.length);
    lps[0] = 0;
    let prefixEnd = 0;
    let i = 1;
    while(i < lps.length){
        if (pat[i] == pat[prefixEnd]) {
            prefixEnd++;
            lps[i] = prefixEnd;
            i++;
        } else if (prefixEnd === 0) {
            lps[i] = 0;
            i++;
        } else {
            prefixEnd = lps[prefixEnd - 1];
        }
    }
    return lps;
}
class BytesList {
    #len = 0;
    #chunks = [];
    constructor(){}
    size() {
        return this.#len;
    }
    add(value1, start = 0, end = value1.byteLength) {
        if (value1.byteLength === 0 || end - start === 0) {
            return;
        }
        checkRange(start, end, value1.byteLength);
        this.#chunks.push({
            value: value1,
            end,
            start,
            offset: this.#len
        });
        this.#len += end - start;
    }
    shift(n) {
        if (n === 0) {
            return;
        }
        if (this.#len <= n) {
            this.#chunks = [];
            this.#len = 0;
            return;
        }
        const idx = this.getChunkIndex(n);
        this.#chunks.splice(0, idx);
        const [chunk] = this.#chunks;
        if (chunk) {
            const diff = n - chunk.offset;
            chunk.start += diff;
        }
        let offset = 0;
        for (const chunk of this.#chunks){
            chunk.offset = offset;
            offset += chunk.end - chunk.start;
        }
        this.#len = offset;
    }
    getChunkIndex(pos) {
        let max = this.#chunks.length;
        let min = 0;
        while(true){
            const i = min + Math.floor((max - min) / 2);
            if (i < 0 || this.#chunks.length <= i) {
                return -1;
            }
            const { offset, start, end } = this.#chunks[i];
            const len = end - start;
            if (offset <= pos && pos < offset + len) {
                return i;
            } else if (offset + len <= pos) {
                min = i + 1;
            } else {
                max = i - 1;
            }
        }
    }
    get(i) {
        if (i < 0 || this.#len <= i) {
            throw new Error("out of range");
        }
        const idx = this.getChunkIndex(i);
        const { value: value1, offset, start } = this.#chunks[idx];
        return value1[start + i - offset];
    }
    *iterator(start = 0) {
        const startIdx = this.getChunkIndex(start);
        if (startIdx < 0) return;
        const first = this.#chunks[startIdx];
        let firstOffset = start - first.offset;
        for(let i = startIdx; i < this.#chunks.length; i++){
            const chunk = this.#chunks[i];
            for(let j = chunk.start + firstOffset; j < chunk.end; j++){
                yield chunk.value[j];
            }
            firstOffset = 0;
        }
    }
    slice(start, end = this.#len) {
        if (end === start) {
            return new Uint8Array();
        }
        checkRange(start, end, this.#len);
        const result = new Uint8Array(end - start);
        const startIdx = this.getChunkIndex(start);
        const endIdx = this.getChunkIndex(end - 1);
        let written = 0;
        for(let i = startIdx; i <= endIdx; i++){
            const { value: chunkValue, start: chunkStart, end: chunkEnd, offset: chunkOffset } = this.#chunks[i];
            const readStart = chunkStart + (i === startIdx ? start - chunkOffset : 0);
            const readEnd = i === endIdx ? end - chunkOffset + chunkStart : chunkEnd;
            const len = readEnd - readStart;
            result.set(chunkValue.subarray(readStart, readEnd), written);
            written += len;
        }
        return result;
    }
    concat() {
        const result = new Uint8Array(this.#len);
        let sum = 0;
        for (const { value: value1, start, end } of this.#chunks){
            result.set(value1.subarray(start, end), sum);
            sum += end - start;
        }
        return result;
    }
}
function checkRange(start, end, len) {
    if (start < 0 || len < start || end < 0 || len < end || end < start) {
        throw new Error("invalid range");
    }
}
class DelimiterStream extends TransformStream {
    #bufs = new BytesList();
    #delimiter;
    #inspectIndex = 0;
    #matchIndex = 0;
    #delimLen;
    #delimLPS;
    #disp;
    constructor(delimiter, options){
        super({
            transform: (chunk, controller)=>{
                this.#handle(chunk, controller);
            },
            flush: (controller)=>{
                controller.enqueue(this.#bufs.concat());
            }
        });
        this.#delimiter = delimiter;
        this.#delimLen = delimiter.length;
        this.#delimLPS = createLPS(delimiter);
        this.#disp = options?.disposition ?? "discard";
    }
    #handle(chunk, controller) {
        this.#bufs.add(chunk);
        let localIndex = 0;
        while(this.#inspectIndex < this.#bufs.size()){
            if (chunk[localIndex] === this.#delimiter[this.#matchIndex]) {
                this.#inspectIndex++;
                localIndex++;
                this.#matchIndex++;
                if (this.#matchIndex === this.#delimLen) {
                    const start = this.#inspectIndex - this.#delimLen;
                    const end = this.#disp == "suffix" ? this.#inspectIndex : start;
                    const copy = this.#bufs.slice(0, end);
                    controller.enqueue(copy);
                    const shift = this.#disp == "prefix" ? start : this.#inspectIndex;
                    this.#bufs.shift(shift);
                    this.#inspectIndex = this.#disp == "prefix" ? this.#delimLen : 0;
                    this.#matchIndex = 0;
                }
            } else {
                if (this.#matchIndex === 0) {
                    this.#inspectIndex++;
                    localIndex++;
                } else {
                    this.#matchIndex = this.#delimLPS[this.#matchIndex - 1];
                }
            }
        }
    }
}
BigInt(Number.MAX_SAFE_INTEGER);
new TextDecoder();
new Deno.errors.AlreadyExists("dest already exists.");
var EOL;
(function(EOL) {
    EOL["LF"] = "\n";
    EOL["CRLF"] = "\r\n";
})(EOL || (EOL = {}));
const re = [];
const src = [];
let R = 0;
const NUMERICIDENTIFIER = R++;
src[NUMERICIDENTIFIER] = "0|[1-9]\\d*";
const NONNUMERICIDENTIFIER = R++;
src[NONNUMERICIDENTIFIER] = "\\d*[a-zA-Z-][a-zA-Z0-9-]*";
const MAINVERSION = R++;
const nid = src[NUMERICIDENTIFIER];
src[MAINVERSION] = `(${nid})\\.(${nid})\\.(${nid})`;
const PRERELEASEIDENTIFIER = R++;
src[PRERELEASEIDENTIFIER] = "(?:" + src[NUMERICIDENTIFIER] + "|" + src[NONNUMERICIDENTIFIER] + ")";
const PRERELEASE = R++;
src[PRERELEASE] = "(?:-(" + src[PRERELEASEIDENTIFIER] + "(?:\\." + src[PRERELEASEIDENTIFIER] + ")*))";
const BUILDIDENTIFIER = R++;
src[BUILDIDENTIFIER] = "[0-9A-Za-z-]+";
const BUILD = R++;
src[BUILD] = "(?:\\+(" + src[BUILDIDENTIFIER] + "(?:\\." + src[BUILDIDENTIFIER] + ")*))";
const FULL = R++;
const FULLPLAIN = "v?" + src[MAINVERSION] + src[PRERELEASE] + "?" + src[BUILD] + "?";
src[FULL] = "^" + FULLPLAIN + "$";
const GTLT = R++;
src[GTLT] = "((?:<|>)?=?)";
const XRANGEIDENTIFIER = R++;
src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + "|x|X|\\*";
const XRANGEPLAIN = R++;
src[XRANGEPLAIN] = "[v=\\s]*(" + src[XRANGEIDENTIFIER] + ")" + "(?:\\.(" + src[XRANGEIDENTIFIER] + ")" + "(?:\\.(" + src[XRANGEIDENTIFIER] + ")" + "(?:" + src[PRERELEASE] + ")?" + src[BUILD] + "?" + ")?)?";
const XRANGE = R++;
src[XRANGE] = "^" + src[GTLT] + "\\s*" + src[XRANGEPLAIN] + "$";
const LONETILDE = R++;
src[LONETILDE] = "(?:~>?)";
const TILDE = R++;
src[TILDE] = "^" + src[LONETILDE] + src[XRANGEPLAIN] + "$";
const LONECARET = R++;
src[LONECARET] = "(?:\\^)";
const CARET = R++;
src[CARET] = "^" + src[LONECARET] + src[XRANGEPLAIN] + "$";
const COMPARATOR = R++;
src[COMPARATOR] = "^" + src[GTLT] + "\\s*(" + FULLPLAIN + ")$|^$";
const HYPHENRANGE = R++;
src[HYPHENRANGE] = "^\\s*(" + src[XRANGEPLAIN] + ")" + "\\s+-\\s+" + "(" + src[XRANGEPLAIN] + ")" + "\\s*$";
const STAR = R++;
src[STAR] = "(<|>)?=?\\s*\\*";
for(let i = 0; i < R; i++){
    if (!re[i]) {
        re[i] = new RegExp(src[i]);
    }
}
({
    major: Number.POSITIVE_INFINITY,
    minor: Number.POSITIVE_INFINITY,
    patch: Number.POSITIVE_INFINITY,
    prerelease: [],
    build: []
});
({
    major: Number.NEGATIVE_INFINITY,
    minor: Number.POSITIVE_INFINITY,
    patch: Number.POSITIVE_INFINITY,
    prerelease: [],
    build: []
});
({
    major: Number.NaN,
    minor: Number.NaN,
    patch: Number.NaN,
    prerelease: [],
    build: []
});
function minitz(y, m, d, h, i, s, tz, throwOnInvalid) {
    return minitz.fromTZ(minitz.tp(y, m, d, h, i, s, tz), throwOnInvalid);
}
minitz.fromTZISO = (localTimeStr, tz, throwOnInvalid)=>{
    return minitz.fromTZ(parseISOLocal(localTimeStr, tz), throwOnInvalid);
};
minitz.fromTZ = function(tp, throwOnInvalid) {
    const inDate = new Date(Date.UTC(tp.y, tp.m - 1, tp.d, tp.h, tp.i, tp.s)), offset = getTimezoneOffset(tp.tz, inDate), dateGuess = new Date(inDate.getTime() - offset), dateOffsGuess = getTimezoneOffset(tp.tz, dateGuess);
    if (dateOffsGuess - offset === 0) {
        return dateGuess;
    } else {
        const dateGuess2 = new Date(inDate.getTime() - dateOffsGuess), dateOffsGuess2 = getTimezoneOffset(tp.tz, dateGuess2);
        if (dateOffsGuess2 - dateOffsGuess === 0) {
            return dateGuess2;
        } else if (!throwOnInvalid && dateOffsGuess2 - dateOffsGuess > 0) {
            return dateGuess2;
        } else if (!throwOnInvalid) {
            return dateGuess;
        } else {
            throw new Error("Invalid date passed to fromTZ()");
        }
    }
};
minitz.toTZ = function(d, tzStr) {
    const localDateString = d.toLocaleString("en-US", {
        timeZone: tzStr
    }).replace(/[\u202f]/, " ");
    const td = new Date(localDateString);
    return {
        y: td.getFullYear(),
        m: td.getMonth() + 1,
        d: td.getDate(),
        h: td.getHours(),
        i: td.getMinutes(),
        s: td.getSeconds(),
        tz: tzStr
    };
};
minitz.tp = (y, m, d, h, i, s, tz)=>{
    return {
        y,
        m,
        d,
        h,
        i,
        s,
        tz: tz
    };
};
function getTimezoneOffset(timeZone, date = new Date()) {
    const tz = date.toLocaleString("en-US", {
        timeZone: timeZone,
        timeZoneName: "short"
    }).split(" ").slice(-1)[0];
    const dateString = date.toLocaleString("en-US").replace(/[\u202f]/, " ");
    return Date.parse(`${dateString} GMT`) - Date.parse(`${dateString} ${tz}`);
}
function parseISOLocal(dtStr, tz) {
    const pd = new Date(Date.parse(dtStr));
    if (isNaN(pd)) {
        throw new Error("minitz: Invalid ISO8601 passed to parser.");
    }
    const stringEnd = dtStr.substring(9);
    if (dtStr.includes("Z") || stringEnd.includes("-") || stringEnd.includes("+")) {
        return minitz.tp(pd.getUTCFullYear(), pd.getUTCMonth() + 1, pd.getUTCDate(), pd.getUTCHours(), pd.getUTCMinutes(), pd.getUTCSeconds(), "Etc/UTC");
    } else {
        return minitz.tp(pd.getFullYear(), pd.getMonth() + 1, pd.getDate(), pd.getHours(), pd.getMinutes(), pd.getSeconds(), tz);
    }
}
minitz.minitz = minitz;
function CronOptions(options) {
    if (options === void 0) {
        options = {};
    }
    delete options.name;
    options.legacyMode = options.legacyMode === void 0 ? true : options.legacyMode;
    options.paused = options.paused === void 0 ? false : options.paused;
    options.maxRuns = options.maxRuns === void 0 ? Infinity : options.maxRuns;
    options.catch = options.catch === void 0 ? false : options.catch;
    options.interval = options.interval === void 0 ? 0 : parseInt(options.interval, 10);
    options.utcOffset = options.utcOffset === void 0 ? void 0 : parseInt(options.utcOffset, 10);
    options.unref = options.unref === void 0 ? false : options.unref;
    if (options.startAt) {
        options.startAt = new CronDate(options.startAt, options.timezone);
    }
    if (options.stopAt) {
        options.stopAt = new CronDate(options.stopAt, options.timezone);
    }
    if (options.interval !== null) {
        if (isNaN(options.interval)) {
            throw new Error("CronOptions: Supplied value for interval is not a number");
        } else if (options.interval < 0) {
            throw new Error("CronOptions: Supplied value for interval can not be negative");
        }
    }
    if (options.utcOffset !== void 0) {
        if (isNaN(options.utcOffset)) {
            throw new Error("CronOptions: Invalid value passed for utcOffset, should be number representing minutes offset from UTC.");
        } else if (options.utcOffset < -870 || options.utcOffset > 870) {
            throw new Error("CronOptions: utcOffset out of bounds.");
        }
        if (options.utcOffset !== void 0 && options.timezone) {
            throw new Error("CronOptions: Combining 'utcOffset' with 'timezone' is not allowed.");
        }
    }
    if (options.unref !== true && options.unref !== false) {
        throw new Error("CronOptions: Unref should be either true, false or undefined(false).");
    }
    return options;
}
const DaysOfMonth = [
    31,
    28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
];
const RecursionSteps = [
    [
        "month",
        "year",
        0
    ],
    [
        "day",
        "month",
        -1
    ],
    [
        "hour",
        "day",
        0
    ],
    [
        "minute",
        "hour",
        0
    ],
    [
        "second",
        "minute",
        0
    ]
];
function CronDate(d, tz) {
    this.tz = tz;
    if (d && d instanceof Date) {
        if (!isNaN(d)) {
            this.fromDate(d);
        } else {
            throw new TypeError("CronDate: Invalid date passed to CronDate constructor");
        }
    } else if (d === void 0) {
        this.fromDate(new Date());
    } else if (d && typeof d === "string") {
        this.fromString(d);
    } else if (d instanceof CronDate) {
        this.fromCronDate(d);
    } else {
        throw new TypeError("CronDate: Invalid type (" + typeof d + ") passed to CronDate constructor");
    }
}
CronDate.prototype.fromDate = function(inDate) {
    if (this.tz !== void 0) {
        if (typeof this.tz === "number") {
            this.ms = inDate.getUTCMilliseconds();
            this.second = inDate.getUTCSeconds();
            this.minute = inDate.getUTCMinutes() + this.tz;
            this.hour = inDate.getUTCHours();
            this.day = inDate.getUTCDate();
            this.month = inDate.getUTCMonth();
            this.year = inDate.getUTCFullYear();
            this.apply();
        } else {
            const d = minitz.toTZ(inDate, this.tz);
            this.ms = inDate.getMilliseconds();
            this.second = d.s;
            this.minute = d.i;
            this.hour = d.h;
            this.day = d.d;
            this.month = d.m - 1;
            this.year = d.y;
        }
    } else {
        this.ms = inDate.getMilliseconds();
        this.second = inDate.getSeconds();
        this.minute = inDate.getMinutes();
        this.hour = inDate.getHours();
        this.day = inDate.getDate();
        this.month = inDate.getMonth();
        this.year = inDate.getFullYear();
    }
};
CronDate.prototype.fromCronDate = function(d) {
    this.tz = d.tz;
    this.year = d.year;
    this.month = d.month;
    this.day = d.day;
    this.hour = d.hour;
    this.minute = d.minute;
    this.second = d.second;
    this.ms = d.ms;
};
CronDate.prototype.apply = function() {
    if (this.month > 11 || this.day > DaysOfMonth[this.month] || this.hour > 59 || this.minute > 59 || this.second > 59 || this.hour < 0 || this.minute < 0 || this.second < 0) {
        const d = new Date(Date.UTC(this.year, this.month, this.day, this.hour, this.minute, this.second, this.ms));
        this.ms = d.getUTCMilliseconds();
        this.second = d.getUTCSeconds();
        this.minute = d.getUTCMinutes();
        this.hour = d.getUTCHours();
        this.day = d.getUTCDate();
        this.month = d.getUTCMonth();
        this.year = d.getUTCFullYear();
        return true;
    } else {
        return false;
    }
};
CronDate.prototype.fromString = function(str) {
    return this.fromDate(minitz.fromTZISO(str, this.tz));
};
CronDate.prototype.findNext = function(options, target, pattern, offset) {
    const originalTarget = this[target];
    let lastDayOfMonth;
    if (pattern.lastDayOfMonth || pattern.lastWeekdayOfMonth) {
        if (this.month !== 1) {
            lastDayOfMonth = DaysOfMonth[this.month];
        } else {
            lastDayOfMonth = new Date(Date.UTC(this.year, this.month + 1, 0, 0, 0, 0, 0)).getUTCDate();
        }
    }
    const fDomWeekDay = !pattern.starDOW && target == "day" ? new Date(Date.UTC(this.year, this.month, 1, 0, 0, 0, 0)).getUTCDay() : undefined;
    for(let i = this[target] + offset; i < pattern[target].length; i++){
        let match = pattern[target][i];
        if (target === "day" && pattern.lastDayOfMonth && i - offset == lastDayOfMonth) {
            match = true;
        }
        if (target === "day" && !pattern.starDOW) {
            let dowMatch = pattern.dayOfWeek[(fDomWeekDay + (i - offset - 1)) % 7];
            if (dowMatch && pattern.lastWeekdayOfMonth) {
                dowMatch = dowMatch && i - offset > lastDayOfMonth - 7;
            }
            if (options.legacyMode && !pattern.starDOM) {
                match = match || dowMatch;
            } else {
                match = match && dowMatch;
            }
        }
        if (match) {
            this[target] = i - offset;
            return originalTarget !== this[target] ? 2 : 1;
        }
    }
    return 3;
};
CronDate.prototype.recurse = function(pattern, options, doing) {
    const res = this.findNext(options, RecursionSteps[doing][0], pattern, RecursionSteps[doing][2]);
    if (res > 1) {
        let resetLevel = doing + 1;
        while(resetLevel < RecursionSteps.length){
            this[RecursionSteps[resetLevel][0]] = -RecursionSteps[resetLevel][2];
            resetLevel++;
        }
        if (res === 3) {
            this[RecursionSteps[doing][1]]++;
            this[RecursionSteps[doing][0]] = -RecursionSteps[doing][2];
            this.apply();
            return this.recurse(pattern, options, 0);
        } else if (this.apply()) {
            return this.recurse(pattern, options, doing - 1);
        }
    }
    doing += 1;
    if (doing >= RecursionSteps.length) {
        return this;
    } else if (this.year >= 3000) {
        return null;
    } else {
        return this.recurse(pattern, options, doing);
    }
};
CronDate.prototype.increment = function(pattern, options, hasPreviousRun) {
    this.second += options.interval > 1 && hasPreviousRun ? options.interval : 1;
    this.ms = 0;
    this.apply();
    return this.recurse(pattern, options, 0);
};
CronDate.prototype.getDate = function(internal) {
    if (internal || this.tz === void 0) {
        return new Date(this.year, this.month, this.day, this.hour, this.minute, this.second, this.ms);
    } else {
        if (typeof this.tz === "number") {
            return new Date(Date.UTC(this.year, this.month, this.day, this.hour, this.minute - this.tz, this.second, this.ms));
        } else {
            return minitz(this.year, this.month + 1, this.day, this.hour, this.minute, this.second, this.tz);
        }
    }
};
CronDate.prototype.getTime = function() {
    return this.getDate().getTime();
};
function CronPattern(pattern, timezone) {
    this.pattern = pattern;
    this.timezone = timezone;
    this.second = Array(60).fill(0);
    this.minute = Array(60).fill(0);
    this.hour = Array(24).fill(0);
    this.day = Array(31).fill(0);
    this.month = Array(12).fill(0);
    this.dayOfWeek = Array(8).fill(0);
    this.lastDayOfMonth = false;
    this.lastWeekdayOfMonth = false;
    this.starDOM = false;
    this.starDOW = false;
    this.parse();
}
CronPattern.prototype.parse = function() {
    if (!(typeof this.pattern === "string" || this.pattern.constructor === String)) {
        throw new TypeError("CronPattern: Pattern has to be of type string.");
    }
    if (this.pattern.indexOf("@") >= 0) this.pattern = this.handleNicknames(this.pattern).trim();
    const parts = this.pattern.replace(/\s+/g, " ").split(" ");
    if (parts.length < 5 || parts.length > 6) {
        throw new TypeError("CronPattern: invalid configuration format ('" + this.pattern + "'), exacly five or six space separated parts required.");
    }
    if (parts.length === 5) {
        parts.unshift("0");
    }
    if (parts[3].indexOf("L") >= 0) {
        parts[3] = parts[3].replace("L", "");
        this.lastDayOfMonth = true;
    }
    if (parts[5].indexOf("L") >= 0) {
        parts[5] = parts[5].replace("L", "");
        this.lastWeekdayOfMonth = true;
    }
    if (parts[3] == "*") {
        this.starDOM = true;
    }
    if (parts[4].length >= 3) parts[4] = this.replaceAlphaMonths(parts[4]);
    if (parts[5].length >= 3) parts[5] = this.replaceAlphaDays(parts[5]);
    if (parts[5] == "*") {
        this.starDOW = true;
    }
    if (this.pattern.indexOf("?") >= 0) {
        const initDate = new CronDate(new Date(), this.timezone).getDate(true);
        parts[0] = parts[0].replace("?", initDate.getSeconds());
        parts[1] = parts[1].replace("?", initDate.getMinutes());
        parts[2] = parts[2].replace("?", initDate.getHours());
        if (!this.starDOM) parts[3] = parts[3].replace("?", initDate.getDate());
        parts[4] = parts[4].replace("?", initDate.getMonth() + 1);
        if (!this.starDOW) parts[5] = parts[5].replace("?", initDate.getDay());
    }
    this.throwAtIllegalCharacters(parts);
    this.partToArray("second", parts[0], 0);
    this.partToArray("minute", parts[1], 0);
    this.partToArray("hour", parts[2], 0);
    this.partToArray("day", parts[3], -1);
    this.partToArray("month", parts[4], -1);
    this.partToArray("dayOfWeek", parts[5], 0);
    if (this.dayOfWeek[7]) {
        this.dayOfWeek[0] = 1;
    }
};
CronPattern.prototype.partToArray = function(type, conf, valueIndexOffset) {
    const arr = this[type];
    if (conf === "*") return arr.fill(1);
    const split = conf.split(",");
    if (split.length > 1) {
        for(let i = 0; i < split.length; i++){
            this.partToArray(type, split[i], valueIndexOffset);
        }
    } else if (conf.indexOf("-") !== -1 && conf.indexOf("/") !== -1) {
        this.handleRangeWithStepping(conf, type, valueIndexOffset);
    } else if (conf.indexOf("-") !== -1) {
        this.handleRange(conf, type, valueIndexOffset);
    } else if (conf.indexOf("/") !== -1) {
        this.handleStepping(conf, type, valueIndexOffset);
    } else if (conf !== "") {
        this.handleNumber(conf, type, valueIndexOffset);
    }
};
CronPattern.prototype.throwAtIllegalCharacters = function(parts) {
    const reValidCron = /[^/*0-9,-]+/;
    for(let i = 0; i < parts.length; i++){
        if (reValidCron.test(parts[i])) {
            throw new TypeError("CronPattern: configuration entry " + i + " (" + parts[i] + ") contains illegal characters.");
        }
    }
};
CronPattern.prototype.handleNumber = function(conf, type, valueIndexOffset) {
    const i = parseInt(conf, 10) + valueIndexOffset;
    if (isNaN(i)) {
        throw new TypeError("CronPattern: " + type + " is not a number: '" + conf + "'");
    }
    if (i < 0 || i >= this[type].length) {
        throw new TypeError("CronPattern: " + type + " value out of range: '" + conf + "'");
    }
    this[type][i] = 1;
};
CronPattern.prototype.handleRangeWithStepping = function(conf, type, valueIndexOffset) {
    const matches = conf.match(/^(\d+)-(\d+)\/(\d+)$/);
    if (matches === null) throw new TypeError("CronPattern: Syntax error, illegal range with stepping: '" + conf + "'");
    let [, lower, upper, steps] = matches;
    lower = parseInt(lower, 10) + valueIndexOffset;
    upper = parseInt(upper, 10) + valueIndexOffset;
    steps = parseInt(steps, 10);
    if (isNaN(lower)) throw new TypeError("CronPattern: Syntax error, illegal lower range (NaN)");
    if (isNaN(upper)) throw new TypeError("CronPattern: Syntax error, illegal upper range (NaN)");
    if (isNaN(steps)) throw new TypeError("CronPattern: Syntax error, illegal stepping: (NaN)");
    if (steps === 0) throw new TypeError("CronPattern: Syntax error, illegal stepping: 0");
    if (steps > this[type].length) throw new TypeError("CronPattern: Syntax error, steps cannot be greater than maximum value of part (" + this[type].length + ")");
    if (lower < 0 || upper >= this[type].length) throw new TypeError("CronPattern: Value out of range: '" + conf + "'");
    if (lower > upper) throw new TypeError("CronPattern: From value is larger than to value: '" + conf + "'");
    for(let i = lower; i <= upper; i += steps){
        this[type][i] = 1;
    }
};
CronPattern.prototype.handleRange = function(conf, type, valueIndexOffset) {
    const split = conf.split("-");
    if (split.length !== 2) {
        throw new TypeError("CronPattern: Syntax error, illegal range: '" + conf + "'");
    }
    const lower = parseInt(split[0], 10) + valueIndexOffset, upper = parseInt(split[1], 10) + valueIndexOffset;
    if (isNaN(lower)) {
        throw new TypeError("CronPattern: Syntax error, illegal lower range (NaN)");
    } else if (isNaN(upper)) {
        throw new TypeError("CronPattern: Syntax error, illegal upper range (NaN)");
    }
    if (lower < 0 || upper >= this[type].length) {
        throw new TypeError("CronPattern: Value out of range: '" + conf + "'");
    }
    if (lower > upper) {
        throw new TypeError("CronPattern: From value is larger than to value: '" + conf + "'");
    }
    for(let i = lower; i <= upper; i++){
        this[type][i] = 1;
    }
};
CronPattern.prototype.handleStepping = function(conf, type) {
    const split = conf.split("/");
    if (split.length !== 2) {
        throw new TypeError("CronPattern: Syntax error, illegal stepping: '" + conf + "'");
    }
    let start = 0;
    if (split[0] !== "*") {
        start = parseInt(split[0], 10);
    }
    const steps = parseInt(split[1], 10);
    if (isNaN(steps)) throw new TypeError("CronPattern: Syntax error, illegal stepping: (NaN)");
    if (steps === 0) throw new TypeError("CronPattern: Syntax error, illegal stepping: 0");
    if (steps > this[type].length) throw new TypeError("CronPattern: Syntax error, max steps for part is (" + this[type].length + ")");
    for(let i = start; i < this[type].length; i += steps){
        this[type][i] = 1;
    }
};
CronPattern.prototype.replaceAlphaDays = function(conf) {
    return conf.replace(/-sun/gi, "-7").replace(/sun/gi, "0").replace(/mon/gi, "1").replace(/tue/gi, "2").replace(/wed/gi, "3").replace(/thu/gi, "4").replace(/fri/gi, "5").replace(/sat/gi, "6");
};
CronPattern.prototype.replaceAlphaMonths = function(conf) {
    return conf.replace(/jan/gi, "1").replace(/feb/gi, "2").replace(/mar/gi, "3").replace(/apr/gi, "4").replace(/may/gi, "5").replace(/jun/gi, "6").replace(/jul/gi, "7").replace(/aug/gi, "8").replace(/sep/gi, "9").replace(/oct/gi, "10").replace(/nov/gi, "11").replace(/dec/gi, "12");
};
CronPattern.prototype.handleNicknames = function(pattern) {
    const cleanPattern = pattern.trim().toLowerCase();
    if (cleanPattern === "@yearly" || cleanPattern === "@annually") {
        return "0 0 1 1 *";
    } else if (cleanPattern === "@monthly") {
        return "0 0 1 * *";
    } else if (cleanPattern === "@weekly") {
        return "0 0 * * 0";
    } else if (cleanPattern === "@daily") {
        return "0 0 * * *";
    } else if (cleanPattern === "@hourly") {
        return "0 * * * *";
    } else {
        return pattern;
    }
};
function isFunction(v) {
    return Object.prototype.toString.call(v) === "[object Function]" || "function" === typeof v || v instanceof Function;
}
function unrefTimer(timer) {
    if (typeof Deno !== "undefined" && typeof Deno.unrefTimer !== "undefined") {
        Deno.unrefTimer(timer);
    } else if (timer && typeof timer.unref !== "undefined") {
        timer.unref();
    }
}
const maxDelay = 30 * 1000;
const scheduledJobs = [];
function Cron(pattern, fnOrOptions1, fnOrOptions2) {
    if (!(this instanceof Cron)) {
        return new Cron(pattern, fnOrOptions1, fnOrOptions2);
    }
    let options, func;
    if (isFunction(fnOrOptions1)) {
        func = fnOrOptions1;
    } else if (typeof fnOrOptions1 === "object") {
        options = fnOrOptions1;
    } else if (fnOrOptions1 !== void 0) {
        throw new Error("Cron: Invalid argument passed for optionsIn. Should be one of function, or object (options).");
    }
    if (isFunction(fnOrOptions2)) {
        func = fnOrOptions2;
    } else if (typeof fnOrOptions2 === "object") {
        options = fnOrOptions2;
    } else if (fnOrOptions2 !== void 0) {
        throw new Error("Cron: Invalid argument passed for funcIn. Should be one of function, or object (options).");
    }
    this.name = options ? options.name : void 0;
    this.options = CronOptions(options);
    this._states = {
        kill: false,
        blocking: false,
        previousRun: void 0,
        currentRun: void 0,
        once: void 0,
        currentTimeout: void 0,
        maxRuns: options ? options.maxRuns : void 0,
        paused: options ? options.paused : false,
        pattern: void 0
    };
    if (pattern && (pattern instanceof Date || typeof pattern === "string" && pattern.indexOf(":") > 0)) {
        this._states.once = new CronDate(pattern, this.options.timezone || this.options.utcOffset);
    } else {
        this._states.pattern = new CronPattern(pattern, this.options.timezone);
    }
    if (this.name) {
        const existing = scheduledJobs.find((j)=>j.name === this.name);
        if (existing) {
            throw new Error("Cron: Tried to initialize new named job '" + this.name + "', but name already taken.");
        } else {
            scheduledJobs.push(this);
        }
    }
    if (func !== void 0) {
        this.fn = func;
        this.schedule();
    }
    return this;
}
Cron.prototype.nextRun = function(prev) {
    const next = this._next(prev);
    return next ? next.getDate() : null;
};
Cron.prototype.nextRuns = function(n, previous) {
    if (n > this._states.maxRuns) {
        n = this._states.maxRuns;
    }
    const enumeration = [];
    let prev = previous || this._states.currentRun;
    while(n-- && (prev = this.nextRun(prev))){
        enumeration.push(prev);
    }
    return enumeration;
};
Cron.prototype.getPattern = function() {
    return this._states.pattern ? this._states.pattern.pattern : void 0;
};
Cron.prototype.isRunning = function() {
    const msLeft = this.msToNext(this._states.currentRun);
    const isRunning = !this._states.paused;
    const isScheduled = this.fn !== void 0;
    const notIsKilled = !this._states.kill;
    return isRunning && isScheduled && notIsKilled && msLeft !== null;
};
Cron.prototype.isStopped = function() {
    return this._states.kill;
};
Cron.prototype.isBusy = function() {
    return this._states.blocking;
};
Cron.prototype.currentRun = function() {
    return this._states.currentRun ? this._states.currentRun.getDate() : null;
};
Cron.prototype.previousRun = function() {
    return this._states.previousRun ? this._states.previousRun.getDate() : null;
};
Cron.prototype.msToNext = function(prev) {
    const next = this._next(prev);
    prev = new CronDate(prev, this.options.timezone || this.options.utcOffset);
    if (next) {
        return next.getTime(true) - prev.getTime(true);
    } else {
        return null;
    }
};
Cron.prototype.stop = function() {
    this._states.kill = true;
    if (this._states.currentTimeout) {
        clearTimeout(this._states.currentTimeout);
    }
    const jobIndex = scheduledJobs.indexOf(this);
    if (jobIndex >= 0) {
        scheduledJobs.splice(jobIndex, 1);
    }
};
Cron.prototype.pause = function() {
    this._states.paused = true;
    return !this._states.kill;
};
Cron.prototype.resume = function() {
    this._states.paused = false;
    return !this._states.kill;
};
Cron.prototype.schedule = function(func, partial) {
    if (func && this.fn) {
        throw new Error("Cron: It is not allowed to schedule two functions using the same Croner instance.");
    } else if (func) {
        this.fn = func;
    }
    let waitMs = this.msToNext(partial ? partial : this._states.currentRun);
    const target = this.nextRun(partial ? partial : this._states.currentRun);
    if (waitMs === null || target === null) return this;
    if (waitMs > maxDelay) {
        waitMs = maxDelay;
    }
    this._states.currentTimeout = setTimeout(()=>this._checkTrigger(target), waitMs);
    if (this._states.currentTimeout && this.options.unref) {
        unrefTimer(this._states.currentTimeout);
    }
    return this;
};
Cron.prototype._trigger = async function(initiationDate) {
    this._states.blocking = true;
    this._states.currentRun = new CronDate(void 0, this.options.timezone || this.options.utcOffset);
    if (this.options.catch) {
        try {
            await this.fn(this, this.options.context);
        } catch (_e) {
            if (isFunction(this.options.catch)) {
                this.options.catch(_e, this);
            }
        }
    } else {
        await this.fn(this, this.options.context);
    }
    this._states.previousRun = new CronDate(initiationDate, this.options.timezone || this.options.utcOffset);
    this._states.blocking = false;
};
Cron.prototype.trigger = async function() {
    await this._trigger();
};
Cron.prototype._checkTrigger = function(target) {
    const now = new Date(), shouldRun = !this._states.paused && now.getTime() >= target, isBlocked = this._states.blocking && this.options.protect;
    if (shouldRun && !isBlocked) {
        this._states.maxRuns--;
        this._trigger();
    } else {
        if (shouldRun && isBlocked && isFunction(this.options.protect)) {
            setTimeout(()=>this.options.protect(this), 0);
        }
    }
    this.schedule(undefined, now);
};
Cron.prototype._next = function(prev) {
    const hasPreviousRun = prev || this._states.currentRun ? true : false;
    prev = new CronDate(prev, this.options.timezone || this.options.utcOffset);
    if (this.options.startAt && prev && prev.getTime() < this.options.startAt.getTime()) {
        prev = this.options.startAt;
    }
    const nextRun = this._states.once || new CronDate(prev, this.options.timezone || this.options.utcOffset).increment(this._states.pattern, this.options, hasPreviousRun);
    if (this._states.once && this._states.once.getTime() <= prev.getTime()) {
        return null;
    } else if (nextRun === null || this._states.maxRuns <= 0 || this._states.kill || this.options.stopAt && nextRun.getTime() >= this.options.stopAt.getTime()) {
        return null;
    } else {
        return nextRun;
    }
};
Cron.Cron = Cron;
Cron.scheduledJobs = scheduledJobs;
var util;
(function(util) {
    util.assertEqual = (val)=>val;
    function assertIs(_arg) {}
    util.assertIs = assertIs;
    function assertNever(_x) {
        throw new Error();
    }
    util.assertNever = assertNever;
    util.arrayToEnum = (items)=>{
        const obj = {};
        for (const item of items){
            obj[item] = item;
        }
        return obj;
    };
    util.getValidEnumValues = (obj)=>{
        const validKeys = objectKeys(obj).filter((k)=>typeof obj[obj[k]] !== "number");
        const filtered = {};
        for (const k of validKeys){
            filtered[k] = obj[k];
        }
        return objectValues(filtered);
    };
    var objectValues = util.objectValues = (obj)=>{
        return objectKeys(obj).map(function(e) {
            return obj[e];
        });
    };
    var objectKeys = util.objectKeys = typeof Object.keys === "function" ? (obj)=>Object.keys(obj) : (object)=>{
        const keys = [];
        for(const key in object){
            if (Object.prototype.hasOwnProperty.call(object, key)) {
                keys.push(key);
            }
        }
        return keys;
    };
    util.find = (arr, checker)=>{
        for (const item of arr){
            if (checker(item)) return item;
        }
        return undefined;
    };
    util.isInteger = typeof Number.isInteger === "function" ? (val)=>Number.isInteger(val) : (val)=>typeof val === "number" && isFinite(val) && Math.floor(val) === val;
    function joinValues(array, separator = " | ") {
        return array.map((val)=>typeof val === "string" ? `'${val}'` : val).join(separator);
    }
    util.joinValues = joinValues;
    util.jsonStringifyReplacer = (_, value1)=>{
        if (typeof value1 === "bigint") {
            return value1.toString();
        }
        return value1;
    };
})(util || (util = {}));
var objectUtil;
(function(objectUtil) {
    objectUtil.mergeShapes = (first, second)=>{
        return {
            ...first,
            ...second
        };
    };
})(objectUtil || (objectUtil = {}));
const ZodParsedType = util.arrayToEnum([
    "string",
    "nan",
    "number",
    "integer",
    "float",
    "boolean",
    "date",
    "bigint",
    "symbol",
    "function",
    "undefined",
    "null",
    "array",
    "object",
    "unknown",
    "promise",
    "void",
    "never",
    "map",
    "set"
]);
const getParsedType = (data)=>{
    const t = typeof data;
    switch(t){
        case "undefined":
            return ZodParsedType.undefined;
        case "string":
            return ZodParsedType.string;
        case "number":
            return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
        case "boolean":
            return ZodParsedType.boolean;
        case "function":
            return ZodParsedType.function;
        case "bigint":
            return ZodParsedType.bigint;
        case "symbol":
            return ZodParsedType.symbol;
        case "object":
            if (Array.isArray(data)) {
                return ZodParsedType.array;
            }
            if (data === null) {
                return ZodParsedType.null;
            }
            if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
                return ZodParsedType.promise;
            }
            if (typeof Map !== "undefined" && data instanceof Map) {
                return ZodParsedType.map;
            }
            if (typeof Set !== "undefined" && data instanceof Set) {
                return ZodParsedType.set;
            }
            if (typeof Date !== "undefined" && data instanceof Date) {
                return ZodParsedType.date;
            }
            return ZodParsedType.object;
        default:
            return ZodParsedType.unknown;
    }
};
const ZodIssueCode = util.arrayToEnum([
    "invalid_type",
    "invalid_literal",
    "custom",
    "invalid_union",
    "invalid_union_discriminator",
    "invalid_enum_value",
    "unrecognized_keys",
    "invalid_arguments",
    "invalid_return_type",
    "invalid_date",
    "invalid_string",
    "too_small",
    "too_big",
    "invalid_intersection_types",
    "not_multiple_of",
    "not_finite"
]);
class ZodError extends Error {
    issues = [];
    get errors() {
        return this.issues;
    }
    constructor(issues){
        super();
        const actualProto = new.target.prototype;
        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(this, actualProto);
        } else {
            this.__proto__ = actualProto;
        }
        this.name = "ZodError";
        this.issues = issues;
    }
    format(_mapper) {
        const mapper = _mapper || function(issue) {
            return issue.message;
        };
        const fieldErrors = {
            _errors: []
        };
        const processError = (error)=>{
            for (const issue of error.issues){
                if (issue.code === "invalid_union") {
                    issue.unionErrors.map(processError);
                } else if (issue.code === "invalid_return_type") {
                    processError(issue.returnTypeError);
                } else if (issue.code === "invalid_arguments") {
                    processError(issue.argumentsError);
                } else if (issue.path.length === 0) {
                    fieldErrors._errors.push(mapper(issue));
                } else {
                    let curr = fieldErrors;
                    let i = 0;
                    while(i < issue.path.length){
                        const el = issue.path[i];
                        const terminal = i === issue.path.length - 1;
                        if (!terminal) {
                            curr[el] = curr[el] || {
                                _errors: []
                            };
                        } else {
                            curr[el] = curr[el] || {
                                _errors: []
                            };
                            curr[el]._errors.push(mapper(issue));
                        }
                        curr = curr[el];
                        i++;
                    }
                }
            }
        };
        processError(this);
        return fieldErrors;
    }
    static create = (issues)=>{
        const error = new ZodError(issues);
        return error;
    };
    toString() {
        return this.message;
    }
    get message() {
        return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
    }
    get isEmpty() {
        return this.issues.length === 0;
    }
    addIssue = (sub)=>{
        this.issues = [
            ...this.issues,
            sub
        ];
    };
    addIssues = (subs = [])=>{
        this.issues = [
            ...this.issues,
            ...subs
        ];
    };
    flatten(mapper = (issue)=>issue.message) {
        const fieldErrors = {};
        const formErrors = [];
        for (const sub of this.issues){
            if (sub.path.length > 0) {
                fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
                fieldErrors[sub.path[0]].push(mapper(sub));
            } else {
                formErrors.push(mapper(sub));
            }
        }
        return {
            formErrors,
            fieldErrors
        };
    }
    get formErrors() {
        return this.flatten();
    }
}
const errorMap = (issue, _ctx)=>{
    let message;
    switch(issue.code){
        case ZodIssueCode.invalid_type:
            if (issue.received === ZodParsedType.undefined) {
                message = "Required";
            } else {
                message = `Expected ${issue.expected}, received ${issue.received}`;
            }
            break;
        case ZodIssueCode.invalid_literal:
            message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
            break;
        case ZodIssueCode.unrecognized_keys:
            message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
            break;
        case ZodIssueCode.invalid_union:
            message = `Invalid input`;
            break;
        case ZodIssueCode.invalid_union_discriminator:
            message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
            break;
        case ZodIssueCode.invalid_enum_value:
            message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
            break;
        case ZodIssueCode.invalid_arguments:
            message = `Invalid function arguments`;
            break;
        case ZodIssueCode.invalid_return_type:
            message = `Invalid function return type`;
            break;
        case ZodIssueCode.invalid_date:
            message = `Invalid date`;
            break;
        case ZodIssueCode.invalid_string:
            if (typeof issue.validation === "object") {
                if ("includes" in issue.validation) {
                    message = `Invalid input: must include "${issue.validation.includes}"`;
                    if (typeof issue.validation.position === "number") {
                        message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
                    }
                } else if ("startsWith" in issue.validation) {
                    message = `Invalid input: must start with "${issue.validation.startsWith}"`;
                } else if ("endsWith" in issue.validation) {
                    message = `Invalid input: must end with "${issue.validation.endsWith}"`;
                } else {
                    util.assertNever(issue.validation);
                }
            } else if (issue.validation !== "regex") {
                message = `Invalid ${issue.validation}`;
            } else {
                message = "Invalid";
            }
            break;
        case ZodIssueCode.too_small:
            if (issue.type === "array") message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
            else if (issue.type === "string") message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
            else if (issue.type === "number") message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
            else if (issue.type === "date") message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
            else message = "Invalid input";
            break;
        case ZodIssueCode.too_big:
            if (issue.type === "array") message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
            else if (issue.type === "string") message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
            else if (issue.type === "number") message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
            else if (issue.type === "bigint") message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
            else if (issue.type === "date") message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
            else message = "Invalid input";
            break;
        case ZodIssueCode.custom:
            message = `Invalid input`;
            break;
        case ZodIssueCode.invalid_intersection_types:
            message = `Intersection results could not be merged`;
            break;
        case ZodIssueCode.not_multiple_of:
            message = `Number must be a multiple of ${issue.multipleOf}`;
            break;
        case ZodIssueCode.not_finite:
            message = "Number must be finite";
            break;
        default:
            message = _ctx.defaultError;
            util.assertNever(issue);
    }
    return {
        message
    };
};
let overrideErrorMap = errorMap;
function getErrorMap() {
    return overrideErrorMap;
}
const makeIssue = (params)=>{
    const { data, path, errorMaps, issueData } = params;
    const fullPath = [
        ...path,
        ...issueData.path || []
    ];
    const fullIssue = {
        ...issueData,
        path: fullPath
    };
    let errorMessage = "";
    const maps = errorMaps.filter((m)=>!!m).slice().reverse();
    for (const map of maps){
        errorMessage = map(fullIssue, {
            data,
            defaultError: errorMessage
        }).message;
    }
    return {
        ...issueData,
        path: fullPath,
        message: issueData.message || errorMessage
    };
};
function addIssueToContext(ctx, issueData) {
    const issue = makeIssue({
        issueData: issueData,
        data: ctx.data,
        path: ctx.path,
        errorMaps: [
            ctx.common.contextualErrorMap,
            ctx.schemaErrorMap,
            getErrorMap(),
            errorMap
        ].filter((x)=>!!x)
    });
    ctx.common.issues.push(issue);
}
class ParseStatus {
    value = "valid";
    dirty() {
        if (this.value === "valid") this.value = "dirty";
    }
    abort() {
        if (this.value !== "aborted") this.value = "aborted";
    }
    static mergeArray(status, results) {
        const arrayValue = [];
        for (const s of results){
            if (s.status === "aborted") return INVALID;
            if (s.status === "dirty") status.dirty();
            arrayValue.push(s.value);
        }
        return {
            status: status.value,
            value: arrayValue
        };
    }
    static async mergeObjectAsync(status, pairs) {
        const syncPairs = [];
        for (const pair of pairs){
            syncPairs.push({
                key: await pair.key,
                value: await pair.value
            });
        }
        return ParseStatus.mergeObjectSync(status, syncPairs);
    }
    static mergeObjectSync(status, pairs) {
        const finalObject = {};
        for (const pair of pairs){
            const { key, value: value1 } = pair;
            if (key.status === "aborted") return INVALID;
            if (value1.status === "aborted") return INVALID;
            if (key.status === "dirty") status.dirty();
            if (value1.status === "dirty") status.dirty();
            if (typeof value1.value !== "undefined" || pair.alwaysSet) {
                finalObject[key.value] = value1.value;
            }
        }
        return {
            status: status.value,
            value: finalObject
        };
    }
}
const INVALID = Object.freeze({
    status: "aborted"
});
const DIRTY = (value1)=>({
        status: "dirty",
        value: value1
    });
const OK = (value1)=>({
        status: "valid",
        value: value1
    });
const isAborted = (x)=>x.status === "aborted";
const isDirty = (x)=>x.status === "dirty";
const isValid = (x)=>x.status === "valid";
const isAsync = (x)=>typeof Promise !== "undefined" && x instanceof Promise;
var errorUtil;
(function(errorUtil) {
    errorUtil.errToObj = (message)=>typeof message === "string" ? {
            message
        } : message || {};
    errorUtil.toString = (message)=>typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));
class ParseInputLazyPath {
    parent;
    data;
    _path;
    _key;
    _cachedPath = [];
    constructor(parent, value1, path, key){
        this.parent = parent;
        this.data = value1;
        this._path = path;
        this._key = key;
    }
    get path() {
        if (!this._cachedPath.length) {
            if (this._key instanceof Array) {
                this._cachedPath.push(...this._path, ...this._key);
            } else {
                this._cachedPath.push(...this._path, this._key);
            }
        }
        return this._cachedPath;
    }
}
const handleResult = (ctx, result)=>{
    if (isValid(result)) {
        return {
            success: true,
            data: result.value
        };
    } else {
        if (!ctx.common.issues.length) {
            throw new Error("Validation failed but no issues detected.");
        }
        return {
            success: false,
            get error () {
                if (this._error) return this._error;
                const error = new ZodError(ctx.common.issues);
                this._error = error;
                return this._error;
            }
        };
    }
};
function processCreateParams(params) {
    if (!params) return {};
    const { errorMap, invalid_type_error, required_error, description } = params;
    if (errorMap && (invalid_type_error || required_error)) {
        throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
    }
    if (errorMap) return {
        errorMap: errorMap,
        description
    };
    const customMap = (iss, ctx)=>{
        if (iss.code !== "invalid_type") return {
            message: ctx.defaultError
        };
        if (typeof ctx.data === "undefined") {
            return {
                message: required_error ?? ctx.defaultError
            };
        }
        return {
            message: invalid_type_error ?? ctx.defaultError
        };
    };
    return {
        errorMap: customMap,
        description
    };
}
class ZodType {
    _type;
    _output;
    _input;
    _def;
    get description() {
        return this._def.description;
    }
    _getType(input) {
        return getParsedType(input.data);
    }
    _getOrReturnCtx(input, ctx) {
        return ctx || {
            common: input.parent.common,
            data: input.data,
            parsedType: getParsedType(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent
        };
    }
    _processInputParams(input) {
        return {
            status: new ParseStatus(),
            ctx: {
                common: input.parent.common,
                data: input.data,
                parsedType: getParsedType(input.data),
                schemaErrorMap: this._def.errorMap,
                path: input.path,
                parent: input.parent
            }
        };
    }
    _parseSync(input) {
        const result = this._parse(input);
        if (isAsync(result)) {
            throw new Error("Synchronous parse encountered promise.");
        }
        return result;
    }
    _parseAsync(input) {
        const result = this._parse(input);
        return Promise.resolve(result);
    }
    parse(data, params) {
        const result = this.safeParse(data, params);
        if (result.success) return result.data;
        throw result.error;
    }
    safeParse(data, params) {
        const ctx = {
            common: {
                issues: [],
                async: params?.async ?? false,
                contextualErrorMap: params?.errorMap
            },
            path: params?.path || [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data)
        };
        const result = this._parseSync({
            data,
            path: ctx.path,
            parent: ctx
        });
        return handleResult(ctx, result);
    }
    async parseAsync(data, params) {
        const result = await this.safeParseAsync(data, params);
        if (result.success) return result.data;
        throw result.error;
    }
    async safeParseAsync(data, params) {
        const ctx = {
            common: {
                issues: [],
                contextualErrorMap: params?.errorMap,
                async: true
            },
            path: params?.path || [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data)
        };
        const maybeAsyncResult = this._parse({
            data,
            path: ctx.path,
            parent: ctx
        });
        const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
        return handleResult(ctx, result);
    }
    spa = this.safeParseAsync;
    refine(check, message) {
        const getIssueProperties = (val)=>{
            if (typeof message === "string" || typeof message === "undefined") {
                return {
                    message
                };
            } else if (typeof message === "function") {
                return message(val);
            } else {
                return message;
            }
        };
        return this._refinement((val, ctx)=>{
            const result = check(val);
            const setError = ()=>ctx.addIssue({
                    code: ZodIssueCode.custom,
                    ...getIssueProperties(val)
                });
            if (typeof Promise !== "undefined" && result instanceof Promise) {
                return result.then((data)=>{
                    if (!data) {
                        setError();
                        return false;
                    } else {
                        return true;
                    }
                });
            }
            if (!result) {
                setError();
                return false;
            } else {
                return true;
            }
        });
    }
    refinement(check, refinementData) {
        return this._refinement((val, ctx)=>{
            if (!check(val)) {
                ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
                return false;
            } else {
                return true;
            }
        });
    }
    _refinement(refinement) {
        return new ZodEffects({
            schema: this,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect: {
                type: "refinement",
                refinement
            }
        });
    }
    superRefine(refinement) {
        return this._refinement(refinement);
    }
    constructor(def){
        this._def = def;
        this.parse = this.parse.bind(this);
        this.safeParse = this.safeParse.bind(this);
        this.parseAsync = this.parseAsync.bind(this);
        this.safeParseAsync = this.safeParseAsync.bind(this);
        this.spa = this.spa.bind(this);
        this.refine = this.refine.bind(this);
        this.refinement = this.refinement.bind(this);
        this.superRefine = this.superRefine.bind(this);
        this.optional = this.optional.bind(this);
        this.nullable = this.nullable.bind(this);
        this.nullish = this.nullish.bind(this);
        this.array = this.array.bind(this);
        this.promise = this.promise.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.transform = this.transform.bind(this);
        this.brand = this.brand.bind(this);
        this.default = this.default.bind(this);
        this.catch = this.catch.bind(this);
        this.describe = this.describe.bind(this);
        this.pipe = this.pipe.bind(this);
        this.isNullable = this.isNullable.bind(this);
        this.isOptional = this.isOptional.bind(this);
    }
    optional() {
        return ZodOptional.create(this, this._def);
    }
    nullable() {
        return ZodNullable.create(this, this._def);
    }
    nullish() {
        return this.nullable().optional();
    }
    array() {
        return ZodArray.create(this, this._def);
    }
    promise() {
        return ZodPromise.create(this, this._def);
    }
    or(option) {
        return ZodUnion.create([
            this,
            option
        ], this._def);
    }
    and(incoming) {
        return ZodIntersection.create(this, incoming, this._def);
    }
    transform(transform) {
        return new ZodEffects({
            ...processCreateParams(this._def),
            schema: this,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect: {
                type: "transform",
                transform
            }
        });
    }
    default(def) {
        const defaultValueFunc = typeof def === "function" ? def : ()=>def;
        return new ZodDefault({
            ...processCreateParams(this._def),
            innerType: this,
            defaultValue: defaultValueFunc,
            typeName: ZodFirstPartyTypeKind.ZodDefault
        });
    }
    brand() {
        return new ZodBranded({
            typeName: ZodFirstPartyTypeKind.ZodBranded,
            type: this,
            ...processCreateParams(this._def)
        });
    }
    catch(def) {
        const catchValueFunc = typeof def === "function" ? def : ()=>def;
        return new ZodCatch({
            ...processCreateParams(this._def),
            innerType: this,
            catchValue: catchValueFunc,
            typeName: ZodFirstPartyTypeKind.ZodCatch
        });
    }
    describe(description) {
        const This = this.constructor;
        return new This({
            ...this._def,
            description
        });
    }
    pipe(target) {
        return ZodPipeline.create(this, target);
    }
    isOptional() {
        return this.safeParse(undefined).success;
    }
    isNullable() {
        return this.safeParse(null).success;
    }
}
const cuidRegex = /^c[^\s-]{8,}$/i;
const cuid2Regex = /^[a-z][a-z0-9]*$/;
const ulidRegex = /[0-9A-HJKMNP-TV-Z]{26}/;
const uuidRegex = /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i;
const emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\])|(\[IPv6:(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))\])|([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])*(\.[A-Za-z]{2,})+))$/;
const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Component})+$/u;
const ipv4Regex = /^(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))$/;
const ipv6Regex = /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/;
const datetimeRegex = (args)=>{
    if (args.precision) {
        if (args.offset) {
            return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{${args.precision}}(([+-]\\d{2}(:?\\d{2})?)|Z)$`);
        } else {
            return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{${args.precision}}Z$`);
        }
    } else if (args.precision === 0) {
        if (args.offset) {
            return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(([+-]\\d{2}(:?\\d{2})?)|Z)$`);
        } else {
            return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$`);
        }
    } else {
        if (args.offset) {
            return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(([+-]\\d{2}(:?\\d{2})?)|Z)$`);
        } else {
            return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$`);
        }
    }
};
function isValidIP(ip, version) {
    if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
        return true;
    }
    if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
        return true;
    }
    return false;
}
class ZodString extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = String(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.string) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.string,
                received: ctx.parsedType
            });
            return INVALID;
        }
        const status = new ParseStatus();
        let ctx = undefined;
        for (const check of this._def.checks){
            if (check.kind === "min") {
                if (input.data.length < check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "string",
                        inclusive: true,
                        exact: false,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "max") {
                if (input.data.length > check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "string",
                        inclusive: true,
                        exact: false,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "length") {
                const tooBig = input.data.length > check.value;
                const tooSmall = input.data.length < check.value;
                if (tooBig || tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    if (tooBig) {
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.too_big,
                            maximum: check.value,
                            type: "string",
                            inclusive: true,
                            exact: true,
                            message: check.message
                        });
                    } else if (tooSmall) {
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.too_small,
                            minimum: check.value,
                            type: "string",
                            inclusive: true,
                            exact: true,
                            message: check.message
                        });
                    }
                    status.dirty();
                }
            } else if (check.kind === "email") {
                if (!emailRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "email",
                        code: ZodIssueCode.invalid_string,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "emoji") {
                if (!emojiRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "emoji",
                        code: ZodIssueCode.invalid_string,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "uuid") {
                if (!uuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "uuid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "cuid") {
                if (!cuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "cuid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "cuid2") {
                if (!cuid2Regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "cuid2",
                        code: ZodIssueCode.invalid_string,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "ulid") {
                if (!ulidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "ulid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "url") {
                try {
                    new URL(input.data);
                } catch  {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "url",
                        code: ZodIssueCode.invalid_string,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "regex") {
                check.regex.lastIndex = 0;
                const testResult = check.regex.test(input.data);
                if (!testResult) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "regex",
                        code: ZodIssueCode.invalid_string,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "trim") {
                input.data = input.data.trim();
            } else if (check.kind === "includes") {
                if (!input.data.includes(check.value, check.position)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: {
                            includes: check.value,
                            position: check.position
                        },
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "toLowerCase") {
                input.data = input.data.toLowerCase();
            } else if (check.kind === "toUpperCase") {
                input.data = input.data.toUpperCase();
            } else if (check.kind === "startsWith") {
                if (!input.data.startsWith(check.value)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: {
                            startsWith: check.value
                        },
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "endsWith") {
                if (!input.data.endsWith(check.value)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: {
                            endsWith: check.value
                        },
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "datetime") {
                const regex = datetimeRegex(check);
                if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: "datetime",
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "ip") {
                if (!isValidIP(input.data, check.version)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "ip",
                        code: ZodIssueCode.invalid_string,
                        message: check.message
                    });
                    status.dirty();
                }
            } else {
                util.assertNever(check);
            }
        }
        return {
            status: status.value,
            value: input.data
        };
    }
    _regex = (regex, validation, message)=>this.refinement((data)=>regex.test(data), {
            validation,
            code: ZodIssueCode.invalid_string,
            ...errorUtil.errToObj(message)
        });
    _addCheck(check) {
        return new ZodString({
            ...this._def,
            checks: [
                ...this._def.checks,
                check
            ]
        });
    }
    email(message) {
        return this._addCheck({
            kind: "email",
            ...errorUtil.errToObj(message)
        });
    }
    url(message) {
        return this._addCheck({
            kind: "url",
            ...errorUtil.errToObj(message)
        });
    }
    emoji(message) {
        return this._addCheck({
            kind: "emoji",
            ...errorUtil.errToObj(message)
        });
    }
    uuid(message) {
        return this._addCheck({
            kind: "uuid",
            ...errorUtil.errToObj(message)
        });
    }
    cuid(message) {
        return this._addCheck({
            kind: "cuid",
            ...errorUtil.errToObj(message)
        });
    }
    cuid2(message) {
        return this._addCheck({
            kind: "cuid2",
            ...errorUtil.errToObj(message)
        });
    }
    ulid(message) {
        return this._addCheck({
            kind: "ulid",
            ...errorUtil.errToObj(message)
        });
    }
    ip(options) {
        return this._addCheck({
            kind: "ip",
            ...errorUtil.errToObj(options)
        });
    }
    datetime(options) {
        if (typeof options === "string") {
            return this._addCheck({
                kind: "datetime",
                precision: null,
                offset: false,
                message: options
            });
        }
        return this._addCheck({
            kind: "datetime",
            precision: typeof options?.precision === "undefined" ? null : options?.precision,
            offset: options?.offset ?? false,
            ...errorUtil.errToObj(options?.message)
        });
    }
    regex(regex, message) {
        return this._addCheck({
            kind: "regex",
            regex: regex,
            ...errorUtil.errToObj(message)
        });
    }
    includes(value1, options) {
        return this._addCheck({
            kind: "includes",
            value: value1,
            position: options?.position,
            ...errorUtil.errToObj(options?.message)
        });
    }
    startsWith(value1, message) {
        return this._addCheck({
            kind: "startsWith",
            value: value1,
            ...errorUtil.errToObj(message)
        });
    }
    endsWith(value1, message) {
        return this._addCheck({
            kind: "endsWith",
            value: value1,
            ...errorUtil.errToObj(message)
        });
    }
    min(minLength, message) {
        return this._addCheck({
            kind: "min",
            value: minLength,
            ...errorUtil.errToObj(message)
        });
    }
    max(maxLength, message) {
        return this._addCheck({
            kind: "max",
            value: maxLength,
            ...errorUtil.errToObj(message)
        });
    }
    length(len, message) {
        return this._addCheck({
            kind: "length",
            value: len,
            ...errorUtil.errToObj(message)
        });
    }
    nonempty = (message)=>this.min(1, errorUtil.errToObj(message));
    trim = ()=>new ZodString({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind: "trim"
                }
            ]
        });
    toLowerCase = ()=>new ZodString({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind: "toLowerCase"
                }
            ]
        });
    toUpperCase = ()=>new ZodString({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind: "toUpperCase"
                }
            ]
        });
    get isDatetime() {
        return !!this._def.checks.find((ch)=>ch.kind === "datetime");
    }
    get isEmail() {
        return !!this._def.checks.find((ch)=>ch.kind === "email");
    }
    get isURL() {
        return !!this._def.checks.find((ch)=>ch.kind === "url");
    }
    get isEmoji() {
        return !!this._def.checks.find((ch)=>ch.kind === "emoji");
    }
    get isUUID() {
        return !!this._def.checks.find((ch)=>ch.kind === "uuid");
    }
    get isCUID() {
        return !!this._def.checks.find((ch)=>ch.kind === "cuid");
    }
    get isCUID2() {
        return !!this._def.checks.find((ch)=>ch.kind === "cuid2");
    }
    get isULID() {
        return !!this._def.checks.find((ch)=>ch.kind === "ulid");
    }
    get isIP() {
        return !!this._def.checks.find((ch)=>ch.kind === "ip");
    }
    get minLength() {
        let min = null;
        for (const ch of this._def.checks){
            if (ch.kind === "min") {
                if (min === null || ch.value > min) min = ch.value;
            }
        }
        return min;
    }
    get maxLength() {
        let max = null;
        for (const ch of this._def.checks){
            if (ch.kind === "max") {
                if (max === null || ch.value < max) max = ch.value;
            }
        }
        return max;
    }
    static create = (params)=>{
        return new ZodString({
            checks: [],
            typeName: ZodFirstPartyTypeKind.ZodString,
            coerce: params?.coerce ?? false,
            ...processCreateParams(params)
        });
    };
}
function floatSafeRemainder(val, step) {
    const valDecCount = (val.toString().split(".")[1] || "").length;
    const stepDecCount = (step.toString().split(".")[1] || "").length;
    const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
    const valInt = parseInt(val.toFixed(decCount).replace(".", ""));
    const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));
    return valInt % stepInt / Math.pow(10, decCount);
}
class ZodNumber extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = Number(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.number) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.number,
                received: ctx.parsedType
            });
            return INVALID;
        }
        let ctx = undefined;
        const status = new ParseStatus();
        for (const check of this._def.checks){
            if (check.kind === "int") {
                if (!util.isInteger(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_type,
                        expected: "integer",
                        received: "float",
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "min") {
                const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
                if (tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "number",
                        inclusive: check.inclusive,
                        exact: false,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "max") {
                const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
                if (tooBig) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "number",
                        inclusive: check.inclusive,
                        exact: false,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "multipleOf") {
                if (floatSafeRemainder(input.data, check.value) !== 0) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_multiple_of,
                        multipleOf: check.value,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "finite") {
                if (!Number.isFinite(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_finite,
                        message: check.message
                    });
                    status.dirty();
                }
            } else {
                util.assertNever(check);
            }
        }
        return {
            status: status.value,
            value: input.data
        };
    }
    static create = (params)=>{
        return new ZodNumber({
            checks: [],
            typeName: ZodFirstPartyTypeKind.ZodNumber,
            coerce: params?.coerce || false,
            ...processCreateParams(params)
        });
    };
    gte(value1, message) {
        return this.setLimit("min", value1, true, errorUtil.toString(message));
    }
    min = this.gte;
    gt(value1, message) {
        return this.setLimit("min", value1, false, errorUtil.toString(message));
    }
    lte(value1, message) {
        return this.setLimit("max", value1, true, errorUtil.toString(message));
    }
    max = this.lte;
    lt(value1, message) {
        return this.setLimit("max", value1, false, errorUtil.toString(message));
    }
    setLimit(kind, value1, inclusive, message) {
        return new ZodNumber({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind,
                    value: value1,
                    inclusive,
                    message: errorUtil.toString(message)
                }
            ]
        });
    }
    _addCheck(check) {
        return new ZodNumber({
            ...this._def,
            checks: [
                ...this._def.checks,
                check
            ]
        });
    }
    int(message) {
        return this._addCheck({
            kind: "int",
            message: errorUtil.toString(message)
        });
    }
    positive(message) {
        return this._addCheck({
            kind: "min",
            value: 0,
            inclusive: false,
            message: errorUtil.toString(message)
        });
    }
    negative(message) {
        return this._addCheck({
            kind: "max",
            value: 0,
            inclusive: false,
            message: errorUtil.toString(message)
        });
    }
    nonpositive(message) {
        return this._addCheck({
            kind: "max",
            value: 0,
            inclusive: true,
            message: errorUtil.toString(message)
        });
    }
    nonnegative(message) {
        return this._addCheck({
            kind: "min",
            value: 0,
            inclusive: true,
            message: errorUtil.toString(message)
        });
    }
    multipleOf(value1, message) {
        return this._addCheck({
            kind: "multipleOf",
            value: value1,
            message: errorUtil.toString(message)
        });
    }
    step = this.multipleOf;
    finite(message) {
        return this._addCheck({
            kind: "finite",
            message: errorUtil.toString(message)
        });
    }
    safe(message) {
        return this._addCheck({
            kind: "min",
            inclusive: true,
            value: Number.MIN_SAFE_INTEGER,
            message: errorUtil.toString(message)
        })._addCheck({
            kind: "max",
            inclusive: true,
            value: Number.MAX_SAFE_INTEGER,
            message: errorUtil.toString(message)
        });
    }
    get minValue() {
        let min = null;
        for (const ch of this._def.checks){
            if (ch.kind === "min") {
                if (min === null || ch.value > min) min = ch.value;
            }
        }
        return min;
    }
    get maxValue() {
        let max = null;
        for (const ch of this._def.checks){
            if (ch.kind === "max") {
                if (max === null || ch.value < max) max = ch.value;
            }
        }
        return max;
    }
    get isInt() {
        return !!this._def.checks.find((ch)=>ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
    }
    get isFinite() {
        let max = null, min = null;
        for (const ch of this._def.checks){
            if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
                return true;
            } else if (ch.kind === "min") {
                if (min === null || ch.value > min) min = ch.value;
            } else if (ch.kind === "max") {
                if (max === null || ch.value < max) max = ch.value;
            }
        }
        return Number.isFinite(min) && Number.isFinite(max);
    }
}
class ZodBigInt extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = BigInt(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.bigint) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.bigint,
                received: ctx.parsedType
            });
            return INVALID;
        }
        let ctx = undefined;
        const status = new ParseStatus();
        for (const check of this._def.checks){
            if (check.kind === "min") {
                const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
                if (tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        type: "bigint",
                        minimum: check.value,
                        inclusive: check.inclusive,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "max") {
                const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
                if (tooBig) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        type: "bigint",
                        maximum: check.value,
                        inclusive: check.inclusive,
                        message: check.message
                    });
                    status.dirty();
                }
            } else if (check.kind === "multipleOf") {
                if (input.data % check.value !== BigInt(0)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_multiple_of,
                        multipleOf: check.value,
                        message: check.message
                    });
                    status.dirty();
                }
            } else {
                util.assertNever(check);
            }
        }
        return {
            status: status.value,
            value: input.data
        };
    }
    static create = (params)=>{
        return new ZodBigInt({
            checks: [],
            typeName: ZodFirstPartyTypeKind.ZodBigInt,
            coerce: params?.coerce ?? false,
            ...processCreateParams(params)
        });
    };
    gte(value1, message) {
        return this.setLimit("min", value1, true, errorUtil.toString(message));
    }
    min = this.gte;
    gt(value1, message) {
        return this.setLimit("min", value1, false, errorUtil.toString(message));
    }
    lte(value1, message) {
        return this.setLimit("max", value1, true, errorUtil.toString(message));
    }
    max = this.lte;
    lt(value1, message) {
        return this.setLimit("max", value1, false, errorUtil.toString(message));
    }
    setLimit(kind, value1, inclusive, message) {
        return new ZodBigInt({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind,
                    value: value1,
                    inclusive,
                    message: errorUtil.toString(message)
                }
            ]
        });
    }
    _addCheck(check) {
        return new ZodBigInt({
            ...this._def,
            checks: [
                ...this._def.checks,
                check
            ]
        });
    }
    positive(message) {
        return this._addCheck({
            kind: "min",
            value: BigInt(0),
            inclusive: false,
            message: errorUtil.toString(message)
        });
    }
    negative(message) {
        return this._addCheck({
            kind: "max",
            value: BigInt(0),
            inclusive: false,
            message: errorUtil.toString(message)
        });
    }
    nonpositive(message) {
        return this._addCheck({
            kind: "max",
            value: BigInt(0),
            inclusive: true,
            message: errorUtil.toString(message)
        });
    }
    nonnegative(message) {
        return this._addCheck({
            kind: "min",
            value: BigInt(0),
            inclusive: true,
            message: errorUtil.toString(message)
        });
    }
    multipleOf(value1, message) {
        return this._addCheck({
            kind: "multipleOf",
            value: value1,
            message: errorUtil.toString(message)
        });
    }
    get minValue() {
        let min = null;
        for (const ch of this._def.checks){
            if (ch.kind === "min") {
                if (min === null || ch.value > min) min = ch.value;
            }
        }
        return min;
    }
    get maxValue() {
        let max = null;
        for (const ch of this._def.checks){
            if (ch.kind === "max") {
                if (max === null || ch.value < max) max = ch.value;
            }
        }
        return max;
    }
}
class ZodBoolean extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = Boolean(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.boolean) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.boolean,
                received: ctx.parsedType
            });
            return INVALID;
        }
        return OK(input.data);
    }
    static create = (params)=>{
        return new ZodBoolean({
            typeName: ZodFirstPartyTypeKind.ZodBoolean,
            coerce: params?.coerce || false,
            ...processCreateParams(params)
        });
    };
}
class ZodDate extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = new Date(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.date) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.date,
                received: ctx.parsedType
            });
            return INVALID;
        }
        if (isNaN(input.data.getTime())) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_date
            });
            return INVALID;
        }
        const status = new ParseStatus();
        let ctx = undefined;
        for (const check of this._def.checks){
            if (check.kind === "min") {
                if (input.data.getTime() < check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        message: check.message,
                        inclusive: true,
                        exact: false,
                        minimum: check.value,
                        type: "date"
                    });
                    status.dirty();
                }
            } else if (check.kind === "max") {
                if (input.data.getTime() > check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        message: check.message,
                        inclusive: true,
                        exact: false,
                        maximum: check.value,
                        type: "date"
                    });
                    status.dirty();
                }
            } else {
                util.assertNever(check);
            }
        }
        return {
            status: status.value,
            value: new Date(input.data.getTime())
        };
    }
    _addCheck(check) {
        return new ZodDate({
            ...this._def,
            checks: [
                ...this._def.checks,
                check
            ]
        });
    }
    min(minDate, message) {
        return this._addCheck({
            kind: "min",
            value: minDate.getTime(),
            message: errorUtil.toString(message)
        });
    }
    max(maxDate, message) {
        return this._addCheck({
            kind: "max",
            value: maxDate.getTime(),
            message: errorUtil.toString(message)
        });
    }
    get minDate() {
        let min = null;
        for (const ch of this._def.checks){
            if (ch.kind === "min") {
                if (min === null || ch.value > min) min = ch.value;
            }
        }
        return min != null ? new Date(min) : null;
    }
    get maxDate() {
        let max = null;
        for (const ch of this._def.checks){
            if (ch.kind === "max") {
                if (max === null || ch.value < max) max = ch.value;
            }
        }
        return max != null ? new Date(max) : null;
    }
    static create = (params)=>{
        return new ZodDate({
            checks: [],
            coerce: params?.coerce || false,
            typeName: ZodFirstPartyTypeKind.ZodDate,
            ...processCreateParams(params)
        });
    };
}
class ZodSymbol extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.symbol) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.symbol,
                received: ctx.parsedType
            });
            return INVALID;
        }
        return OK(input.data);
    }
    static create = (params)=>{
        return new ZodSymbol({
            typeName: ZodFirstPartyTypeKind.ZodSymbol,
            ...processCreateParams(params)
        });
    };
}
class ZodUndefined extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.undefined,
                received: ctx.parsedType
            });
            return INVALID;
        }
        return OK(input.data);
    }
    params;
    static create = (params)=>{
        return new ZodUndefined({
            typeName: ZodFirstPartyTypeKind.ZodUndefined,
            ...processCreateParams(params)
        });
    };
}
class ZodNull extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.null) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.null,
                received: ctx.parsedType
            });
            return INVALID;
        }
        return OK(input.data);
    }
    static create = (params)=>{
        return new ZodNull({
            typeName: ZodFirstPartyTypeKind.ZodNull,
            ...processCreateParams(params)
        });
    };
}
class ZodAny extends ZodType {
    _any = true;
    _parse(input) {
        return OK(input.data);
    }
    static create = (params)=>{
        return new ZodAny({
            typeName: ZodFirstPartyTypeKind.ZodAny,
            ...processCreateParams(params)
        });
    };
}
class ZodUnknown extends ZodType {
    _unknown = true;
    _parse(input) {
        return OK(input.data);
    }
    static create = (params)=>{
        return new ZodUnknown({
            typeName: ZodFirstPartyTypeKind.ZodUnknown,
            ...processCreateParams(params)
        });
    };
}
class ZodNever extends ZodType {
    _parse(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.never,
            received: ctx.parsedType
        });
        return INVALID;
    }
    static create = (params)=>{
        return new ZodNever({
            typeName: ZodFirstPartyTypeKind.ZodNever,
            ...processCreateParams(params)
        });
    };
}
class ZodVoid extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.void,
                received: ctx.parsedType
            });
            return INVALID;
        }
        return OK(input.data);
    }
    static create = (params)=>{
        return new ZodVoid({
            typeName: ZodFirstPartyTypeKind.ZodVoid,
            ...processCreateParams(params)
        });
    };
}
class ZodArray extends ZodType {
    _parse(input) {
        const { ctx, status } = this._processInputParams(input);
        const def = this._def;
        if (ctx.parsedType !== ZodParsedType.array) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.array,
                received: ctx.parsedType
            });
            return INVALID;
        }
        if (def.exactLength !== null) {
            const tooBig = ctx.data.length > def.exactLength.value;
            const tooSmall = ctx.data.length < def.exactLength.value;
            if (tooBig || tooSmall) {
                addIssueToContext(ctx, {
                    code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
                    minimum: tooSmall ? def.exactLength.value : undefined,
                    maximum: tooBig ? def.exactLength.value : undefined,
                    type: "array",
                    inclusive: true,
                    exact: true,
                    message: def.exactLength.message
                });
                status.dirty();
            }
        }
        if (def.minLength !== null) {
            if (ctx.data.length < def.minLength.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: def.minLength.value,
                    type: "array",
                    inclusive: true,
                    exact: false,
                    message: def.minLength.message
                });
                status.dirty();
            }
        }
        if (def.maxLength !== null) {
            if (ctx.data.length > def.maxLength.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: def.maxLength.value,
                    type: "array",
                    inclusive: true,
                    exact: false,
                    message: def.maxLength.message
                });
                status.dirty();
            }
        }
        if (ctx.common.async) {
            return Promise.all([
                ...ctx.data
            ].map((item, i)=>{
                return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
            })).then((result)=>{
                return ParseStatus.mergeArray(status, result);
            });
        }
        const result = [
            ...ctx.data
        ].map((item, i)=>{
            return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        });
        return ParseStatus.mergeArray(status, result);
    }
    get element() {
        return this._def.type;
    }
    min(minLength, message) {
        return new ZodArray({
            ...this._def,
            minLength: {
                value: minLength,
                message: errorUtil.toString(message)
            }
        });
    }
    max(maxLength, message) {
        return new ZodArray({
            ...this._def,
            maxLength: {
                value: maxLength,
                message: errorUtil.toString(message)
            }
        });
    }
    length(len, message) {
        return new ZodArray({
            ...this._def,
            exactLength: {
                value: len,
                message: errorUtil.toString(message)
            }
        });
    }
    nonempty(message) {
        return this.min(1, message);
    }
    static create = (schema, params)=>{
        return new ZodArray({
            type: schema,
            minLength: null,
            maxLength: null,
            exactLength: null,
            typeName: ZodFirstPartyTypeKind.ZodArray,
            ...processCreateParams(params)
        });
    };
}
function deepPartialify(schema) {
    if (schema instanceof ZodObject) {
        const newShape = {};
        for(const key in schema.shape){
            const fieldSchema = schema.shape[key];
            newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
        }
        return new ZodObject({
            ...schema._def,
            shape: ()=>newShape
        });
    } else if (schema instanceof ZodArray) {
        return new ZodArray({
            ...schema._def,
            type: deepPartialify(schema.element)
        });
    } else if (schema instanceof ZodOptional) {
        return ZodOptional.create(deepPartialify(schema.unwrap()));
    } else if (schema instanceof ZodNullable) {
        return ZodNullable.create(deepPartialify(schema.unwrap()));
    } else if (schema instanceof ZodTuple) {
        return ZodTuple.create(schema.items.map((item)=>deepPartialify(item)));
    } else {
        return schema;
    }
}
class ZodObject extends ZodType {
    _cached = null;
    _getCached() {
        if (this._cached !== null) return this._cached;
        const shape = this._def.shape();
        const keys = util.objectKeys(shape);
        return this._cached = {
            shape,
            keys
        };
    }
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.object) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType
            });
            return INVALID;
        }
        const { status, ctx } = this._processInputParams(input);
        const { shape, keys: shapeKeys } = this._getCached();
        const extraKeys = [];
        if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
            for(const key in ctx.data){
                if (!shapeKeys.includes(key)) {
                    extraKeys.push(key);
                }
            }
        }
        const pairs = [];
        for (const key of shapeKeys){
            const keyValidator = shape[key];
            const value1 = ctx.data[key];
            pairs.push({
                key: {
                    status: "valid",
                    value: key
                },
                value: keyValidator._parse(new ParseInputLazyPath(ctx, value1, ctx.path, key)),
                alwaysSet: key in ctx.data
            });
        }
        if (this._def.catchall instanceof ZodNever) {
            const unknownKeys = this._def.unknownKeys;
            if (unknownKeys === "passthrough") {
                for (const key of extraKeys){
                    pairs.push({
                        key: {
                            status: "valid",
                            value: key
                        },
                        value: {
                            status: "valid",
                            value: ctx.data[key]
                        }
                    });
                }
            } else if (unknownKeys === "strict") {
                if (extraKeys.length > 0) {
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.unrecognized_keys,
                        keys: extraKeys
                    });
                    status.dirty();
                }
            } else if (unknownKeys === "strip") {} else {
                throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
            }
        } else {
            const catchall = this._def.catchall;
            for (const key of extraKeys){
                const value1 = ctx.data[key];
                pairs.push({
                    key: {
                        status: "valid",
                        value: key
                    },
                    value: catchall._parse(new ParseInputLazyPath(ctx, value1, ctx.path, key)),
                    alwaysSet: key in ctx.data
                });
            }
        }
        if (ctx.common.async) {
            return Promise.resolve().then(async ()=>{
                const syncPairs = [];
                for (const pair of pairs){
                    const key = await pair.key;
                    syncPairs.push({
                        key,
                        value: await pair.value,
                        alwaysSet: pair.alwaysSet
                    });
                }
                return syncPairs;
            }).then((syncPairs)=>{
                return ParseStatus.mergeObjectSync(status, syncPairs);
            });
        } else {
            return ParseStatus.mergeObjectSync(status, pairs);
        }
    }
    get shape() {
        return this._def.shape();
    }
    strict(message) {
        errorUtil.errToObj;
        return new ZodObject({
            ...this._def,
            unknownKeys: "strict",
            ...message !== undefined ? {
                errorMap: (issue, ctx)=>{
                    const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
                    if (issue.code === "unrecognized_keys") return {
                        message: errorUtil.errToObj(message).message ?? defaultError
                    };
                    return {
                        message: defaultError
                    };
                }
            } : {}
        });
    }
    strip() {
        return new ZodObject({
            ...this._def,
            unknownKeys: "strip"
        });
    }
    passthrough() {
        return new ZodObject({
            ...this._def,
            unknownKeys: "passthrough"
        });
    }
    nonstrict = this.passthrough;
    extend(augmentation) {
        return new ZodObject({
            ...this._def,
            shape: ()=>({
                    ...this._def.shape(),
                    ...augmentation
                })
        });
    }
    augment = this.extend;
    merge(merging) {
        const merged = new ZodObject({
            unknownKeys: merging._def.unknownKeys,
            catchall: merging._def.catchall,
            shape: ()=>({
                    ...this._def.shape(),
                    ...merging._def.shape()
                }),
            typeName: ZodFirstPartyTypeKind.ZodObject
        });
        return merged;
    }
    setKey(key, schema) {
        return this.augment({
            [key]: schema
        });
    }
    catchall(index) {
        return new ZodObject({
            ...this._def,
            catchall: index
        });
    }
    pick(mask) {
        const shape = {};
        util.objectKeys(mask).forEach((key)=>{
            if (mask[key] && this.shape[key]) {
                shape[key] = this.shape[key];
            }
        });
        return new ZodObject({
            ...this._def,
            shape: ()=>shape
        });
    }
    omit(mask) {
        const shape = {};
        util.objectKeys(this.shape).forEach((key)=>{
            if (!mask[key]) {
                shape[key] = this.shape[key];
            }
        });
        return new ZodObject({
            ...this._def,
            shape: ()=>shape
        });
    }
    deepPartial() {
        return deepPartialify(this);
    }
    partial(mask) {
        const newShape = {};
        util.objectKeys(this.shape).forEach((key)=>{
            const fieldSchema = this.shape[key];
            if (mask && !mask[key]) {
                newShape[key] = fieldSchema;
            } else {
                newShape[key] = fieldSchema.optional();
            }
        });
        return new ZodObject({
            ...this._def,
            shape: ()=>newShape
        });
    }
    required(mask) {
        const newShape = {};
        util.objectKeys(this.shape).forEach((key)=>{
            if (mask && !mask[key]) {
                newShape[key] = this.shape[key];
            } else {
                const fieldSchema = this.shape[key];
                let newField = fieldSchema;
                while(newField instanceof ZodOptional){
                    newField = newField._def.innerType;
                }
                newShape[key] = newField;
            }
        });
        return new ZodObject({
            ...this._def,
            shape: ()=>newShape
        });
    }
    keyof() {
        return createZodEnum(util.objectKeys(this.shape));
    }
    static create = (shape, params)=>{
        return new ZodObject({
            shape: ()=>shape,
            unknownKeys: "strip",
            catchall: ZodNever.create(),
            typeName: ZodFirstPartyTypeKind.ZodObject,
            ...processCreateParams(params)
        });
    };
    static strictCreate = (shape, params)=>{
        return new ZodObject({
            shape: ()=>shape,
            unknownKeys: "strict",
            catchall: ZodNever.create(),
            typeName: ZodFirstPartyTypeKind.ZodObject,
            ...processCreateParams(params)
        });
    };
    static lazycreate = (shape, params)=>{
        return new ZodObject({
            shape,
            unknownKeys: "strip",
            catchall: ZodNever.create(),
            typeName: ZodFirstPartyTypeKind.ZodObject,
            ...processCreateParams(params)
        });
    };
}
class ZodUnion extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const options = this._def.options;
        function handleResults(results) {
            for (const result of results){
                if (result.result.status === "valid") {
                    return result.result;
                }
            }
            for (const result of results){
                if (result.result.status === "dirty") {
                    ctx.common.issues.push(...result.ctx.common.issues);
                    return result.result;
                }
            }
            const unionErrors = results.map((result)=>new ZodError(result.ctx.common.issues));
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union,
                unionErrors
            });
            return INVALID;
        }
        if (ctx.common.async) {
            return Promise.all(options.map(async (option)=>{
                const childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: []
                    },
                    parent: null
                };
                return {
                    result: await option._parseAsync({
                        data: ctx.data,
                        path: ctx.path,
                        parent: childCtx
                    }),
                    ctx: childCtx
                };
            })).then(handleResults);
        } else {
            let dirty = undefined;
            const issues = [];
            for (const option of options){
                const childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: []
                    },
                    parent: null
                };
                const result = option._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: childCtx
                });
                if (result.status === "valid") {
                    return result;
                } else if (result.status === "dirty" && !dirty) {
                    dirty = {
                        result,
                        ctx: childCtx
                    };
                }
                if (childCtx.common.issues.length) {
                    issues.push(childCtx.common.issues);
                }
            }
            if (dirty) {
                ctx.common.issues.push(...dirty.ctx.common.issues);
                return dirty.result;
            }
            const unionErrors = issues.map((issues)=>new ZodError(issues));
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union,
                unionErrors
            });
            return INVALID;
        }
    }
    get options() {
        return this._def.options;
    }
    static create = (types, params)=>{
        return new ZodUnion({
            options: types,
            typeName: ZodFirstPartyTypeKind.ZodUnion,
            ...processCreateParams(params)
        });
    };
}
const getDiscriminator = (type)=>{
    if (type instanceof ZodLazy) {
        return getDiscriminator(type.schema);
    } else if (type instanceof ZodEffects) {
        return getDiscriminator(type.innerType());
    } else if (type instanceof ZodLiteral) {
        return [
            type.value
        ];
    } else if (type instanceof ZodEnum) {
        return type.options;
    } else if (type instanceof ZodNativeEnum) {
        return Object.keys(type.enum);
    } else if (type instanceof ZodDefault) {
        return getDiscriminator(type._def.innerType);
    } else if (type instanceof ZodUndefined) {
        return [
            undefined
        ];
    } else if (type instanceof ZodNull) {
        return [
            null
        ];
    } else {
        return null;
    }
};
class ZodDiscriminatedUnion extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType
            });
            return INVALID;
        }
        const discriminator = this.discriminator;
        const discriminatorValue = ctx.data[discriminator];
        const option = this.optionsMap.get(discriminatorValue);
        if (!option) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union_discriminator,
                options: Array.from(this.optionsMap.keys()),
                path: [
                    discriminator
                ]
            });
            return INVALID;
        }
        if (ctx.common.async) {
            return option._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx
            });
        } else {
            return option._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx
            });
        }
    }
    get discriminator() {
        return this._def.discriminator;
    }
    get options() {
        return this._def.options;
    }
    get optionsMap() {
        return this._def.optionsMap;
    }
    static create(discriminator, options, params) {
        const optionsMap = new Map();
        for (const type of options){
            const discriminatorValues = getDiscriminator(type.shape[discriminator]);
            if (!discriminatorValues) {
                throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
            }
            for (const value1 of discriminatorValues){
                if (optionsMap.has(value1)) {
                    throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value1)}`);
                }
                optionsMap.set(value1, type);
            }
        }
        return new ZodDiscriminatedUnion({
            typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
            discriminator,
            options,
            optionsMap,
            ...processCreateParams(params)
        });
    }
}
function mergeValues(a, b) {
    const aType = getParsedType(a);
    const bType = getParsedType(b);
    if (a === b) {
        return {
            valid: true,
            data: a
        };
    } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
        const bKeys = util.objectKeys(b);
        const sharedKeys = util.objectKeys(a).filter((key)=>bKeys.indexOf(key) !== -1);
        const newObj = {
            ...a,
            ...b
        };
        for (const key of sharedKeys){
            const sharedValue = mergeValues(a[key], b[key]);
            if (!sharedValue.valid) {
                return {
                    valid: false
                };
            }
            newObj[key] = sharedValue.data;
        }
        return {
            valid: true,
            data: newObj
        };
    } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
        if (a.length !== b.length) {
            return {
                valid: false
            };
        }
        const newArray = [];
        for(let index = 0; index < a.length; index++){
            const itemA = a[index];
            const itemB = b[index];
            const sharedValue = mergeValues(itemA, itemB);
            if (!sharedValue.valid) {
                return {
                    valid: false
                };
            }
            newArray.push(sharedValue.data);
        }
        return {
            valid: true,
            data: newArray
        };
    } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
        return {
            valid: true,
            data: a
        };
    } else {
        return {
            valid: false
        };
    }
}
class ZodIntersection extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const handleParsed = (parsedLeft, parsedRight)=>{
            if (isAborted(parsedLeft) || isAborted(parsedRight)) {
                return INVALID;
            }
            const merged = mergeValues(parsedLeft.value, parsedRight.value);
            if (!merged.valid) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_intersection_types
                });
                return INVALID;
            }
            if (isDirty(parsedLeft) || isDirty(parsedRight)) {
                status.dirty();
            }
            return {
                status: status.value,
                value: merged.data
            };
        };
        if (ctx.common.async) {
            return Promise.all([
                this._def.left._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx
                }),
                this._def.right._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx
                })
            ]).then(([left, right])=>handleParsed(left, right));
        } else {
            return handleParsed(this._def.left._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx
            }), this._def.right._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx
            }));
        }
    }
    static create = (left, right, params)=>{
        return new ZodIntersection({
            left: left,
            right: right,
            typeName: ZodFirstPartyTypeKind.ZodIntersection,
            ...processCreateParams(params)
        });
    };
}
class ZodTuple extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.array) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.array,
                received: ctx.parsedType
            });
            return INVALID;
        }
        if (ctx.data.length < this._def.items.length) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: this._def.items.length,
                inclusive: true,
                exact: false,
                type: "array"
            });
            return INVALID;
        }
        const rest = this._def.rest;
        if (!rest && ctx.data.length > this._def.items.length) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: this._def.items.length,
                inclusive: true,
                exact: false,
                type: "array"
            });
            status.dirty();
        }
        const items = [
            ...ctx.data
        ].map((item, itemIndex)=>{
            const schema = this._def.items[itemIndex] || this._def.rest;
            if (!schema) return null;
            return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
        }).filter((x)=>!!x);
        if (ctx.common.async) {
            return Promise.all(items).then((results)=>{
                return ParseStatus.mergeArray(status, results);
            });
        } else {
            return ParseStatus.mergeArray(status, items);
        }
    }
    get items() {
        return this._def.items;
    }
    rest(rest) {
        return new ZodTuple({
            ...this._def,
            rest
        });
    }
    static create = (schemas, params)=>{
        if (!Array.isArray(schemas)) {
            throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
        }
        return new ZodTuple({
            items: schemas,
            typeName: ZodFirstPartyTypeKind.ZodTuple,
            rest: null,
            ...processCreateParams(params)
        });
    };
}
class ZodRecord extends ZodType {
    get keySchema() {
        return this._def.keyType;
    }
    get valueSchema() {
        return this._def.valueType;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType
            });
            return INVALID;
        }
        const pairs = [];
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        for(const key in ctx.data){
            pairs.push({
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
                value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key))
            });
        }
        if (ctx.common.async) {
            return ParseStatus.mergeObjectAsync(status, pairs);
        } else {
            return ParseStatus.mergeObjectSync(status, pairs);
        }
    }
    get element() {
        return this._def.valueType;
    }
    static create(first, second, third) {
        if (second instanceof ZodType) {
            return new ZodRecord({
                keyType: first,
                valueType: second,
                typeName: ZodFirstPartyTypeKind.ZodRecord,
                ...processCreateParams(third)
            });
        }
        return new ZodRecord({
            keyType: ZodString.create(),
            valueType: first,
            typeName: ZodFirstPartyTypeKind.ZodRecord,
            ...processCreateParams(second)
        });
    }
}
class ZodMap extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.map) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.map,
                received: ctx.parsedType
            });
            return INVALID;
        }
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        const pairs = [
            ...ctx.data.entries()
        ].map(([key, value1], index)=>{
            return {
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [
                    index,
                    "key"
                ])),
                value: valueType._parse(new ParseInputLazyPath(ctx, value1, ctx.path, [
                    index,
                    "value"
                ]))
            };
        });
        if (ctx.common.async) {
            const finalMap = new Map();
            return Promise.resolve().then(async ()=>{
                for (const pair of pairs){
                    const key = await pair.key;
                    const value1 = await pair.value;
                    if (key.status === "aborted" || value1.status === "aborted") {
                        return INVALID;
                    }
                    if (key.status === "dirty" || value1.status === "dirty") {
                        status.dirty();
                    }
                    finalMap.set(key.value, value1.value);
                }
                return {
                    status: status.value,
                    value: finalMap
                };
            });
        } else {
            const finalMap = new Map();
            for (const pair of pairs){
                const key = pair.key;
                const value1 = pair.value;
                if (key.status === "aborted" || value1.status === "aborted") {
                    return INVALID;
                }
                if (key.status === "dirty" || value1.status === "dirty") {
                    status.dirty();
                }
                finalMap.set(key.value, value1.value);
            }
            return {
                status: status.value,
                value: finalMap
            };
        }
    }
    static create = (keyType, valueType, params)=>{
        return new ZodMap({
            valueType,
            keyType,
            typeName: ZodFirstPartyTypeKind.ZodMap,
            ...processCreateParams(params)
        });
    };
}
class ZodSet extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.set) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.set,
                received: ctx.parsedType
            });
            return INVALID;
        }
        const def = this._def;
        if (def.minSize !== null) {
            if (ctx.data.size < def.minSize.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: def.minSize.value,
                    type: "set",
                    inclusive: true,
                    exact: false,
                    message: def.minSize.message
                });
                status.dirty();
            }
        }
        if (def.maxSize !== null) {
            if (ctx.data.size > def.maxSize.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: def.maxSize.value,
                    type: "set",
                    inclusive: true,
                    exact: false,
                    message: def.maxSize.message
                });
                status.dirty();
            }
        }
        const valueType = this._def.valueType;
        function finalizeSet(elements) {
            const parsedSet = new Set();
            for (const element of elements){
                if (element.status === "aborted") return INVALID;
                if (element.status === "dirty") status.dirty();
                parsedSet.add(element.value);
            }
            return {
                status: status.value,
                value: parsedSet
            };
        }
        const elements = [
            ...ctx.data.values()
        ].map((item, i)=>valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
        if (ctx.common.async) {
            return Promise.all(elements).then((elements)=>finalizeSet(elements));
        } else {
            return finalizeSet(elements);
        }
    }
    min(minSize, message) {
        return new ZodSet({
            ...this._def,
            minSize: {
                value: minSize,
                message: errorUtil.toString(message)
            }
        });
    }
    max(maxSize, message) {
        return new ZodSet({
            ...this._def,
            maxSize: {
                value: maxSize,
                message: errorUtil.toString(message)
            }
        });
    }
    size(size, message) {
        return this.min(size, message).max(size, message);
    }
    nonempty(message) {
        return this.min(1, message);
    }
    static create = (valueType, params)=>{
        return new ZodSet({
            valueType,
            minSize: null,
            maxSize: null,
            typeName: ZodFirstPartyTypeKind.ZodSet,
            ...processCreateParams(params)
        });
    };
}
class ZodFunction extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.function) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.function,
                received: ctx.parsedType
            });
            return INVALID;
        }
        function makeArgsIssue(args, error) {
            return makeIssue({
                data: args,
                path: ctx.path,
                errorMaps: [
                    ctx.common.contextualErrorMap,
                    ctx.schemaErrorMap,
                    getErrorMap(),
                    errorMap
                ].filter((x)=>!!x),
                issueData: {
                    code: ZodIssueCode.invalid_arguments,
                    argumentsError: error
                }
            });
        }
        function makeReturnsIssue(returns, error) {
            return makeIssue({
                data: returns,
                path: ctx.path,
                errorMaps: [
                    ctx.common.contextualErrorMap,
                    ctx.schemaErrorMap,
                    getErrorMap(),
                    errorMap
                ].filter((x)=>!!x),
                issueData: {
                    code: ZodIssueCode.invalid_return_type,
                    returnTypeError: error
                }
            });
        }
        const params = {
            errorMap: ctx.common.contextualErrorMap
        };
        const fn = ctx.data;
        if (this._def.returns instanceof ZodPromise) {
            return OK(async (...args)=>{
                const error = new ZodError([]);
                const parsedArgs = await this._def.args.parseAsync(args, params).catch((e)=>{
                    error.addIssue(makeArgsIssue(args, e));
                    throw error;
                });
                const result = await fn(...parsedArgs);
                const parsedReturns = await this._def.returns._def.type.parseAsync(result, params).catch((e)=>{
                    error.addIssue(makeReturnsIssue(result, e));
                    throw error;
                });
                return parsedReturns;
            });
        } else {
            return OK((...args)=>{
                const parsedArgs = this._def.args.safeParse(args, params);
                if (!parsedArgs.success) {
                    throw new ZodError([
                        makeArgsIssue(args, parsedArgs.error)
                    ]);
                }
                const result = fn(...parsedArgs.data);
                const parsedReturns = this._def.returns.safeParse(result, params);
                if (!parsedReturns.success) {
                    throw new ZodError([
                        makeReturnsIssue(result, parsedReturns.error)
                    ]);
                }
                return parsedReturns.data;
            });
        }
    }
    parameters() {
        return this._def.args;
    }
    returnType() {
        return this._def.returns;
    }
    args(...items) {
        return new ZodFunction({
            ...this._def,
            args: ZodTuple.create(items).rest(ZodUnknown.create())
        });
    }
    returns(returnType) {
        return new ZodFunction({
            ...this._def,
            returns: returnType
        });
    }
    implement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
    }
    strictImplement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
    }
    validate = this.implement;
    static create(args, returns, params) {
        return new ZodFunction({
            args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
            returns: returns || ZodUnknown.create(),
            typeName: ZodFirstPartyTypeKind.ZodFunction,
            ...processCreateParams(params)
        });
    }
}
class ZodLazy extends ZodType {
    get schema() {
        return this._def.getter();
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const lazySchema = this._def.getter();
        return lazySchema._parse({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
        });
    }
    static create = (getter, params)=>{
        return new ZodLazy({
            getter: getter,
            typeName: ZodFirstPartyTypeKind.ZodLazy,
            ...processCreateParams(params)
        });
    };
}
class ZodLiteral extends ZodType {
    _parse(input) {
        if (input.data !== this._def.value) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                received: ctx.data,
                code: ZodIssueCode.invalid_literal,
                expected: this._def.value
            });
            return INVALID;
        }
        return {
            status: "valid",
            value: input.data
        };
    }
    get value() {
        return this._def.value;
    }
    static create = (value1, params)=>{
        return new ZodLiteral({
            value: value1,
            typeName: ZodFirstPartyTypeKind.ZodLiteral,
            ...processCreateParams(params)
        });
    };
}
function createZodEnum(values, params) {
    return new ZodEnum({
        values: values,
        typeName: ZodFirstPartyTypeKind.ZodEnum,
        ...processCreateParams(params)
    });
}
class ZodEnum extends ZodType {
    _parse(input) {
        if (typeof input.data !== "string") {
            const ctx = this._getOrReturnCtx(input);
            const expectedValues = this._def.values;
            addIssueToContext(ctx, {
                expected: util.joinValues(expectedValues),
                received: ctx.parsedType,
                code: ZodIssueCode.invalid_type
            });
            return INVALID;
        }
        if (this._def.values.indexOf(input.data) === -1) {
            const ctx = this._getOrReturnCtx(input);
            const expectedValues = this._def.values;
            addIssueToContext(ctx, {
                received: ctx.data,
                code: ZodIssueCode.invalid_enum_value,
                options: expectedValues
            });
            return INVALID;
        }
        return OK(input.data);
    }
    get options() {
        return this._def.values;
    }
    get enum() {
        const enumValues = {};
        for (const val of this._def.values){
            enumValues[val] = val;
        }
        return enumValues;
    }
    get Values() {
        const enumValues = {};
        for (const val of this._def.values){
            enumValues[val] = val;
        }
        return enumValues;
    }
    get Enum() {
        const enumValues = {};
        for (const val of this._def.values){
            enumValues[val] = val;
        }
        return enumValues;
    }
    extract(values) {
        return ZodEnum.create(values);
    }
    exclude(values) {
        return ZodEnum.create(this.options.filter((opt)=>!values.includes(opt)));
    }
    static create = createZodEnum;
}
class ZodNativeEnum extends ZodType {
    _parse(input) {
        const nativeEnumValues = util.getValidEnumValues(this._def.values);
        const ctx = this._getOrReturnCtx(input);
        if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
            const expectedValues = util.objectValues(nativeEnumValues);
            addIssueToContext(ctx, {
                expected: util.joinValues(expectedValues),
                received: ctx.parsedType,
                code: ZodIssueCode.invalid_type
            });
            return INVALID;
        }
        if (nativeEnumValues.indexOf(input.data) === -1) {
            const expectedValues = util.objectValues(nativeEnumValues);
            addIssueToContext(ctx, {
                received: ctx.data,
                code: ZodIssueCode.invalid_enum_value,
                options: expectedValues
            });
            return INVALID;
        }
        return OK(input.data);
    }
    get enum() {
        return this._def.values;
    }
    static create = (values, params)=>{
        return new ZodNativeEnum({
            values: values,
            typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
            ...processCreateParams(params)
        });
    };
}
class ZodPromise extends ZodType {
    unwrap() {
        return this._def.type;
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.promise,
                received: ctx.parsedType
            });
            return INVALID;
        }
        const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
        return OK(promisified.then((data)=>{
            return this._def.type.parseAsync(data, {
                path: ctx.path,
                errorMap: ctx.common.contextualErrorMap
            });
        }));
    }
    static create = (schema, params)=>{
        return new ZodPromise({
            type: schema,
            typeName: ZodFirstPartyTypeKind.ZodPromise,
            ...processCreateParams(params)
        });
    };
}
class ZodEffects extends ZodType {
    innerType() {
        return this._def.schema;
    }
    sourceType() {
        return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const effect = this._def.effect || null;
        if (effect.type === "preprocess") {
            const processed = effect.transform(ctx.data);
            if (ctx.common.async) {
                return Promise.resolve(processed).then((processed)=>{
                    return this._def.schema._parseAsync({
                        data: processed,
                        path: ctx.path,
                        parent: ctx
                    });
                });
            } else {
                return this._def.schema._parseSync({
                    data: processed,
                    path: ctx.path,
                    parent: ctx
                });
            }
        }
        const checkCtx = {
            addIssue: (arg)=>{
                addIssueToContext(ctx, arg);
                if (arg.fatal) {
                    status.abort();
                } else {
                    status.dirty();
                }
            },
            get path () {
                return ctx.path;
            }
        };
        checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
        if (effect.type === "refinement") {
            const executeRefinement = (acc)=>{
                const result = effect.refinement(acc, checkCtx);
                if (ctx.common.async) {
                    return Promise.resolve(result);
                }
                if (result instanceof Promise) {
                    throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
                }
                return acc;
            };
            if (ctx.common.async === false) {
                const inner = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx
                });
                if (inner.status === "aborted") return INVALID;
                if (inner.status === "dirty") status.dirty();
                executeRefinement(inner.value);
                return {
                    status: status.value,
                    value: inner.value
                };
            } else {
                return this._def.schema._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx
                }).then((inner)=>{
                    if (inner.status === "aborted") return INVALID;
                    if (inner.status === "dirty") status.dirty();
                    return executeRefinement(inner.value).then(()=>{
                        return {
                            status: status.value,
                            value: inner.value
                        };
                    });
                });
            }
        }
        if (effect.type === "transform") {
            if (ctx.common.async === false) {
                const base = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx
                });
                if (!isValid(base)) return base;
                const result = effect.transform(base.value, checkCtx);
                if (result instanceof Promise) {
                    throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
                }
                return {
                    status: status.value,
                    value: result
                };
            } else {
                return this._def.schema._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx
                }).then((base)=>{
                    if (!isValid(base)) return base;
                    return Promise.resolve(effect.transform(base.value, checkCtx)).then((result)=>({
                            status: status.value,
                            value: result
                        }));
                });
            }
        }
        util.assertNever(effect);
    }
    static create = (schema, effect, params)=>{
        return new ZodEffects({
            schema,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect,
            ...processCreateParams(params)
        });
    };
    static createWithPreprocess = (preprocess, schema, params)=>{
        return new ZodEffects({
            schema,
            effect: {
                type: "preprocess",
                transform: preprocess
            },
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            ...processCreateParams(params)
        });
    };
}
class ZodOptional extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.undefined) {
            return OK(undefined);
        }
        return this._def.innerType._parse(input);
    }
    unwrap() {
        return this._def.innerType;
    }
    static create = (type, params)=>{
        return new ZodOptional({
            innerType: type,
            typeName: ZodFirstPartyTypeKind.ZodOptional,
            ...processCreateParams(params)
        });
    };
}
class ZodNullable extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.null) {
            return OK(null);
        }
        return this._def.innerType._parse(input);
    }
    unwrap() {
        return this._def.innerType;
    }
    static create = (type, params)=>{
        return new ZodNullable({
            innerType: type,
            typeName: ZodFirstPartyTypeKind.ZodNullable,
            ...processCreateParams(params)
        });
    };
}
class ZodDefault extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        let data = ctx.data;
        if (ctx.parsedType === ZodParsedType.undefined) {
            data = this._def.defaultValue();
        }
        return this._def.innerType._parse({
            data,
            path: ctx.path,
            parent: ctx
        });
    }
    removeDefault() {
        return this._def.innerType;
    }
    static create = (type, params)=>{
        return new ZodDefault({
            innerType: type,
            typeName: ZodFirstPartyTypeKind.ZodDefault,
            defaultValue: typeof params.default === "function" ? params.default : ()=>params.default,
            ...processCreateParams(params)
        });
    };
}
class ZodCatch extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const newCtx = {
            ...ctx,
            common: {
                ...ctx.common,
                issues: []
            }
        };
        const result = this._def.innerType._parse({
            data: newCtx.data,
            path: newCtx.path,
            parent: {
                ...newCtx
            }
        });
        if (isAsync(result)) {
            return result.then((result)=>{
                return {
                    status: "valid",
                    value: result.status === "valid" ? result.value : this._def.catchValue({
                        get error () {
                            return new ZodError(newCtx.common.issues);
                        },
                        input: newCtx.data
                    })
                };
            });
        } else {
            return {
                status: "valid",
                value: result.status === "valid" ? result.value : this._def.catchValue({
                    get error () {
                        return new ZodError(newCtx.common.issues);
                    },
                    input: newCtx.data
                })
            };
        }
    }
    removeCatch() {
        return this._def.innerType;
    }
    static create = (type, params)=>{
        return new ZodCatch({
            innerType: type,
            typeName: ZodFirstPartyTypeKind.ZodCatch,
            catchValue: typeof params.catch === "function" ? params.catch : ()=>params.catch,
            ...processCreateParams(params)
        });
    };
}
class ZodNaN extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.nan) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.nan,
                received: ctx.parsedType
            });
            return INVALID;
        }
        return {
            status: "valid",
            value: input.data
        };
    }
    static create = (params)=>{
        return new ZodNaN({
            typeName: ZodFirstPartyTypeKind.ZodNaN,
            ...processCreateParams(params)
        });
    };
}
Symbol("zod_brand");
class ZodBranded extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const data = ctx.data;
        return this._def.type._parse({
            data,
            path: ctx.path,
            parent: ctx
        });
    }
    unwrap() {
        return this._def.type;
    }
}
class ZodPipeline extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.common.async) {
            const handleAsync = async ()=>{
                const inResult = await this._def.in._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx
                });
                if (inResult.status === "aborted") return INVALID;
                if (inResult.status === "dirty") {
                    status.dirty();
                    return DIRTY(inResult.value);
                } else {
                    return this._def.out._parseAsync({
                        data: inResult.value,
                        path: ctx.path,
                        parent: ctx
                    });
                }
            };
            return handleAsync();
        } else {
            const inResult = this._def.in._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx
            });
            if (inResult.status === "aborted") return INVALID;
            if (inResult.status === "dirty") {
                status.dirty();
                return {
                    status: "dirty",
                    value: inResult.value
                };
            } else {
                return this._def.out._parseSync({
                    data: inResult.value,
                    path: ctx.path,
                    parent: ctx
                });
            }
        }
    }
    static create(a, b) {
        return new ZodPipeline({
            in: a,
            out: b,
            typeName: ZodFirstPartyTypeKind.ZodPipeline
        });
    }
}
({
    object: ZodObject.lazycreate
});
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind) {
    ZodFirstPartyTypeKind["ZodString"] = "ZodString";
    ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";
    ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";
    ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";
    ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";
    ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";
    ZodFirstPartyTypeKind["ZodSymbol"] = "ZodSymbol";
    ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";
    ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";
    ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";
    ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";
    ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";
    ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";
    ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";
    ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";
    ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";
    ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
    ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";
    ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";
    ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";
    ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";
    ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";
    ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";
    ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";
    ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";
    ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";
    ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";
    ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";
    ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";
    ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";
    ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";
    ZodFirstPartyTypeKind["ZodCatch"] = "ZodCatch";
    ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";
    ZodFirstPartyTypeKind["ZodBranded"] = "ZodBranded";
    ZodFirstPartyTypeKind["ZodPipeline"] = "ZodPipeline";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
ZodString.create;
ZodNumber.create;
ZodNaN.create;
ZodBigInt.create;
ZodBoolean.create;
ZodDate.create;
ZodSymbol.create;
ZodUndefined.create;
ZodNull.create;
ZodAny.create;
ZodUnknown.create;
ZodNever.create;
ZodVoid.create;
ZodArray.create;
ZodObject.create;
ZodObject.strictCreate;
ZodUnion.create;
ZodDiscriminatedUnion.create;
ZodIntersection.create;
ZodTuple.create;
ZodRecord.create;
ZodMap.create;
ZodSet.create;
ZodFunction.create;
ZodLazy.create;
ZodLiteral.create;
ZodEnum.create;
ZodNativeEnum.create;
ZodPromise.create;
ZodEffects.create;
ZodOptional.create;
ZodNullable.create;
ZodEffects.createWithPreprocess;
ZodPipeline.create;
class DenoStdInternalError extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert1(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError(msg);
    }
}
const { hasOwn: hasOwn1 } = Object;
const osType1 = (()=>{
    const { Deno: Deno1 } = globalThis;
    if (typeof Deno1?.build?.os === "string") {
        return Deno1.build.os;
    }
    const { navigator } = globalThis;
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
    if (base === sep) return dir;
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
const sep2 = "\\";
const delimiter3 = ";";
function resolve3(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        const { Deno: Deno1 } = globalThis;
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
    return stripTrailingSeparators1(path.slice(0, end), isPosixPathSeparator1);
}
function basename3(path, suffix = "") {
    assertPath1(path);
    if (path.length === 0) return path;
    if (typeof suffix !== "string") {
        throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
    }
    let start = 0;
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot1(drive)) {
            if (path.charCodeAt(1) === 58) start = 2;
        }
    }
    const lastSegment = lastPathSegment1(path, isPathSeparator1, start);
    const strippedSegment = stripTrailingSeparators1(lastSegment, isPathSeparator1);
    return suffix ? stripSuffix1(strippedSegment, suffix) : strippedSegment;
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
function parse3(path) {
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
    } else if (isPathSeparator1(code)) {
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
    ret.base = ret.base || "\\";
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
    sep: sep2,
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
    parse: parse3,
    fromFileUrl: fromFileUrl3,
    toFileUrl: toFileUrl3
};
const sep3 = "/";
const delimiter4 = ":";
function resolve4(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            const { Deno: Deno1 } = globalThis;
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
        resolvedAbsolute = isPosixPathSeparator1(path.charCodeAt(0));
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
    const isAbsolute = isPosixPathSeparator1(path.charCodeAt(0));
    const trailingSeparator = isPosixPathSeparator1(path.charCodeAt(path.length - 1));
    path = normalizeString1(path, !isAbsolute, "/", isPosixPathSeparator1);
    if (path.length === 0 && !isAbsolute) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute) return `/${path}`;
    return path;
}
function isAbsolute4(path) {
    assertPath1(path);
    return path.length > 0 && isPosixPathSeparator1(path.charCodeAt(0));
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
        if (!isPosixPathSeparator1(from.charCodeAt(fromStart))) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (!isPosixPathSeparator1(to.charCodeAt(toStart))) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (isPosixPathSeparator1(to.charCodeAt(toStart + i))) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (isPosixPathSeparator1(from.charCodeAt(fromStart + i))) {
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
        else if (isPosixPathSeparator1(fromCode)) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || isPosixPathSeparator1(from.charCodeAt(i))) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (isPosixPathSeparator1(to.charCodeAt(toStart))) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath4(path) {
    return path;
}
function dirname4(path) {
    if (path.length === 0) return ".";
    let end = -1;
    let matchedNonSeparator = false;
    for(let i = path.length - 1; i >= 1; --i){
        if (isPosixPathSeparator1(path.charCodeAt(i))) {
            if (matchedNonSeparator) {
                end = i;
                break;
            }
        } else {
            matchedNonSeparator = true;
        }
    }
    if (end === -1) {
        return isPosixPathSeparator1(path.charCodeAt(0)) ? "/" : ".";
    }
    return stripTrailingSeparators1(path.slice(0, end), isPosixPathSeparator1);
}
function basename4(path, suffix = "") {
    assertPath1(path);
    if (path.length === 0) return path;
    if (typeof suffix !== "string") {
        throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
    }
    const lastSegment = lastPathSegment1(path, isPosixPathSeparator1);
    const strippedSegment = stripTrailingSeparators1(lastSegment, isPosixPathSeparator1);
    return suffix ? stripSuffix1(strippedSegment, suffix) : strippedSegment;
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
        if (isPosixPathSeparator1(code)) {
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
function parse4(path) {
    assertPath1(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path.length === 0) return ret;
    const isAbsolute = isPosixPathSeparator1(path.charCodeAt(0));
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
        if (isPosixPathSeparator1(code)) {
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
        ret.dir = stripTrailingSeparators1(path.slice(0, startPart - 1), isPosixPathSeparator1);
    } else if (isAbsolute) ret.dir = "/";
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
    sep: sep3,
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
    parse: parse4,
    fromFileUrl: fromFileUrl4,
    toFileUrl: toFileUrl4
};
const SEP = isWindows1 ? "\\" : "/";
const SEP_PATTERN = isWindows1 ? /[\\/]+/ : /\/+/;
function common(paths, sep = SEP) {
    const [first = "", ...remaining] = paths;
    if (first === "" || remaining.length === 0) {
        return first.substring(0, first.lastIndexOf(sep) + 1);
    }
    const parts = first.split(sep);
    let endOfPrefix = parts.length;
    for (const path of remaining){
        const compare = path.split(sep);
        for(let i = 0; i < endOfPrefix; i++){
            if (compare[i] !== parts[i]) {
                endOfPrefix = i;
            }
        }
        if (endOfPrefix === 0) {
            return "";
        }
    }
    const prefix = parts.slice(0, endOfPrefix).join(sep);
    return prefix.endsWith(sep) ? prefix : `${prefix}${sep}`;
}
const path2 = isWindows1 ? mod2 : mod3;
const { join: join6, normalize: normalize6 } = path2;
const regExpEscapeChars = [
    "!",
    "$",
    "(",
    ")",
    "*",
    "+",
    ".",
    "=",
    "?",
    "[",
    "\\",
    "^",
    "{",
    "|"
];
const rangeEscapeChars = [
    "-",
    "\\",
    "]"
];
function globToRegExp(glob, { extended = true, globstar: globstarOption = true, os = osType1, caseInsensitive = false } = {}) {
    if (glob == "") {
        return /(?!)/;
    }
    const sep = os == "windows" ? "(?:\\\\|/)+" : "/+";
    const sepMaybe = os == "windows" ? "(?:\\\\|/)*" : "/*";
    const seps = os == "windows" ? [
        "\\",
        "/"
    ] : [
        "/"
    ];
    const globstar = os == "windows" ? "(?:[^\\\\/]*(?:\\\\|/|$)+)*" : "(?:[^/]*(?:/|$)+)*";
    const wildcard = os == "windows" ? "[^\\\\/]*" : "[^/]*";
    const escapePrefix = os == "windows" ? "`" : "\\";
    let newLength = glob.length;
    for(; newLength > 1 && seps.includes(glob[newLength - 1]); newLength--);
    glob = glob.slice(0, newLength);
    let regExpString = "";
    for(let j = 0; j < glob.length;){
        let segment = "";
        const groupStack = [];
        let inRange = false;
        let inEscape = false;
        let endsWithSep = false;
        let i = j;
        for(; i < glob.length && !seps.includes(glob[i]); i++){
            if (inEscape) {
                inEscape = false;
                const escapeChars = inRange ? rangeEscapeChars : regExpEscapeChars;
                segment += escapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
                continue;
            }
            if (glob[i] == escapePrefix) {
                inEscape = true;
                continue;
            }
            if (glob[i] == "[") {
                if (!inRange) {
                    inRange = true;
                    segment += "[";
                    if (glob[i + 1] == "!") {
                        i++;
                        segment += "^";
                    } else if (glob[i + 1] == "^") {
                        i++;
                        segment += "\\^";
                    }
                    continue;
                } else if (glob[i + 1] == ":") {
                    let k = i + 1;
                    let value1 = "";
                    while(glob[k + 1] != null && glob[k + 1] != ":"){
                        value1 += glob[k + 1];
                        k++;
                    }
                    if (glob[k + 1] == ":" && glob[k + 2] == "]") {
                        i = k + 2;
                        if (value1 == "alnum") segment += "\\dA-Za-z";
                        else if (value1 == "alpha") segment += "A-Za-z";
                        else if (value1 == "ascii") segment += "\x00-\x7F";
                        else if (value1 == "blank") segment += "\t ";
                        else if (value1 == "cntrl") segment += "\x00-\x1F\x7F";
                        else if (value1 == "digit") segment += "\\d";
                        else if (value1 == "graph") segment += "\x21-\x7E";
                        else if (value1 == "lower") segment += "a-z";
                        else if (value1 == "print") segment += "\x20-\x7E";
                        else if (value1 == "punct") {
                            segment += "!\"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^_‘{|}~";
                        } else if (value1 == "space") segment += "\\s\v";
                        else if (value1 == "upper") segment += "A-Z";
                        else if (value1 == "word") segment += "\\w";
                        else if (value1 == "xdigit") segment += "\\dA-Fa-f";
                        continue;
                    }
                }
            }
            if (glob[i] == "]" && inRange) {
                inRange = false;
                segment += "]";
                continue;
            }
            if (inRange) {
                if (glob[i] == "\\") {
                    segment += `\\\\`;
                } else {
                    segment += glob[i];
                }
                continue;
            }
            if (glob[i] == ")" && groupStack.length > 0 && groupStack[groupStack.length - 1] != "BRACE") {
                segment += ")";
                const type = groupStack.pop();
                if (type == "!") {
                    segment += wildcard;
                } else if (type != "@") {
                    segment += type;
                }
                continue;
            }
            if (glob[i] == "|" && groupStack.length > 0 && groupStack[groupStack.length - 1] != "BRACE") {
                segment += "|";
                continue;
            }
            if (glob[i] == "+" && extended && glob[i + 1] == "(") {
                i++;
                groupStack.push("+");
                segment += "(?:";
                continue;
            }
            if (glob[i] == "@" && extended && glob[i + 1] == "(") {
                i++;
                groupStack.push("@");
                segment += "(?:";
                continue;
            }
            if (glob[i] == "?") {
                if (extended && glob[i + 1] == "(") {
                    i++;
                    groupStack.push("?");
                    segment += "(?:";
                } else {
                    segment += ".";
                }
                continue;
            }
            if (glob[i] == "!" && extended && glob[i + 1] == "(") {
                i++;
                groupStack.push("!");
                segment += "(?!";
                continue;
            }
            if (glob[i] == "{") {
                groupStack.push("BRACE");
                segment += "(?:";
                continue;
            }
            if (glob[i] == "}" && groupStack[groupStack.length - 1] == "BRACE") {
                groupStack.pop();
                segment += ")";
                continue;
            }
            if (glob[i] == "," && groupStack[groupStack.length - 1] == "BRACE") {
                segment += "|";
                continue;
            }
            if (glob[i] == "*") {
                if (extended && glob[i + 1] == "(") {
                    i++;
                    groupStack.push("*");
                    segment += "(?:";
                } else {
                    const prevChar = glob[i - 1];
                    let numStars = 1;
                    while(glob[i + 1] == "*"){
                        i++;
                        numStars++;
                    }
                    const nextChar = glob[i + 1];
                    if (globstarOption && numStars == 2 && [
                        ...seps,
                        undefined
                    ].includes(prevChar) && [
                        ...seps,
                        undefined
                    ].includes(nextChar)) {
                        segment += globstar;
                        endsWithSep = true;
                    } else {
                        segment += wildcard;
                    }
                }
                continue;
            }
            segment += regExpEscapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
        }
        if (groupStack.length > 0 || inRange || inEscape) {
            segment = "";
            for (const c of glob.slice(j, i)){
                segment += regExpEscapeChars.includes(c) ? `\\${c}` : c;
                endsWithSep = false;
            }
        }
        regExpString += segment;
        if (!endsWithSep) {
            regExpString += i < glob.length ? sep : sepMaybe;
            endsWithSep = true;
        }
        while(seps.includes(glob[i]))i++;
        if (!(i > j)) {
            throw new Error("Assertion failure: i > j (potential infinite loop)");
        }
        j = i;
    }
    regExpString = `^${regExpString}$`;
    return new RegExp(regExpString, caseInsensitive ? "i" : "");
}
function isGlob(str) {
    const chars = {
        "{": "}",
        "(": ")",
        "[": "]"
    };
    const regex = /\\(.)|(^!|\*|\?|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\))/;
    if (str === "") {
        return false;
    }
    let match;
    while(match = regex.exec(str)){
        if (match[2]) return true;
        let idx = match.index + match[0].length;
        const open = match[1];
        const close = open ? chars[open] : null;
        if (open && close) {
            const n = str.indexOf(close, idx);
            if (n !== -1) {
                idx = n + 1;
            }
        }
        str = str.slice(idx);
    }
    return false;
}
function normalizeGlob(glob, { globstar = false } = {}) {
    if (glob.match(/\0/g)) {
        throw new Error(`Glob contains invalid characters: "${glob}"`);
    }
    if (!globstar) {
        return normalize6(glob);
    }
    const s = SEP_PATTERN.source;
    const badParentPattern = new RegExp(`(?<=(${s}|^)\\*\\*${s})\\.\\.(?=${s}|$)`, "g");
    return normalize6(glob.replace(badParentPattern, "\0")).replace(/\0/g, "..");
}
function joinGlobs(globs, { extended = true, globstar = false } = {}) {
    if (!globstar || globs.length == 0) {
        return join6(...globs);
    }
    if (globs.length === 0) return ".";
    let joined;
    for (const glob of globs){
        const path = glob;
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `${SEP}${path}`;
        }
    }
    if (!joined) return ".";
    return normalizeGlob(joined, {
        extended,
        globstar
    });
}
const path3 = isWindows1 ? mod2 : mod3;
const { basename: basename5, delimiter: delimiter5, dirname: dirname5, extname: extname5, format: format5, fromFileUrl: fromFileUrl5, isAbsolute: isAbsolute5, join: join7, normalize: normalize7, parse: parse5, relative: relative5, resolve: resolve5, toFileUrl: toFileUrl5, toNamespacedPath: toNamespacedPath5 } = path3;
const mod4 = {
    SEP: SEP,
    SEP_PATTERN: SEP_PATTERN,
    win32: mod2,
    posix: mod3,
    basename: basename5,
    delimiter: delimiter5,
    dirname: dirname5,
    extname: extname5,
    format: format5,
    fromFileUrl: fromFileUrl5,
    isAbsolute: isAbsolute5,
    join: join7,
    normalize: normalize7,
    parse: parse5,
    relative: relative5,
    resolve: resolve5,
    toFileUrl: toFileUrl5,
    toNamespacedPath: toNamespacedPath5,
    common,
    globToRegExp,
    isGlob,
    normalizeGlob,
    joinGlobs
};
function existsSync(path, options) {
    try {
        const stat = Deno.statSync(path);
        if (options && (options.isReadable || options.isDirectory || options.isFile)) {
            if (options.isDirectory && options.isFile) {
                throw new TypeError("ExistsOptions.options.isDirectory and ExistsOptions.options.isFile must not be true together.");
            }
            if (options.isDirectory && !stat.isDirectory || options.isFile && !stat.isFile) {
                return false;
            }
            if (options.isReadable) {
                if (stat.mode == null) {
                    return true;
                }
                if (Deno.uid() == stat.uid) {
                    return (stat.mode & 0o400) == 0o400;
                } else if (Deno.gid() == stat.gid) {
                    return (stat.mode & 0o040) == 0o040;
                }
                return (stat.mode & 0o004) == 0o004;
            }
        }
        return true;
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            return false;
        }
        if (error instanceof Deno.errors.PermissionDenied) {
            if (Deno.permissions.querySync({
                name: "read",
                path
            }).state === "granted") {
                return !options?.isReadable;
            }
        }
        throw error;
    }
}
new Deno.errors.AlreadyExists("dest already exists.");
var EOL1;
(function(EOL) {
    EOL["LF"] = "\n";
    EOL["CRLF"] = "\r\n";
})(EOL1 || (EOL1 = {}));
const serviceFileTemplate = `[Unit]
Description={{name}} (Deno Service)

[Service]
ExecStart=/bin/sh -c "{{command}}"
Restart=always
RestartSec=30
Environment={{path}}
{{extraEnvs}}
WorkingDirectory={{workingDirectory}}
{{extraServiceContent}}

[Install]
WantedBy={{wantedByTarget}}
`;
class SystemdService {
    constructor(){}
    async install(config, onlyGenerate) {
        const serviceFileName = `${config.name}.service`;
        const servicePathUser = `${config.home}/.config/systemd/user/${serviceFileName}`;
        const servicePathSystem = `/etc/systemd/system/${serviceFileName}`;
        const servicePath = config.system ? servicePathSystem : servicePathUser;
        if (existsSync(servicePathUser)) {
            console.error(`Service '${config.name}' already exists in '${servicePathUser}'. Exiting.`);
            Deno.exit(1);
        }
        if (existsSync(servicePathSystem)) {
            console.error(`Service '${config.name}' already exists in '${servicePathSystem}'. Exiting.`);
            Deno.exit(1);
        }
        if (!config.system && !onlyGenerate) {
            if (!config.user) {
                throw new Error("Username not found in $USER, must be specified using the --username flag.");
            }
            const enableLingerCommand = new Deno.Command("loginctl", {
                args: [
                    "enable-linger",
                    config.user
                ]
            });
            const enableLinger = enableLingerCommand.spawn();
            const status = await enableLinger.status;
            if (!status.success) {
                throw new Error("Failed to enable linger for user mode.");
            }
        }
        const serviceFileContent = this.generateConfig(config);
        if (onlyGenerate) {
            console.log("\nThis is a dry-run, nothing will be written to disk or installed.");
            console.log("\nPath: ", servicePath);
            console.log("\nConfiguration:\n");
            console.log(serviceFileContent);
        } else if (config.system) {
            const tempFilePath = await Deno.makeTempFile();
            await Deno.writeTextFile(tempFilePath, serviceFileContent);
            console.log("\Service installer do not have (and should not have) root permissions, so the next steps have to be carried out manually.");
            console.log(`\nStep 1: The systemd configuration has been saved to a temporary file, copy this file to the correct location using the following command:`);
            console.log(`\n  sudo cp ${tempFilePath} ${servicePath}`);
            console.log(`\nStep 2: Reload systemd configuration`);
            console.log(`\n  sudo systemctl daemon-reload`);
            console.log(`\nStep 3: Enable the service`);
            console.log(`\n  sudo systemctl enable ${config.name}`);
            console.log(`\nStep 4: Start the service now`);
            console.log(`\n  sudo systemctl start ${config.name}\n`);
        } else {
            const serviceDir = mod4.dirname(servicePath);
            await Deno.mkdir(serviceDir, {
                recursive: true
            });
            await Deno.writeTextFile(servicePath, serviceFileContent);
            const daemonReloadCommand = new Deno.Command("systemctl", {
                args: [
                    config.system ? "" : "--user",
                    "daemon-reload"
                ],
                stderr: "piped",
                stdout: "piped"
            });
            const daemonReload = daemonReloadCommand.spawn();
            const daemonReloadOutput = await daemonReload.output();
            const daemonReloadText = new TextDecoder().decode(daemonReloadOutput.stderr);
            if (!daemonReloadOutput.success) {
                await this.rollback(servicePath, config.system);
                throw new Error("Failed to reload daemon, rolled back any changes. Error: \n" + daemonReloadText);
            }
            const enableServiceCommand = new Deno.Command("systemctl", {
                args: [
                    config.system ? "" : "--user",
                    "enable",
                    config.name
                ],
                stderr: "piped",
                stdout: "piped"
            });
            const enableService = enableServiceCommand.spawn();
            const enableServiceOutput = await enableService.output();
            const enableServiceText = new TextDecoder().decode(enableServiceOutput.stderr);
            if (!enableServiceOutput.success) {
                await this.rollback(servicePath, config.system);
                throw new Error("Failed to enable service, rolled back any changes. Error: \n" + enableServiceText);
            }
            const startServiceCommand = new Deno.Command("systemctl", {
                args: [
                    config.system ? "" : "--user",
                    "start",
                    config.name
                ],
                stderr: "piped",
                stdout: "piped"
            });
            const startService = startServiceCommand.spawn();
            const startServiceOutput = await startService.output();
            const startServiceText = new TextDecoder().decode(startServiceOutput.stderr);
            if (!startServiceOutput.success) {
                await this.rollback(servicePath, config.system);
                throw new Error("Failed to start service, rolled back any changes. Error: \n" + startServiceText);
            }
            console.log(`Service '${config.name}' installed at '${servicePath}' and enabled.`);
        }
    }
    async uninstall(config) {
        const serviceFileName = `${config.name}.service`;
        const servicePathUser = `${config.home}/.config/systemd/user/${serviceFileName}`;
        const servicePathSystem = `/etc/systemd/system/${serviceFileName}`;
        const servicePath = config.system ? servicePathSystem : servicePathUser;
        if (!existsSync(servicePath)) {
            console.error(`Service '${config.name}' does not exist. Exiting.`);
            Deno.exit(1);
        }
        try {
            await Deno.remove(servicePath);
            console.log(`Service '${config.name}' uninstalled successfully.`);
            if (config.system) {
                console.log("Please run the following command as root to reload the systemctl daemon:");
                console.log(`sudo systemctl daemon-reload`);
            } else {
                console.log("Please run the following command to reload the systemctl daemon:");
                console.log(`systemctl --user daemon-reload`);
            }
        } catch (error) {
            console.error(`Failed to uninstall service: Could not remove '${servicePath}'. Error:`, error.message);
        }
    }
    generateConfig(options) {
        const denoPath = Deno.execPath();
        const defaultPath = `PATH=${denoPath}:${options.home}/.deno/bin`;
        const envPath = options.path ? `${defaultPath}:${options.path.join(":")}` : defaultPath;
        const workingDirectory = options.cwd ? options.cwd : Deno.cwd();
        let serviceFileContent = serviceFileTemplate.replace("{{name}}", options.name);
        serviceFileContent = serviceFileContent.replace("{{command}}", options.cmd);
        serviceFileContent = serviceFileContent.replace("{{path}}", envPath);
        serviceFileContent = serviceFileContent.replace("{{workingDirectory}}", workingDirectory);
        if (options.system) {
            serviceFileContent = serviceFileContent.replace("{{extraServiceContent}}", `User=${options.user}`);
            serviceFileContent = serviceFileContent.replace("{{wantedByTarget}}", "multi-user.target");
        } else {
            serviceFileContent = serviceFileContent.replace("{{extraServiceContent}}", "");
            serviceFileContent = serviceFileContent.replace("{{wantedByTarget}}", "default.target");
        }
        if (options.env && options.env.length > 0) {
            let extraEnvs = "";
            for (const env of options.env){
                extraEnvs += `Environment=${env}\n`;
            }
            serviceFileContent = serviceFileContent.replace("{{extraEnvs}}", extraEnvs);
        } else {
            serviceFileContent = serviceFileContent.replace("{{extraEnvs}}", "");
        }
        return serviceFileContent;
    }
    async rollback(servicePath, system) {
        try {
            await Deno.remove(servicePath);
            const daemonReloadCommand = new Deno.Command("systemctl", {
                args: [
                    system ? "" : "--user",
                    "daemon-reload"
                ]
            });
            const daemonReload = daemonReloadCommand.spawn();
            const daemonStatus = await daemonReload.status;
            if (!daemonStatus.success) {
                throw new Error("Failed to reload daemon while rolling back.");
            }
            console.log(`Changes rolled back: Removed '${servicePath}'.`);
        } catch (error) {
            console.error(`Failed to rollback changes: Could not remove '${servicePath}'. Error:`, error.message);
        }
    }
}
const initScriptTemplate = `#!/bin/sh
### BEGIN INIT INFO
# Provides:          {{name}}
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: {{name}} (Deno Service)
# Description:       Start {{name}} service
### END INIT INFO

PATH={{path}}
{{extraEnvs}}

# Change the next line to match your installation
DENO_COMMAND="{{command}}"

case "$1" in
  start)
    echo "Starting {{name}}..."
    $DENO_COMMAND &
    echo $! > /var/run/{{name}}.pid
    ;;
  stop)
    echo "Stopping {{name}}..."
    PID=$(cat /var/run/{{name}}.pid)
    kill $PID
    rm /var/run/{{name}}.pid
    ;;
  restart)
    $0 stop
    $0 start
    ;;
  status)
    if [ -e /var/run/{{name}}.pid ]; then
      echo "{{name}} is running"
    else
      echo "{{name}} is not running"
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac

exit 0
`;
class InitService {
    generateConfig(config) {
        const denoPath = Deno.execPath();
        const command = config.cmd;
        const servicePath = `${config.path?.join(":")}:${denoPath}:${Deno.env.get("HOME")}/.deno/bin`;
        let initScriptContent = initScriptTemplate.replace(/{{name}}/g, config.name);
        initScriptContent = initScriptContent.replace("{{command}}", command);
        initScriptContent = initScriptContent.replace("{{path}}", servicePath);
        if (config.env && config.env.length > 0) {
            let extraEnvs = "";
            for (const env of config.env){
                extraEnvs += `${env}\n`;
            }
            initScriptContent = initScriptContent.replace("{{extraEnvs}}", extraEnvs);
        } else {
            initScriptContent = initScriptContent.replace("{{extraEnvs}}", "");
        }
        return initScriptContent;
    }
    async install(config, onlyGenerate) {
        const initScriptPath = `/etc/init.d/${config.name}`;
        if (existsSync(initScriptPath)) {
            console.error(`Service '${config.name}' already exists in '${initScriptPath}'. Exiting.`);
            Deno.exit(1);
        }
        const initScriptContent = this.generateConfig(config);
        if (onlyGenerate) {
            console.log("\nThis is a dry-run, nothing will be written to disk or installed.");
            console.log("\nPath: ", initScriptPath);
            console.log("\nConfiguration:\n");
            console.log(initScriptContent);
        } else {
            const tempFilePath = await Deno.makeTempFile();
            await Deno.writeTextFile(tempFilePath, initScriptContent);
            console.log("\nThe service installer does not have (and should not have) root permissions, so the next steps have to be carried out manually.");
            console.log(`\nStep 1: The init script has been saved to a temporary file, copy this file to the correct location using the following command:`);
            console.log(`\n  sudo cp ${tempFilePath} ${initScriptPath}`);
            console.log(`\nStep 2: Make the script executable:`);
            console.log(`\n  sudo chmod +x ${initScriptPath}`);
            console.log(`\nStep 3: Enable the service to start at boot:`);
            console.log(`\n  sudo update-rc.d ${config.name} defaults`);
            console.log(`\nStep 4: Start the service now`);
            console.log(`\n  sudo service ${config.name} start`);
        }
    }
    uninstall(config) {
        const initScriptPath = `/etc/init.d/${config.name}`;
        if (!existsSync(initScriptPath)) {
            console.error(`Service '${config.name}' does not exist in '${initScriptPath}'. Exiting.`);
            Deno.exit(1);
        }
        console.log("The uninstaller does not have (and should not have) root permissions, so the next steps have to be carried out manually.");
        console.log(`\nStep 1: Stop the service (if it's running):`);
        console.log(`\n  sudo service ${config.name} stop`);
        console.log(`\nStep 2: Disable the service from starting at boot:`);
        console.log(`\n  sudo update-rc.d -f ${config.name} remove`);
        console.log(`\nStep 3: Remove the init script:`);
        console.log(`\n  sudo rm ${initScriptPath}`);
    }
}
const upstartFileTemplate = `# {{name}} (Deno Service)

description "{{name}} Deno Service"
author "Service user"

start on (filesystem and net-device-up IFACE!=lo)
stop on runlevel [!2345]

respawn
respawn limit 10 5

env PATH={{path}}
{{extraEnvs}}

# Change the next line to match your service installation
env SERVICE_COMMAND="{{command}}"

exec $SERVICE_COMMAND
`;
class UpstartService {
    generateConfig(config) {
        const denoPath = Deno.execPath();
        const defaultPath = `${denoPath}:${Deno.env.get("HOME")}/.deno/bin`;
        const envPath = config.path ? `${defaultPath}:${config.path.join(":")}` : defaultPath;
        let upstartFileContent = upstartFileTemplate.replace(/{{name}}/g, config.name);
        upstartFileContent = upstartFileContent.replace("{{command}}", config.cmd);
        upstartFileContent = upstartFileContent.replace("{{path}}", envPath);
        if (config.env && config.env.length > 0) {
            let extraEnvs = "";
            for (const env of config.env){
                extraEnvs += `env ${env}\n`;
            }
            upstartFileContent = upstartFileContent.replace("{{extraEnvs}}", extraEnvs);
        } else {
            upstartFileContent = upstartFileContent.replace("{{extraEnvs}}", "");
        }
        return upstartFileContent;
    }
    async install(config, onlyGenerate) {
        const upstartFilePath = `/etc/init/${config.name}.conf`;
        if (existsSync(upstartFilePath)) {
            console.error(`Service '${config.name}' already exists in '${upstartFilePath}'. Exiting.`);
            Deno.exit(1);
        }
        const upstartFileContent = this.generateConfig(config);
        if (onlyGenerate) {
            console.log("\nThis is a dry-run, nothing will be written to disk or installed.");
            console.log("\nPath: ", upstartFilePath);
            console.log("\nConfiguration:\n");
            console.log(upstartFileContent);
        } else {
            const tempFilePath = await Deno.makeTempFile();
            await Deno.writeTextFile(tempFilePath, upstartFileContent);
            console.log("\Service installer do not have (and should not have) root permissions, so the next steps have to be carried out manually.");
            console.log(`\nStep 1: The upstart configuration has been saved to a temporary file, copy this file to the correct location using the following command:`);
            console.log(`\n  sudo cp ${tempFilePath} ${upstartFilePath}`);
            console.log(`\nStep 2: Start the service now`);
            console.log(`\n  sudo start ${config.name}\n`);
        }
    }
    async uninstall(config) {
        const upstartFilePath = `/etc/init/${config.name}.conf`;
        if (!existsSync(upstartFilePath)) {
            console.error(`Service '${config.name}' does not exist. Exiting.`);
            Deno.exit(1);
        }
        try {
            await Deno.remove(upstartFilePath);
            console.log(`Service '${config.name}' uninstalled successfully.`);
            console.log("Please run the following command as root to stop the service (if it's running):");
            console.log(`sudo stop ${config.name}`);
        } catch (error) {
            console.error(`Failed to uninstall service: Could not remove '${upstartFilePath}'. Error:`, error.message);
        }
    }
}
const plistTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>{{name}}</string>
    <key>ProgramArguments</key>
    <array>
{{command}}    </array>
    <key>EnvironmentVariables</key>
    <dict>
      <key>PATH</key>
      <string>{{path}}</string>
{{extraEnvs}}    </dict>
    <key>WorkingDirectory</key>
    <string>{{workingDirectory}}</string>
    <key>KeepAlive</key>
    <true/>
  </dict>
</plist>
`;
class LaunchdService {
    generateConfig(options) {
        const denoPath = Deno.execPath();
        const commandArgs = options.cmd.split(" ");
        const servicePath = `${options.path?.join(":")}:${denoPath}:${options.home}/.deno/bin`;
        const workingDirectory = options.cwd ? options.cwd : Deno.cwd();
        let plistContent = plistTemplate.replace(/{{name}}/g, options.name);
        plistContent = plistContent.replace(/{{path}}/g, servicePath);
        plistContent = plistContent.replace(/{{workingDirectory}}/g, workingDirectory);
        let programArguments = "";
        for (const arg of commandArgs){
            programArguments += `      <string>${arg}</string>\n`;
        }
        plistContent = plistContent.replace("{{command}}", programArguments);
        if (options.env && options.env.length > 0) {
            let extraEnvs = "";
            for (const env of options.env){
                const envSplit = env.split("=");
                extraEnvs += `      <key>${envSplit[0]}</key>\n      <string>${envSplit[1]}</string>\n`;
            }
            plistContent = plistContent.replace("{{extraEnvs}}", extraEnvs);
        } else {
            plistContent = plistContent.replace("{{extraEnvs}}", "");
        }
        return plistContent;
    }
    async install(config, onlyGenerate) {
        const plistFileName = `${config.name}.plist`;
        const plistPathUser = `${config.home}/Library/LaunchAgents/${plistFileName}`;
        const plistPathSystem = `/Library/LaunchDaemons/${plistFileName}`;
        const plistPath = config.system ? plistPathSystem : plistPathUser;
        if (existsSync(plistPathUser) || existsSync(plistPathSystem)) {
            console.error(`Service '${config.name}' already exists. Exiting.`);
            Deno.exit(1);
        }
        const plistContent = this.generateConfig(config);
        if (onlyGenerate) {
            console.log("\nThis is a dry-run, nothing will be written to disk or installed.");
            console.log("\nPath: ", plistPath);
            console.log("\nConfiguration:\n");
            console.log(plistContent);
        } else {
            const plistDir = mod4.dirname(plistPath);
            await Deno.mkdir(plistDir, {
                recursive: true
            });
            await Deno.writeTextFile(plistPath, plistContent);
            console.log(`Service '${config.name}' installed at '${plistPath}'.`);
            if (config.system) {
                console.log("Please run the following command as root to load the service:");
                console.log(`sudo launchctl load ${plistPath}`);
            } else {
                console.log("Please run the following command to load the service:");
                console.log(`launchctl load ${plistPath}`);
            }
        }
    }
    async rollback(plistPath) {
        try {
            await Deno.remove(plistPath);
            console.log(`Changes rolled back: Removed '${plistPath}'.`);
        } catch (error) {
            console.error(`Failed to rollback changes: Could not remove '${plistPath}'. Error: ${error.message}`);
        }
    }
    async uninstall(config) {
        const plistFileName = `${config.name}.plist`;
        const plistPathUser = `${config.home}/Library/LaunchAgents/${plistFileName}`;
        const plistPathSystem = `/Library/LaunchDaemons/${plistFileName}`;
        const plistPath = config.system ? plistPathSystem : plistPathUser;
        if (!existsSync(plistPath)) {
            console.error(`Service '${config.name}' does not exist. Exiting.`);
            Deno.exit(1);
        }
        try {
            await Deno.remove(plistPath);
            console.log(`Service '${config.name}' uninstalled successfully.`);
            if (config.system) {
                console.log("Please run the following command as root to unload the service (if it's running):");
                console.log(`sudo launchctl unload ${plistPath}`);
            } else {
                console.log("Please run the following command to unload the service (if it's running):");
                console.log(`launchctl unload ${plistPath}`);
            }
        } catch (error) {
            console.error(`Failed to uninstall service: Could not remove '${plistPath}'. Error:`, error.message);
        }
    }
}
class WindowsService {
    constructor(){}
    async install(config, onlyGenerate) {
        const batchFileName = `${config.name}.bat`;
        const serviceBatchPath = `${config.home}/.service/${batchFileName}`;
        if (existsSync(serviceBatchPath)) {
            console.error(`Service '${config.name}' already exists in '${serviceBatchPath}'. Exiting.`);
            Deno.exit(1);
        }
        const batchFileContent = this.generateConfig(config);
        if (onlyGenerate) {
            console.log("\nThis is a dry-run, nothing will be written to disk or installed.");
            console.log("\nPath: ", serviceBatchPath);
            console.log("\nConfiguration:\n");
            console.log(batchFileContent);
        } else {
            const serviceDirectory = `${config.home}/.service/`;
            if (!existsSync(serviceDirectory)) {
                await Deno.mkdir(serviceDirectory, {
                    recursive: true
                });
            }
            await Deno.writeTextFile(serviceBatchPath, batchFileContent);
            const scArgs = `create ${config.name} binPath="cmd.exe /C ${serviceBatchPath}" start= auto DisplayName= "${config.name}" obj= LocalSystem`;
            const psArgs = [
                "-Command",
                "Start-Process",
                "sc.exe",
                "-ArgumentList",
                `'${scArgs}'`,
                "-Verb",
                "RunAs"
            ];
            const installServiceCommand = new Deno.Command("powershell.exe", {
                args: psArgs,
                stderr: "piped",
                stdout: "piped"
            });
            const installService = installServiceCommand.spawn();
            installService.ref();
            const installServiceOutput = await installService.output();
            const installServiceText = new TextDecoder().decode(installServiceOutput.stderr);
            if (!installServiceOutput.success) {
                await this.rollback(serviceBatchPath);
                throw new Error("Failed to install service. Error: \n" + installServiceText);
            }
            console.log(`Service '${config.name}' installed at '${serviceBatchPath}' and enabled.`);
        }
    }
    async uninstall(config) {
        const batchFileName = `${config.name}.bat`;
        const serviceBatchPath = `${config.home}/.service/${batchFileName}`;
        if (!existsSync(serviceBatchPath)) {
            console.error(`Service '${config.name}' does not exist. Exiting.`);
            Deno.exit(1);
        }
        const scArgs = `delete ${config.name}`;
        const psArgs = [
            "-Command",
            "Start-Process",
            "sc.exe",
            "-ArgumentList",
            `'${scArgs}'`,
            "-Verb",
            "RunAs"
        ];
        const uninstallServiceCommand = new Deno.Command("powershell.exe", {
            args: psArgs,
            stderr: "piped",
            stdout: "piped"
        });
        const uninstallService = uninstallServiceCommand.spawn();
        uninstallService.ref();
        const uninstallServiceOutput = await uninstallService.output();
        const uninstallServiceText = new TextDecoder().decode(uninstallServiceOutput.stderr);
        if (!uninstallServiceOutput.success) {
            await this.rollback(serviceBatchPath);
            throw new Error("Failed to uninstall service. Error: \n" + uninstallServiceText);
        }
        try {
            await Deno.remove(serviceBatchPath);
            console.log(`Service '${config.name}' uninstalled successfully.`);
        } catch (error) {
            console.error(`Failed to uninstall service: Could not remove '${serviceBatchPath}'. Error:`, error.message);
        }
    }
    generateConfig(options) {
        const denoPath = Deno.execPath();
        const defaultPath = `%PATH%;${denoPath};${options.home}\\.deno\\bin`;
        const envPath = options.path ? `${defaultPath};${options.path.join(";")}` : defaultPath;
        const workingDirectory = options.cwd ? options.cwd : Deno.cwd();
        let batchFileContent = `@echo off\n`;
        batchFileContent += `cd "${workingDirectory}"\n`;
        batchFileContent += `set "PATH=${envPath}"\n`;
        if (options.env && options.env.length > 0) {
            for (const env of options.env){
                batchFileContent += `set "${env}"\n`;
            }
        }
        batchFileContent += `"${denoPath}" run -A --allow-ffi --unstable https://deno.land/x/windows_service@1.0.11/run.ts --serviceName ${options.name} -- ${options.cmd}\n`;
        return batchFileContent;
    }
    async rollback(serviceBatchPath) {
        try {
            await Deno.remove(serviceBatchPath);
            console.log(`Changes rolled back: Removed '${serviceBatchPath}'.`);
        } catch (error) {
            console.error(`Failed to rollback changes: Could not remove '${serviceBatchPath}'. Error:`, error.message);
        }
    }
}
class ServiceManager {
    managers = new Map();
    register(initSystem, manager) {
        this.managers.set(initSystem, manager);
    }
    async installService(initSystem, options, onlyGenerate) {
        const manager = this.managers.get(initSystem);
        if (!manager) {
            throw new Error(`Unsupported init system: ${initSystem}`);
        }
        await manager.install(options, onlyGenerate);
    }
    async generateConfig(initSystem, options) {
        const manager = this.managers.get(initSystem);
        if (!manager) {
            throw new Error(`Unsupported init system: ${initSystem}`);
        }
        return await manager.generateConfig(options);
    }
    async uninstallService(initSystem, options) {
        const manager = this.managers.get(initSystem);
        if (!manager) {
            throw new Error(`Unsupported init system: ${initSystem}`);
        }
        await manager.uninstall(options);
    }
}
const serviceManager = new ServiceManager();
serviceManager.register("systemd", new SystemdService());
serviceManager.register("sysvinit", new InitService());
serviceManager.register("docker-init", new InitService());
serviceManager.register("upstart", new UpstartService());
serviceManager.register("launchd", new LaunchdService());
serviceManager.register("windows", new WindowsService());
const { Deno: Deno2 } = globalThis;
const noColor = typeof Deno2?.noColor === "boolean" ? Deno2.noColor : true;
let enabled = !noColor;
function setColorEnabled(value1) {
    if (noColor) {
        return;
    }
    enabled = value1;
}
function getColorEnabled() {
    return enabled;
}
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
function reset(str) {
    return run(str, code([
        0
    ], 0));
}
function bold(str) {
    return run(str, code([
        1
    ], 22));
}
function dim(str) {
    return run(str, code([
        2
    ], 22));
}
function italic(str) {
    return run(str, code([
        3
    ], 23));
}
function underline(str) {
    return run(str, code([
        4
    ], 24));
}
function inverse(str) {
    return run(str, code([
        7
    ], 27));
}
function hidden(str) {
    return run(str, code([
        8
    ], 28));
}
function strikethrough(str) {
    return run(str, code([
        9
    ], 29));
}
function black(str) {
    return run(str, code([
        30
    ], 39));
}
function red(str) {
    return run(str, code([
        31
    ], 39));
}
function green(str) {
    return run(str, code([
        32
    ], 39));
}
function yellow(str) {
    return run(str, code([
        33
    ], 39));
}
function blue(str) {
    return run(str, code([
        34
    ], 39));
}
function magenta(str) {
    return run(str, code([
        35
    ], 39));
}
function cyan(str) {
    return run(str, code([
        36
    ], 39));
}
function white(str) {
    return run(str, code([
        37
    ], 39));
}
function gray(str) {
    return brightBlack(str);
}
function brightBlack(str) {
    return run(str, code([
        90
    ], 39));
}
function brightRed(str) {
    return run(str, code([
        91
    ], 39));
}
function brightGreen(str) {
    return run(str, code([
        92
    ], 39));
}
function brightYellow(str) {
    return run(str, code([
        93
    ], 39));
}
function brightBlue(str) {
    return run(str, code([
        94
    ], 39));
}
function brightMagenta(str) {
    return run(str, code([
        95
    ], 39));
}
function brightCyan(str) {
    return run(str, code([
        96
    ], 39));
}
function brightWhite(str) {
    return run(str, code([
        97
    ], 39));
}
function bgBlack(str) {
    return run(str, code([
        40
    ], 49));
}
function bgRed(str) {
    return run(str, code([
        41
    ], 49));
}
function bgGreen(str) {
    return run(str, code([
        42
    ], 49));
}
function bgYellow(str) {
    return run(str, code([
        43
    ], 49));
}
function bgBlue(str) {
    return run(str, code([
        44
    ], 49));
}
function bgMagenta(str) {
    return run(str, code([
        45
    ], 49));
}
function bgCyan(str) {
    return run(str, code([
        46
    ], 49));
}
function bgWhite(str) {
    return run(str, code([
        47
    ], 49));
}
function bgBrightBlack(str) {
    return run(str, code([
        100
    ], 49));
}
function bgBrightRed(str) {
    return run(str, code([
        101
    ], 49));
}
function bgBrightGreen(str) {
    return run(str, code([
        102
    ], 49));
}
function bgBrightYellow(str) {
    return run(str, code([
        103
    ], 49));
}
function bgBrightBlue(str) {
    return run(str, code([
        104
    ], 49));
}
function bgBrightMagenta(str) {
    return run(str, code([
        105
    ], 49));
}
function bgBrightCyan(str) {
    return run(str, code([
        106
    ], 49));
}
function bgBrightWhite(str) {
    return run(str, code([
        107
    ], 49));
}
function clampAndTruncate(n, max = 255, min = 0) {
    return Math.trunc(Math.max(Math.min(n, max), min));
}
function rgb8(str, color) {
    return run(str, code([
        38,
        5,
        clampAndTruncate(color)
    ], 39));
}
function bgRgb8(str, color) {
    return run(str, code([
        48,
        5,
        clampAndTruncate(color)
    ], 49));
}
function rgb24(str, color) {
    if (typeof color === "number") {
        return run(str, code([
            38,
            2,
            color >> 16 & 0xff,
            color >> 8 & 0xff,
            color & 0xff
        ], 39));
    }
    return run(str, code([
        38,
        2,
        clampAndTruncate(color.r),
        clampAndTruncate(color.g),
        clampAndTruncate(color.b)
    ], 39));
}
function bgRgb24(str, color) {
    if (typeof color === "number") {
        return run(str, code([
            48,
            2,
            color >> 16 & 0xff,
            color >> 8 & 0xff,
            color & 0xff
        ], 49));
    }
    return run(str, code([
        48,
        2,
        clampAndTruncate(color.r),
        clampAndTruncate(color.g),
        clampAndTruncate(color.b)
    ], 49));
}
const ANSI_PATTERN = new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"
].join("|"), "g");
function stripColor(string) {
    return string.replace(ANSI_PATTERN, "");
}
const mod5 = {
    setColorEnabled: setColorEnabled,
    getColorEnabled: getColorEnabled,
    reset: reset,
    bold: bold,
    dim: dim,
    italic: italic,
    underline: underline,
    inverse: inverse,
    hidden: hidden,
    strikethrough: strikethrough,
    black: black,
    red: red,
    green: green,
    yellow: yellow,
    blue: blue,
    magenta: magenta,
    cyan: cyan,
    white: white,
    gray: gray,
    brightBlack: brightBlack,
    brightRed: brightRed,
    brightGreen: brightGreen,
    brightYellow: brightYellow,
    brightBlue: brightBlue,
    brightMagenta: brightMagenta,
    brightCyan: brightCyan,
    brightWhite: brightWhite,
    bgBlack: bgBlack,
    bgRed: bgRed,
    bgGreen: bgGreen,
    bgYellow: bgYellow,
    bgBlue: bgBlue,
    bgMagenta: bgMagenta,
    bgCyan: bgCyan,
    bgWhite: bgWhite,
    bgBrightBlack: bgBrightBlack,
    bgBrightRed: bgBrightRed,
    bgBrightGreen: bgBrightGreen,
    bgBrightYellow: bgBrightYellow,
    bgBrightBlue: bgBrightBlue,
    bgBrightMagenta: bgBrightMagenta,
    bgBrightCyan: bgBrightCyan,
    bgBrightWhite: bgBrightWhite,
    rgb8: rgb8,
    bgRgb8: bgRgb8,
    rgb24: rgb24,
    bgRgb24: bgRgb24,
    stripColor: stripColor
};
const osType2 = (()=>{
    const { Deno: Deno1 } = globalThis;
    if (typeof Deno1?.build?.os === "string") {
        return Deno1.build.os;
    }
    const { navigator } = globalThis;
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
function lastPathSegment2(path, isSep, start = 0) {
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
function stripTrailingSeparators2(segment, isSep) {
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
function stripSuffix2(name, suffix) {
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
class DenoStdInternalError1 extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert2(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError1(msg);
    }
}
const sep4 = "\\";
const delimiter6 = ";";
function resolve6(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        const { Deno: Deno1 } = globalThis;
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
    return stripTrailingSeparators2(path.slice(0, end), isPosixPathSeparator2);
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
    const lastSegment = lastPathSegment2(path, isPathSeparator2, start);
    const strippedSegment = stripTrailingSeparators2(lastSegment, isPathSeparator2);
    return suffix ? stripSuffix2(strippedSegment, suffix) : strippedSegment;
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
function parse6(path) {
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
const mod6 = {
    sep: sep4,
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
    parse: parse6,
    fromFileUrl: fromFileUrl6,
    toFileUrl: toFileUrl6
};
const sep5 = "/";
const delimiter7 = ":";
function resolve7(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            const { Deno: Deno1 } = globalThis;
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
    return stripTrailingSeparators2(path.slice(0, end), isPosixPathSeparator2);
}
function basename7(path, suffix = "") {
    assertPath2(path);
    if (path.length === 0) return path;
    if (typeof suffix !== "string") {
        throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
    }
    const lastSegment = lastPathSegment2(path, isPosixPathSeparator2);
    const strippedSegment = stripTrailingSeparators2(lastSegment, isPosixPathSeparator2);
    return suffix ? stripSuffix2(strippedSegment, suffix) : strippedSegment;
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
function parse7(path) {
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
        ret.dir = stripTrailingSeparators2(path.slice(0, startPart - 1), isPosixPathSeparator2);
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
const mod7 = {
    sep: sep5,
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
    parse: parse7,
    fromFileUrl: fromFileUrl7,
    toFileUrl: toFileUrl7
};
const SEP1 = isWindows2 ? "\\" : "/";
const SEP_PATTERN1 = isWindows2 ? /[\\/]+/ : /\/+/;
function common1(paths, sep = SEP1) {
    const [first = "", ...remaining] = paths;
    if (first === "" || remaining.length === 0) {
        return first.substring(0, first.lastIndexOf(sep) + 1);
    }
    const parts = first.split(sep);
    let endOfPrefix = parts.length;
    for (const path of remaining){
        const compare = path.split(sep);
        for(let i = 0; i < endOfPrefix; i++){
            if (compare[i] !== parts[i]) {
                endOfPrefix = i;
            }
        }
        if (endOfPrefix === 0) {
            return "";
        }
    }
    const prefix = parts.slice(0, endOfPrefix).join(sep);
    return prefix.endsWith(sep) ? prefix : `${prefix}${sep}`;
}
const path4 = isWindows2 ? mod6 : mod7;
const { join: join10, normalize: normalize10 } = path4;
const regExpEscapeChars1 = [
    "!",
    "$",
    "(",
    ")",
    "*",
    "+",
    ".",
    "=",
    "?",
    "[",
    "\\",
    "^",
    "{",
    "|"
];
const rangeEscapeChars1 = [
    "-",
    "\\",
    "]"
];
function globToRegExp1(glob, { extended = true, globstar: globstarOption = true, os = osType2, caseInsensitive = false } = {}) {
    if (glob == "") {
        return /(?!)/;
    }
    const sep = os == "windows" ? "(?:\\\\|/)+" : "/+";
    const sepMaybe = os == "windows" ? "(?:\\\\|/)*" : "/*";
    const seps = os == "windows" ? [
        "\\",
        "/"
    ] : [
        "/"
    ];
    const globstar = os == "windows" ? "(?:[^\\\\/]*(?:\\\\|/|$)+)*" : "(?:[^/]*(?:/|$)+)*";
    const wildcard = os == "windows" ? "[^\\\\/]*" : "[^/]*";
    const escapePrefix = os == "windows" ? "`" : "\\";
    let newLength = glob.length;
    for(; newLength > 1 && seps.includes(glob[newLength - 1]); newLength--);
    glob = glob.slice(0, newLength);
    let regExpString = "";
    for(let j = 0; j < glob.length;){
        let segment = "";
        const groupStack = [];
        let inRange = false;
        let inEscape = false;
        let endsWithSep = false;
        let i = j;
        for(; i < glob.length && !seps.includes(glob[i]); i++){
            if (inEscape) {
                inEscape = false;
                const escapeChars = inRange ? rangeEscapeChars1 : regExpEscapeChars1;
                segment += escapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
                continue;
            }
            if (glob[i] == escapePrefix) {
                inEscape = true;
                continue;
            }
            if (glob[i] == "[") {
                if (!inRange) {
                    inRange = true;
                    segment += "[";
                    if (glob[i + 1] == "!") {
                        i++;
                        segment += "^";
                    } else if (glob[i + 1] == "^") {
                        i++;
                        segment += "\\^";
                    }
                    continue;
                } else if (glob[i + 1] == ":") {
                    let k = i + 1;
                    let value1 = "";
                    while(glob[k + 1] != null && glob[k + 1] != ":"){
                        value1 += glob[k + 1];
                        k++;
                    }
                    if (glob[k + 1] == ":" && glob[k + 2] == "]") {
                        i = k + 2;
                        if (value1 == "alnum") segment += "\\dA-Za-z";
                        else if (value1 == "alpha") segment += "A-Za-z";
                        else if (value1 == "ascii") segment += "\x00-\x7F";
                        else if (value1 == "blank") segment += "\t ";
                        else if (value1 == "cntrl") segment += "\x00-\x1F\x7F";
                        else if (value1 == "digit") segment += "\\d";
                        else if (value1 == "graph") segment += "\x21-\x7E";
                        else if (value1 == "lower") segment += "a-z";
                        else if (value1 == "print") segment += "\x20-\x7E";
                        else if (value1 == "punct") {
                            segment += "!\"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^_‘{|}~";
                        } else if (value1 == "space") segment += "\\s\v";
                        else if (value1 == "upper") segment += "A-Z";
                        else if (value1 == "word") segment += "\\w";
                        else if (value1 == "xdigit") segment += "\\dA-Fa-f";
                        continue;
                    }
                }
            }
            if (glob[i] == "]" && inRange) {
                inRange = false;
                segment += "]";
                continue;
            }
            if (inRange) {
                if (glob[i] == "\\") {
                    segment += `\\\\`;
                } else {
                    segment += glob[i];
                }
                continue;
            }
            if (glob[i] == ")" && groupStack.length > 0 && groupStack[groupStack.length - 1] != "BRACE") {
                segment += ")";
                const type = groupStack.pop();
                if (type == "!") {
                    segment += wildcard;
                } else if (type != "@") {
                    segment += type;
                }
                continue;
            }
            if (glob[i] == "|" && groupStack.length > 0 && groupStack[groupStack.length - 1] != "BRACE") {
                segment += "|";
                continue;
            }
            if (glob[i] == "+" && extended && glob[i + 1] == "(") {
                i++;
                groupStack.push("+");
                segment += "(?:";
                continue;
            }
            if (glob[i] == "@" && extended && glob[i + 1] == "(") {
                i++;
                groupStack.push("@");
                segment += "(?:";
                continue;
            }
            if (glob[i] == "?") {
                if (extended && glob[i + 1] == "(") {
                    i++;
                    groupStack.push("?");
                    segment += "(?:";
                } else {
                    segment += ".";
                }
                continue;
            }
            if (glob[i] == "!" && extended && glob[i + 1] == "(") {
                i++;
                groupStack.push("!");
                segment += "(?!";
                continue;
            }
            if (glob[i] == "{") {
                groupStack.push("BRACE");
                segment += "(?:";
                continue;
            }
            if (glob[i] == "}" && groupStack[groupStack.length - 1] == "BRACE") {
                groupStack.pop();
                segment += ")";
                continue;
            }
            if (glob[i] == "," && groupStack[groupStack.length - 1] == "BRACE") {
                segment += "|";
                continue;
            }
            if (glob[i] == "*") {
                if (extended && glob[i + 1] == "(") {
                    i++;
                    groupStack.push("*");
                    segment += "(?:";
                } else {
                    const prevChar = glob[i - 1];
                    let numStars = 1;
                    while(glob[i + 1] == "*"){
                        i++;
                        numStars++;
                    }
                    const nextChar = glob[i + 1];
                    if (globstarOption && numStars == 2 && [
                        ...seps,
                        undefined
                    ].includes(prevChar) && [
                        ...seps,
                        undefined
                    ].includes(nextChar)) {
                        segment += globstar;
                        endsWithSep = true;
                    } else {
                        segment += wildcard;
                    }
                }
                continue;
            }
            segment += regExpEscapeChars1.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
        }
        if (groupStack.length > 0 || inRange || inEscape) {
            segment = "";
            for (const c of glob.slice(j, i)){
                segment += regExpEscapeChars1.includes(c) ? `\\${c}` : c;
                endsWithSep = false;
            }
        }
        regExpString += segment;
        if (!endsWithSep) {
            regExpString += i < glob.length ? sep : sepMaybe;
            endsWithSep = true;
        }
        while(seps.includes(glob[i]))i++;
        if (!(i > j)) {
            throw new Error("Assertion failure: i > j (potential infinite loop)");
        }
        j = i;
    }
    regExpString = `^${regExpString}$`;
    return new RegExp(regExpString, caseInsensitive ? "i" : "");
}
function isGlob1(str) {
    const chars = {
        "{": "}",
        "(": ")",
        "[": "]"
    };
    const regex = /\\(.)|(^!|\*|\?|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\))/;
    if (str === "") {
        return false;
    }
    let match;
    while(match = regex.exec(str)){
        if (match[2]) return true;
        let idx = match.index + match[0].length;
        const open = match[1];
        const close = open ? chars[open] : null;
        if (open && close) {
            const n = str.indexOf(close, idx);
            if (n !== -1) {
                idx = n + 1;
            }
        }
        str = str.slice(idx);
    }
    return false;
}
function normalizeGlob1(glob, { globstar = false } = {}) {
    if (glob.match(/\0/g)) {
        throw new Error(`Glob contains invalid characters: "${glob}"`);
    }
    if (!globstar) {
        return normalize10(glob);
    }
    const s = SEP_PATTERN1.source;
    const badParentPattern = new RegExp(`(?<=(${s}|^)\\*\\*${s})\\.\\.(?=${s}|$)`, "g");
    return normalize10(glob.replace(badParentPattern, "\0")).replace(/\0/g, "..");
}
function joinGlobs1(globs, { extended = true, globstar = false } = {}) {
    if (!globstar || globs.length == 0) {
        return join10(...globs);
    }
    if (globs.length === 0) return ".";
    let joined;
    for (const glob of globs){
        const path = glob;
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `${SEP1}${path}`;
        }
    }
    if (!joined) return ".";
    return normalizeGlob1(joined, {
        extended,
        globstar
    });
}
const path5 = isWindows2 ? mod6 : mod7;
const { basename: basename8, delimiter: delimiter8, dirname: dirname8, extname: extname8, format: format8, fromFileUrl: fromFileUrl8, isAbsolute: isAbsolute8, join: join11, normalize: normalize11, parse: parse8, relative: relative8, resolve: resolve8, sep: sep6, toFileUrl: toFileUrl8, toNamespacedPath: toNamespacedPath8 } = path5;
const mod8 = {
    SEP: SEP1,
    SEP_PATTERN: SEP_PATTERN1,
    win32: mod6,
    posix: mod7,
    basename: basename8,
    delimiter: delimiter8,
    dirname: dirname8,
    extname: extname8,
    format: format8,
    fromFileUrl: fromFileUrl8,
    isAbsolute: isAbsolute8,
    join: join11,
    normalize: normalize11,
    parse: parse8,
    relative: relative8,
    resolve: resolve8,
    sep: sep6,
    toFileUrl: toFileUrl8,
    toNamespacedPath: toNamespacedPath8,
    common: common1,
    globToRegExp: globToRegExp1,
    isGlob: isGlob1,
    normalizeGlob: normalizeGlob1,
    joinGlobs: joinGlobs1
};
function isSubdir(src, dest, sep = sep6) {
    if (src === dest) {
        return false;
    }
    src = toPathString(src);
    const srcArray = src.split(sep);
    dest = toPathString(dest);
    const destArray = dest.split(sep);
    return srcArray.every((current, i)=>destArray[i] === current);
}
function getFileInfoType(fileInfo) {
    return fileInfo.isFile ? "file" : fileInfo.isDirectory ? "dir" : fileInfo.isSymlink ? "symlink" : undefined;
}
function createWalkEntrySync(path) {
    path = toPathString(path);
    path = normalize11(path);
    const name = basename8(path);
    const info = Deno.statSync(path);
    return {
        path,
        name,
        isFile: info.isFile,
        isDirectory: info.isDirectory,
        isSymlink: info.isSymlink
    };
}
async function createWalkEntry(path) {
    path = toPathString(path);
    path = normalize11(path);
    const name = basename8(path);
    const info = await Deno.stat(path);
    return {
        path,
        name,
        isFile: info.isFile,
        isDirectory: info.isDirectory,
        isSymlink: info.isSymlink
    };
}
function toPathString(path) {
    return path instanceof URL ? fromFileUrl8(path) : path;
}
async function emptyDir(dir) {
    try {
        const items = [];
        for await (const dirEntry of Deno.readDir(dir)){
            items.push(dirEntry);
        }
        while(items.length){
            const item = items.shift();
            if (item && item.name) {
                const filepath = join11(toPathString(dir), item.name);
                await Deno.remove(filepath, {
                    recursive: true
                });
            }
        }
    } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
            throw err;
        }
        await Deno.mkdir(dir, {
            recursive: true
        });
    }
}
function emptyDirSync(dir) {
    try {
        const items = [
            ...Deno.readDirSync(dir)
        ];
        while(items.length){
            const item = items.shift();
            if (item && item.name) {
                const filepath = join11(toPathString(dir), item.name);
                Deno.removeSync(filepath, {
                    recursive: true
                });
            }
        }
    } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
            throw err;
        }
        Deno.mkdirSync(dir, {
            recursive: true
        });
    }
}
async function ensureDir(dir) {
    try {
        await Deno.mkdir(dir, {
            recursive: true
        });
    } catch (err) {
        if (!(err instanceof Deno.errors.AlreadyExists)) {
            throw err;
        }
        const fileInfo = await Deno.lstat(dir);
        if (!fileInfo.isDirectory) {
            throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
        }
    }
}
function ensureDirSync(dir) {
    try {
        Deno.mkdirSync(dir, {
            recursive: true
        });
    } catch (err) {
        if (!(err instanceof Deno.errors.AlreadyExists)) {
            throw err;
        }
        const fileInfo = Deno.lstatSync(dir);
        if (!fileInfo.isDirectory) {
            throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
        }
    }
}
async function ensureFile(filePath) {
    try {
        const stat = await Deno.lstat(filePath);
        if (!stat.isFile) {
            throw new Error(`Ensure path exists, expected 'file', got '${getFileInfoType(stat)}'`);
        }
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            await ensureDir(dirname8(toPathString(filePath)));
            await Deno.writeFile(filePath, new Uint8Array());
            return;
        }
        throw err;
    }
}
function ensureFileSync(filePath) {
    try {
        const stat = Deno.lstatSync(filePath);
        if (!stat.isFile) {
            throw new Error(`Ensure path exists, expected 'file', got '${getFileInfoType(stat)}'`);
        }
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            ensureDirSync(dirname8(toPathString(filePath)));
            Deno.writeFileSync(filePath, new Uint8Array());
            return;
        }
        throw err;
    }
}
async function ensureLink(src, dest) {
    dest = toPathString(dest);
    await ensureDir(dirname8(dest));
    await Deno.link(toPathString(src), dest);
}
function ensureLinkSync(src, dest) {
    dest = toPathString(dest);
    ensureDirSync(dirname8(dest));
    Deno.linkSync(toPathString(src), dest);
}
function resolveSymlinkTarget(target, linkName) {
    if (typeof target != "string") return target;
    if (typeof linkName == "string") {
        return resolve8(dirname8(linkName), target);
    } else {
        return new URL(target, linkName);
    }
}
async function ensureSymlink(target, linkName) {
    const targetRealPath = resolveSymlinkTarget(target, linkName);
    const srcStatInfo = await Deno.lstat(targetRealPath);
    const srcFilePathType = getFileInfoType(srcStatInfo);
    await ensureDir(dirname8(toPathString(linkName)));
    const options = isWindows2 ? {
        type: srcFilePathType === "dir" ? "dir" : "file"
    } : undefined;
    try {
        await Deno.symlink(target, linkName, options);
    } catch (error) {
        if (!(error instanceof Deno.errors.AlreadyExists)) {
            throw error;
        }
    }
}
function ensureSymlinkSync(target, linkName) {
    const targetRealPath = resolveSymlinkTarget(target, linkName);
    const srcStatInfo = Deno.lstatSync(targetRealPath);
    const srcFilePathType = getFileInfoType(srcStatInfo);
    ensureDirSync(dirname8(toPathString(linkName)));
    const options = isWindows2 ? {
        type: srcFilePathType === "dir" ? "dir" : "file"
    } : undefined;
    try {
        Deno.symlinkSync(target, linkName, options);
    } catch (error) {
        if (!(error instanceof Deno.errors.AlreadyExists)) {
            throw error;
        }
    }
}
async function exists(path, options) {
    try {
        const stat = await Deno.stat(path);
        if (options && (options.isReadable || options.isDirectory || options.isFile)) {
            if (options.isDirectory && options.isFile) {
                throw new TypeError("ExistsOptions.options.isDirectory and ExistsOptions.options.isFile must not be true together.");
            }
            if (options.isDirectory && !stat.isDirectory || options.isFile && !stat.isFile) {
                return false;
            }
            if (options.isReadable) {
                if (stat.mode == null) {
                    return true;
                }
                if (Deno.uid() == stat.uid) {
                    return (stat.mode & 0o400) == 0o400;
                } else if (Deno.gid() == stat.gid) {
                    return (stat.mode & 0o040) == 0o040;
                }
                return (stat.mode & 0o004) == 0o004;
            }
        }
        return true;
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            return false;
        }
        if (error instanceof Deno.errors.PermissionDenied) {
            if ((await Deno.permissions.query({
                name: "read",
                path
            })).state === "granted") {
                return !options?.isReadable;
            }
        }
        throw error;
    }
}
function existsSync1(path, options) {
    try {
        const stat = Deno.statSync(path);
        if (options && (options.isReadable || options.isDirectory || options.isFile)) {
            if (options.isDirectory && options.isFile) {
                throw new TypeError("ExistsOptions.options.isDirectory and ExistsOptions.options.isFile must not be true together.");
            }
            if (options.isDirectory && !stat.isDirectory || options.isFile && !stat.isFile) {
                return false;
            }
            if (options.isReadable) {
                if (stat.mode == null) {
                    return true;
                }
                if (Deno.uid() == stat.uid) {
                    return (stat.mode & 0o400) == 0o400;
                } else if (Deno.gid() == stat.gid) {
                    return (stat.mode & 0o040) == 0o040;
                }
                return (stat.mode & 0o004) == 0o004;
            }
        }
        return true;
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            return false;
        }
        if (error instanceof Deno.errors.PermissionDenied) {
            if (Deno.permissions.querySync({
                name: "read",
                path
            }).state === "granted") {
                return !options?.isReadable;
            }
        }
        throw error;
    }
}
class WalkError extends Error {
    cause;
    name = "WalkError";
    path;
    constructor(cause, path){
        super(`${cause instanceof Error ? cause.message : cause} for path "${path}"`);
        this.path = path;
        this.cause = cause;
    }
}
function include(path, exts, match, skip) {
    if (exts && !exts.some((ext)=>path.endsWith(ext))) {
        return false;
    }
    if (match && !match.some((pattern)=>!!path.match(pattern))) {
        return false;
    }
    if (skip && skip.some((pattern)=>!!path.match(pattern))) {
        return false;
    }
    return true;
}
function wrapErrorWithPath(err, root) {
    if (err instanceof WalkError) return err;
    return new WalkError(err, root);
}
async function* walk(root, { maxDepth = Infinity, includeFiles = true, includeDirs = true, followSymlinks = false, exts = undefined, match = undefined, skip = undefined } = {}) {
    if (maxDepth < 0) {
        return;
    }
    root = toPathString(root);
    if (includeDirs && include(root, exts, match, skip)) {
        yield await createWalkEntry(root);
    }
    if (maxDepth < 1 || !include(root, undefined, undefined, skip)) {
        return;
    }
    try {
        for await (const entry of Deno.readDir(root)){
            assert2(entry.name != null);
            let path = join11(root, entry.name);
            let { isSymlink, isDirectory } = entry;
            if (isSymlink) {
                if (!followSymlinks) continue;
                path = await Deno.realPath(path);
                ({ isSymlink, isDirectory } = await Deno.lstat(path));
            }
            if (isSymlink || isDirectory) {
                yield* walk(path, {
                    maxDepth: maxDepth - 1,
                    includeFiles,
                    includeDirs,
                    followSymlinks,
                    exts,
                    match,
                    skip
                });
            } else if (includeFiles && include(path, exts, match, skip)) {
                yield {
                    path,
                    ...entry
                };
            }
        }
    } catch (err) {
        throw wrapErrorWithPath(err, normalize11(root));
    }
}
function* walkSync(root, { maxDepth = Infinity, includeFiles = true, includeDirs = true, followSymlinks = false, exts = undefined, match = undefined, skip = undefined } = {}) {
    root = toPathString(root);
    if (maxDepth < 0) {
        return;
    }
    if (includeDirs && include(root, exts, match, skip)) {
        yield createWalkEntrySync(root);
    }
    if (maxDepth < 1 || !include(root, undefined, undefined, skip)) {
        return;
    }
    let entries;
    try {
        entries = Deno.readDirSync(root);
    } catch (err) {
        throw wrapErrorWithPath(err, normalize11(root));
    }
    for (const entry of entries){
        assert2(entry.name != null);
        let path = join11(root, entry.name);
        let { isSymlink, isDirectory } = entry;
        if (isSymlink) {
            if (!followSymlinks) continue;
            path = Deno.realPathSync(path);
            ({ isSymlink, isDirectory } = Deno.lstatSync(path));
        }
        if (isSymlink || isDirectory) {
            yield* walkSync(path, {
                maxDepth: maxDepth - 1,
                includeFiles,
                includeDirs,
                followSymlinks,
                exts,
                match,
                skip
            });
        } else if (includeFiles && include(path, exts, match, skip)) {
            yield {
                path,
                ...entry
            };
        }
    }
}
function split(path) {
    const s = SEP_PATTERN1.source;
    const segments = path.replace(new RegExp(`^${s}|${s}$`, "g"), "").split(SEP_PATTERN1);
    const isAbsolute_ = isAbsolute8(path);
    return {
        segments,
        isAbsolute: isAbsolute_,
        hasTrailingSep: !!path.match(new RegExp(`${s}$`)),
        winRoot: isWindows2 && isAbsolute_ ? segments.shift() : undefined
    };
}
function throwUnlessNotFound(error) {
    if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
    }
}
function comparePath(a, b) {
    if (a.path < b.path) return -1;
    if (a.path > b.path) return 1;
    return 0;
}
async function* expandGlob(glob, { root = Deno.cwd(), exclude = [], includeDirs = true, extended = true, globstar = true, caseInsensitive, followSymlinks } = {}) {
    const globOptions = {
        extended,
        globstar,
        caseInsensitive
    };
    const absRoot = resolve8(root);
    const resolveFromRoot = (path)=>resolve8(absRoot, path);
    const excludePatterns = exclude.map(resolveFromRoot).map((s)=>globToRegExp1(s, globOptions));
    const shouldInclude = (path)=>!excludePatterns.some((p)=>!!path.match(p));
    const { segments, isAbsolute: isGlobAbsolute, hasTrailingSep, winRoot } = split(toPathString(glob));
    let fixedRoot = isGlobAbsolute ? winRoot != undefined ? winRoot : "/" : absRoot;
    while(segments.length > 0 && !isGlob1(segments[0])){
        const seg = segments.shift();
        assert2(seg != null);
        fixedRoot = joinGlobs1([
            fixedRoot,
            seg
        ], globOptions);
    }
    let fixedRootInfo;
    try {
        fixedRootInfo = await createWalkEntry(fixedRoot);
    } catch (error) {
        return throwUnlessNotFound(error);
    }
    async function* advanceMatch(walkInfo, globSegment) {
        if (!walkInfo.isDirectory) {
            return;
        } else if (globSegment == "..") {
            const parentPath = joinGlobs1([
                walkInfo.path,
                ".."
            ], globOptions);
            try {
                if (shouldInclude(parentPath)) {
                    return yield await createWalkEntry(parentPath);
                }
            } catch (error) {
                throwUnlessNotFound(error);
            }
            return;
        } else if (globSegment == "**") {
            return yield* walk(walkInfo.path, {
                skip: excludePatterns,
                maxDepth: globstar ? Infinity : 1,
                followSymlinks
            });
        }
        const globPattern = globToRegExp1(globSegment, globOptions);
        for await (const walkEntry of walk(walkInfo.path, {
            maxDepth: 1,
            skip: excludePatterns,
            followSymlinks
        })){
            if (walkEntry.path != walkInfo.path && walkEntry.name.match(globPattern)) {
                yield walkEntry;
            }
        }
    }
    let currentMatches = [
        fixedRootInfo
    ];
    for (const segment of segments){
        const nextMatchMap = new Map();
        await Promise.all(currentMatches.map(async (currentMatch)=>{
            for await (const nextMatch of advanceMatch(currentMatch, segment)){
                nextMatchMap.set(nextMatch.path, nextMatch);
            }
        }));
        currentMatches = [
            ...nextMatchMap.values()
        ].sort(comparePath);
    }
    if (hasTrailingSep) {
        currentMatches = currentMatches.filter((entry)=>entry.isDirectory);
    }
    if (!includeDirs) {
        currentMatches = currentMatches.filter((entry)=>!entry.isDirectory);
    }
    yield* currentMatches;
}
function* expandGlobSync(glob, { root = Deno.cwd(), exclude = [], includeDirs = true, extended = true, globstar = true, caseInsensitive, followSymlinks } = {}) {
    const globOptions = {
        extended,
        globstar,
        caseInsensitive
    };
    const absRoot = resolve8(root);
    const resolveFromRoot = (path)=>resolve8(absRoot, path);
    const excludePatterns = exclude.map(resolveFromRoot).map((s)=>globToRegExp1(s, globOptions));
    const shouldInclude = (path)=>!excludePatterns.some((p)=>!!path.match(p));
    const { segments, isAbsolute: isGlobAbsolute, hasTrailingSep, winRoot } = split(toPathString(glob));
    let fixedRoot = isGlobAbsolute ? winRoot != undefined ? winRoot : "/" : absRoot;
    while(segments.length > 0 && !isGlob1(segments[0])){
        const seg = segments.shift();
        assert2(seg != null);
        fixedRoot = joinGlobs1([
            fixedRoot,
            seg
        ], globOptions);
    }
    let fixedRootInfo;
    try {
        fixedRootInfo = createWalkEntrySync(fixedRoot);
    } catch (error) {
        return throwUnlessNotFound(error);
    }
    function* advanceMatch(walkInfo, globSegment) {
        if (!walkInfo.isDirectory) {
            return;
        } else if (globSegment == "..") {
            const parentPath = joinGlobs1([
                walkInfo.path,
                ".."
            ], globOptions);
            try {
                if (shouldInclude(parentPath)) {
                    return yield createWalkEntrySync(parentPath);
                }
            } catch (error) {
                throwUnlessNotFound(error);
            }
            return;
        } else if (globSegment == "**") {
            return yield* walkSync(walkInfo.path, {
                skip: excludePatterns,
                maxDepth: globstar ? Infinity : 1,
                followSymlinks
            });
        }
        const globPattern = globToRegExp1(globSegment, globOptions);
        for (const walkEntry of walkSync(walkInfo.path, {
            maxDepth: 1,
            skip: excludePatterns,
            followSymlinks
        })){
            if (walkEntry.path != walkInfo.path && walkEntry.name.match(globPattern)) {
                yield walkEntry;
            }
        }
    }
    let currentMatches = [
        fixedRootInfo
    ];
    for (const segment of segments){
        const nextMatchMap = new Map();
        for (const currentMatch of currentMatches){
            for (const nextMatch of advanceMatch(currentMatch, segment)){
                nextMatchMap.set(nextMatch.path, nextMatch);
            }
        }
        currentMatches = [
            ...nextMatchMap.values()
        ].sort(comparePath);
    }
    if (hasTrailingSep) {
        currentMatches = currentMatches.filter((entry)=>entry.isDirectory);
    }
    if (!includeDirs) {
        currentMatches = currentMatches.filter((entry)=>!entry.isDirectory);
    }
    yield* currentMatches;
}
const EXISTS_ERROR = new Deno.errors.AlreadyExists("dest already exists.");
async function move(src, dest, { overwrite = false } = {}) {
    const srcStat = await Deno.stat(src);
    if (srcStat.isDirectory && isSubdir(src, dest)) {
        throw new Error(`Cannot move '${src}' to a subdirectory of itself, '${dest}'.`);
    }
    if (overwrite) {
        try {
            await Deno.remove(dest, {
                recursive: true
            });
        } catch (error) {
            if (!(error instanceof Deno.errors.NotFound)) {
                throw error;
            }
        }
    } else {
        try {
            await Deno.lstat(dest);
            return Promise.reject(EXISTS_ERROR);
        } catch  {}
    }
    await Deno.rename(src, dest);
}
function moveSync(src, dest, { overwrite = false } = {}) {
    const srcStat = Deno.statSync(src);
    if (srcStat.isDirectory && isSubdir(src, dest)) {
        throw new Error(`Cannot move '${src}' to a subdirectory of itself, '${dest}'.`);
    }
    if (overwrite) {
        try {
            Deno.removeSync(dest, {
                recursive: true
            });
        } catch (error) {
            if (!(error instanceof Deno.errors.NotFound)) {
                throw error;
            }
        }
    } else {
        try {
            Deno.lstatSync(dest);
            throw EXISTS_ERROR;
        } catch (error) {
            if (error === EXISTS_ERROR) {
                throw error;
            }
        }
    }
    Deno.renameSync(src, dest);
}
async function ensureValidCopy(src, dest, options) {
    let destStat;
    try {
        destStat = await Deno.lstat(dest);
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return;
        }
        throw err;
    }
    if (options.isFolder && !destStat.isDirectory) {
        throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
    }
    if (!options.overwrite) {
        throw new Deno.errors.AlreadyExists(`'${dest}' already exists.`);
    }
    return destStat;
}
function ensureValidCopySync(src, dest, options) {
    let destStat;
    try {
        destStat = Deno.lstatSync(dest);
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return;
        }
        throw err;
    }
    if (options.isFolder && !destStat.isDirectory) {
        throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
    }
    if (!options.overwrite) {
        throw new Deno.errors.AlreadyExists(`'${dest}' already exists.`);
    }
    return destStat;
}
async function copyFile(src, dest, options) {
    await ensureValidCopy(src, dest, options);
    await Deno.copyFile(src, dest);
    if (options.preserveTimestamps) {
        const statInfo = await Deno.stat(src);
        assert2(statInfo.atime instanceof Date, `statInfo.atime is unavailable`);
        assert2(statInfo.mtime instanceof Date, `statInfo.mtime is unavailable`);
        await Deno.utime(dest, statInfo.atime, statInfo.mtime);
    }
}
function copyFileSync(src, dest, options) {
    ensureValidCopySync(src, dest, options);
    Deno.copyFileSync(src, dest);
    if (options.preserveTimestamps) {
        const statInfo = Deno.statSync(src);
        assert2(statInfo.atime instanceof Date, `statInfo.atime is unavailable`);
        assert2(statInfo.mtime instanceof Date, `statInfo.mtime is unavailable`);
        Deno.utimeSync(dest, statInfo.atime, statInfo.mtime);
    }
}
async function copySymLink(src, dest, options) {
    await ensureValidCopy(src, dest, options);
    const originSrcFilePath = await Deno.readLink(src);
    const type = getFileInfoType(await Deno.lstat(src));
    if (isWindows2) {
        await Deno.symlink(originSrcFilePath, dest, {
            type: type === "dir" ? "dir" : "file"
        });
    } else {
        await Deno.symlink(originSrcFilePath, dest);
    }
    if (options.preserveTimestamps) {
        const statInfo = await Deno.lstat(src);
        assert2(statInfo.atime instanceof Date, `statInfo.atime is unavailable`);
        assert2(statInfo.mtime instanceof Date, `statInfo.mtime is unavailable`);
        await Deno.utime(dest, statInfo.atime, statInfo.mtime);
    }
}
function copySymlinkSync(src, dest, options) {
    ensureValidCopySync(src, dest, options);
    const originSrcFilePath = Deno.readLinkSync(src);
    const type = getFileInfoType(Deno.lstatSync(src));
    if (isWindows2) {
        Deno.symlinkSync(originSrcFilePath, dest, {
            type: type === "dir" ? "dir" : "file"
        });
    } else {
        Deno.symlinkSync(originSrcFilePath, dest);
    }
    if (options.preserveTimestamps) {
        const statInfo = Deno.lstatSync(src);
        assert2(statInfo.atime instanceof Date, `statInfo.atime is unavailable`);
        assert2(statInfo.mtime instanceof Date, `statInfo.mtime is unavailable`);
        Deno.utimeSync(dest, statInfo.atime, statInfo.mtime);
    }
}
async function copyDir(src, dest, options) {
    const destStat = await ensureValidCopy(src, dest, {
        ...options,
        isFolder: true
    });
    if (!destStat) {
        await ensureDir(dest);
    }
    if (options.preserveTimestamps) {
        const srcStatInfo = await Deno.stat(src);
        assert2(srcStatInfo.atime instanceof Date, `statInfo.atime is unavailable`);
        assert2(srcStatInfo.mtime instanceof Date, `statInfo.mtime is unavailable`);
        await Deno.utime(dest, srcStatInfo.atime, srcStatInfo.mtime);
    }
    src = toPathString(src);
    dest = toPathString(dest);
    for await (const entry of Deno.readDir(src)){
        const srcPath = join11(src, entry.name);
        const destPath = join11(dest, basename8(srcPath));
        if (entry.isSymlink) {
            await copySymLink(srcPath, destPath, options);
        } else if (entry.isDirectory) {
            await copyDir(srcPath, destPath, options);
        } else if (entry.isFile) {
            await copyFile(srcPath, destPath, options);
        }
    }
}
function copyDirSync(src, dest, options) {
    const destStat = ensureValidCopySync(src, dest, {
        ...options,
        isFolder: true
    });
    if (!destStat) {
        ensureDirSync(dest);
    }
    if (options.preserveTimestamps) {
        const srcStatInfo = Deno.statSync(src);
        assert2(srcStatInfo.atime instanceof Date, `statInfo.atime is unavailable`);
        assert2(srcStatInfo.mtime instanceof Date, `statInfo.mtime is unavailable`);
        Deno.utimeSync(dest, srcStatInfo.atime, srcStatInfo.mtime);
    }
    src = toPathString(src);
    dest = toPathString(dest);
    for (const entry of Deno.readDirSync(src)){
        assert2(entry.name != null, "file.name must be set");
        const srcPath = join11(src, entry.name);
        const destPath = join11(dest, basename8(srcPath));
        if (entry.isSymlink) {
            copySymlinkSync(srcPath, destPath, options);
        } else if (entry.isDirectory) {
            copyDirSync(srcPath, destPath, options);
        } else if (entry.isFile) {
            copyFileSync(srcPath, destPath, options);
        }
    }
}
async function copy1(src, dest, options = {}) {
    src = resolve8(toPathString(src));
    dest = resolve8(toPathString(dest));
    if (src === dest) {
        throw new Error("Source and destination cannot be the same.");
    }
    const srcStat = await Deno.lstat(src);
    if (srcStat.isDirectory && isSubdir(src, dest)) {
        throw new Error(`Cannot copy '${src}' to a subdirectory of itself, '${dest}'.`);
    }
    if (srcStat.isSymlink) {
        await copySymLink(src, dest, options);
    } else if (srcStat.isDirectory) {
        await copyDir(src, dest, options);
    } else if (srcStat.isFile) {
        await copyFile(src, dest, options);
    }
}
function copySync(src, dest, options = {}) {
    src = resolve8(toPathString(src));
    dest = resolve8(toPathString(dest));
    if (src === dest) {
        throw new Error("Source and destination cannot be the same.");
    }
    const srcStat = Deno.lstatSync(src);
    if (srcStat.isDirectory && isSubdir(src, dest)) {
        throw new Error(`Cannot copy '${src}' to a subdirectory of itself, '${dest}'.`);
    }
    if (srcStat.isSymlink) {
        copySymlinkSync(src, dest, options);
    } else if (srcStat.isDirectory) {
        copyDirSync(src, dest, options);
    } else if (srcStat.isFile) {
        copyFileSync(src, dest, options);
    }
}
var EOL2;
(function(EOL) {
    EOL["LF"] = "\n";
    EOL["CRLF"] = "\r\n";
})(EOL2 || (EOL2 = {}));
const regDetect = /(?:\r?\n)/g;
function detect(content) {
    const d = content.match(regDetect);
    if (!d || d.length === 0) {
        return null;
    }
    const hasCRLF = d.some((x)=>x === EOL2.CRLF);
    return hasCRLF ? EOL2.CRLF : EOL2.LF;
}
function format9(content, eol) {
    return content.replace(regDetect, eol);
}
const mod9 = {
    emptyDir,
    emptyDirSync,
    ensureDir,
    ensureDirSync,
    ensureFile,
    ensureFileSync,
    ensureLink,
    ensureLinkSync,
    ensureSymlink,
    ensureSymlinkSync,
    exists,
    existsSync: existsSync1,
    expandGlob,
    expandGlobSync,
    WalkError,
    walk,
    walkSync,
    move,
    moveSync,
    copy: copy1,
    copySync,
    EOL: EOL2,
    detect,
    format: format9
};
function copy2(src, dst, off = 0) {
    off = Math.max(0, Math.min(off, dst.byteLength));
    const dstBytesAvailable = dst.byteLength - off;
    if (src.byteLength > dstBytesAvailable) {
        src = src.subarray(0, dstBytesAvailable);
    }
    dst.set(src, off);
    return src.byteLength;
}
const MIN_READ = 32 * 1024;
const MAX_SIZE1 = 2 ** 32 - 2;
class Buffer1 {
    #buf;
    #off = 0;
    constructor(ab){
        this.#buf = ab === undefined ? new Uint8Array(0) : new Uint8Array(ab);
    }
    bytes(options = {
        copy: true
    }) {
        if (options.copy === false) return this.#buf.subarray(this.#off);
        return this.#buf.slice(this.#off);
    }
    empty() {
        return this.#buf.byteLength <= this.#off;
    }
    get length() {
        return this.#buf.byteLength - this.#off;
    }
    get capacity() {
        return this.#buf.buffer.byteLength;
    }
    truncate(n) {
        if (n === 0) {
            this.reset();
            return;
        }
        if (n < 0 || n > this.length) {
            throw Error("bytes.Buffer: truncation out of range");
        }
        this.#reslice(this.#off + n);
    }
    reset() {
        this.#reslice(0);
        this.#off = 0;
    }
    #tryGrowByReslice(n) {
        const l = this.#buf.byteLength;
        if (n <= this.capacity - l) {
            this.#reslice(l + n);
            return l;
        }
        return -1;
    }
    #reslice(len) {
        assert2(len <= this.#buf.buffer.byteLength);
        this.#buf = new Uint8Array(this.#buf.buffer, 0, len);
    }
    readSync(p) {
        if (this.empty()) {
            this.reset();
            if (p.byteLength === 0) {
                return 0;
            }
            return null;
        }
        const nread = copy2(this.#buf.subarray(this.#off), p);
        this.#off += nread;
        return nread;
    }
    read(p) {
        const rr = this.readSync(p);
        return Promise.resolve(rr);
    }
    writeSync(p) {
        const m = this.#grow(p.byteLength);
        return copy2(p, this.#buf, m);
    }
    write(p) {
        const n = this.writeSync(p);
        return Promise.resolve(n);
    }
    #grow(n) {
        const m = this.length;
        if (m === 0 && this.#off !== 0) {
            this.reset();
        }
        const i = this.#tryGrowByReslice(n);
        if (i >= 0) {
            return i;
        }
        const c = this.capacity;
        if (n <= Math.floor(c / 2) - m) {
            copy2(this.#buf.subarray(this.#off), this.#buf);
        } else if (c + n > MAX_SIZE1) {
            throw new Error("The buffer cannot be grown beyond the maximum size.");
        } else {
            const buf = new Uint8Array(Math.min(2 * c + n, MAX_SIZE1));
            copy2(this.#buf.subarray(this.#off), buf);
            this.#buf = buf;
        }
        this.#off = 0;
        this.#reslice(Math.min(m + n, MAX_SIZE1));
        return m;
    }
    grow(n) {
        if (n < 0) {
            throw Error("Buffer.grow: negative count");
        }
        const m = this.#grow(n);
        this.#reslice(m);
    }
    async readFrom(r) {
        let n = 0;
        const tmp = new Uint8Array(MIN_READ);
        while(true){
            const shouldGrow = this.capacity - this.length < MIN_READ;
            const buf = shouldGrow ? tmp : new Uint8Array(this.#buf.buffer, this.length);
            const nread = await r.read(buf);
            if (nread === null) {
                return n;
            }
            if (shouldGrow) this.writeSync(buf.subarray(0, nread));
            else this.#reslice(this.length + nread);
            n += nread;
        }
    }
    readFromSync(r) {
        let n = 0;
        const tmp = new Uint8Array(MIN_READ);
        while(true){
            const shouldGrow = this.capacity - this.length < MIN_READ;
            const buf = shouldGrow ? tmp : new Uint8Array(this.#buf.buffer, this.length);
            const nread = r.readSync(buf);
            if (nread === null) {
                return n;
            }
            if (shouldGrow) this.writeSync(buf.subarray(0, nread));
            else this.#reslice(this.length + nread);
            n += nread;
        }
    }
}
const MIN_BUF_SIZE = 16;
const CR = "\r".charCodeAt(0);
const LF = "\n".charCodeAt(0);
class BufferFullError extends Error {
    partial;
    name;
    constructor(partial){
        super("Buffer full");
        this.partial = partial;
        this.name = "BufferFullError";
    }
}
class PartialReadError extends Error {
    name = "PartialReadError";
    partial;
    constructor(){
        super("Encountered UnexpectedEof, data only partially read");
    }
}
class BufReader {
    #buf;
    #rd;
    #r = 0;
    #w = 0;
    #eof = false;
    static create(r, size = 4096) {
        return r instanceof BufReader ? r : new BufReader(r, size);
    }
    constructor(rd, size = 4096){
        if (size < 16) {
            size = MIN_BUF_SIZE;
        }
        this.#reset(new Uint8Array(size), rd);
    }
    size() {
        return this.#buf.byteLength;
    }
    buffered() {
        return this.#w - this.#r;
    }
    #fill = async ()=>{
        if (this.#r > 0) {
            this.#buf.copyWithin(0, this.#r, this.#w);
            this.#w -= this.#r;
            this.#r = 0;
        }
        if (this.#w >= this.#buf.byteLength) {
            throw Error("bufio: tried to fill full buffer");
        }
        for(let i = 100; i > 0; i--){
            const rr = await this.#rd.read(this.#buf.subarray(this.#w));
            if (rr === null) {
                this.#eof = true;
                return;
            }
            assert2(rr >= 0, "negative read");
            this.#w += rr;
            if (rr > 0) {
                return;
            }
        }
        throw new Error(`No progress after ${100} read() calls`);
    };
    reset(r) {
        this.#reset(this.#buf, r);
    }
    #reset = (buf, rd)=>{
        this.#buf = buf;
        this.#rd = rd;
        this.#eof = false;
    };
    async read(p) {
        let rr = p.byteLength;
        if (p.byteLength === 0) return rr;
        if (this.#r === this.#w) {
            if (p.byteLength >= this.#buf.byteLength) {
                const rr = await this.#rd.read(p);
                const nread = rr ?? 0;
                assert2(nread >= 0, "negative read");
                return rr;
            }
            this.#r = 0;
            this.#w = 0;
            rr = await this.#rd.read(this.#buf);
            if (rr === 0 || rr === null) return rr;
            assert2(rr >= 0, "negative read");
            this.#w += rr;
        }
        const copied = copy2(this.#buf.subarray(this.#r, this.#w), p, 0);
        this.#r += copied;
        return copied;
    }
    async readFull(p) {
        let bytesRead = 0;
        while(bytesRead < p.length){
            try {
                const rr = await this.read(p.subarray(bytesRead));
                if (rr === null) {
                    if (bytesRead === 0) {
                        return null;
                    } else {
                        throw new PartialReadError();
                    }
                }
                bytesRead += rr;
            } catch (err) {
                if (err instanceof PartialReadError) {
                    err.partial = p.subarray(0, bytesRead);
                } else if (err instanceof Error) {
                    const e = new PartialReadError();
                    e.partial = p.subarray(0, bytesRead);
                    e.stack = err.stack;
                    e.message = err.message;
                    e.cause = err.cause;
                    throw err;
                }
                throw err;
            }
        }
        return p;
    }
    async readByte() {
        while(this.#r === this.#w){
            if (this.#eof) return null;
            await this.#fill();
        }
        const c = this.#buf[this.#r];
        this.#r++;
        return c;
    }
    async readString(delim) {
        if (delim.length !== 1) {
            throw new Error("Delimiter should be a single character");
        }
        const buffer = await this.readSlice(delim.charCodeAt(0));
        if (buffer === null) return null;
        return new TextDecoder().decode(buffer);
    }
    async readLine() {
        let line = null;
        try {
            line = await this.readSlice(LF);
        } catch (err) {
            let partial;
            if (err instanceof PartialReadError) {
                partial = err.partial;
                assert2(partial instanceof Uint8Array, "bufio: caught error from `readSlice()` without `partial` property");
            }
            if (!(err instanceof BufferFullError)) {
                throw err;
            }
            partial = err.partial;
            if (!this.#eof && partial && partial.byteLength > 0 && partial[partial.byteLength - 1] === CR) {
                assert2(this.#r > 0, "bufio: tried to rewind past start of buffer");
                this.#r--;
                partial = partial.subarray(0, partial.byteLength - 1);
            }
            if (partial) {
                return {
                    line: partial,
                    more: !this.#eof
                };
            }
        }
        if (line === null) {
            return null;
        }
        if (line.byteLength === 0) {
            return {
                line,
                more: false
            };
        }
        if (line[line.byteLength - 1] == LF) {
            let drop = 1;
            if (line.byteLength > 1 && line[line.byteLength - 2] === CR) {
                drop = 2;
            }
            line = line.subarray(0, line.byteLength - drop);
        }
        return {
            line,
            more: false
        };
    }
    async readSlice(delim) {
        let s = 0;
        let slice;
        while(true){
            let i = this.#buf.subarray(this.#r + s, this.#w).indexOf(delim);
            if (i >= 0) {
                i += s;
                slice = this.#buf.subarray(this.#r, this.#r + i + 1);
                this.#r += i + 1;
                break;
            }
            if (this.#eof) {
                if (this.#r === this.#w) {
                    return null;
                }
                slice = this.#buf.subarray(this.#r, this.#w);
                this.#r = this.#w;
                break;
            }
            if (this.buffered() >= this.#buf.byteLength) {
                this.#r = this.#w;
                const oldbuf = this.#buf;
                const newbuf = this.#buf.slice(0);
                this.#buf = newbuf;
                throw new BufferFullError(oldbuf);
            }
            s = this.#w - this.#r;
            try {
                await this.#fill();
            } catch (err) {
                if (err instanceof PartialReadError) {
                    err.partial = slice;
                } else if (err instanceof Error) {
                    const e = new PartialReadError();
                    e.partial = slice;
                    e.stack = err.stack;
                    e.message = err.message;
                    e.cause = err.cause;
                    throw err;
                }
                throw err;
            }
        }
        return slice;
    }
    async peek(n) {
        if (n < 0) {
            throw Error("negative count");
        }
        let avail = this.#w - this.#r;
        while(avail < n && avail < this.#buf.byteLength && !this.#eof){
            try {
                await this.#fill();
            } catch (err) {
                if (err instanceof PartialReadError) {
                    err.partial = this.#buf.subarray(this.#r, this.#w);
                } else if (err instanceof Error) {
                    const e = new PartialReadError();
                    e.partial = this.#buf.subarray(this.#r, this.#w);
                    e.stack = err.stack;
                    e.message = err.message;
                    e.cause = err.cause;
                    throw err;
                }
                throw err;
            }
            avail = this.#w - this.#r;
        }
        if (avail === 0 && this.#eof) {
            return null;
        } else if (avail < n && this.#eof) {
            return this.#buf.subarray(this.#r, this.#r + avail);
        } else if (avail < n) {
            throw new BufferFullError(this.#buf.subarray(this.#r, this.#w));
        }
        return this.#buf.subarray(this.#r, this.#r + n);
    }
}
async function writeAll(w, arr) {
    let nwritten = 0;
    while(nwritten < arr.length){
        nwritten += await w.write(arr.subarray(nwritten));
    }
}
function writeAllSync(w, arr) {
    let nwritten = 0;
    while(nwritten < arr.length){
        nwritten += w.writeSync(arr.subarray(nwritten));
    }
}
function readerFromStreamReader(streamReader) {
    const buffer = new Buffer1();
    return {
        async read (p) {
            if (buffer.empty()) {
                const res = await streamReader.read();
                if (res.done) {
                    return null;
                }
                await writeAll(buffer, res.value);
            }
            return buffer.read(p);
        }
    };
}
function dataDir() {
    switch(Deno.build.os){
        case "linux":
            {
                const xdg = Deno.env.get("XDG_DATA_HOME");
                if (xdg) return xdg;
                const home = Deno.env.get("HOME");
                if (home) return `${home}/.local/share`;
                break;
            }
        case "darwin":
            {
                const home = Deno.env.get("HOME");
                if (home) return `${home}/Library/Application Support`;
                break;
            }
        case "windows":
            return Deno.env.get("LOCALAPPDATA") ?? null;
    }
    return null;
}
function noop(...args) {}
function createWeakMap() {
    if (typeof WeakMap !== "undefined") {
        return new WeakMap();
    } else {
        return fakeSetOrMap();
    }
}
function fakeSetOrMap() {
    return {
        add: noop,
        delete: noop,
        get: noop,
        set: noop,
        has (k) {
            return false;
        }
    };
}
const hop = Object.prototype.hasOwnProperty;
const has = function(obj, prop) {
    return hop.call(obj, prop);
};
function extend(target, source) {
    for(const prop in source){
        if (has(source, prop)) {
            target[prop] = source[prop];
        }
    }
    return target;
}
const reLeadingNewline = /^[ \t]*(?:\r\n|\r|\n)/;
const reTrailingNewline = /(?:\r\n|\r|\n)[ \t]*$/;
const reStartsWithNewlineOrIsEmpty = /^(?:[\r\n]|$)/;
const reDetectIndentation = /(?:\r\n|\r|\n)([ \t]*)(?:[^ \t\r\n]|$)/;
const reOnlyWhitespaceWithAtLeastOneNewline = /^[ \t]*[\r\n][ \t\r\n]*$/;
function _outdentArray(strings, firstInterpolatedValueSetsIndentationLevel, options) {
    let indentationLevel = 0;
    const match = strings[0].match(reDetectIndentation);
    if (match) {
        indentationLevel = match[1].length;
    }
    const reSource = `(\\r\\n|\\r|\\n).{0,${indentationLevel}}`;
    const reMatchIndent = new RegExp(reSource, "g");
    if (firstInterpolatedValueSetsIndentationLevel) {
        strings = strings.slice(1);
    }
    const { newline, trimLeadingNewline, trimTrailingNewline } = options;
    const normalizeNewlines = typeof newline === "string";
    const l = strings.length;
    const outdentedStrings = strings.map((v, i)=>{
        v = v.replace(reMatchIndent, "$1");
        if (i === 0 && trimLeadingNewline) {
            v = v.replace(reLeadingNewline, "");
        }
        if (i === l - 1 && trimTrailingNewline) {
            v = v.replace(reTrailingNewline, "");
        }
        if (normalizeNewlines) {
            v = v.replace(/\r\n|\n|\r/g, (_)=>newline);
        }
        return v;
    });
    return outdentedStrings;
}
function concatStringsAndValues(strings, values) {
    let ret = "";
    for(let i = 0, l = strings.length; i < l; i++){
        ret += strings[i];
        if (i < l - 1) {
            ret += values[i];
        }
    }
    return ret;
}
function isTemplateStringsArray(v) {
    return has(v, "raw") && has(v, "length");
}
function createInstance(options) {
    const arrayAutoIndentCache = createWeakMap();
    const arrayFirstInterpSetsIndentCache = createWeakMap();
    function outdent(stringsOrOptions, ...values) {
        if (isTemplateStringsArray(stringsOrOptions)) {
            const strings = stringsOrOptions;
            const firstInterpolatedValueSetsIndentationLevel = (values[0] === outdent || values[0] === defaultOutdent) && reOnlyWhitespaceWithAtLeastOneNewline.test(strings[0]) && reStartsWithNewlineOrIsEmpty.test(strings[1]);
            const cache = firstInterpolatedValueSetsIndentationLevel ? arrayFirstInterpSetsIndentCache : arrayAutoIndentCache;
            let renderedArray = cache.get(strings);
            if (!renderedArray) {
                renderedArray = _outdentArray(strings, firstInterpolatedValueSetsIndentationLevel, options);
                cache.set(strings, renderedArray);
            }
            if (values.length === 0) {
                return renderedArray[0];
            }
            const rendered = concatStringsAndValues(renderedArray, firstInterpolatedValueSetsIndentationLevel ? values.slice(1) : values);
            return rendered;
        } else {
            return createInstance(extend(extend({}, options), stringsOrOptions || {}));
        }
    }
    const fullOutdent = extend(outdent, {
        string (str) {
            return _outdentArray([
                str
            ], false, options)[0];
        }
    });
    return fullOutdent;
}
const defaultOutdent = createInstance({
    trimLeadingNewline: true,
    trimTrailingNewline: true
});
if (typeof module !== "undefined") {
    try {
        module.exports = defaultOutdent;
        Object.defineProperty(defaultOutdent, "__esModule", {
            value: true
        });
        defaultOutdent.default = defaultOutdent;
        defaultOutdent.outdent = defaultOutdent;
    } catch (e) {}
}
class RealEnvironment {
    env(key) {
        return Deno.env.get(key);
    }
    stat(path) {
        return Deno.stat(path);
    }
    statSync(path) {
        return Deno.statSync(path);
    }
    get os() {
        return Deno.build.os;
    }
}
async function which(command, environment = new RealEnvironment()) {
    const systemInfo = getSystemInfo(command, environment);
    if (systemInfo == null) {
        return undefined;
    }
    for (const pathItem of systemInfo.pathItems){
        const filePath = pathItem + command;
        if (systemInfo.pathExts) {
            for (const pathExt of systemInfo.pathExts){
                const filePath = pathItem + command + pathExt;
                if (await pathMatches(environment, filePath)) {
                    return filePath;
                }
            }
        } else {
            if (await pathMatches(environment, filePath)) {
                return filePath;
            }
        }
    }
    return undefined;
}
async function pathMatches(environment, path) {
    try {
        const result = await environment.stat(path);
        return result.isFile;
    } catch (err) {
        if (err instanceof Deno.errors.PermissionDenied) {
            throw err;
        }
        return false;
    }
}
function whichSync(command, environment = new RealEnvironment()) {
    const systemInfo = getSystemInfo(command, environment);
    if (systemInfo == null) {
        return undefined;
    }
    for (const pathItem of systemInfo.pathItems){
        const filePath = pathItem + command;
        if (pathMatchesSync(environment, filePath)) {
            return filePath;
        }
        if (systemInfo.pathExts) {
            for (const pathExt of systemInfo.pathExts){
                const filePath = pathItem + command + pathExt;
                if (pathMatchesSync(environment, filePath)) {
                    return filePath;
                }
            }
        }
    }
    return undefined;
}
function pathMatchesSync(environment, path) {
    try {
        const result = environment.statSync(path);
        return result.isFile;
    } catch (err) {
        if (err instanceof Deno.errors.PermissionDenied) {
            throw err;
        }
        return false;
    }
}
function getSystemInfo(command, environment) {
    const isWindows = environment.os === "windows";
    const envValueSeparator = isWindows ? ";" : ":";
    const path = environment.env("PATH");
    const pathSeparator = isWindows ? "\\" : "/";
    if (path == null) {
        return undefined;
    }
    return {
        pathItems: splitEnvValue(path).map((item)=>normalizeDir(item)),
        pathExts: getPathExts(),
        isNameMatch: isWindows ? (a, b)=>a.toLowerCase() === b.toLowerCase() : (a, b)=>a === b
    };
    function getPathExts() {
        if (!isWindows) {
            return undefined;
        }
        const pathExtText = environment.env("PATHEXT") ?? ".EXE;.CMD;.BAT;.COM";
        const pathExts = splitEnvValue(pathExtText);
        const lowerCaseCommand = command.toLowerCase();
        for (const pathExt of pathExts){
            if (lowerCaseCommand.endsWith(pathExt.toLowerCase())) {
                return undefined;
            }
        }
        return pathExts;
    }
    function splitEnvValue(value1) {
        return value1.split(envValueSeparator).map((item)=>item.trim()).filter((item)=>item.length > 0);
    }
    function normalizeDir(dirPath) {
        if (!dirPath.endsWith(pathSeparator)) {
            dirPath += pathSeparator;
        }
        return dirPath;
    }
}
const importMeta = {
    url: "https://deno.land/x/dax@0.33.0/src/lib/rs_lib.generated.js",
    main: false
};
let wasm1;
const heap1 = new Array(32).fill(undefined);
heap1.push(undefined, null, true, false);
function getObject1(idx) {
    return heap1[idx];
}
let heap_next1 = heap1.length;
function dropObject1(idx) {
    if (idx < 36) return;
    heap1[idx] = heap_next1;
    heap_next1 = idx;
}
function takeObject1(idx) {
    const ret = getObject1(idx);
    dropObject1(idx);
    return ret;
}
const cachedTextDecoder1 = new TextDecoder("utf-8", {
    ignoreBOM: true,
    fatal: true
});
cachedTextDecoder1.decode();
let cachedUint8Memory01 = new Uint8Array();
function getUint8Memory01() {
    if (cachedUint8Memory01.byteLength === 0) {
        cachedUint8Memory01 = new Uint8Array(wasm1.memory.buffer);
    }
    return cachedUint8Memory01;
}
function getStringFromWasm01(ptr, len) {
    return cachedTextDecoder1.decode(getUint8Memory01().subarray(ptr, ptr + len));
}
function addHeapObject1(obj) {
    if (heap_next1 === heap1.length) heap1.push(heap1.length + 1);
    const idx = heap_next1;
    heap_next1 = heap1[idx];
    heap1[idx] = obj;
    return idx;
}
function isLikeNone1(x) {
    return x === undefined || x === null;
}
let cachedFloat64Memory0 = new Float64Array();
function getFloat64Memory0() {
    if (cachedFloat64Memory0.byteLength === 0) {
        cachedFloat64Memory0 = new Float64Array(wasm1.memory.buffer);
    }
    return cachedFloat64Memory0;
}
let cachedInt32Memory01 = new Int32Array();
function getInt32Memory01() {
    if (cachedInt32Memory01.byteLength === 0) {
        cachedInt32Memory01 = new Int32Array(wasm1.memory.buffer);
    }
    return cachedInt32Memory01;
}
let WASM_VECTOR_LEN1 = 0;
const cachedTextEncoder1 = new TextEncoder("utf-8");
const encodeString1 = function(arg, view) {
    return cachedTextEncoder1.encodeInto(arg, view);
};
function passStringToWasm01(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder1.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory01().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN1 = buf.length;
        return ptr;
    }
    let len = arg.length;
    let ptr = malloc(len);
    const mem = getUint8Memory01();
    let offset = 0;
    for(; offset < len; offset++){
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory01().subarray(ptr + offset, ptr + len);
        const ret = encodeString1(arg, view);
        offset += ret.written;
    }
    WASM_VECTOR_LEN1 = offset;
    return ptr;
}
let cachedBigInt64Memory0 = new BigInt64Array();
function getBigInt64Memory0() {
    if (cachedBigInt64Memory0.byteLength === 0) {
        cachedBigInt64Memory0 = new BigInt64Array(wasm1.memory.buffer);
    }
    return cachedBigInt64Memory0;
}
function debugString(val) {
    const type = typeof val;
    if (type == "number" || type == "boolean" || val == null) {
        return `${val}`;
    }
    if (type == "string") {
        return `"${val}"`;
    }
    if (type == "symbol") {
        const description = val.description;
        if (description == null) {
            return "Symbol";
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == "function") {
        const name = val.name;
        if (typeof name == "string" && name.length > 0) {
            return `Function(${name})`;
        } else {
            return "Function";
        }
    }
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = "[";
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++){
            debug += ", " + debugString(val[i]);
        }
        debug += "]";
        return debug;
    }
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        return toString.call(val);
    }
    if (className == "Object") {
        try {
            return "Object(" + JSON.stringify(val) + ")";
        } catch (_) {
            return "Object";
        }
    }
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    return className;
}
function parse9(command) {
    try {
        const retptr = wasm1.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm01(command, wasm1.__wbindgen_malloc, wasm1.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN1;
        wasm1.parse(retptr, ptr0, len0);
        var r0 = getInt32Memory01()[retptr / 4 + 0];
        var r1 = getInt32Memory01()[retptr / 4 + 1];
        var r2 = getInt32Memory01()[retptr / 4 + 2];
        if (r2) {
            throw takeObject1(r1);
        }
        return takeObject1(r0);
    } finally{
        wasm1.__wbindgen_add_to_stack_pointer(16);
    }
}
function static_text_render_text(items, cols, rows) {
    try {
        const retptr = wasm1.__wbindgen_add_to_stack_pointer(-16);
        wasm1.static_text_render_text(retptr, addHeapObject1(items), cols, rows);
        var r0 = getInt32Memory01()[retptr / 4 + 0];
        var r1 = getInt32Memory01()[retptr / 4 + 1];
        var r2 = getInt32Memory01()[retptr / 4 + 2];
        var r3 = getInt32Memory01()[retptr / 4 + 3];
        if (r3) {
            throw takeObject1(r2);
        }
        let v0;
        if (r0 !== 0) {
            v0 = getStringFromWasm01(r0, r1).slice();
            wasm1.__wbindgen_free(r0, r1 * 1);
        }
        return v0;
    } finally{
        wasm1.__wbindgen_add_to_stack_pointer(16);
    }
}
function static_text_clear_text(cols, rows) {
    try {
        const retptr = wasm1.__wbindgen_add_to_stack_pointer(-16);
        wasm1.static_text_clear_text(retptr, cols, rows);
        var r0 = getInt32Memory01()[retptr / 4 + 0];
        var r1 = getInt32Memory01()[retptr / 4 + 1];
        let v0;
        if (r0 !== 0) {
            v0 = getStringFromWasm01(r0, r1).slice();
            wasm1.__wbindgen_free(r0, r1 * 1);
        }
        return v0;
    } finally{
        wasm1.__wbindgen_add_to_stack_pointer(16);
    }
}
function static_text_render_once(items, cols, rows) {
    try {
        const retptr = wasm1.__wbindgen_add_to_stack_pointer(-16);
        wasm1.static_text_render_once(retptr, addHeapObject1(items), cols, rows);
        var r0 = getInt32Memory01()[retptr / 4 + 0];
        var r1 = getInt32Memory01()[retptr / 4 + 1];
        var r2 = getInt32Memory01()[retptr / 4 + 2];
        var r3 = getInt32Memory01()[retptr / 4 + 3];
        if (r3) {
            throw takeObject1(r2);
        }
        let v0;
        if (r0 !== 0) {
            v0 = getStringFromWasm01(r0, r1).slice();
            wasm1.__wbindgen_free(r0, r1 * 1);
        }
        return v0;
    } finally{
        wasm1.__wbindgen_add_to_stack_pointer(16);
    }
}
function strip_ansi_codes(text) {
    try {
        const retptr = wasm1.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm01(text, wasm1.__wbindgen_malloc, wasm1.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN1;
        wasm1.strip_ansi_codes(retptr, ptr0, len0);
        var r0 = getInt32Memory01()[retptr / 4 + 0];
        var r1 = getInt32Memory01()[retptr / 4 + 1];
        return getStringFromWasm01(r0, r1);
    } finally{
        wasm1.__wbindgen_add_to_stack_pointer(16);
        wasm1.__wbindgen_free(r0, r1);
    }
}
function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm1.__wbindgen_exn_store(addHeapObject1(e));
    }
}
const imports1 = {
    __wbindgen_placeholder__: {
        __wbindgen_object_drop_ref: function(arg0) {
            takeObject1(arg0);
        },
        __wbindgen_error_new: function(arg0, arg1) {
            const ret = new Error(getStringFromWasm01(arg0, arg1));
            return addHeapObject1(ret);
        },
        __wbindgen_boolean_get: function(arg0) {
            const v = getObject1(arg0);
            const ret = typeof v === "boolean" ? v ? 1 : 0 : 2;
            return ret;
        },
        __wbindgen_is_bigint: function(arg0) {
            const ret = typeof getObject1(arg0) === "bigint";
            return ret;
        },
        __wbindgen_bigint_from_i64: function(arg0) {
            const ret = arg0;
            return addHeapObject1(ret);
        },
        __wbindgen_jsval_eq: function(arg0, arg1) {
            const ret = getObject1(arg0) === getObject1(arg1);
            return ret;
        },
        __wbindgen_number_get: function(arg0, arg1) {
            const obj = getObject1(arg1);
            const ret = typeof obj === "number" ? obj : undefined;
            getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone1(ret) ? 0 : ret;
            getInt32Memory01()[arg0 / 4 + 0] = !isLikeNone1(ret);
        },
        __wbindgen_string_get: function(arg0, arg1) {
            const obj = getObject1(arg1);
            const ret = typeof obj === "string" ? obj : undefined;
            var ptr0 = isLikeNone1(ret) ? 0 : passStringToWasm01(ret, wasm1.__wbindgen_malloc, wasm1.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN1;
            getInt32Memory01()[arg0 / 4 + 1] = len0;
            getInt32Memory01()[arg0 / 4 + 0] = ptr0;
        },
        __wbindgen_is_object: function(arg0) {
            const val = getObject1(arg0);
            const ret = typeof val === "object" && val !== null;
            return ret;
        },
        __wbindgen_in: function(arg0, arg1) {
            const ret = getObject1(arg0) in getObject1(arg1);
            return ret;
        },
        __wbindgen_bigint_from_u64: function(arg0) {
            const ret = BigInt.asUintN(64, arg0);
            return addHeapObject1(ret);
        },
        __wbindgen_object_clone_ref: function(arg0) {
            const ret = getObject1(arg0);
            return addHeapObject1(ret);
        },
        __wbindgen_string_new: function(arg0, arg1) {
            const ret = getStringFromWasm01(arg0, arg1);
            return addHeapObject1(ret);
        },
        __wbindgen_jsval_loose_eq: function(arg0, arg1) {
            const ret = getObject1(arg0) == getObject1(arg1);
            return ret;
        },
        __wbg_set_20cbc34131e76824: function(arg0, arg1, arg2) {
            getObject1(arg0)[takeObject1(arg1)] = takeObject1(arg2);
        },
        __wbg_get_57245cc7d7c7619d: function(arg0, arg1) {
            const ret = getObject1(arg0)[arg1 >>> 0];
            return addHeapObject1(ret);
        },
        __wbg_length_6e3bbe7c8bd4dbd8: function(arg0) {
            const ret = getObject1(arg0).length;
            return ret;
        },
        __wbg_new_1d9a920c6bfc44a8: function() {
            const ret = new Array();
            return addHeapObject1(ret);
        },
        __wbindgen_is_function: function(arg0) {
            const ret = typeof getObject1(arg0) === "function";
            return ret;
        },
        __wbg_next_579e583d33566a86: function(arg0) {
            const ret = getObject1(arg0).next;
            return addHeapObject1(ret);
        },
        __wbg_next_aaef7c8aa5e212ac: function() {
            return handleError(function(arg0) {
                const ret = getObject1(arg0).next();
                return addHeapObject1(ret);
            }, arguments);
        },
        __wbg_done_1b73b0672e15f234: function(arg0) {
            const ret = getObject1(arg0).done;
            return ret;
        },
        __wbg_value_1ccc36bc03462d71: function(arg0) {
            const ret = getObject1(arg0).value;
            return addHeapObject1(ret);
        },
        __wbg_iterator_6f9d4f28845f426c: function() {
            const ret = Symbol.iterator;
            return addHeapObject1(ret);
        },
        __wbg_get_765201544a2b6869: function() {
            return handleError(function(arg0, arg1) {
                const ret = Reflect.get(getObject1(arg0), getObject1(arg1));
                return addHeapObject1(ret);
            }, arguments);
        },
        __wbg_call_97ae9d8645dc388b: function() {
            return handleError(function(arg0, arg1) {
                const ret = getObject1(arg0).call(getObject1(arg1));
                return addHeapObject1(ret);
            }, arguments);
        },
        __wbg_new_0b9bfdd97583284e: function() {
            const ret = new Object();
            return addHeapObject1(ret);
        },
        __wbg_set_a68214f35c417fa9: function(arg0, arg1, arg2) {
            getObject1(arg0)[arg1 >>> 0] = takeObject1(arg2);
        },
        __wbg_isArray_27c46c67f498e15d: function(arg0) {
            const ret = Array.isArray(getObject1(arg0));
            return ret;
        },
        __wbg_instanceof_ArrayBuffer_e5e48f4762c5610b: function(arg0) {
            let result;
            try {
                result = getObject1(arg0) instanceof ArrayBuffer;
            } catch  {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_isSafeInteger_dfa0593e8d7ac35a: function(arg0) {
            const ret = Number.isSafeInteger(getObject1(arg0));
            return ret;
        },
        __wbg_entries_65a76a413fc91037: function(arg0) {
            const ret = Object.entries(getObject1(arg0));
            return addHeapObject1(ret);
        },
        __wbg_buffer_3f3d764d4747d564: function(arg0) {
            const ret = getObject1(arg0).buffer;
            return addHeapObject1(ret);
        },
        __wbg_new_8c3f0052272a457a: function(arg0) {
            const ret = new Uint8Array(getObject1(arg0));
            return addHeapObject1(ret);
        },
        __wbg_set_83db9690f9353e79: function(arg0, arg1, arg2) {
            getObject1(arg0).set(getObject1(arg1), arg2 >>> 0);
        },
        __wbg_length_9e1ae1900cb0fbd5: function(arg0) {
            const ret = getObject1(arg0).length;
            return ret;
        },
        __wbg_instanceof_Uint8Array_971eeda69eb75003: function(arg0) {
            let result;
            try {
                result = getObject1(arg0) instanceof Uint8Array;
            } catch  {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_new_abda76e883ba8a5f: function() {
            const ret = new Error();
            return addHeapObject1(ret);
        },
        __wbg_stack_658279fe44541cf6: function(arg0, arg1) {
            const ret = getObject1(arg1).stack;
            const ptr0 = passStringToWasm01(ret, wasm1.__wbindgen_malloc, wasm1.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN1;
            getInt32Memory01()[arg0 / 4 + 1] = len0;
            getInt32Memory01()[arg0 / 4 + 0] = ptr0;
        },
        __wbg_error_f851667af71bcfc6: function(arg0, arg1) {
            try {
                console.error(getStringFromWasm01(arg0, arg1));
            } finally{
                wasm1.__wbindgen_free(arg0, arg1);
            }
        },
        __wbindgen_bigint_get_as_i64: function(arg0, arg1) {
            const v = getObject1(arg1);
            const ret = typeof v === "bigint" ? v : undefined;
            getBigInt64Memory0()[arg0 / 8 + 1] = isLikeNone1(ret) ? 0n : ret;
            getInt32Memory01()[arg0 / 4 + 0] = !isLikeNone1(ret);
        },
        __wbindgen_debug_string: function(arg0, arg1) {
            const ret = debugString(getObject1(arg1));
            const ptr0 = passStringToWasm01(ret, wasm1.__wbindgen_malloc, wasm1.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN1;
            getInt32Memory01()[arg0 / 4 + 1] = len0;
            getInt32Memory01()[arg0 / 4 + 0] = ptr0;
        },
        __wbindgen_throw: function(arg0, arg1) {
            throw new Error(getStringFromWasm01(arg0, arg1));
        },
        __wbindgen_memory: function() {
            const ret = wasm1.memory;
            return addHeapObject1(ret);
        }
    }
};
async function instantiate1(opts) {
    return (await instantiateWithInstance1(opts)).exports;
}
let instanceWithExports1;
let lastLoadPromise;
function instantiateWithInstance1(opts) {
    if (instanceWithExports1 != null) {
        return Promise.resolve(instanceWithExports1);
    }
    if (lastLoadPromise == null) {
        lastLoadPromise = (async ()=>{
            try {
                const instance = (await instantiateModule(opts ?? {})).instance;
                wasm1 = instance.exports;
                cachedInt32Memory01 = new Int32Array(wasm1.memory.buffer);
                cachedUint8Memory01 = new Uint8Array(wasm1.memory.buffer);
                instanceWithExports1 = {
                    instance,
                    exports: getWasmInstanceExports()
                };
                return instanceWithExports1;
            } finally{
                lastLoadPromise = null;
            }
        })();
    }
    return lastLoadPromise;
}
function getWasmInstanceExports() {
    return {
        parse: parse9,
        static_text_render_text,
        static_text_clear_text,
        static_text_render_once,
        strip_ansi_codes
    };
}
async function instantiateModule(opts) {
    const wasmUrl = opts.url ?? new URL("rs_lib_bg.wasm", importMeta.url);
    const decompress = opts.decompress;
    const isFile = wasmUrl.protocol === "file:";
    const isNode = globalThis.process?.versions?.node != null;
    if (isNode && isFile) {
        const wasmCode = await Deno.readFile(wasmUrl);
        return WebAssembly.instantiate(decompress ? decompress(wasmCode) : wasmCode, imports1);
    }
    switch(wasmUrl.protocol){
        case "file:":
        case "https:":
        case "http:":
            {
                if (isFile) {
                    if (typeof Deno !== "object") {
                        throw new Error("file urls are not supported in this environment");
                    }
                    if ("permissions" in Deno) {
                        await Deno.permissions.request({
                            name: "read",
                            path: wasmUrl
                        });
                    }
                } else if (typeof Deno === "object" && "permissions" in Deno) {
                    await Deno.permissions.request({
                        name: "net",
                        host: wasmUrl.host
                    });
                }
                const wasmResponse = await fetch(wasmUrl);
                if (decompress) {
                    const wasmCode = new Uint8Array(await wasmResponse.arrayBuffer());
                    return WebAssembly.instantiate(decompress(wasmCode), imports1);
                }
                if (isFile || wasmResponse.headers.get("content-type")?.toLowerCase().startsWith("application/wasm")) {
                    return WebAssembly.instantiateStreaming(wasmResponse, imports1);
                } else {
                    return WebAssembly.instantiate(await wasmResponse.arrayBuffer(), imports1);
                }
            }
        default:
            throw new Error(`Unsupported protocol: ${wasmUrl.protocol}`);
    }
}
const importMeta1 = {
    url: "https://deno.land/x/dax@0.33.0/src/lib/mod.ts",
    main: false
};
async function getWasmFileUrl() {
    const url = new URL("rs_lib_bg.wasm", importMeta1.url);
    if (url.protocol !== "file:") {
        return await cacheLocalDir(url) ?? url;
    }
    return url;
}
async function cacheLocalDir(url) {
    const localPath = await getUrlLocalPath(url);
    if (localPath == null) {
        return undefined;
    }
    if (!await mod9.exists(localPath)) {
        const fileBytes = await getUrlBytes(url);
        await Deno.writeFile(localPath, new Uint8Array(fileBytes));
    }
    return mod8.toFileUrl(localPath);
}
async function getUrlLocalPath(url) {
    try {
        const dataDirPath = await getInitializedLocalDataDirPath();
        const version = getUrlVersion(url);
        return mod8.join(dataDirPath, version + ".wasm");
    } catch  {
        return undefined;
    }
}
async function getInitializedLocalDataDirPath() {
    const dataDir1 = dataDir();
    if (dataDir1 == null) {
        throw new Error(`Could not find local data directory.`);
    }
    const dirPath = mod8.join(dataDir1, "dax");
    await mod9.ensureDir(dirPath);
    return dirPath;
}
function getUrlVersion(url) {
    const version = url.pathname.match(/([0-9]+)\.([0-9]+)\.([0-9]+)/)?.[0];
    if (version == null) {
        throw new Error(`Could not find version in url: ${url}`);
    }
    return version;
}
async function getUrlBytes(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error downloading ${url}: ${response.statusText}`);
    }
    return await response.arrayBuffer();
}
const wasmInstance = await instantiate1({
    url: await getWasmFileUrl()
});
const encoder = new TextEncoder();
var LoggerRefreshItemKind;
const decoder = new TextDecoder();
var Keys;
(function(Keys) {
    Keys[Keys["Up"] = 0] = "Up";
    Keys[Keys["Down"] = 1] = "Down";
    Keys[Keys["Left"] = 2] = "Left";
    Keys[Keys["Right"] = 3] = "Right";
    Keys[Keys["Enter"] = 4] = "Enter";
    Keys[Keys["Space"] = 5] = "Space";
    Keys[Keys["Backspace"] = 6] = "Backspace";
})(Keys || (Keys = {}));
async function* readKeys() {
    const { strip_ansi_codes } = wasmInstance;
    while(true){
        const buf = new Uint8Array(8);
        const byteCount = await Deno.read(Deno.stdin.rid, buf);
        if (byteCount == null) {
            break;
        }
        if (byteCount === 3) {
            if (buf[0] === 27 && buf[1] === 91) {
                if (buf[2] === 65) {
                    yield Keys.Up;
                    continue;
                } else if (buf[2] === 66) {
                    yield Keys.Down;
                    continue;
                } else if (buf[2] === 67) {
                    yield Keys.Right;
                    continue;
                } else if (buf[2] === 68) {
                    yield Keys.Left;
                    continue;
                }
            }
        } else if (byteCount === 1) {
            if (buf[0] === 3) {
                break;
            } else if (buf[0] === 13) {
                yield Keys.Enter;
                continue;
            } else if (buf[0] === 32) {
                yield Keys.Space;
                continue;
            } else if (buf[0] === 127) {
                yield Keys.Backspace;
                continue;
            }
        }
        const text = strip_ansi_codes(decoder.decode(buf.slice(0, byteCount ?? 0)));
        if (text.length > 0) {
            yield text;
        }
    }
}
function hideCursor() {
    Deno.stderr.writeSync(encoder.encode("\x1B[?25l"));
}
function showCursor() {
    Deno.stderr.writeSync(encoder.encode("\x1B[?25h"));
}
const isOutputTty = safeConsoleSize() != null && Deno.isatty(Deno.stderr.rid);
function resultOrExit(result) {
    if (result == null) {
        Deno.exit(130);
    } else {
        return result;
    }
}
(function(LoggerRefreshItemKind) {
    LoggerRefreshItemKind[LoggerRefreshItemKind["ProgressBars"] = 0] = "ProgressBars";
    LoggerRefreshItemKind[LoggerRefreshItemKind["Selection"] = 1] = "Selection";
})(LoggerRefreshItemKind || (LoggerRefreshItemKind = {}));
const refreshItems = {
    [LoggerRefreshItemKind.ProgressBars]: undefined,
    [LoggerRefreshItemKind.Selection]: undefined
};
function setItems(kind, items, size) {
    refreshItems[kind] = items;
    refresh(size);
}
const logger = {
    setItems,
    logOnce,
    logAboveStaticText
};
function createSelection(options) {
    if (!isOutputTty || !Deno.isatty(Deno.stdin.rid)) {
        throw new Error(`Cannot prompt when not a tty. (Prompt: '${options.message}')`);
    }
    if (safeConsoleSize() == null) {
        throw new Error(`Cannot prompt when can't get console size. (Prompt: '${options.message}')`);
    }
    return ensureSingleSelection(async ()=>{
        logger.setItems(LoggerRefreshItemKind.Selection, options.render());
        for await (const key of readKeys()){
            const keyResult = options.onKey(key);
            if (keyResult != null) {
                const size = Deno.consoleSize();
                logger.setItems(LoggerRefreshItemKind.Selection, [], size);
                if (options.noClear) {
                    logger.logOnce(options.render(), size);
                }
                return keyResult;
            }
            logger.setItems(LoggerRefreshItemKind.Selection, options.render());
        }
        logger.setItems(LoggerRefreshItemKind.Selection, []);
        return undefined;
    });
}
let lastPromise = Promise.resolve();
function ensureSingleSelection(action) {
    const currentLastPromise = lastPromise;
    const currentPromise = (async ()=>{
        try {
            await currentLastPromise;
        } catch  {}
        hideCursor();
        try {
            Deno.stdin.setRaw(true);
            try {
                return await action();
            } finally{
                Deno.stdin.setRaw(false);
            }
        } finally{
            showCursor();
        }
    })();
    lastPromise = currentPromise;
    return currentPromise;
}
function safeConsoleSize() {
    try {
        return Deno.consoleSize();
    } catch  {
        return undefined;
    }
}
const staticText = {
    set (items, size) {
        if (items.length === 0) {
            return this.clear(size);
        }
        const { columns, rows } = size ?? Deno.consoleSize();
        const newText = wasmInstance.static_text_render_text(items, columns, rows);
        if (newText != null) {
            Deno.stderr.writeSync(encoder.encode(newText));
        }
    },
    outputItems (items, size) {
        const { columns, rows } = size ?? Deno.consoleSize();
        const newText = wasmInstance.static_text_render_once(items, columns, rows);
        if (newText != null) {
            Deno.stderr.writeSync(encoder.encode(newText + "\n"));
        }
    },
    clear (size) {
        const { columns, rows } = size ?? Deno.consoleSize();
        const newText = wasmInstance.static_text_clear_text(columns, rows);
        if (newText != null) {
            Deno.stderr.writeSync(encoder.encode(newText));
        }
    }
};
function refresh(size) {
    if (!isOutputTty) {
        return;
    }
    const items = Object.values(refreshItems).flatMap((items)=>items ?? []);
    staticText.set(items, size);
}
function logAboveStaticText(inner, providedSize) {
    if (!isOutputTty) {
        inner();
        return;
    }
    const size = providedSize ?? safeConsoleSize();
    if (size != null) {
        staticText.clear(size);
    }
    inner();
    refresh(size);
}
function logOnce(items, size) {
    logAboveStaticText(()=>{
        staticText.outputItems(items, size);
    }, size);
}
function confirm(optsOrMessage, options) {
    return maybeConfirm(optsOrMessage, options).then(resultOrExit);
}
function maybeConfirm(optsOrMessage, options) {
    const opts = typeof optsOrMessage === "string" ? {
        message: optsOrMessage,
        ...options
    } : optsOrMessage;
    return createSelection({
        message: opts.message,
        noClear: opts.noClear,
        ...innerConfirm(opts)
    });
}
function innerConfirm(opts) {
    const drawState = {
        title: opts.message,
        default: opts.default,
        inputText: "",
        hasCompleted: false
    };
    return {
        render: ()=>render(drawState),
        onKey: (key)=>{
            switch(key){
                case "Y":
                case "y":
                    drawState.inputText = "Y";
                    break;
                case "N":
                case "n":
                    drawState.inputText = "N";
                    break;
                case Keys.Backspace:
                    drawState.inputText = "";
                    break;
                case Keys.Enter:
                    if (drawState.inputText.length === 0) {
                        if (drawState.default == null) {
                            return undefined;
                        }
                        drawState.inputText = drawState.default ? "Y" : "N";
                    }
                    drawState.hasCompleted = true;
                    return drawState.inputText === "Y" ? true : drawState.inputText === "N" ? false : drawState.default;
            }
        }
    };
}
function render(state) {
    return [
        mod5.bold(mod5.blue(state.title)) + " " + (state.hasCompleted ? "" : state.default == null ? "(Y/N) " : state.default ? "(Y/n) " : "(y/N) ") + state.inputText + (state.hasCompleted ? "" : "\u2588")
    ];
}
function multiSelect(opts) {
    return maybeMultiSelect(opts).then(resultOrExit);
}
function maybeMultiSelect(opts) {
    if (opts.options.length === 0) {
        throw new Error(`You must provide at least one option. (Prompt: '${opts.message}')`);
    }
    return createSelection({
        message: opts.message,
        noClear: opts.noClear,
        ...innerMultiSelect(opts)
    });
}
function innerMultiSelect(opts) {
    const drawState = {
        title: opts.message,
        activeIndex: 0,
        items: opts.options.map((option)=>{
            if (typeof option === "string") {
                option = {
                    text: option
                };
            }
            return {
                selected: option.selected ?? false,
                text: option.text
            };
        }),
        hasCompleted: false
    };
    return {
        render: ()=>render1(drawState),
        onKey: (key)=>{
            switch(key){
                case Keys.Up:
                    if (drawState.activeIndex === 0) {
                        drawState.activeIndex = drawState.items.length - 1;
                    } else {
                        drawState.activeIndex--;
                    }
                    break;
                case Keys.Down:
                    drawState.activeIndex = (drawState.activeIndex + 1) % drawState.items.length;
                    break;
                case Keys.Space:
                    {
                        const item = drawState.items[drawState.activeIndex];
                        item.selected = !item.selected;
                        break;
                    }
                case Keys.Enter:
                    drawState.hasCompleted = true;
                    return drawState.items.map((value1, index)=>[
                            value1,
                            index
                        ]).filter(([value1])=>value1.selected).map(([, index])=>index);
            }
            return undefined;
        }
    };
}
function render1(state) {
    const items = [];
    items.push(mod5.bold(mod5.blue(state.title)));
    if (state.hasCompleted) {
        if (state.items.some((i)=>i.selected)) {
            for (const item of state.items){
                if (item.selected) {
                    items.push({
                        text: ` - ${item.text}`,
                        indent: 3
                    });
                }
            }
        } else {
            items.push(mod5.italic(" <None>"));
        }
    } else {
        for (const [i, item] of state.items.entries()){
            const prefix = i === state.activeIndex ? "> " : "  ";
            items.push({
                text: `${prefix}[${item.selected ? "x" : " "}] ${item.text}`,
                indent: 6
            });
        }
    }
    return items;
}
const units = [
    "B",
    "KiB",
    "MiB",
    "GiB",
    "TiB",
    "PiB",
    "EiB",
    "ZiB",
    "YiB"
];
function humanDownloadSize(byteCount, totalBytes) {
    const exponent = Math.min(units.length - 1, Math.floor(Math.log(totalBytes) / Math.log(1024)));
    const unit = units[exponent];
    const prettyBytes = (Math.floor(byteCount / Math.pow(1024, exponent) * 100) / 100).toFixed(exponent === 0 ? 0 : 2);
    return `${prettyBytes} ${unit}`;
}
const intervalMs = 60;
const progressBars = [];
let renderIntervalId;
function addProgressBar(render) {
    const pb = {
        render
    };
    progressBars.push(pb);
    if (renderIntervalId == null && isOutputTty) {
        renderIntervalId = setInterval(forceRender, intervalMs);
    }
    return pb;
}
function removeProgressBar(pb) {
    const index = progressBars.indexOf(pb);
    if (index === -1) {
        return false;
    }
    progressBars.splice(index, 1);
    if (progressBars.length === 0) {
        clearInterval(renderIntervalId);
        logger.setItems(LoggerRefreshItemKind.ProgressBars, []);
        renderIntervalId = undefined;
    }
    return true;
}
function forceRender() {
    if (!isShowingProgressBars()) {
        return;
    }
    const size = Deno.consoleSize();
    const items = progressBars.map((p)=>p.render(size)).flat();
    logger.setItems(LoggerRefreshItemKind.ProgressBars, items, size);
}
function isShowingProgressBars() {
    return isOutputTty && progressBars.length > 0;
}
class ProgressBar {
    #state;
    #pb;
    #withCount = 0;
    #onLog;
    #noClear;
    constructor(onLog, opts){
        if (arguments.length !== 2) {
            throw new Error("Invalid usage. Create the progress bar via `$.progress`.");
        }
        this.#onLog = onLog;
        this.#state = {
            message: opts.message,
            prefix: opts.prefix,
            length: opts.length,
            currentPos: 0,
            tickCount: 0,
            hasCompleted: false,
            kind: "raw"
        };
        this.#pb = addProgressBar((size)=>{
            this.#state.tickCount++;
            return renderProgressBar(this.#state, size);
        });
        this.#noClear = opts.noClear ?? false;
        this.#logIfNonInteractive();
    }
    prefix(prefix) {
        this.#state.prefix = prefix;
        if (prefix != null && prefix.length > 0) {
            this.#logIfNonInteractive();
        }
        return this;
    }
    message(message) {
        this.#state.message = message;
        if (message != null && message.length > 0) {
            this.#logIfNonInteractive();
        }
        return this;
    }
    kind(kind) {
        this.#state.kind = kind;
        return this;
    }
    #logIfNonInteractive() {
        if (isOutputTty) {
            return;
        }
        let text = this.#state.prefix ?? "";
        if (text.length > 0) {
            text += " ";
        }
        text += this.#state.message ?? "";
        if (text.length > 0) {
            this.#onLog(text);
        }
    }
    position(position) {
        this.#state.currentPos = position;
        return this;
    }
    increment(inc = 1) {
        this.#state.currentPos += inc;
        return this;
    }
    length(size) {
        this.#state.length = size;
        return this;
    }
    noClear(value1 = true) {
        this.#noClear = value1;
        return this;
    }
    forceRender() {
        return forceRender();
    }
    finish() {
        if (removeProgressBar(this.#pb)) {
            this.#state.hasCompleted = true;
            if (this.#noClear) {
                const text = renderProgressBar(this.#state, safeConsoleSize()).map((item)=>typeof item === "string" ? item : item.text).join("\n");
                this.#onLog(text);
            }
        }
    }
    with(action) {
        this.#withCount++;
        let wasAsync = false;
        try {
            const result = action();
            if (result instanceof Promise) {
                wasAsync = true;
                return result.finally(()=>{
                    this.#decrementWith();
                });
            } else {
                return result;
            }
        } finally{
            if (!wasAsync) {
                this.#decrementWith();
            }
        }
    }
    #decrementWith() {
        this.#withCount--;
        if (this.#withCount === 0) {
            this.finish();
        }
    }
}
const tickStrings = [
    "⠋",
    "⠙",
    "⠹",
    "⠸",
    "⠼",
    "⠴",
    "⠦",
    "⠧",
    "⠇",
    "⠏"
];
function renderProgressBar(state, size) {
    if (state.hasCompleted) {
        let text = "";
        if (state.prefix != null) {
            text += mod5.green(state.prefix);
        }
        if (state.message != null) {
            if (text.length > 0) {
                text += " ";
            }
            text += state.message;
        }
        return text.length > 0 ? [
            text
        ] : [];
    } else if (state.length == null || state.length === 0) {
        let text = mod5.green(tickStrings[Math.abs(state.tickCount) % tickStrings.length]);
        if (state.prefix != null) {
            text += ` ${mod5.green(state.prefix)}`;
        }
        if (state.message != null) {
            text += ` ${state.message}`;
        }
        return [
            text
        ];
    } else {
        let firstLine = "";
        if (state.prefix != null) {
            firstLine += mod5.green(state.prefix);
        }
        if (state.message != null) {
            if (firstLine.length > 0) {
                firstLine += " ";
            }
            firstLine += state.message;
        }
        const percent = Math.min(state.currentPos / state.length, 1);
        const currentPosText = state.kind === "bytes" ? humanDownloadSize(state.currentPos, state.length) : state.currentPos.toString();
        const lengthText = state.kind === "bytes" ? humanDownloadSize(state.length, state.length) : state.length.toString();
        const maxWidth = size == null ? 75 : Math.max(10, Math.min(75, size.columns - 5));
        const sameLineTextWidth = 6 + lengthText.length * 2 + state.length.toString().length * 2;
        const totalBars = Math.max(1, maxWidth - sameLineTextWidth);
        const completedBars = Math.floor(totalBars * percent);
        let secondLine = "";
        secondLine += "[";
        if (completedBars != totalBars) {
            if (completedBars > 0) {
                secondLine += mod5.cyan("#".repeat(completedBars - 1) + ">");
            }
            secondLine += mod5.blue("-".repeat(totalBars - completedBars));
        } else {
            secondLine += mod5.cyan("#".repeat(completedBars));
        }
        secondLine += `] (${currentPosText}/${lengthText})`;
        const result = [];
        if (firstLine.length > 0) {
            result.push(firstLine);
        }
        result.push(secondLine);
        return result;
    }
}
const defaultMask = {
    char: "*",
    lastVisible: false
};
function prompt(optsOrMessage, options) {
    return maybePrompt(optsOrMessage, options).then(resultOrExit);
}
function maybePrompt(optsOrMessage, options) {
    const opts = typeof optsOrMessage === "string" ? {
        message: optsOrMessage,
        ...options
    } : optsOrMessage;
    return createSelection({
        message: opts.message,
        noClear: opts.noClear,
        ...innerPrompt(opts)
    });
}
function innerPrompt(opts) {
    let mask = opts.mask ?? false;
    if (mask && typeof mask === "boolean") {
        mask = defaultMask;
    }
    const drawState = {
        title: opts.message,
        inputText: opts.default ?? "",
        mask,
        hasCompleted: false
    };
    return {
        render: ()=>render2(drawState),
        onKey: (key)=>{
            if (typeof key === "string") {
                drawState.inputText += key;
            } else {
                switch(key){
                    case Keys.Space:
                        drawState.inputText += " ";
                        break;
                    case Keys.Backspace:
                        drawState.inputText = drawState.inputText.slice(0, -1);
                        break;
                    case Keys.Enter:
                        drawState.hasCompleted = true;
                        return drawState.inputText;
                }
            }
            return undefined;
        }
    };
}
function render2(state) {
    let { inputText } = state;
    if (state.mask) {
        const __char = state.mask.char ?? defaultMask.char;
        const lastVisible = state.mask.lastVisible ?? defaultMask.lastVisible;
        const shouldShowLast = lastVisible && !state.hasCompleted;
        const safeLengthMinusOne = Math.max(0, inputText.length - 1);
        const masked = __char.repeat(shouldShowLast ? safeLengthMinusOne : inputText.length);
        const unmasked = shouldShowLast ? inputText.slice(safeLengthMinusOne) : "";
        inputText = `${masked}${unmasked}`;
    }
    return [
        mod5.bold(mod5.blue(state.title)) + " " + inputText + (state.hasCompleted ? "" : "\u2588")
    ];
}
function select(opts) {
    return maybeSelect(opts).then(resultOrExit);
}
function maybeSelect(opts) {
    if (opts.options.length <= 1) {
        throw new Error(`You must provide at least two options. (Prompt: '${opts.message}')`);
    }
    return createSelection({
        message: opts.message,
        noClear: opts.noClear,
        ...innerSelect(opts)
    });
}
function innerSelect(opts) {
    const drawState = {
        title: opts.message,
        activeIndex: (opts.initialIndex ?? 0) % opts.options.length,
        items: opts.options,
        hasCompleted: false
    };
    return {
        render: ()=>render3(drawState),
        onKey: (key)=>{
            switch(key){
                case Keys.Up:
                    if (drawState.activeIndex === 0) {
                        drawState.activeIndex = drawState.items.length - 1;
                    } else {
                        drawState.activeIndex--;
                    }
                    break;
                case Keys.Down:
                    drawState.activeIndex = (drawState.activeIndex + 1) % drawState.items.length;
                    break;
                case Keys.Enter:
                    drawState.hasCompleted = true;
                    return drawState.activeIndex;
            }
        }
    };
}
function render3(state) {
    const items = [];
    items.push(mod5.bold(mod5.blue(state.title)));
    if (state.hasCompleted) {
        items.push({
            text: ` - ${state.items[state.activeIndex]}`,
            indent: 3
        });
    } else {
        for (const [i, text] of state.items.entries()){
            const prefix = i === state.activeIndex ? "> " : "  ";
            items.push({
                text: `${prefix}${text}`,
                indent: 4
            });
        }
    }
    return items;
}
function formatMillis(ms) {
    if (ms < 1000) {
        return `${formatValue(ms)} millisecond${ms === 1 ? "" : "s"}`;
    } else if (ms < 60 * 1000) {
        const s = ms / 1000;
        return `${formatValue(s)} ${pluralize("second", s)}`;
    } else {
        const mins = ms / 60 / 1000;
        return `${formatValue(mins)} ${pluralize("minute", mins)}`;
    }
    function formatValue(value1) {
        const text = value1.toFixed(2);
        if (text.endsWith(".00")) {
            return value1.toFixed(0);
        } else if (text.endsWith("0")) {
            return value1.toFixed(1);
        } else {
            return text;
        }
    }
    function pluralize(text, value1) {
        const suffix = value1 === 1 ? "" : "s";
        return text + suffix;
    }
}
function delayToIterator(delay) {
    if (typeof delay !== "number" && typeof delay !== "string") {
        return delay;
    }
    const ms = delayToMs(delay);
    return {
        next () {
            return ms;
        }
    };
}
function delayToMs(delay) {
    if (typeof delay === "number") {
        return delay;
    } else if (typeof delay === "string") {
        const msMatch = delay.match(/^([0-9]+)ms$/);
        if (msMatch != null) {
            return parseInt(msMatch[1], 10);
        }
        const secondsMatch = delay.match(/^([0-9]+\.?[0-9]*)s$/);
        if (secondsMatch != null) {
            return Math.round(parseFloat(secondsMatch[1]) * 1000);
        }
        const minutesMatch = delay.match(/^([0-9]+\.?[0-9]*)m$/);
        if (minutesMatch != null) {
            return Math.round(parseFloat(minutesMatch[1]) * 1000 * 60);
        }
        const minutesSecondsMatch = delay.match(/^([0-9]+\.?[0-9]*)m([0-9]+\.?[0-9]*)s$/);
        if (minutesSecondsMatch != null) {
            return Math.round(parseFloat(minutesSecondsMatch[1]) * 1000 * 60 + parseFloat(minutesSecondsMatch[2]) * 1000);
        }
        const hoursMatch = delay.match(/^([0-9]+\.?[0-9]*)h$/);
        if (hoursMatch != null) {
            return Math.round(parseFloat(hoursMatch[1]) * 1000 * 60 * 60);
        }
        const hoursMinutesMatch = delay.match(/^([0-9]+\.?[0-9]*)h([0-9]+\.?[0-9]*)m$/);
        if (hoursMinutesMatch != null) {
            return Math.round(parseFloat(hoursMinutesMatch[1]) * 1000 * 60 * 60 + parseFloat(hoursMinutesMatch[2]) * 1000 * 60);
        }
        const hoursMinutesSecondsMatch = delay.match(/^([0-9]+\.?[0-9]*)h([0-9]+\.?[0-9]*)m([0-9]+\.?[0-9]*)s$/);
        if (hoursMinutesSecondsMatch != null) {
            return Math.round(parseFloat(hoursMinutesSecondsMatch[1]) * 1000 * 60 * 60 + parseFloat(hoursMinutesSecondsMatch[2]) * 1000 * 60 + parseFloat(hoursMinutesSecondsMatch[3]) * 1000);
        }
    }
    throw new Error(`Unknown delay value: ${delay}`);
}
function filterEmptyRecordValues(record) {
    const result = {};
    for (const [key, value1] of Object.entries(record)){
        if (value1 != null) {
            result[key] = value1;
        }
    }
    return result;
}
function resolvePath(cwd, arg) {
    return mod8.resolve(mod8.isAbsolute(arg) ? arg : mod8.join(cwd, arg));
}
class Box {
    value;
    constructor(value1){
        this.value = value1;
    }
}
class TreeBox {
    #value;
    constructor(value1){
        this.#value = value1;
    }
    getValue() {
        let tree = this;
        while(tree.#value instanceof TreeBox){
            tree = tree.#value;
        }
        return tree.#value;
    }
    setValue(value1) {
        this.#value = value1;
    }
    createChild() {
        return new TreeBox(this);
    }
}
class LoggerTreeBox extends TreeBox {
    getValue() {
        const innerValue = super.getValue();
        return (...args)=>{
            return logger.logAboveStaticText(()=>{
                innerValue(...args);
            });
        };
    }
}
async function safeLstat(path) {
    try {
        return await Deno.lstat(path);
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return undefined;
        } else {
            throw err;
        }
    }
}
function getFileNameFromUrl(url) {
    const parsedUrl = url instanceof URL ? url : new URL(url);
    const fileName = parsedUrl.pathname.split("/").at(-1);
    return fileName?.length === 0 ? undefined : fileName;
}
async function getExecutableShebangFromPath(path) {
    try {
        const file = await Deno.open(path, {
            read: true
        });
        try {
            return await getExecutableShebang(file);
        } finally{
            try {
                file.close();
            } catch  {}
        }
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return false;
        }
        throw err;
    }
}
const decoder1 = new TextDecoder();
async function getExecutableShebang(reader) {
    const text = "#!/usr/bin/env ";
    const buffer = new Uint8Array(text.length);
    const bytesReadCount = await reader.read(buffer);
    if (bytesReadCount !== text.length || decoder1.decode(buffer) !== text) {
        return undefined;
    }
    const bufReader = new BufReader(reader);
    const line = await bufReader.readLine();
    if (line == null) {
        return undefined;
    }
    const result = decoder1.decode(line.line).trim();
    const dashS = "-S ";
    if (result.startsWith(dashS)) {
        return {
            stringSplit: true,
            command: result.slice(dashS.length)
        };
    } else {
        return {
            stringSplit: false,
            command: result
        };
    }
}
function resultFromCode(code) {
    return {
        kind: "continue",
        code
    };
}
function getAbortedResult() {
    return {
        kind: "exit",
        code: 124
    };
}
async function cdCommand(context) {
    try {
        const dir = await executeCd(context.cwd, context.args);
        return {
            code: 0,
            kind: "continue",
            changes: [
                {
                    kind: "cd",
                    dir
                }
            ]
        };
    } catch (err) {
        context.stderr.writeLine(`cd: ${err?.message ?? err}`);
        return resultFromCode(1);
    }
}
async function executeCd(cwd, args) {
    const arg = parseArgs(args);
    const result = resolvePath(cwd, arg);
    if (!await isDirectory(result)) {
        throw new Error(`${result}: Not a directory`);
    }
    return result;
}
async function isDirectory(path) {
    try {
        const info = await Deno.stat(path);
        return info.isDirectory;
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return false;
        } else {
            throw err;
        }
    }
}
function parseArgs(args) {
    if (args.length === 0) {
        throw new Error("expected at least 1 argument");
    } else if (args.length > 1) {
        throw new Error("too many arguments");
    } else {
        return args[0];
    }
}
function printEnvCommand(context) {
    let args;
    if (Deno.build.os === "windows") {
        args = context.args.map((arg)=>arg.toUpperCase());
    } else {
        args = context.args;
    }
    try {
        const result = executePrintEnv(context.env, args);
        context.stdout.writeLine(result);
        if (args.some((arg)=>context.env[arg] === undefined)) {
            return resultFromCode(1);
        }
        return resultFromCode(0);
    } catch (err) {
        context.stderr.writeLine(`printenv: ${err?.message ?? err}`);
        return resultFromCode(1);
    }
}
function executePrintEnv(env, args) {
    const isWindows = Deno.build.os === "windows";
    if (args.length === 0) {
        return Object.entries(env).map(([key, val])=>`${isWindows ? key.toUpperCase() : key}=${val}`).join("\n");
    } else {
        if (isWindows) {
            args = args.map((arg)=>arg.toUpperCase());
        }
        return Object.entries(env).filter(([key])=>args.includes(key)).map(([_key, val])=>val).join("\n");
    }
}
function parseArgKinds(flags) {
    const result = [];
    let had_dash_dash = false;
    for (const arg of flags){
        if (had_dash_dash) {
            result.push({
                arg,
                kind: "Arg"
            });
        } else if (arg == "-") {
            result.push({
                arg: "-",
                kind: "Arg"
            });
        } else if (arg == "--") {
            had_dash_dash = true;
        } else if (arg.startsWith("--")) {
            result.push({
                arg: arg.replace(/^--/, ""),
                kind: "LongFlag"
            });
        } else if (arg.startsWith("-")) {
            const flags = arg.replace(/^-/, "");
            if (!isNaN(parseFloat(flags))) {
                result.push({
                    arg,
                    kind: "Arg"
                });
            } else {
                for (const c of flags){
                    result.push({
                        arg: c,
                        kind: "ShortFlag"
                    });
                }
            }
        } else {
            result.push({
                arg,
                kind: "Arg"
            });
        }
    }
    return result;
}
function bailUnsupported(arg) {
    switch(arg.kind){
        case "Arg":
            throw Error(`unsupported argument: ${arg.arg}`);
        case "ShortFlag":
            throw Error(`unsupported flag: -${arg.arg}`);
        case "LongFlag":
            throw Error(`unsupported flag: --${arg.arg}`);
    }
}
async function cpCommand(context) {
    try {
        await executeCp(context.cwd, context.args);
        return resultFromCode(0);
    } catch (err) {
        context.stderr.writeLine(`cp: ${err?.message ?? err}`);
        return resultFromCode(1);
    }
}
async function executeCp(cwd, args) {
    const flags = await parseCpArgs(cwd, args);
    for (const { from, to } of flags.operations){
        await doCopyOperation(flags, from, to);
    }
}
async function parseCpArgs(cwd, args) {
    const paths = [];
    let recursive = false;
    for (const arg of parseArgKinds(args)){
        if (arg.kind === "Arg") paths.push(arg.arg);
        else if (arg.arg === "recursive" && arg.kind === "LongFlag" || arg.arg === "r" && arg.kind == "ShortFlag" || arg.arg === "R" && arg.kind === "ShortFlag") {
            recursive = true;
        } else bailUnsupported(arg);
    }
    if (paths.length === 0) throw Error("missing file operand");
    else if (paths.length === 1) throw Error(`missing destination file operand after '${paths[0]}'`);
    return {
        recursive,
        operations: await getCopyAndMoveOperations(cwd, paths)
    };
}
async function doCopyOperation(flags, from, to) {
    const fromInfo = await safeLstat(from.path);
    if (fromInfo?.isDirectory) {
        if (flags.recursive) {
            const toInfo = await safeLstat(to.path);
            if (toInfo?.isFile) {
                throw Error("destination was a file");
            } else if (toInfo?.isSymlink) {
                throw Error("no support for copying to symlinks");
            } else if (fromInfo.isSymlink) {
                throw Error("no support for copying from symlinks");
            } else {
                await copyDirRecursively(from.path, to.path);
            }
        } else {
            throw Error("source was a directory; maybe specify -r");
        }
    } else {
        await Deno.copyFile(from.path, to.path);
    }
}
async function copyDirRecursively(from, to) {
    await Deno.mkdir(to, {
        recursive: true
    });
    const readDir = Deno.readDir(from);
    for await (const entry of readDir){
        const newFrom = mod8.join(from, mod8.basename(entry.name));
        const newTo = mod8.join(to, mod8.basename(entry.name));
        if (entry.isDirectory) {
            await copyDirRecursively(newFrom, newTo);
        } else if (entry.isFile) {
            await Deno.copyFile(newFrom, newTo);
        }
    }
}
async function mvCommand(context) {
    try {
        await executeMove(context.cwd, context.args);
        return resultFromCode(0);
    } catch (err) {
        context.stderr.writeLine(`mv: ${err?.message ?? err}`);
        return resultFromCode(1);
    }
}
async function executeMove(cwd, args) {
    const flags = await parseMvArgs(cwd, args);
    for (const { from, to } of flags.operations){
        await Deno.rename(from.path, to.path);
    }
}
async function parseMvArgs(cwd, args) {
    const paths = [];
    for (const arg of parseArgKinds(args)){
        if (arg.kind === "Arg") paths.push(arg.arg);
        else bailUnsupported(arg);
    }
    if (paths.length === 0) throw Error("missing operand");
    else if (paths.length === 1) throw Error(`missing destination file operand after '${paths[0]}'`);
    return {
        operations: await getCopyAndMoveOperations(cwd, paths)
    };
}
async function getCopyAndMoveOperations(cwd, paths) {
    const specified_destination = paths.splice(paths.length - 1, 1)[0];
    const destination = resolvePath(cwd, specified_destination);
    const fromArgs = paths;
    const operations = [];
    if (fromArgs.length > 1) {
        if (!await safeLstat(destination).then((p)=>p?.isDirectory)) {
            throw Error(`target '${specified_destination}' is not a directory`);
        }
        for (const from of fromArgs){
            const fromPath = resolvePath(cwd, from);
            const toPath = mod8.join(destination, mod8.basename(fromPath));
            operations.push({
                from: {
                    specified: from,
                    path: fromPath
                },
                to: {
                    specified: specified_destination,
                    path: toPath
                }
            });
        }
    } else {
        const fromPath = resolvePath(cwd, fromArgs[0]);
        const toPath = await safeLstat(destination).then((p)=>p?.isDirectory) ? calculateDestinationPath(destination, fromPath) : destination;
        operations.push({
            from: {
                specified: fromArgs[0],
                path: fromPath
            },
            to: {
                specified: specified_destination,
                path: toPath
            }
        });
    }
    return operations;
}
function calculateDestinationPath(destination, from) {
    return mod8.join(destination, mod8.basename(from));
}
function echoCommand(context) {
    context.stdout.writeLine(context.args.join(" "));
    return resultFromCode(0);
}
async function catCommand(context) {
    try {
        const exit_code = await executeCat(context);
        return resultFromCode(exit_code);
    } catch (err) {
        context.stderr.writeLine(`cat: ${err?.message ?? err}`);
        return resultFromCode(1);
    }
}
async function executeCat(context) {
    const flags = parseCatArgs(context.args);
    let exit_code = 0;
    const buf = new Uint8Array(1024);
    for (const path of flags.paths){
        if (path === "-") {
            if (typeof context.stdin === "object") {
                while(true){
                    const size = await context.stdin.read(buf);
                    if (!size || size === 0) break;
                    else context.stdout.writeSync(buf.slice(0, size));
                }
            } else {
                context.stdin;
                throw new Error(`not supported. stdin was '${context.stdin}'`);
            }
        } else {
            let file;
            try {
                file = Deno.openSync(mod8.join(context.cwd, path), {
                    read: true
                });
                while(true){
                    const size = file.readSync(buf);
                    if (!size || size === 0) break;
                    else context.stdout.writeSync(buf.slice(0, size));
                }
            } catch (err) {
                context.stderr.writeLine(`cat ${path}: ${err}`);
                exit_code = 1;
            } finally{
                if (file) file.close();
            }
        }
    }
    return exit_code;
}
function parseCatArgs(args) {
    const paths = [];
    for (const arg of parseArgKinds(args)){
        if (arg.kind === "Arg") paths.push(arg.arg);
        else bailUnsupported(arg);
    }
    if (paths.length === 0) paths.push("-");
    return {
        paths
    };
}
function exitCommand(context) {
    try {
        const code = parseArgs1(context.args);
        return {
            kind: "exit",
            code
        };
    } catch (err) {
        context.stderr.writeLine(`exit: ${err?.message ?? err}`);
        return {
            kind: "exit",
            code: 2
        };
    }
}
function parseArgs1(args) {
    if (args.length === 0) return 1;
    if (args.length > 1) throw new Error("too many arguments");
    const exitCode = parseInt(args[0], 10);
    if (isNaN(exitCode)) throw new Error("numeric argument required.");
    if (exitCode < 0) {
        const code = -exitCode % 256;
        return 256 - code;
    }
    return exitCode % 256;
}
function exportCommand(context) {
    const changes = [];
    for (const arg of context.args){
        const equalsIndex = arg.indexOf("=");
        if (equalsIndex >= 0) {
            changes.push({
                kind: "envvar",
                name: arg.substring(0, equalsIndex),
                value: arg.substring(equalsIndex + 1)
            });
        }
    }
    return {
        kind: "continue",
        code: 0,
        changes
    };
}
async function mkdirCommand(context) {
    try {
        await executeMkdir(context.cwd, context.args);
        return resultFromCode(0);
    } catch (err) {
        context.stderr.writeLine(`mkdir: ${err?.message ?? err}`);
        return resultFromCode(1);
    }
}
async function executeMkdir(cwd, args) {
    const flags = parseArgs2(args);
    for (const specifiedPath of flags.paths){
        const path = resolvePath(cwd, specifiedPath);
        const info = await safeLstat(path);
        if (info?.isFile || !flags.parents && info?.isDirectory) {
            throw Error(`cannot create directory '${specifiedPath}': File exists`);
        }
        if (flags.parents) {
            await Deno.mkdir(path, {
                recursive: true
            });
        } else {
            await Deno.mkdir(path);
        }
    }
}
function parseArgs2(args) {
    const result = {
        parents: false,
        paths: []
    };
    for (const arg of parseArgKinds(args)){
        if (arg.arg === "parents" && arg.kind === "LongFlag" || arg.arg === "p" && arg.kind == "ShortFlag") {
            result.parents = true;
        } else {
            if (arg.kind !== "Arg") bailUnsupported(arg);
            result.paths.push(arg.arg.trim());
        }
    }
    if (result.paths.length === 0) {
        throw Error("missing operand");
    }
    return result;
}
async function rmCommand(context) {
    try {
        await executeRemove(context.cwd, context.args);
        return resultFromCode(0);
    } catch (err) {
        context.stderr.writeLine(`rm: ${err?.message ?? err}`);
        return resultFromCode(1);
    }
}
async function executeRemove(cwd, args) {
    const flags = parseArgs3(args);
    await Promise.all(flags.paths.map((specifiedPath)=>{
        if (specifiedPath.length === 0) {
            throw new Error("Bug in dax. Specified path should have not been empty.");
        }
        const path = resolvePath(cwd, specifiedPath);
        if (path === "/") {
            throw new Error("Cannot delete root directory. Maybe bug in dax? Please report this.");
        }
        return Deno.remove(path, {
            recursive: flags.recursive
        }).catch((err)=>{
            if (flags.force && err instanceof Deno.errors.NotFound) {
                return Promise.resolve();
            } else {
                return Promise.reject(err);
            }
        });
    }));
}
function parseArgs3(args) {
    const result = {
        recursive: false,
        force: false,
        dir: false,
        paths: []
    };
    for (const arg of parseArgKinds(args)){
        if (arg.arg === "recursive" && arg.kind === "LongFlag" || arg.arg === "r" && arg.kind == "ShortFlag" || arg.arg === "R" && arg.kind === "ShortFlag") {
            result.recursive = true;
        } else if (arg.arg == "dir" && arg.kind === "LongFlag" || arg.arg == "d" && arg.kind === "ShortFlag") {
            result.dir = true;
        } else if (arg.arg == "force" && arg.kind === "LongFlag" || arg.arg == "f" && arg.kind === "ShortFlag") {
            result.force = true;
        } else {
            if (arg.kind !== "Arg") bailUnsupported1(arg);
            result.paths.push(arg.arg.trim());
        }
    }
    if (result.paths.length === 0) {
        throw Error("missing operand");
    }
    return result;
}
function bailUnsupported1(arg) {
    switch(arg.kind){
        case "Arg":
            throw Error(`unsupported argument: ${arg.arg}`);
        case "ShortFlag":
            throw Error(`unsupported flag: -${arg.arg}`);
        case "LongFlag":
            throw Error(`unsupported flag: --${arg.arg}`);
    }
}
function pwdCommand(context) {
    try {
        const output = executePwd(context.cwd, context.args);
        context.stdout.writeLine(output);
        return resultFromCode(0);
    } catch (err) {
        context.stderr.writeLine(`pwd: ${err?.message ?? err}`);
        return resultFromCode(1);
    }
}
function executePwd(cwd, args) {
    const flags = parseArgs4(args);
    if (flags.logical) {
        return mod8.resolve(cwd);
    } else {
        return cwd;
    }
}
function parseArgs4(args) {
    let logical = false;
    for (const arg of parseArgKinds(args)){
        if (arg.arg === "L" && arg.kind === "ShortFlag") {
            logical = true;
        } else if (arg.arg === "P" && arg.kind == "ShortFlag") {} else if (arg.kind === "Arg") {} else {
            bailUnsupported(arg);
        }
    }
    return {
        logical
    };
}
async function sleepCommand(context) {
    try {
        const ms = parseArgs5(context.args);
        await new Promise((resolve)=>{
            const timeoutId = setTimeout(listener, ms);
            context.signal.addEventListener("abort", listener);
            function listener() {
                resolve();
                clearInterval(timeoutId);
                context.signal.removeEventListener("abort", listener);
            }
        });
        if (context.signal.aborted) {
            return getAbortedResult();
        }
        return resultFromCode(0);
    } catch (err) {
        context.stderr.writeLine(`sleep: ${err?.message ?? err}`);
        return resultFromCode(1);
    }
}
function parseArgs5(args) {
    let totalTimeMs = 0;
    if (args.length === 0) {
        throw new Error("missing operand");
    }
    for (const arg of args){
        if (arg.startsWith("-")) {
            throw new Error(`unsupported: ${arg}`);
        }
        const value1 = parseFloat(arg);
        if (isNaN(value1)) {
            throw new Error(`error parsing argument '${arg}' to number.`);
        }
        totalTimeMs = value1 * 1000;
    }
    return totalTimeMs;
}
async function testCommand(context) {
    try {
        const [testFlag, testPath] = parseArgs6(context.cwd, context.args);
        let result;
        switch(testFlag){
            case "-f":
                result = (await safeLstat(testPath))?.isFile ?? false;
                break;
            case "-d":
                result = (await safeLstat(testPath))?.isDirectory ?? false;
                break;
            case "-e":
                result = await mod9.exists(testPath);
                break;
            case "-s":
                result = ((await safeLstat(testPath))?.size ?? 0) > 0;
                break;
            case "-L":
                result = (await safeLstat(testPath))?.isSymlink ?? false;
                break;
            default:
                throw new Error("unsupported test type");
        }
        return resultFromCode(result ? 0 : 1);
    } catch (err) {
        context.stderr.writeLine(`test: ${err?.message ?? err}`);
        return resultFromCode(2);
    }
}
function parseArgs6(cwd, args) {
    if (args.length !== 2) {
        throw new Error("expected 2 arguments");
    }
    if (args[0] == null || !args[0].startsWith("-")) {
        throw new Error("missing test type flag");
    }
    return [
        args[0],
        resolvePath(cwd, args[1])
    ];
}
async function touchCommand(context) {
    try {
        await executetouch(context.args);
        return resultFromCode(0);
    } catch (err) {
        context.stderr.writeLine(`touch: ${err?.message ?? err}`);
        return resultFromCode(1);
    }
}
async function executetouch(args) {
    const flags = parseArgs7(args);
    for (const path of flags.paths){
        const f = await Deno.create(path);
        f.close();
    }
}
function parseArgs7(args) {
    const paths = [];
    for (const arg of parseArgKinds(args)){
        if (arg.kind === "Arg") paths.push(arg.arg);
        else bailUnsupported(arg);
    }
    if (paths.length === 0) throw Error("missing file operand");
    return {
        paths
    };
}
function unsetCommand(context) {
    try {
        return {
            kind: "continue",
            code: 0,
            changes: parseNames(context.args).map((name)=>({
                    kind: "unsetvar",
                    name
                }))
        };
    } catch (err) {
        context.stderr.writeLine(`unset: ${err?.message ?? err}`);
        return resultFromCode(1);
    }
}
function parseNames(args) {
    if (args[0] === "-f") {
        throw Error(`unsupported flag: -f`);
    } else if (args[0] === "-v") {
        return args.slice(1);
    } else {
        return args;
    }
}
const encoder1 = new TextEncoder();
class NullPipeWriter {
    writeSync(p) {
        return p.length;
    }
}
class ShellPipeWriter {
    #kind;
    #inner;
    constructor(kind, inner){
        this.#kind = kind;
        this.#inner = inner;
    }
    get kind() {
        return this.#kind;
    }
    writeSync(p) {
        return this.#inner.writeSync(p);
    }
    writeText(text) {
        return writeAllSync(this, encoder1.encode(text));
    }
    writeLine(text) {
        return this.writeText(text + "\n");
    }
}
class CapturingBufferWriter {
    #buffer;
    #innerWriter;
    constructor(innerWriter, buffer){
        this.#innerWriter = innerWriter;
        this.#buffer = buffer;
    }
    getBuffer() {
        return this.#buffer;
    }
    writeSync(p) {
        const nWritten = this.#innerWriter.writeSync(p);
        this.#buffer.writeSync(p.slice(0, nWritten));
        return nWritten;
    }
}
const lineFeedCharCode = "\n".charCodeAt(0);
class InheritStaticTextBypassWriter {
    #buffer;
    #innerWriter;
    constructor(innerWriter){
        this.#innerWriter = innerWriter;
        this.#buffer = new Buffer1();
    }
    writeSync(p) {
        const index = p.findLastIndex((v)=>v === lineFeedCharCode);
        if (index === -1) {
            this.#buffer.writeSync(p);
        } else {
            this.#buffer.writeSync(p.slice(0, index + 1));
            this.flush();
            this.#buffer.writeSync(p.slice(index + 1));
        }
        return p.byteLength;
    }
    flush() {
        const bytes = this.#buffer.bytes({
            copy: false
        });
        logger.logAboveStaticText(()=>{
            writeAllSync(this.#innerWriter, bytes);
        });
        this.#buffer.reset();
    }
}
class PipedBuffer {
    #inner;
    #hasSet = false;
    constructor(){
        this.#inner = new Buffer1();
    }
    getBuffer() {
        if (this.#inner instanceof Buffer1) {
            return this.#inner;
        } else {
            return undefined;
        }
    }
    setError(err) {
        if ("setError" in this.#inner) {
            this.#inner.setError(err);
        }
    }
    close() {
        if ("close" in this.#inner) {
            this.#inner.close();
        }
    }
    writeSync(p) {
        return this.#inner.writeSync(p);
    }
    setListener(listener) {
        if (this.#hasSet) {
            throw new Error("Piping to multiple outputs is currently not supported.");
        }
        if (this.#inner instanceof Buffer1) {
            writeAllSync(listener, this.#inner.bytes({
                copy: false
            }));
        }
        this.#inner = listener;
        this.#hasSet = true;
    }
}
class RealEnv {
    setCwd(cwd) {
        Deno.chdir(cwd);
    }
    getCwd() {
        return Deno.cwd();
    }
    setEnvVar(key, value1) {
        if (value1 == null) {
            Deno.env.delete(key);
        } else {
            Deno.env.set(key, value1);
        }
    }
    getEnvVar(key) {
        return Deno.env.get(key);
    }
    getEnvVars() {
        return Deno.env.toObject();
    }
    clone() {
        return cloneEnv(this);
    }
}
class ShellEnv {
    #cwd;
    #envVars = {};
    setCwd(cwd) {
        this.#cwd = cwd;
    }
    getCwd() {
        if (this.#cwd == null) {
            throw new Error("The cwd must be initialized.");
        }
        return this.#cwd;
    }
    setEnvVar(key, value1) {
        if (Deno.build.os === "windows") {
            key = key.toUpperCase();
        }
        if (value1 == null) {
            delete this.#envVars[key];
        } else {
            this.#envVars[key] = value1;
        }
    }
    getEnvVar(key) {
        if (Deno.build.os === "windows") {
            key = key.toUpperCase();
        }
        return this.#envVars[key];
    }
    getEnvVars() {
        return {
            ...this.#envVars
        };
    }
    clone() {
        return cloneEnv(this);
    }
}
function initializeEnv(env, opts) {
    env.setCwd(opts.cwd);
    for (const [key, value1] of Object.entries(opts.env)){
        env.setEnvVar(key, value1);
    }
}
function cloneEnv(env) {
    const result = new ShellEnv();
    initializeEnv(result, {
        cwd: env.getCwd(),
        env: env.getEnvVars()
    });
    return result;
}
class Context {
    stdin;
    stdout;
    stderr;
    #env;
    #shellVars;
    #commands;
    #signal;
    constructor(opts){
        this.stdin = opts.stdin;
        this.stdout = opts.stdout;
        this.stderr = opts.stderr;
        this.#env = opts.env;
        this.#commands = opts.commands;
        this.#shellVars = opts.shellVars;
        this.#signal = opts.signal;
    }
    get signal() {
        return this.#signal;
    }
    applyChanges(changes) {
        if (changes == null) {
            return;
        }
        for (const change of changes){
            switch(change.kind){
                case "cd":
                    this.#env.setCwd(change.dir);
                    break;
                case "envvar":
                    this.setEnvVar(change.name, change.value);
                    break;
                case "shellvar":
                    this.setShellVar(change.name, change.value);
                    break;
                case "unsetvar":
                    this.setShellVar(change.name, undefined);
                    this.setEnvVar(change.name, undefined);
                    break;
                default:
                    {
                        throw new Error(`Not implemented env change: ${change}`);
                    }
            }
        }
    }
    setEnvVar(key, value1) {
        if (Deno.build.os === "windows") {
            key = key.toUpperCase();
        }
        if (key === "PWD") {
            if (value1 != null && mod8.isAbsolute(value1)) {
                this.#env.setCwd(mod8.resolve(value1));
            }
        } else {
            delete this.#shellVars[key];
            this.#env.setEnvVar(key, value1);
        }
    }
    setShellVar(key, value1) {
        if (Deno.build.os === "windows") {
            key = key.toUpperCase();
        }
        if (this.#env.getEnvVar(key) != null || key === "PWD") {
            this.setEnvVar(key, value1);
        } else if (value1 == null) {
            delete this.#shellVars[key];
        } else {
            this.#shellVars[key] = value1;
        }
    }
    getEnvVars() {
        return this.#env.getEnvVars();
    }
    getCwd() {
        return this.#env.getCwd();
    }
    getVar(key) {
        if (Deno.build.os === "windows") {
            key = key.toUpperCase();
        }
        if (key === "PWD") {
            return this.#env.getCwd();
        }
        return this.#env.getEnvVar(key) ?? this.#shellVars[key];
    }
    getCommand(command) {
        return this.#commands[command] ?? null;
    }
    asCommandContext(args) {
        const context = this;
        return {
            get args () {
                return args;
            },
            get cwd () {
                return context.getCwd();
            },
            get env () {
                return context.getEnvVars();
            },
            get stdin () {
                return context.stdin;
            },
            get stdout () {
                return context.stdout;
            },
            get stderr () {
                return context.stderr;
            },
            get signal () {
                return context.signal;
            }
        };
    }
    clone() {
        return new Context({
            stdin: this.stdin,
            stdout: this.stdout,
            stderr: this.stderr,
            env: this.#env.clone(),
            commands: {
                ...this.#commands
            },
            shellVars: {
                ...this.#shellVars
            },
            signal: this.#signal
        });
    }
}
function parseCommand(command) {
    return wasmInstance.parse(command);
}
async function spawn(list, opts) {
    const env = opts.exportEnv ? new RealEnv() : new ShellEnv();
    initializeEnv(env, opts);
    const context = new Context({
        env,
        commands: opts.commands,
        stdin: opts.stdin,
        stdout: opts.stdout,
        stderr: opts.stderr,
        shellVars: {},
        signal: opts.signal
    });
    const result = await executeSequentialList(list, context);
    return result.code;
}
async function executeSequentialList(list, context) {
    let finalExitCode = 0;
    const finalChanges = [];
    for (const item of list.items){
        if (item.isAsync) {
            throw new Error("Async commands are not supported. Run a command concurrently in the JS code instead.");
        }
        const result = await executeSequence(item.sequence, context);
        switch(result.kind){
            case "continue":
                if (result.changes) {
                    context.applyChanges(result.changes);
                    finalChanges.push(...result.changes);
                }
                finalExitCode = result.code;
                break;
            case "exit":
                return result;
            default:
        }
    }
    return {
        kind: "continue",
        code: finalExitCode,
        changes: finalChanges
    };
}
function executeSequence(sequence, context) {
    if (context.signal.aborted) {
        return Promise.resolve(getAbortedResult());
    }
    switch(sequence.kind){
        case "pipeline":
            return executePipeline(sequence, context);
        case "booleanList":
            return executeBooleanList(sequence, context);
        case "shellVar":
            return executeShellVar(sequence, context);
        default:
            {
                throw new Error(`Not implemented: ${sequence}`);
            }
    }
}
function executePipeline(pipeline, context) {
    if (pipeline.negated) {
        throw new Error("Negated pipelines are not implemented.");
    }
    return executePipelineInner(pipeline.inner, context);
}
async function executeBooleanList(list, context) {
    const changes = [];
    const firstResult = await executeSequence(list.current, context.clone());
    let exitCode = 0;
    switch(firstResult.kind){
        case "exit":
            return firstResult;
        case "continue":
            if (firstResult.changes) {
                context.applyChanges(firstResult.changes);
                changes.push(...firstResult.changes);
            }
            exitCode = firstResult.code;
            break;
        default:
            {
                throw new Error("Not handled.");
            }
    }
    const next = findNextSequence(list, exitCode);
    if (next == null) {
        return {
            kind: "continue",
            code: exitCode,
            changes
        };
    } else {
        const nextResult = await executeSequence(next, context.clone());
        switch(nextResult.kind){
            case "exit":
                return nextResult;
            case "continue":
                if (nextResult.changes) {
                    changes.push(...nextResult.changes);
                }
                return {
                    kind: "continue",
                    code: nextResult.code,
                    changes
                };
            default:
                {
                    throw new Error("Not Implemented");
                }
        }
    }
    function findNextSequence(current, exitCode) {
        if (opMovesNextForExitCode(current.op, exitCode)) {
            return current.next;
        } else {
            let next = current.next;
            while(next.kind === "booleanList"){
                if (opMovesNextForExitCode(next.op, exitCode)) {
                    return next.next;
                } else {
                    next = next.next;
                }
            }
            return undefined;
        }
    }
    function opMovesNextForExitCode(op, exitCode) {
        switch(op){
            case "or":
                return exitCode !== 0;
            case "and":
                return exitCode === 0;
        }
    }
}
async function executeShellVar(sequence, context) {
    const value1 = await evaluateWord(sequence.value, context);
    return {
        kind: "continue",
        code: 0,
        changes: [
            {
                kind: "shellvar",
                name: sequence.name,
                value: value1
            }
        ]
    };
}
function executePipelineInner(inner, context) {
    switch(inner.kind){
        case "command":
            return executeCommand(inner, context);
        case "pipeSequence":
            throw new Error(`Not implemented: ${inner.kind}`);
    }
}
function executeCommand(command, context) {
    if (command.redirect != null) {
        throw new Error("Redirects are not supported. Pipe in the JS code instead using the methods on commands.");
    }
    return executeCommandInner(command.inner, context);
}
function executeCommandInner(command, context) {
    switch(command.kind){
        case "simple":
            return executeSimpleCommand(command, context);
        case "sequentialList":
        default:
            throw new Error(`Not implemented: ${command.kind}`);
    }
}
async function executeSimpleCommand(command, parentContext) {
    const context = parentContext.clone();
    for (const envVar of command.envVars){
        context.setEnvVar(envVar.name, await evaluateWord(envVar.value, context));
    }
    const commandArgs = await evaluateArgs(command.args, context);
    return await executeCommandArgs(commandArgs, context);
}
async function executeCommandArgs(commandArgs, context) {
    const command = context.getCommand(commandArgs[0]);
    if (command != null) {
        return command(context.asCommandContext(commandArgs.slice(1)));
    }
    const resolvedCommand = await resolveCommand(commandArgs[0], context);
    if (resolvedCommand.kind === "shebang") {
        return executeCommandArgs([
            ...resolvedCommand.args,
            resolvedCommand.path,
            ...commandArgs.slice(1)
        ], context);
    }
    resolvedCommand.kind;
    const pipeStringVals = {
        stdin: getStdioStringValue(context.stdin),
        stdout: getStdioStringValue(context.stdout.kind),
        stderr: getStdioStringValue(context.stderr.kind)
    };
    const p = new Deno.Command(resolvedCommand.path, {
        args: commandArgs.slice(1),
        cwd: context.getCwd(),
        env: context.getEnvVars(),
        ...pipeStringVals
    }).spawn();
    const abortListener = ()=>p.kill("SIGKILL");
    context.signal.addEventListener("abort", abortListener);
    const completeController = new AbortController();
    const completeSignal = completeController.signal;
    let stdinError;
    const stdinPromise = writeStdin(context.stdin, p, completeSignal).catch((err)=>{
        if (completeSignal.aborted) {
            return;
        }
        context.stderr.writeLine(`stdin pipe broken. ${err}`);
        stdinError = err;
        try {
            p.kill("SIGKILL");
        } catch (err) {
            if (!(err instanceof Deno.errors.PermissionDenied || err instanceof Deno.errors.NotFound)) {
                throw err;
            }
        }
    });
    try {
        const readStdoutTask = pipeStringVals.stdout === "piped" ? readStdOutOrErr(p.stdout, context.stdout) : Promise.resolve();
        const readStderrTask = pipeStringVals.stderr === "piped" ? readStdOutOrErr(p.stderr, context.stderr) : Promise.resolve();
        const [status] = await Promise.all([
            p.status,
            readStdoutTask,
            readStderrTask
        ]);
        if (stdinError != null) {
            return {
                code: 1,
                kind: "exit"
            };
        } else if (context.signal.aborted) {
            return getAbortedResult();
        } else {
            return resultFromCode(status.code);
        }
    } finally{
        completeController.abort();
        context.signal.removeEventListener("abort", abortListener);
        await stdinPromise;
    }
    async function writeStdin(stdin, p, signal) {
        if (typeof stdin === "string") {
            return;
        }
        await pipeReaderToWriter(stdin, p.stdin, signal);
        try {
            await p.stdin.close();
        } catch  {}
    }
    async function readStdOutOrErr(readable, writer) {
        if (typeof writer === "string") {
            return;
        }
        await pipeReaderToWriterSync(readable, writer, new AbortController().signal);
    }
    async function pipeReaderToWriter(reader, writable, signal) {
        const abortedPromise = new Promise((resolve)=>{
            signal.addEventListener("abort", listener);
            function listener() {
                signal.removeEventListener("abort", listener);
                resolve();
            }
        });
        const writer = writable.getWriter();
        try {
            while(!signal.aborted){
                const buffer = new Uint8Array(1024);
                const length = await Promise.race([
                    abortedPromise,
                    reader.read(buffer)
                ]);
                if (length === 0 || length == null) {
                    break;
                }
                await writer.write(buffer.subarray(0, length));
            }
        } finally{
            await writer.close();
        }
    }
    async function pipeReaderToWriterSync(readable, writer, signal) {
        const reader = readable.getReader();
        while(!signal.aborted){
            const result = await reader.read();
            if (result.done) {
                break;
            }
            writeAllSync(result.value);
        }
        function writeAllSync(arr) {
            let nwritten = 0;
            while(nwritten < arr.length && !signal.aborted){
                nwritten += writer.writeSync(arr.subarray(nwritten));
            }
        }
    }
    function getStdioStringValue(value1) {
        if (value1 === "inheritPiped") {
            return "piped";
        } else if (value1 === "inherit" || value1 === "null" || value1 === "piped") {
            return value1;
        } else {
            return "piped";
        }
    }
}
async function resolveCommand(commandName, context) {
    if (commandName.includes("/") || commandName.includes("\\")) {
        if (!mod8.isAbsolute(commandName)) {
            commandName = mod8.resolve(context.getCwd(), commandName);
        }
        const result = await getExecutableShebangFromPath(commandName);
        if (result === false) {
            throw new Error(`Command not found: ${commandName}`);
        } else if (result != null) {
            return {
                kind: "shebang",
                path: commandName,
                args: await parseShebangArgs(result, context)
            };
        } else {
            return {
                kind: "path",
                path: commandName
            };
        }
    }
    if (commandName.toUpperCase() === "DENO") {
        return {
            kind: "path",
            path: Deno.execPath()
        };
    }
    const realEnvironment = new RealEnvironment();
    const commandPath = await which(commandName, {
        os: Deno.build.os,
        stat: realEnvironment.stat,
        env (key) {
            return context.getVar(key);
        }
    });
    if (commandPath == null) {
        throw new Error(`Command not found: ${commandName}`);
    }
    return {
        kind: "path",
        path: commandPath
    };
}
async function parseShebangArgs(info, context) {
    function throwUnsupported() {
        throw new Error("Unsupported shebang. Please report this as a bug.");
    }
    if (!info.stringSplit) {
        return [
            info.command
        ];
    }
    const command = parseCommand(info.command);
    if (command.items.length !== 1) {
        throwUnsupported();
    }
    const item = command.items[0];
    if (item.sequence.kind !== "pipeline" || item.isAsync) {
        throwUnsupported();
    }
    const sequence = item.sequence;
    if (sequence.negated) {
        throwUnsupported();
    }
    if (sequence.inner.kind !== "command" || sequence.inner.redirect != null) {
        throwUnsupported();
    }
    const innerCommand = sequence.inner.inner;
    if (innerCommand.kind !== "simple") {
        throwUnsupported();
    }
    if (innerCommand.envVars.length > 0) {
        throwUnsupported();
    }
    return await evaluateArgs(innerCommand.args, context);
}
async function evaluateArgs(args, context) {
    const result = [];
    for (const arg of args){
        result.push(...await evaluateWordParts(arg, context));
    }
    return result;
}
async function evaluateWord(word, context) {
    const result = await evaluateWordParts(word, context);
    return result.join(" ");
}
async function evaluateWordParts(wordParts, context) {
    const result = [];
    let currentText = "";
    for (const stringPart of wordParts){
        let evaluationResult = undefined;
        switch(stringPart.kind){
            case "text":
                currentText += stringPart.value;
                break;
            case "variable":
                evaluationResult = context.getVar(stringPart.value);
                break;
            case "quoted":
                {
                    const text = (await evaluateWordParts(stringPart.value, context)).join(" ");
                    currentText += text;
                    continue;
                }
            case "command":
            default:
                throw new Error(`Not implemented: ${stringPart.kind}`);
        }
        if (evaluationResult != null) {
            const parts = evaluationResult.split(" ").map((t)=>t.trim()).filter((t)=>t.length > 0);
            if (parts.length > 0) {
                currentText += parts[0];
                result.push(currentText);
                result.push(...parts.slice(1));
                currentText = result.pop();
            }
        }
    }
    if (currentText.length !== 0) {
        result.push(currentText);
    }
    return result;
}
const PERIOD_CHAR_CODE = ".".charCodeAt(0);
function createPathRef(path) {
    if (path instanceof PathRef) {
        return path;
    } else {
        return new PathRef(path);
    }
}
class PathRef {
    #path;
    #knownResolved = false;
    static instanceofSymbol = Symbol.for("dax.PathRef");
    constructor(path){
        if (path instanceof URL) {
            this.#path = mod8.fromFileUrl(path);
        } else if (path instanceof PathRef) {
            this.#path = path.toString();
        } else if (typeof path === "string") {
            if (path.startsWith("file://")) {
                this.#path = mod8.fromFileUrl(path);
            } else {
                this.#path = path;
            }
        } else {
            this.#path = mod8.fromFileUrl(path.url);
        }
    }
    static [Symbol.hasInstance](instance) {
        return instance?.constructor?.instanceofSymbol === PathRef.instanceofSymbol;
    }
    [Symbol.for("Deno.customInspect")]() {
        return `PathRef("${this.#path}")`;
    }
    toString() {
        return this.#path;
    }
    toFileUrl() {
        const resolvedPath = this.resolve();
        return mod8.toFileUrl(resolvedPath.toString());
    }
    equals(otherPath) {
        return this.resolve().toString() === otherPath.resolve().toString();
    }
    join(...pathSegments) {
        return new PathRef(mod8.join(this.#path, ...pathSegments));
    }
    resolve(...pathSegments) {
        if (this.#knownResolved && pathSegments.length === 0) {
            return this;
        }
        const resolvedPath = mod8.resolve(this.#path, ...pathSegments);
        if (pathSegments.length === 0 && resolvedPath === this.#path) {
            this.#knownResolved = true;
            return this;
        } else {
            const pathRef = new PathRef(resolvedPath);
            pathRef.#knownResolved = true;
            return pathRef;
        }
    }
    normalize() {
        return new PathRef(mod8.normalize(this.#path));
    }
    isDir() {
        return this.statSync()?.isDirectory ?? false;
    }
    isFile() {
        return this.statSync()?.isFile ?? false;
    }
    isSymlink() {
        return this.lstatSync()?.isSymlink ?? false;
    }
    isAbsolute() {
        return mod8.isAbsolute(this.#path);
    }
    isRelative() {
        return !this.isAbsolute();
    }
    async stat() {
        try {
            return await Deno.stat(this.#path);
        } catch (err) {
            if (err instanceof Deno.errors.NotFound) {
                return undefined;
            } else {
                throw err;
            }
        }
    }
    statSync() {
        try {
            return Deno.statSync(this.#path);
        } catch (err) {
            if (err instanceof Deno.errors.NotFound) {
                return undefined;
            } else {
                throw err;
            }
        }
    }
    async lstat() {
        try {
            return await Deno.lstat(this.#path);
        } catch (err) {
            if (err instanceof Deno.errors.NotFound) {
                return undefined;
            } else {
                throw err;
            }
        }
    }
    lstatSync() {
        try {
            return Deno.lstatSync(this.#path);
        } catch (err) {
            if (err instanceof Deno.errors.NotFound) {
                return undefined;
            } else {
                throw err;
            }
        }
    }
    dirname() {
        return mod8.dirname(this.#path);
    }
    basename() {
        return mod8.basename(this.#path);
    }
    *ancestors() {
        let ancestor = this.parent();
        while(ancestor != null){
            yield ancestor;
            ancestor = ancestor.parent();
        }
    }
    parent() {
        const resolvedPath = this.resolve();
        const dirname = resolvedPath.dirname();
        if (dirname === resolvedPath.#path) {
            return undefined;
        } else {
            return new PathRef(dirname);
        }
    }
    parentOrThrow() {
        const parent = this.parent();
        if (parent == null) {
            throw new Error(`Cannot get the parent directory of '${this.#path}'.`);
        }
        return parent;
    }
    extname() {
        const extName = mod8.extname(this.#path);
        return extName.length === 0 ? undefined : extName;
    }
    withExtname(ext) {
        const currentExt = this.extname();
        const hasLeadingPeriod = ext.charCodeAt(0) === PERIOD_CHAR_CODE;
        if (!hasLeadingPeriod) {
            ext = "." + ext;
        }
        return new PathRef(this.#path.substring(0, this.#path.length - (currentExt?.length ?? 0)) + ext);
    }
    withBasename(basename) {
        const currentBaseName = this.basename();
        return new PathRef(this.#path.substring(0, this.#path.length - currentBaseName.length) + basename);
    }
    relative(to) {
        const toPathRef = ensurePathRef(to);
        console.log(this.resolve().#path, toPathRef.resolve().#path);
        console.log(mod8.relative(this.resolve().#path, toPathRef.resolve().#path));
        return mod8.relative(this.resolve().#path, toPathRef.resolve().#path);
    }
    exists() {
        return this.lstat().then((info)=>info != null);
    }
    existsSync() {
        return this.lstatSync() != null;
    }
    realPath() {
        return Deno.realPath(this.#path).then((path)=>new PathRef(path));
    }
    realPathSync() {
        return new PathRef(Deno.realPathSync(this.#path));
    }
    async *expandGlob(glob, options) {
        const entries = mod9.expandGlob(glob, {
            root: this.resolve().toString(),
            ...options
        });
        for await (const entry of entries){
            yield this.#stdWalkEntryToDax(entry);
        }
    }
    *expandGlobSync(glob, options) {
        const entries = mod9.expandGlobSync(glob, {
            root: this.resolve().toString(),
            ...options
        });
        for (const entry of entries){
            yield this.#stdWalkEntryToDax(entry);
        }
    }
    async *walk(options) {
        for await (const entry of mod9.walk(this.resolve().toString(), options)){
            yield this.#stdWalkEntryToDax(entry);
        }
    }
    *walkSync(options) {
        for (const entry of mod9.walkSync(this.resolve().toString(), options)){
            yield this.#stdWalkEntryToDax(entry);
        }
    }
    #stdWalkEntryToDax(entry) {
        return {
            ...entry,
            path: new PathRef(entry.path)
        };
    }
    async mkdir(options) {
        await Deno.mkdir(this.#path, {
            recursive: true,
            ...options
        });
        return this;
    }
    mkdirSync(options) {
        Deno.mkdirSync(this.#path, {
            recursive: true,
            ...options
        });
        return this;
    }
    async createSymlinkTo(target, opts) {
        await createSymlink(this.#resolveCreateSymlinkOpts(target, opts));
    }
    createSymlinkToSync(target, opts) {
        createSymlinkSync(this.#resolveCreateSymlinkOpts(target, opts));
    }
    #resolveCreateSymlinkOpts(target, opts) {
        if (opts?.kind == null) {
            if (typeof target === "string") {
                return {
                    fromPath: this.resolve(),
                    targetPath: ensurePathRef(target),
                    text: target,
                    type: opts?.type
                };
            } else {
                throw new Error("Please specify if this symlink is absolute or relative. Otherwise provide the target text.");
            }
        }
        const targetPath = ensurePathRef(target).resolve();
        if (opts?.kind === "relative") {
            const fromPath = this.resolve();
            let relativePath;
            if (fromPath.dirname() === targetPath.dirname()) {
                relativePath = targetPath.basename();
            } else {
                relativePath = fromPath.relative(targetPath);
            }
            return {
                fromPath,
                targetPath,
                text: relativePath,
                type: opts?.type
            };
        } else {
            return {
                fromPath: this.resolve(),
                targetPath,
                text: targetPath.#path,
                type: opts?.type
            };
        }
    }
    async *readDir() {
        const dir = this.resolve();
        for await (const entry of Deno.readDir(dir.#path)){
            yield {
                ...entry,
                path: dir.join(entry.name)
            };
        }
    }
    *readDirSync() {
        const dir = this.resolve();
        for (const entry of Deno.readDirSync(dir.#path)){
            yield {
                ...entry,
                path: dir.join(entry.name)
            };
        }
    }
    async *readDirFilePaths() {
        const dir = this.resolve();
        for await (const entry of Deno.readDir(dir.#path)){
            if (entry.isFile) {
                yield dir.join(entry.name);
            }
        }
    }
    *readDirFilePathsSync() {
        const dir = this.resolve();
        for (const entry of Deno.readDirSync(dir.#path)){
            if (entry.isFile) {
                yield dir.join(entry.name);
            }
        }
    }
    readBytes(options) {
        return Deno.readFile(this.#path, options);
    }
    readBytesSync() {
        return Deno.readFileSync(this.#path);
    }
    readMaybeBytes(options) {
        return notFoundToUndefined(()=>this.readBytes(options));
    }
    readMaybeBytesSync() {
        return notFoundToUndefinedSync(()=>this.readBytesSync());
    }
    readText(options) {
        return Deno.readTextFile(this.#path, options);
    }
    readTextSync() {
        return Deno.readTextFileSync(this.#path);
    }
    readMaybeText(options) {
        return notFoundToUndefined(()=>this.readText(options));
    }
    readMaybeTextSync() {
        return notFoundToUndefinedSync(()=>this.readTextSync());
    }
    async readJson(options) {
        return this.#parseJson(await this.readText(options));
    }
    readJsonSync() {
        return this.#parseJson(this.readTextSync());
    }
    #parseJson(text) {
        try {
            return JSON.parse(text);
        } catch (err) {
            throw new Error(`Failed parsing JSON in '${this.toString()}'.`, {
                cause: err
            });
        }
    }
    readMaybeJson(options) {
        return notFoundToUndefined(()=>this.readJson(options));
    }
    readMaybeJsonSync() {
        return notFoundToUndefinedSync(()=>this.readJsonSync());
    }
    async write(data, options) {
        await this.#withFileForWriting(options, (file)=>file.write(data));
        return this;
    }
    writeSync(data, options) {
        this.#withFileForWritingSync(options, (file)=>{
            file.writeSync(data);
        });
        return this;
    }
    async writeText(text, options) {
        await this.#withFileForWriting(options, (file)=>file.writeText(text));
        return this;
    }
    writeTextSync(text, options) {
        this.#withFileForWritingSync(options, (file)=>{
            file.writeTextSync(text);
        });
        return this;
    }
    async writeJson(obj, options) {
        const text = JSON.stringify(obj);
        await this.#writeTextWithEndNewLine(text, options);
        return this;
    }
    writeJsonSync(obj, options) {
        const text = JSON.stringify(obj);
        this.#writeTextWithEndNewLineSync(text, options);
        return this;
    }
    async writeJsonPretty(obj, options) {
        const text = JSON.stringify(obj, undefined, 2);
        await this.#writeTextWithEndNewLine(text, options);
        return this;
    }
    writeJsonPrettySync(obj, options) {
        const text = JSON.stringify(obj, undefined, 2);
        this.#writeTextWithEndNewLineSync(text, options);
        return this;
    }
    #writeTextWithEndNewLine(text, options) {
        return this.#withFileForWriting(options, async (file)=>{
            await file.writeText(text);
            await file.writeText("\n");
        });
    }
    async #withFileForWriting(options, action) {
        const file = await this.#openFileForWriting(options);
        try {
            return await action(file);
        } finally{
            try {
                file.close();
            } catch  {}
        }
    }
    async #openFileForWriting(options) {
        const resolvedPath = this.resolve();
        try {
            return await resolvedPath.open({
                write: true,
                create: true,
                truncate: true,
                ...options
            });
        } catch (err) {
            if (err instanceof Deno.errors.NotFound) {
                const parent = resolvedPath.parent();
                if (parent != null) {
                    try {
                        await parent.mkdir();
                    } catch  {
                        throw err;
                    }
                }
                return await resolvedPath.open({
                    write: true,
                    create: true,
                    truncate: true,
                    ...options
                });
            } else {
                throw err;
            }
        }
    }
    #writeTextWithEndNewLineSync(text, options) {
        this.#withFileForWritingSync(options, (file)=>{
            file.writeTextSync(text);
            file.writeTextSync("\n");
        });
    }
    #withFileForWritingSync(options, action) {
        const file = this.#openFileForWritingSync(options);
        try {
            return action(file);
        } finally{
            try {
                file.close();
            } catch  {}
        }
    }
    #openFileForWritingSync(options) {
        try {
            return this.openSync({
                write: true,
                create: true,
                truncate: true,
                ...options
            });
        } catch (err) {
            if (err instanceof Deno.errors.NotFound) {
                const parent = this.resolve().parent();
                if (parent != null) {
                    try {
                        parent.mkdirSync();
                    } catch  {
                        throw err;
                    }
                }
                return this.openSync({
                    write: true,
                    create: true,
                    truncate: true,
                    ...options
                });
            } else {
                throw err;
            }
        }
    }
    async chmod(mode) {
        await Deno.chmod(this.#path, mode);
        return this;
    }
    chmodSync(mode) {
        Deno.chmodSync(this.#path, mode);
        return this;
    }
    async chown(uid, gid) {
        await Deno.chown(this.#path, uid, gid);
        return this;
    }
    chownSync(uid, gid) {
        Deno.chownSync(this.#path, uid, gid);
        return this;
    }
    create() {
        return Deno.create(this.#path).then((file)=>new FsFileWrapper(file));
    }
    createSync() {
        return new FsFileWrapper(Deno.createSync(this.#path));
    }
    createNew() {
        return this.open({
            createNew: true,
            read: true,
            write: true
        });
    }
    createNewSync() {
        return this.openSync({
            createNew: true,
            read: true,
            write: true
        });
    }
    open(options) {
        return Deno.open(this.#path, options).then((file)=>new FsFileWrapper(file));
    }
    openSync(options) {
        return new FsFileWrapper(Deno.openSync(this.#path, options));
    }
    async remove(options) {
        await Deno.remove(this.#path, options);
        return this;
    }
    removeSync(options) {
        Deno.removeSync(this.#path, options);
        return this;
    }
    async emptyDir() {
        await mod9.emptyDir(this.toString());
        return this;
    }
    emptyDirSync() {
        mod9.emptyDirSync(this.toString());
        return this;
    }
    copyFile(destinationPath) {
        const pathRef = ensurePathRef(destinationPath);
        return Deno.copyFile(this.#path, pathRef.#path).then(()=>pathRef);
    }
    copyFileSync(destinationPath) {
        const pathRef = ensurePathRef(destinationPath);
        Deno.copyFileSync(this.#path, pathRef.#path);
        return pathRef;
    }
    copyFileToDir(destinationDirPath) {
        const destinationPath = ensurePathRef(destinationDirPath).join(this.basename());
        return this.copyFile(destinationPath);
    }
    copyFileToDirSync(destinationDirPath) {
        const destinationPath = ensurePathRef(destinationDirPath).join(this.basename());
        return this.copyFileSync(destinationPath);
    }
    rename(newPath) {
        const pathRef = ensurePathRef(newPath);
        return Deno.rename(this.#path, pathRef.#path).then(()=>pathRef);
    }
    renameSync(newPath) {
        const pathRef = ensurePathRef(newPath);
        Deno.renameSync(this.#path, pathRef.#path);
        return pathRef;
    }
    async pipeTo(dest, options) {
        const file = await Deno.open(this.#path, {
            read: true
        });
        try {
            await file.readable.pipeTo(dest, options);
        } finally{
            try {
                file.close();
            } catch  {}
        }
        return this;
    }
}
function ensurePathRef(path) {
    return path instanceof PathRef ? path : new PathRef(path);
}
async function createSymlink(opts) {
    let kind = opts.type;
    if (kind == null && Deno.build.os === "windows") {
        const info = await opts.targetPath.lstat();
        if (info?.isDirectory) {
            kind = "dir";
        } else if (info?.isFile) {
            kind = "file";
        } else {
            throw new Deno.errors.NotFound(`The target path '${opts.targetPath}' did not exist or path kind could not be determined. ` + `When the path doesn't exist, you need to specify a symlink type on Windows.`);
        }
    }
    await Deno.symlink(opts.text, opts.fromPath.toString(), kind == null ? undefined : {
        type: kind
    });
}
function createSymlinkSync(opts) {
    let kind = opts.type;
    if (kind == null && Deno.build.os === "windows") {
        const info = opts.targetPath.lstatSync();
        if (info?.isDirectory) {
            kind = "dir";
        } else if (info?.isFile) {
            kind = "file";
        } else {
            throw new Deno.errors.NotFound(`The target path '${opts.targetPath}' did not exist or path kind could not be determined. ` + `When the path doesn't exist, you need to specify a symlink type on Windows.`);
        }
    }
    Deno.symlinkSync(opts.text, opts.fromPath.toString(), kind == null ? undefined : {
        type: kind
    });
}
class FsFileWrapper {
    #file;
    constructor(file){
        this.#file = file;
    }
    get inner() {
        return this.#file;
    }
    writeText(text) {
        return this.writeBytes(new TextEncoder().encode(text));
    }
    writeTextSync(text) {
        return this.writeBytesSync(new TextEncoder().encode(text));
    }
    async writeBytes(bytes) {
        await writeAll(this.#file, bytes);
        return this;
    }
    writeBytesSync(bytes) {
        writeAllSync(this.#file, bytes);
        return this;
    }
    get rid() {
        return this.#file.rid;
    }
    get readable() {
        return this.#file.readable;
    }
    get writable() {
        return this.#file.writable;
    }
    write(p) {
        return this.#file.write(p);
    }
    writeSync(p) {
        return this.#file.writeSync(p);
    }
    truncate(len) {
        return this.#file.truncate(len);
    }
    truncateSync(len) {
        return this.#file.truncateSync(len);
    }
    read(p) {
        return this.#file.read(p);
    }
    readSync(p) {
        return this.#file.readSync(p);
    }
    seek(offset, whence) {
        return this.#file.seek(offset, whence);
    }
    seekSync(offset, whence) {
        return this.#file.seekSync(offset, whence);
    }
    stat() {
        return this.#file.stat();
    }
    statSync() {
        return this.#file.statSync();
    }
    close() {
        return this.#file.close();
    }
}
async function notFoundToUndefined(action) {
    try {
        return await action();
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return undefined;
        } else {
            throw err;
        }
    }
}
function notFoundToUndefinedSync(action) {
    try {
        return action();
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return undefined;
        } else {
            throw err;
        }
    }
}
const textDecoder = new TextDecoder();
const builtInCommands = {
    cd: cdCommand,
    printenv: printEnvCommand,
    echo: echoCommand,
    cat: catCommand,
    exit: exitCommand,
    export: exportCommand,
    sleep: sleepCommand,
    test: testCommand,
    rm: rmCommand,
    mkdir: mkdirCommand,
    cp: cpCommand,
    mv: mvCommand,
    pwd: pwdCommand,
    touch: touchCommand,
    unset: unsetCommand
};
const getRegisteredCommandNamesSymbol = Symbol();
class CommandBuilder {
    #state = {
        command: undefined,
        combinedStdoutStderr: false,
        stdin: "inherit",
        stdoutKind: "inherit",
        stderrKind: "inherit",
        noThrow: false,
        env: {},
        cwd: undefined,
        commands: {
            ...builtInCommands
        },
        exportEnv: false,
        printCommand: false,
        printCommandLogger: new LoggerTreeBox(console.error),
        timeout: undefined
    };
    #getClonedState() {
        const state = this.#state;
        return {
            command: state.command,
            combinedStdoutStderr: state.combinedStdoutStderr,
            stdin: state.stdin,
            stdoutKind: state.stdoutKind,
            stderrKind: state.stderrKind,
            noThrow: state.noThrow,
            env: {
                ...state.env
            },
            cwd: state.cwd,
            commands: {
                ...state.commands
            },
            exportEnv: state.exportEnv,
            printCommand: state.printCommand,
            printCommandLogger: state.printCommandLogger.createChild(),
            timeout: state.timeout
        };
    }
    #newWithState(action) {
        const builder = new CommandBuilder();
        const state = this.#getClonedState();
        action(state);
        builder.#state = state;
        return builder;
    }
    then(onfulfilled, onrejected) {
        return this.spawn().then(onfulfilled).catch(onrejected);
    }
    spawn() {
        return parseAndSpawnCommand(this.#getClonedState());
    }
    registerCommand(command, handleFn) {
        validateCommandName(command);
        return this.#newWithState((state)=>{
            state.commands[command] = handleFn;
        });
    }
    registerCommands(commands) {
        let command = this;
        for (const [key, value1] of Object.entries(commands)){
            command = command.registerCommand(key, value1);
        }
        return command;
    }
    unregisterCommand(command) {
        return this.#newWithState((state)=>{
            delete state.commands[command];
        });
    }
    command(command) {
        return this.#newWithState((state)=>{
            if (typeof command === "string") {
                state.command = command;
            } else {
                state.command = command.map(escapeArg).join(" ");
            }
        });
    }
    noThrow(value1 = true) {
        return this.#newWithState((state)=>{
            state.noThrow = value1;
        });
    }
    captureCombined(value1 = true) {
        return this.#newWithState((state)=>{
            state.combinedStdoutStderr = value1;
            if (value1) {
                if (state.stdoutKind !== "piped" && state.stdoutKind !== "inheritPiped") {
                    state.stdoutKind = "piped";
                }
                if (state.stderrKind !== "piped" && state.stderrKind !== "inheritPiped") {
                    state.stderrKind = "piped";
                }
            }
        });
    }
    stdin(reader) {
        return this.#newWithState((state)=>{
            if (reader === "inherit" || reader === "null") {
                state.stdin = reader;
            } else if (reader instanceof Uint8Array) {
                state.stdin = new Box(new Buffer1(reader));
            } else {
                state.stdin = new Box(reader);
            }
        });
    }
    stdinText(text) {
        return this.stdin(new TextEncoder().encode(text));
    }
    stdout(kind) {
        return this.#newWithState((state)=>{
            if (state.combinedStdoutStderr && kind !== "piped" && kind !== "inheritPiped") {
                throw new Error("Cannot set stdout's kind to anything but 'piped' or 'inheritPiped' when combined is true.");
            }
            state.stdoutKind = kind;
        });
    }
    stderr(kind) {
        return this.#newWithState((state)=>{
            if (state.combinedStdoutStderr && kind !== "piped" && kind !== "inheritPiped") {
                throw new Error("Cannot set stderr's kind to anything but 'piped' or 'inheritPiped' when combined is true.");
            }
            state.stderrKind = kind;
        });
    }
    env(nameOrItems, value1) {
        return this.#newWithState((state)=>{
            if (typeof nameOrItems === "string") {
                setEnv(state, nameOrItems, value1);
            } else {
                for (const [key, value1] of Object.entries(nameOrItems)){
                    setEnv(state, key, value1);
                }
            }
        });
        function setEnv(state, key, value1) {
            if (Deno.build.os === "windows") {
                key = key.toUpperCase();
            }
            state.env[key] = value1;
        }
    }
    cwd(dirPath) {
        return this.#newWithState((state)=>{
            state.cwd = dirPath instanceof URL ? mod8.fromFileUrl(dirPath) : dirPath instanceof PathRef ? dirPath.resolve().toString() : mod8.resolve(dirPath);
        });
    }
    exportEnv(value1 = true) {
        return this.#newWithState((state)=>{
            state.exportEnv = value1;
        });
    }
    printCommand(value1 = true) {
        return this.#newWithState((state)=>{
            state.printCommand = value1;
        });
    }
    setPrintCommandLogger(logger) {
        this.#state.printCommandLogger.setValue(logger);
    }
    quiet(kind = "both") {
        return this.#newWithState((state)=>{
            if (kind === "both" || kind === "stdout") {
                state.stdoutKind = getQuietKind(state.stdoutKind);
            }
            if (kind === "both" || kind === "stderr") {
                state.stderrKind = getQuietKind(state.stderrKind);
            }
        });
        function getQuietKind(kind) {
            switch(kind){
                case "inheritPiped":
                case "inherit":
                    return "piped";
                case "null":
                case "piped":
                    return kind;
                default:
                    {
                        throw new Error(`Unhandled kind ${kind}.`);
                    }
            }
        }
    }
    timeout(delay) {
        return this.#newWithState((state)=>{
            state.timeout = delay == null ? undefined : delayToMs(delay);
        });
    }
    async bytes() {
        return (await this.quiet("stdout")).stdoutBytes;
    }
    async text() {
        return (await this.quiet("stdout")).stdout.replace(/\r?\n$/, "");
    }
    async lines() {
        const text = await this.text();
        return text.split(/\r?\n/g);
    }
    async json() {
        return (await this.quiet("stdout")).stdoutJson;
    }
    [getRegisteredCommandNamesSymbol]() {
        return Object.keys(this.#state.commands);
    }
}
class CommandChild extends Promise {
    #pipedStdoutBuffer;
    #pipedStderrBuffer;
    #abortController;
    constructor(executor, options = {
        pipedStderrBuffer: undefined,
        pipedStdoutBuffer: undefined,
        abortController: undefined
    }){
        super(executor);
        this.#pipedStdoutBuffer = options.pipedStdoutBuffer;
        this.#pipedStderrBuffer = options.pipedStderrBuffer;
        this.#abortController = options.abortController;
    }
    abort() {
        this.#abortController?.abort();
    }
    stdout() {
        const buffer = this.#pipedStdoutBuffer;
        this.#assertBufferStreamable("stdout", buffer);
        this.#pipedStdoutBuffer = "consumed";
        this.catch(()=>{});
        return this.#bufferToStream(buffer);
    }
    stderr() {
        const buffer = this.#pipedStderrBuffer;
        this.#assertBufferStreamable("stderr", buffer);
        this.#pipedStderrBuffer = "consumed";
        this.catch(()=>{});
        return this.#bufferToStream(buffer);
    }
    #assertBufferStreamable(name, buffer) {
        if (buffer == null) {
            throw new Error(`No pipe available. Ensure ${name} is "piped" (not "inheritPiped") and combinedOutput is not enabled.`);
        }
        if (buffer === "consumed") {
            throw new Error(`Streamable ${name} was already consumed. Use the previously acquired stream instead.`);
        }
    }
    #bufferToStream(buffer) {
        return new ReadableStream({
            start (controller) {
                buffer.setListener({
                    writeSync (data) {
                        controller.enqueue(data);
                        return data.length;
                    },
                    setError (err) {
                        controller.error(err);
                    },
                    close () {
                        controller.close();
                    }
                });
            }
        });
    }
}
function parseAndSpawnCommand(state) {
    if (state.command == null) {
        throw new Error("A command must be set before it can be spawned.");
    }
    if (state.printCommand) {
        state.printCommandLogger.getValue()(mod5.white(">"), mod5.blue(state.command));
    }
    const [stdoutBuffer, stderrBuffer, combinedBuffer] = getBuffers();
    const stdout = new ShellPipeWriter(state.stdoutKind, stdoutBuffer === "null" ? new NullPipeWriter() : stdoutBuffer === "inherit" ? Deno.stdout : stdoutBuffer);
    const stderr = new ShellPipeWriter(state.stderrKind, stderrBuffer === "null" ? new NullPipeWriter() : stderrBuffer === "inherit" ? Deno.stderr : stderrBuffer);
    const abortController = new AbortController();
    const abortSignal = abortController.signal;
    let timeoutId;
    let timedOut = false;
    if (state.timeout != null) {
        timeoutId = setTimeout(()=>{
            timedOut = true;
            abortController.abort();
        }, state.timeout);
    }
    const command = state.command;
    return new CommandChild(async (resolve, reject)=>{
        try {
            const list = parseCommand(command);
            const stdin = takeStdin();
            const code = await spawn(list, {
                stdin: stdin instanceof ReadableStream ? readerFromStreamReader(stdin.getReader()) : stdin,
                stdout,
                stderr,
                env: buildEnv(state.env),
                commands: state.commands,
                cwd: state.cwd ?? Deno.cwd(),
                exportEnv: state.exportEnv,
                signal: abortSignal
            });
            if (code !== 0 && !state.noThrow) {
                if (stdin instanceof ReadableStream) {
                    if (!stdin.locked) {
                        stdin.cancel();
                    }
                }
                if (abortSignal.aborted) {
                    throw new Error(`${timedOut ? "Timed out" : "Aborted"} with exit code: ${code}`);
                } else {
                    throw new Error(`Exited with code: ${code}`);
                }
            }
            resolve(new CommandResult(code, finalizeCommandResultBuffer(stdoutBuffer), finalizeCommandResultBuffer(stderrBuffer), combinedBuffer instanceof Buffer1 ? combinedBuffer : undefined));
        } catch (err) {
            finalizeCommandResultBufferForError(stdoutBuffer, err);
            finalizeCommandResultBufferForError(stderrBuffer, err);
            reject(err);
        } finally{
            if (timeoutId != null) {
                clearTimeout(timeoutId);
            }
        }
    }, {
        pipedStdoutBuffer: stdoutBuffer instanceof PipedBuffer ? stdoutBuffer : undefined,
        pipedStderrBuffer: stderrBuffer instanceof PipedBuffer ? stderrBuffer : undefined,
        abortController
    });
    function takeStdin() {
        if (state.stdin instanceof Box) {
            const stdin = state.stdin.value;
            if (stdin === "consumed") {
                throw new Error("Cannot spawn command. Stdin was already consumed when a previous command using " + "the same stdin was spawned. You need to call `.stdin(...)` again with a new " + "value before spawning.");
            }
            state.stdin.value = "consumed";
            return stdin;
        } else {
            return state.stdin;
        }
    }
    function getBuffers() {
        const hasProgressBars = isShowingProgressBars();
        const stdoutBuffer = getOutputBuffer(Deno.stdout, state.stdoutKind);
        const stderrBuffer = getOutputBuffer(Deno.stderr, state.stderrKind);
        if (state.combinedStdoutStderr) {
            if (typeof stdoutBuffer === "string" || typeof stderrBuffer === "string") {
                throw new Error("Internal programming error. Expected writers for stdout and stderr.");
            }
            const combinedBuffer = new Buffer1();
            return [
                new CapturingBufferWriter(stdoutBuffer, combinedBuffer),
                new CapturingBufferWriter(stderrBuffer, combinedBuffer),
                combinedBuffer
            ];
        }
        return [
            stdoutBuffer,
            stderrBuffer,
            undefined
        ];
        function getOutputBuffer(innerWriter, kind) {
            switch(kind){
                case "inherit":
                    if (hasProgressBars) {
                        return new InheritStaticTextBypassWriter(innerWriter);
                    } else {
                        return "inherit";
                    }
                case "piped":
                    return new PipedBuffer();
                case "inheritPiped":
                    return new CapturingBufferWriter(innerWriter, new Buffer1());
                case "null":
                    return "null";
                default:
                    {
                        throw new Error("Unhandled.");
                    }
            }
        }
    }
    function finalizeCommandResultBuffer(buffer) {
        if (buffer instanceof CapturingBufferWriter) {
            return buffer.getBuffer();
        } else if (buffer instanceof InheritStaticTextBypassWriter) {
            buffer.flush();
            return "inherit";
        } else if (buffer instanceof PipedBuffer) {
            buffer.close();
            return buffer.getBuffer() ?? "streamed";
        } else {
            return buffer;
        }
    }
    function finalizeCommandResultBufferForError(buffer, error) {
        if (buffer instanceof InheritStaticTextBypassWriter) {
            buffer.flush();
        } else if (buffer instanceof PipedBuffer) {
            buffer.setError(error);
        }
    }
}
class CommandResult {
    #stdout;
    #stderr;
    #combined;
    code;
    constructor(code, stdout, stderr, combined){
        this.code = code;
        this.#stdout = stdout;
        this.#stderr = stderr;
        this.#combined = combined;
    }
    #memoizedStdout;
    get stdout() {
        if (!this.#memoizedStdout) {
            this.#memoizedStdout = textDecoder.decode(this.stdoutBytes);
        }
        return this.#memoizedStdout;
    }
    #memoizedStdoutJson;
    get stdoutJson() {
        if (this.#memoizedStdoutJson == null) {
            this.#memoizedStdoutJson = JSON.parse(this.stdout);
        }
        return this.#memoizedStdoutJson;
    }
    get stdoutBytes() {
        if (this.#stdout === "streamed") {
            throw new Error(`Stdout was streamed to another source and is no longer available.`);
        }
        if (typeof this.#stdout === "string") {
            throw new Error(`Stdout was not piped (was ${this.#stdout}). Call .stdout("piped") or .stdout("capture") when building the command.`);
        }
        return this.#stdout.bytes({
            copy: false
        });
    }
    #memoizedStderr;
    get stderr() {
        if (!this.#memoizedStderr) {
            this.#memoizedStderr = textDecoder.decode(this.stderrBytes);
        }
        return this.#memoizedStderr;
    }
    #memoizedStderrJson;
    get stderrJson() {
        if (this.#memoizedStderrJson == null) {
            this.#memoizedStderrJson = JSON.parse(this.stderr);
        }
        return this.#memoizedStderrJson;
    }
    get stderrBytes() {
        if (this.#stdout === "streamed") {
            throw new Error(`Stderr was streamed to another source and is no longer available.`);
        }
        if (typeof this.#stderr === "string") {
            throw new Error(`Stderr was not piped (was ${this.#stderr}). Call .stderr("piped") or .stderr("capture") when building the command.`);
        }
        return this.#stderr.bytes({
            copy: false
        });
    }
    #memoizedCombined;
    get combined() {
        if (!this.#memoizedCombined) {
            this.#memoizedCombined = textDecoder.decode(this.combinedBytes);
        }
        return this.#memoizedCombined;
    }
    get combinedBytes() {
        if (this.#combined == null) {
            throw new Error("Stdout and stderr were not combined. Call .captureCombined() when building the command.");
        }
        return this.#combined.bytes({
            copy: false
        });
    }
}
function buildEnv(env) {
    const result = Deno.env.toObject();
    for (const [key, value1] of Object.entries(env)){
        if (value1 == null) {
            delete result[key];
        } else {
            result[key] = value1;
        }
    }
    return result;
}
function escapeArg(arg) {
    if (/^[A-Za-z0-9]*$/.test(arg)) {
        return arg;
    } else {
        return `'${arg.replace("'", `'"'"'`)}'`;
    }
}
function validateCommandName(command) {
    if (command.match(/^[a-zA-Z0-9-_]+$/) == null) {
        throw new Error("Invalid command name");
    }
}
const withProgressBarFactorySymbol = Symbol();
class RequestBuilder {
    #state = undefined;
    #getClonedState() {
        const state = this.#state;
        if (state == null) {
            return this.#getDefaultState();
        }
        return {
            noThrow: typeof state.noThrow === "boolean" ? state.noThrow : [
                ...state.noThrow
            ],
            url: state.url,
            body: state.body,
            cache: state.cache,
            headers: state.headers,
            integrity: state.integrity,
            keepalive: state.keepalive,
            method: state.method,
            mode: state.mode,
            redirect: state.redirect,
            referrer: state.referrer,
            referrerPolicy: state.referrerPolicy,
            progressBarFactory: state.progressBarFactory,
            progressOptions: state.progressOptions == null ? undefined : {
                ...state.progressOptions
            },
            timeout: state.timeout
        };
    }
    #getDefaultState() {
        return {
            noThrow: false,
            url: undefined,
            body: undefined,
            cache: undefined,
            headers: {},
            integrity: undefined,
            keepalive: undefined,
            method: undefined,
            mode: undefined,
            redirect: undefined,
            referrer: undefined,
            referrerPolicy: undefined,
            progressBarFactory: undefined,
            progressOptions: undefined,
            timeout: undefined
        };
    }
    #newWithState(action) {
        const builder = new RequestBuilder();
        const state = this.#getClonedState();
        action(state);
        builder.#state = state;
        return builder;
    }
    then(onfulfilled, onrejected) {
        return this.fetch().then(onfulfilled).catch(onrejected);
    }
    fetch() {
        return makeRequest(this.#getClonedState());
    }
    url(value1) {
        return this.#newWithState((state)=>{
            state.url = value1;
        });
    }
    header(nameOrItems, value1) {
        return this.#newWithState((state)=>{
            if (typeof nameOrItems === "string") {
                setHeader(state, nameOrItems, value1);
            } else {
                for (const [name, value1] of Object.entries(nameOrItems)){
                    setHeader(state, name, value1);
                }
            }
        });
        function setHeader(state, name, value1) {
            name = name.toUpperCase();
            state.headers[name] = value1;
        }
    }
    noThrow(value1, ...additional) {
        return this.#newWithState((state)=>{
            if (typeof value1 === "boolean" || value1 == null) {
                state.noThrow = value1 ?? true;
            } else {
                state.noThrow = [
                    value1,
                    ...additional
                ];
            }
        });
    }
    body(value1) {
        return this.#newWithState((state)=>{
            state.body = value1;
        });
    }
    cache(value1) {
        return this.#newWithState((state)=>{
            state.cache = value1;
        });
    }
    integrity(value1) {
        return this.#newWithState((state)=>{
            state.integrity = value1;
        });
    }
    keepalive(value1) {
        return this.#newWithState((state)=>{
            state.keepalive = value1;
        });
    }
    method(value1) {
        return this.#newWithState((state)=>{
            state.method = value1;
        });
    }
    mode(value1) {
        return this.#newWithState((state)=>{
            state.mode = value1;
        });
    }
    [withProgressBarFactorySymbol](factory) {
        return this.#newWithState((state)=>{
            state.progressBarFactory = factory;
        });
    }
    redirect(value1) {
        return this.#newWithState((state)=>{
            state.redirect = value1;
        });
    }
    referrer(value1) {
        return this.#newWithState((state)=>{
            state.referrer = value1;
        });
    }
    referrerPolicy(value1) {
        return this.#newWithState((state)=>{
            state.referrerPolicy = value1;
        });
    }
    showProgress(value1) {
        return this.#newWithState((state)=>{
            if (value1 === true || value1 == null) {
                state.progressOptions = {
                    noClear: false
                };
            } else if (value1 === false) {
                state.progressOptions = undefined;
            } else {
                state.progressOptions = {
                    noClear: value1.noClear ?? false
                };
            }
        });
    }
    timeout(delay) {
        return this.#newWithState((state)=>{
            state.timeout = delay == null ? undefined : delayToMs(delay);
        });
    }
    async arrayBuffer() {
        const response = await this.fetch();
        return response.arrayBuffer();
    }
    async blob() {
        const response = await this.fetch();
        return response.blob();
    }
    async formData() {
        const response = await this.fetch();
        return response.formData();
    }
    async json() {
        let builder = this;
        const acceptHeaderName = "ACCEPT";
        if (builder.#state == null || !Object.hasOwn(builder.#state.headers, acceptHeaderName)) {
            builder = builder.header(acceptHeaderName, "application/json");
        }
        const response = await builder.fetch();
        return response.json();
    }
    async text() {
        const response = await this.fetch();
        return response.text();
    }
    async pipeTo(dest, options) {
        const response = await this.fetch();
        return await response.pipeTo(dest, options);
    }
    async pipeToPath(filePathOrOptions, maybeOptions) {
        const { filePath, options } = resolvePipeToPathParams(filePathOrOptions, maybeOptions, this.#state?.url);
        const response = await this.fetch();
        return await response.pipeToPath(filePath, options);
    }
    async pipeThrough(transform) {
        const response = await this.fetch();
        return response.pipeThrough(transform);
    }
}
class RequestResult {
    #response;
    #downloadResponse;
    #originalUrl;
    constructor(opts){
        this.#originalUrl = opts.originalUrl;
        this.#response = opts.response;
        if (opts.progressBar != null) {
            const pb = opts.progressBar;
            this.#downloadResponse = new Response(new ReadableStream({
                async start (controller) {
                    const reader = opts.response.body?.getReader();
                    if (reader == null) {
                        return;
                    }
                    try {
                        while(true){
                            const { done, value: value1 } = await reader.read();
                            if (done || value1 == null) break;
                            pb.increment(value1.byteLength);
                            controller.enqueue(value1);
                        }
                        controller.close();
                    } finally{
                        reader.releaseLock();
                        pb.finish();
                    }
                }
            }));
        } else {
            this.#downloadResponse = opts.response;
        }
    }
    get response() {
        return this.#response;
    }
    get headers() {
        return this.#response.headers;
    }
    get ok() {
        return this.#response.ok;
    }
    get redirected() {
        return this.#response.redirected;
    }
    get status() {
        return this.#response.status;
    }
    get statusText() {
        return this.#response.statusText;
    }
    get url() {
        return this.#response.url;
    }
    throwIfNotOk() {
        if (!this.ok) {
            this.#response.body?.cancel().catch(()=>{});
            throw new Error(`Error making request to ${this.#originalUrl}: ${this.statusText}`);
        }
    }
    async arrayBuffer() {
        if (this.#response.status === 404) {
            await this.#response.body?.cancel();
            return undefined;
        }
        return this.#downloadResponse.arrayBuffer();
    }
    async blob() {
        if (this.#response.status === 404) {
            await this.#response.body?.cancel();
            return undefined;
        }
        return this.#downloadResponse.blob();
    }
    async formData() {
        if (this.#response.status === 404) {
            await this.#response.body?.cancel();
            return undefined;
        }
        return this.#downloadResponse.formData();
    }
    async json() {
        if (this.#response.status === 404) {
            await this.#response.body?.cancel();
            return undefined;
        }
        return this.#downloadResponse.json();
    }
    async text() {
        if (this.#response.status === 404) {
            await this.#response.body?.cancel();
            return undefined;
        }
        return this.#downloadResponse.text();
    }
    pipeTo(dest, options) {
        return this.#getDownloadBody().pipeTo(dest, options);
    }
    async pipeToPath(filePathOrOptions, maybeOptions) {
        const { filePath, options } = resolvePipeToPathParams(filePathOrOptions, maybeOptions, this.#originalUrl);
        const body = this.#getDownloadBody();
        try {
            const file = await filePath.open({
                write: true,
                create: true,
                ...options ?? {}
            });
            try {
                await body.pipeTo(file.writable, {
                    preventClose: true
                });
            } finally{
                try {
                    file.close();
                } catch  {}
            }
        } catch (err) {
            await this.#response.body?.cancel();
            throw err;
        }
        return filePath;
    }
    pipeThrough(transform) {
        return this.#getDownloadBody().pipeThrough(transform);
    }
    #getDownloadBody() {
        const body = this.#downloadResponse.body;
        if (body == null) {
            throw new Error("Response had no body.");
        }
        return body;
    }
}
async function makeRequest(state) {
    if (state.url == null) {
        throw new Error("You must specify a URL before fetching.");
    }
    const timeout = getTimeout();
    const response = await fetch(state.url, {
        body: state.body,
        cache: state.cache,
        headers: filterEmptyRecordValues(state.headers),
        integrity: state.integrity,
        keepalive: state.keepalive,
        method: state.method,
        mode: state.mode,
        redirect: state.redirect,
        referrer: state.referrer,
        referrerPolicy: state.referrerPolicy,
        signal: timeout?.signal
    });
    timeout?.clear();
    const result = new RequestResult({
        response,
        originalUrl: state.url.toString(),
        progressBar: getProgressBar()
    });
    if (!state.noThrow) {
        result.throwIfNotOk();
    } else if (state.noThrow instanceof Array) {
        if (!state.noThrow.includes(response.status)) {
            result.throwIfNotOk();
        }
    }
    return result;
    function getProgressBar() {
        if (state.progressOptions == null || state.progressBarFactory == null) {
            return undefined;
        }
        return state.progressBarFactory(`Download ${state.url}`).noClear(state.progressOptions.noClear).kind("bytes").length(getContentLength());
        function getContentLength() {
            const contentLength = response.headers.get("content-length");
            if (contentLength == null) {
                return undefined;
            }
            const length = parseInt(contentLength, 10);
            return isNaN(length) ? undefined : length;
        }
    }
    function getTimeout() {
        if (state.timeout == null) {
            return undefined;
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(()=>controller.abort(), state.timeout);
        return {
            signal: controller.signal,
            clear () {
                clearTimeout(timeoutId);
            }
        };
    }
}
function resolvePipeToPathParams(pathOrOptions, maybeOptions, originalUrl) {
    let filePath;
    let options;
    if (typeof pathOrOptions === "string" || pathOrOptions instanceof URL) {
        filePath = new PathRef(pathOrOptions).resolve();
        options = maybeOptions;
    } else if (pathOrOptions instanceof PathRef) {
        filePath = pathOrOptions.resolve();
        options = maybeOptions;
    } else if (typeof pathOrOptions === "object") {
        options = pathOrOptions;
    } else if (pathOrOptions === undefined) {
        options = maybeOptions;
    }
    if (filePath === undefined) {
        filePath = new PathRef(getFileNameFromUrlOrThrow(originalUrl));
    } else if (filePath.isDir()) {
        filePath = filePath.join(getFileNameFromUrlOrThrow(originalUrl));
    }
    filePath = filePath.resolve();
    return {
        filePath,
        options
    };
    function getFileNameFromUrlOrThrow(url) {
        const fileName = url == null ? undefined : getFileNameFromUrl(url);
        if (fileName == null) {
            throw new Error("Could not derive the path from the request URL. " + "Please explicitly provide a path.");
        }
        return fileName;
    }
}
function sleep(delay) {
    const ms = delayToMs(delay);
    return new Promise((resolve)=>setTimeout(resolve, ms));
}
async function withRetries($local, errorLogger, opts) {
    const delayIterator = delayToIterator(opts.delay);
    for(let i = 0; i < opts.count; i++){
        if (i > 0) {
            const nextDelay = delayIterator.next();
            if (!opts.quiet) {
                $local.logWarn(`Failed. Trying again in ${formatMillis(nextDelay)}...`);
            }
            await sleep(nextDelay);
            if (!opts.quiet) {
                $local.logStep(`Retrying attempt ${i + 1}/${opts.count}...`);
            }
        }
        try {
            return await opts.action();
        } catch (err) {
            errorLogger(err);
        }
    }
    throw new Error(`Failed after ${opts.count} attempts.`);
}
function cd(path) {
    if (typeof path === "string" || path instanceof URL) {
        path = new PathRef(path);
    } else if (!(path instanceof PathRef)) {
        path = new PathRef(path).parentOrThrow();
    }
    Deno.chdir(path.toString());
}
function buildInitial$State(opts) {
    return {
        commandBuilder: new TreeBox(opts.commandBuilder ?? new CommandBuilder()),
        requestBuilder: opts.requestBuilder ?? new RequestBuilder(),
        infoLogger: new LoggerTreeBox(console.error),
        warnLogger: new LoggerTreeBox(console.error),
        errorLogger: new LoggerTreeBox(console.error),
        indentLevel: new Box(0),
        extras: opts.extras
    };
}
const helperObject = {
    fs: mod9,
    path: Object.assign(createPathRef, mod8),
    cd,
    escapeArg,
    stripAnsi (text) {
        return wasmInstance.strip_ansi_codes(text);
    },
    dedent: defaultOutdent,
    sleep,
    which (commandName) {
        if (commandName.toUpperCase() === "DENO") {
            return Promise.resolve(Deno.execPath());
        } else {
            return which(commandName);
        }
    },
    whichSync (commandName) {
        if (commandName.toUpperCase() === "DENO") {
            return Deno.execPath();
        } else {
            return whichSync(commandName);
        }
    }
};
function build$FromState(state) {
    const logDepthObj = {
        get logDepth () {
            return state.indentLevel.value;
        },
        set logDepth (value){
            if (value < 0 || value % 1 !== 0) {
                throw new Error("Expected a positive integer.");
            }
            state.indentLevel.value = value;
        }
    };
    const result = Object.assign((strings, ...exprs)=>{
        let result = "";
        for(let i = 0; i < Math.max(strings.length, exprs.length); i++){
            if (strings.length > i) {
                result += strings[i];
            }
            if (exprs.length > i) {
                result += templateLiteralExprToString(exprs[i], escapeArg);
            }
        }
        return state.commandBuilder.getValue().command(result);
    }, helperObject, logDepthObj, {
        build$ (opts = {}) {
            return build$FromState({
                commandBuilder: opts.commandBuilder != null ? new TreeBox(opts.commandBuilder) : state.commandBuilder.createChild(),
                requestBuilder: opts.requestBuilder ?? state.requestBuilder,
                errorLogger: state.errorLogger.createChild(),
                infoLogger: state.infoLogger.createChild(),
                warnLogger: state.warnLogger.createChild(),
                indentLevel: state.indentLevel,
                extras: {
                    ...state.extras,
                    ...opts.extras
                }
            });
        },
        log (...data) {
            state.infoLogger.getValue()(getLogText(data));
        },
        logLight (...data) {
            state.infoLogger.getValue()(mod5.gray(getLogText(data)));
        },
        logStep (firstArg, ...data) {
            logStep(firstArg, data, (t)=>mod5.bold(mod5.green(t)), state.infoLogger.getValue());
        },
        logError (firstArg, ...data) {
            logStep(firstArg, data, (t)=>mod5.bold(mod5.red(t)), state.errorLogger.getValue());
        },
        logWarn (firstArg, ...data) {
            logStep(firstArg, data, (t)=>mod5.bold(mod5.yellow(t)), state.warnLogger.getValue());
        },
        logGroup (labelOrAction, maybeAction) {
            const label = typeof labelOrAction === "string" ? labelOrAction : undefined;
            if (label) {
                state.infoLogger.getValue()(getLogText([
                    label
                ]));
            }
            state.indentLevel.value++;
            const action = label != null ? maybeAction : labelOrAction;
            if (action != null) {
                let wasPromise = false;
                try {
                    const result = action();
                    if (result instanceof Promise) {
                        wasPromise = true;
                        return result.finally(()=>{
                            if (state.indentLevel.value > 0) {
                                state.indentLevel.value--;
                            }
                        });
                    } else {
                        return result;
                    }
                } finally{
                    if (!wasPromise) {
                        if (state.indentLevel.value > 0) {
                            state.indentLevel.value--;
                        }
                    }
                }
            }
        },
        logGroupEnd () {
            if (state.indentLevel.value > 0) {
                state.indentLevel.value--;
            }
        },
        commandExists (commandName) {
            if (state.commandBuilder.getValue()[getRegisteredCommandNamesSymbol]().includes(commandName)) {
                return Promise.resolve(true);
            }
            return helperObject.which(commandName).then((c)=>c != null);
        },
        commandExistsSync (commandName) {
            if (state.commandBuilder.getValue()[getRegisteredCommandNamesSymbol]().includes(commandName)) {
                return true;
            }
            return helperObject.whichSync(commandName) != null;
        },
        maybeConfirm,
        confirm,
        maybeSelect,
        select,
        maybeMultiSelect,
        multiSelect,
        maybePrompt,
        prompt,
        progress (messageOrText, options) {
            const opts = typeof messageOrText === "string" ? (()=>{
                const words = messageOrText.split(" ");
                return {
                    prefix: words[0],
                    message: words.length > 1 ? words.slice(1).join(" ") : undefined,
                    ...options
                };
            })() : messageOrText;
            return new ProgressBar((...data)=>{
                state.infoLogger.getValue()(...data);
            }, opts);
        },
        setInfoLogger (logger) {
            state.infoLogger.setValue(logger);
        },
        setWarnLogger (logger) {
            state.warnLogger.setValue(logger);
        },
        setErrorLogger (logger) {
            state.errorLogger.setValue(logger);
            const commandBuilder = state.commandBuilder.getValue();
            commandBuilder.setPrintCommandLogger(logger);
            state.commandBuilder.setValue(commandBuilder);
        },
        setPrintCommand (value1) {
            const commandBuilder = state.commandBuilder.getValue().printCommand(value1);
            state.commandBuilder.setValue(commandBuilder);
        },
        request (url) {
            return state.requestBuilder.url(url);
        },
        raw (strings, ...exprs) {
            let result = "";
            for(let i = 0; i < Math.max(strings.length, exprs.length); i++){
                if (strings.length > i) {
                    result += strings[i];
                }
                if (exprs.length > i) {
                    result += templateLiteralExprToString(exprs[i]);
                }
            }
            return state.commandBuilder.getValue().command(result);
        },
        withRetries (opts) {
            return withRetries(result, state.errorLogger.getValue(), opts);
        }
    }, state.extras);
    const keyName = "logDepth";
    Object.defineProperty(result, keyName, Object.getOwnPropertyDescriptor(logDepthObj, keyName));
    state.requestBuilder = state.requestBuilder[withProgressBarFactorySymbol]((message)=>result.progress(message));
    return result;
    function getLogText(data) {
        const combinedText = data.join(" ");
        if (state.indentLevel.value === 0) {
            return combinedText;
        } else {
            const indentText = "  ".repeat(state.indentLevel.value);
            return combinedText.split(/\n/).map((l)=>`${indentText}${l}`).join("\n");
        }
    }
    function logStep(firstArg, data, colourize, logger) {
        if (data.length === 0) {
            let i = 0;
            while(i < firstArg.length && firstArg[i] === " "){
                i++;
            }
            while(i < firstArg.length && firstArg[i] !== " "){
                i++;
            }
            firstArg = colourize(firstArg.substring(0, i)) + firstArg.substring(i);
        } else {
            firstArg = colourize(firstArg);
        }
        logger(getLogText([
            firstArg,
            ...data
        ]));
    }
}
function templateLiteralExprToString(expr, escape) {
    let result;
    if (expr instanceof Array) {
        return expr.map((e)=>templateLiteralExprToString(e, escape)).join(" ");
    } else if (expr instanceof CommandResult) {
        result = expr.stdout.replace(/\r?\n$/, "");
    } else {
        result = `${expr}`;
    }
    return escape ? escape(result) : result;
}
build$FromState(buildInitial$State({
    isGlobal: true
}));
async function fileExists(filePath) {
    try {
        const statResult = await Deno.stat(filePath);
        if (statResult.isFile) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
            return false;
        } else {
            throw e;
        }
    }
}
async function dirExists(dirPath) {
    try {
        const statResult = await Deno.stat(dirPath);
        if (statResult.isDirectory) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
            return false;
        } else {
            throw e;
        }
    }
}
class FileIPC {
    MAX_DATA_LENGTH = 1024;
    filePath;
    dirPath;
    fileName;
    staleMessageLimitMs;
    debounceTimeMs;
    messageQueue = [];
    aborted = false;
    watcher;
    constructor(filePath, staleMessageLimitMs, debounceTimeMs){
        this.filePath = resolve2(filePath);
        this.dirPath = resolve2(dirname2(filePath));
        this.fileName = basename2(filePath);
        this.staleMessageLimitMs = staleMessageLimitMs ?? 30000;
        this.debounceTimeMs = debounceTimeMs ?? 100;
    }
    getFilePath() {
        return this.filePath;
    }
    async startWatching() {
        await Deno.mkdir(this.dirPath, {
            recursive: true
        });
        const messages = await this.extractMessages();
        if (messages.length > 0) {
            this.messageQueue.push(messages);
        }
        this.watcher = Deno.watchFs(this.dirPath);
        for await (const event of this.watcher){
            if (event.kind === "modify" && event.paths.includes(join3(this.dirPath, this.fileName))) {
                debounce(async ()=>{
                    try {
                        const messages = await this.extractMessages();
                        if (messages.length > 0) {
                            this.messageQueue.push(messages);
                        }
                    } catch (_e) {}
                }, this.debounceTimeMs)();
            }
        }
    }
    async extractMessages() {
        if (await fileExists(this.filePath)) {
            let fileContent;
            try {
                fileContent = await Deno.readTextFile(this.filePath);
            } catch (_e) {
                throw new Error(`Could not read '${this.filePath}'`);
            }
            try {
                await Deno.remove(this.filePath);
            } catch (_e) {
                throw new Error(`Failed to remove '${this.filePath}', aborting ipc read.`);
            }
            const receivedMessages = [];
            try {
                const messages = JSON.parse(fileContent || "[]");
                for (const messageObj of messages){
                    let validatedPid = null;
                    let validatedSent = null;
                    let validatedData = null;
                    const errors = [];
                    try {
                        validatedPid = parseInt(messageObj.pid);
                    } catch (_e) {
                        errors.push("Invalid data received: pid");
                    }
                    try {
                        validatedSent = new Date(Date.parse(messageObj.sent));
                    } catch (_e) {
                        errors.push("Invalid data received: sent");
                    }
                    if (validatedSent !== null && validatedSent.getTime() >= Date.now() - this.staleMessageLimitMs) {
                        if (!messageObj.data) {
                            errors.push("Invalid data received: missing");
                        } else if (typeof messageObj.data !== "string") {
                            errors.push("Invalid data received: not string");
                        } else if (messageObj.data.length >= this.MAX_DATA_LENGTH) {
                            errors.push("Invalid data received: too long");
                        } else {
                            validatedData = messageObj.data;
                        }
                    } else {
                        errors.push("Invalid data received: stale");
                    }
                    receivedMessages.push({
                        pid: validatedPid,
                        sent: validatedSent,
                        data: validatedData,
                        errors
                    });
                }
                return receivedMessages;
            } catch (_e) {
                throw new Error(`Invalid content in ${this.filePath}.ipc`);
            }
        } else {
            return [];
        }
    }
    async sendData(data) {
        await Deno.mkdir(this.dirPath, {
            recursive: true
        });
        try {
            const fileContent = await Deno.readTextFile(this.filePath).catch(()=>"");
            const messages = JSON.parse(fileContent || "[]");
            messages.push({
                pid: Deno.pid,
                data,
                sent: new Date().toISOString()
            });
            await Deno.writeTextFile(this.filePath, JSON.stringify(messages), {
                create: true
            });
        } catch (_e) {
            console.error("Error sending data, read or write failed.");
        }
    }
    async *receiveData() {
        if (!this.watcher) this.startWatching();
        while(!this.aborted){
            if (this.messageQueue.length > 0) {
                const messages = this.messageQueue.shift();
                if (messages) {
                    yield messages;
                }
            } else {
                await new Promise((resolve)=>setTimeout(resolve, this.debounceTimeMs));
            }
        }
    }
    async close(leaveFile) {
        this.aborted = true;
        if (this.watcher) {
            this.watcher.close();
        }
        if (!leaveFile) {
            try {
                await Deno.remove(this.filePath);
            } catch (_e) {}
        }
    }
}
class PupTelemetry {
    static instance;
    events = new EventEmitter();
    intervalSeconds = 15;
    timer;
    aborted = false;
    ipc;
    constructor(intervalSeconds = 5){
        if (!(this instanceof PupTelemetry)) {
            return new PupTelemetry(intervalSeconds);
        }
        if (PupTelemetry.instance) {
            return PupTelemetry.instance;
        }
        PupTelemetry.instance = this;
        if (!intervalSeconds || intervalSeconds < 1) intervalSeconds = 1;
        if (intervalSeconds > 180) intervalSeconds = 180;
        this.intervalSeconds = intervalSeconds;
        this.telemetryWatchdog();
        this.checkIpc();
    }
    async sendMainTelemetry() {
        const pupTempPath = Deno.env.get("PUP_TEMP_STORAGE");
        const pupProcessId = Deno.env.get("PUP_PROCESS_ID");
        if (pupTempPath && await dirExists(pupTempPath) && pupProcessId) {
            const data = {
                sender: pupProcessId,
                memory: Deno.memoryUsage(),
                sent: new Date().toISOString(),
                cwd: Deno.cwd()
            };
            this.emit("main", "telemetry", data);
        } else {}
    }
    async checkIpc() {
        const pupTempPath = Deno.env.get("PUP_TEMP_STORAGE");
        const pupProcessId = Deno.env.get("PUP_PROCESS_ID");
        if (pupTempPath && await dirExists(pupTempPath) && pupProcessId) {
            const ipcPath = `${pupTempPath}/.${pupProcessId}.ipc`;
            this.ipc = new FileIPC(ipcPath);
            for await (const messages of this.ipc.receiveData()){
                if (messages.length > 0) {
                    for (const message of messages){
                        try {
                            if (message.data) {
                                const parsedMessage = JSON.parse(message.data);
                                this.events.emit(parsedMessage.event, parsedMessage.eventData);
                            }
                        } catch (_e) {}
                    }
                }
            }
        }
    }
    async telemetryWatchdog() {
        try {
            await this.sendMainTelemetry();
        } catch (_e) {} finally{
            clearTimeout(this.timer);
            if (!this.aborted) {
                this.timer = setTimeout(()=>this.telemetryWatchdog(), this.intervalSeconds * 1000);
                Deno.unrefTimer(this.timer);
            }
        }
    }
    on(event, fn) {
        this.events.on(event, fn);
    }
    off(event, fn) {
        this.events.off(event, fn);
    }
    async emit(targetProcessId, event, eventData) {
        const pupTempPath = Deno.env.get("PUP_TEMP_STORAGE");
        if (pupTempPath && await dirExists(pupTempPath) && targetProcessId) {
            const ipcPath = `${pupTempPath}/.${targetProcessId}.ipc`;
            const ipc = new FileIPC(ipcPath);
            const message = {
                event,
                eventData
            };
            await ipc.sendData(JSON.stringify(message));
            ipc.close(true);
        } else {}
    }
    close() {
        this.aborted = true;
        if (this.timer) {
            clearTimeout(this.timer);
        }
        if (this.ipc) {
            this.ipc.close();
        }
    }
}
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
    },
    space: {
        name: "xml:space",
        preserve: "preserve"
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
        this.#options.reviver ??= function({ value: value1 }) {
            return value1;
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
        const document = Object.defineProperty({}, $XML, {
            enumerable: false,
            writable: true,
            value: {
                cdata: []
            }
        });
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
                        document,
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
    #node({ document, path }) {
        if (this.#options.progress) {
            this.#options.progress(this.#stream.cursor);
        }
        if (this.#peek(tokens.comment.start)) {
            return {
                [schema.comment]: this.#comment({
                    path
                })
            };
        }
        return this.#tag({
            document,
            path
        });
    }
    #prolog({ path }) {
        this.#debug(path, "parsing prolog");
        const prolog = this.#make.node({
            name: "xml",
            path
        });
        this.#consume(tokens.prolog.start);
        while(!this.#peek(tokens.prolog.end)){
            Object.assign(prolog, this.#attribute({
                path: [
                    ...path,
                    prolog
                ]
            }));
        }
        this.#consume(tokens.prolog.end);
        return {
            xml: prolog
        };
    }
    #stylesheet({ path }) {
        this.#debug(path, "parsing stylesheet");
        const stylesheet = this.#make.node({
            name: "xml-stylesheet",
            path
        });
        this.#consume(tokens.stylesheet.start);
        while(!this.#peek(tokens.stylesheet.end)){
            Object.assign(stylesheet, this.#attribute({
                path: [
                    ...path,
                    stylesheet
                ]
            }));
        }
        this.#consume(tokens.stylesheet.end);
        return {
            stylesheet
        };
    }
    #doctype({ path }) {
        this.#debug(path, "parsing doctype");
        const doctype = this.#make.node({
            name: "doctype",
            path
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
                        path
                    }));
                }
                this.#consume(tokens.doctype.elements.end);
            } else {
                Object.assign(doctype, this.#property({
                    path
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
    #doctypeElement({ path }) {
        this.#debug(path, "parsing doctype element");
        this.#consume(tokens.doctype.element.start);
        const element = Object.keys(this.#property({
            path
        })).shift().substring(schema.property.prefix.length);
        this.#debug(path, `found doctype element "${element}"`);
        this.#consume(tokens.doctype.element.value.start);
        const value1 = this.#capture(tokens.doctype.element.value.regex.end);
        this.#consume(tokens.doctype.element.value.end);
        this.#debug(path, `found doctype element value "${value1}"`);
        this.#consume(tokens.doctype.element.end);
        return {
            [element]: value1
        };
    }
    #tag({ document, path }) {
        this.#debug(path, "parsing tag");
        const tag = this.#make.node({
            path
        });
        this.#consume(tokens.tag.start);
        const name = this.#capture(tokens.tag.regex.name);
        Object.assign(tag[$XML], {
            name
        });
        this.#debug(path, `found tag "${name}"`);
        while(!tokens.tag.close.regex.end.test(this.#stream.peek(2))){
            Object.assign(tag, this.#attribute({
                path: [
                    ...path,
                    tag
                ]
            }));
        }
        let trim = true;
        if (tag[`${schema.attribute.prefix}${schema.space.name}`] === schema.space.preserve) {
            this.#debug([
                ...path,
                tag
            ], `${schema.space.name} is set to ${schema.space.preserve}`);
            trim = false;
        }
        const selfclosed = this.#peek(tokens.tag.close.self);
        if (selfclosed) {
            this.#debug(path, `tag "${name}" is self-closed`);
            this.#consume(tokens.tag.close.self);
        }
        this.#consume(tokens.tag.end, {
            trim
        });
        if (!selfclosed) {
            if (this.#peek(tokens.cdata.start) || !this.#peek(tokens.tag.start)) {
                Object.assign(tag, this.#text({
                    document,
                    close: name,
                    path: [
                        ...path,
                        tag
                    ],
                    trim
                }));
            } else {
                while(!tokens.tag.close.regex.start.test(this.#stream.peek(2))){
                    const child = this.#node({
                        document,
                        path: [
                            ...path,
                            tag
                        ]
                    });
                    const [key, value1] = Object.entries(child).shift();
                    if (Array.isArray(tag[key])) {
                        tag[key].push(value1);
                        this.#debug([
                            ...path,
                            tag
                        ], `add new child "${key}" to array`);
                    } else if (key in tag) {
                        const array = [
                            tag[key],
                            value1
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
                            ...path,
                            tag
                        ], `multiple children named "${key}", using array notation`);
                    } else {
                        Object.assign(tag, child);
                        this.#debug([
                            ...path,
                            tag
                        ], `add new child "${key}"`);
                    }
                }
            }
            this.#consume(tokens.tag.close.start);
            this.#consume(name);
            this.#consume(tokens.tag.close.end);
            this.#debug(path, `found closing tag for "${name}"`);
        }
        for (const [key] of Object.entries(tag).filter(([_, value1])=>typeof value1 === "undefined")){
            delete tag[key];
        }
        if (!Object.keys(tag).includes(schema.text)) {
            const children = Object.keys(tag).filter((key)=>!key.startsWith(schema.attribute.prefix) && key !== schema.text);
            if (!children.length) {
                this.#debug(path, `tag "${name}" has implictely obtained a text node as it has no children but has attributes`);
                tag[schema.text] = this.#revive({
                    key: schema.text,
                    value: "",
                    tag
                });
            }
        }
        if ((this.#options.flatten ?? true) && Object.keys(tag).includes(schema.text) && Object.keys(tag).length === 1) {
            this.#debug(path, `tag "${name}" has been implicitely flattened as it only has a text node`);
            return {
                [name]: tag[schema.text]
            };
        }
        return {
            [name]: tag
        };
    }
    #attribute({ path }) {
        this.#debug(path, "parsing attribute");
        const attribute = this.#capture(tokens.tag.attribute.regex.name);
        this.#debug(path, `found attribute "${attribute}"`);
        this.#consume("=");
        const quote = this.#stream.peek();
        this.#consume(quote);
        const value1 = this.#capture({
            until: new RegExp(quote),
            bytes: quote.length
        });
        this.#consume(quote);
        this.#debug(path, `found attribute value "${value1}"`);
        return {
            [`${schema.attribute.prefix}${attribute}`]: this.#revive({
                key: `${schema.attribute.prefix}${attribute}`,
                value: value1,
                tag: path.at(-1)
            })
        };
    }
    #property({ path }) {
        this.#debug(path, "parsing property");
        const quote = this.#stream.peek();
        const delimiter = /["']/.test(quote) ? quote : " ";
        if (delimiter.trim().length) {
            this.#consume(delimiter);
        }
        const property = this.#capture({
            until: new RegExp(delimiter),
            bytes: delimiter.length
        });
        this.#debug(path, `found property ${property}`);
        if (delimiter.trim().length) {
            this.#consume(delimiter);
        }
        return {
            [`${schema.property.prefix}${property}`]: true
        };
    }
    #text({ document, close, path, trim }) {
        this.#debug(path, "parsing text");
        const tag = this.#make.node({
            name: schema.text,
            path
        });
        let text = "";
        const comments = [];
        while(this.#peek(tokens.cdata.start) || !this.#peeks([
            tokens.tag.close.start,
            close,
            tokens.tag.close.end
        ])){
            if (this.#peek(tokens.cdata.start)) {
                const cpath = path.map((node)=>node[$XML].name);
                document[$XML].cdata?.push(cpath);
                this.#debug(path, `text is specified as cdata, storing path >${cpath.join(">")} in document metadata`);
                text += this.#cdata({
                    path: [
                        ...path,
                        tag
                    ]
                });
            } else if (this.#peek(tokens.comment.start)) {
                comments.push(this.#comment({
                    path: [
                        ...path,
                        tag
                    ]
                }));
            } else {
                text += this.#capture({
                    ...tokens.text.regex.end
                }, {
                    trim
                });
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
        this.#debug(path, `parsed text "${text}"`);
        if (comments.length) {
            this.#debug(path, `parsed comments ${JSON.stringify(comments)}`);
        }
        Object.assign(tag, {
            [schema.text]: this.#revive({
                key: schema.text,
                value: trim ? text.trim() : text,
                tag: path.at(-1)
            }),
            ...comments.length ? {
                [schema.comment]: comments
            } : {}
        });
        return tag;
    }
    #cdata({ path }) {
        this.#debug(path, "parsing cdata");
        this.#consume(tokens.cdata.start);
        const data = this.#capture(tokens.cdata.regex.end);
        this.#consume(tokens.cdata.end);
        return data;
    }
    #comment({ path }) {
        this.#debug(path, "parsing comment");
        this.#consume(tokens.comment.start);
        const comment = this.#capture(tokens.comment.regex.end).trim();
        this.#consume(tokens.comment.end);
        return comment;
    }
    #revive({ key, value: value1, tag }) {
        return this.#options.reviver.call(tag, {
            key,
            tag: tag[$XML].name,
            properties: !(key.startsWith(schema.attribute.prefix) || key.startsWith(schema.property.prefix)) ? {
                ...tag
            } : null,
            value: (()=>{
                switch(true){
                    case (this.#options.emptyToNull ?? true) && /^\s*$/.test(value1):
                        return null;
                    case (this.#options.reviveBooleans ?? true) && /^(?:true|false)$/i.test(value1):
                        return /^true$/i.test(value1);
                    case this.#options.reviveNumbers ?? true:
                        {
                            const num = Number(value1);
                            if (Number.isFinite(num)) {
                                return num;
                            }
                        }
                    default:
                        value1 = value1.replace(tokens.entity.regex.entities, (_, hex, code)=>String.fromCharCode(parseInt(code, hex ? 16 : 10)));
                        for (const [entity, character] of Object.entries(entities.xml)){
                            value1 = value1.replaceAll(entity, character);
                        }
                        return value1;
                }
            })()
        });
    }
    #make = {
        node ({ name = "", path = [] }) {
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
    #peeks(tokens) {
        let offset = 0;
        for(let i = 0; i < tokens.length; i++){
            const token = tokens[i];
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
    #consume(token, { trim } = {}) {
        return this.#stream.consume({
            content: token,
            trim
        });
    }
    #capture(token, { trim } = {}) {
        return this.#stream.capture({
            ...token,
            trim
        });
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
    capture({ until, bytes, trim = true, length = bytes }) {
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
    consume({ content, trim = true }) {
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
function parse10(content, options) {
    if (typeof content === "string") {
        content = new Streamable(content);
    }
    return new Parser(new Stream(content), options).parse();
}
const ExchangeRate = async ()=>{
    const result = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"), resultText = await result.text(), resultJson = parse10(resultText);
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
const osType3 = (()=>{
    const { Deno: Deno1 } = globalThis;
    if (typeof Deno1?.build?.os === "string") {
        return Deno1.build.os;
    }
    const { navigator } = globalThis;
    if (navigator?.appVersion?.includes?.("Win")) {
        return "windows";
    }
    return "linux";
})();
const isWindows3 = osType3 === "windows";
const CHAR_FORWARD_SLASH3 = 47;
function assertPath3(path) {
    if (typeof path !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
    }
}
function isPosixPathSeparator3(code) {
    return code === 47;
}
function isPathSeparator3(code) {
    return isPosixPathSeparator3(code) || code === 92;
}
function isWindowsDeviceRoot3(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString3(path, allowAboveRoot, separator, isPathSeparator) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path.length; i <= len; ++i){
        if (i < len) code = path.charCodeAt(i);
        else if (isPathSeparator(code)) break;
        else code = CHAR_FORWARD_SLASH3;
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
function _format3(sep, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (base === sep) return dir;
    if (dir === pathObject.root) return dir + base;
    return dir + sep + base;
}
const WHITESPACE_ENCODINGS3 = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace3(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS3[c] ?? c;
    });
}
function lastPathSegment3(path, isSep, start = 0) {
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
function stripTrailingSeparators3(segment, isSep) {
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
function stripSuffix3(name, suffix) {
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
function assert3(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError2(msg);
    }
}
const sep7 = "\\";
const delimiter9 = ";";
function resolve9(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        const { Deno: Deno1 } = globalThis;
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
        assertPath3(path);
        const len = path.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator3(code)) {
                isAbsolute = true;
                if (isPathSeparator3(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator3(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator3(path.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator3(path.charCodeAt(j))) break;
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
            } else if (isWindowsDeviceRoot3(code)) {
                if (path.charCodeAt(1) === 58) {
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator3(path.charCodeAt(2))) {
                            isAbsolute = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator3(code)) {
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
    resolvedTail = normalizeString3(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator3);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize12(path) {
    assertPath3(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator3(code)) {
            isAbsolute = true;
            if (isPathSeparator3(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator3(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator3(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator3(path.charCodeAt(j))) break;
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
        } else if (isWindowsDeviceRoot3(code)) {
            if (path.charCodeAt(1) === 58) {
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator3(path.charCodeAt(2))) {
                        isAbsolute = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator3(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString3(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator3);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute) tail = ".";
    if (tail.length > 0 && isPathSeparator3(path.charCodeAt(len - 1))) {
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
function isAbsolute9(path) {
    assertPath3(path);
    const len = path.length;
    if (len === 0) return false;
    const code = path.charCodeAt(0);
    if (isPathSeparator3(code)) {
        return true;
    } else if (isWindowsDeviceRoot3(code)) {
        if (len > 2 && path.charCodeAt(1) === 58) {
            if (isPathSeparator3(path.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join12(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < pathsCount; ++i){
        const path = paths[i];
        assertPath3(path);
        if (path.length > 0) {
            if (joined === undefined) joined = firstPart = path;
            else joined += `\\${path}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert3(firstPart != null);
    if (isPathSeparator3(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator3(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator3(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator3(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize12(joined);
}
function relative9(from, to) {
    assertPath3(from);
    assertPath3(to);
    if (from === to) return "";
    const fromOrig = resolve9(from);
    const toOrig = resolve9(to);
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
function toNamespacedPath9(path) {
    if (typeof path !== "string") return path;
    if (path.length === 0) return "";
    const resolvedPath = resolve9(path);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot3(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path;
}
function dirname9(path) {
    assertPath3(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator3(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator3(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator3(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator3(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator3(path.charCodeAt(j))) break;
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
        } else if (isWindowsDeviceRoot3(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator3(path.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator3(code)) {
        return path;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator3(path.charCodeAt(i))) {
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
    return stripTrailingSeparators3(path.slice(0, end), isPosixPathSeparator3);
}
function basename9(path, suffix = "") {
    assertPath3(path);
    if (path.length === 0) return path;
    if (typeof suffix !== "string") {
        throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
    }
    let start = 0;
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot3(drive)) {
            if (path.charCodeAt(1) === 58) start = 2;
        }
    }
    const lastSegment = lastPathSegment3(path, isPathSeparator3, start);
    const strippedSegment = stripTrailingSeparators3(lastSegment, isPathSeparator3);
    return suffix ? stripSuffix3(strippedSegment, suffix) : strippedSegment;
}
function extname9(path) {
    assertPath3(path);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path.length >= 2 && path.charCodeAt(1) === 58 && isWindowsDeviceRoot3(path.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path.length - 1; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPathSeparator3(code)) {
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
function format10(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format3("\\", pathObject);
}
function parse11(path) {
    assertPath3(path);
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
        if (isPathSeparator3(code)) {
            rootEnd = 1;
            if (isPathSeparator3(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator3(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator3(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator3(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot3(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator3(path.charCodeAt(2))) {
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
    } else if (isPathSeparator3(code)) {
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
        if (isPathSeparator3(code)) {
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
function fromFileUrl9(url) {
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
function toFileUrl9(path) {
    if (!isAbsolute9(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace3(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const mod10 = {
    sep: sep7,
    delimiter: delimiter9,
    resolve: resolve9,
    normalize: normalize12,
    isAbsolute: isAbsolute9,
    join: join12,
    relative: relative9,
    toNamespacedPath: toNamespacedPath9,
    dirname: dirname9,
    basename: basename9,
    extname: extname9,
    format: format10,
    parse: parse11,
    fromFileUrl: fromFileUrl9,
    toFileUrl: toFileUrl9
};
const sep8 = "/";
const delimiter10 = ":";
function resolve10(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            const { Deno: Deno1 } = globalThis;
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
        }
        assertPath3(path);
        if (path.length === 0) {
            continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute = isPosixPathSeparator3(path.charCodeAt(0));
    }
    resolvedPath = normalizeString3(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator3);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize13(path) {
    assertPath3(path);
    if (path.length === 0) return ".";
    const isAbsolute = isPosixPathSeparator3(path.charCodeAt(0));
    const trailingSeparator = isPosixPathSeparator3(path.charCodeAt(path.length - 1));
    path = normalizeString3(path, !isAbsolute, "/", isPosixPathSeparator3);
    if (path.length === 0 && !isAbsolute) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute) return `/${path}`;
    return path;
}
function isAbsolute10(path) {
    assertPath3(path);
    return path.length > 0 && isPosixPathSeparator3(path.charCodeAt(0));
}
function join13(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path = paths[i];
        assertPath3(path);
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `/${path}`;
        }
    }
    if (!joined) return ".";
    return normalize13(joined);
}
function relative10(from, to) {
    assertPath3(from);
    assertPath3(to);
    if (from === to) return "";
    from = resolve10(from);
    to = resolve10(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (!isPosixPathSeparator3(from.charCodeAt(fromStart))) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (!isPosixPathSeparator3(to.charCodeAt(toStart))) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (isPosixPathSeparator3(to.charCodeAt(toStart + i))) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (isPosixPathSeparator3(from.charCodeAt(fromStart + i))) {
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
        else if (isPosixPathSeparator3(fromCode)) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || isPosixPathSeparator3(from.charCodeAt(i))) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (isPosixPathSeparator3(to.charCodeAt(toStart))) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath10(path) {
    return path;
}
function dirname10(path) {
    if (path.length === 0) return ".";
    let end = -1;
    let matchedNonSeparator = false;
    for(let i = path.length - 1; i >= 1; --i){
        if (isPosixPathSeparator3(path.charCodeAt(i))) {
            if (matchedNonSeparator) {
                end = i;
                break;
            }
        } else {
            matchedNonSeparator = true;
        }
    }
    if (end === -1) {
        return isPosixPathSeparator3(path.charCodeAt(0)) ? "/" : ".";
    }
    return stripTrailingSeparators3(path.slice(0, end), isPosixPathSeparator3);
}
function basename10(path, suffix = "") {
    assertPath3(path);
    if (path.length === 0) return path;
    if (typeof suffix !== "string") {
        throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
    }
    const lastSegment = lastPathSegment3(path, isPosixPathSeparator3);
    const strippedSegment = stripTrailingSeparators3(lastSegment, isPosixPathSeparator3);
    return suffix ? stripSuffix3(strippedSegment, suffix) : strippedSegment;
}
function extname10(path) {
    assertPath3(path);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i = path.length - 1; i >= 0; --i){
        const code = path.charCodeAt(i);
        if (isPosixPathSeparator3(code)) {
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
function format11(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format3("/", pathObject);
}
function parse12(path) {
    assertPath3(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path.length === 0) return ret;
    const isAbsolute = isPosixPathSeparator3(path.charCodeAt(0));
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
        if (isPosixPathSeparator3(code)) {
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
        ret.dir = stripTrailingSeparators3(path.slice(0, startPart - 1), isPosixPathSeparator3);
    } else if (isAbsolute) ret.dir = "/";
    return ret;
}
function fromFileUrl10(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl10(path) {
    if (!isAbsolute10(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace3(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const mod11 = {
    sep: sep8,
    delimiter: delimiter10,
    resolve: resolve10,
    normalize: normalize13,
    isAbsolute: isAbsolute10,
    join: join13,
    relative: relative10,
    toNamespacedPath: toNamespacedPath10,
    dirname: dirname10,
    basename: basename10,
    extname: extname10,
    format: format11,
    parse: parse12,
    fromFileUrl: fromFileUrl10,
    toFileUrl: toFileUrl10
};
const path6 = isWindows3 ? mod10 : mod11;
const { join: join14, normalize: normalize14 } = path6;
const path7 = isWindows3 ? mod10 : mod11;
const { basename: basename11, delimiter: delimiter11, dirname: dirname11, extname: extname11, format: format12, fromFileUrl: fromFileUrl11, isAbsolute: isAbsolute11, join: join15, normalize: normalize15, parse: parse13, relative: relative11, resolve: resolve11, sep: sep9, toFileUrl: toFileUrl11, toNamespacedPath: toNamespacedPath11 } = path7;
function getFileInfoType1(fileInfo) {
    return fileInfo.isFile ? "file" : fileInfo.isDirectory ? "dir" : fileInfo.isSymlink ? "symlink" : undefined;
}
async function ensureDir1(dir) {
    try {
        const fileInfo = await Deno.lstat(dir);
        if (!fileInfo.isDirectory) {
            throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType1(fileInfo)}'`);
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
var EOL3;
(function(EOL) {
    EOL["LF"] = "\n";
    EOL["CRLF"] = "\r\n";
})(EOL3 || (EOL3 = {}));
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
const { Deno: Deno3 } = globalThis;
const noColor1 = typeof Deno3?.noColor === "boolean" ? Deno3.noColor : true;
let enabled1 = !noColor1;
function code1(open, close) {
    return {
        open: `\x1b[${open.join(";")}m`,
        close: `\x1b[${close}m`,
        regexp: new RegExp(`\\x1b\\[${close}m`, "g")
    };
}
function run1(str, code) {
    return enabled1 ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}` : str;
}
function green1(str) {
    return run1(str, code1([
        32
    ], 39));
}
new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"
].join("|"), "g");
const encoder2 = new TextEncoder();
const decoder2 = new TextDecoder();
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
    return join15(...out);
}
function stringToURL(url) {
    return url.startsWith("file://") || url.startsWith("http://") || url.startsWith("https://") ? new URL(url) : toFileUrl11(resolve11(url));
}
async function hash(value1) {
    return decoder2.decode(encode(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder2.encode(value1)))));
}
async function urlToFilename(url) {
    const cacheFilename = baseUrlToFilename(url);
    const hashedFilename = await hash(url.pathname + url.search);
    return join15(cacheFilename, hashedFilename);
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
            return join15(home, "Library/Caches");
        }
    } else if (Deno.build.os === "linux") {
        const cacheHome = Deno.env.get("XDG_CACHE_HOME");
        if (cacheHome) {
            return cacheHome;
        } else {
            const home = homeDir();
            if (home) {
                return join15(home, ".cache");
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
        root = normalize15(isAbsolute11(dd) ? dd : join15(Deno.cwd(), dd));
    } else {
        const cd = cacheDir();
        if (cd) {
            root = join15(cd, "deno");
        } else {
            const hd = homeDir();
            if (hd) {
                root = join15(hd, ".deno");
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
    if ("name" in options && !Object.values(options.extensions).includes(extname11(url.pathname))) {
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
        location = join15(dir, "plug");
    } else if (location === "cache") {
        const dir = cacheDir();
        if (dir === undefined) {
            throw new Error("Could not get the cache directory, try using another CacheLocation in the plug options.");
        }
        location = join15(dir, "plug");
    } else if (location === "cwd") {
        location = join15(Deno.cwd(), "plug");
    } else if (location === "tmp") {
        location = await Deno.makeTempDir({
            prefix: "plug"
        });
    } else if (typeof location === "string" && location.startsWith("file://")) {
        location = fromFileUrl11(location);
    } else if (location instanceof URL) {
        if (location?.protocol !== "file:") {
            throw new TypeError("Cannot use any other protocol than file:// for an URL cache location.");
        }
        location = fromFileUrl11(location);
    }
    location = resolve11(normalize15(location));
    await ensureDir1(location);
    return location;
}
async function download(options) {
    const location = (typeof options === "object" && "location" in options ? options.location : undefined) ?? "deno";
    const setting = (typeof options === "object" && "cache" in options ? options.cache : undefined) ?? "use";
    const [url, directory] = await Promise.all([
        createDownloadURL(options),
        ensureCacheLocation(location)
    ]);
    const cacheBasePath = join15(directory, await urlToFilename(url));
    const cacheFilePath = `${cacheBasePath}${extname11(url.pathname)}`;
    const cacheMetaPath = `${cacheBasePath}.metadata.json`;
    const cached = setting === "use" ? await isFile(cacheFilePath) : setting === "only" || setting !== "reloadAll";
    await ensureDir1(dirname11(cacheBasePath));
    if (!cached) {
        const meta = {
            url
        };
        switch(url.protocol){
            case "http:":
            case "https:":
                {
                    console.log(`${green1("Downloading")} ${url}`);
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
                    console.log(`${green1("Copying")} ${url}`);
                    await Deno.copyFile(fromFileUrl11(url), cacheFilePath);
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
const __default = JSON.parse("{\n  \"name\": \"sqlite3\",\n  \"version\": \"0.9.1\",\n  \"github\": \"https://github.com/denodrivers/sqlite3\",\n\n  \"tasks\": {\n    \"test\": \"deno test --unstable -A test/test.ts\",\n    \"build\": \"deno run -A --unstable scripts/build.ts\",\n    \"bench-deno\": \"deno run -A --unstable bench/bench_deno.js 50 1000000\",\n    \"bench-deno-ffi\": \"deno run -A --unstable bench/bench_deno_ffi.js 50 1000000\",\n    \"bench-deno-wasm\": \"deno run -A --unstable bench/bench_deno_wasm.js 50 1000000\",\n    \"bench-node\": \"node bench/bench_node.js 50 1000000\",\n    \"bench-bun\": \"bun run bench/bench_bun.js 50 1000000\",\n    \"bench-bun-ffi\": \"bun run bench/bench_bun_ffi.js 50 1000000\",\n    \"bench-c\": \"./bench/bench 50 1000000\",\n    \"bench-python\": \"python ./bench/bench_python.py\",\n    \"bench:northwind\": \"deno bench -A --unstable bench/northwind/deno.js\",\n    \"bench-wasm:northwind\": \"deno run -A --unstable bench/northwind/deno_wasm.js\",\n    \"bench-node:northwind\": \"node bench/northwind/node.mjs\",\n    \"bench-bun:northwind\": \"bun run bench/northwind/bun.js\"\n  },\n\n  \"lint\": {\n    \"rules\": {\n      \"exclude\": [\n        \"camelcase\",\n        \"no-explicit-any\"\n      ],\n      \"include\": [\n        \"explicit-function-return-type\",\n        \"eqeqeq\",\n        \"explicit-module-boundary-types\"\n      ]\n    }\n  }\n}");
const importMeta2 = {
    url: "https://deno.land/x/sqlite3@0.9.1/src/ffi.ts",
    main: false
};
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
    },
    sqlite3_initialize: {
        parameters: [],
        result: "i32"
    }
};
let lib;
function tryGetEnv(key) {
    try {
        return Deno.env.get(key);
    } catch (e) {
        if (e instanceof Deno.errors.PermissionDenied) {
            return undefined;
        }
        throw e;
    }
}
try {
    const customPath = tryGetEnv("DENO_SQLITE_PATH");
    const sqliteLocal = tryGetEnv("DENO_SQLITE_LOCAL");
    if (sqliteLocal === "1") {
        lib = Deno.dlopen(new URL(`../build/${Deno.build.os === "windows" ? "" : "lib"}sqlite3${Deno.build.arch !== "x86_64" ? `_${Deno.build.arch}` : ""}.${Deno.build.os === "windows" ? "dll" : Deno.build.os === "darwin" ? "dylib" : "so"}`, importMeta2.url), symbols).symbols;
    } else if (customPath) {
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
    throw new Error("Failed to load SQLite3 Dynamic Library", {
        cause: e
    });
}
const init = lib.sqlite3_initialize();
if (init !== 0) {
    throw new Error(`Failed to initialize SQLite3: ${init}`);
}
const osType4 = (()=>{
    const { Deno: Deno1 } = globalThis;
    if (typeof Deno1?.build?.os === "string") {
        return Deno1.build.os;
    }
    const { navigator } = globalThis;
    if (navigator?.appVersion?.includes?.("Win")) {
        return "windows";
    }
    return "linux";
})();
const isWindows4 = osType4 === "windows";
const CHAR_FORWARD_SLASH4 = 47;
function assertPath4(path) {
    if (typeof path !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
    }
}
function isPosixPathSeparator4(code) {
    return code === 47;
}
function isPathSeparator4(code) {
    return isPosixPathSeparator4(code) || code === 92;
}
function isWindowsDeviceRoot4(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString4(path, allowAboveRoot, separator, isPathSeparator) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path.length; i <= len; ++i){
        if (i < len) code = path.charCodeAt(i);
        else if (isPathSeparator(code)) break;
        else code = CHAR_FORWARD_SLASH4;
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
function _format4(sep, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (base === sep) return dir;
    if (dir === pathObject.root) return dir + base;
    return dir + sep + base;
}
const WHITESPACE_ENCODINGS4 = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace4(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS4[c] ?? c;
    });
}
function lastPathSegment4(path, isSep, start = 0) {
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
function stripTrailingSeparators4(segment, isSep) {
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
function stripSuffix4(name, suffix) {
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
class DenoStdInternalError3 extends Error {
    constructor(message){
        super(message);
        this.name = "DenoStdInternalError";
    }
}
function assert4(expr, msg = "") {
    if (!expr) {
        throw new DenoStdInternalError3(msg);
    }
}
const sep10 = "\\";
const delimiter12 = ";";
function resolve12(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        const { Deno: Deno1 } = globalThis;
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
        assertPath4(path);
        const len = path.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator4(code)) {
                isAbsolute = true;
                if (isPathSeparator4(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator4(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator4(path.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator4(path.charCodeAt(j))) break;
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
            } else if (isWindowsDeviceRoot4(code)) {
                if (path.charCodeAt(1) === 58) {
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator4(path.charCodeAt(2))) {
                            isAbsolute = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator4(code)) {
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
    resolvedTail = normalizeString4(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator4);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function normalize16(path) {
    assertPath4(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator4(code)) {
            isAbsolute = true;
            if (isPathSeparator4(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator4(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator4(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator4(path.charCodeAt(j))) break;
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
        } else if (isWindowsDeviceRoot4(code)) {
            if (path.charCodeAt(1) === 58) {
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator4(path.charCodeAt(2))) {
                        isAbsolute = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator4(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString4(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator4);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute) tail = ".";
    if (tail.length > 0 && isPathSeparator4(path.charCodeAt(len - 1))) {
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
function isAbsolute12(path) {
    assertPath4(path);
    const len = path.length;
    if (len === 0) return false;
    const code = path.charCodeAt(0);
    if (isPathSeparator4(code)) {
        return true;
    } else if (isWindowsDeviceRoot4(code)) {
        if (len > 2 && path.charCodeAt(1) === 58) {
            if (isPathSeparator4(path.charCodeAt(2))) return true;
        }
    }
    return false;
}
function join16(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < pathsCount; ++i){
        const path = paths[i];
        assertPath4(path);
        if (path.length > 0) {
            if (joined === undefined) joined = firstPart = path;
            else joined += `\\${path}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert4(firstPart != null);
    if (isPathSeparator4(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator4(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator4(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator4(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize16(joined);
}
function relative12(from, to) {
    assertPath4(from);
    assertPath4(to);
    if (from === to) return "";
    const fromOrig = resolve12(from);
    const toOrig = resolve12(to);
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
function toNamespacedPath12(path) {
    if (typeof path !== "string") return path;
    if (path.length === 0) return "";
    const resolvedPath = resolve12(path);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot4(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path;
}
function dirname12(path) {
    assertPath4(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator4(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator4(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator4(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator4(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator4(path.charCodeAt(j))) break;
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
        } else if (isWindowsDeviceRoot4(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator4(path.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator4(code)) {
        return path;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator4(path.charCodeAt(i))) {
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
    return stripTrailingSeparators4(path.slice(0, end), isPosixPathSeparator4);
}
function basename12(path, suffix = "") {
    assertPath4(path);
    if (path.length === 0) return path;
    if (typeof suffix !== "string") {
        throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
    }
    let start = 0;
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot4(drive)) {
            if (path.charCodeAt(1) === 58) start = 2;
        }
    }
    const lastSegment = lastPathSegment4(path, isPathSeparator4, start);
    const strippedSegment = stripTrailingSeparators4(lastSegment, isPathSeparator4);
    return suffix ? stripSuffix4(strippedSegment, suffix) : strippedSegment;
}
function extname12(path) {
    assertPath4(path);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path.length >= 2 && path.charCodeAt(1) === 58 && isWindowsDeviceRoot4(path.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path.length - 1; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPathSeparator4(code)) {
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
function format13(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format4("\\", pathObject);
}
function parse14(path) {
    assertPath4(path);
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
        if (isPathSeparator4(code)) {
            rootEnd = 1;
            if (isPathSeparator4(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator4(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator4(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator4(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot4(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator4(path.charCodeAt(2))) {
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
    } else if (isPathSeparator4(code)) {
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
        if (isPathSeparator4(code)) {
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
function fromFileUrl12(url) {
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
function toFileUrl12(path) {
    if (!isAbsolute12(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace4(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const mod12 = {
    sep: sep10,
    delimiter: delimiter12,
    resolve: resolve12,
    normalize: normalize16,
    isAbsolute: isAbsolute12,
    join: join16,
    relative: relative12,
    toNamespacedPath: toNamespacedPath12,
    dirname: dirname12,
    basename: basename12,
    extname: extname12,
    format: format13,
    parse: parse14,
    fromFileUrl: fromFileUrl12,
    toFileUrl: toFileUrl12
};
const sep11 = "/";
const delimiter13 = ":";
function resolve13(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            const { Deno: Deno1 } = globalThis;
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
        }
        assertPath4(path);
        if (path.length === 0) {
            continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute = isPosixPathSeparator4(path.charCodeAt(0));
    }
    resolvedPath = normalizeString4(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator4);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function normalize17(path) {
    assertPath4(path);
    if (path.length === 0) return ".";
    const isAbsolute = isPosixPathSeparator4(path.charCodeAt(0));
    const trailingSeparator = isPosixPathSeparator4(path.charCodeAt(path.length - 1));
    path = normalizeString4(path, !isAbsolute, "/", isPosixPathSeparator4);
    if (path.length === 0 && !isAbsolute) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute) return `/${path}`;
    return path;
}
function isAbsolute13(path) {
    assertPath4(path);
    return path.length > 0 && isPosixPathSeparator4(path.charCodeAt(0));
}
function join17(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path = paths[i];
        assertPath4(path);
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `/${path}`;
        }
    }
    if (!joined) return ".";
    return normalize17(joined);
}
function relative13(from, to) {
    assertPath4(from);
    assertPath4(to);
    if (from === to) return "";
    from = resolve13(from);
    to = resolve13(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (!isPosixPathSeparator4(from.charCodeAt(fromStart))) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (!isPosixPathSeparator4(to.charCodeAt(toStart))) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (isPosixPathSeparator4(to.charCodeAt(toStart + i))) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (isPosixPathSeparator4(from.charCodeAt(fromStart + i))) {
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
        else if (isPosixPathSeparator4(fromCode)) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || isPosixPathSeparator4(from.charCodeAt(i))) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (isPosixPathSeparator4(to.charCodeAt(toStart))) ++toStart;
        return to.slice(toStart);
    }
}
function toNamespacedPath13(path) {
    return path;
}
function dirname13(path) {
    if (path.length === 0) return ".";
    let end = -1;
    let matchedNonSeparator = false;
    for(let i = path.length - 1; i >= 1; --i){
        if (isPosixPathSeparator4(path.charCodeAt(i))) {
            if (matchedNonSeparator) {
                end = i;
                break;
            }
        } else {
            matchedNonSeparator = true;
        }
    }
    if (end === -1) {
        return isPosixPathSeparator4(path.charCodeAt(0)) ? "/" : ".";
    }
    return stripTrailingSeparators4(path.slice(0, end), isPosixPathSeparator4);
}
function basename13(path, suffix = "") {
    assertPath4(path);
    if (path.length === 0) return path;
    if (typeof suffix !== "string") {
        throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
    }
    const lastSegment = lastPathSegment4(path, isPosixPathSeparator4);
    const strippedSegment = stripTrailingSeparators4(lastSegment, isPosixPathSeparator4);
    return suffix ? stripSuffix4(strippedSegment, suffix) : strippedSegment;
}
function extname13(path) {
    assertPath4(path);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i = path.length - 1; i >= 0; --i){
        const code = path.charCodeAt(i);
        if (isPosixPathSeparator4(code)) {
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
function format14(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format4("/", pathObject);
}
function parse15(path) {
    assertPath4(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path.length === 0) return ret;
    const isAbsolute = isPosixPathSeparator4(path.charCodeAt(0));
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
        if (isPosixPathSeparator4(code)) {
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
        ret.dir = stripTrailingSeparators4(path.slice(0, startPart - 1), isPosixPathSeparator4);
    } else if (isAbsolute) ret.dir = "/";
    return ret;
}
function fromFileUrl13(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function toFileUrl13(path) {
    if (!isAbsolute13(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace4(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
const mod13 = {
    sep: sep11,
    delimiter: delimiter13,
    resolve: resolve13,
    normalize: normalize17,
    isAbsolute: isAbsolute13,
    join: join17,
    relative: relative13,
    toNamespacedPath: toNamespacedPath13,
    dirname: dirname13,
    basename: basename13,
    extname: extname13,
    format: format14,
    parse: parse15,
    fromFileUrl: fromFileUrl13,
    toFileUrl: toFileUrl13
};
const path8 = isWindows4 ? mod12 : mod13;
const { join: join18, normalize: normalize18 } = path8;
const path9 = isWindows4 ? mod12 : mod13;
const { basename: basename14, delimiter: delimiter14, dirname: dirname14, extname: extname14, format: format15, fromFileUrl: fromFileUrl14, isAbsolute: isAbsolute14, join: join19, normalize: normalize19, parse: parse16, relative: relative14, resolve: resolve14, sep: sep12, toFileUrl: toFileUrl14, toNamespacedPath: toNamespacedPath14 } = path9;
const SQLITE3_OPEN_READONLY = 0x00000001;
const SQLITE3_OPEN_READWRITE = 0x00000002;
const SQLITE3_OPEN_CREATE = 0x00000004;
const SQLITE3_OPEN_MEMORY = 0x00000080;
const { sqlite3_errmsg, sqlite3_errstr } = lib;
const encoder3 = new TextEncoder();
function toCString(str) {
    return encoder3.encode(str + "\0");
}
class SqliteError extends Error {
    code;
    name;
    constructor(code = 1, message = "Unknown Error"){
        super(`${code}: ${message}`);
        this.code = code;
        this.name = "SqliteError";
    }
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
const { sqlite3_prepare_v2, sqlite3_reset, sqlite3_clear_bindings, sqlite3_step, sqlite3_column_count, sqlite3_column_type, sqlite3_column_text, sqlite3_finalize, sqlite3_column_int64, sqlite3_column_double, sqlite3_column_blob, sqlite3_column_bytes, sqlite3_column_name, sqlite3_expanded_sql, sqlite3_bind_parameter_count, sqlite3_bind_int, sqlite3_bind_int64, sqlite3_bind_text, sqlite3_bind_blob, sqlite3_bind_double, sqlite3_bind_parameter_index, sqlite3_sql, sqlite3_stmt_readonly, sqlite3_bind_parameter_name, sqlite3_changes, sqlite3_column_int, sqlite3_step_cb } = lib;
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
                return sqlite3_column_int64(handle, i);
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
    db;
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
        const handle = this.#handle;
        this.#begin();
        let status;
        if (this.callback) {
            status = sqlite3_step_cb(handle);
        } else {
            status = sqlite3_step(handle);
        }
        if (status !== 100 && status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(handle);
        return sqlite3_changes(this.db.unsafeHandle);
    }
    #runWithArgs(...params) {
        const handle = this.#handle;
        this.#begin();
        this.#bindAll(params);
        let status;
        if (this.callback) {
            status = sqlite3_step_cb(handle);
        } else {
            status = sqlite3_step(handle);
        }
        if (!this.#hasNoArgs && !this.#bound && params.length) {
            this.#bindRefs.clear();
        }
        if (status !== 100 && status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(handle);
        return sqlite3_changes(this.db.unsafeHandle);
    }
    #valuesNoArgs() {
        const handle = this.#handle;
        const callback = this.callback;
        this.#begin();
        const columnCount = sqlite3_column_count(handle);
        const result = [];
        const getRowArray = new Function("getColumn", `
      return function(h) {
        return [${Array.from({
            length: columnCount
        }).map((_, i)=>`getColumn(h, ${i}, ${this.db.int64})`).join(", ")}];
      };
      `)(getColumn);
        let status;
        if (callback) {
            status = sqlite3_step_cb(handle);
        } else {
            status = sqlite3_step(handle);
        }
        while(status === 100){
            result.push(getRowArray(handle));
            if (callback) {
                status = sqlite3_step_cb(handle);
            } else {
                status = sqlite3_step(handle);
            }
        }
        if (status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(handle);
        return result;
    }
    #valuesWithArgs(...params) {
        const handle = this.#handle;
        const callback = this.callback;
        this.#begin();
        this.#bindAll(params);
        const columnCount = sqlite3_column_count(handle);
        const result = [];
        const getRowArray = new Function("getColumn", `
      return function(h) {
        return [${Array.from({
            length: columnCount
        }).map((_, i)=>`getColumn(h, ${i}, ${this.db.int64})`).join(", ")}];
      };
      `)(getColumn);
        let status;
        if (callback) {
            status = sqlite3_step_cb(handle);
        } else {
            status = sqlite3_step(handle);
        }
        while(status === 100){
            result.push(getRowArray(handle));
            if (callback) {
                status = sqlite3_step_cb(handle);
            } else {
                status = sqlite3_step(handle);
            }
        }
        if (!this.#hasNoArgs && !this.#bound && params.length) {
            this.#bindRefs.clear();
        }
        if (status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(handle);
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
        const handle = this.#handle;
        const callback = this.callback;
        this.#begin();
        const getRowObject = this.getRowObject();
        const result = [];
        let status;
        if (callback) {
            status = sqlite3_step_cb(handle);
        } else {
            status = sqlite3_step(handle);
        }
        while(status === 100){
            result.push(getRowObject(handle));
            if (callback) {
                status = sqlite3_step_cb(handle);
            } else {
                status = sqlite3_step(handle);
            }
        }
        if (status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(handle);
        return result;
    }
    #allWithArgs(...params) {
        const handle = this.#handle;
        const callback = this.callback;
        this.#begin();
        this.#bindAll(params);
        const getRowObject = this.getRowObject();
        const result = [];
        let status;
        if (callback) {
            status = sqlite3_step_cb(handle);
        } else {
            status = sqlite3_step(handle);
        }
        while(status === 100){
            result.push(getRowObject(handle));
            if (callback) {
                status = sqlite3_step_cb(handle);
            } else {
                status = sqlite3_step(handle);
            }
        }
        if (!this.#hasNoArgs && !this.#bound && params.length) {
            this.#bindRefs.clear();
        }
        if (status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(handle);
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
        let status;
        if (this.callback) {
            status = sqlite3_step_cb(handle);
        } else {
            status = sqlite3_step(handle);
        }
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
        let status;
        if (this.callback) {
            status = sqlite3_step_cb(handle);
        } else {
            status = sqlite3_step(handle);
        }
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
        let status;
        if (this.callback) {
            status = sqlite3_step_cb(handle);
        } else {
            status = sqlite3_step(handle);
        }
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
        let status;
        if (this.callback) {
            status = sqlite3_step_cb(handle);
        } else {
            status = sqlite3_step(handle);
        }
        if (status === 100) {
            for(let i = 0; i < columnNames?.length; i++){
                row[columnNames[i]] = getColumn(handle, i, int64);
            }
            sqlite3_reset(handle);
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
        let status;
        if (this.callback) {
            status = sqlite3_step_cb(this.#handle);
        } else {
            status = sqlite3_step(this.#handle);
        }
        while(status === 100){
            yield getRowObject(this.#handle);
            if (this.callback) {
                status = sqlite3_step_cb(this.#handle);
            } else {
                status = sqlite3_step(this.#handle);
            }
        }
        if (status !== 101) {
            unwrap(status, this.db.unsafeHandle);
        }
        sqlite3_reset(this.#handle);
    }
}
const { sqlite3_blob_open, sqlite3_blob_bytes, sqlite3_blob_close, sqlite3_blob_read, sqlite3_blob_write } = lib;
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
const { sqlite3_open_v2, sqlite3_close_v2, sqlite3_changes: sqlite3_changes1, sqlite3_total_changes, sqlite3_last_insert_rowid, sqlite3_get_autocommit, sqlite3_exec, sqlite3_free, sqlite3_libversion, sqlite3_sourceid, sqlite3_complete, sqlite3_finalize: sqlite3_finalize1, sqlite3_result_blob, sqlite3_result_double, sqlite3_result_error, sqlite3_result_int64, sqlite3_result_null, sqlite3_result_text, sqlite3_value_blob, sqlite3_value_bytes, sqlite3_value_double, sqlite3_value_int64, sqlite3_value_text, sqlite3_value_type, sqlite3_create_function, sqlite3_result_int, sqlite3_aggregate_context, sqlite3_enable_load_extension, sqlite3_load_extension } = lib;
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
        this.#path = path instanceof URL ? fromFileUrl14(path) : path;
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
const wrapTransaction = (fn, db, { begin, commit, rollback, savepoint, release, rollbackTo })=>function sqliteTransaction() {
        const { apply } = Function.prototype;
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
const osType5 = (()=>{
    const { Deno: Deno1 } = globalThis;
    if (typeof Deno1?.build?.os === "string") {
        return Deno1.build.os;
    }
    const { navigator } = globalThis;
    if (navigator?.appVersion?.includes?.("Win")) {
        return "windows";
    }
    return "linux";
})();
const isWindows5 = osType5 === "windows";
const CHAR_FORWARD_SLASH5 = 47;
function assertPath5(path) {
    if (typeof path !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
    }
}
function isPosixPathSeparator5(code) {
    return code === 47;
}
function isPathSeparator5(code) {
    return isPosixPathSeparator5(code) || code === 92;
}
function isWindowsDeviceRoot5(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function normalizeString5(path, allowAboveRoot, separator, isPathSeparator) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path.length; i <= len; ++i){
        if (i < len) code = path.charCodeAt(i);
        else if (isPathSeparator(code)) break;
        else code = CHAR_FORWARD_SLASH5;
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
function stripTrailingSeparators5(segment, isSep) {
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
function posixResolve(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            const { Deno: Deno1 } = globalThis;
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
        }
        assertPath5(path);
        if (path.length === 0) {
            continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute = isPosixPathSeparator5(path.charCodeAt(0));
    }
    resolvedPath = normalizeString5(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator5);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function windowsResolve(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        const { Deno: Deno1 } = globalThis;
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
        assertPath5(path);
        const len = path.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator5(code)) {
                isAbsolute = true;
                if (isPathSeparator5(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator5(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator5(path.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator5(path.charCodeAt(j))) break;
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
            } else if (isWindowsDeviceRoot5(code)) {
                if (path.charCodeAt(1) === 58) {
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator5(path.charCodeAt(2))) {
                            isAbsolute = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator5(code)) {
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
    resolvedTail = normalizeString5(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator5);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function assertArg(path) {
    assertPath5(path);
    if (path.length === 0) return ".";
}
function posixNormalize(path) {
    assertArg(path);
    const isAbsolute = isPosixPathSeparator5(path.charCodeAt(0));
    const trailingSeparator = isPosixPathSeparator5(path.charCodeAt(path.length - 1));
    path = normalizeString5(path, !isAbsolute, "/", isPosixPathSeparator5);
    if (path.length === 0 && !isAbsolute) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute) return `/${path}`;
    return path;
}
function windowsNormalize(path) {
    assertArg(path);
    const len = path.length;
    let rootEnd = 0;
    let device;
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator5(code)) {
            isAbsolute = true;
            if (isPathSeparator5(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator5(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator5(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator5(path.charCodeAt(j))) break;
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
        } else if (isWindowsDeviceRoot5(code)) {
            if (path.charCodeAt(1) === 58) {
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator5(path.charCodeAt(2))) {
                        isAbsolute = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator5(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString5(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator5);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute) tail = ".";
    if (tail.length > 0 && isPathSeparator5(path.charCodeAt(len - 1))) {
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
function windowsIsAbsolute(path) {
    assertPath5(path);
    const len = path.length;
    if (len === 0) return false;
    const code = path.charCodeAt(0);
    if (isPathSeparator5(code)) {
        return true;
    } else if (isWindowsDeviceRoot5(code)) {
        if (len > 2 && path.charCodeAt(1) === 58) {
            if (isPathSeparator5(path.charCodeAt(2))) return true;
        }
    }
    return false;
}
function posixIsAbsolute(path) {
    assertPath5(path);
    return path.length > 0 && isPosixPathSeparator5(path.charCodeAt(0));
}
class AssertionError1 extends Error {
    name = "AssertionError";
    constructor(message){
        super(message);
    }
}
function assert5(expr, msg = "") {
    if (!expr) {
        throw new AssertionError1(msg);
    }
}
function posixJoin(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path = paths[i];
        assertPath5(path);
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `/${path}`;
        }
    }
    if (!joined) return ".";
    return posixNormalize(joined);
}
function windowsJoin(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < paths.length; ++i){
        const path = paths[i];
        assertPath5(path);
        if (path.length > 0) {
            if (joined === undefined) joined = firstPart = path;
            else joined += `\\${path}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert5(firstPart != null);
    if (isPathSeparator5(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator5(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator5(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator5(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return windowsNormalize(joined);
}
function assertArgs(from, to) {
    assertPath5(from);
    assertPath5(to);
    if (from === to) return "";
}
function posixRelative(from, to) {
    assertArgs(from, to);
    from = posixResolve(from);
    to = posixResolve(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (!isPosixPathSeparator5(from.charCodeAt(fromStart))) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (!isPosixPathSeparator5(to.charCodeAt(toStart))) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (isPosixPathSeparator5(to.charCodeAt(toStart + i))) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (isPosixPathSeparator5(from.charCodeAt(fromStart + i))) {
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
        else if (isPosixPathSeparator5(fromCode)) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || isPosixPathSeparator5(from.charCodeAt(i))) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (isPosixPathSeparator5(to.charCodeAt(toStart))) ++toStart;
        return to.slice(toStart);
    }
}
function windowsRelative(from, to) {
    assertArgs(from, to);
    const fromOrig = windowsResolve(from);
    const toOrig = windowsResolve(to);
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
function posixToNamespacedPath(path) {
    return path;
}
function windowsToNamespacedPath(path) {
    if (typeof path !== "string") return path;
    if (path.length === 0) return "";
    const resolvedPath = windowsResolve(path);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot5(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path;
}
function assertArg1(path) {
    assertPath5(path);
    if (path.length === 0) return ".";
}
function posixDirname(path) {
    assertArg1(path);
    let end = -1;
    let matchedNonSeparator = false;
    for(let i = path.length - 1; i >= 1; --i){
        if (isPosixPathSeparator5(path.charCodeAt(i))) {
            if (matchedNonSeparator) {
                end = i;
                break;
            }
        } else {
            matchedNonSeparator = true;
        }
    }
    if (end === -1) {
        return isPosixPathSeparator5(path.charCodeAt(0)) ? "/" : ".";
    }
    return stripTrailingSeparators5(path.slice(0, end), isPosixPathSeparator5);
}
function windowsDirname(path) {
    assertArg1(path);
    const len = path.length;
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator5(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator5(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator5(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator5(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator5(path.charCodeAt(j))) break;
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
        } else if (isWindowsDeviceRoot5(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator5(path.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator5(code)) {
        return path;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator5(path.charCodeAt(i))) {
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
    return stripTrailingSeparators5(path.slice(0, end), isPosixPathSeparator5);
}
function stripSuffix5(name, suffix) {
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
function lastPathSegment5(path, isSep, start = 0) {
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
function assertArgs1(path, suffix) {
    assertPath5(path);
    if (path.length === 0) return path;
    if (typeof suffix !== "string") {
        throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
    }
}
function posixBasename(path, suffix = "") {
    assertArgs1(path, suffix);
    const lastSegment = lastPathSegment5(path, isPosixPathSeparator5);
    const strippedSegment = stripTrailingSeparators5(lastSegment, isPosixPathSeparator5);
    return suffix ? stripSuffix5(strippedSegment, suffix) : strippedSegment;
}
function windowsBasename(path, suffix = "") {
    assertArgs1(path, suffix);
    let start = 0;
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot5(drive)) {
            if (path.charCodeAt(1) === 58) start = 2;
        }
    }
    const lastSegment = lastPathSegment5(path, isPathSeparator5, start);
    const strippedSegment = stripTrailingSeparators5(lastSegment, isPathSeparator5);
    return suffix ? stripSuffix5(strippedSegment, suffix) : strippedSegment;
}
function posixExtname(path) {
    assertPath5(path);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i = path.length - 1; i >= 0; --i){
        const code = path.charCodeAt(i);
        if (isPosixPathSeparator5(code)) {
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
function windowsExtname(path) {
    assertPath5(path);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path.length >= 2 && path.charCodeAt(1) === 58 && isWindowsDeviceRoot5(path.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path.length - 1; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPathSeparator5(code)) {
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
function _format5(sep, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (base === sep) return dir;
    if (dir === pathObject.root) return dir + base;
    return dir + sep + base;
}
function assertArg2(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
}
function posixFormat(pathObject) {
    assertArg2(pathObject);
    return _format5("/", pathObject);
}
function windowsFormat(pathObject) {
    assertArg2(pathObject);
    return _format5("\\", pathObject);
}
function posixParse(path) {
    assertPath5(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path.length === 0) return ret;
    const isAbsolute = isPosixPathSeparator5(path.charCodeAt(0));
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
        if (isPosixPathSeparator5(code)) {
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
        ret.dir = stripTrailingSeparators5(path.slice(0, startPart - 1), isPosixPathSeparator5);
    } else if (isAbsolute) ret.dir = "/";
    return ret;
}
function windowsParse(path) {
    assertPath5(path);
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
        if (isPathSeparator5(code)) {
            rootEnd = 1;
            if (isPathSeparator5(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator5(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator5(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator5(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot5(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator5(path.charCodeAt(2))) {
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
    } else if (isPathSeparator5(code)) {
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
        if (isPathSeparator5(code)) {
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
function assertArg3(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return url;
}
function posixFromFileUrl(url) {
    url = assertArg3(url);
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function windowsFromFileUrl(url) {
    url = assertArg3(url);
    let path = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        path = `\\\\${url.hostname}${path}`;
    }
    return path;
}
const WHITESPACE_ENCODINGS5 = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace5(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS5[c] ?? c;
    });
}
function posixToFileUrl(path) {
    if (!posixIsAbsolute(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace5(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
function windowsToFileUrl(path) {
    if (!windowsIsAbsolute(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace5(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
const sep13 = "\\";
const delimiter15 = ";";
const mod14 = {
    resolve: windowsResolve,
    normalize: windowsNormalize,
    isAbsolute: windowsIsAbsolute,
    join: windowsJoin,
    relative: windowsRelative,
    toNamespacedPath: windowsToNamespacedPath,
    dirname: windowsDirname,
    basename: windowsBasename,
    extname: windowsExtname,
    format: windowsFormat,
    parse: windowsParse,
    fromFileUrl: windowsFromFileUrl,
    toFileUrl: windowsToFileUrl,
    sep: sep13,
    delimiter: delimiter15
};
const sep14 = "/";
const delimiter16 = ":";
const mod15 = {
    resolve: posixResolve,
    normalize: posixNormalize,
    isAbsolute: posixIsAbsolute,
    join: posixJoin,
    relative: posixRelative,
    toNamespacedPath: posixToNamespacedPath,
    dirname: posixDirname,
    basename: posixBasename,
    extname: posixExtname,
    format: posixFormat,
    parse: posixParse,
    fromFileUrl: posixFromFileUrl,
    toFileUrl: posixToFileUrl,
    sep: sep14,
    delimiter: delimiter16
};
function resolve15(...pathSegments) {
    return isWindows5 ? windowsResolve(...pathSegments) : posixResolve(...pathSegments);
}
const path10 = isWindows5 ? mod14 : mod15;
const { join: join20, normalize: normalize20 } = path10;
isWindows5 ? mod14.delimiter : mod15.delimiter;
async function openDatabase(options) {
    const path = resolve15(Deno.cwd(), "./db/"), fileName = resolve15(path, "main.db");
    await Deno.mkdir(path, {
        recursive: true
    });
    const database = new Database(fileName, options);
    return database;
}
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
const tm = new PupTelemetry();
const database = await openDatabase({
    int64: true
});
const DailyCurrencyUpdate = async ()=>{
    log("info", `Scheduled data update started`);
    const dateToday = new Date();
    dateToday.setHours(0, 0, 0, 0);
    const maxCurrencyResult = database.prepare("SELECT MAX(period) as mp FROM exchangerate WHERE date >= (?)").values(dateToday.toLocaleDateString("sv-SE"));
    if (maxCurrencyResult[0][0] === null) {
        const result = await ExchangeRate();
        const entries = Object.entries(result.entries);
        for (const [currency, value1] of entries){
            try {
                database.prepare("INSERT INTO exchangerate (currency, value, period, date) VALUES (?,?,?,?)").run(currency, value1, dateToday.getTime(), dateToday.toLocaleDateString("sv-SE"));
            } catch (e) {
                log("info", `Error occured while updating data, skipping. Error: ${e}`);
            }
        }
    }
    log("info", `Scheduled data update done`);
    tm.emit("spotweb-main-1", "clear_cache", {
        cache: "exrate"
    });
    tm.emit("spotweb-main-2", "clear_cache", {
        cache: "exrate"
    });
    tm.emit("spotweb-main-3", "clear_cache", {
        cache: "exrate"
    });
    database.close();
    Deno.exit(0);
};
DailyCurrencyUpdate();
