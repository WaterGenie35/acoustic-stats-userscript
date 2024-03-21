// ==UserScript==
// @name         Acoustic Stats
// @namespace    http://tampermonkey.net/
// @version      2024-03-21
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

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

                // save to previewClip instead, and check if already calculated
                var baseFrequencies = current.previewClip.phones
                    .map(phone => phone.F[0])
                    .filter(freq => freq !== null)
                    .sort((f1, f2) => (+f1) - (+f2));
                var count = baseFrequencies.length;

                var q0Pitch = baseFrequencies[0];

                var q1Pitch = 0;
                var q3Pitch = 0;

                // count % 4 < 2 has even halves, count / 4 and 3 * count / 4 coincide with the upper of the 2 middle indices when rounded
                // count % 4 >= 2 has odd halves, count / 4 and 3 * count / 4 coincide with the middle indices when floored
                var q1Index = count / 4.0;
                var q3Index = 3 * q1Index;
                if (count % 4 < 2) {
                    q1Index = Math.round(q1Index);
                    q3Index = Math.round(q3Index);
                    q1Pitch = (baseFrequencies[q1Index - 1] + baseFrequencies[q1Index]) / 2;
                    q3Pitch = (baseFrequencies[q3Index - 1] + baseFrequencies[q3Index]) / 2;
                } else {
                    q1Index = Math.floor(q1Index);
                    q3Index = Math.floor(q3Index);
                    q1Pitch = baseFrequencies[q1Index];
                    q3Pitch = baseFrequencies[q3Index];
                }

                var q4Pitch = baseFrequencies[count - 1];
                var iqrPitch = q3Pitch - q1Pitch;
                var rangePitch = q4Pitch - q0Pitch;

                console.log(`Min: ${q0Pitch}`);
                console.log(`Q1: ${q1Pitch}`);
                console.log(`Q2: ${current.previewClip.medianPitch}`);
                console.log(`Q3: ${q3Pitch}`);
                console.log(`Max: ${q4Pitch}`);
                console.log(`IQR: ${iqrPitch}`);
                console.log(`Range: ${rangePitch}`);
            }
            if (current.previewClip.transcript) {
                $('#preview-transcript').innerHTML = current.previewClip.transcript;
            }
        } else {
            $('.details').classList.remove('has-selection');
        }
    })

})();
