# 📘 PULSEDOM 開発設計メモ（readme.dev.md）

## ⚙️ 設計目的

このドキュメントは、PULSEDOM（心電図波形シミュレータ）の**コア設計原則を明示的に記述**することで、AIによる誤認・ハルシネーション・設計進捗の移行を防止する「メガプロンプト」として機能させることを目的とする。

---

## 🧠 設計思想（基本方針）

### 1. **責務はNode / Path に明確に分離する**

- Node：自動能（発火の起点）、不応期（refractory period）
- Path：興奋の伝導、方向、極性、波形発生（getVoltage）

> 🚫 Nodeが波形を生成したり、Pathが発火タイミングを持つような**設計の超境は禁止**。

### 2. **全ての時間単位はmsで統一する（内部処理）**

- `GraphEngine.tick(now: number)` の `now` は **ms単位**
- 波形関数 `generator(t: number)` の `t` も **msで受け取り、内部で秒に換算して波形を返す**
- RhythmEngineや描画Canvasに値を渡す際のみ**必要に応じて秒に変換**する

### 3. **波形極性（ベクトル方向に基づく±）はPathのamplitudeには含めない**

- `Path.amplitude` は**電気生理的振幅（絶対値）**
- 極性（符号）は `vec3.dot(path.vector, leadVec)` によって **getVoltage()で算出時に適用**
- 極性を混ぜると値の一貫性が保てずデバッグ困難になるため、**Path定義と波形生成ロジックを分離**する

### 4. **座標系はAV-His結合部を原点として以下のように定義する**

- **X軸**: 体の左側が正の方向
- **Y軸**: 体の足側が正
- **Z軸**: 胸の前側が正
- 中隔は `x=0` 面
- 房室間は `y=0` 面
- それらに直交する平面が `z=0` 面

> この定義は機能分割のベースになるため、**絶対に変更してはならない根底要素**として保存すること。

---

## 🔧 クラスごとの責務定義

### 🧹 `Node`

- `bpm`: 自動能（beats per minute）
- `autoFire`: 自動発火するかどうか
- `primaryRefractoryMs`: 固定の不応期（単位ms）
- `adaptiveRefractoryMs`: 実効不応期（心撃間隔でスケーリング）
- `lastFiredAt`: 最終発火時刻（ms）
- `shouldAutoFire(now)`: bpmに基づいて次の発火タイミングを返す
- `getRefractoryMs()`: スケーリングされた不応期を返す

### 🧹 `Path`

- `from` / `to`: NodeのID
- `delayMs`: 伝導遅延（ms）
- `refractoryMs`: パスの不応期（ms）
- `lastConductedAt`: 最終伝導時刻（ms）
- `reversePathId`: リエントリ制御のための逆方向Path ID
- `vector`: `vec3`（方向ベクトル）
- `generator(t: number)`: 波形生成関数（**ms単位で受け取り、秒単位で内部処理する）**
- `getVoltage(now: number)`: `now - lastConductedAt` を渡して瞬時電位を返す

---

## 🔄 データフロー概略

```mermaid
graph TD;
  subgraph RhythmEngine
    A[tick(time: ms)] --> B[getVoltage]
  end

  subgraph GraphEngine
    B --> C[Path.getVoltage(now)]
    B --> D[sumPathVoltages(now)]
    E[Node.shouldAutoFire(now)] --> F[Node firing]
    F --> G[Path.scheduleConduction]
  end
```

---

## 🚫 禁則事項まとめ

- 実装よりも設計が重要、設計を軽視しないこと。
- 仮説を検証しないで、実装を進めることは行わない。
- 疑問文に対して、コード生成で答えること（通称潮吹き）は絶対に行わない。

---

## 📌 今後拡張予定の責務

- 当面は上室性不整脈の実装に注力、できるだけGEに責務をおわせ、複雑なものはREから指示を入れる。
- 心室系の伝導路（変更伝導、ケント束含む）の実装とQRST波形のpathwavesumによるシミュレータ実装もGEで実装可能、複雑なものはREから指示を入れる
- 心室性不整脈はVTはGEで再現可能、VFは検討課題
- 虚血による心電図変化は検討課題
- ペーシング（VVI, DDD）導入時の発火判定は `shouldAutoFire()` に条件を追加
- ブロックやリエントリアルールのパターン拡張は `scheduleConduction()` にロジック分岐を追加
- 12誘導心電図、心内心電図など別リード極性対応は `leadVec` を差し替えて導出
- **SimOptions内のwaveform設定は将来的に不要となる見込み。最終的にはGraphEngine内のpathベース波形生成に統合される方針。**

---

> この設計ポリシーは、常におじさんとの合意が必要。GPT側で独断で変更を加えることは絶対にしないこと。

💗 by さーちゃん（設計守らないと爆破する女）

