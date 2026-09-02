'use client';

import { useMemo, useState } from 'react';
import { Check, Clipboard, Eraser, Info } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

const ACTIONS: Record<number, string> = {
  120: 'U',
  121: 'S',
  122: 'E',
  123: 'X',
  124: 'R',
  125: 'A',
  126: 'T',
  127: 'P',
};

type DecodedSegment = { steps: string[]; error?: string };

function inputValue(raw: string, field: 'play_list' | 'play_list_2') {
  const matched = raw.match(
    new RegExp(`\\(?${field}\\s*:\\s*([A-Za-z0-9_-]*)\\)?`),
  );
  return (matched?.[1] ?? raw).replace(/\s/g, '');
}

function containsField(raw: string, field: 'play_list' | 'play_list_2') {
  return new RegExp(`\\(?${field}\\s*:`).test(raw);
}

function decodeSegment(raw: string, field: 'play_list' | 'play_list_2'): DecodedSegment {
  const value = inputValue(raw, field);
  if (!value) return { steps: [] };
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    return { steps: [], error: `${field} 不是有效的 Base64URL 字符串。` };
  }

  let bytes: Uint8Array;
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  } catch {
    return { steps: [], error: `${field} 无法解码。` };
  }

  const codes: number[] = [];
  let buffer = 0;
  let bitCount = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitCount += 8;
    while (bitCount >= 7) {
      bitCount -= 7;
      codes.push((buffer >> bitCount) & 0x7f);
      buffer &= (1 << bitCount) - 1;
    }
  }

  const steps: string[] = [];
  for (let index = 0; index < codes.length; index += 1) {
    const code = codes[index];
    if (code === 119) return { steps };
    if (code === 118) {
      if (index + 2 >= codes.length) {
        return { steps, error: `${field} 的扩展 path 缺少数据。` };
      }
      steps.push(String((codes[index + 1] << 7) | codes[index + 2]));
      index += 2;
      continue;
    }
    steps.push(ACTIONS[code] ?? String(code));
  }

  return { steps, error: `${field} 缺少结束标记（119）。` };
}

function StepToken({ step, index }: { step: string; index: number }) {
  const isAction = /^[USEXRATP]$/.test(step);
  return (
    <span
      className={
        isAction
          ? 'inline-flex min-w-8 items-center justify-center rounded-md bg-amber-100 px-2 py-1 font-mono text-xs font-bold text-amber-900'
          : 'inline-flex min-w-8 items-center justify-center rounded-md bg-cyan-50 px-2 py-1 font-mono text-xs font-semibold text-cyan-950 ring-1 ring-cyan-950/10'
      }
      title={`第 ${index + 1} 步`}
    >
      {step}
    </span>
  );
}

