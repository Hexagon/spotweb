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
const { hasOwn  } = Object;
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
const { join: join2 , normalize: normalize2  } = path;
const path1 = isWindows ? mod : mod1;
const { basename: basename2 , delimiter: delimiter2 , dirname: dirname2 , extname: extname2 , format: format2 , fromFileUrl: fromFileUrl2 , isAbsolute: isAbsolute2 , join: join3 , normalize: normalize3 , parse: parse2 , relative: relative2 , resolve: resolve2 , sep: sep2 , toFileUrl: toFileUrl2 , toNamespacedPath: toNamespacedPath2  } = path1;
const { Deno: Deno1  } = globalThis;
typeof Deno1?.noColor === "boolean" ? Deno1.noColor : true;
new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"
].join("|"), "g");
var tokenType;
(function(tokenType) {
    tokenType[tokenType["beginObject"] = 0] = "beginObject";
    tokenType[tokenType["endObject"] = 1] = "endObject";
    tokenType[tokenType["beginArray"] = 2] = "beginArray";
    tokenType[tokenType["endArray"] = 3] = "endArray";
    tokenType[tokenType["nameSeparator"] = 4] = "nameSeparator";
    tokenType[tokenType["valueSeparator"] = 5] = "valueSeparator";
    tokenType[tokenType["nullOrTrueOrFalseOrNumber"] = 6] = "nullOrTrueOrFalseOrNumber";
    tokenType[tokenType["string"] = 7] = "string";
})(tokenType || (tokenType = {}));
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
        const res = this.#parseJSONValue(token);
        const { done , value  } = this.#tokenized.next();
        if (!done) {
            throw new SyntaxError(buildErrorMessage(value));
        }
        return res;
    }
    #getNext() {
        const { done , value  } = this.#tokenized.next();
        if (done) {
            throw new SyntaxError("Unexpected end of JSONC input");
        }
        return value;
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
                        type: tokenType.beginObject,
                        position: i
                    };
                    break;
                case "}":
                    yield {
                        type: tokenType.endObject,
                        position: i
                    };
                    break;
                case "[":
                    yield {
                        type: tokenType.beginArray,
                        position: i
                    };
                    break;
                case "]":
                    yield {
                        type: tokenType.endArray,
                        position: i
                    };
                    break;
                case ":":
                    yield {
                        type: tokenType.nameSeparator,
                        position: i
                    };
                    break;
                case ",":
                    yield {
                        type: tokenType.valueSeparator,
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
                            type: tokenType.string,
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
                            type: tokenType.nullOrTrueOrFalseOrNumber,
                            sourceText: this.#text.substring(startIndex, i + 1),
                            position: startIndex
                        };
                    }
            }
        }
    }
    #parseJSONValue(value) {
        switch(value.type){
            case tokenType.beginObject:
                return this.#parseObject();
            case tokenType.beginArray:
                return this.#parseArray();
            case tokenType.nullOrTrueOrFalseOrNumber:
                return this.#parseNullOrTrueOrFalseOrNumber(value);
            case tokenType.string:
                return this.#parseString(value);
            default:
                throw new SyntaxError(buildErrorMessage(value));
        }
    }
    #parseObject() {
        const target = {};
        for(let isFirst = true;; isFirst = false){
            const token1 = this.#getNext();
            if ((isFirst || this.#options.allowTrailingComma) && token1.type === tokenType.endObject) {
                return target;
            }
            if (token1.type !== tokenType.string) {
                throw new SyntaxError(buildErrorMessage(token1));
            }
            const key = this.#parseString(token1);
            const token2 = this.#getNext();
            if (token2.type !== tokenType.nameSeparator) {
                throw new SyntaxError(buildErrorMessage(token2));
            }
            const token3 = this.#getNext();
            Object.defineProperty(target, key, {
                value: this.#parseJSONValue(token3),
                writable: true,
                enumerable: true,
                configurable: true
            });
            const token4 = this.#getNext();
            if (token4.type === tokenType.endObject) {
                return target;
            }
            if (token4.type !== tokenType.valueSeparator) {
                throw new SyntaxError(buildErrorMessage(token4));
            }
        }
    }
    #parseArray() {
        const target = [];
        for(let isFirst = true;; isFirst = false){
            const token1 = this.#getNext();
            if ((isFirst || this.#options.allowTrailingComma) && token1.type === tokenType.endArray) {
                return target;
            }
            target.push(this.#parseJSONValue(token1));
            const token2 = this.#getNext();
            if (token2.type === tokenType.endArray) {
                return target;
            }
            if (token2.type !== tokenType.valueSeparator) {
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
    #parseNullOrTrueOrFalseOrNumber(value2) {
        if (value2.sourceText === "null") {
            return null;
        }
        if (value2.sourceText === "true") {
            return true;
        }
        if (value2.sourceText === "false") {
            return false;
        }
        let parsed;
        try {
            parsed = originalJSONParse(value2.sourceText);
        } catch  {
            throw new SyntaxError(buildErrorMessage(value2));
        }
        assert(typeof parsed === "number");
        return parsed;
    }
}
function buildErrorMessage({ type , sourceText , position  }) {
    let token = "";
    switch(type){
        case tokenType.beginObject:
            token = "{";
            break;
        case tokenType.endObject:
            token = "}";
            break;
        case tokenType.beginArray:
            token = "[";
            break;
        case tokenType.endArray:
            token = "]";
            break;
        case tokenType.nameSeparator:
            token = ":";
            break;
        case tokenType.valueSeparator:
            token = ",";
            break;
        case tokenType.nullOrTrueOrFalseOrNumber:
        case tokenType.string:
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
            async resolve (value) {
                await value;
                state = "fulfilled";
                resolve(value);
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
            const { value , done  } = await iterator.next();
            if (done) {
                --this.#iteratorCount;
            } else {
                this.#yields.push({
                    iterator,
                    value
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
                const { iterator , value  } = this.#yields[i];
                yield value;
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
    #grow(n1) {
        const m = this.length;
        if (m === 0 && this.#off !== 0) {
            this.reset();
        }
        const i = this.#tryGrowByReslice(n1);
        if (i >= 0) {
            return i;
        }
        const c = this.capacity;
        if (n1 <= Math.floor(c / 2) - m) {
            copy(this.#buf.subarray(this.#off), this.#buf);
        } else if (c + n1 > MAX_SIZE) {
            throw new Error("The buffer cannot be grown beyond the maximum size.");
        } else {
            const buf = new Uint8Array(Math.min(2 * c + n1, MAX_SIZE));
            copy(this.#buf.subarray(this.#off), buf);
            this.#buf = buf;
        }
        this.#off = 0;
        this.#reslice(Math.min(m + n1, MAX_SIZE));
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
    add(value, start = 0, end = value.byteLength) {
        if (value.byteLength === 0 || end - start === 0) {
            return;
        }
        checkRange(start, end, value.byteLength);
        this.#chunks.push({
            value,
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
            const { offset , start , end  } = this.#chunks[i];
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
        const { value , offset , start  } = this.#chunks[idx];
        return value[start + i - offset];
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
        for(let i = startIdx; i < endIdx; i++){
            const chunk = this.#chunks[i];
            const len = chunk.end - chunk.start;
            result.set(chunk.value.subarray(chunk.start, chunk.end), written);
            written += len;
        }
        const last = this.#chunks[endIdx];
        const rest = end - start - written;
        result.set(last.value.subarray(last.start, last.start + rest), written);
        return result;
    }
    concat() {
        const result = new Uint8Array(this.#len);
        let sum = 0;
        for (const { value , start , end  } of this.#chunks){
            result.set(value.subarray(start, end), sum);
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
const maxDelay = Math.pow(2, 32 - 1) - 1;
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
    util.jsonStringifyReplacer = (_, value)=>{
        if (typeof value === "bigint") {
            return value.toString();
        }
        return value;
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
    const { data , path , errorMaps , issueData  } = params;
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
            const { key , value  } = pair;
            if (key.status === "aborted") return INVALID;
            if (value.status === "aborted") return INVALID;
            if (key.status === "dirty") status.dirty();
            if (value.status === "dirty") status.dirty();
            if (typeof value.value !== "undefined" || pair.alwaysSet) {
                finalObject[key.value] = value.value;
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
const DIRTY = (value)=>({
        status: "dirty",
        value
    });
const OK = (value)=>({
        status: "valid",
        value
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
    constructor(parent, value, path, key){
        this.parent = parent;
        this.data = value;
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
    const { errorMap , invalid_type_error , required_error , description  } = params;
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
    includes(value, options) {
        return this._addCheck({
            kind: "includes",
            value: value,
            position: options?.position,
            ...errorUtil.errToObj(options?.message)
        });
    }
    startsWith(value, message) {
        return this._addCheck({
            kind: "startsWith",
            value: value,
            ...errorUtil.errToObj(message)
        });
    }
    endsWith(value, message) {
        return this._addCheck({
            kind: "endsWith",
            value: value,
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
    gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    min = this.gte;
    gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    max = this.lte;
    lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
        return new ZodNumber({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind,
                    value,
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
    multipleOf(value, message) {
        return this._addCheck({
            kind: "multipleOf",
            value: value,
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
    gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    min = this.gte;
    gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    max = this.lte;
    lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
        return new ZodBigInt({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind,
                    value,
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
    multipleOf(value, message) {
        return this._addCheck({
            kind: "multipleOf",
            value,
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
        const { ctx , status  } = this._processInputParams(input);
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
        const { status , ctx  } = this._processInputParams(input);
        const { shape , keys: shapeKeys  } = this._getCached();
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
            const value = ctx.data[key];
            pairs.push({
                key: {
                    status: "valid",
                    value: key
                },
                value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
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
                const value = ctx.data[key];
                pairs.push({
                    key: {
                        status: "valid",
                        value: key
                    },
                    value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
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
        const { ctx  } = this._processInputParams(input);
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
        const { ctx  } = this._processInputParams(input);
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
            for (const value of discriminatorValues){
                if (optionsMap.has(value)) {
                    throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
                }
                optionsMap.set(value, type);
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
        const { status , ctx  } = this._processInputParams(input);
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
        const { status , ctx  } = this._processInputParams(input);
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
        const { status , ctx  } = this._processInputParams(input);
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
        const { status , ctx  } = this._processInputParams(input);
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
        ].map(([key, value], index)=>{
            return {
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [
                    index,
                    "key"
                ])),
                value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [
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
                    const value = await pair.value;
                    if (key.status === "aborted" || value.status === "aborted") {
                        return INVALID;
                    }
                    if (key.status === "dirty" || value.status === "dirty") {
                        status.dirty();
                    }
                    finalMap.set(key.value, value.value);
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
                const value = pair.value;
                if (key.status === "aborted" || value.status === "aborted") {
                    return INVALID;
                }
                if (key.status === "dirty" || value.status === "dirty") {
                    status.dirty();
                }
                finalMap.set(key.value, value.value);
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
        const { status , ctx  } = this._processInputParams(input);
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
        const { ctx  } = this._processInputParams(input);
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
        const { ctx  } = this._processInputParams(input);
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
    static create = (value, params)=>{
        return new ZodLiteral({
            value: value,
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
        const { ctx  } = this._processInputParams(input);
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
        const { status , ctx  } = this._processInputParams(input);
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
        const { ctx  } = this._processInputParams(input);
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
        const { ctx  } = this._processInputParams(input);
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
        const { ctx  } = this._processInputParams(input);
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
        const { status , ctx  } = this._processInputParams(input);
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
    staleMessageLimitMs;
    constructor(filePath, staleMessageLimitMs){
        this.filePath = filePath;
        this.staleMessageLimitMs = staleMessageLimitMs ?? 30000;
    }
    async sendData(data) {
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
    async receiveData() {
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
            } catch (_e) {
                throw new Error(`Invalid content in ${this.filePath}.ipc`);
            }
            return receivedMessages;
        } else {
            return [];
        }
    }
    async close() {
        try {
            await Deno.remove(this.filePath);
        } catch (_e) {}
    }
}
class PupTelemetry {
    static instance;
    events = new EventEmitter();
    intervalSeconds = 15;
    timer;
    aborted = false;
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
            const ipc = new FileIPC(ipcPath);
            const messages = await ipc.receiveData();
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
    async telemetryWatchdog() {
        try {
            await this.sendMainTelemetry();
            await this.checkIpc();
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
            ipc.sendData(JSON.stringify(message));
        } else {}
    }
    close() {
        this.aborted = true;
        if (this.timer) {
            clearTimeout(this.timer);
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
    #debug(path2, string) {
        if (this.#options.debug) {
            console.debug(`${path2.map((node)=>node[$XML].name).join(" > ")} | ${string}`.trim());
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
    #node({ path: path11  }) {
        if (this.#options.progress) {
            this.#options.progress(this.#stream.cursor);
        }
        if (this.#peek(tokens.comment.start)) {
            return {
                [schema.comment]: this.#comment({
                    path: path11
                })
            };
        }
        return this.#tag({
            path: path11
        });
    }
    #prolog({ path: path21  }) {
        this.#debug(path21, "parsing prolog");
        const prolog = this.#make.node({
            name: "xml",
            path: path21
        });
        this.#consume(tokens.prolog.start);
        while(!this.#peek(tokens.prolog.end)){
            Object.assign(prolog, this.#attribute({
                path: [
                    ...path21,
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
    #comment({ path: path111  }) {
        this.#debug(path111, "parsing comment");
        this.#consume(tokens.comment.start);
        const comment = this.#capture(tokens.comment.regex.end).trim();
        this.#consume(tokens.comment.end);
        return comment;
    }
    #revive({ key , value: value3 , tag  }) {
        return this.#options.reviver.call(tag, {
            key,
            tag: tag[$XML].name,
            properties: !(key.startsWith(schema.attribute.prefix) || key.startsWith(schema.property.prefix)) ? {
                ...tag
            } : null,
            value: (()=>{
                switch(true){
                    case (this.#options.emptyToNull ?? true) && /^\s*$/.test(value3):
                        return null;
                    case (this.#options.reviveBooleans ?? true) && /^(?:true|false)$/i.test(value3):
                        return /^true$/i.test(value3);
                    case this.#options.reviveNumbers ?? true:
                        {
                            const num = Number(value3);
                            if (Number.isFinite(num)) {
                                return num;
                            }
                        }
                    default:
                        value3 = value3.replace(tokens.entity.regex.entities, (_, hex, code)=>String.fromCharCode(parseInt(code, hex ? 16 : 10)));
                        for (const [entity, character] of Object.entries(entities.xml)){
                            value3 = value3.replaceAll(entity, character);
                        }
                        return value3;
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
function parse3(content, options) {
    if (typeof content === "string") {
        content = new Streamable(content);
    }
    return new Parser(new Stream(content), options).parse();
}
const ExchangeRate = async ()=>{
    const result = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"), resultText = await result.text(), resultJson = parse3(resultText);
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
const path12 = isWindows1 ? mod2 : mod3;
const { join: join6 , normalize: normalize6  } = path12;
const path13 = isWindows1 ? mod2 : mod3;
const { basename: basename5 , delimiter: delimiter5 , dirname: dirname5 , extname: extname5 , format: format5 , fromFileUrl: fromFileUrl5 , isAbsolute: isAbsolute5 , join: join7 , normalize: normalize7 , parse: parse6 , relative: relative5 , resolve: resolve5 , sep: sep5 , toFileUrl: toFileUrl5 , toNamespacedPath: toNamespacedPath5  } = path13;
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
const { Deno: Deno2  } = globalThis;
const noColor = typeof Deno2?.noColor === "boolean" ? Deno2.noColor : true;
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
    return join7(...out);
}
function stringToURL(url) {
    return url.startsWith("file://") || url.startsWith("http://") || url.startsWith("https://") ? new URL(url) : toFileUrl5(resolve5(url));
}
async function hash(value) {
    return decoder.decode(encode(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))));
}
async function urlToFilename(url) {
    const cacheFilename = baseUrlToFilename(url);
    const hashedFilename = await hash(url.pathname + url.search);
    return join7(cacheFilename, hashedFilename);
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
            return join7(home, "Library/Caches");
        }
    } else if (Deno.build.os === "linux") {
        const cacheHome = Deno.env.get("XDG_CACHE_HOME");
        if (cacheHome) {
            return cacheHome;
        } else {
            const home = homeDir();
            if (home) {
                return join7(home, ".cache");
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
        root = normalize7(isAbsolute5(dd) ? dd : join7(Deno.cwd(), dd));
    } else {
        const cd = cacheDir();
        if (cd) {
            root = join7(cd, "deno");
        } else {
            const hd = homeDir();
            if (hd) {
                root = join7(hd, ".deno");
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
    if ("name" in options && !Object.values(options.extensions).includes(extname5(url.pathname))) {
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
        location = join7(dir, "plug");
    } else if (location === "cache") {
        const dir = cacheDir();
        if (dir === undefined) {
            throw new Error("Could not get the cache directory, try using another CacheLocation in the plug options.");
        }
        location = join7(dir, "plug");
    } else if (location === "cwd") {
        location = join7(Deno.cwd(), "plug");
    } else if (location === "tmp") {
        location = await Deno.makeTempDir({
            prefix: "plug"
        });
    } else if (typeof location === "string" && location.startsWith("file://")) {
        location = fromFileUrl5(location);
    } else if (location instanceof URL) {
        if (location?.protocol !== "file:") {
            throw new TypeError("Cannot use any other protocol than file:// for an URL cache location.");
        }
        location = fromFileUrl5(location);
    }
    location = resolve5(normalize7(location));
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
    const cacheBasePath = join7(directory, await urlToFilename(url));
    const cacheFilePath = `${cacheBasePath}${extname5(url.pathname)}`;
    const cacheMetaPath = `${cacheBasePath}.metadata.json`;
    const cached = setting === "use" ? await isFile(cacheFilePath) : setting === "only" || setting !== "reloadAll";
    await ensureDir(dirname5(cacheBasePath));
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
                    await Deno.copyFile(fromFileUrl5(url), cacheFilePath);
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
const importMeta = {
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
        lib = Deno.dlopen(new URL(`../build/${Deno.build.os === "windows" ? "" : "lib"}sqlite3${Deno.build.arch !== "x86_64" ? `_${Deno.build.arch}` : ""}.${Deno.build.os === "windows" ? "dll" : Deno.build.os === "darwin" ? "dylib" : "so"}`, importMeta.url), symbols).symbols;
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
const path14 = isWindows2 ? mod4 : mod5;
const { join: join10 , normalize: normalize10  } = path14;
const path15 = isWindows2 ? mod4 : mod5;
const { basename: basename8 , delimiter: delimiter8 , dirname: dirname8 , extname: extname8 , format: format8 , fromFileUrl: fromFileUrl8 , isAbsolute: isAbsolute8 , join: join11 , normalize: normalize11 , parse: parse9 , relative: relative8 , resolve: resolve8 , sep: sep8 , toFileUrl: toFileUrl8 , toNamespacedPath: toNamespacedPath8  } = path15;
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
    #runWithArgs(...params1) {
        const handle = this.#handle;
        this.#begin();
        this.#bindAll(params1);
        let status;
        if (this.callback) {
            status = sqlite3_step_cb(handle);
        } else {
            status = sqlite3_step(handle);
        }
        if (!this.#hasNoArgs && !this.#bound && params1.length) {
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
    #valuesWithArgs(...params2) {
        const handle = this.#handle;
        const callback = this.callback;
        this.#begin();
        this.#bindAll(params2);
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
        if (!this.#hasNoArgs && !this.#bound && params2.length) {
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
    #allWithArgs(...params3) {
        const handle = this.#handle;
        const callback = this.callback;
        this.#begin();
        this.#bindAll(params3);
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
        if (!this.#hasNoArgs && !this.#bound && params3.length) {
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
        this.#path = path instanceof URL ? fromFileUrl8(path) : path;
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
async function openDatabase(options) {
    const path = resolve8(Deno.cwd(), "./db/"), fileName = resolve8(path, "main.db");
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
        for (const [currency, value] of entries){
            try {
                database.prepare("INSERT INTO exchangerate (currency, value, period, date) VALUES (?,?,?,?)").run(currency, value, dateToday.getTime(), dateToday.toLocaleDateString("sv-SE"));
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
};
DailyCurrencyUpdate();
