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
     * @returns object containing number|undefined for q1, q2, and q3
     */
    function calculateQuantiles (data) {
        var count = data.length;
        if (count === 0) {
            return {
                q1: undefined,
                q2: undefined,
                q3: undefined
            };
        }
        if (count === 1) {
            return {
                q1: data[0],
                q2: data[0],
                q3: data[0]
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
            q1: q1,
            q2: q2,
            q3: q3,
        };
    }

    var pitchRow = $('#preview-mean-pitch').parentNode;
    var resonanceRow = $('#preview-mean-resonance').parentNode;
    var weightRow = document.createElement('tr');
    var tbody = pitchRow.parentNode;
    var headerRow = tbody.firstChild;

    var minHeader = document.createElement('th');
    var maxHeader = document.createElement('th');
    var rangeHeader = document.createElement('th');
    var iqrHeader = document.createElement('th');

    var minPitch = document.createElement('td');
    var maxPitch = document.createElement('td');
    var rangePitch = document.createElement('td');
    var iqrPitch = document.createElement('td');

    var minResonance = document.createElement('td');
    var maxResonance = document.createElement('td');
    var rangeResonance = document.createElement('td');
    var iqrResonance = document.createElement('td');

    var weightHeader = document.createElement('th');
    var meanWeight = document.createElement('td');
    var medianWeight = document.createElement('td');
    var stdevWeight = document.createElement('td');
    var minWeight = document.createElement('td');
    var maxWeight = document.createElement('td');
    var rangeWeight = document.createElement('td');
    var iqrWeight = document.createElement('td');

    minHeader.innerHTML = 'Min.';
    maxHeader.innerHTML = 'Max.';
    rangeHeader.innerHTML = 'Range';
    iqrHeader.innerHTML = 'IQR';

    minPitch.innerHTML = '-';
    maxPitch.innerHTML = '-';
    rangePitch.innerHTML = '-';
    iqrPitch.innerHTML = '-';

    minResonance.innerHTML = '-';
    maxResonance.innerHTML = '-';
    rangeResonance.innerHTML = '-';
    iqrResonance.innerHTML = '-';

    weightHeader.innerHTML = 'Weight';
    meanWeight.innerHTML = '-';
    medianWeight.innerHTML = '-';
    stdevWeight.innerHTML = '-';
    minWeight.innerHTML = '-';
    maxWeight.innerHTML = '-';
    rangeWeight.innerHTML = '-';
    iqrWeight.innerHTML = '-';

    headerRow.appendChild(minHeader);
    headerRow.appendChild(maxHeader);
    headerRow.appendChild(rangeHeader);
    headerRow.appendChild(iqrHeader);

    pitchRow.appendChild(minPitch);
    pitchRow.appendChild(maxPitch);
    pitchRow.appendChild(rangePitch);
    pitchRow.appendChild(iqrPitch);

    resonanceRow.appendChild(minResonance);
    resonanceRow.appendChild(maxResonance);
    resonanceRow.appendChild(rangeResonance);
    resonanceRow.appendChild(iqrResonance);

    weightRow.appendChild(weightHeader);
    weightRow.appendChild(meanWeight);
    weightRow.appendChild(medianWeight);
    weightRow.appendChild(stdevWeight);
    weightRow.appendChild(minWeight);
    weightRow.appendChild(maxWeight);
    weightRow.appendChild(rangeWeight);
    weightRow.appendChild(iqrWeight);

    // TODO: Calculate weight using spectral tilt
    // tbody.appendChild(weightRow);

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
                    var count = fundamentalFrequencies.length;
                    var { q1, _, q3 } = calculateQuantiles(fundamentalFrequencies);
                    var iqr = q3 - q1;
                    var min = fundamentalFrequencies[0];
                    var max = fundamentalFrequencies[count - 1];
                    var range = max - min;
                    current.previewClip.minPitch = min;
                    current.previewClip.maxPitch = max;
                    current.previewClip.iqrPitch = iqr;
                    current.previewClip.rangePitch = range;
                }

                minPitch.innerHTML = Math.round(current.previewClip.minPitch) + 'Hz';
                maxPitch.innerHTML = Math.round(current.previewClip.maxPitch) + 'Hz';
                rangePitch.innerHTML = Math.round(current.previewClip.rangePitch) + 'Hz';
                iqrPitch.innerHTML = Math.round(current.previewClip.iqrPitch) + 'Hz';
            }
            if (current.previewClip.transcript) {
                $('#preview-transcript').innerHTML = current.previewClip.transcript;
            }
        } else {
            $('.details').classList.remove('has-selection');
        }
    });

})();
