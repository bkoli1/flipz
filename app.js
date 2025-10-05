/* global pokersolver */
// Simple, static MVP: deal two hands from a single deck, estimate equities, show a sample board.

const SUITS = ["s", "h", "d", "c"]; // spades, hearts, diamonds, clubs
const RANKS = ["A","K","Q","J","T","9","8","7","6","5","4","3","2"]; // Desc order for nicer look

const dealBtn = document.getElementById("dealBtn");
const handAEl = document.getElementById("handA");
const handBEl = document.getElementById("handB");
const boardEl = document.getElementById("board");
const oddsAEl = document.getElementById("oddsA");
const oddsBEl = document.getElementById("oddsB");
const itersLabel = document.getElementById("itersLabel");

// tweakable: more sims -> smoother odds but a bit slower
const MONTE_CARLO_ITERS = 2000;
itersLabel.textContent = MONTE_CARLO_ITERS.toLocaleString();

function buildDeck() {
  const deck = [];
  for (const r of RANKS) for (const s of SUITS) deck.push(r + s);
  return deck;
}

function shuffleInPlace(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function prettyCard(cs) {
  const suitChar = { s: "♠", h: "♥", d: "♦", c: "♣" }[cs[cs.length-1]];
  const rank = cs[0] === "T" ? "10" : cs[0];
  const red = (suitChar === "♥" || suitChar === "♦");
  const span = document.createElement("span");
  span.className = "badge";
  span.style.color = red ? "#f87171" : "#e5e7eb";
  span.innerHTML = `<span>${rank}</span><span class="suit">${suitChar}</span>`;
  return span;
}

function renderCards(container, cards) {
  container.innerHTML = "";
  cards.forEach(c => container.appendChild(prettyCard(c)));
}

function dealTwoHands() {
  const deck = shuffleInPlace(buildDeck());
  const handA = [deck.pop(), deck.pop()];
  const handB = [deck.pop(), deck.pop()];
  // (optional) preview one random runout for fun
  const previewBoard = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
  return { handA, handB, previewBoard };
}

function solve7(cards7) {
  // pokersolver expects like ["As", "Kd", "Qh", "Jc", "Th", "2d", "2c"]
  return pokersolver.Hand.solve(cards7);
}

function simulateEquity(holeA, holeB, iterations = MONTE_CARLO_ITERS) {
  let winsA = 0, winsB = 0, ties = 0;

  // Prebuild a base deck without the two hands
  const baseDeck = buildDeck().filter(c => !holeA.includes(c) && !holeB.includes(c));

  for (let i = 0; i < iterations; i++) {
    // draw 5 unique board cards
    const deck = shuffleInPlace(baseDeck.slice());
    const board = [deck[0], deck[1], deck[2], deck[3], deck[4]];

    const hand7A = holeA.concat(board);
    const hand7B = holeB.concat(board);

    const solvedA = solve7(hand7A);
    const solvedB = solve7(hand7B);

    const winners = pokersolver.Hand.winners([solvedA, solvedB]);
    if (winners.length === 2) {
      ties++;
    } else if (winners[0] === solvedA) {
      winsA++;
    } else {
      winsB++;
    }
  }

  const total = iterations;
  const eqA = (winsA + ties * 0.5) / total;
  const eqB = (winsB + ties * 0.5) / total;
  return { eqA, eqB };
}

function updateUI() {
  const { handA, handB, previewBoard } = dealTwoHands();
  renderCards(handAEl, handA);
  renderCards(handBEl, handB);
  renderCards(boardEl, previewBoard);

  // Compute odds (non-blocking: small delay so UI updates immediately)
  oddsAEl.textContent = "…";
  oddsBEl.textContent = "…";
  setTimeout(() => {
    const { eqA, eqB } = simulateEquity(handA, handB);
    oddsAEl.textContent = (eqA * 100).toFixed(1);
    oddsBEl.textContent = (eqB * 100).toFixed(1);
  }, 0);
}

dealBtn.addEventListener("click", updateUI);
document.addEventListener("DOMContentLoaded", updateUI);
