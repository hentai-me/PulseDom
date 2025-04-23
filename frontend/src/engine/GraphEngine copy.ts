// src/engine/GraphEngine.ts
import { SimOptions } from '../types/SimOptions';

export type NodeId = 'SA' | 'A' | 'AV' | 'V';

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
  private debug = false; // デバッグ用フラグ
  private nodes: Record<NodeId, Node>;
  private matrix: Record<NodeId, Record<NodeId, number | undefined>>;
  private nowMs: number = 0;
  private scheduledFires: { target: NodeId; fireAt: number }[] = [];

  constructor(nodes: Node[], paths: ConductionPath[]) {
    this.nodes = nodes.reduce((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {} as Record<NodeId, Node>);

    // 初期化：空のオブジェクトにして、明示的な接続だけ設定する
    this.matrix = {} as Record<NodeId, Record<NodeId, number | undefined>>;
    for (const from of Object.keys(this.nodes) as NodeId[]) {
      this.matrix[from] = {};
    }

    for (const path of paths) {
      if (!path.blocked) {
        this.matrix[path.from][path.to] = path.delayMs;
      }
    }
  }

  tick(now: number): NodeId[] {
    this.nowMs = now;
    const firedNodes: NodeId[] = [];

    // 自動発火ノードの処理
    for (const node of Object.values(this.nodes)) {
      if (!node.autoFire) continue;
      const interval = 60000 / node.bpm;
      if (now - node.lastFireMs >= interval) {
        node.lastFireMs = now;
        firedNodes.push(node.id);
        if (this.debug) console.log(`🔥 [GraphEngine] ${node.id} fireing at ${Math.round(now)}`);
        this.scheduleConduction(node.id, now);
      }
    }

    // スケジュールされた伝導の処理
    const remaining: typeof this.scheduledFires = [];
    for (const sched of this.scheduledFires) {
      if (sched.fireAt <= now) {
        const target = this.nodes[sched.target];
        if (now - target.lastFireMs >= target.refractoryMs) {
          target.lastFireMs = now;
          firedNodes.push(target.id);
          this.scheduleConduction(target.id, now);
          if (this.debug) console.log(`🔥 [GraphEngine] ${target.id} scheduled fireing at ${Math.round(now)}`);
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
      if (delay === undefined) continue; // blocked or no path
      // 自己伝導を明示的に許可（リエントリの場合）
      if (from === to && delay <= 0) continue; // ゼロ遅延なら無視
      if (this.debug) console.log(`🕒 [GraphEngine] ${from} -> ${to} delay: ${delay}`);
      this.scheduledFires.push({
        target: to as NodeId,
        fireAt: now + delay,
      });
    }
  }

  static createDefaultEngine(): GraphEngine {
    const nodes: Node[] = [
      { id: 'SA', bpm: 90, refractoryMs: 300, lastFireMs: -1000, autoFire: true },
      { id: 'A', bpm: 80, refractoryMs: 300, lastFireMs: -1000, autoFire: false },
      { id: 'AV', bpm: 40, refractoryMs: 350, lastFireMs: -1000, autoFire: true },
      { id: 'V', bpm: 30, refractoryMs: 400, lastFireMs: -1000, autoFire: false },
    ];

    const paths: ConductionPath[] = [
      { from: 'SA', to: 'A', delayMs: 4 },
      { from: 'A', to: 'AV', delayMs: 79, blocked: false },
      { from: 'AV', to: 'V', delayMs: 29},
      { from: 'AV', to: 'AV', delayMs: 450, blocked: true  },
    ];

    return new GraphEngine(nodes, paths);
  }
  
  public updateRatesFromSim(sim: SimOptions) {
    this.nodes['SA'].bpm = sim.sinus.rate;
    this.nodes['AV'].bpm = sim.junction.rate;
    this.nodes['V'].bpm = sim.ventricle.rate;
  }

  public setNodeAutofire(nodeId: NodeId, enabled: boolean) {
    if (this.nodes[nodeId]) {
      this.nodes[nodeId].autoFire = enabled;
    }
  }
  
  static createFromSimOptions(sim: import('../types/SimOptions').SimOptions): GraphEngine {
    const nodes: Node[] = [
      { id: 'SA', bpm: sim.sinus.rate, refractoryMs: 300, lastFireMs: -1000, autoFire: true },
      { id: 'A',  bpm: 80, refractoryMs: 300, lastFireMs: -1000, autoFire: false },
      { id: 'AV', bpm: sim.junction.rate, refractoryMs: 350, lastFireMs: -1000, autoFire: true },
      { id: 'V',  bpm: sim.ventricle.rate, refractoryMs: 400, lastFireMs: -1000, autoFire: false },
    ];

    const paths: ConductionPath[] = [
      { from: 'SA', to: 'A', delayMs: 4 },
      { from: 'A', to: 'AV', delayMs: 79 },
      { from: 'AV', to: 'V', delayMs: 29 },
      { from: 'AV', to: 'AV', delayMs: 450, blocked: true },
    ];

    return new GraphEngine(nodes, paths);
  }

  public getLastFireTime(nodeId: NodeId): number {
    return this.nodes[nodeId]?.lastFireMs ?? -1;
  }
}
