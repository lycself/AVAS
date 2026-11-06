const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./plotly.min-f1XCw4iF.js","./rolldown-runtime-CbXtAM7H.js","./AssistantPanel-DC3vb-zH.js","./util-B0YPkehR.js","./ProjectPage-BHIrdjDi.js","./BeamPage-BYRmdj6W.js","./types-MeRU5jgA.js","./common-D3nFlm-C.js","./FileHistory-D7RS-I_g.js","./preload-helper-uBIymjUX.js","./FileHistory-DXcZaCBW.css","./tables-DfT501da.js","./views-5ia4quqd.js","./restorationOrigin-CGt5rKvC.js","./widgets-B15sRySf.js","./LatticePage-BVw2uDV9.js","./LatticeEditor-D94JeDMu.js","./LayoutView-CwxQfC0A.js","./pointer-DVgIImTf.js","./LayoutView-DEZc0Pf2.css","./SettingsPage-BWE9q744.js","./FilesPage-ByVS5FRp.js","./RunPage-C2KGuop8.js","./ResultsPage-D7t6sd-c.js","./ScanPage-Beg3efBU.js"])))=>i.map(i=>d[i]);
import{n as e,t}from"./rolldown-runtime-CbXtAM7H.js";import{$ as n,A as r,At as i,Bt as a,C as o,Ct as s,D as c,E as l,Ft as u,G as d,H as f,I as p,J as m,K as h,L as g,M as _,N as v,Nt as y,O as b,Ot as x,P as S,Pt as ee,Q as te,R as C,Rt as w,S as ne,T as re,W as ie,X as ae,Y as oe,Z as se,_ as ce,_t as T,a as le,at as ue,b as de,c as fe,ct as pe,dt as E,et as me,ft as he,g as ge,gt as _e,it as D,j as ve,k as ye,kt as be,l as O,lt as k,m as xe,mt as Se,n as Ce,nt as we,o as Te,ot as A,p as Ee,pt as De,q as Oe,rt as ke,st as Ae,t as je,tt as Me,u as Ne,v as Pe,vt as Fe,w as Ie,wt as Le,xt as Re,y as ze,yt as Be,z as j,zt as Ve}from"./util-B0YPkehR.js";import{t as He}from"./preload-helper-uBIymjUX.js";import{a as Ue,i as We,n as Ge,r as Ke,t as qe}from"./pointer-DVgIImTf.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var Je=t((e=>{function t(e,t){var n=e.length;e.push(t);a:for(;0<n;){var r=n-1>>>1,a=e[r];if(0<i(a,t))e[r]=t,e[n]=a,n=r;else break a}}function n(e){return e.length===0?null:e[0]}function r(e){if(e.length===0)return null;var t=e[0],n=e.pop();if(n!==t){e[0]=n;a:for(var r=0,a=e.length,o=a>>>1;r<o;){var s=2*(r+1)-1,c=e[s],l=s+1,u=e[l];if(0>i(c,n))l<a&&0>i(u,c)?(e[r]=u,e[l]=n,r=l):(e[r]=c,e[s]=n,r=s);else if(l<a&&0>i(u,n))e[r]=u,e[l]=n,r=l;else break a}}return t}function i(e,t){var n=e.sortIndex-t.sortIndex;return n===0?e.id-t.id:n}if(e.unstable_now=void 0,typeof performance==`object`&&typeof performance.now==`function`){var a=performance;e.unstable_now=function(){return a.now()}}else{var o=Date,s=o.now();e.unstable_now=function(){return o.now()-s}}var c=[],l=[],u=1,d=null,f=3,p=!1,m=!1,h=!1,g=!1,_=typeof setTimeout==`function`?setTimeout:null,v=typeof clearTimeout==`function`?clearTimeout:null,y=typeof setImmediate<`u`?setImmediate:null;function b(e){for(var i=n(l);i!==null;){if(i.callback===null)r(l);else if(i.startTime<=e)r(l),i.sortIndex=i.expirationTime,t(c,i);else break;i=n(l)}}function x(e){if(h=!1,b(e),!m){if(n(c)!==null)m=!0,S||(S=!0,re());else{var t=n(l);t!==null&&oe(x,t.startTime-e)}}}var S=!1,ee=-1,te=5,C=-1;function w(){return g?!0:!(e.unstable_now()-C<te)}function ne(){if(g=!1,S){var t=e.unstable_now();C=t;var i=!0;try{a:{m=!1,h&&(h=!1,v(ee),ee=-1),p=!0;var a=f;try{b:{for(b(t),d=n(c);d!==null&&!(d.expirationTime>t&&w());){var o=d.callback;if(typeof o==`function`){d.callback=null,f=d.priorityLevel;var s=o(d.expirationTime<=t);if(t=e.unstable_now(),typeof s==`function`){d.callback=s,b(t),i=!0;break b}d===n(c)&&r(c),b(t)}else r(c);d=n(c)}if(d!==null)i=!0;else{var u=n(l);u!==null&&oe(x,u.startTime-t),i=!1}}break a}finally{d=null,f=a,p=!1}i=void 0}}finally{i?re():S=!1}}}var re;if(typeof y==`function`)re=function(){y(ne)};else if(typeof MessageChannel<`u`){var ie=new MessageChannel,ae=ie.port2;ie.port1.onmessage=ne,re=function(){ae.postMessage(null)}}else re=function(){_(ne,0)};function oe(t,n){ee=_(function(){t(e.unstable_now())},n)}e.unstable_IdlePriority=5,e.unstable_ImmediatePriority=1,e.unstable_LowPriority=4,e.unstable_NormalPriority=3,e.unstable_Profiling=null,e.unstable_UserBlockingPriority=2,e.unstable_cancelCallback=function(e){e.callback=null},e.unstable_forceFrameRate=function(e){0>e||125<e?console.error(`forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported`):te=0<e?Math.floor(1e3/e):5},e.unstable_getCurrentPriorityLevel=function(){return f},e.unstable_next=function(e){switch(f){case 1:case 2:case 3:var t=3;break;default:t=f}var n=f;f=t;try{return e()}finally{f=n}},e.unstable_requestPaint=function(){g=!0},e.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var n=f;f=e;try{return t()}finally{f=n}},e.unstable_scheduleCallback=function(r,i,a){var o=e.unstable_now();switch(typeof a==`object`&&a?(a=a.delay,a=typeof a==`number`&&0<a?o+a:o):a=o,r){case 1:var s=-1;break;case 2:s=250;break;case 5:s=1073741823;break;case 4:s=1e4;break;default:s=5e3}return s=a+s,r={id:u++,callback:i,priorityLevel:r,startTime:a,expirationTime:s,sortIndex:-1},a>o?(r.sortIndex=a,t(l,r),n(c)===null&&r===n(l)&&(h?(v(ee),ee=-1):h=!0,oe(x,a-o))):(r.sortIndex=s,t(c,r),m||p||(m=!0,S||(S=!0,re()))),r},e.unstable_shouldYield=w,e.unstable_wrapCallback=function(e){var t=f;return function(){var n=f;f=t;try{return e.apply(this,arguments)}finally{f=n}}}})),Ye=t(((e,t)=>{t.exports=Je()})),Xe=t((e=>{var t=a();function n(e){var t=`https://react.dev/errors/`+e;if(1<arguments.length){t+=`?args[]=`+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+=`&args[]=`+encodeURIComponent(arguments[n])}return`Minified React error #`+e+`; visit `+t+` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`}function r(){}var i={d:{f:r,r:function(){throw Error(n(522))},D:r,C:r,L:r,m:r,X:r,S:r,M:r},p:0,findDOMNode:null},o=Symbol.for(`react.portal`),s=Symbol.for(`react.recoverable`),c=Symbol.for(`react.optimistic_key`);function l(e,t,n){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:o,key:r==null?null:r===c?c:``+r,children:e,containerInfo:t,implementation:n}}var u=t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function d(e,t){if(e===`font`)return``;if(typeof t==`string`)return t===`use-credentials`?t:``}e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=i,e.browser=function(e){return{$$typeof:s,_reason:e}},e.createPortal=function(e,t){var r=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)throw Error(n(299));return l(e,t,null,r)},e.flushSync=function(e){var t=u.T,n=i.p;try{if(u.T=null,i.p=2,e)return e()}finally{u.T=t,i.p=n,i.d.f()}},e.preconnect=function(e,t){typeof e==`string`&&(t?(t=t.crossOrigin,t=typeof t==`string`?t===`use-credentials`?t:``:void 0):t=null,i.d.C(e,t))},e.prefetchDNS=function(e){typeof e==`string`&&i.d.D(e)},e.preinit=function(e,t){if(typeof e==`string`&&t&&typeof t.as==`string`){var n=t.as,r=d(n,t.crossOrigin),a=typeof t.integrity==`string`?t.integrity:void 0,o=typeof t.fetchPriority==`string`?t.fetchPriority:void 0;n===`style`?i.d.S(e,typeof t.precedence==`string`?t.precedence:void 0,{crossOrigin:r,integrity:a,fetchPriority:o}):n===`script`&&i.d.X(e,{crossOrigin:r,integrity:a,fetchPriority:o,nonce:typeof t.nonce==`string`?t.nonce:void 0})}},e.preinitModule=function(e,t){if(typeof e==`string`){if(typeof t==`object`&&t){if(t.as==null||t.as===`script`){var n=d(t.as,t.crossOrigin);i.d.M(e,{crossOrigin:n,integrity:typeof t.integrity==`string`?t.integrity:void 0,nonce:typeof t.nonce==`string`?t.nonce:void 0,fetchPriority:typeof t.fetchPriority==`string`?t.fetchPriority:void 0})}}else t??i.d.M(e)}},e.preload=function(e,t){if(typeof e==`string`&&typeof t==`object`&&t&&typeof t.as==`string`){var n=t.as,r=d(n,t.crossOrigin);i.d.L(e,n,{crossOrigin:r,integrity:typeof t.integrity==`string`?t.integrity:void 0,nonce:typeof t.nonce==`string`?t.nonce:void 0,type:typeof t.type==`string`?t.type:void 0,fetchPriority:typeof t.fetchPriority==`string`?t.fetchPriority:void 0,referrerPolicy:typeof t.referrerPolicy==`string`?t.referrerPolicy:void 0,imageSrcSet:typeof t.imageSrcSet==`string`?t.imageSrcSet:void 0,imageSizes:typeof t.imageSizes==`string`?t.imageSizes:void 0,media:typeof t.media==`string`?t.media:void 0})}},e.preloadModule=function(e,t){if(typeof e==`string`){if(t){var n=d(t.as,t.crossOrigin);i.d.m(e,{as:typeof t.as==`string`&&t.as!==`script`?t.as:void 0,crossOrigin:n,integrity:typeof t.integrity==`string`?t.integrity:void 0,nonce:typeof t.nonce==`string`?t.nonce:void 0,fetchPriority:typeof t.fetchPriority==`string`?t.fetchPriority:void 0})}else i.d.m(e)}},e.requestFormReset=function(e){i.d.r(e)},e.unstable_batchedUpdates=function(e,t){return e(t)},e.useFormState=function(e,t,n){return u.H.useFormState(e,t,n)},e.useFormStatus=function(){return u.H.useHostTransitionStatus()},e.version=`19.3.0`})),Ze=t(((e,t)=>{function n(){if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<`u`&&typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE==`function`)try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(e){console.error(e)}}n(),t.exports=Xe()})),Qe=t((e=>{var t=Ye(),n=a(),r=Ze();function i(e){var t=`https://react.dev/errors/`+e;if(1<arguments.length){t+=`?args[]=`+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+=`&args[]=`+encodeURIComponent(arguments[n])}return`Minified React error #`+e+`; visit `+t+` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`}function o(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function s(e){for(var t=e,n=t;n&&!n.alternate;)t=n,t.flags&4098&&(e=t.return),n=t.return;for(;t.return;)t=t.return;return t.tag===3?e:null}function c(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function l(e){if(e.tag===31){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function u(e){if(s(e)!==e)throw Error(i(188))}function d(e){var t=e.alternate;if(!t){if(t=s(e),t===null)throw Error(i(188));return t===e?e:null}for(var n=e,r=t;;){var a=n.return;if(a===null)break;var o=a.alternate;if(o===null){if(r=a.return,r!==null){n=r;continue}break}if(a.child===o.child){for(o=a.child;o;){if(o===n)return u(a),e;if(o===r)return u(a),t;o=o.sibling}throw Error(i(188))}if(n.return!==r.return)n=a,r=o;else{for(var c=!1,l=a.child;l;){if(l===n){c=!0,n=a,r=o;break}if(l===r){c=!0,r=a,n=o;break}l=l.sibling}if(!c){for(l=o.child;l;){if(l===n){c=!0,n=o,r=a;break}if(l===r){c=!0,r=o,n=a;break}l=l.sibling}if(!c)throw Error(i(189))}}if(n.alternate!==r)throw Error(i(190))}if(n.tag!==3)throw Error(i(188));return n.stateNode.current===n?e:t}function f(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=f(e),t!==null)return t;e=e.sibling}return null}function p(e,t,n,r,i,a){for(;e!==null;){if((e.tag===5||e.tag===27||e.tag===6)&&n(e,r,i,a)||(e.tag!==22||e.memoizedState===null)&&(t||e.tag!==5&&e.tag!==27)&&p(e.child,t,n,r,i,a))return!0;e=e.sibling}return!1}function m(e){for(e=e.return;e!==null;){if(e.tag===3||e.tag===5||e.tag===27)return e;e=e.return}return null}function h(e){var t=!1;for(e=e.return;e!==null&&(e.tag===4&&(t=!0),e.tag!==3&&e.tag!==5&&e.tag!==27);)e=e.return;return t}function g(e){var t=[null,null],n=m(e);return n===null||_(t,e,n.child,{foundSelf:!1}),t}function _(e,t,n,r){for(;n!==null;){if(n===t)r.foundSelf=!0;else if(n.tag===5||n.tag===27||n.tag===6){if(r.foundSelf)return e[1]=n,!0;e[0]=n}else if((n.tag!==22||n.memoizedState===null)&&_(e,t,n.child,r))return!0;n=n.sibling}return!1}function v(e){switch(e.tag){case 5:case 27:case 6:return e.stateNode;case 3:return e.stateNode.containerInfo;default:throw Error(i(559))}}var y=null,b=null;function x(e,t,n){return e===n||e===t&&(y=e,!0)}function S(e,t,n){return e===n?(b=e,!1):e===t&&(b!==null&&(y=e),!0)}function ee(e){if(e===null)return null;do e=e===null?null:e.return;while(e&&e.tag!==5&&e.tag!==27&&e.tag!==3);return e||null}function te(e,t,n){for(var r=0,i=e;i;i=n(i))r++;i=0;for(var a=t;a;a=n(a))i++;for(;0<r-i;)e=n(e),r--;for(;0<i-r;)t=n(t),i--;for(;r--;){if(e===t||t!==null&&e===t.alternate)return e;e=n(e),t=n(t)}return null}var C=Object.assign,w=Symbol.for(`react.element`),ne=Symbol.for(`react.transitional.element`),re=Symbol.for(`react.portal`),ie=Symbol.for(`react.fragment`),ae=Symbol.for(`react.strict_mode`),oe=Symbol.for(`react.profiler`),se=Symbol.for(`react.consumer`),ce=Symbol.for(`react.context`),T=Symbol.for(`react.forward_ref`),le=Symbol.for(`react.suspense`),ue=Symbol.for(`react.suspense_list`),de=Symbol.for(`react.memo`),fe=Symbol.for(`react.lazy`),pe=Symbol.for(`react.activity`),E=Symbol.for(`react.legacy_hidden`),me=Symbol.for(`react.memo_cache_sentinel`),he=Symbol.for(`react.view_transition`),ge=Symbol.for(`react.recoverable`),_e=Symbol.iterator;function D(e){return typeof e!=`object`||!e?null:(e=_e&&e[_e]||e[`@@iterator`],typeof e==`function`?e:null)}var ve=Symbol.for(`react.client.reference`);function ye(e){if(e==null)return null;if(typeof e==`function`)return e.$$typeof===ve?null:e.displayName||e.name||null;if(typeof e==`string`)return e;switch(e){case ie:return`Fragment`;case oe:return`Profiler`;case ae:return`StrictMode`;case le:return`Suspense`;case ue:return`SuspenseList`;case pe:return`Activity`;case he:return`ViewTransition`}if(typeof e==`object`)switch(e.$$typeof){case re:return`Portal`;case ce:return e.displayName||`Context`;case se:return(e._context.displayName||`Context`)+`.Consumer`;case T:var t=e.render;return e=e.displayName,e||=(e=t.displayName||t.name||``,e===``?`ForwardRef`:`ForwardRef(`+e+`)`),e;case de:return t=e.displayName||null,t===null?ye(e.type)||`Memo`:t;case fe:t=e._payload,e=e._init;try{return ye(e(t))}catch{}}return null}var be=Array.isArray,O=n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,k=r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,xe={pending:!1,data:null,method:null,action:null},Se=[],Ce=-1;function we(e){return{current:e}}function Te(e){0>Ce||(e.current=Se[Ce],Se[Ce]=null,Ce--)}function A(e,t){Ce++,Se[Ce]=e.current,e.current=t}var Ee=we(null),De=we(null),Oe=we(null),ke=we(null);function Ae(e,t){switch(A(Oe,t),A(De,e),A(Ee,null),t.nodeType){case 9:case 11:e=(e=t.documentElement)&&(e=e.namespaceURI)?up(e):0;break;default:if(e=t.tagName,t=t.namespaceURI)t=up(t),e=dp(t,e);else switch(e){case`svg`:e=1;break;case`math`:e=2;break;default:e=0}}Te(Ee),A(Ee,e)}function je(){Te(Ee),Te(De),Te(Oe)}function Me(e){var t=e.memoizedState;t!==null&&(sh._currentValue=t.memoizedState,A(ke,e)),t=Ee.current;var n=dp(t,e.type);t!==n&&(A(De,e),A(Ee,n))}function Ne(e){De.current===e&&(Te(Ee),Te(De)),ke.current===e&&(Te(ke),sh._currentValue=xe)}var Pe,Fe;function Ie(e){if(Pe===void 0)try{throw Error()}catch(e){var t=e.stack.trim().match(/\n( *(at )?)/);Pe=t&&t[1]||``,Fe=-1<e.stack.indexOf(`
    at`)?` (<anonymous>)`:-1<e.stack.indexOf(`@`)?`@unknown:0:0`:``}return`
`+Pe+e+Fe}var Le=!1;function Re(e,t){if(!e||Le)return``;Le=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var r={DetermineComponentFrameRoot:function(){try{if(t){var n=function(){throw Error()};if(Object.defineProperty(n.prototype,"props",{set:function(){throw Error()}}),typeof Reflect==`object`&&Reflect.construct){try{Reflect.construct(n,[])}catch(e){var r=e}Reflect.construct(e,[],n)}else{try{n.call()}catch(e){r=e}n=!1;try{var i=Object.getOwnPropertyDescriptor(e.prototype,`props`);Object.defineProperty(e.prototype,"props",{configurable:!0,set:function(){throw Error()}}),n=!0,new e}finally{n&&(i===void 0?delete e.prototype.props:Object.defineProperty(e.prototype,"props",i))}}}else{try{throw Error()}catch(e){r=e}(n=e())&&typeof n.catch==`function`&&n.catch(function(){})}}catch(e){if(e&&r&&typeof e.stack==`string`)return[e.stack,r.stack]}return[null,null]}};r.DetermineComponentFrameRoot.displayName=`DetermineComponentFrameRoot`;var i=Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot,`name`);i&&i.configurable&&Object.defineProperty(r.DetermineComponentFrameRoot,"name",{value:`DetermineComponentFrameRoot`});var a=r.DetermineComponentFrameRoot(),o=a[0],s=a[1];if(o&&s){var c=o.split(`
`),l=s.split(`
`);for(i=r=0;r<c.length&&!c[r].includes(`DetermineComponentFrameRoot`);)r++;for(;i<l.length&&!l[i].includes(`DetermineComponentFrameRoot`);)i++;if(r===c.length||i===l.length)for(r=c.length-1,i=l.length-1;1<=r&&0<=i&&c[r]!==l[i];)i--;for(;1<=r&&0<=i;r--,i--)if(c[r]!==l[i]){if(r!==1||i!==1)do if(r--,i--,0>i||c[r]!==l[i]){var u=`
`+c[r].replace(` at new `,` at `);return e.displayName&&u.includes(`<anonymous>`)&&(u=u.replace(`<anonymous>`,e.displayName)),u}while(1<=r&&0<=i);break}}}finally{Le=!1,Error.prepareStackTrace=n}return(n=e?e.displayName||e.name:``)?Ie(n):``}function ze(e,t){switch(e.tag){case 26:case 27:case 5:return Ie(e.type);case 16:return Ie(`Lazy`);case 13:return e.child!==t&&t!==null?Ie(`Suspense Fallback`):Ie(`Suspense`);case 19:return Ie(`SuspenseList`);case 0:case 15:return Re(e.type,!1);case 11:return Re(e.type.render,!1);case 1:return Re(e.type,!0);case 31:return Ie(`Activity`);case 30:return Ie(`ViewTransition`);default:return``}}function Be(e){try{var t=``,n=null;do t+=ze(e,n),n=e,e=e.return;while(e);return t}catch(e){return`
Error generating stack: `+e.message+`
`+e.stack}}var j=Object.prototype.hasOwnProperty,Ve=t.unstable_scheduleCallback,He=t.unstable_cancelCallback,Ue=t.unstable_shouldYield,We=t.unstable_requestPaint,Ge=t.unstable_now,Ke=t.unstable_getCurrentPriorityLevel,qe=t.unstable_ImmediatePriority,Je=t.unstable_UserBlockingPriority,Xe=t.unstable_NormalPriority,Qe=t.unstable_LowPriority,$e=t.unstable_IdlePriority,M=t.log,N=t.unstable_setDisableYieldValue,et=null,tt=null;function nt(e){if(typeof M==`function`&&N(e),tt&&typeof tt.setStrictMode==`function`)try{tt.setStrictMode(et,e)}catch{}}var rt=Math.clz32?Math.clz32:ot,it=Math.log,at=Math.LN2;function ot(e){return e>>>=0,e===0?32:31-(it(e)/at|0)|0}var st=256,ct=262144,lt=4194304;function ut(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return e&-e;case 262144:case 524288:case 1048576:case 2097152:return e&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function dt(e,t,n){var r=e.pendingLanes;if(r===0)return 0;var i=0,a=e.suspendedLanes,o=e.pingedLanes;e=e.warmLanes;var s=r&134217727;return s===0?(s=r&~a,s===0?o===0?n||(n=r&~e,n!==0&&(i=ut(n))):i=ut(o):i=ut(s)):(r=s&~a,r===0?(o&=s,o===0?n||(n=s&~e,n!==0&&(i=ut(n))):i=ut(o)):i=ut(r)),i===0?0:t!==0&&t!==i&&(t&a)===0&&(a=i&-i,n=t&-t,a>=n||a===32&&n&4194048)?t:i}function ft(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function pt(e,t){t&8&&(t|=t&32);var n=e.entangledLanes;if(n!==0)for(e=e.entanglements,n&=t;0<n;){var r=31-rt(n),i=1<<r;t|=e[r],n&=~i}return t}function mt(e,t){switch(e){case 1:case 2:case 4:case 8:case 64:return t+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function ht(){var e=lt;return lt<<=1,!(lt&62914560)&&(lt=4194304),e}function gt(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function _t(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function vt(e,t,n,r,i,a){var o=e.pendingLanes;e.pendingLanes=n,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=n,e.entangledLanes&=n,e.errorRecoveryDisabledLanes&=n,e.shellSuspendCounter=0;var s=e.entanglements,c=e.expirationTimes,l=e.hiddenUpdates;for(n=o&~n;0<n;){var u=31-rt(n),d=1<<u;s[u]=0,c[u]=-1;var f=l[u];if(f!==null)for(l[u]=null,u=0;u<f.length;u++){var p=f[u];p!==null&&(p.lane&=-536870913)}n&=~d}r!==0&&yt(e,r,0),a!==0&&i===0&&e.tag!==0&&(e.suspendedLanes|=a&~(o&~t))}function yt(e,t,n){e.pendingLanes|=t,e.suspendedLanes&=~t;var r=31-rt(t);e.entangledLanes|=t,e.entanglements[r]=e.entanglements[r]|1073741824|n&261930}function bt(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var r=31-rt(n),i=1<<r;i&t|e[r]&t&&(e[r]|=t),n&=~i}}function xt(e,t){var n=t&-t;return n=n&42?1:St(n),(n&(e.suspendedLanes|t))===0?n:0}function St(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function Ct(e){return e&=-e,2<e?8<e?e&134217727?32:268435456:8:2}function wt(){var e=k.p;return e===0?(e=window.event,e===void 0?32:Ch(e.type)):e}function Tt(e,t){var n=k.p;try{return k.p=e,t()}finally{k.p=n}}var Et=Math.random().toString(36).slice(2),Dt=`__reactFiber$`+Et,Ot=`__reactProps$`+Et,kt=`__reactContainer$`+Et,At=`__reactEvents$`+Et,jt=`__reactListeners$`+Et,Mt=`__reactHandles$`+Et,Nt=`__reactResources$`+Et,Pt=`__reactMarker$`+Et,Ft=`__reactLoad$`+Et;function It(e){delete e[Dt],delete e[Ot],delete e[jt],delete e[Mt]}function Lt(e){var t;if(t=e[Dt])return t;for(var n=e.parentNode;n;){if(t=n[kt]||n[Dt]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=fm(e);e!==null;){if(n=e[Dt])return n;e=fm(e)}return t}e=n,n=e.parentNode}return null}function Rt(e){if(e=e[Dt]||e[kt]){var t=e.tag;if(t===5||t===6||t===13||t===31||t===26||t===27||t===3)return e}return null}function zt(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error(i(33))}function Bt(e){var t=e[Nt];return t||=e[Nt]={hoistableStyles:new Map,hoistableScripts:new Map},t}function Vt(e){e[Pt]=!0}function Ht(e){e[Ft]=void 0}var Ut=new Set,Wt={};function Gt(e,t){Kt(e,t),Kt(e+`Capture`,t)}function Kt(e,t){for(Wt[e]=t,e=0;e<t.length;e++)Ut.add(t[e])}var qt=RegExp(`^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$`),Jt={},Yt={};function Xt(e){return j.call(Yt,e)?!0:j.call(Jt,e)?!1:qt.test(e)?Yt[e]=!0:(Jt[e]=!0,!1)}var P=!1;function Zt(){var e=P;return P=!1,e}function Qt(e,t,n){if(Xt(t)){if(n===null)e.removeAttribute(t);else{switch(typeof n){case`undefined`:case`function`:case`symbol`:e.removeAttribute(t);return;case`boolean`:var r=t.toLowerCase().slice(0,5);if(r!==`data-`&&r!==`aria-`){e.removeAttribute(t);return}}e.setAttribute(t,n)}}}function $t(e,t,n){if(n===null)e.removeAttribute(t);else{switch(typeof n){case`undefined`:case`function`:case`symbol`:case`boolean`:e.removeAttribute(t);return}e.setAttribute(t,n)}}function en(e,t,n,r){if(r===null)e.removeAttribute(n);else{switch(typeof r){case`undefined`:case`function`:case`symbol`:case`boolean`:e.removeAttribute(n);return}e.setAttributeNS(t,n,r)}}function tn(e){switch(typeof e){case`bigint`:case`boolean`:case`number`:case`string`:case`undefined`:return e;case`object`:return e;default:return``}}function nn(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()===`input`&&(t===`checkbox`||t===`radio`)}function rn(e,t,n){var r=Object.getOwnPropertyDescriptor(e.constructor.prototype,t);if(!e.hasOwnProperty(t)&&r!==void 0&&typeof r.get==`function`&&typeof r.set==`function`){var i=r.get,a=r.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return i.call(this)},set:function(e){n=``+e,a.call(this,e)}}),Object.defineProperty(e,t,{enumerable:r.enumerable}),{getValue:function(){return n},setValue:function(e){n=``+e},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function an(e){if(!e._valueTracker){var t=nn(e)?`checked`:`value`;e._valueTracker=rn(e,t,``+e[t])}}function on(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),r=``;return e&&(r=nn(e)?e.checked?`true`:`false`:e.value),e=r,e!==n&&(t.setValue(e),!0)}var sn=/[\n"\\]/g;function cn(e){return e.replace(sn,function(e){return`\\`+e.charCodeAt(0).toString(16)+` `})}function ln(e,t,n,r,i,a,o,s){e.name=``,o!=null&&typeof o!=`function`&&typeof o!=`symbol`&&typeof o!=`boolean`?e.type=o:e.removeAttribute(`type`),t==null?o!==`submit`&&o!==`reset`||e.removeAttribute(`value`):o===`number`?(t===0&&e.value===``||e.value!=t)&&(e.value=``+tn(t)):e.value!==``+tn(t)&&(e.value=``+tn(t)),t==null?n==null?r!=null&&e.removeAttribute(`value`):dn(e,tn(n)):o===`number`&&e.value==t?dn(e,tn(e.value)):dn(e,tn(t)),i==null&&a!=null&&(e.defaultChecked=!!a),i!=null&&(e.checked=i&&typeof i!=`function`&&typeof i!=`symbol`),s!=null&&typeof s!=`function`&&typeof s!=`symbol`&&typeof s!=`boolean`?e.name=``+tn(s):e.removeAttribute(`name`)}function un(e,t,n,r,i,a,o,s){if(a!=null&&typeof a!=`function`&&typeof a!=`symbol`&&typeof a!=`boolean`&&(e.type=a),t!=null||n!=null){if(!(a!==`submit`&&a!==`reset`||t!=null)){an(e);return}n=n==null?``:``+tn(n),t=t==null?n:``+tn(t),s||t===e.value||(e.value=t),e.defaultValue=t}r??=i,r=typeof r!=`function`&&typeof r!=`symbol`&&!!r,e.checked=s?e.checked:!!r,e.defaultChecked=!!r,o!=null&&typeof o!=`function`&&typeof o!=`symbol`&&typeof o!=`boolean`&&(e.name=o),an(e)}function dn(e,t){e.defaultValue!==``+t&&(e.defaultValue=``+t)}function fn(e,t,n,r){if(e=e.options,t){t={};for(var i=0;i<n.length;i++)t[`$`+n[i]]=!0;for(n=0;n<e.length;n++)i=t.hasOwnProperty(`$`+e[n].value),e[n].selected!==i&&(e[n].selected=i),i&&r&&(e[n].defaultSelected=!0)}else{for(n=``+tn(n),t=null,i=0;i<e.length;i++){if(e[i].value===n){e[i].selected=!0,r&&(e[i].defaultSelected=!0);return}t!==null||e[i].disabled||(t=e[i])}t!==null&&(t.selected=!0)}}function pn(e,t,n){if(t!=null&&(t=``+tn(t),t!==e.value&&(e.value=t),n==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=n==null?``:``+tn(n)}function mn(e,t,n,r){if(t==null){if(r!=null){if(n!=null)throw Error(i(92));if(be(r)){if(1<r.length)throw Error(i(93));r=r[0]}n=r}n??=``,t=n}n=tn(t),e.defaultValue=n,r=e.textContent,r===n&&r!==``&&r!==null&&(e.value=r),an(e)}function hn(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var gn=new Set(`animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp`.split(` `));function _n(e,t,n){var r=t.indexOf(`--`)===0;n==null||typeof n==`boolean`||n===``?r?e.setProperty(t,``):t===`float`?e.cssFloat=``:e[t]=``:r?e.setProperty(t,n):typeof n!=`number`||n===0||gn.has(t)?t===`float`?e.cssFloat=n:e[t]=(``+n).trim():e[t]=n+`px`}function vn(e,t,n){if(t!=null&&typeof t!=`object`)throw Error(i(62));if(e=e.style,n!=null){for(var r in n)!n.hasOwnProperty(r)||t!=null&&t.hasOwnProperty(r)||(r.indexOf(`--`)===0?e.setProperty(r,``):r===`float`?e.cssFloat=``:e[r]=``,P=!0);for(var a in t)r=t[a],t.hasOwnProperty(a)&&n[a]!==r&&(_n(e,a,r),P=!0)}else for(var o in t)t.hasOwnProperty(o)&&_n(e,o,t[o])}function yn(e){if(e.indexOf(`-`)===-1)return!1;switch(e){case`annotation-xml`:case`color-profile`:case`font-face`:case`font-face-src`:case`font-face-uri`:case`font-face-format`:case`font-face-name`:case`missing-glyph`:return!1;default:return!0}}var bn=new Map([[`acceptCharset`,`accept-charset`],[`htmlFor`,`for`],[`httpEquiv`,`http-equiv`],[`crossOrigin`,`crossorigin`],[`accentHeight`,`accent-height`],[`alignmentBaseline`,`alignment-baseline`],[`arabicForm`,`arabic-form`],[`baselineShift`,`baseline-shift`],[`capHeight`,`cap-height`],[`clipPath`,`clip-path`],[`clipRule`,`clip-rule`],[`colorInterpolation`,`color-interpolation`],[`colorInterpolationFilters`,`color-interpolation-filters`],[`colorProfile`,`color-profile`],[`colorRendering`,`color-rendering`],[`dominantBaseline`,`dominant-baseline`],[`enableBackground`,`enable-background`],[`fillOpacity`,`fill-opacity`],[`fillRule`,`fill-rule`],[`floodColor`,`flood-color`],[`floodOpacity`,`flood-opacity`],[`fontFamily`,`font-family`],[`fontSize`,`font-size`],[`fontSizeAdjust`,`font-size-adjust`],[`fontStretch`,`font-stretch`],[`fontStyle`,`font-style`],[`fontVariant`,`font-variant`],[`fontWeight`,`font-weight`],[`glyphName`,`glyph-name`],[`glyphOrientationHorizontal`,`glyph-orientation-horizontal`],[`glyphOrientationVertical`,`glyph-orientation-vertical`],[`horizAdvX`,`horiz-adv-x`],[`horizOriginX`,`horiz-origin-x`],[`imageRendering`,`image-rendering`],[`letterSpacing`,`letter-spacing`],[`lightingColor`,`lighting-color`],[`markerEnd`,`marker-end`],[`markerMid`,`marker-mid`],[`markerStart`,`marker-start`],[`maskType`,`mask-type`],[`overlinePosition`,`overline-position`],[`overlineThickness`,`overline-thickness`],[`paintOrder`,`paint-order`],[`panose-1`,`panose-1`],[`pointerEvents`,`pointer-events`],[`renderingIntent`,`rendering-intent`],[`shapeRendering`,`shape-rendering`],[`stopColor`,`stop-color`],[`stopOpacity`,`stop-opacity`],[`strikethroughPosition`,`strikethrough-position`],[`strikethroughThickness`,`strikethrough-thickness`],[`strokeDasharray`,`stroke-dasharray`],[`strokeDashoffset`,`stroke-dashoffset`],[`strokeLinecap`,`stroke-linecap`],[`strokeLinejoin`,`stroke-linejoin`],[`strokeMiterlimit`,`stroke-miterlimit`],[`strokeOpacity`,`stroke-opacity`],[`strokeWidth`,`stroke-width`],[`textAnchor`,`text-anchor`],[`textDecoration`,`text-decoration`],[`textRendering`,`text-rendering`],[`transformOrigin`,`transform-origin`],[`underlinePosition`,`underline-position`],[`underlineThickness`,`underline-thickness`],[`unicodeBidi`,`unicode-bidi`],[`unicodeRange`,`unicode-range`],[`unitsPerEm`,`units-per-em`],[`vAlphabetic`,`v-alphabetic`],[`vHanging`,`v-hanging`],[`vIdeographic`,`v-ideographic`],[`vMathematical`,`v-mathematical`],[`vectorEffect`,`vector-effect`],[`vertAdvY`,`vert-adv-y`],[`vertOriginX`,`vert-origin-x`],[`vertOriginY`,`vert-origin-y`],[`wordSpacing`,`word-spacing`],[`writingMode`,`writing-mode`],[`xmlnsXlink`,`xmlns:xlink`],[`xHeight`,`x-height`]]),xn=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function Sn(e){return xn.test(``+e)?`javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')`:e}function Cn(){}var wn=null;function Tn(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var En=null,Dn=null;function On(e){var t=Rt(e);if(t&&(e=t.stateNode)){var n=e[Ot]||null;a:switch(e=t.stateNode,t.type){case`input`:if(ln(e,n.value,n.defaultValue,n.defaultValue,n.checked,n.defaultChecked,n.type,n.name),t=n.name,n.type===`radio`&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll(`input[name="`+cn(``+t)+`"][type="radio"]`),t=0;t<n.length;t++){var r=n[t];if(r!==e&&r.form===e.form){var a=r[Ot]||null;if(!a)throw Error(i(90));ln(r,a.value,a.defaultValue,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name)}}for(t=0;t<n.length;t++)r=n[t],r.form===e.form&&on(r)}break a;case`textarea`:pn(e,n.value,n.defaultValue);break a;case`select`:t=n.value,t!=null&&fn(e,!!n.multiple,t,!1)}}}var kn=!1;function An(e,t,n){if(kn)return e(t,n);kn=!0;try{return e(t)}finally{if(kn=!1,(En!==null||Dn!==null)&&(zd(),En&&(t=En,e=Dn,Dn=En=null,On(t),e)))for(t=0;t<e.length;t++)On(e[t])}}function jn(e,t){var n=e.stateNode;if(n===null)return null;var r=n[Ot]||null;if(r===null)return null;n=r[t];a:switch(t){case`onClick`:case`onClickCapture`:case`onDoubleClick`:case`onDoubleClickCapture`:case`onMouseDown`:case`onMouseDownCapture`:case`onMouseMove`:case`onMouseMoveCapture`:case`onMouseUp`:case`onMouseUpCapture`:case`onMouseEnter`:(r=!r.disabled)||(e=e.type,r=e!==`button`&&e!==`input`&&e!==`select`&&e!==`textarea`),e=!r;break a;default:e=!1}if(e)return null;if(n&&typeof n!=`function`)throw Error(i(231,t,typeof n));return n}var Mn=typeof window<`u`&&window.document!==void 0&&window.document.createElement!==void 0,Nn=!1;if(Mn)try{var Pn={};Object.defineProperty(Pn,"passive",{get:function(){Nn=!0}}),window.addEventListener(`test`,Pn,Pn),window.removeEventListener(`test`,Pn,Pn)}catch{Nn=!1}var Fn=null,In=null,Ln=null;function Rn(){if(Ln)return Ln;var e,t=In,n=t.length,r,i=`value`in Fn?Fn.value:Fn.textContent,a=i.length;for(e=0;e<n&&t[e]===i[e];e++);var o=n-e;for(r=1;r<=o&&t[n-r]===i[a-r];r++);return Ln=i.slice(e,1<r?1-r:void 0)}function zn(e){var t=e.keyCode;return`charCode`in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function Bn(){return!0}function Vn(){return!1}function Hn(e){function t(t,n,r,i,a){for(var o in this._reactName=t,this._targetInst=r,this.type=n,this.nativeEvent=i,this.target=a,this.currentTarget=null,e)e.hasOwnProperty(o)&&(t=e[o],this[o]=t?t(i):i[o]);return this.isDefaultPrevented=(i.defaultPrevented==null?!1===i.returnValue:i.defaultPrevented)?Bn:Vn,this.isPropagationStopped=Vn,this}return C(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var e=this.nativeEvent;e&&(e.preventDefault?e.preventDefault():typeof e.returnValue!=`unknown`&&(e.returnValue=!1),this.isDefaultPrevented=Bn)},stopPropagation:function(){var e=this.nativeEvent;e&&(e.stopPropagation?e.stopPropagation():typeof e.cancelBubble!=`unknown`&&(e.cancelBubble=!0),this.isPropagationStopped=Bn)},persist:function(){},isPersistent:Bn}),t}var Un={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Wn=Hn(Un),Gn=C({},Un,{view:0,detail:0}),Kn=Hn(Gn),qn,Jn,Yn,Xn=C({},Gn,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:or,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return`movementX`in e?e.movementX:(e!==Yn&&(Yn&&e.type===`mousemove`?(qn=e.screenX-Yn.screenX,Jn=e.screenY-Yn.screenY):Jn=qn=0,Yn=e),qn)},movementY:function(e){return`movementY`in e?e.movementY:Jn}}),Zn=Hn(Xn),Qn=Hn(C({},Xn,{dataTransfer:0})),$n=Hn(C({},Gn,{relatedTarget:0})),er=Hn(C({},Un,{animationName:0,elapsedTime:0,pseudoElement:0})),tr=Hn(C({},Un,{clipboardData:function(e){return`clipboardData`in e?e.clipboardData:window.clipboardData}})),nr=Hn(C({},Un,{data:0})),rr={Esc:`Escape`,Spacebar:` `,Left:`ArrowLeft`,Up:`ArrowUp`,Right:`ArrowRight`,Down:`ArrowDown`,Del:`Delete`,Win:`OS`,Menu:`ContextMenu`,Apps:`ContextMenu`,Scroll:`ScrollLock`,MozPrintableKey:`Unidentified`},ir={8:`Backspace`,9:`Tab`,12:`Clear`,13:`Enter`,16:`Shift`,17:`Control`,18:`Alt`,19:`Pause`,20:`CapsLock`,27:`Escape`,32:` `,33:`PageUp`,34:`PageDown`,35:`End`,36:`Home`,37:`ArrowLeft`,38:`ArrowUp`,39:`ArrowRight`,40:`ArrowDown`,45:`Insert`,46:`Delete`,112:`F1`,113:`F2`,114:`F3`,115:`F4`,116:`F5`,117:`F6`,118:`F7`,119:`F8`,120:`F9`,121:`F10`,122:`F11`,123:`F12`,144:`NumLock`,145:`ScrollLock`,224:`Meta`},F={Alt:`altKey`,Control:`ctrlKey`,Meta:`metaKey`,Shift:`shiftKey`};function ar(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=F[e])?!!t[e]:!1}function or(){return ar}var sr=Hn(C({},Gn,{key:function(e){if(e.key){var t=rr[e.key]||e.key;if(t!==`Unidentified`)return t}return e.type===`keypress`?(e=zn(e),e===13?`Enter`:String.fromCharCode(e)):e.type===`keydown`||e.type===`keyup`?ir[e.keyCode]||`Unidentified`:``},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:or,charCode:function(e){return e.type===`keypress`?zn(e):0},keyCode:function(e){return e.type===`keydown`||e.type===`keyup`?e.keyCode:0},which:function(e){return e.type===`keypress`?zn(e):e.type===`keydown`||e.type===`keyup`?e.keyCode:0}})),cr=Hn(C({},Xn,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0})),lr=Hn(C({},Un,{submitter:0})),ur=Hn(C({},Gn,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:or})),dr=Hn(C({},Un,{propertyName:0,elapsedTime:0,pseudoElement:0})),fr=Hn(C({},Xn,{deltaX:function(e){return`deltaX`in e?e.deltaX:`wheelDeltaX`in e?-e.wheelDeltaX:0},deltaY:function(e){return`deltaY`in e?e.deltaY:`wheelDeltaY`in e?-e.wheelDeltaY:`wheelDelta`in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0})),pr=Hn(C({},Un,{newState:0,oldState:0,source:0})),mr=[9,13,27,32],hr=Mn&&`CompositionEvent`in window,gr=null;Mn&&`documentMode`in document&&(gr=document.documentMode);var _r=Mn&&`TextEvent`in window&&!gr,vr=Mn&&(!hr||gr&&8<gr&&11>=gr),yr=` `,br=!1;function xr(e,t){switch(e){case`keyup`:return mr.indexOf(t.keyCode)!==-1;case`keydown`:return t.keyCode!==229;case`keypress`:case`mousedown`:case`focusout`:return!0;default:return!1}}function Sr(e){return e=e.detail,typeof e==`object`&&`data`in e?e.data:null}var Cr=!1;function wr(e,t){switch(e){case`compositionend`:return Sr(t);case`keypress`:return t.which===32?(br=!0,yr):null;case`textInput`:return e=t.data,e===yr&&br?null:e;default:return null}}function Tr(e,t){if(Cr)return e===`compositionend`||!hr&&xr(e,t)?(e=Rn(),Ln=In=Fn=null,Cr=!1,e):null;switch(e){case`paste`:return null;case`keypress`:if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case`compositionend`:return vr&&t.locale!==`ko`?null:t.data;default:return null}}var Er={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Dr(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t===`input`?!!Er[e.type]:t===`textarea`}function Or(e,t,n,r){En?Dn?Dn.push(r):Dn=[r]:En=r,t=Jf(t,`onChange`),0<t.length&&(n=new Wn(`onChange`,`change`,null,n,r),e.push({event:n,listeners:t}))}var kr=null,Ar=null;function jr(e){Vf(e,0)}function Mr(e){if(on(zt(e)))return e}function Nr(e,t){if(e===`change`)return t}var Pr=!1;if(Mn){var Fr;if(Mn){var Ir=`oninput`in document;if(!Ir){var Lr=document.createElement(`div`);Lr.setAttribute(`oninput`,`return;`),Ir=typeof Lr.oninput==`function`}Fr=Ir}else Fr=!1;Pr=Fr&&(!document.documentMode||9<document.documentMode)}function Rr(){kr&&(kr.detachEvent(`onpropertychange`,zr),Ar=kr=null)}function zr(e){if(e.propertyName===`value`&&Mr(Ar)){var t=[];Or(t,Ar,e,Tn(e)),An(jr,t)}}function Br(e,t,n){e===`focusin`?(Rr(),kr=t,Ar=n,kr.attachEvent(`onpropertychange`,zr)):e===`focusout`&&Rr()}function Vr(e){if(e===`selectionchange`||e===`keyup`||e===`keydown`)return Mr(Ar)}function Hr(e,t){if(e===`click`)return Mr(t)}function Ur(e,t){if(e===`input`||e===`change`)return Mr(t)}function Wr(e,t){return e===t&&(e!==0||1/e==1/t)||e!==e&&t!==t}var Gr=typeof Object.is==`function`?Object.is:Wr;function Kr(e,t){if(Gr(e,t))return!0;if(typeof e!=`object`||!e||typeof t!=`object`||!t)return!1;var n=Object.keys(e),r=Object.keys(t);if(n.length!==r.length)return!1;for(r=0;r<n.length;r++){var i=n[r];if(!j.call(t,i)||!Gr(e[i],t[i]))return!1}return!0}function qr(e){if(e||=typeof document<`u`?document:void 0,e===void 0)return null;try{return e.activeElement||e.body}catch{return e.body}}function Jr(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function Yr(e,t){var n=Jr(e);e=0;for(var r;n;){if(n.nodeType===3){if(r=e+n.textContent.length,e<=t&&r>=t)return{node:n,offset:t-e};e=r}a:{for(;n;){if(n.nextSibling){n=n.nextSibling;break a}n=n.parentNode}n=void 0}n=Jr(n)}}function Xr(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?Xr(e,t.parentNode):`contains`in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function Zr(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=qr(e.document);t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href==`string`}catch{n=!1}if(n)e=t.contentWindow;else break;t=qr(e.document)}return t}function Qr(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t===`input`&&(e.type===`text`||e.type===`search`||e.type===`tel`||e.type===`url`||e.type===`password`)||t===`textarea`||e.contentEditable===`true`)}var $r=Mn&&`documentMode`in document&&11>=document.documentMode,ei=null,ti=null,ni=null,ri=!1;function ii(e,t,n){var r=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;ri||ei==null||ei!==qr(r)||(r=ei,`selectionStart`in r&&Qr(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),ni&&Kr(ni,r)||(ni=r,r=Jf(ti,`onSelect`),0<r.length&&(t=new Wn(`onSelect`,`select`,null,t,n),e.push({event:t,listeners:r}),t.target=ei)))}function ai(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n[`Webkit`+e]=`webkit`+t,n[`Moz`+e]=`moz`+t,n}var oi={animationend:ai(`Animation`,`AnimationEnd`),animationiteration:ai(`Animation`,`AnimationIteration`),animationstart:ai(`Animation`,`AnimationStart`),transitionrun:ai(`Transition`,`TransitionRun`),transitionstart:ai(`Transition`,`TransitionStart`),transitioncancel:ai(`Transition`,`TransitionCancel`),transitionend:ai(`Transition`,`TransitionEnd`)},si={},ci={};Mn&&(ci=document.createElement(`div`).style,`AnimationEvent`in window||(delete oi.animationend.animation,delete oi.animationiteration.animation,delete oi.animationstart.animation),`TransitionEvent`in window||delete oi.transitionend.transition);function li(e){if(si[e])return si[e];if(!oi[e])return e;var t=oi[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in ci)return si[e]=t[n];return e}var ui=li(`animationend`),di=li(`animationiteration`),fi=li(`animationstart`),pi=li(`transitionrun`),mi=li(`transitionstart`),hi=li(`transitioncancel`),gi=li(`transitionend`),_i=new Map,vi=`abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel`.split(` `);vi.push(`scrollEnd`);function yi(e,t){_i.set(e,t),Gt(t,[e])}var bi=0;function xi(e,t){if(e.name!=null&&e.name!==`auto`)return e.name;if(t.autoName!==null)return t.autoName;e=bd.identifierPrefix;var n=bi++;return e=`_`+e+`t_`+n.toString(32)+`_`,t.autoName=e}function Si(e){if(e==null||typeof e==`string`)return e;var t=null,n=Od;if(n!==null)for(var r=0;r<n.length;r++){var i=e[n[r]];if(i!=null){if(i===`none`)return`none`;t=t==null?i:t+(` `+i)}}return t??e.default}function Ci(e,t){return e=Si(e),t=Si(t),t==null?e===`auto`?null:e:t===`auto`?null:t}var wi=typeof reportError==`function`?reportError:function(e){if(typeof window==`object`&&typeof window.ErrorEvent==`function`){var t=new window.ErrorEvent(`error`,{bubbles:!0,cancelable:!0,message:typeof e==`object`&&e&&typeof e.message==`string`?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process==`object`&&typeof process.emit==`function`){process.emit(`uncaughtException`,e);return}console.error(e)},Ti=[],Ei=0,Di=0;function Oi(){for(var e=Ei,t=Di=Ei=0;t<e;){var n=Ti[t];Ti[t++]=null;var r=Ti[t];Ti[t++]=null;var i=Ti[t];Ti[t++]=null;var a=Ti[t];if(Ti[t++]=null,r!==null&&i!==null){var o=r.pending;o===null?i.next=i:(i.next=o.next,o.next=i),r.pending=i}a!==0&&ji(n,i,a)}}function ki(e,t,n,r){Ti[Ei++]=e,Ti[Ei++]=t,Ti[Ei++]=n,Ti[Ei++]=r,Di|=r,e.lanes|=r,e=e.alternate,e!==null&&(e.lanes|=r)}function Ai(e,t,n,r){return ki(e,t,n,r),Mi(e)}function I(e,t){return ki(e,null,null,t),Mi(e)}function ji(e,t,n){e.lanes|=n;var r=e.alternate;r!==null&&(r.lanes|=n);for(var i=!1,a=e.return;a!==null;)a.childLanes|=n,r=a.alternate,r!==null&&(r.childLanes|=n),a.tag===22&&(e=a.stateNode,e===null||e._visibility&1||(i=!0)),e=a,a=a.return;return e.tag===3?(a=e.stateNode,i&&t!==null&&(i=31-rt(n),e=a.hiddenUpdates,r=e[i],r===null?e[i]=[t]:r.push(t),t.lane=n|536870912),a):null}function Mi(e){if(50<kd)throw kd=0,Ad=null,Error(i(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var Ni={};function Pi(e,t,n,r){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function Fi(e,t,n,r){return new Pi(e,t,n,r)}function Ii(e){return e=e.prototype,!(!e||!e.isReactComponent)}function Li(e,t){var n=e.alternate;return n===null?(n=Fi(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&1206910976,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n.refCleanup=e.refCleanup,n}function Ri(e,t){e.flags&=1206910978;var n=e.alternate;return n===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=n.childLanes,e.lanes=n.lanes,e.child=n.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=n.memoizedProps,e.memoizedState=n.memoizedState,e.updateQueue=n.updateQueue,e.type=n.type,t=n.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function zi(e,t,n,r,a,o){var s=0;if(r=e,typeof r==`function`)Ii(r)&&(s=1);else if(typeof r==`string`)s=qm(e,n,Ee.current)?26:e===`html`||e===`head`||e===`body`?27:5;else a:switch(r){case pe:return e=Fi(31,n,t,a),e.elementType=pe,e.lanes=o,e;case ie:return Bi(n.children,a,o,t);case ae:s=8,a|=24;break;case oe:return e=Fi(12,n,t,a|2),e.elementType=oe,e.lanes=o,e;case le:return e=Fi(13,n,t,a),e.elementType=le,e.lanes=o,e;case ue:return e=Fi(19,n,t,a),e.elementType=ue,e.lanes=o,e;case E:case he:return e=a|32,e=Fi(30,n,t,e),e.elementType=he,e.lanes=o,e.stateNode={autoName:null,paired:null,clones:null,ref:null},e;default:if(typeof r==`object`&&r)switch(r.$$typeof){case ce:s=10;break a;case se:s=9;break a;case T:s=11;break a;case de:s=14;break a;case fe:s=16,r=null;break a}s=29,n=Error(i(130,e===null?`null`:typeof e,``)),r=null}return t=Fi(s,n,t,a),t.elementType=e,t.type=r,t.lanes=o,t}function Bi(e,t,n,r){return e=Fi(7,e,r,t),e.lanes=n,e}function Vi(e,t,n){return e=Fi(6,e,null,t),e.lanes=n,e}function Hi(e){var t=Fi(18,null,null,0);return t.stateNode=e,t}function Ui(e,t,n){return t=Fi(4,e.children===null?[]:e.children,e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}var Wi=new WeakMap;function Gi(e,t){if(typeof e==`object`&&e){var n=Wi.get(e);return n===void 0?(t={value:e,source:t,stack:Be(t)},Wi.set(e,t),t):n}return{value:e,source:t,stack:Be(t)}}var Ki=[],qi=0,Ji=null,Yi=0,Xi=[],Zi=0,Qi=null,$i=1,ea=``;function ta(e,t){Ki[qi++]=Yi,Ki[qi++]=Ji,Ji=e,Yi=t}function na(e,t,n){Xi[Zi++]=$i,Xi[Zi++]=ea,Xi[Zi++]=Qi,Qi=e;var r=$i;e=ea;var i=32-rt(r)-1;r&=~(1<<i),n+=1;var a=32-rt(t)+i;if(30<a){var o=i-i%5;a=(r&(1<<o)-1).toString(32),r>>=o,i-=o,$i=1<<32-rt(t)+i|n<<i|r,ea=a+e}else $i=1<<a|n<<i|r,ea=e}function ra(e){e.return!==null&&(ta(e,1),na(e,1,0))}function ia(e){for(;e===Ji;)Ji=Ki[--qi],Ki[qi]=null,Yi=Ki[--qi],Ki[qi]=null;for(;e===Qi;)Qi=Xi[--Zi],Xi[Zi]=null,ea=Xi[--Zi],Xi[Zi]=null,$i=Xi[--Zi],Xi[Zi]=null}function aa(e,t){Xi[Zi++]=$i,Xi[Zi++]=ea,Xi[Zi++]=Qi,$i=t.id,ea=t.overflow,Qi=e}var oa=null,L=null,R=!1,sa=null,ca=!1,la=Error(i(519));function ua(e){throw ga(Gi(Error(i(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?`text`:`HTML`,``)),e)),la}function da(e){var t=e.stateNode,n=e.type,r=e.memoizedProps;switch(t[Dt]=e,t[Ot]=r,n){case`dialog`:Q(`cancel`,t),Q(`close`,t);break;case`iframe`:case`object`:case`embed`:Q(`load`,t);break;case`video`:case`audio`:for(n=0;n<zf.length;n++)Q(zf[n],t);break;case`source`:Q(`error`,t);break;case`img`:case`image`:case`link`:Q(`error`,t),Q(`load`,t);break;case`details`:Q(`toggle`,t);break;case`input`:Q(`invalid`,t),un(t,r.value,r.defaultValue,r.checked,r.defaultChecked,r.type,r.name,!0);break;case`select`:Q(`invalid`,t);break;case`textarea`:Q(`invalid`,t),mn(t,r.value,r.defaultValue,r.children)}n=r.children,typeof n!=`string`&&typeof n!=`number`&&typeof n!=`bigint`||t.textContent===``+n||!0===r.suppressHydrationWarning||ep(t.textContent,n)?(r.popover!=null&&(Q(`beforetoggle`,t),Q(`toggle`,t)),r.onScroll!=null&&Q(`scroll`,t),r.onScrollEnd!=null&&Q(`scrollend`,t),r.onClick!=null&&(t.onclick=Cn),t=!0):t=!1,t||ua(e,!0)}function fa(e){for(oa=e.return;oa;)switch(oa.tag){case 5:case 31:case 13:ca=!1;return;case 27:case 3:ca=!0;return;default:oa=oa.return}}function pa(e){if(e!==oa)return!1;if(!R)return fa(e),R=!0,!1;var t=e.tag,n;if((n=t!==3&&t!==27)&&((n=t===5)&&(n=e.type,n=n===`form`||n===`button`||pp(e.type,e.memoizedProps)),n=!n),n&&L&&ua(e),fa(e),t===13){if(e=e.memoizedState,e=e===null?null:e.dehydrated,!e)throw Error(i(317));L=dm(e)}else if(t===31){if(e=e.memoizedState,e=e===null?null:e.dehydrated,!e)throw Error(i(317));L=dm(e)}else t===27?(t=L,Sp(e.type)?(e=um,um=null,L=e):L=t):L=oa?lm(e.stateNode.nextSibling):null;return!0}function ma(){L=oa=null,R=!1}function ha(){var e=sa;return e!==null&&(pd===null?pd=e:pd.push.apply(pd,e),sa=null),e}function ga(e){sa===null?sa=[e]:sa.push(e)}var _a=we(null),va=null,ya=null;function ba(e,t,n){A(_a,t._currentValue),t._currentValue=n}function xa(e){e._currentValue=_a.current,Te(_a)}function Sa(e,t,n){for(;e!==null;){var r=e.alternate;if((e.childLanes&t)===t?r!==null&&(r.childLanes&t)!==t&&(r.childLanes|=t):(e.childLanes|=t,r!==null&&(r.childLanes|=t)),e===n)break;e=e.return}}function Ca(e,t,n,r){var a=e.child;for(a!==null&&(a.return=e);a!==null;){var o=a.dependencies;if(o!==null){var s=a.child;o=o.firstContext;a:for(;o!==null;){var c=o;o=a;for(var l=0;l<t.length;l++)if(c.context===t[l]){o.lanes|=n,c=o.alternate,c!==null&&(c.lanes|=n),Sa(o.return,n,e),r||(s=null);break a}o=c.next}}else if(a.tag===18){if(s=a.return,s===null)throw Error(i(341));s.lanes|=n,o=s.alternate,o!==null&&(o.lanes|=n),Sa(s,n,e),s=null}else a.tag===13&&a.memoizedState!==null&&a.memoizedState.dehydrated===null?(a.lanes|=n,s=a.alternate,s!==null&&(s.lanes|=n),Sa(a.return,n,e),s=a.child,s=s===null?null:s.sibling):s=a.child;if(s!==null)s.return=a;else for(s=a;s!==null;){if(s===e){s=null;break}if(a=s.sibling,a!==null){a.return=s.return,s=a;break}s=s.return}a=s}}function wa(e,t,n,r){e=null;for(var a=t,o=!1;a!==null;){if(!o){if(a.flags&524288)o=!0;else if(a.flags&262144)break}if(a.tag===10){var s=a.alternate;if(s===null)throw Error(i(387));if(s=s.memoizedProps,s!==null){var c=a.type;Gr(a.pendingProps.value,s.value)||(e===null?e=[c]:e.push(c))}}else if(a===ke.current){if(s=a.alternate,s===null)throw Error(i(387));s.memoizedState.memoizedState!==a.memoizedState.memoizedState&&(e===null?e=[sh]:e.push(sh))}a=a.return}return e!==null&&Ca(t,e,n,r),t.flags|=262144,e!==null}function Ta(e){for(e=e.firstContext;e!==null;){if(!Gr(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function Ea(e){va=e,ya=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function Da(e){return ka(va,e)}function Oa(e,t){return va===null&&Ea(e),ka(e,t)}function ka(e,t){var n=t._currentValue;if(t={context:t,memoizedValue:n,next:null},ya===null){if(e===null)throw Error(i(308));ya=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else ya=ya.next=t;return n}var Aa=typeof AbortController<`u`?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(t,n){e.push(n)}};this.abort=function(){t.aborted=!0,e.forEach(function(e){return e()})}},ja=t.unstable_scheduleCallback,Ma=t.unstable_NormalPriority,Na={$$typeof:ce,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function Pa(){return{controller:new Aa,data:new Map,refCount:0}}function Fa(e){e.refCount--,e.refCount===0&&ja(Ma,function(){e.controller.abort()})}function Ia(e,t){if(e.pendingLanes&4194048){var n=e.transitionTypes;for(n===null&&(n=e.transitionTypes=[]),e=0;e<t.length;e++){var r=t[e];n.indexOf(r)===-1&&n.push(r)}}}var La=null;function Ra(e){var t=e.transitionTypes;return e.transitionTypes=null,t}var za=null,Ba=0,Va=0,Ha=null;function Ua(e,t){if(za===null){var n=za=[];Ba=0,Va=Pf(),Ha={status:`pending`,value:void 0,then:function(e){n.push(e)}}}return Ba++,t.then(Wa,Wa),t}function Wa(){if(--Ba===0&&(La=null,za!==null)){Ha!==null&&(Ha.status=`fulfilled`);var e=za;za=null,Va=0,Ha=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function Ga(e,t){var n=[],r={status:`pending`,value:null,reason:null,then:function(e){n.push(e)}};return e.then(function(){r.status=`fulfilled`,r.value=t;for(var e=0;e<n.length;e++)(0,n[e])(t)},function(e){for(r.status=`rejected`,r.reason=e,e=0;e<n.length;e++)(0,n[e])(void 0)}),r}var Ka=O.S;O.S=function(e,t){if(gd=Ge(),typeof t==`object`&&t&&typeof t.then==`function`&&Ua(e,t),La!==null)for(var n=bf;n!==null;)Ia(n,La),n=n.next;if(n=e.types,n!==null){for(var r=bf;r!==null;)Ia(r,n),r=r.next;if(Va!==0){r=La,r===null&&(r=La=[]);for(var i=0;i<n.length;i++){var a=n[i];r.indexOf(a)===-1&&r.push(a)}}}Ka!==null&&Ka(e,t)};var qa=we(null);function Ja(){var e=qa.current;return e===null?K.pooledCache:e}function Ya(e,t){t===null?A(qa,qa.current):A(qa,t.pool)}function Xa(){var e=Ja();return e===null?null:{parent:Na._currentValue,pool:e}}var Za=Error(i(460)),Qa=Error(i(474)),$a=Error(i(542)),eo={then:function(){}};function to(e){return e=e.status,e===`fulfilled`||e===`rejected`}function no(e,t,n){switch(n=e[n],n===void 0?e.push(t):n!==t&&(t.then(Cn,Cn),t=n),t.status){case`fulfilled`:return t.value;case`rejected`:throw e=t.reason,oo(e),e===void 0&&!(`reason`in t)?Error(i(600)):e;default:if(typeof t.status==`string`)t.then(Cn,Cn);else{if(e=K,e!==null&&100<e.shellSuspendCounter)throw Error(i(482));e=t,e.status=`pending`,e.then(function(e){if(t.status===`pending`){var n=t;n.status=`fulfilled`,n.value=e}},function(e){if(t.status===`pending`){var n=t;n.status=`rejected`,n.reason=e}})}switch(t.status){case`fulfilled`:return t.value;case`rejected`:throw e=t.reason,oo(e),e}throw io=t,Za}}function ro(e){try{var t=e._init;return t(e._payload)}catch(e){throw typeof e==`object`&&e&&typeof e.then==`function`?(io=e,Za):e}}var io=null;function ao(){if(io===null)throw Error(i(459));var e=io;return io=null,e}function oo(e){if(e===Za||e===$a)throw Error(i(483))}var so=null,co=0;function lo(e){var t=co;return co+=1,so===null&&(so=[]),no(so,e,t)}function uo(e,t){t=t.props.ref,e.ref=t===void 0?null:t}function fo(e,t){throw t.$$typeof===w?Error(i(525)):(e=Object.prototype.toString.call(t),Error(i(31,e===`[object Object]`?`object with keys {`+Object.keys(t).join(`, `)+`}`:e)))}function po(e){function t(t,n){if(e){var r=t.deletions;r===null?(t.deletions=[n],t.flags|=16):r.push(n)}}function n(n,r){if(!e)return null;for(;r!==null;)t(n,r),r=r.sibling;return null}function r(e){for(var t=new Map;e!==null;)e.key===null?t.set(e.index,e):t.set(e.key,e),e=e.sibling;return t}function a(e,t){return e=Li(e,t),e.index=0,e.sibling=null,e}function o(t,n,r){return t.index=r,e?(r=t.alternate,r===null?(t.flags|=134217730,n):(r=r.index,r<n?(t.flags|=2,n):r)):(t.flags|=1048576,n)}function s(t){return e&&t.alternate===null&&(t.flags|=134217730),t}function c(e,t,n,r){return t===null||t.tag!==6?(t=Vi(n,e.mode,r),t.return=e,t):(t=a(t,n),t.return=e,t)}function l(e,t,n,r){var i=n.type;return i===ie?(e=d(e,t,n.props.children,r,n.key),uo(e,n),e):t!==null&&(t.elementType===i||typeof i==`object`&&i&&i.$$typeof===fe&&ro(i)===t.type)?(t=a(t,n.props),uo(t,n),t.return=e,t):(t=zi(n.type,n.key,n.props,null,e.mode,r),uo(t,n),t.return=e,t)}function u(e,t,n,r){return t===null||t.tag!==4||t.stateNode.containerInfo!==n.containerInfo||t.stateNode.implementation!==n.implementation?(t=Ui(n,e.mode,r),t.return=e,t):(t=a(t,n.children||[]),t.return=e,t)}function d(e,t,n,r,i){return t===null||t.tag!==7?(t=Bi(n,e.mode,r,i),t.return=e,t):(t=a(t,n),t.return=e,t)}function f(e,t,n){if(typeof t==`string`&&t!==``||typeof t==`number`||typeof t==`bigint`)return t=Vi(``+t,e.mode,n),t.return=e,t;if(typeof t==`object`&&t){switch(t.$$typeof){case ne:return n=zi(t.type,t.key,t.props,null,e.mode,n),uo(n,t),n.return=e,n;case re:return t=Ui(t,e.mode,n),t.return=e,t;case fe:return t=ro(t),f(e,t,n)}if(be(t)||D(t))return t=Bi(t,e.mode,n,null),t.return=e,t;if(typeof t.then==`function`)return f(e,lo(t),n);if(t.$$typeof===ce)return f(e,Oa(e,t),n);fo(e,t)}return null}function p(e,t,n,r){var i=t===null?null:t.key;if(typeof n==`string`&&n!==``||typeof n==`number`||typeof n==`bigint`)return i===null?c(e,t,``+n,r):null;if(typeof n==`object`&&n){switch(n.$$typeof){case ne:return n.key===i?l(e,t,n,r):null;case re:return n.key===i?u(e,t,n,r):null;case fe:return n=ro(n),p(e,t,n,r)}if(be(n)||D(n))return i===null?d(e,t,n,r,null):null;if(typeof n.then==`function`)return p(e,t,lo(n),r);if(n.$$typeof===ce)return p(e,t,Oa(e,n),r);fo(e,n)}return null}function m(e,t,n,r,i){if(typeof r==`string`&&r!==``||typeof r==`number`||typeof r==`bigint`)return e=e.get(n)||null,c(t,e,``+r,i);if(typeof r==`object`&&r){switch(r.$$typeof){case ne:return e=e.get(r.key===null?n:r.key)||null,l(t,e,r,i);case re:return e=e.get(r.key===null?n:r.key)||null,u(t,e,r,i);case fe:return r=ro(r),m(e,t,n,r,i)}if(be(r)||D(r))return e=e.get(n)||null,d(t,e,r,i,null);if(typeof r.then==`function`)return m(e,t,n,lo(r),i);if(r.$$typeof===ce)return m(e,t,n,Oa(t,r),i);fo(t,r)}return null}function h(i,a,s,c){for(var l=null,u=null,d=a,h=a=0,g=null;d!==null&&h<s.length;h++){d.index>h?(g=d,d=null):g=d.sibling;var _=p(i,d,s[h],c);if(_===null){d===null&&(d=g);break}e&&d&&_.alternate===null&&t(i,d),a=o(_,a,h),u===null?l=_:u.sibling=_,u=_,d=g}if(h===s.length)return n(i,d),R&&ta(i,h),l;if(d===null){for(;h<s.length;h++)d=f(i,s[h],c),d!==null&&(a=o(d,a,h),u===null?l=d:u.sibling=d,u=d);return R&&ta(i,h),l}for(d=r(d);h<s.length;h++)g=m(d,i,h,s[h],c),g!==null&&(e&&(_=g.alternate,_!==null&&d.delete(_.key===null?h:_.key)),a=o(g,a,h),u===null?l=g:u.sibling=g,u=g);return e&&d.forEach(function(e){return t(i,e)}),R&&ta(i,h),l}function g(a,s,c,l){if(c==null)throw Error(i(151));for(var u=null,d=null,h=s,g=s=0,_=null,v=c.next();h!==null&&!v.done;g++,v=c.next()){h.index>g?(_=h,h=null):_=h.sibling;var y=p(a,h,v.value,l);if(y===null){h===null&&(h=_);break}e&&h&&y.alternate===null&&t(a,h),s=o(y,s,g),d===null?u=y:d.sibling=y,d=y,h=_}if(v.done)return n(a,h),R&&ta(a,g),u;if(h===null){for(;!v.done;g++,v=c.next())v=f(a,v.value,l),v!==null&&(s=o(v,s,g),d===null?u=v:d.sibling=v,d=v);return R&&ta(a,g),u}for(h=r(h);!v.done;g++,v=c.next())v=m(h,a,g,v.value,l),v!==null&&(e&&(_=v.alternate,_!==null&&h.delete(_.key===null?g:_.key)),s=o(v,s,g),d===null?u=v:d.sibling=v,d=v);return e&&h.forEach(function(e){return t(a,e)}),R&&ta(a,g),u}function _(e,r,o,c){if(typeof o==`object`&&o&&o.type===ie&&o.key===null&&o.props.ref===void 0&&(o=o.props.children),typeof o==`object`&&o){switch(o.$$typeof){case ne:a:{for(var l=o.key;r!==null;){if(r.key===l){if(l=o.type,l===ie){if(r.tag===7){n(e,r.sibling),c=a(r,o.props.children),uo(c,o),c.return=e,e=c;break a}}else if(r.elementType===l||typeof l==`object`&&l&&l.$$typeof===fe&&ro(l)===r.type){n(e,r.sibling),c=a(r,o.props),uo(c,o),c.return=e,e=c;break a}n(e,r);break}t(e,r),r=r.sibling}o.type===ie?(c=Bi(o.props.children,e.mode,c,o.key),uo(c,o),c.return=e,e=c):(c=zi(o.type,o.key,o.props,null,e.mode,c),uo(c,o),c.return=e,e=c)}return s(e);case re:a:{for(l=o.key;r!==null;){if(r.key===l){if(r.tag===4&&r.stateNode.containerInfo===o.containerInfo&&r.stateNode.implementation===o.implementation){n(e,r.sibling),c=a(r,o.children||[]),c.return=e,e=c;break a}n(e,r);break}t(e,r),r=r.sibling}c=Ui(o,e.mode,c),c.return=e,e=c}return s(e);case fe:return o=ro(o),_(e,r,o,c)}if(be(o))return h(e,r,o,c);if(D(o)){if(l=D(o),typeof l!=`function`)throw Error(i(150));return o=l.call(o),g(e,r,o,c)}if(typeof o.then==`function`)return _(e,r,lo(o),c);if(o.$$typeof===ce)return _(e,r,Oa(e,o),c);fo(e,o)}return typeof o==`string`&&o!==``||typeof o==`number`||typeof o==`bigint`?(o=``+o,r!==null&&r.tag===6?(n(e,r.sibling),c=a(r,o),c.return=e,e=c):(n(e,r),c=Vi(o,e.mode,c),c.return=e,e=c),s(e)):n(e,r)}return function(e,t,n,r){try{co=0;var i=_(e,t,n,r);return so=null,i}catch(t){if(t===Za||t===$a)throw t;var a=Fi(29,t,null,e.mode);return a.lanes=r,a.return=e,a}}}var mo=po(!0),ho=po(!1),go=!1;function _o(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function vo(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function yo(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function bo(e,t,n){var r=e.updateQueue;if(r===null)return null;if(r=r.shared,G&2){var i=r.pending;return i===null?t.next=t:(t.next=i.next,i.next=t),r.pending=t,t=Mi(e),ji(e,null,n),t}return ki(e,r,t,n),Mi(e)}function xo(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,n&4194048)){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,bt(e,n)}}function So(e,t){var n=e.updateQueue,r=e.alternate;if(r!==null&&(r=r.updateQueue,n===r)){var i=null,a=null;if(n=n.firstBaseUpdate,n!==null){do{var o={lane:n.lane,tag:n.tag,payload:n.payload,callback:null,next:null};a===null?i=a=o:a=a.next=o,n=n.next}while(n!==null);a===null?i=a=t:a=a.next=t}else i=a=t;n={baseState:r.baseState,firstBaseUpdate:i,lastBaseUpdate:a,shared:r.shared,callbacks:r.callbacks},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}var Co=!1;function wo(){if(Co){var e=Ha;if(e!==null)throw e}}function To(e,t,n,r){Co=!1;var i=e.updateQueue;go=!1;var a=i.firstBaseUpdate,o=i.lastBaseUpdate,s=i.shared.pending;if(s!==null){i.shared.pending=null;var c=s,l=c.next;c.next=null,o===null?a=l:o.next=l,o=c;var u=e.alternate;u!==null&&(u=u.updateQueue,s=u.lastBaseUpdate,s!==o&&(s===null?u.firstBaseUpdate=l:s.next=l,u.lastBaseUpdate=c))}if(a!==null){var d=i.baseState;o=0,u=l=c=null,s=a;do{var f=s.lane&-536870913,p=f!==s.lane;if(p?(J&f)===f:(r&f)===f){f!==0&&f===Va&&(Co=!0),u!==null&&(u=u.next={lane:0,tag:s.tag,payload:s.payload,callback:null,next:null});a:{var m=e,h=s;f=t;var g=n;switch(h.tag){case 1:if(m=h.payload,typeof m==`function`){d=m.call(g,d,f);break a}d=m;break a;case 3:m.flags=m.flags&-65537|128;case 0:if(m=h.payload,f=typeof m==`function`?m.call(g,d,f):m,f==null)break a;d=C({},d,f);break a;case 2:go=!0}}f=s.callback,f!==null&&(e.flags|=64,p&&(e.flags|=8192),p=i.callbacks,p===null?i.callbacks=[f]:p.push(f))}else p={lane:f,tag:s.tag,payload:s.payload,callback:s.callback,next:null},u===null?(l=u=p,c=d):u=u.next=p,o|=f;if(s=s.next,s===null){if(s=i.shared.pending,s===null)break;p=s,s=p.next,p.next=null,i.lastBaseUpdate=p,i.shared.pending=null}}while(1);u===null&&(c=d),i.baseState=c,i.firstBaseUpdate=l,i.lastBaseUpdate=u,a===null&&(i.shared.lanes=0),sd|=o,e.lanes=o,e.memoizedState=d}}function Eo(e,t){if(typeof e!=`function`)throw Error(i(191,e));e.call(t)}function Do(e,t){var n=e.callbacks;if(n!==null)for(e.callbacks=null,e=0;e<n.length;e++)Eo(n[e],t)}var Oo=we(null),ko=we(0);function Ao(e,t){e=ad,A(ko,e),A(Oo,t),ad=e|t.baseLanes}function jo(){A(ko,ad),A(Oo,Oo.current)}function Mo(){ad=ko.current,Te(Oo),Te(ko)}var No=we(null),Po=null;function Fo(e){var t=e.alternate;A(Bo,Bo.current&1),A(No,e),Po===null&&(t===null||Oo.current!==null||t.memoizedState!==null)&&(Po=e)}function Io(e){A(Bo,Bo.current),A(No,e),Po===null&&(Po=e)}function Lo(e){e.tag===22?(A(Bo,Bo.current),A(No,e),Po===null&&(Po=e)):Ro()}function Ro(){A(Bo,Bo.current),A(No,No.current)}function zo(e){Te(No),Po===e&&(Po=null),Te(Bo)}var Bo=we(0);function Vo(e,t){A(No,No.current),A(Bo,t)}function Ho(e){Te(Bo),Te(No),Po===e&&(Po=null)}function Uo(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||om(n)||sm(n)))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!==`independent`){if(t.flags&128)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var Wo=0,z=null,B=null,Go=null,Ko=!1,qo=!1,Jo=!1,Yo=0,Xo=0,Zo=null,Qo=0;function V(){throw Error(i(321))}function $o(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!Gr(e[n],t[n]))return!1;return!0}function es(e,t,n,r,i,a){return Wo=a,z=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,O.H=e===null||e.memoizedState===null?_c:vc,Jo=!1,a=n(r,i),Jo=!1,qo&&(a=ns(t,n,r,i)),ts(e),a}function ts(e){O.H=gc;var t=B!==null&&B.next!==null;if(Wo=0,Go=B=z=null,Ko=!1,Xo=0,Zo=null,t)throw Error(i(300));e===null||Fc||(e=e.dependencies,e!==null&&Ta(e)&&(Fc=!0))}function ns(e,t,n,r){z=e;var a=0;do{if(qo&&(Zo=null),Xo=0,qo=!1,25<=a)throw Error(i(301));if(a+=1,Go=B=null,e.updateQueue!=null){var o=e.updateQueue;o.lastEffect=null,o.events=null,o.stores=null,o.memoCache!=null&&(o.memoCache.index=0)}O.H=yc,o=t(n,r)}while(qo);return o}function rs(){var e=O.H,t=e.useState()[0];return t=typeof t.then==`function`?us(t):t,e=e.useState()[0],(B===null?null:B.memoizedState)!==e&&(z.flags|=1024),t}function is(){var e=Yo!==0;return Yo=0,e}function as(e,t,n){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~n}function os(e){if(Ko){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}Ko=!1}Wo=0,Go=B=z=null,qo=!1,Xo=Yo=0,Zo=null}function ss(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Go===null?z.memoizedState=Go=e:Go=Go.next=e,Go}function cs(){if(B===null){var e=z.alternate;e=e===null?null:e.memoizedState}else e=B.next;var t=Go===null?z.memoizedState:Go.next;if(t!==null)Go=t,B=e;else{if(e===null)throw z.alternate===null?Error(i(467)):Error(i(310));B=e,e={memoizedState:B.memoizedState,baseState:B.baseState,baseQueue:B.baseQueue,queue:B.queue,next:null},Go===null?z.memoizedState=Go=e:Go=Go.next=e}return Go}function ls(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function us(e){var t=Xo;return Xo+=1,Zo===null&&(Zo=[]),e=no(Zo,e,t),t=z,(Go===null?t.memoizedState:Go.next)===null&&(t=t.alternate,O.H=t===null||t.memoizedState===null?_c:vc),e}function ds(e){if(typeof e==`object`&&e){if(typeof e.then==`function`)return us(e);if(e.$$typeof===ge)return;if(e.$$typeof===ce)return Da(e)}throw Error(i(438,String(e)))}function fs(e){var t=null,n=z.updateQueue;if(n!==null&&(t=n.memoCache),t==null){var r=z.alternate;r!==null&&(r=r.updateQueue,r!==null&&(r=r.memoCache,r!=null&&(t={data:r.data.map(function(e){return e.slice()}),index:0})))}if(t??={data:[],index:0},n===null&&(n=ls(),z.updateQueue=n),n.memoCache=t,n=t.data[t.index],n===void 0)for(n=t.data[t.index]=Array(e),r=0;r<e;r++)n[r]=me;return t.index++,n}function ps(e,t){return typeof t==`function`?t(e):t}function ms(e){return hs(cs(),B,e)}function hs(e,t,n){var r=e.queue;if(r===null)throw Error(i(311));r.lastRenderedReducer=n;var a=e.baseQueue,o=r.pending;if(o!==null){if(a!==null){var s=a.next;a.next=o.next,o.next=s}t.baseQueue=a=o,r.pending=null}if(o=e.baseState,a===null)e.memoizedState=o;else{t=a.next;var c=s=null,l=null,u=t,d=!1;do{var f=u.lane&-536870913;if(f===u.lane?(Wo&f)===f:(J&f)===f){var p=u.revertLane;if(p===0)l!==null&&(l=l.next={lane:0,revertLane:0,gesture:null,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null}),f===Va&&(d=!0);else if((Wo&p)===p){u=u.next,p===Va&&(d=!0);continue}else f={lane:0,revertLane:u.revertLane,gesture:null,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null},l===null?(c=l=f,s=o):l=l.next=f,z.lanes|=p,sd|=p;f=u.action,Jo&&n(o,f),o=u.hasEagerState?u.eagerState:n(o,f)}else p={lane:f,revertLane:u.revertLane,gesture:u.gesture,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null},l===null?(c=l=p,s=o):l=l.next=p,z.lanes|=f,sd|=f;u=u.next}while(u!==null&&u!==t);if(l===null?s=o:l.next=c,!Gr(o,e.memoizedState)&&(Fc=!0,d&&(n=Ha,n!==null)))throw n;e.memoizedState=o,e.baseState=s,e.baseQueue=l,r.lastRenderedState=o}return a===null&&(r.lanes=0),[e.memoizedState,r.dispatch]}function gs(e){var t=cs(),n=t.queue;if(n===null)throw Error(i(311));n.lastRenderedReducer=e;var r=n.dispatch,a=n.pending,o=t.memoizedState;if(a!==null){n.pending=null;var s=a=a.next;do o=e(o,s.action),s=s.next;while(s!==a);Gr(o,t.memoizedState)||(Fc=!0),t.memoizedState=o,t.baseQueue===null&&(t.baseState=o),n.lastRenderedState=o}return[o,r]}function _s(e,t,n){var r=z,a=cs(),o=R;if(o){if(n===void 0)throw Error(i(407));n=n()}else n=t();var s=!Gr((B||a).memoizedState,n);if(s&&(a.memoizedState=n,Fc=!0),a=a.queue,Hs(bs.bind(null,r,a,e),[e]),e=a.getSnapshot!==t||s||Go!==null&&!!(Go.memoizedState.tag&1),Ls(e?9:8,{destroy:void 0},ys.bind(null,r,a,n,t),null),e){if(r.flags|=2048,K===null)throw Error(i(349));o||Wo&127||vs(r,t,n)}return n}function vs(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=z.updateQueue,t===null?(t=ls(),z.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function ys(e,t,n,r){t.value=n,t.getSnapshot=r,xs(t)&&Ss(e)}function bs(e,t,n){return n(function(){xs(t)&&Ss(e)})}function xs(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!Gr(e,n)}catch{return!0}}function Ss(e){var t=I(e,2);t!==null&&Pd(t,e,2)}function Cs(e){var t=ss();if(typeof e==`function`){var n=e;if(e=n(),Jo){nt(!0);try{n()}finally{nt(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:ps,lastRenderedState:e},t}function ws(e,t,n,r){return e.baseState=n,hs(e,B,typeof r==`function`?r:ps)}function Ts(e,t,n,r,a){if(pc(e))throw Error(i(485));if(e=t.action,e!==null){var o={payload:a,action:e,next:null,isTransition:!0,status:`pending`,value:null,reason:null,listeners:[],then:function(e){o.listeners.push(e)}};O.T===null?o.isTransition=!1:n(!0),r(o),n=t.pending,n===null?(o.next=t.pending=o,Es(t,o)):(o.next=n.next,t.pending=n.next=o)}}function Es(e,t){var n=t.action,r=t.payload,i=e.state;if(t.isTransition){var a=O.T,o={};o.types=a===null?null:a.types,O.T=o;try{var s=n(i,r),c=O.S;c!==null&&c(o,s),Ds(e,t,s)}catch(n){ks(e,t,n)}finally{a!==null&&o.types!==null&&(a.types=o.types),O.T=a}}else try{a=n(i,r),Ds(e,t,a)}catch(n){ks(e,t,n)}}function Ds(e,t,n){typeof n==`object`&&n&&typeof n.then==`function`?n.then(function(n){Os(e,t,n)},function(n){return ks(e,t,n)}):Os(e,t,n)}function Os(e,t,n){t.status=`fulfilled`,t.value=n,As(t),e.state=n,t=e.pending,t!==null&&(n=t.next,n===t?e.pending=null:(n=n.next,t.next=n,Es(e,n)))}function ks(e,t,n){var r=e.pending;if(e.pending=null,r!==null){r=r.next;do t.status=`rejected`,t.reason=n,As(t),t=t.next;while(t!==r)}e.action=null}function As(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function js(e,t){return t}function Ms(e,t){if(R){var n=K.formState;if(n!==null){a:{var r=z;if(R){if(L){b:{for(var i=L,a=ca;i.nodeType!==8;){if(!a){i=null;break b}if(i=lm(i.nextSibling),i===null){i=null;break b}}a=i.data,i=a===`F!`||a===`F`?i:null}if(i){L=lm(i.nextSibling),r=i.data===`F!`;break a}}ua(r)}r=!1}r&&(t=n[0])}}return n=ss(),n.memoizedState=n.baseState=t,r={pending:null,lanes:0,dispatch:null,lastRenderedReducer:js,lastRenderedState:t},n.queue=r,n=uc.bind(null,z,r),r.dispatch=n,r=Cs(!1),a=fc.bind(null,z,!1,r.queue),r=ss(),i={state:t,dispatch:null,action:e,pending:null},r.queue=i,n=Ts.bind(null,z,i,a,n),i.dispatch=n,r.memoizedState=e,[t,n,!1]}function Ns(e){return Ps(cs(),B,e)}function Ps(e,t,n){if(t=hs(e,t,js)[0],e=ms(ps)[0],typeof t==`object`&&t&&typeof t.then==`function`)try{var r=us(t)}catch(e){throw e===Za?$a:e}else r=t;t=cs();var i=t.queue,a=i.dispatch;return n!==t.memoizedState&&(z.flags|=2048,Ls(9,{destroy:void 0},Fs.bind(null,i,n),null)),[r,a,e]}function Fs(e,t){e.action=t}function Is(e){var t=cs(),n=B;if(n!==null)return Ps(t,n,e);cs(),t=t.memoizedState,n=cs();var r=n.queue.dispatch;return n.memoizedState=e,[t,r,!1]}function Ls(e,t,n,r){return e={tag:e,create:n,deps:r,inst:t,next:null},t=z.updateQueue,t===null&&(t=ls(),z.updateQueue=t),n=t.lastEffect,n===null?t.lastEffect=e.next=e:(r=n.next,n.next=e,e.next=r,t.lastEffect=e),e}function Rs(){return cs().memoizedState}function zs(e,t,n,r){var i=ss();z.flags|=e,i.memoizedState=Ls(1|t,{destroy:void 0},n,r===void 0?null:r)}function Bs(e,t,n,r){var i=cs();r=r===void 0?null:r;var a=i.memoizedState.inst;B!==null&&r!==null&&$o(r,B.memoizedState.deps)?i.memoizedState=Ls(t,a,n,r):(z.flags|=e,i.memoizedState=Ls(1|t,a,n,r))}function Vs(e,t){zs(8390656,8,e,t)}function Hs(e,t){Bs(2048,8,e,t)}function Us(e){z.flags|=4;var t=z.updateQueue;if(t===null)t=ls(),z.updateQueue=t,t.events=[e];else{var n=t.events;n===null?t.events=[e]:n.push(e)}}function Ws(e){var t=cs().memoizedState;return Us({ref:t,nextImpl:e}),function(){if(G&2)throw Error(i(440));return t.impl.apply(void 0,arguments)}}function Gs(e,t){return Bs(4,2,e,t)}function Ks(e,t){return Bs(4,4,e,t)}function qs(e,t){if(typeof t==`function`){e=e();var n=t(e);return function(){typeof n==`function`?n():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function Js(e,t,n){n=n==null?null:n.concat([e]),Bs(4,4,qs.bind(null,t,e),n)}function Ys(){}function Xs(e,t){var n=cs();t=t===void 0?null:t;var r=n.memoizedState;return t!==null&&$o(t,r[1])?r[0]:(n.memoizedState=[e,t],e)}function Zs(e,t){var n=cs();t=t===void 0?null:t;var r=n.memoizedState;if(t!==null&&$o(t,r[1]))return r[0];if(r=e(),Jo){nt(!0);try{e()}finally{nt(!1)}}return n.memoizedState=[r,t],r}function Qs(e,t,n){return n===void 0||Wo&1073741824&&!(J&261930)?e.memoizedState=t:(e.memoizedState=n,e=Md(),z.lanes|=e,sd|=e,n)}function $s(e,t,n,r){return Gr(n,t)?n:Oo.current===null?!(Wo&106)||Wo&1073741824&&!(J&261930)?(Fc=!0,e.memoizedState=n):(e=Md(),z.lanes|=e,sd|=e,t):(e=Qs(e,n,r),Gr(e,t)||(Fc=!0),e)}function ec(e,t,n,r,i){var a=k.p;k.p=a!==0&&8>a?a:8;var o=O.T,s={};s.types=o===null?null:o.types,O.T=s,fc(e,!1,t,n);try{var c=i(),l=O.S;l!==null&&l(s,c),typeof c==`object`&&c&&typeof c.then==`function`?dc(e,t,Ga(c,r),jd(e)):dc(e,t,r,jd(e))}catch(n){dc(e,t,{then:function(){},status:`rejected`,reason:n},jd())}finally{k.p=a,o!==null&&s.types!==null&&(o.types=s.types),O.T=o}}function tc(){}function nc(e,t,n,r){if(e.tag!==5)throw Error(i(476));var a=rc(e).queue;ec(e,a,t,xe,n===null?tc:function(){return ic(e),n(r)})}function rc(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:xe,baseState:xe,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:ps,lastRenderedState:xe},next:null};var n={};return t.next={memoizedState:n,baseState:n,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:ps,lastRenderedState:n},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function ic(e){var t=rc(e);t.next===null&&(t=e.alternate.memoizedState),dc(e,t.next.queue,{},jd())}function ac(){return Da(sh)}function oc(){return cs().memoizedState}function sc(){return cs().memoizedState}function cc(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var n=jd();e=yo(n);var r=bo(t,e,n);r!==null&&(Pd(r,t,n),xo(r,t,n)),t={cache:Pa()},e.payload=t;return}t=t.return}}function lc(e,t,n){var r=jd();n={lane:r,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null},pc(e)?mc(t,n):(n=Ai(e,t,n,r),n!==null&&(Pd(n,e,r),hc(n,t,r)))}function uc(e,t,n){dc(e,t,n,jd())}function dc(e,t,n,r){var i={lane:r,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null};if(pc(e))mc(t,i);else{var a=e.alternate;if(e.lanes===0&&(a===null||a.lanes===0)&&(a=t.lastRenderedReducer,a!==null))try{var o=t.lastRenderedState,s=a(o,n);if(i.hasEagerState=!0,i.eagerState=s,Gr(s,o))return ki(e,t,i,0),K===null&&Oi(),!1}catch{}if(n=Ai(e,t,i,r),n!==null)return Pd(n,e,r),hc(n,t,r),!0}return!1}function fc(e,t,n,r){if(r={lane:2,revertLane:Pf(),gesture:null,action:r,hasEagerState:!1,eagerState:null,next:null},pc(e)){if(t)throw Error(i(479))}else t=Ai(e,n,r,2),t!==null&&Pd(t,e,2)}function pc(e){var t=e.alternate;return e===z||t!==null&&t===z}function mc(e,t){qo=Ko=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function hc(e,t,n){if(n&4194048){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,bt(e,n)}}var gc={readContext:Da,use:ds,useCallback:V,useContext:V,useEffect:V,useImperativeHandle:V,useLayoutEffect:V,useInsertionEffect:V,useMemo:V,useReducer:V,useRef:V,useState:V,useDebugValue:V,useDeferredValue:V,useTransition:V,useSyncExternalStore:V,useId:V,useHostTransitionStatus:V,useFormState:V,useActionState:V,useOptimistic:V,useMemoCache:V,useCacheRefresh:V,useEffectEvent:V},_c={readContext:Da,use:ds,useCallback:function(e,t){return ss().memoizedState=[e,t===void 0?null:t],e},useContext:Da,useEffect:Vs,useImperativeHandle:function(e,t,n){n=n==null?null:n.concat([e]),zs(4194308,4,qs.bind(null,t,e),n)},useLayoutEffect:function(e,t){return zs(4194308,4,e,t)},useInsertionEffect:function(e,t){zs(4,2,e,t)},useMemo:function(e,t){var n=ss();t=t===void 0?null:t;var r=e();if(Jo){nt(!0);try{e()}finally{nt(!1)}}return n.memoizedState=[r,t],r},useReducer:function(e,t,n){var r=ss();if(n!==void 0){var i=n(t);if(Jo){nt(!0);try{n(t)}finally{nt(!1)}}}else i=t;return r.memoizedState=r.baseState=i,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:i},r.queue=e,e=e.dispatch=lc.bind(null,z,e),[r.memoizedState,e]},useRef:function(e){var t=ss();return e={current:e},t.memoizedState=e},useState:function(e){e=Cs(e);var t=e.queue,n=uc.bind(null,z,t);return t.dispatch=n,[e.memoizedState,n]},useDebugValue:Ys,useDeferredValue:function(e,t){return Qs(ss(),e,t)},useTransition:function(){var e=Cs(!1);return e=ec.bind(null,z,e.queue,!0,!1),ss().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,n){var r=z,a=ss();if(R){if(n===void 0)throw Error(i(407));n=n()}else{if(n=t(),K===null)throw Error(i(349));J&127||vs(r,t,n)}a.memoizedState=n;var o={value:n,getSnapshot:t};return a.queue=o,Vs(bs.bind(null,r,o,e),[e]),r.flags|=2048,Ls(9,{destroy:void 0},ys.bind(null,r,o,n,t),null),n},useId:function(){var e=ss(),t=K.identifierPrefix;if(R){var n=ea,r=$i;n=(r&~(1<<32-rt(r)-1)).toString(32)+n,t=`_`+t+`R_`+n,n=Yo++,0<n&&(t+=`H`+n.toString(32)),t+=`_`}else n=Qo++,t=`_`+t+`r_`+n.toString(32)+`_`;return e.memoizedState=t},useHostTransitionStatus:ac,useFormState:Ms,useActionState:Ms,useOptimistic:function(e){var t=ss();t.memoizedState=t.baseState=e;var n={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=n,t=fc.bind(null,z,!0,n),n.dispatch=t,[e,t]},useMemoCache:fs,useCacheRefresh:function(){return ss().memoizedState=cc.bind(null,z)},useEffectEvent:function(e){var t=ss(),n={impl:e};return t.memoizedState=n,function(){if(G&2)throw Error(i(440));return n.impl.apply(void 0,arguments)}}},vc={readContext:Da,use:ds,useCallback:Xs,useContext:Da,useEffect:Hs,useImperativeHandle:Js,useInsertionEffect:Gs,useLayoutEffect:Ks,useMemo:Zs,useReducer:ms,useRef:Rs,useState:function(){return ms(ps)},useDebugValue:Ys,useDeferredValue:function(e,t){return $s(cs(),B.memoizedState,e,t)},useTransition:function(){var e=ms(ps)[0],t=cs().memoizedState;return[typeof e==`boolean`?e:us(e),t]},useSyncExternalStore:_s,useId:oc,useHostTransitionStatus:ac,useFormState:Ns,useActionState:Ns,useOptimistic:function(e,t){return ws(cs(),B,e,t)},useMemoCache:fs,useCacheRefresh:sc,useEffectEvent:Ws},yc={readContext:Da,use:ds,useCallback:Xs,useContext:Da,useEffect:Hs,useImperativeHandle:Js,useInsertionEffect:Gs,useLayoutEffect:Ks,useMemo:Zs,useReducer:gs,useRef:Rs,useState:function(){return gs(ps)},useDebugValue:Ys,useDeferredValue:function(e,t){var n=cs();return B===null?Qs(n,e,t):$s(n,B.memoizedState,e,t)},useTransition:function(){var e=gs(ps)[0],t=cs().memoizedState;return[typeof e==`boolean`?e:us(e),t]},useSyncExternalStore:_s,useId:oc,useHostTransitionStatus:ac,useFormState:Is,useActionState:Is,useOptimistic:function(e,t){var n=cs();return B===null?(n.baseState=e,[e,n.queue.dispatch]):ws(n,B,e,t)},useMemoCache:fs,useCacheRefresh:sc,useEffectEvent:Ws};function bc(e,t,n,r){t=e.memoizedState,n=n(r,t),n=n==null?t:C({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var xc={enqueueSetState:function(e,t,n){e=e._reactInternals;var r=jd(),i=yo(r);i.payload=t,n!=null&&(i.callback=n),t=bo(e,i,r),t!==null&&(Pd(t,e,r),xo(t,e,r))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var r=jd(),i=yo(r);i.tag=1,i.payload=t,n!=null&&(i.callback=n),t=bo(e,i,r),t!==null&&(Pd(t,e,r),xo(t,e,r))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=jd(),r=yo(n);r.tag=2,t!=null&&(r.callback=t),t=bo(e,r,n),t!==null&&(Pd(t,e,n),xo(t,e,n))}};function Sc(e,t,n,r,i,a,o){return e=e.stateNode,typeof e.shouldComponentUpdate==`function`?e.shouldComponentUpdate(r,a,o):t.prototype&&t.prototype.isPureReactComponent?!Kr(n,r)||!Kr(i,a):!0}function Cc(e,t,n,r){e=t.state,typeof t.componentWillReceiveProps==`function`&&t.componentWillReceiveProps(n,r),typeof t.UNSAFE_componentWillReceiveProps==`function`&&t.UNSAFE_componentWillReceiveProps(n,r),t.state!==e&&xc.enqueueReplaceState(t,t.state,null)}function wc(e,t){var n=t;if(`ref`in t)for(var r in n={},t)r!==`ref`&&(n[r]=t[r]);if(e=e.defaultProps)for(var i in n===t&&(n=C({},n)),e)n[i]===void 0&&(n[i]=e[i]);return n}function Tc(e){wi(e)}function Ec(e){console.error(e)}function Dc(e){wi(e)}function Oc(e,t){try{var n=e.onUncaughtError;n(t.value,{componentStack:t.stack})}catch(e){setTimeout(function(){throw e})}}function kc(e,t,n){try{var r=e.onCaughtError;r(n.value,{componentStack:n.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(e){setTimeout(function(){throw e})}}function Ac(e,t,n){return n=yo(n),n.tag=3,n.payload={element:null},n.callback=function(){Oc(e,t)},n}function jc(e){return e=yo(e),e.tag=3,e}function Mc(e,t,n,r){var i=n.type.getDerivedStateFromError;if(typeof i==`function`){var a=r.value;e.payload=function(){return i(a)},e.callback=function(){kc(t,n,r)}}var o=n.stateNode;o!==null&&typeof o.componentDidCatch==`function`&&(e.callback=function(){kc(t,n,r),typeof i!=`function`&&(yd===null?yd=new Set([this]):yd.add(this));var e=r.stack;this.componentDidCatch(r.value,{componentStack:e===null?``:e})})}function Nc(e,t,n,r,a){if(n.flags|=32768,typeof r==`object`&&r&&typeof r.then==`function`){if(t=n.alternate,t!==null&&wa(t,n,a,!0),n=No.current,n!==null){switch(n.tag){case 31:case 13:case 19:return Po===null?Kd():n.alternate===null&&od===0&&(od=3),n.flags&=-257,n.flags|=65536,n.lanes=a,r===eo?n.flags|=16384:(t=n.updateQueue,t===null?n.updateQueue=new Set([r]):t.add(r),mf(e,r,a)),!1;case 22:return n.flags|=65536,r===eo?n.flags|=16384:(t=n.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([r])},n.updateQueue=t):(n=t.retryQueue,n===null?t.retryQueue=new Set([r]):n.add(r)),mf(e,r,a)),!1}throw Error(i(435,n.tag))}return mf(e,r,a),Kd(),!1}if(R)return t=No.current,t===null?(r!==la&&(t=Error(i(423),{cause:r}),ga(Gi(t,n))),e=e.current.alternate,e.flags|=65536,a&=-a,e.lanes|=a,r=Gi(r,n),a=Ac(e.stateNode,r,a),So(e,a),od!==4&&(od=2)):(!(t.flags&65536)&&(t.flags|=256),t.flags|=65536,t.lanes=a,r!==la&&(e=Error(i(422),{cause:r}),ga(Gi(e,n)))),!1;var o=Error(i(520),{cause:r});if(o=Gi(o,n),fd===null?fd=[o]:fd.push(o),od!==4&&(od=2),t===null)return!0;r=Gi(r,n),n=t;do{switch(n.tag){case 3:return n.flags|=65536,e=a&-a,n.lanes|=e,e=Ac(n.stateNode,r,e),So(n,e),!1;case 1:if(t=n.type,o=n.stateNode,!(n.flags&128)&&(typeof t.getDerivedStateFromError==`function`||o!==null&&typeof o.componentDidCatch==`function`&&(yd===null||!yd.has(o))))return n.flags|=65536,a&=-a,n.lanes|=a,a=jc(a),Mc(a,e,n,r),So(n,a),!1;break;case 22:if(n.memoizedState!==null)return n.flags|=65536,!1}n=n.return}while(n!==null);return!1}var Pc=Error(i(461)),Fc=!1;function Ic(e,t,n,r){t.child=e===null?ho(t,null,n,r):mo(t,e.child,n,r)}function Lc(e,t,n,r,i){n=n.render;var a=t.ref;if(`ref`in r){var o={};for(var s in r)s!==`ref`&&(o[s]=r[s])}else o=r;return Ea(t),r=es(e,t,n,o,a,i),s=is(),e!==null&&!Fc?(as(e,t,i),dl(e,t,i)):(R&&s&&ra(t),t.flags|=1,Ic(e,t,r,i),t.child)}function Rc(e,t,n,r,i){if(e===null){var a=n.type;return typeof a==`function`&&!Ii(a)&&a.defaultProps===void 0&&n.compare===null?(t.tag=15,t.type=a,zc(e,t,a,r,i)):(e=zi(n.type,null,r,t,t.mode,i),e.ref=t.ref,e.return=t,t.child=e)}if(a=e.child,!fl(e,i)){var o=a.memoizedProps;if(n=n.compare,n=n===null?Kr:n,n(o,r)&&e.ref===t.ref)return dl(e,t,i)}return t.flags|=1,e=Li(a,r),e.ref=t.ref,e.return=t,t.child=e}function zc(e,t,n,r,i){if(e!==null){var a=e.memoizedProps;if(Kr(a,r)&&e.ref===t.ref){if(Fc=!1,t.pendingProps=r=a,fl(e,i))e.flags&131072&&(Fc=!0);else return t.lanes=e.lanes,dl(e,t,i)}}return qc(e,t,n,r,i)}function Bc(e,t,n,r){var i=r.children,a=e===null?null:e.memoizedState;if(e===null&&t.stateNode===null&&(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),r.mode===`hidden`){if(t.flags&128){if(a=a===null?n:a.baseLanes|n,e!==null){for(r=t.child=e.child,i=0;r!==null;)i=i|r.lanes|r.childLanes,r=r.sibling;r=i&~a}else r=0,t.child=null;return Hc(e,t,a,n,r)}if(n&536870912)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&Ya(t,a===null?null:a.cachePool),a===null?jo():Ao(t,a),Lo(t);else return r=t.lanes=536870912,Hc(e,t,a===null?n:a.baseLanes|n,n,r)}else a===null?(e!==null&&Ya(t,null),jo(),Ro()):(Ya(t,a.cachePool),Ao(t,a),Ro(),t.memoizedState=null);return Ic(e,t,i,n),t.child}function Vc(e,t){return e!==null&&e.tag===22||t.stateNode!==null||(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),t.sibling}function Hc(e,t,n,r,i){var a=Ja();return a=a===null?null:{parent:Na._currentValue,pool:a},t.memoizedState={baseLanes:n,cachePool:a},e!==null&&Ya(t,null),jo(),Lo(t),e!==null&&wa(e,t,r,!0),t.childLanes=i,null}function Uc(e,t){return t=nl({mode:t.mode,children:t.children},e.mode),t.ref=e.ref,e.child=t,t.return=e,t}function Wc(e,t,n){return mo(t,e.child,null,n),e=Uc(t,t.pendingProps),e.flags|=2,zo(t),t.memoizedState=null,e}function Gc(e,t,n){var r=t.pendingProps,a=!!(t.flags&128);if(t.flags&=-129,e===null){if(R){if(r.mode===`hidden`)return e=Uc(t,r),t.lanes=536870912,e.memoizedState={baseLanes:0,cachePool:null},Vc(null,e);if(Io(t),(e=L)?(e=am(e,ca),e=e!==null&&e.data===`&`?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:Qi===null?null:{id:$i,overflow:ea},retryLane:536870912,hydrationErrors:null},n=Hi(e),n.return=t,t.child=n,oa=t,L=null)):e=null,e===null)throw ua(t);return t.lanes=536870912,null}return Uc(t,r)}var o=e.memoizedState;if(o!==null){var s=o.dehydrated;if(Io(t),a){if(t.flags&256)t.flags&=-257,t=Wc(e,t,n);else if(t.memoizedState!==null)t.child=e.child,t.flags|=128,t=null;else throw Error(i(558))}else if(Fc||wa(e,t,n,!1),a=(n&e.childLanes)!==0,Fc||a){if(Oo.current===null){if(r=K,r!==null&&(s=xt(r,n),s!==0&&s!==o.retryLane))throw o.retryLane=s,I(e,s),Pd(r,e,s),Pc;Kd()}t=Wc(e,t,n)}else e=o.treeContext,L=lm(s.nextSibling),oa=t,R=!0,sa=null,ca=!1,e!==null&&aa(t,e),t=Uc(t,r),t.flags|=134221824;return t}return e=Li(e.child,{mode:r.mode,children:r.children}),e.ref=t.ref,t.child=e,e.return=t,e}function Kc(e,t){var n=t.ref;if(n===null)e!==null&&e.ref!==null&&(t.flags|=4194816);else{if(typeof n!=`function`&&typeof n!=`object`)throw Error(i(284));(e===null||e.ref!==n)&&(t.flags|=4194816)}}function qc(e,t,n,r,i){return Ea(t),n=es(e,t,n,r,void 0,i),r=is(),e!==null&&!Fc?(as(e,t,i),dl(e,t,i)):(R&&r&&ra(t),t.flags|=1,Ic(e,t,n,i),t.child)}function Jc(e,t,n,r,i,a){return Ea(t),t.updateQueue=null,n=ns(t,r,n,i),ts(e),r=is(),e!==null&&!Fc?(as(e,t,a),dl(e,t,a)):(R&&r&&ra(t),t.flags|=1,Ic(e,t,n,a),t.child)}function Yc(e,t,n,r,i){if(Ea(t),t.stateNode===null){var a=Ni,o=n.contextType;typeof o==`object`&&o&&(a=Da(o)),a=new n(r,a),t.memoizedState=a.state!==null&&a.state!==void 0?a.state:null,a.updater=xc,t.stateNode=a,a._reactInternals=t,a=t.stateNode,a.props=r,a.state=t.memoizedState,a.refs={},_o(t),o=n.contextType,a.context=typeof o==`object`&&o?Da(o):Ni,a.state=t.memoizedState,o=n.getDerivedStateFromProps,typeof o==`function`&&(bc(t,n,o,r),a.state=t.memoizedState),typeof n.getDerivedStateFromProps==`function`||typeof a.getSnapshotBeforeUpdate==`function`||typeof a.UNSAFE_componentWillMount!=`function`&&typeof a.componentWillMount!=`function`||(o=a.state,typeof a.componentWillMount==`function`&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount==`function`&&a.UNSAFE_componentWillMount(),o!==a.state&&xc.enqueueReplaceState(a,a.state,null),To(t,r,a,i),wo(),a.state=t.memoizedState),typeof a.componentDidMount==`function`&&(t.flags|=4194308),r=!0}else if(e===null){a=t.stateNode;var s=t.memoizedProps,c=wc(n,s);a.props=c;var l=a.context,u=n.contextType;o=Ni,typeof u==`object`&&u&&(o=Da(u));var d=n.getDerivedStateFromProps;u=typeof d==`function`||typeof a.getSnapshotBeforeUpdate==`function`,s=t.pendingProps!==s,u||typeof a.UNSAFE_componentWillReceiveProps!=`function`&&typeof a.componentWillReceiveProps!=`function`||(s||l!==o)&&Cc(t,a,r,o),go=!1;var f=t.memoizedState;a.state=f,To(t,r,a,i),wo(),l=t.memoizedState,s||f!==l||go?(typeof d==`function`&&(bc(t,n,d,r),l=t.memoizedState),(c=go||Sc(t,n,c,r,f,l,o))?(u||typeof a.UNSAFE_componentWillMount!=`function`&&typeof a.componentWillMount!=`function`||(typeof a.componentWillMount==`function`&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount==`function`&&a.UNSAFE_componentWillMount()),typeof a.componentDidMount==`function`&&(t.flags|=4194308)):(typeof a.componentDidMount==`function`&&(t.flags|=4194308),t.memoizedProps=r,t.memoizedState=l),a.props=r,a.state=l,a.context=o,r=c):(typeof a.componentDidMount==`function`&&(t.flags|=4194308),r=!1)}else{a=t.stateNode,vo(e,t),o=t.memoizedProps,u=wc(n,o),a.props=u,d=t.pendingProps,f=a.context,l=n.contextType,c=Ni,typeof l==`object`&&l&&(c=Da(l)),s=n.getDerivedStateFromProps,(l=typeof s==`function`||typeof a.getSnapshotBeforeUpdate==`function`)||typeof a.UNSAFE_componentWillReceiveProps!=`function`&&typeof a.componentWillReceiveProps!=`function`||(o!==d||f!==c)&&Cc(t,a,r,c),go=!1,f=t.memoizedState,a.state=f,To(t,r,a,i),wo();var p=t.memoizedState;o!==d||f!==p||go||e!==null&&e.dependencies!==null&&Ta(e.dependencies)?(typeof s==`function`&&(bc(t,n,s,r),p=t.memoizedState),(u=go||Sc(t,n,u,r,f,p,c)||e!==null&&e.dependencies!==null&&Ta(e.dependencies))?(l||typeof a.UNSAFE_componentWillUpdate!=`function`&&typeof a.componentWillUpdate!=`function`||(typeof a.componentWillUpdate==`function`&&a.componentWillUpdate(r,p,c),typeof a.UNSAFE_componentWillUpdate==`function`&&a.UNSAFE_componentWillUpdate(r,p,c)),typeof a.componentDidUpdate==`function`&&(t.flags|=4),typeof a.getSnapshotBeforeUpdate==`function`&&(t.flags|=1024)):(typeof a.componentDidUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=1024),t.memoizedProps=r,t.memoizedState=p),a.props=r,a.state=p,a.context=c,r=u):(typeof a.componentDidUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=1024),r=!1)}return a=r,Kc(e,t),r=!!(t.flags&128),a||r?(a=t.stateNode,n=r&&typeof n.getDerivedStateFromError!=`function`?null:a.render(),t.flags|=1,e!==null&&r?(t.child=mo(t,e.child,null,i),t.child=mo(t,null,n,i)):Ic(e,t,n,i),t.memoizedState=a.state,e=t.child):e=dl(e,t,i),e}function Xc(e,t,n,r){return ma(),t.flags|=256,Ic(e,t,n,r),t.child}var Zc={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function Qc(e){return{baseLanes:e,cachePool:Xa()}}function $c(e,t,n){return e=e===null?0:e.childLanes&~n,t&&(e|=ud),e}function el(e,t,n){var r=t.pendingProps,i=!1,a=!!(t.flags&128),o;if((o=a)||(o=e!==null&&e.memoizedState===null?!1:!!(Bo.current&2)),o&&(i=!0,t.flags&=-129),o=!!(t.flags&32),t.flags&=-33,e===null){if(R){if(i?Fo(t):Ro(),(e=L)?(e=am(e,ca),e=e!==null&&e.data!==`&`?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:Qi===null?null:{id:$i,overflow:ea},retryLane:536870912,hydrationErrors:null},n=Hi(e),n.return=t,t.child=n,oa=t,L=null)):e=null,e===null)throw ua(t);return t.lanes=sm(e)?32:536870912,null}return a=r.children,r=r.fallback,i?(Ro(),i=t.mode,a=nl({mode:`hidden`,children:a},i),r=Bi(r,i,n,null),a.return=t,r.return=t,a.sibling=r,t.child=a,r=t.child,r.memoizedState=Qc(n),r.childLanes=$c(e,o,n),t.memoizedState=Zc,Vc(null,r)):(Fo(t),tl(t,a))}var s=e.memoizedState;if(s!==null){var c=s.dehydrated;if(c!==null)return il(e,t,a,o,r,c,s,n)}return i?(Ro(),i=r.fallback,a=t.mode,s=e.child,c=s.sibling,r=Li(s,{mode:`hidden`,children:r.children}),r.subtreeFlags=s.subtreeFlags&1206910976,c===null?(i=Bi(i,a,n,null),i.flags|=2):i=Li(c,i),i.return=t,r.return=t,r.sibling=i,t.child=r,Vc(null,r),r=t.child,i=e.child.memoizedState,i===null?i=Qc(n):(a=i.cachePool,a===null?a=Xa():(s=Na._currentValue,a=a.parent===s?a:{parent:s,pool:s}),i={baseLanes:i.baseLanes|n,cachePool:a}),r.memoizedState=i,r.childLanes=$c(e,o,n),t.memoizedState=Zc,Vc(e.child,r)):(Fo(t),n=e.child,e=n.sibling,n=Li(n,{mode:`visible`,children:r.children}),n.return=t,n.sibling=null,e!==null&&(o=t.deletions,o===null?(t.deletions=[e],t.flags|=16):o.push(e)),t.child=n,t.memoizedState=null,n)}function tl(e,t){return t=nl({mode:`visible`,children:t},e.mode),t.return=e,e.child=t}function nl(e,t){return e=Fi(22,e,null,t),e.lanes=0,e}function rl(e,t,n){return mo(t,e.child,null,n),e=tl(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function il(e,t,n,r,a,o,s,c){if(n)return t.flags&256?(Fo(t),t.flags&=-257,rl(e,t,c)):t.memoizedState===null?(Ro(),o=a.fallback,s=t.mode,a=nl({mode:`visible`,children:a.children},s),o=Bi(o,s,c,null),o.flags|=2,a.return=t,o.return=t,a.sibling=o,t.child=a,mo(t,e.child,null,c),a=t.child,a.memoizedState=Qc(c),a.childLanes=$c(e,r,c),t.memoizedState=Zc,Vc(null,a)):(Ro(),t.child=e.child,t.flags|=128,null);if(Fo(t),sm(o)){if(r=o.nextSibling&&o.nextSibling.dataset,r)var l=r.dgst;return r=l,r!==``&&(a=Error(i(419)),a.stack=``,a.digest=r,ga({value:a,source:null,stack:null})),rl(e,t,c)}if(Fc||wa(e,t,c,!1),r=(c&e.childLanes)!==0,Fc||r){if(Oo.current!==null)return rl(e,t,c);if(r=K,r!==null&&(a=xt(r,c),a!==0&&a!==s.retryLane))throw s.retryLane=a,I(e,a),Pd(r,e,a),Pc;return om(o)||Kd(),rl(e,t,c)}return om(o)?(t.flags|=192,t.child=e.child,null):(e=s.treeContext,L=lm(o.nextSibling),oa=t,R=!0,sa=null,ca=!1,e!==null&&aa(t,e),t=tl(t,a.children),t.flags|=134221824,t)}function al(e,t,n){e.lanes|=t;var r=e.alternate;r!==null&&(r.lanes|=t),Sa(e.return,t,n)}function ol(e){for(var t=null;e!==null;){var n=e.alternate;n!==null&&Uo(n)===null&&(t=e),e=e.sibling}return t}function sl(e,t,n,r,i,a){var o=e.memoizedState;o===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:r,tail:n,tailMode:i,treeForkCount:a}:(o.isBackwards=t,o.rendering=null,o.renderingStartTime=0,o.last=r,o.tail=n,o.tailMode=i,o.treeForkCount=a)}function cl(e){var t=e.child;for(e.child=null;t!==null;){var n=t.sibling;t.sibling=e.child,e.child=t,t=n}}function ll(e,t,n){var r=t.pendingProps,i=r.revealOrder,a=r.tail;r=r.children;var o=Bo.current;if(t.flags&128)return Vo(t,o),null;var s=!!(o&2);if(s?(o=o&1|2,t.flags|=128):o&=1,Vo(t,o),i===`backwards`&&e!==null?(cl(e),Ic(e,t,r,n),cl(e)):Ic(e,t,r,n),r=R?Yi:0,!s&&e!==null&&e.flags&128)a:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&al(e,n,t);else if(e.tag===19)al(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break a;for(;e.sibling===null;){if(e.return===null||e.return===t)break a;e=e.return}e.sibling.return=e.return,e=e.sibling}switch(i){case`backwards`:n=ol(t.child),n===null?(i=t.child,t.child=null):(i=n.sibling,n.sibling=null,cl(t)),sl(t,!0,i,null,a,r);break;case`unstable_legacy-backwards`:for(n=null,i=t.child,t.child=null;i!==null;){if(e=i.alternate,e!==null&&Uo(e)===null){t.child=i;break}e=i.sibling,i.sibling=n,n=i,i=e}sl(t,!0,n,null,a,r);break;case`together`:sl(t,!1,null,null,void 0,r);break;case`independent`:t.memoizedState=null;break;default:n=ol(t.child),n===null?(i=t.child,t.child=null):(i=n.sibling,n.sibling=null),sl(t,!1,i,n,a,r)}return t.child}function ul(e,t,n){var r=t.pendingProps;return ba(t,t.type,r.value),Ic(e,t,r.children,n),t.child}function dl(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),sd|=t.lanes,(n&t.childLanes)===0){if(e!==null){if(wa(e,t,n,!1),(n&t.childLanes)===0)return null}else return null}if(e!==null&&t.child!==e.child)throw Error(i(153));if(t.child!==null){for(e=t.child,n=Li(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=Li(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function fl(e,t){return(e.lanes&t)!==0||(e=e.dependencies,!!(e!==null&&Ta(e)))}function pl(e,t,n){switch(t.tag){case 3:Ae(t,t.stateNode.containerInfo),ba(t,Na,e.memoizedState.cache),ma();break;case 27:case 5:Me(t);break;case 4:Ae(t,t.stateNode.containerInfo);break;case 10:ba(t,t.type,t.memoizedProps.value);break;case 31:if(t.memoizedState!==null)return t.flags|=128,Io(t),null;break;case 13:var r=t.memoizedState;if(r!==null){if(r.dehydrated!==null)return Fo(t),t.flags|=128,null;r=wa(e,t,n,!1);var i=t.child.childLanes;return r||(n&i)!==0?el(e,t,n):(Fo(t),e=dl(e,t,n),e===null?null:e.sibling)}Fo(t);break;case 19:if(t.flags&128)return ll(e,t,n);if(i=!!(e.flags&128),r=(n&t.childLanes)!==0,r||=(wa(e,t,n,!1),(n&t.childLanes)!==0),i){if(r)return ll(e,t,n);t.flags|=128}if(i=t.memoizedState,i!==null&&(i.rendering=null,i.tail=null,i.lastEffect=null),Vo(t,Bo.current),r)break;return null;case 22:return t.lanes=0,Bc(e,t,n,t.pendingProps);case 24:ba(t,Na,e.memoizedState.cache)}return dl(e,t,n)}function ml(e,t,n){if(e!==null){if(e.memoizedProps!==t.pendingProps)Fc=!0;else{if(!fl(e,n)&&!(t.flags&128))return Fc=!1,pl(e,t,n);Fc=!!(e.flags&131072)}}else Fc=!1,R&&t.flags&1048576&&na(t,Yi,t.index);switch(t.lanes=0,t.tag){case 16:a:{var r=t.pendingProps;if(e=ro(t.elementType),t.type=e,typeof e==`function`)Ii(e)?(r=wc(e,r),t.tag=1,t=Yc(null,t,e,r,n)):(t.tag=0,t=qc(null,t,e,r,n));else{if(e!=null){var a=e.$$typeof;if(a===T){t.tag=11,t=Lc(null,t,e,r,n);break a}if(a===de){t.tag=14,t=Rc(null,t,e,r,n);break a}if(a===ce){t.tag=10,t.type=e,t=ul(null,t,n);break a}}throw t=ye(e)||e,Error(i(306,t,``))}}return t;case 0:return qc(e,t,t.type,t.pendingProps,n);case 1:return r=t.type,a=wc(r,t.pendingProps),Yc(e,t,r,a,n);case 3:a:{if(Ae(t,t.stateNode.containerInfo),e===null)throw Error(i(387));r=t.pendingProps;var o=t.memoizedState;a=o.element,vo(e,t),To(t,r,null,n);var s=t.memoizedState;if(r=s.cache,ba(t,Na,r),r!==o.cache&&Ca(t,[Na],n,!0),wo(),r=s.element,o.isDehydrated){if(o={element:r,isDehydrated:!1,cache:s.cache},t.updateQueue.baseState=o,t.memoizedState=o,t.flags&256){t=Xc(e,t,r,n);break a}if(r!==a){a=Gi(Error(i(424)),t),ga(a),t=Xc(e,t,r,n);break a}switch(e=t.stateNode.containerInfo,e.nodeType){case 9:e=e.body;break;default:e=e.nodeName===`HTML`?e.ownerDocument.body:e}for(L=lm(e.firstChild),oa=t,R=!0,sa=null,ca=!0,n=ho(t,null,r,n),t.child=n;n;)n.flags=n.flags&-3|134221824,n=n.sibling}else{if(ma(),r===a){t=dl(e,t,n);break a}Ic(e,t,r,n)}t=t.child}return t;case 26:return Kc(e,t),e===null?(n=Nm(t.type,null,t.pendingProps,null))?t.memoizedState=n:R||(t.stateNode=fp(t.type,t.pendingProps,Oe.current,t)):t.memoizedState=Nm(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return Me(t),e===null&&R&&(r=t.stateNode=hm(t.type,t.pendingProps,Oe.current),oa=t,ca=!0,a=L,Sp(t.type)?(um=a,L=lm(r.firstChild)):L=a),Ic(e,t,t.pendingProps.children,n),Kc(e,t),e===null&&(t.flags|=4194304),t.child;case 5:return e===null&&R&&((a=r=L)&&(r=rm(r,t.type,t.pendingProps,ca),r===null?a=!1:(t.stateNode=r,oa=t,L=lm(r.firstChild),ca=!1,a=!0)),a||ua(t)),Me(t),a=t.type,o=t.pendingProps,s=e===null?null:e.memoizedProps,r=o.children,pp(a,o)?r=null:s!==null&&pp(a,s)&&(t.flags|=32),t.memoizedState!==null&&(a=es(e,t,rs,null,null,n),sh._currentValue=a),Kc(e,t),Ic(e,t,r,n),t.child;case 6:return e===null&&R&&((e=n=L)&&(n=im(n,t.pendingProps,ca),n===null?e=!1:(t.stateNode=n,oa=t,L=null,e=!0)),e||ua(t)),null;case 13:return el(e,t,n);case 4:return Ae(t,t.stateNode.containerInfo),r=t.pendingProps,e===null?t.child=mo(t,null,r,n):Ic(e,t,r,n),t.child;case 11:return Lc(e,t,t.type,t.pendingProps,n);case 7:return r=t.pendingProps,Kc(e,t),Ic(e,t,r,n),t.child;case 8:return Ic(e,t,t.pendingProps.children,n),t.child;case 12:return Ic(e,t,t.pendingProps.children,n),t.child;case 10:return ul(e,t,n);case 9:return a=t.type._context,r=t.pendingProps.children,Ea(t),a=Da(a),r=r(a),t.flags|=1,Ic(e,t,r,n),t.child;case 14:return Rc(e,t,t.type,t.pendingProps,n);case 15:return zc(e,t,t.type,t.pendingProps,n);case 19:return ll(e,t,n);case 31:return Gc(e,t,n);case 22:return Bc(e,t,n,t.pendingProps);case 24:return Ea(t),r=Da(Na),e===null?(a=Ja(),a===null&&(a=K,o=Pa(),a.pooledCache=o,o.refCount++,o!==null&&(a.pooledCacheLanes|=n),a=o),t.memoizedState={parent:r,cache:a},_o(t),ba(t,Na,a)):((e.lanes&n)!==0&&(vo(e,t),To(t,null,null,n),wo()),a=e.memoizedState,o=t.memoizedState,a.parent===r?(r=o.cache,ba(t,Na,r),r!==a.cache&&Ca(t,[Na],n,!0)):(a={parent:r,cache:r},t.memoizedState=a,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=a),ba(t,Na,r))),Ic(e,t,t.pendingProps.children,n),t.child;case 30:return t.stateNode===null&&(t.stateNode={autoName:null,paired:null,clones:null,ref:null}),r=t.pendingProps,r.name!=null&&r.name!==`auto`?t.flags|=e===null?18882560:18874368:R&&ra(t),e!==null&&e.memoizedProps.name!==r.name?t.flags|=4194816:Kc(e,t),Ic(e,t,r.children,n),t.child;case 29:throw t.pendingProps}throw Error(i(156,t.tag))}function hl(e){e.flags|=4}function gl(e,t,n,r,i){var a;if((a=!!(e.mode&32))&&(a=n===null?Jm(t,r):Jm(t,r)&&(r.src!==n.src||r.srcSet!==n.srcSet)),a){if(e.flags|=16777216,(i&335544128)===i){if(e.stateNode.complete)e.flags|=8192;else if(Ud())e.flags|=8192;else throw io=eo,Qa}}else e.flags&=-16777217}function _l(e,t){if(t.type!==`stylesheet`||t.state.loading&4)e.flags&=-16777217;else if(e.flags|=16777216,!Ym(t)){if(Ud())e.flags|=8192;else throw io=eo,Qa}}function vl(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag===22?536870912:ht(),e.lanes|=t,dd|=t)}function yl(e,t){if(!R)switch(e.tailMode){case`visible`:break;case`collapsed`:for(var n=e.tail,r=null;n!==null;)n.alternate!==null&&(r=n),n=n.sibling;r===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:r.sibling=null;break;default:for(t=e.tail,n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null}}function H(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,r=0;if(t)for(var i=e.child;i!==null;)n|=i.lanes|i.childLanes,r|=i.subtreeFlags&1206910976,r|=i.flags&1206910976,i.return=e,i=i.sibling;else for(i=e.child;i!==null;)n|=i.lanes|i.childLanes,r|=i.subtreeFlags,r|=i.flags,i.return=e,i=i.sibling;return e.subtreeFlags|=r,e.childLanes=n,t}function bl(e,t,n){var r=t.pendingProps;switch(ia(t),t.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return H(t),null;case 1:return H(t),null;case 3:return n=t.stateNode,r=null,e!==null&&(r=e.memoizedState.cache),t.memoizedState.cache!==r&&(t.flags|=2048),xa(Na),je(),n.pendingContext&&(n.context=n.pendingContext,n.pendingContext=null),(e===null||e.child===null)&&(pa(t)?hl(t):e===null||e.memoizedState.isDehydrated&&!(t.flags&256)||(t.flags|=1024,ha())),H(t),null;case 26:var a=t.type,o=t.memoizedState;return e===null?(hl(t),o===null?(H(t),gl(t,a,null,r,n)):(H(t),_l(t,o))):o?o===e.memoizedState?(H(t),t.flags&=-16777217):(hl(t),H(t),_l(t,o)):(e=e.memoizedProps,e!==r&&hl(t),H(t),gl(t,a,e,r,n)),null;case 27:if(Ne(t),n=Oe.current,a=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==r&&hl(t);else{if(!r){if(t.stateNode===null)throw Error(i(166));return H(t),t.subtreeFlags&=-33554433,null}e=Ee.current,pa(t)?da(t,e):(e=hm(a,r,n),t.stateNode=e,hl(t))}return H(t),t.subtreeFlags&=-33554433,null;case 5:if(Ne(t),a=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==r&&hl(t);else{if(!r){if(t.stateNode===null)throw Error(i(166));return H(t),t.subtreeFlags&=-33554433,null}if(o=Ee.current,pa(t))da(t,o);else{var s=lp(Oe.current);switch(o){case 1:o=s.createElementNS(`http://www.w3.org/2000/svg`,a);break;case 2:o=s.createElementNS(`http://www.w3.org/1998/Math/MathML`,a);break;default:switch(a){case`svg`:o=s.createElementNS(`http://www.w3.org/2000/svg`,a);break;case`math`:o=s.createElementNS(`http://www.w3.org/1998/Math/MathML`,a);break;case`script`:o=s.createElement(`div`),o.innerHTML=`<script><\/script>`,o=o.removeChild(o.firstChild);break;case`select`:o=typeof r.is==`string`?s.createElement(`select`,{is:r.is}):s.createElement(`select`),r.multiple?o.multiple=!0:r.size&&(o.size=r.size);break;default:o=typeof r.is==`string`?s.createElement(a,{is:r.is}):s.createElement(a)}}o[Dt]=t,o[Ot]=r;a:for(s=t.child;s!==null;){if(s.tag===5||s.tag===6)o.appendChild(s.stateNode);else if(s.tag!==4&&s.tag!==27&&s.child!==null){s.child.return=s,s=s.child;continue}if(s===t)break a;for(;s.sibling===null;){if(s.return===null||s.return===t)break a;s=s.return}s.sibling.return=s.return,s=s.sibling}t.stateNode=o;a:switch(np(o,a,r),a){case`button`:case`input`:case`select`:case`textarea`:r=!!r.autoFocus;break a;case`img`:r=!0;break a;default:r=!1}r&&hl(t)}}return H(t),t.subtreeFlags&=-33554433,gl(t,t.type,e===null?null:e.memoizedProps,t.pendingProps,n),null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==r&&hl(t);else{if(typeof r!=`string`&&t.stateNode===null)throw Error(i(166));if(e=Oe.current,pa(t)){if(e=t.stateNode,n=t.memoizedProps,r=null,a=oa,a!==null)switch(a.tag){case 27:case 5:r=a.memoizedProps}e[Dt]=t,e=!!(e.nodeValue===n||r!==null&&!0===r.suppressHydrationWarning||ep(e.nodeValue,n)),e||ua(t,!0)}else e=lp(e).createTextNode(r),e[Dt]=t,t.stateNode=e}return H(t),null;case 31:if(n=t.memoizedState,e===null||e.memoizedState!==null){if(r=pa(t),n!==null){if(e===null){if(!r)throw Error(i(318));if(e=t.memoizedState,e=e===null?null:e.dehydrated,!e)throw Error(i(557));e[Dt]=t}else ma(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;H(t),e=!1}else n=ha(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=n),e=!0;if(!e)return t.flags&256?(zo(t),t):(zo(t),null);if(t.flags&128)throw Error(i(558))}return H(t),null;case 13:if(r=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(a=pa(t),r!==null&&r.dehydrated!==null){if(e===null){if(!a)throw Error(i(318));if(a=t.memoizedState,a=a===null?null:a.dehydrated,!a)throw Error(i(317));a[Dt]=t}else ma(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;H(t),a=!1}else a=ha(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=a),a=!0;if(!a)return t.flags&256?(zo(t),t):(zo(t),null)}return zo(t),t.flags&128?(t.lanes=n,t):(n=r!==null,e=e!==null&&e.memoizedState!==null,n&&(r=t.child,a=null,r.alternate!==null&&r.alternate.memoizedState!==null&&r.alternate.memoizedState.cachePool!==null&&(a=r.alternate.memoizedState.cachePool.pool),o=null,r.memoizedState!==null&&r.memoizedState.cachePool!==null&&(o=r.memoizedState.cachePool.pool),o!==a&&(r.flags|=2048)),n!==e&&n&&(t.child.flags|=8192),vl(t,t.updateQueue),H(t),null);case 4:return je(),e===null&&Wf(t.stateNode.containerInfo),t.flags|=67108864,H(t),null;case 10:return xa(t.type),H(t),null;case 19:if(Ho(t),r=t.memoizedState,r===null)return H(t),null;if(a=!!(t.flags&128),o=r.rendering,o===null){if(a)yl(r,!1);else{if(od!==0||e!==null&&e.flags&128)for(e=t.child;e!==null;){if(o=Uo(e),o!==null){for(t.flags|=128,yl(r,!1),e=o.updateQueue,t.updateQueue=e,vl(t,e),t.subtreeFlags=0,e=n,n=t.child;n!==null;)Ri(n,e),n=n.sibling;return Vo(t,Bo.current&1|2),R&&ta(t,r.treeForkCount),t.child}e=e.sibling}r.tail!==null&&Ge()>_d&&(t.flags|=128,a=!0,yl(r,!1),t.lanes=4194304)}}else{if(!a){if(e=Uo(o),e!==null){if(t.flags|=128,a=!0,e=e.updateQueue,t.updateQueue=e,vl(t,e),yl(r,!0),r.tail===null&&r.tailMode!==`collapsed`&&r.tailMode!==`visible`&&!o.alternate&&!R)return H(t),null}else 2*Ge()-r.renderingStartTime>_d&&n!==536870912&&(t.flags|=128,a=!0,yl(r,!1),t.lanes=4194304)}r.isBackwards?(o.sibling=t.child,t.child=o):(e=r.last,e===null?t.child=o:e.sibling=o,r.last=o)}if(r.tail!==null){e=r.tail;a:{for(n=e;n!==null;){if(n.alternate!==null){n=!1;break a}n=n.sibling}n=!0}return r.rendering=e,r.tail=e.sibling,r.renderingStartTime=Ge(),e.sibling=null,o=Bo.current,o=a?o&1|2:o&1,r.tailMode===`visible`||r.tailMode===`collapsed`||!n||R?Vo(t,o):(n=o,A(No,t),A(Bo,n),Po===null&&(Po=t)),R&&ta(t,r.treeForkCount),e}return H(t),null;case 22:case 23:return zo(t),Mo(),r=t.memoizedState!==null,e===null?r&&(t.flags|=8192):e.memoizedState!==null!==r&&(t.flags|=8192),r?n&536870912&&!(t.flags&128)&&(H(t),t.subtreeFlags&6&&(t.flags|=8192)):H(t),n=t.updateQueue,n!==null&&vl(t,n.retryQueue),n=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),r=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(r=t.memoizedState.cachePool.pool),r!==n&&(t.flags|=2048),e!==null&&Te(qa),null;case 24:return n=null,e!==null&&(n=e.memoizedState.cache),t.memoizedState.cache!==n&&(t.flags|=2048),xa(Na),H(t),null;case 25:return null;case 30:return t.flags|=33554432,H(t),null}throw Error(i(156,t.tag))}function xl(e,t){switch(ia(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return xa(Na),je(),e=t.flags,e&65536&&!(e&128)?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return Ne(t),null;case 31:if(t.memoizedState!==null){if(zo(t),t.alternate===null)throw Error(i(340));ma()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 13:if(zo(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(i(340));ma()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return Ho(t),e=t.flags,e&65536?(t.flags=e&-65537|128,e=t.memoizedState,e!==null&&(e.rendering=null,e.tail=null),t.flags|=4,t):null;case 4:return je(),null;case 10:return xa(t.type),null;case 22:case 23:return zo(t),Mo(),e!==null&&Te(qa),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return xa(Na),null;case 25:return null;default:return null}}function Sl(e,t){switch(ia(t),t.tag){case 3:xa(Na),je();break;case 26:case 27:case 5:Ne(t);break;case 4:je();break;case 31:t.memoizedState!==null&&zo(t);break;case 13:zo(t);break;case 19:Ho(t);break;case 10:xa(t.type);break;case 22:case 23:zo(t),Mo(),e!==null&&Te(qa);break;case 24:xa(Na)}}function Cl(e,t){try{var n=t.updateQueue,r=n===null?null:n.lastEffect;if(r!==null){var i=r.next;n=i;do{if((n.tag&e)===e){r=void 0;var a=n.create,o=n.inst;r=a(),o.destroy=r}n=n.next}while(n!==i)}}catch(e){Z(t,t.return,e)}}function wl(e,t,n){try{var r=t.updateQueue,i=r===null?null:r.lastEffect;if(i!==null){var a=i.next;r=a;do{if((r.tag&e)===e){var o=r.inst,s=o.destroy;if(s!==void 0){o.destroy=void 0,i=t;var c=n,l=s;try{l()}catch(e){Z(i,c,e)}}}r=r.next}while(r!==a)}}catch(e){Z(t,t.return,e)}}function Tl(e){var t=e.updateQueue;if(t!==null){var n=e.stateNode;try{Do(t,n)}catch(t){Z(e,e.return,t)}}}function El(e,t,n){n.props=wc(e.type,e.memoizedProps),n.state=e.memoizedState;try{n.componentWillUnmount()}catch(n){Z(e,t,n)}}function Dl(e,t){try{var n=e.ref;if(n!==null){switch(e.tag){case 26:case 27:case 5:var r=e.stateNode;break;case 30:var i=e.stateNode,a=xi(e.memoizedProps,i);(i.ref===null||i.ref.name!==a)&&(i.ref=Pp(a)),r=i.ref;break;case 7:if(e.stateNode===null){var o=new Fp(e);p(e.child,!1,Qp,o,void 0,void 0),e.stateNode=o}r=e.stateNode;break;default:r=e.stateNode}typeof n==`function`?e.refCleanup=n(r):n.current=r}}catch(n){Z(e,t,n)}}function Ol(e,t){var n=e.ref,r=e.refCleanup;if(n!==null){if(typeof r==`function`)try{r()}catch(n){Z(e,t,n)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof n==`function`)try{n(null)}catch(n){Z(e,t,n)}else n.current=null}}function kl(e,t){if((e.tag===5||e.tag===27||e.tag===6)&&e.alternate===null&&t!==null)for(var n=0;n<t.length;n++)em(e.stateNode,t[n])}function Al(e){for(var t=e.return;t!==null&&(Nl(t)&&em(e.stateNode,t.stateNode),!Ml(t));)t=t.return}function jl(e){for(var t=e.return;t!==null&&(Nl(t)&&tm(e.stateNode,t.stateNode),!Ml(t));)t=t.return}function Ml(e){return e.tag===5||e.tag===3||e.tag===27}function Nl(e){return e&&e.tag===7&&e.stateNode!==null}function Pl(e){var t=e.type,n=e.memoizedProps,r=e.stateNode;try{a:switch(t){case`button`:case`input`:case`select`:case`textarea`:n.autoFocus&&r.focus();break a;case`img`:n.src?r.src=n.src:n.srcSet&&(r.srcset=n.srcSet)}}catch(t){Z(e,e.return,t)}}function Fl(e,t,n){try{var r=e.stateNode;ip(r,e.type,n,t),r[Ot]=t}catch(t){Z(e,e.return,t)}}function Il(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&Sp(e.type)||e.tag===4}function Ll(e){a:for(;;){for(;e.sibling===null;){if(e.return===null||Il(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&Sp(e.type)||e.flags&2||e.child===null||e.tag===4)continue a;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Rl(e,t,n,r){var i=e.tag;if(i===5||i===6)i=e.stateNode,t?(n.nodeType===9?n.body:n.nodeName===`HTML`?n.ownerDocument.body:n).insertBefore(i,t):(t=n.nodeType===9?n.body:n.nodeName===`HTML`?n.ownerDocument.body:n,t.appendChild(i),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=Cn)),kl(e,r),P=!0;else if(i!==4&&(i===27&&(kl(e,r),r=null,Sp(e.type)&&(n=e.stateNode,t=null)),e=e.child,e!==null))for(Rl(e,t,n,r),e=e.sibling;e!==null;)Rl(e,t,n,r),e=e.sibling}function zl(e,t,n,r){var i=e.tag;if(i===5||i===6)i=e.stateNode,t?n.insertBefore(i,t):n.appendChild(i),kl(e,r),P=!0;else if(i!==4&&(i===27&&(kl(e,r),r=null,Sp(e.type)&&(n=e.stateNode)),e=e.child,e!==null))for(zl(e,t,n,r),e=e.sibling;e!==null;)zl(e,t,n,r),e=e.sibling}function Bl(e){var t=e.stateNode,n=e.memoizedProps;try{for(var r=e.type,i=t.attributes;i.length;)t.removeAttributeNode(i[0]);np(t,r,n),t[Dt]=e,t[Ot]=n}catch(t){Z(e,e.return,t)}}var Vl=!1,Hl=null;function Ul(e){(e.tag===30||e.subtreeFlags&33554432)&&(Vl=!0)}var Wl=null;function Gl(){var e=Wl;return Wl=null,e}var Kl=0;function ql(e,t,n,r,i){return Kl=0,Jl(e.child,t,n,r,i)}function Jl(e,t,n,r,i){for(var a=!1;e!==null;){if(e.tag===5){var o=e.stateNode;if(r!==null){var s=Op(o);r.push(s),s.view&&(a=!0)}else a||Op(o).view&&(a=!0);Vl=!0,Tp(o,Kl===0?t:t+`_`+Kl,n),Kl++}else(e.tag!==22||e.memoizedState===null)&&(e.tag===30&&i||Jl(e.child,t,n,r,i)&&(a=!0));e=e.sibling}return a}function Yl(e,t){for(;e!==null;)e.tag===5?Ep(e.stateNode,e.memoizedProps):(e.tag!==22||e.memoizedState===null)&&(e.tag===30&&t||Yl(e.child,t)),e=e.sibling}function Xl(e){if(e.subtreeFlags&18874368)for(e=e.child;e!==null;){if((e.tag!==22||e.memoizedState===null)&&(Xl(e),e.tag===30&&e.flags&18874368&&e.stateNode.paired)){var t=e.memoizedProps;if(t.name==null||t.name===`auto`)throw Error(i(544));var n=t.name;t=Ci(t.default,t.share),t!==`none`&&(ql(e,n,t,null,!1)||Yl(e.child,!1))}e=e.sibling}}function Zl(e,t){if(e.tag===30){var n=e.stateNode,r=e.memoizedProps,i=xi(r,n),a=Ci(r.default,n.paired?r.share:r.enter);a===`none`?Xl(e):ql(e,i,a,null,!1)?(Xl(e),n.paired||t||Nd(e,r.onEnter)):Yl(e.child,!1)}else if(e.subtreeFlags&33554432)for(e=e.child;e!==null;)Zl(e,t),e=e.sibling;else Xl(e)}function Ql(e){if(Hl!==null&&Hl.size!==0){var t=Hl;if(e.subtreeFlags&18874368)for(e=e.child;e!==null;){if(e.tag!==22||e.memoizedState===null){if(e.tag===30&&e.flags&18874368){var n=e.memoizedProps,r=n.name;if(r!=null&&r!==`auto`){var i=t.get(r);if(i!==void 0){var a=Ci(n.default,n.share);if(a!==`none`&&(ql(e,r,a,null,!1)?(a=e.stateNode,i.paired=a,a.paired=i,Nd(e,n.onShare)):Yl(e.child,!1)),t.delete(r),t.size===0)break}}}Ql(e)}e=e.sibling}}}function $l(e){if(e.tag===30){var t=e.memoizedProps,n=xi(t,e.stateNode),r=Hl===null?void 0:Hl.get(n),i=Ci(t.default,r===void 0?t.exit:t.share);i!==`none`&&(ql(e,n,i,null,!1)?r===void 0?Nd(e,t.onExit):(i=e.stateNode,r.paired=i,i.paired=r,Hl.delete(n),Nd(e,t.onShare)):Yl(e.child,!1)),Hl!==null&&Ql(e)}else if(e.subtreeFlags&33554432)for(e=e.child;e!==null;)$l(e),e=e.sibling;else Hl!==null&&Ql(e)}function eu(e){for(e=e.child;e!==null;){if(e.tag===30){var t=e.memoizedProps,n=xi(t,e.stateNode);t=Ci(t.default,t.update),e.flags&=-5,t!==`none`&&ql(e,n,t,e.memoizedState=[],!1)}else e.subtreeFlags&33554432&&eu(e);e=e.sibling}}function tu(e){if(e.subtreeFlags&18874368)for(e=e.child;e!==null;){if(e.tag!==22||e.memoizedState===null){if(e.tag===30&&e.flags&18874368){var t=e.stateNode;t.paired!==null&&(t.paired=null,Yl(e.child,!1))}tu(e)}e=e.sibling}}function nu(e){if(e.tag===30)e.stateNode.paired=null,Yl(e.child,!1),tu(e);else if(e.subtreeFlags&33554432)for(e=e.child;e!==null;)nu(e),e=e.sibling;else tu(e)}function ru(e){for(e=e.child;e!==null;)e.tag===30?Yl(e.child,!1):e.subtreeFlags&33554432&&ru(e),e=e.sibling}function iu(e,t,n,r,i,a,o){for(var s=!1;t!==null;){if(t.tag===5){var c=t.stateNode;if(a!==null&&Kl<a.length){var l=a[Kl],u=Op(c);(l.view||u.view)&&(s=!0);var d;if(d=!(e.flags&4)){if(u.clip)d=!0;else{d=l.rect;var f=u.rect;d=d.y!==f.y||d.x!==f.x||d.height!==f.height||d.width!==f.width}}d&&(e.flags|=4),u.abs?u=!l.abs:(l=l.rect,u=u.rect,u=l.height!==u.height||l.width!==u.width),u&&(e.flags|=32)}else e.flags|=32;e.flags&4&&Tp(c,Kl===0?n:n+`_`+Kl,i),s&&e.flags&4||(Wl===null&&(Wl=[]),Wl.push(c,Kl===0?r:r+`_`+Kl,t.memoizedProps)),Kl++}else(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&o?e.flags|=t.flags&32:iu(e,t.child,n,r,i,a,o)&&(s=!0));t=t.sibling}return s}function au(e,t){for(e=e.child;e!==null;){if(e.tag===30){var n=e.memoizedProps,r=e.stateNode,i=xi(n,r),a=Ci(n.default,n.update);if(t){r=r.clones;var o=r===null?null:r.map(kp)}else o=e.memoizedState,e.memoizedState=null;r=e;var s=e.child;Kl=0,i=iu(r,s,i,i,a,o,!1),e.flags&4&&i&&(t||Nd(e,n.onUpdate))}else e.subtreeFlags&33554432&&au(e,t);e=e.sibling}}var ou=!1,U=!1,su=!1,cu=!1,lu=typeof WeakSet==`function`?WeakSet:Set,uu=null,du=!1,fu=!1,pu=!1,mu=!1;function hu(e,t,n){if(e=e.containerInfo,sp=gh,e=Zr(e),Qr(e)){if(`selectionStart`in e)var r={start:e.selectionStart,end:e.selectionEnd};else a:{r=(r=e.ownerDocument)&&r.defaultView||window;var i=r.getSelection&&r.getSelection();if(i&&i.rangeCount!==0){r=i.anchorNode;var a=i.anchorOffset,o=i.focusNode;i=i.focusOffset;try{r.nodeType,o.nodeType}catch{r=null;break a}var s=0,c=-1,l=-1,u=0,d=0,f=e,p=null;b:for(;;){for(var m;f!==r||a!==0&&f.nodeType!==3||(c=s+a),f!==o||i!==0&&f.nodeType!==3||(l=s+i),f.nodeType===3&&(s+=f.nodeValue.length),(m=f.firstChild)!==null;)p=f,f=m;for(;;){if(f===e)break b;if(p===r&&++u===a&&(c=s),p===o&&++d===i&&(l=s),(m=f.nextSibling)!==null)break;f=p,p=f.parentNode}f=m}r=c===-1||l===-1?null:{start:c,end:l}}else r=null}r||={start:0,end:0}}else r=null;for(cp={focusedElem:e,selectionRange:r},gh=!1,n=(n&335544064)===n,uu=t,t=n?9270:1024;uu!==null;){if(e=uu,n&&(r=e.deletions,r!==null))for(a=0;a<r.length;a++)n&&$l(r[a]);if(e.alternate===null&&e.flags&2)n&&Ul(e),gu(n);else{if(e.tag===22){if(r=e.alternate,e.memoizedState!==null){r!==null&&r.memoizedState===null&&n&&$l(r),gu(n);continue}if(r!==null&&r.memoizedState!==null){n&&Ul(e),gu(n);continue}}r=e.child,(e.subtreeFlags&t)!==0&&r!==null?(r.return=e,uu=r):(n&&eu(e),gu(n))}}Hl=null}function gu(e){for(;uu!==null;){var t=uu,n=e,r=t.alternate,a=t.flags;switch(t.tag){case 0:case 11:case 15:break;case 1:if(a&1024&&r!==null){n=void 0,a=r.memoizedProps,r=r.memoizedState;var o=t.stateNode;try{var s=wc(t.type,a);n=o.getSnapshotBeforeUpdate(s,r),o.__reactInternalSnapshotBeforeUpdate=n}catch(e){Z(t,t.return,e)}}break;case 3:if(a&1024){if(r=t.stateNode.containerInfo,n=r.nodeType,n===9)nm(r);else if(n===1)switch(r.nodeName){case`HEAD`:case`HTML`:case`BODY`:nm(r);break;default:r.textContent=``}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;case 30:n&&r!==null&&(n=xi(r.memoizedProps,r.stateNode),a=t.memoizedProps,a=Ci(a.default,a.update),a!==`none`&&ql(r,n,a,r.memoizedState=[],!0));break;default:if(a&1024)throw Error(i(163))}if(r=t.sibling,r!==null){r.return=t.return,uu=r;break}uu=t.return}}function _u(e,t,n){var r=n.flags;switch(n.tag){case 0:case 11:case 15:Iu(e,n),r&4&&Cl(5,n);break;case 1:if(Iu(e,n),r&4){if(e=n.stateNode,t===null)try{e.componentDidMount()}catch(e){Z(n,n.return,e)}else{var i=wc(n.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(i,t,e.__reactInternalSnapshotBeforeUpdate)}catch(e){Z(n,n.return,e)}}}r&64&&Tl(n),r&512&&Dl(n,n.return);break;case 3:if(Iu(e,n),r&64&&(e=n.updateQueue,e!==null)){if(t=null,n.child!==null)switch(n.child.tag){case 27:case 5:t=n.child.stateNode;break;case 1:t=n.child.stateNode}try{Do(e,t)}catch(e){Z(n,n.return,e)}}break;case 27:t===null&&r&4&&Bl(n);case 26:case 5:Iu(e,n),t===null&&r&4&&Pl(n),r&512&&Dl(n,n.return);break;case 12:Iu(e,n);break;case 31:Iu(e,n),r&4&&Tu(e,n);break;case 13:Iu(e,n),r&4&&Eu(e,n),r&64&&(e=n.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(n=_f.bind(null,n),cm(e,n))));break;case 22:if(r=n.memoizedState!==null||ou,!r){var a=t!==null&&t.memoizedState!==null||U;t=ou,i=U,ou=r,(U=a)&&!i?(r=2,n.subtreeFlags&8772&&(r|=1),Ru(e,n,r)):Iu(e,n),ou=t,U=i}break;case 30:Iu(e,n),r&512&&Dl(n,n.return);break;case 7:r&512&&Dl(n,n.return);default:Iu(e,n)}}function vu(e,t){for(e=e.child;e!==null;)yu(e,t),e=e.sibling}function yu(e,t){switch(e.tag){case 5:case 26:try{var n=e.stateNode;if(t){var r=n.style;typeof r.setProperty==`function`?r.setProperty(`display`,`none`,`important`):r.display=`none`}else{var i=e.stateNode,a=e.memoizedProps.style,o=a!=null&&a.hasOwnProperty(`display`)?a.display:null;i.style.display=o==null||typeof o==`boolean`?``:(``+o).trim()}}catch(t){Z(e,e.return,t)}bu(e,t);break;case 6:try{e.stateNode.nodeValue=t?``:e.memoizedProps,P=!0}catch(t){Z(e,e.return,t)}break;case 18:try{var s=e.stateNode;t?wp(s,!0):wp(e.stateNode,!1)}catch(t){Z(e,e.return,t)}break;case 22:case 23:e.memoizedState===null&&vu(e,t);break;default:vu(e,t)}}function bu(e,t){if(e.subtreeFlags&67108864)for(e=e.child;e!==null;){a:{var n=e,r=t;switch(n.tag){case 4:yu(n,r);break a;case 22:n.memoizedState===null&&bu(n,r);break a;default:bu(n,r)}}e=e.sibling}}function xu(e){var t=e.alternate;t!==null&&(e.alternate=null,xu(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&It(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var W=null,Su=!1;function Cu(e,t,n){for(n=n.child;n!==null;)wu(e,t,n),n=n.sibling}function wu(e,t,n){if(tt&&typeof tt.onCommitFiberUnmount==`function`)try{tt.onCommitFiberUnmount(et,n)}catch{}switch(n.tag){case 26:U||Ol(n,t),Cu(e,t,n),n.memoizedState?n.memoizedState.count--:n.stateNode&&!U&&(n=n.stateNode,n.parentNode.removeChild(n));break;case 27:U||Ol(n,t),jl(n);var r=W,i=Su;Sp(n.type)&&(W=n.stateNode,Su=!1),Cu(e,t,n),gm(n.stateNode,n.type,n.memoizedProps),W=r,Su=i;break;case 5:U||Ol(n,t),jl(n);case 6:if(n.tag===6&&jl(n),r=W,i=Su,W=null,Cu(e,t,n),W=r,Su=i,W!==null){if(Su)try{(W.nodeType===9?W.body:W.nodeName===`HTML`?W.ownerDocument.body:W).removeChild(n.stateNode),P=!0}catch(e){Z(n,t,e)}else try{W.removeChild(n.stateNode),P=!0}catch(e){Z(n,t,e)}}break;case 18:W!==null&&(Su?(e=W,Cp(e.nodeType===9?e.body:e.nodeName===`HTML`?e.ownerDocument.body:e,n.stateNode),Hh(e)):Cp(W,n.stateNode));break;case 4:r=W,i=Su,W=n.stateNode.containerInfo,Su=!0,Cu(e,t,n),W=r,Su=i;break;case 0:case 11:case 14:case 15:wl(2,n,t),U||wl(4,n,t),Cu(e,t,n);break;case 1:U||(Ol(n,t),r=n.stateNode,typeof r.componentWillUnmount==`function`&&El(n,t,r)),Cu(e,t,n);break;case 21:Cu(e,t,n);break;case 22:U=(r=U)||n.memoizedState!==null,Cu(e,t,n),U=r;break;case 30:Ol(n,t),Cu(e,t,n);break;case 7:U||Ol(n,t),Cu(e,t,n);break;default:Cu(e,t,n)}}function Tu(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null))){e=e.dehydrated;try{Hh(e)}catch(e){Z(t,t.return,e)}}}function Eu(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{Hh(e)}catch(e){Z(t,t.return,e)}}function Du(e){switch(e.tag){case 31:case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new lu),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new lu),t;default:throw Error(i(435,e.tag))}}function Ou(e,t){var n=Du(e);t.forEach(function(t){if(!n.has(t)){n.add(t);var r=vf.bind(null,e,t);t.then(r,r)}})}function ku(e,t,n){var r=t.deletions;if(r!==null)for(var a=0;a<r.length;a++){var o=r[a],s=e,c=t,l=c;a:for(;l!==null;){switch(l.tag){case 27:if(Sp(l.type)){W=l.stateNode,Su=!1;break a}break;case 5:W=l.stateNode,Su=!1;break a;case 3:case 4:W=l.stateNode.containerInfo,Su=!0;break a}l=l.return}if(W===null)throw Error(i(160));wu(s,c,o),W=null,Su=!1,s=o.alternate,s!==null&&(s.return=null),o.return=null}if(t.subtreeFlags&13886)for(t=t.child;t!==null;)ju(t,e,n),t=t.sibling}var Au=null;function ju(e,t,n){var r=e.alternate,a=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(a&4&&(r=e.updateQueue,r=r===null?null:r.events,r!==null))for(var o=0;o<r.length;o++){var s=r[o];s.ref.impl=s.nextImpl}ku(t,e,n),Mu(e),a&4&&(wl(3,e,e.return),Cl(3,e),wl(5,e,e.return));break;case 1:ku(t,e,n),Mu(e),a&512&&(U||r===null||Ol(r,r.return)),a&64&&ou&&(e=e.updateQueue,e!==null&&(t=e.callbacks,t!==null&&(n=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=n===null?t:n.concat(t))));break;case 26:if(o=Au,ku(t,e,n),Mu(e),a&512&&(U||r===null||Ol(r,r.return)),a&4){if(a=r===null?null:r.memoizedState,n=e.memoizedState,r===null){if(n===null){if(e.stateNode===null){if(ou)e.stateNode=fp(e.type,e.memoizedProps,t.containerInfo,e);else{a:{t=e.type,n=e.memoizedProps,a=o.ownerDocument||o;b:switch(t){case`title`:r=a.getElementsByTagName(`title`)[0],(!r||r[Pt]||r[Dt]||r.namespaceURI===`http://www.w3.org/2000/svg`||r.hasAttribute(`itemprop`))&&(r=a.createElement(t),a.head.insertBefore(r,a.querySelector(`head > title`))),np(r,t,n),r[Dt]=e,Vt(r),t=r;break a;case`link`:if(o=Gm(`link`,`href`,a).get(t+(n.href||``))){for(s=0;s<o.length;s++)if(r=o[s],r.getAttribute(`href`)===(n.href==null||n.href===``?null:n.href)&&r.getAttribute(`rel`)===(n.rel==null?null:n.rel)&&r.getAttribute(`title`)===(n.title==null?null:n.title)&&r.getAttribute(`crossorigin`)===(n.crossOrigin==null?null:n.crossOrigin)){o.splice(s,1);break b}}r=a.createElement(t),np(r,t,n),a.head.appendChild(r);break;case`meta`:if(o=Gm(`meta`,`content`,a).get(t+(n.content||``))){for(s=0;s<o.length;s++)if(r=o[s],r.getAttribute(`content`)===(n.content==null?null:``+n.content)&&r.getAttribute(`name`)===(n.name==null?null:n.name)&&r.getAttribute(`property`)===(n.property==null?null:n.property)&&r.getAttribute(`http-equiv`)===(n.httpEquiv==null?null:n.httpEquiv)&&r.getAttribute(`charset`)===(n.charSet==null?null:n.charSet)){o.splice(s,1);break b}}r=a.createElement(t),np(r,t,n),a.head.appendChild(r);break;default:throw Error(i(468,t))}r[Dt]=e,Vt(r),t=r}e.stateNode=t}}else ou||Km(o,e.type,e.stateNode)}else e.stateNode=Bm(o,n,e.memoizedProps)}else a===n?n===null&&e.stateNode!==null&&Fl(e,e.memoizedProps,r.memoizedProps):(a===null?(t=r.stateNode,t===null||U||t.parentNode.removeChild(t)):a.count--,n===null?ou||Km(o,e.type,e.stateNode):Bm(o,n,e.memoizedProps))}break;case 27:ku(t,e,n),Mu(e),a&512&&(U||r===null||Ol(r,r.return)),r!==null&&a&4&&Fl(e,e.memoizedProps,r.memoizedProps);break;case 5:if(o=su,su=!1,ku(t,e,n),su=o,Mu(e),a&512&&(U||r===null||Ol(r,r.return)),e.flags&32){t=e.stateNode;try{hn(t,``),P=!0}catch(t){Z(e,e.return,t)}}a&4&&e.stateNode!=null&&(t=e.memoizedProps,Fl(e,t,r===null?t:r.memoizedProps)),a&1024&&(cu=!0);break;case 6:if(ku(t,e,n),Mu(e),a&4){if(e.stateNode===null)throw Error(i(162));t=e.memoizedProps,n=e.stateNode;try{n.nodeValue=t,P=!0}catch(t){Z(e,e.return,t)}}break;case 3:if(P=!1,Wm=null,o=Au,Au=bm(t.containerInfo),ku(t,e,n),Au=o,Mu(e),a&4&&r!==null&&r.memoizedState.isDehydrated)try{Hh(t.containerInfo)}catch(t){Z(e,e.return,t)}cu&&(cu=!1,Nu(e)),P=!1;break;case 4:a=su,su=ou,r=Zt(),o=Au,Au=bm(e.stateNode.containerInfo),ku(t,e,n),Mu(e),Au=o,P&&fu&&(pu=!0),P=r,su=a;break;case 12:ku(t,e,n),Mu(e);break;case 31:ku(t,e,n),Mu(e),a&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,Ou(e,t)));break;case 13:ku(t,e,n),Mu(e),e.child.flags&8192&&e.memoizedState!==null!=(r!==null&&r.memoizedState!==null)&&(hd=Ge()),a&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,Ou(e,t)));break;case 22:o=e.memoizedState!==null,s=r!==null&&r.memoizedState!==null;var c=ou,l=U,u=su;ou=c||o,su=u||o,U=l||s,ku(t,e,n),U=l,su=u,ou=c,Mu(e),a&8192&&(t=e.stateNode,t._visibility=o?t._visibility&-2:t._visibility|1,!o||r===null||s||ou||U||(t=s||U,n=ou,r=U,ou=o||ou,U=t,Lu(e,2),ou=n,U=r),!o&&su||vu(e,o)),a&4&&(t=e.updateQueue,t!==null&&(n=t.retryQueue,n!==null&&(t.retryQueue=null,Ou(e,n))));break;case 19:ku(t,e,n),Mu(e),a&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,Ou(e,t)));break;case 30:a&512&&(U||r===null||Ol(r,r.return)),a=Zt(),o=fu,s=(n&335544064)===n,c=e.memoizedProps,fu=s&&Ci(c.default,c.update)!==`none`,ku(t,e,n),Mu(e),s&&r!==null&&P&&(e.flags|=4),fu=o,P=a;break;case 21:break;case 7:a&512&&(U||r===null||Ol(r,r.return)),r&&r.stateNode!==null&&(r.stateNode._fragmentFiber=e);default:ku(t,e,n),Mu(e)}}function Mu(e){var t=e.flags;if(t&2){try{for(var n,r=e.return;r!==null;){if(Il(r)){n=r;break}r=r.return}r=null;for(var a=e.return;a!==null;){if(Nl(a)){var o=a.stateNode;r===null?r=[o]:r.push(o)}if(Ml(a))break;a=a.return}var s=r;if(n==null)throw Error(i(160));switch(n.tag){case 27:var c=n.stateNode;zl(e,Ll(e),c,s);break;case 5:var l=n.stateNode;n.flags&32&&(hn(l,``),n.flags&=-33),zl(e,Ll(e),l,s);break;case 3:case 4:var u=n.stateNode.containerInfo;Rl(e,Ll(e),u,s);break;default:throw Error(i(161))}}catch(t){Z(e,e.return,t)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function Nu(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;Nu(t),t.tag===5&&t.flags&1024&&(t=t.stateNode,gh=!0,t.reset(),gh=!1),e=e.sibling}}function Pu(e,t){if(t.subtreeFlags&9270)for(t=t.child;t!==null;)Fu(t,e),t=t.sibling;else au(t,!1)}function Fu(e,t){var n=e.alternate;if(n===null)Zl(e,!1);else switch(e.tag){case 3:if(mu=du=!1,Gl(),Pu(t,e),!du&&!pu){if(e=Wl,e!==null)for(var r=0;r<e.length;r+=3){n=e[r];var i=e[r+1];Ep(n,e[r+2]),n=n.ownerDocument.documentElement,n!==null&&n.animate({opacity:[0,0],pointerEvents:[`none`,`none`]},{duration:0,fill:`forwards`,pseudoElement:`::view-transition-group(`+i+`)`})}e=t.containerInfo,e=e.nodeType===9?e.documentElement:e.ownerDocument.documentElement,e!==null&&e.style.viewTransitionName===``&&(e.style.viewTransitionName=`none`,e.animate({opacity:[0,0],pointerEvents:[`none`,`none`]},{duration:0,fill:`forwards`,pseudoElement:`::view-transition-group(root)`}),e.animate({width:[0,0],height:[0,0]},{duration:0,fill:`forwards`,pseudoElement:`::view-transition`})),mu=!0}Wl=null;break;case 5:Pu(t,e);break;case 4:r=du,du=!1,Pu(t,e),du&&(pu=!0),du=r;break;case 22:e.memoizedState===null&&(n.memoizedState===null?Pu(t,e):Zl(e,!1));break;case 30:r=du,i=Gl(),du=!1,Pu(t,e),du&&(e.flags|=4);var a=e.memoizedProps,o=e.stateNode;t=xi(a,o),o=xi(n.memoizedProps,o);var s=Ci(a.default,a.update);s===`none`?t=!1:(a=n.memoizedState,n.memoizedState=null,n=e.child,Kl=0,t=iu(e,n,t,o,s,a,!0),Kl!==(a===null?0:a.length)&&(e.flags|=32)),e.flags&4&&t?(Nd(e,e.memoizedProps.onUpdate),Wl=i):i!==null&&(i.push.apply(i,Wl),Wl=i),du=e.flags&32?!0:r;break;default:Pu(t,e)}}function Iu(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)_u(e,t.alternate,t),t=t.sibling}function Lu(e,t){for(e=e.child;e!==null;){var n=e,r=t;switch(n.tag){case 0:case 11:case 14:case 15:wl(4,n,n.return),Lu(n,r);break;case 1:Ol(n,n.return);var i=n.stateNode;typeof i.componentWillUnmount==`function`&&El(n,n.return,i),Lu(n,r);break;case 27:r&2&&gm(n.stateNode,n.type,n.memoizedProps);case 5:Ol(n,n.return),n.tag!==5&&n.tag!==27||jl(n),Lu(n,r);break;case 6:jl(n);break;case 26:Ol(n,n.return),i=n.stateNode,n.memoizedState!==null||i===null||U||i.parentNode.removeChild(i),Lu(n,r);break;case 22:n.memoizedState===null&&Lu(n,r);break;case 30:Ol(n,n.return),Lu(n,r);break;case 7:Ol(n,n.return);default:Lu(n,r)}e=e.sibling}}function Ru(e,t,n){for(n=t.subtreeFlags&8772?n:n&-2,t=t.child;t!==null;){var r=t.alternate,i=e,a=t,o=a.flags,s=!!(n&1);switch(a.tag){case 0:case 11:case 15:Ru(i,a,n),Cl(4,a);break;case 1:if(Ru(i,a,n),r=a,i=r.stateNode,typeof i.componentDidMount==`function`)try{i.componentDidMount()}catch(e){Z(r,r.return,e)}if(r=a,i=r.updateQueue,i!==null){var c=r.stateNode;try{var l=i.shared.hiddenCallbacks;if(l!==null)for(i.shared.hiddenCallbacks=null,i=0;i<l.length;i++)Eo(l[i],c)}catch(e){Z(r,r.return,e)}}s&&o&64&&Tl(a),Dl(a,a.return);break;case 27:n&2&&Bl(a);case 5:a.tag!==5&&a.tag!==27||Al(a),Ru(i,a,n),s&&r===null&&o&4&&Pl(a),Dl(a,a.return);break;case 6:Al(a);break;case 26:c=a.stateNode,a.memoizedState!==null||c===null||ou||Km(bm(c.ownerDocument),a.type,c),Ru(i,a,n),s&&r===null&&o&4&&Pl(a),Dl(a,a.return);break;case 12:Ru(i,a,n);break;case 31:Ru(i,a,n),s&&o&4&&Tu(i,a);break;case 13:Ru(i,a,n),s&&o&4&&Eu(i,a);break;case 22:a.memoizedState===null&&Ru(i,a,n),Dl(a,a.return);break;case 30:Ru(i,a,n),Dl(a,a.return);break;case 7:Dl(a,a.return);default:Ru(i,a,n)}t=t.sibling}}function zu(e,t){var n=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==n&&(e!=null&&e.refCount++,n!=null&&Fa(n))}function Bu(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&Fa(e))}function Vu(e,t,n,r){var i=(n&335544064)===n;if(t.subtreeFlags&(i?10262:10256))for(t=t.child;t!==null;)Hu(e,t,n,r),t=t.sibling;else i&&ru(t)}function Hu(e,t,n,r){var i=(n&335544064)===n;i&&t.alternate===null&&t.return!==null&&t.return.alternate!==null&&nu(t);var a=t.flags;switch(t.tag){case 0:case 11:case 15:Vu(e,t,n,r),a&2048&&Cl(9,t);break;case 1:Vu(e,t,n,r);break;case 3:Vu(e,t,n,r),i&&mu&&(e=e.containerInfo,e=e.nodeType===9?e.body:e.nodeName===`HTML`?e.ownerDocument.body:e,e.style.viewTransitionName===`root`&&(e.style.viewTransitionName=``),e=e.ownerDocument.documentElement,e!==null&&e.style.viewTransitionName===`none`&&(e.style.viewTransitionName=``)),a&2048&&(a=null,t.alternate!==null&&(a=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==a&&(t.refCount++,a!=null&&Fa(a)));break;case 12:if(a&2048){Vu(e,t,n,r),a=t.stateNode;try{var o=t.memoizedProps,s=o.id,c=o.onPostCommit;typeof c==`function`&&c(s,t.alternate===null?`mount`:`update`,a.passiveEffectDuration,-0)}catch(e){Z(t,t.return,e)}}else Vu(e,t,n,r);break;case 31:Vu(e,t,n,r);break;case 13:Vu(e,t,n,r);break;case 23:break;case 22:o=t.stateNode,s=t.alternate,t.memoizedState===null?(i&&s!==null&&s.memoizedState!==null&&nu(t),o._visibility&2?Vu(e,t,n,r):(o._visibility|=2,Uu(e,t,n,r,!!(t.subtreeFlags&10256)||!1))):(i&&s!==null&&s.memoizedState===null&&nu(s),o._visibility&2?Vu(e,t,n,r):Wu(e,t)),a&2048&&zu(s,t);break;case 24:Vu(e,t,n,r),a&2048&&Bu(t.alternate,t);break;case 30:i&&(a=t.alternate,a!==null&&(Yl(a.child,!0),Yl(t.child,!0))),Vu(e,t,n,r);break;default:Vu(e,t,n,r)}}function Uu(e,t,n,r,i){for(i&&=!!(t.subtreeFlags&10256)||!1,t=t.child;t!==null;){var a=e,o=t,s=n,c=r,l=o.flags;switch(o.tag){case 0:case 11:case 15:Uu(a,o,s,c,i),Cl(8,o);break;case 23:break;case 22:var u=o.stateNode;o.memoizedState===null?(u._visibility|=2,Uu(a,o,s,c,i)):u._visibility&2?Uu(a,o,s,c,i):Wu(a,o),i&&l&2048&&zu(o.alternate,o);break;case 24:Uu(a,o,s,c,i),i&&l&2048&&Bu(o.alternate,o);break;default:Uu(a,o,s,c,i)}t=t.sibling}}function Wu(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var n=e,r=t,i=r.flags;switch(r.tag){case 22:Wu(n,r),i&2048&&zu(r.alternate,r);break;case 24:Wu(n,r),i&2048&&Bu(r.alternate,r);break;default:Wu(n,r)}t=t.sibling}}var Gu=8192;function Ku(e,t,n){if(e.subtreeFlags&Gu)for(e=e.child;e!==null;)qu(e,t,n),e=e.sibling}function qu(e,t,n){switch(e.tag){case 26:Ku(e,t,n),e.flags&Gu&&(e.memoizedState===null?(e=e.stateNode,(t&335544128)===t&&Zm(n,e)):Qm(n,Au,e.memoizedState,e.memoizedProps));break;case 5:Ku(e,t,n),e.flags&Gu&&(e=e.stateNode,(t&335544128)===t&&Zm(n,e));break;case 3:case 4:var r=Au;Au=bm(e.stateNode.containerInfo),Ku(e,t,n),Au=r;break;case 22:e.memoizedState===null&&(r=e.alternate,r!==null&&r.memoizedState!==null?(r=Gu,Gu=16777216,Ku(e,t,n),Gu=r):Ku(e,t,n));break;case 30:if((e.flags&Gu)!==0&&(r=e.memoizedProps.name,r!=null&&r!==`auto`)){var i=e.stateNode;i.paired=null,Hl===null&&(Hl=new Map),Hl.set(r,i)}Ku(e,t,n);break;default:Ku(e,t,n)}}function Ju(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function Yu(e){var t=e.deletions;if(e.flags&16){if(t!==null)for(var n=0;n<t.length;n++){var r=t[n];uu=r,Qu(r,e)}Ju(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)Xu(e),e=e.sibling}function Xu(e){switch(e.tag){case 0:case 11:case 15:Yu(e),e.flags&2048&&wl(9,e,e.return);break;case 3:Yu(e);break;case 12:Yu(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&2&&(e.return===null||e.return.tag!==13)?(t._visibility&=-3,Zu(e)):Yu(e);break;default:Yu(e)}}function Zu(e){var t=e.deletions;if(e.flags&16){if(t!==null)for(var n=0;n<t.length;n++){var r=t[n];uu=r,Qu(r,e)}Ju(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:wl(8,t,t.return),Zu(t);break;case 22:n=t.stateNode,n._visibility&2&&(n._visibility&=-3,Zu(t));break;default:Zu(t)}e=e.sibling}}function Qu(e,t){for(;uu!==null;){var n=uu;switch(n.tag){case 0:case 11:case 15:wl(8,n,t);break;case 23:case 22:if(n.memoizedState!==null&&n.memoizedState.cachePool!==null){var r=n.memoizedState.cachePool.pool;r!=null&&r.refCount++}break;case 24:Fa(n.memoizedState.cache)}if(r=n.child,r!==null)r.return=n,uu=r;else a:for(n=e;uu!==null;){r=uu;var i=r.sibling,a=r.return;if(xu(r),r===n){uu=null;break a}if(i!==null){i.return=a,uu=i;break a}uu=a}}}var $u={getCacheForType:function(e){var t=Da(Na),n=t.data.get(e);return n===void 0&&(n=e(),t.data.set(e,n)),n},cacheSignal:function(){return Da(Na).controller.signal}},ed=typeof WeakMap==`function`?WeakMap:Map,G=0,K=null,q=null,J=0,Y=0,td=null,nd=!1,rd=!1,id=!1,ad=0,od=0,sd=0,cd=0,ld=0,ud=0,dd=0,fd=null,pd=null,md=!1,hd=0,gd=0,_d=1/0,vd=null,yd=null,X=0,bd=null,xd=null,Sd=0,Cd=0,wd=null,Td=null,Ed=null,Dd=null,Od=null,kd=0,Ad=null;function jd(){return G&2&&J!==0?J&-J:O.T===null?wt():Pf()}function Md(){if(ud===0){if(!(J&536870912)||R){var e=ct;ct<<=1,!(ct&3932160)&&(ct=262144),ud=e}else ud=536870912}return e=No.current,e!==null&&(e.flags|=32),ud}function Nd(e,t){if(t!=null){var n=e.stateNode,r=n.ref;r===null&&(r=n.ref=Pp(xi(e.memoizedProps,n))),Dd===null&&(Dd=[]),Dd.push(t.bind(null,r))}}function Pd(e,t,n){(e===K&&(Y===2||Y===9)||e.cancelPendingCommit!==null)&&(Vd(e,0),Rd(e,J,ud,!1)),_t(e,n),(!(G&2)||e!==K)&&(e===K&&(!(G&2)&&(cd|=n),od===4&&Rd(e,J,ud,!1)),Ef(e))}function Fd(e,t,n){if(G&6)throw Error(i(327));var r=!n&&!(t&127)&&(t&e.expiredLanes)===0||ft(e,t),a=r?Yd(e,t):qd(e,t,!0),o=r;do{if(a===0){rd&&!r&&Rd(e,t,0,!1);break}if(n=e.current.alternate,o&&!Ld(n)){a=qd(e,t,!1),o=!1;continue}if(a===2){if(o=t,e.errorRecoveryDisabledLanes&o)var s=0;else s=e.pendingLanes&-536870913,s=s===0?s&536870912?536870912:0:s;if(s!==0){t=s;a:{var c=e;a=fd;var l=c.current.memoizedState.isDehydrated;if(l&&(Vd(c,s).flags|=256),s=qd(c,s,!1),s!==2&&s!==6){if(id&&!l){c.errorRecoveryDisabledLanes|=o,cd|=o,a=4;break a}o=pd,pd=a,o!==null&&(pd===null?pd=o:pd.push.apply(pd,o))}a=s}if(o=!1,a!==2)continue}}if(a===1){Vd(e,0),Rd(e,t,0,!0);break}a:{switch(r=e,o=a,o){case 0:case 1:throw Error(i(345));case 4:if((t&4194048)!==t&&(t&62914560)!==t)break;case 6:Rd(r,t,ud,!nd);break a;case 2:pd=null;break;case 3:case 5:break;default:throw Error(i(329))}if((t&62914560)===t&&(a=hd+300-Ge(),10<a)){if(Rd(r,t,ud,!nd),dt(r,0,!0)!==0)break a;Sd=t,r.timeoutHandle=gp(Id.bind(null,r,n,pd,vd,md,t,ud,cd,dd,nd,o,`Throttled`,-0,0),a);break a}Id(r,n,pd,vd,md,t,ud,cd,dd,nd,o,null,-0,0)}break}while(1);Ef(e)}function Id(e,t,n,r,i,a,o,s,c,l,u,d,f,p){e.timeoutHandle=-1;var m=t.subtreeFlags,h=(a&335544064)===a;if(d=null,(h||m&8192||(m&16785408)==16785408)&&(d={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:Cn},Hl=null,qu(t,a,d),h&&(m=d,h=e.containerInfo,h=(h.nodeType===9?h:h.ownerDocument).__reactViewTransition,h!=null&&(m.count++,m.waitingForViewTransition=!0,m=nh.bind(m),h.finished.then(m,m))),m=(a&62914560)===a?hd-Ge():(a&4194048)===a?gd-Ge():0,m=eh(d,m),m!==null)){Sd=a,e.cancelPendingCommit=m(nf.bind(null,e,t,a,n,r,i,o,s,c,l,u,d,null,f,p)),Rd(e,a,o,!l);return}nf(e,t,a,n,r,i,o,s,c,l,u,d)}function Ld(e){for(var t=e;;){var n=t.tag;if((n===0||n===11||n===15)&&t.flags&16384&&(n=t.updateQueue,n!==null&&(n=n.stores,n!==null)))for(var r=0;r<n.length;r++){var i=n[r],a=i.getSnapshot;i=i.value;try{if(!Gr(a(),i))return!1}catch{return!1}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function Rd(e,t,n,r){t=pt(e,t),t&=~ld,t&=~cd,e.suspendedLanes|=t,e.pingedLanes&=~t,r&&(e.warmLanes|=t),r=e.expirationTimes;for(var i=t;0<i;){var a=31-rt(i),o=1<<a;r[a]=-1,i&=~o}n!==0&&yt(e,n,t)}function zd(){return G&6?!0:(Df(0,!1),!1)}function Bd(){if(q!==null){if(Y===0)var e=q.return;else e=q,ya=va=null,os(e),so=null,co=0,e=q;for(;e!==null;)Sl(e.alternate,e),e=e.return;q=null}}function Vd(e,t){var n=e.timeoutHandle;return n!==-1&&(e.timeoutHandle=-1,_p(n)),n=e.cancelPendingCommit,n!==null&&(e.cancelPendingCommit=null,n()),Sd=0,Bd(),K=e,q=n=Li(e.current,null),J=t,Y=0,td=null,nd=!1,rd=ft(e,t),id=!1,dd=ud=ld=cd=sd=od=0,pd=fd=null,md=!1,ad=pt(e,t),Oi(),n}function Hd(e,t){z=null,O.H=gc,t===Za||t===$a?(t=ao(),Y=3):t===Qa?(t=ao(),Y=4):Y=t===Pc?8:typeof t==`object`&&t&&typeof t.then==`function`?6:1,td=t,q===null&&(od=1,Oc(e,Gi(t,e.current)))}function Ud(){var e=No.current;return e===null?!0:(J&4194048)===J?Po===null:(J&62914560)===J||J&536870912?e===Po:!1}function Wd(){var e=O.H;return O.H=gc,e===null?gc:e}function Gd(){var e=O.A;return O.A=$u,e}function Kd(){od=4,nd||(J&4194048)!==J&&No.current!==null||(rd=!0),!(sd&134217727)&&!(cd&134217727)||K===null||Rd(K,J,ud,!1)}function qd(e,t,n){var r=G;G|=2;var i=Wd(),a=Gd();(K!==e||J!==t)&&(vd=null,Vd(e,t)),t=!1;var o=od;a:do try{if(Y!==0&&q!==null){var s=q,c=td;switch(Y){case 8:Bd(),o=6;break a;case 3:case 2:case 9:case 6:No.current===null&&(t=!0);var l=Y;if(Y=0,td=null,$d(e,s,c,l),n&&rd){o=0;break a}break;default:l=Y,Y=0,td=null,$d(e,s,c,l)}}Jd(),o=od;break}catch(t){Hd(e,t)}while(1);return t&&e.shellSuspendCounter++,ya=va=null,G=r,O.H=i,O.A=a,q===null&&(K=null,J=0,Oi()),o}function Jd(){for(;q!==null;)Zd(q)}function Yd(e,t){var n=G;G|=2;var r=Wd(),a=Gd();K!==e||J!==t?(vd=null,_d=Ge()+500,Vd(e,t)):rd=ft(e,t);a:do try{if(Y!==0&&q!==null){t=q;var o=td;b:switch(Y){case 1:Y=0,td=null,$d(e,t,o,1);break;case 2:case 9:if(to(o)){Y=0,td=null,Qd(t);break}t=function(){Y!==2&&Y!==9||K!==e||(Y=7),Ef(e)},o.then(t,t);break a;case 3:Y=7;break a;case 4:Y=5;break a;case 7:to(o)?(Y=0,td=null,Qd(t)):(Y=0,td=null,$d(e,t,o,7));break;case 5:var s=null;switch(q.tag){case 26:s=q.memoizedState;case 5:case 27:var c=q;if(s?Ym(s):c.stateNode.complete){Y=0,td=null;var l=c.sibling;if(l!==null)q=l;else{var u=c.return;u===null?q=null:(q=u,ef(u))}break b}}Y=0,td=null,$d(e,t,o,5);break;case 6:Y=0,td=null,$d(e,t,o,6);break;case 8:Bd(),od=6;break a;default:throw Error(i(462))}}Xd();break}catch(t){Hd(e,t)}while(1);return ya=va=null,O.H=r,O.A=a,G=n,q===null?(K=null,J=0,Oi(),od):0}function Xd(){for(;q!==null&&!Ue();)Zd(q)}function Zd(e){var t=ml(e.alternate,e,ad);e.memoizedProps=e.pendingProps,t===null?ef(e):q=t}function Qd(e){var t=e,n=t.alternate;switch(t.tag){case 15:case 0:t=Jc(n,t,t.pendingProps,t.type,void 0,J);break;case 11:t=Jc(n,t,t.pendingProps,t.type.render,t.ref,J);break;case 5:os(t);var r=t;r===oa&&(R?(fa(r),r.tag===5&&r.stateNode!=null&&(L=r.stateNode)):(fa(r),R=!0));default:Sl(n,t),t=q=Ri(t,ad),t=ml(n,t,ad)}e.memoizedProps=e.pendingProps,t===null?ef(e):q=t}function $d(e,t,n,r){ya=va=null,os(t),so=null,co=0;var i=t.return;try{if(Nc(e,i,t,n,J)){od=1,Oc(e,Gi(n,e.current)),q=null;return}}catch(t){if(i!==null)throw q=i,t;od=1,Oc(e,Gi(n,e.current)),q=null;return}t.flags&32768?(R||r===1?e=!0:rd||J&536870912?e=!1:(nd=e=!0,(r===2||r===9||r===3||r===6)&&(r=No.current,r!==null&&r.tag===13&&(r.flags|=16384))),tf(t,e)):ef(t)}function ef(e){var t=e;do{if(t.flags&32768){tf(t,nd);return}e=t.return;var n=bl(t.alternate,t,ad);if(n!==null){q=n;return}if(t=t.sibling,t!==null){q=t;return}q=t=e}while(t!==null);od===0&&(od=5)}function tf(e,t){do{var n=xl(e.alternate,e);if(n!==null){n.flags&=32767,q=n;return}if(n=e.return,n!==null&&(n.flags|=32768,n.subtreeFlags=0,n.deletions=null),!t&&(e=e.sibling,e!==null)){q=e;return}q=e=n}while(e!==null);od=6,q=null}function nf(e,t,n,r,a,o,s,c,l,u,d,f){e.cancelPendingCommit=null;do df();while(X!==0);if(G&6)throw Error(i(327));if(t!==null){if(t===e.current)throw Error(i(177));e===K&&(q=K=null,J=0),xd=t,bd=e,Sd=n,wd=a,Td=r,rf(e,t,n,s,c,l,f)}}function rf(e,t,n,r,i,a,o){var s=t.lanes|t.childLanes;if(Cd=s,s|=Di,vt(e,n,s,r,i,a),Dd=null,(n&335544064)===n?(Od=Ra(e),r=10262):(Od=null,r=10256),(t.subtreeFlags&r)!==0||(t.flags&r)!==0?(e.callbackNode=null,e.callbackPriority=0,yf(Xe,function(){return ff(),null})):(e.callbackNode=null,e.callbackPriority=0),Vl=!1,r=!!(t.flags&13878),t.subtreeFlags&13878||r){r=O.T,O.T=null,i=k.p,k.p=2,a=G,G|=4;try{hu(e,t,n)}finally{G=a,k.p=i,O.T=r}}X=1,Vl?Ed=Mp(o,e.containerInfo,Od,sf,cf,of,lf,ff,af,null,null):(sf(),cf(),lf())}function af(e){if(X!==0){var t=bd.onRecoverableError;t(e,{componentStack:null})}}function of(){X===3&&(X=0,Fu(xd,bd),X=4)}function sf(){if(X===1){X=0;var e=bd,t=xd,n=Sd,r=!!(t.flags&13878);if(t.subtreeFlags&13878||r){r=O.T,O.T=null;var i=k.p;k.p=2;var a=G;G|=4;try{fu=pu=!1,ju(t,e,n),n=cp;var o=Zr(e.containerInfo),s=n.focusedElem,c=n.selectionRange;if(o!==s&&s&&s.ownerDocument&&Xr(s.ownerDocument.documentElement,s)){if(c!==null&&Qr(s)){var l=c.start,u=c.end;if(u===void 0&&(u=l),`selectionStart`in s)s.selectionStart=l,s.selectionEnd=Math.min(u,s.value.length);else{var d=s.ownerDocument||document,f=d&&d.defaultView||window;if(f.getSelection){var p=f.getSelection(),m=s.textContent.length,h=Math.min(c.start,m),g=c.end===void 0?h:Math.min(c.end,m);!p.extend&&h>g&&(o=g,g=h,h=o);var _=Yr(s,h),v=Yr(s,g);if(_&&v&&(p.rangeCount!==1||p.anchorNode!==_.node||p.anchorOffset!==_.offset||p.focusNode!==v.node||p.focusOffset!==v.offset)){var y=d.createRange();y.setStart(_.node,_.offset),p.removeAllRanges(),h>g?(p.addRange(y),p.extend(v.node,v.offset)):(y.setEnd(v.node,v.offset),p.addRange(y))}}}}for(d=[],p=s;p=p.parentNode;)p.nodeType===1&&d.push({element:p,left:p.scrollLeft,top:p.scrollTop});for(typeof s.focus==`function`&&s.focus(),s=0;s<d.length;s++){var b=d[s];b.element.scrollLeft=b.left,b.element.scrollTop=b.top}}gh=!!sp,cp=sp=null}finally{G=a,k.p=i,O.T=r}}e.current=t,X=2}}function cf(){if(X===2){X=0;var e=bd,t=xd,n=!!(t.flags&8772);if(t.subtreeFlags&8772||n){n=O.T,O.T=null;var r=k.p;k.p=2;var i=G;G|=4;try{_u(e,t.alternate,t)}finally{G=i,k.p=r,O.T=n}}X=3}}function lf(){if(X===4||X===3){X=0;var e=Ed;Ed=null,We();var t=bd,n=xd,r=Sd,i=Td,a=(r&335544064)===r?10262:10256;if((n.subtreeFlags&a)!==0||(n.flags&a)!==0?X=5:(X=0,xd=bd=null,uf(t,t.pendingLanes)),a=t.pendingLanes,a===0&&(yd=null),Ct(r),n=n.stateNode,tt&&typeof tt.onCommitFiberRoot==`function`)try{tt.onCommitFiberRoot(et,n,void 0,(n.current.flags&128)==128)}catch{}if(i!==null){n=O.T,a=k.p,k.p=2,O.T=null;try{for(var o=t.onRecoverableError,s=0;s<i.length;s++){var c=i[s];o(c.value,{componentStack:c.stack})}}finally{O.T=n,k.p=a}}if(i=Dd,o=Od,Od=null,i!==null&&(Dd=null,o===null&&(o=[]),e!==null))for(c=0;c<i.length;c++)n=(0,i[c])(o),n!==void 0&&e.finished.finally(n);Sd&3&&df(),Ef(t),a=t.pendingLanes,r&261930&&a&42?t===Ad?kd++:(kd=0,Ad=t):(kd=0,Ad=null),Df(0,!1)}}function uf(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,Fa(t)))}function df(){return Ed!==null&&(Ed.skipTransition(),Ed=null),sf(),cf(),lf(),ff()}function ff(){if(X!==5)return!1;var e=bd,t=Cd;Cd=0;var n=Ct(Sd),r=O.T,a=k.p;try{k.p=32>n?32:n,O.T=null,n=wd,wd=null;var o=bd,s=Sd;if(X=0,xd=bd=null,Sd=0,G&6)throw Error(i(331));var c=G;if(G|=4,Xu(o.current),Hu(o,o.current,s,n),G=c,Df(0,!1),tt&&typeof tt.onPostCommitFiberRoot==`function`)try{tt.onPostCommitFiberRoot(et,o)}catch{}return!0}finally{k.p=a,O.T=r,uf(e,t)}}function pf(e,t,n){t=Gi(n,t),t=Ac(e.stateNode,t,2),e=bo(e,t,2),e!==null&&(_t(e,2),Ef(e))}function Z(e,t,n){if(e.tag===3)pf(e,e,n);else for(;t!==null;){if(t.tag===3){pf(t,e,n);break}if(t.tag===1){var r=t.stateNode;if(typeof t.type.getDerivedStateFromError==`function`||typeof r.componentDidCatch==`function`&&(yd===null||!yd.has(r))){e=Gi(n,e),n=jc(2),r=bo(t,n,2),r!==null&&(Mc(n,r,t,e),_t(r,2),Ef(r));break}}t=t.return}}function mf(e,t,n){var r=e.pingCache;if(r===null){r=e.pingCache=new ed;var i=new Set;r.set(t,i)}else i=r.get(t),i===void 0&&(i=new Set,r.set(t,i));i.has(n)||(id=!0,i.add(n),e=hf.bind(null,e,t,n),t.then(e,e))}function hf(e,t,n){var r=e.pingCache;r!==null&&r.delete(t),e.pingedLanes|=e.suspendedLanes&n,e.warmLanes&=~n,K===e&&(J&n)===n&&(od===4||od===3&&(J&62914560)===J&&300>Ge()-hd?G&2?ld|=n:Vd(e,0):ld|=n,dd===J&&(dd=0)),Ef(e)}function gf(e,t){t===0&&(t=ht()),e=I(e,t),e!==null&&(_t(e,t),Ef(e))}function _f(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),gf(e,n)}function vf(e,t){var n=0;switch(e.tag){case 31:case 13:var r=e.stateNode,a=e.memoizedState;a!==null&&(n=a.retryLane);break;case 19:r=e.stateNode;break;case 22:r=e.stateNode._retryCache;break;default:throw Error(i(314))}r!==null&&r.delete(t),gf(e,n)}function yf(e,t){return Ve(e,t)}var bf=null,xf=null,Sf=!1,Cf=!1,wf=!1,Tf=0;function Ef(e){e!==xf&&e.next===null&&(xf===null?bf=xf=e:xf=xf.next=e),Cf=!0,Sf||(Sf=!0,Nf())}function Df(e,t){if(!wf&&Cf){wf=!0;do for(var n=!1,r=bf;r!==null;){if(!t){if(e!==0){var i=r.pendingLanes;if(i===0)var a=0;else{var o=r.suspendedLanes,s=r.pingedLanes;a=(1<<31-rt(42|e)+1)-1,a&=i&~(o&~s),a=a&201326741?a&201326741|1:a?a|2:0}a!==0&&(n=!0,Mf(r,a))}else a=J,a=dt(r,r===K?a:0,r.cancelPendingCommit!==null||r.timeoutHandle!==-1),!(a&3)||ft(r,a)||(n=!0,Mf(r,a))}r=r.next}while(n);wf=!1}}function Of(){kf()}function kf(){Cf=Sf=!1;var e=0;Tf!==0&&hp()&&(e=Tf);for(var t=Ge(),n=null,r=bf;r!==null;){var i=r.next,a=Af(r,t);a===0?(r.next=null,n===null?bf=i:n.next=i,i===null&&(xf=n)):(n=r,(e!==0||a&3)&&(Cf=!0)),r=i}X!==0&&X!==5||Df(e,!1),Tf!==0&&(Tf=0)}function Af(e,t){for(var n=e.suspendedLanes,r=e.pingedLanes,i=e.expirationTimes,a=e.pendingLanes&-62914561;0<a;){var o=31-rt(a),s=1<<o,c=i[o];c===-1?((s&n)===0||(s&r)!==0)&&(i[o]=mt(s,t)):c<=t&&(e.expiredLanes|=s),a&=~s}if(t=K,n=J,n=dt(e,e===t?n:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),r=e.callbackNode,n===0||e===t&&(Y===2||Y===9)||e.cancelPendingCommit!==null)return r!==null&&r!==null&&He(r),e.callbackNode=null,e.callbackPriority=0;if(!(n&3)||ft(e,n)){if(t=n&-n,t===e.callbackPriority)return t;switch(r!==null&&He(r),Ct(n)){case 2:case 8:n=Je;break;case 32:n=Xe;break;case 268435456:n=$e;break;default:n=Xe}return r=jf.bind(null,e),n=Ve(n,r),e.callbackPriority=t,e.callbackNode=n,t}return r!==null&&r!==null&&He(r),e.callbackPriority=2,e.callbackNode=null,2}function jf(e,t){if(X!==0&&X!==5)return e.callbackNode=null,e.callbackPriority=0,null;var n=e.callbackNode;if(df()&&e.callbackNode!==n)return null;var r=J;return r=dt(e,e===K?r:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),r===0?null:(Fd(e,r,t),Af(e,Ge()),e.callbackNode!=null&&e.callbackNode===n?jf.bind(null,e):null)}function Mf(e,t){if(df())return null;Fd(e,t,!0)}function Nf(){bp(function(){G&6?Ve(qe,Of):kf()})}function Pf(){if(Tf===0){var e=Va;e===0&&(e=st,st<<=1,!(st&261888)&&(st=256)),Tf=e}return Tf}function Ff(e){return e==null||typeof e==`symbol`||typeof e==`boolean`?null:typeof e==`function`?e:Sn(e)}function If(e,t,n,r,i){if(t===`submit`&&n&&n.stateNode===i){var a=Ff((i[Ot]||null).action),o=r.submitter;o&&(t=(t=o[Ot]||null)?Ff(t.formAction):o.getAttribute(`formAction`),t!==null&&(a=t,o=null));var s=new Wn(`action`,`action`,null,r,i);e.push({event:s,listeners:[{instance:null,listener:function(){if(r.defaultPrevented){if(Tf!==0){var e=new FormData(i,o);nc(n,{pending:!0,data:e,method:i.method,action:a},null,e)}}else typeof a==`function`&&(s.preventDefault(),e=new FormData(i,o),nc(n,{pending:!0,data:e,method:i.method,action:a},a,e))},currentTarget:i}]})}}for(var Lf=0;Lf<vi.length;Lf++){var Rf=vi[Lf];yi(Rf.toLowerCase(),`on`+(Rf[0].toUpperCase()+Rf.slice(1)))}yi(ui,`onAnimationEnd`),yi(di,`onAnimationIteration`),yi(fi,`onAnimationStart`),yi(`dblclick`,`onDoubleClick`),yi(`focusin`,`onFocus`),yi(`focusout`,`onBlur`),yi(pi,`onTransitionRun`),yi(mi,`onTransitionStart`),yi(hi,`onTransitionCancel`),yi(gi,`onTransitionEnd`),Kt(`onMouseEnter`,[`mouseout`,`mouseover`]),Kt(`onMouseLeave`,[`mouseout`,`mouseover`]),Kt(`onPointerEnter`,[`pointerout`,`pointerover`]),Kt(`onPointerLeave`,[`pointerout`,`pointerover`]),Gt(`onChange`,`change click focusin focusout input keydown keyup selectionchange`.split(` `)),Gt(`onSelect`,`focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange`.split(` `)),Gt(`onBeforeInput`,[`compositionend`,`keypress`,`textInput`,`paste`]),Gt(`onCompositionEnd`,`compositionend focusout keydown keypress keyup mousedown`.split(` `)),Gt(`onCompositionStart`,`compositionstart focusout keydown keypress keyup mousedown`.split(` `)),Gt(`onCompositionUpdate`,`compositionupdate focusout keydown keypress keyup mousedown`.split(` `));var zf=`abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting`.split(` `),Bf=new Set(`beforetoggle cancel close invalid load scroll scrollend toggle`.split(` `).concat(zf));function Vf(e,t){t=!!(t&4);for(var n=0;n<e.length;n++){var r=e[n],i=r.event;r=r.listeners;a:{var a=void 0;if(t)for(var o=r.length-1;0<=o;o--){var s=r[o],c=s.instance,l=s.currentTarget;if(s=s.listener,c!==a&&i.isPropagationStopped())break a;a=s,i.currentTarget=l;try{a(i)}catch(e){wi(e)}i.currentTarget=null,a=c}else for(o=0;o<r.length;o++){if(s=r[o],c=s.instance,l=s.currentTarget,s=s.listener,c!==a&&i.isPropagationStopped())break a;a=s,i.currentTarget=l;try{a(i)}catch(e){wi(e)}i.currentTarget=null,a=c}}}}function Q(e,t){var n=t[At];n===void 0&&(n=t[At]=new Set);var r=e+`__bubble`;n.has(r)||(Gf(t,e,2,!1),n.add(r))}function Hf(e,t,n){var r=0;t&&(r|=4),Gf(n,e,r,t)}var Uf=`_reactListening`+Math.random().toString(36).slice(2);function Wf(e){if(!e[Uf]){e[Uf]=!0,Ut.forEach(function(t){t!==`selectionchange`&&(Bf.has(t)||Hf(t,!1,e),Hf(t,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[Uf]||(t[Uf]=!0,Hf(`selectionchange`,!1,t))}}function Gf(e,t,n,r){switch(Ch(t)){case 2:var i=_h;break;case 8:i=vh;break;default:i=yh}n=i.bind(null,t,n,e),i=void 0,!Nn||t!==`touchstart`&&t!==`touchmove`&&t!==`wheel`||(i=!0),r?i===void 0?e.addEventListener(t,n,!0):e.addEventListener(t,n,{capture:!0,passive:i}):i===void 0?e.addEventListener(t,n,!1):e.addEventListener(t,n,{passive:i})}function Kf(e,t,n,r,i){var a=r;if(!(t&1)&&!(t&2)&&r!==null)a:for(;;){if(r===null)return;var o=r.tag;if(o===3||o===4){var c=r.stateNode.containerInfo;if(c===i)break;if(o===4)for(o=r.return;o!==null;){var l=o.tag;if((l===3||l===4)&&o.stateNode.containerInfo===i)return;o=o.return}for(;c!==null;){if(o=Lt(c),o===null)return;if(l=o.tag,l===5||l===6||l===26||l===27){r=a=o;continue a}c=c.parentNode}}r=r.return}An(function(){var r=a,i=Tn(n),o=[];a:{var c=_i.get(e);if(c!==void 0){var l=Wn,u=e;switch(e){case`keypress`:if(zn(n)===0)break a;case`keydown`:case`keyup`:l=sr;break;case`focusin`:u=`focus`,l=$n;break;case`focusout`:u=`blur`,l=$n;break;case`beforeblur`:case`afterblur`:l=$n;break;case`click`:if(n.button===2)break a;case`auxclick`:case`dblclick`:case`mousedown`:case`mousemove`:case`mouseup`:case`mouseout`:case`mouseover`:case`contextmenu`:l=Zn;break;case`drag`:case`dragend`:case`dragenter`:case`dragexit`:case`dragleave`:case`dragover`:case`dragstart`:case`drop`:l=Qn;break;case`touchcancel`:case`touchend`:case`touchmove`:case`touchstart`:l=ur;break;case ui:case di:case fi:l=er;break;case gi:l=dr;break;case`scroll`:case`scrollend`:l=Kn;break;case`wheel`:l=fr;break;case`copy`:case`cut`:case`paste`:l=tr;break;case`gotpointercapture`:case`lostpointercapture`:case`pointercancel`:case`pointerdown`:case`pointermove`:case`pointerout`:case`pointerover`:case`pointerup`:l=cr;break;case`submit`:l=lr;break;case`toggle`:case`beforetoggle`:l=pr}var d=!!(t&4),f=!d&&(e===`scroll`||e===`scrollend`),p=d?c===null?null:c+`Capture`:c;d=[];for(var m=r,h;m!==null;){var g=m;if(h=g.stateNode,g=g.tag,g!==5&&g!==26&&g!==27||h===null||p===null||(g=jn(m,p),g!=null&&d.push(qf(m,g,h))),f)break;m=m.return}0<d.length&&(c=new l(c,u,null,n,i),o.push({event:c,listeners:d}))}}if(!(t&7)){a:{if(l=e===`mouseover`||e===`pointerover`,c=e===`mouseout`||e===`pointerout`,l&&n!==wn&&(u=n.relatedTarget||n.fromElement)&&(Lt(u)||u[kt]))break a;(c||l)&&(u=i.window===i?i:(l=i.ownerDocument)?l.defaultView||l.parentWindow:window,c?(l=n.relatedTarget||n.toElement,c=r,l=l?Lt(l):null,l!==null&&(f=s(l),d=l.tag,l!==f||d!==5&&d!==27&&d!==6)&&(l=null)):(c=null,l=r),c!==l&&(d=Zn,g=`onMouseLeave`,p=`onMouseEnter`,m=`mouse`,(e===`pointerout`||e===`pointerover`)&&(d=cr,g=`onPointerLeave`,p=`onPointerEnter`,m=`pointer`),f=c==null?u:zt(c),h=l==null?u:zt(l),u=new d(g,m+`leave`,c,n,i),u.target=f,u.relatedTarget=h,g=null,Lt(i)===r&&(d=new d(p,m+`enter`,l,n,i),d.target=h,d.relatedTarget=f,g=d),f=g,d=c&&l?te(c,l,Yf):null,c!==null&&Xf(o,u,c,d,!1),l!==null&&f!==null&&Xf(o,f,l,d,!0)))}a:{if(c=r?zt(r):window,l=c.nodeName&&c.nodeName.toLowerCase(),l===`select`||l===`input`&&c.type===`file`)var _=Nr;else if(Dr(c)){if(Pr)_=Ur;else{_=Vr;var v=Br}}else l=c.nodeName,!l||l.toLowerCase()!==`input`||c.type!==`checkbox`&&c.type!==`radio`?r&&yn(r.elementType)&&(_=Nr):_=Hr;if(_&&=_(e,r)){Or(o,_,n,i);break a}v&&v(e,c,r)}switch(v=r?zt(r):window,e){case`focusin`:(Dr(v)||v.contentEditable===`true`)&&(ei=v,ti=r,ni=null);break;case`focusout`:ni=ti=ei=null;break;case`mousedown`:ri=!0;break;case`contextmenu`:case`mouseup`:case`dragend`:ri=!1,ii(o,n,i);break;case`selectionchange`:if($r)break;case`keydown`:case`keyup`:ii(o,n,i)}var y;if(hr)b:{switch(e){case`compositionstart`:var b=`onCompositionStart`;break b;case`compositionend`:b=`onCompositionEnd`;break b;case`compositionupdate`:b=`onCompositionUpdate`;break b}b=void 0}else Cr?xr(e,n)&&(b=`onCompositionEnd`):e===`keydown`&&n.keyCode===229&&(b=`onCompositionStart`);b&&(vr&&n.locale!==`ko`&&(Cr||b!==`onCompositionStart`?b===`onCompositionEnd`&&Cr&&(y=Rn()):(Fn=i,In=`value`in Fn?Fn.value:Fn.textContent,Cr=!0)),v=Jf(r,b),0<v.length&&(b=new nr(b,e,null,n,i),o.push({event:b,listeners:v}),y?b.data=y:(y=Sr(n),y!==null&&(b.data=y)))),(y=_r?wr(e,n):Tr(e,n))&&(b=Jf(r,`onBeforeInput`),0<b.length&&(v=new nr(`onBeforeInput`,`beforeinput`,null,n,i),o.push({event:v,listeners:b}),v.data=y)),If(o,e,r,n,i)}Vf(o,t)})}function qf(e,t,n){return{instance:e,listener:t,currentTarget:n}}function Jf(e,t){for(var n=t+`Capture`,r=[];e!==null;){var i=e,a=i.stateNode;if(i=i.tag,i!==5&&i!==26&&i!==27||a===null||(i=jn(e,n),i!=null&&r.unshift(qf(e,i,a)),i=jn(e,t),i!=null&&r.push(qf(e,i,a))),e.tag===3)return r;e=e.return}return[]}function Yf(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function Xf(e,t,n,r,i){for(var a=t._reactName,o=[];n!==null&&n!==r;){var s=n,c=s.alternate,l=s.stateNode;if(s=s.tag,c!==null&&c===r)break;s!==5&&s!==26&&s!==27||l===null||(c=l,i?(l=jn(n,a),l!=null&&o.unshift(qf(n,l,c))):i||(l=jn(n,a),l!=null&&o.push(qf(n,l,c)))),n=n.return}o.length!==0&&e.push({event:t,listeners:o})}var Zf=/\r\n?/g,Qf=/\u0000|\uFFFD/g;function $f(e){return(typeof e==`string`?e:``+e).replace(Zf,`
`).replace(Qf,``)}function ep(e,t){return t=$f(t),$f(e)===t}function $(e,t,n,r,a,o){switch(n){case`children`:if(typeof r==`string`)t===`body`||t===`textarea`&&r===``||hn(e,r);else if(typeof r==`number`||typeof r==`bigint`)t!==`body`&&hn(e,``+r);else return;break;case`className`:$t(e,`class`,r);break;case`tabIndex`:$t(e,`tabindex`,r);break;case`dir`:case`role`:case`viewBox`:case`width`:case`height`:$t(e,n,r);break;case`style`:vn(e,r,o);return;case`data`:if(t!==`object`){$t(e,`data`,r);break}case`src`:case`href`:if(r===``&&(t!==`a`||n!==`href`)){e.removeAttribute(n);break}if(r==null||typeof r==`function`||typeof r==`symbol`||typeof r==`boolean`){e.removeAttribute(n);break}r=Sn(r),e.setAttribute(n,r);break;case`action`:case`formAction`:if(typeof r==`function`){e.setAttribute(n,`javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')`);break}if(typeof o==`function`&&(n===`formAction`?(t!==`input`&&$(e,t,`name`,a.name,a,null),$(e,t,`formEncType`,a.formEncType,a,null),$(e,t,`formMethod`,a.formMethod,a,null),$(e,t,`formTarget`,a.formTarget,a,null)):($(e,t,`encType`,a.encType,a,null),$(e,t,`method`,a.method,a,null),$(e,t,`target`,a.target,a,null))),r==null||typeof r==`symbol`||typeof r==`boolean`){e.removeAttribute(n);break}r=Sn(r),e.setAttribute(n,r);break;case`onClick`:r!=null&&(e.onclick=Cn);return;case`onScroll`:r!=null&&Q(`scroll`,e);return;case`onScrollEnd`:r!=null&&Q(`scrollend`,e);return;case`dangerouslySetInnerHTML`:if(r!=null){if(typeof r!=`object`||!(`__html`in r))throw Error(i(61));if(n=r.__html,n!=null){if(a.children!=null)throw Error(i(60));o?.__html!==n&&(e.innerHTML=n)}}break;case`multiple`:e.multiple=r&&typeof r!=`function`&&typeof r!=`symbol`;break;case`muted`:e.muted=r&&typeof r!=`function`&&typeof r!=`symbol`;break;case`suppressContentEditableWarning`:case`suppressHydrationWarning`:case`defaultValue`:case`defaultChecked`:case`innerHTML`:case`ref`:break;case`autoFocus`:break;case`xlinkHref`:if(r==null||typeof r==`function`||typeof r==`boolean`||typeof r==`symbol`){e.removeAttribute(`xlink:href`);break}n=Sn(r),e.setAttributeNS(`http://www.w3.org/1999/xlink`,`xlink:href`,n);break;case`contentEditable`:case`spellCheck`:case`draggable`:case`value`:case`autoReverse`:case`externalResourcesRequired`:case`focusable`:case`preserveAlpha`:r!=null&&typeof r!=`function`&&typeof r!=`symbol`?e.setAttribute(n,r):e.removeAttribute(n);break;case`inert`:case`allowFullScreen`:case`async`:case`autoPlay`:case`controls`:case`credentialless`:case`default`:case`defer`:case`disabled`:case`disablePictureInPicture`:case`disableRemotePlayback`:case`formNoValidate`:case`hidden`:case`loop`:case`noModule`:case`noValidate`:case`open`:case`playsInline`:case`readOnly`:case`required`:case`reversed`:case`scoped`:case`seamless`:case`itemScope`:r&&typeof r!=`function`&&typeof r!=`symbol`?e.setAttribute(n,``):e.removeAttribute(n);break;case`capture`:case`download`:!0===r?e.setAttribute(n,``):!1!==r&&r!=null&&typeof r!=`function`&&typeof r!=`symbol`?e.setAttribute(n,r):e.removeAttribute(n);break;case`cols`:case`rows`:case`size`:case`span`:r!=null&&typeof r!=`function`&&typeof r!=`symbol`&&!isNaN(r)&&1<=r?e.setAttribute(n,r):e.removeAttribute(n);break;case`rowSpan`:case`start`:r==null||typeof r==`function`||typeof r==`symbol`||isNaN(r)?e.removeAttribute(n):e.setAttribute(n,r);break;case`popover`:Q(`beforetoggle`,e),Q(`toggle`,e),Qt(e,`popover`,r);break;case`xlinkActuate`:en(e,`http://www.w3.org/1999/xlink`,`xlink:actuate`,r);break;case`xlinkArcrole`:en(e,`http://www.w3.org/1999/xlink`,`xlink:arcrole`,r);break;case`xlinkRole`:en(e,`http://www.w3.org/1999/xlink`,`xlink:role`,r);break;case`xlinkShow`:en(e,`http://www.w3.org/1999/xlink`,`xlink:show`,r);break;case`xlinkTitle`:en(e,`http://www.w3.org/1999/xlink`,`xlink:title`,r);break;case`xlinkType`:en(e,`http://www.w3.org/1999/xlink`,`xlink:type`,r);break;case`xmlBase`:en(e,`http://www.w3.org/XML/1998/namespace`,`xml:base`,r);break;case`xmlLang`:en(e,`http://www.w3.org/XML/1998/namespace`,`xml:lang`,r);break;case`xmlSpace`:en(e,`http://www.w3.org/XML/1998/namespace`,`xml:space`,r);break;case`is`:Qt(e,`is`,r);break;case`innerText`:case`textContent`:return;default:if(!(2<n.length)||n[0]!==`o`&&n[0]!==`O`||n[1]!==`n`&&n[1]!==`N`)n=bn.get(n)||n,Qt(e,n,r);else return}P=!0}function tp(e,t,n,r,a,o){switch(n){case`style`:vn(e,r,o);return;case`dangerouslySetInnerHTML`:if(r!=null){if(typeof r!=`object`||!(`__html`in r))throw Error(i(61));if(n=r.__html,n!=null){if(a.children!=null)throw Error(i(60));o?.__html!==n&&(e.innerHTML=n)}}break;case`children`:if(typeof r==`string`)hn(e,r);else if(typeof r==`number`||typeof r==`bigint`)hn(e,``+r);else return;break;case`onScroll`:r!=null&&Q(`scroll`,e);return;case`onScrollEnd`:r!=null&&Q(`scrollend`,e);return;case`onClick`:r!=null&&(e.onclick=Cn);return;case`suppressContentEditableWarning`:case`suppressHydrationWarning`:case`innerHTML`:case`ref`:return;case`innerText`:case`textContent`:return;default:if(!Wt.hasOwnProperty(n))a:{if(n[0]===`o`&&n[1]===`n`&&(a=n.endsWith(`Capture`),o=n.slice(2,a?n.length-7:void 0),t=e[Ot]||null,t=t==null?null:t[n],typeof t==`function`&&e.removeEventListener(o,t,a),typeof r==`function`)){typeof t!=`function`&&t!==null&&(n in e?e[n]=null:e.hasAttribute(n)&&e.removeAttribute(n)),e.addEventListener(o,r,a);break a}P=!0,n in e?e[n]=r:!0===r?e.setAttribute(n,``):Qt(e,n,r)}return}P=!0}function np(e,t,n){switch(t){case`div`:case`span`:case`svg`:case`path`:case`a`:case`g`:case`p`:case`li`:break;case`img`:Q(`error`,e),Q(`load`,e);var r=!1,a=!1,o;for(o in n)if(n.hasOwnProperty(o)){var s=n[o];if(s!=null)switch(o){case`src`:r=!0;break;case`srcSet`:a=!0;break;case`children`:case`dangerouslySetInnerHTML`:throw Error(i(137,t));default:$(e,t,o,s,n,null)}}a&&$(e,t,`srcSet`,n.srcSet,n,null),r&&$(e,t,`src`,n.src,n,null);return;case`input`:Q(`invalid`,e);var c=o=s=a=null,l=null,u=null;for(r in n)if(n.hasOwnProperty(r)){var d=n[r];if(d!=null)switch(r){case`name`:a=d;break;case`type`:s=d;break;case`checked`:l=d;break;case`defaultChecked`:u=d;break;case`value`:o=d;break;case`defaultValue`:c=d;break;case`children`:case`dangerouslySetInnerHTML`:if(d!=null)throw Error(i(137,t));break;default:$(e,t,r,d,n,null)}}un(e,o,c,l,u,s,a,!1);return;case`select`:for(a in Q(`invalid`,e),r=s=o=null,n)if(n.hasOwnProperty(a)&&(c=n[a],c!=null))switch(a){case`value`:o=c;break;case`defaultValue`:s=c;break;case`multiple`:r=c;default:$(e,t,a,c,n,null)}t=o,n=s,e.multiple=!!r,t==null?n!=null&&fn(e,!!r,n,!0):fn(e,!!r,t,!1);return;case`textarea`:for(s in Q(`invalid`,e),o=a=r=null,n)if(n.hasOwnProperty(s)&&(c=n[s],c!=null))switch(s){case`value`:r=c;break;case`defaultValue`:a=c;break;case`children`:o=c;break;case`dangerouslySetInnerHTML`:if(c!=null)throw Error(i(91));break;default:$(e,t,s,c,n,null)}mn(e,r,a,o);return;case`option`:for(l in n)if(n.hasOwnProperty(l)&&(r=n[l],r!=null))switch(l){case`selected`:e.selected=r&&typeof r!=`function`&&typeof r!=`symbol`;break;default:$(e,t,l,r,n,null)}return;case`dialog`:Q(`beforetoggle`,e),Q(`toggle`,e),Q(`cancel`,e),Q(`close`,e);break;case`iframe`:case`object`:Q(`load`,e);break;case`video`:case`audio`:for(r=0;r<zf.length;r++)Q(zf[r],e);break;case`image`:Q(`error`,e),Q(`load`,e);break;case`details`:Q(`toggle`,e);break;case`embed`:case`source`:case`link`:Q(`error`,e),Q(`load`,e);case`area`:case`base`:case`br`:case`col`:case`hr`:case`keygen`:case`meta`:case`param`:case`track`:case`wbr`:case`menuitem`:for(u in n)if(n.hasOwnProperty(u)&&(r=n[u],r!=null))switch(u){case`children`:case`dangerouslySetInnerHTML`:throw Error(i(137,t));default:$(e,t,u,r,n,null)}return;default:if(yn(t)){for(d in n)n.hasOwnProperty(d)&&(r=n[d],r!==void 0&&tp(e,t,d,r,n,void 0));return}}for(c in n)n.hasOwnProperty(c)&&(r=n[c],r!=null&&$(e,t,c,r,n,null))}var rp={};function ip(e,t,n,r){switch(t){case`div`:case`span`:case`svg`:case`path`:case`a`:case`g`:case`p`:case`li`:break;case`input`:var a=null,o=null,s=null,c=null,l=null,u=null,d=null;for(m in n){var f=n[m];if(n.hasOwnProperty(m)&&f!=null)switch(m){case`checked`:break;case`value`:break;case`defaultValue`:l=f;default:r.hasOwnProperty(m)||$(e,t,m,null,r,f)}}for(var p in r){var m=r[p];if(f=n[p],r.hasOwnProperty(p)&&(m!=null||f!=null))switch(p){case`type`:m!==f&&(P=!0),o=m;break;case`name`:m!==f&&(P=!0),a=m;break;case`checked`:m!==f&&(P=!0),u=m;break;case`defaultChecked`:m!==f&&(P=!0),d=m;break;case`value`:m!==f&&(P=!0),s=m;break;case`defaultValue`:m!==f&&(P=!0),c=m;break;case`children`:case`dangerouslySetInnerHTML`:if(m!=null)throw Error(i(137,t));break;default:m!==f&&$(e,t,p,m,r,f)}}ln(e,s,c,l,u,d,o,a);return;case`select`:for(o in m=s=c=p=null,n)if(l=n[o],n.hasOwnProperty(o)&&l!=null)switch(o){case`value`:break;case`multiple`:m=l;default:r.hasOwnProperty(o)||$(e,t,o,null,r,l)}for(a in r)if(o=r[a],l=n[a],r.hasOwnProperty(a)&&(o!=null||l!=null))switch(a){case`value`:o!==l&&(P=!0),p=o;break;case`defaultValue`:o!==l&&(P=!0),c=o;break;case`multiple`:o!==l&&(P=!0),s=o;default:o!==l&&$(e,t,a,o,r,l)}t=c,n=s,r=m,p==null?!!r!=!!n&&(t==null?fn(e,!!n,n?[]:``,!1):fn(e,!!n,t,!0)):fn(e,!!n,p,!1);return;case`textarea`:for(c in m=p=null,n)if(a=n[c],n.hasOwnProperty(c)&&a!=null&&!r.hasOwnProperty(c))switch(c){case`value`:break;case`children`:break;default:$(e,t,c,null,r,a)}for(s in r)if(a=r[s],o=n[s],r.hasOwnProperty(s)&&(a!=null||o!=null))switch(s){case`value`:a!==o&&(P=!0),p=a;break;case`defaultValue`:a!==o&&(P=!0),m=a;break;case`children`:break;case`dangerouslySetInnerHTML`:if(a!=null)throw Error(i(91));break;default:a!==o&&$(e,t,s,a,r,o)}pn(e,p,m);return;case`option`:for(var h in n)if(p=n[h],n.hasOwnProperty(h)&&p!=null&&!r.hasOwnProperty(h))switch(h){case`selected`:e.selected=!1;break;default:$(e,t,h,null,r,p)}for(l in r)if(p=r[l],m=n[l],r.hasOwnProperty(l)&&p!==m&&(p!=null||m!=null))switch(l){case`selected`:p!==m&&(P=!0),e.selected=p&&typeof p!=`function`&&typeof p!=`symbol`;break;default:$(e,t,l,p,r,m)}return;case`img`:case`link`:case`area`:case`base`:case`br`:case`col`:case`embed`:case`hr`:case`keygen`:case`meta`:case`param`:case`source`:case`track`:case`wbr`:case`menuitem`:for(var g in n)p=n[g],n.hasOwnProperty(g)&&p!=null&&!r.hasOwnProperty(g)&&$(e,t,g,null,r,p);for(u in r)if(p=r[u],m=n[u],r.hasOwnProperty(u)&&p!==m&&(p!=null||m!=null))switch(u){case`children`:case`dangerouslySetInnerHTML`:if(p!=null)throw Error(i(137,t));break;default:$(e,t,u,p,r,m)}return;default:if(yn(t)){for(var _ in n)p=n[_],n.hasOwnProperty(_)&&p!==void 0&&!r.hasOwnProperty(_)&&tp(e,t,_,void 0,r,p);for(d in r)p=r[d],m=n[d],!r.hasOwnProperty(d)||p===m||p===void 0&&m===void 0||tp(e,t,d,p,r,m);return}}for(var v in n)p=n[v],n.hasOwnProperty(v)&&p!=null&&!r.hasOwnProperty(v)&&$(e,t,v,null,r,p);for(f in r)p=r[f],m=n[f],!r.hasOwnProperty(f)||p===m||p==null&&m==null||$(e,t,f,p,r,m)}function ap(e){switch(e){case`css`:case`script`:case`font`:case`img`:case`image`:case`input`:case`link`:return!0;default:return!1}}function op(){if(typeof performance.getEntriesByType==`function`){for(var e=0,t=0,n=performance.getEntriesByType(`resource`),r=0;r<n.length;r++){var i=n[r],a=i.transferSize,o=i.initiatorType,s=i.duration;if(a&&s&&ap(o)){for(o=0,s=i.responseEnd,r+=1;r<n.length;r++){var c=n[r],l=c.startTime;if(l>s)break;var u=c.transferSize,d=c.initiatorType;u&&ap(d)&&(c=c.responseEnd,o+=u*(c<s?1:(s-l)/(c-l)))}if(--r,t+=8*(a+o)/(i.duration/1e3),e++,10<e)break}}if(0<e)return t/e/1e6}return navigator.connection&&(e=navigator.connection.downlink,typeof e==`number`)?e:5}var sp=null,cp=null;function lp(e){return e.nodeType===9?e:e.ownerDocument}function up(e){switch(e){case`http://www.w3.org/2000/svg`:return 1;case`http://www.w3.org/1998/Math/MathML`:return 2;default:return 0}}function dp(e,t){if(e===0)switch(t){case`svg`:return 1;case`math`:return 2;default:return 0}return e===1&&t===`foreignObject`?0:e}function fp(e,t,n,r){return n=lp(n).createElement(e),n[Dt]=r,n[Ot]=t,np(n,e,t),Vt(n),n}function pp(e,t){return e===`textarea`||e===`noscript`||typeof t.children==`string`||typeof t.children==`number`||typeof t.children==`bigint`||typeof t.dangerouslySetInnerHTML==`object`&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var mp=null;function hp(){var e=window.event;return e&&e.type===`popstate`?e!==mp&&(mp=e,!0):(mp=null,!1)}var gp=typeof setTimeout==`function`?setTimeout:void 0,_p=typeof clearTimeout==`function`?clearTimeout:void 0,vp=typeof Promise==`function`?Promise:void 0,yp=typeof requestAnimationFrame==`function`?requestAnimationFrame:gp,bp=typeof queueMicrotask==`function`?queueMicrotask:vp===void 0?gp:function(e){return vp.resolve(null).then(e).catch(xp)};function xp(e){setTimeout(function(){throw e})}function Sp(e){return e===`head`}function Cp(e,t){var n=t,r=0;do{var i=n.nextSibling;if(e.removeChild(n),i&&i.nodeType===8){if(n=i.data,n===`/$`||n===`/&`){if(r===0){e.removeChild(i),Hh(t);return}r--}else if(n===`$`||n===`$?`||n===`$~`||n===`$!`||n===`&`)r++;else if(n===`html`)_m(e.ownerDocument.documentElement);else if(n===`head`){n=e.ownerDocument.head,_m(n);for(var a=n.firstChild;a;){var o=a.nextSibling,s=a.nodeName;a[Pt]||s===`SCRIPT`||s===`STYLE`||s===`LINK`&&a.rel.toLowerCase()===`stylesheet`||n.removeChild(a),a=o}}else n===`body`&&_m(e.ownerDocument.body)}n=i}while(n);Hh(t)}function wp(e,t){var n=e;e=0;do{var r=n.nextSibling;if(n.nodeType===1?t?(n._stashedDisplay=n.style.display,n.style.display=`none`):(n.style.display=n._stashedDisplay||``,n.getAttribute(`style`)===``&&n.removeAttribute(`style`)):n.nodeType===3&&(t?(n._stashedText=n.nodeValue,n.nodeValue=``):n.nodeValue=n._stashedText||``),r&&r.nodeType===8){if(n=r.data,n===`/$`){if(e===0)break;e--}else n!==`$`&&n!==`$?`&&n!==`$~`&&n!==`$!`||e++}n=r}while(n)}function Tp(e,t,n){if(t=CSS.escape(t)===t?t:`r-`+btoa(t).replace(/=/g,``),e.style.viewTransitionName=t,n!=null&&(e.style.viewTransitionClass=n),n=getComputedStyle(e),n.display===`inline`){if(t=e.getClientRects(),t.length===1)var r=1;else for(var i=r=0;i<t.length;i++){var a=t[i];0<a.width&&0<a.height&&r++}r===1&&(e=e.style,e.display=t.length===1?`inline-block`:`block`,e.marginTop=`-`+n.paddingTop,e.marginBottom=`-`+n.paddingBottom)}}function Ep(e,t){e=e.style,t=t.style;var n=t==null?null:t.hasOwnProperty(`viewTransitionName`)?t.viewTransitionName:t.hasOwnProperty(`view-transition-name`)?t[`view-transition-name`]:null;e.viewTransitionName=n==null||typeof n==`boolean`?``:(``+n).trim(),n=t==null?null:t.hasOwnProperty(`viewTransitionClass`)?t.viewTransitionClass:t.hasOwnProperty(`view-transition-class`)?t[`view-transition-class`]:null,e.viewTransitionClass=n==null||typeof n==`boolean`?``:(``+n).trim(),e.display===`inline-block`&&(t==null?e.display=e.margin=``:(n=t.display,e.display=n==null||typeof n==`boolean`?``:n,n=t.margin,n==null?(n=t.hasOwnProperty(`marginTop`)?t.marginTop:t[`margin-top`],e.marginTop=n==null||typeof n==`boolean`?``:n,t=t.hasOwnProperty(`marginBottom`)?t.marginBottom:t[`margin-bottom`],e.marginBottom=t==null||typeof t==`boolean`?``:t):e.margin=n))}function Dp(e,t,n){return n=n.ownerDocument.defaultView,{rect:e,abs:t.position===`absolute`||t.position===`fixed`,clip:t.clipPath!==`none`||t.overflow!==`visible`||t.filter!==`none`||t.mask!==`none`||t.mask!==`none`||t.borderRadius!==`0px`,view:0<=e.bottom&&0<=e.right&&e.top<=n.innerHeight&&e.left<=n.innerWidth}}function Op(e){return Dp(e.getBoundingClientRect(),getComputedStyle(e),e)}function kp(e){var t=e.getBoundingClientRect();t=new DOMRect(t.x+2e4,t.y+2e4,t.width,t.height);var n=getComputedStyle(e);return Dp(t,n,e)}function Ap(e){return e.documentElement.clientHeight}function jp(e){this.addEventListener(`load`,e),this.addEventListener(`error`,e)}function Mp(e,t,n,r,i,a,o,s,c){var l=t.nodeType===9?t:t.ownerDocument;try{var u=l.startViewTransition({update:function(){var t=l.defaultView,n=t.navigation&&t.navigation.transition,o=l.fonts.status;r();var s=[];if(o===`loaded`&&(Ap(l),l.fonts.status===`loading`&&s.push(l.fonts.ready)),o=s.length,e!==null)for(var c=e.suspenseyImages,u=0,d=0;d<c.length;d++){var f=c[d];if(!f.complete){var p=f.getBoundingClientRect();if(0<p.bottom&&0<p.right&&p.top<t.innerHeight&&p.left<t.innerWidth){if(u+=Xm(f),u>$m){s.length=o;break}f=new Promise(jp.bind(f)),s.push(f)}}}if(0<s.length)return t=Promise.race([Promise.all(s),new Promise(function(e){return setTimeout(e,500)})]).then(i,i),(n?Promise.allSettled([n.finished,t]):t).then(a,a);if(i(),n)return n.finished.then(a,a);a()},types:n});l.__reactViewTransition=u;var d=[];return u.ready.then(function(){for(var e=l.documentElement.getAnimations({subtree:!0}),t=0;t<e.length;t++){var n=e[t],r=n.effect,i=r.pseudoElement;if(i!=null&&i.startsWith(`::view-transition`)){d.push(n),n=r.getKeyframes();for(var a=i=void 0,s=!0,c=0;c<n.length;c++){var u=n[c],f=u.width;if(i===void 0)i=f;else if(i!==f){s=!1;break}if(f=u.height,a===void 0)a=f;else if(a!==f){s=!1;break}delete u.width,delete u.height,u.transform===`none`&&delete u.transform}s&&i!==void 0&&a!==void 0&&(r.setKeyframes(n),s=getComputedStyle(r.target,r.pseudoElement),s.width!==i||s.height!==a)&&(s=n[0],s.width=i,s.height=a,s=n[n.length-1],s.width=i,s.height=a,r.setKeyframes(n))}}o()},function(e){l.__reactViewTransition===u&&(l.__reactViewTransition=null);try{if(typeof e==`object`&&e)switch(e.name){case`InvalidStateError`:(e.message===`View transition was skipped because document visibility state is hidden.`||e.message===`Skipping view transition because document visibility state has become hidden.`||e.message===`Skipping view transition because viewport size changed.`||e.message===`Transition was aborted because of invalid state`)&&(e=null)}e!==null&&c(e)}finally{r(),i(),o()}}),u.finished.finally(function(){for(var e=0;e<d.length;e++)d[e].cancel();l.__reactViewTransition===u&&(l.__reactViewTransition=null),s()}),u}catch{return r(),i(),o(),null}}function Np(e,t){this._scope=document.documentElement,this._selector=`::view-transition-`+e+`(`+t+`)`}Np.prototype.animate=function(e,t){return t=typeof t==`number`?{duration:t}:C({},t),t.pseudoElement=this._selector,this._scope.animate(e,t)},Np.prototype.getAnimations=function(){for(var e=this._scope,t=this._selector,n=e.getAnimations({subtree:!0}),r=[],i=0;i<n.length;i++){var a=n[i].effect;a!==null&&a.target===e&&a.pseudoElement===t&&r.push(n[i])}return r},Np.prototype.getComputedStyle=function(){return getComputedStyle(this._scope,this._selector)};function Pp(e){return{name:e,group:new Np(`group`,e),imagePair:new Np(`image-pair`,e),old:new Np(`old`,e),new:new Np(`new`,e)}}function Fp(e){this._fragmentFiber=e,this._observers=this._eventListeners=null}Fp.prototype.addEventListener=function(e,t,n){var r=null,i=null;if(!(n!=null&&typeof n!=`boolean`&&(r=n.signal||null,r!==null&&r.aborted))){this._eventListeners===null&&(this._eventListeners=[]);var a=this._eventListeners;if(Bp(a,e,t,n)===-1){var o=this,s=t;n!=null&&typeof n!=`boolean`&&!0===n.once&&(s=function(r){o.removeEventListener(e,t,n),typeof t==`function`?t.call(this,r):t.handleEvent(r)}),r!==null&&(i=o.removeEventListener.bind(o,e,t,n),r.addEventListener(`abort`,i,{once:!0}),i=r.removeEventListener.bind(r,`abort`,i)),r=Rp(n),a.push({type:e,listener:t,optionsOrUseCapture:n,attachedListener:s,cleanup:i}),p(this._fragmentFiber.child,!1,Ip,e,s,r)}this._eventListeners=a}};function Ip(e,t,n,r){return v(e).addEventListener(t,n,r),!1}Fp.prototype.removeEventListener=function(e,t,n){var r=this._eventListeners;if(r!==null&&(t=Bp(r,e,t,n),t!==-1)){var i=r[t];n=i.attachedListener;var a=i.cleanup;i=Rp(i.optionsOrUseCapture),p(this._fragmentFiber.child,!1,Lp,e,n,i),r.splice(t,1),a!==null&&a()}};function Lp(e,t,n,r){return v(e).removeEventListener(t,n,r),!1}function Rp(e){return e!=null&&typeof e!=`boolean`&&(!0===e.once||e.signal instanceof AbortSignal)?{capture:e.capture,passive:e.passive}:e}function zp(e){return e==null?`c=0`:typeof e==`boolean`?`c=`+(e?`1`:`0`):`c=`+(e.capture?`1`:`0`)}function Bp(e,t,n,r){if(e.length===0)return-1;r=zp(r);for(var i=0;i<e.length;i++){var a=e[i];if(a.type===t&&a.listener===n&&zp(a.optionsOrUseCapture)===r)return i}return-1}Fp.prototype.dispatchEvent=function(e){var t=m(this._fragmentFiber);if(t===null)return!0;t=v(t);var n=this._eventListeners;if(n!==null&&0<n.length||!e.bubbles){var r=t.nodeType===9?t.createComment(``):document.createTextNode(``);if(n)for(var i=0;i<n.length;i++){var a=n[i];r.addEventListener(a.type,a.attachedListener,Rp(a.optionsOrUseCapture))}if(t.appendChild(r),e=r.dispatchEvent(e),n)for(i=0;i<n.length;i++)a=n[i],r.removeEventListener(a.type,a.attachedListener,Rp(a.optionsOrUseCapture));return t.removeChild(r),e}return t.dispatchEvent(e)},Fp.prototype.focus=function(e){p(this._fragmentFiber.child,!0,Vp,e,void 0,void 0)};function Vp(e,t){return e.tag!==6&&(e=v(e),pm(e,t))}Fp.prototype.focusLast=function(e){var t=[];p(this._fragmentFiber.child,!0,Hp,t,void 0,void 0);for(var n=t.length-1;0<=n&&!Vp(t[n],e);n--);};function Hp(e,t){return t.push(e),!1}Fp.prototype.blur=function(){var e=m(this._fragmentFiber);e!==null&&(e=v(e),e=lp(e).activeElement,e!==null&&p(this._fragmentFiber.child,!1,Up,e,void 0,void 0))};function Up(e,t){return e.tag!==6&&(e=v(e),e===t||e.contains(t)?(t.blur(),!0):!1)}Fp.prototype.observeUsing=function(e){this._observers===null&&(this._observers=new Set),this._observers.add(e),p(this._fragmentFiber.child,!1,Wp,e,void 0,void 0)};function Wp(e,t){return e.tag!==6&&(e=v(e),t.observe(e),!1)}Fp.prototype.unobserveUsing=function(e){var t=this._observers;if(t!==null&&t.has(e)){t.delete(e),p(this._fragmentFiber.child,!1,Gp,e,void 0,void 0);for(var n=t=0;n<Kp.length;n++){var r=Kp[n];r.fragmentInstance===this&&r.observer===e?e.unobserve(r.instance):Kp[t++]=r}Kp.length=t}};function Gp(e,t){return e.tag!==6&&(e=v(e),t.unobserve(e),!1)}var Kp=[],qp=!1;function Jp(e,t,n){Kp.push({fragmentInstance:e,observer:t,instance:n}),qp||(qp=!0,mm(function(){qp=!1;var e=Kp;Kp=[];for(var t=0;t<e.length;t++){var n=e[t];n.observer.unobserve(n.instance)}}))}Fp.prototype.getClientRects=function(){var e=[];return p(this._fragmentFiber.child,!1,Yp,e,void 0,void 0),e};function Yp(e,t){if(e.tag===6){e=e.stateNode;var n=e.ownerDocument.createRange();n.selectNodeContents(e),t.push.apply(t,n.getClientRects())}else e=v(e),t.push.apply(t,e.getClientRects());return!1}Fp.prototype.getRootNode=function(e){var t=m(this._fragmentFiber);return t===null?this:v(t).getRootNode(e)},Fp.prototype.compareDocumentPosition=function(e){var t=m(this._fragmentFiber);if(t===null)return Node.DOCUMENT_POSITION_DISCONNECTED;var n=[];p(this._fragmentFiber.child,!1,Hp,n,void 0,void 0);var r=v(t);if(n.length===0){if(n=r,h(this._fragmentFiber)){a:{for(t=this._fragmentFiber.return;t!==null;){if(t.tag===4){t=t.stateNode.containerInfo;break a}if(t.tag===3||t.tag===5||t.tag===27)break;t=t.return}t=null}t!=null&&(n=t)}t=this._fragmentFiber;var i=r=n.compareDocumentPosition(e);return n===e?i=Node.DOCUMENT_POSITION_CONTAINS:r&Node.DOCUMENT_POSITION_CONTAINED_BY&&(n=g(t)[1],n===null?i=Node.DOCUMENT_POSITION_PRECEDING:(e=v(n).compareDocumentPosition(e),i=e===0||e&Node.DOCUMENT_POSITION_FOLLOWING?Node.DOCUMENT_POSITION_FOLLOWING:Node.DOCUMENT_POSITION_PRECEDING)),i|=Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC}t=v(n[0]),i=v(n[n.length-1]);var a=h(this._fragmentFiber)?t.parentElement:r;if(a==null)return Node.DOCUMENT_POSITION_DISCONNECTED;r=a.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_CONTAINED_BY,a=a.compareDocumentPosition(i)&Node.DOCUMENT_POSITION_CONTAINED_BY;var o=t.compareDocumentPosition(e),s=i.compareDocumentPosition(e),c=o&Node.DOCUMENT_POSITION_CONTAINED_BY||s&Node.DOCUMENT_POSITION_CONTAINED_BY;return s=r&&a&&o&Node.DOCUMENT_POSITION_FOLLOWING&&s&Node.DOCUMENT_POSITION_PRECEDING,t=r&&t===e||a&&i===e||c||s?Node.DOCUMENT_POSITION_CONTAINED_BY:!r&&t===e||!a&&i===e?Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:o,t&Node.DOCUMENT_POSITION_DISCONNECTED||t&Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC||Xp(t,this._fragmentFiber,n[0],n[n.length-1],e)?t:Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC};function Xp(e,t,n,r,i){var a=Lt(i);if(e&Node.DOCUMENT_POSITION_CONTAINED_BY){if(n=!!a)a:{for(;a!==null;){if(a.tag===7&&(a===t||a.alternate===t)){n=!0;break a}a=a.return}n=!1}return n}if(e&Node.DOCUMENT_POSITION_CONTAINS){if(a===null)return a=i.ownerDocument,i===a||i===a.documentElement||i===a.body;a:{for(a=t,t=m(t);a!==null;){if(!(a.tag!==5&&a.tag!==3&&a.tag!==27||a!==t&&a.alternate!==t)){a=!0;break a}a=a.return}a=!1}return a}return e&Node.DOCUMENT_POSITION_PRECEDING?((t=!!a)&&!(t=a===n)&&(t=te(n,a,ee),t===null?t=!1:(p(t,!0,x,a,n),a=y,y=null,t=a!==null)),t):e&Node.DOCUMENT_POSITION_FOLLOWING?((t=!!a)&&!(t=a===r)&&(t=te(r,a,ee),t===null?t=!1:(p(t,!0,S,a,r),a=y,b=y=null,t=a!==null)),t):!1}function Zp(e,t){var n=e.ownerDocument.createRange();n.selectNodeContents(e),e=n.getBoundingClientRect(),window.scrollTo(window.scrollX+e.left,t?window.scrollY+e.top:window.scrollY+e.bottom-window.innerHeight)}Fp.prototype.scrollIntoView=function(e){if(typeof e==`object`)throw Error(i(566));var t=[];p(this._fragmentFiber.child,!1,Hp,t,void 0,void 0);var n=!1!==e;if(t.length===0){var r=g(this._fragmentFiber);if(r=n?r[1]||r[0]||m(this._fragmentFiber):r[0]||r[1],r===null)return;if(r.tag===6){e=v(r),Zp(e,n);return}if(r=v(r),r.nodeType!==9){if(r.nodeType===11){n=`host`in r?r.host:null,n!==null&&n.scrollIntoView(e);return}r.scrollIntoView(e)}}for(r=n?t.length-1:0;r!==(n?-1:t.length);){var a=t[r];a.tag===6?(a=v(a),Zp(a,n)):v(a).scrollIntoView(e),r+=n?-1:1}};function Qp(e,t){return e=v(e),$p(e,t),!1}function $p(e,t){e.reactFragments??=new Set,e.reactFragments.add(t)}function em(e,t){var n=t._eventListeners;if(n!==null)for(var r=0;r<n.length;r++){var i=n[r];e.addEventListener(i.type,i.attachedListener,Rp(i.optionsOrUseCapture))}e.nodeType!==3&&(n=t._observers,n!==null&&n.forEach(function(n){for(var r=0,i=0;i<Kp.length;i++){var a=Kp[i];(a.fragmentInstance!==t||a.observer!==n||a.instance!==e)&&(Kp[r++]=a)}Kp.length=r,n.observe(e)}),$p(e,t))}function tm(e,t){var n=t._eventListeners;if(n!==null)for(var r=0;r<n.length;r++){var i=n[r];e.removeEventListener(i.type,i.attachedListener,Rp(i.optionsOrUseCapture))}e.nodeType!==3&&(n=t._observers,n!==null&&n.forEach(function(n){typeof n.rootMargin==`string`?Jp(t,n,e):n.unobserve(e)}),e.reactFragments!=null&&e.reactFragments.delete(t))}function nm(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var n=t;switch(t=t.nextSibling,n.nodeName){case`HTML`:case`HEAD`:case`BODY`:nm(n),It(n);continue;case`SCRIPT`:case`STYLE`:continue;case`LINK`:if(n.rel.toLowerCase()===`stylesheet`)continue}e.removeChild(n)}}function rm(e,t,n,r){for(;e.nodeType===1;){var i=n;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!r&&(e.nodeName!==`INPUT`||e.type!==`hidden`))break}else if(!r){if(t===`input`&&e.type===`hidden`){var a=i.name==null?null:``+i.name;if(i.type===`hidden`&&e.getAttribute(`name`)===a)return e}else return e}else if(!e[Pt])switch(t){case`meta`:if(!e.hasAttribute(`itemprop`))break;return e;case`link`:if(a=e.getAttribute(`rel`),a===`stylesheet`&&e.hasAttribute(`data-precedence`)||a!==i.rel||e.getAttribute(`href`)!==(i.href==null||i.href===``?null:i.href)||e.getAttribute(`crossorigin`)!==(i.crossOrigin==null?null:i.crossOrigin)||e.getAttribute(`title`)!==(i.title==null?null:i.title))break;return e;case`style`:if(e.hasAttribute(`data-precedence`))break;return e;case`script`:if(a=e.getAttribute(`src`),(a!==(i.src==null?null:i.src)||e.getAttribute(`type`)!==(i.type==null?null:i.type)||e.getAttribute(`crossorigin`)!==(i.crossOrigin==null?null:i.crossOrigin))&&a&&e.hasAttribute(`async`)&&!e.hasAttribute(`itemprop`))break;return e;default:return e}if(e=lm(e.nextSibling),e===null)break}return null}function im(e,t,n){if(t===``)return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!==`INPUT`||e.type!==`hidden`)&&!n||(e=lm(e.nextSibling),e===null))return null;return e}function am(e,t){for(;e.nodeType!==8;)if((e.nodeType!==1||e.nodeName!==`INPUT`||e.type!==`hidden`)&&!t||(e=lm(e.nextSibling),e===null))return null;return e}function om(e){return e.data===`$?`||e.data===`$~`}function sm(e){return e.data===`$!`||e.data===`$?`&&e.ownerDocument.readyState!==`loading`}function cm(e,t){var n=e.ownerDocument;if(e.data===`$~`)e._reactRetry=t;else if(e.data!==`$?`||n.readyState!==`loading`)t();else{var r=function(){t(),n.removeEventListener(`DOMContentLoaded`,r)};n.addEventListener(`DOMContentLoaded`,r),e._reactRetry=r}}function lm(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t===`$`||t===`$!`||t===`$?`||t===`$~`||t===`&`||t===`F!`||t===`F`)break;if(t===`/$`||t===`/&`)return null}}return e}var um=null;function dm(e){e=e.nextSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n===`/$`||n===`/&`){if(t===0)return lm(e.nextSibling);t--}else n!==`$`&&n!==`$!`&&n!==`$?`&&n!==`$~`&&n!==`&`||t++}e=e.nextSibling}return null}function fm(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n===`$`||n===`$!`||n===`$?`||n===`$~`||n===`&`){if(t===0)return e;t--}else n!==`/$`&&n!==`/&`||t++}e=e.previousSibling}return null}function pm(e,t){function n(){r=!0}if(e.ownerDocument.activeElement===e)return!0;var r=!1;try{e.ownerDocument.addEventListener(`focus`,n,!0),(e.focus||HTMLElement.prototype.focus).call(e,t)}finally{e.ownerDocument.removeEventListener(`focus`,n,!0)}return r}function mm(e){yp(function(){yp(function(t){return e(t)})})}function hm(e,t,n){switch(t=lp(n),e){case`html`:if(e=t.documentElement,!e)throw Error(i(452));return e;case`head`:if(e=t.head,!e)throw Error(i(453));return e;case`body`:if(e=t.body,!e)throw Error(i(454));return e;default:throw Error(i(451))}}function gm(e,t,n){for(var r in n){var i=n[r];n.hasOwnProperty(r)&&i!=null&&$(e,t,r,null,rp,i)}n.dangerouslySetInnerHTML!=null&&(e.textContent=``),e.onclick===Cn&&(e.onclick=null),It(e)}function _m(e){for(var t=e.attributes;t.length;)e.removeAttributeNode(t[0]);It(e)}var vm=new Map,ym=new Set;function bm(e){if(typeof e.getRootNode==`function`){var t=e.getRootNode();if(t.nodeType===9||t.nodeType===11)return t}return e.nodeType===9?e:e.ownerDocument}var xm=k.d;k.d={f:Sm,r:Cm,D:Em,C:Dm,L:Om,m:km,X:jm,S:Am,M:Mm};function Sm(){var e=xm.f(),t=zd();return e||t}function Cm(e){var t=Rt(e);t!==null&&t.tag===5&&t.type===`form`?ic(t):xm.r(e)}var wm=typeof document>`u`?null:document;function Tm(e,t,n){var r=wm;if(r&&typeof t==`string`&&t){var i=cn(t);i=`link[rel="`+e+`"][href="`+i+`"]`,typeof n==`string`&&(i+=`[crossorigin="`+n+`"]`),ym.has(i)||(ym.add(i),e={rel:e,crossOrigin:n,href:t},r.querySelector(i)===null&&(t=r.createElement(`link`),np(t,`link`,e),Vt(t),r.head.appendChild(t)))}}function Em(e){xm.D(e),Tm(`dns-prefetch`,e,null)}function Dm(e,t){xm.C(e,t),Tm(`preconnect`,e,t)}function Om(e,t,n){xm.L(e,t,n);var r=wm;if(r&&e&&t){var i=`link[rel="preload"][as="`+cn(t)+`"]`;t===`image`&&n&&n.imageSrcSet?(i+=`[imagesrcset="`+cn(n.imageSrcSet)+`"]`,typeof n.imageSizes==`string`&&(i+=`[imagesizes="`+cn(n.imageSizes)+`"]`)):i+=`[href="`+cn(e)+`"]`;var a=i;switch(t){case`style`:a=Pm(e);break;case`script`:a=Rm(e)}if(!(vm.has(a)||(e=C({rel:`preload`,href:t===`image`&&n&&n.imageSrcSet?void 0:e,as:t},n),vm.set(a,e),r.querySelector(i)!==null||t===`style`&&r.querySelector(Fm(a))||t===`script`&&r.querySelector(zm(a))))){var o=r.createElement(`link`);np(o,`link`,e),t===`style`&&(o[Ft]=!0,o.onload=o.onerror=function(){Ht(o)}),Vt(o),r.head.appendChild(o)}}}function km(e,t){xm.m(e,t);var n=wm;if(n&&e){var r=t&&typeof t.as==`string`?t.as:`script`,i=`link[rel="modulepreload"][as="`+cn(r)+`"][href="`+cn(e)+`"]`,a=i;switch(r){case`audioworklet`:case`paintworklet`:case`serviceworker`:case`sharedworker`:case`worker`:case`script`:a=Rm(e)}if(!vm.has(a)&&(e=C({rel:`modulepreload`,href:e},t),vm.set(a,e),n.querySelector(i)===null)){switch(r){case`audioworklet`:case`paintworklet`:case`serviceworker`:case`sharedworker`:case`worker`:case`script`:if(n.querySelector(zm(a)))return}r=n.createElement(`link`),np(r,`link`,e),Vt(r),n.head.appendChild(r)}}}function Am(e,t,n){xm.S(e,t,n);var r=wm;if(r&&e){var i=Bt(r).hoistableStyles,a=Pm(e);t||=`default`;var o=i.get(a);if(!o){var s={loading:0,preload:null};if(o=r.querySelector(Fm(a)))s.loading=5;else{e=C({rel:`stylesheet`,href:e,"data-precedence":t},n),(n=vm.get(a))&&Hm(e,n);var c=o=r.createElement(`link`);Vt(c),np(c,`link`,e),c._p=new Promise(function(e,t){c.onload=e,c.onerror=t}),c.addEventListener(`load`,function(){s.loading|=1}),c.addEventListener(`error`,function(){s.loading|=2}),s.loading|=4,Vm(o,t,r)}o={type:`stylesheet`,instance:o,count:1,state:s},i.set(a,o)}}}function jm(e,t){xm.X(e,t);var n=wm;if(n&&e){var r=Bt(n).hoistableScripts,i=Rm(e),a=r.get(i);a||(a=n.querySelector(zm(i)),a||(e=C({src:e,async:!0},t),(t=vm.get(i))&&Um(e,t),a=n.createElement(`script`),Vt(a),np(a,`link`,e),n.head.appendChild(a)),a={type:`script`,instance:a,count:1,state:null},r.set(i,a))}}function Mm(e,t){xm.M(e,t);var n=wm;if(n&&e){var r=Bt(n).hoistableScripts,i=Rm(e),a=r.get(i);a||(a=n.querySelector(zm(i)),a||(e=C({src:e,async:!0,type:`module`},t),(t=vm.get(i))&&Um(e,t),a=n.createElement(`script`),Vt(a),np(a,`link`,e),n.head.appendChild(a)),a={type:`script`,instance:a,count:1,state:null},r.set(i,a))}}function Nm(e,t,n,r){var a=(a=Oe.current)?bm(a):null;if(!a)throw Error(i(446));switch(e){case`meta`:case`title`:return null;case`style`:return typeof n.precedence==`string`&&typeof n.href==`string`?(n=Pm(n.href),t=Bt(a).hoistableStyles,r=t.get(n),r||(r={type:`style`,instance:null,count:0,state:null},t.set(n,r)),r):{type:`void`,instance:null,count:0,state:null};case`link`:if(n.rel===`stylesheet`&&typeof n.href==`string`&&typeof n.precedence==`string`){e=Pm(n.href);var o=Bt(a).hoistableStyles,s=o.get(e);if(s||(a=a.ownerDocument||a,s={type:`stylesheet`,instance:null,count:0,state:{loading:0,preload:null}},o.set(e,s),(o=a.querySelector(Fm(e)))?o._p||(s.instance=o,s.state.loading=5):(o=vm.get(e),o||(o={rel:`preload`,as:`style`,href:n.href,crossOrigin:n.crossOrigin,integrity:n.integrity,media:n.media,hrefLang:n.hrefLang,referrerPolicy:n.referrerPolicy},vm.set(e,o)),Lm(a,e,o,s.state))),t&&r===null)throw Error(i(528,``));return s}if(t&&r!==null)throw Error(i(529,``));return null;case`script`:return t=n.async,n=n.src,typeof n==`string`&&t&&typeof t!=`function`&&typeof t!=`symbol`?(n=Rm(n),t=Bt(a).hoistableScripts,r=t.get(n),r||(r={type:`script`,instance:null,count:0,state:null},t.set(n,r)),r):{type:`void`,instance:null,count:0,state:null};default:throw Error(i(444,e))}}function Pm(e){return`href="`+cn(e)+`"`}function Fm(e){return`link[rel="stylesheet"][`+e+`]`}function Im(e){return C({},e,{"data-precedence":e.precedence,precedence:null})}function Lm(e,t,n,r){if(t=e.querySelector(`link[rel="preload"][as="style"][`+t+`]`)){if(!0!==t[Ft]){r.loading=1;return}}else t=e.createElement(`link`),t[Ft]=!0,t.onload=t.onerror=Ht.bind(null,t),np(t,`link`,n),Vt(t),e.head.appendChild(t);r.preload=t,t.addEventListener(`load`,function(){return r.loading|=1}),t.addEventListener(`error`,function(){return r.loading|=2})}function Rm(e){return`[src="`+cn(e)+`"]`}function zm(e){return`script[async]`+e}function Bm(e,t,n){if(t.count++,t.instance===null)switch(t.type){case`style`:var r=e.querySelector(`style[data-href~="`+cn(n.href)+`"]`);if(r)return t.instance=r,Vt(r),r;var a=C({},n,{"data-href":n.href,"data-precedence":n.precedence,href:null,precedence:null});return r=(e.ownerDocument||e).createElement(`style`),Vt(r),np(r,`style`,a),Vm(r,n.precedence,e),t.instance=r;case`stylesheet`:a=Pm(n.href);var o=e.querySelector(Fm(a));if(o)return t.state.loading|=4,t.instance=o,Vt(o),o;r=Im(n),(a=vm.get(a))&&Hm(r,a),o=(e.ownerDocument||e).createElement(`link`),Vt(o);var s=o;return s._p=new Promise(function(e,t){s.onload=e,s.onerror=t}),np(o,`link`,r),t.state.loading|=4,Vm(o,n.precedence,e),t.instance=o;case`script`:return o=Rm(n.src),(a=e.querySelector(zm(o)))?(t.instance=a,Vt(a),a):(r=n,(a=vm.get(o))&&(r=C({},n),Um(r,a)),e=e.ownerDocument||e,a=e.createElement(`script`),Vt(a),np(a,`link`,r),e.head.appendChild(a),t.instance=a);case`void`:return null;default:throw Error(i(443,t.type))}else t.type===`stylesheet`&&!(t.state.loading&4)&&(r=t.instance,t.state.loading|=4,Vm(r,n.precedence,e));return t.instance}function Vm(e,t,n){for(var r=n.querySelectorAll(`link[rel="stylesheet"][data-precedence],style[data-precedence]`),i=r.length?r[r.length-1]:null,a=i,o=0;o<r.length;o++){var s=r[o];if(s.dataset.precedence===t)a=s;else if(a!==i)break}a?a.parentNode.insertBefore(e,a.nextSibling):(t=n.nodeType===9?n.head:n,t.insertBefore(e,t.firstChild))}function Hm(e,t){e.crossOrigin??=t.crossOrigin,e.referrerPolicy??=t.referrerPolicy,e.title??=t.title}function Um(e,t){e.crossOrigin??=t.crossOrigin,e.referrerPolicy??=t.referrerPolicy,e.integrity??=t.integrity}var Wm=null;function Gm(e,t,n){if(Wm===null){var r=new Map,i=Wm=new Map;i.set(n,r)}else i=Wm,r=i.get(n),r||(r=new Map,i.set(n,r));if(r.has(e))return r;for(r.set(e,null),n=n.getElementsByTagName(e),i=0;i<n.length;i++){var a=n[i];if(!(a[Pt]||a[Dt]||e===`link`&&a.getAttribute(`rel`)===`stylesheet`)&&a.namespaceURI!==`http://www.w3.org/2000/svg`){var o=a.getAttribute(t)||``;o=e+o;var s=r.get(o);s?s.push(a):r.set(o,[a])}}return r}function Km(e,t,n){e=e.ownerDocument||e,e.head.insertBefore(n,t===`title`?e.querySelector(`head > title`):null)}function qm(e,t,n){if(n===1||t.itemProp!=null)return!1;switch(e){case`meta`:case`title`:return!0;case`style`:if(typeof t.precedence!=`string`||typeof t.href!=`string`||t.href===``)break;return!0;case`link`:if(typeof t.rel!=`string`||typeof t.href!=`string`||t.href===``||t.onLoad||t.onError)break;switch(t.rel){case`stylesheet`:return e=t.disabled,typeof t.precedence==`string`&&e==null;default:return!0}case`script`:if(t.async&&typeof t.async!=`function`&&typeof t.async!=`symbol`&&!t.onLoad&&!t.onError&&t.src&&typeof t.src==`string`)return!0}return!1}function Jm(e,t){return e===`img`&&t.src!=null&&t.src!==``&&t.onLoad==null&&t.loading!==`lazy`}function Ym(e){return!(e.type===`stylesheet`&&!(e.state.loading&3))}function Xm(e){return(e.width||100)*(e.height||100)*(typeof devicePixelRatio==`number`?devicePixelRatio:1)*.25}function Zm(e,t){typeof t.decode==`function`&&(e.imgCount++,t.complete||(e.imgBytes+=Xm(t),e.suspenseyImages.push(t)),e=rh.bind(e),t.decode().then(e,e))}function Qm(e,t,n,r){if(n.type===`stylesheet`&&(typeof r.media!=`string`||!1!==matchMedia(r.media).matches)&&!(n.state.loading&4)){if(n.instance===null){var i=Pm(r.href),a=t.querySelector(Fm(i));if(a){t=a._p,typeof t==`object`&&t&&typeof t.then==`function`&&(e.count++,e=nh.bind(e),t.then(e,e)),n.state.loading|=4,n.instance=a,Vt(a);return}a=t.ownerDocument||t,r=Im(r),(i=vm.get(i))&&Hm(r,i),a=a.createElement(`link`),Vt(a);var o=a;o._p=new Promise(function(e,t){o.onload=e,o.onerror=t}),np(a,`link`,r),n.instance=a}e.stylesheets===null&&(e.stylesheets=new Map),e.stylesheets.set(n,t),(t=n.state.preload)&&!(n.state.loading&3)&&(e.count++,n=nh.bind(e),t.addEventListener(`load`,n),t.addEventListener(`error`,n))}}var $m=0;function eh(e,t){return e.stylesheets&&e.count===0&&ah(e,e.stylesheets),0<e.count||0<e.imgCount?function(n){var r=setTimeout(function(){if(e.stylesheets&&ah(e,e.stylesheets),e.unsuspend){var t=e.unsuspend;e.unsuspend=null,t()}},6e4+t);0<e.imgBytes&&$m===0&&($m=62500*op());var i=setTimeout(function(){if(e.waitingForImages=!1,e.count===0&&(e.stylesheets&&ah(e,e.stylesheets),e.unsuspend)){var t=e.unsuspend;e.unsuspend=null,t()}},(e.imgBytes>$m?50:800)+t);return e.unsuspend=n,function(){e.unsuspend=null,clearTimeout(r),clearTimeout(i)}}:null}function th(e){if(e.count===0&&(e.imgCount===0||!e.waitingForImages)){if(e.stylesheets)ah(e,e.stylesheets);else if(e.unsuspend){var t=e.unsuspend;e.unsuspend=null,t()}}}function nh(){this.count--,th(this)}function rh(){this.imgCount--,th(this)}var ih=null;function ah(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,ih=new Map,t.forEach(oh,e),ih=null,nh.call(e))}function oh(e,t){if(!(t.state.loading&4)){var n=ih.get(e);if(n)var r=n.get(null);else{n=new Map,ih.set(e,n);for(var i=e.querySelectorAll(`link[data-precedence],style[data-precedence]`),a=0;a<i.length;a++){var o=i[a];(o.nodeName===`LINK`||o.getAttribute(`media`)!==`not all`)&&(n.set(o.dataset.precedence,o),r=o)}r&&n.set(null,r)}i=t.instance,o=i.getAttribute(`data-precedence`),a=n.get(o)||r,a===r&&n.set(null,i),n.set(o,i),this.count++,r=nh.bind(this),i.addEventListener(`load`,r),i.addEventListener(`error`,r),a?a.parentNode.insertBefore(i,a.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(i,e.firstChild)),t.state.loading|=4}}var sh={$$typeof:ce,Provider:null,Consumer:null,_currentValue:xe,_currentValue2:xe,_threadCount:0};function ch(e,t,n,r,i,a,o,s,c){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=gt(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=gt(0),this.hiddenUpdates=gt(null),this.identifierPrefix=r,this.onUncaughtError=i,this.onCaughtError=a,this.onRecoverableError=o,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=c,this.transitionTypes=null,this.incompleteTransitions=new Map}function lh(e,t,n,r,i,a,o,s,c,l,u,d){return e=new ch(e,t,n,o,c,l,u,d,s),t=1,!0===a&&(t|=24),a=Fi(3,null,null,t),e.current=a,a.stateNode=e,t=Pa(),t.refCount++,e.pooledCache=t,t.refCount++,a.memoizedState={element:r,isDehydrated:n,cache:t},_o(a),e}function uh(e){return e?(e=Ni,e):Ni}function dh(e,t,n,r,i,a){i=uh(i),r.context===null?r.context=i:r.pendingContext=i,r=yo(t),r.payload={element:n},a=a===void 0?null:a,a!==null&&(r.callback=a),n=bo(e,r,t),n!==null&&(Pd(n,e,t),xo(n,e,t))}function fh(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function ph(e,t){fh(e,t),(e=e.alternate)&&fh(e,t)}function mh(e){if(e.tag===13||e.tag===31){var t=I(e,67108864);t!==null&&Pd(t,e,67108864),ph(e,67108864)}}function hh(e){if(e.tag===13||e.tag===31){var t=jd();t=St(t);var n=I(e,t);n!==null&&Pd(n,e,t),ph(e,t)}}var gh=!0;function _h(e,t,n,r){var i=O.T;O.T=null;var a=k.p;try{k.p=2,yh(e,t,n,r)}finally{k.p=a,O.T=i}}function vh(e,t,n,r){var i=O.T;O.T=null;var a=k.p;try{k.p=8,yh(e,t,n,r)}finally{k.p=a,O.T=i}}function yh(e,t,n,r){if(gh){var i=bh(r);if(i===null)Kf(e,t,r,xh,n),Mh(e,r);else if(Ph(i,e,t,n,r))r.stopPropagation();else if(Mh(e,r),t&4&&-1<jh.indexOf(e)){for(;i!==null;){var a=Rt(i);if(a!==null)switch(a.tag){case 3:if(a=a.stateNode,a.current.memoizedState.isDehydrated){var o=ut(a.pendingLanes);if(o!==0){var s=a;for(s.pendingLanes|=2,s.entangledLanes|=2;o;){var c=1<<31-rt(o);s.entanglements[1]|=c,o&=~c}Ef(a),!(G&6)&&(_d=Ge()+500,Df(0,!1))}}break;case 31:case 13:s=I(a,2),s!==null&&Pd(s,a,2),zd(),ph(a,2)}if(a=bh(r),a===null&&Kf(e,t,r,xh,n),a===i)break;i=a}i!==null&&r.stopPropagation()}else Kf(e,t,r,null,n)}}function bh(e){return e=Tn(e),Sh(e)}var xh=null;function Sh(e){if(xh=null,e=Lt(e),e!==null){var t=s(e);if(t===null)e=null;else{var n=t.tag;if(n===13){if(e=c(t),e!==null)return e;e=null}else if(n===31){if(e=l(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return xh=e,null}function Ch(e){switch(e){case`beforetoggle`:case`cancel`:case`click`:case`close`:case`contextmenu`:case`copy`:case`cut`:case`auxclick`:case`dblclick`:case`dragend`:case`dragstart`:case`drop`:case`focusin`:case`focusout`:case`input`:case`invalid`:case`keydown`:case`keypress`:case`keyup`:case`mousedown`:case`mouseup`:case`paste`:case`pause`:case`play`:case`pointercancel`:case`pointerdown`:case`pointerup`:case`ratechange`:case`reset`:case`seeked`:case`submit`:case`toggle`:case`touchcancel`:case`touchend`:case`touchstart`:case`volumechange`:case`change`:case`selectionchange`:case`textInput`:case`compositionstart`:case`compositionend`:case`compositionupdate`:case`beforeblur`:case`afterblur`:case`beforeinput`:case`blur`:case`fullscreenchange`:case`fullscreenerror`:case`focus`:case`hashchange`:case`popstate`:case`select`:case`selectstart`:return 2;case`drag`:case`dragenter`:case`dragexit`:case`dragleave`:case`dragover`:case`mousemove`:case`mouseout`:case`mouseover`:case`pointermove`:case`pointerout`:case`pointerover`:case`resize`:case`scroll`:case`touchmove`:case`wheel`:case`mouseenter`:case`mouseleave`:case`pointerenter`:case`pointerleave`:return 8;case`message`:switch(Ke()){case qe:return 2;case Je:return 8;case Xe:case Qe:return 32;case $e:return 268435456;default:return 32}default:return 32}}var wh=!1,Th=null,Eh=null,Dh=null,Oh=new Map,kh=new Map,Ah=[],jh=`mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset`.split(` `);function Mh(e,t){switch(e){case`focusin`:case`focusout`:Th=null;break;case`dragenter`:case`dragleave`:Eh=null;break;case`mouseover`:case`mouseout`:Dh=null;break;case`pointerover`:case`pointerout`:Oh.delete(t.pointerId);break;case`gotpointercapture`:case`lostpointercapture`:kh.delete(t.pointerId)}}function Nh(e,t,n,r,i,a){return e===null||e.nativeEvent!==a?(e={blockedOn:t,domEventName:n,eventSystemFlags:r,nativeEvent:a,targetContainers:[i]},t!==null&&(t=Rt(t),t!==null&&mh(t)),e):(e.eventSystemFlags|=r,t=e.targetContainers,i!==null&&t.indexOf(i)===-1&&t.push(i),e)}function Ph(e,t,n,r,i){switch(t){case`focusin`:return Th=Nh(Th,e,t,n,r,i),!0;case`dragenter`:return Eh=Nh(Eh,e,t,n,r,i),!0;case`mouseover`:return Dh=Nh(Dh,e,t,n,r,i),!0;case`pointerover`:var a=i.pointerId;return Oh.set(a,Nh(Oh.get(a)||null,e,t,n,r,i)),!0;case`gotpointercapture`:return a=i.pointerId,kh.set(a,Nh(kh.get(a)||null,e,t,n,r,i)),!0}return!1}function Fh(e){var t=Lt(e.target);if(t!==null){var n=s(t);if(n!==null){if(t=n.tag,t===13){if(t=c(n),t!==null){e.blockedOn=t,Tt(e.priority,function(){hh(n)});return}}else if(t===31){if(t=l(n),t!==null){e.blockedOn=t,Tt(e.priority,function(){hh(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Ih(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=bh(e.nativeEvent);if(n===null){n=e.nativeEvent;var r=new n.constructor(n.type,n);wn=r,n.target.dispatchEvent(r),wn=null}else return t=Rt(n),t!==null&&mh(t),e.blockedOn=n,!1;t.shift()}return!0}function Lh(e,t,n){Ih(e)&&n.delete(t)}function Rh(){wh=!1,Th!==null&&Ih(Th)&&(Th=null),Eh!==null&&Ih(Eh)&&(Eh=null),Dh!==null&&Ih(Dh)&&(Dh=null),Oh.forEach(Lh),kh.forEach(Lh)}function zh(e,n){e.blockedOn===n&&(e.blockedOn=null,wh||(wh=!0,t.unstable_scheduleCallback(t.unstable_NormalPriority,Rh)))}var Bh=null;function Vh(e){Bh!==e&&(Bh=e,t.unstable_scheduleCallback(t.unstable_NormalPriority,function(){Bh===e&&(Bh=null);for(var t=0;t<e.length;t+=3){var n=e[t],r=e[t+1],i=e[t+2];if(typeof r!=`function`){if(Sh(r||n)===null)continue;break}var a=Rt(n);a!==null&&(e.splice(t,3),t-=3,nc(a,{pending:!0,data:i,method:n.method,action:r},r,i))}}))}function Hh(e){function t(t){return zh(t,e)}Th!==null&&zh(Th,e),Eh!==null&&zh(Eh,e),Dh!==null&&zh(Dh,e),Oh.forEach(t),kh.forEach(t);for(var n=0;n<Ah.length;n++){var r=Ah[n];r.blockedOn===e&&(r.blockedOn=null)}for(;0<Ah.length&&(n=Ah[0],n.blockedOn===null);)Fh(n),n.blockedOn===null&&Ah.shift();if(n=(e.ownerDocument||e).$$reactFormReplay,n!=null)for(r=0;r<n.length;r+=3){var i=n[r],a=n[r+1],o=i[Ot]||null;if(typeof a==`function`)o||Vh(n);else if(o){var s=null;if(a&&a.hasAttribute(`formAction`)){if(i=a,o=a[Ot]||null)s=o.formAction;else if(Sh(i)!==null)continue}else s=o.action;typeof s==`function`?n[r+1]=s:(n.splice(r,3),r-=3),Vh(n)}}}function Uh(){function e(e){e.canIntercept&&e.info===`react-transition`&&e.intercept({handler:function(){return new Promise(function(e){return i=e})},focusReset:`manual`,scroll:`manual`})}function t(){i!==null&&(i(),i=null),r||setTimeout(n,20)}function n(){if(!r&&!navigation.transition){var e=navigation.currentEntry;e&&e.url!=null&&navigation.navigate(e.url,{state:e.getState(),info:`react-transition`,history:`replace`})}}if(typeof navigation==`object`){var r=!1,i=null;return navigation.addEventListener(`navigate`,e),navigation.addEventListener(`navigatesuccess`,t),navigation.addEventListener(`navigateerror`,t),setTimeout(n,100),function(){r=!0,navigation.removeEventListener(`navigate`,e),navigation.removeEventListener(`navigatesuccess`,t),navigation.removeEventListener(`navigateerror`,t),i!==null&&(i(),i=null)}}}function Wh(e){this._internalRoot=e}Gh.prototype.render=Wh.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(i(409));var n=t.current;dh(n,jd(),e,t,null,null)},Gh.prototype.unmount=Wh.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;dh(e.current,2,null,e,null,null),zd(),t[kt]=null}};function Gh(e){this._internalRoot=e}Gh.prototype.unstable_scheduleHydration=function(e){if(e){var t=wt();e={blockedOn:null,target:e,priority:t};for(var n=0;n<Ah.length&&t!==0&&t<Ah[n].priority;n++);Ah.splice(n,0,e),n===0&&Fh(e)}};var Kh=n.version;if(Kh!==`19.3.0`)throw Error(i(527,Kh,`19.3.0`));k.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render==`function`?Error(i(188)):(e=Object.keys(e).join(`,`),Error(i(268,e)));return e=d(t),e=e===null?null:f(e),e=e===null?null:e.stateNode,e};var qh={bundleType:0,version:`19.3.0`,rendererPackageName:`react-dom`,currentDispatcherRef:O,reconcilerVersion:`19.3.0`};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<`u`){var Jh=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Jh.isDisabled&&Jh.supportsFiber)try{et=Jh.inject(qh),tt=Jh}catch{}}e.createRoot=function(e,t){if(!o(e))throw Error(i(299));var n=!1,r=``,a=Tc,s=Ec,c=Dc;return t!=null&&(!0===t.unstable_strictMode&&(n=!0),t.identifierPrefix!==void 0&&(r=t.identifierPrefix),t.onUncaughtError!==void 0&&(a=t.onUncaughtError),t.onCaughtError!==void 0&&(s=t.onCaughtError),t.onRecoverableError!==void 0&&(c=t.onRecoverableError)),t=lh(e,1,!1,null,null,n,r,null,a,s,c,Uh),e[kt]=t.current,Wf(e),new Wh(t)}})),$e=t(((e,t)=>{function n(){if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<`u`&&typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE==`function`)try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(e){console.error(e)}}n(),t.exports=Qe()}))(),M=e(a(),1),N=Ve();function et(){let e=Number(getComputedStyle(document.documentElement).zoom)||1;return{width:window.innerWidth/e,height:window.innerHeight/e,zoom:e}}function tt(e,t){let n=et(),r=Math.min(n.width,Math.max(Math.min(t.width,n.width),e.width)),i=Math.min(n.height,Math.max(Math.min(t.height,n.height),e.height));return{width:r,height:i,x:Math.max(0,Math.min(e.x,n.width-r)),y:Math.max(0,Math.min(e.y,n.height-i))}}var nt=[`n`,`s`,`e`,`w`,`ne`,`nw`,`se`,`sw`];function rt({label:e,title:t,actions:n,initialRect:r,minSize:i={width:340,height:260},className:a,onClose:o,onKeyDown:s,children:c}){let l=Be(),[u,d]=(0,M.useState)(r),[f,p]=(0,M.useState)(!1),m=(0,M.useRef)(null),h=(0,M.useRef)(null);(0,M.useEffect)(()=>{let e=document.activeElement;m.current?.focus();let t=()=>d(e=>tt(e,i));window.addEventListener(`resize`,t);let n=new MutationObserver(t);return n.observe(document.documentElement,{attributes:!0,attributeFilter:[`style`]}),()=>{n.disconnect(),window.removeEventListener(`resize`,t),(m.current?.contains(document.activeElement)||document.activeElement===document.body)&&e?.focus()}},[]);function g(e,t=``){e.button!==0||f||e.target.closest(`button`)||(e.preventDefault(),e.currentTarget.setPointerCapture(e.pointerId),h.current={x:e.clientX,y:e.clientY,rect:u,edge:t})}function _(e){let t=h.current;if(!t)return;let{zoom:n}=et(),r=(e.clientX-t.x)/n,a=(e.clientY-t.y)/n,o={...t.rect};t.edge?(t.edge.includes(`e`)&&(o.width+=r),t.edge.includes(`s`)&&(o.height+=a),t.edge.includes(`w`)&&(o.x+=r,o.width-=r),t.edge.includes(`n`)&&(o.y+=a,o.height-=a)):(o.x+=r,o.y+=a),d(tt(o,i))}let v=()=>{h.current=null},y={onPointerMove:_,onPointerUp:v,onPointerCancel:v,onLostPointerCapture:v};return(0,N.jsxs)(`div`,{ref:m,role:`dialog`,"aria-modal":`false`,"aria-label":e,tabIndex:-1,className:w(`float-window`,a),style:f?{inset:0}:{left:u.x,top:u.y,width:u.width,height:u.height},onKeyDown:e=>{e.stopPropagation(),s?.(e,m.current),!e.defaultPrevented&&e.key===`Escape`&&(e.preventDefault(),o())},children:[(0,N.jsxs)(`header`,{className:`float-title`,onPointerDown:e=>g(e),...y,children:[(0,N.jsx)(`strong`,{children:t}),n,(0,N.jsx)(`button`,{className:`btn btn-small`,onClick:()=>p(!f),children:l(f?`Restore window`:`Maximize window`)}),(0,N.jsx)(`button`,{className:`btn btn-small`,onClick:o,children:l(`Close`)})]}),c,!f&&nt.map(e=>(0,N.jsx)(`div`,{className:`float-resize float-${e}`,onPointerDown:t=>g(t,e),...y},e))]})}var it={"\\dd":`\\mathrm{d}`,"\\ee":`\\mathrm{e}`,"\\tp":`^{\\mathsf{T}}`,"\\Tr":`\\operatorname{Tr}`,"\\Brho":`B\\rho`},at=null,ot=null,st=new Set,ct=new Map;function lt(){return ot??=He(()=>import(`./temml-CiP_lRsR.js`).then(e=>{at=e.default;for(let e of st)e()}),[],import.meta.url),ot}function ut(e){return st.add(e),lt().catch(()=>void 0),()=>st.delete(e)}function dt(e,t){if(!at)return null;let n=`${t?`D`:`I`}${e}`,r=ct.get(n);if(r===void 0){try{r=at.renderToString(e,{displayMode:t,throwOnError:!0,trust:!1,annotate:!0,macros:{...it}})}catch{r=null}ct.size>4e3&&ct.clear(),ct.set(n,r)}return r}function ft({tex:e,display:t}){let n=(0,M.useSyncExternalStore)(ut,()=>at!==null)?dt(e,!!t):null;return n==null?t?(0,N.jsx)(`pre`,{className:`md-code md-math-block`,children:(0,N.jsx)(`code`,{children:e})}):(0,N.jsx)(`code`,{className:`md-math`,children:e}):(0,N.jsx)(t?`div`:`span`,{className:t?`math-display`:`math-inline`,dangerouslySetInnerHTML:{__html:n}})}var pt=/^\s*(```|~~~)\s*([\w+-]*)\s*$/,mt=/^\s{0,3}(#{1,6})\s+(.*)$/,ht=/^\s{0,3}[-*+]\s+(.*)$/,gt=/^\s{0,3}\d+[.)]\s+(.*)$/,_t=/^\s{0,3}([-*_])(\s*\1){2,}\s*$/,vt=/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/,yt=/^\s*\$\$/;function bt(e){let t=e.trim();return t.startsWith(`|`)&&(t=t.slice(1)),t.endsWith(`|`)&&(t=t.slice(0,-1)),t.split(`|`).map(e=>e.trim())}function xt(e){let t=e.replace(/\r\n?/g,`
`).split(`
`),n=[],r=0;for(;r<t.length;){let e=t[r],i=e.match(pt);if(i){let e=[];for(r++;r<t.length&&!t[r].match(pt);)e.push(t[r++]);r++,n.push({t:`code`,lang:i[2]??``,text:e.join(`
`)});continue}if(!e.trim()){r++;continue}if(yt.test(e)){let i=e.trim().slice(2),a=[];if(i.endsWith(`$$`)&&i.length>=2)a.push(i.slice(0,-2)),r++;else{for(i.trim()&&a.push(i),r++;r<t.length&&!t[r].trim().endsWith(`$$`);)a.push(t[r++]);if(r<t.length){let e=t[r].trim().slice(0,-2);e.trim()&&a.push(e),r++}}n.push({t:`math`,tex:a.join(`
`).trim()});continue}let a=e.match(mt);if(a){n.push({t:`heading`,level:a[1].length,text:a[2].replace(/#+\s*$/,``)}),r++;continue}if(_t.test(e)){n.push({t:`rule`}),r++;continue}if(e.includes(`|`)&&r+1<t.length&&vt.test(t[r+1])){let i=bt(e),a=[];for(r+=2;r<t.length&&t[r].includes(`|`)&&t[r].trim();)a.push(bt(t[r++]));n.push({t:`table`,head:i,rows:a});continue}if(ht.test(e)||gt.test(e)){let i=!ht.test(e),a=[];for(;r<t.length;){let e=t[r].match(i?gt:ht);if(e)a.push(e[1]),r++;else if(t[r].trim()&&/^\s{2,}/.test(t[r])&&a.length)a[a.length-1]+=`
`+t[r].trim(),r++;else break}n.push({t:`list`,ordered:i,items:a});continue}if(/^\s{0,3}>/.test(e)){let e=[];for(;r<t.length&&/^\s{0,3}>/.test(t[r]);)e.push(t[r++].replace(/^\s{0,3}>\s?/,``));n.push({t:`quote`,text:e.join(`
`)});continue}let o=[];for(;r<t.length&&t[r].trim()&&!pt.test(t[r])&&!mt.test(t[r])&&!ht.test(t[r])&&!gt.test(t[r])&&!_t.test(t[r])&&!yt.test(t[r])&&!(t[r].includes(`|`)&&r+1<t.length&&vt.test(t[r+1]));)o.push(t[r++]);n.push({t:`para`,text:o.join(`
`)})}return n}var St=/(`+)([\s\S]*?)\1|\$\$([^$]+)\$\$|\$([^$\n]+)\$|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\n]+)\*|(?<![\w])_([^_\n]+)_(?![\w])|\[([^\]]+)\]\((https?:\/\/[^)\s]+|#[\w-]+)\)/g;function Ct(e,t=`i`){let n=[],r=0,i=0;for(let a of e.matchAll(St)){let o=a.index??0;o>r&&n.push(...wt(e.slice(r,o),`${t}t${i}`));let s=`${t}${i++}`;if(a[1])n.push((0,N.jsx)(`code`,{children:a[2]},s));else if(a[3]||a[4])n.push((0,N.jsx)(ft,{tex:a[3]??a[4]},s));else if(a[5]||a[6])n.push((0,N.jsx)(`strong`,{children:Ct(a[5]??a[6],s)},s));else if(a[7]||a[8])n.push((0,N.jsx)(`em`,{children:Ct(a[7]??a[8],s)},s));else if(a[9]){let e=a[10];n.push((0,N.jsx)(`a`,{href:e,onClick:t=>{e.startsWith(`#`)||(t.preventDefault(),Ne(e))},"data-tip":e,children:a[9]},s))}r=o+a[0].length}return r<e.length&&n.push(...wt(e.slice(r),`${t}e`)),n}function wt(e,t){return e.split(`
`).flatMap((e,n)=>n?[(0,N.jsx)(`br`,{},`${t}b${n}`),e]:[e])}function Tt({text:e,fence:t}){let n=xt(e);return(0,N.jsx)(`div`,{className:`md selectable`,children:n.map((e,n)=>{switch(e.t){case`code`:{let r=t?.(e.lang,e.text,n);return r===void 0?(0,N.jsxs)(`pre`,{className:`md-code`,children:[e.lang&&(0,N.jsx)(`span`,{className:`md-lang`,children:e.lang}),(0,N.jsx)(`code`,{children:e.text})]},n):r}case`math`:return(0,N.jsx)(ft,{tex:e.tex,display:!0},n);case`heading`:{let t=`h${Math.min(6,e.level+2)}`;return(0,N.jsx)(t,{children:Ct(e.text,`h${n}`)},n)}case`list`:return e.ordered?(0,N.jsx)(`ol`,{children:e.items.map((e,t)=>(0,N.jsx)(`li`,{children:Ct(e,`l${n}-${t}`)},t))},n):(0,N.jsx)(`ul`,{children:e.items.map((e,t)=>(0,N.jsx)(`li`,{children:Ct(e,`l${n}-${t}`)},t))},n);case`table`:return(0,N.jsx)(`div`,{className:`md-table-wrap`,children:(0,N.jsxs)(`table`,{className:`md-table`,children:[(0,N.jsx)(`thead`,{children:(0,N.jsx)(`tr`,{children:e.head.map((e,t)=>(0,N.jsx)(`th`,{children:Ct(e,`th${n}-${t}`)},t))})}),(0,N.jsx)(`tbody`,{children:e.rows.map((e,t)=>(0,N.jsx)(`tr`,{children:e.map((e,r)=>(0,N.jsx)(`td`,{children:Ct(e,`td${n}-${t}-${r}`)},r))},t))})]})},n);case`quote`:return(0,N.jsx)(`blockquote`,{children:(0,N.jsx)(Tt,{text:e.text,fence:t})},n);case`rule`:return(0,N.jsx)(`hr`,{},n);default:return(0,N.jsx)(`p`,{children:Ct(e.text,`p${n}`)},n)}})})}var Et=Re(e=>({open:!1,show:()=>e({open:!0}),close:()=>e({open:!1})})),Dt=`# AVAS 使用说明

本手册可在操作软件时保持打开。拖动标题栏移动窗口，拖动边缘调整大小；最大化后可还原，按 Esc 关闭。每次重新打开恢复默认位置和大小。使用上方搜索按正文和标题筛选章节，点击目录跳转。界面语言切换时手册同步切换。

## 快速开始

1. 在项目页打开已有项目，或从文件菜单新建项目。初次使用建议复制 examples/hwr010 示例再操作。
2. 在束流页检查粒子数、能量和分布，在结构页检查元件与场图，在模拟设置页检查模拟选项。
3. 确认结构页标记为运行使用的文件正确，保存修改，然后开始运行。
4. 在运行页查看进度、日志和实时包络；结束后到结果页查看曲线和相空间。
5. 需要保留本次结果时，在运行记录中选择保留运行，再进行下一次计算。

## 项目与输入文件

项目通过 ini.ini 组织输入和输出。InputFile 保存束流、模拟设置、结构和场图等输入；OutputFile 保存最近一次完整运行。结构文件由 ini.ini 的 lattice/source 指定，文件名不一定是 lattice_mulp.txt。

文件菜单和标题栏的项目切换入口用于打开其他项目。切换或关闭时有未保存改动会询问处理方式。文件页是 InputFile 的文件浏览器：查看原始文本、场图曲线与切片、粒子文件，并进行导入、复制、重命名或移到回收站等操作。日常修改在各自的页面完成：初始粒子分布与二次粒子在束流页，boundary.txt 与 scanData.txt 在模拟设置页。

运行期间输入只读。可以查看文件和结果，等待任务结束后再编辑。

## 束流设置

束流页用于设置入射束流。按界面分组调整能量、电流、粒子数和分布等参数，保存后写入 beam.txt；未由页面管理的关键字和注释会保留。撤销和重做可使用 Ctrl+Z、Ctrl+Y。

参数参考中的 beam 条目列出各关键字说明、单位和可选值。勾选“从 .dst 文件读取粒子”并选好文件后，页面下方显示该文件的粒子分布（x-x′、y-y′、φ-W，红线为按粒子计算的 rms 椭圆），可用“从文件读取参数”把质量、流强、能量和 Twiss 填入表单。

“二次粒子”区勾选后在 input.txt 写入 secondarybeam 1，并在表格中编辑 SeParticle.txt（每行一个粒子）；同步粒子仍由束流参数决定。“历史”按钮列出 beam.txt 的保存版本，恢复的版本作为一步可撤销的修改填入表单，保存后才写入文件。

## 结构编辑

文件下拉框用于打开结构文件；打开文件不等于将其设为运行结构。使用单独的“设为运行结构”按钮选择运行输入。

“文本 + 结构”模式将文本与结构面板并排显示。选择元件可查看参数、位置和检查提示。文本、结构及可视化编辑使用同一份内容，修改可撤销。

可视化模式默认浏览，只读查看。进入编辑状态后才能修改参数和元件；点击完成时，若有未保存修改，可保存、放弃本次编辑或继续编辑。TraceWin .dat 文件目前只读。

2D 和 3D 左上角提供放大、缩小、显示全部。2D 双击视图显示全部；3D 双击空白显示全部，双击元件聚焦。手动缩放 3D 会停止漫游和束团跟随。

## 模拟设置

模拟设置页管理 input.txt 中的模拟选项，支持撤销和重做。每个字段的含义以参数参考中的 input 条目为准。勾选“启用边界 (boundary.txt)”后在其下方编辑损失边界表；相位扫描选“从 scanData.txt”时，在下方按射频腔顺序编辑入口相位和入口时间。表格随页面一起保存，空表格不会新建文件。“历史”按钮列出 input.txt 的保存版本，恢复方式与束流页相同。

CPU 多线程开启时写 multithreading 1；关闭时删除该行。不要手工填写 multithreading 0，它会导致内核在起点丢失全部粒子。

运行前先检查结构问题和场图是否齐全。线性包络预览用于快速评估，最终结果以内核计算为准。

## 运行与保留结果

同一时间只允许一个运行任务。开始前软件检查并保存有修改的页面；上次结果完成但尚未保留时，会询问保留并运行、直接运行或取消。

暂停挂起运行进程，恢复后继续；停止结束任务。运行期间输入保持只读，包括暂停状态。完整运行使用输出目录中的 inputs 快照，不改写原始输入。

完整运行覆盖 OutputFile。保留运行会把结果和输入快照复制到 Runs 下的独立目录。运行记录中可回放完成的记录，也可将不需要的记录移到回收站。

分段运行的结果位于 Segments 下，不覆盖完整运行结果。分段设置涉及射频相位换算，请使用软件提供的分段功能。

## 实时包络与回放

运行页显示本次运行实时包络，结束后可回放；运行记录的回放按钮用于查看历史记录。新运行开始后切回本次运行。

结构页回放上次运行，曲线与正在编辑的结构对应；结构修改后应注意结果可能已过期。上次运行曲线默认隐藏，开始回放时自动打开。图例左侧的 × 可隐藏曲线。

束团和粒子云是按 rms 包络绘制的示意，不是真实粒子分布。与前一次运行对比默认关闭，可按需开启。动画受“视图 → 动效”控制。

## 参数扫描

在扫描页选择 lattice 元件参数或 beam.txt、input.txt 关键字，填写一组取值后开始。每个取值都在输入副本上运行，不覆盖项目输入和完整运行结果。

扫描期间可查看表格、曲线和运行状态。结果保存在 Scans 下，每个取值对应 run_NNN 子目录，汇总为 scan.json 和 scan.csv。扫描进行时不能同时开始普通运行。

## 结果分析

结果页选择最近输出、已保留运行、分段结果或其他输出目录作为数据源，再选择所需曲线或相空间视图。支持交互缩放及图像导出。包络、质心、能量和发射度曲线可勾选“线性模型”，以虚线叠加按这次运行自己的输入计算的线性模型，用于判断多粒子效应的影响。

运行对比可叠加不同运行的同一物理量。比较前确认单位、输入和坐标范围一致；多线程模拟可能存在小幅随机差异，不应要求输出逐字节相同。

回放入口在运行页，结果页用于数据分析。单粒子计算中 rms 列为 NaN 可能是内核的正常输出，需结合存活粒子数和日志判断。

## AI 助手

使用 Ctrl+Shift+A 打开助手，在设置中配置 OpenAI 兼容接口或本地模型。密钥存储在 Windows 凭据管理器。需要数据留在本机时使用本地模型服务。

助手可以读取项目、解释结果并在副本中试算。项目修改以提案卡片显示，批准后应用；若在当前对话开启自动应用，则按该设置处理。写入前备份，可撤销。

助手的试算输出位于 .avas_ai/runs，不改写 InputFile 和 OutputFile。项目运行锁定期间，修改提案会被拒绝，待运行结束后再提出。

## 常见问题

### 场图缺失或结构检查失败

检查引用文件是否存在、文件名和路径是否正确，并按结构页的问题提示修正。不要仅通过隐藏提示继续运行。

### 起点全部粒子丢失

先检查是否误写 multithreading 0，再结合束流参数、孔径、场图和日志检查。关闭多线程应删除关键字行。

### 修改代码后桌面程序没有变化

打包的可执行文件不会随源码自动更新，需要重新打包。普通用户使用发布包即可，无需安装 Node.js 或 Word。


## 更多帮助

[案例教程与验证条件](#cases-setup) · [参数与文件参考](#reference-home) · [接受度测量](#cases-acceptance)

## 误差研究

在模拟设置页选择静态、动态或静态 + 动态误差，设置误差种子。结构中同时配置 err_step、误差幅度与开启命令，再保存并运行。结果写入 error_output，具体抽样与统计见参考章节。

[误差案例](#cases-errors)
`,Ot=`# AVAS user manual

Keep this manual open while working. Drag the title bar to move it or its edges to resize it. Maximize and restore using the title buttons; press Esc to close. Reopening restores the default position and size. Search filters chapter titles and content; select a contents entry to jump to it. The manual follows the interface language.

## Quick start

1. Open a project or create one from the File menu. For a first run, work on a copy of examples/hwr010.
2. Check the beam energy, particle count and distribution, then the lattice, field maps and simulation settings.
3. Confirm the file marked for simulation in the Lattice page, save changes and start the run.
4. Follow progress, logs and live envelopes in Run; inspect plots and phase space in Results afterwards.
5. Keep the completed run in the run records before starting another calculation if you need its results.

## Projects and input files

ini.ini defines the project inputs and outputs. InputFile holds beam, settings, lattice and field-map files; OutputFile holds the latest full run. The lattice/source setting selects the simulation lattice; its filename is not necessarily lattice_mulp.txt.

Use the File menu or project switcher to open another project. Unsaved changes are checked before switching or closing. Files is the browser of InputFile: raw text, field-map profiles and slices, particle files, and importing, duplicating, renaming and recycling. Everyday edits happen on their own pages: the initial particle distribution and secondary particles on Beam, boundary.txt and scanData.txt on Simulation settings.

Inputs are read-only during a run. You can still inspect files and results.

## Beam settings

Use Beam to configure energy, current, particle count and distribution. Saving updates beam.txt while retaining unmanaged keywords and comments. Ctrl+Z and Ctrl+Y undo and redo changes.

The beam reference entries below provide keyword meanings, units and choices. With “Read particles from a .dst file” checked and a file chosen, the page shows that file’s particles (x-x′, y-y′, φ-W; the red curve is the rms ellipse of the particles), and “Fill parameters from file” copies mass, current, energy and Twiss into the form.

Checking “Secondary beam” writes secondarybeam 1 in input.txt and edits SeParticle.txt in the table below it (one particle per row); the synchronous particle still comes from the beam parameters. “History” lists the saved versions of beam.txt; restoring one fills the form as one undoable change, written to the file when you save.

## Lattice editing

The file selector opens a lattice for viewing or editing. Use the separate Set as run lattice button to choose the simulation input.

Text + Structure shows the text and physical parameter panels together. Select an element to inspect its parameters, position and diagnostics. Text, structure and visual edits share one source and undo history.

Visual mode starts in read-only browsing. Enter editing before changing elements or parameters. Finishing with unsaved changes offers save, discard this editing session or continue editing. TraceWin .dat files are currently read-only.

The top-left controls in 2D and 3D zoom and fit the view. Double-click the 2D view to fit all; in 3D, double-click empty space to fit all or an element to focus it. Manual 3D zoom stops roaming and bunch following.

## Simulation settings

The Simulation settings page manages simulation options in input.txt with undo and redo. See the input reference entries for individual fields. With “Apply boundary (boundary.txt)” checked, the loss boundary table is edited below it; with phase scan “from scanData.txt”, the entry phase and time of each RF cavity are edited below it, one row per cavity in lattice order. The tables are saved with the page; an empty table does not create a file. “History” lists the saved versions of input.txt and restores them as on the Beam page.

CPU multithreading writes multithreading 1 when enabled and removes the line when disabled. Do not manually write multithreading 0: the engine loses all particles at the start with that value.

Resolve lattice errors and missing field maps before running. The linear envelope preview is a quick estimate; use engine results for final conclusions.

## Running and keeping results

Only one task can run at a time. Starting checks and saves modified pages. If the previous completed result has not been kept, choose Keep and run, Run directly or Cancel.

Pause suspends the process; resume continues it and stop ends it. Inputs remain read-only while paused. Full runs use the inputs snapshot in the output directory without rewriting original inputs.

A full run overwrites OutputFile. Keeping a run copies its results and input snapshot into a separate Runs directory. Completed records can be replayed; unwanted records can be recycled.

Segment runs write under Segments without replacing full-run results. Use the segment workflow for the required RF phase conversion.

## Live envelopes and replay

Run shows the current live envelope and can replay it after completion. Replay on a run record selects a historical result. A new run switches back to the current calculation.

Lattice replays the last run against the edited lattice, so results may be outdated after edits. Last-run curves start hidden and appear when replay begins. The × to the left of a legend item hides its curve.

The bunch and particle cloud are illustrations based on rms envelopes, not actual particle distributions. Comparison with the preceding run is off by default. Animation follows View > Motion settings.

## Parameter scans

Choose a lattice element parameter or a beam.txt / input.txt keyword, supply values and start the scan. Each value runs on an input copy without replacing original inputs or the full-run result.

Follow the table, curve and run status. Results live under Scans, with a run_NNN directory per value and scan.json / scan.csv summaries. A normal run cannot start during a scan.

## Results analysis

Choose the latest output, a kept run, a segment result or another output directory in Results, then select plots or phase-space views. Interactive zoom and figure export are available. Envelope, centroid, energy and emittance plots can overlay the linear model of the run's own inputs (dashed, Linear model) to show what the multi-particle simulation adds.

Compare runs overlays the same quantity from multiple runs. Check units, inputs and coordinate ranges before comparing. Multithreaded simulations can differ slightly; output need not be byte-identical.

Replay lives in Run; Results is for analysis. NaN rms columns can be normal for a single-particle calculation; check surviving particles and logs as well.

## AI assistant

Open the assistant with Ctrl+Shift+A and configure an OpenAI-compatible endpoint or local model. API keys are stored in Windows Credential Manager. Use a local model service when data must remain on your machine.

The assistant can read the project, explain results and run trials on copies. Project changes appear as proposals applied after approval, unless automatic application is enabled for the conversation. Changes are backed up and can be undone.

Trials write under .avas_ai/runs without changing InputFile or OutputFile. Modification proposals are refused while project inputs are locked; request them again after the run.

## Troubleshooting

### Missing field maps or lattice errors

Check referenced files, names and paths, then resolve the Lattice diagnostics before running.

### All particles lost at the start

First check for multithreading 0, then inspect beam settings, apertures, field maps and logs. Remove the keyword line to disable multithreading.

### Source changes do not appear in the desktop executable

Packaged executables need rebuilding after source changes. Users of release packages do not need Node.js or Word.


## Further help

[Cases and verification conditions](#cases-setup) · [Parameters and files](#reference-home) · [Acceptance](#cases-acceptance)

## Error studies

Choose static, dynamic or combined errors and a seed on the Simulation settings page. Configure err_step, amplitudes and enable commands in the lattice, then save and run. Results are stored in error_output.

[Error tutorial](#cases-errors)
`,kt=`# 案例教程 {#cases-home}

来源：docs/案例.docx 的全部 6 组片段，以及原使用说明的接受度章节。原文片段完整保留，修订明确标出；旧版案例不标作当前可运行功能。

## 通用准备与验证条件 {#cases-setup}

1. 把 examples/hwr010 整个项目复制到新的练习目录。不要直接覆盖原示例。
2. 前三个案例使用示例 beam.txt 参数；本次短验证将 particlenumber 改为 300，input.txt 的 randomseed 设为 12345。误差研究的 Python 种子另设为 7。其余输入沿用示例。
3. 在副本 InputFile 中新建 manual_case.txt，复制对应代码。在结构页打开并设为运行结构，保存修改；选择相应运行模式。
4. 运行结束后检查日志、轨迹长度、存活数与目标值，不能只看“完成”。需要保留结果时使用运行记录的保留功能。

验证日期：2026-09-20。每个案例一次验证，输入副本未被内核改写；数值用于识别明显异常，不是高精度金标准。原始 Word 不包含完整 beam/input，因此这些是已明确补充条件的复现。

命令行也可运行（在练习目录中）：

\`\`\`text
avas run --input InputFile --output OutputFile --lattice manual_case.txt --mode basic
\`\`\`

误差案例把模式换成 stat_dyn，校正案例用 stat，并加 --seed 7。

## 叠加场多粒子入门 {#cases-superpose}

> 验证状态：已运行：300 粒子全部存活，305 行 DataSet，末端能量约 1.87937 MeV。仅验证这组输入能完成，不代表所有束流设置都得到相同结果。

认识 superpose、静磁场与射频场叠加。复制示例项目，保留 sol 和 hwr010 的全部分量场图。使用下面的结构内容，并选择普通运行（basic）。

\`\`\`text
start
drift      0.085  0.02   0
superpose  0 0 0 0 0 0
field      0.35   0.02     0   3   0   0   1    0.531  sol
superpose  0.345 0 0 0 0 0 0
field      0.21   0.02     0   1   162.5e6   -33   1.36    -1.36   hwr010
superposeend
end
\`\`\`

观察运行页包络，并在结果页检查能量、存活粒子数和输出分布。叠加区域最多包含一个 RF 腔，第一条 superpose 全为零。

[叠加场规则](#ref-superpose)

## 静态与动态误差研究 {#cases-errors}

> 验证状态：修订版已运行：基准加 2 组 × 2 次，均得到 353 行 DataSet；误差运行末端能量约 2.36336–2.36582 MeV，存活 283–287 / 300。原版缺参数，不能直接作为正常教程。

观察误差组幅度和重复抽样的区别。选择静态 + 动态误差（stat_dyn），误差随机种子设为 7；模拟设置页保留基准运行。err_step 2 2 表示两组，每组两次。

修订版仅在最后一条 drift 后补上 0；原文为 \`drift 0.000001 0.02\`，内核日志报告参数不足，原版只得到 4 行 DataSet。

### 当前修订版

\`\`\`text
start
err_step 2 2
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 10 1 2 0 0.0 0.0 0.0 0.0 0.0
err_cav_dyn_on 1 0 0 0 0 0 0
err_cav_ncpl_dyn 10 1 2 0 0.0 0.0 0.0 0.0 0.0
drift 0.0835 0.02 0
field 0.1 0.02 0 3 0 0 1 0.677098 sol
field 0.1 0.02 0 3 0 0 1 0.677098 sol
field      0.21   0.02     0   1   162.5e6   -33  1.36    -1.36   hwr010
field      0.21   0.02     0   1   162.5e6   -33  -1.36    -1.36   hwr010
drift 0.0835 0.02 0
drift 0.000001 0.02 0
end
\`\`\`

### 原文片段（保留用于对照，不直接运行）

\`\`\`text
start
err_step 2 2
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 10 1 2 0 0.0 0.0 0.0 0.0 0.0
err_cav_dyn_on 1 0 0 0 0 0 0
err_cav_ncpl_dyn 10 1 2 0 0.0 0.0 0.0 0.0 0.0
drift 0.0835 0.02 0
field 0.1 0.02 0 3 0 0 1 0.677098 sol
field 0.1 0.02 0 3 0 0 1 0.677098 sol
field      0.21   0.02     0   1   162.5e6   -33  1.36    -1.36   hwr010
field      0.21   0.02     0   1   162.5e6   -33  -1.36    -1.36   hwr010
drift 0.0835 0.02 0
drift 0.000001 0.02
end
\`\`\`

查看 error_output/output_0_0 基准和 output_1_1 至 output_2_2，结合 errors_par.txt、errors_par_tot.txt 分析。存在一定粒子损失，不应将本例描述为无损传输。

[误差编号与抽样说明](#ref-errors)

## 静态误差校正示例 {#cases-correction}

> 验证状态：已运行但未达目标：原文 DIAG_ENERGY 的目标为 5 MeV；本次记录的基准末能量约 2.31270 MeV，error_adjust/output_0 约 2.28948 MeV。不能据此宣称校正成功；保留作进阶诊断示例。

理解 ADJUST 选择参数、约束范围和 DIAG_ENERGY 设置目标的关系。使用静态误差模式（stat）；不要直接把这组目标值当作已收敛的设计。

\`\`\`text
start
err_step 1 1
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 1 0 1.0 0 0.0 0.0 0.0 0.0 0.0
drift 0.0835 0.02 0
field 0.1 0.02 0 3 0 0 1 0.677098 sol
ADJUST 1 7 5 0 3 0
field      0.21  0.02     0   1   162.5e6   -33  3    -1.36   hwr010
drift 0.0835 0.02 0
DIAG_ENERGY 1 5 0
drift 0.000001 0.02 0
end
\`\`\`

检查目标能量与 Ke 范围是否物理可达，再检查校正前后记录。退出码为 0 不表示优化达到目标；进一步改变目标或范围属于新的物理研究，需要重新验证。

[校正与束诊命令](#ref-correction)

## 旧版包络模型 {#cases-legacy-envelope}

> 验证状态：旧版待核实：当前未提供这一段旧语法的已验证运行流程。

原代码只有元件片段，没有完整的项目输入。其 QUAD 参数数量与当前多粒子格式不同，不可直接贴入多粒子结构作为可运行例子。

\`\`\`text
DRIFT 0.76486 1 1
QUAD 0.97277 1 0.40328
DRIFT 0.1355 1 1
QUAD 0.15 1 -2.2265
DRIFT 0.381 1 1
QUAD 0.324 1 0.664
DRIFT 0.59197 1 1
\`\`\`

保留源代码供迁移核对；不以当前线性包络预览冒充原包络算法。

## 旧版 Twiss 匹配 {#cases-legacy-matching}

> 验证状态：旧版待核实：MATCHING、SETTWISS 的原流程未在当前界面验证。

保留原文匹配范围及目标。迁移前需核对所用算法、输入格式、目标定义和单位。

\`\`\`text
MATCHING 1 1 0.1 1
DRIFT 0.76486 1 1
MATCHING 1 1 0.1 1
MATCHING 1 3 0 10
QUAD 0.97277 1 0.40328
MATCHING 1 1 0.1 1
DRIFT 0.1355 1 1
MATCHING 1 1 0.1 1
MATCHING 1 3 -10 0
QUAD 0.150 1 -2.2265
MATCHING 1 1 0.1 1
DRIFT 0.381 1 1
MATCHING 1 1 0.1 1
MATCHING 1 3 0 10
QUAD 0.324 1 0.664
MATCHING 1 1 0.1 1
DRIFT 0.59197 1 1
SETTWISS 1 2 3 2 3
\`\`\`

不改名为 AI 优化教程；两者可能采用不同目标和算法。

## 旧版周期匹配 {#cases-legacy-periodic}

> 验证状态：旧版待核实：CIRCLE_MATCH、RF_GAP 等命令的可用入口与结果尚未核实。

原文用四个周期计算入口 Twiss，缺少完整输入和预期结果。

\`\`\`text
CIRCLE_MATCH 1 2 0
LATTICE 1 4 5
;cell1
DRIFT 1 0 0
SOLENOID 1 0 1
DRIFT 1 0 0
RF_GAP 100000 0 162.5E6
DRIFT 1 0 0
;cell2
DRIFT 1 0 0
SOLENOID 1 0 1
DRIFT 1 0 0
RF_GAP 100000 0 162.5E6
DRIFT 1 0 0
;cell3
DRIFT 1 0 0
SOLENOID 1 0 1
DRIFT 1 0 0
RF_GAP 100000 0 162.5E6
DRIFT 1 0 0
;cell4
DRIFT 1 0 0
SOLENOID 1 0 1
DRIFT 1 0 0
RF_GAP 100000 0 162.5E6
DRIFT 1 0 0
LATTICE_END
\`\`\`

保留 LATTICE 与周期结构原文，不将其视为当前多粒子分组语法。

## 接受度测量 {#cases-acceptance}

> 来源：使用说明20260427.docx“接受度测量使用方法”。步骤已按当前界面与结果服务改写；本次未用有代表性的束损分布验证接受度数值。

1. 准备输入束流；若从 dst 导入，先在束流页检查文件与束流参数。原版“Import all beam parameters from file”按钮的操作不能照搬。若需要由 Twiss 重新生成束流，应切回生成分布并确认参数，不能只删除文件路径。
2. 选择要研究的平面，设置适合研究的初始发射度。原手册建议扩大该方向发射度以覆盖接受边界；具体幅度需要根据束线确定。
3. 在模拟设置页把“Output every N steps (plt)”设为大于 0（例如 1）。这会保存逐步粒子记录，文件可能较大。
4. 完成模拟，在结果页选择这次输出，打开“接受度”，选择 x-x′、y-y′、z-z′ 或 φ-E 平面。
5. 查看拟合椭圆、发射度、归一化发射度及位置／角度；结合束损情况判断。全部粒子通过、缺少粒子记录或无法构成边界时不能把报错解释为零接受度。

接受度属于结果分析，不是原 Word 截图里的独立 accept 页面。三张旧截图已由当前文字步骤替代。

[粒子记录文件](#ref-beamset)
`,At=`# Case tutorials {#cases-home}

Source: all six fragments in docs/案例.docx plus the acceptance chapter of the original manual. Original code is retained; revisions are explicit. Legacy cases are not advertised as runnable current features.

## Preparation and verification conditions {#cases-setup}

1. Copy examples/hwr010 into a new practice directory.
2. For the first three cases retain the example beam settings, but set particlenumber to 300 for this short verification and randomseed in input.txt to 12345. The separate Python error seed is 7. Other inputs remain those of the example.
3. Create InputFile/manual_case.txt in the copy, paste the case code, open it in Lattice and set it as the run lattice. Save and choose the stated run mode.
4. Check logs, trajectory extent, survivors and targets after completion. Keep results through run records before replacing them.

Verified on 2026-09-20, once per case. Engine runs left the prepared inputs unchanged. Values identify gross errors, not precision reference tolerances. The original Word file lacks complete beam/input files; these reproduction conditions are explicitly added.

From the practice directory:

\`\`\`text
avas run --input InputFile --output OutputFile --lattice manual_case.txt --mode basic
\`\`\`

Use stat_dyn for the error study or stat for correction, adding --seed 7.

## Overlapping-field multi-particle example {#cases-superpose}

> Verification: Executed: all 300 particles survived; 305 DataSet rows; final energy approximately 1.87937 MeV. This verifies completion for these inputs, not equivalence for arbitrary beam settings.

Study superpose and overlapping static magnetic / RF fields. Copy the example project and retain all sol and hwr010 field components. Use basic mode.

\`\`\`text
start
drift      0.085  0.02   0
superpose  0 0 0 0 0 0
field      0.35   0.02     0   3   0   0   1    0.531  sol
superpose  0.345 0 0 0 0 0 0
field      0.21   0.02     0   1   162.5e6   -33   1.36    -1.36   hwr010
superposeend
end
\`\`\`

Inspect the Run envelope and Results energy, survivors and particle distributions. A block contains at most one RF cavity; its first superpose is all zero.

[Overlapping-field rules](#ref-superpose)

## Static and dynamic error study {#cases-errors}

> Verification: Revised example executed: reference plus 2 groups × 2 runs, all with 353 DataSet rows. Error-run final energies were approximately 2.36336–2.36582 MeV; 283–287 of 300 particles survived. The original has a missing parameter.

Select static + dynamic errors (stat_dyn), error seed 7 and keep the reference run enabled. err_step 2 2 means two groups with two repeats each.

The revision only adds the third parameter 0 to the last drift. The original \`drift 0.000001 0.02\` produced a missing-parameter error and only four DataSet rows.

### Current revision

\`\`\`text
start
err_step 2 2
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 10 1 2 0 0.0 0.0 0.0 0.0 0.0
err_cav_dyn_on 1 0 0 0 0 0 0
err_cav_ncpl_dyn 10 1 2 0 0.0 0.0 0.0 0.0 0.0
drift 0.0835 0.02 0
field 0.1 0.02 0 3 0 0 1 0.677098 sol
field 0.1 0.02 0 3 0 0 1 0.677098 sol
field      0.21   0.02     0   1   162.5e6   -33  1.36    -1.36   hwr010
field      0.21   0.02     0   1   162.5e6   -33  -1.36    -1.36   hwr010
drift 0.0835 0.02 0
drift 0.000001 0.02 0
end
\`\`\`

### Original fragment (comparison only)

\`\`\`text
start
err_step 2 2
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 10 1 2 0 0.0 0.0 0.0 0.0 0.0
err_cav_dyn_on 1 0 0 0 0 0 0
err_cav_ncpl_dyn 10 1 2 0 0.0 0.0 0.0 0.0 0.0
drift 0.0835 0.02 0
field 0.1 0.02 0 3 0 0 1 0.677098 sol
field 0.1 0.02 0 3 0 0 1 0.677098 sol
field      0.21   0.02     0   1   162.5e6   -33  1.36    -1.36   hwr010
field      0.21   0.02     0   1   162.5e6   -33  -1.36    -1.36   hwr010
drift 0.0835 0.02 0
drift 0.000001 0.02
end
\`\`\`

Compare error_output/output_0_0 with output_1_1 through output_2_2 and inspect errors_par.txt / errors_par_tot.txt. This is not a loss-free beamline.

[Error kinds and sampling](#ref-errors)

## Static-error correction example {#cases-correction}

> Verification: Executed but target not reached: DIAG_ENERGY requests 5 MeV. The observed reference final energy was about 2.31270 MeV and error_adjust/output_0 about 2.28948 MeV. This is an advanced diagnostic example, not a demonstrated successful correction.

Use static-error mode (stat) to understand ADJUST parameter selection, bounds and DIAG_ENERGY targets. The original target is not a validated converged design.

\`\`\`text
start
err_step 1 1
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 1 0 1.0 0 0.0 0.0 0.0 0.0 0.0
drift 0.0835 0.02 0
field 0.1 0.02 0 3 0 0 1 0.677098 sol
ADJUST 1 7 5 0 3 0
field      0.21  0.02     0   1   162.5e6   -33  3    -1.36   hwr010
drift 0.0835 0.02 0
DIAG_ENERGY 1 5 0
drift 0.000001 0.02 0
end
\`\`\`

Check physical reachability within the Ke bounds and inspect pre/post-correction outputs. Exit code 0 does not certify convergence. A changed target or bound is a new study requiring verification.

[Correction and diagnostics](#ref-correction)

## Legacy envelope model {#cases-legacy-envelope}

> Verification: Legacy / unverified: no validated current workflow for this old syntax.

The source is only an element fragment. Its QUAD parameter count differs from the current multi-particle format; do not paste it as a runnable multi-particle lattice.

\`\`\`text
DRIFT 0.76486 1 1
QUAD 0.97277 1 0.40328
DRIFT 0.1355 1 1
QUAD 0.15 1 -2.2265
DRIFT 0.381 1 1
QUAD 0.324 1 0.664
DRIFT 0.59197 1 1
\`\`\`

Keep the original for migration. The current linear envelope preview is not a replacement claim for this old algorithm.

## Legacy Twiss matching {#cases-legacy-matching}

> Verification: Legacy / unverified: the MATCHING and SETTWISS workflow has not been verified in the current interface.

Retain the original bounds and targets; check algorithm, format, target definitions and units before migration.

\`\`\`text
MATCHING 1 1 0.1 1
DRIFT 0.76486 1 1
MATCHING 1 1 0.1 1
MATCHING 1 3 0 10
QUAD 0.97277 1 0.40328
MATCHING 1 1 0.1 1
DRIFT 0.1355 1 1
MATCHING 1 1 0.1 1
MATCHING 1 3 -10 0
QUAD 0.150 1 -2.2265
MATCHING 1 1 0.1 1
DRIFT 0.381 1 1
MATCHING 1 1 0.1 1
MATCHING 1 3 0 10
QUAD 0.324 1 0.664
MATCHING 1 1 0.1 1
DRIFT 0.59197 1 1
SETTWISS 1 2 3 2 3
\`\`\`

Do not relabel it as AI optimization, which may use different objectives and algorithms.

## Legacy periodic matching {#cases-legacy-periodic}

> Verification: Legacy / unverified: the current entry point and behavior of CIRCLE_MATCH and RF_GAP have not been established.

The original defines four cells but lacks full project inputs and expected results.

\`\`\`text
CIRCLE_MATCH 1 2 0
LATTICE 1 4 5
;cell1
DRIFT 1 0 0
SOLENOID 1 0 1
DRIFT 1 0 0
RF_GAP 100000 0 162.5E6
DRIFT 1 0 0
;cell2
DRIFT 1 0 0
SOLENOID 1 0 1
DRIFT 1 0 0
RF_GAP 100000 0 162.5E6
DRIFT 1 0 0
;cell3
DRIFT 1 0 0
SOLENOID 1 0 1
DRIFT 1 0 0
RF_GAP 100000 0 162.5E6
DRIFT 1 0 0
;cell4
DRIFT 1 0 0
SOLENOID 1 0 1
DRIFT 1 0 0
RF_GAP 100000 0 162.5E6
DRIFT 1 0 0
LATTICE_END
\`\`\`

Preserve the original LATTICE structure; do not treat it as current multi-particle grouping syntax.

## Acceptance measurement {#cases-acceptance}

> Source: the acceptance chapter of 使用说明20260427.docx. Steps follow the current interface and result service. Acceptance values have not been verified on a representative loss distribution in this migration.

1. Prepare the beam. When importing a dst, inspect the distribution and parameters in Beam. The old “Import all beam parameters from file” button workflow no longer applies. To generate a new Twiss distribution, switch back to generated distribution and confirm parameters; deleting a path alone is insufficient.
2. Choose the study plane and initial emittance. The original suggests enlarging that emittance to sample the acceptance boundary; choose the magnitude for your beamline.
3. On the Simulation settings page, set “Output every N steps (plt)” above zero, for example 1. Particle dumps may consume substantial disk space.
4. After simulation, select its output in Results, open Acceptance and choose x-x′, y-y′, z-z′ or φ-E.
5. Inspect the ellipse, emittance, normalized emittance and position/angle together with losses. All particles passing or missing dumps may prevent computation; an error is not zero acceptance.

Acceptance now lives in Results, not the old standalone accept page. Current written steps replace the three legacy screenshots.

[Particle-dump format](#ref-beamset)
`,jt=`# 参数与文件参考 {#reference-home}

来源：docs/使用说明20260427.docx。以下为整理版，保留技术正文和格式信息，移除旧界面步骤与重复参数表。逐章注明核对范围；“来自原手册”不等于所有模式已经在当前版本实测。原始 Word 保留在仓库，不作修改。

参数表由当前 schema 动态提供。可在上方搜索输入文件名、命令或物理量。

## 场模型元件与射频相位 {#ref-field}

> 来源：原手册对应章节。核对状态：与当前 schema 对照；补充已核实的场强和相位约定。

场模型元件

用户给出元件的电磁场分布文件，在场模型元件中AVAS采用t-code进行模拟。

\`\`\`text
Drift   长度（m）  半径（m）   0
Field   长度（m）  半径（m）   V3 类型  频率   同步相位  Ke   Kb   场文件名
\`\`\`

场类型：1 为高频场，2 为静电场，3 为静磁场；静磁场中不使用的参数写 0。

V3：0代表同步相位 1代表粒子到入口的RF相位 2 代表t=0时刻的rf相位

例：

\`\`\`text
start
drift 0.0835 0.02 0
!静磁场
field 0.1 0.02 0 3 0 0 1 0.677098 sol_1
!高频场
field 0.1 0.02 0 1 162.5e6 -33 3 -1.36 hwr010b
end
\`\`\`

电场为 MV/m × Ke，磁场为 T × Kb；射频电场使用 cos(ωt+φ₀)，磁场使用 sin。V3=0 的同步相位按积分定义：atan2(∫E sinφ, ∫E cosφ)。场图存储顺序应按同组分量文件判断。

[查看 field 参数](#lattice-field)

## 矩阵模型元件与端部限制 {#ref-matrix}

> 来源：原手册对应章节。核对状态：元件参数以实时参考为准；首末矩阵元件限制来自原手册，本次未做独立内核验证。

用户给出元件的对应参数，在矩阵模型元件中AVAS采用z-code进行模拟。

\`\`\`text
Quad     长度（m）半径（m）  0 磁场梯度（T/m）
Solenoid  长度（m）半径（m）  0  磁场（T）
Bend     |αρ|（m） 半径（m）  0 偏转角α(°)  曲率半径ρ(m) 四极场指数 方向(0/1)
\`\`\`

*二极铁的长度默认等于|αρ|。方向：横向(x)偏转为0，纵向(y)偏转为1

\`\`\`text
Steerer        0      半径（m）  0   Bx/Ex(T or V/m)   By/Ey   类型   最大值
\`\`\`

*矫正铁长度必须为0，长度默认为下个元件的长度并位于下个元件的中间。类型：磁场校正铁为0，电场校正铁为1.

Bend

Edge

多粒子模型第一个和最后一个元件避免使用矩阵模型元件，可以加超级短的drift避免这个问题.

Bend、Edge 的逐项参数统一见 [bend](#lattice-bend)、[edge](#lattice-edge)、[quad](#lattice-quad)、[solenoid](#lattice-solenoid)、[steerer](#lattice-steerer)。

## 误差分析与分布编号 {#ref-errors}

> 来源：原手册对应章节。核对状态：已对照当前误差生成代码，修正原文中高斯分布与等步长的编号颠倒。

当添加误差后，模拟的结果将放在outputFile文件夹下的error_output文件夹下。相关命令如下：

err_step a b

a为分组数， b为每组运行多少次

动态误差

\`\`\`text
err_beam_dyn  r  dx\xA0\xA0\xA0dy\xA0\xA0\xA0\xA0dφ\xA0\xA0\xA0\xA0dxp\xA0\xA0\xA0\xA0dyp\xA0\xA0\xA0\xA0de\xA0\xA0\xA0\xA0dEx\xA0\xA0\xA0\xA0dEy\xA0\xA0\xA0\xA0dEz\xA0\xA0\xA0\xA0mx\xA0\xA0\xA0\xA0my\xA0\xA0\xA0\xA0mz\xA0\xA0\xA0\xA0dib
(mm)   (°)   (mrad)  (MeV)      (%)          (%)        (mA)
\`\`\`

*用于设定初始束团的误差，不需要写满参数，后续空置参数默认不设置误差。

\`\`\`text
err_quad_ncpl_dyn   N   r  dx\xA0\xA0\xA0dy\xA0\xA0\xA0\xA0dφ_x\xA0\xA0\xA0\xA0dφ_y\xA0\xA0\xA0\xA0dφ_z\xA0\xA0\xA0\xA0dG\xA0\xA0\xA0 \xA0dz\xA0\xA0 \xA0\xA0Nb
(mm)        (°)       (%) (mm)
\`\`\`

*用于设定静磁元件的误差，不需要写满参数，后续空置参数默认不设置误差。

\`\`\`text
err_cav_ncpl_dyn   N   r  dx\xA0\xA0 \xA0  dy\xA0\xA0  \xA0 \xA0dφ_x\xA0\xA0\xA0   \xA0dφ_y\xA0\xA0\xA0 \xA0\xA0\xA0\xA0kekb  \xA0\xA0\xA0 \xA0φ_s         dz\xA0\xA0 \xA0\xA0  Nb
(mm)         (°)        (%)   (°)   (mm)
\`\`\`

*用于设定射频腔的误差，不需要写满参数，后续空置参数默认不设置误差。

静态误差

\`\`\`text
err_beam_stat  0  dx\xA0\xA0\xA0dy\xA0\xA0\xA0\xA0dφ\xA0\xA0\xA0\xA0dxp\xA0\xA0\xA0\xA0dyp\xA0\xA0\xA0\xA0de\xA0\xA0\xA0\xA0dEx\xA0\xA0\xA0\xA0dEy\xA0\xA0\xA0\xA0dEz\xA0\xA0\xA0\xA0mx\xA0\xA0\xA0\xA0my\xA0\xA0\xA0\xA0mz\xA0\xA0\xA0\xA0dib
(mm)   (°)   (mrad)  (MeV)      (%)          (%)        (mA)
\`\`\`

*用于设定初始束团的误差，不需要写满参数，后续空置参数默认不设置误差。

\`\`\`text
err_quad_ncpl_stat   N  r  dx\xA0\xA0\xA0dy\xA0\xA0\xA0\xA0dφ_x\xA0\xA0\xA0\xA0dφ_y\xA0\xA0\xA0\xA0dφ_z\xA0\xA0\xA0\xA0dG\xA0\xA0\xA0 \xA0dz\xA0\xA0 \xA0\xA0Nb
(mm)        (°)       (%) (mm)
\`\`\`

*用于设定静磁元件的误差，不需要写满参数，后续空置参数默认不设置误差。

\`\`\`text
err_cav_ncpl_stat   N   r  dx\xA0\xA0 \xA0  dy\xA0\xA0  \xA0 \xA0dφ_x\xA0\xA0\xA0   \xA0dφ_y\xA0\xA0\xA0 \xA0\xA0\xA0\xA0kekb  \xA0\xA0\xA0 \xA0φ_s         dz\xA0\xA0 \xA0\xA0  Nb
(mm)         (°)        (%)   (°)   (mm)
\`\`\`

*用于设定射频腔的误差，不需要写满参数，后续空置参数默认不设置误差。

参数解释:

N: 作用于命令下面元件的数量， 想做用于所有元件，可以填写一个较大值

R：误差类型

r=0：固定值误差

r=1: 均匀分布的误差

r=2: 高斯分布的误差

r = -1：等步长误差（等价于tracewin中的0类型）

例：

\`\`\`text
err_step 2 2
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 10 r 2 0 0.0 0.0 0.0 0.0 0.0
\`\`\`

以上面的为例：

当r为1，那么第一组为[-1, +1]之间的误差，第二组为[-2, +2]之间的误差

当 r=2 时，第一组为标准差 1 的高斯分布误差，第二组为标准差 2 的高斯分布误差。原文在此误写为 r=-1，已按当前代码修正。

当 r=-1 时，以上射频腔例子的第一组误差为 1，第二组为 2。原文在此误写为 r=2。束流误差命令的等步长实现与元件分支不同，不能直接套用本例；使用前应核查实际抽样文件。

误差开启

\`\`\`text
err_beam_dyn_on   dx\xA0\xA0\xA0   dy\xA0\xA0\xA0  \xA0dφ …
err_quad_dyn_on   dx\xA0\xA0\xA0   dy\xA0\xA0\xA0\xA0  dφ_x…
err_cav_dyn_on    dx\xA0\xA0 \xA0  dy\xA0\xA0  \xA0\xA0dφ_x…
err_beam_stat_on   dx\xA0\xA0\xA0   dy\xA0\xA0\xA0  \xA0dφ …
err_quad_stat_on   dx\xA0\xA0\xA0   dy\xA0\xA0\xA0\xA0  dφ_x…
err_cav_stat_on    dx\xA0\xA0 \xA0  dy\xA0\xA0  \xA0\xA0dφ_x…
\`\`\`

这些命令用于启用相应误差，参数顺序与对应命令一致：0 关闭，1 开启。

例：

\`\`\`text
start
err_step 2 2
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 10 1 2 0 0.0 0.0 0.0 0.0 0.0
err_cav_dyn_on 1 0 0 0 0 0 0
err_cav_ncpl_dyn 10 1 2 0 0.0 0.0 0.0 0.0 0.0
drift 0.0835 0.02 0
field 0.1 0.02 0 3 0 0 1 0.677098 sol_1
field 0.1 0.02 0 3 0 0 1 0.677098 sol_1
field      0.21   0.02     0   1   162.5e6   -33  3    -1.36   hwr010b
field      0.21   0.02     0   1   162.5e6   -33  3    -1.36   hwr010b
end
\`\`\`

当前组幅度通常按“给定幅度 ÷ 总组数 × 当前组号”计算；固定值分支不做该缩放。Python 与内核的随机种子不是同一个设置。详见 [误差案例](#cases-errors)。

## 静态误差校正与束诊 {#ref-correction}

> 来源：原手册对应章节。核对状态：与当前校正流程对照；示例使用的场图名称需对应项目文件。

\`\`\`text
Adjust N, v, n, min, max, first_step
\`\`\`

N：目前无意义，写0即可

v: 修改下面元件的第v个参数

n:具有相同n的元件参数，他们矫正时具有相同的值,默认为0

min:参数的最小值

max: 参数的最大值

first_step：是否使用元件的初值作为梯度下降的初始值，0 不使用， 1使用

束诊命令

\`\`\`text
DIAG_ENERGY N w dw
\`\`\`

N: 无意义 填写0即可

W：目标能量（MeV）

Dw：无意义 填写0即可

\`\`\`text
DIAG_SIZE 0 sx sy 0
\`\`\`

Sx: x方向包络（mm）

Sy：y方向包络（mm）

\`\`\`text
DIAG_position 0 x y 0
\`\`\`

x: x方向中心位置（mm）

y：y方向中心位置（mm）

例：

\`\`\`text
start
err_step 1 1
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 5 1 2 0 0 0 0 0 0
drift 0.0835 0.02 0
field 0.1 0.02 0 3 0 0 1 0.677098 sol_1
adjust 1 7 5 0 3 0
!修改第七个值，也就是ke
field      0.21  0.02     0   1   162.5e6   -3  3    -1.36   hwr010b
drift 0.0835 0.02 0
DIAG_ENERGY 1 5 0
drift 0.000001 0.02 0
end
\`\`\`

[查看静态误差校正案例及验证状态](#cases-correction)

## 叠加场规则 {#ref-superpose}

> 来源：原手册对应章节。核对状态：与当前 schema 对照。

\`\`\`text
Superpose  z_0   x_0    y_0    θ_z0     θ_x0    θ_y0
Superposeend
Superposeout  z_0   x_0    y_0    θ_z0     θ_x0    θ_y0
\`\`\`

* 1、第一条Superpose命令后面的参数必须全为0，以提供其他Superpose命令的零点。

2、Superpose（Superposeout）后面的6个参数给出该命令之后一个元件的入口平面（转换平面）相对于第一条Superpose命令后元件的入口平面的位置和角度。

3、在一段叠加场结束后需要添加Superposeend或者Superposeout命令来结束叠加场，并且只有以Superposeout命令结束时，Superpose命令后z_0以外的参数才会生效，即以Superposeend命令结束时，元件只会在纵向位置上叠加。

4、一组叠加场中只能存在小于等于一个射频腔。

5、在一段叠加场中，每个元件前要有且只有一个Superpose命令。

例：

\`\`\`text
start
drift      0.085  0.02   0
superpose  0 0 0 0 0 0
field      0.35   0.02     0   3   0   0   1    0.531  sol_yuan
superpose  0.345 0 0 0 0 0 0
field      0.21   0.02     0   1   162.5e6   -33   1.36    -1.36   hwr010
superposeend
end
\`\`\`

[查看叠加场案例](#cases-superpose)

## 结构分组与折叠 {#ref-lattice}

> 来源：原手册对应章节。核对状态：与当前结构解析规则配合使用；原拼写 sction 保留。

\`\`\`text
lattice n1 n2
\`\`\`

n1：每个基础lattice的元件数量

n2: 写为1.

Lattice终点

\`\`\`text
lattice_end
\`\`\`

Lattice结束.

折叠命令

\`\`\`text
Sction module{
}
\`\`\`

使用这个命令，在页面上可以让{}中间的内容进行折叠复制。

例：

\`\`\`text
sction mebt
{
drift 0.05089 0.025 0
drift 0.1254 0.025 0
}
\`\`\`



## 输出平面 {#ref-planes}

> 来源：原手册对应章节。核对状态：补充已核实的末端限制。

outputplane V1：在该命令所在位置下游（正值）或上游（负值）输出束流分布，V1 单位 m。

automaticoutput V1 V2 V3：等间距插入输出面；依次为第一个输出面的相对位置、间隔和最大跨度，单位均为 m。

已核实：输出面超出末端会失败，距末端仅 5 mm 也可能失败，2 cm 的测试可以运行。分段功能自动去掉距末端 5 cm 内的输出面；内核结束会输出末端分布。

## 输入文件组织与模拟设置 {#ref-inputs}

> 来源：原手册对应章节。核对状态：当前输入快照和路径机制已更新；关键字表统一读取 schema。

用户编辑 beam.txt、input.txt 和 ini.ini 指定的结构源文件。完整运行及误差研究在输出目录的 inputs/ 快照中生成内核读取的 lattice.txt，不改写项目 InputFile。

input.txt 用于设置程序功能及算法信息，beam.txt 用于输入束团信息，lattice.txt 用于输入加速器元件信息。输入文件中!开头的行代表注释，注释内容不生效。关键字不区分大小写。

input.txt

input.txt中大部分关键字在程序中存在默认参数，不设置也可以正常模拟。

meshRms三个方向上的网格边长，按对应方向束团的 RMS 尺寸乘以 2 进行缩放V1 double；Lx = V1 × x 方向 RMS 尺寸 × 2V2 double；Ly = V2 × y 方向 RMS 尺寸 × 2V3 double；Lz = V3 × z 方向 RMS 尺寸 × 2

  当启用二次粒子输运功能时，应在 beam.txt 中设置加速器同步粒子参数。

  当启用纵向周期性边界条件时，空间电荷效应求解算法会自动切换为 FFT，并且纵向网格长度会实时设置为束团的周期长度，需要设置更多的纵向网格点数（Numofgrid）。

  当单独设置边界时，lattice.txt 中的半径设置将不再生效，束流损失将根据 boundary.txt 中设置的边界来判断。

输入参数表见下方 input 参考。multithreading 只写 1；关闭时删除整行，不能写 0。原文 stepPerCycle 的时间公式存在量纲疑问，未作为确定公式迁入，推进步长应按当前 schema 和实际运行核对。

[查看多线程参数](#input-multithreading)

## 束流文件与 Twiss 约定 {#ref-beam}

> 来源：原手册对应章节。核对状态：补充已核实的归一化 rms 发射度及单位；二次粒子模式有例外。

说明：

普通束团文件导入时，原手册说明除 numofcharge 外的生成参数不生效。二次粒子模式仍需同步粒子信息，见 SeParticle.txt；不要将普通导入规则当作所有模式的通则。

束流关键字表见下方 beam 参考。twiss β 单位 mm/mrad，ε 为归一化 rms 发射度，单位 π·mm·mrad。rms_x = sqrt(β_x·ε_x/(β_rel·γ))；纵向 z′ = Δp/p。

[查看 twissx](#beam-twissx)

## 运行结构文件 {#ref-source}

> 来源：原手册对应章节。核对状态：运行文件不限定为 lattice_mulp.txt。

第一个start之后到第一个end之前的内容为有效内容，程序会模拟第一个start之后到第一个end之前的元件。

使用 ini.ini 的 [lattice] source 指定源文件；运行结构与当前打开查看的结构可能不同。

## scanData.txt 射频扫相文件 {#ref-scan-data}

> 来源：原手册对应章节。核对状态：来自原手册；与参数扫描产生的 scan.csv 不同。

用于记录AVAS扫相结果或手动设置射频场相位，文件的每一行分别为一个射频腔的 入口相位（角度）、入口时间（s）。射频场在lattice中的排列顺序即为数据的排列顺序。



## SeParticle.txt 二次粒子 {#ref-secondary}

> 来源：原手册对应章节。核对状态：来自原手册及 schema 文件列定义；本次未运行二次粒子案例。

当在input.txt 中将 secondarybeam 设置为 1 时，可以在 ReadParticleDistribution 之后输入此文件。SeParticle.txt 文件用于记录二次粒子束，每一行代表一个粒子。

由于二次粒子束不包含同步粒子信息，为了正确模拟某些元件的作用，即使已经提供了初始束团分布，仍然需要在 beam.txt 文件中设置同步粒子信息。

| x | y | z | vx | vy | vz | charge | mass | weight | time | Kind |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| m | m | m | m/s | m/s | m/s | e | MeV | double | s | string |



## Boundary.txt 独立边界 {#ref-boundary}

> 来源：原手册对应章节。核对状态：来自原手册；本次未运行独立边界案例。

当在 input.txt 中将 boundary 设置为 1 时，Boundary.txt 文件生效。束流损失将根据该文件中设定的边界进行判断，束流损失的粒子信息将输出到 CollisionData.txt 文件中。此时，lattice.txt 中设置的元件半径将被屏蔽。

文件格式如下：

| type | material | Length | r1 | r2 | RLP | z0 | x0 | y0 | θz0 | θx0 | θy0 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| int | string | m | m | m | m | m | m | m | deg | deg | deg |



## edst 混合束团格式 {#ref-edst}

> 来源：原手册对应章节。核对状态：保留原手册的格式定义并修正 esdt 拼写；本次未逐字节验证混合束团格式。

.edst 为扩展束团分布文件，用于多种粒子混合束团。ReadParticleDistribution 指向 .edst 时，原手册说明程序切换到混合束团模拟，分布输出也相应使用 .edst。

.edst文件中记录每个粒子的六维坐标及电荷量、静止质量、权重。具体格式为：

\`\`\`text
2xCHAR+INT(Np)+DOUBLE(Ib(mA))+DOUBLE(freq(MHz))+CHAR+
(Np+1)×[9×DOUBLE(x(cm),x'(rad),y(cm),y'(rad),phi(rad),Energie(MeV),Charge(e),mc2(Mev),weight)]+DOUBLE(mc2(MeV))
\`\`\`

其中最后一个粒子为束团同步粒子，weight的含义为当前宏粒子代表多少个真实粒子。

CHAR的长度为1字节，INT的长度为4字节，DOUBLE的长度为8字节。

Np是粒子的数量，Ib是流强（这里不生效），freq是束流频率，mc2是粒子的静止质量。



## inData.dst 与 outData_x.dst {#ref-dst}

> 来源：原手册对应章节。核对状态：来自原手册，结合当前输出快照说明。

记录了模拟中使用的初始束团分布。

outData_x.dst

输出了指定平面上的束团分布，x为输出平面的位置，为二进制文件。



## DataSet.txt 束团参数 {#ref-dataset}

> 来源：原手册对应章节。核对状态：列索引从 0 开始；已结合当前 41 列约定补充位置、单位及不完整行处理。

记录了模拟过程中的束团参数（s坐标系下），每一行为一组束团参数，每一行的格式为：

| 索引（从 0 开始） | 物理量 |
| --- | --- |
| 0 | \`mean(E_k)\` |
| 1 | \`mean(x)\` |
| 2 | \`mean(γβ_x)\` |
| 3 | \`mean(y)\` |
| 4 | \`mean(γβ_y)\` |
| 5 | \`mean(z)\` |
| 6 | \`mean(γβ_z)\` |
| 7 | \`α_x\` |
| 8 | \`α_y\` |
| 9 | \`α_z\` |
| 10 | \`β_x\` |
| 11 | \`β_y\` |
| 12 | \`β_z\` |
| 13 | \`Emit_x\` |
| 14 | \`Emit_y\` |
| 15 | \`Emit_z\` |
| 16 | \`SizeX_RMS\` |
| 17 | \`SizeX'_RMS\` |
| 18 | \`SizeY_RMS\` |
| 19 | \`SizeY'_RMS\` |
| 20 | \`SizeZ_RMS\` |
| 21 | \`SizeZ'_RMS\` |
| 22 | \`MaxX\` |
| 23 | \`MaxX'\` |
| 24 | \`MaxY\` |
| 25 | \`MaxY'\` |
| 26 | \`MaxZ\` |
| 27 | \`MaxZ'\` |
| 28 | \`N_p\` |
| 29 | \`x_s\` |
| 30 | \`γβ_xs\` |
| 31 | \`y_s\` |
| 32 | \`γβ_ys\` |
| 33 | \`z_s\` |
| 34 | \`γβ_zs\` |
| 35 | \`sign\` |
| 36 | \`dir\` |
| 37 | \`∆x/∆y\` |
| 38 | \`∆z\` |
| 39 | \`Index\` |
| 40 | \`t\` |

*sign==0：这组束团数据处于直线段。sign==1：这组束团数据处于曲线段。sign==2:这组数据无效，处理时跳过这组数据。当存在束流轨迹包含曲线时从DataSet.txt中读取有效数据的代码如下：

x 中心 = 第 29 列（同步粒子 x）+ 第 1 列（质心相对偏移）；示例最大 x = 第 29 列 + 第 1 列 + 第 22 列。

最大值x = 同步粒子x + 质心相对于同步粒子的偏移  + 最大值 （ 29 + 1 + 22）

每行 41 列。直线段纵向位置为第 5 列加第 33 列，含弯铁时按当前 dataset_envelope 规则累加弧长；不能把直线公式用于所有弯曲轨迹。rms x/y/z 是第 16/18/20 列，单位 m；第 28 列为存活宏粒子数，第 0 列为能量 MeV。读取实时写入文件时丢弃不完整末行。

## Phase.txt 射频腔出入口 {#ref-phase}

> 来源：原手册对应章节。核对状态：来自原手册；文件名大小写按实际输出确认。

每两行输出1个射频腔入口及出口处的信息。具体格式如下：

\`\`\`text
射频腔序号 射频腔入口时间(s)  射频腔入口位置(m)  同步粒子在射频腔入口处能量(MeV)
射频腔序号 射频腔出口时间(s)  射频腔出口位置(m)  同步粒子在射频腔出口处能量(MeV)
\`\`\`



## synParticle.txt 同步粒子轨迹 {#ref-syn-particle}

> 来源：原手册对应章节。核对状态：来自原手册。

记录了同步粒子在传输中的相关信息。具体格式如下：

\`\`\`text
T     z_s    Ek_s      x_s      y_s       γβ_x      γβ_y        γβ_z         dir       α
\`\`\`

*T：现实时间。dir==0：同步粒子沿z方向飞行；dir==1:同步粒子向x方向偏转；dir==2:同步粒子向y方向偏转。α：偏转角度（rad）。



## DynamicErrorData.txt 误差记录 {#ref-dynamic-errors}

> 来源：原手册对应章节。核对状态：原手册命名保留；当前 Python 误差抽样还会生成 Error_Datas_<组>_<次>.txt。

当存在误差时，会生成该文件，这个文件中记录了初始束团和每个元件的具体误差。第一行是初始束团的误差，从第二行开始每一行是一个元件的具体误差。



## BeamSet.plt 逐步粒子记录 {#ref-beamset}

> 来源：原手册对应章节。核对状态：保留单束与双束两套格式；单位、记录标志不可混用，双束格式本次未做二进制验证。

.plt是一个二进制文件，该文件存储了束流传输过程中每一步束团的信息，

\`\`\`text
Char + Char + dumpPeriodicity(int) + Np(int) + Ib[mA](double) + freq[MHz](double) + mc2[MeV](double)
+ Nx * [Char + tpye(int) + Index(int) + time[s](double) + location[m](double) +
Np * [x(double) + px(double) +  y(double) + py(double) + z(double) + pz(double) + lossFlag(int)]]（场元件）
Np * [x(double) + px(double) +  y(double) + py(double) + t(double) + pz(double) + recordFlag(int)]] （矩阵元件）
\`\`\`

说明

dumpPeriodicity：每推进多少步记录一次

Np: 粒子总数

Ib：流强

Freq：频率

mc2：静止能量（MeV），不是束流动能。

tpye：zcode(1)或 tcode(0)

index：步序号，0 为初始分布；与 DataSet 的对应需按当前读取器检查，不假定有缺失记录时仍能逐行直接配对。

times：tcode为同步粒子运行至该位置时间，zcode为所有粒子的平均时间

location：tcode为同步粒子位置， zcode所有粒子位置

p：动量（βγ）

lossflag: 1(损失) 2（通过输出平面）0（未丢失）

recordFlag：1（未丢失），0（丢失）

双束的plt文件与单束的结构不一样

\`\`\`text
File format =
char
+ char
+ dumpPeriod(int)
+ Np(int)
+ Ib[mA](double)
+ Freq[MHz](double)
+ RestMass[MeV/c^2](double)
+ Nx × {
char
+ type(int)
+ index(int)
+ time[s](double)
+ location[m](double)
+ Np × [
x(double)
+ px(double)
+ y(double)
+ py(double)
+ z(double) or t(double)
+ pz(double)
+ lossFlag(int)
+ particleIndex(int)
+ charge[e](int)
+ RestMass[MeV/c^2](double)
+ weight(double)
]
}
\`\`\`

接受度分析需要粒子逐步记录，dumpPeriodicity 必须大于 0。文件存在但没有粒子记录时仍不可计算。

[当前接受度操作步骤](#cases-acceptance)

## density 密度数据 {#ref-density}

> 来源：原手册对应章节。核对状态：原手册格式；max/min 字段文字存在歧义，下面明确保留待核实标记。

\`\`\`text
zg(f) + emit_x(f) + emit_y(f) + emit_z(f) + rms_x(f) + rms_y(f) + rms_z(f) + nownumofp(i)
+ lost(i) + maxlost(i) + minlost(i) + moy( 4* f) + maxb(4*f) + minb(4*f) + maxr(4*f) + minr(4*f)
tab_x(i * 300) + tab_y(i * 300) + tab_r(i * 300)+ tab_z(i * 300)
\`\`\`

x, y, r, z

（指束团中的单个粒子）

Zg:纵向距离

emit_x（f） + emit_y（f） + emit_z（f）： 发射度

rms_x(f) + rms_y(f) + rms_z(f)： 包络

nownumofp(i)：粒子数

loss（i）： 束损

maxlost(i)：最大束损 ，

minlost : 最小束损

moy( 4* f)： x, y, r, z的平均值

maxb、minb：原手册分别描述为最大、最小偏移粒子的最大值；说明不充分，具体含义待核实。

maxr、minr：原手册描述为最大、最小偏移粒子的最小值，但 max/min 文字相互交叉；含义待核实，不把这些文字作为已验证计算定义。

tab_x： (i) * 300, 统计粒子，将x_min – x_max分为300个网格， 统计每个网格内的粒子数



## synData.txt 元件入口参数 {#ref-syn-data}

> 来源：原手册对应章节。核对状态：补充已核实的 RF 相位换算；原文的字段序号不一致，不直接据此编写读取器。

该文件记录了同步粒子到达每个元件入口时的时间和能量。

字段说明：

\`\`\`text
order name length zstart tin γβ ϕs ϕRF
原文列名数和标出的 0…8 序号不一致；此处不提供未经核实的序号映射。
\`\`\`

如果设置了 RF 相位或同步相位，将计算对应的同步相位或 RF 相位。

φRF = phase_t0 + 360·f·t_in。分段把入口时间重置为 T_entry 时，phase_t0,new = φRF − 360·f·(t_in − T_entry)。频率用 Hz、时间用 s、相位用度，不能直接沿用中段绝对相位。

## pchistogram.dat 粒子直方图 {#ref-histogram}

> 来源：原手册对应章节。核对状态：原手册二进制格式；本次未逐字节验证。

当在 input.txt 中将 pchistogram 的 V1 设置为 1 时，会生成 pchistogram.dat 文件。

该文件记录了将每个方向的最小值到最大值范围划分为 V2 等份，并统计每一份中宏粒子的数量。

\`\`\`text
该文件为二进制文件，格式为：char + Index(int) + V2(int) + V2 · tabx(int) + V2 · taby(int) + V2 · tabr(int) + V2 · tabz(int) + xmin(double) + xmax(double) + avex(double) + ymin(double) + ymax(double) + avey(double) + rmin(double) + rmax(double) + aver(double) + zmin(double) + zmax(double) + avez(double)
\`\`\`



## SingleParticle.txt 单粒子输出 {#ref-single}

> 来源：原手册对应章节。核对状态：修正 displacepos 的单位为 mm，保留原文说明并标出差异。

在 beam.txt 中将关键字 particlenumber 设置为 1 时，将启用单粒子模拟，输出 SingleParticle.txt 文件，并记录该单粒子的轨迹。

| x | y | z | γβx | γβy | γβz | Ek | time |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| m | m | m |  |  |  | MeV | s |  |

此时，beam.txt 中与多粒子相关的关键字（如 twissx、twissy、twissz、current 和 distribution）将不再生效。关键词 displacepos 和 displacedpos 会生效，用于设置初始单粒子的位置和动量偏移。

displacepos dx dy dz：内核按 mm 读取。原手册写 m，已依据仓库实测约定修正。

displacedpos dpx dpy dpz：动量偏移单位 %。

单粒子运行的 rms 列可能为 NaN，属于正常情况，需结合轨迹和存活数解读。

## errors_par.txt 误差统计 {#ref-error-summary}

> 来源：原手册对应章节。核对状态：字段顺序保留；与逐次结果表区分。

\`\`\`text
step_err  误差组数
ave(ratio_loss)
ave(emit_x_increase)
ave(emit_y_increase)
ave(emit_z_increase)
ave(x_center(m))
ave(y_center(m))
ave(x_'(rad))
ave(y_'(rad))
ave(rms_x(m))
ave(rms_y(m))
ave(rms_x'(rad))
ave(rms_y'(rad))
ave(delat_energy)
rms(x_center(m))
rms(y_center(m))
rms(x_'(rad))
rms(y_'(rad))
rms(rms_x(m))
rms(rms_y(m))
rms(rms_x'(rad))
rms(rms_y'(rad))
rms(delat_energy(MeV))
\`\`\`



## errors_par_tot.txt 逐次误差结果 {#ref-error-detail}

> 来源：原手册对应章节。核对状态：字段顺序保留。

\`\`\`text
step_err 误差组数与次数
ratio_loss 误差损失率， 损失粒子数/总的粒子数
emit_x_increase   emit_x(output)/ emit_x(input) - 1
emit_y_increase   emit_y(output)/ emit_y(input) - 1
emit_z_increase   emit_z(output)/ emit_z(input) - 1
x_center(m)
y_center(m)
x_'(rad)
y_'(rad)
rms_x(m)
rms_y(m)
rms_x'(rad)
rms_y'(rad)
delat_energy(MeV),
alpha_xx’,
beta_xx’,
alpha_yy’,
beta_yy’,
alpha_zz’,
beta_zz’,
\`\`\`


`,Mt=`# Parameters and files {#reference-home}

Source: docs/使用说明20260427.docx, reconciled with current schema and documented engine checks. This reference preserves file formats and technical rules while replacing obsolete interface instructions. Source-only formats are not certified by this migration. Current keyword tables follow these chapters and are loaded from the editor schema. The original Word file is retained unchanged.

## Field elements and RF phase {#ref-field}

Field-map elements use time-based tracking (t-code). Drift parameters are length (m), aperture radius (m), and a reserved 0. Field parameters are length, radius, V3, field type, frequency, phase, Ke, Kb and map basename. Types are 1 RF, 2 electrostatic and 3 magnetostatic; unused magnetic-field parameters may be zero.

V3=0 specifies synchronous phase, V3=1 the entrance RF phase, and V3=2 the absolute RF phase at t=0. Electric fields are MV/m × Ke; magnetic fields are T × Kb. RF electric fields use cos(ωt+φ₀), magnetic fields sin. The synchronous phase is atan2(∫E sinφ, ∫E cosφ). Determine map storage order from a complete component group.

Example map names must be replaced with files present in the project:

\`\`\`text
start
drift 0.0835 0.02 0
field 0.1 0.02 0 3 0 0 1 0.677098 sol_1
field 0.1 0.02 0 1 162.5e6 -33 3 -1.36 hwr010b
end
\`\`\`

[Field parameters](#lattice-field)

## Matrix elements and endpoint limitations {#ref-matrix}

Matrix elements use longitudinal tracking (z-code). Quad takes length, radius, reserved 0 and gradient (T/m); Solenoid takes length, radius, reserved 0 and field (T). Bend takes length (0 lets the program calculate the arc), radius, reserved 0, bend angle (deg), curvature radius (m), field index and plane (0 horizontal, 1 vertical). Arc length is |α|ρ with α converted to radians.

Edge takes 0, aperture radius, 0, pole-face angle β (deg), curvature radius ρ (m), total gap G (m), fringe factors K1/K2 and plane. Steerer takes 0, radius, 0, Bx/Ex, By/Ey, type and maximum; type 0 is magnetic, 1 electric. The original states that the steerer acts at the midpoint of the next element with its effective length.

The original advises avoiding matrix elements at the first and last position by inserting short drifts. This endpoint limitation was not independently tested during migration. Use the live parameter entries for exact field definitions.

[Bend](#lattice-bend), [Edge](#lattice-edge), [Steerer](#lattice-steerer)

## Errors and distribution kinds {#ref-errors}

err_step a b defines a groups and b repeats per group. Results are stored under error_output. Beam, magnetic-element and cavity errors have separate static and dynamic commands:

\`\`\`text
err_beam_dyn r dx dy dφ dxp dyp de dEx dEy dEz mx my mz dib
err_beam_stat r dx dy dφ dxp dyp de dEx dEy dEz mx my mz dib
err_quad_ncpl_dyn N r dx dy dφx dφy dφz dG dz Nb
err_quad_ncpl_stat N r dx dy dφx dφy dφz dG dz Nb
err_cav_ncpl_dyn N r dx dy dφx dφy kekb φs dz Nb
err_cav_ncpl_stat N r dx dy dφx dφy kekb φs dz Nb
\`\`\`

Offsets are mm, angular errors degrees, beam slopes mrad, energy MeV, relative emittance/mismatch/field errors percent and current mA. Consult the keyword entries for each position; trailing unspecified error parameters default to no error. N controls how many following elements are affected.

Current schema and Python sampling agree on 0 fixed, 1 uniform, 2 Gaussian and -1 equal steps. The original example swaps 2 and -1; this is corrected here. For the cavity example below, group amplitudes are 1 then 2: uniform bounds ±1 then ±2 for r=1, Gaussian standard deviations 1 then 2 for r=2, and fixed steps 1 then 2 for r=-1.

\`\`\`text
err_step 2 2
err_cav_stat_on 1 0 0 0 0 0 0
err_cav_ncpl_stat 10 r 2 0 0 0 0 0 0
\`\`\`

The beam equal-step branch differs from the element branch; inspect generated samples before applying this cavity example to beam errors. Fixed-value errors are not group-scaled. Each corresponding err_beam/quad/cav_dyn_on or _stat_on uses 0/1 switches in the same order. Python error sampling and engine random seeds are separate settings.

[Executed error tutorial](#cases-errors)

## Static correction and diagnostics {#ref-correction}

ADJUST N v n min max first_step changes parameter v of the following element. N is unused; use 0. Equal nonzero grouping identifiers n tie corrected values together. min/max bound the parameter. first_step=1 starts from its lattice value; 0 does not. The original example uses v=7 for field Ke.

\`\`\`text
DIAG_ENERGY 0 W 0
DIAG_SIZE 0 sx sy 0
DIAG_POSITION 0 x y 0
\`\`\`

W is target energy in MeV; sx/sy are envelope sizes in mm and x/y centroid positions in mm. Reserved diagnostic fields are written as 0. The source correction example has not reached its requested 5 MeV under the documented reproduction conditions.

[Original correction case and observed result](#cases-correction)

## Overlapping fields {#ref-superpose}

Superpose and Superposeout take z0 x0 y0 θz0 θx0 θy0 (m and degrees). The first superpose is all zero, defining the reference entrance plane. Every field in the block has exactly one preceding superpose. End with superposeend or superposeout; only superposeout makes transverse offsets and angles effective. A block has at most one RF cavity.

[Overlapping-field tutorial](#cases-superpose)

## Lattice grouping and folding {#ref-lattice}

The source describes lattice n1 n2, with n1 the number of elements in a basic lattice and n2=1; lattice_end closes it. Use current keyword definitions when writing a simulation input. The old periodic-envelope example uses a different syntax and is not a current multi-particle recipe.

The spelling sction is retained from the source. It groups editor content for folding:

\`\`\`text
sction mebt
{
drift 0.05089 0.025 0
drift 0.1254 0.025 0
}
\`\`\`

## Output planes {#ref-planes}

outputplane V1 writes a distribution at a relative downstream (positive) or upstream (negative) position in metres. automaticoutput V1 V2 V3 inserts equally spaced planes: first relative position, spacing and maximum span, all metres.

Verified engine restrictions: planes beyond the lattice end fail; 5 mm from the end can fail, while a 2 cm test worked. Segment generation omits planes within 5 cm of the end. The engine writes a final distribution at the endpoint.

## Input organization and simulation settings {#ref-inputs}

beam.txt describes the beam, input.txt simulation settings, and the ini.ini-selected lattice describes elements. Keywords are case-insensitive and ! begins comments. Full/error runs generate engine lattice.txt in the output inputs/ snapshot without rewriting original inputs.

The live input entries replace the original keyword table. In particular, write multithreading 1 or omit the line to disable; 0 is unsafe for this engine. The original stepPerCycle time formula is dimensionally questionable and is not reproduced as a verified equation.

meshRms dimensions are Lx=V1×2×rms_x, Ly=V2×2×rms_y and Lz=V3×2×rms_z. The source states that longitudinal periodic boundaries select FFT and set longitudinal mesh length to the bunch period; sufficient longitudinal grid points are needed. Separate boundary mode ignores lattice aperture radii and uses Boundary.txt. Secondary transport requires synchronous-particle settings.

[Multithreading](#input-multithreading)

## Beam files and Twiss convention {#ref-beam}

Current beam entries replace the original table. β is mm/mrad; ε is normalized rms emittance in π·mm·mrad. rms_x = sqrt(β_x·ε_x/(β_rel·γ)); longitudinal z′ is Δp/p. The original β unit wording is superseded by the verified convention.

For ordinary distribution import, the source states that generation keywords except numofcharge do not apply. Secondary-particle inputs still require synchronous-particle information, so this is not a universal rule for every import mode.

[Twiss parameters](#beam-twissx)

## Run lattice source {#ref-source}

The source describes content after the first start and before the first end as active. The current run filename comes from ini.ini [lattice] source and need not be lattice_mulp.txt. Opening a file for inspection does not select it for simulation.

## scanData.txt {#ref-scan-data}

Records RF phase scans or manually supplied phases. Each row gives cavity entrance phase (degrees) and entrance time (s), in lattice RF-cavity order. This is distinct from parameter-scan scan.csv.

## SeParticle.txt {#ref-secondary}

Source/schema format; secondary-particle transport was not exercised during this migration. With secondarybeam=1, ReadParticleDistribution can reference this file, one particle per row. Synchronous-particle information must still be configured in beam.txt.

\`\`\`text
x y z vx vy vz charge mass weight time Kind
m m m m/s m/s m/s e MeV double s string
\`\`\`

## Boundary.txt {#ref-boundary}

Source format, not independently exercised here. boundary=1 selects separate loss boundaries instead of element apertures. Lost-particle information is written to CollisionData.txt.

\`\`\`text
type material Length r1 r2 RLP z0 x0 y0 θz0 θx0 θy0
int string m m m m m m m deg deg deg
\`\`\`

## edst mixed distributions {#ref-edst}

Original binary specification, not byte-verified for mixed species in this migration. The source spelling esdt is corrected to edst. ReadParticleDistribution with .edst switches to mixed distributions, and distribution outputs use .edst.

\`\`\`text
2×CHAR + INT(Np) + DOUBLE(Ib[mA]) + DOUBLE(freq[MHz]) + CHAR
+ (Np+1)×[9×DOUBLE(x[cm], x′[rad], y[cm], y′[rad], phi[rad], Energie[MeV], Charge[e], mc2[MeV], weight)]
+ DOUBLE(mc2[MeV])
\`\`\`

The last particle is synchronous. weight is the number of real particles represented by a macroparticle. CHAR is 1 byte, INT 4, DOUBLE 8. Np is particle count; the source says Ib is not effective here. Do not infer endian conventions absent from the specification.

## inData.dst and outData_x.dst {#ref-dst}

inData.dst records the initial simulated distribution; outData_x.dst records the binary distribution at output position x. Use the inputs snapshot alongside a kept result to understand the run settings.

## DataSet.txt {#ref-dataset}

41 columns per row; indices below are zero-based. Straight-line longitudinal position is column 5 + column 33. With bends use current dataset_envelope arc accumulation. rms x/y/z are columns 16/18/20 in metres, surviving macroparticles column 28, energy column 0 in MeV. Discard an incomplete last row while reading live output.

| Index (zero-based) | Quantity |
| --- | --- |
| 0 | \`mean(E_k)\` |
| 1 | \`mean(x)\` |
| 2 | \`mean(γβ_x)\` |
| 3 | \`mean(y)\` |
| 4 | \`mean(γβ_y)\` |
| 5 | \`mean(z)\` |
| 6 | \`mean(γβ_z)\` |
| 7 | \`α_x\` |
| 8 | \`α_y\` |
| 9 | \`α_z\` |
| 10 | \`β_x\` |
| 11 | \`β_y\` |
| 12 | \`β_z\` |
| 13 | \`Emit_x\` |
| 14 | \`Emit_y\` |
| 15 | \`Emit_z\` |
| 16 | \`SizeX_RMS\` |
| 17 | \`SizeX'_RMS\` |
| 18 | \`SizeY_RMS\` |
| 19 | \`SizeY'_RMS\` |
| 20 | \`SizeZ_RMS\` |
| 21 | \`SizeZ'_RMS\` |
| 22 | \`MaxX\` |
| 23 | \`MaxX'\` |
| 24 | \`MaxY\` |
| 25 | \`MaxY'\` |
| 26 | \`MaxZ\` |
| 27 | \`MaxZ'\` |
| 28 | \`N_p\` |
| 29 | \`x_s\` |
| 30 | \`γβ_xs\` |
| 31 | \`y_s\` |
| 32 | \`γβ_ys\` |
| 33 | \`z_s\` |
| 34 | \`γβ_zs\` |
| 35 | \`sign\` |
| 36 | \`dir\` |
| 37 | \`∆x/∆y\` |
| 38 | \`∆z\` |
| 39 | \`Index\` |
| 40 | \`t\` |

The source defines sign=0 straight, 1 curved, 2 invalid (skip). x centroid = column 29 + column 1; the source example maximum x adds column 22. mean(...) preserves the source overbar, not a derivative; underscores denote subscripts.

## Phase.txt {#ref-phase}

Source format: two rows per RF cavity, entrance then exit, each with cavity index, time (s), position (m) and synchronous energy (MeV). Check actual filename case.

## synParticle.txt {#ref-syn-particle}

Source trajectory fields:

\`\`\`text
T zs Eks xs ys γβx γβy γβz dir α
\`\`\`

T is time. dir=0 along z, 1 bends toward x, 2 toward y. α is bend angle in radians.

## DynamicErrorData.txt {#ref-dynamic-errors}

The original says row 1 records initial-beam errors and subsequent rows element errors. Current Python error studies also produce Error_Datas_<group>_<repeat>.txt; distinguish sampled settings from engine outputs.

## BeamSet.plt {#ref-beamset}

Source binary layouts are preserved below. Mixed/double-beam layout has not been byte-verified in this migration. dumpPeriodicity must exceed zero for particle dumps and acceptance analysis.

\`\`\`text
CHAR + CHAR + dumpPeriodicity(INT) + Np(INT)
+ Ib[mA](DOUBLE) + freq[MHz](DOUBLE) + mc2[MeV](DOUBLE)
+ Nx×[CHAR + type(INT) + Index(INT) + time[s](DOUBLE) + location[m](DOUBLE)
      + Np×[x(DOUBLE)+px(DOUBLE)+y(DOUBLE)+py(DOUBLE)+z(DOUBLE)+pz(DOUBLE)+lossFlag(INT)]]
\`\`\`

For matrix tracking replace z with t and lossFlag with recordFlag. type=0 t-code or 1 z-code. p is βγ. lossFlag=1 lost, 2 passed output plane, 0 not lost; matrix recordFlag=1 surviving, 0 lost. Time/location refer to the synchronous particle for t-code and particle means for z-code. mc2 is rest energy, not kinetic energy. Index 0 is the initial distribution; check the reader for alignment with DataSet when records are absent.

The source double-beam particle record extends the six coordinates and lossFlag with particleIndex(INT), charge[e](INT), RestMass[MeV/c²](DOUBLE), weight(DOUBLE); header and step structure remain as listed.

[Acceptance workflow](#cases-acceptance)

## density {#ref-density}

Original layout; f/i denote the source float/integer notation, without an independently verified width/endian contract here.

\`\`\`text
zg(f) + emit_x(f) + emit_y(f) + emit_z(f) + rms_x(f) + rms_y(f) + rms_z(f) + nownumofp(i)
+ lost(i) + maxlost(i) + minlost(i) + moy(4*f) + maxb(4*f) + minb(4*f) + maxr(4*f) + minr(4*f)
+ tab_x(i*300) + tab_y(i*300) + tab_r(i*300) + tab_z(i*300)
\`\`\`

zg is longitudinal distance, emit emittance, rms envelope, nownumofp particle count, lost loss count. moy contains x/y/r/z averages. Each histogram has 300 bins spanning its minimum to maximum. Original maxb/minb/maxr/minr descriptions are ambiguous and cross maximum/minimum wording; their exact meanings remain unverified. Do not use those descriptions as verified computational definitions.

## synData.txt {#ref-syn-data}

Records synchronous-particle entrance time and energy for each element. The original lists order name length zstart tin γβ ϕs ϕRF, but its numerical labels disagree with the listed field count; no unverified index mapping is supplied here.

Verified phase relation: φRF = phase_t0 + 360·f·t_in. For a segment with entry time T_entry, phase_t0,new = φRF − 360·f·(t_in − T_entry). Use Hz, seconds and degrees; do not directly reuse an intermediate absolute phase.

## pchistogram.dat {#ref-histogram}

Original binary format, not byte-verified here. pchistogram V1=1 enables it. V2 is the number of bins spanning each coordinate's minimum/maximum.

\`\`\`text
CHAR + Index(INT) + V2(INT)
+ V2×tabx(INT) + V2×taby(INT) + V2×tabr(INT) + V2×tabz(INT)
+ xmin(DOUBLE)+xmax(DOUBLE)+avex(DOUBLE)
+ ymin(DOUBLE)+ymax(DOUBLE)+avey(DOUBLE)
+ rmin(DOUBLE)+rmax(DOUBLE)+aver(DOUBLE)
+ zmin(DOUBLE)+zmax(DOUBLE)+avez(DOUBLE)
\`\`\`

## SingleParticle.txt {#ref-single}

particlenumber=1 enables single-particle tracking. Fields: x/y/z (m), γβx/γβy/γβz, Ek (MeV), time (s). Multi-particle generation settings such as Twiss/current/distribution do not apply as in bunch tracking.

Verified correction: displacepos dx dy dz is read by the engine in mm, despite metres in the original manual. displacedpos dpx dpy dpz uses percent. rms columns may be NaN; interpret trajectory and survivor data instead.

## errors_par.txt {#ref-error-summary}

Original group-summary field order (m for positions/envelopes, rad for slopes, MeV for energy differences):

\`\`\`text
step_err  group
ave(ratio_loss)
ave(emit_x_increase)
ave(emit_y_increase)
ave(emit_z_increase)
ave(x_center(m))
ave(y_center(m))
ave(x_'(rad))
ave(y_'(rad))
ave(rms_x(m))
ave(rms_y(m))
ave(rms_x'(rad))
ave(rms_y'(rad))
ave(delat_energy)
rms(x_center(m))
rms(y_center(m))
rms(x_'(rad))
rms(y_'(rad))
rms(rms_x(m))
rms(rms_y(m))
rms(rms_x'(rad))
rms(rms_y'(rad))
rms(delat_energy(MeV))
\`\`\`

## errors_par_tot.txt {#ref-error-detail}

Original per-repeat field order. ratio_loss is lost/initial particles; emittance growth is emit(output)/emit(input)−1. Position/envelope units are m, slopes rad, energy differences MeV.

\`\`\`text
step_err group and repeat
ratio_loss lost / initial particles
emit_x_increase   emit_x(output)/ emit_x(input) - 1
emit_y_increase   emit_y(output)/ emit_y(input) - 1
emit_z_increase   emit_z(output)/ emit_z(input) - 1
x_center(m)
y_center(m)
x_'(rad)
y_'(rad)
rms_x(m)
rms_y(m)
rms_x'(rad)
rms_y'(rad)
delat_energy(MeV),
alpha_xx’,
beta_xx’,
alpha_yy’,
beta_yy’,
alpha_zz’,
beta_zz’,
\`\`\`
`;function Nt(e,t){let n=[],r=``,i;for(let a of e.replace(/^\uFEFF/,``).split(/\r?\n/)){let e=a.match(/^\s*(`{3,}|~{3,})/);e&&(r?e[1][0]===r[0]&&e[1].length>=r.length&&(r=``):r=e[1]);let o=!r&&a.match(/^#{1,2} (.+?)(?: \{#([\w-]+)\})?\s*$/);o?(i={id:o[2]||`${t}-${n.length}`,title:o[1],text:``,category:t},n.push(i)):i&&(i.text+=a+`
`)}return n}function Pt(e,t,n){let r=n.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);return e.filter(e=>r.length?r.every(t=>`${e.title}\n${e.text}`.toLocaleLowerCase().includes(t)):e.category===t)}var Ft={width:340,height:260};function It(){let e=et(),t=Math.min(700,e.width*.55);return tt({x:e.width-t-24,y:60,width:t,height:e.height-110},Ft)}function Lt(){return Et(e=>e.open)?(0,N.jsx)(Rt,{}):null}function Rt(){let e=Be(),t=Fe(e=>e.lang),n=Et(e=>e.close),[r,i]=(0,M.useState)(``),[a,o]=(0,M.useState)(`guide`),[s,c]=(0,M.useState)(null),l={guide:e(`Operation guide`),cases:e(`Case tutorials`),reference:e(`Parameters and files`)},[u,d]=(0,M.useState)(()=>It().width>480),[f,p]=(0,M.useState)(null),[m,h]=(0,M.useState)(``),g=(0,M.useRef)(null);(0,M.useEffect)(()=>{let e=!0;return E(`schema.all`).then(t=>{e&&p(t)}).catch(t=>{e&&h(String(t.message??t))}),()=>{e=!1}},[]);let _=(0,M.useMemo)(()=>{let e=t===`zh_CN`,n=[...Nt(e?Dt:Ot,`guide`),...Nt(e?kt:At,`cases`),...Nt(e?jt:Mt,`reference`)];if(f)for(let e of[`beam`,`input`,`lattice`])for(let t of f[e])n.push({category:`reference`,id:`${e}-${t.key}`,title:`${e} · ${t.key} — ${_e(t.title)}`,text:[_e(t.doc),...t.params.map((e,t)=>`### ${t+1}. ${_e(e.label)}${e.unit?` (${e.unit})`:``}\n\n${_e(e.doc)}\n\n${e.choices.map(([e,t])=>`- ${e}: ${_e(t)}`).join(`
`)}`)].join(`

`)});return n},[t,f]),v=Pt(_,a,r);function y(e){let t=_.find(t=>t.id===e);t&&(o(t.category),i(``),c(e))}(0,M.useEffect)(()=>{if(s){let e=document.getElementById(`manual-${s}`);e&&g.current&&(g.current.scrollTop=e.offsetTop,c(null))}},[s,a,r,f]);function b(e){o(e),i(``),c(null),g.current?.scrollTo(0,0)}return(0,N.jsxs)(rt,{label:e(`User manual`),title:e(`User manual`),initialRect:It,minSize:Ft,onClose:n,onKeyDown:(e,t)=>{(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()===`f`&&(e.preventDefault(),t?.querySelector(`input`)?.focus())},children:[(0,N.jsx)(`div`,{className:`manual-tabs`,role:`tablist`,"aria-label":e(`Manual categories`),children:[`guide`,`cases`,`reference`].map(e=>(0,N.jsx)(`button`,{role:`tab`,"aria-selected":a===e,className:`btn btn-small`,onClick:()=>b(e),children:l[e]},e))}),(0,N.jsxs)(`div`,{className:`manual-tools`,children:[(0,N.jsx)(`button`,{className:`btn btn-small`,"aria-expanded":u,onClick:()=>d(!u),children:e(`Contents`)}),(0,N.jsx)(`input`,{className:`input`,"aria-label":e(`Search manual`),placeholder:e(`Search manual`),value:r,onChange:e=>{i(e.target.value),g.current?.scrollTo(0,0)}})]}),(0,N.jsxs)(`div`,{className:`manual-body`,children:[u&&(0,N.jsx)(`nav`,{"aria-label":e(`Contents`),children:v.map(e=>(0,N.jsxs)(`button`,{onClick:()=>y(e.id),children:[r.trim()&&(0,N.jsxs)(`small`,{children:[l[e.category],` · `]}),e.title]},e.id))}),(0,N.jsxs)(`article`,{ref:g,className:`selectable`,onClick:e=>{let t=e.target.closest(`a`)?.getAttribute(`href`);t?.startsWith(`#`)&&(e.preventDefault(),y(t.slice(1)))},children:[!v.length&&(0,N.jsx)(`p`,{children:e(`Nothing matches.`)}),v.map(e=>(0,N.jsxs)(`section`,{id:`manual-${e.id}`,children:[(0,N.jsx)(`h2`,{children:e.title}),r.trim()&&(0,N.jsx)(`p`,{className:`muted`,children:l[e.category]}),(0,N.jsx)(Tt,{text:e.text})]},e.id)),!f&&(a===`reference`||r.trim())&&(0,N.jsx)(`p`,{role:`status`,children:m?`${e(`Unable to load parameter reference`)}: ${m}`:e(`Loading parameter reference...`)})]})]})]})}function zt(e,t,n){let r=qe(),i=0,a={},o=o=>{let s=e._fullLayout;if(!s||o.target?.closest?.(`.modebar, .legend`))return;let c=e.getBoundingClientRect(),l=e.clientWidth?e.clientWidth/c.width:1,u=e.clientHeight?e.clientHeight/c.height:1,d=(o.clientX-c.left)*l,f=(o.clientY-c.top)*u,p=new Map;for(let e of Object.values(s._plots??{})){let t=e.xaxis,n=e.yaxis;!t||!n||d<t._offset||d>t._offset+t._length||f<n._offset||f>n._offset+n._length||(p.set(t._name,t),p.set(n._name,n))}if(!p.size)return;let m=r(o,t)===`pan`,h=We(o,c.height),g={};for(let[e,t]of p){if(t.fixedrange||!t._length)continue;let n=`${e}.range`,r=(a[n]??t.range).map(e=>t.type===`date`?new Date(e).getTime():Number(e));if(!r.every(Number.isFinite))continue;let i=e.startsWith(`x`),o=i?(d-t._offset)/t._length:1-(f-t._offset)/t._length,s=m?(i?h.x:-h.y)/t._length:0,c=Ge(r,s,m?1:Ue(h.y),o);g[n]=t.type===`date`?c.map(e=>new Date(e).toISOString()):c,g[`${e}.autorange`]=!1}Object.keys(g).length&&(o.preventDefault(),o.stopPropagation(),Object.assign(a,g),i||=requestAnimationFrame(()=>{i=0;let e=a;a={},n(e)}))};return e.addEventListener(`wheel`,o,{capture:!0,passive:!1}),()=>{e.removeEventListener(`wheel`,o,!0),cancelAnimationFrame(i)}}var Bt=null;function Vt(){return Bt||=He(()=>import(`./plotly.min-f1XCw4iF.js`).then(t=>e(t.default,1)).then(e=>e.default??e),__vite__mapDeps([0,1]),import.meta.url),Bt}var Ht={r:[`#d62728`,`#ff6b6b`],red:[`#d62728`,`#ff6b6b`],b:[`#1f5fd6`,`#6aa9ff`],blue:[`#1f5fd6`,`#6aa9ff`],g:[`#2a9d3f`,`#5ad17a`],green:[`#2a9d3f`,`#5ad17a`],m:[`#b0359f`,`#e58ad8`],magenta:[`#b0359f`,`#e58ad8`],blueviolet:[`#7b3fe4`,`#b28cff`],c:[`#0e9aa7`,`#4fd1db`],y:[`#b58900`,`#e3c14d`],k:[`#222222`,`#d4d4d4`],orange:[`#e07b20`,`#f0a050`],lime:[`#43a047`,`#8bd98f`],accent:[`#005fb8`,`#3794ff`],fg:[`#3b3b3b`,`#cccccc`]};function Ut(e,t){if(!e)return t?`#cccccc`:`#3b3b3b`;let n=Ht[e.toLowerCase()];return n?n[+!!t]:e}function Wt(e,t){return t?e?[[0,`#3b8fdd`],[.25,`#2c5f8a`],[.5,`#2b2b2b`],[.75,`#a04733`],[1,`#f5805c`]]:[[0,`#2166ac`],[.25,`#92bedd`],[.5,`#f4f2ed`],[.75,`#e08a72`],[1,`#b2182b`]]:e?[[0,`#2b2050`],[.25,`#414a8c`],[.5,`#2b8f8b`],[.75,`#73c54c`],[1,`#f2e650`]]:[[0,`#440154`],[.25,`#3b528b`],[.5,`#21918c`],[.75,`#5ec962`],[1,`#fde725`]]}function Gt(e){let t=Ce(`--fg`,e?`#cccccc`:`#3b3b3b`),n=e?`#333333`:`#e6e6e6`,r=e?`#5a5a5a`:`#9a9a9a`,i=Ce(`--editor-bg`,e?`#1f1f1f`:`#ffffff`),a={gridcolor:n,linecolor:r,zerolinecolor:r,tickcolor:r,showline:!0,mirror:!0,ticks:`outside`,automargin:!0};return{paper_bgcolor:i,plot_bgcolor:i,font:{family:`"Segoe UI", "Microsoft YaHei UI", sans-serif`,size:12,color:t},xaxis:a,yaxis:a,legend:{bgcolor:`rgba(0,0,0,0)`,bordercolor:n},colorway:[`r`,`b`,`g`,`m`,`blueviolet`,`c`,`orange`].map(t=>Ut(t,e)),hoverlabel:{bgcolor:Ce(`--tooltip-bg`),bordercolor:Ce(`--tooltip-border`),font:{color:t}},margin:{l:64,r:24,t:24,b:52}}}function Kt(e,t){if(Array.isArray(t)||typeof t!=`object`||!t)return t;let n={...e??{}};for(let[e,r]of Object.entries(t))n[e]=typeof r==`object`&&r&&!Array.isArray(r)&&!ArrayBuffer.isView(r)?Kt(n[e],r):r;return n}function qt(e,t){let n=Gt(t),r=Kt(n,e);for(let t of Object.keys(e))/^[xy]axis\d+$/.test(t)&&(r[t]=Kt(n[t.startsWith(`x`)?`xaxis`:`yaxis`],e[t]));return r}var Jt=.22;function Yt(e,t){return t==null||t>=e.length?e:e.map((e,n)=>n===t?{...e,opacity:1,line:{...e.line??{},width:(e.line?.width??2)+1.5}}:{...e,opacity:(e.opacity??1)*Jt})}function Xt({data:e,layout:t,config:n,className:r,style:i,onRelayout:a,onClick:o,onReady:s,highlight:c}){let l=(0,M.useRef)(null),d=j(e=>Ke(e.settings)),f=j(e=>e.resolvedTheme===`dark`),[p,m]=(0,M.useState)(null),[h,g]=(0,M.useState)(null),_=c??(e.length>=2&&e.every(e=>!e.type||e.type===`scatter`||e.type===`scattergl`)&&e.some(e=>String(e.mode??`lines`).includes(`lines`))),v=(0,M.useRef)(_);v.current=_;let y=(0,M.useRef)({onRelayout:a,onClick:o,onReady:s});y.current={onRelayout:a,onClick:o,onReady:s};let b=e.map(e=>e.name??``).join(`|`)+`#${e.length}`;return(0,M.useEffect)(()=>g(null),[b]),(0,M.useEffect)(()=>{let e=!0;return Vt().then(t=>e&&m(t)),()=>{e=!1}},[]),(0,M.useEffect)(()=>{let r=l.current;if(!p||!r)return;let i=qt({autosize:!0,...t??{}},f);p.react(r,_?Yt(e,h):e,i,{responsive:!0,displaylogo:!1,scrollZoom:!0,modeBarButtonsToRemove:[`select2d`,`lasso2d`,`toImage`],...n??{}}),r.__avasBound||(r.__avasBound=!0,r.on(`plotly_relayout`,e=>y.current.onRelayout?.(e,r)),r.on(`plotly_click`,e=>{let t=e?.points?.[0]?.curveNumber;v.current&&typeof t==`number`&&g(e=>e===t?null:t),y.current.onClick?.(e)}),r.on(`plotly_legendclick`,e=>!v.current||(g(t=>t===e.curveNumber?null:e.curveNumber),!1))),y.current.onReady?.(r)},[p,e,t,n,f,h,_]),(0,M.useEffect)(()=>{let e=l.current;if(e&&p&&!n?.staticPlot&&n?.scrollZoom!==!1)return zt(e,d,t=>{p.relayout(e,t)})},[p,d,n?.staticPlot,n?.scrollZoom]),(0,M.useEffect)(()=>{let e=l.current;if(!e||!p)return;let t=0,n=new ResizeObserver(()=>{window.clearTimeout(t),t=window.setTimeout(()=>{e._fullLayout&&p.Plots.resize(e)},120)});return n.observe(e),()=>{window.clearTimeout(t),n.disconnect()}},[p]),(0,M.useEffect)(()=>()=>{l.current&&p&&p.purge(l.current)},[p]),(0,N.jsxs)(`div`,{className:r,style:{position:`relative`,minHeight:120,outline:`none`,...i},tabIndex:-1,onKeyDown:e=>{e.key===`Escape`&&h!=null&&(g(null),e.stopPropagation())},children:[(0,N.jsx)(`div`,{ref:l,style:{position:`absolute`,inset:0}}),!p&&(0,N.jsx)(`div`,{style:{position:`absolute`,inset:0,display:`flex`,alignItems:`center`,justifyContent:`center`},children:(0,N.jsx)(u,{size:22})})]})}var P=.3,Zt=.42;function Qt(e,t={}){let{u:n,v:r,fu:i,fv:a}=e,o=Math.max(2,Math.floor(t.nu??26)),s=Math.max(2,Math.floor(t.nv??13)),c=t.fill??.9,l=Number(n[n.length-1])-Number(n[0]),u=Number(r[r.length-1])-Number(r[0]),d={x:[],y:[],max:0,count:0};if(!n.length||!r.length||!l||!u)return d;let f=$t(n.length,o),p=$t(r.length,s),m=[],h=0,g=0;for(let e of p)for(let t of f){let o=e*n.length+t,s=Number(i[o]),c=Number(a[o]);if(!Number.isFinite(s)||!Number.isFinite(c))continue;let d=s/l,f=c/u,p=Math.hypot(d,f);p>h&&(h=p),g=Math.max(g,Math.hypot(s,c)),m.push({su:(Number(n[t])-Number(n[0]))/l,sv:(Number(r[e])-Number(r[0]))/u,nx:d,ny:f})}if(!h)return d;let _=c*Math.min(1/f.length,1/p.length)/h,v=[],y=[],b=0,x=(e,t)=>{v.push(Number.isNaN(e)?NaN:Number(n[0])+e*l),y.push(Number.isNaN(t)?NaN:Number(r[0])+t*u)};for(let e of m){let t=e.nx*_,n=e.ny*_,r=Math.hypot(t,n);if(r<1e-4*c*Math.min(1/f.length,1/p.length))continue;let i=e.su+t,a=e.sv+n,o=Math.atan2(n,t),s=P*r;x(e.su,e.sv),x(i,a),x(i-s*Math.cos(o-Zt),a-s*Math.sin(o-Zt)),x(i,a),x(i-s*Math.cos(o+Zt),a-s*Math.sin(o+Zt)),x(NaN,NaN),b++}return{x:v,y,max:g,count:b}}function $t(e,t){if(e<=0)return[];let n=Math.min(e,t),r=new Set;for(let t=0;t<n;t++)r.add(Math.min(e-1,Math.round((t+.5)*e/n-.5)));return[...r]}function en(e,t,n){switch(e.kind){case`quadrupole`:return{bx:e.g*n,by:e.g*t,bz:0};case`dipole`:{let r=e.rho?e.index*Math.abs(e.b)/e.rho:0;return e.vertical?{bx:e.b+r*n,by:r*t,bz:0}:{bx:-r*n,by:e.b-r*t,bz:0}}case`steerer`:return{bx:e.bx,by:e.by,bz:0};case`solenoid`:return{bx:0,by:0,bz:e.b}}}function tn(e,t,n,r){let i=Math.sign(e)||1;return{kind:`dipole`,b:r?-i:i,index:t,rho:n,vertical:r}}function nn(e,t,n=9){let r=[],i=0,a=Math.max(2,Math.floor(n));for(let n=0;n<a;n++)for(let o=0;o<a;o++){let s=t*(-1+2*o/(a-1)),c=t*(-1+2*n/(a-1));if(s*s+c*c>t*t*1.0001)continue;let{bx:l,by:u,bz:d}=en(e,s,c);r.push({x:s,y:c,bx:l,by:u,bz:d}),i=Math.max(i,Math.hypot(l,u))}return{samples:r,max:i}}var rn={zx:[`z`,`x`],zy:[`z`,`y`],xy:[`x`,`y`]};function an(e){return e[0]===`e`?`MV/m`:`T`}function on(e){return{...e,schematic:!1,unit:an(e.family)}}function sn(e,t){let{length:n,r,name:i,unit:a}=t,o=n>0?[`zx`,`zy`,`xy`]:[`xy`],s=o.includes(t.plane)?t.plane:o[0],c=s!==`xy`,l=Math.max(4,Math.floor(t.nu??(c?121:41))),u=Math.max(4,Math.floor(t.nv??41)),d=-.14*n,f=n*1.1400000000000001,p=(e,t,n)=>Float64Array.from({length:e},(r,i)=>t+(n-t)*i/(e-1)),m=c?p(l,d,f):p(l,-r,r),h=p(u,-r,r),g=s===`xy`?[0,n]:[-r,r],_=t.at==null?s===`xy`?n/2:0:t.at,v=Math.min(g[1],Math.max(g[0],_)),y=[`Bx`,`By`,`Bz`],b=y.map(()=>new Float64Array(l*u));for(let t=0;t<u;t++)for(let r=0;r<l;r++){let i=s===`xy`?v:m[r],a=s===`zy`?v:s===`xy`?m[r]:h[t],o=s===`zx`?v:h[t],c=i>=0&&i<=n?en(e,a,o):{bx:0,by:0,bz:0},u=t*l+r;b[0][u]=c.bx,b[1][u]=c.by,b[2][u]=c.bz}let x={},S=[];y.forEach((e,t)=>{let n=b[t],r=1/0,i=-1/0;for(let e of n)e<r&&(r=e),e>i&&(i=e);x[e]={values:n,min:r,max:i},(r!==0||i!==0)&&S.push(e)}),S.length||(S=[y[1]]);let ee=new Float64Array(l*u),te=0;for(let e=0;e<ee.length;e++)ee[e]=Math.hypot(b[0][e],b[1][e],b[2][e]),ee[e]>te&&(te=ee[e]);let C=s===`zx`?[`Bz`,`Bx`]:s===`zy`?[`Bz`,`By`]:[`Bx`,`By`];return{base:i,ext:C.find(e=>S.includes(e))??S[0],family:a===`T`?`b`:`e`,plane:s,fixed:s===`zx`?`y`:s===`zy`?`x`:`z`,at:v,atRange:g,planes:o,length:n,u:m,v:h,components:x,magnitude:S.length>1?{values:ee,max:te,of:S}:null,arrows:C.some(e=>S.includes(e))?C:null,meanings:{Bx:[`Bx`,`Bx`],By:[`By`,`By`],Bz:[`Bz`,`Bz`]},schematic:!0,unit:a}}var cn=e=>JSON.stringify(e);function ln({source:e}){let t=Be(),n=j(e=>e.resolvedTheme===`dark`),[r,i]=(0,M.useState)(`zx`),[a,o]=(0,M.useState)(null),[s,c]=(0,M.useState)(``),[l,d]=(0,M.useState)(!0),[f,p]=(0,M.useState)(!1),[m,h]=(0,M.useState)(null),[g,_]=(0,M.useState)(null),v=cn(e),b=e.kind===`analytic`,x=(0,M.useMemo)(()=>e.kind===`analytic`?sn(e.field,{...e,plane:r,at:a}):null,[v,r,a]);(0,M.useEffect)(()=>{if(b)return;let t=!0,n=window.setTimeout(()=>{let[n,i]=e.kind===`file`?[`files.fieldSlice`,{path:e.path,plane:r,at:a}]:[`lattice.fieldSlice`,{name:e.name,fieldDirs:e.fieldDirs,plane:r,at:a}];E(n,i).then(e=>{t&&(h(on(e)),_(null))}).catch(e=>t&&_(e.message))},120);return()=>{t=!1,window.clearTimeout(n)}},[v,r,a,b]);let S=x??m,te=e=>{i(e),o(null),b||h(null),e===`xy`&&p(!0)},C=s&&(s===`|F|`?S?.magnitude:S?.components[s]?.values)?s:S?.ext,w=(0,M.useMemo)(()=>{if(!S||!C)return null;if(C===`|F|`)return S.magnitude&&{values:S.magnitude.values,max:S.magnitude.max,diverging:!1};let e=S.components[C];return e?.values?{values:e.values,max:Math.max(Math.abs(e.min??0),Math.abs(e.max??0)),diverging:!0}:null},[S,C]),ne=(0,M.useMemo)(()=>{if(!S||!w)return[];let e=S.u.length,t=w.values;return Array.from({length:S.v.length},(n,r)=>ArrayBuffer.isView(t)?t.subarray(r*e,(r+1)*e):t.slice(r*e,(r+1)*e))},[S,w]),re=(0,M.useMemo)(()=>{if(!S||!l||!S.arrows)return null;let e=S.components[S.arrows[0]]?.values,t=S.components[S.arrows[1]]?.values;if(!e||!t)return null;let n=(e,t)=>Math.min(t,Math.max(6,Math.round(e/2))),r=Qt({u:S.u,v:S.v,fu:e,fv:t},{nu:n(S.u.length,24),nv:n(S.v.length,13)});return r.count?r:null},[S,l]);if(g)return(0,N.jsx)(`div`,{className:`danger-text`,children:g});if(!S||!w||!C)return(0,N.jsx)(u,{});let ie=S.plane,[ae,oe]=rn[ie],se=S.unit,ce=[...Object.keys(S.components).filter(e=>S.components[e].values).map(e=>({value:e,label:b?e:`${_e(S.meanings[e]??[``,``])} (.${e})`})),...S.magnitude?[{value:`|F|`,label:t(`magnitude of {list}`,{list:S.magnitude.of.map(e=>b?e:`.${e}`).join(` `)})}]:[]],[T,le]=S.atRange,ue=[{type:`heatmap`,x:S.u,y:S.v,z:ne,colorscale:Wt(n,w.diverging),...w.diverging?{zmid:0,zmin:-w.max,zmax:w.max}:{zmin:0},colorbar:{title:{text:se,side:`right`},thickness:12,outlinewidth:0},hovertemplate:`${ae} = %{x:.4g} m<br>${oe} = %{y:.4g} m<br>%{z:.4g} ${se}<extra></extra>`}];if(re){let e=(e,t)=>({type:`scatter`,mode:`lines`,x:re.x,y:re.y,line:{color:e,width:t,shape:`linear`},hoverinfo:`skip`,showlegend:!1});ue.push(e(Ce(`--editor-bg`),3),e(Ce(`--fg`),1.1))}let de=!re&&l&&ie!==`xy`;return(0,N.jsxs)(`div`,{className:`col`,style:{gap:8,flex:1,minHeight:0},children:[(0,N.jsxs)(`div`,{className:`row wrap`,style:{gap:12,alignItems:`center`},children:[S.planes.length>1&&(0,N.jsx)(y,{value:ie,onChange:te,options:S.planes.map(e=>({value:e,label:rn[e].join(`–`),tip:t(e===`xy`?`Cross-section at a fixed z`:e===`zx`?`Longitudinal cut at a fixed y`:`Longitudinal cut at a fixed x`)}))}),(0,N.jsx)(ee,{value:C,options:ce,onChange:c,style:{minWidth:b?120:180}}),le>T&&(0,N.jsxs)(`label`,{className:`row`,style:{gap:6,alignItems:`center`},children:[(0,N.jsx)(`span`,{className:`muted`,children:`${S.fixed} =`}),(0,N.jsx)(`input`,{type:`range`,min:T,max:le,step:(le-T)/400,value:a??S.at,onChange:e=>o(Number(e.target.value)),style:{width:130}}),(0,N.jsx)(`span`,{className:`mono`,children:`${Ae(S.at,4)} m`})]}),(0,N.jsx)(Le,{checked:l,onChange:d,label:t(`Arrows`),disabled:!S.arrows,tip:S.arrows?t(`In-plane direction of the field, sampled on a coarse grid`):t(`Needs both in-plane components of the map`)}),(0,N.jsx)(Le,{checked:f,onChange:p,label:t(`Equal scales`),tip:t(`True shape and true field direction; a long element becomes a thin strip`)})]}),(0,N.jsx)(Xt,{data:ue,layout:{xaxis:{title:{text:`${ae} (m)`}},yaxis:{title:{text:`${oe} (m)`},...f?{scaleanchor:`x`,constrain:`domain`}:{}},margin:{l:64,r:16,t:16,b:52}},style:{flex:1,minHeight:200}}),S.schematic&&(0,N.jsx)(`div`,{className:`hint`,children:S.length>0&&ie!==`xy`?t(`Schematic from the element's parameters: the matrix model has hard edges, so the field stops dead at both ends instead of falling off.`):t(`Schematic from the element's parameters, not field-map data or an engine result.`)}),de&&(0,N.jsx)(`div`,{className:`hint`,children:t(`No arrows: this field has no component inside the plane. Switch to the x–y cross-section to see its direction.`)}),!f&&re&&(0,N.jsx)(`div`,{className:`hint`,children:t(`Arrows follow the picture: with the axes scaled differently they are stretched like the map. Tick “Equal scales” for the true direction.`)})]})}var un=Re(e=>({source:null,title:``,show:(t,n)=>e({source:t,title:n}),close:()=>e({source:null,title:``})})),dn={width:380,height:300};function fn(){let e=et(),t=Math.min(820,e.width*.62),n=Math.min(620,e.height*.72);return tt({x:Math.max(0,(e.width-t)/2),y:Math.max(40,(e.height-n)/2),width:t,height:n},dn)}function pn(){let e=un(e=>e.source);return e?(0,N.jsx)(mn,{source:e}):null}function mn({source:e}){let t=Be(),n=un(e=>e.title),r=un(e=>e.close);return(0,N.jsx)(rt,{label:t(`Field of {name}`,{name:n}),title:t(`Field of {name}`,{name:n}),initialRect:fn,minSize:dn,onClose:r,children:(0,N.jsxs)(`div`,{className:`field-window-body`,children:[(0,N.jsx)(ln,{source:e},n),e.kind===`map`&&(0,N.jsx)(hn,{name:e.name,fieldDirs:e.fieldDirs})]})})}function hn({name:e,fieldDirs:t}){let n=Be(),[r,i]=(0,M.useState)(!1),[a,o]=(0,M.useState)(null),[s,c]=(0,M.useState)(null),l=JSON.stringify(t);return(0,M.useEffect)(()=>{o(null),c(null)},[e,l]),(0,M.useEffect)(()=>{!r||a||s||E(`lattice.fieldInfo`,{name:e,fieldDirs:t}).then(e=>o(e.components)).catch(e=>c(e.message))},[r,a,s,e,l]),(0,N.jsxs)(`div`,{className:`map-files`,children:[(0,N.jsxs)(`button`,{className:`map-files-toggle`,"aria-expanded":r,onClick:()=>i(!r),children:[(0,N.jsx)(x,{name:r?`chevron-down`:`chevron-right`}),n(`Field-map files of '{name}'`,{name:e})]}),r&&(s?(0,N.jsx)(`div`,{className:`danger-text`,children:s}):a?(0,N.jsxs)(`table`,{className:`mini-table map-files-table selectable`,children:[(0,N.jsx)(`thead`,{children:(0,N.jsxs)(`tr`,{children:[(0,N.jsx)(`th`,{children:n(`Component`)}),(0,N.jsx)(`th`,{children:n(`Grid`)}),(0,N.jsx)(`th`,{children:n(`Transverse range`)}),(0,N.jsx)(`th`,{children:n(`Normalisation`)}),(0,N.jsx)(`th`,{children:n(`Storage`)}),(0,N.jsx)(`th`,{children:n(`File`)})]})}),(0,N.jsx)(`tbody`,{children:a.map(e=>(0,N.jsxs)(`tr`,{children:[(0,N.jsxs)(`td`,{"data-tip":_e(e.meaning),children:[`.`,e.ext]}),e.error?(0,N.jsx)(`td`,{colSpan:4,className:`danger-text`,children:e.error}):(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(`td`,{children:`Nz ${e.nz} · Nx ${e.nx} · Ny ${e.ny}`}),(0,N.jsx)(`td`,{children:`x ${Ae(e.xRange[0])}…${Ae(e.xRange[1])}, y ${Ae(e.yRange[0])}…${Ae(e.yRange[1])} m`}),(0,N.jsx)(`td`,{children:Ae(e.norm)}),(0,N.jsx)(`td`,{children:e.binary?n(`binary (float32)`):n(`text`)})]}),(0,N.jsx)(`td`,{className:`soft ellipsis`,"data-tip":e.path,children:e.path})]},e.ext))})]}):(0,N.jsx)(`div`,{className:`muted`,children:`…`}))]})}function gn(){let e=Be(),t=j(e=>e.version),n=j(e=>e.build),r=n.commit?.slice(0,7)||e(`Unknown commit`),i=`${n.commit||e(`Unknown commit`)}${n.dirty?` (${e(`with local changes`)})`:``}`;return(0,N.jsxs)(`span`,{className:`version-stamp`,"data-tip":i,children:[(0,N.jsxs)(`span`,{children:[`v`,t]}),(0,N.jsxs)(`span`,{className:`soft`,children:[`· `,r,n.dirty?`*`:``]})]})}var _n=Ze(),vn=new Map,yn=Re(e=>({dirty:{},set:(t,n)=>e(e=>e.dirty[t]===n?e:{dirty:{...e.dirty,[t]:n}})}));function bn(e){return vn.set(e.id,e),()=>{vn.get(e.id)===e&&vn.delete(e.id),yn.getState().set(e.id,!1)}}function xn(e,t){yn.getState().set(e,t)}function Sn(){return[...vn.values()].filter(e=>e.isDirty())}function Cn(){return[...vn.values()]}function wn(e){return vn.get(e)}var Tn=new Set;function En(e){return Tn.add(e),()=>Tn.delete(e)}function Dn(e,t){for(let n of Tn)n(e,t)}function On(e){if(!/(?:Z|[+-]\d{2}:\d{2})$/i.test(e))return null;let t=new Date(e);if(!Number.isFinite(t.getTime()))return null;let n=e=>String(e).padStart(2,`0`),r=-t.getTimezoneOffset(),i=Math.floor(Math.abs(r)/60),a=Math.abs(r)%60,o=`UTC${r>=0?`+`:`-`}${i}${a?`:${n(a)}`:``}`;return`${t.getFullYear()}-${n(t.getMonth()+1)}-${n(t.getDate())} ${n(t.getHours())}:${n(t.getMinutes())} (${o})`}async function kn(e){let t=Sn();if(!t.length)return!0;let n=t.map(e=>e.label()).join(`, `),r=await te(T(`Save changes to {names} before {action}?`,{names:n,action:e}),[{key:`save`,label:T(`Save`),variant:`primary`},{key:`discard`,label:T(`Don't save`)},{key:`cancel`,label:T(`Cancel`)}],{title:T(`Unsaved changes`)});return r===null||r===`cancel`?!1:r!==`save`||Ln()}async function An(e){if(j.getState().run.running){await ae(T(`Stop the running simulation first.`),{title:T(`Run`)});return}try{let t=e;if(!t){let e=j.getState().project.lastDir??``;if(t=await Ee({directory:e,title:T(`Open project`)})??void 0,!t)return}if(!await kn(T(`opening another project`)))return;let n=await E(`project.open`,{path:t});ye(n),p(T(`Project opened`))}catch(e){D(e,T(`Open project`))}}async function jn(){if(j.getState().run.running){await ae(T(`Stop the running simulation first.`),{title:T(`Run`)});return}try{let e=j.getState().project.lastDir??``,t=await xe({directory:e,filename:`avas_project`,title:T(`New project`)});if(!t||!await kn(T(`creating a project`)))return;let n=await E(`project.create`,{path:t});ye(n),b(`beam`),A(T(`Project created`),`success`)}catch(e){D(e,T(`New project`))}}async function Mn(){if(await kn(T(`closing the project`)))try{ye(await E(`project.close`)),b(`project`)}catch(e){D(e,T(`Close project`))}}function Nn(){let e=j.getState().project.path;e&&O(e).catch(e=>D(e))}function Pn(){let{project:e}=j.getState(),t=e.path?.toLowerCase(),n=e.recent.filter(e=>e.toLowerCase()!==t).slice(0,8),r=[];if(e.open&&(r.push({type:`header`,label:e.name??``}),r.push({label:T(`Project overview`),icon:`home`,onClick:()=>b(`project`)}),r.push({label:T(`Show in Explorer`),icon:`folder`,onClick:Nn}),r.push({type:`separator`})),n.length){r.push({type:`header`,label:T(`Switch to`)});for(let e of n)r.push({label:je(e),shortcut:Fn(e),icon:`folder`,onClick:()=>An(e)});r.push({type:`separator`})}return r.push({label:T(`Open project...`),shortcut:`Ctrl+O`,icon:`folder-opened`,onClick:()=>An()}),r.push({label:T(`New project...`),shortcut:`Ctrl+N`,icon:`new-folder`,onClick:jn}),e.open&&r.push({label:T(`Close project`),icon:`close`,onClick:Mn}),r}function Fn(e){let t=e.split(/[\\/]/).slice(0,-1).join(`\\`);return t.length>42?`…`+t.slice(-40):t}var In=!1;async function Ln(e=!1){if(!j.getState().project.open||In)return!1;In=!0;try{let t=Sn();for(let e of t)await e.save();return e||p(t.length?T(`Project saved`):T(`Nothing to save`)),await o(),!0}catch(e){return D(e,T(`Save`)),!1}finally{In=!1}}async function Rn(){let e=Cn().flatMap(e=>e.validate?.()??[]);if(e.length)return await ae(e.join(`
`),{title:T(`Cannot run`),kind:`warning`}),{ok:!1,error:e.join(`; `)};if(!await Ln(!0))return{ok:!1,error:`The pages could not be saved.`};try{await E(`run.check`)}catch(e){return await D(e,T(`Project check`)),{ok:!1,error:e?.message??String(e)}}return{ok:!0}}async function zn(){let e=await ke(T(`Name of the record (optional). The results in OutputFile/ are copied to Runs/.`),``,{title:T(`Keep this run`),ok:T(`Keep`)});if(e===null)return null;try{let t=await E(`runs.archive`,{label:e});return A(t.existing?T(`This run is already kept as {label}`,{label:t.label}):T(`Run kept as {label}`,{label:t.label}),`success`),t.folder}catch(e){return D(e,T(`Keep this run`)),null}}async function Bn(){let e=null;try{e=await E(`runs.unsaved`)}catch{return!0}if(!e?.unsaved)return!0;let t=await te(T(`The results of the last run ({started}) are still in OutputFile/ and have not been kept. A new run overwrites them.`,{started:e.started??``}),[{key:`keep`,label:T(`Keep and run`),variant:`primary`},{key:`run`,label:T(`Run without keeping`)},{key:`cancel`,label:T(`Cancel`)}],{title:T(`Previous results`)});return t===null||t===`cancel`?!1:t!==`keep`||await zn()!==null}async function Vn(){let e=j.getState();if(e.project.open&&!e.run.running&&(await Rn()).ok&&await Bn())try{let e=await E(`run.start`);j.setState({run:e}),b(`run`)}catch(e){D(e,T(`Run`))}}async function Hn(){try{await E(`run.stop`)}catch(e){D(e,T(`Stop`))}}async function Un(){if(j.getState().run.running)try{j.setState({run:await E(`run.pause`)})}catch(e){D(e,T(`Pause`))}}async function Wn(){if(j.getState().run.running)try{j.setState({run:await E(`run.resume`)})}catch(e){D(e,T(`Resume`))}}async function Gn(e){if(j.getState().run.running)return await ae(T(`Stop the running simulation first.`),{title:T(`Run`)}),!1;let t=e.kind===`project`?T(`Move the results of the full-lattice run (OutputFile/) to the recycle bin? The run record goes with them.`):e.kind===`archived`?T(`Move the kept run {label} and all its files to the recycle bin?`,{label:e.label}):T(`Move segment run {label} and all its files to the recycle bin?`,{label:e.label});if(!await me(t,{title:T(`Delete`),ok:T(`Move to recycle bin`),danger:!0}))return!1;try{return await E(`runs.delete`,{outputDir:e.outputDir}),A(T(`Moved to the recycle bin`),`success`),!0}catch(e){return D(e),!1}}function Kn(){let{run:e}=j.getState();e.running?e.paused?Wn():Un():Vn()}function qn(){Et.getState().show()}async function Jn(){let{version:e,build:t}=j.getState(),n=t,r=``;try{let e=await E(`app.info`);n=e.build??t,j.setState({build:n}),r=`Python ${e.python} · ${e.platform} · ${e.host===`browser`?T(`Browser`):`WebView2 ${e.webview2??`–`}`}`}catch{}let i=e=>e?On(e)??`${e} (${T(`timezone unknown`)})`:T(`Unknown`),a=[n.frozen?T(`Stand-alone build`):T(`Running from source`),`${T(`Commit`)}: ${n.commit||T(`Unknown commit`)}${n.dirty?` (${T(`with local changes`)})`:``}`,`${T(`Commit time`)}: ${i(n.committed)}`,n.frozen?`${T(`Built`)}: ${i(n.built)}`:``,`${T(`Front end built`)}: ${i(n.frontend)}`,`${T(`Location`)}: ${n.location??``}`,r].filter(Boolean),o=`${`AVAS ${e} · ${n.commit?.slice(0,7)||T(`Unknown commit`)}`}\nAdvanced Virtual Accelerator Software\n\n${a.join(`
`)}`;ae(`${o}\n\n${T(`References`)}\nC. Jin, Z.-J. Wang, X. Qi, Y. He, K. Li, et al., Phys. Rev. Accel. Beams 28, 044602 (2025)\n\n${T(`Feedback`)}\n${T(`Maintainer`)}: Yuchen Lin\n${T(`Feedback email`)}: yuchenlin@stu.xmu.edu.cn`,{title:T(`About AVAS`),action:{label:T(`Copy version information`),onClick:()=>{Te(o).then(()=>A(T(`Version information copied`))).catch(D)}}})}var Yn=!1;async function Xn(){if(!Yn){Yn=!0;try{if(j.getState().run.running&&!await me(T(`A simulation is running. Stop it and quit?`),{title:T(`Quit`),ok:T(`Stop and quit`),danger:!0})||!await kn(T(`quitting`)))return;j.getState().run.running&&await E(`run.stop`),await E(`app.quit`)}finally{Yn=!1}}}function Zn(){le()&&Xn()}De(`app.closeRequested`,()=>Xn());var Qn=null;function $n(){let e=Object.values(yn.getState().dirty).some(Boolean);e!==Qn&&(Qn=e,he()&&E(`app.closeGuard`,{unsaved:e}).catch(()=>void 0))}yn.subscribe($n),he()||window.addEventListener(`beforeunload`,e=>{Qn&&e.preventDefault()});function er(e){let t=e.target;return t?t.isContentEditable||[`INPUT`,`TEXTAREA`,`SELECT`].includes(t.tagName)||!!t.closest(`.monaco-editor`):!1}function tr(){return se()}function nr({data:e}){let t=Be(),n=e.stage===`download`,r=n&&e.total!=null&&e.total>0,a=r?Math.min(1,Math.max(0,(e.downloaded??0)/e.total)):void 0;return(0,N.jsxs)(`div`,{className:`update-progress`,children:[(0,N.jsxs)(`div`,{className:`update-progress-label`,children:[(0,N.jsx)(`span`,{children:t(e.message)}),n&&(0,N.jsxs)(`span`,{className:`update-transfer`,children:[r&&(0,N.jsxs)(`strong`,{children:[Math.floor(a*100),`%`]}),(0,N.jsxs)(`span`,{children:[k(e.downloaded??0),` / `,r?k(e.total):t(`Unknown size`)]}),(0,N.jsxs)(`span`,{children:[t(`Average download speed`),`: `,k(e.speed??0),`/s`]})]})]}),(0,N.jsx)(`div`,{role:`progressbar`,"aria-label":t(e.message),"aria-valuemin":0,"aria-valuemax":100,"aria-valuenow":r?Math.floor(a*100):void 0,children:(0,N.jsx)(i,{value:a,indeterminate:!r})})]})}function rr(e,t){return e===`installing`?3:e===`ready`?2:e===`preparing`?t===`download`||t===`retry`||t===`fetch`?0:t===`verify`?1:t===`extract`||t===`preflight`||t===`ready`?2:-1:-1}function ir({info:e,status:t,progress:n,message:r,busy:i,reviewing:a,outcome:o,cancelling:c,onClose:l,onChoose:u,onCancel:d,onReview:f,onInstall:p}){let m=Be(),h=!a&&(i||t.phase!==`idle`),g=rr(t.phase===`idle`&&h?`preparing`:t.phase,n?.stage),_=h&&n?.stage===`download`&&n.total!=null&&n.total>0?Math.floor(Math.min(100,Math.max(0,(n.downloaded??0)/n.total*100))):null,v=[m(`Download`),m(`Verify`),m(`Prepare`),m(`Install`),m(`Restart`)],y=c?m(`Cancelling update...`):o===`cancelled`?m(`Update cancelled`):o===`failed`?m(`The update needs attention`):t.phase===`installing`?m(`Restarting to install the update...`):t.phase===`ready`?m(`The confirmed update is ready to install.`):h?m(`Preparing your update`):e?.available?m(`A new version is available`):m(`AVAS update`);return(0,N.jsxs)(rt,{label:m(`AVAS update`),title:(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(`span`,{className:`update-brand`,children:`AVAS`}),` / `,m(`Software update`)]}),className:`update-window${t.phase===`installing`?` update-handoff`:``}`,onClose:l,minSize:{width:340,height:380},initialRect:()=>{let e=et();return tt({x:(e.width-680)/2,y:(e.height-610)/2,width:680,height:610},{width:340,height:380})},children:[(0,N.jsxs)(`div`,{className:`update-body`,children:[(0,N.jsx)(`div`,{className:`update-identity`,children:(0,N.jsx)(`span`,{children:m(`Advanced Virtual Accelerator Software`)})}),(0,N.jsxs)(`div`,{className:`update-hero`,children:[(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`h2`,{"aria-live":`polite`,children:y}),(0,N.jsx)(`p`,{children:m(o===`cancelled`?`Update cancelled. Downloaded data is kept for the next attempt.`:o===`failed`?`Your download cache is kept. Review the error before trying again.`:`The complete package is verified before installation.`)})]}),_!=null&&(0,N.jsxs)(`div`,{className:`update-percent`,"aria-label":m(`Download progress`),children:[_,(0,N.jsx)(`span`,{children:`%`})]})]}),e&&(0,N.jsxs)(`div`,{className:`update-versions`,children:[(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`small`,{children:m(`Current version`)}),(0,N.jsxs)(`span`,{children:[e.current.version,` · `,e.current.commit.slice(0,8)||`—`]})]}),(0,N.jsx)(x,{name:`arrow-right`}),(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`small`,{children:m(`Available version`)}),(0,N.jsxs)(`span`,{children:[e.release.version,` · `,e.release.commit.slice(0,8)]})]})]}),e?.canInstall!==!1&&(0,N.jsx)(`ol`,{className:`update-steps`,"aria-label":m(`Update stages`),children:v.map((e,t)=>(0,N.jsxs)(`li`,{className:h&&t===g?`active`:h&&t<g?`done`:``,"aria-current":h&&t===g?`step`:void 0,children:[(0,N.jsx)(`span`,{className:`update-node`,children:h&&t<g?(0,N.jsx)(x,{name:`check`}):t+1}),(0,N.jsx)(`span`,{children:e})]},e))}),h&&n&&(0,N.jsx)(nr,{data:n}),h&&!n&&(0,N.jsx)(nr,{data:{stage:`prepare`,message:r||`Preparing the confirmed update...`}}),e&&(0,N.jsxs)(`section`,{className:`update-notes`,children:[(0,N.jsxs)(`div`,{className:`update-notes-heading`,children:[(0,N.jsx)(`h3`,{children:m(`What's new`)}),(0,N.jsx)(`span`,{children:e.release.published?On(e.release.published)??`${e.release.published} (${m(`timezone unknown`)})`:m(`Unknown`)})]}),(0,N.jsx)(`div`,{className:`update-release-notes`,children:e.release.notes})]}),(0,N.jsxs)(`div`,{className:`update-assurance`,children:[(0,N.jsx)(x,{name:`shield`}),(0,N.jsx)(`span`,{children:e?.canInstall===!1?m(`Update the server installation locally, then restart avas serve.`):m(`AVAS will close while the update is installed, then restart automatically. Please do not open it manually. The update window will stay visible.`)})]}),a&&(0,N.jsx)(`p`,{className:`update-ignore-note`,children:m(`Even if you ignore this version, you can still get it from Help → Check for updates.`)})]}),(0,N.jsxs)(`footer`,{className:`update-footer`,children:[(0,N.jsx)(`span`,{children:t.phase===`installing`?m(`Installation has started and cannot be cancelled.`):m(h?`Closing this panel keeps the update running.`:`Review the release before updating.`)}),(0,N.jsx)(`div`,{children:a?(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(s,{variant:`ghost`,onClick:()=>u(`ignore`),children:m(`Ignore this version`)}),(0,N.jsx)(s,{onClick:()=>u(`later`),children:m(`Later`)}),(0,N.jsx)(s,{variant:`primary`,onClick:()=>u(e?.canInstall?`install`:`download`),children:e?.canInstall?m(`Update and restart`):m(`Open downloads`)})]}):t.phase===`preparing`?(0,N.jsx)(s,{disabled:c,onClick:d,children:m(c?`Cancelling update...`:`Cancel update`)}):!i&&t.phase===`ready`?(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(s,{onClick:d,children:m(`Cancel update`)}),(0,N.jsx)(s,{variant:`primary`,onClick:p,children:m(`Update and restart`)})]}):!i&&t.phase===`idle`?(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(s,{onClick:l,children:m(`Return to workspace`)}),(0,N.jsx)(s,{variant:`primary`,onClick:f,children:m(o?`Try update again`:`Review update`)})]}):null})]})]})}var F=Re(()=>({info:null,open:!1,reviewing:!1,outcome:``,busy:!1,cancelRequested:!1,message:``,progress:null,hidden:``,status:{phase:`idle`,commit:``}})),ar=null,or=!1;async function sr(){let e=F.getState().status;or=!0,(0,_n.flushSync)(()=>F.setState({open:!0,progress:null,message:`Restarting to install the update...`,status:{...e,phase:`installing`,progress:null}}));try{await fe()}catch(t){throw F.setState({status:e}),t}finally{or=!1}}function cr(e){let t=ar;ar=null,F.setState({reviewing:!1}),t?.(e)}function lr(){or||(F.getState().reviewing&&cr(`later`),F.setState({open:!1}))}De(`updates.progress`,e=>{or||F.setState({message:e.message,progress:e})});async function ur(){if(F.setState({open:!0}),F.getState().busy)return;let e=await E(`updates.status`).catch(()=>null);if(e&&e.phase!==`idle`){F.setState({status:e});return}await pr()}async function dr(){F.setState({busy:!0,open:!0,outcome:``});try{if(!await kn(T(`updating AVAS`)))return;await sr()}catch(e){D(e,T(`AVAS update`))}finally{F.setState({busy:!1})}}async function fr(){F.setState({cancelRequested:!0});try{await E(`updates.cancel`);let e=await E(`updates.status`);F.setState({status:e,...e.phase===`idle`?{outcome:`cancelled`,progress:null}:{}})}catch(e){F.setState({cancelRequested:!1}),D(e,T(`AVAS update`))}}async function pr(){if(F.getState().busy)return;F.setState({busy:!0,open:!0,outcome:``,cancelRequested:!1,message:`Checking for updates...`,progress:null});let e=!1;try{let t=await E(`updates.check`,{force:!0});for(F.setState({info:t});t.available;){F.setState({message:``});let n=t.release,r=await new Promise(e=>{ar=e,F.setState({reviewing:!0,open:!0})});if(r===`ignore`){await E(`updates.ignore`,{commit:n.commit}),F.setState({info:{...t,ignored:!0},open:!1});return}if(r===`download`){Ne(`https://github.com/lycself/AVAS/releases/tag/avas-${n.commit}`);return}if(r!==`install`){F.setState({hidden:n.commit,open:!1});return}F.setState({message:`Preparing the confirmed update...`,progress:null});let i=await E(`updates.prepare`,{commit:n.commit});if(i.cancelled||F.getState().cancelRequested){F.setState({outcome:`cancelled`}),A(T(`Update cancelled. Downloaded data is kept for the next attempt.`));return}if(i.changed&&i.info){t=i.info,F.setState({info:t}),await ae(T(`A newer version is available. Review it before confirming.`),{title:T(`AVAS update`)});continue}if(e=!0,!await kn(T(`updating AVAS`))||F.getState().cancelRequested)return;F.setState({message:`Restarting to install the update...`,progress:null}),await sr(),e=!1;return}await ae(T(`This installation is already up to date.`),{title:T(`AVAS update`)})}catch(e){F.setState({outcome:`failed`}),D(e,T(`AVAS update`))}finally{e&&await E(`updates.cancel`).catch(()=>void 0);let t=await E(`updates.status`).catch(()=>({phase:`idle`,commit:``}));F.setState({busy:!1,message:``,progress:null,status:t})}}function mr(){let e=Be(),{info:t,open:n,reviewing:r,outcome:i,busy:a,cancelRequested:o,message:c,progress:l,hidden:d,status:f}=F();(0,M.useEffect)(()=>{let t=!1,n=async()=>{if(!F.getState().busy)try{let e=await E(`updates.check`);t||F.setState({info:e})}catch{}},r=window.setTimeout(n,3e3),i=window.setInterval(n,216e5),a=async()=>{try{let e=await E(`updates.status`);!t&&!or&&F.setState({status:e,...F.getState().status.cancelling&&e.phase===`idle`?{outcome:`cancelled`}:{},...e.phase===`preparing`&&e.progress?{progress:e.progress,message:e.progress.message}:{}})}catch{}};a();let o=window.setInterval(a,3e3);return E(`updates.result`).then(t=>{t&&(t.ok?A(e(`AVAS was updated successfully.`),`success`):ae(`${e(`The update failed. See the error details below.`)}\n${e(t.error??``)}\n`+(t.logAvailable?t.log:e(`The update log is unavailable. You can copy the error details from this dialog.`)),{title:e(`AVAS update`),kind:`error`,detail:t.details}))}).catch(()=>void 0),()=>{t=!0,clearTimeout(r),clearInterval(i),clearInterval(o)}},[]);let p=n&&(0,N.jsx)(ir,{info:a||f.phase===`idle`||t?.release.commit===f.commit?t:null,status:f,progress:l??f.progress??null,message:c,busy:a,reviewing:r,outcome:i,cancelling:!!f.cancelling||o&&f.phase===`preparing`,onClose:lr,onChoose:cr,onCancel:fr,onReview:pr,onInstall:dr});return n?p:!a&&f.phase!==`idle`?(0,N.jsxs)(`div`,{className:`update-notice`,role:`status`,children:[f.phase===`preparing`?(0,N.jsx)(nr,{data:f.progress??{message:`Preparing the confirmed update...`,stage:`prepare`}}):(0,N.jsxs)(`span`,{children:[f.phase===`ready`?e(`The confirmed update is ready to install.`):e(`Restarting to install the update...`),` `,f.commit.slice(0,8)]}),f.phase===`ready`&&(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(s,{onClick:dr,children:e(`Update and restart`)}),(0,N.jsx)(s,{onClick:fr,children:e(`Cancel`)})]}),f.phase===`preparing`&&(0,N.jsx)(s,{disabled:f.cancelling||o,onClick:fr,children:f.cancelling||o?e(`Cancelling update...`):e(`Cancel update`)}),(0,N.jsx)(s,{onClick:()=>F.setState({open:!0}),children:e(`Review update`)})]}):a&&!c||!a&&(!t?.available||t.ignored||d===t.release.commit)?null:(0,N.jsxs)(`div`,{className:`update-notice`,role:`status`,children:[a?l?(0,N.jsx)(nr,{data:l}):(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(u,{size:14}),(0,N.jsx)(`span`,{children:e(c)})]}):(0,N.jsxs)(N.Fragment,{children:[(0,N.jsxs)(`span`,{children:[e(`An AVAS update is available.`),` `,t.release.commit.slice(0,8)]}),(0,N.jsx)(s,{onClick:pr,children:e(`Review update`)}),(0,N.jsx)(s,{onClick:()=>F.setState({hidden:t.release.commit}),children:e(`Later`)})]}),a&&f.phase===`preparing`&&(0,N.jsx)(s,{disabled:f.cancelling||o,onClick:fr,children:f.cancelling||o?e(`Cancelling update...`):e(`Cancel update`)}),a&&(0,N.jsx)(s,{onClick:()=>F.setState({open:!0}),children:e(`Review update`)})]})}function hr({error:e,onRetry:t}){let n=Be();return(0,N.jsxs)(`div`,{className:`empty-state`,role:`alert`,children:[(0,N.jsx)(`div`,{className:`danger-text`,style:{fontSize:15},children:n(`This view hit an internal error.`)}),(0,N.jsx)(`pre`,{className:`selectable`,style:{maxWidth:800,whiteSpace:`pre-wrap`,color:`var(--fg-muted)`},children:String(e?.message??e)}),(0,N.jsx)(s,{onClick:t,children:n(`Try again`)})]})}var gr=class extends M.Component{state={error:null};static getDerivedStateFromError(e){return{error:e}}componentDidCatch(e){console.error(this.props.name,e)}render(){let{error:e}=this.state;return e?(0,N.jsx)(hr,{error:e,onRetry:()=>this.setState({error:null})}):this.props.children}},_r=[{id:`newProject`,keys:`Ctrl+N`,label:`New project...`},{id:`openProject`,keys:`Ctrl+O`,label:`Open project...`},{id:`save`,keys:`Ctrl+S`,label:`Save all pages`},{id:`quit`,keys:`Ctrl+Q`,label:`Exit`,scope:`desktop window`},{id:`runPauseResume`,keys:`F5`,label:`Run / pause / resume the simulation`},{id:`stop`,keys:`Shift+F5`,label:`Stop the simulation`},{id:`pages`,keys:`Ctrl+1 … Ctrl+8`,label:`Switch to a page (in sidebar order)`},{id:`sidebar`,keys:`Ctrl+B`,label:`Collapse or expand the sidebar`},{id:`sidebarHide`,keys:`Ctrl+Shift+B`,label:`Hide or show the sidebar`},{id:`log`,keys:`Ctrl+J`,label:`Show or hide the log panel`},{id:`assistant`,keys:`Ctrl+Shift+A`,label:`Show or hide the AI assistant`},{id:`zoomIn`,keys:`Ctrl+=`,label:`Zoom in`},{id:`zoomOut`,keys:`Ctrl+-`,label:`Zoom out`},{id:`zoomReset`,keys:`Ctrl+0`,label:`Reset zoom`},{id:`undo`,keys:`Ctrl+Z`,label:`Undo`,scope:`Beam and Simulation settings pages, outside a text box`},{id:`redo`,keys:`Ctrl+Y`,label:`Redo`,scope:`Beam and Simulation settings pages, outside a text box`}],vr=Object.fromEntries(_r.map(e=>[e.id,e]));function yr(e,t){let n=t.split(`+`),r=n.pop()??``,i=n.includes(`Ctrl`),a=n.includes(`Shift`),o=n.includes(`Alt`);return(e.ctrlKey||e.metaKey)!==i||e.altKey!==o?!1:r===`=`?e.key===`=`||e.key===`+`:e.shiftKey===a?r.length===1?e.key.toLowerCase()===r.toLowerCase():e.key===r:!1}var br=5e3,xr=Re(()=>({entries:[],errors:0,warnings:0,seq:0,filter:`all`,query:``}));function Sr(e,t){c(!0);let n={};e&&(n.filter=e),t!==void 0&&(n.query=t),xr.setState(n)}function Cr(e){xr.setState(t=>{let n=t.errors,r=t.warnings;for(let t of e)t.level===`ERROR`||t.level===`CRITICAL`?n++:t.level===`WARNING`&&r++;let i=t.entries.concat(e);return{entries:i.length>br?i.slice(i.length-br):i,errors:n,warnings:r,seq:t.seq+e.length}});let t=e[e.length-1];if(t&&t.name!==`avas.engine`){let e=t.msg.split(`
`).find(e=>e.trim())??``,n=t.level===`ERROR`||t.level===`CRITICAL`?`error`:t.level===`WARNING`?`warning`:`info`;j.getState().run.running||p(e,n)}}var wr=[],Tr=!1;function Er(){E(`app.logHistory`).then(e=>e.length&&Cr(e)).catch(()=>void 0),De(`log`,e=>{wr.push(e),Tr||(Tr=!0,requestAnimationFrame(()=>{Tr=!1;let e=wr;wr=[],Cr(e)}))})}function Dr(){xr.setState({entries:[],errors:0,warnings:0,seq:0}),p(``),E(`app.clearLog`).catch(()=>void 0)}function Or(e){return new Date(e*1e3).toTimeString().slice(0,8)}function kr(){let e=Be(),t=xr(e=>e.entries),n=j(e=>e.logMaximized),r=xr(e=>e.filter),i=xr(e=>e.query),a=e=>xr.setState({filter:e}),o=e=>xr.setState({query:e}),s=(0,M.useRef)(null),u=(0,M.useRef)(!0),d=(0,M.useMemo)(()=>{let e=i.trim().toLowerCase();return t.filter(t=>!(r===`problems`&&t.level!==`WARNING`&&t.level!==`ERROR`&&t.level!==`CRITICAL`||r===`gui`&&t.name===`avas.engine`||e&&!t.msg.toLowerCase().includes(e)))},[t,r,i]),[f,p]=(0,M.useState)(600),m=d.length>f?d.slice(d.length-f):d;(0,M.useLayoutEffect)(()=>{let e=s.current;e&&u.current&&(e.scrollTop=e.scrollHeight)},[m]),(0,M.useEffect)(()=>{let e=s.current;if(!e)return;let t=()=>{u.current=e.scrollHeight-e.scrollTop-e.clientHeight<24,e.scrollTop<40&&f<d.length&&p(e=>e+600)};return e.addEventListener(`scroll`,t),()=>e.removeEventListener(`scroll`,t)},[f,d.length]);let h=()=>{let e=d.map(e=>`${Or(e.t)} ${e.level.padEnd(7)} ${e.msg}`).join(`
`);navigator.clipboard?.writeText(e).catch(()=>void 0)};return(0,N.jsxs)(`div`,{className:`log-panel`,children:[(0,N.jsxs)(`div`,{className:`panel-header`,children:[(0,N.jsx)(`div`,{className:`panel-tab active`,children:e(`Log`).toUpperCase()}),(0,N.jsxs)(`div`,{className:`panel-filters`,children:[[`all`,`problems`,`gui`].map(t=>(0,N.jsx)(`button`,{className:w(`chip`,r===t&&`active`),onClick:()=>a(t),children:e(t===`all`?`All`:t===`problems`?`Warnings and errors`:`Application logs only`)},t)),(0,N.jsxs)(`div`,{className:`panel-search`,children:[(0,N.jsx)(x,{name:`filter`}),(0,N.jsx)(`input`,{value:i,onChange:e=>o(e.target.value),placeholder:e(`Filter`),spellCheck:!1})]})]}),(0,N.jsx)(`div`,{className:`grow`}),(0,N.jsx)(be,{icon:`copy`,tip:e(`Copy log`),onClick:h}),(0,N.jsx)(be,{icon:`clear-all`,tip:e(`Clear log`),onClick:Dr}),(0,N.jsx)(be,{icon:n?`chevron-down`:`chevron-up`,tip:e(n?`Restore panel size`:`Maximize panel`),onClick:()=>l(!n)}),(0,N.jsx)(be,{icon:`close`,tip:e(`Hide panel (Ctrl+J)`),onClick:()=>c(!1)})]}),(0,N.jsxs)(`div`,{className:`log-body selectable mono`,ref:s,onContextMenu:t=>{t.preventDefault();let n=window.getSelection()?.toString()??``;Me([{label:e(`Copy`),icon:`copy`,disabled:!n,onClick:()=>navigator.clipboard?.writeText(n)},{label:e(`Copy log`),onClick:h},{type:`separator`},{label:e(`Clear log`),icon:`clear-all`,onClick:Dr}],t.clientX,t.clientY)},children:[m.map((e,t)=>(0,N.jsxs)(`div`,{className:w(`log-line`,`log-${e.level.toLowerCase()}`,e.name===`avas.engine`&&`log-engine`),children:[(0,N.jsx)(`span`,{className:`log-time`,children:Or(e.t)}),(0,N.jsx)(`span`,{className:`log-msg`,children:e.msg})]},d.length-m.length+t)),!d.length&&(0,N.jsx)(`div`,{className:`log-empty`,children:t.length?e(`No matching lines`):e(`No messages yet`)})]})]})}var Ar=Re(()=>({mode:(()=>{try{return localStorage.getItem(`avas.latticeMode`)===`visual`?`visual`:`text`}catch{return`text`}})(),pendingSelect:null,visualEditing:!1}));function jr(e){Ar.getState().visualEditing!==e&&Ar.setState({visualEditing:e})}function Mr(e){Ar.setState({mode:e});try{localStorage.setItem(`avas.latticeMode`,e)}catch{}}var Nr=0;function Pr(e){Ar.setState({pendingSelect:{line:e,seq:++Nr}})}var Fr=null;function Ir(e){return Fr=e,()=>{Fr===e&&(Fr=null)}}function Lr(){let e=Fr?.selection();return e?`line ${e.line+1}: ${e.keyword}${e.name?` (${e.name})`:``}`:null}var Rr={"lattice.getText":()=>!Fr||Fr.getText()==null?null:{name:Fr.name(),text:Fr.getText(),dirty:Fr.isDirty()},"lattice.apply":async({name:e,text:t})=>!Fr||Fr.name()!==e||Fr.getText()==null?{applied:!1}:(Fr.replaceText(t),await Fr.save(),{applied:!0,saved:!0}),"pages.reload":async({paths:e,pages:t})=>{for(let t of e??[])Dn(t,`assistant`);for(let e of t??[]){if(!e)continue;let t=wn(e);t?.reload&&!t.isDirty()&&await t.reload()}return!0},"pages.dirty":()=>Object.entries(yn.getState().dirty).filter(([,e])=>e).map(([e])=>e),"ui.state":()=>({page:j.getState().page,selection:Lr(),dirty:Object.entries(yn.getState().dirty).filter(([,e])=>e).map(([e])=>e)}),"ui.select":({line:e})=>(b(`lattice`),Pr(e),!0),"run.start":async()=>(await Vn(),j.getState().run.running?{started:!0}:{started:!1,error:`The simulation was not started (see the message in the window).`}),"run.prepare":async()=>j.getState().run.running?{ok:!1,error:`A simulation is already running.`}:Rn(),"ui.page":({page:e})=>(b(e),!0)};function zr(){De(`assistant.front`,async e=>{let t=Rr[e.method];try{if(!t)throw Error(`Unknown page request ${e.method}`);let n=await t(e.params??{});await E(`assistant.frontReply`,{id:e.id,ok:!0,result:n??null})}catch(t){await E(`assistant.frontReply`,{id:e.id,ok:!1,error:t?.message??String(t)}).catch(()=>void 0)}})}var Br=Re(()=>({open:!1,width:420,config:null,conversations:[],current:null,loading:!1})),Vr=Br.setState,Hr=Br.getState;function Ur(){let e=j.getState().settings;Vr({open:!!e[`ui/assistantOpen`],width:Math.max(320,Math.min(900,Number(e[`ui/assistantWidth`])||420))}),Hr().open&&qr().catch(()=>void 0),De(`assistant.event`,e=>ai(e));let t=j.getState().project.path??null;j.subscribe(e=>{let n=e.project.open?e.project.path??null:null;if(n===t)return;t=n;let r=Hr().current;r&&!r.busy&&Vr({current:null}),Kr=!1,Hr().open&&qr().catch(()=>void 0)})}function Wr(e){Vr({open:e}),ne({"ui/assistantOpen":e}),e&&qr().catch(e=>D(e))}function Gr(e){Vr({width:e}),ne({"ui/assistantWidth":e})}var Kr=!1;async function qr(){if((!Hr().config||!Kr)&&await Jr(),!Kr){Kr=!0,await Yr();let e=Hr().conversations;!Hr().current&&e.length&&await Xr(e[0].id)}}async function Jr(){let e=await E(`assistant.config`);return Vr({config:e}),e}async function Yr(){let e=await E(`assistant.conversations`);return Vr({conversations:e}),e}async function Xr(e){Vr({loading:!0});try{let t=await E(`assistant.load`,{id:e});Vr({current:{id:t.id,title:t.title,items:t.items??[],busy:!!t.busy,autoApply:!!t.autoApply}})}finally{Vr({loading:!1})}}async function Zr(){let e=await E(`assistant.new`);return Vr({current:{id:e.id,title:``,items:[],busy:!1,autoApply:!!e.autoApply}}),e.id}async function Qr(e){Vr({conversations:await E(`assistant.delete`,{id:e})}),Hr().current?.id===e&&Vr({current:null})}function $r(){let e=j.getState(),t=Object.entries(yn.getState().dirty).filter(([,e])=>e).map(([e])=>e);return{page:e.page,selection:Lr(),dirty:t}}async function ei(e){let t=Hr().current;if(t||=(await Zr(),Hr().current),t)try{Vr({current:{...t,busy:!0}}),await E(`assistant.send`,{conversation:t.id,text:e,ui:$r()}),Yr().catch(()=>void 0)}catch(e){Vr({current:{...Hr().current,busy:!1}}),D(e)}}async function ti(){let e=Hr().current;e&&await E(`assistant.stop`,{conversation:e.id}).catch(D)}async function ni(e,t,n){let r=Hr().current;r&&await E(`assistant.decide`,{conversation:r.id,id:e,decision:t,choice:n}).catch(D)}async function ri(e){let t=Hr().current;t&&await E(`assistant.undo`,{conversation:t.id,id:e}).catch(D)}async function ii(e){Hr().current||await Zr();let t=Hr().current,n=await E(`assistant.setAutoApply`,{id:t.id,value:e});Vr({current:{...Hr().current,autoApply:n.autoApply}})}function ai(e){let t=Hr().current;if(!t||e.conversation!==t.id){e.type===`busy`&&Yr().catch(()=>void 0);return}if(e.type===`item`){let n=t.items.slice(),r=n.findIndex(t=>t.id===e.item.id);r>=0?n[r]=e.item:n.push(e.item),Vr({current:{...t,items:n}})}else if(e.type===`delta`){let n=t.items.slice(),r=n.findIndex(t=>t.id===e.itemId);if(r<0)return;let i={...n[r]};i[e.field]=(i[e.field]??``)+e.delta,n[r]=i,Vr({current:{...t,items:n}})}else e.type===`busy`&&(Vr({current:{...t,busy:!!e.busy}}),e.busy||Yr().catch(()=>void 0))}function oi(e){let t=j(e=>e.project.open?e.project.path:null),n=j(e=>e.lastFinished),r=j(e=>e.run.running&&e.run.source===`project`),[i,a]=(0,M.useState)(null),[o,s]=(0,M.useState)(null);return(0,M.useEffect)(()=>{if(!e||!t){a(null);return}if(r)return;let n=!0;return E(`lattice.runEnvelope`).then(e=>{n&&(a(e),s(null))}).catch(e=>n&&s(e?.message??String(e))),()=>{n=!1}},[e,t,n,r]),{data:i,error:o}}async function si(){return(await E(`results.sources`)).filter(e=>e.kind===`segment`).map(e=>({outputDir:e.outputDir,label:e.label,zStart:e.zStart??null,zEnd:e.zEnd??null,time:e.time,status:e.status}))}function ci(e){let[t,n]=(0,M.useState)(null),r=e?`${e.outputDir}|${e.zStart}`:``;return(0,M.useEffect)(()=>{if(!e){n(null);return}let t=!0;return E(`lattice.segmentEnvelope`,{outputDir:e.outputDir}).then(r=>{if(!t)return;if(!r)return n(null);let i=e.zStart??0;n({...r,z:Array.from(r.z,e=>e+i),losses:r.losses.map(e=>({z:e.z+i,n:e.n})),label:e.label})}).catch(()=>t&&n(null)),()=>{t=!1}},[r]),t}async function li(e){if(!window.crypto?.subtle)return null;let t=e.replace(/^﻿/,``).replace(/\r\n?/g,`
`).replace(/\n+$/,``),n=await window.crypto.subtle.digest(`SHA-1`,new TextEncoder().encode(t));return Array.from(new Uint8Array(n),e=>e.toString(16).padStart(2,`0`)).join(``)}function ui(e){let[t,n]=(0,M.useState)(null),[r,i]=(0,M.useState)(null),[a,o]=(0,M.useState)(!1),s=(0,M.useRef)(!1),c=(0,M.useRef)(null),l=(0,M.useRef)(null),u=(0,M.useRef)(e);u.current=e;let d=(0,M.useRef)(!0);(0,M.useEffect)(()=>(d.current=!0,()=>{d.current=!1}),[]);let f=(0,M.useCallback)(()=>{if(s.current||c.current===null)return;let e=c.current;c.current=null,s.current=!0,o(!0);let{fieldDirs:t,spaceCharge:r}=u.current;E(`lattice.preview`,{text:e,fieldDirs:t,spaceCharge:r}).then(e=>{d.current&&(n(e),i(null))}).catch(e=>d.current&&i(e?.message??String(e))).finally(()=>{s.current=!1,d.current&&(c.current===null?o(!1):f())})},[]),p=(0,M.useCallback)((e,t=!1)=>{u.current.enabled&&(t||e!==l.current)&&(l.current=e,c.current=e,f())},[f]);(0,M.useEffect)(()=>{e.enabled||(n(null),i(null),l.current=null)},[e.enabled]);let m=JSON.stringify([e.fieldDirs,e.spaceCharge]);return(0,M.useEffect)(()=>{e.enabled&&l.current!==null&&p(l.current,!0)},[m]),{data:t,error:r,busy:a,request:p}}function di(e,t,n){let r=e.split(/\r?\n/);return t>=0&&t<r.length&&(r[t]=n),r.join(`
`)}function fi(e,t,n){let r=e.length;if(!r||n<e[0]||n>e[r-1])return NaN;let i=0,a=r-1;for(;a-i>1;){let t=i+a>>1;e[t]<=n?i=t:a=t}let o=e[a]-e[i];return o<=0?t[i]:t[i]+(t[a]-t[i])*(n-e[i])/o}var pi=window.matchMedia(`(prefers-reduced-motion: reduce)`);function mi(e){return e===`full`||e===`lite`||e===`off`?e:e===`auto`&&pi.matches?`off`:`full`}function hi(){return mi(j.getState().settings[`ui/motion`])}function gi(){let e=j(e=>e.settings[`ui/motion`]),[,t]=(0,M.useState)(0);return(0,M.useEffect)(()=>{let e=()=>t(e=>e+1);return pi.addEventListener(`change`,e),()=>pi.removeEventListener(`change`,e)},[]),mi(e)}var _i=[.25,.5,1,2,4,8],vi=10,yi=1500,bi=33,xi=299792458,Si=Re(()=>({replay:null}));function Ci(e,t){let n=e.z.length;if(!t||!(t>0)||n<2)return null;let r=new Float64Array(n);for(let i=1;i<n;i++){let n=1+(e.energy[i]+e.energy[i-1])/2/t,a=n>1?Math.sqrt(1-1/(n*n)):NaN,o=e.z[i]-e.z[i-1];r[i]=r[i-1]+(Number.isFinite(a)&&a>0&&o>0?o/(a*xi):0)}let i=r[n-1];if(!(i>0))return null;for(let e=0;e<n;e++)r[e]/=i;return r}function wi(e,t,n,r={}){let i=Si.getState().replay,a=Ci(n,r.restMass);Si.setState({replay:{id:e,label:t,track:n,kind:r.kind??`project`,playing:!0,progress:i?.id===e&&i.progress<1?i.progress:0,speed:i?.speed??1,timeMode:i?.timeMode===`beta`&&a?`beta`:`z`,tau:a}}),ji(),zi()}function Ti(){Si.setState({replay:null}),ji(),zi()}function Ei(e){let t=Si.getState().replay;if(!t)return;let n={...t,...e};e.timeMode===`beta`&&!t.tau&&(n.timeMode=`z`),e.playing&&t.progress>=1&&e.progress===void 0&&(n.progress=0),e.progress!==void 0&&(n.progress=Math.max(0,Math.min(1,e.progress)),ji()),Si.setState({replay:n}),zi()}function Di(e){let t=e.track.z,n=t.length;if(!n)return NaN;let r=e.progress;if(e.timeMode===`beta`&&e.tau){let i=e.tau,a=0,o=n-1;for(;o-a>1;){let e=a+o>>1;i[e]<=r?a=e:o=e}let s=i[o]-i[a];return s>0?t[a]+(t[o]-t[a])*(r-i[a])/s:t[a]}return t[0]+r*(t[n-1]-t[0])}var Oi={episode:``,z:NaN,hist:[]};function ki(){let e=ie.getState().episode;if(!e)return NaN;let t=f(e.rows.z),n=j.getState().run;return n.running&&n.pos_m!=null&&Number.isFinite(n.pos_m)&&(t=Number.isFinite(t)?Math.max(t,n.pos_m+e.zOffset):n.pos_m+e.zOffset),t}function Ai(e,t,n){let r=ie.getState().episode;if(!r)return!1;let i=ki();if(r.id!==Oi.episode&&(Oi.episode=r.id,Oi.hist=[],Oi.z=r.rows.z.length?r.rows.z[0]:r.zOffset,ji()),!Number.isFinite(i))return!1;let a=Oi.hist;for((!a.length||i>a[a.length-1][1]+1e-12)&&a.push([t,i]);a.length>2&&t-a[0][0]>2e4;)a.shift();let o=a.length>=2&&a[a.length-1][0]>a[0][0]?(a[a.length-1][1]-a[0][1])/((a[a.length-1][0]-a[0][0])/1e3):0;if(!Number.isFinite(Oi.z)||n===`off`)return Oi.z=i,!1;j.getState().run.paused||(Oi.z+=o*e);let s=i-Oi.z;return s<=0?Oi.z=i:s>Math.max(o*2.5,1e-9)&&(Oi.z+=s*(1-Math.exp(-e/.7))),i-Oi.z>1e-6}var I={key:``,next:0,passed:[]};function ji(){I.key=``}function Mi(e,t,n,r){if(I.key!==e)for(I.key=e,I.passed=[],I.next=0;I.next<t.length&&t[I.next].z<=n;)I.next++;for(;I.next<t.length&&t[I.next].z<=n;)I.passed.push({...t[I.next],at:r}),I.next++;return I.passed=I.passed.filter(e=>r-e.at<yi),I.passed.map(e=>({z:e.z,n:e.n,age:r-e.at}))}function Ni(e){let t=Si.getState().replay;if(t){let n=t.track,r=Di(t),i=n.z.length;return{source:`replay`,kind:t.kind,z:r,rmsX:fi(n.z,n.rmsX,r),rmsY:fi(n.z,n.rmsY,r),rmsZ:n.rmsZ?fi(n.z,n.rmsZ,r):NaN,energy:fi(n.z,n.energy,r),alive:fi(n.z,n.alive,r),particles0:n.particles0,flashes:Mi(`replay:${t.id}`,n.losses,r,e),running:!1,progress:t.progress,zStart:i?n.z[0]:0,zEnd:i?n.z[i-1]:0}}let{episode:n,run:r}=ie.getState();if(!n||!r||!n.rows.z.length)return null;let i=n.rows,a=Number.isFinite(Oi.z)?Oi.z:f(i.z),o=i.z[0],s=f(i.z);return{source:`live`,kind:r.kind,z:a,rmsX:fi(i.z,i.rmsX,Math.min(a,s)),rmsY:fi(i.z,i.rmsY,Math.min(a,s)),rmsZ:fi(i.z,i.rmsZ,Math.min(a,s)),energy:fi(i.z,i.energy,Math.min(a,s)),alive:fi(i.z,i.alive,Math.min(a,s)),particles0:n.particles0??i.alive[0],flashes:Mi(`live:${n.id}`,n.losses,a,e),running:r.running,progress:s>o?(a-o)/(s-o):0,zStart:o,zEnd:s}}var Pi=new Set,Fi=0,Ii=0,Li=0;function Ri(e){if(Fi=0,!Pi.size)return;if(e-Ii<bi){Fi=requestAnimationFrame(Ri);return}let t=Li?Math.min(.25,(e-Li)/1e3):0;Li=e,Ii=e;let n=hi(),r=!1,i=Si.getState().replay;if(i?.playing){let e=i.progress+t*i.speed/vi;Si.setState({replay:{...i,progress:Math.min(1,e),playing:e<1}}),r=e<1}let a=Ai(t,e,n),o=ie.getState().run;!i&&o?.running&&n!==`off`&&!j.getState().run.paused&&(r=!0),a&&n!==`off`&&(r=!0);let s=Ni(e);s?.flashes.length&&n!==`off`&&(r=!0);for(let e of Pi)e.visible()&&e.fn(s);r?Fi=requestAnimationFrame(Ri):Li=0}function zi(){!Fi&&Pi.size&&(Fi=requestAnimationFrame(Ri))}function Bi(e,t=()=>!0){let n={fn:e,visible:t};return Pi.add(n),zi(),()=>{Pi.delete(n)}}ie.subscribe(zi),j.subscribe((e,t)=>{(e.run!==t.run||e.settings!==t.settings||e.page!==t.page)&&zi()}),pi.addEventListener(`change`,zi),document.addEventListener(`visibilitychange`,zi);function Vi(e=4){let[t,n]=(0,M.useState)(null);return(0,M.useEffect)(()=>{let t=0,r,i=Bi(i=>{let a=performance.now();window.clearTimeout(r),a-t>=1e3/e?(t=a,n(i)):r=window.setTimeout(()=>n(i),1e3/e)});return()=>{window.clearTimeout(r),i()}},[e]),t}var Hi=(0,M.lazy)(()=>He(()=>import(`./AssistantPanel-DC3vb-zH.js`).then(e=>({default:e.AssistantPanel})),__vite__mapDeps([2,1,3]),import.meta.url)),Ui=(0,M.lazy)(()=>He(()=>import(`./ProjectPage-BHIrdjDi.js`),__vite__mapDeps([4,1,3]),import.meta.url)),Wi=(0,M.lazy)(()=>He(()=>import(`./BeamPage-BYRmdj6W.js`),__vite__mapDeps([5,1,3,6,7,8,9,10,11,12,13,14]),import.meta.url)),Gi=(0,M.lazy)(()=>He(()=>import(`./LatticePage-BVw2uDV9.js`),__vite__mapDeps([15,1,3,7,8,9,6,10,16,17,18,19,13]),import.meta.url)),Ki=(0,M.lazy)(()=>He(()=>import(`./SettingsPage-BWE9q744.js`),__vite__mapDeps([20,1,3,18,7,8,9,6,10,11,14]),import.meta.url)),qi=(0,M.lazy)(()=>He(()=>import(`./FilesPage-ByVS5FRp.js`),__vite__mapDeps([21,1,3,6,7,8,9,10,11,12,13,16,17,18,19]),import.meta.url)),Ji=(0,M.lazy)(()=>He(()=>import(`./RunPage-C2KGuop8.js`),__vite__mapDeps([22,1,3,17,18,6,19,7]),import.meta.url)),Yi=(0,M.lazy)(()=>He(()=>import(`./ResultsPage-D7t6sd-c.js`),__vite__mapDeps([23,1,3,7]),import.meta.url)),Xi=(0,M.lazy)(()=>He(()=>import(`./ScanPage-Beg3efBU.js`),__vite__mapDeps([24,1,3,7]),import.meta.url)),Zi={project:{label:`Project`,icon:`home`,render:()=>(0,N.jsx)(Ui,{})},beam:{label:`Beam`,icon:`pulse`,render:()=>(0,N.jsx)(Wi,{})},lattice:{label:`Lattice`,icon:`list-ordered`,render:()=>(0,N.jsx)(Gi,{})},settings:{label:`Simulation settings`,icon:`tools`,render:()=>(0,N.jsx)(Ki,{})},files:{label:`Files`,icon:`files`,render:()=>(0,N.jsx)(qi,{})},run:{label:`Run`,icon:`play-circle`,render:()=>(0,N.jsx)(Ji,{})},scan:{label:`Scan`,icon:`graph-scatter`,render:()=>(0,N.jsx)(Xi,{})},results:{label:`Results`,icon:`graph-line`,render:()=>(0,N.jsx)(Yi,{})}},Qi=48,$i=160,ea=480,ta=110;function na(){let e=j.getState();e.sidebarHidden?_(!1):ve(!e.sidebarCollapsed)}function ra(){_(!j.getState().sidebarHidden)}function ia(){return ue(e=>(0,N.jsx)(d,{title:T(`Keyboard shortcuts`),icon:`keyboard`,onClose:()=>e(),footer:(0,N.jsx)(s,{variant:`primary`,autoFocus:!0,onClick:()=>e(),children:T(`Close`)}),children:(0,N.jsxs)(`table`,{className:`shortcut-table`,children:[(0,N.jsx)(`thead`,{children:(0,N.jsxs)(`tr`,{children:[(0,N.jsx)(`th`,{children:T(`Action`)}),(0,N.jsx)(`th`,{children:T(`Shortcut`)})]})}),(0,N.jsx)(`tbody`,{children:_r.map(e=>(0,N.jsxs)(`tr`,{children:[(0,N.jsxs)(`td`,{children:[T(e.label),e.scope&&(0,N.jsxs)(`span`,{className:`soft`,children:[` · `,T(e.scope)]})]}),(0,N.jsx)(`td`,{children:(0,N.jsx)(`span`,{className:`kbd`,children:e.keys})})]},e.id))})]})}),{width:520})}function aa(){let e=Be(),t=Fe(e=>e.lang),[i,a]=(0,M.useState)(null),o=(0,M.useRef)([]),s=j(e=>e.project.open),l=j(e=>e.project.name),u=j(e=>e.project.path),d=j(e=>e.project.recent),f=j(e=>e.run.running),p=j(e=>e.run.running&&!!e.run.paused),m=j(e=>e.page),h=j(e=>e.sidebarCollapsed),_=j(e=>e.sidebarHidden),v=j(e=>e.logVisible),y=j(e=>e.theme),ee=j(e=>e.scale),te=j(e=>Ke(e.settings)),C=j(e=>e.settings[`ui/motion`]??`full`),re=yn(e=>Object.values(e.dirty).some(Boolean));(0,M.useEffect)(()=>{document.title=s&&l?`AVAS – ${l}`:`AVAS`},[s,l]);let ie=[{label:e(`File`),items:()=>[{label:e(`New project...`),shortcut:vr.newProject.keys,icon:`new-folder`,onClick:jn},{label:e(`Open project...`),shortcut:vr.openProject.keys,icon:`folder-opened`,onClick:()=>An()},{label:e(`Open recent`),disabled:!d.length,submenu:d.map(e=>({label:e,onClick:()=>An(e)}))},{label:e(`Close project`),disabled:!s,onClick:Mn},{type:`separator`},{label:e(`Project overview`),icon:`home`,disabled:!s,onClick:()=>b(`project`)},{label:e(`Show in Explorer`),icon:`folder`,disabled:!s,onClick:Nn},{type:`separator`},{label:e(`Save`),shortcut:vr.save.keys,icon:`save`,disabled:!s,onClick:()=>Ln()},...le()?[{type:`separator`},{label:e(`Exit`),shortcut:vr.quit.keys,onClick:Zn}]:[]]},{label:e(`Run`),items:()=>[f?p?{label:e(`Resume`),shortcut:vr.runPauseResume.keys,icon:`debug-continue`,onClick:Wn}:{label:e(`Pause`),shortcut:vr.runPauseResume.keys,icon:`debug-pause`,onClick:Un}:{label:e(`Run simulation`),shortcut:vr.runPauseResume.keys,icon:`play`,disabled:!s,onClick:Vn},{label:e(`Stop`),shortcut:vr.stop.keys,icon:`debug-stop`,disabled:!f,onClick:Hn}]},{label:e(`View`),items:()=>[...ge.map((t,n)=>({label:e(Zi[t].label),shortcut:`Ctrl+${n+1}`,checked:m===t,onClick:()=>b(t)})),{type:`separator`},{label:e(`Collapse sidebar`),shortcut:vr.sidebar.keys,checked:h&&!_,onClick:na},{label:e(`Hide sidebar`),shortcut:vr.sidebarHide.keys,checked:_,onClick:ra},{label:e(`Show log panel`),shortcut:vr.log.keys,checked:v,onClick:()=>c(!v)},{label:e(`AI assistant`),shortcut:vr.assistant.keys,checked:Br.getState().open,onClick:()=>Wr(!Br.getState().open)},{type:`separator`},{label:e(`Theme`),submenu:[`system`,`light`,`dark`].map(t=>({label:e(t===`system`?`Follow system`:t===`light`?`Light`:`Dark`),checked:y===t,onClick:()=>S(t)}))},{label:e(`UI scale`),submenu:[...ze.map(e=>({label:`${e} %`,checked:ee===e,onClick:()=>r(e)})),{type:`separator`},{label:e(`Zoom in`),shortcut:vr.zoomIn.keys,onClick:()=>g(1)},{label:e(`Zoom out`),shortcut:vr.zoomOut.keys,onClick:()=>g(-1)},{label:e(`Reset zoom`),shortcut:vr.zoomReset.keys,onClick:()=>r(100)}]},{label:e(`Motion`),submenu:[[`full`,e(`Full: moving bunch and particle cloud`)],[`lite`,e(`Reduced: moving marker only`)],[`off`,e(`Off: update once per second`)],[`auto`,e(`Automatic (follow Windows animation effects)`)]].map(([e,t])=>({label:t,checked:C===e,onClick:()=>ne({"ui/motion":e})}))}]},{label:e(`Settings`),items:()=>[{label:e(`Language`),submenu:Object.keys(Se).map(e=>({label:Se[e],checked:t===e,onClick:()=>Ie(e)}))},{label:e(`Pointer device (all plots)`),submenu:[{label:e(`Detect automatically`),checked:te===`auto`,onClick:()=>ne({"ui/pointerDevice":`auto`})},{label:e(`Mouse: the wheel zooms`),checked:te===`mouse`,onClick:()=>ne({"ui/pointerDevice":`mouse`})},{label:e(`Touchpad: two-finger swipe pans`),checked:te===`touchpad`,onClick:()=>ne({"ui/pointerDevice":`touchpad`})}]}]},{label:e(`Help`),items:()=>[{label:e(`User manual`),icon:`book`,onClick:qn},{label:e(`Keyboard shortcuts`),icon:`keyboard`,onClick:()=>void ia()},{type:`separator`},{label:e(`About AVAS`),icon:`info`,onClick:Jn},{label:e(`Check for updates`),icon:`refresh`,onClick:ur}]}],ae=e=>{let t=o.current[e];t&&(a(e),we(t,ie[e].items(),{onClose:()=>a(t=>t===e?null:t)}))};return(0,N.jsxs)(`div`,{className:`menubar`,children:[(0,N.jsx)(`div`,{className:`menubar-logo`,children:(0,N.jsx)(x,{name:`circuit-board`})}),ie.map((e,t)=>(0,N.jsx)(`button`,{ref:e=>{o.current[t]=e},className:w(`menubar-item`,i===t&&`open`),onMouseDown:e=>{e.preventDefault(),i===t?(n(),a(null)):ae(t)},onMouseEnter:()=>{i!==null&&i!==t&&(n(),ae(t))},children:e.label},t)),(0,N.jsx)(`div`,{className:`grow`}),(0,N.jsx)(`div`,{className:w(`menubar-title ellipsis`,`clickable`),"data-tip":s?u:e(`Open or create a project`),onMouseDown:e=>{e.preventDefault(),we(e.currentTarget,Pn())},children:s?`${l} — AVAS`:`AVAS`}),(0,N.jsx)(`div`,{className:`grow`}),(0,N.jsxs)(`div`,{className:`toolbar-actions`,children:[(0,N.jsx)(be,{icon:`folder-opened`,tip:`${e(`Open project...`)}  (Ctrl+O)`,onClick:()=>An()}),(0,N.jsx)(be,{icon:`save`,tip:re?`${e(`Save`)}  (Ctrl+S)`:e(`Nothing to save`),disabled:!s||!re,onClick:()=>Ln()}),(0,N.jsx)(`div`,{className:`divider-v`}),(0,N.jsx)(be,{icon:f?p?`debug-continue`:`debug-pause`:`play`,className:w(`run-btn`,f&&!p&&`pause`),tip:`${e(f?p?`Resume`:`Pause`:`Run simulation`)}  (F5)`,disabled:!s&&!f,onClick:Kn}),(0,N.jsx)(be,{icon:`debug-stop`,className:`stop-btn`,tip:`${e(`Stop`)}  (Shift+F5)`,disabled:!f,onClick:Hn}),(0,N.jsx)(`div`,{className:`divider-v`}),(0,N.jsx)(be,{icon:h||_?`layout-sidebar-left-off`:`layout-sidebar-left`,tip:e(_?`Show sidebar (Ctrl+Shift+B)`:`Toggle sidebar (Ctrl+B)`),onClick:na}),(0,N.jsx)(be,{icon:v?`layout-panel`:`layout-panel-off`,tip:e(`Toggle log panel (Ctrl+J)`),onClick:()=>c(!v)}),(0,N.jsx)(`div`,{className:`divider-v`}),(0,N.jsx)(oa,{})]})]})}function oa(){let e=Be(),t=Br(e=>e.open),n=Br(e=>!!e.current?.busy);return(0,N.jsxs)(`button`,{className:w(`assistant-toggle`,t&&`active`),"data-tip":e(`AI assistant (Ctrl+Shift+A)`),onClick:()=>Wr(!t),children:[n?(0,N.jsx)(u,{size:14}):(0,N.jsx)(x,{name:`sparkle`}),(0,N.jsx)(`span`,{children:e(`Assistant`)})]})}function L(){let e=Be(),t=j(e=>e.page),n=j(e=>e.sidebarCollapsed),r=j(e=>e.run.running),i=j(e=>!!e.run.paused),a=j(e=>e.project.open),o=yn(e=>e.dirty),s={beam:o.beam,lattice:o.lattice,settings:o.settings,files:o.files},c=o=>{let c=Zi[o],l=o===`run`&&r,d=!Pe.includes(o);return(0,N.jsxs)(`button`,{"aria-label":e(c.label),className:w(`nav-item`,t===o&&`active`,d&&!a&&`dim`),"data-tip":n?e(c.label):void 0,onClick:()=>{t===o&&n?ve(!1):b(o)},children:[(0,N.jsx)(`span`,{className:`nav-icon`,children:l&&i?(0,N.jsx)(x,{name:`debug-pause`,className:`nav-paused`}):l?(0,N.jsx)(u,{size:20}):(0,N.jsx)(x,{name:c.icon})}),(0,N.jsx)(`span`,{className:`nav-label`,children:e(c.label)}),s[o]&&(0,N.jsx)(`span`,{className:`nav-dot`,"data-tip":e(`Unsaved changes`)})]},o)};return(0,N.jsxs)(`nav`,{className:w(`sidebar`,n&&`collapsed`),children:[(0,N.jsxs)(`div`,{className:`sidebar-header`,"aria-hidden":n,children:[`AVAS `,(0,N.jsx)(gn,{})]}),ce.map((e,t)=>(0,N.jsxs)(M.Fragment,{children:[t>0&&(0,N.jsx)(`div`,{className:`nav-sep`,role:`separator`}),e.map(c)]},e[0])),(0,N.jsx)(`div`,{className:`nav-bottom`,children:(0,N.jsxs)(`button`,{className:`nav-item sidebar-toggle`,onClick:()=>ve(!n),"data-tip":e(n?`Expand the sidebar (Ctrl+B)`:`Collapse the sidebar (Ctrl+B)`),"aria-label":e(n?`Expand the sidebar (Ctrl+B)`:`Collapse the sidebar (Ctrl+B)`),children:[(0,N.jsx)(`span`,{className:`nav-icon`,children:(0,N.jsx)(x,{name:n?`chevron-right`:`chevron-left`})}),(0,N.jsx)(`span`,{className:`nav-label`,children:e(`Collapse`)})]})})]})}function R(e,t){return n=>{if(n.button!==0)return;n.preventDefault();let r=n.clientX,i=n.clientY;document.body.classList.add(`dragging`);let a=t=>e(t.clientX-r,t.clientY-i),o=()=>{document.body.classList.remove(`dragging`),window.removeEventListener(`mousemove`,a),window.removeEventListener(`mouseup`,o),t?.()};window.addEventListener(`mousemove`,a),window.addEventListener(`mouseup`,o)}}function sa(){let e=Be(),t=j(e=>e.project),n=j(e=>e.run),r=j(e=>e.statusMessage),i=j(e=>e.resolvedTheme),a=xr(e=>e.errors),o=xr(e=>e.warnings),s=r?.text??``;if(n.running){let t=[`${(n.percent??0).toFixed(0)} %`];n.stages&&n.stages>1&&t.push(`${e(`stage`)} ${n.stage}/${n.stages}`),n.step!=null&&n.all_step&&t.push(`${n.step}/${n.all_step}`),n.eta_s!=null&&!n.paused&&t.push(e(`{time} left`,{time:pe(n.eta_s)})),s=[n.source===`assistant`?e(n.paused?`Assistant {task} paused`:`Assistant {task} running`,{task:e(n.label??``)}):n.source===`scan`?e(n.paused?`Parameter scan {task} paused`:`Parameter scan {task} running`,{task:n.label??``}):n.source===`segment`?e(n.paused?`Segment {label} paused`:`Segment {label} running`,{label:n.label??``}):e(n.paused?`Simulation paused`:`Simulation running`),...t].join(`  ·  `)}return(0,N.jsxs)(`div`,{className:w(`statusbar`,n.running&&`running`),children:[(0,N.jsxs)(`button`,{className:`status-item status-project`,"data-tip":t.open?`${t.path}
${e(`Click to switch project`)}`:e(`Open or create a project`),onClick:e=>{let t=e.currentTarget.getBoundingClientRect();Me(Pn(),t.left,t.top-4,{anchorBottom:!0})},children:[(0,N.jsx)(x,{name:`root-folder`}),(0,N.jsx)(`span`,{className:`ellipsis`,children:t.open?t.name:e(`No project`)}),(0,N.jsx)(x,{name:`chevron-up`,style:{fontSize:12}})]}),(0,N.jsxs)(`button`,{className:`status-item`,"data-tip":e(`Errors and warnings in the log (click to show the log)`),onClick:()=>c(!0),children:[(0,N.jsx)(x,{name:`error`}),(0,N.jsx)(`span`,{children:a}),(0,N.jsx)(x,{name:`warning`}),(0,N.jsx)(`span`,{children:o})]}),(0,N.jsx)(`div`,{className:w(`status-message ellipsis`,!n.running&&r?.level===`error`&&`error`),"data-tip":s||void 0,children:s}),n.running&&(0,N.jsx)(`button`,{className:`status-item`,"data-tip":e(`Show the Run page`),onClick:()=>b(`run`),children:n.paused?(0,N.jsx)(x,{name:`debug-pause`}):(0,N.jsx)(u,{size:14})}),(0,N.jsx)(`button`,{className:`status-item`,"data-tip":e(i===`dark`?`Switch to light theme`:`Switch to dark theme`),onClick:C,children:(0,N.jsx)(x,{name:`color-mode`})})]})}function ca(){(0,M.useEffect)(()=>{let e=e=>{if(tr()||e.target instanceof Element&&e.target.closest(`.manual-window`))return;let t=e.ctrlKey||e.metaKey,n=j.getState(),i=e.key.toLowerCase(),a=t=>yr(e,vr[t].keys),o=!0;a(`stop`)?Hn():a(`runPauseResume`)?Kn():a(`save`)?Ln():a(`openProject`)?An():a(`newProject`)?jn():a(`quit`)?Zn():a(`sidebarHide`)?ra():a(`sidebar`)?na():a(`log`)?c(!n.logVisible):a(`assistant`)?Wr(!Br.getState().open):a(`zoomIn`)?g(1):a(`zoomOut`)?g(-1):a(`zoomReset`)?r(100):t&&!e.shiftKey&&!e.altKey&&/^[1-8]$/.test(e.key)&&!er(e)?b(ge[Number(e.key)-1]):o=e.key===`F12`||t&&e.shiftKey&&i===`i`?!1:t&&i===`r`&&!er(e)?!0:!!(e.key===`F5`||t&&i===`p`||t&&i===`f`&&!er(e)),o&&(e.preventDefault(),e.stopPropagation())};return window.addEventListener(`keydown`,e,!0),()=>window.removeEventListener(`keydown`,e,!0)},[])}function la(){ca();let e=j(e=>e.page),t=j(e=>e.sidebarCollapsed),n=j(e=>e.sidebarHidden),r=j(e=>e.sidebarWidth),i=j(e=>e.logVisible),a=j(e=>e.logHeight),o=j(e=>e.logMaximized),[s,d]=(0,M.useState)(()=>new Set([e])),[f,p]=(0,M.useState)(null),[m,h]=(0,M.useState)(null),g=Br(e=>e.open),_=Br(e=>e.width),[y,b]=(0,M.useState)(null),x=(0,M.useRef)(null);(0,M.useEffect)(()=>{d(t=>t.has(e)?t:new Set(t).add(e))},[e]);let S=gi();(0,M.useEffect)(()=>{document.documentElement.dataset.motion=S},[S]);let ee=f??(t?Qi:r),te=(()=>{let e=0,n=0;return i=>{e=t?Qi:r,n=e,R(t=>{n=e+t,p(Math.max(Qi,Math.min(ea,n)))},()=>{p(null),n<ta?ve(!0):(v(Math.max($i,Math.min(ea,n))),t&&ve(!1))})(i)}})(),C=(()=>{let e=0,t=0;return n=>{let r=x.current?.clientHeight??800;e=o?r-120:a,t=e,R((n,i)=>{t=Math.max(60,Math.min(r-120,e-i)),h(t)},()=>{h(null),t<60?c(!1):re(Math.round(t))})(n)}})(),ne=o?{flex:`1 1 auto`}:{height:m??a},ie=e=>{let t=_,n=t;R(e=>{n=Math.max(320,Math.min(Math.round(window.innerWidth*.6),t-e)),b(n)},()=>{b(null),Gr(n)})(e)};return(0,N.jsxs)(`div`,{className:`shell`,children:[(0,N.jsx)(aa,{}),(0,N.jsxs)(`div`,{className:`shell-body`,children:[!n&&(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(`div`,{className:w(`sidebar-wrap`,f==null&&`animate`),style:{width:ee},children:(0,N.jsx)(L,{})}),(0,N.jsx)(`div`,{className:`sash sash-v`,onMouseDown:te,onDoubleClick:()=>ve(!t)})]}),(0,N.jsxs)(`div`,{className:`main`,ref:x,children:[(0,N.jsx)(`div`,{className:`pages`,style:o&&i?{flex:`0 0 120px`}:void 0,children:[...s].map(t=>(0,N.jsx)(`div`,{className:`page-host`,style:{display:t===e?void 0:`none`},children:(0,N.jsx)(gr,{name:t,children:(0,N.jsx)(M.Suspense,{fallback:(0,N.jsx)(`div`,{className:`page-loading`,children:(0,N.jsx)(u,{size:24})}),children:Zi[t].render()})})},t))}),i&&(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(`div`,{className:`sash sash-h`,onMouseDown:C,onDoubleClick:()=>l(!o)}),(0,N.jsx)(`div`,{className:`panel`,style:ne,children:(0,N.jsx)(kr,{})})]})]}),g&&(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(`div`,{className:`sash sash-v`,onMouseDown:ie}),(0,N.jsx)(`div`,{className:`assistant-wrap`,style:{width:y??_},children:(0,N.jsx)(gr,{name:`assistant`,children:(0,N.jsx)(M.Suspense,{fallback:(0,N.jsx)(`div`,{className:`page-loading`,children:(0,N.jsx)(u,{size:20})}),children:(0,N.jsx)(Hi,{})})})})]})]}),(0,N.jsx)(mr,{}),(0,N.jsx)(sa,{})]})}window.__avasDebug={useApp:j,useDirty:yn,setPage:b,setTheme:S,setLanguage:Ie,runSimulation:Vn,saveAll:Ln};function ua(){let e=j(e=>e.ready),[t,n]=(0,M.useState)(null);return(0,M.useEffect)(()=>{Er(),zr(),de().then(()=>Ur()).catch(e=>n(String(e?.message??e)))},[]),(0,M.useEffect)(()=>{let e=e=>{e.target.closest(`input, textarea, .selectable, .monaco-editor`)||e.preventDefault()};return window.addEventListener(`contextmenu`,e),()=>window.removeEventListener(`contextmenu`,e)},[]),t?(0,N.jsx)(`div`,{className:`boot-error`,children:t}):(0,N.jsxs)(N.Fragment,{children:[e?(0,N.jsx)(la,{}):(0,N.jsx)(`div`,{className:`boot`,children:(0,N.jsx)(u,{size:28})}),(0,N.jsx)(Lt,{}),(0,N.jsx)(pn,{}),(0,N.jsx)(h,{}),(0,N.jsx)(Oe,{}),(0,N.jsx)(m,{}),(0,N.jsx)(oe,{})]})}(0,$e.createRoot)(document.getElementById(`root`)).render((0,N.jsx)(ua,{}));export{bn as $,Mr as A,er as B,Wr as C,Br as D,ri as E,yr as F,Wn as G,An as H,zn as I,Hn as J,Nn as K,tr as L,Ar as M,Sr as N,Ir as O,vr as P,En as Q,Mn as R,ei as S,ti as T,Un as U,jn as V,Pn as W,wn as X,Dn as Y,xn as Z,Qr as _,Bi as a,Xt as at,Xr as b,Si as c,Ze as ct,fi as d,gn as et,li as f,ni as g,ci as h,Ti as i,nn as it,jr as j,Pr as k,si as l,oi as m,Ei as n,ln as nt,Vi as o,Ut as ot,ui as p,Vn as q,wi as r,tn as rt,gi as s,Tt as st,_i as t,un as tt,di as u,Jr as v,ii as w,Yr as x,Zr as y,Gn as z};