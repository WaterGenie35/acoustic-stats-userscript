// ==UserScript==
// @name         Acoustic Stats
// @namespace    http://tampermonkey.net/
// @version      2024-03-21
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    /**
     * @param number[] sorted data
     * @returns object containing number|undefined for q0, q1, q2, q3, and q4
     */
    function calculateQuantiles (data) {
        var count = data.length;
        if (count === 0) {
            return {
                q0: undefined,
                q1: undefined,
                q2: undefined,
                q3: undefined,
                q4: undefined
            };
        }
        if (count === 1) {
            return {
                q0: data[0],
                q1: data[0],
                q2: data[0],
                q3: data[0],
                q4: data[0]
            };
        }

        var q1 = null;
        var q2 = null;
        var q3 = null;

        var q2Index = Math.floor(count / 2);
        if (count % 2 === 1) {
            q2 = data[q2Index];
        } else {
            q2 = (data[q2Index - 1] + data[q2Index]) / 2;
        }

        // count % 4 < 2 has even halves; count / 4 and 3 * count / 4 coincide with the upper of the 2 middle indices when rounded
        // count % 4 >= 2 has odd halves; count / 4 and 3 * count / 4 coincide with the middle indices when floored
        var q1Index = count / 4.0;
        var q3Index = 3 * q1Index; // before rounding
        if (count % 4 < 2) {
            q1Index = Math.round(q1Index);
            q3Index = Math.round(q3Index);
            q1 = (data[q1Index - 1] + data[q1Index]) / 2;
            q3 = (data[q3Index - 1] + data[q3Index]) / 2;
        } else {
            q1Index = Math.floor(q1Index);
            q3Index = Math.floor(q3Index);
            q1 = data[q1Index];
            q3 = data[q3Index];
        }

        return {
            q0: data[0],
            q1: q1,
            q2: q2,
            q3: q3,
            q4: data[count - 1]
        };
    }

    // Replaces the default renderer with additional stats
    globalState.render(['previewClip'], current => {
        if (current.previewClip) {
            $('.details').classList.add('has-selection');
            $('#preview-title').innerHTML = current.previewClip.title || '';
            if (current.previewClip.meanPitch) {
                $('#preview-mean-pitch').innerHTML = Math.round(current.previewClip.meanPitch) + 'Hz';
                $('#preview-mean-resonance').innerHTML = Math.round(current.previewClip.meanResonance * 100) + '%';
                $('#preview-stdev-pitch').innerHTML = Math.round(current.previewClip.stdevPitch) + 'Hz';
                $('#preview-stdev-resonance').innerHTML = Math.round(current.previewClip.stdevResonance * 100) + '%';
                $('#preview-median-pitch').innerHTML = Math.round(current.previewClip.medianPitch) + 'Hz';
                $('#preview-median-resonance').innerHTML = Math.round(current.previewClip.medianResonance * 100) + '%';

                var pitchQuantilesCalculated = (
                    current.previewClip.minPitch &&
                    current.previewClip.q1Pitch &&
                    current.previewClip.q3Pitch &&
                    current.previewClip.maxPitch &&
                    current.previewClip.iqrPitch &&
                    current.previewClip.rangePitch
                );
                if (!pitchQuantilesCalculated) {
                    var fundamentalFrequencies = current.previewClip.phones
                        .map(phone => phone.F[0])
                        .filter(freq => freq !== null)
                        .sort((f1, f2) => (+f1) - (+f2));
                    var { q0, q1, _, q3, q4 } = calculateQuantiles(fundamentalFrequencies);
                    var iqr = q3 - q1;
                    var range = q4 - q0;
                    current.previewClip.minPitch = q0;
                    current.previewClip.q1Pitch = q1;
                    current.previewClip.q3Pitch = q3;
                    current.previewClip.maxPitch = q4;
                    current.previewClip.iqrPitch = iqr;
                    current.previewClip.rangePitch = range;
                }

                // add to DOM instead
                console.log(`Min: ${current.previewClip.minPitch}`);
                console.log(`Q1: ${current.previewClip.q1Pitch}`);
                console.log(`Q2: ${current.previewClip.medianPitch}`);
                console.log(`Q3: ${current.previewClip.q3Pitch}`);
                console.log(`Max: ${current.previewClip.maxPitch}`);
                console.log(`IQR: ${current.previewClip.iqrPitch}`);
                console.log(`Range: ${current.previewClip.rangePitch}`);
            }
            if (current.previewClip.transcript) {
                $('#preview-transcript').innerHTML = current.previewClip.transcript;
            }
        } else {
            $('.details').classList.remove('has-selection');
        }
    });

})();
