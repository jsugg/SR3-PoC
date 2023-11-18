import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';
const appRoot = require('app-root-path').path;
const { SETTINGS } = require('./settings');
const { TARGET_SETUP } = require(`${appRoot}/config/sources`);
//import dotenv from 'dotenv';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import merge from 'rollup-plugin-copy-merge';

export default {
    input: 'public/js/scripts.js',
    output: {
        file: 'public/bundle.js',
        format: 'iife',
    },
    plugins: [
        replace({
            include: 'public/js/scripts.js',
            delimiters: ['', ''],
            values: {
                '__DATA_ENDPOINT__': `${SETTINGS.httpsServerProtocol}://${SETTINGS.httpServer}:${SETTINGS.httpsServerPort}` || 'https://localhost:4443',
                '__TARGET_WSP_MSG__' : `${TARGET_SETUP.wspMessage}`
            },
        }),
        merge({
            targets: [
                { src: 'public/css/*.css', file: 'public/styles.css'}
            ]
        }),
        terser({
            output: {
                comments: false,
            },
        }),
        resolve(),
        commonjs(),
    ],
};
