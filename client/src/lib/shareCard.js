// Client-side share-card PNG — draws the result on a 1200×630 canvas
// (OG image dimensions) and returns a Blob. No server dependency; the
// server-side @vercel/og variant can replace this at deploy time.

const W = 1200;
const H = 630;

function roundWinner(round) {
  const a = round.score?.total?.a ?? 0;
  const b = round.score?.total?.b ?? 0;
  return a > b ? 'a' : b > a ? 'b' : null;
}

export async function renderShareCard(result) {
  const { fighters, rounds = [], finalHp, winnerId, ko, mode } = result;
  const a = fighters.a;
  const b = fighters.b;
  const colorA = a.color ?? '#D97757';
  const colorB = b.color ?? '#3B82F6';
  const winner = winnerId === a.id ? a : winnerId === b.id ? b : null;
  const winnerColor = winner ? (winner.id === a.id ? colorA : colorB) : '#e8e8f0';

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // arena blackout + corner glows
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, W, H);
  const glowA = ctx.createRadialGradient(120, H - 80, 0, 120, H - 80, 500);
  glowA.addColorStop(0, `${colorA}2A`);
  glowA.addColorStop(1, 'transparent');
  ctx.fillStyle = glowA;
  ctx.fillRect(0, 0, W, H);
  const glowB = ctx.createRadialGradient(W - 120, H - 80, 0, W - 120, H - 80, 500);
  glowB.addColorStop(0, `${colorB}2A`);
  glowB.addColorStop(1, 'transparent');
  ctx.fillStyle = glowB;
  ctx.fillRect(0, 0, W, H);

  // corner color bars
  ctx.fillStyle = colorA;
  ctx.fillRect(0, 0, W / 2, 10);
  ctx.fillStyle = colorB;
  ctx.fillRect(W / 2, 0, W / 2, 10);

  const display = (px) => `bold ${px}px "Bebas Neue", Impact, sans-serif`;
  ctx.textBaseline = 'alphabetic';

  // header
  ctx.font = display(30);
  ctx.fillStyle = 'rgba(232,232,240,0.45)';
  ctx.textAlign = 'center';
  ctx.fillText('⚔  AI BATTLE ARENA', W / 2, 68);

  // fighter names
  ctx.font = display(72);
  ctx.textAlign = 'left';
  ctx.fillStyle = colorA;
  ctx.fillText(a.name.toUpperCase().slice(0, 14), 70, 180);
  ctx.textAlign = 'right';
  ctx.fillStyle = colorB;
  ctx.fillText(b.name.toUpperCase().slice(0, 14), W - 70, 180);
  ctx.textAlign = 'center';
  ctx.font = display(44);
  ctx.fillStyle = '#EF4444';
  ctx.fillText('VS', W / 2, 172);

  // winner block
  if (winner) {
    ctx.font = display(34);
    ctx.fillStyle = '#FACC15';
    ctx.fillText(ko ? '★  KNOCKOUT  ★' : '★  WINNER  ★', W / 2, 300);
    ctx.font = display(120);
    ctx.fillStyle = winnerColor;
    ctx.shadowColor = winnerColor;
    ctx.shadowBlur = 60;
    ctx.fillText(winner.name.toUpperCase().slice(0, 14), W / 2, 420);
    ctx.shadowBlur = 0;
    ctx.font = display(30);
    ctx.fillStyle = 'rgba(232,232,240,0.55)';
    ctx.fillText(ko ? 'WINS BY K.O.' : 'WINS ON POINTS', W / 2, 468);
  } else {
    ctx.font = display(120);
    ctx.fillStyle = 'rgba(232,232,240,0.7)';
    ctx.fillText('DRAW', W / 2, 400);
  }

  // round-by-round strip
  const stripY = 520;
  const stripW = Math.min(760, W - 200);
  const cellW = stripW / Math.max(rounds.length, 1);
  const startX = (W - stripW) / 2;
  rounds.forEach((r, i) => {
    const w = roundWinner(r);
    ctx.fillStyle = w === 'a' ? colorA : w === 'b' ? colorB : '#2e2e40';
    ctx.fillRect(startX + i * cellW + 4, stripY, cellW - 8, 34);
    ctx.font = display(20);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillText(`R${r.round}`, startX + i * cellW + cellW / 2, stripY + 25);
  });

  // footer
  ctx.font = display(22);
  ctx.fillStyle = 'rgba(232,232,240,0.35)';
  ctx.fillText(
    `${rounds.length} ROUNDS · ${(mode ?? 'ROAST').toUpperCase()} · FINAL HP ${finalHp?.a ?? 0} — ${finalHp?.b ?? 0}`,
    W / 2,
    600,
  );

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export async function downloadShareCard(result) {
  const blob = await renderShareCard(result);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const aName = result.fighters?.a?.name ?? 'a';
  const bName = result.fighters?.b?.name ?? 'b';
  link.download = `battle-${aName}-vs-${bName}.png`.toLowerCase().replace(/\s+/g, '-');
  link.click();
  URL.revokeObjectURL(url);
}
