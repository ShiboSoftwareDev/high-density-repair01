import { GenericSolverDebugger } from "@tscircuit/solver-utils/react";
import { MySolver } from "lib/my-solver";

export default <GenericSolverDebugger createSolver={() => new MySolver()} />;
