import { BaseSolver } from "@tscircuit/solver-utils";
import type { GraphicsObject } from "graphics-debug";

export class MySolver extends BaseSolver {
	_step() {
		this.solved = true;
	}

	visualize(): GraphicsObject {
		return {} as GraphicsObject;
	}
}
