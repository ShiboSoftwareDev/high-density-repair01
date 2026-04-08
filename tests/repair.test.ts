import { expect, test } from "bun:test"
import { runDrcCheck } from "../lib/drc-check"
import { HighDensityRepair01 } from "../lib/HighDensityRepair01"
import { repairSample } from "../lib/repair"
import type { HighDensityRepair01Input } from "../lib/types"

const createOutOfBoundsSample = (): HighDensityRepair01Input => ({
  adjacentObstacles: [],
  connMap: {
    idToNetMap: {},
    netMap: {},
  },
  nodeHdRoutes: [
    {
      capacityMeshNodeId: "repair-sample",
      connectionName: "conn00",
      rootConnectionName: "conn00",
      route: [
        { x: -2, y: 0, z: 0 },
        { x: 0, y: 2.2, z: 0 },
        { x: 2, y: 0, z: 0 },
      ],
      traceThickness: 0.1,
      viaDiameter: 0.3,
      vias: [],
    },
  ],
  nodeWithPortPoints: {
    availableZ: [0, 1],
    capacityMeshNodeId: "repair-sample",
    center: { x: 0, y: 0 },
    height: 4,
    portPoints: [
      {
        connectionName: "conn00",
        portPointId: "pp0",
        rootConnectionName: "conn00",
        x: -2,
        y: 0,
        z: 0,
      },
      {
        connectionName: "conn00",
        portPointId: "pp1",
        rootConnectionName: "conn00",
        x: 2,
        y: 0,
        z: 0,
      },
    ],
    width: 4,
  },
})

test("repairSample can turn a simple out-of-bounds route into a DRC-clean route", () => {
  const sample = createOutOfBoundsSample()
  const originalDrc = runDrcCheck(
    sample.nodeWithPortPoints,
    sample.nodeHdRoutes,
  )

  expect(originalDrc.ok).toBe(false)

  const result = repairSample(sample, {
    forceImprovementPasses: 40,
    includeForceVectors: false,
  })

  expect(result.repaired).toBe(true)
  expect(result.finalDrc.ok).toBe(true)
  expect(result.issueCountDelta).toBeGreaterThan(0)
})

test("HighDensityRepair01 returns the repaired sample as solver output", () => {
  const solver = new HighDensityRepair01(createOutOfBoundsSample(), {
    forceImprovementPasses: 40,
    includeForceVectors: false,
  })

  solver.solve()

  const output = solver.getOutput()
  const repairResult = solver.getRepairResult()

  expect(repairResult?.repaired).toBe(true)
  expect(output).toBeDefined()
  expect(runDrcCheck(output.nodeWithPortPoints, output.nodeHdRoutes).ok).toBe(
    true,
  )
})