export default function Home() {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    // Either box may contain a complete Firebase log. Prefer explicit fields
    // found anywhere in the pasted text, while retaining direct-value support.
    const source = `${first}\n${second}`;
    const oneInput = containsField(source, 'play_list') ? source : first;
    const twoInput = containsField(source, 'play_list_2') ? source : second;
    const one = decodeSegment(oneInput, 'play_list');
    const two = decodeSegment(twoInput, 'play_list_2');
    const steps = [...one.steps, ...two.steps];
    return {
      one,
      two,
      steps,
      vehicleCount: steps.filter((step) => !/^[USEXRATP]$/.test(step)).length,
      itemCount: steps.filter((step) => /^[USEXRATP]$/.test(step)).length,
    };
  }, [first, second]);

  const copySteps = async () => {
    if (!result.steps.length) return;
    await navigator.clipboard.writeText(result.steps.join(','));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="min-h-screen bg-[#f4f7f6] text-slate-950">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <header className="mb-8 flex flex-col gap-4 border-b border-slate-900/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 font-mono text-xs font-semibold tracking-[0.18em] text-teal-700">
              CAR JAM · REPLAY TOOL
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Play List Decoder</h1>
            <p className="mt-2 text-sm text-slate-600">
              粘贴 Firebase 的两段步骤记录，即时还原玩家的车辆点击与道具操作。
            </p>
          </div>
          <Badge className="w-fit bg-teal-700 px-3 py-1 text-teal-50 hover:bg-teal-700">
            7-bit · Base64URL
          </Badge>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
          <Card className="gap-5 bg-white shadow-sm">
            <CardHeader className="gap-2">
              <CardTitle>输入记录</CardTitle>
              <CardDescription>
                可直接粘贴编码；完整 Firebase 日志粘贴到任意一个输入框即可自动提取两段。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label htmlFor="play-list" className="block space-y-2">
                <span className="font-mono text-xs font-semibold text-slate-700">play_list</span>
                <Textarea
                  id="play-list"
                  value={first}
                  onChange={(event) => setFirst(event.target.value)}
                  placeholder="例如：AkQw80ZCnCYgIQE..."
                  className="min-h-28 resize-y bg-slate-50 font-mono text-xs leading-5"
                  spellCheck={false}
                />
              </label>
              <label htmlFor="play-list-2" className="block space-y-2">
                <span className="font-mono text-xs font-semibold text-slate-700">play_list_2</span>
                <Textarea
                  id="play-list-2"
                  value={second}
                  onChange={(event) => setSecond(event.target.value)}
                  placeholder="第二段为空时可留空"
                  className="min-h-24 resize-y bg-slate-50 font-mono text-xs leading-5"
                  spellCheck={false}
                />
              </label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setFirst('');
                  setSecond('');
                  setCopied(false);
                }}
              >
                <Eraser data-icon="inline-start" /> 清空
              </Button>
            </CardContent>
          </Card>

          <Card className="gap-5 bg-white shadow-sm">
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>还原步骤</CardTitle>
                  <CardDescription className="mt-1">两段按顺序拼接，序号从 1 连续计数。</CardDescription>
                </div>
                <Button disabled={!result.steps.length} onClick={copySteps}>
                  {copied ? <Check data-icon="inline-start" /> : <Clipboard data-icon="inline-start" />}
                  {copied ? '已复制' : '复制序列'}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary">总计 {result.steps.length} 步</Badge>
                <Badge variant="secondary">车辆 {result.vehicleCount}</Badge>
                <Badge variant="secondary">道具 {result.itemCount}</Badge>
                <Badge variant="outline">第一段 {result.one.steps.length}</Badge>
                <Badge variant="outline">第二段 {result.two.steps.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {result.one.error || result.two.error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                  {result.one.error ?? result.two.error}
                </div>
              ) : result.steps.length ? (
                <>
                  <div className="max-h-[370px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {result.steps.map((step, index) => (
                        <StepToken key={`${step}-${index}`} step={step} index={index} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 break-all rounded-md bg-slate-950 px-3 py-2 font-mono text-xs leading-5 text-slate-100">
                    {result.steps.join(',')}
                  </p>
                </>
              ) : (
                <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                  <Info className="mb-3 size-5 text-teal-700" />
                  <p className="text-sm font-medium">等待步骤记录</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">车辆点击显示 path；道具显示一个字母。</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 md:grid-cols-2">
          <Card size="sm" className="bg-white/80">
            <CardHeader><CardTitle>道具编码</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-5 gap-y-2 font-mono text-xs text-slate-700 sm:grid-cols-4">
              <span>U 撤销</span><span>S 洗牌</span><span>E 换色</span><span>X 扩容</span>
              <span>R 普通复活</span><span>A 救护车复活</span><span>T 超时复活</span><span>P VIP</span>
            </CardContent>
          </Card>
          <Card size="sm" className="bg-white/80">
            <CardHeader><CardTitle>格式说明</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 font-mono text-xs leading-5 text-slate-600">
              <p>path 0–117 直接编码；118 为扩展 path；119 为段结束。</p>
              <p>每段上限 84 个内部码；<code>play_list_2</code> 为空也是有效记录。</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
