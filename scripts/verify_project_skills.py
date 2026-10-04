#!/usr/bin/env python3
"""Verify the unified Wise Motion skill and optional wise-video compatibility links."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path
from typing import Any


DISNEY_NAME = "disney-animation-rule-skill"
EXPECTED_SOURCE = {
    "repository": "https://github.com/vibe-motion/skills.git",
    "path": "disney-animation-rule-skill",
    "installedRef": "559cc186b98471562e6acbbd43ca4b3f73c00123",
    "contentCommit": "d3b20af3b8f7a8d113bd323834fbdd7c7d841e91",
    "treeSha": "864fa356a6385a82f728572ef99eaac4304c4264",
    "licenseStatus": "no-license-detected",
    "usageScope": "local-only",
    "redistribution": "blocked-until-authorized",
    "upstreamFilesUnmodified": True,
    "localModifications": "metadata-only",
}
EXPECTED_BLOBS = {
    "SKILL.md": "124d080c4dbd86936c2851ea6c4c37f809b1d876",
    "references/clawd-jump-case-study.md": "78faef126b1de1cf01e1e46ea18281617e61f7e1",
    "references/implementation-patterns.md": "2878d6ead14f62b1d4a55fb4abf023d8015ef6ca",
    "references/twelve-principles.md": "bbb18fe61555cc8a042073bf0fffcb58aab69e07",
}
EXPECTED_OVERLAY = ["agents/openai.yaml"]
DIRECTOR_FILES = {
    "SKILL.md", "README.md", "agents/openai.yaml",
    "assets/wise-video.json", "references/method.md", "references/index.md",
    "references/director-design.md", "references/catalog-maintenance.md", "references/pipeline-methodology.md",
    "references/remotion-production.md", "references/runtime-interface.md",
    "references/production-contract.md", "references/narrated-tutorial-review.md",
    "references/validation-matrix.md", "references/wise-motion-dna.md",
    "scripts/verify_project_skills.py", "scripts/wise_video_contract.py",
}

def git_blob_sha(path: Path) -> str:
    data = path.read_bytes()
    header = f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header + data).hexdigest()


def read_json(path: Path, errors: list[str]) -> Any | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        errors.append(f"来源锁不存在：{path}")
    except json.JSONDecodeError as exc:
        errors.append(f"来源锁不是合法 JSON：{path}:{exc.lineno}:{exc.colno} {exc.msg}")
    except OSError as exc:
        errors.append(f"无法读取来源锁：{path}（{exc}）")
    return None


def relative_files(directory: Path) -> set[str]:
    if not directory.is_dir():
        return set()
    return {
        path.relative_to(directory).as_posix()
        for path in directory.rglob("*")
        if path.is_file()
    }


def policy_value(path: Path, expected: bool, errors: list[str]) -> None:
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        errors.append(f"无法读取 Skill metadata：{path}（{exc}）")
        return
    value = "true" if expected else "false"
    if not re.search(rf"(?m)^\s*allow_implicit_invocation:\s*{value}\s*$", text):
        errors.append(f"{path} 必须设置 allow_implicit_invocation: {value}")


def verify_legacy_dependency(repo_root: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    notes: list[str] = []
    skill_root = repo_root / ".agents" / "skills"
    lock_path = skill_root / "THIRD_PARTY_SOURCES.json"
    disney_root = skill_root / DISNEY_NAME

    if not (repo_root / ".git").exists():
        errors.append(f"--repo-root 不是当前 Git 仓库根：{repo_root}")
    document = read_json(lock_path, errors)
    source: dict[str, Any] | None = None
    if isinstance(document, dict):
        if document.get("schemaVersion") != 1:
            errors.append("THIRD_PARTY_SOURCES.json schemaVersion 必须为 1")
        sources = document.get("sources")
        if not isinstance(sources, dict) or not isinstance(sources.get(DISNEY_NAME), dict):
            errors.append(f"来源锁缺少 sources.{DISNEY_NAME}")
        else:
            source = sources[DISNEY_NAME]
    elif document is not None:
        errors.append("THIRD_PARTY_SOURCES.json 根必须是对象")

    if source is not None:
        for key, expected in EXPECTED_SOURCE.items():
            if source.get(key) != expected:
                errors.append(f"Disney 来源锁 {key} 漂移：期望 {expected!r}，实际 {source.get(key)!r}")
        if source.get("localOverlay") != EXPECTED_OVERLAY:
            errors.append(
                f"Disney localOverlay 漂移：期望 {EXPECTED_OVERLAY!r}，实际 {source.get('localOverlay')!r}"
            )
        if source.get("blobs") != EXPECTED_BLOBS:
            errors.append("Disney blobs 映射与批准的固定快照不一致")

    actual_disney_files = relative_files(disney_root)
    expected_disney_files = set(EXPECTED_BLOBS) | set(EXPECTED_OVERLAY)
    missing = sorted(expected_disney_files - actual_disney_files)
    unexpected = sorted(actual_disney_files - expected_disney_files)
    if missing:
        errors.append(f"Disney 安装缺少文件：{', '.join(missing)}")
    if unexpected:
        errors.append(f"Disney 安装出现未登记文件：{', '.join(unexpected)}")
    for relative, expected in EXPECTED_BLOBS.items():
        path = disney_root / relative
        if not path.is_file():
            continue
        actual = git_blob_sha(path)
        if actual != expected:
            errors.append(f"Disney 上游文件被修改：{relative}，期望 blob {expected}，实际 {actual}")
    policy_value(disney_root / "agents" / "openai.yaml", False, errors)

    ignored = subprocess.run(
        ["git", "-C", str(repo_root), "check-ignore", "-q", ".agents/skills/disney-animation-rule-skill/"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    if ignored.returncode != 0:
        errors.append("Disney Skill 目录未被本仓库 .git/info/exclude 排除")
    else:
        notes.append("Disney Skill 已由 .git/info/exclude 保持本机专用")

    notes.append(f"Disney 固定快照校验文件数：{len(EXPECTED_BLOBS)}")
    return errors, notes


def verify(repo_root: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    notes: list[str] = []
    motion_root = Path(__file__).resolve().parent.parent
    if not (motion_root / ".git").exists():
        errors.append(f"统一技能根不是当前 Git 仓库：{motion_root}")
    missing = sorted(name for name in DIRECTOR_FILES if not (motion_root / name).is_file())
    if missing:
        errors.append(f"Wise Motion 缺少文件：{', '.join(missing)}")
    policy_value(motion_root / "agents/openai.yaml", False, errors)
    try:
        instructions = (motion_root / "SKILL.md").read_text(encoding="utf-8")
        frontmatter = re.match(r"\A---\s*\n(.*?)\n---(?:\n|$)", instructions, re.S)
        if not frontmatter or not re.search(r"(?m)^name:\s*wise-motion\s*$", frontmatter[1]):
            errors.append("统一技能的 frontmatter 名称必须是 wise-motion")
        required_guides = {name for name in DIRECTOR_FILES if name.startswith("references/")}
        linked_guides = set(re.findall(r"\]\((references/[^)#]+)(?:#[^)]*)?\)", instructions))
        for name in sorted(required_guides - linked_guides):
            errors.append(f"统一技能没有提供必需资料的读取入口：{name}")
    except OSError as exc:
        errors.append(f"无法读取统一技能：{exc}")
    for relative in DIRECTOR_FILES:
        if not relative.endswith(".md") or not (motion_root / relative).is_file():
            continue
        file = motion_root / relative
        for link in re.findall(r"\]\(([^)]+)\)", file.read_text(encoding="utf-8")):
            if re.match(r"^(?:https?://|#)", link):
                continue
            if not (file.parent / link).is_file():
                errors.append(f"{relative} 的链接失效：{link}")
    notes.append(f"统一 Wise Motion 必需文件数：{len(DIRECTOR_FILES)}；仅手动调用")

    if repo_root != motion_root:
        skill_root = repo_root / ".agents/skills"
        current = skill_root / "wise-motion"
        if not current.is_symlink() or current.resolve() != motion_root:
            errors.append("旧项目的 wise-motion 入口没有直接链接到统一技能")
        compatibility = skill_root / "wise-video-director"
        policy_value(compatibility / "agents/openai.yaml", False, errors)
        try:
            text = (compatibility / "SKILL.md").read_text(encoding="utf-8")
            if "../wise-motion/SKILL.md" not in text:
                errors.append("旧导演兼容入口没有指向统一技能")
            for name in ("references", "scripts", "assets"):
                link = compatibility / name
                if not link.is_symlink() or link.resolve() != motion_root / name:
                    errors.append(f"旧导演 {name} 没有直接链接到新权威")
        except OSError as exc:
            errors.append(f"无法读取旧导演兼容入口：{exc}")
        dependency_errors, dependency_notes = verify_legacy_dependency(repo_root)
        errors.extend(dependency_errors)
        notes.extend(dependency_notes)
        notes.append("旧项目兼容入口只转发规则，第三方快照仍留原安装位置")
    return errors, notes


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", default=str(Path(__file__).resolve().parent.parent), help="统一技能根；传 wise-video 根时同时检查兼容入口及原第三方快照")
    parser.add_argument("--json", action="store_true", help="输出机器可读 JSON")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).expanduser().resolve()
    errors, notes = verify(repo_root)
    payload = {
        "ok": not errors,
        "repoRoot": str(repo_root),
        "errors": errors,
        "notes": notes,
    }
    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print(f"{'PASS' if not errors else 'FAIL'} project skills: {repo_root}")
        for note in notes:
            print(f"OK    {note}")
        for error in errors:
            print(f"ERROR {error}")
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
