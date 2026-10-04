#!/usr/bin/env python3
"""Initialize and validate the project-local Wise video protection contract.

The contract is deliberately an index over HyperFrames truth files.  This tool
does not create a second timeline, migrate legacy projects, render video, or
rewrite any referenced project file.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


SCHEMA_VERSION = 1
CONTRACT_NAME = "wise-video.json"
LEVELS = ("contract", "preview", "delivery")
TIMING_AUTHORITIES = ("voice", "music", "visual")
TIMING_STATES = ("draft", "locked")
CONTINUITY_MODES = ("persistent", "pixel-lock", "replace", "cut")
REVIEW_STATES = ("pending", "approved", "skipped")
TARGET_RE = re.compile(r"^(caption|motion|cut):[^\s]+$")
SELECTOR_RE = re.compile(r"^(scene|asset|cue):(.+)$")
ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")


@dataclass
class Report:
    project: Path
    level: str
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    legacy: bool = False

    def error(self, code: str, message: str) -> None:
        self.errors.append(f"[{code}] {message}")

    def warn(self, code: str, message: str) -> None:
        self.warnings.append(f"[{code}] {message}")

    @property
    def ok(self) -> bool:
        return not self.errors


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load_json(path: Path, report: Report, label: str) -> Any | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        report.error("missing-file", f"{label} 不存在：{path}")
    except json.JSONDecodeError as exc:
        report.error(
            "invalid-json",
            f"{label} 不是合法 JSON：{path}:{exc.lineno}:{exc.colno} {exc.msg}",
        )
    except OSError as exc:
        report.error("read-failed", f"无法读取 {label}：{path}（{exc}）")
    return None


def resolve_project_path(
    project: Path,
    raw: Any,
    report: Report,
    label: str,
    *,
    must_exist: bool = True,
    allow_null: bool = False,
) -> Path | None:
    if raw is None and allow_null:
        return None
    if not isinstance(raw, str) or not raw.strip():
        report.error("invalid-path", f"{label} 必须是非空的项目内相对路径")
        return None

    relative = Path(raw)
    if relative.is_absolute():
        report.error("absolute-path", f"{label} 不得使用绝对路径：{raw}")
        return None

    root = project.resolve()
    resolved = (root / relative).resolve(strict=False)
    try:
        resolved.relative_to(root)
    except ValueError:
        report.error("path-escape", f"{label} 逃出了项目目录：{raw}")
        return None

    if must_exist and not resolved.is_file():
        report.error("missing-file", f"{label} 指向的文件不存在：{raw}")
    return resolved


def parse_inline_ids(raw: str, report: Report, label: str) -> list[str]:
    value = raw.strip()
    if not (value.startswith("[") and value.endswith("]")):
        report.error("invalid-storyboard-list", f"{label} 必须使用内联列表，例如 [p15-cue]")
        return []
    body = value[1:-1].strip()
    if not body:
        return []

    result: list[str] = []
    for part in body.split(","):
        item = part.strip().strip("'\"")
        if not ID_RE.fullmatch(item):
            report.error("invalid-id", f"{label} 包含非法 id：{item!r}")
            continue
        result.append(item)
    if len(result) != len(set(result)):
        report.error("duplicate-reference", f"{label} 含重复 id")
    return result


def parse_storyboard(path: Path, report: Report) -> dict[str, dict[str, Any]]:
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError as exc:
        report.error("read-failed", f"无法读取 Storyboard：{path}（{exc}）")
        return {}

    scenes: dict[str, dict[str, Any]] = {}
    current: str | None = None
    id_line = re.compile(r"^\s*-\s*id:\s*(['\"]?)([A-Za-z0-9][A-Za-z0-9._-]*)\1\s*$")
    cue_line = re.compile(r"^\s*-\s*wise_cue_ids:\s*(.+?)\s*$")
    object_line = re.compile(r"^\s*-\s*wise_object_ids:\s*(.+?)\s*$")
    intent_line = re.compile(r"^\s*-\s*motion_intent:\s*(.*?)\s*$")

    for number, line in enumerate(lines, start=1):
        match = id_line.match(line)
        if match:
            scene_id = match.group(2)
            if scene_id in scenes:
                report.error("duplicate-scene", f"Storyboard scene 重复：{scene_id}（第 {number} 行）")
            else:
                scenes[scene_id] = {
                    "wise_cue_ids": [],
                    "wise_object_ids": [],
                    "motion_intent": "",
                }
            current = scene_id
            continue

        match = cue_line.match(line)
        if match:
            if current is None:
                report.error("orphan-storyboard-field", f"第 {number} 行 wise_cue_ids 前没有 scene id")
            else:
                scenes[current]["wise_cue_ids"] = parse_inline_ids(
                    match.group(1), report, f"scene {current}.wise_cue_ids"
                )
            continue

        match = object_line.match(line)
        if match:
            if current is None:
                report.error("orphan-storyboard-field", f"第 {number} 行 wise_object_ids 前没有 scene id")
            else:
                scenes[current]["wise_object_ids"] = parse_inline_ids(
                    match.group(1), report, f"scene {current}.wise_object_ids"
                )
            continue

        match = intent_line.match(line)
        if match:
            if current is None:
                report.error("orphan-storyboard-field", f"第 {number} 行 motion_intent 前没有 scene id")
            else:
                scenes[current]["motion_intent"] = match.group(1).strip().strip("'\"")

    if not scenes:
        report.error("no-scenes", "Storyboard 中没有找到 `- id: <scene>`")
    return scenes


def json_pointer_exists(document: Any, pointer: str) -> bool:
    if pointer == "":
        return True
    if not pointer.startswith("/"):
        return False

    value = document
    for token in pointer[1:].split("/"):
        token = token.replace("~1", "/").replace("~0", "~")
        if isinstance(value, dict):
            if token not in value:
                return False
            value = value[token]
        elif isinstance(value, list):
            if not token.isdigit():
                return False
            index = int(token)
            if index >= len(value):
                return False
            value = value[index]
        else:
            return False
    return True


def validate_source_ref(project: Path, raw: Any, report: Report, label: str) -> None:
    if not isinstance(raw, str):
        report.error("invalid-source-ref", f"{label} 必须是字符串")
        return
    if raw.startswith("manual:"):
        seconds = raw.removeprefix("manual:")
        try:
            numeric_seconds = float(seconds)
            if numeric_seconds < 0 or not math.isfinite(numeric_seconds):
                raise ValueError
        except ValueError:
            report.error("invalid-manual-cue", f"{label} 必须是非负秒数：{raw}")
        return

    if "#/" not in raw:
        report.error(
            "invalid-source-ref",
            f"{label} 必须是 `<json-path>#/<pointer>` 或 `manual:<seconds>`：{raw}",
        )
        return
    relative, pointer_tail = raw.split("#", 1)
    source = resolve_project_path(project, relative, report, f"{label} source")
    if source is None or not source.is_file():
        return
    document = load_json(source, report, f"{label} source")
    if document is not None and not json_pointer_exists(document, pointer_tail):
        report.error("missing-json-pointer", f"{label} 指向不存在的 JSON Pointer：{raw}")


def validate_authorities(
    project: Path, contract: dict[str, Any], report: Report
) -> dict[str, Path | None]:
    raw = contract.get("authorities")
    if not isinstance(raw, dict):
        report.error("invalid-authorities", "authorities 必须是对象")
        return {}

    required = ("brief", "storyboard", "design", "composition")
    optional = ("script", "audioTiming")
    paths: dict[str, Path | None] = {}
    for key in required:
        if key not in raw:
            report.error("missing-authority", f"authorities.{key} 缺失")
            paths[key] = None
        else:
            paths[key] = resolve_project_path(project, raw[key], report, f"authorities.{key}")
    for key in optional:
        paths[key] = resolve_project_path(
            project,
            raw.get(key),
            report,
            f"authorities.{key}",
            allow_null=True,
        )

    unknown = sorted(set(raw) - set(required) - set(optional))
    if unknown:
        report.warn("unknown-authority", f"未识别的 authority 字段：{', '.join(unknown)}")
    return paths


def validate_timing(
    project: Path,
    contract: dict[str, Any],
    authorities: dict[str, Path | None],
    report: Report,
) -> None:
    timing = contract.get("timing")
    if not isinstance(timing, dict):
        report.error("invalid-timing", "timing 必须是对象")
        return

    authority = timing.get("authority")
    state = timing.get("state")
    if authority not in TIMING_AUTHORITIES:
        report.error("invalid-timing-authority", f"timing.authority 必须是 {' | '.join(TIMING_AUTHORITIES)}")
    if state not in TIMING_STATES:
        report.error("invalid-timing-state", f"timing.state 必须是 {' | '.join(TIMING_STATES)}")

    source = timing.get("source")
    if state == "locked":
        resolve_project_path(project, source, report, "timing.source")
    elif source is not None:
        resolve_project_path(project, source, report, "timing.source")

    if authority == "voice" and state == "locked":
        if authorities.get("script") is None:
            report.error("voice-without-script", "voice locked 时 authorities.script 必须存在")
        if authorities.get("audioTiming") is None:
            report.error("voice-without-audio-timing", "voice locked 时 authorities.audioTiming 必须存在")


def validate_cues(
    project: Path,
    contract: dict[str, Any],
    scenes: dict[str, dict[str, Any]],
    report: Report,
) -> set[str]:
    raw = contract.get("cues")
    if not isinstance(raw, list):
        report.error("invalid-cues", "cues 必须是数组")
        return set()

    cue_ids: set[str] = set()
    cue_scenes: dict[str, str] = {}
    for index, cue in enumerate(raw):
        label = f"cues[{index}]"
        if not isinstance(cue, dict):
            report.error("invalid-cue", f"{label} 必须是对象")
            continue
        cue_id = cue.get("id")
        if not isinstance(cue_id, str) or not ID_RE.fullmatch(cue_id):
            report.error("invalid-cue-id", f"{label}.id 非法：{cue_id!r}")
            continue
        if cue_id in cue_ids:
            report.error("duplicate-cue", f"cue id 重复：{cue_id}")
        cue_ids.add(cue_id)

        scene = cue.get("scene")
        if scene not in scenes:
            report.error("unknown-cue-scene", f"cue {cue_id} 引用了未知 scene：{scene!r}")
        elif isinstance(scene, str):
            cue_scenes[cue_id] = scene

        validate_source_ref(project, cue.get("sourceRef"), report, f"cue {cue_id}.sourceRef")
        targets = cue.get("targets")
        if not isinstance(targets, list) or not targets:
            report.error("invalid-cue-targets", f"cue {cue_id}.targets 必须是非空数组")
        else:
            for target in targets:
                if not isinstance(target, str) or not TARGET_RE.fullmatch(target):
                    report.error(
                        "invalid-cue-target",
                        f"cue {cue_id} target 只允许 caption:/motion:/cut:：{target!r}",
                    )

    for scene_id, scene in scenes.items():
        for cue_id in scene["wise_cue_ids"]:
            if cue_id not in cue_ids:
                report.error("unknown-storyboard-cue", f"scene {scene_id} 引用了未知 cue：{cue_id}")
            elif cue_scenes.get(cue_id) != scene_id:
                report.error(
                    "cue-scene-mismatch",
                    f"scene {scene_id} 引用了属于 {cue_scenes.get(cue_id)!r} 的 cue：{cue_id}",
                )
    return cue_ids


def validate_asset_locks(
    project: Path, contract: dict[str, Any], report: Report
) -> dict[str, dict[str, Any]]:
    raw = contract.get("assetLocks")
    if not isinstance(raw, list):
        report.error("invalid-asset-locks", "assetLocks 必须是数组")
        return {}

    assets: dict[str, dict[str, Any]] = {}
    for index, item in enumerate(raw):
        label = f"assetLocks[{index}]"
        if not isinstance(item, dict):
            report.error("invalid-asset-lock", f"{label} 必须是对象")
            continue
        raw_path = item.get("path")
        resolved = resolve_project_path(project, raw_path, report, f"{label}.path")
        if not isinstance(raw_path, str):
            continue
        if raw_path in assets:
            report.error("duplicate-asset-lock", f"asset lock 路径重复：{raw_path}")
        assets[raw_path] = item

        asset_class = item.get("class")
        locked = item.get("locked")
        digest = item.get("sha256")
        if asset_class not in ("content", "style"):
            report.error("invalid-asset-class", f"{label}.class 必须是 content 或 style")
        if not isinstance(locked, bool):
            report.error("invalid-asset-locked", f"{label}.locked 必须是布尔值")
        if asset_class == "content" and locked is not True:
            report.error("unlocked-content", f"内容资产必须锁定：{raw_path}")
        if not isinstance(digest, str) or not SHA256_RE.fullmatch(digest):
            report.error("invalid-asset-sha", f"{label}.sha256 必须是小写 SHA-256")
            continue
        if resolved is not None and resolved.is_file():
            actual = sha256_file(resolved)
            if actual != digest:
                message = f"资产哈希变化：{raw_path}，合同 {digest}，实际 {actual}"
                if locked is True:
                    report.error("locked-asset-changed", message)
                else:
                    report.warn("unlocked-style-changed", message)
    return assets


def validate_continuity(
    contract: dict[str, Any],
    scenes: dict[str, dict[str, Any]],
    report: Report,
) -> set[str]:
    raw = contract.get("continuity")
    if not isinstance(raw, list):
        report.error("invalid-continuity", "continuity 必须是数组")
        return set()

    object_ids: set[str] = set()
    declared_scenes: dict[str, set[str]] = {}
    for index, item in enumerate(raw):
        label = f"continuity[{index}]"
        if not isinstance(item, dict):
            report.error("invalid-continuity-item", f"{label} 必须是对象")
            continue
        object_id = item.get("id")
        if not isinstance(object_id, str) or not ID_RE.fullmatch(object_id):
            report.error("invalid-object-id", f"{label}.id 非法：{object_id!r}")
            continue
        if object_id in object_ids:
            report.error("duplicate-object", f"continuity id 重复：{object_id}")
        object_ids.add(object_id)

        mode = item.get("mode")
        scene_ids = item.get("scenes")
        invariants = item.get("invariants")
        if mode not in CONTINUITY_MODES:
            report.error("invalid-continuity-mode", f"{label}.mode 非法：{mode!r}")
        if not isinstance(scene_ids, list) or not scene_ids:
            report.error("invalid-continuity-scenes", f"{label}.scenes 必须是非空数组")
            scene_ids = []
        if len(scene_ids) != len(set(scene_ids)):
            report.error("duplicate-continuity-scene", f"{label}.scenes 含重复 scene")
        valid_scene_ids: set[str] = set()
        for scene_id in scene_ids:
            if not isinstance(scene_id, str) or scene_id not in scenes:
                report.error("unknown-object-scene", f"对象 {object_id} 引用了未知 scene：{scene_id!r}")
            else:
                valid_scene_ids.add(scene_id)
        declared_scenes[object_id] = valid_scene_ids

        if not isinstance(invariants, list) or any(not isinstance(value, str) or not value for value in invariants):
            report.error("invalid-invariants", f"{label}.invariants 必须是字符串数组")
            invariants = []
        if mode in ("persistent", "pixel-lock"):
            if len(scene_ids) < 2:
                report.error("missing-handoff", f"{mode} 对象 {object_id} 至少需要两个 scene")
            if not invariants:
                report.error("missing-handoff-invariants", f"{mode} 对象 {object_id} 缺少 handoff invariants")
        if mode == "pixel-lock":
            missing = sorted({"x", "y", "scale", "rotation"} - set(invariants))
            if missing:
                report.error(
                    "incomplete-pixel-lock",
                    f"pixel-lock 对象 {object_id} 缺少不变量：{', '.join(missing)}",
                )

    for scene_id, scene in scenes.items():
        for object_id in scene["wise_object_ids"]:
            if object_id not in object_ids:
                report.error("unknown-storyboard-object", f"scene {scene_id} 引用了未知对象：{object_id}")
            elif scene_id not in declared_scenes.get(object_id, set()):
                report.error(
                    "object-scene-mismatch",
                    f"scene {scene_id} 使用对象 {object_id}，但 continuity.scenes 未声明",
                )
    for object_id, scene_ids in declared_scenes.items():
        for scene_id in scene_ids:
            if object_id not in scenes[scene_id]["wise_object_ids"]:
                report.error(
                    "missing-storyboard-object",
                    f"continuity 对象 {object_id} 声明了 scene {scene_id}，Storyboard 未引用它",
                )
    return object_ids


def parse_baseline_ref(raw: Any) -> tuple[str, str, str | None] | None:
    if not isinstance(raw, str):
        return None
    git_match = re.fullmatch(r"git:([0-9a-f]{7,64})", raw)
    if git_match:
        return ("git", git_match.group(1), None)
    file_match = re.fullmatch(r"file:(.+)#sha256:([0-9a-f]{64})", raw)
    if file_match:
        return ("file", file_match.group(1), file_match.group(2))
    return None


def validate_baseline(
    project: Path, contract: dict[str, Any], report: Report
) -> Path | None:
    baseline = contract.get("baseline")
    if not isinstance(baseline, dict):
        report.error("invalid-baseline", "baseline 必须是对象")
        return None
    if baseline.get("protected") is not True:
        report.error("baseline-not-protected", "baseline.protected 必须为 true")

    parsed = parse_baseline_ref(baseline.get("ref"))
    if parsed is None:
        report.error(
            "invalid-baseline-ref",
            "baseline.ref 必须是 git:<sha> 或 file:<path>#sha256:<digest>",
        )
        return None
    kind, value, embedded_digest = parsed
    contract_digest = baseline.get("sha256")

    if kind == "git":
        if contract_digest not in (None, "") and not (
            isinstance(contract_digest, str) and SHA256_RE.fullmatch(contract_digest)
        ):
            report.error("invalid-baseline-sha", "git 基线的 sha256 必须为空或合法 SHA-256")
        result = subprocess.run(
            ["git", "-C", str(project), "cat-file", "-e", f"{value}^{{commit}}"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        if result.returncode != 0:
            report.error("missing-git-baseline", f"git 基线提交不可解析：{value}")
        return None

    if contract_digest != embedded_digest:
        report.error("baseline-sha-disagrees", "baseline.sha256 与 ref 内嵌 digest 不一致")
    path = resolve_project_path(project, value, report, "baseline file")
    if path is not None and path.is_file():
        actual = sha256_file(path)
        if actual != embedded_digest:
            report.error(
                "baseline-changed",
                f"受保护基线哈希变化：{value}，合同 {embedded_digest}，实际 {actual}",
            )
    return path


def validate_variants(
    project: Path,
    contract: dict[str, Any],
    scenes: dict[str, dict[str, Any]],
    cue_ids: set[str],
    assets: dict[str, dict[str, Any]],
    baseline_path: Path | None,
    report: Report,
) -> None:
    variants = contract.get("variants")
    if not isinstance(variants, dict):
        report.error("invalid-variants", "variants 必须是对象")
        return

    default = variants.get("default")
    active = variants.get("active")
    restore = variants.get("restoreDefaultAfterBuild")
    items = variants.get("items")
    if not isinstance(restore, bool):
        report.error("invalid-restore-default", "variants.restoreDefaultAfterBuild 必须是布尔值")
    if not isinstance(items, list) or not items:
        report.error("invalid-variant-items", "variants.items 必须是非空数组")
        return

    ids: set[str] = set()
    outputs: dict[Path, str] = {}
    locked_asset_paths = {
        (project / raw_path).resolve(strict=False)
        for raw_path, item in assets.items()
        if item.get("locked") is True
    }
    for index, item in enumerate(items):
        label = f"variants.items[{index}]"
        if not isinstance(item, dict):
            report.error("invalid-variant", f"{label} 必须是对象")
            continue
        variant_id = item.get("id")
        if not isinstance(variant_id, str) or not ID_RE.fullmatch(variant_id):
            report.error("invalid-variant-id", f"{label}.id 非法：{variant_id!r}")
            continue
        if variant_id in ids:
            report.error("duplicate-variant", f"variant id 重复：{variant_id}")
        ids.add(variant_id)

        output = resolve_project_path(
            project,
            item.get("output"),
            report,
            f"variant {variant_id}.output",
            must_exist=False,
        )
        if output is not None:
            if output.exists() and not output.is_file():
                report.error("invalid-variant-output", f"variant {variant_id}.output 指向了目录")
            if output in outputs:
                report.error(
                    "duplicate-variant-output",
                    f"variants {outputs[output]} 与 {variant_id} 使用同一输出路径",
                )
            outputs[output] = variant_id
            if baseline_path is not None and output == baseline_path:
                report.error("baseline-overwrite", f"variant {variant_id} 会覆盖受保护基线")
            if output in locked_asset_paths:
                report.error("locked-asset-overwrite", f"variant {variant_id} 会覆盖 locked asset")

        allowed = item.get("allowedDiffs")
        if not isinstance(allowed, list):
            report.error("invalid-allowed-diffs", f"variant {variant_id}.allowedDiffs 必须是数组")
            continue
        if len(allowed) != len(set(value for value in allowed if isinstance(value, str))):
            report.error("duplicate-allowed-diff", f"variant {variant_id}.allowedDiffs 含重复选择器")
        if variant_id == default and allowed:
            report.error("default-has-diffs", "默认变体的 allowedDiffs 必须为空")
        for selector in allowed:
            if not isinstance(selector, str):
                report.error("invalid-diff-selector", f"variant {variant_id} 选择器必须是字符串")
                continue
            match = SELECTOR_RE.fullmatch(selector)
            if not match:
                report.error("invalid-diff-selector", f"variant {variant_id} 非法选择器：{selector}")
                continue
            kind, value = match.groups()
            if kind == "scene" and value not in scenes:
                report.error("unknown-diff-scene", f"variant {variant_id} 引用了未知 scene：{value}")
            elif kind == "cue" and value not in cue_ids:
                report.error("unknown-diff-cue", f"variant {variant_id} 引用了未知 cue：{value}")
            elif kind == "asset":
                if value not in assets:
                    report.error("unknown-diff-asset", f"variant {variant_id} 引用了未登记 asset：{value}")
                elif assets[value].get("class") == "content" and assets[value].get("locked") is True:
                    report.error(
                        "content-variant-overreach",
                        f"variant {variant_id} 不得修改 locked content asset：{value}",
                    )

    if default not in ids:
        report.error("unknown-default-variant", f"variants.default 不存在：{default!r}")
    if active not in ids:
        report.error("unknown-active-variant", f"variants.active 不存在：{active!r}")
    if report.level == "delivery" and restore is True and active != default:
        report.error("default-not-restored", f"delivery 前必须恢复默认变体：active={active!r}, default={default!r}")


def validate_review(contract: dict[str, Any], report: Report) -> None:
    review = contract.get("review")
    if not isinstance(review, dict):
        report.error("invalid-review", "review 必须是对象")
        return
    status = review.get("previewStatus")
    authorized = review.get("renderAuthorized")
    if status not in REVIEW_STATES:
        report.error("invalid-preview-status", f"review.previewStatus 必须是 {' | '.join(REVIEW_STATES)}")
    if not isinstance(authorized, bool):
        report.error("invalid-render-authorization", "review.renderAuthorized 必须是布尔值")
    if status == "skipped":
        report.warn("preview-skipped", "预览被显式跳过；应在 BRIEF.md Notes 留下用户指令")
    if report.level == "delivery":
        if status not in ("approved", "skipped"):
            report.error("preview-not-approved", "delivery 前预览必须 approved 或由用户明确 skipped")
        if authorized is not True:
            report.error("render-not-authorized", "delivery 前 review.renderAuthorized 必须为 true")


def validate_motion_intent(
    scenes: dict[str, dict[str, Any]], contract: dict[str, Any], report: Report
) -> None:
    if report.level == "contract":
        return
    referenced: set[str] = set()
    raw_cues = contract.get("cues")
    for cue in raw_cues if isinstance(raw_cues, list) else []:
        if isinstance(cue, dict) and isinstance(cue.get("scene"), str):
            referenced.add(cue["scene"])
    raw_continuity = contract.get("continuity")
    for item in raw_continuity if isinstance(raw_continuity, list) else []:
        if isinstance(item, dict) and isinstance(item.get("scenes"), list):
            referenced.update(value for value in item["scenes"] if isinstance(value, str))
    raw_variants = contract.get("variants")
    variant_items = raw_variants.get("items") if isinstance(raw_variants, dict) else []
    for variant in variant_items if isinstance(variant_items, list) else []:
        if not isinstance(variant, dict):
            continue
        for selector in variant.get("allowedDiffs", []):
            if isinstance(selector, str) and selector.startswith("scene:"):
                referenced.add(selector.removeprefix("scene:"))
    for scene_id in sorted(referenced):
        scene = scenes.get(scene_id)
        if scene is not None and not scene.get("motion_intent"):
            report.error("missing-motion-intent", f"被引用 scene {scene_id} 缺少 motion_intent")


def validate_contract(project: Path, level: str) -> Report:
    report = Report(project=project, level=level)
    contract_path = project / CONTRACT_NAME
    document = load_json(contract_path, report, "Wise video contract")
    if not isinstance(document, dict):
        if document is not None:
            report.error("invalid-contract", "wise-video.json 根必须是对象")
        return report

    expected_roots = {
        "schemaVersion",
        "authorities",
        "timing",
        "cues",
        "assetLocks",
        "continuity",
        "baseline",
        "variants",
        "review",
    }
    missing_roots = sorted(expected_roots - set(document))
    for key in missing_roots:
        report.error("missing-root-field", f"wise-video.json 缺少根字段：{key}")
    unknown_roots = sorted(set(document) - expected_roots)
    if unknown_roots:
        report.warn("unknown-root-field", f"未识别的根字段：{', '.join(unknown_roots)}")
    if document.get("schemaVersion") != SCHEMA_VERSION:
        report.error("unsupported-schema", f"schemaVersion 必须为 {SCHEMA_VERSION}")

    authorities = validate_authorities(project, document, report)
    validate_timing(project, document, authorities, report)
    storyboard = authorities.get("storyboard")
    scenes = parse_storyboard(storyboard, report) if storyboard is not None and storyboard.is_file() else {}
    cue_ids = validate_cues(project, document, scenes, report)
    assets = validate_asset_locks(project, document, report)
    validate_continuity(document, scenes, report)
    baseline_path = validate_baseline(project, document, report)
    validate_variants(project, document, scenes, cue_ids, assets, baseline_path, report)
    validate_review(document, report)
    validate_motion_intent(scenes, document, report)
    return report


def report_payload(report: Report) -> dict[str, Any]:
    return {
        "ok": report.ok,
        "project": str(report.project.resolve()),
        "level": report.level,
        "legacy": report.legacy,
        "errors": report.errors,
        "warnings": report.warnings,
    }


def print_report(report: Report, as_json: bool) -> None:
    if as_json:
        print(json.dumps(report_payload(report), ensure_ascii=False, indent=2))
        return
    state = "PASS" if report.ok else "FAIL"
    suffix = "（legacy 有限只读检查）" if report.legacy else ""
    print(f"{state} {report.level}: {report.project.resolve()}{suffix}")
    for warning in report.warnings:
        print(f"WARN  {warning}")
    for error in report.errors:
        print(f"ERROR {error}")


def find_first_file(project: Path, candidates: tuple[str, ...]) -> str | None:
    for candidate in candidates:
        if (project / candidate).is_file():
            return candidate
    return None


def init_document(project: Path, authority: str, baseline_ref: str, report: Report) -> dict[str, Any] | None:
    template_path = Path(__file__).resolve().parent.parent / "assets" / "wise-video.json"
    template = load_json(template_path, report, "Wise video contract template")
    if not isinstance(template, dict):
        return None

    parsed = parse_baseline_ref(baseline_ref)
    if parsed is None:
        report.error("invalid-baseline-ref", "--baseline-ref 必须是 git:<sha> 或 file:<path>#sha256:<digest>")
        return None
    kind, _, digest = parsed
    template["baseline"]["ref"] = baseline_ref
    template["baseline"]["sha256"] = digest if kind == "file" else None
    validate_baseline(project, template, report)

    template["authorities"]["script"] = find_first_file(project, ("SCRIPT.md", "script.md"))
    template["authorities"]["audioTiming"] = find_first_file(
        project,
        ("audio_meta.json", "audio/audio_meta.json", "timing.json", "audio/timing.json"),
    )
    template["timing"]["authority"] = authority
    source_candidates = {
        "voice": ("audio/voiceover.mp3", "voiceover.mp3", "audio/voice.mp3", "voice.mp3"),
        "music": ("audio/music.mp3", "music.mp3", "audio/bgm.mp3", "bgm.mp3"),
        "visual": ("index.html",),
    }
    template["timing"]["source"] = find_first_file(project, source_candidates[authority])
    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "-", project.name).strip("-") or "wise-video"
    template["variants"]["items"][0]["output"] = f"delivery/{safe_name}-final.mp4"
    return template


def command_init(args: argparse.Namespace) -> int:
    project = Path(args.project).expanduser().resolve()
    if not project.is_dir():
        print(f"参数错误：项目目录不存在：{project}", file=sys.stderr)
        return 2
    if not (project / "BRIEF.md").is_file():
        print(f"FAIL init: {project}\nERROR [missing-brief] 初始化前必须已有 BRIEF.md")
        return 1
    target = project / CONTRACT_NAME
    if target.exists():
        print(f"FAIL init: {project}\nERROR [contract-exists] 拒绝覆盖现有 {target}")
        return 1

    report = Report(project=project, level="init")
    document = init_document(project, args.timing_authority, args.baseline_ref, report)
    if document is None or not report.ok:
        print_report(report, as_json=False)
        return 1
    rendered = json.dumps(document, ensure_ascii=False, indent=2) + "\n"
    if args.write:
        try:
            with target.open("x", encoding="utf-8") as handle:
                handle.write(rendered)
        except FileExistsError:
            print(f"FAIL init: {project}\nERROR [contract-exists] 拒绝覆盖现有 {target}")
            return 1
        print(f"PASS init --write: {target}")
    else:
        print(f"DRY-RUN init: 将创建 {target}；加 --write 才会写入")
        print(rendered, end="")
    return 0


def command_validate(args: argparse.Namespace) -> int:
    project = Path(args.project).expanduser().resolve()
    if not project.is_dir():
        print(f"参数错误：项目目录不存在：{project}", file=sys.stderr)
        return 2
    contract_path = project / CONTRACT_NAME
    if not contract_path.is_file() and args.legacy_ok:
        report = Report(project=project, level=args.level, legacy=True)
        report.warn(
            "legacy-limited",
            "未发现 wise-video.json；仅确认目录可读，未验证时间权威、资产锁、基线或变体",
        )
        print_report(report, args.json)
        return 0
    report = validate_contract(project, args.level)
    print_report(report, args.json)
    return 0 if report.ok else 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    init_parser = subparsers.add_parser("init", help="dry-run 或创建新的 wise-video.json")
    init_parser.add_argument("--project", required=True, help="视频项目目录")
    init_parser.add_argument(
        "--timing-authority",
        required=True,
        choices=TIMING_AUTHORITIES,
        help="初始时间权威；状态始终为 draft",
    )
    init_parser.add_argument("--baseline-ref", required=True, help="git:<sha> 或 file:<path>#sha256:<digest>")
    init_parser.add_argument("--write", action="store_true", help="实际创建；默认只打印 dry-run")
    init_parser.set_defaults(handler=command_init)

    validate_parser = subparsers.add_parser("validate", help="只读验证 Wise video contract")
    validate_parser.add_argument("--project", required=True, help="视频项目目录")
    validate_parser.add_argument("--level", required=True, choices=LEVELS)
    validate_parser.add_argument("--json", action="store_true", help="输出机器可读 JSON")
    validate_parser.add_argument(
        "--legacy-ok",
        action="store_true",
        help="无合同时仅做有限只读检查；不创建或迁移任何文件",
    )
    validate_parser.set_defaults(handler=command_validate)
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return int(args.handler(args))


if __name__ == "__main__":
    raise SystemExit(main())
