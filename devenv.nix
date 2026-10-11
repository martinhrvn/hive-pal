{ pkgs, inputs, ... }:

let
  pkgs-playwright =
    import inputs.nixpkgs-playwright { system = pkgs.stdenv.system; };
in {
  packages = with pkgs; [
    nodejs_22
    pnpm_9
    pkgs-playwright.playwright-driver.browsers
    pkgs-playwright.playwright-test
    openssl
    prisma
    go-task
    prisma-engines
  ];

  env = {
    # Keep nixpkgs-playwright pinned to the same Playwright version as the
    # `playwright` catalog in pnpm-workspace.yaml, otherwise the browsers here
    # do not match the revision @playwright/test expects.
    PLAYWRIGHT_BROWSERS_PATH = "${pkgs-playwright.playwright.browsers}";
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = true;
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
    PRISMA_SCHEMA_ENGINE_BINARY = "${pkgs.prisma-engines}/bin/schema-engine";
    PRISMA_QUERY_ENGINE_BINARY = "${pkgs.prisma-engines}/bin/query-engine";
    PRISMA_QUERY_ENGINE_LIBRARY =
      "${pkgs.prisma-engines}/lib/libquery_engine.node";
    PRISMA_FMT_BINARY = "${pkgs.prisma-engines}/bin/prisma-fmt";
  };

  processes = { dev.exec = "pnpm dev"; };

  enterShell = ''
    export PATH="$PWD/node_modules/.bin:$PATH"
    echo "Node.js $(node --version) and PNPM $(pnpm --version) environment activated"
  '';
}
