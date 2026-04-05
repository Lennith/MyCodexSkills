#!/usr/bin/env python3
import argparse
import json
import shutil
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scaffold a fresh EasyAgentTeam template workspace")
    parser.add_argument("target", help="Target directory for the new workspace")
    parser.add_argument("--base-url", help="Override .agent-tools/config.json base_url after copy")
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Allow copying into an existing directory"
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    skill_dir = Path(__file__).resolve().parents[1]
    template_dir = skill_dir / "assets" / "template-agentstatic"
    target_dir = Path(args.target).expanduser().resolve()

    if not template_dir.is_dir():
        raise SystemExit(f"Template directory not found: {template_dir}")

    if target_dir.exists() and not args.overwrite:
        raise SystemExit(f"Target already exists: {target_dir}. Use --overwrite to allow merge copy.")

    shutil.copytree(template_dir, target_dir, dirs_exist_ok=args.overwrite)

    if args.base_url:
        config_path = target_dir / ".agent-tools" / "config.json"
        config = json.loads(config_path.read_text(encoding="utf-8"))
        config["base_url"] = args.base_url
        config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Scaffolded EasyAgentTeam workspace: {target_dir}")
    print("Next commands:")
    print("  node .agent-tools/scripts/template_bundle_guard.mjs check")
    print("  node .agent-tools/scripts/template_bundle_guard.mjs publish")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())