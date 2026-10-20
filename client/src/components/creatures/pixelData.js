// Original, fictional pixel characters. Provider inspiration is identity only;
// their colors, personas, and game abilities are not model performance claims.
const WIDTH = 18;
const HEIGHT = 20;

function make(name, persona, pal, draw) {
  const grid = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill('_'));
  const put = (x, y, color) => {
    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) grid[y][x] = color;
  };
  const rect = (left, top, right, bottom, color) => {
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) put(x, y, color);
  };
  const ellipse = (cx, cy, rx, ry, color) => {
    for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
      if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) put(x, y, color);
    }
  };
  const polygon = (points, color) => {
    for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i];
        const [xj, yj] = points[j];
        if ((yi > y + 0.5) !== (yj > y + 0.5)
          && x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) put(x, y, color);
    }
  };
  draw({ rect, ellipse, polygon });
  return { name, persona, color: pal.A, pal, px: grid.map((row) => row.join('')) };
}

export const CREATURES = {
  emberquill: make('Emberquill', 'A patient keeper of glowing notes.',
    { A: '#db7958', B: '#854632', C: '#ffd0a3', D: '#24151b', E: '#ffe58c' },
    ({ rect: R, ellipse: E, polygon: P }) => {
      P([[3, 7], [2, 1], [7, 5], [11, 5], [16, 1], [15, 7]], 'B');
      E(9, 9, 7, 6, 'B'); E(9, 9, 6, 5, 'A');
      P([[4, 12], [1, 18], [7, 16], [9, 19], [11, 16], [17, 18], [14, 12]], 'B');
      P([[5, 12], [3, 17], [8, 15], [9, 18], [10, 15], [15, 17], [13, 12]], 'A');
      E(6, 8, 2, 2, 'C'); E(12, 8, 2, 2, 'C');
      R(6, 8, 6, 9, 'D'); R(12, 8, 12, 9, 'D');
      P([[8, 10], [10, 10], [9, 13]], 'E');
      R(5, 18, 6, 19, 'E'); R(12, 18, 13, 19, 'E');
    }),
  kitewhisk: make('Kitewhisk', 'A nimble scout with a sail-like tail.',
    { A: '#38baa0', B: '#176d67', C: '#b9ffe2', D: '#092c32', E: '#f8d47b' },
    ({ rect: R, ellipse: E, polygon: P }) => {
      P([[3, 7], [2, 0], [7, 5], [11, 5], [16, 0], [15, 8]], 'B');
      P([[4, 7], [4, 2], [7, 6], [11, 6], [14, 2], [14, 8]], 'A');
      E(9, 9, 6, 5, 'B'); E(9, 9, 5, 4, 'A');
      P([[5, 12], [3, 17], [9, 16], [13, 18], [14, 13]], 'B');
      P([[6, 12], [5, 16], [9, 15], [12, 17], [13, 12]], 'A');
      P([[13, 14], [18, 11], [17, 18], [13, 17]], 'E');
      E(6, 9, 1, 1, 'C'); E(12, 9, 1, 1, 'C');
      R(6, 9, 6, 9, 'D'); R(12, 9, 12, 9, 'D');
      P([[8, 11], [10, 11], [9, 12]], 'D');
      R(5, 17, 6, 19, 'B'); R(11, 17, 12, 19, 'B');
    }),
  duplet: make('Duplet', 'Two curious heads sharing one winding body.',
    { A: '#6599f5', B: '#3156a4', C: '#d1e5ff', D: '#17244f', E: '#a9f0ee' },
    ({ rect: R, ellipse: E, polygon: P }) => {
      E(4, 5, 4, 4, 'B'); E(14, 5, 4, 4, 'B');
      E(4, 5, 3, 3, 'A'); E(14, 5, 3, 3, 'A');
      R(3, 5, 4, 5, 'C'); R(13, 5, 14, 5, 'C');
      R(4, 5, 4, 5, 'D'); R(14, 5, 14, 5, 'D');
      P([[5, 8], [8, 9], [9, 12], [10, 9], [13, 8], [15, 11], [12, 14], [15, 17], [12, 20], [8, 18], [4, 19], [2, 16]], 'B');
      P([[6, 9], [8, 10], [9, 14], [11, 10], [13, 9], [14, 11], [10, 15], [13, 17], [11, 19], [8, 17], [4, 18], [3, 16]], 'A');
      R(8, 13, 10, 13, 'E'); R(7, 16, 9, 16, 'C');
    }),
  crosswake: make('Crosswake', 'A many-armed ferryman of crossroads.',
    { A: '#e86b85', B: '#8c3158', C: '#ffd0da', D: '#341c39', E: '#ffb66e' },
    ({ rect: R, ellipse: E, polygon: P }) => {
      E(9, 7, 6, 6, 'B'); E(9, 7, 5, 5, 'A');
      P([[4, 10], [1, 10], [0, 17], [3, 15], [6, 13]], 'B');
      P([[14, 10], [17, 10], [18, 17], [15, 15], [12, 13]], 'B');
      P([[6, 11], [3, 14], [4, 20], [7, 17], [8, 12]], 'A');
      P([[12, 11], [15, 14], [14, 20], [11, 17], [10, 12]], 'A');
      P([[8, 12], [6, 18], [8, 20], [9, 16], [10, 20], [12, 18], [10, 12]], 'B');
      E(6, 7, 2, 2, 'C'); E(12, 7, 2, 2, 'C');
      R(6, 7, 6, 8, 'D'); R(12, 7, 12, 8, 'D'); R(8, 11, 10, 11, 'E');
    }),
  zipcat: make('Zipcat', 'A low-slung sprinter who never sits still.',
    { A: '#f99348', B: '#a84b32', C: '#ffe1a0', D: '#352128', E: '#fff0cc' },
    ({ rect: R, ellipse: E, polygon: P }) => {
      P([[10, 5], [13, 2], [15, 4], [17, 3], [17, 10], [12, 11]], 'B');
      P([[11, 5], [13, 4], [15, 5], [16, 5], [16, 9], [12, 10]], 'A');
      E(8, 11, 7, 4, 'B'); E(8, 10, 6, 3, 'A');
      P([[3, 11], [0, 7], [0, 10], [3, 14]], 'B');
      R(3, 13, 4, 18, 'B'); R(8, 13, 9, 17, 'B');
      R(12, 12, 13, 18, 'B'); R(15, 10, 16, 17, 'B');
      R(2, 18, 5, 19, 'C'); R(8, 17, 10, 18, 'C');
      R(12, 18, 14, 19, 'C'); R(15, 17, 17, 18, 'C');
      R(14, 7, 14, 7, 'D'); R(16, 9, 17, 9, 'E');
      R(5, 9, 5, 10, 'D'); R(9, 11, 9, 12, 'D');
    }),
  rampart: make('Rampart', 'A stubborn guardian with a fortress brow.',
    { A: '#a5a7bd', B: '#5c617b', C: '#e9e7ec', D: '#282b3d', E: '#f1a970' },
    ({ rect: R, ellipse: E, polygon: P }) => {
      P([[4, 6], [0, 1], [1, 8], [5, 9]], 'C');
      P([[14, 6], [18, 1], [17, 8], [13, 9]], 'C');
      E(9, 9, 7, 6, 'B'); E(9, 9, 6, 5, 'A');
      R(3, 8, 15, 9, 'D');
      R(5, 10, 6, 10, 'C'); R(12, 10, 13, 10, 'C');
      R(6, 10, 6, 10, 'D'); R(12, 10, 12, 10, 'D');
      E(9, 13, 4, 3, 'C'); R(7, 13, 7, 13, 'E'); R(11, 13, 11, 13, 'E');
      R(3, 14, 5, 19, 'B'); R(12, 14, 14, 19, 'B');
      R(4, 18, 6, 19, 'D'); R(12, 18, 14, 19, 'D');
    }),
  latticewing: make('Latticewing', 'A cheerful builder with broad patterned wings.',
    { A: '#f3ba45', B: '#98612f', C: '#fff0af', D: '#332c31', E: '#9ce8d2' },
    ({ rect: R, ellipse: E, polygon: P }) => {
      P([[8, 6], [3, 1], [1, 3], [2, 10], [7, 10]], 'E');
      P([[10, 6], [15, 1], [17, 3], [16, 10], [11, 10]], 'E');
      R(4, 5, 6, 6, 'C'); R(12, 5, 14, 6, 'C');
      E(9, 11, 5, 8, 'B'); E(9, 10, 4, 7, 'A');
      R(5, 9, 13, 10, 'D'); R(5, 13, 13, 14, 'D');
      E(7, 6, 1, 1, 'C'); E(11, 6, 1, 1, 'C');
      R(7, 6, 7, 6, 'D'); R(11, 6, 11, 6, 'D');
      P([[7, 18], [9, 20], [11, 18]], 'E');
      R(5, 16, 6, 17, 'B'); R(12, 16, 13, 17, 'B');
    }),
  mossback: make('Mossback', 'A quiet wanderer carrying a tiny garden.',
    { A: '#b589df', B: '#6c5296', C: '#e9d4ff', D: '#30233e', E: '#8ee1a0' },
    ({ rect: R, ellipse: E, polygon: P }) => {
      R(4, 2, 5, 9, 'B'); R(10, 1, 11, 9, 'B');
      R(4, 3, 5, 7, 'C'); R(10, 2, 11, 7, 'C');
      E(8, 9, 6, 5, 'B'); E(8, 9, 5, 4, 'A');
      P([[4, 12], [2, 16], [4, 18], [12, 18], [15, 14], [12, 11]], 'B');
      P([[5, 12], [4, 16], [5, 17], [12, 17], [14, 14], [11, 12]], 'A');
      P([[5, 12], [8, 10], [12, 12], [11, 14], [6, 14]], 'E');
      R(5, 8, 5, 8, 'D'); R(11, 8, 11, 8, 'D'); R(7, 11, 9, 11, 'C');
      R(4, 17, 5, 19, 'B'); R(11, 17, 12, 19, 'B');
    }),
  patchbyte: make('Patchbyte', 'An inventive tinkerer assembled from spare parts.',
    { A: '#b78af4', B: '#674b9d', C: '#ebd8ff', D: '#281f41', E: '#77e7dd' },
    ({ rect: R, polygon: P }) => {
      R(8, 0, 9, 3, 'B'); R(7, 0, 10, 1, 'E');
      R(3, 4, 14, 12, 'B'); R(4, 5, 13, 11, 'A');
      R(1, 7, 3, 10, 'B'); R(14, 6, 16, 9, 'B');
      R(5, 7, 7, 8, 'D'); R(10, 7, 12, 8, 'D');
      R(6, 7, 6, 7, 'E'); R(11, 7, 11, 7, 'E'); R(7, 10, 10, 10, 'C');
      P([[5, 12], [13, 12], [15, 17], [12, 19], [4, 19], [3, 16]], 'B');
      P([[6, 13], [12, 13], [13, 17], [11, 18], [5, 18], [4, 16]], 'A');
      R(7, 14, 10, 16, 'E'); R(8, 15, 9, 15, 'D');
      R(2, 13, 4, 15, 'B'); R(14, 13, 16, 16, 'B');
      R(5, 18, 6, 19, 'D'); R(11, 18, 12, 19, 'D');
    }),
};

export const PROVIDER_CREATURE = {
  anthropic: 'emberquill', openai: 'kitewhisk', google: 'duplet',
  openrouter: 'crosswake', groq: 'zipcat', xai: 'rampart',
  together: 'latticewing', ollama: 'mossback', custom: 'patchbyte',
};

export const FIGHTER_CREATURE = {
  claude: 'emberquill', gpt: 'kitewhisk', gemini: 'duplet',
  openrouter: 'crosswake', groq: 'zipcat', xai: 'rampart',
  together: 'latticewing', ollama: 'mossback', custom: 'patchbyte',
};

export const HERO_CREATURE = { owl: 'emberquill', fox: 'kitewhisk', serpent: 'duplet' };

export function getCreature(id) {
  return CREATURES[HERO_CREATURE[id] || PROVIDER_CREATURE[id] || FIGHTER_CREATURE[id] || 'patchbyte'];
}
