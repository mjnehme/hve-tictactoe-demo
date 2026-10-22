import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const script = html.match(/const LINES = \[[\s\S]*?(?=\n    const byId)/)?.[0];
assert.ok(script, "The production rule source must remain discoverable");

const context = {};
vm.runInNewContext(
  `${script}\nglobalThis.game = {LINES, newGame, play};`,
  context
);
const {LINES, newGame, play} = context.game;

test("all eight winning lines are reachable by X and O", () => {
  const observed = new Set();

  function visit(state) {
    if (state.winner) {
      if (state.winner !== "draw") {
        observed.add(`${state.winner}:${state.line.join(",")}`);
      }
      return;
    }

    for (let index = 0; index < state.board.length; index += 1) {
      if (!state.board[index]) {
        visit(play(state, index));
      }
    }
  }

  visit(newGame());
  const expected = ["X", "O"].flatMap(player =>
    LINES.map(line => `${player}:${line.join(",")}`)
  );
  assert.deepEqual([...observed].sort(), expected.sort());
});

test("moves are immutable and occupied or terminal moves are no-ops", () => {
  const initial = newGame();
  const first = play(initial, 0);
  assert.notStrictEqual(first.board, initial.board);
  assert.deepEqual(Array.from(initial.board), Array(9).fill(null));
  assert.deepEqual(Array.from(first.board), ["X", null, null, null, null, null, null, null, null]);
  assert.strictEqual(play(first, 0), first);

  let won = first;
  for (const index of [3, 1, 4, 2]) {
    won = play(won, index);
  }
  assert.equal(won.winner, "X");
  assert.strictEqual(play(won, 8), won);
});

test("draws and turn alternation use the production implementation", () => {
  let state = newGame();
  const sequence = [0, 1, 2, 4, 3, 5, 7, 6, 8];
  const turns = [];
  for (const index of sequence) {
    turns.push(state.turn);
    state = play(state, index);
  }
  assert.deepEqual(turns, ["X", "O", "X", "O", "X", "O", "X", "O", "X"]);
  assert.equal(state.winner, "draw");
});
