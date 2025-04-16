// src/engine/GraphEngine.ts

export type NodeId = 'SA' | 'AV' | 'V';

export interface Node {
  id: NodeId;
  bpm: number;
  refractoryMs: number;
  lastFireMs: number;
  autoFire: boolean;
}

export interface ConductionPath {
  from: NodeId;
  to: NodeId;
  delayMs: number;
  blocked?: boolean;
}

export class GraphEngine {
  private nodes: Record<NodeId, Node>;
  private matrix: Record<NodeId, Record<NodeId, number>>;
  private nowMs: number = 0;
  private scheduledFires: { target: NodeId; fireAt: number }[] = [];

  constructor(nodes: Node[], paths: ConductionPath[]) {
    this.nodes = nodes.reduce((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {} as Record<NodeId, Node>);

    this.matrix = {} as Record<NodeId, Record<NodeId, number>>;
    for (const from of Object.keys(this.nodes) as NodeId[]) {
      const nodeIds: NodeId[] = ['SA', 'AV', 'V'];
      this.matrix[from] = Object.fromEntries(nodeIds.map(id => [id, 0])) as Record<NodeId, number>;}
    for (const path of paths) {
      if (!path.blocked) {
        this.matrix[path.from][path.to] = path.delayMs;
      }
    }
  }

  tick(now: number): NodeId[] {
    this.nowMs = now;
    const firedNodes: NodeId[] = [];

    for (const node of Object.values(this.nodes)) {
      if (!node.autoFire) continue;
      const interval = 60000 / node.bpm;
      if (now - node.lastFireMs >= interval) {
        node.lastFireMs = now;
        firedNodes.push(node.id);
        this.scheduleConduction(node.id, now);
      }
    }

    const remaining: typeof this.scheduledFires = [];
    for (const sched of this.scheduledFires) {
      if (sched.fireAt <= now) {
        const target = this.nodes[sched.target];
        if (now - target.lastFireMs >= target.refractoryMs) {
          target.lastFireMs = now;
          firedNodes.push(target.id);
          this.scheduleConduction(target.id, now);
        }
      } else {
        remaining.push(sched);
      }
    }
    this.scheduledFires = remaining;

    return firedNodes;
  }

  private scheduleConduction(from: NodeId, now: number) {
    const targets = this.matrix[from];
    for (const to in targets) {
      const delay = targets[to as NodeId];
      this.scheduledFires.push({
        target: to as NodeId,
        fireAt: now + delay,
      });
    }
  }

  
  static createDefaultEngine(): GraphEngine {
    const nodes: Node[] = [
      { id: 'SA', bpm: 80, refractoryMs: 300, lastFireMs: -1000, autoFire: true },
      { id: 'AV', bpm: 40, refractoryMs: 400, lastFireMs: -1000, autoFire: true },
      { id: 'V', bpm: 30, refractoryMs: 500, lastFireMs: -1000, autoFire: true },
    ];

    const paths: ConductionPath[] = [
      { from: 'SA', to: 'AV', delayMs: 100 },
      { from: 'AV', to: 'V', delayMs: 120 },
    ];

    return new GraphEngine(nodes, paths);
  }
  
  public getLastFireTime(nodeId: NodeId): number {
    return this.nodes[nodeId]?.lastFireMs ?? -1;
  }
}
