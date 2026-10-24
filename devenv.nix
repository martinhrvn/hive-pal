{ pkgs, inputs, ... }:

let
  pkgs-playwright =
    import inputs.nixpkgs-playwright { system = pkgs.stdenv.system; };
  # No config runs WebKit, and its build at this pin fails (libmanette missing).
  playwright-browsers =
    pkgs-playwright.playwright-driver.browsers.override { withWebkit = false; };
  # The main nixpkgs pin builds piper's torch and onnxruntime with CUDA,
  # which fails; this nixos-unstable pin has a plain, cached piper-tts 1.8.
  pkgs-piper = import inputs.nixpkgs-piper { system = pkgs.stdenv.system; };
in {
  packages = with pkgs; [
    nodejs_22
    pnpm_9
    playwright-browsers
    openssl
    prisma
    go-task
    gh
    prisma-engines
    # Local voiceover for the living guides (GUIDE_VOICE=piper).
    pkgs-piper.piper-tts
    # Cuts a whole-guide voiceover take into lines (pnpm guides:take).
    pkgs-piper.whisper-cpp
  ];

  env = {
    # Keep nixpkgs-playwright pinned to the same Playwright version as the
    # `playwright` catalog in pnpm-workspace.yaml, otherwise the browsers here
    # do not match the revision @playwright/test expects.
    PLAYWRIGHT_BROWSERS_PATH = "${playwright-browsers}";
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = true;
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
    PRISMA_SCHEMA_ENGINE_BINARY = "${pkgs.prisma-engines}/bin/schema-engine";
    PRISMA_QUERY_ENGINE_BINARY = "${pkgs.prisma-engines}/bin/query-engine";
    PRISMA_QUERY_ENGINE_LIBRARY =
      "${pkgs.prisma-engines}/lib/libquery_engine.node";
    PRISMA_FMT_BINARY = "${pkgs.prisma-engines}/bin/prisma-fmt";
  };

  scripts = {
    # Trigger the E2E Smoke workflow against a deployed preview.
    #   smoke-run 243            -> https://243.preview.hivepal.app
    #   smoke-run main           -> https://preview.hivepal.app
    #   smoke-run https://host   -> any origin
    # Options: --grep '<regex>' (default @journey|@core), --workers N, --watch
    smoke-run.exec = ''
      set -euo pipefail
      target=""; grep_expr="@journey|@core"; workers=2; watch=0
      while [ $# -gt 0 ]; do
        case "$1" in
          --grep) grep_expr="$2"; shift 2 ;;
          --workers) workers="$2"; shift 2 ;;
          --watch) watch=1; shift ;;
          -h|--help)
            echo "usage: smoke-run <pr-number|main|url> [--grep REGEX] [--workers N] [--watch]"; exit 0 ;;
          *) target="$1"; shift ;;
        esac
      done
      [ -n "$target" ] || { echo "usage: smoke-run <pr-number|main|url> [--grep REGEX] [--workers N] [--watch]" >&2; exit 2; }
      case "$target" in
        main) base_url="https://preview.hivepal.app" ;;
        http*) base_url="$target" ;;
        *) base_url="https://$target.preview.hivepal.app" ;;
      esac
      # workflow_dispatch needs the workflow file on the ref it runs from.
      ref="$(git branch --show-current)"
      echo "Dispatching e2e-smoke.yml on $ref against $base_url (grep: $grep_expr, workers: $workers)"
      gh workflow run e2e-smoke.yml --ref "$ref" \
        -f "base_url=$base_url" -f "grep=$grep_expr" -f "workers=$workers"
      if [ "$watch" = 1 ]; then
        echo "Waiting for the run to appear..."
        run_id=""
        for _ in $(seq 1 20); do
          sleep 3
          run_id="$(gh run list --workflow e2e-smoke.yml --branch "$ref" --event workflow_dispatch \
            --limit 1 --json databaseId,status --jq '.[0] | select(.status != "completed") | .databaseId' || true)"
          [ -n "$run_id" ] && break
        done
        [ -n "$run_id" ] || { echo "Could not find the dispatched run; see: gh run list --workflow e2e-smoke.yml" >&2; exit 1; }
        gh run watch "$run_id" --exit-status || status=$?
        echo "Report: smoke-report $run_id"
        exit "''${status:-0}"
      fi
      echo "Follow it with: gh run list --workflow e2e-smoke.yml   or   smoke-run ... --watch"
    '';

    # Download the Playwright report (with traces) of an E2E Smoke run and open it.
    #   smoke-report            -> latest run
    #   smoke-report <run-id>   -> that run
    smoke-report.exec = ''
      set -euo pipefail
      run_id="''${1:-}"
      if [ -z "$run_id" ]; then
        run_id="$(gh run list --workflow e2e-smoke.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
      fi
      dir="''${TMPDIR:-/tmp}/hive-pal-smoke-report-$run_id"
      rm -rf "$dir"; mkdir -p "$dir"
      echo "Downloading artifacts of run $run_id to $dir"
      gh run download "$run_id" --dir "$dir"
      report="$(find "$dir" -maxdepth 1 -type d -name 'e2e-smoke-playwright-report-*' | head -1)"
      [ -n "$report" ] || { echo "No playwright-report artifact in run $run_id" >&2; exit 1; }
      echo "Traces (failures only): $(find "$dir" -name 'trace.zip' | wc -l) found under $dir"
      echo "Opening the HTML report; click a failed test and then 'Trace' to open the trace viewer."
      cd "$(git rev-parse --show-toplevel)/apps/e2e" && pnpm exec playwright show-report "$report"
    '';

    # Download a Piper voice for the guides into ~/.cache/hive-pal/piper.
    #   piper-voice en_US-ryan-high     (previews: https://rhasspy.github.io/piper-samples/)
    # Then: GUIDE_VOICE=piper PIPER_MODEL=~/.cache/hive-pal/piper/en_US-ryan-high.onnx
    piper-voice.exec = ''
      set -euo pipefail
      name="''${1:?usage: piper-voice <name>, e.g. en_US-ryan-high}"
      IFS=- read -r locale speaker quality <<< "$name"
      dir="''${XDG_CACHE_HOME:-$HOME/.cache}/hive-pal/piper"
      url="https://huggingface.co/rhasspy/piper-voices/resolve/main/''${locale%%_*}/$locale/$speaker/$quality/$name"
      mkdir -p "$dir"
      for ext in onnx onnx.json; do
        [ -f "$dir/$name.$ext" ] || curl -fL --progress-bar -o "$dir/$name.$ext" "$url.$ext"
      done
      echo "PIPER_MODEL=$dir/$name.onnx"
    '';

    # Run the smoke suite locally against the pnpm dev stack (http://localhost:5173).
    # Extra args go to playwright, e.g.: smoke-local --grep @core   smoke-local tests/smoke/journey.spec.ts
    smoke-local.exec = ''
      set -euo pipefail
      # A host LD_LIBRARY_PATH (seen on NixOS) breaks the Nix-provided Chromium.
      unset LD_LIBRARY_PATH
      cd "$(git rev-parse --show-toplevel)/apps/e2e"
      BASE_URL="''${BASE_URL:-http://localhost:5173}" pnpm exec playwright test -c playwright.smoke.config.ts "$@"
    '';
  };

  processes = { dev.exec = "pnpm dev"; };

  enterShell = ''
    export PATH="$PWD/node_modules/.bin:$PATH"
    echo "Node.js $(node --version) and PNPM $(pnpm --version) environment activated"
  '';
}
