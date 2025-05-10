{ pkgs, ... }: {
  packages = with pkgs; [
    nodejs_22
    pnpm_9
    turbo
    playwright-driver.browsers
    openssl
    prisma
    go-task
    prisma-engines
  ];

  env = {
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
    PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers}";
    PRISMA_SCHEMA_ENGINE_BINARY = "${pkgs.prisma-engines}/bin/schema-engine";
    PRISMA_QUERY_ENGINE_BINARY = "${pkgs.prisma-engines}/bin/query-engine";
    PRISMA_QUERY_ENGINE_LIBRARY = "${pkgs.prisma-engines}/lib/libquery_engine.node";
    PRISMA_FMT_BINARY = "${pkgs.prisma-engines}/bin/prisma-fmt";
  };

  processes = {
    dev.exec = "pnpm dev";
  };

  tasks = {
    e2e.exec = "turbo test:e2e";
  };

  enterShell = ''
    echo "Node.js $(node --version) and PNPM $(pnpm --version) environment activated"
  '';
}