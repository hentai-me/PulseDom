// src/components/VitalDisplay.tsx
import React, { useRef, useState, useEffect } from 'react';
import { VitalParameter } from '../models/VitalParameter';

type VitalDisplayProps = {
  param: VitalParameter;           // 表示・制御対象となるバイタル項目の定義（色・単位・範囲など）
  value: number;                   // 現在の値（外部から渡される）
  setValue: (v: number) => void;   // 値変更時に呼び出す更新関数（外部ステート更新）
};

const VitalDisplay: React.FC<VitalDisplayProps> = ({ param, value, setValue }) => {
  const startYRef = useRef<number | null>(null);     // ドラッグ開始時のY座標
  const tempValRef = useRef<number>(value);          // 一時的に計算中のドラッグ値
  const [localVal, setLocalVal] = useState<number>(value); // 表示用ローカルステート（ドラッグ中だけ更新）

  // 外部valueが変更されたらローカルにも反映（外部→内部同期）
  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  // ドラッグ開始：Y座標を記録
  const handlePointerDown = (e: React.PointerEvent) => {
    startYRef.current = e.clientY;
  };

  // ドラッグ中：Yの変化量に応じて値を更新（小刻みかどうかは param.sensitivity による）
  const handlePointerMove = (e: React.PointerEvent) => {
    if (startYRef.current !== null) {
      const deltaY = startYRef.current - e.clientY; // 上に動くとプラス、下に動くとマイナス
      const deltaVal = Math.round(deltaY / param.sensitivity); // 感度に基づく変化量（例：sensitivity=5で1px=0.2）
      const newVal = param.clamp(value + deltaVal); // 範囲制限あり
      tempValRef.current = newVal;                  // 最終確定前の仮の値を保持
      setLocalVal(newVal);                          // 表示用として即座に反映（実際の値更新はまだ）
    }
  };

  // ドラッグ終了：確定値をsetValueに反映（外部ステート更新）
  const handlePointerUp = () => {
    startYRef.current = null;
    if (tempValRef.current !== value) {
      setValue(tempValRef.current); // 実際の値として確定
    }
  };

  // バックグラウンド色の判定（警告・危険・正常で色が変わる）
  const getBgColor = (): string => {
    if (param.isCritical(localVal)) return 'bg-red-700';   // 危険域
    if (param.isWarning(localVal)) return 'bg-yellow-500'; // 警告域
    return 'bg-black';                                     // 正常域
  };

  // テキストカラー（固定）
  const getTextColor = (): string => {
    return param.color;
  };

  return (
    <div
      className={`select-none cursor-ns-resize rounded-2xl p-4 shadow-xl hover:scale-105 transition duration-150 ease-out ${getBgColor()}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <span className={`text-6xl font-bold font-mono text-right block ${getTextColor()}`}>
        {param.format(localVal)} {/* 小数点表示などに対応したフォーマット */}
      </span>
      <span className="ml-2 text-gray-400 text-xl">{param.unit}</span>
    </div>
  );
};

export default VitalDisplay;
