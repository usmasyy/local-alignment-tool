// Create empty matrix function - add this at the top
function makeMatrix(sizex, sizey) {
    return Array(sizex).fill().map(() => Array(sizey).fill(0));
}

// Score parameters class
class ScoreParam {
    constructor(match = 2, mismatch = -1, gap = -2) {
        this.match = match;
        this.mismatch = mismatch;
        this.gap = gap;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Add input validation
    function validateInputs() {
        const seq1 = document.getElementById('seq1').value.trim();
        const seq2 = document.getElementById('seq2').value.trim();
        const matchScore = document.getElementById('matchScore').value;
        const mismatchScore = document.getElementById('mismatchScore').value;
        const gapScore = document.getElementById('gapScore').value;

        if (!seq1 || !seq2) {
            alert("Please enter both sequences");
            return false;
        }

        if (!matchScore || !mismatchScore || !gapScore) {
            alert("Please enter all scoring parameters");
            return false;
        }

        return true;
    }

    function localAlign(seq1, seq2, score = new ScoreParam()) {
        const n = seq1.length + 1;
        const m = seq2.length + 1;
        const scoreMatrix = makeMatrix(n, m);
        const pointerMatrix = makeMatrix(n, m);
        let bestScore = 0;
        let bestLocation = [0, 0];

        for (let i = 1; i < n; i++) {
            for (let j = 1; j < m; j++) {
                const matchScore = scoreMatrix[i-1][j-1] + 
                    (seq1[i-1] === seq2[j-1] ? score.match : score.mismatch);
                const deleteScore = scoreMatrix[i-1][j] + score.gap;
                const insertScore = scoreMatrix[i][j-1] + score.gap;

                const scores = [0, matchScore, deleteScore, insertScore];
                const maxScore = Math.max(...scores);
                scoreMatrix[i][j] = maxScore;
                pointerMatrix[i][j] = scores.indexOf(maxScore);

                if (maxScore > bestScore) {
                    bestScore = maxScore;
                    bestLocation = [i, j];
                }
            }
        }
        return { bestScore, bestLocation, scoreMatrix, pointerMatrix };
    }

    function traceback(seq1, seq2, scoreMatrix, pointerMatrix, bestLocation) {
        const alignedSeq1 = [];
        const alignedSeq2 = [];
        let [i, j] = bestLocation;

        while (i > 0 && j > 0 && scoreMatrix[i][j] !== 0) {
            switch (pointerMatrix[i][j]) {
                case 1:
                    alignedSeq1.push(seq1[i-1]);
                    alignedSeq2.push(seq2[j-1]);
                    i--; j--;
                    break;
                case 2:
                    alignedSeq1.push(seq1[i-1]);
                    alignedSeq2.push('-');
                    i--;
                    break;
                case 3:
                    alignedSeq1.push('-');
                    alignedSeq2.push(seq2[j-1]);
                    j--;
                    break;
                default:
                    return [alignedSeq1.reverse().join(''), alignedSeq2.reverse().join('')];
            }
        }
        return [alignedSeq1.reverse().join(''), alignedSeq2.reverse().join('')];
    }

    function formatMatrix(matrix, seq1, seq2) {
        let result = '    -' + seq2.split('').map(char => ` ${char}`).join('') + '\n';
        result += '   ' + [...Array(matrix[0].length)].map((_, i) => ` ${i}`).join('') + '\n';

        for (let i = 0; i < matrix.length; i++) {
            const rowLabel = i === 0 ? "-" : seq1[i-1];
            result += `${rowLabel} ${i}${matrix[i].map(score => ` ${score}`).join('')}\n`;
        }
        return result;
    }

    function formatTracebackMatrix(matrix, seq1, seq2, scoreMatrix, bestLocation) {
        let result = '    -' + seq2.split('').map(char => ` ${char}`).join('') + '\n';
        result += '   ' + [...Array(matrix[0].length)].map((_, i) => ` ${i}`).join('') + '\n';

        const pathMatrix = makeMatrix(matrix.length, matrix[0].length);
        let [i, j] = bestLocation;
        
        while (i > 0 && j > 0 && scoreMatrix[i][j] !== 0) {
            pathMatrix[i][j] = matrix[i][j];
            switch (matrix[i][j]) {
                case 1: i--; j--; break;
                case 2: i--; break;
                case 3: j--; break;
                default: i = 0; j = 0;
            }
        }

        for (let i = 0; i < matrix.length; i++) {
            const rowLabel = i === 0 ? "-" : seq1[i-1];
            result += `${rowLabel} ${i}${matrix[i].map((pointer, j) => {
                if (pathMatrix[i][j]) {
                    switch(pointer) {
                        case 1: return ' ↖';
                        case 2: return ' ↑';
                        case 3: return ' ←';
                        default: return ' ·';
                    }
                }
                return '  ';
            }).join('')}\n`;
        }
        return result;
    }

    window.performAlignment = function() {
        if (!validateInputs()) return;

        try {
            const seq1 = document.getElementById('seq1').value.toUpperCase();
            const seq2 = document.getElementById('seq2').value.toUpperCase();
            
            const matchScore = parseInt(document.getElementById('matchScore').value);
            const mismatchScore = parseInt(document.getElementById('mismatchScore').value);
            const gapScore = parseInt(document.getElementById('gapScore').value);

            const scoreParams = new ScoreParam(matchScore, mismatchScore, gapScore);
            const { bestScore, bestLocation, scoreMatrix, pointerMatrix } = localAlign(seq1, seq2, scoreParams);
            const [aligned1, aligned2] = traceback(seq1, seq2, scoreMatrix, pointerMatrix, bestLocation);

            document.getElementById('scoreMatrix').textContent = formatMatrix(scoreMatrix, seq1, seq2);
            document.getElementById('tracebackMatrix').textContent = 
                formatTracebackMatrix(pointerMatrix, seq1, seq2, scoreMatrix, bestLocation);
            document.getElementById('alignment').innerHTML = 
                `Sequence 1: ${aligned1}<br>Sequence 2: ${aligned2}`;
            document.getElementById('alignmentScore').textContent = `Score: ${bestScore}`;
        } catch (error) {
            alert("An error occurred during alignment. Please check your inputs.");
            console.error(error);
        }
    };

    // Initialize default values
    document.getElementById('matchScore').value = 2;
    document.getElementById('mismatchScore').value = -1;
    document.getElementById('gapScore').value = -2;
});
