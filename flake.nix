{
  description = "Development environment with Node.js 22 and PNPM 9";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    playwright.url = "github:pietdevries94/playwright-web-flake/1.50.1";
  };
  outputs = { self, nixpkgs, flake-utils, playwright }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlay = final: prev: {
          inherit (playwright.packages.${system})
            playwright-test playwright-driver;
        };
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ overlay ];
        };
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            pnpm_9
            turbo
            go-task
            docker
            playwright-driver.browsers
            openssl
            prisma
            prisma-engines
          ];
          shellHook = ''
            export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
            export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers}"
            echo "Node.js $(node --version) and PNPM $(pnpm --version) environment activated"
            export PRISMA_SCHEMA_ENGINE_BINARY="${pkgs.prisma-engines}/bin/schema-engine"
            export PRISMA_QUERY_ENGINE_BINARY="${pkgs.prisma-engines}/bin/query-engine"
            export PRISMA_QUERY_ENGINE_LIBRARY="${pkgs.prisma-engines}/lib/libquery_engine.node"
            export PRISMA_FMT_BINARY="${pkgs.prisma-engines}/bin/prisma-fmt"
          '';
        };
      });
}
