// ==UserScript==
// @name         Acoustic Stats
// @namespace    http://tampermonkey.net/
// @version      2024-03-21
// @description  Adds min, max, range and IQR stats
// @author       You
// @match        https://acousticgender.space/
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    console.log('Test Acoustic Stats');
    console.log(globalState.state.clips.value.length);
    console.log('Done');

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
                var minPitch = baseFrequencies[0];
                var maxPitch = baseFrequencies[baseFrequencies.length - 1];
                var rangePitch = maxPitch - minPitch;

                console.log(`Min: ${minPitch}`);
                console.log(`Max: ${maxPitch}`);
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
