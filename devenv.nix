{ pkgs, inputs, ... }:

let
  pkgs-playwright =
    import inputs.nixpkgs-playwright { system = pkgs.stdenv.system; };
  browsers = (builtins.fromJSON (builtins.readFile
    "${pkgs-playwright.playwright-driver}/browsers.json")).browsers;
  chromium-rev = (builtins.head
    (builtins.filter (x: x.name == "chromium") browsers)).revision;
in {
  packages = with pkgs; [
    nodejs_22
    pnpm_9
    turbo
    pkgs-playwright.playwright-driver.browsers
    pkgs-playwright.playwright-test
    openssl
    prisma
    go-task
    prisma-engines
  ];

  env = {
    PLAYWRIGHT_BROWSERS_PATH = "${pkgs-playwright.playwright.browsers}";
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = true;
    PLAYWRIGHT_LAUNCH_OPTIONS_EXECUTABLE_PATH =
      "${pkgs-playwright.playwright.browsers}/chromium-${chromium-rev}/chrome-linux/chrome";
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH =
      "${pkgs-playwright.playwright.browsers}/chromium-${chromium-rev}/chrome-linux/chrome";
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
    PRISMA_SCHEMA_ENGINE_BINARY = "${pkgs.prisma-engines}/bin/schema-engine";
    PRISMA_QUERY_ENGINE_BINARY = "${pkgs.prisma-engines}/bin/query-engine";
    PRISMA_QUERY_ENGINE_LIBRARY =
      "${pkgs.prisma-engines}/lib/libquery_engine.node";
    PRISMA_FMT_BINARY = "${pkgs.prisma-engines}/bin/prisma-fmt";
  };

  processes = { dev.exec = "pnpm dev"; };

  tasks = { e2e.exec = "turbo test:e2e"; };

  enterShell = ''
    echo "Node.js $(node --version) and PNPM $(pnpm --version) environment activated"
  '';
}
