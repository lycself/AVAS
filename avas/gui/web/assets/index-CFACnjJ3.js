const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./AssistantPanel-mX3ZxCQf.js","./rolldown-runtime-CbXtAM7H.js","./util-CiRrjlE_.js","./ProjectPage-F71O2Qja.js","./BeamPage-CvXn7qb2.js","./Plot-YSo7hB8x.js","./common-DfYy1Jys.js","./widgets-C7rmtwAF.js","./LatticePage-CWNUwe7k.js","./LatticeEditor-DA_uIp1_.js","./LayoutView-8i2nRr9p.js","./LayoutView-DEZc0Pf2.css","./LatticeEditor-DXcZaCBW.css","./SettingsPage-CTJAwYtF.js","./FilesPage-CyOufa6f.js","./RunPage-B5Od8iYz.js","./ResultsPage-MXOf93DS.js","./ScanPage--5-6k0oy.js"])))=>i.map(i=>d[i]);
import{n as e,t}from"./rolldown-runtime-CbXtAM7H.js";import{$ as n,A as r,At as i,B as a,C as o,Dt as s,Et as c,G as l,H as u,J as d,K as f,L as p,M as m,Mt as h,N as g,Nt as _,P as v,Pt as y,Q as b,R as ee,S as te,Tt as ne,U as re,V as x,W as ie,X as ae,Y as oe,Z as se,_ as ce,a as le,c as ue,ct as S,d as de,et as fe,f as pe,g as me,h as he,ht as ge,i as _e,jt as ve,kt as ye,l as be,lt as xe,m as Se,o as Ce,p as we,q as Te,rt as C,t as w,tt as Ee,u as De,v as Oe,vt as ke,w as T,wt as E,x as Ae,xt as je,y as Me,yt as Ne}from"./util-CiRrjlE_.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var Pe=t((e=>{function t(e,t){var n=e.length;e.push(t);a:for(;0<n;){var r=n-1>>>1,a=e[r];if(0<i(a,t))e[r]=t,e[n]=a,n=r;else break a}}function n(e){return e.length===0?null:e[0]}function r(e){if(e.length===0)return null;var t=e[0],n=e.pop();if(n!==t){e[0]=n;a:for(var r=0,a=e.length,o=a>>>1;r<o;){var s=2*(r+1)-1,c=e[s],l=s+1,u=e[l];if(0>i(c,n))l<a&&0>i(u,c)?(e[r]=u,e[l]=n,r=l):(e[r]=c,e[s]=n,r=s);else if(l<a&&0>i(u,n))e[r]=u,e[l]=n,r=l;else break a}}return t}function i(e,t){var n=e.sortIndex-t.sortIndex;return n===0?e.id-t.id:n}if(e.unstable_now=void 0,typeof performance==`object`&&typeof performance.now==`function`){var a=performance;e.unstable_now=function(){return a.now()}}else{var o=Date,s=o.now();e.unstable_now=function(){return o.now()-s}}var c=[],l=[],u=1,d=null,f=3,p=!1,m=!1,h=!1,g=!1,_=typeof setTimeout==`function`?setTimeout:null,v=typeof clearTimeout==`function`?clearTimeout:null,y=typeof setImmediate<`u`?setImmediate:null;function b(e){for(var i=n(l);i!==null;){if(i.callback===null)r(l);else if(i.startTime<=e)r(l),i.sortIndex=i.expirationTime,t(c,i);else break;i=n(l)}}function ee(e){if(h=!1,b(e),!m){if(n(c)!==null)m=!0,te||(te=!0,oe());else{var t=n(l);t!==null&&le(ee,t.startTime-e)}}}var te=!1,ne=-1,re=5,x=-1;function ie(){return g?!0:!(e.unstable_now()-x<re)}function ae(){if(g=!1,te){var t=e.unstable_now();x=t;var i=!0;try{a:{m=!1,h&&(h=!1,v(ne),ne=-1),p=!0;var a=f;try{b:{for(b(t),d=n(c);d!==null&&!(d.expirationTime>t&&ie());){var o=d.callback;if(typeof o==`function`){d.callback=null,f=d.priorityLevel;var s=o(d.expirationTime<=t);if(t=e.unstable_now(),typeof s==`function`){d.callback=s,b(t),i=!0;break b}d===n(c)&&r(c),b(t)}else r(c);d=n(c)}if(d!==null)i=!0;else{var u=n(l);u!==null&&le(ee,u.startTime-t),i=!1}}break a}finally{d=null,f=a,p=!1}i=void 0}}finally{i?oe():te=!1}}}var oe;if(typeof y==`function`)oe=function(){y(ae)};else if(typeof MessageChannel<`u`){var se=new MessageChannel,ce=se.port2;se.port1.onmessage=ae,oe=function(){ce.postMessage(null)}}else oe=function(){_(ae,0)};function le(t,n){ne=_(function(){t(e.unstable_now())},n)}e.unstable_IdlePriority=5,e.unstable_ImmediatePriority=1,e.unstable_LowPriority=4,e.unstable_NormalPriority=3,e.unstable_Profiling=null,e.unstable_UserBlockingPriority=2,e.unstable_cancelCallback=function(e){e.callback=null},e.unstable_forceFrameRate=function(e){0>e||125<e?console.error(`forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported`):re=0<e?Math.floor(1e3/e):5},e.unstable_getCurrentPriorityLevel=function(){return f},e.unstable_next=function(e){switch(f){case 1:case 2:case 3:var t=3;break;default:t=f}var n=f;f=t;try{return e()}finally{f=n}},e.unstable_requestPaint=function(){g=!0},e.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var n=f;f=e;try{return t()}finally{f=n}},e.unstable_scheduleCallback=function(r,i,a){var o=e.unstable_now();switch(typeof a==`object`&&a?(a=a.delay,a=typeof a==`number`&&0<a?o+a:o):a=o,r){case 1:var s=-1;break;case 2:s=250;break;case 5:s=1073741823;break;case 4:s=1e4;break;default:s=5e3}return s=a+s,r={id:u++,callback:i,priorityLevel:r,startTime:a,expirationTime:s,sortIndex:-1},a>o?(r.sortIndex=a,t(l,r),n(c)===null&&r===n(l)&&(h?(v(ne),ne=-1):h=!0,le(ee,a-o))):(r.sortIndex=s,t(c,r),m||p||(m=!0,te||(te=!0,oe()))),r},e.unstable_shouldYield=ie,e.unstable_wrapCallback=function(e){var t=f;return function(){var n=f;f=t;try{return e.apply(this,arguments)}finally{f=n}}}})),Fe=t(((e,t)=>{t.exports=Pe()})),Ie=t((e=>{var t=y();function n(e){var t=`https://react.dev/errors/`+e;if(1<arguments.length){t+=`?args[]=`+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+=`&args[]=`+encodeURIComponent(arguments[n])}return`Minified React error #`+e+`; visit `+t+` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`}function r(){}var i={d:{f:r,r:function(){throw Error(n(522))},D:r,C:r,L:r,m:r,X:r,S:r,M:r},p:0,findDOMNode:null},a=Symbol.for(`react.portal`),o=Symbol.for(`react.recoverable`),s=Symbol.for(`react.optimistic_key`);function c(e,t,n){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:a,key:r==null?null:r===s?s:``+r,children:e,containerInfo:t,implementation:n}}var l=t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function u(e,t){if(e===`font`)return``;if(typeof t==`string`)return t===`use-credentials`?t:``}e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=i,e.browser=function(e){return{$$typeof:o,_reason:e}},e.createPortal=function(e,t){var r=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)throw Error(n(299));return c(e,t,null,r)},e.flushSync=function(e){var t=l.T,n=i.p;try{if(l.T=null,i.p=2,e)return e()}finally{l.T=t,i.p=n,i.d.f()}},e.preconnect=function(e,t){typeof e==`string`&&(t?(t=t.crossOrigin,t=typeof t==`string`?t===`use-credentials`?t:``:void 0):t=null,i.d.C(e,t))},e.prefetchDNS=function(e){typeof e==`string`&&i.d.D(e)},e.preinit=function(e,t){if(typeof e==`string`&&t&&typeof t.as==`string`){var n=t.as,r=u(n,t.crossOrigin),a=typeof t.integrity==`string`?t.integrity:void 0,o=typeof t.fetchPriority==`string`?t.fetchPriority:void 0;n===`style`?i.d.S(e,typeof t.precedence==`string`?t.precedence:void 0,{crossOrigin:r,integrity:a,fetchPriority:o}):n===`script`&&i.d.X(e,{crossOrigin:r,integrity:a,fetchPriority:o,nonce:typeof t.nonce==`string`?t.nonce:void 0})}},e.preinitModule=function(e,t){if(typeof e==`string`){if(typeof t==`object`&&t){if(t.as==null||t.as===`script`){var n=u(t.as,t.crossOrigin);i.d.M(e,{crossOrigin:n,integrity:typeof t.integrity==`string`?t.integrity:void 0,nonce:typeof t.nonce==`string`?t.nonce:void 0,fetchPriority:typeof t.fetchPriority==`string`?t.fetchPriority:void 0})}}else t??i.d.M(e)}},e.preload=function(e,t){if(typeof e==`string`&&typeof t==`object`&&t&&typeof t.as==`string`){var n=t.as,r=u(n,t.crossOrigin);i.d.L(e,n,{crossOrigin:r,integrity:typeof t.integrity==`string`?t.integrity:void 0,nonce:typeof t.nonce==`string`?t.nonce:void 0,type:typeof t.type==`string`?t.type:void 0,fetchPriority:typeof t.fetchPriority==`string`?t.fetchPriority:void 0,referrerPolicy:typeof t.referrerPolicy==`string`?t.referrerPolicy:void 0,imageSrcSet:typeof t.imageSrcSet==`string`?t.imageSrcSet:void 0,imageSizes:typeof t.imageSizes==`string`?t.imageSizes:void 0,media:typeof t.media==`string`?t.media:void 0})}},e.preloadModule=function(e,t){if(typeof e==`string`){if(t){var n=u(t.as,t.crossOrigin);i.d.m(e,{as:typeof t.as==`string`&&t.as!==`script`?t.as:void 0,crossOrigin:n,integrity:typeof t.integrity==`string`?t.integrity:void 0,nonce:typeof t.nonce==`string`?t.nonce:void 0,fetchPriority:typeof t.fetchPriority==`string`?t.fetchPriority:void 0})}else i.d.m(e)}},e.requestFormReset=function(e){i.d.r(e)},e.unstable_batchedUpdates=function(e,t){return e(t)},e.useFormState=function(e,t,n){return l.H.useFormState(e,t,n)},e.useFormStatus=function(){return l.H.useHostTransitionStatus()},e.version=`19.3.0`})),Le=t(((e,t)=>{function n(){if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<`u`&&typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE==`function`)try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(e){console.error(e)}}n(),t.exports=Ie()})),Re=t((e=>{var t=Fe(),n=y(),r=Le();function i(e){var t=`https://react.dev/errors/`+e;if(1<arguments.length){t+=`?args[]=`+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+=`&args[]=`+encodeURIComponent(arguments[n])}return`Minified React error #`+e+`; visit `+t+` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`}function a(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function o(e){for(var t=e,n=t;n&&!n.alternate;)t=n,t.flags&4098&&(e=t.return),n=t.return;for(;t.return;)t=t.return;return t.tag===3?e:null}function s(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function c(e){if(e.tag===31){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function l(e){if(o(e)!==e)throw Error(i(188))}function u(e){var t=e.alternate;if(!t){if(t=o(e),t===null)throw Error(i(188));return t===e?e:null}for(var n=e,r=t;;){var a=n.return;if(a===null)break;var s=a.alternate;if(s===null){if(r=a.return,r!==null){n=r;continue}break}if(a.child===s.child){for(s=a.child;s;){if(s===n)return l(a),e;if(s===r)return l(a),t;s=s.sibling}throw Error(i(188))}if(n.return!==r.return)n=a,r=s;else{for(var c=!1,u=a.child;u;){if(u===n){c=!0,n=a,r=s;break}if(u===r){c=!0,r=a,n=s;break}u=u.sibling}if(!c){for(u=s.child;u;){if(u===n){c=!0,n=s,r=a;break}if(u===r){c=!0,r=s,n=a;break}u=u.sibling}if(!c)throw Error(i(189))}}if(n.alternate!==r)throw Error(i(190))}if(n.tag!==3)throw Error(i(188));return n.stateNode.current===n?e:t}function d(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=d(e),t!==null)return t;e=e.sibling}return null}function f(e,t,n,r,i,a){for(;e!==null;){if((e.tag===5||e.tag===27||e.tag===6)&&n(e,r,i,a)||(e.tag!==22||e.memoizedState===null)&&(t||e.tag!==5&&e.tag!==27)&&f(e.child,t,n,r,i,a))return!0;e=e.sibling}return!1}function p(e){for(e=e.return;e!==null;){if(e.tag===3||e.tag===5||e.tag===27)return e;e=e.return}return null}function m(e){var t=!1;for(e=e.return;e!==null&&(e.tag===4&&(t=!0),e.tag!==3&&e.tag!==5&&e.tag!==27);)e=e.return;return t}function h(e){var t=[null,null],n=p(e);return n===null||g(t,e,n.child,{foundSelf:!1}),t}function g(e,t,n,r){for(;n!==null;){if(n===t)r.foundSelf=!0;else if(n.tag===5||n.tag===27||n.tag===6){if(r.foundSelf)return e[1]=n,!0;e[0]=n}else if((n.tag!==22||n.memoizedState===null)&&g(e,t,n.child,r))return!0;n=n.sibling}return!1}function _(e){switch(e.tag){case 5:case 27:case 6:return e.stateNode;case 3:return e.stateNode.containerInfo;default:throw Error(i(559))}}var v=null,b=null;function ee(e,t,n){return e===n||e===t&&(v=e,!0)}function te(e,t,n){return e===n?(b=e,!1):e===t&&(b!==null&&(v=e),!0)}function ne(e){if(e===null)return null;do e=e===null?null:e.return;while(e&&e.tag!==5&&e.tag!==27&&e.tag!==3);return e||null}function re(e,t,n){for(var r=0,i=e;i;i=n(i))r++;i=0;for(var a=t;a;a=n(a))i++;for(;0<r-i;)e=n(e),r--;for(;0<i-r;)t=n(t),i--;for(;r--;){if(e===t||t!==null&&e===t.alternate)return e;e=n(e),t=n(t)}return null}var x=Object.assign,ie=Symbol.for(`react.element`),ae=Symbol.for(`react.transitional.element`),oe=Symbol.for(`react.portal`),se=Symbol.for(`react.fragment`),ce=Symbol.for(`react.strict_mode`),le=Symbol.for(`react.profiler`),ue=Symbol.for(`react.consumer`),S=Symbol.for(`react.context`),de=Symbol.for(`react.forward_ref`),fe=Symbol.for(`react.suspense`),pe=Symbol.for(`react.suspense_list`),me=Symbol.for(`react.memo`),he=Symbol.for(`react.lazy`),ge=Symbol.for(`react.activity`),_e=Symbol.for(`react.legacy_hidden`),ve=Symbol.for(`react.memo_cache_sentinel`),ye=Symbol.for(`react.view_transition`),be=Symbol.for(`react.recoverable`),xe=Symbol.iterator;function Se(e){return typeof e!=`object`||!e?null:(e=xe&&e[xe]||e[`@@iterator`],typeof e==`function`?e:null)}var Ce=Symbol.for(`react.client.reference`);function we(e){if(e==null)return null;if(typeof e==`function`)return e.$$typeof===Ce?null:e.displayName||e.name||null;if(typeof e==`string`)return e;switch(e){case se:return`Fragment`;case le:return`Profiler`;case ce:return`StrictMode`;case fe:return`Suspense`;case pe:return`SuspenseList`;case ge:return`Activity`;case ye:return`ViewTransition`}if(typeof e==`object`)switch(e.$$typeof){case oe:return`Portal`;case S:return e.displayName||`Context`;case ue:return(e._context.displayName||`Context`)+`.Consumer`;case de:var t=e.render;return e=e.displayName,e||=(e=t.displayName||t.name||``,e===``?`ForwardRef`:`ForwardRef(`+e+`)`),e;case me:return t=e.displayName||null,t===null?we(e.type)||`Memo`:t;case he:t=e._payload,e=e._init;try{return we(e(t))}catch{}}return null}var Te=Array.isArray,C=n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,w=r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,Ee={pending:!1,data:null,method:null,action:null},De=[],Oe=-1;function ke(e){return{current:e}}function T(e){0>Oe||(e.current=De[Oe],De[Oe]=null,Oe--)}function E(e,t){Oe++,De[Oe]=e.current,e.current=t}var Ae=ke(null),je=ke(null),Me=ke(null),Ne=ke(null);function Pe(e,t){switch(E(Me,t),E(je,e),E(Ae,null),t.nodeType){case 9:case 11:e=(e=t.documentElement)&&(e=e.namespaceURI)?up(e):0;break;default:if(e=t.tagName,t=t.namespaceURI)t=up(t),e=dp(t,e);else switch(e){case`svg`:e=1;break;case`math`:e=2;break;default:e=0}}T(Ae),E(Ae,e)}function Ie(){T(Ae),T(je),T(Me)}function Re(e){var t=e.memoizedState;t!==null&&(sh._currentValue=t.memoizedState,E(Ne,e)),t=Ae.current;var n=dp(t,e.type);t!==n&&(E(je,e),E(Ae,n))}function ze(e){je.current===e&&(T(Ae),T(je)),Ne.current===e&&(T(Ne),sh._currentValue=Ee)}var D,O;function Be(e){if(D===void 0)try{throw Error()}catch(e){var t=e.stack.trim().match(/\n( *(at )?)/);D=t&&t[1]||``,O=-1<e.stack.indexOf(`
    at`)?` (<anonymous>)`:-1<e.stack.indexOf(`@`)?`@unknown:0:0`:``}return`
`+D+e+O}var Ve=!1;function He(e,t){if(!e||Ve)return``;Ve=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var r={DetermineComponentFrameRoot:function(){try{if(t){var n=function(){throw Error()};if(Object.defineProperty(n.prototype,"props",{set:function(){throw Error()}}),typeof Reflect==`object`&&Reflect.construct){try{Reflect.construct(n,[])}catch(e){var r=e}Reflect.construct(e,[],n)}else{try{n.call()}catch(e){r=e}n=!1;try{var i=Object.getOwnPropertyDescriptor(e.prototype,`props`);Object.defineProperty(e.prototype,"props",{configurable:!0,set:function(){throw Error()}}),n=!0,new e}finally{n&&(i===void 0?delete e.prototype.props:Object.defineProperty(e.prototype,"props",i))}}}else{try{throw Error()}catch(e){r=e}(n=e())&&typeof n.catch==`function`&&n.catch(function(){})}}catch(e){if(e&&r&&typeof e.stack==`string`)return[e.stack,r.stack]}return[null,null]}};r.DetermineComponentFrameRoot.displayName=`DetermineComponentFrameRoot`;var i=Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot,`name`);i&&i.configurable&&Object.defineProperty(r.DetermineComponentFrameRoot,"name",{value:`DetermineComponentFrameRoot`});var a=r.DetermineComponentFrameRoot(),o=a[0],s=a[1];if(o&&s){var c=o.split(`
`),l=s.split(`
`);for(i=r=0;r<c.length&&!c[r].includes(`DetermineComponentFrameRoot`);)r++;for(;i<l.length&&!l[i].includes(`DetermineComponentFrameRoot`);)i++;if(r===c.length||i===l.length)for(r=c.length-1,i=l.length-1;1<=r&&0<=i&&c[r]!==l[i];)i--;for(;1<=r&&0<=i;r--,i--)if(c[r]!==l[i]){if(r!==1||i!==1)do if(r--,i--,0>i||c[r]!==l[i]){var u=`
`+c[r].replace(` at new `,` at `);return e.displayName&&u.includes(`<anonymous>`)&&(u=u.replace(`<anonymous>`,e.displayName)),u}while(1<=r&&0<=i);break}}}finally{Ve=!1,Error.prepareStackTrace=n}return(n=e?e.displayName||e.name:``)?Be(n):``}function Ue(e,t){switch(e.tag){case 26:case 27:case 5:return Be(e.type);case 16:return Be(`Lazy`);case 13:return e.child!==t&&t!==null?Be(`Suspense Fallback`):Be(`Suspense`);case 19:return Be(`SuspenseList`);case 0:case 15:return He(e.type,!1);case 11:return He(e.type.render,!1);case 1:return He(e.type,!0);case 31:return Be(`Activity`);case 30:return Be(`ViewTransition`);default:return``}}function We(e){try{var t=``,n=null;do t+=Ue(e,n),n=e,e=e.return;while(e);return t}catch(e){return`
Error generating stack: `+e.message+`
`+e.stack}}var Ge=Object.prototype.hasOwnProperty,Ke=t.unstable_scheduleCallback,qe=t.unstable_cancelCallback,Je=t.unstable_shouldYield,Ye=t.unstable_requestPaint,Xe=t.unstable_now,Ze=t.unstable_getCurrentPriorityLevel,Qe=t.unstable_ImmediatePriority,$e=t.unstable_UserBlockingPriority,et=t.unstable_NormalPriority,tt=t.unstable_LowPriority,nt=t.unstable_IdlePriority,rt=t.log,it=t.unstable_setDisableYieldValue,at=null,ot=null;function st(e){if(typeof rt==`function`&&it(e),ot&&typeof ot.setStrictMode==`function`)try{ot.setStrictMode(at,e)}catch{}}var ct=Math.clz32?Math.clz32:dt,lt=Math.log,ut=Math.LN2;function dt(e){return e>>>=0,e===0?32:31-(lt(e)/ut|0)|0}var ft=256,pt=262144,mt=4194304;function ht(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return e&-e;case 262144:case 524288:case 1048576:case 2097152:return e&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function gt(e,t,n){var r=e.pendingLanes;if(r===0)return 0;var i=0,a=e.suspendedLanes,o=e.pingedLanes;e=e.warmLanes;var s=r&134217727;return s===0?(s=r&~a,s===0?o===0?n||(n=r&~e,n!==0&&(i=ht(n))):i=ht(o):i=ht(s)):(r=s&~a,r===0?(o&=s,o===0?n||(n=s&~e,n!==0&&(i=ht(n))):i=ht(o)):i=ht(r)),i===0?0:t!==0&&t!==i&&(t&a)===0&&(a=i&-i,n=t&-t,a>=n||a===32&&n&4194048)?t:i}function _t(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function vt(e,t){t&8&&(t|=t&32);var n=e.entangledLanes;if(n!==0)for(e=e.entanglements,n&=t;0<n;){var r=31-ct(n),i=1<<r;t|=e[r],n&=~i}return t}function yt(e,t){switch(e){case 1:case 2:case 4:case 8:case 64:return t+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function bt(){var e=mt;return mt<<=1,!(mt&62914560)&&(mt=4194304),e}function xt(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function St(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function Ct(e,t,n,r,i,a){var o=e.pendingLanes;e.pendingLanes=n,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=n,e.entangledLanes&=n,e.errorRecoveryDisabledLanes&=n,e.shellSuspendCounter=0;var s=e.entanglements,c=e.expirationTimes,l=e.hiddenUpdates;for(n=o&~n;0<n;){var u=31-ct(n),d=1<<u;s[u]=0,c[u]=-1;var f=l[u];if(f!==null)for(l[u]=null,u=0;u<f.length;u++){var p=f[u];p!==null&&(p.lane&=-536870913)}n&=~d}r!==0&&wt(e,r,0),a!==0&&i===0&&e.tag!==0&&(e.suspendedLanes|=a&~(o&~t))}function wt(e,t,n){e.pendingLanes|=t,e.suspendedLanes&=~t;var r=31-ct(t);e.entangledLanes|=t,e.entanglements[r]=e.entanglements[r]|1073741824|n&261930}function Tt(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var r=31-ct(n),i=1<<r;i&t|e[r]&t&&(e[r]|=t),n&=~i}}function Et(e,t){var n=t&-t;return n=n&42?1:Dt(n),(n&(e.suspendedLanes|t))===0?n:0}function Dt(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function Ot(e){return e&=-e,2<e?8<e?e&134217727?32:268435456:8:2}function kt(){var e=w.p;return e===0?(e=window.event,e===void 0?32:Ch(e.type)):e}function At(e,t){var n=w.p;try{return w.p=e,t()}finally{w.p=n}}var jt=Math.random().toString(36).slice(2),Mt=`__reactFiber$`+jt,Nt=`__reactProps$`+jt,Pt=`__reactContainer$`+jt,Ft=`__reactEvents$`+jt,It=`__reactListeners$`+jt,Lt=`__reactHandles$`+jt,Rt=`__reactResources$`+jt,zt=`__reactMarker$`+jt,Bt=`__reactLoad$`+jt;function Vt(e){delete e[Mt],delete e[Nt],delete e[It],delete e[Lt]}function Ht(e){var t;if(t=e[Mt])return t;for(var n=e.parentNode;n;){if(t=n[Pt]||n[Mt]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=fm(e);e!==null;){if(n=e[Mt])return n;e=fm(e)}return t}e=n,n=e.parentNode}return null}function Ut(e){if(e=e[Mt]||e[Pt]){var t=e.tag;if(t===5||t===6||t===13||t===31||t===26||t===27||t===3)return e}return null}function Wt(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error(i(33))}function Gt(e){var t=e[Rt];return t||=e[Rt]={hoistableStyles:new Map,hoistableScripts:new Map},t}function Kt(e){e[zt]=!0}function qt(e){e[Bt]=void 0}var Jt=new Set,k={};function Yt(e,t){Xt(e,t),Xt(e+`Capture`,t)}function Xt(e,t){for(k[e]=t,e=0;e<t.length;e++)Jt.add(t[e])}var Zt=RegExp(`^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$`),Qt={},$t={};function en(e){return Ge.call($t,e)?!0:Ge.call(Qt,e)?!1:Zt.test(e)?$t[e]=!0:(Qt[e]=!0,!1)}var A=!1;function tn(){var e=A;return A=!1,e}function nn(e,t,n){if(en(t)){if(n===null)e.removeAttribute(t);else{switch(typeof n){case`undefined`:case`function`:case`symbol`:e.removeAttribute(t);return;case`boolean`:var r=t.toLowerCase().slice(0,5);if(r!==`data-`&&r!==`aria-`){e.removeAttribute(t);return}}e.setAttribute(t,n)}}}function rn(e,t,n){if(n===null)e.removeAttribute(t);else{switch(typeof n){case`undefined`:case`function`:case`symbol`:case`boolean`:e.removeAttribute(t);return}e.setAttribute(t,n)}}function an(e,t,n,r){if(r===null)e.removeAttribute(n);else{switch(typeof r){case`undefined`:case`function`:case`symbol`:case`boolean`:e.removeAttribute(n);return}e.setAttributeNS(t,n,r)}}function j(e){switch(typeof e){case`bigint`:case`boolean`:case`number`:case`string`:case`undefined`:return e;case`object`:return e;default:return``}}function on(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()===`input`&&(t===`checkbox`||t===`radio`)}function sn(e,t,n){var r=Object.getOwnPropertyDescriptor(e.constructor.prototype,t);if(!e.hasOwnProperty(t)&&r!==void 0&&typeof r.get==`function`&&typeof r.set==`function`){var i=r.get,a=r.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return i.call(this)},set:function(e){n=``+e,a.call(this,e)}}),Object.defineProperty(e,t,{enumerable:r.enumerable}),{getValue:function(){return n},setValue:function(e){n=``+e},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function cn(e){if(!e._valueTracker){var t=on(e)?`checked`:`value`;e._valueTracker=sn(e,t,``+e[t])}}function ln(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),r=``;return e&&(r=on(e)?e.checked?`true`:`false`:e.value),e=r,e!==n&&(t.setValue(e),!0)}var un=/[\n"\\]/g;function dn(e){return e.replace(un,function(e){return`\\`+e.charCodeAt(0).toString(16)+` `})}function fn(e,t,n,r,i,a,o,s){e.name=``,o!=null&&typeof o!=`function`&&typeof o!=`symbol`&&typeof o!=`boolean`?e.type=o:e.removeAttribute(`type`),t==null?o!==`submit`&&o!==`reset`||e.removeAttribute(`value`):o===`number`?(t===0&&e.value===``||e.value!=t)&&(e.value=``+j(t)):e.value!==``+j(t)&&(e.value=``+j(t)),t==null?n==null?r!=null&&e.removeAttribute(`value`):mn(e,j(n)):o===`number`&&e.value==t?mn(e,j(e.value)):mn(e,j(t)),i==null&&a!=null&&(e.defaultChecked=!!a),i!=null&&(e.checked=i&&typeof i!=`function`&&typeof i!=`symbol`),s!=null&&typeof s!=`function`&&typeof s!=`symbol`&&typeof s!=`boolean`?e.name=``+j(s):e.removeAttribute(`name`)}function pn(e,t,n,r,i,a,o,s){if(a!=null&&typeof a!=`function`&&typeof a!=`symbol`&&typeof a!=`boolean`&&(e.type=a),t!=null||n!=null){if(!(a!==`submit`&&a!==`reset`||t!=null)){cn(e);return}n=n==null?``:``+j(n),t=t==null?n:``+j(t),s||t===e.value||(e.value=t),e.defaultValue=t}r??=i,r=typeof r!=`function`&&typeof r!=`symbol`&&!!r,e.checked=s?e.checked:!!r,e.defaultChecked=!!r,o!=null&&typeof o!=`function`&&typeof o!=`symbol`&&typeof o!=`boolean`&&(e.name=o),cn(e)}function mn(e,t){e.defaultValue!==``+t&&(e.defaultValue=``+t)}function hn(e,t,n,r){if(e=e.options,t){t={};for(var i=0;i<n.length;i++)t[`$`+n[i]]=!0;for(n=0;n<e.length;n++)i=t.hasOwnProperty(`$`+e[n].value),e[n].selected!==i&&(e[n].selected=i),i&&r&&(e[n].defaultSelected=!0)}else{for(n=``+j(n),t=null,i=0;i<e.length;i++){if(e[i].value===n){e[i].selected=!0,r&&(e[i].defaultSelected=!0);return}t!==null||e[i].disabled||(t=e[i])}t!==null&&(t.selected=!0)}}function gn(e,t,n){if(t!=null&&(t=``+j(t),t!==e.value&&(e.value=t),n==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=n==null?``:``+j(n)}function _n(e,t,n,r){if(t==null){if(r!=null){if(n!=null)throw Error(i(92));if(Te(r)){if(1<r.length)throw Error(i(93));r=r[0]}n=r}n??=``,t=n}n=j(t),e.defaultValue=n,r=e.textContent,r===n&&r!==``&&r!==null&&(e.value=r),cn(e)}function vn(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var yn=new Set(`animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp`.split(` `));function bn(e,t,n){var r=t.indexOf(`--`)===0;n==null||typeof n==`boolean`||n===``?r?e.setProperty(t,``):t===`float`?e.cssFloat=``:e[t]=``:r?e.setProperty(t,n):typeof n!=`number`||n===0||yn.has(t)?t===`float`?e.cssFloat=n:e[t]=(``+n).trim():e[t]=n+`px`}function xn(e,t,n){if(t!=null&&typeof t!=`object`)throw Error(i(62));if(e=e.style,n!=null){for(var r in n)!n.hasOwnProperty(r)||t!=null&&t.hasOwnProperty(r)||(r.indexOf(`--`)===0?e.setProperty(r,``):r===`float`?e.cssFloat=``:e[r]=``,A=!0);for(var a in t)r=t[a],t.hasOwnProperty(a)&&n[a]!==r&&(bn(e,a,r),A=!0)}else for(var o in t)t.hasOwnProperty(o)&&bn(e,o,t[o])}function Sn(e){if(e.indexOf(`-`)===-1)return!1;switch(e){case`annotation-xml`:case`color-profile`:case`font-face`:case`font-face-src`:case`font-face-uri`:case`font-face-format`:case`font-face-name`:case`missing-glyph`:return!1;default:return!0}}var Cn=new Map([[`acceptCharset`,`accept-charset`],[`htmlFor`,`for`],[`httpEquiv`,`http-equiv`],[`crossOrigin`,`crossorigin`],[`accentHeight`,`accent-height`],[`alignmentBaseline`,`alignment-baseline`],[`arabicForm`,`arabic-form`],[`baselineShift`,`baseline-shift`],[`capHeight`,`cap-height`],[`clipPath`,`clip-path`],[`clipRule`,`clip-rule`],[`colorInterpolation`,`color-interpolation`],[`colorInterpolationFilters`,`color-interpolation-filters`],[`colorProfile`,`color-profile`],[`colorRendering`,`color-rendering`],[`dominantBaseline`,`dominant-baseline`],[`enableBackground`,`enable-background`],[`fillOpacity`,`fill-opacity`],[`fillRule`,`fill-rule`],[`floodColor`,`flood-color`],[`floodOpacity`,`flood-opacity`],[`fontFamily`,`font-family`],[`fontSize`,`font-size`],[`fontSizeAdjust`,`font-size-adjust`],[`fontStretch`,`font-stretch`],[`fontStyle`,`font-style`],[`fontVariant`,`font-variant`],[`fontWeight`,`font-weight`],[`glyphName`,`glyph-name`],[`glyphOrientationHorizontal`,`glyph-orientation-horizontal`],[`glyphOrientationVertical`,`glyph-orientation-vertical`],[`horizAdvX`,`horiz-adv-x`],[`horizOriginX`,`horiz-origin-x`],[`imageRendering`,`image-rendering`],[`letterSpacing`,`letter-spacing`],[`lightingColor`,`lighting-color`],[`markerEnd`,`marker-end`],[`markerMid`,`marker-mid`],[`markerStart`,`marker-start`],[`maskType`,`mask-type`],[`overlinePosition`,`overline-position`],[`overlineThickness`,`overline-thickness`],[`paintOrder`,`paint-order`],[`panose-1`,`panose-1`],[`pointerEvents`,`pointer-events`],[`renderingIntent`,`rendering-intent`],[`shapeRendering`,`shape-rendering`],[`stopColor`,`stop-color`],[`stopOpacity`,`stop-opacity`],[`strikethroughPosition`,`strikethrough-position`],[`strikethroughThickness`,`strikethrough-thickness`],[`strokeDasharray`,`stroke-dasharray`],[`strokeDashoffset`,`stroke-dashoffset`],[`strokeLinecap`,`stroke-linecap`],[`strokeLinejoin`,`stroke-linejoin`],[`strokeMiterlimit`,`stroke-miterlimit`],[`strokeOpacity`,`stroke-opacity`],[`strokeWidth`,`stroke-width`],[`textAnchor`,`text-anchor`],[`textDecoration`,`text-decoration`],[`textRendering`,`text-rendering`],[`transformOrigin`,`transform-origin`],[`underlinePosition`,`underline-position`],[`underlineThickness`,`underline-thickness`],[`unicodeBidi`,`unicode-bidi`],[`unicodeRange`,`unicode-range`],[`unitsPerEm`,`units-per-em`],[`vAlphabetic`,`v-alphabetic`],[`vHanging`,`v-hanging`],[`vIdeographic`,`v-ideographic`],[`vMathematical`,`v-mathematical`],[`vectorEffect`,`vector-effect`],[`vertAdvY`,`vert-adv-y`],[`vertOriginX`,`vert-origin-x`],[`vertOriginY`,`vert-origin-y`],[`wordSpacing`,`word-spacing`],[`writingMode`,`writing-mode`],[`xmlnsXlink`,`xmlns:xlink`],[`xHeight`,`x-height`]]),wn=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function M(e){return wn.test(``+e)?`javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')`:e}function N(){}var Tn=null;function En(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var Dn=null,On=null;function kn(e){var t=Ut(e);if(t&&(e=t.stateNode)){var n=e[Nt]||null;a:switch(e=t.stateNode,t.type){case`input`:if(fn(e,n.value,n.defaultValue,n.defaultValue,n.checked,n.defaultChecked,n.type,n.name),t=n.name,n.type===`radio`&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll(`input[name="`+dn(``+t)+`"][type="radio"]`),t=0;t<n.length;t++){var r=n[t];if(r!==e&&r.form===e.form){var a=r[Nt]||null;if(!a)throw Error(i(90));fn(r,a.value,a.defaultValue,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name)}}for(t=0;t<n.length;t++)r=n[t],r.form===e.form&&ln(r)}break a;case`textarea`:gn(e,n.value,n.defaultValue);break a;case`select`:t=n.value,t!=null&&hn(e,!!n.multiple,t,!1)}}}var An=!1;function jn(e,t,n){if(An)return e(t,n);An=!0;try{return e(t)}finally{if(An=!1,(Dn!==null||On!==null)&&(zd(),Dn&&(t=Dn,e=On,On=Dn=null,kn(t),e)))for(t=0;t<e.length;t++)kn(e[t])}}function Mn(e,t){var n=e.stateNode;if(n===null)return null;var r=n[Nt]||null;if(r===null)return null;n=r[t];a:switch(t){case`onClick`:case`onClickCapture`:case`onDoubleClick`:case`onDoubleClickCapture`:case`onMouseDown`:case`onMouseDownCapture`:case`onMouseMove`:case`onMouseMoveCapture`:case`onMouseUp`:case`onMouseUpCapture`:case`onMouseEnter`:(r=!r.disabled)||(e=e.type,r=e!==`button`&&e!==`input`&&e!==`select`&&e!==`textarea`),e=!r;break a;default:e=!1}if(e)return null;if(n&&typeof n!=`function`)throw Error(i(231,t,typeof n));return n}var Nn=typeof window<`u`&&window.document!==void 0&&window.document.createElement!==void 0,Pn=!1;if(Nn)try{var Fn={};Object.defineProperty(Fn,"passive",{get:function(){Pn=!0}}),window.addEventListener(`test`,Fn,Fn),window.removeEventListener(`test`,Fn,Fn)}catch{Pn=!1}var In=null,Ln=null,Rn=null;function zn(){if(Rn)return Rn;var e,t=Ln,n=t.length,r,i=`value`in In?In.value:In.textContent,a=i.length;for(e=0;e<n&&t[e]===i[e];e++);var o=n-e;for(r=1;r<=o&&t[n-r]===i[a-r];r++);return Rn=i.slice(e,1<r?1-r:void 0)}function Bn(e){var t=e.keyCode;return`charCode`in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function Vn(){return!0}function Hn(){return!1}function Un(e){function t(t,n,r,i,a){for(var o in this._reactName=t,this._targetInst=r,this.type=n,this.nativeEvent=i,this.target=a,this.currentTarget=null,e)e.hasOwnProperty(o)&&(t=e[o],this[o]=t?t(i):i[o]);return this.isDefaultPrevented=(i.defaultPrevented==null?!1===i.returnValue:i.defaultPrevented)?Vn:Hn,this.isPropagationStopped=Hn,this}return x(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var e=this.nativeEvent;e&&(e.preventDefault?e.preventDefault():typeof e.returnValue!=`unknown`&&(e.returnValue=!1),this.isDefaultPrevented=Vn)},stopPropagation:function(){var e=this.nativeEvent;e&&(e.stopPropagation?e.stopPropagation():typeof e.cancelBubble!=`unknown`&&(e.cancelBubble=!0),this.isPropagationStopped=Vn)},persist:function(){},isPersistent:Vn}),t}var Wn={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Gn=Un(Wn),Kn=x({},Wn,{view:0,detail:0}),qn=Un(Kn),Jn,Yn,Xn,Zn=x({},Kn,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:cr,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return`movementX`in e?e.movementX:(e!==Xn&&(Xn&&e.type===`mousemove`?(Jn=e.screenX-Xn.screenX,Yn=e.screenY-Xn.screenY):Yn=Jn=0,Xn=e),Jn)},movementY:function(e){return`movementY`in e?e.movementY:Yn}}),Qn=Un(Zn),$n=Un(x({},Zn,{dataTransfer:0})),er=Un(x({},Kn,{relatedTarget:0})),tr=Un(x({},Wn,{animationName:0,elapsedTime:0,pseudoElement:0})),nr=Un(x({},Wn,{clipboardData:function(e){return`clipboardData`in e?e.clipboardData:window.clipboardData}})),rr=Un(x({},Wn,{data:0})),ir={Esc:`Escape`,Spacebar:` `,Left:`ArrowLeft`,Up:`ArrowUp`,Right:`ArrowRight`,Down:`ArrowDown`,Del:`Delete`,Win:`OS`,Menu:`ContextMenu`,Apps:`ContextMenu`,Scroll:`ScrollLock`,MozPrintableKey:`Unidentified`},ar={8:`Backspace`,9:`Tab`,12:`Clear`,13:`Enter`,16:`Shift`,17:`Control`,18:`Alt`,19:`Pause`,20:`CapsLock`,27:`Escape`,32:` `,33:`PageUp`,34:`PageDown`,35:`End`,36:`Home`,37:`ArrowLeft`,38:`ArrowUp`,39:`ArrowRight`,40:`ArrowDown`,45:`Insert`,46:`Delete`,112:`F1`,113:`F2`,114:`F3`,115:`F4`,116:`F5`,117:`F6`,118:`F7`,119:`F8`,120:`F9`,121:`F10`,122:`F11`,123:`F12`,144:`NumLock`,145:`ScrollLock`,224:`Meta`},or={Alt:`altKey`,Control:`ctrlKey`,Meta:`metaKey`,Shift:`shiftKey`};function sr(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=or[e])?!!t[e]:!1}function cr(){return sr}var lr=Un(x({},Kn,{key:function(e){if(e.key){var t=ir[e.key]||e.key;if(t!==`Unidentified`)return t}return e.type===`keypress`?(e=Bn(e),e===13?`Enter`:String.fromCharCode(e)):e.type===`keydown`||e.type===`keyup`?ar[e.keyCode]||`Unidentified`:``},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:cr,charCode:function(e){return e.type===`keypress`?Bn(e):0},keyCode:function(e){return e.type===`keydown`||e.type===`keyup`?e.keyCode:0},which:function(e){return e.type===`keypress`?Bn(e):e.type===`keydown`||e.type===`keyup`?e.keyCode:0}})),ur=Un(x({},Zn,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0})),dr=Un(x({},Wn,{submitter:0})),fr=Un(x({},Kn,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:cr})),pr=Un(x({},Wn,{propertyName:0,elapsedTime:0,pseudoElement:0})),mr=Un(x({},Zn,{deltaX:function(e){return`deltaX`in e?e.deltaX:`wheelDeltaX`in e?-e.wheelDeltaX:0},deltaY:function(e){return`deltaY`in e?e.deltaY:`wheelDeltaY`in e?-e.wheelDeltaY:`wheelDelta`in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0})),hr=Un(x({},Wn,{newState:0,oldState:0,source:0})),gr=[9,13,27,32],_r=Nn&&`CompositionEvent`in window,vr=null;Nn&&`documentMode`in document&&(vr=document.documentMode);var yr=Nn&&`TextEvent`in window&&!vr,br=Nn&&(!_r||vr&&8<vr&&11>=vr),xr=` `,Sr=!1;function Cr(e,t){switch(e){case`keyup`:return gr.indexOf(t.keyCode)!==-1;case`keydown`:return t.keyCode!==229;case`keypress`:case`mousedown`:case`focusout`:return!0;default:return!1}}function wr(e){return e=e.detail,typeof e==`object`&&`data`in e?e.data:null}var Tr=!1;function Er(e,t){switch(e){case`compositionend`:return wr(t);case`keypress`:return t.which===32?(Sr=!0,xr):null;case`textInput`:return e=t.data,e===xr&&Sr?null:e;default:return null}}function Dr(e,t){if(Tr)return e===`compositionend`||!_r&&Cr(e,t)?(e=zn(),Rn=Ln=In=null,Tr=!1,e):null;switch(e){case`paste`:return null;case`keypress`:if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case`compositionend`:return br&&t.locale!==`ko`?null:t.data;default:return null}}var Or={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function kr(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t===`input`?!!Or[e.type]:t===`textarea`}function Ar(e,t,n,r){Dn?On?On.push(r):On=[r]:Dn=r,t=Jf(t,`onChange`),0<t.length&&(n=new Gn(`onChange`,`change`,null,n,r),e.push({event:n,listeners:t}))}var jr=null,Mr=null;function Nr(e){Vf(e,0)}function Pr(e){if(ln(Wt(e)))return e}function Fr(e,t){if(e===`change`)return t}var Ir=!1;if(Nn){var Lr;if(Nn){var Rr=`oninput`in document;if(!Rr){var zr=document.createElement(`div`);zr.setAttribute(`oninput`,`return;`),Rr=typeof zr.oninput==`function`}Lr=Rr}else Lr=!1;Ir=Lr&&(!document.documentMode||9<document.documentMode)}function Br(){jr&&(jr.detachEvent(`onpropertychange`,Vr),Mr=jr=null)}function Vr(e){if(e.propertyName===`value`&&Pr(Mr)){var t=[];Ar(t,Mr,e,En(e)),jn(Nr,t)}}function Hr(e,t,n){e===`focusin`?(Br(),jr=t,Mr=n,jr.attachEvent(`onpropertychange`,Vr)):e===`focusout`&&Br()}function Ur(e){if(e===`selectionchange`||e===`keyup`||e===`keydown`)return Pr(Mr)}function Wr(e,t){if(e===`click`)return Pr(t)}function Gr(e,t){if(e===`input`||e===`change`)return Pr(t)}function Kr(e,t){return e===t&&(e!==0||1/e==1/t)||e!==e&&t!==t}var qr=typeof Object.is==`function`?Object.is:Kr;function Jr(e,t){if(qr(e,t))return!0;if(typeof e!=`object`||!e||typeof t!=`object`||!t)return!1;var n=Object.keys(e),r=Object.keys(t);if(n.length!==r.length)return!1;for(r=0;r<n.length;r++){var i=n[r];if(!Ge.call(t,i)||!qr(e[i],t[i]))return!1}return!0}function Yr(e){if(e||=typeof document<`u`?document:void 0,e===void 0)return null;try{return e.activeElement||e.body}catch{return e.body}}function Xr(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function Zr(e,t){var n=Xr(e);e=0;for(var r;n;){if(n.nodeType===3){if(r=e+n.textContent.length,e<=t&&r>=t)return{node:n,offset:t-e};e=r}a:{for(;n;){if(n.nextSibling){n=n.nextSibling;break a}n=n.parentNode}n=void 0}n=Xr(n)}}function Qr(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?Qr(e,t.parentNode):`contains`in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function $r(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=Yr(e.document);t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href==`string`}catch{n=!1}if(n)e=t.contentWindow;else break;t=Yr(e.document)}return t}function ei(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t===`input`&&(e.type===`text`||e.type===`search`||e.type===`tel`||e.type===`url`||e.type===`password`)||t===`textarea`||e.contentEditable===`true`)}var ti=Nn&&`documentMode`in document&&11>=document.documentMode,ni=null,ri=null,ii=null,ai=!1;function oi(e,t,n){var r=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;ai||ni==null||ni!==Yr(r)||(r=ni,`selectionStart`in r&&ei(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),ii&&Jr(ii,r)||(ii=r,r=Jf(ri,`onSelect`),0<r.length&&(t=new Gn(`onSelect`,`select`,null,t,n),e.push({event:t,listeners:r}),t.target=ni)))}function si(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n[`Webkit`+e]=`webkit`+t,n[`Moz`+e]=`moz`+t,n}var ci={animationend:si(`Animation`,`AnimationEnd`),animationiteration:si(`Animation`,`AnimationIteration`),animationstart:si(`Animation`,`AnimationStart`),transitionrun:si(`Transition`,`TransitionRun`),transitionstart:si(`Transition`,`TransitionStart`),transitioncancel:si(`Transition`,`TransitionCancel`),transitionend:si(`Transition`,`TransitionEnd`)},li={},ui={};Nn&&(ui=document.createElement(`div`).style,`AnimationEvent`in window||(delete ci.animationend.animation,delete ci.animationiteration.animation,delete ci.animationstart.animation),`TransitionEvent`in window||delete ci.transitionend.transition);function di(e){if(li[e])return li[e];if(!ci[e])return e;var t=ci[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in ui)return li[e]=t[n];return e}var fi=di(`animationend`),pi=di(`animationiteration`),mi=di(`animationstart`),hi=di(`transitionrun`),gi=di(`transitionstart`),_i=di(`transitioncancel`),vi=di(`transitionend`),yi=new Map,bi=`abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel`.split(` `);bi.push(`scrollEnd`);function xi(e,t){yi.set(e,t),Yt(t,[e])}var Si=0;function Ci(e,t){if(e.name!=null&&e.name!==`auto`)return e.name;if(t.autoName!==null)return t.autoName;e=bd.identifierPrefix;var n=Si++;return e=`_`+e+`t_`+n.toString(32)+`_`,t.autoName=e}function wi(e){if(e==null||typeof e==`string`)return e;var t=null,n=Od;if(n!==null)for(var r=0;r<n.length;r++){var i=e[n[r]];if(i!=null){if(i===`none`)return`none`;t=t==null?i:t+(` `+i)}}return t??e.default}function Ti(e,t){return e=wi(e),t=wi(t),t==null?e===`auto`?null:e:t===`auto`?null:t}var Ei=typeof reportError==`function`?reportError:function(e){if(typeof window==`object`&&typeof window.ErrorEvent==`function`){var t=new window.ErrorEvent(`error`,{bubbles:!0,cancelable:!0,message:typeof e==`object`&&e&&typeof e.message==`string`?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process==`object`&&typeof process.emit==`function`){process.emit(`uncaughtException`,e);return}console.error(e)},Di=[],Oi=0,ki=0;function Ai(){for(var e=Oi,t=ki=Oi=0;t<e;){var n=Di[t];Di[t++]=null;var r=Di[t];Di[t++]=null;var i=Di[t];Di[t++]=null;var a=Di[t];if(Di[t++]=null,r!==null&&i!==null){var o=r.pending;o===null?i.next=i:(i.next=o.next,o.next=i),r.pending=i}a!==0&&Pi(n,i,a)}}function ji(e,t,n,r){Di[Oi++]=e,Di[Oi++]=t,Di[Oi++]=n,Di[Oi++]=r,ki|=r,e.lanes|=r,e=e.alternate,e!==null&&(e.lanes|=r)}function Mi(e,t,n,r){return ji(e,t,n,r),Fi(e)}function Ni(e,t){return ji(e,null,null,t),Fi(e)}function Pi(e,t,n){e.lanes|=n;var r=e.alternate;r!==null&&(r.lanes|=n);for(var i=!1,a=e.return;a!==null;)a.childLanes|=n,r=a.alternate,r!==null&&(r.childLanes|=n),a.tag===22&&(e=a.stateNode,e===null||e._visibility&1||(i=!0)),e=a,a=a.return;return e.tag===3?(a=e.stateNode,i&&t!==null&&(i=31-ct(n),e=a.hiddenUpdates,r=e[i],r===null?e[i]=[t]:r.push(t),t.lane=n|536870912),a):null}function Fi(e){if(50<kd)throw kd=0,Ad=null,Error(i(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var Ii={};function Li(e,t,n,r){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function Ri(e,t,n,r){return new Li(e,t,n,r)}function zi(e){return e=e.prototype,!(!e||!e.isReactComponent)}function Bi(e,t){var n=e.alternate;return n===null?(n=Ri(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&1206910976,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n.refCleanup=e.refCleanup,n}function Vi(e,t){e.flags&=1206910978;var n=e.alternate;return n===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=n.childLanes,e.lanes=n.lanes,e.child=n.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=n.memoizedProps,e.memoizedState=n.memoizedState,e.updateQueue=n.updateQueue,e.type=n.type,t=n.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function Hi(e,t,n,r,a,o){var s=0;if(r=e,typeof r==`function`)zi(r)&&(s=1);else if(typeof r==`string`)s=qm(e,n,Ae.current)?26:e===`html`||e===`head`||e===`body`?27:5;else a:switch(r){case ge:return e=Ri(31,n,t,a),e.elementType=ge,e.lanes=o,e;case se:return Ui(n.children,a,o,t);case ce:s=8,a|=24;break;case le:return e=Ri(12,n,t,a|2),e.elementType=le,e.lanes=o,e;case fe:return e=Ri(13,n,t,a),e.elementType=fe,e.lanes=o,e;case pe:return e=Ri(19,n,t,a),e.elementType=pe,e.lanes=o,e;case _e:case ye:return e=a|32,e=Ri(30,n,t,e),e.elementType=ye,e.lanes=o,e.stateNode={autoName:null,paired:null,clones:null,ref:null},e;default:if(typeof r==`object`&&r)switch(r.$$typeof){case S:s=10;break a;case ue:s=9;break a;case de:s=11;break a;case me:s=14;break a;case he:s=16,r=null;break a}s=29,n=Error(i(130,e===null?`null`:typeof e,``)),r=null}return t=Ri(s,n,t,a),t.elementType=e,t.type=r,t.lanes=o,t}function Ui(e,t,n,r){return e=Ri(7,e,r,t),e.lanes=n,e}function Wi(e,t,n){return e=Ri(6,e,null,t),e.lanes=n,e}function Gi(e){var t=Ri(18,null,null,0);return t.stateNode=e,t}function Ki(e,t,n){return t=Ri(4,e.children===null?[]:e.children,e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}var qi=new WeakMap;function Ji(e,t){if(typeof e==`object`&&e){var n=qi.get(e);return n===void 0?(t={value:e,source:t,stack:We(t)},qi.set(e,t),t):n}return{value:e,source:t,stack:We(t)}}var Yi=[],Xi=0,Zi=null,Qi=0,$i=[],ea=0,ta=null,na=1,ra=``;function ia(e,t){Yi[Xi++]=Qi,Yi[Xi++]=Zi,Zi=e,Qi=t}function aa(e,t,n){$i[ea++]=na,$i[ea++]=ra,$i[ea++]=ta,ta=e;var r=na;e=ra;var i=32-ct(r)-1;r&=~(1<<i),n+=1;var a=32-ct(t)+i;if(30<a){var o=i-i%5;a=(r&(1<<o)-1).toString(32),r>>=o,i-=o,na=1<<32-ct(t)+i|n<<i|r,ra=a+e}else na=1<<a|n<<i|r,ra=e}function oa(e){e.return!==null&&(ia(e,1),aa(e,1,0))}function sa(e){for(;e===Zi;)Zi=Yi[--Xi],Yi[Xi]=null,Qi=Yi[--Xi],Yi[Xi]=null;for(;e===ta;)ta=$i[--ea],$i[ea]=null,ra=$i[--ea],$i[ea]=null,na=$i[--ea],$i[ea]=null}function ca(e,t){$i[ea++]=na,$i[ea++]=ra,$i[ea++]=ta,na=t.id,ra=t.overflow,ta=e}var la=null,P=null,F=!1,ua=null,da=!1,fa=Error(i(519));function pa(e){throw ya(Ji(Error(i(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?`text`:`HTML`,``)),e)),fa}function ma(e){var t=e.stateNode,n=e.type,r=e.memoizedProps;switch(t[Mt]=e,t[Nt]=r,n){case`dialog`:Q(`cancel`,t),Q(`close`,t);break;case`iframe`:case`object`:case`embed`:Q(`load`,t);break;case`video`:case`audio`:for(n=0;n<zf.length;n++)Q(zf[n],t);break;case`source`:Q(`error`,t);break;case`img`:case`image`:case`link`:Q(`error`,t),Q(`load`,t);break;case`details`:Q(`toggle`,t);break;case`input`:Q(`invalid`,t),pn(t,r.value,r.defaultValue,r.checked,r.defaultChecked,r.type,r.name,!0);break;case`select`:Q(`invalid`,t);break;case`textarea`:Q(`invalid`,t),_n(t,r.value,r.defaultValue,r.children)}n=r.children,typeof n!=`string`&&typeof n!=`number`&&typeof n!=`bigint`||t.textContent===``+n||!0===r.suppressHydrationWarning||ep(t.textContent,n)?(r.popover!=null&&(Q(`beforetoggle`,t),Q(`toggle`,t)),r.onScroll!=null&&Q(`scroll`,t),r.onScrollEnd!=null&&Q(`scrollend`,t),r.onClick!=null&&(t.onclick=N),t=!0):t=!1,t||pa(e,!0)}function ha(e){for(la=e.return;la;)switch(la.tag){case 5:case 31:case 13:da=!1;return;case 27:case 3:da=!0;return;default:la=la.return}}function ga(e){if(e!==la)return!1;if(!F)return ha(e),F=!0,!1;var t=e.tag,n;if((n=t!==3&&t!==27)&&((n=t===5)&&(n=e.type,n=n===`form`||n===`button`||pp(e.type,e.memoizedProps)),n=!n),n&&P&&pa(e),ha(e),t===13){if(e=e.memoizedState,e=e===null?null:e.dehydrated,!e)throw Error(i(317));P=dm(e)}else if(t===31){if(e=e.memoizedState,e=e===null?null:e.dehydrated,!e)throw Error(i(317));P=dm(e)}else t===27?(t=P,Sp(e.type)?(e=um,um=null,P=e):P=t):P=la?lm(e.stateNode.nextSibling):null;return!0}function _a(){P=la=null,F=!1}function va(){var e=ua;return e!==null&&(pd===null?pd=e:pd.push.apply(pd,e),ua=null),e}function ya(e){ua===null?ua=[e]:ua.push(e)}var ba=ke(null),xa=null,Sa=null;function Ca(e,t,n){E(ba,t._currentValue),t._currentValue=n}function wa(e){e._currentValue=ba.current,T(ba)}function Ta(e,t,n){for(;e!==null;){var r=e.alternate;if((e.childLanes&t)===t?r!==null&&(r.childLanes&t)!==t&&(r.childLanes|=t):(e.childLanes|=t,r!==null&&(r.childLanes|=t)),e===n)break;e=e.return}}function Ea(e,t,n,r){var a=e.child;for(a!==null&&(a.return=e);a!==null;){var o=a.dependencies;if(o!==null){var s=a.child;o=o.firstContext;a:for(;o!==null;){var c=o;o=a;for(var l=0;l<t.length;l++)if(c.context===t[l]){o.lanes|=n,c=o.alternate,c!==null&&(c.lanes|=n),Ta(o.return,n,e),r||(s=null);break a}o=c.next}}else if(a.tag===18){if(s=a.return,s===null)throw Error(i(341));s.lanes|=n,o=s.alternate,o!==null&&(o.lanes|=n),Ta(s,n,e),s=null}else a.tag===13&&a.memoizedState!==null&&a.memoizedState.dehydrated===null?(a.lanes|=n,s=a.alternate,s!==null&&(s.lanes|=n),Ta(a.return,n,e),s=a.child,s=s===null?null:s.sibling):s=a.child;if(s!==null)s.return=a;else for(s=a;s!==null;){if(s===e){s=null;break}if(a=s.sibling,a!==null){a.return=s.return,s=a;break}s=s.return}a=s}}function Da(e,t,n,r){e=null;for(var a=t,o=!1;a!==null;){if(!o){if(a.flags&524288)o=!0;else if(a.flags&262144)break}if(a.tag===10){var s=a.alternate;if(s===null)throw Error(i(387));if(s=s.memoizedProps,s!==null){var c=a.type;qr(a.pendingProps.value,s.value)||(e===null?e=[c]:e.push(c))}}else if(a===Ne.current){if(s=a.alternate,s===null)throw Error(i(387));s.memoizedState.memoizedState!==a.memoizedState.memoizedState&&(e===null?e=[sh]:e.push(sh))}a=a.return}return e!==null&&Ea(t,e,n,r),t.flags|=262144,e!==null}function Oa(e){for(e=e.firstContext;e!==null;){if(!qr(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function ka(e){xa=e,Sa=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function Aa(e){return Ma(xa,e)}function ja(e,t){return xa===null&&ka(e),Ma(e,t)}function Ma(e,t){var n=t._currentValue;if(t={context:t,memoizedValue:n,next:null},Sa===null){if(e===null)throw Error(i(308));Sa=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else Sa=Sa.next=t;return n}var Na=typeof AbortController<`u`?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(t,n){e.push(n)}};this.abort=function(){t.aborted=!0,e.forEach(function(e){return e()})}},Pa=t.unstable_scheduleCallback,Fa=t.unstable_NormalPriority,I={$$typeof:S,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function Ia(){return{controller:new Na,data:new Map,refCount:0}}function La(e){e.refCount--,e.refCount===0&&Pa(Fa,function(){e.controller.abort()})}function Ra(e,t){if(e.pendingLanes&4194048){var n=e.transitionTypes;for(n===null&&(n=e.transitionTypes=[]),e=0;e<t.length;e++){var r=t[e];n.indexOf(r)===-1&&n.push(r)}}}var za=null;function Ba(e){var t=e.transitionTypes;return e.transitionTypes=null,t}var Va=null,Ha=0,Ua=0,Wa=null;function Ga(e,t){if(Va===null){var n=Va=[];Ha=0,Ua=Pf(),Wa={status:`pending`,value:void 0,then:function(e){n.push(e)}}}return Ha++,t.then(Ka,Ka),t}function Ka(){if(--Ha===0&&(za=null,Va!==null)){Wa!==null&&(Wa.status=`fulfilled`);var e=Va;Va=null,Ua=0,Wa=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function qa(e,t){var n=[],r={status:`pending`,value:null,reason:null,then:function(e){n.push(e)}};return e.then(function(){r.status=`fulfilled`,r.value=t;for(var e=0;e<n.length;e++)(0,n[e])(t)},function(e){for(r.status=`rejected`,r.reason=e,e=0;e<n.length;e++)(0,n[e])(void 0)}),r}var Ja=C.S;C.S=function(e,t){if(gd=Xe(),typeof t==`object`&&t&&typeof t.then==`function`&&Ga(e,t),za!==null)for(var n=bf;n!==null;)Ra(n,za),n=n.next;if(n=e.types,n!==null){for(var r=bf;r!==null;)Ra(r,n),r=r.next;if(Ua!==0){r=za,r===null&&(r=za=[]);for(var i=0;i<n.length;i++){var a=n[i];r.indexOf(a)===-1&&r.push(a)}}}Ja!==null&&Ja(e,t)};var Ya=ke(null);function Xa(){var e=Ya.current;return e===null?G.pooledCache:e}function Za(e,t){t===null?E(Ya,Ya.current):E(Ya,t.pool)}function Qa(){var e=Xa();return e===null?null:{parent:I._currentValue,pool:e}}var $a=Error(i(460)),eo=Error(i(474)),to=Error(i(542)),no={then:function(){}};function ro(e){return e=e.status,e===`fulfilled`||e===`rejected`}function io(e,t,n){switch(n=e[n],n===void 0?e.push(t):n!==t&&(t.then(N,N),t=n),t.status){case`fulfilled`:return t.value;case`rejected`:throw e=t.reason,co(e),e===void 0&&!(`reason`in t)?Error(i(600)):e;default:if(typeof t.status==`string`)t.then(N,N);else{if(e=G,e!==null&&100<e.shellSuspendCounter)throw Error(i(482));e=t,e.status=`pending`,e.then(function(e){if(t.status===`pending`){var n=t;n.status=`fulfilled`,n.value=e}},function(e){if(t.status===`pending`){var n=t;n.status=`rejected`,n.reason=e}})}switch(t.status){case`fulfilled`:return t.value;case`rejected`:throw e=t.reason,co(e),e}throw oo=t,$a}}function ao(e){try{var t=e._init;return t(e._payload)}catch(e){throw typeof e==`object`&&e&&typeof e.then==`function`?(oo=e,$a):e}}var oo=null;function so(){if(oo===null)throw Error(i(459));var e=oo;return oo=null,e}function co(e){if(e===$a||e===to)throw Error(i(483))}var lo=null,uo=0;function fo(e){var t=uo;return uo+=1,lo===null&&(lo=[]),io(lo,e,t)}function po(e,t){t=t.props.ref,e.ref=t===void 0?null:t}function mo(e,t){throw t.$$typeof===ie?Error(i(525)):(e=Object.prototype.toString.call(t),Error(i(31,e===`[object Object]`?`object with keys {`+Object.keys(t).join(`, `)+`}`:e)))}function ho(e){function t(t,n){if(e){var r=t.deletions;r===null?(t.deletions=[n],t.flags|=16):r.push(n)}}function n(n,r){if(!e)return null;for(;r!==null;)t(n,r),r=r.sibling;return null}function r(e){for(var t=new Map;e!==null;)e.key===null?t.set(e.index,e):t.set(e.key,e),e=e.sibling;return t}function a(e,t){return e=Bi(e,t),e.index=0,e.sibling=null,e}function o(t,n,r){return t.index=r,e?(r=t.alternate,r===null?(t.flags|=134217730,n):(r=r.index,r<n?(t.flags|=2,n):r)):(t.flags|=1048576,n)}function s(t){return e&&t.alternate===null&&(t.flags|=134217730),t}function c(e,t,n,r){return t===null||t.tag!==6?(t=Wi(n,e.mode,r),t.return=e,t):(t=a(t,n),t.return=e,t)}function l(e,t,n,r){var i=n.type;return i===se?(e=d(e,t,n.props.children,r,n.key),po(e,n),e):t!==null&&(t.elementType===i||typeof i==`object`&&i&&i.$$typeof===he&&ao(i)===t.type)?(t=a(t,n.props),po(t,n),t.return=e,t):(t=Hi(n.type,n.key,n.props,null,e.mode,r),po(t,n),t.return=e,t)}function u(e,t,n,r){return t===null||t.tag!==4||t.stateNode.containerInfo!==n.containerInfo||t.stateNode.implementation!==n.implementation?(t=Ki(n,e.mode,r),t.return=e,t):(t=a(t,n.children||[]),t.return=e,t)}function d(e,t,n,r,i){return t===null||t.tag!==7?(t=Ui(n,e.mode,r,i),t.return=e,t):(t=a(t,n),t.return=e,t)}function f(e,t,n){if(typeof t==`string`&&t!==``||typeof t==`number`||typeof t==`bigint`)return t=Wi(``+t,e.mode,n),t.return=e,t;if(typeof t==`object`&&t){switch(t.$$typeof){case ae:return n=Hi(t.type,t.key,t.props,null,e.mode,n),po(n,t),n.return=e,n;case oe:return t=Ki(t,e.mode,n),t.return=e,t;case he:return t=ao(t),f(e,t,n)}if(Te(t)||Se(t))return t=Ui(t,e.mode,n,null),t.return=e,t;if(typeof t.then==`function`)return f(e,fo(t),n);if(t.$$typeof===S)return f(e,ja(e,t),n);mo(e,t)}return null}function p(e,t,n,r){var i=t===null?null:t.key;if(typeof n==`string`&&n!==``||typeof n==`number`||typeof n==`bigint`)return i===null?c(e,t,``+n,r):null;if(typeof n==`object`&&n){switch(n.$$typeof){case ae:return n.key===i?l(e,t,n,r):null;case oe:return n.key===i?u(e,t,n,r):null;case he:return n=ao(n),p(e,t,n,r)}if(Te(n)||Se(n))return i===null?d(e,t,n,r,null):null;if(typeof n.then==`function`)return p(e,t,fo(n),r);if(n.$$typeof===S)return p(e,t,ja(e,n),r);mo(e,n)}return null}function m(e,t,n,r,i){if(typeof r==`string`&&r!==``||typeof r==`number`||typeof r==`bigint`)return e=e.get(n)||null,c(t,e,``+r,i);if(typeof r==`object`&&r){switch(r.$$typeof){case ae:return e=e.get(r.key===null?n:r.key)||null,l(t,e,r,i);case oe:return e=e.get(r.key===null?n:r.key)||null,u(t,e,r,i);case he:return r=ao(r),m(e,t,n,r,i)}if(Te(r)||Se(r))return e=e.get(n)||null,d(t,e,r,i,null);if(typeof r.then==`function`)return m(e,t,n,fo(r),i);if(r.$$typeof===S)return m(e,t,n,ja(t,r),i);mo(t,r)}return null}function h(i,a,s,c){for(var l=null,u=null,d=a,h=a=0,g=null;d!==null&&h<s.length;h++){d.index>h?(g=d,d=null):g=d.sibling;var _=p(i,d,s[h],c);if(_===null){d===null&&(d=g);break}e&&d&&_.alternate===null&&t(i,d),a=o(_,a,h),u===null?l=_:u.sibling=_,u=_,d=g}if(h===s.length)return n(i,d),F&&ia(i,h),l;if(d===null){for(;h<s.length;h++)d=f(i,s[h],c),d!==null&&(a=o(d,a,h),u===null?l=d:u.sibling=d,u=d);return F&&ia(i,h),l}for(d=r(d);h<s.length;h++)g=m(d,i,h,s[h],c),g!==null&&(e&&(_=g.alternate,_!==null&&d.delete(_.key===null?h:_.key)),a=o(g,a,h),u===null?l=g:u.sibling=g,u=g);return e&&d.forEach(function(e){return t(i,e)}),F&&ia(i,h),l}function g(a,s,c,l){if(c==null)throw Error(i(151));for(var u=null,d=null,h=s,g=s=0,_=null,v=c.next();h!==null&&!v.done;g++,v=c.next()){h.index>g?(_=h,h=null):_=h.sibling;var y=p(a,h,v.value,l);if(y===null){h===null&&(h=_);break}e&&h&&y.alternate===null&&t(a,h),s=o(y,s,g),d===null?u=y:d.sibling=y,d=y,h=_}if(v.done)return n(a,h),F&&ia(a,g),u;if(h===null){for(;!v.done;g++,v=c.next())v=f(a,v.value,l),v!==null&&(s=o(v,s,g),d===null?u=v:d.sibling=v,d=v);return F&&ia(a,g),u}for(h=r(h);!v.done;g++,v=c.next())v=m(h,a,g,v.value,l),v!==null&&(e&&(_=v.alternate,_!==null&&h.delete(_.key===null?g:_.key)),s=o(v,s,g),d===null?u=v:d.sibling=v,d=v);return e&&h.forEach(function(e){return t(a,e)}),F&&ia(a,g),u}function _(e,r,o,c){if(typeof o==`object`&&o&&o.type===se&&o.key===null&&o.props.ref===void 0&&(o=o.props.children),typeof o==`object`&&o){switch(o.$$typeof){case ae:a:{for(var l=o.key;r!==null;){if(r.key===l){if(l=o.type,l===se){if(r.tag===7){n(e,r.sibling),c=a(r,o.props.children),po(c,o),c.return=e,e=c;break a}}else if(r.elementType===l||typeof l==`object`&&l&&l.$$typeof===he&&ao(l)===r.type){n(e,r.sibling),c=a(r,o.props),po(c,o),c.return=e,e=c;break a}n(e,r);break}t(e,r),r=r.sibling}o.type===se?(c=Ui(o.props.children,e.mode,c,o.key),po(c,o),c.return=e,e=c):(c=Hi(o.type,o.key,o.props,null,e.mode,c),po(c,o),c.return=e,e=c)}return s(e);case oe:a:{for(l=o.key;r!==null;){if(r.key===l){if(r.tag===4&&r.stateNode.containerInfo===o.containerInfo&&r.stateNode.implementation===o.implementation){n(e,r.sibling),c=a(r,o.children||[]),c.return=e,e=c;break a}n(e,r);break}t(e,r),r=r.sibling}c=Ki(o,e.mode,c),c.return=e,e=c}return s(e);case he:return o=ao(o),_(e,r,o,c)}if(Te(o))return h(e,r,o,c);if(Se(o)){if(l=Se(o),typeof l!=`function`)throw Error(i(150));return o=l.call(o),g(e,r,o,c)}if(typeof o.then==`function`)return _(e,r,fo(o),c);if(o.$$typeof===S)return _(e,r,ja(e,o),c);mo(e,o)}return typeof o==`string`&&o!==``||typeof o==`number`||typeof o==`bigint`?(o=``+o,r!==null&&r.tag===6?(n(e,r.sibling),c=a(r,o),c.return=e,e=c):(n(e,r),c=Wi(o,e.mode,c),c.return=e,e=c),s(e)):n(e,r)}return function(e,t,n,r){try{uo=0;var i=_(e,t,n,r);return lo=null,i}catch(t){if(t===$a||t===to)throw t;var a=Ri(29,t,null,e.mode);return a.lanes=r,a.return=e,a}}}var go=ho(!0),_o=ho(!1),vo=!1;function yo(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function bo(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function xo(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function So(e,t,n){var r=e.updateQueue;if(r===null)return null;if(r=r.shared,W&2){var i=r.pending;return i===null?t.next=t:(t.next=i.next,i.next=t),r.pending=t,t=Fi(e),Pi(e,null,n),t}return ji(e,r,t,n),Fi(e)}function Co(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,n&4194048)){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,Tt(e,n)}}function wo(e,t){var n=e.updateQueue,r=e.alternate;if(r!==null&&(r=r.updateQueue,n===r)){var i=null,a=null;if(n=n.firstBaseUpdate,n!==null){do{var o={lane:n.lane,tag:n.tag,payload:n.payload,callback:null,next:null};a===null?i=a=o:a=a.next=o,n=n.next}while(n!==null);a===null?i=a=t:a=a.next=t}else i=a=t;n={baseState:r.baseState,firstBaseUpdate:i,lastBaseUpdate:a,shared:r.shared,callbacks:r.callbacks},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}var To=!1;function Eo(){if(To){var e=Wa;if(e!==null)throw e}}function Do(e,t,n,r){To=!1;var i=e.updateQueue;vo=!1;var a=i.firstBaseUpdate,o=i.lastBaseUpdate,s=i.shared.pending;if(s!==null){i.shared.pending=null;var c=s,l=c.next;c.next=null,o===null?a=l:o.next=l,o=c;var u=e.alternate;u!==null&&(u=u.updateQueue,s=u.lastBaseUpdate,s!==o&&(s===null?u.firstBaseUpdate=l:s.next=l,u.lastBaseUpdate=c))}if(a!==null){var d=i.baseState;o=0,u=l=c=null,s=a;do{var f=s.lane&-536870913,p=f!==s.lane;if(p?(q&f)===f:(r&f)===f){f!==0&&f===Ua&&(To=!0),u!==null&&(u=u.next={lane:0,tag:s.tag,payload:s.payload,callback:null,next:null});a:{var m=e,h=s;f=t;var g=n;switch(h.tag){case 1:if(m=h.payload,typeof m==`function`){d=m.call(g,d,f);break a}d=m;break a;case 3:m.flags=m.flags&-65537|128;case 0:if(m=h.payload,f=typeof m==`function`?m.call(g,d,f):m,f==null)break a;d=x({},d,f);break a;case 2:vo=!0}}f=s.callback,f!==null&&(e.flags|=64,p&&(e.flags|=8192),p=i.callbacks,p===null?i.callbacks=[f]:p.push(f))}else p={lane:f,tag:s.tag,payload:s.payload,callback:s.callback,next:null},u===null?(l=u=p,c=d):u=u.next=p,o|=f;if(s=s.next,s===null){if(s=i.shared.pending,s===null)break;p=s,s=p.next,p.next=null,i.lastBaseUpdate=p,i.shared.pending=null}}while(1);u===null&&(c=d),i.baseState=c,i.firstBaseUpdate=l,i.lastBaseUpdate=u,a===null&&(i.shared.lanes=0),sd|=o,e.lanes=o,e.memoizedState=d}}function Oo(e,t){if(typeof e!=`function`)throw Error(i(191,e));e.call(t)}function ko(e,t){var n=e.callbacks;if(n!==null)for(e.callbacks=null,e=0;e<n.length;e++)Oo(n[e],t)}var Ao=ke(null),jo=ke(0);function Mo(e,t){e=od,E(jo,e),E(Ao,t),od=e|t.baseLanes}function No(){E(jo,od),E(Ao,Ao.current)}function Po(){od=jo.current,T(Ao),T(jo)}var Fo=ke(null),Io=null;function Lo(e){var t=e.alternate;E(Ho,Ho.current&1),E(Fo,e),Io===null&&(t===null||Ao.current!==null||t.memoizedState!==null)&&(Io=e)}function Ro(e){E(Ho,Ho.current),E(Fo,e),Io===null&&(Io=e)}function zo(e){e.tag===22?(E(Ho,Ho.current),E(Fo,e),Io===null&&(Io=e)):Bo()}function Bo(){E(Ho,Ho.current),E(Fo,Fo.current)}function Vo(e){T(Fo),Io===e&&(Io=null),T(Ho)}var Ho=ke(0);function Uo(e,t){E(Fo,Fo.current),E(Ho,t)}function Wo(e){T(Ho),T(Fo),Io===e&&(Io=null)}function Go(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||om(n)||sm(n)))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!==`independent`){if(t.flags&128)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var Ko=0,L=null,R=null,qo=null,Jo=!1,Yo=!1,Xo=!1,Zo=0,Qo=0,$o=null,es=0;function z(){throw Error(i(321))}function ts(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!qr(e[n],t[n]))return!1;return!0}function ns(e,t,n,r,i,a){return Ko=a,L=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,C.H=e===null||e.memoizedState===null?vc:yc,Xo=!1,a=n(r,i),Xo=!1,Yo&&(a=is(t,n,r,i)),rs(e),a}function rs(e){C.H=_c;var t=R!==null&&R.next!==null;if(Ko=0,qo=R=L=null,Jo=!1,Qo=0,$o=null,t)throw Error(i(300));e===null||Ic||(e=e.dependencies,e!==null&&Oa(e)&&(Ic=!0))}function is(e,t,n,r){L=e;var a=0;do{if(Yo&&($o=null),Qo=0,Yo=!1,25<=a)throw Error(i(301));if(a+=1,qo=R=null,e.updateQueue!=null){var o=e.updateQueue;o.lastEffect=null,o.events=null,o.stores=null,o.memoCache!=null&&(o.memoCache.index=0)}C.H=bc,o=t(n,r)}while(Yo);return o}function as(){var e=C.H,t=e.useState()[0];return t=typeof t.then==`function`?ds(t):t,e=e.useState()[0],(R===null?null:R.memoizedState)!==e&&(L.flags|=1024),t}function os(){var e=Zo!==0;return Zo=0,e}function ss(e,t,n){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~n}function cs(e){if(Jo){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}Jo=!1}Ko=0,qo=R=L=null,Yo=!1,Qo=Zo=0,$o=null}function ls(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return qo===null?L.memoizedState=qo=e:qo=qo.next=e,qo}function B(){if(R===null){var e=L.alternate;e=e===null?null:e.memoizedState}else e=R.next;var t=qo===null?L.memoizedState:qo.next;if(t!==null)qo=t,R=e;else{if(e===null)throw L.alternate===null?Error(i(467)):Error(i(310));R=e,e={memoizedState:R.memoizedState,baseState:R.baseState,baseQueue:R.baseQueue,queue:R.queue,next:null},qo===null?L.memoizedState=qo=e:qo=qo.next=e}return qo}function us(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function ds(e){var t=Qo;return Qo+=1,$o===null&&($o=[]),e=io($o,e,t),t=L,(qo===null?t.memoizedState:qo.next)===null&&(t=t.alternate,C.H=t===null||t.memoizedState===null?vc:yc),e}function fs(e){if(typeof e==`object`&&e){if(typeof e.then==`function`)return ds(e);if(e.$$typeof===be)return;if(e.$$typeof===S)return Aa(e)}throw Error(i(438,String(e)))}function ps(e){var t=null,n=L.updateQueue;if(n!==null&&(t=n.memoCache),t==null){var r=L.alternate;r!==null&&(r=r.updateQueue,r!==null&&(r=r.memoCache,r!=null&&(t={data:r.data.map(function(e){return e.slice()}),index:0})))}if(t??={data:[],index:0},n===null&&(n=us(),L.updateQueue=n),n.memoCache=t,n=t.data[t.index],n===void 0)for(n=t.data[t.index]=Array(e),r=0;r<e;r++)n[r]=ve;return t.index++,n}function ms(e,t){return typeof t==`function`?t(e):t}function hs(e){return gs(B(),R,e)}function gs(e,t,n){var r=e.queue;if(r===null)throw Error(i(311));r.lastRenderedReducer=n;var a=e.baseQueue,o=r.pending;if(o!==null){if(a!==null){var s=a.next;a.next=o.next,o.next=s}t.baseQueue=a=o,r.pending=null}if(o=e.baseState,a===null)e.memoizedState=o;else{t=a.next;var c=s=null,l=null,u=t,d=!1;do{var f=u.lane&-536870913;if(f===u.lane?(Ko&f)===f:(q&f)===f){var p=u.revertLane;if(p===0)l!==null&&(l=l.next={lane:0,revertLane:0,gesture:null,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null}),f===Ua&&(d=!0);else if((Ko&p)===p){u=u.next,p===Ua&&(d=!0);continue}else f={lane:0,revertLane:u.revertLane,gesture:null,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null},l===null?(c=l=f,s=o):l=l.next=f,L.lanes|=p,sd|=p;f=u.action,Xo&&n(o,f),o=u.hasEagerState?u.eagerState:n(o,f)}else p={lane:f,revertLane:u.revertLane,gesture:u.gesture,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null},l===null?(c=l=p,s=o):l=l.next=p,L.lanes|=f,sd|=f;u=u.next}while(u!==null&&u!==t);if(l===null?s=o:l.next=c,!qr(o,e.memoizedState)&&(Ic=!0,d&&(n=Wa,n!==null)))throw n;e.memoizedState=o,e.baseState=s,e.baseQueue=l,r.lastRenderedState=o}return a===null&&(r.lanes=0),[e.memoizedState,r.dispatch]}function _s(e){var t=B(),n=t.queue;if(n===null)throw Error(i(311));n.lastRenderedReducer=e;var r=n.dispatch,a=n.pending,o=t.memoizedState;if(a!==null){n.pending=null;var s=a=a.next;do o=e(o,s.action),s=s.next;while(s!==a);qr(o,t.memoizedState)||(Ic=!0),t.memoizedState=o,t.baseQueue===null&&(t.baseState=o),n.lastRenderedState=o}return[o,r]}function vs(e,t,n){var r=L,a=B(),o=F;if(o){if(n===void 0)throw Error(i(407));n=n()}else n=t();var s=!qr((R||a).memoizedState,n);if(s&&(a.memoizedState=n,Ic=!0),a=a.queue,Us(xs.bind(null,r,a,e),[e]),e=a.getSnapshot!==t||s||qo!==null&&!!(qo.memoizedState.tag&1),Rs(e?9:8,{destroy:void 0},bs.bind(null,r,a,n,t),null),e){if(r.flags|=2048,G===null)throw Error(i(349));o||Ko&127||ys(r,t,n)}return n}function ys(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=L.updateQueue,t===null?(t=us(),L.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function bs(e,t,n,r){t.value=n,t.getSnapshot=r,Ss(t)&&Cs(e)}function xs(e,t,n){return n(function(){Ss(t)&&Cs(e)})}function Ss(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!qr(e,n)}catch{return!0}}function Cs(e){var t=Ni(e,2);t!==null&&Pd(t,e,2)}function ws(e){var t=ls();if(typeof e==`function`){var n=e;if(e=n(),Xo){st(!0);try{n()}finally{st(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:ms,lastRenderedState:e},t}function Ts(e,t,n,r){return e.baseState=n,gs(e,R,typeof r==`function`?r:ms)}function Es(e,t,n,r,a){if(mc(e))throw Error(i(485));if(e=t.action,e!==null){var o={payload:a,action:e,next:null,isTransition:!0,status:`pending`,value:null,reason:null,listeners:[],then:function(e){o.listeners.push(e)}};C.T===null?o.isTransition=!1:n(!0),r(o),n=t.pending,n===null?(o.next=t.pending=o,Ds(t,o)):(o.next=n.next,t.pending=n.next=o)}}function Ds(e,t){var n=t.action,r=t.payload,i=e.state;if(t.isTransition){var a=C.T,o={};o.types=a===null?null:a.types,C.T=o;try{var s=n(i,r),c=C.S;c!==null&&c(o,s),Os(e,t,s)}catch(n){As(e,t,n)}finally{a!==null&&o.types!==null&&(a.types=o.types),C.T=a}}else try{a=n(i,r),Os(e,t,a)}catch(n){As(e,t,n)}}function Os(e,t,n){typeof n==`object`&&n&&typeof n.then==`function`?n.then(function(n){ks(e,t,n)},function(n){return As(e,t,n)}):ks(e,t,n)}function ks(e,t,n){t.status=`fulfilled`,t.value=n,js(t),e.state=n,t=e.pending,t!==null&&(n=t.next,n===t?e.pending=null:(n=n.next,t.next=n,Ds(e,n)))}function As(e,t,n){var r=e.pending;if(e.pending=null,r!==null){r=r.next;do t.status=`rejected`,t.reason=n,js(t),t=t.next;while(t!==r)}e.action=null}function js(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function Ms(e,t){return t}function Ns(e,t){if(F){var n=G.formState;if(n!==null){a:{var r=L;if(F){if(P){b:{for(var i=P,a=da;i.nodeType!==8;){if(!a){i=null;break b}if(i=lm(i.nextSibling),i===null){i=null;break b}}a=i.data,i=a===`F!`||a===`F`?i:null}if(i){P=lm(i.nextSibling),r=i.data===`F!`;break a}}pa(r)}r=!1}r&&(t=n[0])}}return n=ls(),n.memoizedState=n.baseState=t,r={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Ms,lastRenderedState:t},n.queue=r,n=dc.bind(null,L,r),r.dispatch=n,r=ws(!1),a=pc.bind(null,L,!1,r.queue),r=ls(),i={state:t,dispatch:null,action:e,pending:null},r.queue=i,n=Es.bind(null,L,i,a,n),i.dispatch=n,r.memoizedState=e,[t,n,!1]}function Ps(e){return Fs(B(),R,e)}function Fs(e,t,n){if(t=gs(e,t,Ms)[0],e=hs(ms)[0],typeof t==`object`&&t&&typeof t.then==`function`)try{var r=ds(t)}catch(e){throw e===$a?to:e}else r=t;t=B();var i=t.queue,a=i.dispatch;return n!==t.memoizedState&&(L.flags|=2048,Rs(9,{destroy:void 0},Is.bind(null,i,n),null)),[r,a,e]}function Is(e,t){e.action=t}function Ls(e){var t=B(),n=R;if(n!==null)return Fs(t,n,e);B(),t=t.memoizedState,n=B();var r=n.queue.dispatch;return n.memoizedState=e,[t,r,!1]}function Rs(e,t,n,r){return e={tag:e,create:n,deps:r,inst:t,next:null},t=L.updateQueue,t===null&&(t=us(),L.updateQueue=t),n=t.lastEffect,n===null?t.lastEffect=e.next=e:(r=n.next,n.next=e,e.next=r,t.lastEffect=e),e}function zs(){return B().memoizedState}function Bs(e,t,n,r){var i=ls();L.flags|=e,i.memoizedState=Rs(1|t,{destroy:void 0},n,r===void 0?null:r)}function Vs(e,t,n,r){var i=B();r=r===void 0?null:r;var a=i.memoizedState.inst;R!==null&&r!==null&&ts(r,R.memoizedState.deps)?i.memoizedState=Rs(t,a,n,r):(L.flags|=e,i.memoizedState=Rs(1|t,a,n,r))}function Hs(e,t){Bs(8390656,8,e,t)}function Us(e,t){Vs(2048,8,e,t)}function Ws(e){L.flags|=4;var t=L.updateQueue;if(t===null)t=us(),L.updateQueue=t,t.events=[e];else{var n=t.events;n===null?t.events=[e]:n.push(e)}}function Gs(e){var t=B().memoizedState;return Ws({ref:t,nextImpl:e}),function(){if(W&2)throw Error(i(440));return t.impl.apply(void 0,arguments)}}function Ks(e,t){return Vs(4,2,e,t)}function qs(e,t){return Vs(4,4,e,t)}function Js(e,t){if(typeof t==`function`){e=e();var n=t(e);return function(){typeof n==`function`?n():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function Ys(e,t,n){n=n==null?null:n.concat([e]),Vs(4,4,Js.bind(null,t,e),n)}function Xs(){}function Zs(e,t){var n=B();t=t===void 0?null:t;var r=n.memoizedState;return t!==null&&ts(t,r[1])?r[0]:(n.memoizedState=[e,t],e)}function Qs(e,t){var n=B();t=t===void 0?null:t;var r=n.memoizedState;if(t!==null&&ts(t,r[1]))return r[0];if(r=e(),Xo){st(!0);try{e()}finally{st(!1)}}return n.memoizedState=[r,t],r}function $s(e,t,n){return n===void 0||Ko&1073741824&&!(q&261930)?e.memoizedState=t:(e.memoizedState=n,e=Md(),L.lanes|=e,sd|=e,n)}function ec(e,t,n,r){return qr(n,t)?n:Ao.current===null?!(Ko&106)||Ko&1073741824&&!(q&261930)?(Ic=!0,e.memoizedState=n):(e=Md(),L.lanes|=e,sd|=e,t):(e=$s(e,n,r),qr(e,t)||(Ic=!0),e)}function tc(e,t,n,r,i){var a=w.p;w.p=a!==0&&8>a?a:8;var o=C.T,s={};s.types=o===null?null:o.types,C.T=s,pc(e,!1,t,n);try{var c=i(),l=C.S;l!==null&&l(s,c),typeof c==`object`&&c&&typeof c.then==`function`?fc(e,t,qa(c,r),jd(e)):fc(e,t,r,jd(e))}catch(n){fc(e,t,{then:function(){},status:`rejected`,reason:n},jd())}finally{w.p=a,o!==null&&s.types!==null&&(o.types=s.types),C.T=o}}function nc(){}function rc(e,t,n,r){if(e.tag!==5)throw Error(i(476));var a=ic(e).queue;tc(e,a,t,Ee,n===null?nc:function(){return ac(e),n(r)})}function ic(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:Ee,baseState:Ee,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:ms,lastRenderedState:Ee},next:null};var n={};return t.next={memoizedState:n,baseState:n,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:ms,lastRenderedState:n},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function ac(e){var t=ic(e);t.next===null&&(t=e.alternate.memoizedState),fc(e,t.next.queue,{},jd())}function oc(){return Aa(sh)}function sc(){return B().memoizedState}function cc(){return B().memoizedState}function lc(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var n=jd();e=xo(n);var r=So(t,e,n);r!==null&&(Pd(r,t,n),Co(r,t,n)),t={cache:Ia()},e.payload=t;return}t=t.return}}function uc(e,t,n){var r=jd();n={lane:r,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null},mc(e)?hc(t,n):(n=Mi(e,t,n,r),n!==null&&(Pd(n,e,r),gc(n,t,r)))}function dc(e,t,n){fc(e,t,n,jd())}function fc(e,t,n,r){var i={lane:r,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null};if(mc(e))hc(t,i);else{var a=e.alternate;if(e.lanes===0&&(a===null||a.lanes===0)&&(a=t.lastRenderedReducer,a!==null))try{var o=t.lastRenderedState,s=a(o,n);if(i.hasEagerState=!0,i.eagerState=s,qr(s,o))return ji(e,t,i,0),G===null&&Ai(),!1}catch{}if(n=Mi(e,t,i,r),n!==null)return Pd(n,e,r),gc(n,t,r),!0}return!1}function pc(e,t,n,r){if(r={lane:2,revertLane:Pf(),gesture:null,action:r,hasEagerState:!1,eagerState:null,next:null},mc(e)){if(t)throw Error(i(479))}else t=Mi(e,n,r,2),t!==null&&Pd(t,e,2)}function mc(e){var t=e.alternate;return e===L||t!==null&&t===L}function hc(e,t){Yo=Jo=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function gc(e,t,n){if(n&4194048){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,Tt(e,n)}}var _c={readContext:Aa,use:fs,useCallback:z,useContext:z,useEffect:z,useImperativeHandle:z,useLayoutEffect:z,useInsertionEffect:z,useMemo:z,useReducer:z,useRef:z,useState:z,useDebugValue:z,useDeferredValue:z,useTransition:z,useSyncExternalStore:z,useId:z,useHostTransitionStatus:z,useFormState:z,useActionState:z,useOptimistic:z,useMemoCache:z,useCacheRefresh:z,useEffectEvent:z},vc={readContext:Aa,use:fs,useCallback:function(e,t){return ls().memoizedState=[e,t===void 0?null:t],e},useContext:Aa,useEffect:Hs,useImperativeHandle:function(e,t,n){n=n==null?null:n.concat([e]),Bs(4194308,4,Js.bind(null,t,e),n)},useLayoutEffect:function(e,t){return Bs(4194308,4,e,t)},useInsertionEffect:function(e,t){Bs(4,2,e,t)},useMemo:function(e,t){var n=ls();t=t===void 0?null:t;var r=e();if(Xo){st(!0);try{e()}finally{st(!1)}}return n.memoizedState=[r,t],r},useReducer:function(e,t,n){var r=ls();if(n!==void 0){var i=n(t);if(Xo){st(!0);try{n(t)}finally{st(!1)}}}else i=t;return r.memoizedState=r.baseState=i,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:i},r.queue=e,e=e.dispatch=uc.bind(null,L,e),[r.memoizedState,e]},useRef:function(e){var t=ls();return e={current:e},t.memoizedState=e},useState:function(e){e=ws(e);var t=e.queue,n=dc.bind(null,L,t);return t.dispatch=n,[e.memoizedState,n]},useDebugValue:Xs,useDeferredValue:function(e,t){return $s(ls(),e,t)},useTransition:function(){var e=ws(!1);return e=tc.bind(null,L,e.queue,!0,!1),ls().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,n){var r=L,a=ls();if(F){if(n===void 0)throw Error(i(407));n=n()}else{if(n=t(),G===null)throw Error(i(349));q&127||ys(r,t,n)}a.memoizedState=n;var o={value:n,getSnapshot:t};return a.queue=o,Hs(xs.bind(null,r,o,e),[e]),r.flags|=2048,Rs(9,{destroy:void 0},bs.bind(null,r,o,n,t),null),n},useId:function(){var e=ls(),t=G.identifierPrefix;if(F){var n=ra,r=na;n=(r&~(1<<32-ct(r)-1)).toString(32)+n,t=`_`+t+`R_`+n,n=Zo++,0<n&&(t+=`H`+n.toString(32)),t+=`_`}else n=es++,t=`_`+t+`r_`+n.toString(32)+`_`;return e.memoizedState=t},useHostTransitionStatus:oc,useFormState:Ns,useActionState:Ns,useOptimistic:function(e){var t=ls();t.memoizedState=t.baseState=e;var n={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=n,t=pc.bind(null,L,!0,n),n.dispatch=t,[e,t]},useMemoCache:ps,useCacheRefresh:function(){return ls().memoizedState=lc.bind(null,L)},useEffectEvent:function(e){var t=ls(),n={impl:e};return t.memoizedState=n,function(){if(W&2)throw Error(i(440));return n.impl.apply(void 0,arguments)}}},yc={readContext:Aa,use:fs,useCallback:Zs,useContext:Aa,useEffect:Us,useImperativeHandle:Ys,useInsertionEffect:Ks,useLayoutEffect:qs,useMemo:Qs,useReducer:hs,useRef:zs,useState:function(){return hs(ms)},useDebugValue:Xs,useDeferredValue:function(e,t){return ec(B(),R.memoizedState,e,t)},useTransition:function(){var e=hs(ms)[0],t=B().memoizedState;return[typeof e==`boolean`?e:ds(e),t]},useSyncExternalStore:vs,useId:sc,useHostTransitionStatus:oc,useFormState:Ps,useActionState:Ps,useOptimistic:function(e,t){return Ts(B(),R,e,t)},useMemoCache:ps,useCacheRefresh:cc,useEffectEvent:Gs},bc={readContext:Aa,use:fs,useCallback:Zs,useContext:Aa,useEffect:Us,useImperativeHandle:Ys,useInsertionEffect:Ks,useLayoutEffect:qs,useMemo:Qs,useReducer:_s,useRef:zs,useState:function(){return _s(ms)},useDebugValue:Xs,useDeferredValue:function(e,t){var n=B();return R===null?$s(n,e,t):ec(n,R.memoizedState,e,t)},useTransition:function(){var e=_s(ms)[0],t=B().memoizedState;return[typeof e==`boolean`?e:ds(e),t]},useSyncExternalStore:vs,useId:sc,useHostTransitionStatus:oc,useFormState:Ls,useActionState:Ls,useOptimistic:function(e,t){var n=B();return R===null?(n.baseState=e,[e,n.queue.dispatch]):Ts(n,R,e,t)},useMemoCache:ps,useCacheRefresh:cc,useEffectEvent:Gs};function xc(e,t,n,r){t=e.memoizedState,n=n(r,t),n=n==null?t:x({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var Sc={enqueueSetState:function(e,t,n){e=e._reactInternals;var r=jd(),i=xo(r);i.payload=t,n!=null&&(i.callback=n),t=So(e,i,r),t!==null&&(Pd(t,e,r),Co(t,e,r))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var r=jd(),i=xo(r);i.tag=1,i.payload=t,n!=null&&(i.callback=n),t=So(e,i,r),t!==null&&(Pd(t,e,r),Co(t,e,r))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=jd(),r=xo(n);r.tag=2,t!=null&&(r.callback=t),t=So(e,r,n),t!==null&&(Pd(t,e,n),Co(t,e,n))}};function Cc(e,t,n,r,i,a,o){return e=e.stateNode,typeof e.shouldComponentUpdate==`function`?e.shouldComponentUpdate(r,a,o):t.prototype&&t.prototype.isPureReactComponent?!Jr(n,r)||!Jr(i,a):!0}function wc(e,t,n,r){e=t.state,typeof t.componentWillReceiveProps==`function`&&t.componentWillReceiveProps(n,r),typeof t.UNSAFE_componentWillReceiveProps==`function`&&t.UNSAFE_componentWillReceiveProps(n,r),t.state!==e&&Sc.enqueueReplaceState(t,t.state,null)}function Tc(e,t){var n=t;if(`ref`in t)for(var r in n={},t)r!==`ref`&&(n[r]=t[r]);if(e=e.defaultProps)for(var i in n===t&&(n=x({},n)),e)n[i]===void 0&&(n[i]=e[i]);return n}function Ec(e){Ei(e)}function Dc(e){console.error(e)}function Oc(e){Ei(e)}function kc(e,t){try{var n=e.onUncaughtError;n(t.value,{componentStack:t.stack})}catch(e){setTimeout(function(){throw e})}}function Ac(e,t,n){try{var r=e.onCaughtError;r(n.value,{componentStack:n.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(e){setTimeout(function(){throw e})}}function jc(e,t,n){return n=xo(n),n.tag=3,n.payload={element:null},n.callback=function(){kc(e,t)},n}function Mc(e){return e=xo(e),e.tag=3,e}function Nc(e,t,n,r){var i=n.type.getDerivedStateFromError;if(typeof i==`function`){var a=r.value;e.payload=function(){return i(a)},e.callback=function(){Ac(t,n,r)}}var o=n.stateNode;o!==null&&typeof o.componentDidCatch==`function`&&(e.callback=function(){Ac(t,n,r),typeof i!=`function`&&(yd===null?yd=new Set([this]):yd.add(this));var e=r.stack;this.componentDidCatch(r.value,{componentStack:e===null?``:e})})}function Pc(e,t,n,r,a){if(n.flags|=32768,typeof r==`object`&&r&&typeof r.then==`function`){if(t=n.alternate,t!==null&&Da(t,n,a,!0),n=Fo.current,n!==null){switch(n.tag){case 31:case 13:case 19:return Io===null?Kd():n.alternate===null&&Y===0&&(Y=3),n.flags&=-257,n.flags|=65536,n.lanes=a,r===no?n.flags|=16384:(t=n.updateQueue,t===null?n.updateQueue=new Set([r]):t.add(r),mf(e,r,a)),!1;case 22:return n.flags|=65536,r===no?n.flags|=16384:(t=n.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([r])},n.updateQueue=t):(n=t.retryQueue,n===null?t.retryQueue=new Set([r]):n.add(r)),mf(e,r,a)),!1}throw Error(i(435,n.tag))}return mf(e,r,a),Kd(),!1}if(F)return t=Fo.current,t===null?(r!==fa&&(t=Error(i(423),{cause:r}),ya(Ji(t,n))),e=e.current.alternate,e.flags|=65536,a&=-a,e.lanes|=a,r=Ji(r,n),a=jc(e.stateNode,r,a),wo(e,a),Y!==4&&(Y=2)):(!(t.flags&65536)&&(t.flags|=256),t.flags|=65536,t.lanes=a,r!==fa&&(e=Error(i(422),{cause:r}),ya(Ji(e,n)))),!1;var o=Error(i(520),{cause:r});if(o=Ji(o,n),fd===null?fd=[o]:fd.push(o),Y!==4&&(Y=2),t===null)return!0;r=Ji(r,n),n=t;do{switch(n.tag){case 3:return n.flags|=65536,e=a&-a,n.lanes|=e,e=jc(n.stateNode,r,e),wo(n,e),!1;case 1:if(t=n.type,o=n.stateNode,!(n.flags&128)&&(typeof t.getDerivedStateFromError==`function`||o!==null&&typeof o.componentDidCatch==`function`&&(yd===null||!yd.has(o))))return n.flags|=65536,a&=-a,n.lanes|=a,a=Mc(a),Nc(a,e,n,r),wo(n,a),!1;break;case 22:if(n.memoizedState!==null)return n.flags|=65536,!1}n=n.return}while(n!==null);return!1}var Fc=Error(i(461)),Ic=!1;function Lc(e,t,n,r){t.child=e===null?_o(t,null,n,r):go(t,e.child,n,r)}function Rc(e,t,n,r,i){n=n.render;var a=t.ref;if(`ref`in r){var o={};for(var s in r)s!==`ref`&&(o[s]=r[s])}else o=r;return ka(t),r=ns(e,t,n,o,a,i),s=os(),e!==null&&!Ic?(ss(e,t,i),fl(e,t,i)):(F&&s&&oa(t),t.flags|=1,Lc(e,t,r,i),t.child)}function zc(e,t,n,r,i){if(e===null){var a=n.type;return typeof a==`function`&&!zi(a)&&a.defaultProps===void 0&&n.compare===null?(t.tag=15,t.type=a,Bc(e,t,a,r,i)):(e=Hi(n.type,null,r,t,t.mode,i),e.ref=t.ref,e.return=t,t.child=e)}if(a=e.child,!pl(e,i)){var o=a.memoizedProps;if(n=n.compare,n=n===null?Jr:n,n(o,r)&&e.ref===t.ref)return fl(e,t,i)}return t.flags|=1,e=Bi(a,r),e.ref=t.ref,e.return=t,t.child=e}function Bc(e,t,n,r,i){if(e!==null){var a=e.memoizedProps;if(Jr(a,r)&&e.ref===t.ref){if(Ic=!1,t.pendingProps=r=a,pl(e,i))e.flags&131072&&(Ic=!0);else return t.lanes=e.lanes,fl(e,t,i)}}return Jc(e,t,n,r,i)}function Vc(e,t,n,r){var i=r.children,a=e===null?null:e.memoizedState;if(e===null&&t.stateNode===null&&(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),r.mode===`hidden`){if(t.flags&128){if(a=a===null?n:a.baseLanes|n,e!==null){for(r=t.child=e.child,i=0;r!==null;)i=i|r.lanes|r.childLanes,r=r.sibling;r=i&~a}else r=0,t.child=null;return Uc(e,t,a,n,r)}if(n&536870912)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&Za(t,a===null?null:a.cachePool),a===null?No():Mo(t,a),zo(t);else return r=t.lanes=536870912,Uc(e,t,a===null?n:a.baseLanes|n,n,r)}else a===null?(e!==null&&Za(t,null),No(),Bo()):(Za(t,a.cachePool),Mo(t,a),Bo(),t.memoizedState=null);return Lc(e,t,i,n),t.child}function Hc(e,t){return e!==null&&e.tag===22||t.stateNode!==null||(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),t.sibling}function Uc(e,t,n,r,i){var a=Xa();return a=a===null?null:{parent:I._currentValue,pool:a},t.memoizedState={baseLanes:n,cachePool:a},e!==null&&Za(t,null),No(),zo(t),e!==null&&Da(e,t,r,!0),t.childLanes=i,null}function Wc(e,t){return t=rl({mode:t.mode,children:t.children},e.mode),t.ref=e.ref,e.child=t,t.return=e,t}function Gc(e,t,n){return go(t,e.child,null,n),e=Wc(t,t.pendingProps),e.flags|=2,Vo(t),t.memoizedState=null,e}function Kc(e,t,n){var r=t.pendingProps,a=!!(t.flags&128);if(t.flags&=-129,e===null){if(F){if(r.mode===`hidden`)return e=Wc(t,r),t.lanes=536870912,e.memoizedState={baseLanes:0,cachePool:null},Hc(null,e);if(Ro(t),(e=P)?(e=am(e,da),e=e!==null&&e.data===`&`?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:ta===null?null:{id:na,overflow:ra},retryLane:536870912,hydrationErrors:null},n=Gi(e),n.return=t,t.child=n,la=t,P=null)):e=null,e===null)throw pa(t);return t.lanes=536870912,null}return Wc(t,r)}var o=e.memoizedState;if(o!==null){var s=o.dehydrated;if(Ro(t),a){if(t.flags&256)t.flags&=-257,t=Gc(e,t,n);else if(t.memoizedState!==null)t.child=e.child,t.flags|=128,t=null;else throw Error(i(558))}else if(Ic||Da(e,t,n,!1),a=(n&e.childLanes)!==0,Ic||a){if(Ao.current===null){if(r=G,r!==null&&(s=Et(r,n),s!==0&&s!==o.retryLane))throw o.retryLane=s,Ni(e,s),Pd(r,e,s),Fc;Kd()}t=Gc(e,t,n)}else e=o.treeContext,P=lm(s.nextSibling),la=t,F=!0,ua=null,da=!1,e!==null&&ca(t,e),t=Wc(t,r),t.flags|=134221824;return t}return e=Bi(e.child,{mode:r.mode,children:r.children}),e.ref=t.ref,t.child=e,e.return=t,e}function qc(e,t){var n=t.ref;if(n===null)e!==null&&e.ref!==null&&(t.flags|=4194816);else{if(typeof n!=`function`&&typeof n!=`object`)throw Error(i(284));(e===null||e.ref!==n)&&(t.flags|=4194816)}}function Jc(e,t,n,r,i){return ka(t),n=ns(e,t,n,r,void 0,i),r=os(),e!==null&&!Ic?(ss(e,t,i),fl(e,t,i)):(F&&r&&oa(t),t.flags|=1,Lc(e,t,n,i),t.child)}function Yc(e,t,n,r,i,a){return ka(t),t.updateQueue=null,n=is(t,r,n,i),rs(e),r=os(),e!==null&&!Ic?(ss(e,t,a),fl(e,t,a)):(F&&r&&oa(t),t.flags|=1,Lc(e,t,n,a),t.child)}function Xc(e,t,n,r,i){if(ka(t),t.stateNode===null){var a=Ii,o=n.contextType;typeof o==`object`&&o&&(a=Aa(o)),a=new n(r,a),t.memoizedState=a.state!==null&&a.state!==void 0?a.state:null,a.updater=Sc,t.stateNode=a,a._reactInternals=t,a=t.stateNode,a.props=r,a.state=t.memoizedState,a.refs={},yo(t),o=n.contextType,a.context=typeof o==`object`&&o?Aa(o):Ii,a.state=t.memoizedState,o=n.getDerivedStateFromProps,typeof o==`function`&&(xc(t,n,o,r),a.state=t.memoizedState),typeof n.getDerivedStateFromProps==`function`||typeof a.getSnapshotBeforeUpdate==`function`||typeof a.UNSAFE_componentWillMount!=`function`&&typeof a.componentWillMount!=`function`||(o=a.state,typeof a.componentWillMount==`function`&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount==`function`&&a.UNSAFE_componentWillMount(),o!==a.state&&Sc.enqueueReplaceState(a,a.state,null),Do(t,r,a,i),Eo(),a.state=t.memoizedState),typeof a.componentDidMount==`function`&&(t.flags|=4194308),r=!0}else if(e===null){a=t.stateNode;var s=t.memoizedProps,c=Tc(n,s);a.props=c;var l=a.context,u=n.contextType;o=Ii,typeof u==`object`&&u&&(o=Aa(u));var d=n.getDerivedStateFromProps;u=typeof d==`function`||typeof a.getSnapshotBeforeUpdate==`function`,s=t.pendingProps!==s,u||typeof a.UNSAFE_componentWillReceiveProps!=`function`&&typeof a.componentWillReceiveProps!=`function`||(s||l!==o)&&wc(t,a,r,o),vo=!1;var f=t.memoizedState;a.state=f,Do(t,r,a,i),Eo(),l=t.memoizedState,s||f!==l||vo?(typeof d==`function`&&(xc(t,n,d,r),l=t.memoizedState),(c=vo||Cc(t,n,c,r,f,l,o))?(u||typeof a.UNSAFE_componentWillMount!=`function`&&typeof a.componentWillMount!=`function`||(typeof a.componentWillMount==`function`&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount==`function`&&a.UNSAFE_componentWillMount()),typeof a.componentDidMount==`function`&&(t.flags|=4194308)):(typeof a.componentDidMount==`function`&&(t.flags|=4194308),t.memoizedProps=r,t.memoizedState=l),a.props=r,a.state=l,a.context=o,r=c):(typeof a.componentDidMount==`function`&&(t.flags|=4194308),r=!1)}else{a=t.stateNode,bo(e,t),o=t.memoizedProps,u=Tc(n,o),a.props=u,d=t.pendingProps,f=a.context,l=n.contextType,c=Ii,typeof l==`object`&&l&&(c=Aa(l)),s=n.getDerivedStateFromProps,(l=typeof s==`function`||typeof a.getSnapshotBeforeUpdate==`function`)||typeof a.UNSAFE_componentWillReceiveProps!=`function`&&typeof a.componentWillReceiveProps!=`function`||(o!==d||f!==c)&&wc(t,a,r,c),vo=!1,f=t.memoizedState,a.state=f,Do(t,r,a,i),Eo();var p=t.memoizedState;o!==d||f!==p||vo||e!==null&&e.dependencies!==null&&Oa(e.dependencies)?(typeof s==`function`&&(xc(t,n,s,r),p=t.memoizedState),(u=vo||Cc(t,n,u,r,f,p,c)||e!==null&&e.dependencies!==null&&Oa(e.dependencies))?(l||typeof a.UNSAFE_componentWillUpdate!=`function`&&typeof a.componentWillUpdate!=`function`||(typeof a.componentWillUpdate==`function`&&a.componentWillUpdate(r,p,c),typeof a.UNSAFE_componentWillUpdate==`function`&&a.UNSAFE_componentWillUpdate(r,p,c)),typeof a.componentDidUpdate==`function`&&(t.flags|=4),typeof a.getSnapshotBeforeUpdate==`function`&&(t.flags|=1024)):(typeof a.componentDidUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=1024),t.memoizedProps=r,t.memoizedState=p),a.props=r,a.state=p,a.context=c,r=u):(typeof a.componentDidUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!=`function`||o===e.memoizedProps&&f===e.memoizedState||(t.flags|=1024),r=!1)}return a=r,qc(e,t),r=!!(t.flags&128),a||r?(a=t.stateNode,n=r&&typeof n.getDerivedStateFromError!=`function`?null:a.render(),t.flags|=1,e!==null&&r?(t.child=go(t,e.child,null,i),t.child=go(t,null,n,i)):Lc(e,t,n,i),t.memoizedState=a.state,e=t.child):e=fl(e,t,i),e}function Zc(e,t,n,r){return _a(),t.flags|=256,Lc(e,t,n,r),t.child}var Qc={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function $c(e){return{baseLanes:e,cachePool:Qa()}}function el(e,t,n){return e=e===null?0:e.childLanes&~n,t&&(e|=ud),e}function tl(e,t,n){var r=t.pendingProps,i=!1,a=!!(t.flags&128),o;if((o=a)||(o=e!==null&&e.memoizedState===null?!1:!!(Ho.current&2)),o&&(i=!0,t.flags&=-129),o=!!(t.flags&32),t.flags&=-33,e===null){if(F){if(i?Lo(t):Bo(),(e=P)?(e=am(e,da),e=e!==null&&e.data!==`&`?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:ta===null?null:{id:na,overflow:ra},retryLane:536870912,hydrationErrors:null},n=Gi(e),n.return=t,t.child=n,la=t,P=null)):e=null,e===null)throw pa(t);return t.lanes=sm(e)?32:536870912,null}return a=r.children,r=r.fallback,i?(Bo(),i=t.mode,a=rl({mode:`hidden`,children:a},i),r=Ui(r,i,n,null),a.return=t,r.return=t,a.sibling=r,t.child=a,r=t.child,r.memoizedState=$c(n),r.childLanes=el(e,o,n),t.memoizedState=Qc,Hc(null,r)):(Lo(t),nl(t,a))}var s=e.memoizedState;if(s!==null){var c=s.dehydrated;if(c!==null)return al(e,t,a,o,r,c,s,n)}return i?(Bo(),i=r.fallback,a=t.mode,s=e.child,c=s.sibling,r=Bi(s,{mode:`hidden`,children:r.children}),r.subtreeFlags=s.subtreeFlags&1206910976,c===null?(i=Ui(i,a,n,null),i.flags|=2):i=Bi(c,i),i.return=t,r.return=t,r.sibling=i,t.child=r,Hc(null,r),r=t.child,i=e.child.memoizedState,i===null?i=$c(n):(a=i.cachePool,a===null?a=Qa():(s=I._currentValue,a=a.parent===s?a:{parent:s,pool:s}),i={baseLanes:i.baseLanes|n,cachePool:a}),r.memoizedState=i,r.childLanes=el(e,o,n),t.memoizedState=Qc,Hc(e.child,r)):(Lo(t),n=e.child,e=n.sibling,n=Bi(n,{mode:`visible`,children:r.children}),n.return=t,n.sibling=null,e!==null&&(o=t.deletions,o===null?(t.deletions=[e],t.flags|=16):o.push(e)),t.child=n,t.memoizedState=null,n)}function nl(e,t){return t=rl({mode:`visible`,children:t},e.mode),t.return=e,e.child=t}function rl(e,t){return e=Ri(22,e,null,t),e.lanes=0,e}function il(e,t,n){return go(t,e.child,null,n),e=nl(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function al(e,t,n,r,a,o,s,c){if(n)return t.flags&256?(Lo(t),t.flags&=-257,il(e,t,c)):t.memoizedState===null?(Bo(),o=a.fallback,s=t.mode,a=rl({mode:`visible`,children:a.children},s),o=Ui(o,s,c,null),o.flags|=2,a.return=t,o.return=t,a.sibling=o,t.child=a,go(t,e.child,null,c),a=t.child,a.memoizedState=$c(c),a.childLanes=el(e,r,c),t.memoizedState=Qc,Hc(null,a)):(Bo(),t.child=e.child,t.flags|=128,null);if(Lo(t),sm(o)){if(r=o.nextSibling&&o.nextSibling.dataset,r)var l=r.dgst;return r=l,r!==``&&(a=Error(i(419)),a.stack=``,a.digest=r,ya({value:a,source:null,stack:null})),il(e,t,c)}if(Ic||Da(e,t,c,!1),r=(c&e.childLanes)!==0,Ic||r){if(Ao.current!==null)return il(e,t,c);if(r=G,r!==null&&(a=Et(r,c),a!==0&&a!==s.retryLane))throw s.retryLane=a,Ni(e,a),Pd(r,e,a),Fc;return om(o)||Kd(),il(e,t,c)}return om(o)?(t.flags|=192,t.child=e.child,null):(e=s.treeContext,P=lm(o.nextSibling),la=t,F=!0,ua=null,da=!1,e!==null&&ca(t,e),t=nl(t,a.children),t.flags|=134221824,t)}function ol(e,t,n){e.lanes|=t;var r=e.alternate;r!==null&&(r.lanes|=t),Ta(e.return,t,n)}function sl(e){for(var t=null;e!==null;){var n=e.alternate;n!==null&&Go(n)===null&&(t=e),e=e.sibling}return t}function cl(e,t,n,r,i,a){var o=e.memoizedState;o===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:r,tail:n,tailMode:i,treeForkCount:a}:(o.isBackwards=t,o.rendering=null,o.renderingStartTime=0,o.last=r,o.tail=n,o.tailMode=i,o.treeForkCount=a)}function ll(e){var t=e.child;for(e.child=null;t!==null;){var n=t.sibling;t.sibling=e.child,e.child=t,t=n}}function ul(e,t,n){var r=t.pendingProps,i=r.revealOrder,a=r.tail;r=r.children;var o=Ho.current;if(t.flags&128)return Uo(t,o),null;var s=!!(o&2);if(s?(o=o&1|2,t.flags|=128):o&=1,Uo(t,o),i===`backwards`&&e!==null?(ll(e),Lc(e,t,r,n),ll(e)):Lc(e,t,r,n),r=F?Qi:0,!s&&e!==null&&e.flags&128)a:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&ol(e,n,t);else if(e.tag===19)ol(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break a;for(;e.sibling===null;){if(e.return===null||e.return===t)break a;e=e.return}e.sibling.return=e.return,e=e.sibling}switch(i){case`backwards`:n=sl(t.child),n===null?(i=t.child,t.child=null):(i=n.sibling,n.sibling=null,ll(t)),cl(t,!0,i,null,a,r);break;case`unstable_legacy-backwards`:for(n=null,i=t.child,t.child=null;i!==null;){if(e=i.alternate,e!==null&&Go(e)===null){t.child=i;break}e=i.sibling,i.sibling=n,n=i,i=e}cl(t,!0,n,null,a,r);break;case`together`:cl(t,!1,null,null,void 0,r);break;case`independent`:t.memoizedState=null;break;default:n=sl(t.child),n===null?(i=t.child,t.child=null):(i=n.sibling,n.sibling=null),cl(t,!1,i,n,a,r)}return t.child}function dl(e,t,n){var r=t.pendingProps;return Ca(t,t.type,r.value),Lc(e,t,r.children,n),t.child}function fl(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),sd|=t.lanes,(n&t.childLanes)===0){if(e!==null){if(Da(e,t,n,!1),(n&t.childLanes)===0)return null}else return null}if(e!==null&&t.child!==e.child)throw Error(i(153));if(t.child!==null){for(e=t.child,n=Bi(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=Bi(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function pl(e,t){return(e.lanes&t)!==0||(e=e.dependencies,!!(e!==null&&Oa(e)))}function ml(e,t,n){switch(t.tag){case 3:Pe(t,t.stateNode.containerInfo),Ca(t,I,e.memoizedState.cache),_a();break;case 27:case 5:Re(t);break;case 4:Pe(t,t.stateNode.containerInfo);break;case 10:Ca(t,t.type,t.memoizedProps.value);break;case 31:if(t.memoizedState!==null)return t.flags|=128,Ro(t),null;break;case 13:var r=t.memoizedState;if(r!==null){if(r.dehydrated!==null)return Lo(t),t.flags|=128,null;r=Da(e,t,n,!1);var i=t.child.childLanes;return r||(n&i)!==0?tl(e,t,n):(Lo(t),e=fl(e,t,n),e===null?null:e.sibling)}Lo(t);break;case 19:if(t.flags&128)return ul(e,t,n);if(i=!!(e.flags&128),r=(n&t.childLanes)!==0,r||=(Da(e,t,n,!1),(n&t.childLanes)!==0),i){if(r)return ul(e,t,n);t.flags|=128}if(i=t.memoizedState,i!==null&&(i.rendering=null,i.tail=null,i.lastEffect=null),Uo(t,Ho.current),r)break;return null;case 22:return t.lanes=0,Vc(e,t,n,t.pendingProps);case 24:Ca(t,I,e.memoizedState.cache)}return fl(e,t,n)}function hl(e,t,n){if(e!==null){if(e.memoizedProps!==t.pendingProps)Ic=!0;else{if(!pl(e,n)&&!(t.flags&128))return Ic=!1,ml(e,t,n);Ic=!!(e.flags&131072)}}else Ic=!1,F&&t.flags&1048576&&aa(t,Qi,t.index);switch(t.lanes=0,t.tag){case 16:a:{var r=t.pendingProps;if(e=ao(t.elementType),t.type=e,typeof e==`function`)zi(e)?(r=Tc(e,r),t.tag=1,t=Xc(null,t,e,r,n)):(t.tag=0,t=Jc(null,t,e,r,n));else{if(e!=null){var a=e.$$typeof;if(a===de){t.tag=11,t=Rc(null,t,e,r,n);break a}if(a===me){t.tag=14,t=zc(null,t,e,r,n);break a}if(a===S){t.tag=10,t.type=e,t=dl(null,t,n);break a}}throw t=we(e)||e,Error(i(306,t,``))}}return t;case 0:return Jc(e,t,t.type,t.pendingProps,n);case 1:return r=t.type,a=Tc(r,t.pendingProps),Xc(e,t,r,a,n);case 3:a:{if(Pe(t,t.stateNode.containerInfo),e===null)throw Error(i(387));r=t.pendingProps;var o=t.memoizedState;a=o.element,bo(e,t),Do(t,r,null,n);var s=t.memoizedState;if(r=s.cache,Ca(t,I,r),r!==o.cache&&Ea(t,[I],n,!0),Eo(),r=s.element,o.isDehydrated){if(o={element:r,isDehydrated:!1,cache:s.cache},t.updateQueue.baseState=o,t.memoizedState=o,t.flags&256){t=Zc(e,t,r,n);break a}if(r!==a){a=Ji(Error(i(424)),t),ya(a),t=Zc(e,t,r,n);break a}switch(e=t.stateNode.containerInfo,e.nodeType){case 9:e=e.body;break;default:e=e.nodeName===`HTML`?e.ownerDocument.body:e}for(P=lm(e.firstChild),la=t,F=!0,ua=null,da=!0,n=_o(t,null,r,n),t.child=n;n;)n.flags=n.flags&-3|134221824,n=n.sibling}else{if(_a(),r===a){t=fl(e,t,n);break a}Lc(e,t,r,n)}t=t.child}return t;case 26:return qc(e,t),e===null?(n=Nm(t.type,null,t.pendingProps,null))?t.memoizedState=n:F||(t.stateNode=fp(t.type,t.pendingProps,Me.current,t)):t.memoizedState=Nm(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return Re(t),e===null&&F&&(r=t.stateNode=hm(t.type,t.pendingProps,Me.current),la=t,da=!0,a=P,Sp(t.type)?(um=a,P=lm(r.firstChild)):P=a),Lc(e,t,t.pendingProps.children,n),qc(e,t),e===null&&(t.flags|=4194304),t.child;case 5:return e===null&&F&&((a=r=P)&&(r=rm(r,t.type,t.pendingProps,da),r===null?a=!1:(t.stateNode=r,la=t,P=lm(r.firstChild),da=!1,a=!0)),a||pa(t)),Re(t),a=t.type,o=t.pendingProps,s=e===null?null:e.memoizedProps,r=o.children,pp(a,o)?r=null:s!==null&&pp(a,s)&&(t.flags|=32),t.memoizedState!==null&&(a=ns(e,t,as,null,null,n),sh._currentValue=a),qc(e,t),Lc(e,t,r,n),t.child;case 6:return e===null&&F&&((e=n=P)&&(n=im(n,t.pendingProps,da),n===null?e=!1:(t.stateNode=n,la=t,P=null,e=!0)),e||pa(t)),null;case 13:return tl(e,t,n);case 4:return Pe(t,t.stateNode.containerInfo),r=t.pendingProps,e===null?t.child=go(t,null,r,n):Lc(e,t,r,n),t.child;case 11:return Rc(e,t,t.type,t.pendingProps,n);case 7:return r=t.pendingProps,qc(e,t),Lc(e,t,r,n),t.child;case 8:return Lc(e,t,t.pendingProps.children,n),t.child;case 12:return Lc(e,t,t.pendingProps.children,n),t.child;case 10:return dl(e,t,n);case 9:return a=t.type._context,r=t.pendingProps.children,ka(t),a=Aa(a),r=r(a),t.flags|=1,Lc(e,t,r,n),t.child;case 14:return zc(e,t,t.type,t.pendingProps,n);case 15:return Bc(e,t,t.type,t.pendingProps,n);case 19:return ul(e,t,n);case 31:return Kc(e,t,n);case 22:return Vc(e,t,n,t.pendingProps);case 24:return ka(t),r=Aa(I),e===null?(a=Xa(),a===null&&(a=G,o=Ia(),a.pooledCache=o,o.refCount++,o!==null&&(a.pooledCacheLanes|=n),a=o),t.memoizedState={parent:r,cache:a},yo(t),Ca(t,I,a)):((e.lanes&n)!==0&&(bo(e,t),Do(t,null,null,n),Eo()),a=e.memoizedState,o=t.memoizedState,a.parent===r?(r=o.cache,Ca(t,I,r),r!==a.cache&&Ea(t,[I],n,!0)):(a={parent:r,cache:r},t.memoizedState=a,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=a),Ca(t,I,r))),Lc(e,t,t.pendingProps.children,n),t.child;case 30:return t.stateNode===null&&(t.stateNode={autoName:null,paired:null,clones:null,ref:null}),r=t.pendingProps,r.name!=null&&r.name!==`auto`?t.flags|=e===null?18882560:18874368:F&&oa(t),e!==null&&e.memoizedProps.name!==r.name?t.flags|=4194816:qc(e,t),Lc(e,t,r.children,n),t.child;case 29:throw t.pendingProps}throw Error(i(156,t.tag))}function gl(e){e.flags|=4}function _l(e,t,n,r,i){var a;if((a=!!(e.mode&32))&&(a=n===null?Jm(t,r):Jm(t,r)&&(r.src!==n.src||r.srcSet!==n.srcSet)),a){if(e.flags|=16777216,(i&335544128)===i){if(e.stateNode.complete)e.flags|=8192;else if(Ud())e.flags|=8192;else throw oo=no,eo}}else e.flags&=-16777217}function vl(e,t){if(t.type!==`stylesheet`||t.state.loading&4)e.flags&=-16777217;else if(e.flags|=16777216,!Ym(t)){if(Ud())e.flags|=8192;else throw oo=no,eo}}function yl(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag===22?536870912:bt(),e.lanes|=t,dd|=t)}function bl(e,t){if(!F)switch(e.tailMode){case`visible`:break;case`collapsed`:for(var n=e.tail,r=null;n!==null;)n.alternate!==null&&(r=n),n=n.sibling;r===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:r.sibling=null;break;default:for(t=e.tail,n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null}}function V(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,r=0;if(t)for(var i=e.child;i!==null;)n|=i.lanes|i.childLanes,r|=i.subtreeFlags&1206910976,r|=i.flags&1206910976,i.return=e,i=i.sibling;else for(i=e.child;i!==null;)n|=i.lanes|i.childLanes,r|=i.subtreeFlags,r|=i.flags,i.return=e,i=i.sibling;return e.subtreeFlags|=r,e.childLanes=n,t}function xl(e,t,n){var r=t.pendingProps;switch(sa(t),t.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return V(t),null;case 1:return V(t),null;case 3:return n=t.stateNode,r=null,e!==null&&(r=e.memoizedState.cache),t.memoizedState.cache!==r&&(t.flags|=2048),wa(I),Ie(),n.pendingContext&&(n.context=n.pendingContext,n.pendingContext=null),(e===null||e.child===null)&&(ga(t)?gl(t):e===null||e.memoizedState.isDehydrated&&!(t.flags&256)||(t.flags|=1024,va())),V(t),null;case 26:var a=t.type,o=t.memoizedState;return e===null?(gl(t),o===null?(V(t),_l(t,a,null,r,n)):(V(t),vl(t,o))):o?o===e.memoizedState?(V(t),t.flags&=-16777217):(gl(t),V(t),vl(t,o)):(e=e.memoizedProps,e!==r&&gl(t),V(t),_l(t,a,e,r,n)),null;case 27:if(ze(t),n=Me.current,a=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==r&&gl(t);else{if(!r){if(t.stateNode===null)throw Error(i(166));return V(t),t.subtreeFlags&=-33554433,null}e=Ae.current,ga(t)?ma(t,e):(e=hm(a,r,n),t.stateNode=e,gl(t))}return V(t),t.subtreeFlags&=-33554433,null;case 5:if(ze(t),a=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==r&&gl(t);else{if(!r){if(t.stateNode===null)throw Error(i(166));return V(t),t.subtreeFlags&=-33554433,null}if(o=Ae.current,ga(t))ma(t,o);else{var s=lp(Me.current);switch(o){case 1:o=s.createElementNS(`http://www.w3.org/2000/svg`,a);break;case 2:o=s.createElementNS(`http://www.w3.org/1998/Math/MathML`,a);break;default:switch(a){case`svg`:o=s.createElementNS(`http://www.w3.org/2000/svg`,a);break;case`math`:o=s.createElementNS(`http://www.w3.org/1998/Math/MathML`,a);break;case`script`:o=s.createElement(`div`),o.innerHTML=`<script><\/script>`,o=o.removeChild(o.firstChild);break;case`select`:o=typeof r.is==`string`?s.createElement(`select`,{is:r.is}):s.createElement(`select`),r.multiple?o.multiple=!0:r.size&&(o.size=r.size);break;default:o=typeof r.is==`string`?s.createElement(a,{is:r.is}):s.createElement(a)}}o[Mt]=t,o[Nt]=r;a:for(s=t.child;s!==null;){if(s.tag===5||s.tag===6)o.appendChild(s.stateNode);else if(s.tag!==4&&s.tag!==27&&s.child!==null){s.child.return=s,s=s.child;continue}if(s===t)break a;for(;s.sibling===null;){if(s.return===null||s.return===t)break a;s=s.return}s.sibling.return=s.return,s=s.sibling}t.stateNode=o;a:switch(np(o,a,r),a){case`button`:case`input`:case`select`:case`textarea`:r=!!r.autoFocus;break a;case`img`:r=!0;break a;default:r=!1}r&&gl(t)}}return V(t),t.subtreeFlags&=-33554433,_l(t,t.type,e===null?null:e.memoizedProps,t.pendingProps,n),null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==r&&gl(t);else{if(typeof r!=`string`&&t.stateNode===null)throw Error(i(166));if(e=Me.current,ga(t)){if(e=t.stateNode,n=t.memoizedProps,r=null,a=la,a!==null)switch(a.tag){case 27:case 5:r=a.memoizedProps}e[Mt]=t,e=!!(e.nodeValue===n||r!==null&&!0===r.suppressHydrationWarning||ep(e.nodeValue,n)),e||pa(t,!0)}else e=lp(e).createTextNode(r),e[Mt]=t,t.stateNode=e}return V(t),null;case 31:if(n=t.memoizedState,e===null||e.memoizedState!==null){if(r=ga(t),n!==null){if(e===null){if(!r)throw Error(i(318));if(e=t.memoizedState,e=e===null?null:e.dehydrated,!e)throw Error(i(557));e[Mt]=t}else _a(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;V(t),e=!1}else n=va(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=n),e=!0;if(!e)return t.flags&256?(Vo(t),t):(Vo(t),null);if(t.flags&128)throw Error(i(558))}return V(t),null;case 13:if(r=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(a=ga(t),r!==null&&r.dehydrated!==null){if(e===null){if(!a)throw Error(i(318));if(a=t.memoizedState,a=a===null?null:a.dehydrated,!a)throw Error(i(317));a[Mt]=t}else _a(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;V(t),a=!1}else a=va(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=a),a=!0;if(!a)return t.flags&256?(Vo(t),t):(Vo(t),null)}return Vo(t),t.flags&128?(t.lanes=n,t):(n=r!==null,e=e!==null&&e.memoizedState!==null,n&&(r=t.child,a=null,r.alternate!==null&&r.alternate.memoizedState!==null&&r.alternate.memoizedState.cachePool!==null&&(a=r.alternate.memoizedState.cachePool.pool),o=null,r.memoizedState!==null&&r.memoizedState.cachePool!==null&&(o=r.memoizedState.cachePool.pool),o!==a&&(r.flags|=2048)),n!==e&&n&&(t.child.flags|=8192),yl(t,t.updateQueue),V(t),null);case 4:return Ie(),e===null&&Wf(t.stateNode.containerInfo),t.flags|=67108864,V(t),null;case 10:return wa(t.type),V(t),null;case 19:if(Wo(t),r=t.memoizedState,r===null)return V(t),null;if(a=!!(t.flags&128),o=r.rendering,o===null){if(a)bl(r,!1);else{if(Y!==0||e!==null&&e.flags&128)for(e=t.child;e!==null;){if(o=Go(e),o!==null){for(t.flags|=128,bl(r,!1),e=o.updateQueue,t.updateQueue=e,yl(t,e),t.subtreeFlags=0,e=n,n=t.child;n!==null;)Vi(n,e),n=n.sibling;return Uo(t,Ho.current&1|2),F&&ia(t,r.treeForkCount),t.child}e=e.sibling}r.tail!==null&&Xe()>_d&&(t.flags|=128,a=!0,bl(r,!1),t.lanes=4194304)}}else{if(!a){if(e=Go(o),e!==null){if(t.flags|=128,a=!0,e=e.updateQueue,t.updateQueue=e,yl(t,e),bl(r,!0),r.tail===null&&r.tailMode!==`collapsed`&&r.tailMode!==`visible`&&!o.alternate&&!F)return V(t),null}else 2*Xe()-r.renderingStartTime>_d&&n!==536870912&&(t.flags|=128,a=!0,bl(r,!1),t.lanes=4194304)}r.isBackwards?(o.sibling=t.child,t.child=o):(e=r.last,e===null?t.child=o:e.sibling=o,r.last=o)}if(r.tail!==null){e=r.tail;a:{for(n=e;n!==null;){if(n.alternate!==null){n=!1;break a}n=n.sibling}n=!0}return r.rendering=e,r.tail=e.sibling,r.renderingStartTime=Xe(),e.sibling=null,o=Ho.current,o=a?o&1|2:o&1,r.tailMode===`visible`||r.tailMode===`collapsed`||!n||F?Uo(t,o):(n=o,E(Fo,t),E(Ho,n),Io===null&&(Io=t)),F&&ia(t,r.treeForkCount),e}return V(t),null;case 22:case 23:return Vo(t),Po(),r=t.memoizedState!==null,e===null?r&&(t.flags|=8192):e.memoizedState!==null!==r&&(t.flags|=8192),r?n&536870912&&!(t.flags&128)&&(V(t),t.subtreeFlags&6&&(t.flags|=8192)):V(t),n=t.updateQueue,n!==null&&yl(t,n.retryQueue),n=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),r=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(r=t.memoizedState.cachePool.pool),r!==n&&(t.flags|=2048),e!==null&&T(Ya),null;case 24:return n=null,e!==null&&(n=e.memoizedState.cache),t.memoizedState.cache!==n&&(t.flags|=2048),wa(I),V(t),null;case 25:return null;case 30:return t.flags|=33554432,V(t),null}throw Error(i(156,t.tag))}function Sl(e,t){switch(sa(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return wa(I),Ie(),e=t.flags,e&65536&&!(e&128)?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return ze(t),null;case 31:if(t.memoizedState!==null){if(Vo(t),t.alternate===null)throw Error(i(340));_a()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 13:if(Vo(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(i(340));_a()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return Wo(t),e=t.flags,e&65536?(t.flags=e&-65537|128,e=t.memoizedState,e!==null&&(e.rendering=null,e.tail=null),t.flags|=4,t):null;case 4:return Ie(),null;case 10:return wa(t.type),null;case 22:case 23:return Vo(t),Po(),e!==null&&T(Ya),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return wa(I),null;case 25:return null;default:return null}}function Cl(e,t){switch(sa(t),t.tag){case 3:wa(I),Ie();break;case 26:case 27:case 5:ze(t);break;case 4:Ie();break;case 31:t.memoizedState!==null&&Vo(t);break;case 13:Vo(t);break;case 19:Wo(t);break;case 10:wa(t.type);break;case 22:case 23:Vo(t),Po(),e!==null&&T(Ya);break;case 24:wa(I)}}function wl(e,t){try{var n=t.updateQueue,r=n===null?null:n.lastEffect;if(r!==null){var i=r.next;n=i;do{if((n.tag&e)===e){r=void 0;var a=n.create,o=n.inst;r=a(),o.destroy=r}n=n.next}while(n!==i)}}catch(e){Z(t,t.return,e)}}function Tl(e,t,n){try{var r=t.updateQueue,i=r===null?null:r.lastEffect;if(i!==null){var a=i.next;r=a;do{if((r.tag&e)===e){var o=r.inst,s=o.destroy;if(s!==void 0){o.destroy=void 0,i=t;var c=n,l=s;try{l()}catch(e){Z(i,c,e)}}}r=r.next}while(r!==a)}}catch(e){Z(t,t.return,e)}}function El(e){var t=e.updateQueue;if(t!==null){var n=e.stateNode;try{ko(t,n)}catch(t){Z(e,e.return,t)}}}function Dl(e,t,n){n.props=Tc(e.type,e.memoizedProps),n.state=e.memoizedState;try{n.componentWillUnmount()}catch(n){Z(e,t,n)}}function Ol(e,t){try{var n=e.ref;if(n!==null){switch(e.tag){case 26:case 27:case 5:var r=e.stateNode;break;case 30:var i=e.stateNode,a=Ci(e.memoizedProps,i);(i.ref===null||i.ref.name!==a)&&(i.ref=Pp(a)),r=i.ref;break;case 7:if(e.stateNode===null){var o=new Fp(e);f(e.child,!1,Qp,o,void 0,void 0),e.stateNode=o}r=e.stateNode;break;default:r=e.stateNode}typeof n==`function`?e.refCleanup=n(r):n.current=r}}catch(n){Z(e,t,n)}}function kl(e,t){var n=e.ref,r=e.refCleanup;if(n!==null){if(typeof r==`function`)try{r()}catch(n){Z(e,t,n)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof n==`function`)try{n(null)}catch(n){Z(e,t,n)}else n.current=null}}function Al(e,t){if((e.tag===5||e.tag===27||e.tag===6)&&e.alternate===null&&t!==null)for(var n=0;n<t.length;n++)em(e.stateNode,t[n])}function jl(e){for(var t=e.return;t!==null&&(Pl(t)&&em(e.stateNode,t.stateNode),!Nl(t));)t=t.return}function Ml(e){for(var t=e.return;t!==null&&(Pl(t)&&tm(e.stateNode,t.stateNode),!Nl(t));)t=t.return}function Nl(e){return e.tag===5||e.tag===3||e.tag===27}function Pl(e){return e&&e.tag===7&&e.stateNode!==null}function Fl(e){var t=e.type,n=e.memoizedProps,r=e.stateNode;try{a:switch(t){case`button`:case`input`:case`select`:case`textarea`:n.autoFocus&&r.focus();break a;case`img`:n.src?r.src=n.src:n.srcSet&&(r.srcset=n.srcSet)}}catch(t){Z(e,e.return,t)}}function Il(e,t,n){try{var r=e.stateNode;ip(r,e.type,n,t),r[Nt]=t}catch(t){Z(e,e.return,t)}}function Ll(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&Sp(e.type)||e.tag===4}function Rl(e){a:for(;;){for(;e.sibling===null;){if(e.return===null||Ll(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&Sp(e.type)||e.flags&2||e.child===null||e.tag===4)continue a;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function zl(e,t,n,r){var i=e.tag;if(i===5||i===6)i=e.stateNode,t?(n.nodeType===9?n.body:n.nodeName===`HTML`?n.ownerDocument.body:n).insertBefore(i,t):(t=n.nodeType===9?n.body:n.nodeName===`HTML`?n.ownerDocument.body:n,t.appendChild(i),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=N)),Al(e,r),A=!0;else if(i!==4&&(i===27&&(Al(e,r),r=null,Sp(e.type)&&(n=e.stateNode,t=null)),e=e.child,e!==null))for(zl(e,t,n,r),e=e.sibling;e!==null;)zl(e,t,n,r),e=e.sibling}function Bl(e,t,n,r){var i=e.tag;if(i===5||i===6)i=e.stateNode,t?n.insertBefore(i,t):n.appendChild(i),Al(e,r),A=!0;else if(i!==4&&(i===27&&(Al(e,r),r=null,Sp(e.type)&&(n=e.stateNode)),e=e.child,e!==null))for(Bl(e,t,n,r),e=e.sibling;e!==null;)Bl(e,t,n,r),e=e.sibling}function Vl(e){var t=e.stateNode,n=e.memoizedProps;try{for(var r=e.type,i=t.attributes;i.length;)t.removeAttributeNode(i[0]);np(t,r,n),t[Mt]=e,t[Nt]=n}catch(t){Z(e,e.return,t)}}var Hl=!1,Ul=null;function Wl(e){(e.tag===30||e.subtreeFlags&33554432)&&(Hl=!0)}var Gl=null;function Kl(){var e=Gl;return Gl=null,e}var ql=0;function Jl(e,t,n,r,i){return ql=0,Yl(e.child,t,n,r,i)}function Yl(e,t,n,r,i){for(var a=!1;e!==null;){if(e.tag===5){var o=e.stateNode;if(r!==null){var s=Op(o);r.push(s),s.view&&(a=!0)}else a||Op(o).view&&(a=!0);Hl=!0,Tp(o,ql===0?t:t+`_`+ql,n),ql++}else(e.tag!==22||e.memoizedState===null)&&(e.tag===30&&i||Yl(e.child,t,n,r,i)&&(a=!0));e=e.sibling}return a}function Xl(e,t){for(;e!==null;)e.tag===5?Ep(e.stateNode,e.memoizedProps):(e.tag!==22||e.memoizedState===null)&&(e.tag===30&&t||Xl(e.child,t)),e=e.sibling}function Zl(e){if(e.subtreeFlags&18874368)for(e=e.child;e!==null;){if((e.tag!==22||e.memoizedState===null)&&(Zl(e),e.tag===30&&e.flags&18874368&&e.stateNode.paired)){var t=e.memoizedProps;if(t.name==null||t.name===`auto`)throw Error(i(544));var n=t.name;t=Ti(t.default,t.share),t!==`none`&&(Jl(e,n,t,null,!1)||Xl(e.child,!1))}e=e.sibling}}function Ql(e,t){if(e.tag===30){var n=e.stateNode,r=e.memoizedProps,i=Ci(r,n),a=Ti(r.default,n.paired?r.share:r.enter);a===`none`?Zl(e):Jl(e,i,a,null,!1)?(Zl(e),n.paired||t||Nd(e,r.onEnter)):Xl(e.child,!1)}else if(e.subtreeFlags&33554432)for(e=e.child;e!==null;)Ql(e,t),e=e.sibling;else Zl(e)}function $l(e){if(Ul!==null&&Ul.size!==0){var t=Ul;if(e.subtreeFlags&18874368)for(e=e.child;e!==null;){if(e.tag!==22||e.memoizedState===null){if(e.tag===30&&e.flags&18874368){var n=e.memoizedProps,r=n.name;if(r!=null&&r!==`auto`){var i=t.get(r);if(i!==void 0){var a=Ti(n.default,n.share);if(a!==`none`&&(Jl(e,r,a,null,!1)?(a=e.stateNode,i.paired=a,a.paired=i,Nd(e,n.onShare)):Xl(e.child,!1)),t.delete(r),t.size===0)break}}}$l(e)}e=e.sibling}}}function eu(e){if(e.tag===30){var t=e.memoizedProps,n=Ci(t,e.stateNode),r=Ul===null?void 0:Ul.get(n),i=Ti(t.default,r===void 0?t.exit:t.share);i!==`none`&&(Jl(e,n,i,null,!1)?r===void 0?Nd(e,t.onExit):(i=e.stateNode,r.paired=i,i.paired=r,Ul.delete(n),Nd(e,t.onShare)):Xl(e.child,!1)),Ul!==null&&$l(e)}else if(e.subtreeFlags&33554432)for(e=e.child;e!==null;)eu(e),e=e.sibling;else Ul!==null&&$l(e)}function tu(e){for(e=e.child;e!==null;){if(e.tag===30){var t=e.memoizedProps,n=Ci(t,e.stateNode);t=Ti(t.default,t.update),e.flags&=-5,t!==`none`&&Jl(e,n,t,e.memoizedState=[],!1)}else e.subtreeFlags&33554432&&tu(e);e=e.sibling}}function nu(e){if(e.subtreeFlags&18874368)for(e=e.child;e!==null;){if(e.tag!==22||e.memoizedState===null){if(e.tag===30&&e.flags&18874368){var t=e.stateNode;t.paired!==null&&(t.paired=null,Xl(e.child,!1))}nu(e)}e=e.sibling}}function ru(e){if(e.tag===30)e.stateNode.paired=null,Xl(e.child,!1),nu(e);else if(e.subtreeFlags&33554432)for(e=e.child;e!==null;)ru(e),e=e.sibling;else nu(e)}function iu(e){for(e=e.child;e!==null;)e.tag===30?Xl(e.child,!1):e.subtreeFlags&33554432&&iu(e),e=e.sibling}function au(e,t,n,r,i,a,o){for(var s=!1;t!==null;){if(t.tag===5){var c=t.stateNode;if(a!==null&&ql<a.length){var l=a[ql],u=Op(c);(l.view||u.view)&&(s=!0);var d;if(d=!(e.flags&4)){if(u.clip)d=!0;else{d=l.rect;var f=u.rect;d=d.y!==f.y||d.x!==f.x||d.height!==f.height||d.width!==f.width}}d&&(e.flags|=4),u.abs?u=!l.abs:(l=l.rect,u=u.rect,u=l.height!==u.height||l.width!==u.width),u&&(e.flags|=32)}else e.flags|=32;e.flags&4&&Tp(c,ql===0?n:n+`_`+ql,i),s&&e.flags&4||(Gl===null&&(Gl=[]),Gl.push(c,ql===0?r:r+`_`+ql,t.memoizedProps)),ql++}else(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&o?e.flags|=t.flags&32:au(e,t.child,n,r,i,a,o)&&(s=!0));t=t.sibling}return s}function ou(e,t){for(e=e.child;e!==null;){if(e.tag===30){var n=e.memoizedProps,r=e.stateNode,i=Ci(n,r),a=Ti(n.default,n.update);if(t){r=r.clones;var o=r===null?null:r.map(kp)}else o=e.memoizedState,e.memoizedState=null;r=e;var s=e.child;ql=0,i=au(r,s,i,i,a,o,!1),e.flags&4&&i&&(t||Nd(e,n.onUpdate))}else e.subtreeFlags&33554432&&ou(e,t);e=e.sibling}}var su=!1,H=!1,cu=!1,lu=!1,uu=typeof WeakSet==`function`?WeakSet:Set,du=null,fu=!1,pu=!1,mu=!1,hu=!1;function gu(e,t,n){if(e=e.containerInfo,sp=gh,e=$r(e),ei(e)){if(`selectionStart`in e)var r={start:e.selectionStart,end:e.selectionEnd};else a:{r=(r=e.ownerDocument)&&r.defaultView||window;var i=r.getSelection&&r.getSelection();if(i&&i.rangeCount!==0){r=i.anchorNode;var a=i.anchorOffset,o=i.focusNode;i=i.focusOffset;try{r.nodeType,o.nodeType}catch{r=null;break a}var s=0,c=-1,l=-1,u=0,d=0,f=e,p=null;b:for(;;){for(var m;f!==r||a!==0&&f.nodeType!==3||(c=s+a),f!==o||i!==0&&f.nodeType!==3||(l=s+i),f.nodeType===3&&(s+=f.nodeValue.length),(m=f.firstChild)!==null;)p=f,f=m;for(;;){if(f===e)break b;if(p===r&&++u===a&&(c=s),p===o&&++d===i&&(l=s),(m=f.nextSibling)!==null)break;f=p,p=f.parentNode}f=m}r=c===-1||l===-1?null:{start:c,end:l}}else r=null}r||={start:0,end:0}}else r=null;for(cp={focusedElem:e,selectionRange:r},gh=!1,n=(n&335544064)===n,du=t,t=n?9270:1024;du!==null;){if(e=du,n&&(r=e.deletions,r!==null))for(a=0;a<r.length;a++)n&&eu(r[a]);if(e.alternate===null&&e.flags&2)n&&Wl(e),_u(n);else{if(e.tag===22){if(r=e.alternate,e.memoizedState!==null){r!==null&&r.memoizedState===null&&n&&eu(r),_u(n);continue}if(r!==null&&r.memoizedState!==null){n&&Wl(e),_u(n);continue}}r=e.child,(e.subtreeFlags&t)!==0&&r!==null?(r.return=e,du=r):(n&&tu(e),_u(n))}}Ul=null}function _u(e){for(;du!==null;){var t=du,n=e,r=t.alternate,a=t.flags;switch(t.tag){case 0:case 11:case 15:break;case 1:if(a&1024&&r!==null){n=void 0,a=r.memoizedProps,r=r.memoizedState;var o=t.stateNode;try{var s=Tc(t.type,a);n=o.getSnapshotBeforeUpdate(s,r),o.__reactInternalSnapshotBeforeUpdate=n}catch(e){Z(t,t.return,e)}}break;case 3:if(a&1024){if(r=t.stateNode.containerInfo,n=r.nodeType,n===9)nm(r);else if(n===1)switch(r.nodeName){case`HEAD`:case`HTML`:case`BODY`:nm(r);break;default:r.textContent=``}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;case 30:n&&r!==null&&(n=Ci(r.memoizedProps,r.stateNode),a=t.memoizedProps,a=Ti(a.default,a.update),a!==`none`&&Jl(r,n,a,r.memoizedState=[],!0));break;default:if(a&1024)throw Error(i(163))}if(r=t.sibling,r!==null){r.return=t.return,du=r;break}du=t.return}}function vu(e,t,n){var r=n.flags;switch(n.tag){case 0:case 11:case 15:Lu(e,n),r&4&&wl(5,n);break;case 1:if(Lu(e,n),r&4){if(e=n.stateNode,t===null)try{e.componentDidMount()}catch(e){Z(n,n.return,e)}else{var i=Tc(n.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(i,t,e.__reactInternalSnapshotBeforeUpdate)}catch(e){Z(n,n.return,e)}}}r&64&&El(n),r&512&&Ol(n,n.return);break;case 3:if(Lu(e,n),r&64&&(e=n.updateQueue,e!==null)){if(t=null,n.child!==null)switch(n.child.tag){case 27:case 5:t=n.child.stateNode;break;case 1:t=n.child.stateNode}try{ko(e,t)}catch(e){Z(n,n.return,e)}}break;case 27:t===null&&r&4&&Vl(n);case 26:case 5:Lu(e,n),t===null&&r&4&&Fl(n),r&512&&Ol(n,n.return);break;case 12:Lu(e,n);break;case 31:Lu(e,n),r&4&&Eu(e,n);break;case 13:Lu(e,n),r&4&&Du(e,n),r&64&&(e=n.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(n=_f.bind(null,n),cm(e,n))));break;case 22:if(r=n.memoizedState!==null||su,!r){var a=t!==null&&t.memoizedState!==null||H;t=su,i=H,su=r,(H=a)&&!i?(r=2,n.subtreeFlags&8772&&(r|=1),zu(e,n,r)):Lu(e,n),su=t,H=i}break;case 30:Lu(e,n),r&512&&Ol(n,n.return);break;case 7:r&512&&Ol(n,n.return);default:Lu(e,n)}}function yu(e,t){for(e=e.child;e!==null;)bu(e,t),e=e.sibling}function bu(e,t){switch(e.tag){case 5:case 26:try{var n=e.stateNode;if(t){var r=n.style;typeof r.setProperty==`function`?r.setProperty(`display`,`none`,`important`):r.display=`none`}else{var i=e.stateNode,a=e.memoizedProps.style,o=a!=null&&a.hasOwnProperty(`display`)?a.display:null;i.style.display=o==null||typeof o==`boolean`?``:(``+o).trim()}}catch(t){Z(e,e.return,t)}xu(e,t);break;case 6:try{e.stateNode.nodeValue=t?``:e.memoizedProps,A=!0}catch(t){Z(e,e.return,t)}break;case 18:try{var s=e.stateNode;t?wp(s,!0):wp(e.stateNode,!1)}catch(t){Z(e,e.return,t)}break;case 22:case 23:e.memoizedState===null&&yu(e,t);break;default:yu(e,t)}}function xu(e,t){if(e.subtreeFlags&67108864)for(e=e.child;e!==null;){a:{var n=e,r=t;switch(n.tag){case 4:bu(n,r);break a;case 22:n.memoizedState===null&&xu(n,r);break a;default:xu(n,r)}}e=e.sibling}}function Su(e){var t=e.alternate;t!==null&&(e.alternate=null,Su(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&Vt(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var U=null,Cu=!1;function wu(e,t,n){for(n=n.child;n!==null;)Tu(e,t,n),n=n.sibling}function Tu(e,t,n){if(ot&&typeof ot.onCommitFiberUnmount==`function`)try{ot.onCommitFiberUnmount(at,n)}catch{}switch(n.tag){case 26:H||kl(n,t),wu(e,t,n),n.memoizedState?n.memoizedState.count--:n.stateNode&&!H&&(n=n.stateNode,n.parentNode.removeChild(n));break;case 27:H||kl(n,t),Ml(n);var r=U,i=Cu;Sp(n.type)&&(U=n.stateNode,Cu=!1),wu(e,t,n),gm(n.stateNode,n.type,n.memoizedProps),U=r,Cu=i;break;case 5:H||kl(n,t),Ml(n);case 6:if(n.tag===6&&Ml(n),r=U,i=Cu,U=null,wu(e,t,n),U=r,Cu=i,U!==null){if(Cu)try{(U.nodeType===9?U.body:U.nodeName===`HTML`?U.ownerDocument.body:U).removeChild(n.stateNode),A=!0}catch(e){Z(n,t,e)}else try{U.removeChild(n.stateNode),A=!0}catch(e){Z(n,t,e)}}break;case 18:U!==null&&(Cu?(e=U,Cp(e.nodeType===9?e.body:e.nodeName===`HTML`?e.ownerDocument.body:e,n.stateNode),Hh(e)):Cp(U,n.stateNode));break;case 4:r=U,i=Cu,U=n.stateNode.containerInfo,Cu=!0,wu(e,t,n),U=r,Cu=i;break;case 0:case 11:case 14:case 15:Tl(2,n,t),H||Tl(4,n,t),wu(e,t,n);break;case 1:H||(kl(n,t),r=n.stateNode,typeof r.componentWillUnmount==`function`&&Dl(n,t,r)),wu(e,t,n);break;case 21:wu(e,t,n);break;case 22:H=(r=H)||n.memoizedState!==null,wu(e,t,n),H=r;break;case 30:kl(n,t),wu(e,t,n);break;case 7:H||kl(n,t),wu(e,t,n);break;default:wu(e,t,n)}}function Eu(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null))){e=e.dehydrated;try{Hh(e)}catch(e){Z(t,t.return,e)}}}function Du(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{Hh(e)}catch(e){Z(t,t.return,e)}}function Ou(e){switch(e.tag){case 31:case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new uu),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new uu),t;default:throw Error(i(435,e.tag))}}function ku(e,t){var n=Ou(e);t.forEach(function(t){if(!n.has(t)){n.add(t);var r=vf.bind(null,e,t);t.then(r,r)}})}function Au(e,t,n){var r=t.deletions;if(r!==null)for(var a=0;a<r.length;a++){var o=r[a],s=e,c=t,l=c;a:for(;l!==null;){switch(l.tag){case 27:if(Sp(l.type)){U=l.stateNode,Cu=!1;break a}break;case 5:U=l.stateNode,Cu=!1;break a;case 3:case 4:U=l.stateNode.containerInfo,Cu=!0;break a}l=l.return}if(U===null)throw Error(i(160));Tu(s,c,o),U=null,Cu=!1,s=o.alternate,s!==null&&(s.return=null),o.return=null}if(t.subtreeFlags&13886)for(t=t.child;t!==null;)Mu(t,e,n),t=t.sibling}var ju=null;function Mu(e,t,n){var r=e.alternate,a=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(a&4&&(r=e.updateQueue,r=r===null?null:r.events,r!==null))for(var o=0;o<r.length;o++){var s=r[o];s.ref.impl=s.nextImpl}Au(t,e,n),Nu(e),a&4&&(Tl(3,e,e.return),wl(3,e),Tl(5,e,e.return));break;case 1:Au(t,e,n),Nu(e),a&512&&(H||r===null||kl(r,r.return)),a&64&&su&&(e=e.updateQueue,e!==null&&(t=e.callbacks,t!==null&&(n=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=n===null?t:n.concat(t))));break;case 26:if(o=ju,Au(t,e,n),Nu(e),a&512&&(H||r===null||kl(r,r.return)),a&4){if(a=r===null?null:r.memoizedState,n=e.memoizedState,r===null){if(n===null){if(e.stateNode===null){if(su)e.stateNode=fp(e.type,e.memoizedProps,t.containerInfo,e);else{a:{t=e.type,n=e.memoizedProps,a=o.ownerDocument||o;b:switch(t){case`title`:r=a.getElementsByTagName(`title`)[0],(!r||r[zt]||r[Mt]||r.namespaceURI===`http://www.w3.org/2000/svg`||r.hasAttribute(`itemprop`))&&(r=a.createElement(t),a.head.insertBefore(r,a.querySelector(`head > title`))),np(r,t,n),r[Mt]=e,Kt(r),t=r;break a;case`link`:if(o=Gm(`link`,`href`,a).get(t+(n.href||``))){for(s=0;s<o.length;s++)if(r=o[s],r.getAttribute(`href`)===(n.href==null||n.href===``?null:n.href)&&r.getAttribute(`rel`)===(n.rel==null?null:n.rel)&&r.getAttribute(`title`)===(n.title==null?null:n.title)&&r.getAttribute(`crossorigin`)===(n.crossOrigin==null?null:n.crossOrigin)){o.splice(s,1);break b}}r=a.createElement(t),np(r,t,n),a.head.appendChild(r);break;case`meta`:if(o=Gm(`meta`,`content`,a).get(t+(n.content||``))){for(s=0;s<o.length;s++)if(r=o[s],r.getAttribute(`content`)===(n.content==null?null:``+n.content)&&r.getAttribute(`name`)===(n.name==null?null:n.name)&&r.getAttribute(`property`)===(n.property==null?null:n.property)&&r.getAttribute(`http-equiv`)===(n.httpEquiv==null?null:n.httpEquiv)&&r.getAttribute(`charset`)===(n.charSet==null?null:n.charSet)){o.splice(s,1);break b}}r=a.createElement(t),np(r,t,n),a.head.appendChild(r);break;default:throw Error(i(468,t))}r[Mt]=e,Kt(r),t=r}e.stateNode=t}}else su||Km(o,e.type,e.stateNode)}else e.stateNode=Bm(o,n,e.memoizedProps)}else a===n?n===null&&e.stateNode!==null&&Il(e,e.memoizedProps,r.memoizedProps):(a===null?(t=r.stateNode,t===null||H||t.parentNode.removeChild(t)):a.count--,n===null?su||Km(o,e.type,e.stateNode):Bm(o,n,e.memoizedProps))}break;case 27:Au(t,e,n),Nu(e),a&512&&(H||r===null||kl(r,r.return)),r!==null&&a&4&&Il(e,e.memoizedProps,r.memoizedProps);break;case 5:if(o=cu,cu=!1,Au(t,e,n),cu=o,Nu(e),a&512&&(H||r===null||kl(r,r.return)),e.flags&32){t=e.stateNode;try{vn(t,``),A=!0}catch(t){Z(e,e.return,t)}}a&4&&e.stateNode!=null&&(t=e.memoizedProps,Il(e,t,r===null?t:r.memoizedProps)),a&1024&&(lu=!0);break;case 6:if(Au(t,e,n),Nu(e),a&4){if(e.stateNode===null)throw Error(i(162));t=e.memoizedProps,n=e.stateNode;try{n.nodeValue=t,A=!0}catch(t){Z(e,e.return,t)}}break;case 3:if(A=!1,Wm=null,o=ju,ju=bm(t.containerInfo),Au(t,e,n),ju=o,Nu(e),a&4&&r!==null&&r.memoizedState.isDehydrated)try{Hh(t.containerInfo)}catch(t){Z(e,e.return,t)}lu&&(lu=!1,Pu(e)),A=!1;break;case 4:a=cu,cu=su,r=tn(),o=ju,ju=bm(e.stateNode.containerInfo),Au(t,e,n),Nu(e),ju=o,A&&pu&&(mu=!0),A=r,cu=a;break;case 12:Au(t,e,n),Nu(e);break;case 31:Au(t,e,n),Nu(e),a&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,ku(e,t)));break;case 13:Au(t,e,n),Nu(e),e.child.flags&8192&&e.memoizedState!==null!=(r!==null&&r.memoizedState!==null)&&(hd=Xe()),a&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,ku(e,t)));break;case 22:o=e.memoizedState!==null,s=r!==null&&r.memoizedState!==null;var c=su,l=H,u=cu;su=c||o,cu=u||o,H=l||s,Au(t,e,n),H=l,cu=u,su=c,Nu(e),a&8192&&(t=e.stateNode,t._visibility=o?t._visibility&-2:t._visibility|1,!o||r===null||s||su||H||(t=s||H,n=su,r=H,su=o||su,H=t,Ru(e,2),su=n,H=r),!o&&cu||yu(e,o)),a&4&&(t=e.updateQueue,t!==null&&(n=t.retryQueue,n!==null&&(t.retryQueue=null,ku(e,n))));break;case 19:Au(t,e,n),Nu(e),a&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,ku(e,t)));break;case 30:a&512&&(H||r===null||kl(r,r.return)),a=tn(),o=pu,s=(n&335544064)===n,c=e.memoizedProps,pu=s&&Ti(c.default,c.update)!==`none`,Au(t,e,n),Nu(e),s&&r!==null&&A&&(e.flags|=4),pu=o,A=a;break;case 21:break;case 7:a&512&&(H||r===null||kl(r,r.return)),r&&r.stateNode!==null&&(r.stateNode._fragmentFiber=e);default:Au(t,e,n),Nu(e)}}function Nu(e){var t=e.flags;if(t&2){try{for(var n,r=e.return;r!==null;){if(Ll(r)){n=r;break}r=r.return}r=null;for(var a=e.return;a!==null;){if(Pl(a)){var o=a.stateNode;r===null?r=[o]:r.push(o)}if(Nl(a))break;a=a.return}var s=r;if(n==null)throw Error(i(160));switch(n.tag){case 27:var c=n.stateNode;Bl(e,Rl(e),c,s);break;case 5:var l=n.stateNode;n.flags&32&&(vn(l,``),n.flags&=-33),Bl(e,Rl(e),l,s);break;case 3:case 4:var u=n.stateNode.containerInfo;zl(e,Rl(e),u,s);break;default:throw Error(i(161))}}catch(t){Z(e,e.return,t)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function Pu(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;Pu(t),t.tag===5&&t.flags&1024&&(t=t.stateNode,gh=!0,t.reset(),gh=!1),e=e.sibling}}function Fu(e,t){if(t.subtreeFlags&9270)for(t=t.child;t!==null;)Iu(t,e),t=t.sibling;else ou(t,!1)}function Iu(e,t){var n=e.alternate;if(n===null)Ql(e,!1);else switch(e.tag){case 3:if(hu=fu=!1,Kl(),Fu(t,e),!fu&&!mu){if(e=Gl,e!==null)for(var r=0;r<e.length;r+=3){n=e[r];var i=e[r+1];Ep(n,e[r+2]),n=n.ownerDocument.documentElement,n!==null&&n.animate({opacity:[0,0],pointerEvents:[`none`,`none`]},{duration:0,fill:`forwards`,pseudoElement:`::view-transition-group(`+i+`)`})}e=t.containerInfo,e=e.nodeType===9?e.documentElement:e.ownerDocument.documentElement,e!==null&&e.style.viewTransitionName===``&&(e.style.viewTransitionName=`none`,e.animate({opacity:[0,0],pointerEvents:[`none`,`none`]},{duration:0,fill:`forwards`,pseudoElement:`::view-transition-group(root)`}),e.animate({width:[0,0],height:[0,0]},{duration:0,fill:`forwards`,pseudoElement:`::view-transition`})),hu=!0}Gl=null;break;case 5:Fu(t,e);break;case 4:r=fu,fu=!1,Fu(t,e),fu&&(mu=!0),fu=r;break;case 22:e.memoizedState===null&&(n.memoizedState===null?Fu(t,e):Ql(e,!1));break;case 30:r=fu,i=Kl(),fu=!1,Fu(t,e),fu&&(e.flags|=4);var a=e.memoizedProps,o=e.stateNode;t=Ci(a,o),o=Ci(n.memoizedProps,o);var s=Ti(a.default,a.update);s===`none`?t=!1:(a=n.memoizedState,n.memoizedState=null,n=e.child,ql=0,t=au(e,n,t,o,s,a,!0),ql!==(a===null?0:a.length)&&(e.flags|=32)),e.flags&4&&t?(Nd(e,e.memoizedProps.onUpdate),Gl=i):i!==null&&(i.push.apply(i,Gl),Gl=i),fu=e.flags&32?!0:r;break;default:Fu(t,e)}}function Lu(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)vu(e,t.alternate,t),t=t.sibling}function Ru(e,t){for(e=e.child;e!==null;){var n=e,r=t;switch(n.tag){case 0:case 11:case 14:case 15:Tl(4,n,n.return),Ru(n,r);break;case 1:kl(n,n.return);var i=n.stateNode;typeof i.componentWillUnmount==`function`&&Dl(n,n.return,i),Ru(n,r);break;case 27:r&2&&gm(n.stateNode,n.type,n.memoizedProps);case 5:kl(n,n.return),n.tag!==5&&n.tag!==27||Ml(n),Ru(n,r);break;case 6:Ml(n);break;case 26:kl(n,n.return),i=n.stateNode,n.memoizedState!==null||i===null||H||i.parentNode.removeChild(i),Ru(n,r);break;case 22:n.memoizedState===null&&Ru(n,r);break;case 30:kl(n,n.return),Ru(n,r);break;case 7:kl(n,n.return);default:Ru(n,r)}e=e.sibling}}function zu(e,t,n){for(n=t.subtreeFlags&8772?n:n&-2,t=t.child;t!==null;){var r=t.alternate,i=e,a=t,o=a.flags,s=!!(n&1);switch(a.tag){case 0:case 11:case 15:zu(i,a,n),wl(4,a);break;case 1:if(zu(i,a,n),r=a,i=r.stateNode,typeof i.componentDidMount==`function`)try{i.componentDidMount()}catch(e){Z(r,r.return,e)}if(r=a,i=r.updateQueue,i!==null){var c=r.stateNode;try{var l=i.shared.hiddenCallbacks;if(l!==null)for(i.shared.hiddenCallbacks=null,i=0;i<l.length;i++)Oo(l[i],c)}catch(e){Z(r,r.return,e)}}s&&o&64&&El(a),Ol(a,a.return);break;case 27:n&2&&Vl(a);case 5:a.tag!==5&&a.tag!==27||jl(a),zu(i,a,n),s&&r===null&&o&4&&Fl(a),Ol(a,a.return);break;case 6:jl(a);break;case 26:c=a.stateNode,a.memoizedState!==null||c===null||su||Km(bm(c.ownerDocument),a.type,c),zu(i,a,n),s&&r===null&&o&4&&Fl(a),Ol(a,a.return);break;case 12:zu(i,a,n);break;case 31:zu(i,a,n),s&&o&4&&Eu(i,a);break;case 13:zu(i,a,n),s&&o&4&&Du(i,a);break;case 22:a.memoizedState===null&&zu(i,a,n),Ol(a,a.return);break;case 30:zu(i,a,n),Ol(a,a.return);break;case 7:Ol(a,a.return);default:zu(i,a,n)}t=t.sibling}}function Bu(e,t){var n=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==n&&(e!=null&&e.refCount++,n!=null&&La(n))}function Vu(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&La(e))}function Hu(e,t,n,r){var i=(n&335544064)===n;if(t.subtreeFlags&(i?10262:10256))for(t=t.child;t!==null;)Uu(e,t,n,r),t=t.sibling;else i&&iu(t)}function Uu(e,t,n,r){var i=(n&335544064)===n;i&&t.alternate===null&&t.return!==null&&t.return.alternate!==null&&ru(t);var a=t.flags;switch(t.tag){case 0:case 11:case 15:Hu(e,t,n,r),a&2048&&wl(9,t);break;case 1:Hu(e,t,n,r);break;case 3:Hu(e,t,n,r),i&&hu&&(e=e.containerInfo,e=e.nodeType===9?e.body:e.nodeName===`HTML`?e.ownerDocument.body:e,e.style.viewTransitionName===`root`&&(e.style.viewTransitionName=``),e=e.ownerDocument.documentElement,e!==null&&e.style.viewTransitionName===`none`&&(e.style.viewTransitionName=``)),a&2048&&(a=null,t.alternate!==null&&(a=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==a&&(t.refCount++,a!=null&&La(a)));break;case 12:if(a&2048){Hu(e,t,n,r),a=t.stateNode;try{var o=t.memoizedProps,s=o.id,c=o.onPostCommit;typeof c==`function`&&c(s,t.alternate===null?`mount`:`update`,a.passiveEffectDuration,-0)}catch(e){Z(t,t.return,e)}}else Hu(e,t,n,r);break;case 31:Hu(e,t,n,r);break;case 13:Hu(e,t,n,r);break;case 23:break;case 22:o=t.stateNode,s=t.alternate,t.memoizedState===null?(i&&s!==null&&s.memoizedState!==null&&ru(t),o._visibility&2?Hu(e,t,n,r):(o._visibility|=2,Wu(e,t,n,r,!!(t.subtreeFlags&10256)||!1))):(i&&s!==null&&s.memoizedState===null&&ru(s),o._visibility&2?Hu(e,t,n,r):Gu(e,t)),a&2048&&Bu(s,t);break;case 24:Hu(e,t,n,r),a&2048&&Vu(t.alternate,t);break;case 30:i&&(a=t.alternate,a!==null&&(Xl(a.child,!0),Xl(t.child,!0))),Hu(e,t,n,r);break;default:Hu(e,t,n,r)}}function Wu(e,t,n,r,i){for(i&&=!!(t.subtreeFlags&10256)||!1,t=t.child;t!==null;){var a=e,o=t,s=n,c=r,l=o.flags;switch(o.tag){case 0:case 11:case 15:Wu(a,o,s,c,i),wl(8,o);break;case 23:break;case 22:var u=o.stateNode;o.memoizedState===null?(u._visibility|=2,Wu(a,o,s,c,i)):u._visibility&2?Wu(a,o,s,c,i):Gu(a,o),i&&l&2048&&Bu(o.alternate,o);break;case 24:Wu(a,o,s,c,i),i&&l&2048&&Vu(o.alternate,o);break;default:Wu(a,o,s,c,i)}t=t.sibling}}function Gu(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var n=e,r=t,i=r.flags;switch(r.tag){case 22:Gu(n,r),i&2048&&Bu(r.alternate,r);break;case 24:Gu(n,r),i&2048&&Vu(r.alternate,r);break;default:Gu(n,r)}t=t.sibling}}var Ku=8192;function qu(e,t,n){if(e.subtreeFlags&Ku)for(e=e.child;e!==null;)Ju(e,t,n),e=e.sibling}function Ju(e,t,n){switch(e.tag){case 26:qu(e,t,n),e.flags&Ku&&(e.memoizedState===null?(e=e.stateNode,(t&335544128)===t&&Zm(n,e)):Qm(n,ju,e.memoizedState,e.memoizedProps));break;case 5:qu(e,t,n),e.flags&Ku&&(e=e.stateNode,(t&335544128)===t&&Zm(n,e));break;case 3:case 4:var r=ju;ju=bm(e.stateNode.containerInfo),qu(e,t,n),ju=r;break;case 22:e.memoizedState===null&&(r=e.alternate,r!==null&&r.memoizedState!==null?(r=Ku,Ku=16777216,qu(e,t,n),Ku=r):qu(e,t,n));break;case 30:if((e.flags&Ku)!==0&&(r=e.memoizedProps.name,r!=null&&r!==`auto`)){var i=e.stateNode;i.paired=null,Ul===null&&(Ul=new Map),Ul.set(r,i)}qu(e,t,n);break;default:qu(e,t,n)}}function Yu(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function Xu(e){var t=e.deletions;if(e.flags&16){if(t!==null)for(var n=0;n<t.length;n++){var r=t[n];du=r,$u(r,e)}Yu(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)Zu(e),e=e.sibling}function Zu(e){switch(e.tag){case 0:case 11:case 15:Xu(e),e.flags&2048&&Tl(9,e,e.return);break;case 3:Xu(e);break;case 12:Xu(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&2&&(e.return===null||e.return.tag!==13)?(t._visibility&=-3,Qu(e)):Xu(e);break;default:Xu(e)}}function Qu(e){var t=e.deletions;if(e.flags&16){if(t!==null)for(var n=0;n<t.length;n++){var r=t[n];du=r,$u(r,e)}Yu(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:Tl(8,t,t.return),Qu(t);break;case 22:n=t.stateNode,n._visibility&2&&(n._visibility&=-3,Qu(t));break;default:Qu(t)}e=e.sibling}}function $u(e,t){for(;du!==null;){var n=du;switch(n.tag){case 0:case 11:case 15:Tl(8,n,t);break;case 23:case 22:if(n.memoizedState!==null&&n.memoizedState.cachePool!==null){var r=n.memoizedState.cachePool.pool;r!=null&&r.refCount++}break;case 24:La(n.memoizedState.cache)}if(r=n.child,r!==null)r.return=n,du=r;else a:for(n=e;du!==null;){r=du;var i=r.sibling,a=r.return;if(Su(r),r===n){du=null;break a}if(i!==null){i.return=a,du=i;break a}du=a}}}var ed={getCacheForType:function(e){var t=Aa(I),n=t.data.get(e);return n===void 0&&(n=e(),t.data.set(e,n)),n},cacheSignal:function(){return Aa(I).controller.signal}},td=typeof WeakMap==`function`?WeakMap:Map,W=0,G=null,K=null,q=0,J=0,nd=null,rd=!1,id=!1,ad=!1,od=0,Y=0,sd=0,cd=0,ld=0,ud=0,dd=0,fd=null,pd=null,md=!1,hd=0,gd=0,_d=1/0,vd=null,yd=null,X=0,bd=null,xd=null,Sd=0,Cd=0,wd=null,Td=null,Ed=null,Dd=null,Od=null,kd=0,Ad=null;function jd(){return W&2&&q!==0?q&-q:C.T===null?kt():Pf()}function Md(){if(ud===0){if(!(q&536870912)||F){var e=pt;pt<<=1,!(pt&3932160)&&(pt=262144),ud=e}else ud=536870912}return e=Fo.current,e!==null&&(e.flags|=32),ud}function Nd(e,t){if(t!=null){var n=e.stateNode,r=n.ref;r===null&&(r=n.ref=Pp(Ci(e.memoizedProps,n))),Dd===null&&(Dd=[]),Dd.push(t.bind(null,r))}}function Pd(e,t,n){(e===G&&(J===2||J===9)||e.cancelPendingCommit!==null)&&(Vd(e,0),Rd(e,q,ud,!1)),St(e,n),(!(W&2)||e!==G)&&(e===G&&(!(W&2)&&(cd|=n),Y===4&&Rd(e,q,ud,!1)),Ef(e))}function Fd(e,t,n){if(W&6)throw Error(i(327));var r=!n&&!(t&127)&&(t&e.expiredLanes)===0||_t(e,t),a=r?Yd(e,t):qd(e,t,!0),o=r;do{if(a===0){id&&!r&&Rd(e,t,0,!1);break}if(n=e.current.alternate,o&&!Ld(n)){a=qd(e,t,!1),o=!1;continue}if(a===2){if(o=t,e.errorRecoveryDisabledLanes&o)var s=0;else s=e.pendingLanes&-536870913,s=s===0?s&536870912?536870912:0:s;if(s!==0){t=s;a:{var c=e;a=fd;var l=c.current.memoizedState.isDehydrated;if(l&&(Vd(c,s).flags|=256),s=qd(c,s,!1),s!==2&&s!==6){if(ad&&!l){c.errorRecoveryDisabledLanes|=o,cd|=o,a=4;break a}o=pd,pd=a,o!==null&&(pd===null?pd=o:pd.push.apply(pd,o))}a=s}if(o=!1,a!==2)continue}}if(a===1){Vd(e,0),Rd(e,t,0,!0);break}a:{switch(r=e,o=a,o){case 0:case 1:throw Error(i(345));case 4:if((t&4194048)!==t&&(t&62914560)!==t)break;case 6:Rd(r,t,ud,!rd);break a;case 2:pd=null;break;case 3:case 5:break;default:throw Error(i(329))}if((t&62914560)===t&&(a=hd+300-Xe(),10<a)){if(Rd(r,t,ud,!rd),gt(r,0,!0)!==0)break a;Sd=t,r.timeoutHandle=gp(Id.bind(null,r,n,pd,vd,md,t,ud,cd,dd,rd,o,`Throttled`,-0,0),a);break a}Id(r,n,pd,vd,md,t,ud,cd,dd,rd,o,null,-0,0)}break}while(1);Ef(e)}function Id(e,t,n,r,i,a,o,s,c,l,u,d,f,p){e.timeoutHandle=-1;var m=t.subtreeFlags,h=(a&335544064)===a;if(d=null,(h||m&8192||(m&16785408)==16785408)&&(d={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:N},Ul=null,Ju(t,a,d),h&&(m=d,h=e.containerInfo,h=(h.nodeType===9?h:h.ownerDocument).__reactViewTransition,h!=null&&(m.count++,m.waitingForViewTransition=!0,m=nh.bind(m),h.finished.then(m,m))),m=(a&62914560)===a?hd-Xe():(a&4194048)===a?gd-Xe():0,m=eh(d,m),m!==null)){Sd=a,e.cancelPendingCommit=m(nf.bind(null,e,t,a,n,r,i,o,s,c,l,u,d,null,f,p)),Rd(e,a,o,!l);return}nf(e,t,a,n,r,i,o,s,c,l,u,d)}function Ld(e){for(var t=e;;){var n=t.tag;if((n===0||n===11||n===15)&&t.flags&16384&&(n=t.updateQueue,n!==null&&(n=n.stores,n!==null)))for(var r=0;r<n.length;r++){var i=n[r],a=i.getSnapshot;i=i.value;try{if(!qr(a(),i))return!1}catch{return!1}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function Rd(e,t,n,r){t=vt(e,t),t&=~ld,t&=~cd,e.suspendedLanes|=t,e.pingedLanes&=~t,r&&(e.warmLanes|=t),r=e.expirationTimes;for(var i=t;0<i;){var a=31-ct(i),o=1<<a;r[a]=-1,i&=~o}n!==0&&wt(e,n,t)}function zd(){return W&6?!0:(Df(0,!1),!1)}function Bd(){if(K!==null){if(J===0)var e=K.return;else e=K,Sa=xa=null,cs(e),lo=null,uo=0,e=K;for(;e!==null;)Cl(e.alternate,e),e=e.return;K=null}}function Vd(e,t){var n=e.timeoutHandle;return n!==-1&&(e.timeoutHandle=-1,_p(n)),n=e.cancelPendingCommit,n!==null&&(e.cancelPendingCommit=null,n()),Sd=0,Bd(),G=e,K=n=Bi(e.current,null),q=t,J=0,nd=null,rd=!1,id=_t(e,t),ad=!1,dd=ud=ld=cd=sd=Y=0,pd=fd=null,md=!1,od=vt(e,t),Ai(),n}function Hd(e,t){L=null,C.H=_c,t===$a||t===to?(t=so(),J=3):t===eo?(t=so(),J=4):J=t===Fc?8:typeof t==`object`&&t&&typeof t.then==`function`?6:1,nd=t,K===null&&(Y=1,kc(e,Ji(t,e.current)))}function Ud(){var e=Fo.current;return e===null?!0:(q&4194048)===q?Io===null:(q&62914560)===q||q&536870912?e===Io:!1}function Wd(){var e=C.H;return C.H=_c,e===null?_c:e}function Gd(){var e=C.A;return C.A=ed,e}function Kd(){Y=4,rd||(q&4194048)!==q&&Fo.current!==null||(id=!0),!(sd&134217727)&&!(cd&134217727)||G===null||Rd(G,q,ud,!1)}function qd(e,t,n){var r=W;W|=2;var i=Wd(),a=Gd();(G!==e||q!==t)&&(vd=null,Vd(e,t)),t=!1;var o=Y;a:do try{if(J!==0&&K!==null){var s=K,c=nd;switch(J){case 8:Bd(),o=6;break a;case 3:case 2:case 9:case 6:Fo.current===null&&(t=!0);var l=J;if(J=0,nd=null,$d(e,s,c,l),n&&id){o=0;break a}break;default:l=J,J=0,nd=null,$d(e,s,c,l)}}Jd(),o=Y;break}catch(t){Hd(e,t)}while(1);return t&&e.shellSuspendCounter++,Sa=xa=null,W=r,C.H=i,C.A=a,K===null&&(G=null,q=0,Ai()),o}function Jd(){for(;K!==null;)Zd(K)}function Yd(e,t){var n=W;W|=2;var r=Wd(),a=Gd();G!==e||q!==t?(vd=null,_d=Xe()+500,Vd(e,t)):id=_t(e,t);a:do try{if(J!==0&&K!==null){t=K;var o=nd;b:switch(J){case 1:J=0,nd=null,$d(e,t,o,1);break;case 2:case 9:if(ro(o)){J=0,nd=null,Qd(t);break}t=function(){J!==2&&J!==9||G!==e||(J=7),Ef(e)},o.then(t,t);break a;case 3:J=7;break a;case 4:J=5;break a;case 7:ro(o)?(J=0,nd=null,Qd(t)):(J=0,nd=null,$d(e,t,o,7));break;case 5:var s=null;switch(K.tag){case 26:s=K.memoizedState;case 5:case 27:var c=K;if(s?Ym(s):c.stateNode.complete){J=0,nd=null;var l=c.sibling;if(l!==null)K=l;else{var u=c.return;u===null?K=null:(K=u,ef(u))}break b}}J=0,nd=null,$d(e,t,o,5);break;case 6:J=0,nd=null,$d(e,t,o,6);break;case 8:Bd(),Y=6;break a;default:throw Error(i(462))}}Xd();break}catch(t){Hd(e,t)}while(1);return Sa=xa=null,C.H=r,C.A=a,W=n,K===null?(G=null,q=0,Ai(),Y):0}function Xd(){for(;K!==null&&!Je();)Zd(K)}function Zd(e){var t=hl(e.alternate,e,od);e.memoizedProps=e.pendingProps,t===null?ef(e):K=t}function Qd(e){var t=e,n=t.alternate;switch(t.tag){case 15:case 0:t=Yc(n,t,t.pendingProps,t.type,void 0,q);break;case 11:t=Yc(n,t,t.pendingProps,t.type.render,t.ref,q);break;case 5:cs(t);var r=t;r===la&&(F?(ha(r),r.tag===5&&r.stateNode!=null&&(P=r.stateNode)):(ha(r),F=!0));default:Cl(n,t),t=K=Vi(t,od),t=hl(n,t,od)}e.memoizedProps=e.pendingProps,t===null?ef(e):K=t}function $d(e,t,n,r){Sa=xa=null,cs(t),lo=null,uo=0;var i=t.return;try{if(Pc(e,i,t,n,q)){Y=1,kc(e,Ji(n,e.current)),K=null;return}}catch(t){if(i!==null)throw K=i,t;Y=1,kc(e,Ji(n,e.current)),K=null;return}t.flags&32768?(F||r===1?e=!0:id||q&536870912?e=!1:(rd=e=!0,(r===2||r===9||r===3||r===6)&&(r=Fo.current,r!==null&&r.tag===13&&(r.flags|=16384))),tf(t,e)):ef(t)}function ef(e){var t=e;do{if(t.flags&32768){tf(t,rd);return}e=t.return;var n=xl(t.alternate,t,od);if(n!==null){K=n;return}if(t=t.sibling,t!==null){K=t;return}K=t=e}while(t!==null);Y===0&&(Y=5)}function tf(e,t){do{var n=Sl(e.alternate,e);if(n!==null){n.flags&=32767,K=n;return}if(n=e.return,n!==null&&(n.flags|=32768,n.subtreeFlags=0,n.deletions=null),!t&&(e=e.sibling,e!==null)){K=e;return}K=e=n}while(e!==null);Y=6,K=null}function nf(e,t,n,r,a,o,s,c,l,u,d,f){e.cancelPendingCommit=null;do df();while(X!==0);if(W&6)throw Error(i(327));if(t!==null){if(t===e.current)throw Error(i(177));e===G&&(K=G=null,q=0),xd=t,bd=e,Sd=n,wd=a,Td=r,rf(e,t,n,s,c,l,f)}}function rf(e,t,n,r,i,a,o){var s=t.lanes|t.childLanes;if(Cd=s,s|=ki,Ct(e,n,s,r,i,a),Dd=null,(n&335544064)===n?(Od=Ba(e),r=10262):(Od=null,r=10256),(t.subtreeFlags&r)!==0||(t.flags&r)!==0?(e.callbackNode=null,e.callbackPriority=0,yf(et,function(){return ff(),null})):(e.callbackNode=null,e.callbackPriority=0),Hl=!1,r=!!(t.flags&13878),t.subtreeFlags&13878||r){r=C.T,C.T=null,i=w.p,w.p=2,a=W,W|=4;try{gu(e,t,n)}finally{W=a,w.p=i,C.T=r}}X=1,Hl?Ed=Mp(o,e.containerInfo,Od,sf,cf,of,lf,ff,af,null,null):(sf(),cf(),lf())}function af(e){if(X!==0){var t=bd.onRecoverableError;t(e,{componentStack:null})}}function of(){X===3&&(X=0,Iu(xd,bd),X=4)}function sf(){if(X===1){X=0;var e=bd,t=xd,n=Sd,r=!!(t.flags&13878);if(t.subtreeFlags&13878||r){r=C.T,C.T=null;var i=w.p;w.p=2;var a=W;W|=4;try{pu=mu=!1,Mu(t,e,n),n=cp;var o=$r(e.containerInfo),s=n.focusedElem,c=n.selectionRange;if(o!==s&&s&&s.ownerDocument&&Qr(s.ownerDocument.documentElement,s)){if(c!==null&&ei(s)){var l=c.start,u=c.end;if(u===void 0&&(u=l),`selectionStart`in s)s.selectionStart=l,s.selectionEnd=Math.min(u,s.value.length);else{var d=s.ownerDocument||document,f=d&&d.defaultView||window;if(f.getSelection){var p=f.getSelection(),m=s.textContent.length,h=Math.min(c.start,m),g=c.end===void 0?h:Math.min(c.end,m);!p.extend&&h>g&&(o=g,g=h,h=o);var _=Zr(s,h),v=Zr(s,g);if(_&&v&&(p.rangeCount!==1||p.anchorNode!==_.node||p.anchorOffset!==_.offset||p.focusNode!==v.node||p.focusOffset!==v.offset)){var y=d.createRange();y.setStart(_.node,_.offset),p.removeAllRanges(),h>g?(p.addRange(y),p.extend(v.node,v.offset)):(y.setEnd(v.node,v.offset),p.addRange(y))}}}}for(d=[],p=s;p=p.parentNode;)p.nodeType===1&&d.push({element:p,left:p.scrollLeft,top:p.scrollTop});for(typeof s.focus==`function`&&s.focus(),s=0;s<d.length;s++){var b=d[s];b.element.scrollLeft=b.left,b.element.scrollTop=b.top}}gh=!!sp,cp=sp=null}finally{W=a,w.p=i,C.T=r}}e.current=t,X=2}}function cf(){if(X===2){X=0;var e=bd,t=xd,n=!!(t.flags&8772);if(t.subtreeFlags&8772||n){n=C.T,C.T=null;var r=w.p;w.p=2;var i=W;W|=4;try{vu(e,t.alternate,t)}finally{W=i,w.p=r,C.T=n}}X=3}}function lf(){if(X===4||X===3){X=0;var e=Ed;Ed=null,Ye();var t=bd,n=xd,r=Sd,i=Td,a=(r&335544064)===r?10262:10256;if((n.subtreeFlags&a)!==0||(n.flags&a)!==0?X=5:(X=0,xd=bd=null,uf(t,t.pendingLanes)),a=t.pendingLanes,a===0&&(yd=null),Ot(r),n=n.stateNode,ot&&typeof ot.onCommitFiberRoot==`function`)try{ot.onCommitFiberRoot(at,n,void 0,(n.current.flags&128)==128)}catch{}if(i!==null){n=C.T,a=w.p,w.p=2,C.T=null;try{for(var o=t.onRecoverableError,s=0;s<i.length;s++){var c=i[s];o(c.value,{componentStack:c.stack})}}finally{C.T=n,w.p=a}}if(i=Dd,o=Od,Od=null,i!==null&&(Dd=null,o===null&&(o=[]),e!==null))for(c=0;c<i.length;c++)n=(0,i[c])(o),n!==void 0&&e.finished.finally(n);Sd&3&&df(),Ef(t),a=t.pendingLanes,r&261930&&a&42?t===Ad?kd++:(kd=0,Ad=t):(kd=0,Ad=null),Df(0,!1)}}function uf(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,La(t)))}function df(){return Ed!==null&&(Ed.skipTransition(),Ed=null),sf(),cf(),lf(),ff()}function ff(){if(X!==5)return!1;var e=bd,t=Cd;Cd=0;var n=Ot(Sd),r=C.T,a=w.p;try{w.p=32>n?32:n,C.T=null,n=wd,wd=null;var o=bd,s=Sd;if(X=0,xd=bd=null,Sd=0,W&6)throw Error(i(331));var c=W;if(W|=4,Zu(o.current),Uu(o,o.current,s,n),W=c,Df(0,!1),ot&&typeof ot.onPostCommitFiberRoot==`function`)try{ot.onPostCommitFiberRoot(at,o)}catch{}return!0}finally{w.p=a,C.T=r,uf(e,t)}}function pf(e,t,n){t=Ji(n,t),t=jc(e.stateNode,t,2),e=So(e,t,2),e!==null&&(St(e,2),Ef(e))}function Z(e,t,n){if(e.tag===3)pf(e,e,n);else for(;t!==null;){if(t.tag===3){pf(t,e,n);break}if(t.tag===1){var r=t.stateNode;if(typeof t.type.getDerivedStateFromError==`function`||typeof r.componentDidCatch==`function`&&(yd===null||!yd.has(r))){e=Ji(n,e),n=Mc(2),r=So(t,n,2),r!==null&&(Nc(n,r,t,e),St(r,2),Ef(r));break}}t=t.return}}function mf(e,t,n){var r=e.pingCache;if(r===null){r=e.pingCache=new td;var i=new Set;r.set(t,i)}else i=r.get(t),i===void 0&&(i=new Set,r.set(t,i));i.has(n)||(ad=!0,i.add(n),e=hf.bind(null,e,t,n),t.then(e,e))}function hf(e,t,n){var r=e.pingCache;r!==null&&r.delete(t),e.pingedLanes|=e.suspendedLanes&n,e.warmLanes&=~n,G===e&&(q&n)===n&&(Y===4||Y===3&&(q&62914560)===q&&300>Xe()-hd?W&2?ld|=n:Vd(e,0):ld|=n,dd===q&&(dd=0)),Ef(e)}function gf(e,t){t===0&&(t=bt()),e=Ni(e,t),e!==null&&(St(e,t),Ef(e))}function _f(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),gf(e,n)}function vf(e,t){var n=0;switch(e.tag){case 31:case 13:var r=e.stateNode,a=e.memoizedState;a!==null&&(n=a.retryLane);break;case 19:r=e.stateNode;break;case 22:r=e.stateNode._retryCache;break;default:throw Error(i(314))}r!==null&&r.delete(t),gf(e,n)}function yf(e,t){return Ke(e,t)}var bf=null,xf=null,Sf=!1,Cf=!1,wf=!1,Tf=0;function Ef(e){e!==xf&&e.next===null&&(xf===null?bf=xf=e:xf=xf.next=e),Cf=!0,Sf||(Sf=!0,Nf())}function Df(e,t){if(!wf&&Cf){wf=!0;do for(var n=!1,r=bf;r!==null;){if(!t){if(e!==0){var i=r.pendingLanes;if(i===0)var a=0;else{var o=r.suspendedLanes,s=r.pingedLanes;a=(1<<31-ct(42|e)+1)-1,a&=i&~(o&~s),a=a&201326741?a&201326741|1:a?a|2:0}a!==0&&(n=!0,Mf(r,a))}else a=q,a=gt(r,r===G?a:0,r.cancelPendingCommit!==null||r.timeoutHandle!==-1),!(a&3)||_t(r,a)||(n=!0,Mf(r,a))}r=r.next}while(n);wf=!1}}function Of(){kf()}function kf(){Cf=Sf=!1;var e=0;Tf!==0&&hp()&&(e=Tf);for(var t=Xe(),n=null,r=bf;r!==null;){var i=r.next,a=Af(r,t);a===0?(r.next=null,n===null?bf=i:n.next=i,i===null&&(xf=n)):(n=r,(e!==0||a&3)&&(Cf=!0)),r=i}X!==0&&X!==5||Df(e,!1),Tf!==0&&(Tf=0)}function Af(e,t){for(var n=e.suspendedLanes,r=e.pingedLanes,i=e.expirationTimes,a=e.pendingLanes&-62914561;0<a;){var o=31-ct(a),s=1<<o,c=i[o];c===-1?((s&n)===0||(s&r)!==0)&&(i[o]=yt(s,t)):c<=t&&(e.expiredLanes|=s),a&=~s}if(t=G,n=q,n=gt(e,e===t?n:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),r=e.callbackNode,n===0||e===t&&(J===2||J===9)||e.cancelPendingCommit!==null)return r!==null&&r!==null&&qe(r),e.callbackNode=null,e.callbackPriority=0;if(!(n&3)||_t(e,n)){if(t=n&-n,t===e.callbackPriority)return t;switch(r!==null&&qe(r),Ot(n)){case 2:case 8:n=$e;break;case 32:n=et;break;case 268435456:n=nt;break;default:n=et}return r=jf.bind(null,e),n=Ke(n,r),e.callbackPriority=t,e.callbackNode=n,t}return r!==null&&r!==null&&qe(r),e.callbackPriority=2,e.callbackNode=null,2}function jf(e,t){if(X!==0&&X!==5)return e.callbackNode=null,e.callbackPriority=0,null;var n=e.callbackNode;if(df()&&e.callbackNode!==n)return null;var r=q;return r=gt(e,e===G?r:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),r===0?null:(Fd(e,r,t),Af(e,Xe()),e.callbackNode!=null&&e.callbackNode===n?jf.bind(null,e):null)}function Mf(e,t){if(df())return null;Fd(e,t,!0)}function Nf(){bp(function(){W&6?Ke(Qe,Of):kf()})}function Pf(){if(Tf===0){var e=Ua;e===0&&(e=ft,ft<<=1,!(ft&261888)&&(ft=256)),Tf=e}return Tf}function Ff(e){return e==null||typeof e==`symbol`||typeof e==`boolean`?null:typeof e==`function`?e:M(e)}function If(e,t,n,r,i){if(t===`submit`&&n&&n.stateNode===i){var a=Ff((i[Nt]||null).action),o=r.submitter;o&&(t=(t=o[Nt]||null)?Ff(t.formAction):o.getAttribute(`formAction`),t!==null&&(a=t,o=null));var s=new Gn(`action`,`action`,null,r,i);e.push({event:s,listeners:[{instance:null,listener:function(){if(r.defaultPrevented){if(Tf!==0){var e=new FormData(i,o);rc(n,{pending:!0,data:e,method:i.method,action:a},null,e)}}else typeof a==`function`&&(s.preventDefault(),e=new FormData(i,o),rc(n,{pending:!0,data:e,method:i.method,action:a},a,e))},currentTarget:i}]})}}for(var Lf=0;Lf<bi.length;Lf++){var Rf=bi[Lf];xi(Rf.toLowerCase(),`on`+(Rf[0].toUpperCase()+Rf.slice(1)))}xi(fi,`onAnimationEnd`),xi(pi,`onAnimationIteration`),xi(mi,`onAnimationStart`),xi(`dblclick`,`onDoubleClick`),xi(`focusin`,`onFocus`),xi(`focusout`,`onBlur`),xi(hi,`onTransitionRun`),xi(gi,`onTransitionStart`),xi(_i,`onTransitionCancel`),xi(vi,`onTransitionEnd`),Xt(`onMouseEnter`,[`mouseout`,`mouseover`]),Xt(`onMouseLeave`,[`mouseout`,`mouseover`]),Xt(`onPointerEnter`,[`pointerout`,`pointerover`]),Xt(`onPointerLeave`,[`pointerout`,`pointerover`]),Yt(`onChange`,`change click focusin focusout input keydown keyup selectionchange`.split(` `)),Yt(`onSelect`,`focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange`.split(` `)),Yt(`onBeforeInput`,[`compositionend`,`keypress`,`textInput`,`paste`]),Yt(`onCompositionEnd`,`compositionend focusout keydown keypress keyup mousedown`.split(` `)),Yt(`onCompositionStart`,`compositionstart focusout keydown keypress keyup mousedown`.split(` `)),Yt(`onCompositionUpdate`,`compositionupdate focusout keydown keypress keyup mousedown`.split(` `));var zf=`abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting`.split(` `),Bf=new Set(`beforetoggle cancel close invalid load scroll scrollend toggle`.split(` `).concat(zf));function Vf(e,t){t=!!(t&4);for(var n=0;n<e.length;n++){var r=e[n],i=r.event;r=r.listeners;a:{var a=void 0;if(t)for(var o=r.length-1;0<=o;o--){var s=r[o],c=s.instance,l=s.currentTarget;if(s=s.listener,c!==a&&i.isPropagationStopped())break a;a=s,i.currentTarget=l;try{a(i)}catch(e){Ei(e)}i.currentTarget=null,a=c}else for(o=0;o<r.length;o++){if(s=r[o],c=s.instance,l=s.currentTarget,s=s.listener,c!==a&&i.isPropagationStopped())break a;a=s,i.currentTarget=l;try{a(i)}catch(e){Ei(e)}i.currentTarget=null,a=c}}}}function Q(e,t){var n=t[Ft];n===void 0&&(n=t[Ft]=new Set);var r=e+`__bubble`;n.has(r)||(Gf(t,e,2,!1),n.add(r))}function Hf(e,t,n){var r=0;t&&(r|=4),Gf(n,e,r,t)}var Uf=`_reactListening`+Math.random().toString(36).slice(2);function Wf(e){if(!e[Uf]){e[Uf]=!0,Jt.forEach(function(t){t!==`selectionchange`&&(Bf.has(t)||Hf(t,!1,e),Hf(t,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[Uf]||(t[Uf]=!0,Hf(`selectionchange`,!1,t))}}function Gf(e,t,n,r){switch(Ch(t)){case 2:var i=_h;break;case 8:i=vh;break;default:i=yh}n=i.bind(null,t,n,e),i=void 0,!Pn||t!==`touchstart`&&t!==`touchmove`&&t!==`wheel`||(i=!0),r?i===void 0?e.addEventListener(t,n,!0):e.addEventListener(t,n,{capture:!0,passive:i}):i===void 0?e.addEventListener(t,n,!1):e.addEventListener(t,n,{passive:i})}function Kf(e,t,n,r,i){var a=r;if(!(t&1)&&!(t&2)&&r!==null)a:for(;;){if(r===null)return;var s=r.tag;if(s===3||s===4){var c=r.stateNode.containerInfo;if(c===i)break;if(s===4)for(s=r.return;s!==null;){var l=s.tag;if((l===3||l===4)&&s.stateNode.containerInfo===i)return;s=s.return}for(;c!==null;){if(s=Ht(c),s===null)return;if(l=s.tag,l===5||l===6||l===26||l===27){r=a=s;continue a}c=c.parentNode}}r=r.return}jn(function(){var r=a,i=En(n),s=[];a:{var c=yi.get(e);if(c!==void 0){var l=Gn,u=e;switch(e){case`keypress`:if(Bn(n)===0)break a;case`keydown`:case`keyup`:l=lr;break;case`focusin`:u=`focus`,l=er;break;case`focusout`:u=`blur`,l=er;break;case`beforeblur`:case`afterblur`:l=er;break;case`click`:if(n.button===2)break a;case`auxclick`:case`dblclick`:case`mousedown`:case`mousemove`:case`mouseup`:case`mouseout`:case`mouseover`:case`contextmenu`:l=Qn;break;case`drag`:case`dragend`:case`dragenter`:case`dragexit`:case`dragleave`:case`dragover`:case`dragstart`:case`drop`:l=$n;break;case`touchcancel`:case`touchend`:case`touchmove`:case`touchstart`:l=fr;break;case fi:case pi:case mi:l=tr;break;case vi:l=pr;break;case`scroll`:case`scrollend`:l=qn;break;case`wheel`:l=mr;break;case`copy`:case`cut`:case`paste`:l=nr;break;case`gotpointercapture`:case`lostpointercapture`:case`pointercancel`:case`pointerdown`:case`pointermove`:case`pointerout`:case`pointerover`:case`pointerup`:l=ur;break;case`submit`:l=dr;break;case`toggle`:case`beforetoggle`:l=hr}var d=!!(t&4),f=!d&&(e===`scroll`||e===`scrollend`),p=d?c===null?null:c+`Capture`:c;d=[];for(var m=r,h;m!==null;){var g=m;if(h=g.stateNode,g=g.tag,g!==5&&g!==26&&g!==27||h===null||p===null||(g=Mn(m,p),g!=null&&d.push(qf(m,g,h))),f)break;m=m.return}0<d.length&&(c=new l(c,u,null,n,i),s.push({event:c,listeners:d}))}}if(!(t&7)){a:{if(l=e===`mouseover`||e===`pointerover`,c=e===`mouseout`||e===`pointerout`,l&&n!==Tn&&(u=n.relatedTarget||n.fromElement)&&(Ht(u)||u[Pt]))break a;(c||l)&&(u=i.window===i?i:(l=i.ownerDocument)?l.defaultView||l.parentWindow:window,c?(l=n.relatedTarget||n.toElement,c=r,l=l?Ht(l):null,l!==null&&(f=o(l),d=l.tag,l!==f||d!==5&&d!==27&&d!==6)&&(l=null)):(c=null,l=r),c!==l&&(d=Qn,g=`onMouseLeave`,p=`onMouseEnter`,m=`mouse`,(e===`pointerout`||e===`pointerover`)&&(d=ur,g=`onPointerLeave`,p=`onPointerEnter`,m=`pointer`),f=c==null?u:Wt(c),h=l==null?u:Wt(l),u=new d(g,m+`leave`,c,n,i),u.target=f,u.relatedTarget=h,g=null,Ht(i)===r&&(d=new d(p,m+`enter`,l,n,i),d.target=h,d.relatedTarget=f,g=d),f=g,d=c&&l?re(c,l,Yf):null,c!==null&&Xf(s,u,c,d,!1),l!==null&&f!==null&&Xf(s,f,l,d,!0)))}a:{if(c=r?Wt(r):window,l=c.nodeName&&c.nodeName.toLowerCase(),l===`select`||l===`input`&&c.type===`file`)var _=Fr;else if(kr(c)){if(Ir)_=Gr;else{_=Ur;var v=Hr}}else l=c.nodeName,!l||l.toLowerCase()!==`input`||c.type!==`checkbox`&&c.type!==`radio`?r&&Sn(r.elementType)&&(_=Fr):_=Wr;if(_&&=_(e,r)){Ar(s,_,n,i);break a}v&&v(e,c,r)}switch(v=r?Wt(r):window,e){case`focusin`:(kr(v)||v.contentEditable===`true`)&&(ni=v,ri=r,ii=null);break;case`focusout`:ii=ri=ni=null;break;case`mousedown`:ai=!0;break;case`contextmenu`:case`mouseup`:case`dragend`:ai=!1,oi(s,n,i);break;case`selectionchange`:if(ti)break;case`keydown`:case`keyup`:oi(s,n,i)}var y;if(_r)b:{switch(e){case`compositionstart`:var b=`onCompositionStart`;break b;case`compositionend`:b=`onCompositionEnd`;break b;case`compositionupdate`:b=`onCompositionUpdate`;break b}b=void 0}else Tr?Cr(e,n)&&(b=`onCompositionEnd`):e===`keydown`&&n.keyCode===229&&(b=`onCompositionStart`);b&&(br&&n.locale!==`ko`&&(Tr||b!==`onCompositionStart`?b===`onCompositionEnd`&&Tr&&(y=zn()):(In=i,Ln=`value`in In?In.value:In.textContent,Tr=!0)),v=Jf(r,b),0<v.length&&(b=new rr(b,e,null,n,i),s.push({event:b,listeners:v}),y?b.data=y:(y=wr(n),y!==null&&(b.data=y)))),(y=yr?Er(e,n):Dr(e,n))&&(b=Jf(r,`onBeforeInput`),0<b.length&&(v=new rr(`onBeforeInput`,`beforeinput`,null,n,i),s.push({event:v,listeners:b}),v.data=y)),If(s,e,r,n,i)}Vf(s,t)})}function qf(e,t,n){return{instance:e,listener:t,currentTarget:n}}function Jf(e,t){for(var n=t+`Capture`,r=[];e!==null;){var i=e,a=i.stateNode;if(i=i.tag,i!==5&&i!==26&&i!==27||a===null||(i=Mn(e,n),i!=null&&r.unshift(qf(e,i,a)),i=Mn(e,t),i!=null&&r.push(qf(e,i,a))),e.tag===3)return r;e=e.return}return[]}function Yf(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function Xf(e,t,n,r,i){for(var a=t._reactName,o=[];n!==null&&n!==r;){var s=n,c=s.alternate,l=s.stateNode;if(s=s.tag,c!==null&&c===r)break;s!==5&&s!==26&&s!==27||l===null||(c=l,i?(l=Mn(n,a),l!=null&&o.unshift(qf(n,l,c))):i||(l=Mn(n,a),l!=null&&o.push(qf(n,l,c)))),n=n.return}o.length!==0&&e.push({event:t,listeners:o})}var Zf=/\r\n?/g,Qf=/\u0000|\uFFFD/g;function $f(e){return(typeof e==`string`?e:``+e).replace(Zf,`
`).replace(Qf,``)}function ep(e,t){return t=$f(t),$f(e)===t}function $(e,t,n,r,a,o){switch(n){case`children`:if(typeof r==`string`)t===`body`||t===`textarea`&&r===``||vn(e,r);else if(typeof r==`number`||typeof r==`bigint`)t!==`body`&&vn(e,``+r);else return;break;case`className`:rn(e,`class`,r);break;case`tabIndex`:rn(e,`tabindex`,r);break;case`dir`:case`role`:case`viewBox`:case`width`:case`height`:rn(e,n,r);break;case`style`:xn(e,r,o);return;case`data`:if(t!==`object`){rn(e,`data`,r);break}case`src`:case`href`:if(r===``&&(t!==`a`||n!==`href`)){e.removeAttribute(n);break}if(r==null||typeof r==`function`||typeof r==`symbol`||typeof r==`boolean`){e.removeAttribute(n);break}r=M(r),e.setAttribute(n,r);break;case`action`:case`formAction`:if(typeof r==`function`){e.setAttribute(n,`javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')`);break}if(typeof o==`function`&&(n===`formAction`?(t!==`input`&&$(e,t,`name`,a.name,a,null),$(e,t,`formEncType`,a.formEncType,a,null),$(e,t,`formMethod`,a.formMethod,a,null),$(e,t,`formTarget`,a.formTarget,a,null)):($(e,t,`encType`,a.encType,a,null),$(e,t,`method`,a.method,a,null),$(e,t,`target`,a.target,a,null))),r==null||typeof r==`symbol`||typeof r==`boolean`){e.removeAttribute(n);break}r=M(r),e.setAttribute(n,r);break;case`onClick`:r!=null&&(e.onclick=N);return;case`onScroll`:r!=null&&Q(`scroll`,e);return;case`onScrollEnd`:r!=null&&Q(`scrollend`,e);return;case`dangerouslySetInnerHTML`:if(r!=null){if(typeof r!=`object`||!(`__html`in r))throw Error(i(61));if(n=r.__html,n!=null){if(a.children!=null)throw Error(i(60));o?.__html!==n&&(e.innerHTML=n)}}break;case`multiple`:e.multiple=r&&typeof r!=`function`&&typeof r!=`symbol`;break;case`muted`:e.muted=r&&typeof r!=`function`&&typeof r!=`symbol`;break;case`suppressContentEditableWarning`:case`suppressHydrationWarning`:case`defaultValue`:case`defaultChecked`:case`innerHTML`:case`ref`:break;case`autoFocus`:break;case`xlinkHref`:if(r==null||typeof r==`function`||typeof r==`boolean`||typeof r==`symbol`){e.removeAttribute(`xlink:href`);break}n=M(r),e.setAttributeNS(`http://www.w3.org/1999/xlink`,`xlink:href`,n);break;case`contentEditable`:case`spellCheck`:case`draggable`:case`value`:case`autoReverse`:case`externalResourcesRequired`:case`focusable`:case`preserveAlpha`:r!=null&&typeof r!=`function`&&typeof r!=`symbol`?e.setAttribute(n,r):e.removeAttribute(n);break;case`inert`:case`allowFullScreen`:case`async`:case`autoPlay`:case`controls`:case`credentialless`:case`default`:case`defer`:case`disabled`:case`disablePictureInPicture`:case`disableRemotePlayback`:case`formNoValidate`:case`hidden`:case`loop`:case`noModule`:case`noValidate`:case`open`:case`playsInline`:case`readOnly`:case`required`:case`reversed`:case`scoped`:case`seamless`:case`itemScope`:r&&typeof r!=`function`&&typeof r!=`symbol`?e.setAttribute(n,``):e.removeAttribute(n);break;case`capture`:case`download`:!0===r?e.setAttribute(n,``):!1!==r&&r!=null&&typeof r!=`function`&&typeof r!=`symbol`?e.setAttribute(n,r):e.removeAttribute(n);break;case`cols`:case`rows`:case`size`:case`span`:r!=null&&typeof r!=`function`&&typeof r!=`symbol`&&!isNaN(r)&&1<=r?e.setAttribute(n,r):e.removeAttribute(n);break;case`rowSpan`:case`start`:r==null||typeof r==`function`||typeof r==`symbol`||isNaN(r)?e.removeAttribute(n):e.setAttribute(n,r);break;case`popover`:Q(`beforetoggle`,e),Q(`toggle`,e),nn(e,`popover`,r);break;case`xlinkActuate`:an(e,`http://www.w3.org/1999/xlink`,`xlink:actuate`,r);break;case`xlinkArcrole`:an(e,`http://www.w3.org/1999/xlink`,`xlink:arcrole`,r);break;case`xlinkRole`:an(e,`http://www.w3.org/1999/xlink`,`xlink:role`,r);break;case`xlinkShow`:an(e,`http://www.w3.org/1999/xlink`,`xlink:show`,r);break;case`xlinkTitle`:an(e,`http://www.w3.org/1999/xlink`,`xlink:title`,r);break;case`xlinkType`:an(e,`http://www.w3.org/1999/xlink`,`xlink:type`,r);break;case`xmlBase`:an(e,`http://www.w3.org/XML/1998/namespace`,`xml:base`,r);break;case`xmlLang`:an(e,`http://www.w3.org/XML/1998/namespace`,`xml:lang`,r);break;case`xmlSpace`:an(e,`http://www.w3.org/XML/1998/namespace`,`xml:space`,r);break;case`is`:nn(e,`is`,r);break;case`innerText`:case`textContent`:return;default:if(!(2<n.length)||n[0]!==`o`&&n[0]!==`O`||n[1]!==`n`&&n[1]!==`N`)n=Cn.get(n)||n,nn(e,n,r);else return}A=!0}function tp(e,t,n,r,a,o){switch(n){case`style`:xn(e,r,o);return;case`dangerouslySetInnerHTML`:if(r!=null){if(typeof r!=`object`||!(`__html`in r))throw Error(i(61));if(n=r.__html,n!=null){if(a.children!=null)throw Error(i(60));o?.__html!==n&&(e.innerHTML=n)}}break;case`children`:if(typeof r==`string`)vn(e,r);else if(typeof r==`number`||typeof r==`bigint`)vn(e,``+r);else return;break;case`onScroll`:r!=null&&Q(`scroll`,e);return;case`onScrollEnd`:r!=null&&Q(`scrollend`,e);return;case`onClick`:r!=null&&(e.onclick=N);return;case`suppressContentEditableWarning`:case`suppressHydrationWarning`:case`innerHTML`:case`ref`:return;case`innerText`:case`textContent`:return;default:if(!k.hasOwnProperty(n))a:{if(n[0]===`o`&&n[1]===`n`&&(a=n.endsWith(`Capture`),o=n.slice(2,a?n.length-7:void 0),t=e[Nt]||null,t=t==null?null:t[n],typeof t==`function`&&e.removeEventListener(o,t,a),typeof r==`function`)){typeof t!=`function`&&t!==null&&(n in e?e[n]=null:e.hasAttribute(n)&&e.removeAttribute(n)),e.addEventListener(o,r,a);break a}A=!0,n in e?e[n]=r:!0===r?e.setAttribute(n,``):nn(e,n,r)}return}A=!0}function np(e,t,n){switch(t){case`div`:case`span`:case`svg`:case`path`:case`a`:case`g`:case`p`:case`li`:break;case`img`:Q(`error`,e),Q(`load`,e);var r=!1,a=!1,o;for(o in n)if(n.hasOwnProperty(o)){var s=n[o];if(s!=null)switch(o){case`src`:r=!0;break;case`srcSet`:a=!0;break;case`children`:case`dangerouslySetInnerHTML`:throw Error(i(137,t));default:$(e,t,o,s,n,null)}}a&&$(e,t,`srcSet`,n.srcSet,n,null),r&&$(e,t,`src`,n.src,n,null);return;case`input`:Q(`invalid`,e);var c=o=s=a=null,l=null,u=null;for(r in n)if(n.hasOwnProperty(r)){var d=n[r];if(d!=null)switch(r){case`name`:a=d;break;case`type`:s=d;break;case`checked`:l=d;break;case`defaultChecked`:u=d;break;case`value`:o=d;break;case`defaultValue`:c=d;break;case`children`:case`dangerouslySetInnerHTML`:if(d!=null)throw Error(i(137,t));break;default:$(e,t,r,d,n,null)}}pn(e,o,c,l,u,s,a,!1);return;case`select`:for(a in Q(`invalid`,e),r=s=o=null,n)if(n.hasOwnProperty(a)&&(c=n[a],c!=null))switch(a){case`value`:o=c;break;case`defaultValue`:s=c;break;case`multiple`:r=c;default:$(e,t,a,c,n,null)}t=o,n=s,e.multiple=!!r,t==null?n!=null&&hn(e,!!r,n,!0):hn(e,!!r,t,!1);return;case`textarea`:for(s in Q(`invalid`,e),o=a=r=null,n)if(n.hasOwnProperty(s)&&(c=n[s],c!=null))switch(s){case`value`:r=c;break;case`defaultValue`:a=c;break;case`children`:o=c;break;case`dangerouslySetInnerHTML`:if(c!=null)throw Error(i(91));break;default:$(e,t,s,c,n,null)}_n(e,r,a,o);return;case`option`:for(l in n)if(n.hasOwnProperty(l)&&(r=n[l],r!=null))switch(l){case`selected`:e.selected=r&&typeof r!=`function`&&typeof r!=`symbol`;break;default:$(e,t,l,r,n,null)}return;case`dialog`:Q(`beforetoggle`,e),Q(`toggle`,e),Q(`cancel`,e),Q(`close`,e);break;case`iframe`:case`object`:Q(`load`,e);break;case`video`:case`audio`:for(r=0;r<zf.length;r++)Q(zf[r],e);break;case`image`:Q(`error`,e),Q(`load`,e);break;case`details`:Q(`toggle`,e);break;case`embed`:case`source`:case`link`:Q(`error`,e),Q(`load`,e);case`area`:case`base`:case`br`:case`col`:case`hr`:case`keygen`:case`meta`:case`param`:case`track`:case`wbr`:case`menuitem`:for(u in n)if(n.hasOwnProperty(u)&&(r=n[u],r!=null))switch(u){case`children`:case`dangerouslySetInnerHTML`:throw Error(i(137,t));default:$(e,t,u,r,n,null)}return;default:if(Sn(t)){for(d in n)n.hasOwnProperty(d)&&(r=n[d],r!==void 0&&tp(e,t,d,r,n,void 0));return}}for(c in n)n.hasOwnProperty(c)&&(r=n[c],r!=null&&$(e,t,c,r,n,null))}var rp={};function ip(e,t,n,r){switch(t){case`div`:case`span`:case`svg`:case`path`:case`a`:case`g`:case`p`:case`li`:break;case`input`:var a=null,o=null,s=null,c=null,l=null,u=null,d=null;for(m in n){var f=n[m];if(n.hasOwnProperty(m)&&f!=null)switch(m){case`checked`:break;case`value`:break;case`defaultValue`:l=f;default:r.hasOwnProperty(m)||$(e,t,m,null,r,f)}}for(var p in r){var m=r[p];if(f=n[p],r.hasOwnProperty(p)&&(m!=null||f!=null))switch(p){case`type`:m!==f&&(A=!0),o=m;break;case`name`:m!==f&&(A=!0),a=m;break;case`checked`:m!==f&&(A=!0),u=m;break;case`defaultChecked`:m!==f&&(A=!0),d=m;break;case`value`:m!==f&&(A=!0),s=m;break;case`defaultValue`:m!==f&&(A=!0),c=m;break;case`children`:case`dangerouslySetInnerHTML`:if(m!=null)throw Error(i(137,t));break;default:m!==f&&$(e,t,p,m,r,f)}}fn(e,s,c,l,u,d,o,a);return;case`select`:for(o in m=s=c=p=null,n)if(l=n[o],n.hasOwnProperty(o)&&l!=null)switch(o){case`value`:break;case`multiple`:m=l;default:r.hasOwnProperty(o)||$(e,t,o,null,r,l)}for(a in r)if(o=r[a],l=n[a],r.hasOwnProperty(a)&&(o!=null||l!=null))switch(a){case`value`:o!==l&&(A=!0),p=o;break;case`defaultValue`:o!==l&&(A=!0),c=o;break;case`multiple`:o!==l&&(A=!0),s=o;default:o!==l&&$(e,t,a,o,r,l)}t=c,n=s,r=m,p==null?!!r!=!!n&&(t==null?hn(e,!!n,n?[]:``,!1):hn(e,!!n,t,!0)):hn(e,!!n,p,!1);return;case`textarea`:for(c in m=p=null,n)if(a=n[c],n.hasOwnProperty(c)&&a!=null&&!r.hasOwnProperty(c))switch(c){case`value`:break;case`children`:break;default:$(e,t,c,null,r,a)}for(s in r)if(a=r[s],o=n[s],r.hasOwnProperty(s)&&(a!=null||o!=null))switch(s){case`value`:a!==o&&(A=!0),p=a;break;case`defaultValue`:a!==o&&(A=!0),m=a;break;case`children`:break;case`dangerouslySetInnerHTML`:if(a!=null)throw Error(i(91));break;default:a!==o&&$(e,t,s,a,r,o)}gn(e,p,m);return;case`option`:for(var h in n)if(p=n[h],n.hasOwnProperty(h)&&p!=null&&!r.hasOwnProperty(h))switch(h){case`selected`:e.selected=!1;break;default:$(e,t,h,null,r,p)}for(l in r)if(p=r[l],m=n[l],r.hasOwnProperty(l)&&p!==m&&(p!=null||m!=null))switch(l){case`selected`:p!==m&&(A=!0),e.selected=p&&typeof p!=`function`&&typeof p!=`symbol`;break;default:$(e,t,l,p,r,m)}return;case`img`:case`link`:case`area`:case`base`:case`br`:case`col`:case`embed`:case`hr`:case`keygen`:case`meta`:case`param`:case`source`:case`track`:case`wbr`:case`menuitem`:for(var g in n)p=n[g],n.hasOwnProperty(g)&&p!=null&&!r.hasOwnProperty(g)&&$(e,t,g,null,r,p);for(u in r)if(p=r[u],m=n[u],r.hasOwnProperty(u)&&p!==m&&(p!=null||m!=null))switch(u){case`children`:case`dangerouslySetInnerHTML`:if(p!=null)throw Error(i(137,t));break;default:$(e,t,u,p,r,m)}return;default:if(Sn(t)){for(var _ in n)p=n[_],n.hasOwnProperty(_)&&p!==void 0&&!r.hasOwnProperty(_)&&tp(e,t,_,void 0,r,p);for(d in r)p=r[d],m=n[d],!r.hasOwnProperty(d)||p===m||p===void 0&&m===void 0||tp(e,t,d,p,r,m);return}}for(var v in n)p=n[v],n.hasOwnProperty(v)&&p!=null&&!r.hasOwnProperty(v)&&$(e,t,v,null,r,p);for(f in r)p=r[f],m=n[f],!r.hasOwnProperty(f)||p===m||p==null&&m==null||$(e,t,f,p,r,m)}function ap(e){switch(e){case`css`:case`script`:case`font`:case`img`:case`image`:case`input`:case`link`:return!0;default:return!1}}function op(){if(typeof performance.getEntriesByType==`function`){for(var e=0,t=0,n=performance.getEntriesByType(`resource`),r=0;r<n.length;r++){var i=n[r],a=i.transferSize,o=i.initiatorType,s=i.duration;if(a&&s&&ap(o)){for(o=0,s=i.responseEnd,r+=1;r<n.length;r++){var c=n[r],l=c.startTime;if(l>s)break;var u=c.transferSize,d=c.initiatorType;u&&ap(d)&&(c=c.responseEnd,o+=u*(c<s?1:(s-l)/(c-l)))}if(--r,t+=8*(a+o)/(i.duration/1e3),e++,10<e)break}}if(0<e)return t/e/1e6}return navigator.connection&&(e=navigator.connection.downlink,typeof e==`number`)?e:5}var sp=null,cp=null;function lp(e){return e.nodeType===9?e:e.ownerDocument}function up(e){switch(e){case`http://www.w3.org/2000/svg`:return 1;case`http://www.w3.org/1998/Math/MathML`:return 2;default:return 0}}function dp(e,t){if(e===0)switch(t){case`svg`:return 1;case`math`:return 2;default:return 0}return e===1&&t===`foreignObject`?0:e}function fp(e,t,n,r){return n=lp(n).createElement(e),n[Mt]=r,n[Nt]=t,np(n,e,t),Kt(n),n}function pp(e,t){return e===`textarea`||e===`noscript`||typeof t.children==`string`||typeof t.children==`number`||typeof t.children==`bigint`||typeof t.dangerouslySetInnerHTML==`object`&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var mp=null;function hp(){var e=window.event;return e&&e.type===`popstate`?e!==mp&&(mp=e,!0):(mp=null,!1)}var gp=typeof setTimeout==`function`?setTimeout:void 0,_p=typeof clearTimeout==`function`?clearTimeout:void 0,vp=typeof Promise==`function`?Promise:void 0,yp=typeof requestAnimationFrame==`function`?requestAnimationFrame:gp,bp=typeof queueMicrotask==`function`?queueMicrotask:vp===void 0?gp:function(e){return vp.resolve(null).then(e).catch(xp)};function xp(e){setTimeout(function(){throw e})}function Sp(e){return e===`head`}function Cp(e,t){var n=t,r=0;do{var i=n.nextSibling;if(e.removeChild(n),i&&i.nodeType===8){if(n=i.data,n===`/$`||n===`/&`){if(r===0){e.removeChild(i),Hh(t);return}r--}else if(n===`$`||n===`$?`||n===`$~`||n===`$!`||n===`&`)r++;else if(n===`html`)_m(e.ownerDocument.documentElement);else if(n===`head`){n=e.ownerDocument.head,_m(n);for(var a=n.firstChild;a;){var o=a.nextSibling,s=a.nodeName;a[zt]||s===`SCRIPT`||s===`STYLE`||s===`LINK`&&a.rel.toLowerCase()===`stylesheet`||n.removeChild(a),a=o}}else n===`body`&&_m(e.ownerDocument.body)}n=i}while(n);Hh(t)}function wp(e,t){var n=e;e=0;do{var r=n.nextSibling;if(n.nodeType===1?t?(n._stashedDisplay=n.style.display,n.style.display=`none`):(n.style.display=n._stashedDisplay||``,n.getAttribute(`style`)===``&&n.removeAttribute(`style`)):n.nodeType===3&&(t?(n._stashedText=n.nodeValue,n.nodeValue=``):n.nodeValue=n._stashedText||``),r&&r.nodeType===8){if(n=r.data,n===`/$`){if(e===0)break;e--}else n!==`$`&&n!==`$?`&&n!==`$~`&&n!==`$!`||e++}n=r}while(n)}function Tp(e,t,n){if(t=CSS.escape(t)===t?t:`r-`+btoa(t).replace(/=/g,``),e.style.viewTransitionName=t,n!=null&&(e.style.viewTransitionClass=n),n=getComputedStyle(e),n.display===`inline`){if(t=e.getClientRects(),t.length===1)var r=1;else for(var i=r=0;i<t.length;i++){var a=t[i];0<a.width&&0<a.height&&r++}r===1&&(e=e.style,e.display=t.length===1?`inline-block`:`block`,e.marginTop=`-`+n.paddingTop,e.marginBottom=`-`+n.paddingBottom)}}function Ep(e,t){e=e.style,t=t.style;var n=t==null?null:t.hasOwnProperty(`viewTransitionName`)?t.viewTransitionName:t.hasOwnProperty(`view-transition-name`)?t[`view-transition-name`]:null;e.viewTransitionName=n==null||typeof n==`boolean`?``:(``+n).trim(),n=t==null?null:t.hasOwnProperty(`viewTransitionClass`)?t.viewTransitionClass:t.hasOwnProperty(`view-transition-class`)?t[`view-transition-class`]:null,e.viewTransitionClass=n==null||typeof n==`boolean`?``:(``+n).trim(),e.display===`inline-block`&&(t==null?e.display=e.margin=``:(n=t.display,e.display=n==null||typeof n==`boolean`?``:n,n=t.margin,n==null?(n=t.hasOwnProperty(`marginTop`)?t.marginTop:t[`margin-top`],e.marginTop=n==null||typeof n==`boolean`?``:n,t=t.hasOwnProperty(`marginBottom`)?t.marginBottom:t[`margin-bottom`],e.marginBottom=t==null||typeof t==`boolean`?``:t):e.margin=n))}function Dp(e,t,n){return n=n.ownerDocument.defaultView,{rect:e,abs:t.position===`absolute`||t.position===`fixed`,clip:t.clipPath!==`none`||t.overflow!==`visible`||t.filter!==`none`||t.mask!==`none`||t.mask!==`none`||t.borderRadius!==`0px`,view:0<=e.bottom&&0<=e.right&&e.top<=n.innerHeight&&e.left<=n.innerWidth}}function Op(e){return Dp(e.getBoundingClientRect(),getComputedStyle(e),e)}function kp(e){var t=e.getBoundingClientRect();t=new DOMRect(t.x+2e4,t.y+2e4,t.width,t.height);var n=getComputedStyle(e);return Dp(t,n,e)}function Ap(e){return e.documentElement.clientHeight}function jp(e){this.addEventListener(`load`,e),this.addEventListener(`error`,e)}function Mp(e,t,n,r,i,a,o,s,c){var l=t.nodeType===9?t:t.ownerDocument;try{var u=l.startViewTransition({update:function(){var t=l.defaultView,n=t.navigation&&t.navigation.transition,o=l.fonts.status;r();var s=[];if(o===`loaded`&&(Ap(l),l.fonts.status===`loading`&&s.push(l.fonts.ready)),o=s.length,e!==null)for(var c=e.suspenseyImages,u=0,d=0;d<c.length;d++){var f=c[d];if(!f.complete){var p=f.getBoundingClientRect();if(0<p.bottom&&0<p.right&&p.top<t.innerHeight&&p.left<t.innerWidth){if(u+=Xm(f),u>$m){s.length=o;break}f=new Promise(jp.bind(f)),s.push(f)}}}if(0<s.length)return t=Promise.race([Promise.all(s),new Promise(function(e){return setTimeout(e,500)})]).then(i,i),(n?Promise.allSettled([n.finished,t]):t).then(a,a);if(i(),n)return n.finished.then(a,a);a()},types:n});l.__reactViewTransition=u;var d=[];return u.ready.then(function(){for(var e=l.documentElement.getAnimations({subtree:!0}),t=0;t<e.length;t++){var n=e[t],r=n.effect,i=r.pseudoElement;if(i!=null&&i.startsWith(`::view-transition`)){d.push(n),n=r.getKeyframes();for(var a=i=void 0,s=!0,c=0;c<n.length;c++){var u=n[c],f=u.width;if(i===void 0)i=f;else if(i!==f){s=!1;break}if(f=u.height,a===void 0)a=f;else if(a!==f){s=!1;break}delete u.width,delete u.height,u.transform===`none`&&delete u.transform}s&&i!==void 0&&a!==void 0&&(r.setKeyframes(n),s=getComputedStyle(r.target,r.pseudoElement),s.width!==i||s.height!==a)&&(s=n[0],s.width=i,s.height=a,s=n[n.length-1],s.width=i,s.height=a,r.setKeyframes(n))}}o()},function(e){l.__reactViewTransition===u&&(l.__reactViewTransition=null);try{if(typeof e==`object`&&e)switch(e.name){case`InvalidStateError`:(e.message===`View transition was skipped because document visibility state is hidden.`||e.message===`Skipping view transition because document visibility state has become hidden.`||e.message===`Skipping view transition because viewport size changed.`||e.message===`Transition was aborted because of invalid state`)&&(e=null)}e!==null&&c(e)}finally{r(),i(),o()}}),u.finished.finally(function(){for(var e=0;e<d.length;e++)d[e].cancel();l.__reactViewTransition===u&&(l.__reactViewTransition=null),s()}),u}catch{return r(),i(),o(),null}}function Np(e,t){this._scope=document.documentElement,this._selector=`::view-transition-`+e+`(`+t+`)`}Np.prototype.animate=function(e,t){return t=typeof t==`number`?{duration:t}:x({},t),t.pseudoElement=this._selector,this._scope.animate(e,t)},Np.prototype.getAnimations=function(){for(var e=this._scope,t=this._selector,n=e.getAnimations({subtree:!0}),r=[],i=0;i<n.length;i++){var a=n[i].effect;a!==null&&a.target===e&&a.pseudoElement===t&&r.push(n[i])}return r},Np.prototype.getComputedStyle=function(){return getComputedStyle(this._scope,this._selector)};function Pp(e){return{name:e,group:new Np(`group`,e),imagePair:new Np(`image-pair`,e),old:new Np(`old`,e),new:new Np(`new`,e)}}function Fp(e){this._fragmentFiber=e,this._observers=this._eventListeners=null}Fp.prototype.addEventListener=function(e,t,n){var r=null,i=null;if(!(n!=null&&typeof n!=`boolean`&&(r=n.signal||null,r!==null&&r.aborted))){this._eventListeners===null&&(this._eventListeners=[]);var a=this._eventListeners;if(Bp(a,e,t,n)===-1){var o=this,s=t;n!=null&&typeof n!=`boolean`&&!0===n.once&&(s=function(r){o.removeEventListener(e,t,n),typeof t==`function`?t.call(this,r):t.handleEvent(r)}),r!==null&&(i=o.removeEventListener.bind(o,e,t,n),r.addEventListener(`abort`,i,{once:!0}),i=r.removeEventListener.bind(r,`abort`,i)),r=Rp(n),a.push({type:e,listener:t,optionsOrUseCapture:n,attachedListener:s,cleanup:i}),f(this._fragmentFiber.child,!1,Ip,e,s,r)}this._eventListeners=a}};function Ip(e,t,n,r){return _(e).addEventListener(t,n,r),!1}Fp.prototype.removeEventListener=function(e,t,n){var r=this._eventListeners;if(r!==null&&(t=Bp(r,e,t,n),t!==-1)){var i=r[t];n=i.attachedListener;var a=i.cleanup;i=Rp(i.optionsOrUseCapture),f(this._fragmentFiber.child,!1,Lp,e,n,i),r.splice(t,1),a!==null&&a()}};function Lp(e,t,n,r){return _(e).removeEventListener(t,n,r),!1}function Rp(e){return e!=null&&typeof e!=`boolean`&&(!0===e.once||e.signal instanceof AbortSignal)?{capture:e.capture,passive:e.passive}:e}function zp(e){return e==null?`c=0`:typeof e==`boolean`?`c=`+(e?`1`:`0`):`c=`+(e.capture?`1`:`0`)}function Bp(e,t,n,r){if(e.length===0)return-1;r=zp(r);for(var i=0;i<e.length;i++){var a=e[i];if(a.type===t&&a.listener===n&&zp(a.optionsOrUseCapture)===r)return i}return-1}Fp.prototype.dispatchEvent=function(e){var t=p(this._fragmentFiber);if(t===null)return!0;t=_(t);var n=this._eventListeners;if(n!==null&&0<n.length||!e.bubbles){var r=t.nodeType===9?t.createComment(``):document.createTextNode(``);if(n)for(var i=0;i<n.length;i++){var a=n[i];r.addEventListener(a.type,a.attachedListener,Rp(a.optionsOrUseCapture))}if(t.appendChild(r),e=r.dispatchEvent(e),n)for(i=0;i<n.length;i++)a=n[i],r.removeEventListener(a.type,a.attachedListener,Rp(a.optionsOrUseCapture));return t.removeChild(r),e}return t.dispatchEvent(e)},Fp.prototype.focus=function(e){f(this._fragmentFiber.child,!0,Vp,e,void 0,void 0)};function Vp(e,t){return e.tag!==6&&(e=_(e),pm(e,t))}Fp.prototype.focusLast=function(e){var t=[];f(this._fragmentFiber.child,!0,Hp,t,void 0,void 0);for(var n=t.length-1;0<=n&&!Vp(t[n],e);n--);};function Hp(e,t){return t.push(e),!1}Fp.prototype.blur=function(){var e=p(this._fragmentFiber);e!==null&&(e=_(e),e=lp(e).activeElement,e!==null&&f(this._fragmentFiber.child,!1,Up,e,void 0,void 0))};function Up(e,t){return e.tag!==6&&(e=_(e),e===t||e.contains(t)?(t.blur(),!0):!1)}Fp.prototype.observeUsing=function(e){this._observers===null&&(this._observers=new Set),this._observers.add(e),f(this._fragmentFiber.child,!1,Wp,e,void 0,void 0)};function Wp(e,t){return e.tag!==6&&(e=_(e),t.observe(e),!1)}Fp.prototype.unobserveUsing=function(e){var t=this._observers;if(t!==null&&t.has(e)){t.delete(e),f(this._fragmentFiber.child,!1,Gp,e,void 0,void 0);for(var n=t=0;n<Kp.length;n++){var r=Kp[n];r.fragmentInstance===this&&r.observer===e?e.unobserve(r.instance):Kp[t++]=r}Kp.length=t}};function Gp(e,t){return e.tag!==6&&(e=_(e),t.unobserve(e),!1)}var Kp=[],qp=!1;function Jp(e,t,n){Kp.push({fragmentInstance:e,observer:t,instance:n}),qp||(qp=!0,mm(function(){qp=!1;var e=Kp;Kp=[];for(var t=0;t<e.length;t++){var n=e[t];n.observer.unobserve(n.instance)}}))}Fp.prototype.getClientRects=function(){var e=[];return f(this._fragmentFiber.child,!1,Yp,e,void 0,void 0),e};function Yp(e,t){if(e.tag===6){e=e.stateNode;var n=e.ownerDocument.createRange();n.selectNodeContents(e),t.push.apply(t,n.getClientRects())}else e=_(e),t.push.apply(t,e.getClientRects());return!1}Fp.prototype.getRootNode=function(e){var t=p(this._fragmentFiber);return t===null?this:_(t).getRootNode(e)},Fp.prototype.compareDocumentPosition=function(e){var t=p(this._fragmentFiber);if(t===null)return Node.DOCUMENT_POSITION_DISCONNECTED;var n=[];f(this._fragmentFiber.child,!1,Hp,n,void 0,void 0);var r=_(t);if(n.length===0){if(n=r,m(this._fragmentFiber)){a:{for(t=this._fragmentFiber.return;t!==null;){if(t.tag===4){t=t.stateNode.containerInfo;break a}if(t.tag===3||t.tag===5||t.tag===27)break;t=t.return}t=null}t!=null&&(n=t)}t=this._fragmentFiber;var i=r=n.compareDocumentPosition(e);return n===e?i=Node.DOCUMENT_POSITION_CONTAINS:r&Node.DOCUMENT_POSITION_CONTAINED_BY&&(n=h(t)[1],n===null?i=Node.DOCUMENT_POSITION_PRECEDING:(e=_(n).compareDocumentPosition(e),i=e===0||e&Node.DOCUMENT_POSITION_FOLLOWING?Node.DOCUMENT_POSITION_FOLLOWING:Node.DOCUMENT_POSITION_PRECEDING)),i|=Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC}t=_(n[0]),i=_(n[n.length-1]);var a=m(this._fragmentFiber)?t.parentElement:r;if(a==null)return Node.DOCUMENT_POSITION_DISCONNECTED;r=a.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_CONTAINED_BY,a=a.compareDocumentPosition(i)&Node.DOCUMENT_POSITION_CONTAINED_BY;var o=t.compareDocumentPosition(e),s=i.compareDocumentPosition(e),c=o&Node.DOCUMENT_POSITION_CONTAINED_BY||s&Node.DOCUMENT_POSITION_CONTAINED_BY;return s=r&&a&&o&Node.DOCUMENT_POSITION_FOLLOWING&&s&Node.DOCUMENT_POSITION_PRECEDING,t=r&&t===e||a&&i===e||c||s?Node.DOCUMENT_POSITION_CONTAINED_BY:!r&&t===e||!a&&i===e?Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:o,t&Node.DOCUMENT_POSITION_DISCONNECTED||t&Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC||Xp(t,this._fragmentFiber,n[0],n[n.length-1],e)?t:Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC};function Xp(e,t,n,r,i){var a=Ht(i);if(e&Node.DOCUMENT_POSITION_CONTAINED_BY){if(n=!!a)a:{for(;a!==null;){if(a.tag===7&&(a===t||a.alternate===t)){n=!0;break a}a=a.return}n=!1}return n}if(e&Node.DOCUMENT_POSITION_CONTAINS){if(a===null)return a=i.ownerDocument,i===a||i===a.documentElement||i===a.body;a:{for(a=t,t=p(t);a!==null;){if(!(a.tag!==5&&a.tag!==3&&a.tag!==27||a!==t&&a.alternate!==t)){a=!0;break a}a=a.return}a=!1}return a}return e&Node.DOCUMENT_POSITION_PRECEDING?((t=!!a)&&!(t=a===n)&&(t=re(n,a,ne),t===null?t=!1:(f(t,!0,ee,a,n),a=v,v=null,t=a!==null)),t):e&Node.DOCUMENT_POSITION_FOLLOWING?((t=!!a)&&!(t=a===r)&&(t=re(r,a,ne),t===null?t=!1:(f(t,!0,te,a,r),a=v,b=v=null,t=a!==null)),t):!1}function Zp(e,t){var n=e.ownerDocument.createRange();n.selectNodeContents(e),e=n.getBoundingClientRect(),window.scrollTo(window.scrollX+e.left,t?window.scrollY+e.top:window.scrollY+e.bottom-window.innerHeight)}Fp.prototype.scrollIntoView=function(e){if(typeof e==`object`)throw Error(i(566));var t=[];f(this._fragmentFiber.child,!1,Hp,t,void 0,void 0);var n=!1!==e;if(t.length===0){var r=h(this._fragmentFiber);if(r=n?r[1]||r[0]||p(this._fragmentFiber):r[0]||r[1],r===null)return;if(r.tag===6){e=_(r),Zp(e,n);return}if(r=_(r),r.nodeType!==9){if(r.nodeType===11){n=`host`in r?r.host:null,n!==null&&n.scrollIntoView(e);return}r.scrollIntoView(e)}}for(r=n?t.length-1:0;r!==(n?-1:t.length);){var a=t[r];a.tag===6?(a=_(a),Zp(a,n)):_(a).scrollIntoView(e),r+=n?-1:1}};function Qp(e,t){return e=_(e),$p(e,t),!1}function $p(e,t){e.reactFragments??=new Set,e.reactFragments.add(t)}function em(e,t){var n=t._eventListeners;if(n!==null)for(var r=0;r<n.length;r++){var i=n[r];e.addEventListener(i.type,i.attachedListener,Rp(i.optionsOrUseCapture))}e.nodeType!==3&&(n=t._observers,n!==null&&n.forEach(function(n){for(var r=0,i=0;i<Kp.length;i++){var a=Kp[i];(a.fragmentInstance!==t||a.observer!==n||a.instance!==e)&&(Kp[r++]=a)}Kp.length=r,n.observe(e)}),$p(e,t))}function tm(e,t){var n=t._eventListeners;if(n!==null)for(var r=0;r<n.length;r++){var i=n[r];e.removeEventListener(i.type,i.attachedListener,Rp(i.optionsOrUseCapture))}e.nodeType!==3&&(n=t._observers,n!==null&&n.forEach(function(n){typeof n.rootMargin==`string`?Jp(t,n,e):n.unobserve(e)}),e.reactFragments!=null&&e.reactFragments.delete(t))}function nm(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var n=t;switch(t=t.nextSibling,n.nodeName){case`HTML`:case`HEAD`:case`BODY`:nm(n),Vt(n);continue;case`SCRIPT`:case`STYLE`:continue;case`LINK`:if(n.rel.toLowerCase()===`stylesheet`)continue}e.removeChild(n)}}function rm(e,t,n,r){for(;e.nodeType===1;){var i=n;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!r&&(e.nodeName!==`INPUT`||e.type!==`hidden`))break}else if(!r){if(t===`input`&&e.type===`hidden`){var a=i.name==null?null:``+i.name;if(i.type===`hidden`&&e.getAttribute(`name`)===a)return e}else return e}else if(!e[zt])switch(t){case`meta`:if(!e.hasAttribute(`itemprop`))break;return e;case`link`:if(a=e.getAttribute(`rel`),a===`stylesheet`&&e.hasAttribute(`data-precedence`)||a!==i.rel||e.getAttribute(`href`)!==(i.href==null||i.href===``?null:i.href)||e.getAttribute(`crossorigin`)!==(i.crossOrigin==null?null:i.crossOrigin)||e.getAttribute(`title`)!==(i.title==null?null:i.title))break;return e;case`style`:if(e.hasAttribute(`data-precedence`))break;return e;case`script`:if(a=e.getAttribute(`src`),(a!==(i.src==null?null:i.src)||e.getAttribute(`type`)!==(i.type==null?null:i.type)||e.getAttribute(`crossorigin`)!==(i.crossOrigin==null?null:i.crossOrigin))&&a&&e.hasAttribute(`async`)&&!e.hasAttribute(`itemprop`))break;return e;default:return e}if(e=lm(e.nextSibling),e===null)break}return null}function im(e,t,n){if(t===``)return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!==`INPUT`||e.type!==`hidden`)&&!n||(e=lm(e.nextSibling),e===null))return null;return e}function am(e,t){for(;e.nodeType!==8;)if((e.nodeType!==1||e.nodeName!==`INPUT`||e.type!==`hidden`)&&!t||(e=lm(e.nextSibling),e===null))return null;return e}function om(e){return e.data===`$?`||e.data===`$~`}function sm(e){return e.data===`$!`||e.data===`$?`&&e.ownerDocument.readyState!==`loading`}function cm(e,t){var n=e.ownerDocument;if(e.data===`$~`)e._reactRetry=t;else if(e.data!==`$?`||n.readyState!==`loading`)t();else{var r=function(){t(),n.removeEventListener(`DOMContentLoaded`,r)};n.addEventListener(`DOMContentLoaded`,r),e._reactRetry=r}}function lm(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t===`$`||t===`$!`||t===`$?`||t===`$~`||t===`&`||t===`F!`||t===`F`)break;if(t===`/$`||t===`/&`)return null}}return e}var um=null;function dm(e){e=e.nextSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n===`/$`||n===`/&`){if(t===0)return lm(e.nextSibling);t--}else n!==`$`&&n!==`$!`&&n!==`$?`&&n!==`$~`&&n!==`&`||t++}e=e.nextSibling}return null}function fm(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n===`$`||n===`$!`||n===`$?`||n===`$~`||n===`&`){if(t===0)return e;t--}else n!==`/$`&&n!==`/&`||t++}e=e.previousSibling}return null}function pm(e,t){function n(){r=!0}if(e.ownerDocument.activeElement===e)return!0;var r=!1;try{e.ownerDocument.addEventListener(`focus`,n,!0),(e.focus||HTMLElement.prototype.focus).call(e,t)}finally{e.ownerDocument.removeEventListener(`focus`,n,!0)}return r}function mm(e){yp(function(){yp(function(t){return e(t)})})}function hm(e,t,n){switch(t=lp(n),e){case`html`:if(e=t.documentElement,!e)throw Error(i(452));return e;case`head`:if(e=t.head,!e)throw Error(i(453));return e;case`body`:if(e=t.body,!e)throw Error(i(454));return e;default:throw Error(i(451))}}function gm(e,t,n){for(var r in n){var i=n[r];n.hasOwnProperty(r)&&i!=null&&$(e,t,r,null,rp,i)}n.dangerouslySetInnerHTML!=null&&(e.textContent=``),e.onclick===N&&(e.onclick=null),Vt(e)}function _m(e){for(var t=e.attributes;t.length;)e.removeAttributeNode(t[0]);Vt(e)}var vm=new Map,ym=new Set;function bm(e){if(typeof e.getRootNode==`function`){var t=e.getRootNode();if(t.nodeType===9||t.nodeType===11)return t}return e.nodeType===9?e:e.ownerDocument}var xm=w.d;w.d={f:Sm,r:Cm,D:Em,C:Dm,L:Om,m:km,X:jm,S:Am,M:Mm};function Sm(){var e=xm.f(),t=zd();return e||t}function Cm(e){var t=Ut(e);t!==null&&t.tag===5&&t.type===`form`?ac(t):xm.r(e)}var wm=typeof document>`u`?null:document;function Tm(e,t,n){var r=wm;if(r&&typeof t==`string`&&t){var i=dn(t);i=`link[rel="`+e+`"][href="`+i+`"]`,typeof n==`string`&&(i+=`[crossorigin="`+n+`"]`),ym.has(i)||(ym.add(i),e={rel:e,crossOrigin:n,href:t},r.querySelector(i)===null&&(t=r.createElement(`link`),np(t,`link`,e),Kt(t),r.head.appendChild(t)))}}function Em(e){xm.D(e),Tm(`dns-prefetch`,e,null)}function Dm(e,t){xm.C(e,t),Tm(`preconnect`,e,t)}function Om(e,t,n){xm.L(e,t,n);var r=wm;if(r&&e&&t){var i=`link[rel="preload"][as="`+dn(t)+`"]`;t===`image`&&n&&n.imageSrcSet?(i+=`[imagesrcset="`+dn(n.imageSrcSet)+`"]`,typeof n.imageSizes==`string`&&(i+=`[imagesizes="`+dn(n.imageSizes)+`"]`)):i+=`[href="`+dn(e)+`"]`;var a=i;switch(t){case`style`:a=Pm(e);break;case`script`:a=Rm(e)}if(!(vm.has(a)||(e=x({rel:`preload`,href:t===`image`&&n&&n.imageSrcSet?void 0:e,as:t},n),vm.set(a,e),r.querySelector(i)!==null||t===`style`&&r.querySelector(Fm(a))||t===`script`&&r.querySelector(zm(a))))){var o=r.createElement(`link`);np(o,`link`,e),t===`style`&&(o[Bt]=!0,o.onload=o.onerror=function(){qt(o)}),Kt(o),r.head.appendChild(o)}}}function km(e,t){xm.m(e,t);var n=wm;if(n&&e){var r=t&&typeof t.as==`string`?t.as:`script`,i=`link[rel="modulepreload"][as="`+dn(r)+`"][href="`+dn(e)+`"]`,a=i;switch(r){case`audioworklet`:case`paintworklet`:case`serviceworker`:case`sharedworker`:case`worker`:case`script`:a=Rm(e)}if(!vm.has(a)&&(e=x({rel:`modulepreload`,href:e},t),vm.set(a,e),n.querySelector(i)===null)){switch(r){case`audioworklet`:case`paintworklet`:case`serviceworker`:case`sharedworker`:case`worker`:case`script`:if(n.querySelector(zm(a)))return}r=n.createElement(`link`),np(r,`link`,e),Kt(r),n.head.appendChild(r)}}}function Am(e,t,n){xm.S(e,t,n);var r=wm;if(r&&e){var i=Gt(r).hoistableStyles,a=Pm(e);t||=`default`;var o=i.get(a);if(!o){var s={loading:0,preload:null};if(o=r.querySelector(Fm(a)))s.loading=5;else{e=x({rel:`stylesheet`,href:e,"data-precedence":t},n),(n=vm.get(a))&&Hm(e,n);var c=o=r.createElement(`link`);Kt(c),np(c,`link`,e),c._p=new Promise(function(e,t){c.onload=e,c.onerror=t}),c.addEventListener(`load`,function(){s.loading|=1}),c.addEventListener(`error`,function(){s.loading|=2}),s.loading|=4,Vm(o,t,r)}o={type:`stylesheet`,instance:o,count:1,state:s},i.set(a,o)}}}function jm(e,t){xm.X(e,t);var n=wm;if(n&&e){var r=Gt(n).hoistableScripts,i=Rm(e),a=r.get(i);a||(a=n.querySelector(zm(i)),a||(e=x({src:e,async:!0},t),(t=vm.get(i))&&Um(e,t),a=n.createElement(`script`),Kt(a),np(a,`link`,e),n.head.appendChild(a)),a={type:`script`,instance:a,count:1,state:null},r.set(i,a))}}function Mm(e,t){xm.M(e,t);var n=wm;if(n&&e){var r=Gt(n).hoistableScripts,i=Rm(e),a=r.get(i);a||(a=n.querySelector(zm(i)),a||(e=x({src:e,async:!0,type:`module`},t),(t=vm.get(i))&&Um(e,t),a=n.createElement(`script`),Kt(a),np(a,`link`,e),n.head.appendChild(a)),a={type:`script`,instance:a,count:1,state:null},r.set(i,a))}}function Nm(e,t,n,r){var a=(a=Me.current)?bm(a):null;if(!a)throw Error(i(446));switch(e){case`meta`:case`title`:return null;case`style`:return typeof n.precedence==`string`&&typeof n.href==`string`?(n=Pm(n.href),t=Gt(a).hoistableStyles,r=t.get(n),r||(r={type:`style`,instance:null,count:0,state:null},t.set(n,r)),r):{type:`void`,instance:null,count:0,state:null};case`link`:if(n.rel===`stylesheet`&&typeof n.href==`string`&&typeof n.precedence==`string`){e=Pm(n.href);var o=Gt(a).hoistableStyles,s=o.get(e);if(s||(a=a.ownerDocument||a,s={type:`stylesheet`,instance:null,count:0,state:{loading:0,preload:null}},o.set(e,s),(o=a.querySelector(Fm(e)))?o._p||(s.instance=o,s.state.loading=5):(o=vm.get(e),o||(o={rel:`preload`,as:`style`,href:n.href,crossOrigin:n.crossOrigin,integrity:n.integrity,media:n.media,hrefLang:n.hrefLang,referrerPolicy:n.referrerPolicy},vm.set(e,o)),Lm(a,e,o,s.state))),t&&r===null)throw Error(i(528,``));return s}if(t&&r!==null)throw Error(i(529,``));return null;case`script`:return t=n.async,n=n.src,typeof n==`string`&&t&&typeof t!=`function`&&typeof t!=`symbol`?(n=Rm(n),t=Gt(a).hoistableScripts,r=t.get(n),r||(r={type:`script`,instance:null,count:0,state:null},t.set(n,r)),r):{type:`void`,instance:null,count:0,state:null};default:throw Error(i(444,e))}}function Pm(e){return`href="`+dn(e)+`"`}function Fm(e){return`link[rel="stylesheet"][`+e+`]`}function Im(e){return x({},e,{"data-precedence":e.precedence,precedence:null})}function Lm(e,t,n,r){if(t=e.querySelector(`link[rel="preload"][as="style"][`+t+`]`)){if(!0!==t[Bt]){r.loading=1;return}}else t=e.createElement(`link`),t[Bt]=!0,t.onload=t.onerror=qt.bind(null,t),np(t,`link`,n),Kt(t),e.head.appendChild(t);r.preload=t,t.addEventListener(`load`,function(){return r.loading|=1}),t.addEventListener(`error`,function(){return r.loading|=2})}function Rm(e){return`[src="`+dn(e)+`"]`}function zm(e){return`script[async]`+e}function Bm(e,t,n){if(t.count++,t.instance===null)switch(t.type){case`style`:var r=e.querySelector(`style[data-href~="`+dn(n.href)+`"]`);if(r)return t.instance=r,Kt(r),r;var a=x({},n,{"data-href":n.href,"data-precedence":n.precedence,href:null,precedence:null});return r=(e.ownerDocument||e).createElement(`style`),Kt(r),np(r,`style`,a),Vm(r,n.precedence,e),t.instance=r;case`stylesheet`:a=Pm(n.href);var o=e.querySelector(Fm(a));if(o)return t.state.loading|=4,t.instance=o,Kt(o),o;r=Im(n),(a=vm.get(a))&&Hm(r,a),o=(e.ownerDocument||e).createElement(`link`),Kt(o);var s=o;return s._p=new Promise(function(e,t){s.onload=e,s.onerror=t}),np(o,`link`,r),t.state.loading|=4,Vm(o,n.precedence,e),t.instance=o;case`script`:return o=Rm(n.src),(a=e.querySelector(zm(o)))?(t.instance=a,Kt(a),a):(r=n,(a=vm.get(o))&&(r=x({},n),Um(r,a)),e=e.ownerDocument||e,a=e.createElement(`script`),Kt(a),np(a,`link`,r),e.head.appendChild(a),t.instance=a);case`void`:return null;default:throw Error(i(443,t.type))}else t.type===`stylesheet`&&!(t.state.loading&4)&&(r=t.instance,t.state.loading|=4,Vm(r,n.precedence,e));return t.instance}function Vm(e,t,n){for(var r=n.querySelectorAll(`link[rel="stylesheet"][data-precedence],style[data-precedence]`),i=r.length?r[r.length-1]:null,a=i,o=0;o<r.length;o++){var s=r[o];if(s.dataset.precedence===t)a=s;else if(a!==i)break}a?a.parentNode.insertBefore(e,a.nextSibling):(t=n.nodeType===9?n.head:n,t.insertBefore(e,t.firstChild))}function Hm(e,t){e.crossOrigin??=t.crossOrigin,e.referrerPolicy??=t.referrerPolicy,e.title??=t.title}function Um(e,t){e.crossOrigin??=t.crossOrigin,e.referrerPolicy??=t.referrerPolicy,e.integrity??=t.integrity}var Wm=null;function Gm(e,t,n){if(Wm===null){var r=new Map,i=Wm=new Map;i.set(n,r)}else i=Wm,r=i.get(n),r||(r=new Map,i.set(n,r));if(r.has(e))return r;for(r.set(e,null),n=n.getElementsByTagName(e),i=0;i<n.length;i++){var a=n[i];if(!(a[zt]||a[Mt]||e===`link`&&a.getAttribute(`rel`)===`stylesheet`)&&a.namespaceURI!==`http://www.w3.org/2000/svg`){var o=a.getAttribute(t)||``;o=e+o;var s=r.get(o);s?s.push(a):r.set(o,[a])}}return r}function Km(e,t,n){e=e.ownerDocument||e,e.head.insertBefore(n,t===`title`?e.querySelector(`head > title`):null)}function qm(e,t,n){if(n===1||t.itemProp!=null)return!1;switch(e){case`meta`:case`title`:return!0;case`style`:if(typeof t.precedence!=`string`||typeof t.href!=`string`||t.href===``)break;return!0;case`link`:if(typeof t.rel!=`string`||typeof t.href!=`string`||t.href===``||t.onLoad||t.onError)break;switch(t.rel){case`stylesheet`:return e=t.disabled,typeof t.precedence==`string`&&e==null;default:return!0}case`script`:if(t.async&&typeof t.async!=`function`&&typeof t.async!=`symbol`&&!t.onLoad&&!t.onError&&t.src&&typeof t.src==`string`)return!0}return!1}function Jm(e,t){return e===`img`&&t.src!=null&&t.src!==``&&t.onLoad==null&&t.loading!==`lazy`}function Ym(e){return!(e.type===`stylesheet`&&!(e.state.loading&3))}function Xm(e){return(e.width||100)*(e.height||100)*(typeof devicePixelRatio==`number`?devicePixelRatio:1)*.25}function Zm(e,t){typeof t.decode==`function`&&(e.imgCount++,t.complete||(e.imgBytes+=Xm(t),e.suspenseyImages.push(t)),e=rh.bind(e),t.decode().then(e,e))}function Qm(e,t,n,r){if(n.type===`stylesheet`&&(typeof r.media!=`string`||!1!==matchMedia(r.media).matches)&&!(n.state.loading&4)){if(n.instance===null){var i=Pm(r.href),a=t.querySelector(Fm(i));if(a){t=a._p,typeof t==`object`&&t&&typeof t.then==`function`&&(e.count++,e=nh.bind(e),t.then(e,e)),n.state.loading|=4,n.instance=a,Kt(a);return}a=t.ownerDocument||t,r=Im(r),(i=vm.get(i))&&Hm(r,i),a=a.createElement(`link`),Kt(a);var o=a;o._p=new Promise(function(e,t){o.onload=e,o.onerror=t}),np(a,`link`,r),n.instance=a}e.stylesheets===null&&(e.stylesheets=new Map),e.stylesheets.set(n,t),(t=n.state.preload)&&!(n.state.loading&3)&&(e.count++,n=nh.bind(e),t.addEventListener(`load`,n),t.addEventListener(`error`,n))}}var $m=0;function eh(e,t){return e.stylesheets&&e.count===0&&ah(e,e.stylesheets),0<e.count||0<e.imgCount?function(n){var r=setTimeout(function(){if(e.stylesheets&&ah(e,e.stylesheets),e.unsuspend){var t=e.unsuspend;e.unsuspend=null,t()}},6e4+t);0<e.imgBytes&&$m===0&&($m=62500*op());var i=setTimeout(function(){if(e.waitingForImages=!1,e.count===0&&(e.stylesheets&&ah(e,e.stylesheets),e.unsuspend)){var t=e.unsuspend;e.unsuspend=null,t()}},(e.imgBytes>$m?50:800)+t);return e.unsuspend=n,function(){e.unsuspend=null,clearTimeout(r),clearTimeout(i)}}:null}function th(e){if(e.count===0&&(e.imgCount===0||!e.waitingForImages)){if(e.stylesheets)ah(e,e.stylesheets);else if(e.unsuspend){var t=e.unsuspend;e.unsuspend=null,t()}}}function nh(){this.count--,th(this)}function rh(){this.imgCount--,th(this)}var ih=null;function ah(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,ih=new Map,t.forEach(oh,e),ih=null,nh.call(e))}function oh(e,t){if(!(t.state.loading&4)){var n=ih.get(e);if(n)var r=n.get(null);else{n=new Map,ih.set(e,n);for(var i=e.querySelectorAll(`link[data-precedence],style[data-precedence]`),a=0;a<i.length;a++){var o=i[a];(o.nodeName===`LINK`||o.getAttribute(`media`)!==`not all`)&&(n.set(o.dataset.precedence,o),r=o)}r&&n.set(null,r)}i=t.instance,o=i.getAttribute(`data-precedence`),a=n.get(o)||r,a===r&&n.set(null,i),n.set(o,i),this.count++,r=nh.bind(this),i.addEventListener(`load`,r),i.addEventListener(`error`,r),a?a.parentNode.insertBefore(i,a.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(i,e.firstChild)),t.state.loading|=4}}var sh={$$typeof:S,Provider:null,Consumer:null,_currentValue:Ee,_currentValue2:Ee,_threadCount:0};function ch(e,t,n,r,i,a,o,s,c){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=xt(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=xt(0),this.hiddenUpdates=xt(null),this.identifierPrefix=r,this.onUncaughtError=i,this.onCaughtError=a,this.onRecoverableError=o,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=c,this.transitionTypes=null,this.incompleteTransitions=new Map}function lh(e,t,n,r,i,a,o,s,c,l,u,d){return e=new ch(e,t,n,o,c,l,u,d,s),t=1,!0===a&&(t|=24),a=Ri(3,null,null,t),e.current=a,a.stateNode=e,t=Ia(),t.refCount++,e.pooledCache=t,t.refCount++,a.memoizedState={element:r,isDehydrated:n,cache:t},yo(a),e}function uh(e){return e?(e=Ii,e):Ii}function dh(e,t,n,r,i,a){i=uh(i),r.context===null?r.context=i:r.pendingContext=i,r=xo(t),r.payload={element:n},a=a===void 0?null:a,a!==null&&(r.callback=a),n=So(e,r,t),n!==null&&(Pd(n,e,t),Co(n,e,t))}function fh(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function ph(e,t){fh(e,t),(e=e.alternate)&&fh(e,t)}function mh(e){if(e.tag===13||e.tag===31){var t=Ni(e,67108864);t!==null&&Pd(t,e,67108864),ph(e,67108864)}}function hh(e){if(e.tag===13||e.tag===31){var t=jd();t=Dt(t);var n=Ni(e,t);n!==null&&Pd(n,e,t),ph(e,t)}}var gh=!0;function _h(e,t,n,r){var i=C.T;C.T=null;var a=w.p;try{w.p=2,yh(e,t,n,r)}finally{w.p=a,C.T=i}}function vh(e,t,n,r){var i=C.T;C.T=null;var a=w.p;try{w.p=8,yh(e,t,n,r)}finally{w.p=a,C.T=i}}function yh(e,t,n,r){if(gh){var i=bh(r);if(i===null)Kf(e,t,r,xh,n),Mh(e,r);else if(Ph(i,e,t,n,r))r.stopPropagation();else if(Mh(e,r),t&4&&-1<jh.indexOf(e)){for(;i!==null;){var a=Ut(i);if(a!==null)switch(a.tag){case 3:if(a=a.stateNode,a.current.memoizedState.isDehydrated){var o=ht(a.pendingLanes);if(o!==0){var s=a;for(s.pendingLanes|=2,s.entangledLanes|=2;o;){var c=1<<31-ct(o);s.entanglements[1]|=c,o&=~c}Ef(a),!(W&6)&&(_d=Xe()+500,Df(0,!1))}}break;case 31:case 13:s=Ni(a,2),s!==null&&Pd(s,a,2),zd(),ph(a,2)}if(a=bh(r),a===null&&Kf(e,t,r,xh,n),a===i)break;i=a}i!==null&&r.stopPropagation()}else Kf(e,t,r,null,n)}}function bh(e){return e=En(e),Sh(e)}var xh=null;function Sh(e){if(xh=null,e=Ht(e),e!==null){var t=o(e);if(t===null)e=null;else{var n=t.tag;if(n===13){if(e=s(t),e!==null)return e;e=null}else if(n===31){if(e=c(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return xh=e,null}function Ch(e){switch(e){case`beforetoggle`:case`cancel`:case`click`:case`close`:case`contextmenu`:case`copy`:case`cut`:case`auxclick`:case`dblclick`:case`dragend`:case`dragstart`:case`drop`:case`focusin`:case`focusout`:case`input`:case`invalid`:case`keydown`:case`keypress`:case`keyup`:case`mousedown`:case`mouseup`:case`paste`:case`pause`:case`play`:case`pointercancel`:case`pointerdown`:case`pointerup`:case`ratechange`:case`reset`:case`seeked`:case`submit`:case`toggle`:case`touchcancel`:case`touchend`:case`touchstart`:case`volumechange`:case`change`:case`selectionchange`:case`textInput`:case`compositionstart`:case`compositionend`:case`compositionupdate`:case`beforeblur`:case`afterblur`:case`beforeinput`:case`blur`:case`fullscreenchange`:case`fullscreenerror`:case`focus`:case`hashchange`:case`popstate`:case`select`:case`selectstart`:return 2;case`drag`:case`dragenter`:case`dragexit`:case`dragleave`:case`dragover`:case`mousemove`:case`mouseout`:case`mouseover`:case`pointermove`:case`pointerout`:case`pointerover`:case`resize`:case`scroll`:case`touchmove`:case`wheel`:case`mouseenter`:case`mouseleave`:case`pointerenter`:case`pointerleave`:return 8;case`message`:switch(Ze()){case Qe:return 2;case $e:return 8;case et:case tt:return 32;case nt:return 268435456;default:return 32}default:return 32}}var wh=!1,Th=null,Eh=null,Dh=null,Oh=new Map,kh=new Map,Ah=[],jh=`mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset`.split(` `);function Mh(e,t){switch(e){case`focusin`:case`focusout`:Th=null;break;case`dragenter`:case`dragleave`:Eh=null;break;case`mouseover`:case`mouseout`:Dh=null;break;case`pointerover`:case`pointerout`:Oh.delete(t.pointerId);break;case`gotpointercapture`:case`lostpointercapture`:kh.delete(t.pointerId)}}function Nh(e,t,n,r,i,a){return e===null||e.nativeEvent!==a?(e={blockedOn:t,domEventName:n,eventSystemFlags:r,nativeEvent:a,targetContainers:[i]},t!==null&&(t=Ut(t),t!==null&&mh(t)),e):(e.eventSystemFlags|=r,t=e.targetContainers,i!==null&&t.indexOf(i)===-1&&t.push(i),e)}function Ph(e,t,n,r,i){switch(t){case`focusin`:return Th=Nh(Th,e,t,n,r,i),!0;case`dragenter`:return Eh=Nh(Eh,e,t,n,r,i),!0;case`mouseover`:return Dh=Nh(Dh,e,t,n,r,i),!0;case`pointerover`:var a=i.pointerId;return Oh.set(a,Nh(Oh.get(a)||null,e,t,n,r,i)),!0;case`gotpointercapture`:return a=i.pointerId,kh.set(a,Nh(kh.get(a)||null,e,t,n,r,i)),!0}return!1}function Fh(e){var t=Ht(e.target);if(t!==null){var n=o(t);if(n!==null){if(t=n.tag,t===13){if(t=s(n),t!==null){e.blockedOn=t,At(e.priority,function(){hh(n)});return}}else if(t===31){if(t=c(n),t!==null){e.blockedOn=t,At(e.priority,function(){hh(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Ih(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=bh(e.nativeEvent);if(n===null){n=e.nativeEvent;var r=new n.constructor(n.type,n);Tn=r,n.target.dispatchEvent(r),Tn=null}else return t=Ut(n),t!==null&&mh(t),e.blockedOn=n,!1;t.shift()}return!0}function Lh(e,t,n){Ih(e)&&n.delete(t)}function Rh(){wh=!1,Th!==null&&Ih(Th)&&(Th=null),Eh!==null&&Ih(Eh)&&(Eh=null),Dh!==null&&Ih(Dh)&&(Dh=null),Oh.forEach(Lh),kh.forEach(Lh)}function zh(e,n){e.blockedOn===n&&(e.blockedOn=null,wh||(wh=!0,t.unstable_scheduleCallback(t.unstable_NormalPriority,Rh)))}var Bh=null;function Vh(e){Bh!==e&&(Bh=e,t.unstable_scheduleCallback(t.unstable_NormalPriority,function(){Bh===e&&(Bh=null);for(var t=0;t<e.length;t+=3){var n=e[t],r=e[t+1],i=e[t+2];if(typeof r!=`function`){if(Sh(r||n)===null)continue;break}var a=Ut(n);a!==null&&(e.splice(t,3),t-=3,rc(a,{pending:!0,data:i,method:n.method,action:r},r,i))}}))}function Hh(e){function t(t){return zh(t,e)}Th!==null&&zh(Th,e),Eh!==null&&zh(Eh,e),Dh!==null&&zh(Dh,e),Oh.forEach(t),kh.forEach(t);for(var n=0;n<Ah.length;n++){var r=Ah[n];r.blockedOn===e&&(r.blockedOn=null)}for(;0<Ah.length&&(n=Ah[0],n.blockedOn===null);)Fh(n),n.blockedOn===null&&Ah.shift();if(n=(e.ownerDocument||e).$$reactFormReplay,n!=null)for(r=0;r<n.length;r+=3){var i=n[r],a=n[r+1],o=i[Nt]||null;if(typeof a==`function`)o||Vh(n);else if(o){var s=null;if(a&&a.hasAttribute(`formAction`)){if(i=a,o=a[Nt]||null)s=o.formAction;else if(Sh(i)!==null)continue}else s=o.action;typeof s==`function`?n[r+1]=s:(n.splice(r,3),r-=3),Vh(n)}}}function Uh(){function e(e){e.canIntercept&&e.info===`react-transition`&&e.intercept({handler:function(){return new Promise(function(e){return i=e})},focusReset:`manual`,scroll:`manual`})}function t(){i!==null&&(i(),i=null),r||setTimeout(n,20)}function n(){if(!r&&!navigation.transition){var e=navigation.currentEntry;e&&e.url!=null&&navigation.navigate(e.url,{state:e.getState(),info:`react-transition`,history:`replace`})}}if(typeof navigation==`object`){var r=!1,i=null;return navigation.addEventListener(`navigate`,e),navigation.addEventListener(`navigatesuccess`,t),navigation.addEventListener(`navigateerror`,t),setTimeout(n,100),function(){r=!0,navigation.removeEventListener(`navigate`,e),navigation.removeEventListener(`navigatesuccess`,t),navigation.removeEventListener(`navigateerror`,t),i!==null&&(i(),i=null)}}}function Wh(e){this._internalRoot=e}Gh.prototype.render=Wh.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(i(409));var n=t.current;dh(n,jd(),e,t,null,null)},Gh.prototype.unmount=Wh.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;dh(e.current,2,null,e,null,null),zd(),t[Pt]=null}};function Gh(e){this._internalRoot=e}Gh.prototype.unstable_scheduleHydration=function(e){if(e){var t=kt();e={blockedOn:null,target:e,priority:t};for(var n=0;n<Ah.length&&t!==0&&t<Ah[n].priority;n++);Ah.splice(n,0,e),n===0&&Fh(e)}};var Kh=n.version;if(Kh!==`19.3.0`)throw Error(i(527,Kh,`19.3.0`));w.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render==`function`?Error(i(188)):(e=Object.keys(e).join(`,`),Error(i(268,e)));return e=u(t),e=e===null?null:d(e),e=e===null?null:e.stateNode,e};var qh={bundleType:0,version:`19.3.0`,rendererPackageName:`react-dom`,currentDispatcherRef:C,reconcilerVersion:`19.3.0`};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<`u`){var Jh=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Jh.isDisabled&&Jh.supportsFiber)try{at=Jh.inject(qh),ot=Jh}catch{}}e.createRoot=function(e,t){if(!a(e))throw Error(i(299));var n=!1,r=``,o=Ec,s=Dc,c=Oc;return t!=null&&(!0===t.unstable_strictMode&&(n=!0),t.identifierPrefix!==void 0&&(r=t.identifierPrefix),t.onUncaughtError!==void 0&&(o=t.onUncaughtError),t.onCaughtError!==void 0&&(s=t.onCaughtError),t.onRecoverableError!==void 0&&(c=t.onRecoverableError)),t=lh(e,1,!1,null,null,n,r,null,o,s,c,Uh),e[Pt]=t.current,Wf(e),new Wh(t)}})),ze=t(((e,t)=>{function n(){if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<`u`&&typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE==`function`)try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(e){console.error(e)}}n(),t.exports=Re()}))(),D=e(y(),1),O=Ne(),Be=/^\s*(```|~~~)\s*([\w+-]*)\s*$/,Ve=/^\s{0,3}(#{1,6})\s+(.*)$/,He=/^\s{0,3}[-*+]\s+(.*)$/,Ue=/^\s{0,3}\d+[.)]\s+(.*)$/,We=/^\s{0,3}([-*_])(\s*\1){2,}\s*$/,Ge=/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;function Ke(e){let t=e.trim();return t.startsWith(`|`)&&(t=t.slice(1)),t.endsWith(`|`)&&(t=t.slice(0,-1)),t.split(`|`).map(e=>e.trim())}function qe(e){let t=e.replace(/\r\n?/g,`
`).split(`
`),n=[],r=0;for(;r<t.length;){let e=t[r],i=e.match(Be);if(i){let e=[];for(r++;r<t.length&&!t[r].match(Be);)e.push(t[r++]);r++,n.push({t:`code`,lang:i[2]??``,text:e.join(`
`)});continue}if(!e.trim()){r++;continue}let a=e.match(Ve);if(a){n.push({t:`heading`,level:a[1].length,text:a[2].replace(/#+\s*$/,``)}),r++;continue}if(We.test(e)){n.push({t:`rule`}),r++;continue}if(e.includes(`|`)&&r+1<t.length&&Ge.test(t[r+1])){let i=Ke(e),a=[];for(r+=2;r<t.length&&t[r].includes(`|`)&&t[r].trim();)a.push(Ke(t[r++]));n.push({t:`table`,head:i,rows:a});continue}if(He.test(e)||Ue.test(e)){let i=!He.test(e),a=[];for(;r<t.length;){let e=t[r].match(i?Ue:He);if(e)a.push(e[1]),r++;else if(t[r].trim()&&/^\s{2,}/.test(t[r])&&a.length)a[a.length-1]+=`
`+t[r].trim(),r++;else break}n.push({t:`list`,ordered:i,items:a});continue}if(/^\s{0,3}>/.test(e)){let e=[];for(;r<t.length&&/^\s{0,3}>/.test(t[r]);)e.push(t[r++].replace(/^\s{0,3}>\s?/,``));n.push({t:`quote`,text:e.join(`
`)});continue}let o=[];for(;r<t.length&&t[r].trim()&&!Be.test(t[r])&&!Ve.test(t[r])&&!He.test(t[r])&&!Ue.test(t[r])&&!We.test(t[r])&&!(t[r].includes(`|`)&&r+1<t.length&&Ge.test(t[r+1]));)o.push(t[r++]);n.push({t:`para`,text:o.join(`
`)})}return n}var Je=/(`+)([\s\S]*?)\1|\$\$([^$]+)\$\$|\$([^$\n]+)\$|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\n]+)\*|(?<![\w])_([^_\n]+)_(?![\w])|\[([^\]]+)\]\((https?:\/\/[^)\s]+|#[\w-]+)\)/g;function Ye(e,t=`i`){let n=[],r=0,i=0;for(let a of e.matchAll(Je)){let o=a.index??0;o>r&&n.push(...Xe(e.slice(r,o),`${t}t${i}`));let s=`${t}${i++}`;if(a[1])n.push((0,O.jsx)(`code`,{children:a[2]},s));else if(a[3]||a[4])n.push((0,O.jsx)(`code`,{className:`md-math`,children:a[3]??a[4]},s));else if(a[5]||a[6])n.push((0,O.jsx)(`strong`,{children:Ye(a[5]??a[6],s)},s));else if(a[7]||a[8])n.push((0,O.jsx)(`em`,{children:Ye(a[7]??a[8],s)},s));else if(a[9]){let e=a[10];n.push((0,O.jsx)(`a`,{href:e,onClick:t=>{e.startsWith(`#`)||(t.preventDefault(),v(e))},"data-tip":e,children:a[9]},s))}r=o+a[0].length}return r<e.length&&n.push(...Xe(e.slice(r),`${t}e`)),n}function Xe(e,t){return e.split(`
`).flatMap((e,n)=>n?[(0,O.jsx)(`br`,{},`${t}b${n}`),e]:[e])}function Ze({text:e}){let t=qe(e);return(0,O.jsx)(`div`,{className:`md selectable`,children:t.map((e,t)=>{switch(e.t){case`code`:return(0,O.jsxs)(`pre`,{className:`md-code`,children:[e.lang&&(0,O.jsx)(`span`,{className:`md-lang`,children:e.lang}),(0,O.jsx)(`code`,{children:e.text})]},t);case`heading`:{let n=`h${Math.min(6,e.level+2)}`;return(0,O.jsx)(n,{children:Ye(e.text,`h${t}`)},t)}case`list`:return e.ordered?(0,O.jsx)(`ol`,{children:e.items.map((e,n)=>(0,O.jsx)(`li`,{children:Ye(e,`l${t}-${n}`)},n))},t):(0,O.jsx)(`ul`,{children:e.items.map((e,n)=>(0,O.jsx)(`li`,{children:Ye(e,`l${t}-${n}`)},n))},t);case`table`:return(0,O.jsx)(`div`,{className:`md-table-wrap`,children:(0,O.jsxs)(`table`,{className:`md-table`,children:[(0,O.jsx)(`thead`,{children:(0,O.jsx)(`tr`,{children:e.head.map((e,n)=>(0,O.jsx)(`th`,{children:Ye(e,`th${t}-${n}`)},n))})}),(0,O.jsx)(`tbody`,{children:e.rows.map((e,n)=>(0,O.jsx)(`tr`,{children:e.map((e,r)=>(0,O.jsx)(`td`,{children:Ye(e,`td${t}-${n}-${r}`)},r))},n))})]})},t);case`quote`:return(0,O.jsx)(`blockquote`,{children:(0,O.jsx)(Ze,{text:e.text})},t);case`rule`:return(0,O.jsx)(`hr`,{},t);default:return(0,O.jsx)(`p`,{children:Ye(e.text,`p${t}`)},t)}})})}var Qe=_(e=>({open:!1,show:()=>e({open:!0}),close:()=>e({open:!1})})),$e=`# AVAS 使用说明\r
\r
本手册可在操作软件时保持打开。拖动标题栏移动窗口，拖动边缘调整大小；最大化后可还原，按 Esc 关闭。每次重新打开恢复默认位置和大小。使用上方搜索按正文和标题筛选章节，点击目录跳转。界面语言切换时手册同步切换。\r
\r
## 快速开始\r
\r
1. 在项目页打开已有项目，或从文件菜单新建项目。初次使用建议复制 examples/hwr010 示例再操作。\r
2. 在束流页检查粒子数、能量和分布，在结构页检查元件与场图，在设置页检查模拟选项。\r
3. 确认结构页标记为运行使用的文件正确，保存修改，然后开始运行。\r
4. 在运行页查看进度、日志和实时包络；结束后到结果页查看曲线和相空间。\r
5. 需要保留本次结果时，在运行记录中选择保留运行，再进行下一次计算。\r
\r
## 项目与输入文件\r
\r
项目通过 ini.ini 组织输入和输出。InputFile 保存束流、模拟设置、结构和场图等输入；OutputFile 保存最近一次完整运行。结构文件由 ini.ini 的 lattice/source 指定，文件名不一定是 lattice_mulp.txt。\r
\r
文件菜单和标题栏的项目切换入口用于打开其他项目。切换或关闭时有未保存改动会询问处理方式。文件页可以查看输入文件，并进行导入、复制、重命名或移到回收站等操作。\r
\r
运行期间输入只读。可以查看文件和结果，等待任务结束后再编辑。\r
\r
## 束流设置\r
\r
束流页用于设置入射束流。按界面分组调整能量、电流、粒子数和分布等参数，保存后写入 beam.txt；未由页面管理的关键字和注释会保留。撤销和重做可使用 Ctrl+Z、Ctrl+Y。\r
\r
参数参考中的 beam 条目列出各关键字说明、单位和可选值。使用外部分布时先确认对应文件已准备好，粒子数和分布选项与研究目标一致。\r
\r
## 结构编辑\r
\r
文件下拉框用于打开结构文件；打开文件不等于将其设为运行结构。使用单独的“设为运行结构”按钮选择运行输入。\r
\r
“文本 + 结构”模式将文本与结构面板并排显示。选择元件可查看参数、位置和检查提示。文本、结构及可视化编辑使用同一份内容，修改可撤销。\r
\r
可视化模式默认浏览，只读查看。进入编辑状态后才能修改参数和元件；点击完成时，若有未保存修改，可保存、放弃本次编辑或继续编辑。TraceWin .dat 文件目前只读。\r
\r
2D 和 3D 左上角提供放大、缩小、显示全部。2D 双击视图显示全部；3D 双击空白显示全部，双击元件聚焦。手动缩放 3D 会停止漫游和束团跟随。\r
\r
## 模拟设置\r
\r
设置页管理 input.txt 中的模拟选项，支持撤销和重做。每个字段的含义以参数参考中的 input 条目为准。\r
\r
CPU 多线程开启时写 multithreading 1；关闭时删除该行。不要手工填写 multithreading 0，它会导致内核在起点丢失全部粒子。\r
\r
运行前先检查结构问题和场图是否齐全。线性包络预览用于快速评估，最终结果以内核计算为准。\r
\r
## 运行与保留结果\r
\r
同一时间只允许一个运行任务。开始前软件检查并保存有修改的页面；上次结果完成但尚未保留时，会询问保留并运行、直接运行或取消。\r
\r
暂停挂起运行进程，恢复后继续；停止结束任务。运行期间输入保持只读，包括暂停状态。完整运行使用输出目录中的 inputs 快照，不改写原始输入。\r
\r
完整运行覆盖 OutputFile。保留运行会把结果和输入快照复制到 Runs 下的独立目录。运行记录中可回放完成的记录，也可将不需要的记录移到回收站。\r
\r
分段运行的结果位于 Segments 下，不覆盖完整运行结果。分段设置涉及射频相位换算，请使用软件提供的分段功能。\r
\r
## 实时包络与回放\r
\r
运行页显示本次运行实时包络，结束后可回放；运行记录的回放按钮用于查看历史记录。新运行开始后切回本次运行。\r
\r
结构页回放上次运行，曲线与正在编辑的结构对应；结构修改后应注意结果可能已过期。上次运行曲线默认隐藏，开始回放时自动打开。图例左侧的 × 可隐藏曲线。\r
\r
束团和粒子云是按 rms 包络绘制的示意，不是真实粒子分布。与前一次运行对比默认关闭，可按需开启。动画受“视图 → 动效”控制。\r
\r
## 参数扫描\r
\r
在扫描页选择 lattice 元件参数或 beam.txt、input.txt 关键字，填写一组取值后开始。每个取值都在输入副本上运行，不覆盖项目输入和完整运行结果。\r
\r
扫描期间可查看表格、曲线和运行状态。结果保存在 Scans 下，每个取值对应 run_NNN 子目录，汇总为 scan.json 和 scan.csv。扫描进行时不能同时开始普通运行。\r
\r
## 结果分析\r
\r
结果页选择最近输出、已保留运行、分段结果或其他输出目录作为数据源，再选择所需曲线或相空间视图。支持交互缩放及图像导出。\r
\r
运行对比可叠加不同运行的同一物理量。比较前确认单位、输入和坐标范围一致；多线程模拟可能存在小幅随机差异，不应要求输出逐字节相同。\r
\r
回放入口在运行页，结果页用于数据分析。单粒子计算中 rms 列为 NaN 可能是内核的正常输出，需结合存活粒子数和日志判断。\r
\r
## AI 助手\r
\r
使用 Ctrl+Shift+A 打开助手，在设置中配置 OpenAI 兼容接口或本地模型。密钥存储在 Windows 凭据管理器。需要数据留在本机时使用本地模型服务。\r
\r
助手可以读取项目、解释结果并在副本中试算。项目修改以提案卡片显示，批准后应用；若在当前对话开启自动应用，则按该设置处理。写入前备份，可撤销。\r
\r
助手的试算输出位于 .avas_ai/runs，不改写 InputFile 和 OutputFile。项目运行锁定期间，修改提案会被拒绝，待运行结束后再提出。\r
\r
## 常见问题\r
\r
### 场图缺失或结构检查失败\r
\r
检查引用文件是否存在、文件名和路径是否正确，并按结构页的问题提示修正。不要仅通过隐藏提示继续运行。\r
\r
### 起点全部粒子丢失\r
\r
先检查是否误写 multithreading 0，再结合束流参数、孔径、场图和日志检查。关闭多线程应删除关键字行。\r
\r
### 修改代码后桌面程序没有变化\r
\r
打包的可执行文件不会随源码自动更新，需要重新打包。普通用户使用发布包即可，无需安装 Node.js 或 Word。\r
\r
\r
## 更多帮助\r
\r
[案例教程与验证条件](#cases-setup) · [参数与文件参考](#reference-home) · [接受度测量](#cases-acceptance)\r
\r
## 误差研究\r
\r
在设置页选择静态、动态或静态 + 动态误差，设置误差种子。结构中同时配置 err_step、误差幅度与开启命令，再保存并运行。结果写入 error_output，具体抽样与统计见参考章节。\r
\r
[误差案例](#cases-errors)\r
`,et=`# AVAS user manual\r
\r
Keep this manual open while working. Drag the title bar to move it or its edges to resize it. Maximize and restore using the title buttons; press Esc to close. Reopening restores the default position and size. Search filters chapter titles and content; select a contents entry to jump to it. The manual follows the interface language.\r
\r
## Quick start\r
\r
1. Open a project or create one from the File menu. For a first run, work on a copy of examples/hwr010.\r
2. Check the beam energy, particle count and distribution, then the lattice, field maps and simulation settings.\r
3. Confirm the file marked for simulation in the Lattice page, save changes and start the run.\r
4. Follow progress, logs and live envelopes in Run; inspect plots and phase space in Results afterwards.\r
5. Keep the completed run in the run records before starting another calculation if you need its results.\r
\r
## Projects and input files\r
\r
ini.ini defines the project inputs and outputs. InputFile holds beam, settings, lattice and field-map files; OutputFile holds the latest full run. The lattice/source setting selects the simulation lattice; its filename is not necessarily lattice_mulp.txt.\r
\r
Use the File menu or project switcher to open another project. Unsaved changes are checked before switching or closing. Files supports viewing, importing, duplicating, renaming and recycling input files.\r
\r
Inputs are read-only during a run. You can still inspect files and results.\r
\r
## Beam settings\r
\r
Use Beam to configure energy, current, particle count and distribution. Saving updates beam.txt while retaining unmanaged keywords and comments. Ctrl+Z and Ctrl+Y undo and redo changes.\r
\r
The beam reference entries below provide keyword meanings, units and choices. Prepare any external distribution file before using it and check that the distribution and particle count suit the study.\r
\r
## Lattice editing\r
\r
The file selector opens a lattice for viewing or editing. Use the separate Set as run lattice button to choose the simulation input.\r
\r
Text + Structure shows the text and physical parameter panels together. Select an element to inspect its parameters, position and diagnostics. Text, structure and visual edits share one source and undo history.\r
\r
Visual mode starts in read-only browsing. Enter editing before changing elements or parameters. Finishing with unsaved changes offers save, discard this editing session or continue editing. TraceWin .dat files are currently read-only.\r
\r
The top-left controls in 2D and 3D zoom and fit the view. Double-click the 2D view to fit all; in 3D, double-click empty space to fit all or an element to focus it. Manual 3D zoom stops roaming and bunch following.\r
\r
## Simulation settings\r
\r
Settings manages simulation options in input.txt with undo and redo. See the input reference entries for individual fields.\r
\r
CPU multithreading writes multithreading 1 when enabled and removes the line when disabled. Do not manually write multithreading 0: the engine loses all particles at the start with that value.\r
\r
Resolve lattice errors and missing field maps before running. The linear envelope preview is a quick estimate; use engine results for final conclusions.\r
\r
## Running and keeping results\r
\r
Only one task can run at a time. Starting checks and saves modified pages. If the previous completed result has not been kept, choose Keep and run, Run directly or Cancel.\r
\r
Pause suspends the process; resume continues it and stop ends it. Inputs remain read-only while paused. Full runs use the inputs snapshot in the output directory without rewriting original inputs.\r
\r
A full run overwrites OutputFile. Keeping a run copies its results and input snapshot into a separate Runs directory. Completed records can be replayed; unwanted records can be recycled.\r
\r
Segment runs write under Segments without replacing full-run results. Use the segment workflow for the required RF phase conversion.\r
\r
## Live envelopes and replay\r
\r
Run shows the current live envelope and can replay it after completion. Replay on a run record selects a historical result. A new run switches back to the current calculation.\r
\r
Lattice replays the last run against the edited lattice, so results may be outdated after edits. Last-run curves start hidden and appear when replay begins. The × to the left of a legend item hides its curve.\r
\r
The bunch and particle cloud are illustrations based on rms envelopes, not actual particle distributions. Comparison with the preceding run is off by default. Animation follows View > Motion settings.\r
\r
## Parameter scans\r
\r
Choose a lattice element parameter or a beam.txt / input.txt keyword, supply values and start the scan. Each value runs on an input copy without replacing original inputs or the full-run result.\r
\r
Follow the table, curve and run status. Results live under Scans, with a run_NNN directory per value and scan.json / scan.csv summaries. A normal run cannot start during a scan.\r
\r
## Results analysis\r
\r
Choose the latest output, a kept run, a segment result or another output directory in Results, then select plots or phase-space views. Interactive zoom and figure export are available.\r
\r
Compare runs overlays the same quantity from multiple runs. Check units, inputs and coordinate ranges before comparing. Multithreaded simulations can differ slightly; output need not be byte-identical.\r
\r
Replay lives in Run; Results is for analysis. NaN rms columns can be normal for a single-particle calculation; check surviving particles and logs as well.\r
\r
## AI assistant\r
\r
Open the assistant with Ctrl+Shift+A and configure an OpenAI-compatible endpoint or local model. API keys are stored in Windows Credential Manager. Use a local model service when data must remain on your machine.\r
\r
The assistant can read the project, explain results and run trials on copies. Project changes appear as proposals applied after approval, unless automatic application is enabled for the conversation. Changes are backed up and can be undone.\r
\r
Trials write under .avas_ai/runs without changing InputFile or OutputFile. Modification proposals are refused while project inputs are locked; request them again after the run.\r
\r
## Troubleshooting\r
\r
### Missing field maps or lattice errors\r
\r
Check referenced files, names and paths, then resolve the Lattice diagnostics before running.\r
\r
### All particles lost at the start\r
\r
First check for multithreading 0, then inspect beam settings, apertures, field maps and logs. Remove the keyword line to disable multithreading.\r
\r
### Source changes do not appear in the desktop executable\r
\r
Packaged executables need rebuilding after source changes. Users of release packages do not need Node.js or Word.\r
\r
\r
## Further help\r
\r
[Cases and verification conditions](#cases-setup) · [Parameters and files](#reference-home) · [Acceptance](#cases-acceptance)\r
\r
## Error studies\r
\r
Choose static, dynamic or combined errors and a seed in Settings. Configure err_step, amplitudes and enable commands in the lattice, then save and run. Results are stored in error_output.\r
\r
[Error tutorial](#cases-errors)\r
`,tt=`# 案例教程 {#cases-home}\r
\r
来源：docs/案例.docx 的全部 6 组片段，以及原使用说明的接受度章节。原文片段完整保留，修订明确标出；旧版案例不标作当前可运行功能。\r
\r
## 通用准备与验证条件 {#cases-setup}\r
\r
1. 把 examples/hwr010 整个项目复制到新的练习目录。不要直接覆盖原示例。\r
2. 前三个案例使用示例 beam.txt 参数；本次短验证将 particlenumber 改为 300，input.txt 的 randomseed 设为 12345。误差研究的 Python 种子另设为 7。其余输入沿用示例。\r
3. 在副本 InputFile 中新建 manual_case.txt，复制对应代码。在结构页打开并设为运行结构，保存修改；选择相应运行模式。\r
4. 运行结束后检查日志、轨迹长度、存活数与目标值，不能只看“完成”。需要保留结果时使用运行记录的保留功能。\r
\r
验证日期：2026-09-20。每个案例一次验证，输入副本未被内核改写；数值用于识别明显异常，不是高精度金标准。原始 Word 不包含完整 beam/input，因此这些是已明确补充条件的复现。\r
\r
命令行也可运行（在练习目录中）：\r
\r
\`\`\`text\r
avas run --input InputFile --output OutputFile --lattice manual_case.txt --mode basic\r
\`\`\`\r
\r
误差案例把模式换成 stat_dyn，校正案例用 stat，并加 --seed 7。\r
\r
## 叠加场多粒子入门 {#cases-superpose}\r
\r
> 验证状态：已运行：300 粒子全部存活，305 行 DataSet，末端能量约 1.87937 MeV。仅验证这组输入能完成，不代表所有束流设置都得到相同结果。\r
\r
认识 superpose、静磁场与射频场叠加。复制示例项目，保留 sol 和 hwr010 的全部分量场图。使用下面的结构内容，并选择普通运行（basic）。\r
\r
\`\`\`text\r
start\r
drift      0.085  0.02   0\r
superpose  0 0 0 0 0 0\r
field      0.35   0.02     0   3   0   0   1    0.531  sol\r
superpose  0.345 0 0 0 0 0 0\r
field      0.21   0.02     0   1   162.5e6   -33   1.36    -1.36   hwr010\r
superposeend\r
end\r
\`\`\`\r
\r
观察运行页包络，并在结果页检查能量、存活粒子数和输出分布。叠加区域最多包含一个 RF 腔，第一条 superpose 全为零。\r
\r
[叠加场规则](#ref-superpose)\r
\r
## 静态与动态误差研究 {#cases-errors}\r
\r
> 验证状态：修订版已运行：基准加 2 组 × 2 次，均得到 353 行 DataSet；误差运行末端能量约 2.36336–2.36582 MeV，存活 283–287 / 300。原版缺参数，不能直接作为正常教程。\r
\r
观察误差组幅度和重复抽样的区别。选择静态 + 动态误差（stat_dyn），误差随机种子设为 7；设置页保留基准运行。err_step 2 2 表示两组，每组两次。\r
\r
修订版仅在最后一条 drift 后补上 0；原文为 \`drift 0.000001 0.02\`，内核日志报告参数不足，原版只得到 4 行 DataSet。\r
\r
### 当前修订版\r
\r
\`\`\`text\r
start\r
err_step 2 2\r
err_cav_stat_on 1 0 0 0 0 0 0\r
err_cav_ncpl_stat 10 1 2 0 0.0 0.0 0.0 0.0 0.0\r
err_cav_dyn_on 1 0 0 0 0 0 0\r
err_cav_ncpl_dyn 10 1 2 0 0.0 0.0 0.0 0.0 0.0\r
drift 0.0835 0.02 0\r
field 0.1 0.02 0 3 0 0 1 0.677098 sol\r
field 0.1 0.02 0 3 0 0 1 0.677098 sol\r
field      0.21   0.02     0   1   162.5e6   -33  1.36    -1.36   hwr010\r
field      0.21   0.02     0   1   162.5e6   -33  -1.36    -1.36   hwr010\r
drift 0.0835 0.02 0\r
drift 0.000001 0.02 0\r
end\r
\`\`\`\r
\r
### 原文片段（保留用于对照，不直接运行）\r
\r
\`\`\`text\r
start\r
err_step 2 2\r
err_cav_stat_on 1 0 0 0 0 0 0\r
err_cav_ncpl_stat 10 1 2 0 0.0 0.0 0.0 0.0 0.0\r
err_cav_dyn_on 1 0 0 0 0 0 0\r
err_cav_ncpl_dyn 10 1 2 0 0.0 0.0 0.0 0.0 0.0\r
drift 0.0835 0.02 0\r
field 0.1 0.02 0 3 0 0 1 0.677098 sol\r
field 0.1 0.02 0 3 0 0 1 0.677098 sol\r
field      0.21   0.02     0   1   162.5e6   -33  1.36    -1.36   hwr010\r
field      0.21   0.02     0   1   162.5e6   -33  -1.36    -1.36   hwr010\r
drift 0.0835 0.02 0\r
drift 0.000001 0.02\r
end\r
\`\`\`\r
\r
查看 error_output/output_0_0 基准和 output_1_1 至 output_2_2，结合 errors_par.txt、errors_par_tot.txt 分析。存在一定粒子损失，不应将本例描述为无损传输。\r
\r
[误差编号与抽样说明](#ref-errors)\r
\r
## 静态误差校正示例 {#cases-correction}\r
\r
> 验证状态：已运行但未达目标：原文 DIAG_ENERGY 的目标为 5 MeV；本次记录的基准末能量约 2.31270 MeV，error_adjust/output_0 约 2.28948 MeV。不能据此宣称校正成功；保留作进阶诊断示例。\r
\r
理解 ADJUST 选择参数、约束范围和 DIAG_ENERGY 设置目标的关系。使用静态误差模式（stat）；不要直接把这组目标值当作已收敛的设计。\r
\r
\`\`\`text\r
start\r
err_step 1 1\r
err_cav_stat_on 1 0 0 0 0 0 0\r
err_cav_ncpl_stat 1 0 1.0 0 0.0 0.0 0.0 0.0 0.0\r
drift 0.0835 0.02 0\r
field 0.1 0.02 0 3 0 0 1 0.677098 sol\r
ADJUST 1 7 5 0 3 0\r
field      0.21  0.02     0   1   162.5e6   -33  3    -1.36   hwr010\r
drift 0.0835 0.02 0\r
DIAG_ENERGY 1 5 0\r
drift 0.000001 0.02 0\r
end\r
\`\`\`\r
\r
检查目标能量与 Ke 范围是否物理可达，再检查校正前后记录。退出码为 0 不表示优化达到目标；进一步改变目标或范围属于新的物理研究，需要重新验证。\r
\r
[校正与束诊命令](#ref-correction)\r
\r
## 旧版包络模型 {#cases-legacy-envelope}\r
\r
> 验证状态：旧版待核实：当前未提供这一段旧语法的已验证运行流程。\r
\r
原代码只有元件片段，没有完整的项目输入。其 QUAD 参数数量与当前多粒子格式不同，不可直接贴入多粒子结构作为可运行例子。\r
\r
\`\`\`text\r
DRIFT 0.76486 1 1\r
QUAD 0.97277 1 0.40328\r
DRIFT 0.1355 1 1\r
QUAD 0.15 1 -2.2265\r
DRIFT 0.381 1 1\r
QUAD 0.324 1 0.664\r
DRIFT 0.59197 1 1\r
\`\`\`\r
\r
保留源代码供迁移核对；不以当前线性包络预览冒充原包络算法。\r
\r
## 旧版 Twiss 匹配 {#cases-legacy-matching}\r
\r
> 验证状态：旧版待核实：MATCHING、SETTWISS 的原流程未在当前界面验证。\r
\r
保留原文匹配范围及目标。迁移前需核对所用算法、输入格式、目标定义和单位。\r
\r
\`\`\`text\r
MATCHING 1 1 0.1 1\r
DRIFT 0.76486 1 1\r
MATCHING 1 1 0.1 1\r
MATCHING 1 3 0 10\r
QUAD 0.97277 1 0.40328\r
MATCHING 1 1 0.1 1\r
DRIFT 0.1355 1 1\r
MATCHING 1 1 0.1 1\r
MATCHING 1 3 -10 0\r
QUAD 0.150 1 -2.2265\r
MATCHING 1 1 0.1 1\r
DRIFT 0.381 1 1\r
MATCHING 1 1 0.1 1\r
MATCHING 1 3 0 10\r
QUAD 0.324 1 0.664\r
MATCHING 1 1 0.1 1\r
DRIFT 0.59197 1 1\r
SETTWISS 1 2 3 2 3\r
\`\`\`\r
\r
不改名为 AI 优化教程；两者可能采用不同目标和算法。\r
\r
## 旧版周期匹配 {#cases-legacy-periodic}\r
\r
> 验证状态：旧版待核实：CIRCLE_MATCH、RF_GAP 等命令的可用入口与结果尚未核实。\r
\r
原文用四个周期计算入口 Twiss，缺少完整输入和预期结果。\r
\r
\`\`\`text\r
CIRCLE_MATCH 1 2 0\r
LATTICE 1 4 5\r
;cell1\r
DRIFT 1 0 0\r
SOLENOID 1 0 1\r
DRIFT 1 0 0\r
RF_GAP 100000 0 162.5E6\r
DRIFT 1 0 0\r
;cell2\r
DRIFT 1 0 0\r
SOLENOID 1 0 1\r
DRIFT 1 0 0\r
RF_GAP 100000 0 162.5E6\r
DRIFT 1 0 0\r
;cell3\r
DRIFT 1 0 0\r
SOLENOID 1 0 1\r
DRIFT 1 0 0\r
RF_GAP 100000 0 162.5E6\r
DRIFT 1 0 0\r
;cell4\r
DRIFT 1 0 0\r
SOLENOID 1 0 1\r
DRIFT 1 0 0\r
RF_GAP 100000 0 162.5E6\r
DRIFT 1 0 0\r
LATTICE_END\r
\`\`\`\r
\r
保留 LATTICE 与周期结构原文，不将其视为当前多粒子分组语法。\r
\r
## 接受度测量 {#cases-acceptance}\r
\r
> 来源：使用说明20260427.docx“接受度测量使用方法”。步骤已按当前界面与结果服务改写；本次未用有代表性的束损分布验证接受度数值。\r
\r
1. 准备输入束流；若从 dst 导入，先在束流页检查文件与束流参数。原版“Import all beam parameters from file”按钮的操作不能照搬。若需要由 Twiss 重新生成束流，应切回生成分布并确认参数，不能只删除文件路径。\r
2. 选择要研究的平面，设置适合研究的初始发射度。原手册建议扩大该方向发射度以覆盖接受边界；具体幅度需要根据束线确定。\r
3. 在设置页把“Output every N steps (plt)”设为大于 0（例如 1）。这会保存逐步粒子记录，文件可能较大。\r
4. 完成模拟，在结果页选择这次输出，打开“接受度”，选择 x-x′、y-y′、z-z′ 或 φ-E 平面。\r
5. 查看拟合椭圆、发射度、归一化发射度及位置／角度；结合束损情况判断。全部粒子通过、缺少粒子记录或无法构成边界时不能把报错解释为零接受度。\r
\r
接受度属于结果分析，不是原 Word 截图里的独立 accept 页面。三张旧截图已由当前文字步骤替代。\r
\r
[粒子记录文件](#ref-beamset)\r
`,nt=`# Case tutorials {#cases-home}\r
\r
Source: all six fragments in docs/案例.docx plus the acceptance chapter of the original manual. Original code is retained; revisions are explicit. Legacy cases are not advertised as runnable current features.\r
\r
## Preparation and verification conditions {#cases-setup}\r
\r
1. Copy examples/hwr010 into a new practice directory.\r
2. For the first three cases retain the example beam settings, but set particlenumber to 300 for this short verification and randomseed in input.txt to 12345. The separate Python error seed is 7. Other inputs remain those of the example.\r
3. Create InputFile/manual_case.txt in the copy, paste the case code, open it in Lattice and set it as the run lattice. Save and choose the stated run mode.\r
4. Check logs, trajectory extent, survivors and targets after completion. Keep results through run records before replacing them.\r
\r
Verified on 2026-09-20, once per case. Engine runs left the prepared inputs unchanged. Values identify gross errors, not precision reference tolerances. The original Word file lacks complete beam/input files; these reproduction conditions are explicitly added.\r
\r
From the practice directory:\r
\r
\`\`\`text\r
avas run --input InputFile --output OutputFile --lattice manual_case.txt --mode basic\r
\`\`\`\r
\r
Use stat_dyn for the error study or stat for correction, adding --seed 7.\r
\r
## Overlapping-field multi-particle example {#cases-superpose}\r
\r
> Verification: Executed: all 300 particles survived; 305 DataSet rows; final energy approximately 1.87937 MeV. This verifies completion for these inputs, not equivalence for arbitrary beam settings.\r
\r
Study superpose and overlapping static magnetic / RF fields. Copy the example project and retain all sol and hwr010 field components. Use basic mode.\r
\r
\`\`\`text\r
start\r
drift      0.085  0.02   0\r
superpose  0 0 0 0 0 0\r
field      0.35   0.02     0   3   0   0   1    0.531  sol\r
superpose  0.345 0 0 0 0 0 0\r
field      0.21   0.02     0   1   162.5e6   -33   1.36    -1.36   hwr010\r
superposeend\r
end\r
\`\`\`\r
\r
Inspect the Run envelope and Results energy, survivors and particle distributions. A block contains at most one RF cavity; its first superpose is all zero.\r
\r
[Overlapping-field rules](#ref-superpose)\r
\r
## Static and dynamic error study {#cases-errors}\r
\r
> Verification: Revised example executed: reference plus 2 groups × 2 runs, all with 353 DataSet rows. Error-run final energies were approximately 2.36336–2.36582 MeV; 283–287 of 300 particles survived. The original has a missing parameter.\r
\r
Select static + dynamic errors (stat_dyn), error seed 7 and keep the reference run enabled. err_step 2 2 means two groups with two repeats each.\r
\r
The revision only adds the third parameter 0 to the last drift. The original \`drift 0.000001 0.02\` produced a missing-parameter error and only four DataSet rows.\r
\r
### Current revision\r
\r
\`\`\`text\r
start\r
err_step 2 2\r
err_cav_stat_on 1 0 0 0 0 0 0\r
err_cav_ncpl_stat 10 1 2 0 0.0 0.0 0.0 0.0 0.0\r
err_cav_dyn_on 1 0 0 0 0 0 0\r
err_cav_ncpl_dyn 10 1 2 0 0.0 0.0 0.0 0.0 0.0\r
drift 0.0835 0.02 0\r
field 0.1 0.02 0 3 0 0 1 0.677098 sol\r
field 0.1 0.02 0 3 0 0 1 0.677098 sol\r
field      0.21   0.02     0   1   162.5e6   -33  1.36    -1.36   hwr010\r
field      0.21   0.02     0   1   162.5e6   -33  -1.36    -1.36   hwr010\r
drift 0.0835 0.02 0\r
drift 0.000001 0.02 0\r
end\r
\`\`\`\r
\r
### Original fragment (comparison only)\r
\r
\`\`\`text\r
start\r
err_step 2 2\r
err_cav_stat_on 1 0 0 0 0 0 0\r
err_cav_ncpl_stat 10 1 2 0 0.0 0.0 0.0 0.0 0.0\r
err_cav_dyn_on 1 0 0 0 0 0 0\r
err_cav_ncpl_dyn 10 1 2 0 0.0 0.0 0.0 0.0 0.0\r
drift 0.0835 0.02 0\r
field 0.1 0.02 0 3 0 0 1 0.677098 sol\r
field 0.1 0.02 0 3 0 0 1 0.677098 sol\r
field      0.21   0.02     0   1   162.5e6   -33  1.36    -1.36   hwr010\r
field      0.21   0.02     0   1   162.5e6   -33  -1.36    -1.36   hwr010\r
drift 0.0835 0.02 0\r
drift 0.000001 0.02\r
end\r
\`\`\`\r
\r
Compare error_output/output_0_0 with output_1_1 through output_2_2 and inspect errors_par.txt / errors_par_tot.txt. This is not a loss-free beamline.\r
\r
[Error kinds and sampling](#ref-errors)\r
\r
## Static-error correction example {#cases-correction}\r
\r
> Verification: Executed but target not reached: DIAG_ENERGY requests 5 MeV. The observed reference final energy was about 2.31270 MeV and error_adjust/output_0 about 2.28948 MeV. This is an advanced diagnostic example, not a demonstrated successful correction.\r
\r
Use static-error mode (stat) to understand ADJUST parameter selection, bounds and DIAG_ENERGY targets. The original target is not a validated converged design.\r
\r
\`\`\`text\r
start\r
err_step 1 1\r
err_cav_stat_on 1 0 0 0 0 0 0\r
err_cav_ncpl_stat 1 0 1.0 0 0.0 0.0 0.0 0.0 0.0\r
drift 0.0835 0.02 0\r
field 0.1 0.02 0 3 0 0 1 0.677098 sol\r
ADJUST 1 7 5 0 3 0\r
field      0.21  0.02     0   1   162.5e6   -33  3    -1.36   hwr010\r
drift 0.0835 0.02 0\r
DIAG_ENERGY 1 5 0\r
drift 0.000001 0.02 0\r
end\r
\`\`\`\r
\r
Check physical reachability within the Ke bounds and inspect pre/post-correction outputs. Exit code 0 does not certify convergence. A changed target or bound is a new study requiring verification.\r
\r
[Correction and diagnostics](#ref-correction)\r
\r
## Legacy envelope model {#cases-legacy-envelope}\r
\r
> Verification: Legacy / unverified: no validated current workflow for this old syntax.\r
\r
The source is only an element fragment. Its QUAD parameter count differs from the current multi-particle format; do not paste it as a runnable multi-particle lattice.\r
\r
\`\`\`text\r
DRIFT 0.76486 1 1\r
QUAD 0.97277 1 0.40328\r
DRIFT 0.1355 1 1\r
QUAD 0.15 1 -2.2265\r
DRIFT 0.381 1 1\r
QUAD 0.324 1 0.664\r
DRIFT 0.59197 1 1\r
\`\`\`\r
\r
Keep the original for migration. The current linear envelope preview is not a replacement claim for this old algorithm.\r
\r
## Legacy Twiss matching {#cases-legacy-matching}\r
\r
> Verification: Legacy / unverified: the MATCHING and SETTWISS workflow has not been verified in the current interface.\r
\r
Retain the original bounds and targets; check algorithm, format, target definitions and units before migration.\r
\r
\`\`\`text\r
MATCHING 1 1 0.1 1\r
DRIFT 0.76486 1 1\r
MATCHING 1 1 0.1 1\r
MATCHING 1 3 0 10\r
QUAD 0.97277 1 0.40328\r
MATCHING 1 1 0.1 1\r
DRIFT 0.1355 1 1\r
MATCHING 1 1 0.1 1\r
MATCHING 1 3 -10 0\r
QUAD 0.150 1 -2.2265\r
MATCHING 1 1 0.1 1\r
DRIFT 0.381 1 1\r
MATCHING 1 1 0.1 1\r
MATCHING 1 3 0 10\r
QUAD 0.324 1 0.664\r
MATCHING 1 1 0.1 1\r
DRIFT 0.59197 1 1\r
SETTWISS 1 2 3 2 3\r
\`\`\`\r
\r
Do not relabel it as AI optimization, which may use different objectives and algorithms.\r
\r
## Legacy periodic matching {#cases-legacy-periodic}\r
\r
> Verification: Legacy / unverified: the current entry point and behavior of CIRCLE_MATCH and RF_GAP have not been established.\r
\r
The original defines four cells but lacks full project inputs and expected results.\r
\r
\`\`\`text\r
CIRCLE_MATCH 1 2 0\r
LATTICE 1 4 5\r
;cell1\r
DRIFT 1 0 0\r
SOLENOID 1 0 1\r
DRIFT 1 0 0\r
RF_GAP 100000 0 162.5E6\r
DRIFT 1 0 0\r
;cell2\r
DRIFT 1 0 0\r
SOLENOID 1 0 1\r
DRIFT 1 0 0\r
RF_GAP 100000 0 162.5E6\r
DRIFT 1 0 0\r
;cell3\r
DRIFT 1 0 0\r
SOLENOID 1 0 1\r
DRIFT 1 0 0\r
RF_GAP 100000 0 162.5E6\r
DRIFT 1 0 0\r
;cell4\r
DRIFT 1 0 0\r
SOLENOID 1 0 1\r
DRIFT 1 0 0\r
RF_GAP 100000 0 162.5E6\r
DRIFT 1 0 0\r
LATTICE_END\r
\`\`\`\r
\r
Preserve the original LATTICE structure; do not treat it as current multi-particle grouping syntax.\r
\r
## Acceptance measurement {#cases-acceptance}\r
\r
> Source: the acceptance chapter of 使用说明20260427.docx. Steps follow the current interface and result service. Acceptance values have not been verified on a representative loss distribution in this migration.\r
\r
1. Prepare the beam. When importing a dst, inspect the distribution and parameters in Beam. The old “Import all beam parameters from file” button workflow no longer applies. To generate a new Twiss distribution, switch back to generated distribution and confirm parameters; deleting a path alone is insufficient.\r
2. Choose the study plane and initial emittance. The original suggests enlarging that emittance to sample the acceptance boundary; choose the magnitude for your beamline.\r
3. In Settings, set “Output every N steps (plt)” above zero, for example 1. Particle dumps may consume substantial disk space.\r
4. After simulation, select its output in Results, open Acceptance and choose x-x′, y-y′, z-z′ or φ-E.\r
5. Inspect the ellipse, emittance, normalized emittance and position/angle together with losses. All particles passing or missing dumps may prevent computation; an error is not zero acceptance.\r
\r
Acceptance now lives in Results, not the old standalone accept page. Current written steps replace the three legacy screenshots.\r
\r
[Particle-dump format](#ref-beamset)\r
`,rt=`# 参数与文件参考 {#reference-home}\r
\r
来源：docs/使用说明20260427.docx。以下为整理版，保留技术正文和格式信息，移除旧界面步骤与重复参数表。逐章注明核对范围；“来自原手册”不等于所有模式已经在当前版本实测。原始 Word 保留在仓库，不作修改。\r
\r
参数表由当前 schema 动态提供。可在上方搜索输入文件名、命令或物理量。\r
\r
## 场模型元件与射频相位 {#ref-field}\r
\r
> 来源：原手册对应章节。核对状态：与当前 schema 对照；补充已核实的场强和相位约定。\r
\r
场模型元件\r
\r
用户给出元件的电磁场分布文件，在场模型元件中AVAS采用t-code进行模拟。\r
\r
\`\`\`text\r
Drift   长度（m）  半径（m）   0\r
Field   长度（m）  半径（m）   V3 类型  频率   同步相位  Ke   Kb   场文件名\r
\`\`\`\r
\r
场类型：1 为高频场，2 为静电场，3 为静磁场；静磁场中不使用的参数写 0。\r
\r
V3：0代表同步相位 1代表粒子到入口的RF相位 2 代表t=0时刻的rf相位\r
\r
例：\r
\r
\`\`\`text\r
start\r
drift 0.0835 0.02 0\r
!静磁场\r
field 0.1 0.02 0 3 0 0 1 0.677098 sol_1\r
!高频场\r
field 0.1 0.02 0 1 162.5e6 -33 3 -1.36 hwr010b\r
end\r
\`\`\`\r
\r
电场为 MV/m × Ke，磁场为 T × Kb；射频电场使用 cos(ωt+φ₀)，磁场使用 sin。V3=0 的同步相位按积分定义：atan2(∫E sinφ, ∫E cosφ)。场图存储顺序应按同组分量文件判断。\r
\r
[查看 field 参数](#lattice-field)\r
\r
## 矩阵模型元件与端部限制 {#ref-matrix}\r
\r
> 来源：原手册对应章节。核对状态：元件参数以实时参考为准；首末矩阵元件限制来自原手册，本次未做独立内核验证。\r
\r
用户给出元件的对应参数，在矩阵模型元件中AVAS采用z-code进行模拟。\r
\r
\`\`\`text\r
Quad     长度（m）半径（m）  0 磁场梯度（T/m）\r
Solenoid  长度（m）半径（m）  0  磁场（T）\r
Bend     |αρ|（m） 半径（m）  0 偏转角α(°)  曲率半径ρ(m) 四极场指数 方向(0/1)\r
\`\`\`\r
\r
*二极铁的长度默认等于|αρ|。方向：横向(x)偏转为0，纵向(y)偏转为1\r
\r
\`\`\`text\r
Steerer        0      半径（m）  0   Bx/Ex(T or V/m)   By/Ey   类型   最大值\r
\`\`\`\r
\r
*矫正铁长度必须为0，长度默认为下个元件的长度并位于下个元件的中间。类型：磁场校正铁为0，电场校正铁为1.\r
\r
Bend\r
\r
Edge\r
\r
多粒子模型第一个和最后一个元件避免使用矩阵模型元件，可以加超级短的drift避免这个问题.\r
\r
Bend、Edge 的逐项参数统一见 [bend](#lattice-bend)、[edge](#lattice-edge)、[quad](#lattice-quad)、[solenoid](#lattice-solenoid)、[steerer](#lattice-steerer)。\r
\r
## 误差分析与分布编号 {#ref-errors}\r
\r
> 来源：原手册对应章节。核对状态：已对照当前误差生成代码，修正原文中高斯分布与等步长的编号颠倒。\r
\r
当添加误差后，模拟的结果将放在outputFile文件夹下的error_output文件夹下。相关命令如下：\r
\r
err_step a b\r
\r
a为分组数， b为每组运行多少次\r
\r
动态误差\r
\r
\`\`\`text\r
err_beam_dyn  r  dx\xA0\xA0\xA0dy\xA0\xA0\xA0\xA0dφ\xA0\xA0\xA0\xA0dxp\xA0\xA0\xA0\xA0dyp\xA0\xA0\xA0\xA0de\xA0\xA0\xA0\xA0dEx\xA0\xA0\xA0\xA0dEy\xA0\xA0\xA0\xA0dEz\xA0\xA0\xA0\xA0mx\xA0\xA0\xA0\xA0my\xA0\xA0\xA0\xA0mz\xA0\xA0\xA0\xA0dib\r
(mm)   (°)   (mrad)  (MeV)      (%)          (%)        (mA)\r
\`\`\`\r
\r
*用于设定初始束团的误差，不需要写满参数，后续空置参数默认不设置误差。\r
\r
\`\`\`text\r
err_quad_ncpl_dyn   N   r  dx\xA0\xA0\xA0dy\xA0\xA0\xA0\xA0dφ_x\xA0\xA0\xA0\xA0dφ_y\xA0\xA0\xA0\xA0dφ_z\xA0\xA0\xA0\xA0dG\xA0\xA0\xA0 \xA0dz\xA0\xA0 \xA0\xA0Nb\r
(mm)        (°)       (%) (mm)\r
\`\`\`\r
\r
*用于设定静磁元件的误差，不需要写满参数，后续空置参数默认不设置误差。\r
\r
\`\`\`text\r
err_cav_ncpl_dyn   N   r  dx\xA0\xA0 \xA0  dy\xA0\xA0  \xA0 \xA0dφ_x\xA0\xA0\xA0   \xA0dφ_y\xA0\xA0\xA0 \xA0\xA0\xA0\xA0kekb  \xA0\xA0\xA0 \xA0φ_s         dz\xA0\xA0 \xA0\xA0  Nb\r
(mm)         (°)        (%)   (°)   (mm)\r
\`\`\`\r
\r
*用于设定射频腔的误差，不需要写满参数，后续空置参数默认不设置误差。\r
\r
静态误差\r
\r
\`\`\`text\r
err_beam_stat  0  dx\xA0\xA0\xA0dy\xA0\xA0\xA0\xA0dφ\xA0\xA0\xA0\xA0dxp\xA0\xA0\xA0\xA0dyp\xA0\xA0\xA0\xA0de\xA0\xA0\xA0\xA0dEx\xA0\xA0\xA0\xA0dEy\xA0\xA0\xA0\xA0dEz\xA0\xA0\xA0\xA0mx\xA0\xA0\xA0\xA0my\xA0\xA0\xA0\xA0mz\xA0\xA0\xA0\xA0dib\r
(mm)   (°)   (mrad)  (MeV)      (%)          (%)        (mA)\r
\`\`\`\r
\r
*用于设定初始束团的误差，不需要写满参数，后续空置参数默认不设置误差。\r
\r
\`\`\`text\r
err_quad_ncpl_stat   N  r  dx\xA0\xA0\xA0dy\xA0\xA0\xA0\xA0dφ_x\xA0\xA0\xA0\xA0dφ_y\xA0\xA0\xA0\xA0dφ_z\xA0\xA0\xA0\xA0dG\xA0\xA0\xA0 \xA0dz\xA0\xA0 \xA0\xA0Nb\r
(mm)        (°)       (%) (mm)\r
\`\`\`\r
\r
*用于设定静磁元件的误差，不需要写满参数，后续空置参数默认不设置误差。\r
\r
\`\`\`text\r
err_cav_ncpl_stat   N   r  dx\xA0\xA0 \xA0  dy\xA0\xA0  \xA0 \xA0dφ_x\xA0\xA0\xA0   \xA0dφ_y\xA0\xA0\xA0 \xA0\xA0\xA0\xA0kekb  \xA0\xA0\xA0 \xA0φ_s         dz\xA0\xA0 \xA0\xA0  Nb\r
(mm)         (°)        (%)   (°)   (mm)\r
\`\`\`\r
\r
*用于设定射频腔的误差，不需要写满参数，后续空置参数默认不设置误差。\r
\r
参数解释:\r
\r
N: 作用于命令下面元件的数量， 想做用于所有元件，可以填写一个较大值\r
\r
R：误差类型\r
\r
r=0：固定值误差\r
\r
r=1: 均匀分布的误差\r
\r
r=2: 高斯分布的误差\r
\r
r = -1：等步长误差（等价于tracewin中的0类型）\r
\r
例：\r
\r
\`\`\`text\r
err_step 2 2\r
err_cav_stat_on 1 0 0 0 0 0 0\r
err_cav_ncpl_stat 10 r 2 0 0.0 0.0 0.0 0.0 0.0\r
\`\`\`\r
\r
以上面的为例：\r
\r
当r为1，那么第一组为[-1, +1]之间的误差，第二组为[-2, +2]之间的误差\r
\r
当 r=2 时，第一组为标准差 1 的高斯分布误差，第二组为标准差 2 的高斯分布误差。原文在此误写为 r=-1，已按当前代码修正。\r
\r
当 r=-1 时，以上射频腔例子的第一组误差为 1，第二组为 2。原文在此误写为 r=2。束流误差命令的等步长实现与元件分支不同，不能直接套用本例；使用前应核查实际抽样文件。\r
\r
误差开启\r
\r
\`\`\`text\r
err_beam_dyn_on   dx\xA0\xA0\xA0   dy\xA0\xA0\xA0  \xA0dφ …\r
err_quad_dyn_on   dx\xA0\xA0\xA0   dy\xA0\xA0\xA0\xA0  dφ_x…\r
err_cav_dyn_on    dx\xA0\xA0 \xA0  dy\xA0\xA0  \xA0\xA0dφ_x…\r
err_beam_stat_on   dx\xA0\xA0\xA0   dy\xA0\xA0\xA0  \xA0dφ …\r
err_quad_stat_on   dx\xA0\xA0\xA0   dy\xA0\xA0\xA0\xA0  dφ_x…\r
err_cav_stat_on    dx\xA0\xA0 \xA0  dy\xA0\xA0  \xA0\xA0dφ_x…\r
\`\`\`\r
\r
这些命令用于启用相应误差，参数顺序与对应命令一致：0 关闭，1 开启。\r
\r
例：\r
\r
\`\`\`text\r
start\r
err_step 2 2\r
err_cav_stat_on 1 0 0 0 0 0 0\r
err_cav_ncpl_stat 10 1 2 0 0.0 0.0 0.0 0.0 0.0\r
err_cav_dyn_on 1 0 0 0 0 0 0\r
err_cav_ncpl_dyn 10 1 2 0 0.0 0.0 0.0 0.0 0.0\r
drift 0.0835 0.02 0\r
field 0.1 0.02 0 3 0 0 1 0.677098 sol_1\r
field 0.1 0.02 0 3 0 0 1 0.677098 sol_1\r
field      0.21   0.02     0   1   162.5e6   -33  3    -1.36   hwr010b\r
field      0.21   0.02     0   1   162.5e6   -33  3    -1.36   hwr010b\r
end\r
\`\`\`\r
\r
当前组幅度通常按“给定幅度 ÷ 总组数 × 当前组号”计算；固定值分支不做该缩放。Python 与内核的随机种子不是同一个设置。详见 [误差案例](#cases-errors)。\r
\r
## 静态误差校正与束诊 {#ref-correction}\r
\r
> 来源：原手册对应章节。核对状态：与当前校正流程对照；示例使用的场图名称需对应项目文件。\r
\r
\`\`\`text\r
Adjust N, v, n, min, max, first_step\r
\`\`\`\r
\r
N：目前无意义，写0即可\r
\r
v: 修改下面元件的第v个参数\r
\r
n:具有相同n的元件参数，他们矫正时具有相同的值,默认为0\r
\r
min:参数的最小值\r
\r
max: 参数的最大值\r
\r
first_step：是否使用元件的初值作为梯度下降的初始值，0 不使用， 1使用\r
\r
束诊命令\r
\r
\`\`\`text\r
DIAG_ENERGY N w dw\r
\`\`\`\r
\r
N: 无意义 填写0即可\r
\r
W：目标能量（MeV）\r
\r
Dw：无意义 填写0即可\r
\r
\`\`\`text\r
DIAG_SIZE 0 sx sy 0\r
\`\`\`\r
\r
Sx: x方向包络（mm）\r
\r
Sy：y方向包络（mm）\r
\r
\`\`\`text\r
DIAG_position 0 x y 0\r
\`\`\`\r
\r
x: x方向中心位置（mm）\r
\r
y：y方向中心位置（mm）\r
\r
例：\r
\r
\`\`\`text\r
start\r
err_step 1 1\r
err_cav_stat_on 1 0 0 0 0 0 0\r
err_cav_ncpl_stat 5 1 2 0 0 0 0 0 0\r
drift 0.0835 0.02 0\r
field 0.1 0.02 0 3 0 0 1 0.677098 sol_1\r
adjust 1 7 5 0 3 0\r
!修改第七个值，也就是ke\r
field      0.21  0.02     0   1   162.5e6   -3  3    -1.36   hwr010b\r
drift 0.0835 0.02 0\r
DIAG_ENERGY 1 5 0\r
drift 0.000001 0.02 0\r
end\r
\`\`\`\r
\r
[查看静态误差校正案例及验证状态](#cases-correction)\r
\r
## 叠加场规则 {#ref-superpose}\r
\r
> 来源：原手册对应章节。核对状态：与当前 schema 对照。\r
\r
\`\`\`text\r
Superpose  z_0   x_0    y_0    θ_z0     θ_x0    θ_y0\r
Superposeend\r
Superposeout  z_0   x_0    y_0    θ_z0     θ_x0    θ_y0\r
\`\`\`\r
\r
* 1、第一条Superpose命令后面的参数必须全为0，以提供其他Superpose命令的零点。\r
\r
2、Superpose（Superposeout）后面的6个参数给出该命令之后一个元件的入口平面（转换平面）相对于第一条Superpose命令后元件的入口平面的位置和角度。\r
\r
3、在一段叠加场结束后需要添加Superposeend或者Superposeout命令来结束叠加场，并且只有以Superposeout命令结束时，Superpose命令后z_0以外的参数才会生效，即以Superposeend命令结束时，元件只会在纵向位置上叠加。\r
\r
4、一组叠加场中只能存在小于等于一个射频腔。\r
\r
5、在一段叠加场中，每个元件前要有且只有一个Superpose命令。\r
\r
例：\r
\r
\`\`\`text\r
start\r
drift      0.085  0.02   0\r
superpose  0 0 0 0 0 0\r
field      0.35   0.02     0   3   0   0   1    0.531  sol_yuan\r
superpose  0.345 0 0 0 0 0 0\r
field      0.21   0.02     0   1   162.5e6   -33   1.36    -1.36   hwr010\r
superposeend\r
end\r
\`\`\`\r
\r
[查看叠加场案例](#cases-superpose)\r
\r
## 结构分组与折叠 {#ref-lattice}\r
\r
> 来源：原手册对应章节。核对状态：与当前结构解析规则配合使用；原拼写 sction 保留。\r
\r
\`\`\`text\r
lattice n1 n2\r
\`\`\`\r
\r
n1：每个基础lattice的元件数量\r
\r
n2: 写为1.\r
\r
Lattice终点\r
\r
\`\`\`text\r
lattice_end\r
\`\`\`\r
\r
Lattice结束.\r
\r
折叠命令\r
\r
\`\`\`text\r
Sction module{\r
}\r
\`\`\`\r
\r
使用这个命令，在页面上可以让{}中间的内容进行折叠复制。\r
\r
例：\r
\r
\`\`\`text\r
sction mebt\r
{\r
drift 0.05089 0.025 0\r
drift 0.1254 0.025 0\r
}\r
\`\`\`\r
\r
\r
\r
## 输出平面 {#ref-planes}\r
\r
> 来源：原手册对应章节。核对状态：补充已核实的末端限制。\r
\r
outputplane V1：在该命令所在位置下游（正值）或上游（负值）输出束流分布，V1 单位 m。\r
\r
automaticoutput V1 V2 V3：等间距插入输出面；依次为第一个输出面的相对位置、间隔和最大跨度，单位均为 m。\r
\r
已核实：输出面超出末端会失败，距末端仅 5 mm 也可能失败，2 cm 的测试可以运行。分段功能自动去掉距末端 5 cm 内的输出面；内核结束会输出末端分布。\r
\r
## 输入文件组织与模拟设置 {#ref-inputs}\r
\r
> 来源：原手册对应章节。核对状态：当前输入快照和路径机制已更新；关键字表统一读取 schema。\r
\r
用户编辑 beam.txt、input.txt 和 ini.ini 指定的结构源文件。完整运行及误差研究在输出目录的 inputs/ 快照中生成内核读取的 lattice.txt，不改写项目 InputFile。\r
\r
input.txt 用于设置程序功能及算法信息，beam.txt 用于输入束团信息，lattice.txt 用于输入加速器元件信息。输入文件中!开头的行代表注释，注释内容不生效。关键字不区分大小写。\r
\r
input.txt\r
\r
input.txt中大部分关键字在程序中存在默认参数，不设置也可以正常模拟。\r
\r
meshRms三个方向上的网格边长，按对应方向束团的 RMS 尺寸乘以 2 进行缩放V1 double；Lx = V1 × x 方向 RMS 尺寸 × 2V2 double；Ly = V2 × y 方向 RMS 尺寸 × 2V3 double；Lz = V3 × z 方向 RMS 尺寸 × 2\r
\r
  当启用二次粒子输运功能时，应在 beam.txt 中设置加速器同步粒子参数。\r
\r
  当启用纵向周期性边界条件时，空间电荷效应求解算法会自动切换为 FFT，并且纵向网格长度会实时设置为束团的周期长度，需要设置更多的纵向网格点数（Numofgrid）。\r
\r
  当单独设置边界时，lattice.txt 中的半径设置将不再生效，束流损失将根据 boundary.txt 中设置的边界来判断。\r
\r
输入参数表见下方 input 参考。multithreading 只写 1；关闭时删除整行，不能写 0。原文 stepPerCycle 的时间公式存在量纲疑问，未作为确定公式迁入，推进步长应按当前 schema 和实际运行核对。\r
\r
[查看多线程参数](#input-multithreading)\r
\r
## 束流文件与 Twiss 约定 {#ref-beam}\r
\r
> 来源：原手册对应章节。核对状态：补充已核实的归一化 rms 发射度及单位；二次粒子模式有例外。\r
\r
说明：\r
\r
普通束团文件导入时，原手册说明除 numofcharge 外的生成参数不生效。二次粒子模式仍需同步粒子信息，见 SeParticle.txt；不要将普通导入规则当作所有模式的通则。\r
\r
束流关键字表见下方 beam 参考。twiss β 单位 mm/mrad，ε 为归一化 rms 发射度，单位 π·mm·mrad。rms_x = sqrt(β_x·ε_x/(β_rel·γ))；纵向 z′ = Δp/p。\r
\r
[查看 twissx](#beam-twissx)\r
\r
## 运行结构文件 {#ref-source}\r
\r
> 来源：原手册对应章节。核对状态：运行文件不限定为 lattice_mulp.txt。\r
\r
第一个start之后到第一个end之前的内容为有效内容，程序会模拟第一个start之后到第一个end之前的元件。\r
\r
使用 ini.ini 的 [lattice] source 指定源文件；运行结构与当前打开查看的结构可能不同。\r
\r
## scanData.txt 射频扫相文件 {#ref-scan-data}\r
\r
> 来源：原手册对应章节。核对状态：来自原手册；与参数扫描产生的 scan.csv 不同。\r
\r
用于记录AVAS扫相结果或手动设置射频场相位，文件的每一行分别为一个射频腔的 入口相位（角度）、入口时间（s）。射频场在lattice中的排列顺序即为数据的排列顺序。\r
\r
\r
\r
## SeParticle.txt 二次粒子 {#ref-secondary}\r
\r
> 来源：原手册对应章节。核对状态：来自原手册及 schema 文件列定义；本次未运行二次粒子案例。\r
\r
当在input.txt 中将 secondarybeam 设置为 1 时，可以在 ReadParticleDistribution 之后输入此文件。SeParticle.txt 文件用于记录二次粒子束，每一行代表一个粒子。\r
\r
由于二次粒子束不包含同步粒子信息，为了正确模拟某些元件的作用，即使已经提供了初始束团分布，仍然需要在 beam.txt 文件中设置同步粒子信息。\r
\r
| x | y | z | vx | vy | vz | charge | mass | weight | time | Kind |\r
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\r
| m | m | m | m/s | m/s | m/s | e | MeV | double | s | string |\r
\r
\r
\r
## Boundary.txt 独立边界 {#ref-boundary}\r
\r
> 来源：原手册对应章节。核对状态：来自原手册；本次未运行独立边界案例。\r
\r
当在 input.txt 中将 boundary 设置为 1 时，Boundary.txt 文件生效。束流损失将根据该文件中设定的边界进行判断，束流损失的粒子信息将输出到 CollisionData.txt 文件中。此时，lattice.txt 中设置的元件半径将被屏蔽。\r
\r
文件格式如下：\r
\r
| type | material | Length | r1 | r2 | RLP | z0 | x0 | y0 | θz0 | θx0 | θy0 |\r
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\r
| int | string | m | m | m | m | m | m | m | deg | deg | deg |\r
\r
\r
\r
## edst 混合束团格式 {#ref-edst}\r
\r
> 来源：原手册对应章节。核对状态：保留原手册的格式定义并修正 esdt 拼写；本次未逐字节验证混合束团格式。\r
\r
.edst 为扩展束团分布文件，用于多种粒子混合束团。ReadParticleDistribution 指向 .edst 时，原手册说明程序切换到混合束团模拟，分布输出也相应使用 .edst。\r
\r
.edst文件中记录每个粒子的六维坐标及电荷量、静止质量、权重。具体格式为：\r
\r
\`\`\`text\r
2xCHAR+INT(Np)+DOUBLE(Ib(mA))+DOUBLE(freq(MHz))+CHAR+\r
(Np+1)×[9×DOUBLE(x(cm),x'(rad),y(cm),y'(rad),phi(rad),Energie(MeV),Charge(e),mc2(Mev),weight)]+DOUBLE(mc2(MeV))\r
\`\`\`\r
\r
其中最后一个粒子为束团同步粒子，weight的含义为当前宏粒子代表多少个真实粒子。\r
\r
CHAR的长度为1字节，INT的长度为4字节，DOUBLE的长度为8字节。\r
\r
Np是粒子的数量，Ib是流强（这里不生效），freq是束流频率，mc2是粒子的静止质量。\r
\r
\r
\r
## inData.dst 与 outData_x.dst {#ref-dst}\r
\r
> 来源：原手册对应章节。核对状态：来自原手册，结合当前输出快照说明。\r
\r
记录了模拟中使用的初始束团分布。\r
\r
outData_x.dst\r
\r
输出了指定平面上的束团分布，x为输出平面的位置，为二进制文件。\r
\r
\r
\r
## DataSet.txt 束团参数 {#ref-dataset}\r
\r
> 来源：原手册对应章节。核对状态：列索引从 0 开始；已结合当前 41 列约定补充位置、单位及不完整行处理。\r
\r
记录了模拟过程中的束团参数（s坐标系下），每一行为一组束团参数，每一行的格式为：\r
\r
| 索引（从 0 开始） | 物理量 |\r
| --- | --- |\r
| 0 | \`mean(E_k)\` |\r
| 1 | \`mean(x)\` |\r
| 2 | \`mean(γβ_x)\` |\r
| 3 | \`mean(y)\` |\r
| 4 | \`mean(γβ_y)\` |\r
| 5 | \`mean(z)\` |\r
| 6 | \`mean(γβ_z)\` |\r
| 7 | \`α_x\` |\r
| 8 | \`α_y\` |\r
| 9 | \`α_z\` |\r
| 10 | \`β_x\` |\r
| 11 | \`β_y\` |\r
| 12 | \`β_z\` |\r
| 13 | \`Emit_x\` |\r
| 14 | \`Emit_y\` |\r
| 15 | \`Emit_z\` |\r
| 16 | \`SizeX_RMS\` |\r
| 17 | \`SizeX'_RMS\` |\r
| 18 | \`SizeY_RMS\` |\r
| 19 | \`SizeY'_RMS\` |\r
| 20 | \`SizeZ_RMS\` |\r
| 21 | \`SizeZ'_RMS\` |\r
| 22 | \`MaxX\` |\r
| 23 | \`MaxX'\` |\r
| 24 | \`MaxY\` |\r
| 25 | \`MaxY'\` |\r
| 26 | \`MaxZ\` |\r
| 27 | \`MaxZ'\` |\r
| 28 | \`N_p\` |\r
| 29 | \`x_s\` |\r
| 30 | \`γβ_xs\` |\r
| 31 | \`y_s\` |\r
| 32 | \`γβ_ys\` |\r
| 33 | \`z_s\` |\r
| 34 | \`γβ_zs\` |\r
| 35 | \`sign\` |\r
| 36 | \`dir\` |\r
| 37 | \`∆x/∆y\` |\r
| 38 | \`∆z\` |\r
| 39 | \`Index\` |\r
| 40 | \`t\` |\r
\r
*sign==0：这组束团数据处于直线段。sign==1：这组束团数据处于曲线段。sign==2:这组数据无效，处理时跳过这组数据。当存在束流轨迹包含曲线时从DataSet.txt中读取有效数据的代码如下：\r
\r
x 中心 = 第 29 列（同步粒子 x）+ 第 1 列（质心相对偏移）；示例最大 x = 第 29 列 + 第 1 列 + 第 22 列。\r
\r
最大值x = 同步粒子x + 质心相对于同步粒子的偏移  + 最大值 （ 29 + 1 + 22）\r
\r
每行 41 列。直线段纵向位置为第 5 列加第 33 列，含弯铁时按当前 dataset_envelope 规则累加弧长；不能把直线公式用于所有弯曲轨迹。rms x/y/z 是第 16/18/20 列，单位 m；第 28 列为存活宏粒子数，第 0 列为能量 MeV。读取实时写入文件时丢弃不完整末行。\r
\r
## Phase.txt 射频腔出入口 {#ref-phase}\r
\r
> 来源：原手册对应章节。核对状态：来自原手册；文件名大小写按实际输出确认。\r
\r
每两行输出1个射频腔入口及出口处的信息。具体格式如下：\r
\r
\`\`\`text\r
射频腔序号 射频腔入口时间(s)  射频腔入口位置(m)  同步粒子在射频腔入口处能量(MeV)\r
射频腔序号 射频腔出口时间(s)  射频腔出口位置(m)  同步粒子在射频腔出口处能量(MeV)\r
\`\`\`\r
\r
\r
\r
## synParticle.txt 同步粒子轨迹 {#ref-syn-particle}\r
\r
> 来源：原手册对应章节。核对状态：来自原手册。\r
\r
记录了同步粒子在传输中的相关信息。具体格式如下：\r
\r
\`\`\`text\r
T     z_s    Ek_s      x_s      y_s       γβ_x      γβ_y        γβ_z         dir       α\r
\`\`\`\r
\r
*T：现实时间。dir==0：同步粒子沿z方向飞行；dir==1:同步粒子向x方向偏转；dir==2:同步粒子向y方向偏转。α：偏转角度（rad）。\r
\r
\r
\r
## DynamicErrorData.txt 误差记录 {#ref-dynamic-errors}\r
\r
> 来源：原手册对应章节。核对状态：原手册命名保留；当前 Python 误差抽样还会生成 Error_Datas_<组>_<次>.txt。\r
\r
当存在误差时，会生成该文件，这个文件中记录了初始束团和每个元件的具体误差。第一行是初始束团的误差，从第二行开始每一行是一个元件的具体误差。\r
\r
\r
\r
## BeamSet.plt 逐步粒子记录 {#ref-beamset}\r
\r
> 来源：原手册对应章节。核对状态：保留单束与双束两套格式；单位、记录标志不可混用，双束格式本次未做二进制验证。\r
\r
.plt是一个二进制文件，该文件存储了束流传输过程中每一步束团的信息，\r
\r
\`\`\`text\r
Char + Char + dumpPeriodicity(int) + Np(int) + Ib[mA](double) + freq[MHz](double) + mc2[MeV](double)\r
+ Nx * [Char + tpye(int) + Index(int) + time[s](double) + location[m](double) +\r
Np * [x(double) + px(double) +  y(double) + py(double) + z(double) + pz(double) + lossFlag(int)]]（场元件）\r
Np * [x(double) + px(double) +  y(double) + py(double) + t(double) + pz(double) + recordFlag(int)]] （矩阵元件）\r
\`\`\`\r
\r
说明\r
\r
dumpPeriodicity：每推进多少步记录一次\r
\r
Np: 粒子总数\r
\r
Ib：流强\r
\r
Freq：频率\r
\r
mc2：静止能量（MeV），不是束流动能。\r
\r
tpye：zcode(1)或 tcode(0)\r
\r
index：步序号，0 为初始分布；与 DataSet 的对应需按当前读取器检查，不假定有缺失记录时仍能逐行直接配对。\r
\r
times：tcode为同步粒子运行至该位置时间，zcode为所有粒子的平均时间\r
\r
location：tcode为同步粒子位置， zcode所有粒子位置\r
\r
p：动量（βγ）\r
\r
lossflag: 1(损失) 2（通过输出平面）0（未丢失）\r
\r
recordFlag：1（未丢失），0（丢失）\r
\r
双束的plt文件与单束的结构不一样\r
\r
\`\`\`text\r
File format =\r
char\r
+ char\r
+ dumpPeriod(int)\r
+ Np(int)\r
+ Ib[mA](double)\r
+ Freq[MHz](double)\r
+ RestMass[MeV/c^2](double)\r
+ Nx × {\r
char\r
+ type(int)\r
+ index(int)\r
+ time[s](double)\r
+ location[m](double)\r
+ Np × [\r
x(double)\r
+ px(double)\r
+ y(double)\r
+ py(double)\r
+ z(double) or t(double)\r
+ pz(double)\r
+ lossFlag(int)\r
+ particleIndex(int)\r
+ charge[e](int)\r
+ RestMass[MeV/c^2](double)\r
+ weight(double)\r
]\r
}\r
\`\`\`\r
\r
接受度分析需要粒子逐步记录，dumpPeriodicity 必须大于 0。文件存在但没有粒子记录时仍不可计算。\r
\r
[当前接受度操作步骤](#cases-acceptance)\r
\r
## density 密度数据 {#ref-density}\r
\r
> 来源：原手册对应章节。核对状态：原手册格式；max/min 字段文字存在歧义，下面明确保留待核实标记。\r
\r
\`\`\`text\r
zg(f) + emit_x(f) + emit_y(f) + emit_z(f) + rms_x(f) + rms_y(f) + rms_z(f) + nownumofp(i)\r
+ lost(i) + maxlost(i) + minlost(i) + moy( 4* f) + maxb(4*f) + minb(4*f) + maxr(4*f) + minr(4*f)\r
tab_x(i * 300) + tab_y(i * 300) + tab_r(i * 300)+ tab_z(i * 300)\r
\`\`\`\r
\r
x, y, r, z\r
\r
（指束团中的单个粒子）\r
\r
Zg:纵向距离\r
\r
emit_x（f） + emit_y（f） + emit_z（f）： 发射度\r
\r
rms_x(f) + rms_y(f) + rms_z(f)： 包络\r
\r
nownumofp(i)：粒子数\r
\r
loss（i）： 束损\r
\r
maxlost(i)：最大束损 ，\r
\r
minlost : 最小束损\r
\r
moy( 4* f)： x, y, r, z的平均值\r
\r
maxb、minb：原手册分别描述为最大、最小偏移粒子的最大值；说明不充分，具体含义待核实。\r
\r
maxr、minr：原手册描述为最大、最小偏移粒子的最小值，但 max/min 文字相互交叉；含义待核实，不把这些文字作为已验证计算定义。\r
\r
tab_x： (i) * 300, 统计粒子，将x_min – x_max分为300个网格， 统计每个网格内的粒子数\r
\r
\r
\r
## synData.txt 元件入口参数 {#ref-syn-data}\r
\r
> 来源：原手册对应章节。核对状态：补充已核实的 RF 相位换算；原文的字段序号不一致，不直接据此编写读取器。\r
\r
该文件记录了同步粒子到达每个元件入口时的时间和能量。\r
\r
字段说明：\r
\r
\`\`\`text\r
order name length zstart tin γβ ϕs ϕRF\r
原文列名数和标出的 0…8 序号不一致；此处不提供未经核实的序号映射。\r
\`\`\`\r
\r
如果设置了 RF 相位或同步相位，将计算对应的同步相位或 RF 相位。\r
\r
φRF = phase_t0 + 360·f·t_in。分段把入口时间重置为 T_entry 时，phase_t0,new = φRF − 360·f·(t_in − T_entry)。频率用 Hz、时间用 s、相位用度，不能直接沿用中段绝对相位。\r
\r
## pchistogram.dat 粒子直方图 {#ref-histogram}\r
\r
> 来源：原手册对应章节。核对状态：原手册二进制格式；本次未逐字节验证。\r
\r
当在 input.txt 中将 pchistogram 的 V1 设置为 1 时，会生成 pchistogram.dat 文件。\r
\r
该文件记录了将每个方向的最小值到最大值范围划分为 V2 等份，并统计每一份中宏粒子的数量。\r
\r
\`\`\`text\r
该文件为二进制文件，格式为：char + Index(int) + V2(int) + V2 · tabx(int) + V2 · taby(int) + V2 · tabr(int) + V2 · tabz(int) + xmin(double) + xmax(double) + avex(double) + ymin(double) + ymax(double) + avey(double) + rmin(double) + rmax(double) + aver(double) + zmin(double) + zmax(double) + avez(double)\r
\`\`\`\r
\r
\r
\r
## SingleParticle.txt 单粒子输出 {#ref-single}\r
\r
> 来源：原手册对应章节。核对状态：修正 displacepos 的单位为 mm，保留原文说明并标出差异。\r
\r
在 beam.txt 中将关键字 particlenumber 设置为 1 时，将启用单粒子模拟，输出 SingleParticle.txt 文件，并记录该单粒子的轨迹。\r
\r
| x | y | z | γβx | γβy | γβz | Ek | time |  |\r
| --- | --- | --- | --- | --- | --- | --- | --- | --- |\r
| m | m | m |  |  |  | MeV | s |  |\r
\r
此时，beam.txt 中与多粒子相关的关键字（如 twissx、twissy、twissz、current 和 distribution）将不再生效。关键词 displacepos 和 displacedpos 会生效，用于设置初始单粒子的位置和动量偏移。\r
\r
displacepos dx dy dz：内核按 mm 读取。原手册写 m，已依据仓库实测约定修正。\r
\r
displacedpos dpx dpy dpz：动量偏移单位 %。\r
\r
单粒子运行的 rms 列可能为 NaN，属于正常情况，需结合轨迹和存活数解读。\r
\r
## errors_par.txt 误差统计 {#ref-error-summary}\r
\r
> 来源：原手册对应章节。核对状态：字段顺序保留；与逐次结果表区分。\r
\r
\`\`\`text\r
step_err  误差组数\r
ave(ratio_loss)\r
ave(emit_x_increase)\r
ave(emit_y_increase)\r
ave(emit_z_increase)\r
ave(x_center(m))\r
ave(y_center(m))\r
ave(x_'(rad))\r
ave(y_'(rad))\r
ave(rms_x(m))\r
ave(rms_y(m))\r
ave(rms_x'(rad))\r
ave(rms_y'(rad))\r
ave(delat_energy)\r
rms(x_center(m))\r
rms(y_center(m))\r
rms(x_'(rad))\r
rms(y_'(rad))\r
rms(rms_x(m))\r
rms(rms_y(m))\r
rms(rms_x'(rad))\r
rms(rms_y'(rad))\r
rms(delat_energy(MeV))\r
\`\`\`\r
\r
\r
\r
## errors_par_tot.txt 逐次误差结果 {#ref-error-detail}\r
\r
> 来源：原手册对应章节。核对状态：字段顺序保留。\r
\r
\`\`\`text\r
step_err 误差组数与次数\r
ratio_loss 误差损失率， 损失粒子数/总的粒子数\r
emit_x_increase   emit_x(output)/ emit_x(input) - 1\r
emit_y_increase   emit_y(output)/ emit_y(input) - 1\r
emit_z_increase   emit_z(output)/ emit_z(input) - 1\r
x_center(m)\r
y_center(m)\r
x_'(rad)\r
y_'(rad)\r
rms_x(m)\r
rms_y(m)\r
rms_x'(rad)\r
rms_y'(rad)\r
delat_energy(MeV),\r
alpha_xx’,\r
beta_xx’,\r
alpha_yy’,\r
beta_yy’,\r
alpha_zz’,\r
beta_zz’,\r
\`\`\`\r
\r
\r
`,it=`# Parameters and files {#reference-home}\r
\r
Source: docs/使用说明20260427.docx, reconciled with current schema and documented engine checks. This reference preserves file formats and technical rules while replacing obsolete interface instructions. Source-only formats are not certified by this migration. Current keyword tables follow these chapters and are loaded from the editor schema. The original Word file is retained unchanged.\r
\r
## Field elements and RF phase {#ref-field}\r
\r
Field-map elements use time-based tracking (t-code). Drift parameters are length (m), aperture radius (m), and a reserved 0. Field parameters are length, radius, V3, field type, frequency, phase, Ke, Kb and map basename. Types are 1 RF, 2 electrostatic and 3 magnetostatic; unused magnetic-field parameters may be zero.\r
\r
V3=0 specifies synchronous phase, V3=1 the entrance RF phase, and V3=2 the absolute RF phase at t=0. Electric fields are MV/m × Ke; magnetic fields are T × Kb. RF electric fields use cos(ωt+φ₀), magnetic fields sin. The synchronous phase is atan2(∫E sinφ, ∫E cosφ). Determine map storage order from a complete component group.\r
\r
Example map names must be replaced with files present in the project:\r
\r
\`\`\`text\r
start\r
drift 0.0835 0.02 0\r
field 0.1 0.02 0 3 0 0 1 0.677098 sol_1\r
field 0.1 0.02 0 1 162.5e6 -33 3 -1.36 hwr010b\r
end\r
\`\`\`\r
\r
[Field parameters](#lattice-field)\r
\r
## Matrix elements and endpoint limitations {#ref-matrix}\r
\r
Matrix elements use longitudinal tracking (z-code). Quad takes length, radius, reserved 0 and gradient (T/m); Solenoid takes length, radius, reserved 0 and field (T). Bend takes length (0 lets the program calculate the arc), radius, reserved 0, bend angle (deg), curvature radius (m), field index and plane (0 horizontal, 1 vertical). Arc length is |α|ρ with α converted to radians.\r
\r
Edge takes 0, aperture radius, 0, pole-face angle β (deg), curvature radius ρ (m), total gap G (m), fringe factors K1/K2 and plane. Steerer takes 0, radius, 0, Bx/Ex, By/Ey, type and maximum; type 0 is magnetic, 1 electric. The original states that the steerer acts at the midpoint of the next element with its effective length.\r
\r
The original advises avoiding matrix elements at the first and last position by inserting short drifts. This endpoint limitation was not independently tested during migration. Use the live parameter entries for exact field definitions.\r
\r
[Bend](#lattice-bend), [Edge](#lattice-edge), [Steerer](#lattice-steerer)\r
\r
## Errors and distribution kinds {#ref-errors}\r
\r
err_step a b defines a groups and b repeats per group. Results are stored under error_output. Beam, magnetic-element and cavity errors have separate static and dynamic commands:\r
\r
\`\`\`text\r
err_beam_dyn r dx dy dφ dxp dyp de dEx dEy dEz mx my mz dib\r
err_beam_stat r dx dy dφ dxp dyp de dEx dEy dEz mx my mz dib\r
err_quad_ncpl_dyn N r dx dy dφx dφy dφz dG dz Nb\r
err_quad_ncpl_stat N r dx dy dφx dφy dφz dG dz Nb\r
err_cav_ncpl_dyn N r dx dy dφx dφy kekb φs dz Nb\r
err_cav_ncpl_stat N r dx dy dφx dφy kekb φs dz Nb\r
\`\`\`\r
\r
Offsets are mm, angular errors degrees, beam slopes mrad, energy MeV, relative emittance/mismatch/field errors percent and current mA. Consult the keyword entries for each position; trailing unspecified error parameters default to no error. N controls how many following elements are affected.\r
\r
Current schema and Python sampling agree on 0 fixed, 1 uniform, 2 Gaussian and -1 equal steps. The original example swaps 2 and -1; this is corrected here. For the cavity example below, group amplitudes are 1 then 2: uniform bounds ±1 then ±2 for r=1, Gaussian standard deviations 1 then 2 for r=2, and fixed steps 1 then 2 for r=-1.\r
\r
\`\`\`text\r
err_step 2 2\r
err_cav_stat_on 1 0 0 0 0 0 0\r
err_cav_ncpl_stat 10 r 2 0 0 0 0 0 0\r
\`\`\`\r
\r
The beam equal-step branch differs from the element branch; inspect generated samples before applying this cavity example to beam errors. Fixed-value errors are not group-scaled. Each corresponding err_beam/quad/cav_dyn_on or _stat_on uses 0/1 switches in the same order. Python error sampling and engine random seeds are separate settings.\r
\r
[Executed error tutorial](#cases-errors)\r
\r
## Static correction and diagnostics {#ref-correction}\r
\r
ADJUST N v n min max first_step changes parameter v of the following element. N is unused; use 0. Equal nonzero grouping identifiers n tie corrected values together. min/max bound the parameter. first_step=1 starts from its lattice value; 0 does not. The original example uses v=7 for field Ke.\r
\r
\`\`\`text\r
DIAG_ENERGY 0 W 0\r
DIAG_SIZE 0 sx sy 0\r
DIAG_POSITION 0 x y 0\r
\`\`\`\r
\r
W is target energy in MeV; sx/sy are envelope sizes in mm and x/y centroid positions in mm. Reserved diagnostic fields are written as 0. The source correction example has not reached its requested 5 MeV under the documented reproduction conditions.\r
\r
[Original correction case and observed result](#cases-correction)\r
\r
## Overlapping fields {#ref-superpose}\r
\r
Superpose and Superposeout take z0 x0 y0 θz0 θx0 θy0 (m and degrees). The first superpose is all zero, defining the reference entrance plane. Every field in the block has exactly one preceding superpose. End with superposeend or superposeout; only superposeout makes transverse offsets and angles effective. A block has at most one RF cavity.\r
\r
[Overlapping-field tutorial](#cases-superpose)\r
\r
## Lattice grouping and folding {#ref-lattice}\r
\r
The source describes lattice n1 n2, with n1 the number of elements in a basic lattice and n2=1; lattice_end closes it. Use current keyword definitions when writing a simulation input. The old periodic-envelope example uses a different syntax and is not a current multi-particle recipe.\r
\r
The spelling sction is retained from the source. It groups editor content for folding:\r
\r
\`\`\`text\r
sction mebt\r
{\r
drift 0.05089 0.025 0\r
drift 0.1254 0.025 0\r
}\r
\`\`\`\r
\r
## Output planes {#ref-planes}\r
\r
outputplane V1 writes a distribution at a relative downstream (positive) or upstream (negative) position in metres. automaticoutput V1 V2 V3 inserts equally spaced planes: first relative position, spacing and maximum span, all metres.\r
\r
Verified engine restrictions: planes beyond the lattice end fail; 5 mm from the end can fail, while a 2 cm test worked. Segment generation omits planes within 5 cm of the end. The engine writes a final distribution at the endpoint.\r
\r
## Input organization and simulation settings {#ref-inputs}\r
\r
beam.txt describes the beam, input.txt simulation settings, and the ini.ini-selected lattice describes elements. Keywords are case-insensitive and ! begins comments. Full/error runs generate engine lattice.txt in the output inputs/ snapshot without rewriting original inputs.\r
\r
The live input entries replace the original keyword table. In particular, write multithreading 1 or omit the line to disable; 0 is unsafe for this engine. The original stepPerCycle time formula is dimensionally questionable and is not reproduced as a verified equation.\r
\r
meshRms dimensions are Lx=V1×2×rms_x, Ly=V2×2×rms_y and Lz=V3×2×rms_z. The source states that longitudinal periodic boundaries select FFT and set longitudinal mesh length to the bunch period; sufficient longitudinal grid points are needed. Separate boundary mode ignores lattice aperture radii and uses Boundary.txt. Secondary transport requires synchronous-particle settings.\r
\r
[Multithreading](#input-multithreading)\r
\r
## Beam files and Twiss convention {#ref-beam}\r
\r
Current beam entries replace the original table. β is mm/mrad; ε is normalized rms emittance in π·mm·mrad. rms_x = sqrt(β_x·ε_x/(β_rel·γ)); longitudinal z′ is Δp/p. The original β unit wording is superseded by the verified convention.\r
\r
For ordinary distribution import, the source states that generation keywords except numofcharge do not apply. Secondary-particle inputs still require synchronous-particle information, so this is not a universal rule for every import mode.\r
\r
[Twiss parameters](#beam-twissx)\r
\r
## Run lattice source {#ref-source}\r
\r
The source describes content after the first start and before the first end as active. The current run filename comes from ini.ini [lattice] source and need not be lattice_mulp.txt. Opening a file for inspection does not select it for simulation.\r
\r
## scanData.txt {#ref-scan-data}\r
\r
Records RF phase scans or manually supplied phases. Each row gives cavity entrance phase (degrees) and entrance time (s), in lattice RF-cavity order. This is distinct from parameter-scan scan.csv.\r
\r
## SeParticle.txt {#ref-secondary}\r
\r
Source/schema format; secondary-particle transport was not exercised during this migration. With secondarybeam=1, ReadParticleDistribution can reference this file, one particle per row. Synchronous-particle information must still be configured in beam.txt.\r
\r
\`\`\`text\r
x y z vx vy vz charge mass weight time Kind\r
m m m m/s m/s m/s e MeV double s string\r
\`\`\`\r
\r
## Boundary.txt {#ref-boundary}\r
\r
Source format, not independently exercised here. boundary=1 selects separate loss boundaries instead of element apertures. Lost-particle information is written to CollisionData.txt.\r
\r
\`\`\`text\r
type material Length r1 r2 RLP z0 x0 y0 θz0 θx0 θy0\r
int string m m m m m m m deg deg deg\r
\`\`\`\r
\r
## edst mixed distributions {#ref-edst}\r
\r
Original binary specification, not byte-verified for mixed species in this migration. The source spelling esdt is corrected to edst. ReadParticleDistribution with .edst switches to mixed distributions, and distribution outputs use .edst.\r
\r
\`\`\`text\r
2×CHAR + INT(Np) + DOUBLE(Ib[mA]) + DOUBLE(freq[MHz]) + CHAR\r
+ (Np+1)×[9×DOUBLE(x[cm], x′[rad], y[cm], y′[rad], phi[rad], Energie[MeV], Charge[e], mc2[MeV], weight)]\r
+ DOUBLE(mc2[MeV])\r
\`\`\`\r
\r
The last particle is synchronous. weight is the number of real particles represented by a macroparticle. CHAR is 1 byte, INT 4, DOUBLE 8. Np is particle count; the source says Ib is not effective here. Do not infer endian conventions absent from the specification.\r
\r
## inData.dst and outData_x.dst {#ref-dst}\r
\r
inData.dst records the initial simulated distribution; outData_x.dst records the binary distribution at output position x. Use the inputs snapshot alongside a kept result to understand the run settings.\r
\r
## DataSet.txt {#ref-dataset}\r
\r
41 columns per row; indices below are zero-based. Straight-line longitudinal position is column 5 + column 33. With bends use current dataset_envelope arc accumulation. rms x/y/z are columns 16/18/20 in metres, surviving macroparticles column 28, energy column 0 in MeV. Discard an incomplete last row while reading live output.\r
\r
| Index (zero-based) | Quantity |\r
| --- | --- |\r
| 0 | \`mean(E_k)\` |\r
| 1 | \`mean(x)\` |\r
| 2 | \`mean(γβ_x)\` |\r
| 3 | \`mean(y)\` |\r
| 4 | \`mean(γβ_y)\` |\r
| 5 | \`mean(z)\` |\r
| 6 | \`mean(γβ_z)\` |\r
| 7 | \`α_x\` |\r
| 8 | \`α_y\` |\r
| 9 | \`α_z\` |\r
| 10 | \`β_x\` |\r
| 11 | \`β_y\` |\r
| 12 | \`β_z\` |\r
| 13 | \`Emit_x\` |\r
| 14 | \`Emit_y\` |\r
| 15 | \`Emit_z\` |\r
| 16 | \`SizeX_RMS\` |\r
| 17 | \`SizeX'_RMS\` |\r
| 18 | \`SizeY_RMS\` |\r
| 19 | \`SizeY'_RMS\` |\r
| 20 | \`SizeZ_RMS\` |\r
| 21 | \`SizeZ'_RMS\` |\r
| 22 | \`MaxX\` |\r
| 23 | \`MaxX'\` |\r
| 24 | \`MaxY\` |\r
| 25 | \`MaxY'\` |\r
| 26 | \`MaxZ\` |\r
| 27 | \`MaxZ'\` |\r
| 28 | \`N_p\` |\r
| 29 | \`x_s\` |\r
| 30 | \`γβ_xs\` |\r
| 31 | \`y_s\` |\r
| 32 | \`γβ_ys\` |\r
| 33 | \`z_s\` |\r
| 34 | \`γβ_zs\` |\r
| 35 | \`sign\` |\r
| 36 | \`dir\` |\r
| 37 | \`∆x/∆y\` |\r
| 38 | \`∆z\` |\r
| 39 | \`Index\` |\r
| 40 | \`t\` |\r
\r
The source defines sign=0 straight, 1 curved, 2 invalid (skip). x centroid = column 29 + column 1; the source example maximum x adds column 22. mean(...) preserves the source overbar, not a derivative; underscores denote subscripts.\r
\r
## Phase.txt {#ref-phase}\r
\r
Source format: two rows per RF cavity, entrance then exit, each with cavity index, time (s), position (m) and synchronous energy (MeV). Check actual filename case.\r
\r
## synParticle.txt {#ref-syn-particle}\r
\r
Source trajectory fields:\r
\r
\`\`\`text\r
T zs Eks xs ys γβx γβy γβz dir α\r
\`\`\`\r
\r
T is time. dir=0 along z, 1 bends toward x, 2 toward y. α is bend angle in radians.\r
\r
## DynamicErrorData.txt {#ref-dynamic-errors}\r
\r
The original says row 1 records initial-beam errors and subsequent rows element errors. Current Python error studies also produce Error_Datas_<group>_<repeat>.txt; distinguish sampled settings from engine outputs.\r
\r
## BeamSet.plt {#ref-beamset}\r
\r
Source binary layouts are preserved below. Mixed/double-beam layout has not been byte-verified in this migration. dumpPeriodicity must exceed zero for particle dumps and acceptance analysis.\r
\r
\`\`\`text\r
CHAR + CHAR + dumpPeriodicity(INT) + Np(INT)\r
+ Ib[mA](DOUBLE) + freq[MHz](DOUBLE) + mc2[MeV](DOUBLE)\r
+ Nx×[CHAR + type(INT) + Index(INT) + time[s](DOUBLE) + location[m](DOUBLE)\r
      + Np×[x(DOUBLE)+px(DOUBLE)+y(DOUBLE)+py(DOUBLE)+z(DOUBLE)+pz(DOUBLE)+lossFlag(INT)]]\r
\`\`\`\r
\r
For matrix tracking replace z with t and lossFlag with recordFlag. type=0 t-code or 1 z-code. p is βγ. lossFlag=1 lost, 2 passed output plane, 0 not lost; matrix recordFlag=1 surviving, 0 lost. Time/location refer to the synchronous particle for t-code and particle means for z-code. mc2 is rest energy, not kinetic energy. Index 0 is the initial distribution; check the reader for alignment with DataSet when records are absent.\r
\r
The source double-beam particle record extends the six coordinates and lossFlag with particleIndex(INT), charge[e](INT), RestMass[MeV/c²](DOUBLE), weight(DOUBLE); header and step structure remain as listed.\r
\r
[Acceptance workflow](#cases-acceptance)\r
\r
## density {#ref-density}\r
\r
Original layout; f/i denote the source float/integer notation, without an independently verified width/endian contract here.\r
\r
\`\`\`text\r
zg(f) + emit_x(f) + emit_y(f) + emit_z(f) + rms_x(f) + rms_y(f) + rms_z(f) + nownumofp(i)\r
+ lost(i) + maxlost(i) + minlost(i) + moy(4*f) + maxb(4*f) + minb(4*f) + maxr(4*f) + minr(4*f)\r
+ tab_x(i*300) + tab_y(i*300) + tab_r(i*300) + tab_z(i*300)\r
\`\`\`\r
\r
zg is longitudinal distance, emit emittance, rms envelope, nownumofp particle count, lost loss count. moy contains x/y/r/z averages. Each histogram has 300 bins spanning its minimum to maximum. Original maxb/minb/maxr/minr descriptions are ambiguous and cross maximum/minimum wording; their exact meanings remain unverified. Do not use those descriptions as verified computational definitions.\r
\r
## synData.txt {#ref-syn-data}\r
\r
Records synchronous-particle entrance time and energy for each element. The original lists order name length zstart tin γβ ϕs ϕRF, but its numerical labels disagree with the listed field count; no unverified index mapping is supplied here.\r
\r
Verified phase relation: φRF = phase_t0 + 360·f·t_in. For a segment with entry time T_entry, phase_t0,new = φRF − 360·f·(t_in − T_entry). Use Hz, seconds and degrees; do not directly reuse an intermediate absolute phase.\r
\r
## pchistogram.dat {#ref-histogram}\r
\r
Original binary format, not byte-verified here. pchistogram V1=1 enables it. V2 is the number of bins spanning each coordinate's minimum/maximum.\r
\r
\`\`\`text\r
CHAR + Index(INT) + V2(INT)\r
+ V2×tabx(INT) + V2×taby(INT) + V2×tabr(INT) + V2×tabz(INT)\r
+ xmin(DOUBLE)+xmax(DOUBLE)+avex(DOUBLE)\r
+ ymin(DOUBLE)+ymax(DOUBLE)+avey(DOUBLE)\r
+ rmin(DOUBLE)+rmax(DOUBLE)+aver(DOUBLE)\r
+ zmin(DOUBLE)+zmax(DOUBLE)+avez(DOUBLE)\r
\`\`\`\r
\r
## SingleParticle.txt {#ref-single}\r
\r
particlenumber=1 enables single-particle tracking. Fields: x/y/z (m), γβx/γβy/γβz, Ek (MeV), time (s). Multi-particle generation settings such as Twiss/current/distribution do not apply as in bunch tracking.\r
\r
Verified correction: displacepos dx dy dz is read by the engine in mm, despite metres in the original manual. displacedpos dpx dpy dpz uses percent. rms columns may be NaN; interpret trajectory and survivor data instead.\r
\r
## errors_par.txt {#ref-error-summary}\r
\r
Original group-summary field order (m for positions/envelopes, rad for slopes, MeV for energy differences):\r
\r
\`\`\`text\r
step_err  group\r
ave(ratio_loss)\r
ave(emit_x_increase)\r
ave(emit_y_increase)\r
ave(emit_z_increase)\r
ave(x_center(m))\r
ave(y_center(m))\r
ave(x_'(rad))\r
ave(y_'(rad))\r
ave(rms_x(m))\r
ave(rms_y(m))\r
ave(rms_x'(rad))\r
ave(rms_y'(rad))\r
ave(delat_energy)\r
rms(x_center(m))\r
rms(y_center(m))\r
rms(x_'(rad))\r
rms(y_'(rad))\r
rms(rms_x(m))\r
rms(rms_y(m))\r
rms(rms_x'(rad))\r
rms(rms_y'(rad))\r
rms(delat_energy(MeV))\r
\`\`\`\r
\r
## errors_par_tot.txt {#ref-error-detail}\r
\r
Original per-repeat field order. ratio_loss is lost/initial particles; emittance growth is emit(output)/emit(input)−1. Position/envelope units are m, slopes rad, energy differences MeV.\r
\r
\`\`\`text\r
step_err group and repeat\r
ratio_loss lost / initial particles\r
emit_x_increase   emit_x(output)/ emit_x(input) - 1\r
emit_y_increase   emit_y(output)/ emit_y(input) - 1\r
emit_z_increase   emit_z(output)/ emit_z(input) - 1\r
x_center(m)\r
y_center(m)\r
x_'(rad)\r
y_'(rad)\r
rms_x(m)\r
rms_y(m)\r
rms_x'(rad)\r
rms_y'(rad)\r
delat_energy(MeV),\r
alpha_xx’,\r
beta_xx’,\r
alpha_yy’,\r
beta_yy’,\r
alpha_zz’,\r
beta_zz’,\r
\`\`\`\r
`;function at(e,t){let n=[],r=``,i;for(let a of e.replace(/^\uFEFF/,``).split(/\r?\n/)){let e=a.match(/^\s*(`{3,}|~{3,})/);e&&(r?e[1][0]===r[0]&&e[1].length>=r.length&&(r=``):r=e[1]);let o=!r&&a.match(/^#{1,2} (.+?)(?: \{#([\w-]+)\})?\s*$/);o?(i={id:o[2]||`${t}-${n.length}`,title:o[1],text:``,category:t},n.push(i)):i&&(i.text+=a+`
`)}return n}function ot(e,t,n){let r=n.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);return e.filter(e=>r.length?r.every(t=>`${e.title}\n${e.text}`.toLocaleLowerCase().includes(t)):e.category===t)}function st(){let e=Number(getComputedStyle(document.documentElement).zoom)||1;return{width:window.innerWidth/e,height:window.innerHeight/e,zoom:e}}function ct(e){let t=st(),n=Math.min(t.width,Math.max(Math.min(340,t.width),e.width)),r=Math.min(t.height,Math.max(Math.min(260,t.height),e.height));return{width:n,height:r,x:Math.max(0,Math.min(e.x,t.width-n)),y:Math.max(0,Math.min(e.y,t.height-r))}}function lt(){let e=st(),t=Math.min(700,e.width*.55);return ct({x:e.width-t-24,y:60,width:t,height:e.height-110})}function ut(){return Qe(e=>e.open)?(0,O.jsx)(dt,{}):null}function dt(){let e=h(),t=ve(e=>e.lang),n=Qe(e=>e.close),[r,i]=(0,D.useState)(lt),[a,o]=(0,D.useState)(!1),[s,c]=(0,D.useState)(``),[l,u]=(0,D.useState)(`guide`),[d,f]=(0,D.useState)(null),p={guide:e(`Operation guide`),cases:e(`Case tutorials`),reference:e(`Parameters and files`)},[m,g]=(0,D.useState)(()=>lt().width>480),[_,v]=(0,D.useState)(null),[y,b]=(0,D.useState)(``),ee=(0,D.useRef)(null),te=(0,D.useRef)(null),ne=(0,D.useRef)(null);(0,D.useEffect)(()=>{let e=document.activeElement;ee.current?.focus();let t=!0;E(`schema.all`).then(e=>{t&&v(e)}).catch(e=>{t&&b(String(e.message??e))});let n=()=>i(e=>ct(e));window.addEventListener(`resize`,n);let r=new MutationObserver(n);return r.observe(document.documentElement,{attributes:!0,attributeFilter:[`style`]}),()=>{t=!1,r.disconnect(),window.removeEventListener(`resize`,n),(ee.current?.contains(document.activeElement)||document.activeElement===document.body)&&e?.focus()}},[]);let re=(0,D.useMemo)(()=>{let e=t===`zh_CN`,n=[...at(e?$e:et,`guide`),...at(e?tt:nt,`cases`),...at(e?rt:it,`reference`)];if(_)for(let e of[`beam`,`input`,`lattice`])for(let t of _[e])n.push({category:`reference`,id:`${e}-${t.key}`,title:`${e} · ${t.key} — ${ye(t.title)}`,text:[ye(t.doc),...t.params.map((e,t)=>`### ${t+1}. ${ye(e.label)}${e.unit?` (${e.unit})`:``}\n\n${ye(e.doc)}\n\n${e.choices.map(([e,t])=>`- ${e}: ${ye(t)}`).join(`
`)}`)].join(`

`)});return n},[t,_]),x=ot(re,l,s);function ie(e){let t=re.find(t=>t.id===e);t&&(u(t.category),c(``),f(e))}(0,D.useEffect)(()=>{if(d){let e=document.getElementById(`manual-${d}`);e&&te.current&&(te.current.scrollTop=e.offsetTop,f(null))}},[d,l,s,_]);function ae(e){u(e),c(``),f(null),te.current?.scrollTo(0,0)}function oe(e,t=``){e.button!==0||a||e.target.closest(`button`)||(e.preventDefault(),e.currentTarget.setPointerCapture(e.pointerId),ne.current={x:e.clientX,y:e.clientY,rect:r,edge:t})}function se(e){let t=ne.current;if(!t)return;let n=(e.clientX-t.x)/st().zoom,r=(e.clientY-t.y)/st().zoom,a={...t.rect};t.edge?(t.edge.includes(`e`)&&(a.width+=n),t.edge.includes(`s`)&&(a.height+=r),t.edge.includes(`w`)&&(a.x+=n,a.width-=n),t.edge.includes(`n`)&&(a.y+=r,a.height-=r)):(a.x+=n,a.y+=r),i(ct(a))}let ce={onPointerMove:se,onPointerUp:()=>{ne.current=null},onPointerCancel:()=>{ne.current=null},onLostPointerCapture:()=>{ne.current=null}};return(0,O.jsxs)(`div`,{ref:ee,role:`dialog`,"aria-modal":`false`,"aria-label":e(`User manual`),tabIndex:-1,className:`manual-window`,style:a?{inset:0}:{left:r.x,top:r.y,width:r.width,height:r.height},onKeyDown:e=>{e.stopPropagation(),(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()===`f`&&(e.preventDefault(),ee.current?.querySelector(`input`)?.focus()),e.key===`Escape`&&(e.preventDefault(),n())},children:[(0,O.jsxs)(`header`,{className:`manual-title`,onPointerDown:e=>oe(e),...ce,children:[(0,O.jsx)(`strong`,{children:e(`User manual`)}),(0,O.jsx)(`button`,{className:`btn btn-small`,onClick:()=>o(!a),children:e(a?`Restore window`:`Maximize window`)}),(0,O.jsx)(`button`,{className:`btn btn-small`,onClick:n,children:e(`Close`)})]}),(0,O.jsx)(`div`,{className:`manual-tabs`,role:`tablist`,"aria-label":e(`Manual categories`),children:[`guide`,`cases`,`reference`].map(e=>(0,O.jsx)(`button`,{role:`tab`,"aria-selected":l===e,className:`btn btn-small`,onClick:()=>ae(e),children:p[e]},e))}),(0,O.jsxs)(`div`,{className:`manual-tools`,children:[(0,O.jsx)(`button`,{className:`btn btn-small`,"aria-expanded":m,onClick:()=>g(!m),children:e(`Contents`)}),(0,O.jsx)(`input`,{className:`input`,"aria-label":e(`Search manual`),placeholder:e(`Search manual`),value:s,onChange:e=>{c(e.target.value),te.current?.scrollTo(0,0)}})]}),(0,O.jsxs)(`div`,{className:`manual-body`,children:[m&&(0,O.jsx)(`nav`,{"aria-label":e(`Contents`),children:x.map(e=>(0,O.jsxs)(`button`,{onClick:()=>ie(e.id),children:[s.trim()&&(0,O.jsxs)(`small`,{children:[p[e.category],` · `]}),e.title]},e.id))}),(0,O.jsxs)(`article`,{ref:te,className:`selectable`,onClick:e=>{let t=e.target.closest(`a`)?.getAttribute(`href`);t?.startsWith(`#`)&&(e.preventDefault(),ie(t.slice(1)))},children:[!x.length&&(0,O.jsx)(`p`,{children:e(`Nothing matches.`)}),x.map(e=>(0,O.jsxs)(`section`,{id:`manual-${e.id}`,children:[(0,O.jsx)(`h2`,{children:e.title}),s.trim()&&(0,O.jsx)(`p`,{className:`muted`,children:p[e.category]}),(0,O.jsx)(Ze,{text:e.text})]},e.id)),!_&&(l===`reference`||s.trim())&&(0,O.jsx)(`p`,{role:`status`,children:y?`${e(`Unable to load parameter reference`)}: ${y}`:e(`Loading parameter reference...`)})]})]}),!a&&[`n`,`s`,`e`,`w`,`ne`,`nw`,`se`,`sw`].map(e=>(0,O.jsx)(`div`,{className:`manual-resize manual-${e}`,onPointerDown:t=>oe(t,e),...ce},e))]})}var ft=new Map,pt=_(e=>({dirty:{},set:(t,n)=>e(e=>e.dirty[t]===n?e:{dirty:{...e.dirty,[t]:n}})}));function mt(e){return ft.set(e.id,e),()=>{ft.get(e.id)===e&&ft.delete(e.id),pt.getState().set(e.id,!1)}}function ht(e,t){pt.getState().set(e,t)}function gt(){return[...ft.values()].filter(e=>e.isDirty())}function _t(){return[...ft.values()]}function vt(e){return ft.get(e)}var yt=new Set;function bt(e){return yt.add(e),()=>yt.delete(e)}function xt(e,t){for(let n of yt)n(e,t)}async function St(e){let t=gt();if(!t.length)return!0;let n=t.map(e=>e.label()).join(`, `),r=await Te(i(`Save changes to {names} before {action}?`,{names:n,action:e}),[{key:`save`,label:i(`Save`),variant:`primary`},{key:`discard`,label:i(`Don't save`)},{key:`cancel`,label:i(`Cancel`)}],{title:i(`Unsaved changes`)});return r===null||r===`cancel`?!1:r!==`save`||At()}async function Ct(e){if(T.getState().run.running){await l(i(`Stop the running simulation first.`),{title:i(`Run`)});return}try{let t=e;if(!t){let e=T.getState().project.lastDir??``;if(t=await p({directory:e,title:i(`Open project`)})??void 0,!t)return}if(!await St(i(`opening another project`)))return;let n=await E(`project.open`,{path:t});he(n),Ae(i(`Project opened`))}catch(e){n(e,i(`Open project`))}}async function wt(){if(T.getState().run.running){await l(i(`Stop the running simulation first.`),{title:i(`Run`)});return}try{let e=T.getState().project.lastDir??``,t=await ee({directory:e,filename:`avas_project`,title:i(`New project`)});if(!t||!await St(i(`creating a project`)))return;let n=await E(`project.create`,{path:t});he(n),Se(`beam`),Ee(i(`Project created`),`success`)}catch(e){n(e,i(`New project`))}}async function Tt(){if(await St(i(`closing the project`)))try{he(await E(`project.close`)),Se(`project`)}catch(e){n(e,i(`Close project`))}}function Et(){let e=T.getState().project.path;e&&g(e).catch(e=>n(e))}function Dt(){let{project:e}=T.getState(),t=e.path?.toLowerCase(),n=e.recent.filter(e=>e.toLowerCase()!==t).slice(0,8),r=[];if(e.open&&(r.push({type:`header`,label:e.name??``}),r.push({label:i(`Project overview`),icon:`home`,onClick:()=>Se(`project`)}),r.push({label:i(`Show in Explorer`),icon:`folder`,onClick:Et}),r.push({type:`separator`})),n.length){r.push({type:`header`,label:i(`Switch to`)});for(let e of n)r.push({label:w(e),shortcut:Ot(e),icon:`folder`,onClick:()=>Ct(e)});r.push({type:`separator`})}return r.push({label:i(`Open project...`),shortcut:`Ctrl+O`,icon:`folder-opened`,onClick:()=>Ct()}),r.push({label:i(`New project...`),shortcut:`Ctrl+N`,icon:`new-folder`,onClick:wt}),e.open&&r.push({label:i(`Close project`),icon:`close`,onClick:Tt}),r}function Ot(e){let t=e.split(/[\\/]/).slice(0,-1).join(`\\`);return t.length>42?`…`+t.slice(-40):t}var kt=!1;async function At(e=!1){if(!T.getState().project.open||kt)return!1;kt=!0;try{let t=gt();for(let e of t)await e.save();return e||Ae(t.length?i(`Project saved`):i(`Nothing to save`)),await be(),!0}catch(e){return n(e,i(`Save`)),!1}finally{kt=!1}}async function jt(){let e=_t().flatMap(e=>e.validate?.()??[]);if(e.length)return await l(e.join(`
`),{title:i(`Cannot run`),kind:`warning`}),{ok:!1,error:e.join(`; `)};if(!await At(!0))return{ok:!1,error:`The pages could not be saved.`};try{await E(`run.check`)}catch(e){return await n(e,i(`Project check`)),{ok:!1,error:e?.message??String(e)}}return{ok:!0}}async function Mt(){let e=await b(i(`Name of the record (optional). The results in OutputFile/ are copied to Runs/.`),``,{title:i(`Keep this run`),ok:i(`Keep`)});if(e===null)return null;try{let t=await E(`runs.archive`,{label:e});return Ee(t.existing?i(`This run is already kept as {label}`,{label:t.label}):i(`Run kept as {label}`,{label:t.label}),`success`),t.folder}catch(e){return n(e,i(`Keep this run`)),null}}async function Nt(){let e=null;try{e=await E(`runs.unsaved`)}catch{return!0}if(!e?.unsaved)return!0;let t=await Te(i(`The results of the last run ({started}) are still in OutputFile/ and have not been kept. A new run overwrites them.`,{started:e.started??``}),[{key:`keep`,label:i(`Keep and run`),variant:`primary`},{key:`run`,label:i(`Run without keeping`)},{key:`cancel`,label:i(`Cancel`)}],{title:i(`Previous results`)});return t===null||t===`cancel`?!1:t!==`keep`||await Mt()!==null}async function Pt(){let e=T.getState();if(e.project.open&&!e.run.running&&(await jt()).ok&&await Nt())try{let e=await E(`run.start`);T.setState({run:e}),Se(`run`)}catch(e){n(e,i(`Run`))}}async function Ft(){try{await E(`run.stop`)}catch(e){n(e,i(`Stop`))}}async function It(){if(T.getState().run.running)try{T.setState({run:await E(`run.pause`)})}catch(e){n(e,i(`Pause`))}}async function Lt(){if(T.getState().run.running)try{T.setState({run:await E(`run.resume`)})}catch(e){n(e,i(`Resume`))}}async function Rt(e){if(T.getState().run.running)return await l(i(`Stop the running simulation first.`),{title:i(`Run`)}),!1;let t=e.kind===`project`?i(`Move the results of the full-lattice run (OutputFile/) to the recycle bin? The run record goes with them.`):e.kind===`archived`?i(`Move the kept run {label} and all its files to the recycle bin?`,{label:e.label}):i(`Move segment run {label} and all its files to the recycle bin?`,{label:e.label});if(!await oe(t,{title:i(`Delete`),ok:i(`Move to recycle bin`),danger:!0}))return!1;try{return await E(`runs.delete`,{outputDir:e.outputDir}),Ee(i(`Moved to the recycle bin`),`success`),!0}catch(e){return n(e),!1}}function zt(){let{run:e}=T.getState();e.running?e.paused?Lt():It():Pt()}function Bt(){Qe.getState().show()}async function Vt(){let{version:e}=T.getState(),t=[];try{let e=await E(`app.info`),n=e.build??{};t=[n.frozen?i(`Stand-alone build`):i(`Running from source`),n.built?`${i(`Built`)}: ${n.built}`:n.frontend?`${i(`Front end built`)}: ${n.frontend}`:``,n.commit?`${i(`Commit`)}: ${n.commit}${n.dirty?` (${i(`with local changes`)})`:``}`:``,`${i(`Location`)}: ${n.location??``}`,`Python ${e.python} · WebView2 ${e.webview2??`–`}`].filter(Boolean)}catch{}l(`AVAS ${e}\nAdvanced Virtual Accelerator Software\n\n${t.join(`
`)}${t.length?`

`:``}C. Jin, Z.-J. Wang, X. Qi, Y. He, K. Li, et al., Phys. Rev. Accel. Beams 28, 044602 (2025)`,{title:i(`About AVAS`)})}var Ht=!1;async function Ut(){if(!Ht){Ht=!0;try{if(T.getState().run.running&&!await oe(i(`A simulation is running. Stop it and quit?`),{title:i(`Quit`),ok:i(`Stop and quit`),danger:!0})||!await St(i(`quitting`)))return;T.getState().run.running&&await E(`run.stop`),await E(`app.quit`)}finally{Ht=!1}}}function Wt(){r()&&Ut()}c(`app.closeRequested`,()=>Ut());var Gt=null;function Kt(){let e=Object.values(pt.getState().dirty).some(Boolean);e!==Gt&&(Gt=e,ne()&&E(`app.closeGuard`,{unsaved:e}).catch(()=>void 0))}pt.subscribe(Kt),ne()||window.addEventListener(`beforeunload`,e=>{Gt&&e.preventDefault()});function qt(e){let t=e.target;return t?t.isContentEditable||[`INPUT`,`TEXTAREA`,`SELECT`].includes(t.tagName)||!!t.closest(`.monaco-editor`):!1}function Jt(){return f()}var k=_(()=>({info:null,busy:!1,message:``,hidden:``,status:{phase:`idle`,commit:``}}));c(`updates.progress`,e=>k.setState({message:e.message}));async function Yt(){if(k.getState().busy)return;let e=await E(`updates.status`).catch(()=>null);if(e&&e.phase!==`idle`){k.setState({status:e});return}await Qt()}async function Xt(){k.setState({busy:!0});try{if(!await St(i(`updating AVAS`)))return;await m()}catch(e){n(e,i(`AVAS update`))}finally{k.setState({busy:!1})}}async function Zt(){try{await E(`updates.cancel`),k.setState({status:{phase:`idle`,commit:``}})}catch(e){n(e,i(`AVAS update`))}}async function Qt(){if(k.getState().busy)return;k.setState({busy:!0,message:`Checking for updates...`});let e=!1;try{let t=await E(`updates.check`,{force:!0});for(k.setState({info:t});t.available;){k.setState({message:``});let n=t.release,r=`${i(`Current version`)}: ${t.current.version} · ${t.current.commit.slice(0,8)||`—`}\n${i(`Available version`)}: ${n.version} · ${n.commit.slice(0,8)}\n${n.published}\n\n${i(`What's new`)}\n${n.notes}\n\n${i(`Even if you ignore this version, you can still get it from Help → Check for updates.`)}`+(t.canInstall?``:`\n\n${i(`Update the server installation locally, then restart avas serve.`)}`),a=await Te(r,[...t.canInstall?[{key:`install`,label:i(`Update and restart`),variant:`primary`}]:[{key:`download`,label:i(`Open downloads`),variant:`primary`}],{key:`ignore`,label:i(`Ignore this version`)},{key:`later`,label:i(`Later`)}],{title:i(`AVAS update`)});if(a===`ignore`){await E(`updates.ignore`,{commit:n.commit}),k.setState({info:{...t,ignored:!0}});return}if(a===`download`){v(`https://github.com/lycself/AVAS/releases/tag/avas-${n.commit}`);return}if(a!==`install`){k.setState({hidden:n.commit});return}k.setState({message:`Preparing the confirmed update...`});let o=await E(`updates.prepare`,{commit:n.commit});if(o.changed&&o.info){t=o.info,k.setState({info:t}),await l(i(`A newer version is available. Review it before confirming.`),{title:i(`AVAS update`)});continue}if(e=!0,!await St(i(`updating AVAS`)))return;k.setState({message:`Restarting to install the update...`}),await m(),e=!1;return}await l(i(`This installation is already up to date.`),{title:i(`AVAS update`)})}catch(e){n(e,i(`AVAS update`))}finally{e&&await E(`updates.cancel`).catch(()=>void 0),k.setState({busy:!1,message:``})}}function $t(){let e=h(),{info:t,busy:n,message:r,hidden:i,status:a}=k();return(0,D.useEffect)(()=>{let t=!1,n=async()=>{if(!k.getState().busy)try{let e=await E(`updates.check`);t||k.setState({info:e})}catch{}},r=window.setTimeout(n,3e3),i=window.setInterval(n,216e5),a=async()=>{try{let e=await E(`updates.status`);t||k.setState({status:e})}catch{}};a();let o=window.setInterval(a,3e3);return E(`updates.result`).then(t=>{t&&(t.ok?Ee(e(`AVAS was updated successfully.`),`success`):l(`${e(`The update failed. See the update log for recovery details.`)}\n${e(t.error??``)}\n${t.log??``}`,{title:e(`AVAS update`)}))}).catch(()=>void 0),()=>{t=!0,clearTimeout(r),clearInterval(i),clearInterval(o)}},[]),!n&&a.phase!==`idle`?(0,O.jsxs)(`div`,{className:`update-notice`,role:`status`,children:[(0,O.jsxs)(`span`,{children:[a.phase===`ready`?e(`The confirmed update is ready to install.`):e(`Preparing the confirmed update...`),` `,a.commit.slice(0,8)]}),a.phase===`ready`&&(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(C,{onClick:Xt,children:e(`Update and restart`)}),(0,O.jsx)(C,{onClick:Zt,children:e(`Cancel`)})]})]}):n&&!r||!n&&(!t?.available||t.ignored||i===t.release.commit)?null:(0,O.jsx)(`div`,{className:`update-notice`,role:`status`,children:n?(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(ge,{size:14}),(0,O.jsx)(`span`,{children:e(r)})]}):(0,O.jsxs)(O.Fragment,{children:[(0,O.jsxs)(`span`,{children:[e(`An AVAS update is available.`),` `,t.release.commit.slice(0,8)]}),(0,O.jsx)(C,{onClick:Qt,children:e(`Review update`)}),(0,O.jsx)(C,{onClick:()=>k.setState({hidden:t.release.commit}),children:e(`Later`)})]})})}function en({error:e,onRetry:t}){let n=h();return(0,O.jsxs)(`div`,{className:`empty-state`,role:`alert`,children:[(0,O.jsx)(`div`,{className:`danger-text`,style:{fontSize:15},children:n(`This view hit an internal error.`)}),(0,O.jsx)(`pre`,{className:`selectable`,style:{maxWidth:800,whiteSpace:`pre-wrap`,color:`var(--fg-muted)`},children:String(e?.message??e)}),(0,O.jsx)(C,{onClick:t,children:n(`Try again`)})]})}var A=class extends D.Component{state={error:null};static getDerivedStateFromError(e){return{error:e}}componentDidCatch(e){console.error(this.props.name,e)}render(){let{error:e}=this.state;return e?(0,O.jsx)(en,{error:e,onRetry:()=>this.setState({error:null})}):this.props.children}},tn=[{id:`newProject`,keys:`Ctrl+N`,label:`New project...`},{id:`openProject`,keys:`Ctrl+O`,label:`Open project...`},{id:`save`,keys:`Ctrl+S`,label:`Save all pages`},{id:`quit`,keys:`Ctrl+Q`,label:`Exit`,scope:`desktop window`},{id:`runPauseResume`,keys:`F5`,label:`Run / pause / resume the simulation`},{id:`stop`,keys:`Shift+F5`,label:`Stop the simulation`},{id:`pages`,keys:`Ctrl+1 … Ctrl+8`,label:`Switch to a page (in sidebar order)`},{id:`sidebar`,keys:`Ctrl+B`,label:`Collapse or expand the sidebar`},{id:`log`,keys:`Ctrl+J`,label:`Show or hide the log panel`},{id:`assistant`,keys:`Ctrl+Shift+A`,label:`Show or hide the AI assistant`},{id:`zoomIn`,keys:`Ctrl+=`,label:`Zoom in`},{id:`zoomOut`,keys:`Ctrl+-`,label:`Zoom out`},{id:`zoomReset`,keys:`Ctrl+0`,label:`Reset zoom`},{id:`undo`,keys:`Ctrl+Z`,label:`Undo`,scope:`Beam and Settings pages, outside a text box`},{id:`redo`,keys:`Ctrl+Y`,label:`Redo`,scope:`Beam and Settings pages, outside a text box`}],nn=Object.fromEntries(tn.map(e=>[e.id,e]));function rn(e,t){let n=t.split(`+`),r=n.pop()??``,i=n.includes(`Ctrl`),a=n.includes(`Shift`),o=n.includes(`Alt`);return(e.ctrlKey||e.metaKey)!==i||e.altKey!==o?!1:r===`=`?e.key===`=`||e.key===`+`:e.shiftKey===a?r.length===1?e.key.toLowerCase()===r.toLowerCase():e.key===r:!1}var an=5e3,j=_(()=>({entries:[],errors:0,warnings:0,seq:0,filter:`all`,query:``}));function on(e,t){we(!0);let n={};e&&(n.filter=e),t!==void 0&&(n.query=t),j.setState(n)}function sn(e){j.setState(t=>{let n=t.errors,r=t.warnings;for(let t of e)t.level===`ERROR`||t.level===`CRITICAL`?n++:t.level===`WARNING`&&r++;let i=t.entries.concat(e);return{entries:i.length>an?i.slice(i.length-an):i,errors:n,warnings:r,seq:t.seq+e.length}});let t=e[e.length-1];if(t&&t.name!==`avas.engine`){let e=t.msg.split(`
`).find(e=>e.trim())??``,n=t.level===`ERROR`||t.level===`CRITICAL`?`error`:t.level===`WARNING`?`warning`:`info`;T.getState().run.running||Ae(e,n)}}var cn=[],ln=!1;function un(){E(`app.logHistory`).then(e=>e.length&&sn(e)).catch(()=>void 0),c(`log`,e=>{cn.push(e),ln||(ln=!0,requestAnimationFrame(()=>{ln=!1;let e=cn;cn=[],sn(e)}))})}function dn(){j.setState({entries:[],errors:0,warnings:0,seq:0}),Ae(``),E(`app.clearLog`).catch(()=>void 0)}function fn(e){return new Date(e*1e3).toTimeString().slice(0,8)}function pn(){let e=h(),t=j(e=>e.entries),n=T(e=>e.logMaximized),r=j(e=>e.filter),i=j(e=>e.query),a=e=>j.setState({filter:e}),o=e=>j.setState({query:e}),s=(0,D.useRef)(null),c=(0,D.useRef)(!0),l=(0,D.useMemo)(()=>{let e=i.trim().toLowerCase();return t.filter(t=>!(r===`problems`&&t.level!==`WARNING`&&t.level!==`ERROR`&&t.level!==`CRITICAL`||r===`gui`&&t.name===`avas.engine`||e&&!t.msg.toLowerCase().includes(e)))},[t,r,i]),[u,d]=(0,D.useState)(600),f=l.length>u?l.slice(l.length-u):l;(0,D.useLayoutEffect)(()=>{let e=s.current;e&&c.current&&(e.scrollTop=e.scrollHeight)},[f]),(0,D.useEffect)(()=>{let e=s.current;if(!e)return;let t=()=>{c.current=e.scrollHeight-e.scrollTop-e.clientHeight<24,e.scrollTop<40&&u<l.length&&d(e=>e+600)};return e.addEventListener(`scroll`,t),()=>e.removeEventListener(`scroll`,t)},[u,l.length]);let p=()=>{let e=l.map(e=>`${fn(e.t)} ${e.level.padEnd(7)} ${e.msg}`).join(`
`);navigator.clipboard?.writeText(e).catch(()=>void 0)};return(0,O.jsxs)(`div`,{className:`log-panel`,children:[(0,O.jsxs)(`div`,{className:`panel-header`,children:[(0,O.jsx)(`div`,{className:`panel-tab active`,children:e(`Log`).toUpperCase()}),(0,O.jsxs)(`div`,{className:`panel-filters`,children:[[`all`,`problems`,`gui`].map(t=>(0,O.jsx)(`button`,{className:ke(`chip`,r===t&&`active`),onClick:()=>a(t),children:e(t===`all`?`All`:t===`problems`?`Problems`:`Without engine output`)},t)),(0,O.jsxs)(`div`,{className:`panel-search`,children:[(0,O.jsx)(S,{name:`filter`}),(0,O.jsx)(`input`,{value:i,onChange:e=>o(e.target.value),placeholder:e(`Filter`),spellCheck:!1})]})]}),(0,O.jsx)(`div`,{className:`grow`}),(0,O.jsx)(xe,{icon:`copy`,tip:e(`Copy log`),onClick:p}),(0,O.jsx)(xe,{icon:`clear-all`,tip:e(`Clear log`),onClick:dn}),(0,O.jsx)(xe,{icon:n?`chevron-down`:`chevron-up`,tip:e(n?`Restore panel size`:`Maximize panel`),onClick:()=>pe(!n)}),(0,O.jsx)(xe,{icon:`close`,tip:e(`Hide panel (Ctrl+J)`),onClick:()=>we(!1)})]}),(0,O.jsxs)(`div`,{className:`log-body selectable mono`,ref:s,onContextMenu:t=>{t.preventDefault();let n=window.getSelection()?.toString()??``;ae([{label:e(`Copy`),icon:`copy`,disabled:!n,onClick:()=>navigator.clipboard?.writeText(n)},{label:e(`Copy log`),onClick:p},{type:`separator`},{label:e(`Clear log`),icon:`clear-all`,onClick:dn}],t.clientX,t.clientY)},children:[f.map((e,t)=>(0,O.jsxs)(`div`,{className:ke(`log-line`,`log-${e.level.toLowerCase()}`,e.name===`avas.engine`&&`log-engine`),children:[(0,O.jsx)(`span`,{className:`log-time`,children:fn(e.t)}),(0,O.jsx)(`span`,{className:`log-msg`,children:e.msg})]},l.length-f.length+t)),!l.length&&(0,O.jsx)(`div`,{className:`log-empty`,children:t.length?e(`No matching lines`):e(`No messages yet`)})]})]})}var mn=_(()=>({mode:(()=>{try{return localStorage.getItem(`avas.latticeMode`)===`visual`?`visual`:`text`}catch{return`text`}})(),pendingSelect:null,visualEditing:!1}));function hn(e){mn.getState().visualEditing!==e&&mn.setState({visualEditing:e})}function gn(e){mn.setState({mode:e});try{localStorage.setItem(`avas.latticeMode`,e)}catch{}}var _n=0;function vn(e){mn.setState({pendingSelect:{line:e,seq:++_n}})}var yn=null;function bn(e){return yn=e,()=>{yn===e&&(yn=null)}}function xn(){let e=yn?.selection();return e?`line ${e.line+1}: ${e.keyword}${e.name?` (${e.name})`:``}`:null}var Sn={"lattice.getText":()=>!yn||yn.getText()==null?null:{name:yn.name(),text:yn.getText(),dirty:yn.isDirty()},"lattice.apply":async({name:e,text:t})=>!yn||yn.name()!==e||yn.getText()==null?{applied:!1}:(yn.replaceText(t),await yn.save(),{applied:!0,saved:!0}),"pages.reload":async({paths:e,pages:t})=>{for(let t of e??[])xt(t,`assistant`);for(let e of t??[]){if(!e)continue;let t=vt(e);t?.reload&&!t.isDirty()&&await t.reload()}return!0},"pages.dirty":()=>Object.entries(pt.getState().dirty).filter(([,e])=>e).map(([e])=>e),"ui.state":()=>({page:T.getState().page,selection:xn(),dirty:Object.entries(pt.getState().dirty).filter(([,e])=>e).map(([e])=>e)}),"ui.select":({line:e})=>(Se(`lattice`),vn(e),!0),"run.start":async()=>(await Pt(),T.getState().run.running?{started:!0}:{started:!1,error:`The simulation was not started (see the message in the window).`}),"run.prepare":async()=>T.getState().run.running?{ok:!1,error:`A simulation is already running.`}:jt(),"ui.page":({page:e})=>(Se(e),!0)};function Cn(){c(`assistant.front`,async e=>{let t=Sn[e.method];try{if(!t)throw Error(`Unknown page request ${e.method}`);let n=await t(e.params??{});await E(`assistant.frontReply`,{id:e.id,ok:!0,result:n??null})}catch(t){await E(`assistant.frontReply`,{id:e.id,ok:!1,error:t?.message??String(t)}).catch(()=>void 0)}})}var wn=_(()=>({open:!1,width:420,config:null,conversations:[],current:null,loading:!1})),M=wn.setState,N=wn.getState;function Tn(){let e=T.getState().settings;M({open:!!e[`ui/assistantOpen`],width:Math.max(320,Math.min(900,Number(e[`ui/assistantWidth`])||420))}),N().open&&kn().catch(()=>void 0),c(`assistant.event`,e=>Vn(e));let t=T.getState().project.path??null;T.subscribe(e=>{let n=e.project.open?e.project.path??null:null;if(n===t)return;t=n;let r=N().current;r&&!r.busy&&M({current:null}),On=!1,N().open&&kn().catch(()=>void 0)})}function En(e){M({open:e}),ue({"ui/assistantOpen":e}),e&&kn().catch(e=>n(e))}function Dn(e){M({width:e}),ue({"ui/assistantWidth":e})}var On=!1;async function kn(){if((!N().config||!On)&&await An(),!On){On=!0,await jn();let e=N().conversations;!N().current&&e.length&&await Mn(e[0].id)}}async function An(){let e=await E(`assistant.config`);return M({config:e}),e}async function jn(){let e=await E(`assistant.conversations`);return M({conversations:e}),e}async function Mn(e){M({loading:!0});try{let t=await E(`assistant.load`,{id:e});M({current:{id:t.id,title:t.title,items:t.items??[],busy:!!t.busy,autoApply:!!t.autoApply}})}finally{M({loading:!1})}}async function Nn(){let e=await E(`assistant.new`);return M({current:{id:e.id,title:``,items:[],busy:!1,autoApply:!!e.autoApply}}),e.id}async function Pn(e){M({conversations:await E(`assistant.delete`,{id:e})}),N().current?.id===e&&M({current:null})}function Fn(){let e=T.getState(),t=Object.entries(pt.getState().dirty).filter(([,e])=>e).map(([e])=>e);return{page:e.page,selection:xn(),dirty:t}}async function In(e){let t=N().current;if(t||=(await Nn(),N().current),t)try{M({current:{...t,busy:!0}}),await E(`assistant.send`,{conversation:t.id,text:e,ui:Fn()}),jn().catch(()=>void 0)}catch(e){M({current:{...N().current,busy:!1}}),n(e)}}async function Ln(){let e=N().current;e&&await E(`assistant.stop`,{conversation:e.id}).catch(n)}async function Rn(e,t,r){let i=N().current;i&&await E(`assistant.decide`,{conversation:i.id,id:e,decision:t,choice:r}).catch(n)}async function zn(e){let t=N().current;t&&await E(`assistant.undo`,{conversation:t.id,id:e}).catch(n)}async function Bn(e){N().current||await Nn();let t=N().current,n=await E(`assistant.setAutoApply`,{id:t.id,value:e});M({current:{...N().current,autoApply:n.autoApply}})}function Vn(e){let t=N().current;if(!t||e.conversation!==t.id){e.type===`busy`&&jn().catch(()=>void 0);return}if(e.type===`item`){let n=t.items.slice(),r=n.findIndex(t=>t.id===e.item.id);r>=0?n[r]=e.item:n.push(e.item),M({current:{...t,items:n}})}else if(e.type===`delta`){let n=t.items.slice(),r=n.findIndex(t=>t.id===e.itemId);if(r<0)return;let i={...n[r]};i[e.field]=(i[e.field]??``)+e.delta,n[r]=i,M({current:{...t,items:n}})}else e.type===`busy`&&(M({current:{...t,busy:!!e.busy}}),e.busy||jn().catch(()=>void 0))}var Hn=`modulepreload`,Un=function(e,t){return new URL(e,t).href},Wn={},Gn=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?import.meta.resolve(e):new URL(e,import.meta.url).href}r=o(t.map(t=>{if(t=Un(t,n),t=s(t),t in Wn)return;Wn[t]=!0;let r=t.endsWith(`.css`);for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}let i=document.createElement(`link`);if(i.rel=r?`stylesheet`:Hn,r||(i.as=`script`),i.crossOrigin=``,i.href=t,a&&i.setAttribute(`nonce`,a),document.head.appendChild(i),r)return new Promise((e,n)=>{i.addEventListener(`load`,e),i.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},Kn=(0,D.lazy)(()=>Gn(()=>import(`./AssistantPanel-mX3ZxCQf.js`).then(e=>({default:e.AssistantPanel})),__vite__mapDeps([0,1,2]),import.meta.url)),qn=(0,D.lazy)(()=>Gn(()=>import(`./ProjectPage-F71O2Qja.js`),__vite__mapDeps([3,1,2]),import.meta.url)),Jn=(0,D.lazy)(()=>Gn(()=>import(`./BeamPage-CvXn7qb2.js`),__vite__mapDeps([4,1,2,5,6,7]),import.meta.url)),Yn=(0,D.lazy)(()=>Gn(()=>import(`./LatticePage-CWNUwe7k.js`),__vite__mapDeps([8,1,2,6,9,10,11,12]),import.meta.url)),Xn=(0,D.lazy)(()=>Gn(()=>import(`./SettingsPage-CTJAwYtF.js`),__vite__mapDeps([13,2,1,6,7]),import.meta.url)),Zn=(0,D.lazy)(()=>Gn(()=>import(`./FilesPage-CyOufa6f.js`),__vite__mapDeps([14,1,2,10,11,5,6,9,12]),import.meta.url)),Qn=(0,D.lazy)(()=>Gn(()=>import(`./RunPage-B5Od8iYz.js`),__vite__mapDeps([15,1,2,10,11,6]),import.meta.url)),$n=(0,D.lazy)(()=>Gn(()=>import(`./ResultsPage-MXOf93DS.js`),__vite__mapDeps([16,1,2,5,6]),import.meta.url)),er=(0,D.lazy)(()=>Gn(()=>import(`./ScanPage--5-6k0oy.js`),__vite__mapDeps([17,1,2,5,6]),import.meta.url)),tr={project:{label:`Project`,icon:`home`,render:()=>(0,O.jsx)(qn,{})},beam:{label:`Beam`,icon:`pulse`,render:()=>(0,O.jsx)(Jn,{})},lattice:{label:`Lattice`,icon:`list-ordered`,render:()=>(0,O.jsx)(Yn,{})},settings:{label:`Settings`,icon:`settings-gear`,render:()=>(0,O.jsx)(Xn,{})},files:{label:`Files`,icon:`files`,render:()=>(0,O.jsx)(Zn,{})},run:{label:`Run`,icon:`play-circle`,render:()=>(0,O.jsx)(Qn,{})},scan:{label:`Scan`,icon:`graph-scatter`,render:()=>(0,O.jsx)(er,{})},results:{label:`Results`,icon:`graph-line`,render:()=>(0,O.jsx)($n,{})}},nr=48,rr=160,ir=480,ar=110;function or(){return fe(e=>(0,O.jsx)(a,{title:i(`Keyboard shortcuts`),icon:`keyboard`,onClose:()=>e(),footer:(0,O.jsx)(C,{variant:`primary`,autoFocus:!0,onClick:()=>e(),children:i(`Close`)}),children:(0,O.jsxs)(`table`,{className:`shortcut-table`,children:[(0,O.jsx)(`thead`,{children:(0,O.jsxs)(`tr`,{children:[(0,O.jsx)(`th`,{children:i(`Action`)}),(0,O.jsx)(`th`,{children:i(`Shortcut`)})]})}),(0,O.jsx)(`tbody`,{children:tn.map(e=>(0,O.jsxs)(`tr`,{children:[(0,O.jsxs)(`td`,{children:[i(e.label),e.scope&&(0,O.jsxs)(`span`,{className:`soft`,children:[` · `,i(e.scope)]})]}),(0,O.jsx)(`td`,{children:(0,O.jsx)(`span`,{className:`kbd`,children:e.keys})})]},e.id))})]})}),{width:520})}function sr(){let e=h(),t=ve(e=>e.lang),[n,i]=(0,D.useState)(null),a=(0,D.useRef)([]),o=T(e=>e.project.open),c=T(e=>e.project.name),l=T(e=>e.project.path),u=T(e=>e.project.recent),f=T(e=>e.run.running),p=T(e=>e.run.running&&!!e.run.paused),m=T(e=>e.page),g=T(e=>e.sidebarCollapsed),_=T(e=>e.logVisible),v=T(e=>e.theme),y=T(e=>e.scale),b=T(e=>e.settings[`ui/motion`]??`full`),ee=pt(e=>Object.values(e.dirty).some(Boolean));(0,D.useEffect)(()=>{document.title=o&&c?`AVAS – ${c}`:`AVAS`},[o,c]);let ne=[{label:e(`File`),items:()=>[{label:e(`New project...`),shortcut:nn.newProject.keys,icon:`new-folder`,onClick:wt},{label:e(`Open project...`),shortcut:nn.openProject.keys,icon:`folder-opened`,onClick:()=>Ct()},{label:e(`Open recent`),disabled:!u.length,submenu:u.map(e=>({label:e,onClick:()=>Ct(e)}))},{label:e(`Close project`),disabled:!o,onClick:Tt},{type:`separator`},{label:e(`Project overview`),icon:`home`,disabled:!o,onClick:()=>Se(`project`)},{label:e(`Show in Explorer`),icon:`folder`,disabled:!o,onClick:Et},{type:`separator`},{label:e(`Save`),shortcut:nn.save.keys,icon:`save`,disabled:!o,onClick:()=>At()},...r()?[{type:`separator`},{label:e(`Exit`),shortcut:nn.quit.keys,onClick:Wt}]:[]]},{label:e(`Run`),items:()=>[f?p?{label:e(`Resume`),shortcut:nn.runPauseResume.keys,icon:`debug-continue`,onClick:Lt}:{label:e(`Pause`),shortcut:nn.runPauseResume.keys,icon:`debug-pause`,onClick:It}:{label:e(`Run simulation`),shortcut:nn.runPauseResume.keys,icon:`play`,disabled:!o,onClick:Pt},{label:e(`Stop`),shortcut:nn.stop.keys,icon:`debug-stop`,disabled:!f,onClick:Ft}]},{label:e(`View`),items:()=>[..._e.map((t,n)=>({label:e(tr[t].label),shortcut:`Ctrl+${n+1}`,checked:m===t,onClick:()=>Se(t)})),{type:`separator`},{label:e(`Collapse sidebar`),shortcut:nn.sidebar.keys,checked:g,onClick:()=>ce(!g)},{label:e(`Show log panel`),shortcut:nn.log.keys,checked:_,onClick:()=>we(!_)},{label:e(`AI assistant`),shortcut:nn.assistant.keys,checked:wn.getState().open,onClick:()=>En(!wn.getState().open)},{type:`separator`},{label:e(`Theme`),submenu:[`system`,`light`,`dark`].map(t=>({label:e(t===`system`?`Follow system`:t===`light`?`Light`:`Dark`),checked:v===t,onClick:()=>Me(t)}))},{label:e(`UI scale`),submenu:[...le.map(e=>({label:`${e} %`,checked:y===e,onClick:()=>me(e)})),{type:`separator`},{label:e(`Zoom in`),shortcut:nn.zoomIn.keys,onClick:()=>te(1)},{label:e(`Zoom out`),shortcut:nn.zoomOut.keys,onClick:()=>te(-1)},{label:e(`Reset zoom`),shortcut:nn.zoomReset.keys,onClick:()=>me(100)}]},{label:e(`Motion`),submenu:[[`full`,e(`Full: moving bunch and particle cloud`)],[`lite`,e(`Reduced: moving marker only`)],[`off`,e(`Off: update once per second`)],[`auto`,e(`Automatic (follow Windows animation effects)`)]].map(([e,t])=>({label:t,checked:b===e,onClick:()=>ue({"ui/motion":e})}))}]},{label:e(`Settings`),items:()=>[{label:e(`Language`),submenu:Object.keys(s).map(e=>({label:s[e],checked:t===e,onClick:()=>De(e)}))}]},{label:e(`Help`),items:()=>[{label:e(`User manual`),icon:`book`,onClick:Bt},{label:e(`Keyboard shortcuts`),icon:`keyboard`,onClick:()=>void or()},{type:`separator`},{label:e(`About AVAS`),icon:`info`,onClick:Vt},{label:e(`Check for updates`),icon:`refresh`,onClick:Yt}]}],re=e=>{let t=a.current[e];t&&(i(e),se(t,ne[e].items(),{onClose:()=>i(t=>t===e?null:t)}))};return(0,O.jsxs)(`div`,{className:`menubar`,children:[(0,O.jsx)(`div`,{className:`menubar-logo`,children:(0,O.jsx)(S,{name:`circuit-board`})}),ne.map((e,t)=>(0,O.jsx)(`button`,{ref:e=>{a.current[t]=e},className:ke(`menubar-item`,n===t&&`open`),onMouseDown:e=>{e.preventDefault(),n===t?(d(),i(null)):re(t)},onMouseEnter:()=>{n!==null&&n!==t&&(d(),re(t))},children:e.label},t)),(0,O.jsx)(`div`,{className:`grow`}),(0,O.jsx)(`div`,{className:ke(`menubar-title ellipsis`,`clickable`),"data-tip":o?l:e(`Open or create a project`),onMouseDown:e=>{e.preventDefault(),se(e.currentTarget,Dt())},children:o?`${c} — AVAS`:`AVAS`}),(0,O.jsx)(`div`,{className:`grow`}),(0,O.jsxs)(`div`,{className:`toolbar-actions`,children:[(0,O.jsx)(xe,{icon:`folder-opened`,tip:`${e(`Open project...`)}  (Ctrl+O)`,onClick:()=>Ct()}),(0,O.jsx)(xe,{icon:`save`,tip:ee?`${e(`Save`)}  (Ctrl+S)`:e(`Nothing to save`),disabled:!o||!ee,onClick:()=>At()}),(0,O.jsx)(`div`,{className:`divider-v`}),(0,O.jsx)(xe,{icon:f?p?`debug-continue`:`debug-pause`:`play`,className:ke(`run-btn`,f&&!p&&`pause`),tip:`${e(f?p?`Resume`:`Pause`:`Run simulation`)}  (F5)`,disabled:!o&&!f,onClick:zt}),(0,O.jsx)(xe,{icon:`debug-stop`,className:`stop-btn`,tip:`${e(`Stop`)}  (Shift+F5)`,disabled:!f,onClick:Ft}),(0,O.jsx)(`div`,{className:`divider-v`}),(0,O.jsx)(xe,{icon:g?`layout-sidebar-left-off`:`layout-sidebar-left`,tip:e(`Toggle sidebar (Ctrl+B)`),onClick:()=>ce(!g)}),(0,O.jsx)(xe,{icon:_?`layout-panel`:`layout-panel-off`,tip:e(`Toggle log panel (Ctrl+J)`),onClick:()=>we(!_)}),(0,O.jsx)(`div`,{className:`divider-v`}),(0,O.jsx)(cr,{})]})]})}function cr(){let e=h(),t=wn(e=>e.open),n=wn(e=>!!e.current?.busy);return(0,O.jsxs)(`button`,{className:ke(`assistant-toggle`,t&&`active`),"data-tip":e(`AI assistant (Ctrl+Shift+A)`),onClick:()=>En(!t),children:[n?(0,O.jsx)(ge,{size:14}):(0,O.jsx)(S,{name:`sparkle`}),(0,O.jsx)(`span`,{children:e(`Assistant`)})]})}function lr(){let e=h(),t=T(e=>e.page),n=T(e=>e.sidebarCollapsed),r=T(e=>e.run.running),i=T(e=>!!e.run.paused),a=T(e=>e.version),o=T(e=>e.project.open),s=pt(e=>e.dirty),c={beam:s.beam,lattice:s.lattice,settings:s.settings,files:s.files};return(0,O.jsxs)(`nav`,{className:ke(`sidebar`,n&&`collapsed`),children:[(0,O.jsx)(`div`,{className:`sidebar-header`,children:!n&&(0,O.jsxs)(`span`,{children:[`AVAS\xA0\xA0v`,a]})}),_e.map(a=>{let s=tr[a],l=a===`run`&&r;return(0,O.jsxs)(`button`,{className:ke(`nav-item`,t===a&&`active`,a!==`project`&&!o&&`dim`),"data-tip":n?e(s.label):void 0,onClick:()=>{t===a&&n?ce(!1):Se(a)},children:[l&&i?(0,O.jsx)(S,{name:`debug-pause`,className:`nav-paused`}):l?(0,O.jsx)(ge,{size:20}):(0,O.jsx)(S,{name:s.icon}),!n&&(0,O.jsx)(`span`,{className:`nav-label`,children:e(s.label)}),c[a]&&(0,O.jsx)(`span`,{className:`nav-dot`,"data-tip":e(`Unsaved changes`)})]},a)})]})}function ur(e,t){return n=>{if(n.button!==0)return;n.preventDefault();let r=n.clientX,i=n.clientY;document.body.classList.add(`dragging`);let a=t=>e(t.clientX-r,t.clientY-i),o=()=>{document.body.classList.remove(`dragging`),window.removeEventListener(`mousemove`,a),window.removeEventListener(`mouseup`,o),t?.()};window.addEventListener(`mousemove`,a),window.addEventListener(`mouseup`,o)}}function dr(){let e=h(),t=T(e=>e.project),n=T(e=>e.run),r=T(e=>e.statusMessage),i=T(e=>e.resolvedTheme),a=j(e=>e.errors),s=j(e=>e.warnings),c=r?.text??``;if(n.running){let t=[`${(n.percent??0).toFixed(0)} %`];n.stages&&n.stages>1&&t.push(`${e(`stage`)} ${n.stage}/${n.stages}`),n.step!=null&&n.all_step&&t.push(`${n.step}/${n.all_step}`),n.eta_s!=null&&!n.paused&&t.push(e(`{time} left`,{time:je(n.eta_s)})),c=[n.source===`assistant`?e(n.paused?`Assistant {task} paused`:`Assistant {task} running`,{task:e(n.label??``)}):n.source===`scan`?e(n.paused?`Parameter scan {task} paused`:`Parameter scan {task} running`,{task:n.label??``}):n.source===`segment`?e(n.paused?`Segment {label} paused`:`Segment {label} running`,{label:n.label??``}):e(n.paused?`Simulation paused`:`Simulation running`),...t].join(`  ·  `)}return(0,O.jsxs)(`div`,{className:ke(`statusbar`,n.running&&`running`),children:[(0,O.jsxs)(`button`,{className:`status-item status-project`,"data-tip":t.open?`${t.path}
${e(`Click to switch project`)}`:e(`Open or create a project`),onClick:e=>{let t=e.currentTarget.getBoundingClientRect();ae(Dt(),t.left,t.top-4,{anchorBottom:!0})},children:[(0,O.jsx)(S,{name:`root-folder`}),(0,O.jsx)(`span`,{className:`ellipsis`,children:t.open?t.name:e(`No project`)}),(0,O.jsx)(S,{name:`chevron-up`,style:{fontSize:12}})]}),(0,O.jsxs)(`button`,{className:`status-item`,"data-tip":e(`Errors and warnings in the log (click to show the log)`),onClick:()=>we(!0),children:[(0,O.jsx)(S,{name:`error`}),(0,O.jsx)(`span`,{children:a}),(0,O.jsx)(S,{name:`warning`}),(0,O.jsx)(`span`,{children:s})]}),(0,O.jsx)(`div`,{className:ke(`status-message ellipsis`,!n.running&&r?.level===`error`&&`error`),"data-tip":c||void 0,children:c}),n.running&&(0,O.jsx)(`button`,{className:`status-item`,"data-tip":e(`Show the Run page`),onClick:()=>Se(`run`),children:n.paused?(0,O.jsx)(S,{name:`debug-pause`}):(0,O.jsx)(ge,{size:14})}),(0,O.jsx)(`button`,{className:`status-item`,"data-tip":e(i===`dark`?`Switch to light theme`:`Switch to dark theme`),onClick:o,children:(0,O.jsx)(S,{name:`color-mode`})})]})}function fr(){(0,D.useEffect)(()=>{let e=e=>{if(Jt()||e.target instanceof Element&&e.target.closest(`.manual-window`))return;let t=e.ctrlKey||e.metaKey,n=T.getState(),r=e.key.toLowerCase(),i=t=>rn(e,nn[t].keys),a=!0;i(`stop`)?Ft():i(`runPauseResume`)?zt():i(`save`)?At():i(`openProject`)?Ct():i(`newProject`)?wt():i(`quit`)?Wt():i(`sidebar`)?ce(!n.sidebarCollapsed):i(`log`)?we(!n.logVisible):i(`assistant`)?En(!wn.getState().open):i(`zoomIn`)?te(1):i(`zoomOut`)?te(-1):i(`zoomReset`)?me(100):t&&!e.shiftKey&&!e.altKey&&/^[1-8]$/.test(e.key)&&!qt(e)?Se(_e[Number(e.key)-1]):a=e.key===`F12`||t&&e.shiftKey&&r===`i`?!1:t&&r===`r`&&!qt(e)?!0:!!(e.key===`F5`||t&&r===`p`||t&&r===`f`&&!qt(e)),a&&(e.preventDefault(),e.stopPropagation())};return window.addEventListener(`keydown`,e,!0),()=>window.removeEventListener(`keydown`,e,!0)},[])}function pr(){fr();let e=T(e=>e.page),t=T(e=>e.sidebarCollapsed),n=T(e=>e.sidebarWidth),r=T(e=>e.logVisible),i=T(e=>e.logHeight),a=T(e=>e.logMaximized),[o,s]=(0,D.useState)(()=>new Set([e])),[c,l]=(0,D.useState)(null),[u,d]=(0,D.useState)(null),f=wn(e=>e.open),p=wn(e=>e.width),[m,h]=(0,D.useState)(null),g=(0,D.useRef)(null);(0,D.useEffect)(()=>{s(t=>t.has(e)?t:new Set(t).add(e))},[e]);let _=c??(t?nr:n),v=(()=>{let e=0,r=0;return i=>{e=t?nr:n,r=e,ur(t=>{r=e+t,l(Math.max(nr,Math.min(ir,r)))},()=>{l(null),r<ar?ce(!0):(Oe(Math.max(rr,Math.min(ir,r))),t&&ce(!1))})(i)}})(),y=(()=>{let e=0,t=0;return n=>{let r=g.current?.clientHeight??800;e=a?r-120:i,t=e,ur((n,i)=>{t=Math.max(60,Math.min(r-120,e-i)),d(t)},()=>{d(null),t<60?we(!1):de(Math.round(t))})(n)}})(),b=a?{flex:`1 1 auto`}:{height:u??i},ee=e=>{let t=p,n=t;ur(e=>{n=Math.max(320,Math.min(Math.round(window.innerWidth*.6),t-e)),h(n)},()=>{h(null),Dn(n)})(e)};return(0,O.jsxs)(`div`,{className:`shell`,children:[(0,O.jsx)(sr,{}),(0,O.jsxs)(`div`,{className:`shell-body`,children:[(0,O.jsx)(`div`,{className:`sidebar-wrap`,style:{width:_},children:(0,O.jsx)(lr,{})}),(0,O.jsx)(`div`,{className:`sash sash-v`,onMouseDown:v,onDoubleClick:()=>ce(!t)}),(0,O.jsxs)(`div`,{className:`main`,ref:g,children:[(0,O.jsx)(`div`,{className:`pages`,style:a&&r?{flex:`0 0 120px`}:void 0,children:[...o].map(t=>(0,O.jsx)(`div`,{className:`page-host`,style:{display:t===e?void 0:`none`},children:(0,O.jsx)(A,{name:t,children:(0,O.jsx)(D.Suspense,{fallback:(0,O.jsx)(`div`,{className:`page-loading`,children:(0,O.jsx)(ge,{size:24})}),children:tr[t].render()})})},t))}),r&&(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(`div`,{className:`sash sash-h`,onMouseDown:y,onDoubleClick:()=>pe(!a)}),(0,O.jsx)(`div`,{className:`panel`,style:b,children:(0,O.jsx)(pn,{})})]})]}),f&&(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(`div`,{className:`sash sash-v`,onMouseDown:ee}),(0,O.jsx)(`div`,{className:`assistant-wrap`,style:{width:m??p},children:(0,O.jsx)(A,{name:`assistant`,children:(0,O.jsx)(D.Suspense,{fallback:(0,O.jsx)(`div`,{className:`page-loading`,children:(0,O.jsx)(ge,{size:20})}),children:(0,O.jsx)(Kn,{})})})})]})]}),(0,O.jsx)($t,{}),(0,O.jsx)(dr,{})]})}window.__avasDebug={useApp:T,useDirty:pt,setPage:Se,setTheme:Me,setLanguage:De,runSimulation:Pt,saveAll:At};function mr(){let e=T(e=>e.ready),[t,n]=(0,D.useState)(null);return(0,D.useEffect)(()=>{un(),Cn(),Ce().then(()=>Tn()).catch(e=>n(String(e?.message??e)))},[]),(0,D.useEffect)(()=>{let e=e=>{e.target.closest(`input, textarea, .selectable, .monaco-editor`)||e.preventDefault()};return window.addEventListener(`contextmenu`,e),()=>window.removeEventListener(`contextmenu`,e)},[]),t?(0,O.jsx)(`div`,{className:`boot-error`,children:t}):(0,O.jsxs)(O.Fragment,{children:[e?(0,O.jsx)(pr,{}):(0,O.jsx)(`div`,{className:`boot`,children:(0,O.jsx)(ge,{size:28})}),(0,O.jsx)(ut,{}),(0,O.jsx)(x,{}),(0,O.jsx)(u,{}),(0,O.jsx)(re,{}),(0,O.jsx)(ie,{})]})}(0,ze.createRoot)(document.getElementById(`root`)).render((0,O.jsx)(mr,{}));export{Dt as A,Ze as B,Jt as C,wt as D,qt as E,xt as F,vt as I,ht as L,Et as M,Pt as N,Ct as O,Ft as P,bt as R,Mt as S,Rt as T,hn as _,Nn as a,nn as b,In as c,Ln as d,zn as f,gn as g,vn as h,An as i,Lt as j,It as k,En as l,bn as m,Rn as n,Mn as o,wn as p,Pn as r,jn as s,Gn as t,Bn as u,mn as v,Tt as w,rn as x,on as y,mt as z};