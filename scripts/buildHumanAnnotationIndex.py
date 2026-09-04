#!/usr/bin/env python3
"""Build the compact, browser-facing human annotation index."""

import argparse
import json
from collections import Counter
from pathlib import Path


def taxonomy_labels(axis):
    return [
        {"id": label["id"], "label": label["name"]}
        for group in axis.get("groups", [])
        for label in group.get("labels", [])
    ]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--annotations", required=True, type=Path)
    parser.add_argument("--taxonomy", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    taxonomy = json.loads(args.taxonomy.read_text(encoding="utf-8"))
    records = []
    for path in sorted(args.annotations.rglob("*.json")):
        record = json.loads(path.read_text(encoding="utf-8"))
        records.append({
            "row_index": record["row_index"],
            "crop_id": record["crop_id"],
            "review_status": record.get("review_status", ""),
            "disposition": record.get("disposition", ""),
            "subject_form_labels": record.get("subject_form_labels", []),
            "domain_labels": record.get("domain_labels", []),
            "quality_flags": record.get("quality_flags", []),
            "taxonomy_version": record.get("taxonomy_version", ""),
        })
    records.sort(key=lambda record: record["row_index"])

    subjects = Counter(label for record in records for label in record["subject_form_labels"])
    domains = Counter(label for record in records for label in record["domain_labels"])
    subject_labels = taxonomy_labels(taxonomy["axes"]["subject_form"])
    domain_labels = taxonomy_labels(taxonomy["axes"]["domain"])
    for label in subject_labels:
        label["count"] = subjects[label["id"]]
    for label in domain_labels:
        label["count"] = domains[label["id"]]

    output = {
        "schemaVersion": "human_annotation_archive_index_v1",
        "recordCount": len(records),
        "verifiedCount": sum(record["review_status"] == "verified" for record in records),
        "labels": {"subjectForm": subject_labels, "domain": domain_labels},
        "records": records,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {len(records):,} annotations to {args.output}")


if __name__ == "__main__":
    main()
