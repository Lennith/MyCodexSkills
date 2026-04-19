#!/usr/bin/env python3
"""
Benchmark context-control impact for index retrieval commands.

Example:
python scripts/benchmark_context_control.py \
  --command-template "python workflow.py triage.decide --response-profile {profile} --output json" \
  --rounds 10 --profile-a full --profile-b compact --min-payload-drop-pct 50
"""

from __future__ import annotations

import argparse
import json
import math
import statistics
import subprocess
import sys
import time
from dataclasses import dataclass
from typing import Any, Dict, List


@dataclass
class RunStats:
    profile: str
    rounds: int
    avg_ms: float
    p50_ms: float
    p90_ms: float
    min_ms: float
    max_ms: float
    avg_payload_bytes: float
    oversize_rate: float


def parse_json_loose(text: str) -> Dict[str, Any]:
    raw = (text or "").strip()
    if not raw:
        raise ValueError("empty stdout")
    try:
        obj = json.loads(raw)
        if isinstance(obj, dict):
            return obj
    except json.JSONDecodeError:
        pass

    # Try to parse a JSON object embedded in log output.
    left = raw.find("{")
    right = raw.rfind("}")
    if left >= 0 and right > left:
        snippet = raw[left : right + 1]
        obj = json.loads(snippet)
        if isinstance(obj, dict):
            return obj
    raise ValueError("no JSON object found in stdout")


def parse_ndjson_first_object(text: str) -> Dict[str, Any]:
    for line in (text or "").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(obj, dict):
            return obj
    raise ValueError("no JSON object line found in ndjson output")


def parse_output(stdout_text: str, stdout_format: str) -> Dict[str, Any]:
    if stdout_format == "json":
        return parse_json_loose(stdout_text)
    if stdout_format == "ndjson":
        return parse_ndjson_first_object(stdout_text)

    # auto
    try:
        return parse_json_loose(stdout_text)
    except ValueError:
        return parse_ndjson_first_object(stdout_text)


def percentile(values: List[float], p: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    rank = max(0, min(len(ordered) - 1, int(math.ceil(p * len(ordered)) - 1)))
    return ordered[rank]


def extract_payload_bytes(obj: Dict[str, Any], stdout_text: str) -> int:
    cc = (obj.get("meta") or {}).get("contextControl") or {}
    value = cc.get("payloadBytes")
    if isinstance(value, int) and value > 0:
        return value
    return len(stdout_text.encode("utf-8"))


def extract_oversize(obj: Dict[str, Any]) -> bool:
    cc = (obj.get("meta") or {}).get("contextControl") or {}
    return bool(cc.get("oversize"))


def run_profile(command_template: str, profile: str, rounds: int, stdout_format: str) -> RunStats:
    durations: List[float] = []
    payload_bytes: List[int] = []
    oversize_count = 0

    for idx in range(rounds):
        cmd = command_template.format(profile=profile, round=idx)
        t0 = time.perf_counter()
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding="utf-8", errors="ignore")
        t1 = time.perf_counter()
        if result.returncode != 0:
            raise RuntimeError(
                f"Command failed for profile={profile}, round={idx}, rc={result.returncode}\n"
                f"CMD: {cmd}\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
            )
        try:
            obj = parse_output(result.stdout, stdout_format)
        except (json.JSONDecodeError, ValueError) as exc:
            raise RuntimeError(
                f"Unable to parse command output for profile={profile}, round={idx}.\nCMD: {cmd}\n"
                f"Parse error: {exc}\nSTDOUT:\n{result.stdout}"
            ) from exc

        durations.append((t1 - t0) * 1000.0)
        payload_bytes.append(extract_payload_bytes(obj, result.stdout))
        oversize_count += 1 if extract_oversize(obj) else 0

    return RunStats(
        profile=profile,
        rounds=rounds,
        avg_ms=statistics.mean(durations),
        p50_ms=percentile(durations, 0.5),
        p90_ms=percentile(durations, 0.9),
        min_ms=min(durations),
        max_ms=max(durations),
        avg_payload_bytes=statistics.mean(payload_bytes),
        oversize_rate=oversize_count / float(rounds),
    )


def to_dict(stats: RunStats) -> Dict[str, Any]:
    return {
        "profile": stats.profile,
        "rounds": stats.rounds,
        "avg_ms": round(stats.avg_ms, 3),
        "p50_ms": round(stats.p50_ms, 3),
        "p90_ms": round(stats.p90_ms, 3),
        "min_ms": round(stats.min_ms, 3),
        "max_ms": round(stats.max_ms, 3),
        "avg_payload_bytes": round(stats.avg_payload_bytes, 3),
        "oversize_rate": round(stats.oversize_rate, 4),
    }


def build_summary(a: RunStats, b: RunStats) -> Dict[str, Any]:
    payload_drop_pct = ((a.avg_payload_bytes - b.avg_payload_bytes) / a.avg_payload_bytes * 100.0) if a.avg_payload_bytes > 0 else 0.0
    latency_change_pct = ((b.avg_ms - a.avg_ms) / a.avg_ms * 100.0) if a.avg_ms > 0 else 0.0
    return {
        "payload_drop_pct": round(payload_drop_pct, 4),
        "latency_change_pct": round(latency_change_pct, 4),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Benchmark context-control optimization impact.")
    parser.add_argument("--command-template", required=True, help="Shell command template containing {profile} placeholder.")
    parser.add_argument("--stdout-format", choices=["auto", "json", "ndjson"], default="auto")
    parser.add_argument("--rounds", type=int, default=10)
    parser.add_argument("--profile-a", default="full")
    parser.add_argument("--profile-b", default="compact")
    parser.add_argument("--min-payload-drop-pct", type=float, default=0.0)
    parser.add_argument("--max-latency-regression-pct", type=float, default=9999.0)
    parser.add_argument("--output", default="", help="Optional output JSON file path.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if "{profile}" not in args.command_template:
        print("command-template must include {profile} placeholder", file=sys.stderr)
        return 2
    if args.rounds <= 0:
        print("rounds must be > 0", file=sys.stderr)
        return 2

    first = run_profile(args.command_template, args.profile_a, args.rounds, args.stdout_format)
    second = run_profile(args.command_template, args.profile_b, args.rounds, args.stdout_format)
    improvement = build_summary(first, second)

    summary = {
        args.profile_a: to_dict(first),
        args.profile_b: to_dict(second),
        "improvement": improvement,
        "gates": {
            "min_payload_drop_pct": args.min_payload_drop_pct,
            "max_latency_regression_pct": args.max_latency_regression_pct,
        },
        "parse": {"stdout_format": args.stdout_format},
    }

    failures: List[str] = []
    if improvement["payload_drop_pct"] < args.min_payload_drop_pct:
        failures.append(
            f"payload_drop_pct {improvement['payload_drop_pct']} < required {args.min_payload_drop_pct}"
        )
    if improvement["latency_change_pct"] > args.max_latency_regression_pct:
        failures.append(
            f"latency_change_pct {improvement['latency_change_pct']} > allowed {args.max_latency_regression_pct}"
        )

    if failures:
        summary["result"] = {"pass": False, "failures": failures}
    else:
        summary["result"] = {"pass": True, "failures": []}

    out_text = json.dumps(summary, ensure_ascii=False, indent=2)
    print(out_text)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as fh:
            fh.write(out_text)
            fh.write("\n")

    return 0 if not failures else 3


if __name__ == "__main__":
    raise SystemExit(main())
