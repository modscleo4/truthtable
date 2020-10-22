'use strict';

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

/**
 * Install the service worker
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
            console.error('ServiceWorker registration failed: ', err);
        });
    });
}

window.addEventListener('appinstalled', () => {
    console.log('A2HS installed');
});

const app = Vue.createApp({
    data: () => ({
        sidebarOpened: false,
        search: '',
        standalone: window.matchMedia('(display-mode: standalone)').matches,
        config: {
            get theme() {
                return localStorage.getItem('theme') ?? 'system';
            },

            set theme(val) {
                localStorage.setItem('theme', val);
                document.querySelector('html').setAttribute('theme', val);
            },
        },
    }),

    computed: {
        table: function () {
            return truthTable(this.search);
        },
    },

    methods: {
        getVars: str => getVars(str),
        getExpr: str => getExpr(str),
    },
}).mount('#app');

function matchChars(str) {
    const letters = [...'abcdefghijklmnopqrstuvwxyz'];
    return letters.map(l => (str.match(l) || []).length);
}

function getVars(str) {
    return matchChars(str).map((c, i) => ({
        var: [...'abcdefghijklmnopqrstuvwxyz'][i],
        count: c
    })).filter(v => v.count > 0).map(v => v.var);
}

function getExpr(str) {
    return str.replace('∧', '&&').replace('∨', '||').replace('¬', '!').replace('⊕', '^').replace(/([a-z])->([a-z])/gmi, '!$1||$2').replace(/([a-z])<->([a-z])/gmi, '$1==$2');
}

function truthTable(str) {
    try {
        str = str.toLowerCase().replace(/ /gmi, '');
        const vars = getVars(str);
        const varCount = vars.length;
        const expr = getExpr(str);
        const varsTable = Array.from(Array(Math.pow(2, varCount)).keys()).map(r => r.toString(2).padStart(varCount, '0').split(''));

        return varsTable.map(v => [...v, `${eval(expr.replace(/[a-z]/gmi, m => v[vars.indexOf(m)])) ? 1 : 0}`]);
    } catch (e) {
        return [];
    }
}
