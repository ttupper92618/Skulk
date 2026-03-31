from __future__ import annotations

import json
import os
from pathlib import Path

os.environ.setdefault("EXO_HOME", ".skulk-docs-home")

from exo.api.main import API
from exo.shared.types.common import NodeId
from exo.utils.channels import channel


def build_docs_api() -> API:
    command_sender, _ = channel()
    download_sender, _ = channel()
    _, event_receiver = channel()
    _, election_receiver = channel()

    return API(
        NodeId("docs-node"),
        port=52415,
        event_receiver=event_receiver,
        command_sender=command_sender,
        download_command_sender=download_sender,
        election_receiver=election_receiver,
        enable_event_log=False,
        mount_dashboard=False,
    )


def write_openapi(output_path: Path) -> None:
    api = build_docs_api()
    schema = api.app.openapi()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(schema, indent=2) + "\n")


def write_redoc_html(output_path: Path, openapi_json_path: str) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Skulk API Reference</title>
    <style>
      body {{
        margin: 0;
        padding: 0;
      }}
    </style>
  </head>
  <body>
    <redoc spec-url="{openapi_json_path}"></redoc>
    <script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script>
  </body>
</html>
""",
    )


def main() -> None:
    docs_root = Path("docs/generated")
    openapi_path = docs_root / "openapi.json"
    api_html_path = docs_root / "api" / "index.html"

    write_openapi(openapi_path)
    write_redoc_html(api_html_path, "../openapi.json")


if __name__ == "__main__":
    main()
