﻿// All of this depends on KissProxy touching a video's webpage on BOTH services first (cookies and other things are set there) or else the RSK value will be bogus!

// KissAsian (eval($kissenc_kissasian_init); is called at service init time)
var _$_b192=["parse", "Hex", "enc", "responseText", "http://kissasian.yukitheater.org/External/RSK", "POST", "ajax", "SHA256", "32b812e9a1321ae0e84af660c4722b3a", "decrypt", "prototype", "Base64", "create", "CipherParams", "lib", "CBC", "mode", "Pkcs7", "pad", "AES", "Utf8", "toString", "", "$kissenc_kissasian"]
var $kissenc_kissasian_init = ((function () { var m = [75, 65, 81, 71, 70, 72, 85, 80, 88, 66, 82, 87, 76, 89, 90, 94, 60, 74, 79, 86]; var z = []; for (var g = 0; g < m.length; g++) z[m[g]] = g + 1; var p = []; for (var a = 0; a < arguments.length; a++) { var u = arguments[a].split('~'); for (var k = u.length - 1; k >= 0; k--) { var s = null; var j = u[k]; var f = null; var e = 0; var d = j.length; var l; for (var w = 0; w < d; w++) { var i = j.charCodeAt(w); var n = z[i]; if (n) { s = (n - 1) * 94 + j.charCodeAt(w + 1) - 32; l = w; w++; } else if (i == 96) { s = 94 * (m.length - 32 + j.charCodeAt(w + 1)) + j.charCodeAt(w + 2) - 32; l = w; w += 2; } else { continue; } if (f == null) f = []; if (l > e) f.push(j.substring(e, l)); f.push(u[s + 1]); e = w + 1; } if (f != null) { if (e < d) f.push(j.substring(e)); u[k] = f.join(''); } } p.push(u[0]); } var t = p.join(''); var c = 'abcdefghijklmnopqrstuvwxyz'; var x = [39, 126, 42, 10, 96, 92].concat(m); var o = String.fromCharCode(64); for (var g = 0; g < x.length; g++) t = t.split(o + c.charAt(g)).join(String.fromCharCode(x[g])); return t.split(o + '!').join(o); })('!function(d){function b(){f=K!2K"K#0]](c);K\'d=$K$6]]({url:K%4],type:K%5],async:!1,timeout:15000})K$3]];a=K!7]](d)}K\'f,a,c=K%8];bK$10K#9]]=function(d){K\'b=null;try{K\'c=K 4K"3K"2]]({ciphertext:K!2K"1K#0]](d)}),g=K 9K#9]](c,a,{mode:K 6K"5]],iv:f,padding:K 8K"7]]});return b=gK$21]](K!2K#20]])}catch(o){return K%22]}},dK$23]]= new b}(window)~K!1~Crypto@xSK$~K#1~]]K$~[K%~_$_b192[~","@~var '));

// KissCartoon (eval($kissenc_kisscartoon_init); is called at service init time)
var _$_1519=["parse", "Hex", "enc", "responseText", "http://kisscartoon.yukitheater.org/External/RSK", "POST", "ajax", "SHA256", "a5e8d2e9c1721ae0e84ad660c472c1f3", "decrypt", "prototype", "Base64", "create", "CipherParams", "lib", "CBC", "mode", "Pkcs7", "pad", "AES", "Utf8", "toString", "", "$kissenc_kisscartoon"]
var $kissenc_kisscartoon_init = ((function () { var j = [87, 81, 71, 65, 88, 75, 85, 70, 89, 66, 60, 76, 94, 72, 79, 86, 74, 82, 90, 80]; var a = []; for (var l = 0; l < j.length; l++) a[j[l]] = l + 1; var q = []; for (var t = 0; t < arguments.length; t++) { var n = arguments[t].split('~'); for (var s = n.length - 1; s >= 0; s--) { var d = null; var i = n[s]; var e = null; var g = 0; var r = i.length; var m; for (var y = 0; y < r; y++) { var p = i.charCodeAt(y); var b = a[p]; if (b) { d = (b - 1) * 94 + i.charCodeAt(y + 1) - 32; m = y; y++; } else if (p == 96) { d = 94 * (j.length - 32 + i.charCodeAt(y + 1)) + i.charCodeAt(y + 2) - 32; m = y; y += 2; } else { continue; } if (e == null) e = []; if (m > g) e.push(i.substring(g, m)); e.push(n[d + 1]); g = y + 1; } if (e != null) { if (g < r) e.push(i.substring(g)); n[s] = e.join(''); } } q.push(n[0]); } var k = q.join(''); var w = 'abcdefghijklmnopqrstuvwxyz'; var f = [42, 10, 96, 39, 126, 92].concat(j); var c = String.fromCharCode(64); for (var l = 0; l < f.length; l++) k = k.split(c + w.charAt(l)).join(String.fromCharCode(f[l])); return k.split(c + '!').join(c); })('!function(b){function f(){g=W!2W"W#0]](d);W\'b=$W$6]]({url:W%4],type:W%5],async:!1,timeout:15000})W$3]];a=W!7]](b)}W\'g,a,d=W%8];fW$10W#9]]=function(b){W\'f=null;try{W\'d=W 4W"3W"2]]({ciphertext:W!2W"1W#0]](b)}),h=W 9W#9]](d,a,{mode:W 6W"5]],iv:g,padding:W 8W"7]]});return f=hW$21]](W!2W#20]])}catch(c){return W%22]}},bW$23]]= new f}(window)~W!1~Crypto@wSW$~W#1~]]W$~[W%~_$_1519[~","@~var '));
