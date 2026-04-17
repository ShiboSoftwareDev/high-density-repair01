import { expect, test } from "bun:test"
import { runDrcCheck } from "../lib/drc-check"
import { repairSample } from "../lib/repair"
import type { HighDensityRepair01Input, NodeHdRoute } from "../lib/types/types"
import {
  HighDensityForceImproveSolver,
  runForceDirectedImprovement,
} from "lib/HighDensityForceImproveSolver"

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

const createWrongLayerAttachmentSample = (): HighDensityRepair01Input => ({
  adjacentObstacles: [],
  connMap: {
    idToNetMap: {},
    netMap: {},
  },
  nodeHdRoutes: [
    {
      capacityMeshNodeId: "repair-sample",
      connectionName: "conn01",
      rootConnectionName: "conn01",
      route: [
        { x: -2, y: 0, z: 0 },
        { x: 0, y: 0.5, z: 0 },
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
        connectionName: "conn01",
        portPointId: "pp0",
        rootConnectionName: "conn01",
        x: -2,
        y: 0,
        z: 1,
      },
      {
        connectionName: "conn01",
        portPointId: "pp1",
        rootConnectionName: "conn01",
        x: 2,
        y: 0,
        z: 1,
      },
    ],
    width: 4,
  },
})

const createCoincidentViaSample = (): HighDensityRepair01Input => ({
  adjacentObstacles: [],
  connMap: {
    idToNetMap: {},
    netMap: {},
  },
  nodeHdRoutes: [
    {
      capacityMeshNodeId: "repair-sample",
      connectionName: "conn02",
      rootConnectionName: "conn02",
      route: [{ x: 0, y: 0, z: 0 }],
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
        connectionName: "conn02",
        portPointId: "pp0",
        rootConnectionName: "conn02",
        x: 0,
        y: 0,
        z: 0,
      },
      {
        connectionName: "conn02",
        portPointId: "pp1",
        rootConnectionName: "conn02",
        x: 0,
        y: 0,
        z: 1,
      },
    ],
    width: 4,
  },
})

const createBorderOvershootSample = (): HighDensityRepair01Input => ({
  adjacentObstacles: [],
  connMap: {
    idToNetMap: {},
    netMap: {},
  },
  nodeHdRoutes: [
    {
      capacityMeshNodeId: "repair-sample",
      connectionName: "conn03",
      rootConnectionName: "conn03",
      route: [
        { x: 0, y: 2, z: 0 },
        { x: 0.4, y: 2.3, z: 0 },
        { x: 1, y: 1, z: 0 },
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
        connectionName: "conn03",
        portPointId: "pp0",
        rootConnectionName: "conn03",
        x: 0,
        y: 2,
        z: 0,
      },
      {
        connectionName: "conn03",
        portPointId: "pp1",
        rootConnectionName: "conn03",
        x: 1,
        y: 1,
        z: 0,
      },
    ],
    width: 4,
  },
})

const createViaRoute = (
  connectionName: string,
  y: number,
  viaDiameter: number,
): NodeHdRoute => ({
  capacityMeshNodeId: "repair-sample",
  connectionName,
  rootConnectionName: connectionName,
  route: [
    { x: -1, y, z: 0 },
    { x: 0, y, z: 0 },
    { x: 0, y, z: 1 },
    { x: 1, y, z: 1 },
  ],
  traceThickness: 0.1,
  viaDiameter,
  vias: [{ x: 0, y }],
})

const getViaDistance = (
  leftRoute: Pick<NodeHdRoute, "vias">,
  rightRoute: Pick<NodeHdRoute, "vias">,
) => {
  const leftVia = leftRoute.vias[0]
  const rightVia = rightRoute.vias[0]

  if (!leftVia || !rightVia) {
    throw new Error("Expected both test routes to have a via.")
  }

  return Math.hypot(leftVia.x - rightVia.x, leftVia.y - rightVia.y)
}

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

