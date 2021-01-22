const digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const totalLen = 12 + 10;
function initCrypto() {
    let cryptoObj = null;
    if (typeof globalThis !== "undefined") {
        if ("crypto" in globalThis && globalThis.crypto.getRandomValues) {
            cryptoObj = globalThis.crypto;
        }
    }
    if (!cryptoObj) {
        cryptoObj = {
            getRandomValues: function(array) {
                for(let i = 0; i < array.length; i++){
                    array[i] = Math.floor(Math.random() * 255);
                }
            }
        };
    }
    return cryptoObj;
}
var ErrorCode;
(function(ErrorCode1) {
    ErrorCode1["API_ERROR"] = "BAD API";
    ErrorCode1["BAD_AUTHENTICATION"] = "BAD_AUTHENTICATION";
    ErrorCode1["BAD_CREDS"] = "BAD_CREDS";
    ErrorCode1["BAD_HEADER"] = "BAD_HEADER";
    ErrorCode1["BAD_JSON"] = "BAD_JSON";
    ErrorCode1["BAD_PAYLOAD"] = "BAD_PAYLOAD";
    ErrorCode1["BAD_SUBJECT"] = "BAD_SUBJECT";
    ErrorCode1["CANCELLED"] = "CANCELLED";
    ErrorCode1["CONNECTION_CLOSED"] = "CONNECTION_CLOSED";
    ErrorCode1["CONNECTION_DRAINING"] = "CONNECTION_DRAINING";
    ErrorCode1["CONNECTION_REFUSED"] = "CONNECTION_REFUSED";
    ErrorCode1["CONNECTION_TIMEOUT"] = "CONNECTION_TIMEOUT";
    ErrorCode1["DISCONNECT"] = "DISCONNECT";
    ErrorCode1["INVALID_OPTION"] = "INVALID_OPTION";
    ErrorCode1["INVALID_PAYLOAD_TYPE"] = "INVALID_PAYLOAD";
    ErrorCode1["MAX_PAYLOAD_EXCEEDED"] = "MAX_PAYLOAD_EXCEEDED";
    ErrorCode1["NOT_FUNC"] = "NOT_FUNC";
    ErrorCode1["REQUEST_ERROR"] = "REQUEST_ERROR";
    ErrorCode1["SERVER_OPTION_NA"] = "SERVER_OPT_NA";
    ErrorCode1["SUB_CLOSED"] = "SUB_CLOSED";
    ErrorCode1["SUB_DRAINING"] = "SUB_DRAINING";
    ErrorCode1["TIMEOUT"] = "TIMEOUT";
    ErrorCode1["TLS"] = "TLS";
    ErrorCode1["UNKNOWN"] = "UNKNOWN_ERROR";
    ErrorCode1["WSS_REQUIRED"] = "WSS_REQUIRED";
    ErrorCode1["AUTHORIZATION_VIOLATION"] = "AUTHORIZATION_VIOLATION";
    ErrorCode1["NATS_PROTOCOL_ERR"] = "NATS_PROTOCOL_ERR";
    ErrorCode1["PERMISSIONS_VIOLATION"] = "PERMISSIONS_VIOLATION";
})(ErrorCode || (ErrorCode = {
}));
const Empty = new Uint8Array(0);
const Events = Object.freeze({
    DISCONNECT: "disconnect",
    RECONNECT: "reconnect",
    UPDATE: "update",
    LDM: "ldm"
});
const DebugEvents = Object.freeze({
    RECONNECTING: "reconnecting",
    PING_TIMER: "pingTimer",
    STALE_CONNECTION: "staleConnection"
});
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_HOSTPORT = `${DEFAULT_HOST}:${4222}`;
const DEFAULT_RECONNECT_TIME_WAIT = 2 * 1000;
const DEFAULT_PING_INTERVAL = 2 * 60 * 1000;
const TE = new TextEncoder();
const TD = new TextDecoder();
function fastEncoder(...a) {
    let len = 0;
    for(let i = 0; i < a.length; i++){
        len += a[i] ? a[i].length : 0;
    }
    if (len === 0) {
        return Empty;
    }
    const buf = new Uint8Array(len);
    let c = 0;
    for(let i1 = 0; i1 < a.length; i1++){
        const s = a[i1];
        if (s) {
            for(let j = 0; j < s.length; j++){
                buf[c] = s.charCodeAt(j);
                c++;
            }
        }
    }
    return buf;
}
function fastDecoder(a) {
    if (!a || a.length === 0) {
        return "";
    }
    return String.fromCharCode(...a);
}
const HEADER = "NATS/1.0";
class DataBuffer {
    constructor(){
        this.buffers = [];
        this.byteLength = 0;
    }
    static concat(...bufs) {
        let max = 0;
        for(let i = 0; i < bufs.length; i++){
            max += bufs[i].length;
        }
        const out = new Uint8Array(max);
        let index = 0;
        for(let i1 = 0; i1 < bufs.length; i1++){
            out.set(bufs[i1], index);
            index += bufs[i1].length;
        }
        return out;
    }
    static fromAscii(m) {
        if (!m) {
            m = "";
        }
        return TE.encode(m);
    }
    static toAscii(a) {
        return TD.decode(a);
    }
    reset() {
        this.buffers.length = 0;
        this.byteLength = 0;
    }
    pack() {
        if (this.buffers.length > 1) {
            const v = new Uint8Array(this.byteLength);
            let index = 0;
            for(let i = 0; i < this.buffers.length; i++){
                v.set(this.buffers[i], index);
                index += this.buffers[i].length;
            }
            this.buffers.length = 0;
            this.buffers.push(v);
        }
    }
    drain(n) {
        if (this.buffers.length) {
            this.pack();
            const v = this.buffers.pop();
            if (v) {
                const max = this.byteLength;
                if (n === undefined || n > max) {
                    n = max;
                }
                const d = v.subarray(0, n);
                if (max > n) {
                    this.buffers.push(v.subarray(n));
                }
                this.byteLength = max - n;
                return d;
            }
        }
        return new Uint8Array(0);
    }
    fill(a, ...bufs) {
        if (a) {
            this.buffers.push(a);
            this.byteLength += a.length;
        }
        for(let i = 0; i < bufs.length; i++){
            if (bufs[i] && bufs[i].length) {
                this.buffers.push(bufs[i]);
                this.byteLength += bufs[i].length;
            }
        }
    }
    peek() {
        if (this.buffers.length) {
            this.pack();
            return this.buffers[0];
        }
        return new Uint8Array(0);
    }
    size() {
        return this.byteLength;
    }
    length() {
        return this.buffers.length;
    }
}
const CR_LF = "\r\n";
const CRLF = DataBuffer.fromAscii(CR_LF);
const CR = new Uint8Array(CRLF)[0];
const LF = new Uint8Array(CRLF)[1];
function isUint8Array(a) {
    return a instanceof Uint8Array;
}
function protoLen(ba) {
    for(let i = 0; i < ba.length; i++){
        const n = i + 1;
        if (ba.byteLength > n && ba[i] === CR && ba[n] === LF) {
            return n + 1;
        }
    }
    return -1;
}
function extractProtocolMessage(a) {
    const len = protoLen(a);
    if (len) {
        const ba = new Uint8Array(a);
        const out = ba.slice(0, len);
        return TD.decode(out);
    }
    return "";
}
function extend(a, ...b) {
    for(let i = 0; i < b.length; i++){
        const o = b[i];
        Object.keys(o).forEach(function(k) {
            a[k] = o[k];
        });
    }
    return a;
}
function render(frame) {
    const cr = "␍";
    const lf = "␊";
    return TD.decode(frame).replace(/\n/g, lf).replace(/\r/g, cr);
}
function delay(ms = 0) {
    return new Promise((resolve)=>{
        setTimeout(()=>{
            resolve();
        }, ms);
    });
}
function deferred() {
    let methods = {
    };
    const p = new Promise((resolve, reject)=>{
        methods = {
            resolve,
            reject
        };
    });
    return Object.assign(p, methods);
}
function shuffle(a) {
    for(let i = a.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [
            a[j],
            a[i]
        ];
    }
    return a;
}
class Perf {
    constructor(){
        this.timers = new Map();
        this.measures = new Map();
    }
    mark(key) {
        this.timers.set(key, Date.now());
    }
    measure(key, startKey, endKey) {
        const s = this.timers.get(startKey);
        if (s === undefined) {
            throw new Error(`${startKey} is not defined`);
        }
        const e = this.timers.get(endKey);
        if (e === undefined) {
            throw new Error(`${endKey} is not defined`);
        }
        this.measures.set(key, e - s);
    }
    getEntries() {
        const values = [];
        this.measures.forEach((v, k)=>{
            values.push({
                name: k,
                duration: v
            });
        });
        return values;
    }
}
class Subscriptions {
    constructor(){
        this.sidCounter = 0;
        this.subs = new Map();
    }
    size() {
        return this.subs.size;
    }
    add(s) {
        this.sidCounter++;
        s.sid = this.sidCounter;
        this.subs.set(s.sid, s);
        return s;
    }
    setMux(s) {
        this.mux = s;
        return s;
    }
    getMux() {
        return this.mux;
    }
    get(sid) {
        return this.subs.get(sid);
    }
    all() {
        const buf = [];
        for (const s of this.subs.values()){
            buf.push(s);
        }
        return buf;
    }
    cancel(s) {
        if (s) {
            s.close();
            this.subs.delete(s.sid);
        }
    }
    handleError(err) {
        if (err) {
            const re = /^'Permissions Violation for Subscription to "(\S+)"'/i;
            const ma = re.exec(err.message);
            if (ma) {
                const subj = ma[1];
                this.subs.forEach((sub)=>{
                    if (subj == sub.subject) {
                        sub.callback(err, {
                        });
                        sub.close();
                    }
                });
            }
        }
    }
    close() {
        this.subs.forEach((sub)=>{
            sub.close();
        });
    }
}
let urlParseFn;
function setUrlParseFn(fn) {
    urlParseFn = fn;
}
let transportFactory;
function setTransportFactory(fn) {
    transportFactory = fn;
}
function newTransport() {
    if (typeof transportFactory !== "function") {
        throw new Error("transport is not set");
    }
    return transportFactory();
}
class ServerImpl {
    constructor(u1, gossiped = false){
        this.src = u1;
        this.tlsName = "";
        if (u1.match(/^(.*:\/\/)(.*)/m)) {
            u1 = u1.replace(/^(.*:\/\/)(.*)/gm, "$2");
        }
        const url = new URL(`http://${u1}`);
        if (!url.port) {
            url.port = `${4222}`;
        }
        this.listen = url.host;
        this.hostname = url.hostname;
        this.port = parseInt(url.port, 10);
        this.didConnect = false;
        this.reconnects = 0;
        this.lastConnect = 0;
        this.gossiped = gossiped;
    }
    toString() {
        return this.listen;
    }
}
const FLUSH_THRESHOLD = 1024 * 32;
const INFO = /^INFO\s+([^\r\n]+)\r\n/i;
const PONG_CMD = fastEncoder("PONG\r\n");
const PING_CMD = fastEncoder("PING\r\n");
class Connect {
    constructor(transport, opts2, nonce){
        this.protocol = 1;
        this.version = transport.version;
        this.lang = transport.lang;
        this.echo = opts2.noEcho ? false : undefined;
        this.no_responders = opts2.noResponders ? true : undefined;
        this.verbose = opts2.verbose;
        this.pedantic = opts2.pedantic;
        this.tls_required = opts2.tls ? true : undefined;
        this.name = opts2.name;
        this.headers = opts2.headers;
        const creds = (opts2 && opts2.authenticator ? opts2.authenticator(nonce) : {
        }) || {
        };
        extend(this, creds);
    }
}
class Heartbeat {
    constructor(ph, interval, maxOut){
        this.ph = ph;
        this.interval = interval;
        this.maxOut = maxOut;
        this.pendings = [];
    }
    start() {
        this.cancel();
        this._schedule();
    }
    cancel(stale) {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
        this._reset();
        if (stale) {
            this.ph.disconnect();
        }
    }
    _schedule() {
        this.timer = setTimeout(()=>{
            this.ph.dispatchStatus({
                type: DebugEvents.PING_TIMER,
                data: `${this.pendings.length + 1}`
            });
            if (this.pendings.length === this.maxOut) {
                this.cancel(true);
                return;
            }
            const ping = deferred();
            this.ph.flush(ping).then(()=>{
                this._reset();
            }).catch(()=>{
                this.cancel();
            });
            this.pendings.push(ping);
            this._schedule();
        }, this.interval);
    }
    _reset() {
        this.pendings = this.pendings.filter((p)=>{
            const d = p;
            p.resolve();
            return false;
        });
    }
}
function StringCodec() {
    return {
        encode (d) {
            return TE.encode(d);
        },
        decode (a) {
            return TD.decode(a);
        }
    };
}
function ByteArray(n) {
    return new Uint8Array(n);
}
function HalfArray(n) {
    return new Uint16Array(n);
}
function WordArray(n) {
    return new Uint32Array(n);
}
function IntArray(n) {
    return new Int32Array(n);
}
function NumArray(n) {
    return new Float64Array(n);
}
function randomBytes(n) {
    let b = ByteArray(n);
    window.crypto.getRandomValues(b);
    return b;
}
function gf(init) {
    const r = NumArray(16);
    if (init) for(let i = 0; i < init.length; i++)r[i] = init[i];
    return r;
}
const _0 = ByteArray(16);
const _9 = ByteArray(32);
_9[0] = 9;
const gf0 = gf();
const gf1 = gf([
    1
]);
const _121665 = gf([
    56129,
    1
]);
const D = gf([
    30883,
    4953,
    19914,
    30187,
    55467,
    16705,
    2637,
    112,
    59544,
    30585,
    16505,
    36039,
    65139,
    11119,
    27886,
    20995
]);
const D2 = gf([
    61785,
    9906,
    39828,
    60374,
    45398,
    33411,
    5274,
    224,
    53552,
    61171,
    33010,
    6542,
    64743,
    22239,
    55772,
    9222
]);
const X = gf([
    54554,
    36645,
    11616,
    51542,
    42930,
    38181,
    51040,
    26924,
    56412,
    64982,
    57905,
    49316,
    21502,
    52590,
    14035,
    8553
]);
const Y = gf([
    26200,
    26214,
    26214,
    26214,
    26214,
    26214,
    26214,
    26214,
    26214,
    26214,
    26214,
    26214,
    26214,
    26214,
    26214,
    26214
]);
const I = gf([
    41136,
    18958,
    6951,
    50414,
    58488,
    44335,
    6150,
    12099,
    55207,
    15867,
    153,
    11085,
    57099,
    20417,
    9344,
    11139
]);
function A(o, a, b) {
    for(let i = 0; i < 16; i++)o[i] = a[i] + b[i];
}
function Z(o, a, b) {
    for(let i = 0; i < 16; i++)o[i] = a[i] - b[i];
}
function M(o, a, b) {
    let v, c, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0, t10 = 0, t11 = 0, t12 = 0, t13 = 0, t14 = 0, t15 = 0, t16 = 0, t17 = 0, t18 = 0, t19 = 0, t20 = 0, t21 = 0, t22 = 0, t23 = 0, t24 = 0, t25 = 0, t26 = 0, t27 = 0, t28 = 0, t29 = 0, t30 = 0, b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7], b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11], b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
    v = a[0];
    t0 += v * b0;
    t1 += v * b1;
    t2 += v * b2;
    t3 += v * b3;
    t4 += v * b4;
    t5 += v * b5;
    t6 += v * b6;
    t7 += v * b7;
    t8 += v * b8;
    t9 += v * b9;
    t10 += v * b10;
    t11 += v * b11;
    t12 += v * b12;
    t13 += v * b13;
    t14 += v * b14;
    t15 += v * b15;
    v = a[1];
    t1 += v * b0;
    t2 += v * b1;
    t3 += v * b2;
    t4 += v * b3;
    t5 += v * b4;
    t6 += v * b5;
    t7 += v * b6;
    t8 += v * b7;
    t9 += v * b8;
    t10 += v * b9;
    t11 += v * b10;
    t12 += v * b11;
    t13 += v * b12;
    t14 += v * b13;
    t15 += v * b14;
    t16 += v * b15;
    v = a[2];
    t2 += v * b0;
    t3 += v * b1;
    t4 += v * b2;
    t5 += v * b3;
    t6 += v * b4;
    t7 += v * b5;
    t8 += v * b6;
    t9 += v * b7;
    t10 += v * b8;
    t11 += v * b9;
    t12 += v * b10;
    t13 += v * b11;
    t14 += v * b12;
    t15 += v * b13;
    t16 += v * b14;
    t17 += v * b15;
    v = a[3];
    t3 += v * b0;
    t4 += v * b1;
    t5 += v * b2;
    t6 += v * b3;
    t7 += v * b4;
    t8 += v * b5;
    t9 += v * b6;
    t10 += v * b7;
    t11 += v * b8;
    t12 += v * b9;
    t13 += v * b10;
    t14 += v * b11;
    t15 += v * b12;
    t16 += v * b13;
    t17 += v * b14;
    t18 += v * b15;
    v = a[4];
    t4 += v * b0;
    t5 += v * b1;
    t6 += v * b2;
    t7 += v * b3;
    t8 += v * b4;
    t9 += v * b5;
    t10 += v * b6;
    t11 += v * b7;
    t12 += v * b8;
    t13 += v * b9;
    t14 += v * b10;
    t15 += v * b11;
    t16 += v * b12;
    t17 += v * b13;
    t18 += v * b14;
    t19 += v * b15;
    v = a[5];
    t5 += v * b0;
    t6 += v * b1;
    t7 += v * b2;
    t8 += v * b3;
    t9 += v * b4;
    t10 += v * b5;
    t11 += v * b6;
    t12 += v * b7;
    t13 += v * b8;
    t14 += v * b9;
    t15 += v * b10;
    t16 += v * b11;
    t17 += v * b12;
    t18 += v * b13;
    t19 += v * b14;
    t20 += v * b15;
    v = a[6];
    t6 += v * b0;
    t7 += v * b1;
    t8 += v * b2;
    t9 += v * b3;
    t10 += v * b4;
    t11 += v * b5;
    t12 += v * b6;
    t13 += v * b7;
    t14 += v * b8;
    t15 += v * b9;
    t16 += v * b10;
    t17 += v * b11;
    t18 += v * b12;
    t19 += v * b13;
    t20 += v * b14;
    t21 += v * b15;
    v = a[7];
    t7 += v * b0;
    t8 += v * b1;
    t9 += v * b2;
    t10 += v * b3;
    t11 += v * b4;
    t12 += v * b5;
    t13 += v * b6;
    t14 += v * b7;
    t15 += v * b8;
    t16 += v * b9;
    t17 += v * b10;
    t18 += v * b11;
    t19 += v * b12;
    t20 += v * b13;
    t21 += v * b14;
    t22 += v * b15;
    v = a[8];
    t8 += v * b0;
    t9 += v * b1;
    t10 += v * b2;
    t11 += v * b3;
    t12 += v * b4;
    t13 += v * b5;
    t14 += v * b6;
    t15 += v * b7;
    t16 += v * b8;
    t17 += v * b9;
    t18 += v * b10;
    t19 += v * b11;
    t20 += v * b12;
    t21 += v * b13;
    t22 += v * b14;
    t23 += v * b15;
    v = a[9];
    t9 += v * b0;
    t10 += v * b1;
    t11 += v * b2;
    t12 += v * b3;
    t13 += v * b4;
    t14 += v * b5;
    t15 += v * b6;
    t16 += v * b7;
    t17 += v * b8;
    t18 += v * b9;
    t19 += v * b10;
    t20 += v * b11;
    t21 += v * b12;
    t22 += v * b13;
    t23 += v * b14;
    t24 += v * b15;
    v = a[10];
    t10 += v * b0;
    t11 += v * b1;
    t12 += v * b2;
    t13 += v * b3;
    t14 += v * b4;
    t15 += v * b5;
    t16 += v * b6;
    t17 += v * b7;
    t18 += v * b8;
    t19 += v * b9;
    t20 += v * b10;
    t21 += v * b11;
    t22 += v * b12;
    t23 += v * b13;
    t24 += v * b14;
    t25 += v * b15;
    v = a[11];
    t11 += v * b0;
    t12 += v * b1;
    t13 += v * b2;
    t14 += v * b3;
    t15 += v * b4;
    t16 += v * b5;
    t17 += v * b6;
    t18 += v * b7;
    t19 += v * b8;
    t20 += v * b9;
    t21 += v * b10;
    t22 += v * b11;
    t23 += v * b12;
    t24 += v * b13;
    t25 += v * b14;
    t26 += v * b15;
    v = a[12];
    t12 += v * b0;
    t13 += v * b1;
    t14 += v * b2;
    t15 += v * b3;
    t16 += v * b4;
    t17 += v * b5;
    t18 += v * b6;
    t19 += v * b7;
    t20 += v * b8;
    t21 += v * b9;
    t22 += v * b10;
    t23 += v * b11;
    t24 += v * b12;
    t25 += v * b13;
    t26 += v * b14;
    t27 += v * b15;
    v = a[13];
    t13 += v * b0;
    t14 += v * b1;
    t15 += v * b2;
    t16 += v * b3;
    t17 += v * b4;
    t18 += v * b5;
    t19 += v * b6;
    t20 += v * b7;
    t21 += v * b8;
    t22 += v * b9;
    t23 += v * b10;
    t24 += v * b11;
    t25 += v * b12;
    t26 += v * b13;
    t27 += v * b14;
    t28 += v * b15;
    v = a[14];
    t14 += v * b0;
    t15 += v * b1;
    t16 += v * b2;
    t17 += v * b3;
    t18 += v * b4;
    t19 += v * b5;
    t20 += v * b6;
    t21 += v * b7;
    t22 += v * b8;
    t23 += v * b9;
    t24 += v * b10;
    t25 += v * b11;
    t26 += v * b12;
    t27 += v * b13;
    t28 += v * b14;
    t29 += v * b15;
    v = a[15];
    t15 += v * b0;
    t16 += v * b1;
    t17 += v * b2;
    t18 += v * b3;
    t19 += v * b4;
    t20 += v * b5;
    t21 += v * b6;
    t22 += v * b7;
    t23 += v * b8;
    t24 += v * b9;
    t25 += v * b10;
    t26 += v * b11;
    t27 += v * b12;
    t28 += v * b13;
    t29 += v * b14;
    t30 += v * b15;
    t0 += 38 * t16;
    t1 += 38 * t17;
    t2 += 38 * t18;
    t3 += 38 * t19;
    t4 += 38 * t20;
    t5 += 38 * t21;
    t6 += 38 * t22;
    t7 += 38 * t23;
    t8 += 38 * t24;
    t9 += 38 * t25;
    t10 += 38 * t26;
    t11 += 38 * t27;
    t12 += 38 * t28;
    t13 += 38 * t29;
    t14 += 38 * t30;
    c = 1;
    v = t0 + c + 65535;
    c = Math.floor(v / 65536);
    t0 = v - c * 65536;
    v = t1 + c + 65535;
    c = Math.floor(v / 65536);
    t1 = v - c * 65536;
    v = t2 + c + 65535;
    c = Math.floor(v / 65536);
    t2 = v - c * 65536;
    v = t3 + c + 65535;
    c = Math.floor(v / 65536);
    t3 = v - c * 65536;
    v = t4 + c + 65535;
    c = Math.floor(v / 65536);
    t4 = v - c * 65536;
    v = t5 + c + 65535;
    c = Math.floor(v / 65536);
    t5 = v - c * 65536;
    v = t6 + c + 65535;
    c = Math.floor(v / 65536);
    t6 = v - c * 65536;
    v = t7 + c + 65535;
    c = Math.floor(v / 65536);
    t7 = v - c * 65536;
    v = t8 + c + 65535;
    c = Math.floor(v / 65536);
    t8 = v - c * 65536;
    v = t9 + c + 65535;
    c = Math.floor(v / 65536);
    t9 = v - c * 65536;
    v = t10 + c + 65535;
    c = Math.floor(v / 65536);
    t10 = v - c * 65536;
    v = t11 + c + 65535;
    c = Math.floor(v / 65536);
    t11 = v - c * 65536;
    v = t12 + c + 65535;
    c = Math.floor(v / 65536);
    t12 = v - c * 65536;
    v = t13 + c + 65535;
    c = Math.floor(v / 65536);
    t13 = v - c * 65536;
    v = t14 + c + 65535;
    c = Math.floor(v / 65536);
    t14 = v - c * 65536;
    v = t15 + c + 65535;
    c = Math.floor(v / 65536);
    t15 = v - c * 65536;
    t0 += c - 1 + 37 * (c - 1);
    c = 1;
    v = t0 + c + 65535;
    c = Math.floor(v / 65536);
    t0 = v - c * 65536;
    v = t1 + c + 65535;
    c = Math.floor(v / 65536);
    t1 = v - c * 65536;
    v = t2 + c + 65535;
    c = Math.floor(v / 65536);
    t2 = v - c * 65536;
    v = t3 + c + 65535;
    c = Math.floor(v / 65536);
    t3 = v - c * 65536;
    v = t4 + c + 65535;
    c = Math.floor(v / 65536);
    t4 = v - c * 65536;
    v = t5 + c + 65535;
    c = Math.floor(v / 65536);
    t5 = v - c * 65536;
    v = t6 + c + 65535;
    c = Math.floor(v / 65536);
    t6 = v - c * 65536;
    v = t7 + c + 65535;
    c = Math.floor(v / 65536);
    t7 = v - c * 65536;
    v = t8 + c + 65535;
    c = Math.floor(v / 65536);
    t8 = v - c * 65536;
    v = t9 + c + 65535;
    c = Math.floor(v / 65536);
    t9 = v - c * 65536;
    v = t10 + c + 65535;
    c = Math.floor(v / 65536);
    t10 = v - c * 65536;
    v = t11 + c + 65535;
    c = Math.floor(v / 65536);
    t11 = v - c * 65536;
    v = t12 + c + 65535;
    c = Math.floor(v / 65536);
    t12 = v - c * 65536;
    v = t13 + c + 65535;
    c = Math.floor(v / 65536);
    t13 = v - c * 65536;
    v = t14 + c + 65535;
    c = Math.floor(v / 65536);
    t14 = v - c * 65536;
    v = t15 + c + 65535;
    c = Math.floor(v / 65536);
    t15 = v - c * 65536;
    t0 += c - 1 + 37 * (c - 1);
    o[0] = t0;
    o[1] = t1;
    o[2] = t2;
    o[3] = t3;
    o[4] = t4;
    o[5] = t5;
    o[6] = t6;
    o[7] = t7;
    o[8] = t8;
    o[9] = t9;
    o[10] = t10;
    o[11] = t11;
    o[12] = t12;
    o[13] = t13;
    o[14] = t14;
    o[15] = t15;
}
function S(o, a) {
    M(o, a, a);
}
function assert(cond, msg = "Assertion failed.") {
    if (!cond) {
        throw new AssertionError(msg);
    }
}
const MIN_READ = 32 * 1024;
const MAX_SIZE = 2 ** 32 - 2;
function copy(src, dst, off = 0) {
    const r = dst.byteLength - off;
    if (src.byteLength > r) {
        src = src.subarray(0, r);
    }
    dst.set(src, off);
    return src.byteLength;
}
function concat(origin, b) {
    if (origin === undefined && b === undefined) {
        return new Uint8Array(0);
    }
    if (origin === undefined) {
        return b;
    }
    if (b === undefined) {
        return origin;
    }
    const output = new Uint8Array(origin.length + b.length);
    output.set(origin, 0);
    output.set(b, origin.length);
    return output;
}
class DenoBuffer {
    constructor(ab){
        this._off = 0;
        if (ab == null) {
            this._buf = new Uint8Array(0);
            return;
        }
        this._buf = new Uint8Array(ab);
    }
    bytes(options = {
        copy: true
    }) {
        if (options.copy === false) return this._buf.subarray(this._off);
        return this._buf.slice(this._off);
    }
    empty() {
        return this._buf.byteLength <= this._off;
    }
    get length() {
        return this._buf.byteLength - this._off;
    }
    get capacity() {
        return this._buf.buffer.byteLength;
    }
    truncate(n) {
        if (n === 0) {
            this.reset();
            return;
        }
        if (n < 0 || n > this.length) {
            throw Error("bytes.Buffer: truncation out of range");
        }
        this._reslice(this._off + n);
    }
    reset() {
        this._reslice(0);
        this._off = 0;
    }
    _tryGrowByReslice = (n)=>{
        const l = this._buf.byteLength;
        if (n <= this.capacity - l) {
            this._reslice(l + n);
            return l;
        }
        return -1;
    };
    _reslice = (len)=>{
        assert(len <= this._buf.buffer.byteLength);
        this._buf = new Uint8Array(this._buf.buffer, 0, len);
    };
    readByte() {
        const a = new Uint8Array(1);
        if (this.read(a)) {
            return a[0];
        }
        return null;
    }
    read(p) {
        if (this.empty()) {
            this.reset();
            if (p.byteLength === 0) {
                return 0;
            }
            return null;
        }
        const nread = copy(this._buf.subarray(this._off), p);
        this._off += nread;
        return nread;
    }
    writeByte(n) {
        return this.write(Uint8Array.of(n));
    }
    writeString(s) {
        return this.write(TE.encode(s));
    }
    write(p) {
        const m = this._grow(p.byteLength);
        return copy(p, this._buf, m);
    }
    _grow = (n)=>{
        const m = this.length;
        if (m === 0 && this._off !== 0) {
            this.reset();
        }
        const i = this._tryGrowByReslice(n);
        if (i >= 0) {
            return i;
        }
        const c = this.capacity;
        if (n <= Math.floor(c / 2) - m) {
            copy(this._buf.subarray(this._off), this._buf);
        } else if (c + n > MAX_SIZE) {
            throw new Error("The buffer cannot be grown beyond the maximum size.");
        } else {
            const buf = new Uint8Array(Math.min(2 * c + n, MAX_SIZE));
            copy(this._buf.subarray(this._off), buf);
            this._buf = buf;
        }
        this._off = 0;
        this._reslice(Math.min(m + n, MAX_SIZE));
        return m;
    };
    grow(n) {
        if (n < 0) {
            throw Error("Buffer._grow: negative count");
        }
        const m = this._grow(n);
        this._reslice(m);
    }
    readFrom(r) {
        let n = 0;
        const tmp = new Uint8Array(MIN_READ);
        while(true){
            const shouldGrow = this.capacity - this.length < MIN_READ;
            const buf = shouldGrow ? tmp : new Uint8Array(this._buf.buffer, this.length);
            const nread = r.read(buf);
            if (nread === null) {
                return n;
            }
            if (shouldGrow) this.write(buf.subarray(0, nread));
            else this._reslice(this.length + nread);
            n += nread;
        }
    }
}
function readAll(r) {
    const buf = new DenoBuffer();
    buf.readFrom(r);
    return buf.bytes();
}
function writeAll(w, arr) {
    let nwritten = 0;
    while(nwritten < arr.length){
        nwritten += w.write(arr.subarray(nwritten));
    }
}
var Kind;
(function(Kind1) {
    Kind1[Kind1["OK"] = 0] = "OK";
    Kind1[Kind1["ERR"] = 1] = "ERR";
    Kind1[Kind1["MSG"] = 2] = "MSG";
    Kind1[Kind1["INFO"] = 3] = "INFO";
    Kind1[Kind1["PING"] = 4] = "PING";
    Kind1[Kind1["PONG"] = 5] = "PONG";
})(Kind || (Kind = {
}));
function newMsgArg() {
    const ma = {
    };
    ma.sid = -1;
    ma.hdr = -1;
    ma.size = -1;
    return ma;
}
var State;
(function(State1) {
    State1[State1["OP_START"] = 0] = "OP_START";
    State1[State1["OP_PLUS"] = 1] = "OP_PLUS";
    State1[State1["OP_PLUS_O"] = 2] = "OP_PLUS_O";
    State1[State1["OP_PLUS_OK"] = 3] = "OP_PLUS_OK";
    State1[State1["OP_MINUS"] = 4] = "OP_MINUS";
    State1[State1["OP_MINUS_E"] = 5] = "OP_MINUS_E";
    State1[State1["OP_MINUS_ER"] = 6] = "OP_MINUS_ER";
    State1[State1["OP_MINUS_ERR"] = 7] = "OP_MINUS_ERR";
    State1[State1["OP_MINUS_ERR_SPC"] = 8] = "OP_MINUS_ERR_SPC";
    State1[State1["MINUS_ERR_ARG"] = 9] = "MINUS_ERR_ARG";
    State1[State1["OP_M"] = 10] = "OP_M";
    State1[State1["OP_MS"] = 11] = "OP_MS";
    State1[State1["OP_MSG"] = 12] = "OP_MSG";
    State1[State1["OP_MSG_SPC"] = 13] = "OP_MSG_SPC";
    State1[State1["MSG_ARG"] = 14] = "MSG_ARG";
    State1[State1["MSG_PAYLOAD"] = 15] = "MSG_PAYLOAD";
    State1[State1["MSG_END"] = 16] = "MSG_END";
    State1[State1["OP_H"] = 17] = "OP_H";
    State1[State1["OP_P"] = 18] = "OP_P";
    State1[State1["OP_PI"] = 19] = "OP_PI";
    State1[State1["OP_PIN"] = 20] = "OP_PIN";
    State1[State1["OP_PING"] = 21] = "OP_PING";
    State1[State1["OP_PO"] = 22] = "OP_PO";
    State1[State1["OP_PON"] = 23] = "OP_PON";
    State1[State1["OP_PONG"] = 24] = "OP_PONG";
    State1[State1["OP_I"] = 25] = "OP_I";
    State1[State1["OP_IN"] = 26] = "OP_IN";
    State1[State1["OP_INF"] = 27] = "OP_INF";
    State1[State1["OP_INFO"] = 28] = "OP_INFO";
    State1[State1["OP_INFO_SPC"] = 29] = "OP_INFO_SPC";
    State1[State1["INFO_ARG"] = 30] = "INFO_ARG";
})(State || (State = {
}));
var cc;
(function(cc1) {
    cc1[cc1["CR"] = "\r".charCodeAt(0)] = "CR";
    cc1[cc1["E"] = "E".charCodeAt(0)] = "E";
    cc1[cc1["e"] = "e".charCodeAt(0)] = "e";
    cc1[cc1["F"] = "F".charCodeAt(0)] = "F";
    cc1[cc1["f"] = "f".charCodeAt(0)] = "f";
    cc1[cc1["G"] = "G".charCodeAt(0)] = "G";
    cc1[cc1["g"] = "g".charCodeAt(0)] = "g";
    cc1[cc1["H"] = "H".charCodeAt(0)] = "H";
    cc1[cc1["h"] = "h".charCodeAt(0)] = "h";
    cc1[cc1["I"] = "I".charCodeAt(0)] = "I";
    cc1[cc1["i"] = "i".charCodeAt(0)] = "i";
    cc1[cc1["K"] = "K".charCodeAt(0)] = "K";
    cc1[cc1["k"] = "k".charCodeAt(0)] = "k";
    cc1[cc1["M"] = "M".charCodeAt(0)] = "M";
    cc1[cc1["m"] = "m".charCodeAt(0)] = "m";
    cc1[cc1["MINUS"] = "-".charCodeAt(0)] = "MINUS";
    cc1[cc1["N"] = "N".charCodeAt(0)] = "N";
    cc1[cc1["n"] = "n".charCodeAt(0)] = "n";
    cc1[cc1["NL"] = "\n".charCodeAt(0)] = "NL";
    cc1[cc1["O"] = "O".charCodeAt(0)] = "O";
    cc1[cc1["o"] = "o".charCodeAt(0)] = "o";
    cc1[cc1["P"] = "P".charCodeAt(0)] = "P";
    cc1[cc1["p"] = "p".charCodeAt(0)] = "p";
    cc1[cc1["PLUS"] = "+".charCodeAt(0)] = "PLUS";
    cc1[cc1["R"] = "R".charCodeAt(0)] = "R";
    cc1[cc1["r"] = "r".charCodeAt(0)] = "r";
    cc1[cc1["S"] = "S".charCodeAt(0)] = "S";
    cc1[cc1["s"] = "s".charCodeAt(0)] = "s";
    cc1[cc1["SPACE"] = " ".charCodeAt(0)] = "SPACE";
    cc1[cc1["TAB"] = "\t".charCodeAt(0)] = "TAB";
})(cc || (cc = {
}));
function humanizeBytes(bytes, si = false) {
    const base = si ? 1000 : 1024;
    const pre = si ? [
        "k",
        "M",
        "G",
        "T",
        "P",
        "E"
    ] : [
        "K",
        "M",
        "G",
        "T",
        "P",
        "E"
    ];
    const post = si ? "iB" : "B";
    if (bytes < base) {
        return `${bytes.toFixed(2)} ${post}/sec`;
    }
    const exp = parseInt(Math.log(bytes) / Math.log(base) + "");
    const index = parseInt(exp - 1 + "");
    return `${(bytes / Math.pow(base, exp)).toFixed(2)} ${pre[index]}${post}/sec`;
}
function humanizeNumber(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function ipV4(a, b, c, d) {
    const ip = new Uint8Array(16);
    const prefix = [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        255,
        255
    ];
    prefix.forEach((v, idx)=>{
        ip[idx] = v;
    });
    ip[12] = a;
    ip[13] = b;
    ip[14] = c;
    ip[15] = d;
    return ip;
}
function dtoi(s) {
    let i = 0;
    let n = 0;
    for(i = 0; i < s.length && 48 <= s.charCodeAt(i) && s.charCodeAt(i) <= 57; i++){
        n = n * 10 + (s.charCodeAt(i) - 48);
        if (n >= 16777215) {
            return {
                n: 16777215,
                c: i,
                ok: false
            };
        }
    }
    if (i === 0) {
        return {
            n: 0,
            c: 0,
            ok: false
        };
    }
    return {
        n: n,
        c: i,
        ok: true
    };
}
function xtoi(s) {
    let n = 0;
    let i = 0;
    for(i = 0; i < s.length; i++){
        if (48 <= s.charCodeAt(i) && s.charCodeAt(i) <= 57) {
            n *= 16;
            n += s.charCodeAt(i) - 48;
        } else if (97 <= s.charCodeAt(i) && s.charCodeAt(i) <= 102) {
            n *= 16;
            n += s.charCodeAt(i) - 97 + 10;
        } else if (65 <= s.charCodeAt(i) && s.charCodeAt(i) <= 70) {
            n *= 16;
            n += s.charCodeAt(i) - 65 + 10;
        } else {
            break;
        }
        if (n >= 16777215) {
            return {
                n: 0,
                c: i,
                ok: false
            };
        }
    }
    if (i === 0) {
        return {
            n: 0,
            c: i,
            ok: false
        };
    }
    return {
        n: n,
        c: i,
        ok: true
    };
}
const DebugEvents1 = DebugEvents;
const Empty1 = Empty;
const Events1 = Events;
const Subscriptions1 = Subscriptions;
const setTransportFactory1 = setTransportFactory;
const setUrlParseFn1 = setUrlParseFn;
const Connect1 = Connect;
const INFO1 = INFO;
const deferred1 = deferred;
const delay1 = delay;
const extractProtocolMessage1 = extractProtocolMessage;
const render1 = render;
const Heartbeat1 = Heartbeat;
const DataBuffer1 = DataBuffer;
const StringCodec1 = StringCodec;
const DenoBuffer1 = DenoBuffer;
const MAX_SIZE1 = MAX_SIZE;
const readAll1 = readAll;
const writeAll1 = writeAll;
const TD1 = TD;
const TE1 = TE;
function defaultOptions() {
    return {
        maxPingOut: 2,
        maxReconnectAttempts: 10,
        noRandomize: false,
        pedantic: false,
        pingInterval: DEFAULT_PING_INTERVAL,
        reconnect: true,
        reconnectJitter: 100,
        reconnectJitterTLS: 1000,
        reconnectTimeWait: DEFAULT_RECONNECT_TIME_WAIT,
        tls: undefined,
        verbose: false,
        waitOnFirstConnect: false
    };
}
function noAuthFn() {
    return ()=>{
        return;
    };
}
function passFn(user, pass) {
    return ()=>{
        return {
            user,
            pass
        };
    };
}
function tokenFn(token) {
    return ()=>{
        return {
            auth_token: token
        };
    };
}
const cryptoObj = initCrypto();
class Nuid {
    constructor(){
        this.buf = new Uint8Array(totalLen);
        this.init();
    }
    init() {
        this.setPre();
        this.initSeqAndInc();
        this.fillSeq();
    }
    initSeqAndInc() {
        this.seq = Math.floor(Math.random() * 3656158440062976);
        this.inc = Math.floor(Math.random() * (333 - 33) + 33);
    }
    setPre() {
        const cbuf = new Uint8Array(12);
        cryptoObj.getRandomValues(cbuf);
        for(let i = 0; i < 12; i++){
            const di = cbuf[i] % 36;
            this.buf[i] = digits.charCodeAt(di);
        }
    }
    fillSeq() {
        let n = this.seq;
        for(let i = totalLen - 1; i >= 12; i--){
            this.buf[i] = digits.charCodeAt(n % 36);
            n = Math.floor(n / 36);
        }
    }
    next() {
        this.seq += this.inc;
        if (this.seq > 3656158440062976) {
            this.setPre();
            this.initSeqAndInc();
        }
        this.fillSeq();
        return String.fromCharCode.apply(String, this.buf);
    }
    reset() {
        this.init();
    }
}
const nuid = new Nuid();
function createInbox() {
    return `_INBOX.${nuid.next()}`;
}
class Parser {
    constructor(dispatcher){
        this.dispatcher = dispatcher;
        this.state = State.OP_START;
        this.as = 0;
        this.drop = 0;
        this.hdr = 0;
    }
    parse(buf) {
        if (typeof module !== "undefined" && module.exports) {
            buf.subarray = buf.slice;
        }
        let i;
        for(i = 0; i < buf.length; i++){
            const b = buf[i];
            switch(this.state){
                case State.OP_START:
                    switch(b){
                        case cc.M:
                        case cc.m:
                            this.state = State.OP_M;
                            this.hdr = -1;
                            this.ma = newMsgArg();
                            break;
                        case cc.H:
                        case cc.h:
                            this.state = State.OP_H;
                            this.hdr = 0;
                            this.ma = newMsgArg();
                            break;
                        case cc.P:
                        case cc.p:
                            this.state = State.OP_P;
                            break;
                        case cc.PLUS:
                            this.state = State.OP_PLUS;
                            break;
                        case cc.MINUS:
                            this.state = State.OP_MINUS;
                            break;
                        case cc.I:
                        case cc.i:
                            this.state = State.OP_I;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_H:
                    switch(b){
                        case cc.M:
                        case cc.m:
                            this.state = State.OP_M;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_M:
                    switch(b){
                        case cc.S:
                        case cc.s:
                            this.state = State.OP_MS;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_MS:
                    switch(b){
                        case cc.G:
                        case cc.g:
                            this.state = State.OP_MSG;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_MSG:
                    switch(b){
                        case cc.SPACE:
                        case cc.TAB:
                            this.state = State.OP_MSG_SPC;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_MSG_SPC:
                    switch(b){
                        case cc.SPACE:
                        case cc.TAB: continue;
                        default:
                            this.state = State.MSG_ARG;
                            this.as = i;
                    }
                    break;
                case State.MSG_ARG:
                    switch(b){
                        case cc.CR:
                            this.drop = 1;
                            break;
                        case cc.NL:
                            {
                                const arg = this.argBuf ? this.argBuf.bytes() : buf.subarray(this.as, i - this.drop);
                                this.processMsgArgs(arg);
                                this.drop = 0;
                                this.as = i + 1;
                                this.state = State.MSG_PAYLOAD;
                                i = this.as + this.ma.size - 1;
                                break;
                            }
                        default:
                            if (this.argBuf) {
                                this.argBuf.writeByte(b);
                            }
                    }
                    break;
                case State.MSG_PAYLOAD:
                    if (this.msgBuf) {
                        if (this.msgBuf.length >= this.ma.size) {
                            const data = this.msgBuf.bytes({
                                copy: false
                            });
                            this.dispatcher.push({
                                kind: Kind.MSG,
                                msg: this.ma,
                                data: data
                            });
                            this.argBuf = undefined;
                            this.msgBuf = undefined;
                            this.state = State.MSG_END;
                        } else {
                            let toCopy = this.ma.size - this.msgBuf.length;
                            const avail = buf.length - i;
                            if (avail < toCopy) {
                                toCopy = avail;
                            }
                            if (toCopy > 0) {
                                this.msgBuf.write(buf.subarray(i, i + toCopy));
                                i = i + toCopy - 1;
                            } else {
                                this.msgBuf.writeByte(b);
                            }
                        }
                    } else if (i - this.as >= this.ma.size) {
                        this.dispatcher.push({
                            kind: Kind.MSG,
                            msg: this.ma,
                            data: buf.subarray(this.as, i)
                        });
                        this.argBuf = undefined;
                        this.msgBuf = undefined;
                        this.state = State.MSG_END;
                    }
                    break;
                case State.MSG_END:
                    switch(b){
                        case cc.NL:
                            this.drop = 0;
                            this.as = i + 1;
                            this.state = State.OP_START;
                            break;
                        default: continue;
                    }
                    break;
                case State.OP_PLUS:
                    switch(b){
                        case cc.O:
                        case cc.o:
                            this.state = State.OP_PLUS_O;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_PLUS_O:
                    switch(b){
                        case cc.K:
                        case cc.k:
                            this.state = State.OP_PLUS_OK;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_PLUS_OK:
                    switch(b){
                        case cc.NL:
                            this.dispatcher.push({
                                kind: Kind.OK
                            });
                            this.drop = 0;
                            this.state = State.OP_START;
                            break;
                    }
                    break;
                case State.OP_MINUS:
                    switch(b){
                        case cc.E:
                        case cc.e:
                            this.state = State.OP_MINUS_E;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_MINUS_E:
                    switch(b){
                        case cc.R:
                        case cc.r:
                            this.state = State.OP_MINUS_ER;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_MINUS_ER:
                    switch(b){
                        case cc.R:
                        case cc.r:
                            this.state = State.OP_MINUS_ERR;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_MINUS_ERR:
                    switch(b){
                        case cc.SPACE:
                        case cc.TAB:
                            this.state = State.OP_MINUS_ERR_SPC;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_MINUS_ERR_SPC:
                    switch(b){
                        case cc.SPACE:
                        case cc.TAB: continue;
                        default:
                            this.state = State.MINUS_ERR_ARG;
                            this.as = i;
                    }
                    break;
                case State.MINUS_ERR_ARG:
                    switch(b){
                        case cc.CR:
                            this.drop = 1;
                            break;
                        case cc.NL:
                            {
                                let arg;
                                if (this.argBuf) {
                                    arg = this.argBuf.bytes();
                                    this.argBuf = undefined;
                                } else {
                                    arg = buf.subarray(this.as, i - this.drop);
                                }
                                this.dispatcher.push({
                                    kind: Kind.ERR,
                                    data: arg
                                });
                                this.drop = 0;
                                this.as = i + 1;
                                this.state = State.OP_START;
                                break;
                            }
                        default:
                            if (this.argBuf) {
                                this.argBuf.write(Uint8Array.of(b));
                            }
                    }
                    break;
                case State.OP_P:
                    switch(b){
                        case cc.I:
                        case cc.i:
                            this.state = State.OP_PI;
                            break;
                        case cc.O:
                        case cc.o:
                            this.state = State.OP_PO;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_PO:
                    switch(b){
                        case cc.N:
                        case cc.n:
                            this.state = State.OP_PON;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_PON:
                    switch(b){
                        case cc.G:
                        case cc.g:
                            this.state = State.OP_PONG;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_PONG:
                    switch(b){
                        case cc.NL:
                            this.dispatcher.push({
                                kind: Kind.PONG
                            });
                            this.drop = 0;
                            this.state = State.OP_START;
                            break;
                    }
                    break;
                case State.OP_PI:
                    switch(b){
                        case cc.N:
                        case cc.n:
                            this.state = State.OP_PIN;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_PIN:
                    switch(b){
                        case cc.G:
                        case cc.g:
                            this.state = State.OP_PING;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_PING:
                    switch(b){
                        case cc.NL:
                            this.dispatcher.push({
                                kind: Kind.PING
                            });
                            this.drop = 0;
                            this.state = State.OP_START;
                            break;
                    }
                    break;
                case State.OP_I:
                    switch(b){
                        case cc.N:
                        case cc.n:
                            this.state = State.OP_IN;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_IN:
                    switch(b){
                        case cc.F:
                        case cc.f:
                            this.state = State.OP_INF;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_INF:
                    switch(b){
                        case cc.O:
                        case cc.o:
                            this.state = State.OP_INFO;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_INFO:
                    switch(b){
                        case cc.SPACE:
                        case cc.TAB:
                            this.state = State.OP_INFO_SPC;
                            break;
                        default:
                            throw this.fail(buf.subarray(i));
                    }
                    break;
                case State.OP_INFO_SPC:
                    switch(b){
                        case cc.SPACE:
                        case cc.TAB: continue;
                        default:
                            this.state = State.INFO_ARG;
                            this.as = i;
                    }
                    break;
                case State.INFO_ARG:
                    switch(b){
                        case cc.CR:
                            this.drop = 1;
                            break;
                        case cc.NL:
                            {
                                let arg;
                                if (this.argBuf) {
                                    arg = this.argBuf.bytes();
                                    this.argBuf = undefined;
                                } else {
                                    arg = buf.subarray(this.as, i - this.drop);
                                }
                                this.dispatcher.push({
                                    kind: Kind.INFO,
                                    data: arg
                                });
                                this.drop = 0;
                                this.as = i + 1;
                                this.state = State.OP_START;
                                break;
                            }
                        default:
                            if (this.argBuf) {
                                this.argBuf.writeByte(b);
                            }
                    }
                    break;
                default:
                    throw this.fail(buf.subarray(i));
            }
        }
        if ((this.state === State.MSG_ARG || this.state === State.MINUS_ERR_ARG || this.state === State.INFO_ARG) && !this.argBuf) {
            this.argBuf = new DenoBuffer(buf.subarray(this.as, i - this.drop));
        }
        if (this.state === State.MSG_PAYLOAD && !this.msgBuf) {
            if (!this.argBuf) {
                this.cloneMsgArg();
            }
            this.msgBuf = new DenoBuffer(buf.subarray(this.as));
        }
    }
    cloneMsgArg() {
        const s = this.ma.subject.length;
        const r = this.ma.reply ? this.ma.reply.length : 0;
        const buf = new Uint8Array(s + r);
        buf.set(this.ma.subject);
        if (this.ma.reply) {
            buf.set(this.ma.reply, s);
        }
        this.argBuf = new DenoBuffer(buf);
        this.ma.subject = buf.subarray(0, s);
        if (this.ma.reply) {
            this.ma.reply = buf.subarray(r);
        }
    }
    processMsgArgs(arg) {
        if (this.hdr >= 0) {
            return this.processHeaderMsgArgs(arg);
        }
        const args = [];
        let start = -1;
        for(let i = 0; i < arg.length; i++){
            const b = arg[i];
            switch(b){
                case cc.SPACE:
                case cc.TAB:
                case cc.CR:
                case cc.NL:
                    if (start >= 0) {
                        args.push(arg.subarray(start, i));
                        start = -1;
                    }
                    break;
                default:
                    if (start < 0) {
                        start = i;
                    }
            }
        }
        if (start >= 0) {
            args.push(arg.subarray(start));
        }
        switch(args.length){
            case 3:
                this.ma.subject = args[0];
                this.ma.sid = this.protoParseInt(args[1]);
                this.ma.reply = undefined;
                this.ma.size = this.protoParseInt(args[2]);
                break;
            case 4:
                this.ma.subject = args[0];
                this.ma.sid = this.protoParseInt(args[1]);
                this.ma.reply = args[2];
                this.ma.size = this.protoParseInt(args[3]);
                break;
            default:
                throw this.fail(arg, "processMsgArgs Parse Error");
        }
        if (this.ma.sid < 0) {
            throw this.fail(arg, "processMsgArgs Bad or Missing Sid Error");
        }
        if (this.ma.size < 0) {
            throw this.fail(arg, "processMsgArgs Bad or Missing Size Error");
        }
    }
    fail(data, label = "") {
        if (!label) {
            label = `parse error [${this.state}]`;
        } else {
            label = `${label} [${this.state}]`;
        }
        return new Error(`${label}: ${TD.decode(data)}`);
    }
    processHeaderMsgArgs(arg) {
        const args = [];
        let start = -1;
        for(let i = 0; i < arg.length; i++){
            const b = arg[i];
            switch(b){
                case cc.SPACE:
                case cc.TAB:
                case cc.CR:
                case cc.NL:
                    if (start >= 0) {
                        args.push(arg.subarray(start, i));
                        start = -1;
                    }
                    break;
                default:
                    if (start < 0) {
                        start = i;
                    }
            }
        }
        if (start >= 0) {
            args.push(arg.subarray(start));
        }
        switch(args.length){
            case 4:
                this.ma.subject = args[0];
                this.ma.sid = this.protoParseInt(args[1]);
                this.ma.reply = undefined;
                this.ma.hdr = this.protoParseInt(args[2]);
                this.ma.size = this.protoParseInt(args[3]);
                break;
            case 5:
                this.ma.subject = args[0];
                this.ma.sid = this.protoParseInt(args[1]);
                this.ma.reply = args[2];
                this.ma.hdr = this.protoParseInt(args[3]);
                this.ma.size = this.protoParseInt(args[4]);
                break;
            default:
                throw this.fail(arg, "processHeaderMsgArgs Parse Error");
        }
        if (this.ma.sid < 0) {
            throw this.fail(arg, "processHeaderMsgArgs Bad or Missing Sid Error");
        }
        if (this.ma.hdr < 0 || this.ma.hdr > this.ma.size) {
            throw this.fail(arg, "processHeaderMsgArgs Bad or Missing Header Size Error");
        }
        if (this.ma.size < 0) {
            throw this.fail(arg, "processHeaderMsgArgs Bad or Missing Size Error");
        }
    }
    protoParseInt(a) {
        if (a.length === 0) {
            return -1;
        }
        let n = 0;
        for(let i = 0; i < a.length; i++){
            if (a[i] < 48 || a[i] > 57) {
                return -1;
            }
            n = n * 10 + (a[i] - 48);
        }
        return n;
    }
}
function throughput(bytes, seconds) {
    return humanizeBytes(bytes / seconds);
}
function parseIPv4(s) {
    const ip = new Uint8Array(4);
    for(let i = 0; i < 4; i++){
        if (s.length === 0) {
            return undefined;
        }
        if (i > 0) {
            if (s[0] !== ".") {
                return undefined;
            }
            s = s.substring(1);
        }
        const { n , c , ok  } = dtoi(s);
        if (!ok || n > 255) {
            return undefined;
        }
        s = s.substring(c);
        ip[i] = n;
    }
    return ipV4(ip[0], ip[1], ip[2], ip[3]);
}
function parseIPv6(s) {
    const ip = new Uint8Array(16);
    let ellipsis = -1;
    if (s.length >= 2 && s[0] === ":" && s[1] === ":") {
        ellipsis = 0;
        s = s.substring(2);
        if (s.length === 0) {
            return ip;
        }
    }
    let i = 0;
    while(i < 16){
        const { n , c , ok  } = xtoi(s);
        if (!ok || n > 65535) {
            return undefined;
        }
        if (c < s.length && s[c] === ".") {
            if (ellipsis < 0 && i != 16 - 4) {
                return undefined;
            }
            if (i + 4 > 16) {
                return undefined;
            }
            const ip4 = parseIPv4(s);
            if (ip4 === undefined) {
                return undefined;
            }
            ip[i] = ip4[12];
            ip[i + 1] = ip4[13];
            ip[i + 2] = ip4[14];
            ip[i + 3] = ip4[15];
            s = "";
            i += 4;
            break;
        }
        ip[i] = n >> 8;
        ip[i + 1] = n;
        i += 2;
        s = s.substring(c);
        if (s.length === 0) {
            break;
        }
        if (s[0] !== ":" || s.length == 1) {
            return undefined;
        }
        s = s.substring(1);
        if (s[0] === ":") {
            if (ellipsis >= 0) {
                return undefined;
            }
            ellipsis = i;
            s = s.substring(1);
            if (s.length === 0) {
                break;
            }
        }
    }
    if (s.length !== 0) {
        return undefined;
    }
    if (i < 16) {
        if (ellipsis < 0) {
            return undefined;
        }
        const n = 16 - i;
        for(let j = i - 1; j >= ellipsis; j--){
            ip[j + n] = ip[j];
        }
        for(let j1 = ellipsis + n - 1; j1 >= ellipsis; j1--){
            ip[j1] = 0;
        }
    } else if (ellipsis >= 0) {
        return undefined;
    }
    return ip;
}
const Nuid1 = Nuid;
const nuid1 = nuid;
const ErrorCode1 = ErrorCode;
const createInbox1 = createInbox;
const Kind1 = Kind;
const Parser1 = Parser;
const State1 = State;
function buildAuthenticator(opts1) {
    if (opts1.authenticator) {
        return opts1.authenticator;
    }
    if (opts1.token) {
        return tokenFn(opts1.token);
    }
    if (opts1.user) {
        return passFn(opts1.user, opts1.pass);
    }
    return noAuthFn();
}
class Metric {
    constructor(name, duration){
        this.name = name;
        this.duration = duration;
        this.date = Date.now();
        this.payload = 0;
        this.msgs = 0;
        this.bytes = 0;
    }
    toString() {
        const sec = this.duration / 1000;
        const mps = Math.round(this.msgs / sec);
        const label = this.asyncRequests ? "asyncRequests" : "";
        let minmax = "";
        if (this.max) {
            minmax = `${this.min}/${this.max}`;
        }
        return `${this.name}${label ? " [asyncRequests]" : ""} ${humanizeNumber(mps)} msgs/sec - [${sec.toFixed(2)} secs] ~ ${throughput(this.bytes, sec)} ${minmax}`;
    }
    toCsv() {
        return `"${this.name}",${new Date(this.date).toISOString()},${this.lang},${this.version},${this.msgs},${this.payload},${this.bytes},${this.duration},${this.asyncRequests ? this.asyncRequests : false}\n`;
    }
    static header() {
        return `Test,Date,Lang,Version,Count,MsgPayload,Bytes,Millis,Async\n`;
    }
}
function parseIP(h) {
    for(let i = 0; i < h.length; i++){
        switch(h[i]){
            case ".":
                return parseIPv4(h);
            case ":":
                return parseIPv6(h);
        }
    }
    return;
}
const Metric1 = Metric;
const parseIP1 = parseIP;
function isIP(h) {
    return parseIP(h) !== undefined;
}
const isIP1 = isIP;
class Servers {
    constructor(randomize, listens = [], opts1 = {
    }){
        this.firstSelect = true;
        this.servers = [];
        this.tlsName = "";
        if (listens) {
            listens.forEach((hp)=>{
                hp = urlParseFn ? urlParseFn(hp) : hp;
                this.servers.push(new ServerImpl(hp));
            });
            if (randomize) {
                this.servers = shuffle(this.servers);
            }
        }
        if (this.servers.length === 0) {
            this.addServer(DEFAULT_HOSTPORT, false);
        }
        this.currentServer = this.servers[0];
    }
    updateTLSName() {
        const cs = this.getCurrentServer();
        if (!isIP(cs.hostname)) {
            this.tlsName = cs.hostname;
            this.servers.forEach((s)=>{
                if (s.gossiped) {
                    s.tlsName = this.tlsName;
                }
            });
        }
    }
    getCurrentServer() {
        return this.currentServer;
    }
    addServer(u, implicit = false) {
        u = urlParseFn ? urlParseFn(u) : u;
        const s = new ServerImpl(u, implicit);
        if (isIP(s.hostname)) {
            s.tlsName = this.tlsName;
        }
        this.servers.push(s);
    }
    selectServer() {
        if (this.firstSelect) {
            this.firstSelect = false;
            return this.currentServer;
        }
        const t = this.servers.shift();
        if (t) {
            this.servers.push(t);
            this.currentServer = t;
        }
        return t;
    }
    removeCurrentServer() {
        this.removeServer(this.currentServer);
    }
    removeServer(server) {
        if (server) {
            const index = this.servers.indexOf(server);
            this.servers.splice(index, 1);
        }
    }
    length() {
        return this.servers.length;
    }
    next() {
        return this.servers.length ? this.servers[0] : undefined;
    }
    getServers() {
        return this.servers;
    }
    update(info) {
        const added = [];
        let deleted = [];
        const discovered = new Map();
        if (info.connect_urls && info.connect_urls.length > 0) {
            info.connect_urls.forEach((hp)=>{
                hp = urlParseFn ? urlParseFn(hp) : hp;
                const s = new ServerImpl(hp, true);
                discovered.set(hp, s);
            });
        }
        const toDelete = [];
        this.servers.forEach((s, index)=>{
            const u2 = s.listen;
            if (s.gossiped && this.currentServer.listen !== u2 && discovered.get(u2) === undefined) {
                toDelete.push(index);
            }
            discovered.delete(u2);
        });
        toDelete.reverse();
        toDelete.forEach((index)=>{
            const removed = this.servers.splice(index, 1);
            deleted = deleted.concat(removed[0].listen);
        });
        discovered.forEach((v, k, m)=>{
            this.servers.push(v);
            added.push(k);
        });
        return {
            added,
            deleted
        };
    }
}
const VERSION = "1.0.0-117";
const LANG = "nats.ws";
function wsUrlParseFn(u2) {
    const ut = /^(.*:\/\/)(.*)/;
    if (!ut.test(u2)) {
        u2 = `https://${u2}`;
    }
    let url1 = new URL(u2);
    const srcProto = url1.protocol.toLowerCase();
    if (srcProto !== "https:" && srcProto !== "http") {
        u2 = u2.replace(/^(.*:\/\/)(.*)/gm, "$2");
        url1 = new URL(`http://${u2}`);
    }
    let protocol;
    let port;
    const host = url1.hostname;
    const path = url1.pathname;
    const search = url1.search || "";
    switch(srcProto){
        case "http:":
        case "ws:":
        case "nats:":
            port = url1.port || "80";
            protocol = "ws:";
            break;
        default:
            port = url1.port || "443";
            protocol = "wss:";
            break;
    }
    return `${protocol}//${host}:${port}${path}${search}`;
}
const mod = function() {
    function validateBase64(s) {
        if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s)) {
            throw new TypeError('invalid base64 string');
        }
    }
    const validateBase641 = validateBase64;
    function validateHex(s) {
        if (!/^(?:[A-Fa-f0-9]{2})+$/.test(s)) {
            throw new TypeError('invalid hex string');
        }
    }
    const validateHex1 = validateHex;
    const validateBase642 = validateBase64;
    const validateHex2 = validateHex;
    function getLengths(b64) {
        const len = b64.length;
        let validLen = b64.indexOf("=");
        if (validLen === -1) {
            validLen = len;
        }
        const placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
        return [
            validLen,
            placeHoldersLen
        ];
    }
    function init(lookup, revLookup, urlsafe = false) {
        function _byteLength(validLen, placeHoldersLen) {
            return Math.floor((validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen);
        }
        function tripletToBase64(num) {
            return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
        }
        function encodeChunk(buf, start, end) {
            const out = new Array((end - start) / 3);
            for(let i = start, curTriplet = 0; i < end; i += 3){
                out[curTriplet++] = tripletToBase64((buf[i] << 16) + (buf[i + 1] << 8) + buf[i + 2]);
            }
            return out.join("");
        }
        return {
            byteLength (b64) {
                return _byteLength.apply(null, getLengths(b64));
            },
            toUint8Array (b64) {
                const [validLen, placeHoldersLen] = getLengths(b64);
                const buf = new Uint8Array(_byteLength(validLen, placeHoldersLen));
                const len = placeHoldersLen ? validLen - 4 : validLen;
                let tmp;
                let curByte = 0;
                let i;
                for(i = 0; i < len; i += 4){
                    tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
                    buf[curByte++] = tmp >> 16 & 255;
                    buf[curByte++] = tmp >> 8 & 255;
                    buf[curByte++] = tmp & 255;
                }
                if (placeHoldersLen === 2) {
                    tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
                    buf[curByte++] = tmp & 255;
                } else if (placeHoldersLen === 1) {
                    tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
                    buf[curByte++] = tmp >> 8 & 255;
                    buf[curByte++] = tmp & 255;
                }
                return buf;
            },
            fromUint8Array (buf) {
                const maxChunkLength = 16383;
                const len = buf.length;
                const extraBytes = len % 3;
                const len2 = len - extraBytes;
                const parts = new Array(Math.ceil(len2 / 16383) + (extraBytes ? 1 : 0));
                let curChunk = 0;
                let chunkEnd;
                for(let i = 0; i < len2; i += 16383){
                    chunkEnd = i + 16383;
                    parts[curChunk++] = encodeChunk(buf, i, chunkEnd > len2 ? len2 : chunkEnd);
                }
                let tmp;
                if (extraBytes === 1) {
                    tmp = buf[len2];
                    parts[curChunk] = lookup[tmp >> 2] + lookup[tmp << 4 & 63];
                    if (!urlsafe) parts[curChunk] += "==";
                } else if (extraBytes === 2) {
                    tmp = buf[len2] << 8 | buf[len2 + 1] & 255;
                    parts[curChunk] = lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63];
                    if (!urlsafe) parts[curChunk] += "=";
                }
                return parts.join("");
            }
        };
    }
    const init1 = init;
    const init2 = init;
    const lookup = [];
    const revLookup = [];
    const code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for(let i = 0, l = code.length; i < l; ++i){
        lookup[i] = code[i];
        revLookup[code.charCodeAt(i)] = i;
    }
    revLookup["-".charCodeAt(0)] = 62;
    revLookup["_".charCodeAt(0)] = 63;
    const { byteLength , toUint8Array , fromUint8Array  } = init(lookup, revLookup);
    const byteLength1 = byteLength;
    const toUint8Array1 = toUint8Array;
    const fromUint8Array1 = fromUint8Array;
    const hextable = new TextEncoder().encode("0123456789abcdef");
    function errInvalidByte(byte) {
        return new Error("encoding/hex: invalid byte: " + new TextDecoder().decode(new Uint8Array([
            byte
        ])));
    }
    function errLength() {
        return new Error("encoding/hex: odd length hex string");
    }
    function fromHexChar(byte) {
        switch(true){
            case 48 <= byte && byte <= 57:
                return [
                    byte - 48,
                    true
                ];
            case 97 <= byte && byte <= 102:
                return [
                    byte - 97 + 10,
                    true
                ];
            case 65 <= byte && byte <= 70:
                return [
                    byte - 65 + 10,
                    true
                ];
        }
        return [
            0,
            false
        ];
    }
    function encodedLen(n) {
        return n * 2;
    }
    function encode(dst, src) {
        const srcLength = encodedLen(src.length);
        if (dst.length !== srcLength) {
            throw new Error("Out of index.");
        }
        for(let i1 = 0; i1 < src.length; i1++){
            const v = src[i1];
            dst[i1 * 2] = hextable[v >> 4];
            dst[i1 * 2 + 1] = hextable[v & 15];
        }
        return srcLength;
    }
    function encodeToString(src) {
        const dest = new Uint8Array(encodedLen(src.length));
        encode(dest, src);
        return new TextDecoder().decode(dest);
    }
    function decode(dst, src) {
        let i1 = 0;
        for(; i1 < Math.floor(src.length / 2); i1++){
            const [a, aOK] = fromHexChar(src[i1 * 2]);
            if (!aOK) {
                return [
                    i1,
                    errInvalidByte(src[i1 * 2])
                ];
            }
            const [b, bOK] = fromHexChar(src[i1 * 2 + 1]);
            if (!bOK) {
                return [
                    i1,
                    errInvalidByte(src[i1 * 2 + 1])
                ];
            }
            dst[i1] = a << 4 | b;
        }
        if (src.length % 2 == 1) {
            const [, ok] = fromHexChar(src[i1 * 2]);
            if (!ok) {
                return [
                    i1,
                    errInvalidByte(src[i1 * 2])
                ];
            }
            return [
                i1,
                errLength()
            ];
        }
        return [
            i1,
            undefined
        ];
    }
    function decodedLen(x) {
        return Math.floor(x / 2);
    }
    function decodeString(s) {
        const src = new TextEncoder().encode(s);
        const [n, err] = decode(src, src);
        if (err) {
            throw err;
        }
        return src.slice(0, n);
    }
    const errInvalidByte1 = errInvalidByte;
    const errLength1 = errLength;
    const encodedLen1 = encodedLen;
    const encode1 = encode;
    const encodeToString1 = encodeToString;
    const decode1 = decode;
    const decodedLen1 = decodedLen;
    const decodeString1 = decodeString;
    const encodeToString2 = encodeToString;
    const decodeString2 = decodeString;
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    function encodeUTF8(a) {
        return decoder.decode(a);
    }
    const encodeUTF81 = encodeUTF8;
    const encodeUTF82 = encodeUTF8;
    function decodeUTF8(s) {
        return encoder.encode(s);
    }
    const decodeUTF81 = decodeUTF8;
    const decodeUTF82 = decodeUTF8;
    function encodeBase64(a) {
        return fromUint8Array(a);
    }
    const encodeBase641 = encodeBase64;
    const encodeBase642 = encodeBase64;
    function decodeBase64(s) {
        validateBase64(s);
        return toUint8Array(s);
    }
    const decodeBase641 = decodeBase64;
    const decodeBase642 = decodeBase64;
    function encodeHex(a) {
        return encodeToString(a);
    }
    const encodeHex1 = encodeHex;
    const encodeHex2 = encodeHex;
    function decodeHex(s) {
        validateHex(s);
        return decodeString(s);
    }
    const decodeHex1 = decodeHex;
    const decodeHex2 = decodeHex;
    const ByteArray1 = ByteArray;
    const _01 = _0;
    const randomBytes1 = randomBytes;
    var BoxLength;
    function vn(x, xi, y, yi, n) {
        let i1, d = 0;
        for(i1 = 0; i1 < n; i1++)d |= x[xi + i1] ^ y[yi + i1];
        return (1 & d - 1 >>> 8) - 1;
    }
    function _verify_16(x, xi, y, yi) {
        return vn(x, xi, y, yi, 16);
    }
    function _verify_32(x, xi, y, yi) {
        return vn(x, xi, y, yi, 32);
    }
    const _verify_161 = _verify_16;
    const _verify_321 = _verify_32;
    const ByteArray2 = ByteArray;
    const NumArray1 = NumArray;
    const gf2 = gf;
    const _91 = _9;
    const _1216651 = _121665;
    const A1 = A;
    const Z1 = Z;
    const M1 = M;
    const S1 = S;
    var ScalarLength;
    (function(ScalarLength1) {
        ScalarLength1[ScalarLength1["Scalar"] = 32] = "Scalar";
        ScalarLength1[ScalarLength1["GroupElement"] = 32] = "GroupElement";
    })(ScalarLength || (ScalarLength = {
    }));
    const ScalarLength1 = ScalarLength;
    const ByteArray3 = ByteArray;
    const _verify_162 = _verify_16;
    const ByteArray4 = ByteArray;
    function _salsa20(o, p, k, c) {
        const j0 = c[0] & 255 | (c[1] & 255) << 8 | (c[2] & 255) << 16 | (c[3] & 255) << 24, j1 = k[0] & 255 | (k[1] & 255) << 8 | (k[2] & 255) << 16 | (k[3] & 255) << 24, j2 = k[4] & 255 | (k[5] & 255) << 8 | (k[6] & 255) << 16 | (k[7] & 255) << 24, j3 = k[8] & 255 | (k[9] & 255) << 8 | (k[10] & 255) << 16 | (k[11] & 255) << 24, j4 = k[12] & 255 | (k[13] & 255) << 8 | (k[14] & 255) << 16 | (k[15] & 255) << 24, j5 = c[4] & 255 | (c[5] & 255) << 8 | (c[6] & 255) << 16 | (c[7] & 255) << 24, j6 = p[0] & 255 | (p[1] & 255) << 8 | (p[2] & 255) << 16 | (p[3] & 255) << 24, j7 = p[4] & 255 | (p[5] & 255) << 8 | (p[6] & 255) << 16 | (p[7] & 255) << 24, j8 = p[8] & 255 | (p[9] & 255) << 8 | (p[10] & 255) << 16 | (p[11] & 255) << 24, j9 = p[12] & 255 | (p[13] & 255) << 8 | (p[14] & 255) << 16 | (p[15] & 255) << 24, j10 = c[8] & 255 | (c[9] & 255) << 8 | (c[10] & 255) << 16 | (c[11] & 255) << 24, j11 = k[16] & 255 | (k[17] & 255) << 8 | (k[18] & 255) << 16 | (k[19] & 255) << 24, j12 = k[20] & 255 | (k[21] & 255) << 8 | (k[22] & 255) << 16 | (k[23] & 255) << 24, j13 = k[24] & 255 | (k[25] & 255) << 8 | (k[26] & 255) << 16 | (k[27] & 255) << 24, j14 = k[28] & 255 | (k[29] & 255) << 8 | (k[30] & 255) << 16 | (k[31] & 255) << 24, j15 = c[12] & 255 | (c[13] & 255) << 8 | (c[14] & 255) << 16 | (c[15] & 255) << 24;
        let x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15, u2;
        for(let i1 = 0; i1 < 20; i1 += 2){
            u2 = x0 + x12 | 0;
            x4 ^= u2 << 7 | u2 >>> 32 - 7;
            u2 = x4 + x0 | 0;
            x8 ^= u2 << 9 | u2 >>> 32 - 9;
            u2 = x8 + x4 | 0;
            x12 ^= u2 << 13 | u2 >>> 32 - 13;
            u2 = x12 + x8 | 0;
            x0 ^= u2 << 18 | u2 >>> 32 - 18;
            u2 = x5 + x1 | 0;
            x9 ^= u2 << 7 | u2 >>> 32 - 7;
            u2 = x9 + x5 | 0;
            x13 ^= u2 << 9 | u2 >>> 32 - 9;
            u2 = x13 + x9 | 0;
            x1 ^= u2 << 13 | u2 >>> 32 - 13;
            u2 = x1 + x13 | 0;
            x5 ^= u2 << 18 | u2 >>> 32 - 18;
            u2 = x10 + x6 | 0;
            x14 ^= u2 << 7 | u2 >>> 32 - 7;
            u2 = x14 + x10 | 0;
            x2 ^= u2 << 9 | u2 >>> 32 - 9;
            u2 = x2 + x14 | 0;
            x6 ^= u2 << 13 | u2 >>> 32 - 13;
            u2 = x6 + x2 | 0;
            x10 ^= u2 << 18 | u2 >>> 32 - 18;
            u2 = x15 + x11 | 0;
            x3 ^= u2 << 7 | u2 >>> 32 - 7;
            u2 = x3 + x15 | 0;
            x7 ^= u2 << 9 | u2 >>> 32 - 9;
            u2 = x7 + x3 | 0;
            x11 ^= u2 << 13 | u2 >>> 32 - 13;
            u2 = x11 + x7 | 0;
            x15 ^= u2 << 18 | u2 >>> 32 - 18;
            u2 = x0 + x3 | 0;
            x1 ^= u2 << 7 | u2 >>> 32 - 7;
            u2 = x1 + x0 | 0;
            x2 ^= u2 << 9 | u2 >>> 32 - 9;
            u2 = x2 + x1 | 0;
            x3 ^= u2 << 13 | u2 >>> 32 - 13;
            u2 = x3 + x2 | 0;
            x0 ^= u2 << 18 | u2 >>> 32 - 18;
            u2 = x5 + x4 | 0;
            x6 ^= u2 << 7 | u2 >>> 32 - 7;
            u2 = x6 + x5 | 0;
            x7 ^= u2 << 9 | u2 >>> 32 - 9;
            u2 = x7 + x6 | 0;
            x4 ^= u2 << 13 | u2 >>> 32 - 13;
            u2 = x4 + x7 | 0;
            x5 ^= u2 << 18 | u2 >>> 32 - 18;
            u2 = x10 + x9 | 0;
            x11 ^= u2 << 7 | u2 >>> 32 - 7;
            u2 = x11 + x10 | 0;
            x8 ^= u2 << 9 | u2 >>> 32 - 9;
            u2 = x8 + x11 | 0;
            x9 ^= u2 << 13 | u2 >>> 32 - 13;
            u2 = x9 + x8 | 0;
            x10 ^= u2 << 18 | u2 >>> 32 - 18;
            u2 = x15 + x14 | 0;
            x12 ^= u2 << 7 | u2 >>> 32 - 7;
            u2 = x12 + x15 | 0;
            x13 ^= u2 << 9 | u2 >>> 32 - 9;
            u2 = x13 + x12 | 0;
            x14 ^= u2 << 13 | u2 >>> 32 - 13;
            u2 = x14 + x13 | 0;
            x15 ^= u2 << 18 | u2 >>> 32 - 18;
        }
        x0 = x0 + j0 | 0;
        x1 = x1 + j1 | 0;
        x2 = x2 + j2 | 0;
        x3 = x3 + j3 | 0;
        x4 = x4 + j4 | 0;
        x5 = x5 + j5 | 0;
        x6 = x6 + j6 | 0;
        x7 = x7 + j7 | 0;
        x8 = x8 + j8 | 0;
        x9 = x9 + j9 | 0;
        x10 = x10 + j10 | 0;
        x11 = x11 + j11 | 0;
        x12 = x12 + j12 | 0;
        x13 = x13 + j13 | 0;
        x14 = x14 + j14 | 0;
        x15 = x15 + j15 | 0;
        o[0] = x0 >>> 0 & 255;
        o[1] = x0 >>> 8 & 255;
        o[2] = x0 >>> 16 & 255;
        o[3] = x0 >>> 24 & 255;
        o[4] = x1 >>> 0 & 255;
        o[5] = x1 >>> 8 & 255;
        o[6] = x1 >>> 16 & 255;
        o[7] = x1 >>> 24 & 255;
        o[8] = x2 >>> 0 & 255;
        o[9] = x2 >>> 8 & 255;
        o[10] = x2 >>> 16 & 255;
        o[11] = x2 >>> 24 & 255;
        o[12] = x3 >>> 0 & 255;
        o[13] = x3 >>> 8 & 255;
        o[14] = x3 >>> 16 & 255;
        o[15] = x3 >>> 24 & 255;
        o[16] = x4 >>> 0 & 255;
        o[17] = x4 >>> 8 & 255;
        o[18] = x4 >>> 16 & 255;
        o[19] = x4 >>> 24 & 255;
        o[20] = x5 >>> 0 & 255;
        o[21] = x5 >>> 8 & 255;
        o[22] = x5 >>> 16 & 255;
        o[23] = x5 >>> 24 & 255;
        o[24] = x6 >>> 0 & 255;
        o[25] = x6 >>> 8 & 255;
        o[26] = x6 >>> 16 & 255;
        o[27] = x6 >>> 24 & 255;
        o[28] = x7 >>> 0 & 255;
        o[29] = x7 >>> 8 & 255;
        o[30] = x7 >>> 16 & 255;
        o[31] = x7 >>> 24 & 255;
        o[32] = x8 >>> 0 & 255;
        o[33] = x8 >>> 8 & 255;
        o[34] = x8 >>> 16 & 255;
        o[35] = x8 >>> 24 & 255;
        o[36] = x9 >>> 0 & 255;
        o[37] = x9 >>> 8 & 255;
        o[38] = x9 >>> 16 & 255;
        o[39] = x9 >>> 24 & 255;
        o[40] = x10 >>> 0 & 255;
        o[41] = x10 >>> 8 & 255;
        o[42] = x10 >>> 16 & 255;
        o[43] = x10 >>> 24 & 255;
        o[44] = x11 >>> 0 & 255;
        o[45] = x11 >>> 8 & 255;
        o[46] = x11 >>> 16 & 255;
        o[47] = x11 >>> 24 & 255;
        o[48] = x12 >>> 0 & 255;
        o[49] = x12 >>> 8 & 255;
        o[50] = x12 >>> 16 & 255;
        o[51] = x12 >>> 24 & 255;
        o[52] = x13 >>> 0 & 255;
        o[53] = x13 >>> 8 & 255;
        o[54] = x13 >>> 16 & 255;
        o[55] = x13 >>> 24 & 255;
        o[56] = x14 >>> 0 & 255;
        o[57] = x14 >>> 8 & 255;
        o[58] = x14 >>> 16 & 255;
        o[59] = x14 >>> 24 & 255;
        o[60] = x15 >>> 0 & 255;
        o[61] = x15 >>> 8 & 255;
        o[62] = x15 >>> 16 & 255;
        o[63] = x15 >>> 24 & 255;
    }
    function _hsalsa20(o, p, k, c) {
        const j0 = c[0] & 255 | (c[1] & 255) << 8 | (c[2] & 255) << 16 | (c[3] & 255) << 24, j1 = k[0] & 255 | (k[1] & 255) << 8 | (k[2] & 255) << 16 | (k[3] & 255) << 24, j2 = k[4] & 255 | (k[5] & 255) << 8 | (k[6] & 255) << 16 | (k[7] & 255) << 24, j3 = k[8] & 255 | (k[9] & 255) << 8 | (k[10] & 255) << 16 | (k[11] & 255) << 24, j4 = k[12] & 255 | (k[13] & 255) << 8 | (k[14] & 255) << 16 | (k[15] & 255) << 24, j5 = c[4] & 255 | (c[5] & 255) << 8 | (c[6] & 255) << 16 | (c[7] & 255) << 24, j6 = p[0] & 255 | (p[1] & 255) << 8 | (p[2] & 255) << 16 | (p[3] & 255) << 24, j7 = p[4] & 255 | (p[5] & 255) << 8 | (p[6] & 255) << 16 | (p[7] & 255) << 24, j8 = p[8] & 255 | (p[9] & 255) << 8 | (p[10] & 255) << 16 | (p[11] & 255) << 24, j9 = p[12] & 255 | (p[13] & 255) << 8 | (p[14] & 255) << 16 | (p[15] & 255) << 24, j10 = c[8] & 255 | (c[9] & 255) << 8 | (c[10] & 255) << 16 | (c[11] & 255) << 24, j11 = k[16] & 255 | (k[17] & 255) << 8 | (k[18] & 255) << 16 | (k[19] & 255) << 24, j12 = k[20] & 255 | (k[21] & 255) << 8 | (k[22] & 255) << 16 | (k[23] & 255) << 24, j13 = k[24] & 255 | (k[25] & 255) << 8 | (k[26] & 255) << 16 | (k[27] & 255) << 24, j14 = k[28] & 255 | (k[29] & 255) << 8 | (k[30] & 255) << 16 | (k[31] & 255) << 24, j15 = c[12] & 255 | (c[13] & 255) << 8 | (c[14] & 255) << 16 | (c[15] & 255) << 24;
        let x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15, u2;
        for(let i1 = 0; i1 < 20; i1 += 2){
            u2 = x0 + x12 | 0;
            x4 ^= u2 << 7 | u2 >>> 32 - 7;
            u2 = x4 + x0 | 0;
            x8 ^= u2 << 9 | u2 >>> 32 - 9;
            u2 = x8 + x4 | 0;
            x12 ^= u2 << 13 | u2 >>> 32 - 13;
            u2 = x12 + x8 | 0;
            x0 ^= u2 << 18 | u2 >>> 32 - 18;
            u2 = x5 + x1 | 0;
            x9 ^= u2 << 7 | u2 >>> 32 - 7;
            u2 = x9 + x5 | 0;
            x13 ^= u2 << 9 | u2 >>> 32 - 9;
            u2 = x13 + x9 | 0;
            x1 ^= u2 << 13 | u2 >>> 32 - 13;
            u2 = x1 + x13 | 0;
            x5 ^= u2 << 18 | u2 >>> 32 - 18;
            u2 = x10 + x6 | 0;
            x14 ^= u2 << 7 | u2 >>> 32 - 7;
            u2 = x14 + x10 | 0;
            x2 ^= u2 << 9 | u2 >>> 32 - 9;
            u2 = x2 + x14 | 0;
            x6 ^= u2 << 13 | u2 >>> 32 - 13;
            u2 = x6 + x2 | 0;
            x10 ^= u2 << 18 | u2 >>> 32 - 18;
            u2 = x15 + x11 | 0;
            x3 ^= u2 << 7 | u2 >>> 32 - 7;
            u2 = x3 + x15 | 0;
            x7 ^= u2 << 9 | u2 >>> 32 - 9;
            u2 = x7 + x3 | 0;
            x11 ^= u2 << 13 | u2 >>> 32 - 13;
            u2 = x11 + x7 | 0;
            x15 ^= u2 << 18 | u2 >>> 32 - 18;
            u2 = x0 + x3 | 0;
            x1 ^= u2 << 7 | u2 >>> 32 - 7;
            u2 = x1 + x0 | 0;
            x2 ^= u2 << 9 | u2 >>> 32 - 9;
            u2 = x2 + x1 | 0;
            x3 ^= u2 << 13 | u2 >>> 32 - 13;
            u2 = x3 + x2 | 0;
            x0 ^= u2 << 18 | u2 >>> 32 - 18;
            u2 = x5 + x4 | 0;
            x6 ^= u2 << 7 | u2 >>> 32 - 7;
            u2 = x6 + x5 | 0;
            x7 ^= u2 << 9 | u2 >>> 32 - 9;
            u2 = x7 + x6 | 0;
            x4 ^= u2 << 13 | u2 >>> 32 - 13;
            u2 = x4 + x7 | 0;
            x5 ^= u2 << 18 | u2 >>> 32 - 18;
            u2 = x10 + x9 | 0;
            x11 ^= u2 << 7 | u2 >>> 32 - 7;
            u2 = x11 + x10 | 0;
            x8 ^= u2 << 9 | u2 >>> 32 - 9;
            u2 = x8 + x11 | 0;
            x9 ^= u2 << 13 | u2 >>> 32 - 13;
            u2 = x9 + x8 | 0;
            x10 ^= u2 << 18 | u2 >>> 32 - 18;
            u2 = x15 + x14 | 0;
            x12 ^= u2 << 7 | u2 >>> 32 - 7;
            u2 = x12 + x15 | 0;
            x13 ^= u2 << 9 | u2 >>> 32 - 9;
            u2 = x13 + x12 | 0;
            x14 ^= u2 << 13 | u2 >>> 32 - 13;
            u2 = x14 + x13 | 0;
            x15 ^= u2 << 18 | u2 >>> 32 - 18;
        }
        o[0] = x0 >>> 0 & 255;
        o[1] = x0 >>> 8 & 255;
        o[2] = x0 >>> 16 & 255;
        o[3] = x0 >>> 24 & 255;
        o[4] = x5 >>> 0 & 255;
        o[5] = x5 >>> 8 & 255;
        o[6] = x5 >>> 16 & 255;
        o[7] = x5 >>> 24 & 255;
        o[8] = x10 >>> 0 & 255;
        o[9] = x10 >>> 8 & 255;
        o[10] = x10 >>> 16 & 255;
        o[11] = x10 >>> 24 & 255;
        o[12] = x15 >>> 0 & 255;
        o[13] = x15 >>> 8 & 255;
        o[14] = x15 >>> 16 & 255;
        o[15] = x15 >>> 24 & 255;
        o[16] = x6 >>> 0 & 255;
        o[17] = x6 >>> 8 & 255;
        o[18] = x6 >>> 16 & 255;
        o[19] = x6 >>> 24 & 255;
        o[20] = x7 >>> 0 & 255;
        o[21] = x7 >>> 8 & 255;
        o[22] = x7 >>> 16 & 255;
        o[23] = x7 >>> 24 & 255;
        o[24] = x8 >>> 0 & 255;
        o[25] = x8 >>> 8 & 255;
        o[26] = x8 >>> 16 & 255;
        o[27] = x8 >>> 24 & 255;
        o[28] = x9 >>> 0 & 255;
        o[29] = x9 >>> 8 & 255;
        o[30] = x9 >>> 16 & 255;
        o[31] = x9 >>> 24 & 255;
    }
    const _sigma = ByteArray([
        101,
        120,
        112,
        97,
        110,
        100,
        32,
        51,
        50,
        45,
        98,
        121,
        116,
        101,
        32,
        107
    ]);
    function _stream_salsa20_xor(c, cpos, m, mpos, b, n, k) {
        const z = ByteArray(16), x = ByteArray(64);
        let u2, i1;
        for(i1 = 0; i1 < 16; i1++)z[i1] = 0;
        for(i1 = 0; i1 < 8; i1++)z[i1] = n[i1];
        while(b >= 64){
            _salsa20(x, z, k, _sigma);
            for(i1 = 0; i1 < 64; i1++)c[cpos + i1] = m[mpos + i1] ^ x[i1];
            u2 = 1;
            for(i1 = 8; i1 < 16; i1++){
                u2 = u2 + (z[i1] & 255) | 0;
                z[i1] = u2 & 255;
                u2 >>>= 8;
            }
            b -= 64;
            cpos += 64;
            mpos += 64;
        }
        if (b > 0) {
            _salsa20(x, z, k, _sigma);
            for(i1 = 0; i1 < b; i1++)c[cpos + i1] = m[mpos + i1] ^ x[i1];
        }
        return 0;
    }
    function _stream_salsa20(c, cpos, b, n, k) {
        const z = ByteArray(16), x = ByteArray(64);
        let u2, i1;
        for(i1 = 0; i1 < 16; i1++)z[i1] = 0;
        for(i1 = 0; i1 < 8; i1++)z[i1] = n[i1];
        while(b >= 64){
            _salsa20(x, z, k, _sigma);
            for(i1 = 0; i1 < 64; i1++)c[cpos + i1] = x[i1];
            u2 = 1;
            for(i1 = 8; i1 < 16; i1++){
                u2 = u2 + (z[i1] & 255) | 0;
                z[i1] = u2 & 255;
                u2 >>>= 8;
            }
            b -= 64;
            cpos += 64;
        }
        if (b > 0) {
            _salsa20(x, z, k, _sigma);
            for(i1 = 0; i1 < b; i1++)c[cpos + i1] = x[i1];
        }
        return 0;
    }
    function _stream(c, cpos, d, n, k) {
        const s = ByteArray(32), sn = ByteArray(8);
        _hsalsa20(s, n, k, _sigma);
        for(let i1 = 0; i1 < 8; i1++)sn[i1] = n[i1 + 16];
        return _stream_salsa20(c, cpos, d, sn, s);
    }
    function _stream_xor(c, cpos, m, mpos, d, n, k) {
        const s = ByteArray(32), sn = ByteArray(8);
        _hsalsa20(s, n, k, _sigma);
        for(let i1 = 0; i1 < 8; i1++)sn[i1] = n[i1 + 16];
        return _stream_salsa20_xor(c, cpos, m, mpos, d, sn, s);
    }
    const _salsa201 = _salsa20;
    const _hsalsa201 = _hsalsa20;
    const _sigma1 = _sigma;
    const _stream1 = _stream;
    const _stream_xor1 = _stream_xor;
    const _stream_xor2 = _stream_xor;
    const _stream2 = _stream;
    const ByteArray5 = ByteArray;
    const HalfArray1 = HalfArray;
    function poly1305_init(key) {
        const r = HalfArray(10);
        const pad = HalfArray(8);
        let t0, t1, t2, t3, t4, t5, t6, t7;
        t0 = key[0] & 255 | (key[1] & 255) << 8;
        r[0] = t0 & 8191;
        t1 = key[2] & 255 | (key[3] & 255) << 8;
        r[1] = (t0 >>> 13 | t1 << 3) & 8191;
        t2 = key[4] & 255 | (key[5] & 255) << 8;
        r[2] = (t1 >>> 10 | t2 << 6) & 7939;
        t3 = key[6] & 255 | (key[7] & 255) << 8;
        r[3] = (t2 >>> 7 | t3 << 9) & 8191;
        t4 = key[8] & 255 | (key[9] & 255) << 8;
        r[4] = (t3 >>> 4 | t4 << 12) & 255;
        r[5] = t4 >>> 1 & 8190;
        t5 = key[10] & 255 | (key[11] & 255) << 8;
        r[6] = (t4 >>> 14 | t5 << 2) & 8191;
        t6 = key[12] & 255 | (key[13] & 255) << 8;
        r[7] = (t5 >>> 11 | t6 << 5) & 8065;
        t7 = key[14] & 255 | (key[15] & 255) << 8;
        r[8] = (t6 >>> 8 | t7 << 8) & 8191;
        r[9] = t7 >>> 5 & 127;
        pad[0] = key[16] & 255 | (key[17] & 255) << 8;
        pad[1] = key[18] & 255 | (key[19] & 255) << 8;
        pad[2] = key[20] & 255 | (key[21] & 255) << 8;
        pad[3] = key[22] & 255 | (key[23] & 255) << 8;
        pad[4] = key[24] & 255 | (key[25] & 255) << 8;
        pad[5] = key[26] & 255 | (key[27] & 255) << 8;
        pad[6] = key[28] & 255 | (key[29] & 255) << 8;
        pad[7] = key[30] & 255 | (key[31] & 255) << 8;
        return {
            buffer: ByteArray(16),
            r,
            h: HalfArray(10),
            pad,
            leftover: 0,
            fin: 0
        };
    }
    function poly1305_blocks(self, m, mpos, bytes) {
        const hibit = self.fin ? 0 : 1 << 11;
        let t0, t1, t2, t3, t4, t5, t6, t7, c;
        let d0, d1, d2, d3, d4, d5, d6, d7, d8, d9;
        const { h , r  } = self;
        let h0 = h[0], h1 = h[1], h2 = h[2], h3 = h[3], h4 = h[4], h5 = h[5], h6 = h[6], h7 = h[7], h8 = h[8], h9 = h[9];
        const r0 = r[0], r1 = r[1], r2 = r[2], r3 = r[3], r4 = r[4], r5 = r[5], r6 = r[6], r7 = r[7], r8 = r[8], r9 = r[9];
        while(bytes >= 16){
            t0 = m[mpos + 0] & 255 | (m[mpos + 1] & 255) << 8;
            h0 += t0 & 8191;
            t1 = m[mpos + 2] & 255 | (m[mpos + 3] & 255) << 8;
            h1 += (t0 >>> 13 | t1 << 3) & 8191;
            t2 = m[mpos + 4] & 255 | (m[mpos + 5] & 255) << 8;
            h2 += (t1 >>> 10 | t2 << 6) & 8191;
            t3 = m[mpos + 6] & 255 | (m[mpos + 7] & 255) << 8;
            h3 += (t2 >>> 7 | t3 << 9) & 8191;
            t4 = m[mpos + 8] & 255 | (m[mpos + 9] & 255) << 8;
            h4 += (t3 >>> 4 | t4 << 12) & 8191;
            h5 += t4 >>> 1 & 8191;
            t5 = m[mpos + 10] & 255 | (m[mpos + 11] & 255) << 8;
            h6 += (t4 >>> 14 | t5 << 2) & 8191;
            t6 = m[mpos + 12] & 255 | (m[mpos + 13] & 255) << 8;
            h7 += (t5 >>> 11 | t6 << 5) & 8191;
            t7 = m[mpos + 14] & 255 | (m[mpos + 15] & 255) << 8;
            h8 += (t6 >>> 8 | t7 << 8) & 8191;
            h9 += t7 >>> 5 | hibit;
            c = 0;
            d0 = c;
            d0 += h0 * r0;
            d0 += h1 * (5 * r9);
            d0 += h2 * (5 * r8);
            d0 += h3 * (5 * r7);
            d0 += h4 * (5 * r6);
            c = d0 >>> 13;
            d0 &= 8191;
            d0 += h5 * (5 * r5);
            d0 += h6 * (5 * r4);
            d0 += h7 * (5 * r3);
            d0 += h8 * (5 * r2);
            d0 += h9 * (5 * r1);
            c += d0 >>> 13;
            d0 &= 8191;
            d1 = c;
            d1 += h0 * r1;
            d1 += h1 * r0;
            d1 += h2 * (5 * r9);
            d1 += h3 * (5 * r8);
            d1 += h4 * (5 * r7);
            c = d1 >>> 13;
            d1 &= 8191;
            d1 += h5 * (5 * r6);
            d1 += h6 * (5 * r5);
            d1 += h7 * (5 * r4);
            d1 += h8 * (5 * r3);
            d1 += h9 * (5 * r2);
            c += d1 >>> 13;
            d1 &= 8191;
            d2 = c;
            d2 += h0 * r2;
            d2 += h1 * r1;
            d2 += h2 * r0;
            d2 += h3 * (5 * r9);
            d2 += h4 * (5 * r8);
            c = d2 >>> 13;
            d2 &= 8191;
            d2 += h5 * (5 * r7);
            d2 += h6 * (5 * r6);
            d2 += h7 * (5 * r5);
            d2 += h8 * (5 * r4);
            d2 += h9 * (5 * r3);
            c += d2 >>> 13;
            d2 &= 8191;
            d3 = c;
            d3 += h0 * r3;
            d3 += h1 * r2;
            d3 += h2 * r1;
            d3 += h3 * r0;
            d3 += h4 * (5 * r9);
            c = d3 >>> 13;
            d3 &= 8191;
            d3 += h5 * (5 * r8);
            d3 += h6 * (5 * r7);
            d3 += h7 * (5 * r6);
            d3 += h8 * (5 * r5);
            d3 += h9 * (5 * r4);
            c += d3 >>> 13;
            d3 &= 8191;
            d4 = c;
            d4 += h0 * r4;
            d4 += h1 * r3;
            d4 += h2 * r2;
            d4 += h3 * r1;
            d4 += h4 * r0;
            c = d4 >>> 13;
            d4 &= 8191;
            d4 += h5 * (5 * r9);
            d4 += h6 * (5 * r8);
            d4 += h7 * (5 * r7);
            d4 += h8 * (5 * r6);
            d4 += h9 * (5 * r5);
            c += d4 >>> 13;
            d4 &= 8191;
            d5 = c;
            d5 += h0 * r5;
            d5 += h1 * r4;
            d5 += h2 * r3;
            d5 += h3 * r2;
            d5 += h4 * r1;
            c = d5 >>> 13;
            d5 &= 8191;
            d5 += h5 * r0;
            d5 += h6 * (5 * r9);
            d5 += h7 * (5 * r8);
            d5 += h8 * (5 * r7);
            d5 += h9 * (5 * r6);
            c += d5 >>> 13;
            d5 &= 8191;
            d6 = c;
            d6 += h0 * r6;
            d6 += h1 * r5;
            d6 += h2 * r4;
            d6 += h3 * r3;
            d6 += h4 * r2;
            c = d6 >>> 13;
            d6 &= 8191;
            d6 += h5 * r1;
            d6 += h6 * r0;
            d6 += h7 * (5 * r9);
            d6 += h8 * (5 * r8);
            d6 += h9 * (5 * r7);
            c += d6 >>> 13;
            d6 &= 8191;
            d7 = c;
            d7 += h0 * r7;
            d7 += h1 * r6;
            d7 += h2 * r5;
            d7 += h3 * r4;
            d7 += h4 * r3;
            c = d7 >>> 13;
            d7 &= 8191;
            d7 += h5 * r2;
            d7 += h6 * r1;
            d7 += h7 * r0;
            d7 += h8 * (5 * r9);
            d7 += h9 * (5 * r8);
            c += d7 >>> 13;
            d7 &= 8191;
            d8 = c;
            d8 += h0 * r8;
            d8 += h1 * r7;
            d8 += h2 * r6;
            d8 += h3 * r5;
            d8 += h4 * r4;
            c = d8 >>> 13;
            d8 &= 8191;
            d8 += h5 * r3;
            d8 += h6 * r2;
            d8 += h7 * r1;
            d8 += h8 * r0;
            d8 += h9 * (5 * r9);
            c += d8 >>> 13;
            d8 &= 8191;
            d9 = c;
            d9 += h0 * r9;
            d9 += h1 * r8;
            d9 += h2 * r7;
            d9 += h3 * r6;
            d9 += h4 * r5;
            c = d9 >>> 13;
            d9 &= 8191;
            d9 += h5 * r4;
            d9 += h6 * r3;
            d9 += h7 * r2;
            d9 += h8 * r1;
            d9 += h9 * r0;
            c += d9 >>> 13;
            d9 &= 8191;
            c = (c << 2) + c | 0;
            c = c + d0 | 0;
            d0 = c & 8191;
            c = c >>> 13;
            d1 += c;
            h0 = d0;
            h1 = d1;
            h2 = d2;
            h3 = d3;
            h4 = d4;
            h5 = d5;
            h6 = d6;
            h7 = d7;
            h8 = d8;
            h9 = d9;
            mpos += 16;
            bytes -= 16;
        }
        h[0] = h0;
        h[1] = h1;
        h[2] = h2;
        h[3] = h3;
        h[4] = h4;
        h[5] = h5;
        h[6] = h6;
        h[7] = h7;
        h[8] = h8;
        h[9] = h9;
    }
    function poly1305_finish(self, mac, macpos) {
        const g = HalfArray(10);
        let c, mask, f, i1;
        const { buffer , h , pad , leftover  } = self;
        if (leftover) {
            i1 = leftover;
            buffer[i1++] = 1;
            for(; i1 < 16; i1++)buffer[i1] = 0;
            self.fin = 1;
            poly1305_blocks(self, buffer, 0, 16);
        }
        c = h[1] >>> 13;
        h[1] &= 8191;
        for(i1 = 2; i1 < 10; i1++){
            h[i1] += c;
            c = h[i1] >>> 13;
            h[i1] &= 8191;
        }
        h[0] += c * 5;
        c = h[0] >>> 13;
        h[0] &= 8191;
        h[1] += c;
        c = h[1] >>> 13;
        h[1] &= 8191;
        h[2] += c;
        g[0] = h[0] + 5;
        c = g[0] >>> 13;
        g[0] &= 8191;
        for(i1 = 1; i1 < 10; i1++){
            g[i1] = h[i1] + c;
            c = g[i1] >>> 13;
            g[i1] &= 8191;
        }
        g[9] -= 1 << 13;
        mask = (c ^ 1) - 1;
        for(i1 = 0; i1 < 10; i1++)g[i1] &= mask;
        mask = ~mask;
        for(i1 = 0; i1 < 10; i1++)h[i1] = h[i1] & mask | g[i1];
        h[0] = (h[0] | h[1] << 13) & 65535;
        h[1] = (h[1] >>> 3 | h[2] << 10) & 65535;
        h[2] = (h[2] >>> 6 | h[3] << 7) & 65535;
        h[3] = (h[3] >>> 9 | h[4] << 4) & 65535;
        h[4] = (h[4] >>> 12 | h[5] << 1 | h[6] << 14) & 65535;
        h[5] = (h[6] >>> 2 | h[7] << 11) & 65535;
        h[6] = (h[7] >>> 5 | h[8] << 8) & 65535;
        h[7] = (h[8] >>> 8 | h[9] << 5) & 65535;
        f = h[0] + pad[0];
        h[0] = f & 65535;
        for(i1 = 1; i1 < 8; i1++){
            f = (h[i1] + pad[i1] | 0) + (f >>> 16) | 0;
            h[i1] = f & 65535;
        }
        mac[macpos + 0] = h[0] >>> 0 & 255;
        mac[macpos + 1] = h[0] >>> 8 & 255;
        mac[macpos + 2] = h[1] >>> 0 & 255;
        mac[macpos + 3] = h[1] >>> 8 & 255;
        mac[macpos + 4] = h[2] >>> 0 & 255;
        mac[macpos + 5] = h[2] >>> 8 & 255;
        mac[macpos + 6] = h[3] >>> 0 & 255;
        mac[macpos + 7] = h[3] >>> 8 & 255;
        mac[macpos + 8] = h[4] >>> 0 & 255;
        mac[macpos + 9] = h[4] >>> 8 & 255;
        mac[macpos + 10] = h[5] >>> 0 & 255;
        mac[macpos + 11] = h[5] >>> 8 & 255;
        mac[macpos + 12] = h[6] >>> 0 & 255;
        mac[macpos + 13] = h[6] >>> 8 & 255;
        mac[macpos + 14] = h[7] >>> 0 & 255;
        mac[macpos + 15] = h[7] >>> 8 & 255;
    }
    function poly1305_update(self, m, mpos, bytes) {
        let i1, want;
        const { buffer  } = self;
        if (self.leftover) {
            want = 16 - self.leftover;
            if (want > bytes) want = bytes;
            for(i1 = 0; i1 < want; i1++)buffer[self.leftover + i1] = m[mpos + i1];
            bytes -= want;
            mpos += want;
            self.leftover += want;
            if (self.leftover < 16) return;
            poly1305_blocks(self, buffer, 0, 16);
            self.leftover = 0;
        }
        if (bytes >= 16) {
            want = bytes - bytes % 16;
            poly1305_blocks(self, m, mpos, want);
            mpos += want;
            bytes -= want;
        }
        if (bytes) {
            for(i1 = 0; i1 < bytes; i1++)buffer[self.leftover + i1] = m[mpos + i1];
            self.leftover += bytes;
        }
    }
    const poly1305_init1 = poly1305_init;
    const poly1305_blocks1 = poly1305_blocks;
    const poly1305_finish1 = poly1305_finish;
    const poly1305_update1 = poly1305_update;
    const poly1305_init2 = poly1305_init;
    const poly1305_update2 = poly1305_update;
    const poly1305_finish2 = poly1305_finish;
    var SecretBoxLength;
    (function(SecretBoxLength1) {
        SecretBoxLength1[SecretBoxLength1["Key"] = 32] = "Key";
        SecretBoxLength1[SecretBoxLength1["Nonce"] = 24] = "Nonce";
        SecretBoxLength1[SecretBoxLength1["Overhead"] = 16] = "Overhead";
        SecretBoxLength1[SecretBoxLength1["Zero"] = 32] = "Zero";
    })(SecretBoxLength || (SecretBoxLength = {
    }));
    function _onetimeauth(out, outpos, m, mpos, n, k) {
        const s = poly1305_init(k);
        poly1305_update(s, m, mpos, n);
        poly1305_finish(s, out, outpos);
        return 0;
    }
    function _onetimeauth_verify(h, hpos, m, mpos, n, k) {
        const x = ByteArray(16);
        _onetimeauth(x, 0, m, mpos, n, k);
        return _verify_16(h, hpos, x, 0);
    }
    const SecretBoxLength1 = SecretBoxLength;
    const _onetimeauth1 = _onetimeauth;
    const SecretBoxLength2 = SecretBoxLength;
    function checkLengths(k, n) {
        if (k.length != SecretBoxLength.Key) throw new Error('bad key size');
        if (n.length != SecretBoxLength.Nonce) throw new Error('bad nonce size');
    }
    function checkArrayTypes(...arrays) {
        for (const array of arrays){
            if (!(array instanceof Uint8Array)) {
                throw new TypeError('unexpected type, use ByteArray');
            }
        }
    }
    const checkLengths1 = checkLengths;
    const checkArrayTypes1 = checkArrayTypes;
    const ByteArray6 = ByteArray;
    const _verify_322 = _verify_32;
    const gf3 = gf;
    const S2 = S;
    const M2 = M;
    function set25519(r, a) {
        for(let i1 = 0; i1 < 16; i1++)r[i1] = a[i1] | 0;
    }
    function car25519(o) {
        let i1, v, c = 1;
        for(i1 = 0; i1 < 16; i1++){
            v = o[i1] + c + 65535;
            c = Math.floor(v / 65536);
            o[i1] = v - c * 65536;
        }
        o[0] += c - 1 + 37 * (c - 1);
    }
    function sel25519(p, q, b) {
        let t, c = ~(b - 1);
        for(let i1 = 0; i1 < 16; i1++){
            t = c & (p[i1] ^ q[i1]);
            p[i1] ^= t;
            q[i1] ^= t;
        }
    }
    function pack25519(o, n) {
        const m = gf(), t = gf();
        let i1, j, b;
        for(i1 = 0; i1 < 16; i1++)t[i1] = n[i1];
        car25519(t);
        car25519(t);
        car25519(t);
        for(j = 0; j < 2; j++){
            m[0] = t[0] - 65517;
            for(i1 = 1; i1 < 15; i1++){
                m[i1] = t[i1] - 65535 - (m[i1 - 1] >> 16 & 1);
                m[i1 - 1] &= 65535;
            }
            m[15] = t[15] - 32767 - (m[14] >> 16 & 1);
            b = m[15] >> 16 & 1;
            m[14] &= 65535;
            sel25519(t, m, 1 - b);
        }
        for(i1 = 0; i1 < 16; i1++){
            o[2 * i1] = t[i1] & 255;
            o[2 * i1 + 1] = t[i1] >> 8;
        }
    }
    function neq25519(a, b) {
        const c = ByteArray(32), d = ByteArray(32);
        pack25519(c, a);
        pack25519(d, b);
        return _verify_32(c, 0, d, 0);
    }
    function par25519(a) {
        const d = ByteArray(32);
        pack25519(d, a);
        return d[0] & 1;
    }
    function unpack25519(o, n) {
        for(let i1 = 0; i1 < 16; i1++)o[i1] = n[2 * i1] + (n[2 * i1 + 1] << 8);
        o[15] &= 32767;
    }
    function inv25519(o, i1) {
        const c = gf();
        let a;
        for(a = 0; a < 16; a++)c[a] = i1[a];
        for(a = 253; a >= 0; a--){
            S(c, c);
            if (a !== 2 && a !== 4) M(c, c, i1);
        }
        for(a = 0; a < 16; a++)o[a] = c[a];
    }
    const set255191 = set25519;
    const sel255191 = sel25519;
    const pack255191 = pack25519;
    const neq255191 = neq25519;
    const par255191 = par25519;
    const unpack255191 = unpack25519;
    const inv255191 = inv25519;
    const _hsalsa202 = _hsalsa20;
    const _sigma2 = _sigma;
    const SecretBoxLength3 = SecretBoxLength;
    const checkArrayTypes2 = checkArrayTypes;
    (function(BoxLength1) {
        BoxLength1[BoxLength1["PublicKey"] = 32] = "PublicKey";
        BoxLength1[BoxLength1["SecretKey"] = 32] = "SecretKey";
        BoxLength1[BoxLength1["SharedKey"] = 32] = "SharedKey";
        BoxLength1[BoxLength1["Nonce"] = SecretBoxLength.Nonce] = "Nonce";
        BoxLength1[BoxLength1["Overhead"] = SecretBoxLength.Overhead] = "Overhead";
    })(BoxLength || (BoxLength = {
    }));
    const BoxLength1 = BoxLength;
    const checkArrayTypes3 = checkArrayTypes;
    function verify(x, y) {
        checkArrayTypes(x, y);
        return x.length > 0 && y.length > 0 && x.length == y.length && vn(x, 0, y, 0, x.length) == 0;
    }
    const verify1 = verify;
    const sel255192 = sel25519;
    const inv255192 = inv25519;
    const pack255192 = pack25519;
    const unpack255192 = unpack25519;
    const checkArrayTypes4 = checkArrayTypes;
    function _scalarMult(q, n, p) {
        const z = ByteArray(32);
        const x = NumArray(80);
        const a = gf();
        const b = gf();
        const c = gf();
        const d = gf();
        const e = gf();
        const f = gf();
        let r, i1;
        for(i1 = 0; i1 < 31; i1++)z[i1] = n[i1];
        z[31] = n[31] & 127 | 64;
        z[0] &= 248;
        unpack25519(x, p);
        for(i1 = 0; i1 < 16; i1++){
            b[i1] = x[i1];
            d[i1] = a[i1] = c[i1] = 0;
        }
        a[0] = d[0] = 1;
        for(i1 = 254; i1 >= 0; --i1){
            r = z[i1 >>> 3] >>> (i1 & 7) & 1;
            sel25519(a, b, r);
            sel25519(c, d, r);
            A(e, a, c);
            Z(a, a, c);
            A(c, b, d);
            Z(b, b, d);
            S(d, e);
            S(f, a);
            M(a, c, a);
            M(c, b, e);
            A(e, a, c);
            Z(a, a, c);
            S(b, a);
            Z(c, d, f);
            M(a, c, _121665);
            A(a, a, d);
            M(c, c, a);
            M(a, d, f);
            M(d, b, x);
            S(b, e);
            sel25519(a, b, r);
            sel25519(c, d, r);
        }
        for(i1 = 0; i1 < 16; i1++){
            x[i1 + 16] = a[i1];
            x[i1 + 32] = c[i1];
            x[i1 + 48] = b[i1];
            x[i1 + 64] = d[i1];
        }
        const x32 = x.subarray(32);
        const x16 = x.subarray(16);
        inv25519(x32, x32);
        M(x16, x16, x32);
        pack25519(q, x16);
        return 0;
    }
    function _scalarMult_base(q, n) {
        return _scalarMult(q, n, _9);
    }
    const _scalarMult1 = _scalarMult;
    const _scalarMult_base1 = _scalarMult_base;
    const checkArrayTypes5 = checkArrayTypes;
    const checkLengths2 = checkLengths;
    function _secretbox(c, m, d, n, k) {
        if (d < 32) return -1;
        _stream_xor(c, 0, m, 0, d, n, k);
        _onetimeauth(c, 16, c, 32, d - 32, c);
        for(let i1 = 0; i1 < 16; i1++)c[i1] = 0;
        return 0;
    }
    function _secretbox_open(m, c, d, n, k) {
        const x = ByteArray(32);
        if (d < 32) return -1;
        _stream(x, 0, 32, n, k);
        if (_onetimeauth_verify(c, 16, c, 32, d - 32, x) !== 0) return -1;
        _stream_xor(m, 0, c, 0, d, n, k);
        for(let i1 = 0; i1 < 32; i1++)m[i1] = 0;
        return 0;
    }
    const BoxLength2 = BoxLength;
    function checkBoxLengths(pk, sk) {
        if (pk.length != BoxLength.PublicKey) throw new Error('bad public key size');
        if (sk.length != BoxLength.SecretKey) throw new Error('bad secret key size');
    }
    const checkBoxLengths1 = checkBoxLengths;
    const _scalarMult2 = _scalarMult;
    const _scalarMult_base2 = _scalarMult_base;
    const checkBoxLengths2 = checkBoxLengths;
    function box_keyPair_fromSecretKey(secretKey) {
        checkArrayTypes(secretKey);
        if (secretKey.length !== BoxLength.SecretKey) throw new Error(`bad secret key size (${secretKey.length}), should be ${BoxLength.SecretKey}`);
        const pk = ByteArray(BoxLength.PublicKey);
        _scalarMult_base(pk, secretKey);
        return {
            publicKey: pk,
            secretKey: ByteArray(secretKey)
        };
    }
    function _box_keypair(y, x) {
        x.set(randomBytes(32));
        return _scalarMult_base(y, x);
    }
    function _box_beforenm(k, y, x) {
        const s = ByteArray(32);
        _scalarMult(s, x, y);
        return _hsalsa20(k, _0, s, _sigma);
    }
    const box_keyPair_fromSecretKey1 = box_keyPair_fromSecretKey;
    function scalarMult(n, p) {
        checkArrayTypes(n, p);
        if (n.length !== ScalarLength.Scalar) throw new Error('bad n size');
        if (p.length !== ScalarLength.GroupElement) throw new Error('bad p size');
        const q = ByteArray(ScalarLength.GroupElement);
        _scalarMult(q, n, p);
        return q;
    }
    function scalarMult_base(n) {
        checkArrayTypes(n);
        if (n.length !== ScalarLength.Scalar) throw new Error('bad n size');
        const q = ByteArray(ScalarLength.GroupElement);
        _scalarMult_base(q, n);
        return q;
    }
    const scalarMult1 = scalarMult;
    const scalarMult_base1 = scalarMult_base;
    function secretbox(msg, nonce1, key) {
        checkArrayTypes(msg, nonce1, key);
        checkLengths(key, nonce1);
        const m = ByteArray(SecretBoxLength.Zero + msg.length);
        const c = ByteArray(m.length);
        for(let i1 = 0; i1 < msg.length; i1++)m[i1 + SecretBoxLength.Zero] = msg[i1];
        _secretbox(c, m, m.length, nonce1, key);
        return c.subarray(SecretBoxLength.Overhead);
    }
    function secretbox_open(box, nonce1, key) {
        checkArrayTypes(box, nonce1, key);
        checkLengths(key, nonce1);
        const c = ByteArray(SecretBoxLength.Overhead + box.length);
        const m = ByteArray(c.length);
        for(let i1 = 0; i1 < box.length; i1++)c[i1 + SecretBoxLength.Overhead] = box[i1];
        if (c.length < SecretBoxLength.Zero || _secretbox_open(m, c, c.length, nonce1, key) !== 0) return;
        return m.subarray(SecretBoxLength.Zero);
    }
    const secretbox1 = secretbox;
    const secretbox_open1 = secretbox_open;
    const secretbox2 = secretbox;
    const secretbox_open2 = secretbox_open;
    function box_before(publicKey, secretKey) {
        checkArrayTypes(publicKey, secretKey);
        checkBoxLengths(publicKey, secretKey);
        const k = ByteArray(BoxLength.SharedKey);
        _box_beforenm(k, publicKey, secretKey);
        return k;
    }
    const box_after = secretbox;
    function box_open(msg, nonce1, publicKey, secretKey) {
        const k = box_before(publicKey, secretKey);
        return secretbox_open(msg, nonce1, k);
    }
    const box_open_after = secretbox_open;
    function box_keyPair() {
        const pk = ByteArray(BoxLength.PublicKey);
        const sk = ByteArray(BoxLength.SecretKey);
        _box_keypair(pk, sk);
        return {
            publicKey: pk,
            secretKey: sk
        };
    }
    const box_before1 = box_before;
    const box_after1 = secretbox;
    const box_open1 = box_open;
    const box_open_after1 = secretbox_open;
    const box_keyPair1 = box_keyPair;
    function box(msg, nonce1, publicKey, secretKey) {
        const k = box_before(publicKey, secretKey);
        return secretbox(msg, nonce1, k);
    }
    const box1 = box;
    const ByteArray7 = ByteArray;
    const NumArray2 = NumArray;
    const _verify_323 = _verify_32;
    const gf4 = gf;
    const gf01 = gf0;
    const gf11 = gf1;
    const D21 = D2;
    const A2 = A;
    const D1 = D;
    const S3 = S;
    const M3 = M;
    const X1 = X;
    const Y1 = Y;
    const Z2 = Z;
    const I1 = I;
    const randomBytes2 = randomBytes;
    const set255192 = set25519;
    const sel255193 = sel25519;
    const inv255193 = inv25519;
    const pack255193 = pack25519;
    const unpack255193 = unpack25519;
    const par255192 = par25519;
    const neq255192 = neq25519;
    const ByteArray8 = ByteArray;
    const IntArray1 = IntArray;
    const checkArrayTypes6 = checkArrayTypes;
    var HashLength;
    const HashLength1 = HashLength;
    (function(HashLength2) {
        HashLength2[HashLength2["Hash"] = 64] = "Hash";
    })(HashLength || (HashLength = {
    }));
    function hash(msg, len) {
        checkArrayTypes(msg);
        const h = ByteArray(len || HashLength.Hash);
        _hash(h, msg, msg.length);
        return h;
    }
    const hash1 = hash;
    function _hash(out, m, n) {
        const hh = IntArray(8), hl = IntArray(8), x = ByteArray(256);
        let i1, b = n;
        hh[0] = 1779033703;
        hh[1] = 3144134277;
        hh[2] = 1013904242;
        hh[3] = 2773480762;
        hh[4] = 1359893119;
        hh[5] = 2600822924;
        hh[6] = 528734635;
        hh[7] = 1541459225;
        hl[0] = 4089235720;
        hl[1] = 2227873595;
        hl[2] = 4271175723;
        hl[3] = 1595750129;
        hl[4] = 2917565137;
        hl[5] = 725511199;
        hl[6] = 4215389547;
        hl[7] = 327033209;
        _hashblocks_hl(hh, hl, m, n);
        n %= 128;
        for(i1 = 0; i1 < n; i1++)x[i1] = m[b - n + i1];
        x[n] = 128;
        n = 256 - 128 * (n < 112 ? 1 : 0);
        x[n - 9] = 0;
        _ts64(x, n - 8, b / 536870912 | 0, b << 3);
        _hashblocks_hl(hh, hl, x, n);
        for(i1 = 0; i1 < 8; i1++)_ts64(out, 8 * i1, hh[i1], hl[i1]);
        return 0;
    }
    const _hash1 = _hash;
    const _K = [
        1116352408,
        3609767458,
        1899447441,
        602891725,
        3049323471,
        3964484399,
        3921009573,
        2173295548,
        961987163,
        4081628472,
        1508970993,
        3053834265,
        2453635748,
        2937671579,
        2870763221,
        3664609560,
        3624381080,
        2734883394,
        310598401,
        1164996542,
        607225278,
        1323610764,
        1426881987,
        3590304994,
        1925078388,
        4068182383,
        2162078206,
        991336113,
        2614888103,
        633803317,
        3248222580,
        3479774868,
        3835390401,
        2666613458,
        4022224774,
        944711139,
        264347078,
        2341262773,
        604807628,
        2007800933,
        770255983,
        1495990901,
        1249150122,
        1856431235,
        1555081692,
        3175218132,
        1996064986,
        2198950837,
        2554220882,
        3999719339,
        2821834349,
        766784016,
        2952996808,
        2566594879,
        3210313671,
        3203337956,
        3336571891,
        1034457026,
        3584528711,
        2466948901,
        113926993,
        3758326383,
        338241895,
        168717936,
        666307205,
        1188179964,
        773529912,
        1546045734,
        1294757372,
        1522805485,
        1396182291,
        2643833823,
        1695183700,
        2343527390,
        1986661051,
        1014477480,
        2177026350,
        1206759142,
        2456956037,
        344077627,
        2730485921,
        1290863460,
        2820302411,
        3158454273,
        3259730800,
        3505952657,
        3345764771,
        106217008,
        3516065817,
        3606008344,
        3600352804,
        1432725776,
        4094571909,
        1467031594,
        275423344,
        851169720,
        430227734,
        3100823752,
        506948616,
        1363258195,
        659060556,
        3750685593,
        883997877,
        3785050280,
        958139571,
        3318307427,
        1322822218,
        3812723403,
        1537002063,
        2003034995,
        1747873779,
        3602036899,
        1955562222,
        1575990012,
        2024104815,
        1125592928,
        2227730452,
        2716904306,
        2361852424,
        442776044,
        2428436474,
        593698344,
        2756734187,
        3733110249,
        3204031479,
        2999351573,
        3329325298,
        3815920427,
        3391569614,
        3928383900,
        3515267271,
        566280711,
        3940187606,
        3454069534,
        4118630271,
        4000239992,
        116418474,
        1914138554,
        174292421,
        2731055270,
        289380356,
        3203993006,
        460393269,
        320620315,
        685471733,
        587496836,
        852142971,
        1086792851,
        1017036298,
        365543100,
        1126000580,
        2618297676,
        1288033470,
        3409855158,
        1501505948,
        4234509866,
        1607167915,
        987167468,
        1816402316,
        1246189591
    ];
    function _hashblocks_hl(hh, hl, m, n) {
        const wh = IntArray(16), wl = IntArray(16);
        let bh0, bh1, bh2, bh3, bh4, bh5, bh6, bh7, bl0, bl1, bl2, bl3, bl4, bl5, bl6, bl7, th, tl, i1, j, h, l1, a, b, c, d;
        let ah0 = hh[0], ah1 = hh[1], ah2 = hh[2], ah3 = hh[3], ah4 = hh[4], ah5 = hh[5], ah6 = hh[6], ah7 = hh[7], al0 = hl[0], al1 = hl[1], al2 = hl[2], al3 = hl[3], al4 = hl[4], al5 = hl[5], al6 = hl[6], al7 = hl[7];
        let pos = 0;
        while(n >= 128){
            for(i1 = 0; i1 < 16; i1++){
                j = 8 * i1 + pos;
                wh[i1] = m[j + 0] << 24 | m[j + 1] << 16 | m[j + 2] << 8 | m[j + 3];
                wl[i1] = m[j + 4] << 24 | m[j + 5] << 16 | m[j + 6] << 8 | m[j + 7];
            }
            for(i1 = 0; i1 < 80; i1++){
                bh0 = ah0;
                bh1 = ah1;
                bh2 = ah2;
                bh3 = ah3;
                bh4 = ah4;
                bh5 = ah5;
                bh6 = ah6;
                bh7 = ah7;
                bl0 = al0;
                bl1 = al1;
                bl2 = al2;
                bl3 = al3;
                bl4 = al4;
                bl5 = al5;
                bl6 = al6;
                bl7 = al7;
                h = ah7;
                l1 = al7;
                a = l1 & 65535;
                b = l1 >>> 16;
                c = h & 65535;
                d = h >>> 16;
                h = (ah4 >>> 14 | al4 << 32 - 14) ^ (ah4 >>> 18 | al4 << 32 - 18) ^ (al4 >>> 41 - 32 | ah4 << 32 - (41 - 32));
                l1 = (al4 >>> 14 | ah4 << 32 - 14) ^ (al4 >>> 18 | ah4 << 32 - 18) ^ (ah4 >>> 41 - 32 | al4 << 32 - (41 - 32));
                a += l1 & 65535;
                b += l1 >>> 16;
                c += h & 65535;
                d += h >>> 16;
                h = ah4 & ah5 ^ ~ah4 & ah6;
                l1 = al4 & al5 ^ ~al4 & al6;
                a += l1 & 65535;
                b += l1 >>> 16;
                c += h & 65535;
                d += h >>> 16;
                h = _K[i1 * 2];
                l1 = _K[i1 * 2 + 1];
                a += l1 & 65535;
                b += l1 >>> 16;
                c += h & 65535;
                d += h >>> 16;
                h = wh[i1 % 16];
                l1 = wl[i1 % 16];
                a += l1 & 65535;
                b += l1 >>> 16;
                c += h & 65535;
                d += h >>> 16;
                b += a >>> 16;
                c += b >>> 16;
                d += c >>> 16;
                th = c & 65535 | d << 16;
                tl = a & 65535 | b << 16;
                h = th;
                l1 = tl;
                a = l1 & 65535;
                b = l1 >>> 16;
                c = h & 65535;
                d = h >>> 16;
                h = (ah0 >>> 28 | al0 << 32 - 28) ^ (al0 >>> 34 - 32 | ah0 << 32 - (34 - 32)) ^ (al0 >>> 39 - 32 | ah0 << 32 - (39 - 32));
                l1 = (al0 >>> 28 | ah0 << 32 - 28) ^ (ah0 >>> 34 - 32 | al0 << 32 - (34 - 32)) ^ (ah0 >>> 39 - 32 | al0 << 32 - (39 - 32));
                a += l1 & 65535;
                b += l1 >>> 16;
                c += h & 65535;
                d += h >>> 16;
                h = ah0 & ah1 ^ ah0 & ah2 ^ ah1 & ah2;
                l1 = al0 & al1 ^ al0 & al2 ^ al1 & al2;
                a += l1 & 65535;
                b += l1 >>> 16;
                c += h & 65535;
                d += h >>> 16;
                b += a >>> 16;
                c += b >>> 16;
                d += c >>> 16;
                bh7 = c & 65535 | d << 16;
                bl7 = a & 65535 | b << 16;
                h = bh3;
                l1 = bl3;
                a = l1 & 65535;
                b = l1 >>> 16;
                c = h & 65535;
                d = h >>> 16;
                h = th;
                l1 = tl;
                a += l1 & 65535;
                b += l1 >>> 16;
                c += h & 65535;
                d += h >>> 16;
                b += a >>> 16;
                c += b >>> 16;
                d += c >>> 16;
                bh3 = c & 65535 | d << 16;
                bl3 = a & 65535 | b << 16;
                ah1 = bh0;
                ah2 = bh1;
                ah3 = bh2;
                ah4 = bh3;
                ah5 = bh4;
                ah6 = bh5;
                ah7 = bh6;
                ah0 = bh7;
                al1 = bl0;
                al2 = bl1;
                al3 = bl2;
                al4 = bl3;
                al5 = bl4;
                al6 = bl5;
                al7 = bl6;
                al0 = bl7;
                if (i1 % 16 === 15) {
                    for(j = 0; j < 16; j++){
                        h = wh[j];
                        l1 = wl[j];
                        a = l1 & 65535;
                        b = l1 >>> 16;
                        c = h & 65535;
                        d = h >>> 16;
                        h = wh[(j + 9) % 16];
                        l1 = wl[(j + 9) % 16];
                        a += l1 & 65535;
                        b += l1 >>> 16;
                        c += h & 65535;
                        d += h >>> 16;
                        th = wh[(j + 1) % 16];
                        tl = wl[(j + 1) % 16];
                        h = (th >>> 1 | tl << 32 - 1) ^ (th >>> 8 | tl << 32 - 8) ^ th >>> 7;
                        l1 = (tl >>> 1 | th << 32 - 1) ^ (tl >>> 8 | th << 32 - 8) ^ (tl >>> 7 | th << 32 - 7);
                        a += l1 & 65535;
                        b += l1 >>> 16;
                        c += h & 65535;
                        d += h >>> 16;
                        th = wh[(j + 14) % 16];
                        tl = wl[(j + 14) % 16];
                        h = (th >>> 19 | tl << 32 - 19) ^ (tl >>> 61 - 32 | th << 32 - (61 - 32)) ^ th >>> 6;
                        l1 = (tl >>> 19 | th << 32 - 19) ^ (th >>> 61 - 32 | tl << 32 - (61 - 32)) ^ (tl >>> 6 | th << 32 - 6);
                        a += l1 & 65535;
                        b += l1 >>> 16;
                        c += h & 65535;
                        d += h >>> 16;
                        b += a >>> 16;
                        c += b >>> 16;
                        d += c >>> 16;
                        wh[j] = c & 65535 | d << 16;
                        wl[j] = a & 65535 | b << 16;
                    }
                }
            }
            h = ah0;
            l1 = al0;
            a = l1 & 65535;
            b = l1 >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = hh[0];
            l1 = hl[0];
            a += l1 & 65535;
            b += l1 >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[0] = ah0 = c & 65535 | d << 16;
            hl[0] = al0 = a & 65535 | b << 16;
            h = ah1;
            l1 = al1;
            a = l1 & 65535;
            b = l1 >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = hh[1];
            l1 = hl[1];
            a += l1 & 65535;
            b += l1 >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[1] = ah1 = c & 65535 | d << 16;
            hl[1] = al1 = a & 65535 | b << 16;
            h = ah2;
            l1 = al2;
            a = l1 & 65535;
            b = l1 >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = hh[2];
            l1 = hl[2];
            a += l1 & 65535;
            b += l1 >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[2] = ah2 = c & 65535 | d << 16;
            hl[2] = al2 = a & 65535 | b << 16;
            h = ah3;
            l1 = al3;
            a = l1 & 65535;
            b = l1 >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = hh[3];
            l1 = hl[3];
            a += l1 & 65535;
            b += l1 >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[3] = ah3 = c & 65535 | d << 16;
            hl[3] = al3 = a & 65535 | b << 16;
            h = ah4;
            l1 = al4;
            a = l1 & 65535;
            b = l1 >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = hh[4];
            l1 = hl[4];
            a += l1 & 65535;
            b += l1 >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[4] = ah4 = c & 65535 | d << 16;
            hl[4] = al4 = a & 65535 | b << 16;
            h = ah5;
            l1 = al5;
            a = l1 & 65535;
            b = l1 >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = hh[5];
            l1 = hl[5];
            a += l1 & 65535;
            b += l1 >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[5] = ah5 = c & 65535 | d << 16;
            hl[5] = al5 = a & 65535 | b << 16;
            h = ah6;
            l1 = al6;
            a = l1 & 65535;
            b = l1 >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = hh[6];
            l1 = hl[6];
            a += l1 & 65535;
            b += l1 >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[6] = ah6 = c & 65535 | d << 16;
            hl[6] = al6 = a & 65535 | b << 16;
            h = ah7;
            l1 = al7;
            a = l1 & 65535;
            b = l1 >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = hh[7];
            l1 = hl[7];
            a += l1 & 65535;
            b += l1 >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            hh[7] = ah7 = c & 65535 | d << 16;
            hl[7] = al7 = a & 65535 | b << 16;
            pos += 128;
            n -= 128;
        }
        return n;
    }
    function _ts64(x, i1, h, l1) {
        x[i1] = h >> 24 & 255;
        x[i1 + 1] = h >> 16 & 255;
        x[i1 + 2] = h >> 8 & 255;
        x[i1 + 3] = h & 255;
        x[i1 + 4] = l1 >> 24 & 255;
        x[i1 + 5] = l1 >> 16 & 255;
        x[i1 + 6] = l1 >> 8 & 255;
        x[i1 + 7] = l1 & 255;
    }
    const _hash2 = _hash;
    const checkArrayTypes7 = checkArrayTypes;
    var SignLength;
    const SignLength1 = SignLength;
    (function(SignLength2) {
        SignLength2[SignLength2["PublicKey"] = 32] = "PublicKey";
        SignLength2[SignLength2["SecretKey"] = 64] = "SecretKey";
        SignLength2[SignLength2["Seed"] = 32] = "Seed";
        SignLength2[SignLength2["Signature"] = 64] = "Signature";
    })(SignLength || (SignLength = {
    }));
    function sign(msg, secretKey) {
        checkArrayTypes(msg, secretKey);
        if (secretKey.length !== SignLength.SecretKey) throw new Error('bad secret key size');
        const signedMsg = ByteArray(SignLength.Signature + msg.length);
        _sign(signedMsg, msg, msg.length, secretKey);
        return signedMsg;
    }
    const sign1 = sign;
    function sign_open(signedMsg, publicKey) {
        checkArrayTypes(signedMsg, publicKey);
        if (publicKey.length !== SignLength.PublicKey) throw new Error('bad public key size');
        const tmp = ByteArray(signedMsg.length);
        const mlen = _sign_open(tmp, signedMsg, signedMsg.length, publicKey);
        if (mlen < 0) return;
        const m = ByteArray(mlen);
        for(let i1 = 0; i1 < m.length; i1++)m[i1] = tmp[i1];
        return m;
    }
    const sign_open1 = sign_open;
    function sign_detached(msg, secretKey) {
        const signedMsg = sign(msg, secretKey);
        const sig = ByteArray(SignLength.Signature);
        for(let i1 = 0; i1 < sig.length; i1++)sig[i1] = signedMsg[i1];
        return sig;
    }
    const sign_detached1 = sign_detached;
    function sign_detached_verify(msg, sig, publicKey) {
        checkArrayTypes(msg, sig, publicKey);
        if (sig.length !== SignLength.Signature) throw new Error('bad signature size');
        if (publicKey.length !== SignLength.PublicKey) throw new Error('bad public key size');
        const sm = ByteArray(SignLength.Signature + msg.length);
        const m = ByteArray(SignLength.Signature + msg.length);
        let i1;
        for(i1 = 0; i1 < SignLength.Signature; i1++)sm[i1] = sig[i1];
        for(i1 = 0; i1 < msg.length; i1++)sm[i1 + SignLength.Signature] = msg[i1];
        return _sign_open(m, sm, sm.length, publicKey) >= 0;
    }
    const sign_detached_verify1 = sign_detached_verify;
    function sign_keyPair() {
        const pk = ByteArray(SignLength.PublicKey);
        const sk = ByteArray(SignLength.SecretKey);
        _sign_keypair(pk, sk, false);
        return {
            publicKey: pk,
            secretKey: sk
        };
    }
    const sign_keyPair1 = sign_keyPair;
    function sign_keyPair_fromSecretKey(secretKey) {
        checkArrayTypes(secretKey);
        if (secretKey.length !== SignLength.SecretKey) throw new Error('bad secret key size');
        const pk = ByteArray(SignLength.PublicKey);
        for(let i1 = 0; i1 < pk.length; i1++)pk[i1] = secretKey[32 + i1];
        return {
            publicKey: pk,
            secretKey: ByteArray(secretKey)
        };
    }
    const sign_keyPair_fromSecretKey1 = sign_keyPair_fromSecretKey;
    function sign_keyPair_fromSeed(seed) {
        checkArrayTypes(seed);
        if (seed.length !== SignLength.Seed) throw new Error('bad seed size');
        const pk = ByteArray(SignLength.PublicKey);
        const sk = ByteArray(SignLength.SecretKey);
        for(let i1 = 0; i1 < 32; i1++)sk[i1] = seed[i1];
        _sign_keypair(pk, sk, true);
        return {
            publicKey: pk,
            secretKey: sk
        };
    }
    const sign_keyPair_fromSeed1 = sign_keyPair_fromSeed;
    function _sign_keypair(pk, sk, seeded) {
        const d = ByteArray(64);
        const p = [
            gf(),
            gf(),
            gf(),
            gf()
        ];
        let i1;
        if (!seeded) sk.set(randomBytes(32));
        _hash(d, sk, 32);
        d[0] &= 248;
        d[31] &= 127;
        d[31] |= 64;
        scalarbase(p, d);
        pack(pk, p);
        for(i1 = 0; i1 < 32; i1++)sk[i1 + 32] = pk[i1];
        return 0;
    }
    function _sign(sm, m, n, sk) {
        const d = ByteArray(64), h = ByteArray(64), r = ByteArray(64);
        const x = NumArray(64);
        const p = [
            gf(),
            gf(),
            gf(),
            gf()
        ];
        let i1, j;
        _hash(d, sk, 32);
        d[0] &= 248;
        d[31] &= 127;
        d[31] |= 64;
        const smlen = n + 64;
        for(i1 = 0; i1 < n; i1++)sm[64 + i1] = m[i1];
        for(i1 = 0; i1 < 32; i1++)sm[32 + i1] = d[32 + i1];
        _hash(r, sm.subarray(32), n + 32);
        reduce(r);
        scalarbase(p, r);
        pack(sm, p);
        for(i1 = 32; i1 < 64; i1++)sm[i1] = sk[i1];
        _hash(h, sm, n + 64);
        reduce(h);
        for(i1 = 0; i1 < 64; i1++)x[i1] = 0;
        for(i1 = 0; i1 < 32; i1++)x[i1] = r[i1];
        for(i1 = 0; i1 < 32; i1++){
            for(j = 0; j < 32; j++){
                x[i1 + j] += h[i1] * d[j];
            }
        }
        modL(sm.subarray(32), x);
        return smlen;
    }
    function _sign_open(m, sm, n, pk) {
        const t = ByteArray(32), h = ByteArray(64);
        const p = [
            gf(),
            gf(),
            gf(),
            gf()
        ], q = [
            gf(),
            gf(),
            gf(),
            gf()
        ];
        let i1, mlen;
        mlen = -1;
        if (n < 64 || unpackneg(q, pk)) return -1;
        for(i1 = 0; i1 < n; i1++)m[i1] = sm[i1];
        for(i1 = 0; i1 < 32; i1++)m[i1 + 32] = pk[i1];
        _hash(h, m, n);
        reduce(h);
        scalarmult(p, q, h);
        scalarbase(q, sm.subarray(32));
        add(p, q);
        pack(t, p);
        n -= 64;
        if (_verify_32(sm, 0, t, 0)) {
            for(i1 = 0; i1 < n; i1++)m[i1] = 0;
            return -1;
        }
        for(i1 = 0; i1 < n; i1++)m[i1] = sm[i1 + 64];
        mlen = n;
        return mlen;
    }
    function scalarbase(p, s) {
        const q = [
            gf(),
            gf(),
            gf(),
            gf()
        ];
        set25519(q[0], X);
        set25519(q[1], Y);
        set25519(q[2], gf1);
        M(q[3], X, Y);
        scalarmult(p, q, s);
    }
    const scalarbase1 = scalarbase;
    function scalarmult(p, q, s) {
        let b, i1;
        set25519(p[0], gf0);
        set25519(p[1], gf1);
        set25519(p[2], gf1);
        set25519(p[3], gf0);
        for(i1 = 255; i1 >= 0; --i1){
            b = s[i1 / 8 | 0] >> (i1 & 7) & 1;
            cswap(p, q, b);
            add(q, p);
            add(p, p);
            cswap(p, q, b);
        }
    }
    const scalarmult1 = scalarmult;
    function pack(r, p) {
        const tx = gf(), ty = gf(), zi = gf();
        inv25519(zi, p[2]);
        M(tx, p[0], zi);
        M(ty, p[1], zi);
        pack25519(r, ty);
        r[31] ^= par25519(tx) << 7;
    }
    function unpackneg(r, p) {
        const t = gf(), chk = gf(), num = gf(), den = gf(), den2 = gf(), den4 = gf(), den6 = gf();
        set25519(r[2], gf1);
        unpack25519(r[1], p);
        S(num, r[1]);
        M(den, num, D);
        Z(num, num, r[2]);
        A(den, r[2], den);
        S(den2, den);
        S(den4, den2);
        M(den6, den4, den2);
        M(t, den6, num);
        M(t, t, den);
        pow2523(t, t);
        M(t, t, num);
        M(t, t, den);
        M(t, t, den);
        M(r[0], t, den);
        S(chk, r[0]);
        M(chk, chk, den);
        if (neq25519(chk, num)) M(r[0], r[0], I);
        S(chk, r[0]);
        M(chk, chk, den);
        if (neq25519(chk, num)) return -1;
        if (par25519(r[0]) === p[31] >> 7) Z(r[0], gf0, r[0]);
        M(r[3], r[0], r[1]);
        return 0;
    }
    function reduce(r) {
        const x = NumArray(64);
        let i1;
        for(i1 = 0; i1 < 64; i1++)x[i1] = r[i1];
        for(i1 = 0; i1 < 64; i1++)r[i1] = 0;
        modL(r, x);
    }
    const L = NumArray([
        237,
        211,
        245,
        92,
        26,
        99,
        18,
        88,
        214,
        156,
        247,
        162,
        222,
        249,
        222,
        20,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        16
    ]);
    function modL(r, x) {
        let carry, i1, j, k;
        for(i1 = 63; i1 >= 32; --i1){
            carry = 0;
            for(j = i1 - 32, k = i1 - 12; j < k; ++j){
                x[j] += carry - 16 * x[i1] * L[j - (i1 - 32)];
                carry = x[j] + 128 >> 8;
                x[j] -= carry * 256;
            }
            x[j] += carry;
            x[i1] = 0;
        }
        carry = 0;
        for(j = 0; j < 32; j++){
            x[j] += carry - (x[31] >> 4) * L[j];
            carry = x[j] >> 8;
            x[j] &= 255;
        }
        for(j = 0; j < 32; j++)x[j] -= carry * L[j];
        for(i1 = 0; i1 < 32; i1++){
            x[i1 + 1] += x[i1] >> 8;
            r[i1] = x[i1] & 255;
        }
    }
    function add(p, q) {
        const a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf(), g = gf(), h = gf(), t = gf();
        Z(a, p[1], p[0]);
        Z(t, q[1], q[0]);
        M(a, a, t);
        A(b, p[0], p[1]);
        A(t, q[0], q[1]);
        M(b, b, t);
        M(c, p[3], q[3]);
        M(c, c, D2);
        M(d, p[2], q[2]);
        A(d, d, d);
        Z(e, b, a);
        Z(f, d, c);
        A(g, d, c);
        A(h, b, a);
        M(p[0], e, f);
        M(p[1], h, g);
        M(p[2], g, f);
        M(p[3], e, h);
    }
    function cswap(p, q, b) {
        for(let i1 = 0; i1 < 4; i1++){
            sel25519(p[i1], q[i1], b);
        }
    }
    function pow2523(o, i1) {
        const c = gf();
        let a;
        for(a = 0; a < 16; a++)c[a] = i1[a];
        for(a = 250; a >= 0; a--){
            S(c, c);
            if (a !== 1) M(c, c, i1);
        }
        for(a = 0; a < 16; a++)o[a] = c[a];
    }
    const ByteArray9 = ByteArray;
    const hash2 = hash;
    var AuthLength;
    const AuthLength1 = AuthLength;
    (function(AuthLength2) {
        AuthLength2[AuthLength2["Auth"] = 32] = "Auth";
        AuthLength2[AuthLength2["AuthFull"] = 64] = "AuthFull";
        AuthLength2[AuthLength2["Key"] = 32] = "Key";
    })(AuthLength || (AuthLength = {
    }));
    function auth(msg, key) {
        const out = ByteArray(32);
        out.set(hmac(msg, key).subarray(0, 32));
        return out;
    }
    const auth1 = auth;
    const BLOCK_SIZE = 128;
    const HASH_SIZE = 64;
    function hmac(msg, key) {
        const buf = ByteArray(128 + Math.max(64, msg.length));
        let i1, innerHash;
        if (key.length > 128) key = hash(key);
        for(i1 = 0; i1 < 128; i1++)buf[i1] = 54;
        for(i1 = 0; i1 < key.length; i1++)buf[i1] ^= key[i1];
        buf.set(msg, 128);
        innerHash = hash(buf.subarray(0, 128 + msg.length));
        for(i1 = 0; i1 < 128; i1++)buf[i1] = 92;
        for(i1 = 0; i1 < key.length; i1++)buf[i1] ^= key[i1];
        buf.set(innerHash, 128);
        return hash(buf.subarray(0, 128 + innerHash.length));
    }
    const auth_full = hmac;
    const auth_full1 = hmac;
    const ByteArray10 = ByteArray;
    const WordArray1 = WordArray;
    function blake2s(input, key, outlen = 32) {
        const ctx = blake2s_init(outlen, key);
        blake2s_update(ctx, input);
        return blake2s_final(ctx);
    }
    const blake2s1 = blake2s;
    function blake2s_init(outlen, key) {
        if (!(outlen > 0 && outlen <= 32)) {
            throw new Error('Incorrect output length, should be in [1, 32]');
        }
        const keylen = key ? key.length : 0;
        if (key && !(keylen > 0 && keylen <= 32)) {
            throw new Error('Incorrect key length, should be in [1, 32]');
        }
        const ctx = {
            h: WordArray(BLAKE2S_IV),
            b: WordArray(64),
            c: 0,
            t: 0,
            outlen: outlen
        };
        ctx.h[0] ^= 16842752 ^ keylen << 8 ^ outlen;
        if (keylen) {
            blake2s_update(ctx, key);
            ctx.c = 64;
        }
        return ctx;
    }
    const blake2s_init1 = blake2s_init;
    function blake2s_update(ctx, input) {
        for(let i1 = 0; i1 < input.length; i1++){
            if (ctx.c === 64) {
                ctx.t += ctx.c;
                blake2s_compress(ctx, false);
                ctx.c = 0;
            }
            ctx.b[ctx.c++] = input[i1];
        }
    }
    const blake2s_update1 = blake2s_update;
    function blake2s_final(ctx) {
        ctx.t += ctx.c;
        while(ctx.c < 64){
            ctx.b[ctx.c++] = 0;
        }
        blake2s_compress(ctx, true);
        const out = ByteArray(ctx.outlen);
        for(var i1 = 0; i1 < ctx.outlen; i1++){
            out[i1] = ctx.h[i1 >> 2] >> 8 * (i1 & 3) & 255;
        }
        return out;
    }
    const blake2s_final1 = blake2s_final;
    const BLAKE2S_IV = WordArray([
        1779033703,
        3144134277,
        1013904242,
        2773480762,
        1359893119,
        2600822924,
        528734635,
        1541459225
    ]);
    const SIGMA = ByteArray([
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        14,
        10,
        4,
        8,
        9,
        15,
        13,
        6,
        1,
        12,
        0,
        2,
        11,
        7,
        5,
        3,
        11,
        8,
        12,
        0,
        5,
        2,
        15,
        13,
        10,
        14,
        3,
        6,
        7,
        1,
        9,
        4,
        7,
        9,
        3,
        1,
        13,
        12,
        11,
        14,
        2,
        6,
        5,
        10,
        4,
        0,
        15,
        8,
        9,
        0,
        5,
        7,
        2,
        4,
        10,
        15,
        14,
        1,
        11,
        12,
        6,
        8,
        3,
        13,
        2,
        12,
        6,
        10,
        0,
        11,
        8,
        3,
        4,
        13,
        7,
        5,
        15,
        14,
        1,
        9,
        12,
        5,
        1,
        15,
        14,
        13,
        4,
        10,
        0,
        7,
        6,
        3,
        9,
        2,
        8,
        11,
        13,
        11,
        7,
        14,
        12,
        1,
        3,
        9,
        5,
        0,
        15,
        4,
        8,
        6,
        2,
        10,
        6,
        15,
        14,
        9,
        11,
        3,
        0,
        8,
        12,
        2,
        13,
        7,
        1,
        4,
        10,
        5,
        10,
        2,
        8,
        4,
        7,
        6,
        1,
        5,
        15,
        11,
        9,
        14,
        3,
        12,
        13,
        0
    ]);
    const v2 = WordArray(16);
    const m = WordArray(16);
    function blake2s_compress(ctx, last) {
        let i1 = 0;
        for(i1 = 0; i1 < 8; i1++){
            v2[i1] = ctx.h[i1];
            v2[i1 + 8] = BLAKE2S_IV[i1];
        }
        v2[12] ^= ctx.t;
        v2[13] ^= ctx.t / 4294967296;
        if (last) {
            v2[14] = ~v2[14];
        }
        for(i1 = 0; i1 < 16; i1++){
            m[i1] = B2S_GET32(ctx.b, 4 * i1);
        }
        for(i1 = 0; i1 < 10; i1++){
            B2S_G(0, 4, 8, 12, m[SIGMA[i1 * 16 + 0]], m[SIGMA[i1 * 16 + 1]]);
            B2S_G(1, 5, 9, 13, m[SIGMA[i1 * 16 + 2]], m[SIGMA[i1 * 16 + 3]]);
            B2S_G(2, 6, 10, 14, m[SIGMA[i1 * 16 + 4]], m[SIGMA[i1 * 16 + 5]]);
            B2S_G(3, 7, 11, 15, m[SIGMA[i1 * 16 + 6]], m[SIGMA[i1 * 16 + 7]]);
            B2S_G(0, 5, 10, 15, m[SIGMA[i1 * 16 + 8]], m[SIGMA[i1 * 16 + 9]]);
            B2S_G(1, 6, 11, 12, m[SIGMA[i1 * 16 + 10]], m[SIGMA[i1 * 16 + 11]]);
            B2S_G(2, 7, 8, 13, m[SIGMA[i1 * 16 + 12]], m[SIGMA[i1 * 16 + 13]]);
            B2S_G(3, 4, 9, 14, m[SIGMA[i1 * 16 + 14]], m[SIGMA[i1 * 16 + 15]]);
        }
        for(i1 = 0; i1 < 8; i1++){
            ctx.h[i1] ^= v2[i1] ^ v2[i1 + 8];
        }
    }
    function B2S_GET32(v1, i1) {
        return v1[i1] ^ v1[i1 + 1] << 8 ^ v1[i1 + 2] << 16 ^ v1[i1 + 3] << 24;
    }
    function B2S_G(a, b, c, d, x, y) {
        v2[a] = v2[a] + v2[b] + x;
        v2[d] = ROTR32(v2[d] ^ v2[a], 16);
        v2[c] = v2[c] + v2[d];
        v2[b] = ROTR32(v2[b] ^ v2[c], 12);
        v2[a] = v2[a] + v2[b] + y;
        v2[d] = ROTR32(v2[d] ^ v2[a], 8);
        v2[c] = v2[c] + v2[d];
        v2[b] = ROTR32(v2[b] ^ v2[c], 7);
    }
    function ROTR32(x, y) {
        return x >>> y ^ x << 32 - y;
    }
    const ByteArray11 = ByteArray;
    const WordArray2 = WordArray;
    function blake2b(input, key, outlen = 64) {
        const ctx = blake2b_init(outlen, key);
        blake2b_update(ctx, input);
        return blake2b_final(ctx);
    }
    const blake2b1 = blake2b;
    function blake2b_init(outlen, key) {
        if (outlen === 0 || outlen > 64) throw new Error('Illegal output length, expected 0 < length <= 64');
        if (key && key.length > 64) throw new Error('Illegal key, expected Uint8Array with 0 < length <= 64');
        const h = WordArray(16);
        for(let i1 = 0; i1 < 16; i1++)h[i1] = BLAKE2B_IV32[i1];
        const keylen = key ? key.length : 0;
        h[0] ^= 16842752 ^ keylen << 8 ^ outlen;
        const ctx = {
            b: ByteArray(128),
            h,
            t: 0,
            c: 0,
            outlen
        };
        if (key) {
            blake2b_update(ctx, key);
            ctx.c = 128;
        }
        return ctx;
    }
    const blake2b_init1 = blake2b_init;
    function blake2b_update(ctx, input) {
        for(let i1 = 0; i1 < input.length; i1++){
            if (ctx.c === 128) {
                ctx.t += ctx.c;
                blake2b_compress(ctx, false);
                ctx.c = 0;
            }
            ctx.b[ctx.c++] = input[i1];
        }
    }
    const blake2b_update1 = blake2b_update;
    function blake2b_final(ctx) {
        ctx.t += ctx.c;
        while(ctx.c < 128){
            ctx.b[ctx.c++] = 0;
        }
        blake2b_compress(ctx, true);
        const out = ByteArray(ctx.outlen);
        for(let i1 = 0; i1 < ctx.outlen; i1++){
            out[i1] = ctx.h[i1 >> 2] >> 8 * (i1 & 3);
        }
        return out;
    }
    const blake2b_final1 = blake2b_final;
    const BLAKE2B_IV32 = WordArray([
        4089235720,
        1779033703,
        2227873595,
        3144134277,
        4271175723,
        1013904242,
        1595750129,
        2773480762,
        2917565137,
        1359893119,
        725511199,
        2600822924,
        4215389547,
        528734635,
        327033209,
        1541459225
    ]);
    const SIGMA8 = [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        14,
        10,
        4,
        8,
        9,
        15,
        13,
        6,
        1,
        12,
        0,
        2,
        11,
        7,
        5,
        3,
        11,
        8,
        12,
        0,
        5,
        2,
        15,
        13,
        10,
        14,
        3,
        6,
        7,
        1,
        9,
        4,
        7,
        9,
        3,
        1,
        13,
        12,
        11,
        14,
        2,
        6,
        5,
        10,
        4,
        0,
        15,
        8,
        9,
        0,
        5,
        7,
        2,
        4,
        10,
        15,
        14,
        1,
        11,
        12,
        6,
        8,
        3,
        13,
        2,
        12,
        6,
        10,
        0,
        11,
        8,
        3,
        4,
        13,
        7,
        5,
        15,
        14,
        1,
        9,
        12,
        5,
        1,
        15,
        14,
        13,
        4,
        10,
        0,
        7,
        6,
        3,
        9,
        2,
        8,
        11,
        13,
        11,
        7,
        14,
        12,
        1,
        3,
        9,
        5,
        0,
        15,
        4,
        8,
        6,
        2,
        10,
        6,
        15,
        14,
        9,
        11,
        3,
        0,
        8,
        12,
        2,
        13,
        7,
        1,
        4,
        10,
        5,
        10,
        2,
        8,
        4,
        7,
        6,
        1,
        5,
        15,
        11,
        9,
        14,
        3,
        12,
        13,
        0,
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        14,
        10,
        4,
        8,
        9,
        15,
        13,
        6,
        1,
        12,
        0,
        2,
        11,
        7,
        5,
        3
    ];
    const SIGMA82 = ByteArray(SIGMA8.map((x)=>x * 2
    ));
    const v1 = WordArray(32);
    const m1 = WordArray(32);
    function blake2b_compress(ctx, last) {
        let i1;
        for(i1 = 0; i1 < 16; i1++){
            v1[i1] = ctx.h[i1];
            v1[i1 + 16] = BLAKE2B_IV32[i1];
        }
        v1[24] = v1[24] ^ ctx.t;
        v1[25] = v1[25] ^ ctx.t / 4294967296;
        if (last) {
            v1[28] = ~v1[28];
            v1[29] = ~v1[29];
        }
        for(i1 = 0; i1 < 32; i1++){
            m1[i1] = B2B_GET32(ctx.h, 4 * i1);
        }
        for(i1 = 0; i1 < 12; i1++){
            B2B_G(0, 8, 16, 24, SIGMA82[i1 * 16 + 0], SIGMA82[i1 * 16 + 1]);
            B2B_G(2, 10, 18, 26, SIGMA82[i1 * 16 + 2], SIGMA82[i1 * 16 + 3]);
            B2B_G(4, 12, 20, 28, SIGMA82[i1 * 16 + 4], SIGMA82[i1 * 16 + 5]);
            B2B_G(6, 14, 22, 30, SIGMA82[i1 * 16 + 6], SIGMA82[i1 * 16 + 7]);
            B2B_G(0, 10, 20, 30, SIGMA82[i1 * 16 + 8], SIGMA82[i1 * 16 + 9]);
            B2B_G(2, 12, 22, 24, SIGMA82[i1 * 16 + 10], SIGMA82[i1 * 16 + 11]);
            B2B_G(4, 14, 16, 26, SIGMA82[i1 * 16 + 12], SIGMA82[i1 * 16 + 13]);
            B2B_G(6, 8, 18, 28, SIGMA82[i1 * 16 + 14], SIGMA82[i1 * 16 + 15]);
        }
        for(i1 = 0; i1 < 16; i1++){
            ctx.h[i1] = ctx.h[i1] ^ v1[i1] ^ v1[i1 + 16];
        }
    }
    function ADD64AA(v2, a, b) {
        let o0 = v2[a] + v2[b], o1 = v2[a + 1] + v2[b + 1];
        if (o0 >= 4294967296) o1++;
        v2[a] = o0;
        v2[a + 1] = o1;
    }
    function ADD64AC(v2, a, b0, b1) {
        let o0 = v2[a] + b0;
        if (b0 < 0) o0 += 4294967296;
        let o1 = v2[a + 1] + b1;
        if (o0 >= 4294967296) o1++;
        v2[a] = o0;
        v2[a + 1] = o1;
    }
    function B2B_GET32(arr, i1) {
        return arr[i1] ^ arr[i1 + 1] << 8 ^ arr[i1 + 2] << 16 ^ arr[i1 + 3] << 24;
    }
    function B2B_G(a, b, c, d, ix, iy) {
        const x0 = m1[ix];
        const x1 = m1[ix + 1];
        const y0 = m1[iy];
        const y1 = m1[iy + 1];
        ADD64AA(v1, a, b);
        ADD64AC(v1, a, x0, x1);
        let xor0 = v1[d] ^ v1[a];
        let xor1 = v1[d + 1] ^ v1[a + 1];
        v1[d] = xor1;
        v1[d + 1] = xor0;
        ADD64AA(v1, c, d);
        xor0 = v1[b] ^ v1[c];
        xor1 = v1[b + 1] ^ v1[c + 1];
        v1[b] = xor0 >>> 24 ^ xor1 << 8;
        v1[b + 1] = xor1 >>> 24 ^ xor0 << 8;
        ADD64AA(v1, a, b);
        ADD64AC(v1, a, y0, y1);
        xor0 = v1[d] ^ v1[a];
        xor1 = v1[d + 1] ^ v1[a + 1];
        v1[d] = xor0 >>> 16 ^ xor1 << 16;
        v1[d + 1] = xor1 >>> 16 ^ xor0 << 16;
        ADD64AA(v1, c, d);
        xor0 = v1[b] ^ v1[c];
        xor1 = v1[b + 1] ^ v1[c + 1];
        v1[b] = xor1 >>> 31 ^ xor0 << 1;
        v1[b + 1] = xor0 >>> 31 ^ xor1 << 1;
    }
    const ByteArray12 = ByteArray;
    const BoxLength3 = BoxLength;
    const box2 = box;
    const box_open2 = box_open;
    const box_keyPair2 = box_keyPair;
    const blake2b_init2 = blake2b_init;
    const blake2b_update2 = blake2b_update;
    const blake2b_final2 = blake2b_final;
    var SealedBoxLength;
    const SealedBoxLength1 = SealedBoxLength;
    (function(SealedBoxLength2) {
        SealedBoxLength2[SealedBoxLength2["PublicKey"] = BoxLength.PublicKey] = "PublicKey";
        SealedBoxLength2[SealedBoxLength2["SecretKey"] = BoxLength.SecretKey] = "SecretKey";
        SealedBoxLength2[SealedBoxLength2["Nonce"] = BoxLength.Nonce] = "Nonce";
        SealedBoxLength2[SealedBoxLength2["Overhead"] = BoxLength.PublicKey + BoxLength.Overhead] = "Overhead";
    })(SealedBoxLength || (SealedBoxLength = {
    }));
    function sealedbox(m2, pk) {
        const c = ByteArray(SealedBoxLength.Overhead + m2.length);
        const ek = box_keyPair();
        c.set(ek.publicKey);
        const nonce1 = nonce_gen(ek.publicKey, pk);
        const boxed = box(m2, nonce1, pk, ek.secretKey);
        c.set(boxed, ek.publicKey.length);
        for(let i1 = 0; i1 < ek.secretKey.length; i1++)ek.secretKey[i1] = 0;
        return c;
    }
    const sealedbox1 = sealedbox;
    function sealedbox_open(c, pk, sk) {
        if (c.length < SealedBoxLength.Overhead) return;
        const epk = c.subarray(0, SealedBoxLength.PublicKey);
        const nonce1 = nonce_gen(epk, pk);
        const boxData = c.subarray(SealedBoxLength.PublicKey);
        return box_open(boxData, nonce1, epk, sk);
    }
    const sealedbox_open1 = sealedbox_open;
    function nonce_gen(pk1, pk2) {
        const state = blake2b_init(SealedBoxLength.Nonce);
        blake2b_update(state, pk1);
        blake2b_update(state, pk2);
        return blake2b_final(state);
    }
    const validateBase643 = validateBase64;
    const validateHex3 = validateHex;
    const encodeUTF83 = encodeUTF8;
    const decodeUTF83 = decodeUTF8;
    const encodeBase643 = encodeBase64;
    const decodeBase643 = decodeBase64;
    const encodeHex3 = encodeHex;
    const decodeHex3 = decodeHex;
    const BoxLength4 = BoxLength;
    const box3 = box;
    const box_before2 = box_before;
    const box_after2 = secretbox;
    const box_open3 = box_open;
    const box_open_after2 = secretbox_open;
    const box_keyPair3 = box_keyPair;
    const box_keyPair_fromSecretKey2 = box_keyPair_fromSecretKey;
    const HashLength2 = HashLength;
    const hash3 = hash;
    const _hash3 = _hash;
    const SignLength2 = SignLength;
    const sign2 = sign;
    const sign_open2 = sign_open;
    const sign_detached2 = sign_detached;
    const sign_detached_verify2 = sign_detached_verify;
    const sign_keyPair2 = sign_keyPair;
    const sign_keyPair_fromSecretKey2 = sign_keyPair_fromSecretKey;
    const sign_keyPair_fromSeed2 = sign_keyPair_fromSeed;
    const scalarbase2 = scalarbase;
    const scalarmult2 = scalarmult;
    const AuthLength2 = AuthLength;
    const auth2 = auth;
    const auth_full2 = hmac;
    const blake2s2 = blake2s;
    const blake2s_init2 = blake2s_init;
    const blake2s_update2 = blake2s_update;
    const blake2s_final2 = blake2s_final;
    const blake2b2 = blake2b;
    const blake2b_init3 = blake2b_init;
    const blake2b_update3 = blake2b_update;
    const blake2b_final3 = blake2b_final;
    const SealedBoxLength2 = SealedBoxLength;
    const sealedbox2 = sealedbox;
    const sealedbox_open2 = sealedbox_open;
    const randomBytes3 = randomBytes;
    const sign_detached3 = sign_detached;
    const sign_detached_verify3 = sign_detached_verify;
    const sign_keyPair_fromSeed3 = sign_keyPair_fromSeed;
    const denoHelper = {
        fromSeed: sign_keyPair_fromSeed,
        sign: sign_detached,
        verify: sign_detached_verify,
        randomBytes: randomBytes
    };
    const denoHelper1 = denoHelper;
    const denoHelper2 = denoHelper;
    let helper;
    function setEd25519Helper(lib) {
        helper = lib;
    }
    function getEd25519Helper() {
        return helper;
    }
    const setEd25519Helper1 = setEd25519Helper;
    const getEd25519Helper1 = getEd25519Helper;
    const setEd25519Helper2 = setEd25519Helper;
    setEd25519Helper(denoHelper);
    const getEd25519Helper2 = getEd25519Helper;
    var Prefix;
    (function(Prefix1) {
        Prefix1[Prefix1["Seed"] = 144] = "Seed";
        Prefix1[Prefix1["Private"] = 120] = "Private";
        Prefix1[Prefix1["Operator"] = 112] = "Operator";
        Prefix1[Prefix1["Server"] = 104] = "Server";
        Prefix1[Prefix1["Cluster"] = 16] = "Cluster";
        Prefix1[Prefix1["Account"] = 0] = "Account";
        Prefix1[Prefix1["User"] = 160] = "User";
    })(Prefix || (Prefix = {
    }));
    class Prefixes {
        static isValidPublicPrefix(prefix) {
            return prefix == Prefix.Server || prefix == Prefix.Operator || prefix == Prefix.Cluster || prefix == Prefix.Account || prefix == Prefix.User;
        }
        static startsWithValidPrefix(s) {
            let c = s[0];
            return c == "S" || c == "P" || c == "O" || c == "N" || c == "C" || c == "A" || c == "U";
        }
        static isValidPrefix(prefix) {
            let v2 = this.parsePrefix(prefix);
            return v2 != -1;
        }
        static parsePrefix(v) {
            switch(v){
                case Prefix.Seed:
                    return Prefix.Seed;
                case Prefix.Private:
                    return Prefix.Private;
                case Prefix.Operator:
                    return Prefix.Operator;
                case Prefix.Server:
                    return Prefix.Server;
                case Prefix.Cluster:
                    return Prefix.Cluster;
                case Prefix.Account:
                    return Prefix.Account;
                case Prefix.User:
                    return Prefix.User;
                default:
                    return -1;
            }
        }
    }
    var NKeysErrorCode;
    (function(NKeysErrorCode1) {
        NKeysErrorCode1["InvalidPrefixByte"] = "nkeys: invalid prefix byte";
        NKeysErrorCode1["InvalidKey"] = "nkeys: invalid key";
        NKeysErrorCode1["InvalidPublicKey"] = "nkeys: invalid public key";
        NKeysErrorCode1["InvalidSeedLen"] = "nkeys: invalid seed length";
        NKeysErrorCode1["InvalidSeed"] = "nkeys: invalid seed";
        NKeysErrorCode1["InvalidEncoding"] = "nkeys: invalid encoded key";
        NKeysErrorCode1["InvalidSignature"] = "nkeys: signature verification failed";
        NKeysErrorCode1["CannotSign"] = "nkeys: cannot sign, no private key available";
        NKeysErrorCode1["PublicKeyOnly"] = "nkeys: no seed or private key available";
        NKeysErrorCode1["InvalidChecksum"] = "nkeys: invalid checksum";
        NKeysErrorCode1["SerializationError"] = "nkeys: serialization error";
        NKeysErrorCode1["ApiError"] = "nkeys: api error";
        NKeysErrorCode1["ClearedPair"] = "nkeys: pair is cleared";
    })(NKeysErrorCode || (NKeysErrorCode = {
    }));
    class NKeysError extends Error {
        constructor(code1, chainedError){
            super(code1);
            this.name = "NKeysError";
            this.code = code1;
            this.chainedError = chainedError;
        }
    }
    const Prefix1 = Prefix;
    const Prefixes1 = Prefixes;
    const NKeysErrorCode1 = NKeysErrorCode;
    const NKeysError1 = NKeysError;
    const NKeysError2 = NKeysError;
    const NKeysErrorCode2 = NKeysErrorCode;
    const Prefix2 = Prefix;
    const getEd25519Helper3 = getEd25519Helper;
    const NKeysError3 = NKeysError;
    const NKeysErrorCode3 = NKeysErrorCode;
    const getEd25519Helper4 = getEd25519Helper;
    const crc16tab = new Uint16Array([
        0,
        4129,
        8258,
        12387,
        16516,
        20645,
        24774,
        28903,
        33032,
        37161,
        41290,
        45419,
        49548,
        53677,
        57806,
        61935,
        4657,
        528,
        12915,
        8786,
        21173,
        17044,
        29431,
        25302,
        37689,
        33560,
        45947,
        41818,
        54205,
        50076,
        62463,
        58334,
        9314,
        13379,
        1056,
        5121,
        25830,
        29895,
        17572,
        21637,
        42346,
        46411,
        34088,
        38153,
        58862,
        62927,
        50604,
        54669,
        13907,
        9842,
        5649,
        1584,
        30423,
        26358,
        22165,
        18100,
        46939,
        42874,
        38681,
        34616,
        63455,
        59390,
        55197,
        51132,
        18628,
        22757,
        26758,
        30887,
        2112,
        6241,
        10242,
        14371,
        51660,
        55789,
        59790,
        63919,
        35144,
        39273,
        43274,
        47403,
        23285,
        19156,
        31415,
        27286,
        6769,
        2640,
        14899,
        10770,
        56317,
        52188,
        64447,
        60318,
        39801,
        35672,
        47931,
        43802,
        27814,
        31879,
        19684,
        23749,
        11298,
        15363,
        3168,
        7233,
        60846,
        64911,
        52716,
        56781,
        44330,
        48395,
        36200,
        40265,
        32407,
        28342,
        24277,
        20212,
        15891,
        11826,
        7761,
        3696,
        65439,
        61374,
        57309,
        53244,
        48923,
        44858,
        40793,
        36728,
        37256,
        33193,
        45514,
        41451,
        53516,
        49453,
        61774,
        57711,
        4224,
        161,
        12482,
        8419,
        20484,
        16421,
        28742,
        24679,
        33721,
        37784,
        41979,
        46042,
        49981,
        54044,
        58239,
        62302,
        689,
        4752,
        8947,
        13010,
        16949,
        21012,
        25207,
        29270,
        46570,
        42443,
        38312,
        34185,
        62830,
        58703,
        54572,
        50445,
        13538,
        9411,
        5280,
        1153,
        29798,
        25671,
        21540,
        17413,
        42971,
        47098,
        34713,
        38840,
        59231,
        63358,
        50973,
        55100,
        9939,
        14066,
        1681,
        5808,
        26199,
        30326,
        17941,
        22068,
        55628,
        51565,
        63758,
        59695,
        39368,
        35305,
        47498,
        43435,
        22596,
        18533,
        30726,
        26663,
        6336,
        2273,
        14466,
        10403,
        52093,
        56156,
        60223,
        64286,
        35833,
        39896,
        43963,
        48026,
        19061,
        23124,
        27191,
        31254,
        2801,
        6864,
        10931,
        14994,
        64814,
        60687,
        56684,
        52557,
        48554,
        44427,
        40424,
        36297,
        31782,
        27655,
        23652,
        19525,
        15522,
        11395,
        7392,
        3265,
        61215,
        65342,
        53085,
        57212,
        44955,
        49082,
        36825,
        40952,
        28183,
        32310,
        20053,
        24180,
        11923,
        16050,
        3793,
        7920, 
    ]);
    class crc16 {
        static checksum(data) {
            let crc = 0;
            for(let i1 = 0; i1 < data.byteLength; i1++){
                let b = data[i1];
                crc = crc << 8 & 65535 ^ crc16tab[(crc >> 8 ^ b) & 255];
            }
            return crc;
        }
        static validate(data, expected) {
            let ba = crc16.checksum(data);
            return ba == expected;
        }
    }
    const crc161 = crc16;
    const crc162 = crc16;
    const NKeysError4 = NKeysError;
    const NKeysErrorCode4 = NKeysErrorCode;
    const Prefix3 = Prefix;
    const Prefixes2 = Prefixes;
    const b32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    class base32 {
        static encode(src) {
            let bits = 0;
            let value = 0;
            let a = new Uint8Array(src);
            let buf = new Uint8Array(src.byteLength * 2);
            let j = 0;
            for(let i1 = 0; i1 < a.byteLength; i1++){
                value = value << 8 | a[i1];
                bits += 8;
                while(bits >= 5){
                    let index = value >>> bits - 5 & 31;
                    buf[j++] = b32Alphabet.charAt(index).charCodeAt(0);
                    bits -= 5;
                }
            }
            if (bits > 0) {
                let index = value << 5 - bits & 31;
                buf[j++] = b32Alphabet.charAt(index).charCodeAt(0);
            }
            return buf.slice(0, j);
        }
        static decode(src) {
            let bits = 0;
            let byte = 0;
            let j = 0;
            let a = new Uint8Array(src);
            let out = new Uint8Array(a.byteLength * 5 / 8 | 0);
            for(let i1 = 0; i1 < a.byteLength; i1++){
                let v3 = String.fromCharCode(a[i1]);
                let vv = b32Alphabet.indexOf(v3);
                if (vv === -1) {
                    throw new Error("Illegal Base32 character: " + a[i1]);
                }
                byte = byte << 5 | vv;
                bits += 5;
                if (bits >= 8) {
                    out[j++] = byte >>> bits - 8 & 255;
                    bits -= 8;
                }
            }
            return out.slice(0, j);
        }
    }
    const base321 = base32;
    const base322 = base32;
    class Codec {
        static encode(prefix, src) {
            if (!src || !(src instanceof Uint8Array)) {
                throw new NKeysError(NKeysErrorCode.SerializationError);
            }
            if (!Prefixes.isValidPrefix(prefix)) {
                throw new NKeysError(NKeysErrorCode.InvalidPrefixByte);
            }
            return Codec._encode(false, prefix, src);
        }
        static encodeSeed(role, src) {
            if (!src) {
                throw new NKeysError(NKeysErrorCode.ApiError);
            }
            if (!Prefixes.isValidPublicPrefix(role)) {
                throw new NKeysError(NKeysErrorCode.InvalidPrefixByte);
            }
            if (src.byteLength !== 32) {
                throw new NKeysError(NKeysErrorCode.InvalidSeedLen);
            }
            return Codec._encode(true, role, src);
        }
        static decode(expected, src) {
            if (!Prefixes.isValidPrefix(expected)) {
                throw new NKeysError(NKeysErrorCode.InvalidPrefixByte);
            }
            const raw = Codec._decode(src);
            if (raw[0] !== expected) {
                throw new NKeysError(NKeysErrorCode.InvalidPrefixByte);
            }
            return raw.slice(1);
        }
        static decodeSeed(src) {
            const raw = Codec._decode(src);
            const prefix = Codec._decodePrefix(raw);
            if (prefix[0] != Prefix.Seed) {
                throw new NKeysError(NKeysErrorCode.InvalidSeed);
            }
            if (!Prefixes.isValidPublicPrefix(prefix[1])) {
                throw new NKeysError(NKeysErrorCode.InvalidPrefixByte);
            }
            return {
                buf: raw.slice(2),
                prefix: prefix[1]
            };
        }
        static _encode(seed, role, payload) {
            const payloadOffset = seed ? 2 : 1;
            const payloadLen = payload.byteLength;
            const checkLen = 2;
            const cap = payloadOffset + payloadLen + 2;
            const checkOffset = payloadOffset + payloadLen;
            const raw = new Uint8Array(cap);
            if (seed) {
                const encodedPrefix = Codec._encodePrefix(Prefix.Seed, role);
                raw.set(encodedPrefix);
            } else {
                raw[0] = role;
            }
            raw.set(payload, payloadOffset);
            const checksum = crc16.checksum(raw.slice(0, checkOffset));
            const dv = new DataView(raw.buffer);
            dv.setUint16(checkOffset, checksum, true);
            return base32.encode(raw);
        }
        static _decode(src) {
            if (src.byteLength < 4) {
                throw new NKeysError(NKeysErrorCode.InvalidEncoding);
            }
            let raw;
            try {
                raw = base32.decode(src);
            } catch (ex) {
                throw new NKeysError(NKeysErrorCode.InvalidEncoding, ex);
            }
            const checkOffset = raw.byteLength - 2;
            const dv = new DataView(raw.buffer);
            const checksum = dv.getUint16(checkOffset, true);
            const payload = raw.slice(0, checkOffset);
            if (!crc16.validate(payload, checksum)) {
                throw new NKeysError(NKeysErrorCode.InvalidChecksum);
            }
            return payload;
        }
        static _encodePrefix(kind, role) {
            const b1 = kind | role >> 5;
            const b2 = (role & 31) << 3;
            return new Uint8Array([
                b1,
                b2
            ]);
        }
        static _decodePrefix(raw) {
            const b1 = raw[0] & 248;
            const b2 = (raw[0] & 7) << 5 | (raw[1] & 248) >> 3;
            return new Uint8Array([
                b1,
                b2
            ]);
        }
    }
    const Codec1 = Codec;
    const Codec2 = Codec;
    const Codec3 = Codec;
    class KP {
        constructor(seed){
            this.seed = seed;
        }
        getRawSeed() {
            if (!this.seed) {
                throw new NKeysError(NKeysErrorCode.ClearedPair);
            }
            let sd = Codec.decodeSeed(this.seed);
            return sd.buf;
        }
        getSeed() {
            if (!this.seed) {
                throw new NKeysError(NKeysErrorCode.ClearedPair);
            }
            return this.seed;
        }
        getPublicKey() {
            if (!this.seed) {
                throw new NKeysError(NKeysErrorCode.ClearedPair);
            }
            const sd = Codec.decodeSeed(this.seed);
            const kp = getEd25519Helper().fromSeed(this.getRawSeed());
            const buf = Codec.encode(sd.prefix, kp.publicKey);
            return new TextDecoder().decode(buf);
        }
        getPrivateKey() {
            if (!this.seed) {
                throw new NKeysError(NKeysErrorCode.ClearedPair);
            }
            const kp = getEd25519Helper().fromSeed(this.getRawSeed());
            return Codec.encode(Prefix.Private, kp.secretKey);
        }
        sign(input) {
            if (!this.seed) {
                throw new NKeysError(NKeysErrorCode.ClearedPair);
            }
            const kp = getEd25519Helper().fromSeed(this.getRawSeed());
            return getEd25519Helper().sign(input, kp.secretKey);
        }
        verify(input, sig) {
            if (!this.seed) {
                throw new NKeysError(NKeysErrorCode.ClearedPair);
            }
            const kp = getEd25519Helper().fromSeed(this.getRawSeed());
            return getEd25519Helper().verify(input, sig, kp.publicKey);
        }
        clear() {
            if (!this.seed) {
                return;
            }
            this.seed.fill(0);
            this.seed = undefined;
        }
    }
    const KP1 = KP;
    const Codec4 = Codec;
    class PublicKey {
        constructor(publicKey){
            this.publicKey = publicKey;
        }
        getPublicKey() {
            if (!this.publicKey) {
                throw new NKeysError(NKeysErrorCode.ClearedPair);
            }
            return new TextDecoder().decode(this.publicKey);
        }
        getPrivateKey() {
            if (!this.publicKey) {
                throw new NKeysError(NKeysErrorCode.ClearedPair);
            }
            throw new NKeysError(NKeysErrorCode.PublicKeyOnly);
        }
        getSeed() {
            if (!this.publicKey) {
                throw new NKeysError(NKeysErrorCode.ClearedPair);
            }
            throw new NKeysError(NKeysErrorCode.PublicKeyOnly);
        }
        sign(_) {
            if (!this.publicKey) {
                throw new NKeysError(NKeysErrorCode.ClearedPair);
            }
            throw new NKeysError(NKeysErrorCode.CannotSign);
        }
        verify(input, sig) {
            if (!this.publicKey) {
                throw new NKeysError(NKeysErrorCode.ClearedPair);
            }
            let buf = Codec._decode(this.publicKey);
            return getEd25519Helper().verify(input, sig, buf.slice(1));
        }
        clear() {
            if (!this.publicKey) {
                return;
            }
            this.publicKey.fill(0);
            this.publicKey = undefined;
        }
    }
    const PublicKey1 = PublicKey;
    const KP2 = KP;
    const PublicKey2 = PublicKey;
    function createPair(prefix) {
        const rawSeed = getEd25519Helper().randomBytes(32);
        let str = Codec.encodeSeed(prefix, new Uint8Array(rawSeed));
        return new KP(str);
    }
    function createOperator() {
        return createPair(Prefix.Operator);
    }
    function createAccount() {
        return createPair(Prefix.Account);
    }
    function createUser() {
        return createPair(Prefix.User);
    }
    function createCluster() {
        return createPair(Prefix.Cluster);
    }
    function createServer() {
        return createPair(Prefix.Server);
    }
    function fromPublic(src) {
        const ba = new TextEncoder().encode(src);
        const raw = Codec._decode(ba);
        const prefix = Prefixes.parsePrefix(raw[0]);
        if (Prefixes.isValidPublicPrefix(prefix)) {
            return new PublicKey(ba);
        }
        throw new NKeysError(NKeysErrorCode.InvalidPublicKey);
    }
    function fromSeed(src) {
        Codec.decodeSeed(src);
        return new KP(src);
    }
    const createPair1 = createPair;
    const createOperator1 = createOperator;
    const createAccount1 = createAccount;
    const createUser1 = createUser;
    const createCluster1 = createCluster;
    const createServer1 = createServer;
    const fromPublic1 = fromPublic;
    const fromSeed1 = fromSeed;
    function encode2(bytes) {
        return btoa(String.fromCharCode(...bytes));
    }
    const encode3 = encode2;
    function decode2(b64str) {
        const bin = atob(b64str);
        const bytes = new Uint8Array(bin.length);
        for(let i1 = 0; i1 < bin.length; i1++){
            bytes[i1] = bin.charCodeAt(i1);
        }
        return bytes;
    }
    const decode3 = decode2;
    function dump(buf, msg) {
        if (msg) {
            console.log(msg);
        }
        let a = [];
        for(let i1 = 0; i1 < buf.byteLength; i1++){
            if (i1 % 8 === 0) {
                a.push("\n");
            }
            let v3 = buf[i1].toString(16);
            if (v3.length === 1) {
                v3 = "0" + v3;
            }
            a.push(v3);
        }
        console.log(a.join("  "));
    }
    const dump1 = dump;
    return {
        createAccount: createAccount,
        createOperator: createOperator,
        createPair: createPair,
        createUser: createUser,
        fromPublic: fromPublic,
        fromSeed: fromSeed,
        NKeysError: NKeysError,
        NKeysErrorCode: NKeysErrorCode,
        Prefix: Prefix,
        decode: decode2,
        encode: encode2
    };
}();
const nkeys = mod;
function nkeyAuthenticator(seed) {
    return (nonce1)=>{
        seed = typeof seed === "function" ? seed() : seed;
        const kp = seed ? mod.fromSeed(seed) : undefined;
        const nkey = kp ? kp.getPublicKey() : "";
        const challenge = TE.encode(nonce1 || "");
        const sigBytes = kp !== undefined && nonce1 ? kp.sign(challenge) : undefined;
        const sig = sigBytes ? mod.encode(sigBytes) : "";
        return {
            nkey,
            sig
        };
    };
}
function jwtAuthenticator(ajwt, seed) {
    return (nonce1)=>{
        const jwt = typeof ajwt === "function" ? ajwt() : ajwt;
        const fn = nkeyAuthenticator(seed);
        const { nkey , sig  } = fn(nonce1);
        return {
            jwt,
            nkey,
            sig
        };
    };
}
const jwtAuthenticator1 = jwtAuthenticator;
const nkeyAuthenticator1 = nkeyAuthenticator;
class Messages {
    constructor(){
        this.messages = new Map();
        this.messages.set(ErrorCode.INVALID_PAYLOAD_TYPE, "Invalid payload type - payloads can be 'binary', 'string', or 'json'");
        this.messages.set(ErrorCode.BAD_JSON, "Bad JSON");
        this.messages.set(ErrorCode.WSS_REQUIRED, "TLS is required, therefore a secure websocket connection is also required");
    }
    static getMessage(s) {
        return messages.getMessage(s);
    }
    getMessage(s) {
        return this.messages.get(s) || s;
    }
}
const messages = new Messages();
class NatsError2 extends Error {
    constructor(message, code1, chainedError1){
        super(message);
        this.name = "NatsError";
        this.message = message;
        this.code = code1;
        this.chainedError = chainedError1;
    }
    static errorForCode(code, chainedError) {
        const m = Messages.getMessage(code);
        return new NatsError2(m, code, chainedError);
    }
}
function headers() {
    return new MsgHdrsImpl();
}
class MsgHdrsImpl {
    description = "";
    constructor(){
        this.headers = new Map();
    }
    [Symbol.iterator]() {
        return this.headers.entries();
    }
    size() {
        let count = 0;
        for (const [_, v] of this.headers.entries()){
            count += v.length;
        }
        return count;
    }
    equals(mh) {
        if (mh && this.headers.size === mh.headers.size && this.code === mh.code) {
            for (const [k, v] of this.headers){
                const a = mh.values(k);
                if (v.length !== a.length) {
                    return false;
                }
                const vv = [
                    ...v
                ].sort();
                const aa = [
                    ...a
                ].sort();
                for(let i = 0; i < vv.length; i++){
                    if (vv[i] !== aa[i]) {
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    }
    static decode(a) {
        const mh = new MsgHdrsImpl();
        const s = TD.decode(a);
        const lines = s.split("\r\n");
        const h = lines[0];
        if (h !== HEADER) {
            let str = h.replace(HEADER, "");
            mh.code = parseInt(str, 10);
            const scode = mh.code.toString();
            mh.set("Status", scode);
            str = str.replace(scode, "");
            mh.description = str.trim();
            if (mh.description) {
                mh.set("Description", mh.description);
            }
        } else {
            lines.slice(1).map((s1)=>{
                if (s1) {
                    const idx = s1.indexOf(": ");
                    const k = s1.slice(0, idx);
                    const v = s1.slice(idx + 2);
                    mh.append(k, v);
                }
            });
        }
        return mh;
    }
    toString() {
        if (this.headers.size === 0) {
            return "";
        }
        let s = HEADER;
        for (const [k, v] of this.headers){
            for(let i = 0; i < v.length; i++){
                s = `${s}\r\n${k}: ${v[i]}`;
            }
        }
        return `${s}\r\n\r\n`;
    }
    encode() {
        return TE.encode(this.toString());
    }
    static canonicalMIMEHeaderKey(k) {
        const a = 97;
        const A1 = 65;
        const Z1 = 90;
        const z = 122;
        const dash = 45;
        const colon = 58;
        const start = 33;
        const end = 126;
        const toLower = 97 - 65;
        let upper = true;
        const buf = new Array(k.length);
        for(let i = 0; i < k.length; i++){
            let c = k.charCodeAt(i);
            if (c === 58 || c < 33 || c > 126) {
                throw new NatsError2(`'${k[i]}' is not a valid character for a header key`, ErrorCode.BAD_HEADER);
            }
            if (upper && 97 <= c && c <= 122) {
                c -= toLower;
            } else if (!upper && 65 <= c && c <= 90) {
                c += toLower;
            }
            buf[i] = c;
            upper = c == 45;
        }
        return String.fromCharCode(...buf);
    }
    static validHeaderValue(k) {
        const inv = /[\r\n]/;
        if (inv.test(k)) {
            throw new NatsError2("invalid header value - \\r and \\n are not allowed.", ErrorCode.BAD_HEADER);
        }
        return k.trim();
    }
    get(k) {
        const key = MsgHdrsImpl.canonicalMIMEHeaderKey(k);
        const a = this.headers.get(key);
        return a ? a[0] : "";
    }
    has(k) {
        return this.get(k) !== "";
    }
    set(k, v) {
        const key = MsgHdrsImpl.canonicalMIMEHeaderKey(k);
        const value = MsgHdrsImpl.validHeaderValue(v);
        this.headers.set(key, [
            value
        ]);
    }
    append(k, v) {
        const key = MsgHdrsImpl.canonicalMIMEHeaderKey(k);
        const value = MsgHdrsImpl.validHeaderValue(v);
        let a = this.headers.get(key);
        if (!a) {
            a = [];
            this.headers.set(key, a);
        }
        a.push(value);
    }
    values(k) {
        const key = MsgHdrsImpl.canonicalMIMEHeaderKey(k);
        return this.headers.get(key) || [];
    }
    delete(k) {
        const key = MsgHdrsImpl.canonicalMIMEHeaderKey(k);
        this.headers.delete(key);
    }
    get hasError() {
        if (this.code) {
            return this.code > 0 && (this.code < 200 || this.code >= 300);
        }
        return false;
    }
    get status() {
        return `${this.code} ${this.description}`.trim();
    }
}
class MsgImpl {
    constructor(msg1, data1, publisher2){
        this._msg = msg1;
        this._rdata = data1;
        this.publisher = publisher2;
    }
    get subject() {
        if (this._subject) {
            return this._subject;
        }
        this._subject = TD.decode(this._msg.subject);
        return this._subject;
    }
    get reply() {
        if (this._reply) {
            return this._reply;
        }
        this._reply = TD.decode(this._msg.reply);
        return this._reply;
    }
    get sid() {
        return this._msg.sid;
    }
    get headers() {
        if (this._msg.hdr > -1 && !this._headers) {
            const buf = this._rdata.subarray(0, this._msg.hdr);
            this._headers = MsgHdrsImpl.decode(buf);
        }
        return this._headers;
    }
    get data() {
        if (!this._rdata) {
            return new Uint8Array(0);
        }
        return this._msg.hdr > -1 ? this._rdata.subarray(this._msg.hdr) : this._rdata;
    }
    respond(data = Empty, opts) {
        if (this.reply) {
            this.publisher.publish(this.reply, data, opts);
            return true;
        }
        return false;
    }
}
class QueuedIterator {
    constructor(){
        this.inflight = 0;
        this.processed = 0;
        this.received = 0;
        this.noIterator = false;
        this.done = false;
        this.signal = deferred();
        this.yields = [];
    }
    [Symbol.asyncIterator]() {
        return this.iterate();
    }
    push(v) {
        if (this.done) {
            return;
        }
        this.yields.push(v);
        this.signal.resolve();
    }
    async *iterate() {
        if (this.noIterator) {
            throw new NatsError2("unsupported iterator", ErrorCode.API_ERROR);
        }
        while(true){
            if (this.yields.length === 0) {
                await this.signal;
            }
            if (this.err) {
                throw this.err;
            }
            const yields = this.yields;
            this.inflight = yields.length;
            this.yields = [];
            for(let i = 0; i < yields.length; i++){
                this.processed++;
                yield yields[i];
                this.inflight--;
            }
            if (this.done) {
                break;
            } else if (this.yields.length === 0) {
                yields.length = 0;
                this.yields = yields;
                this.signal = deferred();
            }
        }
    }
    stop(err) {
        this.err = err;
        this.done = true;
        this.signal.resolve();
    }
    getProcessed() {
        return this.noIterator ? this.received : this.processed;
    }
    getPending() {
        return this.yields.length + this.inflight;
    }
    getReceived() {
        return this.received;
    }
}
function timeout(ms) {
    let methods;
    let timer;
    const p = new Promise((resolve, reject)=>{
        const cancel = ()=>{
            if (timer) {
                clearTimeout(timer);
            }
        };
        methods = {
            cancel
        };
        timer = setTimeout(()=>{
            reject(NatsError2.errorForCode(ErrorCode.TIMEOUT));
        }, ms);
    });
    return Object.assign(p, methods);
}
class SubscriptionImpl extends QueuedIterator {
    constructor(protocol, subject1, opts3 = {
    }){
        super();
        extend(this, opts3);
        this.protocol = protocol;
        this.subject = subject1;
        this.draining = false;
        this.noIterator = typeof opts3.callback === "function";
        if (opts3.timeout) {
            this.timer = timeout(opts3.timeout);
            this.timer.then(()=>{
                this.timer = undefined;
            }).catch((err)=>{
                this.stop(err);
            });
        }
    }
    callback(err, msg) {
        this.cancelTimeout();
        err ? this.stop(err) : this.push(msg);
    }
    close() {
        if (!this.isClosed()) {
            this.cancelTimeout();
            this.stop();
        }
    }
    unsubscribe(max) {
        this.protocol.unsubscribe(this, max);
    }
    cancelTimeout() {
        if (this.timer) {
            this.timer.cancel();
            this.timer = undefined;
        }
    }
    drain() {
        if (this.protocol.isClosed()) {
            throw NatsError2.errorForCode(ErrorCode.CONNECTION_CLOSED);
        }
        if (this.isClosed()) {
            throw NatsError2.errorForCode(ErrorCode.SUB_CLOSED);
        }
        if (!this.drained) {
            this.protocol.unsub(this);
            this.drained = this.protocol.flush(deferred());
            this.drained.then(()=>{
                this.protocol.subscriptions.cancel(this);
            });
        }
        return this.drained;
    }
    isDraining() {
        return this.draining;
    }
    isClosed() {
        return this.done;
    }
    getSubject() {
        return this.subject;
    }
    getMax() {
        return this.max;
    }
    getID() {
        return this.sid;
    }
}
class MuxSubscription {
    constructor(){
        this.reqs = new Map();
    }
    size() {
        return this.reqs.size;
    }
    init() {
        this.baseInbox = `${createInbox()}.`;
        return this.baseInbox;
    }
    add(r) {
        if (!isNaN(r.received)) {
            r.received = 0;
        }
        this.reqs.set(r.token, r);
    }
    get(token) {
        return this.reqs.get(token);
    }
    cancel(r) {
        this.reqs.delete(r.token);
    }
    getToken(m) {
        const s = m.subject || "";
        if (s.indexOf(this.baseInbox) === 0) {
            return s.substring(this.baseInbox.length);
        }
        return null;
    }
    dispatcher() {
        return (err, m)=>{
            const token = this.getToken(m);
            if (token) {
                const r = this.get(token);
                if (r) {
                    if (err === null && m.headers) {
                        const headers1 = m.headers;
                        if (headers1.hasError) {
                            err = new NatsError2(headers1.status, ErrorCode.REQUEST_ERROR);
                        }
                    }
                    r.resolver(err, m);
                }
            }
        };
    }
    close() {
        const err = NatsError2.errorForCode(ErrorCode.TIMEOUT);
        this.reqs.forEach((req)=>{
            req.resolver(err, {
            });
        });
    }
}
class ProtocolHandler {
    constructor(options1, publisher1){
        this._closed = false;
        this.connected = false;
        this.connectedOnce = false;
        this.infoReceived = false;
        this.noMorePublishing = false;
        this.listeners = [];
        this.pendingLimit = FLUSH_THRESHOLD;
        this.outMsgs = 0;
        this.inMsgs = 0;
        this.outBytes = 0;
        this.inBytes = 0;
        this.options = options1;
        this.publisher = publisher1;
        this.subscriptions = new Subscriptions();
        this.muxSubscriptions = new MuxSubscription();
        this.outbound = new DataBuffer();
        this.pongs = [];
        this.pendingLimit = options1.pendingLimit || this.pendingLimit;
        this.servers = new Servers(!options1.noRandomize, options1.servers);
        this.closed = deferred();
        this.parser = new Parser(this);
        this.heartbeats = new Heartbeat(this, this.options.pingInterval || DEFAULT_PING_INTERVAL, this.options.maxPingOut || 2);
    }
    resetOutbound() {
        this.outbound.reset();
        const pongs = this.pongs;
        this.pongs = [];
        pongs.forEach((p)=>{
            p.reject(NatsError2.errorForCode(ErrorCode.DISCONNECT));
        });
        this.parser = new Parser(this);
        this.infoReceived = false;
    }
    dispatchStatus(status) {
        this.listeners.forEach((q)=>{
            q.push(status);
        });
    }
    status() {
        const iter = new QueuedIterator();
        this.listeners.push(iter);
        return iter;
    }
    prepare() {
        this.info = undefined;
        this.resetOutbound();
        const pong = deferred();
        this.pongs.unshift(pong);
        this.connectError = undefined;
        this.connectError = (err)=>{
            pong.reject(err);
        };
        this.transport = newTransport();
        this.transport.closed().then(async (err)=>{
            this.connected = false;
            if (!this.isClosed()) {
                await this.disconnected(this.transport.closeError);
                return;
            }
        });
        return pong;
    }
    disconnect() {
        this.dispatchStatus({
            type: DebugEvents.STALE_CONNECTION,
            data: ""
        });
        this.transport.disconnect();
    }
    async disconnected(err) {
        this.dispatchStatus({
            type: Events.DISCONNECT,
            data: this.servers.getCurrentServer().toString()
        });
        if (this.options.reconnect) {
            await this.dialLoop().then(()=>{
                this.dispatchStatus({
                    type: Events.RECONNECT,
                    data: this.servers.getCurrentServer().toString()
                });
            }).catch((err)=>{
                this._close(err);
            });
        } else {
            await this._close();
        }
    }
    async dial(srv) {
        const pong = this.prepare();
        const timer = timeout(this.options.timeout || 20000);
        try {
            await this.transport.connect(srv, this.options);
            (async ()=>{
                try {
                    for await (const b of this.transport){
                        this.parser.parse(b);
                    }
                } catch (err) {
                    console.log("reader closed", err);
                }
            })().then();
        } catch (err) {
            pong.reject(err);
        }
        try {
            await Promise.race([
                timer,
                pong
            ]);
            timer.cancel();
            this.connected = true;
            this.connectError = undefined;
            this.sendSubscriptions();
            this.connectedOnce = true;
            this.server.didConnect = true;
            this.server.reconnects = 0;
            this.flushPending();
            this.heartbeats.start();
        } catch (err) {
            timer.cancel();
            await this.transport.close(err);
            throw err;
        }
    }
    async dialLoop() {
        let lastError;
        while(true){
            const wait = this.options.reconnectDelayHandler ? this.options.reconnectDelayHandler() : DEFAULT_RECONNECT_TIME_WAIT;
            let maxWait = wait;
            const srv = this.selectServer();
            if (!srv) {
                throw lastError || NatsError2.errorForCode(ErrorCode.CONNECTION_REFUSED);
            }
            const now = Date.now();
            if (srv.lastConnect === 0 || srv.lastConnect + wait <= now) {
                srv.lastConnect = Date.now();
                try {
                    this.dispatchStatus({
                        type: DebugEvents.RECONNECTING,
                        data: srv.toString()
                    });
                    await this.dial(srv);
                    break;
                } catch (err) {
                    lastError = err;
                    if (!this.connectedOnce) {
                        if (!this.options.waitOnFirstConnect) {
                            this.servers.removeCurrentServer();
                        }
                        continue;
                    }
                    srv.reconnects++;
                    const mra = this.options.maxReconnectAttempts || 0;
                    if (mra !== -1 && srv.reconnects >= mra) {
                        this.servers.removeCurrentServer();
                    }
                }
            } else {
                maxWait = Math.min(maxWait, srv.lastConnect + wait - now);
                await delay(maxWait);
            }
        }
    }
    static async connect(options, publisher) {
        const h = new ProtocolHandler(options, publisher);
        await h.dialLoop();
        return h;
    }
    static toError(s) {
        const t = s ? s.toLowerCase() : "";
        if (t.indexOf("permissions violation") !== -1) {
            return new NatsError2(s, ErrorCode.PERMISSIONS_VIOLATION);
        } else if (t.indexOf("authorization violation") !== -1) {
            return new NatsError2(s, ErrorCode.AUTHORIZATION_VIOLATION);
        } else {
            return new NatsError2(s, ErrorCode.NATS_PROTOCOL_ERR);
        }
    }
    processMsg(msg, data) {
        this.inMsgs++;
        this.inBytes += data.length;
        if (!this.subscriptions.sidCounter) {
            return;
        }
        const sub = this.subscriptions.get(msg.sid);
        if (!sub) {
            return;
        }
        sub.received += 1;
        if (sub.callback) {
            sub.callback(null, new MsgImpl(msg, data, this));
        }
        if (sub.max !== undefined && sub.received >= sub.max) {
            sub.unsubscribe();
        }
    }
    async processError(m) {
        const s = fastDecoder(m);
        const err = ProtocolHandler.toError(s);
        this.subscriptions.handleError(err);
        await this._close(err);
    }
    processPing() {
        this.transport.send(PONG_CMD);
    }
    processPong() {
        const cb = this.pongs.shift();
        if (cb) {
            cb.resolve();
        }
    }
    processInfo(m) {
        const info = JSON.parse(fastDecoder(m));
        this.info = info;
        const updates = this.options && this.options.ignoreClusterUpdates ? undefined : this.servers.update(info);
        if (!this.infoReceived) {
            this.infoReceived = true;
            if (this.transport.isEncrypted()) {
                this.servers.updateTLSName();
            }
            const { version , lang  } = this.transport;
            try {
                const c = new Connect({
                    version,
                    lang
                }, this.options, info.nonce);
                const cs = JSON.stringify(c);
                this.transport.send(fastEncoder(`CONNECT ${cs}${CR_LF}`));
                this.transport.send(PING_CMD);
            } catch (err) {
                this._close(NatsError2.errorForCode(ErrorCode.BAD_AUTHENTICATION, err));
            }
        }
        if (updates) {
            this.dispatchStatus({
                type: Events.UPDATE,
                data: updates
            });
        }
        const ldm = info.ldm !== undefined ? info.ldm : false;
        if (ldm) {
            this.dispatchStatus({
                type: Events.LDM,
                data: this.servers.getCurrentServer().toString()
            });
        }
    }
    push(e) {
        switch(e.kind){
            case Kind.MSG:
                {
                    const { msg: msg2 , data: data2  } = e;
                    this.processMsg(msg2, data2);
                    break;
                }
            case Kind.OK: break;
            case Kind.ERR:
                this.processError(e.data);
                break;
            case Kind.PING:
                this.processPing();
                break;
            case Kind.PONG:
                this.processPong();
                break;
            case Kind.INFO:
                this.processInfo(e.data);
                break;
        }
    }
    sendCommand(cmd, ...payloads) {
        const len = this.outbound.length();
        let buf;
        if (typeof cmd === "string") {
            buf = fastEncoder(cmd);
        } else {
            buf = cmd;
        }
        this.outbound.fill(buf, ...payloads);
        if (len === 0) {
            setTimeout(()=>{
                this.flushPending();
            });
        } else if (this.outbound.size() >= this.pendingLimit) {
            this.flushPending();
        }
    }
    publish(subject, data, options) {
        if (this.isClosed()) {
            throw NatsError2.errorForCode(ErrorCode.CONNECTION_CLOSED);
        }
        if (this.noMorePublishing) {
            throw NatsError2.errorForCode(ErrorCode.CONNECTION_DRAINING);
        }
        let len = data.length;
        options = options || {
        };
        options.reply = options.reply || "";
        let headers1 = Empty;
        let hlen = 0;
        if (options.headers) {
            if (!this.options.headers) {
                throw new NatsError2("headers", ErrorCode.SERVER_OPTION_NA);
            }
            const hdrs = options.headers;
            headers1 = hdrs.encode();
            hlen = headers1.length;
            len = data.length + hlen;
        }
        if (this.info && len > this.info.max_payload) {
            throw NatsError2.errorForCode(ErrorCode.MAX_PAYLOAD_EXCEEDED);
        }
        this.outBytes += len;
        this.outMsgs++;
        let proto;
        if (options.headers) {
            if (options.reply) {
                proto = `HPUB ${subject} ${options.reply} ${hlen} ${len}${CR_LF}`;
            } else {
                proto = `HPUB ${subject} ${hlen} ${len}\r\n`;
            }
            this.sendCommand(proto, headers1, data, CRLF);
        } else {
            if (options.reply) {
                proto = `PUB ${subject} ${options.reply} ${len}\r\n`;
            } else {
                proto = `PUB ${subject} ${len}\r\n`;
            }
            this.sendCommand(proto, data, CRLF);
        }
    }
    request(r) {
        this.initMux();
        this.muxSubscriptions.add(r);
        return r;
    }
    subscribe(s) {
        this.subscriptions.add(s);
        if (s.queue) {
            this.sendCommand(`SUB ${s.subject} ${s.queue} ${s.sid}\r\n`);
        } else {
            this.sendCommand(`SUB ${s.subject} ${s.sid}\r\n`);
        }
        if (s.max) {
            this.unsubscribe(s, s.max);
        }
        return s;
    }
    unsubscribe(s, max) {
        this.unsub(s, max);
        if (s.max === undefined || s.received >= s.max) {
            this.subscriptions.cancel(s);
        }
    }
    unsub(s, max) {
        if (!s || this.isClosed()) {
            return;
        }
        if (max) {
            this.sendCommand(`UNSUB ${s.sid} ${max}${CR_LF}`);
        } else {
            this.sendCommand(`UNSUB ${s.sid}${CR_LF}`);
        }
        s.max = max;
    }
    flush(p) {
        if (!p) {
            p = deferred();
        }
        this.pongs.push(p);
        this.sendCommand(PING_CMD);
        return p;
    }
    sendSubscriptions() {
        const cmds = [];
        this.subscriptions.all().forEach((s)=>{
            const sub = s;
            if (s.queue) {
                cmds.push(`SUB ${s.subject} ${s.queue} ${s.sid}${CR_LF}`);
            } else {
                cmds.push(`SUB ${s.subject} ${s.sid}${CR_LF}`);
            }
        });
        if (cmds.length) {
            this.transport.send(fastEncoder(cmds.join("")));
        }
    }
    async _close(err) {
        if (this._closed) {
            return;
        }
        this.heartbeats.cancel();
        if (this.connectError) {
            this.connectError(err);
            this.connectError = undefined;
        }
        this.muxSubscriptions.close();
        this.subscriptions.close();
        this.listeners.forEach((l)=>{
            l.stop();
        });
        this._closed = true;
        await this.transport.close(err);
        await this.closed.resolve(err);
    }
    close() {
        return this._close();
    }
    isClosed() {
        return this._closed;
    }
    drain() {
        const subs = this.subscriptions.all();
        const promises = [];
        subs.forEach((sub)=>{
            promises.push(sub.drain());
        });
        return Promise.all(promises).then(async ()=>{
            this.noMorePublishing = true;
            await this.flush();
            return this.close();
        }).catch(()=>{
        });
    }
    flushPending() {
        if (!this.infoReceived || !this.connected) {
            return;
        }
        if (this.outbound.size()) {
            const d = this.outbound.drain();
            this.transport.send(d);
        }
    }
    initMux() {
        const mux = this.subscriptions.getMux();
        if (!mux) {
            const inbox = this.muxSubscriptions.init();
            const sub = new SubscriptionImpl(this, `${inbox}*`);
            sub.callback = this.muxSubscriptions.dispatcher();
            this.subscriptions.setMux(sub);
            this.subscribe(sub);
        }
    }
    selectServer() {
        const server = this.servers.selectServer();
        if (server === undefined) {
            return undefined;
        }
        this.server = server;
        return this.server;
    }
    getServer() {
        return this.server;
    }
}
class Request1 {
    constructor(mux, opts4 = {
        timeout: 1000
    }){
        this.mux = mux;
        this.received = 0;
        this.deferred = deferred();
        this.token = nuid.next();
        extend(this, opts4);
        this.timer = timeout(opts4.timeout);
    }
    resolver(err, msg) {
        if (this.timer) {
            this.timer.cancel();
        }
        if (err) {
            this.deferred.reject(err);
        } else {
            this.deferred.resolve(msg);
        }
        this.cancel();
    }
    cancel(err) {
        if (this.timer) {
            this.timer.cancel();
        }
        this.mux.cancel(this);
        this.deferred.reject(err ? err : NatsError2.errorForCode(ErrorCode.CANCELLED));
    }
}
function JSONCodec() {
    return {
        encode (d) {
            try {
                if (d === undefined) {
                    d = null;
                }
                return TE.encode(JSON.stringify(d));
            } catch (err) {
                throw NatsError2.errorForCode(ErrorCode.BAD_JSON, err);
            }
        },
        decode (a) {
            try {
                return JSON.parse(TD.decode(a));
            } catch (err) {
                throw NatsError2.errorForCode(ErrorCode.BAD_JSON, err);
            }
        }
    };
}
class Bench {
    constructor(nc, opts5 = {
        msgs: 100000,
        size: 128,
        subject: "",
        asyncRequests: false,
        pub: false,
        sub: false,
        req: false,
        rep: false
    }){
        this.nc = nc;
        this.callbacks = opts5.callbacks || false;
        this.msgs = opts5.msgs || 0;
        this.size = opts5.size || 0;
        this.subject = opts5.subject || nuid.next();
        this.asyncRequests = opts5.asyncRequests || false;
        this.pub = opts5.pub || false;
        this.sub = opts5.sub || false;
        this.req = opts5.req || false;
        this.rep = opts5.rep || false;
        this.perf = new Perf();
        this.payload = this.size ? new Uint8Array(this.size) : Empty;
        if (!this.pub && !this.sub && !this.req && !this.rep) {
            throw new Error("No bench option selected");
        }
    }
    async run() {
        this.nc.closed().then((err)=>{
            if (err) {
                throw new NatsError2(`bench closed with an error: ${err.message}`, ErrorCode.UNKNOWN, err);
            }
        });
        if (this.callbacks) {
            await this.runCallbacks();
        } else {
            await this.runAsync();
        }
        return this.processMetrics();
    }
    processMetrics() {
        const nc1 = this.nc;
        const { lang , version  } = nc1.protocol.transport;
        if (this.pub && this.sub) {
            this.perf.measure("pubsub", "pubStart", "subStop");
        }
        const measures = this.perf.getEntries();
        const pubsub = measures.find((m)=>m.name === "pubsub"
        );
        const req = measures.find((m)=>m.name === "req"
        );
        const pub = measures.find((m)=>m.name === "pub"
        );
        const sub = measures.find((m)=>m.name === "sub"
        );
        const stats = this.nc.stats();
        const metrics = [];
        if (pubsub) {
            const { name: name1 , duration: duration1  } = pubsub;
            const m = new Metric(name1, duration1);
            m.msgs = this.msgs * 2;
            m.bytes = stats.inBytes + stats.outBytes;
            m.lang = lang;
            m.version = version;
            m.payload = this.payload.length;
            metrics.push(m);
        }
        if (pub) {
            const { name: name1 , duration: duration1  } = pub;
            const m = new Metric(name1, duration1);
            m.msgs = this.msgs;
            m.bytes = stats.outBytes;
            m.lang = lang;
            m.version = version;
            m.payload = this.payload.length;
            metrics.push(m);
        }
        if (sub) {
            const { name: name1 , duration: duration1  } = sub;
            const m = new Metric(name1, duration1);
            m.msgs = this.msgs;
            m.bytes = stats.inBytes;
            m.lang = lang;
            m.version = version;
            m.payload = this.payload.length;
            metrics.push(m);
        }
        if (req) {
            const { name: name1 , duration: duration1  } = req;
            const m = new Metric(name1, duration1);
            m.msgs = this.msgs * 2;
            m.bytes = stats.inBytes + stats.outBytes;
            m.lang = lang;
            m.version = version;
            m.payload = this.payload.length;
            metrics.push(m);
        }
        return metrics;
    }
    async runCallbacks() {
        const jobs = [];
        if (this.req) {
            const d = deferred();
            jobs.push(d);
            const sub = this.nc.subscribe(this.subject, {
                max: this.msgs,
                callback: (_, m)=>{
                    m.respond(this.payload);
                    if (sub.getProcessed() === this.msgs) {
                        d.resolve();
                    }
                }
            });
        }
        if (this.sub) {
            const d = deferred();
            jobs.push(d);
            let i = 0;
            const sub = this.nc.subscribe(this.subject, {
                max: this.msgs,
                callback: (_, msg2)=>{
                    i++;
                    if (i === 1) {
                        this.perf.mark("subStart");
                    }
                    if (i === this.msgs) {
                        this.perf.mark("subStop");
                        this.perf.measure("sub", "subStart", "subStop");
                        d.resolve();
                    }
                }
            });
        }
        if (this.pub) {
            const job = (async ()=>{
                this.perf.mark("pubStart");
                for(let i = 0; i < this.msgs; i++){
                    this.nc.publish(this.subject, this.payload);
                }
                await this.nc.flush();
                this.perf.mark("pubStop");
                this.perf.measure("pub", "pubStart", "pubStop");
            })();
            jobs.push(job);
        }
        if (this.req) {
            const job = (async ()=>{
                if (this.asyncRequests) {
                    this.perf.mark("reqStart");
                    const a = [];
                    for(let i = 0; i < this.msgs; i++){
                        a.push(this.nc.request(this.subject, this.payload, {
                            timeout: 20000
                        }));
                    }
                    await Promise.all(a);
                    this.perf.mark("reqStop");
                    this.perf.measure("req", "reqStart", "reqStop");
                } else {
                    this.perf.mark("reqStart");
                    for(let i = 0; i < this.msgs; i++){
                        await this.nc.request(this.subject);
                    }
                    this.perf.mark("reqStop");
                    this.perf.measure("req", "reqStart", "reqStop");
                }
            })();
            jobs.push(job);
        }
        await Promise.all(jobs);
    }
    async runAsync() {
        const jobs = [];
        if (this.req) {
            const sub = this.nc.subscribe(this.subject, {
                max: this.msgs
            });
            const job = (async ()=>{
                for await (const m of sub){
                    m.respond(this.payload);
                }
            })();
            jobs.push(job);
        }
        if (this.sub) {
            let first = false;
            const sub = this.nc.subscribe(this.subject, {
                max: this.msgs
            });
            const job = (async ()=>{
                for await (const m of sub){
                    if (!first) {
                        this.perf.mark("subStart");
                        first = true;
                    }
                }
                this.perf.mark("subStop");
                this.perf.measure("sub", "subStart", "subStop");
            })();
            jobs.push(job);
        }
        if (this.pub) {
            const job = (async ()=>{
                this.perf.mark("pubStart");
                for(let i = 0; i < this.msgs; i++){
                    this.nc.publish(this.subject, this.payload);
                }
                await this.nc.flush();
                this.perf.mark("pubStop");
                this.perf.measure("pub", "pubStart", "pubStop");
            })();
            jobs.push(job);
        }
        if (this.req) {
            const job = (async ()=>{
                if (this.asyncRequests) {
                    this.perf.mark("reqStart");
                    const a = [];
                    for(let i = 0; i < this.msgs; i++){
                        a.push(this.nc.request(this.subject, this.payload, {
                            timeout: 20000
                        }));
                    }
                    await Promise.all(a);
                    this.perf.mark("reqStop");
                    this.perf.measure("req", "reqStart", "reqStop");
                } else {
                    this.perf.mark("reqStart");
                    for(let i = 0; i < this.msgs; i++){
                        await this.nc.request(this.subject);
                    }
                    this.perf.mark("reqStop");
                    this.perf.measure("req", "reqStart", "reqStop");
                }
            })();
            jobs.push(job);
        }
        await Promise.all(jobs);
    }
}
const NatsError1 = NatsError2;
const MsgImpl1 = MsgImpl;
const SubscriptionImpl1 = SubscriptionImpl;
const ProtocolHandler1 = ProtocolHandler;
const timeout1 = timeout;
const headers1 = headers;
const MsgHdrsImpl1 = MsgHdrsImpl;
const MuxSubscription1 = MuxSubscription;
const Request2 = Request1;
const JSONCodec1 = JSONCodec;
const QueuedIterator1 = QueuedIterator;
const Bench1 = Bench;
function parseOptions(opts6) {
    opts6 = opts6 || {
        servers: [
            DEFAULT_HOSTPORT
        ]
    };
    if (opts6.port) {
        opts6.servers = [
            `${DEFAULT_HOST}:${opts6.port}`
        ];
    }
    if (typeof opts6.servers === "string") {
        opts6.servers = [
            opts6.servers
        ];
    }
    if (opts6.servers && opts6.servers.length === 0) {
        opts6.servers = [
            DEFAULT_HOSTPORT
        ];
    }
    const options2 = extend(defaultOptions(), opts6);
    if (opts6.user && opts6.token) {
        throw NatsError2.errorForCode(ErrorCode.BAD_AUTHENTICATION);
    }
    if (opts6.authenticator && (opts6.token || opts6.user || opts6.pass)) {
        throw NatsError2.errorForCode(ErrorCode.BAD_AUTHENTICATION);
    }
    options2.authenticator = buildAuthenticator(options2);
    [
        "reconnectDelayHandler",
        "authenticator"
    ].forEach((n)=>{
        if (options2[n] && typeof options2[n] !== "function") {
            throw new NatsError2(`${n} option should be a function`, ErrorCode.NOT_FUNC);
        }
    });
    if (!options2.reconnectDelayHandler) {
        options2.reconnectDelayHandler = ()=>{
            let extra = options2.tls ? options2.reconnectJitterTLS : options2.reconnectJitter;
            if (extra) {
                extra++;
                extra = Math.floor(Math.random() * extra);
            }
            return options2.reconnectTimeWait + extra;
        };
    }
    return options2;
}
function checkOptions(info, options2) {
    const { proto , headers: headers2 , tls_required: tlsRequired  } = info;
    if ((proto === undefined || proto < 1) && options2.noEcho) {
        throw new NatsError2("noEcho", ErrorCode.SERVER_OPTION_NA);
    }
    if ((proto === undefined || proto < 1) && options2.headers) {
        throw new NatsError2("headers", ErrorCode.SERVER_OPTION_NA);
    }
    if (options2.headers && headers2 !== true) {
        throw new NatsError2("headers", ErrorCode.SERVER_OPTION_NA);
    }
    if ((proto === undefined || proto < 1) && options2.noResponders) {
        throw new NatsError2("noResponders", ErrorCode.SERVER_OPTION_NA);
    }
    if (!headers2 && options2.noResponders) {
        throw new NatsError2("noResponders - requires headers", ErrorCode.SERVER_OPTION_NA);
    }
    if (options2.tls && !tlsRequired) {
        throw new NatsError2("tls", ErrorCode.SERVER_OPTION_NA);
    }
}
function credsAuthenticator(creds1) {
    const CREDS = /\s*(?:(?:[-]{3,}[^\n]*[-]{3,}\n)(.+)(?:\n\s*[-]{3,}[^\n]*[-]{3,}\n))/ig;
    const s = TD.decode(creds1);
    let m = CREDS.exec(s);
    if (!m) {
        throw NatsError.errorForCode(ErrorCode.BAD_CREDS);
    }
    const jwt = m[1].trim();
    m = CREDS.exec(s);
    if (!m) {
        throw NatsError.errorForCode(ErrorCode.BAD_CREDS);
    }
    const seed = TE.encode(m[1].trim());
    return jwtAuthenticator(jwt, seed);
}
const checkOptions1 = checkOptions;
const credsAuthenticator1 = credsAuthenticator;
class NatsConnectionImpl {
    constructor(opts6){
        this.draining = false;
        this.options = parseOptions(opts6);
        this.listeners = [];
    }
    static connect(opts = {
    }) {
        return new Promise((resolve, reject)=>{
            const nc1 = new NatsConnectionImpl(opts);
            ProtocolHandler.connect(nc1.options, nc1).then((ph1)=>{
                nc1.protocol = ph1;
                (async function() {
                    for await (const s of ph1.status()){
                        nc1.listeners.forEach((l)=>{
                            l.push(s);
                        });
                    }
                })();
                resolve(nc1);
            }).catch((err)=>{
                reject(err);
            });
        });
    }
    closed() {
        return this.protocol.closed;
    }
    async close() {
        await this.protocol.close();
    }
    publish(subject, data = Empty, options) {
        subject = subject || "";
        if (subject.length === 0) {
            throw NatsError2.errorForCode(ErrorCode.BAD_SUBJECT);
        }
        if (data && !isUint8Array(data)) {
            throw NatsError2.errorForCode(ErrorCode.BAD_PAYLOAD);
        }
        this.protocol.publish(subject, data, options);
    }
    subscribe(subject, opts = {
    }) {
        if (this.isClosed()) {
            throw NatsError2.errorForCode(ErrorCode.CONNECTION_CLOSED);
        }
        if (this.isDraining()) {
            throw NatsError2.errorForCode(ErrorCode.CONNECTION_DRAINING);
        }
        subject = subject || "";
        if (subject.length === 0) {
            throw NatsError2.errorForCode(ErrorCode.BAD_SUBJECT);
        }
        const sub = new SubscriptionImpl(this.protocol, subject, opts);
        this.protocol.subscribe(sub);
        return sub;
    }
    request(subject, data = Empty, opts = {
        timeout: 1000,
        noMux: false
    }) {
        if (this.isClosed()) {
            return Promise.reject(NatsError2.errorForCode(ErrorCode.CONNECTION_CLOSED));
        }
        if (this.isDraining()) {
            return Promise.reject(NatsError2.errorForCode(ErrorCode.CONNECTION_DRAINING));
        }
        subject = subject || "";
        if (subject.length === 0) {
            return Promise.reject(NatsError2.errorForCode(ErrorCode.BAD_SUBJECT));
        }
        opts.timeout = opts.timeout || 1000;
        if (opts.timeout < 1) {
            return Promise.reject(new NatsError2("timeout", ErrorCode.INVALID_OPTION));
        }
        if (!opts.noMux && opts.reply) {
            return Promise.reject(new NatsError2("reply can only be used with noMux", ErrorCode.INVALID_OPTION));
        }
        if (opts.noMux) {
            const inbox = opts.reply ? opts.reply : createInbox();
            const sub = this.subscribe(inbox, {
                max: 1,
                timeout: opts.timeout
            });
            this.publish(subject, data, {
                reply: inbox
            });
            const d = deferred();
            (async ()=>{
                for await (const msg2 of sub){
                    d.resolve(msg2);
                    break;
                }
            })().catch((err)=>{
                d.reject(err);
            });
            return d;
        } else {
            const r = new Request1(this.protocol.muxSubscriptions, opts);
            this.protocol.request(r);
            try {
                this.publish(subject, data, {
                    reply: `${this.protocol.muxSubscriptions.baseInbox}${r.token}`,
                    headers: opts.headers
                });
            } catch (err) {
                r.cancel(err);
            }
            const p = Promise.race([
                r.timer,
                r.deferred
            ]);
            p.catch(()=>{
                r.cancel();
            });
            return p;
        }
    }
    flush() {
        return this.protocol.flush();
    }
    drain() {
        if (this.isClosed()) {
            return Promise.reject(NatsError2.errorForCode(ErrorCode.CONNECTION_CLOSED));
        }
        if (this.isDraining()) {
            return Promise.reject(NatsError2.errorForCode(ErrorCode.CONNECTION_DRAINING));
        }
        this.draining = true;
        return this.protocol.drain();
    }
    isClosed() {
        return this.protocol.isClosed();
    }
    isDraining() {
        return this.draining;
    }
    getServer() {
        const srv = this.protocol.getServer();
        return srv ? srv.listen : "";
    }
    status() {
        const iter = new QueuedIterator();
        this.listeners.push(iter);
        return iter;
    }
    get info() {
        return this.protocol.isClosed() ? undefined : this.protocol.info;
    }
    stats() {
        return {
            inBytes: this.protocol.inBytes,
            outBytes: this.protocol.outBytes,
            inMsgs: this.protocol.inMsgs,
            outMsgs: this.protocol.outMsgs
        };
    }
}
const NatsConnectionImpl1 = NatsConnectionImpl;
export { NatsConnectionImpl1 as NatsConnectionImpl, Nuid1 as Nuid, nuid1 as nuid, ErrorCode1 as ErrorCode, NatsError1 as NatsError, DebugEvents1 as DebugEvents, Empty1 as Empty, Events1 as Events, MsgImpl1 as MsgImpl, SubscriptionImpl1 as SubscriptionImpl, Subscriptions1 as Subscriptions, setTransportFactory1 as setTransportFactory, setUrlParseFn1 as setUrlParseFn, Connect1 as Connect, createInbox1 as createInbox, INFO1 as INFO, ProtocolHandler1 as ProtocolHandler, deferred1 as deferred, delay1 as delay, extractProtocolMessage1 as extractProtocolMessage, render1 as render, timeout1 as timeout, headers1 as headers, MsgHdrsImpl1 as MsgHdrsImpl, Heartbeat1 as Heartbeat, MuxSubscription1 as MuxSubscription, DataBuffer1 as DataBuffer, checkOptions1 as checkOptions, Request2 as Request, credsAuthenticator1 as credsAuthenticator, jwtAuthenticator1 as jwtAuthenticator, nkeyAuthenticator1 as nkeyAuthenticator, JSONCodec1 as JSONCodec, StringCodec1 as StringCodec, nkeys, QueuedIterator1 as QueuedIterator, Kind1 as Kind, Parser1 as Parser, State1 as State, DenoBuffer1 as DenoBuffer, MAX_SIZE1 as MAX_SIZE, readAll1 as readAll, writeAll1 as writeAll, Bench1 as Bench, Metric1 as Metric, TD1 as TD, TE1 as TE, isIP1 as isIP, parseIP1 as parseIP };
class WsTransport {
    yields = [];
    signal = deferred();
    closedNotification = deferred();
    constructor(){
        this.version = VERSION;
        this.lang = LANG;
        this.connected = false;
        this.done = false;
        this.socketClosed = false;
        this.encrypted = false;
        this.peeked = false;
    }
    connect(server, options) {
        const connected = false;
        const connLock = deferred();
        if (options.tls) {
            connLock.reject(new NatsError2("tls", ErrorCode.INVALID_OPTION));
            return connLock;
        }
        this.options = options;
        const u2 = server.src;
        this.encrypted = u2.indexOf("wss://") === 0;
        this.socket = new WebSocket(u2);
        this.socket.binaryType = "arraybuffer";
        this.socket.onopen = ()=>{
        };
        this.socket.onmessage = (me)=>{
            this.yields.push(new Uint8Array(me.data));
            if (this.peeked) {
                this.signal.resolve();
                return;
            }
            const t = DataBuffer.concat(...this.yields);
            const pm = extractProtocolMessage(t);
            if (pm) {
                const m = INFO.exec(pm);
                if (!m) {
                    if (options.debug) {
                        console.error("!!!", render(t));
                    }
                    connLock.reject(new Error("unexpected response from server"));
                    return;
                }
                try {
                    const info = JSON.parse(m[1]);
                    checkOptions(info, this.options);
                    this.peeked = true;
                    this.connected = true;
                    this.signal.resolve();
                    connLock.resolve();
                } catch (err) {
                    connLock.reject(err);
                    return;
                }
            }
        };
        this.socket.onclose = (evt)=>{
            this.socketClosed = true;
            let reason;
            if (this.done) return;
            if (!evt.wasClean) {
                reason = new Error(evt.reason);
            }
            this._closed(reason);
        };
        this.socket.onerror = (e)=>{
            const evt = e;
            const err = new NatsError2(e.message, ErrorCode.UNKNOWN);
            if (!false) {
                connLock.reject(err);
            } else {
                this._closed(err);
            }
        };
        return connLock;
    }
    disconnect() {
        this._closed(undefined, true);
    }
    async _closed(err, internal = true) {
        if (!this.connected) return;
        if (this.done) return;
        this.closeError = err;
        if (!err) {
            while(!this.socketClosed && this.socket.bufferedAmount > 0){
                console.log(this.socket.bufferedAmount);
                await delay(100);
            }
        }
        this.done = true;
        try {
            this.socket.close(err ? 1002 : 1000, err ? err.message : undefined);
        } catch (err) {
        }
        if (internal) {
            this.closedNotification.resolve(err);
        }
    }
    get isClosed() {
        return this.done;
    }
    [Symbol.asyncIterator]() {
        return this.iterate();
    }
    async *iterate() {
        while(true){
            if (this.yields.length === 0) {
                await this.signal;
            }
            const yields = this.yields;
            this.yields = [];
            for(let i = 0; i < yields.length; i++){
                if (this.options.debug) {
                    console.info(`> ${render(yields[i])}`);
                }
                yield yields[i];
            }
            if (this.done) {
                break;
            } else if (this.yields.length === 0) {
                yields.length = 0;
                this.yields = yields;
                this.signal = deferred();
            }
        }
    }
    isEncrypted() {
        return this.connected && this.encrypted;
    }
    send(frame) {
        if (this.done) {
            return Promise.resolve();
        }
        try {
            this.socket.send(frame.buffer);
            if (this.options.debug) {
                console.info(`< ${render(frame)}`);
            }
            return Promise.resolve();
        } catch (err) {
            if (this.options.debug) {
                console.error(`!!! ${render(frame)}: ${err}`);
            }
            return Promise.reject(err);
        }
    }
    close(err) {
        return this._closed(err, false);
    }
    closed() {
        return this.closedNotification;
    }
}
function connect2(opts7 = {
}) {
    setUrlParseFn(wsUrlParseFn);
    setTransportFactory(()=>{
        return new WsTransport();
    });
    return NatsConnectionImpl.connect(opts7);
}
const connect1 = connect2;
export { connect1 as connect };
