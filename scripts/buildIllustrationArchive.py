#!/usr/bin/env python3
"""Build compact web indexes for the DINO-1575 illustration archive."""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
from collections import defaultdict
from pathlib import Path

import numpy as np


SOURCE_LABELS = {
    "bodleian_new": "Bodleian Libraries",
    "gallica": "Bibliothèque nationale de France",
    "harvard_yenching": "Harvard-Yenching Library",
    "mdz": "Bavarian State Library",
    "ndl": "National Diet Library",
    "pul": "Princeton University Library",
    "rmda": "Kyoto University",
    "wellcome": "Wellcome Collection",
}

TIER_LABELS = {
    "candidate_high_0_80_plus": "High confidence (0.80–1.00)",
    "candidate_medium_0_30_to_0_80": "Medium confidence (0.30–0.80)",
    "candidate_low_0_19_to_0_30": "Low confidence (0.19–0.30)",
}

SOURCE_SET_LABELS = {
    "yolo_positive_retained": "Retained from YOLO-positive pages",
    "yolo_negative_audit": "Recovered from YOLO-negative audit pages",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--crop-manifest", required=True, type=Path)
    parser.add_argument("--books-catalogue", required=True, type=Path)
    parser.add_argument("--dinov2-umap", required=True, type=Path)
    parser.add_argument("--openclip-umap", required=True, type=Path)
    parser.add_argument("--dinov2-labels", required=True, type=Path)
    parser.add_argument("--openclip-labels", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    return parser.parse_args()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalise_umap(source: Path, destination: Path) -> dict[str, object]:
    coordinates = np.asarray(np.load(source), dtype=np.float32)
    if coordinates.ndim != 2 or coordinates.shape[1] != 2:
        raise ValueError(f"Expected an N×2 UMAP array: {source}")
    lower = np.percentile(coordinates, 0.5, axis=0)
    upper = np.percentile(coordinates, 99.5, axis=0)
    scale = np.maximum(upper - lower, 1e-9)
    normalised = np.clip((coordinates - lower) / scale, 0, 1).astype("<f4")
    normalised.tofile(destination)
    return {
        "record_count": int(coordinates.shape[0]),
        "dimensions": 2,
        "dtype": "float32 little-endian",
        "normalisation_percentiles": [0.5, 99.5],
        "source_min": coordinates.min(axis=0).tolist(),
        "source_max": coordinates.max(axis=0).tolist(),
        "display_lower": lower.tolist(),
        "display_upper": upper.tolist(),
    }


def write_labels(source: Path, destination: Path) -> dict[str, object]:
    labels = np.asarray(np.load(source), dtype="<i2")
    labels.tofile(destination)
    unique, counts = np.unique(labels, return_counts=True)
    return {
        "record_count": int(labels.shape[0]),
        "dtype": "int16 little-endian",
        "cluster_count": int(np.sum(unique >= 0)),
        "counts": {str(int(key)): int(value) for key, value in zip(unique, counts)},
    }


def main() -> int:
    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    book_catalogue = json.loads(args.books_catalogue.read_text(encoding="utf-8"))
    book_years = {
        f"{book['source']}\0{book['sourceItemId']}": book.get("year")
        for book in book_catalogue["books"]
    }

    facets: dict[str, dict[str, list[int]]] = {
        "source": defaultdict(list),
        "confidenceTier": defaultdict(list),
        "sourceSet": defaultdict(list),
        "century": defaultdict(list),
        "aspect": defaultdict(list),
        "book": defaultdict(list),
    }
    confidences: list[float] = []
    geometry_path = args.output_dir / "archive-geometry.bin"
    count = 0

    with args.crop_manifest.open(encoding="utf-8") as source, geometry_path.open("wb") as geometry:
        for line in source:
            if not line.strip():
                continue
            record = json.loads(line)
            row = int(record["row_index"])
            if row != count:
                raise ValueError(f"Crop manifest row order is not contiguous at {count}: found {row}")

            crop_bbox = [int(value) for value in record["crop_bbox_xyxy"]]
            detector_bbox = [float(value) for value in record["detector_bbox_xyxy"]]
            geometry.write(struct.pack(
                "<II4I4f",
                int(record["page_width"]),
                int(record["page_height"]),
                *crop_bbox,
                *detector_bbox,
            ))

            source_id = record["source"]
            tier = record["confidence_tier"]
            source_set = record["source_set"]
            book_key = f"{source_id}\0{record['item_id']}"
            year = book_years.get(book_key)
            century = "unknown" if year is None else f"{(int(year) // 100) * 100}"
            width = max(1, crop_bbox[2] - crop_bbox[0])
            height = max(1, crop_bbox[3] - crop_bbox[1])
            ratio = width / height
            aspect = "portrait" if ratio < 0.8 else "landscape" if ratio > 1.25 else "square"

            facets["source"][source_id].append(row)
            facets["confidenceTier"][tier].append(row)
            facets["sourceSet"][source_set].append(row)
            facets["century"][century].append(row)
            facets["aspect"][aspect].append(row)
            facets["book"][book_key].append(row)
            confidences.append(float(record["confidence"]))
            count += 1

    confidence_values = np.asarray(confidences, dtype=np.float32)
    histogram_counts, histogram_edges = np.histogram(confidence_values, bins=np.linspace(0.19, 1.0, 18))

    asset_metadata = {}
    for model, umap_source, labels_source in (
        ("dinov2", args.dinov2_umap, args.dinov2_labels),
        ("openclip", args.openclip_umap, args.openclip_labels),
    ):
        coordinate_path = args.output_dir / f"umap-{model}.f32"
        label_path = args.output_dir / f"clusters-{model}.i16"
        coordinate_meta = normalise_umap(umap_source, coordinate_path)
        label_meta = write_labels(labels_source, label_path)
        if coordinate_meta["record_count"] != count or label_meta["record_count"] != count:
            raise ValueError(f"{model} array length does not match the crop manifest")
        asset_metadata[model] = {
            "coordinates": {"url": coordinate_path.name, **coordinate_meta},
            "clusters": {"url": label_path.name, **label_meta},
        }

    def facet_entries(name: str, labels: dict[str, str] | None = None) -> list[dict[str, object]]:
        return [
            {
                "id": key,
                "label": (labels or {}).get(key, "Date not recorded" if key == "unknown" else key),
                "count": len(rows),
                "rows": rows,
            }
            for key, rows in facets[name].items()
        ]

    index = {
        "schemaVersion": "dino1575_illustration_archive_v1",
        "runId": "20260829T190102Z_dino1575",
        "cropCount": count,
        "bookCount": book_catalogue["bookCount"],
        "rowsPerShard": 500,
        "azureDataPrefix": "derived/illustration_similarity/dino1575/20260829T190102Z_dino1575/v1/annotation_web_data",
        "geometry": {
            "url": geometry_path.name,
            "recordBytes": 40,
            "layout": "uint32 page_width,page_height,crop_x1,crop_y1,crop_x2,crop_y2; float32 detector_x1,detector_y1,detector_x2,detector_y2",
        },
        "confidenceHistogram": {
            "edges": histogram_edges.tolist(),
            "counts": histogram_counts.astype(int).tolist(),
        },
        "facets": {
            "sources": facet_entries("source", SOURCE_LABELS),
            "confidenceTiers": facet_entries("confidenceTier", TIER_LABELS),
            "sourceSets": facet_entries("sourceSet", SOURCE_SET_LABELS),
            "centuries": facet_entries("century"),
            "aspects": facet_entries("aspect", {
                "portrait": "Portrait crops",
                "square": "Near-square crops",
                "landscape": "Landscape crops",
            }),
        },
        "bookRows": dict(facets["book"]),
        "embeddingMaps": asset_metadata,
    }

    index_path = args.output_dir / "archive-index.json"
    index_path.write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

    files = {}
    for output in sorted(args.output_dir.iterdir()):
        if output.is_file() and output.name != "archive-build-summary.json":
            files[output.name] = {"bytes": output.stat().st_size, "sha256": sha256(output)}
    manifest = {
        "status": "completed",
        "schemaVersion": index["schemaVersion"],
        "cropCount": count,
        "bookCount": book_catalogue["bookCount"],
        "files": files,
    }
    (args.output_dir / "archive-build-summary.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