test("HighDensityForceImproveSolver returns improved routes as solver output", () => {
  const sample = createOutOfBoundsSample()
  const solver = new HighDensityForceImproveSolver({
    nodeWithPortPoints: [sample.nodeWithPortPoints],
    hdRoutes: sample.nodeHdRoutes,
    totalStepsPerNode: 40,
  })

  solver.solve()

  const output = solver.getOutput() as HighDensityRepair01Input["nodeHdRoutes"]

  expect(output).toBeDefined()
  expect(runDrcCheck(sample.nodeWithPortPoints, output).ok).toBe(true)
})

test("repairSample can normalize routes that attach on the wrong port layer", () => {
  const sample = createWrongLayerAttachmentSample()
  const originalDrc = runDrcCheck(
    sample.nodeWithPortPoints,
    sample.nodeHdRoutes,
  )

  expect(originalDrc.ok).toBe(false)

  const result = repairSample(sample, {
    forceImprovementPasses: 0,
    includeForceVectors: false,
  })

  expect(result.repaired).toBe(true)
  expect(result.selectedStage).toBe("normalized")
  expect(result.finalDrc.ok).toBe(true)
  expect(result.sample.nodeHdRoutes[0]?.route[0]?.z).toBe(1)
  expect(result.sample.nodeHdRoutes[0]?.route.at(-1)?.z).toBe(1)
  expect(result.sample.nodeHdRoutes[0]?.vias.length).toBeGreaterThan(0)
})

test("repairSample preserves coincident different-layer ports as a via route", () => {
  const sample = createCoincidentViaSample()

  const result = repairSample(sample, {
    forceImprovementPasses: 0,
    includeForceVectors: false,
  })

  expect(result.repaired).toBe(true)
  expect(result.selectedStage).toBe("normalized")
  expect(result.finalDrc.ok).toBe(true)
  expect(result.sample.nodeHdRoutes[0]?.route.length).toBeGreaterThanOrEqual(4)
  expect(result.sample.nodeHdRoutes[0]?.vias.length).toBe(1)
})

test("repairSample clamps endpoint-adjacent border overshoot back inside bounds", () => {
  const sample = createBorderOvershootSample()
  const originalDrc = runDrcCheck(
    sample.nodeWithPortPoints,
    sample.nodeHdRoutes,
  )

  expect(originalDrc.ok).toBe(false)

  const result = repairSample(sample, {
    forceImprovementPasses: 0,
    includeForceVectors: false,
  })

  expect(result.repaired).toBe(true)
  expect(result.selectedStage).toBe("normalized")
  expect(result.finalDrc.ok).toBe(true)
  expect(result.sample.nodeHdRoutes[0]?.route[1]?.y).toBeLessThanOrEqual(2)
})

test("runForceDirectedImprovement uses each route's real via diameter", () => {
  const viaDiameter = 0.8
  const result = runForceDirectedImprovement(
    { minX: -4, maxX: 4, minY: -4, maxY: 4 },
    [
      createViaRoute("conn04", 0, viaDiameter),
      createViaRoute("conn05", 0.2, viaDiameter),
    ],
    200,
    { clearance: 0, includeForceVectors: false },
  )

  expect(
    getViaDistance(result.routes[0]!, result.routes[1]!),
  ).toBeGreaterThanOrEqual(viaDiameter - 0.01)
})

test("runForceDirectedImprovement applies the passed clearance override", () => {
  const viaDiameter = 0.8
  const clearance = 0.4
  const result = runForceDirectedImprovement(
    { minX: -4, maxX: 4, minY: -4, maxY: 4 },
    [
      createViaRoute("conn06", 0, viaDiameter),
      createViaRoute("conn07", 0.2, viaDiameter),
    ],
    200,
    { clearance, includeForceVectors: false },
  )

  expect(
    getViaDistance(result.routes[0]!, result.routes[1]!),
  ).toBeGreaterThanOrEqual(viaDiameter + clearance - 0.01)
})
