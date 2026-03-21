import { expect, test } from "bun:test";
import { MySolver } from "lib/my-solver";

test("exports the starter solver", () => {
	expect(typeof MySolver).toBe("function");
});
